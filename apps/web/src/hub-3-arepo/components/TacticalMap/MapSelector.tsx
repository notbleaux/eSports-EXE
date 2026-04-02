// @ts-nocheck
/** [Ver001.000] */
/**
 * Map Selector
 * ============
 * Grid view of available maps for selection.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { MapId, MapData } from './types';

interface MapSelectorProps {
  maps: MapData[];
  selectedMap: MapId;
  onSelectMap: (mapId: MapId) => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  maps,
  selectedMap,
  onSelectMap,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {maps.map((map, index) => (
        <motion.div
          key={map.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectMap(map.id)}
        >
          <GlassCard
            className={`p-4 cursor-pointer transition-all ${
              selectedMap === map.id 
                ? 'ring-2 ring-[#0066ff] bg-[#0066ff]/10' 
                : 'hover:bg-white/5'
            }`}
          >
            <div 
              className="aspect-video rounded-lg mb-3 flex items-center justify-center"
              style={{ backgroundColor: '#1a1a25' }}
            >
              <span className="text-2xl font-bold text-white/40">
                {map.name[0]}
              </span>
            </div>
            <h3 className="font-semibold text-white text-center">{map.name}</h3>
            <p className="text-xs text-white/40 text-center capitalize">{map.game}</p>
            {selectedMap === map.id && (
              <div className="mt-2 text-center text-xs text-[#0066ff]">
                Selected
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

export default MapSelector;
