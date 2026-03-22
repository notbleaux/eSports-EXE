[Ver001.000]

# WAVE 1.1 — AGENT 1-B TASK: Analytical Lenses (8 lenses)
**Priority:** P0  
**Estimated:** 12 hours  
**Due:** +36 hours from claim  
**Stream:** Advanced Lens System  
**Dependency:** Agent 1-A Lens Framework

---

## ASSIGNMENT

Implement **8 analytical lenses** that visualize match statistics, player performance, and strategic data using the lens framework from Agent 1-A.

### Deliverable Lens List

| ID | Name | Category | Description |
|----|------|----------|-------------|
| performance-heatmap | Performance Heatmap | analytical | Kill/death density across map |
| ability-efficiency | Ability Efficiency | analytical | Utility usage vs. impact |
| duel-history | Duel History | analytical | 1v1 win/loss locations |
| site-control | Site Control | analytical | Ownership over time |
| player-trajectories | Trajectory Analysis | analytical | Movement patterns |
| damage-dealt | Damage Distribution | analytical | Where damage occurs |
| flash-assists | Flash Assist Tracker | analytical | Flash → kill correlation |
| entry-success | Entry Success Rate | analytical | First contact outcomes |

---

## DELIVERABLES

### 1. Performance Heatmap Lens

```typescript
export default class PerformanceHeatmapLens implements LensPlugin {
  id = 'performance-heatmap';
  name = 'Performance Heatmap';
  category = 'analytical';
  
  configSchema = {
    type: 'object',
    properties: {
      metric: { enum: ['kills', 'deaths', 'assists', 'kda'], default: 'kda' },
      team: { enum: ['both', 'attacker', 'defender'], default: 'both' },
      smoothing: { type: 'number', minimum: 1, maximum: 20, default: 5 },
      colorScheme: { enum: ['red-blue', 'viridis', 'magma'], default: 'red-blue' }
    }
  };
  
  private heatmapTexture: WebGLTexture | null = null;
  private dataBuffer: Float32Array;
  
  initialize(context: LensContext): void {
    // Create 256x256 heatmap texture
    this.heatmapTexture = this.createHeatmapTexture(context.gl);
    this.dataBuffer = new Float32Array(256 * 256);
  }
  
  render(params: RenderParams): RenderOutput {
    const { matchState, config } = params;
    
    // Aggregate event data into grid
    this.aggregateData(matchState?.events || [], config);
    
    // Apply gaussian smoothing
    this.smoothData(config.smoothing);
    
    // Upload to GPU
    this.updateTexture(params);
    
    // Render with color mapping shader
    return {
      texture: this.heatmapTexture,
      metadata: {
        renderTime: 2.5,
        triangles: 2,
        drawCalls: 1
      }
    };
  }
  
  private aggregateData(events: MatchEvent[], config: Record<string, unknown>): void {
    // Reset buffer
    this.dataBuffer.fill(0);
    
    for (const event of events) {
      if (event.type === 'kill') {
        const x = Math.floor(event.position.x * 4); // Map to 256x256
        const y = Math.floor(event.position.y * 4);
        
        if (config.metric === 'kills') {
          this.dataBuffer[y * 256 + x] += 1;
        } else if (config.metric === 'deaths') {
          this.dataBuffer[y * 256 + x] -= 1;
        }
      }
    }
  }
  
  private smoothData(radius: number): void {
    // Gaussian blur on dataBuffer
    // Separate horizontal and vertical passes for performance
  }
}
```

### 2. Ability Efficiency Lens

```typescript
export default class AbilityEfficiencyLens implements LensPlugin {
  id = 'ability-efficiency';
  name = 'Ability Efficiency';
  category = 'analytical';
  
  render(params: RenderParams): RenderOutput {
    const abilities = params.matchState?.abilities || [];
    
    // Calculate efficiency score for each ability use
    const efficiencyData = abilities.map(ability => ({
      position: ability.position,
      type: ability.type,
      impact: this.calculateImpact(ability),
      efficiency: this.calculateEfficiency(ability)
    }));
    
    // Render icons with size = impact, color = efficiency
    return this.renderAbilityIcons(efficiencyData);
  }
  
  private calculateImpact(ability: AbilityUse): number {
    // Factors: enemies affected, damage dealt, objectives influenced
    let score = 0;
    
    if (ability.enemiesAffected) score += ability.enemiesAffected * 10;
    if (ability.damageDealt) score += ability.damageDealt;
    if (ability.ledToKill) score += 50;
    if (ability.securedSite) score += 30;
    
    return score;
  }
  
  private calculateEfficiency(ability: AbilityUse): number {
    const impact = this.calculateImpact(ability);
    const cost = this.getAbilityCost(ability.type);
    return impact / cost; // Impact per credit
  }
}
```

### 3. Trajectory Analysis Lens

```typescript
export default class TrajectoryLens implements LensPlugin {
  id = 'player-trajectories';
  name = 'Player Trajectories';
  category = 'analytical';
  
  private pathHistory: Map<string, Vector3D[]> = new Map();
  private maxHistoryLength = 300; // 15 seconds at 20 TPS
  
  onMatchEvent(event: MatchEvent): void {
    if (event.type === 'position_update') {
      const history = this.pathHistory.get(event.playerId) || [];
      history.push(event.position);
      
      if (history.length > this.maxHistoryLength) {
        history.shift();
      }
      
      this.pathHistory.set(event.playerId, history);
    }
  }
  
  render(params: RenderParams): RenderOutput {
    const trajectories = Array.from(this.pathHistory.entries())
      .map(([playerId, path]) => ({
        playerId,
        path,
        velocity: this.calculateVelocity(path),
        commonRoutes: this.identifyCommonRoutes(path)
      }));
    
    // Render as fading trails
    return this.renderTrails(trajectories);
  }
  
  private identifyCommonRoutes(path: Vector3D[]): string[] {
    // Pattern recognition for common paths
    // Compare against known routes (A-site execute, B retake, etc.)
    return [];
  }
}
```

### 4-8. Remaining Lenses

Provide similar detailed implementations for:
- Duel History Lens (win/loss heatmap by location)
- Site Control Lens (area ownership over time)
- Damage Distribution Lens (where damage flows)
- Flash Assist Tracker (flashbang effectiveness)
- Entry Success Rate (first contact analysis)

---

## COMMON INFRASTRUCTURE

### Shared Analytical Utilities (lens/analytical/utils.ts)

```typescript
// Shared utilities for analytical lenses

export class HeatmapGenerator {
  generate(
    events: MatchEvent[],
    options: HeatmapOptions
  ): Float32Array {
    // Reusable heatmap generation
  }
}

export class ColorScale {
  static redBlue(value: number): [number, number, number] {
    // Map -1..1 to blue..red
  }
  
  static viridis(value: number): [number, number, number] {
    // Viridis colormap
  }
}

export class StatisticsAggregator {
  static movingAverage(data: number[], window: number): number[] {
    // SMA calculation
  }
  
  static percentile(data: number[], p: number): number {
    // Percentile calculation
  }
}
```

---

## DATA REQUIREMENTS

Each lens needs specific match data. Document requirements:

| Lens | Required Data | Real-Time? |
|------|---------------|------------|
| Performance Heatmap | Kill/death events with positions | Yes |
| Ability Efficiency | Ability usage + outcomes | Yes |
| Trajectories | Player positions (20 TPS) | Yes |
| Duel History | 1v1 engagement results | Post-round |
| Site Control | Site occupancy events | Yes |
| Damage | Damage dealt with positions | Yes |
| Flash Assists | Flash events + subsequent kills | Delayed |
| Entry Success | First contact in rounds | Post-round |

---

## FOREMAN REVIEW CHECKLIST

- [ ] All 8 lenses implement LensPlugin interface
- [ ] Each lens has meaningful default configuration
- [ ] Performance: All render <5ms per frame
- [ ] Visual output is clear and professional
- [ ] Data requirements are documented
- [ ] Lenses work with live and replay data

---

## INTEGRATION NOTES

**Receives from:**
- Agent 1-A: Lens framework
- Agent 3-C: Live match data

**Provides to:**
- Agent 2-A: WebGL shaders (if needed for optimization)
- Agent 5-A: ML predictions (trajectory data)

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
