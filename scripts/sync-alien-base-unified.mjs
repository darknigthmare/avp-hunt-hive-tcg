// Export deterministic offline snapshot from the unified Alien_base PR #11 structure.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,Script} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=key=>{const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1];};
const base=resolve(arg('--base')||join(root,'../alien_base'));
const mode=process.argv.includes('--publish')?'publish':'check';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const bridge=await read(join(base,'data/integrations/avp-tcg-bridge.v1.json'));
const registry=await read(join(base,'data/entities.v1.json'));
const bindings=await read(join(base,'data/bindings.v1.json'));
assert.equal(bridge.schema,'alien-base/tcg-unified-bridge-v1');
const reg=new Map(registry.entities.map(e=>[e.id,e]));
const byCard=new Map(bridge.records.map(r=>[r.cardId,r]));
const bind=bindings.games['avp-hunt-hive-tcg'].groups.cards;
const context=createContext({window:{}});
new Script(await readFile(join(root,'src/data.js'),'utf8')).runInContext(context,{timeout:2000});
const cards=context.window.AVP_DATA.cards;
assert.equal(cards.length,158);
const byCardId={};
for(const card of cards){
 const r=byCard.get(card.id);
 assert.ok(r&&reg.has(r.registryEntityId)&&bind[card.id]?.id===r.registryEntityId,'Missing unified entity '+card.id);
 const e=reg.get(r.registryEntityId);
 byCardId[card.id]={
  id:r.registryEntityId,name:e.name,category:r.semanticCategory,
  registryCategory:e.category,canonicalEntityId:r.canonicalEntityId,
  continuityStatus:r.continuityStatus,researchStatus:r.researchStatus,summary:r.contextNote||'',
  sourceRefs:e.sourceRefs||[],
  relatedEntityIds:r.relatedCardIds.map(id=>byCard.get(id)?.registryEntityId).filter(Boolean),
  crossgameReferences:r.linkedGameCandidates.map(x=>({
   project:x.project,sourceId:x.sourceId,sourceName:x.sourceName,sourcePath:x.sourcePath,sourceRevision:x.sourceRevision,
   candidateRegistryEntityId:x.candidateRegistryEntityId,relationship:x.relationship
  }))
 };
}
assert.equal(Object.keys(byCardId).length,158);
const serialized='/* Snapshot public, sans appel au dépôt privé : généré depuis alien_base. */\nwindow.AVP_ALIEN_BASE = '+JSON.stringify({schema:'alien-base/tcg-public-v1',revision:bridge.revision,byCardId},null,2)+';\n';
const output=join(root,'src/alien-base.js');
if(mode==='publish'){
 await writeFile(output,serialized);
 console.log('Published unified registry snapshot to '+output);
}else {
 assert.equal(await readFile(output,'utf8'),serialized,'Alien_base snapshot changed; run --publish and review diff');
 console.log('Unified Alien_base registry synchronized for all '+cards.length+' cards.');
}
