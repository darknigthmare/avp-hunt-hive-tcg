import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {loadRuntime} from '../scripts/runtime-loader.mjs';

const {AVP_DATA:D,AVPEngine:E,AVPDuelSave:S}=loadRuntime({rules:true});
const H=D.hiveCoverage,card=id=>E.CARD.get(id),sum=map=>Object.values(map).reduce((a,b)=>a+b,0);
const routeById=new Map(H.routes.map(r=>[r.id,r]));
function battle(seed=67){
  const b=new E.Battle({playerDeck:D.hiveDecks[0].cards,aiDeck:D.asymmetricDecks[0].cards,seed});
  const s=b.side(0);s.board=[null,null,null];s.hand=[];s.deck=[];s.discard=[];s.biomass=12;
  s.energy=10;s.maxEnergy=10;
  return b;
}
function fixture(route){
  const b=battle(),s=b.side(0),action=card(route.actionCardId);
  s.board[0]=b.makeUnit(route.primaryMaterialIds[0],0);
  if(route.secondaryMaterialIds.length)s.board[1]=b.makeUnit(route.secondaryMaterialIds[0],0);
  if(route.catalystCardIds.length)s.board[2]=b.makeUnit(route.catalystCardIds[0],0);
  s.hand=[action.id];if(action.id!==route.resultCardId)s.deck=[route.resultCardId];
  return b;
}
function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(!value||typeof value!=='object')return value;
  const out={};
  // Display identities use the wall clock; they have no gameplay effect. A
  // fresh fixture also has the same zero aura before its first synchronization.
  const normalized=value.currentHealth!==undefined?{...value,auraHealth:value.auraHealth||0}:value;
  for(const key of Object.keys(normalized).sort())if(key!=='uid')out[key]=canonical(normalized[key]);
  return out;
}
const state=b=>JSON.stringify(canonical({sides:b.state.sides,active:b.state.active,winner:b.state.winner,rng:b.rng.getState()}));
function pull(b,id){
  const s=b.side(0);
  if(!s.hand.includes(id)){
    const i=s.deck.indexOf(id);assert(i>=0,'Carte réellement absente du deck : '+id);
    s.deck.splice(i,1);s.hand.push(id);
  }
  s.energy=10;
  return s.hand.indexOf(id);
}
function play(b,id,target){
  const index=pull(b,id),result=b.playCard(0,index,target);
  assert(result.ok,id+' : '+result.reason);
}
function ensureMaterial(b,group){
  if(!group.length||b.side(0).board.some(u=>u&&group.includes(u.cardId)))return;
  const s=b.side(0),id=group.find(id=>(s.hand.includes(id)||s.deck.includes(id))
    &&!card(id).summonByFusion&&!card(id).requiresEgg);
  assert(id,'Matériau intermédiaire manquant : '+group.join(' / '));
  const index=pull(b,id),check=b.canPlay(0,index);
  assert(check.ok,id+' : '+check.reason);assert(check.targets.length);
  play(b,id,check.targets[0]);
}

test('105 sujets possèdent une vraie unité, une recette traçable et des identifiants sources valides',()=>{
  assert.equal(H.entries.length,H.sourceCount+H.historicalSubjects);
  assert.equal(H.sourceCount,87);assert.equal(H.historicalSubjects,18);
  assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
  const sources=new Set(readFileSync(new URL('../content-plan/alien-base-sources.csv',import.meta.url),'utf8')
    .split(/\r?\n/).slice(1).map(row=>row.split(',',1)[0]).filter(Boolean));
  for(const entry of H.entries){
    assert.equal(entry.status,'PLAYABLE_ROUTE',entry.sourceId);
    assert(entry.cardIds.some(id=>card(id)?.type==='UNIT'),entry.sourceId+' sans forme jouable');
    assert(entry.deckIds.length,entry.sourceId+' sans recette');
    for(const id of [...entry.legacyCardIds,...entry.cardIds,...entry.evolutionCardIds])assert(card(id),id);
    for(const id of entry.routeIds)assert(routeById.has(id),id);
    assert.match(entry.notes,/TCG/);
  }
  for(const id of D.hiveEdition.cardIds){
    const c=card(id);assert(sources.has(c.sourceEntityId),id+' : source '+c.sourceEntityId);
    assert.equal(c.sourcePolicy,'hive-cycle-tcg-adaptation-not-universal-biology');
  }
  for(const route of H.routes){
    assert(route.deckIds.length,route.id+' sans deck');assert(card(route.resultCardId));
    assert.equal(route.ruleStatus,'TCG_ADAPTATION');
  }
});

test('108 recettes et leurs remix fournissent 30+15 cartes, trois copies maximum et tous les prérequis',()=>{
  assert.equal(D.hiveDecks.length,108);
  for(const preset of D.hiveDecks)for(const seed of [null,13,29]){
    const recipe=seed===null?preset:D.remixPresetDeck(preset,seed);
    assert.equal(sum(recipe.cards),30,preset.id);assert.equal(sum(recipe.reserve),15,preset.id);
    assert(E.validateDeck(recipe.cards,null,preset.faction).valid,preset.id);
    for(const id of new Set([...Object.keys(recipe.cards),...Object.keys(recipe.reserve)]))
      assert((recipe.cards[id]||0)+(recipe.reserve[id]||0)<=3,preset.id+' : '+id);
    assert.equal(E.analyzeDeck(recipe.cards,preset.faction).asymmetric.length,0,preset.id);
    if(seed!==null)assert.equal(JSON.stringify(recipe),JSON.stringify(D.remixPresetDeck(preset,seed)));
  }
});

test('tous les chemins de recettes se déroulent avec leurs seules 30 cartes, sans inventer les résultats',()=>{
  for(const preset of D.hiveDecks){
    const b=battle(),s=b.side(0);s.biomass=0;s.deck=E.expandDeck(preset.cards);
    for(const id of H.biomassCardIds.filter(id=>card(id).faction===preset.faction))
      for(let n=0;n<(preset.cards[id]||0);n++)play(b,id,{kind:'NONE'});
    const seen=new Set();
    for(const routeId of preset.routeIds){
      const route=routeById.get(routeId);
      ensureMaterial(b,route.primaryMaterialIds);ensureMaterial(b,route.secondaryMaterialIds);ensureMaterial(b,route.catalystCardIds);
      const index=pull(b,route.actionCardId),check=b.canPlay(0,index);
      assert(check.ok,preset.id+' / '+route.id+' : '+check.reason);
      const target=check.targets.find(t=>s.board[t.lane]&&route.primaryMaterialIds.includes(s.board[t.lane].cardId));
      assert(target,preset.id+' / '+route.id+' : cible réelle absente');
      play(b,route.actionCardId,target);
      assert(s.board.some(u=>u?.cardId===route.resultCardId),preset.id+' / '+route.id+' : résultat non créé');
      seen.add(route.resultCardId);
      assert.equal(s.board.length,3);
    }
    for(const sourceId of preset.sourceIds){
      const entry=H.entries.find(e=>e.sourceId===sourceId);
      if(entry&&preset.id===entry.deckId)assert(entry.cardIds.some(id=>seen.has(id)),preset.id+' : forme cible jamais atteinte');
    }
  }
});

test('chaque route consomme des cartes réelles, respecte la biomasse et conserve ses catalyseurs',()=>{
  for(const route of H.routes){
    const b=fixture(route),s=b.side(0),c=card(route.actionCardId),effect=c.effect;
    const target=b.validTargets(c,0).find(t=>t.lane===0);
    assert(target,route.id+' sans cible');
    const primary=s.board[0],secondary=route.secondaryMaterialIds.length?s.board[1]:null,catalyst=s.board[2];
    const check=b.canPlay(0,0);assert(check.ok,route.id+' : '+check.reason);
    const cost=check.cost,result=b.playCard(0,0,target);assert(result.ok,route.id);
    assert.equal(s.energy,10-cost,route.id);
    assert(s.board.some(u=>u?.cardId===route.resultCardId),route.id);
    assert.equal(s.hand.includes(route.actionCardId),false);
    if(route.actionCardId!==route.resultCardId)assert.equal(s.deck.includes(route.resultCardId),false);
    if(route.preserveMaterial)assert(s.board.includes(primary),route.id);
    else assert.equal(s.discard.filter(id=>id===primary.cardId).length,1,route.id);
    if(secondary)assert.equal(s.discard.filter(id=>id===secondary.cardId).length,1,route.id);
    if(route.catalystCardIds.length)assert(s.board.includes(catalyst),route.id);
    const gain=c.requiresEgg?1:effect.kind==='HIVE_FUSION'?(effect.biomassGain||1):effect.biomassGain||0;
    assert.equal(s.biomass,Math.max(0,Math.min(12,12-(effect.biomassCost||0)+gain)),route.id);
  }
});

test('les routes refusées ne dépensent ni énergie, ni biomasse, ni action, ni matériaux',()=>{
  for(const route of H.routes.filter(r=>card(r.actionCardId).effect?.kind==='HIVE_ROUTE')){
    for(const failure of ['result','primary','synthetic',...(route.biomassCost?['biomass']:[]),
      ...(route.secondaryMaterialIds.length?['secondary']:[]),...(route.catalystCardIds.length?['catalyst']:[])]){
      const b=fixture(route),s=b.side(0);
      if(failure==='result')s.deck=[];
      if(failure==='primary')s.board[0]=null;
      if(failure==='synthetic')s.board[0].granted.push('SYNTHETIC');
      if(failure==='biomass')s.biomass=route.biomassCost-1;
      if(failure==='secondary')s.board[1]=null;
      if(failure==='catalyst')s.board[2]=null;
      const before=state(b);
      assert.equal(b.canPlay(0,0).ok,false,route.id+' / '+failure);
      assert.equal(b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok,false,route.id+' / '+failure);
      assert.equal(state(b),before,route.id+' / '+failure);
    }
  }
});

test('ponte sans voie libre, royautés incompatibles et lignées étrangères sont refusées avant paiement',()=>{
  const laying=routeById.get('queen_laying'),b=fixture(laying),s=b.side(0);
  s.board[1]=b.makeUnit('X_DRONE',0);s.board[2]=b.makeUnit('X_WARRIOR',0);
  const before=state(b);assert.equal(b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok,false);assert.equal(state(b),before);
  const king=H.routes.find(r=>r.resultCardId==='H_ALIEN_KING'),k=fixture(king);
  k.side(0).board[1]=k.makeUnit('X_QUEEN',0);
  const beforeKing=state(k);assert.equal(k.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok,false);assert.equal(state(k),beforeKing);
  for(const root of Object.values(H.roots).filter(r=>r.steps[0]?.method.startsWith('GESTATION_'))){
    const m=battle();m.side(0).board[0]=m.makeUnit(root.terminalCardId,0);
    const jelly=routeById.get('royal_jelly');m.side(0).hand=[jelly.actionCardId];m.side(0).deck=[jelly.resultCardId];
    assert.equal(m.canPlay(0,0).ok,false,root.id+' ne doit pas être une mue de Drone');
  }
});

test('le diagnostic détecte explicitement résultat, matériau et catalyseur absents',()=>{
  const r=routeById.get('eggmorph'),d={[r.actionCardId]:1};
  const report=E.analyzeDeck(d,'XENO');
  assert(report.hive.some(n=>n.includes('résultat absent')));
  assert(report.hive.some(n=>n.includes('matériau compatible absent')));
  assert(report.hive.some(n=>n.includes('catalyseur compatible absent')));
});

test('les étapes et ressources des nouveaux cycles survivent à une reprise sans champ caché',()=>{
  for(const root of Object.values(H.roots).filter(r=>r.steps.some(step=>card(step.actionCardId).effect?.kind==='HIVE_ROUTE'))){
    const route=root.steps.find(step=>card(step.actionCardId).effect?.kind==='HIVE_ROUTE');
    const original=fixture(route),restored=S.restore(JSON.parse(JSON.stringify(S.capture(original))));
    const target=original.validTargets(route.actionCardId,0)[0];
    assert(original.playCard(0,0,target).ok);assert(restored.playCard(0,0,target).ok);
    assert.equal(state(original),state(restored),root.id);
    const after=S.restore(JSON.parse(JSON.stringify(S.capture(original))));assert.equal(state(original),state(after),root.id);
  }
});

test('les trois boosters de cycle restent uniques, spécialisés et compatibles avec la garantie UR',()=>{
  for(const id of D.hiveEdition.boosterIDs)for(const pity of [0,9])for(let seed=1;seed<=20;seed++){
    const result=E.openBooster(id,{pity,seed});assert.equal(result.pulls.length,9,id);
    assert.equal(new Set(result.pulls.map(p=>p.cardId)).size,9,id);
    assert(result.pulls.every(p=>card(p.cardId).tags.includes('hive-complete')&&card(p.cardId).faction===result.pack.primaryFaction),id);
    if(pity===9)assert(result.bestRank>=4,id);
  }
});
