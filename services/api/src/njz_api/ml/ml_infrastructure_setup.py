[Ver001.000] [Part: 2/7, Phase: 1/3, Progress: 30%] [Status: On-Going]

"""
ML Infrastructure Setup for SimRating Training
==============================================

Pre-training infrastructure preparation.
Must be completed BEFORE training on 50K+ real matches.

Components:
1. Data Pipeline Setup (Pandascore sync)
2. Feature Store Configuration
3. Training Environment Preparation
4. Model Registry Setup
5. Experiment Tracking

Author: Technical Lead
Date: 2026-03-30
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import json

import httpx
import asyncpg
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


Base = declarative_base()


@dataclass
class MLTrainingConfig:
    """Configuration for ML training infrastructure"""
    # Data requirements
    min_samples: int = 50000
    target_samples: int = 100000
    
    # Feature engineering
    feature_version: str = "v2.1"
    features: List[str] = None
    
    # Training environment
    training_environment: str = "kaggle"  # kaggle, colab, or local
    gpu_hours_required: int = 30
    
    # Model storage
    model_registry_path: str = "apps/web/public/models/simrating/"
    backup_registry_path: str = "s3://njz-ml-models/simrating/"
    
    # Experiment tracking
    experiment_name: str = f"simrating_v2_{datetime.now().strftime('%Y%m%d')}"
    
    def __post_init__(self):
        if self.features is None:
            self.features = [
                'kd_ratio', 'acs', 'headshot_pct', 'avg_damage_round',
                'first_blood_rate', 'clutch_rate', 'survival_rate',
                'consistency_score', 'impact_score', 'role_adjustment'
            ]


class PandascoreSyncManager:
    """
    Manages data synchronization from PandaScore API.
    Must be run BEFORE ML training to populate database.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.pandascore.co"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"Authorization": f"Bearer {api_key}"}
        )
        self.rate_limit_remaining = 1000
        self.rate_limit_reset = datetime.now()
    
    async def sync_all_games(self, db_pool: asyncpg.Pool) -> Dict:
        """
        Full sync of all game data from PandaScore.
        
        Steps:
        1. Sync teams
        2. Sync players
        3. Sync matches
        4. Sync player stats from matches
        
        Returns:
            Summary of sync operations
        """
        results = {
            'teams': {'added': 0, 'updated': 0, 'errors': []},
            'players': {'added': 0, 'updated': 0, 'errors': []},
            'matches': {'added': 0, 'updated': 0, 'errors': []},
            'player_stats': {'added': 0, 'errors': []}
        }
        
        try:
            # Sync Valorant data
            print("🎮 Syncing Valorant data...")
            val_results = await self._sync_game('valorant', db_pool)
            self._merge_results(results, val_results)
            
            # Sync CS2 data
            print("🎯 Syncing CS2 data...")
            cs_results = await self._sync_game('cs2', db_pool)
            self._merge_results(results, cs_results)
            
            print(f"\n✅ Sync complete!")
            print(f"   Teams: {results['teams']['added']} added, {results['teams']['updated']} updated")
            print(f"   Players: {results['players']['added']} added, {results['players']['updated']} updated")
            print(f"   Matches: {results['matches']['added']} added")
            print(f"   Player Stats: {results['player_stats']['added']} records")
            
        except Exception as e:
            print(f"❌ Sync failed: {e}")
            raise
        
        return results
    
    async def _sync_game(self, game: str, db_pool: asyncpg.Pool) -> Dict:
        """Sync data for a specific game"""
        results = {
            'teams': {'added': 0, 'updated': 0, 'errors': []},
            'players': {'added': 0, 'updated': 0, 'errors': []},
            'matches': {'added': 0, 'updated': 0, 'errors': []},
            'player_stats': {'added': 0, 'errors': []}
        }
        
        # 1. Sync teams
        teams = await self._fetch_teams(game)
        for team in teams:
            try:
                await self._upsert_team(team, game, db_pool)
                results['teams']['added'] += 1
            except Exception as e:
                results['teams']['errors'].append(f"Team {team.get('id')}: {e}")
        
        # 2. Sync players
        players = await self._fetch_players(game)
        for player in players:
            try:
                await self._upsert_player(player, game, db_pool)
                results['players']['added'] += 1
            except Exception as e:
                results['players']['errors'].append(f"Player {player.get('id')}: {e}")
        
        # 3. Sync completed matches
        matches = await self._fetch_matches(game, status='past')
        for match in matches:
            try:
                match_id = await self._upsert_match(match, game, db_pool)
                results['matches']['added'] += 1
                
                # 4. Sync player stats from match
                if match_id:
                    stats_added = await self._sync_match_stats(match, match_id, db_pool)
                    results['player_stats']['added'] += stats_added
                    
            except Exception as e:
                results['matches']['errors'].append(f"Match {match.get('id')}: {e}")
        
        return results
    
    async def _fetch_teams(self, game: str) -> List[Dict]:
        """Fetch all teams for a game"""
        endpoint = f"/{game}/teams"
        teams = []
        page = 1
        
        while True:
            response = await self._get(endpoint, params={'page': page, 'per_page': 100})
            if not response:
                break
            
            teams.extend(response)
            
            if len(response) < 100:
                break
            
            page += 1
            await self._respect_rate_limit()
        
        return teams
    
    async def _fetch_players(self, game: str) -> List[Dict]:
        """Fetch all players for a game"""
        endpoint = f"/{game}/players"
        players = []
        page = 1
        
        while True:
            response = await self._get(endpoint, params={'page': page, 'per_page': 100})
            if not response:
                break
            
            players.extend(response)
            
            if len(response) < 100:
                break
            
            page += 1
            await self._respect_rate_limit()
        
        return players
    
    async def _fetch_matches(self, game: str, status: str = 'past') -> List[Dict]:
        """Fetch matches for a game"""
        endpoint = f"/{game}/matches"
        matches = []
        page = 1
        max_pages = 10  # Limit to avoid rate limits
        
        while page <= max_pages:
            response = await self._get(
                endpoint,
                params={
                    'filter[status]': status,
                    'page': page,
                    'per_page': 100,
                    'sort': '-begin_at'
                }
            )
            if not response:
                break
            
            matches.extend(response)
            
            if len(response) < 100:
                break
            
            page += 1
            await self._respect_rate_limit()
        
        return matches
    
    async def _sync_match_stats(self, match: Dict, match_id: int, db_pool: asyncpg.Pool) -> int:
        """Extract and sync player stats from a match"""
        stats_added = 0
        
        # Get detailed match data
        match_detail = await self._get(f"/matches/{match['id']}")
        if not match_detail:
            return 0
        
        # Extract player stats from games/rounds
        games = match_detail.get('games', [])
        
        for game in games:
            players = game.get('players', [])
            
            for player_data in players:
                try:
                    await self._upsert_player_stats(player_data, match_id, db_pool)
                    stats_added += 1
                except Exception as e:
                    print(f"Warning: Failed to sync stats for player {player_data.get('player_id')}: {e}")
        
        return stats_added
    
    async def _upsert_team(self, team: Dict, game: str, db_pool: asyncpg.Pool):
        """Insert or update a team"""
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO teams (pandascore_id, name, slug, acronym, game, region, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                ON CONFLICT (pandascore_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    slug = EXCLUDED.slug,
                    acronym = EXCLUDED.acronym,
                    region = EXCLUDED.region,
                    updated_at = NOW()
            """,
            team.get('id'),
            team.get('name'),
            team.get('slug'),
            team.get('acronym'),
            game,
            team.get('location')
            )
    
    async def _upsert_player(self, player: Dict, game: str, db_pool: asyncpg.Pool):
        """Insert or update a player"""
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO players (pandascore_id, name, slug, nationality, game, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT (pandascore_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    slug = EXCLUDED.slug,
                    nationality = EXCLUDED.nationality,
                    updated_at = NOW()
            """,
            player.get('id'),
            player.get('name'),
            player.get('slug'),
            player.get('nationality'),
            game
            )
    
    async def _upsert_match(self, match: Dict, game: str, db_pool: asyncpg.Pool) -> Optional[int]:
        """Insert or update a match, return match_id"""
        # Get team IDs
        teams = match.get('opponents', [])
        team1_id = teams[0].get('opponent', {}).get('id') if len(teams) > 0 else None
        team2_id = teams[1].get('opponent', {}).get('id') if len(teams) > 1 else None
        
        # Get winner
        winner = match.get('winner', {})
        winner_id = winner.get('id') if winner else None
        
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO matches (
                    pandascore_id, name, game, status,
                    scheduled_at, finished_at,
                    team1_id, team2_id, winner_id,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                ON CONFLICT (pandascore_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    finished_at = EXCLUDED.finished_at,
                    winner_id = EXCLUDED.winner_id,
                    updated_at = NOW()
                RETURNING id
            """,
            match.get('id'),
            match.get('name'),
            game,
            match.get('status'),
            match.get('begin_at'),
            match.get('end_at'),
            team1_id,
            team2_id,
            winner_id
            )
        
        return row['id'] if row else None
    
    async def _upsert_player_stats(self, player_data: Dict, match_id: int, db_pool: asyncpg.Pool):
        """Insert player stats from a match"""
        player_id = player_data.get('player_id')
        stats = player_data.get('stats', {})
        
        if not player_id or not stats:
            return
        
        async with db_pool.acquire() as conn:
            # Get internal player_id
            player_row = await conn.fetchrow(
                "SELECT id FROM players WHERE pandascore_id = $1",
                player_id
            )
            
            if not player_row:
                return
            
            internal_player_id = player_row['id']
            
            # Insert stats
            await conn.execute("""
                INSERT INTO player_stats (
                    player_id, match_id, game,
                    kills, deaths, assists, headshot_pct,
                    first_bloods, clutches_won, rounds_played,
                    kd_ratio, acs,
                    recorded_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                ON CONFLICT (player_id, match_id) DO NOTHING
            """,
            internal_player_id,
            match_id,
            'valorant',  # TODO: Determine from match
            stats.get('kills', 0),
            stats.get('deaths', 0),
            stats.get('assists', 0),
            stats.get('headshot_percentage', 0),
            stats.get('first_kills', 0),
            stats.get('clutches', 0),
            stats.get('rounds', {}).get('total', 0),
            stats.get('kills', 0) / max(stats.get('deaths', 1), 1),
            stats.get('combat_score', 0) / max(stats.get('rounds', {}).get('total', 1), 1)
            )
    
    async def _get(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make authenticated GET request with rate limit handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Check rate limit
        if self.rate_limit_remaining < 5:
            wait_time = (self.rate_limit_reset - datetime.now()).total_seconds()
            if wait_time > 0:
                print(f"⏳ Rate limit approaching, waiting {wait_time:.0f}s...")
                await asyncio.sleep(wait_time)
        
        try:
            response = await self.client.get(url, params=params)
            
            # Update rate limit info
            self.rate_limit_remaining = int(response.headers.get('X-RateLimit-Remaining', 1000))
            reset_timestamp = int(response.headers.get('X-RateLimit-Reset', 0))
            if reset_timestamp:
                self.rate_limit_reset = datetime.fromtimestamp(reset_timestamp)
            
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                # Rate limited - wait and retry once
                retry_after = int(e.response.headers.get('Retry-After', 60))
                print(f"⏳ Rate limited. Waiting {retry_after}s...")
                await asyncio.sleep(retry_after)
                return await self._get(endpoint, params)  # Retry
            else:
                raise
    
    async def _respect_rate_limit(self):
        """Sleep to respect rate limits"""
        await asyncio.sleep(1.0)  # 1 second between requests = 60/min
    
    def _merge_results(self, target: Dict, source: Dict):
        """Merge sync results"""
        for key in target:
            if key in source:
                if isinstance(target[key], dict):
                    for subkey in target[key]:
                        if subkey in source[key]:
                            if isinstance(target[key][subkey], int):
                                target[key][subkey] += source[key][subkey]
                            elif isinstance(target[key][subkey], list):
                                target[key][subkey].extend(source[key][subkey])


class MLFeatureStore:
    """
    Feature store for ML training.
    Prepares and validates features before training.
    """
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
        self.config = MLTrainingConfig()
    
    async def prepare_training_dataset(self) -> Dict:
        """
        Prepare dataset for ML training.
        
        Returns:
            {
                'X': feature matrix,
                'y': target vector,
                'metadata': training metadata
            }
        """
        print("🏗️  Preparing training dataset...")
        
        # Check sample count
        async with self.db_pool.acquire() as conn:
            count = await conn.fetchval("""
                SELECT COUNT(DISTINCT player_id)
                FROM player_stats
                WHERE recorded_at > NOW() - INTERVAL '90 days'
            """)
        
        if count < self.config.min_samples:
            raise ValueError(
                f"Insufficient samples: {count} < {self.config.min_samples}. "
                f"Run Pandascore sync first."
            )
        
        print(f"   Found {count} players with stats")
        
        # Extract features for each player
        features = []
        targets = []
        
        async with self.db_pool.acquire() as conn:
            player_ids = await conn.fetch("""
                SELECT DISTINCT player_id
                FROM player_stats
                WHERE recorded_at > NOW() - INTERVAL '90 days'
            """)
            
            for row in player_ids:
                player_id = row['player_id']
                feature_vector = await self._extract_player_features(player_id, conn)
                
                if feature_vector:
                    features.append(feature_vector['X'])
                    targets.append(feature_vector['y'])
        
        print(f"   Extracted features for {len(features)} players")
        
        return {
            'X': features,
            'y': targets,
            'metadata': {
                'version': self.config.feature_version,
                'n_samples': len(features),
                'n_features': len(features[0]) if features else 0,
                'created_at': datetime.now().isoformat()
            }
        }
    
    async def _extract_player_features(self, player_id: int, conn: asyncpg.Connection) -> Optional[Dict]:
        """Extract feature vector for a single player"""
        # Get aggregated stats
        row = await conn.fetchrow("""
            SELECT
                AVG(kd_ratio) as avg_kd,
                AVG(acs) as avg_acs,
                AVG(headshot_pct) as avg_hs,
                COUNT(*) as games,
                STDDEV(acs) as acs_std
            FROM player_stats
            WHERE player_id = $1
            AND recorded_at > NOW() - INTERVAL '90 days'
        """, player_id)
        
        if not row or row['games'] < 3:
            return None
        
        # Calculate features
        avg_kd = row['avg_kd'] or 0
        avg_acs = row['avg_acs'] or 0
        avg_hs = row['avg_hs'] or 0
        games = row['games']
        acs_std = row['acs_std'] or 0
        
        # Normalize features
        features = [
            min(avg_kd / 2.0, 1.0),  # K/D normalized
            min(avg_acs / 300.0, 1.0),  # ACS normalized
            min(avg_hs / 30.0, 1.0),  # HS% normalized
            min(games / 20.0, 1.0),  # Consistency (games played)
            1.0 - min(acs_std / 100.0, 1.0)  # Stability (lower std = higher)
        ]
        
        # Target: weighted composite (for supervised training)
        target = (
            features[0] * 0.3 +  # K/D
            features[1] * 0.25 +  # ACS
            features[2] * 0.2 +   # HS%
            features[3] * 0.15 +  # Games
            features[4] * 0.1     # Stability
        )
        
        return {'X': features, 'y': target}


# Setup and validation commands
async def setup_ml_infrastructure():
    """
    Main setup function for ML infrastructure.
    Run this before training.
    """
    print("=" * 60)
    print("ML Infrastructure Setup for SimRating Training")
    print("=" * 60)
    
    # 1. Check environment
    print("\n1. Checking environment...")
    required_env = ['PANDASCORE_API_KEY', 'DATABASE_URL']
    missing = [var for var in required_env if not os.getenv(var)]
    
    if missing:
        print(f"❌ Missing environment variables: {missing}")
        return False
    
    print("✅ Environment variables set")
    
    # 2. Connect to database
    print("\n2. Connecting to database...")
    db_pool = await asyncpg.create_pool(os.getenv('DATABASE_URL'))
    print("✅ Database connected")
    
    # 3. Check current data
    print("\n3. Checking current data...")
    async with db_pool.acquire() as conn:
        player_count = await conn.fetchval("SELECT COUNT(*) FROM players")
        stats_count = await conn.fetchval("SELECT COUNT(*) FROM player_stats")
        match_count = await db_pool.fetchval("SELECT COUNT(*) FROM matches")
    
    print(f"   Players: {player_count}")
    print(f"   Player Stats: {stats_count}")
    print(f"   Matches: {match_count}")
    
    if stats_count < 50000:
        print(f"\n⚠️  Insufficient data for ML training ({stats_count} < 50000)")
        print("   Running Pandascore sync...")
        
        # 4. Sync data
        sync_manager = PandascoreSyncManager(
            api_key=os.getenv('PANDASCORE_API_KEY')
        )
        
        results = await sync_manager.sync_all_games(db_pool)
        
        # Re-check
        async with db_pool.acquire() as conn:
            stats_count = await conn.fetchval("SELECT COUNT(*) FROM player_stats")
        
        if stats_count < 50000:
            print(f"⚠️  Still insufficient data ({stats_count}). More matches needed.")
        else:
            print(f"✅ Sufficient data available: {stats_count} stats records")
    
    # 5. Prepare feature store
    print("\n4. Preparing feature store...")
    feature_store = MLFeatureStore(db_pool)
    
    try:
        dataset = await feature_store.prepare_training_dataset()
        print(f"✅ Dataset prepared: {dataset['metadata']['n_samples']} samples")
        
        # 6. Export for training
        print("\n5. Exporting for Kaggle training...")
        export_path = "data/training/kaggle_export/"
        os.makedirs(export_path, exist_ok=True)
        
        with open(f"{export_path}training_data.json", 'w') as f:
            json.dump(dataset, f)
        
        print(f"✅ Data exported to {export_path}")
        print("\n" + "=" * 60)
        print("Next Steps:")
        print("1. Upload to Kaggle: kaggle datasets create")
        print("2. Run training notebook")
        print("3. Download model artifacts")
        print("4. Deploy to apps/web/public/models/simrating/")
        print("=" * 60)
        
        return True
        
    except ValueError as e:
        print(f"❌ {e}")
        return False
    
    finally:
        await db_pool.close()


# CLI entry point
if __name__ == "__main__":
    success = asyncio.run(setup_ml_infrastructure())
    exit(0 if success else 1)
