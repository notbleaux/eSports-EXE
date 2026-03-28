"""
[Ver002.000]
Test Configuration and Fixtures

Shared fixtures for all API tests.
"""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
import os

# Prevent database initialization during testing
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = ""


@pytest.fixture
def mock_db_pool():
    """Create a mock database pool for testing.
    
    Returns a tuple of (mock_pool, mock_conn) for database testing.
    """
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.fetchrow = AsyncMock()
    mock_conn.fetch = AsyncMock()
    
    mock_pool = AsyncMock()
    mock_pool.acquire = MagicMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    
    return mock_pool, mock_conn


@pytest.fixture
def mock_redis():
    """Create a mock Redis client for testing."""
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)
    redis.exists = AsyncMock(return_value=0)
    return redis


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "user_123",
        "email": "test@example.com",
        "username": "testuser",
        "hashed_password": "hashed_password_string",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00",
    }


@pytest.fixture
def sample_match_data():
    """Sample match data for testing."""
    return {
        "id": "match_123",
        "team_a": "Team A",
        "team_b": "Team B",
        "game": "valorant",
        "map_name": "Haven",
        "status": "live",
        "score": {"team_a": 1, "team_b": 0},
    }


@pytest_asyncio.fixture
async def async_mock_db():
    """Async fixture for mock database operations."""
    mock_conn = AsyncMock()
    mock_pool = AsyncMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    return mock_pool, mock_conn
