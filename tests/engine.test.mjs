import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const dataSource = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
const engineSource = await readFile(new URL('../src/engine.js', import.meta.url), 'utf8');

function runtime() {
  const context = vm.createContext({ window: {}, Intl, Date, Math });
  vm.runInContext(dataSource, context);
  vm.runInContext(engineSource, context);
  return { E: context.window.AVPEngine, D: context.window.AVP_DATA };
}

function duel(options = {}) {
  const { E, D } = runtime();
  const battle = new E.Battle({
    playerDeck: D.starterDecks.HUMAN.cards,
    aiDeck: D.starterDecks.XENO.cards,
    seed: 71,
    ...options,
  });
  return { E, D, battle };
}

function put(battle, side, id, lane = 0, overrides = {}) {
  const unit = battle.summonAt(side, id, lane);
  assert.ok(unit, `Could not summon ${id}`);
  Object.assign(unit, { ready: true, cloaked: false }, overrides);
  return unit;
}

test('all starter decks validate with their declared identity and exact owned quantities', () => {
  const { E, D } = runtime();
  for (const [identity, deck] of Object.entries(D.starterDecks)) {
    assert.equal(E.validateDeck(deck.cards, deck.cards, identity).valid, true);
    assert.equal(E.expandDeck(deck.cards).length, 30);
  }
});

test('the second player receives exactly one additional opening card', () => {
  const { D, battle } = duel();
  assert.equal(D.rules.secondPlayerBonusDraw, 1);
  assert.equal(battle.side(0).hand.length, D.rules.startingHand);
  assert.equal(battle.side(1).hand.length, D.rules.startingHand + D.rules.secondPlayerBonusDraw);
  assert.equal(battle.side(0).deck.length, D.rules.deckSize - D.rules.startingHand);
  assert.equal(battle.side(1).deck.length, D.rules.deckSize - D.rules.startingHand - D.rules.secondPlayerBonusDraw);
});

test('deck quantities are integers, bounded, and never coerced', () => {
  const { E, D } = runtime();
  const original = D.starterDecks.XENO.cards;
  const id = Object.keys(original)[0];
  for (const count of [-1, 0.5, 1.5, '3', true, null, NaN, Infinity, 4, Number.MAX_SAFE_INTEGER]) {
    const deck = { ...original, [id]: count };
    assert.equal(E.validateDeck(deck).valid, false, `Rejected quantity ${count}`);
    const expanded = E.expandDeck({ [id]: count });
    assert.equal(expanded.length, 0, `Never expanded invalid quantity ${count}`);
  }
  assert.equal(E.validateDeck({ ...original, DOES_NOT_EXIST: 1 }).valid, false);
  for (const value of [null, 'X_DRONE', [], 30]) {
    assert.equal(E.validateDeck(value).valid, false);
    assert.equal(E.expandDeck(value).length, 0);
  }
  const oversized = Object.fromEntries(D.cards.map(card => [card.id, 3]));
  assert.equal(E.validateDeck(oversized).valid, false);
  assert.equal(E.expandDeck(oversized).length, 30);
});

test('identity validation is optional, rejects unknown factions, and supports mixed decks', () => {
  const { E, D } = runtime();
  const deck = D.starterDecks.XENO.cards;
  assert.equal(E.validateDeck(deck).valid, true);
  assert.equal(E.validateDeck(deck, null, 'MIXED').valid, true);
  assert.equal(E.validateDeck(deck, null, { id: 'XENO' }).valid, true);
  assert.equal(E.validateDeck(deck, null, ['XENO', 'ENGINEER']).valid, true);
  assert.equal(E.validateDeck(deck, null, ['XENO', 'INVALID']).valid, false);
  assert.equal(E.validateDeck(deck, null, 'HUMAN').valid, false);
  assert.equal(E.validateDeck(deck, null, 'UNKNOWN').valid, false);
  assert.equal(E.validateDeck(deck, {}).valid, false);
});

test('hybrid identity permits at most six cheap Human or Xeno support unit copies', () => {
  const { E, D } = runtime();
  const native = D.cards.filter(card => ['HYBRID', 'NEUTRAL'].includes(card.faction)).slice(0, 8);
  const support = D.cards.filter(card => card.type === 'UNIT' && card.cost <= 2 && ['HUMAN', 'XENO'].includes(card.faction)).slice(0, 3);
  assert.equal(native.length, 8);
  assert.equal(support.length, 3);
  const deck = Object.fromEntries([...native, ...support.slice(0, 2)].map(card => [card.id, 3]));
  assert.equal(E.validateDeck(deck, null, 'HYBRID').valid, true);
  assert.equal(E.validateDeck(deck, null, ['HYBRID']).valid, true);
  const seven = { ...deck, [native[0].id]: 2, [support[2].id]: 1 };
  assert.equal(E.validateDeck(seven, null, 'HYBRID').valid, false);
  assert.match(E.validateDeck(seven, null, 'HYBRID').errors.join(' '), /au plus 6/);
  assert.equal(E.allowedForIdentity(support[0], 'HYBRID'), true);
  const humanElite = D.cards.find(card => card.faction === 'HUMAN' && card.type === 'UNIT' && card.cost > 2);
  const humanTactic = D.cards.find(card => card.faction === 'HUMAN' && card.type === 'TACTIC');
  const hunter = D.cards.find(card => card.faction === 'YAUTJA' && card.type === 'UNIT');
  const synthetic = D.cards.find(card => card.faction === 'HUMAN' && card.type === 'UNIT' && card.cost <= 2 && card.keywords.includes('SYNTHETIC'));
  assert.ok(synthetic);
  for (const card of [humanElite, humanTactic, hunter, synthetic]) {
    assert.equal(E.allowedForIdentity(card, 'HYBRID'), false);
    assert.equal(E.validateDeck({ ...deck, [support[0].id]: 0, [card.id]: 3 }, null, 'HYBRID').valid, false);
  }
  assert.equal(E.allowedForIdentity(support[0], 'YAUTJA'), false);
});

test('Hunter compares printed attack, not equipment, buffs, or mutation', () => {
  const { battle } = duel();
  const attacker = put(battle, 0, 'X_DRONE', 0, { granted: ['HUNTER'], attackBonus: 2000 });
  const strongerPrinted = put(battle, 1, 'X_WARRIOR', 0, { attackBonus: -1400 });
  assert.equal(battle.unitAttack(0, attacker, strongerPrinted), 3200);
  const weakerPrinted = put(battle, 1, 'X_CHESTBURSTER', 1, { attackBonus: 5000 });
  assert.equal(battle.unitAttack(0, attacker, weakerPrinted), 2900);
});

test('lethal combat is simultaneous: a destroyed defender still deals its snapshotted attack', () => {
  const { battle } = duel();
  put(battle, 0, 'X_DRONE', 0, { currentHealth: 500 });
  put(battle, 1, 'X_DRONE', 0, { currentHealth: 500 });
  assert.equal(battle.attack(0, 0, { kind: 'UNIT', lane: 0 }).ok, true);
  assert.equal(battle.side(0).board[0], null);
  assert.equal(battle.side(1).board[0], null);
  assert.equal(battle.side(0).unitsLost, 1);
  assert.equal(battle.side(1).unitsLost, 1);
});

test('simultaneous casualties and acid resolve before the one mutual-destruction callback', () => {
  const results = [];
  const { battle } = duel({ onGameOver: result => results.push(JSON.parse(JSON.stringify(result))) });
  put(battle, 0, 'X_WARRIOR');
  put(battle, 1, 'X_WARRIOR');
  battle.side(0).life = 250;
  battle.side(1).life = 250;
  battle.attack(0, 0, { kind: 'UNIT', lane: 0 });
  assert.equal(results.length, 1);
  assert.equal(results[0].winner, -1);
  assert.equal(results[0].state.sides[0].life, 0);
  assert.equal(results[0].state.sides[1].life, 0);
  assert.equal(results[0].state.sides[0].board[0], null);
  assert.equal(results[0].state.sides[1].board[0], null);
  battle.checkEnd();
  assert.equal(results.length, 1);
});

test('damage to both commanders produces a draw and completes unit effects before gameover', () => {
  const results = [];
  const { battle } = duel({ onGameOver: result => results.push(JSON.parse(JSON.stringify(result))) });
  put(battle, 0, 'X_DRONE', 0, { currentHealth: 400 });
  put(battle, 1, 'X_DRONE', 0, { currentHealth: 400 });
  battle.side(0).life = 100;
  battle.side(1).life = 100;
  battle.applyEffect(0, { kind: 'DAMAGE_ALL_HEROES', amount: 100 });
  assert.equal(results.length, 1);
  assert.equal(results[0].winner, -1);
  assert.equal(results[0].state.sides[0].unitsLost, 1);
  assert.equal(results[0].state.sides[1].unitsLost, 1);
});

test('death replacement is not mistaken for the original defender', () => {
  const { battle } = duel();
  put(battle, 0, 'X_DRONE', 0, { currentHealth: 200, granted: ['DEATHTOUCH'] });
  put(battle, 1, 'X_OVOMORPH', 0, { currentHealth: 200, attackBonus: 300 });
  battle.attack(0, 0, { kind: 'UNIT', lane: 0 });
  assert.equal(battle.side(0).board[0], null);
  assert.equal(battle.side(1).board[0]?.cardId, 'X_FACEHUGGER');
  assert.equal(battle.side(1).board[0].currentHealth, 500);
});

test('area damage does not damage a newly hatched unit a second time', () => {
  const { battle } = duel();
  put(battle, 0, 'X_OVOMORPH');
  put(battle, 1, 'X_OVOMORPH');
  battle.applyEffect(0, { kind: 'DAMAGE_ALL', amount: 1000 });
  for (const side of battle.state.sides) {
    assert.equal(side.board[0]?.cardId, 'X_FACEHUGGER');
    assert.equal(side.board[0]?.currentHealth, 500);
  }
});

test('synthetics ignore pathogen damage without consuming armor or receiving mutation', () => {
  const { battle } = duel();
  const synthetic = put(battle, 1, 'H_COMBAT_SYNTH', 0, { granted: ['ARMOR'] });
  const health = synthetic.currentHealth;
  assert.equal(battle.damageUnit(1, 0, 1200, { kind: 'PATHOGEN' }), 0);
  assert.equal(synthetic.currentHealth, health);
  assert.equal(synthetic.armorUsed, false);
  assert.equal(synthetic.mutated, false);
  assert.equal(synthetic.attackBonus, 0);
  assert.equal(battle.damageUnit(1, 0, 600, { kind: 'COMBAT' }), 200);
});

test('synthetic immunity applies to combat and a pathogen death explosion', () => {
  const { battle } = duel();
  const pathogen = put(battle, 0, 'X_PATH_STALKER', 0, { currentHealth: 5000 });
  const synthetic = put(battle, 1, 'H_COMBAT_SYNTH');
  const health = synthetic.currentHealth;
  battle.attack(0, 0, { kind: 'UNIT', lane: 0 });
  assert.equal(synthetic.currentHealth, health);
  assert.ok(pathogen.currentHealth < 5000, 'The synthetic still retaliates');
  put(battle, 0, 'X_POPPER', 1);
  battle.destroyUnit(0, 1);
  assert.equal(synthetic.currentHealth, health);
});

test('infestation and Eggmorphing cannot affect synthetic units', () => {
  const { battle } = duel();
  const synthetic = put(battle, 1, 'H_COMBAT_SYNTH', 0, { currentHealth: 500 });
  battle.applyEffect(0, battle.card('X_FACEHUGGER').effect.onPlay, { lane: 0, card: battle.card('X_FACEHUGGER') });
  assert.equal(synthetic.attackBonus, 0);
  assert.equal(synthetic.debuffed, false);
  assert.equal(battle.validTargets('T_X_EGGMORPH', 0).length, 0);
  battle.applyEffect(0, battle.card('T_X_EGGMORPH').effect, { target: { kind: 'ENEMY_UNIT', lane: 0 } });
  assert.equal(battle.side(1).board[0], synthetic);
});

test('pathogen mutation survives through the victim turn, then expires at its end', () => {
  const { battle } = duel();
  const target = put(battle, 1, 'X_DRONE');
  battle.damageUnit(1, 0, 50, { kind: 'PATHOGEN' });
  assert.equal(target.attackBonus, -200);
  battle.endTurn(0);
  assert.equal(target.attackBonus, -200);
  assert.equal(target.mutated, true);
  battle.endTurn(1);
  assert.equal(target.attackBonus, 0);
  assert.equal(target.mutated, false);
  assert.equal(target.debuffed, false);
});

test('mutation received in the owner turn lasts until the end of their NEXT turn', () => {
  const { battle } = duel();
  const target = put(battle, 0, 'X_DRONE');
  battle.damageUnit(0, 0, 50, { kind: 'PATHOGEN' });
  battle.endTurn(0);
  assert.equal(target.attackBonus, -200);
  battle.endTurn(1);
  assert.equal(target.attackBonus, -200);
  battle.endTurn(0);
  assert.equal(target.attackBonus, 0);
});

test('expired mutation does not remove a permanent infestation penalty', () => {
  const { battle } = duel();
  const target = put(battle, 1, 'X_DRONE');
  battle.applyEffect(0, battle.card('X_FACEHUGGER').effect.onPlay, { lane: 0 });
  battle.damageUnit(1, 0, 50, { kind: 'PATHOGEN' });
  assert.equal(target.attackBonus, -400);
  battle.endTurn(0);
  battle.endTurn(1);
  assert.equal(target.attackBonus, -200);
  assert.equal(target.debuffed, true);
  assert.equal(target.mutated, false);
});

test('fully absorbed damage does not apply mutation or consume zero-damage armor', () => {
  const { battle } = duel();
  const target = put(battle, 1, 'X_DRONE', 0, { granted: ['ARMOR'] });
  assert.equal(battle.damageUnit(1, 0, 0, { kind: 'PATHOGEN' }), 0);
  assert.equal(target.armorUsed, false);
  assert.equal(battle.damageUnit(1, 0, 300, { kind: 'PATHOGEN' }), 0);
  assert.equal(target.attackBonus, 0);
  assert.equal(target.mutated, false);
});

test('Engineer arrival applies temporary mutation and excludes synthetics', () => {
  const { battle } = duel();
  const organic = put(battle, 1, 'X_DRONE');
  const synthetic = put(battle, 1, 'H_COMBAT_SYNTH', 1);
  const card = battle.card('E_ENGINEER');
  battle.applyEffect(0, card.effect.onPlay, { card });
  assert.equal(organic.attackBonus, -200);
  assert.equal(synthetic.attackBonus, 0);
  battle.endTurn(0);
  battle.endTurn(1);
  assert.equal(organic.attackBonus, 0);
});

test('black goo affects organic units on BOTH sides and leaves synthetics untouched', () => {
  const { battle } = duel();
  const ally = put(battle, 0, 'X_DRONE');
  const enemy = put(battle, 1, 'X_DRONE');
  const synthetic = put(battle, 0, 'H_COMBAT_SYNTH', 1);
  const health = synthetic.currentHealth;
  const card = battle.card('T_E_BLACK_GOO');
  battle.applyEffect(0, card.effect, { card });
  assert.equal(ally.currentHealth, 700);
  assert.equal(enemy.currentHealth, 700);
  assert.equal(ally.attackBonus, -300);
  assert.equal(enemy.attackBonus, -300);
  assert.equal(synthetic.currentHealth, health);
  assert.equal(synthetic.attackBonus, 0);
});

test('deathtouch needs actual damage and cannot execute a boss', () => {
  for (const scenario of ['armor', 'boss', 'normal']) {
    const { battle } = duel();
    put(battle, 0, 'X_DRONE', 0, { attackBonus: -600, currentHealth: 10000, granted: ['DEATHTOUCH'] });
    const defender = put(battle, 1, scenario === 'boss' ? 'X_QUEEN_MOTHER' : 'X_DRONE', 0, { granted: scenario === 'armor' ? ['ARMOR'] : [] });
    battle.attack(0, 0, { kind: 'UNIT', lane: 0 });
    assert.equal(battle.side(1).board[0], scenario === 'normal' ? null : defender, scenario);
  }
});

test('deathtouch works on the defender even when that defender dies in combat', () => {
  const { battle } = duel();
  put(battle, 0, 'X_DRONE', 0, { currentHealth: 10000 });
  put(battle, 1, 'X_DRONE', 0, { currentHealth: 100, granted: ['DEATHTOUCH'] });
  battle.attack(0, 0, { kind: 'UNIT', lane: 0 });
  assert.equal(battle.side(0).board[0], null);
  assert.equal(battle.side(1).board[0], null);
});

test('Frosty armor expires at the next owner turn and preserves inherent armor', () => {
  const { battle } = duel();
  const temporary = put(battle, 0, 'X_DRONE');
  const permanent = put(battle, 0, 'X_PATH_BRUTE', 1);
  battle.applyEffect(0, battle.card('T_H_FROSTY').effect);
  assert.equal(battle.has(temporary, 'ARMOR'), true);
  battle.endTurn(0);
  assert.equal(battle.has(temporary, 'ARMOR'), true);
  battle.endTurn(1);
  assert.equal(battle.has(temporary, 'ARMOR'), false);
  assert.equal(battle.has(permanent, 'ARMOR'), true);
});

test('ritual creates Bouvet on both sides and grants its first-deployment discount', () => {
  const { battle } = duel({ modifiers: ['ritual'] });
  for (const side of [0, 1]) {
    assert.equal(battle.side(side).location.cardId, 'L_BOUVET');
    assert.equal(battle.effectiveCost(side, battle.card('X_DRONE')), 1);
    battle.side(side).flags.bouvetUsed = true;
    assert.equal(battle.effectiveCost(side, battle.card('X_DRONE')), 2);
  }
});

test('trophyRush grants trophy to enemy deployed and summoned units only', () => {
  const { battle } = duel({ modifiers: ['trophyRush'] });
  const player = put(battle, 0, 'X_DRONE');
  const enemy = put(battle, 1, 'X_DRONE');
  assert.equal(battle.has(player, 'TROPHY'), false);
  assert.equal(battle.has(enemy, 'TROPHY'), true);
  battle.side(1).hand = ['X_CHESTBURSTER'];
  battle.state.active = 1;
  battle.side(1).energy = 10;
  assert.equal(battle.playCard(1, 0, { kind: 'FRIENDLY_LANE', lane: 1 }).ok, true);
  assert.equal(battle.has(battle.side(1).board[1], 'TROPHY'), true);
});

test('UNIQUE and exclusive royalty constraints apply to plays and summons in both directions', () => {
  const { battle } = duel();
  put(battle, 0, 'H_ALIEN_KING');
  assert.equal(battle.summonAt(0, 'H_ALIEN_KING', 1), null);
  assert.equal(battle.summonAt(0, 'X_QUEEN_MOTHER', 1), null);
  battle.side(0).hand = ['X_QUEEN_MOTHER'];
  battle.side(0).energy = 10;
  assert.equal(battle.canPlay(0, 0).ok, false);
  put(battle, 1, 'X_QUEEN_MOTHER');
  assert.equal(battle.summonAt(1, 'H_ALIEN_KING', 1), null);
  assert.equal(battle.summonAt(0, 'T_H_FROSTY', 1), null);
  assert.equal(battle.summonAt(0, 'X_DRONE', -1), null);
  assert.equal(battle.summonAt(0, 'X_DRONE', 3), null);
});

test('revive keeps its discard card if the board is full or the unit cannot coexist', () => {
  const { battle } = duel();
  put(battle, 0, 'H_ALIEN_KING');
  battle.side(0).discard.push('X_QUEEN_MOTHER');
  battle.applyEffect(0, { kind: 'REVIVE_STRONGEST', faction: 'XENO' });
  assert.ok(battle.side(0).discard.includes('X_QUEEN_MOTHER'));
  put(battle, 0, 'X_DRONE', 1);
  put(battle, 0, 'X_DRONE', 2);
  battle.side(0).discard.push('X_DRONE');
  battle.applyEffect(0, { kind: 'REVIVE_STRONGEST', faction: 'XENO' });
  assert.ok(battle.side(0).discard.includes('X_DRONE'));
});

test('each tenth booster without a UR guarantees an actual UR or better in every set', () => {
  const { E, D } = runtime();
  for (const pack of D.boosters) for (let seed = 1; seed <= 40; seed++) {
    const result = E.openBooster(pack.id, { seed, pity: 9 });
    assert.equal(result.pulls.length, 9);
    assert.ok(result.bestRank >= 4, `${pack.id}, seed ${seed}`);
    const final = result.pulls.find(pull => pull.slot === 8);
    assert.ok(E.RANK[E.CARD.get(final.cardId).rarity] >= 4);
  }
});

test('a missing UR in a set is promoted to an available higher rarity, never downgraded', () => {
  const { E, D } = runtime();
  const pack = D.boosters.find(pack => D.cards.some(card => card.set === pack.set && E.RANK[card.rarity] > 4));
  D.cards = D.cards.filter(card => card.set !== pack.set || card.rarity !== 'UR');
  for (let seed = 1; seed <= 30; seed++) {
    const result = E.openBooster(pack.id, { seed, pity: 9 });
    const final = result.pulls.find(pull => pull.slot === 8);
    const card = E.CARD.get(final.cardId);
    assert.equal(card.set, pack.set);
    assert.ok(E.RANK[card.rarity] > 4);
  }
});

test('generated AI decks are legal and deterministic for every campaign encounter', () => {
  const { E, D } = runtime();
  for (const mission of D.campaign) for (const seed of [1, 41, 100]) {
    const deck = E.buildAiDeck(mission.factions, mission.difficulty, seed);
    assert.equal(E.validateDeck(deck).valid, true);
    assert.deepEqual(deck, E.buildAiDeck(mission.factions, mission.difficulty, seed));
  }
});

test('a Hive health aura supplies actual hit points to newly summoned units', () => {
  const { battle } = duel();
  battle.side(0).location = { cardId: 'L_XENO_HIVE' };
  const drone = put(battle, 0, 'X_DRONE');
  assert.equal(drone.currentHealth, 1100);
  assert.equal(battle.unitMaxHealth(0, drone), 1100);
  battle.damageUnit(0, 0, 1000);
  assert.equal(battle.side(0).board[0], drone);
  assert.equal(drone.currentHealth, 100);
});

test('adding, replacing, and re-adding a health aura preserve damage without healing loops', () => {
  const { battle } = duel();
  const drone = put(battle, 0, 'X_DRONE');
  const playLocation = id => {
    battle.side(0).hand = [id];
    battle.side(0).energy = 10;
    assert.equal(battle.playCard(0, 0).ok, true);
  };
  playLocation('L_XENO_HIVE');
  assert.equal(drone.currentHealth, 1100);
  battle.damageUnit(0, 0, 200);
  assert.equal(drone.currentHealth, 900);
  for (let i = 0; i < 3; i++) {
    playLocation('L_XENO_HIVE');
    assert.equal(drone.currentHealth, 900, 'Replacing an identical aura does not heal');
    playLocation('L_BOUVET');
    assert.equal(drone.currentHealth, 800);
    playLocation('L_XENO_HIVE');
    assert.equal(drone.currentHealth, 900);
  }
});

test('Hadleys Hope and Prototype Lab add actual health only to eligible units', () => {
  for (const location of ['L_HADLEYS_HOPE', 'L_PROTO_LAB']) {
    const { battle, D } = duel();
    battle.side(0).location = { cardId: location };
    const marine = put(battle, 0, 'H_HUDSON');
    const yautjaCard = D.cards.find(card => card.type === 'UNIT' && card.faction === 'YAUTJA');
    const yautja = put(battle, 0, yautjaCard.id, 1);
    const drone = put(battle, 0, 'X_DRONE', 2);
    assert.equal(marine.currentHealth, battle.card(marine.cardId).health + 200);
    assert.equal(yautja.currentHealth, yautjaCard.health + (location === 'L_PROTO_LAB' ? 200 : 0));
    assert.equal(drone.currentHealth, battle.card('X_DRONE').health);
  }
});

test('Hicks adds health to other Marines but not himself, preserving prior damage on removal', () => {
  const { battle } = duel();
  const marine = put(battle, 0, 'H_HUDSON');
  const base = battle.card(marine.cardId).health;
  battle.damageUnit(0, 0, 100);
  const hicks = put(battle, 0, 'H_HICKS', 1);
  assert.equal(marine.currentHealth, base + 100);
  assert.equal(hicks.currentHealth, battle.card('H_HICKS').health);
  battle.destroyUnit(0, 1);
  assert.equal(marine.currentHealth, base - 100);
});

test('loss of a health aura destroys units kept alive by that aura in the same resolution', () => {
  const { battle } = duel();
  const marine = put(battle, 0, 'H_HUDSON');
  put(battle, 0, 'H_HICKS', 1);
  battle.damageUnit(0, 0, battle.card(marine.cardId).health + 100);
  assert.equal(marine.currentHealth, 100);
  battle.destroyUnit(0, 1);
  assert.equal(battle.side(0).board[0], null);
  assert.equal(battle.side(0).board[1], null);
  assert.equal(battle.side(0).unitsLost, 2);
  assert.equal(battle.pendingDeaths.length, 0);
});

test('discarding a health location resolves lethal aura loss and revival stays at exactly one HP', () => {
  const { battle } = duel();
  battle.side(0).location = { cardId: 'L_XENO_HIVE' };
  const revived = battle.summonAt(0, 'X_DRONE', 0, { health: 1 });
  assert.equal(revived.currentHealth, 1);
  battle.applyEffect(0, { kind: 'DAMAGE_ALL', amount: 0, discardLocations: true });
  assert.equal(battle.side(0).location, null);
  assert.equal(battle.side(0).board[0], null);
  assert.equal(battle.pendingDeaths.length, 0);
});

test('Rush enables a fresh unit but cannot reset an attack already spent', () => {
  const { battle } = duel();
  const warrior = put(battle, 0, 'X_WARRIOR', 0, { ready: false });
  const effect = battle.card('T_X_VENT_AMBUSH').effect;
  const target = { target: { kind: 'FRIENDLY_UNIT', lane: 0 } };
  battle.applyEffect(0, effect, target);
  assert.equal(warrior.ready, true);
  assert.equal(battle.attack(0, 0, { kind: 'HERO' }).ok, true);
  const life = battle.side(1).life;
  battle.applyEffect(0, effect, target);
  assert.equal(warrior.ready, false);
  assert.equal(battle.attack(0, 0, { kind: 'HERO' }).ok, false);
  warrior.ready = true;
  assert.equal(battle.legalAttacks(0, 0).length, 0, 'The attack limit is enforced in the rule engine');
  assert.equal(battle.side(1).life, life);
});

test('Rush cannot bypass a stun, including the turn on which the stun timer expires', () => {
  const { battle } = duel();
  const warrior = put(battle, 0, 'X_WARRIOR', 0, { ready: false, stunned: 1 });
  const effect = battle.card('T_X_VENT_AMBUSH').effect;
  const target = { target: { kind: 'FRIENDLY_UNIT', lane: 0 } };
  battle.applyEffect(0, effect, target);
  assert.equal(warrior.ready, false);
  battle.endTurn(0);
  battle.endTurn(1);
  assert.equal(warrior.stunned, 0);
  assert.equal(warrior.stunBlocked, true);
  battle.applyEffect(0, effect, target);
  assert.equal(warrior.ready, false);
  battle.endTurn(0);
  battle.endTurn(1);
  assert.equal(warrior.ready, true);
  assert.equal(warrior.stunBlocked, false);
});

test('Quarantine suppresses both Facehugger infestation and its Ambush arrival damage', () => {
  const { battle } = duel();
  const defender = put(battle, 1, 'X_DRONE');
  battle.applyEffect(1, battle.card('T_H_QUARANTINE').effect);
  battle.side(0).hand = ['X_FACEHUGGER'];
  battle.side(0).energy = 10;
  assert.equal(battle.playCard(0, 0, { kind: 'FRIENDLY_LANE', lane: 0 }).ok, true);
  assert.equal(defender.currentHealth, 1000);
  assert.equal(defender.attackBonus, 0);
  assert.equal(defender.infested, undefined);
});

test('Quarantine suppresses Brood arrival but not the Queen Mother next-turn ability', () => {
  const { battle } = duel();
  battle.applyEffect(1, battle.card('T_H_QUARANTINE').effect);
  battle.side(0).hand = ['X_QUEEN_MOTHER'];
  battle.side(0).energy = 10;
  assert.equal(battle.playCard(0, 0, { kind: 'FRIENDLY_LANE', lane: 0 }).ok, true);
  assert.equal(battle.side(0).board.filter(Boolean).length, 1);
  battle.endTurn(0);
  battle.endTurn(1);
  assert.equal(battle.side(0).board.filter(Boolean).length, 2);
  assert.ok(battle.side(0).board.some(unit => unit?.cardId === 'X_DRONE'));
});

test('arrival silence suppresses Scavenge only for its matching faction', () => {
  for (const faction of ['HUMAN', 'XENO']) {
    const { battle } = duel();
    battle.applyEffect(1, { kind: 'SILENCE_FACTION', faction, turns: 1 });
    battle.side(0).discard.push('EQ_PULSE_RIFLE');
    battle.side(0).hand = ['H_BISHOP'];
    battle.side(0).energy = 10;
    assert.equal(battle.playCard(0, 0, { kind: 'FRIENDLY_LANE', lane: 0 }).ok, true);
    assert.equal(battle.side(0).hand.includes('EQ_PULSE_RIFLE'), faction !== 'HUMAN');
    assert.equal(battle.side(0).discard.includes('EQ_PULSE_RIFLE'), faction === 'HUMAN');
  }
});
