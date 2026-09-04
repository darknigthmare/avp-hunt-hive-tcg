import { createReadStream } from 'node:fs';
import { lstat, readFile, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'Usage: node scripts/init-art-fidelity-wave.mjs --write\n';
const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== '--write') {
  process.stderr.write(USAGE);
  process.exitCode = 2;
} else {
  await main().catch((error) => {
    process.stderr.write(`Art fidelity wave initialization failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

async function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const artRoot = resolve(repoRoot, '..', 'art-originals');
  const paths = {
    contract: resolve(repoRoot, 'art-direction', 'avp-art-fidelity-contract.v1.json'),
    profiles: resolve(repoRoot, 'art-direction', 'avp-morphology-profiles.v1.json'),
    map: resolve(repoRoot, 'art-direction', 'avp-asset-fidelity-map.v1.json'),
    review: resolve(artRoot, 'review.json'),
    briefs: resolve(artRoot, 'fidelity-briefs.json'),
    ledger: resolve(artRoot, 'fidelity-ledger.json'),
  };

  await Promise.all([assertMissing(paths.briefs), assertMissing(paths.ledger)]);

  const [contractFile, mapFile, reviewFile] = await Promise.all([
    readJson(paths.contract, 'fidelity contract'),
    readJson(paths.map, 'asset fidelity map'),
    readJson(paths.review, 'private v1 artwork review'),
  ]);
  const contract = contractFile.value;
  const assetMap = mapFile.value;
  const review = reviewFile.value;
  const profileBundle = await loadProfiles(paths.profiles);

  if (contract.schema !== 'avp-art-fidelity-contract-v1' || contract.version !== '1.0.0') {
    throw new Error('Expected avp-art-fidelity-contract-v1@1.0.0.');
  }
  if (assetMap.schema !== 'avp-asset-fidelity-map-v1' || assetMap.version !== '1.0.0') {
    throw new Error('Expected avp-asset-fidelity-map-v1@1.0.0.');
  }
  if (review.schema !== 'avp-art-review-v1' || !Array.isArray(review.items)) {
    throw new Error('Expected the private avp-art-review-v1 source-hash inventory.');
  }

  const requiredSections = contract.briefPolicy?.requiredPromptSections;
  const acceptanceThreshold = contract.scoring?.minimumAcceptedScore;
  if (!Array.isArray(requiredSections) || requiredSections.length === 0 || new Set(requiredSections).size !== requiredSections.length) {
    throw new Error('The fidelity contract has no valid requiredPromptSections list.');
  }
  if (!Number.isInteger(acceptanceThreshold) || acceptanceThreshold < 95) {
    throw new Error('The fidelity contract must retain a minimum accepted score of at least 95.');
  }

  const assets = assetMap.assets;
  const expected = assetMap.expected ?? {};
  if (
    !Array.isArray(assets) ||
    assets.length !== 174 ||
    expected.cards !== 158 ||
    expected.scenes !== 16 ||
    expected.total !== 174
  ) {
    throw new Error('The fidelity map must contain the complete 158-card and 16-scene release set.');
  }

  const reviewByKey = new Map();
  for (const item of review.items) {
    const key = `${item?.kind}:${item?.id}`;
    if (reviewByKey.has(key)) throw new Error(`Duplicate review item ${key}.`);
    reviewByKey.set(key, item);
  }

  const seenKeys = new Set();
  const seenSources = new Set();
  const briefs = [];
  const ledgerAssets = [];
  for (const asset of assets) {
    validateMapAsset(asset);
    const key = `${asset.kind}:${asset.id}`;
    if (seenKeys.has(key)) throw new Error(`Duplicate mapped asset ${key}.`);
    if (seenSources.has(asset.sourceName)) throw new Error(`Duplicate mapped sourceName ${asset.sourceName}.`);
    seenKeys.add(key);
    seenSources.add(asset.sourceName);

    const profileIds = [asset.profile, ...(asset.secondaryProfiles ?? [])];
    if (new Set(profileIds).size !== profileIds.length) throw new Error(`Repeated profile on ${key}.`);
    const resolvedProfiles = profileIds.map((id) => resolveProfile(id, profileBundle.byId));
    const anchors = uniqueAnchors(resolvedProfiles.flatMap((profile) => profile.requiredAnchors), key);
    const prompt = buildPrompt(asset, resolvedProfiles, anchors, requiredSections);
    const negativePrompt = buildNegativePrompt(resolvedProfiles);
    const promptSha256 = sha256Text(stableStringify({ prompt, negativePrompt }));

    const reviewItem = reviewByKey.get(key);
    if (
      !reviewItem ||
      reviewItem.sourceName !== asset.sourceName ||
      !isSha256(reviewItem.sourceSha256)
    ) {
      throw new Error(`Review v1 has no matching source hash for ${key}.`);
    }
    const sourcePath = resolve(artRoot, asset.kind === 'card' ? 'cards' : 'scenes', asset.sourceName);
    await assertRegularFileInside(sourcePath, artRoot, key);
    const currentSourceSha256 = await sha256File(sourcePath);
    if (currentSourceSha256 !== reviewItem.sourceSha256) {
      throw new Error(`Current master hash differs from review v1 for ${key}.`);
    }

    const brief = {
      id: asset.id,
      kind: asset.kind,
      profile: asset.profile,
      ...(profileIds.length > 1 ? { secondaryProfiles: profileIds.slice(1) } : {}),
      active: true,
      briefRevision: 1,
      subject: asset.subject,
      requiredAnchors: anchors.map(({ id }) => id),
      prompt,
      negativePrompt,
      promptSha256,
      originalCompositionRequired: true,
      officialImageInputUsed: false,
      actorLikenessRequested: false,
      acceptanceThreshold,
    };
    briefs.push(brief);

    ledgerAssets.push({
      id: asset.id,
      kind: asset.kind,
      profile: asset.profile,
      ...(profileIds.length > 1 ? { secondaryProfiles: profileIds.slice(1) } : {}),
      active: true,
      sourceName: asset.sourceName,
      sourceSha256: currentSourceSha256,
      promptSha256: null,
      decision: 'pending',
      score: null,
      retryCount: 0,
      acceptedAttempt: null,
      anchors: {},
      hardFails: [],
      promptComplete: false,
      attempts: [],
      continuity: continuityLabel(asset.continuity),
      canonTarget: `Near-canonical morphology for ${asset.subject} using the narrowest mapped profile ${asset.profile}.`,
      referenceBasis: referenceBasis(asset),
    });
  }

  if (seenKeys.size !== 174 || reviewByKey.size !== 174) {
    throw new Error(`Coverage mismatch: map=${seenKeys.size}, review=${reviewByKey.size}; expected 174 each.`);
  }

  const generatedFrom = {
    contract: `art-direction/avp-art-fidelity-contract.v1.json@${contract.version}`,
    contractSha256: sha256Text(contractFile.text),
    profiles: profileBundle.files,
    profileBundleSha256: profileBundle.sha256,
    map: `art-direction/avp-asset-fidelity-map.v1.json@${assetMap.version}`,
    mapSha256: sha256Text(mapFile.text),
    review: `review.json@${review.version}`,
    reviewRevision: review.revision,
  };
  const briefsDocument = {
    schema: 'avp-art-fidelity-briefs-v1',
    version: '1.0.0',
    generatedFrom,
    assets: briefs,
  };
  const ledgerDocument = {
    schema: 'avp-art-fidelity-ledger-v1',
    version: '1.0.0',
    generatedFrom,
    assets: ledgerAssets,
  };

  await writePairWithoutOverwrite([
    [paths.briefs, `${JSON.stringify(briefsDocument, null, 2)}\n`],
    [paths.ledger, `${JSON.stringify(ledgerDocument, null, 2)}\n`],
  ]);
  process.stdout.write('Initialized private fidelity wave: 174 active briefs and 174 pending ledger entries; no existing file was overwritten.\n');
}

async function readJson(filePath, label) {
  const text = await readFile(filePath, 'utf8');
  try {
    return { text, value: JSON.parse(text) };
  } catch (error) {
    throw new Error(`Invalid ${label} JSON: ${error.message}`);
  }
}

async function assertMissing(filePath) {
  const info = await lstat(filePath).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
  if (info) throw new Error(`Refusing to overwrite existing private file: ${filePath}`);
}

async function writePairWithoutOverwrite(entries) {
  const created = [];
  try {
    for (const [filePath, contents] of entries) {
      await writeFile(filePath, contents, { encoding: 'utf8', flag: 'wx' });
      created.push(filePath);
    }
  } catch (error) {
    await Promise.all(created.map((filePath) => unlink(filePath).catch(() => {})));
    throw error;
  }
}

async function loadProfiles(registryPath) {
  const registryFile = await readJson(registryPath, 'morphology profile registry');
  const registry = registryFile.value;
  if (registry.schema !== 'avp-morphology-profiles-v1' || registry.version !== '1.0.0') {
    throw new Error('Expected avp-morphology-profiles-v1@1.0.0.');
  }
  const directory = dirname(registryPath);
  const files = [{ path: 'art-direction/avp-morphology-profiles.v1.json', text: registryFile.text }];
  const profiles = Array.isArray(registry.profiles) ? [...registry.profiles] : [];
  for (const extensionName of registry.extensions ?? []) {
    if (typeof extensionName !== 'string' || basename(extensionName) !== extensionName) {
      throw new Error(`Unsafe morphology extension name: ${String(extensionName)}.`);
    }
    const extensionFile = await readJson(resolve(directory, extensionName), `morphology extension ${extensionName}`);
    const extension = extensionFile.value;
    if (
      extension.schema !== 'avp-morphology-profile-extension-v1' ||
      extension.version !== registry.version ||
      extension.baseRegistry !== `${registry.schema}@${registry.version}` ||
      !Array.isArray(extension.profiles)
    ) {
      throw new Error(`Incompatible morphology extension ${extensionName}.`);
    }
    profiles.push(...extension.profiles);
    files.push({ path: `art-direction/${extensionName}`, text: extensionFile.text });
  }
  const byId = new Map();
  for (const profile of profiles) {
    if (!profile || typeof profile.id !== 'string' || !profile.id.trim() || byId.has(profile.id)) {
      throw new Error(`Invalid or duplicate morphology profile ${String(profile?.id)}.`);
    }
    byId.set(profile.id, profile);
  }
  if (byId.size === 0) throw new Error('Morphology profile registry is empty.');
  for (const id of byId.keys()) resolveProfile(id, byId);
  return {
    byId,
    files: files.map(({ path, text }) => ({ path, sha256: sha256Text(text) })),
    sha256: sha256Text(stableStringify(files.map(({ path, text }) => ({ path, sha256: sha256Text(text) })))),
  };
}

function resolveProfile(id, byId, trail = []) {
  const profile = byId.get(id);
  if (!profile) throw new Error(`Unknown morphology profile ${id}.`);
  if (trail.includes(id)) throw new Error(`Morphology inheritance cycle: ${[...trail, id].join(' -> ')}.`);
  const parent = profile.baseProfile ? resolveProfile(profile.baseProfile, byId, [...trail, id]) : null;
  return {
    ...profile,
    requiredAnchors: [...(parent?.requiredAnchors ?? []), ...(profile.requiredAnchors ?? [])],
    forbiddenDrift: [...(parent?.forbiddenDrift ?? []), ...(profile.forbiddenDrift ?? [])],
    promptDirectives: [...(parent?.promptDirectives ?? []), ...(profile.promptDirectives ?? [])],
  };
}

function uniqueAnchors(anchors, key) {
  const result = [];
  const ids = new Set();
  for (const anchor of anchors) {
    if (
      !anchor ||
      typeof anchor.id !== 'string' ||
      typeof anchor.label !== 'string' ||
      typeof anchor.requirement !== 'string' ||
      typeof anchor.scoreDimension !== 'string'
    ) {
      throw new Error(`Invalid resolved morphology anchor for ${key}.`);
    }
    if (ids.has(anchor.id)) throw new Error(`Colliding resolved anchor ${anchor.id} for ${key}.`);
    ids.add(anchor.id);
    result.push(anchor);
  }
  if (result.length === 0) throw new Error(`No resolved anchors for ${key}.`);
  return result;
}

function buildPrompt(asset, profiles, anchors, requiredSections) {
  const profileLabels = profiles.map((profile) => `${profile.label} (${profile.id})`).join('; ');
  const allAnchorRequirements = anchors.map((anchor) => `${anchor.label}: ${anchor.requirement}`).join(' ');
  const directives = profiles.flatMap((profile) => profile.promptDirectives ?? []).join(' ');
  const forbidden = [...new Set(profiles.flatMap((profile) => profile.forbiddenDrift ?? []))].join(', ');
  const byDimensions = (...dimensions) => {
    const matches = anchors.filter((anchor) => dimensions.includes(anchor.scoreDimension));
    return matches.length > 0
      ? matches.map((anchor) => `${anchor.label}: ${anchor.requirement}`).join(' ')
      : `Keep the complete ${profileLabels} identity immediately readable without generic substitution.`;
  };
  const values = {
    subject: `Near-canonical morphology fidelity target: ${asset.subject}. Use the narrowest written profile only: ${profileLabels}. The result must be recognizable from form alone while remaining a newly authored fan-made illustration.`,
    silhouette: `${byDimensions('silhouette')} Make the outer contour, posture and mass distribution unambiguous at card or scene display size.`,
    anatomy: `${byDimensions('anatomy')} Preserve correct limb count, joint attachment, head construction and appendage continuity; reject fused, duplicated, missing or impossible anatomy.`,
    signatureTraits: `All resolved anchors are mandatory and must remain visible or unambiguous: ${allAnchorRequirements} ${directives}`.trim(),
    surfaceLanguage: `${byDimensions('surfaceLanguage')} Do not replace the profile with generic fantasy armor, generic science-fiction machinery or an unrelated monster surface.`,
    scaleAndPose: `${byDimensions('scaleAndProportion', 'poseReadability')} Use readable scale cues and an original pose that exposes, rather than hides, all mandatory anatomy and signature traits.`,
    originalComposition: 'Create an original composition from scratch: a new camera, pose, grouping, action beat, environment and lighting. Do not recreate or closely track any official still, poster, concept art, game capture, card, packaging image or recognizable promotional composition.',
    lightingAndPalette: 'Use neutral key or rim light sufficient to verify the full silhouette, anatomy, material response and variant-defining colors. Atmosphere may be cinematic, but darkness, smoke and crop must not conceal required anchors.',
    negativeConstraints: `No official image input or edit target; no copied official composition; no actor, performer or publicity likeness; no official logo, wordmark, card frame, text, watermark or protected asset. No anatomy drift, hidden required anchor, identity merge, generic-subject substitution or prompt text in the image.${forbidden ? ` Reject profile drift including: ${forbidden}.` : ''}`,
  };
  const prompt = {};
  for (const section of requiredSections) {
    if (typeof values[section] !== 'string' || !values[section].trim()) {
      throw new Error(`No initializer text exists for required prompt section ${section}.`);
    }
    prompt[section] = values[section];
  }
  if (Object.keys(prompt).length !== requiredSections.length) {
    throw new Error(`Prompt section construction failed for ${asset.kind}:${asset.id}.`);
  }
  return prompt;
}

function buildNegativePrompt(profiles) {
  const forbidden = [...new Set(profiles.flatMap((profile) => profile.forbiddenDrift ?? []))];
  return [
    'official image input',
    'official still',
    'official poster',
    'copied composition',
    'actor likeness',
    'performer likeness',
    'official logo',
    'wordmark',
    'card frame',
    'text',
    'watermark',
    'protected asset',
    'generic substitute',
    'anatomical drift',
    'fused anatomy',
    'duplicated limbs',
    'missing required anchor',
    ...forbidden,
  ].join(', ');
}

function validateMapAsset(asset) {
  if (!asset || !['card', 'scene'].includes(asset.kind) || typeof asset.id !== 'string' || !asset.id.trim()) {
    throw new Error('Invalid asset entry in the fidelity map.');
  }
  if (typeof asset.profile !== 'string' || !asset.profile.trim() || typeof asset.subject !== 'string' || !asset.subject.trim()) {
    throw new Error(`Mapped asset ${asset.kind}:${asset.id} is missing its profile or subject.`);
  }
  if (
    typeof asset.sourceName !== 'string' ||
    basename(asset.sourceName) !== asset.sourceName ||
    !/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.png$/.test(asset.sourceName)
  ) {
    throw new Error(`Unsafe mapped sourceName for ${asset.kind}:${asset.id}.`);
  }
  if (asset.secondaryProfiles !== undefined && (!Array.isArray(asset.secondaryProfiles) || !asset.secondaryProfiles.every((id) => typeof id === 'string' && id.trim()))) {
    throw new Error(`Invalid secondaryProfiles for ${asset.kind}:${asset.id}.`);
  }
}

async function assertRegularFileInside(filePath, allowedRoot, label) {
  const [fileInfo, canonicalFile, canonicalRoot] = await Promise.all([
    lstat(filePath),
    import('node:fs/promises').then(({ realpath }) => realpath(filePath)),
    import('node:fs/promises').then(({ realpath }) => realpath(allowedRoot)),
  ]);
  if (fileInfo.isSymbolicLink() || !fileInfo.isFile() || !canonicalFile.startsWith(`${canonicalRoot}${sep}`)) {
    throw new Error(`Unsafe source master for ${label}.`);
  }
}

function sha256File(filePath) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolveHash(hash.digest('hex')));
  });
}

function sha256Text(text) {
  return createHash('sha256').update(text).digest('hex');
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function continuityLabel(continuity = {}) {
  const parts = [continuity.set, continuity.entry, continuity.prototype ? 'prototype or alternate continuity' : null];
  return parts.filter((value) => typeof value === 'string' && value.trim()).join(' | ');
}

function referenceBasis(asset) {
  const continuity = asset.continuity ?? {};
  const parts = [
    continuity.workbook ? `catalogue ${continuity.workbook}` : null,
    continuity.sheet ? `section ${continuity.sheet}` : null,
    continuity.entry ? `entry ${continuity.entry}` : null,
    `text-only morphology profile ${asset.profile}`,
    'no official image supplied to generation',
  ];
  return parts.filter(Boolean).join('; ');
}
