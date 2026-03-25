from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pandascore_id = Column(Integer, unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    nationality = Column(String(50), nullable=True)
    game = Column(String(20), nullable=False)  # 'valorant' or 'cs2'
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="players")
    stats = relationship("PlayerStats", back_populates="player", cascade="all, delete-orphan")
    calculations = relationship("SimCalculation", back_populates="player", cascade="all, delete-orphan")
