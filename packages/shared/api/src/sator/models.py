"""
SATOR Pydantic Models
====================
Data models for SATOR hub API responses.
"""

from datetime import datetime, date, timezone
from typing import Optional, List
from pydantic import BaseModel, Field


class PlayerStats(BaseModel):
    """Player performance statistics."""
    player_id: str
    name: str
    team: Optional[str] = None
    region: Optional[str] = None
    role: Optional[str] = None
    
    # Combat stats
    kills: Optional[int] = None
    deaths: Optional[int] = None
    assists: Optional[int] = None
    kd_ratio: Optional[float] = None
    acs: Optional[float] = Field(None, description="Average Combat Score")
    adr: Optional[float] = Field(None, description="Average Damage per Round")
    kast_pct: Optional[float] = Field(None, description="Kill Assist Survive Trade %")
    
    # Precision stats
    headshot_pct: Optional[float] = None
    first_blood: Optional[int] = None
    clutch_wins: Optional[int] = None
    
    # SATOR ratings
    sim_rating: Optional[float] = None
    rar_score: Optional[float] = Field(None, description="Role Adjusted Rating")
    investment_grade: Optional[str] = None
    
    # Meta
    agent: Optional[str] = None
    matches_played: int = 0


class PlayerDetail(PlayerStats):
    """Extended player details."""
    age: Optional[int] = None
    career_stage: Optional[str] = None
    peak_age_estimate: Optional[int] = None
    economy_rating: Optional[float] = None
    
    # Recent matches
    recent_matches: List[dict] = Field(default_factory=list)
    
    # Trends
    rating_trend: Optional[str] = Field(None, description="rising|stable|falling")
    form_rating: Optional[float] = None


class TeamSummary(BaseModel):
    """Team summary information."""
    team_id: str
    name: str
    tag: str
    region: str
    logo_url: Optional[str] = None
    
    # Stats
    matches_played: int = 0
    wins: int = 0
    losses: int = 0
    win_pct: float = 0.0
    
    # Roster
    players: List[PlayerStats] = Field(default_factory=list)
    
    # Ranking
    regional_rank: Optional[int] = None
    global_rank: Optional[int] = None


class MatchSummary(BaseModel):
    """Match summary for listings."""
    match_id: str
    tournament_id: Optional[str] = None
    tournament_name: Optional[str] = None
    
    # Teams
    team_a: str
    team_b: str
    team_a_score: int = 0
    team_b_score: int = 0
    
    # Status
    status: str = Field(..., description="upcoming|live|completed")
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Meta
    patch_version: Optional[str] = None
    maps: List[str] = Field(default_factory=list)


class MatchDetail(MatchSummary):
    """Extended match details."""
    # Map scores
    map_scores: List[dict] = Field(default_factory=list)
    
    # Player performances
    player_performances: List[PlayerStats] = Field(default_factory=list)
    
    # VOD
    vod_url: Optional[str] = None
    
    # SATOR analysis
    key_moments: List[dict] = Field(default_factory=list)
    mvp_player: Optional[str] = None


class PlatformStats(BaseModel):
    """Platform-wide statistics."""
    total_players: int
    total_teams: int
    total_matches: int
    matches_today: int
    matches_live: int
    
    # Data freshness
    last_update: datetime
    data_freshness: str = Field(..., description="Live|Recent|Stale")
    
    # Top performers
    top_player: Optional[PlayerStats] = None
    trending_team: Optional[TeamSummary] = None
    
    # System status
    api_status: str = "healthy"
    database_status: str = "connected"


class SearchResult(BaseModel):
    """Search result item."""
    type: str = Field(..., description="player|team|match")
    id: str
    name: str
    subtitle: Optional[str] = None
    score: float = Field(..., description="Relevance score")
    data: Optional[dict] = None


class SearchResponse(BaseModel):
    """Search response."""
    query: str
    results: List[SearchResult]
    total: int
    took_ms: float


class DataFreshness(BaseModel):
    """Data freshness status."""
    status: str = Field(..., description="Live|Recent|Stale")
    last_update: datetime
    next_update: Optional[datetime] = None
    sources: dict = Field(default_factory=dict)
    
    # Component health
    database: str = "connected"
    cache: str = "connected"
    websocket: str = "connected"


class PlayerListResponse(BaseModel):
    """Paginated player list."""
    players: List[PlayerStats]
    total: int
    page: int
    page_size: int
    has_more: bool


class MatchListResponse(BaseModel):
    """Paginated match list."""
    matches: List[MatchSummary]
    total: int
    page: int
    page_size: int
    has_more: bool


# WebSocket Message Models

class WSMessage(BaseModel):
    """Base WebSocket message."""
    type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WSMatchUpdate(WSMessage):
    """Match update message."""
    type: str = "match_update"
    match_id: str
    data: dict


class WSPlayerUpdate(WSMessage):
    """Player stats update."""
    type: str = "player_update"
    player_id: str
    data: dict


class WSSubscription(BaseModel):
    """Client subscription request."""
    action: str = Field(..., description="subscribe|unsubscribe")
    channel: str = Field(..., description="matches|players|teams")
    id: Optional[str] = None  # Specific ID or null for all
