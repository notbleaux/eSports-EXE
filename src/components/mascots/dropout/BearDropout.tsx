import React from 'react';
import './../../../../public/mascots/css/bear-dropout.css';

export type BearVariant = 'default' | 'homecoming' | 'graduation' | 'late-registration' | 'yeezus' | 'donda';
export type BearSize = 32 | 64 | 128 | 256 | 512;
export type BearAnimation = 'idle' | 'wave' | 'celebrate' | 'none';

export interface BearDropoutProps {
  /** Variant of the bear */
  variant?: BearVariant;
  /** Size in pixels */
  size?: BearSize;
  /** Animation state */
  animation?: BearAnimation;
  /** Additional CSS class */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Dropout Bear Mascot Component
 * 
 * A college-themed bear mascot with 6 variants:
 * - default: Classic graduation bear with red jacket
 * - homecoming: Blue jacket with crown
 * - graduation: Dark gown with diploma
 * - late-registration: Preppy blazer, tired eyes
 * - yeezus: White mask, distressed tee
 * - donda: Black tactical gear, glowing red eyes
 * 
 * @example
 * <BearDropout variant="graduation" size={128} animation="celebrate" />
 */
export const BearDropout: React.FC<BearDropoutProps> = ({
  variant = 'default',
  size = 128,
  animation = 'idle',
  className = '',
  alt = 'Dropout Bear mascot',
}) => {
  const getSvgPath = (): string => {
    if (variant === 'default') {
      return `/mascots/dropout/bear-${size}x${size}.svg`;
    }
    return `/mascots/dropout/bear-${variant}-${size}x${size}.svg`;
  };

  const containerClasses = [
    'bear-dropout-container',
    `bear-dropout-size-${size}`,
    `bear-dropout-${variant}`,
    animation !== 'none' && `bear-dropout-${animation}`,
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

export default BearDropout;
