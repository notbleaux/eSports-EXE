"""
FastAPI router for analytics endpoints.

Provides REST API for:
- SimRating calculations
- RAR (Role-Adjusted Replacement) calculations
- Investment Grading
- ML Guardrails validation
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .simrating import SimRatingCalculator, SimRatingResult
from .decomposition import RARDecomposer, RARResult, REPLACEMENT_LEVELS
from .investment_grading import InvestmentGrader
from .age_curves import compute_age_curve, AgeCurveResult, get_all_roles

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Initialize calculators
sim_calc = SimRatingCalculator()
rar_calc = RARDecomposer()
grader = InvestmentGrader()


# Pydantic models for request/response
class SimRatingRequest(BaseModel):
    kills_z: float = Field(..., description="Z-score for kills")
    deaths_z: float = Field(..., description="Z-score for deaths (will be inverted)")
    adjusted_kill_value_z: float = Field(..., description="Z-score for adjusted kill value (NOT raw ACS)")
    adr_z: float = Field(..., description="Z-score for ADR")
    kast_pct_z: float = Field(..., description="Z-score for KAST percentage")


class SimRatingResponse(BaseModel):
    sim_rating: float
    components: dict[str, float]
    z_scores: dict[str, float]
    percentile: float
    interpretation: str


class RARRequest(BaseModel):
    raw_rating: float = Field(..., description="Raw performance rating (SimRating)")
    role: str = Field(..., description="Player role (Entry, IGL, Controller, Initiator, Sentinel)")


class RARResponse(BaseModel):
    role: str
    raw_rating: float
    replacement_level: float
    rar_score: float
    investment_grade: str
    interpretation: str


class InvestmentGradeRequest(BaseModel):
    raw_rating: float = Field(..., description="Raw performance rating")
    role: str = Field(..., description="Player role")
    age: int = Field(..., ge=16, le=40, description="Player age")
    record_date: Optional[datetime] = Field(None, description="Date of performance record (for decay)")


class InvestmentGradeResponse(BaseModel):
    rar_score: float
    age_factor: float
    adjusted_rar: float
    investment_grade: str
    in_peak_age: bool
    career_stage: str
    peak_proximity: float
    decay_factor: float


class AgeCurveResponse(BaseModel):
    role: str
    age: int
    peak_range: tuple[int, int]
    career_stage: str
    peak_proximity: float


class BatchGradeRequest(BaseModel):
    players: List[dict]


# Endpoints
@router.post("/simrating/calculate", response_model=SimRatingResponse)
async def calculate_simrating(request: SimRatingRequest):
    """
    Calculate SimRating from z-scored components.
    
    SimRating uses 5 equal-weighted components (0.20 each):
    - kills_z
    - deaths_z (inverted, lower is better)
    - adjusted_kill_value_z (NOT raw ACS)
    - adr_z
    - kast_pct_z
    """
    try:
        result = sim_calc.calculate(
            kills_z=request.kills_z,
            deaths_z=request.deaths_z,
            adjusted_kill_value_z=request.adjusted_kill_value_z,
            adr_z=request.adr_z,
            kast_pct_z=request.kast_pct_z,
        )
        
        percentile = sim_calc.calculate_percentile(result.sim_rating)
        interpretation = sim_calc.interpret_rating(result.sim_rating)
        
        return SimRatingResponse(
            sim_rating=result.sim_rating,
            components=result.components,
            z_scores=result.z_scores,
            percentile=percentile,
            interpretation=interpretation,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rar/calculate", response_model=RARResponse)
async def calculate_rar(request: RARRequest):
    """
    Calculate Role-Adjusted Replacement (RAR) value.
    
    RAR compares a player's performance to replacement-level
    for their specific role.
    """
    try:
        if request.role not in REPLACEMENT_LEVELS:
            valid_roles = list(REPLACEMENT_LEVELS.keys())
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid role '{request.role}'. Valid roles: {valid_roles}"
            )
        
        result = rar_calc.compute(request.raw_rating, request.role)
        interpretation = _interpret_rar(result.rar_score)
        
        return RARResponse(
            role=result.role,
            raw_rating=result.raw_rating,
            replacement_level=result.replacement_level,
            rar_score=result.rar_score,
            investment_grade=result.investment_grade,
            interpretation=interpretation,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/investment/grade", response_model=InvestmentGradeResponse)
async def grade_investment(request: InvestmentGradeRequest):
    """
    Grade a player as an investment prospect.
    
    Combines RAR score, age curve position, and temporal decay
    to produce a final investment grade.
    """
    try:
        result = grader.grade(
            raw_rating=request.raw_rating,
            role=request.role,
            age=request.age,
            record_date=request.record_date,
        )
        
        return InvestmentGradeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/investment/grade/batch")
async def batch_grade_investment(request: BatchGradeRequest):
    """
    Grade multiple players at once.
    
    Input: List of player dicts with keys: player_id, raw_rating, role, age, record_date
    """
    try:
        results = grader.batch_grade(request.players)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/age-curve/{role}/{age}", response_model=AgeCurveResponse)
async def get_age_curve(role: str, age: int = Query(..., ge=16, le=45)):
    """
    Get age curve analysis for a role and age.
    
    Returns career stage (rising/peak/declining) and peak proximity.
    """
    try:
        result = compute_age_curve(role, age)
        return AgeCurveResponse(
            role=result.role,
            age=result.age,
            peak_range=result.peak_range,
            career_stage=result.career_stage,
            peak_proximity=result.peak_proximity,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/roles")
async def get_roles():
    """Get list of available roles and their replacement levels."""
    return {
        "roles": [
            {"name": role, "replacement_level": level}
            for role, level in REPLACEMENT_LEVELS.items()
        ]
    }


@router.get("/health")
async def analytics_health():
    """Health check for analytics module."""
    return {
        "status": "healthy",
        "calculators": {
            "simrating": sim_calc is not None,
            "rar": rar_calc is not None,
            "grader": grader is not None,
        },
        "available_roles": get_all_roles(),
    }


def _interpret_rar(rar: float) -> str:
    """Human-readable RAR interpretation."""
    if rar >= 1.30:
        return "Elite - Franchise player material"
    elif rar >= 1.15:
        return "All-Star - Core team piece"
    elif rar >= 1.00:
        return "Starter - Above replacement level"
    elif rar >= 0.85:
        return "Below average - Development needed"
    else:
        return "Replacement level - High risk"
