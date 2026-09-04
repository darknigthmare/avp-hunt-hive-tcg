import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { lstat, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve, sep } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const REVIEW_SCHEMA = 'avp-art-review-v2';
const REVIEW_VERSION = '1.0.0-art.3';
const LEDGER_SCHEMA = 'avp-art-fidelity-ledger-v1';
const BRIEFS_SCHEMA = 'avp-art-fidelity-briefs-v1';
const PROFILES_SCHEMA = 'avp-morphology-profiles-v1';
const MAP_SCHEMA = 'avp-asset-fidelity-map-v1';
const CONTRACT_SCHEMA = 'avp-art-fidelity-contract-v1';
const CONTRACT_VERSION = '1.0.0';
const FIDELITY_THRESHOLD = 95;
const MAX_CYCLE_ATTEMPTS = 6;
const REVIEW_CHECKLIST = Object.freeze({
  decodedPng: true,
  compositionApproved: true,
  visualInspectionPassed: true,
  noTextLogoOrWatermark: true,
  originalFanMadeDirection: true,
  noOfficialAssetOrActorLikeness: true,
  canonicalMorphologyFidelityPassed: true,
  provenancePromptComplete: true,
  retryPolicySatisfied: true,
});

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
  throw new Error('Artwork review is an explicit release action. Re-run with --approve after the private fidelity ledger passes visual QA.');
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(root, '..', 'art-originals');
const ledgerPath = resolve(sourceRoot, 'fidelity-ledger.json');
const briefsPath = resolve(sourceRoot, 'fidelity-briefs.json');
const profilesPath = resolve(root, 'art-direction', 'avp-morphology-profiles.v1.json');
const mapPath = resolve(root, 'art-direction', 'avp-asset-fidelity-map.v1.json');
const contractPath = resolve(root, 'art-direction', 'avp-art-fidelity-contract.v1.json');
const reviewPath = resolve(sourceRoot, 'review.json');
const reviewTemporary = `${reviewPath}.tmp-${process.pid}`;
const reviewBackup = `${reviewPath}.backup-${process.pid}`;
const run = promisify(execFile);

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

function isoDate(value) {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function digest(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function score(value, minimum = 0) {
  return Number.isFinite(value) && value >= minimum && value <= 100;
}

function safeAttemptName(value) {
  return typeof value === 'string' && value.length <= 128 && basename(value) === value && /^[a-z0-9][a-z0-9_.-]*\.png$/.test(value);
}

function validateStringList(values, label, { requireValues = false } = {}) {
  if (!Array.isArray(values) || (requireValues && values.length === 0) || values.some((value) => !safeText(value))) {
    throw new Error(`${label} must be ${requireValues ? 'a non-empty' : 'a'} printable string list.`);
  }
}

function normalizeSecondaryProfiles(values, label) {
  const normalized = values ?? [];
  validateStringList(normalized, label);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} contains duplicate profile ids.`);
  return [...normalized];
}

function sameProfiles(left, right) {
  return left.length === right.length &&
    [...left].sort().every((profile, index) => profile === [...right].sort()[index]);
}

function validateAnchorResult(anchors, requiredIds, label, requirePass) {
  if (!anchors || typeof anchors !== 'object' || Array.isArray(anchors)) {
    throw new Error(`${label} must contain anchor results.`);
  }
  const actual = Object.keys(anchors).sort();
  const expected = [...requiredIds].sort();
  if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
    throw new Error(`${label} does not cover exactly the required morphology anchors.`);
  }
  for (const id of actual) {
    if (typeof anchors[id] !== 'boolean' || (requirePass && anchors[id] !== true)) {
      throw new Error(`${label} has an invalid morphology anchor result: ${id}`);
    }
  }
}

function validateCompliance(compliance, label, requirePass) {
  if (!compliance || typeof compliance !== 'object' || Array.isArray(compliance)) {
    throw new Error(`${label} has no protected-material assessment.`);
  }
  for (const field of ['originalComposition', 'officialImageInputUsed', 'actorLikeness', 'officialLogoTextOrWatermark']) {
    if (typeof compliance[field] !== 'boolean') throw new Error(`${label} has an invalid compliance result: ${field}`);
  }
  if (compliance.officialImageInputUsed !== false) {
    throw new Error(`${label} used an official image as generation input, which is never permitted.`);
  }
  if (requirePass && (
    compliance.originalComposition !== true ||
    compliance.actorLikeness !== false ||
    compliance.officialLogoTextOrWatermark !== false
  )) {
    throw new Error(`${label} violates the protected-material release gate.`);
  }
}

function validateDimensionScores(values, dimensions, label) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error(`${label} has no dimension scores.`);
  const actual = Object.keys(values).sort();
  const expected = dimensions.map((dimension) => dimension.id).sort();
  if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
    throw new Error(`${label} does not score exactly the contract dimensions.`);
  }
  for (const id of actual) {
    if (!Number.isInteger(values[id]) || !score(values[id])) throw new Error(`${label} has an invalid score for ${id}.`);
  }
  return dimensions.reduce((total, dimension) => total + values[dimension.id] * dimension.weight, 0) / 100;
}

async function loadJsonFile(path, label, allowedRoot) {
  const info = await lstat(path).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
  if (!info || !info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is missing or unsafe.`);
  const canonical = await realpath(path);
  const canonicalRoot = await realpath(allowedRoot);
  if (canonical !== canonicalRoot && !canonical.startsWith(`${canonicalRoot}${sep}`)) throw new Error(`${label} escapes its trusted root.`);
  const bytes = await readFile(canonical);
  try {
    return { parsed: JSON.parse(bytes.toString('utf8')), bytes };
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

if (
  cliArgs.filter((argument) => argument === '--reviewer').length !== 1 ||
  !safeText(reviewer, 80) ||
  reviewer.startsWith('--')
) {
  throw new Error('Artwork review requires one explicit --reviewer name (1-80 printable characters).');
}

try {
  await run(process.execPath, [
    resolve(root, 'scripts', 'validate-art-fidelity.mjs'),
    '--release',
    '--contract', contractPath,
    '--profiles', profilesPath,
    '--map', mapPath,
    '--briefs', briefsPath,
    '--ledger', ledgerPath,
    '--json',
  ], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
} catch (error) {
  const detail = String(error?.stderr || error?.stdout || error?.message || error).trim();
  throw new Error(`Private fidelity release validation failed before review: ${detail}`);
}

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  throw new Error('Sharp is required to review artwork. Set NODE_PATH to a trusted Sharp installation.');
}

const { parsed: contract, bytes: contractBytes } = await loadJsonFile(contractPath, 'Artwork fidelity contract', root);
if (
  contract.schema !== CONTRACT_SCHEMA ||
  contract.version !== CONTRACT_VERSION ||
  contract.scoring?.minimumAcceptedScore !== FIDELITY_THRESHOLD ||
  contract.scoring?.minimumDimensionScore !== 90 ||
  contract.scoring?.maximumScore !== 100 ||
  contract.scoring?.rounding !== 'none' ||
  contract.retryPolicy?.maximumAttemptsPerBriefRevision !== MAX_CYCLE_ATTEMPTS ||
  !Array.isArray(contract.scoring?.dimensions) ||
  !Array.isArray(contract.hardFails)
) {
  throw new Error('Artwork fidelity contract is incomplete or incompatible.');
}
const dimensions = contract.scoring.dimensions;
const dimensionIds = new Set();
let totalWeight = 0;
for (const dimension of dimensions) {
  if (
    !dimension ||
    !safeText(dimension.id, 120) ||
    dimensionIds.has(dimension.id) ||
    !Number.isInteger(dimension.weight) ||
    dimension.weight <= 0 ||
    !safeText(dimension.requirement)
  ) {
    throw new Error(`Invalid scoring dimension: ${dimension?.id || 'unknown'}`);
  }
  dimensionIds.add(dimension.id);
  totalWeight += dimension.weight;
}
if (totalWeight !== 100) throw new Error('Artwork fidelity dimension weights must total 100.');
const hardFailIds = new Set();
for (const hardFail of contract.hardFails) {
  if (!hardFail || !safeText(hardFail.id, 120) || hardFailIds.has(hardFail.id) || !safeText(hardFail.requirement)) {
    throw new Error(`Invalid hard-fail definition: ${hardFail?.id || 'unknown'}`);
  }
  hardFailIds.add(hardFail.id);
}

const { parsed: profileRegistry, bytes: profileBytes } = await loadJsonFile(profilesPath, 'Morphology profile registry', root);
if (profileRegistry.schema !== PROFILES_SCHEMA || profileRegistry.version !== CONTRACT_VERSION || !Array.isArray(profileRegistry.profiles)) {
  throw new Error('Morphology profile registry is incompatible.');
}
const profileFiles = [{ name: basename(profilesPath), parsed: profileRegistry, bytes: profileBytes }];
const extensionNames = profileRegistry.extensions ?? [];
if (!Array.isArray(extensionNames) || extensionNames.some((name) => !/^[a-z0-9][a-z0-9.-]*\.json$/.test(name) || basename(name) !== name)) {
  throw new Error('Morphology profile extension list is unsafe.');
}
for (const extensionName of extensionNames) {
  if (profileFiles.some((file) => file.name === extensionName)) throw new Error(`Duplicate morphology profile extension: ${extensionName}`);
  const extension = await loadJsonFile(resolve(dirname(profilesPath), extensionName), `Morphology profile extension ${extensionName}`, root);
  if (
    extension.parsed?.schema !== 'avp-morphology-profile-extension-v1' ||
    extension.parsed?.version !== CONTRACT_VERSION ||
    extension.parsed?.baseRegistry !== `${PROFILES_SCHEMA}@${CONTRACT_VERSION}` ||
    !Array.isArray(extension.parsed?.profiles)
  ) {
    throw new Error(`Morphology profile extension is incompatible: ${extensionName}`);
  }
  profileFiles.push({ name: extensionName, ...extension });
}
const profileBundleSha256 = sha256(Buffer.from(profileFiles
  .map((file) => `${file.name}:${sha256(file.bytes)}`)
  .sort()
  .join('\n')));
const profileDefinitions = new Map();
for (const profile of profileFiles.flatMap((file) => file.parsed.profiles)) {
  if (
    !profile ||
    !safeText(profile.id, 120) ||
    profileDefinitions.has(profile.id) ||
    !Array.isArray(profile.requiredAnchors) ||
    (profile.requiredAnchors.length === 0 && !safeText(profile.baseProfile, 120))
  ) {
    throw new Error(`Invalid or duplicate morphology profile: ${profile?.id || 'unknown'}`);
  }
  const anchorIds = new Set();
  for (const anchor of profile.requiredAnchors) {
    if (
      !anchor ||
      !safeText(anchor.id, 120) ||
      anchorIds.has(anchor.id) ||
      !safeText(anchor.label, 240) ||
      !safeText(anchor.requirement) ||
      !dimensionIds.has(anchor.scoreDimension)
    ) {
      throw new Error(`Invalid morphology anchor in profile ${profile.id}.`);
    }
    anchorIds.add(anchor.id);
  }
  profileDefinitions.set(profile.id, { profile, ownAnchorIds: [...anchorIds] });
}
const profiles = new Map();
function resolveProfile(profileId, chain = []) {
  if (profiles.has(profileId)) return profiles.get(profileId);
  const definition = profileDefinitions.get(profileId);
  if (!definition) throw new Error(`Unknown morphology base profile: ${profileId}`);
  if (chain.includes(profileId)) throw new Error(`Morphology profile inheritance cycle: ${[...chain, profileId].join(' -> ')}`);
  const inherited = definition.profile.baseProfile
    ? resolveProfile(definition.profile.baseProfile, [...chain, profileId])
    : [];
  const combined = [...inherited, ...definition.ownAnchorIds];
  if (new Set(combined).size !== combined.length) throw new Error(`Morphology profile anchor collision: ${profileId}`);
  const resolved = Object.freeze(combined);
  profiles.set(profileId, resolved);
  return resolved;
}
for (const profileId of profileDefinitions.keys()) resolveProfile(profileId);

const { parsed: assetMap, bytes: mapBytes } = await loadJsonFile(mapPath, 'Canonical asset fidelity map', root);
if (
  assetMap.schema !== MAP_SCHEMA ||
  assetMap.version !== CONTRACT_VERSION ||
  assetMap.expected?.cards !== 158 ||
  assetMap.expected?.scenes !== 16 ||
  assetMap.expected?.total !== 174 ||
  !Array.isArray(assetMap.assets) ||
  assetMap.assets.length !== 174
) {
  throw new Error('Canonical asset fidelity map is incomplete or incompatible.');
}
const mapByKey = new Map();
const mappedSourceNames = new Set();
for (const mapped of assetMap.assets) {
  const key = `${mapped?.kind}:${mapped?.id}`;
  const secondaryProfiles = normalizeSecondaryProfiles(mapped?.secondaryProfiles, `Mapped asset ${mapped?.id || 'unknown'} secondaryProfiles`);
  if (
    mapByKey.has(key) ||
    !['card', 'scene'].includes(mapped?.kind) ||
    !safeText(mapped?.id, 120) ||
    !safeAttemptName(mapped?.sourceName) ||
    mappedSourceNames.has(mapped.sourceName) ||
    !safeText(mapped?.profile, 120) ||
    !profiles.has(mapped.profile) ||
    secondaryProfiles.some((profile) => !profiles.has(profile)) ||
    new Set([mapped.profile, ...secondaryProfiles]).size !== secondaryProfiles.length + 1
  ) {
    throw new Error(`Invalid canonical asset mapping: ${mapped?.id || 'unknown'}`);
  }
  mappedSourceNames.add(mapped.sourceName);
  mapByKey.set(key, { ...mapped, secondaryProfiles });
}
if (
  mapByKey.size !== 174 ||
  [...mapByKey.values()].filter(({ kind }) => kind === 'card').length !== 158 ||
  [...mapByKey.values()].filter(({ kind }) => kind === 'scene').length !== 16
) {
  throw new Error('Canonical asset fidelity map identities do not match the 174-asset release.');
}

const { parsed: briefs, bytes: briefsBytes } = await loadJsonFile(briefsPath, 'Private fidelity briefs', sourceRoot);
if (briefs.schema !== BRIEFS_SCHEMA || briefs.version !== CONTRACT_VERSION || !Array.isArray(briefs.assets)) {
  throw new Error('Private fidelity briefs are incompatible.');
}
const requiredPromptSections = contract.briefPolicy?.requiredPromptSections;
if (!Array.isArray(requiredPromptSections) || requiredPromptSections.length === 0 || new Set(requiredPromptSections).size !== requiredPromptSections.length) {
  throw new Error('Artwork fidelity contract has an invalid prompt section list.');
}
const briefsByKey = new Map();
const briefAnchorsByKey = new Map();
for (const brief of briefs.assets.filter((asset) => asset?.active === true)) {
  const key = `${brief.kind}:${brief.id}`;
  const secondaryProfiles = brief.secondaryProfiles ?? [];
  const briefProfiles = [brief.profile, ...(Array.isArray(secondaryProfiles) ? secondaryProfiles : [])];
  const promptKeys = brief.prompt && typeof brief.prompt === 'object' && !Array.isArray(brief.prompt)
    ? Object.keys(brief.prompt).sort()
    : [];
  const expectedPromptKeys = [...requiredPromptSections].sort();
  if (
    briefsByKey.has(key) ||
    !['card', 'scene'].includes(brief.kind) ||
    !safeText(brief.id, 120) ||
    !safeText(brief.profile, 120) ||
    !Array.isArray(secondaryProfiles) ||
    secondaryProfiles.some((profile) => !safeText(profile, 120)) ||
    new Set(briefProfiles).size !== briefProfiles.length ||
    briefProfiles.some((profile) => !profiles.has(profile)) ||
    !Number.isInteger(brief.briefRevision) ||
    brief.briefRevision < 1 ||
    !safeText(brief.subject) ||
    !Array.isArray(brief.requiredAnchors) ||
    brief.requiredAnchors.some((id) => !safeText(id, 120)) ||
    promptKeys.length !== expectedPromptKeys.length ||
    promptKeys.some((id, index) => id !== expectedPromptKeys[index]) ||
    promptKeys.some((id) => !safeText(brief.prompt[id], 8_000)) ||
    !safeText(brief.negativePrompt, 8_000) ||
    brief.originalCompositionRequired !== true ||
    brief.officialImageInputUsed !== false ||
    brief.actorLikenessRequested !== false ||
    !digest(brief.promptSha256)
  ) {
    throw new Error(`Invalid active fidelity brief: ${brief?.id || 'unknown'}`);
  }
  const mapped = mapByKey.get(key);
  if (
    !mapped ||
    brief.profile !== mapped.profile ||
    !sameProfiles(secondaryProfiles, mapped.secondaryProfiles) ||
    (brief.sourceName !== undefined && brief.sourceName !== mapped.sourceName)
  ) {
    throw new Error(`Active fidelity brief does not match canonical mapping: ${brief.id}`);
  }
  const expectedAnchors = briefProfiles.flatMap((profile) => profiles.get(profile)).sort();
  if (new Set(expectedAnchors).size !== expectedAnchors.length) {
    throw new Error(`Fidelity brief ${brief.id} has colliding profile anchors.`);
  }
  const actualAnchors = [...brief.requiredAnchors].sort();
  if (actualAnchors.length !== expectedAnchors.length || actualAnchors.some((id, index) => id !== expectedAnchors[index])) {
    throw new Error(`Fidelity brief ${brief.id} does not cover exactly its profile anchors.`);
  }
  const computedPromptSha256 = sha256(Buffer.from(stableJson({
    prompt: brief.prompt,
    negativePrompt: brief.negativePrompt,
  })));
  if (brief.promptSha256 !== computedPromptSha256) throw new Error(`Fidelity brief prompt hash mismatch: ${brief.id}`);
  briefsByKey.set(key, brief);
  briefAnchorsByKey.set(key, Object.freeze(expectedAnchors));
}

function validateAttemptHistory(entry, requiredAnchorIds, brief) {
  if (!Array.isArray(entry.attempts) || entry.attempts.length === 0) {
    throw new Error(`Fidelity ledger item ${entry.id} has no accepted attempt history.`);
  }
  let previous;
  for (let index = 0; index < entry.attempts.length; index += 1) {
    const attempt = entry.attempts[index];
    const label = `Fidelity ledger item ${entry.id}, attempt ${index + 1}`;
    if (
      !attempt ||
      typeof attempt !== 'object' ||
      attempt.attempt !== index + 1 ||
      !Number.isInteger(attempt.briefRevision) ||
      attempt.briefRevision < 1 ||
      !Number.isInteger(attempt.cycleAttempt) ||
      attempt.cycleAttempt < 1 ||
      attempt.cycleAttempt > MAX_CYCLE_ATTEMPTS ||
      !isoDate(attempt.createdAt) ||
      attempt.provider !== 'openai-imagegen' ||
      !safeAttemptName(attempt.sourceName) ||
      !digest(attempt.sourceSha256) ||
      !digest(attempt.promptSha256) ||
      !score(attempt.score) ||
      attempt.promptComplete !== true ||
      !['accepted', 'rejected'].includes(attempt.decision) ||
      !safeText(attempt.reviewer, 80) ||
      !isoDate(attempt.reviewedAt)
    ) {
      throw new Error(`${label} is incomplete or invalid.`);
    }
    validateAnchorResult(attempt.anchors, requiredAnchorIds, label, attempt.decision === 'accepted');
    validateStringList(attempt.hardFails, `${label} hardFails`);
    if (attempt.hardFails.some((id) => !hardFailIds.has(id))) throw new Error(`${label} names an unknown hard fail.`);
    validateStringList(attempt.rejectionReasons, `${label} rejectionReasons`, { requireValues: attempt.decision === 'rejected' });
    validateCompliance(attempt.compliance, label, attempt.decision === 'accepted');
    const computedScore = validateDimensionScores(attempt.dimensionScores, dimensions, label);
    if (Math.abs(computedScore - attempt.score) > 1e-9) throw new Error(`${label} weighted score mismatch.`);
    if (attempt.decision === 'accepted') {
      if (
        index !== entry.attempts.length - 1 ||
        attempt.score < FIDELITY_THRESHOLD ||
        Object.values(attempt.dimensionScores).some((value) => value < contract.scoring.minimumDimensionScore) ||
        attempt.hardFails.length !== 0 ||
        attempt.rejectionReasons.length !== 0
      ) {
        throw new Error(`${label} cannot be accepted below the strict fidelity gate.`);
      }
    } else if (!safeText(attempt.correctiveAction)) {
      throw new Error(`${label} requires a concrete correctiveAction before retrying.`);
    }
    if (!previous) {
      if (attempt.briefRevision !== 1 || attempt.cycleAttempt !== 1) {
        throw new Error(`${label} must start at briefRevision 1, cycleAttempt 1.`);
      }
    } else if (previous.cycleAttempt < MAX_CYCLE_ATTEMPTS) {
      if (attempt.briefRevision !== previous.briefRevision || attempt.cycleAttempt !== previous.cycleAttempt + 1) {
        throw new Error(`${label} breaks the sequential retry policy.`);
      }
    } else if (attempt.briefRevision !== previous.briefRevision + 1 || attempt.cycleAttempt !== 1) {
      throw new Error(`${label} requires a revised brief after six rejected attempts.`);
    }
    previous = attempt;
  }

  const accepted = entry.attempts.at(-1);
  const rejectedCount = entry.attempts.filter((attempt) => attempt.decision === 'rejected').length;
  if (
    accepted.decision !== 'accepted' ||
    accepted.briefRevision !== brief.briefRevision ||
    accepted.promptSha256 !== brief.promptSha256 ||
    entry.acceptedAttempt !== accepted.attempt ||
    entry.retryCount !== rejectedCount ||
    entry.decision !== accepted.decision ||
    entry.score !== accepted.score ||
    entry.sourceName !== accepted.sourceName ||
    entry.sourceSha256 !== accepted.sourceSha256 ||
    entry.promptSha256 !== accepted.promptSha256 ||
    entry.promptComplete !== true ||
    !Array.isArray(entry.hardFails) ||
    entry.hardFails.length !== 0 ||
    stableJson(entry.anchors) !== stableJson(accepted.anchors)
  ) {
    throw new Error(`Fidelity ledger item ${entry.id} does not mirror its accepted attempt and active brief.`);
  }
  return accepted;
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
    promptProfile: 'card-v2-canon-morphology-original-composition',
  })),
  ...SCENES.map(([id, sourceName]) => ({
    id,
    kind: 'scene',
    sourceName,
    directory: 'scenes',
    promptProfile: 'scene-v2-canon-morphology-original-composition',
  })),
];
for (const item of required) {
  if (!/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.png$/.test(item.sourceName) || basename(item.sourceName) !== item.sourceName) {
    throw new Error(`Unsafe review filename: ${item.sourceName}`);
  }
}
const requiredKeys = new Set(required.map((item) => `${item.kind}:${item.id}`));
if (
  briefsByKey.size !== required.length ||
  [...briefsByKey.keys()].some((key) => !requiredKeys.has(key))
) {
  throw new Error('Active fidelity brief IDs do not match the 174-asset release contract.');
}
if (
  mapByKey.size !== required.length ||
  [...mapByKey.keys()].some((key) => !requiredKeys.has(key)) ||
  required.some((item) => mapByKey.get(`${item.kind}:${item.id}`)?.sourceName !== item.sourceName)
) {
  throw new Error('Canonical asset map identities or source names do not match the 174-asset release contract.');
}

const { parsed: ledger, bytes: ledgerBytes } = await loadJsonFile(ledgerPath, 'Private fidelity ledger', sourceRoot);
if (ledger.schema !== LEDGER_SCHEMA || ledger.version !== CONTRACT_VERSION || !Array.isArray(ledger.assets)) {
  throw new Error('Private fidelity ledger is incompatible.');
}
const activeLedgerAssets = ledger.assets.filter((asset) => asset?.active === true);
if (activeLedgerAssets.length !== required.length) {
  throw new Error(`Private fidelity ledger must contain exactly ${required.length} active assets.`);
}
const ledgerByKey = new Map();
for (const entry of activeLedgerAssets) {
  const key = `${entry.kind}:${entry.id}`;
  const brief = briefsByKey.get(key);
  const mapped = mapByKey.get(key);
  const secondaryProfiles = normalizeSecondaryProfiles(entry?.secondaryProfiles, `Fidelity ledger item ${entry?.id || 'unknown'} secondaryProfiles`);
  const briefSecondaryProfiles = brief?.secondaryProfiles ?? [];
  if (
    ledgerByKey.has(key) ||
    !brief ||
    !mapped ||
    !['card', 'scene'].includes(entry.kind) ||
    !safeText(entry.id, 120) ||
    entry.active !== true ||
    entry.decision !== 'accepted' ||
    !safeText(entry.profile, 120) ||
    entry.profile !== brief.profile ||
    entry.profile !== mapped.profile ||
    !sameProfiles(secondaryProfiles, briefSecondaryProfiles) ||
    !sameProfiles(secondaryProfiles, mapped.secondaryProfiles) ||
    !safeText(entry.continuity, 240) ||
    !safeText(entry.canonTarget, 500) ||
    !safeText(entry.referenceBasis, 4_000) ||
    !safeAttemptName(entry.sourceName) ||
    entry.sourceName !== mapped.sourceName ||
    !digest(entry.sourceSha256) ||
    !digest(entry.promptSha256) ||
    !score(entry.score, FIDELITY_THRESHOLD) ||
    !Number.isInteger(entry.retryCount) ||
    entry.retryCount < 0 ||
    !Number.isInteger(entry.acceptedAttempt)
  ) {
    throw new Error(`Invalid active fidelity ledger item: ${entry?.id || 'unknown'}`);
  }
  const anchorIds = briefAnchorsByKey.get(key);
  validateAnchorResult(entry.anchors, anchorIds, `Fidelity ledger item ${entry.id}`, true);
  const acceptedAttempt = validateAttemptHistory(entry, anchorIds, brief);
  ledgerByKey.set(key, { entry: { ...entry, secondaryProfiles }, acceptedAttempt });
}
if (ledgerByKey.size !== requiredKeys.size || [...ledgerByKey.keys()].some((key) => !requiredKeys.has(key))) {
  throw new Error('Active fidelity ledger IDs do not match the 174-asset release contract.');
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
  const approval = ledgerByKey.get(`${item.kind}:${item.id}`);
  if (!approval || approval.entry.sourceName !== item.sourceName) {
    throw new Error(`Private fidelity ledger does not approve the required master: ${item.id}`);
  }
  const source = resolve(sourceRoot, item.directory, item.sourceName);
  const sourceInfo = await lstat(source);
  const canonical = await realpath(source);
  const info = await stat(canonical);
  if (sourceInfo.isSymbolicLink() || !canonical.startsWith(`${canonicalRoot}${sep}`) || !info.isFile() || info.size === 0) {
    throw new Error(`Unsafe or empty artwork master: ${item.id}`);
  }
  const bytes = await readFile(canonical);
  const sourceSha256 = sha256(bytes);
  if (approval.entry.sourceSha256 !== sourceSha256) throw new Error(`Fidelity ledger master hash mismatch: ${item.id}`);
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
  const entry = approval.entry;
  const acceptedAttempt = approval.acceptedAttempt;
  items.push({
    id: item.id,
    kind: item.kind,
    sourceName: item.sourceName,
    sourceSha256,
    bytes: bytes.length,
    width: metadata.width,
    height: metadata.height,
    provider: acceptedAttempt.provider,
    promptProfile: item.promptProfile,
    profile: entry.profile,
    secondaryProfiles: entry.secondaryProfiles,
    active: true,
    decision: entry.decision,
    score: entry.score,
    dimensionScores: acceptedAttempt.dimensionScores,
    retryCount: entry.retryCount,
    acceptedAttempt: entry.acceptedAttempt,
    promptSha256: entry.promptSha256,
    promptComplete: entry.promptComplete,
    continuity: entry.continuity,
    canonTarget: entry.canonTarget,
    referenceBasis: entry.referenceBasis,
    anchors: entry.anchors,
    hardFails: entry.hardFails,
    compliance: acceptedAttempt.compliance,
    attempts: entry.attempts,
    approved: true,
    checks: { ...REVIEW_CHECKLIST },
  });
}

items.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
const scoreValues = items.map((item) => item.score);
const profileCounts = Object.fromEntries([...new Set(items.map((item) => item.profile))]
  .sort()
  .map((profile) => [profile, items.filter((item) => item.profile === profile).length]));
const minimumDimensionScores = Object.fromEntries(dimensions.map((dimension) => [
  dimension.id,
  Math.min(...items.map((item) => item.dimensionScores[dimension.id])),
]));
const approvedAt = new Date().toISOString();
const unsignedReview = {
  schema: REVIEW_SCHEMA,
  version: REVIEW_VERSION,
  approvedAt,
  reviewer,
  checklist: { ...REVIEW_CHECKLIST },
  expected: { cards: 158, scenes: 16, total: 174 },
  contract: {
    schema: contract.schema,
    version: contract.version,
    sha256: sha256(contractBytes),
  },
  profiles: {
    schema: profileRegistry.schema,
    version: profileRegistry.version,
    sha256: profileBundleSha256,
    files: profileFiles.length,
  },
  map: {
    schema: assetMap.schema,
    version: assetMap.version,
    sha256: sha256(mapBytes),
    activeAssets: mapByKey.size,
  },
  briefs: {
    schema: briefs.schema,
    version: briefs.version,
    sha256: sha256(briefsBytes),
    activeAssets: briefsByKey.size,
  },
  ledger: {
    schema: ledger.schema,
    version: ledger.version,
    sha256: sha256(ledgerBytes),
    activeAssets: activeLedgerAssets.length,
  },
  fidelity: {
    threshold: FIDELITY_THRESHOLD,
    minimumDimensionScore: contract.scoring.minimumDimensionScore,
    accepted: items.length,
    promptComplete: items.filter((item) => item.promptComplete).length,
    hardFailures: items.reduce((total, item) => total + item.hardFails.length, 0),
    minimumScore: Math.min(...scoreValues),
    averageScore: Number((scoreValues.reduce((total, value) => total + value, 0) / scoreValues.length).toFixed(2)),
    minimumDimensionScores,
    retryCount: items.reduce((total, item) => total + item.retryCount, 0),
    maximumRetryCount: Math.max(...items.map((item) => item.retryCount)),
    profiles: profileCounts,
  },
  items,
};
const revision = sha256(Buffer.from(stableJson(unsignedReview)));
const review = { ...unsignedReview, revision };

const previousReview = await lstat(reviewPath).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
if (previousReview && (!previousReview.isFile() || previousReview.isSymbolicLink())) {
  throw new Error('Unsafe existing private artwork review.');
}
await rm(reviewTemporary, { force: true });
await rm(reviewBackup, { force: true });
let previousMoved = false;
let reviewInstalled = false;
try {
  await writeFile(reviewTemporary, `${JSON.stringify(review, null, 2)}\n`, { flag: 'wx' });
  if (previousReview) {
    await rename(reviewPath, reviewBackup);
    previousMoved = true;
  }
  await rename(reviewTemporary, reviewPath);
  reviewInstalled = true;
} catch (error) {
  if (reviewInstalled) await rm(reviewPath, { force: true }).catch(() => {});
  await rm(reviewTemporary, { force: true }).catch(() => {});
  if (previousMoved) await rename(reviewBackup, reviewPath).catch(() => {});
  throw error;
}
if (previousMoved) {
  await rm(reviewBackup, { force: true }).catch((error) => {
    console.warn(`Artwork review backup cleanup deferred: ${error.message}`);
  });
}
console.log(`Strict artwork review recorded: ${items.length}/174 accepted masters, fidelity >= ${FIDELITY_THRESHOLD}, revision ${revision.slice(0, 16)}.`);
