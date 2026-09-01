import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const cliArgs = process.argv.slice(2);
const reviewerIndex = cliArgs.indexOf('--reviewer');
const reviewer = reviewerIndex >= 0 ? cliArgs[reviewerIndex + 1]?.trim() : '';
for (let index = 0; index < cliArgs.length; index += 1) {
  if (cliArgs[index] === '--approve') continue;
  if (cliArgs[index] === '--reviewer') {
    index += 1;
    continue;
  }
  throw new Error(`Unknown artwork review argument: ${cliArgs[index]}`);
}
if (cliArgs.filter((argument) => argument === '--approve').length !== 1) {
  throw new Error('Artwork review is an explicit release action. Re-run with --approve after visual QA.');
}
if (
  cliArgs.filter((argument) => argument === '--reviewer').length !== 1 ||
  !reviewer ||
  reviewer.startsWith('--') ||
  reviewer.length > 80 ||
  /[\u0000-\u001f\u007f]/.test(reviewer)
) {
  throw new Error('Artwork review requires one explicit --reviewer name (1-80 printable characters).');
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(root, '..', 'art-originals');
const REVIEW_CHECKLIST = Object.freeze({
  decodedPng: true,
  compositionApproved: true,
  visualInspectionPassed: true,
  noTextLogoOrWatermark: true,
  originalFanMadeDirection: true,
  noOfficialAssetOrActorLikeness: true,
});
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  throw new Error('Sharp is required to review artwork. Set NODE_PATH to a trusted Sharp installation.');
}

const SCENES = Object.freeze([
  ['home-hero', 'home-hero-v1.png'],
  ['battle-board', 'battle-board-v1.png'],
  ...Array.from({ length: 8 }, (_, index) => [`campaign-${index + 1}`, `campaign-mission-0${index + 1}-v1.png`]),
  ['booster-nx01', 'booster-nx01-v1.png'],
  ['booster-cw02', 'booster-cw02-v1.png'],
  ['booster-hg03', 'booster-hg03-v1.png'],
  ['booster-av04', 'booster-av04-v1.png'],
  ['booster-ev05', 'booster-ev05-v1.png'],
  ['booster-px00', 'booster-px00-v1.png'],
]);

const context = createContext({ window: {} });
new Script(await readFile(resolve(root, 'src', 'data.js'), 'utf8'), { filename: 'src/data.js' })
  .runInContext(context, { timeout: 2_000 });
const cards = context.window.AVP_DATA?.cards;
if (!Array.isArray(cards) || cards.length !== 158) throw new Error('Expected the canonical 158-card catalogue.');

const required = [
  ...cards.map((card) => ({
    id: card.id,
    kind: 'card',
    sourceName: `${card.id.toLowerCase()}-v1.png`,
    directory: 'cards',
    promptProfile: 'card-v1-original-biopunk',
  })),
  ...SCENES.map(([id, sourceName]) => ({
    id,
    kind: 'scene',
    sourceName,
    directory: 'scenes',
    promptProfile: 'scene-v1-original-biopunk',
  })),
];

for (const item of required) {
  if (!/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.png$/.test(item.sourceName) || basename(item.sourceName) !== item.sourceName) {
    throw new Error(`Unsafe review filename: ${item.sourceName}`);
  }
}

const expectedByDirectory = new Map([
  ['cards', new Set(required.filter((item) => item.directory === 'cards').map((item) => item.sourceName))],
  ['scenes', new Set(required.filter((item) => item.directory === 'scenes').map((item) => item.sourceName))],
]);
for (const [directory, expected] of expectedByDirectory) {
  const actual = (await readdir(resolve(sourceRoot, directory))).filter((name) => name.toLowerCase().endsWith('.png'));
  const unexpected = actual.filter((name) => !expected.has(name));
  if (unexpected.length) throw new Error(`Unexpected PNG masters in ${directory}: ${unexpected.join(', ')}`);
}

const canonicalRoot = await realpath(sourceRoot);
const items = [];
for (const item of required) {
  const source = resolve(sourceRoot, item.directory, item.sourceName);
  const canonical = await realpath(source);
  const info = await stat(canonical);
  if (!canonical.startsWith(`${canonicalRoot}${sep}`) || !info.isFile() || info.size === 0) {
    throw new Error(`Unsafe or empty artwork master: ${item.id}`);
  }
  const bytes = await readFile(canonical);
  const metadata = await sharp(bytes).metadata();
  const ratio = metadata.width / metadata.height;
  const portraitExpected = item.kind === 'card' || item.id.startsWith('booster-');
  const compositionIsValid = portraitExpected ? Math.abs(ratio - 0.8) <= 0.001 : ratio >= 1.3;
  const resolutionIsValid = portraitExpected
    ? metadata.width >= 1120 && metadata.height >= 1400
    : metadata.width >= 1600 && metadata.height >= 900;
  if (
    metadata.format !== 'png' ||
    !Number.isInteger(metadata.width) ||
    !Number.isInteger(metadata.height) ||
    !compositionIsValid ||
    !resolutionIsValid
  ) {
    throw new Error(`Artwork master has an invalid PNG composition or source resolution: ${item.id}`);
  }
  items.push({
    id: item.id,
    kind: item.kind,
    sourceName: item.sourceName,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    width: metadata.width,
    height: metadata.height,
    provider: 'openai-imagegen',
    promptProfile: item.promptProfile,
    approved: true,
    checks: { ...REVIEW_CHECKLIST },
  });
}

items.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
const reviewSchema = 'avp-art-review-v1';
const reviewVersion = '1.0.0-art.2';
const approvedAt = new Date().toISOString();
const revision = createHash('sha256')
  .update([
    `schema:${reviewSchema}`,
    `version:${reviewVersion}`,
    `approvedAt:${approvedAt}`,
    `reviewer:${reviewer}`,
    ...Object.entries(REVIEW_CHECKLIST).map(([check, passed]) => `check:${check}:${passed}`),
    ...items.map((item) => `${item.kind}:${item.id}:${item.sourceName}:${item.sourceSha256}:${item.bytes}:${item.width}x${item.height}:${item.provider}:${item.promptProfile}:approved=${item.approved}`),
  ].join('\n'))
  .digest('hex');
const review = {
  schema: reviewSchema,
  version: reviewVersion,
  revision,
  approvedAt,
  reviewer,
  checklist: { ...REVIEW_CHECKLIST },
  expected: { cards: 158, scenes: 16, total: 174 },
  items,
};
await writeFile(resolve(sourceRoot, 'review.json'), `${JSON.stringify(review, null, 2)}\n`);
console.log(`Explicit artwork review recorded: ${items.length}/174 masters, revision ${revision.slice(0, 16)}.`);
