# @cheshirecode/demo-contract

Shared renderer demo contract for monorepo example apps.

> **Demo only — not for external use.** This package exists to exercise the
> multi-renderer showcase inside this monorepo. It is not intended as a
> standalone dependency.

## Install

```sh
pnpm add @cheshirecode/demo-contract
```

## Usage

```js
import { createRendererDemoContract } from '@cheshirecode/demo-contract';

const contract = createRendererDemoContract('React');
console.log(contract.title); // 'React renderer'
```

## License

MIT
