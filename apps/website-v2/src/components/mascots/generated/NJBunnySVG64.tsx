/**
 * NJ Bunny SVG 64x64px Component
 * [Ver001.000]
 */

import React from 'react';

interface NJBunnySVG64Props {
  className?: string;
  variant?: 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
}

export const NJBunnySVG64: React.FC<NJBunnySVG64Props> = ({ 
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
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
      role="img"
      aria-label="NJ Bunny mascot"
    >
      {/* Left Ear */}
      <path
        d="M20 16 C20 4, 12 4, 12 16 C12 24, 20 28, 24 32"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Ear */}
      <path
        d="M44 16 C44 6, 52 8, 50 18 C49 24, 44 28, 40 32"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Head */}
      <ellipse
        cx="32"
        cy="36"
        rx="14"
        ry="12"
        fill={isFilled ? fill : 'none'}
        stroke={stroke}
        strokeWidth="1.5"
      />

      {/* Left Eye */}
      <circle
        cx="26"
        cy="34"
        r="3.6"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="27" cy="33" r="0.8" fill={fill} />

      {/* Right Eye */}
      <circle
        cx="38"
        cy="34"
        r="3.6"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <circle cx="39" cy="33" r="0.8" fill={fill} />

      {/* Nose */}
      <ellipse cx="32" cy="40" rx="1.6" ry="1" fill={fill} />

      {/* Mouth */}
      <path
        d="M29 42 Q32 45, 35 42"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Body */}
      <path
        d="M24 46 Q20 52, 20 56 Q32 58, 44 56 Q44 52, 40 46"
        fill={isFilled ? fill : 'none'}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tail */}
      <circle
        cx="48"
        cy="52"
        r="4"
        fill={isFilled ? fill : 'none'}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default NJBunnySVG64;
