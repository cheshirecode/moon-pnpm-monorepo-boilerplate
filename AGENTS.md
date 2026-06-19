# AGENTS.md

Scope: this file applies to the entire repository.

## Toolchain

This repo is a moonrepo + pnpm + Changesets monorepo.

- Runtime: Node.js `>=24.11.0`; GitHub Actions and Docker use Node 24.
- Package manager: `pnpm@11.8.0` via Corepack.
- Task runner: `moon` from `@moonrepo/cli`.
- Release/versioning: Changesets.
- Fast lint: `oxlint`.

Rush was intentionally removed. Do not add `rush.json`, `common/config/rush`, `common/scripts/install-run-rush*.js`, or Rush-based workflow steps back unless explicitly asked.

## First Commands

Use the user's shell environment for Node tooling:

```sh
zsh -lc 'source ~/.zshrc >/dev/null 2>&1 || true; scripts/check.sh setup'
```

Primary local verification:

```sh
scripts/check.sh lint-fast
scripts/check.sh lint
scripts/check.sh typecheck
scripts/check.sh build
scripts/check.sh test
scripts/check.sh full
scripts/check.sh pack
```

Agent quick verification path:

1. Clean isolation baseline:

```sh
scripts/check.sh docker
```

2. Local task graph parity:

```sh
scripts/check.sh ci
```

3. Package-facing or release changes:

```sh
scripts/check.sh pack
```

GitHub adds workflow lint, `git diff --exit-code` after lint, the package
coverage matrix, and Coveralls contexts.

Optional sandbox convenience:

```sh
scripts/check.sh sandbox
```

The wrapper runs the same Docker build by default. Set `SANDBOX_ROOT` to a local
[cheshirecode/sandbox](https://github.com/cheshirecode/sandbox) checkout when
you explicitly want it to record a sandboxed headless verification attempt
first; if Docker is unavailable inside that sandbox, it falls back to the host
Docker build.

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
pnpm moon run app-1:build
pnpm moon run pkce:test
pnpm moon run :lint --affected
pnpm moon ci :lint :typecheck :build :test
```

## Release Rules

- For package-facing changes, add a changeset with `pnpm changeset`.
- `app-1` is private and ignored by Changesets.
- `pnpm run pack` must succeed before release handoff.
- The GitHub `publish` workflow creates/updates the Changesets release PR and publishes only from `main`.

## Editing Rules

- Prefer small package-local changes.
- Do not move shared tooling into a package unless the package is the only consumer.
- Do not introduce new framework assumptions at the root; the root stays framework-neutral.
- Keep root package scripts as thin wrappers over `scripts/check.sh`.
- If changing `.moon/tasks/node.yml`, verify at least one package target and one all-packages target.

## Common Failure Modes

- If a package cannot resolve a local dependency, check `pnpm-workspace.yaml` and `workspace:^` ranges first.
- If moon does not see a project, run `pnpm moon projects` and check `packages/<name>/moon.yml`.
- If a CI task is skipped unexpectedly, check `options.runInCI` in `.moon/tasks/node.yml`.
- If GitHub coverage fails while local package coverage passes, verify
  package `coverage/lcov.info` paths and moon build `outputs` for local
  dependencies.
- If publishing includes the wrong package, check `private: true` and `.changeset/config.json`.
