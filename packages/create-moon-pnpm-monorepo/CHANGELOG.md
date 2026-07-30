# @cheshirecode/create-moon-pnpm-monorepo

## 0.1.0

### Minor Changes

- d1bfac0: Generate a publishable Hono base package and private React SSR application in clean moon, pnpm, and Changesets monorepos.
- 4ab8f6f: Generated repos now scaffold a consolidated, self-consistent CI. A single `ci` job runs `scripts/check.sh full` (moon parallelizes lint/typecheck/build/test in-process), so the cross-job build-manifest artifact hand-off is gone. Generated `check.sh` and `main.yml` no longer reference parent-only checks (`check-boundaries`, `package-drift`, `readme-map`, `generator-drift`) that were never shipped into scaffolded repos — these previously caused a red CI on the first commit. Layer boundaries are now enforced natively via moon's `constraints.enforceLayerRelationships`.

### Patch Changes

- dcf7e6c: Let full dogfood reuse already-built package artifacts.
- f9fe51c: Generate TypeScript 7 workspaces with dependency-aware builds and first-run lockfile bootstrap, keep the shared ESLint config compatible through its package-scoped TypeScript 6 compiler API dependency, and preserve PKCE declarations with the TypeScript 6 tooling fallback.
- 550b4a8: Update generated setup actions to cache pnpm stores plus Moon plugins/task artifacts with reusable keys.
- eddd042: Add missing npm metadata (description, keywords, author, repository, bugs) to pkce, browser-clipboard, and eslint-config-react. Add `sideEffects: false` to 11 publishable packages that were missing it, enabling bundler tree-shaking. Fix pkce README usage example to match the actual `PKCEWrapper` constructor signature.
- eb80c1e: Generate release-pr and publish-only workflows with pending-changesets guard, pinned changesets/action, and least-privilege permissions.
- fc71c96: Add a shared TypeScript config package and generate new monorepos with the shared config pattern.
- 66eca67: Update generated monorepos to use the newer pnpm/moon/oxlint pins and run single-package coverage through moon instead of rebuilding every workspace package.
- fdc7a7a: Update generated monorepo templates to use pnpm 11.10.0.
