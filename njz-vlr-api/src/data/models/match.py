"""
Pydantic Models for VLR Data
Type-safe data validation and serialization
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator


class MatchPreview(BaseModel):
    """Lightweight match preview for listings"""
    
    match_id: Optional[str] = None
    team1: Optional[str] = None
    team2: Optional[str] = None
    team1_logo: Optional[str] = None
    team2_logo: Optional[str] = None
    team1_score: Optional[str] = None
    team2_score: Optional[str] = None
    event: Optional[str] = None
    series: Optional[str] = None
    current_map: Optional[str] = None
    unix_timestamp: Optional[int] = None
    status: str = "unknown"
    eta: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "595657",
                "team1": "Sentinels",
                "team2": "Cloud9",
                "team1_score": "2",
                "team2_score": "1",
                "event": "VCT Americas",
                "series": "Week 3",
                "status": "completed"
            }
        }


class PlayerStats(BaseModel):
    """Player statistics per map"""
    
    player: Optional[str] = None
    team: Optional[str] = None
    agent: Optional[str] = None
    rating: Optional[str] = None
    acs: Optional[str] = None
    kills: Optional[str] = None
    deaths: Optional[str] = None
    assists: Optional[str] = None
    kast: Optional[str] = None
    adr: Optional[str] = None
    headshot_pct: Optional[str] = None
    first_kills: Optional[str] = Field(None, alias="fk")
    first_deaths: Optional[str] = Field(None, alias="fd")


class MapStats(BaseModel):
    """Per-map statistics"""
    
    map_name: Optional[str] = None
    picked_by: Optional[str] = None
    duration: Optional[str] = None
    score: Dict[str, Any] = Field(default_factory=dict)
    players: List[PlayerStats] = Field(default_factory=list)


class MatchDetails(BaseModel):
    """Comprehensive match details"""
    
    match_id: Optional[str] = None
    event: Dict[str, str] = Field(default_factory=dict)
    teams: List[Dict[str, Any]] = Field(default_factory=list)
    maps: List[MapStats] = Field(default_factory=list)
    rounds: List[Dict[str, Any]] = Field(default_factory=list)
    economy: List[Dict[str, Any]] = Field(default_factory=list)
    scraped_at: datetime = Field(default_factory=datetime.utcnow)


class TeamRanking(BaseModel):
    """Team ranking information"""
    
    rank: Optional[str] = None
    team: Optional[str] = None
    country: Optional[str] = None
    record: Optional[str] = None
    earnings: Optional[str] = None
    logo: Optional[str] = None
    rating: Optional[str] = None


class PlayerStatLeader(BaseModel):
    """Player statistics for leaderboards"""
    
    player: Optional[str] = None
    org: Optional[str] = None
    rating: Optional[str] = None
    average_combat_score: Optional[str] = None
    kill_deaths: Optional[str] = None
    kast: Optional[str] = None
    adr: Optional[str] = None
    kpr: Optional[str] = None
    headshot_pct: Optional[str] = None


class Event(BaseModel):
    """Tournament/Event information"""
    
    event_id: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    prize: Optional[str] = None
    dates: Optional[str] = None
    region: Optional[str] = None
    url: Optional[str] = None
    logo: Optional[str] = None


class NewsItem(BaseModel):
    """News article"""
    
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    author: Optional[str] = None
    url: Optional[str] = None