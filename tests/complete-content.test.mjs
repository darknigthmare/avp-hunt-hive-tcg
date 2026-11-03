import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createContext, Script} from 'node:vm';
import {loadRuntime, runtimeModules, root} from '../scripts/runtime-loader.mjs';

const source=name=>readFileSync(new URL('src/'+name+'.js',root),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const sum=map=>Object.values(map||{}).reduce((n,count)=>n+count,0);
const runtime=loadRuntime({rules:true,collection:true});
const {AVP_DATA:D,AVPEngine:E,AVPCollection:C,AVPDuelSave:S}=runtime;
const historicalNames=['data','expansion','expansion-wave2','deck-productions','asymmetric-cards','asymmetric-decks'];
const previous=createContext({window:{},Intl,Date,Math});
for(const name of historicalNames)new Script(source(name),{filename:name+'.js'}).runInContext(previous);
const historical=previous.window.AVP_DATA;
const additions=D.cards.slice(891),recipes=D.expansionDecks.slice(318);

test('full module stack appends content and preserves all 891 historical cards, 318 recipes, starters and boosters',()=>{
  assert.equal(historical.cards.length,891);assert.equal(historical.expansionDecks.length,318);
  assert.equal(historical.asymmetricDecks.length,38);
  assert.deepEqual(plain(D.cards.slice(0,891)),plain(historical.cards));
  assert.deepEqual(plain(D.expansionDecks.slice(0,318)),plain(historical.expansionDecks));
  assert.deepEqual(plain(D.starterDecks),plain(historical.starterDecks));
  assert.deepEqual(plain(D.boosters.slice(0,historical.boosters.length)),plain(historical.boosters));
  assert.deepEqual(plain(D.rarities),plain(historical.rarities));
  assert.deepEqual(plain(D.campaign),plain(historical.campaign));
  assert(D.arsenalEdition&&D.hiveEdition&&D.hiveEdition.engineLoaded);
  assert.equal(additions.length,D.arsenalEdition.addedCount+D.hiveEdition.addedCount);
  assert.equal(recipes.length,D.arsenalDecks.length+D.hiveDecks.length);
  assert.equal(E.CARD.size,D.cards.length);
});

test('the 38 historical doctrine remixes keep identical recipes and reserves in the complete runtime',()=>{
  for(const preset of historical.asymmetricDecks){
    const current=D.expansionDecks.find(p=>p.id===preset.id);
    assert(current,preset.id);
    for(const seed of [11,37,20261103])
      assert.deepEqual(plain(D.remixPresetDeck(current,seed)),plain(historical.remixPresetDeck(preset,seed)),preset.id+' seed '+seed);
  }
});

test('every added card has a unique index, registry identity, rules, source, rarity and active collection group',()=>{
  assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
  const collectorNumbers=new Set(historical.cards.map(c=>c.collectorNo).filter(Boolean));
  for(const card of additions){assert(card.collectorNo&&!collectorNumbers.has(card.collectorNo),card.id+': duplicate new collector number');collectorNumbers.add(card.collectorNo);}
  const model=C.createModel(D,{});
  assert.equal(model.summary().total,D.cards.length);assert.equal(model.summary().owned,0);
  for(const field of ['faction','rarity','type','set'])assert.equal(model.groups(field).reduce((n,g)=>n+g.total,0),D.cards.length,field);
  additions.forEach((card,index)=>{
    assert.equal(card.index,891+index,card.id);
    assert.equal(E.CARD.get(card.id),card,card.id);
    assert(D.factions[card.faction]&&D.rarities[card.rarity]&&D.sets[card.set],card.id);
    assert(D.cardClasses[card.cardClass],card.id);
    assert(['UNIT','EQUIPMENT','TACTIC','LOCATION'].includes(card.type),card.id);
    assert(card.sourceEntityId||card.source?.entry,card.id+': source');
    assert(card.sourcePolicy&&card.sourceNote&&card.text,card.id+': provenance/rules');
    assert(Number.isFinite(D.rarities[card.rarity].dust)&&D.rarities[card.rarity].dust>0,card.id+': crafting cost');
  });
});

test('every new recipe and deterministic remix is legal, resource-complete, and has an exact 30+15 card box',()=>{
  assert.equal(new Set(D.expansionDecks.map(p=>p.id)).size,D.expansionDecks.length);
  const categories=new Set(C.createModel(D,{}).deckGroups().map(group=>group.id));
  const assertRecipe=(preset,recipe)=>{
    assert.equal(sum(recipe.cards),D.rules.deckSize,preset.id);
    assert.equal(sum(recipe.reserve),preset.boxCount-D.rules.deckSize,preset.id);
    assert(E.validateDeck(recipe.cards,null,preset.faction).valid,preset.id);
    const analysis=E.analyzeDeck(recipe.cards,preset.faction);
    assert.equal((analysis.asymmetric||[]).length,0,preset.id+': '+(analysis.asymmetric||[]).join(' / '));
    for(const id of new Set([...Object.keys(recipe.cards),...Object.keys(recipe.reserve||{})])){
      assert(E.CARD.has(id),preset.id+': '+id);
      const n=(recipe.cards[id]||0)+(recipe.reserve?.[id]||0);
      assert(Number.isSafeInteger(n)&&n>0&&n<=D.rules.maxCopies,preset.id+': combined copies '+id);
    }
  };
  for(const preset of recipes){
    assert(categories.has(preset.category),preset.id+': invisible category');
    assert(C.categoryNames[preset.category],preset.id+': untranslated category');
    assertRecipe(preset,preset);
    for(const seed of [103,7919]){
      const one=D.remixPresetDeck(preset,seed),two=D.remixPresetDeck(preset,seed);
      assert.deepEqual(plain(one),plain(two),preset.id+': nondeterministic remix');assertRecipe(preset,one);
    }
  }
});

test('every added card is reachable through the real booster selection and appears in a legal recipe',()=>{
  const deckIds=new Set(recipes.flatMap(deck=>[...Object.keys(deck.cards),...Object.keys(deck.reserve||{})]));
  const packIds=[...(D.arsenalEdition.boosterIDs||[]),...(D.hiveEdition.boosterIDs||[])];
  assert(packIds.length>=5);assert.equal(new Set(D.boosters.map(p=>p.id)).size,D.boosters.length);
  const choice=E.U.choice;
  try{
    for(const card of additions){
      assert(deckIds.has(card.id),card.id+': absent from all new recipes');
      const pack=D.boosters.find(p=>packIds.includes(p.id)&&p.set===card.set&&(!p.poolTag||card.tags.includes(p.poolTag))&&(!p.primaryFaction||p.primaryFaction===card.faction));
      assert(pack,card.id+': no obtainable booster pool');
      // Force only the final choice among the engine's actual eligible cards.
      // This proves reachability for every rarity without relying on lucky draws.
      E.U.choice=(pool,rng)=>pool.find(candidate=>candidate?.id===card.id)||choice(pool,rng);
      const opened=E.openBooster(pack.id,{seed:71103,pity:0});
      assert(opened.pulls.some(pull=>pull.cardId===card.id),card.id+': filtered out by booster slots');
      assert.equal(opened.pulls.length,pack.cardsPerBooster);
    }
  }finally{E.U.choice=choice;}
  for(const id of packIds)for(const seed of [11,37,103]){
    const opened=E.openBooster(id,{seed,pity:9}),pack=opened.pack;
    assert.equal(opened.pulls.length,9,id);assert(opened.bestRank>=4,id+': pity');
    assert.equal(new Set(opened.pulls.map(p=>p.cardId)).size,9,id+': duplicate opening');
    for(const pull of opened.pulls){const card=E.CARD.get(pull.cardId);assert(card.set===pack.set&&card.faction===pack.primaryFaction&&card.tags.includes(pack.poolTag),id);}
  }
});

test('arsenal matrices reference live compatible ammo, mods, operations and source-specific recipes',()=>{
  const entries=D.arsenalCoverage.entries,ids=new Set(entries.map(entry=>entry.sourceId));
  assert.equal(ids.size,entries.length);
  for(const entry of entries){
    for(const key of ['legacyCardIds','cardIds','ammoCardIds','modCardIds','supportCardIds'])
      for(const id of entry[key]||[])assert(E.CARD.has(id),entry.sourceId+': '+key+' '+id);
    for(const dependency of entry.dependencySourceIds||[])assert(ids.has(dependency),entry.sourceId+': missing source dependency');
    if(entry.status==='research-only'){
      assert.equal(entry.cardIds.length,0,entry.sourceId+': unadmitted reference became a card');continue;
    }
    assert(entry.cardIds.length>0,entry.sourceId);
    for(const id of entry.deckIds||[])assert(D.arsenalDecks.some(deck=>deck.id===id),entry.sourceId);
    if(entry.status==='integrated')assert(entry.deckIds?.length>0,entry.sourceId+': recipe absent');
    for(const id of entry.cardIds){
      const card=E.CARD.get(id);
      if(card.slot==='WEAPON'){
        if(card.ammoType)assert(entry.ammoCardIds.some(key=>E.CARD.get(key).ammoType===card.ammoType),id);
        else if(card.plasmaPerAttack)assert(entry.ammoCardIds.some(key=>E.CARD.get(key).effect?.kind==='CHARGE_PLASMA'),id);
        else assert.equal(entry.ammoCardIds.length,0,id+': melee/returning weapon invented ammunition');
        assert(entry.modCardIds.some(key=>E.CARD.get(key).compatibleFamilies?.includes(card.weaponFamily)),id);
      }
    }
  }
  const oldGear=historical.cards.filter(c=>['HUMAN','YAUTJA'].includes(c.faction)&&['ARME','EQUIPEMENT'].includes(c.cardClass));
  const linked=new Set(entries.flatMap(entry=>entry.legacyCardIds||[]));
  for(const card of oldGear)assert(linked.has(card.id),card.id+': old arsenal no longer navigable');
});

test('every hive subject and route links exact material, catalyst, result and executable deck identities',()=>{
  const coverage=D.hiveCoverage,routeById=new Map(coverage.routes.map(route=>[route.id,route]));
  assert.equal(routeById.size,coverage.routes.length);
  const model=C.createModel(D,{});
  for(const route of coverage.routes){
    assert(E.CARD.has(route.actionCardId),route.id+': action');
    assert.equal(E.CARD.get(route.resultCardId)?.type,'UNIT',route.id+': result');
    for(const id of [...route.materialCardIds,...route.catalystCardIds])assert.equal(E.CARD.get(id)?.type,'UNIT',route.id+': '+id);
    assert(route.deckIds?.length>0,route.id+': no executable deck');
    for(const id of route.deckIds)assert(D.hiveDecks.some(deck=>deck.id===id),route.id+': unknown deck');
    const links=new Set(model.relatedCards(route.actionCardId).flatMap(group=>group.cards.map(card=>card.id)));
    assert(links.has(route.resultCardId)||route.actionCardId===route.resultCardId,route.id+': invisible result');
    for(const id of route.materialCardIds)assert(links.has(id)||id===route.actionCardId,route.id+': invisible material');
  }
  for(const entry of coverage.entries){
    assert(entry.cardIds.length>0&&entry.status==='PLAYABLE_ROUTE',entry.sourceId);
    for(const id of [...entry.cardIds,...entry.legacyCardIds,...entry.evolutionCardIds,...entry.requiredCardIds])assert(E.CARD.has(id),entry.sourceId+': '+id);
    for(const id of entry.routeIds)assert(routeById.has(id),entry.sourceId+': missing route');
  }
});

test('every compatible historical host and Facehugger exposes its actual fusion recipes',()=>{
  const model=C.createModel(D,{}),linked=id=>new Set(model.relatedCards(id).flatMap(group=>group.cards.map(card=>card.id)));
  const fusions=D.cards.filter(card=>card.effect?.kind==='HIVE_FUSION');
  for(const host of historical.cards.filter(card=>card.cardClass==='HOTE'&&!card.keywords.includes('SYNTHETIC'))){
    const expected=fusions.filter(card=>card.effect.hostType===host.hostType);
    for(const fusion of expected){assert(linked(host.id).has(fusion.id),host.id+': missing compatible fusion');assert(linked(fusion.id).has(host.id),fusion.id+': missing compatible host');}
  }
  for(const fusion of fusions)assert(linked('X_FACEHUGGER').has(fusion.id),fusion.id+': original Facehugger link');
  const royal=D.cards.find(card=>card.requiresEgg&&card.eggLine==='ROYAL');
  const eggs=model.relatedCards(royal.id).find(group=>group.title==='Œufs compatibles').cards;
  assert(eggs.length>0&&eggs.every(egg=>egg.eggLine==='ROYAL'));
});

function bootFullApp(){
  const nodes=new Map(),events=new Map();
  const node=id=>({id,innerHTML:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    setAttribute(){},getAttribute(){return null;},appendChild(){},remove(){},focus(){},click(){},matches(){return false;},
    querySelector(){return null;},querySelectorAll(){return [];},addEventListener(name,handler){events.set(id+':'+name,handler);}});
  const document={body:node('body'),activeElement:null,title:'',getElementById(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);},querySelector(){return null;},createElement:()=>node('temp'),addEventListener(){}};
  const storage=new Map(),context=createContext({window:{matchMedia:()=>({matches:false}),scrollTo(){}},document,
    localStorage:{getItem:id=>storage.get(id)||null,setItem:(id,value)=>storage.set(id,value),removeItem:id=>storage.delete(id)},
    navigator:{},location:{protocol:'file:',hostname:'',reload(){}},TextEncoder,URL,Blob,Intl,
    setTimeout:()=>1,clearTimeout(){},confirm:()=>true,prompt:()=>null,console});
  for(const name of [...runtimeModules.data,...runtimeModules.rules,'collection','app'])new Script(source(name),{filename:name+'.js'}).runInContext(context,{timeout:15000});
  const app=context.window.AVP_APP;app.Store.data.starterChosen=true;app.Store.data.tutorial.completed=true;
  app.Store.data.settings.sound=false;app.state.screen='play';
  return {app,data:context.window.AVP_DATA,engine:context.window.AVPEngine,nodes,
    async click(action,details={}){const el={dataset:{action,...details},disabled:false,getAttribute(){return null;}};await events.get('app:click')({target:{closest:()=>el}});}};
}

test('every new card can actually be crafted through the application, charged exactly once and saved/imported',async()=>{
  const {app,data,click}=bootFullApp();app.Store.data.profile.dust=100000000;
  const fresh=JSON.stringify(app.Store.data.collection),first=data.cards[891];
  app.Store.data.profile.dust=0;await click('craft-card',{cardId:first.id});
  assert.equal(JSON.stringify(app.Store.data.collection),fresh,'Unaffordable crafting must not grant a card');
  app.Store.data.profile.dust=100000000;let spent=0;
  for(const card of data.cards.slice(891)){
    const cost=data.rarities[card.rarity].dust*2,before=app.Store.data.profile.dust;
    await click('craft-card',{cardId:card.id});spent+=cost;
    assert.equal(app.Store.data.collection[card.id],1,card.id+': fabrication');
    assert.equal(app.Store.data.profile.dust,before-cost,card.id+': price');
  }
  assert.equal(app.Store.data.profile.dust,100000000-spent);
  const imported=app.save.sanitizeSave(JSON.parse(JSON.stringify(app.Store.data)));
  assert.deepEqual(plain(imported.collection),plain(app.Store.data.collection));
  assert.equal(C.createModel(data,imported.collection).summary().owned,additions.length);
});

test('full-stack collection views and owned deck creation leave inventory and progression unchanged',async()=>{
  const {app,data,nodes,click}=bootFullApp();
  for(const group of [data.arsenalDecks,data.hiveDecks]){
    const recipe=group[0];app.Store.data.collection={...recipe.cards};app.Store.data.decks=[];
    const before=JSON.stringify(app.Store.data);app.state.screen='collection';
    for(const view of ['cards','progress','decks']){app.state.collectionView=view;app.render();assert(nodes.get('app').innerHTML.includes('Progression de votre collection'));}
    assert.equal(JSON.stringify(app.Store.data),before,'Collection read mutated save');
    const inventory=JSON.stringify(app.Store.data.collection);
    await click('collection-build-deck',{recipeKey:'catalogue:'+recipe.id});
    assert.equal(app.Store.data.decks.length,1);assert.equal(JSON.stringify(app.Store.data.collection),inventory);
    assert(E.validateDeck(app.Store.data.decks[0].cards,app.Store.data.collection,recipe.faction).valid);
  }
});

test('device reinforcement and lifecycle details describe the delivered conditions and health bonus',()=>{
  const {app,data,nodes}=bootFullApp();
  const module=data.cards.find(card=>card.compatibleEquipmentIds?.length);
  app.showCardDetail(module.id);
  let detail=nodes.get('modal-root').innerHTML;
  assert(detail.includes('Renfort d’appareil'));assert(detail.includes('+'+module.health+' PV'));
  assert(!detail.includes('Le bonus d’attaque dépend d’une arme chargée.'));
  const route=data.cards.find(card=>card.effect?.kind==='HIVE_ROUTE'&&card.effect.catalystIds.length);
  app.showCardDetail(route.id);detail=nodes.get('modal-root').innerHTML;
  assert(detail.includes('Recette de cycle'));assert(detail.includes('Catalyseur'));
  assert(detail.includes(data.cards.find(card=>card.id===route.effect.catalystIds[0]).name));
});

test('historical duel saves still restore through every new rule module',()=>{
  const fixtures=JSON.parse(readFileSync(new URL('fixtures/legacy-asymmetric-weapons-v1.json',import.meta.url),'utf8'));
  for(const fixture of fixtures.cases){
    const restored=S.restore(fixture.checkpoint),saved=S.capture(restored);
    assert.equal(restored.rng.getState(),fixture.checkpoint.rngState);
    assert.deepEqual(plain(S.capture(S.restore(saved))),plain(saved));
    assert.equal(restored.side(0).board[0].cardId,fixture.carrierId);
    assert(restored.side(0).board[0].equipment.includes(fixture.weaponId));
  }
});
