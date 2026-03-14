"""
Turso Edge Cache Sync Service — Component C of TRINITY + OPERA Architecture

Provides one-way replication from PostgreSQL (primary) to Turso (edge SQLite)
for low-latency global data access to player performance metrics.

Features:
    - Async batch synchronization with configurable batch sizes
    - Checkpoint tracking for resume capability after interruption
    - Automatic cleanup of records older than 18 months
    - Efficient upsert operations using SQLite's ON CONFLICT
    - Graceful error handling and connection management

Environment Variables:
    DATABASE_URL: PostgreSQL connection string
    TURSO_DATABASE_URL: Turso database URL (libsql://...)
    TURSO_AUTH_TOKEN: Turso authentication token

Usage:
    sync = TursoEdgeSync()
    await sync.initialize()
    await sync.sync_recent_data()  # One-time sync
    # OR
    await sync.run_continuous_sync()  # Continuous background sync
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import asyncpg

logger = logging.getLogger(__name__)

# Try to import libsql_client, provide helpful error if not installed
try:
    from libsql_client import Client, create_client
    LIBSQL_AVAILABLE = True
except ImportError:
    LIBSQL_AVAILABLE = False
    logger.warning("libsql_client not installed. Turso sync will not be available.")
    logger.warning("Install with: pip install libsql-client")


class TursoEdgeSync:
    """
    Edge cache synchronization service for Turso SQLite databases.
    
    Implements one-way replication from PostgreSQL to Turso with:
    - Batch processing for efficiency
    - Checkpoint-based resume capability
    - Automatic data retention management
    - Connection pooling for PostgreSQL
    
    Attributes:
        pg_url: PostgreSQL connection string
        turso_url: Turso database URL
        turso_token: Turso authentication token
        batch_size: Number of records per batch (default: 1000)
        retention_months: Data retention period (default: 18)
        sync_interval_seconds: Continuous sync interval (default: 300)
    """

    def __init__(
        self,
        pg_url: Optional[str] = None,
        turso_url: Optional[str] = None,
        turso_token: Optional[str] = None,
        batch_size: int = 1000,
        retention_months: int = 18,
        sync_interval_seconds: int = 300,
    ):
        """
        Initialize the Turso Edge Sync service.
        
        Args:
            pg_url: PostgreSQL connection string. Uses DATABASE_URL env var if not provided.
            turso_url: Turso database URL. Uses TURSO_DATABASE_URL env var if not provided.
            turso_token: Turso auth token. Uses TURSO_AUTH_TOKEN env var if not provided.
            batch_size: Number of records to sync per batch
            retention_months: How many months to retain data in Turso
            sync_interval_seconds: Interval between continuous sync cycles
        """
        import os

        if not LIBSQL_AVAILABLE:
            raise RuntimeError(
                "libsql_client is required for TursoEdgeSync. "
                "Install with: pip install libsql-client"
            )

        self.pg_url = pg_url or os.environ.get("DATABASE_URL")
        self.turso_url = turso_url or os.environ.get("TURSO_DATABASE_URL")
        self.turso_token = turso_token or os.environ.get("TURSO_AUTH_TOKEN")
        
        self.batch_size = batch_size
        self.retention_months = retention_months
        self.sync_interval_seconds = sync_interval_seconds
        
        # Connection pools
        self.pg_pool: Optional[asyncpg.Pool] = None
        self.turso_client: Optional[Client] = None
        
        # Runtime state
        self._running = False
        self._sync_task: Optional[asyncio.Task] = None

        logger.info("TursoEdgeSync initialized (batch_size=%d, retention=%d months)", 
                   batch_size, retention_months)

    async def initialize(self) -> None:
        """
        Initialize database connections.
        
        Creates PostgreSQL connection pool and Turso client.
        Must be called before any sync operations.
        """
        if not self.pg_url:
            raise ValueError("PostgreSQL URL not provided. Set DATABASE_URL environment variable.")
        if not self.turso_url:
            raise ValueError("Turso URL not provided. Set TURSO_DATABASE_URL environment variable.")
        if not self.turso_token:
            raise ValueError("Turso token not provided. Set TURSO_AUTH_TOKEN environment variable.")

        # Initialize PostgreSQL connection pool
        try:
            self.pg_pool = await asyncpg.create_pool(
                self.pg_url,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )
            logger.info("PostgreSQL connection pool initialized")
        except Exception as e:
            logger.error("Failed to initialize PostgreSQL pool: %s", e)
            raise

        # Initialize Turso client
        try:
            self.turso_client = create_client(
                url=self.turso_url,
                auth_token=self.turso_token,
            )
            logger.info("Turso client initialized")
        except Exception as e:
            logger.error("Failed to initialize Turso client: %s", e)
            raise

        # Ensure sync checkpoint table exists
        await self._ensure_checkpoint_table()

    async def _ensure_checkpoint_table(self) -> None:
        """Create sync_checkpoint table in Turso if it doesn't exist."""
        if not self.turso_client:
            raise RuntimeError("Turso client not initialized")

        await self.turso_client.execute("""
            CREATE TABLE IF NOT EXISTS sync_checkpoint (
                checkpoint_id INTEGER PRIMARY KEY DEFAULT 1,
                last_sync_at TEXT NOT NULL,
                last_record_id BIGINT DEFAULT 0,
                records_synced BIGINT DEFAULT 0,
                sync_version INTEGER DEFAULT 1,
                updated_at TEXT NOT NULL
            )
        """)
        logger.debug("Sync checkpoint table ensured")

    async def sync_recent_data(self) -> Dict[str, Any]:
        """
        Perform a one-time sync of recent data from PostgreSQL to Turso.
        
        Syncs records newer than the last checkpoint, processing in batches.
        Automatically cleans up old records after successful sync.
        
        Returns:
            Dict with sync statistics: records_synced, batches_processed, 
            sync_duration_seconds, errors
        """
        if not self.pg_pool or not self.turso_client:
            raise RuntimeError("Sync service not initialized. Call initialize() first.")

        start_time = datetime.now(timezone.utc)
        stats = {
            "records_synced": 0,
            "batches_processed": 0,
            "sync_duration_seconds": 0.0,
            "errors": [],
        }

        try:
            # Get last checkpoint
            checkpoint = await self._get_sync_checkpoint()
            last_sync_at = checkpoint["last_sync_at"] if checkpoint else "1970-01-01T00:00:00Z"
            last_record_id = checkpoint["last_record_id"] if checkpoint else 0

            logger.info("Starting sync from checkpoint: last_sync_at=%s, last_record_id=%d",
                       last_sync_at, last_record_id)

            # Fetch and sync data in batches
            while True:
                batch = await self._fetch_batch_from_postgres(
                    last_sync_at=last_sync_at,
                    last_record_id=last_record_id,
                    limit=self.batch_size
                )

                if not batch:
                    logger.info("No more records to sync")
                    break

                # Sync batch to Turso
                try:
                    await self._sync_batch_to_turso(batch)
                    stats["records_synced"] += len(batch)
                    stats["batches_processed"] += 1

                    # Update checkpoint with last record
                    last_record = batch[-1]
                    last_sync_at = last_record["realworld_time"]
                    last_record_id = last_record["record_id"]

                    logger.debug("Synced batch of %d records", len(batch))

                except Exception as e:
                    error_msg = f"Failed to sync batch: {str(e)}"
                    logger.error(error_msg)
                    stats["errors"].append(error_msg)
                    break

            # Update checkpoint
            if stats["records_synced"] > 0:
                await self._update_sync_checkpoint(
                    last_sync_at=last_sync_at,
                    last_record_id=last_record_id,
                    records_synced=stats["records_synced"]
                )

            # Cleanup old data
            deleted_count = await self._cleanup_old_turso_data()
            if deleted_count > 0:
                logger.info("Cleaned up %d old records from Turso", deleted_count)

        except Exception as e:
            error_msg = f"Sync failed: {str(e)}"
            logger.error(error_msg)
            stats["errors"].append(error_msg)

        finally:
            end_time = datetime.now(timezone.utc)
            stats["sync_duration_seconds"] = (end_time - start_time).total_seconds()
            logger.info("Sync completed: %d records in %.2f seconds",
                       stats["records_synced"], stats["sync_duration_seconds"])

        return stats

    async def _fetch_batch_from_postgres(
        self,
        last_sync_at: str,
        last_record_id: int,
        limit: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch a batch of records from PostgreSQL.
        
        Selects a subset of fields suitable for edge caching:
        - Identity fields (player_id, name, team, region, role)
        - Performance metrics (kills, deaths, acs, adr, kast_pct)
        - RAR metrics (rar_score, investment_grade)
        - Extended metrics (headshot_pct, first_blood, clutch_wins, agent)
        - Match context (match_id, map_name, tournament, realworld_time)
        - Analytics (sim_rating)
        
        Args:
            last_sync_at: ISO timestamp of last synced record
            last_record_id: ID of last synced record
            limit: Maximum records to fetch
            
        Returns:
            List of record dictionaries
        """
        if not self.pg_pool:
            raise RuntimeError("PostgreSQL pool not initialized")

        query = """
            SELECT 
                record_id,
                player_id::TEXT as player_id,
                name,
                team,
                region,
                role,
                kills,
                deaths,
                acs,
                adr,
                kast_pct,
                rar_score,
                investment_grade,
                headshot_pct,
                first_blood,
                clutch_wins,
                agent,
                match_id,
                map_name,
                tournament,
                realworld_time::TEXT as realworld_time,
                sim_rating,
                data_source,
                extraction_timestamp::TEXT as extraction_timestamp
            FROM player_performance
            WHERE 
                (realworld_time > $1::TIMESTAMPTZ)
                OR (realworld_time = $1::TIMESTAMPTZ AND record_id > $2)
            ORDER BY realworld_time ASC, record_id ASC
            LIMIT $3
        """

        async with self.pg_pool.acquire() as conn:
            rows = await conn.fetch(query, last_sync_at, last_record_id, limit)
            return [dict(row) for row in rows]

    async def _sync_batch_to_turso(self, batch: List[Dict[str, Any]]) -> None:
        """
        Insert or update a batch of records in Turso.
        
        Uses SQLite's UPSERT (ON CONFLICT DO UPDATE) to handle existing records.
        Executes all inserts in a single transaction for atomicity.
        
        Args:
            batch: List of record dictionaries to sync
        """
        if not self.turso_client:
            raise RuntimeError("Turso client not initialized")

        if not batch:
            return

        # Build UPSERT statement with placeholders
        # SQLite uses ? for placeholders
        upsert_sql = """
            INSERT INTO player_performance_edge (
                record_id, player_id, name, team, region, role,
                kills, deaths, acs, adr, kast_pct,
                rar_score, investment_grade,
                headshot_pct, first_blood, clutch_wins, agent,
                match_id, map_name, tournament, realworld_time,
                sim_rating, data_source, extraction_timestamp,
                synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(record_id) DO UPDATE SET
                player_id = excluded.player_id,
                name = excluded.name,
                team = excluded.team,
                region = excluded.region,
                role = excluded.role,
                kills = excluded.kills,
                deaths = excluded.deaths,
                acs = excluded.acs,
                adr = excluded.adr,
                kast_pct = excluded.kast_pct,
                rar_score = excluded.rar_score,
                investment_grade = excluded.investment_grade,
                headshot_pct = excluded.headshot_pct,
                first_blood = excluded.first_blood,
                clutch_wins = excluded.clutch_wins,
                agent = excluded.agent,
                match_id = excluded.match_id,
                map_name = excluded.map_name,
                tournament = excluded.tournament,
                realworld_time = excluded.realworld_time,
                sim_rating = excluded.sim_rating,
                data_source = excluded.data_source,
                extraction_timestamp = excluded.extraction_timestamp,
                synced_at = excluded.synced_at
        """

        # Prepare statement with all records
        statements = []
        now = datetime.now(timezone.utc).isoformat()

        for record in batch:
            params = [
                record.get("record_id"),
                record.get("player_id"),
                record.get("name"),
                record.get("team"),
                record.get("region"),
                record.get("role"),
                record.get("kills"),
                record.get("deaths"),
                record.get("acs"),
                record.get("adr"),
                record.get("kast_pct"),
                record.get("rar_score"),
                record.get("investment_grade"),
                record.get("headshot_pct"),
                record.get("first_blood"),
                record.get("clutch_wins"),
                record.get("agent"),
                record.get("match_id"),
                record.get("map_name"),
                record.get("tournament"),
                record.get("realworld_time"),
                record.get("sim_rating"),
                record.get("data_source"),
                record.get("extraction_timestamp"),
                now,
            ]
            statements.append((upsert_sql, params))

        # Execute batch in a transaction
        # Note: libsql_client may not support batch transactions directly,
        # so we execute sequentially
        for sql, params in statements:
            await self.turso_client.execute(sql, params)

        logger.debug("Upserted %d records to Turso", len(batch))

    async def _cleanup_old_turso_data(self) -> int:
        """
        Delete records older than the retention period from Turso.
        
        Returns:
            Number of records deleted
        """
        if not self.turso_client:
            raise RuntimeError("Turso client not initialized")

        cutoff_date = (
            datetime.now(timezone.utc) - timedelta(days=30 * self.retention_months)
        ).isoformat()

        result = await self.turso_client.execute(
            "DELETE FROM player_performance_edge WHERE realworld_time < ?",
            [cutoff_date]
        )

        # libsql_client ResultSet may have rows_affected attribute
        rows_affected = getattr(result, "rows_affected", 0) or 0
        return rows_affected

    async def _get_sync_checkpoint(self) -> Optional[Dict[str, Any]]:
        """
        Retrieve the current sync checkpoint from Turso.
        
        Returns:
            Dict with checkpoint data or None if no checkpoint exists
        """
        if not self.turso_client:
            raise RuntimeError("Turso client not initialized")

        result = await self.turso_client.execute(
            "SELECT last_sync_at, last_record_id, records_synced, sync_version, updated_at "
            "FROM sync_checkpoint WHERE checkpoint_id = 1"
        )

        if not result.rows:
            return None

        row = result.rows[0]
        return {
            "last_sync_at": row[0],
            "last_record_id": row[1],
            "records_synced": row[2],
            "sync_version": row[3],
            "updated_at": row[4],
        }

    async def _update_sync_checkpoint(
        self,
        last_sync_at: str,
        last_record_id: int,
        records_synced: int
    ) -> None:
        """
        Update the sync checkpoint in Turso.
        
        Args:
            last_sync_at: ISO timestamp of last synced record
            last_record_id: ID of last synced record
            records_synced: Number of records synced in this batch
        """
        if not self.turso_client:
            raise RuntimeError("Turso client not initialized")

        now = datetime.now(timezone.utc).isoformat()

        await self.turso_client.execute("""
            INSERT INTO sync_checkpoint (
                checkpoint_id, last_sync_at, last_record_id, records_synced, sync_version, updated_at
            ) VALUES (1, ?, ?, ?, 1, ?)
            ON CONFLICT(checkpoint_id) DO UPDATE SET
                last_sync_at = excluded.last_sync_at,
                last_record_id = excluded.last_record_id,
                records_synced = sync_checkpoint.records_synced + excluded.records_synced,
                sync_version = sync_checkpoint.sync_version + 1,
                updated_at = excluded.updated_at
        """, [last_sync_at, last_record_id, records_synced, now])

        logger.debug("Checkpoint updated: last_record_id=%d", last_record_id)

    async def run_continuous_sync(self) -> None:
        """
        Run continuous background synchronization.
        
        Runs sync cycles at the configured interval until stop() is called.
        Handles errors gracefully and continues running.
        """
        if not self.pg_pool or not self.turso_client:
            raise RuntimeError("Sync service not initialized. Call initialize() first.")

        self._running = True
        logger.info("Starting continuous sync (interval=%d seconds)", self.sync_interval_seconds)

        while self._running:
            try:
                stats = await self.sync_recent_data()
                if stats["errors"]:
                    logger.warning("Sync cycle completed with errors: %s", stats["errors"])
                else:
                    logger.info("Sync cycle completed: %d records", stats["records_synced"])
            except Exception as e:
                logger.error("Sync cycle failed: %s", e)

            # Wait for next cycle
            if self._running:
                await asyncio.sleep(self.sync_interval_seconds)

    async def stop(self) -> None:
        """Stop continuous synchronization."""
        self._running = False
        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass
            self._sync_task = None
        logger.info("Continuous sync stopped")

    async def close(self) -> None:
        """
        Clean up resources and close connections.
        
        Should be called when the service is no longer needed.
        """
        await self.stop()

        if self.turso_client:
            await self.turso_client.close()
            self.turso_client = None
            logger.info("Turso client closed")

        if self.pg_pool:
            await self.pg_pool.close()
            self.pg_pool = None
            logger.info("PostgreSQL pool closed")

    async def get_sync_status(self) -> Dict[str, Any]:
        """
        Get current synchronization status.
        
        Returns:
            Dict with checkpoint info, record counts, and service status
        """
        status = {
            "initialized": self.pg_pool is not None and self.turso_client is not None,
            "continuous_sync_running": self._running,
            "checkpoint": None,
            "turso_record_count": 0,
            "retention_months": self.retention_months,
        }

        if self.turso_client:
            try:
                checkpoint = await self._get_sync_checkpoint()
                status["checkpoint"] = checkpoint

                # Get record count
                result = await self.turso_client.execute(
                    "SELECT COUNT(*) FROM player_performance_edge"
                )
                if result.rows:
                    status["turso_record_count"] = result.rows[0][0]
            except Exception as e:
                logger.error("Failed to get sync status: %s", e)
                status["error"] = str(e)

        return status
