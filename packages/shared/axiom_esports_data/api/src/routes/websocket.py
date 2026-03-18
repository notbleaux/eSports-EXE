"""
Unified WebSocket Server for Real-time Updates

This module provides a unified WebSocket server with:
- Connection management with room/subscription system
- Support for multiple event types (match_updates, player_stats_updates, analytics_updates, system_notifications)
- Token-based authentication
- Message protocol standardization

[Ver002.000] - Unified WebSocket layer with room support and authentication
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from typing import Optional, Dict, Set, List, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import json
import asyncio
import logging
import secrets
import time
from contextlib import asynccontextmanager

router = APIRouter(prefix="/v1/ws", tags=["websocket"])

logger = logging.getLogger(__name__)


# =============================================================================
# Message Protocol Definitions
# =============================================================================

class MessageType(str, Enum):
    """Server to client message types."""
    CONNECTION = "connection"
    MATCH_UPDATE = "match_update"
    PLAYER_STATS_UPDATE = "player_stats_update"
    ANALYTICS_UPDATE = "analytics_update"
    SYSTEM_NOTIFICATION = "system_notification"
    SUBSCRIPTION_CONFIRMED = "subscription_confirmed"
    UNSUBSCRIPTION_CONFIRMED = "unsubscription_confirmed"
    ERROR = "error"
    HEARTBEAT = "heartbeat"
    PONG = "pong"


class ClientAction(str, Enum):
    """Client to server actions."""
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    PING = "ping"
    AUTHENTICATE = "authenticate"


class ChannelType(str, Enum):
    """Available channel types for subscriptions."""
    MATCH = "match"
    PLAYER = "player"
    ANALYTICS = "analytics"
    SYSTEM = "system"
    TOURNAMENT = "tournament"


@dataclass
class WebSocketMessage:
    """Standard WebSocket message format."""
    type: str
    channel: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "type": self.type,
            "timestamp": self.timestamp,
            **self.data
        }
        if self.channel:
            result["channel"] = self.channel
        if self.error:
            result["error"] = self.error
        return result


@dataclass
class ClientSubscription:
    """Client subscription information."""
    channel_type: ChannelType
    channel_id: str
    subscribed_at: datetime = field(default_factory=datetime.utcnow)
    filters: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def full_channel(self) -> str:
        return f"{self.channel_type.value}:{self.channel_id}"


# =============================================================================
# Authentication
# =============================================================================

class TokenValidator:
    """Token-based authentication validator."""
    
    def __init__(self):
        # In production, this would validate against a database or auth service
        # For now, we use a simple token cache with expiration
        self._valid_tokens: Dict[str, Dict[str, Any]] = {}
        self._token_expiry: Dict[str, float] = {}
    
    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate an authentication token.
        
        Returns user info if valid, None if invalid.
        """
        if not token:
            return None
        
        # Check token expiration
        if token in self._token_expiry:
            if time.time() > self._token_expiry[token]:
                del self._valid_tokens[token]
                del self._token_expiry[token]
                return None
        
        # In production, validate against auth service (JWT, etc.)
        # For development, accept any non-empty token with basic parsing
        try:
            # Simple JWT-like structure validation (header.payload.signature)
            parts = token.split('.')
            if len(parts) == 3:
                # Parse payload (base64)
                import base64
                payload = json.loads(base64.b64decode(parts[1] + '==').decode())
                return {
                    "user_id": payload.get("sub", "anonymous"),
                    "roles": payload.get("roles", ["viewer"]),
                    "token": token
                }
        except Exception:
            pass
        
        # Development fallback - accept any token
        return {
            "user_id": f"user_{token[:8]}",
            "roles": ["viewer"],
            "token": token
        }
    
    def generate_dev_token(self, user_id: str, roles: List[str] = None) -> str:
        """Generate a development token."""
        import base64
        
        header = base64.b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode()).decode().rstrip('=')
        payload = base64.b64encode(json.dumps({
            "sub": user_id,
            "roles": roles or ["viewer"],
            "iat": int(time.time()),
            "exp": int(time.time()) + 86400  # 24 hours
        }).encode()).decode().rstrip('=')
        
        token = f"{header}.{payload}.dev_signature"
        self._valid_tokens[token] = {"user_id": user_id, "roles": roles or ["viewer"]}
        self._token_expiry[token] = time.time() + 86400
        
        return token


# Global token validator
token_validator = TokenValidator()


# =============================================================================
# Connection Management
# =============================================================================

@dataclass
class ConnectionInfo:
    """Extended connection information."""
    websocket: WebSocket
    connection_id: str
    user_info: Optional[Dict[str, Any]] = None
    subscriptions: Dict[str, ClientSubscription] = field(default_factory=dict)
    connected_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: float = field(default_factory=time.time)
    is_authenticated: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def touch(self):
        """Update last activity timestamp."""
        self.last_activity = time.time()
    
    @property
    def connection_duration(self) -> float:
        """Get connection duration in seconds."""
        return (datetime.now(timezone.utc) - self.connected_at).total_seconds()


class UnifiedConnectionManager:
    """
    Unified WebSocket connection manager with room/subscription support.
    
    Features:
    - Connection pooling with metadata
    - Channel-based subscriptions
    - Authentication state management
    - Automatic cleanup of stale connections
    """
    
    def __init__(self):
        # All active connections by connection_id
        self.connections: Dict[str, ConnectionInfo] = {}
        
        # Channel subscriptions: channel -> set of connection_ids
        self.channels: Dict[str, Set[str]] = {}
        
        # WebSocket to connection_id mapping
        self.ws_to_id: Dict[WebSocket, str] = {}
        
        # Cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None
        self._cleanup_interval = 60.0  # seconds
        self._connection_timeout = 300.0  # 5 minutes
    
    async def start(self):
        """Start background tasks."""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Unified WebSocket manager started")
    
    async def stop(self):
        """Stop background tasks and close all connections."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        # Close all connections gracefully
        close_tasks = []
        for conn_info in list(self.connections.values()):
            close_tasks.append(self._close_connection(conn_info))
        
        if close_tasks:
            await asyncio.gather(*close_tasks, return_exceptions=True)
        
        self.connections.clear()
        self.channels.clear()
        self.ws_to_id.clear()
        logger.info("Unified WebSocket manager stopped")
    
    async def connect(
        self,
        websocket: WebSocket,
        token: Optional[str] = None
    ) -> ConnectionInfo:
        """
        Accept and register a new WebSocket connection.
        
        Args:
            websocket: The WebSocket connection
            token: Optional authentication token
            
        Returns:
            ConnectionInfo for the new connection
        """
        await websocket.accept()
        
        # Generate unique connection ID
        connection_id = secrets.token_hex(16)
        
        # Validate token if provided
        user_info = None
        is_authenticated = False
        if token:
            user_info = await token_validator.validate_token(token)
            is_authenticated = user_info is not None
        
        conn_info = ConnectionInfo(
            websocket=websocket,
            connection_id=connection_id,
            user_info=user_info,
            is_authenticated=is_authenticated,
            metadata={"user_agent": "unknown", "ip": "unknown"}
        )
        
        self.connections[connection_id] = conn_info
        self.ws_to_id[websocket] = connection_id
        
        logger.info(
            f"WebSocket connected: {connection_id}, "
            f"authenticated={is_authenticated}, "
            f"user={user_info.get('user_id') if user_info else 'anonymous'}"
        )
        
        return conn_info
    
    def disconnect(self, websocket: WebSocket) -> Optional[str]:
        """
        Remove a WebSocket connection.
        
        Returns:
            The connection_id if found, None otherwise
        """
        connection_id = self.ws_to_id.get(websocket)
        if not connection_id:
            return None
        
        conn_info = self.connections.get(connection_id)
        if conn_info:
            # Remove from all channels
            for channel in list(conn_info.subscriptions.keys()):
                self._unsubscribe_from_channel(connection_id, channel)
            
            # Remove connection
            del self.connections[connection_id]
        
        del self.ws_to_id[websocket]
        
        logger.info(f"WebSocket disconnected: {connection_id}")
        return connection_id
    
    async def authenticate(self, connection_id: str, token: str) -> bool:
        """
        Authenticate an existing connection.
        
        Returns:
            True if authentication successful
        """
        conn_info = self.connections.get(connection_id)
        if not conn_info:
            return False
        
        user_info = await token_validator.validate_token(token)
        if user_info:
            conn_info.user_info = user_info
            conn_info.is_authenticated = True
            conn_info.touch()
            logger.info(f"Connection {connection_id} authenticated as {user_info.get('user_id')}")
            return True
        
        return False
    
    def subscribe(
        self,
        connection_id: str,
        channel_type: ChannelType,
        channel_id: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Subscribe a connection to a channel.
        
        Args:
            connection_id: The connection ID
            channel_type: Type of channel
            channel_id: Channel identifier
            filters: Optional filter criteria
            
        Returns:
            Full channel name if successful, None if connection not found
        """
        conn_info = self.connections.get(connection_id)
        if not conn_info:
            return None
        
        full_channel = f"{channel_type.value}:{channel_id}"
        
        # Create subscription
        subscription = ClientSubscription(
            channel_type=channel_type,
            channel_id=channel_id,
            filters=filters or {}
        )
        
        conn_info.subscriptions[full_channel] = subscription
        conn_info.touch()
        
        # Add to channel
        if full_channel not in self.channels:
            self.channels[full_channel] = set()
        self.channels[full_channel].add(connection_id)
        
        logger.debug(f"Connection {connection_id} subscribed to {full_channel}")
        return full_channel
    
    def unsubscribe(self, connection_id: str, full_channel: str) -> bool:
        """
        Unsubscribe a connection from a channel.
        
        Returns:
            True if unsubscribed, False if not found
        """
        conn_info = self.connections.get(connection_id)
        if not conn_info:
            return False
        
        if full_channel in conn_info.subscriptions:
            del conn_info.subscriptions[full_channel]
            self._unsubscribe_from_channel(connection_id, full_channel)
            conn_info.touch()
            logger.debug(f"Connection {connection_id} unsubscribed from {full_channel}")
            return True
        
        return False
    
    def _unsubscribe_from_channel(self, connection_id: str, full_channel: str):
        """Internal method to remove connection from channel."""
        if full_channel in self.channels:
            self.channels[full_channel].discard(connection_id)
            if not self.channels[full_channel]:
                del self.channels[full_channel]
    
    async def send_to_connection(
        self,
        connection_id: str,
        message: WebSocketMessage
    ) -> bool:
        """
        Send a message to a specific connection.
        
        Returns:
            True if sent successfully
        """
        conn_info = self.connections.get(connection_id)
        if not conn_info:
            return False
        
        try:
            await conn_info.websocket.send_text(json.dumps(message.to_dict()))
            conn_info.touch()
            return True
        except Exception as e:
            logger.error(f"Error sending to {connection_id}: {e}")
            return False
    
    async def broadcast_to_channel(
        self,
        full_channel: str,
        message: WebSocketMessage,
        require_auth: bool = False
    ) -> int:
        """
        Broadcast a message to all connections in a channel.
        
        Args:
            full_channel: Full channel name (type:id)
            message: Message to broadcast
            require_auth: Only send to authenticated connections
            
        Returns:
            Number of connections that received the message
        """
        if full_channel not in self.channels:
            return 0
        
        connection_ids = self.channels[full_channel]
        if require_auth:
            connection_ids = {
                cid for cid in connection_ids
                if self.connections.get(cid) and self.connections[cid].is_authenticated
            }
        
        message_json = json.dumps(message.to_dict())
        disconnected = []
        sent_count = 0
        
        for connection_id in connection_ids:
            conn_info = self.connections.get(connection_id)
            if not conn_info:
                continue
            
            try:
                await conn_info.websocket.send_text(message_json)
                conn_info.touch()
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {e}")
                disconnected.append(connection_id)
        
        # Clean up disconnected
        for connection_id in disconnected:
            conn_info = self.connections.get(connection_id)
            if conn_info:
                self.disconnect(conn_info.websocket)
        
        return sent_count
    
    async def broadcast_to_all(
        self,
        message: WebSocketMessage,
        require_auth: bool = False
    ) -> int:
        """
        Broadcast a message to all connections.
        
        Returns:
            Number of connections that received the message
        """
        sent_count = 0
        disconnected = []
        message_json = json.dumps(message.to_dict())
        
        for connection_id, conn_info in list(self.connections.items()):
            if require_auth and not conn_info.is_authenticated:
                continue
            
            try:
                await conn_info.websocket.send_text(message_json)
                conn_info.touch()
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {e}")
                disconnected.append(connection_id)
        
        # Clean up disconnected
        for connection_id in disconnected:
            conn_info = self.connections.get(connection_id)
            if conn_info:
                self.disconnect(conn_info.websocket)
        
        return sent_count
    
    async def _close_connection(self, conn_info: ConnectionInfo):
        """Close a connection gracefully."""
        try:
            await conn_info.websocket.close()
        except Exception:
            pass
    
    async def _cleanup_loop(self):
        """Background task to clean up stale connections."""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                await self._cleanup_stale_connections()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _cleanup_stale_connections(self):
        """Remove connections that haven't had activity."""
        now = time.time()
        stale_connections = []
        
        for connection_id, conn_info in self.connections.items():
            if now - conn_info.last_activity > self._connection_timeout:
                stale_connections.append(connection_id)
        
        for connection_id in stale_connections:
            conn_info = self.connections.get(connection_id)
            if conn_info:
                logger.info(f"Closing stale connection: {connection_id}")
                await self._close_connection(conn_info)
                self.disconnect(conn_info.websocket)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        total_connections = len(self.connections)
        authenticated = sum(1 for c in self.connections.values() if c.is_authenticated)
        
        channel_stats = {}
        for channel, conn_ids in self.channels.items():
            channel_stats[channel] = len(conn_ids)
        
        return {
            "total_connections": total_connections,
            "authenticated_connections": authenticated,
            "anonymous_connections": total_connections - authenticated,
            "active_channels": len(self.channels),
            "channel_subscriptions": channel_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_connection_info(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific connection."""
        conn_info = self.connections.get(connection_id)
        if not conn_info:
            return None
        
        return {
            "connection_id": conn_info.connection_id,
            "is_authenticated": conn_info.is_authenticated,
            "user_id": conn_info.user_info.get("user_id") if conn_info.user_info else None,
            "subscriptions": list(conn_info.subscriptions.keys()),
            "connected_at": conn_info.connected_at.isoformat(),
            "connection_duration": conn_info.connection_duration,
            "last_activity": conn_info.last_activity
        }


# Global unified connection manager
manager = UnifiedConnectionManager()


# =============================================================================
# WebSocket Endpoints
# =============================================================================

@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="Authentication token")
):
    """
    Unified WebSocket endpoint with channel subscription support.
    
    Protocol:
    - Connect with optional ?token= query parameter
    - Subscribe to channels: {"action": "subscribe", "channel": "match:12345"}
    - Unsubscribe: {"action": "unsubscribe", "channel": "match:12345"}
    - Ping: {"action": "ping"}
    - Authenticate: {"action": "authenticate", "token": "jwt_token"}
    
    Messages are received in format:
    {
        "type": "match_update",
        "channel": "match:12345",
        "data": {...},
        "timestamp": "2026-03-15T10:00:00Z"
    }
    """
    conn_info = await manager.connect(websocket, token)
    
    try:
        # Send connection confirmation
        await manager.send_to_connection(
            conn_info.connection_id,
            WebSocketMessage(
                type=MessageType.CONNECTION,
                data={
                    "status": "connected",
                    "connection_id": conn_info.connection_id,
                    "authenticated": conn_info.is_authenticated,
                    "message": "Send {'action': 'subscribe', 'channel': 'type:id'} to subscribe to channels"
                }
            )
        )
        
        # Message handling loop
        while True:
            try:
                # Receive message with timeout for heartbeat
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0
                )
                
                # Parse message
                try:
                    message = json.loads(data)
                except json.JSONDecodeError:
                    await manager.send_to_connection(
                        conn_info.connection_id,
                        WebSocketMessage(
                            type=MessageType.ERROR,
                            error="Invalid JSON"
                        )
                    )
                    continue
                
                action = message.get("action")
                
                # Handle actions
                if action == ClientAction.PING:
                    await manager.send_to_connection(
                        conn_info.connection_id,
                        WebSocketMessage(type=MessageType.PONG)
                    )
                
                elif action == ClientAction.AUTHENTICATE:
                    auth_token = message.get("token")
                    if auth_token and await manager.authenticate(conn_info.connection_id, auth_token):
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.CONNECTION,
                                data={"status": "authenticated", "authenticated": True}
                            )
                        )
                    else:
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.ERROR,
                                error="Authentication failed"
                            )
                        )
                
                elif action == ClientAction.SUBSCRIBE:
                    channel = message.get("channel")
                    if not channel:
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.ERROR,
                                error="Channel required"
                            )
                        )
                        continue
                    
                    # Parse channel (format: "type:id")
                    channel_parts = channel.split(":", 1)
                    if len(channel_parts) != 2:
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.ERROR,
                                error="Invalid channel format. Use 'type:id'"
                            )
                        )
                        continue
                    
                    try:
                        channel_type = ChannelType(channel_parts[0])
                    except ValueError:
                        valid_types = [t.value for t in ChannelType]
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.ERROR,
                                error=f"Invalid channel type. Valid: {valid_types}"
                            )
                        )
                        continue
                    
                    channel_id = channel_parts[1]
                    filters = message.get("filters", {})
                    
                    full_channel = manager.subscribe(
                        conn_info.connection_id,
                        channel_type,
                        channel_id,
                        filters
                    )
                    
                    if full_channel:
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.SUBSCRIPTION_CONFIRMED,
                                channel=full_channel,
                                data={"filters": filters}
                            )
                        )
                    
                elif action == ClientAction.UNSUBSCRIBE:
                    channel = message.get("channel")
                    if channel and manager.unsubscribe(conn_info.connection_id, channel):
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.UNSUBSCRIPTION_CONFIRMED,
                                channel=channel
                            )
                        )
                    else:
                        await manager.send_to_connection(
                            conn_info.connection_id,
                            WebSocketMessage(
                                type=MessageType.ERROR,
                                error="Not subscribed to channel"
                            )
                        )
                
                else:
                    await manager.send_to_connection(
                        conn_info.connection_id,
                        WebSocketMessage(
                            type=MessageType.ERROR,
                            error=f"Unknown action: {action}"
                        )
                    )
                
            except asyncio.TimeoutError:
                # Send heartbeat
                await manager.send_to_connection(
                    conn_info.connection_id,
                    WebSocketMessage(type=MessageType.HEARTBEAT)
                )
                
    except WebSocketDisconnect:
        logger.debug(f"WebSocket disconnected: {conn_info.connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {conn_info.connection_id}: {e}")
    finally:
        manager.disconnect(websocket)


# Legacy endpoints for backward compatibility (deprecated)
@router.websocket("/live/{match_id}")
async def websocket_live_match_legacy(websocket: WebSocket, match_id: str):
    """Legacy endpoint - redirects to unified endpoint."""
    conn_info = await manager.connect(websocket)
    manager.subscribe(conn_info.connection_id, ChannelType.MATCH, match_id)
    
    try:
        await manager.send_to_connection(
            conn_info.connection_id,
            WebSocketMessage(
                type=MessageType.CONNECTION,
                channel=f"match:{match_id}",
                data={
                    "status": "connected",
                    "note": "This endpoint is deprecated. Use /v1/ws/ with subscription"
                }
            )
        )
        
        while True:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            message = json.loads(data)
            
            if message.get("action") == "ping":
                await manager.send_to_connection(
                    conn_info.connection_id,
                    WebSocketMessage(type=MessageType.PONG)
                )
                
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    finally:
        manager.disconnect(websocket)


# =============================================================================
# HTTP Endpoints for WebSocket Management
# =============================================================================

@router.get("/stats")
async def get_websocket_stats():
    """Get current WebSocket connection statistics."""
    return {
        "status": "success",
        "data": manager.get_stats()
    }


@router.get("/connections/{connection_id}")
async def get_connection_details(connection_id: str):
    """Get details for a specific connection."""
    info = manager.get_connection_info(connection_id)
    if not info:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    return {
        "status": "success",
        "data": info
    }


@router.post("/broadcast/{channel}")
async def broadcast_to_channel(channel: str, message: dict):
    """
    Broadcast a message to all connections in a channel.
    Internal use only - requires authentication in production.
    """
    ws_message = WebSocketMessage(
        type=message.get("type", "broadcast"),
        channel=channel,
        data=message.get("data", {})
    )
    
    count = await manager.broadcast_to_channel(channel, ws_message)
    
    return {
        "status": "success",
        "connections_notified": count,
        "channel": channel
    }


# =============================================================================
# Helper Functions for External Use
# =============================================================================

async def broadcast_match_update(match_id: str, update_data: dict):
    """Broadcast a match update to all subscribers."""
    await manager.broadcast_to_channel(
        f"match:{match_id}",
        WebSocketMessage(
            type=MessageType.MATCH_UPDATE,
            channel=f"match:{match_id}",
            data=update_data
        )
    )


async def broadcast_player_stats_update(player_id: str, stats_data: dict):
    """Broadcast a player stats update to all subscribers."""
    await manager.broadcast_to_channel(
        f"player:{player_id}",
        WebSocketMessage(
            type=MessageType.PLAYER_STATS_UPDATE,
            channel=f"player:{player_id}",
            data=stats_data
        )
    )


async def broadcast_analytics_update(channel_id: str, analytics_data: dict):
    """Broadcast an analytics update to all subscribers."""
    await manager.broadcast_to_channel(
        f"analytics:{channel_id}",
        WebSocketMessage(
            type=MessageType.ANALYTICS_UPDATE,
            channel=f"analytics:{channel_id}",
            data=analytics_data
        )
    )


async def broadcast_system_notification(notification: dict, require_auth: bool = False):
    """Broadcast a system notification to all connected clients."""
    await manager.broadcast_to_channel(
        "system:global",
        WebSocketMessage(
            type=MessageType.SYSTEM_NOTIFICATION,
            channel="system:global",
            data=notification
        ),
        require_auth=require_auth
    )


# Startup/shutdown events
@asynccontextmanager
async def websocket_lifespan(app):
    """Lifespan context manager for WebSocket manager."""
    await manager.start()
    yield
    await manager.stop()
