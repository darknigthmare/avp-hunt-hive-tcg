import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/data.js', import.meta.url);
const source = await readFile(path, 'utf8');
const data = JSON.parse(source.match(/window\.AVP_DATA\s*=\s*(\{[\s\S]*\});\s*$/)[1]);
const replacements = new Map([
  ['Une pureté structurelle que n’altèrent ni remords ni morale.', 'Aucune hésitation ne trouble la précision de ses mouvements.'],
  ['Game over n’est pas encore une règle de duel.', 'Les plaisanteries cessent lorsque le compteur sature.'],
  ['Regardez-moi cette belle équipe.', 'Un ordre bref suffit à resserrer la ligne de défense.'],
  ['Vous devenez hystérique.', 'Sa voix reste calme tandis que les issues se verrouillent.'],
  ['Construire de meilleurs mondes exige parfois de pires décisions.', 'Le bilan de mission ne comporte aucune colonne pour les survivants.'],
  ['Éloigne-toi d’elle.', 'La dernière barrière possède deux pinces et une volonté intacte.'],
  ['C’est la seule manière d’être sûr.', 'Le signal de frappe remplace les dernières coordonnées au sol.'],
  ['Stay frosty.', 'Chaque viseur couvre l’angle mort d’un camarade.'],
  ['Frontline brawler, zone controller.', 'Sa masse repousse le front et ferme les passages.'],
]);
let changed = 0;
for (const card of data.cards) {
  if (replacements.has(card.flavor)) { card.flavor = replacements.get(card.flavor); changed += 1; }
  card.searchText = [card.name, card.type, card.faction, card.set, card.rarity, card.text, card.flavor, ...card.tags, ...card.keywords].join(' ').toLocaleLowerCase('fr');
}
for (const [id, rarity] of Object.entries(data.rarities)) {
  rarity.odds = id === 'C' ? 'Tirage courant' : id === 'R' ? 'Au moins une par booster' : id === 'UR' ? 'UR ou mieux garantie au 10e booster sans UR' : 'Tirage pondéré, non garanti';
}
await writeFile(path, `/* Catalogue fan-made : textes de gameplay et illustrations originaux. */\nwindow.AVP_DATA = ${JSON.stringify(data, null, 2)};\n`);
console.log(`${changed} textes remplacés; index de recherche reconstruit.`);
