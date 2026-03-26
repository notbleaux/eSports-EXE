from typing import List, Optional, Union, Dict, Any, Literal, Annotated
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum

# --- Base Configuration ---

class TenetBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )

# --- Enums ---

class SupportedGame(str, Enum):
    VALORANT = "valorant"
    CS2 = "cs2"
    LOL = "lol"
    R6 = "r6"
    APEX = "apex"

class QuarterKey(str, Enum):
    SATOR = "SATOR"
    AREPO = "AREPO"
    OPERA = "OPERA"
    ROTAS = "ROTAS"

class TeZeTRoute(str, Enum):
    ANALYTICS = "/analytics"
    COMMUNITY = "/community"
    PRO_SCENE = "/pro-scene"
    STATS = "/stats"

class TrustLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNVERIFIED = "UNVERIFIED"

class VerificationStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    FLAGGED = "FLAGGED"
    REJECTED = "REJECTED"
    PENDING = "PENDING"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"

class DistributionPath(str, Enum):
    PATH_A_LIVE = "PATH_A_LIVE"
    PATH_B_LEGACY = "PATH_B_LEGACY"
    BOTH = "BOTH"
    NONE = "NONE"

# --- Quarter GRID ---

class TeZeTBranch(TenetBaseModel):
    id: str
    label: str
    subroute: str
    requires_auth: bool = Field(default=False, alias="requiresAuth")

class GameQuarterVariant(TenetBaseModel):
    game: str
    display_label: Optional[str] = Field(default=None, alias="displayLabel")
    data_sources: Optional[List[str]] = Field(default=None, alias="dataSources")
    tezet_branches: Optional[List[TeZeTBranch]] = Field(default=None, alias="teZeTBranches")

class QuarterConfig(TenetBaseModel):
    key: QuarterKey
    route: TeZeTRoute
    enabled: bool
    game_variant: Optional[GameQuarterVariant] = Field(default=None, alias="gameVariant")

class QuarterGrid(TenetBaseModel):
    SATOR: QuarterConfig
    AREPO: QuarterConfig
    OPERA: QuarterConfig
    ROTAS: QuarterConfig

# --- GameNodeID ---

class BaseGameNodeID(TenetBaseModel):
    id: str
    slug: str
    game: str
    world_port_id: str = Field(alias="worldPortId")
    tenet_key: str = Field(alias="tenetKey")
    quarter_grid: QuarterGrid = Field(alias="quarterGrid")
    indexed_at: datetime = Field(alias="indexedAt")
    last_verified_at: Optional[datetime] = Field(default=None, alias="lastVerifiedAt")
    verification_confidence: Optional[float] = Field(default=None, alias="verificationConfidence")

class ValorantEconomy(TenetBaseModel):
    starting_credits: int = Field(alias="startingCredits")
    loss_bonus: List[int] = Field(alias="lossBonus")
    weapon_tiers: Dict[str, List[int]] = Field(alias="weaponTiers")

class ValorantMatchData(TenetBaseModel):
    map_name: str = Field(alias="mapName")
    server_region: str = Field(alias="serverRegion")
    economy: ValorantEconomy
    is_ranked: bool = Field(alias="isRanked")

class GameNodeIDValorant(BaseGameNodeID):
    game: Literal["valorant"] = Field(default="valorant")
    valorant: ValorantMatchData

class CS2Economy(TenetBaseModel):
    starting_money: int = Field(alias="startingMoney")
    max_money: int = Field(alias="maxMoney")
    loss_bonus: List[int] = Field(alias="lossBonus")
    weapon_tiers: Dict[str, List[int]] = Field(alias="weaponTiers")

class CS2MatchData(TenetBaseModel):
    map_name: str = Field(alias="mapName")
    tick_rate: int = Field(alias="tickRate")
    economy: CS2Economy
    is_prime: bool = Field(alias="isPrime")

class GameNodeIDCS2(BaseGameNodeID):
    game: Literal["cs2"] = Field(default="cs2")
    cs2: CS2MatchData

GameNodeID = Annotated[
    Union[GameNodeIDValorant, GameNodeIDCS2, BaseGameNodeID], 
    Field(discriminator="game")
]

# --- TeneT Protocol ---

class ConfidenceSourceContribution(TenetBaseModel):
    source_type: str = Field(alias="sourceType")
    trust_level: TrustLevel = Field(alias="trustLevel")
    weight: float
    source_confidence: float = Field(alias="sourceConfidence")
    ingested_at: datetime = Field(alias="ingestedAt")

class ConfidenceScore(TenetBaseModel):
    value: float
    source_count: int = Field(alias="sourceCount")
    by_source: List[ConfidenceSourceContribution] = Field(alias="bySource")
    has_conflicts: bool = Field(alias="hasConflicts")
    conflict_fields: List[str] = Field(alias="conflictFields")
    computed_at: datetime = Field(alias="computedAt")

class ManualReviewRecord(TenetBaseModel):
    reviewer_id: str = Field(alias="reviewerId")
    decision: Literal["ACCEPT", "REJECT", "NEEDS_MORE_DATA"]
    notes: str
    reviewed_at: datetime = Field(alias="reviewedAt")

class TenetVerificationResult(TenetBaseModel):
    entity_id: str = Field(alias="entityId")
    entity_type: str = Field(alias="entityType")
    game: str
    tenet_key: str = Field(alias="tenetKey")
    status: VerificationStatus
    confidence: ConfidenceScore
    sources_contributed: List[str] = Field(alias="sourcesContributed")
    rejection_reasons: Optional[List[str]] = Field(default=None, alias="rejectionReasons")
    manual_review: Optional[ManualReviewRecord] = Field(default=None, alias="manualReview")
    verified_at: datetime = Field(alias="verifiedAt")
    distribution_path: DistributionPath = Field(alias="distributionPath")

# --- Path A (Live) ---

class TeamScore(TenetBaseModel):
    team_id: str = Field(alias="teamId")
    name: str
    score: int
    side: Literal["attack", "defend", "t", "ct", "blue", "red"]

class MatchScorePayload(TenetBaseModel):
    event_type: Literal["MATCH_SCORE"] = Field(default="MATCH_SCORE", alias="eventType")
    team_a: TeamScore = Field(alias="teamA")
    team_b: TeamScore = Field(alias="teamB")
    current_round: int = Field(alias="currentRound")
    half: Literal["first", "second", "overtime"]

class RoundUpdatePayload(TenetBaseModel):
    event_type: Literal["ROUND_UPDATE"] = Field(default="ROUND_UPDATE", alias="eventType")
    round_number: int = Field(alias="roundNumber")
    round_result: Literal["teamA_win", "teamB_win"] = Field(alias="roundResult")
    win_condition: str = Field(alias="winCondition")
    duration: float

class MatchEndPayload(TenetBaseModel):
    event_type: Literal["MATCH_END"] = Field(default="MATCH_END", alias="eventType")
    winner_id: str = Field(alias="winnerId")
    final_score: Dict[str, int] = Field(alias="finalScore")
    total_rounds: int = Field(alias="totalRounds")
    duration: float

class PathALiveEvent(TenetBaseModel):
    event_type: str = Field(alias="eventType")
    match_id: str = Field(alias="matchId")
    game: str
    timestamp: int
    payload: Annotated[Union[MatchScorePayload, RoundUpdatePayload, MatchEndPayload], Field(discriminator="event_type")]

# --- Path B (Static Truth Legacy) ---

class LegacyRoundPlayerStat(TenetBaseModel):
    player_id: str = Field(alias="playerId")
    kills: int
    deaths: int
    assists: int
    role: Optional[str] = None
    utility_used: Optional[int] = Field(default=None, alias="utilityUsed")
    first_bloods: Optional[int] = Field(default=None, alias="firstBloods")
    clutch_attempts: Optional[int] = Field(default=None, alias="clutchAttempts")
    clutch_wins: Optional[int] = Field(default=None, alias="clutchWins")
    adr: Optional[float] = None
    headshot_rate: Optional[float] = Field(default=None, alias="headshotRate")

class LegacyRoundRecord(TenetBaseModel):
    round_number: int = Field(alias="roundNumber")
    start_time: datetime = Field(alias="startTime")
    end_time: datetime = Field(alias="endTime")
    winning_team_id: str = Field(alias="winningTeamId")
    win_condition: str = Field(alias="winCondition")
    player_stats: List[LegacyRoundPlayerStat] = Field(alias="playerStats")

class TeamEconomyState(TenetBaseModel):
    team_id: str = Field(alias="teamId")
    total_credits: int = Field(alias="totalCredits")
    avg_loadout_value: int = Field(alias="avgLoadoutValue")
    full_buy: bool = Field(alias="fullBuy")
    forces_buy: bool = Field(alias="forcesBuy")
    eco: bool

class EconomyLogEntry(TenetBaseModel):
    round_number: int = Field(alias="roundNumber")
    phase: Literal["buy", "active", "end"]
    team_a: TeamEconomyState = Field(alias="teamA")
    team_b: TeamEconomyState = Field(alias="teamB")

class PlayerPositionSnapshot(TenetBaseModel):
    player_id: str = Field(alias="playerId")
    x: float
    y: float
    is_alive: bool = Field(alias="isAlive")
    detection_confidence: Optional[float] = Field(default=None, alias="detectionConfidence")

class MinimapFrame(TenetBaseModel):
    round_number: int = Field(alias="roundNumber")
    tick: int
    positions: List[PlayerPositionSnapshot]

class VideoReviewGrade(TenetBaseModel):
    review_type: Literal["automated", "manual"] = Field(alias="reviewType")
    reviewer_id: Optional[str] = Field(default=None, alias="reviewerId")
    scope: Literal["full_match", "round", "player", "clip"]
    round_number: Optional[int] = Field(default=None, alias="roundNumber")
    player_id: Optional[str] = Field(default=None, alias="playerId")
    grades: List[Dict[str, Any]]
    reviewed_at: datetime = Field(alias="reviewedAt")

class PathBLegacyRecord(TenetBaseModel):
    match_id: str = Field(alias="matchId")
    game: str
    verification_id: str = Field(alias="verificationId")
    confidence: ConfidenceScore
    rounds: List[LegacyRoundRecord]
    economy_log: List[EconomyLogEntry] = Field(alias="economyLog")
    minimap_frames: Optional[List[MinimapFrame]] = Field(default=None, alias="minimapFrames")
    video_reviews: Optional[List[VideoReviewGrade]] = Field(default=None, alias="videoReviews")
    truth_layer_at: datetime = Field(alias="truthLayerAt")
