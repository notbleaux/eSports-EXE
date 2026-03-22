# [Ver002.001]
"""
Token Economy API Routes
=======================
FastAPI endpoints for NJZ token system with JWT authentication.
"""

import sys
import logging
from typing import Optional

# Add packages/shared to Python path for axiom_esports_data imports
sys.path.insert(0, r"C:\Users\jacke\Documents\GitHub\eSports-EXE\packages\shared")

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

# ... rest of the file
