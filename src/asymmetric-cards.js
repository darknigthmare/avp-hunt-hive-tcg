/* Vague asymétrique : armements à munitions, cycle de la ruche, chasse Yautja.
 * 100% mécanique fan-game, images inchangées. Chargé après les 280 préconstruits historiques.
 * Les nouvelles cartes sont indexées par sources Alien_base, sans prétention de canon des effets.
 */
(function(){
'use strict';
const D=window.AVP_DATA;
if(!D?.productionDeckStatus||D.cards.length!==656)throw new Error('Catalogue 656 + 280 préconstruits requis');
const uid=new Set(D.cards.map(c=>c.id));
const counts={HUMAN:0,XENO:0,YAUTJA:0},byClass={},created=[];
Object.assign(D.cardClasses,{
  MUNITION:'Munitions',MODIFICATION:'Module d’arme',ATTAQUE:'Attaque spécialisée',
  OEUF:'Œuf / Ovomorphe',HOTE:'Hôte',EVOLUTION:'Fusion / Évolution',
  BIOMASSE:'Biomasse de ruche',TROPHEE:'Trophée Yautja',
  RESERVE_PLASMA:'Réserve de plasma',HONNEUR:'Rituel d’honneur'
});
const hash=s=>{let n=2166136261>>>0;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return n>>>0;};
const families={
  pulse:{source:'item.m41a-pulse-rifle',ammunition:'10MM',display:'Munitions 10 mm', mods:['VISEUR','CROSSE','CANON','CHARGEUR']},
  smart:{source:'item.m56-smartgun',ammunition:'10MM',display:'Bandes 10 mm',mods:['VISEUR','CANON','CHARGEUR']},
  flame:{source:'item.m240-incinerator-unit',ammunition:'CARBURANT',display:'Réserve incendiaire',mods:['CANON','CHARGEUR']},
  shot:{source:'item.m37a2-pump-shotgun',ammunition:'CAL12',display:'Cartouches calibre 12',mods:['CROSSE','CANON','CHARGEUR']},
  pistol:{source:'item.vp70-combat-pistol',ammunition:'9MM',display:'Chargeurs 9 mm',mods:['VISEUR','CROSSE','CHARGEUR']},
  sniper:{source:'item.m42a-scope-rifle',ammunition:'PRECISION',display:'Munitions de précision',mods:['VISEUR','CROSSE','CANON']},
  grenade:{source:'item.m40-hedp-grenade',ammunition:'GRENADE',display:'Grenades de lanceur',mods:['VISEUR','CANON']},
  laser:{source:'item.f44aa-pulse-rifle',ammunition:'CELLULE',display:'Cellules énergétiques',mods:['VISEUR','CANON','CHARGEUR']}
};
const clsType={PERSONNAGE:'UNIT',CREATURE:'UNIT',OEUF:'UNIT',HOTE:'UNIT',
  MUNITION:'EQUIPMENT',MODIFICATION:'EQUIPMENT',ARME:'EQUIPMENT',EQUIPEMENT:'EQUIPMENT',
  ATTAQUE:'TACTIC',EVOLUTION:'TACTIC',BIOMASSE:'TACTIC',TROPHEE:'TACTIC',
  RESERVE_PLASMA:'TACTIC',HONNEUR:'TACTIC',ACTION:'TACTIC'};
function create(faction,cardClass,name,stats={}){
  const idx=++counts[faction];
  const id='MX_'+faction.slice(0,2)+'_'+String(idx).padStart(3,'0');
  if(uid.has(id))throw Error('Carte dupliquée: '+id);
  const type=stats.type||clsType[cardClass];
  const source=stats.source||({HUMAN:'faction.uscm',XENO:'bio.xenomorph.drone',YAUTJA:'character.yautja.jungle_hunter'}[faction]);
  const set=stats.set||({HUMAN:'CW02',XENO:'NX01',YAUTJA:'HG03'}[faction]);
  const cost=stats.cost??1;
  const card={
    id,name,cardClass,type,faction,set,rarity:stats.rarity||((idx%17===0)?'UR':idx%8===0?'SR':idx%4===0?'R':'C'),
    cost,attack:stats.attack||0,health:stats.health||0,
    keywords:stats.keywords||[],tags:[faction.toLowerCase(),cardClass.toLowerCase(),'asymmetric',...(stats.tags||[])],
    text:stats.text||'',flavor:'Règle de jeu originale inspirée des références du registre Alien_base.',
    effect:stats.effect||{},slot:stats.slot||null,weaponFamily:stats.weaponFamily||null,ammoType:stats.ammoType||null,
    rounds:stats.rounds||0,ammoBonus:stats.ammoBonus||0,ammoPerAttack:stats.ammoPerAttack||0,
    plasmaPerAttack:stats.plasmaPerAttack||0,modSocket:stats.modSocket||null,
    compatibleFamilies:stats.compatibleFamilies||[],requiresEgg:!!stats.requiresEgg,
    eggLine:stats.eggLine||null,evolutionStage:stats.evolutionStage||null,hostType:stats.hostType||null,
    summonByFusion:!!stats.summonByFusion,
    sourceEntityId:source,sourcePolicy:'asymmetric-mechanics-proposed-not-lore-fact',
    source:{workbook:'darknigthmare/alien_base@e65b75a6bfd1284dbac746102fdbae4fc5a3786b',
      sheet:'data/entities.v1.json',entry:source,prototype:false},
    collectorNo:set+'-MX-'+String(idx).padStart(3,'0'),
    index:D.cards.length,artSeed:hash(id),slug:id.toLowerCase().replaceAll('_','-')
  };
  for(const key of ['weaponFamily','ammoType','weaponRange','modAffix','hostRole','hostSpecies','special']){
    if(stats[key]!==undefined)card[key]=stats[key];
  }
  card.searchText=[name,cardClass,type,faction,set,card.text,...card.tags].join(' ').toLowerCase();
  D.cards.push(card);uid.add(id);created.push(card);byClass[cardClass]=(byClass[cardClass]||0)+1;
  return card;
}
const humanRoles=[
  ['Éclaireur colonial','character.reference.alan-decker',1,'DRAW'],
  ['Tireur de couverture','bio.human.colonial-raider',2,'SUPPLY_SEARCH'],
  ['Opératrice radio','character.reference.andrea-rollins',1,'DRAW'],
  ['Médecin d’escouade','character.tantalus.noor-okafor',2,'REPAIR'],
  ['Artilleur lourd','bio.human.weyland-yutani-commando',3,'DRAW'],
  ['Mécanicien de première ligne','character.tantalus.cal-mercer',2,'SUPPLY_SEARCH'],
  ['Sergent de garnison','faction.uscm',3,'FORTIFY'],
  ['Spécialiste ballistique','character.tantalus.inez-harlow',2,'SUPPLY_SEARCH'],
  ['Pilote de navette','character.tantalus.pablo-reyes',2,'DRAW'],
  ['Détachement de sûreté','bio.human.seegson-security',2,'FORTIFY'],
  ['Secouriste de frontière','character.reference.anne-jorden',1,'REPAIR'],
  ['Chef de section USCM','faction.uscm',4,'DRAW']
];
for(const [name,source,cost,kind] of humanRoles){
  const fx=kind==='DRAW'?{kind:'DRAW',count:1}:
    kind==='SUPPLY_SEARCH'?{kind:'SUPPLY_SEARCH',maxCost:4}:
    kind==='REPAIR'?{kind:'FORTIFY',amount:180}:{kind:'FORTIFY',amount:300};
  create('HUMAN','PERSONNAGE',name,{source,set:'CW02',cost,attack:140+cost*155,health:400+cost*250,
    keywords:cost>=3?['SQUAD']:[],tags:['crew','uscm','specialist'],
    effect:{onPlay:fx},text:'À l’arrivée : '+(kind==='DRAW'?'piochez 1.':kind==='SUPPLY_SEARCH'?'cherchez un armement ou des munitions.':kind==='REPAIR'?'préparez 180 points de bouclier.':'renforcez le commandant de 300 points de bouclier.')});
}
const humanWeapons=[
 ['M41A — rafale courte','pulse','CW02',1,300],
 ['M41A — canon de siège','pulse','MC12',3,470],
 ['M41A2 — cadence renforcée','pulse','FE20',2,390],
 ['M56 Smartgun — suivi gyrostabilisé','smart','CW02',3,520],
 ['M56 Smartgun — suppression','smart','MC12',4,620],
 ['M240 — jet incendiaire','flame','CW02',2,380],
 ['M240 — incinération courte','flame','IS08',3,510],
 ['M37A2 — défense rapprochée','shot','MC12',1,310],
 ['M37A2 — munitions lourdes','shot','FE20',2,430],
 ['VP70 — arme de service','pistol','NX01',1,220],
 ['VP70 — double action','pistol','CW02',2,330],
 ['M42A — couverture de précision','sniper','MC12',3,520],
 ['M42A — surveillance longue','sniper','DD21',4,600],
 ['M40 — lanceur de grenades','grenade','CW02',3,590],
 ['M40 — charge de brèche','grenade','MC12',4,690],
 ['F44AA — pulse carbine','laser','RO09',3,550]
];
for(const [name,fam,set,cost,attack] of humanWeapons){
  const f=families[fam];
  create('HUMAN','ARME',name,{source:f.source,set,cost,attack,slot:'WEAPON',weaponFamily:fam,
    ammoType:f.ammunition,ammoPerAttack:1+(cost>=4?1:0),tags:['ranged','firearm',fam],
    text:'Arme à distance : +'+attack+' ATK lorsque le porteur possède '+f.display+' ; chaque attaque dépense '+(1+(cost>=4?1:0))+' charge(s). Compatible avec les mods '+f.mods.join(', ')+'.'});
}
const ammoTiers=[['Standard',3,0,'C'],['Réserve tactique',5,25,'R'],['Perforantes',2,120,'SR']];
for(const [family,f] of Object.entries(families))for(let i=0;i<ammoTiers.length;i++){
  const [tier,rounds,bonus,rarity]=ammoTiers[i];
  const set=family==='laser'?'RO09':family==='flame'?'IS08':family==='pulse'||family==='smart'?'CW02':'MC12';
  create('HUMAN','MUNITION',f.display+' — '+tier,{source:f.source,set,cost:1+(i===2?1:0),rarity,ammoType:f.ammunition,rounds,
    ammoBonus:bonus,tags:['energy','ammunition','reload'],text:'Attachez au Personnage équipé ou non. Fournit '+rounds+' charges de '+f.display+
      (bonus?' ; une attaque chargée gagne +'+bonus+' ATK.':'')+' ; les armes de corps à corps n’en consomment pas.'});
}
const modSockets=[
 ['VISEUR','Viseur réglable','item.motion-tracker',1,120],
 ['CROSSE','Crosse stabilisée','item.m3-personnel-armor',1,75],
 ['CANON','Canon renforcé','item.m41a-pulse-rifle',2,160],
 ['CHARGEUR','Chargeur allégé','item.ammo-satchel',1,100]
];
for(const [family,f] of Object.entries(families))for(const [socket,label,source,cost,attack] of modSockets){
  if(!f.mods.includes(socket))continue;
  const set=family==='laser'?'RO09':family==='flame'?'IS08':family==='pulse'||family==='smart'?'CW02':'MC12';
  create('HUMAN','MODIFICATION',label+' — '+family.toUpperCase(),{
    source,set,cost,slot:'MOD',modSocket:socket,compatibleFamilies:[family],
    attack,health:socket==='CROSSE'?100:0,weaponFamily:family,
    effect:socket==='VISEUR'?{seeCloak:true}:{},
    text:'Module '+socket+' compatible '+family.toUpperCase()+
      ' : +'+attack+' ATK (lorsque l’arme possède les munitions requises). Une occurrence par emplacement ; maximum trois modules.'});
}
for(const [family,f] of Object.entries(families))for(let i=0;i<2;i++){
 const technique=i===0?'Tir contrôlé':'Tir de suppression';
 const damage=i===0?450:650;
 create('HUMAN','ATTAQUE',technique+' — '+family.toUpperCase(),{
   source:f.source,set:family==='laser'?'RO09':family==='flame'?'IS08':'CW02',cost:1+i,
   effect:{kind:'WEAPON_TECHNIQUE',target:'ENEMY_UNIT',ammoType:f.ammunition,ammoCost:1+i,damage},
   text:'Attaque spéciale : nécessite une arme '+family.toUpperCase()+' et '+(1+i)+' charge(s) de '+f.display+
    '. Dépense les charges et inflige '+damage+' dégâts à une unité ennemie.'});
}
const humanSupport=[
 ['Kit de rechargement tactique','item.ammo-satchel',{kind:'SUPPLY_SEARCH',maxCost:4},'Cherchez une carte d’équipement/munition dans le deck.'],
 ['Intégration d’équipement','item.synthetic-repair-kit',{kind:'DRAW',count:2},'Piochez deux cartes.'],
 ['Renforcement du périmètre','item.portable-sentry',{kind:'FORTIFY',amount:500},'Ajoute 500 points de bouclier.'],
 ['Révision de terrain','item.welding-kit',{kind:'REPAIR_UNIT',target:'FRIENDLY_UNIT',amount:600},'Répare 600 PV d’une unité.'],
 ['Brouillage optique','item.signal-jammer',{kind:'SCAN_REVEAL',draw:1},'Révèle les unités camouflées et pioche 1.'],
 ['Transfert de position','item.motion-tracker',{kind:'REPOSITION',target:'FRIENDLY_UNIT'},'Déplace un Personnage dans une voie libre.'],
 ['Protocole de ravitaillement','faction.uscm',{kind:'DRAW',count:2},'Piochez 2 cartes.'],
 ['Écran défensif avancé','item.m3-personnel-armor',{kind:'FORTIFY',amount:700},'Ajoute 700 boucliers jusqu’au maximum.']
];
for(const [name,source,effect,text] of humanSupport)create('HUMAN','ACTION',name,{source,set:'MC12',cost:2,effect,text});

// CYCLE HIVE — œufs -> facehugger -> fusion hôte -> chestburster -> mues.
const eggNames=['Ovomorphe dormant','Ovomorphe d’incubation','Œuf de colonie','Œuf d’urgence','Œuf de la galerie royale',
 'Œuf des tunnels','Ovomorphe du transport','Ovomorphe du nid profond'];
const eggs=eggNames.map((name,i)=>create('XENO','OEUF',name,{
 source:'bio.xenomorph.ovomorph',set:i%3===0?'NX01':'CW02',cost:i%3,attack:0,health:760+i%3*150,keywords:['GUARD'],effect:{onPlay:{kind:'DRAW',count:1}},
 evolutionStage:'EGG',eggLine:i===4?'ROYAL':'COMMON',tags:['egg','hive','incubation'],
 text:'Œuf inerte. Ne peut pas attaquer. Sacrifiez-le pour faire éclore un Facehugger compatible. Génère de la biomasse lors de l’éclosion.'}));
const facehuggers=[];
for(let i=0;i<8;i++){
 facehuggers.push(create('XENO','CREATURE',['Facehugger éclaireur','Facehugger des parois','Facehugger royal','Facehugger de colonie',
  'Facehugger de tunnel','Facehugger nocturne','Facehugger transporté','Facehugger de la mère'][i],
 {source:i===2?'ha.bio.royal-facehugger':'bio.xenomorph.facehugger',set:i%2===0?'NX01':'CW02',cost:1,
  attack:245+i*38,health:650+i*55,requiresEgg:true,evolutionStage:'FACEHUGGER',
  eggLine:i===2?'ROYAL':'COMMON',keywords:i%3===0?['AMBUSH','RUSH']:i%2===0?['RUSH']:[],
  text:'Éclosion : remplace un Œuf allié par ce Facehugger. L’œuf est sacrifié, et votre Ruche gagne 1 biomasse.'}));
}
const hostDef=[
 ['Colon capturé','HUMAN','bio.human.colonial-raider','CW02'],
 ['Mécanicien capturé','HUMAN','character.reference.russell-russ-jorden','CW02'],
 ['Scientifique capturé','HUMAN','character.tantalus.inez-harlow','TF28'],
 ['Rongeur contaminé','QUAD','bio.fauna.tantalus-tunnel-vermin','TF28'],
 ['Animal hôte','QUAD','bio.fauna.wild-boar-host','CW02'],
 ['Prédateur quadrupède capturé','QUAD','bio.fauna.korari-stalker','TF28'],
 ['Yautja capturé','YAUTJA','character.yautja.scar_avp_2004','AV04'],
 ['Jeune Chasseur capturé','YAUTJA','character.yautja.feral_predator','AV04'],
 ['Ancien Chasseur capturé','YAUTJA','character.yautja.elder_lost_tribe_1990','AV04']
];
const hosts=hostDef.map(([name,hostType,source,set],i)=>create('XENO','HOTE','Hôte — '+name,{
 source,set,cost:1+i%3,health:790+(i%3)*170,attack:0,keywords:['GUARD'],effect:{onPlay:{kind:'DRAW',count:1}},hostType,evolutionStage:'HOST',tags:['host','biological'],
 text:'Hôte biologique immobilisé : ne peut pas attaquer. À combiner avec un Facehugger pour la fusion parasitaire.'}));
const chestByHost={HUMAN:[],QUAD:[],YAUTJA:[]};
for(const [type,names] of Object.entries({
 HUMAN:['Chestburster colonial','Chestburster de technicien','Chestburster de laboratoire'],
 QUAD:['Chestburster quadrupède','Chestburster du coureur','Chestburster de chasse'],
 YAUTJA:['Chestburster Yautja','Larve hybride de chasse','Chestburster de guerrier']
})){
 for(let i=0;i<names.length;i++){
  chestByHost[type].push(create('XENO','CREATURE',names[i],{source:type==='YAUTJA'?'bio.xenomorph.predalien':'bio.xenomorph.chestburster',
   set:type==='YAUTJA'?'AV04':'CW02',cost:2,attack:900+i*85,health:1470+i*150,keywords:['RUSH','ACID'],
   hostType:type,summonByFusion:true,evolutionStage:'CHESTBURSTER',tags:['hive','larva','fusion'],
   text:'Résultat de fusion : Facehugger + hôte '+type+'. Ne peut pas être joué directement ; invoqué depuis le deck ou la main par Fusion parasitaire.'}));
 }
}
const adultByType={};
for(const [t,name,source,set] of [
 ['HUMAN','Drone de colonie','bio.xenomorph.drone','CW02'],
 ['QUAD','Runner de la couvée','bio.xenomorph.runner','F306'],
 ['YAUTJA','Predalien en croissance','bio.xenomorph.predalien','AV04']
]){
 adultByType[t]=create('XENO','CREATURE',name,{source,set,cost:3,attack:t==='YAUTJA'?1550:1200,
  health:t==='YAUTJA'?2250:1900,evolutionStage:'DRONE',hostType:t,summonByFusion:true,keywords:['ACID','HIVE','REGEN'],
  text:'Résultat d’évolution : Chestburster '+t+' + mue accélérée. Coût en biomasse et extraction depuis le deck ou la main.'});
}
const praetorian=create('XENO','CREATURE','Prétorien de la gelée royale',{
 source:'bio.xenomorph.praetorian',set:'CW02',cost:5,attack:1750,health:2750,evolutionStage:'PRAETORIAN',
 summonByFusion:true,keywords:['ACID','HIVE','GUARD'],text:'Évolution royale d’un Drone ; nécessite la Gelée royale et des points de biomasse.'});
const queen=create('XENO','CREATURE','Reine de la lignée incubée',{
 source:'bio.xenomorph.queen',set:'CW02',cost:8,attack:2350,health:3500,evolutionStage:'QUEEN',
 summonByFusion:true,keywords:['ACID','HIVE','UNIQUE'],text:'Évolution suprême à partir du Prétorien ; résultat de la Couronne de résine.'});
for(const type of Object.keys(chestByHost))for(let i=0;i<3;i++){
 create('XENO','EVOLUTION','Fusion parasitaire — '+type+' '+(i+1),{
  source:'bio.xenomorph.facehugger',set:type==='YAUTJA'?'AV04':'CW02',cost:1,rarity:i===2?'SR':undefined,
  effect:{kind:'HIVE_FUSION',target:'FRIENDLY_UNIT',hostType:type,resultCardId:chestByHost[type][i].id,biomassGain:2},
  text:'Fusion : sacrifiez un Facehugger et un Hôte de type '+type+' ; extrayez '+chestByHost[type][i].name+
    ' de la main ou du deck et invoquez-le sur la voie du Facehugger. Génère 2 biomasses.'});
}
for(const [type,adult] of Object.entries(adultByType))for(let i=0;i<2;i++){
 create('XENO','EVOLUTION','Mue accélérée — '+type+' '+(i+1),{
  source:'bio.xenomorph.chestburster',set:type==='YAUTJA'?'AV04':'CW02',cost:1,rarity:i===1?'SR':'R',
  effect:{kind:'HIVE_EVOLVE',target:'FRIENDLY_UNIT',fromStage:'CHESTBURSTER',hostType:type,
   resultCardId:adult.id,biomassCost:1},text:'Évolution : remplace un Chestburster '+type+' par '+adult.name+
  ', extrait depuis le deck ou la main. Nécessite 1 biomasse.'});
}
create('XENO','EVOLUTION','Gelée royale concentrée',{
 source:'bio.xenomorph.praetorian',set:'CW02',cost:2,rarity:'UR',
 effect:{kind:'HIVE_EVOLVE',target:'FRIENDLY_UNIT',fromStage:'DRONE',resultCardId:praetorian.id,biomassCost:2},
 text:'Gelée royale : sacrifiez un Drone, dépensez 2 biomasses et faites évoluer un Prétorien présent dans votre deck ou main.'});
create('XENO','EVOLUTION','Couronne de résine royale',{
 source:'bio.xenomorph.queen',set:'CW02',cost:3,rarity:'UR',
 effect:{kind:'HIVE_EVOLVE',target:'FRIENDLY_UNIT',fromStage:'PRAETORIAN',resultCardId:queen.id,biomassCost:3},
 text:'Évolution suprême : sacrifiez un Prétorien, dépensez 3 biomasses, invoquez la Reine depuis la main ou le deck.'});
for(let i=0;i<10;i++)create('XENO','BIOMASSE',[
 'Résine de maturation','Nutriments de la ruche','Sang acide recyclé','Accumulation de biomasse',
 'Cycle organique','Nid nourricier','Réserve de gelée','Matrice larvaire','Éclosion cyclique','Convergence biologique'
][i],{source:i%3===0?'bio.xenomorph.ovomorph':'bio.xenomorph.drone',set:'CW02',
 cost:i%3===0?0:1,effect:{kind:'HIVE_BIOMASS',amount:1+i%3},
 text:'Ruche : ajoute '+(1+i%3)+' point(s) de biomasse (maximum 12). Cette ressource alimente les fusions et évolutions.'});

// YAUTJA : trophées matériels, plasma consommable et honneur de combat.
const hunterNames=[
 ['Guerrier Blooded','character.yautja.jungle_hunter','HG03'],
 ['Gardien de rituel','character.yautja.scar_avp_2004','AV04'],
 ['Traqueur nocturne','character.yautja.city_hunter','P213'],
 ['Éclaireur thermique','character.yautja.feral_predator','PY15'],
 ['Duelliste de clan','character.yautja.wolf_predator','AV04'],
 ['Artilleur plasma','character.yautja.alpha_predator','PH24'],
 ['Gardien du Conseil','character.yautja.elder_lost_tribe_1990','YA27'],
 ['Chasseur des trophées','character.yautja.berserker_2010','PR14'],
 ['Héritier de la chasse','character.yautja.kwei_badlands_2025','BD17'],
 ['Garde du mausolée','character.yautja.viking_predator','YA27']
];
for(let i=0;i<hunterNames.length;i++){const [name,source,set]=hunterNames[i],cost=1+i%4;
 create('YAUTJA','PERSONNAGE',name,{source,set,cost,attack:200+cost*190,health:550+cost*260,
 keywords:i%2===0?['HUNTER','TROPHY']:['CLOAK'],tags:['hunter','crew'],
 effect:{onPlay:i%3===0?{kind:'CHARGE_PLASMA',amount:1}:{kind:'GAIN_HONOR',amount:1}},
 text:'À l’arrivée, gagne '+(i%3===0?'1 charge de plasma':'1 point d’honneur')+'. Éliminer un adversaire au corps à corps rapporte de l’honneur.'});
}
const plasmaWeapons=[
 ['Plasmacaster de campagne','item.yautja.plasma_caster',1,440,'HG03'],
 ['Plasmacaster de siège','item.yautja.gatling_plasma',2,720,'YA27'],
 ['Canon plasma jumelé','item.yautja.dual_caster',2,650,'AV04'],
 ['Pistolet de plasma','item.yautja.plasma_pistol',1,340,'HG03'],
 ['Tourelle plasma portative','item.yautja.plasma_turret',2,600,'PH24'],
 ['Burner rifle','item.yautja.burner_rifle',1,495,'HG03'],
 ['Lanceur de plasma rapide','item.yautja.plasma_caster',1,370,'YA27'],
 ['Canon de cérémonie','item.yautja.plasma_caster',2,780,'YA27'],
 ['Module de visée guidée','item.yautja.tri_laser_targeting',1,410,'HG03'],
 ['Frappe de canon lourd','item.yautja.gatling_plasma',3,880,'PH24'],
 ['Émetteur de tournoi','item.yautja.plasma_turret',1,440,'PH24'],
 ['Plasma de l’Ancien','item.yautja.plasma_caster',2,700,'YA27']
];
for(let i=0;i<plasmaWeapons.length;i++){const [name,source,plasmaPerAttack,attack,set]=plasmaWeapons[i];
 create('YAUTJA','ARME',name,{source,set,cost:1+plasmaPerAttack,attack,slot:'WEAPON',plasmaPerAttack,
 tags:['plasma','ranged','hunter-tech'],
 text:'Arme Yautja : +'+attack+' ATK uniquement si la réserve contient '+plasmaPerAttack+
 ' plasma ; consomme cette quantité à chaque attaque. Sans plasma, le porteur reste capable d’attaquer au corps à corps.'});
}
for(let i=0;i<10;i++)create('YAUTJA','RESERVE_PLASMA',[
 'Cellule plasma de poignet','Cartouche énergétique de clan','Recharge du plasma central',
 'Réserve de chasseur','Condensateur de ciblage','Réservoir secondaire','Accumulation de charge',
 'Recharge sacrée','Alimentation du canon','Réserve de l’Ancien'
][i],{source:i%2?'item.yautja.wrist_computer':'item.yautja.plasma_caster',
 set:i%3===0?'YA27':'HG03',cost:1+i%3,
 effect:{kind:'CHARGE_PLASMA',amount:2+i%3},
 text:'Alimente la réserve collective Yautja de '+(2+i%3)+' plasma (plafond : 12). Nécessaire pour tirer les armes plasma.'});
for(let i=0;i<12;i++)create('YAUTJA','TROPHEE',[
 'Crâne de victoire','Marque du Blooding','Trophée de traque','Trophée de l’arène',
 'Relique du duel','Insigne de chasseur','Panache de guerre','Trophée de rival',
 'Prix du clan','Ornement rituel','Marque de la meute','Trophée de l’Ancien'
][i],{source:i%2?'character.yautja.wolf_predator':'character.yautja.jungle_hunter',
 set:i%4===0?'YA27':'HG03',cost:1+(i%3===0?1:0),effect:{kind:'YAUTJA_TROPHY',minTrophies:1,amount:1+i%3},
 text:'Trophée : requiert au moins 1 trophée acquis par un chasseur. Transforme la réussite de la chasse en '+(1+i%3)+' honneur(s).'});
for(let i=0;i<10;i++)create('YAUTJA','HONNEUR',[
 'Code de chasse du clan','Duel rituel','Serment du Blooded','Jugement des anciens',
 'Récompense honorable','Observation du rival','Aube de la chasse','Clémence rituelle',
 'Challenge de l’arène','Héritage de chasse'
][i],{source:i%2?'character.yautja.scar_avp_2004':'character.yautja.elder_lost_tribe_1990',
 set:i%2?'AV04':'YA27',cost:1+i%3,rarity:i%4===0?'SR':undefined,
 effect:i%3===0?{kind:'HONOR_BUFF',target:'FRIENDLY_UNIT',honorCost:1+i%2,attack:350+i*20,health:100}:
   i%3===1?{kind:'HONOR_DRAW',honorCost:2,count:2}:
   {kind:'HONOR_REVEAL',honorCost:1,amount:250},
 text:'Rituel d’honneur : dépense '+(i%3===1?2:1+i%2)+' honneur(s) pour '+(i%3===0?'fortifier un chasseur.':i%3===1?'piocher deux cartes.':'révéler le camouflage et gagner un bouclier.')});
for(let i=0;i<8;i++)create('YAUTJA','EQUIPEMENT',[
 'Bio-masque multi-spectre','Capteur de trophées','Blindage du Blooded','Lame d’honneur',
 'Module de traque','Récupérateur thermique','Bague des anciens','Écran énergétique'
][i],{source:i%2?'item.yautja.thermal_mask':'item.yautja.medicomp',
 set:i%2?'HG03':'YA27',cost:1+i%3,health:100+i*45,attack:i%3===0?140:0,
 effect:i%2===0?{seeCloak:true}:{onEquip:{kind:'GAIN_HONOR',amount:1}},
 text:'Équipement de chasse : protection et détection, parfois générateur d’honneur lors de l’installation.'});
for(let i=0;i<8;i++)create('YAUTJA','ACTION',[
 'Défi du chasseur','Déploiement du clan','Frappes séquentielles','Surveillance de trophées',
 'Patrouille du sanctuaire','Repli honorifique','Repérage thermique','Déclaration de chasse'
][i],{source:i%2?'item.yautja.wrist_computer':'character.yautja.jungle_hunter',
 set:i%2?'HG03':'YA27',cost:1+i%2,
 effect:i%4===0?{kind:'GAIN_HONOR',amount:1}:
   i%4===1?{kind:'CHARGE_PLASMA',amount:2}:
   i%4===2?{kind:'SCAN_REVEAL',draw:1}:{kind:'FORTIFY',amount:400},
 text:i%4===0?'Code du chasseur : ajoute 1 honneur.':i%4===1?'Logistique du clan : ajoute 2 plasma.':
 i%4===2?'Vision thermique : révèle le camouflage et pioche 1.':'Bouclier rituel : absorbe jusqu’à 400 dégâts.'});

D.asymmetricEdition={
 schema:'avp-asymmetric-rules-v1',source:'alien_base@e65b75a6bfd1284dbac746102fdbae4fc5a3786b',
 startCount:656,addedCount:created.length,totalCards:D.cards.length,counts,classes:byClass,
 weaponsNeedingAmmo:created.filter(c=>c.faction==='HUMAN'&&c.cardClass==='ARME').length,
 ammoCards:created.filter(c=>c.cardClass==='MUNITION').length,
 evolutionCards:created.filter(c=>c.cardClass==='EVOLUTION').length,
 plasmaCards:created.filter(c=>c.cardClass==='RESERVE_PLASMA').length,
 artStatus:'NOT_GENERATED',legacyCardIDsPreserved:true,notes:'Mechanics are original, not canon facts.'
};
D.asymmetricStage={chestByHost:Object.fromEntries(Object.entries(chestByHost).map(([k,v])=>[k,v.map(c=>c.id)])),
 adults:Object.fromEntries(Object.entries(adultByType).map(([k,v])=>[k,v.id])),
 praetorian:praetorian.id,queen:queen.id};
D.version='1.3.0-asymmetric';
})();