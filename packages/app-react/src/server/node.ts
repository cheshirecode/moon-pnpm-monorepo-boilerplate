import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { createServerApp } from './app';

const port = Number(process.env.PORT ?? 3000);

// Resolve dist/client/ relative to this runtime entry point (dist/server/index.js).
// Both dist/server/ and dist/client/ are siblings under dist/.
const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'client');

const app = createServerApp({ version: '0.0.0', serviceName: 'app-react', clientDir });

const server = serve({ fetch: app.fetch, port });

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`app-react server running on http://localhost:${port}`);