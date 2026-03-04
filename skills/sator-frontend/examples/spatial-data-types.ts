/**
 * Spatial Data Type Definitions
 * 
 * Core types for SATOR Square visualization system
 */

// Base spatial coordinate
export interface Point {
  x: number;
  y: number;
}

// Map bounds for coordinate normalization
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Player position and metadata
export interface Player {
  id: string;
  name: string;
  team: 'attacker' | 'defender';
  x: number;
  y: number;
  importance: number; // 0-1 scale for halo size
  health: number;
  armor: number;
  weapon: string;
}

// Spatial event (kill, ability use, etc.)
export interface SpatialEvent {
  id: string;
  type: 'kill' | 'death' | 'ability' | 'rotation';
  timestamp: number;
  playerId: string;
  position: Point;
  targetPosition?: Point;
  metadata?: Record<string, any>;
}

// Trail segment for ROTAS layer
export interface TrailSegment {
  playerId: string;
  start: Point;
  end: Point;
  timestamp: number;
  speed: number;
}

// Death stain for AREPO layer
export interface DeathStain {
  playerId: string;
  position: Point;
  timestamp: number;
  killerId: string;
  weapon: string;
  duration: number; // How long stain persists
}

// Area control zone for TENET layer
export interface ControlZone {
  id: string;
  team: 'attacker' | 'defender' | 'contested';
  polygon: Point[];
  intensity: number; // 0-1
  timestamp: number;
}

// Fog of war visibility for OPERA layer
export interface VisibilityMask {
  playerId: string;
  visiblePolygon: Point[];
  timestamp: number;
}

// Complete spatial data payload
export interface SpatialData {
  matchId: string;
  round: number;
  mapName: string;
  bounds: Bounds;
  players: Player[];
  events: SpatialEvent[];
  trails?: TrailSegment[];
  stains?: DeathStain[];
  zones?: ControlZone[];
  visibility?: VisibilityMask[];
}

// Layer component props
export interface LayerProps {
  width: number;
  height: number;
  opacity?: number;
  onRenderComplete?: () => void;
}

// SATOR-specific event
export interface SatorEvent extends SpatialEvent {
  type: 'kill';
  killerImportance: number;
  victimImportance: number;
}

// API response wrapper
export interface SpatialDataResponse {
  data: SpatialData;
  events: SpatialEvent[];
  timestamp: string;
}
