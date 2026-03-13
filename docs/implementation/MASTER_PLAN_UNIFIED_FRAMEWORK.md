[Ver001.000]

# MASTER PLAN — UNIFIED DEVELOPMENT FRAMEWORK
## Libre-X-eSport 4NJZ4 TENET Platform

**Document Classification:** Strategic Planning  
**Version:** 1.0.0  
**Date:** 13 March 2026  
**Status:** Phase 1 Complete, Master Framework Established

---

## I. EXECUTIVE VISION

### 1.1 Project Mission

Create the world's most advanced esports analytics and simulation platform, combining real-world statistical analysis with deterministic tactical simulation to provide unprecedented insights into competitive FPS gameplay.

### 1.2 Core Value Propositions

| Value Proposition | Technical Foundation | User Benefit |
|-------------------|---------------------|--------------|
| **SATOR Analytics** | 37-field KCRITR schema, TimescaleDB | Deep player performance insights |
| **ROTAS Simulation** | Godot 4 deterministic engine | Tactical scenario testing |
| **4NJZ4 Interface** | WebGL/React hybrid grid system | Intuitive multi-hub navigation |
| **TENET Predictions** | ML-enhanced statistical models | Match outcome forecasting |

### 1.3 Success Metrics (12-Month Horizon)

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| Platform Load Time | <2s | ~4s | 50% improvement needed |
| Concurrent Panels | 50+ | ~20 | 150% capacity increase |
| API Response Time | <100ms | ~300ms | 66% improvement needed |
| User Retention (D30) | 40% | N/A | Baseline establishment |
| Data Coverage | 100% VCT | Partial | Full league coverage |

---

## II. STRATEGIC PHASES FRAMEWORK

### Phase Overview Matrix

| Phase | Focus | Duration | Dependencies | Deliverables |
|-------|-------|----------|--------------|--------------|
| **Phase 1** | Foundation & Critical Fixes | Complete | - | Optimized grid, DB layer, error handling |
| **Phase 2** | Performance Architecture | 2 weeks | Phase 1 | Web Workers, PWA, virtual scrolling |
| **Phase 3** | Simulation Integration | 3 weeks | Phase 2 | Godot bridge, deterministic playback |
| **Phase 4** | Analytics & ML | 3 weeks | Phase 3 | Predictions, confidence scoring, RAR |
| **Phase 5** | Ecosystem Expansion | 4 weeks | Phase 4 | CS2 support, API marketplace |
| **Phase 6** | Enterprise & Scale | 4 weeks | Phase 5 | Multi-tenant, white-label, SSO |
| **Phase 7** | Innovation & Research | Ongoing | Phase 6 | VR visualization, real-time inference |

---

## III. PHASE DETAILED SPECIFICATIONS

### PHASE 1 — FOUNDATION [COMPLETE]

#### 1.1 Achievements Summary

**Frontend Optimizations:**
- ✅ React.memo with 7-field comparison for DraggablePanel
- ✅ Individual Zustand selectors preventing unnecessary re-renders
- ✅ useCallback for all event handlers (5 stable callbacks)
- ✅ PanelErrorBoundary per-panel isolation
- ✅ PanelSkeleton with shimmer loading states
- ✅ Accessibility: aria-labels, roles, focus management

**Backend Implementation:**
- ✅ 11 database query functions implemented
- ✅ Connection pooling with asyncpg
- ✅ Date serialization for JSON responses
- ✅ Error handling with structured logging

**Build & Quality:**
- ✅ Production build verified (5.52s build time)
- ✅ Bundle chunking strategy (3 vendor chunks)
- ✅ No breaking changes, backward compatible

#### 1.2 Technical Debt Addressed

| Issue | Resolution | Verification |
|-------|------------|--------------|
| Import order bug | Fixed useState placement | Build passes |
| React Grid Layout compatibility | Migrated to ResponsiveGridLayout | Build passes |
| Missing error boundaries | PanelErrorBoundary implemented | Runtime tested |
| No loading states | PanelSkeleton created | Visual verified |

#### 1.3 Phase 1 Gaps (Carry to Phase 2)

- ⚠️ No frontend testing framework (CRITICAL)
- ⚠️ Missing ESLint configuration
- ⚠️ Duplicate database files (db.py vs db_implemented.py)
- ⚠️ Large Three.js bundle (998KB)

---

### PHASE 2 — PERFORMANCE ARCHITECTURE [IN PLANNING]

#### 2.1 Vision

Transform the platform from a functional grid system into a high-performance, offline-capable, scalable application capable of handling 50+ concurrent panels at 60fps.

#### 2.2 Technical Pillars

**Pillar A: Rendering Engine (Week 1)**

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERING ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│  Main Thread          │  Web Worker Thread                   │
│  ─────────────────────│  ─────────────────────               │
│  • React Components   │  • Canvas 2D Context                 │
│  • State Management   │  • OffscreenCanvas                   │
│  • Event Handling     │  • Render Loop (60fps)               │
│  • DOM Synchronization│  • Thumbnail Generation              │
│                       │                                      │
│  Communication:       │  Communication:                      │
│  • postMessage()      │  • onmessage()                       │
│  • Transferables      │  • ImageBitmap transfer              │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Strategy:**
1. **OffscreenCanvas Setup** (Day 1-2)
   - Transfer canvas control to Worker
   - Implement double-buffering
   - Setup ResizeObserver for efficient resizing

2. **Worker Communication Protocol** (Day 3-4)
   - Message types: INIT, RENDER, UPDATE_DRAG, RESIZE, DESTROY
   - Binary data transfer for performance
   - Error handling and fallback to main thread

3. **Hybrid Rendering Mode** (Day 5)
   - DOM mode: <15 panels (full interactivity)
   - Canvas mode: 15+ panels (60fps rendering)
   - Automatic switching based on panel count

**Pillar B: Virtual Scrolling (Week 1-2)**

```typescript
// Virtual Grid Architecture
interface VirtualGridConfig {
  overscan: 3,           // Render 3 rows beyond viewport
  estimateSize: () => 80, // Row height estimation
  measureElement: true,   // Dynamic height support
  scrollPaddingEnd: 100,  // Bottom padding
}

// Panel lifecycle
MOUNT → VISIBLE → OFFSCREEN → VIRTUALIZED → UNMOUNT
        ↑_________|_____________|
              LRU eviction managed
```

**Pillar C: State Management Optimization (Week 2)**

```typescript
// Zustand store splitting for performance
interface RootStore {
  // Static - rarely changes
  layout: LayoutConfig;
  
  // Dynamic - frequent changes
  panels: Panel[];
  positions: Map<string, Position>;
  
  // Ephemeral - UI state only
  ui: {
    dragging: boolean;
    hoveredPanel: string | null;
    contextMenu: ContextMenuState;
  };
}

// Separate stores prevent cascade re-renders
const useLayoutStore = create(...);    // Static
const usePanelStore = create(...);     // Dynamic  
const useUIStore = create(...);        // Ephemeral
```

#### 2.3 Deliverables Checklist

**Week 1: Core Performance**
- [ ] `GridWorker.ts` - Web Worker implementation
- [ ] `useOffscreenCanvas.ts` - Hook for canvas management
- [ ] `VirtualGrid.tsx` - TanStack virtual integration
- [ ] `LRUCache.ts` - Panel lifecycle management
- [ ] 60fps verified with 50 panels

**Week 2: PWA & Polish**
- [ ] `service-worker.ts` - Offline capability
- [ ] `manifest.json` - PWA configuration
- [ ] Code splitting by hub route
- [ ] Bundle size <500KB initial
- [ ] Lighthouse score >90

#### 2.4 Risk Mitigation

| Risk | Probability | Impact | Strategy |
|------|-------------|--------|----------|
| Safari OffscreenCanvas support | Medium | High | Fallback to main thread Canvas |
| Memory leaks in Workers | Low | High | Automated heap profiling tests |
| Service Worker cache invalidation | Medium | Medium | Versioned cache names, clear on update |
| Bundle splitting complexity | Medium | Low | Preload hints, gradual rollout |

---

### PHASE 3 — SIMULATION INTEGRATION [FUTURE]

#### 3.1 Vision

Bridge the gap between web analytics and Godot 4 simulation, enabling deterministic tactical scenario replay and "what-if" analysis directly within the web interface.

#### 3.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 SIMULATION BRIDGE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Web Platform (React)          Godot 4 (Web Export)            │
│   ─────────────────────         ─────────────────────            │
│                                                                  │
│   ┌──────────────────┐         ┌──────────────────┐             │
│   │  Grid Interface  │◄───────►│  Simulation View │             │
│   └────────┬─────────┘  WASM   └────────┬─────────┘             │
│            │                            │                       │
│   ┌────────▼─────────┐         ┌────────▼─────────┐             │
│   │  Scenario Builder│         │  Match Engine    │             │
│   │  • Team comps    │         │  • 20 TPS tick   │             │
│   │  • Loadouts      │         │  • Deterministic │             │
│   │  • Map positions │         │  • Replay system │             │
│   └────────┬─────────┘         └────────┬─────────┘             │
│            │                            │                       │
│   ┌────────▼────────────────────────────▼─────────┐             │
│   │          Shared State Protocol               │             │
│   │  • JSON Scenario Format                      │             │
│   │  • Compressed Replay Data                    │             │
│   │  • Bi-directional events                     │             │
│   └───────────────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3 Key Capabilities

**A. Scenario Builder**
- Visual map editor (SVG-based)
- Agent placement with validation
- Economy state configuration
- Round situation setup

**B. Deterministic Playback**
- Frame-by-frame navigation
- Slow-motion analysis (0.25x, 0.5x, 1x, 2x)
- Event bookmarking
- Export to video/GIF

**C. "What-If" Engine**
- Parameter variation testing
- Statistical outcome modeling
- A/B scenario comparison
- Monte Carlo simulation (10,000 iterations)

#### 3.4 Technical Specifications

```javascript
// Scenario JSON Schema
interface SimulationScenario {
  version: "1.0";
  metadata: {
    map: string;
    round: number;
    score: [number, number];
  };
  teams: {
    attackers: PlayerConfig[];
    defenders: PlayerConfig[];
  };
  economy: {
    teamA: number;
    teamB: number;
  };
  initialState: WorldState;
}

// Godot Communication Protocol
enum GodotMessageType {
  LOAD_SCENARIO = "LOAD_SCENARIO",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  SEEK = "SEEK",
  STEP = "STEP",
  EXPORT = "EXPORT",
  EVENT = "EVENT",  // Godot → Web
}
```

---

### PHASE 4 — ADVANCED ANALYTICS & ML [FUTURE]

#### 4.1 Vision

Implement production-grade machine learning pipelines for player performance prediction, match outcome forecasting, and investment-grade player valuation.

#### 4.2 ML Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  ML PIPELINE ARCHITECTURE                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Data Layer → Feature Engineering → Training → Inference    │
│                                                               │
│  ┌─────────┐    ┌─────────────┐    ┌─────────┐   ┌────────┐ │
│  │Raw Data │───►│Feature Store│───►│ Model   │──►│ API    │ │
│  │(37 fld)│    │(transforms) │    │ Training│   │ Serving│ │
│  └─────────┘    └─────────────┘    └────┬────┘   └───┬────┘ │
│       ▲                                  │            │      │
│       │                                  ▼            ▼      │
│       │                            ┌─────────┐   ┌────────┐  │
│       └────────────────────────────│Metrics  │   │Predict │  │
│                                    │(MLflow)│   │(cached)│  │
│                                    └─────────┘   └────────┘  │
│                                                               │
│  Models:                                                      │
│  • SimRating v2 (XGBoost)                                    │
│  • Match Outcome (Ensemble)                                  │
│  • Player Trajectory (LSTM)                                  │
│  • Clutch Probability (Neural)                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### 4.3 Prediction Capabilities

| Prediction Type | Model | Accuracy Target | Latency |
|-----------------|-------|-----------------|---------|
| Match Winner | Ensemble XGBoost | 68% | <50ms |
| Map Score | Poisson Regression | ±1.5 rounds | <50ms |
| Player Performance | LSTM | ±5% ACS | <100ms |
| Clutch Probability | Neural Net | 72% | <20ms |

#### 4.4 Confidence Scoring

```python
class ConfidenceCalculator:
    """
    Multi-factor confidence scoring for predictions
    """
    def calculate(self, prediction: Prediction) -> ConfidenceScore:
        factors = {
            'data_quality': self._data_quality_score(prediction.inputs),
            'sample_size': self._sample_size_score(prediction.training_samples),
            'model_uncertainty': prediction.uncertainty_quantile,
            'recent_performance': self._recency_weight(prediction.timestamp),
            'context_match': self._context_similarity(prediction.scenario),
        }
        
        # Weighted combination
        confidence = sum(
            factors[k] * weights[k] 
            for k in factors
        )
        
        return ConfidenceScore(
            value=confidence,
            tier=self._tier_from_score(confidence),
            factors=factors
        )
```

---

### PHASE 5 — ECOSYSTEM EXPANSION [FUTURE]

#### 5.1 Vision

Expand beyond Valorant to support Counter-Strike 2 and open the platform to third-party developers via an API marketplace.

#### 5.2 Multi-Game Architecture

```typescript
// Game-agnostic data model
interface GameAdapter {
  game: 'valorant' | 'cs2';
  
  // Data extraction
  extractors: {
    match: MatchExtractor;
    player: PlayerExtractor;
    economy: EconomyExtractor;
  };
  
  // Metric normalization
  normalizers: {
    combatScore: (raw: number) => NormalizedScore;
    economyRating: (raw: number) => NormalizedRating;
  };
  
  // Visualization adapters
  visualizers: {
    map: MapVisualizer;
    agent: AgentVisualizer; // Weapon for CS2
  };
}

// Unified schema across games
interface UnifiedPlayerStats {
  game: string;
  playerId: string;
  normalizedMetrics: {
    combat: number;      // ACS / ADR normalized
    survival: number;    // KAST / KDR normalized
    economy: number;     // Eco rating normalized
    impact: number;      // First bloods, clutches
  };
  gameSpecific: Record<string, unknown>;
}
```

#### 5.3 API Marketplace

**Tier Structure:**

| Tier | Rate Limit | Features | Price |
|------|------------|----------|-------|
| **Free** | 100 req/day | Basic stats, read-only | Free |
| **Developer** | 10K req/day | Full API, webhooks | $29/mo |
| **Pro** | 100K req/day | Predictions, ML access | $99/mo |
| **Enterprise** | Unlimited | Custom models, SLA | Custom |

---

### PHASE 6 — ENTERPRISE SCALE [FUTURE]

#### 6.1 Vision

Transform from single-tenant application to multi-tenant enterprise platform with white-label capabilities, SSO integration, and organizational management.

#### 6.2 Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 MULTI-TENANT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Load Balancer / CDN                     │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │              API Gateway                             │   │
│  │  • Auth (JWT/OAuth2)  • Rate Limiting  • Routing     │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│         ┌───────────┼───────────┐                           │
│         ▼           ▼           ▼                           │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                   │
│  │ Tenant A│   │ Tenant B│   │ Tenant C│   ...              │
│  │ (TSM)   │   │ (TL)    │   │ (C9)    │                   │
│  │         │   │         │   │         │                   │
│  │• Isolate│   │• Isolate│   │• Isolate│                   │
│  │• Custom│   │• Custom│   │• Custom│                   │
│  │• SSO   │   │• SSO   │   │• SSO   │                   │
│  └─────────┘   └─────────┘   └─────────┘                   │
│                                                              │
│  Database: Row-level security per tenant_id                 │
│  Storage: Prefixed buckets per tenant                       │
│  Cache: Namespaced keys per tenant                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 7 — INNOVATION LAB [ONGOING]

#### 7.1 Research Areas

**A. VR Visualization**
- Three.js VR mode for SATOR Square
- Immersive match replay in 3D space
- Hand gesture controls for panel manipulation

**B. Real-Time Inference**
- Live match prediction updates
- WebSocket streaming of probabilities
- In-round adaptation suggestions

**C. Generative AI**
- Natural language query interface
- Automated match summary generation
- Commentary assistance for casters

---

## IV. TECHNICAL STANDARDS FRAMEWORK

### 4.1 Code Quality Gates

**Pre-Commit Requirements:**
```yaml
# .pre-commit-config.yaml equivalent
stages:
  - lint:       # ESLint + Prettier
  - type-check: # TypeScript (when added)
  - test:       # Unit tests
  - build:      # Production build
  - e2e:        # Critical path tests

blocking_rules:
  - test_coverage < 80%
  - lighthouse_score < 85
  - bundle_size > 500KB
  - accessibility_violations > 0
```

### 4.2 Documentation Standards

| Document Type | Location | Template | Review Cycle |
|---------------|----------|----------|--------------|
| ADR (Architecture Decision) | `/docs/adr/` | ADR-NNNN-template.md | Per decision |
| API Spec | `/docs/api/` | OpenAPI 3.0 | Per release |
| Component Docs | Storybook | JSDoc + MDX | Per component |
| Runbooks | `/docs/runbooks/` | Incident response | Quarterly |

### 4.3 Testing Pyramid

```
                    ┌─────────┐
                    │  E2E    │  ← 10% (Cypress/Playwright)
                    │  Tests  │     Critical user journeys
                    ├─────────┤
                    │Integration│ ← 20% (React Testing Library)
                    │  Tests  │     Component interactions
                    ├─────────┤
                    │  Unit   │  ← 70% (Vitest/Jest)
                    │  Tests  │     Pure functions, hooks
                    └─────────┘
```

---

## V. RISK MANAGEMENT FRAMEWORK

### 5.1 Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Web Worker browser incompatibility | Medium | High | Fallback to main thread | Frontend Lead |
| R2 | ML model accuracy below targets | Medium | High | Ensemble methods, human oversight | ML Engineer |
| R3 | Godot Web export performance | Medium | Medium | WASM optimization, LOD | Simulation Lead |
| R4 | Database scaling bottlenecks | Low | High | TimescaleDB partitioning, read replicas | Backend Lead |
| R5 | Third-party API rate limits | High | Medium | Caching, exponential backoff | Data Engineer |
| R6 | Security vulnerabilities | Low | Critical | Regular audits, dependency scanning | Security Lead |

### 5.2 Contingency Plans

**Plan A: Web Worker Fallback**
```javascript
if ('OffscreenCanvas' in window && 'Worker' in window) {
  return new CanvasWorkerRenderer();
} else {
  console.warn('Web Workers not supported, using main thread');
  return new CanvasMainRenderer(); // Fallback
}
```

**Plan B: ML Model Degradation**
```python
if model_confidence < THRESHOLD:
    # Fallback to statistical baseline
    return baseline_prediction(input_data)
```

---

## VI. SUCCESS METRICS & KPIs

### 6.1 Technical Metrics

| Metric | Tool | Target | Alert Threshold |
|--------|------|--------|-----------------|
| Build Time | GitHub Actions | <5 min | >10 min |
| Test Coverage | Vitest | >80% | <70% |
| Bundle Size | webpack-bundle-analyzer | <500KB | >600KB |
| API Latency | Prometheus | <100ms p95 | >200ms |
| Error Rate | Sentry | <0.1% | >1% |

### 6.2 Business Metrics

| Metric | Source | Target | Tracking |
|--------|--------|--------|----------|
| DAU/MAU | PostHog | 30% | Daily |
| Feature Adoption | PostHog | 40% of users | Weekly |
| Churn Rate | Stripe | <5%/mo | Monthly |
| NPS Score | Survey | >50 | Quarterly |
| Support Tickets | Zendesk | <10/week | Weekly |

---

## VII. APPENDICES

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **KCRITR** | 37-field unified schema for player performance |
| **RAR** | Role-Adjusted Replacement - investment metric |
| **SimRating** | Simulation-derived performance rating |
| **SATOR** | Analytics hub (Latin: sower, creator) |
| **ROTAS** | Simulation hub (Latin: wheels, cycles) |
| **4NJZ4** | Core platform philosophy ("Forever and Never Die") |

### Appendix B: Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-03-13 | Use Web Workers for Canvas | 60fps requirement, main thread offload | Approved |
| 2026-03-13 | Adopt TanStack Virtual | Industry standard, better a11y | Approved |
| 2026-03-13 | PWA + Service Worker | Offline requirement for venues | Approved |

### Appendix C: Technology Stack

**Frontend:**
- React 18 + Vite + Tailwind CSS
- Zustand (state management)
- TanStack Query (data fetching)
- TanStack Virtual (virtualization)
- Framer Motion (animations)

**Backend:**
- FastAPI (Python)
- PostgreSQL + TimescaleDB
- Redis (caching)
- Celery (background jobs)

**Simulation:**
- Godot 4 (engine)
- GDScript + C# (logic)
- WebAssembly (web export)

**ML/AI:**
- XGBoost (gradient boosting)
- PyTorch (neural networks)
- MLflow (experiment tracking)

---

*End of Master Plan*

**Document Control:**
- Version: 1.0.0
- Next Review: 2026-04-13
- Approved By: [Pending]
