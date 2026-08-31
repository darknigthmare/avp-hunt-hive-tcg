import assert from 'node:assert/strict';
import test from 'node:test';
import { FACTIONS, parseOptions, loadEngine, runSimulation, formatReport } from '../scripts/balance.mjs';

const E = await loadEngine();

test('balance CLI accepts independent seeds and preserves the launch default schedule', () => {
  assert.deepEqual(parseOptions(), { seeds: [1009], gamesPerPair: 20, json: false });
  assert.deepEqual(parseOptions(['--extended', '--seeds', '1009,991009', '--json']), {
    seeds: [1009, 991009], gamesPerPair: 100, json: true,
  });
  assert.equal(parseOptions(['--games-per-pair', '2']).gamesPerPair, 2);
  assert.deepEqual(parseOptions(['--seed', '0']).seeds, [0]);
});

test('balance CLI rejects invalid sizes, duplicate seeds and unknown arguments', () => {
  for (const args of [
    ['--games-per-pair', '3'], ['--games-per-pair', '0'], ['--games-per-pair', 'Infinity'],
    ['--games-per-pair', '1002'], ['--games-per-pair'], ['--seeds', '1,1'],
    ['--seed', '-1'], ['--seed', '4294967296'], ['--seed', '1.5'], ['--seeds', '1,'],
    ['--seeds', '1,2,3,4,5,6,7,8,9'], ['--unknown'],
  ]) assert.throws(() => parseOptions(args), undefined, args.join(' '));
});

test('benchmark seed and seat schedule remains compatible with the original baseline', async () => {
  const observed = [];
  const spyEngine = {
    U: { hash: () => 0 },
    buildAiDeck: (_factions, _difficulty, seed) => ({ seed }),
    validateDeck: () => ({ valid: true }),
    Battle: class {
      constructor(options) {
        observed.push([options.playerName, options.aiName, options.seed, options.playerDeck.seed, options.aiDeck.seed]);
        this.state = { winner: 0, round: 1 };
      }
    },
  };
  await runSimulation(spyEngine, parseOptions(['--games-per-pair', '2']));
  assert.deepEqual(observed.slice(0, 4), [
    ['XENO', 'YAUTJA', 2009, 2009, 2009],
    ['YAUTJA', 'XENO', 2010, 2010, 2010],
    ['XENO', 'HUMAN', 3009, 3009, 3009],
    ['HUMAN', 'XENO', 3010, 3010, 3010],
  ]);
});

test('independent batches cover all ten matchups with equal starting seats and reproducible outcomes', async () => {
  const options = parseOptions(['--seeds', '1009,991009', '--games-per-pair', '2']);
  const first = await runSimulation(E, options);
  const repeat = await runSimulation(E, options);
  assert.deepEqual(first, repeat);
  assert.equal(first.games, 40);
  assert.equal(first.matchups.length, 20);
  assert.equal(first.capped, 0);
  for (const faction of FACTIONS) {
    const row = first.totals[faction];
    assert.equal(row.games, 16);
    assert.equal(row.first, row.second);
    assert.equal(row.wins + row.losses + row.draws, row.games);
  }
  for (const pair of first.matchups) assert.equal(pair.wins[0] + pair.wins[1] + pair.draws, pair.games);
  assert.match(formatReport(first), /40 games/);
  assert.match(formatReport(first), /not competitive human balance/);
});

test('Human assault generation is legal, reproducible and actually provides an equipment formation', () => {
  const allowedSupport = new Set(['H_COMBAT_SYNTH', 'H_WORKING_JOE', 'H_POWERLOADER_RIPLEY', 'H_BISHOP', 'H_RIPLEY']);
  for (const difficulty of [0.5, 1, 2.1]) for (let seed = 1; seed <= 20; seed += 1) {
    const deck = E.buildAiDeck(['HUMAN'], difficulty, seed);
    assert.deepEqual(deck, E.buildAiDeck(['HUMAN'], difficulty, seed));
    assert.equal(E.validateDeck(deck, null, 'HUMAN').valid, true);
    const cards = E.expandDeck(deck).map(id => E.CARD.get(id));
    assert.equal(cards.filter(c => c.type === 'UNIT').length, 19);
    assert.equal(cards.filter(c => c.type === 'TACTIC').length, 6);
    assert.equal(cards.filter(c => c.type === 'EQUIPMENT').length, 5);
    assert.equal(cards.filter(c => c.type === 'LOCATION').length, 0);
    assert.ok(cards.filter(c => c.type === 'UNIT').every(c => c.tags.includes('uscm') || allowedSupport.has(c.id)));
    assert.ok(!cards.some(c => ['T_H_EVAC', 'T_H_QUARANTINE'].includes(c.id)));
  }
  const mixed = E.buildAiDeck(['HUMAN', 'YAUTJA'], 1, 172);
  assert.equal(E.validateDeck(mixed, null, ['HUMAN', 'YAUTJA']).valid, true);
  assert.equal(E.expandDeck(mixed).filter(id => E.CARD.get(id).type === 'LOCATION').length, 2);
  assert.equal(E.allowedForIdentity('H_NEWT', 'HUMAN'), true, 'AI archetype must not restrict player collection/decks');
});

function equipmentBattle(seed = 10) {
  const deck = E.buildAiDeck(['HUMAN'], 1, seed);
  const battle = new E.Battle({ playerDeck: deck, aiDeck: deck, difficulty: 1, seed });
  battle.side(0).board = [battle.makeUnit('H_COLONIAL_MARINE', 0), battle.makeUnit('H_COLONIAL_MARINE', 0), null];
  battle.side(1).board = [null, battle.makeUnit('X_WARRIOR', 1), null];
  return battle;
}

test('equipment AI chooses the lane where a weapon enables destruction, without mutating battle or RNG', () => {
  const battle = equipmentBattle();
  const control = equipmentBattle();
  for (const unit of battle.side(0).board.filter(Boolean)) { unit.healthBonus = 900; unit.currentHealth = 2000; }
  const snapshot = JSON.stringify(battle.serialize());
  const selected = battle.aiTargetFor(E.CARD.get('EQ_PULSE_RIFLE'), 0);
  assert.equal(selected.kind, 'FRIENDLY_UNIT');
  assert.equal(selected.lane, 1);
  assert.equal(JSON.stringify(battle.serialize()), snapshot);
  assert.equal(battle.rng(), control.rng(), 'evaluation must not consume random numbers');
});

test('equipment AI prioritizes armor that turns a lethal exchange into survival', () => {
  const battle = equipmentBattle();
  assert.equal(battle.aiTargetFor(E.CARD.get('EQ_MARINE_ARMOR'), 0).lane, 1);
});

test('equipment AI recognizes an immediately lethal unblocked attack', () => {
  const battle = equipmentBattle();
  battle.side(1).board = [null, null, null];
  battle.side(1).life = 1500;
  battle.side(1).shield = 0;
  battle.side(0).board[0].ready = true;
  const score = battle.aiScore(E.CARD.get('EQ_PULSE_RIFLE'), { kind: 'FRIENDLY_UNIT', lane: 0 }, 0);
  assert.equal(score, 10000);
});
