/**
 * HawkMascot Component
 * 
 * A React component for displaying the Hawk mascot in various sizes and styles.
 * Supports animations, hover effects, and multiple visual variants.
 * 
 * @example
 * <HawkMascot size="md" variant="default" animate="float" />
 * <HawkMascot size="lg" variant="gold" hoverable />
 */

import React from 'react';
import '../../styles/mascot/hawk.css';

export type HawkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type HawkVariant = 'default' | 'gold' | 'intense' | 'team' | 'victory';
export type HawkAnimation = 'none' | 'float' | 'pulse' | 'glow' | 'shake' | 'rotate' | 'bounce';

export interface HawkMascotProps {
  /** Size of the mascot */
  size?: HawkSize;
  /** Visual variant */
  variant?: HawkVariant;
  /** Animation type */
  animate?: HawkAnimation;
  /** Enable hover effects */
  hoverable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

const sizeMap: Record<HawkSize, { width: number; height: number; src: string }> = {
  xs: { width: 32, height: 32, src: '/mascots/hawk/hawk-32.svg' },
  sm: { width: 64, height: 64, src: '/mascots/hawk/hawk-64.svg' },
  md: { width: 128, height: 128, src: '/mascots/hawk/hawk-128.svg' },
  lg: { width: 256, height: 256, src: '/mascots/hawk/hawk-256.svg' },
  xl: { width: 512, height: 512, src: '/mascots/hawk/hawk-512.svg' },
};

/**
 * HawkMascot Component
 * 
 * Displays the Hawk mascot with configurable size, variant, and animation.
 */
export const HawkMascot: React.FC<HawkMascotProps> = ({
  size = 'md',
  variant = 'default',
  animate = 'none',
  hoverable = false,
  className = '',
  onClick,
  alt = 'Hawk Mascot',
  style,
}) => {
  const { width, height, src } = sizeMap[size];
  
  // Build class names
  const classes = [
    'hawk-mascot',
    `hawk-mascot--${size}`,
    variant !== 'default' && `hawk-mascot--${variant}`,
    animate !== 'none' && `hawk-mascot--${animate}`,
    hoverable && 'hawk-mascot--hoverable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={classes}
      onClick={onClick}
      style={style}
      loading="lazy"
    />
  );
};

// Default export
export default HawkMascot;

/**
 * Pre-configured size variants for convenience
 */
export const HawkMascotXS: React.FC<Omit<HawkMascotProps, 'size'>> = (props) => (
  <HawkMascot {...props} size="xs" />
);

export const HawkMascotSM: React.FC<Omit<HawkMascotProps, 'size'>> = (props) => (
  <HawkMascot {...props} size="sm" />
);

export const HawkMascotMD: React.FC<Omit<HawkMascotProps, 'size'>> = (props) => (
  <HawkMascot {...props} size="md" />
);

export const HawkMascotLG: React.FC<Omit<HawkMascotProps, 'size'>> = (props) => (
  <HawkMascot {...props} size="lg" />
);

export const HawkMascotXL: React.FC<Omit<HawkMascotProps, 'size'>> = (props) => (
  <HawkMascot {...props} size="xl" />
);

/**
 * Animated variants
 */
export const FloatingHawk: React.FC<Omit<HawkMascotProps, 'animate'>> = (props) => (
  <HawkMascot {...props} animate="float" />
);

export const PulsingHawk: React.FC<Omit<HawkMascotProps, 'animate'>> = (props) => (
  <HawkMascot {...props} animate="pulse" />
);

export const GlowingHawk: React.FC<Omit<HawkMascotProps, 'animate'>> = (props) => (
  <HawkMascot {...props} animate="glow" />
);

export const BouncingHawk: React.FC<Omit<HawkMascotProps, 'animate'>> = (props) => (
  <HawkMascot {...props} animate="bounce" />
);

/**
 * Variant presets
 */
export const GoldHawk: React.FC<Omit<HawkMascotProps, 'variant'>> = (props) => (
  <HawkMascot {...props} variant="gold" />
);

export const IntenseHawk: React.FC<Omit<HawkMascotProps, 'variant'>> = (props) => (
  <HawkMascot {...props} variant="intense" />
);

export const TeamHawk: React.FC<Omit<HawkMascotProps, 'variant'>> = (props) => (
  <HawkMascot {...props} variant="team" />
);

export const VictoryHawk: React.FC<Omit<HawkMascotProps, 'variant'>> = (props) => (
  <HawkMascot {...props} variant="victory" />
);
