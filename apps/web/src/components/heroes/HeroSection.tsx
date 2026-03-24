/** [Ver001.000]
 * HeroSection Component
 * =====================
 * Semantic layout wrapper for hero sections with full-height option.
 * 
 * Features:
 * - Section wrapper with semantic HTML
 * - Full-height option for landing pages
 * - Responsive padding and spacing
 * - Accessibility support (landmark, ARIA)
 * - Dark/light theme support
 * - Optional background variants
 * 
 * @example
 * ```tsx
 * // Basic section wrapper
 * <HeroSection>
 *   <Hero title="Welcome" />
 * </HeroSection>
 * 
 * // Full-height landing page section
 * <HeroSection fullHeight id="home">
 *   <Hero 
 *     title="SATOR Platform"
 *     subtitle="Next-gen esports analytics"
 *     cta={{ primary: { label: 'Start', href: '/app' } }}
 *   />
 * </HeroSection>
 * 
 * // With custom background
 * <HeroSection 
 *   fullHeight 
 *   background="dark"
 *   className="custom-hero"
 * >
 *   <Content />
 * </HeroSection>
 * ```
 */

import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import type { HeroSectionProps } from './types';

// ============================================================================
// Background Variants
// ============================================================================

const BACKGROUND_CLASSES = {
  transparent: '',
  light: 'bg-gray-50 dark:bg-slate-900',
  dark: 'bg-slate-900 dark:bg-black',
  gradient: 'bg-gradient-to-b from-slate-900 to-slate-800',
  primary: 'bg-blue-600 dark:bg-blue-900',
};

// ============================================================================
// Component
// ============================================================================

/**
 * HeroSection provides a semantic wrapper for hero content.
 * 
 * @param props - HeroSection component props
 * @returns HeroSection JSX element
 */
export interface HeroSectionComponentProps extends HeroSectionProps {
  as?: 'section' | 'div' | 'header';
}

export const HeroSection = forwardRef<HTMLElement, HeroSectionComponentProps>(
  function HeroSection(
    {
      children,
      className,
      fullHeight = false,
      id,
      background = 'transparent',
      as: Component = 'section',
      ariaLabel,
      ariaLabelledBy,
    },
    ref
  ): JSX.Element {
    const baseProps = {
      id,
      className: cn(
        'relative w-full',
        'flex flex-col',
        fullHeight ? 'min-h-screen' : 'min-h-[50vh]',
        BACKGROUND_CLASSES[background],
        className
      ),
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    };

    if (Component === 'div') {
      return (
        <div ref={ref as React.Ref<HTMLDivElement>} {...baseProps}>
          {children}
        </div>
      );
    }

    if (Component === 'header') {
      return (
        <header ref={ref as React.Ref<HTMLElement>} {...baseProps}>
          {children}
        </header>
      );
    }

    return (
      <section ref={ref as React.Ref<HTMLElement>} {...baseProps} role="region">
        {children}
      </section>
    );
  }
);

// ============================================================================
// Convenience Variants
// ============================================================================

interface FullHeightHeroProps extends Omit<HeroSectionProps, 'fullHeight'> {
  children: React.ReactNode;
}

/**
 * Full-height hero section preset.
 * 
 * @param props - FullHeightHero props
 * @returns Full-height HeroSection
 */
export function FullHeightHero({
  children,
  className,
  ...props
}: FullHeightHeroProps): JSX.Element {
  return (
    <HeroSection
      fullHeight
      className={cn('justify-center', className)}
      {...props}
    >
      {children}
    </HeroSection>
  );
}

/**
 * Landing page hero section with dark gradient background.
 * 
 * @param props - LandingHero props
 * @returns Landing HeroSection
 */
export function LandingHero({
  children,
  className,
  ...props
}: FullHeightHeroProps): JSX.Element {
  return (
    <HeroSection
      fullHeight
      background="dark"
      className={cn(
        'justify-center',
        'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
        className
      )}
      {...props}
    >
      {children}
    </HeroSection>
  );
}

// ============================================================================
// Export
// ============================================================================

export default HeroSection;
