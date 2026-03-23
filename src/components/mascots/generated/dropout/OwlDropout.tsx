/**
 * OwlDropout Component
 * Dropout Style Owl Mascot - Wise owl with glasses, preppy sweater, thoughtful pose
 * 
 * Style: Purple (#7B2CBF), mustard sweater (#FF9E00), gold glasses
 * Features: Large round eyes, glasses, thoughtful expression, sweater texture
 */

import React from 'react';

export interface OwlDropoutProps {
  /** Size variant of the owl */
  size?: 32 | 64 | 128 | 256 | 512;
  /** Additional CSS class names */
  className?: string;
  /** Animation state */
  state?: 'default' | 'idle' | 'thinking' | 'reading';
  /** Whether to show glasses glint animation */
  showGlint?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Dropout Style Owl Mascot Component
 * 
 * A wise owl wearing glasses and a preppy mustard sweater.
 * Perfect for educational or thoughtful contexts.
 * 
 * @example
 * <OwlDropout size={128} state="thinking" showGlint />
 */
export const OwlDropout: React.FC<OwlDropoutProps> = ({
  size = 128,
  className = '',
  state = 'default',
  showGlint = true,
  onClick,
  alt = 'Wise owl mascot wearing glasses and a sweater',
}) => {
  const basePath = '/mascots/dropout';
  const stateClass = state !== 'default' ? `owl-dropout--${state}` : '';
  const glintClass = showGlint ? 'owl-dropout__glasses-glint' : '';

  return (
    <div
      className={`owl-dropout-container ${className}`}
      onClick={onClick}
      role="img"
      aria-label={alt}
    >
      <div className={`owl-dropout ${stateClass}`}>
        <div className={`owl-dropout__head ${glintClass}`}>
          <img
            src={`${basePath}/owl-${size}x${size}.svg`}
            alt={alt}
            width={size}
            height={size}
            className="owl-dropout-svg"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * SVG Inline version for better animation control
 * Renders the SVG directly without using an img tag
 */
export const OwlDropoutInline: React.FC<Omit<OwlDropoutProps, 'size'> & { size?: number }> = ({
  size = 128,
  className = '',
  state = 'default',
  showGlint = true,
  onClick,
  alt = 'Wise owl mascot wearing glasses and a sweater',
}) => {
  const stateClass = state !== 'default' ? `owl-dropout--${state}` : '';
  const scale = size / 128;

  return (
    <div
      className={`owl-dropout-container ${className}`}
      onClick={onClick}
      role="img"
      aria-label={alt}
      style={{ width: size, height: size }}
    >
      <svg
        className={`owl-dropout-svg owl-dropout ${stateClass}`}
        width={size}
        height={size}
        viewBox="0 0 128 128"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`bodyGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9D4EDD" />
            <stop offset="50%" stopColor="#7B2CBF" />
            <stop offset="100%" stopColor="#5A189A" />
          </linearGradient>
          <linearGradient id={`sweaterGrad-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9E00" />
            <stop offset="100%" stopColor="#CC7000" />
          </linearGradient>
          <linearGradient id={`glassesGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>

        {/* Body Group */}
        <g className="owl-dropout__sweater">
          <ellipse cx="64" cy="80" rx="40" ry="36" fill={`url(#bodyGrad-${size})`} />
          <path
            d="M24 80 Q24 112 64 112 Q104 112 104 80 L104 72 Q104 96 64 96 Q24 96 24 72 Z"
            fill={`url(#sweaterGrad-${size})`}
          />
          {/* Sweater ribbing */}
          <g opacity="0.4">
            <path d="M28 88 Q64 98 100 88" stroke="#AA5500" strokeWidth="1.5" fill="none" />
            <path d="M28 96 Q64 106 100 96" stroke="#AA5500" strokeWidth="1.5" fill="none" />
            <path d="M28 104 Q64 114 100 104" stroke="#AA5500" strokeWidth="1.5" fill="none" />
          </g>
          <ellipse cx="64" cy="72" rx="32" ry="10" fill="#FF9E00" stroke="#CC7000" strokeWidth="1" />
        </g>

        {/* Head Group with animation */}
        <g className="owl-dropout__head">
          <ellipse cx="64" cy="40" rx="36" ry="32" fill={`url(#bodyGrad-${size})`} />
          
          {/* Ears */}
          <path d="M32 20 L24 8 L40 16 Z" fill="#7B2CBF" />
          <path d="M96 20 L104 8 L88 16 Z" fill="#7B2CBF" />
          <path d="M36 16 L32 6 L42 14 Z" fill="#9D4EDD" />
          <path d="M92 16 L96 6 L86 14 Z" fill="#9D4EDD" />

          {/* Eyes */}
          <g className="owl-dropout__eyes">
            <circle cx="48" cy="40" r="14" fill="#FFFFFF" />
            <circle cx="80" cy="40" r="14" fill="#FFFFFF" />
            <circle cx="48" cy="40" r="8" fill="#1A1A2E" />
            <circle cx="80" cy="40" r="8" fill="#1A1A2E" />
            <circle cx="52" cy="36" r="3" fill="#FFFFFF" />
            <circle cx="84" cy="36" r="3" fill="#FFFFFF" />
          </g>

          {/* Glasses */}
          <g className={showGlint ? 'owl-dropout__glasses-glint' : ''}>
            <circle cx="48" cy="40" r="16" stroke={`url(#glassesGrad-${size})`} strokeWidth="2.5" fill="none" />
            <circle cx="80" cy="40" r="16" stroke={`url(#glassesGrad-${size})`} strokeWidth="2.5" fill="none" />
            <path d="M64 40 Q64 32 64 32" stroke={`url(#glassesGrad-${size})`} strokeWidth="2" fill="none" />
            <line x1="64" y1="38" x2="64" y2="42" stroke={`url(#glassesGrad-${size})`} strokeWidth="2" />
            
            {/* Glasses glint */}
            {showGlint && (
              <>
                <path d="M40 32 Q44 28 52 32" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.7" />
                <path d="M72 32 Q76 28 84 32" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.7" />
              </>
            )}
          </g>

          {/* Beak */}
          <path d="M60 52 L64 60 L68 52 Z" fill="#FFB347" />
          <path d="M60 52 L64 56 L68 52 Z" fill="#FFA500" />

          {/* Eyebrows */}
          <path d="M36 28 Q48 24 56 28" stroke="#5A189A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M72 28 Q80 24 92 28" stroke="#5A189A" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Wing hints */}
        <path d="M28 72 Q24 84 28 96" stroke="#5A189A" strokeWidth="2" fill="none" opacity="0.3" />
        <path d="M100 72 Q104 84 100 96" stroke="#5A189A" strokeWidth="2" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
};

export default OwlDropout;
