"""
Riot Games API Data Models for Valorant
Pydantic models for type-safe API responses
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# =============================================================================
# Common/Shared Models
# =============================================================================

class ContentItem(BaseModel):
    """Generic content item (agents, maps, etc.)"""
    id: str
    name: str
    localized_names: Optional[Dict[str, str]] = None
    asset_name: Optional[str] = None
    asset_path: Optional[str] = None


class Content(BaseModel):
    """Game content response from VAL-CONTENT-V1"""
    version: str
    characters: List[ContentItem] = Field(default_factory=list)
    maps: List[ContentItem] = Field(default_factory=list)
    chromas: List[ContentItem] = Field(default_factory=list)
    skins: List[ContentItem] = Field(default_factory=list)
    skin_levels: List[ContentItem] = Field(default_factory=list)
    equips: List[ContentItem] = Field(default_factory=list)
    game_modes: List[ContentItem] = Field(default_factory=list)
    sprays: List[ContentItem] = Field(default_factory=list)
    spray_levels: List[ContentItem] = Field(default_factory=list)
    charms: List[ContentItem] = Field(default_factory=list)
    charm_levels: List[ContentItem] = Field(default_factory=list)
    player_cards: List[ContentItem] = Field(default_factory=list)
    player_titles: List[ContentItem] = Field(default_factory=list)
    acts: List[ContentItem] = Field(default_factory=list)
    ceremonies: List[ContentItem] = Field(default_factory=list)


class PlatformData(BaseModel):
    """Platform status data from VAL-STATUS-V1"""
    id: str
    name: str
    locales: List[str]
    maintenances: List[Dict[str, Any]] = Field(default_factory=list)
    incidents: List[Dict[str, Any]] = Field(default_factory=list)


# =============================================================================
# Match Models
# =============================================================================

class MatchMetadata(BaseModel):
    """Match metadata"""
    match_id: str = Field(alias="matchId")
    map_id: str = Field(alias="mapId")
    game_version: str = Field(alias="gameVersion")
    game_length_millis: int = Field(alias="gameLengthMillis")
    game_start_millis: int = Field(alias="gameStartMillis")
    provisioning_flow_id: str = Field(alias="provisioningFlowId")
    is_completed: bool = Field(alias="isCompleted")
    custom_game_name: str = Field(alias="customGameName")
    queue_id: str = Field(alias="queueId")
    game_mode: str = Field(alias="gameMode")
    is_ranked: bool = Field(alias="isRanked")
    season_id: str = Field(alias="seasonId")


class PlayerAbilityCasts(BaseModel):
    """Player ability usage stats"""
    grenade_casts: int = Field(alias="grenadeCasts", default=0)
    ability1_casts: int = Field(alias="ability1Casts", default=0)
    ability2_casts: int = Field(alias="ability2Casts", default=0)
    ultimate_casts: int = Field(alias="ultimateCasts", default=0)


class PlayerAbility(BaseModel):
    """Player ability stats"""
    idle_time_millis: int = Field(alias="idleTimeMillis", default=0)
    equipment_id: str = Field(alias="equipmentId")
    ability_casts: Optional[PlayerAbilityCasts] = Field(alias="abilityCasts", default=None)


class PlayerStats(BaseModel):
    """Player match statistics"""
    score: int
    rounds_played: int = Field(alias="roundsPlayed")
    kills: int
    deaths: int
    assists: int
    playtime_millis: int = Field(alias="playtimeMillis")
    ability_casts: Optional[PlayerAbilityCasts] = Field(alias="abilityCasts", default=None)


class MatchPlayer(BaseModel):
    """Player data within a match"""
    puuid: str
    game_name: str = Field(alias="gameName")
    tag_line: str = Field(alias="tagLine")
    team_id: str = Field(alias="teamId")
    party_id: str = Field(alias="partyId")
    agent_id: str = Field(alias="characterId")
    stats: PlayerStats
    competitive_tier: int = Field(alias="competitiveTier", default=0)
    player_card: str = Field(alias="playerCard", default="")
    player_title: str = Field(alias="playerTitle", default="")
    account_level: int = Field(alias="accountLevel", default=1)


class TeamRoundResult(BaseModel):
    """Team result for a specific round"""
    round_num: int = Field(alias="roundNum")
    round_result: str = Field(alias="roundResult")
    round_ceremony: str = Field(alias="roundCeremony")
    winning_team: str = Field(alias="winningTeam")
    bomb_planter: Optional[str] = Field(alias="bombPlanter", default=None)
    bomb_defuser: Optional[str] = Field(alias="bombDefuser", default=None)
    plant_round_time: int = Field(alias="plantRoundTime", default=0)
    plant_player_locations: Optional[List[Dict]] = Field(alias="plantPlayerLocations", default=None)
    plant_location: Optional[Dict] = Field(alias="plantLocation", default=None)
    defuse_round_time: int = Field(alias="defuseRoundTime", default=0)
    defuse_player_locations: Optional[List[Dict]] = Field(alias="defusePlayerLocations", default=None)
    defuse_location: Optional[Dict] = Field(alias="defuseLocation", default=None)
    player_stats: List[Dict] = Field(alias="playerStats", default_factory=list)
    round_result_code: str = Field(alias="roundResultCode", default="")


class MatchTeam(BaseModel):
    """Team data within a match"""
    team_id: str = Field(alias="teamId")
    won: bool
    rounds_played: int = Field(alias="roundsPlayed")
    rounds_won: int = Field(alias="roundsWon")
    num_points: int = Field(alias="numPoints")


class MatchRound(BaseModel):
    """Round data within a match"""
    round_num: int = Field(alias="roundNum")
    round_result: str = Field(alias="roundResult")
    round_ceremony: str = Field(alias="roundCeremony")
    winning_team: str = Field(alias="winningTeam")
    bomb_planter: Optional[str] = Field(alias="bombPlanter")
    bomb_defuser: Optional[str] = Field(alias="bombDefuser")
    plant_round_time: int = Field(alias="plantRoundTime")
    defuse_round_time: int = Field(alias="defuseRoundTime")
    player_stats: List[Dict] = Field(alias="playerStats")


class RiotMatch(BaseModel):
    """Complete match data from VAL-MATCH-V1"""
    match_info: MatchMetadata = Field(alias="matchInfo")
    players: List[MatchPlayer]
    teams: List[MatchTeam]
    rounds: List[TeamRoundResult] = Field(alias="roundResults")
    
    class Config:
        populate_by_name = True


# =============================================================================
# Match List Models
# =============================================================================

class MatchListEntry(BaseModel):
    """Single match entry in matchlist"""
    match_id: str = Field(alias="matchId")
    game_start_time_millis: int = Field(alias="gameStartTimeMillis")
    queue_id: str = Field(alias="queueId")


class Matchlist(BaseModel):
    """Player matchlist from VAL-MATCH-V1"""
    puuid: str
    history: List[MatchListEntry]


# =============================================================================
# Leaderboard Models
# =============================================================================

class LeaderboardPlayer(BaseModel):
    """Player entry in leaderboard"""
    puuid: str
    game_name: str = Field(alias="gameName")
    tag_line: str = Field(alias="tagLine")
    leaderboard_rank: int = Field(alias="leaderboardRank")
    ranked_rating: int = Field(alias="rankedRating")
    number_of_wins: int = Field(alias="numberOfWins")
    competitive_tier: int = Field(alias="competitiveTier")


class Leaderboard(BaseModel):
    """Leaderboard data from VAL-RANKED-V1"""
    shard: str
    act_id: str = Field(alias="actId")
    total_players: int = Field(alias="totalPlayers")
    players: List[LeaderboardPlayer] = Field(default_factory=list)
    immortal_1_start_page: int = Field(alias="immortal1StartPage", default=0)
    immortal_2_start_page: int = Field(alias="immortal2StartPage", default=0)
    immortal_3_start_page: int = Field(alias="immortal3StartPage", default=0)
    radiant_start_page: int = Field(alias="radiantStartPage", default=0)
    immortal_1_start_index: int = Field(alias="immortal1StartIndex", default=0)
    immortal_2_start_index: int = Field(alias="immortal2StartIndex", default=0)
    immortal_3_start_index: int = Field(alias="immortal3StartIndex", default=0)
    radiant_start_index: int = Field(alias="radiantStartIndex", default=0)
    is_top_500_schema: bool = Field(alias="isTop500Schema", default=False)


# =============================================================================
# Account/RSO Models
# =============================================================================

class Account(BaseModel):
    """Riot account information"""
    puuid: str
    game_name: Optional[str] = Field(alias="gameName", default=None)
    tag_line: Optional[str] = Field(alias="tagLine", default=None)


class ActiveShard(BaseModel):
    """Active shard for a player"""
    puuid: str
    game: str
    active_shard: str = Field(alias="activeShard")


# =============================================================================
# Error Models
# =============================================================================

class RiotApiError(BaseModel):
    """Riot API error response"""
    status: Dict[str, Any]
    
    def get_message(self) -> str:
        return self.status.get("message", "Unknown error")
    
    def get_status_code(self) -> int:
        return self.status.get("status_code", 500)


# =============================================================================
# Rate Limit Models
# =============================================================================

class RateLimitInfo(BaseModel):
    """Rate limit information from API headers"""
    limit: int
    count: int
    retry_after: Optional[int] = None
    
    @property
    def remaining(self) -> int:
        return max(0, self.limit - self.count)
    
    @property
    def is_exceeded(self) -> bool:
        return self.count >= self.limit


# =============================================================================
# Utility Functions
# =============================================================================

def parse_match_timestamp(millis: int) -> datetime:
    """Convert milliseconds timestamp to datetime"""
    return datetime.fromtimestamp(millis / 1000)


def format_game_length(millis: int) -> str:
    """Format game length in human-readable format"""
    minutes = millis // 60000
    seconds = (millis % 60000) // 1000
    return f"{minutes}m {seconds}s"


def calculate_kda(kills: int, deaths: int, assists: int) -> float:
    """Calculate KDA ratio"""
    if deaths == 0:
        return float(kills + assists)
    return round((kills + assists) / deaths, 2)
