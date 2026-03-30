"""[Ver001.000]
Chaos Engineering Test Suite

Contains chaos experiments for resilience testing the NJZiteGeisTe Platform.

To run chaos tests:
    pytest tests/chaos/ -v -m chaos

To run specific experiment:
    pytest tests/chaos/experiments/test_api_resilience.py::test_api_latency_resilience -v

WARNING: These tests inject failures into the system and should only be run
in isolated test environments, never in production.
"""

import os
import pytest

# Skip all chaos tests unless explicitly enabled
pytestmark = [
    pytest.mark.chaos,
    pytest.mark.slow,
    pytest.mark.skipif(
        os.environ.get("ENABLE_CHAOS_TESTS") != "1",
        reason="Chaos tests disabled. Set ENABLE_CHAOS_TESTS=1 to enable.",
    ),
]

# Chaos test configuration
CHAOS_TEST_CONFIG = {
    "api_base_url": os.environ.get("CHAOS_API_URL", "http://localhost:8000"),
    "websocket_url": os.environ.get("CHAOS_WS_URL", "ws://localhost:8000/ws"),
    "default_timeout": 30,
    "max_latency_threshold_ms": 5000,
    "recovery_timeout_seconds": 60,
}
