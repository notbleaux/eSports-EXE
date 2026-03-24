import React from 'react';

interface WolfMascotSVGProps {
  size?: 32 | 64 | 128 | 256;
  className?: string;
  animate?: boolean;
}

/**
 * Wolf Mascot SVG Component
 * Strong, loyal, protective
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const WolfMascotSVG: React.FC<WolfMascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  const basePath = '/mascots/svg';
  const src = `${basePath}/wolf-${size}x${size}.svg`;

  return (
    <img 
      src={src}
      alt="Wolf Mascot"
      width={size}
      height={size}
      className={`mascot-wolf ${className} ${animate ? 'animate' : ''}`}
      style={{ 
        imageRendering: 'pixelated',
        display: 'inline-block'
      }}
    />
  );
};

/**
 * Wolf Mascot SVG as inline component (no HTTP request)
 */
export const WolfMascotSVGInline: React.FC<WolfMascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  // Inline SVG content for 64x64 (most common size)
  const svg64 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges" style="image-rendering: pixelated"><title>Wolf Mascot</title><desc>Strong, loyal, protective</desc><g id="mascot-wolf"><rect x="12" y="4" width="4" height="4" fill="#334155"/><rect x="16" y="4" width="4" height="4" fill="#334155"/><rect x="12" y="8" width="4" height="4" fill="#475569"/><rect x="16" y="8" width="4" height="4" fill="#475569"/><rect x="20" y="8" width="4" height="4" fill="#475569"/><rect x="40" y="4" width="4" height="4" fill="#334155"/><rect x="44" y="4" width="4" height="4" fill="#334155"/><rect x="40" y="8" width="4" height="4" fill="#475569"/><rect x="44" y="8" width="4" height="4" fill="#475569"/><rect x="48" y="8" width="4" height="4" fill="#475569"/><rect x="8" y="12" width="4" height="4" fill="#334155"/><rect x="12" y="12" width="4" height="4" fill="#475569"/><rect x="16" y="12" width="4" height="4" fill="#64748b"/><rect x="20" y="12" width="4" height="4" fill="#475569"/><rect x="24" y="12" width="4" height="4" fill="#334155"/><rect x="36" y="12" width="4" height="4" fill="#334155"/><rect x="40" y="12" width="4" height="4" fill="#475569"/><rect x="44" y="12" width="4" height="4" fill="#64748b"/><rect x="48" y="12" width="4" height="4" fill="#475569"/><rect x="52" y="12" width="4" height="4" fill="#334155"/><rect x="4" y="16" width="56" height="4" fill="#334155"/><rect x="4" y="20" width="4" height="24" fill="#334155"/><rect x="8" y="20" width="8" height="24" fill="#64748b"/><rect x="16" y="20" width="32" height="24" fill="#475569"/><rect x="48" y="20" width="8" height="24" fill="#64748b"/><rect x="56" y="20" width="4" height="24" fill="#334155"/><rect x="4" y="44" width="56" height="4" fill="#334155"/><rect x="12" y="24" width="8" height="8" fill="#10b981"/><rect x="36" y="24" width="8" height="8" fill="#10b981"/><rect x="14" y="26" width="4" height="4" fill="#064e3b"/><rect x="38" y="26" width="4" height="4" fill="#064e3b"/><rect x="28" y="32" width="8" height="4" fill="#1e293b"/><rect x="24" y="36" width="16" height="4" fill="#94a3b8"/><rect x="20" y="40" width="24" height="4" fill="#64748b"/></g></svg>`;

  const basePath = '/mascots/svg';

  // Inline SVG for 128x128
  const svg128 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" shape-rendering="crispEdges" style="image-rendering: pixelated"><title>Wolf Mascot</title><desc>Strong, loyal, protective</desc><g id="mascot-wolf"><rect x="24" y="8" width="8" height="8" fill="#334155"/><rect x="32" y="8" width="8" height="8" fill="#334155"/><rect x="24" y="16" width="8" height="8" fill="#475569"/><rect x="32" y="16" width="8" height="8" fill="#475569"/><rect x="40" y="16" width="8" height="8" fill="#475569"/><rect x="80" y="8" width="8" height="8" fill="#334155"/><rect x="88" y="8" width="8" height="8" fill="#334155"/><rect x="80" y="16" width="8" height="8" fill="#475569"/><rect x="88" y="16" width="8" height="8" fill="#475569"/><rect x="96" y="16" width="8" height="8" fill="#475569"/><rect x="16" y="24" width="8" height="8" fill="#334155"/><rect x="24" y="24" width="8" height="8" fill="#475569"/><rect x="32" y="24" width="8" height="8" fill="#64748b"/><rect x="40" y="24" width="8" height="8" fill="#475569"/><rect x="48" y="24" width="8" height="8" fill="#334155"/><rect x="72" y="24" width="8" height="8" fill="#334155"/><rect x="80" y="24" width="8" height="8" fill="#475569"/><rect x="88" y="24" width="8" height="8" fill="#64748b"/><rect x="96" y="24" width="8" height="8" fill="#475569"/><rect x="104" y="24" width="8" height="8" fill="#334155"/><rect x="8" y="32" width="112" height="8" fill="#334155"/><rect x="8" y="40" width="8" height="48" fill="#334155"/><rect x="16" y="40" width="16" height="48" fill="#64748b"/><rect x="32" y="40" width="64" height="48" fill="#475569"/><rect x="96" y="40" width="16" height="48" fill="#64748b"/><rect x="112" y="40" width="8" height="48" fill="#334155"/><rect x="8" y="88" width="112" height="8" fill="#334155"/><rect x="24" y="48" width="16" height="16" fill="#10b981"/><rect x="72" y="48" width="16" height="16" fill="#10b981"/><rect x="28" y="52" width="8" height="8" fill="#064e3b"/><rect x="76" y="52" width="8" height="8" fill="#064e3b"/><rect x="56" y="64" width="16" height="8" fill="#1e293b"/><rect x="48" y="72" width="32" height="8" fill="#94a3b8"/><rect x="40" y="80" width="48" height="8" fill="#64748b"/></g></svg>`;

  // For 256, use img tag (too large for inline)
  if (size > 128) {
    return (
      <img 
        src={`${basePath}/wolf-${size}x${size}.svg`}
        alt="Wolf Mascot"
        width={size}
        height={size}
        className={`mascot-wolf ${className} ${animate ? 'animate' : ''}`}
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
      className={`mascot-wolf ${className} ${animate ? 'animate' : ''}`}
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

export default WolfMascotSVG;
