"""CS2 Match Parser - Convert HLTV data to RawMatchData

Parses HLTV HTML/scraped data into standardized RawMatchData format
for the SATOR data pipeline.
"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import structlog

logger = structlog.get_logger()


class CS2Role(str, Enum):
    """CS2 player roles (no agents, just positions)"""
    AWPER = "awper"
    ENTRY = "entry"
    SUPPORT = "support"
    IGL = "igl"
    LURKER = "lurker"
    RIFLER = "rifler"
    UNKNOWN = "unknown"


@dataclass
class RawPlayerStats:
    """Raw player statistics from match"""
    player_id: str
    player_name: str
    team: str
    
    # Combat stats
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    adr: float = 0.0
    kast: float = 0.0
    rating: float = 0.0
    
    # Additional CS2 stats
    hs_percent: Optional[float] = None
    fk_diff: Optional[int] = None  # First kill difference
    
    # Role (inferred, not from HLTV)
    role: CS2Role = CS2Role.UNKNOWN


@dataclass
class RawMapData:
    """Raw map data from a match"""
    map_name: str
    team_a: str
    team_b: str
    score_a: int
    score_b: int
    
    # Pick/ban info
    picked_by: Optional[str] = None
    banned_by: Optional[str] = None
    
    # Player stats for this map
    player_stats: List[RawPlayerStats] = field(default_factory=list)
    
    # Map-specific meta
    duration_rounds: int = 0
    overtime: bool = False


@dataclass
class RawMatchData:
    """Standardized raw match data for SATOR pipeline
    
    This is the output format that feeds into the staging system.
    """
    # Identifiers
    match_id: str
    source: str = "hltv"  # hltv, manual, etc.
    source_url: Optional[str] = None
    
    # Teams
    team_a: str = ""
    team_b: str = ""
    
    # Event info
    event_name: str = ""
    event_id: Optional[str] = None
    
    # Match meta
    match_date: Optional[str] = None
    format: str = "bo1"  # bo1, bo3, bo5
    
    # Maps played
    maps: List[RawMapData] = field(default_factory=list)
    
    # Overall scores (derived from maps)
    total_score_a: int = 0
    total_score_b: int = 0
    
    # Winner
    winner: Optional[str] = None
    
    # Raw source data (for debugging/auditing)
    raw_source_data: Optional[Dict] = None
    
    # Metadata
    scraped_at: Optional[str] = None
    parser_version: str = "1.0.0"


class CS2RoleClassifier:
    """Classify CS2 player roles based on stats
    
    CS2 doesn't have agents like Valorant, so we infer roles from:
    - Weapon usage patterns (AWP kills)
    - Positioning stats (entry vs lurker)
    - IGL designation (if available)
    """
    
    @staticmethod
    def classify_from_stats(
        player_stats: RawPlayerStats,
        awp_kills: Optional[int] = None,
        entry_success: Optional[float] = None,
        is_igl: bool = False
    ) -> CS2Role:
        """Classify player role from available stats
        
        Args:
            player_stats: Player statistics
            awp_kills: Number of AWP kills (if available)
            entry_success: Entry success rate (if available)
            is_igl: Whether player is known IGL
            
        Returns:
            Inferred CS2Role
        """
        if is_igl:
            return CS2Role.IGL
        
        # AWPer detection
        if awp_kills and awp_kills > 5:
            return CS2Role.AWPER
        
        # Entry fragger detection
        if entry_success and entry_success > 0.6:
            return CS2Role.ENTRY
        
        # Lurker detection (high survival, lower KAST)
        if player_stats.kast and player_stats.kast < 65:
            if player_stats.deaths < player_stats.kills * 0.8:
                return CS2Role.LURKER
        
        # Support detection (high KAST, lower rating)
        if player_stats.kast and player_stats.kast > 75:
            if player_stats.rating < 1.0:
                return CS2Role.SUPPORT
        
        return CS2Role.RIFLER
    
    @staticmethod
    def classify_from_position_history(
        first_bloods: int,
        clutches: int,
        trade_kills: int
    ) -> CS2Role:
        """Classify based on position history stats"""
        if first_bloods > 5:
            return CS2Role.ENTRY
        elif clutches > 3:
            return CS2Role.LURKER  # Lurkers often clutch
        elif trade_kills > 8:
            return CS2Role.SUPPORT
        
        return CS2Role.RIFLER


class CS2MatchParser:
    """Parse CS2 match data from HLTV into RawMatchData format"""
    
    def __init__(self):
        self.role_classifier = CS2RoleClassifier()
        
    def parse_hltv_match(
        self, 
        hltv_data: Dict[str, Any],
        include_raw: bool = False
    ) -> RawMatchData:
        """Parse HLTV match data into RawMatchData
        
        Args:
            hltv_data: Dictionary from HLTV client
            include_raw: Whether to include raw source data
            
        Returns:
            RawMatchData
        """
        logger.info(
            "Parsing HLTV match", 
            match_id=hltv_data.get("match_id")
        )
        
        # Parse maps
        maps = []
        total_a = 0
        total_b = 0
        
        for map_data in hltv_data.get("maps", []):
            raw_map = self._parse_map(map_data)
            maps.append(raw_map)
            
            # Calculate totals
            if raw_map.score_a > raw_map.score_b:
                total_a += 1
            elif raw_map.score_b > raw_map.score_a:
                total_b += 1
        
        # Determine winner
        winner = None
        if total_a > total_b:
            winner = hltv_data.get("team_a")
        elif total_b > total_a:
            winner = hltv_data.get("team_b")
        
        return RawMatchData(
            match_id=hltv_data.get("match_id", ""),
            source="hltv",
            source_url=hltv_data.get("url"),
            team_a=hltv_data.get("team_a", ""),
            team_b=hltv_data.get("team_b", ""),
            event_name=hltv_data.get("event_name", ""),
            event_id=hltv_data.get("event_id"),
            match_date=hltv_data.get("date"),
            format=hltv_data.get("format", "bo1"),
            maps=maps,
            total_score_a=total_a,
            total_score_b=total_b,
            winner=winner,
            raw_source_data=hltv_data if include_raw else None,
            scraped_at=datetime.utcnow().isoformat()
        )
    
    def _parse_map(self, map_data: Dict[str, Any]) -> RawMapData:
        """Parse individual map data"""
        
        # Parse player stats
        player_stats = []
        for player in map_data.get("player_stats", []):
            raw_player = self._parse_player_stats(player)
            player_stats.append(raw_player)
        
        return RawMapData(
            map_name=map_data.get("map_name", "Unknown"),
            team_a=map_data.get("team_a", ""),
            team_b=map_data.get("team_b", ""),
            score_a=map_data.get("score_a", 0),
            score_b=map_data.get("score_b", 0),
            player_stats=player_stats,
            duration_rounds=map_data.get("score_a", 0) + map_data.get("score_b", 0)
        )
    
    def _parse_player_stats(self, player_data: Dict[str, Any]) -> RawPlayerStats:
        """Parse player statistics and classify role"""
        
        stats = RawPlayerStats(
            player_id=player_data.get("player_id", ""),
            player_name=player_data.get("player_name", "Unknown"),
            team=player_data.get("team", ""),
            kills=player_data.get("kills", 0),
            deaths=player_data.get("deaths", 0),
            assists=player_data.get("assists", 0),
            adr=player_data.get("adr", 0.0),
            kast=player_data.get("kast", 0.0),
            rating=player_data.get("rating", 0.0),
            hs_percent=player_data.get("hs_percent"),
            fk_diff=player_data.get("fk_diff")
        )
        
        # Classify role
        stats.role = self.role_classifier.classify_from_stats(stats)
        
        return stats
    
    def parse_hltv_results(
        self, 
        results: List[Dict[str, Any]]
    ) -> List[RawMatchData]:
        """Parse list of HLTV results
        
        Note: Results from the results page have limited data.
        Full match details require fetching individual match pages.
        """
        matches = []
        
        for result in results:
            try:
                # Results page has limited info - create minimal RawMatchData
                match = RawMatchData(
                    match_id=result.get("match_id", ""),
                    source="hltv",
                    source_url=result.get("url"),
                    team_a=result.get("team_a", ""),
                    team_b=result.get("team_b", ""),
                    event_name=result.get("event_name", ""),
                    event_id=result.get("event_id"),
                    match_date=result.get("timestamp"),
                    total_score_a=result.get("score_a", 0),
                    total_score_b=result.get("score_b", 0),
                    maps=[RawMapData(
                        map_name=result.get("map_name", "Unknown"),
                        team_a=result.get("team_a", ""),
                        team_b=result.get("team_b", ""),
                        score_a=result.get("score_a", 0),
                        score_b=result.get("score_b", 0)
                    )] if result.get("map_name") else [],
                    scraped_at=datetime.utcnow().isoformat()
                )
                
                # Determine winner
                if match.total_score_a > match.total_score_b:
                    match.winner = match.team_a
                elif match.total_score_b > match.total_score_a:
                    match.winner = match.team_b
                
                matches.append(match)
                
            except Exception as e:
                logger.error("Failed to parse result", error=str(e), result=result)
                continue
        
        return matches
    
    def to_staging_payload(self, match: RawMatchData) -> Dict[str, Any]:
        """Convert RawMatchData to staging ingest payload format"""
        return {
            "match_id": match.match_id,
            "source": match.source,
            "data_domain": "cs2_matches",
            "payload_type": "match_result",
            "timestamp": match.match_date or datetime.utcnow().isoformat(),
            "teams": {
                "home": match.team_a,
                "away": match.team_b,
                "home_score": match.total_score_a,
                "away_score": match.total_score_b,
                "winner": match.winner
            },
            "event": {
                "name": match.event_name,
                "id": match.event_id
            },
            "maps": [
                {
                    "name": m.map_name,
                    "score_home": m.score_a,
                    "score_away": m.score_b,
                    "players": [
                        {
                            "id": p.player_id,
                            "name": p.player_name,
                            "team": p.team,
                            "kills": p.kills,
                            "deaths": p.deaths,
                            "adr": p.adr,
                            "kast": p.kast,
                            "rating": p.rating,
                            "role": p.role.value
                        }
                        for p in m.player_stats
                    ]
                }
                for m in match.maps
            ],
            "parser_version": match.parser_version,
            "scraped_at": match.scraped_at
        }


# Utility functions
def normalize_map_name(map_name: str) -> str:
    """Normalize HLTV map name to standard format
    
    HLTV uses various formats like "de_dust2", "Dust2", "de_dust2 (pick)"
    """
    # Remove common prefixes and suffixes
    clean = map_name.lower()
    clean = clean.replace("de_", "")
    clean = clean.replace(" (pick)", "")
    clean = clean.replace(" (ban)", "")
    clean = clean.strip()
    
    # Map to standard names
    map_aliases = {
        "dust2": "Dust2",
        "inferno": "Inferno",
        "mirage": "Mirage",
        "nuke": "Nuke",
        "overpass": "Overpass",
        "vertigo": "Vertigo",
        "ancient": "Ancient",
        "anubis": "Anubis",
        "train": "Train",
        "cache": "Cache",
        "cobblestone": "Cobblestone",
        "tuscan": "Tuscan",
    }
    
    return map_aliases.get(clean, clean.title())


def calculate_team_rating(
    players: List[RawPlayerStats],
    min_games: int = 10
) -> float:
    """Calculate team rating from player ratings
    
    This is a simplified version - full version would use:
    - Weighted by role importance
    - Historical performance
    - Map-specific ratings
    """
    if not players:
        return 1500.0
    
    ratings = [p.rating for p in players if p.rating > 0]
    if not ratings:
        return 1500.0
    
    # Simple average - would be more complex in production
    avg_rating = sum(ratings) / len(ratings)
    
    # Convert HLTV rating (0.5-2.0 typical) to ELO-like scale
    # 1.0 = 1500, each 0.1 = ~100 points
    return 1500 + (avg_rating - 1.0) * 1000


# CLI runner for testing
async def main():
    """Test the parser"""
    parser = CS2MatchParser()
    
    # Sample HLTV data
    sample_match = {
        "match_id": "2379423",
        "team_a": "FaZe",
        "team_b": "NAVI",
        "event_name": "IEM Katowice 2024",
        "event_id": "7543",
        "date": "2024-02-11",
        "format": "bo3",
        "url": "https://www.hltv.org/matches/2379423/faze-vs-navi-iem-katowice-2024",
        "maps": [
            {
                "map_name": "Mirage",
                "team_a": "FaZe",
                "team_b": "NAVI",
                "score_a": 13,
                "score_b": 11,
                "player_stats": [
                    {
                        "player_id": "11816",
                        "player_name": "ropz",
                        "team": "FaZe",
                        "kills": 22,
                        "deaths": 14,
                        "assists": 3,
                        "adr": 85.5,
                        "kast": 78.3,
                        "rating": 1.35,
                        "hs_percent": 45.5,
                        "fk_diff": 4
                    },
                    {
                        "player_id": "7998",
                        "player_name": "s1mple",
                        "team": "NAVI",
                        "kills": 18,
                        "deaths": 16,
                        "assists": 2,
                        "adr": 72.3,
                        "kast": 65.2,
                        "rating": 1.05,
                        "hs_percent": 38.9,
                        "fk_diff": -2
                    }
                ]
            }
        ]
    }
    
    # Parse match
    raw_match = parser.parse_hltv_match(sample_match, include_raw=True)
    
    print("Parsed Match:")
    print(f"  ID: {raw_match.match_id}")
    print(f"  Teams: {raw_match.team_a} vs {raw_match.team_b}")
    print(f"  Event: {raw_match.event_name}")
    print(f"  Format: {raw_match.format}")
    print(f"  Winner: {raw_match.winner}")
    
    print("\nMaps:")
    for map_data in raw_match.maps:
        print(f"  {map_data.map_name}: {map_data.score_a}-{map_data.score_b}")
        print(f"    Players:")
        for player in map_data.player_stats:
            print(
                f"      {player.player_name} ({player.role.value}): "
                f"{player.kills}/{player.deaths}/{player.assists}, "
                f"ADR: {player.adr}, Rating: {player.rating}"
            )
    
    # Convert to staging payload
    staging_payload = parser.to_staging_payload(raw_match)
    print("\nStaging Payload (partial):")
    print(json.dumps(staging_payload, indent=2)[:500] + "...")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
