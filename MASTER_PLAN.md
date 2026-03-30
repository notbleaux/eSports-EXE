# MASTER PLAN - eSports-EXE Stabilization & Enhancement
**Date:** 2026-03-31
**Current Status:** 2,142 TypeScript errors | UI Migration Pending | Review Protocol Active

## Overview
Three parallel workstreams to complete today:
1. **TypeScript Error Reduction** (Target: <100 errors)
2. **Valorant UI Migration** (Design system + Landing page)
3. **Minimap/Archival Review** (13-day protocol preparation)

---

## WORKSTREAM 1: TypeScript Error Reduction
**Current:** 2,142 errors | **Target:** <100 errors

### Active Cron Jobs (Every 30 min)
| Job ID | Name | Focus Area | Status |
|--------|------|------------|--------|
| f160f41f | ts-pass-1-specmap | SpecMapViewer types | Running |
| 0fb3f12b | ts-pass-2-threejs | Three.js/D3 types | Running |
| 40191bc7 | ts-pass-3-symbols | Missing exports | Running |

### Error Breakdown
| Code | Count | Priority | Strategy |
|------|-------|----------|----------|
| TS2339 | 685 | P0 | Fix property definitions |
| TS2322 | 192 | P1 | Type compatibility fixes |
| TS2694 | 176 | P1 | Namespace/module fixes |
| TS2304 | 106 | P2 | Missing symbol definitions |
| TS2614 | 94 | P2 | Export fixes |

### Immediate Actions (Next 2 Hours)
1. Complete SpecMapViewer type extensions (GameData, events, Lens)
2. Add missing @types/three resolution
3. Fix hub-4-opera and hub-5-tenet color references
4. Create barrel exports for missing modules

---

## WORKSTREAM 2: Valorant UI Migration
**Stack:** React 18 + Vite + Tailwind CSS

### Phase 1: Design Tokens (30 min)
Create `src/design/tokens.ts`:
- Colors: Dark base (#050817), Neon accents (red #F43F5E, cyan #22D3EE)
- Typography: Wide headings, uppercase labels
- Spacing: 4px grid system
- Radius: Sharp corners (4-10px)

### Phase 2: UI Primitives (1 hour)
Replace existing components:
| Component | Current | New |
|-----------|---------|-----|
| Button | Basic | Valorant-style with accent edge |
| GlassCard | Transparent | Panel with sharp borders |
| Toggle | Standard | Pill track + accent thumb |
| Checkbox | Default | Sharp gadget style |

### Phase 3: Landing Page (1 hour)
Structure:
- Dark background (#050817)
- Top nav with logo + tracking
- Hero: Left title/CTA, Right status rail
- Feature grid: Map Control, Intel Feeds, ML Ops
- Panel-based layout with accent borders

### File Targets
```
src/design/tokens.ts (NEW)
src/components/ui/Button.tsx (REPLACE)
src/components/ui/Panel.tsx (REPLACE GlassCard)
src/components/ui/Toggle.tsx (REPLACE)
src/components/ui/Checkbox.tsx (REPLACE)
src/pages/LandingPage.tsx (NEW)
```

---

## WORKSTREAM 3: Minimap/Archival Review Protocol
**13-Day Schedule Preparation**

### Deliverables Framework
| Category | ID | Description |
|----------|-----|-------------|
| Minimap | MM-1 | Functional parity |
| Minimap | MM-2 | Performance baseline |
| Minimap | MM-3 | UX clarity |
| Minimap | MM-4 | Stability |
| Minimap | MM-5 | Test coverage |
| Archival | AR-1 | Data integrity |
| Archival | AR-2 | Search/indexing |
| Archival | AR-3 | Policy compliance |
| Archival | AR-4 | Reliability |
| Archival | AR-5 | Documentation |
| Integration | IN-1 | Minimap↔Archival |
| Integration | IN-2 | E2E testing |
| Integration | IN-3 | Observability |
| Plan | PLAN-1 | Critical issues resolved |
| Plan | PLAN-2 | Review cycles complete |
| Plan | PLAN-3 | Sign-off |

### Review Pattern: 2/3/5 +1,2,3
Each review pass produces:
- 2 formal review passes (problem-focused, improvement-focused)
- 3 main recommendations with 5 sub-bullets each
- +1 added feature, +2 refinements, +3 removals

### Diagram Requirements
1. **Flowchart:** System architecture (minimap→recording→archive→playback)
2. **Sequence Diagram:** Recording + archival interactions
3. **Class Diagram:** Domain models (RecordingSession, ArchiveEntry, etc.)

---

## SUB-AGENT COORDINATION

### Agent 1: TypeScript Specialist
**Task:** Continue TS error reduction
**Focus:** TS2339 property fixes, SpecMapViewer types
**Deliverable:** <500 errors by EOD

### Agent 2: UI Migration Specialist
**Task:** Valorant design system + landing page
**Focus:** Create tokens, primitives, landing layout
**Deliverable:** Working landing page with new design

### Agent 3: System Review Specialist
**Task:** Minimap/archival review preparation
**Focus:** Create diagrams, define test protocols
**Deliverable:** Review framework + initial diagrams

---

## DAILY SCHEDULE

### Morning (00:00 - 06:00)
- [ ] Complete TypeScript Pass 1 (SpecMapViewer)
- [ ] Start Valorant design tokens
- [ ] Initialize review protocol docs

### Afternoon (06:00 - 12:00)
- [ ] TypeScript Pass 2 (Three.js/D3)
- [ ] Build UI primitives (Button, Panel, Toggle)
- [ ] Create system architecture diagram

### Evening (12:00 - 18:00)
- [ ] TypeScript Pass 3 (Missing exports)
- [ ] Complete landing page
- [ ] Finalize review deliverables

### Night (18:00 - 23:59)
- [ ] Integration testing
- [ ] Documentation
- [ ] Status report

---

## SUCCESS CRITERIA
1. **TypeScript:** <100 errors, build succeeds
2. **UI:** Landing page matches Valorant aesthetic
3. **Review:** Framework ready for 13-day protocol

---

## RISK MITIGATION
- **Merge Conflicts:** Pull before each session
- **Regression:** Commit after each fix batch
- **Timeout:** Split large tasks into <15 min chunks
