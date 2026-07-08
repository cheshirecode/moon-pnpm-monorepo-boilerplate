# @cheshirecode/microfrontend-host

Framework-neutral helpers for mounting microfrontend demos into a host shell.

> **Demo only — not for external use.** This package exists to support the
> renderer showcase inside this monorepo. It is not intended as a standalone
> dependency.

## Install

```sh
pnpm add @cheshirecode/microfrontend-host
```

## Usage

```js
import { mountMicrofrontend } from '@cheshirecode/microfrontend-host';

const unmount = mountMicrofrontend(container, descriptor);
```

## Consumers

Consumed by renderer-showcase for mounting renderer demo apps as microfrontends.

## License

MIT
