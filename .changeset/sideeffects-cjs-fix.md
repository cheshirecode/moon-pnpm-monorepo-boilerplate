---
"@cheshirecode/measure-hook": patch
"@cheshirecode/eslint-config-react": patch
---

Set `sideEffects: true` for CJS packages (measure-hook, eslint-config-react). Bundlers cannot reliably tree-shake CommonJS modules, so `false` was semantically incorrect — it gave bundlers a license they can't safely exercise on `module.exports`.
