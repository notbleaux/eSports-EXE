"""
TeneT Protocol Schema — Canonical Pydantic v2 Models
NJZ eSports Platform

Mirrors: data/schemas/tenet-protocol.ts
SCHEMA CHANGE: Initial definition — 2026-03-27
"""

from typing import List, Optional, Dict, Literal, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# ─── Base Configuration ───────────────────────────────────────────────────

class TenetBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )


# ─── Data Source Trust Levels ─────────────────────────────────────────────

class TrustLevel(str, Enum):
    """Trust level assigned to each data ingestion source"""
    HIGH = "HIGH"              # Official API data from game publisher or Pandascore
    MEDIUM = "MEDIUM"          # Video analysis, Liquidpedia, manual review
    LOW = "LOW"                # Scraped community sites: VLR.gg, fan forums
    UNVERIFIED = "UNVERIFIED"  # Unverified user submission


class DataSourceType(str, Enum):
    """All supported data source types"""
    PANDASCORE_API = "pandascore_api"           # Pandascore official API
    RIOT_OFFICIAL_API = "riot_official_api"     # Riot Games official API
    VIDEO_ANALYSIS = "video_analysis"           # Automated computer vision on match video
    VIDEO_MANUAL_REVIEW = "video_manual_review" # Human-reviewed video grading
    MINIMAP_ANALYSIS = "minimap_analysis"       # Computer vision on minimap frames
    LIVESTREAM_GRADING = "livestream_grading"   # Grade assigned during/after livestream review
    VLR_SCRAPE = "vlr_scrape"                   # Scraped from VLR.gg
    LIQUIDPEDIA_SCRAPE = "liquidpedia_scrape"   # Scraped from Liquidpedia
    YOUTUBE_EXTRACT = "youtube_extract"         # Data extracted from YouTube video descriptions/streams
    FAN_FORUM = "fan_forum"                     # Fan-submitted data from community forums
    MANUAL_ENTRY = "manual_entry"               # Manually entered by platform admin


# Mapping of DataSourceType to default TrustLevel
DATA_SOURCE_TRUST: Dict[str, TrustLevel] = {
    DataSourceType.PANDASCORE_API.value: TrustLevel.HIGH,
    DataSourceType.RIOT_OFFICIAL_API.value: TrustLevel.HIGH,
    DataSourceType.VIDEO_ANALYSIS.value: TrustLevel.MEDIUM,
    DataSourceType.VIDEO_MANUAL_REVIEW.value: TrustLevel.HIGH,
    DataSourceType.MINIMAP_ANALYSIS.value: TrustLevel.MEDIUM,
    DataSourceType.LIVESTREAM_GRADING.value: TrustLevel.MEDIUM,
    DataSourceType.VLR_SCRAPE.value: TrustLevel.LOW,
    DataSourceType.LIQUIDPEDIA_SCRAPE.value: TrustLevel.MEDIUM,
    DataSourceType.YOUTUBE_EXTRACT.value: TrustLevel.LOW,
    DataSourceType.FAN_FORUM.value: TrustLevel.LOW,
    DataSourceType.MANUAL_ENTRY.value: TrustLevel.HIGH,
}


# ─── Confidence Scoring ───────────────────────────────────────────────────

class ConfidenceSourceContribution(TenetBaseModel):
    """Breakdown of confidence contribution per source"""
    source_type: str = Field(alias="sourceType")
    trust_level: TrustLevel = Field(alias="trustLevel")
    weight: float = Field(description="Weight applied to this source in consensus calculation")
    source_confidence: float = Field(alias="sourceConfidence", description="Confidence this source alone would yield (0.0–1.0)")
    ingested_at: str = Field(alias="ingestedAt", description="ISO 8601 — when this data point was ingested")


class ConfidenceScore(TenetBaseModel):
    """
    Confidence score output from TeneT Key.Links verification.
    Ranges 0.0 (no confidence) to 1.0 (fully verified).
    """
    value: float = Field(description="Aggregate confidence (0.0–1.0)")
    source_count: int = Field(alias="sourceCount", description="Number of independent sources that contributed")
    by_source: List[ConfidenceSourceContribution] = Field(alias="bySource", description="Breakdown by source")
    has_conflicts: bool = Field(alias="hasConflicts", description="Were any discrepancies detected across sources?")
    conflict_fields: List[str] = Field(alias="conflictFields", description="Fields where sources disagreed")
    computed_at: str = Field(alias="computedAt", description="ISO 8601 — when this confidence was computed")


# ─── Verification Actions ─────────────────────────────────────────────────

class VerificationStatus(str, Enum):
    """Status of verification process"""
    ACCEPTED = "ACCEPTED"              # confidence >= 0.90, stored in truth layer
    FLAGGED = "FLAGGED"                # confidence 0.70–0.89, queued for review
    REJECTED = "REJECTED"              # confidence < 0.70, not stored
    PENDING = "PENDING"                # verification in progress
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE" # human reviewer overrode automated result


class ManualReviewRecord(TenetBaseModel):
    """Record of manual review decision"""
    reviewer_id: str = Field(alias="reviewerId")
    decision: Literal["ACCEPT", "REJECT", "NEEDS_MORE_DATA"]
    notes: str
    reviewed_at: str = Field(alias="reviewedAt", description="ISO 8601")


class DistributionPath(str, Enum):
    """Which distribution path a result routes to"""
    PATH_A_LIVE = "PATH_A_LIVE"
    PATH_B_LEGACY = "PATH_B_LEGACY"
    BOTH = "BOTH"
    NONE = "NONE"


class TenetVerificationResult(TenetBaseModel):
    """Output of TeneT Key.Links verification bridge"""
    entity_id: str = Field(alias="entityId", description="ID of the entity being verified (match, player stat, etc.)")
    entity_type: str = Field(alias="entityType", description="Type of entity (match, player_stat, team_roster, tournament, etc.)")
    game: str = Field(description="Game this entity belongs to")
    tenet_key: str = Field(alias="tenetKey", description="The TeneT Key used to look up schema requirements")
    status: VerificationStatus
    confidence: ConfidenceScore
    sources_contributed: List[str] = Field(alias="sourcesContributed", description="DataSourceTypes that contributed")
    rejection_reasons: Optional[List[str]] = Field(default=None, alias="rejectionReasons", description="If FLAGGED or REJECTED, the specific reasons")
    manual_review: Optional[ManualReviewRecord] = Field(default=None, alias="manualReview", description="If MANUAL_OVERRIDE, who reviewed and decision")
    verified_at: str = Field(alias="verifiedAt", description="ISO 8601")
    distribution_path: DistributionPath = Field(alias="distributionPath", description="Which distribution path this result routes to")


class TenetVerificationRequest(TenetBaseModel):
    """Request to TeneT Key.Links verification service"""
    entity_id: str = Field(alias="entityId")
    entity_type: str = Field(alias="entityType")
    game: str
    tenet_key: str = Field(alias="tenetKey")
    source_data: List['SourceDataPayload'] = Field(alias="sourceData", description="Data payloads from each contributing source")


class SourceDataPayload(TenetBaseModel):
    """Raw data payload from a single source"""
    source_type: str = Field(alias="sourceType")
    ingested_at: str = Field(alias="ingestedAt", description="ISO 8601")
    raw_data: Dict[str, Any] = Field(alias="rawData", description="Raw data as received from the source")


# ─── Network Channel Types ────────────────────────────────────────────────

class DataTierRequirement(TenetBaseModel):
    """Data tier requirements for a specific quarter"""
    quarter: str = Field(description="'SATOR', 'AREPO', 'OPERA', or 'ROTAS'")
    minimum_confidence: float = Field(alias="minimumConfidence", description="Minimum confidence required for data to be shown in this quarter")
    accepted_paths: List[str] = Field(alias="acceptedPaths", description="Which distribution paths feed this quarter")
    required_sources: List[str] = Field(alias="requiredSources", description="Required data sources (at least one must be present)")


class TenetDirectoryEntry(TenetBaseModel):
    """tenet (lowercase) — Network channel directory entry"""
    key: str = Field(description="Unique key for this directory entry")
    game_node_id: str = Field(alias="gameNodeId", description="Which GameNodeID this entry indexes")
    game: str = Field(description="Which game this entry belongs to")
    quarters: List[str] = Field(description="Which hub quarters this entry maps to ('SATOR', 'AREPO', 'OPERA', 'ROTAS')")
    data_tier_requirements: List[DataTierRequirement] = Field(alias="dataTierRequirements", description="Data tier requirements for this entry")
    schema_version: str = Field(alias="schemaVersion", description="Schema version for this entry type")


# ─── Path A (Live) Events ──────────────────────────────────────────────────

class LiveEventType(str, Enum):
    """Types of live events from Path A"""
    MATCH_START = "MATCH_START"
    ROUND_START = "ROUND_START"
    ROUND_END = "ROUND_END"
    SCORE_UPDATE = "SCORE_UPDATE"
    MATCH_END = "MATCH_END"
    PLAYER_ELIMINATED = "PLAYER_ELIMINATED"
    OBJECTIVE_CAPTURED = "OBJECTIVE_CAPTURED"


class MatchScorePayload(TenetBaseModel):
    """Score update payload"""
    team_a: Dict[str, Any] = Field(alias="teamA", description="Team A: id, name, score")
    team_b: Dict[str, Any] = Field(alias="teamB", description="Team B: id, name, score")
    current_round: int = Field(alias="currentRound")
    half: Literal["first", "second", "overtime"]


class RoundUpdatePayload(TenetBaseModel):
    """Round update payload"""
    round_number: int = Field(alias="roundNumber")
    round_result: Literal["teamA_win", "teamB_win"] = Field(alias="roundResult")
    win_condition: str = Field(alias="winCondition", description="e.g., 'elimination', 'spike_detonated', 'spike_defused'")
    duration: int = Field(description="Duration in seconds")


class MatchEndPayload(TenetBaseModel):
    """Match end payload"""
    winner_id: str = Field(alias="winnerId")
    final_score: Dict[str, int] = Field(alias="finalScore", description="teamA and teamB scores")
    total_rounds: int = Field(alias="totalRounds")
    duration: int = Field(description="Duration in seconds")


class PathALiveEvent(TenetBaseModel):
    """
    Path A — Live / Real-time event
    Low latency, simple schemas, eventual accuracy.
    """
    event_type: str = Field(alias="eventType")
    match_id: str = Field(alias="matchId")
    game: str
    timestamp: int = Field(description="Unix timestamp (milliseconds)")
    payload: Dict[str, Any]


# ─── Path B (Static Truth Legacy) ──────────────────────────────────────────

class LegacyRoundPlayerStat(TenetBaseModel):
    """Per-player stats for a specific round"""
    player_id: str = Field(alias="playerId")
    kills: int
    deaths: int
    assists: int
    role: Optional[str] = None = Field(description="Agent (Valorant) or role (CS2)")
    utility_used: Optional[int] = Field(default=None, alias="utilityUsed")
    first_bloods: Optional[int] = Field(default=None, alias="firstBloods")
    clutch_attempts: Optional[int] = Field(default=None, alias="clutchAttempts")
    clutch_wins: Optional[int] = Field(default=None, alias="clutchWins")
    adr: Optional[float] = None = Field(description="Average damage per round")
    headshot_rate: Optional[float] = Field(default=None, alias="headshotRate")


class LegacyRoundRecord(TenetBaseModel):
    """Full record for a single round"""
    round_number: int = Field(alias="roundNumber")
    start_time: str = Field(alias="startTime", description="ISO 8601")
    end_time: str = Field(alias="endTime", description="ISO 8601")
    winning_team_id: str = Field(alias="winningTeamId")
    win_condition: str = Field(alias="winCondition")
    player_stats: List[LegacyRoundPlayerStat] = Field(alias="playerStats", description="Per-player stats for this round")


class TeamEconomyState(TenetBaseModel):
    """Economy state for a team"""
    team_id: str = Field(alias="teamId")
    total_credits: int = Field(alias="totalCredits")
    avg_loadout_value: int = Field(alias="avgLoadoutValue")
    full_buy: bool = Field(alias="fullBuy")
    forces_buy: bool = Field(alias="forcesBuy")
    eco: bool


class EconomyLogEntry(TenetBaseModel):
    """Economy state for a round"""
    round_number: int = Field(alias="roundNumber")
    phase: Literal["buy", "active", "end"]
    team_a: TeamEconomyState = Field(alias="teamA")
    team_b: TeamEconomyState = Field(alias="teamB")


class PlayerPositionSnapshot(TenetBaseModel):
    """Player position at a specific tick"""
    player_id: str = Field(alias="playerId")
    x: float = Field(description="Normalized coordinates (0.0–1.0) relative to map bounds")
    y: float = Field(description="Normalized coordinates (0.0–1.0) relative to map bounds")
    is_alive: bool = Field(alias="isAlive")
    detection_confidence: Optional[float] = Field(default=None, alias="detectionConfidence", description="If extracted from video, confidence of detection")


class MinimapFrame(TenetBaseModel):
    """Minimap frame with player positions"""
    round_number: int = Field(alias="roundNumber")
    tick: int = Field(description="Seconds since round start")
    positions: List[PlayerPositionSnapshot] = Field(description="Player positions at this tick")


class VideoReviewGrade(TenetBaseModel):
    """Video review grade/score"""
    review_type: Literal["automated", "manual"] = Field(alias="reviewType")
    reviewer_id: Optional[str] = Field(default=None, alias="reviewerId")
    scope: Literal["full_match", "round", "player", "clip"] = Field(description="What aspect was reviewed")
    round_number: Optional[int] = Field(default=None, alias="roundNumber")
    player_id: Optional[str] = Field(default=None, alias="playerId")
    grades: List[Dict[str, Any]] = Field(description="List of {metric, score, notes?}")
    reviewed_at: str = Field(alias="reviewedAt", description="ISO 8601")


class PathBLegacyRecord(TenetBaseModel):
    """
    Path B — Static Truth Legacy record
    High granularity, authoritative, asynchronous.
    """
    match_id: str = Field(alias="matchId")
    game: str
    verification_id: str = Field(alias="verificationId", description="TeneT verification result that certified this data")
    confidence: ConfidenceScore
    rounds: List[LegacyRoundRecord] = Field(description="Full round-by-round granularity")
    economy_log: List[EconomyLogEntry] = Field(alias="economyLog", description="Economy state per round")
    minimap_frames: Optional[List[MinimapFrame]] = Field(default=None, alias="minimapFrames", description="Minimap frames if available")
    video_reviews: Optional[List[VideoReviewGrade]] = Field(default=None, alias="videoReviews", description="Video review grades if available")
    truth_layer_at: str = Field(alias="truthLayerAt", description="ISO 8601 — when this record entered the truth layer")
