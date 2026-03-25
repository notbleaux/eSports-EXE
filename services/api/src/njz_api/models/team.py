from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pandascore_id = Column(Integer, unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    acronym = Column(String(20), nullable=True)
    game = Column(String(20), nullable=False)
    region = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    players = relationship("Player", back_populates="team")
