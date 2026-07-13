---
"@cheshirecode/browser-clipboard": patch
"@cheshirecode/browser-utils": patch
"@cheshirecode/create-moon-pnpm-monorepo": patch
"@cheshirecode/demo-contract": patch
"@cheshirecode/eslint-config-react": patch
"@cheshirecode/flatten-workspace": patch
"@cheshirecode/input-validation": patch
"@cheshirecode/measure-hook": patch
"@cheshirecode/microfrontend-host": patch
"@cheshirecode/pkce": patch
"@cheshirecode/tsconfig": patch
---

Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
