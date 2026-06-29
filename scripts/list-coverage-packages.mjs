import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const mode = process.argv[2] ?? 'json';

if (!new Set(['json', 'csv']).has(mode) || process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(`Usage: scripts/list-coverage-packages.mjs [json|csv]

Outputs package directory names for packages that define a coverage script.
Use json for GitHub Actions matrices and csv for Coveralls carryforward.
`);
  process.exit(mode === 'json' || mode === 'csv' ? 0 : 2);
}

const entries = await readdir(packagesDir, { withFileTypes: true });
const packageNames = [];

for (const entry of entries) {
  if (!entry.isDirectory()) {
    continue;
  }

  const packageJsonPath = join(packagesDir, entry.name, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

  if (packageJson.scripts?.coverage) {
    packageNames.push(entry.name);
  }
}

packageNames.sort();

if (mode === 'csv') {
  console.log(packageNames.join(','));
} else {
  console.log(JSON.stringify(packageNames));
}
