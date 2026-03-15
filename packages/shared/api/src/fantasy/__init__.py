"""
Fantasy eSports Service
=======================
Online fantasy game for Valorant and Counter-Strike 2.
"""

from .fantasy_service import FantasyService
from .fantasy_models import (
    FantasyLeague,
    FantasyTeam,
    FantasyRoster,
    FantasyScoringPeriod,
    FantasyPlayerScore,
    FantasyMatchup,
    WaiverClaim,
    Trade,
    CreateLeagueRequest,
    CreateTeamRequest,
    DraftPlayerRequest,
    ScoringRules,
)
from .fantasy_routes import router

__all__ = [
    "FantasyService",
    "FantasyLeague",
    "FantasyTeam",
    "FantasyRoster",
    "FantasyScoringPeriod",
    "FantasyPlayerScore",
    "FantasyMatchup",
    "WaiverClaim",
    "Trade",
    "CreateLeagueRequest",
    "CreateTeamRequest",
    "DraftPlayerRequest",
    "ScoringRules",
    "router",
]
