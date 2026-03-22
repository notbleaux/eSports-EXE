[Ver001.000]

# WAVE 1.1 — AGENT 1-C TASK: Tactical Lenses (8 lenses)
**Priority:** P0  
**Estimated:** 12 hours  
**Due:** +36 hours from claim  
**Stream:** Advanced Lens System  
**Dependency:** Agent 1-A Lens Framework

---

## ASSIGNMENT

Implement **8 tactical lenses** that visualize strategy, predictions, and real-time tactical information using the lens framework.

### Deliverable Lens List

| ID | Name | Category | Description |
|----|------|----------|-------------|
| rotation-predictor | Rotation Predictor | tactical | Predict team rotations |
| timing-windows | Timing Windows | tactical | Optimal execute timings |
| push-probability | Push Probability | tactical | Likelihood of site executes |
| clutch-zones | Clutch Zones | tactical | High-success clutch positions |
| utility-coverage | Utility Coverage | tactical | Smoke/flash/molly coverage |
| trade-routes | Trade Routes | tactical | Optimal trading paths |
| info-gaps | Information Gaps | tactical | Unobserved map areas |
| eco-pressure | Economy Pressure | tactical | Force buy risk visualization |

---

## DELIVERABLES

### 1. Rotation Predictor Lens

```typescript
export default class RotationPredictorLens implements LensPlugin {
  id = 'rotation-predictor';
  name = 'Rotation Predictor';
  category = 'tactical';
  
  configSchema = {
    predictionHorizon: { type: 'number', default: 10 }, // seconds
    confidenceThreshold: { type: 'number', default: 0.6 },
    showAlternatives: { type: 'boolean', default: true }
  };
  
  private mlModel: RotationModel | null = null;
  
  async initialize(context: LensContext): Promise<void> {
    // Load TensorFlow.js model
    this.mlModel = await tf.loadLayersModel('/models/rotation-predictor.json');
  }
  
  render(params: RenderParams): RenderOutput {
    const { matchState, config } = params;
    
    // Get current positions
    const positions = matchState?.players || [];
    
    // Predict rotations
    const predictions = this.predictRotations(positions, config);
    
    // Render prediction paths
    return this.renderPredictions(predictions);
  }
  
  private predictRotations(
    positions: PlayerPosition[],
    config: Record<string, unknown>
  ): RotationPrediction[] {
    // Features: current positions, round time, economy, previous rotations
    const features = this.extractFeatures(positions);
    
    // Run inference
    const prediction = this.mlModel!.predict(features) as tf.Tensor;
    const probabilities = prediction.dataSync();
    
    // Convert to rotation paths
    return this.interpretPredictions(probabilities, config);
  }
  
  private renderPredictions(predictions: RotationPrediction[]): RenderOutput {
    // Visualize as:
    // - Thick line = high confidence
    // - Fading trail = time horizon
    // - Alternative routes = thinner lines
    // - Destination highlight
  }
}

interface RotationPrediction {
  fromSite: string;
  toSite: string;
  confidence: number;
  estimatedTime: number;
  path: Vector3D[];
  alternativePaths?: Vector3D[][];
}
```

### 2. Timing Windows Lens

```typescript
export default class TimingWindowLens implements LensPlugin {
  id = 'timing-windows';
  name = 'Timing Windows';
  category = 'tactical';
  
  render(params: RenderParams): RenderOutput {
    const roundTime = params.matchState?.roundTime || 0;
    const roundPhase = this.getRoundPhase(roundTime);
    
    // Calculate optimal windows for different actions
    const windows = [
      {
        action: 'A Execute',
        start: 45,
        end: 65,
        confidence: 0.8,
        reason: 'Utility advantage, defender rotations limited'
      },
      {
        action: 'B Fake → A',
        start: 30,
        end: 50,
        confidence: 0.7,
        reason: 'Draw rotations early'
      }
    ];
    
    return this.renderTimeline(windows, roundTime);
  }
  
  private renderTimeline(windows: TimingWindow[], currentTime: number): RenderOutput {
    // Render as:
    // - Timeline bar (0-100 seconds)
    // - Colored segments for each window
    // - Current time indicator
    // - Tooltips with reasoning
  }
}
```

### 3. Push Probability Lens

```typescript
export default class PushProbabilityLens implements LensPlugin {
  id = 'push-probability';
  name = 'Push Probability';
  category = 'tactical';
  
  render(params: RenderParams): RenderOutput {
    const gameState = this.analyzeGameState(params.matchState);
    
    // Calculate push probability for each site
    const sites = ['A', 'B', 'C'].map(site => ({
      site,
      probability: this.calculatePushProbability(site, gameState),
      factors: this.identifyFactors(site, gameState)
    }));
    
    return this.renderSiteProbabilities(sites);
  }
  
  private calculatePushProbability(site: string, state: GameState): number {
    // Factors:
    // - Attacker economy vs defender
    // - Utility available
    // - Previous round patterns
    // - Current player positions
    // - Time remaining
    
    let probability = 0.5; // Base
    
    // Economy factor
    if (state.attackerEco > state.defenderEco * 1.5) {
      probability += 0.2;
    }
    
    // Position clustering
    const attackersNearSite = state.players.filter(
      p => p.team === 'attacker' && this.distanceToSite(p, site) < 20
    ).length;
    
    if (attackersNearSite >= 3) {
      probability += 0.3;
    }
    
    return Math.min(1, Math.max(0, probability));
  }
}
```

### 4. Utility Coverage Lens

```typescript
export default class UtilityCoverageLens implements LensPlugin {
  id = 'utility-coverage';
  name = 'Utility Coverage';
  category = 'tactical';
  
  private activeUtility: Map<string, ActiveUtility> = new Map();
  
  onMatchEvent(event: MatchEvent): void {
    if (event.type === 'ability_used') {
      // Track smokes, mollies, flashes
      this.activeUtility.set(event.abilityId, {
        type: event.abilityType,
        position: event.position,
        duration: this.getDuration(event.abilityType),
        deployedAt: event.timestamp
      });
    }
    
    if (event.type === 'ability_expired') {
      this.activeUtility.delete(event.abilityId);
    }
  }
  
  render(params: RenderParams): RenderOutput {
    const now = params.timestamp;
    
    // Calculate coverage areas
    const coverage = {
      smoke: this.calculateCoverage('smoke', now),
      molly: this.calculateCoverage('molly', now),
      flash: this.calculateFlashCoverage(now)
    };
    
    // Render as:
    // - Smoke = gray circles
    // - Molly = orange/red gradient
    // - Flash = yellow burst indicators
    return this.renderCoverage(coverage);
  }
  
  private calculateCoverage(type: string, now: number): CoverageArea[] {
    return Array.from(this.activeUtility.values())
      .filter(u => u.type === type && u.deployedAt + u.duration > now)
      .map(u => ({
        center: u.position,
        radius: this.getEffectRadius(type),
        opacity: 1 - (now - u.deployedAt) / u.duration // Fade over time
      }));
  }
}
```

### 5-8. Remaining Lenses

Provide similar detailed implementations for:
- Clutch Zones Lens (historically successful positions)
- Trade Routes Lens (optimal support positioning)
- Information Gaps Lens (unobserved areas)
- Economy Pressure Lens (force buy risk)

---

## PREDICTION SYSTEM INTEGRATION

Tactical lenses integrate with ML predictions from Phase 3:

```typescript
interface PredictionIntegration {
  // Subscribe to ML model outputs
  subscribeToPredictions(modelId: string): Observable<Prediction>;
  
  // Combine multiple predictions
  ensemblePredictions(predictions: Prediction[]): EnsembleResult;
  
  // Confidence visualization
  renderConfidence(confidence: number): VisualIndicator;
}
```

---

## FOREMAN REVIEW CHECKLIST

- [ ] All 8 lenses implement LensPlugin interface
- [ ] Predictions show confidence levels
- [ ] Visual output is clear under time pressure
- [ ] Lenses update in real-time (<100ms)
- [ ] Alternative scenarios shown where applicable
- [ ] No information overload (clean presentation)

---

## INTEGRATION NOTES

**Receives from:**
- Agent 1-A: Lens framework
- Agent 3-C: Live match data
- Agent 5-A: Position prediction models
- Agent 5-B: Outcome prediction models

**Provides to:**
- Agent 7-A: Observer interface (tactical tools for casters)

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
