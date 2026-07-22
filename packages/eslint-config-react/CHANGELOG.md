# Change Log - @cheshirecode/eslint-config-react

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
- 87de3a1: Remove dead pnpm overrides (eslint-plugin-unused-imports, @typescript-eslint/* — eliminates duplicate 8.61.1/8.62.1 copies), remove unused devDependencies (eslint + eslint-config-react from browser-clipboard, vite from measure-hook), and fix eslint-config-react repository/homepage metadata.
- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
- 8f577e9: Set `sideEffects: true` for CJS packages (measure-hook, eslint-config-react). Bundlers cannot reliably tree-shake CommonJS modules, so `false` was semantically incorrect — it gave bundlers a license they can't safely exercise on `module.exports`.

This log was last generated on Fri, 22 Dec 2023 14:09:18 GMT and should not be manually modified.

## 0.3.0

Fri, 22 Dec 2023 14:09:18 GMT

### Minor changes

- 0.3.0 major update

## 1.0.0

Fri, 22 Dec 2023 14:01:03 GMT

### Breaking changes

- 0.3.0 - major upgrade

## 0.2.1

Tue, 22 Nov 2022 07:27:06 GMT

### Patches

- eslint sort-imports to ignore case

## 0.2.0

Tue, 22 Nov 2022 06:26:29 GMT

### Minor changes

- big update

## 0.1.2

Tue, 22 Nov 2022 03:35:45 GMT

### Patches

- package update

## 0.1.1

Tue, 22 Nov 2022 03:18:05 GMT

### Patches

- minor fixes

## 0.1.0

Tue, 22 Nov 2022 02:57:54 GMT

### Minor changes

- add import sorting for linting

## 0.0.12

Wed, 02 Nov 2022 03:29:15 GMT

### Patches

- minor errors

## 0.0.11

Tue, 01 Nov 2022 13:52:17 GMT

### Patches

- correct eslint example

## 0.0.10

Tue, 01 Nov 2022 13:20:06 GMT

### Patches

- fix test

## 0.0.8

Sun, 07 Aug 2022 16:15:58 GMT

### Patches

- keep @cheshirecode/eslint-config-react
