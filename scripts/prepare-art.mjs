import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(root, '..', 'art-originals');
const contractPath = resolve(root, 'art-direction', 'avp-art-fidelity-contract.v1.json');
const profilesPath = resolve(root, 'art-direction', 'avp-morphology-profiles.v1.json');
const mapPath = resolve(root, 'art-direction', 'avp-asset-fidelity-map.v1.json');
const briefsPath = resolve(sourceRoot, 'fidelity-briefs.json');
const ledgerPath = resolve(sourceRoot, 'fidelity-ledger.json');
const outputRoot = resolve(root, 'assets', 'art');
const stagingRoot = resolve(root, 'assets', `.art-staging-${process.pid}`);
const backupRoot = resolve(root, 'assets', `.art-backup-${process.pid}`);
const registryPath = resolve(root, 'src', 'art-manifest.js');
const registryTemporary = `${registryPath}.tmp-${process.pid}`;
const registryBackup = `${registryPath}.backup-${process.pid}`;
const publicListPath = resolve(root, 'scripts', 'art-public-files.mjs');
const publicListTemporary = `${publicListPath}.tmp-${process.pid}`;
const publicListBackup = `${publicListPath}.backup-${process.pid}`;
const allowPartial = process.argv.includes('--allow-partial');
const expectedCardCount = 158;
const REVIEW_SCHEMA = 'avp-art-review-v2';
const REVIEW_VERSION = '1.0.0-art.3';
const MAP_SCHEMA = 'avp-asset-fidelity-map-v1';
const FIDELITY_VERSION = '1.0.0';
const FIDELITY_THRESHOLD = 95;
const MINIMUM_DIMENSION_SCORE = 90;
const REQUIRED_REVIEW_CHECKS = Object.freeze([
  'decodedPng',
  'compositionApproved',
  'visualInspectionPassed',
  'noTextLogoOrWatermark',
  'originalFanMadeDirection',
  'noOfficialAssetOrActorLikeness',
  'canonicalMorphologyFidelityPassed',
  'provenancePromptComplete',
  'retryPolicySatisfied',
]);

if ([outputRoot, stagingRoot, backupRoot].some((directory) => dirname(directory) !== resolve(root, 'assets'))) {
  throw new Error('Unsafe artwork output path.');
}

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  throw new Error('Sharp is required to prepare artwork. Set NODE_PATH to a trusted Sharp installation.');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function safeText(value, maxLength = 4_000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(value);
}

async function readTrustedBytes(path, allowedRoot, label) {
  const info = await lstat(path).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
  if (!info || !info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is missing or unsafe.`);
  const canonical = await realpath(path);
  const canonicalRoot = await realpath(allowedRoot);
  if (canonical !== canonicalRoot && !canonical.startsWith(`${canonicalRoot}${sep}`)) throw new Error(`${label} escapes its trusted root.`);
  return readFile(canonical);
}

async function loadProfileBundle() {
  const baseBytes = await readTrustedBytes(profilesPath, root, 'Morphology profile registry');
  let base;
  try {
    base = JSON.parse(baseBytes.toString('utf8'));
  } catch {
    throw new Error('Morphology profile registry is not valid JSON.');
  }
  const extensions = base.extensions ?? [];
  if (!Array.isArray(extensions) || extensions.some((name) => !/^[a-z0-9][a-z0-9.-]*\.json$/.test(name) || basename(name) !== name)) {
    throw new Error('Morphology profile extension list is unsafe.');
  }
  const files = [{ name: basename(profilesPath), bytes: baseBytes }];
  for (const name of extensions) {
    if (files.some((file) => file.name === name)) throw new Error(`Duplicate morphology profile extension: ${name}`);
    files.push({
      name,
      bytes: await readTrustedBytes(resolve(dirname(profilesPath), name), root, `Morphology profile extension ${name}`),
    });
  }
  return {
    files: files.length,
    sha256: sha256(Buffer.from(files.map((file) => `${file.name}:${sha256(file.bytes)}`).sort().join('\n'))),
  };
}

function safeName(name) {
  if (!/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.(?:png|webp)$/.test(name) || basename(name) !== name) {
    throw new Error(`Unsafe artwork filename: ${name}`);
  }
  return name;
}

function normalizeSecondaryProfiles(values, label) {
  const normalized = values ?? [];
  if (
    !Array.isArray(normalized) ||
    normalized.some((profile) => !safeText(profile, 120)) ||
    new Set(normalized).size !== normalized.length
  ) {
    throw new Error(`${label} must be a unique list of profile ids.`);
  }
  return [...normalized];
}

function sameProfiles(left, right) {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.length === sortedRight.length &&
    sortedLeft.every((profile, index) => profile === sortedRight[index]);
}

async function loadAssetMap() {
  const bytes = await readTrustedBytes(mapPath, root, 'Canonical asset fidelity map');
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error('Canonical asset fidelity map is not valid JSON.');
  }
  if (
    parsed.schema !== MAP_SCHEMA ||
    parsed.version !== FIDELITY_VERSION ||
    parsed.expected?.cards !== expectedCardCount ||
    parsed.expected?.scenes !== 16 ||
    parsed.expected?.total !== expectedCardCount + 16 ||
    !Array.isArray(parsed.assets) ||
    parsed.assets.length !== expectedCardCount + 16
  ) {
    throw new Error('Canonical asset fidelity map is incomplete or incompatible.');
  }
  const byKey = new Map();
  const sourceNames = new Set();
  for (const asset of parsed.assets) {
    const key = `${asset?.kind}:${asset?.id}`;
    const secondaryProfiles = normalizeSecondaryProfiles(asset?.secondaryProfiles, `Mapped asset ${asset?.id || 'unknown'} secondaryProfiles`);
    if (
      byKey.has(key) ||
      !['card', 'scene'].includes(asset?.kind) ||
      !safeText(asset?.id, 120) ||
      !safeText(asset?.profile, 120) ||
      secondaryProfiles.includes(asset.profile) ||
      !safeName(asset?.sourceName).endsWith('.png') ||
      sourceNames.has(asset.sourceName)
    ) {
      throw new Error(`Invalid canonical asset mapping: ${asset?.id || 'unknown'}`);
    }
    sourceNames.add(asset.sourceName);
    byKey.set(key, { ...asset, secondaryProfiles });
  }
  if (
    byKey.size !== expectedCardCount + 16 ||
    [...byKey.values()].filter(({ kind }) => kind === 'card').length !== expectedCardCount ||
    [...byKey.values()].filter(({ kind }) => kind === 'scene').length !== 16
  ) {
    throw new Error('Canonical asset fidelity map identities do not match the release contract.');
  }
  return { parsed, bytes, byKey };
}

async function loadCatalogue() {
  const source = await readFile(resolve(root, 'src', 'data.js'), 'utf8');
  const context = createContext({ window: {} });
  new Script(source, { filename: 'src/data.js' }).runInContext(context, { timeout: 2_000 });
  const data = context.window.AVP_DATA;
  if (!data || !Array.isArray(data.cards) || data.cards.length !== expectedCardCount) {
    throw new Error(`Expected ${expectedCardCount} cards in src/data.js.`);
  }
  return data;
}

const SCENES = Object.freeze([
  ['home-hero', 'home-hero-v1.png', 1440, 810, 'Confrontation dans un complexe spatial abandonné.'],
  ['battle-board', 'battle-board-v1.png', 1440, 810, 'Hangar biologique organisé en trois voies tactiques.'],
  ['campaign-1', 'campaign-mission-01-v1.png', 1280, 720, 'Signal mystérieux au-dessus d’une lune hostile.'],
  ['campaign-2', 'campaign-mission-02-v1.png', 1280, 720, 'Dernière défense d’une colonie assiégée.'],
  ['campaign-3', 'campaign-mission-03-v1.png', 1280, 720, 'Chasse nocturne dans une jungle équatoriale.'],
  ['campaign-4', 'campaign-mission-04-v1.png', 1280, 720, 'Rituel dans un labyrinthe sous la glace.'],
  ['campaign-5', 'campaign-mission-05-v1.png', 1280, 720, 'Expérience biologique dans un observatoire ancien.'],
  ['campaign-6', 'campaign-mission-06-v1.png', 1280, 720, 'Traque sur une planète transformée en réserve.'],
  ['campaign-7', 'campaign-mission-07-v1.png', 1280, 720, 'Échec du confinement dans une ville minière.'],
  ['campaign-8', 'campaign-mission-08-v1.png', 1280, 720, 'Affrontement final dans une arène orbitale impossible.'],
  ['booster-nx01', 'booster-nx01-v1.png', 720, 900, 'Origines hostiles et signal oublié.'],
  ['booster-cw02', 'booster-cw02-v1.png', 720, 900, 'Escouade coloniale face à une ruche.'],
  ['booster-hg03', 'booster-hg03-v1.png', 720, 900, 'Chasseur rituel dans une jungle nocturne.'],
  ['booster-av04', 'booster-av04-v1.png', 720, 900, 'Duel rituel sous la glace.'],
  ['booster-ev05', 'booster-ev05-v1.png', 720, 900, 'Évolution biologique dans un sanctuaire ancien.'],
  ['booster-px00', 'booster-px00-v1.png', 720, 900, 'Archives de prototypes interdits.'],
]);

const data = await loadCatalogue();
const required = [
  ...data.cards.map((card) => ({
    id: card.id,
    kind: 'card',
    sourceName: safeName(`${card.id.toLowerCase()}-v1.png`),
    outputName: safeName(`${card.id.toLowerCase()}-v1.webp`),
    width: 640,
    height: 800,
    alt: `${card.name} — illustration originale ${data.factions[card.faction]?.name || card.faction}.`,
    card: {
      name: card.name,
      type: card.type,
      faction: card.faction,
      set: card.set,
      rarity: card.rarity,
      collectorNo: card.collectorNo,
    },
    promptProfile: 'card-v2-canon-morphology-original-composition',
  })),
  ...SCENES.map(([id, sourceName, width, height, alt]) => ({
    id,
    kind: 'scene',
    sourceName: safeName(sourceName),
    outputName: safeName(sourceName.replace(/\.png$/, '.webp')),
    width,
    height,
    alt,
    promptProfile: 'scene-v2-canon-morphology-original-composition',
  })),
];
const assetMapInfo = await loadAssetMap();
const requiredIdentityKeys = new Set(required.map((item) => `${item.kind}:${item.id}`));
if (
  assetMapInfo.byKey.size !== requiredIdentityKeys.size ||
  [...assetMapInfo.byKey.keys()].some((key) => !requiredIdentityKeys.has(key)) ||
  required.some((item) => assetMapInfo.byKey.get(`${item.kind}:${item.id}`)?.sourceName !== item.sourceName)
) {
  throw new Error('Canonical asset map identities or source names do not match the game catalogue.');
}

let review;
try {
  review = JSON.parse(await readFile(resolve(sourceRoot, 'review.json'), 'utf8'));
} catch {
  throw new Error('Strict artwork review is missing or invalid. Validate the private fidelity briefs and ledger before release.');
}
if (
  review.schema !== REVIEW_SCHEMA ||
  review.version !== REVIEW_VERSION ||
  review.expected?.cards !== expectedCardCount ||
  review.expected?.scenes !== SCENES.length ||
  review.expected?.total !== required.length ||
  !/^[a-f0-9]{64}$/.test(review.revision) ||
  typeof review.approvedAt !== 'string' ||
  Number.isNaN(Date.parse(review.approvedAt)) ||
  typeof review.reviewer !== 'string' ||
  !review.reviewer.trim() ||
  review.contract?.schema !== 'avp-art-fidelity-contract-v1' ||
  review.contract?.version !== '1.0.0' ||
  !/^[a-f0-9]{64}$/.test(review.contract?.sha256) ||
  review.profiles?.schema !== 'avp-morphology-profiles-v1' ||
  review.profiles?.version !== '1.0.0' ||
  !/^[a-f0-9]{64}$/.test(review.profiles?.sha256) ||
  review.map?.schema !== MAP_SCHEMA ||
  review.map?.version !== FIDELITY_VERSION ||
  !/^[a-f0-9]{64}$/.test(review.map?.sha256) ||
  review.map?.activeAssets !== required.length ||
  review.briefs?.schema !== 'avp-art-fidelity-briefs-v1' ||
  review.briefs?.version !== '1.0.0' ||
  !/^[a-f0-9]{64}$/.test(review.briefs?.sha256) ||
  review.briefs?.activeAssets !== required.length ||
  review.ledger?.schema !== 'avp-art-fidelity-ledger-v1' ||
  review.ledger?.version !== '1.0.0' ||
  !/^[a-f0-9]{64}$/.test(review.ledger?.sha256) ||
  review.ledger?.activeAssets !== required.length ||
  review.fidelity?.threshold !== FIDELITY_THRESHOLD ||
  review.fidelity?.minimumDimensionScore !== MINIMUM_DIMENSION_SCORE ||
  review.fidelity?.accepted !== required.length ||
  review.fidelity?.promptComplete !== required.length ||
  review.fidelity?.hardFailures !== 0 ||
  REQUIRED_REVIEW_CHECKS.some((check) => review.checklist?.[check] !== true) ||
  !Array.isArray(review.items) ||
  review.items.length !== required.length
) {
  throw new Error('Strict artwork review v2 is incomplete or incompatible.');
}
const profileBundle = await loadProfileBundle();
if (profileBundle.sha256 !== review.profiles.sha256 || profileBundle.files !== review.profiles.files) {
  throw new Error('Strict artwork review no longer matches the morphology profile bundle. Run the attributed review again.');
}
for (const [path, rootPath, expectedHash, label] of [
  [contractPath, root, review.contract.sha256, 'fidelity contract'],
  [mapPath, root, review.map.sha256, 'canonical asset fidelity map'],
  [briefsPath, sourceRoot, review.briefs.sha256, 'private fidelity briefs'],
  [ledgerPath, sourceRoot, review.ledger.sha256, 'private fidelity ledger'],
]) {
  const bytes = await readTrustedBytes(path, rootPath, label).catch(() => null);
  if (!bytes || sha256(bytes) !== expectedHash) {
    throw new Error(`Strict artwork review no longer matches the ${label}. Run the attributed review again.`);
  }
}
const reviewed = new Map();
for (const item of review.items) {
  const key = `${item.kind}:${item.id}`;
  const mapped = assetMapInfo.byKey.get(key);
  const secondaryProfiles = normalizeSecondaryProfiles(item?.secondaryProfiles, `Reviewed item ${item?.id || 'unknown'} secondaryProfiles`);
  const acceptedAttempt = Array.isArray(item.attempts) ? item.attempts.at(-1) : null;
  if (
    reviewed.has(key) ||
    !mapped ||
    !['card', 'scene'].includes(item.kind) ||
    typeof item.sourceName !== 'string' ||
    item.sourceName !== mapped.sourceName ||
    !/^[a-f0-9]{64}$/.test(item.sourceSha256) ||
    !Number.isInteger(item.bytes) ||
    !Number.isInteger(item.width) ||
    !Number.isInteger(item.height) ||
    item.provider !== 'openai-imagegen' ||
    item.active !== true ||
    item.decision !== 'accepted' ||
    item.approved !== true ||
    !Number.isFinite(item.score) ||
    item.score < FIDELITY_THRESHOLD ||
    item.score > 100 ||
    !safeText(item.profile, 120) ||
    item.profile !== mapped.profile ||
    !sameProfiles(secondaryProfiles, mapped.secondaryProfiles) ||
    !Number.isInteger(item.retryCount) ||
    item.retryCount < 0 ||
    !Number.isInteger(item.acceptedAttempt) ||
    !/^[a-f0-9]{64}$/.test(item.promptSha256) ||
    item.promptComplete !== true ||
    !safeText(item.continuity, 240) ||
    !safeText(item.canonTarget, 500) ||
    !safeText(item.referenceBasis) ||
    !item.anchors ||
    typeof item.anchors !== 'object' ||
    Array.isArray(item.anchors) ||
    Object.keys(item.anchors).length === 0 ||
    Object.values(item.anchors).some((passed) => passed !== true) ||
    !Array.isArray(item.hardFails) ||
    item.hardFails.length !== 0 ||
    !item.dimensionScores ||
    typeof item.dimensionScores !== 'object' ||
    Array.isArray(item.dimensionScores) ||
    Object.keys(item.dimensionScores).length === 0 ||
    Object.values(item.dimensionScores).some((value) => !Number.isInteger(value) || value < MINIMUM_DIMENSION_SCORE || value > 100) ||
    !Array.isArray(item.attempts) ||
    item.attempts.length === 0 ||
    item.retryCount !== item.attempts.filter((attempt) => attempt?.decision === 'rejected').length ||
    !acceptedAttempt ||
    acceptedAttempt.decision !== 'accepted' ||
    acceptedAttempt.attempt !== item.acceptedAttempt ||
    acceptedAttempt.sourceName !== item.sourceName ||
    acceptedAttempt.sourceSha256 !== item.sourceSha256 ||
    acceptedAttempt.promptSha256 !== item.promptSha256 ||
    acceptedAttempt.score !== item.score ||
    acceptedAttempt.promptComplete !== true ||
    !Array.isArray(acceptedAttempt.hardFails) ||
    acceptedAttempt.hardFails.length !== 0 ||
    stableJson(acceptedAttempt.anchors) !== stableJson(item.anchors) ||
    stableJson(acceptedAttempt.dimensionScores) !== stableJson(item.dimensionScores) ||
    REQUIRED_REVIEW_CHECKS.some((check) => item.checks?.[check] !== true) ||
    !['card-v2-canon-morphology-original-composition', 'scene-v2-canon-morphology-original-composition'].includes(item.promptProfile)
  ) {
    throw new Error(`Invalid strict artwork approval: ${item?.id || 'unknown'}`);
  }
  reviewed.set(key, { ...item, secondaryProfiles });
}
const requiredReviewKeys = new Set(required.map((item) => `${item.kind}:${item.id}`));
if (reviewed.size !== requiredReviewKeys.size || [...reviewed.keys()].some((key) => !requiredReviewKeys.has(key))) {
  throw new Error('Strict artwork review IDs do not match the release contract.');
}
const reviewScores = [...reviewed.values()].map((item) => item.score);
const reviewProfiles = Object.fromEntries([...new Set([...reviewed.values()].map((item) => item.profile))]
  .sort()
  .map((profile) => [profile, [...reviewed.values()].filter((item) => item.profile === profile).length]));
const retryCounts = [...reviewed.values()].map((item) => item.retryCount);
const dimensionIds = [...new Set([...reviewed.values()].flatMap((item) => Object.keys(item.dimensionScores)))].sort();
const minimumDimensionScores = Object.fromEntries(dimensionIds.map((id) => [
  id,
  Math.min(...[...reviewed.values()].map((item) => item.dimensionScores[id])),
]));
if (
  review.fidelity.minimumScore !== Math.min(...reviewScores) ||
  review.fidelity.averageScore !== Number((reviewScores.reduce((total, value) => total + value, 0) / reviewScores.length).toFixed(2)) ||
  review.fidelity.retryCount !== retryCounts.reduce((total, value) => total + value, 0) ||
  review.fidelity.maximumRetryCount !== Math.max(...retryCounts) ||
  stableJson(review.fidelity.profiles) !== stableJson(reviewProfiles) ||
  stableJson(review.fidelity.minimumDimensionScores) !== stableJson(minimumDimensionScores)
) {
  throw new Error('Strict artwork review aggregates do not match its accepted items.');
}
const { revision: recordedReviewRevision, ...unsignedReview } = review;
const computedReviewRevision = sha256(Buffer.from(stableJson(unsignedReview)));
if (computedReviewRevision !== recordedReviewRevision) throw new Error('Strict artwork review revision mismatch.');

const available = [];
const missing = [];
for (const item of required) {
  const source = resolve(sourceRoot, item.kind === 'card' ? 'cards' : 'scenes', item.sourceName);
  const info = await stat(source).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
  if (!info || !info.isFile() || info.size === 0) missing.push(item);
  else available.push({ ...item, source, sourceBytes: info.size });
}

if (missing.length && !allowPartial) {
  throw new Error(`Artwork coverage incomplete: ${available.length}/${required.length}; missing ${missing.slice(0, 8).map((item) => item.id).join(', ')}${missing.length > 8 ? '…' : ''}`);
}

// Build a complete sibling tree first. Conversion or validation failures leave
// the previously generated public artwork untouched.
await rm(stagingRoot, { recursive: true, force: true });
await rm(backupRoot, { recursive: true, force: true });
await rm(registryTemporary, { force: true });
await rm(publicListTemporary, { force: true });
await rm(registryBackup, { force: true });
await rm(publicListBackup, { force: true });
const items = [];
let revision;
let manifest;
try {
  await mkdir(resolve(stagingRoot, 'cards'), { recursive: true });
  await mkdir(resolve(stagingRoot, 'scenes'), { recursive: true });

  for (const item of available) {
    const subdirectory = item.kind === 'card' ? 'cards' : 'scenes';
    const destination = resolve(stagingRoot, subdirectory, item.outputName);
    const temporary = `${destination}.tmp`;
    const canonicalSource = await realpath(item.source);
    const canonicalSourceRoot = await realpath(sourceRoot);
    if (!canonicalSource.startsWith(`${canonicalSourceRoot}${sep}`)) throw new Error(`Unsafe artwork source: ${item.id}`);
    const sourceBytes = await readFile(canonicalSource);
    const sourceDigest = sha256(sourceBytes);
    const sourceMetadata = await sharp(sourceBytes).metadata();
    const approval = reviewed.get(`${item.kind}:${item.id}`);
    if (
      !approval ||
      approval.sourceName !== item.sourceName ||
      approval.sourceSha256 !== sourceDigest ||
      approval.bytes !== sourceBytes.length ||
      approval.width !== sourceMetadata.width ||
      approval.height !== sourceMetadata.height
    ) {
      throw new Error(`Artwork master is not explicitly approved: ${item.id}`);
    }
    await sharp(sourceBytes)
      .rotate()
      .resize({ width: item.width, height: item.height, fit: 'cover', position: 'attention', withoutEnlargement: false })
      .webp({ quality: item.kind === 'card' ? 82 : 84, effort: 6, smartSubsample: true })
      .toFile(temporary);
    await rename(temporary, destination);
    const bytes = await readFile(destination);
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== 'webp' || metadata.width !== item.width || metadata.height !== item.height || bytes.length < 8_000) {
      throw new Error(`Invalid optimized artwork: ${item.id}`);
    }
    items.push({
      id: item.id,
      kind: item.kind,
      path: `/assets/art/${subdirectory}/${item.outputName}`,
      width: metadata.width,
      height: metadata.height,
      bytes: bytes.length,
      sha256: sha256(bytes),
      sourceSha256: sourceDigest,
      provider: approval.provider,
      reviewed: approval.approved,
      promptProfile: item.promptProfile,
      alt: item.alt,
      ...(item.card ? { card: item.card } : {}),
    });
  }

  items.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  revision = sha256(Buffer.from(items.map((item) => `${item.id}:${item.sha256}`).join('\n'))).slice(0, 16);
  manifest = {
    schema: 'avp-openai-art-v1',
    version: REVIEW_VERSION,
    revision,
    complete: missing.length === 0,
    expected: { cards: expectedCardCount, scenes: SCENES.length, total: required.length },
    coverage: {
      cards: items.filter((item) => item.kind === 'card').length,
      scenes: items.filter((item) => item.kind === 'scene').length,
      total: items.length,
    },
    totalBytes: items.reduce((total, item) => total + item.bytes, 0),
    review: {
      schema: review.schema,
      revision: review.revision,
      count: review.items.length,
      reviewedAt: review.approvedAt,
      reviewer: review.reviewer,
      checklist: review.checklist,
      contract: {
        schema: review.contract.schema,
        version: review.contract.version,
        sha256: review.contract.sha256,
      },
      profiles: {
        schema: review.profiles.schema,
        version: review.profiles.version,
        sha256: review.profiles.sha256,
        files: review.profiles.files,
      },
      map: {
        schema: review.map.schema,
        version: review.map.version,
        sha256: review.map.sha256,
        activeAssets: review.map.activeAssets,
      },
      fidelity: {
        threshold: review.fidelity.threshold,
        minimumDimensionScore: review.fidelity.minimumDimensionScore,
        accepted: review.fidelity.accepted,
        promptComplete: review.fidelity.promptComplete,
        hardFailures: review.fidelity.hardFailures,
        minimumScore: review.fidelity.minimumScore,
        averageScore: review.fidelity.averageScore,
        minimumDimensionScores: review.fidelity.minimumDimensionScores,
        retryCount: review.fidelity.retryCount,
        maximumRetryCount: review.fidelity.maximumRetryCount,
        profiles: review.fidelity.profiles,
      },
    },
    rights: 'Original fan-made project artwork generated with OpenAI ImageGen; no official visual assets included.',
    items,
  };

  await writeFile(resolve(stagingRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const cards = Object.fromEntries(items.filter((item) => item.kind === 'card').map((item) => [item.id, { src: item.path, alt: item.alt, width: item.width, height: item.height }]));
  const scenes = Object.fromEntries(items.filter((item) => item.kind === 'scene').map((item) => [item.id, { src: item.path, alt: item.alt, width: item.width, height: item.height }]));
  await writeFile(registryTemporary, `/* Generated by scripts/prepare-art.mjs; do not edit by hand. */\nwindow.AVP_ART=${JSON.stringify({ version: manifest.version, revision, complete: manifest.complete, cards, scenes })};\n`);

  const artFiles = ['assets/art/manifest.json', ...items.map((item) => item.path.slice(1))];
  await writeFile(publicListTemporary, `/* Generated by scripts/prepare-art.mjs; do not edit by hand. */\nexport const ART_PUBLIC_FILES=Object.freeze(${JSON.stringify(artFiles, null, 2)});\n`);
} catch (error) {
  await Promise.allSettled([
    rm(stagingRoot, { recursive: true, force: true }),
    rm(registryTemporary, { force: true }),
    rm(publicListTemporary, { force: true }),
  ]);
  throw error;
}

const previousOutput = await lstat(outputRoot).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
if (previousOutput && (!previousOutput.isDirectory() || previousOutput.isSymbolicLink())) {
  throw new Error('Unsafe existing artwork output directory.');
}
const previousRegistry = await lstat(registryPath).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
const previousPublicList = await lstat(publicListPath).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
if (
  (previousRegistry && (!previousRegistry.isFile() || previousRegistry.isSymbolicLink())) ||
  (previousPublicList && (!previousPublicList.isFile() || previousPublicList.isSymbolicLink()))
) {
  throw new Error('Unsafe existing artwork registry.');
}
let previousMoved = false;
let registryMoved = false;
let publicListMoved = false;
let stagedInstalled = false;
let registryInstalled = false;
let publicListInstalled = false;
try {
  if (previousOutput) {
    await rename(outputRoot, backupRoot);
    previousMoved = true;
  }
  if (previousRegistry) {
    await rename(registryPath, registryBackup);
    registryMoved = true;
  }
  if (previousPublicList) {
    await rename(publicListPath, publicListBackup);
    publicListMoved = true;
  }
  await rename(stagingRoot, outputRoot);
  stagedInstalled = true;
  await rename(registryTemporary, registryPath);
  registryInstalled = true;
  await rename(publicListTemporary, publicListPath);
  publicListInstalled = true;
} catch (error) {
  const rollbackErrors = [];
  const attempt = async (action) => {
    try {
      await action();
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
  };
  if (stagedInstalled) await attempt(() => rm(outputRoot, { recursive: true, force: true }));
  if (registryInstalled) await attempt(() => rm(registryPath, { force: true }));
  if (publicListInstalled) await attempt(() => rm(publicListPath, { force: true }));
  if (previousMoved) await attempt(() => rename(backupRoot, outputRoot));
  if (registryMoved) await attempt(() => rename(registryBackup, registryPath));
  if (publicListMoved) await attempt(() => rename(publicListBackup, publicListPath));
  await attempt(() => rm(stagingRoot, { recursive: true, force: true }));
  await attempt(() => rm(registryTemporary, { force: true }));
  await attempt(() => rm(publicListTemporary, { force: true }));
  if (rollbackErrors.length) {
    throw new AggregateError([error, ...rollbackErrors], 'Artwork publication failed and rollback was incomplete.');
  }
  throw error;
}
const cleanup = [];
if (previousMoved) cleanup.push(rm(backupRoot, { recursive: true, force: true }));
if (registryMoved) cleanup.push(rm(registryBackup, { force: true }));
if (publicListMoved) cleanup.push(rm(publicListBackup, { force: true }));
for (const result of await Promise.allSettled(cleanup)) {
  if (result.status === 'rejected') console.warn(`Artwork backup cleanup deferred: ${result.reason?.message || result.reason}`);
}

console.log(`Artwork prepared: ${items.length}/${required.length} assets (${manifest.coverage.cards} cards, ${manifest.coverage.scenes} scenes, ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MiB, revision ${revision}${missing.length ? ', partial' : ''}).`);
