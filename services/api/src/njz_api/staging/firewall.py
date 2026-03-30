"""[Ver001.000]
Data Partition Firewall — GAME_ONLY_FIELDS Response Sanitization

Implements the data partition concept ensuring game-internal fields
never reach the web platform.

Blocks sensitive game-internal fields from leaking to the web platform.
"""
import logging
from typing import Any, Set

logger = logging.getLogger(__name__)


# Fields that exist exclusively inside the game simulation
# and must never be transmitted to the web platform
GAME_ONLY_FIELDS: Set[str] = frozenset([
    "internalAgentState",
    "radarData",
    "detailedReplayFrameData",
    "simulationTick",
    "seedValue",
    "visionConeData",
    "smokeTickData",
    "recoilPattern",
    "aimAssistData",
    "serverTimestamp"
])

# Fields only available in web platform
WEB_ONLY_FIELDS: Set[str] = frozenset([
    "webOptimizedGeometry",
    "compressedTextures",
    "cdnUrls"
])

# Common fields allowed in both
SHARED_FIELDS: Set[str] = frozenset([
    "matchId", "playerId", "teamId", "timestamp",
    "mapName", "score", "kills", "deaths", "assists"
])


def sanitize_for_web(data: dict[str, Any]) -> dict[str, Any]:
    """Remove game-internal fields before web export."""
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    for key, value in data.items():
        if key in GAME_ONLY_FIELDS:
            logger.debug(f"FIREWALL: Stripping game-only field '{key}'")
            continue
        
        # Recursively sanitize nested structures
        if isinstance(value, dict):
            sanitized[key] = sanitize_for_web(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_for_web(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


def validate_partition(data: dict[str, Any]) -> bool:
    """Validate data partition compliance. Returns True if compliant."""
    if not isinstance(data, dict):
        return True
    
    for key in data.keys():
        if key in GAME_ONLY_FIELDS:
            return False
    
    # Check nested structures
    for value in data.values():
        if isinstance(value, dict):
            if not validate_partition(value):
                return False
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict) and not validate_partition(item):
                    return False
    
    return True


class FantasyDataFilter:
    """
    Python implementation of the FantasyDataFilter from data-partition-lib.
    
    Enforces the SATOR data partition policy: game-internal fields must never
    reach the web platform or be stored in the public database.
    """
    
    # Fields that exist exclusively inside the game simulation
    # and must never be transmitted to the web platform
    GAME_ONLY_FIELDS: Set[str] = {
        "internalAgentState",
        "radarData",
        "detailedReplayFrameData",
        "simulationTick",
        "seedValue",
        "visionConeData",
        "smokeTickData",
        "recoilPattern",
    }
    
    @classmethod
    def sanitize_for_web(cls, data: Any) -> Any:
        """
        Sanitize data object before sending to web platform.
        
        Recursively traverses dicts and lists, removing all GAME_ONLY_FIELDS.
        
        Args:
            data: Raw data object (dict, list, or primitive)
            
        Returns:
            Sanitized copy safe for web consumption
        """
        if isinstance(data, dict):
            sanitized: dict[str, Any] = {}
            for key, value in data.items():
                # Skip game-only fields
                if key in cls.GAME_ONLY_FIELDS:
                    continue
                # Recursively sanitize nested structures
                sanitized[key] = cls.sanitize_for_web(value)
            return sanitized
        
        elif isinstance(data, list):
            return [cls.sanitize_for_web(item) for item in data]
        
        elif isinstance(data, tuple):
            return tuple(cls.sanitize_for_web(item) for item in data)
        
        # Primitive value — return as-is
        return data
    
    @classmethod
    def validate_web_input(cls, data: Any) -> bool:
        """
        Validate that incoming web data does not contain game-internal fields.
        
        Call this at API ingestion points before persisting data.
        
        Args:
            data: Data received from or destined for the web layer
            
        Returns:
            True if all fields are valid
            
        Raises:
            ValueError: If a forbidden field is detected
        """
        if isinstance(data, dict):
            for key in data.keys():
                if key in cls.GAME_ONLY_FIELDS:
                    raise ValueError(
                        f"Web attempted to write game-internal field: {key}"
                    )
                # Recursively validate nested structures
                cls.validate_web_input(data[key])
        
        elif isinstance(data, (list, tuple)):
            for item in data:
                cls.validate_web_input(item)
        
        return True


class DataPartitionFirewall:
    """Enforces data partition between game and web."""
    
    def __init__(self):
        self.violations = []
        self.filter = FantasyDataFilter()
    
    def sanitize(self, data: dict[str, Any]) -> dict[str, Any]:
        """Sanitize data for web export, tracking violations."""
        sanitized = sanitize_for_web(data)
        
        # Track what was removed
        removed = self._find_removed_fields(data, sanitized)
        if removed:
            self.violations.append(f"Removed fields: {removed}")
            logger.warning(f"FIREWALL: Removed game-only fields: {removed}")
        
        return sanitized
    
    def strict_check(self, data: dict[str, Any]) -> None:
        """Raise exception if game fields present."""
        violations = [f for f in GAME_ONLY_FIELDS if f in data]
        if violations:
            raise ValueError(
                f"Data partition violation: {violations}"
            )
    
    def _find_removed_fields(
        self,
        original: dict[str, Any],
        sanitized: dict[str, Any],
        path: str = ""
    ) -> list[str]:
        """Find fields that were removed during sanitization."""
        removed = []
        
        for key in original.keys():
            current_path = f"{path}.{key}" if path else key
            
            if key in GAME_ONLY_FIELDS:
                removed.append(current_path)
            elif key not in sanitized:
                removed.append(current_path)
            elif isinstance(original[key], dict) and isinstance(sanitized.get(key), dict):
                removed.extend(
                    self._find_removed_fields(
                        original[key],
                        sanitized[key],
                        current_path
                    )
                )
        
        return removed
    
    def get_violations(self) -> list[str]:
        """Return list of violations detected."""
        return list(self.violations)
    
    def clear_violations(self) -> None:
        """Clear violation history."""
        self.violations = []
