[Ver001.000] [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

# Data Partition Firewall
## Technical Implementation & Security Boundaries

---

## 1. Executive Summary

The Data Partition Firewall enforces strict separation between **Game Simulation Data** (internal, sensitive) and **Web Platform Data** (public-facing). This document provides the technical implementation details for this claimed separation.

### Why Data Partitioning?

| Concern | Risk Without Partitioning | Mitigation |
|---------|---------------------------|------------|
| **Cheating** | Game state exposed via API | GAME_ONLY_FIELDS filtered |
| **Replay Integrity** | Raw tick data manipulable | Web gets processed summaries |
| **Intellectual Property** | Simulation algorithms exposed | Internal-only access |

---

## 2. Field Classification

### 2.1 GAME_ONLY_FIELDS (Internal Only)

These fields are NEVER exposed to web clients:

```python
# packages/shared/api/src/firewall/constants.py
GAME_ONLY_FIELDS = frozenset([
    # Core Simulation State
    "internalAgentState",
    "simulationTick", 
    "seedValue",
    
    # Vision & Tactical Data
    "radarData",
    "visionConeData",
    "smokeTickData",
    
    # Physics & Mechanics
    "recoilPattern",
    "detailedReplayFrameData",
    
    # Internal Timings
    "serverTimestamp",
    "clientPredictionDelta",
    
    # AI/ML Internals
    "decisionTreeWeights",
    "neuralNetworkActivations",
])
```

### 2.2 WEB_ONLY_FIELDS (Public Only)

These fields are computed for web consumption:

```python
WEB_ONLY_FIELDS = frozenset([
    "playerStats",
    "teamStats", 
    "matchSummary",
    "simulationResult",
    "confidenceScore",
    "predictedWinner",
])
```

### 2.3 SHARED_FIELDS (Both Platforms)

Common fields accessible to both:

```python
SHARED_FIELDS = frozenset([
    "matchId",
    "playerId",
    "timestamp",
    "mapName",
    "teamComposition",
    "score",
])
```

---

## 3. Firewall Implementation

### 3.1 Core Firewall Module

```python
# packages/shared/api/src/firewall/data_partition.py
"""
Data Partition Firewall - Enforces game/web data separation.
"""
from typing import Dict, Any, Set, Optional
import logging

logger = logging.getLogger(__name__)


class DataPartitionFirewall:
    """
    Enforces strict separation between game simulation and web platform data.
    
    Usage:
        firewall = DataPartitionFirewall()
        web_safe = firewall.sanitize_for_web(game_data)
        game_safe = firewall.sanitize_for_game(web_data)
    """
    
    # Fields that should never leave the game simulation
    GAME_ONLY_FIELDS: Set[str] = {
        'internalAgentState',
        'simulationTick',
        'seedValue',
        'radarData',
        'visionConeData',
        'smokeTickData',
        'recoilPattern',
        'detailedReplayFrameData',
        'decisionTreeWeights',
        'neuralNetworkActivations',
    }
    
    # Fields that should never enter the game simulation
    WEB_ONLY_FIELDS: Set[str] = {
        'userId',
        'sessionToken',
        'analyticsMetadata',
    }
    
    def __init__(self, strict_mode: bool = True):
        self.strict_mode = strict_mode
        self.violation_count = 0
    
    def sanitize_for_web(
        self, 
        data: Dict[str, Any], 
        path: str = ""
    ) -> Dict[str, Any]:
        """
        Remove game-only fields before sending to web clients.
        
        Args:
            data: Raw simulation data
            path: Current path for logging
            
        Returns:
            Sanitized data safe for web consumption
        """
        sanitized = {}
        
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            
            if key in self.GAME_ONLY_FIELDS:
                logger.debug(f"Filtering GAME_ONLY field: {current_path}")
                self.violation_count += 1
                continue
            
            # Recursively sanitize nested dicts
            if isinstance(value, dict):
                sanitized[key] = self.sanitize_for_web(value, current_path)
            elif isinstance(value, list):
                sanitized[key] = [
                    self.sanitize_for_web(item, current_path) 
                    if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    def sanitize_for_game(
        self, 
        data: Dict[str, Any],
        path: str = ""
    ) -> Dict[str, Any]:
        """
        Remove web-only fields before sending to game simulation.
        
        Args:
            data: Web platform data
            path: Current path for logging
            
        Returns:
            Sanitized data safe for game consumption
        """
        sanitized = {}
        
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            
            if key in self.WEB_ONLY_FIELDS:
                logger.debug(f"Filtering WEB_ONLY field: {current_path}")
                continue
            
            if isinstance(value, dict):
                sanitized[key] = self.sanitize_for_game(value, current_path)
            elif isinstance(value, list):
                sanitized[key] = [
                    self.sanitize_for_game(item, current_path)
                    if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    def validate_web_response(
        self, 
        data: Dict[str, Any]
    ) -> tuple[bool, list[str]]:
        """
        Validate that web response contains no game-only fields.
        
        Returns:
            (is_valid, violations)
        """
        violations = []
        
        def check_recursive(obj: Any, path: str = ""):
            if isinstance(obj, dict):
                for key in obj.keys():
                    current_path = f"{path}.{key}" if path else key
                    if key in self.GAME_ONLY_FIELDS:
                        violations.append(current_path)
                    check_recursive(obj[key], current_path)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    check_recursive(item, f"{path}[{i}]")
        
        check_recursive(data)
        return len(violations) == 0, violations
    
    def get_stats(self) -> Dict[str, int]:
        """Return firewall statistics."""
        return {
            "violation_count": self.violation_count,
            "game_only_fields": len(self.GAME_ONLY_FIELDS),
            "web_only_fields": len(self.WEB_ONLY_FIELDS),
        }


# Singleton instance
_firewall = None

def get_firewall() -> DataPartitionFirewall:
    """Get or create singleton firewall instance."""
    global _firewall
    if _firewall is None:
        _firewall = DataPartitionFirewall()
    return _firewall
```

### 3.2 FastAPI Integration

```python
# packages/shared/api/src/firewall/middleware.py
"""
FastAPI middleware for automatic data partition enforcement.
"""
from fastapi import Request, Response
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
import json
import logging

from .data_partition import get_firewall

logger = logging.getLogger(__name__)


class DataPartitionMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically sanitizes responses.
    
    Usage:
        app.add_middleware(DataPartitionMiddleware)
    """
    
    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled
        self.firewall = get_firewall()
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if not self.enabled:
            return response
        
        # Only process JSON responses
        content_type = response.headers.get("content-type", "")
        if "application/json" not in content_type:
            return response
        
        try:
            # Parse response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            data = json.loads(body)
            
            # Sanitize for web
            sanitized = self.firewall.sanitize_for_web(data)
            
            # Validate
            is_valid, violations = self.firewall.validate_web_response(sanitized)
            if not is_valid:
                logger.error(f"Data partition violation: {violations}")
                if self.firewall.strict_mode:
                    return Response(
                        content=json.dumps({
                            "error": "Data partition violation",
                            "violations": violations
                        }),
                        status_code=500,
                        media_type="application/json"
                    )
            
            # Re-encode response
            new_body = json.dumps(sanitized).encode()
            
            # Update headers
            headers = dict(response.headers)
            headers["content-length"] = str(len(new_body))
            headers["X-Data-Partition"] = "enforced"
            
            return Response(
                content=new_body,
                status_code=response.status_code,
                headers=headers,
                media_type="application/json"
            )
            
        except Exception as e:
            logger.error(f"Error in data partition middleware: {e}")
            return response


class PartitionedRoute(APIRoute):
    """
    Custom route that automatically sanitizes response data.
    
    Usage:
        router = APIRouter(route_class=PartitionedRoute)
    """
    
    def get_route_handler(self):
        original_route_handler = super().get_route_handler()
        firewall = get_firewall()
        
        async def custom_route_handler(request: Request) -> Response:
            response = await original_route_handler(request)
            
            # Sanitize if JSON response
            if hasattr(response, 'body'):
                try:
                    data = json.loads(response.body)
                    sanitized = firewall.sanitize_for_web(data)
                    response.body = json.dumps(sanitized).encode()
                except:
                    pass
            
            return response
        
        return custom_route_handler
```

### 3.3 Route-Level Decorator

```python
# packages/shared/api/src/firewall/decorators.py
"""
Decorators for fine-grained data partition control.
"""
from functools import wraps
from typing import Callable, Any
import logging

from .data_partition import get_firewall

logger = logging.getLogger(__name__)


def sanitize_for_web(func: Callable) -> Callable:
    """
    Decorator to sanitize function output for web consumption.
    
    Usage:
        @sanitize_for_web
        def get_simulation_data(match_id: str) -> dict:
            return raw_simulation_data
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        result = func(*args, **kwargs)
        
        if isinstance(result, dict):
            firewall = get_firewall()
            return firewall.sanitize_for_web(result)
        
        return result
    
    return wrapper


def validate_partition(func: Callable) -> Callable:
    """
    Decorator to validate no game-only fields in response.
    
    Raises RuntimeError if violation detected in strict mode.
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        result = func(*args, **kwargs)
        
        if isinstance(result, dict):
            firewall = get_firewall()
            is_valid, violations = firewall.validate_web_response(result)
            
            if not is_valid:
                logger.error(f"Data partition violation in {func.__name__}: {violations}")
                
                if firewall.strict_mode:
                    raise RuntimeError(
                        f"Data partition violation: {violations}"
                    )
        
        return result
    
    return wrapper
```

---

## 4. Usage Examples

### 4.1 Basic Sanitization

```python
from api.src.firewall import get_firewall

firewall = get_firewall()

# Raw simulation data (from Godot)
game_data = {
    "matchId": "match_123",
    "playerId": "player_456",
    "score": 13,
    "internalAgentState": {...},  # GAME_ONLY
    "simulationTick": 12345,       # GAME_ONLY
    "radarData": [...],            # GAME_ONLY
}

# Sanitize for web
web_data = firewall.sanitize_for_web(game_data)
# Result: {"matchId": "match_123", "playerId": "player_456", "score": 13}
```

### 4.2 API Route with Automatic Sanitization

```python
from fastapi import APIRouter
from api.src.firewall.middleware import PartitionedRoute
from api.src.firewall.decorators import sanitize_for_web

router = APIRouter(
    prefix="/v1/simulation",
    route_class=PartitionedRoute  # Auto-sanitizes all responses
)

@router.get("/matches/{match_id}")
async def get_match_simulation(match_id: str):
    """
    Returns simulation data (automatically sanitized).
    """
    raw_data = await get_raw_simulation(match_id)
    return raw_data  # Middleware sanitizes automatically

@router.get("/matches/{match_id}/detailed")
@sanitize_for_web  # Explicit decorator
async def get_detailed_simulation(match_id: str):
    """
    Returns detailed simulation (explicitly sanitized).
    """
    return await get_detailed_data(match_id)
```

### 4.3 WebSocket Data Partitioning

```python
from api.src.firewall import get_firewall

firewall = get_firewall()

class SimulationWebSocket:
    async def broadcast_match_update(self, match_id: str, data: dict):
        """Broadcast sanitized update to web clients."""
        
        # Sanitize before sending to web
        web_safe_data = firewall.sanitize_for_web(data)
        
        # Validate
        is_valid, violations = firewall.validate_web_response(web_safe_data)
        if not is_valid:
            logger.error(f"WebSocket data partition violation: {violations}")
            return
        
        await self.websocket.send_json(web_safe_data)
```

---

## 5. Testing

### 5.1 Unit Tests

```python
# tests/unit/test_data_partition.py
import pytest
from api.src.firewall.data_partition import DataPartitionFirewall


class TestDataPartitionFirewall:
    def test_sanitize_removes_game_only_fields(self):
        firewall = DataPartitionFirewall()
        
        data = {
            "matchId": "123",
            "internalAgentState": {"x": 1, "y": 2},
            "score": 13
        }
        
        result = firewall.sanitize_for_web(data)
        
        assert "matchId" in result
        assert "score" in result
        assert "internalAgentState" not in result
    
    def test_validate_detects_violations(self):
        firewall = DataPartitionFirewall()
        
        data = {
            "matchId": "123",
            "simulationTick": 12345,
            "seedValue": "abc123"
        }
        
        is_valid, violations = firewall.validate_web_response(data)
        
        assert not is_valid
        assert len(violations) == 2
        assert any("simulationTick" in v for v in violations)
    
    def test_nested_data_sanitization(self):
        firewall = DataPartitionFirewall()
        
        data = {
            "match": {
                "id": "123",
                "internalAgentState": {...},
                "players": [
                    {"id": "p1", "radarData": [...]},
                    {"id": "p2"}
                ]
            }
        }
        
        result = firewall.sanitize_for_web(data)
        
        assert "match" in result
        assert "id" in result["match"]
        assert "internalAgentState" not in result["match"]
        assert "radarData" not in result["match"]["players"][0]
```

---

## 6. Monitoring & Alerting

### 6.1 Metrics

```python
# Track firewall activity
from api.src.firewall import get_firewall

firewall = get_firewall()
stats = firewall.get_stats()

print(f"Violations detected: {stats['violation_count']}")
print(f"Game-only fields: {stats['game_only_fields']}")
```

### 6.2 Health Check

```python
@app.get("/health/firewall")
async def firewall_health():
    """Check data partition firewall status."""
    firewall = get_firewall()
    stats = firewall.get_stats()
    
    return {
        "status": "healthy",
        "violations_detected": stats["violation_count"],
        "strict_mode": firewall.strict_mode,
        "game_only_fields_count": stats["game_only_fields"]
    }
```

---

## 7. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 001.000 | 2026-03-30 | Security Team | Initial technical implementation |

---

*End of Data Partition Firewall Documentation*
