"""
WebSocket routes for real-time updates.

This module provides WebSocket endpoints for:
- Live match events
- Real-time dashboard updates
- Server-sent events for analytics
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from typing import Optional, Dict, Set
import json
import asyncio
import logging
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/ws", tags=["websocket"])

logger = logging.getLogger(__name__)


class ConnectionType(Enum):
    """Types of WebSocket connections."""
    LIVE_MATCH = "live_match"
    DASHBOARD = "dashboard"
    ANALYTICS = "analytics"
    GAME_EVENTS = "game_events"


class ConnectionManager:
    """Manages WebSocket connections with room-based broadcasting."""
    
    def __init__(self):
        # Active connections by type
        self.connections: Dict[ConnectionType, Dict[str, Set[WebSocket]]] = {
            ConnectionType.LIVE_MATCH: {},
            ConnectionType.DASHBOARD: {},
            ConnectionType.ANALYTICS: {},
            ConnectionType.GAME_EVENTS: {}
        }
        # Connection metadata
        self.connection_info: Dict[WebSocket, Dict] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        conn_type: ConnectionType,
        room: str
    ) -> bool:
        """
        Accept WebSocket connection and add to room.
        
        Args:
            websocket: The WebSocket connection
            conn_type: Type of connection
            room: Room/channel identifier
            
        Returns:
            True if connection successful
        """
        try:
            await websocket.accept()
            
            # Initialize room if needed
            if room not in self.connections[conn_type]:
                self.connections[conn_type][room] = set()
            
            self.connections[conn_type][room].add(websocket)
            self.connection_info[websocket] = {
                "type": conn_type,
                "room": room,
                "connected_at": datetime.utcnow().isoformat(),
                "messages_sent": 0,
                "messages_received": 0
            }
            
            logger.info(f"WebSocket connected: {conn_type.value}/{room}")
            return True
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            return False
    
    def disconnect(self, websocket: WebSocket, conn_type: ConnectionType, room: str):
        """Remove WebSocket connection."""
        try:
            self.connections[conn_type][room].discard(websocket)
            
            # Clean up empty rooms
            if not self.connections[conn_type][room]:
                del self.connections[conn_type][room]
            
            if websocket in self.connection_info:
                info = self.connection_info.pop(websocket)
                logger.info(
                    f"WebSocket disconnected: {conn_type.value}/{room}, "
                    f"duration={info.get('messages_sent', 0)} msgs"
                )
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")
    
    async def broadcast_to_room(
        self,
        conn_type: ConnectionType,
        room: str,
        message: dict
    ) -> int:
        """
        Broadcast message to all connections in a room.
        
        Returns:
            Number of connections messaged
        """
        if room not in self.connections[conn_type]:
            return 0
        
        disconnected = set()
        message_json = json.dumps(message)
        
        for connection in self.connections[conn_type][room]:
            try:
                await connection.send_text(message_json)
                if connection in self.connection_info:
                    self.connection_info[connection]["messages_sent"] += 1
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.disconnect(conn, conn_type, room)
        
        return len(self.connections[conn_type][room]) - len(disconnected)
    
    async def send_to_connection(self, websocket: WebSocket, message: dict):
        """Send message to specific connection."""
        try:
            await websocket.send_text(json.dumps(message))
            if websocket in self.connection_info:
                self.connection_info[websocket]["messages_sent"] += 1
        except Exception as e:
            logger.error(f"Error sending direct message: {e}")
    
    def get_stats(self) -> dict:
        """Get connection statistics."""
        stats = {}
        for conn_type, rooms in self.connections.items():
            total_connections = sum(len(conns) for conns in rooms.values())
            total_rooms = len(rooms)
            stats[conn_type.value] = {
                "connections": total_connections,
                "rooms": total_rooms
            }
        return stats


# Global connection manager
manager = ConnectionManager()


# =============================================================================
# WebSocket Endpoints
# =============================================================================

@router.websocket("/live/{match_id}")
async def websocket_live_match(websocket: WebSocket, match_id: str):
    """
    WebSocket for live match events.
    
    Receives real-time events:
    - Kills, deaths, assists
    - Round wins/losses
    - Economy changes
    - Spike plant/defuse
    """
    if not await manager.connect(websocket, ConnectionType.LIVE_MATCH, match_id):
        return
    
    try:
        # Send initial connection confirmation
        await manager.send_to_connection(websocket, {
            "type": "connection",
            "status": "connected",
            "match_id": match_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Handle incoming messages (subscriptions, control)
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                
                message = json.loads(data)
                action = message.get("action")
                
                if action == "ping":
                    await manager.send_to_connection(websocket, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                elif action == "subscribe":
                    # Handle subscription to specific event types
                    event_types = message.get("events", [])
                    await manager.send_to_connection(websocket, {
                        "type": "subscription",
                        "events": event_types,
                        "status": "subscribed"
                    })
                
            except asyncio.TimeoutError:
                # Send heartbeat
                await manager.send_to_connection(websocket, {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
    except WebSocketDisconnect:
        logger.info(f"Live match WebSocket disconnected: {match_id}")
    except Exception as e:
        logger.error(f"Live match WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, ConnectionType.LIVE_MATCH, match_id)


@router.websocket("/dashboard/{dashboard_id}")
async def websocket_dashboard(websocket: WebSocket, dashboard_id: str = "default"):
    """
    WebSocket for dashboard real-time updates.
    
    Receives:
    - Collection progress updates
    - Data freshness changes
    - System health updates
    - Alert notifications
    """
    if not await manager.connect(websocket, ConnectionType.DASHBOARD, dashboard_id):
        return
    
    try:
        await manager.send_to_connection(websocket, {
            "type": "connection",
            "status": "connected",
            "dashboard_id": dashboard_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0  # Longer timeout for dashboards
                )
                
                message = json.loads(data)
                action = message.get("action")
                
                if action == "ping":
                    await manager.send_to_connection(websocket, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
            except asyncio.TimeoutError:
                await manager.send_to_connection(websocket, {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
    except WebSocketDisconnect:
        logger.info(f"Dashboard WebSocket disconnected: {dashboard_id}")
    except Exception as e:
        logger.error(f"Dashboard WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, ConnectionType.DASHBOARD, dashboard_id)


@router.websocket("/analytics/{channel}")
async def websocket_analytics(websocket: WebSocket, channel: str = "general"):
    """
    WebSocket for real-time analytics data.
    
    Receives:
    - Live calculations (SimRating updates)
    - Ranking changes
    - Market movement alerts
    """
    if not await manager.connect(websocket, ConnectionType.ANALYTICS, channel):
        return
    
    try:
        await manager.send_to_connection(websocket, {
            "type": "connection",
            "status": "connected",
            "channel": channel,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        while True:
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=60.0
                )
                
                message = json.loads(data)
                
                if message.get("action") == "ping":
                    await manager.send_to_connection(websocket, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
            except asyncio.TimeoutError:
                await manager.send_to_connection(websocket, {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
    except WebSocketDisconnect:
        logger.info(f"Analytics WebSocket disconnected: {channel}")
    except Exception as e:
        logger.error(f"Analytics WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, ConnectionType.ANALYTICS, channel)


@router.websocket("/game-events")
async def websocket_game_events(websocket: WebSocket):
    """
    WebSocket for game simulation events.
    
    Used by RadiantX to stream:
    - Match start/end
    - Round events
    - Player actions
    - SATOR Square spatial data
    """
    room = "global"
    
    if not await manager.connect(websocket, ConnectionType.GAME_EVENTS, room):
        return
    
    try:
        await manager.send_to_connection(websocket, {
            "type": "connection",
            "status": "connected",
            "room": "global",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Echo back for confirmation
            await manager.send_to_connection(websocket, {
                "type": "ack",
                "received": message.get("id"),
                "timestamp": datetime.utcnow().isoformat()
            })
            
    except WebSocketDisconnect:
        logger.info("Game events WebSocket disconnected")
    except Exception as e:
        logger.error(f"Game events WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, ConnectionType.GAME_EVENTS, room)


# =============================================================================
# HTTP Endpoints for WebSocket Management
# =============================================================================

@router.get("/stats")
async def get_websocket_stats():
    """Get current WebSocket connection statistics."""
    return {
        "status": "success",
        "connections": manager.get_stats(),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/broadcast/{room}")
async def broadcast_to_room(
    room: str,
    message: dict,
    conn_type: str = "live_match"
):
    """
    Broadcast a message to all connections in a room.
    
    This is primarily for internal use by other services
    to push updates to connected clients.
    """
    try:
        conn_type_enum = ConnectionType(conn_type)
    except ValueError:
        return {
            "status": "error",
            "message": f"Invalid connection type: {conn_type}"
        }
    
    count = await manager.broadcast_to_room(conn_type_enum, room, message)
    
    return {
        "status": "success",
        "connections_notified": count,
        "room": room,
        "type": conn_type
    }


# =============================================================================
# Helper Functions for External Use
# =============================================================================

async def broadcast_match_event(match_id: str, event: dict):
    """Broadcast a live match event to all connected clients."""
    await manager.broadcast_to_room(
        ConnectionType.LIVE_MATCH,
        match_id,
        {
            "type": "match_event",
            "match_id": match_id,
            "event": event,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


async def broadcast_dashboard_update(dashboard_id: str, update: dict):
    """Broadcast a dashboard update."""
    await manager.broadcast_to_room(
        ConnectionType.DASHBOARD,
        dashboard_id,
        {
            "type": "dashboard_update",
            "dashboard_id": dashboard_id,
            "data": update,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


async def broadcast_analytics_update(channel: str, data: dict):
    """Broadcast an analytics update."""
    await manager.broadcast_to_room(
        ConnectionType.ANALYTICS,
        channel,
        {
            "type": "analytics_update",
            "channel": channel,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
