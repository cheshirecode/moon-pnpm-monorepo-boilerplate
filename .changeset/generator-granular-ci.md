---
"@cheshirecode/create-moon-pnpm-monorepo": minor
---

Generated repos now scaffold a consolidated, self-consistent CI. A single `ci` job runs `scripts/check.sh full` (moon parallelizes lint/typecheck/build/test in-process), so the cross-job build-manifest artifact hand-off is gone. Generated `check.sh` and `main.yml` no longer reference parent-only checks (`check-boundaries`, `package-drift`, `readme-map`, `generator-drift`) that were never shipped into scaffolded repos — these previously caused a red CI on the first commit. Layer boundaries are now enforced natively via moon's `constraints.enforceLayerRelationships`.
