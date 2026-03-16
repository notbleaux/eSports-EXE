"""
Parsers module — HTML parsing for VLR.gg pages.
"""
from extraction.src.parsers.match_parser import MatchParser, RawMatchData
from extraction.src.parsers.player_parser import PlayerParser, RawPlayerData
from extraction.src.parsers.team_parser import TeamParser, RawTeamData
from extraction.src.parsers.content_drift_detector import ContentDriftDetector, DriftReport
from extraction.src.parsers.economy_inference import EconomyInference
from extraction.src.parsers.role_classifier import RoleClassifier

__all__ = [
    "MatchParser",
    "RawMatchData",
    "PlayerParser",
    "RawPlayerData",
    "TeamParser",
    "RawTeamData",
    "ContentDriftDetector",
    "DriftReport",
    "EconomyInference",
    "RoleClassifier",
]
