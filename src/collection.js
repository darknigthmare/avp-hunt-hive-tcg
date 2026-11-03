/* Read-only collection statistics, deck completion and card relationships. */
(function(){
  'use strict';
  const number=value=>Number.isSafeInteger(value)&&value>0?value:0;
  const own=(value,key)=>value&&Object.hasOwn(value,key)?number(value[key]):0;
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
  const categoryNames=Object.freeze({DEPART:'Départs historiques',STARTER:'Starter',STRUCTURE:'Structure',CONSTRUCTION:'Construction',SPECIAL:'Spéciaux',LIGUE:'Ligue',MUNITIONS:'Doctrines humaines',FUSION:'Fusions de la Ruche',HONNEUR:'Chasses Yautja',ARSENAL:'Arsenaux',EVOLUTION:'Évolutions',CYCLE_COMPLET:'Cycles complets de la Ruche',THEME:'Thématiques',PERSONNEL:'Mes decks'});

  function createModel(data,collection={},savedDecks=[]){
    const cards=(data.cards||[]).slice(),byId=new Map(cards.map(card=>[card.id,card]));
    const maxCopies=number(data.rules?.maxCopies)||3;
    const quantity=id=>byId.has(id)?own(collection,id):0;
    const rarityRank=card=>data.rarities?.[card.rarity]?.rank||0;
    const price=card=>number(data.rarities?.[card?.rarity]?.dust)*2;
    function summary(list){
      const result={total:list.length,owned:0,copies:0,duplicates:0,spares:0,fullPlaysets:0,playsetCopies:0,playsetTotal:list.length*maxCopies};
      for(const card of list){const n=quantity(card.id);result.owned+=Number(n>0);result.copies+=n;result.duplicates+=Math.max(0,n-1);result.spares+=Math.max(0,n-maxCopies);result.fullPlaysets+=Number(n>=maxCopies);result.playsetCopies+=Math.min(n,maxCopies);}
      result.missing=result.total-result.owned;result.playsetMissing=result.playsetTotal-result.playsetCopies;
      result.ratio=result.total?result.owned/result.total:0;result.playsetRatio=result.playsetTotal?result.playsetCopies/result.playsetTotal:0;
      return result;
    }
    function groups(field){
      const pools=new Map();
      for(const card of cards){const key=field==='type'?(card.cardClass||card.type):card[field];if(!pools.has(key))pools.set(key,[]);pools.get(key).push(card);}
      const names=field==='type'?{UNIT:'Unités',TACTIC:'Actions',EQUIPMENT:'Équipements',LOCATION:'Lieux',...data.cardClasses}:field==='faction'?data.factions:field==='rarity'?data.rarities:data.sets;
      return Array.from(pools,([id,list])=>({id,name:typeof names?.[id]==='string'?names[id]:(names?.[id]?.name||id),...summary(list)}))
        .sort((a,b)=>field==='rarity'?(data.rarities?.[a.id]?.rank||0)-(data.rarities?.[b.id]?.rank||0):a.name.localeCompare(b.name,'fr'));
    }
    function filterCards(filters={}){
      const q=normalize(filters.query).trim();
      const exact=q?cards.find(card=>normalize(card.id)===q):null;
      const collectorMatches=!exact&&q?new Set(cards.filter(card=>normalize(card.collectorNo)===q).map(card=>card.id)):null;
      const list=cards.filter(card=>{
        const n=quantity(card.id);
        if(exact&&card.id!==exact.id)return false;
        if(collectorMatches?.size&&!collectorMatches.has(card.id))return false;
        if(q&&!normalize([card.name,card.id,card.collectorNo,card.searchText,card.text].join(' ')).includes(q))return false;
        if(filters.faction&&filters.faction!=='ALL'&&card.faction!==filters.faction)return false;
        if(filters.type&&filters.type!=='ALL'&&card.type!==filters.type&&card.cardClass!==filters.type)return false;
        if(filters.rarity&&filters.rarity!=='ALL'&&card.rarity!==filters.rarity)return false;
        if(filters.set&&filters.set!=='ALL'&&card.set!==filters.set)return false;
        if(filters.owned==='OWNED'&&!n||filters.owned==='MISSING'&&n||filters.owned==='DUPLICATES'&&n<2||filters.owned==='PLAYSET'&&n<maxCopies||filters.owned==='INCOMPLETE'&&n>=maxCopies||filters.owned==='SPARES'&&n<=maxCopies)return false;
        if(filters.quantity==='ONE'&&n!==1||filters.quantity==='TWO'&&n!==2||filters.quantity==='THREE_PLUS'&&n<3)return false;
        return true;
      });
      const alpha=(a,b)=>a.name.localeCompare(b.name,'fr')||a.id.localeCompare(b.id);
      const sorts={NAME:alpha,INDEX:(a,b)=>(a.index||0)-(b.index||0)||alpha(a,b),RARITY_ASC:(a,b)=>rarityRank(a)-rarityRank(b)||alpha(a,b),RARITY_DESC:(a,b)=>rarityRank(b)-rarityRank(a)||alpha(a,b),COST_ASC:(a,b)=>a.cost-b.cost||alpha(a,b),COST_DESC:(a,b)=>b.cost-a.cost||alpha(a,b),OWNED_DESC:(a,b)=>quantity(b.id)-quantity(a.id)||alpha(a,b),OWNED_ASC:(a,b)=>quantity(a.id)-quantity(b.id)||alpha(a,b)};
      return list.sort(sorts[filters.sort]||sorts.RARITY_DESC);
    }
    const recipes=(data.expansionDecks||[]).map(recipe=>({...recipe,key:'catalogue:'+recipe.id,source:'CATALOGUE',category:recipe.category||'THEME'}));
    for(const [faction,recipe] of Object.entries(data.starterDecks||{}))recipes.push({...recipe,id:'starter_'+faction,key:'starter:'+faction,faction,category:'DEPART',source:'STARTER'});
    for(const recipe of savedDecks||[])recipes.push({...recipe,key:'saved:'+recipe.id,source:'SAVED',category:'PERSONNEL'});
    const recipeByKey=new Map(recipes.map(recipe=>[recipe.key,recipe]));
    function deckCoverage(recipeOrKey,includeReserve=false){
      const recipe=typeof recipeOrKey==='string'?recipeByKey.get(recipeOrKey):recipeOrKey;
      if(!recipe)return null;
      const ids=new Set([...Object.keys(recipe.cards||{}),...(includeReserve?Object.keys(recipe.reserve||{}):[])]);
      const rows=[];
      for(const id of ids){
        const main=own(recipe.cards,id),reserve=includeReserve?own(recipe.reserve,id):0,required=main+reserve;
        if(!required)continue;
        const card=byId.get(id),owned=quantity(id),available=Math.min(owned,required),missing=required-available;
        rows.push({id,card,main,reserve,required,owned,available,missing,dust:price(card)*missing,unknown:!card});
      }
      rows.sort((a,b)=>(a.card?.name||a.id).localeCompare(b.card?.name||b.id,'fr'));
      const total=rows.reduce((n,row)=>n+row.required,0),available=rows.reduce((n,row)=>n+row.available,0);
      const mainMissing=Object.entries(recipe.cards||{}).reduce((n,[id,count])=>n+Math.max(0,number(count)-quantity(id)),0);
      const unknown=rows.filter(row=>row.unknown).length;
      return {recipe,rows,total,available,missing:total-available,unique:rows.length,uniqueOwned:rows.filter(row=>row.owned>0).length,
        dust:rows.reduce((n,row)=>n+row.dust,0),unknown,ratio:total?available/total:0,complete:total>0&&available===total&&!unknown,
        mainMissing,mainReady:Object.values(recipe.cards||{}).reduce((n,value)=>n+number(value),0)===(data.rules?.deckSize||30)&&mainMissing===0&&!Object.keys(recipe.cards||{}).some(id=>!byId.has(id)),includeReserve};
    }
    function deckGroups(includeReserve=false){
      const pools=new Map();
      for(const recipe of recipes){
        if(!pools.has(recipe.category))pools.set(recipe.category,{id:recipe.category,name:categoryNames[recipe.category]||recipe.category,recipes:0,ready:0,ids:new Set()});
        const pool=pools.get(recipe.category),covered=deckCoverage(recipe,includeReserve);pool.recipes++;pool.ready+=Number(covered.complete);
        for(const row of covered.rows)if(row.card)pool.ids.add(row.id);
      }
      return Array.from(pools.values(),pool=>({id:pool.id,name:pool.name,recipes:pool.recipes,ready:pool.ready,...summary(Array.from(pool.ids,id=>byId.get(id)))}));
    }
    function filterDecks(filters={}){
      const q=normalize(filters.query).trim();
      const list=recipes.filter(recipe=>(!filters.category||filters.category==='ALL'||recipe.category===filters.category)&&(!filters.faction||filters.faction==='ALL'||recipe.faction===filters.faction)&&(!filters.source||filters.source==='ALL'||recipe.source===filters.source)&&(!q||normalize([recipe.name,recipe.id,recipe.focus,recipe.description,categoryNames[recipe.category]].join(' ')).includes(q)))
        .map(recipe=>deckCoverage(recipe,!!filters.includeReserve)).filter(covered=>filters.status==='READY'?covered.complete:filters.status==='MISSING'?!covered.complete:true);
      return list.sort((a,b)=>filters.sort==='NAME'?a.recipe.name.localeCompare(b.recipe.name,'fr'):filters.sort==='DUST'?Number(a.unknown>0)-Number(b.unknown>0)||a.dust-b.dust||a.missing-b.missing:b.ratio-a.ratio||a.missing-b.missing||a.recipe.name.localeCompare(b.recipe.name,'fr'));
    }
    function relatedCards(id){
      const card=byId.get(id);if(!card)return [];
      const relations=new Map();
      const stage=other=>other?.evolutionStage||({X_OVOMORPH:'EGG',X_FACEHUGGER:'FACEHUGGER',X_CHESTBURSTER:'CHESTBURSTER'}[other?.id]);
      const egg=other=>stage(other)==='EGG'||other?.tags?.includes('egg');
      const organic=other=>!other?.keywords?.includes('SYNTHETIC');
      const add=(title,items)=>{const list=items.filter(other=>other&&other.id!==id);if(list.length)relations.set(title,new Map([...(relations.get(title)||[]),...list.map(other=>[other.id,other])]));};
      if(card.cardClass==='ARME'){
        if(card.ammoType)add('Munitions compatibles',cards.filter(other=>other.cardClass==='MUNITION'&&other.ammoType===card.ammoType));
        if(card.plasmaPerAttack>0)add('Réserves de plasma',cards.filter(other=>other.effect?.kind==='CHARGE_PLASMA'));
        if(card.weaponFamily)add('Modules compatibles',cards.filter(other=>other.cardClass==='MODIFICATION'&&other.compatibleFamilies?.includes(card.weaponFamily)));
      }
      if(card.cardClass==='MUNITION')add('Armes compatibles',cards.filter(other=>other.cardClass==='ARME'&&other.ammoType===card.ammoType));
      if(card.cardClass==='MODIFICATION')add('Armes compatibles',cards.filter(other=>other.cardClass==='ARME'&&card.compatibleFamilies?.includes(other.weaponFamily)));
      if(card.compatibleEquipmentIds?.length)add('Appareils compatibles',card.compatibleEquipmentIds.map(key=>byId.get(key)));
      add('Modules d’appareil compatibles',cards.filter(other=>other.cardClass==='MODIFICATION'&&other.compatibleEquipmentIds?.includes(id)));
      if(card.effect?.requiresEquipmentIds?.length)add('Appareils requis',card.effect.requiresEquipmentIds.map(key=>byId.get(key)));
      const families=card.effect?.requiresWeaponFamilies||(card.effect?.weaponFamily?[card.effect.weaponFamily]:[]);
      if(families.length)add('Armes requises',cards.filter(other=>other.slot==='WEAPON'&&families.includes(other.weaponFamily)));
      add('Opérations et techniques associées',cards.filter(other=>other.effect?.requiresEquipmentIds?.includes(id)||card.weaponFamily&&(other.effect?.requiresWeaponFamilies?.includes(card.weaponFamily)||other.effect?.weaponFamily===card.weaponFamily)));
      if(card.effect?.resultCardId)add('Résultat de la transformation',[byId.get(card.effect.resultCardId)]);
      if(card.requiresEgg)add('Œufs compatibles',cards.filter(other=>egg(other)&&(card.eggLine!=='ROYAL'||other.eggLine==='ROYAL')));
      if(egg(card))add('Éclosions compatibles',cards.filter(other=>other.requiresEgg&&(other.eggLine!=='ROYAL'||card.eggLine==='ROYAL')));
      if(card.effect?.kind==='HIVE_FUSION'){
        add('Facehuggers compatibles',cards.filter(other=>stage(other)==='FACEHUGGER'));
        add('Hôtes biologiques compatibles',cards.filter(other=>other.cardClass==='HOTE'&&other.hostType===card.effect.hostType&&organic(other)));
      }
      if(card.cardClass==='HOTE'&&organic(card))add('Fusions avec cet hôte',cards.filter(other=>other.effect?.kind==='HIVE_FUSION'&&other.effect.hostType===card.hostType));
      if(stage(card)==='FACEHUGGER')add('Fusions parasitaires',cards.filter(other=>other.effect?.kind==='HIVE_FUSION'));
      if(card.effect?.kind==='HIVE_EVOLVE')add('Matériaux d’évolution compatibles',cards.filter(other=>stage(other)===card.effect.fromStage&&(!card.effect.hostType||other.hostType===card.effect.hostType)));
      if(card.effect?.kind==='HIVE_ROUTE'){
        add('Matériaux principaux requis',(card.effect.materialIds||[]).map(key=>byId.get(key)));
        add('Matériaux secondaires requis',(card.effect.secondaryIds||[]).map(key=>byId.get(key)));
        add('Catalyseurs conservés',(card.effect.catalystIds||[]).map(key=>byId.get(key)));
      }
      add('Cartes permettant cette évolution',cards.filter(other=>other.effect?.resultCardId===id));
      if(stage(card))add('Évolutions depuis ce stade',cards.filter(other=>other.effect?.kind==='HIVE_EVOLVE'&&other.effect.fromStage===stage(card)&&(!other.effect.hostType||other.effect.hostType===card.hostType)));
      add('Recettes utilisant cette carte',cards.filter(other=>other.effect?.kind==='HIVE_ROUTE'&&[...(other.effect.materialIds||[]),...(other.effect.secondaryIds||[]),...(other.effect.catalystIds||[])].includes(id)));
      for(const coverage of [data.arsenalCoverage,data.hiveCoverage])for(const entry of coverage?.entries||[]){
        const legacy=(entry.legacyCardIds||[]).includes(id);
        if(!legacy&&!(entry.cardIds||[]).includes(id))continue;
        if(legacy)add('Variantes de gameplay et cartes de cycle',(entry.cardIds||[]).map(key=>byId.get(key)));
        add('Munitions associées',(entry.ammoCardIds||[]).map(key=>byId.get(key)));
        add('Modules associés',(entry.modCardIds||[]).map(key=>byId.get(key)));
        add('Opérations associées',(entry.supportCardIds||[]).map(key=>byId.get(key)));
        add('Évolutions associées',(entry.evolutionCardIds||[]).map(key=>byId.get(key)));
      }
      for(const route of data.hiveCoverage?.routes||[]){
        if(route.actionCardId===id){
          add('Matériaux de la recette',(route.materialCardIds||[]).map(key=>byId.get(key)));
          add('Catalyseurs conservés',(route.catalystCardIds||[]).map(key=>byId.get(key)));
          add('Résultat de la transformation',[byId.get(route.resultCardId)]);
        }
        if([...(route.materialCardIds||[]),...(route.catalystCardIds||[])].includes(id))add('Recettes utilisant cette carte',[byId.get(route.actionCardId)]);
      }
      return Array.from(relations,([title,values])=>({title,cards:Array.from(values.values())}));
    }
    return Object.freeze({cards,byId,quantity,maxCopies,summary:()=>summary(cards),groups,filterCards,recipes,recipeByKey,deckCoverage,deckGroups,filterDecks,relatedCards,categoryNames});
  }
  window.AVPCollection=Object.freeze({createModel,categoryNames});
})();
