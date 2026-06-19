# Release

Use this skill when an agent changes publishable package behavior, package
metadata, Changesets configuration, or release workflows.

This skill is a thin orchestrator for repo scripts:

```sh
scripts/check.sh ci
scripts/check.sh pack
scripts/check.sh dogfood all
```

For user-facing publishable package changes, create a changeset:

```sh
pnpm changeset
```

The publish workflow is still the source of truth for npm publishing. It runs
the same validation and dogfood script paths before Changesets publishes from
`main`.
