# @cheshirecode/hono-base

Runtime-neutral Hono app factory with health, version, and centralized error handling.

## Install

```sh
pnpm add @cheshirecode/hono-base
```

## Usage

```ts
import { createBaseApp } from '@cheshirecode/hono-base';

const app = createBaseApp({ version: '0.0.0', serviceName: 'my-service' });

// app.request('/healthz') → 200 { "status": "ok" }
// app.request('/version') → 200 { "name": "my-service", "version": "0.0.0" }
```

The returned Hono instance uses only Web Standard APIs. It does not import `node:*` or `@hono/node-server`, so it can be used with any Hono runtime adapter.

## License

MIT
