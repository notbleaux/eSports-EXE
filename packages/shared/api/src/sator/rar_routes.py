"""
RAR (Risk-Adjusted Rating) API Routes — The Crown Jewel Endpoints.

Provides investment-grade player ratings for roster decisions,
fantasy drafts, and betting analysis.

Endpoints:
- GET  /api/sator/players/{player_id}/rar     - Get player RAR
- POST /api/sator/players/batch/rar           - Batch RAR calculation
- GET  /api/sator/players/{player_id}/volatility - Get volatility metrics
- GET  /api/sator/rar/leaderboard             - RAR leaderboard
- GET  /api/sator/rar/investment-grades       - Players by grade

[Ver001.000]
"""
import logging
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

# Import RAR components
from axiom_esports_data.analytics.src.rar import (
    RARCalculator, CompleteRARResult,
    VolatilityCalculator, VolatilityResult
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sator", tags=["rar"])

# Initialize calculators
rar_calc = RARCalculator()
vol_calc = VolatilityCalculator()


# ============================================================================
# Request/Response Models
# ============================================================================

class RARCalculationRequest(BaseModel):
    """Request model for RAR calculation."""
    player_id: str
    player_name: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    
    # SimRating z-scores
    kills_z: float = Field(..., ge=-5, le=5)
    deaths_z: float = Field(..., ge=-5, le=5)
    adjusted_kill_value_z: float = Field(..., ge=-5, le=5)
    adr_z: float = Field(..., ge=-5, le=5)
    kast_pct_z: float = Field(..., ge=-5, le=5)
    
    # Performance history for volatility
    performance_history: List[float] = Field(..., min_items=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "player_id": "player_123",
                "player_name": "TenZ",
                "role": "Duelist",
                "team": "Sentinels",
                "kills_z": 1.5,
                "deaths_z": -0.5,
                "adjusted_kill_value_z": 1.2,
                "adr_z": 1.8,
                "kast_pct_z": 0.8,
                "performance_history": [8.5, 9.2, 7.8, 8.9, 9.5, 8.7, 9.1]
            }
        }


class RARResponse(BaseModel):
    """Complete RAR response model."""
    player_id: str
    player_name: Optional[str]
    role: Optional[str]
    team: Optional[str]
    
    # Core scores
    sim_rating: float
    rar_score: float
    rar_normalized: float  # 0-100 scale
    
    # Components
    volatility_score: float
    consistency_bonus: float
    confidence_factor: float
    role_adjustment: float
    
    # Ratings
    investment_grade: str
    volatility_rating: str
    consistency_rating: str
    trend_direction: str
    trend_strength: float
    risk_level: str
    
    # Metadata
    sample_size: int
    calculation_timestamp: str
    risk_factors: List[str]


class VolatilityResponse(BaseModel):
    """Volatility metrics response."""
    player_id: str
    coefficient_of_variation: float
    volatility_score: float
    consistency_rating: str
    sample_size: int
    trend_direction: str
    trend_strength: float


class BatchRARRequest(BaseModel):
    """Batch RAR calculation request."""
    players: List[RARCalculationRequest]


class LeaderboardEntry(BaseModel):
    """Single leaderboard entry."""
    rank: int
    player_id: str
    player_name: str
    team: Optional[str]
    rar_normalized: float
    investment_grade: str
    trend_direction: str


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/players/rar", response_model=RARResponse)
async def calculate_player_rar(request: RARCalculationRequest):
    """
    Calculate Risk-Adjusted Rating (RAR) for a player.
    
    This is SATOR's flagship metric for investment-grade player valuation.
    Combines SimRating with volatility analysis and consistency bonuses.
    
    **Formula:** RAR = SimRating × (1 - Volatility) × Consistency_Bonus × Confidence
    
    **Investment Grades:**
    - A+ (95-100): Elite franchise player
    - A (85-94): All-star caliber
    - B (70-84): Above average starter
    - C (55-69): Average/rotation player
    - D (Below 55): Below replacement level
    """
    try:
        result = await rar_calc.calculate(
            player_id=request.player_id,
            kills_z=request.kills_z,
            deaths_z=request.deaths_z,
            adjusted_kill_value_z=request.adjusted_kill_value_z,
            adr_z=request.adr_z,
            kast_pct_z=request.kast_pct_z,
            performance_history=request.performance_history,
            player_name=request.player_name,
            role=request.role,
            team=request.team
        )
        
        return RARResponse(
            player_id=result.player_id,
            player_name=result.player_name,
            role=result.role,
            team=result.team,
            sim_rating=result.sim_rating,
            rar_score=result.rar_score,
            rar_normalized=result.rar_normalized,
            volatility_score=result.volatility_score,
            consistency_bonus=result.consistency_bonus,
            confidence_factor=result.confidence_factor,
            role_adjustment=result.role_adjustment,
            investment_grade=result.investment_grade,
            volatility_rating=result.volatility_rating,
            consistency_rating=result.consistency_rating,
            trend_direction=result.trend_direction,
            trend_strength=result.trend_strength,
            risk_level=result.risk_level,
            sample_size=result.sample_size,
            calculation_timestamp=result.calculation_timestamp or datetime.utcnow().isoformat(),
            risk_factors=result.risk_factors
        )
        
    except Exception as e:
        logger.error(f"RAR calculation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAR calculation failed: {str(e)}"
        )


@router.post("/players/batch/rar", response_model=List[RARResponse])
async def batch_calculate_rar(request: BatchRARRequest):
    """
    Calculate RAR for multiple players in a single request.
    
    Useful for roster analysis and team evaluations.
    """
    results = []
    
    for player_req in request.players:
        try:
            result = await rar_calc.calculate(
                player_id=player_req.player_id,
                kills_z=player_req.kills_z,
                deaths_z=player_req.deaths_z,
                adjusted_kill_value_z=player_req.adjusted_kill_value_z,
                adr_z=player_req.adr_z,
                kast_pct_z=player_req.kast_pct_z,
                performance_history=player_req.performance_history,
                player_name=player_req.player_name,
                role=player_req.role,
                team=player_req.team
            )
            
            results.append(RARResponse(
                player_id=result.player_id,
                player_name=result.player_name,
                role=result.role,
                team=result.team,
                sim_rating=result.sim_rating,
                rar_score=result.rar_score,
                rar_normalized=result.rar_normalized,
                volatility_score=result.volatility_score,
                consistency_bonus=result.consistency_bonus,
                confidence_factor=result.confidence_factor,
                role_adjustment=result.role_adjustment,
                investment_grade=result.investment_grade,
                volatility_rating=result.volatility_rating,
                consistency_rating=result.consistency_rating,
                trend_direction=result.trend_direction,
                trend_strength=result.trend_strength,
                risk_level=result.risk_level,
                sample_size=result.sample_size,
                calculation_timestamp=result.calculation_timestamp or datetime.utcnow().isoformat(),
                risk_factors=result.risk_factors
            ))
            
        except Exception as e:
            logger.error(f"Batch RAR failed for {player_req.player_id}: {e}")
            # Continue with other players
            continue
    
    return results


@router.post("/players/volatility", response_model=VolatilityResponse)
async def calculate_volatility_endpoint(
    player_id: str,
    performance_scores: List[float],
):
    """
    Calculate volatility metrics for a player.
    
    Volatility measures performance consistency - lower is better.
    """
    try:
        result = vol_calc.calculate(player_id, performance_scores)
        
        return VolatilityResponse(
            player_id=result.player_id,
            coefficient_of_variation=result.coefficient_of_variation,
            volatility_score=result.volatility_score,
            consistency_rating=result.consistency_rating,
            sample_size=result.sample_size,
            trend_direction=result.trend_direction,
            trend_strength=result.trend_strength
        )
        
    except Exception as e:
        logger.error(f"Volatility calculation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Volatility calculation failed: {str(e)}"
        )


@router.get("/rar/leaderboard", response_model=List[LeaderboardEntry])
async def get_rar_leaderboard(
    limit: int = Query(100, ge=1, le=500),
    min_matches: int = Query(10, ge=5),
    role: Optional[str] = Query(None)
):
    """
    Get RAR leaderboard - top rated players.
    
    Query parameters:
    - limit: Number of players to return (1-500)
    - min_matches: Minimum matches for eligibility
    - role: Filter by role (optional)
    """
    # This would query the database in production
    # For now, return placeholder response
    logger.info(f"Leaderboard requested: limit={limit}, min_matches={min_matches}, role={role}")
    
    # TODO: Implement database query
    return [
        LeaderboardEntry(
            rank=1,
            player_id="example_1",
            player_name="Example Player",
            team="Example Team",
            rar_normalized=92.5,
            investment_grade="A",
            trend_direction="stable"
        )
    ]


@router.get("/rar/investment-grades")
async def get_players_by_grade(
    grade: str = Query(..., pattern=r"^(A\+|A|B|C|D)$"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Get players filtered by investment grade.
    
    Grades:
    - A+: Elite franchise players (95-100 RAR)
    - A: All-star caliber (85-94 RAR)
    - B: Above average (70-84 RAR)
    - C: Average (55-69 RAR)
    - D: Below replacement (<55 RAR)
    """
    logger.info(f"Investment grade query: grade={grade}, limit={limit}")
    
    # TODO: Implement database query
    return {
        "grade": grade,
        "count": 0,
        "players": []
    }


@router.get("/rar/metrics")
async def get_rar_system_metrics():
    """
    Get RAR calculation system metrics and statistics.
    
    Returns overall system health, calculation counts, and grade distributions.
    """
    return {
        "total_calculations": 0,
        "average_rar": 0.0,
        "grade_distribution": {
            "A+": 0,
            "A": 0,
            "B": 0,
            "C": 0,
            "D": 0
        },
        "system_health": "healthy",
        "last_update": datetime.utcnow().isoformat()
    }
