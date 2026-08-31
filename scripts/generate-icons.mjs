import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = resolve(root, 'assets');
await mkdir(assets, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const body = Buffer.concat([name, data]);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function renderIcon(size, maskable = false) {
  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  const pad = maskable ? 0.74 : 0.92;
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    scanlines[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size * 2 - 1) / pad;
      const ny = ((y + 0.5) / size * 2 - 1) / pad;
      const radius = Math.hypot(nx, ny);
      const vignette = Math.max(0, 1 - radius * 0.72);
      const noise = (((x * 17 + y * 31) % 23) / 23 - 0.5) * 4;
      let r = 4 + 6 * vignette + noise;
      let g = 10 + 15 * vignette + noise;
      let b = 11 + 14 * vignette + noise;

      const hex = Math.abs(Math.max(Math.abs(nx) * 0.866 + Math.abs(ny) * 0.5, Math.abs(ny)) - 0.58);
      const clawA = segmentDistance(nx, ny, -0.42, -0.48, -0.02, 0.04);
      const clawB = segmentDistance(nx, ny, 0.42, -0.48, 0.02, 0.04);
      const clawC = segmentDistance(nx, ny, 0, 0.02, 0, 0.58);
      const eye = Math.abs((nx * nx) / 0.12 + (ny * ny) / 0.025 - 1);
      const acid = Math.max(0, 1 - Math.min(hex / 0.045, clawA / 0.075, clawB / 0.075, clawC / 0.075));
      const cyan = Math.max(0, 1 - eye / 0.42) * (Math.abs(ny) < 0.2 ? 1 : 0);
      const glow = Math.max(0, 1 - Math.min(hex / 0.16, clawA / 0.19, clawB / 0.19, clawC / 0.19)) * 0.32;

      r += acid * 170 + glow * 55 + cyan * 30;
      g += acid * 236 + glow * 120 + cyan * 145;
      b += acid * 62 + glow * 35 + cyan * 210;

      const offset = row + 1 + x * 4;
      scanlines[offset] = Math.max(0, Math.min(255, Math.round(r)));
      scanlines[offset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      scanlines[offset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      scanlines[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

await Promise.all([
  writeFile(resolve(assets, 'icon-192.png'), renderIcon(192)),
  writeFile(resolve(assets, 'icon-512.png'), renderIcon(512)),
  writeFile(resolve(assets, 'icon-maskable-512.png'), renderIcon(512, true)),
]);

console.log('Original PWA icons generated.');
