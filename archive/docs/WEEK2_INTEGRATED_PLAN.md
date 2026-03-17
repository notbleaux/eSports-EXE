# Week 2 Integrated Implementation Plan [Ver001.000]
**Date**: 2026-03-16
**Status**: EXECUTING
**Commit Base**: 5d1b72f

---

## Critical Issues Integration (CRIT-001 to CRIT-008)

### Verification Status from Week 1

| CRIT | Issue | Status | Evidence |
|------|-------|--------|----------|
| CRIT-001 | Rate limiter registration | ✅ VERIFIED | `limiter.init_app(app)` in main.py |
| CRIT-002 | Firewall middleware | ✅ VERIFIED | `app.add_middleware(FirewallMiddleware)` |
| CRIT-003 | WebSocket stale closure | ✅ VERIFIED | `reconnectAttemptsRef` in useTacticalWebSocket.ts |
| CRIT-004 | Canvas error boundary | ✅ VERIFIED | `CanvasErrorBoundary.tsx` created |
| CRIT-005 | nglobal typo | ✅ VERIFIED | Fixed in TacticalView.test.tsx |
| CRIT-006 | Path fix | ✅ VERIFIED | `axiom_esports_data` in render.yaml |
| CRIT-007 | DB exception state | ✅ VERIFIED | `self._initialized = False` in db_manager.py |
| CRIT-008 | Context loss handling | ✅ VERIFIED | Event listeners in TacticalView.tsx |

**All Week 1 critical issues verified. Proceeding to Week 2 implementation.**

---

## Week 2 Execution Structure

### MAIN: Kode (Circuit Breaker Core)
### ACCESSORY: Kode (Supporting Infrastructure)
### SUPPORT: Bibi (Sub-Agent Management)

---

## Day 1: Circuit Breaker Foundation

### Morning (4 hours): Core Implementation

#### Sub-Agent CB-001: Circuit Breaker Core
**Task**: Implement state machine and configuration
```python
# Circuit breaker implementation
class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

@dataclass
class CircuitBreakerConfig:
    name: str
    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    half_open_max_calls: int = 3
    success_threshold: int = 2
```

#### Sub-Agent CB-002: Decorator Implementation
**Task**: Create `@circuit_breaker` decorator
```python
def circuit_breaker(name: str, **kwargs):
    cb = CircuitBreaker(name, **kwargs)
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await cb.call(func, *args, **kwargs)
        return wrapper
    return decorator
```

#### Sub-Agent CB-003: Redis Integration
**Task**: Redis-backed state storage for distributed circuit breakers
```python
async def _get_state(self) -> CircuitState:
    if self.redis:
        state_str = await self.redis.get(f"cb:{self.config.name}:state")
        return CircuitState(state_str.decode()) if state_str else CircuitState.CLOSED
    return self._state
```

#### Sub-Agent CB-004: Metrics & Monitoring
**Task**: Add Prometheus metrics for circuit breaker states
```python
# Metrics
CIRCUIT_STATE = Gauge('circuit_breaker_state', 'Current state', ['name'])
CIRCUIT_FAILURES = Counter('circuit_breaker_failures', 'Total failures', ['name'])
CIRCUIT_SUCCESSES = Counter('circuit_breaker_successes', 'Total successes', ['name'])
```

### Afternoon (4 hours): Integration

#### Sub-Agent CB-005: Apply to Database
**Task**: Wrap database calls with circuit breaker
```python
@circuit_breaker("database", failure_threshold=5, recovery_timeout=30.0)
async def get_player_data(player_id: str):
    return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)
```

#### Sub-Agent CB-006: Apply to External APIs
**Task**: Wrap Pandascore API calls
```python
@circuit_breaker("pandascore_api", failure_threshold=3, recovery_timeout=60.0)
async def fetch_live_match(match_id: str):
    return await pandascore_client.get_match(match_id)
```

#### Sub-Agent CB-007: Testing
**Task**: Unit tests for circuit breaker
- Test state transitions
- Test failure threshold
- Test recovery timeout
- Test half-open behavior

#### Sub-Agent ADR-001: Architecture Decision Record
**Task**: Document circuit breaker design decisions
```markdown
# ADR-001: Circuit Breaker Pattern

## Status: Accepted

## Context
Need to prevent cascading failures when external services (database, APIs) fail.

## Decision
Implement circuit breaker pattern with three states: CLOSED, OPEN, HALF_OPEN.

## Consequences
- Positive: Prevents resource exhaustion
- Positive: Fast failure instead of timeout
- Negative: Additional complexity
- Negative: Redis dependency for distributed state
```

---

## Day 2: Integration Testing

### Morning (4 hours): Test Infrastructure

#### Sub-Agent TEST-001: API Contract Tests
**Task**: Test backend <-> frontend contracts
```python
# Test API contracts
@pytest.mark.asyncio
async def test_player_api_contract():
    response = await client.get("/v1/players/123")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "sim_rating" in data
```

#### Sub-Agent TEST-002: WebSocket Integration Tests
**Task**: Test real-time communication
```typescript
describe('WebSocket Integration', () => {
  it('should connect and receive frames', async () => {
    const ws = new WebSocket('ws://localhost:8000/v1/ws');
    await waitFor(() => ws.readyState === WebSocket.OPEN);
    // Test frame reception
  });
});
```

#### Sub-Agent CSS-001: CSS Modules Conversion (Accessory)
**Task**: Convert TacticalView to CSS Modules
```css
/* TacticalView.module.css */
.canvasContainer {
  position: relative;
  width: 100%;
  max-width: 1024px;
  aspect-ratio: 1;
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
}
```

#### Sub-Agent TEST-003: Database Integration Tests
**Task**: Test database operations with circuit breaker
```python
@pytest.mark.asyncio
async def test_db_with_circuit_breaker():
    # Force circuit open
    for _ in range(5):
        try:
            await get_player_data("invalid")
        except:
            pass
    
    # Should now fail fast
    with pytest.raises(CircuitBreakerOpen):
        await get_player_data("123")
```

### Afternoon (4 hours): E2E & Load Testing

#### Sub-Agent TEST-004: E2E Critical Paths
**Task**: Playwright E2E tests
```typescript
test('critical path: view match -> analyze -> export', async ({ page }) => {
  await page.goto('/matches/123');
  await page.click('[data-testid="analyze-button"]');
  await expect(page.locator('.tactical-view')).toBeVisible();
  await page.click('[data-testid="export-button"]');
});
```

#### Sub-Agent TEST-005: Load Testing Setup
**Task**: k6 load testing configuration
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:8000/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

#### Sub-Agent TEST-006: CI/CD Pipeline Updates
**Task**: Update GitHub Actions workflow
```yaml
- name: Integration Tests
  run: |
    pytest tests/integration/ -v
    npx vitest run src/components/TacticalView/__tests__/
    
- name: Load Test
  run: |
    docker run -v $(pwd)/tests/load:/tests loadimpact/k6 run /tests/load-test.js
```

#### Sub-Agent REVIEW-001: Bibi Review (Support)
**Task**: Review Day 1-2 implementation
- Code review checklist
- Security review
- Performance review
- Documentation review

---

## Day 3: SimRating Optimization

### Morning (4 hours): Profiling & Caching

#### Sub-Agent SIM-001: Profiling
**Task**: Profile SimRating calculation
```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Run SimRating calculation
await calculate_sim_rating(player_id)

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)
```

#### Sub-Agent SIM-002: Redis Caching Layer
**Task**: Cache SimRating results
```python
async def get_sim_rating_cached(player_id: str) -> float:
    cache_key = f"sim_rating:{player_id}"
    cached = await redis.get(cache_key)
    if cached:
        return float(cached)
    
    rating = await calculate_sim_rating(player_id)
    await redis.setex(cache_key, 3600, str(rating))  # 1 hour TTL
    return rating
```

#### Sub-Agent SIM-003: SQL Query Optimization
**Task**: Optimize database queries
```sql
-- Before: N+1 queries
-- After: Single query with JOIN
SELECT p.*, AVG(m.performance) as avg_performance
FROM players p
JOIN match_performance m ON p.id = m.player_id
WHERE p.id = $1
GROUP BY p.id;
```

#### Sub-Agent PERF-001: Performance Benchmarks (Accessory)
**Task**: Establish performance baselines
```python
# Benchmark script
import timeit

results = timeit.repeat(
    'await get_sim_rating_cached("player_123")',
    setup='import asyncio; from sim_rating import get_sim_rating_cached',
    repeat=100,
    number=1
)

print(f"Average: {sum(results)/len(results)*1000:.2f}ms")
print(f"Min: {min(results)*1000:.2f}ms")
print(f"Max: {max(results)*1000:.2f}ms")
```

### Afternoon (4 hours): Batch Processing

#### Sub-Agent SIM-004: Batch Processing
**Task**: Process multiple players efficiently
```python
async def batch_update_sim_ratings(player_ids: List[str]):
    # Process in batches of 100
    batch_size = 100
    for i in range(0, len(player_ids), batch_size):
        batch = player_ids[i:i+batch_size]
        await asyncio.gather(*[
            update_sim_rating(pid) for pid in batch
        ])
```

#### Sub-Agent SIM-005: Background Job Queue
**Task**: Implement Celery/ARQ for background jobs
```python
# ARQ worker
async def update_sim_rating(ctx, player_id: str):
    rating = await calculate_sim_rating(player_id)
    await db.execute(
        "UPDATE players SET sim_rating = $1 WHERE id = $2",
        rating, player_id
    )

# Schedule job
await redis.enqueue_job('update_sim_rating', player_id)
```

#### Sub-Agent SIM-006: Progressive Calculation
**Task**: Update only changed data
```python
async def progressive_sim_rating_update(player_id: str):
    last_update = await get_last_update_time(player_id)
    new_matches = await get_matches_since(player_id, last_update)
    
    if not new_matches:
        return  # No new data, skip calculation
    
    # Incremental update
    current_rating = await get_cached_rating(player_id)
    new_rating = await incremental_update(current_rating, new_matches)
    await cache_rating(player_id, new_rating)
```

#### Sub-Agent A_B-001: A/B Testing Framework
**Task**: Compare old vs new SimRating
```python
# Feature flag
if feature_flags.is_enabled("new_sim_rating", player_id):
    rating = await calculate_sim_rating_v2(player_id)
else:
    rating = await calculate_sim_rating_v1(player_id)
```

---

## Day 4: RAR Implementation

### Morning (4 hours): Algorithm Design

#### Sub-Agent RAR-001: Algorithm Design
**Task**: Design Risk-Adjusted Rating algorithm
```python
async def calculate_rar(player_id: str) -> Dict[str, float]:
    """
    Risk-Adjusted Rating (RAR)
    
    Formula: RAR = SimRating × (1 - Volatility) × Consistency_Bonus
    """
    sim_rating = await get_sim_rating(player_id)
    volatility = await calculate_volatility(player_id)
    consistency = await calculate_consistency(player_id)
    
    rar = sim_rating * (1 - volatility) * (1 + consistency)
    
    return {
        "rar": rar,
        "sim_rating": sim_rating,
        "volatility": volatility,
        "consistency": consistency,
        "confidence": calculate_confidence(player_id)
    }
```

#### Sub-Agent RAR-002: Volatility Calculation
**Task**: Calculate performance volatility
```python
async def calculate_volatility(player_id: str) -> float:
    """
    Calculate coefficient of variation (CV) of performance scores
    """
    scores = await get_recent_performance_scores(player_id, n=20)
    if len(scores) < 5:
        return 0.5  # Default high volatility for new players
    
    mean = statistics.mean(scores)
    stdev = statistics.stdev(scores)
    cv = stdev / mean if mean > 0 else 1.0
    
    return min(cv, 1.0)  # Cap at 1.0
```

#### Sub-Agent RAR-003: API Endpoints
**Task**: Create RAR API endpoints
```python
@app.get("/v1/players/{player_id}/rar")
async def get_player_rar(player_id: str):
    rar_data = await calculate_rar(player_id)
    return {
        "player_id": player_id,
        "rar": rar_data["rar"],
        "components": {
            "sim_rating": rar_data["sim_rating"],
            "volatility": rar_data["volatility"],
            "consistency": rar_data["consistency"]
        },
        "confidence": rar_data["confidence"],
        "timestamp": datetime.utcnow().isoformat()
    }
```

#### Sub-Agent ERR-001: Error Boundaries (Accessory)
**Task**: Add error boundaries to SATOR Hub
```typescript
// SATORHubErrorBoundary.tsx
export class SATORHubErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Afternoon (4 hours): Frontend & Validation

#### Sub-Agent RAR-004: Frontend Visualization
**Task**: RAR visualization component
```typescript
export const RARDisplay: React.FC<{ playerId: string }> = ({ playerId }) => {
  const { data: rar } = useRAR(playerId);
  
  return (
    <div className="rar-display">
      <RARGauge value={rar.rar} max={100} />
      <VolatilityIndicator value={rar.components.volatility} />
      <ConfidenceBadge level={rar.confidence} />
    </div>
  );
};
```

#### Sub-Agent RAR-005: Historical Backtesting
**Task**: Validate RAR against historical data
```python
async def backtest_rar():
    """Test RAR predictions against actual outcomes"""
    results = []
    for match in await get_historical_matches(n=1000):
        predicted = await calculate_rar(match.player_id)
        actual = match.actual_performance
        
        results.append({
            "predicted": predicted["rar"],
            "actual": actual,
            "error": abs(predicted["rar"] - actual)
        })
    
    accuracy = calculate_accuracy(results)
    print(f"RAR Backtest Accuracy: {accuracy:.2%}")
```

#### Sub-Agent RAR-006: Documentation
**Task**: RAR API documentation
```markdown
## RAR (Risk-Adjusted Rating) API

### GET /v1/players/{player_id}/rar

Returns the Risk-Adjusted Rating for a player.

**Response:**
```json
{
  "player_id": "player_123",
  "rar": 85.4,
  "components": {
    "sim_rating": 92.0,
    "volatility": 0.15,
    "consistency": 0.10
  },
  "confidence": "high",
  "timestamp": "2026-03-20T10:30:00Z"
}
```
```

#### Sub-Agent REVIEW-002: Bibi Final Review (Support)
**Task**: Week 2 mid-point review
- Architecture review
- Security audit
- Performance check
- Documentation review

---

## Day 5: Predictive Models

### Morning (4 hours): ML Pipeline

#### Sub-Agent ML-001: Feature Engineering
**Task**: Create feature pipeline
```python
async def extract_features(match_id: str) -> Dict[str, float]:
    """Extract features for ML model"""
    match = await get_match(match_id)
    
    return {
        "team_a_rating": await get_team_rating(match.team_a),
        "team_b_rating": await get_team_rating(match.team_b),
        "map_advantage": get_map_advantage(match.map, match.team_a),
        "recent_form_a": await get_recent_form(match.team_a, n=5),
        "recent_form_b": await get_recent_form(match.team_b, n=5),
        "head_to_head": await get_head_to_head(match.team_a, match.team_b),
    }
```

#### Sub-Agent ML-002: Model Training
**Task**: Train win probability model
```python
from sklearn.ensemble import RandomForestClassifier

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.2%}")

# Save model
joblib.dump(model, 'models/win_probability_v1.pkl')
```

#### Sub-Agent ML-003: Model Serving
**Task**: FastAPI endpoint for predictions
```python
@app.post("/v1/predictions/match-winner")
async def predict_match_winner(match_data: MatchPredictionRequest):
    features = await extract_features(match_data.match_id)
    prediction = model.predict_proba([features])[0]
    
    return {
        "match_id": match_data.match_id,
        "predictions": {
            "team_a_win": prediction[0],
            "team_b_win": prediction[1]
        },
        "confidence": max(prediction),
        "model_version": "v1.0.0"
    }
```

#### Sub-Agent ML-004: Model Versioning
**Task**: Version control for models
```python
# Model registry
class ModelRegistry:
    def __init__(self):
        self.redis = redis_client
    
    async def register_model(self, name: str, version: str, path: str):
        await self.redis.hset(f"model:{name}", mapping={
            "version": version,
            "path": path,
            "registered_at": datetime.utcnow().isoformat()
        })
    
    async def get_model(self, name: str, version: str = "latest"):
        # Get model metadata
        # Load model from path
        pass
```

### Afternoon (4 hours): Monitoring & Polish

#### Sub-Agent ML-005: Model Monitoring
**Task**: Monitor model performance
```python
async def log_prediction(match_id: str, prediction: dict, actual: str):
    """Log prediction for monitoring"""
    await db.execute("""
        INSERT INTO prediction_logs 
        (match_id, predicted_winner, confidence, actual_winner, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
    """, match_id, prediction["winner"], prediction["confidence"], actual)

# Alert if accuracy drops
async def check_model_drift():
    recent_accuracy = await calculate_recent_accuracy(hours=24)
    if recent_accuracy < 0.65:
        await send_alert(f"Model accuracy dropped to {recent_accuracy:.1%}")
```

#### Sub-Agent ML-006: A/B Testing
**Task**: A/B test different models
```python
# Route traffic to different models
async def get_prediction(match_id: str):
    if random.random() < 0.5:
        return await model_v1.predict(match_id)
    else:
        return await model_v2.predict(match_id)

# Compare performance
async def analyze_ab_test():
    results_v1 = await get_results_for_model("v1")
    results_v2 = await get_results_for_model("v2")
    
    if results_v2.accuracy > results_v1.accuracy + 0.05:
        await promote_model("v2")
```

#### Sub-Agent POLISH-001: Integration Polish (Accessory)
**Task**: Final integration touches
- Error message improvements
- Loading states
- Empty states
- Edge case handling
- Responsive design fixes

#### Sub-Agent REVIEW-003: Bibi Final Sign-off (Support)
**Task**: Week 2 final review
- Complete code review
- Security audit
- Performance validation
- Documentation completeness
- Deployment readiness

---

## Sub-Agent Allocation Summary

### Total: 28 Sub-Agents

| Day | Main | Accessory | Support | Total |
|-----|------|-----------|---------|-------|
| 1 | 4 (CB-001 to CB-004) | 0 | 0 | 4 |
| 1 (PM) | 2 (CB-005 to CB-006) | 0 | 1 (CB-007 testing) | 3 |
| 2 | 4 (TEST-001 to TEST-004) | 1 (CSS-001) | 0 | 5 |
| 2 (PM) | 3 (TEST-005 to TEST-006) | 0 | 1 (REVIEW-001) | 4 |
| 3 | 4 (SIM-001 to SIM-004) | 1 (PERF-001) | 0 | 5 |
| 3 (PM) | 3 (SIM-005 to SIM-006) | 1 (A_B-001) | 0 | 4 |
| 4 | 3 (RAR-001 to RAR-003) | 1 (ERR-001) | 0 | 4 |
| 4 (PM) | 3 (RAR-004 to RAR-006) | 0 | 1 (REVIEW-002) | 4 |
| 5 | 4 (ML-001 to ML-004) | 0 | 0 | 4 |
| 5 (PM) | 2 (ML-005 to ML-006) | 1 (POLISH-001) | 1 (REVIEW-003) | 4 |

---

## Success Criteria

### Day 1
- [ ] Circuit breaker state machine working
- [ ] Decorator functional
- [ ] Redis integration complete
- [ ] 3 circuit breakers active

### Day 2
- [ ] API contract tests passing
- [ ] WebSocket integration tests passing
- [ ] E2E tests for critical paths
- [ ] CI/CD pipeline updated

### Day 3
- [ ] SimRating <100ms average
- [ ] Redis caching active
- [ ] Batch processing working
- [ ] Performance benchmarks recorded

### Day 4
- [ ] RAR algorithm implemented
- [ ] API endpoint live
- [ ] Frontend visualization
- [ ] Backtest accuracy >70%

### Day 5
- [ ] ML model trained
- [ ] Prediction endpoint <200ms
- [ ] Model monitoring active
- [ ] A/B test framework ready

---

## Integration Checkpoints

| Checkpoint | Time | Verification |
|------------|------|--------------|
| Day 1 AM | 12:00 | Circuit breaker core working |
| Day 1 PM | 17:00 | All services protected |
| Day 2 PM | 17:00 | Integration tests passing |
| Day 3 PM | 17:00 | Performance targets met |
| Day 4 PM | 17:00 | RAR API live |
| Day 5 PM | 17:00 | ML predictions available |

---

**Ready to execute Day 1. Deploying Sub-Agents CB-001 to CB-004.**
