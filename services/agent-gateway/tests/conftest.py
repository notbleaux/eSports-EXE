"""Pytest conftest for the agent-gateway test suite.

Forces the SQLite-backed Blackboard singleton to use an in-memory
database so tests never touch the on-disk default path. Runs at
collection time, before any test module imports `blackboard` or `app`.
"""

from __future__ import annotations

import os
import sys

os.environ.setdefault("AGENT_GATEWAY_DB_PATH", ":memory:")

# Ensure a fresh import if pytest already touched these modules.
sys.modules.pop("blackboard", None)
sys.modules.pop("app", None)
