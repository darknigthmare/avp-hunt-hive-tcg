import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const files=['data.js','expansion.js','expansion-wave2.js','deck-productions.js',
  'asymmetric-cards.js','asymmetric-decks.js','engine.js','asymmetric-rules.js'];
const context=vm.createContext({window:{},Intl,Date,Math});
for(const file of files)vm.runInContext(readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),context,{filename:file});
const {AVP_DATA:D,AVPEngine:E}=context.window;
const registry=new Map(D.cards.map(card=>[card.id,card]));
const total=map=>Object.values(map).reduce((sum,n)=>sum+n,0);
const stage=card=>card.evolutionStage||({X_OVOMORPH:'EGG',X_FACEHUGGER:'FACEHUGGER',X_CHESTBURSTER:'CHESTBURSTER'}[card.id]);
const effects=card=>[card.effect,card.effect?.onPlay,card.effect?.onEquip].filter(Boolean);
const initialEffect=(card,kind)=>effects(card).find(effect=>effect.kind===kind&&!effect.honorCost&&!effect.biomassCost);

// Analyse indépendante par atteignabilité : une larve présente dans le deck ne
// devient pas un matériau disponible tant que sa chaîne d'invocation est coupée.
function dependencyErrors(deck){
  const cards=Object.keys(deck).filter(id=>deck[id]>0).map(id=>registry.get(id));
  const present=new Set(cards.map(card=>card.id));
  const reachable=new Set(cards.filter(card=>card.type==='UNIT'&&!card.requiresEgg
    &&!card.summonByFusion&&!card.crewRequired).map(card=>card.id));
  const onBoard=predicate=>cards.some(card=>reachable.has(card.id)&&predicate(card));
  const has=predicate=>cards.some(predicate);
  const eggsFor=hug=>onBoard(card=>stage(card)==='EGG'&&(hug.eggLine!=='ROYAL'||card.eggLine==='ROYAL'));
  const supplied=kind=>cards.reduce((n,card)=>{
    const effect=initialEffect(card,kind);
    if(!effect||(card.type==='UNIT'&&!reachable.has(card.id)))return n;
    return n+deck[card.id]*(effect.amount||1);
  },0);
  for(let pass=0;pass<=cards.length;pass++){
    const before=reachable.size;
    for(const card of cards){
      if(card.requiresEgg&&eggsFor(card))reachable.add(card.id);
      if(card.crewRequired&&onBoard(pilot=>pilot.cardClass==='PERSONNAGE'&&pilot.faction===card.faction))reachable.add(card.id);
      const effect=card.effect||{};
      if(effect.kind==='HIVE_FUSION'&&present.has(effect.resultCardId)
        &&onBoard(hug=>stage(hug)==='FACEHUGGER')
        &&onBoard(host=>host.cardClass==='HOTE'&&host.hostType===effect.hostType))reachable.add(effect.resultCardId);
      if(effect.kind==='HIVE_EVOLVE'&&present.has(effect.resultCardId)
        &&onBoard(source=>stage(source)===effect.fromStage&&(!effect.hostType||source.hostType===effect.hostType))
        &&(supplied('HIVE_BIOMASS')>=effect.biomassCost||onBoard(hug=>hug.requiresEgg)))reachable.add(effect.resultCardId);
    }
    if(before===reachable.size)break;
  }
  const errors=[];
  for(const card of cards){
    const effect=card.effect||{};
    const error=message=>errors.push(card.id+': '+message);
    if(card.type==='UNIT'&&!reachable.has(card.id))error('invocation inaccessible');
    if(card.cardClass==='HOTE'&&!has(recipe=>recipe.effect?.kind==='HIVE_FUSION'&&recipe.effect.hostType===card.hostType))error('hôte sans fusion');
    if(effect.kind==='HIVE_FUSION'){
      if(!present.has(effect.resultCardId))error('résultat de fusion absent');
      if(!onBoard(hug=>stage(hug)==='FACEHUGGER'))error('Facehugger inaccessible');
      if(!onBoard(host=>host.cardClass==='HOTE'&&host.hostType===effect.hostType))error('hôte compatible absent');
    }
    if(effect.kind==='HIVE_EVOLVE'){
      if(!present.has(effect.resultCardId))error('résultat de mue absent');
      if(!onBoard(source=>stage(source)===effect.fromStage&&(!effect.hostType||source.hostType===effect.hostType)))error('matériau de mue inaccessible');
      if(!supplied('HIVE_BIOMASS')&&!onBoard(hug=>hug.requiresEgg))error('biomasse inaccessible');
    }
    if(card.slot==='WEAPON'&&card.ammoType){
      const rounds=cards.reduce((n,ammo)=>n+(ammo.cardClass==='MUNITION'&&ammo.ammoType===card.ammoType?deck[ammo.id]*ammo.rounds:0),0);
      if(rounds<(card.ammoPerAttack||1))error('munitions compatibles insuffisantes');
      if(!onBoard(holder=>holder.faction==='HUMAN'&&['PERSONNAGE','VEHICULE'].includes(holder.cardClass)))error('porteur humain absent');
    }
    if(card.cardClass==='MUNITION'&&!has(weapon=>weapon.slot==='WEAPON'&&weapon.ammoType===card.ammoType))error('munition sans arme');
    if(card.cardClass==='MODIFICATION'&&!has(weapon=>weapon.slot==='WEAPON'&&card.compatibleFamilies.includes(weapon.weaponFamily)))error('mod sans famille compatible');
    if(effect.kind==='WEAPON_TECHNIQUE'){
      const family=effect.weaponFamily||card.weaponFamily;
      if(!family)error('famille de technique absente');
      if(!has(weapon=>weapon.slot==='WEAPON'&&weapon.weaponFamily===family&&weapon.ammoType===effect.ammoType))error('technique sans arme de la bonne famille');
      const rounds=cards.reduce((n,ammo)=>n+(ammo.cardClass==='MUNITION'&&ammo.ammoType===effect.ammoType?deck[ammo.id]*ammo.rounds:0),0);
      if(rounds<effect.ammoCost)error('technique sans charges suffisantes');
    }
    if(card.plasmaPerAttack&&supplied('CHARGE_PLASMA')<card.plasmaPerAttack)error('réserve plasma insuffisante');
    if(effect.honorCost&&supplied('GAIN_HONOR')<effect.honorCost)error('honneur impossible à amorcer');
    if(effect.kind==='YAUTJA_TROPHY'&&!onBoard(hunter=>hunter.faction==='YAUTJA'&&hunter.attack>0))error('trophée sans chasseur');
  }
  return errors;
}

function inspect(preset,deck){
  const label=preset.id;
  assert.equal(total(deck.cards),30,label);
  assert.equal(total(deck.reserve),preset.boxCount-30,label+' réserve');
  assert(E.validateDeck(deck.cards,null,preset.faction).valid,label+' identité');
  assert.deepEqual(dependencyErrors(deck.cards),[],label+' principal');
  assert.deepEqual(Array.from(E.analyzeDeck(deck.cards,preset.faction).asymmetric||[]),[],label+' avertissements asymétriques');
  for(const [id,quantity]of Object.entries(deck.reserve)){
    assert(Number.isInteger(quantity)&&quantity>0,label+' quantité de réserve');
    assert((deck.cards[id]||0)+quantity<=D.rules.maxCopies,label+' limite '+id);
    assert(E.allowedForIdentity(registry.get(id),preset.faction),label+' identité de réserve '+id);
    // Une alternative ne compte pas sur une seconde carte cachée en réserve.
    assert.deepEqual(dependencyErrors({...deck.cards,[id]:(deck.cards[id]||0)+1}),[],label+' alternative '+id);
  }
}

test('les 318 préconstruits et toutes leurs alternatives ont des dépendances atteignables',()=>{
  assert.equal(D.expansionDecks.length,318);
  for(const preset of D.expansionDecks)inspect(preset,preset);
});

test('tous les 318 formats restent complets sur douze graines, sans dérive du catalogue historique',()=>{
  const seeds=[0,1,2,7,11,37,85,987,123456,0x7fffffff,0xffffffff,-17];
  const legacyIds=new Set(D.cards.slice(0,D.asymmetricEdition.startCount).map(card=>card.id));
  for(const preset of D.expansionDecks){
    const signatures=new Set();
    for(const seed of seeds){
      const deck=D.remixPresetDeck(preset,seed);
      inspect(preset,deck);
      signatures.add(JSON.stringify(deck.cards));
      assert.equal(JSON.stringify(deck),JSON.stringify(D.remixPresetDeck(preset,seed)),preset.id+' déterminisme '+seed);
      if(!preset.id.startsWith('asym_'))for(const id of [...Object.keys(deck.cards),...Object.keys(deck.reserve)])
        assert(legacyIds.has(id),preset.id+' carte asymétrique isolée '+id);
    }
    // Le petit pool hybride historique offre moins de combinaisons à courbe
    // identique ; chaque doctrine asymétrique doit néanmoins en fournir huit.
    assert(signatures.size>=(preset.faction==='HYBRID'?4:8),preset.id+' remélanges insuffisamment variés');
  }
});

test('les 38 doctrines gardent leurs ressources, leurs lignées et leurs résultats sur quarante graines',()=>{
  for(const preset of D.asymmetricDecks)for(let seed=1;seed<=40;seed++){
    const deck=D.remixPresetDeck(preset,seed*53);
    inspect(preset,deck);
    const cards=Object.keys(deck.cards).map(id=>registry.get(id));
    if(preset.faction==='HUMAN'){
      assert(cards.some(card=>card.cardClass==='ATTAQUE'),preset.id+' techniques');
      for(const card of cards.filter(card=>card.slot==='WEAPON'&&card.ammoType))assert.equal(card.weaponFamily,preset.focus);
    }
    if(preset.faction==='XENO'){
      const fusions=cards.filter(card=>card.effect?.kind==='HIVE_FUSION');
      assert(fusions.length>0,preset.id+' fusion');
      for(const fusion of fusions){
        assert.equal(fusion.effect.hostType,preset.focus);
        assert(deck.cards[fusion.effect.resultCardId]>=deck.cards[fusion.id],preset.id+' quantité de résultats');
      }
      if(preset.id.endsWith('_3')||preset.id.endsWith('_4'))assert(deck.cards[D.asymmetricStage.praetorian]);
      if(preset.id.endsWith('_4'))assert(deck.cards[D.asymmetricStage.queen]);
      const royalHuggers=cards.filter(card=>card.requiresEgg&&card.eggLine==='ROYAL').reduce((n,card)=>n+deck.cards[card.id],0);
      const royalEggs=cards.filter(card=>stage(card)==='EGG'&&card.eggLine==='ROYAL').reduce((n,card)=>n+deck.cards[card.id],0);
      assert(royalEggs>=royalHuggers,preset.id+' œufs royaux');
    }
    if(preset.faction==='YAUTJA'){
      assert(cards.some(card=>card.cardClass==='RESERVE_PLASMA'),preset.id+' plasma');
      assert(cards.some(card=>initialEffect(card,'GAIN_HONOR')),preset.id+' amorce d’honneur');
    }
  }
});

test('les douze cycles préconstruits exécutent leurs évolutions avec uniquement les cartes du principal',()=>{
  for(const preset of D.asymmetricDecks.filter(preset=>preset.faction==='XENO')){
    const battle=new E.Battle({playerDeck:preset.cards,aiDeck:D.asymmetricDecks.find(preset=>preset.faction==='HUMAN').cards,seed:41});
    const side=battle.side(0);
    side.hand=[];side.deck=E.expandDeck(preset.cards);
    const available=Object.keys(preset.cards).map(id=>registry.get(id));
    const choose=predicate=>available.find(predicate);
    const play=(card,target={kind:'NONE'})=>{
      assert(card,preset.id+' composant absent');
      let index=side.hand.indexOf(card.id);
      if(index<0){
        const deckIndex=side.deck.indexOf(card.id);
        assert(deckIndex>=0,preset.id+' carte non possédée '+card.id);
        side.deck.splice(deckIndex,1);side.hand.push(card.id);index=side.hand.length-1;
      }
      side.energy=10;side.maxEnergy=10;
      const result=battle.playCard(0,index,target);
      assert(result.ok,preset.id+' '+card.id+': '+result.reason);
    };
    const hug=choose(card=>card.requiresEgg);
    const egg=choose(card=>stage(card)==='EGG'&&(hug.eggLine!=='ROYAL'||card.eggLine==='ROYAL'));
    const host=choose(card=>card.cardClass==='HOTE'&&card.hostType===preset.focus);
    const fusion=choose(card=>card.effect?.kind==='HIVE_FUSION');
    play(egg,{kind:'FRIENDLY_LANE',lane:0});
    play(host,{kind:'FRIENDLY_LANE',lane:1});
    play(hug,{kind:'HATCH_EGG',lane:0});
    play(fusion,{kind:'FRIENDLY_UNIT',lane:0});
    assert.equal(side.board[0].cardId,fusion.effect.resultCardId,preset.id);
    for(const card of available.filter(card=>card.cardClass==='BIOMASSE'))play(card);
    for(const fromStage of ['CHESTBURSTER','DRONE','PRAETORIAN']){
      const evolution=choose(card=>card.effect?.kind==='HIVE_EVOLVE'&&card.effect.fromStage===fromStage);
      if(!evolution)continue;
      play(evolution,{kind:'FRIENDLY_UNIT',lane:0});
      assert.equal(side.board[0].cardId,evolution.effect.resultCardId,preset.id+' '+fromStage);
    }
  }
});
