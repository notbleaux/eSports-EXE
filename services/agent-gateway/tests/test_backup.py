"""Phase 7-B — backup_manager snapshot + prune tests.

Run from repo root:
    pytest services/agent-gateway/tests/test_backup.py -v
"""

from __future__ import annotations

import sqlite3
import subprocess
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backup_manager import list_snapshots, prune, snapshot  # noqa: E402


def _make_seeded_db(path: Path) -> None:
    """Tiny SQLite DB with one table + two rows."""
    conn = sqlite3.connect(str(path))
    try:
        conn.execute("CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT)")
        conn.execute("INSERT INTO t (name) VALUES ('alice'), ('bob')")
        conn.commit()
    finally:
        conn.close()


def test_snapshot_creates_file_and_round_trips_data(tmp_path: Path) -> None:
    src = tmp_path / "source.db"
    _make_seeded_db(src)
    backups = tmp_path / "backups"

    snap = snapshot(src, backups)
    assert snap.exists()
    assert snap.parent == backups
    assert snap.name.startswith("agent-gateway-") and snap.name.endswith(".db")

    # Read rows back from the snapshot — must be the same data.
    conn = sqlite3.connect(str(snap))
    try:
        rows = conn.execute("SELECT id, name FROM t ORDER BY id").fetchall()
    finally:
        conn.close()
    assert rows == [(1, "alice"), (2, "bob")]


def test_snapshot_missing_source_raises(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        snapshot(tmp_path / "does-not-exist.db", tmp_path / "backups")


def test_prune_retains_n_most_recent(tmp_path: Path) -> None:
    src = tmp_path / "src.db"
    _make_seeded_db(src)
    backups = tmp_path / "backups"

    # Take 5 snapshots; sleep a tick between so filenames sort distinctly.
    for _ in range(5):
        snapshot(src, backups)
        time.sleep(1.05)

    before = list_snapshots(backups)
    assert len(before) == 5

    removed = prune(backups, keep=2)
    assert len(removed) == 3
    after = list_snapshots(backups)
    assert len(after) == 2
    # The retained snapshots are the most-recent 2 (suffix-sortable filenames)
    assert after == before[-2:]


def test_prune_zero_keep_is_noop(tmp_path: Path) -> None:
    src = tmp_path / "src.db"
    _make_seeded_db(src)
    backups = tmp_path / "backups"
    snapshot(src, backups)
    assert len(list_snapshots(backups)) == 1

    removed = prune(backups, keep=0)
    assert removed == []
    assert len(list_snapshots(backups)) == 1


def test_cli_snapshot_and_prune(tmp_path: Path) -> None:
    src = tmp_path / "src.db"
    _make_seeded_db(src)
    backups = tmp_path / "backups"
    script = Path(__file__).resolve().parents[1] / "backup_manager.py"

    # First run: take a snapshot
    result = subprocess.run(
        [sys.executable, str(script), "--db", str(src), "--out", str(backups), "--keep", "3"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "snapshot:" in result.stdout
    assert len(list_snapshots(backups)) == 1

    # Second run with --skip-snapshot: should not add a new file
    time.sleep(1.05)
    result = subprocess.run(
        [
            sys.executable, str(script),
            "--db", str(src), "--out", str(backups),
            "--keep", "3", "--skip-snapshot",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "snapshot:" not in result.stdout
    assert "retained: 1 snapshots" in result.stdout
