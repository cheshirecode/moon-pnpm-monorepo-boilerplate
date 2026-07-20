import { describe, expect, it } from 'vitest';

import { createServerApp } from './app';

// Guards the contract the Netlify function relies on: pre-resolved `assets` are
// emitted verbatim so app-react can be server-rendered under the /apps/react subpath.
describe('createServerApp with pre-resolved assets (Netlify subpath SSR)', () => {
  it('renders the document with the supplied asset URLs', async () => {
    const app = createServerApp({
      version: '0.0.0',
      serviceName: 'app-react',
      assets: {
        js: '/apps/react/client/entry-hydration.js',
        css: ['/apps/react/client/static/entry-abc123.css']
      }
    });

    const res = await app.fetch(new Request('http://localhost/'));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('<div id="root">');
    expect(html).toContain('src="/apps/react/client/entry-hydration.js"');
    expect(html).toContain('href="/apps/react/client/static/entry-abc123.css"');
  });
});
