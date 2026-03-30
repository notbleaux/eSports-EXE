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
@router.post(
    "/simrating/calculate",
    response_model=SimRatingResponse,
    summary="Calculate SimRating",
    description="""
    Calculate SimRating from z-scored components.
    
    ## Formula
    SimRating uses 5 equal-weighted components (0.20 each):
    - kills_z
    - deaths_z (inverted, lower is better)
    - adjusted_kill_value_z (NOT raw ACS)
    - adr_z
    - kast_pct_z
    
    ```
    SimRating = mean(z_scores) * 50 + 100
    ```
    
    ## Interpretation
    - 100 = Average
    - 115 = One standard deviation above average
    - 130 = Elite performer
    
    ## Example Request
    ```json
    {
      "kills_z": 1.2,
      "deaths_z": -0.5,
      "adjusted_kill_value_z": 1.0,
      "adr_z": 0.8,
      "kast_pct_z": 0.6
    }
    ```
    
    ## Response Codes
    - 200: Calculation successful
    - 400: Invalid input data
    """,
    responses={
        200: {"description": "SimRating calculated successfully", "model": SimRatingResponse},
        400: {"description": "Invalid input data"},
    },
)
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


@router.post(
    "/rar/calculate",
    response_model=RARResponse,
    summary="Calculate RAR (Role-Adjusted Replacement)",
    description="""
    Calculate Role-Adjusted Replacement (RAR) value.
    
    RAR compares a player's performance to replacement-level
    for their specific role.
    
    ## Replacement Levels by Role
    | Role | Replacement Level |
    |------|-------------------|
    | Entry | 0.75 |
    | IGL | 0.65 |
    | Controller | 0.70 |
    | Initiator | 0.68 |
    | Sentinel | 0.72 |
    
    ## Formula
    ```
    RAR = RawRating / ReplacementLevel
    ```
    
    ## Interpretation
    - 1.30+ = Elite - Franchise player material
    - 1.15+ = All-Star - Core team piece
    - 1.00+ = Starter - Above replacement level
    - 0.85+ = Below average - Development needed
    - < 0.85 = Replacement level - High risk
    
    ## Example Request
    ```json
    {
      "raw_rating": 108.2,
      "role": "Entry"
    }
    ```
    
    ## Response Codes
    - 200: Calculation successful
    - 400: Invalid role or input data
    """,
    responses={
        200: {"description": "RAR calculated successfully", "model": RARResponse},
        400: {"description": "Invalid role or input data"},
    },
)
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


@router.post(
    "/investment/grade",
    response_model=InvestmentGradeResponse,
    summary="Grade investment prospect",
    description="""
    Grade a player as an investment prospect.
    
    Combines RAR score, age curve position, and temporal decay
    to produce a final investment grade.
    
    ## Grades
    | Grade | Range | Description |
    |-------|-------|-------------|
    | S+ | 2.5+ | Generational prospect |
    | S | 2.0-2.5 | Elite investment |
    | A+ | 1.5-2.0 | Strong buy |
    | A | 1.0-1.5 | Good value |
    | B | 0.5-1.0 | Developmental |
    | C | < 0.5 | High risk |
    
    ## Age Curve Considerations
    | Role | Peak Age Range |
    |------|----------------|
    | Entry | 20-24 |
    | IGL | 26-30 |
    | Controller | 22-27 |
    | Initiator | 21-25 |
    | Sentinel | 23-28 |
    
    ## Example Request
    ```json
    {
      "raw_rating": 108.2,
      "role": "Entry",
      "age": 21,
      "record_date": "2026-03-01T00:00:00Z"
    }
    ```
    
    ## Response Codes
    - 200: Grading successful
    - 400: Invalid input data
    """,
    responses={
        200: {"description": "Investment grade calculated", "model": InvestmentGradeResponse},
        400: {"description": "Invalid input data"},
    },
)
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


@router.post(
    "/investment/grade/batch",
    summary="Batch grade players",
    description="""
    Grade multiple players at once for efficiency.
    
    ## Input Format
    ```json
    {
      "players": [
        {
          "player_id": "player_001",
          "raw_rating": 115.0,
          "role": "IGL",
          "age": 27,
          "record_date": "2026-03-01T00:00:00Z"
        }
      ]
    }
    ```
    
    ## Response Codes
    - 200: Batch grading completed
    - 400: Invalid input data
    """,
    responses={
        200: {"description": "Batch grading completed"},
        400: {"description": "Invalid input data"},
    },
)
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


@router.get(
    "/age-curve/{role}/{age}",
    response_model=AgeCurveResponse,
    summary="Get age curve analysis",
    description="""
    Get age curve analysis for a role and age.
    
    Returns career stage (rising/peak/declining) and peak proximity.
    
    ## Peak Ages by Role
    | Role | Peak Range |
    |------|------------|
    | Entry | 20-24 |
    | IGL | 26-30 |
    | Controller | 22-27 |
    | Initiator | 21-25 |
    | Sentinel | 23-28 |
    
    ## Example Request
    ```
    GET /api/v1/analytics/age-curve/Entry/21
    ```
    
    ## Example Response
    ```json
    {
      "role": "Entry",
      "age": 21,
      "peak_range": [20, 24],
      "career_stage": "peak",
      "peak_proximity": 0.95
    }
    ```
    
    ## Response Codes
    - 200: Analysis successful
    - 400: Invalid role or age
    """,
    responses={
        200: {"description": "Age curve analysis", "model": AgeCurveResponse},
        400: {"description": "Invalid role or age"},
    },
)
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


@router.get(
    "/roles",
    summary="List available roles",
    description="""
    Get list of available roles and their replacement levels.
    
    ## Available Roles
    - Entry (replacement_level: 0.75)
    - IGL (replacement_level: 0.65)
    - Controller (replacement_level: 0.70)
    - Initiator (replacement_level: 0.68)
    - Sentinel (replacement_level: 0.72)
    """,
    response_description="List of roles with replacement levels",
)
async def get_roles():
    """Get list of available roles and their replacement levels."""
    return {
        "roles": [
            {"name": role, "replacement_level": level}
            for role, level in REPLACEMENT_LEVELS.items()
        ]
    }


@router.get(
    "/health",
    summary="Analytics health check",
    description="Health check for analytics module. Returns status of all calculators.",
    response_description="Analytics module status including available calculators and roles",
)
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
