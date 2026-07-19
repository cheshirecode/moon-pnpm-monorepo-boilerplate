# AGENTS.md

Scope: this file applies to the entire repository.

## Toolchain

This repo is a moonrepo + pnpm + Changesets monorepo.

- Runtime: Node.js `>=24.11.0`; GitHub Actions and Docker use Node 24.
- Package manager: `pnpm@11.10.0` via Corepack.
- Task runner: `moon` from `@moonrepo/cli`.
- Release/versioning: Changesets.
- Fast lint: `oxlint`.

Rush was intentionally removed. Do not add `rush.json`, `common/config/rush`, `common/scripts/install-run-rush*.js`, or Rush-based workflow steps back unless explicitly asked.

## Verification

Use the user's shell environment for the one-time setup:

```sh
zsh -lc 'source ~/.zshrc >/dev/null 2>&1 || true; scripts/check.sh setup'
```

Choose additional checks by change type:

| Change type | Run |
| --- | --- |
| Focused lint or package task validation | `scripts/check.sh lint-fast`, `scripts/check.sh lint`, `scripts/check.sh typecheck`, `scripts/check.sh build`, `scripts/check.sh test` |
| Routine repository handoff | Step 2 in the agent flow below |
| Static checks (lint-fast + package-drift + boundaries + readme-map + generator-drift) | `scripts/check.sh static-checks` |
| Package topology or metadata | `scripts/check.sh package-drift` |
| Workspace import boundaries | `scripts/check.sh boundaries` |
| Generator source/CLI drift | `scripts/check.sh generator-drift` |
| Dev server (Vite SSR middleware) | `scripts/check.sh dev <package>` |
| README workspace map | `scripts/check.sh readme-map` (add `--write` to fix drift) |
| Renderer app or host shell | `scripts/check.sh renderer-showcase` |
| Package-facing | `scripts/check.sh pack`, `scripts/check.sh dogfood packages` |
| Release or publishing | `scripts/check.sh dogfood all`, `scripts/check.sh publish-check`, `scripts/check.sh changeset-check` |
| GitHub workflow | `scripts/check.sh workflow-lint` |
| Coverage matrix or one package | `scripts/check.sh coverage-packages`, `scripts/check.sh coverage-package <package>` |
| Exhaustive local verification | `scripts/check.sh full` |
| Toolchain, Dockerfile, install, or workflow isolation | `scripts/check.sh docker` |
| Optional sandboxed Docker attempt | `scripts/check.sh sandbox` |

Agent flow:

1. Iterate with the narrowest Moon target, for example `pnpm moon run pkce:test`.
2. Run `scripts/check.sh ci` before handoff.
3. Broaden verification with every matrix row matching the changed surface.

After dogfood runs, inspect `.artifacts/dogfood/report.json` for the package
list, tarball sizes, and which dogfood gates passed. The sandbox wrapper runs
the same Docker build by default. Set `SANDBOX_ROOT` to a local
[cheshirecode/sandbox](https://github.com/cheshirecode/sandbox) checkout to
record a sandboxed headless verification attempt first; if Docker is
unavailable there, it falls back to the host Docker build.

GitHub also checks `git diff --exit-code` after lint and Coveralls contexts.
`pnpm run ci` and the other root package scripts are thin aliases over
`scripts/check.sh` for compatibility.

## Script, Skill, Instruction Layers

- Scripts own behavior. Add or change routine checks and operations in
  `scripts/check.sh` or a focused helper under `scripts/`.
- Skills should be thin orchestrators: read context, choose one script command
  or a small sequence of script commands, and report results. Do not duplicate
  long shell command graphs in skills.
- Instructions should tie the layers together: explain which script to use,
  when to broaden verification, and which files hold the source of truth.

Repo-local skills live under `skills/*/SKILL.md` and intentionally route back
to `scripts/check.sh`.

## Project Model

- Workspaces are declared in `pnpm-workspace.yaml`.
- moon projects are discovered from `packages/*`.
- Package metadata lives in `packages/*/moon.yml`.
- Shared task definitions live in `.moon/tasks/node.yml`.
- Keep framework-specific setup inside the package that uses it.

Use moon targets for package-specific work:

```sh
pnpm moon run app-react:build
pnpm moon run pkce:test
pnpm moon run :lint --affected
pnpm moon ci :lint :typecheck :build :test
```

## Release Rules

- For package-facing changes, add a changeset with `pnpm changeset`.
- Renderer demo apps such as `app-react`, `app-preact`, `app-astro`,
  `app-vue`, `app-svelte`, `app-solidjs`, and `renderer-showcase` are private
  and ignored by Changesets.
- `renderer-showcase` embeds the renderer demo apps as microfrontends. Its
  registry must include exactly `app-react`, `app-preact`, `app-astro`,
  `app-vue`, `app-svelte`, and `app-solidjs`; do not use a raw `app-*` glob
  because non-renderer packages can still share the `app-*` prefix.
- Keep reusable host-shell logic in `@cheshirecode/microfrontend-host`; keep
  framework-specific mount adapters package-local.
- Put generic string, form, filtering, and URL helpers in
  `@cheshirecode/browser-utils`. Keep sanitizer-backed validation in
  `@cheshirecode/input-validation`.
- The package-facing verification matrix row must succeed before handoff.
- For publishing workflow changes, the release or publishing matrix row must
  succeed; its dry run must not publish real packages.
- The GitHub `release-pr` workflow creates/updates the Changesets release PR on push to `main`; it never receives `NPM_TOKEN` or publishes packages.
- The GitHub `publish` workflow publishes packages to npm only from `main` when `publish_to_npm` is enabled; it refuses to publish if pending changesets remain.

## Editing Rules

- Prefer small package-local changes.
- Do not move shared tooling into a package unless the package is the only consumer.
- Do not introduce new framework assumptions at the root; the root stays framework-neutral.
- Keep root package scripts as thin wrappers over `scripts/check.sh`.
- If changing `.moon/tasks/node.yml`, verify at least one package target and one all-packages target.
- Before `git reset`, `git clean`, `git checkout --`, or `git restore`, inspect `git status`; never run them on a dirty tree unless explicitly authorized and the changes are secured.

## Package Import Boundaries

`scripts/check.sh boundaries` enforces: declared internal imports, subpath exports, export target existence (types + import), main/module/types/browser field existence, no cross-package relative imports, no sibling-package config aliases (tsconfig parsed structurally via JSON.parse with comment stripping; Vite config string literals extracted via TypeScript scanner), library→application rejection, and application→application rejection except `renderer-showcase`→six renderer apps. Import parsing uses the TypeScript compiler scanner via the public `typescript/unstable/ast` API; Vue/Svelte/Astro script blocks are extracted first. Moon's native layer enforcement rejects app→app deps; `renderer-showcase` uses `stack: "backend"` as a metadata workaround to allow its cross-stack app→app deps. The custom checker provides the stricter policy (only renderer-showcase→six renderer apps, not arbitrary app→app).

## Common Failure Modes

- If a package cannot resolve a local dependency, check `pnpm-workspace.yaml` and `workspace:^` ranges first.
- If moon does not see a project, run `pnpm moon projects` and check `packages/<name>/moon.yml`.
- If a CI task is skipped unexpectedly, check `options.runInCI` in `.moon/tasks/node.yml`.
- If GitHub coverage fails while local package coverage passes, verify
  package `coverage/lcov.info` paths and moon build `outputs` for local
  dependencies.
- If publishing includes the wrong package, check `private: true` and `.changeset/config.json`.
