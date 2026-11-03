/* Versioned, bounded checkpoints. Imported JSON never becomes an executable object. */
(function(){
  'use strict';
  const E=window.AVPEngine,D=window.AVP_DATA;
  const fail=()=>{throw new Error('Point de reprise du duel invalide ou incompatible.');};
  const record=v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail();return v;};
  const integer=(v,min=0,max=1000000)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail();return v;};
  const text=(v,max=200)=>{if(typeof v!=='string'||v.length>max||/[\u0000-\u001f\u007f]/.test(v))fail();return v;};
  const list=(v,max,convert)=>{if(!Array.isArray(v)||v.length>max)fail();return v.map(convert);};
  const bool=v=>{if(typeof v!=='boolean')fail();return v;};
  const card=(id,type)=>{if(!E.CARD.has(id)||(type&&E.CARD.get(id).type!==type))fail();return id;};
  const keyword=k=>{if(!Object.hasOwn(D.keywords,k))fail();return k;};
  const faction=f=>{if(!Object.hasOwn(D.factions,f))fail();return f;};
  function unit(raw,owner,ids){
    const v=record(raw),out={uid:text(v.uid,80),cardId:card(v.cardId,'UNIT'),owner:integer(v.owner,owner,owner)};
    if(!out.uid||ids.has(out.uid))fail();ids.add(out.uid);
    for(const key of ['currentHealth','attackBonus','healthBonus','tempAttack','stunned','kills'])out[key]=integer(v[key],key.endsWith('Bonus')||key==='tempAttack'?-1000000:0);
    if(out.currentHealth===0)fail();
    for(const key of ['ready','attacked','cloaked','armorUsed','debuffed','mutated','rebornUsed','forced','tacticShieldUsed'])out[key]=bool(v[key]);
    for(const key of ['stunBlocked','infested','permanentDebuffed'])if(v[key]!==undefined)out[key]=bool(v[key]);
    if(v.auraHealth!==undefined)out.auraHealth=integer(v.auraHealth,-1000000);
    out.granted=list(v.granted,64,keyword);out.tempGranted=list(v.tempGranted,64,keyword);
    out.equipment=list(v.equipment,100,id=>card(id,'EQUIPMENT'));
    if(v.ammoPacks!==undefined)out.ammoPacks=list(v.ammoPacks,16,rawPack=>{
      const pack=record(rawPack),id=card(pack.cardId,'EQUIPMENT'),src=E.CARD.get(id);
      if(src.cardClass!=='MUNITION'||src.ammoType!==pack.ammoType)fail();
      if(pack.ammoBonus!==undefined&&pack.ammoBonus!==src.ammoBonus)fail();
      return {cardId:id,ammoType:src.ammoType,
        remaining:integer(pack.remaining,0,src.rounds),ammoBonus:src.ammoBonus||0};
    });
    const equippedAmmo=out.equipment.filter(id=>E.CARD.get(id).cardClass==='MUNITION');
    const matches=new Map();
    for(const id of equippedAmmo)matches.set(id,(matches.get(id)||0)+1);
    for(const pack of out.ammoPacks||[]){
      const rem=matches.get(pack.cardId)||0;if(!rem)fail();matches.set(pack.cardId,rem-1);
    }
    if([...matches.values()].some(n=>n!==0))fail();
    out.mutations=list(v.mutations,100,m=>({attack:integer(record(m).attack),expiresAt:integer(m.expiresAt)}));
    if(v.extraFactions!==undefined)out.extraFactions=list(v.extraFactions,100,faction);
    return out;
  }
  function side(raw,index,ids){
    const v=record(raw),out={name:text(v.name,160),isAI:bool(v.isAI)};
    if(out.isAI!==(index===1))fail();
    for(const key of ['life','maxLife','shield','energy','maxEnergy','nextEnergy','trophies','totalTrophies','fatigue','cardsPlayed','unitsLost','turnsStarted'])out[key]=integer(v[key]);
    for(const resource of ['biomass','plasma','honor'])
      if(v[resource]!==undefined)out[resource]=integer(v[resource],0,12);
    if(out.life<1||out.life>out.maxLife||out.maxEnergy>D.rules.maxEnergy)fail();
    for(const key of ['deck','hand','discard'])out[key]=list(v[key],500,id=>card(id));
    out.board=list(v.board,3,u=>u===null?null:unit(u,index,ids));if(out.board.length!==3)fail();
    out.location=v.location===null?null:{cardId:card(record(v.location).cardId,'LOCATION')};
    out.flags={};record(v.flags);
    for(const key of ['bouvetUsed','sulacoUsed','aurigaUsed','nostromoUsed','valVerdeUsed','modCloak'])if(v.flags[key]!==undefined)out.flags[key]=bool(v.flags[key]);
    out.status={};record(v.status);
    if(v.status.silenceFaction!==undefined)out.status.silenceFaction=v.status.silenceFaction===null?null:faction(v.status.silenceFaction);
    if(v.status.silenceTurns!==undefined)out.status.silenceTurns=integer(v.status.silenceTurns,0,100);
    out.rebornUsed={};record(v.rebornUsed);
    for(const [id,used] of Object.entries(v.rebornUsed)){card(id,'UNIT');out.rebornUsed[id]=bool(used);}
    return out;
  }
  function validate(raw){
    const v=record(raw);if(v.schema!=='avp-duel'||v.version!==1)fail();
    const out={schema:'avp-duel',version:1,id:text(v.id,80),rngState:integer(v.rngState,0,4294967295)};
    if(!/^[a-zA-Z0-9_-]+$/.test(out.id))fail();
    if(typeof v.difficulty!=='number'||!Number.isFinite(v.difficulty)||v.difficulty<.5||v.difficulty>5)fail();out.difficulty=v.difficulty;
    const modifiers=new Set(D.campaign.flatMap(m=>m.modifiers));
    out.modifiers=list(v.modifiers,12,m=>{if(!modifiers.has(m))fail();return m;});
    const s=record(v.state);if(s.winner!==null)fail();
    out.state={active:integer(s.active,0,1),round:integer(s.round,1,1000000),halfTurn:integer(s.halfTurn),winner:null,reason:text(s.reason,200),startedAt:integer(s.startedAt,0,8640000000000000)};
    if(out.state.active!==out.state.halfTurn%2||out.state.round!==Math.floor(out.state.halfTurn/2)+1)fail();
    const ids=new Set();out.state.sides=list(s.sides,2,(v,i)=>side(v,i,ids));if(out.state.sides.length!==2)fail();
    out.state.log=list(s.log,60,l=>({id:text(record(l).id,80),text:text(l.text,600),tone:['INFO','SYSTEM','EFFECT','PLAYER','ENEMY','DANGER','SUCCESS','COMBAT','TROPHY','TURN'].includes(l.tone)?l.tone:'INFO',time:integer(l.time,0,8640000000000000)}));
    return out;
  }
  function capture(battle){
    if(battle.resolutionDepth||battle.pendingDeaths.length||battle.resolvingDeaths)throw new Error('Le duel est en cours de résolution.');
    return validate({schema:'avp-duel',version:1,id:battle.id,rngState:battle.rng.getState(),difficulty:battle.difficulty,modifiers:battle.modifiers,state:battle.state});
  }
  function restore(raw,callbacks={}){
    const v=validate(raw),b=Object.create(E.Battle.prototype);
    b.id=v.id;b.state=v.state;b.difficulty=v.difficulty;b.modifiers=v.modifiers;
    b.resolutionDepth=0;b.pendingDeaths=[];b.resolvingDeaths=false;b.syncingHealthAuras=false;b.notificationPending=false;
    b.rng=E.U.rng(1);b.rng.setState(v.rngState);
    for(const key of ['onChange','onLog','onGameOver'])b[key]=typeof callbacks[key]==='function'?callbacks[key]:()=>{};
    return b;
  }
  window.AVPDuelSave=Object.freeze({validate,capture,restore});
})();
