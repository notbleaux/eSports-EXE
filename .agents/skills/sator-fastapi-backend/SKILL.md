---
name: sator-fastapi-backend
description: "FastAPI async backend development for 4NJZ4 TENET Platform. USE FOR: API endpoints, Pydantic schemas, async database operations, middleware, health checks. Location: packages/shared/api/. DO NOT USE FOR: synchronous Flask/Django, non-async APIs, non-SATOR backends."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR FastAPI Backend

> **ASYNC-ONLY API**
>
> Location: `packages/shared/api/`
> All endpoints must use async/await.
> Use Pydantic for validation, asyncpg for database.
> Health checks required: /health, /ready, /live
> API v1 prefix: `/v1/`

## Triggers

Activate this skill when user wants to:
- Create FastAPI endpoints for esports data
- Implement Pydantic schemas for validation
- Build async database operations with asyncpg
- Create API middleware (firewall, CORS, logging)
- Implement health check endpoints
- Set up OpenAPI documentation

## Rules

1. **Async Endpoints** — All route handlers must be async
2. **Pydantic Validation** — Use Pydantic models for request/response
3. **Health Checks** — Required: /health, /ready, /live
4. **Firewall Middleware** — All responses pass through data firewall
5. **Connection Pooling** — Use asyncpg with min=1, max=5
6. **API Versioning** — Use `/v1/` prefix for all endpoints
7. **Error Handling** — Graceful errors with proper HTTP status codes

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| FastAPI async development | Flask, Django, synchronous frameworks |
| Pydantic schema validation | Manual JSON parsing |
| asyncpg database operations | SQLAlchemy ORM, synchronous DB |
| Health check endpoints | Custom monitoring solutions |
| OpenAPI documentation | Manual API documentation |
| API middleware | Web server (nginx) configuration |

## Project Structure

```
packages/shared/api/
├── main.py                      # FastAPI entry point
├── requirements.txt             # Dependencies
├── Dockerfile                   # Container definition
├── src/
│   ├── __init__.py
│   ├── config.py               # Configuration
│   ├── database.py             # asyncpg pool
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── players.py          # Player endpoints
│   │   ├── matches.py          # Match endpoints
│   │   ├── analytics.py        # Analytics endpoints
│   │   ├── search.py           # Full-text search
│   │   └── health.py           # Health checks
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── firewall.py         # Data partition firewall
│   │   ├── cors.py             # CORS configuration
│   │   └── logging.py          # Request logging
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── player.py           # Player schemas
│   │   ├── match.py            # Match schemas
│   │   └── analytics.py        # Analytics schemas
│   └── services/
│       ├── __init__.py
│       └── query_service.py    # Database queries
└── tests/
    └── test_api.py
```

## Main Application

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from src.database import DatabasePool
from src.routes import players, matches, analytics, search, health
from src.middleware.firewall import firewall_middleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await DatabasePool.initialize()
    yield
    # Shutdown
    await DatabasePool.close()

app = FastAPI(
    title="SATOR Esports API",
    description="API for esports analytics platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sator-web.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes - ALL prefixed with /v1
app.include_router(health.router, tags=["health"])
app.include_router(players.router, prefix="/v1", tags=["players"])
app.include_router(matches.router, prefix="/v1", tags=["matches"])
app.include_router(analytics.router, prefix="/v1", tags=["analytics"])
app.include_router(search.router, prefix="/v1", tags=["search"])

# Firewall middleware (applied to all routes)
app.middleware("http")(firewall_middleware)
```

## Database Pool

```python
# src/database.py
import asyncpg
from typing import Optional
import os

class DatabasePool:
    _pool: Optional[asyncpg.Pool] = None
    
    @classmethod
    async def initialize(cls) -> None:
        cls._pool = await asyncpg.create_pool(
            os.getenv("DATABASE_URL"),
            min_size=1,
            max_size=5,
            command_timeout=60,
        )
    
    @classmethod
    async def close(cls) -> None:
        if cls._pool:
            await cls._pool.close()
    
    @classmethod
    def get_pool(cls) -> asyncpg.Pool:
        if cls._pool is None:
            raise RuntimeError("Database pool not initialized")
        return cls._pool
```

## Pydantic Schemas

```python
# src/schemas/player.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PlayerBase(BaseModel):
    player_id: str = Field(..., description="Unique player identifier")
    name: str = Field(..., description="Player display name")
    team_id: Optional[str] = Field(None, description="Current team")
    role: Optional[str] = Field(None, description="Player role")

class PlayerStats(BaseModel):
    sim_rating: float = Field(..., ge=0, le=1000, description="SimRating")
    raw_acs: float = Field(..., ge=0, description="Average combat score")
    kd_ratio: float = Field(..., ge=0, description="K/D ratio")
    adr: float = Field(..., ge=0, description="Average damage per round")
    
class PlayerResponse(PlayerBase):
    stats: PlayerStats
    last_match: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PlayerListResponse(BaseModel):
    players: List[PlayerResponse]
    total: int
    page: int
    page_size: int
```

## Route Handlers

```python
# src/routes/players.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from src.database import DatabasePool
from src.schemas.player import PlayerResponse, PlayerListResponse

router = APIRouter()

@router.get("/players", response_model=PlayerListResponse)
async def list_players(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    team_id: Optional[str] = None,
    role: Optional[str] = None,
):
    """List players with optional filtering."""
    pool = DatabasePool.get_pool()
    
    async with pool.acquire() as conn:
        # Build query
        where_clauses = []
        params = []
        
        if team_id:
            where_clauses.append("team_id = $1")
            params.append(team_id)
        if role:
            where_clauses.append(f"role = ${len(params) + 1}")
            params.append(role)
        
        where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
        
        # Count total
        count_sql = f"SELECT COUNT(*) FROM players WHERE {where_sql}"
        total = await conn.fetchval(count_sql, *params)
        
        # Fetch players
        offset = (page - 1) * page_size
        sql = f"""
            SELECT p.*, 
                   json_build_object(
                       'sim_rating', s.sim_rating,
                       'raw_acs', s.raw_acs,
                       'kd_ratio', s.kd_ratio,
                       'adr', s.adr
                   ) as stats
            FROM players p
            LEFT JOIN player_stats s ON p.player_id = s.player_id
            WHERE {where_sql}
            ORDER BY p.name
            LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        params.extend([page_size, offset])
        
        rows = await conn.fetch(sql, *params)
        players = [dict(row) for row in rows]
        
        return PlayerListResponse(
            players=players,
            total=total,
            page=page,
            page_size=page_size,
        )

@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: str):
    """Get player by ID."""
    pool = DatabasePool.get_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT p.*, 
                   json_build_object(...) as stats
            FROM players p
            LEFT JOIN player_stats s ON p.player_id = s.player_id
            WHERE p.player_id = $1
            """,
            player_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="Player not found")
        
        return dict(row)
```

## Health Checks

```python
# src/routes/health.py
from fastapi import APIRouter, status
from pydantic import BaseModel
from datetime import datetime
import os

from src.database import DatabasePool

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    timestamp: datetime
    environment: str

class ReadyResponse(BaseModel):
    ready: bool
    checks: dict

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check."""
    db_status = "connected"
    try:
        pool = DatabasePool.get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception:
        db_status = "disconnected"
    
    return HealthResponse(
        status="healthy" if db_status == "connected" else "unhealthy",
        service="sator-api",
        version="1.0.0",
        database=db_status,
        timestamp=datetime.utcnow(),
        environment=os.getenv("APP_ENVIRONMENT", "development"),
    )

@router.get("/ready", response_model=ReadyResponse)
async def readiness_check():
    """Readiness check for Kubernetes/orchestration."""
    checks = {}
    
    # Database check
    try:
        pool = DatabasePool.get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        checks["database"] = True
    except Exception as e:
        checks["database"] = False
    
    return ReadyResponse(
        ready=all(checks.values()),
        checks=checks,
    )

@router.get("/live")
async def liveness_check():
    """Liveness check - basic process health."""
    return {"status": "alive"}
```

## Firewall Middleware

```python
# src/middleware/firewall.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import json

GAME_ONLY_FIELDS = {
    'internal_agent_state',
    'radar_data',
    'detailed_replay_frame_data',
    'simulation_tick',
    'seed_value',
    'vision_cone_data',
    'smoke_tick_data',
    'recoil_pattern',
}

async def firewall_middleware(request: Request, call_next):
    """Remove game-only fields from responses."""
    response = await call_next(request)
    
    # Only process JSON responses
    if response.headers.get("content-type") == "application/json":
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        try:
            data = json.loads(body)
            sanitized = sanitize_data(data)
            
            return Response(
                content=json.dumps(sanitized),
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type="application/json",
            )
        except json.JSONDecodeError:
            pass
    
    return response

def sanitize_data(data: dict) -> dict:
    """Remove game-only fields from data."""
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    for key, value in data.items():
        if key not in GAME_ONLY_FIELDS:
            if isinstance(value, dict):
                sanitized[key] = sanitize_data(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    sanitize_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
    return sanitized
```

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
API_HOST=0.0.0.0
API_PORT=8000

# Optional
APP_ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://sator-web.vercel.app
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

## Running the API

```bash
cd packages/shared/api

# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

# With Docker
docker build -t sator-api .
docker run -p 8000:8000 --env-file .env sator-api
```

## API Documentation

When running, access docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
