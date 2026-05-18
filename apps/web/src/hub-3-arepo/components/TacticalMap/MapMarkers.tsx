// @ts-nocheck
/** [Ver001.000] */
/**
 * Map Markers
 * ===========
 * Display tactical markers on the map (abilities, positions, kills, etc.)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Skull, 
  Crosshair, 
  Zap, 
  Flame,
  Circle,
  MessageSquare
} from 'lucide-react';
import { MapMarker } from './types';

interface MapMarkersProps {
  markers: MapMarker[];
  zoom: number;
  onMarkerClick?: (marker: MapMarker) => void;
  zLevel: number;
}

const MARKER_ICONS = {
  ability: Zap,
  position: Crosshair,
  death: Skull,
  kill: Target,
  utility: Flame,
  annotation: MessageSquare,
};

const MARKER_COLORS = {
  ability: '#ff9f1c',
  position: '#00d4ff',
  death: '#ff4655',
  kill: '#00ff88',
  utility: '#ffd700',
  annotation: '#9d4edd',
};

export const MapMarkers: React.FC<MapMarkersProps> = ({
  markers,
  zoom,
  onMarkerClick,
  zLevel,
}) => {
  // Filter markers by current Z level
  const visibleMarkers = markers.filter(m => m.z === zLevel);

  return (
    <>
      {visibleMarkers.map((marker, index) => {
        const Icon = MARKER_ICONS[marker.type];
        const color = marker.color || MARKER_COLORS[marker.type];
        const size = 24 / zoom;

        return (
          <motion.div
            key={marker.id}
            className="absolute cursor-pointer"
            style={{
              left: `${marker.x}%`,
              top: `${marker.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10 + index,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick?.(marker);
            }}
            whileHover={{ scale: 1.2 }}
            title={marker.note || `${marker.type} - ${marker.playerName || 'Unknown'}`}
          >
            {/* Marker Icon */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: size,
                height: size,
                backgroundColor: color,
                boxShadow: `0 0 ${10 / zoom}px ${color}`,
              }}
            >
              <Icon 
                className="text-black" 
                style={{ width: size * 0.6, height: size * 0.6 }} 
              />
            </div>

            {/* Player name label (visible at higher zoom) */}
            {zoom > 1.5 && marker.playerName && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: color,
                  fontSize: 10 / zoom,
                }}
              >
                {marker.playerName}
                {marker.agent && ` (${marker.agent})`}
              </div>
            )}

            {/* Round indicator */}
            {marker.round && zoom > 1.2 && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  fontSize: 8 / zoom,
                  width: 12 / zoom,
                  height: 12 / zoom,
                }}
              >
                {marker.round}
              </div>
            )}
          </motion.div>
        );
      })}
    </>
  );
};

export default MapMarkers;
