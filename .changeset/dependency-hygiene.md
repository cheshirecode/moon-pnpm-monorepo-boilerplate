---
"@cheshirecode/browser-clipboard": patch
"@cheshirecode/eslint-config-react": patch
"@cheshirecode/measure-hook": patch
---

Remove dead pnpm overrides (eslint-plugin-unused-imports, @typescript-eslint/* — eliminates duplicate 8.61.1/8.62.1 copies), remove unused devDependencies (eslint + eslint-config-react from browser-clipboard, vite from measure-hook), and fix eslint-config-react repository/homepage metadata.
