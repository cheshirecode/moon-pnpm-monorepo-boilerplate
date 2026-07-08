---
"@cheshirecode/pkce": patch
---

Overhaul pkce build and packaging: move react/react-dom to peerDependencies, externalize all runtime dependencies in the Vite build, drop the UMD/CJS build (ESM-only), fix lib.d.ts generation, remove vite.svg from dist, add coverage thresholds, and gate live-network integration tests behind RUN_LIVE_INTEGRATION env flag.
