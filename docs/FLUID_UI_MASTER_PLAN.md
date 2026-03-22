[Ver001.000]

# FLUID/DYNAMIC/ADAPTIVE UI/UX MASTER PLAN
## 4NJZ4 TENET Platform - Development Pipeline

**Source Branch:** bbb55eb4 (March 18, 2026 - "Add fluid/dynamic/adaptive UI/UX")
**Foreman:** Central coordinating node
**Status:** Phase 1 Complete → Phases 2-8 Planned
**Last Updated:** 2026-03-23

---

## EXECUTIVE SUMMARY

This plan reimagines and restructures the fluid UI/UX development from the March 18, 2026 branch into a coherent, optimized development pipeline. The goal is to implement 65+ improvements across 8 phases, organized into manageable sub-agent waves.

### Core Concepts Extracted

| Concept | Description | Implementation |
|---------|-------------|----------------|
| **Fluid** | Container queries, clamp(), viewport units, resize observers | CSS + React hooks |
| **Dynamic** | Scroll reveals, micro-interactions, real-time animations | Framer Motion + GSAP |
| **Adaptive** | prefers-reduced-motion, viewport variants, device-specific | Media queries + JS |
| **Viscous SFX** | WebGL-fluid inspired easing (overshoot + settle) | Custom easing functions |
| **Lensing** | TENET Latin 5x5 squares, 4NJZ4 primordial fluid | Specialized components |
| **Glassmorphism** | Backdrop blur, translucent layers, depth | CSS backdrop-filter |

---

## PHASE STRUCTURE

```
PHASE 1: Shared Foundations ✅ COMPLETE
├── utils/fluid.js - Core hooks and utilities
├── GlassCard.jsx - Glassmorphism container
├── GlowButton.jsx - Action buttons with glow
├── FluidHubLayout.jsx - Responsive hub layout
└── Theme/Tailwind configuration

PHASE 2: HUB-1 SATOR (StatRef) 🔄 PLANNED
├── Hero parallax, masonry grid, morph nav
├── SVG rings, clamp text, scroll reveals
├── Particle BG, sidebar collapse, ripples
└── prefers-color-scheme support

PHASE 3: HUB-2 ROTAS (Analytics/ML) ⬜ PLANNED
├── Fluid Recharts resize, masonry models
├── Stack metrics, SVG latency gauge
├── Scroll timeline, container stats
└── Hover tips, heatmap zoom, shimmer skeletons

PHASE 4: HUB-3 AREPO (Social/Forum) ⬜ PLANNED
├── Infinite threads, adaptive map zoom
├── Query stack, typing indicators
├── Scroll annotations, composer layouts
└── Morph search, heatmap scale, collab cursors

PHASE 5: HUB-4 OPERA (Pro/Fantasy) ⬜ PLANNED
├── Drag draft board, marquee ticker
├── Virtual table, radial challenges
├── Confetti standings, snap carousel
└── 3D cards, particle streaks, PiP video

PHASE 6: HUB-5 TENET (Grid/Lensing) ⬜ PLANNED
├── Masonry grid, reveal sequence
├── Swipe carousel, smooth accordion
├── Ripple taps, parallax hero
└── Typewriter feed, theme transition

PHASE 7: 4NJZ4 Lens + Integrations ⬜ PLANNED
├── WebGL-fluid background
├── Latin square lensing panel
├── NZ/J? spinner, VOD minimap
└── ValoPLANT-inspired maps

PHASE 8: Polish/Testing ⬜ PLANNED
├── Build verification, TS/lint fixes
├── Responsive tests (Vitest/Playwright)
├── Performance audit
└── Demo and documentation
```

---

## SUB-AGENT WAVE ORGANIZATION

### WAVE 1: Foundation Verification & Enhancement (3 Agents)
**Foreman Priority:** Verify Phase 1 completeness, enhance where needed

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **F1-Architect** | Review fluid.js architecture | Architecture report, optimization plan |
| **F2-Component** | Verify GlassCard/GlowButton | Component audit, enhancement specs |
| **F3-Layout** | Review FluidHubLayout | Layout analysis, responsive test plan |

### WAVE 2: SATOR Hub Implementation (3 Agents)
**Focus:** HUB-1 StatRef - 10 improvements

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **S1-Hero** | Hero parallax + SVG rings | Hero component, parallax system |
| **S2-Grid** | Masonry grid + scroll reveals | Grid layout, reveal animations |
| **S3-Interactive** | Morph nav + ripples + particles | Navigation, interaction system |

### WAVE 3: ROTAS Hub Implementation (3 Agents)
**Focus:** HUB-2 Analytics/ML - 10 improvements

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **R1-Charts** | Fluid Recharts resize + gauges | Chart wrappers, resize handling |
| **R2-Metrics** | Stack metrics + heatmap zoom | Metrics display, heatmap component |
| **R3-Feedback** | Hover tips + shimmer skeletons | Tooltip system, skeleton loaders |

### WAVE 4: AREPO Hub Implementation (3 Agents)
**Focus:** HUB-3 Social/Forum - 10 improvements

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **A1-Threads** | Infinite threads + nested replies | Thread system, virtualization |
| **A2-Realtime** | Typing indicators + collab cursors | Realtime UI components |
| **A3-Search** | Morph search + query stack | Search UI, query management |

### WAVE 5: OPERA Hub Implementation (3 Agents)
**Focus:** HUB-4 Pro/Fantasy - 10 improvements

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **O1-Draft** | Drag draft board + virtual table | Drag-drop system, virtual scrolling |
| **O2-Visual** | Radial challenges + 3D cards | Radial UI, 3D transforms |
| **O3-Feed** | Marquee ticker + confetti | Ticker component, confetti system |

### WAVE 6: TENET Hub + 4NJZ4 Lens (3 Agents)
**Focus:** HUB-5 + Lens + Integrations - 20 improvements

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **T1-Grid** | Masonry grid + lensing panel | Grid system, Latin square panel |
| **T2-Effects** | WebGL-fluid BG + parallax | Canvas/WebGL effects |
| **T3-Spinner** | NZ/J? spinner + maps | Spinner component, map overlays |

### WAVE 7: Testing & Polish (2 Agents)
**Focus:** Phase 8 completion

| Agent | Assignment | Deliverables |
|-------|------------|--------------|
| **P1-Quality** | TS/lint fixes, build verification | Clean build, type safety |
| **P2-Testing** | Responsive tests, performance audit | Test suite, performance report |

---

## SUB-AGENT WORKFLOW PROTOCOL

### Phase 1: Conceptualization (Foreman-Led)
1. **Foreman** extracts concepts from source branch
2. **Foreman** drafts initial implementation approach
3. **Foreman** assigns agents with conceptual briefs

### Phase 2: Drafting (Agent Work)
1. **Agent** receives conceptual brief from Foreman
2. **Agent** drafts implementation plan (not code)
3. **Agent** submits draft to Foreman for review

### Phase 3: Foreman Review & Update
1. **Foreman** reviews agent draft
2. **Foreman** identifies optimizations, errors, improvements
3. **Foreman** updates plan with corrections
4. **Foreman** returns updated plan to agent

### Phase 4: Implementation (Agent Work)
1. **Agent** follows updated plan (not original draft)
2. **Agent** implements with sub-reports to Foreman
3. **Agent** submits implementation for review

### Phase 5: Foreman Verification (2-Pass)
1. **Pass 1:** Read-only verification against checklist
2. **Pass 2:** Final proof-read and optimization
3. **Foreman** approves or requests changes

### Phase 6: Final Documentation
1. **Agent** provides final report with 3 recommendations
2. **Foreman** compiles wave report
3. **Foreman** proceeds to next wave

---

## CONCEPTUAL FRAMEWORK DETAILS

### 1. Fluid Architecture

```typescript
// Core Concepts from Source Branch

// Container Query System
useContainerQuery({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
})
// Returns: { ref, size: {width, height}, matches: {sm, md, lg, xl} }

// Fluid Typography
fluidFont(minPx, maxPx, vwMin, vwMax)
// Returns: clamp() CSS string

// Resize Observer Hook
useFluidResize(callback, deps)
// Returns: ref to attach to element
```

### 2. Dynamic Interactions

```typescript
// Scroll Reveal System
useScrollReveal({
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 }
})
// Returns: { ref, animate }

// Viscous SFX (WebGL-fluid inspired)
viscousEase(t) // overshoot + settle easing
useViscousSFX(target, { stiffness, damping })
// Returns: { spring, animateViscous }
```

### 3. Adaptive Features

```typescript
// Reduced Motion Detection
useReducedMotion() // returns boolean

// Lensing Panel (TENET Latin Square)
useLensingPanel(activeLayer, maxLayers)
// Returns: { layers, toggleLayer }
```

### 4. Glassmorphism System

```css
/* GlassCard Specification */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: 1px solid #2a2a3a;
--glass-radius: 12px;
--glass-blur: backdrop-blur-md;
--glass-hover-glow: box-shadow transition on hover;

/* GlowButton Specification */
--glow-primary: gradient from #ff4655 to #ff6b00;
--glow-hover: scale 1.05 + box-shadow 0 0 30px {color};
--glow-tap: scale 0.95;
```

---

## QUALITY GATES

### Gate 1: Concept Approval (Foreman)
- [ ] Concept extracted from source branch
- [ ] Implementation approach documented
- [ ] Agent assignments confirmed

### Gate 2: Draft Approval (Foreman)
- [ ] Agent draft received
- [ ] Plan reviewed for errors/optimizations
- [ ] Updated plan returned to agent

### Gate 3: Implementation Check (Foreman)
- [ ] Code follows updated plan
- [ ] No deviations from approved approach
- [ ] Sub-reports submitted regularly

### Gate 4: Final Verification (Foreman)
- [ ] Read-only pass completed
- [ ] File locations verified
- [ ] Code quality checked
- [ ] 3 recommendations provided

### Gate 5: Wave Completion (Foreman)
- [ ] All agents in wave completed
- [ ] Wave report compiled
- [ ] Next wave prepared

---

## RISK MITIGATION

| Risk | Mitigation | Owner |
|------|------------|-------|
| Agent deviates from plan | Daily sub-reports, redirect if needed | Foreman |
| Code quality issues | 2-pass foreman verification | Foreman |
| Scope creep | Strict phase boundaries, change control | Foreman |
| Integration conflicts | Shared foundation first, then hubs | Foreman |
| Performance degradation | Performance audit gate | Agent P2 |

---

## TIMELINE ESTIMATE

| Wave | Duration | Agents | Effort |
|------|----------|--------|--------|
| Wave 1: Foundation | 2 days | 3 | 24h |
| Wave 2: SATOR | 3 days | 3 | 36h |
| Wave 3: ROTAS | 3 days | 3 | 36h |
| Wave 4: AREPO | 3 days | 3 | 36h |
| Wave 5: OPERA | 3 days | 3 | 36h |
| Wave 6: TENET + 4NJZ4 | 4 days | 3 | 48h |
| Wave 7: Polish | 2 days | 2 | 16h |
| **Total** | **20 days** | **20** | **232h** |

---

## DOCUMENT CONTROL

**Version:** 001.000  
**Last Updated:** 2026-03-23  
**Next Review:** Upon wave initiation  
**Owner:** Foreman Agent  
**Distribution:** All sub-agents, stakeholders

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 001.000 | 2026-03-23 | Initial master plan from branch bbb55eb4 | Foreman |

---

**END OF FLUID UI MASTER PLAN**
