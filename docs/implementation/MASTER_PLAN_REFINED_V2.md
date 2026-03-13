[Ver002.000]

# MASTER PLAN — REFINED FRAMEWORK V2
## Libre-X-eSport 4NJZ4 TENET Platform
### Unified Development Roadmap & Strategic Implementation Guide

**Status:** Phase 1 Complete, Framework Locked  
**Classification:** Strategic Planning Document  
**Review Cycle:** Bi-weekly  

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-13 | Development Team | Initial unified framework |
| 2.0.0 | 2026-03-13 | Review Team | Refined architecture, gap analysis |

---

## PART I: EXECUTIVE SUMMARY

### 1.1 Strategic Context

The 4NJZ4 TENET Platform represents a convergence of esports analytics, tactical simulation, and predictive modeling. This master plan unifies all development phases into a coherent, executable framework.

**Mission Statement:** Deliver the world's most comprehensive esports intelligence platform, combining real-world statistical analysis with deterministic tactical simulation.

### 1.2 Current State Assessment

| Domain | Status | Grade | Notes |
|--------|--------|-------|-------|
| **Frontend Architecture** | Phase 1 Complete | A- | Optimized, error-resilient |
| **Backend API** | Phase 1 Complete | A | 11 query functions implemented |
| **Database Layer** | Phase 1 Complete | A | TimescaleDB configured |
| **Testing Infrastructure** | Gap Identified | D | CRITICAL: No JS tests |
| **DevOps/CI/CD** | Not Started | F | Pipeline needed |
| **Documentation** | Comprehensive | A | 115+ MD files |

### 1.3 Unified Phase Roadmap

```
2026 Q1                          2026 Q2                          2026 Q3
├──────────────┬─────────────────┼─────────────────┬──────────────┼──────────────┤
│  PHASE 1     │    PHASE 2      │    PHASE 3      │   PHASE 4    │  PHASE 5-7   │
│  Foundation  │  Performance    │  Simulation     │   ML/AI      │  Scale/Innov │
│  ✓ COMPLETE  │  IN PROGRESS    │  PLANNED        │   PLANNED    │  PLANNED     │
│              │                 │                 │              │              │
│ • Grid Opt   │ • Web Workers   │ • Godot Bridge  │ • Predictions│ • Multi-game │
│ • DB Layer   │ • PWA           │ • Scenarios     │ • Confidence │ • Enterprise │
│ • Error Bound│ • Virtual Scroll│ • What-if       │ • RAR v2     │ • VR/AI      │
└──────────────┴─────────────────┴─────────────────┴──────────────┴──────────────┘
```

---

## PART II: PHASE SPECIFICATIONS

### PHASE 1 — FOUNDATION [COMPLETE] ✅

#### 2.1.1 Deliverables Verification

| Component | Status | Quality Gate | Evidence |
|-----------|--------|--------------|----------|
| DraggablePanel | ✅ | Memo + callbacks optimized | 7-field comparison |
| PanelSkeleton | ✅ | Shimmer + a11y | Visual verified |
| PanelErrorBoundary | ✅ | Per-panel isolation | Runtime tested |
| QuaternaryGrid | ✅ | Selectors optimized | Build passes |
| DB Layer (db.py) | ✅ | 11 functions | Connection pooling |

#### 2.1.2 Critical Gaps (Addressed in Phase 2)

```yaml
blockers:
  - id: TEST-001
    severity: CRITICAL
    description: No frontend testing framework
    impact: Cannot guarantee quality, prevent regressions
    mitigation: Add Vitest + React Testing Library
    effort: 8 hours
    
  - id: LINT-001
    severity: HIGH
    description: ESLint configuration missing
    impact: No code style enforcement
    mitigation: Add ESLint config with React rules
    effort: 2 hours
    
  - id: DUP-001
    severity: MEDIUM
    description: Duplicate db.py files
    impact: Confusion, maintenance burden
    mitigation: Remove db_implemented.py
    effort: 0.5 hours
```

---

### PHASE 2 — PERFORMANCE ARCHITECTURE [CURRENT FOCUS]

#### 2.2.1 Technical Vision

Transform from functional grid to high-performance platform capable of:
- 60fps with 50+ concurrent panels
- Offline functionality (PWA)
- <2s Time to Interactive
- <100ms API response times

#### 2.2.2 Architecture Components

**A. Web Worker Canvas System**

```typescript
// Worker Thread Architecture
interface GridWorkerProtocol {
  // Initialization
  INIT: {
    canvas: OffscreenCanvas;
    width: number;
    height: number;
    dpr: number;
  };
  
  // Rendering
  RENDER: {
    panels: PanelThumbnail[];
    viewport: ViewportBounds;
    timestamp: number;
  };
  
  // Interaction
  DRAG_START: { panelId: string; x: number; y: number };
  DRAG_MOVE: { panelId: string; dx: number; dy: number };
  DRAG_END: { panelId: string; finalPosition: Position };
  
  // Lifecycle
  RESIZE: { width: number; height: number };
  DESTROY: {};
}

// Main Thread Hook
function useCanvasGrid(containerRef: RefObject<HTMLElement>) {
  const workerRef = useRef<Worker>();
  const canvasRef = useRef<HTMLCanvasElement>();
  
  // Initialize worker with OffscreenCanvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const offscreen = canvas.transferControlToOffscreen();
    
    const worker = new Worker(
      new URL('../workers/grid.worker.ts', import.meta.url)
    );
    
    worker.postMessage({
      type: 'INIT',
      payload: { canvas: offscreen }
    }, [offscreen]);
    
    return () => worker.terminate();
  }, []);
  
  return { canvasRef, workerRef };
}
```

**B. Virtual Scrolling with TanStack**

```typescript
// Virtual Grid Configuration
const virtualConfig = {
  count: panels.length,
  getScrollElement: () => containerRef.current,
  estimateSize: useCallback(() => rowHeight, [rowHeight]),
  overscan: 3, // Render 3 items beyond viewport
  measureElement: true, // Dynamic heights
  scrollPaddingEnd: 100, // Bottom padding
};

// Panel Lifecycle
const panelLifecycle = {
  MOUNT: 'Initial render, measure dimensions',
  VISIBLE: 'In viewport, full interactivity',
  OFFSCREEN: 'Near viewport, lightweight render',
  VIRTUALIZED: 'Far from viewport, remove from DOM',
  UNMOUNT: 'Cleanup resources',
};
```

**C. State Management Optimization**

```typescript
// Split stores for performance
const useStaticStore = create<StaticState>()(
  persist(
    (set) => ({
      // Layout config, theme - rarely changes
      layout: defaultLayout,
      theme: defaultTheme,
    }),
    { name: 'static-storage' }
  )
);

const useDynamicStore = create<DynamicState>()((set) => ({
  // Panels, positions - frequent changes
  panels: [],
  positions: new Map(),
  
  // Optimized updates
  updatePanelPosition: (id, pos) => 
    set((state) => ({
      positions: new Map(state.positions).set(id, pos)
    })),
}));

const useEphemeralStore = create<EphemeralState>()((set) => ({
  // UI state only - drag, hover, etc.
  isDragging: false,
  hoveredPanel: null,
  dragPreview: null,
}));
```

#### 2.2.3 Implementation Schedule

**Week 1: Core Performance (40 hours)**

| Day | Focus | Deliverable | Owner |
|-----|-------|-------------|-------|
| Mon | Worker Setup | GridWorker.ts, communication protocol | Frontend Lead |
| Tue | Canvas Rendering | OffscreenCanvas, double buffering | Frontend Lead |
| Wed | Virtual Scrolling | TanStack integration, overscan | Frontend Dev |
| Thu | State Splitting | Static/Dynamic/Ephemeral stores | Frontend Dev |
| Fri | Integration | Hybrid DOM/Canvas mode working | Team |

**Week 2: PWA & Polish (34 hours)**

| Day | Focus | Deliverable | Owner |
|-----|-------|-------------|-------|
| Mon | Service Worker | Offline caching, background sync | Full-stack |
| Tue | Code Splitting | Route-based splitting, preloading | Frontend |
| Wed | Bundle Optimization | <500KB initial, <300KB critical | Frontend |
| Thu | Testing Setup | Vitest, coverage >80% | QA |
| Fri | Documentation | API docs, runbooks | Tech Writer |

#### 2.2.4 Success Criteria

| Metric | Baseline | Target | Verification |
|--------|----------|--------|--------------|
| Drag FPS | ~45fps | 60fps | Chrome DevTools |
| Memory (50 panels) | ~250MB | <150MB | Chrome Memory |
| Bundle (initial) | ~530KB | <300KB | webpack-analyzer |
| Lighthouse | ~75 | >90 | Lighthouse CI |
| Offline | None | Full | Service Worker test |

---

### PHASE 3 — SIMULATION INTEGRATION [PLANNED]

#### 2.3.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION BRIDGE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Web Platform                    Godot 4 Web Export             │
│  ─────────────                   ─────────────────              │
│                                                                  │
│  ┌──────────────┐               ┌──────────────┐               │
│  │ Scenario     │──JSON───────►│ Load         │               │
│  │ Builder      │               │ Scenario     │               │
│  └──────────────┘               └──────┬───────┘               │
│         ▲                              │                        │
│         │ Events                       │ Simulation             │
│  ┌──────┴──────┐               ┌───────▼───────┐               │
│  │ Playback    │◄──WASM────────┤ Match Engine  │               │
│  │ Controls    │   Messages    │ • 20 TPS tick │               │
│  │             │               │ • Deterministic│              │
│  └─────────────┘               └───────────────┘               │
│                                                                  │
│  Protocol: Compressed binary over postMessage                   │
│  Format: Custom binary for state, JSON for metadata             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3.2 Key Capabilities

**A. Scenario Builder**
- Drag-drop agent placement on SVG map
- Economy state configuration (credits, weapons)
- Round situation (score, time remaining)
- Validation rules (legal positions, valid loadouts)

**B. Deterministic Playback**
- Frame-accurate navigation (prev/next)
- Variable speed (0.25x, 0.5x, 1x, 2x, 4x)
- Event bookmarking and annotations
- Export to MP4/GIF/WebM

**C. "What-If" Analysis**
- Parameter sweeps (n=10,000 iterations)
- Sensitivity analysis
- A/B scenario comparison
- Statistical outcome distributions

#### 2.3.3 Technical Specifications

```typescript
// Scenario Schema v1.0
interface SimulationScenario {
  version: '1.0';
  metadata: {
    id: string;
    name: string;
    map: 'ascent' | 'bind' | 'haven' | 'split' | 'icebox' | 'breeze' | 'fracture' | 'pearl' | 'lotus';
    created: ISO8601;
    author: string;
  };
  gameState: {
    round: number;
    score: { attackers: number; defenders: number };
    timeRemaining: number; // seconds
    spike: {
      planted: boolean;
      position?: Vector3;
      timer?: number;
    };
  };
  teams: {
    attackers: PlayerConfig[];
    defenders: PlayerConfig[];
  };
  economy: {
    teamA: { credits: number; equipment: Equipment[] };
    teamB: { credits: number; equipment: Equipment[] };
  };
}

// Godot Communication Protocol
enum MessageType {
  // Web → Godot
  LOAD_SCENARIO = 0x01,
  PLAY = 0x02,
  PAUSE = 0x03,
  SEEK_FRAME = 0x04,
  SET_SPEED = 0x05,
  
  // Godot → Web
  STATE_UPDATE = 0x10,
  EVENT_TRIGGERED = 0x11,
  SIMULATION_COMPLETE = 0x12,
  EXPORT_READY = 0x13,
}
```

---

### PHASE 4 — ADVANCED ANALYTICS & ML [PLANNED]

#### 2.4.1 ML Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ML PIPELINE v2.0                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Raw Data │──►│ Feature  │──►│ Training │──►│ Serving  │     │
│  │ (37 fld) │   │ Store    │   │ Pipeline │   │ API      │     │
│  └──────────┘   └──────────┘   └────┬─────┘   └────┬─────┘     │
│       ▲                             │              │            │
│       │                             ▼              ▼            │
│       │                        ┌──────────┐   ┌──────────┐     │
│       └────────────────────────┤ MLflow   │   │ Cached   │     │
│                                │ Tracking │   │ Inference│     │
│                                └──────────┘   └──────────┘     │
│                                                                  │
│  Models:                                                        │
│  • SimRating v2 (XGBoost) - Performance prediction              │
│  • Match Outcome (Ensemble) - Winner prediction                 │
│  • Player Trajectory (LSTM) - Career forecasting                │
│  • Clutch Probability (NN) - Situation win prediction           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Prediction Capabilities

| Model | Type | Features | Target Accuracy | Latency |
|-------|------|----------|-----------------|---------|
| **SimRating v2** | XGBoost | 37 KCRITR fields | MAE <5% | <20ms |
| **Match Winner** | Ensemble | Team stats, history, map | 68% | <50ms |
| **Map Score** | Poisson | Round-by-round features | ±1.5 rounds | <30ms |
| **Clutch Probability** | Neural | Situation, player history | 72% AUC | <10ms |
| **Player Trajectory** | LSTM | 90-day rolling window | Directional 75% | <100ms |

#### 2.4.3 Confidence Scoring System

```python
class ConfidenceEngine:
    """
    Multi-factor confidence calculation for all predictions
    """
    
    FACTORS = {
        'data_quality': 0.25,      # Completeness, recency
        'sample_size': 0.20,       # Training examples
        'model_uncertainty': 0.25,  # Prediction variance
        'context_match': 0.15,     # Similarity to training
        'feature_stability': 0.15, # Feature variance over time
    }
    
    def calculate(self, prediction: Prediction) -> ConfidenceScore:
        factor_scores = {
            'data_quality': self._assess_data_quality(prediction.inputs),
            'sample_size': self._assess_sample_size(prediction.model),
            'model_uncertainty': prediction.uncertainty,
            'context_match': self._context_similarity(prediction),
            'feature_stability': self._feature_variance(prediction.inputs),
        }
        
        weighted_score = sum(
            factor_scores[k] * self.FACTORS[k] 
            for k in self.FACTORS
        )
        
        return ConfidenceScore(
            value=weighted_score,
            tier=self._score_to_tier(weighted_score),
            factors=factor_scores,
            recommendation=self._generate_recommendation(weighted_score)
        )
```

---

### PHASES 5-7 — EXPANSION & INNOVATION [PLANNED]

#### 2.5.1 Phase 5: Ecosystem Expansion

**Multi-Game Support:**
```typescript
interface GameAdapter {
  game: 'valorant' | 'cs2';
  
  extractors: {
    match: MatchExtractor;
    player: PlayerExtractor;
    economy: EconomyExtractor;
  };
  
  normalizers: {
    // Normalize to universal scale (0-100)
    combatScore: (raw: number) => number;
    survival: (raw: number) => number;
    economy: (raw: number) => number;
    impact: (raw: number) => number;
  };
  
  visualizers: {
    map: MapVisualizer;
    agent: AgentVisualizer; // Weapon for CS2
  };
}
```

**API Marketplace Tiers:**

| Tier | Rate Limit | Features | Monthly Price |
|------|------------|----------|---------------|
| Free | 100/day | Basic stats, read-only | $0 |
| Developer | 10K/day | Full API, webhooks | $29 |
| Pro | 100K/day | Predictions, ML | $99 |
| Enterprise | Unlimited | Custom models, SLA | Custom |

#### 2.5.2 Phase 6: Enterprise Scale

**Multi-Tenancy Architecture:**
- Row-level security per tenant_id
- Isolated data stores per organization
- White-label customization
- SSO integration (SAML, OIDC)
- Custom domain support

#### 2.5.3 Phase 7: Innovation Lab

**Research Areas:**
- VR visualization mode (Three.js VR)
- Real-time inference during live matches
- Generative AI for commentary assistance
- Computer vision for automated VOD analysis

---

## PART III: TECHNICAL STANDARDS

### 3.1 Code Quality Framework

```yaml
quality_gates:
  pre_commit:
    - eslint:
        config: '.eslintrc.cjs'
        rules: ['react', 'react-hooks', 'typescript']
    - prettier:
        config: '.prettierrc'
    - typecheck:
        command: 'tsc --noEmit'
    
  pre_push:
    - unit_tests:
        coverage: '>80%'
        threshold: 'branches: 75, functions: 80, lines: 80, statements: 80'
    - build:
        command: 'npm run build'
        no_errors: true
    
  pre_merge:
    - integration_tests:
        command: 'npm run test:integration'
    - lighthouse:
        scores:
          performance: '>90'
          accessibility: '>95'
          best_practices: '>95'
          seo: '>90'
    - bundle_size:
        max_initial: '300kb'
        max_total: '1.5mb'
```

### 3.2 Testing Strategy

```
Testing Pyramid:
                    ┌─────────┐
                    │   E2E   │  ← 10% (Playwright)
                    │  Tests  │     Critical paths
                    ├─────────┤
                    │  Integ  │  ← 20% (React Testing Lib)
                    │  Tests  │     Component integration
                    ├─────────┤
                    │  Unit   │  ← 70% (Vitest)
                    │  Tests  │     Pure functions, hooks
                    └─────────┘
```

### 3.3 Documentation Standards

| Type | Location | Template | Review |
|------|----------|----------|--------|
| ADR | `/docs/adr/` | ADR-NNNN-title.md | Per decision |
| API | `/docs/api/` | OpenAPI 3.0 | Per release |
| Component | Storybook | JSDoc + MDX | Per PR |
| Runbook | `/docs/runbooks/` | Markdown | Quarterly |

---

## PART IV: RISK MANAGEMENT

### 4.1 Risk Register

| ID | Risk | P | I | Mitigation | Owner |
|----|------|---|---|------------|-------|
| R1 | Web Worker incompatibility | M | H | Main thread fallback | Frontend |
| R2 | ML accuracy below target | M | H | Ensemble + oversight | ML Eng |
| R3 | Godot Web performance | M | M | WASM optimize, LOD | Simulation |
| R4 | DB scaling issues | L | H | Partitioning, replicas | Backend |
| R5 | API rate limits | H | M | Caching, backoff | Data Eng |
| R6 | Security vulnerabilities | L | C | Audits, scanning | Security |

### 4.2 Contingency Plans

**Fallback Strategy Matrix:**

| Feature | Primary | Fallback | Degraded |
|---------|---------|----------|----------|
| Canvas Rendering | Web Worker | Main Thread | DOM only |
| Predictions | ML Model | Statistical | Baseline |
| Simulation | Godot WASM | Video replay | Static image |
| Offline | Service Worker | Cache API | Online only |

---

## PART V: SUCCESS METRICS

### 5.1 Technical KPIs

| Metric | Tool | Target | Alert |
|--------|------|--------|-------|
| Build Time | CI | <5 min | >10 min |
| Test Coverage | Vitest | >80% | <70% |
| Bundle Size | Analyzer | <300KB | >400KB |
| API Latency | Prometheus | <100ms | >200ms |
| Error Rate | Sentry | <0.1% | >1% |

### 5.2 Business KPIs

| Metric | Source | Target |
|--------|--------|--------|
| DAU/MAU | PostHog | 30% |
| Feature Adoption | Analytics | 40% |
| Churn Rate | Stripe | <5%/mo |
| NPS Score | Survey | >50 |

---

## PART VI: APPENDICES

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **4NJZ4** | "Forever and Never Die" - Platform philosophy |
| **KCRITR** | 37-field unified player schema |
| **RAR** | Role-Adjusted Replacement value |
| **SimRating** | Simulation-derived performance metric |
| **SATOR/ROTAS/AREPO/OPERA** | Four platform hubs |

### Appendix B: Phase Completion Checklists

**Phase 1 Complete:**
- [x] DraggablePanel optimized
- [x] PanelSkeleton created
- [x] PanelErrorBoundary created
- [x] QuaternaryGrid updated
- [x] DB layer implemented
- [x] Build verified

**Phase 2 Gates:**
- [ ] Testing framework added
- [ ] ESLint configured
- [ ] Web Worker Canvas working
- [ ] Virtual scrolling implemented
- [ ] Service Worker configured
- [ ] Code splitting active
- [ ] Bundle <500KB
- [ ] Lighthouse >90

### Appendix C: Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-03-13 | Web Workers for Canvas | 60fps requirement | Approved |
| 2026-03-13 | TanStack Virtual | Industry standard | Approved |
| 2026-03-13 | PWA + Service Worker | Offline requirement | Approved |
| 2026-03-13 | Godot for Simulation | Deterministic, WASM | Approved |

---

**Document Footer:**
- Version: 2.0.0
- Next Review: 2026-03-27
- Distribution: Development Team, Stakeholders
- Classification: Strategic Planning

*End of Master Plan*
