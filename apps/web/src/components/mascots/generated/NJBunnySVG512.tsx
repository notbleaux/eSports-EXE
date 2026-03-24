/**
 * NJ Bunny SVG 512x512px Component
 * [Ver001.000]
 */

import React from 'react';

interface NJBunnySVG512Props {
  className?: string;
  variant?: 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
}

export const NJBunnySVG512: React.FC<NJBunnySVG512Props> = ({ 
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
      width="512"
      height="512"
      viewBox="0 0 512 512"
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
      role="img"
      aria-label="NJ Bunny mascot"
    >
      <defs>
        <filter id="bunny-glow-512" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter={variant === 'classic-blue' ? 'url(#bunny-glow-512)' : undefined}>
        {/* Left Ear */}
        <path
          d="M160 128 C160 32, 96 32, 96 128 C96 192, 160 224, 192 256"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Ear */}
        <path
          d="M352 128 C352 48, 416 64, 400 144 C392 192, 352 224, 320 256"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Head */}
        <ellipse
          cx="256"
          cy="288"
          rx="112"
          ry="96"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="5"
        />

        {/* Left Eye */}
        <circle
          cx="208"
          cy="272"
          r="28.8"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
        />
        <circle cx="216" cy="264" r="6.4" fill={fill} />

        {/* Right Eye */}
        <circle
          cx="304"
          cy="272"
          r="28.8"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
        />
        <circle cx="312" cy="264" r="6.4" fill={fill} />

        {/* Nose */}
        <ellipse cx="256" cy="320" rx="12.8" ry="8" fill={fill} />

        {/* Mouth */}
        <path
          d="M232 336 Q256 360, 280 336"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Body */}
        <path
          d="M192 368 Q160 416, 160 448 Q256 464, 352 448 Q352 416, 320 368"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tail */}
        <circle
          cx="384"
          cy="416"
          r="32"
          fill={isFilled ? fill : 'none'}
          stroke={stroke}
          strokeWidth="5"
        />

        {/* Tail fluff details */}
        <path
          d="M360 400 L368 416 L352 432 M384 384 L384 408 L400 400 M408 416 L392 424 L408 440"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default NJBunnySVG512;
