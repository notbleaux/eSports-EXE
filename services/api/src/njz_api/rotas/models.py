"""
ROTAS Data Models - Enhanced for comprehensive stats reference.

This module extends the base models with additional fields for:
- Tournament data
- Match details with round-by-round breakdown
- Enhanced player stats with game-specific metrics
- Cross-game normalized ratings
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..models.base import Base


class Tournament(Base):
    """Tournament/league information."""
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pandascore_id = Column(Integer, unique=True, nullable=False)
    name = Column(String(300), nullable=False)
    slug = Column(String(300), unique=True, nullable=False)
    game = Column(String(20), nullable=False, index=True)  # 'valorant' or 'cs2'
    tier = Column(String(10), nullable=True)  # 'S', 'A', 'B', 'C' tier classification
    region = Column(String(50), nullable=True)
    prize_pool = Column(String(100), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default='upcoming')  # 'upcoming', 'ongoing', 'finished'
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    matches = relationship("MatchDetail", back_populates="tournament", cascade="all, delete-orphan")


class MatchDetail(Base):
    """Extended match information with round-by-round data."""
    __tablename__ = "match_details"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pandascore_id = Column(Integer, unique=True, nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True, index=True)
    
    # Basic info
    name = Column(String(300), nullable=False)
    game = Column(String(20), nullable=False, index=True)
    status = Column(String(20), nullable=False, default='not_started')
    
    # Schedule
    scheduled_at = Column(DateTime, nullable=True, index=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    
    # Teams
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    # Score
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    
    # Best of format (e.g., 3 for BO3, 5 for BO5)
    best_of = Column(Integer, default=3)
    
    # Detailed data stored as JSON for flexibility
    rounds_data = Column(JSON, nullable=True)  # Round-by-round breakdown
    map_veto = Column(JSON, nullable=True)     # Map selection/picks
    economy_data = Column(JSON, nullable=True) # Economy tracking per round
    
    # Meta
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    tournament = relationship("Tournament", back_populates="matches")
    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_id])
    player_stats = relationship("MatchPlayerStats", back_populates="match", cascade="all, delete-orphan")


class MatchPlayerStats(Base):
    """Player statistics for a specific match."""
    __tablename__ = "match_player_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("match_details.id"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    
    # Game identification
    game = Column(String(20), nullable=False, index=True)
    
    # Combat stats
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    kd_ratio = Column(Float, default=0.0)
    
    # Precision
    headshots = Column(Integer, default=0)
    headshot_pct = Column(Float, default=0.0)
    
    # Round impact
    first_bloods = Column(Integer, default=0)      # Opening kills
    first_deaths = Column(Integer, default=0)      # Opening deaths
    clutches_won = Column(Integer, default=0)      # 1vX situations won
    clutches_lost = Column(Integer, default=0)     # 1vX situations lost
    
    # Multi-kills
    double_kills = Column(Integer, default=0)
    triple_kills = Column(Integer, default=0)
    quad_kills = Column(Integer, default=0)
    aces = Column(Integer, default=0)
    
    # Participation
    rounds_played = Column(Integer, default=0)
    rounds_won = Column(Integer, default=0)
    
    # Game-specific metrics
    damage_dealt = Column(Integer, default=0)      # Total damage
    damage_per_round = Column(Float, default=0.0)  # ADR
    
    # Valorant-specific
    acs = Column(Float, default=0.0)               # Average Combat Score
    
    # CS2-specific
    kast_pct = Column(Float, default=0.0)          # KAST percentage
    impact_rating = Column(Float, default=0.0)     # HLTV-style impact
    
    # Normalized cross-game rating (SATOR calculation)
    normalized_rating = Column(Float, default=0.0, index=True)
    
    # Meta
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    match = relationship("MatchDetail", back_populates="player_stats")
    player = relationship("Player", backref="match_stats")


class PlayerCareerStats(Base):
    """Aggregated career statistics for a player."""
    __tablename__ = "player_career_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, unique=True)
    game = Column(String(20), nullable=False, index=True)
    
    # Match counts
    total_matches = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    matches_lost = Column(Integer, default=0)
    
    # Round counts
    total_rounds = Column(Integer, default=0)
    rounds_won = Column(Integer, default=0)
    
    # Combat totals
    total_kills = Column(Integer, default=0)
    total_deaths = Column(Integer, default=0)
    total_assists = Column(Integer, default=0)
    overall_kd = Column(Float, default=0.0)
    
    # Averages per match
    avg_kills_per_match = Column(Float, default=0.0)
    avg_damage_per_match = Column(Float, default=0.0)
    
    # Averages per round
    avg_kills_per_round = Column(Float, default=0.0)   # KPR
    avg_damage_per_round = Column(Float, default=0.0)  # ADR
    
    # Impact metrics
    total_first_bloods = Column(Integer, default=0)
    total_clutches_won = Column(Integer, default=0)
    clutch_success_rate = Column(Float, default=0.0)
    
    # Consistency
    rating_std_dev = Column(Float, default=0.0)        # Standard deviation of ratings
    consistency_score = Column(Float, default=0.0)     # Lower is more consistent
    
    # Recent form (last 30 days)
    recent_matches = Column(Integer, default=0)
    recent_win_rate = Column(Float, default=0.0)
    recent_avg_rating = Column(Float, default=0.0)
    
    # Meta
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    player = relationship("Player", backref="career_stats")


class TeamStats(Base):
    """Team statistics and performance metrics."""
    __tablename__ = "team_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, unique=True)
    game = Column(String(20), nullable=False, index=True)
    
    # Match record
    total_matches = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    matches_lost = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    
    # Round record
    total_rounds = Column(Integer, default=0)
    rounds_won = Column(Integer, default=0)
    rounds_lost = Column(Integer, default=0)
    round_win_rate = Column(Float, default=0.0)
    
    # Map performance (stored as JSON)
    map_stats = Column(JSON, nullable=True)  # {"map_name": {"played": 10, "won": 6, ...}}
    
    # Recent form
    recent_form = Column(JSON, nullable=True)  # Last 5 matches: ["W", "L", "W", "W", "L"]
    
    # Meta
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    team = relationship("Team", backref="stats")


class DataIngestionLog(Base):
    """Track data ingestion runs for debugging and monitoring."""
    __tablename__ = "data_ingestion_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False)  # 'pandascore', 'manual', etc.
    entity_type = Column(String(50), nullable=False)  # 'matches', 'players', 'tournaments'
    
    # Run details
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default='running')  # 'running', 'completed', 'failed'
    
    # Results
    records_processed = Column(Integer, default=0)
    records_created = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Request params (for debugging)
    request_params = Column(JSON, nullable=True)
