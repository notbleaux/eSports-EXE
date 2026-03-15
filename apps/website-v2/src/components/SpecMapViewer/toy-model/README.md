# SpecMapViewer Toy Model - Bind Grid

[Ver001.000]

Simplified 64x64 grid representation of Valorant's Bind map for tactical visualization and pathfinding.

## Files

| File | Purpose |
|------|---------|
| `bind-grid.json` | Grid data (sites, spawns, choke points, teleporters) |
| `types.ts` | TypeScript type definitions |
| `grid-utils.ts` | Pathfinding (A*), cell queries, tactical analysis |
| `index.ts` | Public API exports |

## Grid Legend

- `0` - Empty/walkable
- `1` - Wall
- `2` - A site
- `3` - B site
- `4` - Teleporter
- `5` - Spawn

## Features

- **A* Pathfinding**: `findPath(grid, start, goal)`
- **Choke Point Analysis**: `getImportantChokePoints(grid, minImportance)`
- **Region Queries**: `getWalkableCells(grid, regionName)`
- **Grid Statistics**: `getGridStats(grid)`

## Usage

```typescript
import { bindGrid, findPath, getSiteCenter, getGridStats } from './toy-model';

// Get grid statistics
const stats = getGridStats(bindGrid);
console.log(stats); // { totalCells: 4096, walkableCells: 2847, ... }

// Find path from attacker spawn to A site
const aSiteCenter = getSiteCenter(bindGrid.sites.A);
const path = findPath(
  bindGrid,
  { x: 5, y: 32 },  // Attacker spawn
  aSiteCenter
);

// Get important choke points
const chokes = getImportantChokePoints(bindGrid, 0.8);
// [{ name: "U-Hall", importance: 0.9 }, ...]
```

## Map Features

### Sites
- **A Site**: Top-left area (bounds: [20,20] to [30,30])
- **B Site**: Bottom-right area (bounds: [45,40] to [55,50])

### Teleporters
- **TP A**: Position (10, 32) → Destination (54, 32)
- **TP B**: Position (54, 32) → Destination (10, 32)

### Choke Points
1. U-Hall (15, 32) - importance: 0.9
2. A Short (18, 22) - importance: 0.8
3. B Long (40, 45) - importance: 0.85
4. Market (32, 32) - importance: 0.75
5. Hookah (45, 25) - importance: 0.82

### Spawns
- **Attacker**: (5, 32)
- **Defender**: (58, 32)
