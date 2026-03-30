# Implementation Plan with SubAgents

[Ver001.000]

## Overview

This plan addresses the critical issues identified in CRIT verification. Each subagent has a specific, isolated task with clear deliverables.

---

## SubAgent 1: Database Infrastructure

### Task ID: SA1-DB-INFRA
**Priority:** CRITICAL  
**Estimated Time:** 30 minutes

### Objective
Create the missing `services/api/src/njz_api/database.py` module that provides async PostgreSQL connection pooling.

### Requirements
1. Create `services/api/src/njz_api/database.py` with:
   - `get_db_pool()` async function returning asyncpg Pool
   - Environment variable configuration (DATABASE_URL)
   - Connection pool with proper sizing (min: 2, max: 10)
   - Health check function `check_database_connection()`
   - Graceful shutdown handling

2. Create `services/api/src/njz_api/redis_cache.py` stub:
   - `redis_client` async getter
   - Redis connection from REDIS_URL env var

### Deliverables
- `services/api/src/njz_api/database.py` (working implementation)
- `services/api/src/njz_api/redis_cache.py` (stub)
- Unit test: `services/api/tests/unit/test_database.py` (basic connectivity)

### Success Criteria
```python
# This should work after implementation
import asyncio
from src.njz_api.database import get_db_pool, check_database_connection

async def test():
    assert await check_database_connection() is True
    pool = await get_db_pool()
    assert pool is not None

asyncio.run(test())
```

---

## SubAgent 2: TypeScript Type Definitions

### Task ID: SA2-TS-TYPES
**Priority:** HIGH  
**Estimated Time:** 45 minutes

### Objective
Expand `apps/web/src/global.d.ts` with complete Three.js type declarations.

### Requirements
Add to the existing `global.d.ts`:

1. **WebGLRenderer extensions:**
   - setPixelRatio(ratio: number): void
   - setClearColor(color: string|number, alpha?: number): void
   - clear(): void
   - canvas property

2. **Mesh extensions:**
   - scale: Vector3
   - position: Vector3

3. **Group extensions:**
   - visible: boolean
   - position: Vector3
   - getWorldPosition(target: Vector3): Vector3

4. **Color extensions:**
   - getHexString(): string
   - constructor accepts three arguments

5. **PerspectiveCamera extensions:**
   - aspect: number

### Deliverables
- Updated `apps/web/src/global.d.ts`

### Success Criteria
```bash
cd apps/web
pnpm run typecheck:build
# Should complete without errors
```

---

## SubAgent 3: Python Dependencies

### Task ID: SA3-PY-DEPS
**Priority:** MEDIUM  
**Estimated Time:** 15 minutes

### Objective
Add missing Python dependencies to the project configuration.

### Requirements
1. Check `services/api/pyproject.toml` exists
2. Add to `[tool.poetry.dependencies]`:
   - numpy = "^1.24.0"
   - scipy = "^1.11.0"
3. Verify pytest-asyncio is in dev-dependencies

### Deliverables
- Updated `services/api/pyproject.toml`

### Success Criteria
```bash
cd services/api
poetry install
python -c "import numpy; import scipy; print('OK')"
```

---

## SubAgent 4: Integration Testing

### Task ID: SA4-INTEGRATION
**Priority:** MEDIUM  
**Estimated Time:** 30 minutes  
**Depends On:** SA1, SA3

### Objective
Run all new tests and verify they pass.

### Requirements
1. Run feature_store tests:
   ```bash
   cd services/api
   python -m pytest tests/unit/feature_store/ -v --tb=short
   ```

2. Run model_registry tests:
   ```bash
   python -m pytest tests/unit/model_registry/ -v --tb=short
   ```

3. Run bayesian tests:
   ```bash
   python -m pytest tests/unit/bayesian/ -v --tb=short
   ```

4. Generate coverage report:
   ```bash
   python -m pytest tests/unit/ --cov=src --cov-report=html
   ```

### Deliverables
- Test execution report
- Coverage report (aim for >70% on new code)
- List of any failing tests with error messages

### Success Criteria
- All 145 new tests pass
- Coverage report generated
- No import errors
- No dependency errors

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Infrastructure (Can run in parallel)              │
│  ├── SA1: Database Infrastructure (CRITICAL)                │
│  ├── SA2: TypeScript Type Definitions (HIGH)                │
│  └── SA3: Python Dependencies (MEDIUM)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Integration (Depends on SA1, SA3)                 │
│  └── SA4: Integration Testing                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

If any subagent fails:
1. Document the failure in CRIT_VERIFICATION_REPORT.md
2. Do NOT commit partial implementations
3. Re-run CRIT verification after fixes

---

## Completion Criteria

✅ **CRIT Complete when:**
1. Preflight score >= 14/16 (already achieved)
2. TypeScript build passes
3. All 145 new Python tests pass
4. Coverage report shows >30% overall
5. No critical or high priority issues remain
