/* Règles de l’arsenal : appareils, services conditionnels et plasma spécialisé.
 * Aucun format de sauvegarde nouveau : seules les cartes et ressources déjà validées sont utilisées.
 */
(function(){
'use strict';
const E=window.AVPEngine,D=window.AVP_DATA;
if(!D?.arsenalEdition||!E?.Battle)throw Error('Catalogue et moteur arsenal requis');
const P=E.Battle.prototype,older={validTargets:P.validTargets,applyEffectResolved:P.applyEffectResolved,aiScore:P.aiScore,combatWeaponState:P.combatWeaponState};
function compatibleEquipment(b,u,ids){return !!u&&(u.equipment||[]).some(id=>ids.includes(id)&&b.card(id)?.cardClass==='EQUIPEMENT');}
function compatibleWeapon(b,u,families){return !!u&&(u.equipment||[]).some(id=>{const c=b.card(id);return c?.slot==='WEAPON'&&families.includes(c.weaponFamily);});}
function plasmaSource(b,si,effect){return b.side(si).board.find(u=>u&&compatibleWeapon(b,u,[effect.weaponFamily]));}
P.validTargets=function(cardOrId,si){
 const c=typeof cardOrId==='string'?this.card(cardOrId):cardOrId;if(!c)return [];
 const s=this.side(si);
 if(c.cardClass==='MODIFICATION'&&c.compatibleEquipmentIds?.length){
  return s.board.map((u,lane)=>{
   if(!compatibleEquipment(this,u,c.compatibleEquipmentIds))return null;
   const mods=u.equipment.map(id=>this.card(id)).filter(x=>x?.cardClass==='MODIFICATION');
   if(mods.length>=3||mods.some(m=>m.modSocket===c.modSocket))return null;
   return {kind:'FRIENDLY_UNIT',lane};
  }).filter(Boolean);
 }
 if(c.effect?.kind==='ARSENAL_PLASMA_SHOT'&&(!plasmaSource(this,si,c.effect)||(s.plasma||0)<c.effect.plasmaCost))return [];
 const targets=older.validTargets.call(this,c,si),effect=c.effect||{};
 if(effect.requiresEquipmentIds?.length)return targets.filter(t=>t.kind==='FRIENDLY_UNIT'&&compatibleEquipment(this,s.board[t.lane],effect.requiresEquipmentIds));
 if(effect.requiresWeaponFamilies?.length)return targets.filter(t=>t.kind==='FRIENDLY_UNIT'&&compatibleWeapon(this,s.board[t.lane],effect.requiresWeaponFamilies));
 return targets;
};
P.applyEffectResolved=function(si,effect,ctx={}){
 if(!effect||this.state.winner!==null)return older.applyEffectResolved.call(this,si,effect,ctx);
 const target=ctx.target,u=this.side(si).board[target?.lane];
 // Enforce dependencies at resolution as well as at target selection, including direct effect calls.
 if(effect.requiresEquipmentIds?.length&&!compatibleEquipment(this,u,effect.requiresEquipmentIds))return;
 if(effect.requiresWeaponFamilies?.length&&!compatibleWeapon(this,u,effect.requiresWeaponFamilies))return;
 if(effect.kind==='ARSENAL_PLASMA_SHOT'){
  const s=this.side(si),source=plasmaSource(this,si,effect);
  if(source&&(s.plasma||0)>=effect.plasmaCost&&target?.kind==='ENEMY_UNIT'&&this.enemy(si).board[target.lane]){
   s.plasma-=effect.plasmaCost;
   this.damageUnit(1-si,target.lane,effect.damage||0,{kind:'TECHNIQUE',unit:source,sourceSide:si});
   this.checkEnd();
  }return;
 }
 if(effect.kind==='WEAPON_TECHNIQUE'&&effect.stunTurns){
  const before=this.side(si).board.filter(Boolean).reduce((n,x)=>n+(x.ammoPacks||[]).filter(p=>p.ammoType===effect.ammoType).reduce((m,p)=>m+p.remaining,0),0);
  const result=older.applyEffectResolved.call(this,si,effect,ctx);
  const after=this.side(si).board.filter(Boolean).reduce((n,x)=>n+(x.ammoPacks||[]).filter(p=>p.ammoType===effect.ammoType).reduce((m,p)=>m+p.remaining,0),0);
  const victim=target?.kind==='ENEMY_UNIT'?this.enemy(si).board[target.lane]:null;
  if(before>after&&victim){victim.stunned=Math.max(victim.stunned||0,effect.stunTurns);victim.ready=false;}
  return result;
 }
 return older.applyEffectResolved.call(this,si,effect,ctx);
};
P.aiScore=function(card,target,si){
 if(card?.effect?.kind==='ARSENAL_PLASMA_SHOT')return 3+(card.effect.damage||0)/160;
 if(card?.cardClass==='MODIFICATION'&&card.compatibleEquipmentIds?.length)return this.side(si).board[target?.lane]?2+(card.health||0)/180:0;
 return older.aiScore.call(this,card,target,si);
};
P.combatWeaponState=function(si,u){
 const result=older.combatWeaponState.call(this,si,u);
 const deviceMods=result.installedMods.filter(c=>c.compatibleEquipmentIds?.length&&compatibleEquipment(this,u,c.compatibleEquipmentIds));
 return {...result,activeMods:[...result.activeMods,...deviceMods],activeEquipmentMods:deviceMods};
};
const previousAnalyze=E.analyzeDeck;
E.analyzeDeck=function(deck,identity){
 const report=previousAnalyze(deck,identity),cards=Object.entries(deck||{}).filter(([,n])=>Number.isSafeInteger(n)&&n>0).map(([id])=>E.CARD.get(id)).filter(Boolean),ids=new Set(cards.map(c=>c.id));
 const deviceMods=cards.filter(c=>c.cardClass==='MODIFICATION'&&c.compatibleEquipmentIds?.length);
 const irrelevant=new Set(deviceMods.map(c=>c.name+' : module sans arme de famille compatible.'));
 report.asymmetric=(report.asymmetric||[]).filter(line=>!irrelevant.has(line));
 const notes=[];
 for(const c of deviceMods)if(!c.compatibleEquipmentIds.some(id=>ids.has(id)))notes.push(c.name+' : appareil compatible absent du deck.');
 for(const c of cards){const e=c.effect||{};
  if(e.requiresEquipmentIds?.length&&!e.requiresEquipmentIds.some(id=>ids.has(id)))notes.push(c.name+' : appareil requis absent du deck.');
  const families=e.requiresWeaponFamilies||(e.kind==='ARSENAL_PLASMA_SHOT'?[e.weaponFamily]:[]);
  if(families.length&&!cards.some(w=>w.slot==='WEAPON'&&families.includes(w.weaponFamily)))notes.push(c.name+' : arme requise absente du deck.');
  if(e.kind==='ARSENAL_PLASMA_SHOT'&&!cards.some(r=>r.effect?.kind==='CHARGE_PLASMA'))notes.push(c.name+' : réserve plasma absente du deck.');
  if(c.cardClass==='MUNITION'&&c.tags?.includes('arsenal')&&!cards.some(w=>w.slot==='WEAPON'&&w.ammoType===c.ammoType))notes.push(c.name+' : munitions sans arme compatible.');
 }
 report.arsenal=notes;report.asymmetric.push(...notes);return report;
};
})();
