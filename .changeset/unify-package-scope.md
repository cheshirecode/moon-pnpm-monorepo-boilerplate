---
"@cheshirecode/browser-clipboard": major
"@cheshirecode/pkce": major
"@cheshirecode/eslint-config-react": major
"@cheshirecode/measure-hook": major
---

Unify all publishable packages under the `@cheshirecode` scope. The legacy
`@cheshirecode/*` package names (browser-clipboard, pkce, eslint-config-react)
and the unscoped `measure-hook` are renamed to their `@cheshirecode/*`
equivalents. The previously published unscoped `measure-hook@1.0.3` remains
on the npm registry as an orphan and is not unpublished. This is the first
scoped release for these packages, so they move to 1.0.0.
