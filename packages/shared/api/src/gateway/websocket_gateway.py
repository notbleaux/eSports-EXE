"""
TENET WebSocket Gateway — Unified connection for data, chat, and live updates.

[Ver001.000]
Hybrid Gateway approach: Single /ws/gateway with multiplexed channels.
"""

import logging
import json
from typing import Dict, Set, Callable, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """WebSocket message types for multiplexing."""
    # Data updates
    DATA_UPDATE = "data_update"
    ODDS_UPDATE = "odds_update"
    MATCH_EVENT = "match_event"
    
    # Chat
    CHAT_MESSAGE = "chat_message"
    CHAT_HISTORY = "chat_history"
    USER_PRESENCE = "user_presence"
    
    # System
    AUTH = "auth"
    PING = "ping"
    PONG = "pong"
    ERROR = "error"
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"


class Channel(Enum):
    """Available channels for subscription."""
    GLOBAL = "global"
    MATCH_PREFIX = "match:"
    LOBBY_PREFIX = "lobby:"
    TEAM_PREFIX = "team:"
    HUB_PREFIX = "hub:"


@dataclass
class WSMessage:
    """Standard WebSocket message format."""
    type: str
    channel: str
    payload: dict
    timestamp: str
    sender_id: Optional[str] = None
    message_id: Optional[str] = None
    
    def to_json(self) -> str:
        return json.dumps(asdict(self), default=str)
    
    @classmethod
    def from_dict(cls, data: dict) -> "WSMessage":
        return cls(
            type=data.get("type", "unknown"),
            channel=data.get("channel", "global"),
            payload=data.get("payload", {}),
            timestamp=data.get("timestamp", datetime.utcnow().isoformat()),
            sender_id=data.get("sender_id"),
            message_id=data.get("message_id"),
        )


@dataclass
class ChatMessage:
    """Chat message structure."""
    id: str
    room_id: str
    user_id: str
    username: str
    content: str
    timestamp: datetime
    reply_to: Optional[str] = None
    reactions: Optional[Dict[str, int]] = None
    edited: bool = False
    
    def to_ws_message(self) -> WSMessage:
        return WSMessage(
            type=MessageType.CHAT_MESSAGE.value,
            channel=f"match:{self.room_id}",
            payload={
                "id": self.id,
                "user_id": self.user_id,
                "username": self.username,
                "content": self.content,
                "timestamp": self.timestamp.isoformat(),
                "reply_to": self.reply_to,
                "reactions": self.reactions or {},
                "edited": self.edited,
            },
            timestamp=datetime.utcnow().isoformat(),
            sender_id=self.user_id,
            message_id=self.id,
        )


class WebSocketGateway:
    """
    Unified WebSocket gateway for TENET platform.
    
    Features:
    - Single connection per client (/ws/gateway)
    - Multiplexed channels (match, lobby, team, hub)
    - Typed messages for routing
    - Presence tracking
    - Message persistence (last 500 per room)
    """
    
    def __init__(self):
        # Active connections: user_id -> WebSocket
        self.connections: Dict[str, WebSocket] = {}
        
        # Channel subscriptions: channel -> set of user_ids
        self.channels: Dict[str, Set[str]] = {}
        
        # Presence: user_id -> {channel, status, last_seen}
        self.presence: Dict[str, dict] = {}
        
        # Message history: channel -> list of messages (last 500)
        self.message_history: Dict[str, list] = {}
        
        # Message handlers by type
        self.handlers: Dict[str, Callable] = {
            MessageType.AUTH.value: self._handle_auth,
            MessageType.SUBSCRIBE.value: self._handle_subscribe,
            MessageType.UNSUBSCRIBE.value: self._handle_unsubscribe,
            MessageType.CHAT_MESSAGE.value: self._handle_chat_message,
            MessageType.PING.value: self._handle_ping,
        }
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Handle new WebSocket connection."""
        await websocket.accept()
        
        # Check if user already connected (kick old connection)
        if user_id in self.connections:
            old_ws = self.connections[user_id]
            try:
                await old_ws.close(code=1008, reason="New connection established")
            except:
                pass
        
        self.connections[user_id] = websocket
        self.presence[user_id] = {
            "status": "online",
            "channels": set(),
            "last_seen": datetime.utcnow(),
        }
        
        logger.info(f"User {user_id} connected. Total: {len(self.connections)}")
        
        # Send welcome message
        await self.send_to_user(user_id, WSMessage(
            type=MessageType.AUTH.value,
            channel="global",
            payload={"status": "connected", "user_id": user_id},
            timestamp=datetime.utcnow().isoformat(),
        ))
    
    async def disconnect(self, user_id: str):
        """Handle WebSocket disconnection."""
        # Remove from all channels
        if user_id in self.presence:
            for channel in list(self.presence[user_id]["channels"]):
                await self._unsubscribe(user_id, channel)
            del self.presence[user_id]
        
        # Remove connection
        if user_id in self.connections:
            del self.connections[user_id]
        
        logger.info(f"User {user_id} disconnected. Total: {len(self.connections)}")
    
    async def handle_message(self, user_id: str, data: str):
        """Route incoming message to appropriate handler."""
        try:
            parsed = json.loads(data)
            msg = WSMessage.from_dict(parsed)
            
            # Update last seen
            if user_id in self.presence:
                self.presence[user_id]["last_seen"] = datetime.utcnow()
            
            # Route to handler
            handler = self.handlers.get(msg.type)
            if handler:
                await handler(user_id, msg)
            else:
                logger.warning(f"No handler for message type: {msg.type}")
                await self.send_to_user(user_id, WSMessage(
                    type=MessageType.ERROR.value,
                    channel="global",
                    payload={"error": f"Unknown message type: {msg.type}"},
                    timestamp=datetime.utcnow().isoformat(),
                ))
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from {user_id}")
            await self.send_to_user(user_id, WSMessage(
                type=MessageType.ERROR.value,
                channel="global",
                payload={"error": "Invalid JSON"},
                timestamp=datetime.utcnow().isoformat(),
            ))
        except Exception as e:
            logger.error(f"Error handling message from {user_id}: {e}")
    
    async def _handle_auth(self, user_id: str, msg: WSMessage):
        """Handle authentication message."""
        # Auth already done at connection, confirm status
        await self.send_to_user(user_id, WSMessage(
            type=MessageType.AUTH.value,
            channel="global",
            payload={"status": "authenticated", "user_id": user_id},
            timestamp=datetime.utcnow().isoformat(),
        ))
    
    async def _handle_subscribe(self, user_id: str, msg: WSMessage):
        """Subscribe user to a channel."""
        channel = msg.payload.get("channel")
        if not channel:
            return
        
        await self._subscribe(user_id, channel)
        
        # Send channel history if available
        if channel in self.message_history:
            history = self.message_history[channel][-100:]  # Last 100
            await self.send_to_user(user_id, WSMessage(
                type=MessageType.CHAT_HISTORY.value,
                channel=channel,
                payload={"messages": history},
                timestamp=datetime.utcnow().isoformat(),
            ))
    
    async def _handle_unsubscribe(self, user_id: str, msg: WSMessage):
        """Unsubscribe user from a channel."""
        channel = msg.payload.get("channel")
        if channel:
            await self._unsubscribe(user_id, channel)
    
    async def _handle_chat_message(self, user_id: str, msg: WSMessage):
        """Handle chat message."""
        channel = msg.channel
        content = msg.payload.get("content", "")
        
        if not content or len(content) > 2000:
            await self.send_to_user(user_id, WSMessage(
                type=MessageType.ERROR.value,
                channel=channel,
                payload={"error": "Message too long or empty"},
                timestamp=datetime.utcnow().isoformat(),
            ))
            return
        
        # Create chat message
        chat_msg = ChatMessage(
            id=f"msg_{datetime.utcnow().timestamp()}_{user_id}",
            room_id=channel.replace("match:", "").replace("lobby:", ""),
            user_id=user_id,
            username=msg.payload.get("username", "Anonymous"),
            content=content,
            timestamp=datetime.utcnow(),
            reply_to=msg.payload.get("reply_to"),
        )
        
        # Store in history
        if channel not in self.message_history:
            self.message_history[channel] = []
        self.message_history[channel].append(asdict(chat_msg))
        
        # Trim history to last 500
        if len(self.message_history[channel]) > 500:
            self.message_history[channel] = self.message_history[channel][-500:]
        
        # Broadcast to channel
        await self.broadcast_to_channel(channel, chat_msg.to_ws_message())
    
    async def _handle_ping(self, user_id: str, msg: WSMessage):
        """Respond to ping with pong."""
        await self.send_to_user(user_id, WSMessage(
            type=MessageType.PONG.value,
            channel="global",
            payload={},
            timestamp=datetime.utcnow().isoformat(),
        ))
    
    async def _subscribe(self, user_id: str, channel: str):
        """Add user to channel."""
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(user_id)
        
        if user_id in self.presence:
            self.presence[user_id]["channels"].add(channel)
        
        logger.debug(f"User {user_id} subscribed to {channel}")
    
    async def _unsubscribe(self, user_id: str, channel: str):
        """Remove user from channel."""
        if channel in self.channels:
            self.channels[channel].discard(user_id)
            if not self.channels[channel]:
                del self.channels[channel]
        
        if user_id in self.presence:
            self.presence[user_id]["channels"].discard(channel)
        
        logger.debug(f"User {user_id} unsubscribed from {channel}")
    
    async def send_to_user(self, user_id: str, message: WSMessage):
        """Send message to specific user."""
        if user_id in self.connections:
            try:
                await self.connections[user_id].send_text(message.to_json())
            except Exception as e:
                logger.error(f"Failed to send to {user_id}: {e}")
    
    async def broadcast_to_channel(self, channel: str, message: WSMessage):
        """Broadcast message to all subscribers of a channel."""
        if channel not in self.channels:
            return
        
        disconnected = []
        for user_id in self.channels[channel]:
            try:
                await self.send_to_user(user_id, message)
            except Exception:
                disconnected.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected:
            await self.disconnect(user_id)
    
    async def broadcast_to_all(self, message: WSMessage):
        """Broadcast message to all connected users."""
        disconnected = []
        for user_id in list(self.connections.keys()):
            try:
                await self.send_to_user(user_id, message)
            except Exception:
                disconnected.append(user_id)
        
        for user_id in disconnected:
            await self.disconnect(user_id)
    
    def get_channel_users(self, channel: str) -> Set[str]:
        """Get all users subscribed to a channel."""
        return self.channels.get(channel, set())
    
    def get_user_channels(self, user_id: str) -> Set[str]:
        """Get all channels a user is subscribed to."""
        if user_id in self.presence:
            return self.presence[user_id]["channels"]
        return set()
    
    def get_online_count(self) -> int:
        """Get total number of connected users."""
        return len(self.connections)


# Singleton instance
gateway = WebSocketGateway()
