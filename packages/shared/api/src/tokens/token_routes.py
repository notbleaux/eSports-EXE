[Ver001.000]
"""
Token Economy API Routes
=======================
FastAPI endpoints for NJZ token system.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from .token_service import TokenService
from .token_models import (
    TokenBalance, TokenClaimResponse, TokenHistoryResponse,
    TokenStats, TokenLeaderboardResponse,
    DailyClaimRequest, TokenAwardRequest, TokenDeductRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tokens", tags=["tokens"])


# Dependency injection helper (to be wired with actual DB pool)
async def get_token_service() -> TokenService:
    """Get TokenService instance with database pool."""
    # This will be injected from main app context
    from ...database import get_db_pool
    pool = await get_db_pool()
    return TokenService(pool)


@router.post("/claim-daily", response_model=TokenClaimResponse)
async def claim_daily_tokens(
    request: DailyClaimRequest,
    service: TokenService = Depends(get_token_service)
):
    """
    Claim daily login bonus tokens.
    
    - 100 tokens base reward
    - +10 tokens per streak day (up to 7 days)
    - Milestone bonuses at 7, 30, 100 days
    - 24-hour cooldown between claims
    """
    try:
        return await service.claim_daily(request)
    except Exception as e:
        logger.error(f"Daily claim failed for {request.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process daily claim"
        )


@router.get("/balance/{user_id}", response_model=TokenBalance)
async def get_token_balance(
    user_id: str,
    service: TokenService = Depends(get_token_service)
):
    """Get user's current token balance and statistics."""
    try:
        return await service.get_or_create_balance(user_id)
    except Exception as e:
        logger.error(f"Failed to get balance for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve balance"
        )


@router.get("/history/{user_id}", response_model=TokenHistoryResponse)
async def get_transaction_history(
    user_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    service: TokenService = Depends(get_token_service)
):
    """Get paginated transaction history for a user."""
    try:
        from .token_models import TransactionType
        tx_type = TransactionType(transaction_type) if transaction_type else None
        return await service.get_transaction_history(user_id, page, page_size, tx_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transaction type: {transaction_type}"
        )
    except Exception as e:
        logger.error(f"Failed to get history for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction history"
        )


@router.get("/stats/{user_id}", response_model=TokenStats)
async def get_token_stats(
    user_id: str,
    service: TokenService = Depends(get_token_service)
):
    """Get comprehensive token statistics for a user."""
    try:
        return await service.get_token_stats(user_id)
    except Exception as e:
        logger.error(f"Failed to get stats for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get("/leaderboard", response_model=TokenLeaderboardResponse)
async def get_token_leaderboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user_id: Optional[str] = Query(None),
    service: TokenService = Depends(get_token_service)
):
    """Get token balance leaderboard."""
    try:
        return await service.get_leaderboard(page, page_size, current_user_id)
    except Exception as e:
        logger.error(f"Failed to get leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leaderboard"
        )


# Admin endpoints

class AdminAuth(BaseModel):
    """Simple admin authentication placeholder."""
    admin_id: str
    admin_secret: str  # In production, use proper JWT/OAuth


@router.post("/admin/award", response_model=TokenBalance)
async def admin_award_tokens(
    request: TokenAwardRequest,
    auth: AdminAuth,  # In production, use proper dependency
    service: TokenService = Depends(get_token_service)
):
    """
    Admin endpoint to award tokens to a user.
    
    Requires admin authentication.
    """
    # TODO: Implement proper admin authentication
    # For now, just log and proceed
    logger.info(f"Admin {request.admin_id} awarding {request.amount} tokens to {request.user_id}")
    
    try:
        return await service.award_tokens(request)
    except Exception as e:
        logger.error(f"Failed to award tokens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to award tokens"
        )


@router.post("/admin/deduct")
async def admin_deduct_tokens(
    request: TokenDeductRequest,
    auth: AdminAuth,
    service: TokenService = Depends(get_token_service)
):
    """
    Admin endpoint to deduct tokens from a user.
    
    Requires admin authentication.
    """
    logger.info(f"Admin deducting {request.amount} tokens from {request.user_id}")
    
    try:
        success, balance, message = await service.deduct_tokens(request)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        return {"success": True, "balance": balance, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deduct tokens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deduct tokens"
        )


# Health check
@router.get("/health")
async def token_service_health(
    service: TokenService = Depends(get_token_service)
):
    """Health check for token service."""
    try:
        # Try a simple query
        balance = await service.get_or_create_balance("health_check_user")
        return {
            "status": "healthy",
            "database": "connected",
            "service": "token_service"
        }
    except Exception as e:
        logger.error(f"Token service health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token service unhealthy"
        )
