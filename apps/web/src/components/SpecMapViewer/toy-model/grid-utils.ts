/**
 * SpecMapViewer Toy Model - Grid Utilities
 * 
 * Pathfinding, cell queries, and tactical analysis for map grids.
 * [Ver001.000]
 */

import type {
  Position,
  MapGridData,
  GridCell,
  PathNode,
  ChokePoint,
  Site
} from './types';

import bindGridData from './bind-grid.json';

// Export the bind grid data as default
export const bindGrid: MapGridData = bindGridData as MapGridData;

/**
 * Get cell at specific coordinates
 */
export function getCell(grid: MapGridData, x: number, y: number): GridCell | null {
  if (x < 0 || x >= grid.dimensions.width || y < 0 || y >= grid.dimensions.height) {
    return null;
  }
  
  // Determine region if any
  let region: string | undefined;
  for (const [name, bounds] of Object.entries(grid.gridRegions)) {
    if (x >= bounds.x[0] && x <= bounds.x[1] && y >= bounds.y[0] && y <= bounds.y[1]) {
      region = name;
      break;
    }
  }
  
  return {
    x,
    y,
    type: getCellType(grid, x, y),
    region,
  };
}

/**
 * Determine cell type based on position
 * 0 = empty/walkable, 1 = wall, 2 = A site, 3 = B site, 4 = teleporter, 5 = spawn
 */
function getCellType(grid: MapGridData, x: number, y: number): 0 | 1 | 2 | 3 | 4 | 5 {
  // Check sites
  if (isInSite(grid.sites.A, x, y)) return 2;
  if (isInSite(grid.sites.B, x, y)) return 3;
  
  // Check teleporters
  for (const tp of grid.teleporters) {
    const [tpx, tpy] = tp.position;
    if (Math.abs(x - tpx) <= 1 && Math.abs(y - tpy) <= 1) return 4;
  }
  
  // Check spawns
  for (const [sx, sy] of grid.spawns.attacker) {
    if (Math.abs(x - sx) <= 2 && Math.abs(y - sy) <= 2) return 5;
  }
  for (const [sx, sy] of grid.spawns.defender) {
    if (Math.abs(x - sx) <= 2 && Math.abs(y - sy) <= 2) return 5;
  }
  
  // Check walls (simplified - outer borders and some internal walls)
  if (x < 2 || x >= grid.dimensions.width - 2 || y < 2 || y >= grid.dimensions.height - 2) {
    return 1;
  }
  
  // Internal walls at specific locations (U-Hall, Market dividers)
  if ((x >= 14 && x <= 16 && y >= 28 && y <= 36) || // U-Hall vertical
      (x >= 30 && x <= 34 && y >= 30 && y <= 34)) { // Market divider
    return 1;
  }
  
  return 0; // Walkable
}

function isInSite(site: Site, x: number, y: number): boolean {
  const [[x1, y1], [x2, y2]] = site.bounds;
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
}

/**
 * A* pathfinding between two points
 */
export function findPath(
  grid: MapGridData,
  start: Position,
  goal: Position
): Position[] | null {
  const openSet: PathNode[] = [];
  const closedSet = new Set<string>();
  
  const startNode: PathNode = {
    position: start,
    g: 0,
    h: manhattanDistance(start, goal),
    f: manhattanDistance(start, goal),
  };
  
  openSet.push(startNode);
  
  while (openSet.length > 0) {
    // Get node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    
    const currentKey = `${current.position.x},${current.position.y}`;
    
    // Check if reached goal
    if (current.position.x === goal.x && current.position.y === goal.y) {
      return reconstructPath(current);
    }
    
    closedSet.add(currentKey);
    
    // Check neighbors
    const neighbors = getNeighbors(grid, current.position);
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      if (closedSet.has(neighborKey)) continue;
      
      const gScore = current.g + 1;
      const hScore = manhattanDistance(neighbor, goal);
      const fScore = gScore + hScore;
      
      const existingNode = openSet.find(n => 
        n.position.x === neighbor.x && n.position.y === neighbor.y
      );
      
      if (!existingNode) {
        openSet.push({
          position: neighbor,
          g: gScore,
          h: hScore,
          f: fScore,
          parent: current,
        });
      } else if (gScore < existingNode.g) {
        existingNode.g = gScore;
        existingNode.f = fScore;
        existingNode.parent = current;
      }
    }
  }
  
  return null; // No path found
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(grid: MapGridData, pos: Position): Position[] {
  const directions = [
    { x: 0, y: -1 }, // North
    { x: 1, y: 0 },  // East
    { x: 0, y: 1 },  // South
    { x: -1, y: 0 }, // West
  ];
  
  const neighbors: Position[] = [];
  
  for (const dir of directions) {
    const newX = pos.x + dir.x;
    const newY = pos.y + dir.y;
    
    if (isWalkable(grid, newX, newY)) {
      neighbors.push({ x: newX, y: newY });
    }
  }
  
  return neighbors;
}

function isWalkable(grid: MapGridData, x: number, y: number): boolean {
  const cell = getCell(grid, x, y);
  return cell !== null && cell.type !== 1; // Not a wall
}

function reconstructPath(node: PathNode): Position[] {
  const path: Position[] = [];
  let current: PathNode | undefined = node;
  
  while (current) {
    path.unshift(current.position);
    current = current.parent;
  }
  
  return path;
}

/**
 * Get choke points sorted by importance
 */
export function getImportantChokePoints(
  grid: MapGridData,
  minImportance = 0.8
): ChokePoint[] {
  return grid.chokePoints
    .filter(cp => cp.importance >= minImportance)
    .sort((a, b) => b.importance - a.importance);
}

/**
 * Calculate distance between two points on grid
 */
export function gridDistance(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Get site center position
 */
export function getSiteCenter(site: Site): Position {
  const [[x1, y1], [x2, y2]] = site.bounds;
  return {
    x: Math.floor((x1 + x2) / 2),
    y: Math.floor((y1 + y2) / 2),
  };
}

/**
 * Validate if a position is within grid bounds
 */
export function isValidPosition(
  grid: MapGridData,
  pos: Position
): boolean {
  return (
    pos.x >= 0 &&
    pos.x < grid.dimensions.width &&
    pos.y >= 0 &&
    pos.y < grid.dimensions.height
  );
}

/**
 * Get all walkable cells in a region
 */
export function getWalkableCells(
  grid: MapGridData,
  regionName?: string
): Position[] {
  const cells: Position[] = [];
  
  let bounds: { x: [number, number]; y: [number, number] } | null = null;
  
  if (regionName && grid.gridRegions[regionName]) {
    bounds = grid.gridRegions[regionName];
  }
  
  const xStart = bounds ? bounds.x[0] : 0;
  const xEnd = bounds ? bounds.x[1] : grid.dimensions.width;
  const yStart = bounds ? bounds.y[0] : 0;
  const yEnd = bounds ? bounds.y[1] : grid.dimensions.height;
  
  for (let x = xStart; x < xEnd; x++) {
    for (let y = yStart; y < yEnd; y++) {
      if (isWalkable(grid, x, y)) {
        cells.push({ x, y });
      }
    }
  }
  
  return cells;
}

/**
 * Export grid statistics
 */
export function getGridStats(grid: MapGridData): {
  totalCells: number;
  walkableCells: number;
  wallCells: number;
  siteCells: number;
  teleporterCells: number;
  spawnCells: number;
} {
  let walkable = 0;
  let walls = 0;
  let sites = 0;
  let teleporters = 0;
  let spawns = 0;
  
  for (let x = 0; x < grid.dimensions.width; x++) {
    for (let y = 0; y < grid.dimensions.height; y++) {
      const cellType = getCellType(grid, x, y);
      switch (cellType) {
        case 0:
          walkable++;
          break;
        case 1:
          walls++;
          break;
        case 2:
        case 3:
          sites++;
          break;
        case 4:
          teleporters++;
          break;
        case 5:
          spawns++;
          break;
      }
    }
  }
  
  return {
    totalCells: grid.dimensions.width * grid.dimensions.height,
    walkableCells: walkable,
    wallCells: walls,
    siteCells: sites,
    teleporterCells: teleporters,
    spawnCells: spawns,
  };
}
