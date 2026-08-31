import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const expectedHash = '23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f';

async function catalog() {
  const source = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
  const match = source.match(/window\.AVP_DATA\s*=\s*(\{[\s\S]*\});\s*$/);
  assert.ok(match, 'The modular catalog must remain JSON-extractable.');
  return JSON.parse(match[1]);
}

test('the delivered standalone stays immutable and verifiable', async () => {
  const original = await readFile(new URL('../AVP_HUNT_HIVE_TCG_STANDALONE.html', import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'), expectedHash);
  const html = original.toString('utf8');
  assert.match(html, /<title>AVP: HUNT \/\/ HIVE TCG — Standalone<\/title>/);
  assert.match(html, /window\.AVP_DATA\s*=/);
  assert.match(html, /window\.AVPEngine\s*=/);
});

test('the production entry point loads the modular layers in order', async () => {
  const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const data = index.indexOf('/src/data.js');
  const engine = index.indexOf('/src/engine.js');
  const app = index.indexOf('/src/app.js');
  assert.ok(data > 0 && data < engine && engine < app);
  assert.match(index, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(index, /id="a11y-status"/);
  assert.doesNotMatch(index, /window\.AVP_DATA\s*=/);
});

test('the complete 1.0.0 catalog and campaign remain coherent', async () => {
  const data = await catalog();
  assert.equal(data.version, '1.0.0');
  assert.equal(data.cards.length, 158);
  assert.equal(data.campaign.length, 8);
  assert.equal(new Set(data.cards.map((card) => card.id)).size, data.cards.length);
  assert.deepEqual(Object.keys(data.starterDecks).sort(), ['HUMAN', 'XENO', 'YAUTJA']);

  const allowedTypes = new Set(['UNIT', 'TACTIC', 'EQUIPMENT', 'LOCATION']);
  for (const [index, card] of data.cards.entries()) {
    assert.equal(card.index, index);
    assert.ok(allowedTypes.has(card.type), `Unknown type for ${card.id}`);
    assert.ok(data.factions[card.faction], `Unknown faction for ${card.id}`);
    assert.ok(data.rarities[card.rarity], `Unknown rarity for ${card.id}`);
    assert.ok(data.sets[card.set], `Unknown set for ${card.id}`);
    assert.ok(Number.isInteger(card.cost) && card.cost >= 0);
    assert.ok(Number.isInteger(card.artSeed));
    assert.ok(card.source?.workbook && card.source?.sheet && card.source?.entry);
  }

  for (const deck of Object.values(data.starterDecks)) {
    assert.equal(deck.count, data.rules.deckSize);
    assert.equal(Object.values(deck.cards).reduce((total, copies) => total + copies, 0), data.rules.deckSize);
  }
  for (const [index, mission] of data.campaign.entries()) {
    assert.equal(mission.id, index + 1);
    assert.ok(data.boosters.some((booster) => booster.id === mission.pack));
  }
});
