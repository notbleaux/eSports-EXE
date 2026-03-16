"""
ROTAS Map API Routes
====================
FastAPI routes for map data serving SpecMapViewer frontend.

Endpoints:
- GET  /api/maps                  - List all available maps
- GET  /api/maps/{map_id}         - Get map metadata
- GET  /api/maps/{map_id}/grid    - Get map grid data
- POST /api/maps/{map_id}/lens-data - Get lens overlay data
- POST /api/maps/pathfind         - Pathfinding between points

WebSocket:
- WS   /ws/lens-updates       - Real-time lens updates (mounted at app level)

TODO: Replace MAPS_DB mock data with actual database queries

[Ver002.000] - Fixed duplicate function and docstring issues
"""

import logging
import asyncio
import time
from typing import List, Optional
from enum import Enum

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
from datetime import datetime, timezone

# Import rate limiter from main app context
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/maps", tags=["maps"])

# ============================================================================
# Data Models
# ============================================================================

class MapMetadata(BaseModel):
    """Map metadata response."""
    id: str
    name: str
    dimensions: dict[str, int]  # width, height
    sites: List[dict]  # name, x, y
    callouts: List[dict]  # name, region
    thumbnail_url: Optional[str] = None


class MapGridData(BaseModel):
    """Map grid data for rendering."""
    map_id: str
    dimensions: dict[str, int]
    grid_resolution: int = 64  # pixels per cell
    sites: List[dict]
    spawns: dict[str, List[dict]]  # attacker/defender spawn points
    chokepoints: List[dict]  # strategic choke points
    textures: dict[str, str]  # base64 encoded or URLs
    collision_data: Optional[List[List[bool]]] = None  # 2D collision grid


class LensType(str, Enum):
    """Available lens types."""
    TENSION = "tension"
    RIPPLE = "ripple"
    BLOOD = "blood"
    WIND = "wind"
    DOORS = "doors"
    SECURED = "secured"


class LensDataRequest(BaseModel):
    """Request for lens data."""
    lens_types: List[str] = Field(..., min_items=1, max_items=6)
    region: Optional[dict] = None  # Optional region filter {x, y, width, height}
    timestamp: Optional[float] = None  # Optional timestamp for historical data


class LensDataResponse(BaseModel):
    """Lens overlay data response."""
    map_id: str
    lens_types: List[str]
    lens_data: dict  # Type-specific data
    timestamp: datetime
    update_interval: int = 1000  # ms between updates


class PathRequest(BaseModel):
    """Pathfinding request."""
    map_id: str  # Required to get collision data
    start: dict[str, float]  # x, y coordinates
    end: dict[str, float]
    avoid_chokepoints: bool = False
    team: Optional[str] = None  # "attack" or "defend" for team-specific paths


class PathResponse(BaseModel):
    """Pathfinding response."""
    path: List[dict[str, float]]  # List of {x, y} points
    distance: float  # Total path distance
    estimated_time: float  # Estimated traversal time (seconds)
    difficulty: str  # "easy", "medium", "hard"
    alternative_paths: Optional[List[List[dict[str, float]]]] = None


# ============================================================================
# Mock Data (Replace with database in production)
# ============================================================================

MAPS_DB = {
    "bind": {
        "id": "bind",
        "name": "Bind",
        "dimensions": {"width": 1024, "height": 1024},
        "sites": [
            {"name": "A", "x": 200, "y": 200, "type": "bombsite"},
            {"name": "B", "x": 800, "y": 800, "type": "bombsite"},
        ],
        "callouts": [
            {"name": "Hookah", "region": "A"},
            {"name": "Showers", "region": "A"},
            {"name": "B Short", "region": "B"},
            {"name": "B Long", "region": "B"},
        ],
        "spawns": {
            "attack": [{"x": 100, "y": 500}],
            "defend": [{"x": 900, "y": 500}],
        },
        "chokepoints": [
            {"x": 500, "y": 500, "name": "Mid", "width": 100},
        ],
    },
    "haven": {
        "id": "haven",
        "name": "Haven",
        "dimensions": {"width": 1280, "height": 1280},
        "sites": [
            {"name": "A", "x": 200, "y": 200, "type": "bombsite"},
            {"name": "B", "x": 640, "y": 640, "type": "bombsite"},
            {"name": "C", "x": 1080, "y": 1080, "type": "bombsite"},
        ],
        "callouts": [
            {"name": "A Long", "region": "A"},
            {"name": "C Long", "region": "C"},
            {"name": "Mid", "region": "center"},
        ],
        "spawns": {
            "attack": [{"x": 100, "y": 640}],
            "defend": [{"x": 1180, "y": 640}],
        },
        "chokepoints": [
            {"x": 640, "y": 400, "name": "Mid Window", "width": 80},
            {"x": 640, "y": 900, "name": "C Link", "width": 120},
        ],
    },
    "ascent": {
        "id": "ascent",
        "name": "Ascent",
        "dimensions": {"width": 1024, "height": 1024},
        "sites": [
            {"name": "A", "x": 200, "y": 200, "type": "bombsite"},
            {"name": "B", "x": 800, "y": 800, "type": "bombsite"},
        ],
        "callouts": [
            {"name": "A Main", "region": "A"},
            {"name": "B Main", "region": "B"},
            {"name": "Market", "region": "mid"},
        ],
        "spawns": {
            "attack": [{"x": 100, "y": 500}],
            "defend": [{"x": 900, "y": 500}],
        },
        "chokepoints": [
            {"x": 500, "y": 300, "name": "A Site Entry", "width": 150},
        ],
    },
}


# ============================================================================
# API Routes
# ============================================================================

@router.get("", response_model=List[MapMetadata])
async def list_maps() -> List[MapMetadata]:
    """
    List all available maps.
    
    Returns metadata for all maps including dimensions, sites, and callouts.
    """
    try:
        return [
            MapMetadata(
                id=m["id"],
                name=m["name"],
                dimensions=m["dimensions"],
                sites=m["sites"],
                callouts=m["callouts"],
            )
            for m in MAPS_DB.values()
        ]
    except Exception as e:
        logger.error(f"Failed to list maps: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve map list"
        )


@router.get("/{map_id}", response_model=MapMetadata)
async def get_map(map_id: str) -> MapMetadata:
    """
    Get metadata for a specific map.
    
    Args:
        map_id: The map identifier (e.g., 'bind', 'haven', 'ascent')
    
    Raises:
        HTTPException: If map not found (404)
    """
    if map_id not in MAPS_DB:
        logger.warning(f"Map not found: {map_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Map '{map_id}' not found"
        )
    
    try:
        m = MAPS_DB[map_id]
        return MapMetadata(
            id=m["id"],
            name=m["name"],
            dimensions=m["dimensions"],
            sites=m["sites"],
            callouts=m["callouts"],
        )
    except Exception as e:
        logger.error(f"Failed to get map {map_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve map data"
        )


@router.get("/{map_id}/grid", response_model=MapGridData)
async def get_map_grid(map_id: str) -> MapGridData:
    """
    Get grid data for a specific map.
    
    This includes:
    - Site locations
    - Spawn points
    - Choke points
    - Collision data (if available)
    
    Args:
        map_id: The map identifier
    
    Raises:
        HTTPException: If map not found (404)
    """
    if map_id not in MAPS_DB:
        logger.warning(f"Map grid requested for unknown map: {map_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Map '{map_id}' not found"
        )
    
    try:
        m = MAPS_DB[map_id]
        return MapGridData(
            map_id=map_id,
            dimensions=m["dimensions"],
            grid_resolution=64,
            sites=m["sites"],
            spawns=m["spawns"],
            chokepoints=m["chokepoints"],
            textures={},  # Would be populated from storage
        )
    except Exception as e:
        logger.error(f"Failed to get grid for map {map_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve grid data"
        )


@router.post("/{map_id}/lens-data", response_model=LensDataResponse)
async def get_lens_data(map_id: str, request: LensDataRequest) -> LensDataResponse:
    """
    Get lens overlay data for a map.
    
    Available lens types:
    - tension: Player pressure heatmap
    - ripple: Time-based influence waves
    - blood: Elimination locations
    - wind: Movement flow patterns
    - doors: Entry point analysis
    - secured: Controlled area visualization
    
    Args:
        map_id: The map identifier
        request: Lens types and optional region filter
    
    Raises:
        HTTPException: If map not found (404) or invalid lens types (400)
    """
    if map_id not in MAPS_DB:
        logger.warning(f"Lens data requested for unknown map: {map_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Map '{map_id}' not found"
        )
    
    # Validate lens types
    valid_lenses = {lt.value for lt in LensType}
    invalid_lenses = set(request.lens_types) - valid_lenses
    if invalid_lenses:
        logger.warning(f"Invalid lens types requested: {invalid_lenses}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid lens types: {invalid_lenses}. Valid types: {valid_lenses}"
        )
    
    try:
        # Generate lens data
        lens_data = {}
        for lens_type in request.lens_types:
            generator = LENS_GENERATORS.get(lens_type)
            if generator:
                lens_data[lens_type] = generator(map_id)
        
        return LensDataResponse(
            map_id=map_id,
            lens_types=request.lens_types,
            lens_data=lens_data,
            timestamp=datetime.now(timezone.utc),
            update_interval=1000,
        )
    except Exception as e:
        logger.error(f"Failed to generate lens data for {map_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate lens data"
        )


@router.post("/pathfind", response_model=PathResponse)
async def find_path(request: PathRequest) -> PathResponse:
    """
    Find path between two points on a map.
    
    Uses A* pathfinding algorithm considering:
    - Map collision data
    - Choke point avoidance (optional)
    - Team-specific routes
    
    Args:
        request: Start/end coordinates and options
    
    Returns:
        Path with distance and estimated time
    
    Raises:
        HTTPException: If map not found (404)
    """
    if request.map_id not in MAPS_DB:
        logger.warning(f"Pathfinding requested for unknown map: {request.map_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Map '{request.map_id}' not found"
        )
    
    try:
        # Validate coordinates
        if not all(k in request.start for k in ('x', 'y')):
            raise ValueError("Start coordinates must include 'x' and 'y'")
        if not all(k in request.end for k in ('x', 'y')):
            raise ValueError("End coordinates must include 'x' and 'y'")
        
        dx = request.end["x"] - request.start["x"]
        dy = request.end["y"] - request.start["y"]
        distance = (dx ** 2 + dy ** 2) ** 0.5
        
        # Generate path with waypoints
        steps = max(3, int(distance / 50))
        path = []
        for i in range(steps):
            t = i / (steps - 1)
            path.append({
                "x": request.start["x"] + dx * t,
                "y": request.start["y"] + dy * t,
            })
        
        # Determine difficulty
        if distance < 200:
            difficulty = "easy"
        elif distance < 500:
            difficulty = "medium"
        else:
            difficulty = "hard"
        
        return PathResponse(
            path=path,
            distance=distance,
            estimated_time=distance / 200,  # ~200 units/sec movement speed
            difficulty=difficulty,
        )
    except ValueError as e:
        logger.warning(f"Invalid pathfinding request: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Pathfinding failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pathfinding calculation failed"
        )


# ============================================================================
# WebSocket for Real-time Updates
# ============================================================================

class ConnectionManager:
    """
    Manage WebSocket connections for real-time lens updates.
    
    Handles:
    - Client connections/disconnections
    - Map-based subscriptions
    - Broadcast messaging
    - Connection cleanup
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: dict[str, set] = {}  # map_id -> set of websockets
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.debug(f"WebSocket client connected: {websocket.client}")
    
    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection and clean up subscriptions."""
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            # Remove from all subscriptions
            for subs in self.subscriptions.values():
                subs.discard(websocket)
        logger.debug(f"WebSocket client disconnected: {getattr(websocket, 'client', 'unknown')}")
    
    async def subscribe(self, websocket: WebSocket, map_id: str, lens_types: List[str]):
        """Subscribe a WebSocket to updates for a specific map."""
        async with self._lock:
            if map_id not in self.subscriptions:
                self.subscriptions[map_id] = set()
            self.subscriptions[map_id].add(websocket)
        
        # Store subscription details on websocket object
        websocket.map_subscription = map_id
        websocket.lens_types = lens_types
        logger.info(f"Client subscribed to {map_id} with lenses: {lens_types}")
    
    async def broadcast_to_map(self, map_id: str, message: dict):
        """Broadcast a message to all subscribers of a map."""
        if map_id not in self.subscriptions:
            return
        
        disconnected = []
        async with self._lock:
            connections = list(self.subscriptions[map_id])
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.debug(f"Failed to send to WebSocket: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                for conn in disconnected:
                    self.subscriptions[map_id].discard(conn)
                    if conn in self.active_connections:
                        self.active_connections.remove(conn)


# Global connection manager instance
manager = ConnectionManager()


async def handle_lens_websocket(websocket: WebSocket):
    """
    Handle WebSocket connections for lens updates.
    
    This function should be mounted at the app level (not router level)
    to avoid path prefixing issues.
    
    Protocol:
    1. Client connects
    2. Client sends: {"action": "subscribe", "map_id": "bind", "lens_types": ["tension"]}
    3. Server responds: {"type": "subscribed", "map_id": "bind", "lens_types": ["tension"]}
    4. Server sends periodic: {"type": "lens_update", "map_id": "bind", "data": {...}}
    5. Client can send: {"action": "ping"} -> Server responds: {"type": "pong"}
    6. Client disconnects
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_json()
            except Exception as e:
                logger.warning(f"Failed to parse WebSocket message: {e}")
                continue
            
            action = data.get("action")
            
            if action == "subscribe":
                map_id = data.get("map_id")
                lens_types = data.get("lens_types", ["tension"])
                
                if not map_id:
                    await websocket.send_json({
                        "type": "error",
                        "message": "map_id is required"
                    })
                    continue
                
                if map_id not in MAPS_DB:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Map '{map_id}' not found"
                    })
                    continue
                
                await manager.subscribe(websocket, map_id, lens_types)
                
                # Send initial data
                await websocket.send_json({
                    "type": "subscribed",
                    "map_id": map_id,
                    "lens_types": lens_types,
                })
                
                # Send initial lens data
                for lens_type in lens_types:
                    generator = LENS_GENERATORS.get(lens_type)
                    if generator:
                        await websocket.send_json({
                            "type": "lens_update",
                            "map_id": map_id,
                            "lens_type": lens_type,
                            "data": generator(map_id),
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
            
            elif action == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif action == "unsubscribe":
                map_id = data.get("map_id")
                if map_id and map_id in manager.subscriptions:
                    manager.subscriptions[map_id].discard(websocket)
                    await websocket.send_json({
                        "type": "unsubscribed",
                        "map_id": map_id
                    })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown action: {action}"
                })
                
    except WebSocketDisconnect:
        logger.debug("WebSocket client disconnected")
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket)


# Background task for real-time updates
async def simulate_lens_updates():
    """
    Simulate real-time lens data updates.
    
    This should be started as a background task in the FastAPI lifespan.
    """
    logger.info("Starting lens update simulation task")
    while True:
        try:
            await asyncio.sleep(1)  # Update every second
            
            for map_id in MAPS_DB.keys():
                if map_id in manager.subscriptions and manager.subscriptions[map_id]:
                    update = {
                        "type": "lens_update",
                        "map_id": map_id,
                        "lens_type": "tension",
                        "data": generate_tension_data(map_id),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    await manager.broadcast_to_map(map_id, update)
        except Exception as e:
            logger.error(f"Error in lens update simulation: {e}")
            await asyncio.sleep(5)  # Wait before retrying


# ============================================================================
# Lens Data Generators
# ============================================================================

def generate_tension_data(map_id: str) -> dict:
    """Generate mock tension heatmap data."""
    m = MAPS_DB[map_id]
    return {
        "grid_size": 16,
        "values": [[hash(f"{map_id}_{x}_{y}_{int(time.time())}") % 100 / 100 
                   for x in range(16)] for y in range(16)],
        "max_value": 1.0,
        "hotspots": [
            {"x": s["x"], "y": s["y"], "intensity": 0.9}
            for s in m["sites"]
        ],
    }


def generate_ripple_data(map_id: str) -> dict:
    """Generate mock ripple wave data."""
    t = time.time()
    m = MAPS_DB[map_id]
    return {
        "wave_origin": {
            "x": m["dimensions"]["width"] / 2,
            "y": m["dimensions"]["height"] / 2
        },
        "wave_radius": (t * 50) % 500,
        "wave_intensity": 0.7,
        "frequency": 2.0,
    }


def generate_blood_data(map_id: str) -> dict:
    """Generate mock elimination location data."""
    m = MAPS_DB[map_id]
    eliminations = []
    for site in m["sites"]:
        for i in range(3):
            eliminations.append({
                "x": site["x"] + (hash(f"{map_id}_blood_{i}_{int(time.time())}") % 100 - 50),
                "y": site["y"] + (hash(f"{map_id}_blood_{i+100}_{int(time.time())}") % 100 - 50),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "weapon": "vandal" if i % 2 == 0 else "phantom",
            })
    return {"eliminations": eliminations, "total": len(eliminations)}


def generate_wind_data(map_id: str) -> dict:
    """Generate mock movement flow data."""
    m = MAPS_DB[map_id]
    vectors = []
    for i in range(10):
        x = (i / 10) * m["dimensions"]["width"]
        y = m["dimensions"]["height"] / 2
        vectors.append({
            "x": x,
            "y": y,
            "dx": 50,
            "dy": (hash(f"{map_id}_wind_{i}_{int(time.time())}") % 40) - 20,
            "strength": 0.5 + (hash(f"{map_id}_wind_str_{i}_{int(time.time())}") % 50) / 100,
        })
    return {"vectors": vectors, "flow_rate": 5.0}


def generate_doors_data(map_id: str) -> dict:
    """Generate mock entry point analysis data."""
    m = MAPS_DB[map_id]
    return {
        "entry_points": [
            {
                "x": cp["x"],
                "y": cp["y"],
                "name": cp["name"],
                "entry_count": hash(f"{map_id}_door_{i}_{int(time.time())}") % 50,
                "success_rate": 0.3 + (hash(f"{map_id}_door_rate_{i}_{int(time.time())}") % 50) / 100,
            }
            for i, cp in enumerate(m["chokepoints"])
        ],
        "total_entries": sum(hash(f"{map_id}_door_{i}_{int(time.time())}") % 50 
                            for i in range(len(m["chokepoints"]))),
    }


def generate_secured_data(map_id: str) -> dict:
    """Generate mock controlled area data."""
    m = MAPS_DB[map_id]
    return {
        "controlled_areas": [
            {
                "center": {"x": s["x"], "y": s["y"]},
                "radius": 100 + hash(f"{map_id}_sec_{i}_{int(time.time())}") % 100,
                "team": "attack" if hash(f"{map_id}_sec_team_{i}_{int(time.time())}") % 2 == 0 else "defend",
                "confidence": 0.7 + (hash(f"{map_id}_sec_conf_{i}_{int(time.time())}") % 30) / 100,
            }
            for i, s in enumerate(m["sites"])
        ],
        "control_percentage": {
            "attack": 45,
            "defend": 55,
        },
    }


# Lens generator registry
LENS_GENERATORS = {
    "tension": generate_tension_data,
    "ripple": generate_ripple_data,
    "blood": generate_blood_data,
    "wind": generate_wind_data,
    "doors": generate_doors_data,
    "secured": generate_secured_data,
}
