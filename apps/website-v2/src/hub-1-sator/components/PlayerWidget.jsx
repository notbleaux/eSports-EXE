/**
 * PlayerWidget Component
 * Individual player data display for SATOR Hub
 * 
 * [Ver001.000]
 */
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Zap, ChevronRight } from 'lucide-react';
import { colors } from '@/theme/colors';

/**
 * PlayerWidget - Displays individual player statistics
 * 
 * @param {Object} props
 * @param {Object} props.player - Player data object
 * @param {number} props.rank - Player rank position
 * @param {string} props.hubColor - Primary hub color (#ffd700 for SATOR)
 * @param {string} props.hubGlow - Hub glow color
 * @param {string} props.hubMuted - Hub muted color
 */
export function PlayerWidget({ 
  player, 
  rank,
  hubColor = colors.hub.sator.base,
  hubGlow = colors.hub.sator.glow,
  hubMuted = colors.hub.sator.muted,
}) {
  const { 
    name = 'Unknown Player',
    team = 'Free Agent',
    rating = 0,
    acs = 0,
    kda = '0.00',
    winRate = 0,
    avatar,
  } = player;

  const rankColors = {
    1: '#ffd700', // Gold
    2: '#c0c0c0', // Silver
    3: '#cd7f32', // Bronze
  };

  const rankColor = rankColors[rank] || hubMuted;

  return (
    <motion.div
      className="flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer"
      style={{ 
        backgroundColor: colors.porcelain.frost,
        border: `1px solid ${colors.border.subtle}`,
      }}
      whileHover={{ 
        scale: 1.01,
        borderColor: hubColor,
        boxShadow: `0 0 15px ${hubGlow}`,
      }}
      transition={{ duration: 0.15 }}
    >
      {/* Rank */}
      <div 
        className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg"
        style={{ 
          backgroundColor: `${rankColor}20`,
          color: rankColor,
          border: `2px solid ${rankColor}`,
        }}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: colors.background.secondary }}
      >
        {avatar ? (
          <img 
            src={avatar} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span 
            className="text-lg font-bold"
            style={{ color: hubColor }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <h3 
          className="font-semibold text-base truncate"
          style={{ color: colors.text.primary }}
        >
          {name}
        </h3>
        <p 
          className="text-sm truncate"
          style={{ color: colors.text.secondary }}
        >
          {team}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
        {/* Rating */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <Trophy className="w-3 h-3" style={{ color: hubColor }} />
            <span 
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.text.muted }}
            >
              Rating
            </span>
          </div>
          <span 
            className="text-lg font-mono font-bold"
            style={{ color: hubColor }}
          >
            {rating.toFixed(1)}
          </span>
        </div>

        {/* ACS */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3" style={{ color: hubColor }} />
            <span 
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.text.muted }}
            >
              ACS
            </span>
          </div>
          <span 
            className="text-lg font-mono font-bold"
            style={{ color: hubColor }}
          >
            {Math.round(acs)}
          </span>
        </div>

        {/* Win Rate */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3" style={{ color: hubColor }} />
            <span 
              className="text-xs uppercase tracking-wide"
              style={{ color: colors.text.muted }}
            >
              Win %
            </span>
          </div>
          <span 
            className="text-lg font-mono font-bold"
            style={{ color: hubColor }}
          >
            {winRate.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Mobile Stats & Arrow */}
      <div className="flex items-center gap-2 sm:hidden">
        <span 
          className="text-lg font-mono font-bold"
          style={{ color: hubColor }}
        >
          {rating.toFixed(1)}
        </span>
        <ChevronRight 
          className="w-5 h-5"
          style={{ color: hubMuted }}
        />
      </div>

      {/* Desktop Arrow */}
      <ChevronRight 
        className="w-5 h-5 hidden sm:block"
        style={{ color: hubMuted }}
      />
    </motion.div>
  );
}

export default PlayerWidget;
