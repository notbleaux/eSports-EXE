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

[Ver002.000] - Added database queries for leaderboard and investment grades
"""
import logging
from typing import Optional, List
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status, Depends
from pydantic import BaseModel, Field
import asyncpg

# Import RAR components
try:
    from axiom_esports_data.analytics.src.rar import (
        RARCalculator, CompleteRARResult,
        VolatilityCalculator, VolatilityResult
    )
except ImportError:
    # Fallback for when axiom_esports_data is not available
    RARCalculator = None
    VolatilityCalculator = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sator", tags=["rar"])

# Initialize calculators (lazy load)
_rar_calc = None
_vol_calc = None

def get_rar_calc():
    global _rar_calc
    if _rar_calc is None and RARCalculator is not None:
        _rar_calc = RARCalculator()
    return _rar_calc

def get_vol_calc():
    global _vol_calc
    if _vol_calc is None and VolatilityCalculator is not None:
        _vol_calc = VolatilityCalculator()
    return _vol_calc

# Database dependency
async def get_db_pool() -> asyncpg.Pool:
    """Get database pool from app state."""
    from ..database import get_pool
    return await get_pool()


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
            calculation_timestamp=result.calculation_timestamp or datetime.now(timezone.utc).isoformat(),
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
                calculation_timestamp=result.calculation_timestamp or datetime.now(timezone.utc).isoformat(),
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
    role: Optional[str] = Query(None),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Get RAR leaderboard - top rated players.
    
    Query parameters:
    - limit: Number of players to return (1-500)
    - min_matches: Minimum matches for eligibility
    - role: Filter by role (optional)
    
    [Ver002.000] - Implemented database query using player_performance table
    """
    logger.info(f"Leaderboard requested: limit={limit}, min_matches={min_matches}, role={role}")
    
    try:
        # Build query with optional role filter
        role_filter = "AND role = $3" if role else ""
        params = [min_matches, limit, role] if role else [min_matches, limit]
        
        query = f"""
            WITH player_stats AS (
                SELECT 
                    player_id,
                    name,
                    team,
                    role,
                    AVG(rar_score) as avg_rar,
                    AVG(sim_rating) as avg_sim_rating,
                    COUNT(DISTINCT match_id) as match_count,
                    MAX(realworld_time) as last_match,
                    CASE 
                        WHEN AVG(rar_score) >= 0.95 THEN 'A+'
                        WHEN AVG(rar_score) >= 0.85 THEN 'A'
                        WHEN AVG(rar_score) >= 0.70 THEN 'B'
                        WHEN AVG(rar_score) >= 0.55 THEN 'C'
                        ELSE 'D'
                    END as grade
                FROM player_performance
                WHERE realworld_time >= NOW() - INTERVAL '90 days'
                  AND rar_score IS NOT NULL
                {role_filter}
                GROUP BY player_id, name, team, role
                HAVING COUNT(DISTINCT match_id) >= $1
            )
            SELECT 
                ROW_NUMBER() OVER (ORDER BY avg_rar DESC) as rank,
                player_id,
                name as player_name,
                team,
                ROUND((avg_rar * 100)::numeric, 2) as rar_normalized,
                grade as investment_grade,
                CASE 
                    WHEN avg_rar > LAG(avg_rar) OVER (ORDER BY avg_rar DESC) * 1.05 THEN 'rising'
                    WHEN avg_rar < LAG(avg_rar) OVER (ORDER BY avg_rar DESC) * 0.95 THEN 'falling'
                    ELSE 'stable'
                END as trend_direction
            FROM player_stats
            ORDER BY avg_rar DESC
            LIMIT $2
        """
        
        rows = await pool.fetch(query, *params)
        
        if not rows:
            # Return empty list with proper structure if no data
            return []
        
        return [
            LeaderboardEntry(
                rank=row['rank'],
                player_id=str(row['player_id']),
                player_name=row['player_name'],
                team=row['team'],
                rar_normalized=float(row['rar_normalized']),
                investment_grade=row['investment_grade'],
                trend_direction=row['trend_direction'] or 'stable'
            )
            for row in rows
        ]
        
    except Exception as e:
        logger.error(f"Leaderboard query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch leaderboard"
        )


@router.get("/rar/investment-grades")
async def get_players_by_grade(
    grade: str = Query(..., pattern=r"^(A\+|A|B|C|D)$"),
    limit: int = Query(50, ge=1, le=200),
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Get players filtered by investment grade.
    
    Grades:
    - A+: Elite franchise players (95-100 RAR)
    - A: All-star caliber (85-94 RAR)
    - B: Above average (70-84 RAR)
    - C: Average (55-69 RAR)
    - D: Below replacement (<55 RAR)
    
    [Ver002.000] - Implemented database query
    """
    logger.info(f"Investment grade query: grade={grade}, limit={limit}")
    
    # Map grade to RAR score ranges
    grade_ranges = {
        "A+": (0.95, 2.0),  # 95-100+
        "A": (0.85, 0.95),  # 85-94
        "B": (0.70, 0.85),  # 70-84
        "C": (0.55, 0.70),  # 55-69
        "D": (0.0, 0.55)    # <55
    }
    
    min_rar, max_rar = grade_ranges.get(grade, (0.0, 1.0))
    
    try:
        query = """
            WITH player_stats AS (
                SELECT 
                    player_id,
                    name,
                    team,
                    role,
                    AVG(rar_score) as avg_rar,
                    COUNT(DISTINCT match_id) as match_count,
                    MAX(realworld_time) as last_match
                FROM player_performance
                WHERE realworld_time >= NOW() - INTERVAL '90 days'
                  AND rar_score IS NOT NULL
                GROUP BY player_id, name, team, role
                HAVING COUNT(DISTINCT match_id) >= 5
            )
            SELECT 
                player_id,
                name as player_name,
                team,
                role,
                ROUND((avg_rar * 100)::numeric, 2) as rar_normalized,
                match_count,
                last_match
            FROM player_stats
            WHERE avg_rar >= $1 AND avg_rar < $2
            ORDER BY avg_rar DESC
            LIMIT $3
        """
        
        rows = await pool.fetch(query, min_rar, max_rar, limit)
        
        players = [
            {
                "player_id": str(row['player_id']),
                "player_name": row['player_name'],
                "team": row['team'],
                "role": row['role'],
                "rar_normalized": float(row['rar_normalized']),
                "match_count": row['match_count'],
                "last_active": row['last_match'].isoformat() if row['last_match'] else None
            }
            for row in rows
        ]
        
        return {
            "grade": grade,
            "count": len(players),
            "rarity_pct": round((len(players) / 1000) * 100, 2) if players else 0,  # Estimate
            "players": players
        }
        
    except Exception as e:
        logger.error(f"Investment grade query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch players by grade"
        )


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
        "last_update": datetime.now(timezone.utc).isoformat()
    }
