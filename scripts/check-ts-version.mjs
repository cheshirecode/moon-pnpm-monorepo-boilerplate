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

  const uniqueVersions = [...new Set(Object.values(versions))];
  if (uniqueVersions.length <= 1) {
    return {
      ok: true,
      message: uniqueVersions.length === 1
        ? `All ${Object.keys(versions).length} packages use TypeScript ${uniqueVersions[0]} — aligned.`
        : `No TypeScript dependencies found across ${dirs.length} packages.`,
      versions
    };
  }
  const mismatched = Object.entries(versions)
    .map(([name, ver]) => `  ${name}: ${ver}`)
    .join('\n');
  return {
    ok: false,
    message: `TypeScript versions are NOT aligned across ${dirs.length} packages.\nMismatched:\n${mismatched}`,
    versions
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await checkTsVersionAlignment();
  console.log(result.message);
  process.exit(result.ok ? 0 : 1);
}
