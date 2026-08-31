import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// Follow the actual page's module order, including versioned duel persistence.
const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const scripts = await Promise.all(Array.from(page.matchAll(/<script[^>]+src="\/?(src\/[^"?]+\.js)"/g),
  match => readFile(new URL(`../${match[1]}`, import.meta.url), 'utf8')));
const STORAGE_KEY = 'avp-hunt-hive-tcg-save-v1';
const plain = value => JSON.parse(JSON.stringify(value));

function boot({ stored = {}, seed = 101, storageValues = null } = {}) {
  const values = storageValues || new Map(Object.entries(stored)), nodes = new Map(), warnings = [];
  let clock = 1788163200000 + seed;
  class TestDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  const node = () => ({ innerHTML: '', dataset: {}, style: {}, events: new Map(),
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, appendChild() {}, remove() {}, focus() {}, click() {},
    matches() { return false; }, querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener(name, handler) { this.events.set(name, handler); } });
  const document = { body: node(), activeElement: null, title: '',
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); },
    querySelector() { return null; }, createElement: node, addEventListener() {} };
  const localStorage = { getItem(id) { return values.get(id) || null; },
    setItem(id, value) { values.set(id, value); }, removeItem(id) { values.delete(id); } };
  const context = vm.createContext({ window: { matchMedia: () => ({ matches: false }), scrollTo() {}, addEventListener() {} },
    document, localStorage, navigator: {}, location: { protocol: 'file:', hostname: '', reload() {} },
    Date: TestDate, Math, Intl, TextEncoder, URL, Blob, setTimeout: () => 1, clearTimeout() {},
    confirm: () => true, prompt: () => null,
    console: { warn: (...args) => warnings.push(args), error: (...args) => warnings.push(args), log() {} } });
  for (const source of scripts) vm.runInContext(source, context);
  const click = async (action, dataset = {}) => {
    const element = { ...node(), dataset: { action, ...dataset }, disabled: false };
    element.closest = () => element;
    await nodes.get('app').events.get('click')({ target: element, preventDefault() {} });
  };
  return { app: context.window.AVP_APP, E: context.window.AVPEngine, D: context.window.AVP_DATA,
    values, nodes, warnings, click, advance() { clock += 1009; } };
}

async function starter(env, faction = 'YAUTJA') {
  await env.click('choose-starter', { id: faction });
  await env.click('tutorial-finish');
  assert.equal(env.app.Store.data.starterChosen, true);
  assert.equal(env.E.validateDeck(env.app.Store.deck().cards, env.app.Store.data.collection, faction).valid, true);
}

function collectionTotal(env) { return Object.values(env.app.Store.data.collection).reduce((sum, count) => sum + count, 0); }
function totalXP(profile) {
  let total = profile.xp;
  for (let level = 1; level < profile.level; level++) total += 900 + (level - 1) * 350;
  return total;
}
function expectedCreditDelta(env, before, reward) {
  const after = env.app.Store.data;
  const achievements = env.D.achievements.filter(a => after.achievements[a.id] && !before.achievements[a.id]);
  return reward + (after.profile.level - before.profile.level) * 300 + achievements.reduce((sum, a) => sum + a.reward, 0);
}
function finish(env, winner = 0) {
  const battle = env.app.state.battleContext.battle;
  battle.resolve(() => {
    if (winner !== 1) battle.damageHero(1, 99999);
    if (winner !== 0) battle.damageHero(0, 99999);
  });
  assert.equal(battle.state.winner, winner);
}
function countDeck(battle, sideIndex) {
  const side = battle.side(sideIndex), counts = {};
  for (const id of [...side.deck, ...side.hand]) counts[id] = (counts[id] || 0) + 1;
  return counts;
}

test('campaign metadata defines eight sequential operations with valid rewards and modifiers', () => {
  const { D } = boot();
  assert.deepEqual(plain(D.campaign.map(m => m.id)), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(plain(D.campaign.map(m => m.modifiers)), [[], ['enemyBrood'], ['enemyCloak'], ['ritual'], ['pathogen'], ['trophyRush'], ['deathPing'], ['boss']]);
  for (const mission of D.campaign) {
    assert.ok(mission.name.length > 0 && mission.description.length > 0);
    assert.ok(mission.factions.every(id => Object.hasOwn(D.factions, id)));
    assert.ok(Number.isFinite(mission.difficulty) && mission.difficulty >= 1);
    assert.ok(Number.isSafeInteger(mission.reward) && mission.reward > 0);
    assert.ok(D.boosters.some(pack => pack.id === mission.pack));
  }
});

test('new profile cannot deploy without a legal owned deck', () => {
  const env = boot();
  env.app.startBattle('campaign', env.D.campaign[0]);
  assert.equal(env.app.state.battleContext, null);
});

for (let missionId = 1; missionId <= 8; missionId++) {
  test(`mission ${missionId}: canonical setup, first reward, replay and reload are consistent`, async () => {
    const env = boot({ seed: missionId * 1009 });
    await starter(env);
    env.app.Store.data.profile.completedMissions = missionId - 1;
    env.app.Store.save();
    const mission = env.D.campaign[missionId - 1];
    // Mission objects from DOM/API callers never override the catalogue contract.
    env.app.startBattle('campaign', { ...mission, reward: 999999, modifiers: ['boss'], difficulty: 9 });
    const ctx = env.app.state.battleContext;
    assert.ok(ctx);
    assert.equal(ctx.mission, mission);
    assert.equal(ctx.difficulty, mission.difficulty);
    assert.deepEqual(plain(ctx.battle.modifiers), plain(mission.modifiers));
    assert.equal(ctx.battle.side(0).maxLife, 8000);
    assert.equal(ctx.battle.side(1).maxLife, Math.round(8000 * (1 + (mission.difficulty - 1) * .12)) + (missionId === 8 ? 1000 : 0));
    assert.equal(env.E.validateDeck(countDeck(ctx.battle, 1), null, mission.factions).valid, true);
    const before = plain(env.app.Store.data), copies = collectionTotal(env);
    finish(env);
    let after = env.app.Store.data;
    assert.equal(after.profile.completedMissions, missionId);
    assert.equal(after.profile.wins, before.profile.wins + 1);
    assert.equal(totalXP(after.profile) - totalXP(before.profile), 500);
    assert.equal(after.profile.credits - before.profile.credits, expectedCreditDelta(env, before, mission.reward));
    assert.equal(after.profile.packsOpened, before.profile.packsOpened + 1);
    assert.equal(collectionTotal(env), copies + 9);
    assert.equal(ctx.packReward.pack.id, mission.pack);
    assert.equal(after.profile.pity, ctx.packReward.bestRank >= 4 ? 0 : before.profile.pity + 1);
    assert.ok(ctx.packReward.pulls.every(pull => after.seenCards[pull.cardId]));
    assert.ok(after.achievements.first_win && after.achievements.first_pack);
    if (Object.values(after.collection).filter(count => count > 0).length >= 50) assert.ok(after.achievements.collector_50);
    if (ctx.packReward.bestRank >= 5) assert.ok(after.achievements.secret_pull);
    assert.equal(Boolean(after.achievements.campaign_clear), missionId === 8);
    assert.deepEqual(plain(after.history[0]), { date: after.history[0].date, battleId: ctx.battle.id, mode: 'campaign', mission: missionId,
      winner: 0, reward: mission.reward, xp: 500, round: 1, abandoned: false, replay: false });
    const once = JSON.stringify(after);
    ctx.battle.checkEnd();
    ctx.battle.onGameOver({ winner: 0, reason: 'duplicate', state: ctx.battle.state });
    assert.equal(JSON.stringify(env.app.Store.data), once, 'a completed result is awarded exactly once');
    await env.click('result-continue');
    assert.equal(env.app.state.screen, 'campaign');
    assert.match(env.nodes.get('app').innerHTML, /OPÉRATION VALIDÉE/);
    const replayBefore = plain(env.app.Store.data);
    await env.click('start-mission', { id: String(missionId) });
    finish(env);
    after = env.app.Store.data;
    assert.equal(after.history[0].replay, true);
    assert.equal(after.history[0].reward, Math.round(mission.reward * .35));
    assert.equal(totalXP(after.profile) - totalXP(replayBefore.profile), 180);
    assert.equal(after.profile.credits - replayBefore.profile.credits, expectedCreditDelta(env, replayBefore, Math.round(mission.reward * .35)));
    assert.equal(after.profile.completedMissions, missionId);
    assert.equal(after.profile.packsOpened, replayBefore.profile.packsOpened);
    assert.equal(collectionTotal(env), copies + 9);
    assert.equal(env.app.state.battleContext.packReward, null);
    const restored = boot({ stored: Object.fromEntries(env.values) });
    assert.deepEqual(plain(restored.app.Store.data.profile), plain(after.profile));
    assert.deepEqual(plain(restored.app.Store.data.collection), plain(after.collection));
    assert.deepEqual(plain(restored.app.Store.data.achievements), plain(after.achievements));
    assert.deepEqual(plain(restored.app.Store.data.history), plain(after.history));
  });
}

test('all seven locked missions reject API and click attempts without mutating progress', async () => {
  const env = boot(); await starter(env);
  const before = JSON.stringify(env.app.Store.data);
  for (const mission of env.D.campaign.slice(1)) {
    env.app.startBattle('campaign', mission);
    await env.click('start-mission', { id: String(mission.id) });
    assert.equal(env.app.state.battleContext, null);
    assert.equal(JSON.stringify(env.app.Store.data), before);
  }
  for (const invalid of [null, {}, { id: 0 }, { id: 9 }, { id: '1' }]) {
    env.app.startBattle('campaign', invalid);
    assert.equal(env.app.state.battleContext, null);
  }
});

test('an in-progress operation cannot be replaced by another launch', async () => {
  const env = boot(); await starter(env);
  env.app.startBattle('campaign', env.D.campaign[0]);
  const original = env.app.state.battleContext;
  env.app.startBattle('quick');
  env.app.startBattle('campaign', env.D.campaign[0]);
  assert.equal(env.app.state.battleContext, original);
});

test('all progression boundaries allow only the next mission, never a later operation', async () => {
  for (let completed = 0; completed < 7; completed++) {
    const env = boot(); await starter(env);
    env.app.Store.data.profile.completedMissions = completed; env.app.Store.save();
    env.app.state.screen = 'campaign'; env.app.render();
    assert.equal((env.nodes.get('app').innerHTML.match(/>Verrouillée<\/button>/g) || []).length, 7 - completed);
    for (const later of env.D.campaign.slice(completed + 1)) {
      await env.click('start-mission', { id: String(later.id) });
      assert.equal(env.app.state.battleContext, null);
    }
    await env.click('start-mission', { id: String(completed + 1) });
    assert.equal(env.app.state.battleContext.mission.id, completed + 1);
  }
});

test('campaign rejects undersized, unowned and identity-invalid decks', async () => {
  for (const corruption of ['undersized', 'unowned', 'identity', 'legacy']) {
    const env = boot(); await starter(env);
    const deck = env.app.Store.deck(), firstId = Object.keys(deck.cards)[0];
    if (corruption === 'undersized') deck.cards[firstId]--;
    if (corruption === 'unowned') env.app.Store.data.collection[firstId] = 0;
    if (corruption === 'identity') deck.faction = 'XENO';
    if (corruption === 'legacy') deck.faction = 'MIXED';
    env.app.startBattle('campaign', env.D.campaign[0]);
    assert.equal(env.app.state.battleContext, null, corruption);
    assert.equal(env.app.Store.data.profile.completedMissions, 0);
  }
});

for (const winner of [1, -1]) {
  test(`campaign ${winner === 1 ? 'defeat' : 'draw'} never grants first-win pack or unlock`, async () => {
    const env = boot(); await starter(env);
    const before = plain(env.app.Store.data), copies = collectionTotal(env);
    env.app.startBattle('campaign', env.D.campaign[0]);
    env.app.state.battleContext.battle.side(0).totalTrophies = 10;
    finish(env, winner);
    const after = env.app.Store.data, reward = winner === 1 ? 120 : 180, xp = winner === 1 ? 90 : 120;
    assert.equal(after.profile.completedMissions, 0);
    assert.equal(after.profile.packsOpened, before.profile.packsOpened);
    assert.equal(collectionTotal(env), copies);
    assert.equal(totalXP(after.profile) - totalXP(before.profile), xp);
    assert.equal(after.profile.credits - before.profile.credits, expectedCreditDelta(env, before, reward));
    assert.equal(after.profile.totalTrophies, 10);
    assert.ok(after.achievements.trophy_10);
    assert.equal(after.achievements.first_win, undefined);
    assert.equal(after.achievements.campaign_clear, undefined);
    assert.equal(after.history[0].reward, reward);
    assert.equal(after.history[0].xp, xp);
    assert.equal(after.history[0].winner, winner);
  });
}

test('campaign surrender neither unlocks missions nor grants any progression', async () => {
  const env = boot(); await starter(env);
  const before = plain(env.app.Store.data), copies = collectionTotal(env);
  env.app.startBattle('campaign', env.D.campaign[0]);
  env.app.state.battleContext.battle.side(0).totalTrophies = 25;
  await env.click('battle-surrender');
  const after = env.app.Store.data;
  for (const field of ['completedMissions', 'credits', 'xp', 'level', 'packsOpened', 'pity', 'totalTrophies'])
    assert.equal(after.profile[field], before.profile[field], field);
  assert.equal(collectionTotal(env), copies);
  assert.deepEqual(plain(after.achievements), before.achievements);
  assert.equal(after.profile.losses, before.profile.losses + 1);
  assert.equal(after.history[0].abandoned, true);
});

test('prototype booster unlocks at its configured campaign threshold; locked purchases spend nothing', async () => {
  const env = boot(); await starter(env);
  const prototype = env.D.boosters.find(pack => pack.id === 'pack_px00');
  assert.ok(prototype.unlocksAt > 0 && prototype.unlocksAt <= env.D.campaign.length);
  env.app.Store.data.profile.completedMissions = prototype.unlocksAt - 1;
  env.app.Store.data.profile.credits = 100000;
  env.app.Store.save();
  const before = JSON.stringify(env.app.Store.data);
  env.app.buyPack(prototype.id);
  assert.equal(JSON.stringify(env.app.Store.data), before);
  env.app.startBattle('campaign', env.D.campaign[prototype.unlocksAt - 1]); finish(env);
  assert.equal(env.app.Store.data.profile.completedMissions, prototype.unlocksAt);
  const beforePurchase = plain(env.app.Store.data), copies = collectionTotal(env);
  env.app.buyPack(prototype.id);
  assert.equal(env.app.Store.data.profile.packsOpened, beforePurchase.profile.packsOpened + 1);
  assert.equal(collectionTotal(env), copies + 9);
  assert.equal(env.app.Store.data.profile.credits - beforePurchase.profile.credits, expectedCreditDelta(env, beforePurchase, -prototype.price));
});

test('all campaign achievement rewards are one-time and history remains bounded', async () => {
  const env = boot(); await starter(env);
  for (const mission of env.D.campaign) {
    env.app.startBattle('campaign', mission); finish(env); await env.click('result-continue');
  }
  assert.equal(env.app.Store.data.profile.completedMissions, 8);
  assert.equal(env.app.Store.data.profile.packsOpened, 8);
  assert.ok(env.app.Store.data.achievements.first_pack);
  assert.ok(env.app.Store.data.achievements.first_win);
  assert.ok(env.app.Store.data.achievements.campaign_clear);
  const achievementDates = plain(env.app.Store.data.achievements);
  for (let i = 0; i < 25; i++) {
    const before = plain(env.app.Store.data);
    env.advance(); env.app.startBattle('campaign', env.D.campaign[0]); finish(env);
    assert.equal(env.app.Store.data.profile.credits - before.profile.credits, expectedCreditDelta(env, before, 315));
    await env.click('result-continue');
  }
  assert.deepEqual(plain(env.app.Store.data.achievements), achievementDates);
  assert.equal(env.app.Store.data.history.length, 25);
  assert.equal(env.app.Store.data.profile.packsOpened, 8);
  assert.ok(env.app.Store.data.history.every(entry => entry.replay && entry.mission === 1));
});

test('mission modifiers execute their documented asymmetric board rules', async () => {
  function battleFor(missionId) {
    const { E, D } = boot(), mission = D.campaign[missionId - 1];
    return new E.Battle({ playerDeck: D.starterDecks.HUMAN.cards, aiDeck: D.starterDecks.XENO.cards,
      difficulty: mission.difficulty, modifiers: mission.modifiers, seed: 2039 });
  }
  const brood = battleFor(2); brood.state.round = 2; brood.beginTurn(0);
  assert.equal(brood.side(0).board.filter(Boolean).length, 0);
  brood.beginTurn(1); assert.equal(brood.side(1).board.find(Boolean).cardId, 'X_FACEHUGGER');
  const cloak = battleFor(3); cloak.state.active = 1; cloak.side(1).energy = 10;
  cloak.side(1).hand = ['X_DRONE', 'X_WARRIOR'];
  assert.equal(cloak.playCard(1, 0, { kind: 'FRIENDLY_LANE', lane: 0 }).ok, true);
  assert.equal(cloak.playCard(1, 0, { kind: 'FRIENDLY_LANE', lane: 1 }).ok, true);
  assert.equal(cloak.side(1).board[0].cloaked, true);
  assert.equal(cloak.side(1).board[1].cloaked, false);
  const ritual = battleFor(4);
  assert.equal(ritual.side(0).location.cardId, 'L_BOUVET');
  assert.equal(ritual.side(1).location.cardId, 'L_BOUVET');
  const pathogen = battleFor(5);
  for (const side of [0, 1]) {
    const organic = pathogen.summonAt(side, 'X_DRONE', 0), synthetic = pathogen.summonAt(side, 'H_COMBAT_SYNTH', 1);
    pathogen.beginTurn(side); assert.equal(organic.attackBonus, -100); assert.equal(synthetic.attackBonus, 0);
  }
  const trophies = battleFor(6);
  assert.equal(trophies.has(trophies.summonAt(0, 'X_DRONE', 0), 'TROPHY'), false);
  assert.equal(trophies.has(trophies.summonAt(1, 'X_DRONE', 0), 'TROPHY'), true);
  const ping = battleFor(7); ping.summonAt(0, 'X_DRONE', 0); ping.summonAt(1, 'X_DRONE', 0);
  const life = ping.side(0).life; ping.destroyUnit(0, 0); assert.equal(ping.side(0).life, life - 100);
  const enemyLife = ping.side(1).life; ping.destroyUnit(1, 0); assert.equal(ping.side(1).life, enemyLife - 100);
  const boss = battleFor(8); assert.equal(boss.side(1).maxLife, 10200);
  boss.endTurn(0); assert.equal(boss.side(1).energy, 2); assert.equal(boss.side(0).maxEnergy, 1);
});

test('all eight operations complete real AI-driven duels with all three starter factions', async t => {
  const summary = [];
  for (let missionId = 1; missionId <= 8; missionId++) {
    const results = { mission: missionId, games: 0, wins: 0, losses: 0, draws: 0, maxRounds: 0 };
    for (const faction of ['XENO', 'YAUTJA', 'HUMAN']) for (const seed of [1009, 991009, 7717]) {
      const env = boot({ seed: seed + missionId * 10000 }); await starter(env, faction);
      env.app.Store.data.profile.completedMissions = missionId - 1; env.app.Store.save();
      await env.click('start-mission', { id: String(missionId) });
      const battle = env.app.state.battleContext.battle;
      // Suppress repeated DOM-string rendering, not rules, saves or result callbacks.
      env.app.state.screen = 'campaign';
      for (let turn = 0; turn < 180 && battle.state.winner === null; turn++) await battle.takeAITurn(undefined, battle.state.active);
      assert.notEqual(battle.state.winner, null, `mission ${missionId}, ${faction}, seed ${seed} must terminate`);
      assert.equal(env.app.Store.data.history.length, 1);
      assert.equal(env.app.Store.data.history[0].winner, battle.state.winner);
      assert.equal(env.app.Store.data.profile.completedMissions, missionId - (battle.state.winner === 0 ? 0 : 1));
      assert.equal(env.app.Store.data.profile.packsOpened, battle.state.winner === 0 ? 1 : 0);
      assert.ok(battle.state.sides.every(side => Number.isFinite(side.life) && side.board.length === 3));
      results.games++; results[battle.state.winner === 0 ? 'wins' : battle.state.winner === 1 ? 'losses' : 'draws']++;
      results.maxRounds = Math.max(results.maxRounds, battle.state.round);
    }
    summary.push(results);
  }
  t.diagnostic(`72 real duels, no forced damage/hand/deck manipulation: ${JSON.stringify(summary)}`);
});

test('a starter can clear all eight operations through real games, rewards and saved unlocks', async t => {
  let env = boot({ seed: 900901 }); await starter(env, 'YAUTJA');
  const initialDeck = plain(env.app.Store.deck().cards), path = [];
  for (let missionId = 1; missionId <= 8; missionId++) {
    let won = false;
    for (let attempt = 1; attempt <= 48 && !won; attempt++) {
      env.advance();
      await env.click('start-mission', { id: String(missionId) });
      const battle = env.app.state.battleContext.battle;
      env.app.state.screen = 'campaign';
      for (let turn = 0; turn < 180 && battle.state.winner === null; turn++) await battle.takeAITurn(undefined, battle.state.active);
      assert.notEqual(battle.state.winner, null);
      won = battle.state.winner === 0;
      await env.click('result-continue');
      if (won) path.push({ mission: missionId, attempts: attempt, rounds: battle.state.round });
    }
    assert.equal(won, true, `mission ${missionId} is reachable through actual legal starter play`);
    assert.equal(env.app.Store.data.profile.completedMissions, missionId);
    assert.equal(env.app.Store.data.profile.packsOpened, missionId);
    env = boot({ stored: Object.fromEntries(env.values), seed: 900901 + missionId * 991009 });
    assert.equal(env.app.Store.data.profile.completedMissions, missionId);
    assert.deepEqual(plain(env.app.Store.deck().cards), initialDeck);
  }
  assert.ok(env.app.Store.data.achievements.campaign_clear);
  assert.equal(env.app.Store.data.profile.wins, 8);
  t.diagnostic(`Full campaign with unchanged YAUTJA starter, genuine AI turns and reload after each victory: ${JSON.stringify(path)}`);
});

test('a stale second tab cannot overwrite a completed campaign reward from the first tab', async () => {
  const sharedStorage = new Map(), first = boot({ storageValues: sharedStorage });
  await starter(first);
  first.app.startBattle('campaign', first.D.campaign[0]);
  const second = boot({ storageValues: sharedStorage });
  await second.app.resumeBattle();
  assert.equal(second.app.state.battleContext.battle.id, first.app.state.battleContext.battle.id);
  finish(first, 0);
  const completed = JSON.parse(sharedStorage.get(STORAGE_KEY));
  assert.equal(completed.profile.completedMissions, 1);
  finish(second, 1);
  const afterStaleWrite = JSON.parse(sharedStorage.get(STORAGE_KEY));
  assert.equal(afterStaleWrite.profile.completedMissions, 1, 'stale tab must not roll back an earned campaign unlock');
  assert.deepEqual(afterStaleWrite.profile, completed.profile);
  assert.deepEqual(afterStaleWrite.collection, completed.collection);
});

test('checkpoint capture failure keeps the live duel available instead of silently discarding it', async () => {
  const env = boot(); await starter(env);
  env.app.startBattle('campaign', env.D.campaign[0]);
  const ctx = env.app.state.battleContext, checkpoint = JSON.stringify(env.app.Store.data.duel);
  ctx.battle.rng.getState = () => { throw new Error('Injected snapshot failure'); };
  const index = ctx.battle.side(0).hand.findIndex((id, i) => ctx.battle.canPlay(0, i).ok);
  assert.ok(index >= 0);
  ctx.battle.playCard(0, index, ctx.battle.canPlay(0, index).targets[0]);
  env.app.pauseBattle();
  assert.equal(env.app.state.battleContext === ctx, true, 'failed capture must preserve unsaved live actions');
  assert.equal(env.app.state.screen, 'battle');
  assert.equal(JSON.stringify(env.app.Store.data.duel), checkpoint, 'last known good checkpoint remains exportable');
});
