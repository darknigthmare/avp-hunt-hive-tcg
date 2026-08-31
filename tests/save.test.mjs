import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const scripts = await Promise.all(['data','engine','duel-save','app'].map(name=>readFile(new URL(`../src/${name}.js`,import.meta.url),'utf8')));
const key='avp-hunt-hive-tcg-save-v1';

function boot({stored={},readFails=false,writeFails=false,confirm=true}={}){
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
    setTimeout:()=>1,clearTimeout(){},confirm:()=>{confirmationCalls++;return confirm;},prompt:()=>null,
    console:{warn:(...args)=>warnings.push(args),error:(...args)=>warnings.push(args),log(){}}});
  for(const source of scripts)vm.runInContext(source,context);
  return {app:context.window.AVP_APP,data:context.window.AVP_DATA,engine:context.window.AVPEngine,values,nodes,events,warnings,confirmations:()=>confirmationCalls};
}

function giveStarter(env,faction='HUMAN'){
  const save=env.app.save.freshSave(),template=env.data.starterDecks[faction];
  save.starterChosen=true;save.tutorial.completed=true;
  save.collection={...template.cards};save.decks=[{id:'test-deck',name:'Test',faction,cards:{...template.cards}}];save.activeDeckId='test-deck';
  env.app.Store.data=save;env.app.Store.save();return env.app.Store.data;
}

test('fresh save has explicit schema, version and safe settings',()=>{
  const {app}=boot(),save=app.save.freshSave();
  assert.equal(save.schema,'avp-hunt-hive-tcg-save');assert.equal(save.version,3);
  assert.equal(save.settings.contrast,false);assert.equal(save.settings.largeText,false);
  assert.equal(save.tutorial.completed,false);assert.equal(app.Store.persistent,true);
});

test('legacy v1 save migrates without losing collection or faction identity',()=>{
  const env=boot(),legacy=giveStarter(env);delete legacy.schema;legacy.version=1;delete legacy.tutorial;
  const save=env.app.save.sanitizeSave(legacy);
  assert.equal(save.version,3);assert.equal(save.decks[0].faction,'HUMAN');
  assert.deepEqual(JSON.parse(JSON.stringify(save.collection)),JSON.parse(JSON.stringify(legacy.collection)));
  assert.equal(save.tutorial.completed,true);
});

test('save import rejects foreign, incomplete and future documents',()=>{
  const {app}=boot(),valid=app.save.freshSave();
  for(const invalid of [null,[],{}, {profile:{},collection:{}}, {...valid,schema:'another-game'},
    {...valid,version:4},{...valid,version:'2'},{...valid,version:0}]){
    assert.throws(()=>app.save.sanitizeSave(invalid));
  }
  assert.throws(()=>app.save.parseSaveImport('{no json'));
});

test('untrusted profile numbers, unknown cards and impossible deck counts are bounded',()=>{
  const env=boot(),raw=giveStarter(env),id=Object.keys(raw.collection)[0];
  raw.profile.credits=-500;raw.profile.level=100000;raw.profile.completedMissions=999;
  raw.collection[id]=2;raw.collection.unknown=30;raw.decks[0].cards[id]=300;raw.decks[0].cards.unknown=3;
  raw.profile.name='Commander\u0000';raw.settings.sound='false';raw.history=[{winner:-1,reward:-10,round:Infinity}];
  const save=env.app.save.sanitizeSave(raw);
  assert.equal(save.profile.credits,0);assert.equal(save.profile.level,999);assert.equal(save.profile.completedMissions,8);
  assert.equal(save.profile.name,'Commander');assert.equal(save.collection.unknown,undefined);
  assert.equal(save.decks[0].cards[id],2);assert.equal(save.decks[0].cards.unknown,undefined);
  assert.equal(save.settings.sound,true);assert.equal(save.history[0].winner,-1);assert.equal(save.history[0].reward,0);
});

test('prototype keys from JSON never propagate into saved state',()=>{
  const {app}=boot(),valid=app.save.freshSave();
  const raw=JSON.parse(JSON.stringify(valid).replace('"collection":{}','"collection":{"__proto__":{"polluted":true},"constructor":12}'));
  const save=app.save.sanitizeSave(raw);
  assert.equal(Object.hasOwn(save.collection,'__proto__'),false);
  assert.equal(Object.hasOwn(save.collection,'constructor'),false);assert.equal({}.polluted,undefined);
});

test('deck identifiers are deduplicated and missing active deck falls back safely',()=>{
  const env=boot(),raw=giveStarter(env);raw.decks.push({...raw.decks[0]});raw.activeDeckId='absent';
  const clean=env.app.save.sanitizeSave(raw);
  assert.equal(new Set(clean.decks.map(d=>d.id)).size,2);assert.equal(clean.activeDeckId,clean.decks[0].id);
});

test('imported deck identifiers cannot inject HTML attributes',()=>{
  const env=boot(),raw=giveStarter(env),unsafe='deck" autofocus onfocus="alert(1)';
  raw.decks[0].id=unsafe;raw.activeDeckId=unsafe;raw.decks[0].faction='constructor';
  const safe=env.app.save.sanitizeSave(raw);
  assert.match(safe.decks[0].id,/^[a-zA-Z0-9_-]+$/);
  assert.equal(safe.activeDeckId,safe.decks[0].id);assert.equal(safe.decks[0].faction,'MIXED');
  env.app.Store.data=safe;env.app.state.screen='decks';env.app.render();
  assert.doesNotMatch(env.nodes.get('app').innerHTML,/onfocus=|autofocus onfocus/);
});

test('future wrapper version is not bypassed by a supported inner save',()=>{
  const {app}=boot(),valid=app.save.freshSave();
  assert.throws(()=>app.save.sanitizeSave({schema:valid.schema,version:4,data:valid}),/Version/);
  assert.equal(app.save.sanitizeSave({schema:valid.schema,version:2,data:valid}).version,3);
});


test('corrupt primary save restores validated backup',()=>{
  const first=boot();giveStarter(first);const backup=JSON.stringify(first.app.Store.data);
  const restored=boot({stored:{[key]:'{broken',[key+'-backup']:backup}});
  assert.equal(restored.app.Store.data.starterChosen,true);assert.equal(restored.app.Store.data.activeDeckId,'test-deck');
});

test('denied localStorage leaves a usable temporary profile without throwing',()=>{
  const {app,nodes}=boot({readFails:true});
  assert.equal(app.Store.persistent,false);assert.equal(app.Store.data.profile.credits,6500);
  app.Store.data.profile.credits=42;assert.equal(app.Store.save(),false);assert.equal(app.Store.data.profile.credits,42);
  app.render();assert.match(nodes.get('app').innerHTML,/Stockage local indisponible/);
});

test('quota failure keeps modified progress available for export',()=>{
  const {app}=boot({writeFails:true});app.Store.data.profile.credits=1234;
  assert.equal(app.Store.save(),false);assert.equal(app.Store.persistent,false);
  assert.equal(app.save.parseSaveImport(JSON.stringify(app.Store.data)).profile.credits,1234);
});

test('one-megabyte import limit applies to file size and UTF-8 payload',async()=>{
  const {app}=boot();
  await assert.rejects(()=>app.save.importSaveFile({size:1024*1024+1,text:async()=>''}),/1 Mo/);
  assert.throws(()=>app.save.parseSaveImport('é'.repeat(524289)),/1 Mo/);
  await assert.rejects(()=>app.save.importSaveFile({size:0,text:async()=>''}),/1 Mo/);
});

test('valid import requires confirmation; rejection preserves current state',async()=>{
  const env=boot({confirm:false}),incoming=env.app.save.freshSave();incoming.profile.credits=11;
  const text=JSON.stringify(incoming),before=JSON.stringify(env.app.Store.data);
  assert.equal(await env.app.save.importSaveFile({size:text.length,text:async()=>text}),false);
  assert.equal(env.confirmations(),1);assert.equal(JSON.stringify(env.app.Store.data),before);
});

test('invalid import is rejected before asking to replace any data',async()=>{
  const env=boot(),before=JSON.stringify(env.app.Store.data);
  await assert.rejects(()=>env.app.save.importSaveFile({size:2,text:async()=>'{}'}));
  assert.equal(env.confirmations(),0);assert.equal(JSON.stringify(env.app.Store.data),before);
});

test('confirmed import persists a sanitized profile',async()=>{
  const env=boot(),incoming=giveStarter(env);incoming.profile.credits=9001;
  const text=JSON.stringify(incoming);
  assert.equal(await env.app.save.importSaveFile({size:text.length,text:async()=>text}),true);
  assert.equal(env.confirmations(),1);assert.equal(JSON.parse(env.values.get(key)).profile.credits,9001);
});

test('abandon awards no credits, experience, trophies or achievements',()=>{
  const env=boot(),save=giveStarter(env),before={credits:save.profile.credits,xp:save.profile.xp,trophies:save.profile.totalTrophies};
  env.app.startBattle('quick');env.app.state.battleContext.battle.state.sides[0].totalTrophies=20;
  env.app.abandonBattle(false);const after=env.app.Store.data;
  assert.equal(after.profile.credits,before.credits);assert.equal(after.profile.xp,before.xp);
  assert.equal(after.profile.totalTrophies,before.trophies);assert.equal(after.profile.losses,1);
  assert.equal(Object.keys(after.achievements).length,0);assert.equal(after.history[0].reward,0);
  assert.equal(after.history[0].xp,0);assert.equal(after.history[0].abandoned,true);
});

test('locked campaign mission cannot be launched through app API',()=>{
  const env=boot();giveStarter(env);env.app.startBattle('campaign',env.data.campaign[7]);
  assert.equal(env.app.state.battleContext,null);assert.equal(env.app.Store.data.profile.completedMissions,0);
});

test('first campaign victory grants its advertised booster once, replay is reduced',()=>{
  const env=boot();giveStarter(env);
  const total=()=>Object.values(env.app.Store.data.collection).reduce((sum,n)=>sum+n,0);
  const before=total();env.app.startBattle('campaign',env.data.campaign[0]);
  env.app.state.battleContext.battle.damageHero(1,99999);
  assert.equal(env.app.Store.data.profile.completedMissions,1);assert.equal(total(),before+9);
  assert.equal(env.app.Store.data.profile.packsOpened,1);assert.equal(env.app.Store.data.history[0].replay,false);
  const credits=env.app.Store.data.profile.credits;env.app.startBattle('campaign',env.data.campaign[0]);env.app.state.battleContext.battle.damageHero(1,99999);
  assert.equal(total(),before+9);assert.equal(env.app.Store.data.profile.packsOpened,1);
  assert.equal(env.app.Store.data.history[0].replay,true);assert.equal(env.app.Store.data.history[0].xp,180);
  assert.equal(env.app.Store.data.profile.credits-credits,Math.round(env.data.campaign[0].reward*.35));
});

test('collection render starts with a bounded page and an explicit load-more action',()=>{
  const {app,nodes}=boot();app.state.screen='collection';app.render();
  const html=nodes.get('app').innerHTML;
  assert.equal((html.match(/data-action="view-card"/g)||[]).length,48);assert.match(html,/data-action="more-cards"/);
});

test('tutorial has four visible steps and remains reachable in the header',()=>{
  const {app,nodes}=boot();app.showTutorial(0);assert.match(nodes.get('modal-root').innerHTML,/ÉTAPE 1 \/ 4/);
  app.showTutorial(3);assert.match(nodes.get('modal-root').innerHTML,/ÉTAPE 4 \/ 4/);
  assert.match(nodes.get('modal-root').innerHTML,/data-action="tutorial-finish"/);
  assert.match(nodes.get('app').innerHTML,/data-action="tutorial"/);
});
