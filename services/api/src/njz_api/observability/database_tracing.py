"""
Database Tracing Module

Enhanced database operations with OpenTelemetry tracing.
[Ver001.000]

Wraps asyncpg operations with detailed span tracking.
"""

import time
import logging
from typing import Optional, List, Any, Dict
from contextlib import asynccontextmanager

import asyncpg
from asyncpg import Pool, Connection

from .tracing import get_tracing_manager, TraceAttributes

logger = logging.getLogger(__name__)


class TracedPool:
    """
    Wrapped asyncpg pool with tracing support.
    
    Provides automatic span creation for all database operations
    with detailed attributes for performance analysis.
    """
    
    def __init__(self, pool: Pool):
        self._pool = pool
        self._tracer = get_tracing_manager()
    
    @asynccontextmanager
    async def acquire(self):
        """Acquire connection with tracing."""
        with self._tracer.start_db_span("acquire"):
            async with self._pool.acquire() as conn:
                yield TracedConnection(conn, self._tracer)
    
    async def fetch(
        self,
        query: str,
        *args,
        timeout: Optional[float] = None,
        table: Optional[str] = None,
    ) -> List[asyncpg.Record]:
        """Execute fetch with tracing."""
        start_time = time.time()
        
        with self._tracer.start_db_span("fetch", table, query) as span:
            try:
                async with self._pool.acquire() as conn:
                    result = await conn.fetch(query, *args, timeout=timeout)
                
                duration = (time.time() - start_time) * 1000
                
                self._tracer.set_attributes({
                    TraceAttributes.DB_DURATION_MS: duration,
                    TraceAttributes.DB_ROWS_AFFECTED: len(result),
                    "db.pool.size": self._pool.get_size(),
                    "db.pool.free": self._pool.get_free_size(),
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def fetchval(
        self,
        query: str,
        *args,
        timeout: Optional[float] = None,
        table: Optional[str] = None,
    ) -> Any:
        """Execute fetchval with tracing."""
        start_time = time.time()
        
        with self._tracer.start_db_span("fetchval", table, query):
            try:
                async with self._pool.acquire() as conn:
                    result = await conn.fetchval(query, *args, timeout=timeout)
                
                duration = (time.time() - start_time) * 1000
                self._tracer.set_attributes({
                    TraceAttributes.DB_DURATION_MS: duration,
                    "db.result.is_null": result is None,
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def fetchrow(
        self,
        query: str,
        *args,
        timeout: Optional[float] = None,
        table: Optional[str] = None,
    ) -> Optional[asyncpg.Record]:
        """Execute fetchrow with tracing."""
        start_time = time.time()
        
        with self._tracer.start_db_span("fetchrow", table, query):
            try:
                async with self._pool.acquire() as conn:
                    result = await conn.fetchrow(query, *args, timeout=timeout)
                
                duration = (time.time() - start_time) * 1000
                self._tracer.set_attributes({
                    TraceAttributes.DB_DURATION_MS: duration,
                    "db.result.found": result is not None,
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def execute(
        self,
        query: str,
        *args,
        timeout: Optional[float] = None,
        table: Optional[str] = None,
    ) -> str:
        """Execute command with tracing."""
        start_time = time.time()
        
        with self._tracer.start_db_span("execute", table, query):
            try:
                async with self._pool.acquire() as conn:
                    result = await conn.execute(query, *args, timeout=timeout)
                
                duration = (time.time() - start_time) * 1000
                self._tracer.set_attributes({
                    TraceAttributes.DB_DURATION_MS: duration,
                    "db.result.status": result,
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    async def executemany(
        self,
        query: str,
        args: List[tuple],
        timeout: Optional[float] = None,
        table: Optional[str] = None,
    ) -> str:
        """Execute many with tracing."""
        start_time = time.time()
        
        with self._tracer.start_db_span("executemany", table, query):
            try:
                async with self._pool.acquire() as conn:
                    result = await conn.executemany(query, args, timeout=timeout)
                
                duration = (time.time() - start_time) * 1000
                self._tracer.set_attributes({
                    TraceAttributes.DB_DURATION_MS: duration,
                    TraceAttributes.DB_ROWS_AFFECTED: len(args),
                    "db.result.status": result,
                })
                
                return result
                
            except Exception as e:
                self._tracer.record_exception(e)
                raise
    
    def get_size(self) -> int:
        """Get pool size."""
        return self._pool.get_size()
    
    def get_free_size(self) -> int:
        """Get free connections."""
        return self._pool.get_free_size()
    
    async def close(self):
        """Close pool."""
        with self._tracer.start_span("db.pool.close", {
            TraceAttributes.APP_COMPONENT: "database",
        }):
            await self._pool.close()


class TracedConnection:
    """Wrapped asyncpg connection with tracing."""
    
    def __init__(self, conn: Connection, tracer):
        self._conn = conn
        self._tracer = tracer
    
    async def fetch(
        self,
        query: str,
        *args,
        timeout: Optional[float] = None,
        table: Optional[str] = None,
    ) -> List[asyncpg.Record]:
        """Fetch with tracing."""
        start_time = time.time()
        
        with self._tracer.start_db_span("fetch", table, query):
            result = await self._conn.fetch(query, *args, timeout=timeout)
            duration = (time.time() - start_time) * 1000
            
            self._tracer.set_attributes({
                TraceAttributes.DB_DURATION_MS: duration,
                TraceAttributes.DB_ROWS_AFFECTED: len(result),
            })
            
            return result
    
    async def fetchval(self, query: str, *args, timeout: Optional[float] = None, table: Optional[str] = None):
        """Fetchval with tracing."""
        with self._tracer.start_db_span("fetchval", table, query):
            return await self._conn.fetchval(query, *args, timeout=timeout)
    
    async def fetchrow(self, query: str, *args, timeout: Optional[float] = None, table: Optional[str] = None):
        """Fetchrow with tracing."""
        with self._tracer.start_db_span("fetchrow", table, query):
            return await self._conn.fetchrow(query, *args, timeout=timeout)
    
    async def execute(self, query: str, *args, timeout: Optional[float] = None, table: Optional[str] = None):
        """Execute with tracing."""
        with self._tracer.start_db_span("execute", table, query):
            return await self._conn.execute(query, *args, timeout=timeout)
    
    async def transaction(self):
        """Transaction context with tracing."""
        with self._tracer.start_span("db.transaction", {
            TraceAttributes.APP_COMPONENT: "database",
            TraceAttributes.DB_OPERATION: "transaction",
        }):
            return self._conn.transaction()


# Global traced pool instance
_traced_pool: Optional[TracedPool] = None


async def get_traced_pool(database_url: Optional[str] = None) -> TracedPool:
    """Get or create traced database pool."""
    global _traced_pool
    
    if _traced_pool is None:
        import os
        url = database_url or os.environ.get(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/njz_platform"
        )
        
        pool = await asyncpg.create_pool(
            url,
            min_size=2,
            max_size=10,
            command_timeout=60,
            server_settings={'jit': 'off'},
        )
        
        _traced_pool = TracedPool(pool)
        logger.info("Traced database pool created")
    
    return _traced_pool


async def close_traced_pool():
    """Close the traced pool."""
    global _traced_pool
    
    if _traced_pool:
        await _traced_pool.close()
        _traced_pool = None
        logger.info("Traced database pool closed")
