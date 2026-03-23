/**
 * OwlNJ Component
 * NJ Style Owl Mascot - Minimalist line art, large wise eyes, round body
 * 
 * Style: Minimalist line art
 * Stroke: #0000FF, 2px weight
 * Features: Simple circles for eyes, rounded body, small beak
 */

import React from 'react';

export interface OwlNJProps {
  /** Size variant of the owl */
  size?: 32 | 64 | 128 | 256 | 512;
  /** Additional CSS class names */
  className?: string;
  /** Animation state */
  state?: 'default' | 'idle' | 'observing';
  /** Whether to show draw animation on mount */
  drawOnMount?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * NJ Style Owl Mascot Component
 * 
 * A minimalist line art owl with large wise eyes.
 * Perfect for clean, modern interfaces.
 * 
 * @example
 * <OwlNJ size={128} state="observing" drawOnMount />
 */
export const OwlNJ: React.FC<OwlNJProps> = ({
  size = 128,
  className = '',
  state = 'default',
  drawOnMount = false,
  onClick,
  alt = 'Minimalist line art owl mascot',
}) => {
  const basePath = '/mascots/nj';
  const stateClass = state !== 'default' ? `owl-nj--${state}` : '';
  const drawClass = drawOnMount ? 'owl-nj--draw' : '';

  return (
    <div
      className={`owl-nj-container ${className}`}
      onClick={onClick}
      role="img"
      aria-label={alt}
    >
      <div className={`owl-nj ${stateClass} ${drawClass}`}>
        <div className="owl-nj__body">
          <div className="owl-nj__head">
            <img
              src={`${basePath}/owl-${size}x${size}.svg`}
              alt={alt}
              width={size}
              height={size}
              className="owl-nj-svg"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SVG Inline version for better animation control
 * Renders the SVG directly without using an img tag
 */
export const OwlNJInline: React.FC<Omit<OwlNJProps, 'size'> & { size?: number }> = ({
  size = 128,
  className = '',
  state = 'default',
  drawOnMount = false,
  onClick,
  alt = 'Minimalist line art owl mascot',
}) => {
  const stateClass = state !== 'default' ? `owl-nj--${state}` : '';
  const drawClass = drawOnMount ? 'owl-nj--draw' : '';

  return (
    <div
      className={`owl-nj-container ${className}`}
      onClick={onClick}
      role="img"
      aria-label={alt}
      style={{ width: size, height: size }}
    >
      <svg
        className={`owl-nj-svg owl-nj ${stateClass} ${drawClass}`}
        width={size}
        height={size}
        viewBox="0 0 128 128"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="owl-nj__lines" fill="none" stroke="#0000FF" strokeWidth="2">
          {/* Body */}
          <ellipse cx="64" cy="76" rx="36" ry="40" />
          
          {/* Body detail */}
          <g opacity="0.4" strokeWidth="1.5">
            <path d="M48 92 Q64 102 80 92" />
            <path d="M88 168 Q128 188 168 168" opacity="0" /> {/* placeholder for sizing */}
            <path d="M104 200 Q128 212 152 200" opacity="0" />
          </g>
          
          {/* Head */}
          <circle cx="64" cy="40" r="28" className="owl-nj__head" />
          
          {/* Face disc */}
          <ellipse cx="64" cy="44" rx="20" ry="16" strokeWidth="1" opacity="0.3" />
          
          {/* Eyes - with blink animation */}
          <g className="owl-nj__eyes">
            <circle cx="52" cy="36" r="10" />
            <circle cx="76" cy="36" r="10" />
            <circle cx="52" cy="36" r="7" strokeWidth="1" opacity="0.4" />
            <circle cx="76" cy="36" r="7" strokeWidth="1" opacity="0.4" />
            <circle cx="52" cy="36" r="4" fill="#0000FF" stroke="none" />
            <circle cx="76" cy="36" r="4" fill="#0000FF" stroke="none" />
            {/* Eye shine */}
            <circle cx="55" cy="33" r="1.5" fill="#FFFFFF" stroke="none" />
            <circle cx="79" cy="33" r="1.5" fill="#FFFFFF" stroke="none" />
          </g>
          
          {/* Beak */}
          <path d="M60 48 L64 54 L68 48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M62 50 L64 52 L66 50" strokeWidth="1" opacity="0.5" />
          
          {/* Ear tufts */}
          <path d="M40 20 L36 8 L48 16" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M88 20 L92 8 L80 16" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Inner ear */}
          <g strokeWidth="1" opacity="0.5">
            <path d="M42 16 L40 10 L46 14" />
            <path d="M86 16 L88 10 L82 14" />
          </g>
          
          {/* Wings */}
          <g strokeWidth="1.5" opacity="0.6">
            <path d="M36 72 Q28 80 36 96" />
            <path d="M92 72 Q100 80 92 96" />
          </g>
          
          {/* Wing detail */}
          <g strokeWidth="1" opacity="0.4">
            <path d="M32 80 Q28 86 32 94" />
            <path d="M96 80 Q100 86 96 94" />
          </g>
          
          {/* Feet */}
          <g strokeWidth="1.5" opacity="0.5" strokeLinecap="round">
            <line x1="52" y1="114" x2="52" y2="118" />
            <line x1="64" y1="114" x2="64" y2="118" />
            <line x1="76" y1="114" x2="76" y2="118" />
          </g>
          
          {/* Head feathers */}
          <g strokeWidth="1" opacity="0.4">
            <path d="M56 36 Q52 40 56 48" />
            <path d="M64 32 Q64 40 64 48" />
            <path d="M72 36 Q76 40 72 48" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default OwlNJ;
