"""
PandaScore Data Ingestion Service for ROTAS.

Handles fetching, transforming, and storing esports data from PandaScore API.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from ...clients.pandascore import PandaScoreClient
from ...database import get_db_pool
from ...redis_cache import RedisCache

logger = logging.getLogger(__name__)


@dataclass
class IngestionResult:
    """Result of a data ingestion run."""
    source: str
    entity_type: str
    records_processed: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    error_message: Optional[str] = None


class PandaScoreIngestionService:
    """Service for ingesting data from PandaScore API."""
    
    def __init__(self):
        self.client = PandaScoreClient()
        self.cache = RedisCache()
        self._db_pool = None
    
    async def _get_db(self):
        """Get database pool."""
        if self._db_pool is None:
            self._db_pool = await get_db_pool()
        return self._db_pool
    
    async def ingest_teams(self, game: str = "valorant", limit: int = 100) -> IngestionResult:
        """Ingest teams from PandaScore.
        
        Args:
            game: Game to fetch teams for ('valorant' or 'cs2')
            limit: Maximum number of teams to fetch
            
        Returns:
            IngestionResult with counts and status
        """
        result = IngestionResult(
            source="pandascore",
            entity_type="teams"
        )
        
        try:
            logger.info(f"Starting team ingestion for {game}")
            teams = await self.client.get_teams(game=game, per_page=limit)
            
            pool = await self._get_db()
            
            for team_data in teams:
                try:
                    # Check if team exists
                    existing = await pool.fetchrow(
                        "SELECT id FROM teams WHERE pandascore_id = $1",
                        team_data["id"]
                    )
                    
                    if existing:
                        # Update existing team
                        await pool.execute(
                            """
                            UPDATE teams 
                            SET name = $1, acronym = $2, region = $3, updated_at = NOW()
                            WHERE pandascore_id = $4
                            """,
                            team_data.get("name", ""),
                            team_data.get("acronym"),
                            team_data.get("location"),
                            team_data["id"]
                        )
                        result.records_updated += 1
                    else:
                        # Insert new team
                        await pool.execute(
                            """
                            INSERT INTO teams (pandascore_id, name, slug, acronym, game, region)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            """,
                            team_data["id"],
                            team_data.get("name", ""),
                            team_data.get("slug", str(team_data["id"])),
                            team_data.get("acronym"),
                            game,
                            team_data.get("location")
                        )
                        result.records_created += 1
                    
                    result.records_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing team {team_data.get('id')}: {e}")
                    result.records_failed += 1
            
            logger.info(f"Team ingestion completed: {result.records_created} created, {result.records_updated} updated")
            
        except Exception as e:
            logger.error(f"Team ingestion failed: {e}")
            result.error_message = str(e)
        
        return result
    
    async def ingest_players(self, game: str = "valorant", limit: int = 500) -> IngestionResult:
        """Ingest players from PandaScore.
        
        Args:
            game: Game to fetch players for
            limit: Maximum number of players to fetch
            
        Returns:
            IngestionResult with counts and status
        """
        result = IngestionResult(
            source="pandascore",
            entity_type="players"
        )
        
        try:
            logger.info(f"Starting player ingestion for {game}")
            
            # Get all teams first (to map team_id)
            pool = await self._get_db()
            team_mapping = {}
            teams = await pool.fetch("SELECT id, pandascore_id FROM teams WHERE game = $1", game)
            for team in teams:
                team_mapping[team["pandascore_id"]] = team["id"]
            
            # Fetch players
            players = await self.client.get_players(game=game, per_page=limit)
            
            for player_data in players:
                try:
                    # Map team_id if available
                    team_id = None
                    if player_data.get("current_team"):
                        team_ps_id = player_data["current_team"].get("id")
                        team_id = team_mapping.get(team_ps_id)
                    
                    # Check if player exists
                    existing = await pool.fetchrow(
                        "SELECT id FROM players WHERE pandascore_id = $1",
                        player_data["id"]
                    )
                    
                    if existing:
                        # Update existing player
                        await pool.execute(
                            """
                            UPDATE players 
                            SET name = $1, nationality = $2, team_id = $3, updated_at = NOW()
                            WHERE pandascore_id = $4
                            """,
                            player_data.get("name", ""),
                            player_data.get("nationality"),
                            team_id,
                            player_data["id"]
                        )
                        result.records_updated += 1
                    else:
                        # Insert new player
                        await pool.execute(
                            """
                            INSERT INTO players (pandascore_id, name, slug, nationality, game, team_id)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            """,
                            player_data["id"],
                            player_data.get("name", ""),
                            player_data.get("slug", str(player_data["id"])),
                            player_data.get("nationality"),
                            game,
                            team_id
                        )
                        result.records_created += 1
                    
                    result.records_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing player {player_data.get('id')}: {e}")
                    result.records_failed += 1
            
            logger.info(f"Player ingestion completed: {result.records_created} created, {result.records_updated} updated")
            
        except Exception as e:
            logger.error(f"Player ingestion failed: {e}")
            result.error_message = str(e)
        
        return result
    
    async def ingest_matches(self, game: str = "valorant", days_back: int = 30) -> IngestionResult:
        """Ingest matches from PandaScore.
        
        Args:
            game: Game to fetch matches for
            days_back: How many days of history to fetch
            
        Returns:
            IngestionResult with counts and status
        """
        result = IngestionResult(
            source="pandascore",
            entity_type="matches"
        )
        
        try:
            logger.info(f"Starting match ingestion for {game} (last {days_back} days)")
            
            # Calculate date range
            end_date = datetime.utcnow()
            begin_date = end_date - timedelta(days=days_back)
            
            # Get team mapping
            pool = await self._get_db()
            team_mapping = {}
            teams = await pool.fetch("SELECT id, pandascore_id FROM teams WHERE game = $1", game)
            for team in teams:
                team_mapping[team["pandascore_id"]] = team["id"]
            
            # Fetch matches
            matches = await self.client.get_matches(
                game=game,
                begin_at_begin=begin_date.isoformat(),
                begin_at_end=end_date.isoformat()
            )
            
            for match_data in matches:
                try:
                    await self._process_match(match_data, game, team_mapping, pool, result)
                except Exception as e:
                    logger.error(f"Error processing match {match_data.get('id')}: {e}")
                    result.records_failed += 1
            
            logger.info(f"Match ingestion completed: {result.records_created} created, {result.records_updated} updated")
            
        except Exception as e:
            logger.error(f"Match ingestion failed: {e}")
            result.error_message = str(e)
        
        return result
    
    async def _process_match(
        self, 
        match_data: Dict[str, Any], 
        game: str, 
        team_mapping: Dict[int, int],
        pool,
        result: IngestionResult
    ):
        """Process a single match record."""
        # Map teams
        team1_id = None
        team2_id = None
        winner_id = None
        
        if match_data.get("opponents") and len(match_data["opponents"]) >= 2:
            t1_ps = match_data["opponents"][0].get("opponent", {}).get("id")
            t2_ps = match_data["opponents"][1].get("opponent", {}).get("id")
            team1_id = team_mapping.get(t1_ps)
            team2_id = team_mapping.get(t2_ps)
        
        if match_data.get("winner"):
            winner_ps = match_data["winner"].get("id")
            winner_id = team_mapping.get(winner_ps)
        
        # Get scores
        team1_score = 0
        team2_score = 0
        if match_data.get("results"):
            for r in match_data["results"]:
                if r.get("team_id") == match_data["opponents"][0]["opponent"]["id"]:
                    team1_score = r.get("score", 0)
                elif r.get("team_id") == match_data["opponents"][1]["opponent"]["id"]:
                    team2_score = r.get("score", 0)
        
        # Parse timestamps
        scheduled_at = None
        if match_data.get("scheduled_at"):
            scheduled_at = datetime.fromisoformat(match_data["scheduled_at"].replace("Z", "+00:00"))
        
        finished_at = None
        if match_data.get("end_at"):
            finished_at = datetime.fromisoformat(match_data["end_at"].replace("Z", "+00:00"))
        
        # Check if match exists
        existing = await pool.fetchrow(
            "SELECT id FROM match_details WHERE pandascore_id = $1",
            match_data["id"]
        )
        
        if existing:
            # Update existing match
            await pool.execute(
                """
                UPDATE match_details 
                SET name = $1, status = $2, scheduled_at = $3, finished_at = $4,
                    team1_id = $5, team2_id = $6, winner_id = $7,
                    team1_score = $8, team2_score = $9, updated_at = NOW()
                WHERE pandascore_id = $10
                """,
                match_data.get("name", "Unknown Match"),
                match_data.get("status", "not_started"),
                scheduled_at,
                finished_at,
                team1_id,
                team2_id,
                winner_id,
                team1_score,
                team2_score,
                match_data["id"]
            )
            result.records_updated += 1
        else:
            # Insert new match
            await pool.execute(
                """
                INSERT INTO match_details 
                (pandascore_id, name, game, status, scheduled_at, finished_at,
                 team1_id, team2_id, winner_id, team1_score, team2_score)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                """,
                match_data["id"],
                match_data.get("name", "Unknown Match"),
                game,
                match_data.get("status", "not_started"),
                scheduled_at,
                finished_at,
                team1_id,
                team2_id,
                winner_id,
                team1_score,
                team2_score
            )
            result.records_created += 1
        
        result.records_processed += 1
    
    async def ingest_tournaments(self, game: str = "valorant") -> IngestionResult:
        """Ingest tournaments from PandaScore.
        
        Args:
            game: Game to fetch tournaments for
            
        Returns:
            IngestionResult with counts and status
        """
        result = IngestionResult(
            source="pandascore",
            entity_type="tournaments"
        )
        
        try:
            logger.info(f"Starting tournament ingestion for {game}")
            
            # Get running and upcoming tournaments
            tournaments = await self.client.get_tournaments(
                game=game,
                status=["running", "upcoming", "finished"]
            )
            
            pool = await self._get_db()
            
            for tournament_data in tournaments:
                try:
                    # Determine tier based on prize pool or series tier
                    tier = self._determine_tier(tournament_data)
                    
                    # Parse dates
                    start_date = None
                    end_date = None
                    if tournament_data.get("begin_at"):
                        start_date = datetime.fromisoformat(tournament_data["begin_at"].replace("Z", "+00:00"))
                    if tournament_data.get("end_at"):
                        end_date = datetime.fromisoformat(tournament_data["end_at"].replace("Z", "+00:00"))
                    
                    # Check if tournament exists
                    existing = await pool.fetchrow(
                        "SELECT id FROM tournaments WHERE pandascore_id = $1",
                        tournament_data["id"]
                    )
                    
                    if existing:
                        await pool.execute(
                            """
                            UPDATE tournaments 
                            SET name = $1, tier = $2, status = $3, start_date = $4, end_date = $5,
                                prize_pool = $6, updated_at = NOW()
                            WHERE pandascore_id = $7
                            """,
                            tournament_data.get("name", ""),
                            tier,
                            tournament_data.get("status", "upcoming"),
                            start_date,
                            end_date,
                            str(tournament_data.get("prizepool", "")) if tournament_data.get("prizepool") else None,
                            tournament_data["id"]
                        )
                        result.records_updated += 1
                    else:
                        await pool.execute(
                            """
                            INSERT INTO tournaments 
                            (pandascore_id, name, slug, game, tier, status, start_date, end_date, prize_pool)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                            """,
                            tournament_data["id"],
                            tournament_data.get("name", ""),
                            tournament_data.get("slug", str(tournament_data["id"])),
                            game,
                            tier,
                            tournament_data.get("status", "upcoming"),
                            start_date,
                            end_date,
                            str(tournament_data.get("prizepool", "")) if tournament_data.get("prizepool") else None
                        )
                        result.records_created += 1
                    
                    result.records_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing tournament {tournament_data.get('id')}: {e}")
                    result.records_failed += 1
            
            logger.info(f"Tournament ingestion completed: {result.records_created} created, {result.records_updated} updated")
            
        except Exception as e:
            logger.error(f"Tournament ingestion failed: {e}")
            result.error_message = str(e)
        
        return result
    
    def _determine_tier(self, tournament_data: Dict[str, Any]) -> Optional[str]:
        """Determine tournament tier based on available data."""
        # Check series tier first
        if tournament_data.get("serie"):
            serie_tier = tournament_data["serie"].get("tier")
            if serie_tier:
                return serie_tier
        
        # Check prize pool
        prizepool = tournament_data.get("prizepool")
        if prizepool:
            if prizepool >= 1000000:
                return "S"
            elif prizepool >= 500000:
                return "A"
            elif prizepool >= 100000:
                return "B"
            else:
                return "C"
        
        return None
    
    async def run_full_sync(self, game: str = "valorant") -> Dict[str, IngestionResult]:
        """Run a full data sync for a game.
        
        Args:
            game: Game to sync
            
        Returns:
            Dictionary of results by entity type
        """
        logger.info(f"Starting full sync for {game}")
        
        results = {}
        
        # Order matters: teams → players → tournaments → matches
        results["teams"] = await self.ingest_teams(game=game)
        results["players"] = await self.ingest_players(game=game)
        results["tournaments"] = await self.ingest_tournaments(game=game)
        results["matches"] = await self.ingest_matches(game=game, days_back=30)
        
        logger.info(f"Full sync completed for {game}")
        
        return results
