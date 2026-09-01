import { cp, lstat, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';
import { PUBLIC_FILES } from './serve.mjs';
import { ART_PUBLIC_FILES } from './art-public-files.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const expectedCardCount = 158;
const sceneIds = Object.freeze([
  'home-hero', 'battle-board',
  ...Array.from({ length: 8 }, (_, index) => `campaign-${index + 1}`),
  'booster-nx01', 'booster-cw02', 'booster-hg03',
  'booster-av04', 'booster-ev05', 'booster-px00',
]);

function hasExactCounts(value, expected) {
  return value &&
    Object.keys(value).length === 3 &&
    value.cards === expected.cards &&
    value.scenes === expected.scenes &&
    value.total === expected.total;
}

function hasSameIds(actual, expected) {
  if (actual.length !== expected.length) return false;
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  return actualSorted.every((id, index) => id === expectedSorted[index]);
}

if (output === root || dirname(output) !== root) throw new Error('Unsafe build output directory.');
await import('./generate-icons.mjs');

const standalone = await readFile(resolve(root, 'AVP_HUNT_HIVE_TCG_STANDALONE.html'));
const hash = createHash('sha256').update(standalone).digest('hex');
const expected = '23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f';
if (hash !== expected) throw new Error('Standalone provenance hash mismatch.');

const index = await readFile(resolve(root, 'index.html'), 'utf8');
for (const asset of ['/assets/styles.css', '/src/data.js', '/src/art-manifest.js', '/src/engine.js', '/src/app.js', '/manifest.webmanifest']) {
  if (!index.includes(asset)) throw new Error(`index.html is missing ${asset}`);
}

const dataContext = createContext({ window: {} });
new Script(await readFile(resolve(root, 'src', 'data.js'), 'utf8'), { filename: 'src/data.js' })
  .runInContext(dataContext, { timeout: 2_000 });
const cards = dataContext.window.AVP_DATA?.cards;
if (!Array.isArray(cards) || cards.length !== expectedCardCount) {
  throw new Error(`Expected ${expectedCardCount} cards in src/data.js.`);
}
const cardIds = cards.map((card) => card?.id);
if (cardIds.some((id) => typeof id !== 'string' || !id.trim()) || new Set(cardIds).size !== expectedCardCount) {
  throw new Error('Card IDs in src/data.js are missing or duplicated.');
}
const expectedDistribution = Object.freeze({
  cards: cardIds.length,
  scenes: sceneIds.length,
  total: cardIds.length + sceneIds.length,
});
const REQUIRED_REVIEW_CHECKS = Object.freeze([
  'decodedPng',
  'compositionApproved',
  'visualInspectionPassed',
  'noTextLogoOrWatermark',
  'originalFanMadeDirection',
  'noOfficialAssetOrActorLikeness',
]);

const artManifest = JSON.parse(await readFile(resolve(root, 'assets', 'art', 'manifest.json'), 'utf8'));
if (
  artManifest.schema !== 'avp-openai-art-v1' ||
  artManifest.complete !== true ||
  !/^[a-f0-9]{16}$/.test(artManifest.revision) ||
  !hasExactCounts(artManifest.expected, expectedDistribution) ||
  !Array.isArray(artManifest.items) ||
  artManifest.items.length !== expectedDistribution.total
) {
  throw new Error('Artwork manifest is incomplete or incompatible.');
}
if (
  artManifest.review?.schema !== 'avp-art-review-v1' ||
  !/^[a-f0-9]{64}$/.test(artManifest.review?.revision) ||
  artManifest.review?.count !== expectedDistribution.total ||
  typeof artManifest.review?.reviewer !== 'string' || !artManifest.review.reviewer.trim() ||
  typeof artManifest.review?.reviewedAt !== 'string' || !artManifest.review.reviewedAt.trim() ||
  REQUIRED_REVIEW_CHECKS.some((check) => artManifest.review?.checklist?.[check] !== true)
) {
  throw new Error('Artwork manifest is missing its explicit public review.');
}
const declaredArt = new Set(ART_PUBLIC_FILES);
const itemPaths = new Set();
const itemIds = new Set();
const itemIdsByKind = { card: [], scene: [] };
let artBytes = 0;
for (const item of artManifest.items) {
  if (
    !item || !['card', 'scene'].includes(item.kind) || typeof item.id !== 'string' || !item.id.trim() ||
    typeof item.path !== 'string' || !item.path.startsWith('/assets/art/') ||
    typeof item.alt !== 'string' || !item.alt.trim() ||
    !Number.isInteger(item.width) || item.width <= 0 ||
    !Number.isInteger(item.height) || item.height <= 0 ||
    !/^[a-f0-9]{64}$/.test(item.sha256) || !/^[a-f0-9]{64}$/.test(item.sourceSha256) ||
    item.provider !== 'openai-imagegen' || item.reviewed !== true
  ) throw new Error(`Invalid artwork manifest item: ${item?.id || 'unknown'}`);
  const file = item.path.slice(1);
  if (!declaredArt.has(file) || itemPaths.has(file) || itemIds.has(item.id)) {
    throw new Error(`Undeclared or duplicate artwork: ${item.id}`);
  }
  itemPaths.add(file);
  itemIds.add(item.id);
  itemIdsByKind[item.kind].push(item.id);
  const bytes = await readFile(resolve(root, file));
  if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) {
    throw new Error(`Artwork integrity mismatch: ${file}`);
  }
  artBytes += bytes.length;
}
const computedCoverage = {
  cards: itemIdsByKind.card.length,
  scenes: itemIdsByKind.scene.length,
  total: itemIds.size,
};
if (
  !hasExactCounts(artManifest.coverage, computedCoverage) ||
  !hasExactCounts(computedCoverage, expectedDistribution) ||
  !hasSameIds(itemIdsByKind.card, cardIds) ||
  !hasSameIds(itemIdsByKind.scene, sceneIds)
) {
  throw new Error('Artwork manifest IDs or computed coverage do not match the release contract.');
}

const registryContext = createContext({ window: {} });
new Script(await readFile(resolve(root, 'src', 'art-manifest.js'), 'utf8'), { filename: 'src/art-manifest.js' })
  .runInContext(registryContext, { timeout: 2_000 });
const registry = registryContext.window.AVP_ART;
if (!registry || registry.complete !== true || registry.revision !== artManifest.revision) {
  throw new Error('Browser artwork registry is incomplete or has the wrong revision.');
}
for (const [kind, bucketName] of [['card', 'cards'], ['scene', 'scenes']]) {
  const bucket = registry[bucketName];
  const items = artManifest.items.filter((item) => item.kind === kind);
  if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket) || !hasSameIds(Object.keys(bucket), items.map((item) => item.id))) {
    throw new Error(`Browser artwork registry ${bucketName} IDs do not match the manifest.`);
  }
  for (const item of items) {
    const entry = bucket[item.id];
    if (
      !entry ||
      !hasSameIds(Object.keys(entry), ['src', 'alt', 'width', 'height']) ||
      entry.src !== item.path || entry.alt !== item.alt ||
      entry.width !== item.width || entry.height !== item.height
    ) {
      throw new Error(`Browser artwork registry mismatch: ${item.id}`);
    }
  }
}

if (
  declaredArt.size !== ART_PUBLIC_FILES.length ||
  declaredArt.size !== itemPaths.size + 1 ||
  !declaredArt.has('assets/art/manifest.json') ||
  artBytes !== artManifest.totalBytes ||
  artBytes > 32 * 1024 * 1024
) {
  throw new Error('Artwork publication list or performance budget is invalid.');
}

// Validate the entire allowlist before touching the previous generated build.
// The immutable standalone stays in Git for provenance, never in production.
const revisionHash = createHash('sha256');
const canonicalRoot = await realpath(root);
for (const file of PUBLIC_FILES) {
  const source = resolve(root, file);
  const canonicalSource = await realpath(source);
  const info = await lstat(source);
  if (!canonicalSource.startsWith(`${canonicalRoot}${sep}`) || !info.isFile() || info.size === 0) {
    throw new Error(`Unsafe or empty public asset: ${file}`);
  }
  revisionHash.update(file).update('\0').update(await readFile(source)).update('\0');
}
const revision = revisionHash.digest('hex').slice(0, 16);
const worker = await readFile(resolve(root, 'sw.js'), 'utf8');
if (!worker.includes('__BUILD_REVISION__')) throw new Error('Service worker is missing its build revision marker.');
const outputInfo = await lstat(output).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (outputInfo && (!outputInfo.isDirectory() || outputInfo.isSymbolicLink())) throw new Error('Unsafe build output directory.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of PUBLIC_FILES) {
  const destination = resolve(output, file);
  await mkdir(dirname(destination), { recursive: true });
  if (file === 'sw.js') await writeFile(destination, worker.replaceAll('__BUILD_REVISION__', revision));
  else await cp(resolve(root, file), destination);
}

const required = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'src/data.js',
  'src/art-manifest.js',
  'assets/art/manifest.json',
  'assets/art/scenes/home-hero-v1.webp',
  'src/engine.js',
  'src/app.js',
];
for (const file of required) {
  const info = await stat(resolve(output, file));
  if (!info.isFile() || info.size === 0) throw new Error(`Missing build artifact: ${file}`);
}

console.log(`Production build ready in dist/ (${PUBLIC_FILES.length} public files, cache revision ${revision}, standalone SHA-256 ${hash.slice(0, 12)}...).`);
