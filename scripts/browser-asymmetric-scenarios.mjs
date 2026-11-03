// Runs only inside the QA browser. Fixtures use the public checkpoint API;
// all player actions then pass through the actual interface click handlers.
export async function asymmetricBrowserScenarios(){
  const A=window.AVP_APP,D=window.AVP_DATA,E=window.AVPEngine,S=window.AVPDuelSave;
  const checks=[];
  const assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const click=selector=>{
    const el=document.querySelector(selector);
    if(!el)throw Error('Missing UI control: '+selector);
    el.scrollIntoView({block:'center'});el.click();
  };
  const get=predicate=>D.cards.find(predicate);
  // A private fresh browser context is used by qa-browser.mjs.
  const base=A.save.freshSave();
  base.starterChosen=true;base.tutorial.completed=true;base.settings.sound=false;base.settings.motion=false;
  A.Store.data=base;A.Store.save();
  A.state.ui.modalLocked=false;
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert(!document.getElementById('app').inert,'Onboarding releases the playable interface');
  A.state.screen='decks';A.render();
  for(const faction of ['HUMAN','XENO','YAUTJA']){
    const preset=D.asymmetricDecks.find(p=>p.faction===faction);
    document.querySelector('#expansion-deck-preset').value=preset.id;
    click('[data-action="import-expansion-deck"]');
    let imported=A.Store.data.decks.at(-1);
    assert(E.validateDeck(imported.cards,A.Store.data.collection,faction).valid,'Imported '+faction+' doctrine');
    document.querySelector('#expansion-deck-preset').value=preset.id;
    click('[data-action="remix-expansion-deck"]');
    imported=A.Store.data.decks.at(-1);
    assert(E.validateDeck(imported.cards,A.Store.data.collection,faction).valid,'Remixed '+faction+' doctrine');
    assert((E.analyzeDeck(imported.cards,faction).asymmetric||[]).length===0,'No missing resources in '+faction+' remix');
  }
  assert(A.Store.data.decks.length===6,'Import and remix create separate saved decks');
  const makeFixture=(faction,configure)=>{
    const p=D.asymmetricDecks.find(p=>p.faction===faction),enemy=D.asymmetricDecks.find(p=>p.faction!==faction);
    const b=new E.Battle({playerDeck:p.cards,aiDeck:enemy.cards,seed:71103,difficulty:1});
    for(const side of b.state.sides){side.board=[null,null,null];side.hand=[];side.energy=10;side.maxEnergy=10;}
    configure(b);
    A.state.battleContext=null;A.state.ui.pending=null;
    A.Store.data.duel={mode:'quick',missionId:null,checkpoint:S.capture(b)};A.Store.save();
    A.resumeBattle();
    return A.state.battleContext.battle;
  };
  const play=(cardId,lane)=>{
    const b=A.state.battleContext.battle,index=b.side(0).hand.indexOf(cardId);
    assert(index>=0,'Card in hand: '+cardId);
    b.side(0).energy=10;A.render();
    click('[data-action="battle-hand"][data-index="'+index+'"]');
    if(lane!==undefined)click('[data-action="battle-target"][data-lane="'+lane+'"]');
    assert(!b.side(0).hand.includes(cardId),'Played through UI: '+cardId);
  };
  const human=get(c=>c.id.startsWith('MX_')&&c.faction==='HUMAN'&&c.cardClass==='PERSONNAGE');
  const gun=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType);
  const mod=get(c=>c.cardClass==='MODIFICATION'&&c.compatibleFamilies.includes('pulse'));
  const technique=get(c=>c.effect?.kind==='WEAPON_TECHNIQUE'&&c.effect.weaponFamily==='pulse'&&c.effect.ammoCost===1);
  let b=makeFixture('HUMAN',x=>{
    x.summonAt(0,human.id,0);x.summonAt(1,'X_QUEEN',0);
    x.side(0).hand=[gun.id,ammo.id,mod.id,technique.id];
  });
  const bare=b.unitAttack(0,b.side(0).board[0]);
  play(gun.id,0);
  assert(b.unitAttack(0,b.side(0).board[0])===bare,'Unloaded gun grants no firing bonus');
  play(ammo.id,0);play(mod.id,0);
  assert(b.unitAttack(0,b.side(0).board[0])>bare,'Loaded compatible gun and mod increase attack');
  const charges=b.side(0).board[0].ammoPacks.reduce((n,p)=>n+p.remaining,0);
  play(technique.id,0);
  assert(b.side(0).board[0].ammoPacks.reduce((n,p)=>n+p.remaining,0)===charges-1,'Technique spends its ammo through UI');
  click('[data-action="pause-battle"]');
  assert(Boolean(A.Store.data.duel)&&A.state.screen==='home','Pause stores active duel');
  click('[data-action="resume-battle"]');
  b=A.state.battleContext.battle;
  assert(b.side(0).board[0].ammoPacks.reduce((n,p)=>n+p.remaining,0)===charges-1,'Resume preserves remaining ammo');
  click('[data-action="battle-inspect"][data-side="0"][data-lane="0"]');
  assert(document.querySelector('[role="dialog"]')?.innerText.includes('charge(s)'),'Unit details show ammo');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));

  const egg=get(c=>c.cardClass==='OEUF'&&c.eggLine==='COMMON');
  const hug=get(c=>c.requiresEgg&&c.eggLine==='COMMON');
  const host=get(c=>c.cardClass==='HOTE'&&c.hostType==='HUMAN');
  const fusion=get(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType==='HUMAN');
  const evolution=get(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='CHESTBURSTER'&&c.effect.hostType==='HUMAN');
  b=makeFixture('XENO',x=>{
    x.summonAt(0,egg.id,0);x.summonAt(0,host.id,1);
    x.side(0).hand=[hug.id,fusion.id,evolution.id];
    x.side(0).deck=[fusion.effect.resultCardId,evolution.effect.resultCardId,...x.side(0).deck];
  });
  play(hug.id,0);assert(b.side(0).board[0].cardId===hug.id,'Egg hatches in its chosen lane');
  play(fusion.id,0);assert(b.side(0).board[0].cardId===fusion.effect.resultCardId&&b.side(0).board[1]===null,'Fusion consumes host and facehugger');
  play(evolution.id,0);assert(b.side(0).board[0].cardId===evolution.effect.resultCardId,'Hive evolution resolves through UI');
  assert(b.side(0).biomass===2,'Hive biomass costs persist after evolution');

  const hunter=get(c=>c.id.startsWith('MX_')&&c.faction==='YAUTJA'&&c.cardClass==='PERSONNAGE');
  const caster=get(c=>c.cardClass==='ARME'&&c.plasmaPerAttack>0);
  const reserve=get(c=>c.cardClass==='RESERVE_PLASMA'&&c.effect.amount>=caster.plasmaPerAttack);
  const trophy=get(c=>c.cardClass==='TROPHEE');
  const rite=get(c=>c.effect?.kind==='HONOR_BUFF');
  b=makeFixture('YAUTJA',x=>{
    x.summonAt(0,hunter.id,0);x.side(0).trophies=1;x.side(0).honor=4;
    x.side(0).hand=[caster.id,reserve.id,trophy.id,rite.id];
  });
  play(caster.id,0);play(reserve.id);play(trophy.id);
  const honor=b.side(0).honor;play(rite.id,0);
  assert(b.side(0).honor===honor-rite.effect.honorCost,'Honor rite spends exact cost');
  b.side(0).board[0].ready=true;A.render();
  const plasma=b.side(0).plasma;
  click('[data-action="battle-attack"][data-lane="0"]');click('[data-action="battle-target-hero"]');
  assert(b.side(0).plasma===plasma-caster.plasmaPerAttack,'Caster spends plasma through UI');
  const savedBefore=S.capture(b);
  click('[data-action="pause-battle"]');click('[data-action="resume-battle"]');
  assert(JSON.stringify(S.capture(A.state.battleContext.battle))===JSON.stringify(savedBefore),'Pause/resume preserves whole board and RNG');
  window.scrollTo(0,0);
  const overflow=document.documentElement.scrollWidth>window.innerWidth+1;
  assert(!overflow,'Battle has no horizontal page overflow');
  return {passed:true,checks:checks.length,steps:checks,deckImports:6,
    scenarios:['human-ammo-mod-technique','hive-egg-fusion-evolution','yautja-plasma-honor','pause-resume'],
    viewport:{width:window.innerWidth,height:window.innerHeight},horizontalOverflow:overflow};
}
