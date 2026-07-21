---
"@cheshirecode/microfrontend-host": patch
---

fix: wrap mount calls in try-catch with styled error fallbacks

When `mountMicrofrontends` encounters a framework mount error, the uncaught exception previously broke the entire mount loop. Now errors are caught gracefully, a `.microfrontend-error` fallback is rendered in the mount point, and the error is logged via `console.error`.