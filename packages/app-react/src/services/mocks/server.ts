import type { Request } from 'miragejs';
import { createServer } from 'miragejs';
import type Schema from 'miragejs/orm/schema';
import type { Server, ServerConfig } from 'miragejs/server';

export function seeds(_server: Server) {}

export function makeServer(config: ServerConfig<{}, {}> = {}): Server {
  const { environment = 'test', ...conf } = config;
  return createServer({
    ...conf,
    environment,

    models: {},

    seeds(server) {
      seeds(server);
    },

    routes() {
      // specifically for testing fetch code
      const testHandler = (s: Schema<{}>, r: Request) => ({
        headers: r.requestHeaders,
        body: r.requestBody,
        params: r.params,
        queryParams: r.queryParams
      });
      this.get('/test', testHandler);
      this.post('/test', testHandler);
      this.put('/test', testHandler);
      this.delete('/delete', testHandler);
      this.get('/test/:foo', testHandler);
      this.post('/test/:foo', testHandler);
      this.put('/test/:foo', testHandler);
      this.delete('/delete/:foo', testHandler);
    }
  });
}
