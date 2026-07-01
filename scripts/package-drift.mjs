import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const errors = [];
const staleAppRef = `app-${1}`;

const moonAllowlist = new Set(['tsconfig']);
const coverageScriptAllowlist = new Set(['tsconfig']);
const dogfoodAllowlist = new Set([]);
const expectedVersions = new Map([
  ['@types/node', '^24.10.2'],
  ['@vitejs/plugin-react', '^6.0.3'],
  ['@vitest/coverage-v8', '^4.1.9'],
  ['react', '^19.2.7'],
  ['react-dom', '^19.2.7'],
  ['typescript', '^6.0.3'],
  ['vite', '^8.1.2'],
  ['vitest', '^4.1.9']
]);

const dogfoodScript = await readFile(join(root, 'scripts', 'dogfood.mjs'), 'utf8');
const entries = (await readdir(packagesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const dirName of entries) {
  const packageDir = join(packagesDir, dirName);
  const packageJsonPath = join(packageDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    errors.push(`packages/${dirName} is missing package.json`);
    continue;
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const packageName = packageJson.name ?? dirName;
  const scripts = packageJson.scripts ?? {};
  const deps = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {})
  };

  if (!moonAllowlist.has(dirName) && !existsSync(join(packageDir, 'moon.yml'))) {
    errors.push(`${dirName} is missing moon.yml`);
  }

  if (scripts.test && !scripts.coverage && !coverageScriptAllowlist.has(dirName)) {
    errors.push(`${dirName} defines test but not coverage`);
  }

  if (scripts.coverage && !deps['@vitest/coverage-v8']) {
    errors.push(`${dirName} defines coverage but is missing @vitest/coverage-v8`);
  }

  for (const [dependency, expected] of expectedVersions) {
    const actual = deps[dependency];
    if (actual && actual !== expected) {
      errors.push(`${dirName} uses ${dependency}@${actual}; expected ${expected}`);
    }
  }

  if (packageJson.private !== true && !dogfoodAllowlist.has(packageName) && !dogfoodScript.includes(packageName)) {
    errors.push(`${packageName} is publishable but has no explicit dogfood assertion`);
  }
}

const staleAppRefs = await staleReferences();
for (const ref of staleAppRefs) {
    errors.push(`stale ${staleAppRef} reference: ${ref}`);
}

if (errors.length > 0) {
  console.error('Package drift check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Package drift check passed for ${entries.length} package(s).`);

async function staleReferences() {
  const stale = [];
  const ignoredDirs = new Set([
    '.artifacts',
    '.git',
    '.moon',
    '.rush',
    'common',
    'coverage',
    'dist',
    'node_modules',
    'rush-logs',
    'storybook-static'
  ]);
  const ignoredFiles = new Set(['pnpm-lock.yaml']);

  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }

      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }

      if (ignoredFiles.has(entry.name)) {
        continue;
      }

      const content = await readText(path);
      if (content?.includes(staleAppRef)) {
        stale.push(path.slice(root.length + 1));
      }
    }
  }

  await visit(root);
  return stale;
}

async function readText(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
}
