# @cheshirecode/create-moon-pnpm-monorepo

Create a clean moon + pnpm + Changesets monorepo using this boilerplate's script-first tooling.

```sh
pnpm dlx @cheshirecode/create-moon-pnpm-monorepo my-monorepo
cd my-monorepo
scripts/check.sh setup
scripts/check.sh ci
scripts/check.sh dogfood all
```

The generated repo starts with one `example-lib` package so linting, testing,
building, packing, package dogfood, publish dry-runs, and GitHub workflows have
a real package to validate. Replace it with your own packages when ready.

## Consumers

This is the primary product of the boilerplate. Used by developers scaffolding new monorepos from this template.
