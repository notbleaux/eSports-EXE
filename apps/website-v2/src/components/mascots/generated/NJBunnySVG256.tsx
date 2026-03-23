/**
 * NJ Bunny SVG 256x256px Component
 * [Ver001.000]
 */

import React from 'react';

interface NJBunnySVG256Props {
  className?: string;
  variant?: 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
}

export const NJBunnySVG256: React.FC<NJBunnySVG256Props> = ({ 
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
      width="256"
      height="256"
      viewBox="0 0 256 256"
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
      role="img"
      aria-label="NJ Bunny mascot"
    >
      <defs>
        <filter id="bunny-glow-256" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter={variant === 'classic-blue' ? 'url(#bunny-glow-256)' : undefined}>
        {/* Left Ear */}
        <path
          d="M80 64 C80 16, 48 16, 48 64 C48 96, 80 112, 96 128"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Ear */}
        <path
          d="M176 64 C176 24, 208 32, 200 72 C196 96, 176 112, 160 128"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Head */}
        <ellipse
          cx="128"
          cy="144"
          rx="56"
          ry="48"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="3"
        />

        {/* Left Eye */}
        <circle
          cx="104"
          cy="136"
          r="14.4"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
        />
        <circle cx="108" cy="132" r="3.2" fill={fill} />

        {/* Right Eye */}
        <circle
          cx="152"
          cy="136"
          r="14.4"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
        />
        <circle cx="156" cy="132" r="3.2" fill={fill} />

        {/* Nose */}
        <ellipse cx="128" cy="160" rx="6.4" ry="4" fill={fill} />

        {/* Mouth */}
        <path
          d="M116 168 Q128 180, 140 168"
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Body */}
        <path
          d="M96 184 Q80 208, 80 224 Q128 232, 176 224 Q176 208, 160 184"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tail */}
        <circle
          cx="192"
          cy="208"
          r="16"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="3"
        />

        {/* Tail fluff details */}
        <path
          d="M180 200 L184 208 L176 216 M192 192 L192 204 L200 200 M204 208 L196 212 L204 220"
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default NJBunnySVG256;
