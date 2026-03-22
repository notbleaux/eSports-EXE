[Ver001.000]

# SPECMAPVIEWER V2 — COMPREHENSIVE EXPANSION MASTER PLAN
**Repository:** Libre-X-eSport 4NJZ4 TENET Platform  
**Source Branch:** 7df305d5 (March 16, 2026 — SpecMapViewer v2: Foundation complete)  
**Foreman:** Central coordination node  
**Total Waves:** 8 waves, 28 agents  
**Estimated Duration:** 224 hours (5.5 weeks @ 42h/week)

---

## EXECUTIVE SUMMARY

SpecMapViewer v2 Foundation established the core architecture: DimensionManager, CameraController, Predictive4D renderer, and competitive positioning. This expansion transforms the foundation into a **production-grade tactical visualization platform** with advanced lens systems, real-time data integration, ML-powered predictions, and professional broadcast capabilities.

### Core Concept Expansion

**Foundation (Completed):**
- 5 dimension modes (4D → 2D)
- 6 creative lenses (tension, ripple, blood, wind, doors, secured)
- Camera controller with easing
- Basic WebGL rendering

**Expansion (This Plan):**
- **20+ specialized lenses** (tactical, analytical, broadcast)
- **Real-time match data integration** (WebSocket live feed)
- **ML prediction layer** (position forecasting, outcome probability)
- **Professional broadcast tools** (observer controls, replay system)
- **Multi-platform support** (web, Godot overlay, mobile companion)
- **Collaborative features** (shared annotations, team coordination)

---

## FOUNDATION ANALYSIS

### Existing Architecture (Branch 7df305d5)

```typescript
// Core Components (Implemented)
├── DimensionManager.ts      // 11,814 bytes
│   ├── 5 dimension modes
│   ├── Camera matrix math
│   └── Projection utilities
├── CameraController.ts      // 9,997 bytes
│   ├── zoomTo, rotateTo, panTo
│   ├── focusOn, flyTo
│   └── Physics-based spring easing
├── Predictive4D.ts          // WebGL renderer
│   └── Particle system foundation
├── mapApi.ts                // REST API
│   └── Static map data
├── PerformanceBenchmark.ts  // FPS monitoring
└── Competitive Analysis.md  // 10,780 bytes
```

### Gaps Identified

1. **Lens System:** Only 6 basic lenses, no analytical depth
2. **Data Integration:** Static JSON, no real-time feeds
3. **ML/AI:** Predictive4D placeholder, no trained models
4. **Multiplayer:** Single-user only, no collaboration
5. **Broadcast:** No observer tools, replay system basic
6. **Mobile:** Desktop-only, no companion app
7. **Accessibility:** Missing WCAG compliance
8. **Performance:** No LOD system, no culling

---

## PHASE 1: ADVANCED LENS SYSTEM (Week 1)

### Wave 1.1: Core Lens Architecture (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 1-A** | Lens Framework Refactor | Plugin architecture, hot-swapping, compositing |
| **Agent 1-B** | Analytical Lenses (6) | Heatmap, economy, ability usage, trade efficiency |
| **Agent 1-C** | Tactical Lenses (6) | Rotations, timing windows, push probability, clutch zones |

**Lens Plugin Architecture:**

```typescript
// Unified lens system with compositing

export interface LensPlugin {
  id: string;
  name: string;
  category: 'tactical' | 'analytical' | 'broadcast' | 'creative';
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

export interface LensCompositor {
  // Layer multiple lenses
  layers: LensLayer[];
  
  // Blend modes
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'custom';
  
  // Masking
  mask?: LensMask;
  
  // Output
  compose(): WebGLTexture;
}

// 20+ Lenses Planned
const LENS_REGISTRY = {
  // Tactical (8)
  'rotation-predictor': RotationPredictorLens,
  'timing-windows': TimingWindowLens,
  'push-probability': PushProbabilityLens,
  'clutch-zones': ClutchZoneLens,
  'utility-coverage': UtilityCoverageLens,
  'trade-routes': TradeRouteLens,
  'info-gaps': InformationGapLens,
  'eco-pressure': EconomyPressureLens,
  
  // Analytical (8)
  'performance-heatmap': PerformanceHeatmapLens,
  'ability-efficiency': AbilityEfficiencyLens,
  'duel-history': DuelHistoryLens,
  'site-control': SiteControlLens,
  'player-trajectories': TrajectoryLens,
  'damage-dealt': DamageLens,
  'flash-assists': FlashAssistLens,
  'entry-success': EntrySuccessLens,
  
  // Broadcast (4)
  'observer-overlay': ObserverOverlayLens,
  'caster-graphics': CasterGraphicsLens,
  'replay-markers': ReplayMarkerLens,
  'highlight-zones': HighlightZoneLens,
  
  // Creative (6 existing + 4 new)
  'tension': TensionLens,          // Existing
  'ripple': RippleLens,            // Existing
  'blood': BloodLens,              // Existing
  'wind': WindLens,                // Existing
  'doors': DoorLens,               // Existing
  'secured': SecuredLens,          // Existing
  'sparks': SparksLens,            // New
  'smoke-tendrils': SmokeTendrilLens, // New
  'muzzle-flash': MuzzleFlashLens,    // New
  'clutch-glow': ClutchGlowLens       // New
} as const;
```

---

### Wave 1.2: Lens Rendering Engine (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 2-A** | WebGL Shader Library | 20+ fragment/vertex shaders, uniform management |
| **Agent 2-B** | Heatmap & Trajectory Systems | GPU-accelerated heatmaps, path rendering |
| **Agent 2-C** | Particle Effects Engine | Smoke, sparks, muzzle flash, atmospheric effects |

---

## PHASE 2: REAL-TIME DATA PIPELINE (Week 1-2)

### Wave 2.1: WebSocket Live Feed (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 3-A** | WebSocket Client | Connection management, reconnection, message handling |
| **Agent 3-B** | Data Transformers | Pandascore API → SpecMapViewer format |
| **Agent 3-C** | Live Match Integration | Real-time player positions, events, state updates |

**Real-Time Data Architecture:**

```typescript
// WebSocket-based live match feed

export interface LiveMatchFeed {
  matchId: string;
  timestamp: number;
  tick: number;
  
  // Player positions (20 TPS)
  players: PlayerPosition[];
  
  // Events (as they happen)
  events: MatchEvent[];
  
  // Game state
  round: RoundState;
  economy: EconomyState;
  abilities: AbilityState[];
}

export interface PlayerPosition {
  playerId: string;
  team: 'attacker' | 'defender';
  position: Vector3D;
  rotation: number;        // Facing angle
  velocity: Vector3D;      // For prediction
  stance: 'standing' | 'crouching' | 'prone';
  health: number;
  shield: number;
  weapon: string;
  isSpotted: boolean;
}

export type MatchEvent =
  | { type: 'kill'; killer: string; victim: string; weapon: string; headshot: boolean; position: Vector3D }
  | { type: 'ability_used'; player: string; ability: string; position: Vector3D }
  | { type: 'bomb_planted'; player: string; site: string }
  | { type: 'bomb_defused'; player: string }
  | { type: 'round_start'; round: number; teams: TeamState }
  | { type: 'round_end'; winner: 'attacker' | 'defender'; reason: string }
  | { type: 'damage'; attacker: string; victim: string; damage: number; remainingHealth: number };

// WebSocket client with automatic recovery
export class LiveMatchClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  
  constructor(
    private url: string,
    private onMessage: (feed: LiveMatchFeed) => void
  ) {}
  
  connect(): void {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (event) => {
      const feed: LiveMatchFeed = JSON.parse(event.data);
      this.onMessage(feed);
    };
    this.ws.onclose = () => this.scheduleReconnect();
  }
  
  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}
```

---

### Wave 2.2: Historical Data & Replay (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 4-A** | Replay System | Recording, playback, scrubbing, bookmarking |
| **Agent 4-B** | Historical Match DB | IndexedDB storage, query API, export/import |

---

## PHASE 3: ML PREDICTION ENGINE (Week 2-3)

### Wave 3.1: Prediction Models (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 5-A** | Position Prediction | Movement forecasting, rotation detection |
| **Agent 5-B** | Outcome Models | Round win probability, clutch likelihood |
| **Agent 5-C** | Pattern Recognition | Strategy identification, meta detection |

**ML Architecture (TensorFlow.js):**

```typescript
// On-device ML for real-time predictions

export class PredictionEngine {
  private positionModel: tf.LayersModel;
  private outcomeModel: tf.LayersModel;
  private patternModel: tf.LayersModel;
  
  async initialize(): Promise<void> {
    // Load or create models
    this.positionModel = await this.loadPositionModel();
    this.outcomeModel = await this.loadOutcomeModel();
    this.patternModel = await this.loadPatternModel();
  }
  
  // Predict player positions 5 seconds ahead
  async predictPositions(
    recentPositions: PlayerPosition[],
    mapContext: MapContext
  ): Promise<PredictedPosition[]> {
    const input = this.preprocessPositions(recentPositions, mapContext);
    const prediction = this.positionModel.predict(input) as tf.Tensor;
    return this.postprocessPredictions(prediction);
  }
  
  // Predict round outcome probability
  async predictOutcome(
    gameState: GameState,
    roundHistory: RoundResult[]
  ): Promise<OutcomePrediction> {
    const features = this.extractOutcomeFeatures(gameState, roundHistory);
    const probs = this.outcomeModel.predict(features) as tf.Tensor;
    const [attackerWin, defenderWin] = await probs.data();
    
    return {
      attackerWinProbability: attackerWin,
      defenderWinProbability: defenderWin,
      confidence: this.calculateConfidence(gameState),
      keyFactors: this.identifyKeyFactors(gameState)
    };
  }
  
  // Detect strategy patterns
  async detectStrategy(
    roundPositions: PlayerPosition[][]
  ): Promise<StrategyDetection> {
    const embeddings = this.patternModel.predict(
      this.preprocessForPattern(roundPositions)
    ) as tf.Tensor;
    
    return {
      identifiedStrategy: this.classifyStrategy(embeddings),
      confidence: 0.85,
      similarMatches: this.findSimilarStrategies(embeddings)
    };
  }
}

// Prediction outputs for visualization
export interface PredictedPosition {
  playerId: string;
  predictedPath: Vector3D[];      // 5-second horizon
  confidence: number;              // 0-1
  alternativePaths?: Vector3D[][]; // Top-3 alternatives
}

export interface OutcomePrediction {
  attackerWinProbability: number;
  defenderWinProbability: number;
  confidence: number;
  keyFactors: string[];
  situationalAnalysis: string;
}
```

---

### Wave 3.2: Model Training Pipeline (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 6-A** | Data Pipeline | Match parsing, feature extraction, dataset creation |
| **Agent 6-B** | Training & Validation | Model training, evaluation, versioning |

---

## PHASE 4: BROADCAST & OBSERVER TOOLS (Week 3-4)

### Wave 4.1: Observer Controls (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 7-A** | Observer Interface | Professional controls, hotkeys, smooth camera |
| **Agent 7-B** | Caster Graphics | Lower thirds, stat overlays, transition effects |
| **Agent 7-C** | Replay System Enhanced | Slow-mo, frame-by-frame, annotation tools |

**Observer Control System:**

```typescript
// Professional broadcast controls

export class ObserverController {
  private camera: CameraController;
  private players: Map<string, Player>;
  private isBroadcastMode: boolean = false;
  
  // Observer hotkeys
  hotkeys = {
    '1-9': 'focus_player',           // Number keys for players
    'space': 'toggle_playback',      // Play/pause
    'arrow_left': 'frame_back',      // Previous frame
    'arrow_right': 'frame_forward',  // Next frame
    'f': 'follow_player',            // Smooth follow
    'r': 'show_replay',              // Instant replay
    't': 'show_trajectory',          // Toggle trajectories
    'm': 'switch_map_view',          // 2D/3D toggle
    'l': 'cycle_lens',               // Next lens
    'c': 'clear_graphics'            // Hide overlays
  };
  
  // Smooth player following
  async followPlayer(playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Predictive camera movement
    this.camera.flyTo({
      target: this.predictPosition(player, 500), // 500ms ahead
      zoom: this.calculateOptimalZoom(player),
      rotation: this.calculateDramaticAngle(player),
      duration: 800,
      easing: 'smooth'
    });
  }
  
  // Automatic camera direction
  autoDirect(): void {
    const importantEvent = this.findMostImportantEvent();
    if (importantEvent) {
      this.focusOnEvent(importantEvent);
    }
  }
  
  // Caster graphics control
  showCasterGraphic(type: 'player_card' | 'stat_comparison' | 'prediction', data: unknown): void {
    const graphic = this.createGraphic(type, data);
    graphic.animateIn('slide_up', 300);
    
    // Auto-dismiss after 5 seconds unless pinned
    if (!graphic.isPinned) {
      setTimeout(() => graphic.animateOut('fade', 200), 5000);
    }
  }
}
```

---

### Wave 4.2: Multi-Stream Output (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 8-A** | Stream Integration | OBS plugin, WebRTC output, quality presets |
| **Agent 8-B** | Multi-View Layouts | Picture-in-picture, split screen, team views |

---

## PHASE 5: COLLABORATION & SOCIAL (Week 4)

### Wave 5.1: Shared Annotations (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 9-A** | Annotation System | Draw on map, save bookmarks, share links |
| **Agent 9-B** | Real-Time Collaboration | WebRTC data channels, cursor sync, permissions |

**Collaboration Features:**

```typescript
// Multi-user collaborative viewing

export interface Annotation {
  id: string;
  author: User;
  type: 'arrow' | 'circle' | 'text' | 'freehand';
  position: Vector3D;
  content: string;
  color: string;
  timestamp: number;
  isPublic: boolean;
}

export class CollaborationSession {
  private peers: Map<string, PeerConnection>;
  private annotations: Annotation[];
  private cursors: Map<string, CursorPosition>;
  
  // Join a session
  async join(sessionId: string): Promise<void> {
    const session = await this.api.getSession(sessionId);
    this.connectToPeers(session.peers);
    this.syncAnnotations(session.annotations);
  }
  
  // Share annotation
  shareAnnotation(annotation: Annotation): void {
    this.annotations.push(annotation);
    this.broadcastToPeers({
      type: 'annotation_added',
      data: annotation
    });
  }
  
  // Follow another user's view
  followUser(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.onCameraChange = (cameraState) => {
        this.camera.syncTo(cameraState, { smooth: true });
      };
    }
  }
  
  // Team coordination mode
  enableTeamMode(): void {
    // Show team cursor positions
    // Enable shared drawing
    // Sync lens selections
    // Coordinate playback
  }
}
```

---

### Wave 5.2: Export & Sharing (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 10-A** | Export System | Video clips, GIFs, data exports, shareable links |
| **Agent 10-B** | Social Integration | Twitter/X cards, Discord embeds, clip highlights |

---

## PHASE 6: MOBILE COMPANION (Week 5)

### Wave 6.1: Mobile Viewer (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 11-A** | Mobile UI/UX | Touch controls, responsive lenses, gesture navigation |
| **Agent 11-B** | Companion Features | Second screen, stats overlay, alert notifications |

---

### Wave 6.2: Mobile Sync (1 agent)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 12** | Cross-Device Sync | QR pairing, state synchronization, handoff |

---

## PHASE 7: PERFORMANCE & OPTIMIZATION (Week 5-6)

### Wave 7.1: Rendering Optimization (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 13-A** | LOD & Culling | Level-of-detail, frustum culling, occlusion queries |
| **Agent 13-B** | WebGL Optimization | Instancing, texture atlasing, shader minification |

---

### Wave 7.2: Memory & Loading (1 agent)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 14** | Asset Pipeline | Streaming, compression, caching, progressive loading |

---

## PHASE 8: TESTING & DOCUMENTATION (Week 6)

### Wave 8.1: Testing Suite (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 15-A** | Unit & Integration Tests | Jest/Vitest coverage, WebGL mocking |
| **Agent 15-B** | E2E & Visual Tests | Playwright, screenshot comparison, performance budgets |

---

### Wave 8.2: Documentation (1 agent)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 16** | Documentation | API docs, lens development guide, observer manual |

---

## AGENT ASSIGNMENT SUMMARY

```
PHASE 1: Advanced Lens System (8 agents)
├── Wave 1.1 (3): Lens Architecture
│   ├── Agent 1-A: Framework Refactor
│   ├── Agent 1-B: Analytical Lenses
│   └── Agent 1-C: Tactical Lenses
└── Wave 1.2 (3): Rendering Engine
    ├── Agent 2-A: WebGL Shaders
    ├── Agent 2-B: Heatmap/Trajectory
    └── Agent 2-C: Particle Effects

PHASE 2: Real-Time Data (5 agents)
├── Wave 2.1 (3): WebSocket Pipeline
│   ├── Agent 3-A: WS Client
│   ├── Agent 3-B: Data Transformers
│   └── Agent 3-C: Live Integration
└── Wave 2.2 (2): Replay System
    ├── Agent 4-A: Recording/Playback
    └── Agent 4-B: Historical DB

PHASE 3: ML Prediction (5 agents)
├── Wave 3.1 (3): Prediction Models
│   ├── Agent 5-A: Position Prediction
│   ├── Agent 5-B: Outcome Models
│   └── Agent 5-C: Pattern Recognition
└── Wave 3.2 (2): Training Pipeline
    ├── Agent 6-A: Data Pipeline
    └── Agent 6-B: Training/Validation

PHASE 4: Broadcast Tools (5 agents)
├── Wave 4.1 (3): Observer Controls
│   ├── Agent 7-A: Observer Interface
│   ├── Agent 7-B: Caster Graphics
│   └── Agent 7-C: Replay Enhanced
└── Wave 4.2 (2): Multi-Stream
    ├── Agent 8-A: Stream Integration
    └── Agent 8-B: Multi-View Layouts

PHASE 5: Collaboration (4 agents)
├── Wave 5.1 (2): Annotations
│   ├── Agent 9-A: Annotation System
│   └── Agent 9-B: Real-Time Collab
└── Wave 5.2 (2): Export/Sharing
    ├── Agent 10-A: Export System
    └── Agent 10-B: Social Integration

PHASE 6: Mobile Companion (3 agents)
├── Wave 6.1 (2): Mobile Viewer
│   ├── Agent 11-A: Mobile UI/UX
│   └── Agent 11-B: Companion Features
└── Wave 6.2 (1): Mobile Sync
    └── Agent 12: Cross-Device Sync

PHASE 7: Performance (3 agents)
├── Wave 7.1 (2): Rendering Opt
│   ├── Agent 13-A: LOD & Culling
│   └── Agent 13-B: WebGL Opt
└── Wave 7.2 (1): Asset Pipeline
    └── Agent 14: Streaming/Loading

PHASE 8: Testing & Docs (3 agents)
├── Wave 8.1 (2): Testing
│   ├── Agent 15-A: Unit/Integration
│   └── Agent 15-B: E2E/Visual
└── Wave 8.2 (1): Documentation
    └── Agent 16: Complete Docs

TOTAL: 36 agents across 8 phases
```

---

## TECHNICAL ARCHITECTURE

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SpecMapViewer v2                          │
│                     (Expansion Architecture)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Web App    │  │   Godot      │  │   Mobile     │           │
│  │   (React)    │  │   Overlay    │  │   Companion  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────┐           │
│  │              SpecMapViewer Core                 │           │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │           │
│  │  │ Dimension│ │  Lens    │ │  Camera  │        │           │
│  │  │ Manager  │ │Compositor│ │Controller│        │           │
│  │  └──────────┘ └──────────┘ └──────────┘        │           │
│  │                                                 │           │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │           │
│  │  │ Prediction│ │   Live   │ │  Replay  │        │           │
│  │  │  Engine  │ │  Feed    │ │  System  │        │           │
│  │  └──────────┘ └──────────┘ └──────────┘        │           │
│  └────────────────────────────────────────────────┘           │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────┐           │
│  │              Data Layer                          │           │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │           │
│  │  │WebSocket │ │   ML     │ │ IndexedDB│        │           │
│  │  │  Server  │ │  Models  │ │  Storage │        │           │
│  │  └──────────┘ └──────────┘ └──────────┘        │           │
│  └────────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## QUALITY GATES

### Gate 1: Lens System (End Phase 1)
- [ ] 20+ lenses functional
- [ ] Lens compositing works
- [ ] 60fps maintained with 3+ lenses

### Gate 2: Real-Time Data (End Phase 2)
- [ ] WebSocket <100ms latency
- [ ] Replay scrubbing <50ms response
- [ ] Offline mode functional

### Gate 3: ML Engine (End Phase 3)
- [ ] Position prediction >70% accuracy
- [ ] Outcome prediction calibrated
- [ ] Models <10MB each

### Gate 4: Broadcast Ready (End Phase 4)
- [ ] Observer controls responsive
- [ ] Stream output 60fps
- [ ] Caster graphics professional

### Gate 5: Collaboration (End Phase 5)
- [ ] 10+ concurrent users
- [ ] Annotations sync <100ms
- [ ] Export formats work

### Gate 6: Mobile Functional (End Phase 6)
- [ ] Touch controls intuitive
- [ ] Battery usage acceptable
- [ ] Cross-device sync works

### Gate 7: Performance (End Phase 7)
- [ ] Lighthouse >90 performance
- [ ] Mobile 30fps minimum
- [ ] Desktop 60fps with 5 lenses

### Gate 8: Release Ready (End Phase 8)
- [ ] Test coverage >80%
- [ ] Documentation complete
- [ ] No critical bugs

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| ML model accuracy | Fallback to heuristic rules, continuous training |
| WebSocket reliability | Reconnection logic, offline queue |
| WebGL compatibility | Canvas2D fallback, feature detection |
| Performance on low-end | Adaptive quality, LOD system |
| Mobile battery | Frame rate limiting, GPU pause |

---

## SUCCESS CRITERIA

- **Lens System:** 20+ lenses, compositable, 60fps
- **Real-Time:** <100ms latency, replay system
- **ML Predictions:** Useful accuracy, fast inference
- **Broadcast:** Professional observer tools
- **Collaboration:** Multi-user, shareable
- **Mobile:** Companion app functional
- **Performance:** Adaptive quality, fast loading

---

*Foreman: Update with [VerMMM.mmm] on each revision.*
*Agents: Follow this plan, submit drafts for review.*
