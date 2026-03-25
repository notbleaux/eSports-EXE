/** [Ver001.000]
 * HeroV2 Component
 * ================
 * Bold, asymmetric, geometric hero inspired by Boitano + Kunsthalle Basel.
 * 
 * Design Elements:
 * - Bold pink background (Boitano style)
 * - Oversized typography with negative tracking
 * - Geometric rotating symbol in center-right
 * - Asymmetric hub cards with staggered heights
 * - Sharp buttons with hover shadow effect
 * - Mix-blend navigation that adapts to background
 * - Geometric background patterns
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <HeroV2 />
 * 
 * // With custom CTA action
 * <HeroV2 onEnterPlatform={() => navigate('/sator')} />
 * ```
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import { easings, expoOut } from '@/lib/easing';

// ============================================================================
// Types
// ============================================================================

export interface HeroV2Props {
  /** Callback when Enter Platform button is clicked */
  onEnterPlatform?: () => void;
  /** Custom className for the section */
  className?: string;
  /** Whether to show the navigation (default: true) */
  showNavigation?: boolean;
  /** Whether to show hub preview cards (default: true) */
  showHubCards?: boolean;
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easings.fluid,
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: expoOut,
    },
  },
};

const headlineVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: expoOut,
    },
  },
};

const navVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.fluid,
    },
  },
};

const hubCardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: expoOut,
    },
  }),
};

// ============================================================================
// Hub Data
// ============================================================================

const HUBS = [
  { name: 'SATOR', color: 'bg-kunst-green', textColor: 'text-pure-black', stat: '2.4M Records' },
  { name: 'ROTAS', color: 'bg-boitano-pink', textColor: 'text-pure-black', stat: '99.9% Accuracy' },
  { name: 'AREPO', color: 'bg-pure-black', textColor: 'text-white', stat: '247 Pages' },
  { name: 'OPERA', color: 'bg-kunst-green', textColor: 'text-pure-black', stat: '6 Maps' },
  { name: 'TENET', color: 'bg-boitano-pink', textColor: 'text-pure-black', stat: 'Central Hub' },
] as const;

const NAV_LINKS = ['SATOR', 'ROTAS', 'AREPO', 'OPERA', 'TENET'] as const;

// ============================================================================
// Component
// ============================================================================

/**
 * HeroV2 - Bold, asymmetric, geometric hero component
 * 
 * @param props - HeroV2 component props
 * @returns HeroV2 JSX element
 */
export function HeroV2({
  onEnterPlatform,
  className,
  showNavigation = true,
  showHubCards = true,
}: HeroV2Props): JSX.Element {
  const { prefersReducedMotion } = useReducedMotion();

  return (
    <section
      className={cn(
        // Base styles
        'relative min-h-screen bg-boitano-pink overflow-hidden',
        className
      )}
      aria-labelledby="hero-title"
    >
      {/* ==========================================================================
         Geometric Background Pattern
         ========================================================================== */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 border-4 border-pure-black rotate-45"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 border-4 border-pure-black -rotate-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        />
        {/* Additional geometric elements */}
        <div className="absolute top-1/3 right-1/3 w-32 h-32 border-2 border-pure-black rotate-12" />
        <div className="absolute bottom-1/3 left-1/6 w-48 h-48 border-2 border-pure-black -rotate-45" />
      </div>

      {/* ==========================================================================
         Navigation
         ========================================================================== */}
      {showNavigation && (
        <motion.nav
          className="fixed top-0 left-0 right-0 z-50 p-6 mix-blend-difference"
          variants={prefersReducedMotion ? {} : navVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex justify-between items-center text-white">
            {/* Logo */}
            <motion.a
              href="/"
              className="text-2xl font-display font-bold tracking-tight hover:opacity-80 transition-opacity"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              NJZiteGeisTe
            </motion.a>

            {/* Nav Links */}
            <div className="hidden md:flex gap-8">
              {NAV_LINKS.map((hub, index) => (
                <motion.a
                  key={hub}
                  href={`/${hub.toLowerCase()}`}
                  className="text-sm uppercase tracking-widest hover:underline underline-offset-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  whileHover={{ y: -2 }}
                >
                  {hub}
                </motion.a>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white p-2"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </motion.nav>
      )}

      {/* ==========================================================================
         Main Content
         ========================================================================== */}
      <motion.div
        className="relative z-10 container mx-auto px-6 pt-32 md:pt-40"
        variants={prefersReducedMotion ? {} : containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-12 gap-4">
          {/* Large headline - bleeding edge */}
          <div className="col-span-12 -mx-6 md:-mx-12">
            <motion.h1
              id="hero-title"
              className="text-hero text-pure-black uppercase font-display font-bold tracking-tighter leading-tight"
              variants={prefersReducedMotion ? {} : headlineVariants}
            >
              TENET
            </motion.h1>
            <motion.h2
              className="text-hero text-pure-black font-display font-bold tracking-tighter leading-tight -mt-2 md:-mt-4"
              variants={prefersReducedMotion ? {} : headlineVariants}
              transition={{ delay: 0.1 }}
            >
              PLATFORM
            </motion.h2>
          </div>

          {/* Subheadline */}
          <motion.div
            className="col-span-12 md:col-span-6 md:col-start-1 mt-8 md:mt-12"
            variants={prefersReducedMotion ? {} : itemVariants}
          >
            <p className="text-lg md:text-xl font-body text-pure-black/80 max-w-md leading-relaxed">
              Navigate through five interconnected hubs. Each quadrant holds a universe of esports data, analytics, and intelligence.
            </p>
          </motion.div>

          {/* CTA Button - sharp style */}
          <motion.div
            className="col-span-12 mt-8 md:mt-12"
            variants={prefersReducedMotion ? {} : itemVariants}
          >
            <motion.button
              onClick={onEnterPlatform}
              className={cn(
                // Base button styles
                'inline-flex items-center justify-center',
                'px-10 py-4 md:px-12 md:py-5',
                'bg-pure-black text-white',
                'font-display font-bold text-lg uppercase tracking-widest',
                'border-2 border-pure-black',
                // Sharp corners (no border-radius)
                'rounded-none',
                // Shadow for depth
                'shadow-black-md',
                // Hover effects
                'hover:shadow-black-lg hover:-translate-y-1',
                // Active state
                'active:translate-y-0 active:shadow-black-sm',
                // Transition
                'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                // Focus
                'focus:outline-none focus:ring-2 focus:ring-pure-black focus:ring-offset-4 focus:ring-offset-boitano-pink'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Enter Platform
            </motion.button>
          </motion.div>
        </div>

        {/* ==========================================================================
           Central Geometric Symbol (Rotating)
           ========================================================================== */}
        <motion.div
          className="absolute top-1/2 right-4 md:right-1/4 -translate-y-1/2 pointer-events-none"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ 
            opacity: 1, 
            rotate: prefersReducedMotion ? 45 : undefined 
          }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div
            className={cn(
              'w-32 h-32 md:w-48 md:h-48',
              'border-8 border-pure-black',
              'rotate-45',
              prefersReducedMotion ? '' : 'animate-spin'
            )}
            style={{ 
              animationDuration: prefersReducedMotion ? '0s' : '20s',
              animationTimingFunction: 'linear'
            }}
            aria-hidden="true"
          />
          {/* Inner square for visual interest */}
          <div
            className={cn(
              'absolute inset-0 m-auto w-16 h-16 md:w-24 md:h-24',
              'border-4 border-pure-black',
              'rotate-12',
              prefersReducedMotion ? '' : 'animate-spin'
            )}
            style={{ 
              animationDuration: prefersReducedMotion ? '0s' : '15s',
              animationDirection: 'reverse',
              animationTimingFunction: 'linear'
            }}
          />
        </motion.div>

        {/* ==========================================================================
           Scroll Indicator
           ========================================================================== */}
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 hidden md:block"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-pure-black/60"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ==========================================================================
         Hub Preview Cards - Asymmetric Layout
         ========================================================================== */}
      {showHubCards && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {HUBS.map((hub, i) => (
              <motion.a
                key={hub.name}
                href={`/${hub.name.toLowerCase()}`}
                className={cn(
                  // Base card styles
                  hub.color,
                  hub.textColor,
                  'p-4 md:p-6',
                  'border-2 border-pure-black',
                  'rounded-none',
                  'cursor-pointer',
                  // Shadow
                  'shadow-black-sm',
                  // Transition
                  'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  // Hover effects
                  'hover:shadow-black-md hover:-translate-y-2',
                  // Active state
                  'active:translate-y-0 active:shadow-black-sm'
                )}
                style={{ 
                  marginTop: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${i * 20}px` : '0'
                }}
                custom={i}
                variants={prefersReducedMotion ? {} : hubCardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight">
                  {hub.name}
                </h3>
                <p className="text-xs md:text-sm mt-2 opacity-80 font-mono">
                  {hub.stat}
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Hub-Specific Hero V2 Variants
// ============================================================================

interface HubHeroV2Props extends Omit<HeroV2Props, 'className'> {
  hubId: 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';
}

const HUB_BACKGROUNDS: Record<HubHeroV2Props['hubId'], string> = {
  sator: 'bg-pure-black',
  rotas: 'bg-boitano-pink',
  arepo: 'bg-kunst-green',
  opera: 'bg-accent-cyan',
  tenet: 'bg-accent-purple',
};

/**
 * Hub-specific HeroV2 with themed background
 * 
 * @param props - Hub hero props including hubId
 * @returns HeroV2 component with hub theming
 */
export function HubHeroV2({
  hubId,
  ...props
}: HubHeroV2Props): JSX.Element {
  const bgClass = HUB_BACKGROUNDS[hubId];

  return (
    <HeroV2
      {...props}
      className={bgClass}
    />
  );
}

// ============================================================================
// Exports
// ============================================================================

export default HeroV2;
