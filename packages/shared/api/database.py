"""Database connection pool management for SATOR API."""
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, Any, List
import os

class DatabasePool:
    """Manages asyncpg connection pool for PostgreSQL."""
    
    def __init__(self, dsn: str, min_size: int = 5, max_size: int = 20):
        self.dsn = dsn
        self.min_size = min_size
        self.max_size = max_size
        self._pool: Optional[asyncpg.Pool] = None
        self._metrics = {
            "total_queries": 0,
            "failed_queries": 0,
            "pool_size": 0,
            "free_connections": 0
        }

    async def connect(self):
        """Initialize the connection pool."""
        self._pool = await asyncpg.create_pool(
            self.dsn,
            min_size=self.min_size,
            max_size=self.max_size,
            command_timeout=60,
            server_settings={
                'jit': 'off',
                'application_name': 'sator_api'
            }
        )
        print(f"✓ Database pool connected (min: {self.min_size}, max: {self.max_size})")

    async def disconnect(self):
        """Close all connections in the pool."""
        if self._pool:
            await self._pool.close()
            print("✓ Database pool disconnected")

    @asynccontextmanager
    async def acquire(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """Acquire a connection from the pool."""
        if not self._pool:
            raise RuntimeError("Database pool not initialized")
        async with self._pool.acquire() as conn:
            yield conn

    async def fetch(self, query: str, *args) -> List[asyncpg.Record]:
        """Execute a SELECT query and return all rows."""
        self._metrics["total_queries"] += 1
        async with self.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Execute a SELECT query and return first row."""
        self._metrics["total_queries"] += 1
        async with self.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetchval(self, query: str, *args):
        """Execute a SELECT query and return single value."""
        self._metrics["total_queries"] += 1
        async with self.acquire() as conn:
            return await conn.fetchval(query, *args)

    async def execute(self, query: str, *args) -> str:
        """Execute an INSERT, UPDATE, or DELETE query."""
        self._metrics["total_queries"] += 1
        async with self.acquire() as conn:
            return await conn.execute(query, *args)

    async def executemany(self, query: str, args: List[tuple]) -> str:
        """Execute a query multiple times with different arguments."""
        self._metrics["total_queries"] += len(args)
        async with self.acquire() as conn:
            return await conn.executemany(query, args)

    @asynccontextmanager
    async def transaction(self):
        """Start a database transaction."""
        async with self.acquire() as conn:
            async with conn.transaction():
                yield conn

    def get_metrics(self) -> dict:
        """Return current pool metrics."""
        if self._pool:
            self._metrics["pool_size"] = len(self._pool._holders)
            self._metrics["free_connections"] = len(self._pool._queue._queue)
        return self._metrics.copy()


# Global pool instance
_pool: Optional[DatabasePool] = None


def init_pool(dsn: Optional[str] = None, min_size: int = 5, max_size: int = 20):
    """Initialize the global database pool."""
    global _pool
    if dsn is None:
        dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise ValueError("DATABASE_URL environment variable not set")
    _pool = DatabasePool(dsn, min_size, max_size)


def get_pool() -> DatabasePool:
    """Get the global database pool instance."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    return _pool


async def close_pool():
    """Close the global database pool."""
    global _pool
    if _pool:
        await _pool.disconnect()
        _pool = None