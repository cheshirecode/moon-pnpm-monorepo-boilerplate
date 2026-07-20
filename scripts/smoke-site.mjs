#!/usr/bin/env node
// Smoke-tests a deployed combined site (Netlify deploy preview or production URL).
// Usage: node scripts/smoke-site.mjs <base-url>
//   e.g. node scripts/smoke-site.mjs https://deploy-preview-42--my-site.netlify.app
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: node scripts/smoke-site.mjs <base-url>');
  process.exit(2);
}

// path -> expected content-type prefix
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

// app-react must be genuinely server-rendered with subpath-prefixed assets.
try {
  const html = await (await fetch(base + '/apps/react')).text();
  const ssrOk = /<div id="root">\s*<\S/.test(html) && html.includes('/apps/react/client/entry-hydration.js');
  console.log(`${ssrOk ? 'PASS' : 'FAIL'}  app-react SSR (rendered tree + prefixed hydration script)`);
  if (!ssrOk) failures.push('app-react SSR content missing');
} catch (err) {
  failures.push(`app-react SSR fetch: ${err.message}`);
}

if (failures.length) {
  console.error(`\n${failures.length} smoke check(s) failed.`);
  process.exit(1);
}
console.log('\nAll smoke checks passed.');
