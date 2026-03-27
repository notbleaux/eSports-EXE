"""
NJZ eSports WebSocket Service — Path A Live Data Distribution
Broadcasts Pandascore webhook events to clients via Redis Streams
"""
import os
import json
import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, List, Set, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from redis import asyncio as aioredis
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

# --- Configuration ---

class Settings(BaseSettings):
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    STREAM_NAME: str = os.getenv("STREAM_NAME", "pandascore:events")
    STREAM_GROUP: str = "websocket_service"
    STREAM_CONSUMER: str = os.getenv("HOSTNAME", "ws_consumer_1")
    APP_VERSION: str = "0.3.0"
    HEARTBEAT_INTERVAL: int = 30  # seconds
    HEARTBEAT_TIMEOUT: int = 60  # seconds before considering client dead
    MAX_RECONNECT_ATTEMPTS: int = 5
    RECONNECT_DELAY: int = 5  # seconds
    # Deduplication settings
    DEDUP_WINDOW_MS: int = 1000  # 1 second window for deduplication
    DEDUP_CACHE_SIZE: int = 10000  # Max message IDs to track
    # Backpressure settings
    MAX_QUEUE_PER_CLIENT: int = 1000  # Max messages queued per client
    CLIENT_QUEUE_TIMEOUT_S: int = 5  # Timeout for client message processing

settings = Settings()

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("websocket-service")

# --- WebSocket Message Types ---

class WsMessageType(str, Enum):
    MATCH_START = "MATCH_START"
    ROUND_START = "ROUND_START"
    ROUND_END = "ROUND_END"
    SCORE_UPDATE = "SCORE_UPDATE"
    PLAYER_STATS_UPDATE = "PLAYER_STATS_UPDATE"
    ECONOMY_SNAPSHOT = "ECONOMY_SNAPSHOT"
    MATCH_END = "MATCH_END"
    HEARTBEAT = "HEARTBEAT"
    ERROR = "ERROR"

class WsMessage(BaseModel):
    """WebSocket message envelope"""
    type: WsMessageType
    matchId: str
    timestamp: int  # Unix milliseconds
    payload: Dict[str, Any]

# --- Redis Stream Consumer ---

class RedisStreamConsumer:
    """Manages Redis Stream consumption and event parsing"""

    def __init__(self, redis_url: str, stream_name: str, group_name: str, consumer_name: str):
        self.redis_url = redis_url
        self.stream_name = stream_name
        self.group_name = group_name
        self.consumer_name = consumer_name
        self.redis: Optional[aioredis.Redis] = None
        self.running = False
        self.reconnect_attempts = 0

    async def connect(self):
        """Establish Redis connection"""
        try:
            self.redis = aioredis.from_url(self.redis_url, decode_responses=True)
            await self.redis.ping()
            logger.info("Connected to Redis")
            self.reconnect_attempts = 0
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def create_consumer_group(self):
        """Create consumer group if it doesn't exist"""
        try:
            await self.redis.xgroup_create(self.stream_name, self.group_name, id="0", mkstream=True)
            logger.info(f"Created consumer group: {self.group_name}")
        except Exception as e:
            logger.debug(f"Consumer group already exists: {e}")

    async def parse_pandascore_event(self, raw_event: Dict[str, Any]) -> Optional[WsMessage]:
        """
        Convert Pandascore webhook event to WsMessage format
        Maps event types and extracts relevant data
        """
        try:
            event_type = raw_event.get("event_type", "").upper()
            match_id = str(raw_event.get("match_id", "unknown"))
            timestamp = raw_event.get("timestamp", int(datetime.utcnow().timestamp() * 1000))

            # Normalize timestamp to milliseconds
            if timestamp < 10**10:
                timestamp = int(timestamp * 1000)

            # Map Pandascore event types to WsMessageType
            if event_type == "MATCH_START":
                ws_type = WsMessageType.MATCH_START
                payload = {
                    "teamA": {
                        "id": raw_event.get("team1", {}).get("id"),
                        "name": raw_event.get("team1", {}).get("name"),
                        "score": 0
                    },
                    "teamB": {
                        "id": raw_event.get("team2", {}).get("id"),
                        "name": raw_event.get("team2", {}).get("name"),
                        "score": 0
                    },
                    "currentRound": 0,
                    "half": "first"
                }

            elif event_type in ["ROUND_END", "ROUND_UPDATE"]:
                ws_type = WsMessageType.ROUND_END
                payload = {
                    "roundNumber": raw_event.get("round_number", 0),
                    "roundResult": raw_event.get("round_result", "unknown"),
                    "winCondition": raw_event.get("win_condition", ""),
                    "duration": raw_event.get("round_duration", 0)
                }

            elif event_type == "SCORE_UPDATE":
                ws_type = WsMessageType.SCORE_UPDATE
                payload = {
                    "teamA": {
                        "id": raw_event.get("team1", {}).get("id"),
                        "name": raw_event.get("team1", {}).get("name"),
                        "score": raw_event.get("team1_score", 0)
                    },
                    "teamB": {
                        "id": raw_event.get("team2", {}).get("id"),
                        "name": raw_event.get("team2", {}).get("name"),
                        "score": raw_event.get("team2_score", 0)
                    },
                    "currentRound": raw_event.get("current_round", 0),
                    "half": raw_event.get("half", "first")
                }

            elif event_type == "MATCH_END":
                ws_type = WsMessageType.MATCH_END
                payload = {
                    "winnerId": raw_event.get("winner_id"),
                    "finalScore": {
                        "teamA": raw_event.get("team1_score", 0),
                        "teamB": raw_event.get("team2_score", 0)
                    },
                    "totalRounds": raw_event.get("total_rounds", 0),
                    "duration": raw_event.get("match_duration", 0)
                }

            else:
                # Default handling for unknown event types
                ws_type = WsMessageType.MATCH_START
                payload = raw_event

            return WsMessage(
                type=ws_type,
                matchId=match_id,
                timestamp=timestamp,
                payload=payload
            )

        except Exception as e:
            logger.error(f"Error parsing Pandascore event: {e}", exc_info=True)
            return None

    async def listen(self, manager: 'MatchConnectionManager'):
        """
        Main consumer loop: listen to Redis stream and broadcast to clients
        """
        if not self.redis:
            await self.connect()

        try:
            await self.create_consumer_group()
        except Exception as e:
            logger.warning(f"Failed to create consumer group: {e}")

        self.running = True
        logger.info(f"Starting to consume from stream: {self.stream_name}")

        while self.running:
            try:
                # Read from stream
                messages = await self.redis.xreadgroup(
                    self.group_name,
                    self.consumer_name,
                    {self.stream_name: ">"},
                    count=10,
                    block=5000
                )

                for _, stream_msgs in (messages or []):
                    for msg_id, data in stream_msgs:
                        try:
                            # Parse event
                            raw_event = json.loads(data.get("payload", "{}"))
                            ws_message = await self.parse_pandascore_event(raw_event)

                            if ws_message:
                                # Broadcast to all clients
                                await manager.broadcast_global(ws_message.dict())

                                # Broadcast to match-specific subscribers
                                await manager.broadcast_to_match(
                                    ws_message.matchId,
                                    ws_message.dict()
                                )

                                logger.debug(f"Broadcasted {ws_message.type} for match {ws_message.matchId}")

                            # Acknowledge message
                            await self.redis.xack(self.stream_name, self.group_name, msg_id)

                        except Exception as e:
                            logger.error(f"Error processing stream message {msg_id}: {e}", exc_info=True)

            except asyncio.CancelledError:
                logger.info("Stream consumer cancelled")
                self.running = False
                break
            except Exception as e:
                logger.error(f"Redis Stream connection error: {e}")
                self.reconnect_attempts += 1

                if self.reconnect_attempts < settings.MAX_RECONNECT_ATTEMPTS:
                    await asyncio.sleep(settings.RECONNECT_DELAY)
                    try:
                        await self.connect()
                        logger.info(f"Reconnected to Redis (attempt {self.reconnect_attempts})")
                    except Exception as reconnect_error:
                        logger.error(f"Reconnection failed: {reconnect_error}")
                else:
                    logger.error("Max reconnect attempts reached, stopping consumer")
                    self.running = False
                    break

    async def stop(self):
        """Stop the consumer gracefully"""
        self.running = False
        if self.redis:
            await self.redis.close()
            logger.info("Redis consumer stopped")

# --- WebSocket Connection Manager ---

# --- Message Deduplication ---

class MessageDeduplicator:
    """Prevents duplicate messages from being broadcast"""

    def __init__(self, window_ms: int = 1000, cache_size: int = 10000):
        self.window_ms = window_ms
        self.cache_size = cache_size
        # message_id -> timestamp when added
        self.seen_messages: Dict[str, float] = {}

    def is_duplicate(self, message_id: str) -> bool:
        """Check if message ID has been seen recently"""
        now = time.time() * 1000  # Convert to milliseconds

        if message_id in self.seen_messages:
            age_ms = now - self.seen_messages[message_id]
            if age_ms < self.window_ms:
                return True
            else:
                # Message is old, remove it
                del self.seen_messages[message_id]

        # Add to cache
        self.seen_messages[message_id] = now

        # Prune old entries if cache is full
        if len(self.seen_messages) > self.cache_size:
            oldest_id = min(self.seen_messages, key=self.seen_messages.get)
            del self.seen_messages[oldest_id]

        return False

    def cleanup_expired(self):
        """Remove expired message IDs from cache"""
        now = time.time() * 1000
        expired = [
            msg_id for msg_id, timestamp in self.seen_messages.items()
            if (now - timestamp) > self.window_ms
        ]
        for msg_id in expired:
            del self.seen_messages[msg_id]

# --- Connection Manager ---

class MatchConnectionManager:
    """Manages WebSocket connections per match and global feed"""

    def __init__(self):
        # match_id -> set of connected WebSockets
        self.match_subscriptions: Dict[str, Set[WebSocket]] = {}
        # Global feed subscribers
        self.global_subscribers: Set[WebSocket] = set()
        self.active_connection_count = 0
        # Connection metadata tracking
        self.connection_metadata: Dict[WebSocket, dict] = {}
        # Message deduplication
        self.deduplicator = MessageDeduplicator(
            window_ms=settings.DEDUP_WINDOW_MS,
            cache_size=settings.DEDUP_CACHE_SIZE
        )
        # Per-client message queues for backpressure
        self.client_queues: Dict[WebSocket, asyncio.Queue] = {}

    async def connect(self, websocket: WebSocket, match_id: Optional[str] = None):
        """Register a new WebSocket connection"""
        await websocket.accept()
        self.active_connection_count += 1

        # Track connection metadata
        self.connection_metadata[websocket] = {
            "connected_at": datetime.utcnow(),
            "match_id": match_id,
            "last_pong": datetime.utcnow(),
            "message_count": 0
        }

        # Create message queue for backpressure handling
        self.client_queues[websocket] = asyncio.Queue(maxsize=settings.MAX_QUEUE_PER_CLIENT)

        if match_id:
            if match_id not in self.match_subscriptions:
                self.match_subscriptions[match_id] = set()
            self.match_subscriptions[match_id].add(websocket)
            logger.info(f"Client subscribed to match {match_id} (active: {self.active_connection_count})")
        else:
            self.global_subscribers.add(websocket)
            logger.info(f"Client subscribed to global feed (active: {self.active_connection_count})")

    def disconnect(self, websocket: WebSocket, match_id: Optional[str] = None):
        """Unregister a WebSocket connection"""
        self.active_connection_count = max(0, self.active_connection_count - 1)

        # Clean up metadata and queue
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
        if websocket in self.client_queues:
            del self.client_queues[websocket]

        if match_id and match_id in self.match_subscriptions:
            self.match_subscriptions[match_id].discard(websocket)
            if not self.match_subscriptions[match_id]:
                del self.match_subscriptions[match_id]
            logger.info(f"Client unsubscribed from match {match_id} (active: {self.active_connection_count})")
        else:
            self.global_subscribers.discard(websocket)
            logger.info(f"Client unsubscribed from global feed (active: {self.active_connection_count})")

    async def broadcast_to_match(self, match_id: str, message: Dict[str, Any]):
        """Send message to all subscribers of a specific match with deduplication and backpressure"""
        # Check for duplicates
        message_id = message.get("messageId") or f"{match_id}_{message.get('timestamp', 0)}"
        if self.deduplicator.is_duplicate(message_id):
            logger.debug(f"Skipping duplicate message: {message_id}")
            return

        targets = self.match_subscriptions.get(match_id, set())
        if targets:
            disconnected = []
            for ws in list(targets):
                try:
                    # Try to queue message (with backpressure)
                    queue = self.client_queues.get(ws)
                    if queue:
                        try:
                            queue.put_nowait(message)
                        except asyncio.QueueFull:
                            logger.warning(f"Message queue full for client in {match_id}, dropping oldest message")
                            try:
                                queue.get_nowait()  # Drop oldest
                                queue.put_nowait(message)
                            except:
                                disconnected.append(ws)
                    else:
                        # Send directly if no queue (shouldn't happen)
                        await ws.send_json(message)

                    # Update metadata
                    if ws in self.connection_metadata:
                        self.connection_metadata[ws]["message_count"] += 1

                except Exception as e:
                    logger.debug(f"Error sending to client: {e}")
                    disconnected.append(ws)

            # Clean up disconnected clients
            for ws in disconnected:
                self.disconnect(ws, match_id)

    async def broadcast_global(self, message: Dict[str, Any]):
        """Send message to all global subscribers"""
        if self.global_subscribers:
            tasks = [ws.send_json(message) for ws in list(self.global_subscribers)]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Clean up disconnected clients
            for ws, result in zip(self.global_subscribers, results):
                if isinstance(result, Exception):
                    self.disconnect(ws)

    async def send_heartbeat(self):
        """Send periodic heartbeat to all connected clients and detect timeouts"""
        now = datetime.utcnow()
        heartbeat = {
            "type": "HEARTBEAT",
            "messageId": f"heartbeat_{int(now.timestamp() * 1000)}",
            "timestamp": int(now.timestamp() * 1000),
            "matchId": "system",
            "payload": {
                "serverTime": int(now.timestamp() * 1000),
                "activeConnections": self.active_connection_count
            }
        }

        # Check for timed-out clients (no PONG for heartbeat_timeout seconds)
        disconnected = []
        for ws, metadata in list(self.connection_metadata.items()):
            time_since_pong = (now - metadata.get("last_pong", now)).total_seconds()
            if time_since_pong > settings.HEARTBEAT_TIMEOUT:
                logger.warning(f"Client timeout (no PONG for {time_since_pong}s), disconnecting")
                disconnected.append((ws, metadata.get("match_id")))

        # Clean up timed-out clients
        for ws, match_id in disconnected:
            self.disconnect(ws, match_id)

        # Send to global subscribers
        if self.global_subscribers:
            for ws in list(self.global_subscribers):
                try:
                    queue = self.client_queues.get(ws)
                    if queue:
                        queue.put_nowait(heartbeat)
                    else:
                        await ws.send_json(heartbeat)
                except Exception as e:
                    logger.debug(f"Error sending heartbeat: {e}")
                    self.disconnect(ws)

        # Send to all match subscriptions
        for match_id in list(self.match_subscriptions.keys()):
            await self.broadcast_to_match(match_id, heartbeat)

    def get_metrics(self) -> Dict[str, Any]:
        """Get current connection metrics"""
        return {
            "activeConnections": self.active_connection_count,
            "matchSubscriptions": len(self.match_subscriptions),
            "globalSubscribers": len(self.global_subscribers),
            "timestamp": int(datetime.utcnow().timestamp() * 1000)
        }

# --- Global instances (created before lifespan to allow test overrides) ---

manager = MatchConnectionManager()
consumer = RedisStreamConsumer(
    settings.REDIS_URL,
    settings.STREAM_NAME,
    settings.STREAM_GROUP,
    settings.STREAM_CONSUMER
)

# --- FastAPI Lifespan Context Manager ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern FastAPI lifespan (replaces deprecated @app.on_event)"""
    heartbeat_task: Optional[asyncio.Task] = None

    # Startup
    logger.info("WebSocket service starting...")
    try:
        asyncio.create_task(consumer.listen(manager))
        logger.info("Redis stream consumer started")

        async def send_heartbeats():
            while True:
                try:
                    await manager.send_heartbeat()
                    await asyncio.sleep(settings.HEARTBEAT_INTERVAL)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Heartbeat error: {e}")
                    await asyncio.sleep(5)

        heartbeat_task = asyncio.create_task(send_heartbeats())
        logger.info(f"Heartbeat task started (interval: {settings.HEARTBEAT_INTERVAL}s)")
    except Exception as e:
        logger.error(f"WebSocket service startup failed: {e}")

    yield  # Service running

    # Shutdown
    logger.info("WebSocket service shutting down...")
    if heartbeat_task:
        heartbeat_task.cancel()
    await consumer.stop()
    for match_ws_set in manager.match_subscriptions.values():
        for ws in match_ws_set:
            try:
                await ws.close()
            except Exception:
                pass
    for ws in manager.global_subscribers:
        try:
            await ws.close()
        except Exception:
            pass
    logger.info("WebSocket service shutdown complete")

# --- FastAPI App ---

app = FastAPI(
    title="NJZ WebSocket Service",
    description="Dedicated real-time WebSocket service for NJZ eSports (Path A Live Distribution)",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# --- Routes ---

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "websocket",
        "version": settings.APP_VERSION,
        "redis": "connected" if consumer.redis else "disconnected"
    }

@app.get("/metrics")
async def metrics():
    """Connection metrics endpoint"""
    return manager.get_metrics()

@app.websocket("/ws/matches/live")
async def live_matches(websocket: WebSocket):
    """WebSocket endpoint for global live match feed"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, receive client heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in live_matches: {e}")
        manager.disconnect(websocket)

@app.websocket("/ws/matches/{match_id}/live")
async def live_match_detail(websocket: WebSocket, match_id: str):
    """WebSocket endpoint for match-specific live updates"""
    await manager.connect(websocket, match_id=match_id)
    try:
        while True:
            # Keep connection alive, receive client heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id=match_id)
    except Exception as e:
        logger.error(f"Error in live_match_detail for {match_id}: {e}")
        manager.disconnect(websocket, match_id=match_id)

@app.get("/ready")
async def ready():
    """Readiness check"""
    redis_ok = consumer.redis is not None if hasattr(consumer, 'redis') else False
    return {
        "status": "ready" if redis_ok else "not_ready",
        "redis": "connected" if redis_ok else "disconnected",
        "consumer_running": consumer.running
    }

@app.get("/v1/matches/live")
async def get_live_matches():
    """
    REST fallback for clients that cannot use WebSocket.
    Returns current live match subscriptions and connection metrics.
    Path A distribution — eventual accuracy.
    """
    return {
        "liveMatches": list(manager.match_subscriptions.keys()),
        "metrics": manager.get_metrics(),
        "note": "For real-time updates, connect to /ws/matches/live"
    }

@app.get("/v1/matches/{match_id}/events")
async def get_match_events(match_id: str):
    """
    REST fallback: recent events for a specific match.
    Returns current subscriber count and connection status.
    Use /ws/matches/{match_id}/live for real-time streaming.
    """
    match_subscribers = len(manager.match_subscriptions.get(match_id, set()))
    return {
        "matchId": match_id,
        "subscriberCount": match_subscribers,
        "isLive": match_subscribers > 0,
        "wsEndpoint": f"/ws/matches/{match_id}/live",
        "note": "Full event history is available via Path B (legacy-compiler service)"
    }
