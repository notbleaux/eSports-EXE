"""
ROTAS Distributed Task Queue

Sub-Agent Architecture:
- Fetcher: Pulls data from external APIs
- Transformer: Normalizes and enriches data
- Writer: Persists to database

Usage:
    from njz_api.rotas.tasks import orchestrate_full_sync
    
    # Start full sync
    job = orchestrate_full_sync.delay(game="valorant")
    
    # Check status
    result = job.get(timeout=30)
"""

from .celery_config import celery_app
from .fetcher import (
    fetch_teams,
    fetch_players,
    fetch_tournaments,
    fetch_matches,
    orchestrate_full_sync
)
from .transformer import (
    transform_teams,
    transform_players,
    transform_tournaments,
    transform_matches
)
from .writer import (
    write_teams,
    write_players,
    write_tournaments,
    write_matches
)

__all__ = [
    # Celery app
    "celery_app",
    # Fetcher tasks
    "fetch_teams",
    "fetch_players",
    "fetch_tournaments",
    "fetch_matches",
    "orchestrate_full_sync",
    # Transformer tasks
    "transform_teams",
    "transform_players",
    "transform_tournaments",
    "transform_matches",
    # Writer tasks
    "write_teams",
    "write_players",
    "write_tournaments",
    "write_matches",
]
