#!/usr/bin/env bash
# Single-confidence check before opening a PR.
# Runs the cheap, fast gates that catch the majority of CI failures locally.
# Wired to `npm run check`.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

failures=()
run() {
    local label="$1"
    shift
    echo
    echo "==> $label"
    if ! "$@"; then
        failures+=("$label")
    fi
}

run "typecheck"   pnpm run typecheck
run "test:unit"   pnpm run test:unit

if [ "${#failures[@]}" -gt 0 ]; then
    echo
    echo "FAILED: ${failures[*]}" >&2
    exit 1
fi

echo
echo "All checks passed."
