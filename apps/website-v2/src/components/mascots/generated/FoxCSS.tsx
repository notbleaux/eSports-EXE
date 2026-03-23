import React from 'react';
import './fox.css';

interface FoxCSSProps {
  className?: string;
  animate?: boolean;
}

/**
 * Fox Mascot - CSS-Only Component
 * Zero dependencies, pure CSS pixel art
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const FoxCSS: React.FC<FoxCSSProps> = ({ 
  className = '',
  animate = false 
}) => {
  return (
    <div 
      className={`fox-mascot-wrapper ${className}`}
      style={{ 
        width: 64, 
        height: 64,
        display: 'inline-block'
      }}
    >
      <div className={`fox-mascot ${animate ? 'animate' : ''}`} />
    </div>
  );
};

export default FoxCSS;
