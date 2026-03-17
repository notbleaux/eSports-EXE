"""Local Cache - SQLite fallback for offline/development"""

import sqlite3
import json
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
import aiosqlite


class LocalCache:
    def __init__(self, db_path: str = "data_cache.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)

    async def init_db(self):
        """Initialize cache tables"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    tenet_id TEXT,
                    table_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
            """
            )
            await db.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_cache_tenet ON cache(tenet_id, table_name)
            """
            )
            await db.commit()

    async def store(
        self, key: str, data: Any, tenet_id: str, table: str, ttl_hours: int = 24
    ):
        """Store data with TTL"""
        expires = datetime.now().timestamp() + (ttl_hours * 3600)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO cache (key, data, tenet_id, table_name, expires_at) VALUES (?, ?, ?, ?, ?)",
                (key, json.dumps(data), tenet_id, table, expires),
            )
            await db.commit()

    async def get(self, key: str) -> Dict[str, Any] | None:
        """Get cached data"""
        async with aiosqlite.connect(self.db_path) as db:
            row = await db.execute_fetchall(
                "SELECT data FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)",
                (key, datetime.now().timestamp()),
            )
            if row:
                return json.loads(row[0][0])
            return None

    async def get_by_table(self, tenet_id: str, table: str) -> List[Dict[str, Any]]:
        """Get all for table"""
        async with aiosqlite.connect(self.db_path) as db:
            rows = await db.execute_fetchall(
                "SELECT data FROM cache WHERE tenet_id = ? AND table_name = ? AND (expires_at IS NULL OR expires_at > ?)",
                (tenet_id, table, datetime.now().timestamp()),
            )
            return [json.loads(r[0]) for r in rows]

    async def cleanup_expired(self):
        """Remove expired entries"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?",
                (datetime.now().timestamp(),),
            )
            await db.commit()


# Example
async def main():
    cache = LocalCache()
    await cache.init_db()

    await cache.store(
        "vlr_matches_20240601",
        [{"match_id": "123", "teams": "Sentinels vs Gen.G"}],
        "valorant",
        "matches",
    )

    data = await cache.get("vlr_matches_20240601")
    print("Cached data:", data)


if __name__ == "__main__":
    asyncio.run(main())
