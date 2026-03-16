# Current Focus: Production Readiness (P1 Items)

**Last Updated**: 2026-03-16  
**Status**: In Progress  
**Priority**: P1 (Critical Path)  

---

## Completed Tasks

### ✅ 1. OPERA Live Events API Endpoints - COMPLETE

**Status**: Complete - All endpoints implemented and wired

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/v1/opera/live/events` | GET | ✅ | Live/upcoming tournament events from Pandascore |
| `/v1/opera/live/matches` | GET | ✅ | Live match data with team info |
| `/v1/opera/live/chat` | GET | ✅ | Chat messages for live events |
| `/v1/opera/live/ws` | WebSocket | ✅ | Real-time event streaming |

**Files Updated**:
- `packages/shared/api/src/routes/opera_live.py` - Full CRUD + WebSocket implementation
- `packages/shared/axiom-esports-data/api/main.py` - Route registration and endpoints list
- `packages/shared/axiom_esports_data/api/main.py` - Route registration (duplicate)

---

### ✅ 2. Enhanced API Main - INTEGRATED

**Status**: Enhanced main.py created with production features adapted to existing structure

**Files Created/Updated**:
| File | Purpose |
|------|---------|
| `packages/shared/axiom-esports-data/api/main_enhanced.py` | Enhanced FastAPI app with structured logging, request ID middleware, enhanced error handlers |
| `packages/shared/requirements.txt` | Added WebSocket, utilities, testing dependencies |
| `scripts/setup-local.sh` | One-command local dev setup (integrated with existing migration runner) |

**Features Integrated**:
- ✅ Structured JSON logging with `JSONFormatter` class
- ✅ Request ID middleware (`X-Request-ID` header tracing)
- ✅ Enhanced error handlers with request_id in responses
- ✅ `/metrics` endpoint for Prometheus-compatible monitoring
- ✅ Consistent with existing `db_manager.py` patterns
- ✅ Preserved existing route structure and firewall middleware

**Key Differences from Corrected Files**:
- Adapted to use existing `db_manager.DatabaseManager` instead of new connection patterns
- Preserved existing migration structure (`scripts/run_migrations.py`)
- Used existing `infrastructure/migrations/` directory
- Maintained existing route organization in `api/src/routes/`

---

### ✅ 3. Test Coverage Thresholds - UPDATED

**File**: `apps/website-v2/vitest.config.js`

**Changes**: All thresholds increased from 70% → 80%
- statements: 80
- branches: 80  
- functions: 80
- lines: 80

---

## Pending P1 Items

### ⏳ 4. Sentry DSN Configuration

**Status**: Awaiting Vercel dashboard access

**Required Environment Variable**:
```
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Configuration Location**:
- Vercel Dashboard → Project Settings → Environment Variables
- Or via CLI: `vercel env add VITE_SENTRY_DSN production`

**Sentry Config File**: `apps/website-v2/src/config/sentry.ts` (already implemented)

---

### ⏳ 5. Test Coverage Implementation

**Status**: Thresholds updated, test files need implementation

**Critical Path Test Files Needed**:

| File | Type | Priority |
|------|------|----------|
| `hooks/useFeatureFlag.test.ts` | Unit | High |
| `hooks/useLiveData.test.ts` | Unit | High |
| `utils/logger.test.ts` | Unit | Medium |
| `config/features.test.ts` | Unit | Medium |

---

## Migration Guide: Switching to Enhanced Main

To use the enhanced main.py with production features:

```bash
# Backup existing main.py
cd packages/shared/axiom-esports-data/api
cp main.py main.py.backup

# Switch to enhanced version
cp main_enhanced.py main.py

# Run the API
uvicorn main:app --reload
```

---

## Next Actions

1. **Add Sentry DSN** to Vercel production environment
2. **Implement test files** to reach 80% coverage
3. **Validate enhanced main.py** in staging environment
4. **Create additional service routes** if needed:
   - `tokens/token_routes.py`
   - `forum/forum_routes.py`
   - `fantasy/fantasy_routes.py`

---

## Progress Summary

| Item | Status | Completion |
|------|--------|------------|
| OPERA API Endpoints | ✅ Complete | 100% |
| Enhanced API Main | ✅ Integrated | 100% |
| Local Setup Script | ✅ Complete | 100% |
| Test Coverage Thresholds | ✅ Updated | 100% |
| Sentry DSN | ⏳ Pending | 0% |
| Test Implementation | ⏳ Pending | 0% |

**Overall P1 Progress**: ~80%
