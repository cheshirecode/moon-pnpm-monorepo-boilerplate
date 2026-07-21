import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { startDevServer, type DevServerHandle } from '../../dev';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function httpFetch(baseUrl: string) {
  return async (path: string, opts?: RequestInit) => fetch(`${baseUrl}${path}`, opts);
}

async function waitFor(
  fn: () => Promise<boolean>,
  timeoutMs = 10000,
  intervalMs = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

describe('app-react dev integration (real startDevServer on port 0)', () => {
  let handle: DevServerHandle;
  let fetch: ReturnType<typeof httpFetch>;

  beforeAll(async () => {
    handle = await startDevServer({ port: 0, packageDir });
    fetch = httpFetch(handle.url);
  }, 30000);

  afterAll(async () => {
    await handle.close();
  });

  it('GET /healthz returns JSON ok', async () => {
    const res = await fetch('/healthz');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /version returns service info', async () => {
    const res = await fetch('/version');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.name).toBe('app-react');
    expect(body.version).toBe('0.0.0');
  });

  it('GET / returns SSR HTML with root div and bootstrap', async () => {
    const res = await fetch('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('<div id="root">');
    expect(html).toContain('<script type="application/json" id="bootstrap">');
    expect(html).toContain('React renderer');
  });

  it('GET / returns HTML with Vite client script injected via transformIndexHtml', async () => {
    const res = await fetch('/');
    const html = await res.text();
    expect(html).toContain('/@vite/client');
  });

  it('GET / uses source hydration entry in dev mode', async () => {
    const res = await fetch('/');
    const html = await res.text();
    expect(html).toContain('src="/src/entry-hydration.tsx"');
    expect(html).not.toContain('/client/entry-hydration.js');
  });

  it('dev HTML contains React Fast Refresh runtime', async () => {
    const res = await fetch('/');
    const html = await res.text();
    expect(html).toContain('@react-refresh');
  });

  it('GET /@vite/client returns JavaScript over real HTTP', async () => {
    const res = await fetch('/@vite/client');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('vite');
    expect(body).toContain('connect');
  });
});

describe('app-react dev HMR: same-server SSR invalidation via temp fixture', () => {
  let tempDir: string;
  let handle: DevServerHandle;
  let fetch: ReturnType<typeof httpFetch>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(packageDir, '.tmp-hmr-'));

    await writeFile(join(tempDir, 'vite.config.dev.ts'), `
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
  root: ${JSON.stringify(tempDir)},
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  resolve: { alias: {} },
  ssr: { noExternal: ['hono', '@hono/node-server'] },
  appType: 'custom'
});
`);

    await mkdir(join(tempDir, 'src', 'server'), { recursive: true });
    await mkdir(join(tempDir, 'src', 'shared'), { recursive: true });

    await writeFile(join(tempDir, 'src', 'shared', 'AppTree.tsx'), `
export function AppTree() {
  return <div data-testid="hmr-marker">ORIGINAL-CONTENT</div>;
}
export default AppTree;
`);

    await writeFile(join(tempDir, 'src', 'server', 'render-app.tsx'), `
import { renderToString } from 'react-dom/server';
import AppTree from '../shared/AppTree';
export function renderAppTree(): string {
  return renderToString(<AppTree />);
}
`);

    await writeFile(join(tempDir, 'src', 'server', 'app.tsx'), `
import { createBaseApp } from '@cheshirecode/hono-base';
import { Hono } from 'hono';
import { renderToString } from 'react-dom/server';
import type { ViteDevServer } from 'vite';
import { resolve } from 'node:path';
import AppTree from '../shared/AppTree';

export interface ServerAppOptions {
  version: string;
  serviceName?: string;
  devVite?: ViteDevServer;
}

export function createServerApp(options: ServerAppOptions): Hono {
  const app = createBaseApp(options);
  const isDev = !!options.devVite;

  app.get('/', async (c) => {
    let html: string;
    if (isDev && options.devVite) {
      const { renderAppTree } = await options.devVite.ssrLoadModule(
        resolve(${JSON.stringify(tempDir)}, 'src/server/render-app.tsx')
      );
      html = renderAppTree();
    } else {
      html = renderToString(<AppTree />);
    }
    return c.html('<!DOCTYPE html><html><body><div id="root">' + html + '</div></body></html>');
  });

  return app;
}

export function createDevApp(devVite: ViteDevServer) {
  const app = createServerApp({ version: '0.0.0', serviceName: 'app-react', devVite });
  return { app };
}
`);

    handle = await startDevServer({ port: 0, packageDir: tempDir });
    fetch = httpFetch(handle.url);
  }, 30000);

  afterAll(async () => {
    await handle.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('SSR output changes on same process when source file is edited', async () => {
    const pid = process.pid;

    const resBefore = await fetch('/');
    const htmlBefore = await resBefore.text();
    expect(htmlBefore).toContain('ORIGINAL-CONTENT');

    const markerPath = join(tempDir, 'src', 'shared', 'AppTree.tsx');
    await writeFile(markerPath, `
export function AppTree() {
  return <div data-testid="hmr-marker">UPDATED-CONTENT</div>;
}
export default AppTree;
`);

    await waitFor(async () => {
      const res = await fetch('/');
      const html = await res.text();
      return html.includes('UPDATED-CONTENT');
    });

    const resAfter = await fetch('/');
    const htmlAfter = await resAfter.text();

    expect(process.pid).toBe(pid);
    expect(handle.server.listening).toBe(true);
    expect(htmlBefore).not.toContain('UPDATED-CONTENT');
    expect(htmlAfter).toContain('UPDATED-CONTENT');
    expect(htmlAfter).not.toContain('ORIGINAL-CONTENT');
  });
});
