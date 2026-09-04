import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'Usage: node scripts/art-retry-queue.mjs [--json] [--release]\n';
const knownArgs = new Set(['--json', '--release']);
const args = process.argv.slice(2);
if (args.some((arg) => !knownArgs.has(arg)) || new Set(args).size !== args.length) {
  process.stderr.write(USAGE);
  process.exitCode = 2;
} else {
  await main({ json: args.includes('--json'), release: args.includes('--release') }).catch((error) => {
    process.stderr.write(`Art fidelity queue failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

async function main(options) {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const [map, ledger] = await Promise.all([
    readJson(resolve(repoRoot, 'art-direction', 'avp-asset-fidelity-map.v1.json'), 'asset fidelity map'),
    readJson(resolve(repoRoot, '..', 'art-originals', 'fidelity-ledger.json'), 'private fidelity ledger'),
  ]);
  if (map.schema !== 'avp-asset-fidelity-map-v1' || !Array.isArray(map.assets)) {
    throw new Error('Expected avp-asset-fidelity-map-v1.');
  }
  if (ledger.schema !== 'avp-art-fidelity-ledger-v1' || !Array.isArray(ledger.assets)) {
    throw new Error('Expected avp-art-fidelity-ledger-v1.');
  }

  const mapped = new Map();
  for (const asset of map.assets) {
    const key = assetKey(asset);
    if (mapped.has(key)) throw new Error(`Duplicate mapped asset ${key}.`);
    if (!['P0', 'P1', 'P2'].includes(asset.priority)) throw new Error(`Invalid priority for ${key}.`);
    mapped.set(key, asset);
  }
  const activeLedger = new Map();
  for (const entry of ledger.assets) {
    if (entry?.active !== true) continue;
    const key = assetKey(entry);
    if (activeLedger.has(key)) throw new Error(`Duplicate active ledger entry ${key}.`);
    if (!mapped.has(key)) throw new Error(`Orphan active ledger entry ${key}.`);
    if (!['accepted', 'rejected', 'pending'].includes(entry.decision)) throw new Error(`Invalid decision for ${key}.`);
    activeLedger.set(key, entry);
  }
  for (const key of mapped.keys()) {
    if (!activeLedger.has(key)) throw new Error(`Missing active ledger entry ${key}.`);
  }

  const active = [...mapped.entries()].map(([key, asset]) => {
    const ledgerEntry = activeLedger.get(key);
    const lastAttempt = Array.isArray(ledgerEntry.attempts) ? ledgerEntry.attempts.at(-1) : null;
    return {
      id: asset.id,
      kind: asset.kind,
      priority: asset.priority,
      profile: asset.profile,
      subject: asset.subject,
      sourceName: ledgerEntry.sourceName,
      decision: ledgerEntry.decision,
      score: ledgerEntry.score,
      retryCount: ledgerEntry.retryCount,
      acceptedAttempt: ledgerEntry.acceptedAttempt,
      correctiveAction: lastAttempt?.decision === 'rejected' ? lastAttempt.correctiveAction ?? null : null,
    };
  });
  const priorityRank = { P0: 0, P1: 1, P2: 2 };
  const decisionRank = { rejected: 0, pending: 1, accepted: 2 };
  const queue = active
    .filter((asset) => asset.decision !== 'accepted')
    .sort((a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      decisionRank[a.decision] - decisionRank[b.decision] ||
      a.kind.localeCompare(b.kind) ||
      a.id.localeCompare(b.id));
  const countDecisions = (items) => ({
    total: items.length,
    accepted: items.filter(({ decision }) => decision === 'accepted').length,
    rejected: items.filter(({ decision }) => decision === 'rejected').length,
    pending: items.filter(({ decision }) => decision === 'pending').length,
    nonAccepted: items.filter(({ decision }) => decision !== 'accepted').length,
  });
  const counts = {
    ...countDecisions(active),
    byPriority: Object.fromEntries(['P0', 'P1', 'P2'].map((priority) => [
      priority,
      countDecisions(active.filter((asset) => asset.priority === priority)),
    ])),
  };
  const validator = spawnSync(
    process.execPath,
    [resolve(repoRoot, 'scripts', 'validate-art-fidelity.mjs'), '--release', '--json'],
    { cwd: repoRoot, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
  );
  if (validator.error || ![0, 1].includes(validator.status)) {
    throw new Error(`Strict release validator could not complete: ${validator.error?.message ?? validator.stderr?.trim() ?? `exit ${validator.status}`}`);
  }
  let releaseValidation;
  try {
    releaseValidation = JSON.parse(validator.stdout);
  } catch {
    throw new Error('Strict release validator returned invalid JSON.');
  }
  if (releaseValidation?.mode !== 'release' || typeof releaseValidation?.ok !== 'boolean' || !Array.isArray(releaseValidation?.errors)) {
    throw new Error('Strict release validator returned an incompatible result.');
  }
  const result = {
    schema: 'avp-art-retry-queue-v1',
    releaseEligible: validator.status === 0 && releaseValidation.ok === true,
    releaseErrors: releaseValidation.errors,
    counts,
    queue,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(
      `Art fidelity queue: ${counts.total} active | ${counts.accepted} accepted | ` +
      `${counts.rejected} rejected | ${counts.pending} pending | ${counts.nonAccepted} non-accepted.\n`,
    );
    process.stdout.write(`Release gate: ${result.releaseEligible ? 'READY' : 'BLOCKED'}\n`);
    for (const priority of ['P0', 'P1', 'P2']) {
      const priorityQueue = queue.filter((asset) => asset.priority === priority);
      const priorityCounts = counts.byPriority[priority];
      process.stdout.write(
        `\n${priority} queue (${priorityQueue.length}) — ${priorityCounts.accepted}/${priorityCounts.total} accepted:\n`,
      );
      if (priorityQueue.length === 0) {
        process.stdout.write('- clear\n');
        continue;
      }
      for (const item of priorityQueue) {
        const score = item.score === null ? 'n/a' : item.score;
        const correction = item.correctiveAction ? ` | correction=${item.correctiveAction}` : '';
        process.stdout.write(
          `- ${item.kind}:${item.id} [${item.decision}] profile=${item.profile} ` +
          `score=${score} retries=${item.retryCount} source=${item.sourceName}${correction}\n`,
        );
      }
    }
  }
  if (options.release && !result.releaseEligible) process.exitCode = 1;
}

async function readJson(filePath, label) {
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid ${label} JSON: ${error.message}`);
  }
}

function assetKey(asset) {
  if (!asset || !['card', 'scene'].includes(asset.kind) || typeof asset.id !== 'string' || !asset.id.trim()) {
    throw new Error('Invalid asset identity in map or ledger.');
  }
  return `${asset.kind}:${asset.id}`;
}
