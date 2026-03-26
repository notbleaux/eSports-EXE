import os
import json
import asyncio
import logging
from typing import Dict, List, Set, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from redis import asyncio as aioredis
from pydantic_settings import BaseSettings

# --- Configuration ---

class Settings(BaseSettings):
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    STREAM_NAME: str = "njz:match_events"
    STREAM_GROUP: str = "websocket_service"
    STREAM_CONSUMER: str = os.getenv("HOSTNAME", "consumer_1")
    APP_VERSION: str = "0.1.0"

settings = Settings()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket-service")

# --- FastAPI App ---
app = FastAPI(
    title="NJZ WebSocket Service",
    description="Dedicated real-time WebSocket service for NJZ eSports",
    version=settings.APP_VERSION,
)

# --- Connection Manager ---

class MatchConnectionManager:
    def __init__(self):
        # match_id -> set of websockets
        self.match_subscriptions: Dict[str, Set[WebSocket]] = {}
        # global feed
        self.global_subscribers: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, match_id: str = None):
        await websocket.accept()
        if match_id:
            if match_id not in self.match_subscriptions:
                self.match_subscriptions[match_id] = set()
            self.match_subscriptions[match_id].add(websocket)
            logger.info(f"Client subscribed to match: {match_id}")
        else:
            self.global_subscribers.add(websocket)
            logger.info("Client subscribed to global live feed")

    def disconnect(self, websocket: WebSocket, match_id: str = None):
        if match_id and match_id in self.match_subscriptions:
            self.match_subscriptions[match_id].discard(websocket)
            if not self.match_subscriptions[match_id]:
                del self.match_subscriptions[match_id]
        else:
            self.global_subscribers.discard(websocket)

    async def broadcast_to_match(self, match_id: str, message: dict):
        targets = self.match_subscriptions.get(match_id, set())
        if targets:
            await asyncio.gather(*[ws.send_json(message) for ws in targets], return_exceptions=True)

    async def broadcast_global(self, message: dict):
        if self.global_subscribers:
            await asyncio.gather(*[ws.send_json(message) for ws in self.global_subscribers], return_exceptions=True)

manager = MatchConnectionManager()

# --- Redis Stream Consumer ---

async def consume_stream():
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    
    # Create consumer group if not exists
    try:
        await redis.xgroup_create(settings.STREAM_NAME, settings.STREAM_GROUP, id="0", mkstream=True)
    except Exception:
        pass # Already exists

    logger.info(f"Started consuming Redis Stream: {settings.STREAM_NAME}")
    
    while True:
        try:
            # Read from stream
            messages = await redis.xreadgroup(
                settings.STREAM_GROUP, 
                settings.STREAM_CONSUMER, 
                {settings.STREAM_NAME: ">"}, 
                count=10, 
                block=5000
            )
            
            for _, stream_msgs in messages:
                for msg_id, data in stream_msgs:
                    try:
                        event = json.loads(data.get("payload", "{}"))
                        match_id = event.get("matchId")
                        
                        # Broadcast
                        await manager.broadcast_global({
                            "type": "match_event",
                            "data": event
                        })
                        
                        if match_id:
                            await manager.broadcast_to_match(str(match_id), {
                                "type": "match_update",
                                "data": event
                            })
                            
                        # Acknowledge
                        await redis.xack(settings.STREAM_NAME, settings.STREAM_GROUP, msg_id)
                    except Exception as e:
                        logger.error(f"Error processing stream message {msg_id}: {e}")
                        
        except Exception as e:
            logger.error(f"Redis Stream connection error: {e}")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consume_stream())

# --- Routes ---

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "service": "websocket", 
        "connections": len(manager.global_subscribers),
        "match_subscriptions": len(manager.match_subscriptions)
    }

@app.websocket("/ws/matches/live")
async def live_matches(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive with heartbeats if needed, or just wait for disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/matches/{match_id}/live")
async def live_match_detail(websocket: WebSocket, match_id: str):
    await manager.connect(websocket, match_id=match_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id=match_id)
