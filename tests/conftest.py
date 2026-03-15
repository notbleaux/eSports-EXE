"""
Test Configuration for SATOR API Test Suite
"""
import pytest
import asyncio
from typing import AsyncGenerator
import asyncpg
import os

# Test database URL (separate from production)
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL environment variable must be set for testing")


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_db_pool() -> AsyncGenerator[asyncpg.Pool, None]:
    """Create a database pool for testing."""
    pool = await asyncpg.create_pool(
        TEST_DATABASE_URL,
        min_size=1,
        max_size=5,
        command_timeout=30
    )
    yield pool
    await pool.close()


@pytest.fixture
async def test_db_conn(test_db_pool):
    """Get a database connection for a single test."""
    async with test_db_pool.acquire() as conn:
        yield conn


@pytest.fixture
async def transaction(test_db_conn):
    """Run test in a transaction that always rolls back after test."""
    tr = test_db_conn.transaction()
    await tr.start()
    try:
        yield test_db_conn
    finally:
        await tr.rollback()
