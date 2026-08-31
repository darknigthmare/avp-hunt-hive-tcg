import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const scripts = await Promise.all(['data','engine','duel-save','app'].map(name=>readFile(new URL(`../src/${name}.js`,import.meta.url),'utf8')));
const key='avp-hunt-hive-tcg-save-v1';

function boot({stored={},readFails=false,writeFails=false,confirm=true,liveTimers=false}={}){
  const values=new Map(Object.entries(stored)),nodes=new Map(),events=new Map(),warnings=[];
  const node=()=>({innerHTML:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    setAttribute(){},getAttribute(){return null;},appendChild(){},remove(){},focus(){},click(){},matches(){return false;},
    querySelector(){return null;},querySelectorAll(){return [];},addEventListener(name,handler){events.set(name,handler);}});
  const document={body:node(),activeElement:null,title:'',getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},
    querySelector(){return null;},createElement:node,addEventListener(name,handler){events.set(name,handler);}};
  const localStorage={getItem(id){if(readFails)throw Error('SecurityError');return values.get(id)||null;},
    setItem(id,value){if(writeFails)throw Error('QuotaExceededError');values.set(id,value);},removeItem(id){values.delete(id);}};
  let confirmationCalls=0;
  const context=vm.createContext({window:{matchMedia:()=>({matches:false}),scrollTo(){}},document,localStorage,
    navigator:{},location:{protocol:'file:',hostname:'',reload(){}},TextEncoder,URL,Blob,
    setTimeout:liveTimers?fn=>setTimeout(fn,0):()=>1,clearTimeout,confirm:()=>{confirmationCalls++;return confirm;},prompt:()=>null,
    console:{warn:(...args)=>warnings.push(args),error:(...args)=>warnings.push(args),log(){}}});
  for(const source of scripts)vm.runInContext(source,context);
  return {app:context.window.AVP_APP,data:context.window.AVP_DATA,engine:context.window.AVPEngine,duel:context.window.AVPDuelSave,values,nodes,events,warnings,confirmations:()=>confirmationCalls};
}

function giveStarter(env,faction='HUMAN'){
  const save=env.app.save.freshSave(),template=env.data.starterDecks[faction];
  save.starterChosen=true;save.tutorial.completed=true;
  save.collection={...template.cards};save.decks=[{id:'test-deck',name:'Test',faction,cards:{...template.cards}}];save.activeDeckId='test-deck';
  env.app.Store.data=save;env.app.Store.save();return env.app.Store.data;
}


const plain=v=>JSON.parse(JSON.stringify(v));
const mechanical=b=>{const s=plain(b.state);delete s.log;delete s.startedAt;for(const side of s.sides)for(const u of side.board.filter(Boolean))delete u.uid;return s;};
function battle(env){return new env.engine.Battle({seed:1009,playerDeck:env.data.starterDecks.HUMAN.cards,aiDeck:env.data.starterDecks.XENO.cards});}

test('RNG checkpoints preserve exact future draws including zero state',()=>{
  const {engine}=boot(),a=engine.U.rng(7),b=engine.U.rng(9);for(let i=0;i<32;i++)a();
  b.setState(a.getState());assert.deepEqual(Array.from({length:50},()=>a()),Array.from({length:50},()=>b()));
  a.setState(0);b.setState(0);assert.equal(a(),b());assert.throws(()=>a.setState(-1));
});

test('checkpoint roundtrip preserves every field and has no shared mutable references',()=>{
  const env=boot(),b=battle(env),snapshot=env.duel.capture(b),restored=env.duel.restore(snapshot);
  assert.deepEqual(plain(restored.state),plain(b.state));assert.equal(restored.id,b.id);
  restored.side(0).hand.pop();assert.notDeepEqual(plain(restored.state),plain(b.state));
  assert.deepEqual(plain(snapshot.state.sides[0].hand),plain(b.state.sides[0].hand));
});

test('ongoing duel continues identically after every complete AI turn checkpoint',async()=>{
  const env=boot(),original=battle(env);let restored=env.duel.restore(env.duel.capture(original));
  for(let i=0;i<100&&original.state.winner===null;i++){
    await original.takeAITurn(undefined,original.state.active);
    await restored.takeAITurn(undefined,restored.state.active);
    assert.deepEqual(mechanical(restored),mechanical(original));
    assert.equal(restored.rng.getState(),original.rng.getState());
    if(original.state.winner===null)restored=env.duel.restore(env.duel.capture(restored));
  }
  assert.notEqual(original.state.winner,null);
});

test('all campaign modifiers and generated board effects are checkpointable',async()=>{
  const env=boot();
  for(const m of env.data.campaign){
    const b=new env.engine.Battle({seed:42+m.id,playerDeck:env.data.starterDecks.HUMAN.cards,aiDeck:env.engine.buildAiDeck(m.factions,m.difficulty,42),difficulty:m.difficulty,modifiers:m.modifiers});
    for(let i=0;i<80&&b.state.winner===null;i++){
      assert.deepEqual(plain(env.duel.restore(env.duel.capture(b)).state),plain(b.state));
      await b.takeAITurn(undefined,b.state.active);
    }
    assert.notEqual(b.state.winner,null);
  }
});

test('mutations, armor, equipment, fatigue and location flags survive restoration',()=>{
  const env=boot(),b=battle(env),u=b.makeUnit('H_COLONIAL_MARINE',0);b.side(0).board[0]=u;
  b.applyMutation(0,u,200);u.armorUsed=true;u.tempGranted=['ARMOR'];u.equipment=['EQ_MARINE_ARMOR'];
  b.side(0).flags.bouvetUsed=true;b.side(0).fatigue=3;
  const restored=env.duel.restore(env.duel.capture(b));assert.deepEqual(plain(restored.state),plain(b.state));
});

test('untrusted checkpoints reject invalid cards, arrays, versions and numeric bounds',()=>{
  const env=boot(),snapshot=env.duel.capture(battle(env));
  const cases=[
    s=>s.version=99,s=>s.rngState=Infinity,s=>s.state.active=3,s=>s.state.halfTurn=7,
    s=>s.state.sides[0].hand.push('MISSING'),s=>s.state.sides[0].deck=Array(501).fill('H_MARINE'),
    s=>s.state.sides[0].board.push(null),s=>s.state.sides[0].life=0,
    s=>s.state.sides[0].location={cardId:'H_MARINE'},s=>s.state.sides[0].status.silenceFaction='__proto__',
    s=>s.state.winner=0,s=>s.id='"><script>',s=>s.state.sides[1].isAI=false
  ];
  for(const change of cases){const invalid=plain(snapshot);change(invalid);assert.throws(()=>env.duel.restore(invalid));}
});

test('unknown and prototype fields never enter restored engine objects',()=>{
  const env=boot(),snapshot=env.duel.capture(battle(env));
  const raw=JSON.parse(JSON.stringify(snapshot).replace('"schema":','"__proto__":{"polluted":true},"constructor":{},"schema":'));
  raw.state.sides[0].arbitrary={deep:'ignored'};
  const restored=env.duel.restore(raw);assert.equal(restored.polluted,undefined);assert.equal(restored.side(0).arbitrary,undefined);
  assert.equal(Object.hasOwn(restored,'constructor'),false);
});

test('checkpoint refuses an unresolved action and notifies only at stable boundaries',()=>{
  const env=boot(),b=battle(env);let calls=0;
  b.onChange=()=>{env.duel.capture(b);calls++;};
  b.resolve(()=>{assert.throws(()=>env.duel.capture(b));b.notify();b.notify();});
  assert.equal(calls,1);
});

test('save v2 migrates to v3 without losing collection, deck or settings',()=>{
  const env=boot(),raw=giveStarter(env);raw.version=2;delete raw.duel;raw.settings.largeText=true;
  const restored=env.app.save.sanitizeSave(raw);
  assert.equal(restored.version,3);assert.equal(restored.duel,null);assert.equal(restored.settings.largeText,true);
  assert.deepEqual(plain(restored.collection),plain(raw.collection));
});

test('starting then pausing and reloading restores exactly the same duel and RNG',async()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');
  const original=env.duel.capture(env.app.state.battleContext.battle);env.app.pauseBattle();
  assert.equal(env.app.state.battleContext,null);assert.ok(env.app.Store.data.duel);
  const reboot=boot({stored:Object.fromEntries(env.values)});assert.match(reboot.nodes.get('app').innerHTML,/Reprendre le duel/);
  await reboot.app.resumeBattle();
  assert.deepEqual(plain(reboot.duel.capture(reboot.app.state.battleContext.battle)),plain(original));
});

test('actions checkpoint automatically and exporting includes the paused duel',()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const b=env.app.state.battleContext.battle;
  b.side(0).hand=['H_COLONIAL_MARINE'];b.side(0).energy=10;
  const index=b.side(0).hand.findIndex((id,i)=>b.canPlay(0,i).ok);assert.ok(index>=0);
  const check=b.canPlay(0,index);b.playCard(0,index,check.targets[0]);
  assert.deepEqual(plain(env.app.Store.data.duel.checkpoint.state),plain(b.state));
  const exported=env.app.save.parseSaveImport(JSON.stringify(env.app.Store.data));
  assert.equal(exported.duel.checkpoint.id,b.id);
});

test('AI turn resumes from its starting checkpoint after an abrupt close',async()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const b=env.app.state.battleContext.battle;
  b.endTurn(0);const checkpoint=plain(env.app.Store.data.duel.checkpoint);
  const expected=env.duel.restore(checkpoint);await expected.takeAITurn();
  const reboot=boot({stored:Object.fromEntries(env.values),liveTimers:true});await reboot.app.resumeBattle();
  assert.deepEqual(mechanical(reboot.app.state.battleContext.battle),mechanical(expected));
  assert.equal(reboot.app.state.battleContext.aiBusy,false);
});

test('new launch cannot silently overwrite a suspended duel',()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const id=env.app.state.battleContext.battle.id;
  env.app.pauseBattle();env.app.startBattle('campaign',env.data.campaign[0]);
  assert.equal(env.app.state.battleContext.battle.id,id);assert.equal(env.app.state.battleContext.mode,'quick');
});

test('completion clears the checkpoint before rewarding and reload cannot award again',()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const ctx=env.app.state.battleContext;
  ctx.battle.damageHero(1,999999);const credits=env.app.Store.data.profile.credits;
  assert.equal(env.app.Store.data.duel,null);assert.equal(env.app.Store.data.history[0].battleId,ctx.battle.id);
  ctx.battle.onGameOver({winner:0,state:ctx.battle.state,reason:'duplicate'});
  assert.equal(env.app.Store.data.profile.credits,credits);
  const reboot=boot({stored:Object.fromEntries(env.values)});
  assert.equal(reboot.app.Store.data.duel,null);assert.equal(reboot.app.Store.data.profile.credits,credits);
});

test('abandon clears paused duel without rewards and corrupt checkpoint preserves the profile',()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const credits=env.app.Store.data.profile.credits;
  env.app.abandonBattle(false);assert.equal(env.app.Store.data.duel,null);assert.equal(env.app.Store.data.profile.credits,credits);
  const invalid=plain(env.app.Store.data);invalid.duel={mode:'quick',checkpoint:{version:99}};
  const restored=env.app.save.sanitizeSave(invalid);assert.equal(restored.duel,null);assert.equal(restored.profile.credits,credits);
});

test('old async duel callback cannot reward or overwrite a replacement imported profile',async()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const old=env.app.state.battleContext;
  const next=env.app.save.freshSave(),json=JSON.stringify(next);
  await env.app.save.importSaveFile({size:json.length,text:async()=>json});
  old.battle.damageHero(1,999999);
  assert.equal(env.app.Store.data.profile.wins,0);assert.equal(env.app.Store.data.duel,null);
});

test('completed battle ids and invalid campaign contexts cannot be resumed from imported JSON',()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const save=plain(env.app.Store.data);
  save.history=[{battleId:save.duel.checkpoint.id,winner:0}];assert.equal(env.app.save.sanitizeSave(save).duel,null);
  save.history=[];save.duel.mode='campaign';save.duel.missionId=8;assert.equal(env.app.save.sanitizeSave(save).duel,null);
});

test('failed checkpoint keeps navigation on the live duel instead of hiding it',async()=>{
  const env=boot();giveStarter(env);env.app.startBattle('quick');const ctx=env.app.state.battleContext;
  ctx.battle.rng.getState=()=>{throw new Error('Injected checkpoint failure');};
  await env.events.get('click')({target:{closest:()=>({dataset:{action:'nav',screen:'collection'},getAttribute:()=>null})}});
  assert.equal(env.app.state.screen,'battle');assert.equal(env.app.state.battleContext,ctx);
});
