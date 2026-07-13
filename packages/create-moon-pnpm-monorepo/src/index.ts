import { chmod, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface CreateMonorepoOptions {
  name: string;
  directory?: string;
  force?: boolean;
}

export interface CreateMonorepoResult {
  name: string;
  directory: string;
  files: string[];
}

export async function createMonorepo({
  name,
  directory,
  force = false
}: CreateMonorepoOptions): Promise<CreateMonorepoResult> {
  const repoName = normalizePackageName(name);
  const targetDir = resolve(directory ?? repoName);
  await assertWritableTarget(targetDir, force);
  await mkdir(targetDir, { recursive: true });

  const files = templateFiles(repoName);

  for (const [path, content] of files) {
    const outputPath = resolve(targetDir, path);
    await mkdir(resolve(outputPath, '..'), { recursive: true });
    await writeFile(outputPath, content, path.endsWith('.json') ? 'utf8' : 'utf8');

    if (path.startsWith('scripts/') && path.endsWith('.sh')) {
      await chmod(outputPath, 0o755);
    }
  }

  return {
    name: repoName,
    directory: targetDir,
    files: files.map(([path]) => path)
  };
}

export function normalizePackageName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9._/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (!normalized || normalized === '.' || normalized === '..') {
    throw new Error(`Invalid monorepo name: ${name}`);
  }

  return normalized;
}

async function assertWritableTarget(targetDir: string, force: boolean): Promise<void> {
  try {
    const entries = await readdir(targetDir);

    if (entries.length > 0 && !force) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

function templateFiles(repoName: string): Array<[string, string]> {
  return [
    ['package.json', json(rootPackageJson(repoName))],
    ['pnpm-workspace.yaml', pnpmWorkspaceYaml()],
    ['README.md', readme(repoName)],
    ['AGENTS.md', agentsMd()],
    ['.gitignore', gitignore()],
    ['.changeset/config.json', json(changesetConfig())],
    ['.moon/workspace.yml', moonWorkspace()],
    ['.moon/toolchains.yml', moonToolchains()],
    ['.moon/tasks/node.yml', moonNodeTasks()],
    ['scripts/check.sh', checkScript()],
    ['scripts/pack-publishable.mjs', packScript()],
    ['scripts/dogfood.mjs', dogfoodScript(repoName)],
    ['tests/smoke.test.js', rootSmokeTest()],
    ['.github/actions/setup/action.yml', setupAction()],
    ['.github/workflows/main.yml', mainWorkflow()],
    ['.github/workflows/publish.yml', publishWorkflow()],
    ['packages/tsconfig/package.json', json(tsconfigPackageJson(repoName))],
    ['packages/tsconfig/base.json', json(tsconfigBase())],
    ['packages/tsconfig/node-types.json', json(tsconfigNodeTypes())],
    ['packages/hono-base/package.json', json(honoBasePackageJson(repoName))],
    ['packages/hono-base/moon.yml', honoBaseMoon()],
    ['packages/hono-base/tsconfig.json', json(honoBaseTsconfig(repoName))],
    ['packages/hono-base/vitest.config.ts', honoBaseVitestConfig()],
    ['packages/hono-base/README.md', honoBaseReadme()],
    ['packages/hono-base/src/index.ts', honoBaseSource()],
    ['packages/hono-base/src/index.test.ts', honoBaseTest()],
    ['packages/hono-base/src/import-guard.test.ts', honoBaseImportGuardTest()],
    ['packages/app-react/package.json', json(appReactPackageJson(repoName))],
    ['packages/app-react/moon.yml', appReactMoon()],
    ['packages/app-react/tsconfig.json', json(appReactTsconfig())],
    ['packages/app-react/tsconfig.node.json', json(appReactNodeTsconfig(repoName))],
    ['packages/app-react/vitest.config.ts', appReactVitestConfig()],
    ['packages/app-react/alias.ts', appReactAlias()],
    ['packages/app-react/unocss.config.ts', appReactUnocssConfig()],
    ['packages/app-react/vite.config.ts', appReactViteConfig()],
    ['packages/app-react/vite.client.config.ts', appReactViteConfig()],
    ['packages/app-react/vite.config.server.ts', appReactViteServerConfig()],
    ['packages/app-react/build.js', appReactBuildScript()],
    ['packages/app-react/index.html', appReactIndexHtml()],
    ['packages/app-react/src/shared/AppTree.tsx', appReactAppTree()],
    ['packages/app-react/src/shared/bootstrap.ts', appReactBootstrap()],
    ['packages/app-react/src/shared/bootstrap.test.ts', appReactBootstrapTest()],
    ['packages/app-react/src/styles/index.css', appReactStyles()],
    ['packages/app-react/src/styles/reset.css', appReactResetStyles()],
    ['packages/app-react/src/vite-env.d.ts', appReactViteEnv()],
    ['packages/app-react/src/entry-hydration.tsx', appReactHydrationEntry()],
    ['packages/app-react/src/entry-microfrontend.tsx', appReactMicrofrontendEntry()],
    ['packages/app-react/src/microfrontend.test.tsx', appReactMicrofrontendTest()],
    ['packages/app-react/src/client/ErrorBoundary.tsx', appReactErrorBoundary()],
    ['packages/app-react/src/client/ErrorBoundary.test.tsx', appReactErrorBoundaryTest()],
    ['packages/app-react/src/server/app.tsx', appReactServerApp(repoName)],
    ['packages/app-react/src/server/app.test.ts', appReactServerAppTest()],
    ['packages/app-react/src/server/node.ts', appReactNodeEntry()],
    ['packages/app-react/src/server/import-guard.test.ts', appReactImportGuardTest()]
  ];
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function rootPackageJson(repoName: string): Record<string, unknown> {
  return {
    name: repoName,
    private: true,
    engines: {
      node: '>=24.11.0'
    },
    packageManager: 'pnpm@11.10.0',
    workspaces: ['packages/*'],
    scripts: {
      setup: 'scripts/check.sh setup',
      moon: 'moon',
      'lint:fast': 'scripts/check.sh lint-fast',
      lint: 'scripts/check.sh lint',
      typecheck: 'scripts/check.sh typecheck',
      build: 'scripts/check.sh build',
      test: 'scripts/check.sh test',
      coverage: 'scripts/check.sh coverage',
      ci: 'scripts/check.sh ci',
      dogfood: 'scripts/check.sh dogfood',
      changeset: 'changeset',
      'version-packages': 'changeset version',
      pack: 'scripts/check.sh pack',
      'publish-packages': 'changeset publish'
    },
    devDependencies: {
      '@changesets/cli': '^2.31.0',
      '@moonrepo/cli': '^2.3.5',
      '@types/node': '^24.10.2',
      '@vitest/coverage-v8': '^4.1.9',
      oxlint: '^1.72.0',
      typescript: '^7.0.2',
      vitest: '^4.1.9'
    }
  };
}

function changesetConfig(): Record<string, unknown> {
  return {
    $schema: 'https://unpkg.com/@changesets/config@3.1.1/schema.json',
    changelog: '@changesets/cli/changelog',
    commit: false,
    fixed: [],
    linked: [],
    access: 'public',
    baseBranch: 'main',
    updateInternalDependencies: 'patch',
    ignore: []
  };
}

function honoBasePackageJson(repoName: string): Record<string, unknown> {
  return {
    name: `${repoName}-hono-base`,
    version: '0.0.0',
    description: 'Runtime-neutral Hono app factory.',
    type: 'module',
    private: false,
    license: 'MIT',
    engines: {
      node: '>=24.11.0'
    },
    files: ['dist'],
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js'
      }
    },
    scripts: {
      build: 'rm -rf dist && tsc -p tsconfig.json',
      test: 'vitest run',
      coverage: 'vitest run --coverage',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      lint: 'oxlint src --ignore-path ../../.gitignore --quiet'
    },
    dependencies: { hono: '^4.9.0' },
    devDependencies: {
      [`${repoName}-tsconfig`]: 'workspace:^',
      '@types/node': '^24.10.2',
      '@vitest/coverage-v8': '^4.1.9',
      typescript: '^7.0.2',
      vitest: '^4.1.9'
    }
  };
}

function honoBaseMoon(): string {
  return `language: "typescript"
layer: "library"
stack: "backend"
tags:
  - "hono"
  - "isomorphic"

tasks:
  build:
    outputs:
      - "dist/**/*"
`;
}

function honoBaseTsconfig(repoName: string): Record<string, unknown> {
  return {
    extends: `${repoName}-tsconfig/node-types.json`,
    compilerOptions: { outDir: 'dist', rootDir: 'src' },
    include: ['src'],
    exclude: ['src/**/*.test.ts']
  };
}

function honoBaseVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
`;
}

function honoBaseReadme(): string {
  return `# Hono base

Runtime-neutral Hono app factory with health, version, 404, and generic 500 routes.
`;
}

function honoBaseSource(): string {
  return `import { Hono } from 'hono';

export interface BaseAppOptions {
  version: string;
  serviceName?: string;
}

export function createBaseApp(options: BaseAppOptions): Hono {
  const app = new Hono();

  app.get('/healthz', (c) => c.json({ status: 'ok' }));
  app.get('/version', (c) =>
    c.json({ name: options.serviceName ?? 'hono-base', version: options.version })
  );
  app.notFound((c) => c.json({ error: 'Not Found' }, 404));
  app.onError((_err, c) => c.json({ error: 'Internal Server Error' }, 500));

  return app;
}
`;
}

function honoBaseTest(): string {
  return `import { describe, expect, it } from 'vitest';
import { createBaseApp } from './index.js';

describe('createBaseApp', () => {
  it('returns a Hono instance with a fetch method', () => {
    const app = createBaseApp({ version: '0.0.0' });
    expect(typeof app.fetch).toBe('function');
    expect(typeof app.request).toBe('function');
  });

  it('serves health with an explicit JSON contract', async () => {
    const app = createBaseApp({ version: '0.0.0' });
    const response = await app.request('/healthz');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('serves version metadata', async () => {
    const app = createBaseApp({ version: '1.2.3', serviceName: 'generated' });
    const response = await app.request('/version');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: 'generated', version: '1.2.3' });
  });

  it('returns generic JSON for 404 and unexpected errors', async () => {
    const app = createBaseApp({ version: '0.0.0' });
    app.get('/throw', () => { throw new Error('secret'); });
    expect((await app.request('/missing')).status).toBe(404);
    const response = await app.request('/throw');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal Server Error' });
  });
});
`;
}

function honoBaseImportGuardTest(): string {
  return `import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = import.meta.dirname;

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) files.push(path);
  }
  return files;
}

describe('hono-base boundary', () => {
  it('source graph contains no Node runtime or adapter imports', async () => {
    const violations: string[] = [];
    for (const file of await walk(srcDir)) {
      const source = await readFile(file, 'utf8');
      if (/from\\s+['"]node:/.test(source)) violations.push(relative(srcDir, file) + ': node:* import');
      if (/from\\s+['"]@hono\\/node-server['"]/.test(source)) violations.push(relative(srcDir, file) + ': adapter import');
    }
    expect(violations).toEqual([]);
  });
});
`;
}

function appReactPackageJson(repoName: string): Record<string, unknown> {
  return {
    name: 'app-react', private: true, version: '0.0.0', type: 'module',
    exports: { './microfrontend': './src/entry-microfrontend.tsx' },
    scripts: {
      dev: 'node build.js && node dist/server/node.js',
      build: 'node build.js',
      'build:client:production': 'vite build --config vite.client.config.ts',
      'build:server': 'vite build --config vite.config.server.ts',
      start: 'node dist/server/node.js', preview: 'node dist/server/node.js',
      typecheck: 'tsc -p tsconfig.json && tsc -p tsconfig.node.json',
      test: 'vitest run', coverage: 'vitest run --coverage',
      lint: 'oxlint src --ignore-path ../../.gitignore --quiet'
    },
    dependencies: {
      [`${repoName}-hono-base`]: 'workspace:^', hono: '^4.9.0',
      '@hono/node-server': '^1.14.0', '@emotion/react': '^11.14.0',
      '@emotion/styled': '^11.14.1', react: '^19.2.7', 'react-dom': '^19.2.7'
    },
    devDependencies: {
      '@types/node': '^24.10.2', '@types/react': '^19.2.17', '@types/react-dom': '^19.2.3',
      '@testing-library/react': '^16.3.2', '@vitejs/plugin-react': '^6.0.3',
      '@unocss/vite': '^66.7.4', '@vitest/coverage-v8': '^4.1.9',
      'happy-dom': '^20.10.6', typescript: '^7.0.2', unocss: '^66.7.4', vite: '^8.1.2', vitest: '^4.1.9'
    }
  };
}

function appReactMoon(): string {
  return `language: "typescript"
layer: "application"
stack: "frontend"
tags:
  - "react"
  - "hono"
  - "ssr"

tasks:
  build:
    outputs:
      - "dist/client/**/*"
      - "dist/server/**/*"
`;
}

function appReactTsconfig(): Record<string, unknown> {
  return {
    compilerOptions: { target: 'ES2022', lib: ['DOM', 'DOM.Iterable', 'ESNext'], module: 'ESNext', moduleResolution: 'Bundler', strict: true, jsx: 'react-jsx', noEmit: true, skipLibCheck: true, paths: { '@/*': ['./src/*'] } },
    include: ['src/client', 'src/shared', 'src/entry-*.tsx', 'src/vite-env.d.ts']
  };
}

function appReactNodeTsconfig(_repoName = 'generated-repo'): Record<string, unknown> {
  return { extends: '../tsconfig/node-types.json', compilerOptions: { allowJs: true, lib: ['DOM', 'ESNext'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', noEmit: true }, include: ['src/server', 'unocss.config.ts', 'vite.config.ts', 'vite.client.config.ts', 'vite.config.server.ts', 'alias.ts', 'build.js'] };
}

function appReactVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'happy-dom', include: ['src/**/*.test.{ts,tsx}'] }
});
`;
}

function appReactAlias(): string {
  return `import { resolve } from 'node:path';

export default {
  '~': resolve(import.meta.dirname),
  '@': resolve(import.meta.dirname, 'src'),
  lodash: 'lodash-es'
};
`;
}

function appReactUnocssConfig(): string {
  return `import type { UserConfig } from 'unocss';
import { defineConfig, presetAttributify, presetUno, transformerVariantGroup } from 'unocss';

const config: UserConfig = defineConfig({
  darkMode: 'class',
  presets: [presetUno(), presetAttributify({ prefix: 'uno-', prefixedOnly: true })],
  transformers: [transformerVariantGroup()],
  shortcuts: { 'color-error': 'text-white dark:text-dark-900' }
} as UserConfig);

export default config;
`;
}

function appReactViteConfig(): string {
  return `import Unocss from '@unocss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import alias from './alias';
import unocssConfig from './unocss.config';

export default defineConfig({
  plugins: [Unocss({}, unocssConfig), react({ jsxImportSource: '@emotion/react' })],
  resolve: { alias },
  build: {
    outDir: 'dist/client',
    assetsDir: 'static',
    manifest: true,
    rollupOptions: {
      input: { entry: 'src/entry-hydration.tsx' },
      output: {
        entryFileNames: 'entry-hydration.js',
        chunkFileNames: 'static/[name]-[hash].js',
        assetFileNames: 'static/[name]-[hash].[ext]'
      }
    }
  }
});
`;
}

function appReactViteServerConfig(): string {
  return `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import alias from './alias';

export default defineConfig({
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  resolve: { alias },
  build: { ssr: true, outDir: 'dist/server', rollupOptions: { input: 'src/server/node.ts' }, target: 'es2022' }
});
`;
}

function appReactBuildScript(): string {
  return `#!/usr/bin/env node
import { execSync } from 'node:child_process';

execSync('pnpm build:server', { stdio: 'inherit' });
execSync('pnpm build:client:production', { stdio: 'inherit' });
`;
}

function appReactIndexHtml(): string {
  return `<!doctype html>
<html><body><div id="root"></div><script type="module" src="/src/entry-hydration.tsx"></script></body></html>
`;
}

function appReactAppTree(): string {
  return `import ErrorBoundary from '../client/ErrorBoundary';

export default function AppTree() {
  return <ErrorBoundary><h1>app-react</h1></ErrorBoundary>;
}
`;
}

function appReactBootstrap(): string {
  return `export function serializeBootstrap(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, '\\\\u003c');
}

export function parseBootstrap(element: Element): unknown {
  return JSON.parse(element.textContent ?? '');
}
`;
}

function appReactHydrationEntry(): string {
  return `import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import AppTree from './shared/AppTree';

import './styles/reset.css';
import './styles/index.css';
import 'virtual:uno.css';

const root = document.getElementById('root');
if (root) hydrateRoot(root, <StrictMode><AppTree /></StrictMode>);
`;
}

function appReactStyles(): string {
  return `:root { font-family: system-ui, sans-serif; }
body { margin: 0; }
`;
}

function appReactResetStyles(): string {
  return `*, *::before, *::after { box-sizing: border-box; }
`;
}

function appReactViteEnv(): string {
  return `/// <reference types="vite/client" />

declare module '*.css';
declare module 'virtual:uno.css';
`;
}

function appReactMicrofrontendEntry(): string {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppTree from './shared/AppTree';

export function mount(container: Element): () => void {
  const root = createRoot(container);
  root.render(<StrictMode><AppTree /></StrictMode>);
  return () => root.unmount();
}
`;
}

function appReactErrorBoundary(): string {
  return `import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Component } from 'react';

const GENERIC_ERROR_MESSAGE = 'Something went wrong.';

export default class ErrorBoundary extends Component<PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } { return { hasError: true }; }
  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {}
  render(): ReactNode { return this.state.hasError ? <em>{GENERIC_ERROR_MESSAGE}</em> : this.props.children; }
}
`;
}

function appReactServerApp(repoName: string): string {
  return `import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createBaseApp } from '${repoName}-hono-base';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { renderToString } from 'react-dom/server';
import AppTree from '../shared/AppTree';
import { serializeBootstrap } from '../shared/bootstrap';

export function createServerApp(options: { version: string; serviceName?: string; clientDir?: string }): Hono {
  const app = createBaseApp(options);

  if (options.clientDir) {
    app.use('/client/*', serveStatic({ root: options.clientDir, rewriteRequestPath: (path) => path.replace(/^\\/client\\//, '') }));
    app.use('/static/*', serveStatic({ root: options.clientDir }));
  }

  let assetsPromise: Promise<{ js: string; css: string[] }> | null = null;
  const getAssets = async () => {
    if (!assetsPromise) {
      assetsPromise = (async () => {
        if (!options.clientDir) return { js: '/client/entry-hydration.js', css: [] };
        for (const path of [resolve(options.clientDir, 'manifest.json'), resolve(options.clientDir, '.vite', 'manifest.json')]) {
          try {
            const manifest = JSON.parse(await readFile(path, 'utf8')) as Record<string, { file: string; css?: string[] }>;
            const entry = manifest['src/entry-hydration.tsx'];
            if (entry) return { js: '/client/' + entry.file, css: (entry.css ?? []).map((file) => '/client/' + file) };
          } catch {}
        }
        return { js: '/client/entry-hydration.js', css: [] };
      })();
    }
    return assetsPromise;
  };

  app.onError((_error, c) => c.req.header('accept')?.includes('text/html')
    ? c.html('<!DOCTYPE html><html><body><h1>500 Internal Server Error</h1></body></html>', 500)
    : c.json({ error: 'Internal Server Error' }, 500));

  app.get('/', async (c) => {
    const assets = await getAssets();
    const css = assets.css.map((href) => '<link rel="stylesheet" href="' + href + '" />').join('');
    return c.html('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>app-react</title>' + css + '</head><body><div id="root">' + renderToString(<AppTree />) + '</div><script type="application/json" id="bootstrap">' + serializeBootstrap({ version: options.version }) + '</script><script type="module" src="' + assets.js + '"></script></body></html>');
  });
  return app;
}
`;
}

function appReactBootstrapTest(): string {
  return `import { describe, expect, it } from 'vitest';
import { parseBootstrap, serializeBootstrap } from './bootstrap';

describe('bootstrap serialization', () => {
  it('escapes script-closing input and round-trips through the parser', () => {
    const serialized = serializeBootstrap({ html: '</script>', ampersand: '&' });
    expect(serialized).not.toContain('</script>');
    expect(parseBootstrap({ textContent: serialized } as Element)).toEqual({ html: '</script>', ampersand: '&' });
  });
});
`;
}

function appReactMicrofrontendTest(): string {
  return `// @vitest-environment happy-dom
import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mount } from './entry-microfrontend';

describe('app-react microfrontend', () => {
  it('mounts and unmounts from an arbitrary container', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const unmount = mount(target);
    await waitFor(() => expect(target.textContent).toContain('app-react'));
    unmount();
    expect(target.textContent).toBe('');
    target.remove();
  });
});
`;
}

function appReactErrorBoundaryTest(): string {
  return `// @vitest-environment happy-dom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

const ThrowingComponent = (): never => { throw new Error('secret internal message'); };

describe('ErrorBoundary', () => {
  it('renders a fixed generic message without error details', () => {
    const { container } = render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    expect(container.textContent).toBe('Something went wrong.');
    expect(container.textContent).not.toContain('secret internal message');
  });
});
`;
}

function appReactServerAppTest(): string {
  return `import { describe, expect, it } from 'vitest';
import { createServerApp } from './app';

describe('app-react server', () => {
  it('inherits health and version routes from hono-base', async () => {
    const app = createServerApp({ version: '0.0.0', serviceName: 'app-react' });
    expect((await app.request('/healthz')).status).toBe(200);
    expect(await (await app.request('/version')).json()).toEqual({ name: 'app-react', version: '0.0.0' });
  });

  it('renders an HTML shell with escaped bootstrap data', async () => {
    const response = await createServerApp({ version: '0.0.0' }).request('/');
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<div id="root">');
    expect(html).toContain('id="bootstrap"');
    const bootstrap = html.match(/<script type="application\\/json" id="bootstrap">([\\s\\S]*?)<\\/script>/)?.[1] ?? '';
    expect(bootstrap).not.toContain('</script>');
  });
});
`;
}

function appReactNodeEntry(): string {
  return `import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { createServerApp } from './app';

const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'client');
const app = createServerApp({ version: '0.0.0', serviceName: 'app-react', clientDir });
const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) });
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
`;
}

function appReactImportGuardTest(): string {
  return `import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageSrc = join(import.meta.dirname, '..');

describe('browser graph boundary', () => {
  it('keeps Node imports out of browser entries', async () => {
    const files = [
      join(packageSrc, 'entry-hydration.tsx'),
      join(packageSrc, 'entry-microfrontend.tsx'),
      join(packageSrc, 'shared', 'AppTree.tsx'),
      join(packageSrc, 'client', 'ErrorBoundary.tsx')
    ];
    for (const file of files) {
      expect(await readFile(file, 'utf8')).not.toMatch(/node:|server\\//);
    }
  });
});
`;
}

function tsconfigPackageJson(repoName: string): Record<string, unknown> {
  return {
    name: `${repoName}-tsconfig`,
    version: '0.0.0',
    description: 'Shared TypeScript configs for this monorepo.',
    type: 'module',
    private: false,
    license: 'MIT',
    engines: {
      node: '>=24.11.0'
    },
    files: ['*.json'],
    exports: {
      './base.json': './base.json',
      './node-types.json': './node-types.json'
    }
  };
}

function tsconfigBase(): Record<string, unknown> {
  return {
    compilerOptions: {
      declaration: true,
      declarationMap: true,
      lib: ['ESNext'],
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      skipLibCheck: true,
      strict: true,
      target: 'ES2022'
    }
  };
}

function tsconfigNodeTypes(): Record<string, unknown> {
  return {
    extends: './base.json',
    compilerOptions: {
      types: ['node']
    }
  };
}

function pnpmWorkspaceYaml(): string {
  return `packages:
  - "packages/*"

overrides:
  typescript: "^7.0.2"

minimumReleaseAgeExclude:
  - "@moonrepo/cli@2.3.5"
  - "@moonrepo/core-linux-arm64-gnu@2.3.5"
  - "@moonrepo/core-linux-arm64-musl@2.3.5"
  - "@moonrepo/core-linux-x64-gnu@2.3.5"
  - "@moonrepo/core-linux-x64-musl@2.3.5"
  - "@moonrepo/core-macos-arm64@2.3.5"
  - "@moonrepo/core-macos-x64@2.3.5"
  - "@moonrepo/core-windows-x64-msvc@2.3.5"
`;
}

function readme(repoName: string): string {
  return `# ${repoName}

A clean moon + pnpm + Changesets monorepo.

## Quick Start

\`\`\`sh
corepack enable
corepack prepare pnpm@11.10.0 --activate
pnpm install
pnpm run ci
pnpm run dogfood all
\`\`\`

Requires Node.js \`>=24.11.0\`.

## What Is Included

- pnpm workspaces for local package linking.
- moonrepo for package task orchestration.
- Changesets for versioning and npm publishing.
- oxlint for fast lint checks.
  - A publishable Hono app factory and private React SSR application.
`;
}

function agentsMd(): string {
  return `# AGENTS.md

Scope: this file applies to the entire repository.

Use the repo-owned scripts as the source of truth:

\`\`\`sh
scripts/check.sh setup
scripts/check.sh ci
scripts/check.sh dogfood all
\`\`\`

Keep package-specific framework choices inside \`packages/*\`. The root stays framework-neutral.
Use Node.js \`>=24.11.0\`, pnpm \`11.10.0\`, moon, Changesets, and oxlint.
`;
}

function gitignore(): string {
  return `node_modules/
dist/
coverage/
.artifacts/
.moon/cache/
*.tsbuildinfo
*.tgz
.env
.env.*
!.env.example
`;
}

function moonWorkspace(): string {
  return `projects:
  - "packages/*"

pipeline:
  installDependencies: false

vcs:
  defaultBranch: "main"
  provider: "github"
`;
}

function moonToolchains(): string {
  return `javascript:
  packageManager: "pnpm"
  inferTasksFromScripts: false

node: {}
pnpm: {}
`;
}

function moonNodeTasks(): string {
  return `implicitInputs:
  - "package.json"

fileGroups:
  sources:
    - "src/**/*"
    - "lib/**/*"
    - "index.{js,ts,mjs,cjs}"
    - "*.{js,ts,mjs,cjs}"
  tests:
    - "**/*.test.{js,ts,jsx,tsx,mjs}"
  configs:
    - "*.config.{js,cjs,mjs,ts}"
    - "tsconfig*.json"
    - "package.json"

tasks:
  lint:
    command: "pnpm run --if-present lint"
    inputs:
      - "@group(sources)"
      - "@group(tests)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"

  build:
    command: "pnpm run --if-present build"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"

  test:
    command: "pnpm run --if-present test"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(tests)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"

  coverage:
    command: "pnpm run --if-present coverage"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(tests)"
      - "@group(configs)"
    outputs:
      - "coverage/**/*"
    options:
      cache: false
      runInCI: true

  typecheck:
    command: "pnpm run --if-present typecheck"
    deps:
      - target: "^:build"
        optional: true
        cacheStrategy: "outputs"
    inputs:
      - "@group(sources)"
      - "@group(configs)"
    options:
      cache: true
      runInCI: "affected"
`;
}

function checkScript(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"

run() {
  (cd "$repo_root" && "$@")
}

has_git_head() {
  run git rev-parse --verify HEAD >/dev/null 2>&1
}

case "\${1:-}" in
  setup)
    run corepack enable
    run corepack prepare pnpm@11.10.0 --activate
    if [[ -f "$repo_root/pnpm-lock.yaml" ]]; then
      run pnpm install --frozen-lockfile
    else
      run pnpm install --no-frozen-lockfile
    fi
    ;;
  lint-fast)
    run pnpm exec oxlint packages tests --ignore-path .gitignore --quiet
    ;;
  lint)
    if has_git_head; then
      run pnpm exec moon run :lint
    else
      run pnpm -r --if-present lint
    fi
    ;;
  typecheck)
    if has_git_head; then
      run pnpm exec moon run :typecheck
    else
      run pnpm -r --if-present typecheck
    fi
    ;;
  build)
    if has_git_head; then
      run pnpm exec moon run :build
    else
      run pnpm -r --if-present build
    fi
    ;;
  test)
    if has_git_head; then
      run pnpm exec moon run :test
    else
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  ci)
    "$repo_root/scripts/check.sh" lint-fast
    if has_git_head; then
      run pnpm exec moon ci :lint :typecheck :build :test
    else
      run pnpm -r --if-present lint
      run pnpm -r --if-present build
      run pnpm -r --if-present typecheck
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  coverage)
    run pnpm exec moon run :coverage
    ;;
  coverage-package)
    package="\${2:-}"
    if [[ -z "$package" || ! -d "$repo_root/packages/$package" ]]; then
      echo "Unknown package: $package" >&2
      exit 2
    fi
    run pnpm exec moon run "$package:coverage"
    ;;
  pack)
    run node scripts/pack-publishable.mjs
    ;;
  dogfood)
    mode="\${2:-packages}"
    if [[ $# -gt 1 ]]; then
      shift 2
    else
      shift $#
    fi
    run node scripts/dogfood.mjs "$mode" "$@"
    ;;
  -h|--help|help|"")
    echo "Usage: scripts/check.sh setup|lint-fast|lint|typecheck|build|test|ci|coverage|coverage-package|pack|dogfood"
    ;;
  *)
    echo "Unknown command: $1" >&2
    exit 2
    ;;
esac
`;
}

function packScript(): string {
  return `import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');
const outDir = join(root, '.artifacts', 'release');
const packageDirs = await readdir(packagesDir, { withFileTypes: true });
const publishable = [];

for (const entry of packageDirs) {
  if (!entry.isDirectory()) continue;
  const packageDir = join(packagesDir, entry.name);
  const packageJson = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'));
  if (packageJson.private === true) continue;
  publishable.push({ dir: packageDir, name: packageJson.name ?? entry.name });
}

if (publishable.length === 0) throw new Error('No publishable workspace packages found.');

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const pkg of publishable) {
  await run('pnpm', ['pack', '--pack-destination', outDir], pkg.dir);
}

console.log(\`Packed \${publishable.length} publishable package(s) into \${outDir}:\`);
for (const pkg of publishable) console.log(\`- \${pkg.name} (\${basename(pkg.dir)})\`);

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(\`\${command} \${args.join(' ')} exited with \${code}\`)));
  });
}
`;
}

function dogfoodScript(repoName: string): string {
  return `import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const releaseDir = join(root, '.artifacts', 'release');
const dogfoodDir = join(root, '.artifacts', 'dogfood');
const args = process.argv.slice(2);
const mode = args.find((arg) => !arg.startsWith('-')) ?? 'packages';
const skipBuild = args.includes('--skip-build');

if (!skipBuild) {
  await run('scripts/check.sh', ['build'], root);
}
await run('scripts/check.sh', ['pack'], root);

const tarballs = (await readdir(releaseDir)).filter((file) => file.endsWith('.tgz')).map((file) => join(releaseDir, file)).sort();
const packages = [];

for (const tarball of tarballs) {
  const packageJson = JSON.parse(await runCapture('tar', ['-xOf', tarball, 'package/package.json'], root));
  packages.push({ name: packageJson.name, version: packageJson.version, tarball, spec: \`file:\${tarball}\`, tarballBytes: (await stat(tarball)).size });
}

if (mode === 'packages' || mode === 'all') {
  await dogfoodPackages(packages);
}

if (mode === 'release' || mode === 'all') {
  for (const pkg of packages) {
    const accessArgs = pkg.name.startsWith('@') ? ['--access', 'public'] : [];
    await run('npm', ['publish', '--dry-run', '--ignore-scripts', ...accessArgs, pkg.tarball], root);
  }
}

await mkdir(dogfoodDir, { recursive: true });
await writeFile(join(dogfoodDir, 'report.json'), JSON.stringify({
  mode,
  generatedAt: new Date().toISOString(),
  packages: packages.map((pkg) => ({ name: pkg.name, version: pkg.version, tarballPath: relative(root, pkg.tarball), tarballBytes: pkg.tarballBytes }))
}, null, 2) + '\\n');
console.log(\`Dogfood \${mode} passed for \${packages.length} publishable package(s).\`);

async function dogfoodPackages(packages) {
  const consumerDir = await mkdtemp(join(tmpdir(), 'moon-pnpm-dogfood-'));
  try {
    await writeFile(join(consumerDir, 'package.json'), JSON.stringify({
      name: 'moon-pnpm-generated-dogfood-consumer',
      private: true,
      type: 'module',
      scripts: { dogfood: 'node dogfood.mjs' },
      dependencies: Object.fromEntries(packages.map((pkg) => [pkg.name, pkg.spec]))
    }, null, 2));
    await writeFile(join(consumerDir, 'pnpm-workspace.yaml'), 'packages: []\\n');
      const honoPackage = packages.find((pkg) => pkg.name === '${repoName}-hono-base');
      if (!honoPackage) throw new Error('Generated hono-base package was not packed.');
      await writeFile(join(consumerDir, 'dogfood.mjs'), \`import assert from 'node:assert/strict';\\nconst pkg = await import('\${honoPackage.name}');\\nassert.equal(typeof pkg.createBaseApp, 'function');\\nconst app = pkg.createBaseApp({ version: '0.0.0', serviceName: 'dogfood' });\\nconst healthz = await app.request('/healthz');\\nassert.equal(healthz.status, 200);\\nassert.deepEqual(await healthz.json(), { status: 'ok' });\\nconst version = await app.request('/version');\\nassert.equal(version.status, 200);\\nassert.deepEqual(await version.json(), { name: 'dogfood', version: '0.0.0' });\\n\`);
    await run('corepack', ['enable'], consumerDir);
    await run('corepack', ['prepare', 'pnpm@11.10.0', '--activate'], consumerDir);
    await run('pnpm', ['install'], consumerDir);
    await run('pnpm', ['run', 'dogfood'], consumerDir);
  } finally {
    await rm(consumerDir, { recursive: true, force: true });
  }
}

function run(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false, env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' } });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(\`\${command} \${args.map((arg) => basename(arg) || arg).join(' ')} exited with \${code}\`)));
  });
}

function runCapture(command, args, cwd) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], shell: false });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun(output) : reject(new Error(\`\${command} \${args.join(' ')} exited with \${code}\`)));
  });
}
`;
}

function rootSmokeTest(): string {
  return `import { describe, expect, it } from 'vitest';

describe('workspace smoke', () => {
  it('runs root tests', () => {
    expect(1 + 1).toBe(2);
  });
});
`;
}

function setupAction(): string {
  return `name: setup
description: "Install Node.js, pnpm, dependencies, and warm moon caches"
inputs:
  node-version:
    required: false
    default: "24.x"
  registry-url:
    required: false
    default: "https://registry.npmjs.org"
runs:
  using: "composite"
  steps:
    - uses: actions/setup-node@v6.4.0
      with:
        node-version: \${{ inputs.node-version }}
        registry-url: \${{ inputs.registry-url }}
    - shell: bash
      run: |
        corepack enable
        corepack prepare pnpm@11.10.0 --activate
    - shell: bash
      id: pnpm-store
      run: echo "dir=$(pnpm store path --silent)" >> "$GITHUB_OUTPUT"
    - uses: actions/cache@v5.0.5
      with:
        path: \${{ steps.pnpm-store.outputs.dir }}
        key: \${{ runner.os }}-\${{ inputs.node-version }}-pnpm-\${{ hashFiles('pnpm-lock.yaml') }}
        restore-keys: |
          \${{ runner.os }}-\${{ inputs.node-version }}-pnpm-
    - uses: actions/cache@v5.0.5
      with:
        path: |
          ~/.moon/plugins
          .moon/cache
        key: \${{ runner.os }}-\${{ inputs.node-version }}-moon-\${{ hashFiles('.moon/**/*.yml', 'packages/*/moon.yml', 'pnpm-lock.yaml') }}
        restore-keys: |
          \${{ runner.os }}-\${{ inputs.node-version }}-moon-
    - shell: bash
      run: pnpm install --frozen-lockfile
`;
}

function mainWorkflow(): string {
  return `name: ci

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
      - run: scripts/check.sh ci
      - run: git diff --exit-code

  package-dogfood:
    needs: [checks]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: ./.github/actions/setup
      - run: scripts/check.sh dogfood packages
`;
}

function publishWorkflow(): string {
  return `name: publish

on:
  workflow_dispatch:
    inputs:
      publish_to_npm:
        description: "Publish packages to npm after validation"
        required: true
        type: boolean
        default: false

permissions:
  contents: write
  pull-requests: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
          persist-credentials: \${{ inputs.publish_to_npm }}
      - uses: ./.github/actions/setup
        with:
          registry-url: https://registry.npmjs.org
      - run: scripts/check.sh ci
      - run: scripts/check.sh dogfood all
      - name: Create or update release PR
        if: inputs.publish_to_npm && github.ref == 'refs/heads/main'
        uses: changesets/action@v1
        with:
          version: pnpm run version-packages
          publish: pnpm run publish-packages
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_AUTH_TOKEN }}
`;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
