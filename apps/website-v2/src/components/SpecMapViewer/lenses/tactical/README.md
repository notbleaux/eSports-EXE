# Tactical Lenses for SpecMap

**Version:** [Ver001.000]  
**Component:** SpecMapViewer Tactical Lenses  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform

## Overview

The Tactical Lenses provide AI-driven predictive analysis and tactical visualization for the SpecMap component. These 8 lenses work together to reveal hidden patterns, predict enemy movements, and provide actionable intelligence during matches.

## Lenses

### 1. Rotation Predictor (`rotation-predictor`)
Predicts team rotations with confidence indicators and timing estimates.

**Features:**
- Predicts A-to-B and B-to-A rotations
- Shows confidence levels (0-100%)
- Displays estimated rotation time
- Indicates risk level with warnings
- Animated path visualization

**Use Case:** Anticipate defender retakes or attacker fakes.

---

### 2. Timing Windows (`timing-windows`)
Visualizes optimal execute timing windows throughout the round.

**Features:**
- Timeline visualization (0-100s)
- Color-coded window viability
- Success probability per window
- Prerequisites and risk indicators
- Current time marker

**Use Case:** Plan executes for when defenders are most vulnerable.

---

### 3. Push Probability (`push-probability`)
Shows likelihood of site executes with expected compositions.

**Features:**
- Probability heatmap per site
- Utility commitment predictions
- Expected timing estimates
- Success rate indicators

**Use Case:** Determine which site attackers are likely to target.

---

### 4. Clutch Zones (`clutch-zones`)
Identifies high-success clutch positions with historical data.

**Features:**
- Success rate visualization
- Recommended agents per zone
- Cover and escape ratings
- Sample size indicators
- Tactical advantages list

**Use Case:** Find the best position when in a clutch situation.

---

### 5. Utility Coverage (`utility-coverage`)
Tracks active smoke, molotov, and flash coverage with decay.

**Features:**
- Real-time coverage visualization
- Decay progress indicators
- Duration timers
- Team attribution
- Type-specific effects (smoke clouds, fire particles, flash burst)

**Use Case:** Track active utility and plan around it.

---

### 6. Trade Routes (`trade-routes`)
Visualizes optimal support paths for trading kills.

**Features:**
- Multiple route options per location
- Safety ratings (0-100%)
- Travel time estimates
- Trade success rates
- Utility risk warnings
- Optimal agent recommendations

**Use Case:** Find the safest path to support teammates.

---

### 7. Info Gaps (`info-gaps`)
Identifies unobserved map areas with risk assessment.

**Features:**
- Area coverage visualization
- Time since last intel
- Risk level indicators
- Recommended intel actions
- Question mark indicators

**Use Case:** Identify where enemies might be hiding.

---

### 8. Eco Pressure (`eco-pressure`)
Visualizes force buy risk and economic pressure indicators.

**Features:**
- Team economy comparison
- Pressure gauge
- Round type prediction
- Force buy risk warnings
- Counter-strategy recommendations
- Aggression level prediction

**Use Case:** Predict enemy economic strategy and adapt.

## Architecture

### Prediction Interface

All lenses use the `PredictionModel` interface for consistent data:

```typescript
interface PredictionModel {
  predictRotations(positions, gameState): RotationPrediction[]
  predictOutcome(gameState): OutcomePrediction
  predictTimingWindows(gameState): TimingWindow[]
  predictPushProbability(gameState): PushProbability[]
  identifyClutchZones(position, team): ClutchZone[]
  analyzeUtilityCoverage(gameState): UtilityCoverage[]
  calculateTradeRoutes(from, to, gameState): TradeRoute[]
  identifyInfoGaps(gameState): InfoGap[]
  assessEcoPressure(gameState): EcoPressure
}
```

### Utility Coverage System

The `UtilityCoverageManager` tracks active utility:

```typescript
class UtilityCoverageManager {
  addUtility(utility): string
  getActiveUtilities(): UtilityInstance[]
  update(currentTime): void
  getCoverageAt(position): CoverageResult
  isInSmoke(position): boolean
  isInMolly(position): boolean
}
```

## Usage

### Registering with LensCompositor

```typescript
import { LensCompositor } from '../LensCompositor'
import { allTacticalLenses } from './tactical'

const compositor = new LensCompositor()

// Register all tactical lenses
allTacticalLenses.forEach(lens => {
  compositor.registerLens(lens)
})

// Activate specific lenses
compositor.activateLens('rotation-predictor')
compositor.activateLens('utility-coverage')
```

### Using Presets

```typescript
// Apply tactical preset
compositor.applyPreset('tactical')

// Apply attack-focused preset
compositor.applyPreset('attack')

// Apply defense-focused preset
compositor.applyPreset('defense')
```

### Individual Lens Usage

```typescript
import { rotationPredictorLens, utilityManager } from './tactical'

// Render a single lens
rotationPredictorLens.render(ctx, gameData, {
  showConfidence: true,
  showTiming: true,
  confidenceThreshold: 0.5
})

// Add utility to manager
utilityManager.addUtility({
  type: 'smoke',
  position: { x: 25, y: 25 },
  team: 'attackers',
  maxDuration: 18000
})
```

## Lens Options

Each lens accepts custom options:

### RotationPredictorLensOptions
- `attackerColor` - Color for attacker rotations
- `defenderColor` - Color for defender rotations
- `showConfidence` - Show confidence indicators
- `showTiming` - Show timing estimates
- `confidenceThreshold` - Minimum confidence to display

### TimingWindowsLensOptions
- `optimalColor` - Color for optimal windows
- `viableColor` - Color for viable windows
- `riskyColor` - Color for risky windows
- `showDetails` - Show window details
- `showProbability` - Show success probabilities

### UtilityCoverageLensOptions
- `smokeColor` - Smoke visualization color
- `mollyColor` - Molotov visualization color
- `flashColor` - Flash visualization color
- `showTimers` - Show duration timers
- `showDecay` - Show decay progress

## Render Order

The tactical lenses are rendered in this order:

1. `secured` - Base control layer
2. `eco-pressure` - Economy status
3. `wind` - Movement patterns
4. `doors` - Rotation patterns
5. `rotation-predictor` - Rotation predictions
6. `utility-coverage` - Active utility
7. `info-gaps` - Intel gaps
8. `clutch-zones` - Clutch positions
9. `trade-routes` - Support paths
10. `tension` - Combat heatmap
11. `blood` - Combat aftermath
12. `push-probability` - Site predictions
13. `timing-windows` - Timing analysis
14. `ripple` - Sound effects

## File Structure

```
lenses/
├── tactical/
│   ├── index.ts                 # Exports all tactical components
│   ├── README.md                # This documentation
│   ├── predictionInterface.ts   # Prediction model interfaces
│   ├── utilityCoverage.ts       # Utility coverage system
│   │
│   ├── rotationPredictorLens.ts # Lens 1: Rotation predictions
│   ├── timingWindowsLens.ts     # Lens 2: Timing windows
│   ├── pushProbabilityLens.ts   # Lens 3: Push probability
│   ├── clutchZonesLens.ts       # Lens 4: Clutch zones
│   ├── utilityCoverageLens.ts   # Lens 5: Utility coverage
│   ├── tradeRoutesLens.ts       # Lens 6: Trade routes
│   ├── infoGapsLens.ts          # Lens 7: Info gaps
│   └── ecoPressureLens.ts       # Lens 8: Eco pressure
│
├── types.ts                     # Base lens types
├── helpers.ts                   # Render helpers
├── LensCompositor.ts            # Lens compositing
└── index.ts                     # All lens exports
```

## Integration

### With LensingStore

```typescript
import { useLensingStore } from '@/store/lensingStore'

// Tactical lenses are available in the compositor
const store = useLensingStore()
store.initCompositor()

// Activate tactical preset
store.compositor?.applyPreset('tactical')
```

### With SpecMapViewer

```typescript
import { allTacticalLenses } from './lenses/tactical'

// Register tactical lenses on mount
useEffect(() => {
  allTacticalLenses.forEach(lens => {
    compositor.registerLens(lens)
  })
}, [])
```

## Future Enhancements

- Machine learning prediction model integration
- Real-time data feed from game API
- Historical pattern learning
- Custom user-defined clutch zones
- Dynamic utility duration tracking
- Integration with player heatmaps

## Changelog

### [Ver001.000] - 2026-03-23
- Initial implementation of 8 tactical lenses
- Prediction interface with heuristic model
- Utility coverage system
- Full integration with LensCompositor
