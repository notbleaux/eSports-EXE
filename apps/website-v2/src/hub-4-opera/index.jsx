/**
 * OPERA Hub - Hub 4: The Nexus
 * Maps, fog of war, and spatial visualization with purple theme
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Layers,
  Eye,
  EyeOff,
  Grid3X3,
  Target,
  Navigation,
  Scan,
  Filter,
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import HubWrapper, { HubCard, HubStatCard } from '@/shared/components/HubWrapper';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';
import { colors } from '@/theme/colors';
import MapVisualization from './components/MapVisualization';
import FogOverlay from './components/FogOverlay';
import useOperaData from './hooks/useOperaData';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';

// Hub Configuration with EXACT purple colors
const HUB_CONFIG = {
  name: 'OPERA',
  subtitle: 'The Nexus',
  description: 'Maps, fog of war, and spatial visualization',
  color: colors.hub.opera.base,      // #9d4edd
  glow: colors.hub.opera.glow,       // rgba(157, 78, 221, 0.4)
};

// Available maps for visualization
const MAPS = [
  { id: 'ascent', name: 'Ascent', game: 'Valorant', size: 'Medium', layout: 'Open' },
  { id: 'bind', name: 'Bind', game: 'Valorant', size: 'Small', layout: 'Linear' },
  { id: 'haven', name: 'Haven', game: 'Valorant', size: 'Large', layout: '3 Sites' },
  { id: 'split', name: 'Split', game: 'Valorant', size: 'Medium', layout: 'Vertical' },
  { id: 'lotus', name: 'Lotus', game: 'Valorant', size: 'Large', layout: '3 Sites' },
  { id: 'sunset', name: 'Sunset', game: 'Valorant', size: 'Medium', layout: 'Standard' },
];

// View modes
const VIEW_MODES = [
  { id: 'tactical', name: 'Tactical', icon: Target, description: 'Heat maps and positioning' },
  { id: 'fog', name: 'Fog of War', icon: EyeOff, description: 'Vision and control zones' },
  { id: 'grid', name: 'Grid View', icon: Grid3X3, description: 'Spatial coordinates' },
];

// Layer options
const LAYERS = [
  { id: 'callouts', name: 'Callouts', enabled: true },
  { id: 'spawns', name: 'Spawn Points', enabled: true },
  { id: 'sightlines', name: 'Sight Lines', enabled: false },
  { id: 'cover', name: 'Cover Zones', enabled: false },
  { id: 'rotation', name: 'Rotation Paths', enabled: false },
];

function OperaHubContent() {
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);
  const [viewMode, setViewMode] = useState('tactical');
  const [activeLayers, setActiveLayers] = useState(
    LAYERS.reduce((acc, layer) => ({ ...acc, [layer.id]: layer.enabled }), {})
  );
  const [zoom, setZoom] = useState(1);
  const [showFog, setShowFog] = useState(true);
  const [fogIntensity, setFogIntensity] = useState(0.6);

  const addNotification = useNJZStore((state) => state.addNotification);
  const { state: hubState, setState } = useHubState('opera');
  const { mapData, loading, error } = useOperaData(selectedMap.id);

  // Handle map selection
  const handleMapSelect = (map) => {
    setSelectedMap(map);
    addNotification(`Loaded ${map.name} - ${map.layout} layout`, 'info');
    setState({ selectedMap: map.id });
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setShowFog(mode === 'fog');
    addNotification(`Switched to ${VIEW_MODES.find((v) => v.id === mode)?.name} view`, 'info');
  };

  // Toggle layer
  const toggleLayer = (layerId) => {
    setActiveLayers((prev) => {
      const newState = { ...prev, [layerId]: !prev[layerId] };
      addNotification(
        `${LAYERS.find((l) => l.id === layerId)?.name} ${newState[layerId] ? 'enabled' : 'disabled'}`,
        'info'
      );
      return newState;
    });
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));

  // Purple color values (exact from requirements)
  const purple = {
    base: '#9d4edd',
    glow: 'rgba(157, 78, 221, 0.4)',
    muted: '#7a3aaa',
  };

  return (
    <HubWrapper hubId="opera">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard
            label="Active Maps"
            value="6"
            change="Updated"
            color="cyan"
          />
          <HubStatCard
            label="Data Points"
            value="12.4K"
            change="Per map"
            color="amber"
          />
          <HubStatCard
            label="Sight Lines"
            value="847"
            change="Analyzed"
            color="green"
          />
          <HubStatCard
            label="Coverage"
            value="98%"
            change="Complete"
            color="gold"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Map Visualization */}
        <div className="lg:col-span-2 space-y-8">
          {/* Map Viewer */}
          <HubCard
            accent="cyan"
            className="relative overflow-hidden"
            style={{ borderColor: purple.base }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Map className="w-5 h-5" style={{ color: purple.base }} />
                <h3 className="font-display font-semibold">{selectedMap.name}</h3>
                <span className="text-xs px-2 py-1 rounded bg-white/5 text-slate">
                  {selectedMap.game}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ZoomOut className="w-4 h-4 text-slate" />
                </button>
                <span className="text-xs font-mono text-slate w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-slate" />
                </button>
              </div>
            </div>

            {/* Map Visualization Container */}
            <div className="relative aspect-video bg-void-mid rounded-lg overflow-hidden">
              {/* Map Visualization Component */}
              <MapVisualization
                mapId={selectedMap.id}
                mapData={mapData}
                zoom={zoom}
                layers={activeLayers}
                viewMode={viewMode}
                loading={loading}
              />

              {/* Fog Overlay */}
              <AnimatePresence>
                {showFog && (
                  <FogOverlay
                    intensity={fogIntensity}
                    color={purple.base}
                    animated={true}
                  />
                )}
              </AnimatePresence>

              {/* View Mode Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-void-black/80 backdrop-blur-sm border border-white/10">
                {viewMode === 'fog' ? (
                  <EyeOff className="w-4 h-4" style={{ color: purple.base }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: purple.base }} />
                )}
                <span className="text-xs text-slate capitalize">{viewMode} View</span>
              </div>
            </div>

            {/* View Mode Selector */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleViewModeChange(mode.id)}
                  className={`p-3 rounded-xl border transition-all duration-300 text-left ${
                    viewMode === mode.id
                      ? 'bg-white/10'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    borderColor: viewMode === mode.id ? purple.base : 'rgba(255,255,255,0.1)',
                    boxShadow: viewMode === mode.id ? `0 0 20px ${purple.glow}` : 'none',
                  }}
                >
                  <mode.icon
                    className="w-5 h-5 mb-2"
                    style={{ color: viewMode === mode.id ? purple.base : '#6a6a7a' }}
                  />
                  <div className="font-medium text-sm">{mode.name}</div>
                  <div className="text-xs text-slate">{mode.description}</div>
                </button>
              ))}
            </div>
          </HubCard>

          {/* Layer Controls */}
          <HubCard accent="cyan">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5" style={{ color: purple.base }} />
              <h3 className="font-display font-semibold">Layer Controls</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                    activeLayers[layer.id]
                      ? 'bg-white/10'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    borderColor: activeLayers[layer.id] ? purple.base : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Scan className="w-4 h-4" style={{ color: activeLayers[layer.id] ? purple.base : '#6a6a7a' }} />
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        activeLayers[layer.id] ? 'bg-green-400' : 'bg-slate'
                      }`}
                    />
                  </div>
                  <div className="text-xs text-slate">{layer.name}</div>
                </button>
              ))}
            </div>
          </HubCard>

          {/* Spatial Analysis */}
          <HubCard accent="cyan">
            <div className="flex items-center gap-3 mb-4">
              <Compass className="w-5 h-5" style={{ color: purple.base }} />
              <h3 className="font-display font-semibold">Spatial Analysis</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Control Time', value: '2:34', unit: 'min' },
                { label: 'Rotation Speed', value: '14.2', unit: 'sec' },
                { label: 'Peak Zones', value: '7', unit: 'areas' },
                { label: 'Sight Coverage', value: '73%', unit: 'map' },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-lg bg-white/5">
                  <div className="text-xs text-slate mb-1">{stat.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-bold" style={{ color: purple.base }}>
                      {stat.value}
                    </span>
                    <span className="text-xs text-slate">{stat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </HubCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Map Selector */}
          <HubCard accent="cyan">
            <div className="flex items-center gap-3 mb-4">
              <Navigation className="w-5 h-5" style={{ color: purple.base }} />
              <h3 className="font-display font-semibold">Select Map</h3>
            </div>
            <div className="space-y-2">
              {MAPS.map((map) => (
                <button
                  key={map.id}
                  onClick={() => handleMapSelect(map)}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                    selectedMap.id === map.id
                      ? 'bg-white/10'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    borderColor: selectedMap.id === map.id ? purple.base : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{map.name}</div>
                      <div className="text-xs text-slate">
                        {map.size} • {map.layout}
                      </div>
                    </div>
                    {selectedMap.id === map.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: purple.base }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </HubCard>

          {/* Fog Settings */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5" style={{ color: purple.base }} />
                <h3 className="font-display font-semibold">Fog Settings</h3>
              </div>
              <button
                onClick={() => setShowFog(!showFog)}
                className={`p-2 rounded-lg transition-colors ${
                  showFog ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                {showFog ? (
                  <Eye className="w-4 h-4" style={{ color: purple.base }} />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate" />
                )}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate">Intensity</span>
                  <span className="text-xs font-mono" style={{ color: purple.base }}>
                    {Math.round(fogIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={fogIntensity}
                  onChange={(e) => setFogIntensity(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${purple.base} 0%, ${purple.base} ${fogIntensity * 100}%, rgba(255,255,255,0.1) ${fogIntensity * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-slate">
                  Fog of War visualization shows vision control areas and blind spots on the map.
                </div>
              </div>
            </div>
          </HubCard>

          {/* Quick Stats */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <Maximize2 className="w-5 h-5 text-slate" />
              <h3 className="font-display font-semibold">Map Properties</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Area', value: '12,450', unit: 'm²' },
                { label: 'Elevation', value: '3', unit: 'levels' },
                { label: 'Bombsites', value: '2', unit: 'sites' },
                { label: 'Spawn Points', value: '8', unit: 'total' },
              ].map((prop) => (
                <div key={prop.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate">{prop.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono" style={{ color: purple.base }}>
                      {prop.value}
                    </span>
                    <span className="text-xs text-slate">{prop.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </HubCard>

          {/* Info Card */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <Map className="w-5 h-5 text-slate" />
              <h3 className="font-display font-semibold">About OPERA</h3>
            </div>
            <p className="text-sm text-slate mb-4">
              The Nexus provides advanced spatial visualization for tactical analysis. 
              Explore map layouts, sight lines, and control zones with interactive fog of war.
            </p>
            <div className="text-xs text-slate font-mono space-y-1">
              <div>Renderer: WebGL 2.0</div>
              <div>Grid: 100x100 units</div>
              <div>Update: Real-time</div>
            </div>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  );
}

function OperaHub() {
  return (
    <PanelErrorBoundary panelId="opera-hub" panelTitle="OPERA Nexus" hub="OPERA">
      <OperaHubContent />
    </PanelErrorBoundary>
  );
}

export default OperaHub;
