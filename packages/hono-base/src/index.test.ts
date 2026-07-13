import { describe, expect, it } from 'vitest';

import { createBaseApp } from './index';

describe('createBaseApp', () => {
  it('returns a Hono instance with a fetch method', () => {
    const app = createBaseApp({ version: '0.0.0' });
    expect(typeof app.fetch).toBe('function');
    expect(typeof app.request).toBe('function');
  });

  it('GET /healthz returns 200 with JSON body { status: "ok" }', async () => {
    const app = createBaseApp({ version: '0.0.0' });
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /version with serviceName returns 200 with name and version', async () => {
    const app = createBaseApp({ version: '1.2.3', serviceName: 'app-react' });
    const res = await app.request('/version');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ name: 'app-react', version: '1.2.3' });
  });

  it('GET /version without serviceName defaults name to hono-base', async () => {
    const app = createBaseApp({ version: '0.0.0' });
    const res = await app.request('/version');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: 'hono-base', version: '0.0.0' });
  });

  it('GET /nonexistent returns 404 with JSON body containing error key', async () => {
    const app = createBaseApp({ version: '0.0.0' });
    const res = await app.request('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('unhandled throw returns 500 with generic JSON error, no stack trace or message field', async () => {
    const app = createBaseApp({ version: '0.0.0' });
    app.get('/throw', () => {
      throw new Error('secret internal boom');
    });
    const res = await app.request('/throw');
    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toEqual({ error: 'Internal Server Error' });
    expect(body).not.toHaveProperty('message');
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('secret internal boom');
  });
});
