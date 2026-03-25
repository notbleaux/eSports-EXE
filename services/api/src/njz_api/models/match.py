from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pandascore_id = Column(Integer, unique=True, nullable=False)
    name = Column(String(300), nullable=False)
    game = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)  # 'not_started', 'running', 'finished', 'canceled'
    scheduled_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    winner_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())

    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winner = relationship("Team", foreign_keys=[winner_id])
