import React from 'react';

interface HawkCSSProps {
  className?: string;
  animate?: boolean;
}

/**
 * Hawk Mascot - CSS-Only Component
 * Zero dependencies, pure CSS pixel art
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const HawkCSS: React.FC<HawkCSSProps> = ({ 
  className = '',
  animate = false 
}) => {
  return (
    <div 
      className={`hawk-mascot-wrapper ${className}`}
      style={{ 
        width: 64, 
        height: 64,
        display: 'inline-block'
      }}
    >
      <div className={`hawk-mascot ${animate ? 'animate' : ''}`} />
    </div>
  );
};

export default HawkCSS;
