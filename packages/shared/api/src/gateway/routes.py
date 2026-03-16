"""
TENET WebSocket Gateway HTTP Routes

[Ver001.000]
HTTP endpoints for gateway management and control.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from .websocket_gateway import gateway, MessageType, WSMessage

logger = logging.getLogger(__name__)

# Router
router = APIRouter(prefix="/gateway", tags=["gateway"])


# ============================================================================
# Request/Response Models
# ============================================================================

class GatewayStatus(BaseModel):
    """Gateway status response."""
    status: str
    connected_users: int
    active_channels: int
    timestamp: str


class ChannelInfo(BaseModel):
    """Channel information."""
    name: str
    subscriber_count: int
    type: str


class ChannelsResponse(BaseModel):
    """Channels list response."""
    channels: List[ChannelInfo]
    total_subscribers: int


class BroadcastRequest(BaseModel):
    """Broadcast message request."""
    type: str = Field(..., description="Message type (e.g., data_update, match_event)")
    channel: str = Field(..., description="Target channel (e.g., global, match:123)")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Message payload")
    sender_id: Optional[str] = Field(default=None, description="Optional sender ID")


class BroadcastResponse(BaseModel):
    """Broadcast response."""
    success: bool
    recipients: int
    timestamp: str


class UserPresence(BaseModel):
    """User presence information."""
    user_id: str
    status: str
    channels: List[str]
    last_seen: str


class PresenceResponse(BaseModel):
    """Presence list response."""
    users: List[UserPresence]
    total_online: int


# ============================================================================
# Routes
# ============================================================================

@router.get("/status", response_model=GatewayStatus)
async def get_gateway_status() -> GatewayStatus:
    """
    Get current gateway status.
    
    Returns connection statistics including number of connected users
    and active channels.
    """
    return GatewayStatus(
        status="healthy",
        connected_users=gateway.get_online_count(),
        active_channels=len(gateway.channels),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/channels", response_model=ChannelsResponse)
async def get_channels() -> ChannelsResponse:
    """
    List all active channels and their subscriber counts.
    
    Returns information about all currently active channels including
    global, match, lobby, team, and hub channels.
    """
    channel_list: List[ChannelInfo] = []
    total_subscribers = 0
    
    for channel_name, subscribers in gateway.channels.items():
        subscriber_count = len(subscribers)
        total_subscribers += subscriber_count
        
        # Determine channel type from name
        channel_type = "global"
        if ":" in channel_name:
            prefix = channel_name.split(":")[0]
            channel_type = f"{prefix}_channel"
        
        channel_list.append(ChannelInfo(
            name=channel_name,
            subscriber_count=subscriber_count,
            type=channel_type,
        ))
    
    # Sort by subscriber count descending
    channel_list.sort(key=lambda x: x.subscriber_count, reverse=True)
    
    return ChannelsResponse(
        channels=channel_list,
        total_subscribers=total_subscribers,
    )


@router.post("/broadcast", response_model=BroadcastResponse)
async def broadcast_message(request: BroadcastRequest) -> BroadcastResponse:
    """
    Broadcast a message to a specific channel.
    
    This endpoint allows server-side broadcasting of messages to
    all subscribers of a specified channel.
    
    **Channel formats:**
    - `global` - All connected users
    - `match:{id}` - Specific match (e.g., match:123)
    - `lobby:{id}` - Specific lobby (e.g., lobby:456)
    - `team:{id}` - Specific team (e.g., team:789)
    - `hub:{name}` - Specific hub (e.g., hub:sator)
    """
    try:
        message = WSMessage(
            type=request.type,
            channel=request.channel,
            payload=request.payload,
            timestamp=datetime.now(timezone.utc).isoformat(),
            sender_id=request.sender_id or "server",
            message_id=f"broadcast_{datetime.now(timezone.utc).timestamp()}",
        )
        
        if request.channel == "global":
            await gateway.broadcast_to_all(message)
            recipients = gateway.get_online_count()
        else:
            await gateway.broadcast_to_channel(request.channel, message)
            recipients = len(gateway.get_channel_users(request.channel))
        
        logger.info(f"Broadcast to {request.channel}: {recipients} recipients")
        
        return BroadcastResponse(
            success=True,
            recipients=recipients,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    
    except Exception as e:
        logger.error(f"Broadcast failed: {e}")
        raise HTTPException(status_code=500, detail=f"Broadcast failed: {str(e)}")


@router.get("/presence", response_model=PresenceResponse)
async def get_presence() -> PresenceResponse:
    """
    Get presence information for all connected users.
    
    Returns online status, subscribed channels, and last seen timestamp
    for each connected user.
    """
    users: List[UserPresence] = []
    
    for user_id, presence_data in gateway.presence.items():
        users.append(UserPresence(
            user_id=user_id,
            status=presence_data.get("status", "unknown"),
            channels=list(presence_data.get("channels", set())),
            last_seen=presence_data.get("last_seen", datetime.now(timezone.utc)).isoformat(),
        ))
    
    return PresenceResponse(
        users=users,
        total_online=len(users),
    )


@router.get("/presence/{channel}", response_model=PresenceResponse)
async def get_channel_presence(channel: str) -> PresenceResponse:
    """
    Get presence information for a specific channel.
    
    Returns online users currently subscribed to the specified channel.
    """
    user_ids = gateway.get_channel_users(channel)
    users: List[UserPresence] = []
    
    for user_id in user_ids:
        if user_id in gateway.presence:
            presence_data = gateway.presence[user_id]
            users.append(UserPresence(
                user_id=user_id,
                status=presence_data.get("status", "unknown"),
                channels=list(presence_data.get("channels", set())),
                last_seen=presence_data.get("last_seen", datetime.now(timezone.utc)).isoformat(),
            ))
    
    return PresenceResponse(
        users=users,
        total_online=len(users),
    )
