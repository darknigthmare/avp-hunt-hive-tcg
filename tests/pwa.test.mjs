import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { readFile, readdir, stat } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runInNewContext } from 'node:vm';
import test, { after, before } from 'node:test';
import { createStaticServer, PUBLIC_FILES, SECURITY_HEADERS } from '../scripts/serve.mjs';

const root = new URL('../', import.meta.url);
const run = promisify(execFile);
let server;
let origin;

before(async () => {
  server = createStaticServer(fileURLToPath(root));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  server.closeIdleConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function request(path, method = 'GET', target = server) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ hostname: '127.0.0.1', port: target.address().port, path, method }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.setTimeout(5000, () => req.destroy(new Error('HTTP test timed out')));
    req.on('error', reject);
    req.end();
  });
}

async function publicTree(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await publicTree(new URL(`${entry.name}/`, directory), `${name}/`));
    else files.push(name);
  }
  return files.sort();
}

// Execute the real worker with an in-memory Cache API and actual shell fetches.
// This covers policy and lifecycle deterministically; browser installation is a
// separate release gate, not something this harness pretends to emulate fully.
async function workerHarness(network = (req) => fetch(req.url), cacheFailures = {}) {
  const listeners = new Map();
  const stores = new Map();
  const calls = { fetches: [], installs: [], skips: 0, claims: 0 };
  const networkFetch = async (req) => { calls.fetches.push(req.url); return network(req); };
  const context = {
    URL, Response,
    Request: class extends Request {
      constructor(input, options) { super(new URL(input, origin), options); }
    },
    fetch: networkFetch,
    self: {
      location: { origin },
      addEventListener: (type, handler) => listeners.set(type, handler),
      skipWaiting: () => { calls.skips += 1; },
      clients: { claim: () => { calls.claims += 1; } },
    },
    caches: {
      keys: async () => [...stores.keys()],
      delete: async (name) => stores.delete(name),
      open: async (name) => {
        if (cacheFailures.open) throw new Error('CacheStorage unavailable');
        if (!stores.has(name)) stores.set(name, new Map());
        const entries = stores.get(name);
        const keyFor = (key) => new URL(typeof key === 'string' ? key : key.url, origin).pathname;
        return {
          match: async (key) => {
            if (cacheFailures.match) throw new Error('Cache read failed');
            return entries.get(keyFor(key))?.clone();
          },
          put: async (key, response) => {
            if (cacheFailures.put) throw new Error('Cache write failed');
            return entries.set(keyFor(key), response);
          },
          delete: async (key) => {
            if (cacheFailures.entryDelete) throw new Error('Cache prune failed');
            return entries.delete(keyFor(key));
          },
          keys: async () => {
            if (cacheFailures.entryKeys) throw new Error('Cache enumeration failed');
            return [...entries.keys()].map((path) => new Request(new URL(path, origin)));
          },
          addAll: async (requests) => {
            calls.installs.push(...requests);
            const responses = await Promise.all(requests.map(async (req) => {
              const response = await networkFetch(req);
              if (!response.ok) throw new Error('Incomplete app shell');
              return [new URL(req.url).pathname, response];
            }));
            for (const [path, response] of responses) entries.set(path, response);
          },
        };
      },
    },
  };
  const worker = await readFile(new URL('sw.js', root), 'utf8');
  const snapshot = runInNewContext(`${worker}\n;({cacheName:CACHE_NAME,artCacheName:ART_CACHE_NAME,artCacheLimit:ART_CACHE_LIMIT,artPath:ART_PATH,shell:APP_SHELL});`, context);
  return {
    ...snapshot, shell: Array.from(snapshot.shell), stores, calls,
    dispatch(type, props = {}) {
      const pending = [];
      let response;
      listeners.get(type)({ ...props, waitUntil: (promise) => pending.push(promise), respondWith: (promise) => { response = promise; } });
      return { response, intercepted: response !== undefined, done: Promise.all(pending) };
    },
    request(path, mode = 'navigate', method = 'GET') {
      return this.dispatch('fetch', { request: { url: new URL(path, origin).href, mode, method } });
    },
  };
}

test('the web app manifest is installable and uses original local icons', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.lang, 'fr');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.start_url.startsWith('/'), true);
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const info = await stat(new URL(icon.src.replace(/^\//, ''), root));
    assert.ok(info.size > 100, `Empty icon: ${icon.src}`);
  }
});

test('the public entry exposes the non-commercial unofficial fan notice', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /class="fan-project-notice"/);
  assert.match(html, /Projet fan non commercial, indépendant et non officiel/);
  assert.match(html, /Aucun lien avec les ayants droit/);
});

test('the service worker precaches a bounded critical shell, not the full art library', async () => {
  const worker = await workerHarness();
  const critical = [
    '/', '/manifest.webmanifest', '/assets/styles.css', '/assets/icon.svg',
    '/assets/icon-192.png', '/assets/icon-512.png', '/assets/icon-maskable-512.png',
    '/src/data.js', '/src/alien-base.js', '/src/expansion.js', '/src/expansion-wave2.js',
    '/src/deck-productions.js', '/src/asymmetric-cards.js', '/src/asymmetric-decks.js',
    '/src/arsenal-cards.js',
    '/src/arsenal-decks.js',
    '/src/hive-cards.js',
    '/src/hive-decks.js',
    '/src/arsenal-rules.js',
    '/src/hive-rules.js',
    '/src/collection.js',
    '/src/art-manifest.js', '/src/engine.js', '/src/asymmetric-rules.js',
    '/src/duel-save.js', '/src/app.js', '/assets/art/scenes/home-hero-v1.webp',
  ];
  assert.deepEqual([...worker.shell].sort(), [...critical].sort(), 'The offline shell must retain Codex and every gameplay module');
  assert.ok(PUBLIC_FILES.filter((file) => file.startsWith('assets/art/')).length >= 175);
  assert.equal(worker.shell.some((file) => file.startsWith('/assets/art/cards/')), false);
  assert.ok(worker.shell.length <= 27, 'The install shell must stay small on mobile');
  await worker.dispatch('install').done;
  assert.ok(!worker.shell.includes('/index.html'), 'Vercel redirects this alias');
  assert.equal(worker.stores.get(worker.cacheName).size, worker.shell.length);
  assert.ok(worker.calls.installs.every((req) => req.cache === 'reload'));
  assert.equal(worker.calls.skips, 0, 'A background update must not interrupt a duel');
});

test('failed app-shell installation rejects instead of activating an incomplete version', async () => {
  const worker = await workerHarness(async (req) => req.url.endsWith('/src/engine.js') ? new Response('failure', { status: 500 }) : new Response('ok'));
  await assert.rejects(worker.dispatch('install').done, /Incomplete app shell/);
  assert.equal(worker.stores.get(worker.cacheName).size, 0);
  assert.equal(worker.calls.skips, 0);
});

test('worker activation removes only obsolete AVP caches', async () => {
  const worker = await workerHarness();
  worker.stores.set('another-application-v1', new Map());
  worker.stores.set('avp-hunt-hive-v1.0.0-r2', new Map());
  worker.stores.set(worker.cacheName, new Map());
  worker.stores.set(worker.artCacheName, new Map());
  await worker.dispatch('activate').done;
  assert.deepEqual([...worker.stores.keys()].sort(), ['another-application-v1', worker.cacheName, worker.artCacheName].sort());
  assert.equal(worker.calls.claims, 1);
  worker.dispatch('message', { data: 'unrelated' });
  assert.equal(worker.calls.skips, 0);
  worker.dispatch('message', { data: 'SKIP_WAITING' });
  assert.equal(worker.calls.skips, 1);
});

test('cached home and modular assets remain one coherent version offline', async () => {
  const worker = await workerHarness(async () => { throw new Error('offline'); });
  const cache = new Map([
    ['/', new Response('pinned home')],
    ['/src/app.js', new Response('pinned script')],
  ]);
  worker.stores.set(worker.cacheName, cache);
  for (const path of ['/', '/?source=pwa', '/index', '/index.html?from=bookmark']) {
    const event = worker.request(path);
    assert.equal(event.intercepted, true);
    assert.equal(await (await event.response).text(), 'pinned home');
  }
  assert.equal(await (await worker.request('/src/app.js?v=anything', 'cors').response).text(), 'pinned script');
  assert.equal(worker.calls.fetches.length, 0);
  const missing = await worker.request('/src/engine.js', 'cors').response;
  assert.equal(missing.status, 503);
  assert.match(await missing.text(), /Hors ligne/);
  assert.equal(cache.size, 2, 'Runtime requests must not overwrite or expand the cache');
});

test('artwork requests use a strict cache-first policy with a bounded cache', async () => {
  let online = true;
  const worker = await workerHarness(async (req) => {
    if (!online) throw new Error('offline');
    return new Response(`art:${new URL(req.url).pathname}`, { status: 200, headers: { 'Content-Type': 'image/webp' } });
  });
  const firstPath = '/assets/art/cards/test-subject-v1.webp';
  let event = worker.request(firstPath, 'cors');
  assert.equal(event.intercepted, true);
  assert.equal(await (await event.response).text(), `art:${firstPath}`);
  assert.equal(worker.stores.get(worker.artCacheName).size, 1);
  online = false;
  event = worker.request(`${firstPath}?ignored=1`, 'cors');
  assert.equal(await (await event.response).text(), `art:${firstPath}`);
  assert.equal(worker.calls.fetches.length, 1);
  const missing = await worker.request('/assets/art/cards/not-cached-v1.webp', 'cors').response;
  assert.equal(missing.status, 503);
  assert.equal(worker.request('/assets/art/cards/not-an-image.png', 'cors').intercepted, false);
  online = true;
  for (let index = 0; index < worker.artCacheLimit + 3; index += 1) {
    await worker.request(`/assets/art/cards/probe-${index}-v1.webp`, 'cors').response;
  }
  const artCache = worker.stores.get(worker.artCacheName);
  assert.equal(artCache.size, worker.artCacheLimit);
  assert.equal(artCache.has(firstPath), false, 'Oldest art is pruned first');
});

test('artwork cache refuses a successful non-WebP response', async () => {
  const path = '/assets/art/cards/rewritten-v1.webp';
  const worker = await workerHarness(async () => new Response('<!doctype html>rewrite', {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));
  const response = await worker.request(path, 'cors').response;
  assert.equal(response.status, 200);
  assert.match(await response.text(), /rewrite/);
  assert.equal(worker.stores.get(worker.artCacheName).has(path), false);
});

test('artwork still returns a revalidated network response when CacheStorage is unavailable or rejects writes', async () => {
  const freshNetwork = async (req) => {
    assert.equal(req.cache, 'no-cache');
    return new Response('fresh network art', { status: 200, headers: { 'Content-Type': 'image/webp' } });
  };
  for (const cacheFailures of [{ open: true }, { match: true }, { put: true }, { entryKeys: true }]) {
    const worker = await workerHarness(freshNetwork, cacheFailures);
    const response = await worker.request('/assets/art/cards/cache-failure-v1.webp', 'cors').response;
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'fresh network art');
    assert.equal(worker.calls.fetches.length, 1);
  }
  const worker = await workerHarness(freshNetwork, { entryDelete: true });
  worker.stores.set(worker.artCacheName, new Map(Array.from(
    { length: worker.artCacheLimit },
    (_, index) => [`/assets/art/cards/cached-${index}-v1.webp`, new Response('cached')],
  )));
  const response = await worker.request('/assets/art/cards/cache-prune-failure-v1.webp', 'cors').response;
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'fresh network art');
  assert.equal(worker.calls.fetches.length, 1);
});

test('navigation aliases use canonical home instead of the Vercel-redirected HTML alias', async () => {
  const worker = await workerHarness(async () => { throw new Error('offline'); });
  worker.stores.set(worker.cacheName, new Map([
    ['/', new Response('canonical home')],
    ['/index.html', new Response('redirected alias - not safe for navigation')],
  ]));
  for (const path of ['/', '/?offline-proof=1', '/index', '/index.html']) {
    const response = await worker.request(path).response;
    assert.equal(await response.text(), 'canonical home', path);
    assert.equal(response.redirected, false);
  }
  assert.equal(worker.calls.fetches.length, 0);
});

test('worker never intercepts unknown, sensitive, cross-origin or write requests', async () => {
  const worker = await workerHarness();
  for (const path of ['/.env', '/.git/config', '/README.md', '/unknown', '/AVP_HUNT_HIVE_TCG_STANDALONE.html']) {
    assert.equal(worker.request(path).intercepted, false, path);
    assert.equal(worker.request(path, 'cors').intercepted, false, path);
  }
  assert.equal(worker.request('https://example.invalid/src/app.js', 'cors').intercepted, false);
  assert.equal(worker.request('/', 'navigate', 'POST').intercepted, false);
  assert.equal(worker.calls.fetches.length, 0);
});

test('HTTP serves each allowlisted asset, clean home aliases and correct HEAD responses', async () => {
  for (const file of PUBLIC_FILES) {
    const result = await request(`/${file}`);
    assert.equal(result.status, 200, file);
    assert.deepEqual(result.body, await readFile(new URL(file, root)), file);
    assert.notEqual(result.headers['content-type'], 'application/octet-stream', file);
    assert.equal(result.headers['x-content-type-options'], 'nosniff');
    if (file.startsWith('assets/art/') && file.endsWith('.webp')) {
      assert.equal(result.headers['cache-control'], 'public, max-age=0, must-revalidate', file);
    }
  }
  for (const path of ['/', '/index', '/?source=pwa']) assert.equal((await request(path)).status, 200, path);
  const head = await request('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  assert.equal(Number(head.headers['content-length']), (await stat(new URL('index.html', root))).size);
  assert.equal((await request('/sw.js')).headers['service-worker-allowed'], '/');
});

test('HTTP refuses malformed URL encodings without crashing the server', async () => {
  for (const path of ['/%', '/%ZZ', '/%E0%A4%A', '/%FF', '/%00', '/%5cindex.html', '//example.invalid/', 'http://example.invalid/']) {
    const result = await request(path);
    assert.equal(result.status, 400, path);
    assert.equal(result.body.toString(), 'Bad request');
    assert.equal((await request('/')).status, 200, 'The next request must still work');
  }
});

test('HTTP denies source archives, private files, traversal, maps and unsupported methods', async () => {
  for (const path of ['/.env', '/.git/config', '/.vercel/project.json', '/package.json', '/vercel.json', '/README.md', '/SOURCE_PROVENANCE.md', '/AGENTS.md', '/AVP_HUNT_HIVE_TCG_STANDALONE.html', '/AVP_HUNT_HIVE_TCG_STANDALONE', '/scripts/build.mjs', '/tests/pwa.test.mjs', '/src/app.js.map', '/assets/.secret', '/../index.html', '/%2e%2e/index.html', '/assets/%2e%2e/index.html', '/%252e%252e/index.html', '/not-found']) {
    const result = await request(path);
    assert.equal(result.status, 404, path);
    assert.equal(result.body.toString(), 'Not found');
  }
  const head = await request('/.env', 'HEAD');
  assert.equal(head.status, 404);
  assert.equal(head.body.length, 0);
  const post = await request('/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('production build contains only public files and a content-derived worker revision', async () => {
  const { stdout } = await run(process.execPath, ['scripts/build.mjs'], { cwd: fileURLToPath(root), timeout: 30000 });
  assert.match(stdout, /Production build ready/);
  assert.deepEqual(await publicTree(new URL('dist/', root)), [...PUBLIC_FILES].sort());
  const digest = createHash('sha256');
  for (const file of PUBLIC_FILES) digest.update(file).update('\0').update(await readFile(new URL(file, root))).update('\0');
  const worker = await readFile(new URL('dist/sw.js', root), 'utf8');
  assert.ok(worker.includes(`v1.0.0-${digest.digest('hex').slice(0, 16)}`));
  assert.equal(worker.includes('__BUILD_REVISION__'), false);
  const sourceHash = createHash('sha256').update(await readFile(new URL('AVP_HUNT_HIVE_TCG_STANDALONE.html', root))).digest('hex');
  assert.equal(sourceHash, '23a462d5fec16bf2feede14d1d69f1829e188db85df7860b3324127d2701d78f');
  const production = createStaticServer(fileURLToPath(new URL('dist/', root)));
  production.listen(0, '127.0.0.1');
  await once(production, 'listening');
  try {
    for (const file of PUBLIC_FILES) assert.equal((await request(`/${file}`, 'GET', production)).status, 200, file);
    for (const path of ['/AVP_HUNT_HIVE_TCG_STANDALONE.html', '/.env', '/.git/config', '/README.md']) assert.equal((await request(path, 'GET', production)).status, 404, path);
  } finally {
    await new Promise((resolve, reject) => production.close((error) => error ? reject(error) : resolve()));
  }
});

test('Vercel serves the verified dist build with defensive headers', async () => {
  const config = JSON.parse(await readFile(new URL('vercel.json', root), 'utf8'));
  assert.equal(config.buildCommand, 'npm run vercel-build');
  assert.equal(config.outputDirectory, 'dist');
  const artRoute = config.headers.find((route) => route.source === '/assets/art/(.*).webp');
  assert.equal(artRoute?.headers.find((header) => header.key === 'Cache-Control')?.value, 'public, max-age=0, must-revalidate');
  const allHeaders = config.headers.flatMap((route) => route.headers);
  const byName = new Map(allHeaders.map((header) => [header.key.toLowerCase(), header.value]));
  assert.equal(byName.get('x-content-type-options'), 'nosniff');
  assert.match(byName.get('content-security-policy'), /script-src 'self'/);
  assert.match(byName.get('content-security-policy'), /object-src 'none'/);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.equal(byName.get(name.toLowerCase()), value, `Local and production headers differ: ${name}`);
});
