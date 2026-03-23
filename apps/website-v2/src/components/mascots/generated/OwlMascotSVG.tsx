import React from 'react';

interface OwlMascotSVGProps {
  size?: 32 | 64 | 128 | 256 | 512;
  className?: string;
  animate?: boolean;
}

/**
 * Owl Mascot SVG Component
 * Wise, insightful, strategic
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const OwlMascotSVG: React.FC<OwlMascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  const basePath = '/mascots/svg';
  const src = `${basePath}/owl-${size}x${size}.svg`;

  return (
    <img 
      src={src}
      alt="Owl Mascot"
      width={size}
      height={size}
      className={`mascot-owl ${className} ${animate ? 'animate' : ''}`}
      style={{ 
        imageRendering: 'pixelated',
        display: 'inline-block'
      }}
    />
  );
};

/**
 * Owl Mascot SVG as inline component (no HTTP request)
 */
export const OwlMascotSVGInline: React.FC<OwlMascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  // Inline SVG content for 64x64 (most common size)
  const svg64 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges" style="image-rendering: pixelated"><title>Owl Mascot</title><desc>Wise, insightful, strategic</desc><g id="mascot-owl"><rect x="8" y="4" width="4" height="4" fill="#3730A3"/><rect x="12" y="4" width="4" height="4" fill="#3730A3"/><rect x="8" y="8" width="4" height="4" fill="#6366F1"/><rect x="12" y="8" width="4" height="4" fill="#6366F1"/><rect x="16" y="8" width="4" height="4" fill="#6366F1"/><rect x="48" y="4" width="4" height="4" fill="#3730A3"/><rect x="52" y="4" width="4" height="4" fill="#3730A3"/><rect x="44" y="8" width="4" height="4" fill="#6366F1"/><rect x="48" y="8" width="4" height="4" fill="#6366F1"/><rect x="52" y="8" width="4" height="4" fill="#6366F1"/><rect x="8" y="12" width="48" height="4" fill="#000000"/><rect x="4" y="16" width="4" height="28" fill="#000000"/><rect x="8" y="16" width="8" height="28" fill="#818CF8"/><rect x="16" y="16" width="32" height="28" fill="#6366F1"/><rect x="48" y="16" width="8" height="28" fill="#4F46E5"/><rect x="56" y="16" width="4" height="28" fill="#000000"/><rect x="8" y="44" width="48" height="4" fill="#000000"/><rect x="8" y="20" width="16" height="16" fill="#FFFFFF"/><rect x="40" y="20" width="16" height="16" fill="#FFFFFF"/><rect x="8" y="20" width="4" height="4" fill="#000000"/><rect x="20" y="20" width="4" height="4" fill="#000000"/><rect x="8" y="32" width="4" height="4" fill="#000000"/><rect x="20" y="32" width="4" height="4" fill="#000000"/><rect x="40" y="20" width="4" height="4" fill="#000000"/><rect x="52" y="20" width="4" height="4" fill="#000000"/><rect x="40" y="32" width="4" height="4" fill="#000000"/><rect x="52" y="32" width="4" height="4" fill="#000000"/><rect x="14" y="26" width="4" height="4" fill="#000000"/><rect x="46" y="26" width="4" height="4" fill="#000000"/><rect x="18" y="22" width="4" height="4" fill="#FFFFFF"/><rect x="50" y="22" width="4" height="4" fill="#FFFFFF"/><rect x="28" y="36" width="8" height="4" fill="#F59E0B"/><rect x="28" y="40" width="8" height="4" fill="#D97706"/><rect x="8" y="48" width="48" height="12" fill="#6366F1"/><rect x="4" y="48" width="4" height="12" fill="#000000"/><rect x="56" y="48" width="4" height="12" fill="#000000"/><rect x="8" y="60" width="48" height="4" fill="#000000"/><rect x="24" y="48" width="16" height="8" fill="#818CF8"/><rect x="28" y="52" width="8" height="4" fill="#C7D2FE"/><rect x="4" y="40" width="8" height="16" fill="#4F46E5"/><rect x="52" y="40" width="8" height="16" fill="#4F46E5"/><rect x="12" y="60" width="8" height="4" fill="#F59E0B"/><rect x="44" y="60" width="8" height="4" fill="#F59E0B"/></g></svg>`;

  // Inline SVG for 128x128
  const svg128 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" shape-rendering="crispEdges" style="image-rendering: pixelated"><title>Owl Mascot</title><desc>Wise, insightful, strategic</desc><g id="mascot-owl"><rect x="16" y="8" width="8" height="8" fill="#3730A3"/><rect x="24" y="8" width="8" height="8" fill="#3730A3"/><rect x="16" y="16" width="8" height="8" fill="#6366F1"/><rect x="24" y="16" width="8" height="8" fill="#6366F1"/><rect x="32" y="16" width="8" height="8" fill="#6366F1"/><rect x="96" y="8" width="8" height="8" fill="#3730A3"/><rect x="104" y="8" width="8" height="8" fill="#3730A3"/><rect x="88" y="16" width="8" height="8" fill="#6366F1"/><rect x="96" y="16" width="8" height="8" fill="#6366F1"/><rect x="104" y="16" width="8" height="8" fill="#6366F1"/><rect x="16" y="24" width="96" height="8" fill="#000000"/><rect x="8" y="32" width="8" height="56" fill="#000000"/><rect x="16" y="32" width="16" height="56" fill="#818CF8"/><rect x="32" y="32" width="64" height="56" fill="#6366F1"/><rect x="96" y="32" width="16" height="56" fill="#4F46E5"/><rect x="112" y="32" width="8" height="56" fill="#000000"/><rect x="16" y="88" width="96" height="8" fill="#000000"/><rect x="16" y="40" width="32" height="32" fill="#FFFFFF"/><rect x="80" y="40" width="32" height="32" fill="#FFFFFF"/><rect x="16" y="40" width="8" height="8" fill="#000000"/><rect x="40" y="40" width="8" height="8" fill="#000000"/><rect x="16" y="64" width="8" height="8" fill="#000000"/><rect x="40" y="64" width="8" height="8" fill="#000000"/><rect x="80" y="40" width="8" height="8" fill="#000000"/><rect x="104" y="40" width="8" height="8" fill="#000000"/><rect x="80" y="64" width="8" height="8" fill="#000000"/><rect x="104" y="64" width="8" height="8" fill="#000000"/><rect x="28" y="52" width="8" height="8" fill="#000000"/><rect x="92" y="52" width="8" height="8" fill="#000000"/><rect x="36" y="44" width="8" height="8" fill="#FFFFFF"/><rect x="100" y="44" width="8" height="8" fill="#FFFFFF"/><rect x="56" y="72" width="16" height="8" fill="#F59E0B"/><rect x="56" y="80" width="16" height="8" fill="#D97706"/><rect x="16" y="96" width="96" height="24" fill="#6366F1"/><rect x="8" y="96" width="8" height="24" fill="#000000"/><rect x="112" y="96" width="8" height="24" fill="#000000"/><rect x="16" y="120" width="96" height="8" fill="#000000"/><rect x="48" y="96" width="32" height="16" fill="#818CF8"/><rect x="56" y="104" width="16" height="8" fill="#C7D2FE"/><rect x="8" y="80" width="16" height="32" fill="#4F46E5"/><rect x="104" y="80" width="16" height="32" fill="#4F46E5"/><rect x="24" y="120" width="16" height="8" fill="#F59E0B"/><rect x="88" y="120" width="16" height="8" fill="#F59E0B"/><rect x="12" y="44" width="40" height="4" fill="#312E81"/><rect x="76" y="44" width="40" height="4" fill="#312E81"/><rect x="48" y="48" width="8" height="4" fill="#312E81"/><rect x="12" y="68" width="40" height="4" fill="#312E81"/><rect x="76" y="68" width="40" height="4" fill="#312E81"/></g></svg>`;

  // For 256 and 512, use img tag (too large for inline)
  if (size > 128) {
    return (
      <img 
        src={`${basePath}/owl-${size}x${size}.svg`}
        alt="Owl Mascot"
        width={size}
        height={size}
        className={`mascot-owl ${className} ${animate ? 'animate' : ''}`}
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
      className={`mascot-owl ${className} ${animate ? 'animate' : ''}`}
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

export default OwlMascotSVG;
