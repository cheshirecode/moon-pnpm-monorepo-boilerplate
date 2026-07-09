---
"@cheshirecode/measure-hook": patch
---

Remove phantom `bin` field. `index.js` is a pure CJS function export (`module.exports = (timeout, cb) => {...}`) with no shebang, argv parsing, or CLI logic, so the advertised `measure-hook` binary crashed or no-op'd when invoked. Consumers should `require('@cheshirecode/measure-hook')` as a function instead.
