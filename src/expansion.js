/* Extension jouable progressive — références documentaires Alien_base (snapshot
 * e65b75a6bfd1284dbac746102fdbae4fc5a3786b). Rien n'est supprimé.
 * Le gameplay et les intitulés d'action sont des créations TCG, sans validation canon 1:1.
 * Chargé après src/data.js et AVANT le moteur ; ne requiert pas le dépôt privé.
 */
(function () {
  'use strict';
  const D=window.AVP_DATA;
  if(!D||!Array.isArray(D.cards))throw new Error('Le catalogue historique doit être chargé.');
  const snapshot='e65b75a6bfd1284dbac746102fdbae4fc5a3786b';
  const records=[["character.reference.ellen-ripley","Ellen Ripley","HUMAN","PERSONNAGE","NX01","character","documentary-visual-intent-not-likeness-verified",0],["character.reference.chris-hooper","Chris Hooper","HUMAN","PERSONNAGE","CW02","character","documentary-visual-intent-not-likeness-verified",0],["character.reference.alan-decker","Alan Decker","HUMAN","PERSONNAGE","CW02","character","documentary-visual-intent-not-likeness-verified",0],["character.reference.lorraine-hawkes","Lorraine Hawkes","HUMAN","PERSONNAGE","CW02","character","documentary-visual-intent-not-likeness-verified",0],["character.tantalus.asha-mbaye","Asha Mbaye","HUMAN","PERSONNAGE","TF28","character","tantalus-original-character",1],["character.tantalus.mara-vega","Mara Vega","HUMAN","PERSONNAGE","TF28","character","tantalus-original-character",1],["character.tantalus.inez-harlow","Inez Harlow","HUMAN","PERSONNAGE","TF28","character","tantalus-original-character",1],["character.tantalus.noor-okafor","Noor Okafor","HUMAN","PERSONNAGE","TF28","character","tantalus-original-character",1],["character.tantalus.cal-mercer","Cal Mercer","HUMAN","PERSONNAGE","TF28","character","tantalus-original-character",1],["character.tantalus.bishop-9","BISHOP-9","HUMAN","PERSONNAGE","TF28","character","tantalus-original-character",1],["item.m41a2-pulse-rifle","M41A2 Pulse Rifle","HUMAN","ARME","CW02","equipment","project-source",1],["item.m42a-scope-rifle","M42A Scope Rifle","HUMAN","ARME","CW02","equipment","project-source",1],["item.m240-incinerator-unit","M240 Incinerator Unit","HUMAN","ARME","CW02","equipment","project-source",1],["item.m56-smartgun","M56 Smartgun","HUMAN","ARME","CW02","equipment","project-source",1],["item.m37a2-pump-shotgun","M37A2 Pump Shotgun","HUMAN","ARME","CW02","equipment","project-source",1],["item.m40-hedp-grenade","M40 HEDP Grenade","HUMAN","ARME","CW02","equipment","project-source",1],["item.ua-571-c-sentry-gun","UA 571-C Sentry Gun","HUMAN","ARME","CW02","equipment","project-source",1],["item.heavy-pulse-rifle","Heavy Pulse Rifle","HUMAN","ARME","CW02","equipment","project-source",1],["item.harpoon-gun","Harpoon Gun","HUMAN","ARME","NX01","equipment","project-source",1],["item.357-magnum-revolver",".357 Magnum Revolver","HUMAN","ARME","CW02","equipment","project-source",1],["item.bolt-gun","Bolt Gun","HUMAN","ARME","CW02","equipment","project-source",1],["item.m3-personnel-armor","M3 Personnel Armor","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.motion-tracker","Motion Tracker","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.hazmat-suit","Hazmat Suit","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.portable-sentry","Portable Sentry","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.medkit","Medkit","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.ape-suit","APE Suit","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.drone-controller","Drone Controller","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.synthetic-repair-kit","Synthetic Repair Kit","HUMAN","EQUIPEMENT","CW02","equipment","project-source",1],["item.atarax-control-rig","ATARAX Control Rig","HUMAN","EQUIPEMENT","TF28","equipment","project-source",1],["vehicle.m577-armored-personnel-carrier","M577 Armored Personnel Carrier","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.ud-4l-cheyenne-dropship","UD-4L Cheyenne Dropship","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.p-5000-powered-work-loader","P-5000 Powered Work Loader","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.m22a3-jackson-tank","M22A3 Jackson Tank","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.m570-series-apc","M570 Series APC","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.weyland-yutani-executive-shuttle","Weyland-Yutani Executive Shuttle","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.uscm-assault-gunship","USCM Assault Gunship","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.m40-ridgeway-heavy-tank","M40 Ridgeway Heavy Tank","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["vehicle.echo-9-recon-bike","Echo-9 Recon Bike","HUMAN","VEHICULE","TF28","vehicle","project-source",1],["vehicle.upp-combat-aerodyne","UPP Combat Aerodyne","HUMAN","VEHICULE","CW02","vehicle","project-source",1],["faction.uscm","United States Colonial Marine Corps","HUMAN","ACTION","CW02","faction","project-source",1],["faction.weyland-yutani","Weyland-Yutani","HUMAN","ACTION","CW02","faction","project-source",1],["faction.seegson","Seegson","HUMAN","ACTION","CW02","faction","project-source",1],["faction.upp","Union of Progressive Peoples","HUMAN","ACTION","CW02","faction","project-source",1],["faction.hyperdyne","Hyperdyne Systems","HUMAN","ACTION","CW02","faction","project-source",1],["faction.echo-9","Echo-9","HUMAN","ACTION","TF28","faction","project-source",1],["place.gateway-station","Gateway Station","HUMAN","LIEU","CW02","place","project-source",1],["place.sevastopol","Sevastopol","HUMAN","LIEU","NX01","place","project-source",1],["place.acheron-lv-426","Acheron / LV-426","HUMAN","LIEU","CW02","place","project-source",1],["place.pioneer-station","Pioneer Station","HUMAN","LIEU","CW02","place","project-source",1],["place.katanga","Katanga","HUMAN","LIEU","CW02","place","project-source",1],["character.yautja.alpha_predator","ALPHA PREDATOR (HUNTING GROUNDS)","YAUTJA","PERSONNAGE","HG03","character","game-character-adaptation",0],["character.yautja.city_hunter","CITY HUNTER (1990)","YAUTJA","PERSONNAGE","HG03","character","game-character-adaptation",0],["character.yautja.feral_predator","FERAL PREDATOR (PREY 2022)","YAUTJA","PERSONNAGE","HG03","character","game-character-adaptation",0],["character.yautja.jungle_hunter","JUNGLE HUNTER (1987)","YAUTJA","PERSONNAGE","HG03","character","game-character-adaptation",0],["character.yautja.wolf_predator","WOLF PREDATOR (AVP REQUIEM)","YAUTJA","PERSONNAGE","AV04","character","game-character-adaptation",0],["character.yautja.elder_lost_tribe_1990","Ancien du Lost Tribe","YAUTJA","PERSONNAGE","HG03","character","apex-declared-media-reference-review-required",0],["character.yautja.scar_avp_2004","Scar Predator","YAUTJA","PERSONNAGE","AV04","character","apex-declared-media-reference-review-required",0],["character.yautja.dek_badlands_2025","Dek","YAUTJA","PERSONNAGE","HG03","character","apex-declared-media-reference-review-required",0],["item.yautja.plasma_caster","Shoulder Plasma Caster (Single)","YAUTJA","ARME","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.combistick","Combi-Stick","YAUTJA","ARME","HG03","equipment","project-source",1],["item.yautja.netgun","Razor-Wire Netgun","YAUTJA","ARME","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.smart_disc","Smart Disc","YAUTJA","ARME","HG03","equipment","project-source",1],["item.yautja.wristblades","Wrist Blades","YAUTJA","ARME","HG03","equipment","project-source",1],["item.yautja.feral_bolt_launcher_2022","Lance-traits du Feral","YAUTJA","ARME","HG03","equipment","apex-declared-media-reference-review-required",0],["item.yautja.burner_rifle","Burner Plasma Rifle","YAUTJA","ARME","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.crossbow","Homing Bolt Crossbow","YAUTJA","ARME","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.thermal_mask","Thermal Multi-Vision Bio-Mask","YAUTJA","EQUIPEMENT","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.cloak","Active Camouflage Cloaking Device","YAUTJA","EQUIPEMENT","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.medicomp","Medicomp Bio-Gel Injection Kit","YAUTJA","EQUIPEMENT","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.wrist_computer","Ordinateur de poignet","YAUTJA","EQUIPEMENT","HG03","equipment","apex-declared-media-reference-review-required",0],["vehicle.yautja.jungle_dropcraft_1987","Appareil d’insertion de la jungle","YAUTJA","VEHICULE","HG03","vehicle","apex-declared-media-reference-review-required",0],["vehicle.yautja.city_clan_vessel_1990","Vaisseau du clan de Los Angeles","YAUTJA","VEHICULE","HG03","vehicle","apex-declared-media-reference-review-required",0],["item.yautja.audio_lure","Audio Lure & Voice Mimicry Module","YAUTJA","ACTION","HG03","equipment","game-source-origin-label-unverified",0],["item.yautja.self_destruct","Autodestruction du brassard","YAUTJA","ACTION","HG03","equipment","apex-declared-media-reference-review-required",0],["item.yautja.tri_laser_targeting","Viseur à trois points","YAUTJA","ACTION","HG03","equipment","apex-declared-media-reference-review-required",0],["item.yautja.plasma_mines","Proximity Plasma Trip-Mines","YAUTJA","ACTION","HG03","equipment","game-source-origin-label-unverified",0],["place.ryushi","Ryushi","YAUTJA","LIEU","AV04","place","project-source",1],["place.bg-386","BG-386","YAUTJA","LIEU","HG03","place","project-source",1],["bio.xenomorph.drone","Drone","XENO","CREATURE","CW02","organism","project-source",0],["bio.xenomorph.warrior","Warrior","XENO","CREATURE","CW02","organism","project-source",0],["bio.xenomorph.boiler","Boiler","XENO","CREATURE","CW02","organism","project-source",1],["bio.xenomorph.crusher","Crusher","XENO","CREATURE","CW02","organism","project-source",0],["bio.xenomorph.ravager","Ravager","XENO","CREATURE","CW02","organism","project-source",1],["bio.xenomorph.red-xenomorph","Red Xenomorph","XENO","CREATURE","CW02","organism","project-source",1],["bio.xenomorph.monica-line","Monica Line","XENO","CREATURE","CW02","organism","project-source",1],["bio.xenomorph.xenoborg","Xenoborg","XENO","CREATURE","CW02","organism","project-source",1],["bio.xenomorph.reef-stalker","Reef Stalker","XENO","CREATURE","TF28","organism","project-source",1],["bio.xenomorph.carrier","Carrier","XENO","CREATURE","CW02","organism","project-source",1],["bio.xenomorph.warden","Warden","XENO","CREATURE","CW02","organism","game-roster-reference",1],["ha.bio.palatine","Palatine (Garde Royal Suprême)","XENO","CREATURE","HA29","organism","hive-ascension-specific-variant",1],["ha.bio.prowler","Prowler","XENO","CREATURE","HA29","organism","hive-ascension-specific-variant",1],["bio.xenomorph.spitter","Spitter","XENO","ARME","CW02","organism","project-source",0],["bio.xenomorph.facehugger","Facehugger","XENO","ARME","CW02","organism","project-source",0],["bio.xenomorph.predalien","Predalien","XENO","ARME","AV04","organism","source-labelled-variant",1],["bio.xenomorph.ovomorph","Ovomorphe","XENO","EQUIPEMENT","CW02","organism","project-source",0],["bio.xenomorph.praetorian","Prétorien","XENO","EQUIPEMENT","CW02","organism","project-source",0],["bio.xenomorph.queen","Reine Xénomorphe","XENO","EQUIPEMENT","CW02","organism","project-source",0],["bio.xenomorph.chestburster","Chestburster","XENO","ACTION","CW02","organism","project-source",0],["bio.xenomorph.prowler","Prowler","XENO","ACTION","CW02","organism","project-source",1],["bio.xenomorph.praetorian","Prétorien","XENO","ACTION","CW02","organism","project-source",0],["bio.xenomorph.queen","Reine Xénomorphe","XENO","ACTION","CW02","organism","project-source",0],["ha.bio.royal-facehugger","Superfacehugger Royal","XENO","ACTION","HA29","organism","hive-ascension-specific-variant",1],["place.lv-1201","LV-1201","XENO","LIEU","CW02","place","project-source",1],["place.lethe","Lethe","XENO","LIEU","CW02","place","project-source",1],["ha.place.mnemosyne","Station MNEMOSYNE","XENO","LIEU","HA29","place","hive-ascension-original-location",1],["bio.pathogen.neomorph","Neomorph","ENGINEER","CREATURE","EV05","organism","project-source",1],["bio.pathogen.protomorph","Protomorph","ENGINEER","CREATURE","EV05","organism","project-source",1],["bio.pathogen.abomination","Abomination","ENGINEER","CREATURE","EV05","organism","project-source",1],["bio.pathogen.deacon-line","Deacon Line","ENGINEER","CREATURE","EV05","organism","project-source",1],["bio.pathogen.harbinger","Harbinger","ENGINEER","CREATURE","EV05","organism","game-roster-reference",1],["bio.pathogen.pathogen-runner","Pathogen Runner","ENGINEER","CREATURE","EV05","organism","game-roster-reference",1],["bio.pathogen.pathogen-brute","Pathogen Brute","ENGINEER","ARME","EV05","organism","game-roster-reference",1],["bio.pathogen.pathogen-blight","Pathogen Blight","ENGINEER","ARME","EV05","organism","game-roster-reference",1],["item.pathogen-scanner","Pathogen Scanner","ENGINEER","EQUIPEMENT","EV05","equipment","project-source",1],["item.pathogen-containment-projector","Pathogen Containment Projector","ENGINEER","EQUIPEMENT","EV05","equipment","project-source",1],["bio.pathogen.pathogen-popper","Pathogen Popper","ENGINEER","ACTION","EV05","organism","game-roster-reference",1],["bio.pathogen.trilobite-echo","Trilobite Echo","ENGINEER","ACTION","EV05","organism","project-source",1],["place.lv-223","LV-223","ENGINEER","ACTION","EV05","place","project-source",1],["place.lv-223","LV-223","ENGINEER","LIEU","EV05","place","project-source",1],["place.purdan","Purdan","ENGINEER","LIEU","EV05","place","project-source",1],["bio.hybrid.newborn","Newborn","HYBRID","CREATURE","AV04","organism","source-labelled-variant",1],["bio.xenomorph.predalien","Predalien","HYBRID","CREATURE","AV04","organism","source-labelled-variant",1],["bio.pathogen.offspring","Offspring","HYBRID","CREATURE","EV05","organism","source-labelled-variant",1],["bio.pathogen.engineer-hybrid","Engineer hybrid","HYBRID","CREATURE","EV05","organism","game-roster-reference",1],["bio.xenomorph.siege-royal","Siege Royal","HYBRID","CREATURE","AV04","organism","project-source",1],["ha.bio.offspring","Offspring (Hybride Z-01)","HYBRID","CREATURE","HA29","organism","hive-ascension-specific-variant",1],["item.ripper-acid-projector","Ripper Acid Projector","HYBRID","ARME","TF28","equipment","project-source",1],["item.sonic-harpoon","Sonic Harpoon","HYBRID","ARME","NX01","equipment","project-source",1],["item.ripper-xenoarmor","Ripper Xenoarmor","HYBRID","EQUIPEMENT","TF28","equipment","project-source",1],["item.neuro-link-helmet","Neuro-Link Helmet","HYBRID","EQUIPEMENT","AV04","equipment","project-source",1],["faction.k-series","K-Series Brood","HYBRID","ACTION","TF28","faction","project-source",1],["faction.red-hive","Red Hive","HYBRID","ACTION","AV04","faction","project-source",1],["bio.xenomorph.k-series-yellow-xenomorph","K-Series Yellow Xenomorph","HYBRID","ACTION","TF28","organism","project-source",1],["place.nacre-7","Nacre-7","HYBRID","LIEU","TF28","place","project-source",1],["place.mire-9","MIRE-9","HYBRID","LIEU","TF28","place","project-source",1],["ha.opposition.maintenance-technician","Technicien de maintenance","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.xenobiologist","Xénobiologiste IRISE","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.security-agent","Agent de sûreté","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.orbital-rifleman","Fusilier orbital","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.thermal-operator","Opérateur thermique","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.gyro-gunner","Artilleur gyrostabilisé","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.capture-commando","Commando de récupération","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.opposition.argos-synthetic","Synthétique ARGOS","HUMAN","PERSONNAGE","HA29","opposition","hive-ascension-enemy-archetype",1],["ha.equipment.fusil-automatique-k-12","Fusil automatique K-12","HUMAN","ARME","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.carabine-cinetique-r-9","Carabine cinétique R-9","HUMAN","ARME","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.canon-gyrostabilise-vigie","Canon gyrostabilisé VIGIE","HUMAN","ARME","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.lance-thermique-t-4","Lance thermique T-4","HUMAN","ARME","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.scanner-biologique","Scanner biologique","HUMAN","EQUIPEMENT","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.visiere-de-suivi","Visière de suivi","HUMAN","EQUIPEMENT","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.filet-electrostatique","Filet électrostatique","HUMAN","EQUIPEMENT","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.equipment.masque-etanche","Masque étanche","HUMAN","EQUIPEMENT","HA29","equipment","hive-ascension-equipment-or-prop",1],["ha.vessel.echo-12","ÉCHO-12","HUMAN","VEHICULE","HA29","vessel","hive-ascension-original-tug-vessel",1],["ha.bio.praetorian","Praetorian","XENO","CREATURE","HA29","organism","hive-ascension-specific-variant",1],["ha.bio.crusher","Crusher","XENO","CREATURE","HA29","organism","hive-ascension-specific-variant",1],["ha.bio.runner","Runner","XENO","CREATURE","HA29","organism","hive-ascension-specific-variant",1]];
  const CLASS_NAMES={PERSONNAGE:'Personnage',CREATURE:'Créature',ARME:'Arme',EQUIPEMENT:'Équipement',VEHICULE:'Véhicule',ACTION:'Action',LIEU:'Lieu'};
  D.cardClasses=CLASS_NAMES;
  const oldIds=new Set(D.cards.map(c=>c.id));
  const hash=s=>{let n=2166136261>>>0;for(const ch of s){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
  const rng=seed=>{let n=seed>>>0||1;return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};};
  const shuffle=(items,random)=>{const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const legacyClass=c=>{
    if(c.type==='LOCATION')return 'LIEU';
    if(c.type==='TACTIC')return 'ACTION';
    if(c.type==='UNIT')return c.faction==='XENO'||c.faction==='ENGINEER'||(c.faction==='HYBRID'&&!c.id.startsWith('H_ALEXA'))||/H_(?:ALIEN_KING|PREDALIEN|NEWBORN|WHITE_HYBRID)/.test(c.id)?'CREATURE':'PERSONNAGE';
    if(c.type==='EQUIPMENT')return /(?:PULSE|SMART|PLASMA|FLAMER|DISC|WHIP|COMBISTICK|NET_GUN|WRISTBLADES|RAZOR)/.test(c.id)?'ARME':'EQUIPEMENT';
    return 'ACTION';
  };
  // Ajout purement documentaire aux cartes de 1.0.0 : aucune stat/effet/ID remplacé.
  for(const c of D.cards)if(!c.cardClass)c.cardClass=legacyClass(c);
  const newSets={
    TF28:{name:'Frontière Tantalus',subtitle:'Contenus originaux — univers du projet',year:'Vague recherche',accent:'#85c7d7',description:'Frontière inventée par le projet. Références originales, pas continuité officielle.'},
    HA29:{name:'Éclosion MNEMOSYNE',subtitle:'Hive Ascension — univers du projet',year:'Vague recherche',accent:'#cc96dc',description:'Biologie et personnel des créations originales Hive Ascension.'}
  };
  for(const [id,set] of Object.entries(newSets))if(!D.sets[id])D.sets[id]=set;
  const packs=[
    {id:'pack_tf28',set:'TF28',name:'Frontière Tantalus',subtitle:'Archives originales',price:750,art:'COLONY',description:'Unités, transports et équipements du projet Tantalus.',unlocksAt:3},
    {id:'pack_ha29',set:'HA29',name:'Éclosion MNEMOSYNE',subtitle:'Hive Ascension',price:720,art:'EVOLUTION',description:'Expérimentations originales de la station MNEMOSYNE.',unlocksAt:3}
  ];
  for(const p of packs)if(!D.boosters.some(b=>b.id===p.id))D.boosters.push(p);
  const TYPE={PERSONNAGE:'UNIT',CREATURE:'UNIT',VEHICULE:'UNIT',ARME:'EQUIPMENT',EQUIPEMENT:'EQUIPMENT',ACTION:'TACTIC',LIEU:'LOCATION'};
  const effectText={};
  function params(kind,f,i,name,ref){
    const cost=kind==='VEHICULE'?4+i%4:kind==='PERSONNAGE'?1+i%5:kind==='CREATURE'?1+i%6:kind==='ARME'?1+i%3:kind==='EQUIPEMENT'?1+i%3:kind==='LIEU'?2+i%3:1+i%4;
    const out={cost,attack:0,health:0,keywords:[],effect:{},tags:[f.toLowerCase(),kind.toLowerCase(),'expansion'],slot:null,crewRequired:false};
    if(kind==='PERSONNAGE'||kind==='CREATURE'){
      out.attack=100+cost*175+i%3*50;out.health=350+cost*290+i%4*70;
      const kw=f==='HUMAN'?(i%4===0?'SQUAD':i%7===0?'SYNTHETIC':null):f==='XENO'?(i%4===0?'HIVE':i%3===0?'ACID':null):f==='YAUTJA'?(i%4===0?'TROPHY':i%5===0?'HUNTER':null):f==='ENGINEER'?'PATHOGEN':'REGEN';
      if(kw)out.keywords.push(kw);
      if(kind==='PERSONNAGE'&&i%4===1)out.keywords.push('UNIQUE');
      if(kind==='CREATURE'&&i%6===2)out.keywords.push('AMBUSH');
      const fx=i%5;
      if(fx===0){out.effect={onPlay:{kind:'DRAW',count:1}};out.text='À l’arrivée, piochez 1 carte. '+name+' soutient votre dispositif.';}
      else if(fx===1){out.effect={onPlay:{kind:'DAMAGE_OPPOSING',amount:200+cost*50}};out.text='À l’arrivée, inflige '+(200+cost*50)+' dégâts à la voie opposée (ou 60 % au commandant).';}
      else if(fx===2){out.effect={onPlay:{kind:'NEXT_ENERGY',amount:1}};out.text='À l’arrivée, gagnez 1 énergie supplémentaire au prochain tour.';}
      else if(fx===3){out.effect={onPlay:{kind:'TEMP_BUFF_SELF',attack:300}};out.text='À l’arrivée, gagne +300 ATK jusqu’à la fin de votre prochain tour.';}
      else {out.effect={onPlay:{kind:'BUFF_ALL',faction:f,attack:100}};out.text='À l’arrivée, vos alliés '+f+' gagnent +100 ATK.';}
      if(kind==='PERSONNAGE')out.tags.push('crew');
      else out.tags.push('organism');
    }else if(kind==='VEHICULE'){
      out.crewRequired=true;out.keywords=['ARMOR'];if(i%3===0)out.keywords.push('FLYING');
      out.attack=400+cost*180;out.health=950+cost*300;
      out.effect={onPlay:{kind:'DAMAGE_OPPOSING',amount:200+cost*55}};
      out.text='Nécessite un Personnage allié de sa faction pour être déployé et attaquer. Avec équipage : +200 ATK, +200 PV. À l’arrivée, effectue un tir sur la voie opposée.';
      out.tags.push('vehicle','transport');
    }else if(kind==='ARME'){
      out.slot='WEAPON';out.attack=150+(i%5)*100;out.health=i%4===0?100:0;
      if(i%5===0)out.keywords.push('HUNTER');
      out.text='Arme : +'+out.attack+' ATK'+(out.health?', +'+out.health+' PV':'')+'. Un seul armement nouveau par unité ; les équipements historiques restent compatibles.';
      out.tags.push('weapon');
    }else if(kind==='EQUIPEMENT'){
      out.attack=i%3===0?100:0;out.health=150+(i%4)*120;
      if(i%4===1)out.keywords.push('ARMOR');
      if(i%5===2)out.effect={onEquip:{kind:'DRAW',count:1}};
      if(i%5===0)out.effect={seeCloak:true};
      out.text='Équipement tactique : +'+out.health+' PV'+(out.attack?', +'+out.attack+' ATK':'')+'. '+(out.effect.onEquip?'À l’équipement, piochez 1.':out.effect.seeCloak?'Permet de détecter les unités camouflées.':'Protège le porteur.');
      out.tags.push('gear');
    }else if(kind==='ACTION'){
      const idx=i%7;
      if(idx===0){out.effect={kind:'DRAW',count:2};out.text='Action : piochez 2 cartes.';}
      if(idx===1){out.effect={kind:'DAMAGE_TARGET',target:'ENEMY_UNIT',amount:500};out.text='Action : infligez 500 dégâts à une unité ennemie.';}
      if(idx===2){out.effect={kind:'BUFF_TARGET',target:'FRIENDLY_UNIT',attack:350,health:200};out.text='Action : une unité alliée gagne +350 ATK et +200 PV.';}
      if(idx===3){out.effect={kind:'NEXT_ENERGY',amount:2};out.text='Action : gagnez 2 énergies au prochain tour.';}
      if(idx===4){out.effect={kind:'BUFF_ALL',faction:f,attack:200};out.text='Action : vos unités '+f+' gagnent +200 ATK.';}
      if(idx===5){out.effect={kind:'STUN_TARGET',target:'ENEMY_UNIT',damage:200,turns:1};out.text='Action : 200 dégâts et étourdissement 1 tour à une unité ennemie.';}
      if(idx===6){out.effect={kind:'DAMAGE_RANDOM_ENEMY',amount:450};out.text='Action : 450 dégâts à une unité ennemie aléatoire, ou au commandant si la voie est vide.';}
      out.tags.push('action');
    }else if(kind==='LIEU'){
      out.effect={code:'EXP_'+ref.replace(/[^a-z0-9]/gi,'_').toUpperCase(),locationBuff:{faction:f,attack:120+(i%3)*40,health:100+(i%3)*50},locationUpkeep:{heal:80+(i%3)*40}};
      out.text='Lieu : vos unités '+f+' gagnent +'+out.effect.locationBuff.attack+' ATK et +'+out.effect.locationBuff.health+' PV. Au début du tour, soignez votre commandant de '+out.effect.locationUpkeep.heal+'.';
      out.tags.push('location');
    }
    return out;
  }
  const counts={},added=[],classified={};
  for(let i=0;i<records.length;i++){
    const [sourceId,sourceName,f,kind,set,sourceCategory,classification,projectFlag]=records[i];
    const kindName=kind==='ACTION'?'Directive — '+sourceName:kind==='ARME'&&sourceId.startsWith('bio.')?'Adaptation organique — '+sourceName:kind==='EQUIPEMENT'&&sourceId.startsWith('bio.')?'Bioprotection — '+sourceName:sourceName;
    const key='AX_'+f.slice(0,2)+'_'+String(i+1).padStart(3,'0');
    if(oldIds.has(key))throw new Error('Collision de carte TCG : '+key);
    const n=(counts[set]||0)+1;counts[set]=n;
    const stats=params(kind,f,i,sourceName,sourceId);
    const defaultRarity=n%13===0?'UR':n%8===0?'SR':n%4===0?'R':'C';
    const card={
      id:key,name:kindName,type:TYPE[kind],cardClass:kind,slot:stats.slot,crewRequired:stats.crewRequired,
      faction:f,set,rarity:defaultRarity,cost:stats.cost,attack:stats.attack,health:stats.health,
      keywords:stats.keywords,text:stats.text,
      flavor:projectFlag?'Adaptation d’un univers original du projet ; non canon officiel.':'Adaptation ludique : la référence documentaire ne garantit pas un effet canon.',
      effect:stats.effect,tags:stats.tags,
      source:{workbook:'alien_base@'+snapshot,sheet:'data/entities.v1.json / '+sourceCategory,entry:sourceName,prototype:!!projectFlag},
      sourceEntityId:sourceId,sourceClassification:classification,sourcePolicy:'mechanics-proposed-not-lore-fact',
      collectorNo:set+'-'+String(300+n).padStart(3,'0'),index:D.cards.length,artSeed:hash(key),
      searchText:(kindName+' '+kind+' '+sourceName+' '+f+' '+set+' '+classification+' '+stats.text+' '+stats.tags.join(' ')).toLowerCase(),
      slug:key.toLowerCase().replaceAll('_','-')
    };
    D.cards.push(card);oldIds.add(key);added.push(card);classified[kind]=(classified[kind]||0)+1;
  }
  D.expansion={schema:'avp-tcg/gameplay-wave-v1',sourceRepository:'darknigthmare/alien_base',sourceCommit:snapshot,legacyCount:158,addedCount:added.length,classes:classified,artStatus:'procedural-placeholder-needs-individual-original-art',rules:'30-cartes; 3-exemplaires; 1 arme nouvelle par unité; véhicules avec équipage'};
  function makeRemix(faction,seed=1,style=0){
    if(!Object.hasOwn(D.factions,faction)||faction==='NEUTRAL')return null;
    const random=rng(hash(faction+'|'+seed+'|'+style));
    const available=D.cards.filter(c=>c.faction===faction||c.faction==='NEUTRAL');
    const selected=new Map();
    const total=()=>[...selected.values()].reduce((a,b)=>a+b,0);
    const cap=c=>(selected.get(c.id)||0)<D.rules.maxCopies;
    const take=(filter,count)=>{
      let found=0;
      const group=shuffle(available.filter(c=>filter(c)&&cap(c)),random).sort((a,b)=>{
        const sa=(a.id.startsWith('AX_')?0.5:0)+(a.cost<=2?.45:0)+random()*.1;
        const sb=(b.id.startsWith('AX_')?0.5:0)+(b.cost<=2?.45:0)+random()*.1;
        return sb-sa;
      });
      for(const c of group){if(found>=count)break;const current=selected.get(c.id)||0;const copies=Math.min(count-found,style===1?2:1+(random()>.75?1:0),D.rules.maxCopies-current);if(copies>0){selected.set(c.id,current+copies);found+=copies;}}
      return found;
    };
    take(c=>c.type==='UNIT'&&c.cardClass!=='VEHICULE'&&c.cost<=2,5);
    const vehCount=['HUMAN','YAUTJA'].includes(faction)?2+(style%2):0;
    take(c=>c.cardClass==='VEHICULE',vehCount);
    take(c=>c.cardClass==='ARME',4+(style===1?1:0));
    take(c=>c.cardClass==='EQUIPEMENT',3);
    take(c=>c.cardClass==='ACTION',5+(style===2?1:0));
    take(c=>c.cardClass==='LIEU',2);
    take(c=>c.type==='UNIT'&&c.cardClass!=='VEHICULE',Math.max(0,19-total()));
    // Chaque mélange est recréé depuis un pool stable et ne modifie jamais un deck sauvegardé.
    take(c=>c.cardClass!=='LIEU',D.rules.deckSize-total());
    if(total()!==D.rules.deckSize)throw new Error('Impossible de constituer le deck '+faction);
    const cards=Object.fromEntries([...selected.entries()].sort(([a],[b])=>a.localeCompare(b)));
    return cards;
  }
  D.createRemixedDeck=makeRemix;
  const themes={
    XENO:['Couvée offensive','Cycle parasitaire','Défense organique','Éveil de la Reine'],
    YAUTJA:['Chasse au trophée','Arsenal de clan','Traque urbaine','Rites et vaisseaux'],
    HUMAN:['USCM mobile','Convoi blindé','Défense Seegson','Survivants des colonies'],
    ENGINEER:['Laboratoire pathogène','Cycle du Deacon','Sujets de mutation','Génèse contrôlée'],
    HYBRID:['Convergence biologique','Mue expérimentale','Anomalies dangereuses','Infection croisée']
  };
  D.expansionDecks=[];
  for(const [f,styles]of Object.entries(themes))for(let k=0;k<styles.length;k++){
    const cards=makeRemix(f,100+k*23,k);
    const extraPool=shuffle(D.cards.filter(c=>(c.faction===f||c.faction==='NEUTRAL')&&(cards[c.id]||0)<3),rng(hash(f+'|reserve|'+k)));
    const reserve={};
    for(const c of extraPool){
      if(Object.keys(reserve).length>=15)break;
      reserve[c.id]=1;
    }
    if(Object.values(reserve).reduce((a,b)=>a+b,0)!==15)throw new Error('Réserve préconstruite incomplète : '+f);
    D.expansionDecks.push({id:'preset_'+f.toLowerCase()+'_'+(k+1),name:styles[k],faction:f,cards,reserve,count:30,boxCount:45,
      description:'Deck de 30 cartes + 15 alternatives, avec Armes, Équipements, Actions, Lieux et Véhicules selon la faction.'});
  }
})();
