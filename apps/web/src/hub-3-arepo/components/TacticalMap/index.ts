/** [Ver001.001] - Added Vector2D export */
/**
 * Tactical Map Components - AREPO Hub
 * ===================================
 * Export all tactical map components for strategic analysis.
 */

export { TacticalMapContainer } from './TacticalMapContainer';
export { MapViewer } from './MapViewer';
export { GridOverlay } from './GridOverlay';
export { MapMarkers } from './MapMarkers';
export { MapCallouts } from './MapCallouts';
export { ZoomControls } from './ZoomControls';
export { MapSelector } from './MapSelector';
export { LineupLibrary } from './LineupLibrary';
export { MapAnnotationTools } from './MapAnnotationTools';

export { VALORANT_MAP_DATA, getMapById, getAllMaps, getMapsByGame } from './mapData';

export type {
  MapId,
  MapData,
  GameType,
  MapMarker,
  MapAnnotation,
  MapCallout,
  SpawnPoint,
  SpikeSite,
  Teleporter,
  Door,
  TacticalLineup,
  MapViewState,
  HeatmapData,
  GridConfig,
  Vector2D,
} from './types';

export { ZOOM_LIMITS, MAP_NAMES, VALORANT_MAPS } from './types';
