"""
export_openapi.py — Export the agent-gateway FastAPI app to OpenAPI 3.1 JSON.

[Ver001.000] · Phase 2 final sub-PR of PLN-003-network-api

Run from any cwd:
    python services/agent-gateway/scripts/export_openapi.py

Writes services/agent-gateway/openapi.json (committed for diff visibility +
CI drift detection via .github/workflows/agent-gateway-openapi.yml).

This is the **v1.0.0 OKR deliverable** "OpenAPI 3.1 published" — see
docs/okrs/OKR-V1.0.0-GATE.md (when bootstrapped).

FastAPI 0.115+ natively emits OpenAPI 3.1; we force the version field
explicitly in case the framework default changes.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

GATEWAY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = GATEWAY_ROOT / "openapi.json"

# Make `app` and `blackboard` importable when run from any cwd.
sys.path.insert(0, str(GATEWAY_ROOT))

from app import app  # noqa: E402


def export(out_path: Path = DEFAULT_OUT) -> dict:
    """Generate the OpenAPI spec, force version 3.1.0, write to disk."""
    spec = app.openapi()
    spec["openapi"] = "3.1.0"
    # Sort keys for stable diffs across regenerations.
    text = json.dumps(spec, indent=2, sort_keys=True) + "\n"
    out_path.write_text(text)
    return spec


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Output path (default: {DEFAULT_OUT})",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if the generated spec differs from --out (drift detection)",
    )
    args = parser.parse_args()

    if args.check:
        current = args.out.read_text() if args.out.exists() else ""
        spec = app.openapi()
        spec["openapi"] = "3.1.0"
        generated = json.dumps(spec, indent=2, sort_keys=True) + "\n"
        if current != generated:
            sys.stderr.write(
                f"ERROR: {args.out} is stale. Re-run without --check to regenerate.\n"
            )
            return 1
        print(f"ok — {args.out} matches generated spec")
        return 0

    spec = export(args.out)
    print(f"wrote OpenAPI {spec['openapi']} ({len(spec.get('paths', {}))} paths) to {args.out}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
