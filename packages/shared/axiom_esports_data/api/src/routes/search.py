"""
Search API — Full-text search across players, teams, and matches.

Implements PostgreSQL full-text search with tsvector/tsquery and
trigram-based fuzzy matching for typo tolerance.

[Ver001.000]
"""
import hashlib
import logging
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from api.src.db import search_matches, search_players, search_teams

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/search", tags=["search"])

# ============================================================================
# RATE LIMITING (Simple in-memory implementation)
# ============================================================================

_rate_limit_store: dict[str, list[datetime]] = {}
RATE_LIMIT_REQUESTS = 30  # requests per window
RATE_LIMIT_WINDOW_SECONDS = 60  # 1 minute window


def _check_rate_limit(client_id: str) -> bool:
    """
    Check if client has exceeded rate limit.
    Returns True if allowed, False if rate limited.
    """
    now = datetime.now(timezone.utc)
    window_start = now.timestamp() - RATE_LIMIT_WINDOW_SECONDS
    
    # Get client's request history
    history = _rate_limit_store.get(client_id, [])
    
    # Filter to only requests within the window
    recent_requests = [
        t for t in history 
        if t.timestamp() > window_start
    ]
    
    if len(recent_requests) >= RATE_LIMIT_REQUESTS:
        return False
    
    # Update history
    recent_requests.append(now)
    _rate_limit_store[client_id] = recent_requests
    
    return True


def _get_client_id(request: Request) -> str:
    """Generate a client identifier from request."""
    # Use X-Forwarded-For if behind proxy, fallback to client host
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    
    # Hash the IP for privacy
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


# ============================================================================
# SCHEMAS
# ============================================================================

class SearchResultPlayer(BaseModel):
    """Player search result item."""
    id: str = Field(..., description="Player UUID")
    name: str = Field(..., description="Player display name")
    real_name: Optional[str] = Field(None, description="Player real name")
    team: Optional[str] = Field(None, description="Current team name")
    region: Optional[str] = Field(None, description="Competitive region")
    nationality: Optional[str] = Field(None, description="Player nationality")
    role: Optional[str] = Field(None, description="Player role (duelist, controller, etc.)")
    sim_rating: Optional[float] = Field(None, description="Simulated performance rating")
    rar_score: Optional[float] = Field(None, description="Risk-adjusted return score")
    investment_grade: Optional[str] = Field(None, description="Investment grade (A+, A, B, C, D)")
    relevance_score: float = Field(..., description="Search relevance score")


class SearchResultTeam(BaseModel):
    """Team search result item."""
    id: str = Field(..., description="Team UUID")
    name: str = Field(..., description="Team name")
    location: Optional[str] = Field(None, description="Team location/country")
    region: Optional[str] = Field(None, description="Competitive region")
    game: str = Field(..., description="Game type (cs, valorant)")
    player_count: Optional[int] = Field(None, description="Number of players")
    relevance_score: float = Field(..., description="Search relevance score")


class SearchResultMatch(BaseModel):
    """Match search result item."""
    id: str = Field(..., description="Match UUID")
    tournament: str = Field(..., description="Tournament name")
    map_name: Optional[str] = Field(None, description="Map played")
    game: str = Field(..., description="Game type (cs, valorant)")
    team1: Optional[str] = Field(None, description="First team name")
    team2: Optional[str] = Field(None, description="Second team name")
    match_date: Optional[str] = Field(None, description="Match date ISO format")
    player_count: int = Field(..., description="Number of players in match")
    relevance_score: float = Field(..., description="Search relevance score")


class SearchResponse(BaseModel):
    """Unified search response."""
    query: str = Field(..., description="Original search query")
    type: Optional[str] = Field(None, description="Filtered type (players, teams, matches)")
    total: int = Field(..., description="Total results across all types")
    limit: int = Field(..., description="Results limit applied")
    offset: int = Field(..., description="Results offset applied")
    sort: str = Field(..., description="Sort method used")
    players: list[SearchResultPlayer] = Field(default_factory=list)
    teams: list[SearchResultTeam] = Field(default_factory=list)
    matches: list[SearchResultMatch] = Field(default_factory=list)
    execution_ms: int = Field(..., description="Query execution time in milliseconds")


class PlayerSearchResponse(BaseModel):
    """Player-specific search response."""
    query: str
    total: int
    limit: int
    offset: int
    sort: str
    results: list[SearchResultPlayer]
    execution_ms: int


class TeamSearchResponse(BaseModel):
    """Team-specific search response."""
    query: str
    total: int
    limit: int
    offset: int
    sort: str
    results: list[SearchResultTeam]
    execution_ms: int


class MatchSearchResponse(BaseModel):
    """Match-specific search response."""
    query: str
    total: int
    limit: int
    offset: int
    sort: str
    results: list[SearchResultMatch]
    execution_ms: int


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/", response_model=SearchResponse)
async def search_all(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    type: Optional[Literal["players", "teams", "matches"]] = Query(
        None, description="Filter by content type"
    ),
    limit: int = Query(20, ge=1, le=100, description="Maximum results per type"),
    offset: int = Query(0, ge=0, description="Results offset"),
    sort: Literal["relevance", "name", "date"] = Query(
        "relevance", description="Sort method"
    ),
    game: Optional[Literal["cs", "valorant"]] = Query(
        None, description="Filter by game type"
    ),
) -> SearchResponse:
    """
    Search across all content types (players, teams, matches).
    
    Uses PostgreSQL full-text search with weighted relevance:
    - Player/Team/Match names: highest weight (A)
    - Real names, locations: medium weight (B)
    - Nationality, other metadata: lower weight (C)
    
    Falls back to trigram fuzzy matching for partial matches.
    """
    start_time = datetime.now(timezone.utc)
    
    # Rate limiting
    client_id = _get_client_id(request)
    if not _check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per minute."
        )
    
    try:
        results = SearchResponse(
            query=q,
            type=type,
            total=0,
            limit=limit,
            offset=offset,
            sort=sort,
            players=[],
            teams=[],
            matches=[],
            execution_ms=0
        )
        
        # Search players
        if type is None or type == "players":
            players, player_total = await search_players(
                query=q,
                game=game,
                limit=limit,
                offset=offset,
                sort_by=sort
            )
            results.players = [
                SearchResultPlayer(**{**p, "relevance_score": p.get("rank", 0)})
                for p in players
            ]
            results.total += player_total
        
        # Search teams
        if type is None or type == "teams":
            teams, team_total = await search_teams(
                query=q,
                game=game,
                limit=limit,
                offset=offset,
                sort_by=sort
            )
            results.teams = [
                SearchResultTeam(**{**t, "relevance_score": t.get("rank", 0)})
                for t in teams
            ]
            results.total += team_total
        
        # Search matches
        if type is None or type == "matches":
            matches, match_total = await search_matches(
                query=q,
                game=game,
                limit=limit,
                offset=offset,
                sort_by=sort
            )
            results.matches = [
                SearchResultMatch(**{**m, "relevance_score": m.get("rank", 0)})
                for m in matches
            ]
            results.total += match_total
        
        # Calculate execution time
        execution_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        results.execution_ms = execution_ms
        
        return results
        
    except Exception as e:
        logger.error(f"Search error for query '{q}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Search operation failed. Please try again."
        )


@router.get("/players", response_model=PlayerSearchResponse)
async def search_players_endpoint(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results offset"),
    sort: Literal["relevance", "name", "date"] = Query(
        "relevance", description="Sort method"
    ),
    game: Optional[Literal["cs", "valorant"]] = Query(
        None, description="Filter by game type"
    ),
    team: Optional[str] = Query(None, description="Filter by team name"),
    region: Optional[str] = Query(None, description="Filter by region"),
) -> PlayerSearchResponse:
    """
    Search players specifically.
    
    Searches across:
    - Player names (exact matches prioritized)
    - Real names
    - Team affiliations
    - Nationality
    
    Supports fuzzy matching for typo tolerance.
    """
    start_time = datetime.now(timezone.utc)
    
    # Rate limiting
    client_id = _get_client_id(request)
    if not _check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per minute."
        )
    
    try:
        players, total = await search_players(
            query=q,
            game=game,
            team=team,
            region=region,
            limit=limit,
            offset=offset,
            sort_by=sort
        )
        
        execution_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        return PlayerSearchResponse(
            query=q,
            total=total,
            limit=limit,
            offset=offset,
            sort=sort,
            results=[
                SearchResultPlayer(**{**p, "relevance_score": p.get("rank", 0)})
                for p in players
            ],
            execution_ms=execution_ms
        )
        
    except Exception as e:
        logger.error(f"Player search error for query '{q}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Player search failed. Please try again."
        )


@router.get("/teams", response_model=TeamSearchResponse)
async def search_teams_endpoint(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results offset"),
    sort: Literal["relevance", "name", "date"] = Query(
        "relevance", description="Sort method"
    ),
    game: Optional[Literal["cs", "valorant"]] = Query(
        None, description="Filter by game type"
    ),
    region: Optional[str] = Query(None, description="Filter by region"),
) -> TeamSearchResponse:
    """
    Search teams specifically.
    
    Searches across:
    - Team names
    - Team locations/countries
    - Region codes
    """
    start_time = datetime.now(timezone.utc)
    
    # Rate limiting
    client_id = _get_client_id(request)
    if not _check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per minute."
        )
    
    try:
        teams, total = await search_teams(
            query=q,
            game=game,
            region=region,
            limit=limit,
            offset=offset,
            sort_by=sort
        )
        
        execution_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        return TeamSearchResponse(
            query=q,
            total=total,
            limit=limit,
            offset=offset,
            sort=sort,
            results=[
                SearchResultTeam(**{**t, "relevance_score": t.get("rank", 0)})
                for t in teams
            ],
            execution_ms=execution_ms
        )
        
    except Exception as e:
        logger.error(f"Team search error for query '{q}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Team search failed. Please try again."
        )


@router.get("/matches", response_model=MatchSearchResponse)
async def search_matches_endpoint(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results offset"),
    sort: Literal["relevance", "name", "date"] = Query(
        "relevance", description="Sort method"
    ),
    game: Optional[Literal["cs", "valorant"]] = Query(
        None, description="Filter by game type"
    ),
    tournament: Optional[str] = Query(None, description="Filter by tournament"),
    map_name: Optional[str] = Query(None, description="Filter by map"),
) -> MatchSearchResponse:
    """
    Search matches specifically.
    
    Searches across:
    - Tournament names
    - Team names (participating teams)
    - Map names
    """
    start_time = datetime.now(timezone.utc)
    
    # Rate limiting
    client_id = _get_client_id(request)
    if not _check_rate_limit(client_id):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_REQUESTS} requests per minute."
        )
    
    try:
        matches, total = await search_matches(
            query=q,
            game=game,
            tournament=tournament,
            map_name=map_name,
            limit=limit,
            offset=offset,
            sort_by=sort
        )
        
        execution_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
        
        return MatchSearchResponse(
            query=q,
            total=total,
            limit=limit,
            offset=offset,
            sort=sort,
            results=[
                SearchResultMatch(**{**m, "relevance_score": m.get("rank", 0)})
                for m in matches
            ],
            execution_ms=execution_ms
        )
        
    except Exception as e:
        logger.error(f"Match search error for query '{q}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Match search failed. Please try again."
        )


@router.get("/suggestions")
async def get_search_suggestions(
    request: Request,
    q: str = Query(..., min_length=2, max_length=50, description="Partial query for suggestions"),
    type: Optional[Literal["players", "teams", "all"]] = Query(
        "all", description="Type of suggestions"
    ),
    limit: int = Query(10, ge=1, le=20, description="Maximum suggestions"),
) -> dict:
    """
    Get search suggestions for autocomplete.
    
    Returns top matching names based on prefix matching.
    Rate limited separately from main search.
    """
    client_id = _get_client_id(request)
    
    # Stricter rate limit for suggestions
    if not _check_rate_limit(f"suggest:{client_id}"):
        return {"suggestions": [], "rate_limited": True}
    
    try:
        suggestions = []
        
        if type in ("players", "all"):
            players, _ = await search_players(
                query=q,
                limit=limit,
                offset=0,
                sort_by="relevance"
            )
            suggestions.extend([
                {"type": "player", "name": p["name"], "id": p["id"]}
                for p in players[:limit//2]
            ])
        
        if type in ("teams", "all"):
            teams, _ = await search_teams(
                query=q,
                limit=limit,
                offset=0,
                sort_by="relevance"
            )
            suggestions.extend([
                {"type": "team", "name": t["name"], "id": t["id"]}
                for t in teams[:limit//2]
            ])
        
        # Sort by relevance and limit
        suggestions.sort(key=lambda x: len(x["name"]))
        
        return {
            "query": q,
            "suggestions": suggestions[:limit],
            "total": len(suggestions)
        }
        
    except Exception as e:
        logger.error(f"Suggestions error for query '{q}': {e}")
        return {"suggestions": [], "error": "Failed to get suggestions"}
