/* Complete lifecycle recipes: thirty playable cards and fifteen alternatives.
 * Intermediate forms, exact transformation results and resource cards are
 * supplied together. The independent filler pool is frozen when loaded.
 */
(function(){
'use strict';
const D=window.AVP_DATA,H=D?.hiveCoverage;
if(!H||!D.expansionDecks)throw Error('Cycles et recettes historiques requis.');
const registry=new Map(D.cards.map(c=>[c.id,c])),routeMap=new Map(H.routes.map(r=>[r.id,r]));
const count=map=>Object.values(map).reduce((n,q)=>n+q,0);
const hash=s=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const rng=seed=>{let n=seed>>>0||1;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};};
const shuffle=(list,random)=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const direct=c=>c.type==='UNIT'&&!c.summonByFusion&&!c.requiresEgg&&!c.crewRequired
  &&!['OEUF','HOTE'].includes(c.cardClass)&&c.attack>0&&!c.effect?.exclusiveTag;
const plans=new Map(),created=[],formerRemix=D.remixPresetDeck;
function planFor(entry){
  let routes=entry.routeIds.map(id=>routeMap.get(id));
  if(['bio.xenomorph.facehugger','bio.xenomorph.chestburster','bio.xenomorph.drone'].includes(entry.sourceId))routes=H.roots.classic_human.steps;
  if(entry.sourceId==='bio.xenomorph.ovomorph')routes=[...H.roots.classic_human.steps,routeMap.get('eggmorph'),
    ...H.roots.queen.steps.slice(3),routeMap.get('queen_laying')];
  if(entry.sourceId==='ha.bio.royal-facehugger')routes=H.roots.royal.steps;
  return {faction:entry.faction,routes:[...routes],target:entry.resultCardId,sourceIds:[entry.sourceId]};
}
function generate(plan,seed){
  const main={},reserve={},random=rng(hash(String(seed))),faction=plan.faction;
  const add=(id,amount=1)=>{
    const c=registry.get(id);if(!c||c.faction!==faction)throw Error('Matériau de faction incohérente : '+id+' / '+faction);
    if((main[id]||0)+amount>3)throw Error('Trop de copies : '+id);
    main[id]=(main[id]||0)+amount;
  };
  const include=id=>{if(!main[id])add(id);};
  const produced=new Set(plan.routes.map(r=>r.resultCardId));
  const rootMaterials=new Set();
  for(const route of plan.routes){
    include(route.actionCardId);include(route.resultCardId);
    for(const group of [route.primaryMaterialIds,route.secondaryMaterialIds,route.catalystCardIds]){
      if(!group?.length)continue;
      // Alternatives are OR groups. Prefer the material already produced by
      // this same path rather than introducing an unrelated dormant branch.
      const id=group.find(id=>produced.has(id))||group[0];
      include(id);if(!produced.has(id))rootMaterials.add(id);
    }
  }
  include(plan.target);
  // Reproduction consumes a real extra copy from hand/deck. The egg used for
  // the first hatching has already gone to the discard and cannot fund a later
  // laying or cocoon. Supply one copy per subsequent reproduction action.
  for(const id of new Set(plan.routes.filter(r=>r.method.startsWith('ECLOSION')).flatMap(r=>r.primaryMaterialIds))){
    const reproductions=plan.routes.filter(r=>r.resultCardId===id).length;
    if(reproductions){while(main[id]<Math.min(3,1+reproductions))add(id);}
    else rootMaterials.add(id);
  }
  for(const id of rootMaterials)if(main[id]<2)add(id);
  for(const id of H.biomassCardIds.filter(id=>registry.get(id).faction===faction))add(id,2);
  const fighters=shuffle([...registry.values()].filter(c=>c.faction===faction&&direct(c)&&c.cost<=5),random)
    .sort((a,b)=>(a.cost>3)-(b.cost>3));
  if(fighters.length<3)throw Error('Unités de soutien insuffisantes : '+faction);
  for(let pass=0;pass<3&&count(main)<30;pass++)for(const c of fighters){
    if(count(main)===30)break;if((main[c.id]||0)<3)add(c.id);
  }
  if(count(main)!==30)throw Error('Recette de cycle incomplète : '+plan.sourceIds[0]+' / '+count(main));
  // Every reserve option either is independently deployable or already has
  // its entire dependency package in the main deck. Total copies stay <= 3.
  const alternatives=shuffle([...new Set([...Object.keys(main),...fighters.map(c=>c.id)])],random);
  for(let pass=0;pass<3&&count(reserve)<15;pass++)for(const id of alternatives){
    if(count(reserve)===15)break;
    if((main[id]||0)+(reserve[id]||0)>=3)continue;
    reserve[id]=(reserve[id]||0)+1;
  }
  if(count(reserve)!==15)throw Error('Réserve de cycle incomplète.');
  return {cards:main,reserve};
}
function put(id,name,plan,description){
  const recipe=generate(plan,id);
  const deck={id,name,faction:plan.faction,category:'CYCLE_COMPLET',focus:plan.sourceIds[0],
    cards:recipe.cards,reserve:recipe.reserve,count:30,boxCount:45,
    sourceIds:plan.sourceIds,routeIds:plan.routes.map(r=>r.id),
    description:description||'Cycle complet de 30 cartes + 15 alternatives : matériaux, résultat, biomasse et soutien. Recette TCG propre au profil.'};
  plans.set(id,plan);created.push(deck);D.expansionDecks.push(deck);
  for(const route of plan.routes){if(!route.deckIds.includes(id))route.deckIds.push(id);route.deckId??=id;}
  return deck;
}
for(const entry of H.entries){
  const id='hive_'+entry.sourceId.toLowerCase().replace(/[^a-z0-9]+/g,'_');
  const deck=put(id,'Cycle — '+entry.name,planFor(entry));
  entry.deckIds=[deck.id];entry.deckId=deck.id;
}
const yautjaLine=put('hive_reproduction_yautja','Ruche — Parasitisme d’un hôte Yautja',{
  faction:'XENO',routes:H.roots.classic_yautja.steps,target:H.roots.classic_yautja.terminalCardId,
  sourceIds:['bio.xenomorph.predalien']});
H.entries.find(e=>e.sourceId==='bio.xenomorph.predalien').deckIds.push(yautjaLine.id);
put('hive_reproduction_eggmorph','Ruche — Cocons et eggmorphose',{
  faction:'XENO',routes:[...H.roots.classic_human.steps,routeMap.get('eggmorph')],target:H.roots.classic_human.terminalCardId,
  sourceIds:['bio.xenomorph.ovomorph','card.avp.t_x_eggmorph']},
  '30 cartes + 15 alternatives. Le Drone catalyse la transformation d’un hôte humain en Œuf ; chaque résultat vient de votre main ou deck.');
put('hive_reproduction_queen','Ruche — Dynastie et ponte',{
  faction:'XENO',routes:[...H.roots.queen.steps,routeMap.get('queen_laying')],target:H.roots.queen.terminalCardId,
  sourceIds:['bio.xenomorph.queen','bio.xenomorph.ovomorph']},
  '30 cartes + 15 alternatives. De l’Œuf à la Reine ; la ponte conserve la Reine et exige une voie libre, de la biomasse et un Œuf disponible.');
const packs=[
  ['pack_hive_xeno','CW02','Castes & Cycles — Ruche','XENO','SIGNAL'],
  ['pack_hive_engineer','EV05','Origines & Mutagènes — Ingénieurs','ENGINEER','SIGNAL'],
  ['pack_hive_hybrid','AV04','Lignées & Gestations — Hybrides','HYBRID','HUNTER']
];
for(const [id,set,name,primaryFaction,art]of packs){
  if(D.boosters.some(p=>p.id===id))throw Error('Booster de cycle déjà présent.');
  D.boosters.push({id,set,name,primaryFaction,art,price:740,unlocksAt:0,cardsPerBooster:9,
    profile:'principal',poolTag:'hive-complete',preview:true,subtitle:'Cycles complets',
    description:'9 cartes de cycle '+primaryFaction+' : gestations, matériaux, recettes et biomasse. Les profils restent propres à leur œuvre ou projet.'});
}
D.remixPresetDeck=function(preset,seed){
  const plan=plans.get(preset?.id);
  if(!plan)return typeof formerRemix==='function'?formerRemix(preset,seed):null;
  return {...generate(plan,preset.id+'|remix|'+seed),focusCards:0};
};
D.hiveDecks=created;
D.hiveEdition.specializedDecks=created.length;
D.hiveEdition.boosterIDs=packs.map(p=>p[0]);
D.hiveEdition.totalDecks=D.expansionDecks.length;
H.totals.decks=created.length;H.totals.boosters=packs.length;
D.version='1.4.0-complete';
})();
