import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative, dirname, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as ts from 'typescript/unstable/ast';

const { createScanner, SyntaxKind, ScriptTarget } = ts;
const EOF = SyntaxKind.EndOfFile;

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');

export const RENDERER_APPS = ['app-react', 'app-preact', 'app-astro', 'app-vue', 'app-svelte', 'app-solidjs'];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro']);
const CONFIG_PATTERNS = [/^vite\.config\./, /^tsconfig.*\.json$/];
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.artifacts', 'coverage', '.moon', '.git', 'storybook-static', '.tmp-hmr-']);
const BUILTIN_PREFIXES = ['node:', 'virtual:', 'data:', 'blob:'];

function extractScript(source, ext) {
  if (ext === '.vue' || ext === '.svelte') {
    const m = source.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    return m ? m[1] : '';
  }
  if (ext === '.astro') {
    const m = source.match(/---([\s\S]*?)---/);
    return m ? m[1] : '';
  }
  return source;
}

export function parseImports(source, filePath = '') {
  const ext = filePath ? filePath.slice(filePath.lastIndexOf('.')) : '';
  const code = extractScript(source, ext);
  if (!code.trim()) return [];
  const scanner = createScanner(ScriptTarget.Latest, true);
  scanner.setText(code);
  const specs = [];
  let token = scanner.scan();
  let lastPos = -1;
  while (token !== EOF) {
    const pos = scanner.getTokenStart();
    if (pos === lastPos) break;
    lastPos = pos;
    if (token === SyntaxKind.ImportKeyword || token === SyntaxKind.ExportKeyword) {
      let t = scanner.scan();
      if (t === SyntaxKind.OpenParenToken) {
        t = scanner.scan();
        if (t === SyntaxKind.StringLiteral) specs.push(scanner.getTokenValue());
        token = t === EOF ? EOF : scanner.scan();
      } else {
        while (t !== EOF && t !== SyntaxKind.SemicolonToken) {
          if (scanner.getTokenStart() === pos) break;
          if (t === SyntaxKind.StringLiteral) { specs.push(scanner.getTokenValue()); break; }
          t = scanner.scan();
        }
        token = t;
      }
    } else if (token === SyntaxKind.RequireKeyword) {
      const t = scanner.scan();
      if (t === SyntaxKind.OpenParenToken) {
        const t2 = scanner.scan();
        if (t2 === SyntaxKind.StringLiteral) specs.push(scanner.getTokenValue());
        token = t2 === EOF ? EOF : scanner.scan();
      } else { token = t; }
    } else {
      token = scanner.scan();
    }
  }
  return specs;
}

function extractStringLiterals(source) {
  const scanner = createScanner(ScriptTarget.Latest, true);
  scanner.setText(source);
  const literals = [];
  let token = scanner.scan();
  while (token !== EOF) {
    if (token === SyntaxKind.StringLiteral) literals.push(scanner.getTokenValue());
    token = scanner.scan();
  }
  return literals;
}

export function extractPackageSpec(spec) {
  if (spec.startsWith('@')) {
    const i = spec.indexOf('/');
    const j = i === -1 ? -1 : spec.indexOf('/', i + 1);
    return j === -1 ? { name: spec, subpath: null } : { name: spec.slice(0, j), subpath: '.' + spec.slice(j) };
  }
  const i = spec.indexOf('/');
  return i === -1 ? { name: spec, subpath: null } : { name: spec.slice(0, i), subpath: '.' + spec.slice(i) };
}

export function isRelative(s) { return s.startsWith('./') || s.startsWith('../'); }
export function isBuiltin(s) { return BUILTIN_PREFIXES.some((p) => s.startsWith(p)); }

export function subpathExists(exports, subpath) {
  if (!subpath) return true;
  if (typeof exports === 'string') return subpath === '.';
  if (subpath in exports) return true;
  return Object.keys(exports).some((k) => k.endsWith('*') && subpath.startsWith(k.slice(0, -1)));
}

function resolveExportTargets(exports, subpath) {
  const targets = [];
  const collect = (e) => {
    if (typeof e === 'string') targets.push(e);
    else if (e) { if (e.types) targets.push(e.types); if (e.import) targets.push(e.import); }
  };
  if (!subpath || subpath === '.') {
    if (typeof exports === 'string') return [exports];
    if (exports['.']) collect(exports['.']);
    return targets;
  }
  if (typeof exports !== 'object') return [];
  if (subpath in exports) collect(exports[subpath]);
  for (const k of Object.keys(exports)) {
    if (k.endsWith('*') && subpath.startsWith(k.slice(0, -1))) {
      const suffix = subpath.slice(k.slice(0, -1).length);
      const e = exports[k];
      if (typeof e === 'string') targets.push(e.replace('*', suffix));
      else if (e) { if (e.types) targets.push(e.types.replace('*', suffix)); if (e.import) targets.push(e.import.replace('*', suffix)); }
    }
  }
  return targets;
}

function stripJsonComments(text) {
  let result = '';
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { result += text[i] + text[i + 1]; i += 2; continue; }
      if (ch === '"') inString = false;
      result += ch; i++; continue;
    }
    if (ch === '"') { inString = true; result += ch; i++; continue; }
    if (ch === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (ch === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue; }
    result += ch; i++;
  }
  return result;
}

function findConfigRefs(content, filePath, registry, currentDirName) {
  const errors = [];
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  if (ext === '.json') {
    let parsed;
    try { parsed = JSON.parse(stripJsonComments(content)); } catch { return errors; }
    const jsonStr = JSON.stringify(parsed);
    for (const [name, info] of registry) {
      if (info.dirName !== currentDirName && jsonStr.includes(`../${info.dirName}/`))
        errors.push({ name, pattern: `../${info.dirName}/` });
    }
  } else {
    const literals = extractStringLiterals(content);
    for (const [name, info] of registry) {
      if (info.dirName !== currentDirName && literals.some((l) => l.includes(`../${info.dirName}/`)))
        errors.push({ name, pattern: `../${info.dirName}/` });
    }
  }
  return errors;
}

export async function buildWorkspaceRegistry(pkgsDir = packagesDir) {
  const registry = new Map();
  for (const entry of await readdir(pkgsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(pkgsDir, entry.name);
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const packageJson = JSON.parse(await readFile(pkgPath, 'utf8'));
    const name = packageJson.name ?? entry.name;
    let layer = null, stack = null;
    const moonPath = join(dir, 'moon.yml');
    if (existsSync(moonPath)) {
      const mc = await readFile(moonPath, 'utf8');
      layer = mc.match(/^layer:\s*"([^"]+)"/m)?.[1] ?? null;
      stack = mc.match(/^stack:\s*"([^"]+)"/m)?.[1] ?? null;
    }
    const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
    registry.set(name, { dir, dirName: entry.name, layer, stack, packageJson, deps, exports: packageJson.exports ?? {} });
  }
  return registry;
}

async function collectFiles(dir, predicate) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(p, predicate));
    else if (predicate(entry.name)) files.push(p);
  }
  return files;
}

const isSource = (name) => {
  const ext = name.slice(name.lastIndexOf('.'));
  return SOURCE_EXTENSIONS.has(ext) && !name.endsWith('.d.ts');
};
const isConfig = (name) => CONFIG_PATTERNS.some((p) => p.test(name));

function resolveRelative(fromFile, spec, pkgDir, registry) {
  const resolved = normalize(resolve(dirname(fromFile), spec));
  const norm = normalize(pkgDir);
  if (resolved.startsWith(norm + '/') || resolved === norm) return null;
  for (const [, info] of registry) {
    const od = normalize(info.dir);
    if (resolved.startsWith(od + '/') || resolved === od) return resolved;
  }
  return null;
}

export async function checkBoundaries(rootDir = root) {
  const pkgsDir = join(rootDir, 'packages');
  const registry = await buildWorkspaceRegistry(pkgsDir);
  const errors = [];

  for (const [pkgName, info] of registry) {
    const sourceFiles = await collectFiles(info.dir, isSource);
    const configFiles = await collectFiles(info.dir, isConfig);
    const allFiles = new Set([...sourceFiles, ...configFiles]);

    for (const filePath of allFiles) {
      const content = await readFile(filePath, 'utf8');
      const rel = relative(rootDir, filePath);
      const isCfg = configFiles.includes(filePath);

      if (isCfg) {
        for (const ref of findConfigRefs(content, filePath, registry, info.dirName))
          errors.push(`${pkgName}: config ${rel} references sibling ${ref.name} via ${ref.pattern}`);
      }

      for (const spec of parseImports(content, filePath)) {
        if (isBuiltin(spec)) continue;
        if (isRelative(spec)) {
          if (resolveRelative(filePath, spec, info.dir, registry))
            errors.push(`${pkgName}: cross-package relative import "${spec}" in ${rel}`);
          continue;
        }
        const { name: dep, subpath } = extractPackageSpec(spec);
        if (!registry.has(dep)) continue;
        const target = registry.get(dep);

        if (!(dep in info.deps))
          errors.push(`${pkgName}: undeclared import "${spec}" in ${rel} (${dep} not in dependencies)`);

        if (subpath && target.exports && Object.keys(target.exports).length > 0 && !subpathExists(target.exports, subpath))
          errors.push(`${pkgName}: subpath "${subpath}" not exported by ${dep} (in ${rel})`);

        if (target.exports && Object.keys(target.exports).length > 0) {
          for (const t of resolveExportTargets(target.exports, subpath))
            if (!existsSync(join(target.dir, t)))
              errors.push(`${pkgName}: export target "${t}" for "${spec}" missing in ${dep}`);
        }

        if (info.layer === 'library' && target.layer === 'application')
          errors.push(`${pkgName}: library cannot depend on application ${dep} (in ${rel})`);

        if (info.layer === 'application' && target.layer === 'application') {
          const isHost = pkgName === 'renderer-showcase';
          const isRenderer = RENDERER_APPS.includes(dep);
          if (!isHost || !isRenderer)
            errors.push(`${pkgName}: application cannot depend on application ${dep} (in ${rel})`);
        }
      }
    }

    for (const field of ['main', 'module', 'types', 'browser']) {
      const val = info.packageJson[field];
      if (typeof val === 'string' && !existsSync(join(info.dir, val)))
        errors.push(`${pkgName}: ${field} "${val}" does not exist`);
    }
  }

  return { errors, packageCount: registry.size };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkBoundaries();
  if (result.errors.length > 0) {
    console.error('Boundary check failed:');
    for (const e of result.errors) console.error(`- ${e}`);
    process.exit(1);
  }
  console.log(`Boundary check passed for ${result.packageCount} package(s).`);
}
