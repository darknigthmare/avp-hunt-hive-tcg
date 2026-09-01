import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ART_PUBLIC_FILES } from '../scripts/art-public-files.mjs';
import { PUBLIC_FILES } from '../scripts/serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'assets/art/manifest.json'), 'utf8'));
const dataContext = createContext({ window: {} });
new Script(await readFile(resolve(root, 'src/data.js'), 'utf8')).runInContext(dataContext);
const data = dataContext.window.AVP_DATA;
const registryContext = createContext({ window: {} });
new Script(await readFile(resolve(root, 'src/art-manifest.js'), 'utf8')).runInContext(registryContext);
const registry = registryContext.window.AVP_ART;

const sceneIds = Object.freeze([
  'home-hero', 'battle-board',
  ...Array.from({ length: 8 }, (_, index) => `campaign-${index + 1}`),
  'booster-nx01', 'booster-cw02', 'booster-hg03',
  'booster-av04', 'booster-ev05', 'booster-px00',
]);
const cardIds = data.cards.map((card) => card.id);
const expectedDistribution = Object.freeze({
  cards: cardIds.length,
  scenes: sceneIds.length,
  total: cardIds.length + sceneIds.length,
});
const sorted = (values) => [...values].sort();
const requiredReviewChecks = [
  'decodedPng',
  'compositionApproved',
  'visualInspectionPassed',
  'noTextLogoOrWatermark',
  'originalFanMadeDirection',
  'noOfficialAssetOrActorLikeness',
];

function assertExactCounts(actual, expected) {
  assert.deepEqual(Object.keys(actual).sort(), ['cards', 'scenes', 'total']);
  assert.equal(actual.cards, expected.cards);
  assert.equal(actual.scenes, expected.scenes);
  assert.equal(actual.total, expected.total);
}

test('art manifest has exact complete card and scene coverage', () => {
  assert.equal(data.cards.length, 158);
  assert.equal(cardIds.every((id) => typeof id === 'string' && id.trim()), true);
  assert.equal(new Set(cardIds).size, 158);
  assert.equal(sceneIds.length, 16);
  assert.equal(new Set(sceneIds).size, 16);
  assert.equal(manifest.schema, 'avp-openai-art-v1');
  assert.equal(manifest.complete, true);
  assert.match(manifest.revision, /^[a-f0-9]{16}$/);
  assertExactCounts(manifest.expected, expectedDistribution);
  assert.equal(manifest.items.length, expectedDistribution.total);
  assert.equal(new Set(manifest.items.map((item) => item.id)).size, expectedDistribution.total);
  const cards = manifest.items.filter((item) => item.kind === 'card').map((item) => item.id).sort();
  assert.deepEqual(cards, sorted(cardIds));
  const scenes = manifest.items.filter((item) => item.kind === 'scene').map((item) => item.id).sort();
  assert.deepEqual(scenes, sorted(sceneIds));
  const computedCoverage = { cards: cards.length, scenes: scenes.length, total: cards.length + scenes.length };
  assertExactCounts(manifest.coverage, computedCoverage);
  assertExactCounts(computedCoverage, expectedDistribution);
  assert.equal(manifest.review.schema, 'avp-art-review-v1');
  assert.match(manifest.review.revision, /^[a-f0-9]{64}$/);
  assert.equal(manifest.review.count, expectedDistribution.total);
  assert.equal(typeof manifest.review.reviewer, 'string');
  assert.ok(manifest.review.reviewer.trim());
  assert.equal(typeof manifest.review.reviewedAt, 'string');
  assert.ok(manifest.review.reviewedAt.trim());
  assert.deepEqual(Object.keys(manifest.review.checklist).sort(), [...requiredReviewChecks].sort());
  for (const check of requiredReviewChecks) assert.equal(manifest.review.checklist[check], true);
});

test('every published artwork is a safe immutable WebP with matching SHA-256', async () => {
  const canonicalRoot = await realpath(root);
  const paths = new Set();
  let total = 0;
  for (const item of manifest.items) {
    assert.equal(item.provider, 'openai-imagegen');
    assert.equal(item.reviewed, true);
    assert.match(item.path, /^\/assets\/art\/(?:cards|scenes)\/[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.webp$/);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.match(item.sourceSha256, /^[a-f0-9]{64}$/);
    assert.equal(paths.has(item.path), false);
    paths.add(item.path);
    const file = resolve(root, item.path.slice(1));
    const canonical = await realpath(file);
    const info = await lstat(file);
    assert.equal(info.isFile(), true);
    assert.equal(info.isSymbolicLink(), false);
    assert.ok(canonical.startsWith(`${canonicalRoot}${sep}`));
    const bytes = await readFile(file);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
    assert.equal(bytes.length, item.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    assert.ok(item.width >= 640 && item.height >= 720);
    assert.ok(item.kind === 'card' ? bytes.length <= 240_000 : bytes.length <= 420_000);
    total += bytes.length;
  }
  assert.equal(total, manifest.totalBytes);
  assert.ok(total <= 32 * 1024 * 1024);
});

test('browser registry and explicit public allowlist expose only final derivatives', () => {
  assert.equal(registry.complete, true);
  assert.equal(registry.revision, manifest.revision);
  for (const [kind, bucketName] of [['card', 'cards'], ['scene', 'scenes']]) {
    const items = manifest.items.filter((item) => item.kind === kind);
    const bucket = registry[bucketName];
    assert.deepEqual(sorted(Object.keys(bucket)), sorted(items.map((item) => item.id)));
    for (const item of items) {
      const entry = bucket[item.id];
      assert.deepEqual(Object.keys(entry).sort(), ['alt', 'height', 'src', 'width']);
      assert.equal(entry.src, item.path);
      assert.equal(entry.alt, item.alt);
      assert.equal(entry.width, item.width);
      assert.equal(entry.height, item.height);
    }
  }
  assert.equal(new Set(ART_PUBLIC_FILES).size, 175);
  assert.equal(ART_PUBLIC_FILES.includes('assets/art/manifest.json'), true);
  assert.equal(ART_PUBLIC_FILES.every((file) => file.endsWith('.webp') || file === 'assets/art/manifest.json'), true);
  assert.equal(PUBLIC_FILES.includes('src/art-manifest.js'), true);
  assert.equal(PUBLIC_FILES.some((file) => file.endsWith('.png') && file.startsWith('assets/art/')), false);
  assert.equal(PUBLIC_FILES.some((file) => /standalone|art-originals/i.test(file)), false);
});
