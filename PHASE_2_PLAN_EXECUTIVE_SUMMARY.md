[Ver001.000]

# Phase 2 Plan: Executive Summary

**Date:** 2026-03-16  
**Status:** ✅ READY FOR EXECUTION  
**Decision Required:** Approve plan and authorize agent spawning

---

## Current State Verification

### Infrastructure Health: ✅ PRODUCTION-READY

| Check Category | Passed | Warnings | Critical |
|----------------|--------|----------|----------|
| Core Infrastructure | 4/4 | 0 | 0 |
| Betting Module | 2/3 | 1 | 0 |
| WebSocket Module | 2/3 | 1 | 0 |
| UI Components | 5/5 | 0 | 0 |
| Auth Module | 4/4 | 0 | 0 |
| Notifications | 3/3 | 0 | 0 |
| **TOTAL** | **20/22** | **2** | **0** |

**Verdict:** Infrastructure is stable and ready for Phase 2 development.

### Warnings (Non-Critical)
1. `tests/unit/betting` directory missing → Agent Alpha will create
2. `TENET/services` directory missing → Agent Beta will create

---

## Phase 2 Scope

### Five Workstreams

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 2 EXECUTION                           │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│    WS-1     │    WS-2     │    WS-3     │    WS-4     │  WS-5   │
│   Betting   │ WebSocket   │    OAuth    │    Push     │   UI    │
│   Routes    │  Gateway    │    + 2FA    │    Notifs   │   33    │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────┤
│  Agent A    │  Agent B    │  Agent D    │  Agent E    │ Agent G │
│  2 days     │  2 days     │  3 days     │  2 days     │ 4 days  │
│  Priority   │  Priority   │   High      │   High      │ Medium  │
│     P0      │     P0      │     P1      │     P1      │   P2    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Sudo Tech     │
                    │  Integration    │
                    │   Days 5-7      │
                    └─────────────────┘
```

---

## Resource Allocation

### Sub-Agents

| Agent | Specialty | Task | Duration | Cost* |
|-------|-----------|------|----------|-------|
| **Alpha** | Backend API | Betting routes + mounting | 2 days | $400 |
| **Beta** | Real-time | WebSocket gateway activation | 2 days | $400 |
| **Gamma** | UI/UX | 33 remaining UI components | 4 days | $800 |
| **Delta** | Auth/Security | OAuth + 2FA implementation | 3 days | $600 |
| **Echo** | DevOps/FE | Push notification system | 2 days | $400 |
| **Sudo** | Integration | Cross-service integration | 3 days | — |

\* Estimated compute/token costs

### Parallel Execution Strategy

```
Week 1:
  Mon-Tue: Alpha + Beta + Gamma(Batch 1) → Wave 1
  Wed-Thu: Delta + Echo + Gamma(Batch 2-4) → Wave 2
  
Week 2:
  Mon-Wed: Sudo Tech integration + testing → Wave 3
  Thu: Final verification
  Fri: Demo + sign-off
```

---

## Deliverables by Workstream

### WS-1: Betting (Agent Alpha)
**Output Files:**
- `packages/shared/api/src/betting/routes.py` (300+ lines)
- `packages/shared/api/src/betting/schemas.py`
- `packages/shared/api/src/betting/models.py`
- Updated `main.py` (mount)
- `tests/unit/betting/test_*.py`

**API Endpoints:**
```
GET    /api/betting/matches/{id}/odds
GET    /api/betting/matches/{id}/odds/history
POST   /api/betting/matches/{id}/odds/calculate
GET    /api/betting/leaderboard
GET    /api/betting/odds/formats
```

### WS-2: WebSocket (Agent Beta)
**Output Files:**
- `packages/shared/api/src/gateway/routes.py`
- Updated `main.py` (mount /ws/gateway)
- `TENET/services/websocket.ts`
- `TENET/hooks/useWebSocket.ts`
- Updated `TENET/store/index.ts`
- `tests/e2e/websocket.spec.ts`

**Features:**
- Unified gateway at `/ws/gateway`
- 5 multiplexed channels
- Auto-reconnect client
- Presence tracking
- Zustand integration

### WS-3: OAuth + 2FA (Agent Delta)
**Output Files:**
- `packages/shared/api/src/auth/oauth.py`
- `packages/shared/api/src/auth/oauth_routes.py`
- `packages/shared/api/src/auth/two_factor.py`
- `TENET/components/auth/OAuthButtons.tsx`
- `TENET/components/auth/TwoFactor*.tsx`

**Providers:** Discord, Google, GitHub  
**2FA:** TOTP + backup codes

### WS-4: Push Notifications (Agent Echo)
**Output Files:**
- `packages/shared/api/src/notifications/push_service.py`
- `packages/shared/api/src/notifications/routes.py`
- `public/service-worker.js`
- `TENET/services/pushNotifications.ts`
- `scripts/generate_vapid_keys.py`

**Features:**
- Web Push Protocol
- Browser support (Chrome, Firefox, Safari)
- Permission management
- Notification preferences UI

### WS-5: UI Components (Agent Gamma)
**Output Files:** 33 new components

**Primitives (9):** Checkbox, Radio, Switch, Select, Textarea, Slider, DatePicker, FileUpload, ColorPicker  
**Composite (8):** Accordion, Tabs, Breadcrumb, Pagination, Dropdown, Tooltip, Popover, Drawer  
**Layout (8):** Container, Grid, Flex, Spacer, Divider, AspectRatio, Center, SimpleGrid  
**Feedback (8):** Alert, Progress, CircularProgress, Skeleton, Spinner, Badge, Avatar, Rating

---

## Timeline

```
Day 1-2 (Wave 1):
  ├── Alpha: Betting routes Phase 1-2
  ├── Beta: WebSocket mounting Phase 1-2
  └── Gamma: UI Batch 1 (Primitives)

Day 3-4 (Wave 2):
  ├── Delta: OAuth Phase 1-2 + 2FA
  ├── Echo: Push Phase 1-2
  └── Gamma: UI Batch 2-4

Day 5-7 (Wave 3 - Sudo Tech):
  ├── Cross-service integration
  ├── E2E test suite
  ├── Performance optimization
  └── Final verification
```

**Total Duration:** 7 days  
**Parallel Efficiency:** 5 agents working simultaneously in Waves 1-2

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth app approval delay | Medium | High | Test with dev credentials first |
| WebSocket scaling issues | Low | High | Load test on Day 5 |
| Component API inconsistency | Medium | Medium | Pre-defined interfaces provided |
| Push browser compatibility | High | Low | Graceful degradation |
| Agent coordination overhead | Medium | Medium | Daily checkpoints + async reports |

---

## Success Criteria

Phase 2 will be considered complete when:

- [ ] **Betting:** All 5 endpoints responding with valid odds
- [ ] **WebSocket:** `/ws/gateway` accepting connections, client connected
- [ ] **OAuth:** At least 2 providers successfully authenticating users
- [ ] **2FA:** TOTP setup flow working, backup codes generated
- [ ] **Push:** Test notification delivered to browser
- [ ] **UI:** 50/50 components implemented and type-safe
- [ ] **Tests:** E2E suite passing (20+ tests)
- [ ] **Docs:** API reference updated with new endpoints

---

## Sudo Tech Responsibilities

### Wave 1 & 2 (Days 1-4)
- Execute pre-spawn read-only checks
- Spawn agents with detailed briefs
- Evening code review
- Merge approved components
- Resolve cross-agent dependencies

### Wave 3 (Days 5-7)
- OAuth + WebSocket auth integration
- Betting + WebSocket live odds
- E2E test suite completion
- Performance optimization
- Production readiness check
- Final documentation

---

## Required User Decisions

### 1. Approve Plan ✅
Confirm this plan meets requirements and timeline expectations.

### 2. Priority Confirmation
Current priority order:
1. P0: Betting + WebSocket (Wave 1)
2. P1: OAuth + Push (Wave 2)
3. P2: UI Components (parallel)

**Confirm or adjust?**

### 3. OAuth Providers
Planned: Discord, Google, GitHub  
**Any additions or removals?**

### 4. Timeline
Estimated: 7 days  
**Acceptable or need acceleration?**

---

## Immediate Next Steps

Upon your approval, Sudo Tech will:

1. ✅ Execute final pre-spawn checks
2. ✅ Spawn Sub-Agent Alpha (Betting)
3. ✅ Spawn Sub-Agent Beta (WebSocket)
4. ✅ Spawn Sub-Agent Gamma (UI Batch 1)
5. ✅ Begin Wave 1 execution

**Ready to proceed?**

---

## Documents Generated

| Document | Purpose | Size |
|----------|---------|------|
| `PHASE_2_EXECUTION_PLAN.md` | Detailed workstream breakdown | 17.7 KB |
| `PHASE_2_SUB_AGENT_CHECKLISTS.md` | Pre/post verification checklists | 18.8 KB |
| `scripts/phase2_precheck.py` | Automated verification script | 12.9 KB |
| `PHASE_2_PRECHECK_REPORT.md` | Current infrastructure status | Auto-generated |
| `PHASE_2_PLAN_EXECUTIVE_SUMMARY.md` | This document | — |

---

*Summary Version: 001.000*  
*Infrastructure Status: ✅ VERIFIED READY*  
*Awaiting: User approval to spawn agents*
