/** [Ver001.001] - Added Vector2D export */
/**
 * Tactical Map Types
 * ==================
 * TypeScript interfaces for tactical map system.
 */

export type MapId = 
  | 'ascent' 
  | 'bind' 
  | 'breeze' 
  | 'fracture' 
  | 'haven' 
  | 'icebox' 
  | 'lotus' 
  | 'pearl' 
  | 'split' 
  | 'sunset';

export type GameType = 'valorant' | 'cs2';

/** 2D Vector type for positions and directions */
export interface Vector2D {
  x: number;
  y: number;
}

export interface MapData {
  id: MapId;
  name: string;
  game: GameType;
  thumbnail: string;
  minimapUrl: string;
  fullmapUrl: string;
  radarUrl?: string;
  dimensions: {
    width: number;
    height: number;
    inGameUnits: number; // Total units across map
  };
  callouts: MapCallout[];
  spawns: SpawnPoint[];
  bombsites?: Bombsite[]; // For CS2
  spikeSites?: SpikeSite[]; // For Valorant
  teleporters?: Teleporter[]; // For Bind
  doors?: Door[]; // For doors (Ascent, etc.)
  zLevels: number; // Number of vertical levels
}

export interface MapCallout {
  id: string;
  name: string;
  x: number; // Percentage 0-100
  y: number;
  z: number; // Level index
  region: 'a' | 'b' | 'c' | 'mid' | 'spawn' | 'other';
  commonNames?: string[]; // Alternative callouts
}

export interface SpawnPoint {
  id: string;
  team: 'attacker' | 'defender';
  x: number;
  y: number;
  z: number;
}

export interface SpikeSite {
  id: 'A' | 'B' | 'C';
  name: string;
  x: number;
  y: number;
  z: number;
  plantRadius: number;
}

export interface Bombsite {
  id: 'A' | 'B';
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface Teleporter {
  id: string;
  entrance: { x: number; y: number; z: number };
  exit: { x: number; y: number; z: number };
  oneWay: boolean;
  cooldown: number;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  z: number;
  direction: 'horizontal' | 'vertical';
  destructible: boolean;
}

export interface MapMarker {
  id: string;
  type: 'ability' | 'position' | 'death' | 'kill' | 'utility' | 'annotation';
  x: number;
  y: number;
  z: number;
  playerId?: string;
  playerName?: string;
  agent?: string;
  ability?: string;
  round?: number;
  timestamp?: number;
  color?: string;
  note?: string;
}

export interface MapAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'line' | 'text' | 'area';
  x: number;
  y: number;
  z: number;
  endX?: number;
  endY?: number;
  radius?: number;
  text?: string;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  width: number;
  createdBy: string;
  createdAt: number;
}

export interface TacticalLineup {
  id: string;
  name: string;
  agent: string;
  ability: string;
  mapId: MapId;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  crosshairPosition?: { x: number; y: number }; // Screen coordinates for aim
  videoUrl?: string;
  imageUrl?: string;
  description: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  successRate?: number;
  createdBy: string;
  upvotes: number;
}

export interface MapViewState {
  zoom: number; // 0.25 to 4.0 (25% to 400%)
  panX: number;
  panY: number;
  zLevel: number;
  showGrid: boolean;
  gridSize: 'small' | 'medium' | 'large';
  showCallouts: boolean;
  showHeatmap: boolean;
  heatmapData?: HeatmapData;
}

export interface HeatmapData {
  type: 'kills' | 'deaths' | 'ability' | 'utility';
  points: { x: number; y: number; intensity: number }[];
  radius: number;
}

export interface GridConfig {
  size: number; // Grid cell size in pixels
  color: string;
  opacity: number;
  showCoordinates: boolean;
  coordinateSystem: 'alphabetic' | 'numeric' | 'chess';
}

export const ZOOM_LIMITS = {
  min: 0.25,  // 25% - Zoomed out, see entire map
  max: 4.0,   // 400% - Zoomed in for precise positioning
  default: 1.0, // 100%
  step: 0.1,    // 10% per zoom step
} as const;

export const MAP_NAMES: Record<MapId, string> = {
  ascent: 'Ascent',
  bind: 'Bind',
  breeze: 'Breeze',
  fracture: 'Fracture',
  haven: 'Haven',
  icebox: 'Icebox',
  lotus: 'Lotus',
  pearl: 'Pearl',
  split: 'Split',
  sunset: 'Sunset',
} as const;

export const VALORANT_MAPS: MapId[] = [
  'ascent', 'bind', 'breeze', 'fracture', 'haven',
  'icebox', 'lotus', 'pearl', 'split', 'sunset'
];
