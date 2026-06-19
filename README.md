# rushmonorepo-boilerplate

[![Coverage Status](https://coveralls.io/repos/github/cheshirecode/rush-monorepo-boilerplate/badge.svg?branch=main)](https://coveralls.io/github/cheshirecode/rush-monorepo-boilerplate?branch=main)

## add package
`rush add -p <Package>` in current project

## Tooling

- `npm run lint:fast` runs `oxlint` through Rush's `install-run` wrapper for a fast Rust-based JavaScript/TypeScript guard.
- GitHub Actions also run `actionlint` against workflow files before package checks.

## Publish
1. dry-run the publish workflow from GitHub Actions; it installs, lints, builds, tests, and packs publishable tarballs without publishing to npm by default.
2. to publish from `main`, run the workflow with `publish_to_npm=true` and configure the repository secret `NPM_AUTH_TOKEN`, which is consumed by `common/config/rush/.npmrc-publish`:

```
//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}
```

3. for local publishing, generate changelog entries with `rush change`, then run `rush publish -a -p --include-all --add-commit-details -c HEAD -b main`.
