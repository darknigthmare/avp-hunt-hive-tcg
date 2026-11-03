/* Vague asymétrique : extension des règles du duel 1.3.
 * Patch explicite du moteur, injecté APRÈS engine.js et AVANT duel-save.js.
 * Le code historique et les sauvegardes v1 restent interprétables.
 * Aucune modification d'illustration ou d'asset.
 */
(function(){
'use strict';
const E=window.AVPEngine,D=window.AVP_DATA;
if(!D?.asymmetricEdition||D.asymmetricEdition.addedCount!==235||!E?.Battle||D.cards.length<891)throw new Error('Règles asymétriques : catalogue incompatible');
const P=E.Battle.prototype;
const older={
 makeSide:P.makeSide,makeUnit:P.makeUnit,allKeywords:P.allKeywords,unitAttack:P.unitAttack,
 validTargets:P.validTargets,deploymentError:P.deploymentError,canPlay:P.canPlay,
 playCardResolved:P.playCardResolved,summonAt:P.summonAt,attackResolved:P.attackResolved,
 resolveDeath:P.resolveDeath,aiScore:P.aiScore,applyEffectResolved:P.applyEffectResolved,
 isOffensiveTactic:P.isOffensiveTactic,legalAttacks:P.legalAttacks
};
const stage=c=>c?.evolutionStage||(/(?:X_OVOMORPH|X_FACEHUGGER|X_CHESTBURSTER)/.test(c?.id||'')
 ?c.id==='X_OVOMORPH'?'EGG':c.id==='X_FACEHUGGER'?'FACEHUGGER':'CHESTBURSTER':null);
const isEgg=c=>stage(c)==='EGG'||c?.tags?.includes('egg');
const clamp=(v,cap)=>Math.max(0,Math.min(cap,Number(v)||0));
const rem=(s,id)=>{let idx=s.hand.indexOf(id);if(idx>=0){s.hand.splice(idx,1);return true;}idx=s.deck.indexOf(id);if(idx>=0){s.deck.splice(idx,1);return true;}return false;};
const hasResult=(s,id)=>s.hand.includes(id)||s.deck.includes(id);
const isAvailableAmmo=(u,type,amount)=>((u?.ammoPacks)||[]).reduce((n,p)=>n+(p.ammoType===type?p.remaining:0),0)>=amount;
const activeAmmoPacks=u=>(u?.ammoPacks||[]).filter(p=>p.remaining>0);
function findWeapon(b,u,type,family=null){
 if(!u)return null;
 return (u.equipment||[]).map(id=>b.card(id)).find(c=>c?.slot==='WEAPON'&&c.ammoType===type
   &&(!family||c.weaponFamily===family));
}
function techniqueSource(b,si,effect){
 return b.side(si).board.find(u=>u&&findWeapon(b,u,effect.ammoType,effect.weaponFamily)
   &&isAvailableAmmo(u,effect.ammoType,effect.ammoCost));
}
function retireEmptyPacks(b,si,u){
 if(!u)return;
 const live=b.side(si).board.includes(u);
 for(const pack of u.ammoPacks||[]){
   if(pack.remaining>0)continue;
   const idx=u.equipment.indexOf(pack.cardId);
   if(idx>=0){
     u.equipment.splice(idx,1);
     // A destroyed carrier's equipment was already placed in the discard pile.
     if(live)b.side(si).discard.push(pack.cardId);
   }
 }
 u.ammoPacks=activeAmmoPacks(u);
}
function resultDeploymentError(b,si,effect,materialLanes){
 const result=b.card(effect.resultCardId);
 if(!result||result.type!=='UNIT'||!hasResult(b.side(si),result.id))return 'Résultat de fusion absent.';
 // Evaluate the ordinary deployment restrictions after removing the materials,
 // without mutating a live board during targeting or AI inspection.
 const preview=Object.create(b),removed=new Set(materialLanes);
 preview.side=index=>index===si
   ?{...b.side(index),board:b.side(index).board.map((u,lane)=>removed.has(lane)?null:u)}
   :b.side(index);
 return older.deploymentError.call(preview,si,result);
}
function fusionHostLane(b,si,effect,faceLane){
 return b.side(si).board.findIndex((u,lane)=>lane!==faceLane&&u
   &&b.card(u.cardId).cardClass==='HOTE'&&b.card(u.cardId).hostType===effect.hostType
   &&!b.has(u,'SYNTHETIC'));
}
P.combatWeaponState=function(sideIndex,u){
 const weapon=(u?.equipment||[]).map(id=>this.card(id)).find(c=>c?.slot==='WEAPON')||null;
 const installedMods=(u?.equipment||[]).map(id=>this.card(id)).filter(c=>c?.cardClass==='MODIFICATION');
 let mode='NONE',available=0,required=0,ready=true,reason='Attaque de base';
 if(weapon?.ammoType){
   mode='AMMO';required=weapon.ammoPerAttack||1;
   available=(u.ammoPacks||[]).reduce((n,p)=>n+(p.ammoType===weapon.ammoType?p.remaining:0),0);
   ready=available>=required;
   reason=ready?'Arme chargée':'Munitions compatibles insuffisantes : attaque de base uniquement';
 }else if(weapon?.plasmaPerAttack){
   mode='PLASMA';required=weapon.plasmaPerAttack;available=this.side(sideIndex)?.plasma||0;
   ready=available>=required;reason=ready?'Plasma disponible':'Plasma insuffisant : attaque de base uniquement';
 }else if(weapon){
   mode='MELEE';reason='Arme sans consommation de munitions';
 }
 return {weapon,mode,available,required,ready,reason,ammoType:weapon?.ammoType||null,
   compatibleRounds:mode==='AMMO'?available:0,installedMods,
   activeMods:ready&&weapon?installedMods.filter(c=>c.compatibleFamilies.includes(weapon.weaponFamily)):[]};
};
function loadableWeapon(b,u,sideIndex){
 const state=b.combatWeaponState(sideIndex,u);
 return state.ready?state.weapon:null;
}
function fireable(b,u,sideIndex){
 const s=b.side(sideIndex),w=loadableWeapon(b,u,sideIndex);
 if(!w)return null;
 if(w.ammoType){
   const pack=(u.ammoPacks||[]).find(p=>p.ammoType===w.ammoType&&p.remaining>0);
   const bonus=pack?.ammoBonus||0;
   return {weapon:w,kind:'AMMO',count:w.ammoPerAttack||1,bonus};
 }
 if(w.plasmaPerAttack)return {weapon:w,kind:'PLASMA',count:w.plasmaPerAttack,bonus:0};
 return {weapon:w,kind:'MELEE',count:0,bonus:0};
}
function spendAmmo(u,type,count){
 if(!isAvailableAmmo(u,type,count))return false;
 let remaining=count;
 for(const p of (u.ammoPacks||[])){
   if(p.ammoType!==type||p.remaining<=0)continue;
   const spent=Math.min(p.remaining,remaining);p.remaining-=spent;remaining-=spent;
   if(!remaining)break;
 }
 return true;
}
function spendShot(b,si,u,shot){
 if(!shot||!u)return;
 const s=b.side(si);
 if(shot.kind==='AMMO')spendAmmo(u,shot.weapon.ammoType,shot.count);
 if(shot.kind==='PLASMA')s.plasma=clamp((s.plasma||0)-shot.count,12);
 if(shot.kind==='AMMO')retireEmptyPacks(b,si,u);
 if(shot.kind==='AMMO'||shot.kind==='PLASMA')b.log(b.card(u.cardId).name+' consomme '+shot.count+' '+(shot.kind==='PLASMA'?'plasma':'munition(s)')+'.','EFFECT');
}
function stageTarget(b,sideIndex,effect){
 const s=b.side(sideIndex);if(!hasResult(s,effect.resultCardId))return [];
 if(effect.biomassCost>(s.biomass||0))return [];
 return s.board.map((u,i)=>{
   const c=u&&b.card(u.cardId);
   return c&&stage(c)===effect.fromStage&&(!effect.hostType||c.hostType===effect.hostType)
     &&!resultDeploymentError(b,sideIndex,effect,[i])?{kind:'FRIENDLY_UNIT',lane:i}:null;
 }).filter(Boolean);
}
function fusionTarget(b,sideIndex,effect){
 const s=b.side(sideIndex);
 if(!hasResult(s,effect.resultCardId))return [];
 return s.board.map((u,i)=>{
   if(!u||stage(b.card(u.cardId))!=='FACEHUGGER')return null;
   const hostLane=fusionHostLane(b,sideIndex,effect,i);
   return hostLane>=0&&!resultDeploymentError(b,sideIndex,effect,[i,hostLane])
     ?{kind:'FRIENDLY_UNIT',lane:i}:null;
 }).filter(Boolean);
}
P.makeSide=function(...args){
 const s=older.makeSide.call(this,...args);
 s.biomass=0;s.plasma=0;s.honor=0;
 return s;
};
P.makeUnit=function(...args){
 const u=older.makeUnit.call(this,...args);
 u.ammoPacks=[];
 return u;
};
P.allKeywords=function(u){
 const side=u?.owner??0;
 const shot=fireable(this,u,side);
 const equipment=(u?.equipment||[]).filter(id=>{
   const c=this.card(id);
   if(c?.cardClass==='MODIFICATION')return !!shot&&c.compatibleFamilies.includes(shot.weapon.weaponFamily);
   if(c?.slot!=='WEAPON')return true;
   return (!c.ammoType||isAvailableAmmo(u,c.ammoType,c.ammoPerAttack||1))
     &&(!c.plasmaPerAttack||(this.side(side)?.plasma||0)>=c.plasmaPerAttack);
 });
 // Ignore only the depleted weapon's contribution. An innate or independently
 // granted copy of the same keyword must remain active.
 return older.allKeywords.call(this,{...u,equipment});
};
P.unitAttack=function(si,u,target=null){
 // Apply the weapon and ammunition adjustments before the final zero floor.
 // Otherwise a severe negative modifier is lost and bonus rounds create damage.
 let val=older.unitAttack.call(this,si,u,target,true);
 const shot=fireable(this,u,si);
 for(const id of u.equipment||[]){
  const c=this.card(id);
  if(c?.slot==='WEAPON'&&(c.ammoType||c.plasmaPerAttack)){
    if(!shot||shot.weapon.id!==c.id)val-=c.attack||0;
  }
  if(c?.cardClass==='MODIFICATION'&&(!shot||!c.compatibleFamilies.includes(shot.weapon.weaponFamily)))val-=c.attack||0;
 }
 if(shot?.kind==='AMMO')val+=shot.bonus;
 return Math.max(0,Math.round(val));
};
P.deploymentError=function(si,c){
 if(c?.summonByFusion&&!this._asymmetricSummoning)return 'Cette caste doit être créée par fusion ou évolution.';
 if(c?.requiresEgg&&(this._asymmetricHatching===undefined||this._asymmetricHatching===null)){
   if(!this.side(si).board.some(u=>u&&isEgg(this.card(u.cardId))&&(c.eggLine!=='ROYAL'||this.card(u.cardId).eggLine==='ROYAL')))
     return 'Placez puis sacrifiez un Œuf compatible pour faire éclore le Facehugger.';
 }
 return older.deploymentError.call(this,si,c);
};
P.validTargets=function(cardOrId,si){
 const c=typeof cardOrId==='string'?this.card(cardOrId):cardOrId;
 const s=this.side(si);
 if(!c)return [];
 if(c.requiresEgg){
   if(this._asymmetricHatching!==undefined&&this._asymmetricHatching!==null)return [{kind:'HATCH_EGG',lane:this._asymmetricHatching}];
   return s.board.map((u,lane)=>{
     const egg=u&&this.card(u.cardId);
     return egg&&isEgg(egg)&&(c.eggLine!=='ROYAL'||egg.eggLine==='ROYAL')?{kind:'HATCH_EGG',lane}:null;
   }).filter(Boolean);
 }
 if(c.summonByFusion)return [];
 if(c.cardClass==='MUNITION')return s.board.map((u,lane)=>{
   const holder=u&&this.card(u.cardId);
   const factions=holder&&new Set([holder.faction,...(holder.effect?.dualFaction||[]),...(u.extraFactions||[])]);
   const compatible=holder&&['HUMAN','YAUTJA'].some(f=>factions.has(f))&&(c.faction==='NEUTRAL'||factions.has(c.faction));
   return compatible&&['PERSONNAGE','VEHICULE'].includes(holder.cardClass)
      &&activeAmmoPacks(u).length<6?{kind:'FRIENDLY_UNIT',lane}:null;
 }).filter(Boolean);
 if(c.cardClass==='MODIFICATION')return s.board.map((u,lane)=>{
   if(!u)return null;
   const weapon=u.equipment.map(id=>this.card(id)).find(x=>x?.slot==='WEAPON'&&x.weaponFamily&&c.compatibleFamilies.includes(x.weaponFamily));
   if(!weapon)return null;
   const mods=u.equipment.map(id=>this.card(id)).filter(x=>x?.cardClass==='MODIFICATION');
   if(mods.length>=3||mods.some(x=>x.modSocket===c.modSocket))return null;
   return {kind:'FRIENDLY_UNIT',lane};
 }).filter(Boolean);
 if(c.effect?.kind==='HIVE_FUSION')return fusionTarget(this,si,c.effect);
 if(c.effect?.kind==='HIVE_EVOLVE')return stageTarget(this,si,c.effect);
 if(c.effect?.kind==='WEAPON_TECHNIQUE'){
   const e=c.effect;
   if(!techniqueSource(this,si,e))return [];
 }
 return older.validTargets.call(this,c,si);
};
P.canPlay=function(si,handIndex){
 const s=this.side(si),c=this.card(s.hand[handIndex]);
 if(c?.effect?.honorCost&&(s.honor||0)<c.effect.honorCost)
   return {ok:false,reason:'Honneur insuffisant ('+c.effect.honorCost+' requis).'};
 if(c?.effect?.biomassCost&&(s.biomass||0)<c.effect.biomassCost)
   return {ok:false,reason:'Biomasse insuffisante ('+c.effect.biomassCost+' requise).'};
 if(c?.effect?.kind==='YAUTJA_TROPHY'&&s.trophies<(c.effect.minTrophies||1))
   return {ok:false,reason:'Obtenez un trophée en combattant pour activer ce rite.'};
 if(c?.effect?.kind==='WEAPON_TECHNIQUE'&&!techniqueSource(this,si,c.effect))
   return {ok:false,reason:'Arme équipée et munitions compatibles nécessaires.'};
 return older.canPlay.call(this,si,handIndex);
};
P.playCardResolved=function(si,handIndex,target={kind:'NONE'}){
 const c=this.card(this.side(si).hand[handIndex]);
 if(c?.requiresEgg){
   const check=this.canPlay(si,handIndex);
   if(!check.ok)return check;
   if(!check.targets.some(t=>t.kind===target.kind&&t.lane===target.lane))
     return {ok:false,reason:'Œuf à sacrifier : cible invalide.'};
   const egg=this.side(si).board[target.lane];
   if(!egg||!isEgg(this.card(egg.cardId)))return {ok:false,reason:'Œuf absent.'};
   this.side(si).discard.push(egg.cardId);
   this.destroyUnit(si,target.lane,{sacrifice:true,noDeath:true});
   this._asymmetricHatching=target.lane;
   try{
     const result=older.playCardResolved.call(this,si,handIndex,target);
     if(result.ok){this.side(si).biomass=clamp((this.side(si).biomass||0)+1,12);this.notify();}
     return result;
   }finally{this._asymmetricHatching=null;}
 }
 const result=older.playCardResolved.call(this,si,handIndex,target);
 if(result.ok&&c?.cardClass==='MUNITION'){
   const u=this.side(si).board[target.lane];
   if(u){retireEmptyPacks(this,si,u);u.ammoPacks??=[];u.ammoPacks.push({cardId:c.id,ammoType:c.ammoType,remaining:c.rounds,ammoBonus:c.ammoBonus||0});this.notify();}
 }
 return result;
};
P.summonAt=function(si,id,lane,opts={}){
 if(this.card(id)?.summonByFusion&&opts.fromFusion){
   this._asymmetricSummoning=true;
   try{return older.summonAt.call(this,si,id,lane,opts);}finally{this._asymmetricSummoning=false;}
 }
 return older.summonAt.call(this,si,id,lane,opts);
};
P.legalAttacks=function(si,lane){
 const u=this.side(si).board[lane],c=u&&this.card(u.cardId);
 if(c&&['OEUF','HOTE'].includes(c.cardClass))return [];
 return older.legalAttacks.call(this,si,lane);
};
P.attackResolved=function(si,lane,target){
 const u=this.side(si).board[lane],def=target?.kind==='UNIT'?this.side(1-si).board[target.lane]:null;
 const legal=this.legalAttacks(si,lane).some(x=>x.kind===target.kind&&(x.lane??-1)===(target.lane??-1));
 if(!legal)return older.attackResolved.call(this,si,lane,target);
 const fired=u&&fireable(this,u,si),counter=def&&fireable(this,def,1-si);
 const result=older.attackResolved.call(this,si,lane,target);
 if(result?.ok!==false){spendShot(this,si,u,fired);if(def)spendShot(this,1-si,def,counter);}
 return result;
};
P.resolveDeath=function(payload){
 const u=payload.ctx?.sourceUnit,owner=u?.owner;
 const honored=u&&owner===1-payload.sideIndex&&!payload.ctx?.sacrifice&&!payload.ctx?.transform&&!payload.ctx?.noDeath
   &&this.isFaction(u,'YAUTJA');
 const result=older.resolveDeath.call(this,payload);
 if(honored){
   const side=this.side(owner);side.honor=clamp((side.honor||0)+1,12);
   this.log(this.card(u.cardId).name+' revendique 1 honneur de chasse.','TROPHY');
 }
 return result;
};
P.aiScore=function(card,target={kind:'NONE'},si=1){
 const s=this.side(si),kind=card?.effect?.kind;
 if(card?.cardClass==='OEUF'||card?.cardClass==='HOTE'){
   const formation=s.board.filter(Boolean).map(u=>this.card(u.cardId));
   const parasites=formation.filter(c=>isEgg(c)||stage(c)==='FACEHUGGER');
   const hosts=formation.filter(c=>c.cardClass==='HOTE');
   const free=s.board.filter(u=>!u).length;
   // Preserve room for both fusion materials rather than occupying every lane
   // with eggs or hosts that cannot turn into an attacking unit on their own.
   if(card.cardClass==='OEUF'){
     if(parasites.length)return 0;
     return hosts.length?8:5.5;
   }
   if(hosts.some(c=>c.hostType===card.hostType)||(!parasites.length&&(hosts.length||free<=1)))return 0;
   const recipe=s.hand.map(id=>this.card(id)).find(c=>c?.effect?.kind==='HIVE_FUSION'
     &&c.effect.hostType===card.hostType&&hasResult(s,c.effect.resultCardId));
   if(hosts.length&&!recipe)return 0;
   return recipe&&parasites.length?8:parasites.length?7:4;
 }
 if(card?.cardClass==='MUNITION'){
   const u=s.board[target?.lane];if(!u)return 0;
   const weapon=u.equipment.map(id=>this.card(id)).find(x=>x?.ammoType===card.ammoType);
   return weapon?(isAvailableAmmo(u,card.ammoType,weapon.ammoPerAttack||1)?1.2:6):1;
 }
 if(card?.cardClass==='MODIFICATION'){
   const u=s.board[target?.lane];
   return u?2.5+(card.attack||0)/180:0;
 }
 if(card?.requiresEgg)return 6;
 if(card?.summonByFusion)return 0;
 if(kind==='HIVE_FUSION')return 10;
 if(kind==='HIVE_EVOLVE')return 9;
 if(kind==='HIVE_BIOMASS')return s.biomass>=10?0:3.5;
 if(kind==='WEAPON_TECHNIQUE')return 3+(card.effect.damage||0)/160;
 if(kind==='CHARGE_PLASMA')return s.plasma>=10?0:5;
 if(kind==='GAIN_HONOR')return s.honor>=10?0:3;
 if(kind==='YAUTJA_TROPHY')return s.honor>=11?0:4;
 if(kind==='HONOR_BUFF')return s.board[target?.lane]?3+(card.effect.attack||0)/250:0;
 if(kind==='HONOR_DRAW')return s.deck.length>0?3:0;
 if(kind==='HONOR_REVEAL')return 2+this.enemy(si).board.filter(u=>u?.cloaked).length*1.5;
 return older.aiScore.call(this,card,target,si);
};
P.applyEffectResolved=function(si,effect,ctx={}){
 if(!effect||this.state.winner!==null)return older.applyEffectResolved.call(this,si,effect,ctx);
 const s=this.side(si),enemy=this.enemy(si),target=ctx.target;
 switch(effect.kind){
 case 'CHARGE_PLASMA':s.plasma=clamp((s.plasma||0)+(effect.amount||1),12);this.log(s.name+' charge son plasma : '+s.plasma+'/12.','EFFECT');break;
 case 'GAIN_HONOR':s.honor=clamp((s.honor||0)+(effect.amount||1),12);break;
 case 'HIVE_BIOMASS':s.biomass=clamp((s.biomass||0)+(effect.amount||1),12);this.log('Ruche : '+s.biomass+'/12 biomasses.','EFFECT');break;
 case 'YAUTJA_TROPHY':
   if(s.trophies>=(effect.minTrophies||1))s.honor=clamp((s.honor||0)+(effect.amount||1),12);
   break;
 case 'HONOR_BUFF':
   if(s.honor>=effect.honorCost&&s.board[target?.lane]){
     s.honor-=effect.honorCost;this.buffUnit(si,target.lane,effect.attack||0,effect.health||0,[]);
   }break;
 case 'HONOR_DRAW':
   if(s.honor>=effect.honorCost){s.honor-=effect.honorCost;this.draw(si,effect.count||1);}break;
 case 'HONOR_REVEAL':
   if(s.honor>=effect.honorCost){s.honor-=effect.honorCost;for(const u of enemy.board.filter(Boolean))u.cloaked=false;
     s.shield=Math.min(1200,s.shield+(effect.amount||0));}break;
 case 'WEAPON_TECHNIQUE':{
   const eligible=techniqueSource(this,si,effect);
   if(target?.kind==='ENEMY_UNIT'&&enemy.board[target.lane]&&eligible){
     // Keep the firing weapon's keywords active for the shot itself, including
     // Perforation on its final charge. Ordinary attacks follow this same order.
     this.damageUnit(1-si,target.lane,effect.damage||0,{kind:'TECHNIQUE',unit:eligible,sourceSide:si});
     spendAmmo(eligible,effect.ammoType,effect.ammoCost);
     retireEmptyPacks(this,si,eligible);
   }break;
 }
 case 'HIVE_FUSION':{
   const u=s.board[target?.lane],c=u&&this.card(u.cardId);
   if(!fusionTarget(this,si,effect).some(t=>t.lane===target?.lane&&t.kind===target?.kind))break;
   const hostLane=fusionHostLane(this,si,effect,target.lane);
   const host=s.board[hostLane];
   const lane=target.lane;
   if(!rem(s,effect.resultCardId))break;
   s.discard.push(c.id,this.card(host.cardId).id);
   this.destroyUnit(si,hostLane,{sacrifice:true,noDeath:true});
   this.destroyUnit(si,lane,{sacrifice:true,noDeath:true});
   this.summonAt(si,effect.resultCardId,lane,{fromFusion:true});
   s.biomass=clamp((s.biomass||0)+(effect.biomassGain||1),12);
   this.log('Fusion : un hôte '+effect.hostType+' donne naissance à '+this.card(effect.resultCardId).name+'.','EFFECT');
   break;
 }
 case 'HIVE_EVOLVE':{
   const u=s.board[target?.lane],c=u&&this.card(u.cardId);
   if(!stageTarget(this,si,effect).some(t=>t.lane===target?.lane&&t.kind===target?.kind))break;
   const lane=target.lane;
   if(!rem(s,effect.resultCardId))break;
   s.biomass-=effect.biomassCost;s.discard.push(c.id);
   this.destroyUnit(si,lane,{sacrifice:true,noDeath:true});
   this.summonAt(si,effect.resultCardId,lane,{fromFusion:true});
   this.log('Évolution : '+c.name+' devient '+this.card(effect.resultCardId).name+'.','EFFECT');
   break;
 }
 default:return older.applyEffectResolved.call(this,si,effect,ctx);
 }
 this.checkEnd();
};
// Contrôle des incompatibilités de munitions, fusions et ressources de chasse.
const formerAnalyze=E.analyzeDeck;
E.analyzeDeck=function(deck,identity){
 const report=formerAnalyze(deck,identity);
 const entries=Object.entries(deck||{}).flatMap(([id,n])=>Array.from({length:Number.isSafeInteger(n)&&n>0?Math.min(n,3):0},()=>E.CARD.get(id))).filter(Boolean);
 const count=pred=>entries.filter(pred).length,notes=[];
 const ids=new Set(entries.map(c=>c.id)),unique=[...new Map(entries.map(c=>[c.id,c])).values()];
 const weapons=entries.filter(c=>c.cardClass==='ARME');
 const guns=entries.filter(c=>c.cardClass==='ARME'&&c.ammoType);
 for(const calibre of new Set(guns.map(c=>c.ammoType))){
  const required=guns.filter(c=>c.ammoType===calibre).length*2;
  const available=entries.filter(c=>c.cardClass==='MUNITION'&&c.ammoType===calibre).reduce((n,c)=>n+c.rounds,0);
  if(available<required)notes.push('Munitions '+calibre+' : '+available+'/'+required+' charges recommandées.');
 }
 for(const mod of unique.filter(c=>c.cardClass==='MODIFICATION'))
   if(!weapons.some(w=>mod.compatibleFamilies.includes(w.weaponFamily)))
     notes.push(mod.name+' : module sans arme de famille compatible.');
 for(const technique of unique.filter(c=>c.effect?.kind==='WEAPON_TECHNIQUE')){
   const e=technique.effect;
   if(!guns.some(w=>w.ammoType===e.ammoType&&(!e.weaponFamily||w.weaponFamily===e.weaponFamily)))
     notes.push(technique.name+' : arme compatible manquante'+(e.weaponFamily?' ('+e.weaponFamily.toUpperCase()+')':'')+'.');
 }
 if(count(c=>c.effect?.kind==='HIVE_FUSION')){
  if(!count(c=>c.cardClass==='OEUF'||c.id==='X_OVOMORPH'))notes.push('Il manque des Œufs.');
  if(!count(c=>c.cardClass==='HOTE'))notes.push('Il manque des Hôtes.');
  if(!count(c=>c.requiresEgg||c.id==='X_FACEHUGGER'))notes.push('Il manque des Facehuggers.');
 }
 for(const c of unique.filter(c=>['HIVE_FUSION','HIVE_EVOLVE'].includes(c.effect?.kind))){
   const e=c.effect;
   if(!ids.has(e.resultCardId))notes.push(c.name+' : résultat absent du deck ('+(E.CARD.get(e.resultCardId)?.name||e.resultCardId)+').');
   if(e.kind==='HIVE_FUSION'&&!count(h=>h.cardClass==='HOTE'&&h.hostType===e.hostType))
     notes.push(c.name+' : hôte '+e.hostType+' manquant.');
   if(e.kind==='HIVE_EVOLVE'&&!count(h=>stage(h)===e.fromStage&&(!e.hostType||h.hostType===e.hostType)))
     notes.push(c.name+' : stade '+e.fromStage+(e.hostType?' / '+e.hostType:'')+' manquant.');
 }
 if(count(c=>c.requiresEgg&&c.eggLine==='ROYAL')&&!count(c=>isEgg(c)&&c.eggLine==='ROYAL'))
   notes.push('Facehugger royal : Œuf royal manquant.');
 if(count(c=>c.effect?.kind==='HIVE_EVOLVE')&&!count(c=>c.cardClass==='BIOMASSE'||c.requiresEgg||c.effect?.kind==='HIVE_FUSION'))
  notes.push('Évolutions sans réserve de biomasse.');
 if(count(c=>c.plasmaPerAttack)&&!count(c=>c.cardClass==='RESERVE_PLASMA'||c.effect?.kind==='CHARGE_PLASMA'))
  notes.push('Armes plasma sans réserve énergétique.');
 if(count(c=>c.cardClass==='HONNEUR')&&!count(c=>c.cardClass==='TROPHEE'||c.keywords?.includes('TROPHY')))
  notes.push('Honneur sans chasseurs à trophées.');
 report.asymmetric=notes;
 return report;
};
// Build complete, deterministic doctrines rather than independently sampling
// resources, recipes and unplayable fusion results for the three major factions.
const formerBuildAiDeck=E.buildAiDeck;
E.buildAiDeck=function(factions=['XENO'],difficulty=1,seed=1){
 const faction=Array.isArray(factions)&&factions.length===1?factions[0]:null;
 const pool=['HUMAN','XENO','YAUTJA'].includes(faction)
   ?(D.asymmetricDecks||[]).filter(p=>p.faction===faction):[];
 if(pool.length&&typeof D.remixPresetDeck==='function'){
   const random=E.U.rng(seed),preset=pool[Math.floor(random()*pool.length)];
   const recipe=D.remixPresetDeck(preset,(Number(seed)||1)^E.U.hash(faction));
   if(recipe&&E.validateDeck(recipe.cards,null,faction).valid)return {...recipe.cards};
 }
 return formerBuildAiDeck(factions,difficulty,seed);
};
D.asymmetricEdition.engineLoaded=true;
})();
