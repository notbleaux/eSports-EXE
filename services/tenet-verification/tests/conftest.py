"""
Test database configuration for tenet-verification service.
Patches AsyncSessionLocal and engine to use in-memory SQLite so tests
run without a live PostgreSQL instance.
"""
import asyncio
import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(scope="session", autouse=True)
def patch_database():
    """
    Replace the PostgreSQL engine and session factory with an in-memory SQLite
    database for the duration of the test session.

    StaticPool is required so that all async connections share the same
    in-memory SQLite database (default pool creates a new DB per connection).
    """
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy.pool import StaticPool
    import main as svc

    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    test_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Create all tables in the in-memory database before any test runs
    loop = asyncio.new_event_loop()

    async def _create_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(svc.Base.metadata.create_all)

    loop.run_until_complete(_create_tables())

    # Save originals and install test doubles
    original_engine = svc.engine
    original_session_local = svc.AsyncSessionLocal

    svc.engine = test_engine
    svc.AsyncSessionLocal = test_session_factory

    yield

    # Teardown: dispose SQLite engine, restore originals
    async def _dispose():
        await test_engine.dispose()

    loop.run_until_complete(_dispose())
    loop.close()

    svc.engine = original_engine
    svc.AsyncSessionLocal = original_session_local
