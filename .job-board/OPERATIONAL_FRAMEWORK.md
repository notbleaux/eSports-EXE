[Ver001.000]

# OPERATIONAL FRAMEWORK
## Execution Protocols, Timeouts, Safety & Failure Handling

**Status:** Phase 0 Required Infrastructure  
**Applies to:** All 33 Teams, 98 Agents  
**Authority:** Foreman with TL delegation

---

## 1. TIMEOUTS & RESPONSE SLAs

### Communication Timeouts

| Communication Type | Expected Response | Timeout Action | Escalation |
|-------------------|-------------------|----------------|------------|
| **Agent → TL daily update** | 17:00 daily | TL checks at 17:30 | TL marks as blocked |
| **TL → Foreman TEAM_REPORT** | 18:00 daily | Foreman pings at 19:00 | Direct agent contact |
| **Blocker → TL** | Immediate | TL responds in 2h | Escalate to Foreman |
| **Escalation → Foreman** | 4 hours | Auto-escalation alert | Emergency protocol |
| **Code review request** | 8 hours | Ping reminder | Reassign reviewer |
| **PR merge approval** | 24 hours | Auto-reminder | TL override possible |

### Task Duration Timeouts

| Task Size | Expected Duration | Timeout Warning | Timeout Action |
|-----------|-------------------|-----------------|----------------|
| **Small** (1-4h) | +25% buffer | At 5h | TL check-in |
| **Medium** (4-8h) | +25% buffer | At 10h | TL intervention |
| **Large** (8-16h) | +25% buffer | At 20h | Foreman escalation |
| **Epic** (16h+) | Milestone-based | Per milestone | Phase gate review |

### System Timeouts

| System | Connection Timeout | Retry Strategy | Max Retries |
|--------|-------------------|----------------|-------------|
| WebSocket | 5 seconds | Exponential backoff | 10 |
| API requests | 10 seconds | Linear backoff | 3 |
| Database queries | 30 seconds | Immediate retry | 2 |
| File I/O | 60 seconds | Immediate retry | 3 |
| Git operations | 120 seconds | Immediate retry | 5 |

---

## 2. SAFETY GUIDELINES

### Code Safety

#### Type Safety (Strict Mode)
```typescript
// REQUIRED: All new code
"compilerOptions": {
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

#### Runtime Safety
- [ ] All API responses validated with Zod/schemas
- [ ] No `any` types in production code
- [ ] Null checks required before property access
- [ ] Error boundaries around all React components
- [ ] Graceful degradation for missing data

#### WebGL Safety
```typescript
// REQUIRED: WebGL context loss handling
const gl = canvas.getContext('webgl2');

canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  // Save state
  // Show fallback UI
  // Attempt recovery
});

canvas.addEventListener('webglcontextrestored', () => {
  // Reinitialize resources
  // Restore state
});
```

### Data Safety

#### Never Commit
- [ ] API keys, tokens, secrets
- [ ] Database credentials
- [ ] Personal data (PII)
- [ ] Large binary files (>1MB)
- [ ] Generated build artifacts

#### Required Validation
- [ ] All user inputs sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF tokens for state-changing ops

### Performance Safety

#### Memory Limits
| Context | Max Memory | Action on Exceed |
|---------|-----------|------------------|
| Web app | 100MB | Warn + cleanup |
| Lens system | 200MB | Reduce quality |
| ML models | 50MB | Load on demand |
| Replay data | 500MB | Streaming only |

#### Frame Rate Safety
```typescript
// REQUIRED: Frame rate monitoring
if (fps < 30) {
  // Auto-reduce quality
  lensSystem.reduceQuality();
}

if (fps < 15) {
  // Disable expensive features
  lensSystem.disableNonCritical();
}

if (fps < 5) {
  // Emergency mode
  lensSystem.emergencyMode();
  notifyUser('Performance degraded');
}
```

---

## 3. PROTOCOLS

### Standard Operating Procedures

#### SOP-001: Task Start Protocol
1. Read task specification completely
2. Check dependencies are complete
3. Verify environment setup
4. Create feature branch: `feature/[wave]-[agent]-[description]`
5. Write implementation plan (bullet points)
6. Begin implementation

#### SOP-002: Daily Standup Protocol
1. **Yesterday:** What was completed
2. **Today:** What will be worked on
3. **Blockers:** Any impediments
4. **Time:** Estimated remaining hours
5. **Risks:** Any concerns

#### SOP-003: Code Submission Protocol
1. Self-review against acceptance criteria
2. Run linting: `npm run lint`
3. Run type checking: `npm run typecheck`
4. Run tests: `npm test`
5. Create PR with template
6. Request TL review
7. Address feedback
8. TL pre-review approval
9. Submit to Foreman

#### SOP-004: Emergency Fix Protocol
1. Identify severity (Critical/High/Med/Low)
2. If Critical: Stop current work, fix immediately
3. Create hotfix branch from `main`
4. Minimal fix + test
5. TL expedited review
6. Foreman approval
7. Merge and deploy
8. Document in incident log

### Communication Protocols

#### Async Communication Standard
```markdown
**Subject:** [TEAM-ID] [AGENT-ID] [TYPE] — Brief Description

**Context:** [Why this matters]

**Details:**
- Point 1
- Point 2

**Action Required:** [Specific ask]

**Timeline:** [When needed]

**Attachments:** [Links]
```

#### Meeting Protocols
- **Standups:** 15 min max, async preferred
- **Sprint Planning:** 2 hours, agenda required
- **CRIT Sessions:** 90 min, follow template
- **Emergency Meetings:** Immediate, TLs + Foreman only

---

## 4. FAILURE PROTOCOLS

### Failure Classification

| Level | Definition | Response Time | Authority |
|-------|-----------|---------------|-----------|
| **Critical** | System down, data loss, security breach | Immediate | Foreman |
| **High** | Feature broken, blocking others | 2 hours | TL + Foreman |
| **Medium** | Degraded performance, partial failure | 8 hours | TL |
| **Low** | Cosmetic, non-blocking | 24 hours | Agent |

### Failure Response Protocol (FRP)

#### FRP-001: Critical Failure
```
T+0:00   Failure detected
T+0:05   Alert sent to Foreman + TLs
T+0:10   War room assembled (video call)
T+0:30   Root cause identified
T+1:00   Fix implemented
T+2:00   Fix deployed
T+4:00   Post-mortem scheduled
```

#### FRP-002: Agent Failure (Performance/Availability)
1. TL identifies agent struggling
2. TL provides support (30 min session)
3. If no improvement: Reassign simpler tasks
4. If still failing: Escalate to Foreman
5. Options: Reassignment, additional training, replacement

#### FRP-003: Task Failure (Cannot Complete)
1. Agent documents blockers attempted
2. TL reviews feasibility
3. If solvable: TL provides guidance
4. If unsolvable: Escalate to Foreman
5. Options: Scope reduction, reassignment, timeline extension

#### FRP-004: Technical Failure (Build/Test/Deploy)
1. Agent attempts standard fixes (30 min)
2. TL reviews technical approach
3. If unsolved: Escalate to infrastructure team
4. If infrastructure issue: Emergency fix protocol
5. Document workaround if needed

### Rollback Protocols

| Scenario | Rollback Trigger | Rollback Time | Authority |
|----------|-----------------|---------------|-----------|
| Broken deployment | Failed smoke test | Immediate | TL |
| Performance regression | <50% of baseline | 1 hour | TL |
| Data corruption | Any corruption detected | Immediate | Foreman |
| Security vulnerability | CVE detected | Immediate | Foreman |

---

## 5. JLB PROTOCOLS

### Job Listing Board Operations

#### Task Lifecycle
```
01_LISTINGS/ACTIVE/    → Task available
    ↓ (Claimed)
02_CLAIMED/[TL-ID]/    → Team works on it
    ↓ (Pre-review passed)
PRE_REVIEWS/           → TL quality gate
    ↓ (Approved)
03_COMPLETED/          → Done
    ↓ (Or failed)
04_BLOCKS/             → Blocked/Escalated
```

#### File Naming Conventions
```
Task Files:
  [PIPE]_WAVE_[M]_[N]_AGENT_[ID]_[DESCRIPTION].md
  Example: SPEC_WAVE_1_1_AGENT_1A_LENS_FRAMEWORK.md

Team Reports:
  TEAM_REPORT_[YYYYMMDD]_[TL-ID].md
  Example: TEAM_REPORT_20260323_TL_H1.md

Pre-Reviews:
  PRE_REVIEW_[AGENT-ID]_[TASK].md
  Example: PRE_REVIEW_1B_SOL_LUN_BIBLES.md

Escalations:
  ESCALATION_[TL-ID]_[DATE]_[SEVERITY].md
  Example: ESCALATION_TL_H1_20260323_HIGH.md
```

#### Directory Permissions
| Directory | Who Can Write | Purpose |
|-----------|--------------|---------|
| `01_LISTINGS/` | Foreman only | Task authority |
| `02_CLAIMED/[TL-ID]/` | TL + assigned agents | Team workspace |
| `03_COMPLETED/` | Foreman only | Archive |
| `04_BLOCKS/` | TLs + Foreman | Coordination |
| `05_TEMPLATES/` | Foreman only | Standards |
| `06_TEAM_LEADERS/` | Respective TLs | TL workspace |

### Claim Protocol
1. Agent identifies available task in `01_LISTINGS/`
2. Agent notifies TL of intent
3. TL approves (or suggests alternative)
4. Agent copies task to `02_CLAIMED/[TL-ID]/`
5. TL updates roster/status
6. Work begins

### Submission Protocol
1. Agent completes work
2. Agent self-reviews against criteria
3. Agent submits to TL for PRE_REVIEW
4. TL reviews within 4 hours
5. TL either:
   - Approves → Foreman review
   - Requests changes → Back to agent
   - Escalates → Foreman decision
6. Foreman reviews approved submissions
7. Foreman either:
   - Approves → Move to COMPLETED
   - Requests changes → Back to TL
   - Rejects → Special handling

---

## 6. METRICS & HEURISTICS

### Primary Metrics (Tracked Daily)

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Velocity** | 85%+ of planned | Story points completed / Planned | TL |
| **Quality** | 90% first-pass | Submissions passing pre-review | TL |
| **Blocker Resolution** | 80% at TL level | TL-resolved / Total blockers | TL |
| **On-Time Delivery** | 90% | Tasks delivered by deadline | TL |
| **Escalation Validity** | 95%+ | Valid escalations / Total | Foreman |

### Secondary Metrics (Tracked Weekly)

| Metric | Target | Purpose |
|--------|--------|---------|
| **Code Coverage** | 80%+ | Test comprehensiveness |
| **Performance Budget** | 100% compliance | No regressions |
| **Documentation** | 100% | All features documented |
| **Accessibility** | WCAG AA | Compliance score |
| **Tech Debt** | <10% of velocity | Sustainable pace |

### Heuristics for TL Decision-Making

#### When to Escalate (Decision Tree)
```
Issue detected
    ↓
Can TL resolve with team resources?
    ↓ YES → Resolve, document
    ↓ NO
Is it cross-pipeline?
    ↓ YES → ESCALATE
    ↓ NO
Does it affect quality gates?
    ↓ YES → ESCALATE
    ↓ NO
Is timeline impact >2 days?
    ↓ YES → ESCALATE
    ↓ NO
Does it require architecture change?
    ↓ YES → ESCALATE
    ↓ NO → TL decides autonomously
```

#### Performance Heuristics
- **If fps < 30:** Reduce quality by one tier
- **If memory > 80%:** Trigger cleanup
- **If load time > 3s:** Enable lazy loading
- **If error rate > 1%:** Investigate immediately

#### Quality Heuristics
- **If test coverage < 80%:** Require more tests
- **If complexity > 15:** Refactor required
- **If duplicate code > 3x:** Extract component
- **If bundle size +10%:** Investigate imports

---

## 7. SUCCESS DEFINITIONS

### Phase Success Criteria

#### Phase 0 Success
- [ ] All 3 TLs briefed and operational
- [ ] Team directories created
- [ ] Communication channels established
- [ ] Sprint prerequisites moved/completed
- [ ] No blockers preventing Phase 1

#### Phase 1 Success (Wave 1.1)
- [ ] All 9 agents have claimed tasks
- [ ] Daily standups operational
- [ ] First TEAM_REPORTs submitted
- [ ] First pre-reviews completed
- [ ] At least 3 submissions to Foreman

#### Sprint Success
- [ ] 85%+ of planned tasks complete
- [ ] All quality gates passed
- [ ] Zero critical bugs
- [ ] Documentation complete
- [ ] CRIT session completed

### Project Success (13-Week)

| Criterion | Definition | Measurement |
|-----------|-----------|-------------|
| **Functional** | All MVP features work | Acceptance tests pass |
| **Quality** | Production-ready | 0 critical, <5 high bugs |
| **Performance** | Fast and responsive | Lighthouse >90 |
| **Accessible** | WCAG AA compliant | Automated + manual audit |
| **Deployed** | Public availability | Live on GitHub Pages |
| **Documented** | Complete docs | All APIs documented |
| **Sustainable** | Maintainable code | Tech debt <10% |

### Team Success

#### TL Success Metrics
- Team velocity at or above plan
- 90%+ quality gate first-pass
- <20% escalation rate
- Positive team feedback
- On-time delivery

#### Agent Success Metrics
- Task completion per assignment
- Code quality standards met
- Collaboration effectiveness
- Growth in capability
- Contribution to team goals

---

## 8. SERVICES DELIVERABLES & CHECK PROTOCOLS

### Service Level Agreements (SLAs)

| Service | Availability | Response Time | Recovery Time |
|---------|--------------|---------------|---------------|
| **JLB/Task System** | 99.5% | N/A | 4 hours |
| **Git Repository** | 99.9% | N/A | 1 hour |
| **Build System** | 99% | 15 min | 2 hours |
| **Test Environment** | 95% | 30 min | 4 hours |
| **Documentation Site** | 99% | N/A | 2 hours |

### Deliverable Check Protocols

#### DCP-001: Code Deliverable
```
□ File exists at specified location
□ Compiles without errors (TypeScript)
□ Passes linting (ESLint)
□ Passes type checking
□ Unit tests written and passing
□ Integration tests if applicable
□ No console errors
□ No memory leaks (manual check)
□ Follows naming conventions
□ Documented (JSDoc/comments)
```

#### DCP-002: Documentation Deliverable
```
□ File exists and is readable
□ Follows template format
□ All sections complete
□ Code examples work
□ Links are valid
□ Version header present
□ No spelling errors
□ Peer reviewed
□ Approved by TL
```

#### DCP-003: Asset Deliverable (Images/SVGs)
```
□ File exists at specified location
□ Correct format (SVG/PNG/etc.)
□ Optimized (svgo/pngquant)
□ < size limit (500KB)
□ Copyright compliant
□ Follows naming convention
□ Works in target context
□ Responsive/scalable if needed
```

#### DCP-004: Component Deliverable
```
□ Renders without errors
□ Props interface defined
□ TypeScript types complete
□ Storybook story written
□ Unit tests pass
□ Accessibility audit passed
□ Responsive design works
□ Performance acceptable
□ Documentation complete
```

### Check Automation

```bash
# Pre-submission checklist (automated)
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm run bundle-analyze  # Check size

# Manual checks
checklist-cli review  # Interactive checklist
```

---

## APPENDIX: QUICK REFERENCE

### Emergency Contacts
| Issue | Contact | Method |
|-------|---------|--------|
| Critical system failure | Foreman | Direct ping |
| Security incident | Foreman | Direct ping |
| TL unavailable | Foreman + Backup TL | Escalation channel |
| Build system down | Infrastructure lead | #build-support |

### Decision Matrix
| Situation | Authority | Timeline |
|-----------|-----------|----------|
| Task reassignment within team | TL | Immediate |
| Timeline adjustment ±1 day | TL | Immediate |
| Cross-team dependency | TLs coordinate | 4 hours |
| Scope change | Foreman | 8 hours |
| Architecture change | Foreman | 24 hours |
| Emergency hotfix | TL | Immediate |

### Abbreviations
- **TL:** Team Leader
- **JLB:** Job Listing Board
- **FRP:** Failure Response Protocol
- **SOP:** Standard Operating Procedure
- **DCP:** Deliverable Check Protocol
- **SLA:** Service Level Agreement

---

*This operational framework is mandatory reading for all agents and team leaders.*  
*Version controlled — check for updates daily.*
