// Netlify Function (Node runtime) that server-renders app-react under /apps/react.
// Static client assets live at /apps/react/client/* and are served by Netlify's CDN;
// this function only renders the HTML document (which then hydrates client-side).
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
  path: ['/apps/react', '/apps/react/*']
};
