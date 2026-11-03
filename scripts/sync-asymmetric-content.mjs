#!/usr/bin/env node
// Reproducible source-derived card and deck snapshots. No image or gameplay edits.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createContext,Script} from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const ctx=createContext({window:{},Intl,Date,Math});
for(const file of ['data.js','expansion.js','expansion-wave2.js','deck-productions.js','asymmetric-cards.js','asymmetric-decks.js']){
 new Script(await readFile(resolve(root,'src',file),'utf8'),{filename:'src/'+file}).runInContext(ctx,{timeout:8000});
}
const D=ctx.window.AVP_DATA;
if(D.cards.length!==891||D.asymmetricDecks.length!==38)throw Error('Unexpected live asymmetric inventory');
const parseCSV=function parseCSV(raw){const rows=[];let row=[],cell="",q=false;for(let i=0;i<raw.length;i++){const c=raw[i];if(q){if(c==='"'&&raw[i+1]==='"'){cell+='"';i++}else if(c==='"')q=false;else cell+=c;}else if(c==='"')q=true;else if(c===','){row.push(cell);cell="";}else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell="";}else if(c!=='\r')cell+=c;}if(cell!==""||row.length){row.push(cell);rows.push(row)}return rows};
const encCSV=function encCSV(rows){return rows.map(row=>row.map(x=>{const s=String(x??"");return /[",\n\r]/.test(s)?'"'+s.replaceAll('"','""')+'"':s}).join(",")).join("\n")+"\n"};
const liveFile=resolve(root,'content-plan','gameplay-live.csv');
const oldBase=parseCSV(await readFile(liveFile,'utf8'));
assert.equal(oldBase.length,892);
assert(oldBase.slice(1,657).every((r,i)=>r[0]===D.cards[i].id),'Historical 656 changed unexpectedly');
const extra=D.cards.slice(656);
const cards=[["CardID","Nom","Classe","Type","Faction","Set","Rareté","Énergie","ATK","PV","FamilleArme","Munitions","Charges","CoûtParTir","AttaquePlasma","SocketMod","FamillesCompatibles","StadeHive","TypeHôte","ÉclosionŒuf","FusionExclusive","Effet","RegistreAlienBaseID","SourcePolicy","Illustration"]];
for(const c of extra)cards.push([c.id,c.name,c.cardClass,c.type,c.faction,c.set,c.rarity,c.cost,c.attack,c.health,c.weaponFamily||'',c.ammoType||'',c.rounds||'',c.ammoPerAttack||'',c.plasmaPerAttack||'',c.modSocket||'',c.compatibleFamilies?.join('|')||'',c.evolutionStage||'',c.hostType||'',c.requiresEgg?'OUI':'NON',c.summonByFusion?'OUI':'NON',c.effect?.kind||c.effect?.onPlay?.kind||c.effect?.onEquip?.kind||'AUCUN',c.sourceEntityId,c.sourcePolicy,'PLACEHOLDER_SVG_EXTRANT']);
const decks=[['DeckID','Nom','Faction','Doctrine','Focus','CartesDuel','Réserve','TotalBoite','Statut','Sources']];
const slots=[['DeckID','Zone','Position','CardID','Nom','Classe','Faction','Set','Quantité']];
const db=new Map(D.cards.map(c=>[c.id,c]));
for(const p of D.asymmetricDecks){
 decks.push([p.id,p.name,p.faction,p.category,p.focus,30,15,p.boxCount,'JOUABLE','src/asymmetric-decks.js']);
 for(const [zone,pool]of [['PRINCIPAL',p.cards],['RESERVE',p.reserve]]){
  let pos=0;for(const id of Object.keys(pool).sort()){const c=db.get(id);if(!c)throw Error('Deck unknown card '+id);for(let i=0;i<pool[id];i++)slots.push([p.id,zone,++pos,id,c.name,c.cardClass,c.faction,c.set,1]);}
 }
}
const origin='https://github.com/darknigthmare/alien_base/blob/e65b75a6bfd1284dbac746102fdbae4fc5a3786b/data/entities.v1.json';
const append=extra.map(c=>[c.id,c.name,c.type,c.cardClass,c.faction,c.set,c.rarity,c.cost,c.attack,c.health,c.sourceEntityId,'mechanics-v1.3',c.effect?.kind||c.effect?.onPlay?.kind||c.effect?.onEquip?.kind||'AUCUN','ASYMETRIC_235_JOUABLE','PLACEHOLDER_SVG','MECANIQUES_TCG_NON_CANON',origin]);
const snapshots=[['asymmetric-cards.csv',encCSV(cards)],['asymmetric-decks.csv',encCSV(decks)],['asymmetric-decklists.csv',encCSV(slots)],['gameplay-live.csv',encCSV([...oldBase.slice(0,657),...append])]];
for(const [file,content] of snapshots){
 const path=resolve(root,'content-plan',file);
 if(process.argv.includes('--check'))assert.equal(await readFile(path,'utf8'),content,file+' differs from live runtime');
 else if(process.argv.includes('--write'))await writeFile(path,content);
 else throw Error('Use --check or --write');
}
console.log('OK: '+extra.length+' asymmetric cards, '+D.asymmetricDecks.length+' decks, '+(slots.length-1)+' slots, '+D.cards.length+' live cards.');
