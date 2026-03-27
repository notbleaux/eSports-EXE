"""
Legacy / Historical Data Contracts — Path B Distribution
NJZ eSports Platform

Mirrors: data/schemas/legacy-data.ts
SCHEMA CHANGE: Initial definition — 2026-03-27
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


# ─── Base Configuration ───────────────────────────────────────────────────

class LegacyDataBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )


# ─── Response Wrappers ────────────────────────────────────────────────────

class PaginatedResponse(LegacyDataBaseModel):
    """Paginated response wrapper for list endpoints"""
    data: List[dict] = Field(description="Array of items")
    total: int = Field(description="Total number of items across all pages")
    page: int
    page_size: int = Field(alias="pageSize")
    has_more: bool = Field(alias="hasMore")


class ApiResponse(LegacyDataBaseModel):
    """Single API response wrapper"""
    data: dict = Field(description="Response data")
    confidence: Optional[dict] = Field(default=None, description="Null for non-verified endpoints (live data)")
    retrieved_at: str = Field(alias="retrievedAt", description="ISO 8601")


# ─── Verified Match ───────────────────────────────────────────────────────

class MatchTeamRef(LegacyDataBaseModel):
    """Reference to a team in a match"""
    id: str
    name: str
    short_name: str = Field(alias="shortName")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")


class VerifiedMatchSummary(LegacyDataBaseModel):
    """
    A fully verified match record from the truth layer.
    Frontend-facing shape — a subset of PathBLegacyRecord.
    """
    match_id: str = Field(alias="matchId")
    game: str
    date: str = Field(description="ISO 8601")
    team_a: MatchTeamRef = Field(alias="teamA")
    team_b: MatchTeamRef = Field(alias="teamB")
    winner: str = Field(description="Team ID")
    final_score: dict = Field(alias="finalScore", description="{teamA: number, teamB: number}")
    total_rounds: int = Field(alias="totalRounds")
    duration: int = Field(description="Duration in seconds")
    confidence: float = Field(description="Confidence from TeneT verification (0.0–1.0)")
    verification_status: str = Field(alias="verificationStatus", description="ACCEPTED, FLAGGED, REJECTED, PENDING, MANUAL_OVERRIDE")
    has_detailed_data: bool = Field(alias="hasDetailedData", description="True if per-round granular data is available")
    tournament_id: Optional[str] = Field(default=None, alias="tournamentId")
    tournament_name: Optional[str] = Field(default=None, alias="tournamentName")


# ─── Detailed Match (Round-by-Round) ──────────────────────────────────────

class VerifiedRoundPlayerStat(LegacyDataBaseModel):
    """Per-player stats for a verified round"""
    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    team_id: str = Field(alias="teamId")
    kills: int
    deaths: int
    assists: int
    adr: Optional[float] = None = Field(description="Average damage per round")
    headshot_rate: Optional[float] = Field(default=None, alias="headshotRate")
    first_bloods: int = Field(alias="firstBloods")
    clutch_attempts: int = Field(alias="clutchAttempts")
    clutch_wins: int = Field(alias="clutchWins")
    role_or_agent: Optional[str] = Field(default=None, alias="roleOrAgent", description="Agent name (Valorant) or primary weapon (CS2)")


class VerifiedRoundRecord(LegacyDataBaseModel):
    """Full record for a verified round"""
    round_number: int = Field(alias="roundNumber")
    winning_team_id: str = Field(alias="winningTeamId")
    win_condition: str = Field(alias="winCondition")
    duration: int = Field(description="Duration in seconds")
    player_stats: List[VerifiedRoundPlayerStat] = Field(alias="playerStats")


class VerifiedTeamEconomy(LegacyDataBaseModel):
    """Verified team economy state"""
    team_id: str = Field(alias="teamId")
    total_credits: int = Field(alias="totalCredits")
    avg_loadout_value: int = Field(alias="avgLoadoutValue")
    buy_type: Literal["full_buy", "force_buy", "eco", "pistol"]


class VerifiedEconomyEntry(LegacyDataBaseModel):
    """Economy state for a round"""
    round_number: int = Field(alias="roundNumber")
    team_a: VerifiedTeamEconomy = Field(alias="teamA")
    team_b: VerifiedTeamEconomy = Field(alias="teamB")


class VerifiedMatchDetail(VerifiedMatchSummary):
    """
    Full match detail including per-round data.
    Only available when hasDetailedData = true.
    """
    rounds: List[VerifiedRoundRecord]
    economy_log: List[VerifiedEconomyEntry] = Field(alias="economyLog")
    player_performances: List['PlayerMatchPerformance'] = Field(alias="playerPerformances")
    minimap_available: bool = Field(alias="minimapAvailable", description="Only present if minimap data was captured and verified")


# ─── Player Stats Aggregated ──────────────────────────────────────────────

class PlayerMatchPerformance(LegacyDataBaseModel):
    """
    Aggregated player stats across matches.
    Used by SATOR (SimRating) and ROTAS (leaderboards).
    """
    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    team_id: str = Field(alias="teamId")
    match_id: str = Field(alias="matchId")
    game: str
    kills: int
    deaths: int
    assists: int
    kd: float = Field(description="Kill/death ratio")
    acs: Optional[float] = None = Field(description="Agent/Combat Score")
    adr: Optional[float] = None = Field(description="Average damage per round")
    headshot_rate: Optional[float] = Field(default=None, alias="headshotRate")
    first_bloods: int = Field(alias="firstBloods")
    clutch_rate: Optional[float] = Field(default=None, alias="clutchRate")
    sim_rating: Optional[float] = Field(default=None, alias="simRating", description="SimRating v2 score for this performance")
    sim_rating_grade: Optional[Literal["S", "A", "B", "C", "D", "F"]] = Field(default=None, alias="simRatingGrade")


class PlayerSeasonStats(LegacyDataBaseModel):
    """Aggregated player stats across a season or period"""
    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    team_id: str = Field(alias="teamId")
    game: str
    period: str = Field(description="Season or date range")
    match_count: int = Field(alias="matchCount")
    avg_kd: float = Field(alias="avgKd")
    avg_acs: Optional[float] = Field(default=None, alias="avgAcs")
    avg_adr: Optional[float] = Field(default=None, alias="avgAdr")
    avg_headshot_rate: Optional[float] = Field(default=None, alias="avgHeadshotRate")
    avg_sim_rating: Optional[float] = Field(default=None, alias="avgSimRating")
    sim_rating_grade: Optional[Literal["S", "A", "B", "C", "D", "F"]] = Field(default=None, alias="simRatingGrade")
    period_confidence: float = Field(alias="periodConfidence", description="Confidence across all matches in this period")


# ─── Tournament Records ───────────────────────────────────────────────────

class TournamentRecord(LegacyDataBaseModel):
    """Verified tournament record"""
    tournament_id: str = Field(alias="tournamentId")
    name: str
    game: str
    start_date: str = Field(alias="startDate", description="ISO 8601")
    end_date: Optional[str] = Field(default=None, alias="endDate", description="ISO 8601")
    region: str
    tier: Literal["S", "A", "B", "C", "qualifier"] = Field(description="Tournament tier")
    team_count: int = Field(alias="teamCount")
    match_count: int = Field(alias="matchCount")
    winner_id: Optional[str] = Field(default=None, alias="winnerId")
    winner_name: Optional[str] = Field(default=None, alias="winnerName")
    prize_pool: Optional[int] = Field(default=None, alias="prizePool")
    currency: Optional[str] = None


# ─── SimRating ────────────────────────────────────────────────────────────

class SimRatingComponents(LegacyDataBaseModel):
    """Component breakdown of SimRating score"""
    kd: float
    acs: float
    headshot_rate: float
    first_bloods: float
    clutch_rate: float


class SimRatingEntry(LegacyDataBaseModel):
    """
    SimRating entry for a player.
    SimRating is a composite rating combining multiple metrics.
    """
    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    team_id: str = Field(alias="teamId")
    team_name: str = Field(alias="teamName")
    game: str
    score: float = Field(description="SimRating score (0–100)")
    grade: Literal["S", "A", "B", "C", "D", "F"]
    components: SimRatingComponents
    sample_size: int = Field(alias="sampleSize", description="Number of matches this rating is based on")
    confidence: float = Field(description="Confidence of the rating")
    version: Literal["v1", "v2"] = Field(description="'v1' = synthetic/fallback, 'v2' = real stats")
    last_updated: str = Field(alias="lastUpdated", description="ISO 8601")
