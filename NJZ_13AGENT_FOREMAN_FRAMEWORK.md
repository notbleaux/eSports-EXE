[Ver009.000]

# NJZ ¿!? 13-AGENT FOREMAN FRAMEWORK v5.0
## Comprehensive Orchestration Protocol

**Date:** March 5, 2026  
**Execution Mode:** Option 3 → Option 2 (Review First, Then Deploy)  
**Total Agents:** 13 (Rotating Sets)  
**Rotation System:** Agent 13 → Set 1 (Cyclic Handoff)

---

## PART 1: REPOSITORY AUDIT SUMMARY

### Current State Analysis

| Metric | Value | Status |
|--------|-------|--------|
| **Total Size** | 431 MB | ⚠️ Large |
| **Website** | 412 MB | ⚠️ Needs cleanup |
| **Shared** | 2.1 MB | ✅ Lean |
| **Commits** | 12 | ✅ Active |
| **Active Sub-Agents** | 5 running | 🟡 In Progress |
| **Completed** | 1 (Design System) | ✅ Ready |

### Existing Assets

**Hubs (Legacy → New Mapping):**
```
hub1-satorxrotas/ → hub1-sator/ (creating)
hub2-esports-exe/ → hub2-rotas/ (creating)
hub3-dashboard/   → hub3-information/ (creating)
hub4-directory/   → hub4-games/ (creating)
main-portal/      → njz-central/ (creating)
```

**Infrastructure:**
- ✅ Pipeline Coordinator (FastAPI + Workers)
- ✅ Design System (842 lines CSS)
- ✅ Data Extraction Layer (CS2 + Valorant scrapers)
- ✅ SATOR Square Visualization (TypeScript/React layers)
- ⚠️ Missing: Integration layer between hubs

### Suitability Assessment

| Component | Ready | Requires Work | Blockers |
|-----------|-------|---------------|----------|
| Design System | ✅ Complete | — | None |
| Backend API | ✅ 85% | Firewall middleware | None |
| Hub 1 (SATOR) | 🟡 30% | Orbital rings UI | Design System |
| Hub 2 (ROTAS) | 🟡 20% | Ellipse layers | Design System |
| Hub 3 (Info) | 🟡 25% | 25-zone grid | Design System |
| Hub 4 (Games) | 🟡 25% | Torus flow | Design System |
| NJZ Central | 🟡 10% | Main portal | Design System |
| Integration | ❌ 0% | Hub-to-hub routing | All Hubs |

---

## PART 2: 13-AGENT STRUCTURE

### Agent Sets (Rotating)

```
SET A: Foundation (3 agents)
├── AGENT 01: Design System Auditor
├── AGENT 02: Architecture Reviewer
└── AGENT 03: Repository Organizer

SET B: Hub 1-2 Core (3 agents)
├── AGENT 04: SATOR Hub Builder
├── AGENT 05: ROTAS Hub Builder
└── AGENT 06: Hub Integration Layer

SET C: Hub 3-4 Core (3 agents)
├── AGENT 07: Information Hub Builder
├── AGENT 08: Games Hub Builder
└── AGENT 09: User Flow Optimizer

SET D: Integration & Polish (3 agents)
├── AGENT 10: NJZ Central Portal
├── AGENT 11: Cross-Hub Router
└── AGENT 12: Performance Optimizer

SET E: Master Review (1 agent)
└── AGENT 13: Final Review & Deploy
     ↓ (Rotates to become AGENT 01 in next cycle)
```

### Rotation Protocol

```
Cycle 1: SET A → SET B → SET C → SET D → SET E (AGENT 13 completes)
Cycle 2: AGENT 13 → AGENT 01 (new cycle)
         SET A (revised) → SET B (revised) → ...
```

**Handoff Requirements:**
- AGENT 03 → AGENT 04: Clean repository state
- AGENT 06 → AGENT 07: Hub 1-2 integration verified
- AGENT 09 → AGENT 10: Hub 3-4 integration verified
- AGENT 12 → AGENT 13: All systems ready for review
- AGENT 13 → AGENT 01 (next cycle): Deployed state + issues log

---

## PART 3: TOKEN BUDGET ALLOCATION

### Per-Agent Budget Matrix

| Agent | Set | Task Complexity | Token Budget | Timeout | Priority |
|-------|-----|-----------------|--------------|---------|----------|
| AGENT 01 | A | Medium | 25K in / 10K out | 8 min | P1 |
| AGENT 02 | A | High | 35K in / 15K out | 10 min | P1 |
| AGENT 03 | A | Medium | 25K in / 10K out | 8 min | P1 |
| AGENT 04 | B | High | 40K in / 15K out | 12 min | P2 |
| AGENT 05 | B | High | 40K in / 15K out | 12 min | P2 |
| AGENT 06 | B | Very High | 50K in / 20K out | 15 min | P2 |
| AGENT 07 | C | High | 40K in / 15K out | 12 min | P3 |
| AGENT 08 | C | High | 40K in / 15K out | 12 min | P3 |
| AGENT 09 | C | Medium | 30K in / 12K out | 10 min | P3 |
| AGENT 10 | D | Very High | 45K in / 18K out | 15 min | P4 |
| AGENT 11 | D | High | 40K in / 15K out | 12 min | P4 |
| AGENT 12 | D | Medium | 30K in / 12K out | 10 min | P4 |
| AGENT 13 | E | Very High | 35K in / 15K out | 15 min | P5 |

### Total Campaign Budget

```
Input Tokens:  430,000
Output Tokens: 177,000
Total:         607,000 tokens
Duration:      ~90 minutes (with parallel execution)
```

---

## PART 4: AGENT DECISION FRAMEWORK

### 4.1 Logic Trees

#### Decision Tree A: Component Creation
```
START: Create Component
    │
    ├── Check Design System
    │   ├── ✅ Exists → Use njz-design-system.css
    │   └── ❌ Missing → Halt, request AGENT 01
    │
    ├── Check Dependencies
    │   ├── All available → Proceed
    │   └── Missing dep → Log blocker, escalate to Foreman
    │
    ├── Implement Component
    │   ├── Success → Write file, commit
    │   └── Failure → Retry (max 3), then escalate
    │
    └── Verify Output
        ├── Passes criteria → Mark complete
        └── Fails criteria → Revise, retry
```

#### Decision Tree B: Integration Check
```
START: Integrate Hubs
    │
    ├── Check Hub 1 Status
    │   ├── ✅ Complete → Continue
    │   └── 🟡/❌ Incomplete → Wait/escalate
    │
    ├── Check Hub 2 Status
    │   ├── ✅ Complete → Continue
    │   └── 🟡/❌ Incomplete → Wait/escalate
    │
    ├── Check Routing
    │   ├── All paths valid → Continue
    │   └── Broken paths → Fix or escalate
    │
    └── Test Navigation
        ├── All clicks work → Complete
        └── Broken links → Fix, retest
```

#### Decision Tree C: Performance Check
```
START: Performance Audit
    │
    ├── Run Lighthouse
    │   ├── Score ≥ 90 → ✅ Pass
    │   └── Score < 90 → Analyze
    │
    ├── Check Bundle Size
    │   ├── < 200KB → ✅ Pass
    │   └── ≥ 200KB → Optimize
    │
    ├── Check Animation FPS
    │   ├── 60fps → ✅ Pass
    │   └── < 60fps → Optimize
    │
    └── Check Accessibility
        ├── WCAG 2.1 AA → ✅ Pass
        └── Fails AA → Fix violations
```

### 4.2 Success Metrics

| Category | Metric | Threshold | Critical |
|----------|--------|-----------|----------|
| **Code** | Files Created | ≥ 80% of spec | ✅ Yes |
| **Code** | Lines Written | ≥ 500 per hub | ✅ Yes |
| **Code** | Syntax Errors | 0 | ✅ Yes |
| **Code** | Build Status | Success | ✅ Yes |
| **UI** | Responsive | Mobile/Tablet/Desktop | ✅ Yes |
| **UI** | Visual Match | ≥ 90% to spec | 🟡 No |
| **UX** | Navigation | All links work | ✅ Yes |
| **UX** | Load Time | < 3s LCP | ✅ Yes |
| **UX** | Animation | 60fps | 🟡 No |
| **Data** | Integrity Demo | Working | ✅ Yes |

### 4.3 Failure Conditions (Kill Switch Triggers)

**Immediate Halt (Kill Switch Type A):**
- Repository corruption detected
- Critical file deletion risk
- Security vulnerability introduced
- > 50% token budget exhausted with < 20% progress

**Escalation Required (Kill Switch Type B):**
- Dependency unavailable after 3 retries
- Design system incompatibility found
- Cross-agent conflict detected
- Timeout exceeded with incomplete deliverable

**Auto-Retry (Kill Switch Type C):**
- Lint error (max 3 retries)
- Build warning (max 3 retries)
- Test failure (max 3 retries)
- File write collision (wait + retry)

---

## PART 5: PHASED EXECUTION PROTOCOL

### Phase 1: Option 3 - Review & Refinement (Days 1-7)

**Objective:** Comprehensive review before deployment

```
DAY 1: Architecture Review (SET A)
├── AGENT 01: Audit existing design system
├── AGENT 02: Review NJZ architecture compliance
└── AGENT 03: Organize repository structure

DAY 2-3: Component Testing (SET B begins)
├── AGENT 04: Build SATOR with review mode
├── AGENT 05: Build ROTAS with review mode
└── AGENT 06: Integration review layer

DAY 4: Performance Audit (SET B completes)
├── AGENT 04: Performance test SATOR
├── AGENT 05: Performance test ROTAS
└── AGENT 06: Cross-hub routing test

DAY 5: Content Integration (SET C begins)
├── AGENT 07: Build Information Hub
├── AGENT 08: Build Games Hub
└── AGENT 09: User flow testing

DAY 6: Accessibility & SEO (SET C completes)
├── AGENT 07: A11y audit
├── AGENT 08: SEO optimization
└── AGENT 09: Final UX polish

DAY 7: Soft Launch (SET D + E)
├── AGENT 10: NJZ Central Portal
├── AGENT 11: Cross-hub router
├── AGENT 12: Performance optimizer
└── AGENT 13: Final review + deploy decision
```

### Phase 2: Option 2 - Staged Deployment (Weeks 2-5)

**Week 1: Foundation (SET A + B)
```
AGENT 01: ✅ Design System (COMPLETE - use existing)
AGENT 02: Architecture finalization
AGENT 03: Repository cleanup
AGENT 04: SATOR Hub production build
AGENT 05: ROTAS Hub production build
AGENT 06: Hub 1-2 integration
MILESTONE: Core data hubs live
```

**Week 2: User Hubs (SET C)
```
AGENT 07: Information Hub production
AGENT 08: Games Hub production
AGENT 09: Hub 3-4 integration + user flows
MILESTONE: All 4 hubs functional
```

**Week 3: Central Portal (SET D)
```
AGENT 10: NJZ Central Portal
AGENT 11: Cross-hub routing system
AGENT 12: Performance optimization
MILESTONE: Unified platform accessible
```

**Week 4: Integration (SET E)
```
AGENT 13: Final integration testing
AGENT 13: Backend API connection
AGENT 13: Production deployment
MILESTONE: Live NJZ Platform
```

**Week 5: Monitoring (SET E continues)
```
AGENT 13 (as AGENT 01 cycle 2): Post-deploy monitoring
AGENT 13 (as AGENT 01 cycle 2): Issue triage
AGENT 13 (as AGENT 01 cycle 2): Hotfix deployment
```

---

## PART 6: AGENT TASK SPECIFICATIONS

### SET A: Foundation (Review Phase)

#### AGENT 01: Design System Auditor
```yaml
task: Audit njz-design-system.css for completeness
inputs:
  - website/njz-design-system.css
  - NJZ_ARCHITECTURE_REVISION.md
outputs:
  - AUDIT_REPORT_DESIGN_SYSTEM.md
  - Missing components list
deliverables:
  - Verify all CSS variables present
  - Check component coverage
  - Identify gaps for NJZ requirements
  - Recommend additions
success_criteria:
  - 100% of required CSS variables exist
  - All hub-specific styles defined
  - Animation utilities complete
kill_switch:
  - timeout: 8 minutes
  - token_limit: 35K
  - halt_if: > 30% coverage gap
```

#### AGENT 02: Architecture Reviewer
```yaml
task: Review codebase against NJZ architecture
inputs:
  - website/ directory
  - shared/ directory
  - NJZ_ARCHITECTURE_REVISION.md
outputs:
  - ARCHITECTURE_COMPLIANCE_REPORT.md
  - Refactoring recommendations
deliverables:
  - Map existing files to NJZ structure
  - Identify legacy code to archive
  - Verify twin-file architecture support
  - Check hub separation compliance
success_criteria:
  - Clear migration path documented
  - No architectural blockers identified
  - Repository structure validated
kill_switch:
  - timeout: 10 minutes
  - token_limit: 50K
  - halt_if: critical architecture conflict
```

#### AGENT 03: Repository Organizer
```yaml
task: Clean and organize repository structure
inputs:
  - Current website/ structure
  - ARCHITECTURE_COMPLIANCE_REPORT.md
outputs:
  - Clean website/ structure
  - LEGACY_ARCHIVE.md
deliverables:
  - Archive legacy files to /archive/
  - Create hub directory structure
  - Move assets to appropriate hubs
  - Update .gitignore for archives
success_criteria:
  - All legacy files archived
  - New structure matches NJZ spec
  - No broken references
kill_switch:
  - timeout: 8 minutes
  - token_limit: 35K
  - halt_if: data loss risk detected
```

### SET B: Hub 1-2 Core

#### AGENT 04: SATOR Hub Builder
```yaml
task: Build complete SATOR Hub (Hub 1)
inputs:
  - website/njz-design-system.css
  - NJZ_ARCHITECTURE_REVISION.md
  - SATOR specification
outputs:
  - website/hub1-sator/index.html
  - website/hub1-sator/styles.css
  - website/hub1-sator/app.js
deliverables:
  - Concentric ring visualization
  - RAWS file browser
  - Integrity dashboard
  - Data ingress streams
  - Mobile responsive
success_criteria:
  - Rings animate at 60fps
  - All UI elements styled
  - Links to NJZ Central
kill_switch:
  - timeout: 12 minutes
  - token_limit: 55K
  - halt_if: design system incompatible
```

#### AGENT 05: ROTAS Hub Builder
```yaml
task: Build complete ROTAS Hub (Hub 2)
inputs:
  - website/njz-design-system.css
  - NJZ_ARCHITECTURE_REVISION.md
  - ROTAS specification
outputs:
  - website/hub2-rotas/ (Vite project)
deliverables:
  - Ellipse layer visualization
  - Probability engines
  - Formula library
  - Layer toggle system
  - Mobile responsive
success_criteria:
  - Ellipses render correctly
  - Layer toggles functional
  - All animations smooth
kill_switch:
  - timeout: 12 minutes
  - token_limit: 55K
  - halt_if: build fails after 3 retries
```

#### AGENT 06: Hub Integration Layer
```yaml
task: Integrate SATOR and ROTAS hubs
inputs:
  - website/hub1-sator/
  - website/hub2-rotas/
  - Design system
outputs:
  - Cross-hub navigation
  - Shared components library
  - Integration test results
deliverables:
  - Hub-to-hub routing
  - Twin-file visualizer connection
  - Shared header component
  - Navigation consistency
success_criteria:
  - All inter-hub links work
  - Visual consistency maintained
  - No console errors
kill_switch:
  - timeout: 15 minutes
  - token_limit: 70K
  - halt_if: circular dependency detected
```

### SET C: Hub 3-4 Core

#### AGENT 07: Information Hub Builder
```yaml
task: Build Information Hub (Hub 3)
inputs:
  - website/njz-design-system.css
  - NJZ specification
outputs:
  - website/hub3-information/ (Vite project)
deliverables:
  - 25-zone grid navigation
  - Directory search (Cmd+K)
  - Membership tiers
  - Compression panel
success_criteria:
  - All 25 zones render
  - Search functional
  - Tier comparison clear
kill_switch:
  - timeout: 12 minutes
  - token_limit: 55K
  - halt_if: grid breaks on mobile
```

#### AGENT 08: Games Hub Builder
```yaml
task: Build Games Hub (Hub 4)
inputs:
  - website/njz-design-system.css
  - NJZ specification
outputs:
  - website/hub4-games/ (Next.js project)
deliverables:
  - Torus flow visualization
  - Download portal
  - Knowledge base
  - Live platform CTA
success_criteria:
  - Torus animation smooth
  - Download cards styled
  - Live CTA prominent
kill_switch:
  - timeout: 12 minutes
  - token_limit: 55K
  - halt_if: Next.js build fails
```

#### AGENT 09: User Flow Optimizer
```yaml
task: Optimize Hub 3-4 user flows
inputs:
  - website/hub3-information/
  - website/hub4-games/
outputs:
  - UX optimization report
  - Flow improvements
deliverables:
  - User journey mapping
  - CTA optimization
  - Loading state improvements
  - Error handling
success_criteria:
  - < 3 clicks to any feature
  - Clear user guidance
  - No dead ends
kill_switch:
  - timeout: 10 minutes
  - token_limit: 42K
  - halt_if: flow breaks core functionality
```

### SET D: Integration & Portal

#### AGENT 10: NJZ Central Portal
```yaml
task: Build main NJZ Central portal
inputs:
  - All 4 hub implementations
  - website/njz-design-system.css
outputs:
  - website/njz-central/index.html
  - Main navigation system
deliverables:
  - Hero with twin-file preview
  - 4-hub navigation grid
  - Membership tier preview
  - Footer with links
success_criteria:
  - All hub links work
  - Mobile responsive
  - < 2s load time
kill_switch:
  - timeout: 15 minutes
  - token_limit: 63K
  - halt_if: any hub link broken
```

#### AGENT 11: Cross-Hub Router
```yaml
task: Implement cross-hub routing system
inputs:
  - All hub directories
outputs:
  - Centralized routing config
  - Navigation components
deliverables:
  - URL routing table
  - Breadcrumb system
  - Deep linking support
  - 404 handling
success_criteria:
  - All routes resolve
  - Back navigation works
  - Direct URLs functional
kill_switch:
  - timeout: 12 minutes
  - token_limit: 55K
  - halt_if: routing loop detected
```

#### AGENT 12: Performance Optimizer
```yaml
task: Optimize platform performance
inputs:
  - All hub implementations
outputs:
  - Performance audit report
  - Optimized assets
deliverables:
  - Lighthouse score ≥ 90
  - Bundle optimization
  - Image optimization
  - Code splitting
success_criteria:
  - Lighthouse: 90+ all categories
  - < 200KB initial bundle
  - 60fps animations
kill_switch:
  - timeout: 10 minutes
  - token_limit: 42K
  - halt_if: optimization breaks functionality
```

### SET E: Master Review

#### AGENT 13: Final Review & Deploy
```yaml
task: Final review and deployment decision
inputs:
  - All hub implementations
  - Performance reports
  - Test results
outputs:
  - FINAL_REVIEW_REPORT.md
  - Deploy/No-Deploy decision
deliverables:
  - Comprehensive testing
  - Accessibility audit (WCAG 2.1 AA)
  - Security review
  - Deployment configuration
  - Go/No-Go recommendation
success_criteria:
  - All blockers resolved
  - All success metrics met
  - Stakeholder approval
kill_switch:
  - timeout: 15 minutes
  - token_limit: 50K
  - halt_if: critical blocker unresolved

# Upon completion, becomes AGENT 01 for Cycle 2
rotation:
  next_role: AGENT_01_CYCLE_2
  handoff_context: Deployed state + issues log
```

---

## PART 7: EXECUTION SCHEDULE

### Immediate Execution (Now)

**Current Active Agents (5):**
- AGENT 2 (njz-central): Running 3m
- AGENT 3 (sator-hub): Running 3m
- AGENT 4 (rotas-hub): Running 3m
- AGENT 5 (info-hub): Running 3m
- AGENT 6 (games-hub): Running 3m

**Decision:** Let these complete, then integrate into 13-agent framework.

### Recommended Sequence

```
PHASE 1: OPTION 3 - REVIEW (Start after current agents complete)

Hour 0-1: SET A (Foundation Review)
├── AGENT 01: Design System Audit [PARALLEL]
├── AGENT 02: Architecture Review [PARALLEL]
└── AGENT 03: Repository Organization [DEPENDS: 01,02]

Hour 1-3: SET B (Hub 1-2 Review/Build)
├── AGENT 04: SATOR Hub [PARALLEL]
├── AGENT 05: ROTAS Hub [PARALLEL]
└── AGENT 06: Hub 1-2 Integration [DEPENDS: 04,05]

Hour 3-5: SET C (Hub 3-4 Review/Build)
├── AGENT 07: Information Hub [PARALLEL]
├── AGENT 08: Games Hub [PARALLEL]
└── AGENT 09: User Flow Optimization [DEPENDS: 07,08]

Hour 5-7: SET D (Portal & Integration)
├── AGENT 10: NJZ Central [DEPENDS: 06]
├── AGENT 11: Cross-Hub Router [PARALLEL]
└── AGENT 12: Performance Optimization [DEPENDS: 09,10,11]

Hour 7-8: SET E (Final Review)
└── AGENT 13: Master Review [DEPENDS: 12]

PHASE 2: OPTION 2 - DEPLOY (Weeks 2-5)
[Scheduled after Phase 1 approval]
```

---

## PART 8: MONITORING & CONTROL

### Real-Time Metrics Dashboard

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Active Agents | 5 | ≤ 6 | 🟡 |
| Completed Agents | 1 | — | — |
| Token Usage | ~50K | < 607K | 🟢 |
| Runtime | 3m | < 90m | 🟢 |
| Success Rate | 100% | > 80% | 🟢 |

### Foreman Override Triggers

**Auto-Approve:**
- Agent completes within budget
- All success criteria met
- No error logs

**Requires Review:**
- Agent exceeds 80% token budget
- Partial completion with workarounds
- Non-critical warnings

**Immediate Intervention:**
- Agent exceeds timeout
- Critical failure (kill switch A)
- Cross-agent conflict
- Budget overrun

---

## APPENDIX: AGENT HANDOFF TEMPLATES

### Template A: Completion Handoff
```
AGENT [N] COMPLETION REPORT
===========================
Status: ✅ COMPLETE / ⚠️ PARTIAL / ❌ FAILED
Runtime: [X] minutes
Tokens: [X]K in / [X]K out

Deliverables:
- [File 1] ✅
- [File 2] ✅

Blockers:
- None / [Description]

Next Agent Requirements:
- [AGENT N+1] needs: [specific inputs]

Notes:
- [Context for next agent]
```

### Template B: Rotation Handoff (AGENT 13 → AGENT 01)
```
CYCLE HANDOFF: AGENT 13 → AGENT 01 (CYCLE 2)
=============================================
Cycle 1 Status: [COMPLETE / PARTIAL / FAILED]

Deployed State:
- URL: [deployment URL]
- Version: [git hash]
- Status: [live / staging / failed]

Open Issues:
1. [Issue description] - Priority: [P1/P2/P3]

Recommendations for Cycle 2:
- [Improvement 1]
- [Improvement 2]
```

---

*Framework Version: 5.0*  
*Ready for Execution: YES*  
*Next Action: Await current 5 agents completion, then spawn SET A (Agents 1-3)*