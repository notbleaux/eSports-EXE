/**
 * SATOR Square Visualization Component
 * 
 * 5-layer palindromic visualization for tactical FPS analytics.
 * Layers: SATOR (impact), OPERA (uncertainty), TENET (control),
 *         AREPO (deaths), ROTAS (movement)
 * 
 * Migrated from satorXrotas - integrated with eSports-EXE Feature Store
 */

export { SatorSquare } from './SatorSquare';
export { SatorLayer } from './layers/SatorLayer';
export { OperaLayer } from './layers/OperaLayer';
export { TenetLayer } from './layers/TenetLayer';
export { ArepoLayer } from './layers/ArepoLayer';
export { RotasLayer } from './layers/RotasLayer';
export { useSpatialData } from './hooks/useSpatialData';

// Types
export interface SatorSquareProps {
  matchId?: string;
  width?: number;
  height?: number;
  activeLayers?: ('sator' | 'opera' | 'tenet' | 'arepo' | 'rotas')[];
  onLayerClick?: (layer: string, data: any) => void;
}

export interface LayerData {
  timestamp: number;
  spatialData: Float32Array;
  intensity: number;
}
