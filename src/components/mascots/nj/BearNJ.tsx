import React from 'react';
import './../../../../public/mascots/css/bear-nj.css';

export type BearNJSize = 32 | 64 | 128 | 256 | 512;
export type BearNJAnimation = 'idle' | 'wave' | 'celebrate' | 'none';

export interface BearNJProps {
  /** Size in pixels */
  size?: BearNJSize;
  /** Animation state */
  animation?: BearNJAnimation;
  /** Additional CSS class */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * NJ Style Bear Mascot Component
 * 
 * A simple, friendly bear rendered in NJ line art style.
 * Features rounded features and a welcoming expression.
 * Perfect for crossover branding with NJ Bunny.
 * 
 * @example
 * <BearNJ size={128} animation="wave" />
 */
export const BearNJ: React.FC<BearNJProps> = ({
  size = 128,
  animation = 'idle',
  className = '',
  alt = 'NJ Style Bear mascot',
}) => {
  const containerClasses = [
    'bear-nj-container',
    `bear-nj-size-${size}`,
    animation !== 'none' && `bear-nj-${animation}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} role="img" aria-label={alt}>
      <img 
        src={`/mascots/nj/bear-nj-${size}x${size}.svg`}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
      />
    </div>
  );
};

export default BearNJ;
