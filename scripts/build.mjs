import { cp, lstat, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';
import { PUBLIC_FILES } from './serve.mjs';
import { ART_PUBLIC_FILES } from './art-public-files.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const fidelityContractPath = resolve(root, 'art-direction', 'avp-art-fidelity-contract.v1.json');
const morphologyProfilesPath = resolve(root, 'art-direction', 'avp-morphology-profiles.v1.json');
const fidelityMapPath = resolve(root, 'art-direction', 'avp-asset-fidelity-map.v1.json');
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

async function readTrustedPublicFile(filePath, label) {
  const info = await lstat(filePath);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is missing or unsafe.`);
  const canonicalRoot = await realpath(root);
  const canonical = await realpath(filePath);
  if (canonical !== canonicalRoot && !canonical.startsWith(`${canonicalRoot}${sep}`)) {
    throw new Error(`${label} escapes the repository root.`);
  }
  return readFile(canonical);
}

async function currentFidelityProof() {
  const contractBytes = await readTrustedPublicFile(fidelityContractPath, 'Artwork fidelity contract');
  const mapBytes = await readTrustedPublicFile(fidelityMapPath, 'Artwork fidelity map');
  const baseBytes = await readTrustedPublicFile(morphologyProfilesPath, 'Morphology profile registry');
  let contract;
  let assetMap;
  let base;
  try {
    contract = JSON.parse(contractBytes.toString('utf8'));
    assetMap = JSON.parse(mapBytes.toString('utf8'));
    base = JSON.parse(baseBytes.toString('utf8'));
  } catch {
    throw new Error('Public artwork fidelity proof files must contain valid JSON.');
  }
  if (
    contract.schema !== 'avp-art-fidelity-contract-v1' ||
    contract.version !== '1.0.0' ||
    base.schema !== 'avp-morphology-profiles-v1' ||
    base.version !== '1.0.0' ||
    assetMap.schema !== 'avp-asset-fidelity-map-v1' ||
    assetMap.version !== '1.0.0' ||
    assetMap.expected?.cards !== 158 ||
    assetMap.expected?.scenes !== 16 ||
    assetMap.expected?.total !== 174 ||
    !Array.isArray(assetMap.assets) ||
    assetMap.assets.length !== 174
  ) {
    throw new Error('Public artwork fidelity proof files are incompatible.');
  }
  const extensionNames = base.extensions ?? [];
  if (
    !Array.isArray(extensionNames) ||
    extensionNames.some((name) => basename(name) !== name || !/^[a-z0-9][a-z0-9.-]*\.json$/.test(name)) ||
    new Set(extensionNames).size !== extensionNames.length
  ) {
    throw new Error('Morphology profile extension list is unsafe.');
  }
  const profileFiles = [{ name: basename(morphologyProfilesPath), bytes: baseBytes }];
  for (const name of extensionNames) {
    profileFiles.push({
      name,
      bytes: await readTrustedPublicFile(resolve(dirname(morphologyProfilesPath), name), `Morphology profile extension ${name}`),
    });
  }
  return {
    contract: {
      schema: contract.schema,
      version: contract.version,
      sha256: createHash('sha256').update(contractBytes).digest('hex'),
    },
    profiles: {
      schema: base.schema,
      version: base.version,
      files: profileFiles.length,
      sha256: createHash('sha256').update(profileFiles
        .map((file) => `${file.name}:${createHash('sha256').update(file.bytes).digest('hex')}`)
        .sort()
        .join('\n')).digest('hex'),
    },
    map: {
      schema: assetMap.schema,
      version: assetMap.version,
      activeAssets: assetMap.assets.length,
      sha256: createHash('sha256').update(mapBytes).digest('hex'),
    },
  };
}

if (output === root || dirname(output) !== root) throw new Error('Unsafe build output directory.');
await import('./generate-icons.mjs');

const standalone = await readFile(resolve(root, 'AVP_HUNT_HIVE_TCG_STANDALONE.html'));
const hash = createHash('sha256').update(standalone).digest('hex');
const expected = '23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f';
if (hash !== expected) throw new Error('Standalone provenance hash mismatch.');

const index = await readFile(resolve(root, 'index.html'), 'utf8');
for (const asset of ['/assets/styles.css', '/src/data.js', '/src/expansion.js', '/src/art-manifest.js', '/src/engine.js', '/src/app.js', '/manifest.webmanifest']) {
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
// Run the optional playable wave in a SEPARATE VM; the original 158-card
// artwork provenance contract must continue validating its immutable baseline.
const expansionContext=createContext({window:{},Intl,Date,Math});
new Script(await readFile(resolve(root,'src','data.js'),'utf8'),{filename:'src/data.js'})
  .runInContext(expansionContext,{timeout:2000});
new Script(await readFile(resolve(root,'src','expansion.js'),'utf8'),{filename:'src/expansion.js'})
  .runInContext(expansionContext,{timeout:2500});
const live=expansionContext.window.AVP_DATA;
if(live.cards.length!==314||live.expansion?.addedCount!==156||live.expansionDecks?.length!==20
  ||new Set(live.cards.map(c=>c.id)).size!==314
  ||live.expansionDecks.some(p=>Object.values(p.cards).reduce((a,b)=>a+b,0)!==30
    ||Object.values(p.reserve).reduce((a,b)=>a+b,0)!==15)){
  throw new Error('Playable card-class expansion has an invalid inventory, template or duplicate ID.');
}
const expectedDistribution = Object.freeze({
  cards: cardIds.length,
  scenes: sceneIds.length,
  total: cardIds.length + sceneIds.length,
});
const BASE_REVIEW_CHECKS = Object.freeze([
  'decodedPng',
  'compositionApproved',
  'visualInspectionPassed',
  'noTextLogoOrWatermark',
  'originalFanMadeDirection',
  'noOfficialAssetOrActorLikeness',
]);
const STRICT_REVIEW_CHECKS = Object.freeze([
  ...BASE_REVIEW_CHECKS,
  'canonicalMorphologyFidelityPassed',
  'provenancePromptComplete',
  'retryPolicySatisfied',
]);
const STRICT_DIMENSIONS = Object.freeze([
  'anatomy',
  'poseReadability',
  'scaleAndProportion',
  'signatureTraits',
  'silhouette',
  'surfaceLanguage',
  'variantContinuity',
]);
const LEGACY_ART_RELEASE = Object.freeze({
  version: '1.0.0-art.2',
  revision: '1bbbbf9c83f92c66',
  reviewRevision: '5950cd5dad1d2fe921b30a850e2512e410ed2c02c08929f173738a1a9553112c',
});

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
const legacyArtRelease =
  artManifest.version === LEGACY_ART_RELEASE.version &&
  artManifest.revision === LEGACY_ART_RELEASE.revision &&
  artManifest.review?.schema === 'avp-art-review-v1' &&
  artManifest.review?.revision === LEGACY_ART_RELEASE.reviewRevision;
const strictArtRelease = artManifest.version === '1.0.0-art.3' && artManifest.review?.schema === 'avp-art-review-v2';
if (!legacyArtRelease && !strictArtRelease) {
  throw new Error('Artwork manifest is neither the frozen legacy release nor a strict fidelity v2 release.');
}
const expectedReviewChecks = strictArtRelease ? STRICT_REVIEW_CHECKS : BASE_REVIEW_CHECKS;
if (
  !/^[a-f0-9]{64}$/.test(artManifest.review?.revision) ||
  artManifest.review?.count !== expectedDistribution.total ||
  typeof artManifest.review?.reviewer !== 'string' || !artManifest.review.reviewer.trim() ||
  typeof artManifest.review?.reviewedAt !== 'string' || !artManifest.review.reviewedAt.trim() ||
  Object.keys(artManifest.review?.checklist ?? {}).length !== expectedReviewChecks.length ||
  expectedReviewChecks.some((check) => artManifest.review?.checklist?.[check] !== true)
) {
  throw new Error('Artwork manifest is missing its explicit public review.');
}
if (strictArtRelease) {
  const proof = await currentFidelityProof();
  const advertisedContract = artManifest.review.contract;
  const advertisedProfiles = artManifest.review.profiles;
  const advertisedMap = artManifest.review.map;
  if (
    advertisedContract?.schema !== proof.contract.schema ||
    advertisedContract?.version !== proof.contract.version ||
    advertisedContract?.sha256 !== proof.contract.sha256 ||
    advertisedProfiles?.schema !== proof.profiles.schema ||
    advertisedProfiles?.version !== proof.profiles.version ||
    advertisedProfiles?.files !== proof.profiles.files ||
    advertisedProfiles?.sha256 !== proof.profiles.sha256 ||
    advertisedMap?.schema !== proof.map.schema ||
    advertisedMap?.version !== proof.map.version ||
    advertisedMap?.activeAssets !== proof.map.activeAssets ||
    advertisedMap?.sha256 !== proof.map.sha256
  ) {
    throw new Error('Artwork manifest fidelity proofs do not match the current contract, profile bundle and asset map.');
  }
  const fidelity = artManifest.review.fidelity;
  const minimumDimensions = fidelity?.minimumDimensionScores;
  const profileCounts = fidelity?.profiles;
  if (
    fidelity?.threshold !== 95 ||
    fidelity?.minimumDimensionScore !== 90 ||
    fidelity?.accepted !== expectedDistribution.total ||
    fidelity?.promptComplete !== expectedDistribution.total ||
    fidelity?.hardFailures !== 0 ||
    typeof fidelity?.minimumScore !== 'number' || fidelity.minimumScore < 95 || fidelity.minimumScore > 100 ||
    typeof fidelity?.averageScore !== 'number' || fidelity.averageScore < 95 || fidelity.averageScore > 100 ||
    !Number.isInteger(fidelity?.retryCount) || fidelity.retryCount < 0 ||
    !Number.isInteger(fidelity?.maximumRetryCount) || fidelity.maximumRetryCount < 0 ||
    !minimumDimensions || Object.keys(minimumDimensions).sort().some((id, index) => id !== STRICT_DIMENSIONS[index]) ||
    STRICT_DIMENSIONS.some((id) => !Number.isInteger(minimumDimensions[id]) || minimumDimensions[id] < 90 || minimumDimensions[id] > 100) ||
    !profileCounts || typeof profileCounts !== 'object' || Array.isArray(profileCounts) ||
    Object.values(profileCounts).some((count) => !Number.isInteger(count) || count <= 0) ||
    Object.values(profileCounts).reduce((total, count) => total + count, 0) !== expectedDistribution.total
  ) {
    throw new Error('Artwork manifest is missing strict fidelity v2 aggregates.');
  }
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
    item.provider !== 'openai-imagegen' || item.reviewed !== true ||
    (strictArtRelease && item.promptProfile !== (item.kind === 'card'
      ? 'card-v2-canon-morphology-original-composition'
      : 'scene-v2-canon-morphology-original-composition'))
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
const computedArtRevision = createHash('sha256')
  .update([...artManifest.items]
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id))
    .map((item) => `${item.id}:${item.sha256}`)
    .join('\n'))
  .digest('hex')
  .slice(0, 16);
if (computedArtRevision !== artManifest.revision) throw new Error('Artwork manifest revision does not match its immutable items.');
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
  'src/expansion.js',
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
