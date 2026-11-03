#!/usr/bin/env node
/* Synchronized, source-derived live deck export. No art or gameplay changes. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,Script} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const context=createContext({window:{},Intl,Date,Math});
for(const file of ['data.js','expansion.js','expansion-wave2.js','deck-productions.js']){
  new Script(await readFile(resolve(root,'src',file),'utf8'),{filename:file}).runInContext(context,{timeout:6000});
}
const serializeDecks=function serializeDecks(D){
 const cards=new Map(D.cards.map(c=>[c.id,c]));
 const esc=v=>{let s=String(v??"");return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 const csv=rows=>rows.map(row=>row.map(esc).join(",")).join("\n")+"\n";
 const meta=[["DeckID","PlanDeckID","Nom","Gamme","SetCible","Faction","CartesJouables","Reserve","TotalBoite","CartesDuSetCible","SetCibleDisponible","Statut","Source"]];
 const lines=[["DeckID","Zone","Position","CarteID","Nom","Classe","Type","FactionCarte","SetCarte","Rareté","EntiteAlienBase","Quantité"]];
 for(const p of D.expansionDecks){
   const mainTotal=Object.values(p.cards).reduce((a,n)=>a+n,0),sideTotal=Object.values(p.reserve||{}).reduce((a,n)=>a+n,0);
   if(mainTotal!==30||mainTotal+sideTotal!==(p.boxCount||45))throw Error("Deck incomplet "+p.id);
   let matched=0;
   for(const [id,n] of Object.entries(p.cards))matched+=cards.get(id)?.set===p.focus?n:0;
   meta.push([p.id,p.planDeckId||"",p.name,p.category||"ARCHETYPE",p.focus||"",p.faction,
     mainTotal,sideTotal,p.boxCount||45,matched,p.focusSupported===false?"NON":p.focusSupported===true?"OUI":"SANS_CIBLE",
     p.productionPlan?"JOUABLE_BASE_SUR_CATALOGUE_ACTUEL":"JOUABLE_PRECONSTRUIT",p.productionPlan?"content-plan/decks.csv":"src/expansion-wave2.js"]);
   for(const [zone,pool] of [["PRINCIPAL",p.cards],["RESERVE",p.reserve||{}]]){
     let pos=0;
     for(const id of Object.keys(pool).sort()){
       const c=cards.get(id);if(!c)throw Error("Carte absente "+id);
       for(let i=0;i<pool[id];i++)lines.push([p.id,zone,++pos,id,c.name,c.cardClass,c.type,c.faction,c.set,c.rarity,c.sourceEntityId||"",1]);
     }
   }
 }
 if(meta.length!==281||lines.length!==15451)throw Error("Unexpected totals "+meta.length+" "+lines.length);
 return {meta:csv(meta),lines:csv(lines),totals:{decks:meta.length-1,slots:lines.length-1}};
};
const result=serializeDecks(context.window.AVP_DATA);
const paths=[['decks-playable.csv',result.meta],['decklists-playable.csv',result.lines]];
if(process.argv.includes('--check')){
  for(const [file,content]of paths){
    assert.equal(await readFile(resolve(root,'content-plan',file),'utf8'),content,file+' diverged from playable runtime');
  }
  console.log('OK: '+result.totals.decks+' playable recipes / '+result.totals.slots+' explicit card slots.');
}else if(process.argv.includes('--write')){
  for(const [file,content] of paths)await writeFile(resolve(root,'content-plan',file),content);
  console.log('Updated '+paths.map(x=>x[0]).join(', '));
}else{
  throw new Error('Use --check or --write to avoid accidental changes.');
}
