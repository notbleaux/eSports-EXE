[Ver002.000]

# TeNET CS Grenade Visualizer — Enhanced Technical Design

**Status**: Enhanced Specification  
**Date**: 2026-03-22  
**Game**: Counter-Strike 2 / CS:GO  
**Scope**: Training tool with tick-accurate grenade trajectories, heatmaps, and tactical overlays

---

## Executive Summary

This enhanced specification builds upon the base grenade visualizer to create a professional-grade training tool. It combines HLTV-level statistical depth with VLR.gg-style usability, featuring synchronized visualizations driven by a unified timeline engine.

**Key Innovations**:
- Unified timeline drives all visualizations (heatmap, arcs, player positions)
- Dual-mode interface (Training vs Analysis)
- Real-time collision detection for lineup validation
- Historical lineup library with success rates

---

## 1. Feature Matrix

| Feature | Training Mode | Analysis Mode | Description |
|---------|---------------|---------------|-------------|
| Grenade Arcs | ✅ | ✅ | Quadratic Bézier trajectory visualization |
| Landing Zones | ✅ | ✅ | Heatmap of grenade landings |
| Player Positions | ✅ | ✅ | Team positions at throw time |
| Throw Mechanics | ✅ | ❌ | Lineup guides, crosshair placement |
| Damage Calculation | ❌ | ✅ | Expected damage, effectiveness scoring |
| Historical Comparison | ❌ | ✅ | Compare to pro lineups |
| Round Context | Limited | Full | Economy, score, round type |
| Sync to Replay | ❌ | ✅ | Scrub timeline, see arcs animate |

---

## 2. Enhanced Data Schema

### 2.1 GrenadeEvent (Extended)

```typescript
interface GrenadeEvent {
  // Core fields (from base spec)
  id: string;
  matchId: string;
  roundNumber: number;
  tick: number;
  playerId: string;
  playerName: string;
  teamId: "CT" | "T";
  grenadeType: "smoke" | "flash" | "he" | "molotov" | "decoy";
  startPosition: Vector3;
  endPosition: Vector3;
  flightTimeMs: number;
  detonatedAtTick?: number;
  
  // Enhanced fields
  throwAngle: { pitch: number; yaw: number };  // For lineup recreation
  throwVelocity: number;  // Initial throw strength
  
  // Context
  roundContext: {
    scoreCT: number;
    scoreT: number;
    roundType: "pistol" | "eco" | "force" | "full";
    ctMoney: number;
    tMoney: number;
  };
  
  // Tactical
  intendedTarget?: string;  // "A site", "B site", "Mid"
  tacticalPurpose?: "execute" | "retake" | "delay" | "info";
  
  // Effectiveness (calculated)
  effectiveness: {
    enemiesFlashed?: number;
    flashDurationAvg?: number;
    damageDealt?: number;
    damagePotential?: number;
    smokesBlocked?: number;
    molotovAreaSeconds?: number;
    affectedPlayerIds: string[];
  };
  
  // Historical
  similarLineups: {  // AI-matched similar throws
    lineupId: string;
    similarity: number;  // 0-1
    proPlayer?: string;
    successRate: number;
  }[];
  
  // Media
  replaySegment?: {
    startTick: number;
    endTick: number;
    videoUrl?: string;
  };
}
```

### 2.2 Lineup Library Schema

```typescript
interface LineupLibrary {
  id: string;
  mapName: string;
  grenadeType: "smoke" | "flash" | "he" | "molotov";
  
  // Positioning
  throwPosition: Vector3;
  throwAngle: { pitch: number; yaw: number };
  jumpThrow: boolean;
  runThrow: boolean;
  
  // Target
  targetName: string;  // "A site smoke from T spawn"
  targetPosition: Vector3;
  landingZone: {
    center: Vector3;
    radius: number;  // Variance in landing position
  };
  
  // Guides
  setupGuide: {
    positionImage: string;  // URL to reference image
    crosshairImage: string;
    description: string;
    videoUrl?: string;
  };
  
  // Metadata
  difficulty: "easy" | "medium" | "hard" | "pro";
  consistency: number;  // 0-1 success rate
  createdBy?: string;
  verified: boolean;  // Pro player verified
  
  // Stats
  usageCount: number;
  successRate: number;
  avgDamage?: number;
  
  // Tags
  tags: string[];  // ["execute", "retake", "default", "pro"]
}
```

---

## 3. Rendering Architecture

### 3.1 Unified Rendering Pipeline

```
Timeline State (tick, playback speed)
    │
    ├──▶ Canvas Layer 1: Map Background (static)
    │
    ├──▶ Canvas Layer 2: Heatmap (dynamic opacity)
    │
    ├──▶ Canvas Layer 3: Grenade Arcs (animated)
    │
    ├──▶ Canvas Layer 4: Player Positions (dynamic)
    │
    └──▶ Canvas Layer 5: UI Overlays (interactive)
```

### 3.2 Canvas Layer System

```typescript
interface CanvasLayer {
  id: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  zIndex: number;
  render: (state: TimelineState) => void;
  clear: () => void;
}

class GrenadeVisualizer {
  private layers: Map<string, CanvasLayer>;
  private timeline: TimelineState;
  
  constructor(container: HTMLElement) {
    this.layers = new Map();
    this.setupLayers();
    this.startRenderLoop();
  }
  
  private setupLayers() {
    // Layer 1: Static map
    this.addLayer({
      id: 'map',
      zIndex: 1,
      render: (state) => this.renderMap()
    });
    
    // Layer 2: Heatmap (landing zones)
    this.addLayer({
      id: 'heatmap',
      zIndex: 2,
      render: (state) => this.renderHeatmap(state)
    });
    
    // Layer 3: Grenade arcs
    this.addLayer({
      id: 'arcs',
      zIndex: 3,
      render: (state) => this.renderArcs(state)
    });
    
    // Layer 4: Player positions
    this.addLayer({
      id: 'players',
      zIndex: 4,
      render: (state) => this.renderPlayers(state)
    });
    
    // Layer 5: Interactive UI
    this.addLayer({
      id: 'ui',
      zIndex: 5,
      render: (state) => this.renderUI(state)
    });
  }
  
  private renderArcs(state: TimelineState) {
    const visibleGrenades = this.getVisibleGrenades(state.tick);
    
    visibleGrenades.forEach(grenade => {
      const progress = this.calculateProgress(grenade, state.tick);
      const points = this.getArcPoints(grenade);
      
      // Draw trail
      this.drawTrail(points, progress, grenade.grenadeType);
      
      // Draw current position
      if (progress < 1) {
        this.drawGrenadeMarker(points[Math.floor(progress * points.length)], grenade);
      }
      
      // Draw detonation
      if (progress >= 1 && grenade.detonatedAtTick === state.tick) {
        this.drawDetonation(grenade);
      }
    });
  }
  
  private drawTrail(points: Vector3[], progress: number, type: GrenadeType) {
    const visiblePoints = points.slice(0, Math.floor(progress * points.length));
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.getGrenadeColor(type);
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash(this.getLineDash(type));
    
    visiblePoints.forEach((point, i) => {
      const canvasPos = this.worldToCanvas(point);
      if (i === 0) this.ctx.moveTo(canvasPos.x, canvasPos.y);
      else this.ctx.lineTo(canvasPos.x, canvasPos.y);
    });
    
    this.ctx.stroke();
  }
}
```

### 3.3 Heatmap Rendering

```typescript
interface HeatmapConfig {
  radius: number;      // Pixel radius for each point
  blur: number;        // Gaussian blur amount
  maxOpacity: number;  // Maximum heat opacity
  gradient: { stop: number; color: string }[];
}

const defaultHeatmapConfig: HeatmapConfig = {
  radius: 25,
  blur: 15,
  maxOpacity: 0.6,
  gradient: [
    { stop: 0.0, color: 'rgba(0, 209, 255, 0)' },
    { stop: 0.25, color: 'rgba(0, 209, 255, 0.3)' },
    { stop: 0.5, color: 'rgba(0, 209, 255, 0.5)' },
    { stop: 0.75, color: 'rgba(0, 209, 255, 0.7)' },
    { stop: 1.0, color: 'rgba(0, 209, 255, 0.9)' }
  ]
};

function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  landingZones: Vector3[],
  config: HeatmapConfig
) {
  // Create offscreen canvas for heatmap
  const heatmapCanvas = document.createElement('canvas');
  heatmapCanvas.width = ctx.canvas.width;
  heatmapCanvas.height = ctx.canvas.height;
  const heatCtx = heatmapCanvas.getContext('2d')!;
  
  // Draw intensity points
  landingZones.forEach(zone => {
    const pos = worldToCanvas(zone);
    const gradient = heatCtx.createRadialGradient(
      pos.x, pos.y, 0,
      pos.x, pos.y, config.radius
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    heatCtx.fillStyle = gradient;
    heatCtx.fillRect(
      pos.x - config.radius,
      pos.y - config.radius,
      config.radius * 2,
      config.radius * 2
    );
  });
  
  // Apply gradient mapping
  const imageData = heatCtx.getImageData(0, 0, heatmapCanvas.width, heatmapCanvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      const intensity = alpha / 255;
      const color = getGradientColor(config.gradient, intensity);
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = intensity * config.maxOpacity * 255;
    }
  }
  
  heatCtx.putImageData(imageData, 0, 0);
  
  // Composite to main canvas
  ctx.drawImage(heatmapCanvas, 0, 0);
}
```

---

## 4. User Interface Design

### 4.1 Dual-Mode Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Mode Toggle: [Training] [Analysis]                      Export  │
├─────────────────────────────────────────────────────────────────┤
│  Map Selector: [de_dust2 ▼] [de_mirage] [de_inferno] ...       │
├──────────────────┬──────────────────────────┬───────────────────┤
│                  │                          │                   │
│  Lineup Library  │    Canvas Renderer       │   Context Panel   │
│  ─────────────   │    ───────────────       │   ─────────────   │
│  📁 Smokes       │                          │   Round Info      │
│  📁 Flashes      │    [Map Background]      │   • Score: 14-13  │
│  📁 HE Grenades  │    [Heatmap Layer]       │   • Round: 28/30  │
│  📁 Molotovs     │    [Grenade Arcs]        │   • Type: Full buy│
│                  │    [Player Positions]    │                   │
│  [+ Add Lineup]  │    [UI Overlays]         │   Effectiveness   │
│                  │                          │   • Enemies flashed: 3│
│  Filter:         │                          │   • Avg duration: 2.1s│
│  [#execute]      │                          │                   │
│  [#retake]       │                          │   Similar Lineups │
│  [#pro]          │                          │   • s1mple (95%)  │
│                  │                          │   • dev1ce (92%)  │
│                  │                          │                   │
├──────────────────┴──────────────────────────┴───────────────────┤
│  Unified Timeline                                                │
│  [Round Start] [Kill] [Smoke] [Plant] [Kill] [Current ▶] [End]  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Training Mode Features

**Lineup Practice**:
- Ghost overlay showing throw position
- Crosshair placement guide
- Real-time feedback on throw accuracy
- Success/failure tracking

**Drill Mode**:
- Timed challenges (e.g., "Smoke A site in under 5 seconds")
- Progressive difficulty
- Score tracking and personal bests

### 4.3 Analysis Mode Features

**Round Context**:
- Economy visualization
- Score timeline
- Player form indicators

**Effectiveness Scoring**:
```typescript
function calculateEffectiveness(grenade: GrenadeEvent): number {
  let score = 0;
  
  switch (grenade.grenadeType) {
    case 'flash':
      score += (grenade.effectiveness.enemiesFlashed || 0) * 15;
      score += (grenade.effectiveness.flashDurationAvg || 0) * 10;
      break;
      
    case 'he':
      score += (grenade.effectiveness.damageDealt || 0) * 0.5;
      score += (grenade.effectiveness.damagePotential || 0) * 0.3;
      break;
      
    case 'smoke':
      score += (grenade.effectiveness.smokesBlocked || 0) * 20;
      // Bonus for timing (early round vs late)
      break;
      
    case 'molotov':
      score += (grenade.effectiveness.molotovAreaSeconds || 0) * 5;
      break;
  }
  
  // Normalize to 0-100
  return Math.min(100, score);
}
```

---

## 5. Integration Points

### 5.1 Timeline Synchronization

```typescript
interface TimelineSync {
  // Master timeline state
  currentTick: number;
  isPlaying: boolean;
  playbackSpeed: number;
  
  // Subscribers (visualizations that sync to timeline)
  subscribers: Set<(tick: number) => void>;
  
  // Methods
  seek(tick: number): void;
  play(): void;
  pause(): void;
  setSpeed(speed: number): void;
  
  // Notify all subscribers
  notify(): void;
}

// Example subscription
const heatmap = new HeatmapVisualizer();
timeline.subscribe((tick) => {
  heatmap.updateForTick(tick);
});
```

### 5.2 Data Flow

```
User Action (scrub timeline)
    │
    ▼
Timeline State Update
    │
    ├──▶ Grenade Arc Renderer → Canvas
    ├──▶ Heatmap Renderer → Canvas
    ├──▶ Player Position Renderer → Canvas
    └──▶ Context Panel → DOM Update
```

---

## 6. Performance Optimizations

### 6.1 Rendering Optimizations

| Technique | Impact | Implementation |
|-----------|--------|----------------|
| Layered Canvases | Isolates changes | 5 separate canvases, z-indexed |
| RequestAnimationFrame | Smooth 60fps | Single RAF loop for all layers |
| Dirty Rect Checking | Reduces draw calls | Only redraw changed regions |
| Object Pooling | Reduces GC | Reuse grenade marker objects |
| Web Workers | Non-blocking | Heatmap calculation in worker |

### 6.2 Data Optimizations

```typescript
// Spatial indexing for fast lookups
class SpatialIndex {
  private grid: Map<string, GrenadeEvent[]>;
  private cellSize: number = 100; // World units
  
  insert(grenade: GrenadeEvent) {
    const key = this.getCellKey(grenade.startPosition);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(grenade);
  }
  
  query(position: Vector3, radius: number): GrenadeEvent[] {
    // Return grenades in nearby cells
    // Much faster than iterating all grenades
  }
}
```

---

## 7. File Structure

```
platform/tenet-cs/
├── src/
│   ├── components/
│   │   ├── GrenadeVisualizer.tsx    # Main component
│   │   ├── LineupLibrary.tsx        # Lineup browser
│   │   ├── ThrowGuide.tsx           # Training overlay
│   │   └── EffectivenessPanel.tsx   # Stats panel
│   ├── canvas/
│   │   ├── CanvasEngine.ts          # Layer management
│   │   ├── ArcRenderer.ts           # Grenade arc drawing
│   │   ├── HeatmapRenderer.ts       # Heatmap generation
│   │   └── PlayerRenderer.ts        # Player positions
│   ├── timeline/
│   │   ├── TimelineEngine.ts        # Master timeline
│   │   └── SyncManager.ts           # Synchronization
│   ├── data/
│   │   ├── LineupStore.ts           # Lineup database
│   │   └── SpatialIndex.ts          # Spatial queries
│   └── utils/
│       ├── coordinates.ts           # World/canvas transforms
│       └── effectiveness.ts         # Scoring algorithms
├── data/
│   ├── lineups/                     # JSON lineup definitions
│   └── maps/                        # Map images and metadata
└── tests/
    └── visualizer.test.ts
```

---

## 8. Acceptance Criteria

### 8.1 Functional Requirements

- [ ] Render 50+ grenade arcs at 60fps
- [ ] Timeline scrub updates all visualizations within 16ms
- [ ] Heatmap generates in <100ms for 1000+ landings
- [ ] Lineup library supports 500+ lineups
- [ ] Effectiveness scores calculate in real-time

### 8.2 UX Requirements

- [ ] Mode toggle switches in <200ms
- [ ] Training mode shows ghost overlay with <50ms latency
- [ ] Mobile: Touch gestures for timeline scrubbing
- [ ] Keyboard: Arrow keys for frame-by-frame navigation

### 8.3 Accessibility Requirements

- [ ] ARIA labels on all interactive elements
- [ ] High contrast mode for colorblind users
- [ ] Screen reader announces grenade events
- [ ] Reduced motion: Disable arc animations

---

*Enhanced specification for professional-grade training tool*  
*Builds upon: TECH_DESIGN_TENET_CS.md v1.0*
