/** [Ver001.000]
 * HeroSection Component - Boitano/Kunsthalle Inspired Redesign
 * =============================================================
 * Stunning hero section with massive typography, geometric accents,
 * and refined animations following brutalist/minimalist design principles.
 * 
 * Design Inspiration:
 * - Boitano: Bold geometric shapes, pink accents, clean typography
 * - Kunsthalle: Massive display type, generous whitespace, refined grid
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <HeroSection />
 * 
 * // With custom CTAs
 * <HeroSection 
 *   primaryCta={{ label: 'Enter Platform', href: '/app' }}
 *   secondaryCta={{ label: 'Read Manifesto', href: '/about' }}
 * />
 * ```
 */

import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface HeroSectionProps {
  /** Primary CTA configuration */
  primaryCta?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  /** Secondary CTA configuration */
  secondaryCta?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Label text above title */
  label?: string;
  /** Main title (first line) */
  titleLine1?: string;
  /** Main title (second line - colored) */
  titleLine2?: string;
  /** Subtitle text */
  subtitle?: string;
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const slideInLeftVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.9,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// ============================================================================
// Geometric Symbol Component
// ============================================================================

const GeometricSymbol = () => (
  <svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 400 400" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="text-pure-black"
  >
    {/* Outer diamond */}
    <path
      d="M200 20 L380 200 L200 380 L20 200 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.3"
    />
    {/* Middle diamond */}
    <path
      d="M200 60 L340 200 L200 340 L60 200 Z"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.2"
    />
    {/* Inner circle */}
    <circle 
      cx="200" 
      cy="200" 
      r="120" 
      stroke="currentColor" 
      strokeWidth="1" 
      opacity="0.15"
    />
    {/* Center circle */}
    <circle 
      cx="200" 
      cy="200" 
      r="60" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      opacity="0.25"
    />
    {/* Core dot */}
    <circle 
      cx="200" 
      cy="200" 
      r="12" 
      fill="currentColor" 
      opacity="0.4"
    />
    {/* Cross lines */}
    <line x1="200" y1="80" x2="200" y2="320" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    <line x1="80" y1="200" x2="320" y2="200" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
    {/* Corner accents */}
    <circle cx="200" cy="20" r="4" fill="currentColor" opacity="0.3" />
    <circle cx="380" cy="200" r="4" fill="currentColor" opacity="0.3" />
    <circle cx="200" cy="380" r="4" fill="currentColor" opacity="0.3" />
    <circle cx="20" cy="200" r="4" fill="currentColor" opacity="0.3" />
  </svg>
);

// ============================================================================
// Scroll Indicator Component
// ============================================================================

const ScrollIndicator = () => (
  <motion.div
    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.2, duration: 0.6 }}
  >
    <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-medium">
      Scroll
    </span>
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg 
        width="24" 
        height="40" 
        viewBox="0 0 24 40" 
        fill="none"
        className="text-gray-400"
      >
        <rect 
          x="1" 
          y="1" 
          width="22" 
          height="38" 
          rx="11" 
          stroke="currentColor" 
          strokeWidth="1.5"
        />
        <motion.circle 
          cx="12" 
          cy="12" 
          r="4" 
          fill="currentColor"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  </motion.div>
);

// ============================================================================
// Background Shape Component
// ============================================================================

const BackgroundShape = () => (
  <motion.div
    className="absolute top-0 right-0 w-[60%] h-full overflow-hidden pointer-events-none"
    initial={{ opacity: 0, x: '20%' }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
  >
    {/* Pink accent blob */}
    <div 
      className="absolute -top-[20%] -right-[10%] w-[80%] h-[140%] bg-boitano-pink/8 rounded-full blur-3xl"
      style={{ transform: 'rotate(-15deg)' }}
    />
    {/* Secondary accent */}
    <div 
      className="absolute top-[30%] right-[20%] w-[40%] h-[60%] bg-boitano-pink/5 rounded-full blur-2xl"
    />
  </motion.div>
);

// ============================================================================
// Main Component
// ============================================================================

export function HeroSection({
  primaryCta = { label: 'Explore Hubs', href: '/hubs' },
  secondaryCta = { label: 'View Documentation', href: '/docs' },
  className,
  label = 'Platform v2.0 Live',
  titleLine1 = 'NJZiteGeisTe',
  titleLine2 = 'Platform',
  subtitle = 'Navigate through five interconnected hubs. Each quadrant holds a universe of esports data, analytics, and intelligence.',
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  
  // Parallax scroll effect using Framer Motion
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const contentY = useTransform(scrollY, [0, 500], [0, 50]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section
      ref={containerRef}
      className={cn(
        'relative min-h-screen flex items-center justify-center overflow-hidden',
        'bg-off-white',
        className
      )}
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-off-white" />
      
      {/* Animated background shapes */}
      <BackgroundShape />
      
      {/* Parallax geometric symbol */}
      <motion.div
        className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] pointer-events-none"
        style={{ y: backgroundY }}
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="w-full h-full"
        >
          <GeometricSymbol />
        </motion.div>
      </motion.div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main content */}
      <motion.div 
        className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-16 xl:px-24"
        style={{ y: contentY, opacity }}
      >
        <motion.div
          className="max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Label */}
          <motion.div variants={fadeUpVariants}>
            <span className="inline-block text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gray-500 font-medium mb-6 sm:mb-8">
              {label}
            </span>
          </motion.div>
          
          {/* Main Title - Massive display typography */}
          <div className="space-y-0">
            <motion.h1
              className="text-[clamp(3.5rem,12vw,10rem)] font-bold leading-[0.85] tracking-[-0.04em] text-pure-black"
              variants={slideInLeftVariants}
            >
              {titleLine1}
            </motion.h1>
            <motion.h1
              className="text-[clamp(3.5rem,12vw,10rem)] font-bold leading-[0.85] tracking-[-0.04em] text-kunst-green"
              variants={scaleInVariants}
            >
              {titleLine2}
            </motion.h1>
          </div>
          
          {/* Subtitle */}
          <motion.p
            className="mt-8 sm:mt-12 text-base sm:text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed font-normal"
            variants={fadeUpVariants}
          >
            {subtitle}
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            className="mt-10 sm:mt-14 flex flex-col sm:flex-row gap-4 sm:gap-6"
            variants={fadeUpVariants}
          >
            {/* Primary CTA */}
            <a
              href={primaryCta.href}
              onClick={(e) => {
                if (primaryCta.onClick) {
                  e.preventDefault();
                  primaryCta.onClick();
                }
              }}
              className={cn(
                'group relative inline-flex items-center justify-center',
                'bg-pure-black text-white',
                'px-8 py-4 sm:px-10 sm:py-5',
                'text-sm uppercase tracking-[0.15em] font-medium',
                'transition-all duration-300 ease-out',
                'hover:bg-gray-900 hover:scale-[1.02]',
                'active:scale-[0.98]',
                'overflow-hidden'
              )}
            >
              <span className="relative z-10 flex items-center gap-3">
                {primaryCta.label}
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  →
                </motion.span>
              </span>
            </a>
            
            {/* Secondary CTA */}
            <a
              href={secondaryCta.href}
              onClick={(e) => {
                if (secondaryCta.onClick) {
                  e.preventDefault();
                  secondaryCta.onClick();
                }
              }}
              className={cn(
                'group inline-flex items-center justify-center',
                'text-pure-black',
                'px-8 py-4 sm:px-10 sm:py-5',
                'text-sm uppercase tracking-[0.15em] font-medium',
                'border-2 border-pure-black',
                'transition-all duration-300 ease-out',
                'hover:bg-pure-black hover:text-white',
                'active:scale-[0.98]'
              )}
            >
              {secondaryCta.label}
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="mt-16 sm:mt-20 pt-8 border-t border-gray-200 grid grid-cols-3 gap-8 max-w-lg"
            variants={fadeUpVariants}
          >
            {[
              { value: '5', label: 'Hubs' },
              { value: '10K+', label: 'Matches' },
              { value: '99%', label: 'Uptime' },
            ].map((stat, index) => (
              <div key={index} className="text-left">
                <div className="text-2xl sm:text-3xl font-bold text-pure-black tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Scroll indicator */}
      <ScrollIndicator />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-off-white to-transparent pointer-events-none" />
    </section>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default HeroSection;
