/** [Ver001.000]
 * GameSelector Component
 * 
 * Toggle between Valorant and CS2 game modes.
 * Stores preference in local state and affects data display.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Target } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

export type GameType = 'valorant' | 'cs2';

interface GameSelectorProps {
  selectedGame: GameType;
  onGameChange: (game: GameType) => void;
  className?: string;
  showLabel?: boolean;
}

interface GameOption {
  id: GameType;
  name: string;
  icon: typeof Target;
  color: string;
  glowColor: string;
  description: string;
}

const GAME_OPTIONS: GameOption[] = [
  {
    id: 'valorant',
    name: 'Valorant',
    icon: Target,
    color: '#ff4655',
    glowColor: 'rgba(255, 70, 85, 0.5)',
    description: 'Tactical FPS with agents and abilities',
  },
  {
    id: 'cs2',
    name: 'CS2',
    icon: Crosshair,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    description: 'Classic tactical shooter',
  },
];

export const GameSelector: React.FC<GameSelectorProps> = ({
  selectedGame,
  onGameChange,
  className = '',
  showLabel = true,
}) => {
  return (
    <GlassCard 
      className={`p-3 ${className}`}
      variant="subtle"
    >
      {showLabel && (
        <div className="text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">
          Select Game
        </div>
      )}
      
      <div className="flex gap-2">
        {GAME_OPTIONS.map((game) => {
          const Icon = game.icon;
          const isSelected = selectedGame === game.id;
          
          return (
            <motion.button
              key={game.id}
              onClick={() => onGameChange(game.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-lg
                transition-all duration-200
                ${isSelected 
                  ? 'bg-white/10' 
                  : 'bg-white/5 hover:bg-white/8'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                boxShadow: isSelected ? `0 0 20px ${game.glowColor}` : undefined,
              }}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  layoutId="gameSelection"
                  className="absolute inset-0 rounded-lg border-2"
                  style={{ borderColor: game.color }}
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <Icon 
                className="w-4 h-4 relative z-10"
                style={{ color: isSelected ? game.color : undefined }}
              />
              
              <span 
                className={`text-sm font-medium relative z-10 ${
                  isSelected ? 'text-white' : 'text-white/70'
                }`}
              >
                {game.name}
              </span>
              
              {/* Active Dot */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 rounded-full relative z-10"
                  style={{ backgroundColor: game.color }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Selected Game Description */}
      <div className="mt-2 text-xs text-white/40">
        {GAME_OPTIONS.find(g => g.id === selectedGame)?.description}
      </div>
    </GlassCard>
  );
};

export default GameSelector;
