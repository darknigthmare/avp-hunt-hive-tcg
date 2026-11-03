import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const files=['data','expansion','expansion-wave2','deck-productions','asymmetric-cards',
  'asymmetric-decks','engine','asymmetric-rules','duel-save'];
const scripts=files.map(name=>readFileSync(new URL('../src/'+name+'.js',import.meta.url),'utf8'));
function setup(faction='HUMAN'){
  const context=vm.createContext({window:{},Intl,Date,Math});
  scripts.forEach((code,i)=>vm.runInContext(code,context,{filename:files[i]+'.js'}));
  const D=context.window.AVP_DATA,E=context.window.AVPEngine,S=context.window.AVPDuelSave;
  const b=new E.Battle({playerDeck:D.asymmetricDecks.find(p=>p.faction===faction).cards,
    aiDeck:D.asymmetricDecks.find(p=>p.faction==='YAUTJA').cards,seed:9001});
  b.side(0).energy=10;b.side(0).maxEnergy=10;
  const get=predicate=>D.cards.find(predicate);
  const play=(card,target={kind:'NONE'})=>{
    b.side(0).energy=10;b.side(0).hand=[card.id];
    const result=b.playCard(0,0,target);assert(result.ok,card.name+': '+result.reason);return result;
  };
  return {D,E,S,b,get,play};
}
function armedHuman(x){
  const person=x.get(c=>c.id.startsWith('MX_')&&c.cardClass==='PERSONNAGE'&&c.faction==='HUMAN');
  const weapon=x.get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse'&&c.ammoPerAttack===1);
  const ammo=x.get(c=>c.cardClass==='MUNITION'&&c.ammoType===weapon.ammoType);
  assert(x.b.summonAt(0,person.id,0));
  x.play(weapon,{kind:'FRIENDLY_UNIT',lane:0});x.play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  return {person,weapon,ammo,u:x.b.side(0).board[0]};
}
const copies=(side,id)=>side.discard.filter(x=>x===id).length;

test('la dernière charge défausse la munition une fois et libère sa place de recharge',()=>{
  const x=setup(),{ammo,u}=armedHuman(x),s=x.b.side(0);
  u.ammoPacks[0].remaining=1;u.ready=true;
  assert(x.b.attack(0,0,{kind:'HERO'}).ok);
  assert.equal(u.ammoPacks.length,0);assert(!u.equipment.includes(ammo.id));
  assert.equal(copies(s,ammo.id),1);
  x.play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(u.ammoPacks[0].remaining,ammo.rounds);
  assert.equal(copies(s,ammo.id),1,'Recharger ne défausse pas une deuxième copie');
  assert.doesNotThrow(()=>x.S.restore(x.S.capture(x.b)));
});

test('une ancienne sauvegarde contenant six chargeurs vides peut être rechargée',()=>{
  const x=setup(),{ammo,u}=armedHuman(x),s=x.b.side(0);
  for(let i=1;i<6;i++)x.play(ammo,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(u.ammoPacks.length,6);
  s.hand=[ammo.id];s.energy=10;
  assert.equal(x.b.canPlay(0,0).ok,false,'Six réserves encore pleines occupent les six places');
  for(const pack of u.ammoPacks)pack.remaining=0;
  const resumed=x.S.restore(x.S.capture(x.b));
  assert(resumed.canPlay(0,0).ok,'Les anciennes réserves vides ne bloquent plus la recharge');
  assert(resumed.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok);
  const holder=resumed.side(0).board[0];
  assert.equal(holder.ammoPacks.length,1);assert.equal(holder.ammoPacks[0].remaining,ammo.rounds);
  assert.equal(holder.equipment.filter(id=>id===ammo.id).length,1);
  assert.equal(copies(resumed.side(0),ammo.id),6);
  assert.doesNotThrow(()=>x.S.restore(x.S.capture(resumed)));
});

test('la mort du porteur pendant sa dernière salve ne duplique pas ses munitions',()=>{
  const x=setup(),{ammo,u}=armedHuman(x);
  u.ammoPacks[0].remaining=1;u.currentHealth=1;u.ready=true;
  assert(x.b.summonAt(1,'X_WARRIOR',0));
  assert(x.b.attack(0,0,{kind:'UNIT',lane:0}).ok);
  assert.equal(x.b.side(0).board[0],null);
  assert.equal(copies(x.b.side(0),ammo.id),1);
  assert.doesNotThrow(()=>x.S.restore(x.S.capture(x.b)));
});

test('les techniques exigent leur famille exacte et une cible avant toute dépense',()=>{
  const x=setup(),{u}=armedHuman(x),s=x.b.side(0);
  assert(x.b.summonAt(1,'X_WARRIOR',0));
  const smart=x.get(c=>c.effect?.kind==='WEAPON_TECHNIQUE'&&c.effect.weaponFamily==='smart');
  const pulse=x.get(c=>c.effect?.kind==='WEAPON_TECHNIQUE'&&c.effect.weaponFamily==='pulse');
  assert(smart&&pulse);assert.equal(smart.effect.ammoType,pulse.effect.ammoType);
  s.hand=[smart.id];s.energy=10;
  const before=JSON.stringify(s);
  assert.equal(x.b.playCard(0,0,{kind:'ENEMY_UNIT',lane:0}).ok,false);
  assert.equal(JSON.stringify(s),before,'Même calibre ne signifie pas même technique');
  s.hand=[pulse.id];
  const charges=u.ammoPacks[0].remaining,energy=s.energy;
  assert.equal(x.b.playCard(0,0,{kind:'ENEMY_UNIT',lane:2}).ok,false);
  assert.equal(s.energy,energy);assert.equal(u.ammoPacks[0].remaining,charges);
  x.b.applyEffect(0,pulse.effect,{target:{kind:'ENEMY_UNIT',lane:2}});
  assert.equal(u.ammoPacks[0].remaining,charges,'Un effet sans cible ne consomme aucune charge');
  assert(x.b.playCard(0,0,{kind:'ENEMY_UNIT',lane:0}).ok);
  assert.equal(u.ammoPacks[0].remaining,charges-pulse.effect.ammoCost);
});

test('évolution Unique : conflit refusé avant le sacrifice, les ressources et la carte résultat',()=>{
  const x=setup('XENO'),s=x.b.side(0);
  const crown=x.get(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='PRAETORIAN');
  const praetorian=x.get(c=>c.evolutionStage==='PRAETORIAN');
  const queen=x.E.CARD.get(crown.effect.resultCardId);
  assert(x.b.summonAt(0,queen.id,0,{fromFusion:true}));
  assert(x.b.summonAt(0,praetorian.id,1,{fromFusion:true}));
  s.hand=[crown.id,queen.id];s.biomass=5;
  const before=JSON.stringify(s);
  assert.equal(x.b.canPlay(0,0).ok,false);
  assert.equal(x.b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:1}).ok,false);
  x.b.applyEffect(0,crown.effect,{target:{kind:'FRIENDLY_UNIT',lane:1}});
  assert.equal(JSON.stringify(s),before);
  s.board[0]=null;
  assert(x.b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:1}).ok);
  assert.equal(s.board[1].cardId,queen.id);assert.equal(s.biomass,2);
  assert.equal(copies(s,praetorian.id),1);assert(!s.hand.includes(queen.id));
});

test('fusion : un hôte synthétique est refusé sans détruire les matériaux',()=>{
  const x=setup('XENO'),s=x.b.side(0);
  const fusion=x.get(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType==='HUMAN');
  const host=x.get(c=>c.cardClass==='HOTE'&&c.hostType==='HUMAN');
  assert(x.b.summonAt(0,'X_FACEHUGGER',0));assert(x.b.summonAt(0,host.id,1));
  s.board[1].granted.push('SYNTHETIC');s.hand=[fusion.id,fusion.effect.resultCardId];
  const before=JSON.stringify(s);
  assert.equal(x.b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok,false);
  assert.equal(JSON.stringify(s),before);
  s.board[1].granted=[];
  assert(x.b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok);
  assert.equal(s.board[0].cardId,fusion.effect.resultCardId);assert.equal(s.board[1],null);
  assert.equal(copies(s,'X_FACEHUGGER'),1);assert.equal(copies(s,host.id),1);
});

test('éclosion : l’œuf sacrifié rejoint une seule fois la défausse',()=>{
  const x=setup('XENO'),s=x.b.side(0);
  const egg=x.get(c=>c.cardClass==='OEUF'&&c.eggLine==='COMMON');
  const hugger=x.get(c=>c.requiresEgg&&c.eggLine==='COMMON');
  assert(x.b.summonAt(0,egg.id,0));x.play(hugger,{kind:'HATCH_EGG',lane:0});
  assert.equal(s.board[0].cardId,hugger.id);assert.equal(s.biomass,1);
  assert.equal(copies(s,egg.id),1);
});

test('une arme sèche ne retire pas un mot-clef intrinsèque ou accordé par ailleurs',()=>{
  const x=setup(),{weapon,u}=armedHuman(x);
  weapon.keywords=['ARMOR'];u.ammoPacks[0].remaining=0;u.granted=['ARMOR'];
  assert(x.b.has(u,'ARMOR'));
  u.granted=[];assert.equal(x.b.has(u,'ARMOR'),false);
  u.tempGranted=['ARMOR'];assert(x.b.has(u,'ARMOR'));
  u.tempGranted=[];u.ammoPacks[0].remaining=1;assert(x.b.has(u,'ARMOR'));
});

test('une partie terminée ne gagne plus de biomasse, plasma ou honneur',()=>{
  const {b}=setup();b.state.winner=0;
  const before=JSON.stringify(b.side(0));
  for(const kind of ['HIVE_BIOMASS','CHARGE_PLASMA','GAIN_HONOR'])b.applyEffect(0,{kind,amount:4});
  assert.equal(JSON.stringify(b.side(0)),before);
});

test('le diagnostic distingue familles, résultat de fusion absent et œuf royal manquant',()=>{
  const {E,get}=setup();
  const pulse=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse');
  const smart=get(c=>c.effect?.kind==='WEAPON_TECHNIQUE'&&c.effect.weaponFamily==='smart');
  const fusion=get(c=>c.effect?.kind==='HIVE_FUSION');
  const royal=get(c=>c.requiresEgg&&c.eggLine==='ROYAL');
  const human=E.analyzeDeck({[pulse.id]:1,[smart.id]:1},'HUMAN').asymmetric;
  assert(human.some(s=>s.includes('SMART')&&s.includes('arme compatible manquante')));
  const hive=E.analyzeDeck({[fusion.id]:1,[royal.id]:1},'XENO').asymmetric;
  assert(hive.some(s=>s.includes('résultat absent')));assert(hive.some(s=>s.includes('Œuf royal manquant')));
});

test('l’IA choisit des doctrines complètes, déterministes et légales pour les trois factions',()=>{
  const {E}=setup();
  for(const faction of ['HUMAN','XENO','YAUTJA'])for(const seed of [1,17,311,9001]){
    const a=E.buildAiDeck([faction],1.4,seed),b=E.buildAiDeck([faction],1.4,seed);
    assert.equal(JSON.stringify(a),JSON.stringify(b));
    assert(E.validateDeck(a,null,faction).valid,faction+' / '+seed);
    assert.equal(E.analyzeDeck(a,faction).asymmetric.length,0,faction+' / '+seed+': '+E.analyzeDeck(a,faction).asymmetric.join(' ; '));
  }
  for(const factions of [['ENGINEER'],['HYBRID'],['HUMAN','XENO']]){
    const deck=E.buildAiDeck(factions,1.2,17);
    assert.equal(Object.values(deck).reduce((a,b)=>a+b,0),30);
  }
});
