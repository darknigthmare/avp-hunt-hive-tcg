import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext,Script} from 'node:vm';

const root=new URL('../',import.meta.url);
const ctx=createContext({window:{}});
for(const name of ['data','alien-base'])new Script(await readFile(new URL('src/'+name+'.js',root),'utf8')).runInContext(ctx,{timeout:2000});
const cards=ctx.window.AVP_DATA.cards;
const base=ctx.window.AVP_ALIEN_BASE;

test('all 158 TCG cards have a stable Alien_base reference without changing their stats',()=>{
  assert.equal(cards.length,158);
  assert.equal(base.schema,'alien-base/tcg-public-v1');
  assert.equal(Object.keys(base.byCardId).length,158);
  for(const c of cards){
    const link=base.byCardId[c.id];
    assert.ok(link?.id && link.name && link.category,c.id+' missing');
    assert.ok(/^[a-z][a-z0-9_]*[.][a-z0-9-]+$/.test(link.id),c.id+' invalid entity ID');
    assert.ok(!('attack' in link)&&!('health' in link)&&!('cost' in link),c.id+' pollutes lore with balance stats');
    if(c.source.prototype)assert.equal(link.continuityStatus,'cut_or_prototype');
  }
});

test('biological taxonomy does not blindly repeat TCG factions',()=>{
  assert.equal(base.byCardId.E_DAVID.category,'synthetic');
  assert.equal(base.byCardId.X_GRID.category,'xenomorph_individual');
  assert.equal(base.byCardId.H_POWERLOADER_RIPLEY.category,'character_variant');
  assert.ok(base.byCardId.H_POWERLOADER_RIPLEY.relatedEntityIds.includes(base.byCardId.H_RIPLEY.id));
  assert.ok(base.byCardId.H_POWERLOADER_RIPLEY.relatedEntityIds.includes(base.byCardId.EQ_POWER_LOADER.id));
  assert.equal(base.byCardId.X_FACEHUGGER.category,'life_stage');
  assert.equal(base.byCardId.X_OVOMORPH.category,'life_stage');
});

test('the card detail UI exposes source status and retains the local canonical trace',async()=>{
 const app=await readFile(new URL('src/app.js',root),'utf8');
 const index=await readFile(new URL('index.html',root),'utf8');
 const sw=await readFile(new URL('sw.js',root),'utf8');
 const server=await readFile(new URL('scripts/serve.mjs',root),'utf8');
 assert.match(app,/Alien_base — fiche mutualisée/);
 assert.ok(app.includes('baseRecord.researchStatus'));
 assert.ok(index.includes('/src/alien-base.js'));
 assert.ok(sw.includes('/src/alien-base.js'));
 assert.ok(server.includes('src/alien-base.js'));
});

test('candidate source links from other projects are traceable and never become TCG stats',()=>{
  const groups=new Set(['darknigthmare/xeno-trace','darknigthmare/aliens-tantalus-frontier',
    'darknigthmare/Yautja-hive-warriors','darknigthmare/world-hive-wars']);
  const references=Object.values(base.byCardId).flatMap(x=>x.crossgameReferences||[]);
  assert.equal(references.length,28);
  assert.equal(Object.values(base.byCardId).filter(x=>x.crossgameReferences?.length).length,25);
  for(const ref of references){
    assert.ok(groups.has(ref.project));
    assert.ok(ref.sourceId && ref.sourcePath && /^[a-f0-9]{40}$/.test(ref.sourceRevision));
    assert.equal(ref.relationship,'candidate_alias_pending_review');
  }
  assert.ok(base.byCardId.X_FACEHUGGER.crossgameReferences.some(x=>x.project==='darknigthmare/xeno-trace'));
  assert.ok(base.byCardId.EQ_PULSE_RIFLE.crossgameReferences.some(x=>x.project==='darknigthmare/aliens-tantalus-frontier'));
  assert.ok(base.byCardId.Y_WOLF.crossgameReferences.some(x=>x.project==='darknigthmare/Yautja-hive-warriors'));
  assert.ok(base.byCardId.X_RUNNER.crossgameReferences.some(x=>x.project==='darknigthmare/world-hive-wars'));
});
