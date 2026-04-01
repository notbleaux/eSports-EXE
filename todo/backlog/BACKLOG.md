[Ver001.001]

# Todo Backlog

**Last Updated:** 2026-04-01  
**Total Items:** 12  
**Source:** Plan Extraction Integration Report  
**Next Grooming:** 2026-04-08  

---

## Overview

This backlog contains items extracted from the 60+ plan archaeology exercise. Each item represents a valuable incomplete aspect that should be integrated into active development.

### Extraction Sources
- `.agents/PHASE_3-6_FINAL_IMPLEMENTATION_PLAN.md`
- `docs/FLUID_UI_MASTER_PLAN.md`
- `docs/TREE_HUBS_MASTER_PLAN.md`
- `docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md`

### Integration Status
| Priority | Items | Integrated | Pending |
|----------|-------|------------|---------|
| P0: Critical | 2 | 0 | 2 |
| P1: High | 3 | 0 | 3 |
| P2: Medium | 3 | 0 | 3 |
| P3: Low | 4 | 0 | 4 |
| **Total** | **12** | **0** | **12** |

---

## P0: Critical (Must Implement)

These items are critical for project success and should be prioritized immediately.

### TD-P3-001: Implement GameNodeIDFrame Component
**Phase:** P3 (Frontend Architecture)  
**Priority:** P0  
**Added:** 2026-04-01  
**Source:** EX-UI-001 (Phase 3-6 Plan)  
**Status:** ☐ Ready

**Description:**
Implement the GameNodeIDFrame component for TENET navigation layer. This is a 2×2 CSS Grid component that serves as the primary navigation interface for game selection.

**Specifications:**
```typescript
interface Quarter {
  id: 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';
  name: string;
  description: string;
  route: string;
  color: string;
  icon: React.ReactNode;
}
```

**Features Required:**
- [ ] 2×2 CSS Grid layout
- [ ] Animated transitions (300ms ease-out)
- [ ] Hover effects (scale-105, shadow increase)
- [ ] Keyboard navigation (Tab, Enter)
- [ ] ARIA labels and accessibility
- [ ] Responsive design (1-col mobile, 2×2 desktop)

**Acceptance Criteria:**
- Component renders correctly in all viewports
- Animations smooth at 60fps
- Keyboard navigation fully functional
- Screen reader compatible
- Color-coded per quarter

**Estimation:** 8 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-UI-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P3](../phase/P3-alignment.md)
- Design: [FLUID_UI_MASTER_PLAN](../../docs/archive/FLUID_UI_MASTER_PLAN.md)

---

### TD-P4-001: Setup Path A/B Data Pipeline
**Phase:** P4 (Data Pipeline)  
**Priority:** P0  
**Added:** 2026-04-01  
**Source:** EX-DATA-001 (Phase 3-6 Plan)  
**Status:** ☐ Ready

**Description:**
Implement the Lambda Architecture Pattern with Path A (Live) and Path B (Legacy) data flows for video/livestream systems.

**Architecture:**
```yaml
Path A (Live):
  Flow: Pandascore webhook → Redis Streams → WebSocket → Frontend
  Latency: < 500ms
  Use Case: Real-time match updates, live scores
  
Path B (Legacy):
  Flow: All sources → TeneT verification → PostgreSQL → API
  Features: Confidence scoring per record
  Use Case: Authoritative data, historical analysis
```

**Implementation Requirements:**
- [ ] Redis Streams configuration
- [ ] WebSocket service for Path A
- [ ] TeneT verification pipeline
- [ ] PostgreSQL schema for Path B
- [ ] API endpoints for legacy data
- [ ] Integration tests

**Acceptance Criteria:**
- Path A latency < 500ms in production
- Path B data confidence scoring accurate
- Both paths can operate simultaneously
- Failover mechanisms in place

**Estimation:** 16 hours  
**Dependencies:** TD-P3-001 (architecture context)  
**Blocked by:** None

**Links:**
- Extraction: [EX-DATA-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P4](../phase/P4-alignment.md)
- System Design: [VIDEO_RECORDING_SYSTEM](../../docs/architecture/VIDEO_RECORDING_SYSTEM.md)

---

## P1: High (Should Implement)

These items significantly improve the project and should be done after P0 items.

### TD-P3-002: Integrate Fluid UI Patterns
**Phase:** P3 (Frontend Architecture)  
**Priority:** P1  
**Added:** 2026-04-01  
**Source:** EX-UI-002 (Fluid UI Plan)  
**Status:** ☐ Ready

**Description:**
Integrate Fluid UI patterns including Viscous SFX, glassmorphism, and container queries into the design system.

**Patterns to Implement:**
```yaml
Fluid:
  - Container queries for responsive components
  - clamp() for fluid typography
  - Viewport units (vw/vh)
  
Viscous SFX:
  - Overshoot + settle easing: cubic-bezier(0.4, 0.0, 0.2, 1.4)
  - Custom easing functions
  
Glassmorphism:
  - Backdrop blur (12px)
  - Translucent layers
  - Depth effects
```

**Tasks:**
- [ ] Add fluid tokens to design system
- [ ] Implement viscous easing functions
- [ ] Create glassmorphism component variants
- [ ] Add prefers-reduced-motion support
- [ ] Test across browsers

**Estimation:** 12 hours  
**Dependencies:** TD-P3-001  
**Blocked by:** None

**Links:**
- Extraction: [EX-UI-002](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P3](../phase/P3-alignment.md)

---

### TD-P3-003: Implement Accessibility Checklist
**Phase:** P3 (Frontend Architecture)  
**Priority:** P1  
**Added:** 2026-04-01  
**Source:** EX-A11Y-001 (Multiple Plans)  
**Status:** ☐ Ready

**Description:**
Implement comprehensive accessibility checklist across all hubs. Target: WCAG 2.1 AA compliance with Lighthouse score ≥ 95.

**Requirements:**
```yaml
Visual:
  - Contrast ratios > 4.5:1
  - Focus indicators visible
  - Color not sole information carrier
  
Navigation:
  - Keyboard: Tab, Enter, Escape, Arrow keys
  - Skip links for main content
  - Logical tab order
  
Semantic:
  - ARIA labels on interactive elements
  - Role attributes (button, tab, navigation)
  - aria-selected for current state
```

**Tasks:**
- [ ] Audit current accessibility status
- [ ] Fix contrast ratio issues
- [ ] Add keyboard navigation
- [ ] Implement ARIA labels
- [ ] Test with screen readers (NVDA/VoiceOver)
- [ ] Add accessibility section to all skills

**Estimation:** 10 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-A11Y-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P3](../phase/P3-alignment.md)

---

### TD-P1-001: Expand Testing Pyramid Coverage
**Phase:** P1 (Critical Skills)  
**Priority:** P1  
**Added:** 2026-04-01  
**Source:** EX-TEST-001 (Multiple Plans)  
**Status:** ☐ Ready

**Description:**
Expand testing strategy to include all layers of the testing pyramid.

**Testing Layers:**
```yaml
Unit (Vitest):
  - Target: 80% coverage
  - Components, hooks, utils
  
Integration (pytest):
  - Target: 70% coverage
  - API, database, services
  
E2E (Playwright):
  - Target: 40+ tests
  - User flows, critical paths
  
Performance (k6):
  - Load: 1000+ concurrent users
  - Stress testing
  
Accessibility (axe-core):
  - Automated a11y checks
  - Lighthouse CI integration
```

**Tasks:**
- [ ] Expand sator-testing skill with all layers
- [ ] Setup k6 for load testing
- [ ] Configure axe-core for accessibility
- [ ] Add WebSocket concurrent connection tests
- [ ] Document testing standards

**Estimation:** 8 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-TEST-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P1](../phase/P1-alignment.md)
- Skill: [sator-testing](../../.agents/skills/sator-testing/SKILL.md)

---

## P2: Medium (Nice to Have)

These items add value but can be deferred if needed.

### TD-P3-004: Setup SATOR Visualization Features
**Phase:** P3 (Frontend Architecture)  
**Priority:** P2  
**Added:** 2026-04-01  
**Source:** EX-VIZ-001 (Tree Hubs Plan)  
**Status:** ☐ Ready

**Description:**
Implement SATOR visualization features including stats engine, heatmaps, and lens grafting.

**Features:**
```yaml
Core:
  - Stats Engine (Recharts + D3)
  - Heatmaps (Three.js/WebGL)
  - Ratings (13-19 scale)
  
Advanced:
  - Auto-Export (PNG/SVG)
  - Lens Grafting (SATOR/ROTAS link)
  - NJZ Metrics (Flower bloom animations)
  
QoL:
  - Keyboard shortcuts (1-9 panel nav)
  - Search/filter with autocomplete
  - Export to PNG/PDF
```

**Estimation:** 16 hours  
**Dependencies:** TD-P3-001, TD-P3-002  
**Blocked by:** None

**Links:**
- Extraction: [EX-VIZ-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P3](../phase/P3-alignment.md)

---

### TD-P3-005: Implement Tri-Split Lensing
**Phase:** P3 (Frontend Architecture)  
**Priority:** P2  
**Added:** 2026-04-01  
**Source:** EX-UI-003 (Tree Hubs Plan)  
**Status:** ☐ Ready

**Description:**
Implement AREPO tri-split lensing with drag-graft functionality and modular panel system.

**Modality Modes:**
```yaml
General: Overview dashboard
Focused: Tri-view split (3 panels)
Game-Focus: Expandable sub-focus
```

**Features:**
- Drag-Graft (React DnD)
- Zoom/Sync (Zustand)
- Port Slots (TanStack Virtual)
- View state persistence
- One-click layout presets

**Estimation:** 12 hours  
**Dependencies:** TD-P3-001  
**Blocked by:** None

**Links:**
- Extraction: [EX-UI-003](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P3](../phase/P3-alignment.md)

---

### TD-P2-001: Archive Superseded Plans
**Phase:** P2 (System Expansions)  
**Priority:** P2  
**Added:** 2026-04-01  
**Source:** Extraction Report Recommendations  
**Status:** ☐ Ready

**Description:**
Archive superseded plans that have been fully extracted and integrated.

**Plans to Archive:**
- `.agents/PHASE_3-6_FINAL_IMPLEMENTATION_PLAN.md`
- `docs/FLUID_UI_MASTER_PLAN.md`
- `docs/TREE_HUBS_MASTER_PLAN.md`
- `docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md`
- `docs/MASTER_IMPLEMENTATION_PLAN_PHASES.md`
- Various `PHASE_2_*.md` duplicates

**Tasks:**
- [ ] Verify all extractions complete
- [ ] Move files to docs/archive/
- [ ] Update references in active plans
- [ ] Add archive index

**Estimation:** 4 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction Report: [PLAN_EXTRACTION_INTEGRATION_REPORT](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P2](../phase/P2-alignment.md)

---

## P3: Low (Stretch Goals)

These items are nice to have but not critical for success.

### TD-P5-001: Design GM Mode Progression System
**Phase:** P5 (Review/Gamification)  
**Priority:** P3  
**Added:** 2026-04-01  
**Source:** EX-GAME-001 (Tree Hubs Plan)  
**Status:** ☐ Ready

**Description:**
Design GM Mode progression system with 6 levels from SCOUT to OWNER.

**Progression Levels:**
```
Level 1: SCOUT → Player discovery, basic stats
Level 2: ANALYST → Advanced metrics, heatmap analysis
Level 3: COACH → Team composition, tactics
Level 4: MANAGER → Roster decisions, schedules
Level 5: DIRECTOR → Strategic planning, org growth
Level 6: OWNER → Financial control, expansion
```

**Features:**
- Godot embed + HTML5 Canvas
- Difficulty toggles (Casual/Pro/Expert)
- Auto-save progression
- Voice selection (PlatChat-style)

**Estimation:** 20 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-GAME-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P5](../phase/P5-alignment.md)

---

### TD-P1-002: Add Security Patterns to sator-auth
**Phase:** P1 (Critical Skills)  
**Priority:** P3  
**Added:** 2026-04-01  
**Source:** EX-SEC-001 (CRITIQUE_REMEDIATION)  
**Status:** ☐ Ready

**Description:**
Add security patterns section to sator-auth skill.

**Patterns:**
- JWT with refresh token rotation
- Rate limiting per endpoint
- Input validation with Zod/Pydantic
- SQL injection prevention
- XSS prevention
- CSRF tokens
- Security headers (HSTS, CSP)

**Estimation:** 4 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-SEC-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P1](../phase/P1-alignment.md)
- Skill: [sator-auth](../../.agents/skills/sator-auth/SKILL.md)

---

### TD-P1-003: Add CI/CD Patterns to sator-cicd
**Phase:** P1 (Critical Skills)  
**Priority:** P3  
**Added:** 2026-04-01  
**Source:** EX-CICD-001 (CRITIQUE_REMEDIATION)  
**Status:** ☐ Ready

**Description:**
Add CI/CD pipeline patterns section to sator-cicd skill.

**Patterns:**
- GitHub Actions with matrix builds
- Automated testing on PR
- Preview deployments (Vercel/Render)
- Staging → Production promotion
- Automated rollback on failure
- Secrets management
- Dependency vulnerability scanning

**Estimation:** 4 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-CICD-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P1](../phase/P1-alignment.md)
- Skill: [sator-cicd](../../.agents/skills/sator-cicd/SKILL.md)

---

### TD-P1-004: Add Doc Templates to sator-documentation
**Phase:** P1 (Critical Skills)  
**Priority:** P3  
**Added:** 2026-04-01  
**Source:** EX-DOC-001 (Multiple Plans)  
**Status:** ☐ Ready

**Description:**
Add documentation templates section to sator-documentation skill.

**Templates:**
- API endpoint documentation (OpenAPI/Swagger)
- Component storybook stories
- Architecture Decision Records (ADRs)
- Runbooks for common operations
- Troubleshooting guides
- Onboarding documentation

**Estimation:** 4 hours  
**Dependencies:** None  
**Blocked by:** None

**Links:**
- Extraction: [EX-DOC-001](../../docs/verification/PLAN_EXTRACTION_INTEGRATION_REPORT.md)
- Phase: [PL-P1](../phase/P1-alignment.md)
- Skill: [sator-documentation](../../.agents/skills/sator-documentation/SKILL.md)

---

## Backlog Grooming

### Last Groomed
**Date:** 2026-04-01  
**Participants:** @dev  

**Actions Taken:**
- Integrated 12 items from plan extraction report
- Assigned priorities based on extraction recommendations
- Mapped to appropriate phases
- Added effort estimates
- Verified no duplicates

### Next Grooming
**Date:** 2026-04-08  
**Focus Areas:**
- Review P0 item progress
- Reprioritize based on Phase 3 readiness
- Add new items from ongoing work
- Archive completed items

### Grooming Notes
- All items from plan extraction integrated
- Priorities aligned with phase planning
- Dependencies mapped in phase alignment docs
- Extraction IDs preserved for traceability

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Items | 12 |
| P0 (Critical) | 2 (17%) |
| P1 (High) | 3 (25%) |
| P2 (Medium) | 3 (25%) |
| P3 (Low) | 4 (33%) |
| Total Effort | 108 hours |

---

*Backlog v1.1 - Extracted from Plan Archaeology*
