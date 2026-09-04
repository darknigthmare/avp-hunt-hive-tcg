import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

const DEFAULTS = Object.freeze({
  contract: path.join(REPO_ROOT, 'art-direction', 'avp-art-fidelity-contract.v1.json'),
  profiles: path.join(REPO_ROOT, 'art-direction', 'avp-morphology-profiles.v1.json'),
  map: path.join(REPO_ROOT, 'art-direction', 'avp-asset-fidelity-map.v1.json'),
  briefs: path.resolve(REPO_ROOT, '..', 'art-originals', 'fidelity-briefs.json'),
  ledger: path.resolve(REPO_ROOT, '..', 'art-originals', 'fidelity-ledger.json')
});

const EXPECTED = Object.freeze({
  contractSchema: 'avp-art-fidelity-contract-v1',
  contractVersion: '1.0.0',
  profilesSchema: 'avp-morphology-profiles-v1',
  profilesVersion: '1.0.0',
  mapSchema: 'avp-asset-fidelity-map-v1',
  mapVersion: '1.0.0',
  briefsSchema: 'avp-art-fidelity-briefs-v1',
  ledgerSchema: 'avp-art-fidelity-ledger-v1'
});

function usage() {
  return `Usage:
  node scripts/validate-art-fidelity.mjs --contract-only [--contract FILE] [--profiles FILE] [--map FILE]
  node scripts/validate-art-fidelity.mjs [--contract FILE] [--profiles FILE] [--map FILE] [--briefs FILE] [--ledger FILE]
  node scripts/validate-art-fidelity.mjs --release [--briefs FILE] [--ledger FILE]

Modes:
  --contract-only  Validate the public contract, profile bundle and canonical asset map only.
  --release        Require the complete private briefs and ledger and exactly 174 active accepted assets.
  default          Validate contract, profiles, briefs and ledger without enforcing the 174-asset count.

Options:
  --contract FILE  Override the public contract path.
  --profiles FILE  Override the morphology registry path.
  --map FILE       Override the canonical asset fidelity map path.
  --briefs FILE    Override the private generation briefs path.
  --ledger FILE    Override the private review ledger path.
  --json           Print the result as JSON.
  --help            Show this help.
`;
}

function parseArgs(argv) {
  const options = {
    contractOnly: false,
    release: false,
    json: false,
    help: false,
    ...DEFAULTS
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--contract-only') options.contractOnly = true;
    else if (arg === '--release') options.release = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (['--contract', '--profiles', '--map', '--briefs', '--ledger'].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a file path.`);
      options[arg.slice(2)] = path.resolve(process.cwd(), value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.contractOnly && options.release) {
    throw new Error('--contract-only and --release are mutually exclusive.');
  }

  return options;
}

async function readJson(filePath, errors, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${label} (${filePath}): ${error.message}`);
    return null;
  }
}

async function readProfileRegistry(filePath, errors) {
  const registry = await readJson(filePath, errors, 'profiles');
  if (!isObject(registry)) return registry;
  if (registry.extensions === undefined) return registry;
  if (!Array.isArray(registry.extensions) || !registry.extensions.every(isNonEmptyString)) {
    pushError(errors, 'profiles.extensions', 'must be an array of extension filenames.');
    return registry;
  }
  const mergedProfiles = Array.isArray(registry.profiles) ? [...registry.profiles] : [];
  const seen = new Set();
  for (const [index, filename] of registry.extensions.entries()) {
    if (path.basename(filename) !== filename || filename.includes('..')) {
      pushError(errors, `profiles.extensions[${index}]`, 'must be a safe filename in the registry directory.');
      continue;
    }
    if (seen.has(filename)) {
      pushError(errors, `profiles.extensions[${index}]`, 'must not repeat an extension filename.');
      continue;
    }
    seen.add(filename);
    const extensionPath = path.join(path.dirname(filePath), filename);
    const extension = await readJson(extensionPath, errors, `profiles extension ${filename}`);
    if (!isObject(extension)) continue;
    if (extension.schema !== 'avp-morphology-profile-extension-v1') {
      pushError(errors, `profiles extension ${filename}.schema`, 'must equal avp-morphology-profile-extension-v1.');
    }
    if (extension.version !== EXPECTED.profilesVersion) {
      pushError(errors, `profiles extension ${filename}.version`, `must equal ${EXPECTED.profilesVersion}.`);
    }
    if (extension.baseRegistry !== `${EXPECTED.profilesSchema}@${EXPECTED.profilesVersion}`) {
      pushError(errors, `profiles extension ${filename}.baseRegistry`, `must equal ${EXPECTED.profilesSchema}@${EXPECTED.profilesVersion}.`);
    }
    if (!Array.isArray(extension.profiles)) {
      pushError(errors, `profiles extension ${filename}.profiles`, 'must be an array.');
      continue;
    }
    mergedProfiles.push(...extension.profiles);
  }
  return { ...registry, profiles: mergedProfiles };
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isScore(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function isSafeSourceName(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value);
}

function isIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function sortedUniqueStrings(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function sameStringSet(left, right) {
  return JSON.stringify(sortedUniqueStrings(left)) === JSON.stringify(sortedUniqueStrings(right));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isObject(value)) {
    const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function pushError(errors, location, message) {
  errors.push(`${location}: ${message}`);
}

function requireKeys(value, keys, errors, location) {
  if (!isObject(value)) {
    pushError(errors, location, 'must be an object.');
    return false;
  }
  for (const key of keys) {
    if (!(key in value)) pushError(errors, `${location}.${key}`, 'is required.');
  }
  return true;
}

function validateContract(contract, errors) {
  if (!isObject(contract)) return null;
  if (contract.schema !== EXPECTED.contractSchema) {
    pushError(errors, 'contract.schema', `must equal ${EXPECTED.contractSchema}.`);
  }
  if (contract.version !== EXPECTED.contractVersion) {
    pushError(errors, 'contract.version', `must equal ${EXPECTED.contractVersion}.`);
  }
  if (contract.schemas?.profiles !== EXPECTED.profilesSchema) {
    pushError(errors, 'contract.schemas.profiles', `must equal ${EXPECTED.profilesSchema}.`);
  }
  if (contract.schemas?.briefs !== EXPECTED.briefsSchema) {
    pushError(errors, 'contract.schemas.briefs', `must equal ${EXPECTED.briefsSchema}.`);
  }
  if (contract.schemas?.ledger !== EXPECTED.ledgerSchema) {
    pushError(errors, 'contract.schemas.ledger', `must equal ${EXPECTED.ledgerSchema}.`);
  }

  const scoring = contract.scoring;
  if (!isObject(scoring)) {
    pushError(errors, 'contract.scoring', 'must be an object.');
    return null;
  }
  if (scoring.minimumAcceptedScore !== 95) {
    pushError(errors, 'contract.scoring.minimumAcceptedScore', 'must equal the immutable 95/100 release threshold.');
  }
  if (scoring.minimumDimensionScore !== 90) {
    pushError(errors, 'contract.scoring.minimumDimensionScore', 'must equal the immutable 90/100 per-dimension floor.');
  }
  if (scoring.maximumScore !== 100) {
    pushError(errors, 'contract.scoring.maximumScore', 'must equal 100.');
  }
  if (scoring.thresholdMayNotBeLowered !== true) {
    pushError(errors, 'contract.scoring.thresholdMayNotBeLowered', 'must be true.');
  }

  const dimensions = Array.isArray(scoring.dimensions) ? scoring.dimensions : [];
  if (dimensions.length === 0) pushError(errors, 'contract.scoring.dimensions', 'must not be empty.');
  const dimensionIds = [];
  let totalWeight = 0;
  for (const [index, dimension] of dimensions.entries()) {
    const location = `contract.scoring.dimensions[${index}]`;
    if (!isObject(dimension)) {
      pushError(errors, location, 'must be an object.');
      continue;
    }
    if (!isNonEmptyString(dimension.id)) pushError(errors, `${location}.id`, 'must be a non-empty string.');
    else dimensionIds.push(dimension.id);
    if (!Number.isInteger(dimension.weight) || dimension.weight <= 0) {
      pushError(errors, `${location}.weight`, 'must be a positive integer.');
    } else totalWeight += dimension.weight;
    if (!isNonEmptyString(dimension.requirement)) pushError(errors, `${location}.requirement`, 'must be a non-empty string.');
  }
  if (new Set(dimensionIds).size !== dimensionIds.length) {
    pushError(errors, 'contract.scoring.dimensions', 'dimension ids must be unique.');
  }
  if (totalWeight !== 100) {
    pushError(errors, 'contract.scoring.dimensions', `weights must total 100, received ${totalWeight}.`);
  }

  const hardFails = Array.isArray(contract.hardFails) ? contract.hardFails : [];
  const hardFailIds = [];
  for (const [index, hardFail] of hardFails.entries()) {
    const location = `contract.hardFails[${index}]`;
    if (!isObject(hardFail) || !isNonEmptyString(hardFail.id) || !isNonEmptyString(hardFail.requirement)) {
      pushError(errors, location, 'must contain non-empty id and requirement strings.');
      continue;
    }
    hardFailIds.push(hardFail.id);
  }
  const mandatoryHardFails = [
    'official-image-input',
    'copied-official-composition',
    'actor-likeness',
    'official-branding',
    'missing-required-anchor',
    'wrong-subject-family',
    'anatomical-generation-error'
  ];
  for (const id of mandatoryHardFails) {
    if (!hardFailIds.includes(id)) pushError(errors, 'contract.hardFails', `missing mandatory hard fail ${id}.`);
  }
  if (new Set(hardFailIds).size !== hardFailIds.length) {
    pushError(errors, 'contract.hardFails', 'hard-fail ids must be unique.');
  }

  const originality = contract.originalityAndSafety;
  const requiredSafety = {
    originalCompositionRequired: true,
    officialImageInputAllowed: false,
    actorLikenessAllowed: false,
    officialLogoTextOrWatermarkAllowed: false
  };
  for (const [key, expected] of Object.entries(requiredSafety)) {
    if (originality?.[key] !== expected) {
      pushError(errors, `contract.originalityAndSafety.${key}`, `must equal ${expected}.`);
    }
  }

  const retry = contract.retryPolicy;
  if (retry?.retryRequiredAfterAnyRejection !== true) pushError(errors, 'contract.retryPolicy.retryRequiredAfterAnyRejection', 'must be true.');
  if (retry?.maximumAttemptsPerBriefRevision !== 6) pushError(errors, 'contract.retryPolicy.maximumAttemptsPerBriefRevision', 'must equal 6.');
  if (retry?.thresholdReductionAllowed !== false) pushError(errors, 'contract.retryPolicy.thresholdReductionAllowed', 'must be false.');
  if (retry?.anchorWaiverAllowed !== false) pushError(errors, 'contract.retryPolicy.anchorWaiverAllowed', 'must be false.');
  if (retry?.historyMayBeDeleted !== false) pushError(errors, 'contract.retryPolicy.historyMayBeDeleted', 'must be false.');

  const release = contract.releaseGate;
  if (release?.expectedActiveAcceptedAssets !== 174) pushError(errors, 'contract.releaseGate.expectedActiveAcceptedAssets', 'must equal 174.');
  if (release?.expectedByKind?.card !== 158 || release?.expectedByKind?.scene !== 16) {
    pushError(errors, 'contract.releaseGate.expectedByKind', 'must require 158 cards and 16 scenes.');
  }
  if (release?.allActiveMustBeAccepted !== true) pushError(errors, 'contract.releaseGate.allActiveMustBeAccepted', 'must be true.');
  if (release?.requireCompleteAttemptHistory !== true) pushError(errors, 'contract.releaseGate.requireCompleteAttemptHistory', 'must be true.');

  return {
    dimensionIds,
    dimensionWeights: Object.fromEntries(dimensions.map(({ id, weight }) => [id, weight])),
    hardFailIds,
    minimumScore: scoring.minimumAcceptedScore,
    minimumDimensionScore: scoring.minimumDimensionScore,
    maxAttemptsPerBrief: retry?.maximumAttemptsPerBriefRevision,
    release
  };
}

function validateProfiles(registry, contractInfo, errors) {
  if (!isObject(registry) || !contractInfo) return null;
  if (registry.schema !== EXPECTED.profilesSchema) pushError(errors, 'profiles.schema', `must equal ${EXPECTED.profilesSchema}.`);
  if (registry.version !== EXPECTED.profilesVersion) pushError(errors, 'profiles.version', `must equal ${EXPECTED.profilesVersion}.`);
  if (registry.contract !== `${EXPECTED.contractSchema}@${EXPECTED.contractVersion}`) {
    pushError(errors, 'profiles.contract', `must equal ${EXPECTED.contractSchema}@${EXPECTED.contractVersion}.`);
  }

  const profiles = Array.isArray(registry.profiles) ? registry.profiles : [];
  if (profiles.length === 0) pushError(errors, 'profiles.profiles', 'must not be empty.');
  const byId = new Map();
  for (const [index, profile] of profiles.entries()) {
    const location = `profiles.profiles[${index}]`;
    if (!isObject(profile)) {
      pushError(errors, location, 'must be an object.');
      continue;
    }
    if (!isNonEmptyString(profile.id)) {
      pushError(errors, `${location}.id`, 'must be a non-empty string.');
      continue;
    }
    if (byId.has(profile.id)) pushError(errors, `${location}.id`, `duplicate profile id ${profile.id}.`);
    else byId.set(profile.id, { profile, location });
    if (!isNonEmptyString(profile.family)) pushError(errors, `${location}.family`, 'must be a non-empty string.');
    if (!isNonEmptyString(profile.label)) pushError(errors, `${location}.label`, 'must be a non-empty string.');
    if (profile.baseProfile !== undefined && !isNonEmptyString(profile.baseProfile)) {
      pushError(errors, `${location}.baseProfile`, 'must be a non-empty profile id when provided.');
    }
    const anchors = Array.isArray(profile.requiredAnchors) ? profile.requiredAnchors : [];
    if (anchors.length === 0 && profile.baseProfile === undefined) {
      pushError(errors, `${location}.requiredAnchors`, 'a root profile must define at least one required anchor.');
    }
    const localIds = [];
    for (const [anchorIndex, anchor] of anchors.entries()) {
      const anchorLocation = `${location}.requiredAnchors[${anchorIndex}]`;
      if (!isObject(anchor) || !isNonEmptyString(anchor.id) || !isNonEmptyString(anchor.label) || !isNonEmptyString(anchor.requirement)) {
        pushError(errors, anchorLocation, 'must contain non-empty id, label and requirement strings.');
        continue;
      }
      localIds.push(anchor.id);
      if (!contractInfo.dimensionIds.includes(anchor.scoreDimension)) {
        pushError(errors, `${anchorLocation}.scoreDimension`, `must reference one of: ${contractInfo.dimensionIds.join(', ')}.`);
      }
    }
    if (new Set(localIds).size !== localIds.length) pushError(errors, `${location}.requiredAnchors`, 'local anchor ids must be unique.');
    if (!Array.isArray(profile.forbiddenDrift) || profile.forbiddenDrift.length === 0 || !profile.forbiddenDrift.every(isNonEmptyString)) {
      pushError(errors, `${location}.forbiddenDrift`, 'must be a non-empty array of non-empty strings.');
    }
    if (!Array.isArray(profile.promptDirectives) || profile.promptDirectives.length === 0 || !profile.promptDirectives.every(isNonEmptyString)) {
      pushError(errors, `${location}.promptDirectives`, 'must be a non-empty array of non-empty strings.');
    }
  }

  const resolved = new Map();
  function resolve(profileId, chain = []) {
    if (resolved.has(profileId)) return resolved.get(profileId);
    const record = byId.get(profileId);
    if (!record) return null;
    if (chain.includes(profileId)) {
      pushError(errors, `${record.location}.baseProfile`, `inheritance cycle: ${[...chain, profileId].join(' -> ')}.`);
      return null;
    }
    const profile = record.profile;
    let inherited = [];
    if (profile.baseProfile !== undefined) {
      if (!byId.has(profile.baseProfile)) {
        pushError(errors, `${record.location}.baseProfile`, `unknown profile ${profile.baseProfile}.`);
      } else {
        inherited = resolve(profile.baseProfile, [...chain, profileId])?.anchors ?? [];
      }
    }
    const own = Array.isArray(profile.requiredAnchors) ? profile.requiredAnchors : [];
    const combined = [...inherited, ...own];
    const combinedIds = combined.map(({ id }) => id);
    if (new Set(combinedIds).size !== combinedIds.length) {
      pushError(errors, `${record.location}.requiredAnchors`, 'resolved anchors collide with an inherited anchor id.');
    }
    const value = { profile, anchors: combined };
    resolved.set(profileId, value);
    return value;
  }

  for (const id of byId.keys()) resolve(id);

  const requiredFamilies = ['xenomorph', 'yautja', 'engineer', 'hybrid', 'human', 'object', 'place', 'scene', 'original'];
  const families = new Set([...byId.values()].map(({ profile }) => profile.family));
  for (const family of requiredFamilies) {
    if (!families.has(family)) pushError(errors, 'profiles.profiles', `missing required family ${family}.`);
  }

  const requiredProfiles = [
    'xenomorph.standard', 'xenomorph.ovomorph', 'xenomorph.big-chap', 'xenomorph.drone', 'xenomorph.warrior',
    'xenomorph.grid', 'xenomorph.red', 'xenomorph.queen', 'xenomorph.queen-mother', 'xenomorph.flying-queen',
    'xenomorph.facehugger', 'xenomorph.chestburster', 'xenomorph.runner', 'xenomorph.gorilla', 'xenomorph.bull',
    'xenomorph.mantis', 'xenomorph.snake', 'xenomorph.popper', 'xenomorph.warden', 'xenomorph.siren',
    'yautja.hunter', 'yautja.unmasked', 'yautja.jungle-hunter', 'yautja.city-hunter', 'yautja.scar',
    'yautja.celtic', 'yautja.chopper', 'yautja.wolf', 'yautja.berserker', 'yautja.falconer',
    'yautja.tracker', 'yautja.feral', 'yautja.ahab', 'engineer.humanoid', 'engineer.space-jockey-fossil',
    'hybrid.predalien', 'hybrid.neomorph', 'hybrid.deacon', 'hybrid.newborn', 'hybrid.white-hybrid',
    'hybrid.alien-king', 'human.original-character', 'object.faction-equipment', 'place.biomechanical',
    'place.human-industrial', 'scene.multi-subject-original'
  ];
  for (const id of requiredProfiles) {
    if (!byId.has(id)) pushError(errors, 'profiles.profiles', `missing required profile ${id}.`);
  }

  return { byId, resolved };
}

function validateMap(assetMap, contractInfo, profileInfo, errors) {
  if (!isObject(assetMap) || !contractInfo || !profileInfo) return null;
  if (assetMap.schema !== EXPECTED.mapSchema) pushError(errors, 'map.schema', `must equal ${EXPECTED.mapSchema}.`);
  if (assetMap.version !== EXPECTED.mapVersion) pushError(errors, 'map.version', `must equal ${EXPECTED.mapVersion}.`);
  const expected = contractInfo.release?.expectedByKind;
  if (
    assetMap.expected?.card !== undefined ||
    assetMap.expected?.scene !== undefined ||
    assetMap.expected?.cards !== expected?.card ||
    assetMap.expected?.scenes !== expected?.scene ||
    assetMap.expected?.total !== contractInfo.release?.expectedActiveAcceptedAssets
  ) {
    pushError(errors, 'map.expected', `must declare exactly ${expected?.card} cards, ${expected?.scene} scenes and ${contractInfo.release?.expectedActiveAcceptedAssets} total assets.`);
  }

  const assets = Array.isArray(assetMap.assets) ? assetMap.assets : [];
  const byKey = new Map();
  const sourceNames = new Set();
  for (const [index, asset] of assets.entries()) {
    const location = `map.assets[${index}]`;
    if (!isObject(asset)) {
      pushError(errors, location, 'must be an object.');
      continue;
    }
    if (!isNonEmptyString(asset.id)) pushError(errors, `${location}.id`, 'must be a non-empty string.');
    if (!['card', 'scene'].includes(asset.kind)) pushError(errors, `${location}.kind`, 'must be card or scene.');
    if (!isNonEmptyString(asset.subject)) pushError(errors, `${location}.subject`, 'must be a non-empty string.');
    if (!['P0', 'P1', 'P2'].includes(asset.priority)) pushError(errors, `${location}.priority`, 'must be P0, P1 or P2.');
    if (!isNonEmptyString(asset.profile) || !profileInfo.resolved.has(asset.profile)) {
      pushError(errors, `${location}.profile`, `must name a resolved morphology profile, received ${asset.profile ?? 'missing'}.`);
    }
    const secondaryProfiles = asset.secondaryProfiles === undefined ? [] : asset.secondaryProfiles;
    if (!Array.isArray(secondaryProfiles) || !secondaryProfiles.every(isNonEmptyString)) {
      pushError(errors, `${location}.secondaryProfiles`, 'must be an array of non-empty profile ids when provided.');
    }
    const profileIds = [asset.profile, ...(Array.isArray(secondaryProfiles) ? secondaryProfiles : [])];
    if (new Set(profileIds).size !== profileIds.length) pushError(errors, `${location}.secondaryProfiles`, 'profile ids must not repeat.');
    for (const profileId of profileIds) {
      if (!profileInfo.resolved.has(profileId)) pushError(errors, `${location}.secondaryProfiles`, `unknown or invalid profile ${profileId}.`);
    }
    if (
      !isSafeSourceName(asset.sourceName) ||
      !/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.png$/.test(asset.sourceName)
    ) {
      pushError(errors, `${location}.sourceName`, 'must be a safe canonical vN PNG basename.');
    } else if (sourceNames.has(asset.sourceName)) {
      pushError(errors, `${location}.sourceName`, `duplicates canonical source name ${asset.sourceName}.`);
    } else {
      sourceNames.add(asset.sourceName);
    }
    const key = `${asset.kind}:${asset.id}`;
    if (byKey.has(key)) pushError(errors, location, `duplicates canonical asset identity ${key}.`);
    else byKey.set(key, { ...asset, _secondaryProfiles: Array.isArray(secondaryProfiles) ? [...secondaryProfiles] : [] });
  }

  const cards = [...byKey.values()].filter(({ kind }) => kind === 'card').length;
  const scenes = [...byKey.values()].filter(({ kind }) => kind === 'scene').length;
  if (
    assets.length !== contractInfo.release.expectedActiveAcceptedAssets ||
    byKey.size !== contractInfo.release.expectedActiveAcceptedAssets ||
    cards !== contractInfo.release.expectedByKind.card ||
    scenes !== contractInfo.release.expectedByKind.scene
  ) {
    pushError(errors, 'map.assets', `must contain exactly ${contractInfo.release.expectedByKind.card} unique cards and ${contractInfo.release.expectedByKind.scene} unique scenes.`);
  }
  return { assets, byKey };
}

function expectedAnchorIds(profileIds, profileInfo, errors, location) {
  const ids = [];
  for (const profileId of profileIds) {
    const resolved = profileInfo?.resolved.get(profileId);
    if (!resolved) {
      pushError(errors, location, `unknown or invalid profile ${profileId}.`);
      continue;
    }
    ids.push(...resolved.anchors.map(({ id }) => id));
  }
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    pushError(errors, location, `profile combination has colliding anchor ids: ${sortedUniqueStrings(duplicates).join(', ')}.`);
  }
  return sortedUniqueStrings(ids);
}

function validateBriefs(briefs, contract, contractInfo, profileInfo, mapInfo, errors) {
  if (!isObject(briefs) || !contractInfo || !profileInfo || !mapInfo) return null;
  if (briefs.schema !== EXPECTED.briefsSchema) pushError(errors, 'briefs.schema', `must equal ${EXPECTED.briefsSchema}.`);
  if (briefs.version !== '1.0.0') pushError(errors, 'briefs.version', 'must equal 1.0.0.');
  const assets = Array.isArray(briefs.assets) ? briefs.assets : [];
  const byKey = new Map();
  const requiredFields = contract.briefPolicy?.requiredAssetFields ?? [];
  const requiredPromptSections = contract.briefPolicy?.requiredPromptSections ?? [];

  for (const [index, brief] of assets.entries()) {
    const location = `briefs.assets[${index}]`;
    requireKeys(brief, requiredFields, errors, location);
    if (!isObject(brief)) continue;
    if (!isNonEmptyString(brief.id)) pushError(errors, `${location}.id`, 'must be a non-empty string.');
    if (!['card', 'scene'].includes(brief.kind)) pushError(errors, `${location}.kind`, 'must be card or scene.');
    if (brief.active !== true && brief.active !== false) pushError(errors, `${location}.active`, 'must be boolean.');
    if (!isPositiveInteger(brief.briefRevision)) pushError(errors, `${location}.briefRevision`, 'must be a positive integer.');
    if (!isNonEmptyString(brief.subject)) pushError(errors, `${location}.subject`, 'must be a non-empty string.');
    if (!isNonEmptyString(brief.profile)) pushError(errors, `${location}.profile`, 'must be a non-empty string.');
    const secondaryProfiles = brief.secondaryProfiles === undefined ? [] : brief.secondaryProfiles;
    if (!Array.isArray(secondaryProfiles) || !secondaryProfiles.every(isNonEmptyString)) {
      pushError(errors, `${location}.secondaryProfiles`, 'must be an array of non-empty profile ids when provided.');
    }
    const profileIds = [brief.profile, ...(Array.isArray(secondaryProfiles) ? secondaryProfiles : [])];
    if (new Set(profileIds).size !== profileIds.length) pushError(errors, `${location}.secondaryProfiles`, 'profile ids must not repeat.');
    const key = `${brief.kind}:${brief.id}`;
    const mapped = mapInfo.byKey.get(key);
    if (!mapped) {
      pushError(errors, location, `has no matching canonical map identity ${key}.`);
    } else {
      if (brief.profile !== mapped.profile) {
        pushError(errors, `${location}.profile`, `must match mapped profile ${mapped.profile}.`);
      }
      if (
        !Array.isArray(secondaryProfiles) ||
        secondaryProfiles.length !== mapped._secondaryProfiles.length ||
        !sameStringSet(secondaryProfiles, mapped._secondaryProfiles)
      ) {
        pushError(errors, `${location}.secondaryProfiles`, `must match mapped secondaryProfiles for ${key}.`);
      }
      if (brief.sourceName !== undefined && brief.sourceName !== mapped.sourceName) {
        pushError(errors, `${location}.sourceName`, `must match mapped sourceName ${mapped.sourceName} when present.`);
      }
    }
    const expectedAnchors = expectedAnchorIds(profileIds, profileInfo, errors, `${location}.profile`);
    if (!Array.isArray(brief.requiredAnchors) || !brief.requiredAnchors.every(isNonEmptyString)) {
      pushError(errors, `${location}.requiredAnchors`, 'must be an array of anchor ids.');
    } else if (!sameStringSet(brief.requiredAnchors, expectedAnchors) || brief.requiredAnchors.length !== expectedAnchors.length) {
      pushError(errors, `${location}.requiredAnchors`, `must contain exactly the resolved profile anchors: ${expectedAnchors.join(', ')}.`);
    }
    if (!isObject(brief.prompt)) {
      pushError(errors, `${location}.prompt`, 'must be an object with all required prompt sections.');
    } else {
      for (const section of requiredPromptSections) {
        if (!isNonEmptyString(brief.prompt[section])) pushError(errors, `${location}.prompt.${section}`, 'must be a non-empty string.');
      }
    }
    if (!isNonEmptyString(brief.negativePrompt)) pushError(errors, `${location}.negativePrompt`, 'must be a non-empty string.');
    if (brief.originalCompositionRequired !== true) pushError(errors, `${location}.originalCompositionRequired`, 'must be true.');
    if (brief.officialImageInputUsed !== false) pushError(errors, `${location}.officialImageInputUsed`, 'must be false.');
    if (brief.actorLikenessRequested !== false) pushError(errors, `${location}.actorLikenessRequested`, 'must be false.');
    if (brief.acceptanceThreshold !== undefined && brief.acceptanceThreshold < contractInfo.minimumScore) {
      pushError(errors, `${location}.acceptanceThreshold`, `may not be lower than ${contractInfo.minimumScore}.`);
    }
    const computedPromptSha = sha256(stableStringify({ prompt: brief.prompt, negativePrompt: brief.negativePrompt }));
    if (!isSha256(brief.promptSha256)) pushError(errors, `${location}.promptSha256`, 'must be a lowercase SHA-256 hash.');
    else if (brief.promptSha256 !== computedPromptSha) pushError(errors, `${location}.promptSha256`, `does not match canonical prompt hash ${computedPromptSha}.`);

    if (byKey.has(key) && brief.active === true && byKey.get(key).active === true) {
      pushError(errors, location, `duplicates active brief ${key}.`);
    }
    if (brief.active === true || !byKey.has(key)) byKey.set(key, { ...brief, _expectedAnchors: expectedAnchors, _computedPromptSha: computedPromptSha });
  }
  for (const key of mapInfo.byKey.keys()) {
    if (byKey.get(key)?.active !== true) pushError(errors, 'briefs.assets', `canonical map asset ${key} has no active brief.`);
  }
  for (const [key, brief] of byKey.entries()) {
    if (brief.active === true && !mapInfo.byKey.has(key)) pushError(errors, 'briefs.assets', `active brief ${key} is absent from the canonical map.`);
  }
  return { assets, byKey };
}

function weightedScore(dimensionScores, contractInfo) {
  return contractInfo.dimensionIds.reduce(
    (total, id) => total + dimensionScores[id] * contractInfo.dimensionWeights[id] / 100,
    0
  );
}

function validateCompliance(compliance, errors, location, requireFullPass) {
  if (!isObject(compliance)) {
    pushError(errors, location, 'must be an object.');
    return false;
  }
  const keys = ['originalComposition', 'officialImageInputUsed', 'actorLikeness', 'officialLogoTextOrWatermark'];
  for (const key of keys) {
    if (typeof compliance[key] !== 'boolean') pushError(errors, `${location}.${key}`, 'must be boolean.');
  }
  if (compliance.officialImageInputUsed !== false) {
    pushError(errors, `${location}.officialImageInputUsed`, 'must always be false; official imagery may never be supplied to generation.');
  }
  const passed = compliance.originalComposition === true
    && compliance.officialImageInputUsed === false
    && compliance.actorLikeness === false
    && compliance.officialLogoTextOrWatermark === false;
  if (requireFullPass && !passed) pushError(errors, location, 'all compliance gates must pass for an accepted attempt.');
  return passed;
}

function validateAnchorMap(anchors, expectedAnchors, errors, location, requireAllTrue) {
  if (!isObject(anchors)) {
    pushError(errors, location, 'must be an object keyed by required anchor id.');
    return false;
  }
  const keys = Object.keys(anchors);
  if (!sameStringSet(keys, expectedAnchors) || keys.length !== expectedAnchors.length) {
    pushError(errors, location, `must contain exactly: ${expectedAnchors.join(', ')}.`);
  }
  let allTrue = true;
  for (const id of expectedAnchors) {
    if (typeof anchors[id] !== 'boolean') {
      pushError(errors, `${location}.${id}`, 'must be boolean.');
      allTrue = false;
    } else if (anchors[id] !== true) {
      allTrue = false;
      if (requireAllTrue) pushError(errors, `${location}.${id}`, 'must be true for an accepted attempt.');
    }
  }
  return allTrue;
}

function validateDimensionScores(scores, contractInfo, errors, location) {
  if (!isObject(scores)) {
    pushError(errors, location, 'must be an object keyed by scoring dimension.');
    return null;
  }
  const keys = Object.keys(scores);
  if (!sameStringSet(keys, contractInfo.dimensionIds) || keys.length !== contractInfo.dimensionIds.length) {
    pushError(errors, location, `must contain exactly: ${contractInfo.dimensionIds.join(', ')}.`);
  }
  let valid = true;
  for (const id of contractInfo.dimensionIds) {
    if (!Number.isInteger(scores[id]) || !isScore(scores[id])) {
      pushError(errors, `${location}.${id}`, 'must be an integer from 0 through 100.');
      valid = false;
    }
  }
  return valid ? weightedScore(scores, contractInfo) : null;
}

function validateAttempt(attempt, context) {
  const { contractInfo, expectedAnchors, hardFailIds, errors, location } = context;
  const required = [
    'attempt', 'briefRevision', 'cycleAttempt', 'createdAt', 'provider', 'sourceName', 'sourceSha256',
    'promptSha256', 'dimensionScores', 'score', 'anchors', 'hardFails', 'compliance', 'promptComplete',
    'decision', 'rejectionReasons', 'reviewer', 'reviewedAt'
  ];
  requireKeys(attempt, required, errors, location);
  if (!isObject(attempt)) return null;
  if (!isPositiveInteger(attempt.attempt)) pushError(errors, `${location}.attempt`, 'must be a positive integer.');
  if (!isPositiveInteger(attempt.briefRevision)) pushError(errors, `${location}.briefRevision`, 'must be a positive integer.');
  if (!isPositiveInteger(attempt.cycleAttempt) || attempt.cycleAttempt > contractInfo.maxAttemptsPerBrief) {
    pushError(errors, `${location}.cycleAttempt`, `must be from 1 through ${contractInfo.maxAttemptsPerBrief}.`);
  }
  if (!isIsoDate(attempt.createdAt)) pushError(errors, `${location}.createdAt`, 'must be an ISO-compatible date.');
  if (attempt.provider !== 'openai-imagegen') pushError(errors, `${location}.provider`, 'must equal openai-imagegen.');
  if (!isSafeSourceName(attempt.sourceName)) pushError(errors, `${location}.sourceName`, 'must be a safe basename using only letters, digits, dot, underscore or hyphen.');
  if (!isSha256(attempt.sourceSha256)) pushError(errors, `${location}.sourceSha256`, 'must be a lowercase SHA-256 hash.');
  if (!isSha256(attempt.promptSha256)) pushError(errors, `${location}.promptSha256`, 'must be a lowercase SHA-256 hash.');
  const computedScore = validateDimensionScores(attempt.dimensionScores, contractInfo, errors, `${location}.dimensionScores`);
  if (!isScore(attempt.score)) pushError(errors, `${location}.score`, 'must be from 0 through 100.');
  else if (computedScore !== null && Math.abs(attempt.score - computedScore) > 1e-9) {
    pushError(errors, `${location}.score`, `must equal weighted score ${computedScore}.`);
  }
  const allAnchors = validateAnchorMap(attempt.anchors, expectedAnchors, errors, `${location}.anchors`, attempt.decision === 'accepted');
  if (!Array.isArray(attempt.hardFails) || !attempt.hardFails.every(isNonEmptyString)) {
    pushError(errors, `${location}.hardFails`, 'must be an array of hard-fail ids.');
  } else {
    for (const id of attempt.hardFails) {
      if (!hardFailIds.includes(id)) pushError(errors, `${location}.hardFails`, `unknown hard-fail id ${id}.`);
    }
    if (new Set(attempt.hardFails).size !== attempt.hardFails.length) pushError(errors, `${location}.hardFails`, 'must not contain duplicates.');
  }
  const compliancePassed = validateCompliance(attempt.compliance, errors, `${location}.compliance`, attempt.decision === 'accepted');
  if (typeof attempt.promptComplete !== 'boolean') pushError(errors, `${location}.promptComplete`, 'must be boolean.');
  if (!['accepted', 'rejected'].includes(attempt.decision)) pushError(errors, `${location}.decision`, 'must be accepted or rejected.');
  if (!Array.isArray(attempt.rejectionReasons) || !attempt.rejectionReasons.every(isNonEmptyString)) {
    pushError(errors, `${location}.rejectionReasons`, 'must be an array of non-empty strings.');
  }
  if (!isNonEmptyString(attempt.reviewer)) pushError(errors, `${location}.reviewer`, 'must be a non-empty string.');
  if (!isIsoDate(attempt.reviewedAt)) pushError(errors, `${location}.reviewedAt`, 'must be an ISO-compatible date.');

  const hardFailsEmpty = Array.isArray(attempt.hardFails) && attempt.hardFails.length === 0;
  const passes = computedScore !== null
    && computedScore >= contractInfo.minimumScore
    && contractInfo.dimensionIds.every((id) => attempt.dimensionScores[id] >= contractInfo.minimumDimensionScore)
    && allAnchors
    && hardFailsEmpty
    && compliancePassed
    && attempt.promptComplete === true;
  if (attempt.decision === 'accepted' && !passes) {
    pushError(errors, `${location}.decision`, `cannot be accepted below ${contractInfo.minimumScore}, with a failed anchor, hard fail, compliance failure or incomplete prompt.`);
  }
  if (attempt.decision === 'rejected' && (!Array.isArray(attempt.rejectionReasons) || attempt.rejectionReasons.length === 0)) {
    pushError(errors, `${location}.rejectionReasons`, 'must explain every rejected attempt.');
  }
  if (attempt.decision === 'rejected' && !isNonEmptyString(attempt.correctiveAction)) {
    pushError(errors, `${location}.correctiveAction`, 'must describe the targeted correction before retrying.');
  }
  if (attempt.decision === 'accepted' && Array.isArray(attempt.rejectionReasons) && attempt.rejectionReasons.length > 0) {
    pushError(errors, `${location}.rejectionReasons`, 'must be empty for an accepted attempt.');
  }
  return { passes, computedScore };
}

function validateLedger(ledger, contract, contractInfo, profileInfo, mapInfo, briefInfo, errors, warnings, releaseMode) {
  if (!isObject(ledger) || !contractInfo || !profileInfo || !mapInfo || !briefInfo) return null;
  if (ledger.schema !== EXPECTED.ledgerSchema) pushError(errors, 'ledger.schema', `must equal ${EXPECTED.ledgerSchema}.`);
  if (ledger.version !== '1.0.0') pushError(errors, 'ledger.version', 'must equal 1.0.0.');
  const assets = Array.isArray(ledger.assets) ? ledger.assets : [];
  const requiredFields = contract.ledgerPolicy?.requiredAssetFields ?? [];
  const activeByKey = new Map();
  const acceptedHashes = new Map();

  for (const [index, asset] of assets.entries()) {
    const location = `ledger.assets[${index}]`;
    requireKeys(asset, requiredFields, errors, location);
    if (!isObject(asset)) continue;
    if (!isNonEmptyString(asset.id)) pushError(errors, `${location}.id`, 'must be a non-empty string.');
    if (!['card', 'scene'].includes(asset.kind)) pushError(errors, `${location}.kind`, 'must be card or scene.');
    if (asset.active !== true && asset.active !== false) pushError(errors, `${location}.active`, 'must be boolean.');
    if (!isNonEmptyString(asset.profile)) pushError(errors, `${location}.profile`, 'must be a non-empty string.');
    if (!isSafeSourceName(asset.sourceName)) pushError(errors, `${location}.sourceName`, 'must be a safe basename using only letters, digits, dot, underscore or hyphen.');
    if (!isSha256(asset.sourceSha256)) pushError(errors, `${location}.sourceSha256`, 'must be a lowercase SHA-256 hash.');
    if (!['accepted', 'rejected', 'pending'].includes(asset.decision)) pushError(errors, `${location}.decision`, 'must be accepted, rejected or pending.');
    const key = `${asset.kind}:${asset.id}`;
    const mapped = mapInfo.byKey.get(key);
    const brief = briefInfo.byKey.get(key);
    const secondaryProfiles = asset.secondaryProfiles === undefined && asset.decision === 'pending'
      ? (brief?.secondaryProfiles ?? [])
      : (asset.secondaryProfiles ?? []);
    if (!Array.isArray(secondaryProfiles) || !secondaryProfiles.every(isNonEmptyString)) {
      pushError(errors, `${location}.secondaryProfiles`, 'must be an array of non-empty profile ids when provided.');
    }
    if (!mapped) {
      pushError(errors, location, `has no matching canonical map identity ${key}.`);
    } else {
      if (asset.profile !== mapped.profile) pushError(errors, `${location}.profile`, `must match mapped profile ${mapped.profile}.`);
      if (asset.sourceName !== mapped.sourceName) pushError(errors, `${location}.sourceName`, `must match mapped sourceName ${mapped.sourceName}.`);
      if (
        !Array.isArray(secondaryProfiles) ||
        secondaryProfiles.length !== mapped._secondaryProfiles.length ||
        !sameStringSet(secondaryProfiles, mapped._secondaryProfiles)
      ) {
        pushError(errors, `${location}.secondaryProfiles`, `must match mapped secondaryProfiles for ${key}.`);
      }
    }
    if (!brief) pushError(errors, location, `has no matching brief ${key}.`);
    else {
      if (asset.profile !== brief.profile) pushError(errors, `${location}.profile`, `must match brief profile ${brief.profile}.`);
      const briefSecondaryProfiles = brief.secondaryProfiles ?? [];
      if (
        !Array.isArray(secondaryProfiles) ||
        secondaryProfiles.length !== briefSecondaryProfiles.length ||
        !sameStringSet(secondaryProfiles, briefSecondaryProfiles)
      ) {
        pushError(errors, `${location}.secondaryProfiles`, 'must match the active brief secondaryProfiles.');
      }
    }
    const expectedAnchors = brief?._expectedAnchors ?? expectedAnchorIds([asset.profile], profileInfo, errors, `${location}.profile`);

    const attempts = Array.isArray(asset.attempts) ? asset.attempts : [];
    if (asset.decision !== 'pending' && attempts.length === 0) pushError(errors, `${location}.attempts`, 'accepted and rejected entries must retain at least one attempt.');
    if (asset.decision === 'pending' && attempts.length !== 0) pushError(errors, `${location}.attempts`, 'a migration-pending entry must have an empty attempt history until it is reviewed.');
    let previous = null;
    let rejectedCount = 0;
    let acceptedCount = 0;
    for (const [attemptIndex, attempt] of attempts.entries()) {
      const attemptLocation = `${location}.attempts[${attemptIndex}]`;
      validateAttempt(attempt, {
        contractInfo,
        expectedAnchors,
        hardFailIds: contractInfo.hardFailIds,
        errors,
        location: attemptLocation
      });
      if (!isObject(attempt)) continue;
      if (attempt.attempt !== attemptIndex + 1) pushError(errors, `${attemptLocation}.attempt`, `must equal sequential value ${attemptIndex + 1}.`);
      if (attempt.decision === 'rejected') rejectedCount += 1;
      if (attempt.decision === 'accepted') acceptedCount += 1;
      if (attemptIndex < attempts.length - 1 && attempt.decision !== 'rejected') {
        pushError(errors, `${attemptLocation}.decision`, 'every non-final attempt must be rejected; an accepted image cannot be silently replaced inside one active history.');
      }
      if (previous) {
        if (attempt.briefRevision === previous.briefRevision) {
          if (attempt.cycleAttempt !== previous.cycleAttempt + 1) {
            pushError(errors, `${attemptLocation}.cycleAttempt`, 'must increment by one inside the same brief revision.');
          }
          if (attempt.cycleAttempt > contractInfo.maxAttemptsPerBrief) {
            pushError(errors, `${attemptLocation}.cycleAttempt`, 'exceeds retry limit; rewrite the brief instead.');
          }
          if (attempt.promptSha256 !== previous.promptSha256) {
            pushError(errors, `${attemptLocation}.promptSha256`, 'must remain stable inside one brief revision.');
          }
        } else {
          if (attempt.briefRevision !== previous.briefRevision + 1) {
            pushError(errors, `${attemptLocation}.briefRevision`, 'must increment by exactly one when the brief is rewritten.');
          }
          if (attempt.cycleAttempt !== 1) pushError(errors, `${attemptLocation}.cycleAttempt`, 'must reset to 1 after a brief rewrite.');
          if (attempt.promptSha256 === previous.promptSha256) {
            pushError(errors, `${attemptLocation}.promptSha256`, 'must change when briefRevision increases.');
          }
        }
      } else if (attempt.cycleAttempt !== 1) {
        pushError(errors, `${attemptLocation}.cycleAttempt`, 'the first recorded attempt must start at 1.');
      }
      previous = attempt;
    }

    const last = attempts.at(-1);
    if (last) {
      if (asset.decision === 'accepted' && asset.acceptedAttempt !== last.attempt) {
        pushError(errors, `${location}.acceptedAttempt`, 'must point to the final accepted attempt.');
      }
      if (asset.retryCount !== rejectedCount) pushError(errors, `${location}.retryCount`, `must equal rejected attempt count ${rejectedCount}.`);
      const mirrors = ['sourceName', 'sourceSha256', 'promptSha256', 'decision', 'score', 'promptComplete'];
      for (const field of mirrors) {
        if (asset[field] !== last[field]) pushError(errors, `${location}.${field}`, `must mirror the final attempt value.`);
      }
      if (stableStringify(asset.anchors) !== stableStringify(last.anchors)) pushError(errors, `${location}.anchors`, 'must mirror final attempt anchors.');
      if (stableStringify(asset.hardFails) !== stableStringify(last.hardFails)) pushError(errors, `${location}.hardFails`, 'must mirror final attempt hardFails.');
      if (brief && last.briefRevision !== brief.briefRevision) pushError(errors, `${location}.attempts`, 'final attempt briefRevision must match the active brief.');
      if (brief && last.promptSha256 !== brief._computedPromptSha) pushError(errors, `${location}.promptSha256`, 'must match the active brief canonical prompt hash.');
    }
    if (!isPositiveInteger(asset.retryCount) && asset.retryCount !== 0) pushError(errors, `${location}.retryCount`, 'must be a non-negative integer.');
    if (asset.decision === 'accepted') {
      if (!isPositiveInteger(asset.acceptedAttempt)) pushError(errors, `${location}.acceptedAttempt`, 'must be a positive integer.');
      if (!isSha256(asset.promptSha256)) pushError(errors, `${location}.promptSha256`, 'must be a lowercase SHA-256 hash.');
      if (acceptedCount !== 1 || last?.decision !== 'accepted') pushError(errors, `${location}.decision`, 'requires exactly one accepted attempt, in final position.');
      if (asset.score < contractInfo.minimumScore) pushError(errors, `${location}.score`, `must be at least ${contractInfo.minimumScore}.`);
      validateAnchorMap(asset.anchors, expectedAnchors, errors, `${location}.anchors`, true);
      if (!Array.isArray(asset.hardFails) || asset.hardFails.length !== 0) pushError(errors, `${location}.hardFails`, 'must be empty for acceptance.');
      if (asset.promptComplete !== true) pushError(errors, `${location}.promptComplete`, 'must be true for acceptance.');
    } else if (asset.decision === 'rejected') {
      if (asset.acceptedAttempt !== null) pushError(errors, `${location}.acceptedAttempt`, 'must be null for a rejected entry.');
      if (!isSha256(asset.promptSha256)) pushError(errors, `${location}.promptSha256`, 'must be a lowercase SHA-256 hash.');
      if (acceptedCount !== 0 || last?.decision !== 'rejected') pushError(errors, `${location}.decision`, 'requires a complete final rejected attempt and no accepted attempt.');
      warnings.push(`${key} is rejected and requires the recorded corrective action followed by a retry.`);
    } else if (asset.decision === 'pending') {
      if (asset.score !== null) pushError(errors, `${location}.score`, 'must be null while pending.');
      if (asset.acceptedAttempt !== null) pushError(errors, `${location}.acceptedAttempt`, 'must be null while pending.');
      if (asset.retryCount !== 0) pushError(errors, `${location}.retryCount`, 'must equal 0 while pending.');
      if (asset.promptSha256 !== null && !isSha256(asset.promptSha256)) pushError(errors, `${location}.promptSha256`, 'must be null or a lowercase SHA-256 hash while pending.');
      if (asset.promptComplete !== false && asset.promptComplete !== null) pushError(errors, `${location}.promptComplete`, 'must be false or null while pending.');
      if (!isObject(asset.anchors)) pushError(errors, `${location}.anchors`, 'must be an object while pending.');
      if (!Array.isArray(asset.hardFails) || asset.hardFails.length !== 0) pushError(errors, `${location}.hardFails`, 'must be empty before review.');
      warnings.push(`${key} is pending first-pass fidelity review.`);
    }

    if (asset.active === true) {
      if (activeByKey.has(key)) pushError(errors, location, `duplicates active ledger entry ${key}.`);
      else activeByKey.set(key, asset);
      if (asset.decision === 'accepted' && isSha256(asset.sourceSha256)) {
        if (acceptedHashes.has(asset.sourceSha256)) {
          pushError(errors, `${location}.sourceSha256`, `duplicates accepted artwork hash used by ${acceptedHashes.get(asset.sourceSha256)}.`);
        } else acceptedHashes.set(asset.sourceSha256, key);
      }
    }
  }

  for (const [key, brief] of briefInfo.byKey.entries()) {
    if (brief.active === true && !activeByKey.has(key)) pushError(errors, 'ledger.assets', `active brief ${key} has no active ledger entry.`);
  }

  if (releaseMode) {
    const active = [...activeByKey.values()];
    const accepted = active.filter(({ decision }) => decision === 'accepted');
    if (active.length !== contractInfo.release.expectedActiveAcceptedAssets) {
      pushError(errors, 'ledger.assets', `release requires exactly ${contractInfo.release.expectedActiveAcceptedAssets} active assets, received ${active.length}.`);
    }
    if (accepted.length !== active.length) pushError(errors, 'ledger.assets', 'every active release asset must be accepted.');
    for (const [kind, expected] of Object.entries(contractInfo.release.expectedByKind)) {
      const count = accepted.filter((asset) => asset.kind === kind).length;
      if (count !== expected) pushError(errors, 'ledger.assets', `release requires ${expected} accepted ${kind} assets, received ${count}.`);
    }
    const activeBriefCount = [...briefInfo.byKey.values()].filter(({ active }) => active === true).length;
    if (activeBriefCount !== contractInfo.release.expectedActiveAcceptedAssets) {
      pushError(errors, 'briefs.assets', `release requires exactly ${contractInfo.release.expectedActiveAcceptedAssets} active briefs, received ${activeBriefCount}.`);
    }
  }
  return { assets, activeByKey };
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${usage()}`);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const errors = [];
  const warnings = [];
  const contract = await readJson(options.contract, errors, 'contract');
  const contractInfo = validateContract(contract, errors);
  const profiles = await readProfileRegistry(options.profiles, errors);
  const profileInfo = validateProfiles(profiles, contractInfo, errors);
  const assetMap = await readJson(options.map, errors, 'map');
  const mapInfo = validateMap(assetMap, contractInfo, profileInfo, errors);

  let briefInfo = null;
  let ledgerInfo = null;
  if (!options.contractOnly) {
    const briefs = await readJson(options.briefs, errors, 'briefs');
    briefInfo = validateBriefs(briefs, contract, contractInfo, profileInfo, mapInfo, errors);
    const ledger = await readJson(options.ledger, errors, 'ledger');
    ledgerInfo = validateLedger(ledger, contract, contractInfo, profileInfo, mapInfo, briefInfo, errors, warnings, options.release);
  }

  const result = {
    ok: errors.length === 0,
    mode: options.contractOnly ? 'contract-only' : options.release ? 'release' : 'full',
    contract: contract ? `${contract.schema}@${contract.version}` : null,
    profiles: profileInfo?.byId.size ?? 0,
    mappedAssets: mapInfo?.byKey.size ?? 0,
    briefs: briefInfo?.assets.length ?? null,
    ledgerAssets: ledgerInfo?.assets.length ?? null,
    activeLedgerAssets: ledgerInfo?.activeByKey.size ?? null,
    errors,
    warnings
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.ok) {
    process.stdout.write(`Art fidelity validation passed (${result.mode}): ${result.profiles} morphology profiles, ${result.mappedAssets} mapped assets${result.activeLedgerAssets === null ? '' : `, ${result.activeLedgerAssets} active assets`}.\n`);
    for (const warning of warnings) process.stdout.write(`Warning: ${warning}\n`);
  } else {
    process.stderr.write(`Art fidelity validation failed (${result.mode}) with ${errors.length} error(s):\n`);
    for (const error of errors) process.stderr.write(`- ${error}\n`);
  }
  if (!result.ok) process.exitCode = 1;
}

await main();
