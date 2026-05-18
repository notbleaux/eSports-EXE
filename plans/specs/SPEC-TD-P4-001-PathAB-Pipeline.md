[Ver001.000]

# Specification: TD-P4-001 Path A/B Data Pipeline

**Status:** 📋 Ready for Implementation  
**Priority:** P0 - Critical  
**Source:** EX-DATA-001 (Phase 3-6 Plan)  
**Estimated Effort:** 16 hours  
**Target Sprint:** S-Extraction-001  

---

## 1. Overview

The Path A/B Data Pipeline implements a Lambda Architecture Pattern for the TENET platform, providing both real-time (Path A) and authoritative (Path B) data flows for esports match data.

### 1.1 Architecture Goals

| Goal | Path A (Live) | Path B (Legacy) |
|------|---------------|-----------------|
| **Latency** | < 500ms | < 5 seconds |
| **Throughput** | 1000+ events/sec | 100+ records/sec |
| **Consistency** | Eventual | Strong |
| **Use Case** | Live scores, real-time updates | Historical analysis, verification |
| **Data Source** | Pandascore webhooks | All sources + manual review |

### 1.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Pandascore  │  │ Manual Entry│  │ Simulation  │  │ External APIs   │ │
│  │   Webhooks  │  │    (Admin)  │  │   Engine    │  │   (Future)      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
└─────────┼────────────────┼────────────────┼──────────────────┼──────────┘
          │                │                │                  │
          ▼                │                │                  │
┌──────────────────┐       │                │                  │
│   PATH A (LIVE)  │       │                │                  │
│                  │       │                │                  │
│ ┌──────────────┐ │       └────────────────┴──────────────────┘
│ │  Webhook     │ │                          │
│ │  Handler     │ │                          ▼
│ │              │ │       ┌──────────────────────────────────────┐
│ │ • HMAC auth  │ │       │      TeneT Verification Layer        │
│ │ • Normalize  │ │       │                                      │
│ │ • Route      │ │       │  ┌─────────────┐  ┌─────────────┐   │
│ └──────┬───────┘ │       │  │  Conflict   │  │  Confidence │   │
│        │         │       │  │  Detection  │──│   Scoring   │   │
│        ▼         │       │  └─────────────┘  └──────┬──────┘   │
│ ┌──────────────┐ │       │                          │          │
│ │ Redis Stream │ │       │                   ┌──────┴──────┐   │
│ │              │ │       │                   │ Review Queue│   │
│ │ match:{id}   │ │       │                   │  (Manual)   │   │
│ │ :events      │ │       │                   └──────┬──────┘   │
│ └──────┬───────┘ │       │                          │          │
│        │         │       └──────────────────────────┼──────────┘
│        ▼         │                                  │
│ ┌──────────────┐ │                                  ▼
│ │  WebSocket   │ │       ┌──────────────────────────────────────┐
│ │  Broadcast   │ │       │      PATH B (LEGACY/AUTHORITATIVE)   │
│ │              │ │       │                                      │
│ │ • Deduplic.  │ │       │  ┌─────────────┐  ┌─────────────┐   │
│ │ • Heartbeat  │ │       │  │ PostgreSQL  │  │   History   │   │
│ │ • Backpres.  │ │       │  │  (Verified) │──│    API      │   │
│ └──────┬───────┘ │       │  └─────────────┘  └─────────────┘   │
└────────┼─────────┘       └──────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│    FRONTEND      │
│  useLiveMatch()  │
│   <LiveScore/>   │
└──────────────────┘
```

---

## 2. Path A: Live Data Pipeline

### 2.1 Webhook Handler

**File:** `services/api-gateway/src/webhooks/pandascore.py`

```python
import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request, Header, HTTPException
from redis.asyncio import Redis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["webhooks"])

class PandascoreWebhookHandler:
    """
    Handles Pandascore webhook events with:
    - HMAC-SHA256 signature verification
    - Event normalization
    - Redis Stream routing
    """

    def __init__(self, secret: str, redis_client: Redis):
        self.secret = secret
        self.redis = redis_client
        self.dedup_window = 60  # seconds

    def verify_signature(self, body: bytes, signature: str) -> bool:
        """Verify HMAC-SHA256 signature from Pandascore."""
        try:
            expected = hmac.new(
                self.secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(signature, expected)
        except Exception as e:
            logger.error(f"Signature verification error: {e}")
            return False

    async def check_deduplication(self, event_id: str) -> bool:
        """Check if event already processed (idempotency)."""
        dedup_key = f"dedup:event:{event_id}"
        exists = await self.redis.exists(dedup_key)
        if not exists:
            await self.redis.setex(dedup_key, self.dedup_window, "1")
        return bool(exists)

    async def handle_match_score_update(
        self,
        event: dict,
        match_id: str
    ) -> dict:
        """Normalize and route match score updates."""
        # Deduplication check
        event_id = event.get('id') or f"{match_id}:{event.get('timestamp')}"
        if await self.check_deduplication(event_id):
            logger.info(f"Duplicate event skipped: {event_id}")
            return {"status": "duplicate", "event_id": event_id}

        # Normalize to standard format
        normalized = {
            "matchId": match_id,
            "type": "SCORE_UPDATE",
            "payload": {
                "teamA": {
                    "id": event["score"]["team_1_id"],
                    "score": event["score"]["team_1"],
                    "name": event.get("team_1_name", "Team A")
                },
                "teamB": {
                    "id": event["score"]["team_2_id"],
                    "score": event["score"]["team_2"],
                    "name": event.get("team_2_name", "Team B")
                },
                "round": event.get("round_number", 0),
                "timestamp": datetime.utcnow().isoformat()
            },
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "source": "pandascore_webhook",
            "eventId": event_id
        }

        # Route to Redis Stream
        stream_key = f"match:{match_id}:events"
        await self.redis.xadd(
            stream_key,
            {"payload": json.dumps(normalized)},
            maxlen=1000,
            approximate=True
        )

        # Update live match cache
        await self.redis.setex(
            f"match:{match_id}:live",
            3600,  # 1 hour TTL
            json.dumps(normalized["payload"])
        )

        logger.info(f"Event routed to {stream_key}: {event_id}")
        return normalized

# FastAPI endpoint
@router.post("/pandascore/match-update")
async def pandascore_match_update(
    request: Request,
    x_signature: Optional[str] = Header(None),
    x_event_id: Optional[str] = Header(None),
):
    """
    Receive Pandascore webhook for match score updates.
    
    Headers:
    - X-Signature: HMAC-SHA256 of request body
    - X-Event-ID: Unique event identifier (for deduplication)
    
    Returns: {"status": "received", "match_id": str, "event_id": str}
    """
    body = await request.body()
    
    # Verify signature
    if not webhook_handler.verify_signature(body, x_signature or ""):
        logger.warning("Invalid signature")
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    match_id = event.get("match_id")
    if not match_id:
        raise HTTPException(status_code=400, detail="Missing match_id")
    
    # Handle the update
    try:
        result = await webhook_handler.handle_match_score_update(event, match_id)
        return {
            "status": "received",
            "match_id": match_id,
            "event_id": result.get("eventId", "unknown")
        }
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### 2.2 Redis Streams Configuration

**File:** `services/api-gateway/src/config/redis.py`

```python
from redis.asyncio import Redis
from typing import Optional
import os

class RedisConfig:
    """Redis configuration for Path A pipeline."""
    
    # Connection settings
    URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Stream settings
    STREAM_MAXLEN: int = 1000           # Max events per match stream
    LIVE_MATCH_TTL: int = 3600          # 1 hour
    DEDUP_WINDOW: int = 60              # 60 seconds
    
    # Pub/Sub channels
    MATCH_EVENTS_CHANNEL = "match:events"
    SYSTEM_NOTIFICATIONS = "system:notifications"

# Initialize client
redis_client: Optional[Redis] = None

async def get_redis() -> Redis:
    """Get or create Redis client."""
    global redis_client
    if redis_client is None:
        redis_client = Redis.from_url(
            RedisConfig.URL,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
            health_check_interval=30
        )
    return redis_client

async def close_redis():
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
```

### 2.3 WebSocket Service

**File:** `services/websocket/src/main.py`

```python
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)
app = FastAPI()

class ConnectionManager:
    """
    Manages WebSocket connections with:
    - Per-match connection groups
    - Automatic cleanup
    - Connection metrics
    """
    
    def __init__(self, redis: Redis):
        self.redis = redis
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, dict] = {}
        self._cleanup_task: Optional[asyncio.Task] = None

    async def connect(self, match_id: str, websocket: WebSocket):
        """Register new connection."""
        await websocket.accept()
        
        if match_id not in self.active_connections:
            self.active_connections[match_id] = set()
        
        self.active_connections[match_id].add(websocket)
        self.connection_metadata[websocket] = {
            "match_id": match_id,
            "connected_at": datetime.utcnow().isoformat(),
            "client_ip": websocket.client.host if websocket.client else None,
            "user_agent": websocket.headers.get("user-agent", "unknown")
        }
        
        # Update connection count in Redis
        await self.redis.hincrby(f"match:{match_id}:stats", "connections", 1)
        
        logger.info(f"Client connected to match {match_id}")

    async def disconnect(self, match_id: str, websocket: WebSocket):
        """Remove connection."""
        if match_id in self.active_connections:
            self.active_connections[match_id].discard(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]
        
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
        
        # Update connection count
        await self.redis.hincrby(f"match:{match_id}:stats", "connections", -1)
        
        logger.info(f"Client disconnected from match {match_id}")

    async def broadcast_to_match(
        self,
        match_id: str,
        message: dict,
        exclude: Optional[WebSocket] = None
    ):
        """Send message to all connections for a match."""
        if match_id not in self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected = set()

        for connection in self.active_connections[match_id]:
            if connection == exclude:
                continue
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                disconnected.add(connection)

        # Cleanup failed connections
        for conn in disconnected:
            await self.disconnect(match_id, conn)

    async def send_heartbeat(self, match_id: str):
        """Send heartbeat to all connections."""
        await self.broadcast_to_match(match_id, {
            "type": "HEARTBEAT",
            "timestamp": int(datetime.utcnow().timestamp() * 1000)
        })

    async def listen_to_redis(self, match_id: str):
        """Listen for Redis events and broadcast to WebSocket clients."""
        stream_key = f"match:{match_id}:events"
        last_id = "0"
        
        while True:
            try:
                # Read new events from stream
                events = await self.redis.xread(
                    {stream_key: last_id},
                    count=100,
                    block=1000  # 1 second timeout
                )
                
                if events:
                    for stream, messages in events:
                        for message_id, data in messages:
                            last_id = message_id
                            
                            # Parse and broadcast
                            try:
                                payload = json.loads(data.get("payload", "{}"))
                                await self.broadcast_to_match(match_id, payload)
                            except json.JSONDecodeError as e:
                                logger.error(f"Invalid JSON in stream: {e}")
                                
            except Exception as e:
                logger.error(f"Redis listen error: {e}")
                await asyncio.sleep(1)  # Backoff on error

    async def start_heartbeat(self, match_id: str):
        """Start periodic heartbeat."""
        while match_id in self.active_connections:
            await self.send_heartbeat(match_id)
            await asyncio.sleep(30)  # 30 second interval

# Global manager instance
manager: Optional[ConnectionManager] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global manager
    redis = await get_redis()
    manager = ConnectionManager(redis)
    yield
    await close_redis()

app = FastAPI(lifespan=lifespan)

@app.websocket("/ws/matches/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: str):
    """
    WebSocket endpoint for live match updates.
    
    Protocol:
    - Connect to /ws/matches/{match_id}
    - Receive events: MATCH_START, SCORE_UPDATE, ROUND_END, MATCH_END
    - Heartbeat every 30s (respond with PONG)
    - Close connection when match ends
    """
    await manager.connect(match_id, websocket)
    
    # Start background tasks
    redis_listener = asyncio.create_task(
        manager.listen_to_redis(match_id)
    )
    heartbeat = asyncio.create_task(
        manager.start_heartbeat(match_id)
    )
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "PONG":
                # Client acknowledged heartbeat
                logger.debug(f"Heartbeat ACK from {match_id}")
            elif message.get("type") == "SUBSCRIBE":
                # Client subscription request
                pass
            else:
                logger.warning(f"Unknown message type: {message.get('type')}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for match {match_id}")
    except json.JSONDecodeError:
        logger.error("Invalid JSON from WebSocket client")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cleanup
        redis_listener.cancel()
        heartbeat.cancel()
        await manager.disconnect(match_id, websocket)
```

---

## 3. Path B: Legacy Data Pipeline

### 3.1 TeneT Verification Layer

**File:** `services/api/src/verification/tenet.py`

```python
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional, Any
from datetime import datetime
import hashlib
import json

class VerificationStatus(Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    CONFLICT = "conflict"
    MANUAL_REVIEW = "manual_review"
    REJECTED = "rejected"

class ConfidenceLevel(Enum):
    HIGH = "high"      # 90-100%
    MEDIUM = "medium"  # 70-89%
    LOW = "low"        # 50-69%
    UNCERTAIN = "uncertain"  # <50%

@dataclass
class SourceAttribution:
    source_id: str
    source_type: str  # 'pandascore', 'manual', 'simulation'
    value: Any
    timestamp: datetime
    confidence: float

@dataclass
class VerificationResult:
    entity_id: str
    entity_type: str  # 'match', 'player', 'team', 'tournament'
    status: VerificationStatus
    confidence_score: float
    confidence_level: ConfidenceLevel
    sources: List[SourceAttribution]
    conflicts: List[Dict[str, Any]]
    verified_at: Optional[datetime]
    verified_by: Optional[str]
    metadata: Dict[str, Any]

class TeneTVerifier:
    """
    TeneT Verification Layer for Path B pipeline.
    
    Responsibilities:
    - Aggregate data from multiple sources
    - Detect conflicts between sources
    - Calculate confidence scores
    - Route to manual review when needed
    """
    
    # Confidence weights by source type
    SOURCE_WEIGHTS = {
        'manual': 1.0,
        'pandascore': 0.9,
        'simulation': 0.7,
        'external_api': 0.6
    }
    
    # Conflict thresholds
    CONFLICT_THRESHOLD = 0.1  # 10% difference triggers conflict
    HIGH_CONFIDENCE_THRESHOLD = 0.9
    LOW_CONFIDENCE_THRESHOLD = 0.5
    
    def __init__(self, db_session):
        self.db = db_session
    
    def calculate_confidence(
        self,
        sources: List[SourceAttribution]
    ) -> tuple[float, List[Dict]]:
        """
        Calculate confidence score and detect conflicts.
        
        Returns: (confidence_score, conflicts)
        """
        if not sources:
            return 0.0, []
        
        # Weight sources by type and individual confidence
        weighted_values = []
        total_weight = 0
        
        for source in sources:
            weight = self.SOURCE_WEIGHTS.get(source.source_type, 0.5)
            weighted_values.append({
                'source': source,
                'weight': weight * source.confidence,
                'value': source.value
            })
            total_weight += weight * source.confidence
        
        # Detect conflicts for numeric values
        conflicts = []
        numeric_values = [
            wv for wv in weighted_values
            if isinstance(wv['value'], (int, float))
        ]
        
        if len(numeric_values) >= 2:
            values = [nv['value'] for nv in numeric_values]
            max_val, min_val = max(values), min(values)
            
            if max_val > 0 and (max_val - min_val) / max_val > self.CONFLICT_THRESHOLD:
                conflicts.append({
                    'type': 'value_discrepancy',
                    'field': 'value',
                    'max_value': max_val,
                    'min_value': min_val,
                    'sources': [
                        {'source_id': nv['source'].source_id, 'value': nv['value']}
                        for nv in numeric_values
                    ]
                })
        
        # Calculate weighted average confidence
        if total_weight > 0:
            avg_confidence = sum(
                wv['weight'] for wv in weighted_values
            ) / total_weight
        else:
            avg_confidence = 0.0
        
        # Adjust for conflicts
        if conflicts:
            avg_confidence *= 0.8  # Reduce confidence by 20%
        
        return round(avg_confidence, 2), conflicts
    
    def get_confidence_level(self, score: float) -> ConfidenceLevel:
        """Convert score to confidence level."""
        if score >= 0.9:
            return ConfidenceLevel.HIGH
        elif score >= 0.7:
            return ConfidenceLevel.MEDIUM
        elif score >= 0.5:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.UNCERTAIN
    
    async def verify_entity(
        self,
        entity_id: str,
        entity_type: str,
        raw_data: Dict[str, Any]
    ) -> VerificationResult:
        """
        Verify an entity and determine its status.
        
        Process:
        1. Fetch all sources for entity
        2. Calculate confidence score
        3. Detect conflicts
        4. Determine status
        5. Queue for review if needed
        """
        # Fetch sources from database
        sources = await self._fetch_sources(entity_id, entity_type)
        
        # Calculate confidence
        confidence_score, conflicts = self.calculate_confidence(sources)
        confidence_level = self.get_confidence_level(confidence_score)
        
        # Determine status
        if confidence_score >= self.HIGH_CONFIDENCE_THRESHOLD and not conflicts:
            status = VerificationStatus.VERIFIED
        elif conflicts:
            status = VerificationStatus.CONFLICT
        elif confidence_score < self.LOW_CONFIDENCE_THRESHOLD:
            status = VerificationStatus.MANUAL_REVIEW
        else:
            status = VerificationStatus.PENDING
        
        result = VerificationResult(
            entity_id=entity_id,
            entity_type=entity_type,
            status=status,
            confidence_score=confidence_score,
            confidence_level=confidence_level,
            sources=sources,
            conflicts=conflicts,
            verified_at=datetime.utcnow() if status == VerificationStatus.VERIFIED else None,
            verified_by=None,
            metadata={
                'raw_data': raw_data,
                'verification_version': '1.0'
            }
        )
        
        # Save result
        await self._save_verification_result(result)
        
        # Queue for review if needed
        if status in (VerificationStatus.CONFLICT, VerificationStatus.MANUAL_REVIEW):
            await self._queue_for_review(result)
        
        return result
    
    async def _fetch_sources(
        self,
        entity_id: str,
        entity_type: str
    ) -> List[SourceAttribution]:
        """Fetch all source attributions for an entity."""
        # Query database for sources
        # This would query the SourceAttribution table
        pass
    
    async def _save_verification_result(self, result: VerificationResult):
        """Save verification result to database."""
        # Insert into VerificationRecord table
        pass
    
    async def _queue_for_review(self, result: VerificationResult):
        """Add entity to manual review queue."""
        # Insert into ReviewQueue table
        pass
```

### 3.2 Database Schema

**File:** `infra/migrations/versions/006_path_b_schema.py`

```python
"""Path B verification schema

Revision ID: 006
Revises: 005
Create Date: 2026-04-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '006_path_b_schema'
down_revision = '005'
branch_labels = None
depends_on = None

def upgrade():
    # Verification records (Path B authoritative data)
    op.create_table(
        'verification_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('entity_id', sa.String(255), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False),  # match, player, team
        sa.Column('status', sa.String(50), nullable=False),  # verified, conflict, pending
        sa.Column('confidence_score', sa.Float, nullable=False),
        sa.Column('confidence_level', sa.String(20), nullable=False),
        sa.Column('verified_data', postgresql.JSONB, nullable=False),
        sa.Column('raw_sources', postgresql.JSONB, nullable=False),
        sa.Column('conflicts', postgresql.JSONB, nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    
    # Source attributions (multi-source tracking)
    op.create_table(
        'source_attributions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('entity_id', sa.String(255), nullable=False, index=True),
        sa.Column('source_id', sa.String(255), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),  # pandascore, manual
        sa.Column('source_data', postgresql.JSONB, nullable=False),
        sa.Column('confidence', sa.Float, nullable=False, default=1.0),
        sa.Column('collected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Review queue (manual review workflow)
    op.create_table(
        'review_queue',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('entity_id', sa.String(255), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='pending'),  # pending, reviewing, resolved
        sa.Column('priority', sa.String(20), nullable=False, default='medium'),  # high, medium, low
        sa.Column('reason', sa.String(255), nullable=False),  # conflict, low_confidence
        sa.Column('verification_record_id', sa.String(36), sa.ForeignKey('verification_records.id')),
        sa.Column('assigned_to', sa.String(255), nullable=True),
        sa.Column('resolution', sa.String(50), nullable=True),  # accepted, rejected, modified
        sa.Column('resolution_notes', sa.Text, nullable=True),
        sa.Column('flagged_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Indexes for performance
    op.create_index('idx_verification_entity', 'verification_records', ['entity_id', 'entity_type'])
    op.create_index('idx_verification_status', 'verification_records', ['status'])
    op.create_index('idx_source_entity', 'source_attributions', ['entity_id', 'source_type'])
    op.create_index('idx_review_status', 'review_queue', ['status', 'priority'])

def downgrade():
    op.drop_table('review_queue')
    op.drop_table('source_attributions')
    op.drop_table('verification_records')
```

### 3.3 History API Endpoints

**File:** `services/api/src/routers/history.py`

```python
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/history", tags=["history"])

# Pydantic models
class VerifiedMatchSummary(BaseModel):
    match_id: str
    game: str
    tournament: str
    team_a: str
    team_b: str
    score_a: int
    score_b: int
    played_at: datetime
    confidence_score: Optional[float] = None
    verification_status: str

class VerifiedMatchDetail(BaseModel):
    match_id: str
    game: str
    tournament: str
    teams: List[dict]
    rounds: Optional[List[dict]] = None
    economy: Optional[List[dict]] = None
    confidence_score: float
    confidence_breakdown: Optional[dict] = None
    sources: List[dict]
    verified_at: datetime

class PlayerHistory(BaseModel):
    player_id: str
    player_name: str
    matches: int
    wins: int
    avg_rating: float
    tournaments: List[str]

@router.get("/matches", response_model=List[VerifiedMatchSummary])
async def get_history_matches(
    game: Optional[str] = Query(None, description="Filter by game"),
    tournament_id: Optional[str] = Query(None, description="Filter by tournament"),
    include_confidence: bool = Query(False, description="Include confidence scores"),
    verified_only: bool = Query(True, description="Only verified matches"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500)
):
    """
    Get verified match history from Path B pipeline.
    
    This endpoint returns authoritative match data that has passed
    through the TeneT verification layer.
    """
    try:
        # Build query
        query = db.query(VerificationRecord).filter(
            VerificationRecord.entity_type == 'match'
        )
        
        if verified_only:
            query = query.filter(VerificationRecord.status == 'verified')
        if game:
            query = query.filter(VerificationRecord.verified_data['game'].astext == game)
        if tournament_id:
            query = query.filter(
                VerificationRecord.verified_data['tournament_id'].astext == tournament_id
            )
        
        # Execute query
        matches = query.order_by(
            VerificationRecord.verified_at.desc()
        ).offset(offset).limit(limit).all()
        
        # Transform to response
        results = []
        for m in matches:
            data = m.verified_data
            result = VerifiedMatchSummary(
                match_id=m.entity_id,
                game=data.get('game'),
                tournament=data.get('tournament', {}).get('name'),
                team_a=data.get('teams', [{}])[0].get('name'),
                team_b=data.get('teams', [{}, {}])[1].get('name'),
                score_a=data.get('score', {}).get('team_a', 0),
                score_b=data.get('score', {}).get('team_b', 0),
                played_at=m.verified_at,
                verification_status=m.status
            )
            if include_confidence:
                result.confidence_score = m.confidence_score
            results.append(result)
        
        return results
        
    except Exception as e:
        logger.error(f"Error fetching history matches: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/matches/{match_id}", response_model=VerifiedMatchDetail)
async def get_match_detail(
    match_id: str,
    include_rounds: bool = Query(True),
    include_economy: bool = Query(True),
    include_confidence: bool = Query(False)
):
    """
    Get comprehensive verified match details.
    
    Returns the full authoritative record with optional
    confidence breakdown and source attributions.
    """
    try:
        match = db.query(VerificationRecord).filter(
            VerificationRecord.entity_id == match_id,
            VerificationRecord.entity_type == 'match'
        ).first()
        
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        data = match.verified_data
        
        result = VerifiedMatchDetail(
            match_id=match.entity_id,
            game=data.get('game'),
            tournament=data.get('tournament', {}).get('name'),
            teams=data.get('teams', []),
            confidence_score=match.confidence_score,
            sources=match.raw_sources,
            verified_at=match.verified_at
        )
        
        if include_rounds:
            result.rounds = data.get('rounds')
        if include_economy:
            result.economy = data.get('economy')
        if include_confidence and match.confidence_breakdown:
            result.confidence_breakdown = match.confidence_breakdown
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching match {match_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 4. Integration & Testing

### 4.1 Integration Test Suite

**File:** `tests/integration/test_path_ab_pipeline.py`

```python
import pytest
import asyncio
import json
from datetime import datetime
from httpx import AsyncClient
import websockets

@pytest.mark.asyncio
class TestPathABPipeline:
    """End-to-end tests for Path A/B data pipeline."""
    
    async def test_full_path_a_pipeline(self):
        """Test: Webhook → Redis → WebSocket → Client"""
        match_id = f"test-{datetime.utcnow().timestamp()}"
        
        async with AsyncClient(base_url="http://localhost:8000") as client:
            # 1. Send webhook
            webhook_payload = {
                "match_id": match_id,
                "score": {
                    "team_1_id": "team-a",
                    "team_1": 2,
                    "team_2_id": "team-b",
                    "team_2": 1
                },
                "round_number": 5,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            response = await client.post(
                "/webhooks/pandascore/match-update",
                json=webhook_payload,
                headers={"X-Signature": self._generate_signature(webhook_payload)}
            )
            assert response.status_code == 200
            
            # 2. Verify Redis has event
            redis_data = await self._get_redis_event(match_id)
            assert redis_data is not None
            assert redis_data["type"] == "SCORE_UPDATE"
            
            # 3. Connect WebSocket and receive event
            async with websockets.connect(
                f"ws://localhost:8000/ws/matches/{match_id}"
            ) as ws:
                # Wait for event (should arrive within 1 second)
                msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                data = json.loads(msg)
                assert data["type"] == "SCORE_UPDATE"
                assert data["payload"]["teamA"]["score"] == 2
    
    async def test_path_b_verification(self):
        """Test: TeneT verification with confidence scoring."""
        async with AsyncClient(base_url="http://localhost:8000") as client:
            # Query history API
            response = await client.get(
                "/v1/history/matches?include_confidence=true&limit=10"
            )
            assert response.status_code == 200
            
            matches = response.json()
            for match in matches:
                # Verify all matches have confidence scores
                assert "confidence_score" in match
                assert 0 <= match["confidence_score"] <= 1
                
                # Verify status
                assert match["verification_status"] in [
                    "verified", "pending", "conflict"
                ]
    
    async def test_websocket_heartbeat(self):
        """Test: WebSocket heartbeat mechanism."""
        match_id = "heartbeat-test"
        
        async with websockets.connect(
            f"ws://localhost:8000/ws/matches/{match_id}"
        ) as ws:
            # Wait for heartbeat (30s interval, so check within 35s)
            msg = await asyncio.wait_for(ws.recv(), timeout=35.0)
            data = json.loads(msg)
            assert data["type"] == "HEARTBEAT"
            assert "timestamp" in data
            
            # Respond with PONG
            await ws.send(json.dumps({"type": "PONG"}))
    
    async def test_deduplication(self):
        """Test: Event deduplication prevents duplicates."""
        match_id = f"dedup-test-{datetime.utcnow().timestamp()}"
        event_id = "unique-event-123"
        
        async with AsyncClient(base_url="http://localhost:8000") as client:
            payload = {
                "match_id": match_id,
                "score": {"team_1": 1, "team_2": 0},
                "id": event_id
            }
            
            # Send same event twice
            r1 = await client.post(
                "/webhooks/pandascore/match-update",
                json=payload,
                headers={"X-Signature": self._generate_signature(payload)}
            )
            assert r1.status_code == 200
            
            r2 = await client.post(
                "/webhooks/pandascore/match-update",
                json=payload,
                headers={"X-Signature": self._generate_signature(payload)}
            )
            assert r2.status_code == 200
            # Second request should indicate duplicate
            assert r2.json()["status"] == "duplicate"
    
    async def test_latency_requirement(self):
        """Test: Path A latency < 500ms."""
        import time
        
        match_id = f"latency-test-{datetime.utcnow().timestamp()}"
        
        async with AsyncClient(base_url="http://localhost:8000") as client:
            async with websockets.connect(
                f"ws://localhost:8000/ws/matches/{match_id}"
            ) as ws:
                start = time.time()
                
                # Send webhook
                await client.post(
                    "/webhooks/pandascore/match-update",
                    json={
                        "match_id": match_id,
                        "score": {"team_1": 1, "team_2": 0}
                    },
                    headers={"X-Signature": "test-sig"}
                )
                
                # Wait for event on WebSocket
                await asyncio.wait_for(ws.recv(), timeout=1.0)
                elapsed = (time.time() - start) * 1000
                
                assert elapsed < 500, f"Latency {elapsed}ms exceeds 500ms threshold"
```

---

## 5. Deployment & Operations

### 5.1 Docker Compose Services

```yaml
# docker-compose.data-pipeline.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - PANDASCORE_WEBHOOK_SECRET=${PANDASCORE_SECRET}
    depends_on:
      redis:
        condition: service_healthy
      db:
        condition: service_healthy

  websocket:
    build:
      context: ./services/websocket
      dockerfile: Dockerfile
    ports:
      - "8001:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - WS_HEARTBEAT_INTERVAL=30
    depends_on:
      - redis

volumes:
  redis-data:
```

### 5.2 Environment Variables

```bash
# Path A (Live)
REDIS_URL=redis://localhost:6379
PANDASCORE_WEBHOOK_SECRET=your-secret-here
WEBSOCKET_HEARTBEAT_INTERVAL=30
WEBSOCKET_MAX_CONNECTIONS=10000

# Path B (Legacy)
DATABASE_URL=postgresql://user:pass@localhost/njz
TENET_HIGH_CONFIDENCE_THRESHOLD=0.9
TENET_LOW_CONFIDENCE_THRESHOLD=0.5
TENET_CONFLICT_THRESHOLD=0.1

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
METRICS_ENABLED=true
```

---

## 6. Acceptance Criteria

### 6.1 Path A Requirements

- [ ] Webhook accepts Pandascore events with HMAC verification
- [ ] Events routed to Redis Streams within 100ms
- [ ] WebSocket broadcasts events to connected clients
- [ ] Heartbeat sent every 30 seconds
- [ ] Deduplication prevents duplicate processing
- [ ] Latency < 500ms end-to-end
- [ ] Supports 1000+ concurrent connections

### 6.2 Path B Requirements

- [ ] TeneT verification calculates confidence scores
- [ ] Conflict detection identifies source discrepancies
- [ ] Low confidence items queued for manual review
- [ ] History API returns verified data with confidence
- [ ] Database schema supports multi-source attribution
- [ ] Review queue accessible to admin users

### 6.3 Integration Requirements

- [ ] Both paths can operate simultaneously
- [ ] Path A events eventually feed into Path B
- [ ] Failover mechanisms in place
- [ ] All integration tests pass
- [ ] Load test: 100 msg/sec sustained
- [ ] Monitoring dashboards active

---

## 7. Implementation Phases

### Phase 1: Path A Core (6 hours)
- [ ] Webhook handler with HMAC auth
- [ ] Redis Streams configuration
- [ ] WebSocket service with heartbeat
- [ ] Basic integration tests

### Phase 2: Path B Core (6 hours)
- [ ] TeneT verifier with confidence scoring
- [ ] Database schema migration
- [ ] History API endpoints
- [ ] Review queue admin API

### Phase 3: Integration (4 hours)
- [ ] Frontend useLiveMatch hook
- [ ] ConfidenceScoreBadge component
- [ ] End-to-end integration tests
- [ ] Load testing

---

## 8. Related Documents

| Document | Link | Purpose |
|----------|------|---------|
| Source Extraction | [EX-DATA-001](../../.agents/PHASE_3-6_FINAL_IMPLEMENTATION_PLAN.md) | Original specification |
| Backlog Item | [TD-P4-001](../../todo/backlog/BACKLOG.md) | Task tracking |
| TENET Topology | [TENET_TOPOLOGY](../../docs/architecture/TENET_TOPOLOGY.md) | System architecture |
| Video System | [VIDEO_RECORDING_SYSTEM](../../docs/architecture/VIDEO_RECORDING_SYSTEM.md) | Related system |

---

## 9. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.000 | 2026-04-01 | Initial specification from EX-DATA-001 |

---

*Specification Complete - Ready for Implementation*
