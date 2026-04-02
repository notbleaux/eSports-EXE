// @ts-nocheck
/** [Ver001.000] */
/**
 * Map Callouts
 * ============
 * Display location callouts on the map with region coloring.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapCallout } from './types';

interface MapCalloutsProps {
  callouts: MapCallout[];
  zoom: number;
  visible: boolean;
  zLevel: number;
}

const REGION_COLORS = {
  a: '#ff4655',    // Red for A site
  b: '#00d4ff',    // Cyan for B site
  c: '#ffd700',    // Gold for C site
  mid: '#9d4edd',  // Purple for mid
  spawn: '#00ff88', // Green for spawn
  other: '#ffffff', // White for other
};

export const MapCallouts: React.FC<MapCalloutsProps> = ({
  callouts,
  zoom,
  visible,
  zLevel,
}) => {
  if (!visible) return null;

  // Filter callouts by Z level and zoom level
  const visibleCallouts = callouts.filter(c => {
    if (c.z !== zLevel) return false;
    // Hide less important callouts when zoomed out
    if (zoom < 0.5 && c.region === 'other') return false;
    return true;
  });

  return (
    <>
      {visibleCallouts.map((callout) => {
        const color = REGION_COLORS[callout.region];
        const fontSize = Math.max(8, 12 / zoom);
        const showAlternativeNames = zoom > 1.5 && callout.commonNames && callout.commonNames.length > 0;

        return (
          <motion.div
            key={callout.id}
            className="absolute pointer-events-none"
            style={{
              left: `${callout.x}%`,
              top: `${callout.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Main callout name */}
            <div
              className="font-bold text-center uppercase tracking-wider"
              style={{
                color: color,
                fontSize: `${fontSize}px`,
                textShadow: `0 0 ${4 / zoom}px ${color}80`,
                WebkitTextStroke: zoom > 1.2 ? `${0.5 / zoom}px black` : 'none',
              }}
            >
              {callout.name}
            </div>

            {/* Alternative names (shown at high zoom) */}
            {showAlternativeNames && (
              <div
                className="text-center mt-0.5"
                style={{
                  color: `${color}cc`,
                  fontSize: `${fontSize * 0.7}px`,
                }}
              >
                {callout.commonNames?.join(', ')}
              </div>
            )}

            {/* Region indicator dot */}
            {zoom > 0.8 && (
              <div
                className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 4px ${color}`,
                }}
              />
            )}
          </motion.div>
        );
      })}
    </>
  );
};

export default MapCallouts;
