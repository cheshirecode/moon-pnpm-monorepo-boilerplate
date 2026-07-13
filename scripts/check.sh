#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<'EOF'
Usage: scripts/check.sh <command> [args]

Commands:
  setup                 Install dependencies with the pinned pnpm version.
  lint-fast             Run the fast Rust-based lint guard.
  package-drift         Check package metadata, dependency, coverage, and dogfood drift.
  lint                  Run package lint targets through moon.
  typecheck             Run package type checks through moon.
  build                 Run package builds through moon.
  test                  Run package tests through moon and root smoke tests.
  ci                    Run the local CI parity path.
  full                  Run the full non-affected package and dogfood path.
  dogfood [MODE] [--skip-build]
                        Dogfood packed packages in an external consumer.
  coverage              Run all package coverage targets through moon.
  coverage-packages     List package directories that define coverage scripts.
  coverage-package NAME Run coverage for one package through moon.
  renderer-showcase     Build and smoke-check the renderer microfrontend showcase.
  pack                  Pack publishable packages into .artifacts/release.
  publish-check         Pack and validate publishable tarballs (README, LICENSE, exports).
  changeset-check       Verify changeset presence when publishable packages change.
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

has_git_head() {
  run git rev-parse --verify HEAD >/dev/null 2>&1
}

require_toolchain() {
  local node_version pnpm_version
  node_version="$(node -p 'process.versions.node')"
  if ! node -e 'const current = process.versions.node.split(".").map(Number); const minimum = [24, 11, 0]; for (let i = 0; i < minimum.length; i += 1) { if (current[i] > minimum[i]) process.exit(0); if (current[i] < minimum[i]) process.exit(1); }'; then
    echo "Node.js >=24.11.0 is required; found $node_version." >&2
    exit 1
  fi

  pnpm_version="$(run corepack pnpm --version)"
  if [[ "$pnpm_version" != "11.10.0" ]]; then
    echo "pnpm 11.10.0 is required; found $pnpm_version." >&2
    exit 1
  fi
}

command="${1:-}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command" in
  -h|--help|help|"") ;;
  *) require_toolchain ;;
esac

case "$command" in
  setup)
    run corepack enable
    run pnpm install --frozen-lockfile
    ;;
  lint-fast)
    run pnpm exec oxlint packages tests \
      --config .oxlintrc.json \
      --ignore-path .gitignore \
      --ignore-pattern '**/node_modules/**' \
      --ignore-pattern 'packages/eslint-config-react/fails/**' \
      --quiet
    ;;
  package-drift)
    run node scripts/package-drift.mjs
    ;;
  lint)
    if has_git_head; then
      run pnpm exec moon run :lint
    else
      run pnpm -r --if-present lint
    fi
    ;;
  typecheck)
    if has_git_head; then
      run pnpm exec moon run :typecheck
    else
      run pnpm -r --if-present typecheck
    fi
    ;;
  build)
    if has_git_head; then
      run pnpm exec moon run :build
    else
      run pnpm -r --if-present build
    fi
    ;;
  test)
    if has_git_head; then
      run pnpm exec moon run :test
    else
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  ci)
    "$repo_root/scripts/check.sh" lint-fast
    "$repo_root/scripts/check.sh" package-drift
    "$repo_root/scripts/check.sh" renderer-showcase
    if has_git_head; then
      run pnpm exec moon ci :lint :typecheck :build :test
    else
      run pnpm -r --if-present lint
      run pnpm -r --if-present typecheck
      run pnpm -r --if-present build
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  full)
    "$repo_root/scripts/check.sh" lint-fast
    "$repo_root/scripts/check.sh" package-drift
    "$repo_root/scripts/check.sh" renderer-showcase
    run pnpm -r --if-present lint
    run pnpm -r --if-present typecheck
    run pnpm -r --if-present build
    run pnpm -r --if-present test
    run pnpm exec vitest run
    "$repo_root/scripts/check.sh" dogfood packages --skip-build
    ;;
  dogfood)
    mode="${1:-packages}"
    if [[ $# -gt 0 ]]; then
      shift
    fi
    run node scripts/dogfood.mjs "$mode" "$@"
    ;;
  coverage)
    run pnpm exec moon run :coverage
    ;;
  coverage-packages)
    run node scripts/list-coverage-packages.mjs "${1:-json}" "${@:2}"
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
    run pnpm exec moon run "$package:coverage"
    ;;
  renderer-showcase)
    if has_git_head; then
      run pnpm exec moon run app-react:build app-preact:build app-astro:build app-vue:build app-svelte:build app-solidjs:build renderer-showcase:build
    else
      for package in \
        microfrontend-host \
        browser-utils \
        demo-contract \
        browser-clipboard \
        app-react \
        app-preact \
        app-astro \
        app-vue \
        app-svelte \
        app-solidjs \
        renderer-showcase
      do
        run pnpm --dir "packages/$package" build
      done
    fi
    run node scripts/verify-renderer-showcase.mjs --dist
    ;;
  pack)
    run node scripts/pack-publishable.mjs
    ;;
  publish-check)
    run node scripts/check-publishable.mjs
    ;;
  changeset-check)
    run node scripts/check-changeset.mjs
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
