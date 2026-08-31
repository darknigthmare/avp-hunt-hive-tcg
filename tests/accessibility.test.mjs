import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const css = await readFile(new URL('../assets/styles.css', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(await readFile(new URL('../src/data.js', import.meta.url), 'utf8'), context);

// These palette checks supplement, rather than replace, real browser axe audits.
function declaration(selector, property) {
  let value;
  for (const match of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!match[1].trim().split(',').map(part => part.trim()).includes(selector)) continue;
    for (const field of match[2].split(';')) {
      const colon = field.indexOf(':');
      if (field.slice(0, colon).trim() === property) value = field.slice(colon + 1).trim();
    }
  }
  assert.ok(value, `Missing ${selector} ${property}`);
  return value;
}

function luminance(hex) {
  assert.match(hex, /^#[a-f\d]{6}$/i, 'Contrast checks require an opaque sRGB color');
  const rgb = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

function assertContrast(foreground, background, label) {
  const a = luminance(foreground), b = luminance(background);
  const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1 is below 4.5:1`);
}

test('normal and secondary text meet AA on all opaque reading surfaces', () => {
  for (const selector of ['.panel', '.modal', '.modal-head', '.hero-copy', '.lane', '.card-inner']) {
    const background = declaration(selector, 'background');
    assertContrast(declaration(':root', '--text'), background, `${selector} normal text`);
    assertContrast(declaration(':root', '--muted'), background, `${selector} secondary text`);
  }
});

test('all faction labels and energy costs meet AA on the card palette', () => {
  const background = declaration('.card-inner', 'background');
  for (const [id, faction] of Object.entries(context.window.AVP_DATA.factions)) {
    assertContrast(faction.accent, background, `${id} label`);
    assertContrast(declaration('.card-cost', 'color'), faction.accent, `${id} energy cost`);
  }
  assertContrast(declaration('.card-text', 'color'), background, 'Card rules');
  assertContrast(declaration('.collector', 'color'), background, 'Collector number');
});

test('primary actions and missing collection counts meet AA', () => {
  assertContrast(declaration('.btn.primary', 'color'), declaration('.btn.primary', 'background'), 'Primary action');
  assertContrast(declaration('.owned-badge.zero', 'color'), declaration('.owned-badge.zero', 'background'), 'Missing collection count');
});

test('locked content and unavailable hand cards retain readable text', () => {
  for (const selector of ['.pack.locked', '.mission.locked']) {
    assert.equal(declaration(selector, 'opacity'), '1');
    assert.equal(declaration(selector, 'filter'), 'none');
  }
  assert.doesNotMatch(declaration('.hand-card.unplayable', 'filter'), /brightness|opacity/);
  assert.equal(declaration('.mission-num', 'opacity'), '1');
});

test('card-wide shine never overlays the rule text', () => {
  assert.equal(declaration('.tcg-card:before', 'display'), 'none');
  assert.equal(declaration('.tcg-card.r-PR:after', 'display'), 'none');
  assert.match(css, /\.card-art:before\{content:/, 'Foil remains on the original artwork');
});

test('short screens can scroll a booster opening to its exit action', () => {
  assert.equal(declaration('.booster-open', 'overflow'), 'auto');
});

test('attack and current-health controls stay in flow, outside card statistics', () => {
  assert.equal(declaration('.unit-card-surface .unit-health', 'position'), 'static');
  assert.equal(declaration('.unit-card-surface .attack-btn', 'position'), 'static');
  assert.equal(declaration('.unit-card-surface .attack-btn', 'min-height'), '44px');
});

test('completed mission stamp stays below rewards and replay actions', () => {
  assert.equal(declaration('.complete-stamp', 'position'), 'static');
  assert.equal(declaration('.complete-stamp', 'transform'), 'none');
  assert.equal(declaration('.complete-stamp', 'margin-top'), '14px');
});
