/* Explicit lifecycle routes and source-scoped variants. Existing cards remain intact.
 * Every transformation below is a TCG recipe, not a claim of universal biology.
 * Load after asymmetric-decks and optional arsenal cards, before engine.js.
 */
(function(){
'use strict';
const D=window.AVP_DATA;
if(!D?.asymmetricStage||D.cards.length<891)throw Error('Le catalogue asymétrique est requis pour les cycles.');
if(D.hiveCoverage)throw Error('Cycles déjà chargés.');
const SOURCES=[{"id":"bio.pathogen.abomination","name":"Abomination","classification":"project-source","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.deacon-line","name":"Deacon Line","classification":"project-source","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.engineer-hybrid","name":"Engineer hybrid","classification":"game-roster-reference","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.harbinger","name":"Harbinger","classification":"game-roster-reference","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.neomorph","name":"Neomorph","classification":"project-source","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.offspring","name":"Offspring","classification":"source-labelled-variant","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.pathogen-blight","name":"Pathogen Blight","classification":"game-roster-reference","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.pathogen-brute","name":"Pathogen Brute","classification":"game-roster-reference","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.pathogen-mimic","name":"Pathogen Mimic","classification":"project-source","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.pathogen-popper","name":"Pathogen Popper","classification":"game-roster-reference","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.pathogen-runner","name":"Pathogen Runner","classification":"game-roster-reference","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.protomorph","name":"Protomorph","classification":"project-source","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.pathogen.trilobite-echo","name":"Trilobite Echo","classification":"project-source","kind":"ORGANISM","biology":"pathogen","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.arcology-lurker","name":"Arcology Lurker","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.atarax-ripper","name":"ATARAX Ripper","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.big-chap","name":"Drone / Big Chap","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.boiler","name":"Boiler","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.burster","name":"Burster","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.caravan-stalker","name":"Caravan Stalker","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.carrier","name":"Carrier","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.chestburster","name":"Chestburster","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.crusher","name":"Crusher","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.drone","name":"Drone","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.dust-runner","name":"Dust Runner","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.exploder","name":"Exploder","classification":"game-roster-reference","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.facehugger","name":"Facehugger","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.foundry-crusher","name":"Foundry Crusher","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.foundry-drone","name":"Foundry Drone","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.k-series-yellow-xenomorph","name":"K-Series Yellow Xenomorph","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.lurker","name":"Lurker","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.monica-line","name":"Monica Line","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.neuro-xeno-drone","name":"Neuro-Xeno Drone","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.ovomorph","name":"Ovomorphe","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.pale-crucible-hunter","name":"Pale Crucible Hunter","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.praetorian","name":"Prétorien","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.predalien","name":"Predalien","classification":"source-labelled-variant","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.prowler","name":"Prowler","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.queen","name":"Reine Xénomorphe","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.ravager","name":"Ravager","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.red-xenomorph","name":"Red Xenomorph","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.reef-spitter","name":"Reef Spitter","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.reef-stalker","name":"Reef Stalker","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.ripper-queen","name":"Ripper Queen","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.runner","name":"Runner","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.salvage-hive-brute","name":"Salvage Hive Brute","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.siege-royal","name":"Siege Royal","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.specimen-six-line","name":"Specimen Six Line","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.spitter","name":"Spitter","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.warden","name":"Warden","classification":"game-roster-reference","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"bio.xenomorph.warrior","name":"Warrior","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-name-no-required-evolution-path"},{"id":"bio.xenomorph.xenoborg","name":"Xenoborg","classification":"project-source","kind":"ORGANISM","biology":"xenomorph","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.acm-boiler","name":"Boiler — Colonial Marines","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.acm-crusher","name":"Crusher — Colonial Marines","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.acm-lurker","name":"Lurker — Colonial Marines","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.acm-queen","name":"Reine — Colonial Marines","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.acm-raven","name":"Raven — Colonial Marines","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.acm-spitter","name":"Spitter — Colonial Marines","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.ari-facehugger","name":"Facehugger — Rogue Incursion","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.burster","name":"Burster — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.covenant-xenomorph","name":"Xénomorphe — Alien: Covenant","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.crusher","name":"Crusher — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.dark-descent-praetorian","name":"Prétorien — Dark Descent","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.deacon","name":"Deacon — Prometheus","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.fireteam-queen","name":"Reine — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.fireteam-runner","name":"Runner — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.kenner-scorpion","name":"Scorpion Alien — Kenner / NECA","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.kenner-snake","name":"Snake Alien — Kenner / NECA","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.neomorph","name":"Neomorph — Alien: Covenant","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.newborn","name":"Newborn — Alien Resurrection","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.pathogen-brute","name":"Pathogen Brute","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.pathogen-runner","name":"Pathogen Runner","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.praetorian","name":"Prétorien — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.predalien","name":"Predalien — AVP: Requiem","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.prowler","name":"Prowler — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.queen-aliens","name":"Reine — Aliens","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.runner","name":"Runner — Alien 3","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"profile.whw.extended.spitter","name":"Spitter — Fireteam Elite","classification":"licensed-or-project-work-scoped-profile-not-universal-caste","kind":"PROFILE","biology":"","identityPolicy":"work-specific-reference"},{"id":"ha.bio.runner","name":"Runner","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.worker","name":"Worker","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.spitter","name":"Spitter","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.praetorian","name":"Praetorian","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.royal-facehugger","name":"Superfacehugger Royal","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.prowler","name":"Prowler","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.burster","name":"Burster","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.crusher","name":"Crusher","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.palatine","name":"Palatine (Garde Royal Suprême)","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"},{"id":"ha.bio.offspring","name":"Offspring (Hybride Z-01)","classification":"hive-ascension-specific-variant","kind":"PROJECT_VARIANT","biology":"xenomorph-inspired-or-mutagenic","identityPolicy":"work-specific-reference"}];
const sourceVersion='e65b75a6bfd1284dbac746102fdbae4fc5a3786b';
const sourceUrl='https://github.com/darknigthmare/alien_base/blob/'+sourceVersion+'/data/entities.v1.json';
const previousCards=D.cards.slice(), byId=new Map(D.cards.map(c=>[c.id,c])), created=[], routes=[], roots={};
const hash=s=>{let h=2166136261>>>0;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const slug=s=>s.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');
const defaults={XENO:{set:'CW02',source:'bio.xenomorph.drone'},ENGINEER:{set:'EV05',source:'bio.pathogen.abomination'},HYBRID:{set:'AV04',source:'bio.pathogen.offspring'}};
function create(id,name,faction,cardClass,extra={}){
  if(byId.has(id))throw Error('Identifiant de cycle déjà présent: '+id);
  const n=created.length+1,base=defaults[faction],source=extra.source||base.source;
  const type=extra.type||(['CREATURE','HOTE','OEUF'].includes(cardClass)?'UNIT':'TACTIC');
  const card={id,name,faction,cardClass,type,set:extra.set||base.set,
    rarity:extra.rarity||(n%11===0?'UR':n%5===0?'SR':n%3===0?'R':'C'),cost:extra.cost??1,
    attack:extra.attack||0,health:extra.health||0,keywords:extra.keywords||[],
    tags:['hive-complete','asymmetric','cycle',faction.toLowerCase(),...(extra.tags||[])],
    text:extra.text||'',flavor:'Séquence de jeu originale. Les profils d’œuvres et de projets restent distincts.',
    effect:extra.effect||{},sourceEntityId:source,sourcePolicy:'hive-cycle-tcg-adaptation-not-universal-biology',
    sourceRelation:extra.sourceRelation||'ADAPTATION_TCG',sourceNote:extra.sourceNote||'La source identifie le sujet. Cette recette, ses coûts et ses statistiques sont propres au TCG.',
    sourcePrimaryUrl:extra.sourcePrimaryUrl||null,
    source:{workbook:'darknigthmare/alien_base@'+sourceVersion,sheet:'data/entities.v1.json',entry:source,prototype:false},
    collectorNo:(extra.set||base.set)+'-HV-'+String(n).padStart(3,'0'),index:D.cards.length,
    artSeed:hash(id),slug:id.toLowerCase().replaceAll('_','-')};
  for(const key of ['evolutionStage','hostType','eggLine','requiresEgg','summonByFusion','hiveMaterial','hiveRoot','continuity'])
    if(extra[key]!==undefined)card[key]=extra[key];
  card.searchText=[id,name,faction,cardClass,card.text,card.continuity||'',...card.tags].join(' ').toLowerCase();
  D.cards.push(card);byId.set(id,card);created.push(card);return card;
}
function addRoute(id,name,faction,result,primary,options={}){
  const resultCard=byId.get(result);if(!resultCard||resultCard.type!=='UNIT')throw Error('Résultat de cycle absent: '+result);
  const effect={kind:'HIVE_ROUTE',target:'FRIENDLY_UNIT',materialIds:[...primary],resultCardId:result,
    secondaryIds:[...(options.secondary||[])],catalystIds:[...(options.catalysts||[])],
    biomassCost:options.biomassCost??1,biomassGain:options.biomassGain||0,
    preserveMaterial:!!options.preserveMaterial,requireOrganic:options.requireOrganic!==false,
    routeId:id,continuity:options.continuity||'Adaptation TCG'};
  const label=options.method||'MUE_TCG';
  const materials=primary.map(x=>byId.get(x)?.name||x).join(' ou ');
  const text=options.text||'Recette TCG : '+materials+(effect.secondaryIds.length?' + '+effect.secondaryIds.map(x=>byId.get(x)?.name||x).join(' ou '):'')+
    ' → '+resultCard.name+'. Résultat requis dans la main ou le deck. '+effect.biomassCost+' biomasse(s).';
  const card=create('HV_EV_'+slug(id),name,faction,'EVOLUTION',{
    source:options.source||resultCard.sourceEntityId||defaults[faction].source,
    cost:options.cost??Math.max(0,Math.min(3,Math.ceil(resultCard.cost/3))),rarity:options.rarity,
    text,effect,continuity:effect.continuity,sourcePrimaryUrl:options.sourcePrimaryUrl});
  const route={id,method:label,actionCardId:card.id,resultCardId:result,materialCardIds:[...primary,...effect.secondaryIds],
    primaryMaterialIds:[...primary],secondaryMaterialIds:[...effect.secondaryIds],catalystCardIds:[...effect.catalystIds],
    biomassCost:effect.biomassCost,continuity:effect.continuity,preserveMaterial:effect.preserveMaterial,
    sourceId:card.sourceEntityId,ruleStatus:'TCG_ADAPTATION',deckIds:[]};
  routes.push(route);return route;
}
function existingRoute(id,action,material,method,continuity){
  const c=byId.get(action),e=c?.effect||{};
  const r={id,method,actionCardId:action,resultCardId:c?.requiresEgg?c.id:e.resultCardId,
    materialCardIds:material,primaryMaterialIds:material.slice(0,1),secondaryMaterialIds:material.slice(1),catalystCardIds:[],
    biomassCost:e.biomassCost||0,continuity,sourceId:c.sourceEntityId,ruleStatus:'TCG_ADAPTATION',deckIds:[]};
  if(!r.resultCardId)throw Error('Recette historique invalide '+action);
  routes.push(r);return r;
}
const find=predicate=>previousCards.find(predicate);
function classical(hostType){
  const key='classic_'+hostType.toLowerCase();if(roots[key])return roots[key];
  const egg=find(c=>c.id.startsWith('MX_')&&c.cardClass==='OEUF'&&c.eggLine==='COMMON');
  const hugger=find(c=>c.id.startsWith('MX_')&&c.requiresEgg&&c.eggLine==='COMMON');
  const host=find(c=>c.id.startsWith('MX_')&&c.cardClass==='HOTE'&&c.hostType===hostType);
  const fusion=find(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType===hostType);
  const moult=find(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='CHESTBURSTER'&&c.effect.hostType===hostType);
  const hatch=existingRoute(key+'_hatch',hugger.id,[egg.id],'ECLOSION','Cycle Xénomorphe / hôte '+hostType);
  const fuse=existingRoute(key+'_implant',fusion.id,[hugger.id,host.id],'PARASITAGE','Cycle Xénomorphe / hôte '+hostType);
  const mature=existingRoute(key+'_mature',moult.id,[fusion.effect.resultCardId],'MATURATION','Cycle Xénomorphe / hôte '+hostType);
  return roots[key]={id:key,faction:'XENO',startCardIds:[egg.id,host.id],steps:[hatch,fuse,mature],terminalCardId:moult.effect.resultCardId};
}
const common=classical('HUMAN'),quadruped=classical('QUAD'),yautja=classical('YAUTJA');
const jelly=find(c=>c.effect?.resultCardId===D.asymmetricStage.praetorian);
const crown=find(c=>c.effect?.resultCardId===D.asymmetricStage.queen);
const jellyRoute=existingRoute('royal_jelly',jelly.id,[common.terminalCardId],'GELEE_ROYALE','Dynastie de ruche — adaptation TCG');
const crownRoute=existingRoute('royal_crown',crown.id,[D.asymmetricStage.praetorian],'PROMOTION_ROYALE','Dynastie de ruche — adaptation TCG');
roots.praetorian={...common,id:'praetorian',steps:[...common.steps,jellyRoute],terminalCardId:D.asymmetricStage.praetorian};
roots.queen={...common,id:'queen',steps:[...common.steps,jellyRoute,crownRoute],terminalCardId:D.asymmetricStage.queen};

const originNames={
  spores:['Hôte exposé aux spores','Néomorphe juvénile','Éruption néomorphe','Alien: Covenant'],
  mutagen:['Organisme biologique exposé','Forme mutagène intermédiaire','Altération au pathogène','Pathogènes — adaptation TCG'],
  prometheus:['Hôte de gestation altérée','Trilobite de gestation','Gestation du Trilobite','Prometheus'],
  romulus:['Hôte en gestation Z-01','Hybride Z-01 immature','Gestation altérée Z-01','Alien: Romulus / adaptations séparées'],
  clone:['Matrice biologique de clonage','Gestation issue du clonage','Développement de laboratoire','Alien Resurrection / adaptations séparées'],
  engineered:['Matrice d’expérimentation biologique','Souche expérimentale immature','Sélection de souche en laboratoire','Laboratoire — adaptation TCG'],
  proto:['Hôte de souche expérimentale','Larve de la souche Covenant','Implantation de la souche Covenant','Alien: Covenant — cycle adapté']
};
function origin(kind,faction){
  const key=kind+'_'+faction.toLowerCase();if(roots[key])return roots[key];
  const [hostName,youngName,actionName,continuity]=originNames[kind];
  const source=kind==='spores'?'bio.pathogen.neomorph':kind==='prometheus'?'card.avp.e_trilobite':kind==='romulus'?'bio.pathogen.offspring':kind==='clone'?'profile.whw.extended.newborn':kind==='proto'?'bio.pathogen.protomorph':defaults[faction].source;
  const host=create('HV_HOST_'+slug(key),hostName+' — '+faction,faction,'HOTE',{source,cost:1,health:950,
    hostType:'HV_'+slug(kind),evolutionStage:'HV_'+slug(kind)+'_HOST',hiveMaterial:true,hiveRoot:key,continuity,
    effect:{onPlay:{kind:'DRAW',count:1}},text:'Matériau biologique de la route '+continuity+'. Ne peut pas attaquer. À l’arrivée : piochez 1.'});
  const young=create('HV_FORM_'+slug(key),youngName+' — '+faction,faction,'CREATURE',{source,cost:2,attack:420,health:1050,
    evolutionStage:'HV_'+slug(kind)+'_INTERMEDIATE',summonByFusion:true,hiveMaterial:true,hiveRoot:key,continuity,
    keywords:kind==='spores'?['RUSH']:kind==='prometheus'?['GUARD']:[],
    text:'Forme de cycle. Invoquée par sa recette depuis le deck ou la main. Sa lignée ne peut pas alimenter une mue Xénomorphe ordinaire.'});
  const first=addRoute(key+'_origin',actionName,faction,young.id,[host.id],{source,cost:1,biomassCost:0,biomassGain:2,method:'GESTATION_'+slug(kind),continuity});
  const root={id:key,faction,startCardIds:[host.id],steps:[first],terminalCardId:young.id};
  if(kind==='prometheus'){
    const engineer=create('HV_HOST_ENGINEER_'+faction,'Hôte Ingénieur — '+faction,faction,'HOTE',{source:'card.avp.e_engineer',cost:1,health:1200,
      hostType:'HV_ENGINEER',evolutionStage:'HV_ENGINEER_HOST',hiveMaterial:true,hiveRoot:key,continuity,
      effect:{onPlay:{kind:'DRAW',count:1}},text:'Hôte biologique Ingénieur. Matériau de l’implantation par Trilobite, distinct d’un Facehugger.'});
    root.startCardIds.push(engineer.id);root.secondaryCardIds=[engineer.id];
  }
  roots[key]=root;return root;
}
function hybridParasite(){
  const key='predalien_hybrid';if(roots[key])return roots[key];
  const faction='HYBRID',source='bio.xenomorph.predalien',continuity='AVP / Predalien — adaptation TCG';
  const egg=create('HV_EGG_PREDALIEN','Œuf de lignée Yautja',faction,'OEUF',{source:'bio.xenomorph.ovomorph',cost:0,health:800,eggLine:'COMMON',evolutionStage:'EGG',hiveMaterial:true,hiveRoot:key,
    keywords:['GUARD'],effect:{onPlay:{kind:'DRAW',count:1}},text:'Œuf de la recette hybride. Sacrifié pour faire éclore son Facehugger.'});
  const hugger=create('HV_FACE_PREDALIEN','Facehugger de la lignée hybride',faction,'CREATURE',{source:'bio.xenomorph.facehugger',cost:1,attack:180,health:700,eggLine:'COMMON',requiresEgg:true,
    evolutionStage:'FACEHUGGER',hiveMaterial:true,hiveRoot:key,text:'Éclosion : sacrifiez un Œuf compatible. À combiner avec un hôte Yautja.'});
  const host=create('HV_HOST_PREDALIEN','Hôte Yautja — lignée hybride',faction,'HOTE',{source:'character.yautja.scar_avp_2004',cost:1,health:1050,hostType:'HV_YAUTJA',
    evolutionStage:'HV_YAUTJA_HOST',hiveMaterial:true,hiveRoot:key,effect:{onPlay:{kind:'DRAW',count:1}},text:'Hôte biologique Yautja de la recette hybride. Ne peut pas attaquer.'});
  const chest=create('HV_LARVA_PREDALIEN','Chestburster de la lignée hybride',faction,'CREATURE',{source,cost:2,attack:600,health:1250,summonByFusion:true,
    evolutionStage:'HV_YAUTJA_LARVA',hiveMaterial:true,hiveRoot:key,keywords:['ACID'],text:'Résultat de Facehugger et hôte Yautja. Invoqué depuis la main ou le deck.'});
  const hatch=existingRoute(key+'_hatch',hugger.id,[egg.id],'ECLOSION',continuity);
  const fuse=addRoute(key+'_implant','Fusion parasitaire Yautja — lignée hybride',faction,chest.id,[hugger.id],{source,secondary:[host.id],biomassCost:0,biomassGain:2,cost:1,method:'PARASITAGE',continuity});
  return roots[key]={id:key,faction,startCardIds:[egg.id,host.id],steps:[hatch,fuse],terminalCardId:chest.id};
}

const aliases={
 'bio.xenomorph.ovomorph':['X_OVOMORPH'],'bio.xenomorph.facehugger':['X_FACEHUGGER'],'bio.xenomorph.chestburster':['X_CHESTBURSTER'],
 'bio.xenomorph.drone':['X_DRONE'],'bio.xenomorph.warrior':['X_WARRIOR'],'bio.xenomorph.runner':['X_RUNNER'],'bio.xenomorph.spitter':['X_SPITTER'],
 'bio.xenomorph.praetorian':['X_PRAETORIAN'],'bio.xenomorph.queen':['X_QUEEN'],'bio.xenomorph.big-chap':['X_BIG_CHAP'],
 'bio.xenomorph.predalien':['H_PREDALIEN'],'bio.pathogen.neomorph':['X_NEOMORPH'],'bio.pathogen.deacon-line':['X_DEACON'],
 'bio.pathogen.pathogen-popper':['X_POPPER'],'bio.pathogen.pathogen-brute':['X_PATH_BRUTE'],'bio.xenomorph.warden':['X_WARDEN']
};
const extras=['X_QUEEN_MOTHER','X_SCORCHED','X_GRID','X_RED','X_GORILLA','X_BULL','X_MANTIS','X_SNAKE','X_FLYING_QUEEN',
  'X_STALKER','X_PATH_STALKER','X_PATH_QUEEN','X_SIREN','H_NEWBORN','H_WHITE_HYBRID','H_ALIEN_KING','E_HAMMERPEDE','E_BLACK_GOO_MUTANT'];
const sourceRows=[...SOURCES,...extras.map(id=>({id:'card.avp.'+id.toLowerCase(),name:byId.get(id).name,classification:'original-tcg-gameplay-card',kind:'HISTORICAL_CARD',biology:'source-scoped',legacyId:id}))];
const primaryBySource={
 'bio.xenomorph.ovomorph':common.startCardIds[0],
 'bio.xenomorph.facehugger':common.steps[0].resultCardId,
 'bio.xenomorph.chestburster':common.steps[1].resultCardId,
 'bio.xenomorph.drone':common.terminalCardId,
 'bio.xenomorph.runner':quadruped.terminalCardId,
 'bio.xenomorph.praetorian':D.asymmetricStage.praetorian,
 'bio.xenomorph.queen':D.asymmetricStage.queen,
 'ha.bio.royal-facehugger':find(c=>c.requiresEgg&&c.eggLine==='ROYAL').id
};
const entries=[];
function continuityFor(s){
  if(s.id.startsWith('ha.bio.'))return 'Hive Ascension — variante de projet';
  const x=s.id.split('.').pop();
  if(/kenner/.test(x)||/X_(GORILLA|BULL|MANTIS|SNAKE|FLYING_QUEEN)/.test(s.legacyId||''))return 'Kenner / adaptations de collection';
  if(/acm-/.test(x))return 'Aliens: Colonial Marines';
  if(/fireteam|pathogen-(brute|runner)|^(burster|crusher|praetorian|prowler|spitter)$/.test(x)&&s.kind==='PROFILE')return 'Aliens: Fireteam Elite';
  if(/dark-descent/.test(x))return 'Aliens: Dark Descent';
  if(/ari-facehugger/.test(x))return 'Alien: Rogue Incursion';
  if(/neomorph|covenant|protomorph/.test(x))return 'Alien: Covenant';
  if(/deacon|trilobite/.test(x))return 'Prometheus';
  if(/offspring/.test(x))return 'Alien: Romulus / profil déclaré';
  if(/newborn/.test(x))return 'Alien Resurrection';
  if(/predalien/.test(x))return 'AVP / AVP: Requiem';
  if(x==='runner')return 'Alien 3 / profil déclaré';
  return s.classification==='project-source'?'Registre central — origine à vérifier':'Profil de jeu ou d’œuvre distinct';
}
function rootFor(s,faction){
  const x=(s.id+' '+s.name).toLowerCase();
  if(/predalien/.test(x))return faction==='HYBRID'?hybridParasite():yautja;
  if(/newborn|clon/.test(x))return origin('clone',faction);
  if(/offspring|z-01/.test(x))return origin('romulus',faction);
  if(/deacon/.test(x))return origin('prometheus',faction);
  if(/trilobite/.test(x))return origin('prometheus',faction);
  if(/neomorph/.test(x))return origin('spores',faction);
  if(/protomorph|covenant-xenomorph/.test(x))return origin('proto',faction);
  if(faction==='ENGINEER'||(faction==='HYBRID'&&!/predalien/.test(x)))return origin('mutagen',faction);
  if(/xenoborg|k-series|neuro-|monica/.test(x))return origin('engineered',faction);
  if(/queen.mother|flying.queen/.test(x))return roots.queen;
  if(/queen|palatine|praetorian|siege-royal/.test(x))return roots.praetorian;
  if(/runner|crusher|bull|gorilla|snake|scorpion/.test(x))return quadruped;
  return common;
}
for(const source of sourceRows){
  const candidates=previousCards.filter(c=>c.sourceEntityId===source.id);
  const historic=[...(aliases[source.id]||[]),...(source.legacyId?[source.legacyId]:[])].filter(id=>byId.has(id));
  const legacy=[...new Set([...candidates.map(c=>c.id),...historic])];
  const exactUnit=candidates.find(c=>c.type==='UNIT')||historic.map(id=>byId.get(id)).find(c=>c.type==='UNIT');
  const faction=exactUnit?.faction||(source.id.startsWith('bio.pathogen.')?'ENGINEER':'XENO');
  const continuity=continuityFor(source),root=rootFor(source,faction);
  let primary=primaryBySource[source.id]||exactUnit?.id;
  if(!primary){
    const royal=/queen|royal|praetorian|palatine/.test(source.id),heavy=/brute|crusher|ravager|warden/.test(source.id);
    const cost=royal?5:heavy?4:3;
    primary=create('HV_CASTE_'+slug(source.id),source.name+' — forme de cycle',faction,'CREATURE',{
      source:source.id,cost,attack:450+cost*180,health:700+cost*230,rarity:royal?'UR':'R',
      evolutionStage:'HV_'+slug(source.id),summonByFusion:true,continuity,
      keywords:royal?['GUARD','ACID','UNIQUE']:heavy?['ARMOR','ACID']:['ACID','HIVE'],
      tags:royal?['royalty']:[],text:'Forme de cycle du référentiel. Invoquée par sa recette depuis la main ou le deck. '+continuity+'.'}).id;
  }
  let path=[...root.steps],start=[...root.startCardIds];
  if(primary===common.startCardIds[0])path=[];
  else if(primary===common.steps[0].resultCardId)path=common.steps.slice(0,1);
  else if(primary===common.steps[1].resultCardId)path=common.steps.slice(0,2);
  else if(primary===common.terminalCardId)path=[...common.steps];
  else if(primary===quadruped.terminalCardId)path=[...quadruped.steps];
  else if(primary===D.asymmetricStage.praetorian)path=[...roots.praetorian.steps];
  else if(primary===D.asymmetricStage.queen)path=[...roots.queen.steps];
  else if(source.id==='ha.bio.royal-facehugger'){
    const royalEgg=find(c=>c.cardClass==='OEUF'&&c.eggLine==='ROYAL');
    start=[royalEgg.id];path=[existingRoute('royal_hatch',primary,[royalEgg.id],'ECLOSION_ROYALE',continuity)];
    const implant=existingRoute('royal_implant',common.steps[1].actionCardId,[primary,common.startCardIds[1]],'PARASITAGE_ROYAL',continuity);
    roots.royal={id:'royal',faction:'XENO',startCardIds:[royalEgg.id,common.startCardIds[1]],
      steps:[...path,implant,...roots.queen.steps.slice(2)],terminalCardId:D.asymmetricStage.queen};
  }else{
    const target=byId.get(primary),method=source.kind==='PROJECT_VARIANT'?'ADAPTATION_PROJET':source.kind==='PROFILE'?'PROFIL_OEUVRE':root.id.startsWith('prometheus')?'IMPLANTATION_TRILOBITE':'MUE_TCG';
    const r=addRoute('source_'+slug(source.id).toLowerCase(),(source.kind==='PROFILE'?'Expression de lignée — ':'Maturation — ')+source.name,
      faction,primary,[root.terminalCardId],{source:source.id,secondary:/deacon/.test(source.id)?root.secondaryCardIds||[]:[],
      method,continuity,biomassCost:Math.max(0,Math.min(4,target.cost-2)),cost:Math.max(0,Math.min(3,Math.ceil(target.cost/3))),
      sourcePrimaryUrl:/neomorph/.test(source.id)?'https://www.mpcvfx.com/en/filmography/alien-covenant/':
        /pathogen-(brute|blight|runner|popper)/.test(source.id)?'https://www.aliensfireteamelite.com/en/community/pathogen-deep-dive-an-exhilarating-new-story/':null});
    path.push(r);
  }
  const need=new Set(path.flatMap(r=>[r.actionCardId,r.resultCardId,...r.materialCardIds,...r.catalystCardIds]));
  // Intermediate starts are supplied only when not themselves produced by the route.
  const produced=new Set(path.map(r=>r.resultCardId));
  start=[...new Set([...start.filter(id=>need.has(id)||id===primary),...path.flatMap(r=>r.materialCardIds).filter(id=>!produced.has(id))])];
  const entry={sourceId:source.id,name:source.name,kind:source.kind,classification:source.classification,continuity,
    faction,legacyCardIds:legacy,cardIds:[primary],evolutionCardIds:path.map(r=>r.actionCardId),routeIds:path.map(r=>r.id),
    startCardIds:start,requiredCardIds:[...need],resultCardId:primary,status:'PLAYABLE_ROUTE',
    notes:'Présence documentaire et recette jouable vérifiées. Le chemin est une adaptation TCG ; les profils d’œuvres et de projets ne sont pas des castes universelles.'};
  entries.push(entry);
}
// Reproduction routes supplement the lineage catalogue without creating cards for free.
const humanHosts=previousCards.filter(c=>c.cardClass==='HOTE'&&c.hostType==='HUMAN').map(c=>c.id);
const eggmorph=addRoute('eggmorph','Eggmorphose de cocon','XENO',common.startCardIds[0],humanHosts,{
  source:'card.avp.t_x_eggmorph',catalysts:[common.terminalCardId,'X_DRONE','X_BIG_CHAP'],biomassCost:1,cost:1,
  method:'EGGMORPHING',continuity:'Alien — scène alternative / adaptation TCG',
  text:'Eggmorphose TCG : requiert un Drone ou Big Chap allié. Sacrifiez un hôte humain allié et 1 biomasse ; placez un Œuf du deck ou de la main sur sa voie. Le Drone reste en jeu.'});
const laying=addRoute('queen_laying','Ponte de la reine','XENO',common.startCardIds[0],[D.asymmetricStage.queen,'X_QUEEN','X_QUEEN_MOTHER'],{
  source:'bio.xenomorph.queen',preserveMaterial:true,biomassCost:1,cost:1,method:'PONTE',continuity:'Ruche — adaptation TCG',
  text:'Ponte : ciblez une Reine alliée, dépensez 1 biomasse et invoquez un Œuf de la main ou du deck dans une voie libre. La Reine reste en jeu.'});
entries.find(e=>e.sourceId==='bio.xenomorph.ovomorph').evolutionCardIds.push(eggmorph.actionCardId,laying.actionCardId);
entries.find(e=>e.sourceId==='bio.xenomorph.ovomorph').routeIds.push(eggmorph.id,laying.id);
const biomass=[];
for(const faction of ['XENO','ENGINEER','HYBRID'])for(let n=1;n<=3;n++){
  biomass.push(create('HV_BIOMASS_'+faction+'_'+n,['Nutriments de cycle','Culture de maturation','Réserve organique'][n-1]+' — '+faction,
    faction,'BIOMASSE',{cost:n-1,rarity:n===3?'UR':'C',effect:{kind:'HIVE_BIOMASS',amount:n},
      text:'Ajoute '+n+' biomasse(s), jusqu’à 12. Réserve commune de vos recettes de cycle.'}).id);
}
D.hiveCoverage={schema:'avp-hive-coverage-v1',sourceVersion,sourceUrl,sourceCount:SOURCES.length,
  historicalSubjects:extras.length,entries,routes,roots,
  reproductionRouteIds:[eggmorph.id,laying.id],biomassCardIds:biomass,
  totals:{subjects:entries.length,routes:routes.length,addedCards:created.length},
  policy:'Source-scoped subjects; explicit TCG recipes. No universal biological evolution claim.'};
D.hiveEdition={schema:'avp-hive-edition-v1',startCount:previousCards.length,addedCount:created.length,cardIds:created.map(c=>c.id),
  sourceCount:SOURCES.length,historicalSubjects:extras.length,artStatus:'NOT_GENERATED'};
})();
