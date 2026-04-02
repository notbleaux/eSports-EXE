// @ts-nocheck
/**
 * SpecMapViewer Toy Model - Bind Grid
 * 
 * 64x64 simplified grid representation of Bind map for tactical visualization.
 * [Ver001.000]
 */

export { bindGrid } from './grid-utils';
export * from './types';
export {
  getCell,
  findPath,
  getImportantChokePoints,
  gridDistance,
  getSiteCenter,
  isValidPosition,
  getWalkableCells,
  getGridStats,
} from './grid-utils';

// Re-export the raw grid data for direct access
export { default as bindGridData } from './bind-grid.json';
