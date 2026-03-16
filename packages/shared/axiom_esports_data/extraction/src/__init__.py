"""
Axiom Esports Data — Extraction Module

Ethical web scraping and data extraction from VLR.gg and other sources.

Usage:
    from extraction.src.scrapers import VLRClient, EpochHarvester
    from extraction.src.parsers import MatchParser, PlayerParser, TeamParser
    from extraction.src.storage import KnownRecordRegistry

Components:
    scrapers: HTTP clients with rate limiting and circuit breakers
    parsers: HTML parsers for matches, players, and teams
    storage: Record tracking, integrity checking, and deduplication
    bridge: Data transformation to KCRITR schema
"""

__version__ = "1.0.0"

# Re-export main components for convenience
from extraction.src.scrapers import (
    VLRClient,
    ResilientVLRClient,
    CircuitBreaker,
    EpochHarvester,
    EPOCHS,
)
from extraction.src.parsers import (
    MatchParser,
    PlayerParser,
    TeamParser,
    ContentDriftDetector,
    RawMatchData,
    RawPlayerData,
    RawTeamData,
    DriftReport,
)
from extraction.src.storage import (
    KnownRecordRegistry,
    ExclusionList,
    PipelineBlockedError,
    IntegrityChecker,
    ExclusionEntry,
    RegistryStats,
)
from extraction.src.bridge import (
    ExtractionBridge,
    CanonicalIDResolver,
    CanonicalID,
    FieldTranslator,
)

__all__ = [
    # Scrapers
    "VLRClient",
    "ResilientVLRClient",
    "CircuitBreaker",
    "EpochHarvester",
    "EPOCHS",
    # Parsers
    "MatchParser",
    "PlayerParser",
    "TeamParser",
    "ContentDriftDetector",
    "RawMatchData",
    "RawPlayerData",
    "RawTeamData",
    "DriftReport",
    # Storage
    "KnownRecordRegistry",
    "ExclusionList",
    "PipelineBlockedError",
    "IntegrityChecker",
    "ExclusionEntry",
    "RegistryStats",
    # Bridge
    "ExtractionBridge",
    "CanonicalIDResolver",
    "CanonicalID",
    "FieldTranslator",
]
