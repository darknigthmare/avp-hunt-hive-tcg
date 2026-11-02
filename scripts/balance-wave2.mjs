#!/usr/bin/env node
/**
 * Balance QA for AVP TCG 1.2 : qualitative stress + reproducible match statistics.
 * No lore or image assertions, no absolute win-rate claim from this sample.
 * Usage: node scripts/balance-wave2.mjs --games-per-pair=2 --json
 */
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
const arg=process.argv.find(a=>a.startsWith('--games-per-pair='));
const count=arg?Number(arg.split('=')[1]):2;
if(!Number.isSafeInteger(count)||count<1||count>15)throw Error('games-per-pair must be 1..15');
const json=process.argv.includes('--json');
const ctx=createContext({window:{},Date,Math,Intl});
for(const name of ['data.js','expansion.js','expansion-wave2.js','engine.js']){
 const code=readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
 new Script(code,{filename:name}).runInContext(ctx,{timeout:6000});
}
const D=ctx.window.AVP_DATA,E=ctx.window.AVPEngine;
const names=['HUMAN','XENO','YAUTJA','ENGINEER','HYBRID'];
const statistics=Object.fromEntries(names.map(f=>[f,{played:0,wins:0,losses:0,draws:0,unfinished:0,halves:0,damageDealt:0}]));
const matchup={},problems=[];let games=0;
for(let a=0;a<names.length;a++)for(let b=0;b<names.length;b++)for(let n=0;n<count;n++){
 const fa=names[a],fb=names[b],seed=13001+a*3100+b*111+n*71;
 const choose=(f,turn)=>{
   if(n%2===0)return E.buildAiDeck([f],1.3,seed+turn*13);
   const presets=D.expansionDecks.filter(d=>d.faction===f);
   return presets[(n+a+b+turn)%presets.length].cards;
 };
 try{
   const left=choose(fa,0),right=choose(fb,1);
   if(!E.validateDeck(left,null,fa).valid||!E.validateDeck(right,null,fb).valid)throw Error('Invalid deck recipe');
   const battle=new E.Battle({playerDeck:left,aiDeck:right,seed,difficulty:1});
   battle.beginTurn(0,true);
   let progress=0;
   while(battle.state.winner===null&&battle.state.halfTurn<74){
      const before=battle.state.halfTurn;
      await battle.takeAITurn(()=>Promise.resolve(),battle.state.active);
      if(battle.state.winner===null&&battle.state.halfTurn===before)throw Error('AI did not advance the battle');
      progress++;
      if(progress>80)throw Error('Unexpected turn loop');
      for(const side of battle.state.sides){
         if(!Number.isFinite(side.life)||side.life<0||side.life>side.maxLife)throw Error('Unbounded commander life');
         if(!Number.isFinite(side.energy)||side.energy<0||side.energy>30)throw Error('Invalid energy');
      }
   }
   const win=battle.state.winner,record={fa,fb,seed,winner:win,halves:battle.state.halfTurn,
     leftLife:battle.side(0).life,rightLife:battle.side(1).life};
   matchup[fa+'->'+fb]??={wins:0,losses:0,draws:0,unfinished:0,total:0};
   const m=matchup[fa+'->'+fb];m.total++;
   if(win===0){statistics[fa].wins++;statistics[fb].losses++;m.wins++}
   else if(win===1){statistics[fb].wins++;statistics[fa].losses++;m.losses++}
   else if(win===-1){statistics[fa].draws++;statistics[fb].draws++;m.draws++}
   else {statistics[fa].unfinished++;statistics[fb].unfinished++;m.unfinished++}
   statistics[fa].played++;statistics[fb].played++;
   statistics[fa].halves+=record.halves;statistics[fb].halves+=record.halves;
   games++;
 }catch(error){problems.push({fa,fb,seed,error:String(error?.stack||error).slice(0,700)})}
}
const output={schema:'avp-tcg/wave2-balance-sample-v1',source:'656 cards; 70 structure recipes',gamesPerMatchup:count,
 totalGames:games,failedGames:problems.length,unfinishedGames:Object.values(matchup).reduce((a,m)=>a+m.unfinished,0),
 factions:statistics,matchups:matchup,problems,
 caveat:'Finite seeded samples are QA, not proof of equal win rates; unfinished duels stop at 74 half turns.'};
if(json)console.log(JSON.stringify(output,null,2));
else {
 console.log('AVP TCG wave2 stress:',games,'games; crashes:',problems.length,'unfinished:',output.unfinishedGames);
 for(const [f,v] of Object.entries(statistics))console.log(f,JSON.stringify({wins:v.wins,losses:v.losses,draws:v.draws,unfinished:v.unfinished,avgHalves:Number((v.halves/v.played).toFixed(1))}));
}
if(problems.length)process.exitCode=1;
