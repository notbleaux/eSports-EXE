[Ver001.000]

# Phase 2 Execution Plan
## Production-Ready Implementation Roadmap

**Date:** 2026-03-16  
**Status:** Planning Phase  
**Scope:** OAuth, Push Notifications, UI Components, Betting Routes, WebSocket Gateway  
**Estimated Duration:** 5-7 days (parallel execution)

---

## Executive Summary

This plan details the coordinated execution of Phase 2 features across 5 workstreams. Tasks are assigned between **Sudo Tech** (coordinator, complex integration) and **Sub-Agents** (focused implementation waves).

### Resource Allocation

| Role | Assignment | Responsibility |
|------|------------|----------------|
| **Sudo Tech** | Me (Coordinator) | Complex integrations, final reviews, architecture decisions |
| **Sub-Agent Alpha** | Backend Specialist | Betting routes, API mounting, odds endpoints |
| **Sub-Agent Beta** | Real-time Specialist | WebSocket gateway activation, presence system |
| **Sub-Agent Gamma** | UI Component Specialist | 33 remaining UI components |
| **Sub-Agent Delta** | Auth Specialist | OAuth integration, 2FA implementation |
| **Sub-Agent Echo** | DevOps/Notifications | Push notifications, service workers |

---

## 1. Workstream Breakdown

### 1.1 WS-1: Betting Routes & API Mounting
**Priority:** P0 (Critical Path)  
**Estimated Time:** 2 days  
**Assigned To:** Sub-Agent Alpha  
**Review/Integration:** Sudo Tech

#### Pre-Requisites (Read-Only Verification)
Before spawning Sub-Agent Alpha:
```bash
# Sudo Tech verifies:
- odds_engine.py exists and is complete (9,538 bytes)
- main.py has import slots ready
- Database schema supports betting tables
- Test framework is ready
```

#### Sub-Agent Alpha Tasks

**Phase 1: Route Implementation (Day 1)**
1. Create `src/betting/routes.py` with FastAPI router
2. Implement endpoints:
   - `GET /api/betting/matches/{match_id}/odds` - Current odds
   - `GET /api/betting/matches/{match_id}/odds/history` - Historical odds
   - `POST /api/betting/matches/{match_id}/odds/calculate` - Force recalculation
   - `GET /api/betting/leaderboard` - Top bettors
   - `GET /api/betting/odds/formats` - Available formats (decimal/american/fractional)
3. Pydantic schemas in `src/betting/schemas.py`
4. Database models in `src/betting/models.py`

**Phase 2: Integration (Day 2)**
1. Mount router in `main.py`:
   ```python
   from src.betting.routes import router as betting_router
   app.include_router(betting_router, prefix="/api/betting", tags=["betting"])
   ```
2. Add WebSocket odds broadcast integration
3. Write unit tests in `tests/unit/betting/`
4. Update API documentation

#### Sub-Agent Alpha Deliverables Checklist
- [ ] `routes.py` with 5+ endpoints
- [ ] `schemas.py` with request/response models
- [ ] `models.py` with SQLAlchemy/asyncpg models
- [ ] Router mounted in main.py
- [ ] Unit tests (90%+ coverage)
- [ ] API documentation updates

#### Post-Completion Verification (Read-Only)
```bash
# Sudo Tech verifies:
npm run test:firewall
pytest tests/unit/betting/ -v
python -c "from src.betting.routes import router; print('OK')"
```

---

### 1.2 WS-2: WebSocket Gateway Activation
**Priority:** P0 (Critical Path)  
**Estimated Time:** 2 days  
**Assigned To:** Sub-Agent Beta  
**Review/Integration:** Sudo Tech

#### Pre-Requisites (Read-Only Verification)
```bash
# Sudo Tech verifies:
- websocket_gateway.py exists (13,312 bytes)
- main.py has WebSocket slots
- Redis is configured for pub/sub
- Connection manager is ready
```

#### Sub-Agent Beta Tasks

**Phase 1: Gateway Mounting (Day 1)**
1. Create `src/gateway/routes.py` for HTTP gateway management
2. Mount unified gateway in `main.py`:
   ```python
   @app.websocket("/ws/gateway")
   async def unified_gateway(websocket: WebSocket):
       await gateway.connect(websocket, user_id)
   ```
3. Implement channel subscription handlers
4. Add presence tracking endpoints

**Phase 2: Frontend Integration (Day 2)**
1. Create `TENET/services/websocket.ts` client
2. Implement connection manager with auto-reconnect
3. Add channel subscription hooks
4. Integrate with Zustand store for state sync
5. Write E2E tests for WebSocket flows

#### Sub-Agent Beta Deliverables Checklist
- [ ] Gateway mounted at `/ws/gateway`
- [ ] Channel subscription system working
- [ ] Presence tracking active
- [ ] Frontend WebSocket client
- [ ] Zustand integration
- [ ] E2E tests (5+ scenarios)

#### Post-Completion Verification (Read-Only)
```bash
# Sudo Tech verifies:
cd apps/website-v2
npx playwright test tests/e2e/realtime.spec.ts
python -c "from src.gateway.websocket_gateway import WebSocketGateway; print('OK')"
```

---

### 1.3 WS-3: OAuth Integration
**Priority:** P1 (High)  
**Estimated Time:** 3 days  
**Assigned To:** Sub-Agent Delta  
**Review/Integration:** Sudo Tech

#### Pre-Requisites (Read-Only Verification)
```bash
# Sudo Tech verifies:
- auth_routes.py exists and has basic auth
- JWT utilities are in place
- User table schema supports OAuth
- Environment variables template exists
```

#### Sub-Agent Delta Tasks

**Phase 1: OAuth Providers (Day 1-2)**
1. Install `authlib` for OAuth support
2. Create `src/auth/oauth.py` with providers:
   - Discord OAuth
   - Google OAuth
   - GitHub OAuth
3. Add OAuth callback handlers
4. Link OAuth accounts to existing users
5. Create `src/auth/oauth_routes.py`

**Phase 2: 2FA Implementation (Day 3)**
1. Install `pyotp` for TOTP
2. Create `src/auth/two_factor.py`
3. Implement TOTP setup/verify endpoints
4. Add backup codes generation
5. Update login flow to check 2FA
6. Frontend 2FA components in `TENET/components/auth/`

#### Sub-Agent Delta Deliverables Checklist
- [ ] Discord OAuth working
- [ ] Google OAuth working
- [ ] GitHub OAuth working
- [ ] OAuth account linking
- [ ] TOTP 2FA implementation
- [ ] Backup codes system
- [ ] Frontend OAuth buttons
- [ ] Frontend 2FA setup UI

#### Post-Completion Verification (Read-Only)
```bash
# Sudo Tech verifies:
pytest tests/integration/test_oauth.py -v
pytest tests/integration/test_2fa.py -v
```

---

### 1.4 WS-4: Push Notifications
**Priority:** P1 (High)  
**Estimated Time:** 2 days  
**Assigned To:** Sub-Agent Echo  
**Review/Integration:** Sudo Tech

#### Pre-Requisites (Read-Only Verification)
```bash
# Sudo Tech verifies:
- Notification schema exists in Zustand store
- Service worker infrastructure exists
- VAPID keys can be generated
```

#### Sub-Agent Echo Tasks

**Phase 1: Backend (Day 1)**
1. Create `src/notifications/push_service.py`
2. Implement Web Push Protocol with `pywebpush`
3. Add VAPID key generation script
4. Create subscription endpoints:
   - `POST /api/notifications/subscribe`
   - `POST /api/notifications/unsubscribe`
   - `GET /api/notifications/preferences`
5. Add notification dispatch queue

**Phase 2: Frontend (Day 2)**
1. Create `TENET/services/pushNotifications.ts`
2. Implement service worker registration
3. Add permission request flow
4. Create notification preference UI
5. Add notification badge handling
6. Support notification actions (click handlers)

#### Sub-Agent Echo Deliverables Checklist
- [ ] VAPID keys generated
- [ ] Subscription endpoints working
- [ ] Push dispatch service
- [ ] Service worker registered
- [ ] Permission handling
- [ ] Preference UI
- [ ] Notification actions

#### Post-Completion Verification (Read-Only)
```bash
# Sudo Tech verifies:
curl -X POST http://localhost:8000/api/notifications/subscribe -d '{...}'
# Trigger test notification
python scripts/test_push.py
```

---

### 1.5 WS-5: UI Components (33 Remaining)
**Priority:** P2 (Medium)  
**Estimated Time:** 4 days (parallel batches)  
**Assigned To:** Sub-Agent Gamma  
**Review/Integration:** Sudo Tech

#### Pre-Requisites (Read-Only Verification)
```bash
# Sudo Tech verifies:
- tokens.json exists (6,066 bytes)
- 17 components already implemented
- Design system patterns established
- Storybook available (if used)
```

#### Sub-Agent Gamma Tasks

**Batch 1: Primitives Completion (Day 1)**
Files to implement (9 components):
```
TENET/ui/primitives/
├── Checkbox.tsx          # Full implementation
├── Radio.tsx             # Full implementation  
├── Switch.tsx            # Full implementation
├── Select.tsx            # With options, optgroups
├── Textarea.tsx          # Auto-resize variant
├── Slider.tsx            # Range input
├── DatePicker.tsx        # Calendar popup
├── FileUpload.tsx        # Drag & drop
└── ColorPicker.tsx       # Color selection
```

**Batch 2: Composite Components (Day 2)**
Files to implement (8 components):
```
TENET/ui/composite/
├── Accordion.tsx         # Expandable sections
├── Tabs.tsx              # Tab navigation
├── Breadcrumb.tsx        # Navigation path
├── Pagination.tsx        # Page navigation
├── Dropdown.tsx          # Menu dropdown
├── Tooltip.tsx           # Hover info
├── Popover.tsx           # Click popup
└── Drawer.tsx            # Side panel
```

**Batch 3: Layout Components (Day 3)**
Files to implement (8 components):
```
TENET/ui/layout/
├── Container.tsx         # Max-width wrapper
├── Grid.tsx              # CSS Grid system
├── Flex.tsx              # Flexbox utilities
├── Spacer.tsx            # Fixed spacing
├── Divider.tsx           # Visual separator
├── AspectRatio.tsx       # Ratio container
├── Center.tsx            # Centering wrapper
└── SimpleGrid.tsx        # Auto-fit grid
```

**Batch 4: Feedback Components (Day 4)**
Files to implement (8 components):
```
TENET/ui/feedback/
├── Alert.tsx             # Status messages
├── Progress.tsx          # Progress bar
├── CircularProgress.tsx  # Circular indicator
├── Skeleton.tsx          # Loading placeholder (upgrade)
├── Spinner.tsx           # Loading spinner (upgrade)
├── Badge.tsx             # Status badge (upgrade)
├── Avatar.tsx            # User avatar (upgrade)
└── Rating.tsx            # Star rating
```

#### Sub-Agent Gamma Deliverables Checklist
- [ ] 33 components implemented
- [ ] All use design tokens
- [ ] TypeScript types exported
- [ ] Storybook stories (if applicable)
- [ ] Visual regression tests

#### Post-Completion Verification (Read-Only)
```bash
# Sudo Tech verifies:
cd apps/website-v2
npm run typecheck
npx vitest run src/components/TENET/ui
# Visual check of key components
```

---

## 2. Execution Sequence & Dependencies

### 2.1 Wave 1: Foundation (Days 1-2)
**Parallel Execution:**
```
Day 1:
├── Sub-Agent Alpha: Betting routes (Phase 1)
├── Sub-Agent Beta: Gateway mounting (Phase 1)
└── Sub-Agent Gamma: Batch 1 primitives

Day 2:
├── Sub-Agent Alpha: Betting integration (Phase 2) ← Review
├── Sub-Agent Beta: Frontend WebSocket (Phase 2) ← Review
└── Sub-Agent Gamma: Batch 2 composite
```

**Sudo Tech Responsibilities:**
- Morning: Spawn agents, verify read-only checks
- Evening: Review deliverables, provide feedback
- End of Day 2: Merge approved components

### 2.2 Wave 2: Auth & Notifications (Days 3-4)
**Parallel Execution:**
```
Day 3:
├── Sub-Agent Delta: OAuth providers (Phase 1)
├── Sub-Agent Echo: Backend push service (Phase 1)
└── Sub-Agent Gamma: Batch 3 layout

Day 4:
├── Sub-Agent Delta: 2FA implementation (Phase 2) ← Review
├── Sub-Agent Echo: Frontend push (Phase 2) ← Review
└── Sub-Agent Gamma: Batch 4 feedback ← Review
```

### 2.3 Wave 3: Integration & Polish (Days 5-7)
**Sudo Tech Led:**
```
Day 5:
├── Sudo Tech: Cross-service integration
├── Sudo Tech: OAuth + WebSocket auth flow
└── Sub-Agents: Bug fixes from review

Day 6:
├── Sudo Tech: E2E test suite completion
├── Sudo Tech: Performance optimization
└── Sudo Tech: Documentation updates

Day 7:
├── Sudo Tech: Final verification
├── Sudo Tech: Production readiness check
└── All: Demo preparation
```

---

## 3. Sub-Agent Spawn Protocol

### 3.1 Spawn Template

For each sub-agent spawn, Sudo Tech will:

```
1. READ-ONLY PRE-CHECK
   ├── Verify target files exist/are ready
   ├── Check dependencies are available
   ├── Confirm environment is stable
   └── Document current state

2. SPAWN AGENT
   ├── Provide specific task scope
   ├── Share relevant context/files
   ├── Set completion criteria
   └── Define verification steps

3. MONITOR (async)
   ├── Agent works independently
   ├── Available for questions
   └── Track progress

4. READ-ONLY POST-CHECK
   ├── Verify deliverables complete
   ├── Run typecheck/lint/tests
   ├── Code review
   └── Approve or request changes

5. INTEGRATE (if approved)
   ├── Merge to working branch
   ├── Update documentation
   └── Notify other agents of changes
```

### 3.2 Agent-Specific Context

**Sub-Agent Alpha (Betting) Context:**
```yaml
Skills: sator-fastapi-backend, sator-python-pipeline
Entry Point: packages/shared/api/src/betting/odds_engine.py
Output: packages/shared/api/src/betting/routes.py
Dependencies: 
  - main.py (mount point)
  - Database (bets table)
Tests: tests/unit/betting/
```

**Sub-Agent Beta (WebSocket) Context:**
```yaml
Skills: sator-fastapi-backend, sator-react-frontend
Backend: packages/shared/api/src/gateway/websocket_gateway.py
Frontend: apps/website-v2/src/components/TENET/services/
Mount: main.py /ws/gateway endpoint
Dependencies:
  - Redis pub/sub
  - Zustand store
Tests: tests/e2e/realtime.spec.ts
```

**Sub-Agent Gamma (UI) Context:**
```yaml
Skills: sator-react-frontend, design-systems
Design Tokens: apps/website-v2/src/components/TENET/design-system/tokens.json
Existing: 17 components in TENET/ui/
Output: 33 new components
Standards: 
  - TypeScript strict
  - Forward refs
  - Design token usage
  - Accessibility (a11y)
```

**Sub-Agent Delta (OAuth) Context:**
```yaml
Skills: sator-fastapi-backend
Entry: packages/shared/api/src/auth/auth_routes.py
Providers: Discord, Google, GitHub
2FA: TOTP with pyotp
Frontend: TENET/components/auth/
Dependencies:
  - JWT utilities
  - User table
Secrets: OAuth client IDs/keys
```

**Sub-Agent Echo (Push) Context:**
```yaml
Skills: sator-deployment, web-performance
Backend: packages/shared/api/src/notifications/
Frontend: apps/website-v2/public/service-worker.js
Protocol: Web Push (VAPID)
Dependencies:
  - Service worker
  - Notification API
  - Zustand preferences
```

---

## 4. Risk Management

### 4.1 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth provider rejection | Medium | High | Test with dev apps first |
| WebSocket scaling issues | Low | High | Load testing in Wave 3 |
| Component API inconsistency | Medium | Medium | Pre-define interfaces |
| Push notification browser support | High | Low | Graceful degradation |
| Database migration conflicts | Low | High | Versioned migrations |

### 4.2 Fallback Plans

**If OAuth is delayed:**
- Continue with existing JWT auth
- OAuth becomes Phase 3 item

**If WebSocket has issues:**
- Fallback to polling for live updates
- Prioritize HTTP betting endpoints

**If UI components behind:**
- Prioritize primitives over composites
- Use placeholder components for demos

---

## 5. Success Criteria

### 5.1 Definition of Done

**For Each Workstream:**
1. All deliverables checked off
2. TypeScript/Python type checks pass
3. Unit tests > 80% coverage
4. No console errors in browser
5. API endpoints return 200 in tests
6. Documentation updated

### 5.2 Phase 2 Complete When

- [ ] Betting: `/api/betting/*` endpoints responding
- [ ] WebSocket: `/ws/gateway` accepting connections
- [ ] OAuth: At least 2 providers working
- [ ] 2FA: TOTP setup flow complete
- [ ] Push: Test notification delivered
- [ ] UI: 50/50 components implemented
- [ ] E2E: 20+ tests passing
- [ ] Docs: API reference updated

---

## 6. Communication Plan

### 6.1 Daily Standup (Async)
Each agent reports:
```
- Completed yesterday
- Working on today  
- Blockers/needs help
```

### 6.2 Checkpoint Schedule

| Day | Time | Activity | Lead |
|-----|------|----------|------|
| 1-4 | 09:00 | Agent spawn | Sudo Tech |
| 1-4 | 21:00 | Review & feedback | Sudo Tech |
| 5 | 14:00 | Integration start | Sudo Tech |
| 6 | 14:00 | Test suite run | Sudo Tech |
| 7 | 10:00 | Final verification | All |
| 7 | 16:00 | Demo & sign-off | All |

### 6.3 Handoff Documentation

Each agent produces:
1. `AGENT_REPORT_{name}.md` - What was done
2. `AGENT_VERIFICATION.md` - Test results
3. Updated inline code comments
4. API changes documented

---

## 7. Immediate Next Actions

### For User Approval:
1. ✅ Review this plan
2. ✅ Confirm priority order (can adjust)
3. ✅ Approve sub-agent spawning strategy
4. ✅ Set timeline expectations

### Upon Approval, Sudo Tech Will:
1. Begin Wave 1 agent spawning
2. Execute read-only pre-checks
3. Spawn Sub-Agent Alpha (Betting)
4. Spawn Sub-Agent Beta (WebSocket)
5. Spawn Sub-Agent Gamma (UI Batch 1)

---

*Plan Version: 001.000*  
*Next Review: Upon user approval*
