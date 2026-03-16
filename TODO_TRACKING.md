[Ver001.000]

# TODO Tracking & Resolution

**Created:** 2026-03-16  
**Status:** Active tracking of technical debt

---

## Summary

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| Frontend (website-v2) | 11 | Mixed | Tracking |
| Backend (API) | 10 | Medium | Tracking |
| Data Pipeline | 4 | Low | Phase 2/3 |
| **TOTAL** | **25** | — | In Progress |

---

## Frontend TODOs

### Critical (Immediate Action Required)

#### 1. `useLiveData.ts` - API Integration (3 TODOs)
**Location:** `apps/website-v2/src/hub-4-opera/components/Live/hooks/useLiveData.ts:211,228,245`

```typescript
// TODO: Replace with actual API call
// const response = await fetch('/api/opera/live/events');
```

**Issue:** Mock data in production code for live events, matches, and chat.

**Resolution:** 
- ✅ Created ticket: OPERA-API-001
- 🎯 Action: Implement WebSocket connection for real-time data
- 📅 Target: Week 1

---

### Medium Priority

#### 2. `TacticalView.tsx` - Canvas Rendering (3 TODOs)
**Location:** `apps/website-v2/src/components/TacticalView/TacticalView.tsx:19,98,248`

- Line 19: Agent sprite rendering enhancement
- Line 98: Minimap image loading
- Line 248: Map callouts drawing

**Resolution:**
- ✅ These are feature enhancements, not bugs
- 🎯 Action: Convert to feature tickets
- 📅 Target: Month 1 (post-launch)

---

### Low Priority (Documentation/Checklist)

#### 3. `ML-PRODUCTION-CHECKLIST.md` - 5 TODOs
**Location:** `apps/website-v2/src/dev/ML-PRODUCTION-CHECKLIST.md`

- Analytics tracking (line 112)
- Circuit breaker (line 117)
- Staging deployment (line 159)
- Load testing (line 164)
- Rollback documentation (line 169)

**Resolution:**
- ✅ These are checklist items, not code TODOs
- 🎯 Action: Move to project management tool
- 📅 Target: Pre-launch checklist

---

## Backend TODOs

### Medium Priority

#### 4. `dashboard.py` - Database Queries
**Location:** `packages/shared/axiom-esports-data/api/src/routes/dashboard.py:168`

```python
# TODO: Replace with actual DB queries
```

**Resolution:**
- ✅ Investigate current implementation
- 🎯 Action: Implement proper async DB queries
- 📅 Target: Week 1

#### 5. `auth_routes.py` - Email Integration (2 TODOs)
**Location:** `packages/shared/api/src/auth/auth_routes.py:113,481`

```python
# TODO: Send verification email via background task
```

**Resolution:**
- ✅ Email service architecture needed
- 🎯 Action: Implement background task queue (Celery/ARQ)
- 📅 Target: Month 1

#### 6. `map_routes.py` - Mock Data
**Location:** `packages/shared/api/src/rotas/map_routes.py:16`

```python
TODO: Replace MAPS_DB mock data with actual database queries
```

**Resolution:**
- ✅ Map data should come from VLR/game files
- 🎯 Action: Create map data ingestion pipeline
- 📅 Target: Week 2

#### 7. `alerts.py` - Notification Channels (4 TODOs)
**Location:** `packages/shared/axiom-esports-data/monitoring/dev_dashboard/alerts.py:315,320,325,330`

- Slack webhook
- Email
- PagerDuty
- Generic webhook

**Resolution:**
- ✅ Monitoring infrastructure exists
- 🎯 Action: Implement notification providers
- 📅 Target: Month 1 (DevOps focus)

#### 8. `ingest_service.py` - DB Connection
**Location:** `packages/shared/api/src/staging/ingest_service.py:243`

```python
# TODO: Implement actual DB insert when connection is available
```

**Resolution:**
- ✅ Part of staging pipeline
- 🎯 Action: Complete staging pipeline implementation
- 📅 Target: Month 1

#### 9. `scheduler.py` - Notifications
**Location:** `packages/shared/axiom-esports-data/monitoring/dev_dashboard/scheduler.py:126`

```python
# TODO: Implement actual notification (email, Slack, etc.)
```

**Resolution:**
- ✅ Related to alerts.py TODOs
- 🎯 Action: Combine with notification system
- 📅 Target: Month 1

---

## Data Pipeline TODOs (Phase 2/3)

#### 10. `FantasyDataFilter.ts` - Phase 3 Implementation (3 TODOs)
**Location:** `packages/shared/packages/data-partition-lib/src/FantasyDataFilter.ts`

- Line 30: Phase 3 features
- Line 36: Recursive filtering
- Line 55: Key validation

**Resolution:**
- 🎯 Action: Part of Phase 3 roadmap
- 📅 Target: Phase 3 milestone

#### 11. `stats-schema` - Validation Script
**Location:** `packages/shared/packages/stats-schema/package.json:10`

```json
"validate:schema": "echo 'TODO Phase 2: implement scripts/validate-no-game-fields.js'"
```

**Resolution:**
- 🎯 Action: Implement firewall validation script
- 📅 Target: Phase 2 completion

---

## Action Plan

### Week 1 (Immediate)

1. **API Integration (useLiveData.ts)**
   - Implement WebSocket connection to `/v1/ws`
   - Create event handlers for live data
   - Add fallback to polling

2. **Dashboard Queries (dashboard.py)**
   - Review current mock implementation
   - Write async PostgreSQL queries
   - Add caching layer

3. **Archive Legacy Website**
   - Move `apps/website/` to `legacy/`
   - Update documentation references
   - Verify no active dependencies

### Week 2

4. **Map Data Pipeline**
   - Design map data schema
   - Create ingestion from game files
   - Replace mock data

5. **Test Coverage**
   - Configure Vitest coverage threshold
   - Add missing unit tests
   - Update CI pipeline

### Month 1

6. **Email System**
   - Choose: Celery vs ARQ vs asyncio background tasks
   - Implement email templates
   - Add to auth flow

7. **Notification System**
   - Implement Slack webhook
   - Add PagerDuty integration
   - Configure alert routing

---

## Resolved TODOs

| Date | File | TODO | Resolution |
|------|------|------|------------|
| 2026-03-16 | — | — | Initial tracking file created |
| 2026-03-16 | useLiveData.ts | API integration (3 TODOs) | ✅ Implemented WebSocket + REST |
| 2026-03-16 | apps/website/ | Archive legacy | ✅ Moved to legacy/website/ |

---

## Guidelines for Future TODOs

1. **Always include:**
   - Clear description
   - Priority level (Critical/Medium/Low)
   - Target date
   - Ticket reference

2. **Avoid:**
   - Vague TODOs without context
   - Permanent TODOs in production
   - Mixed concerns in single TODO

3. **Prefer:**
   - GitHub Issues for tracking
   - Feature flags for incomplete features
   - Documentation for known limitations

---

*Last Updated: 2026-03-16*  
*Owner: Development Team*
