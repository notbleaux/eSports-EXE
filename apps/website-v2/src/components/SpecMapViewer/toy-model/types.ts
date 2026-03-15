/**
 * SpecMapViewer Toy Model - Type Definitions
 * 
 * Type-safe grid representation for tactical map visualization.
 * [Ver001.000]
 */

export type CellType = 0 | 1 | 2 | 3 | 4 | 5;

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Position {
  x: number;
  y: number;
}

export type { Vector2D as Position2D };

export interface Bounds {
  topLeft: Position;
  bottomRight: Position;
}

export interface Site {
  bounds: [[number, number], [number, number]];
  plantSites: [number, number][];
  type: 'bombsite' | 'hostage' | 'objective';
}

export interface Teleporter {
  id: string;
  position: [number, number];
  destination: [number, number];
  type: 'oneway' | 'twoway';
}

export interface ChokePoint {
  name: string;
  position: [number, number];
  importance: number; // 0.0 - 1.0
}

export interface CoverPosition {
  position: [number, number];
  type: 'box' | 'wall' | 'corner' | 'elevated';
}

export interface SpawnPoints {
  attacker: [number, number][];
  defender: [number, number][];
}

export interface GridRegion {
  x: [number, number];
  y: [number, number];
}

export interface MapGridData {
  mapId: string;
  name: string;
  game: string;
  dimensions: {
    width: number;
    height: number;
  };
  cellSize: number;
  gridType: 'full' | 'simplified' | 'region';
  legend: Record<string, string>;
  sites: Record<string, Site>;
  teleporters: Teleporter[];
  chokePoints: ChokePoint[];
  spawns: SpawnPoints;
  coverPositions: CoverPosition[];
  gridRegions: Record<string, GridRegion>;
  metadata: {
    version: string;
    created: string;
    gridResolution: string;
    scale: string;
  };
}

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  region?: string;
  distanceToA?: number;
  distanceToB?: number;
  lineOfSight?: string[];
}

export interface PathNode {
  position: Position;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent?: PathNode;
}

export interface TacticalAnalysis {
  chokePoints: ChokePoint[];
  recommendedPositions: Position[];
  rotationPaths: Position[][];
  siteExecutions: Record<string, Position[]>;
}
