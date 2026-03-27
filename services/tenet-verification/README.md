[Ver001.002]

# TeneT Verification Service — Data Verification Bridge

**Purpose:** TeneT Key.Links verification bridge — verifies multi-source data and routes to Path A (Live) or Path B (Legacy Truth Layer).
**Language:** Python (FastAPI + SQLAlchemy + PostgreSQL)
**Port:** 8001
**Status:** Phase 2.1 Implementation Complete

## Overview

The TeneT Verification Service is the authoritative data verification bridge for the NJZ eSports platform. It implements a weighted consensus algorithm to evaluate conflicting data from multiple sources (Pandascore, VLR.gg, Liquidpedia, YouTube, manual review) and assigns confidence scores to determine data routing and authenticity.

### Key Responsibilities

- **Multi-source consensus:** Aggregate data from 10+ sources with configurable trust levels
- **Conflict detection:** Identify disagreements between sources at field level
- **Confidence scoring:** Calculate trust-weighted averages with agreement bonuses/penalties
- **Routing decisions:** Route ACCEPTED data to Path B (PostgreSQL truth layer) or flag for manual review
- **Review queue:** Maintain dashboard for manual review of low-confidence records
- **Audit trail:** Log all verification decisions for compliance and debugging

## Architecture

**Three Core Components:**

1. **ConfidenceCalculator** — Weighted consensus algorithm
   - Input: List of data sources with trust levels
   - Output: Confidence score (0.0–1.0) with field-level conflict detection
   - Algorithm: Trust-weighted average + field-level agreement bonus/penalty
   - Handles missing fields, NULL values, and data type mismatches

2. **Verification Records** — SQLAlchemy ORM models with async session management
   - `VerificationRecord` — Master verification result with routing decision
   - `DataSourceContribution` — Per-source contribution audit trail
   - `ReviewQueue` — Flagged entities awaiting manual review
   - Indexed for fast filtering by entity_id, created_at, status

3. **API Endpoints** — RESTful verification interface with rate limiting
   - `/v1/verify` — Submit data for verification (100 req/min per IP)
   - `/v1/review-queue` — List flagged entities (filterable, paginated)
   - `/v1/review/{entity_id}` — Submit manual review decision
   - `/v1/status/{entity_id}` — Check current verification status
   - `/health` — Service health (DB connection, Redis availability)
   - `/ready` — Readiness probe (for orchestration)

## Data Sources & Trust Levels

| Source Type | Trust Level | Weight | Use Case |
|---|---|---|---|
| `pandascore_api` | HIGH (1.0) | 1.0 | Official match data |
| `riot_official_api` | HIGH (1.0) | 1.0 | Valorant official |
| `video_manual_review` | HIGH (1.0) | 1.0 | Human-reviewed video |
| `minimap_analysis` | MEDIUM (0.7) | 0.8 | Computer vision on map |
| `livestream_grading` | MEDIUM (0.7) | 0.8 | Analyst review |
| `liquidpedia_scrape` | MEDIUM (0.7) | 0.6 | Tournament info |
| `vlr_scrape` | LOW (0.4) | 0.5 | Community site |
| `youtube_extract` | LOW (0.4) | 0.5 | Video descriptions |
| `fan_forum` | LOW (0.4) | 0.3 | Community submissions |
| `manual_entry` | HIGH (1.0) | 0.9 | Admin input |

## Confidence Thresholds

- **≥ 0.90:** `ACCEPTED` → Route to **Path B (Legacy Truth Layer)** for high-confidence data
- **0.70–0.89:** `FLAGGED` → Queue for **manual review** before routing
- **< 0.70:** `REJECTED` → Not stored (insufficient confidence)

## API Endpoints

### Verification

**POST /v1/verify** — Submit multi-source data for verification
```json
{
  "entityId": "match_001",
  "entityType": "match",
  "game": "valorant",
  "sources": [
    {
      "sourceType": "pandascore_api",
      "trustLevel": "HIGH",
      "weight": 1.0,
      "data": { "final_score": 100, "winner_id": "team_a" },
      "capturedAt": "2026-03-27T10:00:00Z"
    }
  ]
}
```

Response:
```json
{
  "entityId": "match_001",
  "status": "ACCEPTED",
  "confidence": {
    "value": 0.95,
    "sourceCount": 1,
    "bySource": [...],
    "hasConflicts": false,
    "conflictFields": [],
    "computedAt": "2026-03-27T10:00:05Z"
  },
  "distributionPath": "PATH_B_LEGACY",
  "verifiedAt": "2026-03-27T10:00:05Z",
  "metadata": {...}
}
```

### Review Queue

**GET /v1/review-queue** — List flagged entities
```
?game=valorant    # Filter by game (optional)
?limit=50         # Items per page (default: 50, max: 500)
?offset=0         # Pagination offset (default: 0)
```

Response: Array of `ReviewQueueItem` objects

**POST /v1/review/{entity_id}** — Submit manual review decision
```json
{
  "reviewerId": "admin_001",
  "decision": "ACCEPT",
  "notes": "Verified against VLR and Pandascore, data is accurate"
}
```

### Status

**GET /v1/status/{entity_id}** — Check current verification status
```
Response: VerificationResult (see /v1/verify response format)
```

## Database Schema

**VerificationRecord**
- `id` (PK): Unique verification ID
- `entity_id`, `entity_type`, `game`: Entity identifiers
- `status`: ACCEPTED | FLAGGED | REJECTED | MANUAL_OVERRIDE
- `confidence_value`: 0.0–1.0 score
- `confidence_breakdown`: JSON with field-level details
- `conflict_fields`: Array of fields where sources disagreed
- `distribution_path`: PATH_A_LIVE | PATH_B_LEGACY | BOTH | NONE
- `verified_at`, `created_at`: Timestamps

**DataSourceContribution**
- `id` (PK): Source contribution ID
- `verification_id` (FK): Links to VerificationRecord
- `source_type`, `trust_level`, `weight`: Source metadata
- `source_confidence`: Per-source confidence
- `ingested_at`: When this source was received

**ReviewQueue**
- `id` (PK): Review item ID
- `verification_id` (FK): Links to VerificationRecord
- `entity_id`, `entity_type`, `game`: For filtering
- `reason`: Why this was flagged
- `confidence_value`: The confidence that triggered review
- `reviewer_id`, `review_decision`, `review_notes`: Manual review data
- `flagged_at`, `reviewed_at`: Timestamps

## Confidence Algorithm

```
base_score = Σ(weight[i] / total_weight × trust_multiplier[i])
             for each source i

agreement_bonus = 0.15 × (agreed_fields / total_critical_fields)
                  if sources agree on critical fields

conflict_penalty = 0.10 × (conflict_fields / total_critical_fields)
                   if sources disagree on any field

final_score = min(1.0, base_score + agreement_bonus - conflict_penalty)
```

Critical fields checked for agreement:
- `final_score`
- `round_result`
- `winner_id`
- `kills`
- `deaths`

## Local Development Setup

### Prerequisites

- Python 3.11+
- Poetry package manager
- PostgreSQL 15+ (local or Docker)
- Redis (optional, for distributed caching)

### Installation & Setup

```bash
cd services/tenet-verification

# Install dependencies via Poetry
poetry install

# Activate virtual environment
poetry shell

# Set environment variables (copy from .env.services.example)
cp ../../.env.services.example .env.local
# Edit .env.local with local database URL

# Create database tables (runs Alembic migrations)
alembic upgrade head

# Run dev server with auto-reload
poetry run uvicorn main:app --reload --port 8001 --host 0.0.0.0

# In another terminal, run tests in watch mode
poetry run pytest tests/ -v --tb=short

# Type checking
poetry run mypy main.py --ignore-missing-imports
```

### Docker Development

```bash
# Build service image using template
docker build -f Dockerfile -t njz-tenet-verification:latest .

# Run with PostgreSQL from compose
docker-compose -f ../../infra/docker/docker-compose.services.yml up tenet-verification

# View logs
docker-compose -f ../../infra/docker/docker-compose.services.yml logs -f tenet-verification

# Stop service
docker-compose -f ../../infra/docker/docker-compose.services.yml down
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@localhost/njz_esports` | PostgreSQL connection string |
| `CONFIDENCE_THRESHOLD_AUTO_ACCEPT` | `0.90` | Score ≥ this → auto-route to Path B |
| `CONFIDENCE_THRESHOLD_FLAG` | `0.70` | Score 0.70–0.89 → flag for manual review |
| `REVIEW_QUEUE_RETENTION_DAYS` | `30` | Auto-delete reviews older than this |
| `LOG_LEVEL` | `INFO` | Logging verbosity (DEBUG, INFO, WARNING, ERROR) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_ENABLE` | `true` | Enable rate limiting on /v1/verify |
| `RATE_LIMIT_RPM` | `100` | Rate limit: requests per minute per IP |

### Required Connections

- **Database:** PostgreSQL 15+ (async driver: asyncpg)
- **Alembic Migrations:** Must run `alembic upgrade head` before first startup
- **Optional Redis:** For distributed rate limiting (slowapi backend)

## Integration Points

1. **Ingest Sources** → Collect data from multiple sources
2. **TeneT Verification** → Submit to `/v1/verify` endpoint
3. **Path B Legacy** → Store ACCEPTED results in PostgreSQL truth layer
4. **Manual Review** → Monitor `/v1/review-queue` for flagged items
5. **Route Updates** → Change distribution path on manual review

## Testing

### Unit Tests

```bash
# Run all tests
poetry run pytest tests/ -v

# Run specific test file
poetry run pytest tests/test_confidence_calculator.py -v

# Run with coverage report
poetry run pytest tests/ --cov=main --cov-report=html

# Run tests matching pattern
poetry run pytest tests/ -k "confidence" -v
```

### Integration Tests

```bash
# Start services in Docker first
docker-compose -f ../../infra/docker/docker-compose.services.yml up -d

# Run integration suite
poetry run pytest tests/integration/ -v

# Test against live service
poetry run pytest tests/integration/test_endpoints.py::test_verify_endpoint -v
```

### Test Coverage

- ✅ Confidence calculation algorithm (8 test cases)
  - Single source, multiple sources, conflicts
  - Trust level weighting, agreement bonus/penalty
  - NULL values and missing fields handling
- ✅ HTTP endpoint responses (6 test cases)
  - POST /v1/verify request/response validation
  - GET /v1/status/{entity_id} retrieval
  - GET /health and /ready probes
- ✅ Conflict detection (3 test cases)
  - Field-level disagreements, partial agreement
  - Conflict scoring and escalation rules
- ✅ Review queue operations (4 test cases)
  - Filtering by game, status, priority
  - Pagination and sorting
  - Retention policy enforcement
- ✅ Manual review workflow (2 test cases)
  - Review decision submission
  - Review → verification record update propagation
- ✅ Distribution path logic (3 test cases)
  - ACCEPTED → PATH_B_LEGACY routing
  - FLAGGED → review queue placement
  - REJECTED → not stored

**Total: 26+ test cases covering critical paths**

## Deployment

### Kubernetes / Orchestration

```yaml
# health check configuration
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Database Migrations

Always run migrations before deployment:

```bash
# Connect to production database
alembic upgrade head

# Verify migration status
alembic current
```

## Monitoring & Alerts

### Health Endpoints

```bash
# Service health (includes DB, Redis status)
curl http://localhost:8001/health

# Readiness check (can accept traffic)
curl http://localhost:8001/ready

# Metrics (connection pools, request counts)
curl http://localhost:8001/metrics
```

### Typical Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| DB connection failed | `/ready` returns 503 | Check DATABASE_URL, postgres service running |
| High latency on /v1/verify | Response time > 2s | Check review queue size, add index on entity_id |
| Memory leak | Processes growing | Check connection pool settings, verify cleanup in lifespan |
| Stale reviews not deleted | Review queue grows unbounded | Adjust REVIEW_QUEUE_RETENTION_DAYS, run cleanup job |

## See Also

- `data/schemas/tenet-protocol.ts` — Type contracts and data sources
- `packages/shared/api/schemas/` — Pydantic models for request/response validation
- `services/websocket/` — Path A real-time distribution
- `services/legacy-compiler/` — Data source: VLR/Liquidpedia compilation
- `docs/architecture/TENET_TOPOLOGY.md` — Full TENET architecture
