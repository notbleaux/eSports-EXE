"""Pytest conftest for the agent-gateway test suite.

Forces the SQLite-backed Blackboard singleton to use an in-memory
database so tests never touch the on-disk default path. Also strips
any inherited SUPABASE_URL/SUPABASE_KEY so the Phase 3.5 mirror is
no-op by default during tests.

Runs at collection time, before any test module imports `blackboard`,
`supabase_mirror`, or `app`.
"""

from __future__ import annotations

import os
import sys

os.environ.setdefault("AGENT_GATEWAY_DB_PATH", ":memory:")
os.environ.pop("SUPABASE_URL", None)
os.environ.pop("SUPABASE_KEY", None)
os.environ.pop("REDIS_URL", None)

# Ensure a fresh import if pytest already touched these modules.
sys.modules.pop("blackboard", None)
sys.modules.pop("supabase_mirror", None)
sys.modules.pop("async_bus", None)
sys.modules.pop("app", None)
