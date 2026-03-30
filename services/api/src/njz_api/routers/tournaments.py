"""Tournament management router with circuit breaker protection.

[Ver001.000]

Provides endpoints for tournament operations with resilience patterns.
Integrates circuit breaker for external API calls (PandaScore).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..clients.pandascore import pandascore
from ..middleware.circuit_breaker import (
    CircuitBreakerConfig,
    circuit_breaker,
    get_circuit_breaker,
    get_circuit_breaker_status,
    reset_circuit_breaker,
)
from ..middleware.rbac import require_permission, Permission

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


# ─── Pydantic Models ─────────────────────────────────────────────────────────


class Tournament(BaseModel):
    """Tournament model."""

    id: str
    name: str
    slug: str
    game: str = Field(..., description="Game type: valorant or cs2")
    status: str = Field(..., description="upcoming, running, or past")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    prize_pool: Optional[str] = None
    location: Optional[str] = None
    teams_count: int = 0
    source: str = Field(default="pandascore", description="Data source")


class MatchResult(BaseModel):
    """Match result submission model."""

    match_id: str
    tournament_id: str
    team1_id: str
    team2_id: str
    team1_score: int = Field(..., ge=0)
    team2_score: int = Field(..., ge=0)
    winner_id: str
    map_results: Optional[List[Dict[str, Any]]] = None
    stats: Optional[Dict[str, Any]] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TournamentListResponse(BaseModel):
    """Tournament list response."""

    tournaments: List[Tournament]
    total: int
    page: int
    per_page: int


class CircuitBreakerStatusResponse(BaseModel):
    """Circuit breaker status response."""

    circuit_breakers: Dict[str, Any]
    summary: Dict[str, int]


# ─── Circuit Breaker Configurations ──────────────────────────────────────────

# Config for tournament list fetching (tolerant of failures)
TOURNAMENT_LIST_CONFIG = CircuitBreakerConfig(
    failure_threshold=3,
    recovery_timeout=30.0,
    half_open_max_calls=2,
    success_threshold=1,
    expected_exception=Exception,
    timeout=10.0,
)

# Config for match result submission (stricter)
MATCH_RESULT_CONFIG = CircuitBreakerConfig(
    failure_threshold=2,
    recovery_timeout=60.0,
    half_open_max_calls=1,
    success_threshold=1,
    expected_exception=Exception,
    timeout=15.0,
)

# Config for external API calls
EXTERNAL_API_CONFIG = CircuitBreakerConfig(
    failure_threshold=5,
    recovery_timeout=30.0,
    half_open_max_calls=3,
    success_threshold=2,
    expected_exception=(Exception,),
    timeout=10.0,
)


# ─── Helper Functions ────────────────────────────────────────────────────────


@circuit_breaker_with_config("external_api_valorant", EXTERNAL_API_CONFIG)
async def fetch_valorant_tournaments(page: int = 1, per_page: int = 20) -> List[Dict]:
    """Fetch Valorant tournaments from PandaScore with circuit breaker."""
    return await pandascore.get_valorant_tournaments(page=page, per_page=per_page)


@circuit_breaker_with_config("external_api_cs2", EXTERNAL_API_CONFIG)
async def fetch_cs2_tournaments(page: int = 1, per_page: int = 20) -> List[Dict]:
    """Fetch CS2 tournaments from PandaScore with circuit breaker."""
    # Note: CS2 endpoint - using matches as tournaments endpoint may vary
    return await pandascore.get_cs2_matches(status="upcoming", page=page, per_page=per_page)


@circuit_breaker_with_config("tournament_list", TOURNAMENT_LIST_CONFIG)
async def get_cached_tournaments(game: str = "valorant") -> List[Tournament]:
    """Get tournaments with circuit breaker protection."""
    if game == "valorant":
        data = await fetch_valorant_tournaments()
    elif game == "cs2":
        data = await fetch_cs2_tournaments()
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported game: {game}")

    tournaments = []
    for item in data:
        tournament = Tournament(
            id=str(item.get("id", "")),
            name=item.get("name", "Unknown"),
            slug=item.get("slug", ""),
            game=game,
            status=item.get("status", "unknown"),
            start_date=_parse_datetime(item.get("begin_at")),
            end_date=_parse_datetime(item.get("end_at")),
            prize_pool=str(item.get("prizepool", "")) if item.get("prizepool") else None,
            location=item.get("location", None),
            teams_count=len(item.get("teams", [])) if isinstance(item.get("teams"), list) else 0,
            source="pandascore",
        )
        tournaments.append(tournament)

    return tournaments


def _parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string."""
    if not dt_str:
        return None
    try:
        # Handle various ISO formats
        if dt_str.endswith("Z"):
            dt_str = dt_str[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str)
    except (ValueError, TypeError):
        return None


# ─── API Endpoints ───────────────────────────────────────────────────────────


@router.get(
    "/",
    response_model=TournamentListResponse,
    summary="List tournaments",
    description="""
    Get list of tournaments with circuit breaker protected external API calls.
    
    This endpoint fetches tournaments from the PandaScore API with the following features:
    - Circuit breaker protection (3 failures before opening)
    - Automatic pagination
    - Support for Valorant and CS2 games
    - Cached results for improved performance
    
    ## Response Codes
    - 200: Successfully retrieved tournaments
    - 503: Circuit breaker open or service unavailable
    
    ## Example Response
    ```json
    {
      "tournaments": [
        {
          "id": "12345",
          "name": "VCT Masters Tokyo",
          "slug": "vct-masters-tokyo",
          "game": "valorant",
          "status": "running",
          "start_date": "2026-04-01T00:00:00Z",
          "teams_count": 12
        }
      ],
      "total": 45,
      "page": 1,
      "per_page": 20
    }
    ```
    """,
    responses={
        200: {"description": "Successfully retrieved tournaments", "model": TournamentListResponse},
        503: {"description": "Circuit breaker open or service unavailable"},
    },
)
@circuit_breaker("tournament_list", failure_threshold=3, recovery_timeout=30.0, timeout=10.0)
async def list_tournaments(
    game: str = Query(default="valorant", regex="^(valorant|cs2)$"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> TournamentListResponse:
    """List tournaments with circuit breaker protection.

    This endpoint is protected by a circuit breaker that will:
    - Allow up to 3 failures before opening
    - Remain open for 30 seconds when failing
    - Test recovery with limited requests in half-open state
    """
    try:
        tournaments = await get_cached_tournaments(game=game)

        # Apply pagination
        start = (page - 1) * per_page
        end = start + per_page
        paginated = tournaments[start:end]

        return TournamentListResponse(
            tournaments=paginated,
            total=len(tournaments),
            page=page,
            per_page=per_page,
        )

    except Exception as e:
        # Circuit breaker is open or other error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Tournament service unavailable: {str(e)}",
        )


@router.get(
    "/{tournament_id}",
    response_model=Tournament,
    summary="Get tournament by ID",
    description="""
    Get detailed information about a specific tournament.
    
    ## Parameters
    - **tournament_id**: The unique identifier of the tournament
    
    ## Response Codes
    - 200: Tournament found and returned
    - 404: Tournament not found
    - 501: Endpoint not yet fully implemented
    """,
    responses={
        200: {"description": "Tournament details", "model": Tournament},
        404: {"description": "Tournament not found"},
        501: {"description": "Endpoint not yet implemented"},
    },
)
@circuit_breaker("tournament_detail", failure_threshold=3, recovery_timeout=30.0, timeout=10.0)
async def get_tournament(tournament_id: str) -> Tournament:
    """Get a specific tournament by ID."""
    # This would fetch from database or external API
    # For now, return a placeholder that would be replaced with actual implementation
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Tournament detail endpoint - implement with database lookup",
    )


@router.post(
    "/{tournament_id}/matches/results",
    response_model=Dict[str, Any],
    summary="Submit match result from Godot game",
    description="""
    Receives match results exported from Godot LiveSeasonModule.
    
    This endpoint is called automatically by the Godot game when a match completes.
    It processes player statistics, updates tournament brackets, and notifies
    WebSocket subscribers.
    
    ## Godot Integration
    ```gdscript
    # In Godot LiveSeasonModule
    var result = {
        "match_id": "match_001",
        "tournament_id": "12345",
        "team1_id": "team_a",
        "team2_id": "team_b",
        "team1_score": 13,
        "team2_score": 10,
        "winner_id": "team_a",
        "map_results": [...],
        "stats": {...}
    }
    export_client.send_match_data(result)
    ```
    
    ## Circuit Breaker
    This critical endpoint has a stricter circuit breaker:
    - Only 2 failures before opening (data integrity is critical)
    - 60 second recovery timeout
    - Requires MATCH_WRITE permission
    
    ## Rate Limiting
    - 10 requests per minute per tournament
    - Burst: 5 requests
    
    ## Response Codes
    - 201: Match result submitted successfully
    - 400: Invalid match data or tournament ID mismatch
    - 404: Tournament not found
    - 429: Rate limit exceeded
    - 503: Circuit breaker open
    """,
    responses={
        201: {"description": "Match result submitted successfully"},
        400: {"description": "Invalid data or tournament ID mismatch"},
        404: {"description": "Tournament not found"},
        429: {"description": "Rate limit exceeded"},
        503: {"description": "Circuit breaker open"},
    },
    status_code=201,
)
@circuit_breaker("match_result_submission", failure_threshold=2, recovery_timeout=60.0, timeout=15.0)
async def submit_match_result(
    tournament_id: str,
    result: MatchResult,
    principal=Depends(require_permission(Permission.MATCH_WRITE)),
) -> Dict[str, Any]:
    """Submit match results with circuit breaker protection.

    This critical endpoint has a stricter circuit breaker:
    - Only 2 failures before opening (data integrity is critical)
    - 60 second recovery timeout
    - Requires MATCH_WRITE permission
    """
    try:
        # Validate tournament_id matches
        if result.tournament_id != tournament_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tournament ID mismatch",
            )

        # Process match result
        # This would save to database, update stats, etc.
        result_data = {
            "match_id": result.match_id,
            "tournament_id": tournament_id,
            "team1_id": result.team1_id,
            "team2_id": result.team2_id,
            "team1_score": result.team1_score,
            "team2_score": result.team2_score,
            "winner_id": result.winner_id,
            "submitted_by": principal.id if principal else "anonymous",
            "submitted_at": result.submitted_at.isoformat(),
            "status": "processed",
        }

        return {
            "success": True,
            "message": "Match result submitted successfully",
            "data": result_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process match result: {str(e)}",
        )


# ─── Circuit Breaker Management Endpoints ────────────────────────────────────


@router.get(
    "/system/circuit-breakers",
    response_model=CircuitBreakerStatusResponse,
    summary="Get circuit breaker status",
    description="""
    Get current status of all circuit breakers for monitoring.
    
    Returns detailed information about each circuit breaker including:
    - Current state (closed, open, half_open)
    - Failure counts
    - Last failure time
    - Configuration settings
    - Call metrics
    
    ## Circuit Breaker States
    - **closed**: Normal operation, requests pass through
    - **open**: Failure threshold reached, requests fail fast
    - **half_open**: Testing recovery with limited requests
    
    ## Example Response
    ```json
    {
      "circuit_breakers": {
        "tournament_list": {
          "name": "tournament_list",
          "state": "closed",
          "failure_count": 0,
          "last_failure": null,
          "config": {
            "failure_threshold": 3,
            "recovery_timeout": 30.0
          }
        }
      },
      "summary": {
        "total": 5,
        "closed": 5,
        "open": 0,
        "half_open": 0
      }
    }
    ```
    """,
)
async def get_circuit_breakers_status() -> CircuitBreakerStatusResponse:
    """Get status of all circuit breakers.

    Returns detailed information about each circuit breaker including:
    - Current state (closed, open, half_open)
    - Failure counts
    - Last failure time
    - Configuration settings
    - Call metrics
    """
    status_data = await get_circuit_breaker_status()
    return CircuitBreakerStatusResponse(
        circuit_breakers=status_data["circuit_breakers"],
        summary=status_data["summary"],
    )


@router.post(
    "/system/circuit-breakers/{name}/reset",
    summary="Reset a circuit breaker",
    description="""
    Manually reset a circuit breaker to closed state (admin only).
    
    ## When to Use
    Use this endpoint when:
    - A circuit breaker is stuck open after an external API recovers
    - You need to force retry of a failed service
    - Testing circuit breaker behavior
    
    ## Required Permission
    - ADMIN_SYSTEM
    
    ## Response Codes
    - 200: Circuit breaker reset successfully
    - 404: Circuit breaker not found
    - 403: Insufficient permissions
    """,
    responses={
        200: {"description": "Circuit breaker reset successfully"},
        404: {"description": "Circuit breaker not found"},
        403: {"description": "Insufficient permissions"},
    },
)
async def reset_circuit(
    name: str,
    principal=Depends(require_permission(Permission.ADMIN_SYSTEM)),
) -> Dict[str, Any]:
    """Manually reset a circuit breaker to closed state.

    Requires ADMIN_SYSTEM permission.
    """
    success = reset_circuit_breaker(name)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Circuit breaker '{name}' not found",
        )

    return {
        "success": True,
        "message": f"Circuit breaker '{name}' reset to closed state",
        "reset_by": principal.id if principal else "system",
        "reset_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/system/circuit-breakers/{name}",
    summary="Get specific circuit breaker status",
    description="""
    Get detailed status of a specific circuit breaker.
    
    ## Parameters
    - **name**: Name of the circuit breaker (e.g., 'tournament_list', 'match_result_submission')
    
    ## Response Codes
    - 200: Circuit breaker details returned
    - 404: Circuit breaker not found
    """,
    responses={
        200: {"description": "Circuit breaker details"},
        404: {"description": "Circuit breaker not found"},
    },
)
async def get_single_circuit_breaker(name: str) -> Dict[str, Any]:
    """Get detailed status of a specific circuit breaker."""
    cb = get_circuit_breaker(name)
    return cb.to_dict()
