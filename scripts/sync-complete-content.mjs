#!/usr/bin/env node
// Keep the supplemental catalogue and coverage matrices tied to the executable game.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {loadRuntime, encodeCSV, parseCSV, root} from './runtime-loader.mjs';

const check = process.argv.includes('--check');
assert(check || process.argv.includes('--write'), 'Use --check or --write');
const {AVP_DATA:D, AVPEngine:E} = loadRuntime({rules:true});
const cards = new Map(D.cards.map(card => [card.id, card]));
assert.equal(cards.size, D.cards.length, 'Duplicate card ID');
assert.equal(new Set(D.expansionDecks.map(deck => deck.id)).size, D.expansionDecks.length, 'Duplicate deck ID');
assert.equal(new Set(D.boosters.map(pack => pack.id)).size, D.boosters.length, 'Duplicate booster ID');
const sum = pool => Object.values(pool || {}).reduce((n, amount) => n + amount, 0);
const extraCards = D.cards.slice(891);
const extraDecks = D.expansionDecks.slice(318);
const ids = value => (Array.isArray(value) ? value : value == null ? [] : [value]);
const joined = value => ids(value).join('|');
const outputs = [];

const cardRows = [['CardID','Nom','Classe','Type','Faction','Set','Rareté','Énergie','ATK','PV','FamilleArme','Munitions','Charges','Consommation','Plasma','Socket','ArmesCompatibles','ÉquipementsCompatibles','Stade','TypeHôte','Effet','RésultatID','SourceID','PolitiqueSource','Règle']];
for(const c of extraCards) {
  assert(c.sourceEntityId || c.source?.entry, 'Missing source: '+c.id);
  assert(c.text, 'Missing card rules: '+c.id);
  assert(D.factions[c.faction] && D.rarities[c.rarity] && D.sets[c.set], 'Invalid catalogue key: '+c.id);
  cardRows.push([c.id,c.name,c.cardClass,c.type,c.faction,c.set,c.rarity,c.cost,c.attack,c.health,c.weaponFamily,c.ammoType,c.rounds||0,c.ammoPerAttack||0,c.plasmaPerAttack||0,c.modSocket,joined(c.compatibleFamilies),joined(c.compatibleEquipmentIds),c.evolutionStage,c.hostType,c.effect?.kind||c.effect?.onPlay?.kind||c.effect?.onEquip?.kind||'',c.effect?.resultCardId,c.sourceEntityId||c.source?.entry,c.sourcePolicy,c.text]);
}
outputs.push(['complete-cards.csv', encodeCSV(cardRows)]);

const deckRows = [['DeckID','Nom','Faction','Gamme','Focus','CartesDuel','Réserve','TotalBoite','Origine']];
const slotRows = [['DeckID','Zone','Position','CardID','Nom','Classe','Faction','Set','Quantité']];
for(const deck of extraDecks) {
  assert(E.validateDeck(deck.cards, null, deck.faction).valid, 'Illegal main deck: '+deck.id);
  assert.equal(sum(deck.cards), 30, deck.id);
  assert.equal(sum(deck.cards)+sum(deck.reserve), deck.boxCount, deck.id);
  for(const id of new Set([...Object.keys(deck.cards), ...Object.keys(deck.reserve||{})])) {
    assert(cards.has(id), deck.id+' references '+id);
    assert((deck.cards[id]||0)+(deck.reserve?.[id]||0)<=D.rules.maxCopies, deck.id+' exceeds combined copies: '+id);
  }
  deckRows.push([deck.id,deck.name,deck.faction,deck.category||'ARCHETYPE',deck.focus||'',sum(deck.cards),sum(deck.reserve),deck.boxCount,(D.arsenalDecks||[]).some(d=>d.id===deck.id)?'ARSENAL':'RUCHE']);
  for(const [zone,pool] of [['PRINCIPAL',deck.cards],['RESERVE',deck.reserve||{}]]) {
    let position=0;
    for(const id of Object.keys(pool).sort()) for(let copy=0;copy<pool[id];copy++) {
      const c=cards.get(id);
      slotRows.push([deck.id,zone,++position,id,c.name,c.cardClass,c.faction,c.set,1]);
    }
  }
}
outputs.push(['complete-decks.csv',encodeCSV(deckRows)],['complete-decklists.csv',encodeCSV(slotRows)]);

const arsenal = [['SourceID','Nom','Faction','Catégorie','AnciennesCartes','CartesActives','Munitions','Modules','Supports','Ressource','Statut','Notes']];
for(const entry of D.arsenalCoverage?.entries || []) {
  for(const key of ['cardIds','ammoCardIds','modCardIds','supportCardIds','legacyCardIds'])
    for(const id of ids(entry[key])) assert(cards.has(id), 'Arsenal '+(entry.sourceId||entry.id)+': unknown '+id);
  arsenal.push([entry.sourceId||entry.id,entry.name,entry.faction,entry.kind,joined(entry.legacyCardIds),joined(entry.cardIds),joined(entry.ammoCardIds),joined(entry.modCardIds),joined(entry.supportCardIds),entry.resourceMode,entry.status,typeof entry.notes==='object'?JSON.stringify(entry.notes):entry.notes]);
}
assert(arsenal.length>1, 'Arsenal coverage missing');
outputs.push(['coverage-arsenal.csv',encodeCSV(arsenal)]);

const hive = [['SourceID','Nom','Catégorie','Continuité','AnciennesCartes','CartesActives','CartesÉvolution','Routes','Statut','Notes']];
for(const entry of D.hiveCoverage?.entries || []) {
  for(const key of ['cardIds','evolutionCardIds','legacyCardIds'])
    for(const id of ids(entry[key])) assert(cards.has(id), 'Hive '+(entry.sourceId||entry.id)+': unknown '+id);
  hive.push([entry.sourceId||entry.id,entry.name,entry.kind,entry.continuity,joined(entry.legacyCardIds),joined(entry.cardIds),joined(entry.evolutionCardIds),joined(entry.routeIds),entry.status,typeof entry.notes==='object'?JSON.stringify(entry.notes):entry.notes]);
}
assert(hive.length>1, 'Hive coverage missing');
outputs.push(['coverage-hive.csv',encodeCSV(hive)]);

const domains = [['Domaine','TotalCartes','Humains','Yautja','Xénomorphes','Ingénieurs','Hybrides','Neutres','SansSource','PrésentesDansUnDeck']];
const deckCards=new Set(D.expansionDecks.flatMap(d=>[...Object.keys(d.cards),...Object.keys(d.reserve||{})]));
for(const domain of [...new Set(D.cards.map(c=>c.cardClass||c.type))].sort()) {
  const selected=D.cards.filter(c=>(c.cardClass||c.type)===domain);
  domains.push([domain,selected.length,...['HUMAN','YAUTJA','XENO','ENGINEER','HYBRID','NEUTRAL'].map(f=>selected.filter(c=>c.faction===f).length),selected.filter(c=>!c.sourceEntityId&&!c.source?.entry).length,selected.filter(c=>deckCards.has(c.id)).length]);
}
outputs.push(['coverage-domains.csv',encodeCSV(domains)]);

// The editorial targets remain unchanged; live progress includes every wave.
const progress=parseCSV(await readFile(new URL('content-plan/live-set-progress.csv',root),'utf8'));
for(const header of ['CartesArsenalJouables','CartesRucheJouables'])if(!progress[0].includes(header))progress[0].push(header);
const col=name=>{const i=progress[0].indexOf(name);assert(i>=0,'Unknown progress field '+name);return i;};
for(const row of progress.slice(1)) {
  const set=row[col('Set')],selected=D.cards.filter(c=>c.set===set);
  row[col('Historique158')]=D.cards.slice(0,158).filter(c=>c.set===set).length;
  for(const [prefix,field] of [['AX_','JouableWave1'],['BX_','JouableWave2'],['MX_','CartesAsymJouables'],['AR_','CartesArsenalJouables'],['HV_','CartesRucheJouables']])
    row[col(field)]=selected.filter(c=>c.id.startsWith(prefix)).length;
  row[col('TotalJouable')]=selected.length;
  row[col('ConceptsNouveauxJouables')]=selected.length-row[col('Historique158')];
  const target=Number(row[col('CibleConceptsPlan')]);
  if(Number.isFinite(target)) {
    const delta=target-row[col('ConceptsNouveauxJouables')];
    row[col('ÉcartConceptsPlanMoinsJouables')]=delta;
    row[col('ÉtatEditorial')]=delta<0?'CIBLE_PLAN_A_RECALIBRER':'APERÇU_PARTIEL';
  }
  const packs=D.boosters.filter(pack=>pack.set===set);
  row[col('BoosterActif')]=packs.length?'OUI':'NON';
  row[col('CartesParBoosterActif')]=[...new Set(packs.map(pack=>pack.cardsPerBooster||9))].sort().join('|');
}
assert.equal(progress.slice(1).reduce((n,row)=>n+row[col('TotalJouable')],0),D.cards.length,'Set progress must cover every card');
outputs.push(['live-set-progress.csv',encodeCSV(progress)]);

const manifestPath=new URL('content-plan/manifest.json',root);
const original=JSON.parse(await readFile(manifestPath,'utf8'));
const m=structuredClone(original);
m.tcgMain='b233b690ed830e3c69fa96a652801e8a94ff7f1d';
Object.assign(m.implementation,{
  version:D.version,status:'INTEGRATED_WITH_SOURCE_STATUS',totalPlayableCards:D.cards.length,
  totalDeckPresetsPlayable:D.expansionDecks.length,playableBoosters:D.boosters.length,
  completeCards:extraCards.length,completeDecks:extraDecks.length,completeDeckCardPositions:slotRows.length-1,
  arsenalDecks:(D.arsenalDecks||[]).length,hiveDecks:(D.hiveDecks||[]).length,
  arsenalCoverageEntries:arsenal.length-1,hiveCoverageEntries:hive.length-1,
  totalPlayableDeckCardPositions:D.expansionDecks.reduce((n,d)=>n+sum(d.cards)+sum(d.reserve),0),
  catalogueWorkbook:'content-plan/AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx',catalogueWorkbookSheets:32,
  completeCardCSV:'content-plan/complete-cards.csv',completeDeckCSV:'content-plan/complete-decks.csv',
  completeDecklistCSV:'content-plan/complete-decklists.csv',arsenalCoverageCSV:'content-plan/coverage-arsenal.csv',
  hiveCoverageCSV:'content-plan/coverage-hive.csv',domainCoverageCSV:'content-plan/coverage-domains.csv'
});
outputs.push(['manifest.json',JSON.stringify(m,null,2)+'\n']);
for(const [file,content] of outputs) {
  const path=new URL('content-plan/'+file,root);
  if(check) assert.equal(await readFile(path,'utf8'),content,file+' diverged from the runtime');
  else await writeFile(path,content);
}
console.log(JSON.stringify({status:'PASS',cards:D.cards.length,decks:D.expansionDecks.length,boosters:D.boosters.length,newCards:extraCards.length,newDecks:extraDecks.length,arsenalEntries:arsenal.length-1,hiveEntries:hive.length-1,domains:domains.length-1}));
