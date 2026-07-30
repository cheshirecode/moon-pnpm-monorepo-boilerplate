# @cheshirecode/vitest-config

Shared vitest configuration factories for Cheshire Code packages.

## Usage

```js
import { packageTestConfig, domPackageTestConfig } from '@cheshirecode/vitest-config';

export default defineConfig(domPackageTestConfig({
  // overrides
}));
```

## API

- `packageTestConfig(options?)` — base config for library packages
- `domPackageTestConfig(options?)` — config with happy-dom environment
- `rootSmokeTestConfig()` — config for root-level smoke tests
- `viteAppTestConfig(options?)` — config for Vite application packages
- `configDefaults`, `coverageConfigDefaults` — re-exports from vitest