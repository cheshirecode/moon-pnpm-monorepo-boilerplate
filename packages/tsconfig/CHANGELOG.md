# @cheshirecode/tsconfig

## 0.1.0

### Minor Changes

- fc71c96: Add a shared TypeScript config package and generate new monorepos with the shared config pattern.

### Patch Changes

- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
