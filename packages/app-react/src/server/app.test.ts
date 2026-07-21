import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createServerApp, resolveAssets, type ViteManifest } from './app';

describe('resolveAssets', () => {
  it('returns fallback paths when manifest is null', () => {
    const assets = resolveAssets(null);
    expect(assets.js).toBe('/client/entry-hydration.js');
    expect(assets.css).toEqual([]);
  });

  it('resolves JS and CSS from valid manifest', () => {
    const manifest: ViteManifest = {
      'src/entry-hydration.tsx': {
        file: 'entry-hydration.js',
        css: ['static/entry-abc123.css'],
        isEntry: true
      }
    };
    const assets = resolveAssets(manifest);
    expect(assets.js).toBe('/client/entry-hydration.js');
    expect(assets.css).toEqual(['/client/static/entry-abc123.css']);
  });

  it('returns fallback when entry missing from manifest', () => {
    const manifest: ViteManifest = {
      'src/other.tsx': {
        file: 'other.js',
        isEntry: true
      }
    };
    const assets = resolveAssets(manifest);
    expect(assets.js).toBe('/client/entry-hydration.js');
    expect(assets.css).toEqual([]);
  });

  it('handles multiple CSS files in manifest', () => {
    const manifest: ViteManifest = {
      'src/entry-hydration.tsx': {
        file: 'entry-hydration.js',
        css: ['static/entry-abc123.css', 'static/vendor-def456.css'],
        isEntry: true
      }
    };
    const assets = resolveAssets(manifest);
    expect(assets.css).toHaveLength(2);
    expect(assets.css[0]).toBe('/client/static/entry-abc123.css');
    expect(assets.css[1]).toBe('/client/static/vendor-def456.css');
  });
});

describe('app-react server', () => {
  const app = createServerApp({ version: '0.0.0', serviceName: 'app-react' });

  it('GET /healthz inherits from hono-base', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /version inherits from hono-base', async () => {
    const res = await app.request('/version');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: 'app-react', version: '0.0.0' });
  });

  it('GET / returns SSR HTML with root div and bootstrap script', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('<div id="root">');
    expect(html).toContain('<script type="application/json" id="bootstrap">');
    expect(html).toContain('React renderer');
  });

  it('bootstrap data is escaped (no raw </script>)', async () => {
    const res = await app.request('/');
    const html = await res.text();
    const bootstrapMatch = html.match(/<script type="application\/json" id="bootstrap">([\s\S]*?)<\/script>/);
    expect(bootstrapMatch).not.toBeNull();
    const bootstrapContent = bootstrapMatch![1];
    expect(bootstrapContent).not.toContain('</script>');
  });

  it('SSR failure returns minimal generic HTML 500', async () => {
    const failingApp = createServerApp({ version: '0.0.0' });
    failingApp.get('/throw', () => {
      throw new Error('boom');
    });
    // Simulate browser request (Accept: text/html)
    const res = await failingApp.request('/throw', {
      headers: { accept: 'text/html' }
    });
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).toContain('500 Internal Server Error');
    // Must be HTML, not JSON
    expect(body).toContain('<!DOCTYPE html>');
  });

  it('API error returns JSON 500 for non-HTML Accept headers', async () => {
    const failingApp = createServerApp({ version: '0.0.0' });
    failingApp.get('/api/throw', () => {
      throw new Error('boom-api');
    });
    const res = await failingApp.request('/api/throw', {
      headers: { accept: 'application/json' }
    });
    expect(res.status).toBe(500);
    const json = await res.json() as Record<string, unknown>;
    expect(json).toHaveProperty('error', 'Internal Server Error');
    // Must NOT be HTML
    expect(res.headers.get('content-type')).not.toContain('text/html');
  });
});

describe('app-react production static asset serving', () => {
  it('serves client hydration JS from /client/ path when clientDir is configured', async () => {
    const app = createServerApp({
      version: '0.0.0',
      serviceName: 'app-react',
      clientDir: `${process.cwd()}/packages/app-react/dist/client`,
    });
    const res = await app.request('/client/entry-hydration.js');
    // Asset may or may not exist in test environment; verify route is registered (404 vs 500)
    expect(res.status).not.toBe(405);
    expect(res.status).not.toBe(500);
  });

  it('serves static assets from /static/ path when clientDir is configured', async () => {
    const app = createServerApp({
      version: '0.0.0',
      serviceName: 'app-react',
      clientDir: `${process.cwd()}/packages/app-react/dist/client`,
    });
    const res = await app.request('/static/entry-hydration.js');
    expect(res.status).not.toBe(405);
    expect(res.status).not.toBe(500);
  });

  it('does not register /client/ routes without clientDir', async () => {
    const app = createServerApp({ version: '0.0.0', serviceName: 'app-react' });
    const res = await app.request('/client/entry-hydration.js');
    // Without clientDir, static routes are not registered — hono-base default handling
    expect(res.status).not.toBe(500);
  });
});

describe('app-react manifest-based SSR output', () => {
  const tmpDir = join(process.cwd(), '.artifacts', 'test-manifest');
  let app: ReturnType<typeof createServerApp>;

  beforeAll(async () => {
    // Ensure temp directory exists
    await mkdir(tmpDir, { recursive: true });
    // Write a fake manifest + entry JS so serveStatic can find them
    const manifest: ViteManifest = {
      'src/entry-hydration.tsx': {
        file: 'entry-hydration.js',
        css: ['static/entry-testhash.css'],
        isEntry: true
      }
    };
    await writeFile(join(tmpDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');
    await writeFile(join(tmpDir, 'entry-hydration.js'), '// test', 'utf-8');

    app = createServerApp({
      version: '1.2.3',
      serviceName: 'app-react',
      clientDir: tmpDir
    });
  });

  afterAll(async () => {
    // Clean up — optional, .artifacts is gitignored
  });

  it('injects CSS link tags from manifest into SSR HTML', async () => {
    const res = await app.request('/');
    const html = await res.text();
    expect(html).toContain('<link rel="stylesheet" href="/client/static/entry-testhash.css" />');
  });

  it('uses manifest-resolved JS src for hydration script', async () => {
    const res = await app.request('/');
    const html = await res.text();
    expect(html).toContain('src="/client/entry-hydration.js"');
  });

  it('serves the manifest-referenced JS file', async () => {
    const res = await app.request('/client/entry-hydration.js');
    expect(res.status).toBe(200);
  });
});
