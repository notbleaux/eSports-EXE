from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


class PlayerStats(Base):
    __tablename__ = "player_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    game = Column(String(20), nullable=False, index=True)

    # Combat stats
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    headshot_pct = Column(Float, default=0.0)

    # Round impact
    first_bloods = Column(Integer, default=0)
    clutches_won = Column(Integer, default=0)
    rounds_played = Column(Integer, default=0)

    # Derived
    kd_ratio = Column(Float, default=0.0)
    acs = Column(Float, default=0.0)  # Average Combat Score (Valorant)

    # Meta
    recorded_at = Column(DateTime, server_default=func.now())

    player = relationship("Player", back_populates="stats")
