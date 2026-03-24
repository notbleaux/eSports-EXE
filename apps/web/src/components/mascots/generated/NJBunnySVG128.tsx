/**
 * NJ Bunny SVG 128x128px Component
 * [Ver001.000]
 */

import React from 'react';

interface NJBunnySVG128Props {
  className?: string;
  variant?: 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
}

export const NJBunnySVG128: React.FC<NJBunnySVG128Props> = ({ 
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
      width="128"
      height="128"
      viewBox="0 0 128 128"
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
      role="img"
      aria-label="NJ Bunny mascot"
    >
      <defs>
        <filter id="bunny-glow-128" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter={variant === 'classic-blue' ? 'url(#bunny-glow-128)' : undefined}>
        {/* Left Ear */}
        <path
          d="M40 32 C40 8, 24 8, 24 32 C24 48, 40 56, 48 64"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Ear */}
        <path
          d="M88 32 C88 12, 104 16, 100 36 C98 48, 88 56, 80 64"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Head */}
        <ellipse
          cx="64"
          cy="72"
          rx="28"
          ry="24"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="2"
        />

        {/* Left Eye */}
        <circle
          cx="52"
          cy="68"
          r="7.2"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <circle cx="54" cy="66" r="1.6" fill={fill} />

        {/* Right Eye */}
        <circle
          cx="76"
          cy="68"
          r="7.2"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
        <circle cx="78" cy="66" r="1.6" fill={fill} />

        {/* Nose */}
        <ellipse cx="64" cy="80" rx="3.2" ry="2" fill={fill} />

        {/* Mouth */}
        <path
          d="M58 84 Q64 90, 70 84"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Body */}
        <path
          d="M48 92 Q40 104, 40 112 Q64 116, 88 112 Q88 104, 80 92"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tail */}
        <circle
          cx="96"
          cy="104"
          r="8"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="2"
        />

        {/* Tail fluff details */}
        <path
          d="M90 100 L92 104 L88 108 M96 96 L96 102 L100 100 M102 104 L98 106 L102 110"
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default NJBunnySVG128;
