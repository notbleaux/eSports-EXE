"""
Database Connection Manager — Supabase Free Tier Optimized

Features:
- Connection pooling with conservative limits
- Automatic retry with exponential backoff
- Query timeout protection
- Connection health monitoring

Supabase Free Tier Limits:
- 500MB Database Storage
- 2M Row Reads/month
- 500MB Bandwidth/month
- 30 Max Connections (we use 5 max to be safe)
"""

import asyncpg
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Any, Dict, Union
import os
import asyncio
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages PostgreSQL connections for Supabase free tier."""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv("DATABASE_URL")
        self.min_size = int(os.getenv("DB_MIN_CONNECTIONS", "1"))
        self.max_size = int(os.getenv("DB_MAX_CONNECTIONS", "5"))
        self.connection_timeout = int(os.getenv("DB_CONNECTION_TIMEOUT", "30"))
        self._initialized = False
        
    async def initialize(self) -> bool:
        """Initialize connection pool.
        
        Returns:
            True if connected successfully, False if in stub mode
        """
        if self._initialized:
            return self.pool is not None
            
        if not self.database_url:
            logger.warning("DATABASE_URL not set — running in stub mode")
            self._initialized = True
            return False
            
        try:
            # Create connection pool with conservative settings for free tier
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=self.min_size,
                max_size=self.max_size,
                command_timeout=self.connection_timeout,
                server_settings={
                    'jit': 'off',  # Disable JIT for faster simple queries
                    'application_name': 'sator_api',
                    'timezone': 'UTC'
                },
                init=self._init_connection
            )
            
            self._initialized = True
            logger.info(f"✅ Database pool created: {self.min_size}-{self.max_size} connections")
            
            # Test connection
            async with self.pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                logger.info(f"📊 Connected to: {version[:60]}...")
                
                # Check TimescaleDB
                try:
                    ts_version = await conn.fetchval(
                        "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'"
                    )
                    logger.info(f"⏱️ TimescaleDB version: {ts_version}")
                except Exception:
                    logger.warning("⚠️ TimescaleDB extension not found")
                    
            return True
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            self.pool = None
            self._initialized = False
            raise
    
    async def _init_connection(self, conn):
        """Initialize each connection with proper settings."""
        await conn.set_type_codec(
            'json',
            encoder=str,
            decoder=str,
            schema='pg_catalog'
        )
    
    async def connect(self) -> bool:
        """Alias for initialize() - connect to database."""
        return await self.initialize()
    
    async def close(self):
        """Close all connections gracefully."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            self._initialized = False
            logger.info("🔌 Database pool closed")
    
    @asynccontextmanager
    async def acquire(self):
        """Acquire connection from pool with automatic retry."""
        if not self.pool:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        
        retries = 3
        for attempt in range(retries):
            try:
                async with self.pool.acquire() as conn:
                    yield conn
                    return
            except asyncpg.TooManyConnectionsError:
                if attempt < retries - 1:
                    wait_time = (2 ** attempt) * 0.5  # Exponential backoff
                    logger.warning(f"Connection pool busy, retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    raise
    
    async def execute(self, query: str, *args) -> str:
        """Execute a query (INSERT, UPDATE, DELETE).
        
        Returns:
            Query result status
        """
        async with self.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch(self, query: str, *args) -> List[asyncpg.Record]:
        """Fetch multiple rows."""
        async with self.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Fetch single row."""
        async with self.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args) -> Any:
        """Fetch single value."""
        async with self.acquire() as conn:
            return await conn.fetchval(query, *args)
    
    async def fetchdict(self, query: str, *args) -> List[Dict]:
        """Fetch rows as dictionaries."""
        rows = await self.fetch(query, *args)
        return [dict(row) for row in rows]
    
    async def transaction(self):
        """Get a transaction context manager."""
        if not self.pool:
            raise RuntimeError("Database not initialized")
        return self.pool.acquire()
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on database connection."""
        if not self.pool:
            return {
                "status": "not_configured",
                "connected": False,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        try:
            async with self.acquire() as conn:
                # Test basic query
                await conn.fetchval("SELECT 1")
                
                # Get connection stats
                pid = await conn.fetchval("SELECT pg_backend_pid()")
                
                return {
                    "status": "healthy",
                    "connected": True,
                    "backend_pid": pid,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "connected": False,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def is_connected(self) -> bool:
        """Check if database is connected."""
        return self.pool is not None and self._initialized


# Global database instance
db = DatabaseManager()


# Convenience functions for common operations
async def get_player_by_id(player_id: str) -> Optional[Dict]:
    """Fetch player by ID."""
    row = await db.fetchrow(
        "SELECT * FROM players WHERE player_id = $1",
        player_id
    )
    return dict(row) if row else None


async def get_players_list(
    region: Optional[str] = None,
    role: Optional[str] = None,
    min_maps: int = 50,
    limit: int = 50,
    offset: int = 0
) -> List[Dict]:
    """Fetch list of players with filters."""
    query = """
        SELECT 
            player_id,
            name,
            team,
            region,
            role,
            sim_rating,
            rar_score,
            investment_grade,
            confidence_tier,
            map_count,
            created_at
        FROM players
        WHERE map_count >= $1
    """
    params: List[Union[int, str]] = [min_maps]
    
    if region:
        query += f" AND region = ${len(params) + 1}"
        params.append(region)
    
    if role:
        query += f" AND role = ${len(params) + 1}"
        params.append(role)
    
    query += f" ORDER BY sim_rating DESC LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}"
    params.extend([limit, offset])
    
    return await db.fetchdict(query, *params)


async def get_player_count(
    region: Optional[str] = None,
    role: Optional[str] = None,
    min_maps: int = 50
) -> int:
    """Get total count of players matching filters."""
    query = "SELECT COUNT(*) FROM players WHERE map_count >= $1"
    params: List[Union[int, str]] = [min_maps]
    
    if region:
        query += f" AND region = ${len(params) + 1}"
        params.append(region)
    
    if role:
        query += f" AND role = ${len(params) + 1}"
        params.append(role)
    
    return await db.fetchval(query, *params) or 0
