import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createBaseApp } from '@cheshirecode/hono-base';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { renderToString } from 'react-dom/server';

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

/** Vite manifest shape emitted by vite.client.config.ts (manifest: true). */
export interface ViteManifest {
  [key: string]: ManifestEntry;
}

/**
 * Read and parse the Vite client manifest from `clientDir`.
 * Checks both the standard location (manifest.json) and the .vite/
 * subdirectory which some Vite versions use in production builds.
 * Returns null when the manifest is missing (dev / not-yet-built).
 */
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
      // Try next candidate
    }
  }
  return null;
}

/**
 * Resolve the entry-hydration JS path and its CSS dependencies
 * from the Vite manifest. Falls back to unhashed paths when
 * the manifest is unavailable (local dev).
 */
export function resolveAssets(manifest: ViteManifest | null): ResolvedAssets {
  if (!manifest) {
    return { js: '/client/entry-hydration.js', css: [] };
  }

  const entry = manifest['src/entry-hydration.tsx'];
  if (!entry) {
    return { js: '/client/entry-hydration.js', css: [] };
  }

  return {
    js: `/client/${entry.file}`,
    css: (entry.css ?? []).map((c) => `/client/${c}`)
  };
}

/** Minimal generic HTML 500 — safe to inject into any document shell. */
const HTML_500 = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>500 Internal Server Error</title></head>
<body><h1>500 Internal Server Error</h1></body>
</html>`;

export function createServerApp(options: {
  version: string;
  serviceName?: string;
  clientDir?: string;
}): Hono {
  const app = createBaseApp(options);

  // Serve production-built client assets from dist/client/.
  // The runtime entry (node.ts) resolves clientDir relative to itself
  // so this works regardless of CWD when running `node dist/server/index.js`.
  if (options.clientDir) {
    app.use('/client/*', serveStatic({ root: options.clientDir, rewriteRequestPath: (path) => path.replace(/^\/client\//, '') }));
    app.use('/static/*', serveStatic({ root: options.clientDir }));
  }

  // Load manifest once at startup; resolveAssets falls back gracefully
  // when clientDir is unset or manifest.json does not yet exist.
  let assetsPromise: Promise<ResolvedAssets> | null = null;
  function getAssets(): Promise<ResolvedAssets> {
    if (!assetsPromise) {
      assetsPromise = (options.clientDir
        ? loadManifest(options.clientDir)
        : Promise.resolve(null)
      ).then(resolveAssets);
    }
    return assetsPromise;
  }

  // Override hono-base JSON onError for document (HTML) routes.
  // API routes that accept JSON still get the inherited JSON response.
  app.onError((err, c) => {
    const acceptsHtml = c.req.header('accept')?.includes('text/html');
    if (acceptsHtml) {
      return c.html(HTML_500, 500);
    }
    // Delegate to hono-base default (JSON) for API callers.
    return c.json({ error: 'Internal Server Error' }, 500);
  });

  app.get('/', async (c) => {
    try {
      const html = renderToString(<AppTree />);
      const bootstrap = serializeBootstrap({ version: options.version });
      const assets = await getAssets();

      const cssLinks = assets.css
        .map((href) => `  <link rel="stylesheet" href="${href}" />`)
        .join('\n');

      return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>app-react</title>
${cssLinks}
</head>
<body>
  <div id="root">${html}</div>
  <script type="application/json" id="bootstrap">${bootstrap}</script>
  <script type="module" src="${assets.js}"></script>
</body>
</html>`);
    } catch {
      return c.html(HTML_500, 500);
    }
  });

  return app;
}
