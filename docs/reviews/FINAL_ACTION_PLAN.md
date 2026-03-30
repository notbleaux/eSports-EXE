[Ver001.000]

# FINAL ACTION PLAN
## Post-Scout Verification & Execution Directive

**Date:** 2026-03-30  
**Status:** APPROVED FOR EXECUTION  
**Authorization:** Technical Lead (Final Checkpoint)

---

## VERIFICATION COMPLETE

All three scout passes completed. Findings validated. Plans optimized for:
- ✅ **Free tier constraints** (zero budget maintained)
- ✅ **Repository policies** (no violations)
- ✅ **Scalability** (PgBouncer, connection pooling)
- ✅ **Transparency** (SimRating methodology published)

---

## CRITICAL FINDINGS SUMMARY

| Finding | Scout | Severity | Status |
|---------|-------|----------|--------|
| No PgBouncer | A | 🔴 CRITICAL | Ready to implement |
| TENET stubbed | B | 🔴 CRITICAL | Ready to implement |
| PandaScore fragile | B | 🔴 CRITICAL | Ready to implement |
| ML never trained | C | 🔴 CRITICAL | Ready to implement |
| Rate limiting incomplete | A | 🟡 HIGH | Ready to implement |
| Formula mismatch | C | 🟡 HIGH | Decision needed |
| TimescaleDB vaporware | B | 🟡 MEDIUM | Decision needed |
| Firewall stub | A | 🟡 MEDIUM | Ready to implement |

---

## IMMEDIATE EXECUTION PLAN

### Phase 0: Critical Fixes (Days 1-3)

#### Task 0.1: Deploy PgBouncer
```yaml
task: Deploy PgBouncer Connection Pooling
owner: Agent A (Backend)
estimate: 4-6 hours
priority: P0

files_to_modify:
  - infrastructure/render.yaml (add PgBouncer service)
  - .env.render (update DATABASE_URL to port 6543)
  - packages/shared/api/src/db_manager.py (verify pool config)

implementation:
  1. Add PgBouncer to render.yaml:
     services:
       - type: pserv
         name: pgbouncer
         runtime: docker
         plan: standard
         envVars:
           - key: DATABASE_URL
             fromDatabase:
               name: njz-postgres
               property: connectionString
           - key: POOL_MODE
             value: transaction
           - key: MAX_CLIENT_CONN
             value: 100
           - key: DEFAULT_POOL_SIZE
             value: 20

  2. Update API environment:
     DATABASE_URL: postgresql://...supabase.co:6543/postgres
     (was: :5432, change to pooler port :6543)

  3. Test connection pooling:
     - Deploy to staging
     - Run locust load test (50 concurrent users)
     - Verify no connection exhaustion
     - Check PgBouncer metrics

verification:
  - PgBouncer responds on port 6432 internally
  - API connects through PgBouncer
  - 50 concurrent requests succeed
  - Pool utilization <80%
```

#### Task 0.2: Harden PandaScore Client
```yaml
task: Add Resilience to PandaScore Client
owner: Agent B (Pipeline)
estimate: 4-6 hours
priority: P0

files_to_modify:
  - services/api/src/njz_api/clients/pandascore.py
  - tests/integration/test_pandascore_client.py

implementation:
  1. Add tenacity retry decorator:
     from tenacity import retry, stop_after_attempt, wait_exponential
     
     @retry(
         stop=stop_after_attempt(3),
         wait=wait_exponential(multiplier=1, min=4, max=10),
         retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError))
     )
     async def _get(self, path: str, ...) -> Any:

  2. Add Pydantic response models:
     class PandascoreMatch(BaseModel):
         id: int
         name: str
         status: Literal["upcoming", "running", "finished"]
         begin_at: datetime
         end_at: Optional[datetime]
         
  3. Add rate limit handling:
     - Parse X-RateLimit-Remaining header
     - Sleep when approaching limit
     - Log rate limit status

  4. Add circuit breaker:
     @circuit_breaker(name="pandascore", failure_threshold=5)
     async def _get(...)

  5. Implement cache fallback:
     - Redis cache for 1 hour
     - Serve stale data if API down
     - Cache key: "pandascore:{endpoint}:{params_hash}"

verification:
  - Unit test: Simulated API failure triggers retry
  - Unit test: 3 failures trigger circuit breaker
  - Unit test: Cache returns data when API down
  - Integration test: Live API call succeeds
```

#### Task 0.3: Implement TENET Integration
```yaml
task: Wire Up TENET Verification Service
owner: Agent B (Pipeline)
estimate: 16-24 hours
priority: P0

files_to_modify:
  - services/api/src/verification/routes.py (replace stubs)
  - services/api/src/verification/tenet_integration.py (verify client)
  - services/api/main.py (ensure router included)

implementation:
  1. Replace stubbed routes with real queries:
     
     @router.get("/live/matches")
     async def get_live_matches(...) -> List[LiveMatchSummary]:
         # WAS: return []
         # NOW:
         async with db.pool.acquire() as conn:
             rows = await conn.fetch("""
                 SELECT m.*, v.confidence_score, v.confidence_tier
                 FROM matches m
                 LEFT JOIN verification_records v ON m.id = v.entity_id
                 WHERE m.status = 'live'
                 AND v.confidence_tier IN ('high', 'trusted')
             """)
         return [LiveMatchSummary(**row) for row in rows]

  2. Implement verification workflow:
     - New match → TENET service → confidence score
     - Score <0.70 → Review queue
     - Score >=0.70 → Verified

  3. Add verification to match responses:
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

  4. Update documentation:
     - Remove references to unimplemented features
     - Document actual TENET capabilities

verification:
  - GET /v1/verification/live/matches returns real data
  - GET /v1/verification/matches/{id} includes confidence
  - Review queue accessible in admin panel
  - Documentation matches implementation
```

#### Task 0.4: Train and Deploy ML Model
```yaml
task: Train SimRating ML Model on Real Data
owner: Agent C (Analytics)
estimate: 8-12 hours
priority: P0

files_to_modify:
  - services/api/src/njz_api/ml/train_simrating.py (fix bug)
  - services/api/src/njz_api/scripts/sync_pandascore.py (verify data)
  - apps/web/src/hub-1-sator/ml/simrating-model.ts (enable inference)

implementation:
  1. Sync real training data:
     cd services/api
     python -m njz_api.scripts.sync_pandascore
     
     # Verify:
     psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_stats;"
     # Should return >= 50000

  2. Fix training script bug (line 96):
     # WAS: X, y = _synthetic_training_data()
     # NOW:
     async with get_db_session() as session:
         X, y = await generate_training_data(session)

  3. Train on Kaggle (free GPU):
     - Create Kaggle notebook
     - Import training script
     - Train for 50 epochs
     - Download model artifacts

  4. Export to TFJS:
     model.export(format='tfjs', 
                  save_dir='apps/web/public/models/simrating/')

  5. Update inference hook:
     // apps/web/src/hooks/useMLInference.ts
     // Remove: return { error: 'ML features temporarily disabled' }
     // Add: Load model and run inference

verification:
  - Model files in apps/web/public/models/simrating/
  - Browser loads model without errors
  - Predictions return in <100ms
  - Performance better than weighted average
```

---

### Phase 1: High Priority (Days 4-7)

#### Task 1.1: Implement Comprehensive Rate Limiting
```yaml
task: Add Rate Limiting to All API Endpoints
owner: Agent A (Backend)
estimate: 3-4 hours
priority: P1

files_to_modify:
  - config/rate_limits.yaml (create)
  - packages/shared/api/routers/*.py (add decorators)
  - services/api/main.py (configure Redis backend)

implementation:
  1. Create rate limit config:
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
     ```

  2. Apply to all routers:
     @router.get("/players")
     @limiter.limit("60/minute")
     async def list_players(...)

  3. Implement Redis backend:
     # Use Upstash Redis for distributed rate limiting
     limiter = Limiter(
         key_func=get_remote_address,
         storage_uri=REDIS_URL,
         storage_options={"socket_connect_timeout": 30}
     )

  4. Add response headers:
     X-RateLimit-Limit: 100
     X-RateLimit-Remaining: 87
     X-RateLimit-Reset: 1640995200

verification:
  - All endpoints return 429 when limit exceeded
  - Rate limit headers present in responses
  - Redis storage working (not in-memory)
```

#### Task 1.2: Align SimRating Formula
```yaml
task: Decide and Implement SimRating Formula Alignment
owner: Agent C (Analytics)
estimate: 6-8 hours
priority: P1

decision_required: YES

options:
  A: Implement full 5-component formula (per SKILL.md)
     - Add economy, clutch, support, entry metrics
     - Update player_stats schema
     - Recalculate all ratings
     
  B: Update documentation to match reality
     - Revise SKILL.md to 4-component formula
     - Update marketing materials
     - Document K/D, ACS, Consistency, Precision weights

recommendation: OPTION B for MVP
  - Faster to implement (documentation only)
  - 4-component formula is simpler and functional
  - 5-component can be v2 enhancement
  - Avoids database migration complexity

implementation (Option B):
  1. Update SKILL.md:
     - Document actual 4-component formula
     - Remove Economy, Clutch, Support, Entry references
     - Document weights: K/D (30%), ACS (25%), Consistency (25%), Precision (20%)
     
  2. Update API documentation:
     - Document component breakdown in API responses
     - Add formula version to response headers
     
  3. Publish methodology:
     - Create docs/reports/SIMRATING_METHODOLOGY.md
     - Include open formula, confidence intervals, validation approach

verification:
  - Documentation matches implementation
  - API responses include formula version
  - Published methodology is transparent
```

#### Task 1.3: Implement Confidence Intervals
```yaml
task: Add Bootstrap Confidence Intervals to SimRating
owner: Agent C (Analytics)
estimate: 4-6 hours
priority: P1

files_to_modify:
  - services/api/src/njz_api/ml/simrating.py (add CI calculation)
  - services/api/src/njz_api/models/sim_calculation.py (add columns)
  - infra/migrations/versions/008_simrating_confidence_intervals.py
  - apps/web/src/components/PlayerRatingCard.tsx (display CI)

implementation:
  1. Add bootstrap CI calculation:
     def _bootstrap_ci(self, matches: List[PlayerMatchStats],
                       n_bootstrap: int = 1000) -> Tuple[float, float]:
         scores = []
         n = len(matches)
         for _ in range(n_bootstrap):
             resampled = np.random.choice(matches, size=n, replace=True)
             score = self.calculate(resampled.tolist()).score
             scores.append(score)
         return np.percentile(scores, 2.5), np.percentile(scores, 97.5)

  2. Add database columns:
     ALTER TABLE sim_calculations 
     ADD COLUMN ci_lower FLOAT,
     ADD COLUMN ci_upper FLOAT;

  3. Create migration

  4. Update UI:
     - Display CI when sample_size >= 30
     - "SimRating: 78.5 [95% CI: 76.2 – 80.8]"
     - Gate low-confidence ratings

verification:
  - CI narrows as sample size increases
  - CI width <5 for tier=high (50+ matches)
  - UI displays CI appropriately
```

---

### Phase 2: Medium Priority (Week 2)

#### Task 2.1: Implement Data Partition Firewall
```yaml
task: Implement GAME_ONLY_FIELDS Firewall
owner: Agent A (Backend)
estimate: 3-4 hours
priority: P2

files_to_modify:
  - packages/shared/axiom_esports_data/api/src/middleware/firewall.py
  - tests/unit/test_firewall.py

implementation:
  1. Import data partition lib:
     from @sator/data-partition-lib import GAME_ONLY_FIELDS, sanitize_for_web

  2. Implement middleware:
     class FirewallMiddleware(BaseHTTPMiddleware):
         async def dispatch(self, request: Request, call_next):
             response = await call_next(request)
             
             # Sanitize response body
             if response.headers.get("content-type") == "application/json":
                 body = json.loads(response.body)
                 sanitized = sanitize_for_web(body, GAME_ONLY_FIELDS)
                 response.body = json.dumps(sanitized)
             
             return response

  3. Add unit tests

verification:
  - GAME_ONLY_FIELDS stripped from responses
  - Unit tests pass
  - Integration tests verify no leaks
```

#### Task 2.2: TimescaleDB Decision
```yaml
task: Decide TimescaleDB Strategy
owner: Agent B (Pipeline)
estimate: 2 hours decision + 8 hours implementation
priority: P2

decision_required: YES

options:
  A: Implement TimescaleDB
     - Add extension to docker-compose
     - Convert player_stats to hypertable
     - Add compression policies
     - Add continuous aggregates
     
  B: Remove from documentation
     - Update all docs to remove TimescaleDB references
     - Use PostgreSQL native partitioning
     - Document 500MB constraint handling

criteria:
  - Do we expect >10K telemetry rows/day?
  - Will we stay on free tier >6 months?
  - Do we need real-time analytics?

recommendation: DECISION NEEDED by Technical Lead
```

---

## VERIFICATION CHECKLIST

### Pre-Deployment
- [ ] All P0 tasks complete
- [ ] All P1 tasks complete
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Load test: 50 concurrent users
- [ ] Security scan: No secrets, no vulnerabilities

### Post-Deployment
- [ ] PgBouncer responding
- [ ] TENET routes return real data
- [ ] ML model serving predictions
- [ ] Rate limiting enforced
- [ ] SimRating CI displayed
- [ ] Documentation updated

---

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PgBouncer misconfiguration | Medium | High | Test on staging first |
| TENET integration complexity | Medium | High | Break into 4 sub-tasks |
| ML training fails | Low | Medium | Fallback to weighted avg |
| Formula change breaks ratings | Low | High | Version ratings, recalc async |

---

## SUCCESS METRICS

### Week 1 (P0 Complete)
- [ ] PgBouncer deployed and handling traffic
- [ ] Zero PandaScore API failures (with retries)
- [ ] TENET verification working for live matches
- [ ] ML model trained and deployed

### Week 2 (P1 Complete)
- [ ] All API endpoints rate limited
- [ ] SimRating formula documented
- [ ] Confidence intervals displayed
- [ ] Firewall enforcing data partition

### Month 1 (Production Ready)
- [ ] 99.9% API uptime
- [ ] <200ms average response time
- [ ] Zero security incidents
- [ ] User feedback: Positive on transparency

---

## FINAL AUTHORIZATION

This plan has been:
- ✅ Verified against scout reports
- ✅ Validated for free tier constraints
- ✅ Checked against repository policies
- ✅ Optimized for resource efficiency

**APPROVED FOR EXECUTION**

**Technical Lead Signature:** _______________  
**Date:** 2026-03-30

---

*Execute with discipline. Document everything. Report status daily.*
