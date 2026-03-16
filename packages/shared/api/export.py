"""
Data Export API
Priority 3 Feature: Power user data export functionality
Formats: CSV, JSON, Excel
"""
import csv
import json
import io
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
import httpx

from ..database import get_pool
from ..cache import cached

router = APIRouter(prefix="/export", tags=["export"])


class DataExporter:
    """Handles data export in multiple formats"""
    
    @staticmethod
    async def export_players_csv(player_ids: List[str]) -> str:
        """Export player stats to CSV format"""
        pool = get_pool()
        
        # Fetch player data
        placeholders = ','.join(f'${i+1}' for i in range(len(player_ids)))
        query = f"""
            SELECT 
                p.id, p.name, p.team, p.role,
                ps.sim_rating, ps.combat_efficiency, ps.clutch_performance,
                ps.utility_impact, ps.economic_management, ps.spatial_control,
                ps.matches_played, ps.created_at
            FROM players p
            JOIN player_stats ps ON p.id = ps.player_id
            WHERE p.id IN ({placeholders})
        """
        
        rows = await pool.fetch(query, *player_ids)
        
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Player ID', 'Name', 'Team', 'Role',
            'SimRating', 'Combat Efficiency', 'Clutch Performance',
            'Utility Impact', 'Economic Management', 'Spatial Control',
            'Matches Played', 'Last Updated'
        ])
        
        # Data
        for row in rows:
            writer.writerow([
                row['id'], row['name'], row['team'], row['role'],
                row['sim_rating'], row['combat_efficiency'], row['clutch_performance'],
                row['utility_impact'], row['economic_management'], row['spatial_control'],
                row['matches_played'], row['created_at'].isoformat()
            ])
        
        return output.getvalue()
    
    @staticmethod
    async def export_matches_json(match_ids: List[str]) -> List[Dict]:
        """Export match data to JSON format"""
        pool = get_pool()
        
        placeholders = ','.join(f'${i+1}' for i in range(len(match_ids)))
        query = f"""
            SELECT 
                m.id, m.tournament_id, m.team_a, m.team_b, m.winner,
                m.map, m.date, m.patch_version,
                json_agg(
                    json_build_object(
                        'round_num', r.round_num,
                        'team_a_credits', r.team_a_credits,
                        'team_b_credits', r.team_b_credits,
                        'winner', r.winner,
                        'first_blood_team', r.first_blood_team
                    )
                ) as rounds
            FROM matches m
            LEFT JOIN rounds r ON m.id = r.match_id
            WHERE m.id IN ({placeholders})
            GROUP BY m.id
        """
        
        rows = await pool.fetch(query, *match_ids)
        
        return [dict(row) for row in rows]
    
    @staticmethod
    async def export_tournament_summary(tournament_id: str) -> Dict[str, Any]:
        """Export tournament-level summary"""
        pool = get_pool()
        
        # Tournament info
        tournament = await pool.fetchrow(
            "SELECT * FROM tournaments WHERE id = $1",
            tournament_id
        )
        
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Match statistics
        matches = await pool.fetch(
            """
            SELECT 
                COUNT(*) as total_matches,
                COUNT(DISTINCT map) as maps_played,
                AVG(CASE WHEN winner = team_a THEN 1 ELSE 0 END) as team_a_win_rate
            FROM matches
            WHERE tournament_id = $1
            """,
            tournament_id
        )
        
        # Player leaderboard
        leaderboard = await pool.fetch(
            """
            SELECT 
                p.id, p.name, p.team,
                AVG(ps.sim_rating) as avg_rating,
                COUNT(DISTINCT m.id) as matches_played
            FROM players p
            JOIN player_stats ps ON p.id = ps.player_id
            JOIN matches m ON ps.match_id = m.id
            WHERE m.tournament_id = $1
            GROUP BY p.id
            ORDER BY avg_rating DESC
            LIMIT 20
            """,
            tournament_id
        )
        
        return {
            'tournament': dict(tournament),
            'statistics': dict(matches[0]),
            'leaderboard': [dict(row) for row in leaderboard],
            'exported_at': datetime.now(timezone.utc).isoformat()
        }


# API Routes

@router.get("/players/csv")
@cached(ttl=300, key_prefix="export:players:csv")  # 5 min cache
async def export_players_csv(
    player_ids: str = Query(..., description="Comma-separated player IDs")
):
    """
    Export player statistics to CSV format.
    
    Example: /export/players/csv?player_ids=player1,player2,player3
    """
    ids = [id.strip() for id in player_ids.split(',')]
    
    if len(ids) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 players per export")
    
    csv_data = await DataExporter.export_players_csv(ids)
    
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=players_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/matches/json")
@cached(ttl=300, key_prefix="export:matches:json")
async def export_matches_json(
    match_ids: str = Query(..., description="Comma-separated match IDs")
):
    """
    Export match data to JSON format.
    
    Example: /export/matches/json?match_ids=match1,match2
    """
    ids = [id.strip() for id in match_ids.split(',')]
    
    if len(ids) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 matches per export")
    
    data = await DataExporter.export_matches_json(ids)
    
    return Response(
        content=json.dumps(data, indent=2, default=str),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=matches_{datetime.now().strftime('%Y%m%d')}.json"
        }
    )


@router.get("/tournament/{tournament_id}")
@cached(ttl=600, key_prefix="export:tournament")  # 10 min cache
async def export_tournament(tournament_id: str, format: str = "json"):
    """
    Export tournament summary data.
    
    Formats: json, csv
    """
    data = await DataExporter.export_tournament_summary(tournament_id)
    
    if format.lower() == "json":
        return Response(
            content=json.dumps(data, indent=2, default=str),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=tournament_{tournament_id}.json"
            }
        )
    elif format.lower() == "csv":
        # Convert to CSV (flattened)
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write tournament info
        writer.writerow(['Tournament Export'])
        writer.writerow(['ID', data['tournament']['id']])
        writer.writerow(['Name', data['tournament']['name']])
        writer.writerow([])
        
        # Write leaderboard
        writer.writerow(['Leaderboard'])
        writer.writerow(['Rank', 'Player', 'Team', 'Avg Rating', 'Matches'])
        for i, player in enumerate(data['leaderboard'], 1):
            writer.writerow([
                i, player['name'], player['team'],
                f"{player['avg_rating']:.2f}", player['matches_played']
            ])
        
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=tournament_{tournament_id}.csv"
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")


@router.get("/bulk/players")
async def bulk_export_players(
    tier: Optional[str] = Query(None, description="Filter by tier: challengers, masters, champions"),
    min_matches: int = Query(10, description="Minimum matches played"),
    format: str = Query("csv", description="Export format: csv or json")
):
    """
    Bulk export all players matching criteria.
    
    Warning: May take several seconds for large datasets.
    """
    pool = get_pool()
    
    # Build query
    where_clauses = ["ps.matches_played >= $1"]
    params = [min_matches]
    
    if tier:
        where_clauses.append(f"p.tier = ${len(params) + 1}")
        params.append(tier)
    
    query = f"""
        SELECT p.id, p.name, p.team, p.tier, ps.*
        FROM players p
        JOIN player_stats ps ON p.id = ps.player_id
        WHERE {' AND '.join(where_clauses)}
        ORDER BY ps.sim_rating DESC
        LIMIT 1000
    """
    
    rows = await pool.fetch(query, *params)
    
    if format.lower() == "json":
        return Response(
            content=json.dumps([dict(row) for row in rows], indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=players_bulk.json"}
        )
    else:
        # CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        if rows:
            writer.writerow(rows[0].keys())
            for row in rows:
                writer.writerow(row.values())
        
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=players_bulk.csv"}
        )


# Export the router
__all__ = ['router', 'DataExporter']