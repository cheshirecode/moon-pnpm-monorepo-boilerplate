import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const args = process.argv.slice(2);
const mode = args.find((arg) => !arg.startsWith('-')) ?? 'json';
const affected = args.includes('--affected');
const baseRef = process.env.CHANGESET_BASE_REF ?? 'origin/main';

if (!new Set(['json', 'csv']).has(mode) || args.includes('-h') || args.includes('--help')) {
  console.log(`Usage: scripts/list-coverage-packages.mjs [json|csv] [--affected]

Outputs package directory names for packages that define a coverage script.
Use json for GitHub Actions matrices and csv for Coveralls carryforward.

--affected  Filter to packages changed since the base ref (PR-only).
            On push to main, omit --affected to run all coverage packages.
`);
  process.exit(mode === 'json' || mode === 'csv' ? 0 : 2);
}

const entries = await readdir(packagesDir, { withFileTypes: true });
let packageNames = [];

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

if (affected) {
  const changedDirs = await getChangedPackageDirs(baseRef);
  packageNames = packageNames.filter((name) => changedDirs.has(name));
}

if (mode === 'csv') {
  console.log(packageNames.join(','));
} else {
  console.log(JSON.stringify(packageNames));
}

function getChangedPackageDirs(ref) {
  return new Promise((resolvePromise) => {
    const child = spawn('git', ['diff', '--name-only', `${ref}...HEAD`], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.on('error', () => resolvePromise(new Set()));
    child.on('exit', (code) => {
      if (code !== 0) {
        resolvePromise(new Set());
        return;
      }

      const dirs = new Set();
      for (const file of output.trim().split('\n').filter(Boolean)) {
        const parts = file.split('/');
        if (parts.length >= 2 && parts[0] === 'packages') {
          dirs.add(parts[1]);
        }
      }
      resolvePromise(dirs);
    });
  });
}
