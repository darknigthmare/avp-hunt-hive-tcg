import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({window:{},Intl,console});
for(const file of ['data','engine']) vm.runInContext(fs.readFileSync(new URL(`../src/${file}.js`,import.meta.url),'utf8'),ctx);
const E=ctx.window.AVPEngine;

test('Squad grants 250 attack per other Human ally, never per enemy or non-Human',()=>{
  const deck=E.buildAiDeck(['HUMAN'],1,1);
  const battle=new E.Battle({playerDeck:deck,aiDeck:deck,seed:2});
  const marine=battle.summonAt(0,'H_COLONIAL_MARINE',0);
  battle.summonAt(1,'H_COLONIAL_MARINE',0);
  assert.equal(battle.unitAttack(0,marine),1000);
  battle.summonAt(0,'H_COLONIAL_MARINE',1);
  battle.summonAt(0,'H_COLONIAL_MARINE',2);
  assert.equal(battle.unitAttack(0,marine),1500);
});

test('all solo AI identities generate legal decks with an opening curve',()=>{
  for(const faction of ['XENO','YAUTJA','HUMAN','ENGINEER','HYBRID']) for(let seed=1;seed<=40;seed++){
    const deck=E.buildAiDeck([faction],1,seed);
    assert.equal(E.validateDeck(deck,null,faction).valid,true,`${faction}/${seed}`);
    const early=Object.entries(deck).reduce((n,[id,count])=>n+(E.CARD.get(id).type==='UNIT'&&E.CARD.get(id).cost<=2?count:0),0);
    assert.ok(early>=3,`${faction}/${seed}: ${early} early units`);
  }
});
