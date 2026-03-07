"""Database router with read/write separation for scaling."""
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, List, Any
from enum import Enum


class QueryType(Enum):
    """Type of database query."""
    READ = "read"
    WRITE = "write"


class DatabaseRouter:
    """Routes queries between primary (write) and replicas (read)."""
    
    def __init__(
        self,
        primary_dsn: str,
        replica_dsns: Optional[List[str]] = None,
        max_connections: int = 20
    ):
        self.primary_dsn = primary_dsn
        self.replica_dsns = replica_dsns or []
        
        self._primary_pool: Optional[asyncpg.Pool] = None
        self._replica_pools: List[asyncpg.Pool] = []
        self._replica_index = 0
        self._max_connections = max_connections
        
        self._metrics = {
            "primary_queries": 0,
            "replica_queries": 0,
            "total_queries": 0
        }

    async def connect(self):
        """Initialize all connection pools."""
        # Primary pool for writes
        self._primary_pool = await asyncpg.create_pool(
            self.primary_dsn,
            min_size=3,
            max_size=10,
            command_timeout=60,
            server_settings={'application_name': 'sator_primary'}
        )
        
        # Replica pools for reads
        if self.replica_dsns:
            for i, dsn in enumerate(self.replica_dsns):
                pool = await asyncpg.create_pool(
                    dsn,
                    min_size=2,
                    max_size=self._max_connections // len(self.replica_dsns),
                    command_timeout=60,
                    server_settings={'application_name': f'sator_replica_{i}'}
                )
                self._replica_pools.append(pool)
            print(f"✓ Primary + {len(self._replica_pools)} replica pools connected")
        else:
            print("✓ Primary pool only (no replicas configured)")

    async def disconnect(self):
        """Close all pools."""
        if self._primary_pool:
            await self._primary_pool.close()
        for pool in self._replica_pools:
            await pool.close()

    def _get_replica_pool(self) -> asyncpg.Pool:
        """Round-robin replica selection."""
        if not self._replica_pools:
            return self._primary_pool
        
        pool = self._replica_pools[self._replica_index]
        self._replica_index = (self._replica_index + 1) % len(self._replica_pools)
        return pool

    @asynccontextmanager
    async def acquire(
        self,
        query_type: QueryType = QueryType.READ
    ) -> AsyncGenerator[asyncpg.Connection, None]:
        """Acquire connection based on query type."""
        if query_type == QueryType.WRITE or not self._replica_pools:
            pool = self._primary_pool
            self._metrics["primary_queries"] += 1
        else:
            pool = self._get_replica_pool()
            self._metrics["replica_queries"] += 1
        
        self._metrics["total_queries"] += 1
        
        async with pool.acquire() as conn:
            yield conn

    # Convenience methods
    async def fetch(self, query: str, *args) -> List[asyncpg.Record]:
        """READ from replica."""
        async with self.acquire(QueryType.READ) as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """READ from replica."""
        async with self.acquire(QueryType.READ) as conn:
            return await conn.fetchrow(query, *args)

    async def execute(self, query: str, *args) -> str:
        """WRITE to primary."""
        async with self.acquire(QueryType.WRITE) as conn:
            return await conn.execute(query, *args)

    @asynccontextmanager
    async def transaction(self):
        """Transaction - always use primary."""
        async with self._primary_pool.acquire() as conn:
            async with conn.transaction():
                yield conn

    def get_metrics(self) -> dict:
        """Return routing metrics."""
        total = self._metrics["total_queries"]
        return {
            **self._metrics,
            "replica_ratio": round(self._metrics["replica_queries"] / total * 100, 2) if total > 0 else 0
        }


# Global router
_router: Optional[DatabaseRouter] = None


def init_router(primary_dsn: str, replica_dsns: Optional[List[str]] = None):
    """Initialize global router."""
    global _router
    _router = DatabaseRouter(primary_dsn, replica_dsns)


def get_router() -> DatabaseRouter:
    """Get global router."""
    if _router is None:
        raise RuntimeError("Database router not initialized")
    return _router