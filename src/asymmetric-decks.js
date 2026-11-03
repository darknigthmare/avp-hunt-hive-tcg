/* 38 decks asymétriques de 30 cartes et 15 alternatives ; 3 boosters de doctrine. */
(function(){
'use strict';
const D=window.AVP_DATA;
if(!D?.asymmetricEdition||D.cards.length!==891)throw Error('Cartes asymétriques requises');
const count=o=>Object.values(o).reduce((a,b)=>a+b,0);
const hash=s=>{let n=2166136261>>>0;for(const c of s){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
const rng=seed=>{let n=seed>>>0||1;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;}};
const shuffle=(arr,r)=>{let a=arr.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function generate(faction,id,plan){
 const random=rng(hash(id)),main={},r=shuffle(D.cards.filter(c=>c.faction===faction),random);
 const select=(predicate,need)=>{
   const pool=shuffle(r.filter(c=>predicate(c)),random);
   let placed=0;
   for(const c of pool){
     while((main[c.id]||0)<3&&placed<need){
       main[c.id]=(main[c.id]||0)+1;placed++;
     }
     if(placed>=need)break;
   }
   return placed;
 };
 for(const [predicate,quantity]of plan)select(predicate,quantity);
 if(count(main)>30)throw Error('Deck >30 '+id);
 // Recrues fiables pour éviter les mains mortes.
 if(count(main)<30)select(c=>c.type==='UNIT'&&!c.summonByFusion&&!c.requiresEgg&&!['HOTE','OEUF'].includes(c.cardClass)&&c.cost<=3,Math.min(30-count(main),7));
 if(count(main)<30)select(c=>c.type==='UNIT'&&!c.summonByFusion&&!c.requiresEgg&&!['HOTE','OEUF'].includes(c.cardClass),Math.min(30-count(main),5));
 if(count(main)<30)select(c=>c.type==='TACTIC'&&!['HIVE_FUSION','HIVE_EVOLVE','WEAPON_TECHNIQUE'].includes(c.effect?.kind)&&!c.effect?.honorCost,30-count(main));
 if(count(main)<30)select(c=>c.type==='EQUIPMENT'&&c.cardClass==='EQUIPEMENT',30-count(main));
 if(count(main)!==30)throw Error('Deck incomplete '+id+' '+count(main));
 const reserve={};
 for(const c of r){if(count(reserve)>=15)break;if((main[c.id]||0)<3)reserve[c.id]=1;}
 if(count(reserve)!==15)throw Error('Reserve incomplete '+id);
 return {main,reserve};
}
const created=[];
function put(id,name,faction,category,focus,plan){
 const d=generate(faction,id,plan);
 const p={id:'asym_'+id,name,faction,category,focus,cards:d.main,reserve:d.reserve,count:30,boxCount:45,
   description:'Doctrine '+category+' : 30 cartes, 15 alternatives. Ressources asymétriques.'};
 created.push(p);D.expansionDecks.push(p);
}
const humanFamilies=['pulse','smart','flame','shot','pistol','sniper','grenade','laser'];
for(const family of humanFamilies)for(let v=1;v<=2;v++){
 const weapon=D.cards.find(c=>c.faction==='HUMAN'&&c.weaponFamily===family&&c.ammoType&&c.cardClass==='ARME');
 if(!weapon)throw Error('Weapon unavailable '+family);
 const ammoType=weapon.ammoType;
 put('human_'+family+'_'+v,'USCM — '+family.toUpperCase()+' / '+(v===1?'Ravitaillement':'Armement avancé'),
  'HUMAN','MUNITIONS',family,[
   [c=>c.cardClass==='PERSONNAGE'&&c.cost<=3,11],
   [c=>c.cardClass==='ARME'&&c.weaponFamily===family&&c.ammoType,4],
   [c=>c.cardClass==='MUNITION'&&c.ammoType===ammoType,7],
   [c=>c.cardClass==='MODIFICATION'&&c.compatibleFamilies?.includes(family),3],
   [c=>c.cardClass==='ATTAQUE'&&c.name.toLowerCase().includes(family),2],
   [c=>c.cardClass==='ACTION'&&c.cost<=2,3]
  ]);
}
for(const hostType of ['HUMAN','QUAD','YAUTJA'])for(let v=1;v<=4;v++){
 const fusions=D.cards.filter(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType===hostType);
 const evolutions=D.cards.filter(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='CHESTBURSTER'&&c.effect.hostType===hostType);
 const stages=new Set([...fusions.map(c=>c.effect.resultCardId),...evolutions.map(c=>c.effect.resultCardId)]);
 put('xeno_'+hostType.toLowerCase()+'_'+v,'Cycle '+hostType+' — '+['Incubation','Parasitage','Mue','Rituel'][v-1],
  'XENO','FUSION',hostType,[
   [c=>c.evolutionStage==='EGG'||c.id==='X_OVOMORPH',5],
   [c=>c.evolutionStage==='FACEHUGGER'||c.id==='X_FACEHUGGER',4],
   [c=>c.cardClass==='HOTE'&&c.hostType===hostType,4],
   [c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType===hostType,3],
   [c=>stages.has(c.id),4],
   [c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='CHESTBURSTER'&&c.effect.hostType===hostType,2],
   [c=>c.cardClass==='BIOMASSE',3]
  ]);
}
for(let v=1;v<=10;v++)put('yautja_'+v,'Chasse Yautja — '+['Plasma','Trophées','Honneur','Ancien','Blooding','Rituels','Duels','Ciblage','Clan','Traque'][v-1],
  'YAUTJA','HONNEUR','YA27',[
   [c=>c.cardClass==='PERSONNAGE'&&c.cost<=3,11],
   [c=>c.cardClass==='ARME'&&c.plasmaPerAttack>0,4],
   [c=>c.cardClass==='RESERVE_PLASMA',5],
   [c=>c.cardClass==='TROPHEE',3],
   [c=>c.cardClass==='HONNEUR',3],
   [c=>c.cardClass==='ACTION'&&c.cost<=2,4]
  ]);
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
D.asymmetricDecks=created;D.asymmetricEdition.specializedDecks=created.length;
D.asymmetricEdition.totalDecks=D.expansionDecks.length;
D.asymmetricEdition.boosterIDs=packs.map(x=>x[0]);
})();