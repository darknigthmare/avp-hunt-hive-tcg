import { readFileSync } from 'node:fs';
import { createContext, Script } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
test('all 158 TCG cards have stable shared IDs without modifying attack, cost or source JSON',()=>{
 const context=createContext({window:{}});
 new Script(readFileSync(new URL('../src/data.js',import.meta.url),'utf8')).runInContext(context);
 const before=JSON.stringify(context.window.AVP_DATA);
 new Script(readFileSync(new URL('../src/alien-base-v1.js',import.meta.url),'utf8')).runInContext(context);
 const {cards}=context.window.AVP_DATA;
 assert.equal(cards.length,158);
 for(const card of cards){assert.ok(card.sharedEntityId,card.id);assert.equal(card.sharedEntityId,context.window.resolveAlienBaseCardV1(card.id).id)}
 assert.equal(JSON.stringify(context.window.AVP_DATA),before);
 assert.equal(cards.find(x=>x.id==='X_OVOMORPH').sharedLoreEntityId,'bio.xenomorph.ovomorph');
 assert.equal(context.window.resolveAlienBaseCardV1('missing-card'),null);
});
test('publication contract lists and precaches the local bridge',()=>{
 const file=readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(file.includes("'src/alien-base-v1.js'"));
 assert.ok(sw.includes("'/src/alien-base-v1.js'"));
 assert.ok(index.indexOf('/src/data.js')<index.indexOf('/src/alien-base-v1.js'));
});
