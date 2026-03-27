"""
Live Data Contracts — WebSocket Client Schema
NJZ eSports Platform — Path A Distribution

Mirrors: data/schemas/live-data.ts
SCHEMA CHANGE: Initial definition — 2026-03-27
"""

from typing import Optional, Generic, TypeVar, Literal, Union, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

T = TypeVar('T')


# ─── Base Configuration ───────────────────────────────────────────────────

class LiveDataBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )


# ─── WebSocket Connection ─────────────────────────────────────────────────

class WebSocketStatus(str, Enum):
    """Current status of WebSocket connection"""
    CONNECTING = "connecting"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    RECONNECTING = "reconnecting"


class WebSocketState(LiveDataBaseModel):
    """Maintained state of WebSocket connection"""
    status: WebSocketStatus
    match_id: Optional[str] = None
    last_event_at: Optional[int] = Field(default=None, description="Unix ms timestamp")
    reconnect_attempts: int
    error: Optional[str] = None


# ─── Live Match View ──────────────────────────────────────────────────────

class LiveMatchStatus(str, Enum):
    """Status of a live match"""
    UPCOMING = "upcoming"      # Match scheduled but not started
    LIVE = "live"              # Match in progress
    BREAK = "break"            # Between halves / overtimes
    COMPLETED = "completed"    # Match finished
    CANCELLED = "cancelled"    # Match cancelled


class LiveTeamView(LiveDataBaseModel):
    """Team information in a live match"""
    id: str
    name: str
    short_name: str = Field(alias="shortName")
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    score: int
    side: Optional[Literal["attacker", "defender"]] = None = Field(description="Side for this half: attacker, defender")


class LiveMatchView(LiveDataBaseModel):
    """
    The current state of a live match as maintained by the frontend.
    Assembled from streaming WebSocket events.
    """
    match_id: str = Field(alias="matchId")
    game: str
    status: LiveMatchStatus
    teams: tuple[LiveTeamView, LiveTeamView] = Field(description="Exactly two teams")
    current_round: int = Field(alias="currentRound")
    half: Literal["first", "second", "overtime"]
    last_updated: int = Field(alias="lastUpdated", description="Unix ms — last update received")
    confidence: None = Field(default=None, description="Always null for live — live data is unverified")


# ─── Live Player Stats ────────────────────────────────────────────────────

class LivePlayerStats(LiveDataBaseModel):
    """
    Simplified per-player stats for live display.
    Only includes what can be reliably derived from live API data.
    """
    player_id: str = Field(alias="playerId")
    player_name: str = Field(alias="playerName")
    team_id: str = Field(alias="teamId")
    kills: int
    deaths: int
    assists: int
    combat_score: Optional[float] = Field(default=None, alias="combatScore", description="Average Combat Score (Valorant) or Rating (CS2) — may be null if not available live")
    is_alive: bool = Field(alias="isAlive")


# ─── Live Round Summary ───────────────────────────────────────────────────

class LiveRoundSummary(LiveDataBaseModel):
    """Summary of a completed round"""
    round_number: int = Field(alias="roundNumber")
    winning_team_id: str = Field(alias="winningTeamId")
    win_condition: str = Field(alias="winCondition")
    duration: int = Field(description="Duration in seconds")
    mvp_player_id: Optional[str] = Field(default=None, alias="mvpPlayerId")


# ─── Live Economy Snapshot ────────────────────────────────────────────────

class LiveTeamEconomy(LiveDataBaseModel):
    """Team economy state shown during the buy phase"""
    team_id: str = Field(alias="teamId")
    total_spent: int = Field(alias="totalSpent")
    buy_type: Literal["full", "force", "eco", "unknown"] = Field(alias="buyType")


class LiveEconomySnapshot(LiveDataBaseModel):
    """
    Economy state shown during the buy phase.
    Derived from live API — lower accuracy than Path B legacy economy logs.
    """
    round_number: int = Field(alias="roundNumber")
    team_a: LiveTeamEconomy = Field(alias="teamA")
    team_b: LiveTeamEconomy = Field(alias="teamB")


# ─── WebSocket Message Envelope ──────────────────────────────────────────

class WsMessageType(str, Enum):
    """Types of WebSocket messages"""
    MATCH_START = "MATCH_START"
    ROUND_START = "ROUND_START"
    ROUND_END = "ROUND_END"
    SCORE_UPDATE = "SCORE_UPDATE"
    PLAYER_STATS_UPDATE = "PLAYER_STATS_UPDATE"
    ECONOMY_SNAPSHOT = "ECONOMY_SNAPSHOT"
    MATCH_END = "MATCH_END"
    HEARTBEAT = "HEARTBEAT"
    ERROR = "ERROR"


class WsMessage(LiveDataBaseModel, Generic[T]):
    """
    All WebSocket messages from the server arrive in this envelope.
    Generic type parameter specifies the payload type.
    """
    type: WsMessageType = Field(alias="type")
    match_id: str = Field(alias="matchId")
    timestamp: int = Field(description="Unix ms")
    payload: Any = Field(description="Payload depends on message type")


# Typed message variants
class WsMatchStartMessage(WsMessage):
    """WebSocket message for match start"""
    type: Literal[WsMessageType.MATCH_START] = WsMessageType.MATCH_START
    payload: LiveMatchView


class WsScoreUpdateMessage(WsMessage):
    """WebSocket message for score update"""
    type: Literal[WsMessageType.SCORE_UPDATE] = WsMessageType.SCORE_UPDATE
    payload: Dict[str, Any]  # {teamA: number, teamB: number, round: number}


class WsRoundEndMessage(WsMessage):
    """WebSocket message for round end"""
    type: Literal[WsMessageType.ROUND_END] = WsMessageType.ROUND_END
    payload: LiveRoundSummary


class WsPlayerStatsMessage(WsMessage):
    """WebSocket message for player stats update"""
    type: Literal[WsMessageType.PLAYER_STATS_UPDATE] = WsMessageType.PLAYER_STATS_UPDATE
    payload: list[LivePlayerStats]


class WsEconomyMessage(WsMessage):
    """WebSocket message for economy snapshot"""
    type: Literal[WsMessageType.ECONOMY_SNAPSHOT] = WsMessageType.ECONOMY_SNAPSHOT
    payload: LiveEconomySnapshot


class WsMatchEndMessage(WsMessage):
    """WebSocket message for match end"""
    type: Literal[WsMessageType.MATCH_END] = WsMessageType.MATCH_END
    payload: Dict[str, Any]  # {winnerId: string, finalScore: {teamA: number, teamB: number}}


class WsHeartbeatMessage(WsMessage):
    """WebSocket message for heartbeat/keepalive"""
    type: Literal[WsMessageType.HEARTBEAT] = WsMessageType.HEARTBEAT
    payload: Dict[str, int]  # {serverTime: number}


class WsErrorMessage(WsMessage):
    """WebSocket message for error"""
    type: Literal[WsMessageType.ERROR] = WsMessageType.ERROR
    payload: Dict[str, str]  # {message: string}
