/**
 * NJ Bunny SVG 32x32px Component
 * [Ver001.000]
 */

import React from 'react';

interface NJBunnySVG32Props {
  className?: string;
  variant?: 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
}

export const NJBunnySVG32: React.FC<NJBunnySVG32Props> = ({ 
  className = '',
  variant = 'classic-blue' 
}) => {
  const colors: Record<string, { stroke: string; fill: string }> = {
    'classic-blue': { stroke: '#0000FF', fill: '#0000FF' },
    'attention': { stroke: '#FF69B4', fill: '#FF69B4' },
    'hype-boy': { stroke: '#00CED1', fill: '#00CED1' },
    'cookie': { stroke: '#8B4513', fill: '#D2691E' },
    'ditto': { stroke: '#A9A9A9', fill: '#D3D3D3' },
  };

  const { stroke, fill } = colors[variant];
  const isFilled = variant === 'cookie' || variant === 'ditto';

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
      role="img"
      aria-label="NJ Bunny mascot"
    >
      {/* Left Ear */}
      <path
        d="M10 8 C10 2, 6 2, 6 8 C6 12, 10 14, 12 16"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Ear */}
      <path
        d="M22 8 C22 3, 26 4, 25 9 C24.5 12, 22 14, 20 16"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Head */}
      <ellipse
        cx="16"
        cy="18"
        rx="7"
        ry="6"
        fill={isFilled ? fill : 'none'}
        stroke={stroke}
        strokeWidth="1"
      />

      {/* Left Eye */}
      <circle
        cx="13"
        cy="17"
        r="1.8"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
      />
      <circle cx="13.5" cy="16.5" r="0.4" fill={fill} />

      {/* Right Eye */}
      <circle
        cx="19"
        cy="17"
        r="1.8"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
      />
      <circle cx="19.5" cy="16.5" r="0.4" fill={fill} />

      {/* Nose */}
      <ellipse cx="16" cy="20" rx="0.8" ry="0.5" fill={fill} />

      {/* Mouth */}
      <path
        d="M14 21 Q16 22.5, 18 21"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Body */}
      <path
        d="M12 23 Q10 26, 10 28 Q16 29, 22 28 Q22 26, 20 23"
        fill={isFilled ? fill : 'none'}
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tail */}
      <circle
        cx="24"
        cy="26"
        r="2"
        fill={isFilled ? fill : 'none'}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  );
};

export default NJBunnySVG32;
