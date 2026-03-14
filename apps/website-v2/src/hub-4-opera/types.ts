/**
 * OPERA Hub Type Definitions
 * TypeScript interfaces and types for map visualization and spatial analysis
 * 
 * [Ver001.000]
 */

/** Position coordinates on the map */
export interface Position {
  x: number;
  y: number;
}

/** Map dimensions */
export interface MapSize {
  width: number;
  height: number;
}

/** Bombsite data */
export interface Bombsite {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'bombsite';
}

/** Callout/location marker */
export interface Callout {
  id: string;
  name: string;
  x: number;
  y: number;
}

/** Heatmap data point for tactical visualization */
export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

/** Map statistics */
export interface MapStats {
  avgControlTime: string;
  rotationSpeed: number;
  peakZones: number;
  sightCoverage: number;
}

/** Spawn positions for attackers and defenders */
export interface Spawns {
  attacker: Position;
  defender: Position;
}

/** Complete map data structure */
export interface MapData {
  id: string;
  name: string;
  game: string;
  size: MapSize;
  sites: Bombsite[];
  spawns: Spawns;
  callouts: Callout[];
  heatmap: HeatmapPoint[];
  stats: MapStats;
}

/** Fog overlay settings */
export interface FogSettings {
  enabled: boolean;
  intensity: number;
  animate: boolean;
}

/** Layer visibility state */
export interface LayerState {
  callouts: boolean;
  spawns: boolean;
  sightlines: boolean;
  cover: boolean;
  rotation: boolean;
}

/** View mode options */
export type ViewMode = 'tactical' | 'fog' | 'grid';

/** OPERA hub state */
export interface OperaHubState {
  selectedMap: string;
  zoom: number;
  viewMode: ViewMode;
  layers: LayerState;
  fogSettings: FogSettings;
}

/** Map list item (simplified map info) */
export interface MapListItem {
  id: string;
  name: string;
  game: string;
}

/** Map metadata for selector */
export interface MapMetadata {
  id: string;
  name: string;
  game: string;
  size: string;
  layout: string;
}

/** View mode configuration */
export interface ViewModeConfig {
  id: ViewMode;
  name: string;
  icon: React.ElementType;
  description: string;
}

/** Layer configuration */
export interface LayerConfig {
  id: keyof LayerState;
  name: string;
  enabled: boolean;
}

/** Cache entry structure */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Purple theme colors */
export interface PurpleTheme {
  base: string;
  glow: string;
  muted: string;
}

/** useOperaData hook return type */
export interface UseOperaDataReturn {
  mapData: MapData | null;
  mapList: MapListItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<MapData | undefined>;
  refreshAll: () => Promise<void>;
  invalidateMapCache: (id?: string) => void;
  clearCache: () => void;
  preloadMap: (id: string) => Promise<MapData | undefined>;
  getHeatmapData: () => HeatmapPoint[];
  getCallout: (calloutId: string) => Callout | null;
  getSite: (siteId: string) => Bombsite | null;
  mapToScreen: (mapX: number, mapY: number, canvasWidth: number, canvasHeight: number) => Position;
  screenToMap: (screenX: number, screenY: number, canvasWidth: number, canvasHeight: number) => Position;
  theme: PurpleTheme;
}

/** MapVisualization component props */
export interface MapVisualizationProps {
  mapId: string;
  mapData: MapData | null;
  zoom?: number;
  layers?: Partial<LayerState>;
  viewMode?: ViewMode;
  loading?: boolean;
}

/** FogOverlay component props */
export interface FogOverlayProps {
  intensity?: number;
  color?: string;
  animated?: boolean;
  pattern?: 'radial' | 'linear' | 'grid';
}

/** Callout marker for rendering */
export interface CalloutMarker {
  name: string;
  x: number;
  y: number;
}

/** Canvas dimensions */
export interface CanvasDimensions {
  width: number;
  height: number;
}

/** Fog particle for animation */
export interface FogParticle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

/** Cover zone rectangle */
export interface CoverZone {
  x: number;
  y: number;
  w: number;
  h: number;
}
