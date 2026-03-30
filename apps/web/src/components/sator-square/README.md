# SATOR Square Visualization

**Version:** 1.0.0  
**Source:** Migrated from satorXrotas  
**Integration:** eSports-EXE Feature Store API

---

## Overview

SATOR Square is a **5-layer palindromic visualization** system for tactical FPS match analytics. It provides spatial visualization of match events, player movements, and tactical control.

```
S A T O R
A       O
T       T
O       A
R O T A S
```

---

## The Five Layers

### 1. SATOR (Golden Halo) - Impact Visualization

**Purpose:** Highlights high-impact moments in the match

**Visual:** Golden glowing halos around significant events

**Events:**
- ACE (5 kills in round)
- MVP plays
- Hot streaks
- Clutch plays
- Entry kills

**Data Source:** Feature Store `impact_events`

---

### 2. OPERA (Fog of War) - Uncertainty Heatmap

**Purpose:** Shows information uncertainty and vision control

**Visual:** Fog overlay with cleared areas

**Metrics:**
- Vision coverage
- Information advantage
- Blind spots
- Revealed areas

**Data Source:** Feature Store `visibility_grid`

---

### 3. TENET (Area Control) - Zone Grading

**Purpose:** Displays tactical control of map areas

**Visual:** Colored zones with grades (A-F)

**Grades:**
- **A:** Complete control (>90%)
- **B:** Strong control (70-90%)
- **C:** Moderate control (50-70%)
- **D:** Weak control (30-50%)
- **F:** No control (<30%)

**Data Source:** Feature Store `control_zones`

---

### 4. AREPO (Death Stains) - Death Locations

**Purpose:** Persistent visualization of death locations

**Visual:** Stains/markers that fade over time

**Indicators:**
- Single kill (small marker)
- Multikill (larger marker with count)
- Clutch death (special marker)
- First blood (highlighted)

**Data Source:** Feature Store `death_events`

---

### 5. ROTAS (Rotation Trails) - Movement Paths

**Purpose:** Shows player movement patterns

**Visual:** Animated trails showing paths

**Metrics:**
- Movement paths
- Direction indicators
- Speed visualization
- Distance traveled

**Data Source:** Feature Store `movement_trails`

---

## Usage

### Basic Usage

```tsx
import { SatorSquare } from '@/components/sator-square';

function MatchVisualization({ matchId }: { matchId: string }) {
  return (
    <SatorSquare
      matchId={matchId}
      width={800}
      height={800}
      activeLayers={['sator', 'opera', 'tenet', 'arepo', 'rotas']}
      onLayerClick={(layer, data) => console.log(layer, data)}
    />
  );
}
```

### Using in SATOR Hub

```tsx
// apps/web/src/hub-1-sator/components/MatchVisualization.tsx
import { SatorSquare } from '@/components/sator-square';
import { useFeatureStore } from '@/hooks/useFeatureStore';

export function MatchVisualization() {
  const { selectedMatch } = useFeatureStore();
  
  return (
    <div className="sator-hub-visualization">
      <h2>Match Visualization</h2>
      {selectedMatch && (
        <SatorSquare
          matchId={selectedMatch.id}
          width={1200}
          height={800}
        />
      )}
    </div>
  );
}
```

### Using Spatial Data Hook

```tsx
import { useSpatialData, useSpatialDataQuery } from '@/components/sator-square';

// Legacy hook (polling)
const { satorEvents, arepoMarkers, loading } = useSpatialData(matchId);

// Modern React Query hook
const { data, isLoading } = useSpatialDataQuery(matchId);
```

---

## API Integration

### Feature Store Endpoints

```
GET /v1/features/match/{matchId}/spatial
```

**Response Format:**
```json
{
  "entity_type": "match_spatial",
  "entity_id": "match_001",
  "feature_values": {
    "impact_events": [...],
    "death_events": [...],
    "movement_trails": [...],
    "control_zones": [...],
    "visibility_grid": [...]
  },
  "timestamp": "2026-03-30T12:00:00Z"
}
```

---

## Architecture

```
SatorSquare (Container)
├── SatorLayer (Golden Halo)
├── OperaLayer (Fog of War)
├── TenetLayer (Area Control)
├── ArepoLayer (Death Stains)
├── RotasLayer (Movement Trails)
└── useSpatialData (Feature Store integration)
```

---

## File Structure

```
sator-square/
├── index.ts              # Exports
├── SatorSquare.tsx       # Main container
├── layers/
│   ├── SatorLayer.tsx    # Impact visualization
│   ├── OperaLayer.tsx    # Uncertainty heatmap
│   ├── TenetLayer.tsx    # Zone control
│   ├── ArepoLayer.tsx    # Death markers
│   └── RotasLayer.tsx    # Movement trails
├── hooks/
│   └── useSpatialData.ts # Feature Store integration
├── shaders/
│   ├── dust.vert         # Particle shaders
│   └── fog.frag          # Fog shader
└── __tests__/
    └── *.test.tsx        # Component tests
```

---

## Configuration

### Environment Variables

```env
VITE_API_URL=http://localhost:8000
```

### Layer Opacity

Each layer has configurable opacity (0-1):
- SATOR: 0.8 (default)
- OPERA: 0.6 (default)
- TENET: 0.7 (default)
- AREPO: 0.9 (default)
- ROTAS: 0.5 (default)

---

## Migration Notes

**Source:** satorXrotas/visualization/sator_square/

**Changes for eSports-EXE:**
1. Updated to use Feature Store API
2. Integrated with TanStack Query
3. Added TypeScript types
4. Updated styling for 5-hub theme
5. Added React Query hooks

---

## Testing

```bash
# Run component tests
npm test -- sator-square

# Run specific layer test
npm test -- SatorLayer
```

---

## Performance

- **Canvas-based rendering** for 60fps
- **WebGL shaders** for effects
- **Data polling** every 5 seconds
- **Memoized layers** to prevent re-renders

---

## License

MIT License - Part of eSports-EXE

---

*Migrated from satorXrotas and enhanced for eSports-EXE Feature Store integration*
