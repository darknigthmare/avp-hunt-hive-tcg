#!/usr/bin/env node
// Full delivered runtime: source coverage, executable mechanics and finished duels.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadRuntime, runtimeModules, root} from './runtime-loader.mjs';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  const isLog = typeof value.text === 'string' && typeof value.tone === 'string';
  return Object.fromEntries(Object.keys(value).sort()
    .filter(key => !['uid', 'time', 'startedAt'].includes(key) && !(isLog && key === 'id'))
    .map(key => [key, canonical(value[key])]));
}
const continuation = battle => JSON.stringify(canonical({state:battle.state, rngState:battle.rng.getState()}));
export function checkCompleteState(battle, data, engine) {
  assert.equal(battle.state.sides.length, 2);
  for (const side of battle.state.sides) {
    assert.equal(side.board.length, data.rules.lanes);
    for (const field of ['life','energy','biomass','plasma','honor'])
      assert(Number.isFinite(side[field]) && side[field] >= 0, field + ' below zero or not finite');
    assert(side.life <= side.maxLife);
    assert(side.maxEnergy <= data.rules.maxEnergy);
    assert(side.energy <= 30, 'Temporary energy exceeded supported range');
    for (const field of ['biomass','plasma','honor']) assert(side[field] <= 12, field + ' exceeded cap');
    for (const unit of side.board.filter(Boolean)) {
      assert(engine.CARD.has(unit.cardId));
      assert(Number.isInteger(unit.currentHealth) && unit.currentHealth > 0);
      for (const pack of unit.ammoPacks || []) {
        const card = engine.CARD.get(pack.cardId);
        assert(card?.cardClass === 'MUNITION' && card.ammoType === pack.ammoType, 'Unknown ammunition pack');
        assert(Number.isInteger(pack.remaining) && pack.remaining >= 0 && pack.remaining <= card.rounds, 'Invalid remaining rounds');
      }
    }
  }
}

// Execute every new weapon, attached module, device operation and HIVE_ROUTE.
// Fixtures only arrange a legal pre-action board; all changes use public plays,
// attacks and checkpoint APIs, both before and after a deterministic restore.
export function exerciseCompleteMechanics(runtime) {
  const {AVP_DATA:D, AVPEngine:E, AVPDuelSave:S} = runtime;
  const coverage = {weapons:0, humanAmmoAttacks:0, yautjaAmmoAttacks:0, plasmaAttacks:0,
    reusableAttacks:0, weaponMods:0, deviceMods:0, services:0, techniques:0,
    hiveRoutes:0, resumedActions:0, refusedIncompleteActions:0, routeIds:[], weaponIds:[]};
  const additional = D.cards.slice(891);
  const newBattle = faction => {
    const deck = D.expansionDecks.find(p => p.faction === faction);
    const enemy = D.expansionDecks.find(p => p.faction === 'HUMAN');
    const b = new E.Battle({playerDeck:deck.cards, aiDeck:enemy.cards, seed:739103, difficulty:1});
    for (const side of b.state.sides) {
      side.board = [null,null,null]; side.hand = []; side.discard = [];
      side.energy = D.rules.maxEnergy; side.maxEnergy = D.rules.maxEnergy;
    }
    return b;
  };
  const carrier = faction => D.cards.find(c => c.cardClass === 'PERSONNAGE' && c.faction === faction && c.id.startsWith('MX_'));
  const prepareCarrier = (b, faction) => {
    const unit = b.makeUnit(carrier(faction).id, 0);
    b.side(0).board[0] = unit;
    return unit;
  };
  const prepareVictim = b => {
    const unit = b.makeUnit('X_WARRIOR', 1);
    unit.currentHealth = 10000; b.side(1).board[1] = unit;
  };
  const resumed = (b, action, label) => {
    const saved = S.capture(b), restored = S.restore(saved);
    assert.equal(JSON.stringify(S.capture(restored)), JSON.stringify(saved), label + ': checkpoint round trip');
    const originalResult=action(b),restoredResult=action(restored);
    assert.equal(originalResult?.ok,true,label+': original action '+(originalResult?.reason||''));
    assert.equal(restoredResult?.ok,true,label+': restored action '+(restoredResult?.reason||''));
    assert.equal(continuation(restored), continuation(b), label + ': continuation diverged');
    checkCompleteState(restored,D,E); coverage.resumedActions++;
    return restored;
  };
  const play = (b, card, target = {kind:'FRIENDLY_UNIT',lane:0}) => {
    b.side(0).energy = D.rules.maxEnergy;
    b.side(0).hand.push(card.id);
    return resumed(b, x => x.playCard(0,x.side(0).hand.lastIndexOf(card.id),target),card.id);
  };
  const refuse = (b, card, target = {kind:'FRIENDLY_UNIT',lane:0}) => {
    b.side(0).energy = D.rules.maxEnergy; b.side(0).hand = [card.id];
    b.syncHealthAuras();
    const before = JSON.stringify(S.capture(b));
    assert.equal(b.playCard(0,0,target).ok,false,card.id + ': incomplete dependency accepted');
    assert.equal(JSON.stringify(S.capture(b)),before,card.id + ': failed action consumed resources');
    b.side(0).hand = []; coverage.refusedIncompleteActions++;
  };
  const ammoTotal = (b,type) => (b.side(0).board[0].ammoPacks||[]).filter(p=>p.ammoType===type).reduce((n,p)=>n+p.remaining,0);
  for (const weapon of additional.filter(c=>c.slot==='WEAPON')) {
    let b = newBattle(weapon.faction); prepareCarrier(b,weapon.faction); prepareVictim(b);
    const mods = additional.filter(c=>c.cardClass==='MODIFICATION'&&c.compatibleFamilies?.includes(weapon.weaponFamily));
    assert(mods.length>0,weapon.id + ': module coverage absent');
    refuse(b,mods[0]);
    const bare = b.unitAttack(0,b.side(0).board[0]);
    b = play(b,weapon);
    if (weapon.ammoType || weapon.plasmaPerAttack) assert.equal(b.unitAttack(0,b.side(0).board[0]),bare,weapon.id + ': dry firing bonus');
    if (weapon.ammoType) {
      const ammo = additional.filter(c=>c.cardClass==='MUNITION'&&c.ammoType===weapon.ammoType);
      assert(ammo.length>0,weapon.id + ': missing ammunition');
      for (const card of ammo.slice(0,2)) b = play(b,card);
    } else if (weapon.plasmaPerAttack) {
      const reserve = additional.find(c=>c.effect?.kind==='CHARGE_PLASMA'&&c.compatibleFamilies?.includes(weapon.weaponFamily));
      assert(reserve,weapon.id + ': missing plasma reserve'); b = play(b,reserve,{kind:'NONE'});
    }
    // Alternative mods can share one socket; validate each from the same
    // loaded weapon checkpoint, never equip mutually exclusive alternatives.
    const loadedCheckpoint=S.capture(b);
    for (const mod of mods) {b=play(S.restore(loadedCheckpoint),mod);coverage.weaponMods++;}
    const technique = additional.find(c=>c.effect?.weaponFamily===weapon.weaponFamily||c.effect?.requiresWeaponFamilies?.includes(weapon.weaponFamily));
    assert(technique,weapon.id + ': missing associated action');
    const roundsBefore=ammoTotal(b,weapon.ammoType),plasmaBefore=b.side(0).plasma;
    b=play(b,technique,technique.effect.target==='ENEMY_UNIT'?{kind:'ENEMY_UNIT',lane:1}:{kind:'FRIENDLY_UNIT',lane:0});
    assert.equal(ammoTotal(b,weapon.ammoType),roundsBefore-(technique.effect.ammoCost||0),technique.id + ': ammunition cost');
    assert.equal(b.side(0).plasma,plasmaBefore-(technique.effect.plasmaCost||0),technique.id + ': plasma cost');
    if(technique.effect.stunTurns)assert(b.side(1).board[1].stunned>=technique.effect.stunTurns,technique.id + ': net did not stun');
    coverage.techniques++;
    const unit=b.side(0).board[0];unit.ready=true;unit.attacked=false;
    const rounds=ammoTotal(b,weapon.ammoType),plasma=b.side(0).plasma;
    const firing=b.combatWeaponState(0,unit);
    assert(firing.ready,weapon.id + ': loaded weapon not ready');
    b=resumed(b,x=>x.attack(0,0,{kind:'HERO'}),weapon.id + ': attack');
    assert.equal(ammoTotal(b,weapon.ammoType),rounds-(weapon.ammoPerAttack||0));
    assert.equal(b.side(0).plasma,plasma-(weapon.plasmaPerAttack||0));
    if(weapon.ammoType)coverage[weapon.faction==='YAUTJA'?'yautjaAmmoAttacks':'humanAmmoAttacks']++;
    else if(weapon.plasmaPerAttack)coverage.plasmaAttacks++;
    else coverage.reusableAttacks++;
    coverage.weapons++;coverage.weaponIds.push(weapon.id);
  }
  for (const device of additional.filter(c=>c.cardClass==='EQUIPEMENT')) {
    let b=newBattle(device.faction);prepareCarrier(b,device.faction);
    const mod=additional.find(c=>c.compatibleEquipmentIds?.includes(device.id));
    const service=additional.find(c=>c.effect?.requiresEquipmentIds?.includes(device.id));
    assert(mod&&service,device.id + ': incomplete device package');
    refuse(b,mod);refuse(b,service);
    b=play(b,device);b=play(b,mod);coverage.deviceMods++;
    assert(b.combatWeaponState(0,b.side(0).board[0]).activeEquipmentMods.some(c=>c.id===mod.id));
    b.side(0).board[0].currentHealth=Math.max(1,b.side(0).board[0].currentHealth-250);
    b=play(b,service);coverage.services++;
  }
  for (const card of additional.filter(c=>c.effect?.kind==='HIVE_ROUTE')) {
    const effect=card.effect;
    let b=newBattle(card.faction),side=b.side(0);
    const organic = ids => ids.find(id=>!E.CARD.get(id)?.keywords?.includes('SYNTHETIC'));
    const primary=organic(effect.materialIds); assert(primary,card.id+': primary material');
    side.board[0]=b.makeUnit(primary,0);
    const secondary=organic(effect.secondaryIds||[]),catalyst=organic(effect.catalystIds||[]);
    if(secondary)side.board[1]=b.makeUnit(secondary,0);
    if(catalyst)side.board[secondary?2:1]=b.makeUnit(catalyst,0);
    side.biomass=Math.max(2,effect.biomassCost||0);side.deck=[];
    refuse(b,card); // A legal material still cannot conjure a result absent from all zones.
    side=b.side(0);side.deck=[effect.resultCardId];
    const before={biomass:side.biomass,material:side.board[0].uid,catalyst:catalyst&&side.board.find(u=>u?.cardId===catalyst)?.uid};
    b=play(b,card);side=b.side(0);
    assert(side.board.some(u=>u?.cardId===effect.resultCardId),card.id+': no route result');
    assert(!side.deck.includes(effect.resultCardId)&&!side.hand.includes(effect.resultCardId),card.id+': result was duplicated');
    assert.equal(side.biomass,Math.min(12,before.biomass-(effect.biomassCost||0)+(effect.biomassGain||0)),card.id+': biomass accounting');
    assert.equal(side.discard.filter(id=>id===primary).length,effect.preserveMaterial?0:1,card.id+': material accounting');
    if(effect.preserveMaterial)assert(side.board.some(u=>u?.uid===before.material),card.id+': reproductive material lost');
    if(secondary)assert.equal(side.discard.filter(id=>id===secondary).length,1,card.id+': secondary material accounting');
    if(catalyst)assert(side.board.some(u=>u?.uid===before.catalyst),card.id+': catalyst lost');
    coverage.hiveRoutes++;coverage.routeIds.push(effect.routeId);
  }
  for(const field of ['humanAmmoAttacks','yautjaAmmoAttacks','plasmaAttacks','reusableAttacks','weaponMods','deviceMods','services','hiveRoutes'])
    assert(coverage[field]>0,'No executed coverage for '+field);
  assert.equal(coverage.hiveRoutes,additional.filter(c=>c.effect?.kind==='HIVE_ROUTE').length);
  return coverage;
}

export async function runCompleteQA() {
  const runtime=loadRuntime({rules:true,collection:true});
  const {AVP_DATA:D,AVPEngine:E,AVPDuelSave:S}=runtime;
  const decks=D.expansionDecks.slice(318);
  assert(decks.length>0&&D.arsenalDecks?.length&&D.hiveDecks?.length,'Complete recipes missing');
  const sourceHashes=Object.fromEntries([...runtimeModules.data,...runtimeModules.rules,'collection'].map(name=>[
    name+'.js',createHash('sha256').update(readFileSync(new URL('src/'+name+'.js',root))).digest('hex')]));
  const report={schema:'avp-tcg/complete-qa-v1',version:D.version,
    catalogue:{cards:D.cards.length,presets:D.expansionDecks.length,newCards:D.cards.length-891,newRecipes:decks.length,boosters:D.boosters.length},
    sourceHashes,totalGames:0,completedGames:0,unfinishedGames:0,checkpointRoundTrips:0,deterministicContinuations:0,
    maxHalfTurns:0,deckCoverage:{},matchups:{},mechanics:null,failures:[],
    note:'Contrôle déterministe de fonctionnement, de ressources et de reprise. Ce programme ne démontre pas un équilibrage compétitif.'};
  try {report.mechanics=exerciseCompleteMechanics(runtime);}
  catch(error){report.failures.push({label:'mechanics',error:error.stack});}
  const run=async(left,right,seed,label,modifiers=[])=>{
    report.totalGames++;
    for(const deck of [left,right])if(decks.some(p=>p.id===deck.id))report.deckCoverage[deck.id]=(report.deckCoverage[deck.id]||0)+1;
    const key=left.faction+' / '+right.faction;
    const matchup=report.matchups[key]??={games:0,leftWins:0,rightWins:0,draws:0,unfinished:0};matchup.games++;
    try {
      for(const deck of [left,right])assert(E.validateDeck(deck.cards,null,deck.faction).valid,deck.id+': invalid deck');
      let battle=new E.Battle({playerDeck:left.cards,aiDeck:right.cards,seed,difficulty:right.difficulty||1,modifiers});
      while(battle.state.winner===null&&battle.state.halfTurn<100){
        const before=battle.state.halfTurn,saved=S.capture(battle),restored=S.restore(saved);
        assert.equal(JSON.stringify(S.capture(restored)),JSON.stringify(saved),'Checkpoint changed state');
        report.checkpointRoundTrips++;
        if(before%4===0){
          await battle.takeAITurn(()=>Promise.resolve(),battle.state.active);
          await restored.takeAITurn(()=>Promise.resolve(),restored.state.active);
          assert.equal(continuation(restored),continuation(battle),'Checkpoint continuation diverged');
          report.deterministicContinuations++;
        }else await restored.takeAITurn(()=>Promise.resolve(),restored.state.active);
        battle=restored;checkCompleteState(battle,D,E);
        assert(battle.state.winner!==null||battle.state.halfTurn>before,'AI turn stalled');
      }
      report.maxHalfTurns=Math.max(report.maxHalfTurns,battle.state.halfTurn);
      if(battle.state.winner===null){report.unfinishedGames++;matchup.unfinished++;}
      else {report.completedGames++;if(battle.state.winner===0)matchup.leftWins++;else if(battle.state.winner===1)matchup.rightWins++;else matchup.draws++;}
    }catch(error){report.failures.push({left:left.id,right:right.id,seed,label,error:error.stack});}
  };
  for(let index=0;index<decks.length;index++){
    const original=decks[index],opponents=decks.filter(p=>p.faction!==original.faction);
    assert(opponents.length>0);
    for(let variant=0;variant<2;variant++){
      const seed=20261103+index*103+variant*7919,enemy=opponents[(index*7+variant*11)%opponents.length];
      const remixed=variant?D.remixPresetDeck(original,seed):null;
      const player=variant?{...original,cards:remixed.cards}:original;
      await run(variant?enemy:player,variant?player:enemy,seed,variant?'remixed-reverse-seat':'complete-recipe');
    }
  }
  const factions=Object.keys(D.factions).filter(faction=>faction!=='NEUTRAL');
  for(let a=0;a<factions.length;a++)for(let b=0;b<factions.length;b++){
    const seed=481103+a*131+b*397;
    await run({id:'ai-'+factions[a],faction:factions[a],cards:E.buildAiDeck([factions[a]],1.3,seed)},
      {id:'ai-'+factions[b],faction:factions[b],cards:E.buildAiDeck([factions[b]],1.3,seed+7)},seed,'generated-ai');
  }
  for(const mission of D.campaign){
    const seed=918103+mission.id*211;
    const faction=mission.factions?.[0]||mission.enemyFactions?.[0]||'XENO';
    const aiFactions=mission.factions||mission.enemyFactions||[faction];
    await run({id:'starter-human',faction:'HUMAN',cards:D.starterDecks.HUMAN.cards},
      {id:'campaign-'+mission.id,faction:aiFactions,difficulty:mission.difficulty,cards:E.buildAiDeck(aiFactions,mission.difficulty,seed)},seed,'campaign',mission.modifiers||[]);
  }
  for(const deck of decks)assert(report.deckCoverage[deck.id]>=2,deck.id+': not exercised in both seats');
  report.passed=report.failures.length===0&&report.unfinishedGames===0;
  return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const report=await runCompleteQA();
  const json=JSON.stringify(report,null,2)+'\n';
  const output=process.argv.find(arg=>arg.startsWith('--out='))?.slice(6);
  if(output)writeFileSync(output,json);
  if(process.argv.includes('--json'))process.stdout.write(json);
  else console.log(JSON.stringify({passed:report.passed,cards:report.catalogue.cards,newRecipes:report.catalogue.newRecipes,
    games:report.totalGames,completed:report.completedGames,failed:report.failures.length,unfinished:report.unfinishedGames,
    checkpointRoundTrips:report.checkpointRoundTrips,deterministicContinuations:report.deterministicContinuations,
    maxHalfTurns:report.maxHalfTurns,mechanics:report.mechanics&&{weapons:report.mechanics.weapons,
      deviceMods:report.mechanics.deviceMods,hiveRoutes:report.mechanics.hiveRoutes,resumedActions:report.mechanics.resumedActions}}));
  if(!report.passed){if(!process.argv.includes('--json'))console.error(JSON.stringify(report.failures,null,2));process.exitCode=1;}
}
