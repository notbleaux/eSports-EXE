[Ver001.000]

# Technical Design: TeNET CS Grenade Visualizer

**Scope:** Grenade arc rendering, trajectory interpolation, tick-accurate scrubber, and map coordinate mapping.

---

## 1. Data Schema

### Grenade Event Record
```typescript
interface GrenadeEvent {
  id: string;              // UUID v4
  matchId: string;         // Reference to match
  roundNumber: number;     // 1-24+ for MR12
  tick: number;            // Tick relative to round start
  playerId: string;        // Who threw
  playerName: string;
  teamId: "CT" | "T";
  grenadeType: "smoke" | "flash" | "he" | "molotov" | "decoy";
  startPosition: Vector3;  // {x, y, z} in game units
  endPosition: Vector3;
  flightTimeMs: number;    // Total flight duration
  detonatedAtTick?: number;
  effectiveness?: number;  // 0-1 calculated metric
  affectedPlayerIds?: string[]; // Players hit by flash/smoke/molotov
}

interface Vector3 {
  x: number;  // Range: -3000 to 3000 (de_dust2 roughly)
  y: number;  // Altitude, usually 0-2000
  z: number;  // Range: -3000 to 3000
}
```

### Replay Chunk (30s segments)
```typescript
interface ReplayChunk {
  chunkId: string;
  matchId: string;
  roundNumber: number;
  startTick: number;
  endTick: number;
  grenadeEvents: GrenadeEvent[];
  playerPositions: PlayerPosition[]; // 10 players per tick
  tickRate: number; // 64 or 128
}
```

---

## 2. Rendering Algorithm

### 2.1 Bézier Arc Interpolation

Grenade trajectories follow a ballistic parabola. We approximate with quadratic Bézier curves:

```typescript
function getArcPoints(
  start: Vector3,
  end: Vector3,
  flightTimeMs: number,
  tickRate: number
): Vector3[] {
  const peakHeight = Math.max(start.y, end.y) + 200; // Estimate apex
  const controlPoint: Vector3 = {
    x: (start.x + end.x) / 2,
    y: peakHeight,
    z: (start.z + end.z) / 2
  };
  
  const totalTicks = Math.ceil((flightTimeMs / 1000) * tickRate);
  const points: Vector3[] = [];
  
  for (let t = 0; t <= 1; t += 1/totalTicks) {
    // Quadratic Bézier interpolation
    const mt = 1 - t;
    points.push({
      x: mt * mt * start.x + 2 * mt * t * controlPoint.x + t * t * end.x,
      y: mt * mt * start.y + 2 * mt * t * controlPoint.y + t * t * end.y,
      z: mt * mt * start.z + 2 * mt * t * controlPoint.z + t * t * end.z
    });
  }
  
  return points;
}
```

### 2.2 Coordinate Transform (Game → Canvas)

```typescript
interface MapTransform {
  scale: number;      // pixels per game unit
  offsetX: number;    // Canvas origin offset
  offsetY: number;
  mapMin: Vector3;    // Map bounds
  mapMax: Vector3;
}

// Standard radar conventions (top-down view, Y ignored for 2D)
function worldToRadar(
  pos: Vector3,
  transform: MapTransform
): { x: number; y: number } {
  const normalizedX = (pos.x - transform.mapMin.x) / (transform.mapMax.x - transform.mapMin.x);
  const normalizedZ = (pos.z - transform.mapMin.z) / (transform.mapMax.z - transform.mapMin.z);
  
  return {
    x: transform.offsetX + normalizedX * transform.scale * 1024, // Radar is 1024x1024
    y: transform.offsetY + (1 - normalizedZ) * transform.scale * 1024 // Flip Z
  };
}
```

### 2.3 Canvas Rendering Loop

```typescript
// 60fps target, ≤50 arcs visible at once for performance
function renderFrame(
  ctx: CanvasRenderingContext2D,
  currentTick: number,
  grenades: GrenadeEvent[],
  transform: MapTransform,
  mapImage: HTMLImageElement
) {
  // Clear
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw map background
  ctx.drawImage(mapImage, 0, 0);
  
  // Draw arcs
  for (const grenade of grenades) {
    const arcTicks = grenade.detonatedAtTick! - grenade.tick;
    const progress = (currentTick - grenade.tick) / arcTicks;
    
    if (progress < 0 || progress > 1) continue;
    
    const points = getArcPoints(grenade.startPosition, grenade.endPosition, grenade.flightTimeMs, 128);
    const visiblePoints = points.slice(0, Math.floor(progress * points.length));
    
    // Draw path trail
    ctx.beginPath();
    ctx.strokeStyle = getGrenadeColor(grenade.grenadeType);
    ctx.lineWidth = 2;
    
    for (let i = 0; i < visiblePoints.length; i++) {
      const canvasPos = worldToRadar(visiblePoints[i], transform);
      if (i === 0) ctx.moveTo(canvasPos.x, canvasPos.y);
      else ctx.lineTo(canvasPos.x, canvasPos.y);
    }
    ctx.stroke();
    
    // Draw current position
    if (visiblePoints.length > 0) {
      const current = visiblePoints[visiblePoints.length - 1];
      const pos = worldToRadar(current, transform);
      ctx.fillStyle = getGrenadeColor(grenade.grenadeType);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw detonation effect if at end
    if (progress >= 1 && grenade.detonatedAtTick === currentTick) {
      drawDetonationEffect(ctx, grenade);
    }
  }
}
```

---

## 3. Scrubber Component

### 3.1 Props Interface
```typescript
interface TickScrubberProps {
  minTick: number;           // Round start tick
  maxTick: number;           // Round end tick
  currentTick: number;       // Controlled value
  tickRate: number;          // 64 or 128
  onTickChange: (tick: number) => void;
  eventMarkers?: TickMarker[];
}

interface TickMarker {
  tick: number;
  type: "grenade" | "kill" | "plant" | "defuse" | "round_start" | "round_end";
  label?: string;
}
```

### 3.2 Rendering Markers
```typescript
// Markers shown as chips above scrubber
function renderMarkers(
  markers: TickMarker[],
  minTick: number,
  maxTick: number,
  width: number
): JSX.Element {
  return (
    <div className="marker-row">
      {markers.map(m => {
        const percent = ((m.tick - minTick) / (maxTick - minTick)) * 100;
        return (
          <span
            key={`${m.tick}-${m.type}`}
            className={`marker marker-${m.type}`}
            style={{ left: `${percent}%` }}
            title={m.label || m.type}
          />
        );
      })}
    </div>
  );
}
```

---

## 4. Map Configuration

### de_dust2 (Reference Implementation)
```typescript
const de_dust2_transform: MapTransform = {
  scale: 0.5,  // Adjust based on canvas size
  offsetX: 0,
  offsetY: 0,
  mapMin: { x: -2850, y: 0, z: -3200 },
  mapMax: { x: 2200, y: 1800, z: 1800 }
};
```

---

## 5. Performance Budget

| Metric | Target | Limit |
|--------|--------|-------|
| Arc Rendering | 60fps | ≤50 arcs |
| Memory per replay | <50MB | 5min match |
| Initial load | <2s | Map + first chunk |
| Scrubber response | 16ms | RAF sync |

---

## 6. Accessibility

- Keyboard: Arrow keys scrub by 64 ticks, Shift+Arrow by 1 tick
- Screen reader: Live region announces "Grenade thrown at A site, tick 4500"
- Reduced motion: Disable arc animations, show static path

---

## 7. File Locations

- Demo data: `data/replays/replay-001.json`
- Component: `ui/components/grenade-visualizer/`
- Canvas hook: `ui/hooks/useCanvasRenderer.ts`
- Transform util: `ui/utils/mapTransforms.ts`
