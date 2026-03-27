"""
GameNodeID Schema — Canonical Pydantic v2 Models
NJZ eSports Platform

Mirrors: data/schemas/GameNodeID.ts
SCHEMA CHANGE: Initial definition — 2026-03-27
"""

from typing import List, Optional, Dict, Literal, Annotated, Union
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# ─── Base Configuration ───────────────────────────────────────────────────

class GameNodeBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )


# ─── Enums ───────────────────────────────────────────────────────────────

class SupportedGame(str, Enum):
    """Supported games in the platform"""
    VALORANT = "valorant"
    CS2 = "cs2"
    LOL = "lol"
    R6 = "r6"
    APEX = "apex"


class QuarterKey(str, Enum):
    """The four WorldTree hub keys"""
    SATOR = "SATOR"      # Advanced Analytics
    AREPO = "AREPO"      # Community
    OPERA = "OPERA"      # Professional eSports
    ROTAS = "ROTAS"      # Stats Reference / Simulation


class TeZeTRoute(str, Enum):
    """Route segments for each hub"""
    ANALYTICS = "/analytics"
    COMMUNITY = "/community"
    PRO_SCENE = "/pro-scene"
    STATS = "/stats"


class TeZeTContentType(str, Enum):
    """Types of content available in TeZeT branches"""
    SIMRATING = "simrating"
    PLAYER_COMPARE = "player-compare"
    MAP_ANALYSIS = "map-analysis"
    XSIMULATION = "xsimulation"
    LEADERBOARD = "leaderboard"
    RAW_STATS = "raw-stats"
    MATCH_HISTORY = "match-history"
    FORUM = "forum"
    PLAYER_FOLLOWS = "player-follows"
    COMMUNITY_PICKS = "community-picks"
    TOURNAMENT = "tournament"
    PRO_ROSTER = "pro-roster"
    LIVE_MATCH = "live-match"
    CALENDAR = "calendar"


# ─── Quarter GRID ─────────────────────────────────────────────────────────

class TeZeTBranch(GameNodeBaseModel):
    """TeZeT sub-branch within a quarter"""
    id: str
    label: str
    subroute: str = Field(description="Route fragment appended to the quarter route")
    requires_auth: bool = Field(default=False, alias="requiresAuth")


class GameQuarterVariant(GameNodeBaseModel):
    """Per-game customizations layered onto QuarterConfig"""
    game: str
    display_label: Optional[str] = Field(default=None, alias="displayLabel")
    data_sources: Optional[List[str]] = Field(default=None, alias="dataSources")
    tezet_branches: Optional[List[TeZeTBranch]] = Field(default=None, alias="teZeTBranches")


class QuarterConfig(GameNodeBaseModel):
    """Configuration for a single hub quarter"""
    key: QuarterKey
    route: TeZeTRoute
    enabled: bool = Field(description="Whether this quarter is available for the given game")
    game_variant: Optional[GameQuarterVariant] = Field(default=None, alias="gameVariant")


class QuarterGrid(GameNodeBaseModel):
    """The standardized 2×2 Quarter GRID in every GameNodeID"""
    SATOR: QuarterConfig
    AREPO: QuarterConfig
    OPERA: QuarterConfig
    ROTAS: QuarterConfig


# ─── Base GameNodeID ──────────────────────────────────────────────────────

class BaseGameNodeID(GameNodeBaseModel):
    """
    The base unit of the TENET hierarchy.
    Represents a specific indexing node within a World-Port.
    """
    id: str = Field(description="Unique identifier for this node")
    slug: str = Field(description="Human-readable slug for routing")
    game: SupportedGame = Field(description="The game this node belongs to")
    world_port_id: str = Field(alias="worldPortId", description="The World-Port this node lives within")
    tenet_key: str = Field(alias="tenetKey", description="TeneT verification key")
    quarter_grid: QuarterGrid = Field(alias="quarterGrid", description="The standardized 2×2 Quarter GRID")
    indexed_at: str = Field(alias="indexedAt", description="ISO 8601 — when this node was first indexed")
    last_verified_at: Optional[str] = Field(default=None, alias="lastVerifiedAt", description="ISO 8601 — last verification timestamp")
    verification_confidence: Optional[float] = Field(default=None, alias="verificationConfidence", description="Confidence score from last TeneT verification (0.0–1.0)")


# ─── Valorant-Specific ────────────────────────────────────────────────────

class ValorantEconomy(GameNodeBaseModel):
    """Valorant-specific economy configuration"""
    starting_credits: int = Field(alias="startingCredits")
    loss_bonus: List[int] = Field(alias="lossBonus")
    weapon_tiers: Dict[str, tuple[int, int]] = Field(alias="weaponTiers")


class ValorantNodeData(GameNodeBaseModel):
    """Valorant-specific node extensions"""
    map_id: str = Field(alias="mapId")
    map_name: str = Field(alias="mapName")
    agent_pool: List[str] = Field(alias="agentPool", description="Agent UUIDs")
    economy_system: ValorantEconomy = Field(alias="economySystem")
    has_spike_data: bool = Field(alias="hasSpikeData")


class GameNodeIDValorant(BaseGameNodeID):
    """Valorant-specific GameNodeID variant"""
    game: Literal["valorant"] = "valorant"
    valorant: ValorantNodeData


# ─── CS2-Specific ─────────────────────────────────────────────────────────

class CS2Economy(GameNodeBaseModel):
    """CS2-specific economy configuration"""
    starting_money: int = Field(alias="startingMoney")
    max_money: int = Field(alias="maxMoney")
    loss_bonus: List[int] = Field(alias="lossBonus")
    weapon_tiers: Dict[str, tuple[int, int]] = Field(alias="weaponTiers")


class CS2NodeData(GameNodeBaseModel):
    """CS2-specific node extensions"""
    map_id: str = Field(alias="mapId")
    map_name: str = Field(alias="mapName")
    weapon_pool: List[str] = Field(alias="weaponPool")
    economy_system: CS2Economy = Field(alias="economySystem")
    has_flashbang_data: bool = Field(alias="hasFlashbangData")
    has_utility_data: bool = Field(alias="hasUtilityData")


class GameNodeIDCS2(BaseGameNodeID):
    """CS2-specific GameNodeID variant"""
    game: Literal["cs2"] = "cs2"
    cs2: CS2NodeData


# ─── Union Type ───────────────────────────────────────────────────────────

GameNodeID = Annotated[
    Union[GameNodeIDValorant, GameNodeIDCS2, BaseGameNodeID],
    Field(discriminator="game")
]


# ─── World-Port ───────────────────────────────────────────────────────────

class WorldPort(GameNodeBaseModel):
    """
    A World-Port is the game-specific entry point within the TeNET network.
    It is the parent of all GameNodeIDs for a given game.

    URL pattern: /<game> (e.g., /valorant, /cs2)
    """
    id: str
    game: SupportedGame
    display_name: str = Field(alias="displayName", description="Display name (e.g., 'VALORANT', 'Counter-Strike 2')")
    route_segment: str = Field(alias="routeSegment", description="URL segment (e.g., 'valorant', 'cs2')")
    is_active: bool = Field(alias="isActive", description="Whether this World-Port is currently active and accessible")
    launched_at: Optional[str] = Field(default=None, alias="launchedAt", description="ISO 8601 — when this World-Port was initialized")
    default_quarter_grid: QuarterGrid = Field(alias="defaultQuarterGrid", description="Default QuarterGrid configuration for all nodes")
    node_count: int = Field(alias="nodeCount", description="Total GameNodeIDs indexed under this World-Port")


# ─── TeZeT ────────────────────────────────────────────────────────────────

class TeZeT(GameNodeBaseModel):
    """
    TeZeT is the World-Tree within each Quarter.
    Represents the hub-specific composition within a World-Port + Quarter combination.

    URL pattern: /<game>/<quarter>/<tezet-branch>
    Example:     /valorant/analytics/simrating
    """
    id: str
    game_node_id: str = Field(alias="gameNodeId", description="References BaseGameNodeID.id")
    quarter: QuarterKey
    branch: TeZeTBranch
    content_type: TeZeTContentType = Field(alias="contentType", description="The specific data view or feature this TeZeT presents")
    has_live_data: bool = Field(alias="hasLiveData", description="Whether real-time data is available at this branch")
    has_legacy_data: bool = Field(alias="hasLegacyData", description="Whether legacy/historical data is available at this branch")
