# Verify

Use this skill when an agent needs to validate changes in this repository.

This skill is a thin orchestrator for repo scripts. Prefer these commands:

```sh
scripts/check.sh ci
```

Use Docker-first clean isolation when the change affects toolchain setup,
dependency installation, package scripts, workflows, or the Dockerfile:

```sh
scripts/check.sh docker
```

Use the full non-affected verification path inside clean containers or when
there is no useful git base for moon affected detection:

```sh
scripts/check.sh full
```

Use the optional sandbox wrapper only when the environment already has a local
checkout of https://github.com/cheshirecode/sandbox and `SANDBOX_ROOT` is set:

```sh
scripts/check.sh sandbox
```

For package-facing or release changes, add:

```sh
scripts/check.sh pack
```

For a single coverage job that failed in CI, reproduce the matrix entry:

```sh
scripts/check.sh coverage-package <package-dir-name>
```
