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
  boundaries [--metadata-only|--artifacts-only]
                         Check workspace import boundaries (declared deps, layer rules, subpaths).
  ts-version-aligner    Verify all packages use the same TypeScript version in devDependencies.
  readme-map            Check that README workspace map matches package inventory (use --write to fix).
  static-checks         Run lint-fast, package-drift, boundaries, readme-map, and ts-version-aligner.
  generator-drift       Verify source API and built CLI produce identical repo output.
  lint                  Run package lint targets through moon.
  typecheck             Run package type checks through moon.
  build                 Run package builds through moon.
  test                  Run package tests through moon and root smoke tests.
  dev <package>         Start dev server for a package (Vite SSR middleware mode).
  ci                    Run the local CI parity path.
  full                  Run the full non-affected package, renderer, publish, and dogfood path.
  dogfood [MODE] [--skip-build]
                        Dogfood packed packages in an external consumer.
  coverage              Run all package coverage targets through moon.
  coverage-packages     List package directories that define coverage scripts.
  coverage-package NAME [--skip-build]
                        Run coverage for one package through moon. With --skip-build, assume dist artifacts are already restored.
  renderer-showcase [--skip-build]
                        Build and smoke-check the renderer microfrontend showcase. With --skip-build, verify dist only.
  pack                  Pack publishable packages into .artifacts/release.
  publish-check [--skip-build]
                        Pack and validate publishable tarballs (README, LICENSE, exports).
  changeset-check       Verify changeset presence when publishable packages change.
  workflow-lint         Lint GitHub Actions workflows with actionlint in Docker.
  lint-audit            Run pnpm audit for known vulnerabilities (high severity and above).
  docker                Build the repo verification Docker image.
  sandbox               Run the optional sandbox/Docker verification wrapper.
  doctor                Check toolchain health and print exact remediation for mismatches.

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
  boundaries)
    run node scripts/check-boundaries.mjs "$@"
    ;;
  ts-version-aligner)
    run node scripts/check-ts-version.mjs
    ;;
  readme-map)
    run node scripts/readme-map.mjs "$@"
    ;;
  static-checks)
    "$repo_root/scripts/check.sh" lint-fast
    "$repo_root/scripts/check.sh" package-drift
    "$repo_root/scripts/check.sh" boundaries --metadata-only
    "$repo_root/scripts/check.sh" readme-map
    "$repo_root/scripts/check.sh" ts-version-aligner
    "$repo_root/scripts/check.sh" generator-drift
    ;;
  generator-drift)
    run node scripts/generator-drift.mjs
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
    "$repo_root/scripts/check.sh" boundaries --artifacts-only
    ;;
  test)
    if has_git_head; then
      run pnpm exec moon run :test
    else
      run pnpm -r --if-present test
    fi
    run pnpm exec vitest run
    ;;
  dev)
    package="${1:-}"
    if [[ -z "$package" ]]; then
      echo "dev requires a package directory name (e.g., app-react)." >&2
      exit 2
    fi
    if [[ ! -d "$repo_root/packages/$package" ]]; then
      echo "Unknown package: $package" >&2
      exit 2
    fi
    if has_git_head; then
      run pnpm exec moon run "$package:dev"
    else
      run pnpm --dir "packages/$package" dev
    fi
    ;;
  ci)
    "$repo_root/scripts/check.sh" static-checks
    if has_git_head; then
      affected="$(pnpm exec moon query affected)"
      if [[ "$affected" == "{}" ]]; then
        echo "No Moon projects affected; running all package tasks for artifact checks."
        run pnpm exec moon run :lint :typecheck :build :test
      else
        run pnpm exec moon ci :lint :typecheck :build :test
      fi
    else
      run pnpm exec moon run :lint :typecheck :build :test
    fi
    run pnpm exec vitest run
    "$repo_root/scripts/check.sh" lint-audit
    ;;
  full)
    "$repo_root/scripts/check.sh" static-checks
    if has_git_head; then
      run pnpm exec moon run :lint :typecheck :build :test
      run pnpm exec vitest run
    else
      "$repo_root/scripts/check.sh" lint
      "$repo_root/scripts/check.sh" typecheck
      "$repo_root/scripts/check.sh" build
      "$repo_root/scripts/check.sh" test
    fi
    "$repo_root/scripts/check.sh" lint-audit
    "$repo_root/scripts/check.sh" renderer-showcase --skip-build
    "$repo_root/scripts/check.sh" publish-check --skip-build
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
    skip_build=false
    for arg in "$@"; do
      if [[ "$arg" == "--skip-build" ]]; then skip_build=true; fi
    done
    if [[ -z "$package" ]]; then
      echo "coverage-package requires a package directory name." >&2
      exit 2
    fi
    if [[ ! -d "$repo_root/packages/$package" ]]; then
      echo "Unknown package: $package" >&2
      exit 2
    fi
    if [[ "$skip_build" == false ]]; then
      run pnpm exec moon run "$package:build"
    fi
    run pnpm exec moon run "$package:coverage"
    ;;
  renderer-showcase)
    skip_build=false
    for arg in "$@"; do
      if [[ "$arg" == "--skip-build" ]]; then skip_build=true; fi
    done
    if [[ "$skip_build" == false ]]; then
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
    fi
    run node scripts/verify-renderer-showcase.mjs --dist
    ;;
  pack)
    run node scripts/pack-publishable.mjs
    ;;
  publish-check)
    run node scripts/check-publishable.mjs "$@"
    ;;
  changeset-check)
    run node scripts/check-changeset.mjs
    ;;
  workflow-lint)
    run docker run --rm -v "$repo_root:/repo" -w /repo rhysd/actionlint:1.7.7
    ;;
  lint-audit)
    run pnpm audit --audit-level=high
    ;;
  docker)
    image_tag="${SANDBOX_VERIFY_IMAGE:-moon-pnpm-monorepo-boilerplate:verify}"
    run docker build --progress=plain -t "$image_tag" .
    ;;
  sandbox)
    run scripts/sandbox-verify.sh
    ;;
  doctor)
    errors=0
    checks_passed=0
    required_node="$(grep 'Node.js' "$repo_root/AGENTS.md" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)"
    if [[ -z "$required_node" ]]; then
      required_node="24.11.0"
    fi
    echo "=== Bootstrap Doctor ==="
    echo ""

    echo "--- Node.js ---"
    current_node="$(node --version 2>/dev/null || echo "not installed")"
    if [[ "$current_node" == "not installed" ]]; then
      echo "FAIL: Node.js is not installed."
      echo "REMEDIATION: Install Node.js >=${required_node} via fnm (recommended):"
      echo "  curl -fsSL https://fnm.vercel.app/install | bash"
      echo "  source ~/.bashrc (or ~/.zshrc)"
      echo "  fnm install ${required_node%.*}"
      echo ""
      errors=$((errors + 1))
    else
      node_version_pass=false
      if node -e 'const current = process.versions.node.split(".").map(Number); const req = ("'"$required_node"'").split(".").map(Number); for (let i = 0; i < 3; i++) { if (current[i] > req[i]) process.exit(0); if (current[i] < req[i]) process.exit(1); }' 2>/dev/null; then
        node_version_pass=true
      fi
      if [[ "$node_version_pass" == true ]]; then
        echo "PASS: Node.js $current_node >= $required_node"
        checks_passed=$((checks_passed + 1))
      else
        echo "FAIL: Node.js $current_node detected; required >= $required_node."
        echo "REMEDIATION: Install via your preferred version manager:"
        if command -v fnm &>/dev/null; then
          echo "  fnm install ${required_node%.*}"
          echo "  fnm use ${required_node%.*}"
        elif command -v nvm &>/dev/null; then
          echo "  nvm install $required_node"
        elif command -v volta &>/dev/null; then
          echo "  volta install node@$required_node"
        else
          echo "  Install a version manager first (e.g., fnm, nvm), then install $required_node"
        fi
        errors=$((errors + 1))
      fi
    fi
    echo ""

    echo "--- Corepack / pnpm ---"
    corepack_version="$(corepack --version 2>/dev/null || echo "not found")"
    if [[ "$corepack_version" == "not found" ]]; then
      echo "FAIL: Corepack is not available."
      echo "REMEDIATION: Enable corepack (bundled with Node.js >=16.13):"
      echo "  corepack enable"
      errors=$((errors + 1))
    else
      echo "OK: Corepack $corepack_version"
      checks_passed=$((checks_passed + 1))
    fi

    required_pnpm="$(grep 'pnpm@' "$repo_root/AGENTS.md" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)"
    if [[ -z "$required_pnpm" ]]; then
      required_pnpm="11.10.0"
    fi

    pnpm_version="$(run corepack pnpm --version 2>/dev/null || echo "failed")"
    if [[ "$pnpm_version" == "failed" ]] || [[ "$pnpm_version" != "$required_pnpm" ]]; then
      echo "FAIL: pnpm $pnpm_version detected; required $required_pnpm."
      echo "REMEDIATION: Ensure corepack manages pnpm:"
      echo "  corepack enable"
      echo "  corepack prepare pnpm@$required_pnpm --activate"
      errors=$((errors + 1))
    else
      echo "PASS: pnpm $pnpm_version"
      checks_passed=$((checks_passed + 1))
    fi
    echo ""

    echo "--- Git Identity ---"
    git_user="$(git config user.name 2>/dev/null || echo "")"
    git_email="$(git config user.email 2>/dev/null || echo "")"
    if [[ -z "$git_user" ]] || [[ -z "$git_email" ]]; then
      echo "FAIL: Git identity not configured."
      echo "REMEDIATION: Set your git identity for proper commit attribution:"
      printf "  git config --global user.name \"Your Name\"\n"
      printf "  git config --global user.email \"your.email@example.com\"\n"
      errors=$((errors + 1))
    else
      echo "PASS: Git identity ($git_user <$git_email>)"
      checks_passed=$((checks_passed + 1))
    fi
    echo ""

    echo "--- Moon CLI ---"
    moon_version="$(run pnpm exec moon --version 2>/dev/null || echo "failed")"
    if [[ "$moon_version" == "failed" ]]; then
      echo "FAIL: @moonrepo/cli is not available or failed to execute."
      echo "REMEDIATION: Ensure dependencies are installed and moon is in workspace:"
      echo "  scripts/check.sh setup"
      echo "  pnpm exec moon --version"
      errors=$((errors + 1))
    else
      echo "PASS: Moon CLI $moon_version"
      checks_passed=$((checks_passed + 1))
    fi
    echo ""

    echo "=== Summary: $checks_passed passed, $errors failures ==="
    if [[ "$errors" -gt 0 ]]; then
      exit 1
    else
      echo "All toolchain checks passed."
      exit 0
    fi
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
