import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = vm.createContext({ window: {}, console, Intl, setTimeout, clearTimeout });
vm.runInContext(await readFile(new URL('../src/data.js', import.meta.url), 'utf8'), context);
vm.runInContext(await readFile(new URL('../src/engine.js', import.meta.url), 'utf8'), context);

const D = context.window.AVP_DATA;
const E = context.window.AVPEngine;
const factions = ['XENO', 'YAUTJA', 'HUMAN', 'ENGINEER', 'HYBRID'];
const gamesPerPair = process.argv.includes('--extended') ? 100 : 20;

async function duel(left, right, seed) {
  const battle = new E.Battle({
    playerName: left,
    aiName: right,
    playerDeck: E.buildAiDeck([left], 1, seed ^ E.U.hash(left)),
    aiDeck: E.buildAiDeck([right], 1, seed ^ E.U.hash(right)),
    difficulty: 1,
    seed,
  });
  let halfTurns = 0;
  while (battle.state.winner === null && halfTurns++ < 180) await battle.takeAITurn(undefined, battle.state.active);
  return {
    winner: battle.state.winner,
    rounds: battle.state.round,
    capped: battle.state.winner === null,
  };
}

const totals = Object.fromEntries(factions.map((faction) => [faction, { wins: 0, losses: 0, draws: 0, games: 0 }]));
let rounds = 0;
let games = 0;
let capped = 0;

for (let a = 0; a < factions.length; a += 1) {
  for (let b = a + 1; b < factions.length; b += 1) {
    for (let game = 0; game < gamesPerPair; game += 1) {
      const swapped = game % 2 === 1;
      const left = swapped ? factions[b] : factions[a];
      const right = swapped ? factions[a] : factions[b];
      const result = await duel(left, right, 1009 + a * 10000 + b * 1000 + game);
      games += 1;
      rounds += result.rounds;
      capped += Number(result.capped);
      totals[left].games += 1;
      totals[right].games += 1;
      if (result.winner === 0) {
        totals[left].wins += 1;
        totals[right].losses += 1;
      } else if (result.winner === 1) {
        totals[right].wins += 1;
        totals[left].losses += 1;
      } else {
        totals[left].draws += 1;
        totals[right].draws += 1;
      }
    }
  }
}

console.log(`Production AI balance simulation: ${games} games, ${(rounds / games).toFixed(1)} average rounds, ${capped} turn caps.`);
for (const faction of factions) {
  const row = totals[faction];
  console.log(`${faction.padEnd(8)} ${String(row.wins).padStart(3)}W ${String(row.losses).padStart(3)}L ${String(row.draws).padStart(3)}D | ${(row.wins / row.games * 100).toFixed(1)}% wins`);
}

const rates = factions.map((faction) => totals[faction].wins / totals[faction].games);
const spread = (Math.max(...rates) - Math.min(...rates)) * 100;
console.log(`Win-rate spread: ${spread.toFixed(1)} percentage points.`);
if (capped > games * 0.05) process.exitCode = 1;
