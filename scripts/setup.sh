#!/usr/bin/env bash
# Cross-platform setup entrypoint.
# Delegates to scripts/setup-local.sh (POSIX) or scripts/setup-local.ps1 (Windows).
# Wired to `npm run setup` so contributors get one command on every OS.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

case "$(uname -s 2>/dev/null || echo unknown)" in
    Linux*|Darwin*|*BSD*)
        exec bash "$SCRIPT_DIR/setup-local.sh" "$@"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        # Git Bash on Windows — invoke PowerShell wrapper
        exec powershell.exe -ExecutionPolicy Bypass -File "$SCRIPT_DIR/setup-local.ps1" "$@"
        ;;
    *)
        echo "Unknown platform '$(uname -s 2>/dev/null)'. Run scripts/setup-local.sh or scripts/setup-local.ps1 directly." >&2
        exit 1
        ;;
esac
