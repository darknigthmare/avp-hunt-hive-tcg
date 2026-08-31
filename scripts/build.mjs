import { cp, lstat, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_FILES } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
if (output === root || dirname(output) !== root) throw new Error('Unsafe build output directory.');
await import('./generate-icons.mjs');

const standalone = await readFile(resolve(root, 'AVP_HUNT_HIVE_TCG_STANDALONE.html'));
const hash = createHash('sha256').update(standalone).digest('hex');
const expected = '23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f';
if (hash !== expected) throw new Error('Standalone provenance hash mismatch.');

const index = await readFile(resolve(root, 'index.html'), 'utf8');
for (const asset of ['/assets/styles.css', '/src/data.js', '/src/engine.js', '/src/app.js', '/manifest.webmanifest']) {
  if (!index.includes(asset)) throw new Error(`index.html is missing ${asset}`);
}

// Validate the entire allowlist before touching the previous generated build.
// The immutable standalone stays in Git for provenance, never in production.
const revisionHash = createHash('sha256');
const canonicalRoot = await realpath(root);
for (const file of PUBLIC_FILES) {
  const source = resolve(root, file);
  const canonicalSource = await realpath(source);
  const info = await lstat(source);
  if (!canonicalSource.startsWith(`${canonicalRoot}${sep}`) || !info.isFile() || info.size === 0) {
    throw new Error(`Unsafe or empty public asset: ${file}`);
  }
  revisionHash.update(file).update('\0').update(await readFile(source)).update('\0');
}
const revision = revisionHash.digest('hex').slice(0, 16);
const worker = await readFile(resolve(root, 'sw.js'), 'utf8');
if (!worker.includes('__BUILD_REVISION__')) throw new Error('Service worker is missing its build revision marker.');
const outputInfo = await lstat(output).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (outputInfo && (!outputInfo.isDirectory() || outputInfo.isSymbolicLink())) throw new Error('Unsafe build output directory.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of PUBLIC_FILES) {
  const destination = resolve(output, file);
  await mkdir(dirname(destination), { recursive: true });
  if (file === 'sw.js') await writeFile(destination, worker.replace('__BUILD_REVISION__', revision));
  else await cp(resolve(root, file), destination);
}

const required = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'src/data.js',
  'src/engine.js',
  'src/app.js',
];
for (const file of required) {
  const info = await stat(resolve(output, file));
  if (!info.isFile() || info.size === 0) throw new Error(`Missing build artifact: ${file}`);
}

console.log(`Production build ready in dist/ (${PUBLIC_FILES.length} public files, cache revision ${revision}, standalone SHA-256 ${hash.slice(0, 12)}...).`);
