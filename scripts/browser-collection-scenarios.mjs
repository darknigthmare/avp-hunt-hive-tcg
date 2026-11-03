// Invoked in the isolated QA profile. All interactions use the delivered controls.
export async function collectionBrowserScenarios(){
  const A=window.AVP_APP,D=window.AVP_DATA,C=window.AVPCollection;
  if(!A||!C)throw Error('Collection module is missing');
  const checks=[];
  const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const click=selector=>{const element=document.querySelector(selector);if(!element)throw Error('Missing collection control: '+selector);element.scrollIntoView({block:'center'});element.click();};
  const change=(selector,value)=>{const element=document.querySelector(selector);if(!element)throw Error('Missing collection filter: '+selector);if(element.type==='checkbox')element.checked=value;else element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));};
  const saved=JSON.stringify(A.Store.data),battle=A.state.battleContext;
  A.state.ui.modalLocked=false;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  const fresh=A.save.freshSave();fresh.starterChosen=true;fresh.tutorial.completed=true;fresh.settings.sound=false;fresh.settings.motion=false;
  const [first,second,third]=D.cards;
  fresh.collection={[first.id]:5,[second.id]:2,[third.id]:1};A.Store.data=fresh;A.state.battleContext=null;
  A.state.screen='collection';A.state.collectionView='cards';
  A.state.filters={query:'',faction:'ALL',type:'ALL',rarity:'ALL',set:'ALL',owned:'ALL',quantity:'ALL',sort:'RARITY_DESC'};
  A.state.collectionDeckFilters={query:'',category:'ALL',faction:'ALL',source:'ALL',status:'ALL',sort:'NEAREST',includeReserve:false};
  A.render();
  const beforeView=JSON.stringify(A.Store.data),model=C.createModel(D,A.Store.data.collection,A.Store.data.decks);
  assert(model.summary().owned===3&&model.summary().copies===8&&model.summary().duplicates===5,'Collection counts unique cards, copies and duplicates separately');
  assert(document.querySelectorAll('.collection-stats .collection-stat').length===4,'Player collection summary is visible');
  assert(document.querySelectorAll('.collection-card-grid .card-wrap').length<=48,'Collection first page is bounded');
  change('select[data-filter="owned"]','MISSING');
  assert([...document.querySelectorAll('.collection-card-grid .card-wrap')].every(el=>!fresh.collection[el.dataset.cardId]),'Missing filter excludes owned cards');
  change('select[data-filter="owned"]','OWNED');change('select[data-filter="quantity"]','TWO');
  const one=document.querySelectorAll('.collection-card-grid .card-wrap');
  assert(one.length===1&&one[0].dataset.cardId===second.id,'Quantity filter finds the exact owned copies');
  click('[data-action="collection-clear-filters"]');click('[data-action="collection-view"][data-view="progress"]');
  assert(document.querySelectorAll('.collection-breakdowns .collection-breakdown').length===4,'Faction, rarity, class and set progression are available');
  assert(document.querySelectorAll('.collection-category-grid [data-action="collection-deck-group"]').length>0,'Deck-type collection progress is available');
  assert(document.documentElement.scrollWidth<=window.innerWidth+1,'Collection progression fits the viewport');
  A.state.filters={query:'not-a-card',faction:'YAUTJA',type:'TACTIC',rarity:'GR',set:'not-a-set',owned:'SPARES',quantity:'TWO',sort:'OWNED_ASC'};
  click('[data-action="collection-filter-group"][data-group-field="faction"][data-group-value="HUMAN"]');
  const humans=D.cards.filter(card=>card.faction==='HUMAN'),shownHumans=document.querySelectorAll('.collection-card-grid .card-wrap');
  assert(shownHumans.length===Math.min(48,humans.length)&&[...shownHumans].every(el=>D.cards.find(card=>card.id===el.dataset.cardId)?.faction==='HUMAN'),'Progression group opens its catalogue cards despite old unrelated filters');
  click('[data-action="collection-view"][data-view="progress"]');
  A.state.collectionDeckFilters={query:'not-a-recipe',category:'PERSONNEL',faction:'YAUTJA',source:'SAVED',status:'READY',sort:'DUST',includeReserve:true};
  click('[data-action="collection-deck-group"][data-group-value="DEPART"]');
  assert(document.querySelectorAll('.collection-deck-record').length===Object.keys(D.starterDecks).length&&!document.querySelector('#collection-include-reserve').checked,'Deck progression group clears unrelated filters and shows its principal recipes');
  assert(JSON.stringify(A.Store.data)===beforeView,'Viewing and filtering collection does not change the save');

  const recipe=D.expansionDecks?.[0];if(!recipe)throw Error('No catalogue recipe to test');
  fresh.collection={...recipe.cards};A.state.collectionView='decks';A.state.collectionDeckFilters={query:recipe.id,category:'ALL',faction:'ALL',source:'ALL',status:'ALL',sort:'NEAREST',includeReserve:false};A.render();
  const key='catalogue:'+recipe.id;
  click('[data-action="collection-deck-detail"][data-recipe-key="'+key+'"]');
  let covered=C.createModel(D,fresh.collection,[]).deckCoverage(key);
  assert(covered.complete&&document.querySelector('.collection-deck-detail'),'Owned recipe opens exact deck completion details');
  const ownedBefore=JSON.stringify(A.Store.data.collection);
  click('[data-action="collection-toggle-reserve"]');
  const requirements={...recipe.cards};for(const [id,n] of Object.entries(recipe.reserve||{}))requirements[id]=(requirements[id]||0)+n;
  const total=Object.values(requirements).reduce((a,b)=>a+b,0),available=Object.entries(requirements).reduce((n,[id,required])=>n+Math.min(required,fresh.collection[id]||0),0);
  covered=C.createModel(D,fresh.collection,[]).deckCoverage(key,true);
  assert(covered.total===total&&covered.available===available,'Reserve quantities add to principal requirements without double-using copies');
  assert(document.querySelector('.collection-deck-detail .collection-deck-meter').innerText.includes(available+' / '+total),'Deck modal displays exact available and required copies');
  assert(document.documentElement.scrollWidth<=window.innerWidth+1,'Deck and reserve details fit the viewport');
  click('[data-action="collection-build-deck"]');
  assert(A.Store.data.decks.length===1&&JSON.stringify(A.Store.data.collection)===ownedBefore,'Creating an owned deck does not grant or consume collection cards');

  const weapon=D.cards.find(card=>card.cardClass==='ARME'&&card.ammoType&&card.weaponFamily);
  if(weapon){
    A.state.screen='collection';A.state.collectionView='cards';A.state.filters={query:weapon.id,faction:'ALL',type:'ALL',rarity:'ALL',set:'ALL',owned:'ALL',quantity:'ALL',sort:'INDEX'};A.render();
    click('.collection-card-grid [data-action="view-card"][data-card-id="'+weapon.id+'"]');
    assert(document.querySelector('.collection-related')?.innerText.includes('Munitions compatibles'),'Weapon details expose associated ammunition');
    assert(document.querySelector('.collection-related')?.innerText.includes('Modules compatibles'),'Weapon details expose compatible modules');
    click('.collection-related summary');
    assert(document.documentElement.scrollWidth<=window.innerWidth+1,'Associated card viewer fits the viewport');
    const ammunition=C.createModel(D,A.Store.data.collection,A.Store.data.decks).relatedCards(weapon.id).find(group=>group.title==='Munitions compatibles').cards[0];
    click('.collection-related [data-action="view-card"][data-card-id="'+ammunition.id+'"]');
    assert(document.querySelector('.detail-copy h2')?.innerText===ammunition.name,'Associated ammunition link opens its actual card details');
    const copiesBefore=A.Store.data.collection[ammunition.id]||0;
    A.Store.data.profile.dust=100000;A.showCardDetail(ammunition.id);
    click('[data-action="craft-card"][data-card-id="'+ammunition.id+'"]');
    assert(A.Store.data.collection[ammunition.id]===copiesBefore+1&&A.Store.data.profile.dust===100000-D.rarities[ammunition.rarity].dust*2,'Crafting associated ammunition spends the exact dust and adds one copy');
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  }
  A.Store.data=JSON.parse(saved);A.state.battleContext=battle;A.Store.save();
  A.state.screen='collection';A.state.collectionView='progress';A.render();
  return {passed:true,checks,totalCards:D.cards.length,catalogueRecipes:(D.expansionDecks||[]).length};
}
