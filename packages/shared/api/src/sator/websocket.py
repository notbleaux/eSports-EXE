[Ver001.000]
"""
SATOR WebSocket Handler
======================
Real-time updates for SATOR hub via WebSocket.
"""

import logging
import json
from datetime import datetime
from typing import Dict, Set, Optional

from fastapi import WebSocket, WebSocketDisconnect

from .models import WSMessage, WSMatchUpdate, WSPlayerUpdate, WSSubscription

logger = logging.getLogger(__name__)


class SatorWebSocketManager:
    """
    Manages WebSocket connections for SATOR live updates.
    
    Features:
    - Connection pooling
    - Channel-based subscriptions
    - Broadcast to specific channels or all clients
    """
    
    def __init__(self):
        # Active connections
        self.active_connections: Set[WebSocket] = set()
        
        # Subscriptions: channel -> set of connections
        self.subscriptions: Dict[str, Set[WebSocket]] = {
            "matches": set(),
            "players": set(),
            "teams": set(),
            "all": set(),  # Subscribe to everything
        }
        
        # Connection metadata
        self.connection_info: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_info[websocket] = {
            "client_id": client_id or f"anon_{id(websocket)}",
            "connected_at": datetime.utcnow(),
            "subscriptions": set(),
        }
        
        logger.info(f"WebSocket connected: {self.connection_info[websocket]['client_id']}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connected",
            "message": "Connected to SATOR live updates",
            "timestamp": datetime.utcnow().isoformat(),
            "channels": list(self.subscriptions.keys()),
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection."""
        # Remove from all subscriptions
        for channel in self.subscriptions.values():
            channel.discard(websocket)
        
        # Remove from active connections
        self.active_connections.discard(websocket)
        
        info = self.connection_info.pop(websocket, {})
        client_id = info.get("client_id", "unknown")
        logger.info(f"WebSocket disconnected: {client_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            await self.disconnect(websocket)
    
    async def broadcast(self, message: dict, channel: Optional[str] = None):
        """
        Broadcast message to all subscribed clients.
        
        Args:
            message: Message to broadcast
            channel: Specific channel or None for all connections
        """
        if channel and channel in self.subscriptions:
            targets = self.subscriptions[channel]
        else:
            targets = self.active_connections
        
        # Send to all targets
        disconnected = []
        for connection in targets:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            await self.disconnect(conn)
    
    async def handle_message(self, websocket: WebSocket, data: str):
        """Handle incoming WebSocket message."""
        try:
            message = json.loads(data)
            msg_type = message.get("type")
            
            if msg_type == "subscribe":
                await self._handle_subscribe(websocket, message)
            elif msg_type == "unsubscribe":
                await self._handle_unsubscribe(websocket, message)
            elif msg_type == "ping":
                await self._handle_ping(websocket)
            else:
                await self.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}",
                }, websocket)
        
        except json.JSONDecodeError:
            await self.send_personal_message({
                "type": "error",
                "message": "Invalid JSON",
            }, websocket)
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send_personal_message({
                "type": "error",
                "message": "Internal error",
            }, websocket)
    
    async def _handle_subscribe(self, websocket: WebSocket, message: dict):
        """Handle subscription request."""
        channel = message.get("channel", "all")
        
        if channel not in self.subscriptions:
            await self.send_personal_message({
                "type": "error",
                "message": f"Unknown channel: {channel}",
                "available_channels": list(self.subscriptions.keys()),
            }, websocket)
            return
        
        # Add to channel
        self.subscriptions[channel].add(websocket)
        
        # Track in connection info
        if websocket in self.connection_info:
            self.connection_info[websocket]["subscriptions"].add(channel)
        
        await self.send_personal_message({
            "type": "subscribed",
            "channel": channel,
            "message": f"Subscribed to {channel} updates",
        }, websocket)
        
        logger.debug(f"Client subscribed to {channel}")
    
    async def _handle_unsubscribe(self, websocket: WebSocket, message: dict):
        """Handle unsubscription request."""
        channel = message.get("channel", "all")
        
        if channel in self.subscriptions:
            self.subscriptions[channel].discard(websocket)
        
        if websocket in self.connection_info:
            self.connection_info[websocket]["subscriptions"].discard(channel)
        
        await self.send_personal_message({
            "type": "unsubscribed",
            "channel": channel,
            "message": f"Unsubscribed from {channel}",
        }, websocket)
    
    async def _handle_ping(self, websocket: WebSocket):
        """Handle ping message."""
        await self.send_personal_message({
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat(),
        }, websocket)
    
    # ========== Broadcast Helpers ==========
    
    async def broadcast_match_update(self, match_id: str, data: dict):
        """Broadcast match update to subscribed clients."""
        message = {
            "type": "match_update",
            "match_id": match_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast(message, channel="matches")
    
    async def broadcast_player_update(self, player_id: str, data: dict):
        """Broadcast player update to subscribed clients."""
        message = {
            "type": "player_update",
            "player_id": player_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast(message, channel="players")
    
    async def broadcast_system_message(self, message: str, level: str = "info"):
        """Broadcast system message to all clients."""
        msg = {
            "type": "system",
            "level": level,  # info, warning, error
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        await self.broadcast(msg)
    
    def get_stats(self) -> dict:
        """Get WebSocket connection statistics."""
        return {
            "total_connections": len(self.active_connections),
            "subscriptions": {
                channel: len(connections)
                for channel, connections in self.subscriptions.items()
            },
        }


# Global WebSocket manager instance
ws_manager = SatorWebSocketManager()


async def handle_websocket(websocket: WebSocket, client_id: Optional[str] = None):
    """
    Main WebSocket handler function.
    
    Usage in FastAPI:
        @app.websocket("/ws/sator")
        async def websocket_endpoint(websocket: WebSocket):
            await handle_websocket(websocket)
    """
    await ws_manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            
            # Handle message
            await ws_manager.handle_message(websocket, data)
    
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
