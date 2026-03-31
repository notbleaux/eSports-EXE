"""
Writer Sub-Agent Tasks

Responsible for persisting transformed data to database.
Handles conflict resolution (upserts) and idempotency.
"""

from datetime import datetime
from typing import Dict, Any, List
import logging

from .celery_config import celery_app
from ...database import get_db_pool

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def write_teams(self, transform_result: Dict[str, Any]) -> Dict[str, Any]:
    """Write transformed teams to database.
    
    Args:
        transform_result: Output from transform_teams task
        
    Returns:
        Write operation summary
    """
    try:
        teams = transform_result.get("data", [])
        game = transform_result.get("game")
        
        db_pool = get_db_pool()
        
        created = 0
        updated = 0
        
        async def _write():
            nonlocal created, updated
            async with db_pool.acquire() as conn:
                for team in teams:
                    # Check if team exists
                    existing = await conn.fetchrow(
                        "SELECT id FROM teams WHERE pandascore_id = $1",
                        team["pandascore_id"]
                    )
                    
                    if existing:
                        # Update
                        await conn.execute(
                            """
                            UPDATE teams SET
                                name = $1,
                                slug = $2,
                                acronym = $3,
                                region = $4,
                                logo_url = $5,
                                raw_data = $6,
                                updated_at = NOW()
                            WHERE pandascore_id = $7
                            """,
                            team["name"],
                            team["slug"],
                            team["acronym"],
                            team["region"],
                            team["logo_url"],
                            team["raw_data"],
                            team["pandascore_id"]
                        )
                        updated += 1
                    else:
                        # Insert
                        await conn.execute(
                            """
                            INSERT INTO teams (
                                pandascore_id, name, slug, acronym, game,
                                region, logo_url, raw_data, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                            """,
                            team["pandascore_id"],
                            team["name"],
                            team["slug"],
                            team["acronym"],
                            team["game"],
                            team["region"],
                            team["logo_url"],
                            team["raw_data"]
                        )
                        created += 1
        
        # Run async operation
        import asyncio
        asyncio.run(_write())
        
        result = {
            "entity_type": "teams",
            "game": game,
            "created": created,
            "updated": updated,
            "total": len(teams),
            "written_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Wrote teams: {created} created, {updated} updated")
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to write teams: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def write_players(self, transform_result: Dict[str, Any]) -> Dict[str, Any]:
    """Write transformed players to database."""
    try:
        players = transform_result.get("data", [])
        game = transform_result.get("game")
        
        db_pool = get_db_pool()
        
        created = 0
        updated = 0
        
        import asyncio
        
        async def _write():
            nonlocal created, updated
            async with db_pool.acquire() as conn:
                for player in players:
                    # Resolve team_id from pandascore_id
                    team_id = None
                    if player.get("team_pandascore_id"):
                        team_row = await conn.fetchrow(
                            "SELECT id FROM teams WHERE pandascore_id = $1",
                            player["team_pandascore_id"]
                        )
                        if team_row:
                            team_id = team_row["id"]
                    
                    # Check if player exists
                    existing = await conn.fetchrow(
                        "SELECT id FROM players WHERE pandascore_id = $1",
                        player["pandascore_id"]
                    )
                    
                    if existing:
                        await conn.execute(
                            """
                            UPDATE players SET
                                name = $1,
                                slug = $2,
                                nationality = $3,
                                team_id = $4,
                                raw_data = $5,
                                updated_at = NOW()
                            WHERE pandascore_id = $6
                            """,
                            player["name"],
                            player["slug"],
                            player["nationality"],
                            team_id,
                            player["raw_data"],
                            player["pandascore_id"]
                        )
                        updated += 1
                    else:
                        await conn.execute(
                            """
                            INSERT INTO players (
                                pandascore_id, name, slug, game, nationality,
                                team_id, raw_data, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                            """,
                            player["pandascore_id"],
                            player["name"],
                            player["slug"],
                            player["game"],
                            player["nationality"],
                            team_id,
                            player["raw_data"]
                        )
                        created += 1
        
        asyncio.run(_write())
        
        result = {
            "entity_type": "players",
            "game": game,
            "created": created,
            "updated": updated,
            "total": len(players),
            "written_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Wrote players: {created} created, {updated} updated")
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to write players: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def write_tournaments(self, transform_result: Dict[str, Any]) -> Dict[str, Any]:
    """Write transformed tournaments to database."""
    try:
        tournaments = transform_result.get("data", [])
        game = transform_result.get("game")
        
        db_pool = get_db_pool()
        
        created = 0
        updated = 0
        
        import asyncio
        
        async def _write():
            nonlocal created, updated
            async with db_pool.acquire() as conn:
                for tournament in tournaments:
                    existing = await conn.fetchrow(
                        "SELECT id FROM tournaments WHERE pandascore_id = $1",
                        tournament["pandascore_id"]
                    )
                    
                    if existing:
                        await conn.execute(
                            """
                            UPDATE tournaments SET
                                name = $1,
                                slug = $2,
                                tier = $3,
                                region = $4,
                                start_date = $5,
                                end_date = $6,
                                status = $7,
                                prize_pool = $8,
                                raw_data = $9,
                                updated_at = NOW()
                            WHERE pandascore_id = $10
                            """,
                            tournament["name"],
                            tournament["slug"],
                            tournament["tier"],
                            tournament["region"],
                            tournament["start_date"],
                            tournament["end_date"],
                            tournament["status"],
                            tournament["prize_pool"],
                            tournament["raw_data"],
                            tournament["pandascore_id"]
                        )
                        updated += 1
                    else:
                        await conn.execute(
                            """
                            INSERT INTO tournaments (
                                pandascore_id, name, slug, game, tier, region,
                                start_date, end_date, status, prize_pool,
                                raw_data, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                            """,
                            tournament["pandascore_id"],
                            tournament["name"],
                            tournament["slug"],
                            tournament["game"],
                            tournament["tier"],
                            tournament["region"],
                            tournament["start_date"],
                            tournament["end_date"],
                            tournament["status"],
                            tournament["prize_pool"],
                            tournament["raw_data"]
                        )
                        created += 1
        
        asyncio.run(_write())
        
        result = {
            "entity_type": "tournaments",
            "game": game,
            "created": created,
            "updated": updated,
            "total": len(tournaments),
            "written_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Wrote tournaments: {created} created, {updated} updated")
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to write tournaments: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def write_matches(self, transform_result: Dict[str, Any]) -> Dict[str, Any]:
    """Write transformed matches to database."""
    try:
        matches = transform_result.get("data", [])
        game = transform_result.get("game")
        
        db_pool = get_db_pool()
        
        created = 0
        updated = 0
        
        import asyncio
        
        async def _write():
            nonlocal created, updated
            async with db_pool.acquire() as conn:
                for match in matches:
                    # Resolve team IDs
                    team1_id = None
                    team2_id = None
                    winner_id = None
                    tournament_id = None
                    
                    if match.get("team1_pandascore_id"):
                        row = await conn.fetchrow(
                            "SELECT id FROM teams WHERE pandascore_id = $1",
                            match["team1_pandascore_id"]
                        )
                        if row:
                            team1_id = row["id"]
                    
                    if match.get("team2_pandascore_id"):
                        row = await conn.fetchrow(
                            "SELECT id FROM teams WHERE pandascore_id = $1",
                            match["team2_pandascore_id"]
                        )
                        if row:
                            team2_id = row["id"]
                    
                    if match.get("winner_pandascore_id"):
                        row = await conn.fetchrow(
                            "SELECT id FROM teams WHERE pandascore_id = $1",
                            match["winner_pandascore_id"]
                        )
                        if row:
                            winner_id = row["id"]
                    
                    if match.get("tournament_pandascore_id"):
                        row = await conn.fetchrow(
                            "SELECT id FROM tournaments WHERE pandascore_id = $1",
                            match["tournament_pandascore_id"]
                        )
                        if row:
                            tournament_id = row["id"]
                    
                    # Insert into match_details
                    existing = await conn.fetchrow(
                        "SELECT id FROM match_details WHERE pandascore_id = $1",
                        match["pandascore_id"]
                    )
                    
                    if existing:
                        await conn.execute(
                            """
                            UPDATE match_details SET
                                name = $1,
                                status = $2,
                                scheduled_at = $3,
                                finished_at = $4,
                                team1_id = $5,
                                team2_id = $6,
                                team1_score = $7,
                                team2_score = $8,
                                winner_id = $9,
                                tournament_id = $10,
                                best_of = $11,
                                raw_data = $12,
                                updated_at = NOW()
                            WHERE pandascore_id = $13
                            """,
                            match["name"],
                            match["status"],
                            match["scheduled_at"],
                            match["finished_at"],
                            team1_id,
                            team2_id,
                            match["team1_score"],
                            match["team2_score"],
                            winner_id,
                            tournament_id,
                            match["best_of"],
                            match["raw_data"],
                            match["pandascore_id"]
                        )
                        updated += 1
                    else:
                        await conn.execute(
                            """
                            INSERT INTO match_details (
                                pandascore_id, name, game, status, scheduled_at,
                                finished_at, team1_id, team2_id, team1_score,
                                team2_score, winner_id, tournament_id, best_of,
                                raw_data, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
                            """,
                            match["pandascore_id"],
                            match["name"],
                            game,
                            match["status"],
                            match["scheduled_at"],
                            match["finished_at"],
                            team1_id,
                            team2_id,
                            match["team1_score"],
                            match["team2_score"],
                            winner_id,
                            tournament_id,
                            match["best_of"],
                            match["raw_data"]
                        )
                        created += 1
        
        asyncio.run(_write())
        
        result = {
            "entity_type": "matches",
            "game": game,
            "created": created,
            "updated": updated,
            "total": len(matches),
            "written_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Wrote matches: {created} created, {updated} updated")
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to write matches: {exc}")
        raise self.retry(exc=exc, countdown=60)
