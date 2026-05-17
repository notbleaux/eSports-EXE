// @ts-nocheck
/** [Ver001.000] */
/**
 * Tactical Map Container
 * ======================
 * Main container for the tactical map system in AREPO hub.
 * Integrates map viewer, lineup library, and annotation tools.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, 
  Layers, 
  Target, 
  Save, 
  Share2, 
  Upload,
  Download,
  ChevronRight,
  Grid3X3,
  Zap
} from 'lucide-react';
import HubWrapper, { HubCard, HubStatCard } from '@/shared/components/HubWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { MapViewer } from './MapViewer';
import { MapSelector } from './MapSelector';
import { LineupLibrary } from './LineupLibrary';
import { MapAnnotationTools } from './MapAnnotationTools';
import { VALORANT_MAP_DATA } from './mapData';
import { 
  MapId, 
  MapData, 
  MapMarker, 
  MapAnnotation, 
  TacticalLineup,
  MapViewState 
} from './types';

// Hub config
const HUB_CONFIG = {
  name: 'AREPO',
  subtitle: 'Tactical Maps',
  color: '#0066ff',
  glow: 'rgba(0, 102, 255, 0.4)',
};

type MapTab = 'viewer' | 'lineups' | 'annotations' | 'analysis';

export const TacticalMapContainer: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState<MapId>('ascent');
  const [activeTab, setActiveTab] = useState<MapTab>('viewer');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [annotations, setAnnotations] = useState<MapAnnotation[]>([]);
  const [lineups, setLineups] = useState<TacticalLineup[]>([]);
  const [showMapSelector, setShowMapSelector] = useState(false);

  const mapData = VALORANT_MAP_DATA[selectedMap];

  // Add marker on map click
  const handleMapClick = useCallback((x: number, y: number, z: number) => {
    if (activeTab !== 'annotations') return;
    
    const newMarker: MapMarker = {
      id: `marker-${Date.now()}`,
      type: 'annotation',
      x,
      y,
      z,
      note: 'New marker',
    };
    setMarkers(prev => [...prev, newMarker]);
  }, [activeTab]);

  // Remove marker
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setMarkers(prev => prev.filter(m => m.id !== marker.id));
  }, []);

  // Stats
  const mapStats = [
    { label: 'Maps Available', value: Object.keys(VALORANT_MAP_DATA).length.toString() },
    { label: 'Your Lineups', value: lineups.length.toString() },
    { label: 'Annotations', value: annotations.length.toString() },
    { label: 'Current Map', value: mapData.name },
  ];

  return (
    <div className="min-h-screen bg-[#050508] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            className="text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Tactical <span style={{ color: HUB_CONFIG.color }}>Maps</span>
          </motion.h1>
          <p className="text-white/60 max-w-2xl">
            Analyze maps with grid overlays, coordinate systems, and zoom capabilities. 
            Create lineups, annotations, and share strategies.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {mapStats.map((stat, i) => (
            <HubStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              color={i === 3 ? 'blue' : 'default'}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Map Selector */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Map className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                Select Map
              </h3>
              
              <div 
                className="p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors mb-3"
                onClick={() => setShowMapSelector(!showMapSelector)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: `${HUB_CONFIG.color}20`, color: HUB_CONFIG.color }}
                  >
                    {mapData.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-white">{mapData.name}</div>
                    <div className="text-sm text-white/40">{mapData.game}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-white/40" />
                </div>
              </div>

              <AnimatePresence>
                {showMapSelector && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {Object.values(VALORANT_MAP_DATA).map(map => (
                        <button
                          key={map.id}
                          className={`w-full p-2 rounded-lg text-left transition-colors ${
                            selectedMap === map.id 
                              ? 'bg-white/10 text-white' 
                              : 'text-white/60 hover:bg-white/5'
                          }`}
                          onClick={() => {
                            setSelectedMap(map.id);
                            setShowMapSelector(false);
                          }}
                        >
                          {map.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>

            {/* Tab Navigation */}
            <GlassCard className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
              <div className="space-y-2">
                {([
                  { id: 'viewer', label: 'Map Viewer', icon: Map },
                  { id: 'lineups', label: 'Lineups', icon: Target },
                  { id: 'annotations', label: 'Annotations', icon: Layers },
                  { id: 'analysis', label: 'Analysis', icon: Grid3X3 },
                ] as const).map(tab => (
                  <GlowButton
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </GlowButton>
                ))}
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">
                Actions
              </h3>
              <div className="space-y-2">
                <GlowButton variant="ghost" size="sm" className="w-full justify-start">
                  <Save className="w-4 h-4 mr-2" />
                  Save View
                </GlowButton>
                <GlowButton variant="ghost" size="sm" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </GlowButton>
                <GlowButton variant="ghost" size="sm" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </GlowButton>
                <GlowButton variant="ghost" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </GlowButton>
              </div>
            </GlassCard>
          </div>

          {/* Map Viewer */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'viewer' && (
                <motion.div
                  key="viewer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[600px] lg:h-[700px]"
                >
                  <MapViewer
                    mapData={mapData}
                    markers={markers}
                    annotations={annotations}
                    onMarkerClick={handleMarkerClick}
                    onMapClick={handleMapClick}
                    showTacticalTools
                  />
                </motion.div>
              )}

              {activeTab === 'lineups' && (
                <motion.div
                  key="lineups"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LineupLibrary
                    mapId={selectedMap}
                    lineups={lineups}
                    onSelectLineup={(lineup) => {
                      // Center map on lineup position
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'annotations' && (
                <motion.div
                  key="annotations"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[600px] lg:h-[700px]"
                >
                  <div className="flex h-full gap-4">
                    <div className="flex-1">
                      <MapViewer
                        mapData={mapData}
                        markers={markers}
                        annotations={annotations}
                        onMarkerClick={handleMarkerClick}
                        onMapClick={handleMapClick}
                        showTacticalTools
                      />
                    </div>
                    <div className="w-64">
                      <MapAnnotationTools
                        markers={markers}
                        onClear={() => setMarkers([])}
                        onUndo={() => setMarkers(prev => prev.slice(0, -1))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="p-8 text-center">
                    <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Heatmap Analysis
                    </h3>
                    <p className="text-white/60 mb-4">
                      View kill/death heatmaps and utility usage patterns.
                    </p>
                    <GlowButton variant="primary">
                      <Zap className="w-4 h-4 mr-2" />
                      Load Match Data
                    </GlowButton>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalMapContainer;
