# Dogfood

Use this skill when an agent needs to verify that the monorepo packages work
from the outside, not only inside the workspace.

This skill is a thin orchestrator for repo scripts. For package-facing changes,
run:

```sh
scripts/check.sh dogfood packages
```

That command packs publishable workspaces, installs the resulting tarballs into
a temporary external consumer, and imports or requires each package entrypoint.

For release or publishing workflow changes, run the broader mode:

```sh
scripts/check.sh dogfood all
```

`all` includes the external package consumer plus `npm publish --dry-run` for
each packed tarball. It must not publish real packages.

After the command finishes, inspect `.artifacts/dogfood/report.json` for the
package list, tarball sizes, and passed gates. Set `DOGFOOD_REPORT` to write the
report somewhere else.

Set `DOGFOOD_KEEP_TEMP=1` only when debugging the generated temp consumer.

Expected end-to-end use:

```sh
scripts/check.sh ci
scripts/check.sh dogfood packages
```

For toolchain or workflow edits, finish with:

```sh
scripts/check.sh docker
```
