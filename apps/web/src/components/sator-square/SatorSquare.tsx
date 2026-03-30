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

import React, { useState, useCallback } from 'react';
import { SatorLayer, type SatorEvent } from './layers/SatorLayer';
import { OperaLayer } from './layers/OperaLayer';
import { TenetLayer, type ControlZone } from './layers/TenetLayer';
import { ArepoLayer, type ArepoMarker } from './layers/ArepoLayer';
import { RotasLayer, type RotasTrail } from './layers/RotasLayer';
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

// Type adapters to convert hook data to layer props
function adaptSatorEvents(data: any[]): SatorEvent[] {
  return data.map(d => ({
    playerId: d.playerId || '',
    mapX: d.mapX || 0,
    mapY: d.mapY || 0,
    eventType: d.eventType || 'mvp',
    intensity: d.intensity || 0.5,
  }));
}

function adaptControlZones(data: any[]): ControlZone[] {
  return data.map(d => ({
    id: d.id || '',
    polygon: d.polygon || [],
    controlTeam: d.controlTeam || 'contested',
    grade: d.grade || 'C',
    controlStrength: d.controlStrength || 0.5,
  }));
}

function adaptArepoMarkers(data: any[]): ArepoMarker[] {
  return data.map(d => ({
    x: d.x || 0,
    y: d.y || 0,
    victimTeam: d.victimTeam || 'attack',
    isMultikill: d.isMultikill || false,
    multikillCount: d.multikillCount || 1,
    isClutch: d.isClutch || false,
    roundNumber: d.roundNumber || 1,
    age: d.age || 0,
  }));
}

function adaptRotasTrails(data: any[]): RotasTrail[] {
  return data.map(d => ({
    playerId: d.playerId || '',
    team: d.team || 'attack',
    positions: d.positions || [],
    directionLR: d.directionLR || 0,
  }));
}

export const SatorSquare: React.FC<SatorSquareProps> = ({
  matchId,
  width = 800,
  height = 800,
  activeLayers = ['sator', 'opera', 'tenet', 'arepo', 'rotas'],
}) => {
  const [layers, setLayers] = useState<LayerConfig[]>(
    DEFAULT_LAYERS.map(l => ({
      ...l,
      enabled: activeLayers.includes(l.id),
    }))
  );
  
  // Fetch spatial data from Feature Store
  const { satorEvents, arepoMarkers, rotasTrails, controlZones, visibilityMask, loading, error } = useSpatialData(matchId);
  
  const handleLayerToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, enabled: !l.enabled } : l
    ));
  }, []);
  
  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, opacity } : l
    ));
  }, []);
  
  if (loading) {
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
        {layers.find(l => l.id === 'sator')?.enabled && satorEvents.length > 0 && (
          <SatorLayer
            events={adaptSatorEvents(satorEvents)}
            width={width}
            height={height}
            mapToScreen={(x, y) => [x * width, y * height]}
          />
        )}
        
        {/* OPERA Layer - Fog of War */}
        {layers.find(l => l.id === 'opera')?.enabled && visibilityMask && (
          <OperaLayer
            width={width}
            height={height}
            visibilityMask={visibilityMask}
            uncertaintyPoints={[]}
          />
        )}
        
        {/* TENET Layer - Area Control */}
        {layers.find(l => l.id === 'tenet')?.enabled && controlZones.length > 0 && (
          <TenetLayer
            zones={adaptControlZones(controlZones)}
            width={width}
            height={height}
          />
        )}
        
        {/* AREPO Layer - Death Stains */}
        {layers.find(l => l.id === 'arepo')?.enabled && arepoMarkers.length > 0 && (
          <ArepoLayer
            markers={adaptArepoMarkers(arepoMarkers)}
            width={width}
            height={height}
            currentRound={1}
            persistRounds={3}
          />
        )}
        
        {/* ROTAS Layer - Rotation Trails */}
        {layers.find(l => l.id === 'rotas')?.enabled && rotasTrails.length > 0 && (
          <RotasLayer
            trails={adaptRotasTrails(rotasTrails)}
            width={width}
            height={height}
            currentTick={0}
            trailLength={10}
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
