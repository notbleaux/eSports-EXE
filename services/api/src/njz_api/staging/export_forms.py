"""[Ver001.000]
Export Forms — Web and Game data export with firewall enforcement.

WebExportForm: Transforms staging data for web platform consumption.
GameExportForm: Transforms staging data for game platform consumption.
"""
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .firewall import sanitize_for_web, validate_partition, GAME_ONLY_FIELDS

logger = logging.getLogger(__name__)


@dataclass
class WebDataRecord:
    """A record in the web data store."""
    web_data_id: Optional[int] = None
    data_type: str = ""
    data_key: str = ""
    data_version: str = "v1"
    payload: Dict[str, Any] = field(default_factory=dict)
    source_staging_id: Optional[int] = None
    firewall_verified: bool = False
    exported_at: Optional[str] = None
    is_active: bool = True


@dataclass
class GameDataRecord:
    """A record in the game data store."""
    game_data_id: Optional[int] = None
    data_type: str = ""
    data_key: str = ""
    data_version: str = "v1"
    payload: Dict[str, Any] = field(default_factory=dict)
    source_staging_id: Optional[int] = None
    exported_at: Optional[str] = None
    is_active: bool = True


# KCRITR → Public Statistics field mapping
KCRITR_TO_PUBLIC_MAP = {
    "player_id": "playerId",
    "match_id": "matchId",
    "kills": "kills",
    "deaths": "deaths",
    "assists": "assists",
    "adr": "damage",
    "headshot_pct": "headshots",
    "first_blood": "firstKills",
    "clutch_wins": "clutchesWon",
    "map_name": "mapName",
    "name": "username",
    "region": "region",
    "tournament": "tournament",
    "sim_rating": "simRating",
    "rar_score": "rarScore",
    "investment_grade": "investmentGrade",
    "role": "role",
}


def map_to_public_schema(kcritr_record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map a KCRITR analytics record to the public Statistics schema.
    Only fields explicitly listed in KCRITR_TO_PUBLIC_MAP are included.
    """
    public: Dict[str, Any] = {}
    for internal_key, public_key in KCRITR_TO_PUBLIC_MAP.items():
        if internal_key in kcritr_record:
            public[public_key] = kcritr_record[internal_key]
    return public


def verify_firewall_compliance(payload: Dict[str, Any]) -> List[str]:
    """
    Verify a payload contains NO game-only fields. Returns list of violations.
    Empty list = compliant.
    """
    violations: List[str] = []
    
    def check_dict(data: Dict[str, Any], path: str = ""):
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            if key in GAME_ONLY_FIELDS:
                violations.append(f"FIREWALL VIOLATION: '{key}' at {current_path}")
            elif isinstance(value, dict):
                check_dict(value, current_path)
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        check_dict(item, f"{current_path}[{i}]")
    
    check_dict(payload)
    return violations


class WebExportForm:
    """
    Export form that transforms staging data into SATOR Web format.
    
    The web project calls this form to pull sanitized public stats
    from the shared staging system.
    
    Properties:
        - requires_full_payload: False (fields are filtered)
        - requires_firewall: True (GAME_ONLY_FIELDS stripped)
        - output_format: JSON (TypeScript-compatible)
    """
    
    # System properties
    TARGET_PROJECT = "web"
    REQUIRES_FIREWALL = True
    OUTPUT_FORMAT = "json"
    
    def __init__(self, db_connection=None):
        self.db = db_connection
        self._store: List[WebDataRecord] = []
        self._next_id = 1
        self._export_log: List[Dict[str, Any]] = []
        logger.info("WebExportForm initialized")
    
    def export_player_stats(
        self,
        player_records: List[Dict[str, Any]],
        source_ingest_id: Optional[int] = None
    ) -> List[WebDataRecord]:
        """
        Export player stats from staging, applying firewall and schema mapping.
        
        Steps:
            1. Strip GAME_ONLY_FIELDS (firewall enforcement)
            2. Map KCRITR fields to public Statistics schema
            3. Verify firewall compliance
            4. Store in web data store
        """
        records: List[WebDataRecord] = []
        
        for raw in player_records:
            # Step 1: Firewall strip
            stripped = sanitize_for_web(raw)
            
            # Step 2: Map to public schema
            public = map_to_public_schema(stripped)
            
            # Step 3: Verify compliance
            violations = verify_firewall_compliance(public)
            if violations:
                logger.error("FIREWALL BLOCK: %s — record skipped", violations)
                continue
            
            # Step 4: Store
            data_key = f"{public.get('playerId', 'unknown')}_{public.get('matchId', 'unknown')}"
            record = WebDataRecord(
                web_data_id=self._next_id,
                data_type="player_stats",
                data_key=data_key,
                payload=public,
                source_staging_id=source_ingest_id,
                firewall_verified=True,
                exported_at=datetime.now(timezone.utc).isoformat(),
            )
            self._next_id += 1
            self._store.append(record)
            records.append(record)
            self._log_export(record, source_ingest_id)
            logger.info("Web export: player_stats/%s (firewall=PASS)", data_key)
        
        return records
    
    def export_match_summary(
        self,
        match_records: List[Dict[str, Any]],
        source_ingest_id: Optional[int] = None
    ) -> List[WebDataRecord]:
        """Export match summaries with firewall enforcement."""
        records: List[WebDataRecord] = []
        
        for raw in match_records:
            stripped = sanitize_for_web(raw)
            summary = {
                "matchId": stripped.get("match_id", stripped.get("matchId")),
                "mapName": stripped.get("map_name", stripped.get("mapName")),
                "tournament": stripped.get("tournament"),
                "roundsPlayed": stripped.get("rounds_played"),
                "winnerSide": stripped.get("winner_side"),
            }
            # Remove None values
            summary = {k: v for k, v in summary.items() if v is not None}
            
            violations = verify_firewall_compliance(summary)
            if violations:
                logger.error("FIREWALL BLOCK: %s", violations)
                continue
            
            record = WebDataRecord(
                web_data_id=self._next_id,
                data_type="match_summary",
                data_key=summary.get("matchId", f"match_{self._next_id}"),
                payload=summary,
                source_staging_id=source_ingest_id,
                firewall_verified=True,
                exported_at=datetime.now(timezone.utc).isoformat(),
            )
            self._next_id += 1
            self._store.append(record)
            records.append(record)
            self._log_export(record, source_ingest_id)
        
        return records
    
    def export_leaderboard(self, player_records: List[Dict[str, Any]]) -> List[WebDataRecord]:
        """Export leaderboard entries (latest stats per player)."""
        # Deduplicate by player, keeping latest
        latest_by_player: Dict[str, Dict[str, Any]] = {}
        for raw in player_records:
            pid = raw.get("player_id", raw.get("playerId"))
            if pid:
                latest_by_player[pid] = raw
        
        records: List[WebDataRecord] = []
        for pid, raw in latest_by_player.items():
            stripped = sanitize_for_web(raw)
            public = map_to_public_schema(stripped)
            violations = verify_firewall_compliance(public)
            if violations:
                continue
            
            record = WebDataRecord(
                web_data_id=self._next_id,
                data_type="leaderboard",
                data_key=str(pid),
                payload=public,
                firewall_verified=True,
                exported_at=datetime.now(timezone.utc).isoformat(),
            )
            self._next_id += 1
            self._store.append(record)
            records.append(record)
        
        return records
    
    def get_verified_records(self, data_type: Optional[str] = None) -> List[WebDataRecord]:
        """Get all firewall-verified active records."""
        results = [r for r in self._store if r.firewall_verified and r.is_active]
        if data_type:
            results = [r for r in results if r.data_type == data_type]
        return results
    
    def get_export_log(self) -> List[Dict[str, Any]]:
        """Return full export audit log."""
        return list(self._export_log)
    
    def _log_export(self, record: WebDataRecord, source_id: Optional[int]) -> None:
        """Log an export operation for audit trail."""
        self._export_log.append({
            "target_project": self.TARGET_PROJECT,
            "target_record_id": record.web_data_id,
            "source_staging_id": source_id,
            "data_type": record.data_type,
            "data_key": record.data_key,
            "firewall_verified": record.firewall_verified,
            "exported_at": record.exported_at,
            "status": "success",
        })


# Game data type mappings from staging payload types
GAME_DATA_TYPE_MAP = {
    "agents": "agent_def",
    "weapons": "weapon_def",
    "utilities": "utility_def",
    "rulesets": "ruleset_def",
    "maps": "map_def",
    "match_event": "event_log",
    "replay_log": "match_replay",
}


class GameExportForm:
    """
    Export form that transforms staging data into game format.
    
    The game project calls this form to pull definitions and match data
    from the shared staging system.
    
    Properties:
        - requires_full_payload: True (no field stripping)
        - requires_firewall: False (game has full access)
        - output_format: JSON (Godot-compatible)
    """
    
    # System properties
    TARGET_PROJECT = "game"
    REQUIRES_FIREWALL = False
    OUTPUT_FORMAT = "json"
    
    def __init__(self, db_connection=None):
        self.db = db_connection
        self._store: List[GameDataRecord] = []
        self._next_id = 1
        self._export_log: List[Dict[str, Any]] = []
        logger.info("GameExportForm initialized")
    
    def export_definitions(
        self,
        data_domain: str,
        definitions: List[Dict[str, Any]],
        source_staging_id: Optional[int] = None
    ) -> List[GameDataRecord]:
        """
        Export game definitions from staging to game data store.
        
        Args:
            data_domain: 'agents', 'weapons', 'utilities', 'rulesets', 'maps'
            definitions: List of definition payloads from staging
            source_staging_id: Reference back to staging static base
            
        Returns:
            List of GameDataRecord objects created.
        """
        data_type = GAME_DATA_TYPE_MAP.get(data_domain, data_domain)
        records: List[GameDataRecord] = []
        
        for defn in definitions:
            data_key = defn.get("id", defn.get("name", f"{data_domain}_{len(self._store)}"))
            record = GameDataRecord(
                game_data_id=self._next_id,
                data_type=data_type,
                data_key=data_key,
                payload=defn,
                source_staging_id=source_staging_id,
                exported_at=datetime.now(timezone.utc).isoformat(),
            )
            self._next_id += 1
            self._store.append(record)
            records.append(record)
            
            self._log_export(record, source_staging_id)
            logger.info("Game export: %s/%s (id=%d)", data_type, data_key, record.game_data_id)
        
        return records
    
    def export_match_events(
        self,
        match_id: str,
        events: List[Dict[str, Any]],
        source_ingest_id: Optional[int] = None
    ) -> GameDataRecord:
        """Export match event log to game data store."""
        record = GameDataRecord(
            game_data_id=self._next_id,
            data_type="event_log",
            data_key=match_id,
            payload={"match_id": match_id, "events": events, "event_count": len(events)},
            source_staging_id=source_ingest_id,
            exported_at=datetime.now(timezone.utc).isoformat(),
        )
        self._next_id += 1
        self._store.append(record)
        self._log_export(record, source_ingest_id)
        logger.info("Game export: event_log/%s (%d events)", match_id, len(events))
        return record
    
    def export_replay(
        self,
        match_id: str,
        replay_data: Dict[str, Any],
        source_ingest_id: Optional[int] = None
    ) -> GameDataRecord:
        """Export match replay data to game data store."""
        record = GameDataRecord(
            game_data_id=self._next_id,
            data_type="match_replay",
            data_key=match_id,
            payload=replay_data,
            source_staging_id=source_ingest_id,
            exported_at=datetime.now(timezone.utc).isoformat(),
        )
        self._next_id += 1
        self._store.append(record)
        self._log_export(record, source_ingest_id)
        logger.info("Game export: match_replay/%s", match_id)
        return record
    
    def get_active_definitions(self, data_type: str) -> List[GameDataRecord]:
        """Get all active records of a given type."""
        return [r for r in self._store if r.data_type == data_type and r.is_active]
    
    def get_by_key(self, data_type: str, data_key: str) -> Optional[GameDataRecord]:
        """Get a specific record by type and key."""
        for r in reversed(self._store):
            if r.data_type == data_type and r.data_key == data_key and r.is_active:
                return r
        return None
    
    def get_export_log(self) -> List[Dict[str, Any]]:
        """Return full export audit log."""
        return list(self._export_log)
    
    def _log_export(self, record: GameDataRecord, source_id: Optional[int]) -> None:
        """Log an export operation for audit trail."""
        self._export_log.append({
            "target_project": self.TARGET_PROJECT,
            "target_record_id": record.game_data_id,
            "source_staging_id": source_id,
            "data_type": record.data_type,
            "data_key": record.data_key,
            "exported_at": record.exported_at,
            "status": "success",
        })
