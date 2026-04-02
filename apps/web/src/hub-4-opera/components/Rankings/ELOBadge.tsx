// @ts-nocheck
/**
 * ELOBadge Component
 * Visual ELO rating display with tier color coding
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ELOBadgeProps } from './types';

// ELO tier ranges and colors
interface ELOTier {
  min: number;
  max: number;
  name: string;
  color: string;
  bg: string;
  glow: string;
}

const ELO_TIERS: ELOTier[] = [
  { min: 2800, max: 3500, name: 'Radiant', color: '#ff4655', bg: 'bg-red-500/20', glow: 'rgba(255, 70, 85, 0.5)' },
  { min: 2400, max: 2799, name: 'Immortal', color: '#9d4edd', bg: 'bg-purple-500/20', glow: 'rgba(157, 78, 221, 0.5)' },
  { min: 2100, max: 2399, name: 'Ascendant', color: '#00d4ff', bg: 'bg-cyan-500/20', glow: 'rgba(0, 212, 255, 0.5)' },
  { min: 1800, max: 2099, name: 'Diamond', color: '#ffd700', bg: 'bg-yellow-500/20', glow: 'rgba(255, 215, 0, 0.5)' },
  { min: 1500, max: 1799, name: 'Platinum', color: '#00ff88', bg: 'bg-green-500/20', glow: 'rgba(0, 255, 136, 0.5)' },
  { min: 1200, max: 1499, name: 'Gold', color: '#ffaa00', bg: 'bg-amber-500/20', glow: 'rgba(255, 170, 0, 0.5)' },
  { min: 900, max: 1199, name: 'Silver', color: '#c0c0c0', bg: 'bg-gray-400/20', glow: 'rgba(192, 192, 192, 0.5)' },
  { min: 0, max: 899, name: 'Bronze', color: '#cd7f32', bg: 'bg-orange-700/20', glow: 'rgba(205, 127, 50, 0.5)' },
];

// Size configurations
const SIZE_CONFIGS = {
  sm: {
    container: 'px-2 py-1',
    text: 'text-xs',
    icon: 'w-3 h-3',
    progress: 'h-1',
  },
  md: {
    container: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4',
    progress: 'h-1.5',
  },
  lg: {
    container: 'px-4 py-2',
    text: 'text-base',
    icon: 'w-5 h-5',
    progress: 'h-2',
  },
};

const getELOTier = (elo: number): ELOTier => {
  return ELO_TIERS.find(tier => elo >= tier.min && elo <= tier.max) || ELO_TIERS[ELO_TIERS.length - 1];
};

const getNextTierProgress = (elo: number, tier: ELOTier): number => {
  if (tier.min === 0) return 100; // Already at lowest tier
  const range = tier.max - tier.min + 1;
  const progress = elo - tier.min;
  return Math.min(100, Math.max(0, (progress / range) * 100));
};

const ELOBadge: React.FC<ELOBadgeProps> = ({
  elo,
  size = 'md',
  showProgress = false,
  nextTier,
}) => {
  const tier = getELOTier(elo);
  const sizeConfig = SIZE_CONFIGS[size];
  const progress = getNextTierProgress(elo, tier);
  const isTopTier = tier.name === 'Radiant';

  // Calculate progress to next tier
  const progressToNext = nextTier && nextTier > elo
    ? Math.min(100, ((elo - tier.min) / (nextTier - tier.min)) * 100)
    : progress;

  return (
    <motion.div
      className={cn(
        'inline-flex flex-col gap-1',
        'rounded-lg border',
        'border-white/10',
        tier.bg
      )}
      style={{ borderColor: `${tier.color}30` }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 15px ${tier.glow}`,
      }}
      transition={{ duration: 0.15 }}
    >
      {/* Main ELO display */}
      <div className={cn('flex items-center gap-2', sizeConfig.container)}>
        {/* Tier icon */}
        <motion.div
          style={{ color: tier.color }}
          animate={isTopTier ? {
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={isTopTier ? {
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          } : {}}
        >
          {isTopTier ? (
            <Award className={sizeConfig.icon} />
          ) : (
            <TrendingUp className={sizeConfig.icon} />
          )}
        </motion.div>

        {/* ELO number */}
        <div className="flex flex-col">
          <span
            className={cn('font-bold tabular-nums', sizeConfig.text)}
            style={{ color: tier.color }}
          >
            {elo.toLocaleString()}
          </span>
          <span className="text-[10px] opacity-60" style={{ color: tier.color }}>
            {tier.name}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && !isTopTier && (
        <div className={cn('mx-2 mb-1.5 rounded-full bg-black/30 overflow-hidden', sizeConfig.progress)}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: tier.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Radiant glow effect */}
      {isTopTier && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${tier.glow} 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
};

export default ELOBadge;
