import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artDirection = resolve(root, 'art-direction');

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function loadFidelitySources() {
  const contract = JSON.parse(await readFile(resolve(artDirection, 'avp-art-fidelity-contract.v1.json'), 'utf8'));
  const base = JSON.parse(await readFile(resolve(artDirection, 'avp-morphology-profiles.v1.json'), 'utf8'));
  const extensions = await Promise.all((base.extensions ?? []).map(async (name) =>
    JSON.parse(await readFile(resolve(artDirection, name), 'utf8'))));
  const profiles = [...base.profiles, ...extensions.flatMap((extension) => extension.profiles)];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const assetMap = JSON.parse(await readFile(resolve(artDirection, 'avp-asset-fidelity-map.v1.json'), 'utf8'));
  return { contract, profileById, assetMap };
}

function resolvedAnchorIds(profileById, profileId, chain = []) {
  assert.equal(chain.includes(profileId), false, `profile cycle: ${[...chain, profileId].join(' -> ')}`);
  const profile = profileById.get(profileId);
  assert.ok(profile, `unknown test profile ${profileId}`);
  return [
    ...(profile.baseProfile ? resolvedAnchorIds(profileById, profile.baseProfile, [...chain, profileId]) : []),
    ...profile.requiredAnchors.map(({ id }) => id),
  ];
}

function makePendingWave(contract, profileById, assetMap) {
  const briefs = [];
  const ledger = [];
  for (const mapped of assetMap.assets) {
    const secondaryProfiles = [...(mapped.secondaryProfiles ?? [])];
    const profileIds = [mapped.profile, ...secondaryProfiles];
    const requiredAnchors = profileIds.flatMap((profile) => resolvedAnchorIds(profileById, profile)).sort();
    const prompt = Object.fromEntries(contract.briefPolicy.requiredPromptSections
      .map((section) => [section, `${mapped.id} original fidelity brief section ${section}`]));
    const negativePrompt = 'no official image input, copied composition, actor likeness, logo, text, watermark or anatomical drift';
    briefs.push({
      id: mapped.id,
      kind: mapped.kind,
      profile: mapped.profile,
      secondaryProfiles,
      active: true,
      briefRevision: 1,
      subject: mapped.subject,
      requiredAnchors,
      prompt,
      negativePrompt,
      promptSha256: sha256(stableJson({ prompt, negativePrompt })),
      originalCompositionRequired: true,
      officialImageInputUsed: false,
      actorLikenessRequested: false,
      acceptanceThreshold: 95,
    });
    ledger.push({
      id: mapped.id,
      kind: mapped.kind,
      profile: mapped.profile,
      secondaryProfiles,
      active: true,
      sourceName: mapped.sourceName,
      sourceSha256: sha256(Buffer.from(`source:${mapped.sourceName}`)),
      promptSha256: null,
      decision: 'pending',
      score: null,
      retryCount: 0,
      acceptedAttempt: null,
      anchors: {},
      hardFails: [],
      promptComplete: false,
      attempts: [],
    });
  }
  return {
    briefs: { schema: 'avp-art-fidelity-briefs-v1', version: '1.0.0', assets: briefs },
    ledger: { schema: 'avp-art-fidelity-ledger-v1', version: '1.0.0', assets: ledger },
  };
}

async function validateWave(briefsPath, ledgerPath) {
  return run(process.execPath, [
    'scripts/validate-art-fidelity.mjs',
    '--briefs', briefsPath,
    '--ledger', ledgerPath,
    '--json',
  ], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
}

function validationFailure(error) {
  return `${String(error?.stdout ?? '')}\n${String(error?.stderr ?? '')}`;
}

test('validator binds every private identity, profile and source name to the canonical map', async () => {
  const { contract, profileById, assetMap } = await loadFidelitySources();
  const wave = makePendingWave(contract, profileById, assetMap);
  const temporary = await mkdtemp(resolve(tmpdir(), 'avp-fidelity-chain-'));
  const briefsPath = resolve(temporary, 'briefs.json');
  const ledgerPath = resolve(temporary, 'ledger.json');
  try {
    await writeFile(briefsPath, JSON.stringify(wave.briefs));
    await writeFile(ledgerPath, JSON.stringify(wave.ledger));
    const baseline = JSON.parse((await validateWave(briefsPath, ledgerPath)).stdout);
    assert.equal(baseline.ok, true);
    assert.equal(baseline.mappedAssets, 174);
    assert.equal(baseline.activeLedgerAssets, 174);

    const originalProfile = wave.briefs.assets[0].profile;
    wave.briefs.assets[0].profile = wave.briefs.assets.find(({ profile }) => profile !== originalProfile).profile;
    await writeFile(briefsPath, JSON.stringify(wave.briefs));
    await assert.rejects(
      validateWave(briefsPath, ledgerPath),
      (error) => /must match mapped profile/.test(validationFailure(error)),
    );
    wave.briefs.assets[0].profile = originalProfile;
    await writeFile(briefsPath, JSON.stringify(wave.briefs));

    const mappedSourceName = wave.ledger.assets[0].sourceName;
    wave.ledger.assets[0].sourceName = 'forged-source-v1.png';
    await writeFile(ledgerPath, JSON.stringify(wave.ledger));
    await assert.rejects(
      validateWave(briefsPath, ledgerPath),
      (error) => /must match mapped sourceName/.test(validationFailure(error)),
    );
    wave.ledger.assets[0].sourceName = mappedSourceName;

    const multiProfileIndex = wave.ledger.assets.findIndex(({ secondaryProfiles }) => secondaryProfiles.length > 0);
    assert.notEqual(multiProfileIndex, -1, 'the canonical wave must exercise secondaryProfiles binding');
    wave.ledger.assets[multiProfileIndex].secondaryProfiles = [];
    await writeFile(ledgerPath, JSON.stringify(wave.ledger));
    await assert.rejects(
      validateWave(briefsPath, ledgerPath),
      (error) => /must match mapped secondaryProfiles/.test(validationFailure(error)),
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test('review, preparation and build keep the canonical proof chain explicit', async () => {
  const [review, prepare, build] = await Promise.all([
    readFile(resolve(root, 'scripts/review-art.mjs'), 'utf8'),
    readFile(resolve(root, 'scripts/prepare-art.mjs'), 'utf8'),
    readFile(resolve(root, 'scripts/build.mjs'), 'utf8'),
  ]);
  assert.match(review, /'--release'/);
  assert.match(review, /'--map', mapPath/);
  assert.match(review, /sha256: sha256\(mapBytes\)/);
  assert.match(prepare, /review\.map\.sha256/);
  assert.match(prepare, /canonical asset fidelity map/);
  assert.match(prepare, /contract:\s*\{[\s\S]*?profiles:\s*\{[\s\S]*?map:\s*\{/);
  assert.match(build, /await currentFidelityProof\(\)/);
  assert.match(build, /advertisedMap\?\.sha256 !== proof\.map\.sha256/);
});
