# Handover — Post-session July 2026

## Current state
- Repository: `/Users/fredtran/Documents/oss/rush-monorepo-boilerplate` (moonrepo + pnpm + Changesets)
- Toolchain: Node >=24.11.0 (via nvm: `$HOME/.nvm/versions/node/v24.18.0/bin`), pnpm 11.10.0, moon 2.4.2
- Branch: `main` — all PRs from this session are merged

## What shipped (14 PRs)
| PR | What |
|---|---|
| 45–55 | Showcase UX: nav strip, card animations, keyboard nav, lazy loading, theme toggle, mount error handling, loading indicators, Astro styling, focus-visible, README docs |
| 56 | Moon task optimization (cache + affected-only) |
| 57 | Dependency audit check + CVE suppression |
| 58 | Package hygiene: tsconfig moon.yml, exports fields, private: false |
| 59 | smoke-site.mjs --local flag, CSS fix, eslint-config-react type fix |
| 60 | High-severity fixes: pkce exports, CJS/ESM exports, .gitignore, netlify.toml |
| 61 | CI improvements: lint-audit wired, boundaries dedup, dogfood scope reduction |
| 62 | --accent CSS variable, coverage thresholds +10% |
| 63 | .prettierrc.js export fix, stray file cleanup, test fix |
| 64 | pnpm.auditConfig moved to .npmrc (CI warning fix) |

## Open items (from council analysis)
- **ESLint vs oxlint**: oxlint is the sole linter; ESLint config exists only for the eslint-config-react test suite. Documented as by-design.
- **app-react tsconfig**: Uses `moduleResolution: "bundler"` instead of `"NodeNext"` from shared base. Intentional — Vite bundler requirement.
- **TypeScript version split**: ^6.0.3 in astro/svelte/vue packages for framework toolchain compat; ^7.0.2 everywhere else. pnpm handles version conflicts correctly.
- **manifest fallback silent**: When Vite manifest can't be resolved, build-site.mjs falls back silently. Low-risk. 
- **Docker doesn't run deployment assembly**: The Dockerfile runs `scripts/check.sh full` but not the Netlify build assembly.

## Loop-engineering skill
Available at `~/Documents/oss/dotfiles/skills/loop-engineering/SKILL.md`. Use for bounded, evidence-driven iteration loops. Key pattern: `init -> cycle (observe -> act -> check -> advance/finish)`. Supports budget tracking, evidence gates, and worklog-backed handoff.

## MCP servers
- `sequential-thinking` was failing with `pnpm dlx` (zod resolution issue). Fixed: changed to `npx -y @modelcontextprotocol/server-sequential-thinking` in opencode.jsonc.
- All MCP servers (context7, playwright, serena, sequential-thinking) use `npx -y` now for reliable resolution.

## Notes for next session
1. Use `export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"` before any pnpm/moon commands — system default is Node 22.
2. The bash tool seems unreliable with JSON wrapping (`{"command": "..."}`). Workaround: use bare command format with `"command": "..."` and avoid `\"` inside the value. Use single quotes in shell commands instead of double quotes where possible.
3. Moon cache: `.moon/cache/` stores task outputs. Clear with `rm -rf .moon/cache/` when debugging stale cache issues.
4. The `package-lock.json` was deleted (stale Rush artifact). The `.rush/` directory is now in `.gitignore`.
5. `.npmrc` contains the audit CVE ignore list since pnpm v11 no longer reads the `pnpm` key from package.json.
6. Test: `renderer-showcase/src/main.test.ts` checks entry titles but not deep demo-contract slugs (Svelte dynamic import doesn't resolve in vitest test environment).
7. CI runs `scripts/check.sh full` in a single consolidated job (6-job pipeline: workflow-lint → ci, coverage-packages, changeset-check → coverage → finish).