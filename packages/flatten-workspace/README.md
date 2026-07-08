# @cheshirecode/flatten-workspace

Flatten selected object fields from workspace package manifests into one root package manifest.

```ts
import { flattenPackages } from '@cheshirecode/flatten-workspace';

const flattened = flattenPackages({
  main: { private: true },
  packages: [{ dependencies: { vite: '^8.0.16' } }],
  props: ['dependencies']
});
```

The CLI reads package manifests under a workspace and writes the flattened result to stdout or `--out-file`.

```sh
flatten-workspace --root . --location packages --out-file package.flattened.json
```

## Consumers

Used by monorepo operators to flatten workspace dependency manifests into a single resolved package.json.
