import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const scripts=['data.js','expansion.js','engine.js','duel-save.js'].map(file=>readFileSync(new URL('../src/'+file,import.meta.url),'utf8'));
function setup(){
  const context=vm.createContext({window:{},Intl,Date,Math});
  vm.runInContext(scripts[0],context,{timeout:2000});
  const original=context.window.AVP_DATA.cards.map(c=>JSON.stringify(c));
  vm.runInContext(scripts[1],context,{timeout:2500});
  vm.runInContext(scripts[2],context,{timeout:2000});
  vm.runInContext(scripts[3],context,{timeout:2000});
  return {D:context.window.AVP_DATA,E:context.window.AVPEngine,S:context.window.AVPDuelSave,original};
}
const baseline=setup();

test('156 cartes ajoutées sans supprimer ou modifier la mécanique des 158 historiques',()=>{
  const {D,E,original}=baseline;
  assert.equal(original.length,158);assert.equal(D.cards.length,314);
  assert.equal(D.expansion.addedCount,156);assert.equal(D.version,'1.1.0-wave1');
  assert.equal(new Set(D.cards.map(c=>c.id)).size,314);
  for(let i=0;i<158;i++){
    const c={...D.cards[i]};delete c.cardClass;
    assert.equal(JSON.stringify(c),original[i],'Carte historique changée : '+D.cards[i].id);
  }
  const classNames=new Set(Object.keys(D.cardClasses));
  assert.deepEqual([...classNames].sort(),['ACTION','ARME','CREATURE','EQUIPEMENT','LIEU','PERSONNAGE','VEHICULE']);
  for(const c of D.cards){
    assert(classNames.has(c.cardClass),'Classe invalide : '+c.id);
    assert(E.CARD.has(c.id));assert(D.rarities[c.rarity]);assert(D.sets[c.set]);
    assert(['UNIT','TACTIC','EQUIPMENT','LOCATION'].includes(c.type));
  }
});

test('les cartes ajoutées ont toutes une référence identifiée dans Alien_base',()=>{
  const text=readFileSync(new URL('../content-plan/alien-base-sources.csv',import.meta.url),'utf8');
  const sourceIds=new Set(text.split(/\r?\n/).slice(1).map(line=>line.split(',',1)[0]).filter(Boolean));
  assert.equal(sourceIds.size,652);
  for(const c of baseline.D.cards.slice(158)){
    assert(sourceIds.has(c.sourceEntityId),c.id+' : '+c.sourceEntityId);
    assert.equal(c.sourcePolicy,'mechanics-proposed-not-lore-fact');
    assert(c.source?.workbook.includes('alien_base@'));
  }
});

test('20 préconstruits complets, 30 cartes jouables et 15 alternatives sans cartes invalides',()=>{
  const {D,E}=baseline;
  assert.equal(D.expansionDecks.length,20);
  const totals={};
  for(const p of D.expansionDecks){
    totals[p.faction]=(totals[p.faction]||0)+1;
    assert.equal(p.boxCount,45);
    assert.equal(Object.values(p.cards).reduce((a,b)=>a+b,0),30);
    assert.equal(Object.values(p.reserve).reduce((a,b)=>a+b,0),15);
    assert(E.validateDeck(p.cards,null,p.faction).valid,p.id);
    for(const [cardId,n] of Object.entries(p.reserve))
      assert(n>=1&&n+(p.cards[cardId]||0)<=3,'Copies excédentaires dans la boîte : '+p.id);
  }
  for(const f of ['HUMAN','XENO','YAUTJA','ENGINEER','HYBRID'])assert.equal(totals[f],4);
  assert.deepEqual(D.starterDecks.XENO.cards.X_OVOMORPH,3);
});

test('remélange reproductible, équilibré par faction et sans mutation du catalogue',()=>{
  const {D,E}=baseline;
  const size=D.cards.length;
  for(const f of ['HUMAN','XENO','YAUTJA','ENGINEER','HYBRID'])for(let seed=1;seed<=20;seed++){
    const x=D.createRemixedDeck(f,seed*47,seed%4);
    assert.equal(JSON.stringify(x),JSON.stringify(D.createRemixedDeck(f,seed*47,seed%4)));
    assert(E.validateDeck(x,null,f).valid,f+'/'+seed);
  }
  assert.equal(D.cards.length,size);
});

test('pilotage obligatoire, véhicule sans équipage inactif et bonus cohérents',()=>{
  const {D,E}=setup();
  const pilot=D.cards.find(c=>c.id.startsWith('AX_')&&c.faction==='HUMAN'&&c.cardClass==='PERSONNAGE');
  const vehicle=D.cards.find(c=>c.faction==='HUMAN'&&c.cardClass==='VEHICULE');
  const b=new E.Battle({playerDeck:D.expansionDecks.find(x=>x.faction==='HUMAN').cards,aiDeck:D.expansionDecks.find(x=>x.faction==='XENO').cards,seed:4});
  const s=b.side(0);s.hand=[vehicle.id,pilot.id];s.energy=10;s.maxEnergy=10;
  assert.match(b.canPlay(0,0).reason,/pilote/);
  assert(b.playCard(0,1,{kind:'FRIENDLY_LANE',lane:0}).ok);
  s.energy=10;assert(b.playCard(0,0,{kind:'FRIENDLY_LANE',lane:1}).ok);
  const v=s.board[1];assert(b.unitAttack(0,v)>=vehicle.attack+200);
  v.ready=true;
  assert(b.legalAttacks(0,1).some(t=>t.kind==='HERO'));
  b.destroyUnit(0,0,{noDeath:true});
  assert.equal(b.legalAttacks(0,1).length,0);
});

test('emplacement unique pour les nouvelles armes; équipements historiques compatibles',()=>{
  const {D,E}=setup(),pilot=D.cards.find(c=>c.id.startsWith('AX_')&&c.faction==='HUMAN'&&c.cardClass==='PERSONNAGE');
  const weapons=D.cards.filter(c=>c.faction==='HUMAN'&&c.slot==='WEAPON');
  const b=new E.Battle({playerDeck:D.expansionDecks.find(x=>x.faction==='HUMAN').cards,aiDeck:D.expansionDecks.find(x=>x.faction==='XENO').cards,seed:32});
  const s=b.side(0);s.energy=10;s.maxEnergy=10;s.hand=[pilot.id,...weapons.slice(0,2).map(c=>c.id),'EQ_MARINE_ARMOR'];
  assert(b.playCard(0,0,{kind:'FRIENDLY_LANE',lane:0}).ok);
  s.energy=10;assert(b.playCard(0,0,{kind:'FRIENDLY_UNIT',lane:0}).ok);
  s.energy=10;assert.equal(b.canPlay(0,0).ok,false,'Deuxième arme ne doit pas cibler la même unité');
  assert(b.playCard(0,1,{kind:'FRIENDLY_UNIT',lane:0}).ok,'L’armure historique reste équipable');
  assert(s.board[0].equipment.includes('EQ_MARINE_ARMOR'));
});

test('lieux boostent les statistiques, sauvegarde du duel et tirages de boosters',()=>{
  const {D,E,S}=setup();
  const field=D.cards.find(c=>c.faction==='HUMAN'&&c.cardClass==='LIEU'&&c.id.startsWith('AX_'));
  const pilot=D.cards.find(c=>c.id.startsWith('AX_')&&c.faction==='HUMAN'&&c.cardClass==='PERSONNAGE');
  const b=new E.Battle({playerDeck:D.expansionDecks.find(x=>x.faction==='HUMAN').cards,aiDeck:D.expansionDecks.find(x=>x.faction==='XENO').cards,seed:4});
  const s=b.side(0);s.energy=10;s.maxEnergy=10;s.hand=[pilot.id,field.id];
  assert(b.playCard(0,0,{kind:'FRIENDLY_LANE',lane:0}).ok);
  const before=b.unitMaxHealth(0,s.board[0]);s.energy=10;
  assert(b.playCard(0,0,{kind:'NONE'}).ok);
  assert(b.unitMaxHealth(0,s.board[0])>=before+field.effect.locationBuff.health);
  const checkpoint=S.capture(b),restored=S.restore(checkpoint);
  assert.equal(restored.side(0).location.cardId,field.id);
  for(const pack of ['pack_tf28','pack_ha29'])for(const pity of [0,9])for(let seed=1;seed<=16;seed++){
    const p=E.openBooster(pack,{seed,pity});
    assert.equal(p.pulls.length,9);
    assert(p.pulls.every(x=>E.CARD.get(x.cardId).set===p.pack.set),'Booster hors-set : '+pack);
    if(pity===9)assert(p.bestRank>=4,'Garantie UR+ absente : '+pack);
  }
});

test('IA multi-factions, scripts web et shell hors ligne comprennent la nouvelle vague',()=>{
  const {D,E}=baseline;
  for(const faction of ['HUMAN','XENO','YAUTJA','ENGINEER','HYBRID'])for(let seed=1;seed<=15;seed++)
    assert(E.validateDeck(E.buildAiDeck([faction],1.25,seed),null,faction).valid,faction+'/'+seed);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert(html.indexOf('/src/data.js')<html.indexOf('/src/expansion.js'));
  assert(html.indexOf('/src/expansion.js')<html.indexOf('/src/engine.js'));
  const serve=readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  for(const s of [serve,worker])assert(s.includes('src/expansion.js'));
});
