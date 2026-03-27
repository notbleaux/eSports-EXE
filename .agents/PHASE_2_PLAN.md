[Ver001.000]

# Phase 2 Implementation Plan — Service Architecture

**Authority:** `MASTER_PLAN.md §5` (Phase 2 definition), `PHASE_GATES.md` (unlock criteria)
**Start Date:** 2026-03-27
**Target Completion:** Phase 2 gates all ✅ PASSED

---

## Overview

Phase 2 constructs the three core services (TeneT Verification, WebSocket, Legacy Compiler) and establishes cross-service type contracts matching Phase 1 schemas. This phase unlocks Phase 4 (when combined with Phase 3 completion) and enables Path A (live data) and Path B (legacy/truth data) pipelines.

**Prerequisite (Phase 2.0):** Deduplicate frontend type definitions before service work begins.

---

## Phase 2.0 — Type Definition Cleanup (PREREQUISITE)

**Gate:** Phase 1 gate 1.6 (deferred)
**Blocking:** Phase 2.1 cannot begin until this is complete

### Task 2.0.1: Audit Frontend Duplicate Types

**Files to Clean:**
- `apps/web/src/shared/types/player.ts` — Remove inline `Player` interface, import from `@sator/types`
- `apps/web/src/shared/types/team.ts` — Remove inline `Team` interface, import from `@sator/types`
- `apps/web/src/shared/types/match.ts` — Remove inline `Match` interface, import from `@sator/types`
- `apps/web/src/hub-1-sator/types/index.ts` — Remove duplicate definitions, centralize

**Verification:**
```bash
grep -r "interface Player" apps/web/src/ | grep -v node_modules | grep -v "@sator/types"
# Should return 0 results
```

### Task 2.0.2: Update Frontend Imports

Replace all inline type usages:
```typescript
// Before
import { Player } from '@/shared/types/player'

// After
import { Player } from '@sator/types'
```

**Verification:**
```bash
pnpm typecheck
# Should pass without errors
```

### Task 2.0.3: Verify No Cross-Import Cycles

Check for circular dependencies introduced by import refactoring:
```bash
pnpm --filter @njz/web analyze
# Confirm no new cycles in dependency graph
```

**Acceptance:** All 3 checks pass, gate 1.6 marked ✅ PASSED — 2026-03-27

---

## Phase 2.1 — Service Infrastructure & Dockerization

**Blocking Until:** Phase 2.0 complete

### Task 2.1.1: Create Service Base Dockerfile Template

**File:** `infra/docker/Dockerfile.service.template`

Requirements:
- Multi-stage build (builder → runtime)
- Python 3.11 slim base image
- Poetry lock file caching layer
- Non-root user execution (nobody:nogroup)
- Health check script integration
- ~150 KB final image per service

```dockerfile
FROM python:3.11-slim as builder
WORKDIR /build
COPY pyproject.toml poetry.lock ./
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/* && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-directory --no-interaction

FROM python:3.11-slim as runtime
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --chown=appuser:appuser . .
USER appuser
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=2).raise_for_status()" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key Improvements:**
- Separate builder/runtime stages (50% image size reduction)
- Non-root user for security (appuser instead of root)
- PYTHONUNBUFFERED for real-time logging
- EXPOSE declaration for port documentation
- HEALTHCHECK with start-period (allows 10s for service startup)

### Task 2.1.2: Create Docker Compose Orchestration

**File:** `infra/docker/docker-compose.services.yml`

Services to orchestrate:
- `tenet-verification` (port 8001)
- `websocket` (port 8002)
- `legacy-compiler` (port 8003)
- `postgres-services` (port 5433, isolated from main DB)
- `redis-services` (port 6380, isolated from main cache)

Requirements:
- Health check dependencies (service B starts after service A health check passes)
- Dedicated networks (`service-tier`, `db-tier`)
- Volume mounts for logs (`/var/log/services/`)
- Environment variable inheritance from `.env.services`

**Example Configuration Structure:**

```yaml
version: '3.9'

networks:
  service-tier:
    driver: bridge
  db-tier:
    driver: bridge

volumes:
  postgres-services-data:
  service-logs:

services:
  postgres-services:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: njz-services
      POSTGRES_USER: services_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5433:5432"
    networks:
      - db-tier
    volumes:
      - postgres-services-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U services_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-services:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    networks:
      - service-tier
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  tenet-verification:
    build:
      context: ../../services/tenet-verification
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://services_user:${DB_PASSWORD:-postgres}@postgres-services:5432/njz-services
      CONFIDENCE_THRESHOLD_AUTO_ACCEPT: 0.90
      CONFIDENCE_THRESHOLD_FLAG: 0.70
    ports:
      - "8001:8000"
    depends_on:
      postgres-services:
        condition: service_healthy
    networks:
      - service-tier
      - db-tier
    volumes:
      - service-logs:/var/log/services
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  websocket:
    build:
      context: ../../services/websocket
      dockerfile: Dockerfile
    environment:
      REDIS_URL: redis://redis-services:6379
      PANDASCORE_API_KEY: ${PANDASCORE_API_KEY}
    ports:
      - "8002:8000"
    depends_on:
      redis-services:
        condition: service_healthy
    networks:
      - service-tier
    volumes:
      - service-logs:/var/log/services
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  legacy-compiler:
    build:
      context: ../../services/legacy-compiler
      dockerfile: Dockerfile
    environment:
      VLR_RATE_LIMIT: 1.0
      LIQUIDPEDIA_RATE_LIMIT: 0.5
      CACHE_TTL_HOURS: 24
    ports:
      - "8003:8000"
    networks:
      - service-tier
    volumes:
      - service-logs:/var/log/services
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

**Usage:**
```bash
# Start all services with isolated databases
docker-compose -f infra/docker/docker-compose.services.yml up -d

# Verify all services are healthy
docker-compose -f infra/docker/docker-compose.services.yml ps

# View logs for debugging
docker-compose -f infra/docker/docker-compose.services.yml logs -f tenet-verification

# Stop all services
docker-compose -f infra/docker/docker-compose.services.yml down
```

### Task 2.1.3: Create Service README Templates

**File Structure:**
- `services/tenet-verification/README.md` — (TODO: replace stub)
- `services/websocket/README.md` — (TODO: replace stub)
- `services/legacy-compiler/README.md` — (TODO: replace stub)

**Contents per README:**
1. Service purpose & responsibility
2. Data contracts (Pydantic input/output from `packages/shared/api/schemas/`)
3. API endpoints with curl examples
4. Health check procedures
5. Environment variables required
6. Local dev setup (`poetry install && uvicorn main:app --reload`)
7. Testing instructions (`pytest tests/ -v`)
8. Deployment checklist

---

## Phase 2.2 — Database Schema & Migrations

**Dependent On:** Phase 2.1.1 (Docker setup for isolated DB)

### Task 2.2.1: Create Alembic Migration Environment

**File:** `infra/migrations/alembic.ini`
**Scope:** Service-tier database (PostgreSQL instance separate from main platform DB)

```bash
alembic init infra/migrations
# Configure sqlalchemy.url in alembic.ini
# Point to services PostgreSQL (postgres://services-user:password@postgres-services:5433/njz-services)
```

### Task 2.2.2: Create Initial Schema Migrations

**Migration Files:**

1. **`001_tenet_verification_tables.py`** — TeneT Verification tables
   - `verification_records` — Store verification audit trail
     - Fields: entity_id, entity_type, source_count, consensus_score, trust_level, created_at, updated_at
   - `data_source_contributions` — Per-source contribution to verification
     - Fields: verification_id, source_type, data_value, confidence, parsed_at
   - `review_queue` — Manual review items
     - Fields: entity_id, status, reviewer_id, notes, priority, created_at

2. **`002_websocket_message_log.py`** — WebSocket event persistence
   - `live_match_events` — Preserve WebSocket events (for replay/audit)
     - Fields: match_id, event_type, payload, source, received_at, processed_at
   - `websocket_subscriptions` — Track active connections (optional, for monitoring)
     - Fields: connection_id, match_id, user_id, connected_at, disconnected_at

3. **`003_legacy_compiler_cache.py`** — Scraper cache & rate limiting
   - `scraper_cache` — Cache layer for VLR/Liquidpedia requests
     - Fields: url_hash, source_type, cached_data, expires_at, created_at
   - `scraper_requests_log` — Rate limit tracking
     - Fields: source_type, timestamp, success, error_msg

### Task 2.2.3: Create Index Strategy

For performance, add indexes on:
- `verification_records(entity_id, created_at DESC)`
- `live_match_events(match_id, received_at DESC)`
- `scraper_cache(url_hash, expires_at)`

**Verification:**
```bash
alembic current  # Confirm migration head
alembic downgrade -1 && alembic upgrade head  # Test rollback
```

---

## Phase 2.3 — Service Completeness & Testing

**Dependent On:** Phase 2.1, 2.2

### Task 2.3.1: Finalize TeneT Verification Service

**File:** `services/tenet-verification/main.py` (currently 561 lines, 6 endpoints)

Additions needed:
- [ ] Database session management with lifespan context manager (not deprecated @app.on_event)
- [ ] Dependency injection for ConfidenceCalculator via FastAPI Depends()
- [ ] Request/response logging middleware with request ID propagation
- [ ] Error handling with proper HTTP status codes (400, 404, 500, 503)
- [ ] Rate limiting on POST /v1/verify (100 req/min per IP via slowapi)
- [ ] Request validation using Pydantic models from `packages/shared/api/schemas/`
- [ ] CORS middleware for cross-origin requests
- [ ] Database connection retry with exponential backoff (3 attempts, 2^n delay)

**Code Pattern for FastAPI Lifespan:**

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database with retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialized")
            break
        except Exception as e:
            logger.error(f"DB init failed (attempt {attempt+1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)

    yield  # Service runs here

    # Shutdown: Clean up resources
    await engine.dispose()
    logger.info("Database connection closed")

app = FastAPI(lifespan=lifespan)
```

**Code Pattern for Rate Limiting:**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/v1/verify")
@limiter.limit("100/minute")
async def verify_entity(request: Request, verification: VerificationRequest, session: AsyncSession = Depends(get_session)):
    # Service logic
```

**Endpoints checklist:**
- `POST /v1/verify` — Accept entity + sources, return confidence score
- `GET /v1/verify/{entity_id}` — Retrieve verification result
- `GET /v1/review-queue` — List pending manual reviews (supports pagination, filters)
- `POST /v1/review/{entity_id}` — Submit review decision + notes
- `GET /v1/status/{entity_id}` — Check verification status + audit trail
- `GET /health` — Health check (200 OK)
- `GET /ready` — Readiness check (200 OK if DB connected)

**Test Coverage:** 40+ test cases (currently 26, add 14 more for DB integration + error cases)

### Task 2.3.2: Finalize WebSocket Service

**File:** `services/websocket/main.py` (currently 476 lines, 5 endpoints)

Additions needed:
- [ ] Redis Streams consumer with backpressure handling (batch size: 10 messages)
- [ ] Match state reconstruction from event history (last 1000 events retained)
- [ ] WebSocket frame serialization (JSON + MessagePack fallback)
- [ ] Connection lifecycle hooks (on_connect, on_disconnect, on_error)
- [ ] Ping/pong heartbeat (30 sec interval)

**Endpoints checklist:**
- `GET /ws/matches/live` — WebSocket upgrade, broadcast all live matches
- `GET /ws/matches/{match_id}/live` — WebSocket upgrade, single match only
- `GET /v1/matches/live` — REST fallback (JSON poll for non-WS clients)
- `GET /v1/matches/{match_id}/events` — Recent events for a match (REST, last 100)
- `GET /health` — Health check
- `GET /ready` — Readiness check

**Test Coverage:** 30+ test cases (currently 20+, add 10+ for edge cases: disconnect/reconnect, message ordering, backpressure)

### Task 2.3.3: Finalize Legacy Compiler Service

**File:** `services/legacy-compiler/main.py` (currently 715 lines, 8 endpoints)

Additions needed:
- [ ] Async scraper scheduling (background tasks via APScheduler)
- [ ] VLR agent rotation (rotate User-Agent string per request)
- [ ] Liquidpedia retry logic with exponential backoff (3 attempts, 2^n second delay)
- [ ] YouTube metadata extraction with fallback (use thumbnail URL if metadata parsing fails)
- [ ] Data aggregation conflict resolution (VLR vs Liquidpedia score discrepancy → escalate to review queue)
- [ ] Request deduplication (same URL within 1 hour → use cache)

**Endpoints checklist:**
- `POST /v1/matches/compile` — Trigger compilation for match ID
- `GET /v1/matches/{match_id}/compiled` — Retrieve compiled history
- `GET /v1/tournaments/{tournament_id}` — Fetch tournament schedule + results
- `POST /v1/schedules/sync` — Sync VLR tournament schedule
- `GET /v1/players/{player_id}` — Fetch player career stats (cross-source aggregate)
- `GET /v1/teams/{team_id}` — Fetch team history (cross-source aggregate)
- `GET /v1/cache/stats` — Cache hit rate, stale entries, size statistics
- `GET /health` & `GET /ready` — Health checks

**Test Coverage:** 40+ test cases (currently 29, add 11+ for scraper edge cases, deduplication, conflict resolution)

### Task 2.3.4: Cross-Service Type Contract Verification

**Gate 2.6:** Ensure all service Pydantic models match Phase 1 TypeScript schemas

**Verification Checklist:**
- [ ] `TenetVerificationResult` (Python Pydantic) ≡ `TenetVerificationResult` (TypeScript) — same fields, same types
- [ ] `ConfidenceScore` structure matches in both — float 0.0–1.0 + breakdown object
- [ ] `DataSourceType` enum values identical in Python and TypeScript
- [ ] `LiveMatchView` (WS payload) matches in both languages
- [ ] `VerifiedMatchSummary` (legacy) matches across languages

**Automation:** Create `tests/schema-parity/check_contracts.ts` + `tests/schema-parity/check_contracts.py`
- TypeScript: Load `.d.ts` files, extract type definitions
- Python: Load Pydantic models, extract field annotations
- Cross-compare and report mismatches

---

## Phase 2.4 — API Integration & Documentation

**Dependent On:** Phase 2.3

### Task 2.4.1: Create OpenAPI / Swagger Specs

**File:** `infra/api/openapi.services.json`

Generate from FastAPI services:
```bash
# For each service
python -c "from services.SERVICE.main import app; print(app.openapi())" > openapi-SERVICE.json
```

Combine into single spec with discriminator for path prefixes:
- `/v1/verify/*` → tenet-verification service
- `/v1/websocket/*` → websocket service
- `/v1/legacy/*` → legacy-compiler service

Host Swagger UI at `http://localhost:8000/docs` (main API gateway) with proxied endpoints.

### Task 2.4.2: Create Service Integration Tests

**File:** `tests/integration/services/test_service_integration.py`

Test cases:
1. Service startup order (health checks pass in sequence)
2. Inter-service communication (verification service → review queue visible to admin panel)
3. Data flow validation (Pandascore event → WebSocket → match state updated)
4. Type contract enforcement (all responses match Pydantic schemas)
5. Error propagation (service A error doesn't crash service B)
6. Rate limiting behavior (100 req/min on /v1/verify)
7. Database transaction isolation (concurrent verifications don't conflict)

**Acceptance Criteria:** 15+ test cases, all passing

### Task 2.4.3: Create Admin Panel Integration Docs

**File:** `docs/services/ADMIN_PANEL_INTEGRATION.md`

Content:
- TeneT review queue architecture (how admin panel queries `/v1/review-queue`)
- Manual review workflow (fetch pending → submit decision → update verification record)
- Permission model (admin-only endpoints, API key authentication)
- Real-time queue updates (admin panel polls `/v1/review-queue` vs WebSocket broadcast)

---

## Phase 2.5 — Frontend Service Integration

**Parallel with 2.3, Dependent on 2.2**

### Task 2.5.1: Create Service Client Library

**File:** `packages/@njz/service-client/` (new package)

Exports:
```typescript
export const tenetVerification = {
  verify(entity: Entity, sources: DataSource[]): Promise<TenetVerificationResult>,
  getReviewQueue(filters?: {}): Promise<ReviewQueueItem[]>,
  submitReview(entityId: string, decision: ReviewDecision): Promise<void>,
  getStatus(entityId: string): Promise<VerificationStatus>,
}

export const liveMatch = {
  watchMatch(matchId: string, onEvent: (event: LiveMatchEvent) => void): WebSocket,
  getRecentEvents(matchId: string, limit?: 100): Promise<LiveMatchEvent[]>,
}

export const legacy = {
  getCompiledMatch(matchId: string): Promise<VerifiedMatchSummary>,
  searchPlayers(query: string): Promise<PlayerSeasonStats[]>,
  searchTeams(query: string): Promise<TournamentRecord[]>,
}
```

**Implementation:** HTTP + WebSocket client wrappers with TypeScript types from `@njz/types`

### Task 2.5.2: Update Frontend Hub Integrations

**Files to Update:**

1. **SATOR (Analytics Hub)** — `apps/web/src/hub-1-sator/`
   - Import from `@njz/service-client`
   - Use `legacy.getCompiledMatch()` for historical data in match detail pages
   - Add TeneT confidence badge to player stats

2. **ROTAS (Stats Hub)** — `apps/web/src/hub-2-rotas/`
   - Use `legacy.searchPlayers()` + `legacy.searchTeams()` for historical leaderboards
   - Display SimRating with source breakdown (via confidence score)

3. **AREPO (Community Hub)** — `apps/web/src/hub-3-arepo/`
   - No direct service integration (AREPO is forum/comments)
   - May reference verified player/team data from SATOR

4. **OPERA (Pro Scene Hub)** — `apps/web/src/hub-4-opera/`
   - Use `liveMatch.watchMatch()` for live tournament match updates
   - Real-time score/round updates via WebSocket

5. **TeNET Navigation** — `apps/web/src/hub-5-tenet/`
   - Monitor service health (health check endpoint)
   - Display service status in admin panel

### Task 2.5.3: Add Service Health Indicators

**Component:** `apps/web/src/shared/components/ServiceHealthStatus.tsx`

Requirements:
- Display status of 3 services (verification, websocket, legacy-compiler)
- Refresh every 30 seconds via `setInterval`
- Show green/yellow/red based on health endpoint response
- Display in admin panel + dashboard footer

---

## Phase 2 Integration Test Patterns

### Pattern 1: Verification → Review Queue → Admin API

```python
# Test case: Flagged verification becomes reviewable
async def test_flagged_verification_in_review_queue():
    # 1. Create verification with low confidence (0.65)
    result = await verify_entity(
        VerificationRequest(
            entity_id="match_123",
            entity_type="match",
            game="valorant",
            sources=[...]  # Low-confidence sources
        )
    )
    assert result.status == "FLAGGED"
    assert result.confidence.value < 0.70

    # 2. Check that entity appears in review queue
    review_items = await get_review_queue()
    assert any(item.entity_id == "match_123" for item in review_items)

    # 3. Submit manual review
    await submit_review(
        entity_id="match_123",
        decision="ACCEPT",
        notes="Video confirms final score"
    )

    # 4. Verify review is recorded
    status = await get_verification_status("match_123")
    assert status.verification_status == "MANUAL_OVERRIDE"
    assert status.reviewer_notes == "Video confirms final score"
```

### Pattern 2: WebSocket Live Update Pipeline

```python
# Test case: Pandascore event reaches connected clients
async def test_pandascore_to_websocket_pipeline():
    # 1. Establish WebSocket connection as client
    client_messages = []
    async with websockets.connect("ws://localhost:8002/ws/matches/live") as ws:
        # 2. Publish Pandascore event to Redis Stream
        await redis_client.xadd(
            "pandascore:events",
            {"match_id": "vct_123", "round": 5, "score_a": 2, "score_b": 3}
        )

        # 3. Receive broadcasted message on WebSocket
        msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
        client_messages.append(json.loads(msg))

    # 4. Verify message structure
    assert client_messages[0]["type"] == "SCORE_UPDATE"
    assert client_messages[0]["payload"]["round"] == 5
```

### Pattern 3: Type Contract Parity

```python
# Test case: Python Pydantic serializes same as TypeScript deserializes
async def test_type_contract_parity():
    # 1. Create Python model instance
    verification_result = TenetVerificationResult(
        entity_id="match_123",
        status="ACCEPTED",
        confidence=ConfidenceScore(
            value=0.92,
            source_count=3,
            by_source=[...],
            has_conflicts=False,
            conflict_fields=[],
            computed_at=datetime.utcnow()
        ),
        verified_at=datetime.utcnow(),
        distribution_path="PATH_B_LEGACY",
        metadata={}
    )

    # 2. Serialize to JSON
    json_str = verification_result.model_dump_json()

    # 3. Verify JSON keys match TypeScript camelCase (via alias)
    data = json.loads(json_str)
    assert "entityId" in data  # camelCase via alias
    assert "entity_id" not in data  # not snake_case
    assert "confidenceValue" in data["confidence"]
    assert "sourceCount" in data["confidence"]
```

---

## Phase 2 Gate Verification Checklist

After all tasks complete, verify these gates:

### Gate 2.1: Service READMEs Exist
```bash
test -f services/tenet-verification/README.md && \
test -f services/websocket/README.md && \
test -f services/legacy-compiler/README.md && \
echo "✅ All READMEs exist"
```

### Gate 2.2: Service Health Endpoints Return 200
```bash
# Start services in Docker
docker-compose -f infra/docker/docker-compose.services.yml up -d

# Wait for startup (10 sec)
sleep 10

# Check health
curl -f http://localhost:8001/health && \
curl -f http://localhost:8002/health && \
curl -f http://localhost:8003/health && \
echo "✅ All health checks passed"
```

### Gate 2.3: README Completeness Check
```bash
# Verify each README has required sections
for service in tenet-verification websocket legacy-compiler; do
  grep -q "API Endpoints" services/$service/README.md || echo "❌ Missing API Endpoints section in $service"
  grep -q "Environment Variables" services/$service/README.md || echo "❌ Missing Environment Variables section in $service"
  grep -q "Testing" services/$service/README.md || echo "❌ Missing Testing section in $service"
done
```

### Gate 2.4: Service Unit Tests All Pass
```bash
pytest services/*/tests/ -v --tb=short
# Acceptance: 0 failures
```

### Gate 2.5: Type Contract Parity
```bash
python tests/schema-parity/check_contracts.py && \
npx ts-node tests/schema-parity/check_contracts.ts && \
echo "✅ TypeScript ≡ Python types"
```

### Gate 2.6: Type Contract Manual Review
```bash
# Verify by reading:
# - services/tenet-verification/main.py (Pydantic return types)
# - packages/shared/api/schemas/tenet.py (Python models)
# - data/schemas/tenet-protocol.ts (TypeScript types)
# Compare field names, types, optionality
```

---

## Phase 2 Timeline & Parallelization

**Recommended Execution:**

| Phase | Task | Duration | Parallelizable? |
|-------|------|----------|-----------------|
| 2.0 | Type Cleanup | ~2h | ✓ Solo |
| 2.1 | Service Docker | ~3h | ✓ Solo |
| 2.2 | DB Migrations | ~2h | ✗ Dependent on 2.1 |
| 2.3 | Service Completeness | ~5h | ✓ Parallel (3 services) |
| 2.4 | API Docs | ~2h | ✓ Dependent on 2.3 |
| 2.5 | Frontend Integration | ~4h | ✓ Parallel with 2.3 after 2.2 |

**Critical Path:** 2.0 → 2.1 → 2.2 → (2.3 parallel with 2.5) → 2.4

**Estimated Total:** 18 hours with optimal parallelization

---

## Blocked Until Phase 2 Completion

- Phase 3 (Frontend Correction) — Can begin in parallel but gates depend on Phase 2 + 3 both complete
- Phase 4 (Data Pipeline Lambda) — Blocked until Phase 2 + 3 both gates ✅ PASSED

---

## Exit Criteria

All 6 gates from `.agents/PHASE_GATES.md` Phase 2 section marked ✅ PASSED:
- 2.1 ✅ Service READMEs exist
- 2.2 ✅ Health endpoints respond 200
- 2.3 ✅ WebSocket/legacy READMEs exist
- 2.4 ✅ Service unit tests pass (50+ total test cases)
- 2.5 ✅ (Deferred — covered by 2.4)
- 2.6 ✅ Type contracts verified

Once all Phase 2 gates + all Phase 3 gates pass → Phase 4 unlocked.
