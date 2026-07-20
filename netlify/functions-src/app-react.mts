// Source for the app-react SSR Netlify Function. build-site.mjs esbuild-bundles this
// into netlify/functions/app-react.mjs (self-contained — workspace deps like
// @cheshirecode/hono-base are inlined, so nothing is imported at runtime). Static client
// assets live at /apps/react/client/* and are served by the CDN (excludedPath below).
import { createServerApp } from '../../packages/app-react/src/server/app';
import assets from './app-react-assets.mjs';

const app = createServerApp({ version: '0.0.0', serviceName: 'app-react', assets });

export default async function handler(request: Request): Promise<Response> {
  // The Hono app defines routes at '/', but it is hosted under /apps/react.
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/apps\/react/, '') || '/';
  return app.fetch(new Request(url.toString(), request));
}

export const config = {
  path: ['/apps/react', '/apps/react/*'],
  excludedPath: '/apps/react/client/*'
};
