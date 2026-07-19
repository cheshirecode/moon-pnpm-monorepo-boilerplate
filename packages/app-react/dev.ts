#!/usr/bin/env node

import type { Server } from 'node:http';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createServer as createViteServer, type ViteDevServer } from 'vite';

import { nodeRequestToWebRequest, sendWebResponse } from './src/server/dev-adapter.ts';

const defaultPackageDir = resolve(dirname(fileURLToPath(import.meta.url)));

export interface DevServerOptions {
  port?: number;
  host?: string;
  packageDir?: string;
}

export interface DevServerHandle {
  server: Server;
  vite: ViteDevServer;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export async function startDevServer(options: DevServerOptions = {}): Promise<DevServerHandle> {
  const packageDir = options.packageDir ?? defaultPackageDir;
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  const host = options.host ?? '127.0.0.1';

  const server = createServer((req, res) => {
    vite.middlewares(req, res, async () => {
      try {
        const webReq = nodeRequestToWebRequest(req);
        const webRes = await app.fetch(webReq);
        await sendWebResponse(res, webRes);
      } catch (e) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
        }
        res.end(String(e instanceof Error ? e.stack ?? e.message : e));
      }
    });
  });

  const vite = await createViteServer({
    root: packageDir,
    configFile: resolve(packageDir, 'vite.config.dev.ts'),
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: 'custom'
  });

  const { createDevApp } = await vite.ssrLoadModule(
    resolve(packageDir, 'src/server/app.tsx')
  );
  const { app } = createDevApp(vite);

  await new Promise<void>((r) => {
    server.listen(port, host, () => r());
  });

  const addr = server.address();
  const actualPort = typeof addr === 'string' ? port : addr?.port ?? port;
  const url = `http://${host}:${actualPort}`;

  let closed = false;
  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    await vite.close();
    await new Promise<void>((r) => server.close(() => r()));
  }

  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  return { server, vite, port: actualPort, url, close };
}

async function main() {
  const handle = await startDevServer();
  console.log(`app-react dev server running on ${handle.url}`);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });
}
