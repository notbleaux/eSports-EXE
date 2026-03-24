/**
 * GradeBadge Component
 * S/A/B/C/D/F grade display with color coding
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { GradeBadgeProps } from './types';

// Grade color configurations
const GRADE_COLORS: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  S: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    glow: 'rgba(251, 191, 36, 0.5)',
    border: 'border-amber-500/30',
  },
  A: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    glow: 'rgba(168, 85, 247, 0.4)',
    border: 'border-purple-500/30',
  },
  B: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    glow: 'rgba(59, 130, 246, 0.4)',
    border: 'border-blue-500/30',
  },
  C: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    glow: 'rgba(34, 197, 94, 0.4)',
    border: 'border-green-500/30',
  },
  D: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    glow: 'rgba(249, 115, 22, 0.4)',
    border: 'border-orange-500/30',
  },
  F: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    glow: 'rgba(239, 68, 68, 0.4)',
    border: 'border-red-500/30',
  },
};

// Size configurations
const SIZE_CONFIGS = {
  sm: {
    container: 'w-6 h-6',
    text: 'text-xs',
    suffix: 'text-[8px]',
  },
  md: {
    container: 'w-8 h-8',
    text: 'text-sm',
    suffix: 'text-[10px]',
  },
  lg: {
    container: 'w-10 h-10',
    text: 'text-base',
    suffix: 'text-xs',
  },
};

const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  size = 'md',
  showPlusMinus = false,
  suffix = '',
}) => {
  const colors = GRADE_COLORS[grade] || GRADE_COLORS.F;
  const sizeConfig = SIZE_CONFIGS[size];

  const displaySuffix = showPlusMinus && suffix ? suffix : '';
  const isSTier = grade === 'S';

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center rounded-lg font-bold',
        sizeConfig.container,
        colors.bg,
        colors.text,
        'border',
        colors.border,
        isSTier && 'shadow-lg'
      )}
      style={{
        boxShadow: isSTier ? `0 0 15px ${colors.glow}` : undefined,
      }}
      whileHover={{
        scale: 1.1,
        boxShadow: `0 0 20px ${colors.glow}`,
      }}
      transition={{ duration: 0.15 }}
    >
      {/* Main grade letter */}
      <span className={sizeConfig.text}>
        {grade}
      </span>

      {/* Plus/Minus suffix */}
      {showPlusMinus && displaySuffix && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5',
            sizeConfig.suffix,
            colors.text,
            'opacity-80'
          )}
        >
          {displaySuffix}
        </span>
      )}

      {/* Glow effect for S tier */}
      {isSTier && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle at center, ${colors.glow} 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
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

export default GradeBadge;
