# @cheshirecode/pkce

## 1.0.0

### Major Changes

- bac87a1: Unify all publishable packages under the `@cheshirecode` scope. The legacy
  `@cheshirecode/*` package names (browser-clipboard, pkce, eslint-config-react)
  and the unscoped `measure-hook` are renamed to their `@cheshirecode/*`
  equivalents. The previously published unscoped `measure-hook@1.0.3` remains
  on the npm registry as an orphan and is not unpublished. This is the first
  scoped release for these packages, so they move to 1.0.0.

### Patch Changes

- f9fe51c: Generate TypeScript 7 workspaces with dependency-aware builds and first-run lockfile bootstrap, keep the shared ESLint config compatible through its package-scoped TypeScript 6 compiler API dependency, and preserve PKCE declarations with the TypeScript 6 tooling fallback.
- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
- d273363: Overhaul pkce build and packaging: move react/react-dom to peerDependencies, externalize all runtime dependencies in the Vite build, drop the UMD/CJS build (ESM-only), fix lib.d.ts generation, remove vite.svg from dist, add coverage thresholds, and gate live-network integration tests behind RUN_LIVE_INTEGRATION env flag.
- c02b442: Add TypeScript type declarations (.d.ts) to the published tarball via vite-plugin-dts. External consumers can now resolve types from the `exports` field.
- Updated dependencies [87de3a1]
- Updated dependencies [eddd042]
- Updated dependencies [bac87a1]
  - @cheshirecode/browser-clipboard@1.0.0
