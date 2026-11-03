import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const baselineFiles=['data','expansion','expansion-wave2','deck-productions','asymmetric-cards','asymmetric-decks'];
const files=[...baselineFiles,'arsenal-cards','arsenal-decks','engine','asymmetric-rules','arsenal-rules','duel-save'];
const context=vm.createContext({window:{},Intl,Math,Date});
let baseline;
for(const file of files){
  if(file==='arsenal-cards')baseline=JSON.stringify(context.window.AVP_DATA.cards);
  vm.runInContext(readFileSync(new URL('../src/'+file+'.js',import.meta.url),'utf8'),context,{filename:file+'.js',timeout:10000});
}
const {AVP_DATA:D,AVPEngine:E,AVPDuelSave:S}=context.window;
const plain=value=>JSON.parse(JSON.stringify(value));
const refs=D.arsenalCoverage.entries.filter(e=>e.status==='integrated');
const newCards=D.arsenalEdition.cardIds.map(id=>E.CARD.get(id));
const count=map=>Object.values(map).reduce((n,q)=>n+q,0);
const bySource=id=>refs.find(e=>e.sourceId===id);
function battle(faction='HUMAN'){
  const b=new E.Battle({seed:1507,playerDeck:D.arsenalDecks.find(d=>d.faction===faction).cards,aiDeck:D.starterDecks.XENO.cards});
  b.side(0).energy=10;b.side(0).maxEnergy=10;b.side(0).board=[null,null,null];b.side(1).board=[null,null,null];
  b.side(0).board[0]=b.makeUnit(faction==='HUMAN'?'MX_HU_001':'MX_YA_001',0);
  return b;
}
function play(b,id,target={kind:'FRIENDLY_UNIT',lane:0}){
  b.side(0).energy=10;b.side(0).hand=[id];
  const result=b.playCard(0,0,target);assert(result?.ok,id+': '+result?.reason);return result;
}
function checkpoint(b){const snap=S.capture(b),restored=S.restore(snap);assert.deepEqual(plain(restored.state),plain(b.state));return restored;}
function prepareWeapon(entry){
  const b=battle(entry.faction),weapon=E.CARD.get(entry.cardIds[0]);
  play(b,weapon.id);
  for(const id of entry.ammoCardIds.slice(0,1)){const c=E.CARD.get(id);play(b,id,c.type==='TACTIC'?{kind:'NONE'}:{kind:'FRIENDLY_UNIT',lane:0});}
  return {b,weapon};
}
function dependencies(cards,main){
  const list=Object.keys(main).map(id=>E.CARD.get(id)),some=fn=>list.some(fn);
  for(const card of cards){const e=card.effect||{};
    if(card.ammoType&&card.slot==='WEAPON')assert(some(c=>c.cardClass==='MUNITION'&&c.ammoType===card.ammoType),card.id);
    if(card.cardClass==='MUNITION')assert(some(c=>c.slot==='WEAPON'&&c.ammoType===card.ammoType),card.id);
    if(card.plasmaPerAttack)assert(some(c=>c.effect?.kind==='CHARGE_PLASMA'),card.id);
    if(card.cardClass==='MODIFICATION')assert(card.compatibleEquipmentIds?.length?card.compatibleEquipmentIds.some(id=>main[id]):some(c=>c.slot==='WEAPON'&&card.compatibleFamilies.includes(c.weaponFamily)),card.id);
    if(e.requiresEquipmentIds?.length)assert(e.requiresEquipmentIds.some(id=>main[id]),card.id);
    if(e.requiresWeaponFamilies?.length)assert(some(c=>c.slot==='WEAPON'&&e.requiresWeaponFamilies.includes(c.weaponFamily)),card.id);
    if(['WEAPON_TECHNIQUE','ARSENAL_PLASMA_SHOT'].includes(e.kind))assert(some(c=>c.slot==='WEAPON'&&c.weaponFamily===e.weaponFamily),card.id);
  }
}

test('891 cartes préservées exactement ; toutes les 134 armes et 113 pièces historiques sont reliées',()=>{
  assert.equal(JSON.stringify(D.cards.slice(0,891)),baseline);
  assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
  assert.equal(refs.length,233);assert.equal(newCards.length,985);
  const historical=D.cards.slice(0,891).filter(c=>['HUMAN','YAUTJA'].includes(c.faction)&&['ARME','EQUIPEMENT'].includes(c.cardClass));
  assert.equal(historical.filter(c=>c.cardClass==='ARME').length,134);
  assert.equal(historical.filter(c=>c.cardClass==='EQUIPEMENT').length,113);
  const mapped=new Set(refs.flatMap(e=>e.legacyCardIds));
  for(const c of historical)assert(mapped.has(c.id),c.id);
  for(const entry of D.arsenalCoverage.entries){
    for(const key of ['legacyCardIds','cardIds','ammoCardIds','modCardIds','supportCardIds'])for(const id of entry[key])assert(E.CARD.has(id),entry.sourceId+': '+id);
    if(entry.status==='research-only'){assert.equal(entry.cardIds.length,0);assert(entry.notes.includes('non admise'));}
    else assert(entry.cardIds.length&&entry.deckIds.length,entry.sourceId);
  }
  assert.equal(D.arsenalCoverage.totals.researchRecords,129);
  assert.equal(D.arsenalCoverage.totals.researchOnly,121);
  assert.equal(D.arsenalCoverage.totals.coveredAliases,8);
  assert.equal(D.arsenalCoverage.entries.find(e=>e.sourceId==='proposed-predator-netgun').faction,'YAUTJA');
});

test('chaque référence possède les ressources pertinentes ; couteaux, appareils et accessoires ne deviennent pas des fusils',()=>{
  for(const e of refs){
    const card=E.CARD.get(e.cardIds[0]);
    if(e.kind==='weapon'){
      assert.equal(card.slot,'WEAPON');assert(card.attack>0);assert(e.modCardIds.length>=2);assert(e.supportCardIds.length);
      if(e.resourceMode==='projectile'){assert(card.ammoType&&card.ammoPerAttack===1);assert(e.ammoCardIds.length>=2);}
      else if(e.resourceMode==='plasma'){assert.equal(card.plasmaPerAttack,1);assert(!card.ammoType);assert(e.ammoCardIds.some(id=>E.CARD.get(id).effect?.kind==='CHARGE_PLASMA'));}
      else{assert(!card.ammoType&&!card.plasmaPerAttack);assert.equal(e.ammoCardIds.length,0);}
    }
    if(e.kind==='equipment'){assert.equal(card.cardClass,'EQUIPEMENT');assert.equal(e.ammoCardIds.length,0);assert(e.modCardIds.every(id=>E.CARD.get(id).compatibleEquipmentIds.includes(card.id)));assert(e.supportCardIds.length);}
    if(e.kind==='consumable'){assert.equal(card.type,'TACTIC');assert.equal(e.ammoCardIds.length,0);assert.equal(e.modCardIds.length,0);}
  }
  assert.equal(bySource('profile.whw.equipment.aliens1986-knife').resourceMode,'melee');
  assert.equal(bySource('profile.whw.equipment.dd-sniper-silencer').kind,'modification');
  assert.equal(bySource('profile.whw.equipment.aliens1986-smartgun-harness').kind,'modification');
  assert.equal(bySource('profile.whw.equipment.isolation-plasma-torch').kind,'equipment');
  assert.equal(bySource('item.yautja.plasma_whip').resourceMode,'melee');
  const yautjaTypes=refs.filter(e=>e.faction==='YAUTJA'&&e.resourceMode==='projectile').map(e=>E.CARD.get(e.cardIds[0]).ammoType);
  assert.equal(new Set(yautjaTypes).size,yautjaTypes.length);
  for(const card of newCards){assert(card.tags.includes('asymmetric')&&card.tags.includes('arsenal'));assert.equal(card.sourcePolicy,'arsenal-gameplay-adaptation-not-canon-statistics');assert(D.rarities[card.rarity]);}
});

test('233 recettes et leurs remix ont toutes les dépendances ; chaque nouvelle carte est distribuable',()=>{
  const distributed=new Set();
  for(const preset of D.arsenalDecks){
    for(const recipe of [preset,...[0,1,42,4294967295].map(seed=>D.remixPresetDeck(preset,seed))]){
      assert.equal(count(recipe.cards),30,preset.id);assert.equal(count(recipe.reserve),15,preset.id);
      assert(E.validateDeck(recipe.cards,null,preset.faction).valid,preset.id);
      for(const [id,q] of Object.entries(recipe.reserve))assert(q+(recipe.cards[id]||0)<=3,preset.id+': '+id);
      const cards=[...new Set([...Object.keys(recipe.cards),...Object.keys(recipe.reserve)])].map(id=>E.CARD.get(id));
      dependencies(cards,recipe.cards);
      assert.deepEqual(plain(E.analyzeDeck(recipe.cards,preset.faction).asymmetric),[],preset.id);
    }
    for(const id of [...Object.keys(preset.cards),...Object.keys(preset.reserve)])distributed.add(id);
    assert.equal(JSON.stringify(D.remixPresetDeck(preset,42)),JSON.stringify(D.remixPresetDeck(preset,42)),preset.id);
  }
  for(const card of newCards){
    assert(distributed.has(card.id),'Carte absente de toutes les recettes : '+card.id);
    assert(D.boosters.some(p=>p.poolTag==='arsenal'&&p.set===card.set&&p.primaryFaction===card.faction),card.id);
  }
  for(const packId of D.arsenalEdition.boosterIDs){
    const pack=D.boosters.find(p=>p.id===packId),pool=newCards.filter(c=>c.set===pack.set&&c.faction===pack.primaryFaction);
    assert.equal(new Set(pool.map(c=>c.rarity)).size,7,packId);
    for(const seed of [1,29,1407,4294967295]){
      const opened=E.openBooster(packId,{seed,pity:9});
      const pulls=opened.pulls||opened.cards||opened;
      assert.equal(pulls.length,9,packId);
      assert(pulls.some(p=>D.rarities[E.CARD.get(p.cardId).rarity].rank>=4),packId);
      for(const p of pulls)assert(pool.some(c=>c.id===p.cardId),packId+': '+p.cardId);
    }
  }
});

test('toutes les 127 armes se montent, leurs mods augmentent l’attaque et leurs ressources sont consommées',()=>{
  for(const entry of refs.filter(e=>e.kind==='weapon')){
    const b=battle(entry.faction),u=b.side(0).board[0],weapon=E.CARD.get(entry.cardIds[0]),base=b.unitAttack(0,u);
    play(b,weapon.id);
    for(const id of entry.modCardIds.slice(0,2))play(b,id);
    const mods=entry.modCardIds.slice(0,2).map(id=>E.CARD.get(id));
    if(['projectile','plasma'].includes(entry.resourceMode))assert.equal(b.unitAttack(0,u),base,entry.sourceId+' : arme déchargée');
    if(entry.ammoCardIds.length){const a=E.CARD.get(entry.ammoCardIds[0]);play(b,a.id,a.type==='TACTIC'?{kind:'NONE'}:{kind:'FRIENDLY_UNIT',lane:0});}
    assert.equal(b.unitAttack(0,u),base+weapon.attack+mods.reduce((n,c)=>n+c.attack,0),entry.sourceId);
    const before=b.combatWeaponState(0,u);assert.equal(before.activeMods.length,2,entry.sourceId);
    u.ready=true;u.attacked=false;
    assert.notEqual(b.attack(0,0,{kind:'HERO'})?.ok,false,entry.sourceId);
    const after=b.combatWeaponState(0,u);
    if(entry.resourceMode==='projectile'||entry.resourceMode==='plasma')assert.equal(after.available,before.available-1,entry.sourceId);
    else assert.equal(after.available,0,entry.sourceId);
    checkpoint(b);
  }
});

test('les 87 appareils ont un renfort et un service effectifs, persistants, réservés au bon appareil',()=>{
  for(const entry of refs.filter(e=>e.kind==='equipment')){
    const b=battle(entry.faction),u=b.side(0).board[0],gear=E.CARD.get(entry.cardIds[0]),mod=E.CARD.get(entry.modCardIds[0]),service=E.CARD.get(entry.supportCardIds[0]);
    assert.equal(b.validTargets(mod,0).length,0,entry.sourceId);
    assert.equal(b.validTargets(service,0).length,0,entry.sourceId);
    const before=b.unitMaxHealth(0,u);play(b,gear.id);play(b,mod.id);
    assert.equal(b.unitMaxHealth(0,u),before+gear.health+mod.health,entry.sourceId);
    assert.equal(b.validTargets(mod,0).length,0,'Deux modules identiques : '+entry.sourceId);
    assert.equal(b.combatWeaponState(0,u).activeEquipmentMods[0].id,mod.id);
    if(service.effect.kind==='REPAIR_UNIT')u.currentHealth-=350;
    assert(b.validTargets(service,0).some(t=>t.lane===0),entry.sourceId);
    const previous={health:u.currentHealth,attack:b.unitAttack(0,u)};
    play(b,service.id);
    if(service.effect.kind==='REPAIR_UNIT')assert(u.currentHealth>previous.health,entry.sourceId);
    if(['BUFF_AND_RUSH','REVEAL_AND_BUFF'].includes(service.effect.kind))assert(b.unitAttack(0,u)>previous.attack,entry.sourceId);
    if(service.effect.kind==='GRANT')assert(u.cloaked,entry.sourceId);
    if(service.effect.kind==='BUFF_TARGET')assert(u.currentHealth>previous.health,entry.sourceId);
    checkpoint(b);
  }
});

test('les techniques projectiles, plasma et mêlée respectent leur arme et la consommation, y compris le filet',()=>{
  for(const entry of refs.filter(e=>e.kind==='weapon')){
    const b=battle(entry.faction),u=b.side(0).board[0],technique=E.CARD.get(entry.supportCardIds[0]);
    b.side(1).board[0]=b.makeUnit('X_DRONE',1);b.side(1).board[0].healthBonus=2000;b.side(1).board[0].currentHealth=3000;
    assert.equal(b.validTargets(technique,0).length,0,entry.sourceId);
    play(b,entry.cardIds[0]);
    if(entry.ammoCardIds.length){
      assert.equal(b.validTargets(technique,0).length,0,entry.sourceId+' : ressource manquante');
      const c=E.CARD.get(entry.ammoCardIds[0]);play(b,c.id,c.type==='TACTIC'?{kind:'NONE'}:{kind:'FRIENDLY_UNIT',lane:0});
    }
    const resource=b.combatWeaponState(0,u).available,before=b.side(1).board[0].currentHealth;
    const target={kind:technique.effect.target,lane:0};play(b,technique.id,target);
    if(technique.effect.target==='ENEMY_UNIT'){
      assert(b.side(1).board[0].currentHealth<before,entry.sourceId);
      assert.equal(b.combatWeaponState(0,u).available,resource-(technique.effect.plasmaCost||technique.effect.ammoCost),entry.sourceId);
    }else assert.equal(u.tempAttack,240,entry.sourceId);
    if(technique.effect.stunTurns)assert.equal(b.side(1).board[0].stunned,1,entry.sourceId);
    checkpoint(b);
  }
});

test('la dernière charge d’une technique perforante conserve les dégâts des charges précédentes contre Armure',()=>{
  const precision=refs.filter(e=>e.resourceMode==='projectile'&&E.CARD.get(e.cardIds[0]).keywords.includes('PIERCING'));
  assert(precision.length>0);
  for(const entry of precision)for(const rounds of [1,2]){
    const {b}=prepareWeapon(entry),s=b.side(0),u=s.board[0],ammo=entry.ammoCardIds[0];
    const technique=E.CARD.get(entry.supportCardIds[0]);u.ammoPacks[0].remaining=rounds;
    const victim=b.makeUnit('X_DRONE',1);b.side(1).board[0]=victim;
    victim.granted.push('ARMOR');victim.healthBonus=3000;victim.currentHealth=3500;
    const before=victim.currentHealth;
    play(b,technique.id,{kind:'ENEMY_UNIT',lane:0});
    assert.equal(before-victim.currentHealth,technique.effect.damage,entry.sourceId+' / '+rounds+' charge(s)');
    assert.equal(victim.armorUsed,false,entry.sourceId+' : Perforation traverse Armure');
    assert.equal(b.combatWeaponState(0,u).available,rounds-1,entry.sourceId);
    assert.equal(s.discard.filter(id=>id===ammo).length,rounds===1?1:0,entry.sourceId);
    if(rounds===1)assert.equal(b.has(u,'PIERCING'),false,'L’arme vide doit cesser de conférer Perforation après le tir');
    checkpoint(b);
  }
});

test('la dernière technique et la mort acide du porteur ne dupliquent pas sa munition défaussée',()=>{
  const entry=refs.find(e=>e.resourceMode==='projectile'&&E.CARD.get(e.cardIds[0]).keywords.includes('PIERCING'));
  const {b}=prepareWeapon(entry),s=b.side(0),u=s.board[0],ammo=entry.ammoCardIds[0];
  const technique=E.CARD.get(entry.supportCardIds[0]);u.ammoPacks[0].remaining=1;u.currentHealth=1;
  b.side(1).board[0]=b.makeUnit('X_WARRIOR',1);b.side(1).board[0].currentHealth=100;
  play(b,technique.id,{kind:'ENEMY_UNIT',lane:0});
  assert.equal(b.side(1).board[0],null);assert.equal(s.board[0],null);
  assert.equal(s.discard.filter(id=>id===ammo).length,1);
  assert.equal(s.discard.filter(id=>id===entry.cardIds[0]).length,1);
  checkpoint(b);
});

test('montages incompatibles et points de reprise falsifiés sont refusés ; doubles factions acceptées',()=>{
  const h=bySource('item.m41a-pulse-rifle'),y=bySource('item.yautja.netgun'),gear=bySource('item.motion-tracker');
  const b=battle('YAUTJA'),u=b.side(0).board[0];
  assert.equal(b.validTargets(h.cardIds[0],0).length,0);assert.equal(b.validTargets(h.ammoCardIds[0],0).length,0);assert.equal(b.validTargets(gear.cardIds[0],0).length,0);
  const original=S.capture(b),foreign=plain(original);foreign.state.sides[0].board[0].equipment.push(gear.cardIds[0]);
  assert.throws(()=>S.restore(foreign));
  u.extraFactions=['HUMAN'];
  assert(b.validTargets(h.cardIds[0],0).length);assert(b.validTargets(h.ammoCardIds[0],0).length);assert(b.validTargets(gear.cardIds[0],0).length);
  play(b,h.cardIds[0]);play(b,h.ammoCardIds[0]);play(b,gear.cardIds[0]);play(b,gear.modCardIds[0]);checkpoint(b);
  assert.equal(b.validTargets(y.modCardIds[0],0).length,0);
  const snap=S.capture(b),mismatched=plain(snap);mismatched.state.sides[0].board[0].equipment.push(y.modCardIds[0]);assert.throws(()=>S.restore(mismatched));
  const orphan=plain(snap);orphan.state.sides[0].board[0].equipment=orphan.state.sides[0].board[0].equipment.filter(id=>id!==gear.cardIds[0]);assert.throws(()=>S.restore(orphan));
  const duplicate=plain(snap);duplicate.state.sides[0].board[0].equipment.push(gear.modCardIds[0]);assert.throws(()=>S.restore(duplicate));
  const restored=checkpoint(b);assert.equal(restored.validTargets(gear.modCardIds[0],0).length,0);
});
