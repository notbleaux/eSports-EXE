/** [Ver001.000]
 * Heroes Component Types
 * ======================
 * Type definitions for hero components.
 */

import type { ReactNode } from 'react';

// ============================================================================
// Hero Component Types
// ============================================================================

/**
 * CTA (Call-to-Action) configuration.
 */
export interface HeroCta {
  /** Primary CTA button */
  primary: {
    /** Button label text */
    label: string;
    /** Link href */
    href: string;
  };
  /** Optional secondary CTA button */
  secondary?: {
    /** Button label text */
    label: string;
    /** Link href */
    href: string;
  };
}

/**
 * Background variant options for Hero.
 */
export type HeroBackground = 'gradient' | 'image' | 'video';

/**
 * Props for the Hero component.
 */
export interface HeroProps {
  /** Main heading text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional mascot character to display */
  mascot?: MascotType;
  /** Background style variant */
  background?: HeroBackground;
  /** Optional CTA buttons configuration */
  cta?: HeroCta;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HeroMascot Component Types
// ============================================================================

/**
 * Mascot character types.
 */
export type MascotType = 'fox' | 'owl' | 'wolf' | 'hawk';

/**
 * Animation state for mascot.
 */
export type MascotAnimation = 'idle' | 'wave' | 'celebrate';

/**
 * Position options for mascot placement.
 */
export type MascotPosition = 'left' | 'right' | 'center';

/**
 * Size variants for mascot display.
 */
export type MascotSize = 'sm' | 'md' | 'lg';

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
  /** Size variant */
  size?: MascotSize;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HeroSection Component Types
// ============================================================================

/**
 * Background variant options for HeroSection.
 */
export type SectionBackground = 'transparent' | 'light' | 'dark' | 'gradient' | 'primary';

/**
 * Props for the HeroSection component.
 */
export interface HeroSectionProps {
  /** Child elements */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to make section full viewport height */
  fullHeight?: boolean;
  /** Optional section ID for anchor links */
  id?: string;
  /** Background style variant */
  background?: SectionBackground;
  /** HTML element to render as */
  as?: 'section' | 'div' | 'header';
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ID of element labeling this section */
  ariaLabelledBy?: string;
}

// ============================================================================
// Re-export Animation Types (for convenience)
// ============================================================================

export type { Variants, Transition } from 'framer-motion';
