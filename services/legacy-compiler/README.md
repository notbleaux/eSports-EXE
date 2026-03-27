[Ver001.002]

# Legacy Compiler Service — Path B Historical Data Pipeline

**Purpose:** Compile historical eSports data from VLR.gg, Liquidpedia, YouTube into verified match records.
**Status:** Phase 2.1 — Full scraper implementation with normalization and aggregation
**Language:** Python (FastAPI + BeautifulSoup + httpx + APScheduler)
**Data Sources:** VLR.gg, Liquidpedia, YouTube metadata, manual admin entry
**Port:** 8003

## Overview

The Legacy Compiler Service implements Path B (historical/authoritative data) collection for the NJZ eSports platform. It aggregates data from multiple community sources (VLR.gg, Liquidpedia, YouTube) and external APIs, normalizes player/team names, and routes verified results to the PostgreSQL truth layer via the TeneT Verification Service.

### Key Responsibilities

- **Data collection:** Scrape VLR.gg, Liquidpedia, YouTube for historical match/player/team data
- **Data normalization:** Standardize player/team names, handle Unicode, expand abbreviations
- **Conflict resolution:** Detect discrepancies and escalate to review queue
- **Rate limiting:** Comply with site terms of service (1 req/sec VLR, 0.5 req/sec Liquidpedia)
- **Caching:** Cache scrape results to minimize external requests (24-hour TTL)
- **Async scheduling:** Background scraper jobs via APScheduler
- **Data aggregation:** Combine multi-source data into single `SourceDataPayload`

## Architecture

Multi-source scrapers feed data aggregator → TeneT verification service (confidence scoring) → PostgreSQL truth layer.

**Four Core Components:**

1. **Scrapers** — Source-specific data extraction (async)
   - **VLRScraper** — Match history, tournament brackets, player stats from VLR.gg
   - **LiquidpediaScraper** — Team rosters, tournament history, player bios
   - **YouTubeExtractor** — Video metadata, team names, match descriptions
   - **DataAggregator** — Combines scraped data with conflict detection

2. **Normalization Engine** — Player/team name standardization
   - Unicode handling (accented characters, non-Latin scripts)
   - Abbreviation expansion (FNC → Fnatic, G2 → G2 Esports)
   - Fuzzy matching against known player/team databases

3. **Cache Layer** — Request deduplication and result caching
   - URL-based hashing (same URL within TTL → use cache)
   - Expiration enforcement (stale entries cleaned automatically)
   - Max size limits (500 MB configurable)

4. **Verification Integration** — Route verified data to TeneT service
   - Submits aggregated data as `SourceDataPayload`
   - Receives confidence scores and routing decisions
   - Handles conflicts (VLR vs Liquidpedia disagreement)

### Key Features
- **Rate Limiting:** VLR.gg (1 req/sec), Liquidpedia (0.5 req/sec)
- **Data Normalization:** Player names, team names with Unicode handling
- **Async Scraping:** Concurrent data collection via asyncio
- **Health Monitoring:** Real-time scraper status endpoints
- **Robots.txt Compliance:** User-Agent headers, request throttling
- **Caching:** 24-hour TTL cache with automatic expiration
- **Scheduling:** Background compilation jobs via APScheduler

### Scrapers Implemented

**VLRScraper** (2 methods, 150 lines)
- `scrape_match_history()` — Player match history from VLR.gg
- `scrape_tournament()` — Tournament brackets and results

**LiquidpediaScraper** (2 methods, 120 lines)
- `scrape_team_roster()` — Current team rosters with caching
- `scrape_tournament_history()` — Tournament listings by game

**YouTubeExtractor** (2 modes, 90 lines)
- API-based extraction (if YouTube API key provided)
- Fallback regex-based description parsing

## Endpoints

### Compilation
- `POST /v1/compile` — Trigger compilation via request body
- `POST /v1/compile/match/{match_id}?game=valorant` — Compile specific match
- `POST /v1/compile/player/{player_id}?game=valorant` — Compile player history

### Normalization
- `POST /v1/normalize/player?name=derke` — Normalize player name
- `POST /v1/normalize/team?name=fnatic` — Normalize team name (expands abbreviations)

### Health & Status
- `GET /v1/scraper/status` — Scraper health metrics (response times, availability)
- `GET /health` — Basic health check
- `GET /ready` — Readiness probe

## Local Development Setup

### Prerequisites

- Python 3.11+
- Poetry package manager
- httpx for HTTP requests (async)
- BeautifulSoup4 for HTML parsing
- Optional: YouTube API key (for full video metadata extraction)

### Installation & Setup

```bash
cd services/legacy-compiler

# Install dependencies via Poetry
poetry install

# Activate virtual environment
poetry shell

# Set environment variables (copy from .env.services.example)
cp ../../.env.services.example .env.local
# Optional: Add YOUTUBE_API_KEY if you want video metadata

# Run dev server with auto-reload
poetry run uvicorn main:app --reload --port 8003 --host 0.0.0.0

# In another terminal, test scrapers
poetry run pytest tests/test_scrapers.py -v

# Check imports
poetry run python -c "from main import VLRScraper, LiquidpediaScraper, DataAggregator; print('✅ Imports OK')"

# Type checking
poetry run mypy main.py --ignore-missing-imports
```

### Docker Development

```bash
# Build service image
docker build -f Dockerfile -t njz-legacy-compiler:latest .

# Run with isolated network
docker-compose -f ../../infra/docker/docker-compose.services.yml up legacy-compiler

# View logs
docker-compose -f ../../infra/docker/docker-compose.services.yml logs -f legacy-compiler

# Stop service
docker-compose -f ../../infra/docker/docker-compose.services.yml down
```

## Data Flow

1. **Request**: User/scheduler triggers `/v1/compile/match/{id}`
2. **Scraping**: VLRScraper, LiquidpediaScraper, YouTubeExtractor run concurrently
3. **Normalization**: Player/team names normalized against known databases
4. **Aggregation**: DataAggregator collects results → SourceDataPayload
5. **Verification**: Payload sent to TeneT verification service → confidence scoring
6. **Storage**: Verified data → PostgreSQL truth layer (Path B)

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VLR_RATE_LIMIT` | `1.0` | VLR.gg requests per second (1.0 = 1 req/sec) |
| `LIQUIDPEDIA_RATE_LIMIT` | `0.5` | Liquidpedia requests per second |
| `CACHE_TTL_HOURS` | `24` | Cache expiration time in hours |
| `CACHE_MAX_SIZE_MB` | `500` | Max cache size before cleanup (MB) |
| `YOUTUBE_API_KEY` | `` | YouTube Data API key (optional) |
| `USER_AGENT` | `Mozilla/5.0 ...` | HTTP User-Agent for scraping |
| `REQUEST_TIMEOUT` | `30` | Request timeout in seconds |
| `LOG_LEVEL` | `INFO` | Logging verbosity (DEBUG, INFO, WARNING, ERROR) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |

### Optional Integrations

- **TeneT Verification Service:** Route compiled data to `http://tenet-verification:8000/v1/verify` for confidence scoring
- **YouTube API:** If `YOUTUBE_API_KEY` set, extract full video metadata (duration, description, channel info)
- **APScheduler:** Background scraper jobs (e.g., daily Liquidpedia tournament sync)

## Testing

### Unit Tests

```bash
# Run all tests
poetry run pytest tests/ -v

# Run scraper tests specifically
poetry run pytest tests/test_scrapers.py -v

# Run normalization tests
poetry run pytest tests/test_normalization.py -v

# Run with coverage report
poetry run pytest tests/ --cov=main --cov-report=html
```

### Integration Tests

```bash
# Test against live services (caution: makes real HTTP requests)
poetry run pytest tests/integration/test_vlr_scraper_live.py -v

# Test with cached responses
poetry run pytest tests/integration/test_with_mocks.py -v

# Test verification service integration
poetry run pytest tests/integration/test_tenet_integration.py -v
```

### Manual Testing

```bash
# Test player compilation
curl -X POST http://localhost:8003/v1/compile/player/derke?game=valorant

# Test match compilation
curl -X POST http://localhost:8003/v1/compile/match/vlr_match_123?game=valorant

# Check scraper health
curl http://localhost:8003/v1/scraper/status

# View cache statistics
curl http://localhost:8003/v1/cache/stats
```

### Test Coverage

- Scraper tests (8 test cases)
  - VLR.gg match history, tournament parsing
  - Liquidpedia roster scraping, caching
  - YouTube metadata extraction
  - Network timeout and retry logic
- Normalization tests (6 test cases)
  - Player name standardization, fuzzy matching
  - Team name expansion, abbreviation handling
  - Unicode normalization (accented characters)
  - Conflict detection (VLR vs Liquidpedia mismatches)
- Cache tests (4 test cases)
  - URL-based deduplication, TTL enforcement
  - Cache expiration, cleanup policies
  - Max size limits and LRU eviction
- Integration tests (5 test cases)
  - End-to-end compilation (scrape → normalize → verify)
  - Error recovery (failed scrape → retry logic)
  - Verification service routing

**Total: 23+ test cases**

## Deployment

### Kubernetes / Orchestration

```yaml
# health check configuration
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 15
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 10
```

### Scheduled Compilation Jobs

Use APScheduler for background tasks:

```bash
# Run daily Liquidpedia tournament sync at 01:00 UTC
poetry run python -c "from main import scheduler; scheduler.start()"
```

## Monitoring & Alerts

### Health Endpoints

```bash
# Service health (includes scraper availability)
curl http://localhost:8003/health

# Readiness check (cache loaded)
curl http://localhost:8003/ready

# Scraper status (response times, success rates)
curl http://localhost:8003/v1/scraper/status
```

### Key Metrics to Monitor

- `vlr_response_time_ms` — VLR.gg latency (target: 500–2000ms)
- `liquidpedia_response_time_ms` — Liquidpedia latency
- `cache_hit_ratio` — Percentage of requests served from cache (target: > 80%)
- `scrape_success_rate` — Percentage of successful requests (target: > 95%)
- `normalization_accuracy` — Correct player/team matches (target: > 98%)
- `verification_queue_size` — Pending items awaiting verification

### Typical Issues & Fixes

| Issue | Symptom | Fix |
| --- | --- | --- |
| High scrape latency | Response time > 5 sec | Check network, verify rate limits not exceeded |
| Cache growing unbounded | CACHE_MAX_SIZE_MB exceeded | Check CACHE_TTL_HOURS, run manual cleanup |
| HTML parsing failures | Scraper returns empty data | Site structure changed; update BeautifulSoup selectors |
| Rate limit errors | 429 Too Many Requests | Reduce VLR_RATE_LIMIT, add exponential backoff |
| Verification queue backlog | Items pending > 1 hour | Check TeneT service health, increase parallelism |

## Known Limitations

- **YouTube extraction:** Limited without API key; requires `YOUTUBE_API_KEY` env var for full metadata
- **VLR.gg HTML parsing:** Fragile to site layout changes; updates required if VLR redesigns pages
- **Liquidpedia caching:** Team pages cached 7 days (update interval configurable)
- **No OCR/CV:** No video round-by-round extraction (Phase 3 task)
- **Async limitations:** Some sites may have JS-heavy content; static scraping has blind spots

## See Also

- `data/schemas/tenet-protocol.ts` — SourceDataPayload, VerificationStatus
- `services/tenet-verification/` — Data verification and confidence scoring
- `packages/shared/axiom-esports-data/` — Data pipeline integration patterns
- `infra/docker/docker-compose.services.yml` — Multi-service orchestration
- `.agents/PHASE_2_PLAN.md` — Phase 2 architecture details
