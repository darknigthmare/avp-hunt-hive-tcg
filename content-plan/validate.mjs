#!/usr/bin/env node
// Tests documentaires (Node 20+, sans dépendance externe) : les cartes ne sont pas encore jouables.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
const dir=dirname(fileURLToPath(import.meta.url));
function csv(name){
 const s=readFileSync(join(dir,name),'utf8');
 let rows=[],row=[],cell='',quote=false;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='"'){if(quote&&s[i+1]==='"'){cell+='"';i++;}else quote=!quote;}
  else if(ch===','&&!quote){row.push(cell);cell='';}
  else if(ch==='\n'&&!quote){row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}
  else if(ch!=='\r')cell+=ch;
 }
 assert(!quote,'CSV non refermé: '+name);
 const [headers,...data]=rows;return data.map(line=>Object.fromEntries(headers.map((h,i)=>[h,line[i]??''])));
}
const m=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
const liveDecks=csv('decks-playable.csv'),liveSlots=csv('decklists-playable.csv');
assert.equal(liveDecks.length,m.implementation.totalDeckPresetsPlayable);
assert.equal(liveSlots.length,m.implementation.playableDeckCardPositions);
assert.equal(new Set(liveDecks.map(d=>d.DeckID)).size,liveDecks.length);
const sets=csv('sets.csv'),prints=csv('printings.csv'),decks=csv('decks.csv'),lines=csv('decklists.csv');
const offers=csv('products.csv'),legacy=csv('legacy-cards.csv'),sources=csv('alien-base-sources.csv'),rarities=csv('rarities.csv');
const setMap=new Map(sets.map(s=>[s.Set,s])),cardMap=new Map(prints.filter(x=>x.ImpressionAlternative==='NON').map(x=>[x.GameplayCardID,x]));
assert.equal(sets.length,30);assert.equal(prints.length,m.totals.newPrintings);
assert.equal(cardMap.size,m.totals.newGameplayCardConcepts);
assert.equal(prints.filter(x=>x.ImpressionAlternative==='OUI').length,m.totals.alternativePrintings);
assert.equal(decks.length,210);assert.equal(lines.length,m.totals.decklistRows);
assert.equal(offers.length,m.totals.productSkus);assert.equal(legacy.length,158);assert.equal(sources.length,652);assert.equal(rarities.length,14);
assert.equal(new Set(prints.map(x=>x.PrintID)).size,prints.length,'Numéros d’impression dupliqués');
const canon=new Set(sources.map(x=>x.AlienBaseID)),rarSet=new Set(rarities.map(x=>x.Code));
for(const p of prints){
 assert(setMap.has(p.Set),'set '+p.Set);assert(canon.has(p.EntiteAlienBase),'source '+p.EntiteAlienBase);
 assert(cardMap.has(p.GameplayCardID),'identité carte '+p.GameplayCardID);assert(rarSet.has(p['Rareté']),'rareté '+p['Rareté']);
}
for(const s of sets){
 const list=prints.filter(x=>x.Set===s.Set);
 assert.equal(list.length,Number(s.EmplacementsNouveaux),s.Set);
 assert.equal(list.filter(x=>x.ImpressionAlternative==='NON').length,Number(s.CartesNouvelles),s.Set);
 assert.equal(list.filter(x=>x.ImpressionAlternative==='OUI').length,Number(s.PrintsSpeciales),s.Set);
 assert.equal(Number(s.BoosterCartes),m.packProfiles[{'Booster principal':'core','Booster thématique':'theme','Booster légendaire':'legendary','Booster de construction':'deckBuild','Booster collector':'collector'}[s.Gamme]],s.Set);
}
const deckMap=new Map(decks.map(x=>[x.DeckID,x])),byDeck=new Map();
for(const l of lines){
 assert(cardMap.has(l.CarteID),'carte sans identité '+l.CarteID);
 const d=deckMap.get(l.DeckID);assert(d,'deck inconnu '+l.DeckID);assert.equal(l.Faction,d.Faction);
 if(!byDeck.has(l.DeckID))byDeck.set(l.DeckID,{primary:[],side:[]});
 (l.Zone==='PRINCIPAL'?byDeck.get(l.DeckID).primary:byDeck.get(l.DeckID).side).push(l);
}
for(const d of decks){
 const p=byDeck.get(d.DeckID);assert(p);
 assert.equal(p.primary.length,30,d.DeckID);
 assert.equal(p.side.length,Number(d.Reserve),d.DeckID);
 assert.equal(new Set([...p.primary,...p.side].map(x=>x.CarteID)).size,Number(d.TotalBoite),d.DeckID);
 assert.equal(Number(d.DeckJouable),30,d.DeckID);
}
for(const item of offers){
 const s=setMap.get(item.Set);assert(s,'produit sans set '+item.SKU);
 if(Number(item.NbBoosters))assert.equal(Number(item.QuantiteCartes),Number(item.NbBoosters)*Number(s.BoosterCartes),item.SKU);
 else assert.equal(Number(item.QuantiteCartes),Number(item.DeckPrincipal)+Number(item.Reserve),item.SKU);
}
const categories={};for(const d of decks)categories[d.Categorie]=(categories[d.Categorie]||0)+1;
assert.equal(categories.STARTER,5);assert.equal(categories.STRUCTURE,25);
console.log('OK:',sets.length,'sets,',prints.length,'impressions,',cardMap.size,'identités,',decks.length,'decks,',lines.length,'slots,',offers.length,'produits.');
