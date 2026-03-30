"""[Ver001.000]
Database connection management.

Async PostgreSQL connection pool using asyncpg.
"""

import os
import logging
from typing import Optional
import asyncpg
from asyncpg import Pool

logger = logging.getLogger(__name__)

# Global pool instance
_pool: Optional[Pool] = None


async def get_db_pool() -> Pool:
    """Get or create the database connection pool."""
    global _pool
    
    if _pool is None:
        database_url = os.environ.get(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/njz_platform"
        )
        
        _pool = await asyncpg.create_pool(
            database_url,
            min_size=2,
            max_size=10,
            command_timeout=60,
            server_settings={
                'jit': 'off',
            }
        )
        logger.info("Database pool created")
    
    return _pool


async def check_database_connection() -> bool:
    """Check if database connection is healthy."""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            return result == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def close_db_pool():
    """Close the database pool (for shutdown)."""
    global _pool
    
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed")


async def init_database():
    """Initialize database with required extensions."""
    pool = await get_db_pool()
    
    async with pool.acquire() as conn:
        # Enable UUID extension
        await conn.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        logger.info("Database extensions initialized")
