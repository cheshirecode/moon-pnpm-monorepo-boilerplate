#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
sandbox_root="${SANDBOX_ROOT:-}"
image_tag="${SANDBOX_VERIFY_IMAGE:-moon-pnpm-monorepo-boilerplate:verify}"
repo_name="$(basename "$repo_root")"

usage() {
  cat <<'EOF'
Usage: scripts/sandbox-verify.sh

Docker is the default clean-isolation verifier:
  docker build --progress=plain -t moon-pnpm-monorepo-boilerplate:verify .

Set SANDBOX_ROOT to a local checkout of https://github.com/cheshirecode/sandbox
to record a sandboxed headless verification attempt first. If Docker is
unavailable inside that sandbox, this script falls back to the host Docker build.

Environment:
  SANDBOX_ROOT          Optional path to a local cheshirecode/sandbox checkout.
  SANDBOX_VERIFY_IMAGE  Docker image tag to build.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

run_build() {
  docker build \
    --progress=plain \
    -t "$image_tag" \
    "$repo_root"
}

run_sandbox_build() {
  local login=""
  local sandbox_env=()

  if command -v gh >/dev/null 2>&1; then
    login="$(gh api user --jq .login 2>/dev/null || true)"
  fi

  if [[ -n "$login" ]]; then
    sandbox_env=(env "WORKLOG_LDAP=$login")
  fi

  "${sandbox_env[@]}" "$sandbox_root/bin/sandbox.sh" up --no-attach

  set +e
  "${sandbox_env[@]}" "$sandbox_root/bin/sandbox.sh" run-headless bash -lc \
    "command -v docker >/dev/null 2>&1 || exit 127; cd '/workspace/oss/$repo_name' && docker build --progress=plain -t '$image_tag' ."
  local rc=$?
  set -e

  if [[ $rc -eq 127 ]]; then
    echo "sandbox verifier: Docker is unavailable inside sandbox; falling back to host Docker." >&2
    run_build
    return
  fi

  return "$rc"
}

if [[ -n "$sandbox_root" && -x "$sandbox_root/bin/sandbox.sh" ]]; then
  run_sandbox_build
else
  run_build
fi
