import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const files=['data.js','expansion.js','expansion-wave2.js','deck-productions.js',
  'asymmetric-cards.js','asymmetric-decks.js','engine.js','asymmetric-rules.js','duel-save.js'];
const scripts=files.map(file=>readFileSync(new URL('../src/'+file,import.meta.url),'utf8'));
function setup(){
  const context=vm.createContext({window:{},Intl,Date,Math});
  for(let i=0;i<scripts.length;i++)vm.runInContext(scripts[i],context,{timeout:6000,filename:files[i]});
  return {D:context.window.AVP_DATA,E:context.window.AVPEngine,S:context.window.AVPDuelSave};
}
const {D,E,S}=setup();
const get=pred=>D.cards.find(pred);
const prepared=faction=>D.asymmetricDecks.find(x=>x.faction===faction);
function battle(first='HUMAN',second='XENO',seed=85){
  const x=setup();
  const b=new x.E.Battle({playerDeck:x.D.asymmetricDecks.find(p=>p.faction===first).cards,
    aiDeck:x.D.asymmetricDecks.find(p=>p.faction===second).cards,seed});
  b.side(0).energy=10;b.side(0).maxEnergy=10;
  return {...x,b};
}
const move=(b,cardId,target)=>{
  const side=b.side(0);side.energy=10;side.hand=[cardId];
  const result=b.playCard(0,0,target);
  assert(result.ok,cardId+': '+result.reason);
  return result;
};
test('235 cartes inédites, 3 doctrines, 38 decks et 19 boosters sans perte des 656 références actives',()=>{
  assert.equal(D.asymmetricEdition.startCount,656);
  assert.equal(D.asymmetricEdition.addedCount,235);
  assert.equal(D.cards.length,891);
  assert.equal(D.expansionDecks.length,318);
  assert.equal(D.asymmetricDecks.length,38);
  assert.equal(D.boosters.length,19);
  assert.equal(D.version,'1.3.0-asymmetric');
  assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
  assert.equal(D.cards[0].id,'X_OVOMORPH');
  assert(D.cards[655].id.startsWith('BX_'));
  const sourceCsv=readFileSync(new URL('../content-plan/alien-base-sources.csv',import.meta.url),'utf8');
  const registered=new Set(sourceCsv.split(/\r?\n/).slice(1).map(s=>s.split(',',1)[0]).filter(Boolean));
  for(const c of D.cards.slice(656)){
    assert(registered.has(c.sourceEntityId),'Référence Alien_base absente: '+c.id);
    assert.equal(c.sourcePolicy,'asymmetric-mechanics-proposed-not-lore-fact');
    assert(D.cardClasses[c.cardClass]);
    assert(['UNIT','EQUIPMENT','TACTIC','LOCATION'].includes(c.type));
  }
});

test('38 decks spécialisés ont 30 cartes +15 alternatives, sans copies illégales et remix cohérent',()=>{
  for(const p of D.asymmetricDecks){
    assert.equal(p.boxCount,45);assert.equal(p.count,30);
    assert(E.validateDeck(p.cards,null,p.faction).valid,p.id);
    assert.equal(Object.values(p.cards).reduce((a,b)=>a+b,0),30,p.id);
    assert.equal(Object.values(p.reserve).reduce((a,b)=>a+b,0),15,p.id);
    for(const [id,n]of Object.entries(p.reserve))assert((p.cards[id]||0)+n<=3,p.id+': '+id);
    for(const seed of [11,37]){
      const x=D.remixPresetDeck(p,seed),y=D.remixPresetDeck(p,seed);
      assert.equal(JSON.stringify(x),JSON.stringify(y));
      assert(E.validateDeck(x.cards,null,p.faction).valid,p.id);
      assert.equal(Object.values(x.reserve).reduce((a,b)=>a+b,0),15,p.id);
    }
  }
});

test('packs asymétriques délivrent neuf cartes de la seule doctrine, avec protection UR',()=>{
  for(const id of D.asymmetricEdition.boosterIDs)for(const pity of [0,9])for(let seed=1;seed<=45;seed++){
    const result=E.openBooster(id,{pity,seed});
    assert.equal(result.pulls.length,9);
    const cardIds=new Set(result.pulls.map(x=>x.cardId));
    assert.equal(cardIds.size,9,'Unicité des tirages '+id);
    assert(result.pulls.every(p=>{
      const c=E.CARD.get(p.cardId);
      return c.set===result.pack.set&&c.faction===result.pack.primaryFaction&&c.tags.includes('asymmetric');
    }),id);
    if(pity===9)assert(result.bestRank>=4,id+' pity');
  }
});

test('armes humaines non chargées, munitions et mods de famille/socket compatibles',()=>{
  const {D,E,b}=battle();
  const marine=get(c=>c.id.startsWith('MX_HU')&&c.cardClass==='PERSONNAGE');
  const gun=get(c=>c.cardClass==='ARME'&&c.faction==='HUMAN'&&c.weaponFamily==='pulse');
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===gun.ammoType);
  const mod=get(c=>c.cardClass==='MODIFICATION'&&c.compatibleFamilies.includes('pulse'));
  const wrong=get(c=>c.cardClass==='MODIFICATION'&&!c.compatibleFamilies.includes('pulse'));
  assert(b.summonAt(0,marine.id,0));
  const holder=b.side(0).board[0],bare=b.unitAttack(0,holder);
  b.side(0).hand=[mod.id];assert.equal(b.canPlay(0,0).ok,false,'Mod sans arme');
  move(b,gun.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.unitAttack(0,holder),bare,'Arme sans cartouche = aucun bonus de tir');
  b.side(0).hand=[wrong.id];assert.equal(b.canPlay(0,0).ok,false,'Mod incompatible');
  move(b,ammo.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert(holder.ammoPacks.length===1&&holder.ammoPacks[0].remaining===ammo.rounds);
  const loaded=b.unitAttack(0,holder);assert(loaded>bare,'Bonus d’arme chargé');
  move(b,mod.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert(b.unitAttack(0,holder)>loaded,'Mod de même famille');
  b.side(0).hand=[mod.id];assert.equal(b.canPlay(0,0).ok,false,'Socket déjà occupé');
  const last=holder.ammoPacks[0].remaining;holder.ready=true;
  assert(b.attack(0,0,{kind:'HERO'}).ok);
  assert.equal(holder.ammoPacks[0].remaining,last-gun.ammoPerAttack);
});

test('attaque spécialisée consomme exactement les charges imprimées et refuse les armes sans énergie',()=>{
  const {D,E,b}=battle();
  const soldier=get(c=>c.cardClass==='PERSONNAGE'&&c.faction==='HUMAN'&&c.id.startsWith('MX_'));
  const weapon=get(c=>c.cardClass==='ARME'&&c.weaponFamily==='pulse'&&c.faction==='HUMAN');
  const ammo=get(c=>c.cardClass==='MUNITION'&&c.ammoType===weapon.ammoType);
  const shot=get(c=>c.cardClass==='ATTAQUE'&&c.effect.ammoType===weapon.ammoType&&c.effect.ammoCost===1);
  assert(b.summonAt(0,soldier.id,0));assert(b.summonAt(1,'X_WARRIOR',0));
  move(b,weapon.id,{kind:'FRIENDLY_UNIT',lane:0});
  b.side(0).hand=[shot.id];assert.equal(b.canPlay(0,0).ok,false);
  move(b,ammo.id,{kind:'FRIENDLY_UNIT',lane:0});
  const charges=b.side(0).board[0].ammoPacks[0].remaining;
  move(b,shot.id,{kind:'ENEMY_UNIT',lane:0});
  assert.equal(b.side(0).board[0].ammoPacks[0].remaining,charges-1);
});

test('éclosion, fusion hôte biologique et évolution consomment les cartes et la biomasse',()=>{
  const {D,E,b}=battle('XENO','HUMAN');
  const egg=get(c=>c.cardClass==='OEUF'&&c.eggLine==='COMMON');
  const hug=get(c=>c.requiresEgg&&c.eggLine==='COMMON');
  const host=get(c=>c.cardClass==='HOTE'&&c.hostType==='HUMAN');
  const fusion=get(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType==='HUMAN');
  const evolve=get(c=>c.effect?.kind==='HIVE_EVOLVE'&&c.effect.fromStage==='CHESTBURSTER'&&c.effect.hostType==='HUMAN');
  assert(egg&&hug&&host&&fusion&&evolve);
  b.side(0).hand=[hug.id];assert.equal(b.canPlay(0,0).ok,false,'Facehugger doit sacrifier un Œuf');
  assert(b.summonAt(0,egg.id,0));assert(b.summonAt(0,host.id,1));
  move(b,hug.id,{kind:'HATCH_EGG',lane:0});
  assert.equal(b.side(0).board[0].cardId,hug.id);
  assert.equal(b.side(0).biomass,1);
  const chest=D.cards.find(c=>c.id===fusion.effect.resultCardId);
  assert.equal(b.summonAt(0,chest.id,2),null,'Caste de fusion non jouable directement');
  b.side(0).deck.push(chest.id);
  move(b,fusion.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.side(0).board[0].cardId,chest.id);
  assert.equal(b.side(0).board[1],null);
  assert.equal(b.side(0).biomass,3);
  const adult=D.cards.find(c=>c.id===evolve.effect.resultCardId);
  b.side(0).deck.push(adult.id);
  move(b,evolve.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.side(0).board[0].cardId,adult.id);
  assert.equal(b.side(0).biomass,2);
});

test('la Ruche exige son stade, la lignée d’hôte et les résultats disponibles',()=>{
  const {b}=battle('XENO','HUMAN');
  const fusion=get(c=>c.effect?.kind==='HIVE_FUSION'&&c.effect.hostType==='YAUTJA');
  b.side(0).hand=[fusion.id];
  assert.equal(b.canPlay(0,0).ok,false,'Ne doit pas fusionner sans hôte ni Facehugger');
  const royal=get(c=>c.requiresEgg&&c.eggLine==='ROYAL');
  b.side(0).hand=[royal.id];
  const ordinary=get(c=>c.cardClass==='OEUF'&&c.eggLine==='COMMON');
  assert(b.summonAt(0,ordinary.id,0));
  assert.equal(b.canPlay(0,0).ok,false,'Royal Facehugger sur œuf non royal');
});

test('Yautja : plasma consumé, trophée requis et honneur dépensable',()=>{
  const {D,E,b}=battle('YAUTJA','HUMAN');
  const hunter=get(c=>c.cardClass==='PERSONNAGE'&&c.faction==='YAUTJA'&&c.id.startsWith('MX_'));
  const caster=get(c=>c.faction==='YAUTJA'&&c.plasmaPerAttack);
  const charge=get(c=>c.cardClass==='RESERVE_PLASMA');
  const trophy=get(c=>c.cardClass==='TROPHEE');
  const ritual=get(c=>c.cardClass==='HONNEUR'&&c.effect?.kind==='HONOR_BUFF');
  assert(b.summonAt(0,hunter.id,0));
  const u=b.side(0).board[0],before=b.unitAttack(0,u);
  move(b,caster.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.unitAttack(0,u),before);
  move(b,charge.id,{kind:'NONE'});
  assert(b.unitAttack(0,u)>before);
  const initial=b.side(0).plasma;u.ready=true;
  assert(b.attack(0,0,{kind:'HERO'}).ok);
  assert.equal(b.side(0).plasma,initial-caster.plasmaPerAttack);
  b.side(0).hand=[trophy.id];assert.equal(b.canPlay(0,0).ok,false,'Trophée non gagné');
  b.side(0).trophies=1;move(b,trophy.id,{kind:'NONE'});
  assert(b.side(0).honor>=1);
  const old=b.side(0).honor;move(b,ritual.id,{kind:'FRIENDLY_UNIT',lane:0});
  assert.equal(b.side(0).honor,old-ritual.effect.honorCost);
});

test('points de reprise v1 compatibles et nouvelles ressources vérifiées sans injection',()=>{
  const {D,E,S,b}=battle();
  const player=b.side(0);
  const marine=get(c=>c.cardClass==='PERSONNAGE'&&c.faction==='HUMAN'&&c.id.startsWith('MX_'));
  const ammo=get(c=>c.cardClass==='MUNITION');
  assert(b.summonAt(0,marine.id,0));
  move(b,ammo.id,{kind:'FRIENDLY_UNIT',lane:0});
  player.biomass=3;player.honor=4;player.plasma=5;
  const saved=S.capture(b),restored=S.restore(saved);
  assert.equal(restored.side(0).biomass,3);
  assert.equal(restored.side(0).honor,4);
  assert.equal(restored.side(0).plasma,5);
  assert.equal(restored.side(0).board[0].ammoPacks.length,1);
  const unsafe=JSON.parse(JSON.stringify(saved));unsafe.state.sides[0].plasma=100;
  assert.throws(()=>S.restore(unsafe));
  const fake=JSON.parse(JSON.stringify(saved));fake.state.sides[0].board[0].ammoPacks[0].remaining=99;
  assert.throws(()=>S.restore(fake));
  const legacy=JSON.parse(JSON.stringify(saved));
  for(const s of legacy.state.sides){
    delete s.biomass;delete s.honor;delete s.plasma;
    for(const u of s.board)if(u)delete u.ammoPacks;
  }
  // Ancien format sans nouveau champ : l'importation n'ajoute aucune valeur non annoncée.
  legacy.state.sides[0].board[0].equipment=[];
  assert.doesNotThrow(()=>S.restore(legacy));
});

test('analyse prévient les decks sans munitions, sans hôte ou sans plasma',()=>{
  const gun=get(c=>c.cardClass==='ARME'&&c.faction==='HUMAN'&&c.ammoType);
  const fusion=get(c=>c.effect?.kind==='HIVE_FUSION');
  const gunP=get(c=>c.faction==='YAUTJA'&&c.plasmaPerAttack);
  assert(E.analyzeDeck({[gun.id]:1},'HUMAN').asymmetric.some(s=>s.includes('Munitions')));
  assert(E.analyzeDeck({[fusion.id]:1},'XENO').asymmetric.some(s=>s.includes('Œufs')));
  assert(E.analyzeDeck({[gunP.id]:1},'YAUTJA').asymmetric.some(s=>s.includes('plasma')));
});

test('les cinq factions IA restent légales et la PWA publie les trois nouveaux scripts',()=>{
  for(const faction of ['HUMAN','XENO','YAUTJA','ENGINEER','HYBRID'])for(let seed=1;seed<=12;seed++)
    assert(E.validateDeck(E.buildAiDeck([faction],1.4,seed),null,faction).valid,faction+' '+seed);
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const allow=readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
  const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert(index.indexOf('asymmetric-cards.js')<index.indexOf('asymmetric-decks.js'));
  assert(index.indexOf('asymmetric-decks.js')<index.indexOf('src/engine.js'));
  assert(index.indexOf('asymmetric-rules.js')>index.indexOf('src/engine.js'));
  assert(sw.includes('asymmetric-rules.js')&&allow.includes('asymmetric-cards.js'));
  assert(build.includes('live.cards.length!==891'));
});
