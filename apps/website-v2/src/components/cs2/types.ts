/** [Ver001.000]
 * CS2 Component Types
 * 
 * TypeScript interfaces for CS2-specific components.
 */

// ============================================================================
// CS2 Map Types
// ============================================================================

export type CS2MapId = 
  | 'dust2' 
  | 'mirage' 
  | 'inferno' 
  | 'nuke' 
  | 'overpass' 
  | 'ancient' 
  | 'anubis' 
  | 'vertigo'
  | 'train'
  | 'cache';

export interface CS2MapData {
  id: CS2MapId;
  name: string;
  game: 'cs2';
  thumbnail: string;
  minimapUrl: string;
  fullmapUrl: string;
  radarUrl?: string;
  dimensions: {
    width: number;
    height: number;
    inGameUnits: number;
  };
  callouts: CS2MapCallout[];
  spawns: CS2SpawnPoint[];
  bombsites: CS2Bombsite[];
  zLevels: number;
  competitivePool: boolean;
  releaseDate: string;
}

export interface CS2MapCallout {
  id: string;
  name: string;
  x: number; // Percentage 0-100
  y: number;
  z: number;
  region: 'a' | 'b' | 'mid' | 'tspawn' | 'ctspawn' | 'other';
  commonNames?: string[];
}

export interface CS2SpawnPoint {
  id: string;
  team: 't' | 'ct';
  x: number;
  y: number;
  z: number;
}

export interface CS2Bombsite {
  id: 'A' | 'B';
  name: string;
  x: number;
  y: number;
  z: number;
  plantRadius: number;
}

// ============================================================================
// CS2 Weapon Types
// ============================================================================

export type CS2WeaponCategory = 
  | 'pistol' 
  | 'smg' 
  | 'rifle' 
  | 'sniper' 
  | 'shotgun' 
  | 'machinegun' 
  | 'grenade' 
  | 'equipment';

export type CS2WeaponSide = 'terrorist' | 'counterterrorist' | 'both';

export interface CS2Weapon {
  id: string;
  name: string;
  category: CS2WeaponCategory;
  side: CS2WeaponSide;
  price: number;
  killReward: number;
  stats: CS2WeaponStats;
  magazineSize: number;
  reserveAmmo: number;
  fireModes: CS2FireMode[];
  description?: string;
  iconUrl?: string;
}

export interface CS2WeaponStats {
  damage: number;
  fireRate: number; // RPM
  recoilControl: number; // 0-100
  accurateRange: number; // meters
  armorPenetration: number; // 0-200%
  movementSpeed: number; // percentage of base speed
  headshotMultiplier: number;
}

export type CS2FireMode = 'semi' | 'burst' | 'auto';

// ============================================================================
// CS2 Heatmap Types
// ============================================================================

export interface CS2HeatmapData {
  type: 'kills' | 'deaths' | 'utility' | 'flash' | 'smoke' | 'fire';
  points: CS2HeatmapPoint[];
  radius: number;
  intensity: number;
  team?: 't' | 'ct' | 'both';
  round?: number;
}

export interface CS2HeatmapPoint {
  x: number; // 0-100 percentage
  y: number;
  z: number;
  intensity: number; // 0-1
  timestamp?: number;
  playerId?: string;
}

// ============================================================================
// CS2 Map View State
// ============================================================================

export interface CS2MapViewState {
  zoom: number;
  panX: number;
  panY: number;
  zLevel: number;
  showGrid: boolean;
  showCallouts: boolean;
  showHeatmap: boolean;
  heatmapData?: CS2HeatmapData;
  activeLayer: 'default' | 'heatmap' | 'utility' | 'spawns';
}

export const CS2_ZOOM_LIMITS = {
  min: 0.25,
  max: 4.0,
  default: 1.0,
  step: 0.1,
} as const;

// ============================================================================
// CS2 Map Constants
// ============================================================================

export const CS2_MAP_NAMES: Record<CS2MapId, string> = {
  dust2: 'Dust II',
  mirage: 'Mirage',
  inferno: 'Inferno',
  nuke: 'Nuke',
  overpass: 'Overpass',
  ancient: 'Ancient',
  anubis: 'Anubis',
  vertigo: 'Vertigo',
  train: 'Train',
  cache: 'Cache',
} as const;

export const CS2_ACTIVE_MAPS: CS2MapId[] = [
  'dust2', 'mirage', 'inferno', 'nuke', 'overpass', 'ancient', 'anubis', 'vertigo'
];

export const CS2_LEGACY_MAPS: CS2MapId[] = [
  'train', 'cache'
];

// ============================================================================
// CS2 Weapon Constants
// ============================================================================

export const CS2_WEAPON_CATEGORIES: Record<CS2WeaponCategory, { name: string; color: string }> = {
  pistol: { name: 'Pistols', color: '#f59e0b' },
  smg: { name: 'SMGs', color: '#10b981' },
  rifle: { name: 'Rifles', color: '#3b82f6' },
  sniper: { name: 'Sniper Rifles', color: '#8b5cf6' },
  shotgun: { name: 'Shotguns', color: '#ef4444' },
  machinegun: { name: 'Machine Guns', color: '#6b7280' },
  grenade: { name: 'Grenades', color: '#f97316' },
  equipment: { name: 'Equipment', color: '#6366f1' },
} as const;
