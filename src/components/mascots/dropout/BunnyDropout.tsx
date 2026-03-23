import React from 'react';
import './../../../../public/mascots/css/bunny-dropout.css';

export type BunnyDropoutSize = 32 | 64 | 128 | 256 | 512;
export type BunnyDropoutAnimation = 'idle' | 'wave' | 'celebrate' | 'none';

export interface BunnyDropoutProps {
  /** Size in pixels */
  size?: BunnyDropoutSize;
  /** Animation state */
  animation?: BunnyDropoutAnimation;
  /** Additional CSS class */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Dropout Style Bunny Mascot Component
 * 
 * A trendy, fashionable bunny in Dropout style.
 * Features hot pink/orange color scheme with a stylish hoodie.
 * Perfect for crossover branding with Dropout Bear.
 * 
 * @example
 * <BunnyDropout size={128} animation="celebrate" />
 */
export const BunnyDropout: React.FC<BunnyDropoutProps> = ({
  size = 128,
  animation = 'idle',
  className = '',
  alt = 'Dropout Style Bunny mascot',
}) => {
  const containerClasses = [
    'bunny-dropout-container',
    `bunny-dropout-size-${size}`,
    animation !== 'none' && `bunny-dropout-${animation}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} role="img" aria-label={alt}>
      <img 
        src={`/mascots/dropout/bunny-dropout-${size}x${size}.svg`}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
      />
    </div>
  );
};

export default BunnyDropout;
