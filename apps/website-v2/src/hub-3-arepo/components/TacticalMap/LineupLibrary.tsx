/** [Ver001.000] */
/**
 * Lineup Library
 * ==============
 * Browse and manage tactical lineups for each map.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Play, ThumbsUp, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { TacticalLineup, MapId } from './types';

interface LineupLibraryProps {
  mapId: MapId;
  lineups: TacticalLineup[];
  onSelectLineup: (lineup: TacticalLineup) => void;
}

export const LineupLibrary: React.FC<LineupLibraryProps> = ({
  mapId,
  lineups,
  onSelectLineup,
}) => {
  const mapLineups = lineups.filter(l => l.mapId === mapId);

  if (mapLineups.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <Target className="w-16 h-16 mx-auto mb-4 text-white/20" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No Lineups Yet
        </h3>
        <p className="text-white/60 mb-4">
          Create your first lineup for this map.
        </p>
        <GlowButton variant="primary">
          Create Lineup
        </GlowButton>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mapLineups.map((lineup, index) => (
        <motion.div
          key={lineup.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-start gap-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#0066ff20' }}
              >
                <Target className="w-8 h-8 text-[#0066ff]" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-white">{lineup.name}</h3>
                <p className="text-sm text-white/60">
                  {lineup.agent} • {lineup.ability}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {lineup.createdBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {lineup.upvotes}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <GlowButton size="sm" variant="primary" onClick={() => onSelectLineup(lineup)}>
                    <Play className="w-3 h-3 mr-1" />
                    View
                  </GlowButton>
                  {lineup.videoUrl && (
                    <GlowButton size="sm" variant="ghost">
                      Video
                    </GlowButton>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

export default LineupLibrary;
