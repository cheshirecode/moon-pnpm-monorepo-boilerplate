#!/usr/bin/env node
// Update the Netlify deploy-status badge in README.md with the current site id/name.
//
// Resolution order for each value:
//   --site-id <id>        > NETLIFY_SITE_ID | SITE_ID  > .netlify/state.json (siteId)
//   --site-name <name>    > NETLIFY_SITE_NAME | SITE_NAME
//
// The badge image uses the site's API id (a UUID); the link uses the site's name.
// Run after connecting, renaming, or re-creating the Netlify site.
//   node scripts/update-netlify-badge.mjs --site-id <uuid> --site-name <name>
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

function stateSiteId() {
  const p = join(root, '.netlify', 'state.json');
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, 'utf8')).siteId;
  } catch {
    return undefined;
  }
}

const siteId = flag('--site-id') || process.env.NETLIFY_SITE_ID || process.env.SITE_ID || stateSiteId();
const siteName = flag('--site-name') || process.env.NETLIFY_SITE_NAME || process.env.SITE_NAME;

if (!siteId) {
  console.error('No site id found. Pass --site-id <uuid>, set NETLIFY_SITE_ID, or run `netlify link` first.');
  process.exit(1);
}

const readmePath = join(root, 'README.md');
const before = await readFile(readmePath, 'utf8');
let readme = before.replace(
  /(api\.netlify\.com\/api\/v1\/badges\/)[^/]+(\/deploy-status)/,
  `$1${siteId}$2`
);
if (siteName) {
  readme = readme.replace(/(app\.netlify\.com\/sites\/)[^/)]+(\/deploys)/, `$1${siteName}$2`);
}

if (!/api\.netlify\.com\/api\/v1\/badges\//.test(before)) {
  console.error('No Netlify badge found in README.md.');
  process.exit(1);
}

if (readme === before) {
  console.log('README badge already up to date.');
} else {
  await writeFile(readmePath, readme);
  console.log(`Updated README badge: site id ${siteId}${siteName ? `, name ${siteName}` : ' (name unchanged; pass --site-name to update the link)'}.`);
}
