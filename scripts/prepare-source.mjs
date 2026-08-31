import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv.includes('--force')) {
  console.error('Refusing to overwrite enriched modules. Re-run with --force only for an intentional clean extraction.');
  process.exit(2);
}
const source = await readFile(resolve(root, 'AVP_HUNT_HIVE_TCG_STANDALONE.html'), 'utf8');
const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);
const scriptMatches = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];

if (!styleMatch || scriptMatches.length !== 3) {
  throw new Error('Structure inattendue du standalone : extraction annulée.');
}

const dataMatch = scriptMatches[0][1].trim().match(/^window\.AVP_DATA\s*=\s*(\{[\s\S]*\});?$/);
if (!dataMatch) throw new Error('Le catalogue AVP_DATA ne peut pas être extrait.');
const data = JSON.parse(dataMatch[1]);

const index = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07100e">
  <meta name="color-scheme" content="dark">
  <meta name="description" content="TCG tactique fan-made hors ligne : collectionnez 158 cartes originales et affrontez l’IA sur trois voies.">
  <meta name="application-name" content="HUNT // HIVE TCG">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>AVP: HUNT // HIVE TCG</title>
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/icon-192.png">
  <link rel="stylesheet" href="/assets/styles.css">
  <script src="/src/data.js" defer></script>
  <script src="/src/engine.js" defer></script>
  <script src="/src/app.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#app">Aller au contenu principal</a>
  <div id="app" tabindex="-1"></div>
  <div id="modal-root"></div>
  <div id="a11y-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  <noscript>Ce jeu nécessite JavaScript. Activez-le pour accéder au duel, à la collection et à la campagne.</noscript>
</body>
</html>
`;

await Promise.all([
  mkdir(resolve(root, 'assets'), { recursive: true }),
  mkdir(resolve(root, 'src'), { recursive: true }),
]);

await Promise.all([
  writeFile(resolve(root, 'index.html'), index, 'utf8'),
  writeFile(resolve(root, 'assets/styles.css'), `${styleMatch[1].trim()}\n`, 'utf8'),
  writeFile(resolve(root, 'src/data.js'), `/* Catalogue original extrait du standalone vérifié. */\nwindow.AVP_DATA = ${JSON.stringify(data, null, 2)};\n`, 'utf8'),
  writeFile(resolve(root, 'src/engine.js'), `/* Moteur de règles déterministe extrait du standalone vérifié. */\n${scriptMatches[1][1].trim()}\n`, 'utf8'),
  writeFile(resolve(root, 'src/app.js'), `/* Interface et orchestration locale extraites du standalone vérifié. */\n${scriptMatches[2][1].trim()}\n`, 'utf8'),
]);

console.log(`Préparation terminée : ${data.cards.length} cartes, ${data.campaign.length} missions.`);
