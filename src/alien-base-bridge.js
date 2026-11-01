/* Read-only, audited shared Alien_base catalog; no gameplay or save modification. */
import { ALIEN_BASE_PUBLIC_SNAPSHOT_V1 as shared } from './alien-base-public-v1.js';
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);if(!Object.isFrozen(value))Object.freeze(value)}return value};
freeze(shared);
const tables=Object.freeze(Object.fromEntries(Object.entries(shared.records).map(([key,rows])=>[key,new Map(rows.map(x=>[x.id,x]))])));
export const ALIEN_BASE_COUNTS=Object.freeze(Object.fromEntries(Object.entries(shared.records).map(([k,v])=>[k,v.length])));
export const ALIEN_BASE_VERSION=Object.freeze({schema:shared.format,sourceCommits:shared.sourceCommits});
export function getSharedRecord(category,id){return typeof id==='string'&&Object.hasOwn(tables,category)?tables[category].get(id)??null:null}
const masterCardsByLegacyId=new Map(shared.records.tcgCards.map(record=>[record.legacyId,record]));
export function getSharedCardId(card){if(!card||typeof card.id!=='string'||!/^[A-Za-z][A-Za-z0-9_]{1,60}$/.test(card.id))return null;return masterCardsByLegacyId.get(card.id)?.id??null}
export function validateSharedGameCards(cards){if(!Array.isArray(cards)||cards.length!==158)return{valid:false,reason:'TCG card count drift'};const ids=cards.map(getSharedCardId);if(ids.some(x=>!x)||new Set(ids).size!==ids.length)return{valid:false,reason:'Invalid card ids'};if(shared.records.weapons.some(x=>x.legacyId.startsWith('proposed-')&&x.admission!=='research-only'))return{valid:false,reason:'Research-only admission'};return{valid:true,count:ids.length}}
if(typeof window!=='undefined'&&validateSharedGameCards(window.AVP_DATA?.cards).valid){
 const links=Object.freeze(Object.fromEntries(window.AVP_DATA.cards.map(card=>[card.id,getSharedCardId(card)])));
 window.AVP_ALIEN_BASE=Object.freeze({version:ALIEN_BASE_VERSION,counts:ALIEN_BASE_COUNTS,find:getSharedRecord,cardLinks:links});
}
