import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createBaseApp } from '@cheshirecode/hono-base';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { renderToString } from 'react-dom/server';
import type { ViteDevServer } from 'vite';

import AppTree from '../shared/AppTree';
import { serializeBootstrap } from '../shared/bootstrap';

export interface ManifestEntry {
  file: string;
  css?: string[];
  isEntry?: boolean;
}

export interface ResolvedAssets {
  js: string;
  css: string[];
}

export interface ViteManifest {
  [key: string]: ManifestEntry;
}

async function loadManifest(clientDir: string): Promise<ViteManifest | null> {
  const candidates = [
    resolve(clientDir, 'manifest.json'),
    resolve(clientDir, '.vite', 'manifest.json')
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, 'utf-8');
      return JSON.parse(raw) as ViteManifest;
    } catch {
    }
  }
  return null;
}

export function resolveAssets(manifest: ViteManifest | null, assetBase = ''): ResolvedAssets {
  if (!manifest) {
    return { js: `${assetBase}/client/entry-hydration.js`, css: [] };
  }

  const entry = manifest['src/entry-hydration.tsx'];
  if (!entry) {
    return { js: `${assetBase}/client/entry-hydration.js`, css: [] };
  }

  return {
    js: `${assetBase}/client/${entry.file}`,
    css: (entry.css ?? []).map((c) => `${assetBase}/client/${c}`)
  };
}

const HTML_500 = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>500 Internal Server Error</title></head>
<body><h1>500 Internal Server Error</h1></body>
</html>`;

export interface ServerAppOptions {
  version: string;
  serviceName?: string;
  clientDir?: string;
  devVite?: ViteDevServer;
  /** Prefix for emitted client asset URLs (e.g. "/apps/react" when hosted under a subpath). */
  assetBase?: string;
  /** Pre-resolved client assets, bypassing manifest lookup (used by the Netlify function). */
  assets?: ResolvedAssets;
}

export function createServerApp(options: ServerAppOptions): Hono {
  const isDev = !!options.devVite;
  const app = createBaseApp(options);

  if (options.clientDir) {
    app.use('/client/*', serveStatic({ root: options.clientDir, rewriteRequestPath: (path) => path.replace(/^\/client\//, '') }));
    app.use('/static/*', serveStatic({ root: options.clientDir }));
  }

  let assetsPromise: Promise<ResolvedAssets> | null = null;
  function getAssets(): Promise<ResolvedAssets> {
    if (options.assets) {
      return Promise.resolve(options.assets);
    }
    if (!assetsPromise) {
      assetsPromise = (options.clientDir
        ? loadManifest(options.clientDir)
        : Promise.resolve(null)
      ).then((manifest) => resolveAssets(manifest, options.assetBase ?? ''));
    }
    return assetsPromise;
  }

  app.onError((err, c) => {
    const acceptsHtml = c.req.header('accept')?.includes('text/html');
    if (acceptsHtml) {
      return c.html(HTML_500, 500);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  async function renderDocument(url: string): Promise<string> {
    let html: string;

    if (isDev && options.devVite) {
      const { renderAppTree } = await options.devVite.ssrLoadModule(
        resolve(import.meta.dirname ?? process.cwd(), 'render-app.tsx')
      );
      html = renderAppTree();
    } else {
      html = renderToString(<AppTree />);
    }

    const bootstrap = serializeBootstrap({ version: options.version });
    const assets = await getAssets();

    const cssLinks = assets.css
      .map((href) => `  <link rel="stylesheet" href="${href}" />`)
      .join('\n');

    const hydrationSrc = isDev ? '/src/entry-hydration.tsx' : assets.js;

    let document = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>React renderer</title>
${cssLinks}
</head>
<body>
  <div id="root">${html}</div>
  <script type="application/json" id="bootstrap">${bootstrap}</script>
  <script type="module" src="${hydrationSrc}"></script>
</body>
</html>`;

    if (isDev && options.devVite) {
      document = await options.devVite.transformIndexHtml(url, document);
    }

    return document;
  }

  app.get('/', async (c) => {
    try {
      const document = await renderDocument(c.req.url);
      return c.html(document);
    } catch {
      return c.html(HTML_500, 500);
    }
  });

  return app;
}

export function createDevApp(devVite: ViteDevServer) {
  const app = createServerApp({
    version: '0.0.0',
    serviceName: 'app-react',
    devVite
  });
  return { app };
}
