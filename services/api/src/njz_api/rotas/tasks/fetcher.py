"""
Fetcher Sub-Agent Tasks

Responsible for pulling data from external APIs (PandaScore).
Stateless - fetches data and passes to Transformer queue.
"""

from datetime import datetime
from typing import Dict, Any, List
import logging

from .celery_config import celery_app
from ...clients.pandascore import PandaScoreClient

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def fetch_teams(self, game: str, page: int = 1, per_page: int = 100) -> Dict[str, Any]:
    """Fetch teams from PandaScore API.
    
    Args:
        game: Game identifier ('valorant' or 'cs2')
        page: Page number for pagination
        per_page: Items per page
        
    Returns:
        Dict with teams data and metadata
    """
    try:
        client = PandaScoreClient()
        teams = client.get_teams(game=game, page=page, per_page=per_page)
        
        result = {
            "entity_type": "teams",
            "game": game,
            "page": page,
            "per_page": per_page,
            "fetched_at": datetime.utcnow().isoformat(),
            "data": teams,
            "count": len(teams)
        }
        
        logger.info(f"Fetched {len(teams)} teams for {game}")
        
        # Trigger transformation task
        from .transformer import transform_teams
        transform_teams.delay(result)
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to fetch teams: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def fetch_players(self, game: str, team_id: int = None, page: int = 1) -> Dict[str, Any]:
    """Fetch players from PandaScore API.
    
    Args:
        game: Game identifier
        team_id: Optional team filter
        page: Page number
        
    Returns:
        Dict with players data
    """
    try:
        client = PandaScoreClient()
        players = client.get_players(game=game, team_id=team_id, page=page)
        
        result = {
            "entity_type": "players",
            "game": game,
            "team_id": team_id,
            "page": page,
            "fetched_at": datetime.utcnow().isoformat(),
            "data": players,
            "count": len(players)
        }
        
        logger.info(f"Fetched {len(players)} players for {game}")
        
        from .transformer import transform_players
        transform_players.delay(result)
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to fetch players: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def fetch_tournaments(self, game: str, status: str = None) -> Dict[str, Any]:
    """Fetch tournaments from PandaScore API.
    
    Args:
        game: Game identifier
        status: Optional status filter
        
    Returns:
        Dict with tournaments data
    """
    try:
        client = PandaScoreClient()
        tournaments = client.get_tournaments(game=game, status=status)
        
        result = {
            "entity_type": "tournaments",
            "game": game,
            "status": status,
            "fetched_at": datetime.utcnow().isoformat(),
            "data": tournaments,
            "count": len(tournaments)
        }
        
        logger.info(f"Fetched {len(tournaments)} tournaments for {game}")
        
        from .transformer import transform_tournaments
        transform_tournaments.delay(result)
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to fetch tournaments: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def fetch_matches(self, game: str, tournament_id: int = None, 
                  date_from: str = None, date_to: str = None) -> Dict[str, Any]:
    """Fetch matches from PandaScore API.
    
    Args:
        game: Game identifier
        tournament_id: Optional tournament filter
        date_from: Start date (ISO format)
        date_to: End date (ISO format)
        
    Returns:
        Dict with matches data
    """
    try:
        client = PandaScoreClient()
        matches = client.get_matches(
            game=game,
            tournament_id=tournament_id,
            date_from=date_from,
            date_to=date_to
        )
        
        result = {
            "entity_type": "matches",
            "game": game,
            "tournament_id": tournament_id,
            "date_from": date_from,
            "date_to": date_to,
            "fetched_at": datetime.utcnow().isoformat(),
            "data": matches,
            "count": len(matches)
        }
        
        logger.info(f"Fetched {len(matches)} matches for {game}")
        
        from .transformer import transform_matches
        transform_matches.delay(result)
        
        return result
        
    except Exception as exc:
        logger.error(f"Failed to fetch matches: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def orchestrate_full_sync(game: str = "valorant") -> Dict[str, Any]:
    """Orchestrate a full data sync for a game.
    
    This is the entry point - triggers all fetcher tasks in sequence
    respecting dependencies (teams -> players -> tournaments -> matches).
    
    Args:
        game: Game to sync
        
    Returns:
        Job tracking information
    """
    job_id = f"full_sync_{game}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    logger.info(f"Starting full sync for {game}, job_id: {job_id}")
    
    # Start with teams (no dependencies)
    fetch_teams.delay(game=game)
    
    # Players depend on teams being fetched first
    # We'll fetch players for each team in the transformer
    
    # Tournaments can be fetched in parallel
    fetch_tournaments.delay(game=game)
    
    # Matches depend on tournaments
    # Handled by transformer triggering match fetches
    
    return {
        "job_id": job_id,
        "game": game,
        "status": "initiated",
        "started_at": datetime.utcnow().isoformat()
    }
