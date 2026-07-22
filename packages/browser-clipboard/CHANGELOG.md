# @cheshirecode/browser-clipboard

## 1.0.0

### Major Changes

- bac87a1: Unify all publishable packages under the `@cheshirecode` scope. The legacy
  `@cheshirecode/*` package names (browser-clipboard, pkce, eslint-config-react)
  and the unscoped `measure-hook` are renamed to their `@cheshirecode/*`
  equivalents. The previously published unscoped `measure-hook@1.0.3` remains
  on the npm registry as an orphan and is not unpublished. This is the first
  scoped release for these packages, so they move to 1.0.0.

### Patch Changes

- 87de3a1: Remove dead pnpm overrides (eslint-plugin-unused-imports, @typescript-eslint/* — eliminates duplicate 8.61.1/8.62.1 copies), remove unused devDependencies (eslint + eslint-config-react from browser-clipboard, vite from measure-hook), and fix eslint-config-react repository/homepage metadata.
- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
