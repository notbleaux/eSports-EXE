"""
backup_manager.py — Live SQLite snapshot + retention for the agent-gateway.

[Ver001.000] · Phase 7-B of PLN-003-network-api

Pure utility — no network calls. Uses SQLite's built-in `.backup()` API
which takes a consistent live snapshot without holding a write lock for
long. Operator runs as a cron / systemd timer; the gateway itself is
unaffected.

CLI usage:

    python -m backup_manager \
        --db services/agent-gateway/data/agent-gateway.db \
        --out services/agent-gateway/data/backups \
        --keep 14

Programmatic:

    from backup_manager import snapshot, prune
    p = snapshot("agent-gateway.db", "backups/")
    prune("backups/", keep=14)

Snapshot file naming: `agent-gateway-<YYYYMMDD-HHMMSS>.db` (sortable,
host-clock-driven; assumes UTC operator timezone but doesn't enforce).
"""

from __future__ import annotations

import argparse
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SNAPSHOT_PREFIX = "agent-gateway-"
SNAPSHOT_SUFFIX = ".db"


def snapshot(db_path: str | Path, backup_dir: str | Path) -> Path:
    """Take a live SQLite snapshot. Returns the snapshot file path.

    Uses SQLite's `Connection.backup()` API — pages are copied
    incrementally while the source DB stays writable. Result is a
    fully-consistent point-in-time copy.

    Raises:
        FileNotFoundError: source DB doesn't exist
        sqlite3.Error: backup failed (disk full, etc.)
    """
    src = Path(db_path)
    if not src.exists():
        raise FileNotFoundError(f"source DB not found: {src}")
    out_dir = Path(backup_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    dest = out_dir / f"{SNAPSHOT_PREFIX}{ts}{SNAPSHOT_SUFFIX}"

    src_conn = sqlite3.connect(str(src))
    try:
        dest_conn = sqlite3.connect(str(dest))
        try:
            src_conn.backup(dest_conn)
        finally:
            dest_conn.close()
    finally:
        src_conn.close()
    return dest


def list_snapshots(backup_dir: str | Path) -> list[Path]:
    """Return all snapshot files in `backup_dir`, sorted oldest → newest."""
    out_dir = Path(backup_dir)
    if not out_dir.exists():
        return []
    return sorted(
        p for p in out_dir.iterdir()
        if p.name.startswith(SNAPSHOT_PREFIX) and p.name.endswith(SNAPSHOT_SUFFIX)
    )


def prune(backup_dir: str | Path, keep: int = 14) -> list[Path]:
    """Keep only the N most recent snapshots. Returns the list of removed files.

    `keep <= 0` is a no-op (defensive). Caller chooses the retention
    policy; we just enforce it idempotently.
    """
    if keep <= 0:
        return []
    snaps = list_snapshots(backup_dir)
    to_remove = snaps[:-keep] if len(snaps) > keep else []
    removed: list[Path] = []
    for p in to_remove:
        try:
            p.unlink()
            removed.append(p)
        except OSError as e:
            sys.stderr.write(f"[backup_manager warn] cannot remove {p}: {e!r}\n")
    return removed


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Live SQLite snapshot + retention for the agent-gateway DB",
    )
    parser.add_argument(
        "--db",
        required=True,
        type=Path,
        help="Path to the source SQLite DB (e.g. services/agent-gateway/data/agent-gateway.db)",
    )
    parser.add_argument(
        "--out",
        required=True,
        type=Path,
        help="Backup directory (created if missing)",
    )
    parser.add_argument(
        "--keep",
        type=int,
        default=14,
        help="Number of snapshots to retain (default: 14)",
    )
    parser.add_argument(
        "--skip-snapshot",
        action="store_true",
        help="Run prune only (no new snapshot taken)",
    )
    args = parser.parse_args()

    started = time.time()
    if not args.skip_snapshot:
        try:
            new_snap = snapshot(args.db, args.out)
        except (FileNotFoundError, sqlite3.Error) as e:
            sys.stderr.write(f"ERROR: snapshot failed: {e!r}\n")
            return 1
        print(f"snapshot: {new_snap}")

    removed = prune(args.out, keep=args.keep)
    for p in removed:
        print(f"pruned:   {p}")
    elapsed = time.time() - started
    print(f"retained: {len(list_snapshots(args.out))} snapshots (keep={args.keep}) in {elapsed:.2f}s")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
