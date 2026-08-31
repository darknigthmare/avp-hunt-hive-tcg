const CACHE_PREFIX = 'avp-hunt-hive-';
// Replaced with a hash of all public files by scripts/build.mjs.
const CACHE_NAME = `${CACHE_PREFIX}v1.0.0-__BUILD_REVISION__`;
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/styles.css',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/src/data.js',
  '/src/engine.js',
  '/src/app.js',
];

self.addEventListener('install', (event) => {
  // Bypass HTTP cache and install a complete shell atomically. Existing duels
  // keep their active worker until closed, rather than mixing build versions.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL.map((path) => new Request(path, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHome = ['/', '/index', '/index.html'].includes(url.pathname);
  // Unknown and sensitive routes never become successful offline pages.
  if (request.mode === 'navigate' && !isHome) return;
  const cacheKey = isHome ? '/index.html' : url.pathname;
  if (!APP_SHELL.includes(cacheKey)) return;

  // Pin HTML, CSS and JS to one build. Runtime fetches cannot overwrite the
  // shell or expand the cache with arbitrary URLs.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(cacheKey)).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => new Response('Hors ligne : ouvrez le jeu une fois avec une connexion pour installer les fichiers.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }));
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
