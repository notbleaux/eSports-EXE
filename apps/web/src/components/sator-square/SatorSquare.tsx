/**
 * SATOR Square - 5-Layer Palindromic Visualization
 * 
 * Main container component that orchestrates all 5 layers:
 * - SATOR (Golden Halo): High-impact moment visualization
 * - OPERA (Fog of War): Uncertainty heatmaps
 * - TENET (Area Control): Zone grading system
 * - AREPO (Death Stains): Death location persistence
 * - ROTAS (Rotation Trails): Movement path visualization
 * 
 * Integration: Connects to eSports-EXE Feature Store for live data
 */

import React, { useEffect, useState, useCallback } from 'react';
import { SatorLayer } from './layers/SatorLayer';
import { OperaLayer } from './layers/OperaLayer';
import { TenetLayer } from './layers/TenetLayer';
import { ArepoLayer } from './layers/ArepoLayer';
import { RotasLayer } from './layers/RotasLayer';
import { useSpatialData } from './hooks/useSpatialData';
import type { SatorSquareProps } from './index';

interface LayerConfig {
  id: 'sator' | 'opera' | 'tenet' | 'arepo' | 'rotas';
  name: string;
  description: string;
  enabled: boolean;
  opacity: number;
}

const DEFAULT_LAYERS: LayerConfig[] = [
  { id: 'sator', name: 'SATOR', description: 'Impact visualization', enabled: true, opacity: 0.8 },
  { id: 'opera', name: 'OPERA', description: 'Uncertainty heatmap', enabled: true, opacity: 0.6 },
  { id: 'tenet', name: 'TENET', description: 'Area control', enabled: true, opacity: 0.7 },
  { id: 'arepo', name: 'AREPO', description: 'Death locations', enabled: true, opacity: 0.9 },
  { id: 'rotas', name: 'ROTAS', description: 'Movement trails', enabled: true, opacity: 0.5 },
];

export const SatorSquare: React.FC<SatorSquareProps> = ({
  matchId,
  width = 800,
  height = 800,
  activeLayers = ['sator', 'opera', 'tenet', 'arepo', 'rotas'],
  onLayerClick,
}) => {
  const [layers, setLayers] = useState<LayerConfig[]>(
    DEFAULT_LAYERS.map(l => ({
      ...l,
      enabled: activeLayers.includes(l.id),
    }))
  );
  
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  
  // Fetch spatial data from Feature Store
  const { data: spatialData, isLoading, error } = useSpatialData(matchId);
  
  const handleLayerToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, enabled: !l.enabled } : l
    ));
  }, []);
  
  const handleLayerClick = useCallback((layerId: string, data: any) => {
    setSelectedLayer(layerId);
    onLayerClick?.(layerId, data);
  }, [onLayerClick]);
  
  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, opacity } : l
    ));
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-sator-400 animate-pulse">Loading SATOR Square...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-red-400">Error loading visualization: {error.message}</div>
      </div>
    );
  }
  
  return (
    <div className="sator-square-container">
      {/* Layer Controls */}
      <div className="sator-controls mb-4 flex flex-wrap gap-2">
        {layers.map(layer => (
          <button
            key={layer.id}
            onClick={() => handleLayerToggle(layer.id)}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-all
              ${layer.enabled 
                ? 'bg-sator-500 text-white' 
                : 'bg-surface-700 text-surface-400'
              }
              ${selectedLayer === layer.id ? 'ring-2 ring-sator-300' : ''}
            `}
            title={layer.description}
          >
            {layer.name}
          </button>
        ))}
      </div>
      
      {/* Visualization Canvas */}
      <div 
        className="sator-canvas relative bg-surface-900 rounded-lg overflow-hidden"
        style={{ width, height }}
      >
        {/* Base map layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-800 to-surface-900" />
        
        {/* SATOR Layer - Golden Halo */}
        {layers.find(l => l.id === 'sator')?.enabled && (
          <SatorLayer
            data={spatialData}
            opacity={layers.find(l => l.id === 'sator')?.opacity}
            onClick={(data) => handleLayerClick('sator', data)}
            width={width}
            height={height}
          />
        )}
        
        {/* OPERA Layer - Fog of War */}
        {layers.find(l => l.id === 'opera')?.enabled && (
          <OperaLayer
            data={spatialData}
            opacity={layers.find(l => l.id === 'opera')?.opacity}
            onClick={(data) => handleLayerClick('opera', data)}
            width={width}
            height={height}
          />
        )}
        
        {/* TENET Layer - Area Control */}
        {layers.find(l => l.id === 'tenet')?.enabled && (
          <TenetLayer
            data={spatialData}
            opacity={layers.find(l => l.id === 'tenet')?.opacity}
            onClick={(data) => handleLayerClick('tenet', data)}
            width={width}
            height={height}
          />
        )}
        
        {/* AREPO Layer - Death Stains */}
        {layers.find(l => l.id === 'arepo')?.enabled && (
          <ArepoLayer
            data={spatialData}
            opacity={layers.find(l => l.id === 'arepo')?.opacity}
            onClick={(data) => handleLayerClick('arepo', data)}
            width={width}
            height={height}
          />
        )}
        
        {/* ROTAS Layer - Rotation Trails */}
        {layers.find(l => l.id === 'rotas')?.enabled && (
          <RotasLayer
            data={spatialData}
            opacity={layers.find(l => l.id === 'rotas')?.opacity}
            onClick={(data) => handleLayerClick('rotas', data)}
            width={width}
            height={height}
          />
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-surface-800/80 backdrop-blur rounded p-3 text-xs">
          <div className="text-surface-300 mb-2 font-semibold">SATOR Square Layers</div>
          {layers.filter(l => l.enabled).map(layer => (
            <div key={layer.id} className="flex items-center gap-2 mb-1">
              <div 
                className={`w-3 h-3 rounded-full bg-${layer.id}-500`}
                style={{ backgroundColor: getLayerColor(layer.id) }}
              />
              <span className="text-surface-400">{layer.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Opacity Sliders */}
      <div className="sator-opacity-controls mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
        {layers.filter(l => l.enabled).map(layer => (
          <div key={layer.id} className="flex flex-col gap-1">
            <label className="text-xs text-surface-400">{layer.name} Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layer.opacity}
              onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
              className="w-full accent-sator-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

function getLayerColor(layerId: string): string {
  const colors: Record<string, string> = {
    sator: '#FFD700',  // Gold
    opera: '#8B9DC3',  // Fog blue
    tenet: '#4A90E2',  // Control blue
    arepo: '#E74C3C',  // Death red
    rotas: '#2ECC71',  // Trail green
  };
  return colors[layerId] || '#888888';
}

export default SatorSquare;
