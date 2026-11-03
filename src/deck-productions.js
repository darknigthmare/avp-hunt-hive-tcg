/* AVP TCG — 210 recettes jouables alignées sur les 30 extensions du catalogue.
 * Ces decks utilisent uniquement les cartes déjà intégrées aux 2 vagues du moteur.
 * Les sets sans référence active fournissent un deck transversal marqué explicitement.
 * Aucune illustration et aucun effet historique modifiés.
 */
(function(){
  'use strict';
  const D=window.AVP_DATA;
  if(!D?.expansionWave2||D.cards.length!==656)throw new Error('Catalogue 1.2 requis avant les recettes');
  const plan=[{"set":"NX01","name":"Origines Hostiles","faction":"XENO","media":"Alien (1979)","family":"Booster principal"},{"set":"CW02","name":"Guerre Coloniale","faction":"HUMAN","media":"Aliens (1986)","family":"Booster principal"},{"set":"HG03","name":"Terrains de Chasse","faction":"YAUTJA","media":"Predator (1987), Predator 2, Predators","family":"Booster principal"},{"set":"AV04","name":"Rite de Sang","faction":"HYBRID","media":"Alien vs Predator (2004), AVP Requiem (2007)","family":"Booster principal"},{"set":"EV05","name":"Évolution Parfaite","faction":"ENGINEER","media":"Prometheus (2012), Alien Covenant (2017)","family":"Booster principal"},{"set":"F306","name":"Cendres de Fiorina","faction":"XENO","media":"Alien 3 (1992)","family":"Booster légendaire"},{"set":"R407","name":"Les Héritiers de l'Auriga","faction":"HYBRID","media":"Alien Resurrection (1997)","family":"Booster thématique"},{"set":"IS08","name":"Terreur à Sevastopol","faction":"HUMAN","media":"Alien Isolation (2014)","family":"Booster thématique"},{"set":"RO09","name":"Renaissance Noire","faction":"ENGINEER","media":"Alien Romulus (2024)","family":"Booster principal"},{"set":"EA10","name":"La Menace sur Terre","faction":"XENO","media":"Alien Earth (2025)","family":"Booster principal"},{"set":"WY11","name":"Directives Weyland-Yutani","faction":"HUMAN","media":"Weyland-Yutani, synthétiques, colonies","family":"Booster thématique"},{"set":"MC12","name":"Arsenal Colonial","faction":"HUMAN","media":"USCM, Sulaco, M41A, véhicules","family":"Booster de construction"},{"set":"P213","name":"Chasseurs de Los Angeles","faction":"YAUTJA","media":"Predator 2 (1990)","family":"Booster légendaire"},{"set":"PR14","name":"Planète Réserve","faction":"YAUTJA","media":"Predators (2010)","family":"Booster thématique"},{"set":"PY15","name":"La Proie des Grandes Plaines","faction":"YAUTJA","media":"Prey (2022)","family":"Booster légendaire"},{"set":"ST16","name":"Expériences Stargazer","faction":"HUMAN","media":"The Predator (2018)","family":"Booster thématique"},{"set":"BD17","name":"Exil dans les Badlands","faction":"YAUTJA","media":"Predator Badlands (2025)","family":"Booster principal"},{"set":"KK18","name":"Chasse à Travers les Siècles","faction":"YAUTJA","media":"Predator Killer of Killers (2025)","family":"Booster thématique"},{"set":"CM19","name":"Ruines de Hadley's Hope","faction":"XENO","media":"Aliens Colonial Marines (2013)","family":"Booster de construction"},{"set":"FE20","name":"Équipes de Feu","faction":"HUMAN","media":"Aliens Fireteam Elite (2021)","family":"Booster de construction"},{"set":"DD21","name":"Descente Tactique","faction":"HUMAN","media":"Aliens Dark Descent (2023)","family":"Booster thématique"},{"set":"RI22","name":"Incursion de l'Inconnu","faction":"XENO","media":"Alien Rogue Incursion","family":"Booster thématique"},{"set":"EX23","name":"Guerre d'Extinction","faction":"XENO","media":"Aliens versus Predator Extinction (2003)","family":"Booster principal"},{"set":"PH24","name":"Légendes des Chasseurs","faction":"YAUTJA","media":"Predator Hunting Grounds (jeu et DLC)","family":"Booster collector"},{"set":"CB25","name":"Chroniques Dessinées","faction":"HUMAN","media":"Comics et romans Alien, Predator, AVP","family":"Booster collector"},{"set":"KN26","name":"Bestiaire de Collection","faction":"XENO","media":"Figurines Kenner, NECA, variantes","family":"Booster collector"},{"set":"YA27","name":"Les Royaumes Yautja","faction":"YAUTJA","media":"Homeworld, clans, sociétés et rites","family":"Booster principal"},{"set":"TF28","name":"Frontière Tantalus","faction":"HUMAN","media":"Aliens Tantalus Frontier (original du projet)","family":"Booster principal"},{"set":"HA29","name":"Éclosion MNEMOSYNE","faction":"XENO","media":"Alien Hive Ascension (projet original)","family":"Booster principal"},{"set":"WW30","name":"Guerres des Ruches","faction":"HYBRID","media":"World Hive Wars (projet original)","family":"Booster principal"}];
  const groups=[
    {category:'STARTER_OR_STRUCTURE',num:1,title:'Fondation',side:15},
    {category:'CONSTRUCTION',num:2,title:'Déploiement rapide',side:45},
    {category:'CONSTRUCTION',num:3,title:'Contrôle tactique',side:45},
    {category:'CONSTRUCTION',num:4,title:'Synergies',side:45},
    {category:'SPECIAL',num:5,title:'Opération spéciale',side:20},
    {category:'LIGUE',num:6,title:'Ligue standard',side:15},
    {category:'LIGUE',num:7,title:'Ligue expert',side:15},
  ];
  const fnv=s=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  function rng(seed){let state=seed>>>0||1;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};}
  function shuffle(a,r){const arr=a.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
  const registry=new Map(D.cards.map(c=>[c.id,c]));
  const total=map=>Object.values(map).reduce((a,n)=>a+n,0);
  const supports=c=>c.faction==='HYBRID'||c.faction==='NEUTRAL';
  function canUse(c,faction){return c.faction===faction||c.faction==='NEUTRAL';}
  function blueprint(faction,setCode,style,seed){
    const main={...D.createRemixedDeck(faction,seed,style%4)};
    const focusCandidates=D.cards.filter(c=>c.set===setCode&&canUse(c,faction)&&c.cardClass!=='VEHICULE');
    // Échanges par catégorie : préserver le nombre d'unités et de pilotes.
    const shuffled=shuffle(focusCandidates,rng(fnv(setCode+'|focus|'+seed)));
    let actualFocus=Object.entries(main).reduce((sum,[id,n])=>sum+(registry.get(id)?.set===setCode?n:0),0);
    for(const focus of shuffled.slice(0,3)){
      if(actualFocus>=2)break;
      if((main[focus.id]||0)>=2)continue;
      const donor=Object.keys(main).find(id=>id!==focus.id&&main[id]>0&&registry.get(id)?.set!==setCode
        &&registry.get(id)?.cardClass===focus.cardClass
        &&(focus.cardClass!=='PERSONNAGE'||Object.entries(main).reduce((n,[x,k])=>n+(registry.get(x)?.cardClass==='PERSONNAGE'?k:0),0)>=4));
      if(!donor)continue;
      main[donor]--;if(!main[donor])delete main[donor];
      main[focus.id]=(main[focus.id]||0)+1;actualFocus++;
    }
    if(total(main)!==30)throw Error('Main deck incomplet '+setCode);
    return {main,focusCards:actualFocus,focusSupported:focusCandidates.length>0};
  }
  function reserveFor(faction,main,count,seed){
    const reserve={};
    const list=shuffle(D.cards.filter(c=>canUse(c,faction)),rng(fnv(faction+'|side|'+seed)));
    const used=c=>(main[c.id]||0)+(reserve[c.id]||0);
    let current=0;
    // Un exemplaire par carte d'abord, plus de diversité avant les doublons.
    for(const c of list){if(current>=count)break;if(used(c)>=3)continue;
      reserve[c.id]=(reserve[c.id]||0)+1;current++;
    }
    for(const c of list){while(current<count&&used(c)<3){reserve[c.id]=(reserve[c.id]||0)+1;current++;}if(current===count)break;}
    if(current!==count)throw Error('Réserve insuffisante '+faction+' / '+count);
    return reserve;
  }
  function compose(set,group,seed){
    const isFirstStarter=['NX01','CW02','HG03','AV04','EV05'].includes(set.set);
    const category=group.category==='STARTER_OR_STRUCTURE'?(isFirstStarter?'STARTER':'STRUCTURE'):group.category;
    const prefix={STARTER:'STA',STRUCTURE:'STR',CONSTRUCTION:'CON',SPECIAL:'SPE',LIGUE:'LIG'}[category];
    const stableId=prefix+'-'+set.set+'-'+group.num;
    const {main,focusCards,focusSupported}=blueprint(set.faction,set.set,group.num-1,seed);
    const side=reserveFor(set.faction,main,group.side,seed+13);
    return {
      id:'production_'+stableId.toLowerCase(),
      planDeckId:stableId,
      name:set.name+' — '+group.title,
      faction:set.faction,
      category,focus:set.set,sourceMedia:set.media,
      cards:main,reserve:side,count:30,boxCount:30+group.side,
      productionPlan:true,focusCards,focusSupported,
      description:focusSupported
        ?'Produit '+category+' — '+focusCards+' carte(s) liées à '+set.set+' ; '+group.side+' alternatives.'
        :'Composition transversale provisoire : aucune carte propre à '+set.set+' actuellement jouable.',
    };
  }
  const added=[],ids=new Set(D.expansionDecks.map(p=>p.id));
  for(const set of plan)for(const group of groups){
    const seed=fnv('AVP-PRODUCTION|'+set.set+'|'+group.num);
    const p=compose(set,group,seed);
    if(ids.has(p.id))throw Error('Identifiant de deck déjà utilisé '+p.id);
    ids.add(p.id);added.push(p);D.expansionDecks.push(p);
  }
  D.productionDecks=added;
  D.remixPresetDeck=function(preset,seed){
    if(!preset||!Object.hasOwn(D.factions,preset.faction)||preset.faction==='NEUTRAL')return null;
    if(preset.productionPlan){
      const set=plan.find(s=>s.set===preset.focus);
      const group=groups.find(g=>g.num===Number(preset.planDeckId.split('-').at(-1)));
      if(!set||!group)return null;
      const shuffled=compose(set,group,fnv(preset.id+'|'+seed));
      return {cards:shuffled.cards,reserve:shuffled.reserve,focusCards:shuffled.focusCards};
    }
    const cards=D.createRemixedDeck(preset.faction,seed,seed%4);
    const reserve=reserveFor(preset.faction,cards,15,seed+11);
    return {cards,reserve,focusCards:0};
  };
  D.productionDeckStatus={schema:'avp-tcg/production-decks-v1',sourcePlan:'content-plan/decks.csv',
    plans:plan.length,added:added.length,legacyPresets:70,totalPresets:D.expansionDecks.length,
    categoryCounts:groups.reduce((acc,g)=>{for(const set of plan){
      const c=g.category==='STARTER_OR_STRUCTURE'?
        (['NX01','CW02','HG03','AV04','EV05'].includes(set.set)?'STARTER':'STRUCTURE'):g.category;
      acc[c]=(acc[c]||0)+1;
    }return acc;},{})};
})();
