import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,Script} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const option=key=>{const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1];};
const base=resolve(option('--base')||join(root,'../alien_base'));
const original=JSON.parse(await readFile(join(base,'data/gameplay/avp-tcg-cards.v1.json'),'utf8'));
const bridge=JSON.parse(await readFile(join(base,'data/integrations/avp-tcg-federation.v3.json'),'utf8'));
const ctx=createContext({window:{}});
new Script(await readFile(join(root,'src/data.js'),'utf8'),{filename:'src/data.js'}).runInContext(ctx,{timeout:2000});
const cards=ctx.window.AVP_DATA.cards;
const fields=['name','type','faction','set','rarity','cost','attack','health','keywords','text','effect','tags','source','collectorNo'];
assert.equal(original.sourceVersion,'1.0.0');
assert.equal(bridge.schema,'alien-base/tcg-federation-v3');
assert.equal(original.cards.length,158);
assert.equal(bridge.records.length,158);
const gameMap=new Map(cards.map(c=>[c.id,c]));
const baseMap=new Map(original.cards.map(c=>[c.id,c]));
const bridgeMap=new Map(bridge.records.map(c=>[c.cardId,c]));
const differences=[];
for(const [id,card] of gameMap){
 const old=baseMap.get(id),link=bridgeMap.get(id);
 if(!old||!link){differences.push({cardId:id,kind:!old?'missing-base-card':'missing-identity-link'});continue;}
 for(const field of fields){
  if(JSON.stringify(card[field])!==JSON.stringify(old[field]))differences.push({
   cardId:id,kind:'gameplay-change',field,
   local:card[field],base:old[field]
  });
 }
}
for(const id of baseMap.keys())if(!gameMap.has(id))differences.push({cardId:id,kind:'removed-game-card'});
const report={
 schema:'alien-base/tcg-roundtrip-proposal-v1',game:'darknigthmare/avp-hunt-hive-tcg',
 target:'darknigthmare/alien_base',gameVersion:ctx.window.AVP_DATA.version,
 reviewRequired:true,automaticMerge:false,loreAltered:false,
 comparedFields:fields,gameCards:cards.length,baseCards:original.cards.length,
 differenceCount:differences.length,differences
};
const proposal=option('--propose');
if(proposal){
 const target=resolve(root,proposal);
 const safe=resolve(root,'docs/alien-base-proposals')+sep;
 if(!target.startsWith(safe)||!target.endsWith('.json'))throw Error('Proposals can only be written as JSON under docs/alien-base-proposals/');
 await mkdir(dirname(target),{recursive:true});
 await writeFile(target,JSON.stringify(report,null,2)+'\n');
 console.log('Proposal written for review: '+target);
}
if(differences.length)throw Error('Bidirectional sync mismatch ('+differences.length+'). Use --propose docs/alien-base-proposals/review.json, inspect and open a PR to Alien_base.');
console.log('Bidirectional TCG sync OK: 158 cards, '+fields.length+' fields, '+bridge.records.length+' stable central mappings.');
