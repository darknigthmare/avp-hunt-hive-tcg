#!/usr/bin/env node
// Exercise every doctrine with the complete runtime, including checkpoint continuations.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createContext, Script} from 'node:vm';

const root=new URL('../',import.meta.url);
const files=['data.js','expansion.js','expansion-wave2.js','deck-productions.js',
  'asymmetric-cards.js','asymmetric-decks.js','engine.js','asymmetric-rules.js','duel-save.js'];
const context=createContext({window:{},Intl,Date,Math});
const sourceHashes={};
for(const file of files){
  const source=readFileSync(new URL('src/'+file,root),'utf8');
  sourceHashes[file]=createHash('sha256').update(source).digest('hex');
  new Script(source,{filename:file}).runInContext(context,{timeout:8000});
}
const {AVP_DATA:D,AVPEngine:E,AVPDuelSave:S}=context.window;
const report={schema:'avp-tcg/asymmetric-qa-v1',version:D.version,
  catalogue:{cards:D.cards.length,presets:D.expansionDecks.length,doctrines:D.asymmetricDecks.length,boosters:D.boosters.length},
  sourceHashes,totalGames:0,completedGames:0,unfinishedGames:0,checkpointRoundTrips:0,
  deterministicContinuations:0,maxHalfTurns:0,matchups:{},failures:[],
  note:'Échantillon déterministe de fonctionnement et de reprise. Les taux de victoire ne constituent pas une preuve d’équilibrage.'};
assert.equal(report.catalogue.cards,891);
assert.equal(report.catalogue.presets,318);
assert.equal(report.catalogue.doctrines,38);
const allDecks=D.expansionDecks;
for(const p of allDecks){
  assert(E.validateDeck(p.cards,null,p.faction).valid,p.id);
  assert.equal(Object.values(p.cards).reduce((a,b)=>a+b,0),30,p.id);
}
function checkState(b){
  for(const side of b.state.sides){
    for(const field of ['life','energy','biomass','plasma','honor']){
      assert(Number.isFinite(side[field])&&side[field]>=0,field+' out of bounds');
    }
    assert(side.life<=side.maxLife);
    // Effects can grant temporary energy above the normal per-turn maximum.
    assert(side.maxEnergy<=D.rules.maxEnergy);
    assert(side.energy<=30);
    for(const key of ['biomass','plasma','honor'])assert(side[key]<=12,key+' exceeded cap');
    for(const u of side.board.filter(Boolean))for(const p of u.ammoPacks||[]){
      const card=E.CARD.get(p.cardId);
      assert(card&&card.cardClass==='MUNITION');
      assert(Number.isInteger(p.remaining)&&p.remaining>=0&&p.remaining<=card.rounds);
    }
  }
}
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort()
    .filter(key=>!['uid','id','time','startedAt'].includes(key)).map(key=>[key,canonical(value[key])]));
  return value;
}
async function run(left,right,seed,label){
  report.totalGames++;
  try{
    assert(E.validateDeck(left.cards,null,left.faction).valid,left.id);
    assert(E.validateDeck(right.cards,null,right.faction).valid,right.id);
    let b=new E.Battle({playerDeck:left.cards,aiDeck:right.cards,seed,difficulty:1});
    const key=left.faction+' / '+right.faction;
    report.matchups[key]??={games:0,leftWins:0,rightWins:0,draws:0,unfinished:0};
    const m=report.matchups[key];m.games++;
    while(b.state.winner===null&&b.state.halfTurn<100){
      const before=b.state.halfTurn;
      const saved=S.capture(b),restored=S.restore(saved);
      assert.equal(JSON.stringify(S.capture(restored)),JSON.stringify(saved),'Checkpoint changed state');
      report.checkpointRoundTrips++;
      // Continue both versions periodically to verify restored RNG and resources.
      if(before%4===0){
        await b.takeAITurn(()=>Promise.resolve(),b.state.active);
        await restored.takeAITurn(()=>Promise.resolve(),restored.state.active);
        const normalize=x=>canonical({state:x.state,rng:x.rng.getState()});
        assert.equal(JSON.stringify(normalize(restored)),JSON.stringify(normalize(b)),'Restored continuation diverged');
        report.deterministicContinuations++;
      }else await restored.takeAITurn(()=>Promise.resolve(),restored.state.active);
      b=restored;
      checkState(b);
      assert(b.state.winner!==null||b.state.halfTurn>before,'AI turn stalled');
    }
    report.maxHalfTurns=Math.max(report.maxHalfTurns,b.state.halfTurn);
    if(b.state.winner===null){report.unfinishedGames++;m.unfinished++;}
    else {report.completedGames++;if(b.state.winner===0)m.leftWins++;else if(b.state.winner===1)m.rightWins++;else m.draws++;}
  }catch(error){report.failures.push({left:left.id,right:right.id,seed,label,error:error.stack});}
}
for(let i=0;i<D.asymmetricDecks.length;i++){
  const base=D.asymmetricDecks[i];
  for(let n=0;n<4;n++){
    const seed=20261103+i*101+n*7919;
    const opponents=D.asymmetricDecks.filter(p=>p.faction!==base.faction);
    const other=opponents[(i+n*7)%opponents.length];
    const player=n<2?base:{...base,cards:D.remixPresetDeck(base,seed).cards};
    const enemy=n<2?other:{...other,cards:D.remixPresetDeck(other,seed+1).cards};
    await run(n%2?enemy:player,n%2?player:enemy,seed,'doctrine');
  }
}
// Cover generic campaign fallbacks and all five faction AI entry points too.
const factions=['HUMAN','XENO','YAUTJA','ENGINEER','HYBRID'];
for(let a=0;a<factions.length;a++)for(let b=0;b<factions.length;b++){
  const seed=791911+a*97+b*307;
  await run({id:'ai-'+factions[a],faction:factions[a],cards:E.buildAiDeck([factions[a]],1.3,seed)},
    {id:'ai-'+factions[b],faction:factions[b],cards:E.buildAiDeck([factions[b]],1.3,seed+7)},seed,'generated-ai');
}
report.passed=report.failures.length===0&&report.unfinishedGames===0;
const json=JSON.stringify(report,null,2)+'\n';
const output=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(output)writeFileSync(output,json);
if(process.argv.includes('--json'))process.stdout.write(json);
else console.log(JSON.stringify({passed:report.passed,games:report.totalGames,completed:report.completedGames,
  failed:report.failures.length,unfinished:report.unfinishedGames,checkpointRoundTrips:report.checkpointRoundTrips,
  deterministicContinuations:report.deterministicContinuations,maxHalfTurns:report.maxHalfTurns}));
if(!report.passed){if(!process.argv.includes('--json'))console.error(JSON.stringify(report.failures,null,2));process.exitCode=1;}
