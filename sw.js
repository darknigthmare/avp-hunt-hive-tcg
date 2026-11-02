const CACHE_PREFIX = 'avp-hunt-hive-';
const SHELL_CACHE_PREFIX = `${CACHE_PREFIX}shell-`;
const ART_CACHE_PREFIX = `${CACHE_PREFIX}art-`;
// Replaced with a hash of all public files by scripts/build.mjs.
const CACHE_NAME = `${SHELL_CACHE_PREFIX}v1.0.0-__BUILD_REVISION__`;
const ART_CACHE_NAME = `${ART_CACHE_PREFIX}v1.0.0-__BUILD_REVISION__`;
const ART_CACHE_LIMIT = 80;
const ART_PATH = /^\/assets\/art\/(?:cards|scenes)\/[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.webp$/;
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/assets/styles.css',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/src/data.js',
  '/src/expansion.js',
  '/src/art-manifest.js',
  '/src/engine.js',
  '/src/duel-save.js',
  '/src/app.js',
  '/assets/art/scenes/home-hero-v1.webp',
];

function isCacheableArtwork(response) {
  return response?.ok && response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() === 'image/webp';
}

async function artworkResponse(url) {
  const key = new Request(`${url.origin}${url.pathname}`);
  let cache = null;
  let cached = null;
  try {
    cache = await caches.open(ART_CACHE_NAME);
    try {
      cached = await cache.match(key);
    } catch {
      // CacheStorage accelerates artwork, but a broken read must not block
      // a same-origin network response.
    }
  } catch {
    // Private browsing, quota pressure or storage corruption can make the
    // Cache API unavailable while ordinary network requests still work.
  }
  if (cached && isCacheableArtwork(cached)) return cached;
  if (cached && cache) {
    try {
      await cache.delete(key);
    } catch {
      // A poisoned cache entry is ignored even if it cannot be removed.
    }
  }
  try {
    const response = await fetch(new Request(`${url.origin}${url.pathname}`, { cache: 'no-cache' }));
    if (cache && isCacheableArtwork(response) && ['basic', 'default'].includes(response.type)) {
      try {
        await cache.put(key, response.clone());
        try {
          const keys = await cache.keys();
          while (keys.length > ART_CACHE_LIMIT) {
            const oldest = keys.shift();
            try {
              await cache.delete(oldest);
            } catch {
              // A pruning failure must never replace a valid network image.
            }
          }
        } catch {
          // Keep serving the network image if cache enumeration is unavailable.
        }
      } catch {
        // Quota or write failures do not invalidate a successful fetch.
      }
    }
    return response;
  } catch {
    return new Response('', {
      status: 503,
      statusText: 'Artwork unavailable offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

self.addEventListener('install', (event) => {
  // Bypass HTTP cache and install a complete shell atomically. Existing duels
  // keep their active worker until closed, rather than mixing build versions.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL.map((path) => new Request(path, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && ![CACHE_NAME, ART_CACHE_NAME].includes(key)).map((key) => caches.delete(key))))
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
  // Vercel clean URLs redirect /index.html to /. Navigation requests cannot
  // receive that redirected cached response, even when its final status is 200.
  const cacheKey = isHome ? '/' : url.pathname;

  // Pin HTML, CSS and JS to one build. Runtime fetches cannot overwrite the
  // shell or expand the cache with arbitrary URLs.
  if (APP_SHELL.includes(cacheKey)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => cache.match(cacheKey)).then((cached) => {
        if (cached) return cached;
        return fetch(request).catch(() => new Response('Hors ligne : ouvrez le jeu une fois avec une connexion pour installer les fichiers.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }));
      }),
    );
    return;
  }
  if (ART_PATH.test(url.pathname)) event.respondWith(artworkResponse(url));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
