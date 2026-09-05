# @cheshirecode/demo-contract

## 0.1.0

### Minor Changes

- 53f5e96: Add the shared renderer demo contract, renderer app verification, shared Vitest helpers, and package drift checks.

### Patch Changes

- a9a5840: Consolidate framework-neutral string, form, filtering, and URL helpers into one browser utility package and update the shared renderer demo contract to consume it.
- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
- Updated dependencies [a9a5840]
- Updated dependencies [eddd042]
  - @cheshirecode/browser-utils@0.1.0
