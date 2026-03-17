# KID-003 REDEPLOY v2: DEPLOYMENT PLAN [Ver001.000]

**Operation**: Integration Testing + MapModel Technical Development + Research Report  
**Mode**: Foreman-supervised, YOLOMode Activated  
**Structure**: 12-run pass + 1 Kode agent (asynchronous final check)  
**Order**: C→B→A reverse-alphabetical  
**Time**: 3 hours max (T+0 to T+180 min)  
**Constraint**: 50/50 tests passing mandatory

---

## STRUCTURE OVERVIEW

```
13 Agents Total:
├── 4 Teams × 3 agents = 12 synchronous agents
│   ├── Wave 1 (T+0 to T+60): Teams C1, C2, B1, B2
│   ├── Wave 2 (T+60 to T+120): Teams C3, B3, B4, B5
│   └── Wave 3 (T+120 to T+165): Teams A1, A2, A3 (integration)
└── 1 Kode agent (asynchronous): Final verification at T+165 to T+180
```

---

## WAVE 1: FOUNDATION (T+0 to T+60 min)

### TEAM C1: Dimension Architecture (QA Verification)
**Focus**: 4D/3D/2D system foundation

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| C1-Lead | Dimension Manager | `DimensionManager.ts` with mode switching | Type check |
| C1-Geometry | 3D Math | `transform.ts` — matrix operations, camera math | Unit test |
| C1-Types | Type System | Extended interfaces for 4D/3D/2D modes | Compile check |

**Exit Criteria**:
- [ ] DimensionConfig interface complete
- [ ] Mode switching (2D ↔ 3D ↔ 4D) functional
- [ ] Transform matrix operations tested

---

### TEAM C2: Camera & View System (QA Verification)
**Focus**: Camera manipulation for toy model

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| C2-Camera | Camera Controller | `CameraController.ts` — position, target, FOV | Visual test |
| C2-Animation | View Animation | Smooth transitions between views | 60fps check |
| C2-Input | Interaction | Zoom, pan, rotate handlers | Interaction test |

**Exit Criteria**:
- [ ] Camera zoom (0.1x to 3.0x) working
- [ ] Rotation (0° to 360°) smooth
- [ ] Elevation (-90° to +45°) functional

---

### TEAM B1: Missing Lenses (Test Fixes)
**Focus**: Complete the 6-lens system

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| B1-Doors | Doors Lens | `doorsLens.ts` — rotation patterns, animated arrows | Render test |
| B1-Secured | Secured Lens | `securedLens.ts` — control degradation | Render test |
| B1-Composite | Lens Blender | `LensCompositor.ts` — multi-lens overlay | Blend test |

**Exit Criteria**:
- [ ] Doors lens renders rotation trends
- [ ] Secured lens shows time degradation
- [ ] 2+ lenses can be composited

---

### TEAM B2: Test Infrastructure (Test Fixes)
**Focus**: Resolve Vitest/MSW issues

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| B2-Diagnose | Error Analysis | Root cause of ERR_LOAD_URL documented | Analysis doc |
| B2-Fix | Config Repair | Fixed vitest.config.js or Jest migration | Test run |
| B2-Coverage | Test Writing | New tests for dimension system | 50/50 passing |

**Exit Criteria**:
- [ ] Vitest error resolved OR Jest fallback working
- [ ] Existing 4 test files passing
- [ ] New dimension tests added

---

## WAVE 2: EDGE CASES & RESEARCH (T+60 to T+120 min)

### TEAM C3: Research Report (QA Verification)
**Focus**: Investigation and analysis

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| C3-Competitive | Game Analysis | Valorant, CS2, OW2 minimap comparison | Research doc |
| C3-Technical | Tech Survey | Canvas vs WebGL vs Three.js analysis | Benchmark data |
| C3-UX | User Study | Diegetic visualization research | Findings doc |

**Exit Criteria**:
- [ ] 3 competitive systems analyzed
- [ ] Performance comparison documented
- [ ] UX principles identified

---

### TEAM B3: Lens Enhancements (Integration)
**Focus**: v2 lens improvements

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| B3-Animation | Animated Lenses | Pulse effects, temporal decay | Animation test |
| B3-4D | Predictive Layer | Basic future-state projection | Mock data test |
| B3-Physics | Ripple Physics | Propagation, Doppler effects | Physics test |

**Exit Criteria**:
- [ ] Tension lens pulses
- [ ] Basic 4D projection working
- [ ] Ripple propagation physics

---

### TEAM B4: Performance & Optimization (Cross-Reference)
**Focus**: 60fps target

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| B4-Profiler | Performance | FPS monitoring, bottleneck detection | 60fps achieved |
| B4-Optimize | Rendering | WebGL fallback, culling optimization | Profile data |
| B4-Mobile | Mobile Adaptation | Touch gestures, reduced quality | Mobile test |

**Exit Criteria**:
- [ ] 60fps on desktop
- [ ] Touch controls working
- [ ] Performance budget documented

---

### TEAM B5: KOC System (Forum + Architecture)
**Focus**: Metrics and optimization

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| B5-Telemetry | Tracking | Handoff efficiency, fidelity measurement | Metrics logged |
| B5-Territory | Code Mapping | Architecture territory documentation | Map complete |
| B5-Deploy | Auto-Deploy | Trust-based deploy system design | Design doc |

**Exit Criteria**:
- [ ] KOC metrics instrumented
- [ ] Territory map created
- [ ] Auto-deploy spec written

---

## WAVE 3: INTEGRATION (T+120 to T+165 min)

### TEAM A1: System Integration
**Focus**: Connect all components

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| A1-Core | Integration | All systems connected | Integration test |
| A1-API | Backend | REST endpoints for map data | API test |
| A1-WS | WebSocket | Real-time lens data streaming | WS test |

---

### TEAM A2: Documentation
**Focus**: Complete documentation

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| A2-API | API Docs | OpenAPI spec for new endpoints | Swagger valid |
| A2-Arch | Architecture | Updated system diagrams | Review complete |
| A2-User | User Guide | Lens usage documentation | Guide complete |

---

### TEAM A3: Final Verification
**Focus**: Foreman checklist

| Agent | Role | Deliverable | Verification |
|-------|------|-------------|--------------|
| A3-Tests | Test Runner | 50/50 tests passing | Test report |
| A3-Demo | Demo Script | Interactive demonstration | Demo working |
| A3-Report | Final Report | Completion documentation | Report written |

---

## WAVE 4: KODE AGENT (T+165 to T+180 min)

### Kode: Asynchronous Final Check
**Focus**: Independent verification

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Code Review | Static analysis | No critical issues |
| Test Audit | Coverage check | >80% coverage |
| Performance | Benchmark | 60fps maintained |
| Security | Scan | No vulnerabilities |

---

## FOREMAN VERIFICATION CHECKPOINTS

### Checkpoint 1: T+60 min (End Wave 1)
- [ ] Dimension system interface complete
- [ ] Camera controller functional
- [ ] 2 new lenses implemented
- [ ] Test error diagnosed

### Checkpoint 2: T+120 min (End Wave 2)
- [ ] Research report sections complete
- [ ] Lens animations working
- [ ] Performance target met
- [ ] KOC system instrumented

### Checkpoint 3: T+165 min (End Wave 3)
- [ ] All components integrated
- [ ] 50/50 tests passing
- [ ] Documentation complete
- [ ] Demo functional

### Checkpoint 4: T+180 min (Kode Sign-off)
- [ ] Independent verification passed
- [ ] Final report approved

---

## JAZZ MODE PROTOCOL

### Pre-Approved Improvisations

| Blocker | Jazz Response | Evidence Required |
|---------|--------------|-------------------|
| Vitest unfixable at T+30 | Switch to Jest | Jest config working |
| 4D projection too complex | Simplify to 2.5D | 2.5D demo working |
| WebGL blocked | Use CSS 3D | CSS transforms working |
| Time < 45 min remaining | Cut Secured lens | 5 lenses complete |
| Research incomplete | Executive summary only | 3-bullet summary |

### Innovation Capture Template

```markdown
## IMPROV: [Timestamp] — [Decision]
**Context**: [What blocked us]
**Standard approach**: [What we should have done]
**Jazz mode executed**: [What we actually did]
**Risk**: [What could go wrong]
**Rollback**: [How to undo]
**Evidence**: [Proof it works]
```

---

## DELIVERABLES SUMMARY

### Code (Expected)

| Component | Files | Est. Bytes |
|-----------|-------|------------|
| Dimension System | 3 | ~5,000 |
| Camera Controller | 2 | ~4,000 |
| 2 New Lenses | 2 | ~6,000 |
| Lens Compositor | 1 | ~2,000 |
| Animation System | 2 | ~3,000 |
| 4D Predictive | 1 | ~2,000 |
| Test Fixes | 3 | ~3,000 |
| **TOTAL NEW** | **14** | **~25,000** |
| Prior Code | 17 | ~60,500 |
| **GRAND TOTAL** | **31** | **~85,500** |

### Documentation (Expected)

1. `KID003_REDEPLOY_v2_CRITIQUE.md` — This critique
2. `KID003_REDEPLOY_v2_PLAN.md` — This plan
3. `research/competitive-analysis.md` — Game comparison
4. `research/technical-survey.md` — Canvas/WebGL/Three.js
5. `research/ux-study.md` — Diegetic visualization
6. `docs/dimension-system.md` — Architecture
7. `docs/api-spec.md` — OpenAPI specification
8. `KID003_REDEPLOY_v2_FINAL.md` — Completion report

---

## KOC OPTIMIZATION TRACKING

### Metrics

| Metric | Baseline | Target | Tracking Method |
|--------|----------|--------|-----------------|
| koc_handoff_efficiency | N/A | <5 min | Timestamps in logs |
| strategic_fidelity_score | N/A | >90% | Spec compliance audit |
| parallel_collision_rate | N/A | <2/week | Git conflict log |

### Optimization Experiments

1. **Executive Summary First**: All reports start with 3 bullets
2. **Trust-Based Auto-Deploy**: P2+ hotfix auto-deploy design
3. **Territory Mapping**: Code ownership documentation

---

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Vitest still broken | Medium | High | Jest fallback ready |
| 4D too complex | Medium | Medium | Simplify to 2.5D |
| Time overrun | Low | High | Cut Secured lens |
| Performance < 60fps | Low | Medium | WebGL fallback |
| Integration fails | Low | High | Wave 3 buffer time |

---

## DEPLOYMENT STATUS

**Status**: ✅ **PLAN APPROVED — READY TO EXECUTE**

**Next Action**: Begin Wave 1 — Deploy Teams C1, C2, B1, B2

**Foreman Authorization**: Granted  
**YOLOMode**: Activated  
**Time Started**: T+0  
**Deadline**: T+180 min

---

**Plan Version**: 001.000  
**Last Updated**: 2026-03-16  
**Approved By**: Self (Foreman role)
