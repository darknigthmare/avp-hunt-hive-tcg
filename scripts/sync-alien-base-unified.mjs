import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,Script} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=key=>{const index=process.argv.indexOf(key);return index<0?null:process.argv[index+1];};
const base=resolve(arg('--base')||join(root,'../alien_base'));
const snapshot=JSON.parse(await readFile(join(base,'exports/avp-hunt-hive-tcg.v3.json'),'utf8'));
assert.equal(snapshot.schema,'alien-base/tcg-public-v3');
assert.equal(snapshot.registry.v1,68);
assert.equal(snapshot.registry.v2,632);
// Read catalog independently, never rewrite cards or saves.
const ctx=createContext({window:{}});
new Script(await readFile(join(root,'src/data.js'),'utf8')).runInContext(ctx,{timeout:2000});
const locals=ctx.window.AVP_DATA.cards;
assert.equal(locals.length,158);
assert.equal(Object.keys(snapshot.byCardId).length,locals.length);
for(const c of locals)assert.equal(snapshot.byCardId[c.id]?.name,c.name,'ID/name mismatch '+c.id);
const generated='/* Export public documentaire, sans accès au dépôt privé. Généré depuis Alien_base PR #19. */\nwindow.AVP_ALIEN_BASE = '+JSON.stringify(snapshot,null,2)+';\n';
const output=join(root,'src/alien-base.js');
if(process.argv.includes('--publish')){
 await writeFile(output,generated);console.log('Published AVP TCG federation v3');
}else{
 assert.equal(await readFile(output,'utf8'),generated,'Outdated v3 snapshot; run with --publish and review the diff');
 console.log('AVP TCG v3 aligned with Alien_base: 158 cards, 68 codex entries, 632 registry subjects');
}
