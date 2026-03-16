"""
OPERA Live Events API — Real-time esports event streaming

Provides endpoints for live events, matches, and chat for the OPERA hub.

[Ver001.000]
"""
import logging
from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from api.src.db_manager import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/opera/live", tags=["opera-live"])


# ============================================================================
# Pydantic Models
# ============================================================================

class TeamInfo(BaseModel):
    name: str
    logo: Optional[str] = None
    score: int = 0


class LiveMatch(BaseModel):
    id: str
    team_a: TeamInfo
    team_b: TeamInfo
    status: str  # "live", "upcoming", "finished"
    map: Optional[str] = None
    tournament: str
    eta: Optional[str] = None  # "LIVE" or "1h 30m"
    stream_url: Optional[str] = None
    viewers: Optional[int] = None


class LiveEvent(BaseModel):
    id: str
    title: str
    tournament: str
    start_time: datetime
    status: str  # "live", "upcoming", "finished"
    thumbnail: Optional[str] = None
    viewers: Optional[int] = None
    teams: List[dict]


class ChatUser(BaseModel):
    name: str
    avatar: str
    badge: Optional[str] = None  # "vip", "mod", "sub", "founder", "verified"


class ChatMessage(BaseModel):
    id: str
    user: ChatUser
    message: str
    timestamp: datetime


class LiveDataResponse(BaseModel):
    events: List[LiveEvent]
    matches: List[LiveMatch]
    messages: List[ChatMessage]
    last_updated: datetime


# ============================================================================
# In-Memory Store (Replace with Redis in production)
# ============================================================================

class LiveDataStore:
    """In-memory store for live data. Replace with Redis for production scaling."""
    
    def __init__(self):
        self.events: List[LiveEvent] = []
        self.matches: List[LiveMatch] = []
        self.messages: List[ChatMessage] = []
        self.connections: List[WebSocket] = []
        self.last_updated = datetime.now(timezone.utc)
    
    def update_timestamp(self):
        self.last_updated = datetime.now(timezone.utc)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected WebSocket clients."""
        disconnected = []
        for conn in self.connections:
            try:
                await conn.send_json(message)
            except:
                disconnected.append(conn)
        
        # Clean up disconnected clients
        for conn in disconnected:
            if conn in self.connections:
                self.connections.remove(conn)


# Global store instance
live_store = LiveDataStore()


# ============================================================================
# REST API Endpoints
# ============================================================================

@router.get("/events", response_model=List[LiveEvent])
async def get_live_events(
    status: Optional[str] = Query(None, enum=["live", "upcoming", "finished"]),
    tournament: Optional[str] = Query(None),
    limit: int = Query(default=20, le=100),
) -> List[LiveEvent]:
    """
    Get live esports events.
    
    Args:
        status: Filter by event status
        tournament: Filter by tournament name
        limit: Maximum number of events to return
    
    Returns:
        List of live events
    """
    try:
        pool = await db.get_pool()
        
        if pool:
            # Query from database
            query = """
                SELECT 
                    id, title, tournament, start_time, status,
                    thumbnail, viewers, teams
                FROM opera_live_events
                WHERE 1=1
            """
            params = []
            
            if status:
                query += " AND status = $1"
                params.append(status)
            
            if tournament:
                query += f" AND tournament ILIKE ${len(params) + 1}"
                params.append(f"%{tournament}%")
            
            query += " ORDER BY start_time DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                
                events = []
                for row in rows:
                    events.append(LiveEvent(
                        id=str(row["id"]),
                        title=row["title"],
                        tournament=row["tournament"],
                        start_time=row["start_time"],
                        status=row["status"],
                        thumbnail=row.get("thumbnail"),
                        viewers=row.get("viewers"),
                        teams=row.get("teams", []),
                    ))
                
                return events
        
        # Fallback to in-memory store
        events = live_store.events
        if status:
            events = [e for e in events if e.status == status]
        if tournament:
            events = [e for e in events if tournament.lower() in e.tournament.lower()]
        
        return events[:limit]
    
    except Exception as e:
        logger.error(f"Error fetching live events: {e}")
        # Return empty list on error
        return []


@router.get("/matches", response_model=List[LiveMatch])
async def get_live_matches(
    status: Optional[str] = Query(None, enum=["live", "upcoming", "finished"]),
    tournament: Optional[str] = Query(None),
    limit: int = Query(default=20, le=100),
) -> List[LiveMatch]:
    """
    Get live matches.
    
    Args:
        status: Filter by match status
        tournament: Filter by tournament name
        limit: Maximum number of matches to return
    
    Returns:
        List of live matches
    """
    try:
        pool = await db.get_pool()
        
        if pool:
            query = """
                SELECT 
                    id, team_a, team_b, status, map, tournament,
                    eta, stream_url, viewers
                FROM opera_live_matches
                WHERE 1=1
            """
            params = []
            
            if status:
                query += " AND status = $1"
                params.append(status)
            
            if tournament:
                query += f" AND tournament ILIKE ${len(params) + 1}"
                params.append(f"%{tournament}%")
            
            query += " ORDER BY 
                CASE status 
                    WHEN 'live' THEN 1 
                    WHEN 'upcoming' THEN 2 
                    ELSE 3 
                END,
                start_time DESC
                LIMIT $" + str(len(params) + 1)
            params.append(limit)
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                
                matches = []
                for row in rows:
                    matches.append(LiveMatch(
                        id=str(row["id"]),
                        team_a=TeamInfo(**row["team_a"]),
                        team_b=TeamInfo(**row["team_b"]),
                        status=row["status"],
                        map=row.get("map"),
                        tournament=row["tournament"],
                        eta=row.get("eta"),
                        stream_url=row.get("stream_url"),
                        viewers=row.get("viewers"),
                    ))
                
                return matches
        
        # Fallback to in-memory store
        matches = live_store.matches
        if status:
            matches = [m for m in matches if m.status == status]
        if tournament:
            matches = [m for m in matches if tournament.lower() in m.tournament.lower()]
        
        return matches[:limit]
    
    except Exception as e:
        logger.error(f"Error fetching live matches: {e}")
        return []


@router.get("/chat", response_model=List[ChatMessage])
async def get_chat_messages(
    match_id: Optional[str] = Query(None),
    limit: int = Query(default=50, le=100),
    before: Optional[datetime] = Query(None),
) -> List[ChatMessage]:
    """
    Get chat messages for a match or global chat.
    
    Args:
        match_id: Filter by match ID (if None, returns global chat)
        limit: Maximum number of messages
        before: Get messages before this timestamp
    
    Returns:
        List of chat messages
    """
    try:
        pool = await db.get_pool()
        
        if pool:
            query = """
                SELECT 
                    id, user_name, user_avatar, user_badge,
                    message, timestamp
                FROM opera_chat_messages
                WHERE 1=1
            """
            params = []
            
            if match_id:
                query += f" AND match_id = ${len(params) + 1}"
                params.append(match_id)
            
            if before:
                query += f" AND timestamp < ${len(params) + 1}"
                params.append(before)
            
            query += " ORDER BY timestamp DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                
                messages = []
                for row in rows:
                    messages.append(ChatMessage(
                        id=str(row["id"]),
                        user=ChatUser(
                            name=row["user_name"],
                            avatar=row["user_avatar"],
                            badge=row.get("user_badge"),
                        ),
                        message=row["message"],
                        timestamp=row["timestamp"],
                    ))
                
                # Return in chronological order
                return list(reversed(messages))
        
        # Fallback to in-memory store
        messages = live_store.messages[-limit:]
        return messages
    
    except Exception as e:
        logger.error(f"Error fetching chat messages: {e}")
        return []


@router.post("/chat", response_model=ChatMessage)
async def post_chat_message(message: ChatMessage) -> ChatMessage:
    """
    Post a new chat message.
    
    Note: In production, this should require authentication.
    """
    try:
        # Add to store
        live_store.messages.append(message)
        live_store.update_timestamp()
        
        # Broadcast to WebSocket clients
        await live_store.broadcast({
            "type": "chat_message",
            "data": message.dict(),
        })
        
        return message
    
    except Exception as e:
        logger.error(f"Error posting chat message: {e}")
        raise HTTPException(status_code=500, detail="Failed to post message")


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time live data updates.
    
    Clients receive:
    - live_match_update: When a match score changes
    - live_event_update: When event status changes
    - chat_message: New chat messages
    - ping: Keep-alive pings (respond with pong)
    """
    await websocket.accept()
    live_store.connections.append(websocket)
    
    try:
        # Send initial data
        await websocket.send_json({
            "type": "connected",
            "data": {
                "events": [e.dict() for e in live_store.events],
                "matches": [m.dict() for m in live_store.matches],
                "messages": [m.dict() for m in live_store.messages[-50:]],
            },
        })
        
        # Listen for client messages
        while True:
            try:
                message = await websocket.receive_json()
                
                if message.get("type") == "subscribe":
                    # Client subscribing to channels
                    channels = message.get("channels", [])
                    await websocket.send_json({
                        "type": "subscribed",
                        "channels": channels,
                    })
                
                elif message.get("type") == "pong":
                    # Client responding to ping
                    pass
                
                elif message.get("type") == "switch_stream":
                    # Client switched streams
                    stream_id = message.get("streamId")
                    logger.info(f"Client switched to stream: {stream_id}")
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
    
    finally:
        # Clean up connection
        if websocket in live_store.connections:
            live_store.connections.remove(websocket)


# ============================================================================
# Data Update Functions (Called by background tasks)
# ============================================================================

async def update_match_score(match_id: str, team_a_score: int, team_b_score: int):
    """Update match score and broadcast to clients."""
    for match in live_store.matches:
        if match.id == match_id:
            match.team_a.score = team_a_score
            match.team_b.score = team_b_score
            live_store.update_timestamp()
            
            await live_store.broadcast({
                "type": "live_match_update",
                "data": match.dict(),
            })
            break


async def add_chat_message(user: ChatUser, message: str, match_id: Optional[str] = None):
    """Add chat message and broadcast."""
    chat_msg = ChatMessage(
        id=str(datetime.now(timezone.utc).timestamp()),
        user=user,
        message=message,
        timestamp=datetime.now(timezone.utc),
    )
    
    live_store.messages.append(chat_msg)
    if len(live_store.messages) > 1000:
        live_store.messages = live_store.messages[-1000:]  # Keep last 1000
    
    await live_store.broadcast({
        "type": "chat_message",
        "data": chat_msg.dict(),
    })
