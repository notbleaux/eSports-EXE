import React from 'react';

interface HawkMascotSVGProps {
  size?: 32 | 64 | 128 | 256;
  className?: string;
  animate?: boolean;
}

/**
 * Hawk Mascot SVG Component
 * Fast, precise, visionary
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const HawkMascotSVG: React.FC<HawkMascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  const basePath = '/mascots/svg';
  const src = `${basePath}/hawk-${size}x${size}.svg`;

  return (
    <img 
      src={src}
      alt="Hawk Mascot"
      width={size}
      height={size}
      className={`mascot-hawk ${className} ${animate ? 'animate' : ''}`}
      style={{ 
        imageRendering: 'pixelated',
        display: 'inline-block'
      }}
    />
  );
};

/**
 * Hawk Mascot SVG as inline component (no HTTP request)
 */
export const HawkMascotSVGInline: React.FC<HawkMascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  // Inline SVG content for 64x64 (most common size)
  const svg64 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges" style="image-rendering: pixelated"><title>Hawk Mascot</title><desc>Fast, precise, visionary</desc><g id="mascot-hawk"><rect x="28" y="4" width="8" height="4" fill="#7f1d1d"/><rect x="24" y="8" width="16" height="4" fill="#dc2626"/><rect x="20" y="12" width="24" height="4" fill="#dc2626"/><rect x="16" y="16" width="32" height="4" fill="#dc2626"/><rect x="12" y="20" width="40" height="4" fill="#dc2626"/><rect x="8" y="24" width="48" height="4" fill="#b91c1c"/><rect x="8" y="28" width="48" height="4" fill="#b91c1c"/><rect x="12" y="32" width="40" height="4" fill="#991b1b"/><rect x="16" y="36" width="32" height="4" fill="#7f1d1d"/><rect x="20" y="40" width="24" height="4" fill="#7f1d1d"/><rect x="30" y="16" width="4" height="12" fill="#fbbf24"/><rect x="26" y="20" width="4" height="12" fill="#f59e0b"/><rect x="34" y="20" width="4" height="12" fill="#f59e0b"/><rect x="16" y="24" width="8" height="8" fill="#fbbf24"/><rect x="40" y="24" width="8" height="8" fill="#fbbf24"/><rect x="18" y="26" width="4" height="4" fill="#000000"/><rect x="42" y="26" width="4" height="4" fill="#000000"/></g></svg>`;

  const basePath = '/mascots/svg';

  // Inline SVG for 128x128
  const svg128 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" shape-rendering="crispEdges" style="image-rendering: pixelated"><title>Hawk Mascot</title><desc>Fast, precise, visionary</desc><g id="mascot-hawk"><rect x="56" y="8" width="16" height="8" fill="#7f1d1d"/><rect x="48" y="16" width="32" height="8" fill="#dc2626"/><rect x="40" y="24" width="48" height="8" fill="#dc2626"/><rect x="32" y="32" width="64" height="8" fill="#dc2626"/><rect x="24" y="40" width="80" height="8" fill="#dc2626"/><rect x="16" y="48" width="96" height="8" fill="#b91c1c"/><rect x="16" y="56" width="96" height="8" fill="#b91c1c"/><rect x="24" y="64" width="80" height="8" fill="#991b1b"/><rect x="32" y="72" width="64" height="8" fill="#7f1d1d"/><rect x="40" y="80" width="48" height="8" fill="#7f1d1d"/><rect x="60" y="32" width="8" height="24" fill="#fbbf24"/><rect x="52" y="40" width="8" height="24" fill="#f59e0b"/><rect x="68" y="40" width="8" height="24" fill="#f59e0b"/><rect x="32" y="48" width="16" height="16" fill="#fbbf24"/><rect x="80" y="48" width="16" height="16" fill="#fbbf24"/><rect x="36" y="52" width="8" height="8" fill="#000000"/><rect x="84" y="52" width="8" height="8" fill="#000000"/></g></svg>`;

  // For 256, use img tag (too large for inline)
  if (size > 128) {
    return (
      <img 
        src={`${basePath}/hawk-${size}x${size}.svg`}
        alt="Hawk Mascot"
        width={size}
        height={size}
        className={`mascot-hawk ${className} ${animate ? 'animate' : ''}`}
        style={{ 
          imageRendering: 'pixelated',
          display: 'inline-block'
        }}
      />
    );
  }

  const svgContent = size <= 64 ? svg64 : svg128;

  return (
    <div 
      className={`mascot-hawk ${className} ${animate ? 'animate' : ''}`}
      style={{ 
        width: size, 
        height: size,
        imageRendering: 'pixelated',
        display: 'inline-block'
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default HawkMascotSVG;
