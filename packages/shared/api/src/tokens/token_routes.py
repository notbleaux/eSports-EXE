# [Ver002.000]
"""
Token Economy API Routes
=======================
FastAPI endpoints for NJZ token system with JWT authentication.
"""

import sys
sys.path.insert(0, r"C:\Users\jacke\Documents\GitHub\eSports-EXE\packages\shared")

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, require_permissions, TokenData
from axiom_esports_data.api.src.db_manager import db
from .token_service import TokenService
from .token_models import (
    TokenBalance, TokenClaimResponse, TokenHistoryResponse,
    TokenStats, TokenLeaderboardResponse,
    TokenAwardRequest, TokenDeductRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tokens", tags=["tokens"])


# Dependency injection helper
async def get_token_service() -> TokenService:
    """Get TokenService instance with database pool."""
    return TokenService(db.pool)
