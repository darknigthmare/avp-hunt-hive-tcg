import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const cliArgs = process.argv.slice(2);
const writeRequested = cliArgs.length === 1 && cliArgs[0] === '--write';
if (cliArgs.length > 0 && !writeRequested) {
  throw new Error('Usage: node scripts/generate-art-fidelity-map.mjs [--write]');
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(root, 'src', 'data.js');
const profilesPath = resolve(root, 'art-direction', 'avp-morphology-profiles.v1.json');
const outputPath = resolve(root, 'art-direction', 'avp-asset-fidelity-map.v1.json');

const SCENE_FILES = Object.freeze([
  ['home-hero', 'home-hero-v1.png'],
  ['battle-board', 'battle-board-v1.png'],
  ...Array.from({ length: 8 }, (_, index) => [
    `campaign-${index + 1}`,
    `campaign-mission-0${index + 1}-v1.png`,
  ]),
  ['booster-nx01', 'booster-nx01-v1.png'],
  ['booster-cw02', 'booster-cw02-v1.png'],
  ['booster-hg03', 'booster-hg03-v1.png'],
  ['booster-av04', 'booster-av04-v1.png'],
  ['booster-ev05', 'booster-ev05-v1.png'],
  ['booster-px00', 'booster-px00-v1.png'],
]);

// Named or morphology-critical subjects never fall back to a generic family.
// Every profile on the right must exist in avp-morphology-profiles.v1.json.
const SPECIFIC_PROFILE_BY_ID = Object.freeze({
  X_OVOMORPH: 'xenomorph.ovomorph',
  X_FACEHUGGER: 'xenomorph.facehugger',
  X_CHESTBURSTER: 'xenomorph.chestburster',
  X_DRONE: 'xenomorph.drone',
  X_WARRIOR: 'xenomorph.warrior',
  X_RUNNER: 'xenomorph.runner',
  X_SPITTER: 'xenomorph.spitter',
  X_STALKER: 'xenomorph.stalker',
  X_PRAETORIAN: 'xenomorph.praetorian',
  X_QUEEN: 'xenomorph.queen',
  X_QUEEN_MOTHER: 'xenomorph.queen-mother',
  X_BIG_CHAP: 'xenomorph.big-chap',
  X_SCORCHED: 'xenomorph.scorched',
  X_GRID: 'xenomorph.grid',
  X_RED: 'xenomorph.red',
  X_GORILLA: 'xenomorph.gorilla',
  X_BULL: 'xenomorph.bull',
  X_MANTIS: 'xenomorph.mantis',
  X_SNAKE: 'xenomorph.snake',
  X_FLYING_QUEEN: 'xenomorph.flying-queen',
  X_POPPER: 'xenomorph.popper',
  X_PATH_QUEEN: 'xenomorph.queen',
  X_WARDEN: 'xenomorph.warden',
  X_SIREN: 'xenomorph.siren',
  X_NEOMORPH: 'hybrid.neomorph',
  X_DEACON: 'hybrid.deacon',
  Y_JUNGLE_HUNTER: 'yautja.jungle-hunter',
  Y_CITY_HUNTER: 'yautja.city-hunter',
  Y_SCAR: 'yautja.scar',
  Y_CELTIC: 'yautja.celtic',
  Y_CHOPPER: 'yautja.chopper',
  Y_WOLF: 'yautja.wolf',
  Y_BERSERKER: 'yautja.berserker',
  Y_FALCONER: 'yautja.falconer',
  Y_TRACKER: 'yautja.tracker',
  Y_HOUND: 'yautja.hound',
  Y_FERAL: 'yautja.feral',
  Y_AHAB: 'yautja.ahab',
  Y_YAQUITA: 'yautja.yaquita',
  E_ENGINEER: 'engineer.humanoid',
  E_SPACE_JOCKEY: 'engineer.space-jockey-fossil',
  E_TRILOBITE: 'hybrid.trilobite',
  E_HAMMERPEDE: 'hybrid.hammerpede',
  E_BLACK_GOO_MUTANT: 'hybrid.black-goo-mutant',
  H_PREDALIEN: 'hybrid.predalien',
  H_NEWBORN: 'hybrid.newborn',
  H_WHITE_HYBRID: 'hybrid.white-hybrid',
  H_ALIEN_KING: 'hybrid.alien-king',
  EQ_SMARTGUN: 'object.smartgun-system',
  EQ_POWER_LOADER: 'object.power-loader-frame',
});

// Multi-subject art is never allowed to hide critical anatomy behind the scene
// profile. Every visible story subject contributes all anchors from the most
// relevant morphology profiles below.
const SECONDARY_PROFILES_BY_ID = Object.freeze({
  H_SMARTGUNNER: ['object.smartgun-system'],
  H_POWERLOADER_RIPLEY: ['object.power-loader-frame'],

  T_X_ACID_BLOOD: ['xenomorph.standard'],
  T_X_VENT_AMBUSH: ['xenomorph.stalker'],
  T_X_RESIN: ['xenomorph.drone', 'place.biomechanical'],
  T_X_SWARM: ['xenomorph.facehugger'],
  T_X_EGGMORPH: ['xenomorph.ovomorph', 'human.original-character'],
  T_X_ROYAL_JELLY: ['xenomorph.praetorian'],
  T_X_CUT_POWER: ['xenomorph.stalker', 'place.human-industrial'],
  T_X_PERFECT: ['xenomorph.big-chap'],

  T_Y_HUNT_CODE: ['yautja.hunter'],
  T_Y_CLAIM_TROPHY: ['yautja.hunter'],
  T_Y_THERMAL: ['yautja.hunter', 'human.original-character'],
  T_Y_CLOAK: ['yautja.hunter'],
  T_Y_SELF_DESTRUCT: ['yautja.hunter', 'object.faction-equipment'],
  T_Y_BLOODING: ['yautja.hunter', 'xenomorph.drone'],
  T_Y_NET_TRAP: ['yautja.hunter', 'object.faction-equipment'],
  T_Y_CHALLENGE: ['yautja.hunter', 'yautja.unmasked'],

  T_H_MOTION: ['human.original-character', 'object.faction-equipment', 'xenomorph.stalker'],
  T_H_SEAL_DOOR: ['human.original-character', 'place.human-industrial'],
  T_H_FIRETEAM: ['human.original-character'],
  T_H_FLAMER: ['human.original-character', 'object.faction-equipment', 'xenomorph.ovomorph'],
  T_H_NUKE: ['place.human-industrial'],
  T_H_FROSTY: ['human.original-character'],
  T_H_EVAC: ['human.original-character', 'place.human-industrial'],
  T_H_QUARANTINE: ['human.original-character', 'xenomorph.facehugger', 'place.human-industrial'],

  T_E_BLACK_GOO: ['engineer.humanoid', 'hybrid.black-goo-mutant'],
  T_E_CREATION: ['engineer.humanoid', 'xenomorph.drone'],
  T_E_ORRERY: ['engineer.humanoid', 'place.biomechanical'],
  T_E_SACRIFICE: ['engineer.humanoid', 'hybrid.deacon'],

  T_AVP_WHOEVER: ['xenomorph.warrior', 'yautja.hunter'],
  T_AVP_ALLIANCE: ['human.original-character', 'yautja.hunter'],
  T_AVP_3WW: ['human.original-character', 'yautja.hunter', 'xenomorph.drone'],
  T_AVP_HYBRIDIZE: ['hybrid.predalien'],

  'home-hero': ['human.original-character', 'yautja.hunter', 'xenomorph.big-chap'],
  'battle-board': ['human.original-character', 'yautja.hunter', 'xenomorph.warrior', 'place.human-industrial'],
  'campaign-1': ['human.original-character', 'xenomorph.big-chap', 'engineer.space-jockey-fossil'],
  'campaign-2': ['human.original-character', 'xenomorph.queen', 'place.human-industrial'],
  'campaign-3': ['human.original-character', 'yautja.jungle-hunter'],
  'campaign-4': ['yautja.scar', 'xenomorph.drone', 'place.biomechanical'],
  'campaign-5': ['engineer.humanoid', 'hybrid.black-goo-mutant'],
  'campaign-6': ['yautja.berserker', 'yautja.hound'],
  'campaign-7': ['hybrid.predalien', 'human.original-character', 'place.human-industrial'],
  'campaign-8': ['xenomorph.queen', 'yautja.hunter', 'hybrid.predalien', 'engineer.humanoid'],
  'booster-nx01': ['human.original-character', 'xenomorph.big-chap', 'engineer.space-jockey-fossil'],
  'booster-cw02': ['human.original-character', 'xenomorph.queen', 'object.smartgun-system'],
  'booster-hg03': ['yautja.jungle-hunter', 'yautja.hound'],
  'booster-av04': ['yautja.scar', 'xenomorph.drone', 'hybrid.predalien'],
  'booster-ev05': ['engineer.humanoid', 'hybrid.black-goo-mutant', 'xenomorph.gorilla'],
  'booster-px00': ['yautja.hunter', 'human.original-character', 'place.human-industrial'],
});

const BIOLOGICAL_PLACE_IDS = new Set(['L_DERELICT', 'L_BOUVET', 'L_JUGGERNAUT', 'L_XENO_HIVE']);
const NATURAL_PLACE_IDS = new Set(['L_VAL_VERDE', 'L_PRESERVE']);
const HUMANLIKE_UNIT_IDS = new Set(['E_DAVID', 'E_WALTER', 'H_RIPLEY8']);

function assertString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${label}.`);
  return value.trim();
}

function loadCatalogue(source) {
  const context = createContext({ window: {} });
  new Script(source, { filename: 'src/data.js' }).runInContext(context, { timeout: 2_000 });
  const catalogue = context.window.AVP_DATA;
  if (!catalogue || !Array.isArray(catalogue.cards) || catalogue.cards.length !== 158) {
    throw new Error('Expected the canonical 158-card catalogue in src/data.js.');
  }
  return catalogue;
}

function selectCardProfile(card) {
  const tags = new Set(Array.isArray(card.tags) ? card.tags : []);
  const hasSpecificProfile = Object.hasOwn(SPECIFIC_PROFILE_BY_ID, card.id);
  const rules = [
    {
      name: 'specific-subject',
      matches: hasSpecificProfile,
      profile: SPECIFIC_PROFILE_BY_ID[card.id],
    },
    {
      name: 'equipment',
      matches: !hasSpecificProfile && card.type === 'EQUIPMENT',
      profile: 'object.faction-equipment',
    },
    {
      name: 'tactic',
      matches: !hasSpecificProfile && card.type === 'TACTIC',
      profile: 'scene.multi-subject-original',
    },
    {
      name: 'biomechanical-location',
      matches: !hasSpecificProfile && card.type === 'LOCATION' && BIOLOGICAL_PLACE_IDS.has(card.id),
      profile: 'place.biomechanical',
    },
    {
      name: 'natural-location',
      matches: !hasSpecificProfile && card.type === 'LOCATION' && NATURAL_PLACE_IDS.has(card.id),
      profile: 'original.unclassified',
    },
    {
      name: 'industrial-location',
      matches:
        !hasSpecificProfile &&
        card.type === 'LOCATION' &&
        !BIOLOGICAL_PLACE_IDS.has(card.id) &&
        !NATURAL_PLACE_IDS.has(card.id),
      profile: tags.has('ship') && card.faction === 'YAUTJA'
        ? 'object.faction-equipment'
        : 'place.human-industrial',
    },
    {
      name: 'original-human-unit',
      matches:
        !hasSpecificProfile &&
        card.type === 'UNIT' &&
        (card.faction === 'HUMAN' || HUMANLIKE_UNIT_IDS.has(card.id)),
      profile: 'human.original-character',
    },
    {
      name: 'baseline-xenomorph-unit',
      matches:
        !hasSpecificProfile &&
        card.type === 'UNIT' &&
        card.faction === 'XENO' &&
        !tags.has('pathogen'),
      profile: 'xenomorph.standard',
    },
    {
      name: 'pathogen-unit',
      matches:
        !hasSpecificProfile &&
        card.type === 'UNIT' &&
        tags.has('pathogen'),
      profile: 'hybrid.black-goo-mutant',
    },
    {
      name: 'yautja-unit',
      matches: !hasSpecificProfile && card.type === 'UNIT' && card.faction === 'YAUTJA',
      profile: 'yautja.hunter',
    },
    {
      name: 'engineer-unit',
      matches:
        !hasSpecificProfile &&
        card.type === 'UNIT' &&
        card.faction === 'ENGINEER' &&
        !HUMANLIKE_UNIT_IDS.has(card.id) &&
        !tags.has('pathogen'),
      profile: 'engineer.humanoid',
    },
    {
      name: 'hybrid-unit',
      matches:
        !hasSpecificProfile &&
        card.type === 'UNIT' &&
        card.faction === 'HYBRID' &&
        !HUMANLIKE_UNIT_IDS.has(card.id),
      profile: 'original.unclassified',
    },
  ].filter((rule) => rule.matches);

  if (rules.length !== 1) {
    throw new Error(`Expected exactly one profile rule for ${card.id}; matched ${rules.map((rule) => rule.name).join(', ') || 'none'}.`);
  }
  return rules[0].profile;
}

function cardPriority(card, profile) {
  const tags = new Set(Array.isArray(card.tags) ? card.tags : []);
  const sourceSheet = typeof card.source?.sheet === 'string' ? card.source.sheet : '';
  if (
    card.source?.prototype === true ||
    card.set === 'PX00' ||
    tags.has('cut') ||
    tags.has('cut-concept') ||
    /supprim|annul|proto/i.test(sourceSheet)
  ) {
    return 'P2';
  }
  if (card.type === 'UNIT' && profile !== 'human.original-character' && profile !== 'original.unclassified') {
    return 'P0';
  }
  return 'P1';
}

function makeCardAsset(card) {
  const source = card.source ?? {};
  const profile = selectCardProfile(card);
  return {
    id: assertString(card.id, 'card id'),
    kind: 'card',
    type: assertString(card.type, `type for ${card.id}`),
    faction: assertString(card.faction, `faction for ${card.id}`),
    sourceName: `${card.id.toLowerCase()}-v1.png`,
    profile,
    subject: assertString(card.name, `subject for ${card.id}`),
    continuity: {
      set: assertString(card.set, `set for ${card.id}`),
      workbook: assertString(source.workbook, `source workbook for ${card.id}`),
      sheet: assertString(source.sheet, `source sheet for ${card.id}`),
      entry: assertString(source.entry, `source entry for ${card.id}`),
      prototype: source.prototype === true,
    },
    priority: cardPriority(card, profile),
  };
}

function makeSceneAsset([id, sourceName], catalogue) {
  if (id === 'home-hero') {
    return {
      id,
      kind: 'scene',
      type: 'SCENE',
      faction: 'MULTI',
      sourceName,
      profile: 'scene.multi-subject-original',
      subject: `${catalogue.title} — confrontation principale`,
      continuity: {
        set: 'CORE',
        workbook: 'src/data.js',
        sheet: 'title',
        entry: catalogue.title,
        prototype: false,
      },
      priority: 'P0',
    };
  }

  if (id === 'battle-board') {
    return {
      id,
      kind: 'scene',
      type: 'SCENE',
      faction: 'MULTI',
      sourceName,
      profile: 'scene.multi-subject-original',
      subject: 'Plateau de bataille en trois voies',
      continuity: {
        set: 'CORE',
        workbook: 'src/data.js',
        sheet: 'rules',
        entry: catalogue.rules?.summary ?? 'Duel sur trois voies',
        prototype: false,
      },
      priority: 'P0',
    };
  }

  if (id.startsWith('campaign-')) {
    const missionId = Number(id.slice('campaign-'.length));
    const mission = catalogue.campaign?.find((entry) => entry.id === missionId);
    if (!mission) throw new Error(`Missing campaign source for ${id}.`);
    return {
      id,
      kind: 'scene',
      type: 'SCENE',
      faction: Array.isArray(mission.factions) ? mission.factions.join('+') : 'MULTI',
      sourceName,
      profile: 'scene.multi-subject-original',
      subject: `${mission.name} — ${mission.subtitle}`,
      continuity: {
        set: catalogue.boosters?.find((booster) => booster.id === mission.pack)?.set ?? 'CORE',
        workbook: 'src/data.js',
        sheet: 'campaign',
        entry: mission.name,
        prototype: false,
      },
      priority: 'P0',
    };
  }

  if (id.startsWith('booster-')) {
    const set = id.slice('booster-'.length).toUpperCase();
    const booster = catalogue.boosters?.find((entry) => entry.set === set);
    if (!booster) throw new Error(`Missing booster source for ${id}.`);
    return {
      id,
      kind: 'scene',
      type: 'SCENE',
      faction: 'MULTI',
      sourceName,
      profile: 'scene.multi-subject-original',
      subject: `${booster.name} — ${booster.subtitle}`,
      continuity: {
        set,
        workbook: 'src/data.js',
        sheet: 'boosters',
        entry: booster.name,
        prototype: booster.prototype === true,
      },
      priority: booster.prototype === true ? 'P2' : 'P1',
    };
  }

  throw new Error(`No scene source rule for ${id}.`);
}

function assertAsset(asset, profileIds) {
  const secondaryProfiles = asset.secondaryProfiles ?? [];
  if (
    !Array.isArray(secondaryProfiles) ||
    new Set([asset.profile, ...secondaryProfiles]).size !== secondaryProfiles.length + 1
  ) {
    throw new Error('Invalid or repeated secondaryProfiles for ' + asset.kind + ':' + asset.id + '.');
  }
  for (const profile of secondaryProfiles) {
    if (!profileIds.has(profile)) {
      throw new Error('Unknown secondary profile ' + profile + ' assigned to ' + asset.kind + ':' + asset.id + '.');
    }
  }
  if (asset.profile === 'scene.multi-subject-original' && secondaryProfiles.length === 0) {
    throw new Error('Multi-subject asset ' + asset.kind + ':' + asset.id + ' requires secondaryProfiles.');
  }
  if (!profileIds.has(asset.profile)) {
    throw new Error(`Unknown profile ${asset.profile} assigned to ${asset.kind}:${asset.id}.`);
  }
  if (!/^[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.png$/.test(asset.sourceName)) {
    throw new Error(`Unsafe sourceName for ${asset.kind}:${asset.id}: ${asset.sourceName}`);
  }
  if (!['P0', 'P1', 'P2'].includes(asset.priority)) {
    throw new Error(`Unknown priority for ${asset.kind}:${asset.id}: ${asset.priority}`);
  }
}

function firstDifference(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const length = Math.max(expectedLines.length, actualLines.length);
  for (let index = 0; index < length; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return `line ${index + 1}\nexpected: ${expectedLines[index] ?? '<EOF>'}\nactual:   ${actualLines[index] ?? '<EOF>'}`;
    }
  }
  return 'unknown byte difference';
}

const [dataSource, profilesSource] = await Promise.all([
  readFile(dataPath, 'utf8'),
  readFile(profilesPath, 'utf8'),
]);
const catalogue = loadCatalogue(dataSource);
const profilesDocument = JSON.parse(profilesSource);
if (!Array.isArray(profilesDocument.profiles) || profilesDocument.profiles.length === 0) {
  throw new Error('Morphology profile registry is empty or invalid.');
}
const extensionNames = profilesDocument.extensions ?? [];
if (!Array.isArray(extensionNames)) throw new Error('Morphology profile extensions must be an array.');
for (const name of extensionNames) {
  if (
    typeof name !== 'string' ||
    basename(name) !== name ||
    !/^avp-morphology-[a-z0-9-]+\.v[1-9][0-9]*\.json$/.test(name)
  ) {
    throw new Error(`Unsafe morphology profile extension: ${String(name)}`);
  }
}
const extensionDocuments = await Promise.all(
  extensionNames.map(async (name) => {
    const extension = JSON.parse(await readFile(resolve(root, 'art-direction', name), 'utf8'));
    if (extension.baseRegistry !== `${profilesDocument.schema}@${profilesDocument.version}`) {
      throw new Error(`Morphology extension ${name} has an invalid baseRegistry.`);
    }
    if (!Array.isArray(extension.profiles) || extension.profiles.length === 0) {
      throw new Error(`Morphology extension ${name} is empty or invalid.`);
    }
    return { name, document: extension };
  }),
);
const profileIds = new Set();
const allProfiles = [
  ...profilesDocument.profiles,
  ...extensionDocuments.flatMap((extension) => extension.document.profiles),
];
for (const profile of allProfiles) {
  const profileId = assertString(profile.id, 'morphology profile id');
  if (profileIds.has(profileId)) throw new Error(`Duplicate morphology profile id: ${profileId}`);
  profileIds.add(profileId);
}

const catalogueIds = new Set(catalogue.cards.map((card) => card.id));
const orphanSpecificIds = Object.keys(SPECIFIC_PROFILE_BY_ID).filter((id) => !catalogueIds.has(id));
if (orphanSpecificIds.length > 0) {
  throw new Error(`Specific profile rules reference missing cards: ${orphanSpecificIds.join(', ')}`);
}

const rawAssets = [
  ...catalogue.cards.map(makeCardAsset),
  ...SCENE_FILES.map((scene) => makeSceneAsset(scene, catalogue)),
];
const knownAssetIds = new Set(rawAssets.map(({ id }) => id));
const orphanSecondaryIds = Object.keys(SECONDARY_PROFILES_BY_ID).filter((id) => !knownAssetIds.has(id));
if (orphanSecondaryIds.length > 0) {
  throw new Error('Secondary profile rules reference missing assets: ' + orphanSecondaryIds.join(', '));
}
const assets = rawAssets.map((asset) => {
  const secondaryProfiles = SECONDARY_PROFILES_BY_ID[asset.id];
  return secondaryProfiles ? { ...asset, secondaryProfiles: [...secondaryProfiles] } : asset;
});
for (const asset of assets) assertAsset(asset, profileIds);

const uniqueIds = new Set(assets.map((asset) => `${asset.kind}:${asset.id}`));
const uniqueSourceNames = new Set(assets.map((asset) => asset.sourceName));
const cardCount = assets.filter((asset) => asset.kind === 'card').length;
const sceneCount = assets.filter((asset) => asset.kind === 'scene').length;
if (
  cardCount !== 158 ||
  sceneCount !== 16 ||
  assets.length !== 174 ||
  uniqueIds.size !== 174 ||
  uniqueSourceNames.size !== 174
) {
  throw new Error(
    `Fidelity map coverage failure: cards=${cardCount}, scenes=${sceneCount}, total=${assets.length}, ` +
      `uniqueIds=${uniqueIds.size}, uniqueSourceNames=${uniqueSourceNames.size}.`,
  );
}

const document = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  schema: 'avp-asset-fidelity-map-v1',
  version: '1.0.0',
  generatedFrom: {
    catalogue: 'src/data.js',
    catalogueVersion: catalogue.version,
    profiles: 'art-direction/avp-morphology-profiles.v1.json',
    profilesVersion: profilesDocument.version,
    profileExtensions: extensionDocuments.map(({ name, document: extension }) => ({
      file: `art-direction/${name}`,
      version: extension.version,
    })),
  },
  expected: { cards: 158, scenes: 16, total: 174 },
  priorityDefinitions: {
    P0: 'Release-defining creature or multi-subject scene; review and retry first.',
    P1: 'Supporting character, object, action or place; required before release.',
    P2: 'Separated prototype, cut or alternate continuity; required before its archive wave is enabled.',
  },
  assets,
};
const serialized = `${JSON.stringify(document, null, 2)}\n`;

if (writeRequested) {
  let current = null;
  try {
    current = await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (current !== serialized) await writeFile(outputPath, serialized, 'utf8');
  console.log(`Fidelity map ${current === serialized ? 'already current' : 'written'}: 158 cards + 16 scenes = 174 assets.`);
} else {
  let current;
  try {
    current = await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error('Fidelity map is missing. Re-run with --write to create it explicitly.');
    }
    throw error;
  }
  if (current !== serialized) {
    throw new Error(`Fidelity map is stale (${firstDifference(serialized, current)}). Re-run with --write.`);
  }
  console.log('Fidelity map verified: 158 cards + 16 scenes = 174 assets.');
}
