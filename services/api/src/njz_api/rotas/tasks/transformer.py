"""
Transformer Sub-Agent Tasks

Responsible for normalizing and enriching raw API data.
Converts PandaScore format to ROTAS internal schema.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

from .celery_config import celery_app

logger = logging.getLogger(__name__)


def _determine_tier(tournament_data: Dict) -> Optional[str]:
    """Determine tournament tier from PandaScore data."""
    # Check serie tier first
    serie = tournament_data.get("serie", {})
    if serie and serie.get("tier"):
        return serie.get("tier")
    
    # Fall back to prizepool
    prizepool = tournament_data.get("prizepool", 0) or 0
    if prizepool >= 1_000_000:
        return "S"
    elif prizepool >= 500_000:
        return "A"
    elif prizepool >= 100_000:
        return "B"
    elif prizepool > 0:
        return "C"
    
    return None


def _normalize_status(pandascore_status: str) -> str:
    """Normalize PandaScore status to ROTAS enum."""
    status_map = {
        "not_started": "not_started",
        "running": "running",
        "finished": "finished",
        "canceled": "canceled"
    }
    return status_map.get(pandascore_status, "not_started")


@celery_app.task(bind=True, max_retries=3)
def transform_teams(self, fetch_result: Dict[str, Any]) -> Dict[str, Any]:
    """Transform fetched teams data to ROTAS schema.
    
    Args:
        fetch_result: Output from fetch_teams task
        
    Returns:
        Transformed data ready for writer
    """
    try:
        raw_teams = fetch_result.get("data", [])
        game = fetch_result.get("game")
        
        transformed = []
        for team in raw_teams:
            transformed_team = {
                "pandascore_id": team.get("id"),
                "name": team.get("name"),
                "slug": team.get("slug"),
                "acronym": team.get("acronym"),
                "game": game,
                "region": team.get("location"),
                "logo_url": team.get("image_url"),
                "raw_data": team,
                "last_synced_at": datetime.utcnow().isoformat()
            }
            transformed.append(transformed_team)
        
        result = {
            "entity_type": "teams",
            "game": game,
            "transformed_at": datetime.utcnow().isoformat(),
            "data": transformed,
            "count": len(transformed)
        }
        
        logger.info(f"Transformed {len(transformed)} teams")
        
        # Pass to writer
        from .writer import write_teams
        write_teams.delay(result)
        
        # After teams are written, fetch players for each team
        from .fetcher import fetch_players
        for team in raw_teams:
            fetch_players.delay(game=game, team_id=team.get("id"))
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to transform teams: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def transform_players(self, fetch_result: Dict[str, Any]) -> Dict[str, Any]:
    """Transform fetched players data to ROTAS schema."""
    try:
        raw_players = fetch_result.get("data", [])
        game = fetch_result.get("game")
        
        transformed = []
        for player in raw_players:
            # Map team reference
            current_team = player.get("current_team", {})
            
            transformed_player = {
                "pandascore_id": player.get("id"),
                "name": player.get("name"),
                "slug": player.get("slug"),
                "game": game,
                "nationality": player.get("nationality"),
                "team_pandascore_id": current_team.get("id") if current_team else None,
                "raw_data": player,
                "last_synced_at": datetime.utcnow().isoformat()
            }
            transformed.append(transformed_player)
        
        result = {
            "entity_type": "players",
            "game": game,
            "transformed_at": datetime.utcnow().isoformat(),
            "data": transformed,
            "count": len(transformed)
        }
        
        logger.info(f"Transformed {len(transformed)} players")
        
        from .writer import write_players
        write_players.delay(result)
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to transform players: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def transform_tournaments(self, fetch_result: Dict[str, Any]) -> Dict[str, Any]:
    """Transform fetched tournaments data to ROTAS schema."""
    try:
        raw_tournaments = fetch_result.get("data", [])
        game = fetch_result.get("game")
        
        transformed = []
        for tournament in raw_tournaments:
            transformed_tournament = {
                "pandascore_id": tournament.get("id"),
                "name": tournament.get("name"),
                "slug": tournament.get("slug"),
                "game": game,
                "tier": _determine_tier(tournament),
                "region": tournament.get("region"),
                "start_date": tournament.get("begin_at"),
                "end_date": tournament.get("end_at"),
                "status": _normalize_status(tournament.get("status", "not_started")),
                "prize_pool": tournament.get("prizepool"),
                "raw_data": tournament,
                "last_synced_at": datetime.utcnow().isoformat()
            }
            transformed.append(transformed_tournament)
        
        result = {
            "entity_type": "tournaments",
            "game": game,
            "transformed_at": datetime.utcnow().isoformat(),
            "data": transformed,
            "count": len(transformed)
        }
        
        logger.info(f"Transformed {len(transformed)} tournaments")
        
        from .writer import write_tournaments
        write_tournaments.delay(result)
        
        # After tournaments are written, fetch matches for each
        from .fetcher import fetch_matches
        for tournament in raw_tournaments:
            fetch_matches.delay(game=game, tournament_id=tournament.get("id"))
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to transform tournaments: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def transform_matches(self, fetch_result: Dict[str, Any]) -> Dict[str, Any]:
    """Transform fetched matches data to ROTAS schema."""
    try:
        raw_matches = fetch_result.get("data", [])
        game = fetch_result.get("game")
        
        transformed = []
        for match in raw_matches:
            # Extract opponent info
            opponents = match.get("opponents", [])
            team1 = opponents[0].get("opponent", {}) if len(opponents) > 0 else {}
            team2 = opponents[1].get("opponent", {}) if len(opponents) > 1 else {}
            
            # Extract scores
            results = match.get("results", [])
            team1_score = next((r.get("score", 0) for r in results if r.get("team_id") == team1.get("id")), 0)
            team2_score = next((r.get("score", 0) for r in results if r.get("team_id") == team2.get("id")), 0)
            
            winner = match.get("winner", {})
            
            transformed_match = {
                "pandascore_id": match.get("id"),
                "name": match.get("name"),
                "game": game,
                "status": _normalize_status(match.get("status", "not_started")),
                "scheduled_at": match.get("scheduled_at"),
                "finished_at": match.get("end_at"),
                "team1_pandascore_id": team1.get("id"),
                "team2_pandascore_id": team2.get("id"),
                "team1_score": team1_score,
                "team2_score": team2_score,
                "winner_pandascore_id": winner.get("id"),
                "tournament_pandascore_id": match.get("tournament_id"),
                "best_of": match.get("number_of_games"),
                "raw_data": match,
                "last_synced_at": datetime.utcnow().isoformat()
            }
            transformed.append(transformed_match)
        
        result = {
            "entity_type": "matches",
            "game": game,
            "transformed_at": datetime.utcnow().isoformat(),
            "data": transformed,
            "count": len(transformed)
        }
        
        logger.info(f"Transformed {len(transformed)} matches")
        
        from .writer import write_matches
        write_matches.delay(result)
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to transform matches: {exc}")
        raise self.retry(exc=exc, countdown=60)
