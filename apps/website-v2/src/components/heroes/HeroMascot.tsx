/** [Ver001.000]
 * HeroMascot Component
 * ====================
 * Mascot integration component for hero sections with animation states.
 * 
 * Features:
 * - Mascot SVG/component rendering
 * - Animation states (idle, wave, celebrate)
 * - Position control (left, right, center)
 * - Size variants (sm, md, lg)
 * - Reduced motion support
 * - Hub-specific theming
 * 
 * @example
 * ```tsx
 * // Basic mascot
 * <HeroMascot mascot="fox" />
 * 
 * // Animated mascot with custom position and size
 * <HeroMascot
 *   mascot="owl"
 *   animation="wave"
 *   position="right"
 *   size="lg"
 * />
 * 
 * // Static mascot for reduced motion
 * <HeroMascot
 *   mascot="wolf"
 *   animation="idle"
 *   size="md"
 * />
 * ```
 */

import { motion, type Variants } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import { easings } from '@/lib/easing';
import type { HeroMascotProps, MascotType } from './types';

// ============================================================================
// Mascot SVG Components
// ============================================================================

/**
 * Fox mascot SVG - Represents agility and cleverness.
 */
function FoxMascot({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ears */}
      <path d="M40 60L60 20L80 60" fill="#f97316" stroke="#ea580c" strokeWidth="3"/>
      <path d="M120 60L140 20L160 60" fill="#f97316" stroke="#ea580c" strokeWidth="3"/>
      {/* Head */}
      <ellipse cx="100" cy="100" rx="60" ry="50" fill="#fb923c"/>
      {/* Face mask */}
      <path d="M50 90Q100 130 150 90L150 120Q100 160 50 120Z" fill="#fff7ed"/>
      {/* Eyes */}
      <circle cx="75" cy="95" r="8" fill="#1f2937"/>
      <circle cx="125" cy="95" r="8" fill="#1f2937"/>
      <circle cx="77" cy="93" r="3" fill="white"/>
      <circle cx="127" cy="93" r="3" fill="white"/>
      {/* Nose */}
      <ellipse cx="100" cy="115" rx="8" ry="6" fill="#1f2937"/>
      {/* Mouth */}
      <path d="M90 125Q100 135 110 125" stroke="#1f2937" strokeWidth="2" fill="none"/>
      {/* Cheeks */}
      <ellipse cx="55" cy="110" rx="10" ry="6" fill="#fca5a5" opacity="0.6"/>
      <ellipse cx="145" cy="110" rx="10" ry="6" fill="#fca5a5" opacity="0.6"/>
    </svg>
  );
}

/**
 * Owl mascot SVG - Represents wisdom and insight.
 */
function OwlMascot({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="100" cy="120" rx="55" ry="60" fill="#6366f1"/>
      {/* Wings */}
      <ellipse cx="45" cy="120" rx="20" ry="35" fill="#4f46e5"/>
      <ellipse cx="155" cy="120" rx="20" ry="35" fill="#4f46e5"/>
      {/* Head */}
      <circle cx="100" cy="70" r="45" fill="#818cf8"/>
      {/* Ear tufts */}
      <path d="M60 40L70 15L85 35" fill="#4f46e5"/>
      <path d="M115 35L130 15L140 40" fill="#4f46e5"/>
      {/* Eyes (large) */}
      <circle cx="75" cy="70" r="22" fill="#fbbf24"/>
      <circle cx="125" cy="70" r="22" fill="#fbbf24"/>
      <circle cx="75" cy="70" r="15" fill="#f59e0b"/>
      <circle cx="125" cy="70" r="15" fill="#f59e0b"/>
      <circle cx="75" cy="70" r="8" fill="#1f2937"/>
      <circle cx="125" cy="70" r="8" fill="#1f2937"/>
      <circle cx="78" cy="67" r="3" fill="white"/>
      <circle cx="128" cy="67" r="3" fill="white"/>
      {/* Beak */}
      <path d="M90 85L100 100L110 85" fill="#f97316"/>
      {/* Chest feathers */}
      <path d="M70 130Q100 150 130 130" stroke="#a5b4fc" strokeWidth="2" fill="none"/>
      <path d="M75 145Q100 160 125 145" stroke="#a5b4fc" strokeWidth="2" fill="none"/>
    </svg>
  );
}

/**
 * Wolf mascot SVG - Represents strength and leadership.
 */
function WolfMascot({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ears */}
      <path d="M35 70L55 10L75 60" fill="#475569" stroke="#334155" strokeWidth="3"/>
      <path d="M125 60L145 10L165 70" fill="#475569" stroke="#334155" strokeWidth="3"/>
      {/* Head */}
      <polygon points="100,30 160,90 140,150 60,150 40,90" fill="#64748b"/>
      {/* Inner ears */}
      <path d="M45 65L55 25L68 58" fill="#94a3b8"/>
      <path d="M132 58L145 25L155 65" fill="#94a3b8"/>
      {/* Eyes */}
      <ellipse cx="70" cy="95" rx="12" ry="10" fill="#10b981"/>
      <ellipse cx="130" cy="95" rx="12" ry="10" fill="#10b981"/>
      <ellipse cx="70" cy="95" rx="6" ry="5" fill="#064e3b"/>
      <ellipse cx="130" cy="95" rx="6" ry="5" fill="#064e3b"/>
      <circle cx="73" cy="93" r="2" fill="white"/>
      <circle cx="133" cy="93" r="2" fill="white"/>
      {/* Snout */}
      <ellipse cx="100" cy="120" rx="20" ry="15" fill="#94a3b8"/>
      {/* Nose */}
      <ellipse cx="100" cy="110" rx="8" ry="6" fill="#1f2937"/>
      {/* Mouth */}
      <path d="M90 125L100 135L110 125" stroke="#1f2937" strokeWidth="2" fill="none"/>
      {/* Fangs */}
      <path d="M88 128L90 138L92 128" fill="white"/>
      <path d="M108 128L110 138L112 128" fill="white"/>
    </svg>
  );
}

/**
 * Hawk mascot SVG - Represents speed and precision.
 */
function HawkMascot({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Head shape */}
      <path d="M100 20L160 80L140 140L60 140L40 80Z" fill="#dc2626"/>
      {/* Beak */}
      <path d="M100 60L125 100H75L100 60Z" fill="#fbbf24"/>
      <path d="M100 100L90 130H110L100 100Z" fill="#f59e0b"/>
      {/* Eyes */}
      <ellipse cx="65" cy="85" rx="18" ry="14" fill="#fbbf24"/>
      <ellipse cx="135" cy="85" rx="18" ry="14" fill="#fbbf24"/>
      <circle cx="65" cy="85" r="10" fill="#1f2937"/>
      <circle cx="135" cy="85" r="10" fill="#1f2937"/>
      <circle cx="68" cy="82" r="3" fill="white"/>
      <circle cx="138" cy="82" r="3" fill="white"/>
      {/* Eye stripes */}
      <path d="M30 70L50 80" stroke="#7f1d1d" strokeWidth="4"/>
      <path d="M30 85L47 88" stroke="#7f1d1d" strokeWidth="3"/>
      <path d="M170 70L150 80" stroke="#7f1d1d" strokeWidth="4"/>
      <path d="M170 85L153 88" stroke="#7f1d1d" strokeWidth="3"/>
      {/* Neck feathers */}
      <path d="M60 130L70 150M80 135L85 155M120 135L115 155M140 130L130 150" 
        stroke="#b91c1c" strokeWidth="3"/>
    </svg>
  );
}

// ============================================================================
// Mascot Registry
// ============================================================================

const MASCOT_COMPONENTS: Record<MascotType, React.FC<{ className?: string }>> = {
  fox: FoxMascot,
  owl: OwlMascot,
  wolf: WolfMascot,
  hawk: HawkMascot,
};

// ============================================================================
// Animation Variants
// ============================================================================

const ANIMATION_VARIANTS: Record<NonNullable<HeroMascotProps['animation']>, Variants> = {
  idle: {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.02, 1],
      rotate: [0, 1, -1, 0],
      transition: {
        duration: 4,
        ease: easings.smoke,
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  },
  wave: {
    initial: { scale: 1, rotate: 0, x: 0 },
    animate: {
      scale: [1, 1.05, 1],
      rotate: [0, -5, 5, -5, 0],
      x: [0, -5, 5, -5, 0],
      transition: {
        duration: 2,
        ease: easings.spring,
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  },
  celebrate: {
    initial: { scale: 1, y: 0 },
    animate: {
      scale: [1, 1.1, 1],
      y: [0, -20, 0],
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
// Size Configuration
// ============================================================================

const SIZE_CLASSES: Record<NonNullable<HeroMascotProps['size']>, string> = {
  sm: 'w-24 h-24 md:w-32 md:h-32',
  md: 'w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56',
  lg: 'w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80',
};

// ============================================================================
// Position Configuration
// ============================================================================

const POSITION_CLASSES: Record<NonNullable<HeroMascotProps['position']>, string> = {
  left: 'self-start',
  center: 'self-center',
  right: 'self-end',
};

// ============================================================================
// Component
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
  size = 'md',
  className,
}: HeroMascotProps): JSX.Element {
  const { prefersReducedMotion } = useReducedMotion();
  
  const MascotComponent = MASCOT_COMPONENTS[mascot];
  const variants = ANIMATION_VARIANTS[animation];
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        POSITION_CLASSES[position],
        className
      )}
      aria-label={`${mascot} mascot character`}
      role="img"
    >
      {/* Glow effect behind mascot */}
      <div 
        className={cn(
          'absolute inset-0 rounded-full blur-3xl opacity-30',
          'bg-gradient-to-br from-blue-500 to-purple-500'
        )}
        aria-hidden="true"
      />
      
      {/* Animated mascot container */}
      <motion.div
        className={cn(
          'relative z-10',
          SIZE_CLASSES[size]
        )}
        variants={prefersReducedMotion ? {} : variants}
        initial="initial"
        animate="animate"
      >
        <MascotComponent className="w-full h-full drop-shadow-2xl" />
      </motion.div>
    </div>
  );
}

// ============================================================================
// Named Exports for Specific Mascots
// ============================================================================

/**
 * Fox mascot preset.
 */
export function FoxHeroMascot(
  props: Omit<HeroMascotProps, 'mascot'>
): JSX.Element {
  return <HeroMascot {...props} mascot="fox" />;
}

/**
 * Owl mascot preset.
 */
export function OwlHeroMascot(
  props: Omit<HeroMascotProps, 'mascot'>
): JSX.Element {
  return <HeroMascot {...props} mascot="owl" />;
}

/**
 * Wolf mascot preset.
 */
export function WolfHeroMascot(
  props: Omit<HeroMascotProps, 'mascot'>
): JSX.Element {
  return <HeroMascot {...props} mascot="wolf" />;
}

/**
 * Hawk mascot preset.
 */
export function HawkHeroMascot(
  props: Omit<HeroMascotProps, 'mascot'>
): JSX.Element {
  return <HeroMascot {...props} mascot="hawk" />;
}

// ============================================================================
// Export
// ============================================================================

export default HeroMascot;
