#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/check.sh <command> [args]

Commands:
  setup                 Install dependencies with the pinned pnpm version.
  lint-fast             Run the fast Rust-based lint guard.
  lint                  Run package lint targets through moon.
  typecheck             Run package type checks through moon.
  build                 Run package builds through moon.
  test                  Run package tests through moon and root smoke tests.
  ci                    Run the local CI parity path.
  full                  Run the full non-affected package verification path.
  coverage              Run all package coverage targets through moon.
  coverage-package NAME Build workspace packages, then run coverage for one package.
  pack                  Pack publishable packages into .artifacts/release.
  workflow-lint         Lint GitHub Actions workflows with actionlint in Docker.
  docker                Build the repo verification Docker image.
  sandbox               Run the optional sandbox/Docker verification wrapper.

The script is the repo-owned operations layer. Package scripts, agent skills,
and instructions should call this instead of duplicating command graphs.
EOF
}

run() {
  (cd "$repo_root" && "$@")
}

command="${1:-}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command" in
  setup)
    run corepack enable
    run corepack prepare pnpm@11.8.0 --activate
    run pnpm install --frozen-lockfile
    ;;
  lint-fast)
    run pnpm exec oxlint packages tests \
      --ignore-path .gitignore \
      --ignore-pattern '**/node_modules/**' \
      --ignore-pattern 'packages/eslint-config-react/fails/**' \
      --quiet
    ;;
  lint)
    run pnpm exec moon run :lint
    ;;
  typecheck)
    run pnpm exec moon run :typecheck
    ;;
  build)
    run pnpm exec moon run :build
    ;;
  test)
    run pnpm exec moon run :test
    run pnpm exec vitest run
    ;;
  ci)
    "$repo_root/scripts/check.sh" lint-fast
    run pnpm exec moon ci :lint :typecheck :build :test
    run pnpm exec vitest run
    ;;
  full)
    "$repo_root/scripts/check.sh" lint-fast
    run pnpm -r --if-present lint
    run pnpm -r --if-present typecheck
    run pnpm -r --if-present build
    run pnpm -r --if-present test
    run pnpm exec vitest run
    "$repo_root/scripts/check.sh" pack
    ;;
  coverage)
    run pnpm exec moon run :coverage
    ;;
  coverage-package)
    package="${1:-}"
    if [[ -z "$package" ]]; then
      echo "coverage-package requires a package directory name." >&2
      exit 2
    fi
    if [[ ! -d "$repo_root/packages/$package" ]]; then
      echo "Unknown package: $package" >&2
      exit 2
    fi
    run pnpm -r --if-present build
    run pnpm --filter "./packages/$package" run coverage
    ;;
  pack)
    run node scripts/pack-publishable.mjs
    ;;
  workflow-lint)
    run docker run --rm -v "$repo_root:/repo" -w /repo rhysd/actionlint:1.7.7
    ;;
  docker)
    image_tag="${SANDBOX_VERIFY_IMAGE:-moon-pnpm-monorepo-boilerplate:verify}"
    run docker build --progress=plain -t "$image_tag" .
    ;;
  sandbox)
    run scripts/sandbox-verify.sh
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    echo "Unknown command: $command" >&2
    usage >&2
    exit 2
    ;;
esac
