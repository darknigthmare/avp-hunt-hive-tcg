import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const files=['data.js','expansion.js','expansion-wave2.js','deck-productions.js',
  'asymmetric-cards.js','asymmetric-decks.js','engine.js','asymmetric-rules.js','duel-save.js'];
const scripts=files.map(file=>readFileSync(new URL('../src/'+file,import.meta.url),'utf8'));
function fixture(faction='HUMAN'){
  const context=vm.createContext({window:{},Intl,Date,Math});
  for(let i=0;i<files.length;i++)vm.runInContext(scripts[i],context,{filename:files[i],timeout:6000});
  const D=context.window.AVP_DATA,E=context.window.AVPEngine,S=context.window.AVPDuelSave;
  const b=new E.Battle({playerDeck:D.asymmetricDecks.find(p=>p.faction===faction).cards,
    aiDeck:D.asymmetricDecks.find(p=>p.faction==='XENO').cards,seed:42});
  b.side(0).energy=10;b.side(0).maxEnergy=10;
  const get=pred=>D.cards.find(pred);
  const play=(card,target={kind:'NONE'})=>{
    b.side(0).hand.push(card.id);b.side(0).energy=10;
    const result=b.playCard(0,b.side(0).hand.length-1,target);
    assert.equal(result.ok,true,card.name+': '+result.reason);return result;
  };
  const soldier=get(c=>c.id.startsWith('MX_')&&c.cardClass==='PERSONNAGE'&&c.faction===faction);
  return {D,E,S,b,get,play,soldier};
}
const plain=v=>JSON.parse(JSON.stringify(v));
const ready=u=>{u.ready=true;u.attacked=false;};

test('ammo bonuses do not create damage when the complete debuffed attack remains negative',()=>{
  const {b,get,play,soldier}=fixture();
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType&&c.ammoBonus>0);
  const u=b.summonAt(0,soldier.id,0);
  play(gun,{kind:'FRIENDLY_UNIT',lane:0});play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  u.attackBonus=-10000;
  assert.equal(b.unitAttack(0,u),0);
});

test('weapon status exposes exact loaded, dry, and base attack states without changing the duel',()=>{
  const {b,get,play,soldier}=fixture();
  const u=b.summonAt(0,soldier.id,0);
  assert.equal(b.combatWeaponState(0,u).mode,'NONE');
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType);
  play(gun,{kind:'FRIENDLY_UNIT',lane:0});
  const before=plain(b.state),dry=b.combatWeaponState(0,u);
  assert.equal(dry.mode,'AMMO');assert.equal(dry.ready,false);assert.equal(dry.available,0);
  assert.equal(dry.required,gun.ammoPerAttack);assert.equal(dry.weapon.id,gun.id);
  assert.deepEqual(plain(b.state),before);
  play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.combatWeaponState(0,u).ready,true);
  assert.equal(b.combatWeaponState(0,u).available,ammo.rounds);
});

test('new weapons only target characters or vehicles with their faction, including dual-faction characters',()=>{
  const {b,get,soldier}=fixture();
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const plasma=get(c=>c.plasmaPerAttack);
  b.summonAt(0,soldier.id,0);b.summonAt(0,'H_RIPLEY8',1);b.summonAt(0,'X_WARRIOR',2);
  assert.deepEqual(plain(b.validTargets(gun,0)),[{kind:'FRIENDLY_UNIT',lane:0}]);
  assert.equal(b.validTargets(plasma,0).length,0);
  b.side(0).board[1]=null;
  const vehicle=get(c=>c.cardClass==='VEHICULE'&&c.faction==='HUMAN');
  assert(b.summonAt(0,vehicle.id,1));
  assert.deepEqual(plain(b.validTargets(gun,0)),[{kind:'FRIENDLY_UNIT',lane:0},{kind:'FRIENDLY_UNIT',lane:1}]);
  b.side(0).board[2]=null;b.summonAt(0,'H_MACHIKO',2);
  assert.deepEqual(plain(b.validTargets(plasma,0)),[{kind:'FRIENDLY_UNIT',lane:2}]);
});

test('a passive sight still reveals cloak while its gun is dry and supplies no attack bonus',()=>{
  const {b,get,play,soldier}=fixture();
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const sight=get(c=>c.cardClass==='MODIFICATION'&&c.effect.seeCloak&&c.compatibleFamilies.includes('pulse'));
  const u=b.summonAt(0,soldier.id,0),opponent=b.summonAt(1,'Y_JUNGLE_HUNTER',0);
  assert(opponent);opponent.cloaked=true;
  const base=b.unitAttack(0,u);
  assert.equal(b.canSeeCloak(0,opponent),false);
  play(gun,{kind:'FRIENDLY_UNIT',lane:0});play(sight,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.combatWeaponState(0,u).ready,false);
  assert.equal(b.unitAttack(0,u),base);
  assert.equal(b.canSeeCloak(0,opponent),true);
});

test('Machiko earns combat honor through her documented Human and Yautja affiliation',()=>{
  const {b}=fixture();
  const machiko=b.summonAt(0,'H_MACHIKO',0),victim=b.summonAt(1,'X_OVOMORPH',0);
  victim.currentHealth=1;ready(machiko);
  assert.equal(b.isFaction(machiko,'HUMAN'),true);
  assert.equal(b.isFaction(machiko,'YAUTJA'),true);
  const honor=b.side(0).honor;
  assert(b.attack(0,0,{kind:'UNIT',lane:0}).ok);
  assert.equal(b.side(0).honor,honor+1);
});

test('friendly destruction cannot farm trophies, combat honor or kill triggers',()=>{
  const {b,soldier}=fixture('YAUTJA');
  const hunter=b.summonAt(0,soldier.id,0),victim=b.summonAt(0,'X_OVOMORPH',1);
  const before={honor:b.side(0).honor,trophies:b.side(0).trophies,kills:hunter.kills};
  b.damageUnit(0,1,victim.currentHealth+1,{kind:'COMBAT',sourceSide:0,unit:hunter});
  assert.deepEqual({honor:b.side(0).honor,trophies:b.side(0).trophies,kills:hunter.kills},before);
});

test('untrusted saves reject extra weapon slots, incompatible mods and more than six magazines',()=>{
  const {S,b,get,play,soldier}=fixture();
  b.summonAt(0,soldier.id,0);
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const wrongMod=get(c=>c.cardClass==='MODIFICATION'&&!c.compatibleFamilies.includes('pulse'));
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType);
  play(gun,{kind:'FRIENDLY_UNIT',lane:0});play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  const saved=S.capture(b);
  const cases=[u=>u.equipment.push(gun.id),u=>u.equipment.push(wrongMod.id),u=>{
    for(let i=0;i<6;i++){u.equipment.push(ammo.id);u.ammoPacks.push({...u.ammoPacks[0]});}
  }];
  for(const change of cases){const forged=plain(saved);change(forged.state.sides[0].board[0]);assert.throws(()=>S.restore(forged));}
  assert.doesNotThrow(()=>S.restore(saved));
});

test('imported weapon and ammunition carriers obey the same class and faction rules as live play',()=>{
  const {S,b,get,play,soldier}=fixture();
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType);
  const plasma=get(c=>c.plasmaPerAttack);
  b.summonAt(0,soldier.id,0);play(gun,{kind:'FRIENDLY_UNIT',lane:0});play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  const valid=S.capture(b);
  assert.equal(valid.rulesVersion,2,'New checkpoints identify the strict attachment rules.');
  for(const cardId of ['X_WARRIOR','H_RIPLEY8']){
    const forged=plain(valid);forged.state.sides[0].board[0].cardId=cardId;
    assert.throws(()=>S.restore(forged),'Cannot import a Human gun onto '+cardId);
  }
  const wrongFaction=plain(valid),unit=wrongFaction.state.sides[0].board[0];
  unit.equipment=[plasma.id];unit.ammoPacks=[];
  assert.throws(()=>S.restore(wrongFaction),'A Human character without the Yautja faction cannot import a caster.');
  unit.cardId='H_MACHIKO';
  assert.doesNotThrow(()=>S.restore(wrongFaction),'Machiko legitimately counts as Human and Yautja.');
  const ammoOnly=plain(valid);ammoOnly.state.sides[0].board[0].equipment=[ammo.id];
  ammoOnly.state.sides[0].board[0].cardId='X_WARRIOR';
  assert.throws(()=>S.restore(ammoOnly),'Ammunition alone cannot be imported onto a creature.');
});

test('real historical checkpoints grandfather only their already attached incompatible weapon',()=>{
  const fixtures=JSON.parse(readFileSync(new URL('./fixtures/legacy-asymmetric-weapons-v1.json',import.meta.url),'utf8'));
  assert.equal(fixtures.sourceCommit,'89a45d877fb4e946235471c8a76eb0c78c9cb91c');
  for(const sample of fixtures.cases){
    const {S,E}=fixture(),old=sample.checkpoint,restored=S.restore(old),unit=restored.side(0).board[0];
    assert.equal(old.rulesVersion,undefined);
    assert.deepEqual(plain(unit.legacyWeaponAttachment),{carrierUid:unit.uid,carrierCardId:sample.carrierId,weaponCardId:sample.weaponId});
    const state=plain(restored.state);delete state.sides[0].board[0].legacyWeaponAttachment;
    assert.deepEqual(state,old.state,'Migration preserves every card, hit point, resource and log entry.');
    assert.equal(restored.rng.getState(),old.rngState);
    const saved=S.capture(restored);assert.equal(saved.rulesVersion,2);
    assert.deepEqual(plain(S.capture(S.restore(saved))),plain(saved),'The narrow exception survives another pause and resume.');
    const bare=plain(saved);delete bare.state.sides[0].board[0].legacyWeaponAttachment;
    assert.throws(()=>S.restore(bare),'A new-rules checkpoint without a legacy exception stays strict.');
    const differentCarrier=plain(saved);differentCarrier.state.sides[0].board[0].legacyWeaponAttachment.carrierUid='a-different-unit';
    assert.throws(()=>S.restore(differentCarrier),'The exception cannot transfer to another unit identity.');
    const doubled=plain(old);doubled.state.sides[0].board[0].equipment.push(sample.weaponId);
    assert.throws(()=>S.restore(doubled),'Historical migration keeps the original one-weapon limit.');
    unit.equipment=[];unit.ammoPacks=[];
    const unequipped=S.capture(restored);
    assert.equal(unequipped.state.sides[0].board[0].legacyWeaponAttachment,undefined,'A removed weapon loses its exception.');
    assert(!restored.validTargets(E.CARD.get(sample.weaponId),0).some(t=>t.lane===0),'The new live rules still forbid equipping another incompatible weapon.');
  }
});

test('legacy checkpoints acquire zero-valued faction resources under the new rules',()=>{
  const {S,b,soldier,get}=fixture();b.summonAt(0,soldier.id,0);
  const saved=plain(S.capture(b));
  for(const s of saved.state.sides){delete s.honor;delete s.plasma;delete s.biomass;for(const u of s.board)if(u)delete u.ammoPacks;}
  const restored=S.restore(saved);
  for(const s of restored.state.sides){assert.equal(s.honor,0);assert.equal(s.plasma,0);assert.equal(s.biomass,0);}
  assert.equal(restored.side(0).board[0].ammoPacks.length,0);
  const ammo=get(c=>c.cardClass==='MUNITION');
  restored.side(0).hand=[ammo.id];restored.side(0).energy=10;
  assert(restored.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok);
  assert.equal(restored.side(0).board[0].ammoPacks[0].remaining,ammo.rounds);
});

test('corrected F44AA magazines migrate their former type while other forged types are rejected',()=>{
  const {S,b,get,play,soldier}=fixture();
  b.summonAt(0,soldier.id,0);
  for(const id of ['MX_HU_050','MX_HU_051','MX_HU_052'])play(get(c=>c.id===id),{kind:'FRIENDLY_UNIT',lane:0});
  const prior=plain(S.capture(b));
  for(const pack of prior.state.sides[0].board[0].ammoPacks)pack.ammoType='CELLULE';
  const restored=S.restore(prior),packs=restored.side(0).board[0].ammoPacks;
  assert.deepEqual(Array.from(packs,p=>p.ammoType),['F44AA','F44AA','F44AA']);
  assert.deepEqual(Array.from(packs,p=>p.remaining),prior.state.sides[0].board[0].ammoPacks.map(p=>p.remaining));
  assert.deepEqual(Array.from(restored.side(0).board[0].equipment),prior.state.sides[0].board[0].equipment);
  const forged=plain(prior);forged.state.sides[0].board[0].ammoPacks[0].ammoType='10MM';
  assert.throws(()=>S.restore(forged));
  const unrelated=plain(prior),round=get(c=>c.cardClass==='MUNITION'&&c.ammoType==='10MM');
  unrelated.state.sides[0].board[0].ammoPacks[0]={cardId:round.id,ammoType:'CELLULE',remaining:1,ammoBonus:round.ammoBonus};
  unrelated.state.sides[0].board[0].equipment[0]=round.id;
  assert.throws(()=>S.restore(unrelated),'CELLULE is not a wildcard for every ammunition card.');
});

test('an enemy elimination with plasma keeps the printed honor rule and spends the charge',()=>{
  const {b,get,play,soldier}=fixture('YAUTJA');
  const hunter=b.summonAt(0,soldier.id,0),victim=b.summonAt(1,'X_OVOMORPH',0);
  const caster=get(c=>c.plasmaPerAttack===1);
  play(caster,{kind:'FRIENDLY_UNIT',lane:0});b.side(0).plasma=1;
  victim.currentHealth=1;hunter.currentHealth=5000;ready(hunter);
  const honor=b.side(0).honor;
  assert(b.attack(0,0,{kind:'UNIT',lane:0}).ok);
  assert.equal(b.side(0).honor,honor+1);assert.equal(b.side(0).plasma,0);
});

test('a counterattack with too few rounds uses its carrier attack and consumes no partial salvo',()=>{
  const {b,get,soldier}=fixture();
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='smart'&&c.ammoPerAttack===2);
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType);
  const attacker=b.summonAt(0,soldier.id,0),defender=b.summonAt(1,soldier.id,0);
  const base=b.unitAttack(1,defender,attacker);
  defender.equipment=[gun.id,ammo.id];
  defender.ammoPacks=[{cardId:ammo.id,ammoType:ammo.ammoType,remaining:1,ammoBonus:ammo.ammoBonus}];
  attacker.currentHealth=defender.currentHealth=10000;ready(attacker);
  const health=attacker.currentHealth;
  assert(b.attack(0,0,{kind:'UNIT',lane:0}).ok);
  assert.equal(health-attacker.currentHealth,base);
  assert.equal(defender.ammoPacks[0].remaining,1);
});

test('the Hive AI keeps its last lane for a host and completes fusion instead of placing a third egg',async()=>{
  const {b,get}=fixture('XENO');
  const egg=get(c=>c.cardClass==='OEUF'&&c.cost===0&&c.eggLine==='COMMON');
  const hug=get(c=>c.requiresEgg&&c.eggLine==='COMMON');
  const host=get(c=>c.cardClass==='HOTE'&&c.hostType==='HUMAN');
  const fusion=get(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType==='HUMAN');
  b.summonAt(0,egg.id,0);b.summonAt(0,egg.id,1);
  b.side(0).hand=[egg.id,host.id,hug.id,fusion.id];
  b.side(0).deck=[fusion.effect.resultCardId];
  await b.takeAITurn(()=>Promise.resolve(),0);
  assert(b.side(0).board.some(u=>u?.cardId===fusion.effect.resultCardId),'The available host and Facehugger must produce their larva.');
  assert(b.side(0).board.filter(u=>u&&b.card(u.cardId).cardClass==='OEUF').length<3);
});

test('the Hive AI does not fill its three lanes with hosts when the parasitic material is missing',async()=>{
  const {D,b,get}=fixture('XENO');
  const hosts=D.cards.filter(c=>c.cardClass==='HOTE').slice(0,3);
  const nutrient=get(c=>c.cardClass==='BIOMASSE');
  b.side(0).hand=hosts.map(c=>c.id);b.side(0).deck=[nutrient.id,nutrient.id,nutrient.id];
  await b.takeAITurn(()=>Promise.resolve(),0);
  assert.equal(b.side(0).board.filter(u=>u&&b.card(u.cardId).cardClass==='HOTE').length,1);
  assert(b.side(0).board.filter(u=>u===null).length>=2,'Keep room for an egg and its subsequent fusion.');
});
