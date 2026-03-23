/** [Ver001.000]
 * Hero Component
 * ==============
 * Main hero component with title, subtitle, CTA buttons, and mascot integration.
 * 
 * Features:
 * - Responsive layout (mobile-first)
 * - Background variants (gradient, image, video)
 * - Optional mascot positioning
 * - CTA buttons with GlowButton component
 * - Framer Motion animation support
 * - Reduced motion accessibility
 * - Dark/light theme support
 * 
 * @example
 * ```tsx
 * // Basic hero with title
 * <Hero title="Welcome to SATOR" />
 * 
 * // Hero with subtitle and CTAs
 * <Hero
 *   title="SATOR Analytics"
 *   subtitle="Advanced esports metrics and player ratings"
 *   cta={{
 *     primary: { label: 'Get Started', href: '/signup' },
 *     secondary: { label: 'Learn More', href: '/about' },
 *   }}
 * />
 * 
 * // Hero with mascot
 * <Hero
 *   title="Meet Your Guide"
 *   mascot="fox"
 *   background="gradient"
 * />
 * ```
 */

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import { easings } from '@/lib/easing';
import { GlowButton } from '@/components/ui/GlowButton';
import { HeroMascot } from './HeroMascot';
import type { HeroProps } from './types';

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: easings.fluid,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easings.fluid,
    },
  },
};

// ============================================================================
// Background Styles
// ============================================================================

const BACKGROUND_STYLES: Record<NonNullable<HeroProps['background']>, string> = {
  gradient: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
  image: 'bg-cover bg-center bg-no-repeat',
  video: 'relative overflow-hidden',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Hero component for page headers and landing sections.
 * 
 * @param props - Hero component props
 * @returns Hero JSX element
 */
export function Hero({
  title,
  subtitle,
  mascot,
  background = 'gradient',
  cta,
  className,
}: HeroProps): JSX.Element {
  const { prefersReducedMotion } = useReducedMotion();

  const hasMascot = Boolean(mascot);
  const hasCta = Boolean(cta);

  return (
    <section
      className={cn(
        // Base styles
        'relative w-full min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh]',
        'flex items-center justify-center',
        'px-4 sm:px-6 lg:px-8 xl:px-12',
        'py-16 md:py-20 lg:py-24',
        // Background
        BACKGROUND_STYLES[background],
        // Custom classes
        className
      )}
      aria-labelledby="hero-title"
    >
      {/* Background overlay for image/video */}
      {(background === 'image' || background === 'video') && (
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      )}

      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"
        aria-hidden="true"
      />

      <motion.div
        className={cn(
          'relative z-10 w-full max-w-7xl mx-auto',
          'flex flex-col lg:flex-row items-center justify-between',
          'gap-8 lg:gap-12',
          hasMascot && 'lg:text-left text-center'
        )}
        variants={prefersReducedMotion ? {} : containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Content Section */}
        <div className={cn(
          'flex flex-col',
          hasMascot ? 'lg:w-1/2 w-full' : 'w-full max-w-4xl mx-auto text-center'
        )}>
          {/* Title */}
          <motion.h1
            id="hero-title"
            className={cn(
              'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
              'font-bold tracking-tight',
              'text-white',
              'mb-4 md:mb-6'
            )}
            variants={prefersReducedMotion ? {} : itemVariants}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              className={cn(
                'text-lg sm:text-xl md:text-2xl',
                'text-white/80',
                'max-w-2xl',
                hasMascot ? '' : 'mx-auto',
                'mb-8 md:mb-10'
              )}
              variants={prefersReducedMotion ? {} : itemVariants}
            >
              {subtitle}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {hasCta && (
            <motion.div
              className={cn(
                'flex flex-col sm:flex-row gap-4',
                hasMascot ? 'sm:justify-start justify-center' : 'justify-center'
              )}
              variants={prefersReducedMotion ? {} : itemVariants}
            >
              {/* Primary CTA */}
              <a href={cta?.primary.href}>
                <GlowButton
                  variant="primary"
                  size="lg"
                  hubTheme="sator"
                >
                  {cta?.primary.label}
                </GlowButton>
              </a>

              {/* Secondary CTA */}
              {cta?.secondary && (
                <a href={cta.secondary.href}>
                  <GlowButton
                    variant="secondary"
                    size="lg"
                  >
                    {cta.secondary.label}
                  </GlowButton>
                </a>
              )}
            </motion.div>
          )}
        </div>

        {/* Mascot Section */}
        {hasMascot && (
          <motion.div
            className="lg:w-1/2 w-full flex justify-center lg:justify-end"
            variants={prefersReducedMotion ? {} : itemVariants}
          >
            <HeroMascot
              mascot={mascot!}
              animation="idle"
              position="center"
              size="lg"
            />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

// ============================================================================
// Hub-Specific Hero Variants
// ============================================================================

interface HubHeroProps extends Omit<HeroProps, 'background'> {
  hubId: 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';
}

const HUB_GRADIENTS: Record<HubHeroProps['hubId'], string> = {
  sator: 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900',
  rotas: 'bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900',
  arepo: 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900',
  opera: 'bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-900',
  tenet: 'bg-gradient-to-br from-violet-950 via-slate-900 to-violet-900',
};

/**
 * Hub-specific hero with themed gradient background.
 * 
 * @param props - Hub hero props including hubId
 * @returns Hero component with hub theming
 */
export function HubHero({
  hubId,
  className,
  ...props
}: HubHeroProps): JSX.Element {
  return (
    <Hero
      {...props}
      background="gradient"
      className={cn(HUB_GRADIENTS[hubId], className)}
    />
  );
}

// ============================================================================
// Exports
// ============================================================================

export default Hero;
