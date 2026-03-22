[Ver001.000]

# Technical Design: TeNET Valorant Ability Timeline

**Scope:** Multi-lane ability timeline, event density heatmap, agent color coding, and site control visualization.

---

## 1. Data Schema

### Ability Event Record
```typescript
interface AbilityEvent {
  id: string;
  matchId: string;
  roundNumber: number;
  tick: number;              // 128 tick rate
  playerId: string;
  playerName: string;
  agentName: string;         // "Jett", "Sage", "Sova", etc.
  agentRole: "Duelist" | "Initiator" | "Controller" | "Sentinel";
  abilityName: string;       // "Tailwind", "Slow Orb", "Recon Bolt", etc.
  abilityType: "signature" | "ultimate" | "basic";
  cooldownSeconds: number;
  position?: Vector3;        // Optional: where cast
  targetPosition?: Vector3;  // Optional: destination
  effectivenessScore?: number; // 0-1 calculated
  relatedEvents?: string[];  // IDs of related events (combo detection)
}

// Pre-calculated lane data for efficient rendering
interface TimelineLane {
  agentId: string;
  agentName: string;
  agentColor: string;
  role: string;
  events: AbilityEvent[];
  visible: boolean;
}
```

### Site Control Record
```typescript
interface SiteControlSnapshot {
  roundNumber: number;
  tick: number;
  siteName: "A" | "B" | "C";
  attackingTeam: "A" | "B";
  attackerCount: number;     // Players in site volume
  defenderCount: number;
  controlRatio: number;      // 0-1 attacker control
  smokeCoverage: number;     // 0-1 area obscured
  utilityUsed: string[];     // Recent ability IDs
}
```

---

## 2. Timeline Rendering Algorithm

### 2.1 Virtualized Lane Rendering

```typescript
interface TimelineViewport {
  startTick: number;
  endTick: number;
  pixelsPerTick: number;
  heightPerLane: number;
}

function getVisibleEvents(
  lanes: TimelineLane[],
  viewport: TimelineViewport
): RenderableEvent[] {
  const events: RenderableEvent[] = [];
  
  for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
    const lane = lanes[laneIndex];
    if (!lane.visible) continue;
    
    for (const event of lane.events) {
      if (event.tick < viewport.startTick || event.tick > viewport.endTick) {
        continue;
      }
      
      const x = (event.tick - viewport.startTick) * viewport.pixelsPerTick;
      const y = laneIndex * viewport.heightPerLane + (viewport.heightPerLane / 2);
      
      events.push({
        ...event,
        x,
        y,
        laneIndex,
        color: lane.agentColor
      });
    }
  }
  
  return events;
}
```

### 2.2 SVG Marker Component

```typescript
// Event marker with tooltip on hover
function AbilityMarker({ event, onClick }: MarkerProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <g
      transform={`translate(${event.x}, ${event.y})`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(event)}
      className="ability-marker"
    >
      {/* Base marker */}
      <rect
        x="-6"
        y="-9"
        width="12"
        height="18"
        rx="2"
        fill={event.color}
        className="marker-body"
      />
      
      {/* Ultimate indicator */}
      {event.abilityType === "ultimate" && (
        <circle cx="0" cy="-12" r="4" fill="#FFB86B" />
      )}
      
      {/* Hover tooltip */}
      {hovered && (
        <foreignObject x="10" y="-40" width="200" height="80">
          <div className="tooltip">
            <strong>{event.agentName}</strong>: {event.abilityName}
            <br />
            Tick: {event.tick}
            <br />
            {event.effectivenessScore && 
              `Effectiveness: ${(event.effectivenessScore * 100).toFixed(0)}%`
            }
          </div>
        </foreignObject>
      )}
    </g>
  );
}
```

### 2.3 Density Heatmap

```typescript
interface DensityCell {
  tick: number;      // Cell start tick
  count: number;     // Events in this cell
  maxSimultaneous: number; // Max concurrent abilities
}

function calculateDensity(
  events: AbilityEvent[],
  viewport: TimelineViewport,
  bucketSizeTicks: number = 128 // 1 second
): DensityCell[] {
  const buckets = new Map<number, number>();
  
  for (const event of events) {
    const bucket = Math.floor(event.tick / bucketSizeTicks) * bucketSizeTicks;
    buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
  }
  
  return Array.from(buckets.entries())
    .map(([tick, count]) => ({ tick, count, maxSimultaneous: count }))
    .sort((a, b) => a.tick - b.tick);
}

function renderDensityHeatmap(
  ctx: CanvasRenderingContext2D,
  density: DensityCell[],
  viewport: TimelineViewport
) {
  const maxCount = Math.max(...density.map(d => d.count), 1);
  
  for (const cell of density) {
    const x = (cell.tick - viewport.startTick) * viewport.pixelsPerTick;
    const width = bucketSizeTicks * viewport.pixelsPerTick;
    const intensity = cell.count / maxCount;
    
    ctx.fillStyle = `rgba(255, 45, 156, ${intensity * 0.3})`;
    ctx.fillRect(x, 0, width, ctx.canvas.height);
  }
}
```

---

## 3. Site Control Visualization

### 3.1 Radar-style Site Control Widget

```typescript
interface SiteControlWidgetProps {
  sites: SiteControlSnapshot[];
  currentTick: number;
}

function SiteControlWidget({ sites, currentTick }: SiteControlWidgetProps) {
  // Get latest snapshot for each site at current tick
  const currentSnapshot = sites
    .filter(s => s.tick <= currentTick)
    .reduce((acc, s) => {
      if (!acc[s.siteName] || acc[s.siteName].tick < s.tick) {
        acc[s.siteName] = s;
      }
      return acc;
    }, {} as Record<string, SiteControlSnapshot>);
  
  return (
    <div className="site-control-widget">
      {["A", "B", "C"].map(site => {
        const data = currentSnapshot[site];
        if (!data) return null;
        
        return (
          <div key={site} className="site-card">
            <div className="site-header">
              <span className="site-name">Site {site}</span>
              <span className={`control-badge ${data.controlRatio > 0.5 ? 'attacker' : 'defender'}`}>
                {data.controlRatio > 0.5 ? 'ATTACKER' : 'DEFENDER'} CONTROL
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="control-bar">
              <div 
                className="control-fill" 
                style={{ width: `${data.controlRatio * 100}%` }}
              />
            </div>
            
            <div className="site-stats">
              <span>{data.attackerCount} ATK / {data.defenderCount} DEF</span>
              <span>{(data.smokeCoverage * 100).toFixed(0)}% smoked</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 4. Agent Color Mapping

```typescript
const AGENT_COLORS: Record<string, string> = {
  "Jett": "#FF2D9C",      // Neon pink
  "Phoenix": "#FFB86B",    // Amber
  "Sage": "#00C48C",       // Green
  "Sova": "#00D1FF",       // Cyan
  "Omen": "#9B7CFF",       // Violet
  "Brimstone": "#FF5C5C",  // Red
  "Viper": "#00C48C",      // Green
  "Cypher": "#6B6F76",     // Gray
  "Reyna": "#FF2D9C",      // Neon pink
  "Killjoy": "#FFB86B",    // Amber
  "Breach": "#FF5C5C",     // Red
  "Raze": "#FF5C5C",       // Red
  "Skye": "#00C48C",       // Green
  "Yoru": "#00D1FF",       // Cyan
  "Astra": "#9B7CFF",      // Violet
  "KAY/O": "#6B6F76",      // Gray
  "Chamber": "#FFB86B",    // Amber
  "Neon": "#FF2D9C",       // Neon pink
  "Fade": "#9B7CFF",       // Violet
  "Harbor": "#00D1FF",     // Cyan
  "Gekko": "#00C48C",      // Green
  "Deadlock": "#6B6F76",   // Gray
  "Iso": "#00D1FF",        // Cyan
  "Clove": "#9B7CFF",      // Violet
  "Vyse": "#FF5C5C"        // Red
};

function getAgentColor(agentName: string): string {
  return AGENT_COLORS[agentName] || "#6B6F76";
}
```

---

## 5. Performance Budget

| Metric | Target | Limit |
|--------|--------|-------|
| Timeline render | 60fps | ≤200 events visible |
| Lane virtualization | Dynamic | 10 agents |
| Zoom levels | 0.1x - 10x | Smooth transition |
| Memory per round | <10MB | 24 rounds max |

---

## 6. Accessibility

- Keyboard: Tab through lanes, arrow keys navigate events
- Screen reader: "Jett used Tailwind at A site, tick 8400"
- High contrast: Marker outlines visible on any background
- Reduced motion: Disable zoom/pan animations

---

## 7. File Locations

- Demo data: `data/valorant/abilities-demo.json`
- Component: `ui/components/ability-timeline/`
- Hooks: `ui/hooks/useTimelineViewport.ts`
- Utils: `ui/utils/valorantAgents.ts`
