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

## Common Commands

```sh
pnpm run lint:fast       # oxlint over packages and root tests
pnpm run lint            # moon graph lint across packages
pnpm run typecheck       # moon graph TypeScript checks
pnpm run build           # moon graph build across packages
pnpm run test            # moon graph tests + root smoke tests
pnpm run coverage        # package coverage tasks
pnpm run pack            # pack publishable packages into .artifacts/release
pnpm changeset           # record a release change
pnpm run version-packages
pnpm run publish-packages
```

To verify the repo in a clean container, use the repo Dockerfile. If the sibling
`oss/sandbox` checkout is present, the wrapper first records a sandboxed
headless verification attempt. If that sandbox cannot run Docker itself, the
wrapper falls back to the same host Docker build:

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
- Use `pnpm` and `moon` for all normal work.
- Keep package-specific framework choices local to each package.
- Validate changes with `pnpm run ci` before handoff.
