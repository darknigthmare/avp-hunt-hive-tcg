import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=['data.js','expansion.js','expansion-wave2.js','engine.js','duel-save.js']
  .map(name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8'));
function setup(){
  const context=vm.createContext({window:{},Intl,Date,Math});
  vm.runInContext(code[0],context,{timeout:2500});
  const immutable=context.window.AVP_DATA.cards.map(card=>JSON.stringify(card));
  for(let i=1;i<code.length;i++)vm.runInContext(code[i],context,{timeout:5000});
  return {D:context.window.AVP_DATA,E:context.window.AVPEngine,S:context.window.AVPDuelSave,immutable};
}
function duel(D,E,seed=13){
  return new E.Battle({playerDeck:D.expansionDecks.find(x=>x.faction==='HUMAN').cards,
    aiDeck:D.expansionDecks.find(x=>x.faction==='XENO').cards,seed});
}
const {D,E,S,immutable}=setup();

test('656 cartes, 70 recettes, 30 extensions de production + une archive',()=>{
  assert.equal(immutable.length,158);
  assert.equal(D.cards.length,656);
  assert.equal(D.expansion.addedCount,156);
  assert.equal(D.expansionWave2.addedCount,342);
  assert.equal(D.version,'1.2.0-wave2');
  assert.equal(D.expansionDecks.length,70);
  assert.equal(Object.keys(D.sets).length,31);
  assert.equal(new Set(D.cards.map(c=>c.id)).size,656);
  assert.equal(new Set(D.cards.slice(158).map(c=>c.sourceEntityId)).size,494);
  assert.equal(D.keywords.PIERCING.length>15,true);
});

test('le catalogue et les 158 cartes historiques n ont perdu ni stat ni effet',()=>{
  for(let i=0;i<158;i++){
    const c={...D.cards[i]};delete c.cardClass;
    assert.equal(JSON.stringify(c),immutable[i],D.cards[i].id);
  }
  for(const c of D.cards){
    assert(E.CARD.has(c.id),c.id);
    assert(D.cardClasses[c.cardClass],c.id+': classe absente');
    assert(['UNIT','TACTIC','EQUIPMENT','LOCATION'].includes(c.type),c.id);
    assert(D.rarities[c.rarity],c.id);
    assert(D.sets[c.set],c.id);
    assert(c.source?.workbook&&c.source?.sheet&&c.source?.entry,c.id);
  }
  for(const c of D.cards.slice(314)){
    assert.equal(c.sourcePolicy,'adaptation-only-not-verified-canon');
    assert(c.sourceEntityId&&c.sourceClassification);
    assert(!c.source.prototype);
  }
});

test('tout le registre documentaire Alien_base est représenté sans référence fictive',()=>{
  const csv=readFileSync(new URL('../content-plan/alien-base-sources.csv',import.meta.url),'utf8');
  const sourceIds=new Set(csv.split(/\r?\n/).slice(1).map(l=>l.split(',',1)[0]).filter(Boolean));
  assert.equal(sourceIds.size,652);
  for(const c of D.cards.slice(158))assert(sourceIds.has(c.sourceEntityId),c.id+' => '+c.sourceEntityId);
  assert.equal(D.expansionWave2.sourceBlobSha,'393e88526dd16cd67c730761f23f68c4d8b97145');
});

test('70 decks de 30 cartes + 15 alternatives valides pour les cinq factions',()=>{
  const byFaction={};
  for(const p of D.expansionDecks){
    byFaction[p.faction]=(byFaction[p.faction]||0)+1;
    assert.equal(p.boxCount,45);
    assert.equal(Object.values(p.cards).reduce((a,b)=>a+b,0),30,p.id);
    assert.equal(Object.values(p.reserve).reduce((a,b)=>a+b,0),15,p.id);
    assert(E.validateDeck(p.cards,null,p.faction).valid,p.id);
    const analyzer=E.analyzeDeck(p.cards,p.faction);
    assert.equal(analyzer.total,30);
    assert.equal(Object.values(analyzer.classes).reduce((a,b)=>a+b,0),30);
    for(const [id,count] of Object.entries(p.reserve))assert(count+(p.cards[id]||0)<=3,p.id+' '+id);
  }
  for(const faction of ['HUMAN','YAUTJA','XENO','HYBRID','ENGINEER'])assert.equal(byFaction[faction],14);
  for(const faction of Object.keys(byFaction))for(let seed=1;seed<=20;seed++){
    const d=D.createRemixedDeck(faction,seed*53,seed%4);
    assert(E.validateDeck(d,null,faction).valid,faction+' '+seed);
    assert.equal(JSON.stringify(d),JSON.stringify(D.createRemixedDeck(faction,seed*53,seed%4)));
  }
});

test('tous les boosters 5/7/9 sont cohérents, à tirage local et protègent le pity',()=>{
  assert.equal(D.boosters.length,16);
  const sizes=new Set(),sets=new Set();
  for(const pack of D.boosters){
    const count=pack.cardsPerBooster||9;sizes.add(count);sets.add(pack.set);
    assert([5,7,9].includes(count));
    for(const pity of [0,9])for(let seed=1;seed<=30;seed++){
      const result=E.openBooster(pack.id,{seed,pity});
      assert.equal(result.pulls.length,count,pack.id);
      if(pack.preview){
        const pulled=result.pulls.map(x=>E.CARD.get(x.cardId));
        assert(pulled.every(c=>c.set===pack.set),pack.id+' cross-set');
        assert.equal(new Set(pulled.map(c=>c.id)).size,count,pack.id+' duplicates');
        if(pack.profile==='collector')assert(pulled.every(c=>E.RANK[c.rarity]>=3),pack.id+' collector not holo');
      }
      if(pity===9)assert(result.bestRank>=4,pack.id+' pity');
    }
  }
  assert.deepEqual([...sizes].sort((a,b)=>a-b),[5,7,9]);
  assert(sets.has('TF28')&&sets.has('HA29')&&sets.has('PH24'));
});

test('un pilote ne commande pas deux véhicules, un équipage détruit bloque l attaque',()=>{
  const first=D.cards.find(c=>c.faction==='HUMAN'&&c.cardClass==='PERSONNAGE'&&c.id.startsWith('BX_'));
  const vehicles=D.cards.filter(c=>c.faction==='HUMAN'&&c.cardClass==='VEHICULE').slice(0,2);
  assert(first&&vehicles.length===2);
  const b=duel(D,E);
  const pilot=b.summonAt(0,first.id,0);assert(pilot);
  const v=b.summonAt(0,vehicles[0].id,1);assert(v);
  assert.equal(b.summonAt(0,vehicles[1].id,2),null,'un deuxième véhicule sans second pilote');
  assert(b.unitAttack(0,v)>=vehicles[0].attack+200);
  v.ready=true;
  assert(b.legalAttacks(0,1).length>0);
  b.destroyUnit(0,0,{noDeath:true});
  assert.equal(b.legalAttacks(0,1).length,0);
});

test('perforation ignore l armure, et le diagnostic détecte les pilotes manquants',()=>{
  const b=duel(D,E);
  const attacker=b.summonAt(0,'H_COLONIAL_MARINE',0);
  const defender=b.summonAt(1,'X_WARRIOR',0);
  assert(attacker&&defender);
  defender.granted.push('ARMOR');defender.armorUsed=false;
  const health=defender.currentHealth;
  b.damageUnit(1,0,500,{sourceSide:0,unit:attacker});
  assert.equal(defender.currentHealth,health-100);
  const after=defender.currentHealth;defender.armorUsed=false;attacker.granted.push('PIERCING');
  b.damageUnit(1,0,500,{sourceSide:0,unit:attacker});
  assert.equal(defender.currentHealth,after-500);
  assert.equal(defender.armorUsed,false);
  const map={[D.cards.find(c=>c.crewRequired).id]:1};
  const report=E.analyzeDeck(map,'MIXED');
  assert(report.warnings.some(msg=>msg.includes('pilote')));
});

test('actions : déplacement, réparation, scanner, ravitaillement et blindage',()=>{
  const b=duel(D,E);
  const ally=b.summonAt(0,'H_COLONIAL_MARINE',0);assert(ally);
  b.damageUnit(0,0,200);const health=ally.currentHealth;
  b.applyEffect(0,{kind:'REPAIR_UNIT',amount:150},{target:{kind:'FRIENDLY_UNIT',lane:0}});
  assert.equal(ally.currentHealth,health+150);
  b.applyEffect(0,{kind:'REPOSITION'},{target:{kind:'FRIENDLY_UNIT',lane:0}});
  assert.equal(b.side(0).board[0],null);assert.equal(b.side(0).board[1],ally);
  const enemy=b.summonAt(1,'Y_UNBLOODED',0);assert(enemy);enemy.cloaked=true;
  b.applyEffect(0,{kind:'SCAN_REVEAL',draw:0});
  assert.equal(enemy.cloaked,false);
  b.applyEffect(0,{kind:'FORTIFY',amount:500});
  assert.equal(b.side(0).shield,500);
  b.applyEffect(0,{kind:'FORTIFY',amount:1200});
  assert.equal(b.side(0).shield,1200);
  enemy.granted.push('ARMOR');enemy.armorUsed=false;const before=enemy.currentHealth;
  b.applyEffect(0,{kind:'ARMOR_BREAK',amount:200},{target:{kind:'ENEMY_UNIT',lane:0}});
  assert.equal(enemy.currentHealth,before-200);assert.equal(enemy.armorUsed,true);
  const armour=b.card('EQ_MARINE_ARMOR');
  assert(armour);
  const hand=b.side(0).hand.length;
  b.applyEffect(0,{kind:'SUPPLY_SEARCH',maxCost:10});
  assert(b.side(0).hand.length===hand+1||!b.side(0).deck.some(id=>b.card(id).type==='EQUIPMENT'));
});

test('nouveaux effets et unités survivent au point de reprise du duel',()=>{
  const b=duel(D,E,277);
  const pilot=D.cards.find(c=>c.cardClass==='PERSONNAGE'&&c.faction==='HUMAN'&&c.id.startsWith('BX_'));
  const vehicle=D.cards.find(c=>c.cardClass==='VEHICULE'&&c.faction==='HUMAN'&&c.id.startsWith('BX_'));
  const location=D.cards.find(c=>c.cardClass==='LIEU'&&c.faction==='HUMAN'&&c.id.startsWith('BX_'));
  assert(pilot&&vehicle&&location);
  assert(b.summonAt(0,pilot.id,0));
  assert(b.summonAt(0,vehicle.id,1));
  b.side(0).location={cardId:location.id};b.syncHealthAuras();
  const saved=S.capture(b),restored=S.restore(saved);
  assert.equal(restored.side(0).board[1].cardId,vehicle.id);
  assert.equal(restored.side(0).location.cardId,location.id);
  assert.equal(restored.unitMaxHealth(0,restored.side(0).board[1]),b.unitMaxHealth(0,b.side(0).board[1]));
});

test('toutes les factions génèrent des decks IA légaux avec les nouvelles unités',()=>{
  for(const faction of ['HUMAN','YAUTJA','XENO','ENGINEER','HYBRID'])for(let seed=1;seed<=35;seed++){
    const deck=E.buildAiDeck([faction],1.3,seed);
    const result=E.validateDeck(deck,null,faction);
    assert(result.valid,faction+' '+seed+': '+result.errors.join('; '));
  }
});

test('PWA charge les vagues dans l ordre et ne remplace pas le contrat d illustrations',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const allow=readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
  const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert(html.indexOf('/src/data.js')<html.indexOf('/src/expansion.js'));
  assert(html.indexOf('/src/expansion.js')<html.indexOf('/src/expansion-wave2.js'));
  assert(html.indexOf('/src/expansion-wave2.js')<html.indexOf('/src/engine.js'));
  assert(sw.includes('/src/expansion-wave2.js'));
  assert(allow.includes('src/expansion-wave2.js'));
  assert(build.includes('const expectedCardCount = 158;'));
  assert(build.includes('live.cards.length!==891'));
});
