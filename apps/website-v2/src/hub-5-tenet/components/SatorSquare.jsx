/**
 * SATOR Square 3D Visualization - STUBBED
 * Five concentric rings representing the palindromic SATOR square
 * [Ver001.000]
 * 
 * NOTE: 3D visualization temporarily disabled due to dependency issues.
 * Will be re-enabled in a future update.
 */
import React from 'react';

// SATOR Square data - the 5x5 palindrome
const SATOR_SQUARE = [
  { row: 'SATOR',  color: '#ffd700', name: 'SATOR',  radius: 3.5, speed: 0.3 },
  { row: 'AREPO',  color: '#0066ff', name: 'AREPO',  radius: 2.8, speed: -0.4 },
  { row: 'TENET',  color: '#ffffff', name: 'TENET',  radius: 2.1, speed: 0.5 },
  { row: 'OPERA',  color: '#9d4edd', name: 'OPERA',  radius: 1.4, speed: -0.6 },
  { row: 'ROTAS',  color: '#00d4ff', name: 'ROTAS',  radius: 0.7, speed: 0.7 },
];

/**
 * Stubbed SatorSquare component
 * Displays a CSS-based visualization instead of 3D
 */
export function SatorSquare({ className = '' }) {
  return (
    <div className={`relative w-full h-full min-h-[400px] flex items-center justify-center ${className}`}>
      <div className="relative">
        {SATOR_SQUARE.map((ring, index) => (
          <div
            key={ring.name}
            className="absolute rounded-full border-2 flex items-center justify-center animate-spin"
            style={{
              width: `${(5 - index) * 80}px`,
              height: `${(5 - index) * 80}px`,
              borderColor: ring.color,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animationDuration: `${10 / Math.abs(ring.speed)}s`,
              animationDirection: ring.speed > 0 ? 'normal' : 'reverse',
            }}
          >
            <span 
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: ring.color }}
            >
              {ring.name}
            </span>
          </div>
        ))}
        {/* Center point */}
        <div className="w-4 h-4 bg-white rounded-full absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}

export default SatorSquare;
