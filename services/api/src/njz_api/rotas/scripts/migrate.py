#!/usr/bin/env python3
"""
Database migration script for ROTAS data models.

Creates tables for:
- Tournaments
- Match details with round-by-round data
- Player match statistics
- Career statistics aggregation
- Team statistics
- Data ingestion logging
"""

import asyncio
import asyncpg
import os
import sys

# Add parent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from njz_api.database import get_db_pool, close_db_pool


async def create_tables():
    """Create all ROTAS tables."""
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            print("Creating ROTAS tables...")
            
            # Tournaments table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS tournaments (
                    id SERIAL PRIMARY KEY,
                    pandascore_id INTEGER UNIQUE NOT NULL,
                    name VARCHAR(300) NOT NULL,
                    slug VARCHAR(300) UNIQUE NOT NULL,
                    game VARCHAR(20) NOT NULL,
                    tier VARCHAR(10),
                    region VARCHAR(50),
                    prize_pool VARCHAR(100),
                    start_date TIMESTAMP,
                    end_date TIMESTAMP,
                    status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game);
                CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
            """)
            print("✓ tournaments table created")
            
            # Match details table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS match_details (
                    id SERIAL PRIMARY KEY,
                    pandascore_id INTEGER UNIQUE NOT NULL,
                    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
                    name VARCHAR(300) NOT NULL,
                    game VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
                    scheduled_at TIMESTAMP,
                    started_at TIMESTAMP,
                    finished_at TIMESTAMP,
                    team1_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
                    team2_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
                    winner_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
                    team1_score INTEGER DEFAULT 0,
                    team2_score INTEGER DEFAULT 0,
                    best_of INTEGER DEFAULT 3,
                    rounds_data JSONB,
                    map_veto JSONB,
                    economy_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_match_details_game ON match_details(game);
                CREATE INDEX IF NOT EXISTS idx_match_details_status ON match_details(status);
                CREATE INDEX IF NOT EXISTS idx_match_details_scheduled ON match_details(scheduled_at);
                CREATE INDEX IF NOT EXISTS idx_match_details_tournament ON match_details(tournament_id);
            """)
            print("✓ match_details table created")
            
            # Match player stats table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS match_player_stats (
                    id SERIAL PRIMARY KEY,
                    match_id INTEGER REFERENCES match_details(id) ON DELETE CASCADE,
                    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
                    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
                    game VARCHAR(20) NOT NULL,
                    kills INTEGER DEFAULT 0,
                    deaths INTEGER DEFAULT 0,
                    assists INTEGER DEFAULT 0,
                    kd_ratio FLOAT DEFAULT 0.0,
                    headshots INTEGER DEFAULT 0,
                    headshot_pct FLOAT DEFAULT 0.0,
                    first_bloods INTEGER DEFAULT 0,
                    first_deaths INTEGER DEFAULT 0,
                    clutches_won INTEGER DEFAULT 0,
                    clutches_lost INTEGER DEFAULT 0,
                    double_kills INTEGER DEFAULT 0,
                    triple_kills INTEGER DEFAULT 0,
                    quad_kills INTEGER DEFAULT 0,
                    aces INTEGER DEFAULT 0,
                    rounds_played INTEGER DEFAULT 0,
                    rounds_won INTEGER DEFAULT 0,
                    damage_dealt INTEGER DEFAULT 0,
                    damage_per_round FLOAT DEFAULT 0.0,
                    acs FLOAT DEFAULT 0.0,
                    kast_pct FLOAT DEFAULT 0.0,
                    impact_rating FLOAT DEFAULT 0.0,
                    normalized_rating FLOAT DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_mps_match ON match_player_stats(match_id);
                CREATE INDEX IF NOT EXISTS idx_mps_player ON match_player_stats(player_id);
                CREATE INDEX IF NOT EXISTS idx_mps_game ON match_player_stats(game);
                CREATE INDEX IF NOT EXISTS idx_mps_normalized_rating ON match_player_stats(normalized_rating);
            """)
            print("✓ match_player_stats table created")
            
            # Player career stats table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS player_career_stats (
                    id SERIAL PRIMARY KEY,
                    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
                    game VARCHAR(20) NOT NULL,
                    total_matches INTEGER DEFAULT 0,
                    matches_won INTEGER DEFAULT 0,
                    matches_lost INTEGER DEFAULT 0,
                    total_rounds INTEGER DEFAULT 0,
                    rounds_won INTEGER DEFAULT 0,
                    total_kills INTEGER DEFAULT 0,
                    total_deaths INTEGER DEFAULT 0,
                    total_assists INTEGER DEFAULT 0,
                    overall_kd FLOAT DEFAULT 0.0,
                    avg_kills_per_match FLOAT DEFAULT 0.0,
                    avg_damage_per_match FLOAT DEFAULT 0.0,
                    avg_kills_per_round FLOAT DEFAULT 0.0,
                    avg_damage_per_round FLOAT DEFAULT 0.0,
                    total_first_bloods INTEGER DEFAULT 0,
                    total_clutches_won INTEGER DEFAULT 0,
                    clutch_success_rate FLOAT DEFAULT 0.0,
                    rating_std_dev FLOAT DEFAULT 0.0,
                    consistency_score FLOAT DEFAULT 0.0,
                    recent_matches INTEGER DEFAULT 0,
                    recent_win_rate FLOAT DEFAULT 0.0,
                    recent_avg_rating FLOAT DEFAULT 0.0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_career_player_game 
                    ON player_career_stats(player_id, game);
            """)
            print("✓ player_career_stats table created")
            
            # Team stats table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS team_stats (
                    id SERIAL PRIMARY KEY,
                    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
                    game VARCHAR(20) NOT NULL,
                    total_matches INTEGER DEFAULT 0,
                    matches_won INTEGER DEFAULT 0,
                    matches_lost INTEGER DEFAULT 0,
                    win_rate FLOAT DEFAULT 0.0,
                    total_rounds INTEGER DEFAULT 0,
                    rounds_won INTEGER DEFAULT 0,
                    rounds_lost INTEGER DEFAULT 0,
                    round_win_rate FLOAT DEFAULT 0.0,
                    map_stats JSONB,
                    recent_form JSONB,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_team_stats_team_game 
                    ON team_stats(team_id, game);
            """)
            print("✓ team_stats table created")
            
            # Data ingestion log table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS data_ingestion_log (
                    id SERIAL PRIMARY KEY,
                    source VARCHAR(50) NOT NULL,
                    entity_type VARCHAR(50) NOT NULL,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    status VARCHAR(20) NOT NULL DEFAULT 'running',
                    records_processed INTEGER DEFAULT 0,
                    records_created INTEGER DEFAULT 0,
                    records_updated INTEGER DEFAULT 0,
                    records_failed INTEGER DEFAULT 0,
                    error_message TEXT,
                    request_params JSONB
                );
                CREATE INDEX IF NOT EXISTS idx_ingestion_status ON data_ingestion_log(status);
                CREATE INDEX IF NOT EXISTS idx_ingestion_source ON data_ingestion_log(source);
            """)
            print("✓ data_ingestion_log table created")
            
            print("\n✅ All ROTAS tables created successfully!")
            
    except Exception as e:
        print(f"\n❌ Error creating tables: {e}")
        raise
    finally:
        await close_db_pool()


async def drop_tables():
    """Drop all ROTAS tables (for reset)."""
    pool = await get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            print("Dropping ROTAS tables...")
            
            tables = [
                "data_ingestion_log",
                "team_stats",
                "player_career_stats",
                "match_player_stats",
                "match_details",
                "tournaments"
            ]
            
            for table in tables:
                await conn.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
                print(f"✓ Dropped {table}")
            
            print("\n✅ All ROTAS tables dropped!")
            
    except Exception as e:
        print(f"\n❌ Error dropping tables: {e}")
        raise
    finally:
        await close_db_pool()


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="ROTAS database migration")
    parser.add_argument(
        "command",
        choices=["create", "drop", "reset"],
        help="Command: create tables, drop tables, or reset (drop + create)"
    )
    
    args = parser.parse_args()
    
    if args.command == "create":
        await create_tables()
    elif args.command == "drop":
        await drop_tables()
    elif args.command == "reset":
        await drop_tables()
        await create_tables()


if __name__ == "__main__":
    asyncio.run(main())
