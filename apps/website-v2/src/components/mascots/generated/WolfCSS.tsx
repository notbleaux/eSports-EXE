import React from 'react';

interface WolfCSSProps {
  className?: string;
  animate?: boolean;
}

/**
 * Wolf Mascot - CSS-Only Component
 * Zero dependencies, pure CSS pixel art
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const WolfCSS: React.FC<WolfCSSProps> = ({ 
  className = '',
  animate = false 
}) => {
  return (
    <div 
      className={`wolf-mascot-wrapper ${className}`}
      style={{ 
        width: 64, 
        height: 64,
        display: 'inline-block'
      }}
    >
      <div className={`wolf-mascot ${animate ? 'animate' : ''}`} />
    </div>
  );
};

export default WolfCSS;
