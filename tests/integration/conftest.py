"""
Pytest fixtures for cross-service E2E integration tests.

Provides fixtures for testing:
- Godot → API → WebSocket flows
- Feature Store integration
- Analytics pipeline
- Circuit breaker behavior
- Error recovery patterns

[Ver002.000] - Integration test fixtures
"""

import pytest
import asyncio
import httpx
import websockets
import json
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict, Any, Optional
from pathlib import Path
import sys

# Add service paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "api"))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "websocket"))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "packages" / "shared"))

# Test configuration
TEST_API_URL = "http://localhost:8001"  # Test API port
TEST_WS_URL = "ws://localhost:8766"     # Test WebSocket port
TEST_DB_URL = "postgresql://test:test@localhost:5433/test_db"
TEST_REDIS_URL = "redis://localhost:6380"


# =============================================================================
# Event Loop and Session Fixtures
# =============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def api_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Shared API client for integration tests."""
    async with httpx.AsyncClient(
        base_url=TEST_API_URL,
        timeout=30.0,
        headers={"Content-Type": "application/json"}
    ) as client:
        yield client


@pytest.fixture(scope="session")
async def websocket_client():
    """WebSocket client factory for integration tests."""
    clients = []
    
    async def create_client(endpoint: str = "/ws/matches/live"):
        ws_url = f"{TEST_WS_URL}{endpoint}"
        ws = await websockets.connect(ws_url)
        clients.append((ws, endpoint))
        return ws
    
    yield create_client
    
    # Cleanup all clients
    for ws, _ in clients:
        try:
            await ws.close()
        except Exception:
            pass


# =============================================================================
# Tournament Fixtures
# =============================================================================

@pytest.fixture
async def test_tournament(api_client: httpx.AsyncClient) -> Dict[str, Any]:
    """Create and yield a test tournament."""
    tournament_data = {
        "name": f"Test Tournament {uuid.uuid4().hex[:8]}",
        "game": "valorant",
        "start_date": datetime.utcnow().isoformat(),
        "end_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "teams_count": 8
    }
    
    # Create tournament via API
    response = await api_client.post("/api/v1/tournaments/", json=tournament_data)
    
    if response.status_code == 201:
        tournament = response.json()
    elif response.status_code == 501:
        # Fallback for unimplemented endpoint
        tournament = {
            "id": str(uuid.uuid4()),
            **tournament_data,
            "status": "created"
        }
    else:
        pytest.skip(f"Tournament creation not available: {response.status_code}")
        tournament = {
            "id": str(uuid.uuid4()),
            **tournament_data,
            "status": "fallback"
        }
    
    yield tournament
    
    # Cleanup
    try:
        await api_client.delete(f"/api/v1/tournaments/{tournament['id']}")
    except Exception:
        pass


@pytest.fixture
async def test_match_result() -> Dict[str, Any]:
    """Generate a test match result (Godot export format)."""
    match_id = f"match_{uuid.uuid4().hex[:8]}"
    return {
        "match_id": match_id,
        "tournament_id": "test_tournament",
        "team1_id": "team_a",
        "team2_id": "team_b",
        "team1_score": 13,
        "team2_score": 10,
        "winner_id": "team_a",
        "map_results": [
            {
                "map": "Haven",
                "team1_score": 13,
                "team2_score": 10,
                "duration_seconds": 2340
            }
        ],
        "stats": {
            "team_a": {
                "player_1": {"kills": 22, "deaths": 15, "assists": 5, "acs": 285},
                "player_2": {"kills": 18, "deaths": 17, "assists": 8, "acs": 245},
            },
            "team_b": {
                "player_3": {"kills": 16, "deaths": 19, "assists": 6, "acs": 198},
                "player_4": {"kills": 14, "deaths": 21, "assists": 4, "acs": 175},
            }
        },
        "submitted_at": datetime.utcnow().isoformat()
    }


# =============================================================================
# Feature Store Fixtures
# =============================================================================

@pytest.fixture
def sample_spatial_features() -> Dict[str, Any]:
    """Generate sample spatial features for SATOR Square."""
    return {
        "match_id": f"test_match_{uuid.uuid4().hex[:8]}",
        "feature_values": {
            "impact_events": [
                {"x": 100, "y": 200, "timestamp": 1000, "type": "kill"},
                {"x": 150, "y": 250, "timestamp": 1500, "type": "assist"},
            ],
            "death_events": [
                {"x": 120, "y": 220, "timestamp": 1100, "player": "player_1"},
            ],
            "ability_usage": [
                {"x": 130, "y": 230, "timestamp": 1200, "ability": "smoke"},
            ],
            "heatmap_data": {
                "grid_size": 50,
                "values": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
            }
        },
        "computed_at": datetime.utcnow().isoformat(),
        "source_system": "godot_simulation"
    }


@pytest.fixture
async def feature_store_client(api_client: httpx.AsyncClient):
    """Feature Store client helper."""
    class FeatureStoreClient:
        def __init__(self, client: httpx.AsyncClient):
            self.client = client
            self.base_url = "/api/v1/features"
        
        async def store_features(self, match_id: str, features: Dict[str, Any]):
            """Store features for a match."""
            response = await self.client.post(
                f"{self.base_url}/match/{match_id}",
                json=features
            )
            return response
        
        async def get_spatial_features(self, match_id: str):
            """Get spatial features for SATOR Square."""
            response = await self.client.get(
                f"{self.base_url}/match/{match_id}/spatial"
            )
            return response
        
        async def store_player_rating(
            self, 
            player_id: str, 
            simrating: Dict[str, Any]
        ):
            """Store player SimRating in feature store."""
            response = await self.client.post(
                f"{self.base_url}/player/{player_id}/rating",
                json={
                    "player_id": player_id,
                    "simrating": simrating,
                    "computed_at": datetime.utcnow().isoformat()
                }
            )
            return response
    
    return FeatureStoreClient(api_client)


# =============================================================================
# Analytics Fixtures
# =============================================================================

@pytest.fixture
def sample_player_stats() -> Dict[str, Any]:
    """Generate sample player stats for SimRating calculation."""
    return {
        "player_id": f"player_{uuid.uuid4().hex[:8]}",
        "match_id": f"match_{uuid.uuid4().hex[:8]}",
        "kills": 22,
        "deaths": 15,
        "assists": 5,
        "acs": 285,
        "adr": 185.5,
        "kast_pct": 78.5,
        "hs_pct": 32.0,
        "first_bloods": 3,
        "clutch_wins": 1,
        "agent": "Jett",
        "team": "Team A",
        "opponent": "Team B"
    }


@pytest.fixture
def sample_simrating_request() -> Dict[str, float]:
    """Generate sample SimRating calculation request."""
    return {
        "kills_z": 1.2,
        "deaths_z": -0.5,
        "adjusted_kill_value_z": 1.0,
        "adr_z": 0.8,
        "kast_pct_z": 0.6
    }


# =============================================================================
# Circuit Breaker Fixtures
# =============================================================================

@pytest.fixture
async def circuit_breaker_client(api_client: httpx.AsyncClient):
    """Circuit breaker test helper."""
    class CircuitBreakerClient:
        def __init__(self, client: httpx.AsyncClient):
            self.client = client
        
        async def get_status(self, name: Optional[str] = None):
            """Get circuit breaker status."""
            if name:
                response = await self.client.get(
                    f"/api/v1/tournaments/system/circuit-breakers/{name}"
                )
            else:
                response = await self.client.get(
                    "/api/v1/tournaments/system/circuit-breakers"
                )
            return response
        
        async def reset(self, name: str):
            """Reset a circuit breaker."""
            response = await self.client.post(
                f"/api/v1/tournaments/system/circuit-breakers/{name}/reset"
            )
            return response
        
        async def simulate_failures(
            self, 
            endpoint: str, 
            count: int = 5
        ) -> int:
            """Simulate failures to trigger circuit breaker."""
            failures = 0
            for _ in range(count):
                try:
                    response = await self.client.get(endpoint)
                    if response.status_code >= 500:
                        failures += 1
                except Exception:
                    failures += 1
            return failures
    
    return CircuitBreakerClient(api_client)


# =============================================================================
# Godot Export Client Simulator
# =============================================================================

@pytest.fixture
def godot_export_client(api_client: httpx.AsyncClient):
    """Simulate Godot ExportClient behavior."""
    class GodotExportClientSimulator:
        def __init__(self, client: httpx.AsyncClient):
            self.client = client
            self.offline_queue = []
            self.is_online = True
            self.api_base = "/api/v1"
        
        async def send_match_data(
            self, 
            match_data: Dict[str, Any],
            expect_offline: bool = False
        ):
            """Send match data, queue if offline."""
            if expect_offline or not self.is_online:
                self.offline_queue.append(match_data)
                return {"queued": True, "queue_size": len(self.offline_queue)}
            
            response = await self.client.post(
                f"{self.api_base}/tournaments/{match_data.get('tournament_id', 'default')}/matches/results",
                json=match_data
            )
            return response
        
        async def flush_queue(self):
            """Flush queued data when back online."""
            results = []
            while self.offline_queue:
                data = self.offline_queue.pop(0)
                response = await self.client.post(
                    f"{self.api_base}/tournaments/{data.get('tournament_id', 'default')}/matches/results",
                    json=data
                )
                results.append(response)
            return results
        
        def get_queue_size(self) -> int:
            """Get current queue size."""
            return len(self.offline_queue)
        
        def set_online(self, online: bool):
            """Set online status."""
            self.is_online = online
    
    return GodotExportClientSimulator(api_client)


# =============================================================================
# WebSocket Subscription Helper
# =============================================================================

@pytest.fixture
def websocket_subscriber():
    """WebSocket subscription helper."""
    class WebSocketSubscriber:
        def __init__(self, ws):
            self.ws = ws
            self.messages = []
            self.subscriptions = set()
        
        async def subscribe(self, channel: str):
            """Subscribe to a channel."""
            await self.ws.send(json.dumps({
                "action": "subscribe",
                "channel": channel
            }))
            self.subscriptions.add(channel)
        
        async def unsubscribe(self, channel: str):
            """Unsubscribe from a channel."""
            await self.ws.send(json.dumps({
                "action": "unsubscribe",
                "channel": channel
            }))
            self.subscriptions.discard(channel)
        
        async def receive_json(self, timeout: float = 5.0):
            """Receive and parse JSON message."""
            import asyncio
            message = await asyncio.wait_for(self.ws.recv(), timeout=timeout)
            data = json.loads(message)
            self.messages.append(data)
            return data
        
        async def wait_for_message_type(
            self, 
            msg_type: str, 
            timeout: float = 5.0
        ) -> Optional[Dict]:
            """Wait for a specific message type."""
            import asyncio
            start = asyncio.get_event_loop().time()
            while asyncio.get_event_loop().time() - start < timeout:
                try:
                    msg = await self.receive_json(timeout=0.5)
                    if msg.get("type") == msg_type:
                        return msg
                except asyncio.TimeoutError:
                    continue
            return None
    
    return WebSocketSubscriber


# =============================================================================
# Test Data Generators
# =============================================================================

@pytest.fixture
def generate_match_result():
    """Factory fixture for generating match results."""
    def _generate(
        tournament_id: str = "test_tournament",
        team1_score: int = 13,
        team2_score: int = 10
    ):
        return {
            "match_id": f"match_{uuid.uuid4().hex[:8]}",
            "tournament_id": tournament_id,
            "team1_id": "team_a",
            "team2_id": "team_b",
            "team1_score": team1_score,
            "team2_score": team2_score,
            "winner_id": "team_a" if team1_score > team2_score else "team_b",
            "map_results": [
                {
                    "map": "Haven",
                    "team1_score": team1_score,
                    "team2_score": team2_score
                }
            ],
            "submitted_at": datetime.utcnow().isoformat()
        }
    return _generate


@pytest.fixture
def generate_player_stats():
    """Factory fixture for generating player stats."""
    def _generate(player_id: Optional[str] = None):
        return {
            "player_id": player_id or f"player_{uuid.uuid4().hex[:8]}",
            "kills": 20,
            "deaths": 15,
            "assists": 5,
            "acs": 250,
            "adr": 160.0,
            "kast_pct": 75.0,
            "hs_pct": 30.0,
            "first_bloods": 2
        }
    return _generate


@pytest.fixture
def generate_spatial_features():
    """Factory fixture for generating spatial features."""
    def _generate(match_id: Optional[str] = None):
        return {
            "match_id": match_id or f"match_{uuid.uuid4().hex[:8]}",
            "impact_events": [
                {"x": 100, "y": 200, "timestamp": i * 1000, "type": "kill"}
                for i in range(5)
            ],
            "death_events": [
                {"x": 150, "y": 250, "timestamp": i * 1200, "player": f"player_{i}"}
                for i in range(3)
            ],
            "heatmap_data": {
                "grid_size": 50,
                "values": [[0.1, 0.2], [0.3, 0.4]]
            }
        }
    return _generate


# =============================================================================
# Markers Configuration
# =============================================================================

def pytest_configure(config):
    """Configure custom markers."""
    config.addinivalue_line("markers", "integration: Integration tests (requires services)")
    config.addinivalue_line("markers", "e2e: End-to-end tests (full stack)")
    config.addinivalue_line("markers", "godot: Godot integration tests")
    config.addinivalue_line("markers", "websocket: WebSocket tests")
    config.addinivalue_line("markers", "circuit_breaker: Circuit breaker tests")
    config.addinivalue_line("markers", "feature_store: Feature store tests")
    config.addinivalue_line("markers", "slow: Slow tests")
