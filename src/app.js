/* Interface et orchestration locale extraites du standalone vérifié. */
(function(){
  'use strict';
  const D=window.AVP_DATA,E=window.AVPEngine,U=E.U,CARD=E.CARD,RANK=E.RANK;
  const ART=window.AVP_ART||{complete:false,cards:{},scenes:{}};
  const root=document.getElementById('app'),modalRoot=document.getElementById('modal-root');
  const STORAGE_KEY='avp-hunt-hive-tcg-save-v1';
  const BACKUP_KEY=`${STORAGE_KEY}-backup`;
  const SAVE_SCHEMA='avp-hunt-hive-tcg-save';
  const SAVE_VERSION=3;
  const MAX_IMPORT_BYTES=1024*1024;
  const MAX_SAVED_DECKS=32;
  const NAV=[['home','⌂','Accueil'],['play','⚔','Jouer'],['collection','▦','Collection'],['boosters','◇','Boosters'],['decks','▤','Decks'],['campaign','⬡','Campagne'],['archive','◎','Archive']];
  const TYPE_NAMES={UNIT:'Unité',TACTIC:'Tactique',EQUIPMENT:'Équipement',LOCATION:'Lieu',...D.cardClasses};
  const displayType=card=>TYPE_NAMES[card?.cardClass]||TYPE_NAMES[card?.type]||'Carte';
  const TYPE_ICONS={UNIT:'◆',TACTIC:'✦',EQUIPMENT:'⚙',LOCATION:'⬡',PERSONNAGE:'♟',CREATURE:'☣',ARME:'⚔',VEHICULE:'▣',ACTION:'✦',LIEU:'⬡'};
  const RARITY_COLORS={C:'#a7b0aa',R:'#b8d7ed',SR:'#7fe8ff',UR:'#ffc868',SCR:'#e98bff',PR:'#8effd9',GR:'#f5ffff'};
  const DIFFICULTIES=[{id:'recruit',name:'Recrue',value:.85},{id:'normal',name:'Standard',value:1},{id:'veteran',name:'Vétéran',value:1.35},{id:'nightmare',name:'Cauchemar',value:1.75}];

  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const debounce=(fn,ms=160)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};};

  const isRecord=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
  const cleanText=(value,fallback='',max=80)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max):fallback;
  const cleanInt=(value,min,max,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.trunc(n))):fallback;};
  const cleanDate=(value,fallback='')=>typeof value==='string'&&value.length<=40&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():fallback;

  function freshSave(){return {
    schema:SAVE_SCHEMA,version:SAVE_VERSION,createdAt:new Date().toISOString(),lastPlayed:'',starterChosen:false,
    profile:{name:'Darknigthmare',level:1,xp:0,credits:6500,dust:350,wins:0,losses:0,draws:0,packsOpened:0,pity:0,completedMissions:0,totalTrophies:0,totalDamage:0},
    settings:{sound:true,motion:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,compact:false,contrast:false,largeText:false},
    tutorial:{completed:false,lastStep:0},collection:{},decks:[],activeDeckId:null,achievements:{},seenCards:{},history:[],duel:null
  };}

  function migrateSaveDocument(document){
    if(!isRecord(document))throw new Error('La racine de la sauvegarde doit être un objet JSON.');
    const raw=isRecord(document.data)?document.data:document;
    if(!isRecord(raw)||!isRecord(raw.profile)||!isRecord(raw.collection)||!Array.isArray(raw.decks))throw new Error('Les données de sauvegarde sont absentes ou invalides.');
    if(isRecord(document.data)&&document.version!==undefined&&(!Number.isInteger(document.version)||document.version<1||document.version>SAVE_VERSION))throw new Error('Version de sauvegarde invalide ou plus récente.');
    if(document.schema&&document.schema!==SAVE_SCHEMA)throw new Error('Ce fichier appartient à un autre jeu.');
    if(raw.schema&&raw.schema!==SAVE_SCHEMA)throw new Error('Schéma de sauvegarde inconnu.');
    if(raw.version!==undefined&&(!Number.isInteger(raw.version)||raw.version<1))throw new Error('Version de sauvegarde invalide.');
    const version=raw.version||1;
    if(version>SAVE_VERSION)throw new Error(`Cette sauvegarde v${version} nécessite une version plus récente du jeu.`);
    const migrated={...raw};
    if(version<2){
      migrated.settings={...(isRecord(raw.settings)?raw.settings:{}),contrast:false,largeText:false};
      migrated.tutorial={completed:Boolean(raw.starterChosen),lastStep:0};
    }
    migrated.schema=SAVE_SCHEMA;migrated.version=SAVE_VERSION;
    return migrated;
  }

  function sanitizeSave(document){
    const raw=migrateSaveDocument(document),base=freshSave(),out={...base};
    const profile=isRecord(raw.profile)?raw.profile:{};
    out.createdAt=cleanDate(raw.createdAt,base.createdAt);out.lastPlayed=cleanDate(raw.lastPlayed,'');out.starterChosen=raw.starterChosen===true;
    out.profile={
      name:cleanText(profile.name,base.profile.name,32),level:cleanInt(profile.level,1,999,1),xp:cleanInt(profile.xp,0,1000000000,0),
      credits:cleanInt(profile.credits,0,1000000000,base.profile.credits),dust:cleanInt(profile.dust,0,1000000000,base.profile.dust),
      wins:cleanInt(profile.wins,0,10000000,0),losses:cleanInt(profile.losses,0,10000000,0),draws:cleanInt(profile.draws,0,10000000,0),
      packsOpened:cleanInt(profile.packsOpened,0,10000000,0),pity:cleanInt(profile.pity,0,100,0),
      completedMissions:cleanInt(profile.completedMissions,0,D.campaign.length,0),totalTrophies:cleanInt(profile.totalTrophies,0,1000000000,0),
      totalDamage:cleanInt(profile.totalDamage,0,1000000000,0)
    };
    const settings=isRecord(raw.settings)?raw.settings:{};
    for(const key of Object.keys(base.settings))out.settings[key]=typeof settings[key]==='boolean'?settings[key]:base.settings[key];
    const tutorial=isRecord(raw.tutorial)?raw.tutorial:{};
    out.tutorial={completed:typeof tutorial.completed==='boolean'?tutorial.completed:Boolean(raw.starterChosen),lastStep:cleanInt(tutorial.lastStep,0,3,0)};
    out.collection={};
    if(isRecord(raw.collection))for(const [id,value] of Object.entries(raw.collection)){if(!CARD.has(id))continue;const count=cleanInt(value,0,999,0);if(count)out.collection[id]=count;}
    const usedDeckIds=new Set();
    out.decks=(Array.isArray(raw.decks)?raw.decks:[]).slice(0,MAX_SAVED_DECKS).map((candidate,index)=>{
      const source=isRecord(candidate)?candidate:{},cards={};let id=cleanText(source.id,`deck-import-${index+1}`,64).replace(/[^a-zA-Z0-9_-]/g,'');
      if(!id||usedDeckIds.has(id))id=`deck-import-${index+1}-${U.hash(`${id}-${index}`)}`;usedDeckIds.add(id);
      if(isRecord(source.cards))for(const [cardId,value] of Object.entries(source.cards)){
        if(!CARD.has(cardId))continue;const count=Math.min(3,cleanInt(value,0,3,0),out.collection[cardId]||0);if(count)cards[cardId]=count;
      }
      const factionId=cleanText(source.faction,'MIXED',24);
      return {id,name:cleanText(source.name,`Deck importé ${index+1}`,40),faction:factionId==='MIXED'||Object.hasOwn(D.factions,factionId)?factionId:'MIXED',cards,createdAt:cleanDate(source.createdAt,out.createdAt)};
    });
    const requestedActive=cleanText(raw.activeDeckId,'',64).replace(/[^a-zA-Z0-9_-]/g,'');out.activeDeckId=out.decks.some(deck=>deck.id===requestedActive)?requestedActive:(out.decks[0]?.id||null);
    const achievementIds=new Set(D.achievements.map(item=>item.id));out.achievements={};
    if(isRecord(raw.achievements))for(const [id,value] of Object.entries(raw.achievements)){if(achievementIds.has(id)){const date=cleanDate(value,'');if(date)out.achievements[id]=date;}}
    out.seenCards={};if(isRecord(raw.seenCards))for(const [id,value] of Object.entries(raw.seenCards)){if(CARD.has(id)&&Boolean(value))out.seenCards[id]=true;}
    out.history=(Array.isArray(raw.history)?raw.history:[]).slice(0,25).filter(isRecord).map(item=>({
      date:cleanDate(item.date,out.lastPlayed||out.createdAt),mode:item.mode==='campaign'?'campaign':'quick',
      mission:item.mode==='campaign'?cleanInt(item.mission,1,D.campaign.length,1):null,winner:[-1,0,1,null].includes(item.winner)?item.winner:null,
      reward:cleanInt(item.reward,0,10000000,0),xp:cleanInt(item.xp,0,10000000,0),round:cleanInt(item.round,0,10000,0),
      abandoned:Boolean(item.abandoned),replay:Boolean(item.replay),battleId:cleanText(item.battleId,'',80)
    }));
    if(raw.duel){
      try{
        const saved=raw.duel,checkpoint=window.AVPDuelSave.validate(saved.checkpoint);
        const mission=saved.mode==='campaign'?D.campaign.find(m=>m.id===saved.missionId):null;
        if(!['quick','campaign'].includes(saved.mode)||(saved.mode==='campaign'&&(!mission||mission.id>out.profile.completedMissions+1)))throw new Error('Mission de reprise invalide.');
        if(mission&&(checkpoint.difficulty!==mission.difficulty||JSON.stringify(checkpoint.modifiers)!==JSON.stringify(mission.modifiers)))throw new Error('Règles de mission incompatibles.');
        if(!mission&&checkpoint.modifiers.length)throw new Error('Modificateurs hors campagne.');
        if(!out.history.some(item=>item.battleId===checkpoint.id))out.duel={mode:saved.mode,missionId:mission?.id||null,checkpoint};
      }catch(error){console.warn('Duel non restauré :',error);}
    }
    return out;
  }

  function mergeSave(_base,raw){return sanitizeSave(raw);}
  const Store={
    data:null,
    persistent:true,
    source:null,
    load(){
      try{
        this.source=localStorage.getItem(STORAGE_KEY);
        const candidates=[this.source,localStorage.getItem(BACKUP_KEY)].filter(Boolean);
        for(const source of candidates){try{this.data=sanitizeSave(JSON.parse(source));return this.data;}catch(error){console.warn('Sauvegarde ignorée :',error);}}
      }catch(error){this.persistent=false;console.warn('Stockage local indisponible :',error);}
      this.data=freshSave();return this.data;
    },
    save(){
      if(!this.checkFresh())return false;
      try{
        this.data=sanitizeSave(this.data);this.data.lastPlayed=new Date().toISOString();
        const current=localStorage.getItem(STORAGE_KEY);
        if(current){try{sanitizeSave(JSON.parse(current));localStorage.setItem(BACKUP_KEY,current);}catch(error){console.warn('Ancienne sauvegarde corrompue, copie de secours non remplacée.');}}
        const serialized=JSON.stringify(this.data);localStorage.setItem(STORAGE_KEY,serialized);this.source=serialized;this.persistent=true;return true;
      }catch(error){this.persistent=false;console.warn('Impossible d’enregistrer la progression :',error);return false;}
    },
    checkFresh(){
      try{
        if(localStorage.getItem(STORAGE_KEY)===this.source)return true;
        this.load();state.battleContext=null;state.ui.pending=null;state.screen='home';closeModal();render();
        toast('Progression mise à jour dans un autre onglet. Reprenez depuis cette sauvegarde.');return false;
      }catch(error){this.persistent=false;return true;}
    },
    reset(){try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(BACKUP_KEY);this.source=null;}catch(error){console.warn(error);}this.data=freshSave();this.save();},
    backup(){try{const raw=localStorage.getItem(BACKUP_KEY);return raw?sanitizeSave(JSON.parse(raw)):null;}catch(error){return null;}},
    owned(id){return this.data.collection[id]||0;},
    add(id,count=1){this.data.collection[id]=(this.data.collection[id]||0)+count;},
    deck(){return this.data.decks.find(d=>d.id===this.data.activeDeckId)||this.data.decks[0]||null;},
  };
  Store.load();

  const state={screen:'home',codexFilters:{mode:'reference',query:'',type:'ALL',scope:'ALL'},filters:{query:'',faction:'ALL',type:'ALL',rarity:'ALL',set:'ALL',owned:'ALL',quantity:'ALL',sort:'RARITY_DESC'},deckFilters:{query:'',faction:'ALL',type:'ALL'},selectedDeckId:null,
    collectionView:'cards',collectionDeckFilters:{query:'',category:'ALL',faction:'ALL',source:'ALL',status:'ALL',sort:'NEAREST',includeReserve:false},collectionDeckLimit:12,
    ui:{difficulty:'normal',enemyFaction:'XENO',pending:null,opening:null,tutorialStep:0,modalLocked:false,collectionLimit:48,deckLimit:40,packFilter:'ALL',codexLimit:18,focusAfterRender:null},battleContext:null,lastQuickConfig:null};

  const AudioSys={ctx:null,
    cue(kind='click'){
      if(!Store.data.settings.sound)return;try{this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)();const o=this.ctx.createOscillator(),g=this.ctx.createGain();const map={click:[220,.035,.04],card:[330,.07,.05],rare:[660,.24,.07],attack:[95,.12,.075],win:[520,.5,.07],lose:[90,.45,.07],pack:[180,.32,.06],trophy:[760,.18,.05]};const [freq,dur,vol]=map[kind]||map.click;o.type=kind==='attack'?'sawtooth':'sine';o.frequency.setValueAtTime(freq,this.ctx.currentTime);if(kind==='rare')o.frequency.exponentialRampToValueAtTime(freq*1.8,this.ctx.currentTime+dur);g.gain.setValueAtTime(vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+dur);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+dur);}catch(e){}
    }
  };

  function faction(id){return D.factions[id]||D.factions.NEUTRAL;}
  function rarity(id){return D.rarities[id]||D.rarities.C;}
  function activeDeck(){return Store.data.decks.find(d=>d.id===(state.selectedDeckId||Store.data.activeDeckId))||Store.deck();}
  function deckTotal(deck){return Object.values(deck?.cards||{}).reduce((a,b)=>a+b,0);}
  function hybridSupportCount(deck){return Object.entries(deck?.cards||{}).reduce((n,[id,count])=>n+(!['HYBRID','NEUTRAL'].includes(CARD.get(id)?.faction)?count:0),0);}
  function canAddByIdentity(card,deck){return !!deck&&deck.faction!=='MIXED'&&E.allowedForIdentity(card,deck.faction)&&!(deck.faction==='HYBRID'&&!['HYBRID','NEUTRAL'].includes(card.faction)&&hybridSupportCount(deck)>=6);}
  function deckIdentity(deck){
    if(!deck||deck.faction==='MIXED'||!D.factions[deck.faction])return {id:'MIXED',name:'Coalition libre',short:'Libre',symbol:'◇',accent:'var(--cyan)'};
    return {id:deck.faction,...faction(deck.faction)};
  }
  function validatePlayableDeck(deck){
    if(!deck)return {valid:false,total:0,errors:['Aucun deck actif.']};
    const result=E.validateDeck(deck.cards,Store.data.collection,deck.faction);return deck.faction==='MIXED'?{...result,valid:false,errors:['Choisissez une identité de faction pour cette ancienne coalition.',...result.errors]}:result;
  }
  function ownedUnique(){return Object.values(Store.data.collection).filter(n=>n>0).length;}
  function collectionTotal(){return Object.values(Store.data.collection).reduce((a,b)=>a+b,0);}
  function xpNeeded(level){return 900+(level-1)*350;}
  function addXP(amount){let p=Store.data.profile;p.xp+=amount;while(p.xp>=xpNeeded(p.level)){p.xp-=xpNeeded(p.level);p.level++;p.credits+=300;toast(`Niveau ${p.level} atteint — 300 crédits`, 'good');}}
  function cardReserved(id){return Math.max(0,...Store.data.decks.map(d=>d.cards?.[id]||0));}
  function artwork(group,id){
    const entry=ART?.[group]?.[id];
    return entry&&typeof entry.src==='string'&&/^\/assets\/art\/(?:cards|scenes)\/[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.webp$/.test(entry.src)?entry:null;
  }
  function sceneArt(id,className='',priority=false,decorative=false){
    const entry=artwork('scenes',id);if(!entry)return '';
    const alt=decorative?'':entry.alt||'';
    return `<img class="scene-art ${esc(className)}" src="${esc(entry.src)}" alt="${esc(alt)}" ${decorative?'aria-hidden="true"':''} width="${Number(entry.width)||1280}" height="${Number(entry.height)||720}" loading="${priority?'eager':'lazy'}" decoding="async" ${priority?'fetchpriority="high"':''} data-art-kind="scene" data-art-id="${esc(id)}">`;
  }
  function cardArt(card,priority=false){
    const entry=artwork('cards',card.id);
    if(!entry)return artSvg(card);
    return `<img class="card-art-image" src="${esc(entry.src)}" alt="${esc(entry.alt||`Illustration originale de ${card.name}`)}" width="${Number(entry.width)||640}" height="${Number(entry.height)||800}" loading="${priority?'eager':'lazy'}" decoding="async" ${priority?'fetchpriority="high"':''} data-art-kind="card" data-card-id="${esc(card.id)}">`;
  }

  function artSvg(card){
    const f=faction(card.faction),seed=card.artSeed||1,a=(seed%37)+8,b=((seed>>>5)%43)+10,c=((seed>>>11)%29)+7;const gid=`g${card.index}-${seed}`;
    let subject='';
    if(card.faction==='XENO')subject=`<g fill="none" stroke="url(#${gid})" stroke-width="5" stroke-linecap="round"><path d="M84 30 C130 20 174 42 181 76 C150 64 118 70 96 92 C77 110 72 143 83 174"/><path d="M98 88 C124 96 143 120 142 165"/><path d="M78 104 C53 124 42 151 53 187"/><path d="M139 146 C173 155 191 176 185 205"/><path d="M83 170 C111 181 121 204 115 228"/><path d="M144 165 C163 190 158 218 147 236"/></g><ellipse cx="123" cy="65" rx="61" ry="22" fill="url(#${gid})" opacity=".82"/><path d="M165 153 C222 155 237 119 221 88" fill="none" stroke="${f.accent}" stroke-width="4" opacity=".6"/>`;
    else if(card.faction==='YAUTJA')subject=`<path d="M75 54 Q120 18 166 54 L154 121 Q121 148 87 121Z" fill="url(#${gid})"/><path d="M87 78 L113 69 L109 93 L85 95Z M154 78 L128 69 L132 93 L156 95Z" fill="#07100e" opacity=".9"/><g stroke="${f.accent}" stroke-width="5" stroke-linecap="round" opacity=".7">${[0,1,2,3,4,5].map(i=>`<path d="M${82+i*13} 116 Q${55+i*21} 168 ${62+i*22} 229"/>`).join('')}</g><path d="M90 139 L62 201 M151 139 L182 205" stroke="url(#${gid})" stroke-width="10"/>`;
    else if(card.faction==='HUMAN')subject=`<circle cx="120" cy="68" r="38" fill="url(#${gid})"/><path d="M71 219 Q74 119 120 110 Q166 119 170 219Z" fill="url(#${gid})"/><path d="M89 65 H151 L142 91 H98Z" fill="#07100e" opacity=".9"/><path d="M58 189 L30 215 M182 189 L215 210" stroke="${f.accent}" stroke-width="12" stroke-linecap="round"/><path d="M155 143 L213 99" stroke="${f.accent}" stroke-width="7"/><path d="M192 102 L226 118" stroke="${f.accent}" stroke-width="9"/>`;
    else if(card.faction==='ENGINEER')subject=`<ellipse cx="120" cy="70" rx="42" ry="53" fill="url(#${gid})"/><path d="M70 230 Q78 120 120 118 Q162 120 170 230Z" fill="url(#${gid})"/><g fill="none" stroke="${f.accent}" opacity=".45">${[38,55,72].map(r=>`<ellipse cx="120" cy="142" rx="${r}" ry="${r/2}"/>`).join('')}</g><circle cx="105" cy="67" r="5" fill="#050908"/><circle cx="136" cy="67" r="5" fill="#050908"/>`;
    else subject=`<path d="M120 25 L168 78 L151 140 L193 210 L120 181 L47 210 L89 140 L72 78Z" fill="url(#${gid})"/><circle cx="120" cy="110" r="38" fill="#07100e" opacity=".6"/><path d="M83 108 Q120 76 158 108 Q120 151 83 108Z" fill="${f.accent}" opacity=".72"/>`;
    const rings=Array.from({length:6},(_,i)=>`<circle cx="${(seed*(i+3))%230}" cy="${(seed*(i+7))%260}" r="${6+((seed>>>i)%22)}" fill="none" stroke="${f.accent}" opacity="${.04+i*.018}"/>`).join('');
    return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration abstraite ${esc(card.name)}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${f.accent}"/><stop offset=".48" stop-color="${f.dark}"/><stop offset="1" stop-color="#050908"/></linearGradient><filter id="glow${gid}"><feGaussianBlur stdDeviation="${2+(a%4)}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="240" height="260" fill="#050908"/><path d="M0 ${40+a} Q${90+b} ${10+c} 240 ${72+a} V260 H0Z" fill="${f.dark}" opacity=".65"/>${rings}<g filter="url(#glow${gid})" transform="translate(${(a%5)-2} ${(b%5)-2})">${subject}</g><path d="M0 230 L240 190 V260 H0Z" fill="#030504" opacity=".75"/><text x="12" y="247" fill="${f.accent}" opacity=".65" font-size="9" font-family="monospace">${esc(card.collectorNo)} // ${TYPE_ICONS[card.cardClass]||TYPE_ICONS[card.type]}</text></svg>`;
  }

  function cardMechanicsHTML(card){
    const rows=[],fx=card.effect||{},hosts={HUMAN:'humain',QUAD:'quadrupède',YAUTJA:'Yautja'};
    const stages={EGG:'Œuf',FACEHUGGER:'Facehugger',CHESTBURSTER:'Chestburster',DRONE:'caste adulte',PRAETORIAN:'Prétorien',QUEEN:'Reine'};
    const cardNames=ids=>(ids||[]).map(id=>CARD.get(id)?.name||id).join(' ou ');
    if(card.ammoPerAttack)rows.push(['Armement',`${card.weaponFamily.toUpperCase()} · ${card.ammoType} · ${card.ammoPerAttack} charge(s) par attaque ou riposte. À sec, le porteur conserve son attaque de base.`]);
    if(card.plasmaPerAttack)rows.push(['Armement',`${card.plasmaPerAttack} plasma par attaque ou riposte, prélevé sur votre réserve commune.`]);
    if(card.cardClass==='MUNITION')rows.push(['Rechargement',`${card.rounds} charges de ${card.ammoType}. Six chargeurs actifs maximum par porteur. Les chargeurs épuisés vont à la défausse et libèrent leur emplacement.`]);
    if(card.cardClass==='MODIFICATION'){
      if(card.compatibleEquipmentIds?.length)rows.push(['Renfort d’appareil',`Nécessite ${cardNames(card.compatibleEquipmentIds)} installé sur le même porteur. +${card.health||0} PV. Un renfort dans cet emplacement ; trois modules au total.`]);
      else rows.push(['Compatibilité',`${(card.compatibleFamilies||[]).map(x=>x.toUpperCase()).join(', ')} · emplacement ${card.modSocket}. Un module par emplacement, trois maximum. Le bonus d’attaque dépend d’une arme chargée.${card.effect?.seeCloak?" La visée passive révèle le camouflage même à sec.":""}`]);
    }
    if(card.requiresEgg)rows.push(['Éclosion',card.eggLine==='ROYAL'?'Sacrifiez un Œuf royal allié ; ce Facehugger prend sa voie.':'Sacrifiez un Œuf allié ; ce Facehugger prend sa voie.']);
    if(fx.kind==='HIVE_FUSION')rows.push(['Matériaux',`Un Facehugger et un Hôte ${hosts[fx.hostType]||fx.hostType} sur votre plateau.`]);
    if(fx.kind==='HIVE_EVOLVE')rows.push(['Matériau',`${stages[fx.fromStage]||fx.fromStage}${fx.hostType?' de lignée '+(hosts[fx.hostType]||fx.hostType):''} sur votre plateau. Coût : ${fx.biomassCost} biomasse.`]);
    if(fx.kind==='HIVE_ROUTE'){
      rows.push(['Recette de cycle',`${cardNames(fx.materialIds)}${fx.secondaryIds?.length?' + '+cardNames(fx.secondaryIds):''}. Coût : ${fx.biomassCost||0} biomasse.${fx.biomassGain?' Gain : '+fx.biomassGain+' biomasse.':''}`]);
      if(fx.catalystIds?.length)rows.push(['Catalyseur',`${cardNames(fx.catalystIds)} doit également être présent et reste sur le plateau.`]);
      if(fx.preserveMaterial)rows.push(['Reproduction','Le matériau principal reste sur le plateau. Le résultat occupe une voie libre.']);
      if(fx.continuity)rows.push(['Continuité',fx.continuity+' ; recette propre à cette adaptation du TCG.']);
    }
    if(fx.resultCardId)rows.push(['Résultat',`${CARD.get(fx.resultCardId)?.name||fx.resultCardId} doit se trouver dans votre main ou votre pioche. Une invocation interdite ne consomme aucun matériau.`]);
    if(card.summonByFusion){
      const recipes=D.cards.filter(x=>x.effect?.resultCardId===card.id);
      rows.push(['Invocation',`Cette carte ne se joue pas directement. Carte nécessaire : ${recipes.map(x=>x.name).join(' ou ')}.`]);
    }
    if(fx.kind==='WEAPON_TECHNIQUE')rows.push(['Tir spécialisé',`Arme ${(fx.weaponFamily||'compatible').toUpperCase()} équipée · ${fx.ammoCost} charge(s) de ${fx.ammoType}. Les munitions partagées ne remplacent pas la bonne famille d’arme.`]);
    if(fx.kind==='ARSENAL_PLASMA_SHOT')rows.push(['Tir plasma spécialisé',`${fx.plasmaCost} plasma requis et consommé. Arme équipée : ${D.cards.filter(c=>c.slot==='WEAPON'&&c.weaponFamily===fx.weaponFamily).map(c=>c.name).join(' ou ')}.`]);
    if(fx.requiresEquipmentIds?.length)rows.push(['Appareil requis',`${cardNames(fx.requiresEquipmentIds)} doit être installé sur l’unité ciblée.`]);
    if(fx.requiresWeaponFamilies?.length)rows.push(['Arme requise',`${D.cards.filter(c=>c.slot==='WEAPON'&&fx.requiresWeaponFamilies.includes(c.weaponFamily)).map(c=>c.name).join(' ou ')} doit être équipée par l’unité ciblée.`]);
    if(fx.honorCost)rows.push(['Honneur',`${fx.honorCost} point(s) dépensé(s) à la résolution de cette carte.`]);
    if(fx.kind==='YAUTJA_TROPHY')rows.push(['Condition',`Posséder au moins ${fx.minTrophies||1} trophée(s) gagné(s) au combat. Ce rite accorde ${fx.amount||1} honneur ; il ne crée pas de nouvelle élimination.`]);
    if(!rows.length)return '';
    return `<section class="card-mechanics" aria-label="Conditions et compatibilités"><h3>Conditions et compatibilités</h3><div class="glossary">${rows.map(([label,text])=>`<div class="glossary-row"><b>${esc(label)}</b><span>${esc(text)}</span></div>`).join('')}</div></section>`;
  }

  function cardHTML(card,opts={}){
    if(opts.back)return `<div class="tcg-card back ${opts.mini?'mini':''}"><div class="card-inner"><div class="back-mark">⌁</div></div></div>`;
    const f=faction(card.faction),r=rarity(card.rarity),kws=(card.keywords||[]).slice(0,opts.mini?2:4);
    const stats=card.cardClass==='MUNITION'?'<div class="stat">▰ '+card.rounds+' charges</div><div class="stat">'+esc(card.ammoType)+'</div>':
      card.cardClass==='MODIFICATION'?'<div class="stat">'+(card.compatibleEquipmentIds?.length?'Renfort d’appareil':'Module '+esc(card.modSocket))+'</div><div class="stat">'+(card.health&&!card.attack?'+'+U.format(card.health)+' PV':'+'+U.format(card.attack)+' ATK'+(card.health?' · +'+U.format(card.health)+' PV':''))+'</div>':
      card.type==='UNIT'?`<div class="stat atk">⚔ ${U.format(card.attack)}</div><div class="stat hp">♥ ${U.format(card.health)}</div>`:
      card.type==='EQUIPMENT'?`<div class="stat atk">+${U.format(card.attack)} ATK</div><div class="stat hp">+${U.format(card.health)} PV</div>`:
      `<div class="stat">${TYPE_ICONS[card.cardClass]||TYPE_ICONS[card.type]} ${displayType(card)}</div>`;
    return `<div class="tcg-card r-${card.rarity} ${opts.foil?'foil':''} ${opts.mini?'mini':''}" style="--fa:${f.accent};--fd:${f.dark}"><div class="card-inner"><div class="card-top"><div class="card-cost">${card.cost}</div><div class="card-name">${esc(card.name)}</div><div class="card-set">${card.set}</div></div><div class="card-art">${cardArt(card,opts.priority)}</div><div class="card-typebar"><span>${f.symbol} ${displayType(card)}</span><span class="card-rarity">${r.short}</span></div><div class="card-text">${kws.length?`<div class="card-keywords">${kws.map(k=>`<span class="kw">${esc(k)}</span>`).join('')}</div>`:''}${esc(card.text)}</div><div class="card-stats">${stats}<span class="collector">${card.collectorNo}</span></div></div></div>`;
  }
  function cardWrap(card,opts={}){const owned=Store.owned(card.id);return `<div class="card-wrap ${opts.clickable!==false?'clickable':''}" ${opts.action?`data-action="${opts.action}" aria-label="Voir ${esc(card.name)}, ${owned} exemplaire(s)"`:''} data-card-id="${card.id}">${opts.showOwned!==false?`<span class="owned-badge ${owned?'':'zero'}">${owned}</span>`:''}${cardHTML(card,opts)}</div>`;}

  function navHTML(mobile=false){const items=mobile?NAV.filter(x=>['home','play','collection','boosters','decks'].includes(x[0])):NAV;return items.map(([id,icon,label])=>`<button class="${mobile?'':'nav-btn'} ${state.screen===id?'active':''}" data-action="nav" data-screen="${id}">${mobile?`<i>${icon}</i>`:''}${label}</button>`).join('');}
  function shell(content,wide=false){
    const p=Store.data.profile;return `<div class="shell ${Store.data.settings.motion?'':'no-motion'} ${Store.data.settings.contrast?'high-contrast':''} ${Store.data.settings.largeText?'large-text':''}"><header class="topbar"><div class="brand" data-action="nav" data-screen="home" aria-label="Retour à l’accueil"><div class="brand-mark">⌁</div><div class="brand-copy"><b>AVP: HUNT // HIVE</b><span>TACTICAL CARD GAME</span></div></div><nav class="main-nav" aria-label="Navigation principale">${navHTML()}</nav><div class="profile-strip"><div class="currency" role="group" title="Crédits" aria-label="${U.format(p.credits)} crédits"><i>◈</i><span>${U.format(p.credits)}</span></div><div class="currency" role="group" title="Poussière de synthèse" aria-label="${U.format(p.dust)} poussières"><i>✧</i><span>${U.format(p.dust)}</span></div><button class="icon-btn" data-action="tutorial" aria-label="Ouvrir le tutoriel">?</button><button class="icon-btn" data-action="settings" aria-label="Paramètres et sauvegarde">⚙</button></div></header><main class="screen ${wide?'wide':''}" id="main-content" tabindex="-1">${!Store.persistent?'<div class="storage-warning" role="status">Stockage local indisponible : la progression reste temporaire. Exportez votre sauvegarde dans les paramètres.</div>':''}${state.screen!=='battle'&&Store.data.duel?`<section class="panel pad resume-banner" aria-label="Duel sauvegardé"><p class="resume-title"><strong>Duel en pause — tour ${Store.data.duel.checkpoint.state.round}</strong></p><p class="subtle">${Store.data.duel.mode==='campaign'?'Campagne':'Exhibition'} • Le tour adverse reprend depuis son début si le jeu a été fermé pendant son action.</p><button class="btn primary" data-action="resume-battle">Reprendre le duel</button></section>`:''}${content}</main><nav class="mobile-nav" aria-label="Navigation mobile">${navHTML(true)}</nav></div>`;
  }
  function screenHead(kicker,title,desc,actions=''){return `<div class="screen-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>${actions?`<div class="head-actions">${actions}</div>`:''}</div>`;}

  function heroCards(){const ids=['X_BIG_CHAP','Y_JUNGLE_HUNTER','H_RIPLEY'];return ids.map((id,i)=>cardHTML(CARD.get(id),{mini:false,foil:i===2,priority:true})).join('');}
  function renderHome(){
    const p=Store.data.profile,deck=Store.deck(),valid=deck?validatePlayableDeck(deck):{valid:false,total:0};const discovered=ownedUnique();
    return shell(`<section class="hero">${sceneArt('home-hero','hero-backdrop',true,true)}<div class="hero-copy"><div class="eyebrow">JEU COMPLET HORS LIGNE • VERSION ${D.version}</div><h1>HUNT.<br><span>HIVE.</span><br>SURVIVE.</h1><p class="tagline">Construisez un deck Alien, Predator, AVP, Humain ou Engineer. Ouvrez des boosters, collectionnez sept raretés et combattez sur trois voies tactiques.</p><div class="hero-actions"><button class="btn primary" data-action="quick-launch">⚔ Duel rapide</button><button class="btn secondary" data-action="nav" data-screen="boosters">◇ Ouvrir un booster</button><button class="btn ghost" data-action="nav" data-screen="campaign">⬡ Campagne</button></div><div class="hero-meta"><div class="hero-stat"><b>${D.cards.length}</b><span>cartes jouables</span></div><div class="hero-stat"><b>${discovered}/${D.cards.length}</b><span>découvertes</span></div><div class="hero-stat"><b>${p.completedMissions}/8</b><span>missions</span></div><div class="hero-stat"><b>${p.wins}</b><span>victoires</span></div></div></div><div class="hero-stage"><div class="hero-orbit"></div><div class="hero-card-stack">${heroCards()}</div><div class="floating-chip a">7 niveaux de rareté</div><div class="floating-chip b">IA tactique</div><div class="floating-chip c">Sauvegarde locale</div></div></section>
    <section class="dashboard-grid"><article class="panel dash-card span-4"><div class="eyebrow">DECK ACTIF</div><h2>${deck?esc(deck.name):'Aucun deck'}</h2><p>${deck?`${valid.total}/30 cartes • ${valid.valid?'Prêt au combat':'À corriger'}`:'Choisissez un deck de départ.'}</p><div class="progress" style="margin-top:16px"><i style="width:${Math.min(100,(valid.total||0)/30*100)}%"></i></div><div style="margin-top:14px"><button class="btn small" data-action="nav" data-screen="decks">Gérer le deck</button></div><span class="watermark">▤</span></article>
    <article class="panel dash-card span-4"><div class="eyebrow">PROGRESSION</div><div class="big">Niv. ${p.level}</div><p>${U.format(p.xp)} / ${U.format(xpNeeded(p.level))} XP</p><div class="progress" style="margin-top:16px"><i style="width:${p.xp/xpNeeded(p.level)*100}%"></i></div><span class="watermark">✦</span></article>
    <article class="panel dash-card span-4"><div class="eyebrow">COLLECTION</div><div class="big">${Math.round(discovered/D.cards.length*100)}%</div><p>${collectionTotal()} cartes possédées • ${U.format(p.dust)} poussières</p><div class="progress" style="margin-top:16px"><i style="width:${discovered/D.cards.length*100}%"></i></div><span class="watermark">▦</span></article>
    <article class="panel dash-card span-7"><div class="eyebrow">ACCÈS RAPIDE</div><div class="quick-list"><div class="quick-row" data-action="nav" data-screen="play"><div class="quick-icon">⚔</div><div><b>Exhibition contre l’IA</b><span>Choisir faction et difficulté</span></div><em>›</em></div><div class="quick-row" data-action="nav" data-screen="campaign"><div class="quick-icon">⬡</div><div><b>Campagne narrative</b><span>${p.completedMissions===8?'Toutes les missions terminées':`Prochaine mission : ${Math.min(8,p.completedMissions+1)}/8`}</span></div><em>›</em></div><div class="quick-row" data-action="nav" data-screen="boosters"><div class="quick-icon">◇</div><div><b>Boutique de boosters</b><span>Garantie Rare, protection de malchance</span></div><em>›</em></div></div></article>
    <article class="panel dash-card span-5"><div class="eyebrow">DOSSIER SOURCE</div><h2>Encyclopédies Alien & Predator</h2><p>Le pool de lancement transforme les catégories des classeurs — castes, humains, armes, équipements, lieux, rituels et prototypes — en cartes équilibrées et traçables.</p><div style="margin-top:15px"><button class="btn small" data-action="nav" data-screen="archive">Consulter l’archive</button></div><span class="watermark">◎</span></article></section>`);
  }

  function renderPlay(){
    const deck=Store.deck(),check=deck?validatePlayableDeck(deck):{valid:false,errors:['Aucun deck actif.']};
    return shell(`${screenHead('MODE EXHIBITION','Choisissez votre chasse','Affrontez une IA générée depuis les factions du catalogue. La campagne applique des modificateurs supplémentaires.',`<button class="btn ghost" data-action="nav" data-screen="decks">▤ Deck actif</button>`)}<div class="play-grid"><section class="panel mode-card"><div class="eyebrow">DUEL RAPIDE</div><h2>${deck?esc(deck.name):'Aucun deck actif'}</h2><p>${check.valid?'Votre deck respecte les 30 cartes et peut entrer en duel.':esc(check.errors.join(' '))}</p><h3 style="font-size:12px;margin:16px 0 3px">Difficulté</h3><div class="difficulty">${DIFFICULTIES.map(d=>`<button class="diff-btn ${state.ui.difficulty===d.id?'active':''}" data-action="difficulty" data-id="${d.id}">${d.name}</button>`).join('')}</div><h3 style="font-size:12px;margin:5px 0 9px">Faction adverse</h3><div class="enemy-select">${['XENO','YAUTJA','HUMAN','ENGINEER','HYBRID'].map(id=>{const f=faction(id);return `<button class="enemy-btn ${state.ui.enemyFaction===id?'active':''}" style="--ep:${f.accent}" data-action="enemy-faction" data-id="${id}">${f.symbol} ${f.short}</button>`}).join('')}</div><button class="btn primary block" data-action="start-quick" ${check.valid?'':'disabled'}>Lancer le duel</button></section><aside class="panel pad"><div class="eyebrow">RÈGLES DU DUEL</div><h2 style="margin:10px 0">Trois voies. 8 000 PV.</h2><div class="quick-list"><div class="quick-row"><div class="quick-icon">1</div><div><b>Énergie croissante</b><span>1 à 10 points au fil des tours</span></div></div><div class="quick-row"><div class="quick-icon">2</div><div><b>Déploiement par voie</b><span>Une unité de chaque camp par voie</span></div></div><div class="quick-row"><div class="quick-icon">3</div><div><b>Effets de faction</b><span>Ruche, Trophée, Escouade, Pathogène</span></div></div><div class="quick-row"><div class="quick-icon">4</div><div><b>Victoire</b><span>Réduire le commandant adverse à 0 PV</span></div></div></div><button class="btn secondary block" style="margin-top:16px" data-action="nav" data-screen="campaign">Voir la campagne</button></aside></div>`,false);
  }

  function filteredCards(filters=state.filters,ownedOnly=false){
    if(filters===state.filters&&window.AVPCollection)return collectionModel().filterCards(filters);
    const q=(filters.query||'').trim().toLowerCase();return D.cards.filter(c=>{
      if(q&&!c.searchText.includes(q))return false;if(filters.faction&&filters.faction!=='ALL'&&c.faction!==filters.faction)return false;if(filters.type&&filters.type!=='ALL'&&c.type!==filters.type&&c.cardClass!==filters.type)return false;if(filters.rarity&&filters.rarity!=='ALL'&&c.rarity!==filters.rarity)return false;if(filters.set&&filters.set!=='ALL'&&c.set!==filters.set)return false;if((ownedOnly||filters.owned==='OWNED')&&!Store.owned(c.id))return false;if(filters.owned==='MISSING'&&Store.owned(c.id))return false;return true;
    }).sort((a,b)=>RANK[b.rarity]-RANK[a.rarity]||a.name.localeCompare(b.name,'fr'));
  }
  function filtersHTML(filters,prefix='collection',full=true){return `<div class="panel filters"><label class="field">⌕ <input data-filter-prefix="${prefix}" data-filter="query" value="${esc(filters.query||'')}" placeholder="Rechercher une carte…"></label><label class="field"><select data-filter-prefix="${prefix}" data-filter="faction"><option value="ALL">Toutes factions</option>${Object.entries(D.factions).map(([id,f])=>`<option value="${id}" ${filters.faction===id?'selected':''}>${f.name}</option>`).join('')}</select></label><label class="field"><select data-filter-prefix="${prefix}" data-filter="type"><option value="ALL">Tous types</option>${Object.entries(D.cardClasses||TYPE_NAMES).map(([id,n])=>`<option value="${id}" ${filters.type===id?'selected':''}>${n}</option>`).join('')}</select></label>${full?`<label class="field"><select data-filter-prefix="${prefix}" data-filter="rarity"><option value="ALL">Toutes raretés</option>${Object.entries(D.rarities).map(([id,r])=>`<option value="${id}" ${filters.rarity===id?'selected':''}>${r.name}</option>`).join('')}</select></label><label class="field"><select data-filter-prefix="${prefix}" data-filter="set"><option value="ALL">Toutes extensions</option>${Object.entries(D.sets).map(([id,s])=>`<option value="${id}" ${filters.set===id?'selected':''}>${id} — ${s.name}</option>`).join('')}</select></label><label class="field"><select data-filter-prefix="${prefix}" data-filter="owned"><option value="ALL" ${filters.owned==='ALL'?'selected':''}>Tout le catalogue</option><option value="OWNED" ${filters.owned==='OWNED'?'selected':''}>Possédées</option><option value="MISSING" ${filters.owned==='MISSING'?'selected':''}>Manquantes</option></select></label>`:''}<span class="filter-count" data-filter-count></span></div>`;}
  function renderLegacyCollection(){const list=filteredCards(),visible=list.slice(0,state.ui.collectionLimit);return shell(`${screenHead('CATALOGUE MAÎTRE','Collection',`Filtrez les ${D.cards.length} cartes, consultez leur origine et fabriquez les exemplaires manquants avec la poussière de synthèse.`,`<button class="btn secondary" data-action="nav" data-screen="boosters">◇ Boosters</button><button class="btn ghost" data-action="nav" data-screen="archive">◎ Codex Alien_base</button>`)}${filtersHTML(state.filters)}<div class="card-grid">${visible.map(c=>cardWrap(c,{action:'view-card'})).join('')||'<div class="panel pad subtle">Aucune carte ne correspond aux filtres.</div>'}</div>${list.length>visible.length?`<div class="load-more"><button class="btn secondary" data-action="more-cards" data-scope="collection">Afficher 48 cartes de plus (${visible.length}/${list.length})</button></div>`:''}`,true);}

  function collectionModel(){return window.AVPCollection.createModel(D,Store.data.collection,Store.data.decks);}
  const collectionPercent=value=>new Intl.NumberFormat('fr-FR',{style:'percent',maximumFractionDigits:1}).format(value);
  function collectionProgress(label,value,total){return `<progress class="collection-progress" max="${Math.max(1,total)}" value="${value}" aria-label="${esc(label)} : ${value} sur ${total}"></progress>`;}
  function collectionStat(label,value,note){return `<div class="panel collection-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;}
  function renderCollectionProgress(model){
    const group=(field,title)=>`<section class="panel collection-breakdown"><h2>${title}</h2><div class="collection-breakdown-list">${model.groups(field).map(row=>`<button class="collection-progress-row" data-action="collection-filter-group" data-group-field="${field}" data-group-value="${esc(row.id)}" aria-label="Filtrer ${esc(row.name)}, ${row.owned} cartes possédées sur ${row.total}"><span class="collection-progress-title">${esc(row.name)}<small>${row.fullPlaysets} jeux de ${model.maxCopies} exemplaires</small></span><span class="collection-progress-numbers"><b>${row.owned} / ${row.total}</b><small>${collectionPercent(row.ratio)}</small></span>${collectionProgress(row.name,row.owned,row.total)}</button>`).join('')}</div></section>`;
    return `<div class="collection-breakdowns">${group('faction','Par faction')}${group('rarity','Par rareté')}${group('type','Par type de carte')}${group('set','Par extension')}</div><section class="panel collection-breakdown"><h2>Par type de deck</h2><p class="subtle">Cartes différentes utilisées par chaque gamme, sans compter plusieurs fois une carte partagée entre ses recettes. Progression du principal.</p><div class="collection-category-grid">${model.deckGroups().map(row=>`<button class="collection-progress-row" data-action="collection-deck-group" data-group-value="${esc(row.id)}"><span class="collection-progress-title">${esc(row.name)}<small>${row.ready} / ${row.recipes} recettes complètes</small></span><span class="collection-progress-numbers"><b>${row.owned} / ${row.total}</b><small>cartes différentes</small></span>${collectionProgress(row.name,row.owned,row.total)}</button>`).join('')}</div></section>`;
  }
  function collectionCardFilters(){
    const filters=state.filters;
    const extra=`<div class="collection-filter-extras"><label class="field"><span>Exemplaires</span><select data-filter-prefix="collection" data-filter="quantity">${[['ALL','Toutes quantités'],['ONE','Un exemplaire'],['TWO','Deux exemplaires'],['THREE_PLUS','Trois ou plus']].map(([id,name])=>`<option value="${id}" ${filters.quantity===id?'selected':''}>${name}</option>`).join('')}</select></label><label class="field"><span>Trier</span><select data-filter-prefix="collection" data-filter="sort">${[['RARITY_DESC','Rareté décroissante'],['RARITY_ASC','Rareté croissante'],['NAME','Nom'],['INDEX','Numéro de collection'],['COST_ASC','Énergie croissante'],['COST_DESC','Énergie décroissante'],['OWNED_DESC','Plus possédées'],['OWNED_ASC','Moins possédées']].map(([id,name])=>`<option value="${id}" ${filters.sort===id?'selected':''}>${name}</option>`).join('')}</select></label><button class="btn ghost" data-action="collection-clear-filters">Réinitialiser les filtres</button></div>`;
    return filtersHTML(filters).replace('<option value="MISSING"',`<option value="DUPLICATES" ${filters.owned==='DUPLICATES'?'selected':''}>Avec doublons</option><option value="PLAYSET" ${filters.owned==='PLAYSET'?'selected':''}>Jeu de ${D.rules.maxCopies} complet</option><option value="INCOMPLETE" ${filters.owned==='INCOMPLETE'?'selected':''}>Jeu de ${D.rules.maxCopies} incomplet</option><option value="SPARES" ${filters.owned==='SPARES'?'selected':''}>Au-delà de ${D.rules.maxCopies} exemplaires</option><option value="MISSING"`)+extra;
  }
  function renderCollectionCards(model){
    const list=model.filterCards(state.filters),visible=list.slice(0,state.ui.collectionLimit),owned=list.filter(card=>model.quantity(card.id)>0).length;
    return `${collectionCardFilters()}<p class="collection-results" role="status">${owned} carte(s) possédée(s) parmi les ${list.length} résultats. ${D.cards.length} cartes dans le catalogue.</p><div class="card-grid collection-card-grid">${visible.map(card=>{const n=model.quantity(card.id);return `<article class="collection-card ${n?'':'collection-card-missing'}">${cardWrap(card,{action:'view-card'})}<p class="collection-card-note">${n?`${n} exemplaire${n>1?'s':''} · ${n>=model.maxCopies?'jeu complet':`${model.maxCopies-n} pour compléter le jeu`}`:'À collectionner'}</p></article>`;}).join('')||'<div class="panel pad subtle">Aucune carte ne correspond aux filtres. Réinitialisez-les pour retrouver le catalogue.</div>'}</div>${list.length>visible.length?`<div class="load-more"><button class="btn secondary" data-action="more-cards" data-scope="collection">Afficher 48 cartes de plus (${visible.length}/${list.length})</button></div>`:''}`;
  }
  function collectionDeckFilter(name,label,options){const selected=state.collectionDeckFilters[name];return `<label class="field"><span>${label}</span><select id="collection-deck-${name}" data-collection-filter="${name}" aria-label="${label}">${options.map(([id,text])=>`<option value="${esc(id)}" ${selected===id?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
  function renderCollectionDecks(model){
    const filters=state.collectionDeckFilters,list=model.filterDecks(filters),visible=list.slice(0,state.collectionDeckLimit);
    return `<section class="panel collection-deck-controls"><label class="field collection-deck-search"><span>Rechercher une recette</span><input id="collection-deck-query" data-collection-filter="query" value="${esc(filters.query)}" placeholder="Nom, faction, doctrine…" aria-label="Rechercher une recette"></label>${collectionDeckFilter('category','Type de deck',[['ALL','Tous les types'],...model.deckGroups().map(row=>[row.id,row.name])])}${collectionDeckFilter('faction','Faction',[['ALL','Toutes factions'],...Object.entries(D.factions).map(([id,f])=>[id,f.name])])}${collectionDeckFilter('source','Recettes',[['ALL','Toutes les recettes'],['CATALOGUE','Catalogue'],['STARTER','Départs historiques'],['SAVED','Mes decks']])}${collectionDeckFilter('status','Progression',[['ALL','Toutes progressions'],['READY','Complètes'],['MISSING','À compléter']])}${collectionDeckFilter('sort','Classement',[['NEAREST','Les plus proches'],['DUST','Coût de fabrication'],['NAME','Nom']])}<label class="collection-reserve-toggle"><input id="collection-include-reserve" type="checkbox" data-collection-filter="includeReserve" ${filters.includeReserve?'checked':''}> Inclure les cartes de réserve</label><p class="subtle collection-deck-note">Une même carte peut servir à plusieurs recettes. Chaque recette compare séparément ses quantités avec votre collection ; le principal et la réserve se cumulent lorsque l’option est activée.</p></section><p class="collection-results" role="status">${list.length} recette(s) · ${list.filter(row=>row.complete).length} complète(s) · ${filters.includeReserve?'principal et réserve':'principal uniquement'}</p><div class="collection-deck-grid">${visible.map(covered=>`<article class="panel collection-deck-record"><div class="eyebrow">${esc(model.categoryNames[covered.recipe.category]||covered.recipe.category)} · ${esc(faction(covered.recipe.faction).short)}</div><h2>${esc(covered.recipe.name)}</h2><div class="collection-deck-meter"><strong>${covered.available} / ${covered.total}</strong><span>${covered.complete?'Recette complète':`${covered.missing} exemplaire${covered.missing>1?'s':''} manquant${covered.missing>1?'s':''}`}</span></div>${collectionProgress(covered.recipe.name,covered.available,covered.total)}<p class="subtle">${covered.uniqueOwned} / ${covered.unique} cartes différentes${covered.unknown?' · référence de carte manquante':covered.missing?` · ${U.format(covered.dust)} poussières pour les manquants`:''}</p><button class="btn secondary" data-action="collection-deck-detail" data-recipe-key="${esc(covered.recipe.key)}">${covered.complete?'Consulter la composition':'Voir les cartes manquantes'}</button></article>`).join('')||'<div class="panel pad subtle">Aucune recette ne correspond à ces critères.</div>'}</div>${list.length>visible.length?`<div class="load-more"><button class="btn secondary" data-action="collection-more-decks">Afficher 12 recettes de plus (${visible.length}/${list.length})</button></div>`:''}`;
  }
  function renderCollection(){
    if(!window.AVPCollection)return renderLegacyCollection();
    const model=collectionModel(),stats=model.summary(),ready=model.recipes.filter(recipe=>model.deckCoverage(recipe).complete).length;
    const summary=`<section class="collection-stats" aria-label="Progression de votre collection">${collectionStat('Cartes différentes',`${stats.owned} <span>/ ${stats.total}</span>`,`${collectionPercent(stats.ratio)} du catalogue · ${stats.missing} manquantes`)}${collectionStat('Exemplaires',U.format(stats.copies),`${U.format(stats.duplicates)} doublons après le premier exemplaire`)}${collectionStat(`Jeux de ${model.maxCopies}`,`${stats.fullPlaysets} <span>/ ${stats.total}</span>`,`${U.format(stats.playsetCopies)} / ${U.format(stats.playsetTotal)} exemplaires utiles`)}${collectionStat('Recettes complètes',`${ready} <span>/ ${model.recipes.length}</span>`,'Principal uniquement, départs et decks personnels inclus')}</section>`;
    const tabs=`<nav class="collection-view-tabs" aria-label="Vue de la collection">${[['cards','Cartes'],['progress','Progression'],['decks','Par type de deck']].map(([id,label])=>`<button class="btn ${state.collectionView===id?'secondary':'ghost'}" data-action="collection-view" data-view="${id}" aria-pressed="${state.collectionView===id}">${label}</button>`).join('')}</nav>`;
    const body=state.collectionView==='progress'?renderCollectionProgress(model):state.collectionView==='decks'?renderCollectionDecks(model):renderCollectionCards(model);
    return shell(`${screenHead('VOTRE ARMURERIE','Collection',`Suivez vos cartes, complétez vos recettes et consultez les munitions, modules et évolutions associés.`,`<button class="btn secondary" data-action="nav" data-screen="boosters">◇ Boosters</button><button class="btn ghost" data-action="collection-export">Exporter l’inventaire</button><button class="btn ghost" data-action="nav" data-screen="archive">◎ Codex Alien_base</button>`)}${summary}${stats.owned?'':'<div class="panel collection-empty"><h2>Votre collection commence ici</h2><p>Les cartes du catalogue restent consultables. Choisissez votre deck de départ depuis l’accueil, puis gagnez ou ouvrez des boosters pour compléter votre collection.</p><button class="btn secondary" data-action="nav" data-screen="home">Choisir mon départ</button></div>'}${tabs}${body}`,true);
  }
  function showCollectionDeck(key){
    if(!window.AVPCollection)return;const model=collectionModel(),covered=model.deckCoverage(key,state.collectionDeckFilters.includeReserve);if(!covered)return;
    const recipe=covered.recipe,playable=validatePlayableDeck(recipe);
    modal(esc(recipe.name),`<section class="collection-deck-detail"><p>${esc(model.categoryNames[recipe.category]||recipe.category)} · ${esc(faction(recipe.faction).name)} · ${covered.includeReserve?'principal et réserve':'principal uniquement'}</p><div class="collection-deck-meter"><strong>${covered.available} / ${covered.total}</strong><span>${covered.missing} exemplaire(s) manquant(s)</span></div>${collectionProgress(recipe.name,covered.available,covered.total)}<div class="collection-detail-toolbar"><button class="btn ghost small" data-action="collection-toggle-reserve" data-recipe-key="${esc(key)}" aria-pressed="${covered.includeReserve}">${covered.includeReserve?'Afficher seulement le principal':'Inclure la réserve'}</button><button class="btn secondary small" data-action="collection-build-deck" data-recipe-key="${esc(key)}" ${covered.mainReady&&playable.valid&&Store.data.decks.length<MAX_SAVED_DECKS?'':'disabled'}>Créer le principal avec mes cartes</button></div><p class="subtle">${covered.unknown?'Le coût complet est indisponible : une référence de carte manque dans cette version.':covered.missing?`${U.format(covered.dust)} poussières nécessaires pour fabriquer les exemplaires manquants.`:'Toutes les cartes de cette sélection sont dans votre collection.'} La création du deck utilise vos cartes déjà possédées.${!playable.valid&&covered.mainMissing===0?' '+esc(playable.errors[0]):Store.data.decks.length>=MAX_SAVED_DECKS?' La limite de '+MAX_SAVED_DECKS+' decks enregistrés est atteinte.':''}</p><div class="collection-deck-card-list">${covered.rows.map(row=>`<div class="collection-deck-card-row ${row.missing?'is-missing':''}"><div><button class="collection-card-name" data-action="view-card" data-card-id="${esc(row.id)}" ${row.unknown?'disabled':''}>${esc(row.card?.name||row.id)}</button><small>${row.main} principal${covered.includeReserve?` + ${row.reserve} réserve`:''} · ${row.card?esc(rarity(row.card.rarity).name):'Carte inconnue'}</small></div><div class="collection-row-quantity"><b>${row.available} / ${row.required}</b><span>${row.missing?`${row.missing} manquant(s)`:'Possédée'}</span></div><button class="btn ghost small" data-action="collection-find-card" data-card-id="${esc(row.id)}" ${row.unknown?'disabled':''}>Dans la collection</button></div>`).join('')}</div></section>`);
  }
  function buildCollectionDeck(key){
    const model=window.AVPCollection&&collectionModel(),covered=model?.deckCoverage(key);if(!covered)return;
    const check=validatePlayableDeck(covered.recipe);
    if(!covered.mainReady||!check.valid){toast(check.errors[0]||'Il manque des cartes pour créer ce deck.','bad');return;}
    if(Store.data.decks.length>=MAX_SAVED_DECKS){toast(`Limite de ${MAX_SAVED_DECKS} decks atteinte.`,'bad');return;}
    const recipe=covered.recipe,deck={id:U.uid('deck'),name:recipe.name.slice(0,40),faction:recipe.faction,cards:U.clone(recipe.cards),createdAt:new Date().toISOString()};
    Store.data.decks.push(deck);state.selectedDeckId=deck.id;Store.save();closeModal();navigate('decks');toast('Deck créé avec vos cartes possédées.','good');
  }
  function collectionRelationsHTML(card){
    if(!window.AVPCollection)return '';const model=collectionModel(),groups=model.relatedCards(card.id);if(!groups.length)return '';
    return `<section class="collection-related" aria-label="Cartes associées"><h3>Cartes associées</h3>${groups.map(group=>`<details><summary>${esc(group.title)} (${group.cards.length})</summary><div class="collection-related-links">${group.cards.map(other=>`<button class="btn ghost small" data-action="view-card" data-card-id="${esc(other.id)}">${esc(other.name)} <span>×${model.quantity(other.id)}</span></button>`).join('')}</div></details>`).join('')}</section>`;
  }

  function renderBoosters(){
    const p=Store.data.profile,filter=state.ui.packFilter;
    const visible=D.boosters.filter(pack=>filter==='ALL'||(filter==='CLASSIC'?!pack.preview:!!pack.preview));
    return shell(`${screenHead('BOUTIQUE DE LA COMPAGNIE','Boosters','Paquets de 5, 7 ou 9 cartes selon les extensions ; protection de malchance Ultra Rare. Les nouveaux sets sont des aperçus jouables, pas encore des catalogues complets.',`<button class="btn ghost" data-action="nav" data-screen="collection">▦ Collection</button>`)}
      <div class="panel pity-box"><div><b>Protection de malchance</b><br><span>${p.pity} booster${p.pity>1?'s':''} sans Ultra Rare ou supérieure</span></div><div class="progress"><i style="width:${Math.min(100,p.pity/10*100)}%"></i></div><strong>${p.pity}/10</strong></div>
      <div class="panel filters" style="margin:12px 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <label class="field">Filtrer les boosters
          <select data-action="pack-filter" aria-label="Filtrer les boosters">
            <option value="ALL" ${filter==='ALL'?'selected':''}>Toutes les extensions</option>
            <option value="CLASSIC" ${filter==='CLASSIC'?'selected':''}>Boosters historiques (9)</option>
            <option value="PREVIEW" ${filter==='PREVIEW'?'selected':''}>Nouveaux aperçus (5/7/9)</option>
          </select>
        </label>
        <span class="subtle">${visible.length} booster(s) affiché(s) sur ${D.boosters.length}. Les illustrations des nouvelles extensions restent provisoires.</span>
      </div>
      <div class="pack-grid">${visible.map(pack=>{
        const set=D.sets[pack.set],locked=p.completedMissions<(pack.unlocksAt||0);
        const glyph={SIGNAL:'⌁',COLONY:'✦',HUNTER:'◈',RITUAL:'☣',EVOLUTION:'⬡',PROTOTYPE:'⟁'}[pack.art]||'✦';
        const count=pack.cardsPerBooster||9;
        return `<article class="panel pack ${locked?'locked':''}" style="--pc:${set.accent}">
          <div class="pack-art">${sceneArt('booster-'+pack.set.toLowerCase(),'pack-art-image')}
            <span class="pack-code">${pack.set} // ${count} CARTES</span><span class="pack-glyph">${glyph}</span>
          </div>
          <span class="subtitle">${esc(pack.subtitle)}</span><h2>${esc(pack.name)}</h2>
          <p>${esc(pack.description)}</p>
          <div class="pack-footer"><span class="pack-price">◈ ${U.format(pack.price)}</span>
            <button class="btn primary" data-action="buy-pack" data-id="${pack.id}" ${locked||p.credits<pack.price?'disabled':''}>${locked?`Mission ${pack.unlocksAt}`:'Ouvrir'}</button>
          </div>
          <p class="subtle" style="font-size:11px">${pack.preview?'Extension en cours de développement — pool vérifié, pas un set complet.':'Pool historique conservé.'}</p>
        </article>`;
      }).join('')}</div>`,true);
  }

  function renderDecks(){
    const deck=activeDeck();if(!state.selectedDeckId&&deck)state.selectedDeckId=deck.id;
    const check=validatePlayableDeck(deck),identity=deckIdentity(deck);
    const review=deck?E.analyzeDeck(deck.cards,deck.faction):null;
    const classCounts=review?Object.entries(D.cardClasses||{}).map(([key,title])=>`<span class="kw" title="${esc(title)}">${esc(title)} : ${review.classes[key]||0}</span>`).join(''):'';
    const list=filteredCards({...state.deckFilters,rarity:'ALL',set:'ALL',owned:'OWNED'},true).filter(c=>E.allowedForIdentity(c,identity.id));
    const visible=list.slice(0,state.ui.deckLimit);
    const deckRows=deck?Object.entries(deck.cards).filter(([,n])=>n>0).sort((a,b)=>CARD.get(a[0]).cost-CARD.get(b[0]).cost||CARD.get(a[0]).name.localeCompare(CARD.get(b[0]).name)).map(([id,n])=>{
      const c=CARD.get(id);return `<div class="deck-row"><div><b>${esc(c.name)}</b><span>${c.cost} énergie • ${rarity(c.rarity).short} • possédé ${Store.owned(id)}</span></div><div class="count-controls"><button aria-label="Retirer ${esc(c.name)}" data-action="deck-remove" data-card-id="${id}">−</button><strong>${n}</strong><button aria-label="Ajouter ${esc(c.name)}" data-action="deck-add" data-card-id="${id}" ${!canAddByIdentity(c,deck)||n>=Math.min(3,Store.owned(id))||deckTotal(deck)>=30?'disabled':''}>+</button></div></div>`;
    }).join(''):'';
    const identities=Object.entries(D.factions).filter(([id])=>id!=='NEUTRAL');
    return shell(`${screenHead('LABORATOIRE TACTIQUE','Constructeur de decks','30 cartes, trois exemplaires maximum. Votre faction et les cartes Neutres définissent l’identité du deck.',`<button class="btn" data-action="new-deck">＋ Nouveau deck</button><button class="btn secondary" data-action="set-active-deck" ${check.valid?'':'disabled'}>Activer</button>`)}
      <section class="panel pad" aria-label="Decks de structure et remélange" style="margin-bottom:16px">
        <div class="eyebrow">${(D.expansionDecks||[]).length} DECKS PRÉCONSTRUITS • 30 JOUABLES + RÉSERVE 15 / 20 / 45</div>
        <div class="row" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:10px">
          <label class="field" style="flex:2;min-width:190px">
            <select id="expansion-deck-preset" aria-label="Choisir un deck préconstruit">
              ${Object.entries(D.factions).filter(([id])=>id!=='NEUTRAL').map(([id,f])=>`<optgroup label="${esc(f.name)}">${(D.expansionDecks||[]).filter(p=>p.faction===id).map(p=>`<option value="${esc(p.id)}">${p.category?'['+p.category+'] ':''}${esc(p.name)}${p.focus?' • '+p.focus:''} (${p.boxCount||45} cartes)</option>`).join('')}</optgroup>`).join('')}
            </select>
          </label>
          <button class="btn secondary" data-action="import-expansion-deck">Ajouter le deck + réserve</button>
          <button class="btn" data-action="remix-expansion-deck">Remélanger dans un nouveau deck</button>
        </div>
        <p class="subtle" style="font-size:12px;margin-top:8px">Les Starter, Structure et Ligue incluent 15 alternatives, les decks spéciaux 20 et les kits de construction 45. Les anciennes listes ne sont jamais supprimées. Limite : ${MAX_SAVED_DECKS} decks sauvegardés. Les listes ne sont jamais remplacées par un remélange.</p>
      </section>
      <div class="deck-layout"><aside class="panel pad deck-sidebar" aria-label="Sélection des decks"><div class="eyebrow">MES DECKS</div><div class="deck-tabs" style="margin-top:12px">${Store.data.decks.map(d=>`<button class="deck-tab ${d.id===deck?.id?'active':''}" data-action="select-deck" data-id="${d.id}"><b>${d.id===Store.data.activeDeckId?'● ':''}${esc(d.name)}</b><span>${deckIdentity(d).symbol} ${esc(deckIdentity(d).name)} • ${deckTotal(d)}/30</span></button>`).join('')||'<p class="subtle">Aucun deck.</p>'}</div>
      ${deck?`<label class="field identity-select">Identité<select data-action="deck-identity" aria-label="Identité du deck">${identity.id==='MIXED'?'<option value="MIXED">Ancienne coalition — à convertir</option>':''}${identities.map(([id,f])=>`<option value="${id}" ${deck.faction===id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label><button class="btn small block" style="margin-top:12px" data-action="rename-deck">Renommer</button><button class="btn small block" style="margin-top:7px" data-action="auto-fill-deck">Compléter automatiquement</button>`:''}</aside>
      <aside class="panel pad deck-list-panel" aria-label="Contenu du deck"><div class="eyebrow">LISTE DU DECK</div><p class="identity-note" style="--identity:${identity.accent}">${identity.symbol} ${esc(identity.name)} ${identity.id==='MIXED'?'— choisissez une identité pour jouer':identity.id==='HYBRID'?`+ Neutres • ${hybridSupportCount(deck)}/6 soutiens biologiques (Humains/Xéno, unités de coût ≤2, non synthétiques)`:'+ Neutres'}</p><div class="deck-list">${deckRows||'<p class="subtle">Ajoutez des cartes depuis le catalogue.</p>'}</div></aside>
      <section class="deck-catalog"><div class="panel pad" style="margin-bottom:14px"><div class="deck-summary"><div><div class="eyebrow">${deck?esc(deck.name):'SÉLECTION'}</div><div class="deck-total ${check.valid?'':'invalid'}">${check.total||0}<small>/30</small></div></div><div style="text-align:right"><b style="color:${check.valid?'var(--good)':'var(--danger)'}">${check.valid?'Deck valide':'Deck à corriger'}</b><div class="subtle" style="font-size:12px;max-width:260px">${check.valid?'Prêt pour le duel.':esc(check.errors[0]||'Ajoutez des cartes.')}</div></div></div><div class="progress"><i style="width:${Math.min(100,(check.total||0)/30*100)}%"></i></div></div>
      ${deck&&review?`<section class="panel pad" style="margin-bottom:14px" aria-label="Analyse tactique du deck">
        <div class="eyebrow">DIAGNOSTIC DE COMPOSITION</div>
        <div class="card-keywords" style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0">${classCounts}</div>
        <p class="subtle">Courbe énergétique : ${review.curve.low} cartes à 1–2 • ${review.curve.mid} à 3–4 • ${review.curve.high} à 5+. Pilotes : ${review.pilots} / Véhicules : ${review.vehicles}.</p>
        <p class="source-note">${esc(review.advice)}</p>
        ${review.asymmetric?.length?'<p class="source-note">'+review.asymmetric.map(esc).join(' • ')+'</p>':''}
      </section>`:''}
      ${filtersHTML(state.deckFilters,'deck',false)}<div class="card-grid">${visible.map(c=>`<div class="card-wrap">${cardHTML(c)}<div class="deck-card-actions"><span>${Store.owned(c.id)} possédée(s) • ${deck?.cards?.[c.id]||0} dans le deck</span><button class="btn small" aria-label="Voir ${esc(c.name)}" data-action="view-card" data-card-id="${c.id}">⌕</button><button class="btn small" aria-label="Ajouter ${esc(c.name)}" data-action="deck-add" data-card-id="${c.id}" ${!canAddByIdentity(c,deck)||deckTotal(deck)>=30||(deck.cards[c.id]||0)>=Math.min(3,Store.owned(c.id))?'disabled':''}>＋</button></div></div>`).join('')||'<p class="subtle">Aucune carte possédée compatible avec ces filtres.</p>'}</div>${list.length>visible.length?`<div class="load-more"><button class="btn secondary" data-action="more-cards" data-scope="deck">Afficher 40 cartes de plus (${visible.length}/${list.length})</button></div>`:''}</section></div>`,true);
  }

  function renderCampaign(){const p=Store.data.profile,deck=Store.deck(),valid=deck&&validatePlayableDeck(deck).valid;return shell(`${screenHead('DOSSIER AVP','Campagne : Directive Chimère','Huit opérations parcourent Alien, Predator et AVP. Les victoires débloquent des boosters et la série de prototypes séparée du canon.',`<button class="btn ghost" data-action="nav" data-screen="archive">◎ Contexte des sources</button>`)}<div class="mission-grid">${D.campaign.map(m=>{const locked=m.id>p.completedMissions+1,done=m.id<=p.completedMissions;return `<article class="panel mission ${locked?'locked':''}">${sceneArt('campaign-'+m.id,'mission-art')}<span class="mission-num">0${m.id}</span><div class="sub">${esc(m.subtitle)}</div><h2>${esc(m.name)}</h2><div class="faction-pips">${m.factions.map(id=>{const f=faction(id);return `<span class="faction-pip" style="--pip:${f.accent}" title="${f.name}">${f.symbol}</span>`}).join('')}</div><p>${esc(m.description)}</p><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span class="mission-reward">◈ ${U.format(done?Math.round(m.reward*.35):m.reward)} • ${done?'Récompense de replay':`Booster ${D.boosters.find(b=>b.id===m.pack)?.set}`}</span><button class="btn ${done?'ghost':'primary'} small" data-action="start-mission" data-id="${m.id}" ${locked||!valid?'disabled':''}>${locked?'Verrouillée':done?'Rejouer':'Déployer'}</button></div>${done?'<span class="complete-stamp">OPÉRATION VALIDÉE</span>':''}</article>`}).join('')}</div>${!valid?'<div class="panel pad" style="margin-top:16px;border-color:rgba(255,101,125,.25)"><b style="color:var(--danger)">Deck actif invalide.</b> <span class="subtle">Corrigez-le dans le constructeur avant de lancer une mission.</span></div>':''}`,true);}

  function asymmetricRulesHTML(){
    if(!D.asymmetricEdition)return '';
    const entries=[
      ['HUMAINS','Armer, charger, tirer','Équipez un personnage ou un véhicule compatible avec une arme, puis attachez ses munitions. Chaque attaque consomme les charges indiquées, y compris une riposte. Un chargeur vide rejoint la défausse et libère sa place. Une arme déchargée conserve uniquement l’attaque de base du porteur. Les techniques et modules exigent la famille d’arme indiquée.'],
      ['RUCHE','Éclore, fusionner, évoluer','Posez un Œuf, puis sacrifiez-le pour un Facehugger compatible. Une Fusion parasitaire associe ce Facehugger à un Hôte du bon type. La carte résultat doit se trouver dans votre main ou votre deck. Les évolutions demandent ensuite le stade précédent, la lignée prévue et la biomasse indiquée. Un hôte synthétique est incompatible.'],
      ['YAUTJA','Chasser, charger, gagner de l’honneur','Les armes plasma puisent dans une réserve collective limitée à 12. Les trophées acquis en combat ouvrent les rites de chasse. Les cartes d’honneur dépensent la quantité indiquée pour renforcer les chasseurs, piocher ou révéler une cible. Les réserves de plasma, de biomasse et d’honneur sont sauvegardées avec le duel.']
    ];
    return '<section class="panel source-card span-12" aria-label="Règles des trois doctrines"><div class="eyebrow">DOCTRINES DE FACTION</div><div class="glossary">'+entries.map(([faction,title,text])=>'<div class="glossary-row"><b>'+faction+' — '+title+'</b><span>'+text+'</span></div>').join('')+'</div></section>';
  }
  function renderAlienBaseUpdates(mode){
 const updates=window.AVP_ALIEN_BASE?.codex?.registryUpdates;
 if(!updates)return '<section class="panel source-card span-12"><p>Aucune nouvelle référence dans cette version.</p></section>';
 const subjects=mode==='apex',all=subjects?updates.newEntities:updates.works;
 const term=(state.codexFilters.query||'').trim().toLocaleLowerCase('fr');
 const matches=all.filter(x=>(subjects?[x.id,x.name,x.sourceWork,x.category]:[x.id,x.title,x.medium,x.continuity,x.publicationStatus]).join(' ').toLocaleLowerCase('fr').includes(term))
   .sort((a,b)=>(subjects?a.name:a.title).localeCompare(subjects?b.name:b.title,'fr'));
 const list=matches.slice(0,state.ui.codexLimit);
 const notes=subjects?`<div class="alien-codex-cautions"><b>Réserves biologiques :</b> ${updates.biologyNotes.map(x=>`<span title="${esc(x.issue)}">${esc(x.subject)}</span>`).join(' • ')}</div>`:'';
 return `<section class="panel source-card span-12 alien-codex alien-codex-updates" aria-label="${subjects?'Nouvelles identités Apex':'Œuvres documentaires Predator'}">
  <div class="eyebrow">ALIEN_BASE • RÉFÉRENCES INTÉGRÉES • RECHERCHE EN COURS</div>
  <h2>${subjects?'Nouvelles identités Yautja / Apex':'Œuvres et continuités à vérifier'} — ${all.length} dossiers</h2>
  ${renderAlienBaseModeTabs()}
  <p class="subtle">Le registre partagé de cette version contient ${window.AVP_ALIEN_BASE.registry.v2} identités. Les références de ces dossiers sont intégrées au registre ; leur contenu documentaire et leur fidélité 1:1 restent à vérifier individuellement.</p>
  <div class="alien-codex-controls"><label class="field">⌕ <input data-codex-filter="query" aria-label="Rechercher une nouveauté documentaire" value="${esc(state.codexFilters.query)}" placeholder="${subjects?'Yautja, vaisseau, équipement…':'Film, comic, jeu, continuité…'}"></label></div>
  <p class="subtle alien-codex-count" role="status">${matches.length} / ${all.length} dossiers de recherche • Aucun nouveau déblocage dans le TCG</p>
  <div class="alien-codex-list">
   ${list.map(x=>`<article class="alien-codex-record"><div class="eyebrow">${esc(subjects?x.category:x.medium)} • À CONFIRMER</div>
    <h3>${esc(subjects?x.name:x.title)}</h3>
    <p>${esc(subjects?x.sourceWork:(x.continuity+' • '+x.year))}</p>
    <p class="subtle">${esc(subjects?x.reviewStatus:x.publicationStatus)}</p>
    <div class="alien-codex-actions"><button class="btn secondary small" data-action="codex-update-detail" data-update-mode="${mode}" data-update-id="${esc(x.id)}">Voir la référence</button>
     ${subjects&&x.linkedCardIds.length?`<span>${x.linkedCardIds.length} rapprochement(s) TCG non certifié(s)</span>`:''}
    </div></article>`).join('')||'<p class="subtle">Aucune référence correspondante.</p>'}
  </div>
  ${matches.length>list.length?`<div class="load-more"><button class="btn secondary" data-action="codex-more">Afficher ${Math.min(18,matches.length-list.length)} dossiers supplémentaires (${list.length}/${matches.length})</button></div>`:''}
  ${notes}
  <p class="subtle alien-codex-disclaimer">L’intégration documentaire de ces références ne débloque aucune carte et ne certifie aucune image ni mesure canonique.</p>
 </section>`;
}

  function showAlienBaseUpdateDetail(mode,id){
 const u=window.AVP_ALIEN_BASE?.codex?.registryUpdates;
 if(!u||!['apex','media'].includes(mode))return;
 const subject=mode==='apex',entry=(subject?u.newEntities:u.works).find(x=>x.id===id);
 if(!entry)return;
 const links=subject?entry.linkedCardIds.filter(cardId=>CARD.has(cardId)):[];
 modal(`Dossier de recherche : ${esc(subject?entry.name:entry.title)}`,`<div class="alien-codex-detail">
  <div class="eyebrow">DOCUMENT DE RECHERCHE • NON JOUABLE • EN ATTENTE DE VALIDATION</div>
  <h2>${esc(subject?entry.name:entry.title)}</h2>
  <p><b>Identifiant :</b> ${esc(entry.id)}</p>
  <p><b>${subject?'Œuvre de rattachement':'Continuïté'} :</b> ${esc(subject?entry.sourceWork:entry.continuity)}</p>
  <p><b>${subject?'Catégorie':'Support'} :</b> ${esc(subject?entry.category:entry.medium)}</p>
  <p class="source-note"><b>Statut :</b> ${esc(entry.reviewStatus)}<br><b>Fidélité visuelle 1:1 :</b> non certifiée<br><b>Jouable dans ce TCG :</b> non</p>
  ${links.length?`<h3>Cartes rapprochées à titre indicatif</h3><div class="alien-codex-card-links">${links.map(cardId=>`<button class="btn ghost small" data-action="view-card" data-card-id="${esc(cardId)}">${esc(CARD.get(cardId).name)}</button>`).join('')}</div>`:''}
  <p class="subtle">Cet identifiant figure dans le registre partagé Alien_base. Son rapprochement documentaire reste à vérifier avant toute utilisation comme référence canonique ou nouveau contenu jouable.</p>
 </div>`);
}

  function pendingAlienBaseLinks(cardId){
 const updates=window.AVP_ALIEN_BASE?.codex?.registryUpdates;
 if(!updates)return '';
 const candidates=updates.newEntities.filter(x=>x.linkedCardIds.includes(cardId));
 const aliases=updates.aliases.filter(x=>x.linkedCardIds.includes(cardId));
 if(!candidates.length&&!aliases.length)return '';
 const entries=[
  ...candidates.map(x=>`${esc(x.name)} (${esc(x.sourceWork)})`),
  ...aliases.map(x=>`${esc(x.localId)} — ${esc(x.entityId)}`)
 ];
 return `<div class="source-note"><b>Références documentaires Alien_base intégrées :</b> ${entries.join(' • ')}<br><small>Les rapprochements restent provisoires et ne modifient ni cette carte, ni ses statistiques, ni sa continuité.</small></div>`;
}

  function renderAlienBaseModeTabs(){
 const modes=[['reference','Sources historiques','68'],['weapons','Armes à examiner','200'],['leads','Sujets à approfondir','16'],['apex','Yautja / Apex','20'],['media','Œuvres Predator','29']];
 return `<div class="alien-codex-tabs" aria-label="Type de dossier">${modes.map(([id,label,count])=>`<button class="btn ${state.codexFilters.mode===id?'secondary':'ghost'} small" data-action="codex-mode" data-codex-mode="${id}" aria-pressed="${state.codexFilters.mode===id}">${label} · ${count}</button>`).join('')}</div>`;
}

  function renderAlienResearch(mode){
 const codex=window.AVP_ALIEN_BASE?.codex;
 const all=mode==='weapons'?(codex?.researchWeapons||[]):(codex?.researchLeads||[]);
 const isWeapon=mode==='weapons';
 const q=(state.codexFilters.query||'').trim().toLocaleLowerCase('fr');
 const filtered=all.filter(x=>[x.name,x.id,x.work,isWeapon?x.family:x.category,isWeapon?x.projectStatus:x.note].join(' ').toLocaleLowerCase('fr').includes(q));
 const shown=filtered.slice(0,state.ui.codexLimit);
 return `<section class="panel source-card span-12 alien-codex" aria-label="${isWeapon?'Recherche armes':'Recherche complémentaire'}">
  <div class="eyebrow">ALIEN_BASE • REGISTRE DE RECHERCHE</div>
  <h2>${isWeapon?'Dossiers d’armurerie':'Sujets à approfondir'} — ${all.length} entrées</h2>
  ${renderAlienBaseModeTabs()}
  <p class="subtle">Ces contenus sont des pistes de recherche : aucun modèle n'est certifié visuellement 1:1 et aucune fiche n'est jouable ou achetable dans le TCG. Les propriétés de combat des autres jeux ne sont pas importées.</p>
  <div class="alien-codex-controls"><label class="field">⌕ <input data-codex-filter="query" value="${esc(state.codexFilters.query)}" placeholder="${isWeapon?'Rechercher une arme ou une œuvre…':'Rechercher un personnage, une société…'}" aria-label="Rechercher dans les recherches Alien_base"></label></div>
  <p class="subtle alien-codex-count" role="status">${filtered.length} / ${all.length} entrées • Vérification documentaire requise</p>
  <div class="alien-codex-list">
   ${shown.map(x=>`<article class="alien-codex-record"><div class="eyebrow">${esc(isWeapon?x.family:x.category)} • NON JOUABLE</div><h3>${esc(x.name)}</h3><p>${esc(x.work)}</p><p class="subtle">${esc(isWeapon?x.projectStatus:x.note)}</p><div class="alien-codex-actions"><button class="btn secondary small" data-action="codex-research-detail" data-codex-id="${esc(x.id)}" data-codex-kind="${mode}">Examiner la référence</button></div></article>`).join('')||'<p class="subtle">Aucune référence ne correspond à cette recherche.</p>'}
  </div>
  ${filtered.length>shown.length?`<div class="load-more"><button class="btn secondary" data-action="codex-more">Afficher ${Math.min(18,filtered.length-shown.length)} références supplémentaires (${shown.length}/${filtered.length})</button></div>`:''}
  <p class="subtle alien-codex-disclaimer">Statut : inventaire documentaire uniquement. Les fiches canoniques du film ou d'un jeu doivent être vérifiées modèle par modèle avant toute intégration dans une extension jouable.</p>
 </section>`;
}

  function showAlienResearchDetail(mode,id){
 const codex=window.AVP_ALIEN_BASE?.codex;
 const isWeapon=mode==='weapons';
 const entry=(isWeapon?codex?.researchWeapons:codex?.researchLeads)?.find(x=>x.id===id);
 if(!entry)return;
 const status=isWeapon?entry.projectStatus:entry.researchStatus;
 const details=isWeapon
  ?`<p><b>Famille :</b> ${esc(entry.family)}</p><p><b>Support :</b> ${esc(entry.medium)}</p><p><b>Confiance interne :</b> ${esc(entry.researchConfidence)}</p>`
  :`<p><b>Catégorie :</b> ${esc(entry.category)}</p><p>${esc(entry.note)}</p>`;
 modal(`Dossier non certifié : ${esc(entry.name)}`,`<div class="alien-codex-detail">
   <div class="eyebrow">RECHERCHE • NON JOUABLE</div>
   <h2>${esc(entry.name)}</h2><p><b>Œuvre ou dossier :</b> ${esc(entry.work)}</p>
   ${details}<p class="source-note"><b>ID :</b> ${esc(entry.id)}<br><b>État :</b> ${esc(status)}<br><b>Admis dans le TCG :</b> Non</p>
   <p class="subtle">Une mention dans le catalogue ne prouve ni les dimensions, ni une apparence 1:1, ni l'admission d'une arme ou d'un organisme. La fiche doit être contrôlée avec sa source primaire.</p>
 </div>`);
}

  function renderAlienBaseCodex(){
 if(['apex','media'].includes(state.codexFilters.mode))return renderAlienBaseUpdates(state.codexFilters.mode);
 if(state.codexFilters.mode!=='reference')return renderAlienResearch(state.codexFilters.mode);
 const codex=window.AVP_ALIEN_BASE?.codex;
 const all=codex?.entries||[];
 if(!all.length)return '<section class="panel source-card span-12"><h2>Codex Alien_base indisponible</h2><p>Aucune fiche documentaire locale ne figure dans ce build.</p></section>';
 const filter=state.codexFilters;
 const types=[...new Set(all.map(x=>x.type))].sort();
 const q=filter.query.trim().toLocaleLowerCase('fr');
 const rows=all.filter(x=>
  (!q||[x.name,x.id,x.description,...x.sourceWorks].join(' ').toLocaleLowerCase('fr').includes(q)) &&
  (filter.type==='ALL'||x.type===filter.type) &&
  (filter.scope==='ALL'||x.scope===filter.scope)
 ).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
 const display=rows.slice(0,state.ui.codexLimit);
 const scopeNames={film:'Films',predator:'Predator',crossover:'Crossovers',expanded:'Jeux et univers étendus'};
 return `<section class="panel source-card span-12 alien-codex" aria-label="Codex documenté Alien_base">
  <div class="eyebrow">ARCHIVE CENTRALE • ALIEN_BASE</div>
  <h2>Codex de référence — ${all.length} dossiers</h2>
  ${renderAlienBaseModeTabs()}
  <p class="subtle">Catalogue historique v1 consultable hors ligne. Le registre partagé v2 indexe ${window.AVP_ALIEN_BASE.registry.v2} entités, dont ${window.AVP_ALIEN_BASE.registry.gameCards} cartes TCG. Une fiche de référence n'est pas une carte débloquée ni une image certifiée fidèle.</p>
  <div class="alien-codex-controls">
   <label class="field">⌕ <input data-codex-filter="query" value="${esc(filter.query)}" placeholder="Chercher un organisme, une arme, un lieu…" aria-label="Rechercher dans le codex"></label>
   <label class="field"><select data-codex-filter="type" aria-label="Filtrer par catégorie"><option value="ALL">Toutes les catégories</option>${types.map(type=>`<option value="${esc(type)}" ${filter.type===type?'selected':''}>${esc(type)}</option>`).join('')}</select></label>
   <label class="field"><select data-codex-filter="scope" aria-label="Filtrer par continuité"><option value="ALL">Toutes les continuités</option>${Object.entries(scopeNames).map(([id,name])=>`<option value="${id}" ${filter.scope===id?'selected':''}>${name}</option>`).join('')}</select></label>
  </div>
  <p class="subtle alien-codex-count" role="status">${rows.length} / ${all.length} dossiers • Source déclarée, vérification individuelle requise</p>
  <div class="alien-codex-list">
   ${display.map(x=>`<article class="alien-codex-record"><div class="eyebrow">${esc(x.type)} • ${esc(scopeNames[x.scope]||x.scope)}</div><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><p class="subtle">${esc(x.sourceWorks.join(' • '))}</p><div class="alien-codex-actions"><button class="btn secondary small" data-action="codex-detail" data-codex-id="${esc(x.id)}">Consulter le dossier</button>${x.linkedCardIds.length?`<span>${x.linkedCardIds.length} carte(s) associée(s)</span>`:''}</div></article>`).join('')||'<p class="subtle">Aucun dossier ne correspond à ces critères.</p>'}
  </div>
  ${rows.length>display.length?`<div class="load-more"><button class="btn secondary" data-action="codex-more">Afficher ${Math.min(18,rows.length-display.length)} dossiers supplémentaires (${display.length}/${rows.length})</button></div>`:''}
  <p class="subtle alien-codex-disclaimer">Les ${window.AVP_ALIEN_BASE.registry.v2} identités v2 comprennent aussi des adaptations et contenus de projets. Seul ce sous-ensemble documentaire v1 est publié ici. Les mesures de combat restent propres au TCG.</p>
 </section>`;
}

  function showAlienBaseCodex(id){
 const entry=window.AVP_ALIEN_BASE?.codex?.entries?.find(x=>x.id===id);
 if(!entry)return;
 const safe=entry.linkedCardIds.filter(cardId=>CARD.has(cardId));
 const sources=entry.sourceWorks.map(x=>`<li>${esc(x)}</li>`).join('');
 modal(`Codex : ${esc(entry.name)}`,`<div class="alien-codex-detail">
 <div class="eyebrow">${esc(entry.type)} • ${esc(entry.scope)}</div>
 <h2>${esc(entry.name)}</h2><p>${esc(entry.description)}</p>
 <p class="source-note"><b>Identifiant historique :</b> ${esc(entry.id)}<br><b>Revue :</b> ${esc(entry.review)}</p>
 <h3>Œuvres de référence</h3><ul>${sources}</ul>
 ${safe.length?`<h3>Cartes associées (relation de recherche)</h3><div class="alien-codex-card-links">${safe.map(cardId=>`<button class="btn ghost small" data-action="view-card" data-card-id="${esc(cardId)}">${esc(CARD.get(cardId).name)}</button>`).join('')}</div>`:''}
 <p class="subtle">Cette notice de recherche ne garantit pas des caractéristiques physiques ou une silhouette 1:1. Les associations sont indicatives et les statistiques ne proviennent pas du référentiel.</p>
 </div>`);
}


  function renderArchive(){const sm=D.sourceManifest,counts=sm.alien.notableCounts;return shell(`${screenHead('ENCYCLOPÉDIE JOUABLE','Archive & règles','Chaque carte conserve un lien de provenance interne vers le classeur et l’onglet ayant inspiré sa traduction de gameplay.',`<button class="btn secondary" data-action="export-catalog">⇩ Exporter le catalogue JSON</button>`)}<div class="archive-grid"><section class="panel source-card span-7"><div class="eyebrow">SOURCE ALIEN / AVP</div><h2>${esc(sm.alien.file)}</h2><p>${esc(sm.alien.role)}</p><div class="source-counts">${[['Véhicules',counts.vehicles],['Humains',counts.detailedHumans],['Lieux',counts.locations],['Rituels',counts.rituals],['Visions',counts.visions],['Faune',counts.fauna],['Flore',counts.flora],['Cartes du jeu',D.cards.length]].map(([n,v])=>`<div class="source-count"><b>${v}</b><span>${n}</span></div>`).join('')}</div></section><section class="panel source-card span-5"><div class="eyebrow">SOURCE PREDATOR</div><h2>${esc(sm.predator.file)}</h2><p>${esc(sm.predator.role)}</p><p class="source-note">Les cartes PX00 sont visuellement et mécaniquement séparées du pool principal afin de ne pas présenter un élément coupé ou annulé comme canon écran.</p></section>
    <section class="panel source-card span-6"><div class="eyebrow">RÈGLES ESSENTIELLES</div><h2>${D.rules.deckSize} cartes • ${D.rules.startingLife} PV • ${D.rules.lanes} voies</h2><div class="quick-list"><div class="quick-row"><div class="quick-icon">1</div><div><b>Début</b><span>5 cartes pour le premier joueur, 6 pour le second; l’énergie maximale augmente de 1 par tour.</span></div></div><div class="quick-row"><div class="quick-icon">2</div><div><b>Unités</b><span>Une unité par voie; combat simultané lorsque deux unités s’affrontent.</span></div></div><div class="quick-row"><div class="quick-icon">3</div><div><b>Cartes de soutien</b><span>Actions instantanées, Armes (1 nouvelle par unité), Équipements, Véhicules pilotés et un Lieu par joueur.</span></div></div><div class="quick-row"><div class="quick-icon">4</div><div><b>Victoire</b><span>Attaque directe dans une voie libre et réduisez les PV adverses à zéro.</span></div></div></div></section><section class="panel source-card span-6"><div class="eyebrow">RARETÉS DE COLLECTION</div><table class="rarity-table"><thead><tr><th>Rareté</th><th>Code</th><th>Valeur</th><th>Booster</th></tr></thead><tbody>${Object.entries(D.rarities).map(([id,r])=>`<tr><td><i class="rarity-dot" style="--rc:${RARITY_COLORS[id]}"></i>${r.name}</td><td>${id}</td><td>${r.dust} poussières</td><td>${r.odds}</td></tr>`).join('')}</tbody></table></section>
    ${asymmetricRulesHTML()}<section class="panel source-card span-12"><div class="eyebrow">MOTS-CLÉS</div><div class="glossary" style="margin-top:14px">${Object.entries(D.keywords).map(([k,v])=>`<div class="glossary-row"><b>${k}</b><span>${esc(v)}</span></div>`).join('')}</div></section><section class="panel source-card span-12"><div class="eyebrow">EXTENSIONS</div><div class="pack-grid" style="margin-top:14px">${Object.entries(D.sets).map(([id,s])=>`<div class="panel pad" style="border-color:color-mix(in srgb,${s.accent} 24%,transparent)"><b style="color:${s.accent}">${id} — ${esc(s.name)}</b><p>${esc(s.description)}</p><span class="subtle" style="font-size:10px">${D.cards.filter(c=>c.set===id).length} cartes</span></div>`).join('')}</div></section>${renderAlienBaseCodex()}</div>`,true);}

  function unitFlags(battle,u){const out=[];if(u.cloaked)out.push(['◌','Camouflage']);if(u.stunned>0)out.push(['⌁','Étourdi']);if(battle.has(u,'ARMOR')&&!u.armorUsed)out.push(['⬡','Armure']);if(u.equipment.length)out.push([`⚙${u.equipment.length}`,'Équipement']);
    const card=battle.card(u.cardId);
    if(card?.crewRequired)out.push([battle.hasCrew(u.owner,card,u)?'◈':'⚠',battle.hasCrew(u.owner,card,u)?'Véhicule avec pilote':'Véhicule sans pilote (attaque impossible)']);
    if((u.ammoPacks||[]).length){
      const total=u.ammoPacks.reduce((n,p)=>n+p.remaining,0);
      out.push(['▰'+total,'Munitions : '+total+' charge(s)']);
    }
    const weapon=u.equipment.map(id=>battle.card(id)).find(c=>c?.slot==='WEAPON'&&(c.ammoType||c.plasmaPerAttack));
    if(weapon){
      const available=weapon.ammoType?(u.ammoPacks||[]).filter(p=>p.ammoType===weapon.ammoType).reduce((n,p)=>n+p.remaining,0):battle.side(u.owner).plasma||0;
      const required=weapon.ammoType?weapon.ammoPerAttack||1:weapon.plasmaPerAttack;
      if(available<required)out.push(['VIDE',weapon.name+' : recharge nécessaire, attaque de base seulement']);
    }
    if(card?.cardClass==='OEUF')out.push(['◉','Œuf : sacrifice et éclosion']);
    if(card?.cardClass==='HOTE')out.push(['☣','Hôte : fusion parasitaire']);
    if(battle.has(u,'PIERCING'))out.push(['✴','Perforation : ignore l’armure']);return out.map(([x,t])=>`<span class="unit-flag" title="${t}">${x}</span>`).join('');}
  function battleUnitHTML(battle,sideIndex,lane,u,pending){
    if(!u)return '<span class="slot-empty">Voie libre</span>';const c=CARD.get(u.cardId),max=battle.unitMaxHealth(sideIndex,u),atk=battle.unitAttack(sideIndex,u);const canAttack=sideIndex===0&&battle.legalAttacks(0,lane).length>0&&!state.battleContext?.aiBusy&&!pending;
    return `<div class="battle-unit" data-unit-side="${sideIndex}" data-unit-lane="${lane}"><div class="unit-card-surface">${cardHTML({...c,attack:atk,health:max},{mini:true,foil:RANK[c.rarity]>=4})}<span class="unit-health">${U.format(u.currentHealth)}/${U.format(max)}</span><div class="unit-flags">${unitFlags(battle,u)}</div>${canAttack?`<button class="attack-btn" data-action="battle-attack" data-lane="${lane}">⚔ ATTAQUER</button>`:''}</div>${!pending?`<button class="unit-detail-btn" data-action="battle-inspect" data-side="${sideIndex}" data-lane="${lane}" aria-label="Consulter les règles de ${esc(c.name)}">Règles ⓘ</button>`:''}</div>`;
  }
  function showBattleUnitDetail(sideIndex,lane){
    if(![0,1].includes(sideIndex)||!Number.isInteger(lane)||lane<0||lane>2)return;
    const b=state.battleContext?.battle,u=b?.side(sideIndex).board[lane];if(!u)return;
    const c=CARD.get(u.cardId),attack=b.unitAttack(sideIndex,u),maxHealth=b.unitMaxHealth(sideIndex,u),weapon=b.combatWeaponState?.(sideIndex,u);
    const status=[u.ready?'Unité prête':'Unité non prête',u.cloaked?'Camouflée':'',u.stunned>0?'Étourdie':'',
      u.equipment.length?`${u.equipment.length} équipement(s)`:'',
      c.crewRequired?(b.hasCrew(sideIndex,c,u)?'Avec pilote':'Sans pilote'):'',
      b.has(u,'PIERCING')?'Perforation':'',
      (u.ammoPacks||[]).length?u.ammoPacks.map(p=>p.ammoType+' : '+p.remaining+' charge(s)').join(', '):'',
      c.evolutionStage?'Stade : '+c.evolutionStage:''].filter(Boolean).join(' • ');
    const weaponInfo=weapon?.weapon?`<section class="weapon-status" aria-label="État de l’armement"><b>${esc(weapon.weapon.name)}</b><p>${weapon.mode==='MELEE'?'Cet armement ne consomme pas de charges dans cette édition.':weapon.ready?`${weapon.available} charge(s) disponibles. Coût : ${weapon.required} par attaque ou riposte.`:`${esc(weapon.reason)} L’attaque affichée utilise uniquement les capacités de base et les bonus encore actifs.`}</p></section>`:'';
    const equipment=u.equipment.length?`<h3>Équipements attachés</h3><div class="glossary">${u.equipment.map(id=>{
      const item=CARD.get(id),moduleState=item.cardClass==='MODIFICATION'
        ?(weapon?.activeMods.some(mod=>mod.id===id)?'Bonus d’attaque actif. ':'Bonus d’attaque inactif. '):'';
      return `<div class="glossary-row"><b>${esc(item.name)}</b><span>${esc(moduleState+item.text)}</span></div>`;
    }).join('')}</div>`:'';
    modal(`Règles : ${esc(c.name)}`,`<div class="card-detail"><div class="card-wrap">${cardHTML({...c,attack,health:maxHealth})}</div><div class="detail-copy"><div class="eyebrow">${sideIndex===0?'VOTRE UNITÉ':'UNITÉ ADVERSE'} • VOIE ${lane+1}</div><h2>${esc(c.name)}</h2><p class="unit-rule-copy">${esc(c.text)}</p><div class="detail-stats"><div class="detail-stat"><b>${U.format(attack)}</b><span>Attaque actuelle</span></div><div class="detail-stat"><b>${U.format(u.currentHealth)}/${U.format(maxHealth)}</b><span>Points de vie</span></div><div class="detail-stat"><b>${c.cost}</b><span>Énergie</span></div></div><p class="source-note">${esc(status)}</p>${weaponInfo}${cardMechanicsHTML(c)}${equipment}<div class="glossary">${Array.from(b.allKeywords(u)).map(k=>`<div class="glossary-row"><b>${esc(k)}</b><span>${esc(D.keywords[k]||'Consultez l’archive des règles.')}</span></div>`).join('')}</div><p class="subtle">Consultation de l’état actuel : fermer cette fenêtre ne joue aucune action.</p></div></div>`);
  }

  function renderBattle(){
    const ctx=state.battleContext;if(!ctx)return renderHome();const b=ctx.battle,s=b.state,me=s.sides[0],ai=s.sides[1],pending=state.ui.pending;
    const targetHas=(kind,lane=null)=>pending?.targets?.some(t=>t.kind===kind&&(lane===null||(t.lane??-1)===lane));
    const commander=(side,idx,enemy=false)=>`<div class="commander ${enemy?'enemy':''} ${enemy&&targetHas('HERO')?'valid':''}" ${enemy&&targetHas('HERO')?'data-action="battle-target-hero" aria-label="Attaquer le commandant adverse"':''}><div class="avatar">${enemy?'☣':'✦'}</div><div class="commander-name"><b>${esc(side.name)}</b><span>${enemy?'IA tactique':esc(Store.data.profile.name)} • Tour ${s.round}</span></div><div class="life-wrap"><div class="life-label"><span>INTÉGRITÉ</span><b>${U.format(side.life)} / ${U.format(side.maxLife)}</b></div><div class="life-bar"><i style="width:${Math.max(0,side.life/side.maxLife*100)}%"></i></div></div><div class="energy-orbs" title="${side.energy}/${side.maxEnergy} énergie">${Array.from({length:10},(_,i)=>`<i class="orb ${i<side.energy?'full':''}"></i>`).join('')}</div></div>`;
    const lanes=[0,1,2].map(lane=>{const enemyValid=targetHas('ENEMY_UNIT',lane)||targetHas('UNIT',lane),friendValid=targetHas('FRIENDLY_UNIT',lane)||targetHas('FRIENDLY_LANE',lane)||targetHas('HATCH_EGG',lane);return `<div class="lane"><div class="unit-slot enemy ${enemyValid?'valid':''}" ${enemyValid?`data-action="battle-target" data-kind="${targetHas('UNIT',lane)?'UNIT':'ENEMY_UNIT'}" data-lane="${lane}" aria-label="Cibler la voie ${lane+1}"`:''}>${battleUnitHTML(b,1,lane,ai.board[lane],pending)}</div><div class="lane-center">VOIE 0${lane+1}</div><div class="unit-slot ${friendValid?'valid':''}" ${friendValid?`data-action="battle-target" data-kind="${targetHas('HATCH_EGG',lane)?'HATCH_EGG':targetHas('FRIENDLY_LANE',lane)?'FRIENDLY_LANE':'FRIENDLY_UNIT'}" data-lane="${lane}" aria-label="Cibler votre voie ${lane+1}"`:''}>${battleUnitHTML(b,0,lane,me.board[lane],pending)}</div></div>`}).join('');
    const hand=me.hand.map((id,i)=>{const c=CARD.get(id),check=b.canPlay(0,i),selected=pending?.mode==='play'&&pending.handIndex===i;return `<div class="hand-card ${check.ok?'':'unplayable'} ${selected?'selected':''}" data-action="battle-hand" data-index="${i}" aria-label="${esc(c.name)}, ${c.cost} énergie${check.ok?'':', '+esc(check.reason)}" aria-disabled="${!check.ok}" title="${check.ok?'Jouer la carte':esc(check.reason)}">${cardHTML(c,{mini:true,foil:RANK[c.rarity]>=4})}</div>`}).join('');
    const pendingText=pending?(pending.mode==='play'?`Choisissez une cible pour ${CARD.get(pending.cardId).name}.`:'Choisissez la cible de l’attaque.'):(ctx.aiBusy?'Directive adverse en cours…':s.active===0?'Jouez une carte ou attaquez, puis terminez le tour.':'Tour adverse.');
    return shell(`<h1 class="battle-title">Duel tactique <span>— Tour ${s.round}</span></h1><a class="hand-jump" href="#battle-hand">Votre main (${me.hand.length}) ↓</a><div class="battle-shell"><section class="battle-main">${commander(ai,1,true)}<div class="enemy-hand">${ai.hand.map(()=>'<i class="hand-back"></i>').join('')}</div><div class="location-strip"><span class="location-chip">Lieu adverse : <b>${ai.location?esc(CARD.get(ai.location.cardId).name):'Aucun'}</b></span></div><div class="battle-board">${sceneArt('battle-board','battle-board-backdrop',true,true)}${lanes}</div><div class="location-strip"><span class="location-chip">Votre lieu : <b>${me.location?esc(CARD.get(me.location.cardId).name):'Aucun'}</b></span></div>${commander(me,0,false)}<div class="battle-controls"><span class="pending-text">${esc(pendingText)}</span>${pending?'<button class="btn small" data-action="battle-cancel">Annuler</button>':''}<button class="btn small" data-action="pause-battle">Sauvegarder & quitter</button><button class="btn danger small" data-action="battle-surrender">Abandonner</button><button class="btn primary" data-action="battle-end" ${s.active===0&&!ctx.aiBusy&&s.winner===null?'':'disabled'}>Terminer le tour</button></div><div class="player-hand" id="battle-hand" role="region" aria-label="Votre main" tabindex="0">${hand||'<span class="subtle">Main vide</span>'}</div></section><aside class="battle-side"><div class="panel battle-info"><h2>ÉTAT DU DUEL</h2><div class="battle-stats"><div class="battle-stat"><b>${me.energy}/${me.maxEnergy}</b><span>ÉNERGIE</span></div><div class="battle-stat"><b>${me.trophies}</b><span>TROPHÉES</span></div><div class="battle-stat"><b>${me.deck.length}</b><span>DECK</span></div><div class="battle-stat"><b>${me.discard.length}</b><span>DÉFAUSSE</span></div>
<div class="battle-stat"><b>${me.biomass||0}/12</b><span>BIOMASSE</span></div>
<div class="battle-stat"><b>${me.plasma||0}/12</b><span>PLASMA</span></div>
<div class="battle-stat"><b>${me.honor||0}/12</b><span>HONNEUR</span></div></div></div><div class="panel battle-info" aria-label="Ressources adverses"><h2>RESSOURCES ADVERSES</h2><div class="battle-stats"><div class="battle-stat"><b>${ai.biomass||0}/12</b><span>BIOMASSE</span></div><div class="battle-stat"><b>${ai.plasma||0}/12</b><span>PLASMA</span></div><div class="battle-stat"><b>${ai.honor||0}/12</b><span>HONNEUR</span></div><div class="battle-stat"><b>${ai.trophies}</b><span>TROPHÉES</span></div></div></div><div class="panel battle-info"><h2>JOURNAL TACTIQUE</h2><div class="battle-log" role="region" aria-label="Journal tactique" tabindex="0">${s.log.map(l=>`<div class="log-row ${l.tone}">${esc(l.text)}</div>`).join('')}</div></div><div class="panel battle-info"><h2>RAPPEL</h2><p class="subtle" style="font-size:10px;line-height:1.5">Cliquez une carte de votre main, puis une voie surlignée. Pour attaquer, cliquez « Attaquer » sous une unité prête puis choisissez la cible. Une arme marquée VIDE a besoin de munitions ou de plasma avant de fournir son bonus.</p></div></aside></div>`,true).replace('<main class="screen wide"','<main class="screen wide battle-screen"');
  }

  // All dynamic screens share keyboard semantics and stable focus restoration.
  function focusToken(element=document.activeElement){
    if(!element||!element.dataset)return null;
    return {id:element.id||'',data:{...element.dataset},start:element.selectionStart,end:element.selectionEnd};
  }
  function restoreFocus(token,container=root){
    if(!token)return false;
    const keys=Object.keys(token.data||{});
    const element=Array.from(container.querySelectorAll('[data-action],[data-filter],[id]')).find(el=>token.id?el.id===token.id:keys.length&&keys.every(key=>el.dataset[key]===token.data[key]));
    if(!element||element.disabled)return false;
    element.focus({preventScroll:true});if(typeof token.start==='number'&&element.setSelectionRange)element.setSelectionRange(token.start,token.end);return true;
  }
  function enhanceActions(container){
    for(const el of container.querySelectorAll('[data-action]')){
      if(el.dataset.action==='modal-backdrop'||el.matches('button,input,select,label,a'))continue;
      el.setAttribute('role','button');el.tabIndex=el.getAttribute('aria-disabled')==='true'?-1:0;
    }
    const labels={query:'Rechercher une carte',faction:'Filtrer par faction',type:'Filtrer par type',rarity:'Filtrer par rareté',set:'Filtrer par extension',owned:'Filtrer la possession',quantity:'Filtrer le nombre d’exemplaires',sort:'Trier les cartes'};
    for(const el of container.querySelectorAll('[data-filter]'))el.setAttribute('aria-label',labels[el.dataset.filter]||'Filtrer');
    for(const el of container.querySelectorAll('[data-action="nav"]'))if(el.dataset.screen===state.screen)el.setAttribute('aria-current','page');
    for(const el of container.querySelectorAll('[data-action="difficulty"],[data-action="enemy-faction"]'))el.setAttribute('aria-pressed',String(el.classList.contains('active')));
  }
  function render(){
    const focus=focusToken(),map={home:renderHome,play:renderPlay,collection:renderCollection,boosters:renderBoosters,decks:renderDecks,campaign:renderCampaign,archive:renderArchive,battle:renderBattle};
    root.innerHTML=(map[state.screen]||renderHome)();document.title=`${state.screen==='home'?'AVP: HUNT // HIVE TCG':state.screen.toUpperCase()+' — AVP TCG'}`;
    document.body.classList.toggle('reduce-motion',!Store.data.settings.motion);
    document.body.classList.toggle('high-contrast',Store.data.settings.contrast);
    document.body.classList.toggle('large-text',Store.data.settings.largeText);
    enhanceActions(root);restoreFocus(focus);
    document.querySelector('body > .skip-link')?.setAttribute('href','#main-content');
    const count=root.querySelector('[data-filter-count]');if(count&&state.screen==='collection')count.textContent=`${filteredCards().length} / ${D.cards.length} cartes`;
  }

  const FOCUSABLE='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
  function isolateDialog(active){
    root.inert=active;const skip=document.querySelector('body > .skip-link');if(skip){skip.inert=active;skip.hidden=active;}
  }
  function modal(title,body,opts={}){
    const replacing=Boolean(modalRoot.innerHTML),previous=replacing?focusToken():null;
    if(!replacing)state.ui.modalReturnFocus=focusToken();
    state.ui.modalLocked=Boolean(opts.locked);isolateDialog(true);document.body.classList.add('modal-open');
    modalRoot.innerHTML=`<div class="modal-layer" data-action="modal-backdrop"><section class="modal ${opts.small?'small':''} ${opts.className||''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><header class="modal-head"><h2 id="dialog-title">${title}</h2>${opts.locked?'':'<button class="close-btn" data-action="close-modal" aria-label="Fermer">×</button>'}</header><div class="modal-body">${body}</div></section></div>`;
    enhanceActions(modalRoot);
    if(!restoreFocus(previous,modalRoot))(modalRoot.querySelector('[data-autofocus]')||modalRoot.querySelector(FOCUSABLE)||modalRoot.querySelector('[role="dialog"]'))?.focus({preventScroll:true});
  }
  function closeModal(){
    modalRoot.innerHTML='';state.ui.opening=null;state.ui.modalLocked=false;isolateDialog(false);document.body.classList.remove('modal-open');
    restoreFocus(state.ui.modalReturnFocus);state.ui.modalReturnFocus=null;
  }
  function toast(text,tone=''){
    let stack=document.querySelector('.toast-stack');
    if(!stack){stack=document.createElement('div');stack.className='toast-stack';stack.setAttribute('role','status');stack.setAttribute('aria-live','polite');document.body.appendChild(stack);}
    const el=document.createElement('div');el.className=`toast ${tone}`;el.textContent=text;stack.appendChild(el);setTimeout(()=>el.remove(),3300);
  }
  function showTutorial(step=0){
    const steps=[
      {title:'Votre faction, votre stratégie',icon:'▤',text:'Votre deck contient 30 cartes, avec 3 exemplaires maximum d’une carte. Choisissez une faction : elle peut recruter ses propres cartes et les Neutres. Les Hybrides peuvent aussi inclure six petites unités Humaines ou Xéno non synthétiques (coût ≤2). Le constructeur signale chaque erreur avant le duel.',hint:'La Ruche remplit les voies ; les chasseurs exploitent leurs trophées ; les Humains jouent en escouade.'},
      {title:'Jouer une carte',icon:'◆',text:'L’énergie monte à 10. Humains : armes, munitions compatibles et modules. Ruche : Œuf → Facehugger, fusion avec un Hôte → Chestburster, puis Biomasse et évolution. Yautja : Trophées, Plasma et points d’Honneur. Les Véhicules nécessitent toujours un pilote.',hint:'Une unité par voie. Une unité fraîchement déployée attend généralement son prochain tour pour attaquer.'},
      {title:'Choisir le bon combat',icon:'⚔',text:'Sélectionnez Attaquer sous une unité prête, puis une cible valide. Deux unités échangent leurs dégâts simultanément. Une voie libre permet une attaque directe contre le commandant : réduisez ses 8 000 PV à zéro.',hint:'Tab parcourt les actions, Entrée ou Espace les active. Échap annule une cible ; Maj + Entrée termine le tour.'},
      {title:'Votre première opération',icon:'⬡',text:'Commencez par une exhibition en difficulté Recrue, puis avancez dans les 8 missions. Les victoires gagnent crédits et expérience. Les boosters et la fabrication développent votre collection, sans achat réel.',hint:'La progression est locale : exportez régulièrement votre sauvegarde dans ⚙. Un abandon ne donne aucune récompense.'}
    ];
    state.ui.tutorialStep=Math.max(0,Math.min(steps.length-1,step));Store.data.tutorial.lastStep=state.ui.tutorialStep;Store.save();
    const item=steps[state.ui.tutorialStep];
    modal('Guide de terrain',`<div class="tutorial-progress" role="group" aria-label="Étape ${state.ui.tutorialStep+1} sur ${steps.length}">${steps.map((_,i)=>`<span class="${i<=state.ui.tutorialStep?'active':''}"></span>`).join('')}</div><div class="tutorial-symbol" aria-hidden="true">${item.icon}</div><div class="eyebrow">ÉTAPE ${state.ui.tutorialStep+1} / ${steps.length}</div><h3 class="tutorial-title">${item.title}</h3><p class="tutorial-copy">${item.text}</p><p class="source-note">${item.hint}</p><div class="detail-actions tutorial-actions">${state.ui.tutorialStep?'<button class="btn ghost" data-action="tutorial-prev">Précédent</button>':''}${state.ui.tutorialStep<steps.length-1?'<button class="btn primary" data-action="tutorial-next" data-autofocus>Suivant</button>':'<button class="btn primary" data-action="tutorial-finish" data-autofocus>Prêt à jouer</button>'}</div>`,{small:true});
  }

  function showOnboarding(){
    const highlights={XENO:['Couvée et invocation','Sang acide à la destruction','Reine comme finisher'],YAUTJA:['Camouflage et ciblage','Équipements modulaires','Trophées et pioche'],HUMAN:['Escouades équilibrées','Contrôle des voies','Arsenal colonial']};
    modal('Choisissez votre premier deck',`<div style="text-align:center;margin-bottom:20px"><div class="eyebrow">DIRECTIVE DE DÉMARRAGE</div><h2 style="font-size:30px;margin:8px">Quelle faction dirigerez-vous ?</h2><p class="subtle">Vous recevez le deck complet de 30 cartes, une sélection de Communes et 6 500 crédits de boosters.</p></div><div class="starter-grid">${['XENO','YAUTJA','HUMAN'].map(id=>{const d=D.starterDecks[id],f=faction(id);return `<article class="panel starter" style="--sc:${f.accent}"><div class="starter-symbol">${f.symbol}</div><div class="eyebrow" style="color:${f.accent}">${f.name}</div><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><ul>${highlights[id].map(x=>`<li>✓ ${x}</li>`).join('')}</ul><button class="btn primary block" data-action="choose-starter" data-id="${id}">Choisir ce deck</button></article>`}).join('')}</div>`,{locked:true,className:'onboarding'});
  }
  function chooseStarter(id){const template=D.starterDecks[id];if(!template||Store.data.starterChosen)return;for(const c of D.cards.filter(c=>c.index<158&&c.rarity==='C'))Store.add(c.id,1);for(const [cardId,count] of Object.entries(template.cards))Store.data.collection[cardId]=Math.max(Store.owned(cardId),count);const deck={id:U.uid('deck'),name:template.name,faction:id,cards:U.clone(template.cards),createdAt:new Date().toISOString()};Store.data.decks=[deck];Store.data.activeDeckId=deck.id;state.selectedDeckId=deck.id;Store.data.starterChosen=true;Store.save();closeModal();AudioSys.cue('rare');toast(`${template.name} ajouté à votre collection.`, 'good');render();showTutorial(0);}

  function showCardDetail(id){const c=CARD.get(id);if(!c)return;const f=faction(c.faction),r=rarity(c.rarity),owned=Store.owned(id),reserved=cardReserved(id),craft=r.dust*2;const baseRecord=window.AVP_ALIEN_BASE?.byCardId?.[c.id];const baseContinuity={cut_or_prototype:'Archive coupée ou prototype',deleted_or_alternate_scene:'Scène alternative ou supprimée',gameplay_abstraction:'Mécanique de jeu, non preuve de canon',source_pending:'Référence documentaire à confirmer',source_review_required:'Source à confirmer'};const basePanel=baseRecord?`<div class="source-note"><b>Alien_base — fiche mutualisée</b><br><b>ID registre :</b> ${esc(baseRecord.id)}${baseRecord.canonicalEntityId?`<br><b>Entité centrale associée :</b> ${esc(baseRecord.canonicalEntityId)}`:''}<br><b>Catégorie :</b> ${esc(baseRecord.category)}<br><b>Statut :</b> ${esc(baseContinuity[baseRecord.continuityStatus]||baseRecord.continuityStatus)}<br><b>Vérification :</b> ${baseRecord.researchStatus==='legacy_index_unverified'?'Référence du classeur non encore revérifiée':'Référence documentaire partiellement contrôlée'}${baseRecord.summary?`<br><b>Contexte :</b> ${esc(baseRecord.summary)}`:''}${baseRecord.canonicalName?`<br><b>Sujet documentaire :</b> ${esc(baseRecord.canonicalName)} <small>(${esc(baseRecord.canonicalClassification||'classification à revoir')})</small>`:''}${baseRecord.legacyMainV1Link?`<br><b>Archive v1 liée :</b> ${esc(baseRecord.legacyMainV1Link.catalogueId)} (correspondance indicative)`:''}${baseRecord.crossgameReferences?.length?`<br><b>Également référencé :</b> ${baseRecord.crossgameReferences.map(x=>`${esc(x.project.split('/').pop())} (${esc(x.sourceId)})`).join(' • ')}<br><small>Correspondances proposées : équivalences à confirmer, sans transfert de statistiques.</small>`:''}</div>`:'';modal(`${f.symbol} ${esc(c.name)}`,`<div class="card-detail"><div class="card-wrap">${cardHTML(c,{foil:RANK[c.rarity]>=3})}</div><div class="detail-copy"><div class="eyebrow" style="color:${f.accent}">${c.collectorNo} • ${r.name}</div><h2>${esc(c.name)}</h2><p>${esc(c.text)}</p>${cardMechanicsHTML(c)}${collectionRelationsHTML(c)}${c.keywords.length?`<div class="card-keywords">${c.keywords.map(k=>`<span class="kw" title="${esc(D.keywords[k]||'')}">${k}</span>`).join('')}</div>`:''}<p class="lore">${esc(c.flavor||'Aucune note de terrain.')}</p><div class="detail-stats"><div class="detail-stat"><b>${c.cost}</b><span>Énergie</span></div><div class="detail-stat"><b>${owned}</b><span>Possédées</span></div><div class="detail-stat"><b>${displayType(c)}</b><span>Type</span></div></div>${basePanel}${pendingAlienBaseLinks(c.id)}<div class="source-note"><b>Traçabilité :</b> ${esc(c.source.workbook)} → ${esc(c.source.sheet)} → « ${esc(c.source.entry)} »${c.source.prototype?'<br><b>Statut :</b> contenu coupé / prototype séparé du canon principal.':''}${c.sourcePolicy?'<br><b>Nature :</b> effet TCG original basé sur une référence documentaire ; validation lore 1:1 à faire.':''}</div><div class="detail-actions"><button class="btn secondary" data-action="craft-card" data-card-id="${c.id}" ${Store.data.profile.dust<craft?'disabled':''}>Fabriquer • ${craft} ✧</button><button class="btn ghost" data-action="dust-card" data-card-id="${c.id}" ${owned<=reserved?'disabled':''}>Désassembler • +${r.dust} ✧</button></div><p class="subtle" style="font-size:10px">${reserved?`${reserved} exemplaire(s) réservé(s) par un deck.`:'Aucun exemplaire réservé.'}</p></div></div>`);}
  function craftCard(id){const c=CARD.get(id),cost=rarity(c.rarity).dust*2;if(Store.data.profile.dust<cost)return;Store.data.profile.dust-=cost;Store.add(id,1);Store.save();AudioSys.cue('card');showCardDetail(id);render();toast(`${c.name} fabriquée.`, 'good');}
  function dustCard(id){const c=CARD.get(id),owned=Store.owned(id);if(owned<=cardReserved(id))return;Store.data.collection[id]=owned-1;Store.data.profile.dust+=rarity(c.rarity).dust;Store.save();showCardDetail(id);render();toast(`${c.name} désassemblée.`);}

  function awardAchievement(id){if(Store.data.achievements[id])return;const a=D.achievements.find(x=>x.id===id);if(!a)return;Store.data.achievements[id]=new Date().toISOString();Store.data.profile.credits+=a.reward;toast(`Succès : ${a.name} (+${a.reward} crédits)`, 'good');}
  function checkAchievements(extra={}){const p=Store.data.profile;if(p.packsOpened>=1)awardAchievement('first_pack');if(p.wins>=1)awardAchievement('first_win');if(ownedUnique()>=50)awardAchievement('collector_50');if(p.totalTrophies>=10)awardAchievement('trophy_10');if(p.completedMissions>=8)awardAchievement('campaign_clear');if(extra.secret)awardAchievement('secret_pull');Store.save();}

  function buyPack(id){const pack=D.boosters.find(p=>p.id===id),p=Store.data.profile;if(!pack||p.completedMissions<(pack.unlocksAt||0)||p.credits<pack.price)return;p.credits-=pack.price;const result=E.openBooster(id,{pity:p.pity,seed:Date.now()^p.packsOpened});p.packsOpened++;const had={};for(const pull of result.pulls){had[pull.cardId]=Store.owned(pull.cardId);Store.add(pull.cardId,1);Store.data.seenCards[pull.cardId]=true;}if(result.bestRank>=4)p.pity=0;else p.pity++;state.ui.opening={result,revealed:new Set(),had};Store.save();checkAchievements({secret:result.bestRank>=5});AudioSys.cue('pack');renderOpening();}
  function renderOpening(){
    const o=state.ui.opening;if(!o)return;const pulls=o.result.pulls,all=o.revealed.size===pulls.length;
    modal('Ouverture de booster',`<div class="opening-stage"><div class="opening-title"><div class="eyebrow">${o.result.pack.set} // OUVERTURE</div><h2>${esc(o.result.pack.name)}</h2><p class="subtle">Sélectionnez chaque carte pour la révéler.</p></div><div class="pull-grid">${pulls.map((p,i)=>{const c=CARD.get(p.cardId),revealed=o.revealed.has(i);return `<div class="pull-card ${revealed?'revealed':''} ${RANK[c.rarity]===o.result.bestRank?'best':''}" ${revealed?'':`data-action="reveal-pull" data-index="${i}" role="button" tabindex="0"`} aria-label="${revealed?esc(c.name)+', '+rarity(c.rarity).name:'Révéler la carte '+(i+1)}"><div class="pull-inner"><div class="pull-face back" aria-hidden="true">${cardHTML(c,{back:true,mini:true})}</div><div class="pull-face front" aria-hidden="${!revealed}">${cardHTML(c,{mini:true,foil:p.foil})}${revealed&&o.had[c.id]===0?'<span class="owned-badge">NEW</span>':''}</div></div></div>`}).join('')}</div><div class="opening-actions">${all?`<button class="btn secondary" data-action="open-another" data-id="${o.result.pack.id}" ${Store.data.profile.credits<o.result.pack.price?'disabled':''}>Ouvrir encore</button><button class="btn primary" data-action="finish-opening">Continuer</button>`:'<button class="btn ghost" data-action="reveal-all">Tout révéler</button>'}</div><p class="opening-hint" role="status">${o.revealed.size} / ${pulls.length} cartes révélées</p></div>`,{locked:true,className:'booster-open'});
  }
  function revealPull(i){const o=state.ui.opening;if(!o||o.revealed.has(i))return;o.revealed.add(i);const c=CARD.get(o.result.pulls[i].cardId);AudioSys.cue(RANK[c.rarity]>=3?'rare':'card');renderOpening();}

  function addDeckCard(id){const d=activeDeck(),card=CARD.get(id);if(!d||!card)return;if(!canAddByIdentity(card,d)){toast('Identité incompatible ou limite de six soutiens Hybrides atteinte.','bad');return;}const owned=Store.owned(id),current=d.cards[id]||0;if(deckTotal(d)>=30){toast('Le deck contient déjà 30 cartes.','bad');return;}if(current>=3||current>=owned){toast('Aucun exemplaire supplémentaire disponible.','bad');return;}d.cards[id]=current+1;Store.save();AudioSys.cue('click');render();}
  function removeDeckCard(id){const d=activeDeck();if(!d||!d.cards[id])return;d.cards[id]--;if(d.cards[id]<=0)delete d.cards[id];Store.save();render();}
  function newDeck(){
    if(Store.data.decks.length>=MAX_SAVED_DECKS){toast(`Limite de ${MAX_SAVED_DECKS} decks atteinte.`,'bad');return;}
    modal('Identité du nouveau deck',`<p class="subtle">Une faction et ses alliés Neutres. Vous pourrez modifier cette identité dans le constructeur.</p><div class="enemy-select">${Object.entries(D.factions).filter(([id])=>id!=='NEUTRAL').map(([id,f])=>`<button class="btn secondary" data-action="create-deck" data-id="${id}">${f.symbol} ${esc(f.name)}</button>`).join('')}</div>`,{small:true});
  }
  function createDeck(factionId){
    if(!Object.hasOwn(D.factions,factionId)||factionId==='NEUTRAL'||Store.data.decks.length>=MAX_SAVED_DECKS)return;
    const d={id:U.uid('deck'),name:`Deck ${faction(factionId).short} ${Store.data.decks.length+1}`,faction:factionId,cards:{},createdAt:new Date().toISOString()};
    Store.data.decks.push(d);state.selectedDeckId=d.id;Store.save();closeModal();render();
  }
  function importExpansionDeck(remix=false){
    if(Store.data.decks.length>=MAX_SAVED_DECKS){toast(`Limite de ${MAX_SAVED_DECKS} decks atteinte : aucun deck n’a été remplacé.`,'bad');return;}
    const id=document.getElementById('expansion-deck-preset')?.value;
    const preset=(D.expansionDecks||[]).find(p=>p.id===id);
    if(!preset){toast('Choisissez un modèle de deck.','bad');return;}
    const produced=remix&&typeof D.remixPresetDeck==='function'
      ?D.remixPresetDeck(preset,Date.now()^U.hash(preset.id))
      :{cards:preset.cards,reserve:preset.reserve||{}};
    if(!produced){toast('Le modèle remélangé est indisponible.','bad');return;}
    const chosen=produced.cards,reserve=produced.reserve||{};
    const result=E.validateDeck(chosen,null,preset.faction);
    if(!result.valid){toast('Deck proposé invalide : '+result.errors[0],'bad');return;}
    const reserveCount=Object.values(reserve).reduce((a,b)=>a+b,0);
    if(reserveCount!==(preset.boxCount||45)-30){toast('Réserve incohérente : import annulé.','bad');return;}
    // Only add copies to the collection; never delete or mutate previous decks.
    for(const [cardId,n] of Object.entries(chosen)){
      const extra=Math.max(0,Number(reserve[cardId])||0);
      Store.data.collection[cardId]=Math.max(Store.owned(cardId),n+extra);
    }
    for(const [cardId,n] of Object.entries(reserve))if(!chosen[cardId])
      Store.data.collection[cardId]=Math.max(Store.owned(cardId),n);
    const deck={id:U.uid('deck'),name:(remix?'Mix — ':'')+preset.name,faction:preset.faction,
      cards:U.clone(chosen),createdAt:new Date().toISOString()};
    Store.data.decks.push(deck);state.selectedDeckId=deck.id;state.deckFilters.type='ALL';
    Store.save();AudioSys.cue('rare');render();
    toast((remix?'Nouveau mélange':'Deck '+preset.name)+' enregistré, avec '+reserveCount+' alternatives.','good');
  }

  function changeDeckIdentity(id){
    const d=activeDeck();if(!d||!Object.hasOwn(D.factions,id)||id==='NEUTRAL')return;
    const proposed={};let supports=0;
    for(const [cardId,n] of Object.entries(d.cards)){
      const card=CARD.get(cardId);if(!E.allowedForIdentity(card,id))continue;
      const support=id==='HYBRID'&&!['HYBRID','NEUTRAL'].includes(card.faction);
      const kept=support?Math.min(n,6-supports):n;if(kept>0)proposed[cardId]=kept;if(support)supports+=kept;
    }
    const removed=deckTotal(d)-Object.values(proposed).reduce((a,b)=>a+b,0);
    if(removed&&!confirm(`Changer d’identité retirera ${removed} carte(s) incompatible(s) ou soutien(s) excédentaire(s) du deck, sans toucher la collection. Continuer ?`)){render();return;}
    d.cards=proposed;d.faction=id;state.deckFilters.faction='ALL';state.ui.deckLimit=40;Store.save();render();
  }
  function autoFillDeck(){
    const d=activeDeck();if(!d)return;if(!D.factions[d.faction]||d.faction==='NEUTRAL'){toast('Choisissez d’abord une identité de faction.','bad');return;}
    // This generic filler never invents half a resource/fusion package. Full
    // doctrine packages are available through the preconstructed-deck importer.
    const candidates=D.cards.filter(c=>Store.owned(c.id)>0&&E.allowedForIdentity(c,d.faction)&&!c.tags?.includes('asymmetric')).sort((a,b)=>{const order={UNIT:0,TACTIC:1,EQUIPMENT:2,LOCATION:3};return order[a.type]-order[b.type]||a.cost-b.cost||RANK[b.rarity]-RANK[a.rarity]});
    const map={...d.cards};let total=deckTotal(d);
    for(const target of [2,3])for(const c of candidates){const cap=Math.min(c.type==='UNIT'?target:target-1,Store.owned(c.id),3);while((map[c.id]||0)<cap&&total<30&&canAddByIdentity(c,{...d,cards:map})){map[c.id]=(map[c.id]||0)+1;total++;}}
    for(const c of candidates)while((map[c.id]||0)<Math.min(3,Store.owned(c.id))&&total<30&&canAddByIdentity(c,{...d,cards:map})){map[c.id]=(map[c.id]||0)+1;total++;}
    d.cards=map;Store.save();render();toast(`${total}/30 cartes. ${total===30?'Deck complété.':'Fabriquez ou obtenez d’autres cartes de cette faction.'}`,total===30?'good':'bad');
  }

  function persistBattle(ctx){
    if(state.battleContext!==ctx||!ctx.battle||ctx.rewarded||ctx.battle.state.winner!==null)return false;
    if(!Store.checkFresh())return false;
    if(ctx.aiBusy)return Boolean(Store.data.duel);
    try{Store.data.duel={mode:ctx.mode,missionId:ctx.mission?.id||null,checkpoint:window.AVPDuelSave.capture(ctx.battle)};Store.save();return true;}
    catch(error){console.warn('Point de reprise indisponible :',error);toast('Le duel ne peut pas être sauvegardé. Exportez votre progression.','bad');return false;}
  }
  function battleCallbacks(ctx){return {
    onChange:()=>{if(state.battleContext!==ctx)return;persistBattle(ctx);if(state.screen==='battle')render();},
    onGameOver:result=>{if(state.battleContext===ctx)onBattleOver(ctx,result);}
  };}
  function showBattle(ctx){
    state.battleContext=ctx;state.ui.pending=null;state.screen='battle';
    state.lastQuickConfig={mode:ctx.mode,missionId:ctx.mission?.id||null};closeModal();render();window.scrollTo({top:0,behavior:'auto'});
  }
  function startBattle(mode,mission=null){
    if(state.battleContext?.battle.state.winner===null)return;
    if(Store.data.duel){resumeBattle();return;}
    if(!['quick','campaign'].includes(mode))return;
    if(mode==='campaign'){mission=D.campaign.find(m=>m.id===mission?.id);if(!mission||mission.id>Store.data.profile.completedMissions+1){toast('Cette mission est verrouillée.','bad');return;}}
    const deck=Store.deck();if(!deck)return;const valid=validatePlayableDeck(deck);if(!valid.valid){toast(valid.errors[0],'bad');return;}
    const diff=mission?mission.difficulty:(DIFFICULTIES.find(d=>d.id===state.ui.difficulty)?.value||1),factions=mission?mission.factions:[state.ui.enemyFaction];
    const aiDeck=E.buildAiDeck(factions,diff,Date.now()^U.hash(mode+(mission?.id||0)));
    const ctx={mode,mission,difficulty:diff,aiBusy:false,rewarded:false,battle:null};
    ctx.battle=new E.Battle({playerName:Store.data.profile.name,playerDeck:deck.cards,aiDeck,difficulty:diff,modifiers:mission?.modifiers||[],aiName:mission?mission.name:`IA ${faction(factions[0]).name}`,seed:Date.now(),...battleCallbacks(ctx)});
    showBattle(ctx);persistBattle(ctx);AudioSys.cue('card');
  }
  async function resumeBattle(){
    if(state.battleContext?.battle.state.winner===null){state.screen='battle';render();return;}
    const saved=Store.data.duel;if(!saved)return;
    const mission=saved.mode==='campaign'?D.campaign.find(m=>m.id===saved.missionId):null;
    const ctx={mode:saved.mode,mission,difficulty:saved.checkpoint.difficulty,aiBusy:false,rewarded:false,battle:null};
    try{ctx.battle=window.AVPDuelSave.restore(saved.checkpoint,battleCallbacks(ctx));}
    catch(error){Store.data.duel=null;Store.save();render();toast('Duel incompatible. Votre collection et votre progression sont conservées.','bad');return;}
    showBattle(ctx);if(ctx.battle.state.active===1)await runEnemyTurn(ctx);
  }
  function pauseBattle(){
    const ctx=state.battleContext;if(!ctx||ctx.battle.state.winner!==null)return;
    if(!persistBattle(ctx))return;state.battleContext=null;state.ui.pending=null;state.screen='home';closeModal();render();
    toast(Store.persistent?'Duel sauvegardé. Vous pouvez fermer le jeu et reprendre plus tard.':'Stockage indisponible : exportez la sauvegarde avant de fermer.',Store.persistent?'good':'bad');
  }
  function onBattleOver(ctx,result){
    if(ctx.rewarded||state.battleContext!==ctx||!Store.checkFresh())return;ctx.rewarded=true;
    // Clearing the checkpoint and granting rewards share the same profile write.
    Store.data.duel=null;
    if(Store.data.history.some(item=>item.battleId===ctx.battle.id))return;
    const p=Store.data.profile,me=result.state.sides[0],abandoned=Boolean(ctx.abandoned);let reward=0,xp=0,title=abandoned?'Abandon':'Duel terminé',replay=false,packReward=null;
    if(abandoned){p.losses++;}
    else if(result.winner===0){
      p.wins++;p.totalTrophies+=me.totalTrophies;reward=ctx.mode==='campaign'?ctx.mission.reward:Math.round(450*ctx.difficulty);xp=ctx.mode==='campaign'?500:260;title='Victoire';
      if(ctx.mode==='campaign'){
        replay=ctx.mission.id<=p.completedMissions;
        if(replay){reward=Math.round(reward*.35);xp=180;}
        else{
          p.completedMissions=ctx.mission.id;
          const resultPack=E.openBooster(ctx.mission.pack,{pity:p.pity,seed:Date.now()^ctx.mission.id});
          for(const pull of resultPack.pulls){Store.add(pull.cardId);Store.data.seenCards[pull.cardId]=true;}
          p.packsOpened++;p.pity=resultPack.bestRank>=4?0:p.pity+1;packReward=resultPack;
        }
      }
    }else if(result.winner===1){p.losses++;p.totalTrophies+=me.totalTrophies;reward=120;xp=90;title='Défaite';}
    else{p.draws++;p.totalTrophies+=me.totalTrophies;reward=180;xp=120;title='Destruction mutuelle';}
    p.credits+=reward;if(xp)addXP(xp);ctx.packReward=packReward;
    Store.data.history.unshift({date:new Date().toISOString(),mode:ctx.mode,mission:ctx.mission?.id||null,winner:result.winner,reward,xp,round:result.state.round,abandoned,replay,battleId:ctx.battle.id});
    Store.data.history=Store.data.history.slice(0,25);if(!abandoned)checkAchievements({secret:packReward?.bestRank>=5});Store.save();
    if(!ctx.silentResult){AudioSys.cue(result.winner===0?'win':'lose');setTimeout(()=>{if(state.battleContext===ctx)showResultModal(ctx,result,title,reward,xp);},Store.data.settings.motion?350:0);}
  }
  function abandonBattle(showResult=true){
    const ctx=state.battleContext;if(!ctx||ctx.battle.state.winner!==null)return;
    ctx.abandoned=true;ctx.silentResult=!showResult;state.ui.pending=null;
    ctx.battle.damageHero(0,99999,{kind:'SURRENDER'});ctx.battle.checkEnd();
    if(!showResult)state.battleContext=null;render();
  }
  function showResultModal(ctx,result,title,reward,xp){const won=result.winner===0;modal(title,`<div style="text-align:center;padding:10px"><div style="font-size:76px;color:${won?'var(--good)':'var(--danger)'}">${won?'✦':'☣'}</div><h2 style="font-size:34px;margin:5px">${esc(title)}</h2><p class="subtle">${ctx.abandoned?'Duel abandonné : aucune récompense.':esc(result.reason)} • ${result.state.round} tours</p><div class="detail-stats" style="max-width:520px;margin:22px auto"><div class="detail-stat"><b>+${U.format(reward)}</b><span>Crédits</span></div><div class="detail-stat"><b>+${U.format(xp)}</b><span>XP</span></div><div class="detail-stat"><b>${result.state.sides[0].totalTrophies}</b><span>Trophées</span></div></div>${ctx.packReward?`<p class="source-note">Booster de première victoire : ${esc(ctx.packReward.pack.name)}. Les ${ctx.packReward.pulls.length} cartes ont été ajoutées à votre collection.</p>`:''}<div class="detail-actions" style="justify-content:center"><button class="btn ghost" data-action="result-home">Accueil</button>${ctx.mode==='quick'?'<button class="btn secondary" data-action="result-rematch">Revanche</button>':''}<button class="btn primary" data-action="result-continue">${ctx.mode==='campaign'?'Campagne':'Jouer'}</button></div></div>`,{locked:true,small:true});}
  async function runEnemyTurn(ctx){
    if(state.battleContext!==ctx||ctx.aiBusy||ctx.battle.state.winner!==null)return;
    // An AI turn is one checkpoint transaction: replay its start after an abrupt close.
    if(!persistBattle(ctx)||state.battleContext!==ctx)return;ctx.aiBusy=true;render();const canceled={};
    try{
      await ctx.battle.takeAITurn(async()=>{
        if(state.battleContext!==ctx)throw canceled;
        render();await new Promise(r=>setTimeout(r,Store.data.settings.motion?280:25));
        if(state.battleContext!==ctx)throw canceled;
      });
    }catch(error){if(error!==canceled){console.error('Tour IA interrompu :',error);toast('Tour interrompu. Mettez en pause puis reprenez le duel.','bad');}}
    finally{ctx.aiBusy=false;if(state.battleContext===ctx){persistBattle(ctx);render();}}
  }
  async function endPlayerTurn(){
    const ctx=state.battleContext;if(!ctx||ctx.aiBusy||ctx.battle.state.active!==0||ctx.battle.state.winner!==null)return;
    state.ui.pending=null;ctx.battle.endTurn(0);await runEnemyTurn(ctx);
  }

  function showSettings(){
    const settings=[['sound','Effets sonores','Synthèse locale.'],['motion','Animations','Transitions et délai de l’IA.'],['contrast','Contraste renforcé','Textes secondaires et contours accentués.'],['largeText','Texte agrandi','Règles et menus plus lisibles.']];
    modal('Paramètres & sauvegarde',`<div class="settings-grid">${settings.map(([key,label,description])=>`<div class="setting-row"><div><b>${label}</b><span>${description}</span></div><button class="switch ${Store.data.settings[key]?'on':''}" role="switch" aria-label="${label}" aria-checked="${Store.data.settings[key]}" data-action="toggle-setting" data-key="${key}"></button></div>`).join('')}<div class="setting-row"><div><b>Guide de terrain</b><span>Revoir le tutoriel en quatre étapes.</span></div><button class="btn small" data-action="tutorial">Ouvrir</button></div><div class="setting-row"><div><b>Exporter la sauvegarde</b><span>Collection, decks, progression et duel en pause.</span></div><button class="btn small" data-action="export-save">Exporter</button></div><div class="setting-row"><div><b>Importer une sauvegarde</b><span>JSON de 1 Mo maximum. Remplacement confirmé après validation.</span></div><label class="btn small import-control">Importer<input class="file-input" type="file" aria-label="Importer une sauvegarde JSON" accept=".json,application/json" data-action="import-save"></label></div><div class="setting-row"><div><b>Réinitialiser le profil</b><span>Supprime la progression locale.</span></div><button class="btn danger small" data-action="reset-save">Réinitialiser</button></div></div><div class="source-note">Sauvegarde ${Store.persistent?'locale active':'temporaire : stockage indisponible'} : <span class="mono">${STORAGE_KEY}</span><br>Aucun compte, serveur ou achat réel n’est utilisé.</div>`,{small:true});
  }
  function parseSaveImport(text){
    if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_IMPORT_BYTES)throw new Error('Le fichier dépasse 1 Mo.');
    return sanitizeSave(JSON.parse(text));
  }
  async function importSaveFile(file){
    if(!file)return false;
    if(!Number.isFinite(file.size)||file.size<1||file.size>MAX_IMPORT_BYTES)throw new Error('Choisissez un fichier JSON de 1 Mo maximum.');
    const incoming=parseSaveImport(await file.text());
    if(!confirm(`Remplacer la collection et la progression actuelles par le profil « ${incoming.profile.name} » (niveau ${incoming.profile.level}) ? Exportez d’abord vos données si nécessaire.`))return false;
    Store.data=incoming;const persisted=Store.save();state.selectedDeckId=Store.data.activeDeckId;state.battleContext=null;state.screen='home';closeModal();render();
    toast(persisted?'Sauvegarde importée.':'Importée pour cette session seulement : exportez-la avant de quitter.',persisted?'good':'bad');
    if(!Store.data.starterChosen)showOnboarding();return true;
  }
  function downloadJSON(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

  function navigate(screen){if(state.screen==='battle'&&state.battleContext?.battle.state.winner===null&&screen!=='battle'){const previous=state.battleContext;pauseBattle();if(state.battleContext===previous)return;}state.screen=screen;state.ui.pending=null;if(screen==='decks'&&!state.selectedDeckId)state.selectedDeckId=Store.data.activeDeckId;window.scrollTo({top:0,behavior:Store.data.settings.motion?'smooth':'auto'});render();}
  function quickLaunch(){if(Store.data.duel){resumeBattle();return;}const deck=Store.deck();if(deck&&validatePlayableDeck(deck).valid)startBattle('quick');else navigate('decks');}

  async function handleClick(ev){const el=ev.target.closest('[data-action]');if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;const action=el.dataset.action;AudioSys.cue('click');
    if(action==='nav')navigate(el.dataset.screen);
    else if(action==='settings')showSettings();else if(action==='close-modal'&&!state.ui.modalLocked)closeModal();else if(action==='modal-backdrop'&&ev.target===el&&!state.ui.modalLocked)closeModal();
    else if(action==='tutorial')showTutorial(0);else if(action==='tutorial-next')showTutorial(state.ui.tutorialStep+1);else if(action==='tutorial-prev')showTutorial(state.ui.tutorialStep-1);else if(action==='tutorial-finish'){Store.data.tutorial.completed=true;Store.save();closeModal();navigate('play');}
    else if(action==='more-cards'){state.ui[el.dataset.scope==='deck'?'deckLimit':'collectionLimit']+=el.dataset.scope==='deck'?40:48;render();}
    else if(action==='collection-view'){if(['cards','progress','decks'].includes(el.dataset.view)){state.collectionView=el.dataset.view;render();}}
    else if(action==='collection-clear-filters'){state.filters={query:'',faction:'ALL',type:'ALL',rarity:'ALL',set:'ALL',owned:'ALL',quantity:'ALL',sort:'RARITY_DESC'};state.ui.collectionLimit=48;render();}
    else if(action==='collection-filter-group'){const key=el.dataset.groupField;if(['faction','type','rarity','set'].includes(key)){state.filters={query:'',faction:'ALL',type:'ALL',rarity:'ALL',set:'ALL',owned:'ALL',quantity:'ALL',sort:'RARITY_DESC',[key]:el.dataset.groupValue};state.collectionView='cards';state.ui.collectionLimit=48;render();}}
    else if(action==='collection-deck-group'){state.collectionDeckFilters={query:'',category:el.dataset.groupValue,faction:'ALL',source:'ALL',status:'ALL',sort:'NEAREST',includeReserve:false};state.collectionView='decks';state.collectionDeckLimit=12;render();}
    else if(action==='collection-more-decks'){state.collectionDeckLimit+=12;render();}
    else if(action==='collection-deck-detail')showCollectionDeck(el.dataset.recipeKey);
    else if(action==='collection-toggle-reserve'){state.collectionDeckFilters.includeReserve=!state.collectionDeckFilters.includeReserve;render();showCollectionDeck(el.dataset.recipeKey);}
    else if(action==='collection-build-deck')buildCollectionDeck(el.dataset.recipeKey);
    else if(action==='collection-find-card'){
      const card=CARD.get(el.dataset.cardId);if(card){const previous=state.filters;state.filters={query:card.id,faction:previous.faction===card.faction?previous.faction:'ALL',type:[card.type,card.cardClass].includes(previous.type)?previous.type:'ALL',rarity:'ALL',set:'ALL',owned:'ALL',quantity:'ALL',sort:'INDEX'};state.collectionView='cards';state.ui.collectionLimit=48;closeModal();navigate('collection');}
    }
    else if(action==='collection-export'){if(window.AVPCollection){const model=collectionModel();downloadJSON('AVP_HUNT_HIVE_COLLECTION.json',{schema:'avp-player-collection-v1',exportedAt:new Date().toISOString(),catalogueVersion:D.version,summary:model.summary(),cards:model.cards.map(card=>({id:card.id,name:card.name,faction:card.faction,type:card.cardClass||card.type,set:card.set,rarity:card.rarity,owned:model.quantity(card.id),missingForPlayset:Math.max(0,model.maxCopies-model.quantity(card.id))}))});}}
    else if(action==='codex-detail')showAlienBaseCodex(el.dataset.codexId);
    else if(action==='codex-research-detail')showAlienResearchDetail(el.dataset.codexKind,el.dataset.codexId);
    else if(action==='codex-update-detail')showAlienBaseUpdateDetail(el.dataset.updateMode,el.dataset.updateId);
    else if(action==='codex-mode'){
      const next=el.dataset.codexMode;
      if(['reference','weapons','leads','apex','media'].includes(next)){
        state.codexFilters.mode=next;state.codexFilters.query='';state.codexFilters.type='ALL';state.codexFilters.scope='ALL';state.ui.codexLimit=18;render();
      }
    }
    else if(action==='codex-more'){state.ui.codexLimit+=18;render();}
    else if(action==='create-deck')createDeck(el.dataset.id);
    else if(action==='choose-starter')chooseStarter(el.dataset.id);else if(action==='view-card')showCardDetail(el.dataset.cardId);else if(action==='craft-card')craftCard(el.dataset.cardId);else if(action==='dust-card')dustCard(el.dataset.cardId);
    else if(action==='resume-battle')await resumeBattle();else if(action==='pause-battle')pauseBattle();else if(action==='quick-launch')quickLaunch();else if(action==='difficulty'){state.ui.difficulty=el.dataset.id;render();}else if(action==='enemy-faction'){state.ui.enemyFaction=el.dataset.id;render();}else if(action==='start-quick')startBattle('quick');
    else if(action==='buy-pack')buyPack(el.dataset.id);else if(action==='reveal-pull')revealPull(Number(el.dataset.index));else if(action==='reveal-all'){for(let i=0;i<state.ui.opening.result.pulls.length;i++)state.ui.opening.revealed.add(i);AudioSys.cue('rare');renderOpening();}else if(action==='open-another'){const id=el.dataset.id;closeModal();buyPack(id);}else if(action==='finish-opening'){closeModal();render();}
    else if(action==='select-deck'){state.selectedDeckId=el.dataset.id;render();}else if(action==='deck-add')addDeckCard(el.dataset.cardId);else if(action==='deck-remove')removeDeckCard(el.dataset.cardId);else if(action==='new-deck')newDeck();else if(action==='auto-fill-deck')autoFillDeck();else if(action==='import-expansion-deck')importExpansionDeck(false);else if(action==='remix-expansion-deck')importExpansionDeck(true);else if(action==='set-active-deck'){const d=activeDeck();if(d&&validatePlayableDeck(d).valid){Store.data.activeDeckId=d.id;Store.save();toast(`${d.name} est désormais actif.`,'good');render();}}else if(action==='rename-deck'){const d=activeDeck(),name=prompt('Nom du deck',d?.name||'');if(d&&name?.trim()){d.name=name.trim().slice(0,40);Store.save();render();}}
    else if(action==='start-mission'){const m=D.campaign.find(x=>x.id===Number(el.dataset.id));if(m)startBattle('campaign',m);}
    else if(action==='battle-inspect')showBattleUnitDetail(Number(el.dataset.side),Number(el.dataset.lane));
    else if(action==='battle-hand'){const ctx=state.battleContext,b=ctx?.battle,index=Number(el.dataset.index);if(!b||ctx.aiBusy)return;const check=b.canPlay(0,index);if(!check.ok){toast(check.reason,'bad');return;}if(check.targets.length===1&&check.targets[0].kind==='NONE'){b.playCard(0,index,check.targets[0]);state.ui.pending=null;}else state.ui.pending={mode:'play',handIndex:index,cardId:b.side(0).hand[index],targets:check.targets};render();}
    else if(action==='battle-target'){const p=state.ui.pending;if(!p)return;const target={kind:el.dataset.kind,lane:Number(el.dataset.lane)};if(p.mode==='play')state.battleContext.battle.playCard(0,p.handIndex,target);else state.battleContext.battle.attack(0,p.lane,{kind:'UNIT',lane:target.lane});state.ui.pending=null;render();}
    else if(action==='battle-target-hero'){const p=state.ui.pending;if(p?.mode==='attack')state.battleContext.battle.attack(0,p.lane,{kind:'HERO'});state.ui.pending=null;render();}
    else if(action==='battle-attack'){const lane=Number(el.dataset.lane),targets=state.battleContext.battle.legalAttacks(0,lane);state.ui.pending={mode:'attack',lane,targets};render();}
    else if(action==='battle-cancel'){state.ui.pending=null;render();}else if(action==='battle-end')await endPlayerTurn();else if(action==='battle-surrender'){if(confirm('Abandonner ce duel sans récompense ?'))abandonBattle();}
    else if(action==='result-home'){closeModal();state.battleContext=null;navigate('home');}else if(action==='result-continue'){closeModal();state.battleContext=null;navigate(state.lastQuickConfig?.mode==='campaign'?'campaign':'play');}else if(action==='result-rematch'){closeModal();state.battleContext=null;startBattle('quick');}
    else if(action==='toggle-setting'){const k=el.dataset.key;if(!['sound','motion','contrast','largeText'].includes(k))return;Store.data.settings[k]=!Store.data.settings[k];Store.save();showSettings();render();}else if(action==='export-save')downloadJSON('AVP_HUNT_HIVE_SAVE.json',Store.data);else if(action==='reset-save'){if(confirm('Supprimer définitivement la sauvegarde locale ?')){Store.reset();state.battleContext=null;state.ui.pending=null;state.screen='home';state.selectedDeckId=null;closeModal();render();setTimeout(showOnboarding,50);}}
    else if(action==='export-catalog')downloadJSON('AVP_HUNT_HIVE_CARD_CATALOG.json',D);
  }

  document.addEventListener('error',event=>{
    const image=event.target;if(!(image instanceof HTMLImageElement)||!image.dataset.artKind)return;
    if(image.dataset.artKind==='card'){
      const card=CARD.get(image.dataset.cardId);if(card)image.parentElement.innerHTML=artSvg(card);
    }else{
      image.hidden=true;image.parentElement?.classList.add('art-load-failed');
    }
  },true);
  root.addEventListener('click',handleClick);modalRoot.addEventListener('click',handleClick);
  function updateAlienCodexFilter(key,value){
 if(!Object.hasOwn(state.codexFilters,key)||state.codexFilters[key]===value)return;
 state.codexFilters[key]=value;
 state.ui.codexLimit=18;
 render();
}
  const alienCodexFilterInput=debounce(updateAlienCodexFilter,110);

  function updateCollectionDeckFilter(key,value){
    if(!Object.hasOwn(state.collectionDeckFilters,key))return;
    const next=key==='includeReserve'?Boolean(value):String(value).slice(0,160);
    if(state.collectionDeckFilters[key]===next)return;
    state.collectionDeckFilters[key]=next;state.collectionDeckLimit=12;render();
  }
  const collectionDeckFilterInput=debounce(updateCollectionDeckFilter,110);

  function updateFilter(prefix,key,value){
    const target=prefix==='deck'?state.deckFilters:state.filters;if(!Object.hasOwn(target,key)||target[key]===value)return;
    target[key]=value;state.ui[prefix==='deck'?'deckLimit':'collectionLimit']=prefix==='deck'?40:48;render();
  }
  const filterInput=debounce(updateFilter,100);
  root.addEventListener('input',ev=>{const el=ev.target.closest('[data-filter]');if(el)filterInput(el.dataset.filterPrefix,el.dataset.filter,el.value);const c=ev.target.closest('[data-codex-filter]');if(c)alienCodexFilterInput(c.dataset.codexFilter,c.value);const d=ev.target.closest('[data-collection-filter="query"]');if(d)collectionDeckFilterInput('query',d.value);});
  root.addEventListener('change',ev=>{
    const el=ev.target.closest('[data-filter]');if(el?.matches('select'))updateFilter(el.dataset.filterPrefix,el.dataset.filter,el.value);
    const deckCollection=ev.target.closest('[data-collection-filter]');if(deckCollection)updateCollectionDeckFilter(deckCollection.dataset.collectionFilter,deckCollection.type==='checkbox'?deckCollection.checked:deckCollection.value);
    const codex=ev.target.closest('select[data-codex-filter]');if(codex)updateAlienCodexFilter(codex.dataset.codexFilter,codex.value);
    if(ev.target.matches('[data-action="deck-identity"]'))changeDeckIdentity(ev.target.value);
    if(ev.target.matches('[data-action="pack-filter"]')){
      const value=ev.target.value;
      if(['ALL','CLASSIC','PREVIEW'].includes(value)){state.ui.packFilter=value;render();}
    }
  });
  modalRoot.addEventListener('change',async ev=>{
    if(!ev.target.matches('input[type=file][data-action="import-save"]'))return;
    const input=ev.target;try{await importSaveFile(input.files?.[0]);}catch(error){toast(`Import refusé : ${error.message||'fichier invalide.'}`,'bad');}finally{input.value='';}
  });
  document.addEventListener('keydown',ev=>{
    const dialog=modalRoot.querySelector('[role="dialog"]');
    if(dialog){
      if(ev.key==='Escape'){ev.preventDefault();if(!state.ui.modalLocked)closeModal();return;}
      if(ev.key==='Tab'){
        const elements=Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&el.getAttribute('aria-disabled')!=='true');
        const first=elements[0],last=elements[elements.length-1];
        if(!first){ev.preventDefault();dialog.focus();return;}
        if(ev.shiftKey&&(document.activeElement===first||!elements.includes(document.activeElement))){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&(document.activeElement===last||!elements.includes(document.activeElement))){ev.preventDefault();first.focus();}
      }
    }
    const action=ev.target.closest?.('[role="button"][data-action]');
    if(action&&(ev.key==='Enter'||ev.key===' ')&&!ev.shiftKey){ev.preventDefault();action.click();return;}
    if(!dialog&&ev.key==='Escape'&&state.ui.pending){ev.preventDefault();state.ui.pending=null;render();}
    if(!dialog&&state.screen==='battle'&&ev.shiftKey&&ev.key==='Enter'&&!ev.target.matches('input,textarea,select')){ev.preventDefault();endPlayerTurn();}
  });

  window.AVP_APP={Store,state,render,startBattle,buyPack,showCardDetail,showBattleUnitDetail,showTutorial,abandonBattle,resumeBattle,pauseBattle,endPlayerTurn,save:{freshSave,sanitizeSave,parseSaveImport,importSaveFile,version:SAVE_VERSION,maxImportBytes:MAX_IMPORT_BYTES},reset:()=>{Store.reset();location.reload();}};
  window.addEventListener?.('storage',event=>{if(event.key===STORAGE_KEY||event.key===null)Store.checkFresh();});
  render();if(!Store.data.starterChosen)setTimeout(showOnboarding,80);
  else if(!Store.data.tutorial.completed)setTimeout(()=>showTutorial(Store.data.tutorial.lastStep),80);
  if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname))){
    navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(error=>{console.warn('Mode hors ligne indisponible :',error);toast('Mode hors ligne indisponible pour cette session.');});
  }
})();
