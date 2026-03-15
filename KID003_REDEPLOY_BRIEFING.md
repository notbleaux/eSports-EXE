# KID-003 REDEPLOY BRIEFING [Ver001.000]
**Mode**: YOLOMode Activated — Freestyle Autonomy
**Authority**: Foreman-supervised with improvisation authorization
**Constraint**: 1 hour max, 50/50 tests mandatory
**Special**: SpecMapViewer Tactical Minimap Investigation

---

## PART 1: CRITIQUE OF PRIOR WORK

### Self-Critique: Week 1 → Week 2 Transition

#### Issues Identified in Prior Execution

**1. Circuit Breaker Metrics Over-Engineering**
- **Prior**: Added 7 Prometheus metrics + 5 API endpoints
- **Critique**: Over-engineered for Week 2 Day 1. Should have started with 3 core metrics.
- **YOLO Fix**: Strip to essentials: state, failures, successes only. Defer histograms.

**2. Test Fix Band-Aids**
- **Prior**: Adjusted thresholds (10ms → 50ms) for CI
- **Critique**: Masked performance issues instead of investigating root cause
- **YOLO Fix**: Profile actual CI environment, set data-driven thresholds

**3. WebSocket Mock Complexity**
- **Prior**: Full MockWebSocket class with event simulation
- **Critique**: Brittle, breaks on minor React updates
- **YOLO Fix**: Use MSW (Mock Service Worker) library — industry standard

**4. Missing MapViewer Foundation**
- **Prior**: Focused on circuit breaker, ignored visual component foundation
- **Critique**: SpecMapViewer is critical differentiator, needs Day 1 attention
- **YOLO Fix**: Parallel track — circuit breaker + toy model foundation

---

## PART 2: SPECMAPVIEWER TACTICAL MINIMAP

### Core Concept
"Toy model to understand how to better analyze the game. The framing of it, the MapViewer, has potential to be a creative triumph."

### Investigation Framework

#### Phase 1: Toy Model Construction (30 min)
```
toy-model/
├── bind-grid.json          # 64x64 grid (Bind map)
├── site-geometry.json      # A site, B site bounding boxes
├── choke-points.json       # U-hall, A short, B long
├── spawn-positions.json    # Attacker/defender spawns
└── cover-objects.json      # Boxes, corners, elevation
```

#### Phase 2: Creative Lens System (30 min)
**Diegetic Visual Metaphors**:

| Lens Name | Metaphor | Visualization | Data Source |
|-----------|----------|---------------|-------------|
| **Tension** | Pressure/darkness | Heatmap overlay | Kill frequency, ability usage |
| **Ripples** | Sound waves | Concentric circles | Footstep events, gunshots |
| **Blood trails** | Combat history | Staining overlay | Damage events, eliminations |
| **Winds** | Movement flow | Vector field | Player positions over time |
| **Doors** | Rotation patterns | Animated arrows | Site takes, retakes |
| **Secured** | Control status | Material degradation | Round win/loss history |

#### Phase 3: Technical Architecture
```typescript
interface SpecMapViewer {
  // Core
  mapGrid: Grid64x64;
  entities: Entity[];
  
  // Lenses (composable)
  lenses: {
    tension: TensionLens;
    sound: RippleLens;
    combat: BloodTrailLens;
    movement: WindFieldLens;
    strategy: DoorRotationLens;
    control: SecuredLens;
  };
  
  // Manipulation
  transform: {
    compression: number;  // 0.1 (micro) to 2.0 (macro)
    rotation: number;     // 0 to 360 degrees
    elevation: number;    // -90 (top-down) to +45 (angled)
  };
}
```

---

## PART 3: 12-RUN INTEGRATION PASS (C→B→A)

### Wave 1: Foundation (T+0 to T+20 min) — TEAMS C1, C2, B1, B2

**TEAM C1 (QA Verification)**
- C1-Lead: API endpoint verification (35 endpoints)
- C1-Security: Firewall + rate limiting
- C1-Data: GAME_ONLY_FIELDS enforcement

**TEAM C2 (QA Verification)**
- C2-Canvas: Context loss handling
- C2-WebSocket: Reconnection resilience
- C2-SpecMap: Toy model grid generation

**TEAM B1 (Test Fixes)**
- B1-Mock: MSW migration (replace custom mock)
- B1-Timing: CI environment profiling
- B1-SpecMap: Lens system architecture

**TEAM B2 (Test Fixes)**
- B2-Tactical: TacticalView optimization
- B2-Performance: Root cause analysis
- B2-SpecMap: Creative metaphor definitions

---

### Wave 2: Edge Cases (T+20 min to T+40 min) — TEAMS C3, B3, B4, B5

**TEAM C3 (Security Edge Cases)**
- C3-Penetration: SQL injection, XSS
- C3-JWT: Token validation
- C3-SpecMap: Data privacy for replay data

**TEAM B3 (Integration)**
- B3-Integration: API-frontend
- B3-E2E: Playwright critical paths
- B3-SpecMap: Three.js prototype

**TEAM B4 (Cross-Reference)**
- B4-Query: Cross-hub endpoints
- B4-SpecMap: VOD scraping pipeline design

**TEAM B5 (Forum + SpecMap)**
- B5-Auth: JWT in forum
- B5-SpecMap: Mobile streaming compression

---

### Wave 3: Final Validation (T+40 min to T+60 min) — ALL TEAMS

**FOREMAN VERIFICATION**
- [ ] Identify file
- [ ] Identify function
- [ ] Identify logic
- [ ] Identify test
- [ ] Run it

---

## PART 4: KOC SYSTEM OPTIMIZATION

### Metrics Tracking

| Metric | Method | Target |
|--------|--------|--------|
| koc_handoff_efficiency | Bibi complete → Kode start timestamp | < 5 min |
| strategic_fidelity_score | % intent preserved | > 90% |
| parallel_collision_rate | Git conflicts/week | < 2 |

### Optimization Experiments

**[ ] Executive Summary First**
- Scout reports start with 3-bullet summary
- Reduces digestion time by 60%

**[ ] Trust-Based Auto-Deploy**
- P2+ hotfixes auto-deploy after CI pass
- Reduces bottlenecks

**[ ] Territory Mapping**
- Architecture teams claim code territories
- Prevents merge conflicts

---

## PART 5: JAZZ MODE PROTOCOL

### Improvisation Authorization

| Blocker | Jazz Response | Evidence Required |
|---------|--------------|-------------------|
| Failing test | Rewrite to match evolved behavior | Behavior change justification |
| Ambiguous spec | Executive decision + rollback plan | Decision rationale |
| Dependency blocked | Interface stub | Stub contract |
| Time < 30 min | Minimum Viable Verification | Partial coverage marker |
| Spec mismatch | Option A with Option B comments | Both approaches |

### Innovation Capture
```markdown
## IMPROV: [Timestamp] — [Decision]
**Context**: [Blocked scenario]
**Standard approach**: [Convention]
**Jazz mode executed**: [Actual action]
**Risk**: [Potential issues]
**Rollback**: [Undo procedure]
**Recommendation**: [Standardize?]
```

---

## DEPLOYMENT: WAVE 1

Deploying 4 teams NOW:
- C1, C2: QA verification
- B1, B2: Test fixes + SpecMap foundation

**Time allocation**: 20 minutes per wave
**Checkpoint**: Foreman verification at T+20, T+40, T+60

---

**STATUS**: DEPLOYING WAVE 1
**YOLOMode**: ACTIVE
**CRITIQUE**: COMPLETE
**SPECIAL INVESTIGATION**: SpecMapViewer initiated
