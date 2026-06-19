# moon-pnpm-monorepo-boilerplate

A fast, framework-neutral JavaScript monorepo boilerplate built on:

- **pnpm workspaces** for dependency installation and local package linking.
- **moonrepo** for task graph execution, affected runs, and local caching.
- **Changesets** for package versioning, changelogs, and npm publishing.
- **oxlint** for a fast Rust-based JavaScript/TypeScript lint guard.

The repo intentionally avoids a battery-included framework lock-in. Packages can be React, Preact, vanilla JS, Astro, Vite apps, Node/isomorphic libraries, or shared configuration.

## Quick Start

```sh
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm install
pnpm run ci
```

Requires Node.js `>=24.11.0`. GitHub Actions and the Docker verifier use
Node 24.

## Common Commands

```sh
scripts/check.sh lint-fast       # oxlint over packages and root tests
scripts/check.sh lint            # moon graph lint across packages
scripts/check.sh typecheck       # moon graph TypeScript checks
scripts/check.sh build           # moon graph build across packages
scripts/check.sh test            # moon graph tests + root smoke tests
scripts/check.sh full            # full non-affected verification path
scripts/check.sh coverage        # package coverage tasks
scripts/check.sh dogfood packages # install packed tarballs in an external consumer
scripts/check.sh dogfood all      # package dogfood + npm publish dry-run
scripts/check.sh pack            # pack publishable packages into .artifacts/release
pnpm changeset           # record a release change
pnpm run version-packages
pnpm run publish-packages
```

The matching `pnpm run ...` commands are thin aliases for the repo scripts.
Dogfood commands write a machine-readable summary to
`.artifacts/dogfood/report.json`.

## Development Flow

Use moon targets for tight loops, then move outward:

```sh
pnpm moon run pkce:test
scripts/check.sh ci
scripts/check.sh dogfood packages
scripts/check.sh docker
```

For publishing workflow changes, use the release dogfood path before handoff:

```sh
scripts/check.sh dogfood all
```

CI runs workflow lint, the normal check path, external package dogfood,
coverage, and Coveralls. The publish workflow runs package-consumption dogfood
plus `npm publish --dry-run` before Changesets is allowed to publish.

To verify the repo in a clean container, use the repo Dockerfile directly:

```sh
scripts/check.sh docker
```

The `scripts/sandbox-verify.sh` wrapper is a nicer optional path for machines
that already use [cheshirecode/sandbox](https://github.com/cheshirecode/sandbox).
It runs the same Docker build by default. Set `SANDBOX_ROOT` to a local sandbox
checkout when you explicitly want the wrapper to record a sandboxed headless
attempt first:

```sh
scripts/sandbox-verify.sh
```

Target a single package with moon:

```sh
pnpm moon run app-1:build
pnpm moon run pkce:test
pnpm moon run :lint --affected
pnpm moon ci :lint :typecheck :build :test
```

## Workspace Layout

```text
packages/
  app-1/                  React + Vite application
  browser-clipboard/      Browser/isomorphic clipboard helper
  eslint-config-react/    Shared ESLint flat config package
  measure-hook/           Small timing helper package
  pkce/                   PKCE library + Vite demo
```

Each package owns its framework-specific config. moon reads `packages/*/moon.yml` for metadata and inherits standard `lint`, `build`, `test`, `coverage`, and `typecheck` tasks from `.moon/tasks/node.yml`.

## Publishing

Published packages are versioned through Changesets. Private packages, such as `app-1`, are ignored.

1. Run `pnpm changeset` in a feature branch for user-facing package changes.
2. Run `pnpm run pack` locally or in CI to verify publishable tarballs.
3. On `main`, run the `publish` GitHub workflow with `publish_to_npm=true` and `NPM_AUTH_TOKEN` configured.

The publish workflow validates install, lint, build, test, and tarball packaging before Changesets publishes packages.

## Agent Pickup

Read `AGENTS.md` first. The short version:

- Do not use Rush; it was intentionally removed.
- Use `scripts/check.sh` for routine checks and operations; package scripts,
  skills, and workflows are thin orchestrators for those scripts.
- Use `pnpm` and `moon` underneath the scripts for normal package work.
- Use Node.js `>=24.11.0`; Node 24 is what CI and Docker verify.
- Keep package-specific framework choices local to each package.
- Validate ordinary changes with `pnpm run ci` before handoff.
- For package-facing changes, also run `scripts/check.sh dogfood packages`.
- For publishing workflow changes, run `scripts/check.sh dogfood all`.
- GitHub adds workflow lint, dirty-diff detection after lint, package dogfood,
  and package coverage/Coveralls gates.
