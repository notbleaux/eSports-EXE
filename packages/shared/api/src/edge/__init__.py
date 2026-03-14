"""
Edge Cache Sync Package — Turso Edge Database synchronization for SATOR platform.

This package provides one-way replication from PostgreSQL (primary) to Turso (edge)
for low-latency global data access. Uses libsql_client for async communication
with Turso's edge SQLite databases.

Components:
    - TursoEdgeSync: Main sync service with checkpoint tracking
    - Batch operations for efficient data transfer
    - Automatic cleanup of records older than 18 months

Usage:
    from api.src.edge import TursoEdgeSync
    
    sync = TursoEdgeSync(
        pg_url=os.environ["DATABASE_URL"],
        turso_url=os.environ["TURSO_DATABASE_URL"],
        turso_token=os.environ["TURSO_AUTH_TOKEN"]
    )
    await sync.initialize()
    await sync.sync_recent_data()
"""
from api.src.edge.turso_sync import TursoEdgeSync

__all__ = ["TursoEdgeSync"]
