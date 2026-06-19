# AGENTS.md

Scope: this file applies to the entire repository.

## Toolchain

This repo is a moonrepo + pnpm + Changesets monorepo.

- Package manager: `pnpm@11.8.0` via Corepack.
- Task runner: `moon` from `@moonrepo/cli`.
- Release/versioning: Changesets.
- Fast lint: `oxlint`.

Rush was intentionally removed. Do not add `rush.json`, `common/config/rush`, `common/scripts/install-run-rush*.js`, or Rush-based workflow steps back unless explicitly asked.

## First Commands

Use the user's shell environment for Node tooling:

```sh
zsh -lc 'source ~/.zshrc >/dev/null 2>&1 || true; corepack enable; corepack prepare pnpm@11.8.0 --activate; pnpm install'
```

Primary verification:

```sh
pnpm run lint:fast
pnpm moon run :lint
pnpm moon run :typecheck
pnpm moon run :build
pnpm moon run :test
pnpm exec vitest run
pnpm run pack
```

Isolation verification:

```sh
scripts/sandbox-verify.sh
```

This uses the sibling `oss/sandbox` wrapper when it exists. If that sandbox
cannot run Docker itself, the script records the sandbox attempt and falls back
to `docker build` against the repo `Dockerfile` directly.

`pnpm run ci` runs the normal combined path.

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
- Keep root scripts as thin wrappers over `pnpm`, `moon`, and Changesets.
- If changing `.moon/tasks/node.yml`, verify at least one package target and one all-packages target.

## Common Failure Modes

- If a package cannot resolve a local dependency, check `pnpm-workspace.yaml` and `workspace:^` ranges first.
- If moon does not see a project, run `pnpm moon projects` and check `packages/<name>/moon.yml`.
- If a CI task is skipped unexpectedly, check `options.runInCI` in `.moon/tasks/node.yml`.
- If publishing includes the wrong package, check `private: true` and `.changeset/config.json`.
