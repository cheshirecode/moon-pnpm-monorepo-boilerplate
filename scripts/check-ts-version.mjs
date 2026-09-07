import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

async function expandGlobPattern(pattern) {
  const idx = pattern.lastIndexOf('/');
  if (idx >= 0 && pattern.includes('*')) {
    const parentDir = resolve(root, pattern.slice(0, idx));
    try {
      const entries = await readdir(parentDir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => resolve(parentDir, e.name));
    } catch {
      return [];
    }
  }
  const resolvedPath = resolve(root, pattern);
  try {
    const entries = await readdir(resolvedPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => join(resolvedPath, e.name));
  } catch {
    return [];
  }
}

export async function discoverPackages() {
  const src = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const allDirs = [];
  let sectionName = '';
  for (const line of src.split('\n')) {
    const trimmed = line.trim();
    if (/^[a-zA-Z]/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(':');
      sectionName = colonIdx >= 0 ? trimmed.slice(0, colonIdx).trim() : trimmed;
      continue;
    }
    if (sectionName !== 'packages') continue;
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!trimmed.startsWith('- ')) continue;
    const rawValue = trimmed.slice(2).trim();
    const pattern = (rawValue.match(/^["'](.*?)["']$/) || [null, rawValue])[1];
    const dirs = await expandGlobPattern(pattern);
    allDirs.push(...dirs);
  }
  return allDirs.sort();
}

async function parsePackageJson(path) {
  const c = await readFile(path, 'utf8');
  return JSON.parse(c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
}

export async function checkTsVersionAlignment() {
  const dirs = await discoverPackages();
  if (dirs.length === 0) {
    return { ok: true, message: 'No packages found.', versions: {} };
  }
  const versions = {};
  for (const pkgDir of dirs) {
    const pkgPath = join(pkgDir, 'package.json');
    try {
      const pkg = await parsePackageJson(pkgPath);
      const tsVersion = pkg.devDependencies?.typescript;
      if (tsVersion) versions[pkg.name] = tsVersion;
    } catch { /* skip */ }
  }

/**
 * Framework exceptions — these packages intentionally use a different TS version
 * due to framework compatibility requirements (mirrors package-drift.mjs).
 */
const TYPESCRIPT_EXCEPTIONS = new Map([
  ['app-astro', '^6.0.3'],
  ['app-svelte', '^6.0.3'],
  ['app-vue', '^6.0.3']
]);
const BASELINE_VERSION = '^7.0.2';

  // Check each package against its expected version (exception or baseline)
  const mismatches = [];
  for (const [name, actual] of Object.entries(versions)) {
    const dirName = name.split('/').pop() || name;
    const expected = TYPESCRIPT_EXCEPTIONS.get(dirName) ?? BASELINE_VERSION;
    if (actual !== expected) {
      mismatches.push({ name, dirName, expected, actual });
    }
  }

  if (mismatches.length === 0) {
    return {
      ok: true,
      message: `TypeScript version alignment check passed for ${dirs.length} package(s).`,
      versions
    };
  }

  let detail = '';
  const byExpected = new Map();
  for (const m of mismatches) {
    if (!byExpected.has(m.expected)) byExpected.set(m.expected, []);
    byExpected.get(m.expected).push(m);
  }
  for (const [exp, pkgs] of byExpected) {
    detail += `\nExpected TypeScript@${exp}:`;
    for (const p of pkgs) {
      detail += `\n  - ${p.dirName} (@${p.actual})`;
    }
    detail += '\n';
  }

  return {
    ok: false,
    message: `${mismatches.length} package(s) with TypeScript version mismatch:${detail}`,
    versions
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await checkTsVersionAlignment();
  console.log(result.message);
  process.exit(result.ok ? 0 : 1);
}
