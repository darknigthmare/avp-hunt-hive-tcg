import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(root, '..', 'art-originals');
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
const REQUIRED_REVIEW_CHECKS = Object.freeze([
  'decodedPng',
  'compositionApproved',
  'visualInspectionPassed',
  'noTextLogoOrWatermark',
  'originalFanMadeDirection',
  'noOfficialAssetOrActorLikeness',
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

function safeName(name) {
  if (!/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.(?:png|webp)$/.test(name) || basename(name) !== name) {
    throw new Error(`Unsafe artwork filename: ${name}`);
  }
  return name;
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
  })),
  ...SCENES.map(([id, sourceName, width, height, alt]) => ({
    id,
    kind: 'scene',
    sourceName: safeName(sourceName),
    outputName: safeName(sourceName.replace(/\.png$/, '.webp')),
    width,
    height,
    alt,
  })),
];

let review;
try {
  review = JSON.parse(await readFile(resolve(sourceRoot, 'review.json'), 'utf8'));
} catch {
  throw new Error('Explicit artwork review is missing or invalid. Run npm run review:art -- --approve --reviewer "Name" after visual QA.');
}
if (
  review.schema !== 'avp-art-review-v1' ||
  review.version !== '1.0.0-art.2' ||
  review.expected?.cards !== expectedCardCount ||
  review.expected?.scenes !== SCENES.length ||
  review.expected?.total !== required.length ||
  !/^[a-f0-9]{64}$/.test(review.revision) ||
  typeof review.approvedAt !== 'string' ||
  Number.isNaN(Date.parse(review.approvedAt)) ||
  typeof review.reviewer !== 'string' ||
  !review.reviewer.trim() ||
  REQUIRED_REVIEW_CHECKS.some((check) => review.checklist?.[check] !== true) ||
  !Array.isArray(review.items) ||
  review.items.length !== required.length
) {
  throw new Error('Explicit artwork review is incomplete or incompatible.');
}
const reviewed = new Map();
for (const item of review.items) {
  const key = `${item.kind}:${item.id}`;
  if (
    reviewed.has(key) ||
    !['card', 'scene'].includes(item.kind) ||
    typeof item.sourceName !== 'string' ||
    !/^[a-f0-9]{64}$/.test(item.sourceSha256) ||
    !Number.isInteger(item.bytes) ||
    !Number.isInteger(item.width) ||
    !Number.isInteger(item.height) ||
    item.provider !== 'openai-imagegen' ||
    item.approved !== true ||
    REQUIRED_REVIEW_CHECKS.some((check) => item.checks?.[check] !== true) ||
    !['card-v1-original-biopunk', 'scene-v1-original-biopunk'].includes(item.promptProfile)
  ) {
    throw new Error(`Invalid explicit artwork approval: ${item?.id || 'unknown'}`);
  }
  reviewed.set(key, item);
}
const requiredReviewKeys = new Set(required.map((item) => `${item.kind}:${item.id}`));
if (reviewed.size !== requiredReviewKeys.size || [...reviewed.keys()].some((key) => !requiredReviewKeys.has(key))) {
  throw new Error('Explicit artwork review IDs do not match the release contract.');
}
const computedReviewRevision = sha256(Buffer.from(
  [
    `schema:${review.schema}`,
    `version:${review.version}`,
    `approvedAt:${review.approvedAt}`,
    `reviewer:${review.reviewer}`,
    ...REQUIRED_REVIEW_CHECKS.map((check) => `check:${check}:${review.checklist[check]}`),
    ...[...reviewed.values()]
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id))
      .map((item) => `${item.kind}:${item.id}:${item.sourceName}:${item.sourceSha256}:${item.bytes}:${item.width}x${item.height}:${item.provider}:${item.promptProfile}:approved=${item.approved}`),
  ].join('\n'),
));
if (computedReviewRevision !== review.revision) throw new Error('Explicit artwork review revision mismatch.');

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
      promptProfile: approval.promptProfile,
      alt: item.alt,
      ...(item.card ? { card: item.card } : {}),
    });
  }

  items.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  revision = sha256(Buffer.from(items.map((item) => `${item.id}:${item.sha256}`).join('\n'))).slice(0, 16);
  manifest = {
    schema: 'avp-openai-art-v1',
    version: '1.0.0-art.2',
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
