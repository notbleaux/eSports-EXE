import React from 'react';
import './../../../../public/mascots/css/bunny-nj.css';

export type BunnyVariant = 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
export type BunnySize = 32 | 64 | 128 | 256 | 512;
export type BunnyAnimation = 'idle' | 'wave' | 'celebrate' | 'none';

export interface BunnyNJProps {
  /** Variant of the bunny */
  variant?: BunnyVariant;
  /** Size in pixels */
  size?: BunnySize;
  /** Animation state */
  animation?: BunnyAnimation;
  /** Additional CSS class */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * NJ Bunny Mascot Component
 * 
 * A K-pop inspired bunny mascot with iconic floppy ears.
 * 5 variants inspired by NJ songs:
 * - classic-blue: Default line art style
 * - attention: Alert, curious pose
 * - hype-boy: Energetic, dancing pose
 * - cookie: Shy, cute expression
 * - ditto: Morphing, ethereal style
 * 
 * @example
 * <BunnyNJ variant="hype-boy" size={128} animation="celebrate" />
 */
export const BunnyNJ: React.FC<BunnyNJProps> = ({
  variant = 'classic-blue',
  size = 128,
  animation = 'idle',
  className = '',
  alt = 'NJ Bunny mascot',
}) => {
  const getSvgPath = (): string => {
    if (variant === 'classic-blue') {
      return `/mascots/nj/bunny-${size}x${size}.svg`;
    }
    return `/mascots/nj/bunny-${variant}-${size}x${size}.svg`;
  };

  const containerClasses = [
    'bunny-nj-container',
    `bunny-nj-size-${size}`,
    `bunny-nj-${variant}`,
    animation !== 'none' && `bunny-nj-${animation}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} role="img" aria-label={alt}>
      <img 
        src={getSvgPath()}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
      />
    </div>
  );
};

export default BunnyNJ;
