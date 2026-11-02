import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Script,createContext} from 'node:vm';
const root=new URL('../',import.meta.url);
const context=createContext({window:{}});
for(const name of ['data','alien-base']){
  const code=await readFile(new URL('src/'+name+'.js',root),'utf8');
  new Script(code,{filename:name}).runInContext(context,{timeout:2000});
}
const cards=context.window.AVP_DATA.cards,base=context.window.AVP_ALIEN_BASE;

test('the 158 actual TCG cards retain exact shared IDs and their balancing fields',()=>{
 assert.equal(base.schema,'alien-base/tcg-public-v3');
 assert.equal(cards.length,158);
 assert.equal(base.registry.gameCards,158);
 assert.equal(Object.keys(base.byCardId).length,158);
 assert.equal(new Set(cards.map(x=>x.id)).size,158);
 for(const c of cards){
  const link=base.byCardId[c.id];
  assert.ok(link?.id && link.name && link.category,c.id);
  assert.equal(link.name,c.name,c.id+' name mismatch');
  assert.equal(link.registryCategory,'game-card');
  assert.match(link.id,/^card[.]avp[.][a-z0-9_]+$/);
  assert.equal(link.sourceWorkbookVerified,false);
  for(const field of ['attack','health','cost','rarity','faction'])assert.equal(Object.hasOwn(link,field),false,'gameplay field leaked '+c.id+':'+field);
  if(c.source.prototype)assert.equal(link.continuityStatus,'cut_or_prototype');
 }
});

test('the newer 632 entities are indexed without publishing extra playable cards',()=>{
 assert.equal(base.registry.v1,68);
 assert.equal(base.registry.v2,632);
 assert.equal(base.registry.verifiedLoreLinks,9);
 assert.equal(base.registry.documentaryProposals,28);
 assert.equal(base.registry.gameContentAdditions,0);
 assert.equal(base.codex.entries.length,68);
 assert.equal(new Set(base.codex.entries.map(x=>x.id)).size,68);
 assert.equal(base.codex.entries.reduce((count,e)=>count+e.linkedCardIds.length,0),40);
 const ids=new Set(cards.map(c=>c.id));
 for(const entry of base.codex.entries){
  assert.ok(entry.name&&entry.type&&entry.scope&&entry.review);
  assert.ok(Array.isArray(entry.sourceWorks));
  for(const id of entry.linkedCardIds)assert.ok(ids.has(id));
 }
});

test('the biological classification is distinct from card faction and v1 associations',()=>{
 assert.equal(base.byCardId.E_DAVID.category,'synthetic');
 assert.equal(base.byCardId.X_GRID.category,'xenomorph_individual');
 assert.equal(base.byCardId.H_POWERLOADER_RIPLEY.category,'character_variant');
 assert.ok(base.byCardId.H_POWERLOADER_RIPLEY.relatedEntityIds.includes(base.byCardId.H_RIPLEY.id));
 assert.ok(base.byCardId.H_POWERLOADER_RIPLEY.relatedEntityIds.includes(base.byCardId.EQ_POWER_LOADER.id));
 assert.equal(base.byCardId.X_OVOMORPH.category,'life_stage');
 assert.equal(base.byCardId.X_FACEHUGGER.canonicalEntityId,'bio.xenomorph.facehugger');
 assert.equal(base.byCardId.H_WORKING_JOE.legacyMainV1Link.catalogueId,'faction.seegson');
 assert.equal(base.byCardId.H_WORKING_JOE.canonicalEntityId,null);
 assert.ok(base.codex.entries.find(x=>x.id==='weapon.m41a').linkedCardIds.includes('EQ_PULSE_RIFLE'));
 assert.equal(base.byCardId.EQ_PULSE_RIFLE.legacyMainV1Link.catalogueId,'weapon.m41a');
 assert.equal(base.byCardId.H_WEYLAND_OP.legacyMainV1Link.relation,'affiliation_only');
});

test('28 crossgame leads remain non-certified and contain no private source paths',()=>{
 const references=Object.values(base.byCardId).flatMap(x=>x.crossgameReferences||[]);
 assert.equal(references.length,28);
 assert.equal(Object.values(base.byCardId).filter(x=>x.crossgameReferences.length).length,25);
 const supported=new Set(['xeno-trace','aliens-tantalus-frontier','Yautja-hive-warriors','world-hive-wars']);
 for(const r of references){
  assert.ok(supported.has(r.project));
  assert.ok(r.sourceId && r.sourceName);
  assert.equal(r.relationship,'unverified_candidate');
  assert.ok(!('sourcePath' in r)&&!('sourceRevision' in r)&&!('candidateRegistryEntityId' in r));
 }
});

test('Codex is usable from Collection and Archive without changing deck or duel',async()=>{
 const app=await readFile(new URL('src/app.js',root),'utf8');
 const css=await readFile(new URL('assets/styles.css',root),'utf8');
 const html=await readFile(new URL('index.html',root),'utf8');
 const sw=await readFile(new URL('sw.js',root),'utf8');
 const server=await readFile(new URL('scripts/serve.mjs',root),'utf8');
 const build=await readFile(new URL('scripts/build.mjs',root),'utf8');
 assert.match(app,/function renderAlienBaseCodex/);
 assert.match(app,/function showAlienBaseCodex/);
 assert.match(app,/function updateAlienCodexFilter/);
 assert.match(app,/data-codex-filter/);
 assert.match(app,/data-action="codex-detail"/);
 assert.ok(app.includes('renderAlienBaseCodex()}</div>'));
 assert.ok(app.includes('data-screen="archive"'));
 assert.match(app,/Alien_base — fiche mutualisée/);
 assert.match(css,/\.alien-codex-list/);
 assert.ok(html.includes('/src/alien-base.js'));
 assert.ok(sw.includes('/src/alien-base.js'));
 assert.ok(server.includes('src/alien-base.js'));
 assert.ok(build.includes('alien-base/tcg-public-v3'));
});

test('research index is read-only: 200 arsenal dossiers and 16 pending subjects',()=>{
 assert.equal(base.codex.researchWeapons.length,200);
 assert.equal(base.codex.researchLeads.length,16);
 for(const weapon of base.codex.researchWeapons){
  assert.equal(weapon.admittedInTcg,false);
  assert.equal(weapon.visualCertified,false);
  for(const field of ['attack','cost','health','damage'])assert.equal(Object.hasOwn(weapon,field),false);
 }
 for(const lead of base.codex.researchLeads){
  assert.equal(lead.admittedInTcg,false);
  assert.equal(lead.researchStatus,'source_pending');
 }
});
test('the Codex offers mutually exclusive history/arsenal/leads UI modes',async()=>{
 const js=await readFile(new URL('src/app.js',root),'utf8');
 const css=await readFile(new URL('assets/styles.css',root),'utf8');
 assert.ok(js.includes('function renderAlienResearch'));
 assert.ok(js.includes('function renderAlienBaseModeTabs'));
 assert.ok(js.includes('function showAlienResearchDetail'));
 assert.ok(js.includes('data-action="codex-research-detail"'));
 assert.ok(js.includes('data-action="codex-mode"'));
 assert.ok(css.includes('.alien-codex-tabs'));
});

test('latest unmerged Alien_base updates are visible without adding any playable card',()=>{
 const update=base.codex.registryUpdates;
 assert.equal(base.registry.v2,632);
 assert.equal(update.status,'UNMERGED_RESEARCH_DELTA');
 assert.equal(update.baselineCount,632);
 assert.equal(update.candidateRegistryCount,652);
 assert.equal(update.newEntities.length,20);
 assert.equal(update.works.length,29);
 assert.equal(update.aliases.length,3);
 assert.equal(update.biologyNotes.length,3);
 assert.equal(new Set(update.newEntities.map(e=>e.id)).size,20);
 for(const e of update.newEntities){
  assert.equal(e.verified,false);
  assert.equal(e.gameplayAdmission,false);
  assert.ok(!('cost' in e)&&!('attack' in e)&&!('health' in e));
  for(const id of e.linkedCardIds)assert.ok(cards.some(c=>c.id===id));
 }
 for(const e of update.works){
  assert.equal(e.fidelityVerified,false);
  assert.equal(e.gameplayAdmission,false);
 }
 for(const e of update.aliases){
  assert.equal(e.verified,false);
  assert.equal(e.gameplayAdmission,false);
  for(const id of e.linkedCardIds)assert.ok(cards.some(c=>c.id===id));
 }
 assert.equal(update.newEntities.filter(e=>e.linkedCardIds.length).length,6);
 assert.ok(update.newEntities.some(e=>e.name==='Scar Predator'&&e.linkedCardIds.includes('Y_SCAR')));
 assert.ok(update.aliases.some(e=>e.localId==='samurai_yautja'&&e.linkedCardIds.includes('Y_SAMURAI')));
 assert.ok(!update.aliases.some(e=>e.localId==='alpha_yautja'&&e.linkedCardIds.length));
 assert.ok(!update.aliases.some(e=>e.localId==='viking_yautja'&&e.linkedCardIds.length));
});
test('newest reference views and card annotations are implemented as research-only UI',async()=>{
 const code=await readFile(new URL('src/app.js',root),'utf8');
 assert.ok(code.includes('function renderAlienBaseUpdates'));
 assert.ok(code.includes('function showAlienBaseUpdateDetail'));
 assert.ok(code.includes('function pendingAlienBaseLinks'));
 assert.ok(code.includes('data-action="codex-update-detail"'));
 assert.ok(code.includes("['reference','weapons','leads','apex','media']"));
});
