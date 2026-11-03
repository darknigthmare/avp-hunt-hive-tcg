import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=name=>readFileSync(new URL('../src/'+name+'.js',import.meta.url),'utf8');
const moduleSource=source('collection');
const apiContext=vm.createContext({window:{},Intl});
vm.runInContext(moduleSource,apiContext);
const {createModel}=apiContext.window.AVPCollection;
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture(){
  const card=(id,name,faction,rarity,cardClass,index)=>({id,name,faction,rarity,cardClass,type:cardClass==='PERSONNAGE'?'UNIT':'EQUIPMENT',set:index<2?'A':'B',cost:index+1,index,searchText:name.toLowerCase()});
  return {cards:[card('a','Éclaireur','HUMAN','C','PERSONNAGE',0),card('b','Canon','HUMAN','R','ARME',1),card('c','Chasseur','YAUTJA','C','PERSONNAGE',2),card('d','Lame','YAUTJA','UR','ARME',3)],
    rules:{maxCopies:3,deckSize:3},rarities:{C:{name:'Commune',rank:1,dust:10},R:{name:'Rare',rank:2,dust:20},UR:{name:'Ultra Rare',rank:4,dust:100}},
    factions:{HUMAN:{name:'Humains'},YAUTJA:{name:'Yautja'}},cardClasses:{PERSONNAGE:'Personnages',ARME:'Armes'},sets:{A:{name:'Alpha'},B:{name:'Bêta'},PLANNED:{name:'Projet sans carte'}},
    expansionDecks:[{id:'first',name:'Alpha',faction:'HUMAN',category:'STRUCTURE',cards:{a:2,b:1},reserve:{a:1,c:1}},{id:'second',name:'Bêta',faction:'HUMAN',category:'STRUCTURE',cards:{a:1,b:2},reserve:{d:1}}]};
}

test('collection totals distinguish unique cards, copies, duplicates and complete playsets without mutation',()=>{
  const data=fixture(),collection={a:5,b:2,c:1,d:0,notInCatalogue:99};
  const before=JSON.stringify({data,collection}),model=createModel(data,collection),s=model.summary();
  assert.deepEqual(plain(s),{total:4,owned:3,copies:8,duplicates:5,spares:2,fullPlaysets:1,playsetCopies:6,playsetTotal:12,missing:1,playsetMissing:6,ratio:.75,playsetRatio:.5});
  model.groups('faction');model.filterCards({sort:'OWNED_DESC'});model.deckGroups();model.relatedCards('b');
  assert.equal(JSON.stringify({data,collection}),before);
});

test('empty and malformed ownership never produces a completed collection or invalid percentage',()=>{
  const data=fixture(),collection=Object.assign(Object.create({a:3}),{b:-1,c:Infinity,d:1.5,ghost:900});
  const model=createModel(data,collection);
  assert.equal(model.summary().owned,0);assert.equal(model.summary().ratio,0);assert.equal(model.summary().copies,0);
  assert.equal(createModel({...data,cards:[]},{}).summary().ratio,0);
  assert.equal(model.quantity('ghost'),0);
});

test('progress groups contain active cards only and their unique counts reconcile to the catalogue',()=>{
  const model=createModel(fixture(),{a:3,c:1});
  for(const field of ['faction','rarity','type','set']){
    const groups=model.groups(field);
    assert.equal(groups.reduce((n,g)=>n+g.total,0),4,field);
    assert.equal(groups.reduce((n,g)=>n+g.owned,0),2,field);
  }
  assert(!model.groups('set').some(g=>g.id==='PLANNED'));
  assert.deepEqual(Array.from(model.groups('rarity'),g=>g.id),['C','R','UR']);
});

test('card search is accent-insensitive and quantity, ownership and stable sorting filters combine',()=>{
  const data=fixture(),model=createModel(data,{a:5,b:2,c:1});
  assert.deepEqual(Array.from(model.filterCards({query:'eclaireur'}),c=>c.id),['a']);
  assert.deepEqual(Array.from(model.filterCards({owned:'MISSING'}),c=>c.id),['d']);
  assert.deepEqual(Array.from(model.filterCards({owned:'OWNED',quantity:'TWO',faction:'HUMAN'}),c=>c.id),['b']);
  assert.deepEqual(Array.from(model.filterCards({owned:'SPARES'}),c=>c.id),['a']);
  assert.deepEqual(Array.from(model.filterCards({owned:'PLAYSET'}),c=>c.id),['a']);
  assert.deepEqual(Array.from(model.filterCards({owned:'DUPLICATES',sort:'OWNED_DESC'}),c=>c.id),['a','b']);
  assert.deepEqual(Array.from(model.filterCards({sort:'RARITY_ASC'}),c=>c.id),['c','a','b','d']);
  assert.deepEqual(data.cards.map(c=>c.id),['a','b','c','d']);
});

test('historical cards sharing a collector number remain searchable without changing their card IDs',()=>{
  const data=fixture();data.cards[0].collectorNo='CW02-MX-002';data.cards[1].collectorNo='CW02-MX-002';
  const model=createModel(data,{});
  assert.deepEqual(Array.from(model.filterCards({query:'CW02-MX-002',sort:'INDEX'}),c=>c.id),['a','b']);
  assert.deepEqual(Array.from(model.filterCards({query:'a'}),c=>c.id),['a']);
});

test('reserve completion adds requirements for repeated cards instead of reusing the main copies',()=>{
  const model=createModel(fixture(),{a:2,b:1}),main=model.deckCoverage('catalogue:first'),box=model.deckCoverage('catalogue:first',true);
  assert.equal(main.total,3);assert.equal(main.available,3);assert(main.complete);assert(main.mainReady);
  assert.equal(box.total,5);assert.equal(box.available,3);assert.equal(box.missing,2);assert.equal(box.dust,40);assert(!box.complete);assert(box.mainReady);
  const a=box.rows.find(row=>row.id==='a');assert.equal(a.required,3);assert.equal(a.available,2);assert.equal(a.missing,1);
});

test('deck categories count the union of cards while each recipe uses its own ownership requirements',()=>{
  const model=createModel(fixture(),{a:2,b:1});
  const group=model.deckGroups().find(g=>g.id==='STRUCTURE');
  assert.equal(group.total,2);assert.equal(group.owned,2);assert.equal(group.recipes,2);assert.equal(group.ready,1);
  assert.equal(model.filterDecks({status:'READY'}).length,1);
  assert.equal(model.filterDecks({includeReserve:true,status:'READY'}).length,0);
  assert.equal(model.filterDecks({sort:'NEAREST'})[0].recipe.id,'first');
});

test('unknown required cards stay visible and cannot falsely mark a recipe complete',()=>{
  const data=fixture();data.expansionDecks.push({id:'missing',name:'Ancienne recette',faction:'HUMAN',cards:{a:1,lost:2},category:'SPECIAL'});
  const covered=createModel(data,{a:2,lost:2}).deckCoverage('catalogue:missing');
  assert.equal(covered.total,3);assert.equal(covered.available,1);assert.equal(covered.missing,2);assert.equal(covered.unknown,1);assert(!covered.complete);assert(!covered.mainReady);
  assert(covered.rows.some(row=>row.id==='lost'&&row.unknown));
});

test('new catalogue cards and saved decks are reflected on the next read, with independent source groups',()=>{
  const data=fixture(),collection={a:2,b:1};data.starterDecks={HUMAN:{name:'Départ',cards:{a:2,b:1}}};
  const first=createModel(data,collection),saved=[{id:'mine',name:'Mon deck',faction:'HUMAN',cards:{a:2,b:1}}];
  data.cards.push({...data.cards[0],id:'new',name:'Renfort',index:4});collection.new=3;
  const second=createModel(data,collection,saved);
  assert.equal(first.summary().total,4);assert.equal(second.summary().total,5);
  assert.equal(second.filterDecks({source:'SAVED'}).length,1);assert.equal(second.filterDecks({source:'STARTER'}).length,1);
  assert.equal(second.filterDecks({source:'SAVED'})[0].recipe.key,'saved:mine');
  assert.equal(second.quantity('new'),3);
});

test('weapon links obey exact ammunition and module families and evolution links use real card IDs',()=>{
  const data=fixture();Object.assign(data.cards[1],{ammoType:'CAL12',weaponFamily:'shot'});
  data.cards.push({id:'ammo',name:'Cartouches',cardClass:'MUNITION',ammoType:'CAL12'},
    {id:'wrong',name:'Chargeur',cardClass:'MUNITION',ammoType:'9MM'},
    {id:'mod',name:'Crosse',cardClass:'MODIFICATION',compatibleFamilies:['shot']},
    {id:'otherMod',name:'Canon',cardClass:'MODIFICATION',compatibleFamilies:['pulse']},
    {id:'evolve',name:'Mue',effect:{kind:'HIVE_EVOLVE',resultCardId:'c',fromStage:'LARVA'}});
  const model=createModel(data,{}),related=model.relatedCards('b');
  assert.deepEqual(Array.from(related.find(g=>g.title==='Munitions compatibles').cards,c=>c.id),['ammo']);
  assert.deepEqual(Array.from(related.find(g=>g.title==='Modules compatibles').cards,c=>c.id),['mod']);
  assert.deepEqual(Array.from(model.relatedCards('c').find(g=>g.title==='Cartes permettant cette évolution').cards,c=>c.id),['evolve']);
});

test('legacy variants, device services and exact route materials remain navigable in both directions',()=>{
  const data=fixture();
  data.cards.push({id:'variant',name:'Canon Arsenal',cardClass:'ARME',weaponFamily:'variant'},
    {id:'device',name:'Détecteur',cardClass:'EQUIPEMENT'},
    {id:'module',name:'Renfort',cardClass:'MODIFICATION',compatibleEquipmentIds:['device']},
    {id:'service',name:'Balayage',effect:{requiresEquipmentIds:['device']}},
    {id:'route',name:'Gestation',effect:{kind:'HIVE_ROUTE',resultCardId:'d',materialIds:['a'],secondaryIds:['c'],catalystIds:['device']}});
  data.arsenalCoverage={entries:[{legacyCardIds:['b'],cardIds:['variant'],modCardIds:['module'],supportCardIds:['service']}]};
  data.hiveCoverage={routes:[{actionCardId:'route',resultCardId:'d',materialCardIds:['a','c'],catalystCardIds:['device']}]};
  const model=createModel(data,{}),ids=id=>new Set(model.relatedCards(id).flatMap(group=>group.cards.map(card=>card.id)));
  assert(ids('b').has('variant'));assert(ids('b').has('service'));
  assert(ids('device').has('module'));assert(ids('device').has('service'));assert(ids('device').has('route'));
  assert(ids('module').has('device'));assert(ids('service').has('device'));
  assert(ids('route').has('a'));assert(ids('route').has('c'));assert(ids('route').has('device'));assert(ids('route').has('d'));
  assert(ids('a').has('route'));
});

function bootApp(){
  const nodes=new Map(),events=new Map(),downloads=[];
  const node=id=>({id,innerHTML:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    setAttribute(){},getAttribute(){return null;},appendChild(){},remove(){},focus(){},click(){},matches(){return false;},
    querySelector(){return null;},querySelectorAll(){return [];},addEventListener(name,handler){events.set(id+':'+name,handler);}});
  const document={body:node('body'),activeElement:null,title:'',getElementById(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);},querySelector(){return null;},createElement:()=>node('temp'),addEventListener(){}};
  const storage=new Map(),context=vm.createContext({window:{matchMedia:()=>({matches:false}),scrollTo(){}},document,
    localStorage:{getItem:id=>storage.get(id)||null,setItem:(id,value)=>storage.set(id,value),removeItem:id=>storage.delete(id)},
    navigator:{},location:{protocol:'file:',hostname:'',reload(){}},TextEncoder,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:collection-export';},revokeObjectURL(){}},Blob,Intl,
    setTimeout:()=>1,clearTimeout(){},confirm:()=>true,prompt:()=>null,console});
  for(const name of ['data','engine','duel-save','collection','app'])vm.runInContext(source(name),context,{filename:name+'.js'});
  const app=context.window.AVP_APP;
  return {app,data:context.window.AVP_DATA,nodes,downloads,async click(action,details={}){const el={dataset:{action,...details},disabled:false,getAttribute(){return null;}};await events.get('app:click')({target:{closest:()=>el}});}};
}

test('all collection views are read-only and personal recipe names are escaped',()=>{
  const env=bootApp(),{app,data,nodes}=env;
  app.Store.data.starterChosen=true;app.Store.data.tutorial.completed=true;
  app.Store.data.collection={...data.starterDecks.HUMAN.cards};
  app.Store.data.decks=[{id:'safe',name:'<img src=x onerror=alert(1)>',faction:'HUMAN',cards:{...data.starterDecks.HUMAN.cards}}];
  const before=JSON.stringify(app.Store.data);
  app.state.screen='collection';
  for(const view of ['cards','progress','decks']){app.state.collectionView=view;app.render();assert.match(nodes.get('app').innerHTML,/Progression de votre collection/);}
  assert.equal(JSON.stringify(app.Store.data),before);
  assert.doesNotMatch(nodes.get('app').innerHTML,/<img src=x/);
  assert.match(nodes.get('app').innerHTML,/&lt;img src=x/);
});

test('collection recipe creation never grants missing cards and preserves owned quantities',async()=>{
  const env=bootApp(),{app,data}=env;
  app.Store.data.starterChosen=true;app.Store.data.tutorial.completed=true;
  await env.click('collection-build-deck',{recipeKey:'starter:HUMAN'});
  assert.equal(app.Store.data.decks.length,0);assert.equal(Object.keys(app.Store.data.collection).length,0);
  app.Store.data.collection={...data.starterDecks.HUMAN.cards};
  const before=JSON.stringify(app.Store.data.collection);
  await env.click('collection-build-deck',{recipeKey:'starter:HUMAN'});
  assert.equal(app.Store.data.decks.length,1);assert.equal(JSON.stringify(app.Store.data.collection),before);
  assert.equal(Object.values(app.Store.data.decks[0].cards).reduce((a,b)=>a+b,0),30);
});

test('progression tiles open their full card group despite unrelated previous filters',async()=>{
  const env=bootApp(),{app,data}=env;
  app.state.screen='collection';app.state.collectionView='progress';
  for(const [field,value] of [['faction','HUMAN'],['rarity','C'],['type','UNIT'],['set',data.cards[0].set]]){
    app.state.filters={query:'not-a-card',faction:'YAUTJA',type:'TACTIC',rarity:'GR',set:'not-a-set',owned:'SPARES',quantity:'TWO',sort:'OWNED_ASC'};
    await env.click('collection-filter-group',{groupField:field,groupValue:value});
    const actual=createModel(data,{}).filterCards(app.state.filters);
    const expected=data.cards.filter(card=>field==='type'?(card.type===value||card.cardClass===value):card[field]===value);
    assert.equal(actual.length,expected.length,field);assert(actual.length>0,field);
    assert.equal(app.state.collectionView,'cards');
  }
});

test('deck progression tile opens the advertised principal group without stale search or source filters',async()=>{
  const env=bootApp(),{app,data}=env;
  app.state.screen='collection';app.state.collectionView='progress';
  app.state.collectionDeckFilters={query:'not-a-recipe',category:'PERSONNEL',faction:'YAUTJA',source:'SAVED',status:'READY',sort:'DUST',includeReserve:true};
  await env.click('collection-deck-group',{groupValue:'DEPART'});
  const recipes=createModel(data,{}).filterDecks(app.state.collectionDeckFilters);
  assert.equal(recipes.length,Object.keys(data.starterDecks).length);
  assert(recipes.every(row=>row.recipe.category==='DEPART'&&!row.includeReserve));
});

test('owned personal recipes with an invalid or unselected identity cannot be created from Collection',async()=>{
  const env=bootApp(),{app,data,nodes}=env;
  app.Store.data.starterChosen=true;app.Store.data.tutorial.completed=true;
  app.Store.data.collection={...data.starterDecks.HUMAN.cards};
  for(const identity of ['YAUTJA','MIXED']){
    app.Store.data.decks=[{id:'invalid',name:'Ancien deck',faction:identity,cards:{...data.starterDecks.HUMAN.cards}}];
    const before=JSON.stringify(app.Store.data);
    await env.click('collection-deck-detail',{recipeKey:'saved:invalid'});
    assert.match(nodes.get('modal-root').innerHTML,/data-action="collection-build-deck"[^>]*disabled/);
    await env.click('collection-build-deck',{recipeKey:'saved:invalid'});
    assert.equal(JSON.stringify(app.Store.data),before);
  }
});

test('inventory export reflects exact ownership and missing playset copies without modifying progression',async()=>{
  const env=bootApp(),{app,data,downloads}=env;
  const [first,second,third]=data.cards;
  app.Store.data.collection={[first.id]:5,[second.id]:2,[third.id]:1};
  const before=JSON.stringify(app.Store.data);
  await env.click('collection-export');
  const exported=JSON.parse(await downloads[0].text());
  assert.equal(exported.schema,'avp-player-collection-v1');
  assert.equal(exported.cards.length,data.cards.length);
  assert.equal(exported.summary.owned,3);assert.equal(exported.summary.copies,8);
  assert.equal(exported.cards.find(card=>card.id===first.id).missingForPlayset,0);
  assert.equal(exported.cards.find(card=>card.id===second.id).missingForPlayset,1);
  assert.equal(exported.cards.find(card=>card.id===third.id).missingForPlayset,2);
  assert.equal(exported.cards.find(card=>card.id===data.cards[3].id).missingForPlayset,3);
  assert.equal(JSON.stringify(app.Store.data),before);
});
