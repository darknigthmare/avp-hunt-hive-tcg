/* Une recette utilisable par référence concrète : 30 cartes + 15 alternatives.
 * Les armes, leurs ressources et leurs modules sont sélectionnés ensemble.
 */
(function(){
'use strict';
const D=window.AVP_DATA;if(!D?.arsenalCoverage)throw Error('Catalogue arsenal requis');
const registry=new Map(D.cards.map(c=>[c.id,c])),created=[],plans=new Map(),previousRemix=D.remixPresetDeck;
const count=map=>Object.values(map).reduce((n,q)=>n+q,0);
const hash=s=>{let n=2166136261>>>0;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return n>>>0;};
const rng=seed=>{let n=seed>>>0||1;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};};
const shuffle=(items,r)=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const references=D.arsenalCoverage.entries.filter(e=>e.status==='integrated');
const referenceMap=new Map(references.map(e=>[e.sourceId,e]));
const baseline=[...registry.values()].slice(0,D.arsenalEdition.startCount);
function packageFor(entry){
 const deps=entry.dependencySourceIds.map(id=>referenceMap.get(id)).filter(Boolean);
 const all=[entry,...deps];
 return [...new Set(all.flatMap(e=>[...e.cardIds,...e.ammoCardIds,...e.modCardIds,...e.supportCardIds]))].map(id=>registry.get(id));
}
function supported(card,main){
 const list=Object.keys(main).map(id=>registry.get(id)),some=fn=>list.some(fn),fx=card.effect||{};
 if(card.slot==='WEAPON'&&card.ammoType&&!some(c=>c.cardClass==='MUNITION'&&c.ammoType===card.ammoType))return false;
 if(card.plasmaPerAttack&&!some(c=>c.effect?.kind==='CHARGE_PLASMA'))return false;
 if(card.cardClass==='MUNITION'&&!some(c=>c.slot==='WEAPON'&&c.ammoType===card.ammoType))return false;
 if(card.cardClass==='MODIFICATION'){
  if(card.compatibleEquipmentIds?.length){if(!card.compatibleEquipmentIds.some(id=>main[id]))return false;}
  else if(!some(c=>c.slot==='WEAPON'&&card.compatibleFamilies.includes(c.weaponFamily)))return false;
 }
 if(fx.requiresEquipmentIds?.length&&!fx.requiresEquipmentIds.some(id=>main[id]))return false;
 if(fx.requiresWeaponFamilies?.length&&!some(c=>c.slot==='WEAPON'&&fx.requiresWeaponFamilies.includes(c.weaponFamily)))return false;
 if(fx.kind==='WEAPON_TECHNIQUE'&&(!some(c=>c.slot==='WEAPON'&&c.weaponFamily===fx.weaponFamily)||!some(c=>c.cardClass==='MUNITION'&&c.ammoType===fx.ammoType)))return false;
 if(fx.kind==='ARSENAL_PLASMA_SHOT'&&(!some(c=>c.slot==='WEAPON'&&c.weaponFamily===fx.weaponFamily)||!some(c=>c.effect?.kind==='CHARGE_PLASMA')))return false;
 return true;
}
function generate(entry,seed){
 const random=rng(hash(entry.sourceId+'|'+seed)),main={},reserve={},packageCards=packageFor(entry);
 const units=baseline.filter(c=>c.faction===entry.faction&&c.cardClass==='PERSONNAGE'&&c.cost<=4&&!c.requiresEgg&&!c.summonByFusion&&!c.crewRequired&&c.attack>0);
 const cheap=shuffle(units.filter(c=>c.cost<=2),random),others=shuffle(units,random);
 const supports=shuffle(baseline.filter(c=>c.faction===entry.faction&&c.type==='TACTIC'&&['DRAW','FORTIFY','SCAN_REVEAL','REPAIR_UNIT','BUFF_AND_RUSH','GAIN_HONOR','CHARGE_PLASMA'].includes(c.effect?.kind)&&!c.effect?.honorCost&&c.cost<=3),random);
 function add(map,c,n){if(!c)return;const remaining=D.rules.maxCopies-(main[c.id]||0)-(reserve[c.id]||0);const q=Math.max(0,Math.min(n,remaining));if(q)map[c.id]=(map[c.id]||0)+q;}
 // Keep at least 12 fieldable carriers and a low-cost opening in every recipe.
 for(const c of cheap){if(count(main)>=6)break;add(main,c,Math.min(2,6-count(main)));}
 for(const c of others){if(count(main)>=12)break;add(main,c,Math.min(2,12-count(main)));}
 for(const c of packageCards){
  let quantity=c.cardClass==='ARME'||c.cardClass==='EQUIPEMENT'?2:c.cardClass==='MUNITION'?2:c.cardClass==='RESERVE_PLASMA'?3:1;
  add(main,c,quantity);
 }
 if(count(main)>27)throw Error('Package arsenal trop grand : '+entry.sourceId+' / '+count(main));
 for(const c of supports){if(count(main)>=28)break;add(main,c,Math.min(2,28-count(main)));}
 for(const c of shuffle(units.concat(supports),random)){if(count(main)>=30)break;add(main,c,Math.min(2,30-count(main)));}
 if(count(main)!==30)throw Error('Deck arsenal incomplet : '+entry.sourceId);
 // Include every dependency in the principal; alternatives never introduce orphan resources.
 const alternatives=shuffle(packageCards.concat(units,supports).filter(c=>supported(c,main)),random);
 for(const c of alternatives){if(count(reserve)>=15)break;add(reserve,c,1);}
 if(count(reserve)!==15)throw Error('Réserve arsenal incomplète : '+entry.sourceId);
 for(const id of [...Object.keys(main),...Object.keys(reserve)])if(!supported(registry.get(id),main))throw Error('Dépendance arsenal absente : '+entry.sourceId+' / '+id);
 return {cards:main,reserve,focusCards:packageCards.filter(c=>main[c.id]).length};
}
for(const entry of references){
 const id='arsenal_'+entry.faction.toLowerCase()+'_'+hash(entry.sourceId).toString(16).padStart(8,'0');
 const recipe=generate(entry,'initial');
 const preset={id,name:(entry.faction==='HUMAN'?'Arsenal humain — ':'Arsenal Yautja — ')+entry.name,
  faction:entry.faction,category:'ARSENAL',focus:entry.sourceId,cards:recipe.cards,reserve:recipe.reserve,
  count:30,boxCount:45,sourceId:entry.sourceId,resourceMode:entry.resourceMode,
  description:'30 cartes et 15 alternatives : porteurs, '+(entry.resourceMode==='support'?'appareil et service associé':'armement et ressources compatibles')+'. Adaptation TCG de la référence documentaire.'};
 created.push(preset);D.expansionDecks.push(preset);plans.set(id,entry);entry.deckIds.push(id);
}
for(const entry of D.arsenalCoverage.entries.filter(e=>e.status==='covered-alias'))entry.deckIds=entry.dependencySourceIds.flatMap(id=>referenceMap.get(id)?.deckIds||[]);
for(const faction of ['HUMAN','YAUTJA']){
 const id='pack_arsenal_'+faction.toLowerCase();if(D.boosters.some(p=>p.id===id))throw Error('Booster arsenal dupliqué');
 D.boosters.push({id,set:faction==='HUMAN'?'CW02':'HG03',name:faction==='HUMAN'?'Arsenal intégral — Humains':'Arsenal intégral — Yautja',
  subtitle:'Armes, appareils et cartes associées',primaryFaction:faction,art:faction==='HUMAN'?'COLONY':'HUNTER',
  price:740,unlocksAt:0,cardsPerBooster:9,profile:'principal',poolTag:'arsenal',preview:true,
  description:'9 cartes de l’arsenal '+faction+' ; 7 raretés disponibles, dernière place SR ou supérieure et protection UR après 9 boosters sans UR.'});
}
D.remixPresetDeck=function(preset,seed){
 const plan=plans.get(preset?.id);return plan?generate(plan,String(seed)):typeof previousRemix==='function'?previousRemix(preset,seed):null;
};
D.arsenalDecks=created;D.arsenalEdition.specializedDecks=created.length;D.arsenalEdition.totalDecks=D.expansionDecks.length;
})();
