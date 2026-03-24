/** [Ver001.000] */
/**
 * Map Viewer
 * ==========
 * Main tactical map component with zoom, pan, and grid overlay.
 * Zoom range: 25% to 400% (appropriate limits for tactical analysis)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Grid3X3, 
  MapPin, 
  Layers,
  Crosshair,
  Maximize,
  Minimize,
  RotateCcw
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { GridOverlay } from './GridOverlay';
import { MapMarkers } from './MapMarkers';
import { MapCallouts } from './MapCallouts';
import { ZoomControls } from './ZoomControls';
import { 
  MapData, 
  MapViewState, 
  MapMarker, 
  MapAnnotation,
  ZOOM_LIMITS,
  GridConfig 
} from './types';

interface MapViewerProps {
  mapData: MapData;
  markers?: MapMarker[];
  annotations?: MapAnnotation[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (x: number, y: number, z: number) => void;
  readOnly?: boolean;
  showTacticalTools?: boolean;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  mapData,
  markers = [],
  annotations = [],
  onMarkerClick,
  onMapClick,
  readOnly = false,
  showTacticalTools = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [viewState, setViewState] = useState<MapViewState>({
    zoom: ZOOM_LIMITS.default,
    panX: 0,
    panY: 0,
    zLevel: 0,
    showGrid: true,
    gridSize: 'medium',
    showCallouts: true,
    showHeatmap: false,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Grid configuration based on size
  const gridConfig: GridConfig = {
    size: viewState.gridSize === 'small' ? 20 : viewState.gridSize === 'medium' ? 40 : 80,
    color: 'rgba(0, 102, 255, 0.3)',
    opacity: 0.5,
    showCoordinates: true,
    coordinateSystem: 'chess',
  };

  // Zoom handlers with limits
  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + ZOOM_LIMITS.step, ZOOM_LIMITS.max),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - ZOOM_LIMITS.step, ZOOM_LIMITS.min),
    }));
  }, []);

  const handleZoomReset = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: ZOOM_LIMITS.default,
      panX: 0,
      panY: 0,
    }));
  }, []);

  const handleZoomTo = useCallback((zoom: number) => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(ZOOM_LIMITS.min, Math.min(zoom, ZOOM_LIMITS.max)),
    }));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.panX, y: e.clientY - viewState.panY });
  }, [viewState.panX, viewState.panY]);

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

  // Click on map
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || !onMapClick || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewState.panX) / viewState.zoom;
    const y = (e.clientY - rect.top - viewState.panY) / viewState.zoom;
    
    // Convert to percentage
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    onMapClick(xPercent, yPercent, viewState.zLevel);
  }, [isDragging, onMapClick, viewState, mapRef]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_LIMITS.step : ZOOM_LIMITS.step;
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(ZOOM_LIMITS.min, Math.min(prev.zoom + delta, ZOOM_LIMITS.max)),
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
        case 'f':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowFullscreen(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleZoomReset]);

  const zoomPercent = Math.round(viewState.zoom * 100);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-[#0a0a0f] rounded-xl ${
        showFullscreen ? 'fixed inset-4 z-50' : 'w-full h-full'
      }`}
    >
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapClick}
        onWheel={handleWheel}
      >
        {/* Map Image */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <img
            src={mapData.minimapUrl}
            alt={mapData.name}
            className="max-w-none select-none"
            style={{
              width: mapData.dimensions.width,
              height: mapData.dimensions.height,
            }}
            draggable={false}
          />

          {/* Grid Overlay */}
          <GridOverlay
            width={mapData.dimensions.width}
            height={mapData.dimensions.height}
            config={gridConfig}
            zoom={viewState.zoom}
            visible={viewState.showGrid}
          />

          {/* Callouts */}
          <MapCallouts
            callouts={mapData.callouts}
            zoom={viewState.zoom}
            visible={viewState.showCallouts}
            zLevel={viewState.zLevel}
          />

          {/* Markers */}
          <MapMarkers
            markers={markers}
            zoom={viewState.zoom}
            onMarkerClick={onMarkerClick}
            zLevel={viewState.zLevel}
          />
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/60 rounded-lg text-sm font-mono text-white/80">
        {zoomPercent}%
      </div>

      {/* Coordinates Display */}
      <div className="absolute bottom-4 left-24 px-3 py-2 bg-black/60 rounded-lg text-sm font-mono text-white/60">
        Z-Level: {viewState.zLevel + 1}/{mapData.zLevels}
      </div>

      {/* Zoom Controls */}
      <ZoomControls
        zoom={viewState.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        minZoom={ZOOM_LIMITS.min}
        maxZoom={ZOOM_LIMITS.max}
      />

      {/* Tactical Tools */}
      {showTacticalTools && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
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
            variant="secondary"
            size="sm"
            onClick={() => setViewState(prev => ({ 
              ...prev, 
              zLevel: (prev.zLevel + 1) % mapData.zLevels 
            }))}
            title="Switch Level"
          >
            <Layers className="w-4 h-4" />
          </GlowButton>

          <GlowButton
            variant="secondary"
            size="sm"
            onClick={() => setShowFullscreen(prev => !prev)}
            title="Toggle Fullscreen (Ctrl+F)"
          >
            {showFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </GlowButton>
        </div>
      )}

      {/* Grid Size Selector */}
      {viewState.showGrid && (
        <div className="absolute top-4 left-4 flex gap-1">
          {(['small', 'medium', 'large'] as const).map(size => (
            <GlowButton
              key={size}
              variant={viewState.gridSize === size ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewState(prev => ({ ...prev, gridSize: size }))}
              className="capitalize"
            >
              {size}
            </GlowButton>
          ))}
        </div>
      )}

      {/* Zoom Presets */}
      <div className="absolute bottom-4 right-4 flex gap-1">
        {[0.25, 0.5, 1.0, 2.0, 4.0].map(zoom => (
          <GlowButton
            key={zoom}
            variant={Math.abs(viewState.zoom - zoom) < 0.05 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => handleZoomTo(zoom)}
          >
            {Math.round(zoom * 100)}%
          </GlowButton>
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-16 left-4 text-xs text-white/40">
        <div>Scroll to zoom • Drag to pan</div>
        <div>Ctrl+G: Grid • Ctrl+F: Fullscreen</div>
      </div>
    </div>
  );
};

export default MapViewer;
