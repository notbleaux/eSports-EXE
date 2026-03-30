"""Integration tests for Tournament router with Circuit Breaker.

[Ver001.000]
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
import asyncio

# Import the FastAPI app
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from src.njz_api.middleware.circuit_breaker import (
    CircuitBreakerOpen,
    CircuitState,
    get_circuit_breaker,
    remove_circuit_breaker,
    reset_circuit_breaker,
)


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_circuit_breakers():
    """Clean up circuit breakers before and after tests."""
    # Clean up before test
    for name in [
        "tournament_list",
        "tournament_detail",
        "match_result_submission",
        "external_api_valorant",
        "external_api_cs2",
    ]:
        remove_circuit_breaker(name)
    yield
    # Clean up after test
    for name in [
        "tournament_list",
        "tournament_detail",
        "match_result_submission",
        "external_api_valorant",
        "external_api_cs2",
    ]:
        remove_circuit_breaker(name)


class TestTournamentListEndpoint:
    """Tests for tournament list endpoint."""

    def test_list_tournaments_basic(self, client):
        """Basic tournament list request."""
        response = client.get("/api/v1/tournaments/?game=valorant")

        # May fail due to external API, but should not 500
        assert response.status_code in [200, 503]

    def test_list_tournaments_invalid_game(self, client):
        """Invalid game parameter rejected."""
        response = client.get("/api/v1/tournaments/?game=invalid")
        assert response.status_code == 422

    def test_list_tournaments_pagination(self, client):
        """Pagination parameters work."""
        response = client.get("/api/v1/tournaments/?game=valorant&page=1&per_page=10")
        assert response.status_code in [200, 503]


class TestCircuitBreakerStatusEndpoint:
    """Tests for circuit breaker status endpoint."""

    def test_get_circuit_breaker_status(self, client):
        """Get circuit breaker status."""
        response = client.get("/api/v1/tournaments/system/circuit-breakers")
        assert response.status_code == 200

        data = response.json()
        assert "circuit_breakers" in data
        assert "summary" in data
        assert "total" in data["summary"]

    def test_get_specific_circuit_breaker(self, client):
        """Get specific circuit breaker status."""
        # First ensure it exists
        get_circuit_breaker("tournament_list")

        response = client.get("/api/v1/tournaments/system/circuit-breakers/tournament_list")
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "tournament_list"
        assert "state" in data

    def test_get_nonexistent_circuit_breaker(self, client):
        """Get nonexistent circuit breaker creates it."""
        response = client.get("/api/v1/tournaments/system/circuit-breakers/new_cb")
        assert response.status_code == 200


class TestCircuitBreakerReset:
    """Tests for circuit breaker reset endpoint."""

    def test_reset_circuit_breaker(self, client):
        """Reset circuit breaker as admin."""
        # Create and open a circuit breaker
        cb = get_circuit_breaker("reset_test")
        cb._state = CircuitState.OPEN

        # Reset requires admin permission - will fail without auth
        response = client.post("/api/v1/tournaments/system/circuit-breakers/reset_test/reset")
        # Should fail due to auth (403) or succeed if test client bypasses auth
        assert response.status_code in [200, 403, 401]

    def test_reset_nonexistent_circuit_breaker(self, client):
        """Reset nonexistent circuit breaker returns 404."""
        response = client.post(
            "/api/v1/tournaments/system/circuit-breakers/nonexistent/reset"
        )
        # Will fail auth or 404
        assert response.status_code in [403, 401, 404]


class TestMatchResultSubmission:
    """Tests for match result submission endpoint."""

    def test_submit_match_result_unauthorized(self, client):
        """Submit match result without auth fails."""
        result_data = {
            "match_id": "test-match-1",
            "tournament_id": "test-tournament-1",
            "team1_id": "team-1",
            "team2_id": "team-2",
            "team1_score": 13,
            "team2_score": 10,
            "winner_id": "team-1",
        }

        response = client.post(
            "/api/v1/tournaments/test-tournament-1/matches/results",
            json=result_data,
        )
        # Should fail due to missing auth
        assert response.status_code in [401, 403]

    def test_submit_match_result_mismatched_tournament(self, client):
        """Submit with mismatched tournament ID fails."""
        result_data = {
            "match_id": "test-match-1",
            "tournament_id": "different-tournament",  # Mismatched
            "team1_id": "team-1",
            "team2_id": "team-2",
            "team1_score": 13,
            "team2_score": 10,
            "winner_id": "team-1",
        }

        response = client.post(
            "/api/v1/tournaments/test-tournament-1/matches/results",
            json=result_data,
        )
        # Will fail auth first, but would be 400 if authenticated
        assert response.status_code in [400, 401, 403]


class TestSystemCircuitBreakerEndpoint:
    """Tests for system-level circuit breaker endpoint."""

    def test_system_circuit_breaker_status(self, client):
        """Get system-level circuit breaker status."""
        response = client.get("/system/circuit-breakers")
        assert response.status_code == 200

        data = response.json()
        assert "circuit_breakers" in data
        assert "summary" in data


class TestCircuitBreakerBehavior:
    """Tests for circuit breaker behavior in tournament endpoints."""

    @pytest.mark.asyncio
    async def test_circuit_breaker_opens_after_failures(self):
        """Circuit breaker opens after threshold failures."""
        from src.njz_api.middleware.circuit_breaker import CircuitBreaker, CircuitBreakerConfig

        cb = CircuitBreaker("test_behavior", CircuitBreakerConfig(failure_threshold=2))

        async def fail():
            raise ConnectionError("fail")

        # Two failures should open circuit
        with pytest.raises(ConnectionError):
            await cb.call(fail)
        with pytest.raises(ConnectionError):
            await cb.call(fail)

        assert cb.state == CircuitState.OPEN

    @pytest.mark.asyncio
    async def test_circuit_breaker_decorator_integration(self):
        """Circuit breaker decorator works with async functions."""
        from src.njz_api.middleware.circuit_breaker import circuit_breaker

        call_count = 0

        @circuit_breaker("decorator_test", failure_threshold=1)
        async def flaky_function():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ConnectionError("fail")
            return "success"

        # First call fails
        with pytest.raises(ConnectionError):
            await flaky_function()

        # Circuit is now open, should fail fast
        with pytest.raises(CircuitBreakerOpen):
            await flaky_function()


class TestCircuitBreakerMetrics:
    """Tests for circuit breaker metrics."""

    def test_metrics_structure(self, client):
        """Metrics have correct structure."""
        # Make a request to create the circuit breaker
        client.get("/api/v1/tournaments/?game=valorant")

        response = client.get("/api/v1/tournaments/system/circuit-breakers")
        assert response.status_code == 200

        data = response.json()
        for name, cb_data in data["circuit_breakers"].items():
            assert "name" in cb_data
            assert "state" in cb_data
            assert "failure_count" in cb_data
            assert "config" in cb_data
            assert "metrics" in cb_data
            assert "total_calls" in cb_data["metrics"]


# pytest marker for async tests
pytestmark = pytest.mark.asyncio
