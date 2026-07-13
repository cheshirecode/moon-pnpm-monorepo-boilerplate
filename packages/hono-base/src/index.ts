import { Hono } from 'hono';

export interface BaseAppOptions {
  version: string;
  serviceName?: string;
}

export function createBaseApp(options: BaseAppOptions): Hono {
  const app = new Hono();

  app.get('/healthz', (c) => c.json({ status: 'ok' }));

  app.get('/version', (c) =>
    c.json({ name: options.serviceName ?? 'hono-base', version: options.version })
  );

  app.notFound((c) => c.json({ error: 'Not Found' }, 404));

  app.onError((_err, c) => c.json({ error: 'Internal Server Error' }, 500));

  return app;
}
