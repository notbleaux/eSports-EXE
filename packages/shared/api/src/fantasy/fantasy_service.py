"""
Fantasy eSports Service
=======================
Business logic for fantasy Valorant and CS2.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional, Dict, Any

import asyncpg

from .fantasy_models import (
    FantasyLeague, FantasyTeam, FantasyRoster, FantasyTeamSummary,
    FantasyScoringPeriod, FantasyPlayerScore, FantasyMatchup,
    WaiverClaim, Trade, AvailablePlayer,
    CreateLeagueRequest, CreateTeamRequest, DraftPlayerRequest
)

logger = logging.getLogger(__name__)


class FantasyService:
    """Service for fantasy eSports operations."""
    
    def __init__(self, db_pool: asyncpg.Pool, token_service=None):
        self.db = db_pool
        self.token_service = token_service
    
    # League Management
    
    async def create_league(
        self,
        creator_id: str,
        request: CreateLeagueRequest
    ) -> FantasyLeague:
        """Create a new fantasy league."""
        league_id = str(uuid.uuid4())[:8]
        
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO fantasy_leagues
                (id, name, description, game, league_type, max_teams, roster_size,
                 salary_cap, draft_type, season_start_date, season_end_date,
                 entry_fee_tokens, prize_pool_tokens, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
                """,
                league_id, request.name, request.description, request.game.value,
                request.league_type.value, request.max_teams, request.roster_size,
                request.salary_cap, request.draft_type.value,
                request.season_start_date, request.season_end_date,
                request.entry_fee_tokens, request.prize_pool_tokens, creator_id
            )
            
            # Create default scoring periods (12 weeks)
            if request.season_start_date:
                for week in range(1, 13):
                    start = request.season_start_date + timedelta(days=(week-1)*7)
                    end = start + timedelta(days=6)
                    await conn.execute(
                        """
                        INSERT INTO fantasy_scoring_periods
                        (league_id, week_number, start_date, end_date, is_playoffs)
                        VALUES ($1, $2, $3, $4, $5)
                        """,
                        league_id, week, start, end, week >= 10
                    )
            
            logger.info(f"Created {request.game.value} league {league_id}")
            return await self._row_to_league(row)
    
    async def get_league(self, league_id: str) -> Optional[FantasyLeague]:
        """Get league by ID."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT l.*, COUNT(t.id) as team_count
                FROM fantasy_leagues l
                LEFT JOIN fantasy_teams t ON l.id = t.league_id
                WHERE l.id = $1
                GROUP BY l.id
                """,
                league_id
            )
            return await self._row_to_league(row) if row else None
    
    async def list_leagues(
        self,
        game: Optional[str] = None,
        league_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[FantasyLeague]:
        """List available leagues."""
        async with self.db.acquire() as conn:
            where_clauses = []
            params = []
            
            if game:
                params.append(game)
                where_clauses.append(f"game = ${len(params)}")
            if league_type:
                params.append(league_type)
                where_clauses.append(f"league_type = ${len(params)}")
            
            where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
            
            rows = await conn.fetch(
                f"""
                SELECT l.*, COUNT(t.id) as team_count
                FROM fantasy_leagues l
                LEFT JOIN fantasy_teams t ON l.id = t.league_id
                WHERE {where_sql}
                GROUP BY l.id
                ORDER BY l.created_at DESC
                """,
                *params
            )
            
            return [await self._row_to_league(row) for row in rows]
    
    # Team Management
    
    async def create_team(
        self,
        owner_id: str,
        request: CreateTeamRequest
    ) -> FantasyTeam:
        """Join a league by creating a team."""
        team_id = str(uuid.uuid4())[:8]
        
        async with self.db.acquire() as conn:
            async with conn.transaction():
                # Check league exists and has space
                league = await conn.fetchrow(
                    "SELECT * FROM fantasy_leagues WHERE id = $1",
                    request.league_id
                )
                if not league:
                    raise ValueError("League not found")
                
                team_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM fantasy_teams WHERE league_id = $1",
                    request.league_id
                )
                if team_count >= league['max_teams']:
                    raise ValueError("League is full")
                
                # Check user not already in league
                existing = await conn.fetchrow(
                    "SELECT id FROM fantasy_teams WHERE league_id = $1 AND owner_id = $2",
                    request.league_id, owner_id
                )
                if existing:
                    raise ValueError("You already have a team in this league")
                
                # Deduct entry fee if applicable
                if league['entry_fee_tokens'] > 0 and self.token_service:
                    from ..tokens.token_models import TokenDeductRequest
                    deduct_req = TokenDeductRequest(
                        user_id=owner_id,
                        amount=league['entry_fee_tokens'],
                        source='fantasy_entry',
                        description=f"Entry fee for {league['name']}"
                    )
                    success, _, msg = await self.token_service.deduct_tokens(deduct_req)
                    if not success:
                        raise ValueError(f"Insufficient tokens: {msg}")
                
                # Create team
                row = await conn.fetchrow(
                    """
                    INSERT INTO fantasy_teams
                    (id, league_id, owner_id, team_name, team_logo_url, budget_remaining)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                    """,
                    team_id, request.league_id, owner_id, request.team_name,
                    request.team_logo_url, league['salary_cap']
                )
                
                logger.info(f"User {owner_id} joined league {request.league_id}")
                return await self._row_to_team(row, conn)
    
    async def get_team(self, team_id: str) -> Optional[FantasyTeam]:
        """Get team with full roster."""
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM fantasy_teams WHERE id = $1",
                team_id
            )
            if not row:
                return None
            return await self._row_to_team(row, conn)
    
    async def get_user_teams(self, user_id: str) -> List[FantasyTeamSummary]:
        """Get all teams for a user."""
        async with self.db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT t.*, l.game, l.name as league_name,
                       COUNT(r.id) as roster_count
                FROM fantasy_teams t
                JOIN fantasy_leagues l ON t.league_id = l.id
                LEFT JOIN fantasy_rosters r ON t.id = r.team_id AND r.week_dropped IS NULL
                WHERE t.owner_id = $1
                GROUP BY t.id, l.game, l.name
                ORDER BY t.created_at DESC
                """,
                user_id
            )
            
            return [FantasyTeamSummary(
                id=row['id'],
                league_id=row['league_id'],
                owner_id=row['owner_id'],
                team_name=row['team_name'],
                team_logo_url=row['team_logo_url'],
                total_points=row['total_points'],
                weekly_points=row['weekly_points'],
                rank_position=row['rank_position'],
                wins=row['wins'],
                losses=row['losses'],
                draws=row['draws'],
                streak=row['streak'],
                roster_count=row['roster_count']
            ) for row in rows]
    
    # Draft System
    
    async def get_available_players(
        self,
        league_id: str,
        game: str,
        position: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[AvailablePlayer]:
        """Get players available for draft."""
        async with self.db.acquire() as conn:
            # Get already drafted players
            drafted = await conn.fetch(
                "SELECT player_id, team_id FROM fantasy_rosters WHERE league_id = $1 AND week_dropped IS NULL",
                league_id
            )
            drafted_ids = {r['player_id']: r['team_id'] for r in drafted}
            
            # Mock player data - in production, query SATOR player database
            players = []
            if game == 'valorant':
                players = [
                    AvailablePlayer(player_id="tenz", name="TenZ", team_tag="SEN", role="Duelist", game=game),
                    AvailablePlayer(player_id="aspas", name="aspas", team_tag="LEV", role="Duelist", game=game),
                    AvailablePlayer(player_id="yay", name="yay", team_tag="DSG", role="Duelist", game=game),
                    AvailablePlayer(player_id="something", name="something", team_tag="PRX", role="Duelist", game=game),
                    AvailablePlayer(player_id="derke", name="Derke", team_tag="FNC", role="Duelist", game=game),
                ]
            else:  # cs2
                players = [
                    AvailablePlayer(player_id="s1mple", name="s1mple", team_tag="NAVI", role="AWPer", game=game),
                    AvailablePlayer(player_id="zywoo", name="ZywOo", team_tag="VIT", role="AWPer", game=game),
                    AvailablePlayer(player_id="niko", name="NiKo", team_tag="G2", role="Rifler", game=game),
                    AvailablePlayer(player_id="ropz", name="ropz", team_tag="Faze", role="Rifler", game=game),
                    AvailablePlayer(player_id="m0nesy", name="m0NESY", team_tag="G2", role="AWPer", game=game),
                ]
            
            # Mark drafted players
            for p in players:
                if p.player_id in drafted_ids:
                    p.is_drafted = True
                    p.drafted_by = drafted_ids[p.player_id]
            
            return [p for p in players if not p.is_drafted]
    
    async def draft_player(
        self,
        team_id: str,
        request: DraftPlayerRequest
    ) -> FantasyRoster:
        """Draft a player to a team."""
        async with self.db.acquire() as conn:
            async with conn.transaction():
                team = await conn.fetchrow(
                    "SELECT * FROM fantasy_teams WHERE id = $1",
                    team_id
                )
                if not team:
                    raise ValueError("Team not found")
                
                league = await conn.fetchrow(
                    "SELECT * FROM fantasy_leagues WHERE id = $1",
                    team['league_id']
                )
                
                # Check roster space
                roster_count = await conn.fetchval(
                    "SELECT COUNT(*) FROM fantasy_rosters WHERE team_id = $1 AND week_dropped IS NULL",
                    team_id
                )
                if roster_count >= league['roster_size']:
                    raise ValueError("Roster is full")
                
                # Check player not already drafted
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM fantasy_rosters 
                    WHERE league_id = $1 AND player_id = $2 AND week_dropped IS NULL
                    """,
                    team['league_id'], request.player_id
                )
                if existing:
                    raise ValueError("Player already drafted")
                
                # For auction drafts, check budget
                if league['draft_type'] == 'auction' and request.bid_amount:
                    if request.bid_amount > team['budget_remaining']:
                        raise ValueError("Insufficient budget")
                    await conn.execute(
                        "UPDATE fantasy_teams SET budget_remaining = budget_remaining - $1 WHERE id = $2",
                        request.bid_amount, team_id
                    )
                
                row = await conn.fetchrow(
                    """
                    INSERT INTO fantasy_rosters
                    (team_id, player_id, player_name, player_role, team_tag,
                     acquisition_type, purchase_price, is_starter)
                    VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7)
                    RETURNING *
                    """,
                    team_id, request.player_id, request.player_name,
                    request.player_role, request.team_tag,
                    request.bid_amount, roster_count < 5  # First 5 are starters
                )
                
                # Log transaction
                await conn.execute(
                    """
                    INSERT INTO fantasy_transactions
                    (league_id, team_id, transaction_type, player_id, player_name, details)
                    VALUES ($1, $2, 'draft', $3, $4, $5)
                    """,
                    team['league_id'], team_id, request.player_id, request.player_name,
                    {'bid': request.bid_amount}
                )
                
                return FantasyRoster(**dict(row))
    
    # Scoring
    
    async def calculate_weekly_scores(self, league_id: str, week_number: int):
        """Calculate fantasy points for a week."""
        async with self.db.acquire() as conn:
            league = await conn.fetchrow(
                "SELECT game, scoring_rules FROM fantasy_leagues WHERE id = $1",
                league_id
            )
            if not league:
                return
            
            # Get scoring rules
            rules = league['scoring_rules'] or {}
            
            # Get all rostered players for this week
            rosters = await conn.fetch(
                """
                SELECT r.*, t.id as team_id
                FROM fantasy_rosters r
                JOIN fantasy_teams t ON r.team_id = t.id
                WHERE r.league_id = $1 AND r.week_acquired <= $2 
                  AND (r.week_dropped IS NULL OR r.week_dropped > $2)
                """,
                league_id, week_number
            )
            
            for roster in rosters:
                # In production: query actual match stats from SATOR
                # For now: generate mock scores
                points = self._calculate_mock_points(roster, rules)
                
                await conn.execute(
                    """
                    INSERT INTO fantasy_player_scores
                    (scoring_period_id, player_id, fantasy_team_id, game, fantasy_points)
                    VALUES (
                        (SELECT id FROM fantasy_scoring_periods WHERE league_id = $1 AND week_number = $2),
                        $3, $4, $5, $6
                    )
                    ON CONFLICT (scoring_period_id, player_id) DO UPDATE
                    SET fantasy_points = $6, updated_at = CURRENT_TIMESTAMP
                    """,
                    league_id, week_number, roster['player_id'], roster['team_id'],
                    league['game'], points
                )
    
    def _calculate_mock_points(self, roster: Dict, rules: Dict) -> Decimal:
        """Calculate fantasy points from stats."""
        # Mock calculation - in production use actual stats
        base = Decimal("15.0")  # Base points
        if roster['is_captain']:
            base *= Decimal("2.0")  # Captain multiplier
        elif roster['is_vice_captain']:
            base *= Decimal("1.5")  # Vice-captain multiplier
        return base.quantize(Decimal("0.01"))
    
    # Helper methods
    
    async def _row_to_league(self, row) -> FantasyLeague:
        """Convert DB row to FantasyLeague."""
        return FantasyLeague(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            game=GameType(row['game']),
            league_type=LeagueType(row['league_type']),
            max_teams=row['max_teams'],
            roster_size=row['roster_size'],
            salary_cap=row['salary_cap'],
            draft_type=DraftType(row['draft_type']),
            draft_status=DraftStatus(row['draft_status']),
            season_start_date=row['season_start_date'],
            season_end_date=row['season_end_date'],
            entry_fee_tokens=row['entry_fee_tokens'],
            prize_pool_tokens=row['prize_pool_tokens'],
            scoring_rules=row['scoring_rules'],
            created_by=row['created_by'],
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            team_count=row.get('team_count', 0)
        )
    
    async def _row_to_team(self, row, conn) -> FantasyTeam:
        """Convert DB row to FantasyTeam with roster."""
        roster_rows = await conn.fetch(
            """
            SELECT * FROM fantasy_rosters 
            WHERE team_id = $1 AND week_dropped IS NULL
            ORDER BY is_starter DESC, id
            """,
            row['id']
        )
        
        roster = [FantasyRoster(**dict(r)) for r in roster_rows]
        
        return FantasyTeam(
            id=row['id'],
            league_id=row['league_id'],
            owner_id=row['owner_id'],
            team_name=row['team_name'],
            team_logo_url=row['team_logo_url'],
            total_points=row['total_points'],
            weekly_points=row['weekly_points'],
            rank_position=row['rank_position'],
            wins=row['wins'],
            losses=row['losses'],
            draws=row['draws'],
            streak=row['streak'],
            budget_remaining=row['budget_remaining'],
            is_active=row['is_active'],
            roster=roster,
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
