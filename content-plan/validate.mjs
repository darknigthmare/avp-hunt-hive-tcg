#!/usr/bin/env node
// Controles de cohérence du catalogue (non-jouable). Node 20+, sans dépendance.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url));
function csv(f){
 const raw=readFileSync(join(here,f),'utf8').replace(/\r/g,'');
 let rows=[],row=[],col='',quoted=false;
 for(let i=0;i<raw.length;i++){
   let c=raw[i];
   if(c==='"'){if(quoted&&raw[i+1]==='"'){col+='"';i++;}else quoted=!quoted;}
   else if(c===','&&!quoted){row.push(col);col='';}
   else if(c==='\n'&&!quoted){row.push(col);if(row.some(Boolean))rows.push(row);row=[];col='';}
   else col+=c;
 }
 if(quoted)throw new Error('Champ CSV mal fermé: '+f);
 const [head,...body]=rows;
 return body.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
}
const sets=csv('sets.csv'), prints=csv('printings.csv'), sources=csv('alien-base-sources.csv');
const legacy=csv('legacy-cards.csv'), rarity=csv('rarities.csv'), decks=csv('decks.csv'), lines=csv('decklists.csv');
const offers=csv('products.csv');
assert.equal(sets.length,30);assert.equal(prints.length,3000);
assert.equal(sources.length,652);assert.equal(legacy.length,158);
assert.equal(rarity.length,14);assert.equal(decks.length,210);
assert.equal(lines.length,6300);assert.equal(offers.length,180);
const gids=new Set(prints.map(x=>x.GameplayCardID));
assert.equal(gids.size,2850);
assert.equal(prints.filter(x=>x.ImpressionAlternative==='OUI').length,150);
const sourceIds=new Set(sources.map(x=>x.AlienBaseID));
for(const x of prints){assert(sourceIds.has(x.EntiteAlienBase),x.EntiteAlienBase);assert(gids.has(x.GameplayCardID));}
const setCodes=new Set(sets.map(x=>x.Set));
for(const x of prints)assert(setCodes.has(x.Set));
const rareCodes=new Set(rarity.map(x=>x.Code));
for(const x of prints)assert(rareCodes.has(x.Rareté),x.Rareté);
const cardMap=new Map(prints.map(x=>[x.GameplayCardID,x]));
const dl=new Map();
for(const x of lines){let l=dl.get(x.DeckID)||[];l.push(x);dl.set(x.DeckID,l);
  assert(cardMap.has(x.CarteID),x.CarteID);
}
for(const d of decks){
 const l=dl.get(d.DeckID)||[];
 assert.equal(l.length,30,d.DeckID);
 assert.equal(new Set(l.map(x=>x.CarteID)).size,30,d.DeckID);
 assert(l.every(x=>x.Faction===d.Faction),'Faction discordante: '+d.DeckID);
}
const first5=new Set(['NX01','CW02','HG03','AV04','EV05']);
for(const x of prints.filter(x=>first5.has(x.Set)))assert(Number(x.No.split('-')[1])>=101);
console.log('OK : 30 sets, 3 000 printings, 2 850 identités, 652 sources, 14 raretés, 210 decks / 6 300 slots.');
