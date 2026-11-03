import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const code=['data.js','expansion.js','expansion-wave2.js','deck-productions.js','engine.js']
  .map(n=>readFileSync(new URL('../src/'+n,import.meta.url),'utf8'));
function boot(){
  const ctx=vm.createContext({window:{},Intl,Date,Math});
  for(const src of code)vm.runInContext(src,ctx,{timeout:6000});
  return {D:ctx.window.AVP_DATA,E:ctx.window.AVPEngine};
}
const {D,E}=boot();

test('les 210 recettes du catalogue deviennent sélectionnables, sans supprimer 70 anciennes',()=>{
  assert.equal(D.cards.length,656);
  assert.equal(D.expansionWave2.addedCount,342);
  assert.equal(D.productionDecks.length,210);
  assert.equal(D.expansionDecks.length,280);
  assert.equal(new Set(D.expansionDecks.map(p=>p.id)).size,280);
  assert.equal(D.productionDeckStatus.plans,30);
  assert.equal(D.productionDeckStatus.totalPresets,280);
});

test('formats de boîtes : starter 45, structure 45, construction 75, spécial 50, ligue 45',()=>{
  const categories={};
  for(const p of D.productionDecks){
    categories[p.category]=(categories[p.category]||0)+1;
    assert.equal(p.count,30,p.id);
    assert.equal(Object.values(p.cards).reduce((a,b)=>a+b,0),30,p.id);
    const copies=Object.values(p.reserve).reduce((a,b)=>a+b,0);
    const expected={STARTER:15,STRUCTURE:15,CONSTRUCTION:45,SPECIAL:20,LIGUE:15}[p.category];
    assert.equal(copies,expected,p.id);
    assert.equal(p.boxCount,30+expected,p.id);
    for(const [id,n]of Object.entries(p.reserve)){
      assert(E.CARD.has(id),p.id+': carte réserve inconnue '+id);
      assert((p.cards[id]||0)+n<=3,p.id+': carte en trop '+id);
    }
    assert(E.validateDeck(p.cards,null,p.faction).valid,p.id);
    const analysis=E.analyzeDeck(p.cards,p.faction);
    assert.equal(analysis.total,30,p.id);
    const early=Object.entries(p.cards).reduce((n,[id,q])=>{const c=E.CARD.get(id);return n+(c.type==='UNIT'&&!c.crewRequired&&c.cost<=2?q:0);},0);
    assert(early>=5,p.id+' : courbe d’ouverture trop lente ('+early+')');
  }
  assert.equal(categories.STARTER,5);
  assert.equal(categories.STRUCTURE,25);
  assert.equal(categories.CONSTRUCTION,90);
  assert.equal(categories.SPECIAL,30);
  assert.equal(categories.LIGUE,60);
});

test('chaque extension de production possède 7 recettes référencées, avec niveau de maturité transparent',()=>{
  const sets=new Set(D.productionDecks.map(p=>p.focus));
  assert.equal(sets.size,30);
  for(const set of sets){
    const recipes=D.productionDecks.filter(p=>p.focus===set);
    assert.equal(recipes.length,7,set);
    const ids=new Set(recipes.map(p=>p.planDeckId));
    assert.equal(ids.size,7,set);
    for(const preset of recipes){
      assert(preset.productionPlan);
      assert(preset.focusSupported?typeof preset.focusCards==='number':preset.focusCards===0,set);
      if(!preset.focusSupported)assert.match(preset.description,/transversale provisoire/);
    }
  }
});

test('les remélanges restent déterministes et les réserves correspondent à chaque gamme',()=>{
  for(const p of D.productionDecks){
    const first=D.remixPresetDeck(p,123456),second=D.remixPresetDeck(p,123456);
    assert(first&&second);
    assert.equal(JSON.stringify(first),JSON.stringify(second),p.id);
    assert(E.validateDeck(first.cards,null,p.faction).valid,p.id);
    assert.equal(Object.values(first.reserve).reduce((a,b)=>a+b,0),p.boxCount-30,p.id);
    for(const [id,n]of Object.entries(first.reserve))assert((first.cards[id]||0)+n<=3,p.id+' '+id);
  }
  for(const p of D.expansionDecks.slice(0,70)){
    const copy=D.remixPresetDeck(p,987);
    assert(E.validateDeck(copy.cards,null,p.faction).valid,p.id);
    assert.equal(Object.values(copy.reserve).reduce((a,b)=>a+b,0),15,p.id);
  }
});

test('les anciennes cartes et les modèles existants restent accessibles dans le pool',()=>{
  const source=readFileSync(new URL('../src/data.js',import.meta.url),'utf8');
  assert.match(source,/X_OVOMORPH/);
  assert(D.cards[0].id==='X_OVOMORPH');
  assert(D.expansionDecks[0].id.startsWith('preset_'));
  assert(D.expansionDecks[69].id.startsWith('wave2_'));
  assert(D.expansionDecks[70].id.startsWith('production_'));
});

test('l’application, le build et le worker chargent les 210 recettes sans nouvelle illustration',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const server=readFileSync(new URL('../scripts/serve.mjs',import.meta.url),'utf8');
  const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert(html.indexOf('/src/expansion-wave2.js')<html.indexOf('/src/deck-productions.js'));
  assert(html.indexOf('/src/deck-productions.js')<html.indexOf('/src/engine.js'));
  for(const item of [sw,server,build])assert(item.includes('deck-productions.js'));
  assert(app.includes('D.remixPresetDeck'));
  assert(app.includes('reserveCount'));
  assert(build.includes('live.expansionDecks?.length!==280'));
});
