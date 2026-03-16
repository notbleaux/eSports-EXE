"""
Database Configuration Module
=============================
Centralized database connection management with configurable pool settings.

[Ver001.000] - Initial implementation with environment-based pool sizing
"""

import os
import logging
from typing import Optional
import asyncpg

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Database configuration from environment variables."""
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        # Pool configuration from environment
        # FREE TIER DEFAULTS: Low connection counts for free tier limits
        # Supabase free: 200 concurrent connections (shared across all clients)
        # Render free: Single worker, so pool should be small
        self.pool_min_size = int(os.getenv("DB_POOL_MIN_SIZE", "2"))
        self.pool_max_size = int(os.getenv("DB_POOL_MAX_SIZE", "5"))
        self.pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.pool_command_timeout = int(os.getenv("DB_COMMAND_TIMEOUT", "60"))
        
        # Validate pool sizes
        if self.pool_min_size > self.pool_max_size:
            logger.warning(
                f"DB_POOL_MIN_SIZE ({self.pool_min_size}) > DB_POOL_MAX_SIZE ({self.pool_max_size}), "
                f"using min_size=2, max_size={self.pool_max_size}"
            )
            self.pool_min_size = 2
        
        logger.info(
            f"DatabaseConfig: min_size={self.pool_min_size}, "
            f"max_size={self.pool_max_size}, timeout={self.pool_timeout}"
        )


class DatabaseManager:
    """
    Async database manager with connection pooling.
    
    Usage:
        db = DatabaseManager()
        await db.connect()
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetch("SELECT 1")
        await db.close()
    """
    
    def __init__(self):
        self.config = DatabaseConfig()
        self._pool: Optional[asyncpg.Pool] = None
        self._initialized = False
    
    async def connect(self) -> asyncpg.Pool:
        """
        Initialize database connection pool.
        
        Returns:
            asyncpg.Pool: The connection pool
        """
        if self._initialized and self._pool:
            return self._pool
        
        logger.info("Initializing database connection pool...")
        
        try:
            self._pool = await asyncpg.create_pool(
                self.config.database_url,
                min_size=self.config.pool_min_size,
                max_size=self.config.pool_max_size,
                command_timeout=self.config.pool_command_timeout,
                init=self._init_connection,
            )
            self._initialized = True
            
            logger.info(
                f"Database pool initialized: "
                f"min={self.config.pool_min_size}, max={self.config.pool_max_size}"
            )
            
            return self._pool
            
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    async def _init_connection(self, conn: asyncpg.Connection):
        """Initialize connection with any required settings."""
        # Set application name for easier identification in pg_stat_activity
        await conn.execute(
            "SET application_name = 'sator_api'"
        )
    
    async def get_pool(self) -> asyncpg.Pool:
        """Get the connection pool, initializing if necessary."""
        if not self._initialized or not self._pool:
            return await self.connect()
        return self._pool
    
    async def close(self):
        """Close the connection pool."""
        if self._pool:
            logger.info("Closing database connection pool...")
            await self._pool.close()
            self._pool = None
            self._initialized = False
            logger.info("Database pool closed")
    
    async def health_check(self) -> dict:
        """
        Perform a health check on the database.
        
        Returns:
            dict: Health check results
        """
        if not self._initialized or not self._pool:
            return {
                "status": "not_initialized",
                "connected": False,
            }
        
        try:
            async with self._pool.acquire() as conn:
                start_time = asyncio.get_event_loop().time()
                await conn.fetchval("SELECT 1")
                latency_ms = (asyncio.get_event_loop().time() - start_time) * 1000
                
                # Get pool stats
                pool_size = len(self._pool._holders)
                free = sum(1 for h in self._pool._holders if h._con is None or not h._con.is_closed())
                
                return {
                    "status": "healthy",
                    "connected": True,
                    "latency_ms": round(latency_ms, 2),
                    "pool_size": pool_size,
                    "pool_free": free,
                }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e),
            }
    
    @property
    def pool(self) -> Optional[asyncpg.Pool]:
        """Get the current pool (may be None if not initialized)."""
        return self._pool
    
    @property
    def initialized(self) -> bool:
        """Check if the database is initialized."""
        return self._initialized


# Global database manager instance
db = DatabaseManager()


# Convenience functions for dependency injection
async def get_pool() -> asyncpg.Pool:
    """Get database pool for FastAPI dependency injection."""
    return await db.get_pool()


async def get_db() -> DatabaseManager:
    """Get database manager for FastAPI dependency injection."""
    return db
