/** [Ver001.000]
 * MascotCard Component
 * ====================
 * Displays mascot image/avatar with stats, rarity indicator,
 * and hover animations using Framer Motion.
 * 
 * Features:
 * - Responsive card sizing (sm, md, lg)
 * - Rarity-based glow effects
 * - Stats preview
 * - Hover animations with reduced motion support
 * - Click-to-expand support
 * - Favorite toggle
 * - WCAG 2.1 AA accessible
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Zap, Sparkles } from 'lucide-react';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import type { MascotCardProps, GalleryCardSize } from './types';
import { RARITY_CONFIG, ELEMENT_CONFIG, getRarityStars, getTotalPower, getHighestStat } from './mocks/mascots';
import { useMascotAnimation } from './hooks/useMascotAnimation';

// ============================================================================
// Size Configuration
// ============================================================================

const SIZE_CONFIG: Record<GalleryCardSize, { 
  card: string; 
  image: string; 
  padding: string;
  title: string;
  stats: string;
}> = {
  sm: {
    card: 'w-40',
    image: 'h-24',
    padding: 'p-3',
    title: 'text-sm',
    stats: 'text-xs',
  },
  md: {
    card: 'w-56',
    image: 'h-36',
    padding: 'p-4',
    title: 'text-base',
    stats: 'text-sm',
  },
  lg: {
    card: 'w-72',
    image: 'h-48',
    padding: 'p-5',
    title: 'text-lg',
    stats: 'text-base',
  },
};

// ============================================================================
// Component
// ============================================================================

export const MascotCard: React.FC<MascotCardProps> = ({
  mascot,
  size = 'md',
  isSelected = false,
  isFavorite = false,
  isLocked = false,
  showStats = true,
  showRarity = true,
  animated = true,
  onClick,
  onFavoriteToggle,
  className = '',
}) => {
  const { prefersReducedMotion } = useReducedMotion();
  const config = SIZE_CONFIG[size];
  const rarityConfig = RARITY_CONFIG[mascot.rarity];
  const elementConfig = ELEMENT_CONFIG[mascot.element];

  // Animation setup
  const { 
    cardVariants, 
    imageVariants, 
    contentVariants, 
    glowVariants,
    shouldAnimate,
  } = useMascotAnimation({ 
    cardSize: size,
    enabled: animated,
  });

  // Computed values
  const totalPower = useMemo(() => getTotalPower(mascot), [mascot]);
  const highestStat = useMemo(() => getHighestStat(mascot), [mascot]);
  const starCount = useMemo(() => getRarityStars(mascot.rarity), [mascot.rarity]);

  // Event handlers
  const handleClick = useCallback(() => {
    if (!isLocked && onClick) {
      onClick(mascot);
    }
  }, [isLocked, onClick, mascot]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(mascot);
    }
  }, [onFavoriteToggle, mascot]);

  // Element icon
  const ElementIcon = useMemo(() => {
    switch (mascot.element) {
      case 'solar': return Zap;
      case 'lunar': return Sparkles;
      case 'binary': return Zap;
      case 'fire': return Zap;
      case 'magic': return Sparkles;
      default: return Sparkles;
    }
  }, [mascot.element]);

  // Glow intensity class
  const glowClass = useMemo(() => {
    switch (rarityConfig.glowIntensity) {
      case 'strong': return 'shadow-[0_0_30px_rgba(255,184,107,0.4)]';
      case 'medium': return 'shadow-[0_0_20px_rgba(155,124,255,0.3)]';
      case 'subtle': return 'shadow-[0_0_15px_rgba(0,209,255,0.2)]';
      default: return '';
    }
  }, [rarityConfig.glowIntensity]);

  return (
    <motion.article
      className={`
        relative ${config.card} ${config.padding}
        bg-surface rounded-2xl border-2 overflow-hidden cursor-pointer
        transition-shadow duration-200
        ${isSelected ? `border-[${mascot.color}] ring-2 ring-[${mascot.color}]/30` : 'border-border'}
        ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'}
        ${glowClass}
        ${className}
      `}
      style={{
        borderColor: isSelected ? mascot.color : undefined,
      }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={isLocked ? undefined : "hover"}
      whileTap={isLocked ? undefined : "tap"}
      onClick={handleClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${mascot.displayName}, ${rarityConfig.label} ${mascot.element} mascot. Power: ${totalPower}. ${isLocked ? 'Locked.' : 'Click for details.'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Glow Effect Background */}
      {!prefersReducedMotion && rarityConfig.glowIntensity !== 'none' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${mascot.glowColor}15, transparent 70%)`,
          }}
          variants={glowVariants}
        />
      )}

      {/* Rarity Badge */}
      {showRarity && (
        <div 
          className="absolute top-3 right-3 z-10 flex items-center gap-1"
          aria-label={`Rarity: ${rarityConfig.label}`}
        >
          {Array.from({ length: starCount }).map((_, i) => (
            <Star
              key={i}
              className="w-3 h-3 fill-current"
              style={{ color: rarityConfig.color }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Favorite Button */}
      {onFavoriteToggle && !isLocked && (
        <button
          className={`
            absolute top-3 left-3 z-10 p-1.5 rounded-full
            transition-all duration-200
            ${isFavorite ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
          `}
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="bg-white rounded-full p-3 shadow-lg">
            <Lock className="w-6 h-6 text-gray-600" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Image Container */}
      <motion.div
        className={`relative ${config.image} mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}
        variants={imageVariants}
      >
        {/* Placeholder Avatar with Element Color */}
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${mascot.color}30` }}
        >
          <ElementIcon 
            className="w-10 h-10"
            style={{ color: mascot.color }}
            aria-hidden="true"
          />
        </div>

        {/* Element Badge */}
        <div 
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-medium"
          style={{ backgroundColor: elementConfig.bgColor.replace('bg-', '') }}
        >
          {elementConfig.label}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={contentVariants}>
        {/* Name */}
        <h3 className={`${config.title} font-semibold text-charcoal truncate mb-1`}>
          {mascot.displayName}
        </h3>

        {/* Rarity Label */}
        <p 
          className="text-xs font-medium mb-2"
          style={{ color: rarityConfig.color }}
        >
          {rarityConfig.label}
        </p>

        {/* Stats Preview */}
        {showStats && (
          <div className={`${config.stats} space-y-1`}>
            {/* Total Power */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Power</span>
              <span className="font-semibold text-charcoal">{totalPower}</span>
            </div>

            {/* Highest Stat */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 capitalize">{highestStat.name}</span>
              <div className="flex items-center gap-1">
                <div 
                  className="h-1.5 rounded-full"
                  style={{ 
                    width: `${highestStat.value * 0.4}px`,
                    backgroundColor: mascot.color,
                  }}
                  aria-hidden="true"
                />
                <span className="font-medium text-charcoal w-6 text-right">
                  {highestStat.value}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <div 
            className="absolute bottom-3 right-3 w-2 h-2 rounded-full"
            style={{ backgroundColor: mascot.color }}
            aria-hidden="true"
          />
        )}
      </motion.div>
    </motion.article>
  );
};

export default MascotCard;
