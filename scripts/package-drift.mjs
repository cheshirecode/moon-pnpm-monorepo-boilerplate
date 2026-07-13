import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { verifyRendererShowcase } from './verify-renderer-showcase.mjs';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const errors = [];
const staleAppRef = `app-${1}`;
const removedUtilityRefs = [
  '@cheshirecode/app-utils',
  '@cheshirecode/form-validators',
  '@cheshirecode/url-search-params',
  '@cheshirecode/url-state',
  'packages/app-utils',
  'packages/form-validators',
  'packages/url-search-params',
  'packages/url-state',
  '@fieryeagle/'
];

const moonAllowlist = new Set(['tsconfig']);
const coverageScriptAllowlist = new Set(['tsconfig']);
const testAllowlist = new Set(['tsconfig']);
const dogfoodAllowlist = new Set([]);
const expectedVersions = new Map([
  ['@types/node', '^24.10.2'],
  ['@hono/node-server', '^1.14.0'],
  ['@vitejs/plugin-react', '^6.0.3'],
  ['@vitest/coverage-v8', '^4.1.9'],
  ['react', '^19.2.7'],
  ['react-dom', '^19.2.7'],
  ['hono', '^4.9.0'],
  ['typescript', '^7.0.2'],
  ['vite', '^8.1.2'],
  ['vitest', '^4.1.9']
]);
const typescriptVersionExceptions = new Map([
  ['app-astro', '^6.0.3'],
  ['app-svelte', '^6.0.3'],
  ['app-vue', '^6.0.3'],
  ['eslint-config-react', '^6.0.3']
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
    const packageExpected = dependency === 'typescript'
      ? typescriptVersionExceptions.get(dirName) ?? expected
      : expected;
    if (actual && actual !== packageExpected) {
      errors.push(`${dirName} uses ${dependency}@${actual}; expected ${packageExpected}`);
    }
  }

  if (packageJson.private !== true && !dogfoodAllowlist.has(packageName) && !dogfoodScript.includes(packageName)) {
    errors.push(`${packageName} is publishable but has no explicit dogfood assertion`);
  }

  if (packageJson.private !== true) {
    if (!existsSync(join(packageDir, 'README.md'))) {
      errors.push(`${dirName} is publishable but has no README.md`);
    }
    if (!packageJson.license) {
      errors.push(`${dirName} is publishable but has no license field`);
    }
    if (!testAllowlist.has(dirName) && !scripts.test) {
      errors.push(`${dirName} is publishable but has no test script`);
    }
  }
}

const staleRefs = await staleReferences([
  staleAppRef,
  ...removedUtilityRefs
]);
for (const { path, token } of staleRefs) {
  errors.push(`stale ${token} reference: ${path}`);
}

const honoBaseSources = await sourceFiles(join(packagesDir, 'hono-base', 'src'));
for (const path of honoBaseSources) {
  const content = await readFile(path, 'utf8');
  for (const token of ['node:', '@hono/node-server']) {
    if (content.includes(token)) {
      errors.push(`hono-base runtime boundary imports ${token}: ${path.slice(root.length + 1)}`);
    }
  }
}

const browserSources = [
  'packages/app-react/src/entry-hydration.tsx',
  'packages/app-react/src/entry-microfrontend.tsx',
  'packages/app-react/src/shared/AppTree.tsx',
  'packages/app-react/src/client/ErrorBoundary.tsx'
];
for (const relativePath of browserSources) {
  const content = await readFile(join(root, relativePath), 'utf8');
  for (const token of ['node:', '@hono/node-server', '/server/']) {
    if (content.includes(token)) {
      errors.push(`app-react browser boundary imports ${token}: ${relativePath}`);
    }
  }
}

errors.push(...(await verifyRendererShowcase()));

if (errors.length > 0) {
  console.error('Package drift check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Package drift check passed for ${entries.length} package(s).`);

async function sourceFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(path)));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

async function staleReferences(tokens) {
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
  const ignoredFiles = new Set([
    'pnpm-lock.yaml',
    'package-drift.mjs'
  ]);

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
      for (const token of tokens) {
        if (content?.includes(token)) {
          stale.push({ path: path.slice(root.length + 1), token });
        }
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
