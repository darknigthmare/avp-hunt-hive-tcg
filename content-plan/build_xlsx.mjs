#!/usr/bin/env node
// The single workbook authoring implementation. Run through build_xlsx.py.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createContext, Script } from 'node:vm';
import { Workbook, SpreadsheetFile, FileBlob } from '@oai/artifact-tool';

const option=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const root=option('--root'), outputDir=option('--out');
assert(root&&outputDir,'Use build_xlsx.py or provide --root and --out.');
const planDir=path.join(root,'content-plan');
const fileName='AVP_HUNT_HIVE_TCG_Catalogue_Complet.xlsx';
const sourceHashes=new Map();
const authoringSourceHash=createHash('sha256').update(await fs.readFile(path.join(planDir,'build_xlsx.mjs'))).digest('hex');
async function source(file){
 const value=await fs.readFile(path.join(root,file),'utf8');
 sourceHashes.set(file,createHash('sha256').update(value).digest('hex'));return value;
}
const manifest=JSON.parse(await source('content-plan/manifest.json'));
const runtimeModules=JSON.parse(await source('content-plan/runtime-modules.json'));
await source('content-plan/complete-cards.csv');
// Rules in the workbook describe these modules, so a rule change must make the
// committed workbook stale even when card and deck CSV files stay unchanged.
for(const name of runtimeModules.rules)await source('src/'+name+'.js');
await source('src/collection.js');
const context=createContext({window:{},Intl,Date,Math});
for(const name of runtimeModules.data){
 new Script(await source('src/'+name+'.js'),{filename:name+'.js'}).runInContext(context,{timeout:15000});
}
const D=context.window.AVP_DATA, db=new Map(D.cards.map(c=>[c.id,c]));
assert.equal(D.cards.length,manifest.implementation.totalPlayableCards);
assert.equal(D.expansionDecks.length,manifest.implementation.totalDeckPresetsPlayable);
assert.equal(new Set(D.cards.map(c=>c.id)).size,D.cards.length);
const codeUrl='https://github.com/darknigthmare/avp-hunt-hive-tcg/blob/main/src/';
function parseCSV(text){
 const rows=[];let row=[],cell='',quoted=false;text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
  else if(c==='"')quoted=true;
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';}
  else if(c!=='\r')cell+=c;
 }
 if(cell!==''||row.length){row.push(cell);rows.push(row);}
 assert(!quoted,'Unclosed CSV field');assert(rows.every(r=>r.length===rows[0].length),'Inconsistent CSV width');return rows;
}
function typed(rows){
 const preserve=/(?:ID$|^ID|^No$|Code|^Set$|^Raret)/i;
 return rows.map((row,i)=>i===0?row:row.map((v,j)=>{
  if(v==='')return null;
  if(!preserve.test(rows[0][j])&&/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(v))return Number(v);
  return v.startsWith('=')?"'"+v:v;
 }));
}
const sheets=[
 ['01_EXTENSIONS','sets.csv'],['02_CARTES_ET_FOILS','printings.csv'],['03_RARETES','rarities.csv'],
 ['04_BOOSTERS','booster-slots.csv'],['05_PROBABILITES','rarity-odds.csv'],['06_GAMMES','pack-formats.csv'],
 ['07_REFERENCE_YGO','formats-reference.csv'],['08_DECKS','decks.csv'],['09_DECKS_RESERVES','decklists.csv'],
 ['10_PRODUITS','products.csv'],['11_SOURCE_ALIENBASE','alien-base-sources.csv'],['12_CARTES_HISTORIQUES','legacy-cards.csv'],
 ['13_BACKLOG_MEDIAS','research-backlog.csv'],['14_GAMEPLAY_JOUABLE','gameplay-live.csv'],['15_SUIVI_DES_SETS','live-set-progress.csv'],
 ['16_DECKS_JOUABLES','decks-playable.csv'],['17_LISTES_JOUABLES','decklists-playable.csv'],['18_CARTES_ASYMETRIQUES','asymmetric-cards.csv'],
 ['19_DECKS_ASYMETRIQUES','asymmetric-decks.csv'],['20_LISTES_ASYMETRIQUES','asymmetric-decklists.csv'],['21_REGLES_ASYMETRIQUES','asymmetric-mechanics.csv'],
 ['27_ARSENAL_COUVERTURE','coverage-arsenal.csv'],['28_RUCHE_COUVERTURE','coverage-hive.csv'],
 ['29_DECKS_COMPLEMENTS','complete-decks.csv'],['30_LISTES_COMPLEMENTS','complete-decklists.csv'],['31_COUVERTURE_DOMAINES','coverage-domains.csv']
];
const data=new Map();
for(const [name,file]of sheets)data.set(name,typed(parseCSV(await source('content-plan/'+file))));
assert.equal(data.get('14_GAMEPLAY_JOUABLE').length-1,D.cards.length);
assert.equal(data.get('11_SOURCE_ALIENBASE').length-1,manifest.totals.sourceEntities);
assert.equal(data.get('16_DECKS_JOUABLES').length+data.get('19_DECKS_ASYMETRIQUES').length+data.get('29_DECKS_COMPLEMENTS').length-3,D.expansionDecks.length);
for(const r of data.get('14_GAMEPLAY_JOUABLE').slice(1)){
 const c=db.get(r[0]);assert(c&&r[1]===c.name&&r[7]===c.cost&&r[8]===c.attack&&r[9]===c.health,'CSV/runtime mismatch: '+r[0]);
}
// The CSV records remain intact. Complete rules are appended from the same
// executed catalogue, so a reader can use a card without opening the code.
const runtimeFields=[
 ['Texte de règle',c=>c.text||''],['Mots-clés',c=>(c.keywords||[]).join(', ')],
 ['Effet complet',c=>JSON.stringify(c.effect||{})],['Numéro de collection',c=>c.collectorNo||'']
];
for(const name of ['14_GAMEPLAY_JOUABLE','18_CARTES_ASYMETRIQUES']){
 const rows=data.get(name),missing=runtimeFields.filter(([header])=>!rows[0].includes(header));
 rows[0].push(...missing.map(([header])=>header));
 for(const row of rows.slice(1)){
  const card=db.get(row[0]);assert(card,'Unknown card '+row[0]);
  row.push(...missing.map(([,get])=>get(card)));
 }
}
const csvDecks=new Map();
for(const sheet of ['17_LISTES_JOUABLES','20_LISTES_ASYMETRIQUES','30_LISTES_COMPLEMENTS'])for(const r of data.get(sheet).slice(1)){
 const key=r[0]+'|'+r[1];if(!csvDecks.has(key))csvDecks.set(key,{});const counts=csvDecks.get(key);counts[r[3]]=(counts[r[3]]||0)+1;
}
for(const p of D.expansionDecks)for(const [zone,cards]of [['PRINCIPAL',p.cards],['RESERVE',p.reserve]]){
 const csv=csvDecks.get(p.id+'|'+zone);
 assert(csv&&JSON.stringify(Object.entries(csv).sort())===JSON.stringify(Object.entries(cards||{}).sort()),'Deck export stale: '+p.id+' '+zone);
}
const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
const deckRows=[['DeckID','Nom','Faction','Gamme','Set ou doctrine','Cartes duel','Cartes réserve','Total boîte','Unités coût 0–3','Armes à munitions','Charges disponibles','Sources de biomasse','Sources de plasma','Fusions et évolutions','Recette complète','Statut du set']];
for(const p of D.expansionDecks){
 const entries=Object.entries(p.cards).map(([id,n])=>[db.get(id),n]);const amount=pred=>entries.reduce((n,[c,q])=>n+(pred(c)?q:0),0);
 deckRows.push([p.id,p.name,p.faction,p.category||'ARCHETYPE',p.focus||'',sum(p.cards),sum(p.reserve),sum(p.cards)+sum(p.reserve),
  amount(c=>c.type==='UNIT'&&c.cost<=3&&!c.requiresEgg&&!c.summonByFusion&&!['HOTE','OEUF'].includes(c.cardClass)),
  amount(c=>c.cardClass==='ARME'&&c.ammoType),entries.reduce((n,[c,q])=>n+(c.cardClass==='MUNITION'?(c.rounds||0)*q:0),0),
  amount(c=>c.effect?.kind==='HIVE_BIOMASS'),amount(c=>c.effect?.kind==='CHARGE_PLASMA'||c.effect?.onPlay?.kind==='CHARGE_PLASMA'),
  amount(c=>['HIVE_FUSION','HIVE_EVOLVE','HIVE_ROUTE'].includes(c.effect?.kind)),(D.arsenalDecks?.some(d=>d.id===p.id)||D.hiveDecks?.some(d=>d.id===p.id))?'30_LISTES_COMPLEMENTS : filtrer ce DeckID':p.id.startsWith('asym_')?'20_LISTES_ASYMETRIQUES : filtrer ce DeckID':'17_LISTES_JOUABLES : filtrer ce DeckID',
  p.focusSupported===false?'Composition transversale provisoire':p.productionPlan?'Recette du catalogue actuel':'Préconstruit jouable']);
}
data.set('22_DECKS_COMPLETS',deckRows);
const compat=[['Relation','ArmeID','Arme','Famille','Carte compatible ID','Carte compatible','Calibre ou emplacement','Charges carte','Charges consommées','Bonus ATK','Condition']];
for(const w of D.cards.filter(c=>c.cardClass==='ARME')){
 for(const a of D.cards.filter(c=>w.ammoType&&c.cardClass==='MUNITION'&&c.ammoType===w.ammoType&&(c.faction===w.faction||c.faction==='NEUTRAL')))compat.push(['ARME_MUNITION',w.id,w.name,w.weaponFamily,a.id,a.name,a.ammoType,a.rounds,w.ammoPerAttack,a.ammoBonus,'Ressource exacte ; charges attachées à un porteur de la faction compatible.']);
 for(const m of D.cards.filter(c=>c.cardClass==='MODIFICATION'&&c.compatibleFamilies?.includes(w.weaponFamily)))compat.push(['ARME_MODULE',w.id,w.name,w.weaponFamily,m.id,m.name,m.modSocket,null,null,m.attack,'Une occurrence par socket ; trois modules maximum. Bonus ATK actif lorsque l’arme peut attaquer.']);
 for(const t of D.cards.filter(c=>c.effect?.kind==='WEAPON_TECHNIQUE'&&c.effect.weaponFamily===w.weaponFamily&&c.effect.ammoType===w.ammoType))compat.push(['ARME_ATTAQUE',w.id,w.name,w.weaponFamily,t.id,t.name,t.effect.ammoType,null,t.effect.ammoCost,t.effect.damage,'Famille et calibre exacts ; cible ennemie valide.']);
}
for(const gear of D.cards.filter(c=>c.cardClass==='EQUIPEMENT'))for(const m of D.cards.filter(c=>c.cardClass==='MODIFICATION'&&c.compatibleEquipmentIds?.includes(gear.id)))compat.push(['ÉQUIPEMENT_MODULE',gear.id,gear.name,'APPAREIL',m.id,m.name,m.modSocket,null,null,m.attack,'L’appareil indiqué doit être attaché au même porteur ; un module par emplacement.']);
for(const w of D.cards.filter(c=>c.cardClass==='ARME'&&c.plasmaPerAttack))for(const p of D.cards.filter(c=>c.effect?.kind==='CHARGE_PLASMA'))compat.push(['ARME_PLASMA',w.id,w.name,'PLASMA',p.id,p.name,'PLASMA',p.effect.amount,w.plasmaPerAttack,w.attack,'Réserve collective plafonnée à 12.']);
data.set('23_COMPATIBILITES',compat);
const stage=c=>c.evolutionStage||(c.id==='X_OVOMORPH'?'EGG':c.id==='X_FACEHUGGER'?'FACEHUGGER':c.id==='X_CHESTBURSTER'?'CHESTBURSTER':null);
const hive=[['Étape','Carte action ID','Carte action','Matériau A ID','Matériau A','Matériau B ID','Matériau B','Type hôte','Résultat ID','Résultat','Biomasse dépensée','Biomasse gagnée','Présence requise','Condition']];
for(const h of D.cards.filter(c=>c.requiresEgg))for(const e of D.cards.filter(c=>stage(c)==='EGG'&&(h.eggLine!=='ROYAL'||c.eggLine==='ROYAL')))
 hive.push(['ÉCLOSION',h.id,h.name,e.id,e.name,null,null,null,h.id,h.name,0,1,'Œuf au plateau ; Facehugger en main','Sacrifice de l’œuf ; apparition sur la même voie.']);
for(const f of D.cards.filter(c=>c.effect?.kind==='HIVE_FUSION'))for(const host of D.cards.filter(c=>c.cardClass==='HOTE'&&c.hostType===f.effect.hostType)){
 const result=db.get(f.effect.resultCardId);assert(result,'Unknown fusion result');
 hive.push(['FUSION',f.id,f.name,'FACEHUGGER','Facehugger en jeu',host.id,host.name,f.effect.hostType,result.id,result.name,0,f.effect.biomassGain||1,'Matériaux au plateau ; résultat dans main ou deck','Deux matériaux sur des voies distinctes ; résultat sur la voie du Facehugger.']);
}
for(const f of D.cards.filter(c=>c.effect?.kind==='HIVE_EVOLVE'))for(const from of D.cards.filter(c=>stage(c)===f.effect.fromStage&&(!f.effect.hostType||c.hostType===f.effect.hostType))){
 const result=db.get(f.effect.resultCardId);assert(result,'Unknown evolution result');
 hive.push(['ÉVOLUTION',f.id,f.name,from.id,from.name,null,null,f.effect.hostType||'Toutes lignées compatibles',result.id,result.name,f.effect.biomassCost||0,0,'Matériau au plateau ; résultat dans main ou deck','Stade, lignée et biomasse validés avant le sacrifice.']);
}
for(const action of D.cards.filter(c=>c.effect?.kind==='HIVE_ROUTE')){
 const route=action.effect,metadata=D.hiveCoverage.routes.find(r=>r.actionCardId===action.id),result=db.get(route.resultCardId);
 const primary=route.materialIds||[],secondary=route.secondaryIds||[],catalysts=route.catalystIds||[];
 assert(result&&metadata&&primary.length&&[...primary,...secondary,...catalysts].every(id=>db.has(id)),'Incomplete hive route '+action.id);
 const names=ids=>ids.map(id=>db.get(id).name).join(' ou ');
 const conditions=action.text+(catalysts.length?' Catalyseur présent : '+names(catalysts)+'.':'')+(route.preserveMaterial?' Le matériau principal est conservé.':'');
 hive.push([metadata.method,action.id,action.name,primary.join('|'),names(primary),secondary.join('|')||null,names(secondary)||null,route.continuity||action.continuity||'',result.id,result.name,route.biomassCost||0,route.biomassGain||0,'Matériaux exacts au plateau ; résultat dans main ou deck',conditions]);
}
data.set('24_CHAINES_RUCHE',hive);
const hunt=[['CarteID','Carte','Classe','Déclenchement','Effet moteur','Plasma gagné','Plasma par tir','Honneur gagné','Honneur dépensé','Trophées requis','ATK ou dégâts','PV ou bouclier','Cartes piochées','Condition et effet']];
for(const c of D.cards.filter(c=>c.faction==='YAUTJA')){
 const e=c.effect?.onPlay||c.effect?.onEquip||c.effect||{};
 hunt.push([c.id,c.name,c.cardClass,c.effect?.onPlay?'À l’arrivée':c.effect?.onEquip?'À l’équipement':c.plasmaPerAttack?'Attaque ou riposte':'À la résolution',e.kind||'Bonus permanent',e.kind==='CHARGE_PLASMA'?e.amount:0,c.plasmaPerAttack||0,
  ['GAIN_HONOR','YAUTJA_TROPHY'].includes(e.kind)?e.amount:0,e.honorCost||0,e.minTrophies||0,e.attack||c.attack||0,e.health||(e.kind==='FORTIFY'?e.amount:0)||c.health||0,e.count||e.draw||0,c.text]);
}
data.set('25_RESSOURCES_YAUTJA',hunt);
const rules=[
 ['TOUTES','Deck principal','30 cartes par deck jouable. Les cartes de réserve restent hors duel.','30'],
 ['TOUTES','Exemplaires','Maximum trois exemplaires du même ID dans le deck principal.','3'],
 ['TOUTES','Plateau','Trois voies de combat par camp.','3'],
 ['TOUTES','Énergie','L’énergie maximale progresse au fil des tours, jusqu’à dix.','10'],
 ['TOUTES','Victoire','Réduire le commandant adverse à zéro PV.','0 PV'],
 ['TOUTES','Cartes historiques','Les 158 IDs historiques et leurs règles sont conservés.','158'],
 ['TOUTES','Raretés','Les sept raretés en jeu ne modifient pas les statistiques des cartes.','7'],
 ['TOUTES','Catalogue futur',`Les 2 602 concepts et 14 finitions planifiés restent distincts des ${D.cards.length} cartes actives.`,'Plan éditorial'],
 ['TOUTES','Remélange','Une même graine produit la même recette. Les réserves conservent le format de leur produit.','Déterministe'],
 ['TOUTES','Validation de cible','Une cible doit être légale avant de consommer la carte et les ressources de son action.','Avant paiement'],
 ['HUMAN / YAUTJA','Porteur de munitions','Les munitions s’attachent à un Personnage ou Véhicule allié de faction compatible ; les affiliations explicites sont respectées.','Faction + classe'],
 ['HUMAN / YAUTJA','Ressource compatible','Le type de charge doit correspondre exactement à celui de l’arme. Un calibre documentaire inconnu reste non précisé ; les groupes de ressources du TCG ne constituent pas une preuve de calibre.','Exact'],
 ['HUMAN','Arme à sec','Une arme sans charges suffisantes ne fournit pas son bonus ATK.','Coût par tir'],
 ['HUMAN','Attaque de base','Le porteur conserve ses capacités propres lorsque l’arme est à sec.','ATK de base'],
 ['HUMAN','Consommation','Chaque tir effectif retire le nombre de charges de l’arme.','1–2 charges'],
 ['HUMAN','Riposte','Une riposte qui tire utilise aussi les ressources de l’arme du défenseur. À sec, le porteur riposte avec son attaque de base, sans consommation partielle.','Coût par tir complet'],
 ['HUMAN','Bonus de munition','Le premier chargeur compatible utilisé fournit son bonus de munition.','Bonus du chargeur'],
 ['HUMAN','Rechargement','Les chargeurs épuisés sont retirés des emplacements actifs ; une unité peut être ravitaillée à nouveau.','6 chargeurs actifs'],
 ['HUMAN','Module compatible','Un module exige une arme de l’une des familles compatibles. Le porteur ne peut équiper qu’une arme.','Famille exacte'],
 ['HUMAN','Emplacements de modules','Un module par socket, avec trois modules maximum par porteur.','3'],
 ['HUMAN','Module à sec','Le bonus ATK du module reste inactif si son arme compatible ne peut pas tirer. La détection passive du viseur reste active.','Arme chargée pour le bonus ATK'],
 ['HUMAN','Technique de tir','Une attaque spécialisée exige la famille d’arme et le calibre imprimés.','Famille + calibre'],
 ['HUMAN / YAUTJA','Coût de technique','Une technique exige les ressources indiquées et inflige ses dégâts à une unité ennemie valide. Les techniques à munitions conservent les mots-clés de l’arme, dont Perforation, jusqu’à la résolution du dernier tir, puis consomment les charges.','Coût imprimé'],
 ['HUMAN','Armes de mêlée','Les armes sans coût de munitions conservent leurs règles de mêlée.','Aucune munition'],
 ['XENO','Œuf','Les cartes de classe Œuf de l’édition asymétrique sont inertes et ne peuvent pas attaquer.','Plateau'],
 ['XENO','Éclosion','Un Facehugger à éclosion exige le sacrifice d’un œuf allié compatible.','1 œuf'],
 ['XENO','Lignée royale','Le Facehugger royal exige un œuf royal.','ROYAL'],
 ['XENO','Voie d’éclosion','Le Facehugger remplace l’œuf sur la même voie.','Même voie'],
 ['XENO','Biomasse d’éclosion','Une éclosion réussie ajoute un point de biomasse.','+1'],
 ['XENO','Hôte','Les cartes Hôte sont inertes. Leur type définit les fusions possibles.','HUMAN / QUAD / YAUTJA'],
 ['XENO','Matériaux de fusion','La fusion consomme un Facehugger et un Hôte du type requis.','2 matériaux'],
 ['XENO','Réserve de résultat','Le résultat de fusion doit être présent dans le deck ou la main.','Main ou deck'],
 ['XENO','Invocation de résultat','Les castes marquées fusion exclusive ne sont pas jouables directement depuis la main.','Fusion / évolution'],
 ['XENO','Biomasse de fusion','Une fusion parasitaire réussie produit deux biomasses.','+2'],
 ['XENO','Plafond biomasse','La biomasse est bornée entre zéro et douze.','12'],
 ['XENO','Mue','Un Chestburster de la bonne lignée peut évoluer vers son adulte associé.','1 biomasse'],
 ['XENO','Gelée royale','Un adulte de stade DRONE évolue en Prétorien avec la Gelée royale et le résultat disponible.','2 biomasses'],
 ['XENO','Couronne de résine','Le Prétorien évolue en Reine avec la Couronne de résine et la Reine disponible.','3 biomasses'],
 ['XENO','Évolution invalide','Le sacrifice et le paiement sont refusés si le résultat ne peut pas être invoqué.','Validation préalable'],
 ['YAUTJA','Réserve plasma','La réserve de plasma est partagée entre les armes du camp et plafonnée à douze.','12'],
 ['YAUTJA','Arme plasma','Le bonus de l’arme n’est actif que si le coût plasma peut être payé.','1–3 plasma'],
 ['YAUTJA','Trophée','Les capacités de chasse attribuent des trophées lors des éliminations ennemies qui les déclenchent. Tuer un allié, sacrifier ou transformer ne rapporte ni trophée ni élimination.','Selon capacité'],
 ['YAUTJA','Rite de trophée','Une carte Trophée requiert au moins un trophée acquis ; elle génère l’honneur indiqué.','1 trophée requis'],
 ['YAUTJA','Honneur','Une élimination ennemie attribuée à une unité Yautja accorde un honneur, y compris avec une arme plasma. Les rituels complètent cette réserve plafonnée à douze.','12'],
 ['YAUTJA','Dépense d’honneur','Renforcement, pioche et révélation vérifient puis dépensent leur coût d’honneur.','Coût imprimé'],
 ['TOUTES','Reprise du duel','Charges, biomasse, plasma et honneur sont conservés. Les ressources absentes commencent à zéro. Les anciens équipements sont préservés par une migration versionnée ; les nouvelles poses sont contrôlées. Les trois anciennes munitions CELLULE du F44AA migrent vers F44AA. Armes multiples, modules incompatibles, sockets répétés et plus de six chargeurs pleins sont refusés.','Sauvegarde compatible et validée']
];
rules.push(
 ['HUMAN / YAUTJA','Arsenaux documentés','Chaque référence admise est reliée à ses cartes actives, à ses variantes historiques et à ses munitions, modules ou supports. Les recherches sans preuve restent signalées dans la matrice.','27_ARSENAL_COUVERTURE'],
 ['HUMAN / YAUTJA','Module d’appareil','Un module dédié exige l’équipement précis indiqué sur la carte. Il partage les trois emplacements du porteur ; un même socket ne se répète pas.','Appareil exact'],
 ['HUMAN / YAUTJA','Armes sans munitions','Les armes de mêlée et appareils sans projectile ne reçoivent pas de calibre fictif. Leur fiche précise le mode de ressource du jeu.','Selon fiche'],
 ['XENO / ENGINEER / HYBRID','Routes de reproduction','Une route HIVE_ROUTE indique ses matériaux exacts, son résultat et son coût en biomasse. Tous sont validés avant le sacrifice.','IDs exacts'],
 ['XENO / ENGINEER / HYBRID','Continuités','Les adaptations de films, jeux, BD, jouets et créations du projet conservent leur contexte. Une route de jeu n’établit pas une biologie universelle.','28_RUCHE_COUVERTURE'],
 ['XENO / ENGINEER / HYBRID','Résultat disponible','Le résultat d’une route doit être présent dans la main ou le deck. Aucun résultat n’est créé hors de la collection du deck.','Main ou deck'],
 ['TOUTES','Collection','Les vues Cartes, Progression et Decks calculent leurs totaux sur le catalogue actif et les quantités réellement possédées. Consulter une recette ne distribue aucune carte.','Lecture seule'],
 ['TOUTES','Principal et réserve','Le suivi de collection additionne les besoins du principal et de la réserve lorsque cette option est activée. Le même exemplaire ne compte pas dans les deux zones.','Exemplaires distincts']
);
assert(rules.length>=46);
data.set('26_REGLES_DETAILLEES',[
 ['RègleID','Faction','Sujet','Règle du TCG','Limite ou condition','Source'],
 ...rules.map((r,i)=>['R'+String(i+1).padStart(2,'0'),...r,codeUrl+(i>=52?'collection.js':i>=49?'hive-rules.js':i>=46?'arsenal-rules.js':i===45?'duel-save.js':i<10?'engine.js':'asymmetric-rules.js')])
]);

// A small rules clarification can be refreshed without rewriting the unchanged
// catalogue. Every data fingerprint must still match the preceding full export.
if(process.argv.includes('--refresh-rules')){
 const out=path.join(outputDir,fileName),reportPath=path.join(outputDir,'workbook-validation.json');
 const report=JSON.parse(await fs.readFile(reportPath,'utf8'));
 assert.deepEqual(Object.fromEntries(sourceHashes),report.sourceHashes,'Data changed: run a full workbook build.');
 const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(out));
 const sheet=wb.worksheets.getItem('26_REGLES_DETAILLEES'),rows=data.get('26_REGLES_DETAILLEES');
 assert.equal(sheet.getUsedRange(true).values.length,rows.length,'Unexpected rule table size.');
 const before=wb.worksheets.getItem('00_PILOTAGE').getRange('C6:C16').values;
 sheet.getRangeByIndexes(0,0,rows.length,rows[0].length).values=rows;
 for(let r=1;r<rows.length;r++){
  const lines=Math.max(...rows[r].map((v,j)=>String(v).split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/(columnWidth(rows[0][j])-4))),0)));
  sheet.getRangeByIndexes(r,0,1,rows[0].length).format.rowHeight=lines>1?Math.min(400,lines*13+12):28;
 }
 wb.recalculate();
 assert.deepEqual(wb.worksheets.getItem('00_PILOTAGE').getRange('C6:C16').values,before,'Rules refresh changed catalogue totals.');
 const checks=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:1500});
 await fs.appendFile(path.join(outputDir,'workbook-inspection.txt'),'\nRules refresh: '+checks.ndjson+'\n');
 const preview=await wb.render({sheetName:'26_REGLES_DETAILLEES',range:'A23:F25',scale:1,format:'png'});
 await fs.writeFile(path.join(outputDir,'previews','26-regles-finales.png'),new Uint8Array(await preview.arrayBuffer()));
 for(const [file,hash]of sourceHashes)assert.equal(createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'),hash,'Source changed during rules refresh: '+file);
 const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(out);await fs.copyFile(out,path.join(planDir,fileName));
 report.rulesRefreshedAt=new Date().toISOString();report.checks.push('Rules refreshed with identical source hashes and unchanged catalogue formulas');
 report.authoringSourceHash=authoringSourceHash;
 report.xlsxSha256=createHash('sha256').update(await fs.readFile(out)).digest('hex');
 report.output='content-plan/'+fileName;
 await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
 await fs.mkdir(path.join(root,'reports','qa'),{recursive:true});
 await fs.writeFile(path.join(root,'reports','qa','workbook-validation-'+manifest.date+'.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({fileName,mode:'refresh-rules',rules:rules.length,sourceHashesUnchanged:true,output:out}));
 process.exit(0);
}

await fs.mkdir(outputDir,{recursive:true});
const wb=Workbook.create(), dashboard=wb.worksheets.add('00_PILOTAGE');
dashboard.showGridLines=false;dashboard.tabColor='#203649';
const ordered=[...data].sort(([a],[b])=>a.localeCompare(b));data.clear();for(const [name,rows]of ordered)data.set(name,rows);
const names=['00_PILOTAGE',...data.keys()];assert.equal(names.length,manifest.implementation.catalogueWorkbookSheets);
for(const name of data.keys())wb.worksheets.add(name);
function columnName(n){let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function columnWidth(header){
 if(/Composition principale|Composition réserve/.test(header))return 72;
 if(/Règle du TCG|Règle et contrôle|Condition|Texte|Description|Mecanique|EffetOriginal|Effet complet|Note|Fid.lit./i.test(header))return 62;
 if(/Nom|^Carte$|^Arme$|^Matériau|^Résultat$|Sujet|Relation|SourcePolicy/.test(header))return 38;
 if(/URL|URI|SourceBase|ExempleOfficiel/.test(header))return 58;
 if(/ID|Entite|Registre|Source/.test(header))return 34;
 if(/Statut|StatutLive|Gamme|Continuite|Format|Portee/.test(header))return 30;
 return Math.max(17,Math.min(28,header.length+3));
}
for(const [name,rows]of data){
 console.log('Preparing '+name+' ('+(rows.length-1)+' records)');
 const s=wb.worksheets.getItem(name),width=rows[0].length,range=s.getRangeByIndexes(0,0,rows.length,width);s.showGridLines=false;
 for(let r=0;r<rows.length;r+=500)s.getRangeByIndexes(r,0,Math.min(500,rows.length-r),width).values=rows.slice(r,r+500);
 range.format.font={name:'Arial',size:10,color:'#182A38'};range.format.verticalAlignment='center';range.format.wrapText=true;range.format.rowHeight=28;
 s.getRangeByIndexes(0,0,1,width).format={fill:'#203649',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:44,horizontalAlignment:'center',verticalAlignment:'center'};
 for(let j=0;j<width;j++){
  s.getRangeByIndexes(0,j,rows.length,1).format.columnWidth=columnWidth(rows[0][j]);
  const numbers=rows.slice(1).map(r=>r[j]).filter(v=>typeof v==='number');
  if(numbers.length)s.getRangeByIndexes(1,j,rows.length-1,1).setNumberFormat(numbers.every(Number.isInteger)?'#,##0" "':'#,##0.00" "');
 }
 s.freezePanes.freezeRows(1);
 s.freezePanes.freezeColumns(Math.min(2,width));
 const table=s.tables.add('A1:'+columnName(width-1)+rows.length,true,'Catalogue'+name.slice(0,2));table.showFilterButton=true;
 const widths=rows[0].map(columnWidth);
 let start=1,lastHeight=null;
 for(let r=1;r<=rows.length;r++){
  const lineCount=r<rows.length?Math.max(...rows[r].map((v,j)=>typeof v==='string'?v.split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(line.length/(widths[j]-4))),0):1)):null;
  const height=lineCount===null?null:lineCount>1?Math.min(400,lineCount*13+12):28;
  if(lastHeight!==null&&height!==lastHeight){if(lastHeight!==28)s.getRangeByIndexes(start,0,r-start,width).format.rowHeight=lastHeight;start=r;}
  lastHeight=height;
 }
 if(name==='22_DECKS_COMPLETS')s.tabColor='#366B4C';
 if(['21_REGLES_ASYMETRIQUES','23_COMPATIBILITES','24_CHAINES_RUCHE','25_RESSOURCES_YAUTJA','26_REGLES_DETAILLEES'].includes(name)){
  s.getRangeByIndexes(0,0,1,width).format.rowHeight=44;
 }
 if(name==='23_COMPATIBILITES')s.tabColor='#8A6831';
 if(name==='24_CHAINES_RUCHE')s.tabColor='#526D38';
 if(name==='25_RESSOURCES_YAUTJA')s.tabColor='#91483E';
}

// Active formats and rarities share the existing reference sheets. The earlier
// editorial tables are preserved and remain distinguishable from live content.
const activeRarities=[['Code actif','Nom actif','Rang','Recyclage','Finition active','Distribution active'],
 ...Object.entries(D.rarities).map(([id,r])=>[id,r.name,r.rank,r.dust,r.frame,r.odds])];
const activeBoosters=[['BoosterID','Nom','Set','Faction','Cartes par paquet','Prix en crédits','Cartes du set ciblé','État','Filtre de doctrine','Description'],
 ...D.boosters.map(b=>[b.id,b.name,b.set,b.primaryFaction||'Toutes',b.cardsPerBooster||9,b.price,
  D.cards.filter(c=>c.set===b.set&&(!b.poolTag||c.tags?.includes(b.poolTag))&&(!b.primaryFaction||c.faction===b.primaryFaction)).length,
  b.preview?'Aperçu partiel':'Actif',b.poolTag||'Set entier',(b.description||'')+(b.preview?'':' Repli hors set possible si la rareté demandée est absente.')])];
const extraTables=[
 {name:'03_RARETES',title:'Raretés actives dans le jeu',rows:activeRarities},
 {name:'04_BOOSTERS',title:'Boosters actifs dans le jeu',rows:activeBoosters}
];
for(const {name,title,rows}of extraTables){
 const sheet=wb.worksheets.getItem(name),start=data.get(name).length+4,width=rows[0].length;
 sheet.getRangeByIndexes(start-2,0,1,1).values=[[title]];
 sheet.getRangeByIndexes(start-2,0,1,1).format.font={name:'Arial',size:12,bold:true,color:'#203649'};
 const range=sheet.getRangeByIndexes(start,0,rows.length,width);range.values=rows;
 range.format={font:{name:'Arial',size:10,color:'#182A38'},verticalAlignment:'center',wrapText:true,rowHeight:54};
 for(let col=0;col<width;col++){
  const originalHeader=data.get(name)[0][col];
  sheet.getRangeByIndexes(start,col,rows.length,1).format.columnWidth=Math.max(columnWidth(rows[0][col]),originalHeader?columnWidth(originalHeader):17,col<2?34:17);
  if(rows.slice(1).some(r=>typeof r[col]==='number'))sheet.getRangeByIndexes(start+1,col,rows.length-1,1).setNumberFormat('#,##0" "');
 }
 const t=sheet.tables.add('A'+(start+1)+':'+columnName(width-1)+(start+rows.length),true,'Actif'+name.slice(0,2));t.showFilterButton=true;
 sheet.getRangeByIndexes(start,0,1,width).format={fill:'#203649',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:44,horizontalAlignment:'center',verticalAlignment:'center'};
 for(let row=1;row<rows.length;row++){
  const lines=Math.max(...rows[row].map((v,col)=>typeof v==='string'?Math.ceil(v.length/Math.max(12,columnWidth(rows[0][col])-4)):1));
  sheet.getRangeByIndexes(start+row,0,1,width).format.rowHeight=Math.max(54,lines*13+12);
 }
}

dashboard.getRange('B2:H2').format.font={name:'Arial',size:16,bold:true,color:'#203649'};
dashboard.getRange('B2').values=[['AVP HUNT // HIVE — Catalogue et decks']];
dashboard.getRange('B3').values=[['Édition du 3 novembre 2026. Cartes jouables et programme des 30 extensions.']];
dashboard.getRange('B3:H3').format.font={name:'Arial',size:10,color:'#56616B'};
dashboard.getRange('B5:C5').values=[['CATALOGUE EN JEU','NOMBRE']];
const metrics=[
 ['Cartes jouables',"=COUNTA('14_GAMEPLAY_JOUABLE'!A2:A"+data.get('14_GAMEPLAY_JOUABLE').length+")"],
 ['Recettes de decks',"=COUNTA('22_DECKS_COMPLETS'!A2:A"+deckRows.length+")"],
 ['Boosters actifs',D.boosters.length],['Raretés actives',manifest.implementation.playableRarities],
 ['Cartes historiques conservées',"=COUNTA('12_CARTES_HISTORIQUES'!A2:A"+data.get('12_CARTES_HISTORIQUES').length+")"],
 ['Cartes asymétriques',"=COUNTA('18_CARTES_ASYMETRIQUES'!A2:A"+data.get('18_CARTES_ASYMETRIQUES').length+")"],
 ['Decks asymétriques',"=COUNTA('19_DECKS_ASYMETRIQUES'!A2:A"+data.get('19_DECKS_ASYMETRIQUES').length+")"],
 ['Positions de cartes (duel + réserve)',"=SUM('22_DECKS_COMPLETS'!H2:H"+deckRows.length+")"],
 ['Compatibilités documentées',"=COUNTA('23_COMPATIBILITES'!A2:A"+compat.length+")"],
 ['Combinaisons du cycle de la Ruche',"=COUNTA('24_CHAINES_RUCHE'!A2:A"+hive.length+")"],
 ['Références Alien_base',"=COUNTA('11_SOURCE_ALIENBASE'!A2:A"+data.get('11_SOURCE_ALIENBASE').length+")"]
];
metrics.forEach(([label,value],i)=>{dashboard.getRange('B'+(i+6)).values=[[label]];const r=dashboard.getRange('C'+(i+6));if(typeof value==='string'&&value.startsWith('='))r.formulas=[[value]];else r.values=[[value]];});
dashboard.getRange('F5:G5').values=[['PROGRAMME ÉDITORIAL','NOMBRE']];
dashboard.getRange('F6:G11').values=[['Extensions prévues',manifest.totals.sets],['Concepts de cartes prévus',manifest.totals.newGameplayCardConcepts],['Impressions prévues',manifest.totals.newPrintings],['Finitions prévues',manifest.totals.rarities],['Recettes de produits prévues',manifest.totals.decks],['Produits prévus',manifest.totals.productSkus]];
dashboard.getRange('F13').values=[['Les concepts prévus restent à rapprocher des cartes actives.']];
dashboard.getRange('F14').values=[['Les variantes foil ne créent pas de nouveaux effets de combat.']];
dashboard.getRange('B19:E19').values=[['FACTION EN JEU','CARTES','DECKS','RESSOURCE']];
const factions=[['HUMAN','Humains','Munitions et modules'],['XENO','Ruche','Biomasse et évolutions'],['YAUTJA','Yautja','Projectiles, plasma et honneur'],['ENGINEER','Ingénieurs','Technologies et organismes'],['HYBRID','Hybrides','Lignées et mutations'],['NEUTRAL','Neutres','Soutiens transversaux']];
dashboard.getRange('B20:E25').values=factions.map(([id,label,resource])=>[label,null,null,resource]);
factions.forEach(([id],i)=>{
 dashboard.getRange('C'+(20+i)).formulas=[['=COUNTIFS(\'14_GAMEPLAY_JOUABLE\'!E2:E'+data.get('14_GAMEPLAY_JOUABLE').length+',"'+id+'")']];
 dashboard.getRange('D'+(20+i)).formulas=[['=COUNTIFS(\'22_DECKS_COMPLETS\'!C2:C'+deckRows.length+',"'+id+'")']];
});
dashboard.getRange('B28:E28').values=[['BOOSTER ACTIF','PAQUET','ÉTAT','IDENTIFIANT']];
dashboard.getRange('B29:E'+(28+D.boosters.length)).values=D.boosters.map(b=>[b.name,b.cardsPerBooster||9,b.preview?'Aperçu partiel':'Actif',b.id]);
dashboard.getRange('G19:H19').values=[['LIRE LES DECKS','CONTENU']];
dashboard.getRange('G20:H28').values=[['22_DECKS_COMPLETS','Toutes les recettes et leur répertoire de positions'],['17_LISTES_JOUABLES','15 450 positions des 280 premières recettes'],['20_LISTES_ASYMETRIQUES','1 710 positions des 38 doctrines'],['23_COMPATIBILITES','Munitions, modules, attaques et plasma'],['24_CHAINES_RUCHE','Éclosions, fusions et évolutions'],['26_REGLES_DETAILLEES',rules.length+' règles de combat et construction'],['27_ARSENAL_COUVERTURE','Armes, équipements, ressources et sources'],['28_RUCHE_COUVERTURE','Castes, lignées et routes de reproduction'],['30_LISTES_COMPLEMENTS','Recettes des arsenaux et nouvelles lignées']];
dashboard.getRange('B2:H'+(28+D.boosters.length)+'').format.font.name='Arial';dashboard.getRange('B5:H'+(28+D.boosters.length)+'').format.font.size=10;dashboard.getRange('B5:H'+(28+D.boosters.length)+'').format.rowHeight=24;
dashboard.getRange('B:B').format.columnWidth=44;dashboard.getRange('C:C').format.columnWidth=15;
dashboard.getRange('D:D').format.columnWidth=20;dashboard.getRange('E:E').format.columnWidth=35;
dashboard.getRange('F:F').format.columnWidth=40;dashboard.getRange('G:G').format.columnWidth=28;dashboard.getRange('H:H').format.columnWidth=50;
for(const a of ['B5:C5','F5:G5','B19:E19','B28:E28','G19:H19'])dashboard.getRange(a).format={fill:'#203649',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:28,wrapText:true};
dashboard.getRange('C6:C16').setNumberFormat('#,##0');dashboard.getRange('G6:G11').setNumberFormat('#,##0');dashboard.getRange('C20:D25').setNumberFormat('#,##0');
dashboard.getRange('D20:D25').format.horizontalAlignment='center';
dashboard.getRange('G20:H28').format.wrapText=true;
dashboard.getRange('G20:H28').format.rowHeight=36;
wb.recalculate();
const inspection=await wb.inspect({kind:'table',range:'00_PILOTAGE!B5:C16',include:'values,formulas',tableMaxRows:12,tableMaxCols:2,maxChars:7000});
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:2500});
const expected=[D.cards.length,D.expansionDecks.length,D.boosters.length,Object.keys(D.rarities).length,manifest.totals.existingCards,D.asymmetricEdition.addedCount,D.asymmetricDecks.length,D.expansionDecks.reduce((n,p)=>n+sum(p.cards)+sum(p.reserve),0),compat.length-1,hive.length-1,manifest.totals.sourceEntities];
assert.deepEqual(dashboard.getRange('C6:C16').values.flat(),expected,'Workbook totals diverge from runtime');
assert.deepEqual(dashboard.getRange('C20:D25').values,factions.map(([id])=>[D.cards.filter(c=>c.faction===id).length,D.expansionDecks.filter(d=>d.faction===id).length]));
// Prove that summary formulas react to source input, then restore before export.
const probe=wb.worksheets.getItem('22_DECKS_COMPLETS').getRange('H2'),prior=probe.values[0][0];
probe.values=[[prior+1]];wb.recalculate();assert.equal(dashboard.getRange('C13').values[0][0],expected[7]+1);
probe.values=[[prior]];wb.recalculate();assert.equal(dashboard.getRange('C13').values[0][0],expected[7]);
await fs.writeFile(path.join(outputDir,'workbook-inspection.txt'),inspection.ndjson+'\n'+errors.ndjson);
const renderDir=path.join(outputDir,'previews');await fs.mkdir(renderDir,{recursive:true});
const renderNames=process.argv.includes('--no-render')?['00_PILOTAGE']:names;
for(const name of renderNames){
 const region=name==='00_PILOTAGE'?'B2:H28':'A1:'+columnName(Math.min(5,data.get(name)[0].length-1))+'5';
 const preview=await wb.render({sheetName:name,range:region,scale:1,format:'png'});
 await fs.writeFile(path.join(renderDir,name+'.png'),new Uint8Array(await preview.arrayBuffer()));
}
for(const {name,rows}of extraTables){
 const start=data.get(name).length+3;
 const preview=await wb.render({sheetName:name,range:'A'+start+':'+columnName(rows[0].length-1)+(start+5),scale:1,format:'png'});
 await fs.writeFile(path.join(renderDir,name+'-actif.png'),new Uint8Array(await preview.arrayBuffer()));
}
const rulePreview=await wb.render({sheetName:'14_GAMEPLAY_JOUABLE',range:'R1:U5',scale:1,format:'png'});
await fs.writeFile(path.join(renderDir,'14_GAMEPLAY_JOUABLE-regles.png'),new Uint8Array(await rulePreview.arrayBuffer()));
for(const [name,range,suffix]of [
 ['14_GAMEPLAY_JOUABLE','A893:F897','nouvel-arsenal'],
 ['14_GAMEPLAY_JOUABLE','R893:U897','regles-arsenal'],
 ['24_CHAINES_RUCHE','A'+Math.max(2,hive.length-4)+':N'+hive.length,'nouvelles-routes'],
 ['26_REGLES_DETAILLEES','A48:F55','regles-complements'],
 ['29_DECKS_COMPLEMENTS','A1:I5','tailles-boites']
]){
 const preview=await wb.render({sheetName:name,range,scale:1,format:'png'});
 await fs.writeFile(path.join(renderDir,name+'-'+suffix+'.png'),new Uint8Array(await preview.arrayBuffer()));
}
// Reject a mixed export if another process changed an input during the build.
for(const [file,hash]of sourceHashes)assert.equal(createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'),hash,'Source changed during workbook generation: '+file);
wb.recalculate();
const xlsx=await SpreadsheetFile.exportXlsx(wb),out=path.join(outputDir,fileName);await xlsx.save(out);await fs.copyFile(out,path.join(planDir,fileName));
const report={fileName,generatedAt:new Date().toISOString(),sourceAlienBase:manifest.alienBaseMain,sourceHashes:Object.fromEntries(sourceHashes),sheetCount:names.length,sheets:Object.fromEntries([...data].map(([name,rows])=>[name,{records:rows.length-1,columns:rows[0].length}])),cards:D.cards.length,decks:D.expansionDecks.length,boosters:D.boosters.length,positions:expected[7],compatibilities:compat.length-1,hiveCombinations:hive.length-1,rules:rules.length,activeRarities:activeRarities.length-1,activeBoosterRows:activeBoosters.length-1,renderedSheets:renderNames.length,checks:['CSV card IDs and stats match runtime','Every main/reserve slot matches runtime','Summary and faction formulas match independent counts','Source edit changes summary and restored correctly','All source hashes unchanged through export'],output:out};
report.authoringSourceHash=authoringSourceHash;
report.xlsxSha256=createHash('sha256').update(await fs.readFile(out)).digest('hex');
report.output='content-plan/'+fileName;
await fs.mkdir(path.join(root,'reports','qa'),{recursive:true});
await fs.writeFile(path.join(root,'reports','qa','workbook-validation-'+manifest.date+'.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(outputDir,'workbook-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
