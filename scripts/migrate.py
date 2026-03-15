#!/usr/bin/env python3
"""
[Ver001.000] — SATOR Database Migration Runner
Smart migration execution for Libre-X-eSport 4NJZ4 TENET Platform
"""

import asyncio
import os
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Tuple
import logging

import asyncpg

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("migration")


@dataclass
class Migration:
    """Represents a single migration file."""
    number: int
    name: str
    path: Path
    source: str  # 'axiom' or 'api'


# Migration paths relative to project root
MIGRATION_PATHS = {
    'axiom': Path("packages/shared/axiom-esports-data/infrastructure/migrations"),
    'api': Path("packages/shared/api/migrations"),
}

# Migration order: 001-012 (axiom), 013-018 (api), 019 (axiom)
MIGRATION_ORDER = [
    ('axiom', list(range(1, 13))),    # 001-012
    ('api', list(range(13, 19))),     # 013-018
    ('axiom', [19]),                  # 019
]


class MigrationRunner:
    """Handles database migration execution."""
    
    def __init__(self, dsn: str):
        self.dsn = dsn
        self.pool: Optional[asyncpg.Pool] = None
        
    async def connect(self):
        """Establish database connection pool."""
        self.pool = await asyncpg.create_pool(
            dsn=self.dsn,
            min_size=1,
            max_size=5,
            command_timeout=60
        )
        logger.info("Database connection established")
        
    async def ensure_migration_table(self):
        """Create migration tracking table if not exists."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS _migrations (
                    id SERIAL PRIMARY KEY,
                    migration_number INTEGER NOT NULL UNIQUE,
                    migration_name VARCHAR(255) NOT NULL,
                    source VARCHAR(50) NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    checksum VARCHAR(64),
                    execution_time_ms INTEGER
                )
            """)
            logger.info("Migration tracking table ready")
            
    async def get_applied_migrations(self) -> set:
        """Get set of already applied migration numbers."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT migration_number FROM _migrations"
            )
            return {row['migration_number'] for row in rows}
            
    def discover_migrations(self) -> List[Migration]:
        """Discover all migration files in the project."""
        migrations = []
        project_root = Path(__file__).parent.parent
        
        for source, numbers in [
            ('axiom', list(range(1, 13)) + [19]),
            ('api', list(range(13, 19)))
        ]:
            base_path = project_root / MIGRATION_PATHS[source]
            for num in numbers:
                # Find file with this migration number
                pattern = f"{num:03d}_*.sql"
                matches = list(base_path.glob(pattern))
                if matches:
                    path = matches[0]
                    name = path.stem
                    migrations.append(Migration(num, name, path, source))
                else:
                    logger.warning(f"Migration {num:03d} not found in {source}")
                    
        return sorted(migrations, key=lambda m: m.number)
        
    async def run_migration(self, migration: Migration) -> Tuple[bool, Optional[str]]:
        """Execute a single migration. Returns (success, error_message)."""
        logger.info(f"Running migration {migration.number:03d}: {migration.name}")
        
        # Read migration SQL
        sql = migration.path.read_text(encoding='utf-8')
        
        async with self.pool.acquire() as conn:
            start_time = asyncio.get_event_loop().time()
            
            try:
                # Execute migration in transaction
                async with conn.transaction():
                    await conn.execute(sql)
                    
                    # Record migration
                    await conn.execute(
                        """
                        INSERT INTO _migrations 
                            (migration_number, migration_name, source, checksum)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (migration_number) DO NOTHING
                        """,
                        migration.number,
                        migration.name,
                        migration.source,
                        None  # Could add SHA256 checksum here
                    )
                    
                execution_time = int((asyncio.get_event_loop().time() - start_time) * 1000)
                logger.info(f"✅ Migration {migration.number:03d} completed in {execution_time}ms")
                return True, None
                
            except asyncpg.UniqueViolationError:
                logger.info(f"⏭️  Migration {migration.number:03d} already applied (idempotent)")
                return True, None
            except Exception as e:
                execution_time = int((asyncio.get_event_loop().time() - start_time) * 1000)
                logger.error(f"❌ Migration {migration.number:03d} failed after {execution_time}ms: {e}")
                return False, str(e)
                
    async def run_all(self, dry_run: bool = False):
        """Execute all pending migrations in order."""
        await self.connect()
        await self.ensure_migration_table()
        
        applied = await self.get_applied_migrations()
        migrations = self.discover_migrations()
        
        pending = [m for m in migrations if m.number not in applied]
        
        if not pending:
            logger.info("✨ All migrations already applied!")
            return
            
        logger.info(f"Found {len(pending)} pending migrations")
        
        if dry_run:
            logger.info("DRY RUN - Would execute:")
            for m in pending:
                logger.info(f"  - {m.number:03d}: {m.name} ({m.source})")
            return
            
        # Execute migrations
        failed = []
        for migration in pending:
            success, error = await self.run_migration(migration)
            if not success:
                failed.append((migration, error))
                logger.error(f"Stopping due to migration failure")
                break
                
        # Summary
        if failed:
            logger.error(f"\n❌ MIGRATION FAILED")
            for m, err in failed:
                logger.error(f"   {m.number:03d}: {err}")
            sys.exit(1)
        else:
            total = len(migrations)
            logger.info(f"\n✅ ALL MIGRATIONS COMPLETE ({total} total)")
            
    async def verify_schema(self):
        """Verify schema integrity after migrations."""
        logger.info("\n--- Schema Verification ---")
        
        async with self.pool.acquire() as conn:
            # Count tables
            tables = await conn.fetch("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            
            logger.info(f"Tables created: {len(tables)}")
            for t in tables:
                logger.info(f"  - {t['table_name']}")
                
            # Check for expected core tables
            expected = [
                'player_performance',
                'user_tokens',
                'token_transactions',
                'daily_claims',
                '_migrations'
            ]
            
            table_names = {t['table_name'] for t in tables}
            missing = [t for t in expected if t not in table_names]
            
            if missing:
                logger.warning(f"Missing expected tables: {missing}")
            else:
                logger.info("✅ All expected core tables present")
                
            return len(tables), missing


def get_database_url() -> str:
    """Get database URL from environment or construct from parts."""
    # Check for explicit DATABASE_URL
    if url := os.getenv('DATABASE_URL'):
        return url
        
    # Build from components
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '5432')
    user = os.getenv('DB_USER', 'sator')
    password = os.getenv('DB_PASSWORD', 'sator_dev_2025')
    database = os.getenv('DB_NAME', 'sator')
    
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="SATOR Database Migration Runner")
    parser.add_argument('--dry-run', action='store_true', help='Show what would be executed')
    parser.add_argument('--verify-only', action='store_true', help='Only verify schema, no migrations')
    parser.add_argument('--dsn', help='Database connection string')
    args = parser.parse_args()
    
    dsn = args.dsn or get_database_url()
    
    runner = MigrationRunner(dsn)
    
    try:
        if args.verify_only:
            await runner.connect()
            await runner.verify_schema()
        else:
            await runner.run_all(dry_run=args.dry_run)
            if not args.dry_run:
                await runner.verify_schema()
    except asyncpg.PostgresError as e:
        logger.error(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
