[Ver018.000]

# SATOR / eSports-EXE Comprehensive Project Plan
## Phase 2: Database Integration, Refinement & Enhancement

**Date:** 2026-03-05  
**Status:** Planning Phase  
**Budget:** $0 (Free Tier Only)  
**Target Completion:** 14 Days

---

## Executive Summary

This plan addresses all remaining issues from the CRIT assessment, establishes SQL database connections using free-tier services, and adds three major enhancements to elevate the platform to production-ready status.

### Objectives
1. ✅ Consolidate duplicate C# solution files
2. ✅ Verify & enhance Docker Compose with API service
3. ✅ Consolidate root documentation
4. ✅ Connect SQL Database (Supabase Free Tier - $0)
5. ✅ Enhance Pipeline API & Data Collection
6. ✅ Refine Website Webpages
7. ✅ **BONUS:** Add 3 Major Components:
   - Analytics Dashboard Backend API
   - Real-time WebSocket Layer
   - Automated Backup System

---

## Phase 1: Database Infrastructure Setup (Free Tier)

### 1.1 Supabase PostgreSQL Setup (Primary Database)

**Service:** [Supabase](https://supabase.com) — Free Tier ($0/month)
- 500MB Database Storage
- 2M Row Reads/month
- 500MB Bandwidth/month
- 30 Max Connections

#### Implementation Steps:

```bash
# 1. Create Supabase Project
curl -X POST 'https://api.supabase.io/v1/projects' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "name": "sator-esports-production",
    "organization_id": "YOUR_ORG_ID",
    "region": "us-east-1"
  }'

# 2. Run Migrations
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/001_initial_schema.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/002_sator_layers.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/003_dual_storage.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/004_extraction_log.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/005_staging_system.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/006_monitoring_tables.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/007_dual_game_partitioning.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/008_dashboard_tables.sql
psql "$(supabase db connection-string)" -f shared/axiom-esports-data/infrastructure/migrations/009_alert_scheduler_tables.sql
```

#### Configuration File Updates:

**File:** `shared/axiom-esports-data/.env.production.local` (Create from template)

```env
# Supabase Connection (Free Tier Optimized)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Connection Pool Settings (For 30 max connections limit)
DB_MIN_CONNECTIONS=1
DB_MAX_CONNECTIONS=5
DB_CONNECTION_TIMEOUT=30

# Supabase Settings
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
```

### 1.2 Database Connection Manager

**Create:** `shared/axiom-esports-data/api/src/db_manager.py`

```python
"""
Database Connection Manager — Supabase Free Tier Optimized

Features:
- Connection pooling with conservative limits
- Automatic retry with exponential backoff
- Query timeout protection
- Connection health monitoring
"""

import asyncpg
import logging
from contextlib import asynccontextmanager
from typing import Optional
import os

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages PostgreSQL connections for Supabase free tier."""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv("DATABASE_URL")
        self.min_size = int(os.getenv("DB_MIN_CONNECTIONS", "1"))
        self.max_size = int(os.getenv("DB_MAX_CONNECTIONS", "5"))
        
    async def initialize(self):
        """Initialize connection pool."""
        if not self.database_url:
            logger.warning("DATABASE_URL not set — running in stub mode")
            return
            
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=self.min_size,
                max_size=self.max_size,
                command_timeout=30,
                server_settings={
                    'jit': 'off',  # Disable JIT for faster simple queries
                    'application_name': 'sator_api'
                }
            )
            logger.info(f"Database pool created: {self.min_size}-{self.max_size} connections")
            
            # Test connection
            async with self.pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                logger.info(f"Connected: {version[:50]}")
                
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    async def close(self):
        """Close all connections."""
        if self.pool:
            await self.pool.close()
            logger.info("Database pool closed")
    
    @asynccontextmanager
    async def acquire(self):
        """Acquire connection from pool."""
        if not self.pool:
            raise RuntimeError("Database not initialized")
        async with self.pool.acquire() as conn:
            yield conn
    
    async def execute(self, query: str, *args):
        """Execute query."""
        async with self.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch(self, query: str, *args):
        """Fetch multiple rows."""
        async with self.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """Fetch single row."""
        async with self.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args):
        """Fetch single value."""
        async with self.acquire() as conn:
            return await conn.fetchval(query, *args)

# Global instance
db = DatabaseManager()
```

### 1.3 Database Migration Runner

**Create:** `shared/axiom-esports-data/scripts/run_migrations.py`

```python
#!/usr/bin/env python3
"""
Database Migration Runner

Usage:
    python run_migrations.py --env=production
    python run_migrations.py --env=development --dry-run
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

async def run_migrations(env: str, dry_run: bool = False):
    """Run all database migrations."""
    
    # Load environment
    env_file = f".env.{env}" if env != "development" else ".env"
    load_dotenv(env_file)
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print(f"❌ DATABASE_URL not found in {env_file}")
        sys.exit(1)
    
    # Find migrations
    migrations_dir = Path(__file__).parent.parent / "infrastructure" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))
    
    print(f"📦 Found {len(migration_files)} migrations")
    print(f"🎯 Environment: {env}")
    print(f"🧪 Dry run: {dry_run}")
    print()
    
    if dry_run:
        for mig_file in migration_files:
            print(f"  • {mig_file.name}")
        return
    
    # Connect and run migrations
    conn = await asyncpg.connect(database_url)
    
    try:
        # Create migrations tracking table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64)
            )
        """)
        
        for mig_file in migration_files:
            version = mig_file.stem
            
            # Check if already applied
            applied = await conn.fetchval(
                "SELECT 1 FROM schema_migrations WHERE version = $1",
                version
            )
            
            if applied:
                print(f"  ✓ {version} (already applied)")
                continue
            
            # Read and execute migration
            sql = mig_file.read_text()
            
            print(f"  🔄 {version}...", end=" ", flush=True)
            
            try:
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (version) VALUES ($1)",
                    version
                )
                print("✅")
            except Exception as e:
                print(f"❌ {e}")
                raise
        
        print("\n✅ All migrations completed successfully!")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--env", default="development", choices=["development", "production", "staging"])
    parser.add_argument("--dry-run", action="store_true", help="Show migrations without running")
    args = parser.parse_args()
    
    asyncio.run(run_migrations(args.env, args.dry_run))
```

---

## Phase 2: C# Solution Consolidation

### 2.1 Analysis of Duplicate Solutions

**Current State:**
- `tactical-fps-sim-core.sln` — Uses `{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}` (older format)
- `TacticalFpsSim.sln` — Uses `{9A19103F-16F7-4668-BE54-9A1E7A4F7556}` (SDK-style)

**Decision:** Keep `TacticalFpsSim.sln` (SDK-style, modern format), remove the other.

### 2.2 Implementation

**Action:** Remove duplicate solution file

```bash
# Remove old solution
rm simulation-game/tactical-fps-sim-core-updated/tactical-fps-sim-core.sln

# Verify build works
cd simulation-game/tactical-fps-sim-core-updated
dotnet build TacticalFpsSim.sln
```

**Update:** `simulation-game/tactical-fps-sim-core-updated/README.md` to reference correct solution.

---

## Phase 3: Docker Compose Enhancement

### 3.1 Updated Docker Compose with API Service

**File:** `shared/axiom-esports-data/infrastructure/docker-compose.yml`

```yaml
version: '3.9'

services:
  # PostgreSQL with TimescaleDB
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: axiom_postgres
    environment:
      POSTGRES_DB: axiom_esports
      POSTGRES_USER: ${POSTGRES_USER:-axiom}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-axiom}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - sator_network

  # Redis for caching and rate limiting
  redis:
    image: redis:7-alpine
    container_name: axiom_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - sator_network

  # FastAPI Application
  api:
    build:
      context: ../..
      dockerfile: shared/axiom-esports-data/api/Dockerfile
    container_name: sator_api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-axiom}:${POSTGRES_PASSWORD:-changeme}@postgres:5432/axiom_esports
      - REDIS_URL=redis://redis:6379/0
      - API_PORT=8000
      - API_HOST=0.0.0.0
      - LOG_LEVEL=INFO
      - APP_ENVIRONMENT=development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ../api:/app/api:ro
      - ../../shared:/app/shared:ro
    networks:
      - sator_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Pipeline Worker (optional - for data processing)
  pipeline:
    build:
      context: ../..
      dockerfile: shared/axiom-esports-data/api/Dockerfile
    container_name: sator_pipeline
    command: python -m pipeline.orchestrator --mode=delta --epochs=3
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-axiom}:${POSTGRES_PASSWORD:-changeme}@postgres:5432/axiom_esports
      - REDIS_URL=redis://redis:6379/0
      - LOG_LEVEL=INFO
    depends_on:
      - postgres
      - redis
      - api
    volumes:
      - ../:/app/pipeline:ro
      - pipeline_data:/app/data
    networks:
      - sator_network
    profiles:
      - pipeline  # Only start when explicitly requested

volumes:
  postgres_data:
  redis_data:
  pipeline_data:

networks:
  sator_network:
    driver: bridge
```

### 3.2 Dockerfile Optimization

**Create:** `shared/axiom-esports-data/api/Dockerfile` (Production-optimized)

```dockerfile
# =============================================================================
# SATOR API - Production Docker Image
# Multi-stage build for optimized size
# =============================================================================

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY shared/axiom-esports-data/api/requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim as runtime

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts are executable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY shared/axiom-esports-data/api/main.py .
COPY shared/axiom-esports-data/api/src/ ./src/
COPY shared/axiom-esports-data/analytics/ ./analytics/
COPY shared/axiom-esports-data/extraction/ ./extraction/
COPY shared/axiom-esports-data/pipeline/ ./pipeline/

# Create non-root user
RUN useradd -m -u 1000 sator && chown -R sator:sator /app
USER sator

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

---

## Phase 4: Root Documentation Consolidation

### 4.1 Create Unified Root Documentation

**Create:** `README_ROOT.md` → Rename to `README.md`

```markdown
# SATOR / eSports-EXE Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Quick Links

- 🌐 **Website:** [Live Demo](https://satorx.github.io/eSports-EXE)
- 📚 **Documentation:** [Full Docs](./shared/docs/)
- 🔧 **API Docs:** [Redoc](./shared/axiom-esports-data/docs/API_REFERENCE.md)
- 🎮 **Game:** [RadiantX Simulation](./simulation-game/)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Website    │  │  React App   │  │   Godot Game (Sim)   │  │
│  │   (Static)   │  │  (sator-web) │  │   (RadiantX)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          └─────────────────┼─────────────────────┘
                            │ HTTPS/REST
┌───────────────────────────▼───────────────────────────────────┐
│                      API LAYER (FastAPI)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • Players API    • Matches API    • Analytics API     │  │
│  │  • Firewall       • Rate Limiting  • Authentication    │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                   DATA LAYER (Supabase)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • PostgreSQL + TimescaleDB  • Row-Level Security     │  │
│  │  • Real-time Subscriptions   • Connection Pooling     │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- Godot 4.x (for game development)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# 2. Start database infrastructure
cd shared/axiom-esports-data/infrastructure
docker-compose up -d

# 3. Run migrations
python ../scripts/run_migrations.py --env=development

# 4. Start API server
cd ../api
pip install -r requirements.txt
uvicorn main:app --reload

# 5. Start web app (new terminal)
cd shared/apps/sator-web
npm install
npm run dev

# 6. Open game in Godot Editor (optional)
# Open simulation-game/project.godot
```

### Environment Setup

```bash
# Copy environment templates
cp shared/axiom-esports-data/.env.example shared/axiom-esports-data/.env
cp shared/apps/sator-web/.env.example shared/apps/sator-web/.env.local

# Edit with your values
nano shared/axiom-esports-data/.env
```

## Project Structure

```
/
├── website/                    # Static website (HTML/CSS/JS)
│   ├── hubs/                   # 5 hub pages (analytics, esports, etc.)
│   └── design-system/          # Porcelain Cubed CSS framework
│
├── simulation-game/            # Godot 4 tactical FPS simulation
│   ├── scripts/                # GDScript game logic
│   └── tactical-fps-sim-core/  # C# simulation core
│
├── shared/                     # Shared components
│   ├── apps/
│   │   ├── sator-web/          # React frontend (Vite + TypeScript)
│   │   └── radiantx-game/      # Game integration modules
│   │
│   ├── axiom-esports-data/     # Python data pipeline
│   │   ├── api/                # FastAPI REST service
│   │   ├── pipeline/           # Data orchestration
│   │   ├── analytics/          # SimRating, RAR calculations
│   │   └── infrastructure/     # Docker, migrations
│   │
│   ├── packages/               # TypeScript packages
│   │   ├── stats-schema/       # Public type definitions
│   │   └── data-partition-lib/ # Firewall enforcement
│   │
│   └── docs/                   # Documentation
│
└── tests/                      # Test suites
    └── integration/            # End-to-end tests
```

## Deployment

### Production (Render + Vercel + Supabase)

1. **Database:** [Supabase](https://supabase.com) (Free Tier)
2. **API:** [Render](https://render.com) (Free Tier)
3. **Web:** [Vercel](https://vercel.com) or [GitHub Pages](https://pages.github.com) (Free)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

- **RadiantX Game:** MIT License
- **Axiom Esports Data:** CC BY-NC 4.0 (Non-commercial)
- **Website:** MIT License

## Support

- 📧 Email: support@satorx.gg
- 💬 Discord: [Join Server](https://discord.gg/satorx)
- 🐛 Issues: [GitHub Issues](https://github.com/notbleaux/eSports-EXE/issues)
```

### 4.2 Consolidate Documentation Files

Create symlinks or unified references for:

```bash
# Move root docs to shared/docs/root/
mkdir -p shared/docs/root

# Create consolidated versions
cat shared/docs/AGENT_DATA_PROCESS.md shared/docs/AGENT_RUNBOOK.md > shared/docs/root/AGENTS_COMPLETE.md
cat ARCHITECTURE.md DEPLOYMENT_ARCHITECTURE.md > shared/docs/root/ARCHITECTURE_COMPLETE.md

# Keep essential files at root (symlink or copy)
ln -sf shared/docs/root/README.md README.md
ln -sf shared/docs/CONTRIBUTING.md CONTRIBUTING.md
ln -sf shared/docs/LICENSE LICENSE
```

---

## Phase 5: Pipeline API & Data Collection Enhancement

### 5.1 Enhanced Data Collection API

**Create:** `shared/axiom-esports-data/api/src/routes/collection.py`

```python
"""
Data Collection API — Trigger and Monitor Pipeline Runs
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import asyncio

router = APIRouter(prefix="/api/collection", tags=["collection"])

class CollectionRequest(BaseModel):
    mode: str = "delta"  # delta, full, backfill
    epochs: Optional[List[int]] = None
    source: str = "vlr"  # vlr, hltv, liquipedia
    priority: int = 5  # 1-10 (1 = highest)

class CollectionStatus(BaseModel):
    job_id: str
    status: str  # queued, running, completed, failed
    progress: float  # 0-100
    records_processed: int
    records_failed: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    logs: List[str]

# In-memory job store (replace with Redis in production)
job_store = {}

@router.post("/start", response_model=CollectionStatus)
async def start_collection(
    request: CollectionRequest,
    background_tasks: BackgroundTasks
):
    """Start a new data collection job."""
    job_id = f"collection_{datetime.utcnow().timestamp()}"
    
    job_store[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0.0,
        "records_processed": 0,
        "records_failed": 0,
        "logs": [f"Job queued: {request.mode} mode"]
    }
    
    background_tasks.add_task(run_collection_job, job_id, request)
    
    return CollectionStatus(**job_store[job_id])

@router.get("/status/{job_id}", response_model=CollectionStatus)
async def get_collection_status(job_id: str):
    """Get status of a collection job."""
    if job_id not in job_store:
        raise HTTPException(status_code=404, detail="Job not found")
    return CollectionStatus(**job_store[job_id])

@router.get("/active", response_model=List[CollectionStatus])
async def list_active_collections():
    """List all active collection jobs."""
    active = [job for job in job_store.values() if job["status"] in ("queued", "running")]
    return [CollectionStatus(**job) for job in active]

async def run_collection_job(job_id: str, request: CollectionRequest):
    """Background task to run collection."""
    job = job_store[job_id]
    job["status"] = "running"
    job["started_at"] = datetime.utcnow()
    
    try:
        # Import and run orchestrator
        from pipeline.orchestrator import run_pipeline
        
        result = await run_pipeline(
            mode=request.mode,
            epochs=request.epochs or [3],  # Default to current epoch
            source=request.source
        )
        
        job["status"] = "completed"
        job["progress"] = 100.0
        job["records_processed"] = result.records_stored
        job["records_failed"] = result.records_failed
        job["logs"].append(f"Completed: {result.records_stored} records stored")
        
    except Exception as e:
        job["status"] = "failed"
        job["logs"].append(f"Error: {str(e)}")
    
    job["completed_at"] = datetime.utcnow()
```

### 5.2 WebSocket Real-time Updates

**Create:** `shared/axiom-esports-data/api/src/websocket.py`

```python
"""
WebSocket Manager — Real-time Pipeline Updates
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio

class ConnectionManager:
    """Manage WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.pipeline_subscribers: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        # Remove from all subscriptions
        for subscribers in self.pipeline_subscribers.values():
            if websocket in subscribers:
                subscribers.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)
    
    async def send_pipeline_update(self, job_id: str, data: dict):
        """Send update to pipeline subscribers."""
        if job_id in self.pipeline_subscribers:
            message = {
                "type": "pipeline_update",
                "job_id": job_id,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            disconnected = []
            for websocket in self.pipeline_subscribers[job_id]:
                try:
                    await websocket.send_json(message)
                except:
                    disconnected.append(websocket)
            
            for conn in disconnected:
                self.pipeline_subscribers[job_id].remove(conn)

manager = ConnectionManager()

# WebSocket endpoint
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle subscription requests
            if data.get("action") == "subscribe_pipeline":
                job_id = data.get("job_id")
                if job_id:
                    if job_id not in manager.pipeline_subscribers:
                        manager.pipeline_subscribers[job_id] = []
                    manager.pipeline_subscribers[job_id].append(websocket)
                    await websocket.send_json({"status": "subscribed", "job_id": job_id})
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

---

## Phase 6: Website Webpages Refinement

### 6.1 Hub Navigation Improvements

**Update:** `website/js/router.js`

```javascript
/**
 * Enhanced Router with Lazy Loading & Transitions
 */

class SatorRouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.cache = new Map(); // Route component cache
    
    // Initialize
    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => this.handleLinkClick(e));
  }
  
  register(path, options) {
    this.routes.set(path, {
      component: options.component,
      title: options.title || 'SATOR',
      preload: options.preload || false,
      auth: options.auth || false
    });
    
    // Preload if specified
    if (options.preload) {
      this.preloadRoute(path);
    }
  }
  
  async navigate(path, options = {}) {
    const route = this.routes.get(path);
    if (!route) {
      console.error(`Route not found: ${path}`);
      return this.navigate('/404');
    }
    
    // Check auth
    if (route.auth && !this.isAuthenticated()) {
      return this.navigate('/login', { redirect: path });
    }
    
    // Transition out
    await this.transitionOut();
    
    // Load component
    let component = this.cache.get(path);
    if (!component) {
      component = await this.loadComponent(route.component);
      this.cache.set(path, component);
    }
    
    // Render
    const outlet = document.getElementById('router-outlet');
    outlet.innerHTML = '';
    outlet.appendChild(component);
    
    // Update state
    this.currentRoute = path;
    document.title = route.title;
    
    if (!options.replace) {
      history.pushState({ path }, route.title, path);
    }
    
    // Transition in
    await this.transitionIn();
    
    // Track analytics
    this.trackPageView(path);
  }
  
  async loadComponent(url) {
    const response = await fetch(url);
    const html = await response.text();
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }
  
  transitionOut() {
    return new Promise(resolve => {
      const outlet = document.getElementById('router-outlet');
      outlet.classList.add('page-exit');
      setTimeout(resolve, 300);
    });
  }
  
  transitionIn() {
    return new Promise(resolve => {
      const outlet = document.getElementById('router-outlet');
      outlet.classList.remove('page-exit');
      outlet.classList.add('page-enter');
      setTimeout(() => {
        outlet.classList.remove('page-enter');
        resolve();
      }, 300);
    });
  }
}

// Export singleton
export const router = new SatorRouter();
```

### 6.2 Analytics Hub Data Integration

**Update:** `website/hubs/analytics/js/analytics.js`

```javascript
/**
 * Analytics Hub — API Integration
 */

class AnalyticsAPI {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000' 
      : 'https://sator-api.onrender.com';
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }
  
  async fetchPlayers(filters = {}) {
    const cacheKey = `players_${JSON.stringify(filters)}`;
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < this.cacheTTL) {
        return data;
      }
    }
    
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/api/players/?${params}`);
    const data = await response.json();
    
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
  
  async fetchPlayerAnalytics(playerId) {
    const [simrating, rar, investment] = await Promise.all([
      fetch(`${this.baseURL}/api/analytics/simrating/${playerId}`).then(r => r.json()),
      fetch(`${this.baseURL}/api/analytics/rar/${playerId}`).then(r => r.json()),
      fetch(`${this.baseURL}/api/analytics/investment/${playerId}`).then(r => r.json())
    ]);
    
    return { simrating, rar, investment };
  }
  
  async startDataCollection(config) {
    const response = await fetch(`${this.baseURL}/api/collection/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  }
  
  subscribeToPipeline(jobId, callback) {
    const ws = new WebSocket(`wss://${this.baseURL.replace('https://', '')}/ws/pipeline`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'subscribe_pipeline', job_id: jobId }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
    
    return ws;
  }
}

export const analyticsAPI = new AnalyticsAPI();
```

---

## Phase 7: Additional Component 1 — Analytics Dashboard Backend

### 7.1 Advanced Analytics API

**Create:** `shared/axiom-esports-data/api/src/routes/dashboard.py`

```python
"""
Analytics Dashboard API — Aggregated Statistics & Trends
"""

from fastapi import APIRouter, Query
from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

class DashboardMetrics(BaseModel):
    total_players: int
    total_matches: int
    matches_today: int
    avg_sim_rating: float
    top_performers: List[dict]
    recent_trends: dict
    confidence_distribution: dict

class TrendData(BaseModel):
    date: date
    metric: str
    value: float
    change_pct: Optional[float]

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    region: Optional[str] = Query(None),
    game: Optional[str] = Query(None, enum=["valorant", "cs2"])
):
    """Get high-level dashboard metrics."""
    
    # Query aggregated data
    query = """
        SELECT 
            COUNT(DISTINCT player_id) as total_players,
            COUNT(DISTINCT match_id) as total_matches,
            AVG(sim_rating) as avg_rating,
            COUNT(CASE WHEN match_date = CURRENT_DATE THEN 1 END) as matches_today
        FROM player_stats
        WHERE 1=1
    """
    
    params = []
    if region:
        query += " AND region = $1"
        params.append(region)
    if game:
        query += f" AND game = ${len(params) + 1}"
        params.append(game)
    
    # Execute query (pseudo-code)
    result = await db.fetchrow(query, *params)
    
    # Get top performers
    top_performers = await db.fetch("""
        SELECT player_id, username, sim_rating, rar_score
        FROM players
        ORDER BY sim_rating DESC
        LIMIT 5
    """)
    
    return DashboardMetrics(
        total_players=result["total_players"],
        total_matches=result["total_matches"],
        matches_today=result["matches_today"],
        avg_sim_rating=round(result["avg_rating"] or 0, 2),
        top_performers=[dict(p) for p in top_performers],
        recent_trends=await get_trends(days=30),
        confidence_distribution=await get_confidence_distribution()
    )

@router.get("/trends")
async def get_trends(
    metric: str = Query("sim_rating", enum=["sim_rating", "rar", "adr", "kast"]),
    days: int = Query(30, ge=7, le=365),
    granularity: str = Query("day", enum=["day", "week", "month"])
):
    """Get trend data for charts."""
    
    query = f"""
        SELECT 
            DATE_TRUNC('{granularity}', match_date) as period,
            AVG({metric}) as avg_value,
            COUNT(*) as sample_size
        FROM player_stats
        WHERE match_date >= CURRENT_DATE - INTERVAL '{days} days'
        GROUP BY DATE_TRUNC('{granularity}', match_date)
        ORDER BY period
    """
    
    rows = await db.fetch(query)
    
    # Calculate change percentages
    trends = []
    for i, row in enumerate(rows):
        change_pct = None
        if i > 0:
            prev_value = trends[i-1].value
            change_pct = ((row["avg_value"] - prev_value) / prev_value) * 100
        
        trends.append(TrendData(
            date=row["period"],
            metric=metric,
            value=round(row["avg_value"], 2),
            change_pct=round(change_pct, 2) if change_pct else None
        ))
    
    return trends

async def get_confidence_distribution():
    """Get confidence tier distribution for pie chart."""
    rows = await db.fetch("""
        SELECT 
            CASE 
                WHEN confidence_tier >= 90 THEN 'A+ (90-100%)'
                WHEN confidence_tier >= 80 THEN 'A (80-89%)'
                WHEN confidence_tier >= 70 THEN 'B (70-79%)'
                WHEN confidence_tier >= 60 THEN 'C (60-69%)'
                ELSE 'D (<60%)'
            END as tier,
            COUNT(*) as count
        FROM players
        GROUP BY tier
        ORDER BY tier
    """)
    return {row["tier"]: row["count"] for row in rows}
```

---

## Phase 8: Additional Component 2 — Real-time WebSocket Layer

### 8.1 WebSocket Implementation

**Create:** `shared/axiom-esports-data/api/src/websocket_server.py`

```python
"""
WebSocket Server — Real-time Match Updates & Live Data
"""

from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
from typing import Dict, Set
from datetime import datetime

class WebSocketManager:
    """Manage WebSocket connections for real-time features."""
    
    def __init__(self):
        # Active connections by type
        self.match_connections: Dict[str, Set[WebSocket]] = {}
        self.pipeline_connections: Set[WebSocket] = set()
        self.dashboard_connections: Set[WebSocket] = set()
        
        # Rate limiting
        self.message_counts: Dict[WebSocket, int] = {}
        self.rate_limit = 100  # messages per minute
    
    async def connect_match(self, websocket: WebSocket, match_id: str):
        """Connect to match-specific updates."""
        await websocket.accept()
        
        if match_id not in self.match_connections:
            self.match_connections[match_id] = set()
        self.match_connections[match_id].add(websocket)
        
        # Send initial state
        await self.send_match_state(websocket, match_id)
    
    async def connect_pipeline(self, websocket: WebSocket):
        """Connect to pipeline updates."""
        await websocket.accept()
        self.pipeline_connections.add(websocket)
        await websocket.send_json({
            "type": "connected",
            "channel": "pipeline",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def broadcast_match_event(self, match_id: str, event: dict):
        """Broadcast event to all match subscribers."""
        if match_id not in self.match_connections:
            return
        
        message = {
            "type": "match_event",
            "match_id": match_id,
            "event": event,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = []
        for ws in self.match_connections[match_id]:
            try:
                await ws.send_json(message)
            except:
                disconnected.append(ws)
        
        # Cleanup
        for ws in disconnected:
            self.match_connections[match_id].discard(ws)
    
    async def broadcast_pipeline_update(self, job_id: str, progress: dict):
        """Broadcast pipeline progress."""
        message = {
            "type": "pipeline_progress",
            "job_id": job_id,
            "progress": progress,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected = []
        for ws in self.pipeline_connections:
            try:
                await ws.send_json(message)
            except:
                disconnected.append(ws)
        
        for ws in disconnected:
            self.pipeline_connections.discard(ws)
    
    async def send_match_state(self, websocket: WebSocket, match_id: str):
        """Send current match state to new subscriber."""
        # Query current match state
        state = await self.get_match_state(match_id)
        await websocket.send_json({
            "type": "match_state",
            "match_id": match_id,
            "state": state
        })
    
    async def get_match_state(self, match_id: str):
        """Fetch current match state from database."""
        # Implementation would query DB
        return {"status": "live", "round": 12, "score": {"a": 7, "b": 5}}
    
    async def check_rate_limit(self, websocket: WebSocket) -> bool:
        """Check if connection is within rate limit."""
        count = self.message_counts.get(websocket, 0)
        if count > self.rate_limit:
            return False
        self.message_counts[websocket] = count + 1
        return True

# Global instance
ws_manager = WebSocketManager()

# WebSocket endpoint handlers
async def match_websocket(websocket: WebSocket, match_id: str):
    await ws_manager.connect_match(websocket, match_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client messages (subscriptions, etc.)
            message = json.loads(data)
            if message.get("action") == "subscribe_event":
                # Handle subscription
                pass
    except WebSocketDisconnect:
        ws_manager.match_connections.get(match_id, set()).discard(websocket)

async def pipeline_websocket(websocket: WebSocket):
    await ws_manager.connect_pipeline(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle control messages
            pass
    except WebSocketDisconnect:
        ws_manager.pipeline_connections.discard(websocket)
```

---

## Phase 9: Additional Component 3 — Automated Backup System

### 9.1 Database Backup Service

**Create:** `shared/axiom-esports-data/scripts/backup_service.py`

```python
#!/usr/bin/env python3
"""
Automated Backup Service — Supabase Free Tier Compatible

Features:
- Daily automated backups
- Incremental backup strategy
- Compression for storage efficiency
- Retention policy management
- Restore capability

Storage: GitHub Releases (free) or AWS S3 Free Tier
"""

import asyncio
import gzip
import json
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import asyncpg
from dotenv import load_dotenv

load_dotenv()

class BackupService:
    """Manage database backups."""
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        self.backup_dir = Path(os.getenv("BACKUP_DIR", "./backups"))
        self.retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", "7"))
        self.backup_dir.mkdir(exist_ok=True)
    
    async def create_backup(self, tables: Optional[list] = None) -> Path:
        """Create a new database backup."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_file = self.backup_dir / f"backup_{timestamp}.sql.gz"
        
        print(f"📦 Creating backup: {backup_file.name}")
        
        # Determine tables to backup
        if tables is None:
            tables = [
                "players", "matches", "player_stats", "teams",
                "sator_events", "raw_extractions", "reconstruction_data"
            ]
        
        # Use pg_dump for reliable backups
        dump_cmd = [
            "pg_dump",
            "--data-only",  # Data only (schema managed by migrations)
            "--inserts",    # Use INSERT statements for portability
            "--no-owner",   # Don't include ownership commands
            "--no-privileges",
            "-t", ",".join(tables),
            self.database_url
        ]
        
        # Run pg_dump and compress
        with gzip.open(backup_file, "wt") as f:
            process = subprocess.Popen(
                dump_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            for line in process.stdout:
                f.write(line)
        
        # Verify backup
        if process.returncode != 0:
            stderr = process.stderr.read()
            raise RuntimeError(f"Backup failed: {stderr}")
        
        # Get backup size
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        print(f"✅ Backup complete: {size_mb:.2f} MB")
        
        return backup_file
    
    async def create_incremental_backup(self) -> Path:
        """Create incremental backup (changes since last backup)."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_file = self.backup_dir / f"incremental_{timestamp}.json.gz"
        
        # Connect and get changed data
        conn = await asyncpg.connect(self.database_url)
        
        try:
            # Get records modified since last backup
            last_backup = await self.get_last_backup_time()
            
            changes = await conn.fetch("""
                SELECT table_name, record_id, operation, changed_at
                FROM change_log
                WHERE changed_at > $1
                ORDER BY changed_at
            """, last_backup)
            
            # Serialize changes
            data = {
                "type": "incremental",
                "timestamp": timestamp,
                "since": last_backup.isoformat(),
                "changes": [dict(row) for row in changes]
            }
            
            # Compress and save
            with gzip.open(backup_file, "wt") as f:
                json.dump(data, f)
            
            print(f"✅ Incremental backup: {len(changes)} changes")
            return backup_file
            
        finally:
            await conn.close()
    
    async def get_last_backup_time(self) -> datetime:
        """Get timestamp of last successful backup."""
        # Query backup log or default to 24 hours ago
        conn = await asyncpg.connect(self.database_url)
        try:
            result = await conn.fetchval("""
                SELECT MAX(created_at) FROM backup_log WHERE status = 'success'
            """)
            return result or datetime.utcnow() - timedelta(hours=24)
        finally:
            await conn.close()
    
    async def cleanup_old_backups(self):
        """Remove backups older than retention period."""
        cutoff = datetime.utcnow() - timedelta(days=self.retention_days)
        
        deleted = 0
        for backup_file in self.backup_dir.glob("*.gz"):
            # Extract timestamp from filename
            try:
                timestamp_str = backup_file.stem.split("_")[1]
                file_time = datetime.strptime(timestamp_str, "%Y%m%d")
                
                if file_time < cutoff:
                    backup_file.unlink()
                    deleted += 1
            except (IndexError, ValueError):
                continue
        
        print(f"🗑️ Cleaned up {deleted} old backups")
    
    async def restore_backup(self, backup_file: Path, dry_run: bool = True):
        """Restore database from backup."""
        print(f"🔄 Restoring from: {backup_file.name}")
        
        if dry_run:
            print("⚠️ Dry run mode - no changes will be made")
            print("   Set dry_run=False to actually restore")
            return
        
        # Decompress and restore
        with gzip.open(backup_file, "rt") as f:
            restore_cmd = ["psql", self.database_url]
            subprocess.run(restore_cmd, stdin=f, check=True)
        
        print("✅ Restore complete")
    
    async def verify_backup(self, backup_file: Path) -> bool:
        """Verify backup integrity."""
        try:
            with gzip.open(backup_file, "rt") as f:
                # Try to read first few lines
                for _ in range(10):
                    line = f.readline()
                    if not line:
                        break
            return True
        except Exception as e:
            print(f"❌ Backup verification failed: {e}")
            return False

async def run_daily_backup():
    """Entry point for daily backup cron job."""
    service = BackupService()
    
    # Full backup (weekly on Sunday)
    if datetime.utcnow().weekday() == 6:
        backup = await service.create_backup()
    else:
        # Incremental on other days
        backup = await service.create_incremental_backup()
    
    # Verify
    if await service.verify_backup(backup):
        print(f"✅ Backup verified: {backup.name}")
        
        # Upload to storage (GitHub Releases or S3)
        await upload_to_storage(backup)
    
    # Cleanup
    await service.cleanup_old_backups()

async def upload_to_storage(backup_file: Path):
    """Upload backup to free storage (GitHub Releases)."""
    # Implementation would use GitHub API to create release with asset
    # For now, log the action
    print(f"📤 Would upload: {backup_file.name}")
    # TODO: Implement GitHub Release API integration

if __name__ == "__main__":
    asyncio.run(run_daily_backup())
```

---

## Phase 10: Integration Testing & Deployment

### 10.1 Integration Test Suite

**Create:** `tests/integration/test_complete_flow.py`

```python
"""
End-to-End Integration Test — Complete User Journey
"""

import pytest
import asyncio
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_complete_user_journey():
    """Test the complete data flow from extraction to display."""
    
    async with AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Health check
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        
        # 2. Start data collection
        collection = await client.post("/api/collection/start", json={
            "mode": "delta",
            "epochs": [3],
            "source": "vlr"
        })
        assert collection.status_code == 200
        job_id = collection.json()["job_id"]
        
        # 3. Monitor collection progress
        for _ in range(30):  # Wait up to 5 minutes
            status = await client.get(f"/api/collection/status/{job_id}")
            if status.json()["status"] in ("completed", "failed"):
                break
            await asyncio.sleep(10)
        
        assert status.json()["status"] == "completed"
        
        # 4. Query players
        players = await client.get("/api/players/?limit=10")
        assert players.status_code == 200
        assert len(players.json()["players"]) > 0
        
        # 5. Get analytics
        player_id = players.json()["players"][0]["id"]
        analytics = await client.get(f"/api/analytics/simrating/{player_id}")
        assert analytics.status_code == 200
        assert "sim_rating" in analytics.json()
        
        # 6. Dashboard metrics
        dashboard = await client.get("/api/dashboard/metrics")
        assert dashboard.status_code == 200
        assert "total_players" in dashboard.json()

@pytest.mark.asyncio
async def test_firewall_blocks_game_fields():
    """Verify firewall blocks sensitive game fields."""
    
    async with AsyncClient(base_url="http://localhost:8000") as client:
        # Query that might expose internal fields
        response = await client.get("/api/players/")
        
        # Verify no game-only fields in response
        forbidden_fields = [
            "internalAgentState",
            "radarData",
            "detailedReplayFrameData",
            "simulationTick",
            "seedValue",
            "visionConeData",
            "smokeTickData",
            "recoilPattern"
        ]
        
        response_text = response.text
        for field in forbidden_fields:
            assert field not in response_text, f"Forbidden field leaked: {field}"
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All migrations applied to Supabase
- [ ] Environment variables configured in Render
- [ ] Vercel project linked to repository
- [ ] GitHub Pages configured
- [ ] CODEOWNERS file active
- [ ] Integration tests passing

### Deployment Order

1. **Database:** Apply migrations to Supabase
2. **API:** Deploy to Render (creates `sator-api.onrender.com`)
3. **Web App:** Deploy `shared/apps/sator-web` to Vercel
4. **Static Site:** Deploy `website/` to GitHub Pages or Vercel
5. **Verify:** Run integration tests against production URLs

### Post-Deployment Monitoring

- [ ] Health check endpoint responding
- [ ] Database connections within limits (30 max)
- [ ] Rate limiting effective (30 req/min)
- [ ] Error logging to console
- [ ] Backup job scheduled

---

## Summary

This comprehensive plan addresses all remaining issues:

| Component | Status | Action |
|-----------|--------|--------|
| **C# Solutions** | 🟡 Duplicate | Remove `tactical-fps-sim-core.sln` |
| **Docker Compose** | 🟡 Incomplete | Add API + Pipeline services |
| **Root Documentation** | 🟡 Scattered | Consolidate to unified README |
| **SQL Database** | 🔴 Missing | Setup Supabase Free Tier |
| **Pipeline API** | 🟡 Basic | Add WebSocket + Collection API |
| **Website Refinement** | 🟡 Static | Add API integration |
| **Analytics Backend** | 🟢 New | Create dashboard routes |
| **WebSocket Layer** | 🟢 New | Real-time updates |
| **Backup System** | 🟢 New | Automated daily backups |

**Total Timeline:** 14 days  
**Budget:** $0 (Free Tier Only)  
**Risk Level:** Low (incremental deployment)
