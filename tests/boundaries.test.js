import { describe, it, expect, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { parseImports, extractPackageSpec, isRelative, isBuiltin, subpathExists, checkBoundaries, RENDERER_APPS } from '../scripts/check-boundaries.mjs';

const root = resolve(import.meta.dirname, '..');

describe('check-boundaries', () => {
  it('parseImports: TS scanner skips comments, strings, handles all import forms', () => {
    const src = [
      '// import { fake } from "fake";',
      '/* import { fake2 } from "fake2"; */',
      'import { real } from "real-pkg";',
      'const s = "import { str } from \\"str-pkg\\";";',
      'export { mount } from "app-react/microfrontend";',
      'const m = await import("dynamic");',
      'const fs = require("node:fs");'
    ].join('\n');
    expect(parseImports(src, 'test.ts')).toEqual(['real-pkg', 'app-react/microfrontend', 'dynamic', 'node:fs']);
  });

  it('parseImports: extracts Vue/Svelte/Astro script blocks', () => {
    expect(parseImports('<template><div/></template><script>import { ref } from "vue";</script>', 'c.vue')).toEqual(['vue']);
    expect(parseImports('<script>import { onMount } from "svelte";</script>', 'c.svelte')).toEqual(['svelte']);
    expect(parseImports('---\nimport Layout from "../Layout.astro";\n---', 'p.astro')).toEqual(['../Layout.astro']);
  });

  it('helpers: extractPackageSpec, isRelative, isBuiltin, subpathExists', () => {
    expect(extractPackageSpec('app-react/microfrontend')).toEqual({ name: 'app-react', subpath: './microfrontend' });
    expect(extractPackageSpec('@scope/pkg')).toEqual({ name: '@scope/pkg', subpath: null });
    expect(isRelative('./x')).toBe(true);
    expect(isBuiltin('node:fs')).toBe(true);
    expect(subpathExists({ './microfrontend': './src/mf.tsx' }, './microfrontend')).toBe(true);
    expect(subpathExists({ './microfrontend': './src/mf.tsx' }, './missing')).toBe(false);
  });

  it('passes with zero errors on real repo', async () => {
    const result = await checkBoundaries(root);
    expect(result.errors).toEqual([]);
    expect(result.packageCount).toBeGreaterThan(0);
  });

  it('RENDERER_APPS has exactly six entries', () => {
    expect(RENDERER_APPS).toHaveLength(6);
  });
});

describe('checkBoundaries fixtures', () => {
  let tmp;

  async function fixture(packages) {
    tmp = await mkdtemp(join(tmpdir(), 'boundary-'));
    for (const [name, pkg] of Object.entries(packages)) {
      const dir = join(tmp, 'packages', name);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, 'package.json'), JSON.stringify(pkg.packageJson, null, 2));
      if (pkg.moonYml) await writeFile(join(dir, 'moon.yml'), pkg.moonYml);
      if (pkg.src) {
        await mkdir(join(dir, 'src'), { recursive: true });
        for (const [f, c] of Object.entries(pkg.src)) await writeFile(join(dir, 'src', f), c);
      }
      if (pkg.configs) for (const [f, c] of Object.entries(pkg.configs)) await writeFile(join(dir, f), c);
    }
    return tmp;
  }

  afterEach(async () => { if (tmp) await rm(tmp, { recursive: true, force: true }); });

  const appPkg = (name, exportKey, srcFile) => ({
    packageJson: { name, private: true, exports: { [exportKey]: { types: `./src/${srcFile.replace(/\.(tsx?|jsx?)$/, '.d.ts')}`, import: `./src/${srcFile}` } } },
    moonYml: 'language: "typescript"\nlayer: "application"\nstack: "frontend"',
    src: { [srcFile]: 'export const x = 1;', [srcFile.replace(/\.(tsx?|jsx?)$/, '.d.ts')]: 'export const x: number;' }
  });

  it('allows renderer-showcase consuming six renderer apps', async () => {
    const packages = {};
    for (const app of RENDERER_APPS) {
      const ek = app === 'app-astro' ? './demo' : './microfrontend';
      const sf = app === 'app-astro' ? 'demo.ts' : 'microfrontend.tsx';
      packages[app] = appPkg(app, ek, sf);
    }
    packages['renderer-showcase'] = {
      packageJson: { name: 'renderer-showcase', private: true, dependencies: Object.fromEntries(RENDERER_APPS.map((a) => [a, 'workspace:^'])) },
      moonYml: 'language: "typescript"\nlayer: "application"\nstack: "backend"',
      src: { 'main.ts': RENDERER_APPS.map((a) => `import { x } from '${a}/${a === 'app-astro' ? 'demo' : 'microfrontend'}';`).join('\n') }
    };
    await fixture(packages);
    expect((await checkBoundaries(tmp)).errors).toEqual([]);
  });

  it('rejects undeclared internal import', async () => {
    await fixture({
      'app-react': appPkg('app-react', './microfrontend', 'microfrontend.tsx'),
      'renderer-showcase': {
        packageJson: { name: 'renderer-showcase', private: true, dependencies: {} },
        moonYml: 'language: "typescript"\nlayer: "application"\nstack: "backend"',
        src: { 'main.ts': "import { x } from 'app-react/microfrontend';" }
      }
    });
    expect((await checkBoundaries(tmp)).errors).toEqual(expect.arrayContaining([expect.stringContaining('undeclared')]));
  });

  it('rejects cross-package relative import', async () => {
    await fixture({
      'app-react': appPkg('app-react', './microfrontend', 'microfrontend.tsx'),
      'renderer-showcase': {
        packageJson: { name: 'renderer-showcase', private: true, dependencies: { 'app-react': 'workspace:^' } },
        moonYml: 'language: "typescript"\nlayer: "application"\nstack: "backend"',
        src: { 'main.ts': "import { x } from '../../app-react/src/microfrontend.tsx';" }
      }
    });
    expect((await checkBoundaries(tmp)).errors).toEqual(expect.arrayContaining([expect.stringContaining('cross-package')]));
  });

  it('delegates library-depending-on-application to moon (not flagged by this checker)', async () => {
    // library -> application is enforced natively by moon's
    // constraints.enforceLayerRelationships (see .moon/workspace.yml), so the
    // checker must NOT re-flag it. This guards against re-introducing the duplicate rule.
    await fixture({
      'app-react': appPkg('app-react', './microfrontend', 'microfrontend.tsx'),
      'my-lib': {
        packageJson: { name: '@scope/my-lib', private: false, exports: { '.': './src/index.ts' }, dependencies: { 'app-react': 'workspace:^' } },
        moonYml: 'language: "typescript"\nlayer: "library"\nstack: "frontend"',
        src: { 'index.ts': "import { x } from 'app-react/microfrontend';" }
      }
    });
    expect((await checkBoundaries(tmp)).errors).not.toEqual(expect.arrayContaining([expect.stringContaining('library cannot depend')]));
  });

  it('rejects application-to-application (non-showcase host)', async () => {
    await fixture({
      'app-react': appPkg('app-react', './microfrontend', 'microfrontend.tsx'),
      'app-vue': {
        packageJson: { name: 'app-vue', private: true, exports: { './microfrontend': './src/microfrontend.ts' }, dependencies: { 'app-react': 'workspace:^' } },
        moonYml: 'language: "typescript"\nlayer: "application"\nstack: "frontend"',
        src: { 'microfrontend.ts': "import { x } from 'app-react/microfrontend';" }
      }
    });
    expect((await checkBoundaries(tmp)).errors).toEqual(expect.arrayContaining([expect.stringContaining('application cannot depend')]));
  });

  it('rejects invalid subpath and missing export target', async () => {
    await fixture({
      'app-react': appPkg('app-react', './microfrontend', 'microfrontend.tsx'),
      'renderer-showcase': {
        packageJson: { name: 'renderer-showcase', private: true, dependencies: { 'app-react': 'workspace:^' } },
        moonYml: 'language: "typescript"\nlayer: "application"\nstack: "backend"',
        src: { 'main.ts': "import { x } from 'app-react/nonexistent';" }
      }
    });
    const errs = (await checkBoundaries(tmp)).errors;
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('subpath')]));
  });

  it('rejects cross-package config alias in vite config but not comments', async () => {
    await fixture({
      'app-react': appPkg('app-react', './microfrontend', 'microfrontend.tsx'),
      'renderer-showcase': {
        packageJson: { name: 'renderer-showcase', private: true, dependencies: { 'app-react': 'workspace:^' } },
        moonYml: 'language: "typescript"\nlayer: "application"\nstack: "backend"',
        src: {},
        configs: {
          'vite.config.ts': "// alias: '../app-react/src'\n/* '../app-react/src' */\nexport default { resolve: { alias: { '@': '../app-react/src' } } };"
        }
      }
    });
    const errs = (await checkBoundaries(tmp)).errors;
    expect(errs).toEqual(expect.arrayContaining([expect.stringContaining('config')]));
    expect(errs.filter((e) => e.includes('config')).length).toBe(1);
  });

  it('splits metadata-only and artifacts-only modes', async () => {
    await fixture({
      'my-lib': {
        packageJson: { name: '@scope/my-lib', private: false, main: './dist/index.js' },
        moonYml: 'language: "typescript"\nlayer: "library"\nstack: "frontend"',
        src: { 'index.ts': 'export const x = 1;' }
      }
    });

    expect((await checkBoundaries(tmp, { metadata: true, artifacts: false })).errors).toEqual([]);
    expect((await checkBoundaries(tmp, { metadata: false, artifacts: true })).errors).toEqual(
      expect.arrayContaining([expect.stringContaining('main "./dist/index.js" does not exist')])
    );
  });
});
