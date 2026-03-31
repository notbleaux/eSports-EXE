"""
ROTAS API Routes - Stats Reference Endpoints.

Provides REST API for:
- Player profiles and statistics
- Team information and rosters
- Match history and details
- Tournament listings
- Leaderboards and rankings
"""

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ...database import get_db_pool
from ...redis_cache import RedisCache

router = APIRouter(prefix="/rotas", tags=["ROTAS - Stats Reference"])
cache = RedisCache()


# Pydantic Models for API Responses

class PlayerSummary(BaseModel):
    id: int
    name: str
    slug: str
    nationality: Optional[str]
    game: str
    team_name: Optional[str]
    
    class Config:
        from_attributes = True


class PlayerDetail(PlayerSummary):
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PlayerStats(BaseModel):
    total_matches: int
    matches_won: int
    matches_lost: int
    overall_kd: float
    avg_kills_per_round: float
    avg_damage_per_round: float
    total_first_bloods: int
    total_clutches_won: int
    recent_win_rate: float
    recent_avg_rating: float
    
    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    id: int
    name: str
    slug: str
    acronym: Optional[str]
    game: str
    region: Optional[str]
    
    class Config:
        from_attributes = True


class TeamDetail(TeamSummary):
    players: List[PlayerSummary]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TeamStats(BaseModel):
    total_matches: int
    matches_won: int
    matches_lost: int
    win_rate: float
    total_rounds: int
    rounds_won: int
    round_win_rate: float
    recent_form: Optional[List[str]]
    
    class Config:
        from_attributes = True


class MatchSummary(BaseModel):
    id: int
    name: str
    game: str
    status: str
    scheduled_at: Optional[datetime]
    finished_at: Optional[datetime]
    team1_name: Optional[str]
    team2_name: Optional[str]
    team1_score: int
    team2_score: int
    winner_name: Optional[str]
    
    class Config:
        from_attributes = True


class MatchDetail(MatchSummary):
    team1_id: Optional[int]
    team2_id: Optional[int]
    winner_id: Optional[int]
    best_of: int
    map_veto: Optional[dict]
    
    class Config:
        from_attributes = True


class TournamentSummary(BaseModel):
    id: int
    name: str
    slug: str
    game: str
    tier: Optional[str]
    region: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: str
    prize_pool: Optional[str]
    
    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    per_page: int
    pages: int


# Player Endpoints

@router.get("/players", response_model=PaginatedResponse)
async def list_players(
    game: Optional[str] = Query(None, description="Filter by game: 'valorant' or 'cs2'"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    search: Optional[str] = Query(None, description="Search by player name"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page")
):
    """List players with optional filtering."""
    pool = await get_db_pool()
    
    # Build query
    where_clauses = []
    params = []
    param_idx = 1
    
    if game:
        where_clauses.append(f"p.game = ${param_idx}")
        params.append(game)
        param_idx += 1
    
    if team_id:
        where_clauses.append(f"p.team_id = ${param_idx}")
        params.append(team_id)
        param_idx += 1
    
    if search:
        where_clauses.append(f"p.name ILIKE ${param_idx}")
        params.append(f"%{search}%")
        param_idx += 1
    
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
    
    # Get total count
    count_sql = f"SELECT COUNT(*) FROM players p {where_sql}"
    total = await pool.fetchval(count_sql, *params)
    
    # Get paginated results
    offset = (page - 1) * per_page
    query = f"""
        SELECT p.id, p.name, p.slug, p.nationality, p.game, t.name as team_name
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        {where_sql}
        ORDER BY p.name
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([per_page, offset])
    
    rows = await pool.fetch(query, *params)
    players = [PlayerSummary(**dict(row)) for row in rows]
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=players,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/players/{player_id}", response_model=PlayerDetail)
async def get_player(player_id: int):
    """Get detailed information about a specific player."""
    pool = await get_db_pool()
    
    row = await pool.fetchrow(
        """
        SELECT p.*, t.name as team_name
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.id = $1
        """,
        player_id
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return PlayerDetail(**dict(row))


@router.get("/players/{player_id}/stats", response_model=PlayerStats)
async def get_player_stats(
    player_id: int,
    game: Optional[str] = Query(None, description="Filter by game")
):
    """Get career statistics for a player."""
    pool = await get_db_pool()
    
    # Check if player exists
    player = await pool.fetchrow("SELECT id FROM players WHERE id = $1", player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get aggregated stats from match_player_stats
    game_filter = "AND game = $2" if game else ""
    params = [player_id]
    if game:
        params.append(game)
    
    row = await pool.fetchrow(
        f"""
        SELECT 
            COUNT(DISTINCT match_id) as total_matches,
            SUM(kills) as total_kills,
            SUM(deaths) as total_deaths,
            SUM(assists) as total_assists,
            CASE WHEN SUM(deaths) > 0 THEN SUM(kills)::float / SUM(deaths) ELSE 0 END as overall_kd,
            CASE WHEN SUM(rounds_played) > 0 THEN SUM(kills)::float / SUM(rounds_played) ELSE 0 END as avg_kills_per_round,
            CASE WHEN SUM(rounds_played) > 0 THEN SUM(damage_dealt)::float / SUM(rounds_played) ELSE 0 END as avg_damage_per_round,
            SUM(first_bloods) as total_first_bloods,
            SUM(clutches_won) as total_clutches_won
        FROM match_player_stats
        WHERE player_id = $1 {game_filter}
        """,
        *params
    )
    
    # Get win count
    win_row = await pool.fetchrow(
        f"""
        SELECT COUNT(*) as matches_won
        FROM match_player_stats mps
        JOIN match_details md ON mps.match_id = md.id
        WHERE mps.player_id = $1 {game_filter}
        AND md.winner_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM players p
            WHERE p.id = $1 AND (
                (md.team1_id = p.team_id AND md.winner_id = md.team1_id) OR
                (md.team2_id = p.team_id AND md.winner_id = md.team2_id)
            )
        )
        """,
        *params
    )
    
    total_matches = row["total_matches"] or 0
    matches_won = win_row["matches_won"] or 0
    
    return PlayerStats(
        total_matches=total_matches,
        matches_won=matches_won,
        matches_lost=total_matches - matches_won,
        overall_kd=round(row["overall_kd"] or 0, 2),
        avg_kills_per_round=round(row["avg_kills_per_round"] or 0, 3),
        avg_damage_per_round=round(row["avg_damage_per_round"] or 0, 1),
        total_first_bloods=row["total_first_bloods"] or 0,
        total_clutches_won=row["total_clutches_won"] or 0,
        recent_win_rate=0.0,  # TODO: Calculate from recent matches
        recent_avg_rating=0.0  # TODO: Calculate from recent matches
    )


# Team Endpoints

@router.get("/teams", response_model=PaginatedResponse)
async def list_teams(
    game: Optional[str] = Query(None, description="Filter by game: 'valorant' or 'cs2'"),
    region: Optional[str] = Query(None, description="Filter by region"),
    search: Optional[str] = Query(None, description="Search by team name"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """List teams with optional filtering."""
    pool = await get_db_pool()
    
    where_clauses = []
    params = []
    param_idx = 1
    
    if game:
        where_clauses.append(f"game = ${param_idx}")
        params.append(game)
        param_idx += 1
    
    if region:
        where_clauses.append(f"region = ${param_idx}")
        params.append(region)
        param_idx += 1
    
    if search:
        where_clauses.append(f"name ILIKE ${param_idx}")
        params.append(f"%{search}%")
        param_idx += 1
    
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
    
    count_sql = f"SELECT COUNT(*) FROM teams {where_sql}"
    total = await pool.fetchval(count_sql, *params)
    
    offset = (page - 1) * per_page
    query = f"""
        SELECT id, name, slug, acronym, game, region
        FROM teams
        {where_sql}
        ORDER BY name
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([per_page, offset])
    
    rows = await pool.fetch(query, *params)
    teams = [TeamSummary(**dict(row)) for row in rows]
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=teams,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/teams/{team_id}", response_model=TeamDetail)
async def get_team(team_id: int):
    """Get detailed information about a team including roster."""
    pool = await get_db_pool()
    
    # Get team info
    team_row = await pool.fetchrow(
        "SELECT * FROM teams WHERE id = $1",
        team_id
    )
    
    if not team_row:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get players
    player_rows = await pool.fetch(
        """
        SELECT id, name, slug, nationality, game, 
               (SELECT name FROM teams WHERE id = $1) as team_name
        FROM players
        WHERE team_id = $1
        ORDER BY name
        """,
        team_id
    )
    
    players = [PlayerSummary(**dict(row)) for row in player_rows]
    
    team_dict = dict(team_row)
    team_dict["players"] = players
    
    return TeamDetail(**team_dict)


@router.get("/teams/{team_id}/stats", response_model=TeamStats)
async def get_team_stats(
    team_id: int,
    game: Optional[str] = Query(None, description="Filter by game")
):
    """Get statistics for a team."""
    pool = await get_db_pool()
    
    # Check if team exists
    team = await pool.fetchrow("SELECT id FROM teams WHERE id = $1", team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    game_filter = "AND game = $2" if game else ""
    params = [team_id]
    if game:
        params.append(game)
    
    # Get match stats
    row = await pool.fetchrow(
        f"""
        SELECT 
            COUNT(*) as total_matches,
            SUM(CASE WHEN winner_id = $1 THEN 1 ELSE 0 END) as matches_won,
            SUM(team1_score + team2_score) as total_rounds,
            SUM(CASE WHEN winner_id = $1 THEN 
                CASE WHEN team1_id = $1 THEN team1_score ELSE team2_score END
            ELSE 0 END) as rounds_won
        FROM match_details
        WHERE (team1_id = $1 OR team2_id = $1) AND status = 'finished' {game_filter}
        """,
        *params
    )
    
    total_matches = row["total_matches"] or 0
    matches_won = row["matches_won"] or 0
    total_rounds = row["total_rounds"] or 0
    rounds_won = row["rounds_won"] or 0
    
    return TeamStats(
        total_matches=total_matches,
        matches_won=matches_won,
        matches_lost=total_matches - matches_won,
        win_rate=round(matches_won / total_matches * 100, 1) if total_matches > 0 else 0.0,
        total_rounds=total_rounds,
        rounds_won=rounds_won,
        round_win_rate=round(rounds_won / total_rounds * 100, 1) if total_rounds > 0 else 0.0,
        recent_form=None  # TODO: Calculate recent form
    )


# Match Endpoints

@router.get("/matches", response_model=PaginatedResponse)
async def list_matches(
    game: Optional[str] = Query(None, description="Filter by game"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    status: Optional[str] = Query(None, description="Filter by status: not_started, running, finished"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """List matches with optional filtering."""
    pool = await get_db_pool()
    
    where_clauses = []
    params = []
    param_idx = 1
    
    if game:
        where_clauses.append(f"md.game = ${param_idx}")
        params.append(game)
        param_idx += 1
    
    if team_id:
        where_clauses.append(f"(md.team1_id = ${param_idx} OR md.team2_id = ${param_idx})")
        params.append(team_id)
        param_idx += 1
    
    if status:
        where_clauses.append(f"md.status = ${param_idx}")
        params.append(status)
        param_idx += 1
    
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
    
    count_sql = f"SELECT COUNT(*) FROM match_details md {where_sql}"
    total = await pool.fetchval(count_sql, *params)
    
    offset = (page - 1) * per_page
    query = f"""
        SELECT 
            md.id, md.name, md.game, md.status, md.scheduled_at, md.finished_at,
            md.team1_score, md.team2_score,
            t1.name as team1_name, t2.name as team2_name,
            tw.name as winner_name
        FROM match_details md
        LEFT JOIN teams t1 ON md.team1_id = t1.id
        LEFT JOIN teams t2 ON md.team2_id = t2.id
        LEFT JOIN teams tw ON md.winner_id = tw.id
        {where_sql}
        ORDER BY md.scheduled_at DESC NULLS LAST
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([per_page, offset])
    
    rows = await pool.fetch(query, *params)
    matches = [MatchSummary(**dict(row)) for row in rows]
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=matches,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/matches/{match_id}", response_model=MatchDetail)
async def get_match(match_id: int):
    """Get detailed information about a specific match."""
    pool = await get_db_pool()
    
    row = await pool.fetchrow(
        """
        SELECT 
            md.*,
            t1.name as team1_name, t2.name as team2_name, tw.name as winner_name
        FROM match_details md
        LEFT JOIN teams t1 ON md.team1_id = t1.id
        LEFT JOIN teams t2 ON md.team2_id = t2.id
        LEFT JOIN teams tw ON md.winner_id = tw.id
        WHERE md.id = $1
        """,
        match_id
    )
    
    if not row:
        raise HTTPException(status_code=404, detail="Match not found")
    
    return MatchDetail(**dict(row))


# Tournament Endpoints

@router.get("/tournaments", response_model=PaginatedResponse)
async def list_tournaments(
    game: Optional[str] = Query(None, description="Filter by game"),
    status: Optional[str] = Query(None, description="Filter by status: upcoming, ongoing, finished"),
    tier: Optional[str] = Query(None, description="Filter by tier: S, A, B, C"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """List tournaments with optional filtering."""
    pool = await get_db_pool()
    
    where_clauses = []
    params = []
    param_idx = 1
    
    if game:
        where_clauses.append(f"game = ${param_idx}")
        params.append(game)
        param_idx += 1
    
    if status:
        where_clauses.append(f"status = ${param_idx}")
        params.append(status)
        param_idx += 1
    
    if tier:
        where_clauses.append(f"tier = ${param_idx}")
        params.append(tier)
        param_idx += 1
    
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
    
    count_sql = f"SELECT COUNT(*) FROM tournaments {where_sql}"
    total = await pool.fetchval(count_sql, *params)
    
    offset = (page - 1) * per_page
    query = f"""
        SELECT id, name, slug, game, tier, region, start_date, end_date, status, prize_pool
        FROM tournaments
        {where_sql}
        ORDER BY 
            CASE status 
                WHEN 'ongoing' THEN 1 
                WHEN 'upcoming' THEN 2 
                ELSE 3 
            END,
            start_date DESC NULLS LAST
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([per_page, offset])
    
    rows = await pool.fetch(query, *params)
    tournaments = [TournamentSummary(**dict(row)) for row in rows]
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedResponse(
        items=tournaments,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


# Leaderboard Endpoints

@router.get("/leaderboards/kd")
async def get_kd_leaderboard(
    game: str = Query(..., description="Game: 'valorant' or 'cs2'"),
    min_matches: int = Query(5, ge=1, description="Minimum matches to qualify"),
    limit: int = Query(20, ge=1, le=100)
):
    """Get K/D ratio leaderboard."""
    pool = await get_db_pool()
    
    rows = await pool.fetch(
        """
        SELECT 
            p.id, p.name, p.nationality, t.name as team_name,
            COUNT(DISTINCT mps.match_id) as matches,
            SUM(mps.kills) as kills,
            SUM(mps.deaths) as deaths,
            CASE WHEN SUM(mps.deaths) > 0 
                THEN SUM(mps.kills)::float / SUM(mps.deaths) 
                ELSE 0 
            END as kd_ratio
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        JOIN match_player_stats mps ON p.id = mps.player_id
        WHERE mps.game = $1
        GROUP BY p.id, p.name, p.nationality, t.name
        HAVING COUNT(DISTINCT mps.match_id) >= $2
        ORDER BY kd_ratio DESC
        LIMIT $3
        """,
        game, min_matches, limit
    )
    
    return {
        "game": game,
        "category": "K/D Ratio",
        "players": [
            {
                "rank": i + 1,
                "player_id": row["id"],
                "name": row["name"],
                "nationality": row["nationality"],
                "team": row["team_name"],
                "matches": row["matches"],
                "kills": row["kills"],
                "deaths": row["deaths"],
                "kd_ratio": round(row["kd_ratio"], 2)
            }
            for i, row in enumerate(rows)
        ]
    }


@router.get("/leaderboards/adr")
async def get_adr_leaderboard(
    game: str = Query(..., description="Game: 'valorant' or 'cs2'"),
    min_matches: int = Query(5, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get Average Damage per Round leaderboard."""
    pool = await get_db_pool()
    
    rows = await pool.fetch(
        """
        SELECT 
            p.id, p.name, p.nationality, t.name as team_name,
            COUNT(DISTINCT mps.match_id) as matches,
            AVG(mps.damage_per_round) as adr
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        JOIN match_player_stats mps ON p.id = mps.player_id
        WHERE mps.game = $1
        GROUP BY p.id, p.name, p.nationality, t.name
        HAVING COUNT(DISTINCT mps.match_id) >= $2
        ORDER BY adr DESC
        LIMIT $3
        """,
        game, min_matches, limit
    )
    
    return {
        "game": game,
        "category": "Average Damage per Round",
        "players": [
            {
                "rank": i + 1,
                "player_id": row["id"],
                "name": row["name"],
                "nationality": row["nationality"],
                "team": row["team_name"],
                "matches": row["matches"],
                "adr": round(row["adr"], 1)
            }
            for i, row in enumerate(rows)
        ]
    }
