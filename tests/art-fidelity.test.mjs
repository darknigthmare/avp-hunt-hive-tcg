import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artDirection = resolve(root, 'art-direction');
const contract = JSON.parse(await readFile(resolve(artDirection, 'avp-art-fidelity-contract.v1.json'), 'utf8'));
const baseRegistry = JSON.parse(await readFile(resolve(artDirection, 'avp-morphology-profiles.v1.json'), 'utf8'));
const extensions = await Promise.all(baseRegistry.extensions.map(async (name) => ({
  name,
  data: JSON.parse(await readFile(resolve(artDirection, name), 'utf8')),
})));
const profiles = [...baseRegistry.profiles, ...extensions.flatMap(({ data }) => data.profiles)];
const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
const assetMapPath = resolve(artDirection, 'avp-asset-fidelity-map.v1.json');
const assetMapBytes = await readFile(assetMapPath);
const assetMap = JSON.parse(assetMapBytes.toString('utf8'));

function resolveAnchors(id, chain = []) {
  assert.equal(chain.includes(id), false, `profile inheritance cycle: ${[...chain, id].join(' -> ')}`);
  const profile = profileById.get(id);
  assert.ok(profile, `missing profile ${id}`);
  return [
    ...(profile.baseProfile ? resolveAnchors(profile.baseProfile, [...chain, id]) : []),
    ...profile.requiredAnchors,
  ];
}

test('fidelity contract makes morphology and retry failures release blocking', () => {
  assert.equal(contract.schema, 'avp-art-fidelity-contract-v1');
  assert.equal(contract.scoring.minimumAcceptedScore, 95);
  assert.equal(contract.scoring.minimumDimensionScore, 90);
  assert.equal(contract.scoring.thresholdMayNotBeLowered, true);
  assert.equal(contract.scoring.dimensions.reduce((sum, dimension) => sum + dimension.weight, 0), 100);
  assert.equal(contract.retryPolicy.retryRequiredAfterAnyRejection, true);
  assert.equal(contract.retryPolicy.maximumAttemptsPerBriefRevision, 6);
  assert.equal(contract.retryPolicy.thresholdReductionAllowed, false);
  assert.equal(contract.retryPolicy.anchorWaiverAllowed, false);
  assert.equal(contract.retryPolicy.historyMayBeDeleted, false);
  assert.equal(contract.originalityAndSafety.originalCompositionRequired, true);
  assert.equal(contract.originalityAndSafety.officialImageInputAllowed, false);
  assert.equal(contract.originalityAndSafety.actorLikenessAllowed, false);
  const hardFails = new Set(contract.hardFails.map(({ id }) => id));
  for (const id of [
    'official-image-input',
    'copied-official-composition',
    'actor-likeness',
    'missing-required-anchor',
    'wrong-subject-family',
    'anatomical-generation-error',
  ]) assert.equal(hardFails.has(id), true, `missing hard fail ${id}`);
});

test('58 morphology profiles resolve without collisions and cover critical variants', () => {
  assert.equal(profiles.length, 58);
  assert.equal(profileById.size, profiles.length);
  for (const extension of extensions) {
    assert.equal(extension.data.schema, 'avp-morphology-profile-extension-v1');
    assert.equal(extension.data.baseRegistry, 'avp-morphology-profiles-v1@1.0.0');
  }
  for (const profile of profiles) {
    const anchors = resolveAnchors(profile.id);
    assert.ok(anchors.length >= 4, `${profile.id} needs at least four resolved anchors`);
    assert.equal(new Set(anchors.map(({ id }) => id)).size, anchors.length, `${profile.id} has colliding anchors`);
    assert.ok(profile.forbiddenDrift.length > 0);
    assert.ok(profile.promptDirectives.length > 0);
  }
  for (const id of [
    'xenomorph.ovomorph', 'xenomorph.big-chap', 'xenomorph.grid', 'xenomorph.queen-mother',
    'xenomorph.spitter', 'xenomorph.stalker', 'xenomorph.scorched',
    'yautja.jungle-hunter', 'yautja.wolf', 'yautja.feral', 'yautja.yaquita',
    'object.smartgun-system', 'object.power-loader-frame',
    'engineer.space-jockey-fossil', 'hybrid.predalien', 'hybrid.newborn', 'hybrid.alien-king',
  ]) assert.equal(profileById.has(id), true, `missing critical profile ${id}`);
});

test('fidelity map assigns every card and scene to one existing profile', () => {
  assert.equal(assetMap.schema, 'avp-asset-fidelity-map-v1');
  assert.deepEqual(assetMap.expected, { cards: 158, scenes: 16, total: 174 });
  assert.equal(assetMap.assets.length, 174);
  assert.equal(new Set(assetMap.assets.map(({ kind, id }) => `${kind}:${id}`)).size, 174);
  assert.equal(assetMap.assets.filter(({ kind }) => kind === 'card').length, 158);
  assert.equal(assetMap.assets.filter(({ kind }) => kind === 'scene').length, 16);
  assert.equal(assetMap.assets.filter(({ priority }) => priority === 'P0').length, 72);
  for (const asset of assetMap.assets) {
    const associatedProfiles = [asset.profile, ...(asset.secondaryProfiles ?? [])];
    assert.equal(new Set(associatedProfiles).size, associatedProfiles.length, asset.id + ' repeats a profile');
    for (const profile of associatedProfiles) {
      assert.equal(profileById.has(profile), true, asset.id + ' uses unknown profile ' + profile);
    }
    const combinedAnchors = associatedProfiles.flatMap((profile) => resolveAnchors(profile));
    assert.equal(
      new Set(combinedAnchors.map(({ id }) => id)).size,
      combinedAnchors.length,
      asset.id + ' has colliding cumulative anchors',
    );
    if (asset.profile === 'scene.multi-subject-original') {
      assert.ok(asset.secondaryProfiles.length > 0, asset.id + ' requires a secondary profile');
    }
    assert.equal(profileById.has(asset.profile), true, `${asset.id} uses unknown profile ${asset.profile}`);
    assert.match(asset.sourceName, /^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.png$/);
    assert.ok(['P0', 'P1', 'P2'].includes(asset.priority));
    assert.ok(asset.subject.trim());
    assert.ok(asset.continuity.entry.trim());
  }
  assert.equal(assetMap.assets.filter(({ profile }) => profile === 'scene.multi-subject-original').length, 48);
  const expectedProfiles = {
    X_OVOMORPH: 'xenomorph.ovomorph',
    X_BIG_CHAP: 'xenomorph.big-chap',
    X_GRID: 'xenomorph.grid',
    X_SPITTER: 'xenomorph.spitter',
    X_STALKER: 'xenomorph.stalker',
    X_SCORCHED: 'xenomorph.scorched',
    Y_JUNGLE_HUNTER: 'yautja.jungle-hunter',
    Y_WOLF: 'yautja.wolf',
    Y_YAQUITA: 'yautja.yaquita',
    E_SPACE_JOCKEY: 'engineer.space-jockey-fossil',
    H_PREDALIEN: 'hybrid.predalien',
    H_NEWBORN: 'hybrid.newborn',
    EQ_SMARTGUN: 'object.smartgun-system',
    EQ_POWER_LOADER: 'object.power-loader-frame',
  };
  for (const [id, profile] of Object.entries(expectedProfiles)) {
    assert.equal(assetMap.assets.find((asset) => asset.id === id)?.profile, profile);
  }
  const expectedSecondaryProfiles = {
    H_SMARTGUNNER: ['object.smartgun-system'],
    H_POWERLOADER_RIPLEY: ['object.power-loader-frame'],
  };
  for (const [id, secondaryProfiles] of Object.entries(expectedSecondaryProfiles)) {
    assert.deepEqual(assetMap.assets.find((asset) => asset.id === id)?.secondaryProfiles, secondaryProfiles);
  }
});

test('public fidelity files validate and the generated map is byte-stable', async () => {
  const validation = await run(process.execPath, ['scripts/validate-art-fidelity.mjs', '--contract-only'], { cwd: root });
  assert.match(validation.stdout, /passed \(contract-only\): 58 morphology profiles/);
  const before = createHash('sha256').update(assetMapBytes).digest('hex');
  const generation = await run(process.execPath, ['scripts/generate-art-fidelity-map.mjs'], { cwd: root });
  assert.match(generation.stdout, /158 cards \+ 16 scenes = 174 assets/);
  const after = createHash('sha256').update(await readFile(assetMapPath)).digest('hex');
  assert.equal(after, before);
});

test('documentation forbids retro-certifying the legacy artwork wave', async () => {
  const provenance = await readFile(resolve(root, 'ARTWORK_PROVENANCE.md'), 'utf8');
  assert.match(provenance, /non certifiée v2/i);
  assert.match(provenance, /Aucun asset v1 ne reçoit de certification par simple migration/i);
  assert.match(provenance, /95\/100/);
});
