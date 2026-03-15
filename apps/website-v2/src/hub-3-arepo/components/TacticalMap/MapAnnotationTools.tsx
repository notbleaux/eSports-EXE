/** [Ver001.000] */
/**
 * Map Annotation Tools
 * ====================
 * Tools for adding and managing map annotations.
 */

import React from 'react';
import { Undo2, Trash2, MousePointer, Circle, ArrowRight, Type } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { MapMarker } from './types';

interface MapAnnotationToolsProps {
  markers: MapMarker[];
  onClear: () => void;
  onUndo: () => void;
}

export const MapAnnotationTools: React.FC<MapAnnotationToolsProps> = ({
  markers,
  onClear,
  onUndo,
}) => {
  return (
    <GlassCard className="p-4 h-full">
      <h3 className="text-lg font-semibold text-white mb-4">Annotation Tools</h3>
      
      {/* Tool Buttons */}
      <div className="space-y-2 mb-6">
        <GlowButton variant="primary" className="w-full justify-start">
          <MousePointer className="w-4 h-4 mr-2" />
          Select
        </GlowButton>
        <GlowButton variant="ghost" className="w-full justify-start">
          <Circle className="w-4 h-4 mr-2" />
          Circle
        </GlowButton>
        <GlowButton variant="ghost" className="w-full justify-start">
          <ArrowRight className="w-4 h-4 mr-2" />
          Arrow
        </GlowButton>
        <GlowButton variant="ghost" className="w-full justify-start">
          <Type className="w-4 h-4 mr-2" />
          Text
        </GlowButton>
      </div>

      {/* Marker List */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white/60 mb-2">
          Markers ({markers.length})
        </h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {markers.map((marker, i) => (
            <div 
              key={marker.id}
              className="p-2 rounded bg-white/5 text-sm text-white/80 flex items-center gap-2"
            >
              <span className="text-white/40">{i + 1}.</span>
              {marker.note || `${marker.type} at (${Math.round(marker.x)}, ${Math.round(marker.y)})`}
            </div>
          ))}
          {markers.length === 0 && (
            <div className="text-sm text-white/40 italic">
              Click on map to add markers
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <GlowButton 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={onUndo}
          disabled={markers.length === 0}
        >
          <Undo2 className="w-4 h-4 mr-2" />
          Undo
        </GlowButton>
        <GlowButton 
          variant="ghost" 
          className="w-full justify-start text-red-400 hover:text-red-300" 
          onClick={onClear}
          disabled={markers.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </GlowButton>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-3 rounded-lg bg-white/5 text-xs text-white/40">
        <p className="mb-1">Click anywhere on the map to place a marker.</p>
        <p>Click on a marker to remove it.</p>
      </div>
    </GlassCard>
  );
};

export default MapAnnotationTools;
