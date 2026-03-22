/** [Ver001.000]
 * CS2MapViewer Component
 * 
 * Display CS2 maps with heatmap overlay and basic navigation.
 * Supports zoom, pan, and layer switching.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  MapPin, 
  Layers,
  Maximize,
  Minimize,
  Crosshair,
  Flame,
  Target
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import type { 
  CS2MapData, 
  CS2MapViewState, 
  CS2HeatmapData,
  CS2_ZOOM_LIMITS 
} from './types';

interface CS2MapViewerProps {
  mapData: CS2MapData;
  heatmapData?: CS2HeatmapData;
  onMapClick?: (x: number, y: number, z: number) => void;
  readOnly?: boolean;
  className?: string;
}

export const CS2MapViewer: React.FC<CS2MapViewerProps> = ({
  mapData,
  heatmapData,
  onMapClick,
  readOnly = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [viewState, setViewState] = useState<CS2MapViewState>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    zLevel: 0,
    showGrid: false,
    showCallouts: true,
    showHeatmap: false,
    heatmapData: undefined,
    activeLayer: 'default',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.1, 4.0),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.1, 0.25),
    }));
  }, []);

  const handleZoomReset = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: 1.0,
      panX: 0,
      panY: 0,
    }));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || readOnly) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.panX, y: e.clientY - viewState.panY });
  }, [viewState.panX, viewState.panY, readOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewState(prev => ({
      ...prev,
      panX: e.clientX - dragStart.x,
      panY: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(prev.zoom + delta, 4.0)),
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleZoomReset();
          break;
        case 'g':
          if (e.ctrlKey) {
            e.preventDefault();
            setViewState(prev => ({ ...prev, showGrid: !prev.showGrid }));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleZoomReset]);

  const zoomPercent = Math.round(viewState.zoom * 100);

  // Generate heatmap overlay
  const renderHeatmap = () => {
    if (!viewState.showHeatmap || !heatmapData) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {heatmapData.points.map((point, index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: heatmapData.radius * 2,
              height: heatmapData.radius * 2,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${
                heatmapData.type === 'kills' ? 'rgba(239, 68, 68,' :
                heatmapData.type === 'deaths' ? 'rgba(107, 114, 128,' :
                'rgba(245, 158, 11,'
              } ${point.intensity * 0.6}) 0%, transparent 70%)`,
            }}
          />
        ))}
      </div>
    );
  };

  // Generate grid overlay
  const renderGrid = () => {
    if (!viewState.showGrid) return null;
    
    const gridSize = 50;
    const cols = Math.ceil(mapData.dimensions.width / gridSize);
    const rows = Math.ceil(mapData.dimensions.height / gridSize);
    
    return (
      <svg 
        className="absolute inset-0 pointer-events-none"
        width={mapData.dimensions.width}
        height={mapData.dimensions.height}
      >
        <defs>
          <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path 
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Coordinate labels */}
        {Array.from({ length: cols }).map((_, i) => (
          <text
            key={`col-${i}`}
            x={i * gridSize + 5}
            y={15}
            fill="rgba(255, 255, 255, 0.3)"
            fontSize={10}
            fontFamily="monospace"
          >
            {String.fromCharCode(65 + i)}
          </text>
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <text
            key={`row-${i}`}
            x={5}
            y={i * gridSize + 25}
            fill="rgba(255, 255, 255, 0.3)"
            fontSize={10}
            fontFamily="monospace"
          >
            {i + 1}
          </text>
        ))}
      </svg>
    );
  };

  // Render callouts
  const renderCallouts = () => {
    if (!viewState.showCallouts) return null;
    
    return (
      <>
        {mapData.callouts.map((callout) => (
          <div
            key={callout.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${callout.x}%`,
              top: `${callout.y}%`,
            }}
          >
            <div className="px-2 py-1 bg-black/60 rounded text-xs text-white/80 whitespace-nowrap">
              {callout.name}
            </div>
          </div>
        ))}
      </>
    );
  };

  // Render bombsite markers
  const renderBombsites = () => {
    return (
      <>
        {mapData.bombsites.map((site) => (
          <div
            key={site.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${site.x}%`,
              top: `${site.y}%`,
            }}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${site.id === 'A' ? 'bg-orange-500/80' : 'bg-blue-500/80'}
              border-2 border-white/50
            `}>
              <span className="text-xs font-bold text-white">{site.id}</span>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <GlassCard 
      className={`relative overflow-hidden ${showFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}
      variant="elevated"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-orange-600/90 to-amber-600/90 backdrop-blur-sm border-b border-white/20 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">{mapData.name}</span>
            {mapData.competitivePool && (
              <span className="px-2 py-0.5 bg-green-500/80 rounded-full text-[10px] text-white">
                Active Duty
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">
              {zoomPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-[400px] bg-[#1a1a1a] mt-10"
      >
        <div
          ref={mapRef}
          className={`relative w-full h-full ${readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Map Image Container */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Base Map */}
            <div 
              className="relative"
              style={{
                width: mapData.dimensions.width,
                height: mapData.dimensions.height,
              }}
            >
              {/* Placeholder for actual map image */}
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden"
                style={{
                  backgroundImage: mapData.minimapUrl ? `url(${mapData.minimapUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Fallback pattern when no image */}
                {!mapData.minimapUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Target className="w-16 h-16 text-orange-500/30 mx-auto mb-2" />
                      <span className="text-white/30 text-sm">{mapData.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Overlays */}
              {renderGrid()}
              {renderHeatmap()}
              {renderCallouts()}
              {renderBombsites()}
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </GlowButton>
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={handleZoomReset}
            title="Reset (0)"
          >
            <Target className="w-4 h-4" />
          </GlowButton>
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </GlowButton>
        </div>

        {/* Layer Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
          <GlowButton
            variant={viewState.showGrid ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
            title="Toggle Grid (Ctrl+G)"
          >
            <Grid3X3 className="w-4 h-4" />
          </GlowButton>

          <GlowButton
            variant={viewState.showCallouts ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, showCallouts: !prev.showCallouts }))}
            title="Toggle Callouts"
          >
            <MapPin className="w-4 h-4" />
          </GlowButton>

          <GlowButton
            variant={viewState.showHeatmap ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewState(prev => ({ ...prev, showHeatmap: !prev.showHeatmap }))}
            title="Toggle Heatmap"
          >
            <Flame className="w-4 h-4" />
          </GlowButton>

          <GlowButton
            variant="secondary"
            size="sm"
            onClick={() => setShowFullscreen(prev => !prev)}
            title="Toggle Fullscreen"
          >
            {showFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </GlowButton>
        </div>

        {/* Zoom Presets */}
        <div className="absolute bottom-4 left-4 flex gap-1 z-10">
          {[0.5, 1.0, 1.5, 2.0].map(zoom => (
            <GlowButton
              key={zoom}
              variant={Math.abs(viewState.zoom - zoom) < 0.05 ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewState(prev => ({ ...prev, zoom }))}
            >
              {Math.round(zoom * 100)}%
            </GlowButton>
          ))}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-16 left-4 text-xs text-white/40 z-10">
          <div>Scroll to zoom • Drag to pan</div>
        </div>

        {/* Map Info */}
        <div className="absolute top-4 left-4 z-10">
          <div className="px-3 py-2 bg-black/60 rounded-lg text-xs">
            <div className="text-white/60">Bombsites</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                A
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                B
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default CS2MapViewer;
