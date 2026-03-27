[Ver001.000]

# Phase 2 Launch Checklist

**Date:** 2026-03-27
**Target Start:** Immediately after refinements approved
**Estimated Duration:** 18 hours with 3-4 specialist agents

---

## Pre-Launch Verification (Phase 1 Quality Assurance)

Before dispatching Phase 2 specialists, confirm Phase 1 work is production-ready:

### Code Quality Checks

- [ ] **Schema Alignment Verified**
  - Run: `python tests/schema-parity/check_contracts.py`
  - Run: `npx ts-node tests/schema-parity/check_contracts.ts`
  - Expected: 0 type mismatches reported

- [ ] **TypeScript Compilation**
  - Run: `pnpm typecheck`
  - Expected: 0 errors, 0 warnings

- [ ] **Service Unit Tests Pass**
  - Run: `pytest services/*/tests/ -v`
  - Expected: 100+ test cases pass, 0 failures

- [ ] **E2E Navigation Tests Pass**
  - Run: `npx playwright test tests/e2e/navigation.spec.ts`
  - Expected: 40 test cases pass, 0 failures

- [ ] **Python Linting**
  - Run: `ruff check services/` (identifies issues)
  - Run: `black services/ --check` (formatting check)
  - Expected: 0 violations after applying fixes

### Documentation Completeness

- [ ] **PHASE_2_PLAN.md** exists and is comprehensive
  - Contains all 5 sub-phases (2.0 through 2.5)
  - All tasks have acceptance criteria
  - All gate verification commands specified

- [ ] **PHASE_1_REVIEW_REFINEMENTS.md** exists
  - Documents 6 enhancement patterns
  - Lists 21+ recommended test additions
  - Provides code snippets for patterns

- [ ] **PHASE_1_COMPLETION_SUMMARY.md** exists
  - 3,750+ lines of code documented
  - All deliverables listed
  - Sub-agent assignment strategy provided

### Environment Preparation

- [ ] **Docker Images Available**
  - Run: `docker pull python:3.11-slim`
  - Expected: Image pulls successfully

- [ ] **Docker Compose Configuration Exists** (will be created in 2.1)
  - File: `infra/docker/docker-compose.services.yml` (template provided)
  - Will configure: postgres-services, redis-services, 3 service containers

- [ ] **Poetry Lock Files Current**
  - Run: `poetry lock --no-update` in each service directory
  - Expected: No changes needed (all dependencies resolved)

- [ ] **.env.services.example Template Created** (Phase 2.0 task)
  - Will contain all required environment variables
  - Will have sensible defaults

---

## Phase 2.0 Launch: Type Definition Cleanup

**Timeline:** ~2 hours
**Assigned To:** Specialist-A (solo task)
**Blocking:** Phase 2.1+ cannot begin until this completes

### Pre-Phase-2.0 Checkpoint

- [ ] **Identify Frontend Type Duplicates**
  - Run: `grep -r "interface Player" apps/web/src/ | grep -v node_modules | grep -v "@sator/types" | wc -l`
  - Expected: 4 files found (Player, Team, Match definitions)

- [ ] **Confirm @sator/types Package Exists**
  - Run: `test -f packages/shared/types/index.ts && echo "Package exists"`
  - Expected: Package exists and exports Player, Team, Match

### Phase 2.0 Tasks

- [ ] **Task 2.0.1: Deduplicate Frontend Types**
  - [ ] Edit `apps/web/src/shared/types/player.ts` → remove inline definition, add import from @sator/types
  - [ ] Edit `apps/web/src/shared/types/team.ts` → remove inline definition, add import from @sator/types
  - [ ] Edit `apps/web/src/shared/types/match.ts` → remove inline definition, add import from @sator/types
  - [ ] Edit `apps/web/src/hub-1-sator/types/index.ts` → centralize imports from @sator/types

- [ ] **Task 2.0.2: Verify Type Imports**
  - Run: `grep -r "import.*Player.*from.*@sator/types" apps/web/src/ | wc -l`
  - Expected: 4+ results (Player imported from @sator/types)
  - Run: `grep -r "interface Player" apps/web/src/ | grep -v node_modules | grep -v "@sator/types" | wc -l`
  - Expected: 0 results (no inline definitions remain)

- [ ] **Task 2.0.3: Verify TypeScript Compilation**
  - Run: `pnpm typecheck`
  - Expected: 0 errors
  - Check for cycles: `pnpm --filter @njz/web analyze`
  - Expected: No new dependency cycles introduced

- [ ] **Task 2.0.4: Commit Phase 2.0 Completion**
  - [ ] Review changes: `git diff apps/web/src/`
  - [ ] Stage files: `git add apps/web/src/`
  - [ ] Commit: `git commit -m "refactor(web): Deduplicate type definitions, import from @sator/types"`
  - [ ] Verify commit pushed

### Phase 2.0 Completion Criteria

✅ **Gate 1.6 PASSED When:**
- All 4 duplicate definitions removed
- `pnpm typecheck` returns 0 errors
- No new dependency cycles detected
- Commit is pushed to main branch

**Next Step:** Unlock Phase 2.1-2.5 execution

---

## Phase 2.1 Launch: Service Infrastructure

**Timeline:** ~5 hours (parallel with Phase 2.2 after 2.0 completes)
**Assigned To:** Specialist-B (solo task)
**Blocking Until:** Phase 2.0 complete

### Pre-Phase-2.1 Checkpoint

- [ ] **Verify Service Directories Exist**
  - Run: `ls -la services/{tenet-verification,websocket,legacy-compiler}/`
  - Expected: Each directory has `main.py`, `tests/`, `Dockerfile` (will be created)

- [ ] **Confirm Poetry Files Exist**
  - Run: `ls services/{tenet-verification,websocket,legacy-compiler}/pyproject.toml`
  - Expected: All 3 files exist

### Phase 2.1 Tasks

- [ ] **Task 2.1.1: Create Dockerfile.service.template**
  - [ ] File: `infra/docker/Dockerfile.service.template`
  - [ ] Must include: multi-stage build, Python 3.11-slim, non-root user, healthcheck
  - [ ] Verification: `cat infra/docker/Dockerfile.service.template | grep -c "FROM"` should be 2 (builder + runtime)

- [ ] **Task 2.1.2: Create docker-compose.services.yml**
  - [ ] File: `infra/docker/docker-compose.services.yml`
  - [ ] Must define: postgres-services (5433), redis-services (6380), 3 service containers
  - [ ] Must include: networks (service-tier, db-tier), healthchecks, depends_on chains
  - [ ] Verification: `docker-compose -f infra/docker/docker-compose.services.yml config --quiet`
  - [ ] Expected: Configuration validates without errors

- [ ] **Task 2.1.3: Create Individual Service Dockerfiles**
  - [ ] `services/tenet-verification/Dockerfile` → inherit from template
  - [ ] `services/websocket/Dockerfile` → inherit from template
  - [ ] `services/legacy-compiler/Dockerfile` → inherit from template
  - [ ] Each should be ~40 lines, using `FROM python:3.11-slim` and pattern from template

- [ ] **Task 2.1.4: Expand Service READMEs (Stubs → Full)**
  - [ ] `services/tenet-verification/README.md`
    - [ ] Purpose section
    - [ ] API endpoints table (POST /v1/verify, GET /v1/review-queue, etc.)
    - [ ] Environment variables reference
    - [ ] Local dev setup (poetry install && uvicorn)
    - [ ] Testing instructions (pytest tests/ -v)
    - [ ] Docker build/run examples
    - [ ] Health check procedures

  - [ ] `services/websocket/README.md` (same structure)
  - [ ] `services/legacy-compiler/README.md` (same structure)

- [ ] **Task 2.1.5: Create .env.services.example**
  - [ ] File: `.env.services.example`
  - [ ] Must contain all required env vars for all 3 services
  - [ ] Must have sensible defaults or placeholders
  - [ ] Verification: Source file and verify no errors
    - Run: `source .env.services.example && echo "Config loads successfully"`

### Phase 2.1 Completion Criteria

✅ **Gate 2.1 PASSED When:**
- All 3 Dockerfiles exist and build successfully
- `docker-compose config --quiet` returns 0 errors
- All 3 READMEs have 500+ words each, include API endpoints
- `.env.services.example` defines all required variables

---

## Phase 2.2 Launch: Database Migrations

**Timeline:** ~2 hours (parallel with Phase 2.3, dependent on 2.1)
**Assigned To:** Specialist-B (2nd task)
**Blocking Until:** Phase 2.1 Docker infrastructure complete

### Pre-Phase-2.2 Checkpoint

- [ ] **Alembic Not Yet Initialized**
  - Run: `test ! -d infra/migrations/versions && echo "Ready to init"`
  - Expected: versions directory doesn't exist yet

- [ ] **PostgreSQL Client Installed Locally** (for testing migrations)
  - Run: `which psql`
  - Expected: psql executable found (or will use Docker)

### Phase 2.2 Tasks

- [ ] **Task 2.2.1: Initialize Alembic**
  - [ ] Run: `alembic init infra/migrations`
  - [ ] Edit `infra/migrations/alembic.ini`: Update `sqlalchemy.url` to point to PostgreSQL
  - [ ] Edit `infra/migrations/env.py`: Import ORM models and configure target metadata
  - [ ] Verification: `alembic revision --autogenerate -m "initial"` creates migration

- [ ] **Task 2.2.2: Create 3 Migration Files**

  **Migration 001: Tenet Verification Tables**
  - [ ] File: `infra/migrations/versions/001_tenet_verification_tables.py`
  - [ ] Must create:
    - `verification_records` table (id, entity_id, entity_type, game, status, confidence_value, created_at, indexes)
    - `data_source_contributions` table (id, verification_id, source_type, trust_level, weight, ingested_at)
    - `review_queue` table (id, verification_id, entity_id, reason, reviewer_id, review_decision, flagged_at)
  - [ ] Verification: `alembic upgrade 001` creates tables without error

  **Migration 002: WebSocket Message Log**
  - [ ] File: `infra/migrations/versions/002_websocket_message_log.py`
  - [ ] Must create:
    - `live_match_events` table (id, match_id, event_type, payload, received_at, processed_at, index on match_id)
  - [ ] Verification: `alembic upgrade 002` creates table without error

  **Migration 003: Legacy Compiler Cache**
  - [ ] File: `infra/migrations/versions/003_legacy_compiler_cache.py`
  - [ ] Must create:
    - `scraper_cache` table (url_hash, source_type, cached_data, expires_at, index on url_hash)
    - `scraper_requests_log` table (source_type, timestamp, success, error_msg)
  - [ ] Verification: `alembic upgrade 003` creates tables without error

- [ ] **Task 2.2.3: Create Index Strategy**
  - [ ] Add indexes to critical query paths
  - [ ] `verification_records(entity_id, created_at DESC)` — for lookup by entity + sorting
  - [ ] `review_queue(flagged_at DESC)` — for queue listing
  - [ ] `live_match_events(match_id, received_at DESC)` — for event replay
  - [ ] `scraper_cache(url_hash, expires_at)` — for cache lookup + expiration

- [ ] **Task 2.2.4: Test Migration Rollback**
  - [ ] Run: `alembic downgrade -1` (downgrade from 003 to 002)
  - [ ] Expected: Tables are dropped, no errors
  - [ ] Run: `alembic upgrade head` (re-apply all migrations)
  - [ ] Expected: All 3 migrations apply, 9 total tables created

### Phase 2.2 Completion Criteria

✅ **Gate 2.2 (Partial) PASSED When:**
- All 3 migration files created and apply without error
- `alembic current` shows migration head as "003_legacy_compiler_cache"
- Rollback/upgrade cycle works without errors
- All required tables exist with proper indexes

---

## Phase 2.3 Launch: Service Completeness

**Timeline:** ~10 hours (parallel execution of 3 services)
**Assigned To:** Specialist-C (split across sub-specialists C1, C2, C3 if available)
**Blocking Until:** Phase 2.1 & 2.2 complete

### Pre-Phase-2.3 Checkpoint

- [ ] **All 3 Services Have Basic Structure**
  - Run: `grep -c "class FastAPI" services/*/main.py`
  - Expected: 3 results (one FastAPI instance per service)

- [ ] **Pydantic Models Available for Import**
  - Run: `python -c "from packages.shared.api.schemas import ConfidenceScore, LiveMatchView, TenetVerificationResult; print('OK')"`
  - Expected: OK (models import without error)

### Phase 2.3.1 Tasks: TeneT Verification Service

**Specialist-C1 (or C if solo)**

- [ ] **Convert startup event to lifespan context manager**
  - [ ] Replace `@app.on_event("startup")` with `@asynccontextmanager async def lifespan(app)`
  - [ ] Add database connection retry logic (max 3 attempts, exponential backoff)
  - [ ] Add shutdown cleanup (engine.dispose())

- [ ] **Add middleware for request tracing + CORS**
  - [ ] RequestIDMiddleware: Adds X-Request-ID header to all responses
  - [ ] CORSMiddleware: Allow cross-origin requests from frontend domains
  - [ ] TrustedHostMiddleware: Only accept from known hosts (localhost, 127.0.0.1, service endpoints)

- [ ] **Add rate limiting to POST /v1/verify**
  - [ ] Install: `pip install slowapi`
  - [ ] Limiter: 100 requests per minute per IP address
  - [ ] Rejection response: 429 Too Many Requests with Retry-After header

- [ ] **Verify all endpoints use proper status codes**
  - [ ] GET /v1/verify/{entity_id}: 200 OK or 404 Not Found
  - [ ] POST /v1/verify: 200 OK or 400 Bad Request (invalid input)
  - [ ] POST /v1/review/{entity_id}: 200 OK or 400/404
  - [ ] GET /health: 200 OK or 503 Service Unavailable (if DB down)
  - [ ] GET /ready: 200 OK (ready) or 503 (not ready)

- [ ] **Add test cases for enhancements** (14 new tests, total 40)
  - [ ] Test rate limiting: exceed 100/min, get 429 response
  - [ ] Test database retry: simulate 2 failures then success
  - [ ] Test request ID propagation: verify X-Request-ID present in response
  - [ ] Test CORS headers: preflight request returns proper headers
  - [ ] Test concurrent requests: no race conditions on verification lookup
  - [ ] Test error serialization: 500 error returns JSON with error_code and message
  - [ ] Test transaction rollback: failed verification doesn't partial-write DB
  - [ ] Test large payloads: 1000+ sources in single request
  - [ ] Test null handling: missing optional fields handled gracefully
  - [ ] Test enum validation: invalid status enum rejected with 400
  - [ ] Test timestamp serialization: datetime serializes to ISO8601 in JSON
  - [ ] Test authorization: /v1/review endpoints require admin credentials (if auth enabled)
  - [ ] Test audit trail: all updates logged with timestamp + reviewer_id
  - [ ] Test cache invalidation: updated verification removes cached values

- [ ] **Commit Phase 2.3.1 completion**
  - [ ] `git commit -m "feat(tenet-verification): Add lifespan, middleware, rate limiting, 40 test cases"`

### Phase 2.3.2 Tasks: WebSocket Service

**Specialist-C2 (or C if solo, after 2.3.1)**

- [ ] **Add message deduplication logic**
  - [ ] Create MessageDeduplicator class with LRU eviction
  - [ ] Track event_ids for 10,000 most recent events
  - [ ] Skip duplicate broadcasts
  - [ ] Log skipped duplicates for debugging

- [ ] **Enhance Redis consumer with backpressure handling**
  - [ ] Batch size: 10 messages per read cycle
  - [ ] Timeout: 5 seconds max wait between batches
  - [ ] Graceful degradation if Redis is slow

- [ ] **Add WebSocket heartbeat/keepalive**
  - [ ] Send HEARTBEAT message every 30 seconds
  - [ ] Track client connection state (last message received at)
  - [ ] Detect stale connections (no message in 90+ seconds), close them

- [ ] **Add connection lifecycle logging**
  - [ ] Log on_connect: client IP, match_id, connection ID
  - [ ] Log on_receive: message count, payload size
  - [ ] Log on_disconnect: reason, messages received, connection duration

- [ ] **Add test cases for enhancements** (10 new tests, total 30)
  - [ ] Test deduplication: same event_id twice, broadcast only once
  - [ ] Test backpressure: 100 messages/sec, no overflow
  - [ ] Test heartbeat: receive HEARTBEAT at 30-sec intervals
  - [ ] Test connection timeout: disconnect after 90 sec inactivity
  - [ ] Test out-of-order messages: handle N+1 arriving before N
  - [ ] Test large payload: 1000-player match serializes without error
  - [ ] Test frame masking: client-to-server frames properly masked
  - [ ] Test graceful shutdown: drain pending messages before exit
  - [ ] Test memory efficiency: 10K connections don't leak memory
  - [ ] Test message ordering: events arrive in Redis Stream order (FIFO)

- [ ] **Commit Phase 2.3.2 completion**
  - [ ] `git commit -m "feat(websocket): Add deduplication, backpressure, heartbeat, 30 test cases"`

### Phase 2.3.3 Tasks: Legacy Compiler Service

**Specialist-C3 (or C if solo, after 2.3.2)**

- [ ] **Add circuit breaker for external APIs**
  - [ ] CircuitBreaker class: CLOSED → OPEN → HALF_OPEN → CLOSED states
  - [ ] Failure threshold: 3 consecutive failures
  - [ ] Timeout: 120 seconds before attempting HALF_OPEN
  - [ ] Track failures per source (VLR, Liquidpedia, YouTube independently)

- [ ] **Add exponential backoff with jitter**
  - [ ] Base delay: 1 second
  - [ ] Jitter: ±25% random variation (prevents thundering herd)
  - [ ] Max retries: 3 attempts per request
  - [ ] Formula: `delay = (2^attempt) * (1 + random.uniform(-0.25, 0.25))`

- [ ] **Add VLR scraper enhancements**
  - [ ] Handle paginated results (VLR splits tournament results across pages)
  - [ ] Parse multiple table formats (VLR occasionally restructures HTML)
  - [ ] Rotate User-Agent strings (prevent blocking from VLR)
  - [ ] Extract: player name, team name, match score, round-by-round results

- [ ] **Add Liquidpedia scraper enhancements**
  - [ ] Handle multiple table formats (Liquidpedia has inconsistent table structures)
  - [ ] Parse tournament bracket (single-elimination, round-robin, etc.)
  - [ ] Extract: team roster, tournament history, patch notes
  - [ ] Fallback: if table parsing fails, use alternative selectors

- [ ] **Add YouTube metadata extraction**
  - [ ] Search for match VOD by match_id + game
  - [ ] Extract: video title, channel, upload date, view count
  - [ ] Fallback: if metadata unavailable, use thumbnail URL
  - [ ] Timeout: 5 seconds per YouTube API call

- [ ] **Add data conflict resolution**
  - [ ] Detect score mismatches (VLR says 2-0, Liquidpedia says 2-1)
  - [ ] Escalate to TeneT review queue with "DATA_CONFLICT" reason
  - [ ] Log conflict details (which sources disagree, on which fields)

- [ ] **Add cache management**
  - [ ] TTL: 24 hours (configurable)
  - [ ] Max size: 500 MB (LRU eviction)
  - [ ] Expiration check: every 1 hour, remove stale entries
  - [ ] Endpoint: GET /v1/cache/stats → returns hit rate, stale count, size

- [ ] **Add test cases for enhancements** (11 new tests, total 40)
  - [ ] Test circuit breaker: transitions through all states
  - [ ] Test exponential backoff: verify delay formula (jitter optional)
  - [ ] Test VLR pagination: handle 50-team tournament split across pages
  - [ ] Test Liquidpedia parsing: extract team rosters correctly
  - [ ] Test YouTube search: find correct VOD by match_id
  - [ ] Test conflict detection: score mismatch escalates to review queue
  - [ ] Test cache lookup: cached data returned without scraping
  - [ ] Test cache expiration: 25-hour-old entry is not returned
  - [ ] Test cache overflow: evict LRU entries when max size exceeded
  - [ ] Test name normalization: "s1mple" and "s1mple " (with space) treated as same player
  - [ ] Test batch compilation: compile 50 matches in parallel without overload

- [ ] **Commit Phase 2.3.3 completion**
  - [ ] `git commit -m "feat(legacy-compiler): Add circuit breaker, conflict detection, scrapers enhanced, 40 test cases"`

### Phase 2.3.4: Type Contract Verification

**Specialist-C (final task, all participants)**

- [ ] **Manual Type Contract Review**
  - [ ] Compare TypeScript types (data/schemas/) with Python types (packages/shared/api/schemas/)
  - [ ] For each of 10+ common types:
    - [ ] Field names match (camelCase ↔ snake_case)
    - [ ] Field types equivalent (number ↔ float, string ↔ str, etc.)
    - [ ] Optionality matches (null ↔ Optional, undefined ↔ None)
    - [ ] Enum values identical

- [ ] **Automated Type Parity Tests**
  - [ ] File: `tests/schema-parity/check_contracts.ts`
    - Load TypeScript `.d.ts` files
    - Extract type definitions
    - Compare against known Python models

  - [ ] File: `tests/schema-parity/check_contracts.py`
    - Import Pydantic models
    - Extract field annotations
    - Cross-compare with TypeScript types

  - [ ] Run: `python tests/schema-parity/check_contracts.py && npx ts-node tests/schema-parity/check_contracts.ts`
  - [ ] Expected: 0 mismatches reported

### Phase 2.3 Completion Criteria

✅ **Gate 2.3 (Service Tests) PASSED When:**
- TeneT Verification: 40 test cases pass, all endpoints respond with correct status codes
- WebSocket: 30 test cases pass, message dedup + heartbeat working
- Legacy Compiler: 40 test cases pass, circuit breaker + conflict detection working
- Total: 110+ new test cases (plus existing 115 from Phase 1) = 225+ total

✅ **Gate 2.6 (Type Contracts) PASSED When:**
- Manual review confirms all 10+ common types match between TS and Python
- Automated parity tests report 0 mismatches
- No breaking type changes detected

---

## Phase 2.4 Launch: API Documentation

**Timeline:** ~2 hours
**Assigned To:** Specialist-D
**Blocking Until:** Phase 2.3 complete

### Phase 2.4 Tasks

- [ ] **Generate OpenAPI/Swagger Specs**
  - [ ] Run: `python -c "from services.tenet_verification.main import app; import json; print(json.dumps(app.openapi()))"`
  - [ ] Save to: `infra/api/openapi.tenet-verification.json`
  - [ ] Repeat for websocket and legacy-compiler services

- [ ] **Create Service Integration Tests** (15 test cases)
  - [ ] Service startup order (health checks in sequence)
  - [ ] Inter-service communication (verification → review queue visible)
  - [ ] Data flow validation (Pandascore → WebSocket → state updated)
  - [ ] Type contract enforcement (all responses validate against Pydantic schemas)
  - [ ] Error propagation (service A error doesn't crash service B)
  - [ ] Rate limiting enforcement (100 req/min limit honored)
  - [ ] Database transaction isolation (concurrent requests don't conflict)
  - [ ] Middleware propagation (request ID threads through all services)
  - [ ] Circuit breaker behavior (service recovers after transient failure)
  - [ ] Caching behavior (repeated requests served from cache)
  - [ ] Graceful shutdown (in-flight requests drain before exit)
  - [ ] Load handling (1000 concurrent requests per service)
  - [ ] Message ordering (WebSocket maintains FIFO order)
  - [ ] Timestamp consistency (all services use UTC, ISO8601 format)
  - [ ] Logging completeness (all requests logged with context)

- [ ] **Create Admin Panel Integration Docs**
  - [ ] File: `docs/services/ADMIN_PANEL_INTEGRATION.md`
  - [ ] Sections:
    - TeneT review queue architecture
    - Manual review workflow (fetch pending → submit decision → update DB)
    - Permission model (admin-only endpoints, optional auth)
    - Real-time updates (polling vs WebSocket)
    - Admin panel API endpoints (GET /v1/review-queue, POST /v1/review/{entity_id})

### Phase 2.4 Completion Criteria

✅ **Gate 2.4 (API Docs) PASSED When:**
- OpenAPI specs exist for all 3 services
- 15 integration test cases pass
- Admin integration docs complete (500+ words)

---

## Phase 2.5 Launch: Frontend Integration

**Timeline:** ~4 hours (can start after 2.2, but depends on 2.3 for API finalization)
**Assigned To:** Specialist-A (2nd task after 2.0) or Specialist-D
**Blocking Until:** Phase 2.3 complete (service APIs stable)

### Phase 2.5 Tasks

- [ ] **Create @njz/service-client Library**
  - [ ] File: `packages/@njz/service-client/package.json`
  - [ ] Main export: `packages/@njz/service-client/src/index.ts`
  - [ ] Modules:
    - `tenetVerification`: verify(), getReviewQueue(), submitReview(), getStatus()
    - `liveMatch`: watchMatch(), getRecentEvents()
    - `legacy`: getCompiledMatch(), searchPlayers(), searchTeams()

  - [ ] Implementation: HTTP + WebSocket wrappers
    - Use `fetch` for REST endpoints
    - Use `WebSocket` API (or `ws` package) for real-time updates
    - Proper error handling + type safety via TypeScript types from `@njz/types`

- [ ] **Integrate with SATOR Hub** (`apps/web/src/hub-1-sator/`)
  - [ ] Import `tenetVerification` client
  - [ ] Import `legacy` client
  - [ ] Use in:
    - Match detail pages: fetch VerifiedMatch via `legacy.getCompiledMatch(matchId)`
    - Player stats: include TeneT confidence badge
    - Analytics charts: use verified data from Path B

- [ ] **Integrate with ROTAS Hub** (`apps/web/src/hub-2-rotas/`)
  - [ ] Import `legacy` client
  - [ ] Use in:
    - Leaderboards: populate from `legacy.searchPlayers()` and `legacy.searchTeams()`
    - Historical stats: use verified data with confidence scores

- [ ] **Integrate with OPERA Hub** (`apps/web/src/hub-4-opera/`)
  - [ ] Import `liveMatch` client
  - [ ] Use in:
    - Live tournament page: watch live matches via `liveMatch.watchMatch(matchId)`
    - Real-time score updates: broadcast WebSocket messages to UI

- [ ] **Create ServiceHealthStatus Component**
  - [ ] File: `apps/web/src/shared/components/ServiceHealthStatus.tsx`
  - [ ] Displays: status of 3 services (✅ healthy, ⚠️ degraded, ❌ down)
  - [ ] Updates every 30 seconds via polling
  - [ ] Shows in: admin panel footer, settings page, optional dashboard

- [ ] **Add Service Integration Tests** (Frontend E2E)
  - [ ] Test: Fetch live match data via WebSocket
  - [ ] Test: Fetch verified match history via REST
  - [ ] Test: Display confidence scores in UI
  - [ ] Test: Handle service unavailability gracefully (show error state)

### Phase 2.5 Completion Criteria

✅ **Phase 2.5 PASSED When:**
- `@njz/service-client` package created with 3 module exports
- SATOR/ROTAS/OPERA hubs updated to use service clients
- ServiceHealthStatus component renders and updates
- E2E tests confirm frontend → service pipelines work

---

## Final Gate Verification (Phase 2 Complete)

After all tasks complete, run the full Phase 2 gate verification:

```bash
# Gate 2.1: READMEs exist
test -f services/tenet-verification/README.md && \
test -f services/websocket/README.md && \
test -f services/legacy-compiler/README.md && \
echo "✅ Gate 2.1 PASSED" || echo "❌ Gate 2.1 FAILED"

# Gate 2.2: Health endpoints respond 200
docker-compose -f infra/docker/docker-compose.services.yml up -d && \
sleep 10 && \
curl -f http://localhost:8001/health && \
curl -f http://localhost:8002/health && \
curl -f http://localhost:8003/health && \
echo "✅ Gate 2.2 PASSED" || echo "❌ Gate 2.2 FAILED"

# Gate 2.3: Unit tests pass
pytest services/*/tests/ -v && \
echo "✅ Gate 2.3 PASSED (Service Tests)" || echo "❌ Gate 2.3 FAILED"

# Gate 2.4: Integration tests pass
pytest tests/integration/services/ -v && \
echo "✅ Gate 2.4 PASSED (Integration Tests)" || echo "❌ Gate 2.4 FAILED"

# Gate 2.6: Type contracts verified
python tests/schema-parity/check_contracts.py && \
npx ts-node tests/schema-parity/check_contracts.ts && \
echo "✅ Gate 2.6 PASSED" || echo "❌ Gate 2.6 FAILED"

# Mark gates in PHASE_GATES.md
echo "All Phase 2 gates passed! Update PHASE_GATES.md and unlock Phase 3."
```

---

## Success Criteria Summary

**Phase 2 is COMPLETE when:**
- [ ] Phase 2.0: Type cleanup (Gate 1.6 ✅)
- [ ] Phase 2.1: READMEs + Docker (Gate 2.1 ✅)
- [ ] Phase 2.2: Database migrations (Gate 2.2 ✅)
- [ ] Phase 2.3: Service implementations + 100+ new tests (Gate 2.3 ✅ + Gate 2.6 ✅)
- [ ] Phase 2.4: API documentation + 15 integration tests (Gate 2.4 ✅)
- [ ] Phase 2.5: Frontend service client + hub integrations (Derived from 2.3-2.4)
- [ ] All gates marked ✅ PASSED in `.agents/PHASE_GATES.md`
- [ ] Phase 3 remains 🟡 UNLOCKED (ready for parallel execution)

**Combined Result:** Phase 2 ✅ COMPLETE + Phase 3 🟡 UNLOCKED → Phase 4 🔒 BLOCKED (waiting for Phase 3 to also complete)
