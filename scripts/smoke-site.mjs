#!/usr/bin/env node
// Smoke-tests a deployed combined site (Netlify deploy preview or production URL).
// Usage: node scripts/smoke-site.mjs <base-url>
//   e.g. node scripts/smoke-site.mjs https://deploy-preview-42--my-site.netlify.app
//
// With --local, serves the local dist-site/ directory and tests against it.
//   e.g. node scripts/smoke-site.mjs --local

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const local = process.argv.includes('--local');
let base = process.argv.find((a) => a.startsWith('http'));

let server;
if (local) {
  base = await serveLocal();
} else if (!base) {
  console.error('Usage: node scripts/smoke-site.mjs <base-url>');
  console.error('       node scripts/smoke-site.mjs --local');
  process.exit(2);
}

base = base.replace(/\/$/, '');

const routes = [
  ['/', 'text/html'],
  ['/favicon.ico', 'image/'],
  ['/apps/vue/', 'text/html'],
  ['/apps/svelte/', 'text/html'],
  ['/apps/preact/', 'text/html'],
  ['/apps/solidjs/', 'text/html'],
  ['/apps/astro/', 'text/html'],
  ['/apps/react', 'text/html'],
  ['/apps/react/client/entry-hydration.js', 'javascript']
];

const failures = [];
for (const [path, ctPrefix] of routes) {
  try {
    const res = await fetch(base + path, { redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    const ok = res.status === 200 && ct.includes(ctPrefix);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(res.status).padEnd(3)} ${ct.split(';')[0].padEnd(24)} ${path}`);
    if (!ok) failures.push(`${path} -> ${res.status} ${ct}`);
  } catch (err) {
    console.log(`FAIL  ERR  ${path}: ${err.message}`);
    failures.push(`${path} -> ${err.message}`);
  }
}

try {
  const html = await (await fetch(base + '/apps/react')).text();
  const ssrOk = /<div id="root">\s*<\S/.test(html) && html.includes('/apps/react/client/entry-hydration.js');
  console.log(`${ssrOk ? 'PASS' : 'FAIL'}  app-react SSR (rendered tree + prefixed hydration script)`);
  if (!ssrOk) failures.push('app-react SSR content missing');
} catch (err) {
  failures.push(`app-react SSR fetch: ${err.message}`);
}

if (server) server.close();
if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed.`);
  process.exit(1);
}
console.log('\nAll smoke checks passed.');

async function serveLocal() {
  const distDir = join(root, 'dist-site');
  server = createServer(async (req, res) => {
    const filePath = join(distDir, req.url === '/' ? 'index.html' : req.url);
    try {
      const content = await readFile(filePath);
      const ext = extname(filePath);
      const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      console.log(`Local server at http://localhost:${port}`);
      resolve(`http://localhost:${port}`);
    });
  });
}