import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const dataSource = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
const engineSource = await readFile(new URL('../src/engine.js', import.meta.url), 'utf8');

function duel(sideIndex = 1, seed = 123) {
  const context = vm.createContext({ window: {}, Intl, Math, Date });
  vm.runInContext(dataSource, context);
  vm.runInContext(engineSource, context);
  const { AVPEngine: E, AVP_DATA: D } = context.window;
  const battle = new E.Battle({
    playerDeck: D.starterDecks.HUMAN.cards,
    aiDeck: D.starterDecks.XENO.cards,
    seed,
  });
  battle.state.active = sideIndex;
  for (const side of battle.state.sides) {
    side.hand = [];
    side.energy = 10;
    side.board = [null, null, null];
  }
  return { battle, E, D };
}

function put(battle, sideIndex, id, lane = 0, changes = {}) {
  const unit = battle.summonAt(sideIndex, id, lane);
  assert.ok(unit);
  Object.assign(unit, { ready: true, cloaked: false }, changes);
  return unit;
}

test('takeAITurn plays and attacks for either side, keeping the side-1 default', async () => {
  for (const sideIndex of [0, 1]) {
    const { battle } = duel(sideIndex);
    battle.side(sideIndex).hand = ['X_CHESTBURSTER'];
    const actions = [];
    const step = async kind => actions.push(kind);
    if (sideIndex === 1) await battle.takeAITurn(step);
    else await battle.takeAITurn(step, sideIndex);
    assert.equal(battle.side(sideIndex).cardsPlayed, 1);
    assert.equal(battle.enemy(sideIndex).life, 7400);
    assert.equal(battle.state.active, 1 - sideIndex);
    assert.deepEqual(actions, ['play', 'attack', 'end']);
  }
});

test('AI keeps no-op buffs, full-board summons and identical locations in hand', async () => {
  const { battle } = duel();
  for (let lane = 0; lane < 3; lane++) put(battle, 1, 'X_DRONE', lane, { ready: false });
  const cards = ['T_H_FIRETEAM', 'T_Y_HUNT_CODE', 'T_Y_BLOODING', 'T_X_SWARM', 'L_SULACO'];
  battle.side(1).hand = [...cards];
  battle.side(1).location = { cardId: 'L_SULACO' };
  await battle.takeAITurn();
  assert.equal(battle.side(1).cardsPlayed, 0);
  assert.deepEqual(Array.from(battle.side(1).hand), cards);
  assert.equal(battle.side(1).location.cardId, 'L_SULACO');
});

test('AI does not mistake a useful maximum-health equipment for wasted healing', async () => {
  const { battle } = duel();
  const unit = put(battle, 1, 'X_DRONE', 0, { ready: false });
  battle.side(1).hand = ['EQ_MEDICOMP'];
  assert.ok(battle.aiScore(battle.card('EQ_MEDICOMP'), { kind: 'FRIENDLY_UNIT', lane: 0 }) > 0);
  await battle.takeAITurn();
  assert.ok(unit.equipment.includes('EQ_MEDICOMP'));
  assert.equal(unit.currentHealth, 1900);
});

test('healing-only utility is zero at full health and grows only with missing life', () => {
  const { battle } = duel();
  put(battle, 1, 'Y_UNBLOODED', 0, { ready: false });
  const healingLocation = battle.card('L_YAUTJA_SHIP');
  assert.equal(battle.aiScore(healingLocation), 0);
  battle.side(1).life -= 500;
  assert.ok(battle.aiScore(healingLocation) > 0);
  // Pure healing is an evaluator contract for future cards, not a new launch card.
  const pureHeal = { type: 'TACTIC', effect: { kind: 'HEAL_HERO', amount: 600 } };
  assert.ok(battle.aiScore(pureHeal) > 0);
  battle.side(1).life = battle.side(1).maxLife;
  assert.equal(battle.aiScore(pureHeal), 0);
});

test('a targeted damage spell chooses a kill instead of an unkillable weaker-looking unit', () => {
  const { battle } = duel();
  put(battle, 0, 'X_DRONE', 0);
  put(battle, 0, 'X_WARRIOR', 1, { currentHealth: 650 });
  const target = battle.aiTargetFor(battle.card('T_X_ACID_BLOOD'));
  assert.equal(target.kind, 'ENEMY_UNIT');
  assert.equal(target.lane, 1);
});

test('AI rejects obviously friendly-harmful AOE and self-lethal commander damage', async () => {
  const { battle } = duel();
  put(battle, 1, 'X_QUEEN', 0, { currentHealth: 1300, ready: false });
  put(battle, 0, 'X_OVOMORPH', 0);
  const nuke = battle.card('T_H_NUKE');
  assert.equal(battle.aiScore(nuke), 0);
  battle.side(1).life = 1000;
  const cards = ['T_H_NUKE', 'T_Y_SELF_DESTRUCT'];
  battle.side(1).hand = [...cards];
  await battle.takeAITurn();
  assert.equal(battle.side(1).cardsPlayed, 0);
  assert.equal(battle.side(1).life, 1000);
  assert.deepEqual(Array.from(battle.side(1).hand), cards);
});

test('AOE evaluation accounts for synthetic immunity and still takes profitable clears', async () => {
  const { battle } = duel(0);
  put(battle, 0, 'X_DRONE', 0, { ready: false });
  put(battle, 1, 'H_COMBAT_SYNTH', 0);
  assert.equal(battle.aiScore(battle.card('T_E_BLACK_GOO'), { kind: 'NONE' }, 0), 0);
  battle.side(0).board = [null, null, null];
  battle.side(1).board = [null, null, null];
  for (let lane = 0; lane < 3; lane++) put(battle, 1, 'X_DRONE', lane);
  battle.side(0).hand = ['T_H_NUKE'];
  assert.ok(battle.aiScore(battle.card('T_H_NUKE'), { kind: 'NONE' }, 0) > 0);
  await battle.takeAITurn(undefined, 0);
  assert.equal(battle.side(0).cardsPlayed, 1);
  assert.equal(battle.side(1).board.filter(Boolean).length, 0);
});

test('AI accounts for visible Acid deaths before treating a board clear as safe lethal', () => {
  const { battle } = duel();
  put(battle, 0, 'X_WARRIOR', 0, { currentHealth: 500 });
  battle.side(1).life = 2000;
  battle.side(0).life = 1800;
  assert.equal(battle.aiScore(battle.card('T_Y_SELF_DESTRUCT')), 0, 'Acid would turn the apparent win into mutual destruction');
  battle.side(1).life = 250;
  assert.equal(battle.aiScore(battle.card('T_H_NUKE')), 0, 'A clear must not kill its own commander via Acid');
});

test('AI does not spend a temporary Rush buff on a stun-blocked turn', () => {
  const { battle } = duel();
  put(battle, 1, 'X_DRONE', 0, { ready: false, stunned: 0, stunBlocked: true });
  assert.equal(battle.aiTargetFor(battle.card('T_X_VENT_AMBUSH')), null);
});

test('an immediate commander lethal is taken before playing even a useful card', async () => {
  for (const sideIndex of [0, 1]) {
    const { battle } = duel(sideIndex);
    put(battle, sideIndex, 'X_DRONE');
    battle.enemy(sideIndex).life = 900;
    battle.side(sideIndex).hand = ['T_E_CREATION'];
    const actions = [];
    await battle.takeAITurn(async kind => actions.push(kind), sideIndex);
    assert.equal(battle.state.winner, sideIndex);
    assert.equal(battle.side(sideIndex).cardsPlayed, 0);
    assert.deepEqual(actions, ['attack']);
  }
});

test('combined direct lethal across several lanes is also taken before spending cards', async () => {
  const { battle } = duel(0);
  put(battle, 0, 'X_CHESTBURSTER', 0);
  put(battle, 0, 'X_DRONE', 1);
  battle.side(1).life = 1400;
  battle.side(0).hand = ['T_E_CREATION'];
  const actions = [];
  await battle.takeAITurn(async kind => actions.push(kind), 0);
  assert.equal(battle.state.winner, 0);
  assert.equal(battle.side(0).cardsPlayed, 0);
  assert.deepEqual(actions, ['attack', 'attack']);
});

test('AI does not attack an immune synthetic or commit a suicide without an elimination', async () => {
  for (const immune of [true, false]) {
    const { battle } = duel();
    const attacker = put(battle, 1, immune ? 'X_PATH_STALKER' : 'X_DRONE');
    const defender = put(battle, 0, immune ? 'H_COMBAT_SYNTH' : 'X_QUEEN');
    const health = attacker.currentHealth;
    assert.equal(battle.aiAttackTarget(0), null);
    await battle.takeAITurn();
    assert.equal(attacker.attacked, false);
    assert.equal(attacker.currentHealth, health);
    assert.equal(battle.side(0).board[0], defender);
  }
});

test('flying attackers choose a profitable lethal trade instead of a larger suicidal target', () => {
  const { battle } = duel();
  put(battle, 1, 'Y_FALCONER');
  put(battle, 0, 'X_QUEEN_MOTHER', 0);
  put(battle, 0, 'X_DRONE', 1);
  const target = battle.aiAttackTarget(0);
  assert.equal(target.kind, 'UNIT');
  assert.equal(target.lane, 1);
});

test('reasonable equal-value lethal trades are accepted', () => {
  const { battle } = duel();
  put(battle, 1, 'X_DRONE', 0, { currentHealth: 800 });
  put(battle, 0, 'X_DRONE', 0, { currentHealth: 800 });
  const target = battle.aiAttackTarget(0);
  assert.equal(target.kind, 'UNIT');
  assert.equal(target.lane, 0);
});

test('after eliminating the last Guard the AI revisits a previously blocked direct lane', async () => {
  const { battle } = duel(0);
  const drone = put(battle, 0, 'X_DRONE', 0);
  const queen = put(battle, 0, 'X_QUEEN', 1);
  put(battle, 1, 'H_COMBAT_SYNTH', 1);
  assert.equal(battle.legalAttacks(0, 0).length, 0);
  await battle.takeAITurn(undefined, 0);
  assert.equal(queen.attacked, true);
  assert.equal(drone.attacked, true);
  assert.equal(battle.side(1).life, 7100);
});

test('evaluations neither mutate state nor consume RNG nor inspect hidden enemy cards', () => {
  const { battle, D } = duel();
  put(battle, 1, 'Y_FALCONER');
  put(battle, 0, 'X_DRONE');
  const before = JSON.stringify(battle.state);
  const opponent = battle.side(0);
  const hidden = { hand: opponent.hand, deck: opponent.deck };
  for (const field of ['hand', 'deck']) Object.defineProperty(opponent, field, { configurable: true, get() { throw new Error('Hidden opponent ' + field + ' inspected'); } });
  battle.rng = () => { throw new Error('Evaluator consumed RNG'); };
  for (const card of D.cards) {
    const target = battle.aiTargetFor(card);
    if (target) assert.ok(Number.isFinite(battle.aiScore(card, target)));
  }
  assert.ok(battle.aiAttackTarget(0));
  for (const field of ['hand', 'deck']) Object.defineProperty(opponent, field, { configurable: true, writable: true, enumerable: true, value: hidden[field] });
  assert.equal(JSON.stringify(battle.state), before);
});

test('seeded two-sided self-play is reproducible without artificial player moves', async () => {
  async function run() {
    const { battle, D } = duel(0, 9876);
    // Restore fresh seeded opening hands using the public constructor.
    const fresh = new battle.constructor({ playerDeck: D.starterDecks.HUMAN.cards, aiDeck: D.starterDecks.XENO.cards, seed: 9876 });
    const trace = [];
    for (let turn = 0; turn < 16 && fresh.state.winner === null; turn++) {
      const side = fresh.state.active;
      await fresh.takeAITurn(async (kind, card) => trace.push([side, kind, card?.cardId || card?.id || null]), side);
    }
    const state = JSON.stringify(fresh.state, (key, value) => ['id', 'uid', 'time', 'startedAt'].includes(key) ? undefined : value);
    return { state, trace };
  }
  assert.deepEqual(await run(), await run());
});
