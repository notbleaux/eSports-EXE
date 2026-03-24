[Ver001.000]

# TL-S1 Agent Briefing — Wave 1.1 Lens Architecture
**Date:** March 23, 2026  
**Team Lead:** TL-S1  
**Sub-Agents:** 1-B (Analytical), 1-C (Tactical)

---

## MISSION OVERVIEW

**Objective:** Deliver Lens Plugin Architecture + 16 Specialized Lenses  
**Timeline:** Wave 1.1 (34 hours total)  
**Success Criteria:** All lenses compositable, 60fps with 3+ lenses active

---

## AGENT 1-B: ANALYTICAL LENSES (8 LENSES)

### Your Assignment
Build 8 analytical lenses for performance analysis and statistical visualization.

### Lens Inventory

| # | Lens ID | Name | Description | Complexity |
|---|---------|------|-------------|------------|
| 1 | `performance-heatmap` | Performance Heatmap | Player activity heat zones on map | High |
| 2 | `ability-efficiency` | Ability Efficiency | Utility usage effectiveness analysis | Medium |
| 3 | `duel-history` | Duel History | Head-to-head matchup tracking | Medium |
| 4 | `site-control` | Site Control | Bombsite control percentage | Medium |
| 5 | `player-trajectories` | Player Trajectories | Movement path visualization | High |
| 6 | `damage-dealt` | Damage Dealt | Damage distribution overlay | Low |
| 7 | `flash-assists` | Flash Assists | Flashbang assist tracking | Medium |
| 8 | `entry-success` | Entry Success | Entry frag success rates | Medium |

### Deliverables Checklist

- [ ] All 8 lenses implement `LensPlugin` interface
- [ ] Heatmap rendering system (GPU-accelerated)
- [ ] Trajectory path rendering with WebGL
- [ ] Configurable color schemes per lens
- [ ] Performance budget: <5ms render time each
- [ ] Documentation: Usage examples for each lens

### Technical Notes
- Use existing `DimensionManager` for coordinate transforms
- Leverage `CameraController` for lens-specific zoom behaviors
- Coordinate with Agent 2-B (Wave 1.2) for heatmap/trajectory GPU optimization

### Autonomous Decisions (No Escalation Needed)
- Color palette selection for analytical visualizations
- Data aggregation algorithms (averages, percentiles)
- Heatmap kernel size and intensity calculations
- Trajectory smoothing algorithms

---

## AGENT 1-C: TACTICAL LENSES (8 LENSES)

### Your Assignment
Build 8 tactical lenses for strategy analysis and prediction visualization.

### Lens Inventory

| # | Lens ID | Name | Description | Complexity |
|---|---------|------|-------------|------------|
| 1 | `rotation-predictor` | Rotation Predictor | Predicted team rotations | High |
| 2 | `timing-windows` | Timing Windows | Optimal execute timing visualization | Medium |
| 3 | `push-probability` | Push Probability | Site push likelihood heatmap | High |
| 4 | `clutch-zones` | Clutch Zones | High-pressure clutch locations | Medium |
| 5 | `utility-coverage` | Utility Coverage | Smoke/molly/flash coverage areas | Medium |
| 6 | `trade-routes` | Trade Routes | Common rotation paths | Low |
| 7 | `info-gaps` | Information Gaps | Uncovered map areas | Medium |
| 8 | `eco-pressure` | Economy Pressure | Economic advantage visualization | Low |

### Deliverables Checklist

- [ ] All 8 lenses implement `LensPlugin` interface
- [ ] Prediction visualization integration with `Predictive4D`
- [ ] Timing window overlay system
- [ ] Probability heatmap rendering
- [ ] Performance budget: <5ms render time each
- [ ] Documentation: Tactical interpretation guide

### Technical Notes
- Integrate with `Predictive4D.ts` for prediction visualizations
- Use probability gradients for prediction confidence
- Coordinate with Agent 5-A (Wave 3.1) for ML prediction data format

### Autonomous Decisions (No Escalation Needed)
- Probability threshold visual styling
- Timing window display formats
- Tactical iconography and symbology
- Prediction horizon configurations

---

## SHARED FRAMEWORK REQUIREMENTS

### LensPlugin Interface (Both Agents)

```typescript
export interface LensPlugin {
  id: string;
  name: string;
  category: 'analytical' | 'tactical';
  version: string;
  
  // Lifecycle
  initialize(context: LensContext): void;
  render(params: RenderParams): RenderOutput;
  dispose(): void;
  
  // Configuration
  configSchema: JSONSchema;
  defaultConfig: Record<string, unknown>;
  
  // Performance
  complexity: 'low' | 'medium' | 'high';
  targetFps: number;
}
```

### LensCompositor (Coordination Required)

Both agents must ensure their lenses work with:

```typescript
export interface LensCompositor {
  layers: LensLayer[];
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay';
  mask?: LensMask;
  compose(): WebGLTexture;
}
```

### Deliverable Location
```
apps/website-v2/src/components/SpecMapViewer/
├── lens/
│   ├── framework/
│   │   ├── LensPlugin.ts          # YOU CREATE
│   │   ├── LensCompositor.ts      # YOU CREATE
│   │   └── LensRegistry.ts        # YOU CREATE
│   ├── analytical/                # AGENT 1-B
│   │   ├── PerformanceHeatmapLens.ts
│   │   ├── AbilityEfficiencyLens.ts
│   │   ├── DuelHistoryLens.ts
│   │   ├── SiteControlLens.ts
│   │   ├── TrajectoryLens.ts
│   │   ├── DamageLens.ts
│   │   ├── FlashAssistLens.ts
│   │   └── EntrySuccessLens.ts
│   └── tactical/                  # AGENT 1-C
│       ├── RotationPredictorLens.ts
│       ├── TimingWindowLens.ts
│       ├── PushProbabilityLens.ts
│       ├── ClutchZoneLens.ts
│       ├── UtilityCoverageLens.ts
│       ├── TradeRouteLens.ts
│       ├── InfoGapLens.ts
│       └── EcoPressureLens.ts
```

---

## TL-S1 COORDINATION PROTOCOL

### Daily Standups (15 min)
- **Time:** To be scheduled with both agents
- **Format:** Yesterday/Today/Blockers
- **Output:** TL-S1 updates TEAM_REPORT

### Code Review Process
1. Agent submits to `AGENT_1B/` or `AGENT_1C/` folder
2. TL-S1 reviews within 4 hours
3. Feedback provided as `PRE_REVIEW_*.md`
4. Approved code moves to main implementation

### Escalation Path (TL-S1 → Foreman)

**MUST ESCALATE:**
- WebSocket integration requirements (shared with TL-A6)
- ML model data format conflicts (coordinate with TL-S6)
- Cross-pipeline visualization standard changes
- Lens compositing performance <30fps

**TL-S1 DECIDES:**
- Shader architecture approach
- Lens parameter naming conventions
- Color scheme standardization
- Performance optimization priorities

---

## QUALITY GATES

### Gate 1.1-A: Framework Complete (Day 2)
- [ ] LensPlugin interface defined
- [ ] LensCompositor functional
- [ ] Registry system operational
- [ ] Base lens class created

### Gate 1.1-B: Analytical Lenses (Day 4)
- [ ] 8 analytical lenses implemented
- [ ] Heatmap system working
- [ ] Trajectory rendering smooth
- [ ] All tests passing

### Gate 1.1-C: Tactical Lenses (Day 4)
- [ ] 8 tactical lenses implemented
- [ ] Prediction integration working
- [ ] Probability visualizations clear
- [ ] All tests passing

### Gate 1.1-FINAL: Integration (Day 5)
- [ ] All 16 lenses compositable
- [ ] 60fps maintained with 3+ lenses
- [ ] Documentation complete
- [ ] Handoff to TL-S2 ready

---

## RESOURCES

### Existing Code to Reference
- `DimensionManager.ts` — Coordinate transforms
- `CameraController.ts` — Camera animations
- `Predictive4D.ts` — WebGL foundation

### Documentation
- `docs/SPECMAPVIEWER_V2_EXPANSION_MASTER_PLAN.md` — Full pipeline context
- `AGENTS.md` — Project coding standards

### TL-S1 Contact
- **Status Updates:** Daily to TEAM_REPORTS/
- **Blockers:** Post to ESCALATIONS/
- **Questions:** Direct message TL-S1

---

## ACCEPTANCE CRITERIA

### Agent 1-B Completion
- [ ] 8 analytical lenses functional
- [ ] GPU-accelerated heatmap rendering
- [ ] Trajectory path visualization
- [ ] <5ms per lens render time
- [ ] Unit tests >80% coverage

### Agent 1-C Completion
- [ ] 8 tactical lenses functional
- [ ] Prediction overlay integration
- [ ] Probability visualization system
- [ ] <5ms per lens render time
- [ ] Unit tests >80% coverage

### Combined Success
- [ ] All 16 lenses work independently
- [ ] Lens compositing with 3+ layers at 60fps
- [ ] Consistent API across all lenses
- [ ] Complete documentation

---

**BRIEFING AUTHORIZED BY:** TL-S1  
**DISTRIBUTION:** Agent 1-B, Agent 1-C, Foreman (cc)

*This briefing is a living document. Updates will be versioned.*
