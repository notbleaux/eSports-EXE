/** [Ver001.000]
 * MascotShowcase Component
 * ========================
 * Simplified mascot showcase for the landing page.
 * Displays the dual-style mascot system with Dropout and NJ variants.
 * 
 * Design Elements:
 * - Clean grid layout with sharp corners
 * - Minimal styling matching the Boitano aesthetic
 * - Toggle between mascot styles
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface MascotShowcaseProps {
  className?: string;
}

// ============================================================================
// Mascot Data
// ============================================================================

const MASCOTS = [
  {
    id: 'fox',
    name: 'Fox',
    element: 'Solar',
    dropoutStyle: 'Warm amber tones',
    njStyle: 'Minimalist geometric',
  },
  {
    id: 'owl',
    name: 'Owl',
    element: 'Lunar',
    dropoutStyle: 'Soft silver hues',
    njStyle: 'Clean line art',
  },
  {
    id: 'wolf',
    name: 'Wolf',
    element: 'Binary',
    dropoutStyle: 'Electric cyan accents',
    njStyle: 'Monochrome silhouette',
  },
  {
    id: 'hawk',
    name: 'Hawk',
    element: 'Fire',
    dropoutStyle: 'Bold crimson wings',
    njStyle: 'Angular minimal form',
  },
  {
    id: 'bear',
    name: 'Dropout Bear',
    element: 'Magic',
    dropoutStyle: 'Full-color detailed',
    njStyle: 'Simple outline',
  },
  {
    id: 'bunny',
    name: 'NJ Bunny',
    element: 'Magic',
    dropoutStyle: 'Vibrant gradient',
    njStyle: 'Single color flat',
  },
];

// ============================================================================
// Component
// ============================================================================

export const MascotShowcase: React.FC<MascotShowcaseProps> = ({ className = '' }) => {
  const [style, setStyle] = useState<'dropout' | 'nj'>('dropout');

  return (
    <div className={`${className}`}>
      {/* Style Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-gray-100 p-1">
          <button
            onClick={() => setStyle('dropout')}
            className={`px-6 py-3 text-sm uppercase tracking-widest font-semibold transition-all duration-300
              ${style === 'dropout' 
                ? 'bg-black text-white' 
                : 'text-gray-600 hover:text-black'
              }`}
          >
            Dropout
          </button>
          <button
            onClick={() => setStyle('nj')}
            className={`px-6 py-3 text-sm uppercase tracking-widest font-semibold transition-all duration-300
              ${style === 'nj' 
                ? 'bg-black text-white' 
                : 'text-gray-600 hover:text-black'
              }`}
          >
            NJ
          </button>
        </div>
      </div>

      {/* Mascot Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {MASCOTS.map((mascot, index) => (
          <motion.div
            key={mascot.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group"
          >
            <div className={`
              aspect-square border-2 border-black 
              flex flex-col items-center justify-center p-4
              transition-all duration-300
              group-hover:-translate-y-1 group-hover:shadow-sharp
              ${style === 'dropout' ? 'bg-white' : 'bg-gray-50'}
            `}>
              {/* Placeholder mascot representation */}
              <div className={`
                w-16 h-16 mb-3 
                ${style === 'dropout' 
                  ? 'bg-boitano-pink' 
                  : 'border-2 border-black'
                }
              `}>
                {/* Simple icon representation */}
                <svg 
                  viewBox="0 0 64 64" 
                  className="w-full h-full"
                  fill={style === 'dropout' ? 'none' : 'currentColor'}
                >
                  {mascot.id === 'fox' && (
                    <path 
                      d="M32 8L48 24L40 56H24L16 24L32 8Z" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      fill={style === 'dropout' ? '#FF69B4' : 'black'}
                    />
                  )}
                  {mascot.id === 'owl' && (
                    <>
                      <circle cx="20" cy="28" r="8" stroke="currentColor" strokeWidth="2" />
                      <circle cx="44" cy="28" r="8" stroke="currentColor" strokeWidth="2" />
                      <path d="M32 36L28 48H36L32 36Z" fill="currentColor" />
                    </>
                  )}
                  {mascot.id === 'wolf' && (
                    <path 
                      d="M20 48L16 24L32 16L48 24L44 48H20Z" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      fill={style === 'dropout' ? '#00FFFF' : 'black'}
                    />
                  )}
                  {mascot.id === 'hawk' && (
                    <path 
                      d="M8 32L32 16L56 32L32 48L8 32Z" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      fill={style === 'dropout' ? '#FF4444' : 'black'}
                    />
                  )}
                  {mascot.id === 'bear' && (
                    <>
                      <circle cx="24" cy="20" r="6" fill="currentColor" />
                      <circle cx="40" cy="20" r="6" fill="currentColor" />
                      <rect x="20" y="28" width="24" height="24" rx="4" fill="currentColor" />
                    </>
                  )}
                  {mascot.id === 'bunny' && (
                    <>
                      <ellipse cx="24" cy="16" rx="4" ry="12" fill="currentColor" />
                      <ellipse cx="40" cy="16" rx="4" ry="12" fill="currentColor" />
                      <circle cx="32" cy="40" r="12" fill="currentColor" />
                    </>
                  )}
                </svg>
              </div>
              
              <h3 className="text-lg font-display font-bold uppercase tracking-tight">
                {mascot.name}
              </h3>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">
                {mascot.element}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Style Description */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 max-w-2xl mx-auto">
          {style === 'dropout' 
            ? 'Dropout style features vibrant, full-color designs with rich gradients and detailed artwork. Each mascot has its own personality and visual flair.'
            : 'NJ style embraces minimalism with clean lines, geometric shapes, and monochromatic palettes. A modern, understated aesthetic.'
          }
        </p>
      </div>
    </div>
  );
};

export default MascotShowcase;
