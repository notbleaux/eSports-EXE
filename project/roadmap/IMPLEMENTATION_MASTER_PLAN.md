[Ver001.000]

# 📋 IMPLEMENTATION MASTER PLAN
## All 10 Actionable Items — Detailed Technical Specifications

**Date:** March 7, 2026  
**Scope:** Wave 1 (Critical) + Wave 2 (Quality) + Wave 3 (Scale)  
**Estimated Effort:** 180-200 hours  
**Target Grade:** A (Production-Grade)

---

# WAVE 1: CRITICAL FIXES (P0)
## Week 1 — Foundation

---

## ITEM 1: GitHub Actions CI/CD Pipeline

### Objective
Implement automated testing and deployment pipeline to prevent regression bugs.

### Technical Specification

#### File Structure
```
infrastructure/.github/workflows/
├── ci.yml              # Main CI pipeline
├── test-python.yml     # Python test job
├── test-typescript.yml # TypeScript test job
└── test-godot.yml      # Godot test job
```

#### ci.yml Configuration
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  python-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r packages/shared/requirements.txt
      - run: pip install pytest pytest-asyncio pytest-cov
      - run: pytest packages/shared/ --cov=packages/shared/ --cov-report=xml
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  typescript-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test -- --coverage
      - run: npm run build

  godot-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: chickensoft-games/setup-godot@v1
        with:
          version: 4.2.1
      - run: |
          cd platform/simulation-game
          godot --headless --script tests/run_tests.gd
```

### Implementation Steps
1. Create `.github/workflows/` directory structure
2. Write `ci.yml` with matrix strategy
3. Add Python test requirements
4. Configure pytest with asyncio support
5. Set up Jest for TypeScript
6. Install GUT (Godot Unit Testing) framework
7. Create initial test stubs
8. Verify pipeline runs on push

### Success Criteria
- [ ] CI runs on every push/PR
- [ ] Python tests execute with coverage
- [ ] TypeScript tests execute with coverage
- [ ] Godot tests execute
- [ ] Failed tests block merge

### Estimated Time: 8 hours

---

## ITEM 2: Pre-commit Hooks

### Objective
Enforce code quality before commits reach repository.

### Technical Specification

#### File Structure
```
.pre-commit-config.yaml      # Hook configuration
pyproject.toml               # Python tool configs
.eslintrc.json               # TypeScript linting
.prettierrc                  # Code formatting
```

#### .pre-commit-config.yaml
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1000']

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11
        files: ^packages/

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
        files: ^packages/

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.1
    hooks:
      - id: mypy
        additional_dependencies: [types-requests]
        files: ^packages/

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(ts|tsx)$
        additional_dependencies:
          - eslint@8.56.0
          - eslint-config-prettier@9.1.0

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json, yaml, markdown]

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### Implementation Steps
1. Install pre-commit: `pip install pre-commit`
2. Create `.pre-commit-config.yaml`
3. Create `.secrets.baseline` with detect-secrets
4. Configure pyproject.toml for black/ruff
5. Configure .eslintrc.json for TypeScript
6. Configure .prettierrc for formatting
7. Run `pre-commit install` to set up git hooks
8. Run `pre-commit run --all-files` to test

### Success Criteria
- [ ] Pre-commit hooks installed locally
- [ ] Black formats Python code
- [ ] Ruff lints Python code
- [ ] ESLint checks TypeScript
- [ ] Prettier formats code
- [ ] detect-secrets prevents key commits
- [ ] CI enforces hooks pass

### Estimated Time: 4 hours

---

## ITEM 3: Database Connection Pooling

### Objective
Prevent Supabase 30-connection limit exhaustion.

### Technical Specification

#### File Structure
```
packages/shared/api/
├── database.py           # Connection pool management
├── lifespan.py           # FastAPI lifespan events
└── dependencies.py       # Dependency injection
```

#### database.py Implementation
```python
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator

class DatabasePool:
    def __init__(self, dsn: str):
        self.dsn = dsn
        self._pool: asyncpg.Pool | None = None

    async def connect(self):
        self._pool = await asyncpg.create_pool(
            self.dsn,
            min_size=5,
            max_size=20,
            command_timeout=60,
            server_settings={
                'jit': 'off',
                'application_name': 'sator_api'
            }
        )

    async def disconnect(self):
        if self._pool:
            await self._pool.close()

    @asynccontextmanager
    async def acquire(self) -> AsyncGenerator[asyncpg.Connection, None]:
        if not self._pool:
            raise RuntimeError("Database pool not initialized")
        async with self._pool.acquire() as conn:
            yield conn

    async def fetch(self, query: str, *args):
        async with self.acquire() as conn:
            return await conn.fetch(query, *args)

    async def fetchrow(self, query: str, *args):
        async with self.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def execute(self, query: str, *args):
        async with self.acquire() as conn:
            return await conn.execute(query, *args)

# Global pool instance
_pool: DatabasePool | None = None

def init_pool(dsn: str):
    global _pool
    _pool = DatabasePool(dsn)

def get_pool() -> DatabasePool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized")
    return _pool
```

#### lifespan.py Implementation
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import init_pool, get_pool
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise ValueError("DATABASE_URL not set")
    
    init_pool(dsn)
    await get_pool().connect()
    print(f"✓ Database pool connected (min: 5, max: 20)")
    
    yield
    
    # Shutdown
    await get_pool().disconnect()
    print("✓ Database pool disconnected")
```

#### FastAPI Integration
```python
from fastapi import FastAPI
from .lifespan import lifespan

app = FastAPI(lifespan=lifespan)

# Use in endpoints
from .database import get_pool

@app.get("/players")
async def get_players():
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM players LIMIT 100")
    return [dict(row) for row in rows]
```

### Implementation Steps
1. Create `packages/shared/api/database.py`
2. Create `packages/shared/api/lifespan.py`
3. Update FastAPI app to use lifespan
4. Refactor all endpoints to use connection pool
5. Add connection pool metrics endpoint
6. Test with load (simulate 50 concurrent requests)
7. Verify connection limit not exceeded

### Success Criteria
- [ ] Connection pool initializes on startup
- [ ] Min 5, max 20 connections configured
- [ ] All endpoints use pooled connections
- [ ] No connection leaks under load
- [ ] Graceful shutdown closes connections
- [ ] Metrics endpoint shows pool status

### Estimated Time: 6 hours

---

# WAVE 2: QUALITY & SECURITY (P1)
## Weeks 2-4 — Hardening

---

## ITEM 4: API Response Caching with Redis

### Objective
Reduce database load by ~60% using intelligent caching.

### Technical Specification

#### File Structure
```
packages/shared/api/
├── cache.py              # Redis cache wrapper
└── decorators.py         # Cache decorators
infrastructure/docker-compose.yml  # Redis service
```

#### cache.py Implementation
```python
import json
import redis
from typing import Any, Optional
from functools import wraps
import hashlib

class CacheManager:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)
    
    def get(self, key: str) -> Optional[Any]:
        data = self.redis.get(key)
        return json.loads(data) if data else None
    
    def set(self, key: str, value: Any, ttl: int = 3600):
        self.redis.setex(key, ttl, json.dumps(value))
    
    def delete(self, key: str):
        self.redis.delete(key)
    
    def invalidate_pattern(self, pattern: str):
        for key in self.redis.scan_iter(match=pattern):
            self.redis.delete(key)

# Global instance
_cache: CacheManager | None = None

def init_cache(redis_url: str):
    global _cache
    _cache = CacheManager(redis_url)

def get_cache() -> CacheManager:
    if _cache is None:
        raise RuntimeError("Cache not initialized")
    return _cache

def cached(ttl: int = 3600, key_prefix: str = ""):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = get_cache()
            
            # Generate cache key
            key_data = f"{func.__name__}:{args}:{kwargs}"
            cache_key = f"{key_prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"
            
            # Try cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute and cache
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator
```

#### Usage in Endpoints
```python
from .cache import cached, get_cache

@app.get("/analytics/player/{player_id}")
@cached(ttl=3600, key_prefix="player_stats")  # 1 hour cache
async def get_player_stats(player_id: str):
    # Expensive calculation
    stats = await calculate_simrating(player_id)
    return stats

@app.get("/leaderboard")
@cached(ttl=900, key_prefix="leaderboard")  # 15 minute cache
async def get_leaderboard():
    leaderboard = await fetch_leaderboard()
    return leaderboard

# Invalidate cache on data update
@app.post("/matches")
async def create_match(match: Match):
    result = await save_match(match)
    # Invalidate affected caches
    get_cache().invalidate_pattern("leaderboard:*")
    return result
```

#### Docker Compose Addition
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  redis_data:
```

### Implementation Steps
1. Add Redis service to docker-compose.yml
2. Create cache.py with CacheManager class
3. Create @cached decorator
4. Identify expensive endpoints for caching
5. Apply @cached decorator strategically
6. Add cache invalidation on data mutations
7. Add cache metrics/monitoring
8. Test cache hit rates under load

### Success Criteria
- [ ] Redis service running
- [ ] Cache manager initialized
- [ ] @cached decorator functional
- [ ] SimRating calculations cached (1hr)
- [ ] Leaderboard cached (15min)
- [ ] Cache invalidation works
- [ ] 60%+ cache hit rate achieved
- [ ] Response times reduced

### Estimated Time: 8 hours

---

## ITEM 5: Circuit Breaker for Web Scrapers

### Objective
Prevent cascade failures when data sources change.

### Technical Specification

#### File Structure
```
packages/shared/api/
├── circuit_breaker.py    # Circuit breaker implementation
└── scrapers/
    ├── base.py           # Base scraper with CB
    ├── vlrgg.py          # VLR.gg scraper
    └── hltv.py           # HLTV scraper
```

#### circuit_breaker.py Implementation
```python
import time
from enum import Enum
from typing import Callable, Optional
from functools import wraps

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing fast
    HALF_OPEN = "half_open"  # Testing recovery

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 3,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 1
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_calls = 0
    
    def can_execute(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                self.half_open_calls = 0
                return True
            return False
        
        if self.state == CircuitState.HALF_OPEN:
            if self.half_open_calls < self.half_open_max_calls:
                self.half_open_calls += 1
                return True
            return False
        
        return False
    
    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.half_open_calls = 0
        else:
            self.failure_count = 0
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

def circuit_breaker(
    failure_threshold: int = 3,
    recovery_timeout: int = 60,
    fallback: Optional[Callable] = None
):
    breaker = CircuitBreaker(failure_threshold, recovery_timeout)
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not breaker.can_execute():
                if fallback:
                    return await fallback(*args, **kwargs)
                raise CircuitBreakerOpen("Service temporarily unavailable")
            
            try:
                result = await func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure()
                raise e
        
        return wrapper
    return decorator

class CircuitBreakerOpen(Exception):
    pass

# Fallback functions
async def fallback_vlr_data(match_id: str):
    """Return cached data when VLR.gg is down"""
    from .cache import get_cache
    cache = get_cache()
    return cache.get(f"vlr_fallback:{match_id}")
```

#### Scraper Implementation
```python
from .circuit_breaker import circuit_breaker, fallback_vlr_data
import aiohttp
import asyncio

class VLRScraper:
    def __init__(self):
        self.base_url = "https://www.vlr.gg"
    
    @circuit_breaker(
        failure_threshold=3,
        recovery_timeout=300,  # 5 minutes
        fallback=fallback_vlr_data
    )
    async def fetch_match(self, match_id: str):
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/match/{match_id}",
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                return await response.text()
    
    async def fetch_with_retry(self, match_id: str, max_retries: int = 3):
        for attempt in range(max_retries):
            try:
                return await self.fetch_match(match_id)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                wait_time = 2 ** attempt  # Exponential backoff
                await asyncio.sleep(wait_time)
```

### Implementation Steps
1. Create circuit_breaker.py with state machine
2. Create base scraper class
3. Implement VLR.gg scraper with CB
4. Implement HLTV scraper with CB
5. Add fallback to cached data
6. Add circuit breaker metrics
7. Test with simulated failures
8. Verify exponential backoff works

### Success Criteria
- [ ] Circuit breaker tracks failures
- [ ] Opens after 3 failures
- [ ] Stays open for 5 minutes
- [ ] Half-open tests recovery
- [ ] Falls back to cached data
- [ ] Exponential backoff implemented
- [ ] Metrics show CB status

### Estimated Time: 8 hours

---

## ITEM 6: Static Application Security Testing (SAST)

### Objective
Identify security vulnerabilities with CodeQL.

### Technical Specification

#### File Structure
```
.infrastructure/.github/workflows/
└── security.yml          # Security scanning
.github/codeql/
├── codeql-config.yml     # CodeQL configuration
```

#### security.yml Workflow
```yaml
name: Security Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly scan

jobs:
  codeql-python:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: python
          config-file: ./.github/codeql/codeql-config.yml
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:python"

  codeql-javascript:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript
          config-file: ./.github/codeql/codeql-config.yml
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:javascript"

  secret-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Secret Detection
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          extra_args: --debug --only-verified
```

#### codeql-config.yml
```yaml
name: "SATOR CodeQL Config"

queries:
  - uses: security-extended
  - uses: security-and-quality

paths:
  - packages
  - apps
  - services
paths-ignore:
  - '**/node_modules/**'
  - '**/.git/**'
  - '**/tests/**'
  - '**/dist/**'
```

### Implementation Steps
1. Enable GitHub Advanced Security (free for public repos)
2. Create security.yml workflow
3. Create codeql-config.yml
4. Add Python CodeQL analysis
5. Add JavaScript CodeQL analysis
6. Add secret scanning with TruffleHog
7. Configure alerts
8. Test with sample vulnerability

### Success Criteria
- [ ] CodeQL enabled for Python
- [ ] CodeQL enabled for JavaScript
- [ ] Secret scanning active
- [ ] Alerts appear in Security tab
- [ ] PRs blocked on critical vulnerabilities
- [ ] Weekly scans scheduled

### Estimated Time: 4 hours

---

## ITEM 7: Load Testing with Locust

### Objective
Validate Supabase connection limits before production.

### Technical Specification

#### File Structure
```
tests/load/
├── locustfile.py         # Load test scenarios
├── requirements.txt      # Locust dependencies
└── README.md             # Testing guide
```

#### locustfile.py Implementation
```python
from locust import HttpUser, task, between
import random

class SatorUser(HttpUser):
    wait_time = between(1, 5)  # 1-5 seconds between requests
    
    def on_start(self):
        """Called when user starts"""
        self.player_ids = ["player1", "player2", "player3"]  # Test data
    
    @task(3)
    def get_player_stats(self):
        """Most common: viewing player stats"""
        player_id = random.choice(self.player_ids)
        with self.client.get(
            f"/analytics/player/{player_id}",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 503:
                response.failure("Service Unavailable")
            else:
                response.failure(f"Unexpected status: {response.status_code}")
    
    @task(2)
    def get_leaderboard(self):
        """Common: viewing leaderboard"""
        self.client.get("/leaderboard")
    
    @task(1)
    def get_match_details(self):
        """Less common: match details"""
        match_id = random.randint(1, 1000)
        self.client.get(f"/matches/{match_id}")

class WebSocketUser(HttpUser):
    """Simulate WebSocket connections"""
    wait_time = between(5, 15)
    
    @task
    def connect_websocket(self):
        """Test WebSocket endpoint"""
        # WebSocket testing with locust-plugins
        pass

# Configuration
# Target: <200ms p95 response time, 0% error rate
```

#### Running Tests
```bash
# Install locust
pip install locust

# Run with 100 concurrent users
locust -f tests/load/locustfile.py \
    --host=https://api.sator.example.com \
    --users=100 \
    --spawn-rate=10 \
    --run-time=5m

# Headless mode (for CI)
locust -f tests/load/locustfile.py \
    --host=https://api.sator.example.com \
    --users=100 \
    --spawn-rate=10 \
    --run-time=5m \
    --headless \
    --csv=sator_load_test
```

### Implementation Steps
1. Install Locust: `pip install locust`
2. Create locustfile.py with user scenarios
3. Define realistic user behaviors
4. Set performance targets (p95 <200ms)
5. Run tests locally first
6. Add load test to CI pipeline
7. Document testing procedures
8. Set up monitoring alerts

### Success Criteria
- [ ] Locust installed and configured
- [ ] 3 user scenarios implemented
- [ ] 100 concurrent users simulated
- [ ] p95 response time <200ms achieved
- [ ] 0% error rate maintained
- [ ] WebSocket connections tested
- [ ] Load tests run in CI

### Estimated Time: 6 hours

---

# WAVE 3: SCALE (P2)
## Months 2-3 — Growth

---

## ITEM 8: Feature Flag System

### Objective
Deploy incomplete features safely, enable A/B testing.

### Technical Specification

#### File Structure
```
packages/shared/
├── features/
│   ├── __init__.py       # Feature flag exports
│   ├── config.py         # Feature configuration
│   └── manager.py        # Feature manager
└── config/
    └── features.json     # Feature definitions
```

#### features.json Configuration
```json
{
  "features": {
    "cs2_simulation": {
      "enabled": false,
      "description": "CS2 game simulation support",
      "rollout_percentage": 0,
      "allowed_users": []
    },
    "new_rating_algorithm": {
      "enabled": true,
      "description": "Updated SimRating calculation",
      "rollout_percentage": 10,
      "allowed_users": ["test_user_1"]
    },
    "beta_dashboard": {
      "enabled": true,
      "description": "New dashboard UI",
      "rollout_percentage": 5,
      "allowed_users": []
    }
  }
}
```

#### manager.py Implementation
```python
import json
import hashlib
from typing import Dict, Any, List
from pathlib import Path

class FeatureManager:
    def __init__(self, config_path: str = "config/features.json"):
        self.config_path = Path(config_path)
        self._config: Dict[str, Any] = {}
        self._load_config()
    
    def _load_config(self):
        if self.config_path.exists():
            with open(self.config_path) as f:
                self._config = json.load(f).get("features", {})
    
    def is_enabled(self, feature_name: str, user_id: str = None) -> bool:
        feature = self._config.get(feature_name)
        if not feature:
            return False
        
        # Check if fully enabled
        if feature.get("enabled") and feature.get("rollout_percentage", 0) == 100:
            return True
        
        # Check if enabled but limited rollout
        if not feature.get("enabled"):
            return False
        
        # Check specific user access
        allowed_users = feature.get("allowed_users", [])
        if user_id and user_id in allowed_users:
            return True
        
        # Percentage-based rollout
        if user_id:
            user_hash = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
            rollout = feature.get("rollout_percentage", 0)
            return (user_hash % 100) < rollout
        
        return False
    
    def get_all_features(self) -> Dict[str, Any]:
        return self._config
    
    def reload(self):
        self._load_config()

# Global instance
_feature_manager: FeatureManager | None = None

def init_features(config_path: str = "config/features.json"):
    global _feature_manager
    _feature_manager = FeatureManager(config_path)

def get_features() -> FeatureManager:
    if _feature_manager is None:
        init_features()
    return _feature_manager

# Decorator for feature-gated endpoints
def feature_required(feature_name: str):
    from functools import wraps
    from fastapi import HTTPException
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user_id: str = None, **kwargs):
            if not get_features().is_enabled(feature_name, user_id):
                raise HTTPException(status_code=404, detail="Feature not available")
            return await func(*args, user_id=user_id, **kwargs)
        return wrapper
    return decorator
```

#### Usage in Code
```python
from packages.shared.features import get_features, feature_required

# Check feature in endpoint
@app.get("/cs2/matches")
async def get_cs2_matches(user_id: str):
    if not get_features().is_enabled("cs2_simulation", user_id):
        raise HTTPException(status_code=404, detail="CS2 support coming soon")
    
    return await fetch_cs2_matches()

# Or use decorator
@app.get("/beta/dashboard")
@feature_required("beta_dashboard")
async def beta_dashboard(user_id: str):
    return await render_new_dashboard()

# A/B testing
@app.get("/analytics/player/{player_id}")
async def get_player_analytics(player_id: str, user_id: str):
    if get_features().is_enabled("new_rating_algorithm", user_id):
        return await calculate_new_rating(player_id)
    else:
        return await calculate_old_rating(player_id)
```

### Implementation Steps
1. Create feature flag configuration system
2. Implement FeatureManager class
3. Create features.json with initial flags
4. Add @feature_required decorator
5. Implement percentage-based rollout
6. Add user-specific overrides
7. Create admin endpoint to toggle features
8. Add feature flag metrics

### Success Criteria
- [ ] Feature flags configurable via JSON
- [ ] Percentage rollout working
- [ ] User-specific overrides possible
- [ ] @feature_required decorator functional
- [ ] A/B testing support implemented
- [ ] Hot-reload of feature config
- [ ] Metrics track flag usage

### Estimated Time: 8 hours

---

## ITEM 9: Automated Documentation Generation

### Objective
Auto-generate API docs from OpenAPI spec and Godot code.

### Technical Specification

#### File Structure
```
docs/
├── mkdocs.yml            # MkDocs configuration
├── api/                  # Auto-generated API docs
├── godot/                # Auto-generated Godot docs
└── overrides/            # Theme customizations
.github/workflows/
└── docs.yml              # Docs deployment
```

#### mkdocs.yml Configuration
```yaml
site_name: SATOR Documentation
site_url: https://notbleaux.github.io/eSports-EXE
repo_url: https://github.com/notbleaux/eSports-EXE
repo_name: notbleaux/eSports-EXE

theme:
  name: material
  palette:
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to light mode
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to dark mode
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - search.suggest
    - search.highlight
    - content.tabs.link
    - content.code.annotation

plugins:
  - search
  - awesome-pages
  - minify:
      minify_html: true

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.superfences
  - admonition
  - pymdownx.details
  - pymdownx.tabbed:
      alternate_style: true
  - tables
  - attr_list
  - md_in_html

nav:
  - Home: index.md
  - Architecture:
    - Overview: architecture/overview.md
    - API: architecture/api.md
    - Database: architecture/database.md
  - API Reference:
    - Players: api/players.md
    - Matches: api/matches.md
    - Analytics: api/analytics.md
  - Godot Reference:
    - Core: godot/core.md
    - Agents: godot/agents.md
  - Guides:
    - Contributing: guides/contributing.md
    - Deployment: guides/deployment.md
```

#### Documentation Generation Scripts
```python
# scripts/generate_api_docs.py
"""Generate API docs from FastAPI OpenAPI spec"""
import json
import requests
from pathlib import Path

def generate_api_docs():
    # Start local server and fetch OpenAPI spec
    import subprocess
    import time
    
    # Start server in background
    proc = subprocess.Popen(
        ["python", "-m", "packages.shared.api.main"],
        env={"GENERATE_OPENAPI": "1"}
    )
    time.sleep(3)  # Wait for startup
    
    try:
        # Fetch OpenAPI spec
        response = requests.get("http://localhost:8000/openapi.json")
        spec = response.json()
        
        # Generate markdown
        output_dir = Path("docs/api")
        output_dir.mkdir(exist_ok=True)
        
        for path, methods in spec["paths"].items():
            for method, details in methods.items():
                if method == "parameters":
                    continue
                
                doc_content = f"""# {details['summary']}

**Path:** `{method.upper()} {path}`

{details.get('description', '')}

## Parameters

"""
                # Add parameters table
                if "parameters" in details:
                    doc_content += "| Name | Type | Required | Description |\n"
                    doc_content += "|------|------|----------|-------------|\n"
                    for param in details["parameters"]:
                        doc_content += f"| {param['name']} | {param['schema']['type']} | {param.get('required', False)} | {param.get('description', '')} |\n"
                
                # Add request/response examples
                if "requestBody" in details:
                    doc_content += "\n## Request Body\n\n"
                    doc_content += "```json\n"
                    doc_content += json.dumps(
                        details["requestBody"]["content"]["application/json"]["schema"],
                        indent=2
                    )
                    doc_content += "\n```\n"
                
                # Write file
                safe_name = path.replace("/", "_").replace("{", "").replace("}", "")
                output_file = output_dir / f"{method}_{safe_name}.md"
                output_file.write_text(doc_content)
    
    finally:
        proc.terminate()

if __name__ == "__main__":
    generate_api_docs()
```

#### GitHub Actions Workflow
```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'packages/**/*.py'
      - 'platform/**/*.gd'

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install mkdocs-material
          pip install mkdocs-awesome-pages-plugin
          pip install mkdocs-minify-plugin
      
      - name: Generate API docs
        run: |
          pip install -r packages/shared/requirements.txt
          python scripts/generate_api_docs.py
      
      - name: Build documentation
        run: mkdocs build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./site
```

### Implementation Steps
1. Install MkDocs: `pip install mkdocs-material`
2. Create mkdocs.yml configuration
3. Write generate_api_docs.py script
4. Create initial documentation structure
5. Set up GitHub Actions workflow
6. Generate initial API docs
7. Deploy to GitHub Pages
8. Add to CI pipeline

### Success Criteria
- [ ] MkDocs site builds locally
- [ ] API docs auto-generated from OpenAPI
- [ ] Godot docs extracted from GDScript
- [ ] Material theme configured
- [ ] GitHub Pages deployment working
- [ ] Docs update on every push
- [ ] Search functionality enabled

### Estimated Time: 8 hours

---

## ITEM 10: Database Read Replicas

### Objective
Scale past 30-connection limit with read/write separation.

### Technical Specification

#### File Structure
```
packages/shared/api/
├── database.py           # Enhanced with read replicas
├── connection_router.py  # Route queries to right DB
└── models.py             # SQLAlchemy models with routing hints
```

#### Enhanced database.py
```python
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from enum import Enum

class QueryType(Enum):
    READ = "read"
    WRITE = "write"

class DatabaseRouter:
    """Routes queries between primary (write) and replicas (read)"""
    
    def __init__(
        self,
        primary_dsn: str,
        replica_dsns: list[str],
        max_connections: int = 20
    ):
        self.primary_dsn = primary_dsn
        self.replica_dsns = replica_dsns
        
        # Connection pools
        self._primary_pool: Optional[asyncpg.Pool] = None
        self._replica_pools: list[asyncpg.Pool] = []
        self._replica_index = 0  # Round-robin counter
        self._max_connections = max_connections
    
    async def connect(self):
        """Initialize all connection pools"""
        # Primary pool (for writes)
        self._primary_pool = await asyncpg.create_pool(
            self.primary_dsn,
            min_size=3,
            max_size=10,
            command_timeout=60,
            server_settings={'application_name': 'sator_primary'}
        )
        
        # Replica pools (for reads)
        for i, dsn in enumerate(self.replica_dsns):
            pool = await asyncpg.create_pool(
                dsn,
                min_size=2,
                max_size=self._max_connections // len(self.replica_dsns),
                command_timeout=60,
                server_settings={'application_name': f'sator_replica_{i}'}
            )
            self._replica_pools.append(pool)
        
        print(f"✓ Primary pool: 3-10 connections")
        print(f"✓ {len(self._replica_pools)} replica pools configured")
    
    async def disconnect(self):
        """Close all pools"""
        if self._primary_pool:
            await self._primary_pool.close()
        for pool in self._replica_pools:
            await pool.close()
    
    def _get_replica_pool(self) -> asyncpg.Pool:
        """Round-robin replica selection"""
        if not self._replica_pools:
            return self._primary_pool
        
        pool = self._replica_pools[self._replica_index]
        self._replica_index = (self._replica_index + 1) % len(self._replica_pools)
        return pool
    
    @asynccontextmanager
    async def acquire(
        self,
        query_type: QueryType = QueryType.READ
    ) -> AsyncGenerator[asyncpg.Connection, None]:
        """Acquire connection based on query type"""
        
        if query_type == QueryType.WRITE or not self._replica_pools:
            pool = self._primary_pool
        else:
            pool = self._get_replica_pool()
        
        async with pool.acquire() as conn:
            yield conn
    
    # Convenience methods
    async def fetch(self, query: str, *args):
        """READ operation - goes to replica"""
        async with self.acquire(QueryType.READ) as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """READ operation - goes to replica"""
        async with self.acquire(QueryType.READ) as conn:
            return await conn.fetchrow(query, *args)
    
    async def execute(self, query: str, *args):
        """WRITE operation - goes to primary"""
        async with self.acquire(QueryType.WRITE) as conn:
            return await conn.execute(query, *args)
    
    async def transaction(self):
        """Transaction - must use primary"""
        return self._primary_pool.acquire()

# Global router instance
_router: Optional[DatabaseRouter] = None

def init_router(primary_dsn: str, replica_dsns: list[str] = None):
    global _router
    replica_dsns = replica_dsns or []
    _router = DatabaseRouter(primary_dsn, replica_dsns)

def get_router() -> DatabaseRouter:
    if _router is None:
        raise RuntimeError("Database router not initialized")
    return _router
```

#### Usage in Endpoints
```python
from packages.shared.api.database import get_router, QueryType

@app.get("/analytics/dashboard")
async def get_dashboard():
    """Analytics dashboard - READ from replica"""
    router = get_router()
    
    # Automatically routed to replica
    stats = await router.fetch("""
        SELECT * FROM player_stats 
        ORDER BY sim_rating DESC 
        LIMIT 100
    """)
    
    return {"stats": [dict(row) for row in stats]}

@app.post("/matches")
async def create_match(match: MatchCreate):
    """Create match - WRITE to primary"""
    router = get_router()
    
    # Automatically routed to primary
    result = await router.execute("""
        INSERT INTO matches (team_a, team_b, map, date)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    """, match.team_a, match.team_b, match.map, match.date)
    
    return {"id": result}

# Explicit routing for complex queries
@app.get("/admin/stats")
async def get_admin_stats():
    """Admin stats - explicit primary for consistency"""
    router = get_router()
    
    async with router.acquire(QueryType.WRITE) as conn:
        # Force primary for real-time consistency
        stats = await conn.fetch("""
            SELECT COUNT(*) as total_matches,
                   SUM(credits_earned) as total_credits
            FROM matches
        """)
    
    return {"stats": dict(stats[0])}
```

#### Supabase Configuration
```python
# Supabase provides connection pooling via PgBouncer
# Primary: Direct connection for writes
# Replica: Connection pooler for reads

import os

# Environment variables
PRIMARY_URL = os.getenv("SUPABASE_DB_URL")  # Direct PostgreSQL
REPLICA_URL = os.getenv("SUPABASE_POOLER_URL")  # PgBouncer (transaction mode)

# Initialize
init_router(
    primary_dsn=PRIMARY_URL,
    replica_dsns=[REPLICA_URL] if REPLICA_URL else []
)
```

### Implementation Steps
1. Create DatabaseRouter with read/write separation
2. Configure Supabase connection pooler
3. Update all endpoints to use router
4. Add query type hints for complex queries
5. Implement round-robin replica selection
6. Add connection pool metrics
7. Test with high read load
8. Verify write consistency

### Success Criteria
- [ ] Read queries routed to replicas
- [ ] Write queries routed to primary
- [ ] Round-robin load balancing
- [ ] Transaction safety maintained
- [ ] Connection limit not exceeded
- [ ] Metrics show query distribution
- [ ] Failover to primary if replica down

### Estimated Time: 10 hours

---

# 📊 IMPLEMENTATION SUMMARY

## Time Estimates

| Wave | Items | Hours | Timeline |
|------|-------|-------|----------|
| **Wave 1** | 1-3 | 18h | Week 1 |
| **Wave 2** | 4-7 | 26h | Weeks 2-4 |
| **Wave 3** | 8-10 | 26h | Months 2-3 |
| **TOTAL** | 10 | **70h** | 3 months |

*(Note: Original estimate 180-200h included research, testing, documentation)*

## Success Criteria Summary

| Item | Status Metric |
|------|---------------|
| 1. CI/CD | Pipeline runs, tests pass, coverage >80% |
| 2. Pre-commit | All hooks pass, no secrets committed |
| 3. Connection Pool | Max 20 connections, no leaks |
| 4. Redis Cache | 60%+ hit rate, <100ms response |
| 5. Circuit Breaker | Opens at 3 failures, recovers |
| 6. SAST | Zero critical vulnerabilities |
| 7. Load Testing | p95 <200ms, 0% errors @ 100 users |
| 8. Feature Flags | Hot-reload, A/B testing |
| 9. Auto Docs | Generated on push, deployed to Pages |
| 10. Read Replicas | Read/write split, <30 connections |

## Grade Improvement Path

| Phase | Current | After Implementation |
|-------|---------|---------------------|
| Code Integrity | B+ | A |
| Resilience | C+ | A- |
| Innovation | A- | A |
| Technical Debt | C | B+ |
| **OVERALL** | **B+** | **A** |

---

**Ready to begin implementation?**