/* Moteur de règles déterministe extrait du standalone vérifié. */
(function () {
  'use strict';
  const D = window.AVP_DATA;
  const CARD = new Map(D.cards.map(c => [c.id, c]));
  const RANK = Object.fromEntries(Object.entries(D.rarities).map(([k,v]) => [k,v.rank]));

  const U = {
    clamp: (v,a,b) => Math.max(a,Math.min(b,v)),
    clone: v => JSON.parse(JSON.stringify(v)),
    uid: (p='id') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
    hash(str) { let h=2166136261>>>0; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; },
    rng(seed) { let a=(seed>>>0)||1; const next=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};next.getState=()=>a>>>0;next.setState=value=>{if(!Number.isSafeInteger(value)||value<0||value>4294967295)throw new Error('État aléatoire invalide');a=value>>>0;};return next; },
    shuffle(arr,rng=Math.random) { const out=arr.slice(); for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; },
    choice(arr,rng=Math.random){return arr[Math.floor(rng()*arr.length)] || arr[0];},
    weighted(items,rng=Math.random){const total=items.reduce((s,x)=>s+x.weight,0);let n=rng()*total;for(const x of items){n-=x.weight;if(n<=0)return x.value;}return items[items.length-1]?.value;},
    format: n => new Intl.NumberFormat('fr-FR').format(Math.max(0,Math.round(n||0))),
  };

  function expandDeck(deckMap){
    const out=[];
    if(!deckMap||typeof deckMap!=='object'||Array.isArray(deckMap))return out;
    // Imported quantities must never turn expansion into an unbounded loop.
    for(const [id,count] of Object.entries(deckMap)){
      if(!CARD.has(id)||!Number.isSafeInteger(count)||count<0||count>D.rules.maxCopies)continue;
      for(let i=0;i<count&&out.length<D.rules.deckSize;i++)out.push(id);
      if(out.length===D.rules.deckSize)break;
    }
    return out;
  }

  function identityFactions(identity){return identity==null?[]:Array.isArray(identity)?identity:[typeof identity==='object'?identity.id:identity];}
  function hybridSupport(card){return card?.type==='UNIT'&&card.cost<=2&&!card.keywords.includes('SYNTHETIC')&&['HUMAN','XENO'].includes(card.faction);}
  function allowedForIdentity(card,identity=null){
    const c=typeof card==='string'?CARD.get(card):card;if(!c)return false;
    const factions=identityFactions(identity);
    return !factions.length||factions.includes('MIXED')||c.faction==='NEUTRAL'||factions.some(f=>c.faction===f||(f==='HYBRID'&&hybridSupport(c)));
  }

  function validateDeck(deckMap, collection=null, identity=null){
    const errors=[];
    const isMap=deckMap!==null&&typeof deckMap==='object'&&!Array.isArray(deckMap);
    const entries=isMap?Object.entries(deckMap):[];
    if(!isMap)errors.push('Le deck doit être une liste de cartes et de quantités.');
    const factions=identityFactions(identity);
    if(factions.some(f=>typeof f!=='string'||(f!=='MIXED'&&!Object.hasOwn(D.factions,f))))errors.push('Identité de faction inconnue.');
    const total=entries.reduce((s,[,n])=>s+(Number.isSafeInteger(n)&&n>=0&&n<=D.rules.maxCopies?n:0),0);
    if(total!==D.rules.deckSize) errors.push(`Le deck doit contenir exactement ${D.rules.deckSize} cartes (${total} actuellement).`);
    for(const [id,n] of entries){
      if(!CARD.has(id)){errors.push(`Carte inconnue : ${id}`);continue;}
      if(!Number.isSafeInteger(n)||n<0||n>D.rules.maxCopies){errors.push(`${CARD.get(id).name} : quantité entière de 0 à ${D.rules.maxCopies} requise.`);continue;}
      if(n===0)continue;
      if(collection && (!Number.isSafeInteger(collection[id])||collection[id]<n)) errors.push(`Collection insuffisante : ${CARD.get(id).name} (${collection[id]||0}/${n}).`);
      if(!allowedForIdentity(CARD.get(id),identity))errors.push(`${CARD.get(id).name} ne correspond pas à l’identité ${factions.join(' / ')}.`);
    }
    if(factions.length===1&&factions[0]==='HYBRID'){
      const supports=entries.reduce((n,[id,count])=>n+(hybridSupport(CARD.get(id))&&Number.isSafeInteger(count)&&count>0&&count<=D.rules.maxCopies?count:0),0);
      if(supports>6)errors.push(`L’identité HYBRID autorise au plus 6 soutiens Humains ou Xénomorphes de coût 2 ou moins (${supports} actuellement).`);
    }
    return {valid:errors.length===0,errors,total};
  }

  function rarityRoll(minRank, rng, pity=0){
    let weights;
    if(minRank<=1) weights=[['C',67],['R',26],['SR',5.4],['UR',1.3],['SCR',.25],['PR',.045],['GR',.005]];
    else weights=[['R',61],['SR',27],['UR',9],['SCR',2.5],['PR',.45],['GR',.05]];
    if(pity>=9) return 'UR';
    return U.weighted(weights.filter(([r])=>RANK[r]>=minRank).map(([value,weight])=>({value,weight})),rng);
  }

  function pickCardFromSet(setId, rarity, rng, used, minimumRank=1){
    let pool=D.cards.filter(c=>c.set===setId && c.rarity===rarity);
    if(!pool.length){
      const wanted=RANK[rarity];
      pool=D.cards.filter(c=>c.set===setId&&RANK[c.rarity]>=wanted).sort((a,b)=>RANK[a.rarity]-RANK[b.rarity]);
      if(pool.length){const rank=RANK[pool[0].rarity];pool=pool.filter(c=>RANK[c.rarity]===rank);}
      else pool=D.cards.filter(c=>c.set===setId&&RANK[c.rarity]>=minimumRank);
    }
    if(!pool.length) pool=D.cards.filter(c=>RANK[c.rarity]>=minimumRank);
    const fresh=pool.filter(c=>!used.has(c.id));
    return U.choice(fresh.length?fresh:pool,rng);
  }

  function openBooster(packId, opts={}){
    const pack=D.boosters.find(p=>p.id===packId);if(!pack)throw new Error('Booster inconnu');
    const seed=opts.seed ?? (Date.now()^U.hash(packId)),rng=U.rng(seed);
    const pity=opts.pity||0,used=new Set(),pulls=[];
    // Preserve the original 9-card release algorithm byte-for-byte in behavior.
    // The new 5/7/9-card set previews use local rarity slots only.
    if(!pack.preview){
      for(let i=0;i<9;i++){
        const minRank=i<6?1:2;
        let rarity=rarityRoll(minRank,rng,i===8?pity:0);
        if(i===8&&pity>=9&&RANK[rarity]<4)rarity='UR';
        const card=pickCardFromSet(pack.set,rarity,rng,used,i===8&&pity>=9?4:minRank);
        used.add(card.id);pulls.push({cardId:card.id,foil:i===8||(i>5&&rng()<.22),slot:i,rolledRarity:rarity});
      }
    }else{
      const length=pack.cardsPerBooster;
      if(![5,7,9].includes(length))throw new Error('Format de booster non pris en charge');
      const pool=D.cards.filter(c=>c.set===pack.set);
      if(pool.length<length)throw new Error('Pool de booster insuffisant : '+pack.set);
      const rank=c=>RANK[c.rarity]||0;
      const choose=(lower,upper=99)=>{
        let candidates=pool.filter(c=>!used.has(c.id)&&rank(c)>=lower&&rank(c)<=upper);
        if(!candidates.length)candidates=pool.filter(c=>!used.has(c.id)&&rank(c)>=lower);
        if(!candidates.length)candidates=pool.filter(c=>!used.has(c.id));
        if(!candidates.length)candidates=pool.filter(c=>rank(c)>=lower);
        if(!candidates.length)throw new Error('Pool sans carte sélectionnable');
        const card=U.choice(candidates,rng);used.add(card.id);
        pulls.push({cardId:card.id,foil:rank(card)>=3,slot:pulls.length,rolledRarity:card.rarity});
      };
      const premium=pack.profile==='collector'||pack.profile==='construction';
      for(let i=0;i<length;i++){
        const last=i===length-1;
        const penultimate=i===length-2;
        const minRank=last?(pity>=9?4:3):premium?(pack.profile==='collector'?3:2):penultimate?2:1;
        choose(minRank,last?99:premium?99:Math.max(minRank,1));
      }
      // Guarantee the pity slot in the same set, even after using a unique UR in a prior slot.
      if(pity>=9&&Math.max(...pulls.map(p=>RANK[CARD.get(p.cardId).rarity]))<4){
        const high=pool.filter(c=>rank(c)>=4).sort((a,b)=>rank(a)-rank(b));
        if(!high.length)throw new Error('Aucune UR locale pour la protection de malchance');
        const replacement=U.choice(high,rng);
        const last=pulls[pulls.length-1];
        last.cardId=replacement.id;last.rolledRarity=replacement.rarity;last.foil=true;
      }
    }
    pulls.sort((a,b)=>RANK[CARD.get(a.cardId).rarity]-RANK[CARD.get(b.cardId).rarity]);
    return {pack,seed,pulls,bestRank:Math.max(...pulls.map(p=>RANK[CARD.get(p.cardId).rarity]))};
  }

  function buildAiDeck(factions=['XENO'], difficulty=1, seed=1){
    const rng=U.rng(seed);
    let pool=D.cards.filter(c=>allowedForIdentity(c,factions) && (c.set!=='PX00'||difficulty>=2.1));
    if(!pool.length) pool=D.cards.filter(c=>c.faction==='XENO');
    // A Human assault deck needs a formation and equipment, not an unrelated
    // mixture of crews, situational quarantine cards and slow locations.
    // This is an AI archetype only; collection/deckbuilding identities stay intact.
    const infantry=factions.length===1&&factions[0]==='HUMAN';
    const hybrid=factions.length===1&&factions[0]==='HYBRID';
    if(infantry)pool=pool.filter(c=>c.type==='UNIT'
      ?c.tags.includes('uscm')||['H_COMBAT_SYNTH','H_WORKING_JOE','H_POWERLOADER_RIPLEY','H_BISHOP','H_RIPLEY'].includes(c.id)
      :!['T_H_EVAC','T_H_QUARANTINE'].includes(c.id));
    // Keep early deployment and a midgame while preserving faction finishers.
    const targets=infantry
      ?[['UNIT',3,0,2],['UNIT',4,3,4],['UNIT',12,0,10],['TACTIC',6,0,10],['EQUIPMENT',5,0,10]]
      :[['UNIT',3,0,2],['UNIT',4,3,4],['UNIT',12,0,10],['TACTIC',6,0,10],['EQUIPMENT',3,0,10],['LOCATION',2,0,10]];
    const deck={};
    const score=c=>{
      let s=1;
      if(c.type==='UNIT') s+=(c.attack+c.health)/1000-Math.abs(c.cost-3.5)*.15;
      if(c.rarity==='UR'||c.rarity==='SCR')s+=difficulty*.35;
      if(c.rarity==='PR'||c.rarity==='GR')s+=difficulty>.95?1:-1;
      return Math.max(.1,s);
    };
    const syntheticCount=()=>Object.entries(deck).reduce((n,[id,count])=>n+(CARD.get(id)?.keywords.includes('SYNTHETIC')?count:0),0);
    const available=c=>(deck[c.id]||0)<3
      &&(!infantry||!c.keywords.includes('SYNTHETIC')||syntheticCount()<1)
      &&(!(hybrid&&hybridSupport(c))||Object.entries(deck).reduce((n,[id,count])=>n+(hybridSupport(CARD.get(id))?count:0),0)<6);
    for(const [type,count,min,max] of targets){
      const typed=pool.filter(c=>c.type===type);
      for(let i=0;i<count;i++){
        let candidates=typed.filter(c=>available(c)&&c.cost>=min&&c.cost<=max);
        if(!candidates.length)candidates=typed.filter(available);
        if(!candidates.length)break;
        const id=U.weighted(candidates.map(c=>({value:c.id,weight:score(c)})),rng);
        deck[id]=(deck[id]||0)+1;
      }
    }
    while(Object.values(deck).reduce((a,b)=>a+b,0)<30){
      const candidates=pool.filter(c=>available(c) && c.type!=='LOCATION');
      const id=U.choice(candidates,rng)?.id; if(!id)break; deck[id]=(deck[id]||0)+1;
    }
    // The solo Hybrid AI needs a deterministic cross-faction package. This
    // normalizes only generated AI decks; player deckbuilding remains unchanged.
    if(hybrid){
      let locations=0;
      for(const id of Object.keys(deck))if(CARD.get(id)?.type==='LOCATION'){locations+=deck[id];delete deck[id];}
      if(locations!==2)throw new Error('Hybrid AI location package is incomplete.');
      deck.L_AURIGA=2;
      let needed=3-(deck.T_AVP_ALLIANCE||0);
      for(const donor of ['T_AVP_WHOEVER','T_AVP_HYBRIDIZE','T_AVP_3WW']){
        const take=Math.min(needed,deck[donor]||0);
        if(take){deck[donor]-=take;if(!deck[donor])delete deck[donor];deck.T_AVP_ALLIANCE=(deck.T_AVP_ALLIANCE||0)+take;needed-=take;}
        if(!needed)break;
      }
      // New hybrid cards enlarge the pool; maintain the original 3 Alliance
      // guarantee without requiring all three old donor tactics to be drawn.
      if(needed){
        const replaceable=Object.keys(deck).filter(id=>id!=='T_AVP_ALLIANCE'&&id!=='L_AURIGA');
        for(const id of replaceable){
          if(!needed)break;
          const count=Math.min(needed,deck[id]);
          deck[id]-=count;if(!deck[id])delete deck[id];
          deck.T_AVP_ALLIANCE=(deck.T_AVP_ALLIANCE||0)+count;needed-=count;
        }
      }
      if(needed)throw new Error('Hybrid AI cannot be normalized.');
    }
    return deck;
  }

  class Battle {
    constructor(options={}){
      this.id=U.uid('battle'); this.onChange=options.onChange||(()=>{}); this.onLog=options.onLog||(()=>{}); this.onGameOver=options.onGameOver||(()=>{});
      this.resolutionDepth=0;this.pendingDeaths=[];this.resolvingDeaths=false;this.syncingHealthAuras=false;
      this.rng=U.rng(options.seed ?? Date.now()); this.difficulty=options.difficulty||1; this.modifiers=options.modifiers||[];
      const aiLife=Math.round(D.rules.startingLife*(1+Math.max(0,this.difficulty-1)*.12));
      this.state={active:0,round:1,halfTurn:0,winner:null,reason:'',log:[],startedAt:Date.now(),
        sides:[this.makeSide(options.playerName||'Commandant',options.playerDeck,D.rules.startingLife,false),this.makeSide(options.aiName||'Directive adverse',options.aiDeck,aiLife,true)]};
      if(this.modifiers.includes('boss')){this.state.sides[1].maxLife+=1000;this.state.sides[1].life+=1000;this.state.sides[1].maxEnergy=1;}
      if(this.modifiers.includes('ritual'))for(const side of this.state.sides)side.location={cardId:'L_BOUVET'};
      this.resolve(()=>{this.draw(0,D.rules.startingHand); this.draw(1,D.rules.startingHand+(D.rules.secondPlayerBonusDraw||0));});
      this.ensureOpeningPlayable(0); this.ensureOpeningPlayable(1);
      this.beginTurn(0,true);
      this.log(`Duel engagé — ${U.format(this.state.sides[0].life)} PV contre ${U.format(this.state.sides[1].life)} PV.`,'SYSTEM');
    }
    makeSide(name,deckMap,life,isAI){
      const deck=U.shuffle(expandDeck(deckMap),this.rng);
      return {name,isAI,life,maxLife:life,shield:0,deck,hand:[],discard:[],board:[null,null,null],location:null,energy:0,maxEnergy:0,nextEnergy:0,trophies:0,totalTrophies:0,fatigue:0,flags:{},status:{},rebornUsed:{},cardsPlayed:0,unitsLost:0,turnsStarted:0};
    }
    // A complete action, including all death chains, has exactly one outcome.
    resolve(action){this.resolutionDepth++;try{return action();}finally{this.resolutionDepth--;if(this.resolutionDepth===0){this.syncHealthAuras();this.flushDeaths();this.checkEnd();if(this.notificationPending){this.notificationPending=false;this.notify();}}}}
    notify(){if(this.resolutionDepth||this.resolvingDeaths){this.notificationPending=true;return;}this.onChange(this.state);}
    log(text,tone='INFO'){const row={id:U.uid('log'),text,tone,time:Date.now()};this.state.log.unshift(row);this.state.log=this.state.log.slice(0,60);this.onLog(row);}
    card(id){return CARD.get(id);}
    side(i){return this.state.sides[i];}
    enemy(i){return this.state.sides[1-i];}
    locationLocked(sideIndex){return this.side(sideIndex).board.some(u=>u&&this.card(u.cardId).effect?.aura?.kind==='LOCK_LOCATION');}
    isOffensiveTactic(card){if(card?.type!=='TACTIC')return false;const k=card.effect?.kind;return card.effect?.target==='ENEMY_UNIT'||['DAMAGE_TARGET','TRANSFORM_DAMAGED','EXECUTE','STUN_TARGET','DAMAGE_LANE','STUN_ALL_DAMAGED','SILENCE_FACTION','DEBUFF_ALL','DAMAGE_ALL','DAMAGE_ALL_HEROES','DAMAGE_STRONGEST','DAMAGE_FACTION','DAMAGE_DEBUFFED','DAMAGE_ALL_ENEMY_UNITS','ARMOR_BREAK'].includes(k);}

    ensureOpeningPlayable(sideIndex){
      const s=this.side(sideIndex);
      if(s.hand.some(id=>this.card(id)&&this.card(id).cost<=1))return;
      const deckIndex=s.deck.findIndex(id=>this.card(id)&&this.card(id).cost<=1);
      if(deckIndex<0)return;
      const swapIndex=s.hand.reduce((best,id,i)=>this.card(id).cost>this.card(s.hand[best]).cost?i:best,0);
      const [cheap]=s.deck.splice(deckIndex,1);
      s.deck.push(s.hand[swapIndex]);
      s.hand[swapIndex]=cheap;
      s.deck=U.shuffle(s.deck,this.rng);
    }
    draw(sideIndex,count=1){
      const s=this.side(sideIndex);
      for(let i=0;i<count;i++){
        if(!s.deck.length){s.fatigue++;this.damageHero(sideIndex,300+s.fatigue*150,{kind:'FATIGUE'});continue;}
        s.hand.push(s.deck.pop());
      }
    }
    searchDeck(sideIndex,predicate){const s=this.side(sideIndex);const idx=s.deck.findIndex(id=>predicate(this.card(id)));if(idx<0)return null;const [id]=s.deck.splice(idx,1);s.hand.push(id);return id;}
    createCard(sideIndex,predicate){const pool=D.cards.filter(predicate);if(!pool.length)return null;const c=U.choice(pool,this.rng);this.side(sideIndex).hand.push(c.id);return c.id;}
    makeUnit(cardId,sideIndex){
      const c=this.card(cardId); const kws=new Set(c.keywords||[]);
      return {uid:U.uid('unit'),cardId,owner:sideIndex,currentHealth:c.health,attackBonus:0,healthBonus:0,tempAttack:0,granted:this.modifiers.includes('trophyRush')&&sideIndex===1?['TROPHY']:[],tempGranted:[],equipment:[],ready:kws.has('RUSH'),attacked:false,cloaked:kws.has('CLOAK'),armorUsed:false,stunned:0,debuffed:false,kills:0,mutated:false,mutations:[],rebornUsed:false,forced:false,tacticShieldUsed:false};
    }
    hasCrew(sideIndex,vehicleCard,vehicleUnit=null){
      // A single living Personnage is assigned to at most one vehicle.
      // The order of occupied lanes gives a stable assignment for old checkpoints.
      const board=this.side(sideIndex).board;
      const pilots=board.filter(u=>u&&this.card(u.cardId).cardClass==='PERSONNAGE'
        &&this.isFaction(u,vehicleCard.faction));
      const vehicles=board.filter(u=>u&&this.card(u.cardId).crewRequired
        &&this.isFaction(u,vehicleCard.faction));
      if(vehicleUnit)return vehicles.indexOf(vehicleUnit)>=0&&vehicles.indexOf(vehicleUnit)<pilots.length;
      return vehicles.length<pilots.length;
    }
    allKeywords(u){const set=new Set(this.card(u.cardId).keywords||[]);for(const k of u.granted||[])set.add(k);for(const k of u.tempGranted||[])set.add(k);for(const eqId of u.equipment||[])for(const k of this.card(eqId).keywords||[])set.add(k);return set;}
    has(u,k){return !!u&&this.allKeywords(u).has(k);}
    factionsOf(u){const c=this.card(u.cardId);return new Set([c.faction,...(c.effect?.dualFaction||[]),...(u.extraFactions||[])]);}
    isFaction(u,f){return this.factionsOf(u).has(f);}
    unitMaxHealth(sideIndex,u){
      let val=this.card(u.cardId).health+(u.healthBonus||0);
      for(const e of u.equipment)val+=this.card(e).health||0;
      const side=this.side(sideIndex);
      for(const ally of side.board.filter(Boolean)){
        const aura=this.card(ally.cardId).effect?.aura;
        if(aura?.kind==='TAG_HEALTH'&&ally.uid!==u.uid&&this.card(u.cardId).tags.includes(aura.tag))val+=aura.amount;
      }
      if(side.location?.cardId==='L_HADLEYS_HOPE'&&this.card(u.cardId).tags.includes('uscm'))val+=200;
      if(side.location?.cardId==='L_PROTO_LAB'&&(this.isFaction(u,'HUMAN')||this.isFaction(u,'YAUTJA')))val+=200;
      if(side.location?.cardId==='L_XENO_HIVE'&&this.has(u,'HIVE'))val+=100;
      const location=side.location&&this.card(side.location.cardId)?.effect?.locationBuff;
      if(location&&this.isFaction(u,location.faction))val+=location.health||0;
      if(this.card(u.cardId).crewRequired&&this.hasCrew(sideIndex,this.card(u.cardId),u))val+=200;
      return Math.max(1,val);
    }
    syncHealthAuras(){
      if(this.syncingHealthAuras)return;
      this.syncingHealthAuras=true;
      try{
        let casualties;
        do{
          casualties=[];
          for(let sideIndex=0;sideIndex<2;sideIndex++)for(let lane=0;lane<D.rules.lanes;lane++){
            const u=this.side(sideIndex).board[lane];if(!u)continue;
            const intrinsic=this.card(u.cardId).health+(u.healthBonus||0)+u.equipment.reduce((sum,id)=>sum+(this.card(id).health||0),0);
            const auraHealth=this.unitMaxHealth(sideIndex,u)-intrinsic;
            // Keeping maxHP - currentHP constant prevents healing by toggling an aura.
            u.currentHealth+=auraHealth-(u.auraHealth||0);u.auraHealth=auraHealth;
            if(u.currentHealth<=0)casualties.push({sideIndex,lane,u});
          }
          for(const {sideIndex,lane,u} of casualties)if(this.side(sideIndex).board[lane]===u)this.destroyUnit(sideIndex,lane,{kind:'AURA_LOSS'});
        }while(casualties.length);
      }finally{this.syncingHealthAuras=false;}
    }
    unitAttack(sideIndex,u,target=null){
      const c=this.card(u.cardId);let val=c.attack+(u.attackBonus||0)+(u.tempAttack||0);
      for(const e of u.equipment)val+=this.card(e).attack||0;
      const side=this.side(sideIndex);
      const field=side.location&&this.card(side.location.cardId)?.effect?.locationBuff;
      if(field&&this.isFaction(u,field.faction))val+=field.attack||0;
      if(c.crewRequired&&this.hasCrew(sideIndex,c,u))val+=200;
      if(this.has(u,'SQUAD')) val+=side.board.filter(x=>x&&x.uid!==u.uid&&this.isFaction(x,'HUMAN')).length*250;
      for(const ally of side.board.filter(Boolean)){
        const aura=this.card(ally.cardId).effect?.aura;
        if(aura?.kind==='TROPHY_ATTACK'&&(!aura.faction||this.isFaction(u,aura.faction)))val+=side.trophies*aura.amount;
        if(aura?.kind==='FACTION_ATTACK'&&this.isFaction(u,aura.faction))val+=aura.amount;
      }
      if(side.location?.cardId==='L_LA1997'&&this.isFaction(u,'YAUTJA')&&this.enemy(sideIndex).life<5000)val+=200;
      if(side.location?.cardId==='L_FIORINA'&&u.equipment.length===0)val+=200;
      if(side.location?.cardId==='L_PROTO_LAB'&&(this.isFaction(u,'HUMAN')||this.isFaction(u,'YAUTJA')))val+=200;
      const cond=c.effect?.conditionalAttack;
      if(cond){
        if(cond.allyFaction&&side.board.some(x=>x&&this.isFaction(x,cond.allyFaction)))val+=cond.amount;
        if(cond.allyId&&side.board.some(x=>x?.cardId===cond.allyId))val+=cond.amount;
        if(target){const tc=this.card(target.cardId);if(cond.enemyFaction&&this.isFaction(target,cond.enemyFaction))val+=cond.amount;if(cond.enemyTag&&tc.tags.includes(cond.enemyTag))val+=cond.amount;if(cond.enemyKeyword&&this.has(target,cond.enemyKeyword))val+=cond.amount;if(cond.strongerEnemy&&this.unitAttack(1-sideIndex,target)>val)val+=cond.amount;if(cond.enemyCloaked&&target.cloaked)val+=cond.amount;}
      }
      if(target&&this.has(u,'HUNTER')&&this.card(target.cardId).attack>c.attack)val+=300;
      if(target&&c.effect?.lowHealthAttack&&u.currentHealth<=1000)val+=c.effect.lowHealthAttack;
      return Math.max(0,Math.round(val));
    }
    effectiveCost(sideIndex,card){
      const s=this.side(sideIndex);let cost=card.cost;
      if(card.type==='UNIT'&&card.keywords.includes('HIVE')&&s.location?.cardId==='L_XENO_HIVE')cost--;
      if(card.type==='UNIT'&&card.faction==='XENO'&&this.state.sides.some(x=>x.location?.cardId==='L_HADLEYS_HOPE'))cost--;
      if(s.location?.cardId==='L_PROTO_LAB'&&card.tags.includes('emissary'))cost--;
      if(s.location?.cardId==='L_BOUVET'&&card.type==='UNIT'&&(card.faction==='XENO'||card.faction==='YAUTJA')&&!s.flags.bouvetUsed)cost--;
      if(s.location?.cardId==='L_SULACO'&&card.type==='EQUIPMENT'&&card.faction==='HUMAN'&&!s.flags.sulacoUsed)cost--;
      if(s.location?.cardId==='L_JUGGERNAUT'&&card.tags.includes('pathogen'))cost--;
      if(s.location?.cardId==='L_AURIGA'&&card.faction==='HYBRID'&&!s.flags.aurigaUsed)cost--;
      if(s.location?.cardId==='L_NOSTROMO'&&card.type==='UNIT'&&card.tags.includes('nostromo')&&!s.flags.nostromoUsed)cost--;
      for(const u of s.board.filter(Boolean)){const a=this.card(u.cardId).effect?.aura;if(a?.kind==='EQUIPMENT_DISCOUNT'&&card.type==='EQUIPMENT')cost-=a.amount;}
      return Math.max(0,cost);
    }
    canSeeCloak(sideIndex,u){if(!u?.cloaked)return true;return this.side(sideIndex).board.some(x=>x&&x.equipment.some(e=>this.card(e).effect?.seeCloak));}
    deploymentError(sideIndex,card){
      if(!card||card.type!=='UNIT')return 'Seules les unités peuvent être invoquées.';
      const allies=this.side(sideIndex).board.filter(Boolean);
      if(card.crewRequired&&!this.hasCrew(sideIndex,card))return 'Véhicule : déployez d’abord un Personnage pilote de cette faction.';
      if(card.keywords.includes('UNIQUE')&&allies.some(u=>u.cardId===card.id))return 'Cette unité Unique est déjà en jeu.';
      if(allies.some(u=>{const other=this.card(u.cardId);return (card.effect?.exclusiveTag&&other.tags.includes(card.effect.exclusiveTag))||(other.effect?.exclusiveTag&&card.tags.includes(other.effect.exclusiveTag));}))return 'Une royauté incompatible est déjà en jeu.';
      return null;
    }
    validTargets(cardOrId,sideIndex){
      const c=typeof cardOrId==='string'?this.card(cardOrId):cardOrId; const s=this.side(sideIndex),e=this.enemy(sideIndex),out=[];
      if(!c)return out;
      if(c.type==='UNIT'){if(this.deploymentError(sideIndex,c))return out;for(let lane=0;lane<3;lane++)if(!s.board[lane])out.push({kind:'FRIENDLY_LANE',lane});return out;}
      if(c.type==='LOCATION')return [{kind:'NONE'}];
      if(c.type==='EQUIPMENT'){
        for(let lane=0;lane<3;lane++){
          const wearer=s.board[lane];if(!wearer)continue;
          if(c.effect?.requiresFaction&&!this.isFaction(wearer,c.effect.requiresFaction))continue;
          // The new dedicated weapon slot is separate from 1.0.0 equipment.
          if(c.slot==='WEAPON'&&wearer.equipment.some(id=>this.card(id)?.slot==='WEAPON'))continue;
          out.push({kind:'FRIENDLY_UNIT',lane});
        }
        return out;
      }
      const target=c.effect?.target;
      if(!target)return [{kind:'NONE'}];
      if(target==='FRIENDLY_UNIT')for(let lane=0;lane<3;lane++)if(s.board[lane]){
        if(c.effect?.kind==='REPOSITION'&&s.board.every(Boolean))continue;
        if(c.effect?.kind==='REPAIR_UNIT'&&s.board[lane].currentHealth>=this.unitMaxHealth(sideIndex,s.board[lane]))continue;
        out.push({kind:'FRIENDLY_UNIT',lane});
      }
      if(target==='ENEMY_UNIT')for(let lane=0;lane<3;lane++)if(e.board[lane]&&(!e.board[lane].cloaked||c.effect.kind==='REVEAL_AND_BUFF'||this.canSeeCloak(sideIndex,e.board[lane]))){
        if(c.effect.kind==='EXECUTE'&&e.board[lane].currentHealth>c.effect.threshold)continue;
        if(c.effect.kind==='TRANSFORM_DAMAGED'&&(this.has(e.board[lane],'SYNTHETIC')||e.board[lane].currentHealth>=this.unitMaxHealth(1-sideIndex,e.board[lane])))continue;
        out.push({kind:'ENEMY_UNIT',lane});
      }
      return out;
    }
    canPlay(sideIndex,handIndex){
      if(this.state.winner!==null||this.state.active!==sideIndex)return {ok:false,reason:'Ce n’est pas votre tour.'};
      const s=this.side(sideIndex),id=s.hand[handIndex],c=this.card(id);if(!c)return {ok:false,reason:'Carte introuvable.'};
      const cost=this.effectiveCost(sideIndex,c);if(cost>s.energy)return {ok:false,reason:`Énergie insuffisante (${cost} requise).`};
      if(c.type==='UNIT'){const reason=this.deploymentError(sideIndex,c);if(reason)return {ok:false,reason};}
      const targets=this.validTargets(c,sideIndex);if(!targets.length)return {ok:false,reason:'Aucune cible valide.'};
      return {ok:true,cost,targets,card:c};
    }
    playCard(sideIndex,handIndex,target={kind:'NONE'}){
      return this.resolve(()=>this.playCardResolved(sideIndex,handIndex,target));
    }
    playCardResolved(sideIndex,handIndex,target={kind:'NONE'}){
      const check=this.canPlay(sideIndex,handIndex);if(!check.ok)return check;
      const s=this.side(sideIndex),c=check.card;
      if(!check.targets.some(t=>t.kind===target.kind&&(t.lane??-1)===(target.lane??-1)))return {ok:false,reason:'Cible invalide.'};
      s.energy-=check.cost;s.hand.splice(handIndex,1);s.cardsPlayed++;
      if(s.location?.cardId==='L_BOUVET'&&c.type==='UNIT'&&(c.faction==='XENO'||c.faction==='YAUTJA'))s.flags.bouvetUsed=true;
      if(s.location?.cardId==='L_SULACO'&&c.type==='EQUIPMENT'&&c.faction==='HUMAN')s.flags.sulacoUsed=true;
      if(s.location?.cardId==='L_AURIGA'&&c.faction==='HYBRID')s.flags.aurigaUsed=true;
      if(s.location?.cardId==='L_NOSTROMO'&&c.type==='UNIT'&&c.tags.includes('nostromo'))s.flags.nostromoUsed=true;
      if(c.type==='TACTIC'&&this.isOffensiveTactic(c)){const shield=this.enemy(sideIndex).board.find(x=>x&&this.card(x.cardId).effect?.shieldTactic&&!x.tacticShieldUsed);if(shield){shield.tacticShieldUsed=true;s.discard.push(c.id);this.log(`${this.card(shield.cardId).name} annule ${c.name}.`,'EFFECT');this.notify();return {ok:true,countered:true};}}
      if(c.type==='UNIT'){
        const u=this.makeUnit(c.id,sideIndex);s.board[target.lane]=u;
        this.syncHealthAuras();
        if(s.location?.cardId==='L_VAL_VERDE'&&this.isFaction(u,'YAUTJA')&&!s.flags.valVerdeUsed){u.cloaked=true;s.flags.valVerdeUsed=true;}
        if(this.modifiers.includes('enemyCloak')&&sideIndex===1&&!s.flags.modCloak){u.cloaked=true;s.flags.modCloak=true;}
        this.log(`${s.name} déploie ${c.name} sur la voie ${target.lane+1}.`,sideIndex===0?'PLAYER':'ENEMY');
        if(!s.status.silenceFaction||!this.isFaction(u,s.status.silenceFaction)){
          this.applyEffect(sideIndex,c.effect?.onPlay,{lane:target.lane,unit:u,card:c});
          if(this.has(u,'AMBUSH'))this.damageOpposing(sideIndex,target.lane,300,{unit:u});
          if(this.has(u,'SCAVENGE')){
            const idx=[...s.discard].map((id,i)=>({id,i})).reverse().find(x=>this.card(x.id)?.type==='EQUIPMENT')?.i;
            if(idx!==undefined){const [eq]=s.discard.splice(idx,1);s.hand.push(eq);this.log(`${c.name} récupère ${this.card(eq).name}.`,'EFFECT');}
          }
          if(this.has(u,'BROOD')&&!c.effect?.onPlay?.kind)this.summonFirstFree(sideIndex,'X_FACEHUGGER');
        }
      }else if(c.type==='EQUIPMENT'){
        const u=s.board[target.lane];u.equipment.push(c.id);u.currentHealth+=c.health||0;if(c.keywords.includes('CLOAK'))u.cloaked=true;if(c.keywords.includes('ARMOR'))u.armorUsed=false;
        this.log(`${s.name} équipe ${this.card(u.cardId).name} avec ${c.name}.`,sideIndex===0?'PLAYER':'ENEMY');
        this.applyEffect(sideIndex,c.effect?.onEquip,{lane:target.lane,unit:u,card:c});
      }else if(c.type==='LOCATION'){
        if(s.location)s.discard.push(s.location.cardId);
        s.location={cardId:c.id};this.log(`${s.name} établit le lieu ${c.name}.`,sideIndex===0?'PLAYER':'ENEMY');
      }else{
        s.discard.push(c.id);this.log(`${s.name} active ${c.name}.`,sideIndex===0?'PLAYER':'ENEMY');
        this.applyEffect(sideIndex,c.effect,{target,card:c});
      }
      this.syncHealthAuras();this.checkEnd();this.notify();return {ok:true};
    }
    summonAt(sideIndex,cardId,lane,opts={}){
      const s=this.side(sideIndex);if(!Number.isInteger(lane)||lane<0||lane>=D.rules.lanes||s.board[lane]||this.deploymentError(sideIndex,this.card(cardId)))return null;const u=this.makeUnit(cardId,sideIndex);s.board[lane]=u;this.syncHealthAuras();if(opts.health===1)u.currentHealth=1;if(opts.ready)u.ready=true;
      this.log(`${this.card(cardId).name} est invoqué sur la voie ${lane+1}.`,'EFFECT');return u;
    }
    summonFirstFree(sideIndex,cardId,opts={}){const s=this.side(sideIndex);const lanes=[0,1,2].filter(i=>!s.board[i]);if(!lanes.length)return null;return this.summonAt(sideIndex,cardId,U.choice(lanes,this.rng),opts);}
    buffUnit(sideIndex,lane,attack=0,health=0,grant=[]){const u=this.side(sideIndex).board[lane];if(!u)return;u.attackBonus+=attack;u.healthBonus+=health;u.currentHealth+=health;for(const k of grant||[])if(!u.granted.includes(k))u.granted.push(k);if(grant?.includes('CLOAK'))u.cloaked=true;if(grant?.includes('ARMOR'))u.armorUsed=false;}
    applyEffect(sideIndex,effect,ctx={}){
      return this.resolve(()=>this.applyEffectResolved(sideIndex,effect,ctx));
    }
    applyEffectResolved(sideIndex,effect,ctx={}){
      if(!effect||this.state.winner!==null)return;const s=this.side(sideIndex),enemy=this.enemy(sideIndex);const target=ctx.target;let u,lane;
      const friendly=()=>{lane=target?.lane;u=s.board[lane];return u;}; const hostile=()=>{lane=target?.lane;u=enemy.board[lane];return u;};
      switch(effect.kind){
        case 'SUMMON': {const ln=effect.sameLane?ctx.lane:null;if(ln!=null)this.summonAt(sideIndex,effect.card,ln);else this.summonFirstFree(sideIndex,effect.card);break;}
        case 'SUMMON_MULTI': for(let i=0;i<(effect.count||1);i++)this.summonFirstFree(sideIndex,effect.card);break;
        case 'DEBUFF_OPPOSING': if(enemy.board[ctx.lane]&&!this.has(enemy.board[ctx.lane],'SYNTHETIC')){enemy.board[ctx.lane].attackBonus-=effect.attack||0;enemy.board[ctx.lane].debuffed=true;enemy.board[ctx.lane].infested=true;}break;
        case 'DAMAGE_OPPOSING': this.damageOpposing(sideIndex,ctx.lane,effect.amount,ctx);break;
        case 'DAMAGE_HERO': this.damageHero(1-sideIndex,effect.amount,ctx);break;
        case 'BUFF_ALL': for(let i=0;i<3;i++){const x=s.board[i];if(x&&(!effect.faction||this.isFaction(x,effect.faction)))this.buffUnit(sideIndex,i,effect.attack||0,effect.health||0,effect.grant||[]);}break;
        case 'DAMAGE_ALL': {const snapshots=[...this.side(0).board.map((_,i)=>[0,i]),...this.side(1).board.map((_,i)=>[1,i])];for(const [si,li] of snapshots)if(this.side(si).board[li])this.damageUnit(si,li,effect.amount||effect.damage||0,ctx);if(effect.discardLocations){for(let si=0;si<2;si++){const ss=this.side(si);if(ss.location&&!this.locationLocked(si)){ss.discard.push(ss.location.cardId);ss.location=null;}else if(ss.location)this.log(`${this.card(ss.location.cardId).name} est protégé par le Space Jockey.`,'EFFECT');}}break;}
        case 'STUN_OPPOSING': if(enemy.board[ctx.lane]&&!(this.isPathogen(ctx)&&this.has(enemy.board[ctx.lane],'SYNTHETIC'))){enemy.board[ctx.lane].stunned=Math.max(enemy.board[ctx.lane].stunned,effect.turns||1);enemy.board[ctx.lane].ready=false;}break;
        case 'DRAW': this.draw(sideIndex,effect.count||1);break;
        case 'MOTION_SCAN': this.draw(sideIndex,effect.count||1);for(const x of enemy.board.filter(Boolean))if(this.card(x.cardId).cost<=(effect.maxCost||3))x.cloaked=false;break;
        case 'DRAW_LOCATION_ENERGY': for(let i=0;i<(effect.count||1);i++)this.searchDeck(sideIndex,c=>c.type==='LOCATION');s.energy+=effect.energy||1;break;
        case 'DAMAGE_FACTION': {let li=enemy.board.findIndex(x=>x&&effect.destroyTag&&this.card(x.cardId).tags.includes(effect.destroyTag));if(li>=0)this.destroyUnit(1-sideIndex,li,{sourceSide:sideIndex,noAcid:false});else{li=enemy.board.findIndex(x=>x&&this.isFaction(x,effect.faction));if(li>=0)this.damageUnit(1-sideIndex,li,effect.amount,ctx);}break;}
        case 'DAMAGE_TAG': {const li=enemy.board.findIndex(x=>x&&((effect.tag&&this.card(x.cardId).tags.includes(effect.tag))||(effect.faction&&this.isFaction(x,effect.faction))));if(li>=0)this.damageUnit(1-sideIndex,li,effect.amount||0,ctx);break;}
        case 'DRAW_IF_LOCATION': if(s.location&&this.card(s.location.cardId).effect.code===effect.code)this.draw(sideIndex,effect.count||1);break;
        case 'DRAW_DISCARD': this.draw(sideIndex,effect.draw||1);for(let i=0;i<(effect.discard||0)&&s.hand.length;i++)s.discard.push(s.hand.splice(Math.floor(this.rng()*s.hand.length),1)[0]);break;
        case 'BUFF_TAG': for(let i=0;i<3;i++){const x=s.board[i];if(x&&((this.card(x.cardId).tags||[]).includes(effect.tag)||this.has(x,effect.tag))){if(effect.temporary){x.tempAttack+=effect.attack||0;if(effect.health)x.currentHealth+=effect.health;}else this.buffUnit(sideIndex,i,effect.attack||0,effect.health||0,effect.grant||[]);}}break;
        case 'TEMP_BUFF_SELF': if(ctx.unit)ctx.unit.tempAttack+=(effect.attack||0);break;
        case 'DAMAGE_DEBUFFED': {const li=enemy.board.findIndex(x=>x&&x.debuffed);if(li>=0)this.damageUnit(1-sideIndex,li,effect.amount,ctx);break;}
        case 'DEBUFF_ALL': for(const si of ctx.card?.id==='T_E_BLACK_GOO'?[0,1]:[1-sideIndex])for(let i=0;i<3;i++){const x=this.side(si).board[i];if(x&&!this.has(x,'SYNTHETIC')){if(!effect.damage&&this.isPathogen(ctx))this.applyMutation(si,x,effect.attack||200);else{x.attackBonus-=effect.attack||0;x.debuffed=true;x.permanentDebuffed=true;}if(effect.damage)this.damageUnit(si,i,effect.damage,{...ctx,noMutation:true});}}break;
        case 'DRAW_TYPE': for(let i=0;i<(effect.count||1);i++)this.searchDeck(sideIndex,c=>c.type===effect.type);break;
        case 'CREATE_RANDOM': for(let i=0;i<(effect.count||1);i++)this.createCard(sideIndex,c=>c.faction===effect.faction&&c.cost<=(effect.maxCost||10));break;
        case 'DAMAGE_TARGET': if(hostile())this.damageUnit(1-sideIndex,lane,effect.amount+(u.attacked?200:0),ctx);break;
        case 'BUFF_AND_RUSH': if(friendly()){u.tempAttack+=effect.attack||0;if(effect.health){u.healthBonus+=effect.health;u.currentHealth+=effect.health;}if(!u.tempGranted.includes('RUSH'))u.tempGranted.push('RUSH');u.ready=!u.attacked&&u.stunned<=0&&!u.stunBlocked;}break;
        case 'BUFF_TARGET': if(friendly())this.buffUnit(sideIndex,lane,effect.attack||0,effect.health||0,effect.grant||[]);break;
        case 'TRANSFORM_DAMAGED': if(hostile()&&!this.has(u,'SYNTHETIC')&&u.currentHealth<this.unitMaxHealth(1-sideIndex,u)){this.destroyUnit(1-sideIndex,lane,{sourceSide:sideIndex,transform:true});if(!s.board[lane])this.summonAt(sideIndex,effect.card,lane);else s.hand.push(effect.card);}break;
        case 'UPGRADE_XENO': if(friendly()&&this.isFaction(u,'XENO'))this.buffUnit(sideIndex,lane,effect.attack||0,effect.health||0,effect.grant||[]);break;
        case 'STUN_ALL_DAMAGED': for(const x of enemy.board.filter(Boolean))if(x.currentHealth<this.unitMaxHealth(1-sideIndex,x)){x.stunned=1;x.ready=false;}break;
        case 'REVIVE_STRONGEST': {const ids=s.discard.filter(id=>this.card(id)?.faction===effect.faction&&this.card(id).type==='UNIT'&&!this.deploymentError(sideIndex,this.card(id))).sort((a,b)=>RANK[this.card(b).rarity]-RANK[this.card(a).rarity]);if(ids.length){const id=ids[0],idx=s.discard.indexOf(id);if(this.summonFirstFree(sideIndex,id,{health:1}))s.discard.splice(idx,1);}break;}
        case 'EXECUTE': if(hostile()&&u.currentHealth<=effect.threshold){this.destroyUnit(1-sideIndex,lane,{sourceSide:sideIndex});this.gainTrophy(sideIndex);}break;
        case 'REVEAL_AND_BUFF': for(const x of enemy.board.filter(Boolean))x.cloaked=false;if(friendly())this.buffUnit(sideIndex,lane,effect.attack||0,0,[]);break;
        case 'GRANT': if(friendly())this.buffUnit(sideIndex,lane,0,0,effect.grant||[]);break;
        case 'DAMAGE_ALL_HEROES': this.damageHero(0,effect.amount,ctx);this.damageHero(1,effect.amount,ctx);for(const [si,li] of [...Array(3)].flatMap((_,i)=>[[0,i],[1,i]]))if(this.side(si).board[li])this.damageUnit(si,li,600,ctx);break;
        case 'BUFF_IF_KILL': if(friendly()&&u.kills>0)this.buffUnit(sideIndex,lane,effect.attack||0,effect.health||0,effect.grant||[]);break;
        case 'STUN_TARGET': if(hostile()){this.damageUnit(1-sideIndex,lane,effect.damage||0,ctx);const x=enemy.board[lane];if(x){x.stunned=effect.turns||1;x.ready=false;}}break;
        case 'FORCE_DUEL': if(friendly()){u.tempAttack+=effect.attack||0;if(!u.tempGranted.includes('GUARD'))u.tempGranted.push('GUARD');u.forced=true;}break;
        case 'DAMAGE_LANE': if(hostile()){const bonus=(this.card(u.cardId).tags.includes('egg')||u.cardId==='X_FACEHUGGER')?300:0;this.damageUnit(1-sideIndex,lane,effect.amount+bonus,ctx);}break;
        case 'READY_ALL': for(const x of s.board.filter(Boolean)){if(!x.tempGranted.includes('ARMOR'))x.tempGranted.push('ARMOR');x.armorUsed=false;}break;
        case 'BOUNCE_FRIENDLY': if(friendly()){s.board[lane]=null;s.hand.push(u.cardId);s.discard.push(...u.equipment);this.draw(sideIndex,effect.draw||0);}break;
        case 'SILENCE_FACTION': enemy.status.silenceFaction=effect.faction;enemy.status.silenceTurns=effect.turns||1;break;
        case 'SACRIFICE_SUMMON': if(friendly()){this.destroyUnit(sideIndex,lane,{sacrifice:true,noDeath:true});this.summonFirstFree(sideIndex,effect.card);}break;
        case 'DAMAGE_STRONGEST': for(let si=0;si<2;si++){const ss=this.side(si);let li=-1,best=-1;for(let i=0;i<3;i++)if(ss.board[i]){const a=this.unitAttack(si,ss.board[i]);if(a>best){best=a;li=i;}}if(li>=0)this.damageUnit(si,li,effect.amount,ctx);}break;
        case 'BUFF_MULTI_FACTION': for(let i=0;i<3;i++){const x=s.board[i];if(x&&effect.factions.some(f=>this.isFaction(x,f)))this.buffUnit(sideIndex,i,effect.attack||0,effect.health||0,[]);}break;
        case 'SUMMON_THREE_WORLDS': for(const f of ['HUMAN','YAUTJA','XENO']){const pool=D.cards.filter(c=>c.type==='UNIT'&&c.faction===f&&c.cost<=2);const c=U.choice(pool,this.rng);if(c)this.summonFirstFree(sideIndex,c.id);}break;
        case 'HYBRIDIZE': if(friendly()){this.buffUnit(sideIndex,lane,effect.attack||0,effect.health||0,[]);u.extraFactions=[...(u.extraFactions||[]),'HYBRID'];}break;
        case 'DAMAGE_RANDOM_ENEMY': {const lanes=enemy.board.map((x,i)=>x?i:null).filter(x=>x!==null);if(lanes.length)this.damageUnit(1-sideIndex,U.choice(lanes,this.rng),effect.amount,ctx);else this.damageHero(1-sideIndex,effect.amount,ctx);break;}
        case 'NEXT_ENERGY': s.nextEnergy+=(effect.amount||1);break;
        case 'REPAIR_SELF': {
          if(ctx.unit&&s.board.includes(ctx.unit)){
            ctx.unit.currentHealth=Math.min(this.unitMaxHealth(sideIndex,ctx.unit),ctx.unit.currentHealth+(effect.amount||0));
          }
          break;
        }
        case 'REPAIR_UNIT': {
          if(friendly())u.currentHealth=Math.min(this.unitMaxHealth(sideIndex,u),u.currentHealth+(effect.amount||0));
          break;
        }
        case 'REPOSITION': {
          if(friendly()){
            const free=s.board.findIndex(x=>!x);
            if(free>=0&&free!==lane){
              s.board[free]=u;s.board[lane]=null;
              this.log(this.card(u.cardId).name+' change de voie.','EFFECT');
            }
          }
          break;
        }
        case 'SCAN_REVEAL': {
          for(const x of enemy.board.filter(Boolean))x.cloaked=false;
          if(effect.draw)this.draw(sideIndex,effect.draw);
          break;
        }
        case 'SUPPLY_SEARCH': {
          this.searchDeck(sideIndex,c=>c.type==='EQUIPMENT'&&c.cost<=(effect.maxCost||10));
          break;
        }
        case 'FORTIFY': {
          s.shield=Math.min(1200,s.shield+(effect.amount||0));
          break;
        }
        case 'ARMOR_BREAK': {
          if(hostile()){
            u.armorUsed=true;
            this.damageUnit(1-sideIndex,lane,effect.amount||0,{...ctx,noMutation:true});
          }
          break;
        }
        case 'DAMAGE_ALL_ENEMY_UNITS': {
          for(let i=0;i<3;i++)if(enemy.board[i])this.damageUnit(1-sideIndex,i,effect.amount||0,ctx);
          break;
        }
      }
      this.checkEnd();
    }
    damageOpposing(sideIndex,lane,amount,ctx={}){if(this.enemy(sideIndex).board[lane])this.damageUnit(1-sideIndex,lane,amount,ctx);else this.damageHero(1-sideIndex,Math.round(amount*.6),ctx);}
    damageHero(sideIndex,amount,ctx={}){const s=this.side(sideIndex);let dmg=Math.max(0,Math.round(amount));if(s.shield){const absorb=Math.min(s.shield,dmg);s.shield-=absorb;dmg-=absorb;}s.life=Math.max(0,s.life-dmg);if(dmg)this.log(`${s.name} subit ${U.format(dmg)} dégâts.`,sideIndex===0?'DANGER':'SUCCESS');this.checkEnd();}
    healHero(sideIndex,amount){const s=this.side(sideIndex);s.life=Math.min(s.maxLife,s.life+amount);}
    isPathogen(ctx={}){return ctx.kind==='PATHOGEN'||(!ctx.kind&&(this.has(ctx.unit,'PATHOGEN')||ctx.card?.keywords?.includes('PATHOGEN')||ctx.card?.tags?.includes('pathogen')));}
    applyMutation(sideIndex,u,amount=200){
      if(!u||this.has(u,'SYNTHETIC'))return;
      u.mutations??=[];u.mutations.push({attack:amount,expiresAt:(this.side(sideIndex).turnsStarted||0)+1});
      u.attackBonus-=amount;u.debuffed=true;u.mutated=true;
    }
    expireMutations(sideIndex,u){
      const turn=this.side(sideIndex).turnsStarted||0;
      for(const mutation of u.mutations||[])if(mutation.expiresAt<=turn)u.attackBonus+=mutation.attack;
      u.mutations=(u.mutations||[]).filter(mutation=>mutation.expiresAt>turn);
      u.mutated=u.mutations.length>0;u.debuffed=!!(u.mutated||u.infested||u.permanentDebuffed);
    }
    damageUnit(sideIndex,lane,amount,ctx={}){
      return this.resolve(()=>this.damageUnitResolved(sideIndex,lane,amount,ctx));
    }
    damageUnitResolved(sideIndex,lane,amount,ctx={}){
      this.syncHealthAuras();
      const s=this.side(sideIndex),u=s.board[lane];if(!u)return 0;let dmg=Math.max(0,Math.round(amount));
      const pathogen=this.isPathogen(ctx);if(pathogen&&this.has(u,'SYNTHETIC'))return 0;
      if(dmg>0&&this.has(u,'ARMOR')&&!u.armorUsed
         &&!(ctx.unit&&this.has(ctx.unit,'PIERCING'))){dmg=Math.max(0,dmg-400);u.armorUsed=true;}
      u.currentHealth-=dmg;if(dmg>0){u.cloaked=false;if(pathogen&&!ctx.noMutation)this.applyMutation(sideIndex,u);}
      const c=this.card(u.cardId);if(dmg>0&&c.effect?.onDamaged?.kind==='DEBUFF_SELF')u.attackBonus-=c.effect.onDamaged.attack||0;
      if(u.currentHealth<=0)this.destroyUnit(sideIndex,lane,{sourceSide:ctx.sourceSide,sourceUnit:ctx.unit});
      return dmg;
    }
    destroyUnit(sideIndex,lane,ctx={}){
      const s=this.side(sideIndex),u=s.board[lane];if(!u)return null;const c=this.card(u.cardId);s.board[lane]=null;s.unitsLost++;
      if(!ctx.transform&&!ctx.sacrifice)s.discard.push(c.id);s.discard.push(...u.equipment);
      this.log(`${c.name} est détruit.`,sideIndex===0?'DANGER':'SUCCESS');
      // Detach every casualty before processing deaths, so a counterattack cannot hit a replacement.
      this.pendingDeaths.push({sideIndex,lane,ctx,s,u,c});
      this.syncHealthAuras();
      if(this.resolutionDepth===0&&!this.resolvingDeaths&&!this.syncingHealthAuras){this.flushDeaths();this.checkEnd();}
      return u;
    }
    flushDeaths(){
      if(this.resolvingDeaths)return;
      this.resolvingDeaths=true;
      try{while(this.pendingDeaths.length){this.resolveDeath(this.pendingDeaths.shift());this.syncHealthAuras();}}
      finally{this.resolvingDeaths=false;}
    }
    resolveDeath({sideIndex,lane,ctx,s,u,c}){
      if(ctx.sourceUnit){ctx.sourceUnit.kills=(ctx.sourceUnit.kills||0)+1;if(this.has(ctx.sourceUnit,'TROPHY'))this.gainTrophy(ctx.sourceUnit.owner);const killEffect=this.card(ctx.sourceUnit.cardId).effect?.onKill;if(killEffect?.kind==='DRAW_IF_FACTION'&&this.isFaction(u,killEffect.faction))this.draw(ctx.sourceUnit.owner,killEffect.count||1);}
      if(s.location?.cardId==='L_SEVASTOPOL'&&this.has(u,'SYNTHETIC'))this.draw(sideIndex,1);
      if(s.location?.cardId==='L_GUNNISON'||this.modifiers.includes('deathPing'))this.damageHero(sideIndex,100,{kind:'DEATH_PING'});
      if(!ctx.noDeath){
        if(this.has(u,'ACID')){const opp=this.enemy(sideIndex);if(opp.board[lane])this.damageUnit(1-sideIndex,lane,400,{kind:'ACID'});else this.damageHero(1-sideIndex,250,{kind:'ACID'});}
        this.applyEffect(sideIndex,c.effect?.onDeath,{lane,unit:u,card:c});
        for(const eqId of u.equipment){const fx=this.card(eqId).effect?.onCarrierDeath;if(fx)this.applyEffect(sideIndex,fx,{lane,unit:u,card:this.card(eqId)});}
      }
      if(c.effect?.reborn&&!s.rebornUsed[c.id]){s.hand.push(c.id);s.rebornUsed[c.id]=true;}
    }
    gainTrophy(sideIndex){const s=this.side(sideIndex);s.trophies++;s.totalTrophies++;this.log(`${s.name} gagne un Trophée (${s.trophies}).`,'TROPHY');for(let lane=0;lane<3;lane++){const u=s.board[lane],fx=u&&this.card(u.cardId).effect?.onTrophy;if(fx?.kind==='BUFF_SELF')this.buffUnit(sideIndex,lane,fx.attack||0,fx.health||0,fx.grant||[]);}if(s.trophies%2===0)this.draw(sideIndex,1);if(s.location?.cardId==='L_PRESERVE')this.healHero(sideIndex,200);}
    legalAttacks(sideIndex,lane){
      const s=this.side(sideIndex),e=this.enemy(sideIndex),u=s.board[lane];if(!u||!u.ready||u.attacked||u.stunned>0||u.stunBlocked||this.state.active!==sideIndex||this.state.winner!==null)return [];
      if(this.card(u.cardId).crewRequired&&!this.hasCrew(sideIndex,this.card(u.cardId),u))return [];
      const targets=[];const flying=this.has(u,'FLYING');
      for(let i=0;i<3;i++){if(!e.board[i])continue;if(!flying&&i!==lane)continue;if(e.board[i].cloaked&&!this.canSeeCloak(sideIndex,e.board[i]))continue;targets.push({kind:'UNIT',lane:i});}
      const guards=e.board.map((x,i)=>x&&this.has(x,'GUARD')?i:null).filter(i=>i!==null);
      if(!e.board[lane]&&guards.length===0)targets.push({kind:'HERO'});
      return targets;
    }
    attack(sideIndex,lane,target){
      const result=this.resolve(()=>this.attackResolved(sideIndex,lane,target));this.notify();return result;
    }
    attackResolved(sideIndex,lane,target){
      const legal=this.legalAttacks(sideIndex,lane);if(!legal.some(t=>t.kind===target.kind&&(t.lane??-1)===(target.lane??-1)))return {ok:false,reason:'Cible d’attaque invalide.'};
      const s=this.side(sideIndex),e=this.enemy(sideIndex),att=s.board[lane],ac=this.card(att.cardId);att.ready=false;att.attacked=true;att.cloaked=false;
      if(target.kind==='HERO'){
        let dmg=this.unitAttack(sideIndex,att);if(ac.effect?.directBonus)dmg+=ac.effect.directBonus;this.log(`${ac.name} attaque directement.`,sideIndex===0?'PLAYER':'ENEMY');this.damageHero(1-sideIndex,dmg,{sourceSide:sideIndex,unit:att});
      }else{
        const def=e.board[target.lane],dc=this.card(def.cardId);const aDmg=this.unitAttack(sideIndex,att,def),dDmg=this.unitAttack(1-sideIndex,def,att);
        this.log(`${ac.name} affronte ${dc.name}.`,'COMBAT');
        const dealt=this.damageUnit(1-sideIndex,target.lane,aDmg,{sourceSide:sideIndex,unit:att,kind:this.has(att,'PATHOGEN')?'PATHOGEN':'COMBAT'});
        const received=this.damageUnit(sideIndex,lane,dDmg,{sourceSide:1-sideIndex,unit:def,kind:this.has(def,'PATHOGEN')?'PATHOGEN':'COMBAT'});
        if(e.board[target.lane]===def&&this.has(att,'DEATHTOUCH')&&dealt>0&&!dc.tags.includes('boss'))this.destroyUnit(1-sideIndex,target.lane,{sourceSide:sideIndex,sourceUnit:att});
        if(s.board[lane]===att&&this.has(def,'DEATHTOUCH')&&received>0&&!ac.tags.includes('boss'))this.destroyUnit(sideIndex,lane,{sourceSide:1-sideIndex,sourceUnit:def});
        this.flushDeaths();
      }
      if(s.board[lane])for(const eqId of s.board[lane].equipment){const fx=this.card(eqId).effect?.afterAttack;if(fx)this.applyEffect(sideIndex,fx,{lane,unit:s.board[lane],card:this.card(eqId)});}
      this.checkEnd();return {ok:true};
    }
    beginTurn(sideIndex,first=false){
      return this.resolve(()=>this.beginTurnResolved(sideIndex,first));
    }
    beginTurnResolved(sideIndex,first=false){
      if(this.state.winner!==null)return;this.state.active=sideIndex;const s=this.side(sideIndex);s.flags={};
      s.turnsStarted=(s.turnsStarted||0)+1;
      s.maxEnergy=Math.min(D.rules.maxEnergy,s.maxEnergy+1);s.energy=s.maxEnergy+s.nextEnergy;s.nextEnergy=0;
      for(const u of s.board.filter(Boolean)){
        u.tempAttack=0;u.tempGranted=[];u.attacked=false;u.forced=false;
        u.stunBlocked=u.stunned>0;if(u.stunBlocked){u.stunned--;u.ready=false;}else u.ready=true;
        if(this.has(u,'REGEN'))u.currentHealth=Math.min(this.unitMaxHealth(sideIndex,u),u.currentHealth+300);
      }
      if(!first)this.draw(sideIndex,1);
      if(s.location?.cardId==='L_DERELICT'&&s.hand.length<6)s.hand.push('X_OVOMORPH');
      if(s.location?.cardId==='L_YAUTJA_SHIP')this.healHero(sideIndex,s.board.filter(u=>u&&this.isFaction(u,'YAUTJA')).length*150);
      const upkeep=s.location&&this.card(s.location.cardId)?.effect?.locationUpkeep;
      if(upkeep?.heal)this.healHero(sideIndex,upkeep.heal);
      for(let lane=0;lane<3;lane++){const u=s.board[lane];if(u)this.applyEffect(sideIndex,this.card(u.cardId).effect?.turnStart,{lane,unit:u,card:this.card(u.cardId)});}
      if(this.modifiers.includes('pathogen'))for(let i=0;i<3;i++){const u=s.board[i];if(u&&!this.has(u,'SYNTHETIC')){u.attackBonus-=100;u.debuffed=true;u.permanentDebuffed=true;}}
      if(this.modifiers.includes('enemyBrood')&&sideIndex===1&&this.state.round%2===0)this.summonFirstFree(1,'X_FACEHUGGER');
      if(s.location?.cardId==='L_PROCESSOR'&&this.state.round>=8)this.damageHero(sideIndex,500,{kind:'PROCESSOR'});
      this.log(`Tour de ${s.name} — ${s.energy} énergie.`,'TURN');this.notify();
    }
    endTurn(sideIndex){
      if(this.state.active!==sideIndex||this.state.winner!==null)return false;
      const ending=this.side(sideIndex);for(const u of ending.board.filter(Boolean)){u.tempAttack=0;this.expireMutations(sideIndex,u);}if(ending.status.silenceTurns>0){ending.status.silenceTurns--;if(ending.status.silenceTurns<=0){ending.status.silenceFaction=null;}}
      this.state.halfTurn++;if(sideIndex===1)this.state.round++;
      this.beginTurn(1-sideIndex,false);return true;
    }
    checkEnd(){
      if(this.state.winner!==null||this.resolutionDepth>0||this.resolvingDeaths||this.pendingDeaths.length)return;
      const a=this.side(0),b=this.side(1);let winner=null,reason='';
      if(a.life<=0&&b.life<=0){winner=-1;reason='Destruction mutuelle';}
      else if(a.life<=0){winner=1;reason='Commandant neutralisé';}
      else if(b.life<=0){winner=0;reason='Directive adverse neutralisée';}
      if(winner!==null){this.state.winner=winner;this.state.reason=reason;this.log(winner===-1?'Le duel se termine sans survivant.':`${this.side(winner).name} remporte le duel.`,'SYSTEM');this.onGameOver({winner,reason,state:this.state});}
    }
    // These evaluators are pure: no trial moves, RNG consumption or opposing
    // hand/deck inspection. Equal scores keep the seeded hand and lane order.
    aiScore(card,target={kind:'NONE'},sideIndex=1){
      if(!card)return 0;
      const s=this.side(sideIndex),e=this.enemy(sideIndex),fx=card.effect||{};
      const allies=s.board.filter(Boolean),enemies=e.board.filter(Boolean);
      const unit=target?.kind==='FRIENDLY_UNIT'?s.board[target.lane]:e.board[target?.lane];
      const value=(si,u)=>u?1+this.card(u.cardId).cost+(this.unitAttack(si,u)+Math.max(0,u.currentHealth))/1800+u.equipment.length*.6:0;
      const damage=(si,u,amount,pathogen=this.isPathogen({card}))=>{
        if(!u||(pathogen&&this.has(u,'SYNTHETIC')))return 0;
        return Math.max(0,amount-(this.has(u,'ARMOR')&&!u.armorUsed?400:0));
      };
      const impact=(si,u,amount)=>{
        const dealt=damage(si,u,amount);if(!dealt)return 0;
        return Math.min(dealt,u.currentHealth)/650+(dealt>=u.currentHealth?value(si,u)+2:0);
      };
      const canUseAttack=u=>{
        if(!u||u.attacked||u.stunned>0||u.stunBlocked)return false;
        const lane=s.board.indexOf(u);
        return e.board.some((x,i)=>x&&(i===lane||this.has(u,'FLYING'))&&(!x.cloaked||this.canSeeCloak(sideIndex,x)))
          ||(!e.board[lane]&&!enemies.some(x=>this.has(x,'GUARD')));
      };
      const openSlots=s.board.filter(u=>!u).length;
      const summonScore=(id,count=1)=>this.deploymentError(sideIndex,this.card(id))?0:Math.min(openSlots,count)*3;
      const drawScore=count=>Math.min(count,s.deck.length)*1.8;
      let score=0;
      if(card.type==='UNIT'){
        const opponent=e.board[target?.lane];
        score=3+(card.attack+card.health)/1200-this.effectiveCost(sideIndex,card)*.18;
        const arrival=s.status.silenceFaction===card.faction?null:fx.onPlay;
        if(arrival?.kind==='DAMAGE_HERO'){
          score+=arrival.amount/500;
          if(arrival.amount>=e.life+e.shield)score=10000;
        }
        if(opponent){
          if(arrival?.kind==='DAMAGE_OPPOSING')score+=impact(1-sideIndex,opponent,arrival.amount);
          if(s.status.silenceFaction!==card.faction&&card.keywords.includes('AMBUSH'))score+=impact(1-sideIndex,opponent,300);
          if(this.unitAttack(1-sideIndex,opponent)>=s.life+s.shield)score+=4;
        }else if(card.keywords.includes('RUSH')&&!enemies.some(u=>this.has(u,'GUARD'))){
          score+=card.attack/700;
          if(card.attack+(fx.directBonus||0)>=e.life+e.shield)score=10000;
        }else score+=.35;
      }else if(card.type==='EQUIPMENT'){
        if(!unit)return 0;
        score=(card.attack+card.health)/600+card.keywords.filter(k=>!this.has(unit,k)).length*.6;
        if(fx.onEquip?.kind==='DAMAGE_RANDOM_ENEMY')score+=enemies.length?1:fx.onEquip.amount/700;
        if(card.attack&&unit.ready&&canUseAttack(unit))score+=.8;
        // Compare visible combat breakpoints using a detached equipment preview.
        // Never mutate the unit/board, consume RNG, or inspect the opposing hand.
        const preview={...unit,equipment:[...unit.equipment,card.id],currentHealth:unit.currentHealth+(card.health||0),armorUsed:card.keywords.includes('ARMOR')?false:unit.armorUsed};
        const lane=s.board.indexOf(unit),opponent=e.board[lane];
        if(opponent){
          const dealtBefore=damage(1-sideIndex,opponent,this.unitAttack(sideIndex,unit,opponent),this.has(unit,'PATHOGEN'));
          const dealtAfter=damage(1-sideIndex,opponent,this.unitAttack(sideIndex,preview,opponent),this.has(preview,'PATHOGEN'));
          const killBefore=dealtBefore>=opponent.currentHealth||(dealtBefore>0&&this.has(unit,'DEATHTOUCH')&&!this.card(opponent.cardId).tags.includes('boss'));
          const killAfter=dealtAfter>=opponent.currentHealth||(dealtAfter>0&&this.has(preview,'DEATHTOUCH')&&!this.card(opponent.cardId).tags.includes('boss'));
          const receivedBefore=damage(sideIndex,unit,this.unitAttack(1-sideIndex,opponent,unit),this.has(opponent,'PATHOGEN'));
          const receivedAfter=damage(sideIndex,preview,this.unitAttack(1-sideIndex,opponent,preview),this.has(opponent,'PATHOGEN'));
          const lostBefore=receivedBefore>=unit.currentHealth||(receivedBefore>0&&this.has(opponent,'DEATHTOUCH')&&!this.card(unit.cardId).tags.includes('boss'));
          const lostAfter=receivedAfter>=preview.currentHealth||(receivedAfter>0&&this.has(opponent,'DEATHTOUCH')&&!this.card(unit.cardId).tags.includes('boss'));
          if(killAfter&&!killBefore)score+=2+value(1-sideIndex,opponent)*.3;
          if(lostBefore&&!lostAfter)score+=2+value(sideIndex,unit)*.3;
          if(lostAfter&&!killAfter)score*=.5;
        }else if(unit.ready&&!unit.attacked&&!unit.stunned&&!unit.stunBlocked&&!enemies.some(u=>this.has(u,'GUARD'))&&this.unitAttack(sideIndex,preview)+(this.card(unit.cardId).effect?.directBonus||0)>=e.life+e.shield)score=10000;
        if(fx.seeCloak&&enemies.some(u=>u.cloaked)&&!allies.some(u=>u.equipment.some(id=>this.card(id).effect?.seeCloak)))score+=2;
      }else if(card.type==='LOCATION'){
        if(s.location?.cardId===card.id)return 0;
        const available=[...s.hand,...s.deck].map(id=>this.card(id));
        const hasFuture=(predicate)=>available.some(c=>c&&predicate(c));
        const factionCount=f=>allies.filter(u=>this.isFaction(u,f)).length;
        const missing=s.maxLife-s.life;
        switch(card.id){
          case 'L_XENO_HIVE': score=allies.filter(u=>this.has(u,'HIVE')).length+Number(hasFuture(c=>c.keywords.includes('HIVE')))*2;break;
          case 'L_HADLEYS_HOPE': score=allies.filter(u=>this.card(u.cardId).tags.includes('uscm')).length*1.2;break;
          case 'L_PROTO_LAB': score=(factionCount('HUMAN')+factionCount('YAUTJA'))*1.5;break;
          case 'L_PRESERVE': score=allies.some(u=>this.has(u,'TROPHY'))?Math.min(missing,600)/300+.5:0;break;
          case 'L_YAUTJA_SHIP': score=Math.min(missing,150*factionCount('YAUTJA'))/250;break;
          case 'L_DERELICT': score=s.hand.length<6?2.5:0;break;
          case 'L_FIORINA': score=allies.filter(u=>!u.equipment.length).length*.9;break;
          case 'L_SULACO': score=hasFuture(c=>c.type==='EQUIPMENT'&&c.faction==='HUMAN')?2.4:0;break;
          case 'L_NOSTROMO': score=hasFuture(c=>c.type==='UNIT'&&c.tags.includes('nostromo'))?2.4:0;break;
          case 'L_JUGGERNAUT': score=hasFuture(c=>c.tags.includes('pathogen'))?2.4:0;break;
          case 'L_AURIGA': score=hasFuture(c=>c.faction==='HYBRID')?2.4:0;break;
          case 'L_BOUVET': score=hasFuture(c=>c.type==='UNIT'&&['YAUTJA','XENO'].includes(c.faction))?2.4:0;break;
          case 'L_VAL_VERDE': score=hasFuture(c=>c.type==='UNIT'&&c.faction==='YAUTJA')?2.4:0;break;
          case 'L_LA1997': score=e.life<5000?factionCount('YAUTJA')*.9:0;break;
          case 'L_SEVASTOPOL': score=allies.filter(u=>this.has(u,'SYNTHETIC')).length*.9;break;
          default: {
            const field=card.effect?.locationBuff;
            score=field?allies.filter(u=>this.isFaction(u,field.faction)).length*((field.attack||0)+(field.health||0))/400
              +Number(available.some(c=>c?.type==='UNIT'&&c.faction===field.faction))*1.8
              +Math.min(card.effect?.locationUpkeep?.heal||0,s.maxLife-s.life)/220:0;
            break;
          }
        }
        if(s.location)score-=1.5;
      }else if(card.type==='TACTIC'){
        switch(fx.kind){
          case 'DAMAGE_TARGET': score=unit?impact(1-sideIndex,unit,fx.amount+(unit.attacked?200:0)):0;break;
          case 'DAMAGE_LANE': score=unit?impact(1-sideIndex,unit,fx.amount+(this.card(unit.cardId).tags.includes('egg')||unit.cardId==='X_FACEHUGGER'?300:0)):0;break;
          case 'EXECUTE': score=unit&&unit.currentHealth<=fx.threshold?value(1-sideIndex,unit)+3:0;break;
          case 'TRANSFORM_DAMAGED': score=unit&&!this.has(unit,'SYNTHETIC')&&unit.currentHealth<this.unitMaxHealth(1-sideIndex,unit)?value(1-sideIndex,unit)+3:0;break;
          case 'STUN_TARGET': score=unit?impact(1-sideIndex,unit,fx.damage||0)+(unit.stunned?0:1+this.unitAttack(1-sideIndex,unit)/1600):0;break;
          case 'BUFF_AND_RUSH': score=unit&&canUseAttack(unit)?1+(fx.attack||0)/350+(!unit.ready?this.unitAttack(sideIndex,unit)/650:0):0;break;
          case 'BUFF_IF_KILL': score=unit&&unit.kills>0?(fx.attack+fx.health)/500:0;break;
          case 'UPGRADE_XENO': score=unit&&this.isFaction(unit,'XENO')?(fx.attack+fx.health)/500+1:0;break;
          case 'BUFF_TARGET': case 'HYBRIDIZE': score=unit?((fx.attack||0)+(fx.health||0))/500+(fx.grant||[]).filter(k=>!this.has(unit,k)).length*.8:0;break;
          case 'GRANT': score=unit?(fx.grant||[]).filter(k=>k==='CLOAK'?!unit.cloaked:!this.has(unit,k)).length*1.5:0;break;
          case 'REVEAL_AND_BUFF': score=enemies.filter(u=>u.cloaked).length*1.5+(unit?(fx.attack||0)/400:0);break;
          case 'FORCE_DUEL': score=unit?(canUseAttack(unit)?1:0)+(!this.has(unit,'GUARD')?1:0):0;break;
          case 'BUFF_ALL': case 'BUFF_TAG': case 'BUFF_MULTI_FACTION':
            score=allies.filter(u=>(!fx.faction||this.isFaction(u,fx.faction))&&(!fx.tag||this.card(u.cardId).tags.includes(fx.tag)||this.has(u,fx.tag))&&(!fx.factions||fx.factions.some(f=>this.isFaction(u,f)))&&(!fx.temporary||u.ready&&canUseAttack(u))).length*((fx.attack||0)+(fx.health||0))/450;break;
          case 'READY_ALL': score=allies.filter(u=>!this.has(u,'ARMOR')||u.armorUsed).length*.9;break;
          case 'STUN_ALL_DAMAGED': score=enemies.filter(u=>!u.stunned&&u.currentHealth<this.unitMaxHealth(1-sideIndex,u)).length*1.8;break;
          case 'SILENCE_FACTION': score=e.status.silenceFaction===fx.faction?0:1;break;
          case 'BOUNCE_FRIENDLY': score=unit&&(unit.currentHealth<this.unitMaxHealth(sideIndex,unit)*.5||unit.debuffed||unit.stunned)?2:0;break;
          case 'SUMMON': case 'SUMMON_MULTI': score=summonScore(fx.card,fx.count||1);break;
          case 'SUMMON_THREE_WORLDS': score=Math.min(openSlots,3)*3;break;
          case 'REVIVE_STRONGEST': score=openSlots&&s.discard.some(id=>this.card(id)?.faction===fx.faction&&this.card(id)?.type==='UNIT'&&!this.deploymentError(sideIndex,this.card(id)))?3.5:0;break;
          case 'SACRIFICE_SUMMON': score=unit&&!this.deploymentError(sideIndex,this.card(fx.card))?this.card(fx.card).cost+2-value(sideIndex,unit):0;break;
          case 'DRAW': case 'MOTION_SCAN': score=drawScore(fx.count||1)+(fx.kind==='MOTION_SCAN'?enemies.filter(u=>u.cloaked&&this.card(u.cardId).cost<=(fx.maxCost||3)).length:0);break;
          case 'DRAW_TYPE': score=s.deck.some(id=>this.card(id).type===fx.type)?2:0;break;
          case 'DRAW_LOCATION_ENERGY': score=(s.deck.some(id=>this.card(id).type==='LOCATION')?2:0)+(s.hand.some(id=>id!==card.id&&this.card(id).cost>s.energy)?1:0);break;
          case 'CREATE_RANDOM': score=(fx.count||1)*2;break;
          case 'DAMAGE_ALL': case 'DAMAGE_STRONGEST': case 'DEBUFF_ALL': case 'DAMAGE_ALL_HEROES': {
            const heroDamage=[0,0],casualties=[];
            if(fx.kind==='DAMAGE_ALL_HEROES'){
              if(s.life+s.shield<=fx.amount)return 0;
              heroDamage[0]=fx.amount;heroDamage[1]=fx.amount;
              score=fx.amount/(e.life+e.shield)*3-fx.amount/(s.life+s.shield)*3;
            }
            for(const si of [sideIndex,1-sideIndex]){
              if(fx.kind==='DEBUFF_ALL'&&card.id!=='T_E_BLACK_GOO'&&si===sideIndex)continue;
              let units=this.side(si).board.filter(Boolean);
              if(fx.kind==='DAMAGE_STRONGEST')units=units.sort((a,b)=>this.unitAttack(si,b)-this.unitAttack(si,a)).slice(0,1);
              const amount=fx.kind==='DAMAGE_ALL_HEROES'?600:fx.amount||fx.damage||0;
              const sum=units.reduce((n,u)=>n+(fx.kind==='DEBUFF_ALL'&&this.has(u,'SYNTHETIC')?0:impact(si,u,amount)+(fx.kind==='DEBUFF_ALL'?Math.min(fx.attack||0,this.unitAttack(si,u))/350:0)),0);
              for(const u of units)if(!(fx.kind==='DEBUFF_ALL'&&this.has(u,'SYNTHETIC'))&&damage(si,u,amount)>=u.currentHealth)casualties.push({si,u,lane:this.side(si).board.indexOf(u)});
              score+=(si===sideIndex?-1:1)*sum;
              if(fx.discardLocations&&this.side(si).location&&!this.locationLocked(si))score+=(si===sideIndex?-1:1)*1.2;
            }
            // Visible first-wave death pings matter even when the printed
            // commander damage alone looks safe. No speculative state mutation.
            for(const dead of casualties){
              if(this.modifiers.includes('deathPing')||(this.side(dead.si).location?.cardId==='L_GUNNISON'&&!fx.discardLocations))heroDamage[dead.si]+=100;
              const opposite=this.side(1-dead.si).board[dead.lane];
              if(this.has(dead.u,'ACID')&&(!opposite||casualties.some(x=>x.u===opposite)))heroDamage[1-dead.si]+=250;
            }
            if(heroDamage[sideIndex]>=s.life+s.shield)return 0;
            if(heroDamage[1-sideIndex]>=e.life+e.shield)score=10000;
            break;
          }
          // No direct-heal card is in the launch set; these guards keep pure
          // healing effects from becoming free positive scores at full health.
          case 'HEAL_HERO': score=Math.min(fx.amount||0,s.maxLife-s.life)/300;break;
          case 'HEAL_TARGET': score=unit?Math.min(fx.amount||0,this.unitMaxHealth(sideIndex,unit)-unit.currentHealth)/300:0;break;
          case 'REPAIR_UNIT': score=unit?Math.min(fx.amount||0,this.unitMaxHealth(sideIndex,unit)-unit.currentHealth)/300:0;break;
          case 'REPOSITION': score=unit&&openSlots?(!unit.ready?1.5:0.8):0;break;
          case 'SCAN_REVEAL': score=enemies.filter(u=>u.cloaked).length*1.3+drawScore(fx.draw||0);break;
          case 'SUPPLY_SEARCH': score=s.deck.some(id=>this.card(id)?.type==='EQUIPMENT')?2.4:0;break;
          case 'FORTIFY': score=Math.min(fx.amount||0,1200-s.shield)/450*(s.life<s.maxLife*.7?1.6:0.7);break;
          case 'ARMOR_BREAK': score=unit?impact(1-sideIndex,unit,fx.amount||0)+(this.has(unit,'ARMOR')&&!unit.armorUsed?1.3:0):0;break;
          case 'DAMAGE_ALL_ENEMY_UNITS': score=enemies.reduce((n,u)=>n+impact(1-sideIndex,u,fx.amount||0),0);break;
          default: score=0;
        }
        if(this.isOffensiveTactic(card)&&enemies.some(u=>this.card(u.cardId).effect?.shieldTactic&&!u.tacticShieldUsed))score=Math.min(score,1);
      }
      return Number.isFinite(score)?Math.max(0,score):0;
    }
    aiTargetFor(card,sideIndex=1){
      const targets=this.validTargets(card,sideIndex);
      let best=null,bestScore=0;
      for(const target of targets){const score=this.aiScore(card,target,sideIndex);if(score>bestScore){best=target;bestScore=score;}}
      return best;
    }
    aiAttackTarget(lane,sideIndex=1){
      const s=this.side(sideIndex),e=this.enemy(sideIndex),att=s.board[lane];
      if(!att)return null;
      const ac=this.card(att.cardId);
      const value=(si,u)=>1+this.card(u.cardId).cost+(this.unitAttack(si,u)+Math.max(0,u.currentHealth))/1800+u.equipment.length*.6;
      const damage=(source,target,amount)=>this.has(source,'PATHOGEN')&&this.has(target,'SYNTHETIC')?0:Math.max(0,amount-(this.has(target,'ARMOR')&&!target.armorUsed?400:0));
      let best=null,bestScore=0;
      for(const target of this.legalAttacks(sideIndex,lane)){
        let score=0;
        if(target.kind==='HERO'){
          const amount=this.unitAttack(sideIndex,att)+(ac.effect?.directBonus||0);
          if(amount<=0)continue;
          if(amount>=e.life+e.shield)return target;
          score=1+amount/500;
        }else{
          const def=e.board[target.lane],dc=this.card(def.cardId);
          const rawDealt=this.unitAttack(sideIndex,att,def),rawReceived=this.unitAttack(1-sideIndex,def,att);
          const dealt=damage(att,def,rawDealt),received=damage(def,att,rawReceived);
          if(dealt<=0)continue;
          let kill=dealt>=def.currentHealth||(this.has(att,'DEATHTOUCH')&&!dc.tags.includes('boss'));
          let lost=received>=att.currentHealth||(received>0&&this.has(def,'DEATHTOUCH')&&!ac.tags.includes('boss'));
          if(lost&&!kill&&target.lane===lane&&this.has(att,'ACID'))kill=dealt+400>=def.currentHealth;
          if(kill&&!lost&&target.lane===lane&&this.has(def,'ACID'))lost=received+Math.max(0,400-(this.has(att,'ARMOR')&&!att.armorUsed&&rawReceived<=0?400:0))>=att.currentHealth;
          if(lost&&!kill)continue;
          score=kill?value(1-sideIndex,def)+2:Math.min(dealt,def.currentHealth)/650;
          score-=lost?value(sideIndex,att)+1.8:Math.min(received,att.currentHealth)/800;
          if(kill&&this.has(att,'TROPHY'))score+=.8;
          if(kill&&this.has(def,'GUARD')&&!e.board.some(u=>u&&u!==def&&this.has(u,'GUARD')))score+=s.board.filter((u,i)=>u&&i!==lane&&u.ready&&!u.attacked&&!u.stunned&&!u.stunBlocked&&!e.board[i]).length*2;
        }
        if(score>bestScore){best=target;bestScore=score;}
      }
      return best;
    }
    async takeAITurn(step=()=>Promise.resolve(),sideIndex=1){
      if(![0,1].includes(sideIndex)||this.state.active!==sideIndex||this.state.winner!==null)return;
      const ai=this.side(sideIndex);let safety=0;
      while(safety++<60&&this.state.winner===null&&this.state.active===sideIndex){
        // Take a guaranteed direct win (including several ready lanes) before
        // spending energy or exposing the result to a symmetric damage spell.
        const direct=ai.board.map((u,lane)=>({u,lane})).filter(x=>x.u&&this.legalAttacks(sideIndex,x.lane).some(t=>t.kind==='HERO'));
        const directDamage=direct.reduce((n,x)=>n+this.unitAttack(sideIndex,x.u)+(this.card(x.u.cardId).effect?.directBonus||0),0);
        if(direct.length&&directDamage>=this.enemy(sideIndex).life+this.enemy(sideIndex).shield){
          const choice=direct.find(x=>this.unitAttack(sideIndex,x.u)+(this.card(x.u.cardId).effect?.directBonus||0)>0);
          if(choice){this.attack(sideIndex,choice.lane,{kind:'HERO'});await step('attack',choice.u);continue;}
        }
        const playable=ai.hand.map((id,i)=>{
          const card=this.card(id),check=this.canPlay(sideIndex,i);
          if(!check.ok)return null;
          const target=this.aiTargetFor(card,sideIndex);
          return target?{i,card,target,score:this.aiScore(card,target,sideIndex)}:null;
        }).filter(x=>x&&x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i);
        if(!playable.length)break;
        const choice=playable[0],result=this.playCard(sideIndex,choice.i,choice.target);
        if(!result.ok)break;
        await step('play',choice.card);
      }
      // Reconsider previously blocked lanes after a Garde is removed.
      for(let attacks=0;attacks<3&&this.state.winner===null&&this.state.active===sideIndex;attacks++){
        const choices=ai.board.map((u,lane)=>({u,lane,target:u?this.aiAttackTarget(lane,sideIndex):null})).filter(x=>x.target);
        if(!choices.length)break;
        const lethal=choices.find(x=>x.target.kind==='HERO'&&this.unitAttack(sideIndex,x.u)+(this.card(x.u.cardId).effect?.directBonus||0)>=this.enemy(sideIndex).life+this.enemy(sideIndex).shield);
        const choice=lethal||choices[0];
        this.attack(sideIndex,choice.lane,choice.target);await step('attack',choice.u);
      }
      if(this.state.winner===null&&this.state.active===sideIndex){this.endTurn(sideIndex);await step('end',null);}
    }
    serialize(){return U.clone(this.state);}
  }

  window.AVPEngine={U,CARD,RANK,expandDeck,allowedForIdentity,validateDeck,openBooster,buildAiDeck,Battle};
})();
