[Ver002.000]
"""
Token Economy API Routes
=======================
FastAPI endpoints for NJZ token system with JWT authentication.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth.auth_utils import get_current_active_user, require_permissions, TokenData
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
    from ...axiom_esports_data.api.src.db_manager import db
    return TokenService(db.pool)


@router.post("/claim-daily", response_model=TokenClaimResponse)
async def claim_daily_tokens(
    current_user: TokenData = Depends(get_current_active_user),
    service: TokenService = Depends(get_token_service)
):
    """
    Claim daily login bonus tokens.
    
    - 100 tokens base reward
    - +10 tokens per streak day (up to 7 days)
    - Milestone bonuses at 7, 30, 100 days
    - 24-hour cooldown between claims
    
    **Authentication required**
    """
    try:
        from .token_models import DailyClaimRequest
        request = DailyClaimRequest(user_id=current_user.user_id)
        return await service.claim_daily(request)
    except Exception as e:
        logger.error(f"Daily claim failed for {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process daily claim"
        )


@router.get("/balance", response_model=TokenBalance)
async def get_my_token_balance(
    current_user: TokenData = Depends(get_current_active_user),
    service: TokenService = Depends(get_token_service)
):
    """
    Get current user's token balance and statistics.
    
    **Authentication required**
    """
    try:
        return await service.get_or_create_balance(current_user.user_id)
    except Exception as e:
        logger.error(f"Failed to get balance for {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve balance"
        )


@router.get("/balance/{user_id}", response_model=TokenBalance)
async def get_token_balance(
    user_id: str,
    service: TokenService = Depends(get_token_service)
):
    """
    Get any user's token balance (public endpoint).
    
    Use `/tokens/balance` to get your own balance with authentication.
    """
    try:
        return await service.get_or_create_balance(user_id)
    except Exception as e:
        logger.error(f"Failed to get balance for {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve balance"
        )


@router.get("/history", response_model=TokenHistoryResponse)
async def get_my_transaction_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    current_user: TokenData = Depends(get_current_active_user),
    service: TokenService = Depends(get_token_service)
):
    """
    Get current user's paginated transaction history.
    
    **Authentication required**
    """
    try:
        from .token_models import TransactionType
        tx_type = TransactionType(transaction_type) if transaction_type else None
        return await service.get_transaction_history(
            current_user.user_id, page, page_size, tx_type
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transaction type: {transaction_type}"
        )
    except Exception as e:
        logger.error(f"Failed to get history for {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve transaction history"
        )


@router.get("/history/{user_id}", response_model=TokenHistoryResponse)
async def get_transaction_history(
    user_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type"),
    service: TokenService = Depends(get_token_service)
):
    """
    Get any user's transaction history (public endpoint).
    
    Use `/tokens/history` to get your own history with authentication.
    """
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


@router.get("/stats", response_model=TokenStats)
async def get_my_token_stats(
    current_user: TokenData = Depends(get_current_active_user),
    service: TokenService = Depends(get_token_service)
):
    """
    Get current user's comprehensive token statistics.
    
    **Authentication required**
    """
    try:
        return await service.get_token_stats(current_user.user_id)
    except Exception as e:
        logger.error(f"Failed to get stats for {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get("/stats/{user_id}", response_model=TokenStats)
async def get_token_stats(
    user_id: str,
    service: TokenService = Depends(get_token_service)
):
    """Get any user's token statistics (public endpoint)."""
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
    current_user: Optional[TokenData] = Depends(get_current_active_user),
    service: TokenService = Depends(get_token_service)
):
    """
    Get token balance leaderboard.
    
    If authenticated, includes current user's position.
    """
    try:
        current_user_id = current_user.user_id if current_user else None
        return await service.get_leaderboard(page, page_size, current_user_id)
    except Exception as e:
        logger.error(f"Failed to get leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leaderboard"
        )


# Admin endpoints (require admin permission)

@router.post("/admin/award", response_model=TokenBalance)
async def admin_award_tokens(
    request: TokenAwardRequest,
    current_user: TokenData = Depends(require_permissions(["admin"])),
    service: TokenService = Depends(get_token_service)
):
    """
    Admin endpoint to award tokens to a user.
    
    **Requires admin permission**
    """
    logger.info(f"Admin {current_user.user_id} awarding {request.amount} tokens to {request.user_id}")
    
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
    current_user: TokenData = Depends(require_permissions(["admin"])),
    service: TokenService = Depends(get_token_service)
):
    """
    Admin endpoint to deduct tokens from a user.
    
    **Requires admin permission**
    """
    logger.info(f"Admin {current_user.user_id} deducting {request.amount} tokens from {request.user_id}")
    
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


# Health check (no auth required)
@router.get("/health")
async def token_service_health(
    service: TokenService = Depends(get_token_service)
):
    """Health check for token service."""
    try:
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
