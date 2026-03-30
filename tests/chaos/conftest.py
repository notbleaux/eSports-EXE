"""[Ver001.000]
Pytest fixtures for chaos engineering tests.
"""

import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio

# Chaos API client for tests
class ChaosAPIClient:
    """Client for interacting with chaos API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self._experiments: list[str] = []
    
    async def start_experiment(
        self,
        name: str,
        mode: str,
        probability: float = 0.3,
        duration: int = 60,
        intensity: float = 1.0,
        targets: list[str] | None = None,
    ) -> dict:
        """Start a chaos experiment via API."""
        # This would make actual HTTP requests in integration tests
        # For now, returns mock data
        self._experiments.append(name)
        return {
            "status": "started",
            "name": name,
            "mode": mode,
            "duration": duration,
        }
    
    async def stop_experiment(self, name: str) -> dict:
        """Stop a chaos experiment via API."""
        if name in self._experiments:
            self._experiments.remove(name)
        return {"status": "stopped", "name": name}
    
    async def stop_all(self) -> None:
        """Stop all experiments."""
        for name in list(self._experiments):
            await self.stop_experiment(name)
    
    async def get_status(self) -> dict:
        """Get chaos system status."""
        return {
            "active_experiments": len(self._experiments),
            "experiments": [{"name": n} for n in self._experiments],
        }


@pytest_asyncio.fixture
async def chaos_api() -> AsyncGenerator[ChaosAPIClient, None]:
    """Fixture providing chaos API client."""
    base_url = os.environ.get("CHAOS_API_URL", "http://localhost:8000")
    client = ChaosAPIClient(base_url)
    
    yield client
    
    # Cleanup: stop all experiments after test
    await client.stop_all()


@pytest.fixture
def api_client_config() -> dict:
    """Configuration for API client in chaos tests."""
    return {
        "base_url": os.environ.get("CHAOS_API_URL", "http://localhost:8000"),
        "timeout": 30,
        "retries": 3,
    }


@pytest.fixture
def chaos_test_timeout() -> int:
    """Default timeout for chaos tests."""
    return 120  # 2 minutes


@pytest.fixture
def recovery_timeout() -> int:
    """Timeout for system recovery verification."""
    return 60  # 1 minute


class CircuitBreakerStatus:
    """Mock circuit breaker status for testing."""
    
    def __init__(self):
        self.failure_count = 0
        self.state = "closed"
        self.last_failure_time = None


@pytest.fixture
def mock_circuit_breaker_status() -> CircuitBreakerStatus:
    """Fixture providing mock circuit breaker status."""
    return CircuitBreakerStatus()


@pytest.fixture
def godot_export_simulator():
    """Fixture providing Godot export client simulator."""
    class GodotExportClientSimulator:
        def __init__(self):
            self.queue = []
            self.sent_count = 0
        
        async def send_match_data(self, data: dict) -> bool:
            """Simulate sending match data."""
            self.queue.append(data)
            self.sent_count += 1
            return True
        
        async def flush_queue(self) -> list:
            """Flush the send queue."""
            items = self.queue.copy()
            self.queue.clear()
            return items
    
    return GodotExportClientSimulator()
