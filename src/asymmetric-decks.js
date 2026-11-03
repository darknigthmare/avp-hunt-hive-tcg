/* 38 decks asymétriques de 30 cartes et 15 alternatives ; 3 boosters de doctrine. */
(function(){
'use strict';
const D=window.AVP_DATA;
if(!D?.asymmetricEdition||D.cards.length!==891)throw Error('Cartes asymétriques requises');
const count=o=>Object.values(o).reduce((a,b)=>a+b,0);
const hash=s=>{let n=2166136261>>>0;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
const rng=seed=>{let n=seed>>>0||1;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;}};
const shuffle=(arr,r)=>{let a=arr.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const registry=new Map(D.cards.map(c=>[c.id,c]));
const stage=c=>c?.evolutionStage||({X_OVOMORPH:'EGG',X_FACEHUGGER:'FACEHUGGER',X_CHESTBURSTER:'CHESTBURSTER'}[c?.id]);
const isEgg=c=>stage(c)==='EGG'||c?.tags?.includes('egg');
const directFighter=c=>c.type==='UNIT'&&!c.summonByFusion&&!c.requiresEgg&&!c.crewRequired
 &&!isEgg(c)&&c.cardClass!=='HOTE'&&c.attack>0;
const techniqueFamily=c=>c.effect?.weaponFamily||c.weaponFamily;
const hasEffect=(c,kind)=>[c.effect,c.effect?.onPlay,c.effect?.onEquip].some(e=>e?.kind===kind);
function supportedBy(c,main){
 const cards=Object.keys(main).map(id=>registry.get(id));
 const some=predicate=>cards.some(predicate);
 const effect=c.effect||{};
 if(c.requiresEgg&&!some(e=>isEgg(e)&&(c.eggLine!=='ROYAL'||e.eggLine==='ROYAL')))return false;
 if(c.summonByFusion&&!some(e=>e.effect?.resultCardId===c.id))return false;
 if(c.cardClass==='HOTE'&&!some(e=>e.effect?.kind==='HIVE_FUSION'&&e.effect.hostType===c.hostType))return false;
 if(effect.kind==='HIVE_FUSION'&&(!main[effect.resultCardId]
   ||!some(e=>stage(e)==='FACEHUGGER')
   ||!some(e=>e.cardClass==='HOTE'&&e.hostType===effect.hostType)))return false;
 if(effect.kind==='HIVE_EVOLVE'&&(!main[effect.resultCardId]
   ||!some(e=>stage(e)===effect.fromStage&&(!effect.hostType||e.hostType===effect.hostType))))return false;
 if(c.slot==='WEAPON'&&c.ammoType&&!some(e=>e.cardClass==='MUNITION'&&e.ammoType===c.ammoType))return false;
 if(c.cardClass==='MUNITION'&&!some(e=>e.slot==='WEAPON'&&e.ammoType===c.ammoType))return false;
 if(c.cardClass==='MODIFICATION'&&!some(e=>e.slot==='WEAPON'&&c.compatibleFamilies.includes(e.weaponFamily)))return false;
 if(effect.kind==='WEAPON_TECHNIQUE'&&(!some(e=>e.slot==='WEAPON'&&e.ammoType===effect.ammoType
   &&(!techniqueFamily(c)||e.weaponFamily===techniqueFamily(c)))
   ||!some(e=>e.cardClass==='MUNITION'&&e.ammoType===effect.ammoType)))return false;
 if(c.plasmaPerAttack&&!some(e=>hasEffect(e,'CHARGE_PLASMA')))return false;
 if(effect.honorCost&&!some(e=>hasEffect(e,'GAIN_HONOR')||e.effect?.kind==='YAUTJA_TROPHY'))return false;
 if(effect.biomassCost&&!some(e=>hasEffect(e,'HIVE_BIOMASS')||e.requiresEgg||e.effect?.kind==='HIVE_FUSION'))return false;
 if(effect.kind==='YAUTJA_TROPHY'&&!some(e=>directFighter(e)&&e.faction==='YAUTJA'))return false;
 if(c.crewRequired&&!some(e=>e.cardClass==='PERSONNAGE'&&e.faction===c.faction))return false;
 return true;
}
function generate(faction,id,doctrine){
 const random=rng(hash(id)),main={},pool=D.cards.filter(c=>c.faction===faction);
 const copies=predicate=>Object.entries(main).reduce((n,[key,q])=>n+(predicate(registry.get(key))?q:0),0);
 const add=(card,quantity)=>{
   if(!card||(main[card.id]||0)+quantity>D.rules.maxCopies)throw Error('Package impossible '+id);
   main[card.id]=(main[card.id]||0)+quantity;
 };
 const select=(predicate,quantity)=>{
   const choices=shuffle(pool.filter(predicate),random);
   let placed=0;
   // Diversifier les cartes avant les doublons, sans dépasser trois exemplaires.
   for(let pass=0;pass<D.rules.maxCopies&&placed<quantity;pass++)for(const card of choices){
     if(placed===quantity)break;
     if((main[card.id]||0)>=D.rules.maxCopies)continue;
     add(card,1);placed++;
   }
   return placed;
 };
 if(faction==='HUMAN'){
   const family=doctrine.focus;
   const weapons=pool.filter(c=>c.cardClass==='ARME'&&c.weaponFamily===family&&c.ammoType);
   const ammoType=weapons[0]?.ammoType;
   if(!ammoType)throw Error('Arsenal indisponible '+family);
   select(c=>c.cardClass==='PERSONNAGE'&&c.cost<=2,5);
   select(c=>c.cardClass==='PERSONNAGE'&&c.cost<=3,6);
   select(c=>weapons.includes(c),4);
   select(c=>c.cardClass==='MUNITION'&&c.ammoType===ammoType,7);
   select(c=>c.cardClass==='MODIFICATION'&&c.compatibleFamilies.includes(family),3);
   select(c=>c.effect?.kind==='WEAPON_TECHNIQUE'&&c.effect.ammoType===ammoType&&techniqueFamily(c)===family,2);
   select(c=>c.cardClass==='ACTION'&&c.cost<=2,3);
 }else if(faction==='XENO'){
   const hostType=doctrine.focus;
   if(doctrine.variant===4){
     select(c=>c.requiresEgg&&c.eggLine==='ROYAL',1);
     select(c=>c.requiresEgg&&c.eggLine!=='ROYAL',2);
   }else select(c=>c.requiresEgg,3);
   const royalHuggers=copies(c=>c.requiresEgg&&c.eggLine==='ROYAL');
   select(c=>isEgg(c)&&c.eggLine==='ROYAL',royalHuggers);
   select(c=>isEgg(c)&&c.eggLine!=='ROYAL',4-royalHuggers);
   select(c=>c.cardClass==='HOTE'&&c.hostType===hostType,3);
   const fusions=shuffle(pool.filter(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType===hostType),random);
   // L'identité du résultat suit la recette choisie. Un tirage indépendant des
   // larves laissait auparavant des fusions impossibles dans onze decks sur douze.
   const chosen=fusions.slice(0,doctrine.variant===2?2:1);
   for(let i=0;i<chosen.length;i++){
     const quantity=chosen.length===1?3:i===0?2:1;
     add(chosen[i],quantity);add(registry.get(chosen[i].effect.resultCardId),quantity);
   }
   const moults=pool.filter(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='CHESTBURSTER'&&c.effect.hostType===hostType);
   select(c=>moults.includes(c),2);
   add(registry.get(moults[0]?.effect.resultCardId),2);
   select(c=>c.cardClass==='BIOMASSE',3);
   if(doctrine.variant>=3){
     const jelly=pool.find(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.resultCardId===D.asymmetricStage.praetorian);
     add(jelly,1);add(registry.get(jelly.effect.resultCardId),1);
   }
   if(doctrine.variant===4){
     const crown=pool.find(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.resultCardId===D.asymmetricStage.queen);
     add(crown,1);add(registry.get(crown.effect.resultCardId),1);
   }
 }else if(faction==='YAUTJA'){
   // L'honneur est amorcé sans exiger d'abord une victoire ou un rituel payant.
   select(c=>c.cardClass==='PERSONNAGE'&&c.cost<=3&&hasEffect(c,'GAIN_HONOR'),3);
   select(c=>c.cardClass==='PERSONNAGE'&&c.cost<=2,Math.max(0,5-copies(c=>c.cardClass==='PERSONNAGE'&&c.cost<=2)));
   select(c=>c.cardClass==='PERSONNAGE'&&c.cost<=3,11-copies(c=>c.cardClass==='PERSONNAGE'));
   select(c=>c.cardClass==='ARME'&&c.plasmaPerAttack>0,4);
   select(c=>c.cardClass==='RESERVE_PLASMA',5);
   select(c=>c.cardClass==='TROPHEE',3);
   select(c=>c.cardClass==='HONNEUR',3);
   select(c=>c.cardClass==='ACTION'&&c.cost<=2,4);
 }
 if(count(main)>30)throw Error('Deck >30 '+id);
 // Les emplacements libres renforcent la présence en jeu, pas une seconde chaîne
 // de ressources dont les composants auraient été tirés indépendamment.
 select(c=>directFighter(c)&&c.cost<=3,30-count(main));
 if(count(main)!==30)throw Error('Deck incomplet '+id+' '+count(main));
 for(const key of Object.keys(main))if(!supportedBy(registry.get(key),main))throw Error('Prérequis absent '+id+' / '+key);
 const reserve={};
 const candidates=shuffle(pool.filter(c=>supportedBy(c,main)
   &&(faction!=='HUMAN'||!c.weaponFamily||c.weaponFamily===doctrine.focus)),random);
 // Chaque alternative est soutenue par le principal. Les résultats d'une autre
 // fusion et les hôtes d'une autre lignée ne sont pas distribués isolément.
 for(const card of candidates){
   if(count(reserve)===15)break;
   if((main[card.id]||0)>=D.rules.maxCopies)continue;
   reserve[card.id]=1;
 }
 if(count(reserve)!==15)throw Error('Réserve incomplète '+id);
 return {main,reserve};
}
const created=[],plans=new Map(),previousRemix=D.remixPresetDeck;
function put(id,name,faction,category,focus,variant){
 const doctrine={focus,variant};
 const d=generate(faction,id,doctrine);
 const p={id:'asym_'+id,name,faction,category,focus,cards:d.main,reserve:d.reserve,count:30,boxCount:45,
   description:'Doctrine '+category+' : 30 cartes, 15 alternatives. Ressources asymétriques.'};
 created.push(p);D.expansionDecks.push(p);plans.set(p.id,{faction,doctrine});
}
const humanFamilies=['pulse','smart','flame','shot','pistol','sniper','grenade','f44aa'];
for(const family of humanFamilies)for(let v=1;v<=2;v++){
 // Les identifiants des recettes restent stables pour les profils existants.
 const stableFamilyId=family==='f44aa'?'laser':family;
 put('human_'+stableFamilyId+'_'+v,'USCM — '+family.toUpperCase()+' / '+(v===1?'Ravitaillement':'Armement avancé'),
  'HUMAN','MUNITIONS',family,v);
}
for(const hostType of ['HUMAN','QUAD','YAUTJA'])for(let v=1;v<=4;v++){
 put('xeno_'+hostType.toLowerCase()+'_'+v,'Cycle '+hostType+' — '+['Incubation','Parasitage','Mue','Rituel'][v-1],
  'XENO','FUSION',hostType,v);
}
for(let v=1;v<=10;v++)put('yautja_'+v,'Chasse Yautja — '+['Plasma','Trophées','Honneur','Ancien','Blooding','Rituels','Duels','Ciblage','Clan','Traque'][v-1],
  'YAUTJA','HONNEUR','YA27',v);
if(created.length!==38||D.expansionDecks.length!==318)throw Error('Expected 38 new asymmetric decks');
const packs=[
 ['pack_asym_human','CW02','Arsenal & Munitions — USCM','HUMAN','COLONY'],
 ['pack_asym_xeno','CW02','Cycle parasitaire — Ruche','XENO','SIGNAL'],
 ['pack_asym_yautja','HG03','Plasma & Honneur — Yautja','YAUTJA','HUNTER']
];
for(const [id,set,name,primaryFaction,art]of packs){
 if(D.boosters.some(p=>p.id===id))throw Error('Pack already exists');
 D.boosters.push({id,set,name,subtitle:'Gameplay asymétrique',primaryFaction,art,price:740,unlocksAt:0,
   cardsPerBooster:9,profile:'principal',poolTag:'asymmetric',preview:true,
   description:'9 cartes spécialisées '+primaryFaction+' : munitions, évolutions ou ressources de chasse.'});
}
D.remixPresetDeck=function(preset,seed){
 const saved=plans.get(preset?.id);
 if(!saved)return typeof previousRemix==='function'?previousRemix(preset,seed):null;
 const next=generate(saved.faction,preset.id+'|remix|'+seed,saved.doctrine);
 return {cards:next.main,reserve:next.reserve,focusCards:0};
};
D.asymmetricDecks=created;D.asymmetricEdition.specializedDecks=created.length;
D.asymmetricEdition.totalDecks=D.expansionDecks.length;
D.asymmetricEdition.boosterIDs=packs.map(x=>x[0]);
})();
