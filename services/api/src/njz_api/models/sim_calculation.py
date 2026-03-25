"""[Ver001.000] SimCalculation model — audit trail for SimRating calculations."""
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


class SimCalculation(Base):
    __tablename__ = "sim_calculations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False, index=True)
    game = Column(String(20), nullable=False)

    # Score components
    simrating = Column(Float, nullable=False)
    source = Column(String(20), nullable=False)  # "v2_stats" or "v1_heuristic"
    kd_score = Column(Float, default=0.0)
    acs_score = Column(Float, default=0.0)
    consistency_score = Column(Float, default=0.0)
    precision_score = Column(Float, default=0.0)

    # Grade (S/A/B/C/D/F)
    grade = Column(String(2), nullable=False)

    # Sample info
    games_sampled = Column(Integer, default=0)
    components = Column(JSON, nullable=True)  # Full breakdown

    # Timestamps
    calculated_at = Column(DateTime, server_default=func.now(), index=True)

    player = relationship("Player", back_populates="calculations")
