[Ver001.000]

# Sprint Plan: S-Extraction-001

**Sprint Goal:** Implement P0 Critical Items from Plan Extraction  
**Duration:** 2 weeks (April 1 - April 14, 2026)  
**Velocity Target:** 24 story points  
**Team:** 1 Full-Stack Developer  

---

## 1. Sprint Overview

### 1.1 Objective
Complete implementation specifications and begin development of the two P0 critical items extracted from plan archaeology:
1. **TD-P3-001:** GameNodeIDFrame Component (8h)
2. **TD-P4-001:** Path A/B Data Pipeline (16h)

### 1.2 Sprint Backlog

| ID | Item | Type | Points | Owner | Status |
|----|------|------|--------|-------|--------|
| S-EXT-001 | GameNodeIDFrame Component Spec | Spec | 2 | @dev | ✅ Done |
| S-EXT-002 | Path A/B Pipeline Spec | Spec | 3 | @dev | ✅ Done |
| S-EXT-003 | GameNodeIDFrame Implementation | Feature | 8 | @dev | 🔄 Ready |
| S-EXT-004 | Path A Webhook Handler | Feature | 5 | @dev | 🔄 Ready |
| S-EXT-005 | WebSocket Live Service | Feature | 5 | @dev | 🔄 Ready |
| S-EXT-006 | Path B Verification Layer | Feature | 5 | @dev | 🔄 Ready |
| S-EXT-007 | Integration Tests | Test | 3 | @dev | 🔄 Ready |
| **Total** | | | **31** | | |

*Note: 31 points > 24 target - scope for next sprint if needed*

---

## 2. Sprint Schedule

### Week 1: Foundation (April 1-7)

| Day | Focus | Tasks | Deliverable |
|-----|-------|-------|-------------|
| **Tue 4/1** | Planning | Sprint planning, spec review | Sprint plan approved |
| **Wed 4/2** | GameNodeIDFrame | Component setup, types | Component skeleton |
| **Thu 4/3** | GameNodeIDFrame | QuarterCard, animations | Component functional |
| **Fri 4/4** | GameNodeIDFrame | Testing, accessibility | Component complete |
| **Sat 4/5** | Path A | Webhook handler, Redis | Webhook receiving |
| **Sun 4/6** | Path A | WebSocket service | Real-time working |

### Week 2: Integration (April 8-14)

| Day | Focus | Tasks | Deliverable |
|-----|-------|-------|-------------|
| **Mon 4/7** | Path B | TeneT verifier, schema | Verification working |
| **Tue 4/8** | Path B | History API, review queue | Path B complete |
| **Wed 4/9** | Integration | Frontend hooks, badges | Full pipeline demo |
| **Thu 4/10** | Testing | E2E tests, load tests | Tests passing |
| **Fri 4/11** | Polish | Bug fixes, docs | Code complete |
| **Sat 4/12** | Review | Code review, QA | Review complete |
| **Sun 4/13** | Deploy | Production deploy | Live in prod |
| **Mon 4/14** | Retro | Sprint retrospective | Retro document |

---

## 3. Detailed Task Breakdown

### 3.1 S-EXT-003: GameNodeIDFrame Implementation (8 points)

**Objective:** Build the 2×2 quarter grid navigation component

**Sub-Tasks:**

| Task | Estimate | Acceptance Criteria |
|------|----------|---------------------|
| 3.1 Create component structure | 1h | Directory exists, types defined |
| 3.2 Implement GameNodeIDFrame | 2h | Container renders, props work |
| 3.3 Implement QuarterCard | 2h | Cards render with hover effects |
| 3.4 Add animations | 1h | 300ms transitions, 60fps |
| 3.5 Accessibility | 1h | WCAG 2.1 AA, keyboard nav |
| 3.6 Unit tests | 1h | 80% coverage, all pass |

**Definition of Done:**
- [ ] Component renders 2×2 grid
- [ ] All four quarters clickable
- [ ] Hover animations smooth
- [ ] Keyboard navigation works
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Accessibility score ≥ 95

**Related Spec:** [SPEC-TD-P3-001](../../specs/SPEC-TD-P3-001-GameNodeIDFrame.md)

---

### 3.2 S-EXT-004: Path A Webhook Handler (5 points)

**Objective:** Receive and process Pandascore webhooks

**Sub-Tasks:**

| Task | Estimate | Acceptance Criteria |
|------|----------|---------------------|
| 4.1 Webhook endpoint | 1.5h | POST /webhooks/pandascore works |
| 4.2 HMAC verification | 1h | Signatures validated |
| 4.3 Redis integration | 1.5h | Events stored in streams |
| 4.4 Deduplication | 1h | No duplicate processing |

**Definition of Done:**
- [ ] Webhook accepts events
- [ ] HMAC signatures verified
- [ ] Events routed to Redis
- [ ] Deduplication working
- [ ] Integration tests pass

**Related Spec:** [SPEC-TD-P4-001](../../specs/SPEC-TD-P4-001-PathAB-Pipeline.md)

---

### 3.3 S-EXT-005: WebSocket Live Service (5 points)

**Objective:** Broadcast live match updates to clients

**Sub-Tasks:**

| Task | Estimate | Acceptance Criteria |
|------|----------|---------------------|
| 5.1 Connection manager | 1.5h | Per-match connections tracked |
| 5.2 Redis consumer | 1.5h | Listens to streams |
| 5.3 Broadcast logic | 1h | Events sent to all clients |
| 5.4 Heartbeat | 1h | 30s heartbeat working |

**Definition of Done:**
- [ ] WebSocket connections accepted
- [ ] Redis events broadcast
- [ ] Heartbeat sent/received
- [ ] 100+ concurrent connections
- [ ] Latency < 500ms

---

### 3.4 S-EXT-006: Path B Verification Layer (5 points)

**Objective:** Implement TeneT verification with confidence scoring

**Sub-Tasks:**

| Task | Estimate | Acceptance Criteria |
|------|----------|---------------------|
| 6.1 Database schema | 1.5h | Migration applied |
| 6.2 TeneT verifier | 2h | Confidence calculation |
| 6.3 History API | 1h | /v1/history endpoints |
| 6.4 Review queue | 0.5h | Admin endpoints |

**Definition of Done:**
- [ ] Schema migrated
- [ ] Confidence scores calculated
- [ ] History API returns data
- [ ] Review queue accessible

---

### 3.5 S-EXT-007: Integration Tests (3 points)

**Objective:** End-to-end pipeline validation

**Sub-Tasks:**

| Task | Estimate | Acceptance Criteria |
|------|----------|---------------------|
| 7.1 Path A tests | 1h | Webhook → WebSocket flow |
| 7.2 Path B tests | 1h | Verification → API flow |
| 7.3 Load test | 1h | 100 msg/sec sustained |

---

## 4. Daily Standup Template

```markdown
## Standup - [DATE]

### Yesterday
- Completed: [tasks]
- Blockers: [if any]

### Today
- Focus: [main task]
- Goals: [specific outcomes]

### Blockers
- [ ] None / [description]

### Notes
- [any additional context]
```

---

## 5. Definition of Done

### For All Tasks:
- [ ] Code implemented
- [ ] Tests written (unit + integration)
- [ ] Tests passing
- [ ] TypeScript/Python type checking passes
- [ ] Linting passes
- [ ] Code reviewed (if applicable)
- [ ] Documentation updated

### For Features:
- [ ] Acceptance criteria met
- [ ] E2E tests passing
- [ ] Accessibility verified (frontend)
- [ ] Performance benchmarked

### For Sprint:
- [ ] All P0 items implemented
- [ ] Integration tests passing
- [ ] Demo ready
- [ ] Documentation complete

---

## 6. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Redis performance issues | Low | High | Monitor, scale if needed |
| WebSocket connection limits | Medium | Medium | Load test early |
| Schema migration conflicts | Low | High | Test in staging first |
| Frontend animation perf | Low | Medium | Test on low-end devices |

---

## 7. Sprint Review Checklist

- [ ] GameNodeIDFrame component deployed
- [ ] Path A pipeline receiving events
- [ ] WebSocket broadcasting working
- [ ] Path B verification active
- [ ] All integration tests passing
- [ ] Demo video recorded
- [ ] Documentation updated

---

## 8. Retrospective Template

```markdown
# Sprint Retrospective: S-Extraction-001

## What Went Well
- 

## What Could Improve
- 

## Action Items
- [ ] 

## Metrics
- Velocity: [X]/31 points
- Bugs Found: [Y]
- Tests Added: [Z]
```

---

## 9. Related Documents

| Document | Link |
|----------|------|
| GameNodeIDFrame Spec | [SPEC-TD-P3-001](../../specs/SPEC-TD-P3-001-GameNodeIDFrame.md) |
| Path A/B Spec | [SPEC-TD-P4-001](../../specs/SPEC-TD-P4-001-PathAB-Pipeline.md) |
| Backlog | [BACKLOG](../../../todo/backlog/BACKLOG.md) |
| Master Plan | [MASTER_PLAN](../../../MASTER_PLAN.md) |

---

*Sprint Plan Ready - Begin Implementation*
