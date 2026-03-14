"""
TiDB OPERA Client — Tournament Metadata Satellite.

Provides connection pooling and CRUD operations for tournament metadata
stored in TiDB (MySQL-compatible distributed database).

Features:
    - Connection pooling for high-performance access
    - Tournament lifecycle management
    - Match scheduling and status tracking
    - Patch version tracking
    - Team and roster management
    - Circuit standings
    - SATOR cross-reference support

Usage:
    client = TiDBOperaClient(
        host="tidb.example.com",
        port=4000,
        user="opera",
        password="secret",
        database="opera_metadata"
    )
    
    # Create tournament
    tournament = client.create_tournament({
        "name": "VCT 2026 Masters Tokyo",
        "tier": "Masters",
        "game": "Valorant",
        "region": "International",
        "organizer": "Riot Games",
        "prize_pool_usd": 1000000,
        "start_date": "2026-06-01",
        "end_date": "2026-06-14"
    })
"""
import logging
from contextlib import contextmanager
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple, Union
from enum import Enum

# MySQL connector for TiDB (MySQL-compatible)
try:
    import mysql.connector
    from mysql.connector import pooling, Error as MySQLError
except ImportError:
    mysql = None  # type: ignore
    pooling = None  # type: ignore
    MySQLError = Exception  # type: ignore

logger = logging.getLogger(__name__)


class TournamentTier(str, Enum):
    """Tournament tier classification."""
    CHAMPIONS = "Champions"
    MASTERS = "Masters"
    LOCK_IN = "Lock In"
    CHALLENGER = "Challenger"
    PREMIER = "Premier"
    QUALIFIER = "Qualifier"
    SHOWMATCH = "Showmatch"


class TournamentStatus(str, Enum):
    """Tournament lifecycle status."""
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class MatchStatus(str, Enum):
    """Match status for scheduling."""
    SCHEDULED = "scheduled"
    LIVE = "live"
    COMPLETED = "completed"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"
    FORFEITED = "forfeited"


class PatchType(str, Enum):
    """Type of game patch."""
    MAJOR = "major"
    MINOR = "minor"
    HOTFIX = "hotfix"
    BETA = "beta"


class TiDBOperaClient:
    """
    TiDB client for OPERA tournament metadata service.
    
    Provides connection pooling and comprehensive CRUD operations
    for tournament metadata, schedules, patches, teams, and circuits.
    
    Attributes:
        host: TiDB server hostname
        port: TiDB server port (default: 4000)
        user: Database username
        password: Database password
        database: Database name
        pool_size: Connection pool size (default: 5)
    """
    
    def __init__(
        self,
        host: str,
        port: int = 4000,
        user: str = "opera",
        password: str = "",
        database: str = "opera_metadata",
        pool_size: int = 5,
    ):
        """
        Initialize TiDB OPERA client with connection pooling.
        
        Args:
            host: TiDB server hostname
            port: TiDB server port
            user: Database username
            password: Database password
            database: Database name
            pool_size: Number of connections to maintain in pool
        """
        if mysql is None:
            raise ImportError(
                "mysql-connector-python is required. "
                "Install with: pip install mysql-connector-python"
            )
        
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.database = database
        self.pool_size = pool_size
        
        self._pool: Optional[Any] = None
        self._init_pool()
        
        logger.info(
            "TiDBOperaClient initialized (host=%s, port=%d, database=%s, pool_size=%d)",
            host, port, database, pool_size
        )
    
    def _init_pool(self) -> None:
        """Initialize MySQL connection pool for TiDB."""
        try:
            self._pool = pooling.MySQLConnectionPool(
                pool_name="opera_pool",
                pool_size=self.pool_size,
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                charset="utf8mb4",
                collation="utf8mb4_unicode_ci",
                autocommit=False,
                connection_timeout=30,
            )
            logger.debug("Connection pool initialized (size=%d)", self.pool_size)
        except MySQLError as e:
            logger.error("Failed to initialize connection pool: %s", e)
            raise
    
    @contextmanager
    def _get_connection(self):
        """
        Context manager for getting a connection from the pool.
        
        Yields:
            mysql.connector.connection.MySQLConnection
        """
        conn = None
        try:
            conn = self._pool.get_connection()
            yield conn
        except MySQLError as e:
            logger.error("Database connection error: %s", e)
            raise
        finally:
            if conn:
                conn.close()
    
    @contextmanager
    def _get_cursor(self, dictionary: bool = True):
        """
        Context manager for getting a cursor.
        
        Args:
            dictionary: If True, returns rows as dictionaries
            
        Yields:
            mysql.connector.cursor.MySQLCursor
        """
        with self._get_connection() as conn:
            cursor = conn.cursor(dictionary=dictionary)
            try:
                yield cursor
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error("Transaction rolled back: %s", e)
                raise
            finally:
                cursor.close()
    
    # =========================================================================
    # TOURNAMENT OPERATIONS
    # =========================================================================
    
    def create_tournament(
        self,
        tournament_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Create a new tournament.
        
        Args:
            tournament_data: Tournament fields including:
                - name (str, required): Tournament name
                - tier (str): Tournament tier (Champions, Masters, etc.)
                - game (str): Game name (Valorant, CS2, etc.)
                - region (str): Region code
                - organizer (str): Tournament organizer
                - prize_pool_usd (int): Prize pool in USD
                - start_date (date): Tournament start date
                - end_date (date): Tournament end date
                - status (str): Tournament status
                - sator_cross_ref (str): Reference to SATOR analytics
                
        Returns:
            Created tournament record with generated tournament_id
        """
        required_fields = ["name"]
        for field in required_fields:
            if field not in tournament_data:
                raise ValueError(f"Missing required field: {field}")
        
        query = """
            INSERT INTO opera_tournaments (
                name, tier, game, region, organizer, prize_pool_usd,
                start_date, end_date, status, sator_cross_ref,
                created_at, updated_at
            ) VALUES (
                %(name)s, %(tier)s, %(game)s, %(region)s, %(organizer)s,
                %(prize_pool_usd)s, %(start_date)s, %(end_date)s, %(status)s,
                %(sator_cross_ref)s, NOW(), NOW()
            )
        """
        
        defaults = {
            "tier": TournamentTier.PREMIER,
            "game": "Valorant",
            "region": None,
            "organizer": None,
            "prize_pool_usd": None,
            "start_date": None,
            "end_date": None,
            "status": TournamentStatus.UPCOMING,
            "sator_cross_ref": None,
        }
        
        params = {**defaults, **tournament_data}
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                tournament_id = cursor.lastrowid
                logger.info("Created tournament (id=%d, name=%s)", tournament_id, params["name"])
                
                # Return the created record
                return self.get_tournament(tournament_id)
        except MySQLError as e:
            logger.error("Failed to create tournament: %s", e)
            raise
    
    def get_tournament(self, tournament_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a tournament by ID.
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            Tournament record or None if not found
        """
        query = """
            SELECT 
                tournament_id, name, tier, game, region, organizer,
                prize_pool_usd, start_date, end_date, status,
                sator_cross_ref, created_at, updated_at
            FROM opera_tournaments
            WHERE tournament_id = %(tournament_id)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, {"tournament_id": tournament_id})
                result = cursor.fetchone()
                return dict(result) if result else None
        except MySQLError as e:
            logger.error("Failed to get tournament %d: %s", tournament_id, e)
            raise
    
    def list_tournaments(
        self,
        status: Optional[str] = None,
        tier: Optional[str] = None,
        game: Optional[str] = None,
        region: Optional[str] = None,
        start_after: Optional[date] = None,
        end_before: Optional[date] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        List tournaments with optional filtering.
        
        Args:
            status: Filter by tournament status
            tier: Filter by tournament tier
            game: Filter by game
            region: Filter by region
            start_after: Filter tournaments starting after date
            end_before: Filter tournaments ending before date
            limit: Maximum number of results
            offset: Pagination offset
            
        Returns:
            List of tournament records
        """
        conditions = []
        params: Dict[str, Any] = {}
        
        if status:
            conditions.append("status = %(status)s")
            params["status"] = status
        if tier:
            conditions.append("tier = %(tier)s")
            params["tier"] = tier
        if game:
            conditions.append("game = %(game)s")
            params["game"] = game
        if region:
            conditions.append("region = %(region)s")
            params["region"] = region
        if start_after:
            conditions.append("start_date >= %(start_after)s")
            params["start_after"] = start_after
        if end_before:
            conditions.append("end_date <= %(end_before)s")
            params["end_before"] = end_before
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = f"""
            SELECT 
                tournament_id, name, tier, game, region, organizer,
                prize_pool_usd, start_date, end_date, status,
                sator_cross_ref, created_at, updated_at
            FROM opera_tournaments
            {where_clause}
            ORDER BY start_date DESC, tournament_id DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """
        
        params["limit"] = limit
        params["offset"] = offset
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except MySQLError as e:
            logger.error("Failed to list tournaments: %s", e)
            raise
    
    def update_tournament_status(
        self,
        tournament_id: int,
        status: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Update tournament status.
        
        Args:
            tournament_id: Tournament ID
            status: New status value
            
        Returns:
            Updated tournament record
        """
        query = """
            UPDATE opera_tournaments
            SET status = %(status)s, updated_at = NOW()
            WHERE tournament_id = %(tournament_id)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, {
                    "tournament_id": tournament_id,
                    "status": status,
                })
                if cursor.rowcount == 0:
                    logger.warning("Tournament %d not found for update", tournament_id)
                    return None
                logger.info("Updated tournament %d status to %s", tournament_id, status)
                return self.get_tournament(tournament_id)
        except MySQLError as e:
            logger.error("Failed to update tournament %d: %s", tournament_id, e)
            raise
    
    # =========================================================================
    # SCHEDULE OPERATIONS
    # =========================================================================
    
    def create_schedule(
        self,
        schedule_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Create a match schedule entry.
        
        Args:
            schedule_data: Schedule fields including:
                - tournament_id (int, required): Parent tournament
                - match_id (str, required): Unique match identifier
                - round_name (str): Round/group name
                - team_a_id (int): Team A ID
                - team_b_id (int): Team B ID
                - scheduled_at (datetime): Scheduled match time
                - stream_url (str): Primary stream URL
                - status (str): Match status
                - sator_match_ref (str): Cross-reference to SATOR match data
                
        Returns:
            Created schedule record
        """
        required_fields = ["tournament_id", "match_id"]
        for field in required_fields:
            if field not in schedule_data:
                raise ValueError(f"Missing required field: {field}")
        
        query = """
            INSERT INTO opera_schedules (
                tournament_id, match_id, round_name, team_a_id, team_b_id,
                scheduled_at, stream_url, status, sator_match_ref,
                created_at, updated_at
            ) VALUES (
                %(tournament_id)s, %(match_id)s, %(round_name)s, %(team_a_id)s,
                %(team_b_id)s, %(scheduled_at)s, %(stream_url)s, %(status)s,
                %(sator_match_ref)s, NOW(), NOW()
            )
        """
        
        defaults = {
            "round_name": None,
            "team_a_id": None,
            "team_b_id": None,
            "scheduled_at": None,
            "stream_url": None,
            "status": MatchStatus.SCHEDULED,
            "sator_match_ref": None,
        }
        
        params = {**defaults, **schedule_data}
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                schedule_id = cursor.lastrowid
                logger.info("Created schedule (id=%d, match_id=%s)", schedule_id, params["match_id"])
                return self._get_schedule_by_id(schedule_id)
        except MySQLError as e:
            logger.error("Failed to create schedule: %s", e)
            raise
    
    def _get_schedule_by_id(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        """Get schedule by internal ID."""
        query = """
            SELECT 
                s.schedule_id, s.tournament_id, s.match_id, s.round_name,
                s.team_a_id, s.team_b_id, s.scheduled_at, s.stream_url,
                s.status, s.sator_match_ref, s.created_at, s.updated_at,
                t.name as tournament_name,
                ta.name as team_a_name,
                tb.name as team_b_name
            FROM opera_schedules s
            LEFT JOIN opera_tournaments t ON s.tournament_id = t.tournament_id
            LEFT JOIN opera_teams ta ON s.team_a_id = ta.team_id
            LEFT JOIN opera_teams tb ON s.team_b_id = tb.team_id
            WHERE s.schedule_id = %(schedule_id)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, {"schedule_id": schedule_id})
                result = cursor.fetchone()
                return dict(result) if result else None
        except MySQLError as e:
            logger.error("Failed to get schedule %d: %s", schedule_id, e)
            raise
    
    def get_schedule_for_tournament(
        self,
        tournament_id: int,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Get all schedules for a tournament.
        
        Args:
            tournament_id: Tournament ID
            status: Filter by match status
            limit: Maximum results
            
        Returns:
            List of schedule records with team and tournament info
        """
        conditions = ["s.tournament_id = %(tournament_id)s"]
        params: Dict[str, Any] = {"tournament_id": tournament_id}
        
        if status:
            conditions.append("s.status = %(status)s")
            params["status"] = status
        
        where_clause = "WHERE " + " AND ".join(conditions)
        
        query = f"""
            SELECT 
                s.schedule_id, s.tournament_id, s.match_id, s.round_name,
                s.team_a_id, s.team_b_id, s.scheduled_at, s.stream_url,
                s.status, s.sator_match_ref, s.created_at, s.updated_at,
                t.name as tournament_name,
                ta.name as team_a_name,
                tb.name as team_b_name
            FROM opera_schedules s
            LEFT JOIN opera_tournaments t ON s.tournament_id = t.tournament_id
            LEFT JOIN opera_teams ta ON s.team_a_id = ta.team_id
            LEFT JOIN opera_teams tb ON s.team_b_id = tb.team_id
            {where_clause}
            ORDER BY s.scheduled_at ASC
            LIMIT %(limit)s
        """
        
        params["limit"] = limit
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except MySQLError as e:
            logger.error("Failed to get schedules for tournament %d: %s", tournament_id, e)
            raise
    
    def update_match_status(
        self,
        match_id: str,
        status: str,
        additional_fields: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Update match status and optional additional fields.
        
        Args:
            match_id: Match identifier
            status: New status
            additional_fields: Optional fields to update (team_a_score, team_b_score, etc.)
            
        Returns:
            Updated schedule record
        """
        updates = ["status = %(status)s", "updated_at = NOW()"]
        params: Dict[str, Any] = {"match_id": match_id, "status": status}
        
        if additional_fields:
            for key, value in additional_fields.items():
                if key in ("team_a_score", "team_b_score", "winner_team_id", "duration_minutes"):
                    updates.append(f"{key} = %({key})s")
                    params[key] = value
        
        query = f"""
            UPDATE opera_schedules
            SET {', '.join(updates)}
            WHERE match_id = %(match_id)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                if cursor.rowcount == 0:
                    logger.warning("Match %s not found for status update", match_id)
                    return None
                
                # Get schedule_id to return updated record
                cursor.execute(
                    "SELECT schedule_id FROM opera_schedules WHERE match_id = %(match_id)s",
                    {"match_id": match_id}
                )
                result = cursor.fetchone()
                if result:
                    logger.info("Updated match %s status to %s", match_id, status)
                    return self._get_schedule_by_id(result["schedule_id"])
                return None
        except MySQLError as e:
            logger.error("Failed to update match %s: %s", match_id, e)
            raise
    
    # =========================================================================
    # PATCH OPERATIONS
    # =========================================================================
    
    def create_patch(
        self,
        patch_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Create a game patch record.
        
        Args:
            patch_data: Patch fields including:
                - version (str, required): Patch version (e.g., "8.11")
                - game (str): Game name
                - patch_type (str): Type of patch
                - release_date (date): Release date
                - notes_url (str): Link to patch notes
                - summary (str): Brief summary of changes
                - is_active_competitive (bool): Active in competitive play
                - sator_meta_ref (str): Cross-reference to SATOR meta analysis
                
        Returns:
            Created patch record
        """
        required_fields = ["version"]
        for field in required_fields:
            if field not in patch_data:
                raise ValueError(f"Missing required field: {field}")
        
        query = """
            INSERT INTO opera_patches (
                version, game, patch_type, release_date, notes_url,
                summary, is_active_competitive, sator_meta_ref,
                created_at, updated_at
            ) VALUES (
                %(version)s, %(game)s, %(patch_type)s, %(release_date)s,
                %(notes_url)s, %(summary)s, %(is_active_competitive)s,
                %(sator_meta_ref)s, NOW(), NOW()
            )
        """
        
        defaults = {
            "game": "Valorant",
            "patch_type": PatchType.MINOR,
            "release_date": None,
            "notes_url": None,
            "summary": None,
            "is_active_competitive": False,
            "sator_meta_ref": None,
        }
        
        params = {**defaults, **patch_data}
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                patch_id = cursor.lastrowid
                logger.info("Created patch (id=%d, version=%s)", patch_id, params["version"])
                return self.get_patch(patch_id)
        except MySQLError as e:
            logger.error("Failed to create patch: %s", e)
            raise
    
    def get_patch(self, patch_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a patch by ID.
        
        Args:
            patch_id: Patch ID
            
        Returns:
            Patch record or None
        """
        query = """
            SELECT 
                patch_id, version, game, patch_type, release_date,
                notes_url, summary, is_active_competitive, sator_meta_ref,
                created_at, updated_at
            FROM opera_patches
            WHERE patch_id = %(patch_id)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, {"patch_id": patch_id})
                result = cursor.fetchone()
                return dict(result) if result else None
        except MySQLError as e:
            logger.error("Failed to get patch %d: %s", patch_id, e)
            raise
    
    def get_patch_by_version(self, version: str, game: str = "Valorant") -> Optional[Dict[str, Any]]:
        """
        Get a patch by version string.
        
        Args:
            version: Patch version (e.g., "8.11")
            game: Game name
            
        Returns:
            Patch record or None
        """
        query = """
            SELECT 
                patch_id, version, game, patch_type, release_date,
                notes_url, summary, is_active_competitive, sator_meta_ref,
                created_at, updated_at
            FROM opera_patches
            WHERE version = %(version)s AND game = %(game)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, {"version": version, "game": game})
                result = cursor.fetchone()
                return dict(result) if result else None
        except MySQLError as e:
            logger.error("Failed to get patch %s: %s", version, e)
            raise
    
    def get_patches_for_date_range(
        self,
        start_date: date,
        end_date: date,
        game: Optional[str] = None,
        active_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Get patches released within a date range.
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            game: Filter by game
            active_only: Only return competitive-active patches
            
        Returns:
            List of patch records
        """
        conditions = [
            "release_date >= %(start_date)s",
            "release_date <= %(end_date)s"
        ]
        params: Dict[str, Any] = {
            "start_date": start_date,
            "end_date": end_date,
        }
        
        if game:
            conditions.append("game = %(game)s")
            params["game"] = game
        if active_only:
            conditions.append("is_active_competitive = TRUE")
        
        where_clause = "WHERE " + " AND ".join(conditions)
        
        query = f"""
            SELECT 
                patch_id, version, game, patch_type, release_date,
                notes_url, summary, is_active_competitive, sator_meta_ref,
                created_at, updated_at
            FROM opera_patches
            {where_clause}
            ORDER BY release_date DESC
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except MySQLError as e:
            logger.error("Failed to get patches for date range: %s", e)
            raise
    
    # =========================================================================
    # TEAM OPERATIONS
    # =========================================================================
    
    def create_team(self, team_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a team record.
        
        Args:
            team_data: Team fields including:
                - name (str, required): Team name
                - tag (str): Short tag/abbreviation
                - region (str): Region code
                - logo_url (str): Team logo URL
                - website (str): Official website
                - social_media (dict): JSON social media links
                
        Returns:
            Created team record
        """
        if "name" not in team_data:
            raise ValueError("Missing required field: name")
        
        query = """
            INSERT INTO opera_teams (
                name, tag, region, logo_url, website, social_media,
                created_at, updated_at
            ) VALUES (
                %(name)s, %(tag)s, %(region)s, %(logo_url)s,
                %(website)s, %(social_media)s, NOW(), NOW()
            )
        """
        
        defaults = {
            "tag": None,
            "region": None,
            "logo_url": None,
            "website": None,
            "social_media": None,
        }
        
        params = {**defaults, **team_data}
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, params)
                team_id = cursor.lastrowid
                logger.info("Created team (id=%d, name=%s)", team_id, params["name"])
                return self._get_team_by_id(team_id)
        except MySQLError as e:
            logger.error("Failed to create team: %s", e)
            raise
    
    def _get_team_by_id(self, team_id: int) -> Optional[Dict[str, Any]]:
        """Get team by ID."""
        query = """
            SELECT 
                team_id, name, tag, region, logo_url, website,
                social_media, created_at, updated_at
            FROM opera_teams
            WHERE team_id = %(team_id)s
        """
        
        try:
            with self._get_cursor() as cursor:
                cursor.execute(query, {"team_id": team_id})
                result = cursor.fetchone()
                return dict(result) if result else None
        except MySQLError as e:
            logger.error("Failed to get team %d: %s", team_id, e)
            raise
    
    # =========================================================================
    # PERFORMANCE SUMMARY
    # =========================================================================
    
    def get_tournament_with_performance_summary(
        self,
        tournament_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Get tournament with aggregated performance summary.
        
        Includes match counts, team participation, and cross-references
        to SATOR analytics data.
        
        Args:
            tournament_id: Tournament ID
            
        Returns:
            Tournament with performance summary or None
        """
        # Get tournament base data
        tournament = self.get_tournament(tournament_id)
        if not tournament:
            return None
        
        # Get match statistics
        stats_query = """
            SELECT 
                COUNT(*) as total_matches,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_matches,
                SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live_matches,
                SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_matches,
                COUNT(DISTINCT team_a_id) + COUNT(DISTINCT team_b_id) as participating_teams,
                MIN(scheduled_at) as first_match,
                MAX(scheduled_at) as last_match
            FROM opera_schedules
            WHERE tournament_id = %(tournament_id)s
        """
        
        # Get team list
        teams_query = """
            SELECT DISTINCT
                t.team_id, t.name, t.tag, t.region
            FROM (
                SELECT team_a_id as team_id FROM opera_schedules WHERE tournament_id = %(tournament_id)s AND team_a_id IS NOT NULL
                UNION
                SELECT team_b_id as team_id FROM opera_schedules WHERE tournament_id = %(tournament_id)s AND team_b_id IS NOT NULL
            ) s
            JOIN opera_teams t ON s.team_id = t.team_id
            ORDER BY t.name
        """
        
        try:
            with self._get_cursor() as cursor:
                # Get stats
                cursor.execute(stats_query, {"tournament_id": tournament_id})
                stats = cursor.fetchone()
                
                # Get teams
                cursor.execute(teams_query, {"tournament_id": tournament_id})
                teams = cursor.fetchall()
                
                # Build summary
                summary = {
                    "total_matches": stats["total_matches"] or 0,
                    "completed_matches": stats["completed_matches"] or 0,
                    "live_matches": stats["live_matches"] or 0,
                    "scheduled_matches": stats["scheduled_matches"] or 0,
                    "participating_teams": stats["participating_teams"] or 0,
                    "first_match": stats["first_match"].isoformat() if stats["first_match"] else None,
                    "last_match": stats["last_match"].isoformat() if stats["last_match"] else None,
                    "teams": [dict(t) for t in teams],
                }
                
                tournament["performance_summary"] = summary
                return tournament
                
        except MySQLError as e:
            logger.error("Failed to get performance summary for tournament %d: %s", tournament_id, e)
            raise
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on TiDB connection.
        
        Returns:
            Health status with connection info
        """
        try:
            with self._get_cursor() as cursor:
                cursor.execute("SELECT 1 as ping, NOW() as server_time")
                result = cursor.fetchone()
                
                # Get connection stats if available
                cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
                threads_result = cursor.fetchone()
                
                return {
                    "status": "healthy",
                    "ping": True,
                    "server_time": result["server_time"].isoformat() if result["server_time"] else None,
                    "threads_connected": threads_result["Value"] if threads_result else None,
                    "host": self.host,
                    "port": self.port,
                    "database": self.database,
                }
        except MySQLError as e:
            logger.error("Health check failed: %s", e)
            return {
                "status": "unhealthy",
                "error": str(e),
                "host": self.host,
                "port": self.port,
                "database": self.database,
            }
    
    def sync_with_sator(
        self,
        sator_tournament_data: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Sync tournament data from SATOR analytics system.
        
        Creates or updates tournament records based on SATOR cross-references.
        Logs sync operations for audit purposes.
        
        Args:
            sator_tournament_data: List of tournament data from SATOR
            
        Returns:
            Sync summary with counts
        """
        created = 0
        updated = 0
        errors = 0
        
        try:
            with self._get_cursor() as cursor:
                for data in sator_tournament_data:
                    try:
                        sator_ref = data.get("sator_cross_ref")
                        if not sator_ref:
                            continue
                        
                        # Check if tournament exists
                        cursor.execute(
                            "SELECT tournament_id FROM opera_tournaments WHERE sator_cross_ref = %s",
                            (sator_ref,)
                        )
                        existing = cursor.fetchone()
                        
                        if existing:
                            # Update
                            cursor.execute("""
                                UPDATE opera_tournaments
                                SET name = %(name)s,
                                    tier = %(tier)s,
                                    game = %(game)s,
                                    region = %(region)s,
                                    updated_at = NOW()
                                WHERE sator_cross_ref = %(sator_cross_ref)s
                            """, data)
                            updated += 1
                        else:
                            # Create
                            cursor.execute("""
                                INSERT INTO opera_tournaments (
                                    name, tier, game, region, organizer,
                                    start_date, end_date, status, sator_cross_ref,
                                    created_at, updated_at
                                ) VALUES (
                                    %(name)s, %(tier)s, %(game)s, %(region)s,
                                    %(organizer)s, %(start_date)s, %(end_date)s,
                                    %(status)s, %(sator_cross_ref)s, NOW(), NOW()
                                )
                            """, data)
                            created += 1
                            
                    except Exception as e:
                        logger.error("Error syncing tournament: %s", e)
                        errors += 1
                
                # Log sync operation
                cursor.execute("""
                    INSERT INTO opera_sync_log (
                        sync_type, source_system, records_processed,
                        records_created, records_updated, errors, synced_at
                    ) VALUES (
                        'tournament_sync', 'SATOR', %s, %s, %s, %s, NOW()
                    )
                """, (len(sator_tournament_data), created, updated, errors))
                
                return {
                    "processed": len(sator_tournament_data),
                    "created": created,
                    "updated": updated,
                    "errors": errors,
                }
                
        except MySQLError as e:
            logger.error("Failed to sync with SATOR: %s", e)
            raise
    
    def close(self) -> None:
        """Close the connection pool and release resources."""
        if self._pool:
            # mysql-connector pool doesn't have explicit close, connections timeout
            logger.info("TiDBOperaClient connection pool marked for cleanup")
            self._pool = None
