import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART_PUBLIC_FILES } from './art-public-files.mjs';

// One explicit publication contract for the build and the local server.
// Archives, configuration, tests, source maps and dotfiles are not web assets.
const BASE_PUBLIC_FILES = Object.freeze([
  'index.html', 'manifest.webmanifest', 'sw.js', 'robots.txt',
  'assets/styles.css', 'assets/icon.svg', 'assets/icon-192.png',
  'assets/icon-512.png', 'assets/icon-maskable-512.png',
  'src/data.js', 'src/expansion.js', 'src/expansion-wave2.js', 'src/deck-productions.js', 'src/asymmetric-cards.js', 'src/asymmetric-decks.js', 'src/art-manifest.js', 'src/engine.js', 'src/asymmetric-rules.js', 'src/duel-save.js', 'src/app.js',
]);
const ART_PATH = /^assets\/art\/(?:manifest\.json|(?:cards|scenes)\/[a-z0-9][a-z0-9_-]*-v[1-9][0-9]*\.webp)$/;
if (!Array.isArray(ART_PUBLIC_FILES) || ART_PUBLIC_FILES.some((file) => !ART_PATH.test(file))) {
  throw new Error('Invalid generated artwork publication list.');
}
export const PUBLIC_FILES = Object.freeze([...new Set([...BASE_PUBLIC_FILES, ...ART_PUBLIC_FILES])]);
const publicFiles = new Set(PUBLIC_FILES);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

export const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; worker-src 'self'; manifest-src 'self'; media-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
});

function publicPath(target) {
  if (!target.startsWith('/') || target.startsWith('//')) throw new URIError('Invalid request target');
  // Validate before URL normalization, including encoded dot segments.
  // decodeURIComponent can throw; the request handler returns a safe 400.
  const pathname = decodeURIComponent(target.split(/[?#]/, 1)[0]);
  if (/[\u0000-\u001f\u007f\\]/.test(pathname)) throw new URIError('Invalid path');
  if (pathname.split('/').some((part) => part.startsWith('.'))) return null;
  const relative = pathname === '/' || pathname === '/index' ? 'index.html' : pathname.slice(1);
  return publicFiles.has(relative) ? relative : null;
}

async function fileFor(root, relative) {
  if (!relative) return null;
  try {
    const candidate = await realpath(resolve(root, relative));
    const canonicalRoot = await realpath(root);
    if (!candidate.startsWith(`${canonicalRoot}${sep}`)) return null;
    const info = await stat(candidate);
    if (info.isFile()) return { candidate, info };
  } catch {
    // Missing, inaccessible or broken links are ordinary 404 responses.
  }
  return null;
}

export function createStaticServer(directory) {
  const root = resolve(directory);
  return createServer(async (request, response) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.setHeader(name, value);
    response.setHeader('Cache-Control', 'no-store');
    const fail = (status, message) => {
      response.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(message),
      });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      fail(405, 'Method not allowed');
      return;
    }
    let relative;
    try {
      relative = publicPath(request.url || '/');
    } catch {
      fail(400, 'Bad request');
      return;
    }
    if (relative?.endsWith('.webp')) response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    const found = await fileFor(root, relative);
    if (!found) {
      fail(404, 'Not found');
      return;
    }
    if (relative === 'sw.js') response.setHeader('Service-Worker-Allowed', '/');
    response.writeHead(200, {
      'Content-Type': mime[extname(relative)] || 'application/octet-stream',
      'Content-Length': found.info.size,
    });
    if (request.method === 'HEAD') response.end();
    else {
      const stream = createReadStream(found.candidate);
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] || '.');
  const port = Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535.');
  const server = createStaticServer(root);
  server.listen(port, '127.0.0.1', () => {
    console.log(`AVP HUNT // HIVE available at http://127.0.0.1:${server.address().port} from ${root}`);
  });
}
