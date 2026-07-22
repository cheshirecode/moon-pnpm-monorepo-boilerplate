# @cheshirecode/microfrontend-host

## 0.1.0

### Minor Changes

- f6e314a: Add framework-neutral microfrontend host helpers for renderer showcase mounting.

### Patch Changes

- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
- 196805c: fix: wrap mount calls in try-catch with styled error fallbacks

  When `mountMicrofrontends` encounters a framework mount error, the uncaught exception previously broke the entire mount loop. Now errors are caught gracefully, a `.microfrontend-error` fallback is rendered in the mount point, and the error is logged via `console.error`.
