#!/usr/bin/env node
// Generates public/favicon.ico — a 32x32 crescent moon (fits "moon-pnpm").
// Emits a classic 32-bit BGRA ICO (no external deps). Re-run to regenerate.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 32;
const H = 32;
// Moon color (amber/gold).
const [R, G, B] = [0xf5, 0xc5, 0x18];

const inside = (cx, cy, r, x, y) => {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
};

// Logical RGBA, top-down.
const rgba = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const lit = inside(13, 16, 13, x, y) && !inside(20, 12, 12.5, x, y);
    if (lit) {
      const i = (y * W + x) * 4;
      rgba[i] = R;
      rgba[i + 1] = G;
      rgba[i + 2] = B;
      rgba[i + 3] = 255;
    }
  }
}

// ICO XOR bitmap is BGRA, bottom-up.
const xor = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const src = (y * W + x) * 4;
    const dst = ((H - 1 - y) * W + x) * 4;
    xor[dst] = rgba[src + 2];
    xor[dst + 1] = rgba[src + 1];
    xor[dst + 2] = rgba[src];
    xor[dst + 3] = rgba[src + 3];
  }
}
const andMask = Buffer.alloc((W * H) / 8); // all zero -> alpha channel decides

const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0); // header size
dib.writeInt32LE(W, 4); // width
dib.writeInt32LE(H * 2, 8); // height (XOR + AND)
dib.writeUInt16LE(1, 12); // planes
dib.writeUInt16LE(32, 14); // bpp
const bmp = Buffer.concat([dib, xor, andMask]);

const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0); // reserved
dir.writeUInt16LE(1, 2); // type: icon
dir.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry[0] = W;
entry[1] = H;
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(bmp.length, 8);
entry.writeUInt32LE(6 + 16, 12); // offset

const ico = Buffer.concat([dir, entry, bmp]);
const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'favicon.ico');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, ico);
console.log(`wrote ${out} (${ico.length} bytes)`);
