import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const FACTIONS = Object.freeze(['XENO', 'YAUTJA', 'HUMAN', 'ENGINEER', 'HYBRID']);

export function parseOptions(args = []) {
  const options = { seeds: [1009], gamesPerPair: args.includes('--extended') ? 100 : 20, json: false, assertRelease: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--extended') continue;
    if (arg === '--json') { options.json = true; continue; }
    if (arg === '--assert-release') { options.assertRelease = true; continue; }
    if (arg === '--seed' || arg === '--seeds') {
      const raw = args[++i];
      if (!raw || !/^\d+(,\d+)*$/.test(raw)) throw new Error('Provide one or more comma-separated integer seeds.');
      options.seeds = raw.split(',').map(Number);
      if (options.seeds.length > 8 || new Set(options.seeds).size !== options.seeds.length
        || options.seeds.some(seed => !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)) {
        throw new Error('Use 1-8 distinct unsigned 32-bit seeds.');
      }
      continue;
    }
    if (arg === '--games-per-pair') {
      options.gamesPerPair = Number(args[++i]);
      if (!Number.isInteger(options.gamesPerPair) || options.gamesPerPair < 2
        || options.gamesPerPair > 1000 || options.gamesPerPair % 2 !== 0) {
        throw new Error('Games per pair must be an even integer from 2 to 1000, so starting seats are balanced.');
      }
      continue;
    }
    throw new Error(`Unknown balance option: ${arg}`);
  }
  return options;
}

export async function loadEngine() {
  const context = vm.createContext({ window: {}, console, Intl, setTimeout, clearTimeout });
  vm.runInContext(await readFile(new URL('../src/data.js', import.meta.url), 'utf8'), context);
  vm.runInContext(await readFile(new URL('../src/engine.js', import.meta.url), 'utf8'), context);
  return context.window.AVPEngine;
}

const percentage = (wins, games) => games ? Math.round(wins / games * 10000) / 100 : 0;

// Each seed batch uses the same schedule as the original launch benchmark.
// Alternate first player, use difficulty 1 (no life bonus), and never inspect
// opposing hands or substitute a benchmark-only player for production AI.
export async function runSimulation(engine, options = parseOptions()) {
  const { seeds, gamesPerPair } = options;
  const totals = Object.fromEntries(FACTIONS.map(faction => [faction, { wins: 0, losses: 0, draws: 0, games: 0, first: 0, second: 0 }]));
  const matchups = [];
  let games = 0, rounds = 0, capped = 0, firstPlayerWins = 0;
  for (const batchSeed of seeds) {
    for (let a = 0; a < FACTIONS.length; a += 1) {
      for (let b = a + 1; b < FACTIONS.length; b += 1) {
        const pair = { seed: batchSeed, factions: [FACTIONS[a], FACTIONS[b]], wins: [0, 0], draws: 0, capped: 0, games: 0 };
        for (let game = 0; game < gamesPerPair; game += 1) {
          const swapped = game % 2 === 1;
          const left = swapped ? FACTIONS[b] : FACTIONS[a];
          const right = swapped ? FACTIONS[a] : FACTIONS[b];
          const seed = batchSeed + a * 10000 + b * 1000 + game;
          const playerDeck = engine.buildAiDeck([left], 1, seed ^ engine.U.hash(left));
          const aiDeck = engine.buildAiDeck([right], 1, seed ^ engine.U.hash(right));
          for (const [faction, deck] of [[left, playerDeck], [right, aiDeck]]) {
            const checked = engine.validateDeck(deck, null, faction);
            if (!checked.valid) throw new Error(`Generated ${faction} deck is invalid: ${checked.errors.join(' ')}`);
          }
          const battle = new engine.Battle({ playerName: left, aiName: right, playerDeck, aiDeck, difficulty: 1, seed });
          let halfTurns = 0;
          while (battle.state.winner === null && halfTurns++ < 180) {
            await battle.takeAITurn(undefined, battle.state.active);
          }
          const winner = battle.state.winner;
          if (![null, -1, 0, 1].includes(winner)) throw new Error('Simulation returned an invalid winner.');
          games += 1; pair.games += 1; rounds += battle.state.round;
          capped += Number(winner === null); pair.capped += Number(winner === null);
          totals[left].games += 1; totals[right].games += 1;
          totals[left].first += 1; totals[right].second += 1;
          if (winner === 0 || winner === 1) {
            const winningFaction = winner === 0 ? left : right;
            const losingFaction = winner === 0 ? right : left;
            totals[winningFaction].wins += 1; totals[losingFaction].losses += 1;
            pair.wins[winningFaction === FACTIONS[a] ? 0 : 1] += 1;
            firstPlayerWins += Number(winner === 0);
          } else {
            totals[left].draws += 1; totals[right].draws += 1; pair.draws += 1;
          }
        }
        matchups.push(pair);
      }
    }
  }
  for (const row of Object.values(totals)) row.winRate = percentage(row.wins, row.games);
  const rates = Object.values(totals).map(row => row.winRate);
  return {
    mode: 'production-ai', difficulty: 1, seeds, gamesPerPair, games,
    averageRounds: Math.round(rounds / games * 100) / 100, capped,
    firstPlayerWinRate: percentage(firstPlayerWins, games),
    spread: Math.round((Math.max(...rates) - Math.min(...rates)) * 100) / 100,
    totals, matchups,
    limitation: 'Seeded AI self-play on generated decks measures this matchup pool, not competitive human balance.',
  };
}

export function formatReport(report) {
  const lines = [
    `Production AI balance simulation: ${report.games} games, ${report.averageRounds.toFixed(2)} average rounds, ${report.capped} turn caps.`,
    `Independent batches: ${report.seeds.join(', ')}; ${report.gamesPerPair} games per matchup per batch; difficulty 1; alternating starting seats.`,
  ];
  for (const faction of FACTIONS) {
    const row = report.totals[faction];
    lines.push(`${faction.padEnd(8)} ${String(row.wins).padStart(4)}W ${String(row.losses).padStart(4)}L ${String(row.draws).padStart(3)}D | ${row.winRate.toFixed(2)}% wins`);
  }
  lines.push(`Win-rate spread: ${report.spread.toFixed(2)} percentage points; first-player win rate: ${report.firstPlayerWinRate.toFixed(2)}%.`);
  lines.push(report.limitation);
  return lines.join('\n');
}

export function assertReleaseBalance(report) {
  const failures = [];
  if (report.capped !== 0) failures.push(`${report.capped} capped games`);
  if (Math.abs(report.firstPlayerWinRate - 50) > 7) failures.push(`first-player rate ${report.firstPlayerWinRate}%`);
  if (report.spread > 15) failures.push(`faction spread ${report.spread} points`);
  const worstMatchup = Math.max(...report.matchups.map((pair) => {
    const decided = pair.wins[0] + pair.wins[1];
    return decided ? Math.max(pair.wins[0], pair.wins[1]) / decided * 100 : 50;
  }));
  if (worstMatchup > 75) failures.push(`single-batch matchup dominance ${worstMatchup.toFixed(2)}%`);
  if (failures.length) throw new Error(`Release balance gate failed: ${failures.join('; ')}.`);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseOptions(process.argv.slice(2));
    const report = await runSimulation(await loadEngine(), options);
    if (options.assertRelease) assertReleaseBalance(report);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatReport(report));
    if (report.capped > report.games * 0.05) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
