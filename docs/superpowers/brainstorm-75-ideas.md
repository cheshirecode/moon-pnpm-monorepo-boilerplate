# Monorepo Product Brainstorm — 75 Ideas Synthesis

> Generated: 2026-09-07 | Session: loop-engineering brainstorm round + targeted expansion (K/M/N categories)
> Source repo: cheshirecode/moon-pnpm-monorepo-boilerplate
> Worklog project: [monorepo-tooling-improvements](https://github.com/cheshirecode/_worklog/blob/main/people/oss/active/monorepo-tooling-improvements.md)
> Child tasks: [ts-version-aligner](https://github.com/cheshirecode/_worklog/blob/main/people/oss/active/ts-version-aligner.md), [circular-dep-detector](https://github.com/cheshirecode/_worklog/blob/main/people/oss/active/circular-dep-detector.md), [readme-consistency-checker](https://github.com/cheshirecode/_worklog/blob/main/people/oss/active/readme-consistency-checker.md)

## Tracking

TOP 1-2-10 items are tracked in the `_worklog` data repo (`cheshirecode/_worklog`) under the `monorepo-tooling-improvements` project. Each task has full acceptance criteria, implementation notes, and evidence expectations defined in its task file.

Phase 1 quick wins (items #1, #2, #10) are ready for claim via:
```bash
cd ~/Documents/oss/_worklog && WORKLOG_BIN="$HOME/.agents/skills/worklog/bin"
direnv exec . "$WORKLOG_BIN/project.sh" claim <task-slug>
```

## Summary

93 distinct product/tooling ideas were brainstormed across 16 categories (A-N + extended K/M/N). Top 10 selected by priority score (1-10) with effort bias toward small/medium over large. Three recommended for immediate worklog project tracking.

## Methodology

Ranked by **priority descending**, bias toward S-effort > M-effort > L-effort. Filtered for unique problem coverage — no two top-10 items solve the same slice.

---

## TOP 10 IDEA RANKING

| # | Title | Priority | Effort | Category |
|---|-------|----------|--------|----------|
| 1 | Circular Dependency Detector in Boundaries Check | P9 | S | Governance |
| 2 | Shared TypeScript Version Aligner | P8 | S | Toolchain |
| 3 | Pre-commit Gate with Staged-Affected-Only | P9 | M | DX |
| 4 | "What Can I Ship?" PR Gate | P9 | M | Release |
| 5 | Pre-publish API Contract Test Suite | P9 | M | Testing |
| 6 | Monorepo Attack Surface Map | P9 | M | Security |
| 7 | Rollback Automation Script | P9 | M | Release |
| 8 | Bundle Analysis with Size Budgets | P7 | M | Performance |
| 9 | Package Publish-Size Tracker | P8 | M | Performance |
| 10 | README Consistency Checker | P6 | S | Docs |

---

## WHY THESE SPECIFICALLY

- **#1, #2, #10** are S-effort items plugging directly into existing `scripts/check.sh boundaries` pipeline — zero new infrastructure.
- **#3** reduces local CI noise (~70% fewer checks per commit), high-frequency developer pain point.
- **#4** operationalizes Changesets workflow — developers can't currently answer "can I publish today?" without manual inspection.
- **#5** prevents breaking-change-to-peer releases, the most common cause of downstream breakage in monorepos.
- **#6** surfaces hidden coupling that boundaries checker doesn't yet capture (external dep transitive paths).
- **#7** makes rollback from a broken publish a 30-second command instead of a multi-step npm/git dance.
- **#8, #9** are complementary: #8 catches per-package regressions, #9 catches overall registry bloat. Both use existing Vite build output.
- No L-effort items made the cut. All selected items can be prototyped in ≤1 week.

---

## PHASE ROADMAP

### Phase 1 — Quick Wins (S-effort + one foundational M)

| Item | Why Phase 1 |
|------|-------------|
| **#1** Circular Dependency Detector | Hooks into existing boundaries check; 1–2 days |
| **#2** Shared TS Version Aligner | Single-pass scanner; grep + JSON.parse; <1 day |
| **#10** README Consistency Checker | Validates against existing metadata; <1 day |
| **#3** Pre-commit Gate | Reduces daily dev friction immediately; 3–4 days |

**Phase 1 outcome:** Four scripts mergeable independently into `scripts/check.sh`. Zero new runtime deps. Each passes `scripts/check.sh ci`.

### Phase 2 — Medium Investments

| Item | Why Phase 2 |
|------|-------------|
| **#4** "What Can I Ship?" PR Gate | Requires Changesets CLI integration; 4–5 days |
| **#5** Pre-publish API Contract Test Suite | Needs snapshot generation, storage, diff gating; 5–7 days |
| **#9** Package Publish-Size Tracker | Leverages existing `check.sh pack`; needs CI artifacts; 3–4 days |

**Phase 2 outcome:** Operational guardrails for release pipeline. Prevents three most common publishing disasters.

### Phase 3 — Long-Term Plays

| Item | Why Phase 3 |
|------|-------------|
| **#7** Rollback Automation Script | Risky if wrong; needs careful CLI design + dry-run; 5–7 days |
| **#6** Monorepo Attack Surface Map | Novel analysis; needs threat-model input; 7–10 days |
| **#8** Bundle Analysis with Size Budgets | Depends on #5 contract tests infrastructure; 5–7 days |

---

## RECOMMENDED WORKLOG PROJECT: "monorepo-tooling-improvements"

Track these **3** items first (all S-effort, mechanically uniform, parallelizable):

### Task 1: Shared TypeScript Version Aligner
- **Why:** Answers "why does tsc fail but vite works?" once and for all. Every LLM coder hits this.
- **Success metric:** Zero TS version mismatches across all packages
- **Risk:** Low. Read-only analysis script.

### Task 2: Circular Dependency Detector
- **Why:** Deeply coupled to existing boundaries check. DFS cycle detection on import graph.
- **Success metric:** New circular deps produce non-zero exit code in CI
- **Risk:** Medium. Modifies security-critical enforcement boundary.

### Task 3: README Consistency Checker
- **Why:** Documentation surface must match actual package metadata. Complements tasks 1 & 2.
- **Success metric:** Outdated READMEs flagged automatically in CI
- **Risk:** Low. Read-only validation.

---

## ALL 75 IDEAS (COMPLETE LISTING)

### A. Generator Enhancements
1. Template Composer CLI Mode (P9, M) — Interactive prompts for sub-package selection
2. Incremental Package Generator (P8, L) — `pnpm moon run gen:package` scaffolds new packages
3. Migration Wizard from npm-workspace/yarn/Rush (P7, L) — Scaffold converter from legacy workspaces
4. Feature-flagged Subtemplates (P7, M) — Independently selectable template groups

### B. Developer Experience Improvements
5. Monorepo Task Orchestrator UI (P6, L) — Web dashboard for check script execution
6. `moon watch` Mode for Affected Packages (P8, M) — File watcher + transitive rebuild
7. Pre-commit Gate with Staged-Affected-Only (P9, M) — Husky integration skipping full tree
8. Interactive Package Inspector (P7, S) — `pnpm moon pkg-info <name>` health metrics

### C. Package Management & Discovery
9. Circular Dependency Detector (P9, S) — DFS cycle detection in boundaries check
10. Peer Dependency Conflict Resolver (P?, M) — Pre-publish audit of peer ranges

### D. CI/CD & Release Automation
11. Auto-changelog from PR Metadata (P7, M) — Per-package changelog generation
12. Deprecation Pipeline (P7, M) — Sunset schedule enforcement

### E. Testing & Quality Gates
13. Mutation Testing Integration (P7, M) — For critical packages
14. Contract Test Generator (P7, M) — Between microfrontend host and renderers

### F. Performance Monitoring
15. Build Time Tracker (P7, S) — CI baselines and regression alerts
16. Bundle Analysis with Size Budgets (P7, M) — Per-package max bundle sizes in CI

### G. Monorepo Governance
17. Boundary Violation Auto-Fix PRs (P8, M) — Automatic import correction
18. Package Lifecycle States (P7, S) — Active/deprecated/archived management
19. Import Count Tracking (P6, S) — Per-package dependency visibility

### H. Documentation & Knowledge
20. Auto-generated API Docs (P7, M) — JSDoc to GitHub Pages deployment

### I. Toolchain Modernization
21. Speedscope Flamegraph Integration (P6, S) — Build profiling visualization

### J. Community & Ecosystem
22. Starter Kit Catalog Page (P6, S) — On docs site

### Additional Round 2 (A1–A20)
A1. Semantic Version Collision Detector (P7, S)
A2. Monorepo Attack Surface Map (P9, M)
A3. Changelog Deduplicator (P6, S)
A4. Lockfile Drift Auditor (P8, M)
A5. Preview Deployment Orchestrator (P8, L)
A6. Circular Dependency Auto-Remediator (P8, L)
A7. Package Impact Heatmap (P7, M)
A8. Pre-release Smoke Test Runner (P7, M)
A9. Export Stability Monitor (P6, M)
A10. Contributor Recognition System (P5, S)
A11. Workspace-Level DORA Metrics Dashboard (P5, L)
A12. Shared TypeScript Version Aligner (P8, S) — **TOP 10 #2**
A13. PR Change Scope Classifier (P7, M)
A14. Dependency Age Tracker (P7, S)
A15. Custom Assertion Library Generator (P6, M)
A16. Reviewer Request Coach (P6, M)
A17. Configuration Schema Enforcer (P7, M)
A18. Semantic Dependency Grouping (P6, S)
A19. Rollback Automation Script (P9, M) — **TOP 10 #7**
A20. README Consistency Checker (P6, S) — **TOP 10 #10**

### Additional Round 3 (B1–B25)
B1. Diff-friendly changelog (P8, M)
B2. TS incremental build config optimizer (P9, L)
B3. Vite config template generator (P7, S)
B4. Package publish-size tracker (P8, M) — **TOP 10 #9**
B5. Cross-package refactoring safety net (P9, L)
B6. Automated API compatibility layer generator (P7, L)
B7. Interactive dependency tree explorer CLI (P6, M)
B8. "Monorepo health report" weekly digest (P8, S)
B9. Smart workspace protocol resolver (P7, M)
B10. Microfrontend loading performance monitor (P8, M)
B11. Pre-publish API contract test suite (P9, M) — **TOP 10 #5**
B12. Configuration migration path generator (P7, L)
B13. Test file template system (P7, S)
B14. Dependency rationalization dashboard (P8, S)
B15. "What can I ship?" PR gate (P9, M) — **TOP 10 #4**
B16. Shared utility extraction analyzer (P7, M)
B17. Browser support matrix validator (P6, S)
B18. Auto-generated code of conduct (P5, M)
B19. "Package tombstone" feature (P6, M)
B20. Real-time monorepo impact graph (P6, L)
B21. Release note auto-translator (P4, S)
B22. Import path autocomplete for editor (P9, L)
B23. "Blame-free" incident retrospective template (P7, M)
B24. Configurable CI matrix pruning (P8, M)
B25. Developer onboarding simulator (P8, M)

---

## IDEAS THAT MADE THE CUT BUT NO SEAT IN TOP 10

| Rank | Item | Reason Deferred |
|------|------|-----------------|
| #11 | Diff-friendly changelog (#B1, P8) | Overlaps with #5's contract-test philosophy — do #5 first |
| #12 | Configuration Schema Enforcer (#A17, P7) | Premature without drift data from #10's README checker |
| #13 | Smart Workspace Protocol Resolver (#B9, P7) | Narrow use case; lower adoption signal |
| #14 | Package Impact Heatmap (#A7, P7) | Visual overlay on #6's attack surface data — defer until after #6 |
| #15 | Package Tombstone (#B19, P6) | Implementation is just `lifecycle: deprecated` field + CI warning |

---

## ADDITIONAL BRAINSTORM ROUND — Security, Onboarding & Edge Cases

> Generated: 2026-09-07 | Session: targeted expansion into underexplored categories

### K. Security & Attack Surface

K1. `.npmrc` Secret Scanner (P9, S) — Pre-commit hook that scans staged files for accidentally committed tokens, API keys, or credentials matching common patterns before they enter git history. Prevents credential leaks at commit time. Improvement area: Security.

K2. License Compliance Gate (P8, M) — `scripts/check.sh license-audit` that cross-references transitive dependency licenses against an allowlist/denylist, blocking CI on GPL/SSPL violations. Targets project maintainers releasing to npm. Improvement area: Security/Governance.

K3. Transitive DevDep Attack Surface Auditor (P7, M) — Report devDependencies that leak into production bundles via unresolved exports or misconfigured `sideEffects`, and flag production deps with known CVEs in their own transitive trees. Targets maintainers shipping public packages. Improvement area: Security.

K4. GitHub Token Permission Linter (P8, S) — Static analysis of `.github/workflows/*.yml` that verifies every workflow's `permissions:` block follows least-privilege doctrine, flags missing `secrets: inherit` overrides, and warns when `NPM_TOKEN` scope exceeds read-only. Targets CI/CD maintainer. Improvement area: Security.

K5. `pnpm override` Justification Tracker (P7, S) — Require a `pnpm-workspace.yaml`-embedded justification comment for each override; CI blocks PRs that add overrides without annotated reason (overrides bypass registry security model). Targets release manager. Improvement area: Security/Governance.

K6. Subpath Export Hijack Detector (P6, M) — Verify that no two packages export the same subpath pattern with conflicting entry points — catches accidental namespace collisions that could confuse consumers bundling multiple `@cheshirecode/*` packages. Targets package maintainers adding new subpath exports. Improvement area: Security.

### M. Onboarding & Contributor Experience

M1. First-Time Contributor Interactive Walkthrough (P8, S) — A `/first-contribution` GitHub guide (auto-commented on first PR) that links to a curated "good first issue" list filtered by tag from `moon.yml`, plus a step-by-step local setup checklist with copy-paste commands. Targets external OSS contributors. Improvement area: DX/Onboarding.

M2. Local Setup Time Tracker (P7, S) — `scripts/check.sh setup-timing` that measures elapsed time for each step of `scripts/check.sh setup` (fetch, install, build, test), reports baseline, alerts if local install degrades >30% vs last run. Targets new contributors assessing project viability. Improvement area: Onboarding/DX.

M3. Contributor README Badge Ecosystem (P5, M) — Auto-generated per-package contributor badges showing active maintainers, last 30-day commit frequency, and test coverage trend — rendered in per-package READMEs. Targets potential contributors evaluating which package to work on. Improvement area: Community/Docs.

M4. Issue Template → Code Skeleton Mapper (P6, M) — When a contributor opens a PR template-linked issue (e.g., "fix lints"), auto-suggest the exact file paths and functions they need to touch based on import graph proximity to changed areas. Targets first-time contributors fixing bugs. Improvement area: Onboarding/DX.

M5. Deprecation Notice Banner CLI (P7, S) — When a deprecated package is imported locally, `pnpm moon run lint-fast` prints a terminal banner explaining the sunset schedule, migration path, and replacement package — visible during active development. Targets contributors maintaining consuming packages. Improvement area: Docs/Governance.

M6. "Try This Package" Sandbox CLI (P6, M) — `npx @cheshirecode/sandbox --help` spins up a minimal Vite/Node project pre-wired with one `@cheshirecode/*` package, running its tests against a live example — lowers barrier to evaluation. Targets external developers evaluating the library suite. Improvement area: Community/Onboarding.

M7. Local Git Hook Installer (P8, S) — One-time `pnpm moon run hooks:install` that configures `.husky/pre-commit` to run affected-only checks (`boundaries`, `lint-fast`, `readme-map`) on staged files — ships with the generator, not required. Targets new contributors who want fast feedback but skip husky setup. Improvement area: DX/Onboarding.

### N. Edge Cases / Niche

N1. Workspace Protocol Resolver Stress Tester (P5, M) — Synthetic benchmark that creates a chain of 10+ internal workspace dependencies and measures resolution/build time degradation — establishes baseline for when pnpm workspace protocol hits scaling limits. Targets repo architect planning growth past 50 packages. Improvement area: Performance.

N2. Circular Peer Dependency Silent Failure Detector (P8, M) — Pnpm silently installs circular peer dep conflicts in some cases; detect by simulating `npm pack` + `npm install` of each published package in an isolated tmpdir and verifying runtime module resolution succeeds. Targets release manager before publishing. Improvement area: Reliability.

N3. Dual License Toggle Test (P3, S) — If a package ever goes dual-license (MIT/Apache-2), verify that export maps, type declarations, and subpath patterns remain identical under both license headers — automated check on license change. Targets legal-compliance aware maintainer. Improvement area: Governance.

N4. TypeScript Compiler API Version Drift (P7, S) — Monitor that `typescript/unstable/ast` scanner usage stays compatible with declared TS version — TS minor bumps can change AST shape silently; regression test runs scanner on fixture files. Targets maintainer of boundary checker scripts. Improvement area: Reliability/Testing.

N5. Vitest Config Shallow-Clone Detection (P6, S) — Detect packages that copied vitest config inline instead of importing from `@cheshirecode/vitest-config` — unify them to reduce maintenance burden and ensure consistent threshold updates. Targets maintainer enforcing config standards. Improvement area: Toolchain/Governance.

N6. Node.js Runtime Compatibility Checker (P5, M) — Parse each package's `package.json#engines.node` range and cross-check against the oldest actively-supported LTS release (via api.github.com/repos/nodejs/node/releases); warn if package claims broader support than actually tested. Targets package maintainer setting engine constraints. Improvement area: Documentation/Reliability.

N7. Monorepo Fork-Join Build Deadlock Simulator (P4, M) — Stress test moon's parallel build executor by injecting artificial delays into independent packages and measuring whether completion tracking has race conditions — detects silent task skips. Targets CI reliability engineer. Improvement area: Reliability/CI.

N8. `pnpm dedupe` Safety Audit (P7, S) — Run `pnpm dedupe --dry-run` in CI and compare resolved tree before/after — alerts if deduplication would merge semver-incompatible versions that happen to coexist due to loose peer dep ranges. Targets maintainer optimizing lockfile. Improvement area: Governance/Performance.

N9. Generator Output Reproducibility Hash (P6, S) — Deterministic hash of generator output (create-moon-pnpm-monorepo) — same inputs always produce byte-identical output; CI diff fails on non-deterministic generators. Targets generator maintainer. Improvement area: Toolchain/Reliability.

N10. Package Name Collision Watcher (P5, S) — Pre-publish check that searches npm registry for upcoming name collisions — warns if a new `@cheshirecode/*` package name is too similar to existing published names (typosquatting risk, e.g., `async-util` vs `async-utils`). Targets package author adding new packages. Improvement area: Security/Community.

N11. Moon Task Option Desync Detector (P5, S) — Cross-check that every `options.runInCI`, `options.cacheable`, and `options.runImmediate` in per-package `moon.yml` matches the shared defaults in `.moon/tasks/node.yml` — flags drifted configs. Targets repository maintainer. Improvement area: Governance.

N12. Storybook MDX Content Validator (P4, S) — For renderer demo apps with Storybook, validate that MDX stories reference components that actually exist in the current package scope — catch broken story links. Targets demo app maintainer. Improvement area: Testing/Docs.
