import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const expectedHash = '23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f';

test('le standalone AVP 1.0.0 conserve son contenu livré', async () => {
  const [index, original] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url)),
    readFile(new URL('../AVP_HUNT_HIVE_TCG_STANDALONE.html', import.meta.url)),
  ]);

  assert.deepEqual(index, original);
  assert.equal(createHash('sha256').update(original).digest('hex'), expectedHash);

  const html = original.toString('utf8');
  assert.match(html, /<title>AVP: HUNT \/\/ HIVE TCG — Standalone<\/title>/);
  assert.match(html, /window\.AVP_DATA\s*=/);
  assert.match(html, /window\.AVPEngine\s*=/);
  assert.match(html, /data-action="choose-starter"/);

  const match = html.match(/window\.AVP_DATA\s*=\s*(\{.*?\});\s*<\/script>\s*<script>/s);
  assert.ok(match, 'Le catalogue AVP_DATA doit rester extractible.');
  const data = JSON.parse(match[1]);
  assert.equal(data.version, '1.0.0');
  assert.equal(data.cards.length, 158);
  assert.equal(data.campaign.length, 8);
  assert.deepEqual(Object.keys(data.starterDecks).sort(), ['HUMAN', 'XENO', 'YAUTJA']);
  for (const deck of Object.values(data.starterDecks)) {
    assert.equal(deck.count, 30);
    assert.equal(Object.values(deck.cards).reduce((total, copies) => total + copies, 0), 30);
  }
});
