#!/usr/bin/env node
// Contrôles des données : catalogue actif et programme éditorial restent distincts.
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
assert.equal(liveDecks.length,m.implementation.legacyTemplates+m.implementation.productionDecks);
assert.equal(liveSlots.length,m.implementation.playableDeckCardPositions);
const asyncCards=csv('asymmetric-cards.csv'),asyncDecks=csv('asymmetric-decks.csv');
const asyncSlots=csv('asymmetric-decklists.csv'),liveCards=csv('gameplay-live.csv');
const sourceSet=new Set(csv('alien-base-sources.csv').map(e=>e.AlienBaseID));
assert.equal(liveCards.length,m.implementation.totalPlayableCards);
assert.equal(asyncCards.length,m.implementation.asymmetricCards);
assert.equal(asyncDecks.length,m.implementation.asymmetricDecks);
assert.equal(asyncSlots.length,m.implementation.asymmetricDeckCardPositions);
assert.equal(new Set(asyncCards.map(c=>c.CardID)).size,asyncCards.length);
assert.equal(new Set(liveCards.map(c=>c.CardID)).size,liveCards.length);
const allLive=new Set(liveCards.map(c=>c.CardID));
const completeCards=csv('complete-cards.csv'),completeDecks=csv('complete-decks.csv'),completeSlots=csv('complete-decklists.csv');
const arsenal=csv('coverage-arsenal.csv'),hive=csv('coverage-hive.csv'),domains=csv('coverage-domains.csv');
assert.equal(completeCards.length,m.implementation.completeCards);
assert.equal(completeDecks.length,m.implementation.completeDecks);
assert.equal(completeSlots.length,m.implementation.completeDeckCardPositions);
assert.equal(arsenal.length,m.implementation.arsenalCoverageEntries);
assert.equal(hive.length,m.implementation.hiveCoverageEntries);
assert.equal(liveDecks.length+asyncDecks.length+completeDecks.length,m.implementation.totalDeckPresetsPlayable);
assert.equal(liveSlots.length+asyncSlots.length+completeSlots.length,m.implementation.totalPlayableDeckCardPositions);
assert.equal(domains.reduce((n,d)=>n+Number(d.TotalCartes),0),liveCards.length);
const liveProgress=csv('live-set-progress.csv');
assert.equal(liveProgress.reduce((n,s)=>n+Number(s.TotalJouable),0),liveCards.length);
for(const set of liveProgress)assert.equal(Number(set.TotalJouable),liveCards.filter(c=>c.Set===set.Set).length,set.Set);
for(const c of completeCards){assert(allLive.has(c.CardID),c.CardID);assert(c.SourceID&&c.Règle,c.CardID);}
for(const entry of arsenal)for(const field of ['AnciennesCartes','CartesActives','Munitions','Modules','Supports'])
 for(const id of (entry[field]||'').split('|').filter(Boolean))assert(allLive.has(id),'Unknown arsenal reference '+id);
for(const entry of hive)for(const field of ['AnciennesCartes','CartesActives','CartesÉvolution'])
 for(const id of (entry[field]||'').split('|').filter(Boolean))assert(allLive.has(id),'Unknown hive reference '+id);
for(const deck of completeDecks){
 const slots=completeSlots.filter(s=>s.DeckID===deck.DeckID);
 assert.equal(slots.filter(s=>s.Zone==='PRINCIPAL').length,30,deck.DeckID);
 assert.equal(slots.filter(s=>s.Zone==='RESERVE').length,Number(deck.Réserve),deck.DeckID);
 assert.equal(slots.length,Number(deck.TotalBoite),deck.DeckID);
 for(const s of slots)assert(allLive.has(s.CardID),s.CardID);
}
for(const c of asyncCards){
 assert(allLive.has(c.CardID),c.CardID);assert(sourceSet.has(c.RegistreAlienBaseID),c.CardID);
 assert(['ADAPTATION_TCG','MODULE_TCG_SUR_ARME'].includes(c.RelationSource),'Relation documentaire manquante : '+c.CardID);
 assert(c.NoteSource,'Qualification de la source manquante : '+c.CardID);
 if(c.SourcePrimaireURL)assert.equal(new URL(c.SourcePrimaireURL).protocol,'https:',c.CardID);
}
const dk=new Map(asyncDecks.map(d=>[d.DeckID,d]));
const seats=new Map();
for(const line of asyncSlots){assert(dk.has(line.DeckID));assert(allLive.has(line.CardID));
  if(!seats.has(line.DeckID))seats.set(line.DeckID,{main:0,side:0});
  seats.get(line.DeckID)[line.Zone==='PRINCIPAL'?'main':'side']++;
}
for(const [id,deck] of dk){const s=seats.get(id);assert(s);assert.equal(s.main,30,id);assert.equal(s.side,15,id);}

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
