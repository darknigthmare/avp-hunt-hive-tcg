/* Source-scoped lifecycle recipes. Load after asymmetric/arsenal rules.
 * The route planner is read-only: every material, result, slot and cost is
 * checked before the ordinary card-play method can spend energy or a card.
 */
(function(){
'use strict';
const E=window.AVPEngine,D=window.AVP_DATA;
if(!E?.Battle||!D?.hiveCoverage)throw Error('Catalogue des cycles requis.');
const P=E.Battle.prototype,older={validTargets:P.validTargets,deploymentError:P.deploymentError,
  applyEffectResolved:P.applyEffectResolved,aiScore:P.aiScore};
const clamp=n=>Math.max(0,Math.min(12,n));
const available=(side,id)=>side.hand.includes(id)||side.deck.includes(id);
function routePlan(b,si,effect,lane){
  const s=b.side(si),primary=s.board[lane],result=b.card(effect.resultCardId);
  if(!Number.isInteger(lane)||!primary||!effect.materialIds?.includes(primary.cardId))return null;
  if(effect.requireOrganic!==false&&b.has(primary,'SYNTHETIC'))return null;
  if(!result||result.type!=='UNIT'||!available(s,result.id)||(s.biomass||0)<(effect.biomassCost||0))return null;
  const secondaryLane=effect.secondaryIds?.length?s.board.findIndex((u,i)=>i!==lane&&u
    &&effect.secondaryIds.includes(u.cardId)&&(effect.requireOrganic===false||!b.has(u,'SYNTHETIC'))):-1;
  if(effect.secondaryIds?.length&&secondaryLane<0)return null;
  if(effect.catalystIds?.length&&!s.board.some((u,i)=>u&&i!==lane&&i!==secondaryLane
    &&effect.catalystIds.includes(u.cardId)&&(effect.requireOrganic===false||!b.has(u,'SYNTHETIC'))))return null;
  const consumed=[...(effect.preserveMaterial?[]:[lane]),...(secondaryLane>=0?[secondaryLane]:[])];
  const board=s.board.map((u,i)=>consumed.includes(i)?null:u);
  const resultLane=effect.preserveMaterial?board.findIndex(u=>!u):lane;
  if(resultLane<0)return null;
  const preview=Object.create(b);
  preview._asymmetricSummoning=true;
  preview.side=index=>index===si?{...s,board}:b.side(index);
  if(older.deploymentError.call(preview,si,result))return null;
  return {result,resultLane,consumed,primary,secondaryLane};
}
P.hiveRoutePlan=function(si,effect,lane){return effect?.kind==='HIVE_ROUTE'?routePlan(this,si,effect,lane):null;};
P.validTargets=function(cardOrId,si){
  const c=typeof cardOrId==='string'?this.card(cardOrId):cardOrId;
  if(c?.effect?.kind!=='HIVE_ROUTE')return older.validTargets.call(this,c,si);
  return this.side(si).board.map((u,lane)=>u&&routePlan(this,si,c.effect,lane)?{kind:'FRIENDLY_UNIT',lane}:null).filter(Boolean);
};
P.applyEffectResolved=function(si,effect,ctx={}){
  if(effect?.kind!=='HIVE_ROUTE'||this.state.winner!==null)return older.applyEffectResolved.call(this,si,effect,ctx);
  if(ctx.target?.kind!=='FRIENDLY_UNIT')return;
  const plan=routePlan(this,si,effect,ctx.target.lane);
  if(!plan)return;
  const s=this.side(si),zone=s.hand.includes(plan.result.id)?s.hand:s.deck;
  const resultIndex=zone.indexOf(plan.result.id);
  if(resultIndex<0)return;
  zone.splice(resultIndex,1);
  s.biomass=clamp((s.biomass||0)-(effect.biomassCost||0)+(effect.biomassGain||0));
  // The ordinary sacrifice path discards attached equipment, not its carrier.
  // Each consumed carrier therefore enters the discard exactly once here.
  for(const lane of plan.consumed){
    const u=s.board[lane];s.discard.push(u.cardId);
    this.destroyUnit(si,lane,{sacrifice:true,noDeath:true});
  }
  const summoned=this.summonAt(si,plan.result.id,plan.resultLane,{fromFusion:true});
  if(!summoned)throw Error('Cycle validé mais résultat non invocable : '+effect.routeId);
  this.log((effect.preserveMaterial?'Reproduction':'Cycle')+' : '+plan.primary.cardId+' → '+plan.result.name+'.','EFFECT');
  this.checkEnd();
};
P.aiScore=function(card,target={kind:'NONE'},si=1){
  const s=this.side(si),effect=card?.effect;
  if(effect?.kind==='HIVE_ROUTE'){
    const plan=routePlan(this,si,effect,target.lane);
    if(!plan)return 0;
    if(effect.preserveMaterial){
      const hasParasite=[...s.hand,...s.deck].some(id=>this.card(id)?.requiresEgg);
      return hasParasite?8:0;
    }
    return 12+(plan.result.attack||0)/900+(effect.biomassGain||0)*.3;
  }
  const packageCards=[...s.hand,...s.deck].map(id=>this.card(id)).filter(Boolean);
  const routeCards=packageCards.filter(c=>c.effect?.kind==='HIVE_ROUTE'&&available(s,c.effect.resultCardId));
  if(card?.type==='UNIT'&&card.hiveMaterial&&!card.summonByFusion&&!card.requiresEgg&&card.cardClass!=='OEUF'){
    if(s.board.some(u=>u?.cardId===card.id))return 0;
    const needed=routeCards.filter(c=>[...c.effect.materialIds,...c.effect.secondaryIds,...c.effect.catalystIds].includes(card.id));
    if(!needed.length)return 0;
    const free=s.board.filter(u=>!u).length;
    const canFit=needed.some(c=>{
      const e=c.effect;
      const groups=[e.materialIds,e.secondaryIds,e.catalystIds].filter(g=>g.length);
      const remaining=groups.filter(g=>!g.includes(card.id)&&!s.board.some(u=>u&&g.includes(u.cardId))).length;
      return free>=1+remaining;
    });
    if(!canFit)return 0;
    return needed.some(c=>s.hand.includes(c.id))?10:5.5;
  }
  // A reproductive package needs at most two simultaneous materials. Keep
  // those spaces available until the fusion/gestation frees a lane again.
  if(routeCards.length&&card?.type==='UNIT'&&!card.hiveMaterial&&!card.summonByFusion
      &&!card.requiresEgg&&!['OEUF','HOTE'].includes(card.cardClass)){
    const paired=packageCards.some(c=>c.effect?.kind==='HIVE_FUSION'
      ||c.effect?.kind==='HIVE_ROUTE'&&(c.effect.secondaryIds.length||c.effect.catalystIds.length));
    const materialOnBoard=s.board.some(u=>u&&(this.card(u.cardId).hiveMaterial
      ||['OEUF','HOTE'].includes(this.card(u.cardId).cardClass)||this.card(u.cardId).evolutionStage==='FACEHUGGER'));
    if(paired&&!materialOnBoard&&s.board.filter(Boolean).length>=1)return 0;
    if(paired&&materialOnBoard&&s.board.filter(Boolean).length>=2)return 0;
  }
  return older.aiScore.call(this,card,target,si);
};
const analyze=E.analyzeDeck;
E.analyzeDeck=function(deck,identity){
  const report=analyze(deck,identity),ids=new Set(Object.keys(deck||{}).filter(id=>deck[id]>0)),notes=[];
  const cards=[...ids].map(id=>E.CARD.get(id)).filter(Boolean);
  for(const card of cards.filter(c=>c.effect?.kind==='HIVE_ROUTE')){
    const e=card.effect;
    if(!ids.has(e.resultCardId))notes.push(card.name+' : résultat absent ('+(E.CARD.get(e.resultCardId)?.name||e.resultCardId)+').');
    for(const [label,group]of [['matériau',e.materialIds],['hôte secondaire',e.secondaryIds],['catalyseur',e.catalystIds]])
      if(group.length&&!group.some(id=>ids.has(id)))notes.push(card.name+' : '+label+' compatible absent.');
    if(e.biomassCost&&!cards.some(c=>c.effect?.kind==='HIVE_BIOMASS'||c.requiresEgg||c.effect?.biomassGain))
      notes.push(card.name+' : biomasse indisponible.');
  }
  for(const card of cards.filter(c=>c.summonByFusion&&c.tags?.includes('hive-complete')))
    if(!cards.some(c=>c.effect?.resultCardId===card.id))notes.push(card.name+' : recette de création absente.');
  report.hive=notes;
  report.asymmetric=[...(report.asymmetric||[]),...notes];
  return report;
};
const buildAi=E.buildAiDeck;
E.buildAiDeck=function(factions=['XENO'],difficulty=1,seed=1){
  const faction=Array.isArray(factions)&&factions.length===1?factions[0]:null;
  const pool=(D.hiveDecks||[]).filter(d=>d.faction===faction);
  if(pool.length&&(['ENGINEER','HYBRID'].includes(faction)||(Number(seed)>>>0)%3===0)){
    const preset=pool[(Number(seed)>>>0)%pool.length],recipe=D.remixPresetDeck(preset,seed);
    if(recipe&&E.validateDeck(recipe.cards,null,faction).valid)return {...recipe.cards};
  }
  return buildAi(factions,difficulty,seed);
};
D.hiveEdition.engineLoaded=true;
})();
