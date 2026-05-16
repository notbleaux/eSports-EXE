/**
 * SpecMapViewer Toy Model - Bind Grid
 * 
 * 64x64 simplified grid representation of Bind map for tactical visualization.
 * [Ver001.000]
 */

export { bindGrid } from './grid-utils';
// Re-export types selectively to avoid conflicts with lenses/types.ts
export type { CellType, Position, Bounds, Site, Teleporter, ChokePoint, CoverPosition, SpawnPoints, GridRegion, MapGridData, GridCell, PathNode, TacticalAnalysis } from './types';
export type { Vector2D } from './types';
// Note: Vector3D is intentionally NOT re-exported here to avoid conflict with lenses/types.ts
// Import it directly from lenses/types if needed
export {
  getCell,
  findPath as gridFindPath,
  getImportantChokePoints,
  gridDistance,
  getSiteCenter,
  isValidPosition,
  getWalkableCells,
  getGridStats,
} from './grid-utils';

// Re-export the raw grid data for direct access
export { default as bindGridData } from './bind-grid.json';
