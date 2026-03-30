[Ver001.000]

# Scout Reports Compilation & Task Enhancement

**Date:** 2026-03-30  
**Compiled by:** Technical Lead  
**Scouts:** A (Backend), B (Data Pipeline), C (Analytics)

---

## EXECUTIVE SUMMARY

Three specialist scouts have completed reconnaissance. Critical gaps identified across all domains. Immediate action required on PgBouncer, TENET integration, and SimRating transparency.

| Domain | Health | Critical Issue | ETA to Fix |
|--------|--------|----------------|------------|
| Backend | 🟡 | No PgBouncer, rate limiting incomplete | 8-12 hrs |
| Data Pipeline | 🟡 | TENET stubbed, PandaScore fragile | 20-30 hrs |
| Analytics | 🟡 | ML never trained, formula mismatch | 16-24 hrs |

---

## SCOUT A: BACKEND INFRASTRUCTURE FINDINGS

### Critical Finding 1: No PgBouncer (HIGH RISK)
**Location:** `packages/shared/api/src/db_manager.py`

**Current:**
```python
self.pool = await asyncpg.create_pool(
    dsn=dsn,
    min_size=2,
    max_size=5,  # Direct to Supabase
)
```

**Risk:** Connection exhaustion at ~10 concurrent users (5 pool × 2 workers)

**Enhanced Task:**
```
TASK: Implement PgBouncer Connection Pooling
PRIORITY: P0 - IMMEDIATE
ESTIMATE: 4-6 hours

ACTIONS:
1. Add PgBouncer service to render.yaml
   - pool_mode: transaction
   - max_client_conn: 100
   - default_pool_size: 20
   
2. Update DATABASE_URL in .env.render
   FROM: postgresql://...supabase.co:5432
   TO: postgresql://...supabase.co:6543 (pooler port)
   
3. Test connection pooling under load
   - Use locust to simulate 50 concurrent users
   - Verify no connection exhaustion

4. Monitor connection metrics
   - Add Prometheus gauge for pool utilization
   - Alert at 80% pool usage

VERIFICATION:
- PgBouncer responds on port 6432
- API connects through PgBouncer (not direct)
- 50 concurrent requests succeed without errors
```

---

### Critical Finding 2: Rate Limiting Incomplete (HIGH RISK)
**Location:** `services/api/main.py`, route files

**Current:** Only `/auth/*` endpoints have rate limits

**Enhanced Task:**
```
TASK: Implement Comprehensive Rate Limiting
PRIORITY: P0 - IMMEDIATE
ESTIMATE: 3-4 hours

ACTIONS:
1. Create rate limit configuration file
   config/rate_limits.yaml:
   ```yaml
   anonymous:
     default: 30/minute
     burst: 5
     
   authenticated:
     default: 100/minute
     ml_inference: 10/minute
     write_operations: 30/minute
     
   endpoints:
     /v1/players: { limit: 60/minute, cache: 300s }
     /v1/matches: { limit: 60/minute, cache: 60s }
     /v1/simrating/*: { limit: 30/minute, cache: 600s }
     /v1/vod-tags: { limit: 30/minute, burst: 10 }
     /ws/*: { connections: 1/user, messages: 10/sec }
   ```

2. Apply rate limits to all routers
   - packages/shared/api/routers/players.py
   - packages/shared/api/routers/matches.py
   - packages/shared/api/routers/simrating.py
   - packages/shared/api/routers/vod_tags.py
   - packages/shared/api/src/sator/websocket.py

3. Implement Redis-backed storage for distributed rate limiting
   - Current: In-memory only (won't work across instances)
   - Required: Upstash Redis for rate limit counters

4. Add rate limit headers to responses
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 87
   X-RateLimit-Reset: 1640995200

VERIFICATION:
- All API endpoints return 429 when limit exceeded
- Rate limit headers present in all responses
- WebSocket enforces connection limits
```

---

### Finding 3: Firewall Middleware is Stub (MEDIUM RISK)
**Location:** `packages/shared/axiom_esports_data/api/src/middleware/firewall.py`

**Enhanced Task:**
```
TASK: Implement Data Partition Firewall
PRIORITY: P1 - HIGH
ESTIMATE: 3-4 hours

ACTIONS:
1. Import GAME_ONLY_FIELDS from @sator/data-partition-lib
2. Implement request/response filtering
3. Add unit tests for field stripping
4. Document firewall behavior

NOTE: This is security-critical. GAME_ONLY_FIELDS must never leak to web.
```

---

## SCOUT B: DATA PIPELINE FINDINGS

### Critical Finding 1: PandaScore Client Lacks Resilience (CRITICAL)
**Location:** `services/api/src/njz_api/clients/pandascore.py`

**Current:** No retries, no rate limit handling, hard failures

**Enhanced Task:**
```
TASK: Harden PandaScore Client
PRIORITY: P0 - IMMEDIATE
ESTIMATE: 4-6 hours

ACTIONS:
1. Add tenacity retry decorator
   @retry(
       stop=stop_after_attempt(3),
       wait=wait_exponential(multiplier=1, min=4, max=10),
       retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError))
   )

2. Implement rate limit handling
   - Parse X-RateLimit-Remaining header
   - Sleep when approaching limit
   - Queue requests if limit exceeded

3. Add Pydantic response validation
   class PandascoreMatch(BaseModel):
       id: int
       name: str
       status: Literal["upcoming", "running", "finished"]
       ...

4. Add circuit breaker for cascading failures
   - Open after 5 failures in 60 seconds
   - Half-open after 30 seconds
   - Close on success

5. Implement fallback to cached data
   - Redis cache for 1 hour
   - Serve stale data if API down

VERIFICATION:
- Unit tests for retry logic
- Simulate API failure, verify graceful degradation
- Cache hit rate >80%
```

---

### Critical Finding 2: TENET Integration is Stubbed (CRITICAL)
**Location:** `services/api/src/verification/routes.py`

**Current:** Routes return empty lists and 404s

**Enhanced Task:**
```
TASK: Implement TENET Verification Integration
PRIORITY: P0 - IMMEDIATE
ESTIMATE: 16-24 hours

ACTIONS:
1. Wire up TENET service client
   - BaseURL: http://localhost:8001 (or env TENET_SERVICE_URL)
   - Connect to live database for match queries

2. Replace stubbed routes with actual queries
   /v1/verification/live/matches
   /v1/verification/matches/{match_id}/confidence
   /v1/verification/review-queue

3. Implement verification workflow
   - New match data → TENET service → confidence score
   - Low confidence → Review queue → Manual override
   - Verified → Path B routing → PostgreSQL

4. Add confidence scoring to API responses
   {
     "match_id": "123",
     "data": {...},
     "verification": {
       "confidence": 0.92,
       "tier": "high",
       "sources": ["pandascore"],
       "verified_at": "2026-03-30T..."
     }
   }

5. Document TENET architecture
   - Update docs to reflect ACTUAL implementation
   - Remove references to unimplemented features

DECISION: Implement core verification OR remove marketing claims.
```

---

### Finding 3: TimescaleDB is Documentation-Only (MEDIUM)
**Location:** Migrations, docker-compose

**Enhanced Task:**
```
TASK: Decide on TimescaleDB Strategy
PRIORITY: P1 - HIGH
ESTIMATE: 2 hours decision + 8 hours implementation

OPTIONS:
A) Implement TimescaleDB (recommended for scale)
   - Add timescaledb extension to docker-compose
   - Convert player_stats to hypertable
   - Convert match_events to hypertable
   - Add continuous aggregates for hourly rollups
   - Add compression policy for >90 day data

B) Remove from documentation
   - Update all docs to remove TimescaleDB references
   - Use PostgreSQL native partitioning
   - Document 500MB constraint handling

RECOMMENDATION: Option A if staying on free tier >6 months
              Option B if migrating to paid soon
```

---

## SCOUT C: ANALYTICS FINDINGS

### Critical Finding 1: ML Model Never Trained (HIGH)
**Location:** `services/api/src/njz_api/ml/train_simrating.py`

**Current:** Uses synthetic data, no real model artifacts

**Enhanced Task:**
```
TASK: Train and Deploy SimRating ML Model
PRIORITY: P0 - IMMEDIATE (blocks ML features)
ESTIMATE: 8-12 hours

ACTIONS:
1. Sync real data from PandaScore
   python -m njz_api.scripts.sync_pandascore
   - Target: 50K+ player_stats records
   - Verify: SELECT COUNT(*) FROM player_stats >= 50000

2. Fix training script bug
   Line 96: Currently always calls _synthetic_training_data()
   Fix: Call generate_training_data() when real data available

3. Run training on Kaggle (free GPU)
   - Upload training script to Kaggle notebook
   - Train for 50 epochs
   - Download model artifacts

4. Export to TFJS format
   model.export(format='tfjs', save_dir='apps/web/public/models/simrating/')

5. Verify inference works
   - Load model in browser
   - Test prediction on sample data
   - Performance <100ms per inference

6. Update useMLInference hook
   - Remove stub warning
   - Connect to actual model
   - Add error handling

VERIFICATION:
- Model files present in apps/web/public/models/simrating/
- Browser loads model without errors
- Predictions return in <100ms
- Performance better than weighted average baseline
```

---

### Critical Finding 2: Formula Mismatch (MEDIUM)
**Location:** SKILL.md vs actual implementation

**Issue:** 4-component vs 5-component formula

**Enhanced Task:**
```
TASK: Align SimRating Formula with Documentation
PRIORITY: P1 - HIGH
ESTIMATE: 6-8 hours

ACTIONS:
OPTION A: Implement Full 5-Component Formula
1. Add economy metrics to player_stats
   - buy_efficiency, save_round_wins
   
2. Add clutch metrics
   - clutch_win_rate, clutch_attempts
   
3. Add support metrics
   - assists_per_round, utility_usage
   
4. Add entry metrics
   - entry_success_rate, entry_attempts
   
5. Update formula calculation
   
OPTION B: Update Documentation to Match Reality
1. Revise SKILL.md to reflect 4-component formula
2. Document K/D, ACS, Consistency, Precision weights
3. Remove references to Economy, Clutch, Support, Entry
4. Update all marketing materials

RECOMMENDATION: Option B for MVP (faster), Option A for v2
```

---

### Finding 3: No Confidence Intervals (MEDIUM)
**Location:** SimRating calculation

**Enhanced Task:**
```
TASK: Implement Confidence Intervals for SimRating
PRIORITY: P1 - HIGH
ESTIMATE: 4-6 hours

ACTIONS:
1. Add bootstrap CI calculation to SimRatingCalculator
   - 1000 bootstrap samples
   - 95% confidence interval
   
2. Store CI bounds in database
   ALTER TABLE sim_calculations ADD COLUMN ci_lower FLOAT;
   ALTER TABLE sim_calculations ADD COLUMN ci_upper FLOAT;

3. Display CI in UI when sample size >= 30
   "SimRating: 78.5 [95% CI: 76.2 – 80.8]"
   
4. Gate low-confidence ratings
   - CI width >10 points → "insufficient_data" tier
   - Don't show grade if confidence tier is low

VERIFICATION:
- CI narrows as sample size increases
- CI width <5 for tier=high (50+ matches)
- UI displays CI appropriately
```

---

## INTEGRATED PRIORITY QUEUE

### P0 - Immediate (This Week)
1. **Deploy PgBouncer** (Scout A) - Connection pooling
2. **Harden PandaScore Client** (Scout B) - Add retries, circuit breaker
3. **Implement TENET Integration** (Scout B) - Wire up verification service
4. **Train ML Model** (Scout C) - Real data, not synthetic
5. **Implement Rate Limiting** (Scout A) - All endpoints

### P1 - High (Next 2 Weeks)
6. **Align SimRating Formula** (Scout C) - Doc or code fix
7. **Add Confidence Intervals** (Scout C) - Bootstrap CI
8. **Implement Firewall** (Scout A) - Data partition enforcement
9. **TimescaleDB Decision** (Scout B) - Implement or remove

### P2 - Medium (Month 2)
10. **RAR Implementation** (Scout C) - War-equivalent metric
11. **Advanced TENET Features** (Scout B) - Conflict detection, review workflow
12. **ML A/B Testing** (Scout C) - Model performance tracking

---

## RESOURCE ALLOCATION

### Agent Assignments (Updated)

| Agent | P0 Tasks | P1 Tasks | Total Hours |
|-------|----------|----------|-------------|
| A (Backend) | PgBouncer, Rate Limiting | Firewall | 15-20 hrs |
| B (Pipeline) | PandaScore, TENET | TimescaleDB | 24-34 hrs |
| C (Analytics) | ML Training | Formula, CI | 18-26 hrs |

### Parallel Execution Path
```
Week 1:
- Day 1-2: PgBouncer, PandaScore retries (Agents A+B)
- Day 3-4: TENET integration (Agent B)
- Day 5-7: ML training (Agent C)

Week 2:
- Day 1-3: Rate limiting, Firewall (Agent A)
- Day 4-5: Formula alignment (Agent C)
- Day 6-7: Confidence intervals (Agent C)
```

---

## VERIFICATION CHECKLIST

### P0 Verification
- [ ] PgBouncer responding on port 6432
- [ ] 50 concurrent API requests succeed
- [ ] PandaScore client retries on failure
- [ ] TENET routes return real data
- [ ] ML model files in public/models/simrating/
- [ ] All API endpoints rate limited
- [ ] Rate limit headers present

### P1 Verification
- [ ] Firewall strips GAME_ONLY_FIELDS
- [ ] SimRating formula matches documentation
- [ ] Confidence intervals displayed in UI
- [ ] TimescaleDB decision documented

---

## DECISION LOG UPDATES

| ID | Decision | Rationale | Impact |
|----|----------|-----------|--------|
| D006 | Implement PgBouncer vs direct | Scout found connection exhaustion risk | HIGH |
| D007 | Fix TENET integration | Currently stubbed, user confusion | HIGH |
| D008 | Align SimRating formula | Mismatch between docs and code | MEDIUM |
| D009 | TimescaleDB implement vs remove | Current vaporware state | MEDIUM |

---

*Compilation complete. All scout findings integrated into enhanced task queue. Proceeding to final verification.*
