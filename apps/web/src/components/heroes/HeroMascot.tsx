/** [Ver002.000]
 * HeroMascot Component
 * ====================
 * Mascot integration component for hero sections with animation states.
 * 
 * Features:
 * - Generated mascot SVG/CSS component rendering
 * - Animation states (idle, wave, celebrate)
 * - Position control (left, right, center)
 * - Size variants (32, 64, 128, 256) with format switching (svg, css, auto)
 * - Loading animations with pulse and fade-in
 * - Reduced motion support
 * - Accessibility (ARIA labels, keyboard navigation)
 * - Easter eggs (5-click celebration)
 * - Hub-specific theming
 * 
 * @example
 * ```tsx
 * // Basic mascot with auto format
 * <HeroMascot mascot="fox" />
 * 
 * // Animated mascot with custom position, size and format
 * <HeroMascot
 *   mascot="owl"
 *   animation="wave"
 *   position="right"
 *   size={128}
 *   format="svg"
 * />
 * 
 * // CSS-only format for small sizes
 * <HeroMascot
 *   mascot="wolf"
 *   size={64}
 *   format="css"
 *   animate
 * />
 * 
 * // With easter eggs and personalization
 * <HeroMascot
 *   mascot="hawk"
 *   size={256}
 *   format="auto"
 *   animate
 *   easterEggs
 *   preferenceKey="hero-hawk"
 * />
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import { easings } from '@/lib/easing';

// Import generated mascot components
import { FoxMascotSVG } from '../mascots/generated/FoxMascotSVG';
import { FoxCSS } from '../mascots/generated/FoxCSS';
import { OwlMascotSVG } from '../mascots/generated/OwlMascotSVG';
import { OwlCSS } from '../mascots/generated/OwlCSS';
import { WolfMascotSVG } from '../mascots/generated/WolfMascotSVG';
import { WolfCSS } from '../mascots/generated/WolfCSS';
import { HawkMascotSVG } from '../mascots/generated/HawkMascotSVG';
import { HawkCSS } from '../mascots/generated/HawkCSS';

// Import enhanced mascot asset for advanced features
import { MascotAsset } from '../mascots/MascotAssetEnhanced';

// ============================================================================
// Types
// ============================================================================

export type MascotType = 'fox' | 'owl' | 'wolf' | 'hawk';
export type MascotAnimation = 'idle' | 'wave' | 'celebrate';
export type MascotPosition = 'left' | 'right' | 'center';
export type MascotFormat = 'svg' | 'css' | 'auto';
export type MascotSize = 32 | 64 | 128 | 256;

/**
 * Props for the HeroMascot component.
 */
export interface HeroMascotProps {
  /** Mascot character type */
  mascot: MascotType;
  /** Animation state */
  animation?: MascotAnimation;
  /** Horizontal positioning */
  position?: MascotPosition;
  /** Size in pixels (32, 64, 128, 256) */
  size?: MascotSize;
  /** Format preference (svg, css, or auto-select) */
  format?: MascotFormat;
  /** Enable animations */
  animate?: boolean;
  /** Enable easter eggs (5-click celebration) */
  easterEggs?: boolean;
  /** Personalization key for storing user preference */
  preferenceKey?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label override */
  ariaLabel?: string;
}

// ============================================================================
// Mascot Registry for Generated Components
// ============================================================================

// Use type assertion to handle different size type unions in generated components
const MASCOT_COMPONENTS: Record<
  MascotType, 
  {
    svg: React.FC<{ size?: number; className?: string; animate?: boolean }>;
    css: React.FC<{ className?: string; animate?: boolean }>;
    color: string;
    description: string;
  }
> = {
  fox: {
    svg: FoxMascotSVG as React.FC<{ size?: number; className?: string; animate?: boolean }>,
    css: FoxCSS,
    color: '#F97316',
    description: 'Agile, clever, quick-witted',
  },
  owl: {
    svg: OwlMascotSVG as React.FC<{ size?: number; className?: string; animate?: boolean }>,
    css: OwlCSS,
    color: '#6366F1',
    description: 'Wise, insightful, strategic',
  },
  wolf: {
    svg: WolfMascotSVG as React.FC<{ size?: number; className?: string; animate?: boolean }>,
    css: WolfCSS,
    color: '#475569',
    description: 'Strong, loyal, protective',
  },
  hawk: {
    svg: HawkMascotSVG as React.FC<{ size?: number; className?: string; animate?: boolean }>,
    css: HawkCSS,
    color: '#DC2626',
    description: 'Fast, precise, visionary',
  },
};

// ============================================================================
// Animation Variants
// ============================================================================

const ANIMATION_VARIANTS: Record<MascotAnimation, { initial: object; animate: object }> = {
  idle: {
    initial: { scale: 1, rotate: 0, opacity: 0 },
    animate: {
      scale: [1, 1.02, 1],
      rotate: [0, 1, -1, 0],
      opacity: 1,
      transition: {
        duration: 4,
        ease: easings.smoke,
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  },
  wave: {
    initial: { scale: 1, rotate: 0, x: 0, opacity: 0 },
    animate: {
      scale: [1, 1.05, 1],
      rotate: [0, -5, 5, -5, 0],
      x: [0, -5, 5, -5, 0],
      opacity: 1,
      transition: {
        duration: 2,
        ease: easings.spring,
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  },
  celebrate: {
    initial: { scale: 0.8, y: 0, opacity: 0 },
    animate: {
      scale: [0.8, 1.2, 1],
      y: [0, -20, 0],
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: easings.spring,
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  },
};

// ============================================================================
// Position & Size Configuration
// ============================================================================

const POSITION_CLASSES: Record<MascotPosition, string> = {
  left: 'self-start',
  center: 'self-center',
  right: 'self-end',
};

const SIZE_PIXELS: Record<MascotSize, number> = {
  32: 32,
  64: 64,
  128: 128,
  256: 256,
};

// ============================================================================
// Loading Animation Component
// ============================================================================

interface LoadingPulseProps {
  size: MascotSize;
  color: string;
}

const LoadingPulse: React.FC<LoadingPulseProps> = ({ size, color }) => {
  const pixelSize = SIZE_PIXELS[size];
  
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: pixelSize * 0.5,
          height: pixelSize * 0.5,
          backgroundColor: color,
        }}
        animate={{
          scale: [0.8, 1, 0.8],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * HeroMascot component for displaying mascot characters in hero sections.
 * 
 * @param props - HeroMascot component props
 * @returns HeroMascot JSX element
 */
export function HeroMascot({
  mascot,
  animation = 'idle',
  position = 'center',
  size = 128,
  format = 'auto',
  animate = false,
  easterEggs = false,
  preferenceKey,
  className,
  ariaLabel,
}: HeroMascotProps): JSX.Element {
  const { prefersReducedMotion } = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [isCelebrate, setIsCelebrate] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine effective format based on size and preference
  const effectiveFormat: 'svg' | 'css' = format === 'auto' 
    ? (size <= 64 ? 'css' : 'svg')
    : format;
  
  const mascotSet = MASCOT_COMPONENTS[mascot];
  const variants = ANIMATION_VARIANTS[isCelebrate ? 'celebrate' : animation];
  const pixelSize = SIZE_PIXELS[size];
  
  // Simulate loading completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [mascot, size, format]);
  
  // Easter egg: 5 clicks triggers celebration
  const handleClick = useCallback(() => {
    if (!easterEggs) return;
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      setIsCelebrate(true);
      setTimeout(() => {
        setIsCelebrate(false);
        setClickCount(0);
      }, 2000);
    }
  }, [clickCount, easterEggs]);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);
  
  // Use MascotAssetEnhanced for advanced features when easterEggs or preferenceKey is provided
  if (easterEggs || preferenceKey) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center',
          POSITION_CLASSES[position],
          className
        )}
      >
        {/* Glow effect behind mascot */}
        <motion.div 
          className={cn(
            'absolute rounded-full blur-3xl',
            'bg-gradient-to-br from-blue-500 to-purple-500'
          )}
          style={{ 
            width: pixelSize * 1.5, 
            height: pixelSize * 1.5,
            opacity: isHovered ? 0.4 : 0.2,
          }}
          animate={{ opacity: isHovered ? 0.4 : 0.2 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        />
        
        <motion.div
          className="relative z-10"
          initial="initial"
          animate={prefersReducedMotion ? { opacity: 1 } : variants.animate}
          variants={prefersReducedMotion ? undefined : variants}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <MascotAsset
            mascot={mascot}
            size={size}
            format={format}
            animate={animate && !prefersReducedMotion}
            easterEggs={easterEggs}
            preferenceKey={preferenceKey || `hero-${mascot}`}
            className="cursor-pointer"
          />
        </motion.div>
      </div>
    );
  }
  
  // Standard rendering with generated components
  const MascotComponent = effectiveFormat === 'css' ? mascotSet.css : mascotSet.svg;
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        POSITION_CLASSES[position],
        className
      )}
      role="img"
      aria-label={ariaLabel || `${mascot} mascot - ${mascotSet.description}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={easterEggs ? 0 : -1}
      style={{ cursor: easterEggs ? 'pointer' : 'default' }}
    >
      {/* Glow effect behind mascot */}
      <motion.div 
        className={cn(
          'absolute rounded-full blur-3xl',
          'bg-gradient-to-br from-blue-500 to-purple-500'
        )}
        style={{ 
          width: pixelSize * 1.5, 
          height: pixelSize * 1.5,
        }}
        initial={{ opacity: 0.2 }}
        animate={{ opacity: isHovered ? 0.4 : 0.2 }}
        transition={{ duration: 0.3 }}
        aria-hidden="true"
      />
      
      {/* Loading animation */}
      <AnimatePresence>
        {isLoading && (
          <LoadingPulse size={size} color={mascotSet.color} />
        )}
      </AnimatePresence>
      
      {/* Animated mascot container */}
      <motion.div
        className="relative z-10"
        style={{ width: pixelSize, height: pixelSize }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: isLoading ? 0 : 1, 
          scale: isLoading ? 0.9 : 1,
        }}
        transition={{ 
          duration: 0.4, 
          ease: easings.smoke,
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          variants={prefersReducedMotion ? {} : {
            animate: variants.animate,
          }}
          animate="animate"
        >
          {effectiveFormat === 'css' ? (
            <MascotComponent 
              className="w-full h-full drop-shadow-2xl"
              animate={animate && !prefersReducedMotion}
            />
          ) : (
            <MascotComponent 
              size={size}
              className="w-full h-full drop-shadow-2xl"
              animate={animate && !prefersReducedMotion}
            />
          )}
        </motion.div>
      </motion.div>
      
      {/* Screen reader description */}
      <span className="sr-only">
        {mascotSet.description}
        {easterEggs && ' Click 5 times for a surprise!'}
      </span>
      
      {/* Click indicator for easter egg */}
      {easterEggs && clickCount > 0 && clickCount < 5 && (
        <motion.div
          className="absolute -top-6 right-0 text-xs opacity-60 bg-black/50 px-2 py-0.5 rounded"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.6, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {clickCount}/5
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// Named Exports for Specific Mascots
// ============================================================================

interface PresetProps extends Omit<HeroMascotProps, 'mascot'> {}

/**
 * Fox mascot preset.
 */
export function FoxHeroMascot(props: PresetProps): JSX.Element {
  return <HeroMascot {...props} mascot="fox" />;
}

/**
 * Owl mascot preset.
 */
export function OwlHeroMascot(props: PresetProps): JSX.Element {
  return <HeroMascot {...props} mascot="owl" />;
}

/**
 * Wolf mascot preset.
 */
export function WolfHeroMascot(props: PresetProps): JSX.Element {
  return <HeroMascot {...props} mascot="wolf" />;
}

/**
 * Hawk mascot preset.
 */
export function HawkHeroMascot(props: PresetProps): JSX.Element {
  return <HeroMascot {...props} mascot="hawk" />;
}

// ============================================================================
// Export
// ============================================================================

export default HeroMascot;
