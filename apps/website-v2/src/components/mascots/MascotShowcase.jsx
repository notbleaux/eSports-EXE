/**
 * MascotShowcase Component - Clean Mascot Display with Style Toggle
 * Dual-style mascot system: Dropout (full-color) and NJ (minimalist)
 * 
 * [Ver001.000]
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MascotAssetEnhanced } from './MascotAssetEnhanced';

// Mascot data with display names
const mascots = [
  { id: 'fox', name: 'Fox', role: 'Analytics Guide' },
  { id: 'owl', name: 'Owl', role: 'Strategy Expert' },
  { id: 'wolf', name: 'Wolf', role: 'Team Leader' },
  { id: 'hawk', name: 'Hawk', role: 'Scout' },
  { id: 'dropout-bear', name: 'Bear', role: 'Champion' },
  { id: 'nj-bunny', name: 'Bunny', role: 'Rookie' },
  { id: 'cat', name: 'Cat', role: 'Specialist' },
];

// Toggle button component
function StyleToggle({ style, setStyle }) {
  return (
    <div 
      className="flex gap-4 mb-12"
      role="radiogroup"
      aria-label="Select mascot style"
    >
      <button
        onClick={() => setStyle('dropout')}
        className={`
          px-6 py-3 font-semibold uppercase tracking-wider text-sm
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pure-black
          ${style === 'dropout' 
            ? 'bg-pure-black text-white' 
            : 'bg-transparent border-2 border-pure-black text-pure-black hover:bg-pure-black/5'
          }
        `}
        aria-pressed={style === 'dropout'}
        aria-label="Switch to Dropout style - full color mascots"
      >
        Dropout Style
      </button>
      <button
        onClick={() => setStyle('nj')}
        className={`
          px-6 py-3 font-semibold uppercase tracking-wider text-sm
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pure-black
          ${style === 'nj' 
            ? 'bg-pure-black text-white' 
            : 'bg-transparent border-2 border-pure-black text-pure-black hover:bg-pure-black/5'
          }
        `}
        aria-pressed={style === 'nj'}
        aria-label="Switch to NJ style - minimalist mascots"
      >
        NJ Style
      </button>
    </div>
  );
}

// Individual mascot card
function MascotCard({ mascot, style, index }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Map generic mascot IDs to actual component types
  const mascotType = mascot.id === 'dropout-bear' 
    ? 'dropout-bear' 
    : mascot.id === 'nj-bunny' 
    ? 'nj-bunny' 
    : mascot.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="text-center group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mascot Container */}
      <div 
        className={`
          aspect-square bg-off-white flex items-center justify-center
          transition-all duration-500 relative overflow-hidden
          ${isHovered ? 'shadow-pink' : 'shadow-none'}
        `}
        style={{
          boxShadow: isHovered ? '0 8px 32px rgba(255, 105, 180, 0.3)' : 'none'
        }}
      >
        {/* Background decoration on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-br from-boitano-pink/10 to-transparent"
            />
          )}
        </AnimatePresence>

        {/* Mascot Asset */}
        <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-110">
          <MascotAssetEnhanced
            mascot={mascotType}
            size={128}
            animate={isHovered}
            animation="idle"
            alt={`${mascot.name} mascot - ${mascot.role}`}
            showLoading={true}
          />
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-pure-black/0 group-hover:border-pure-black/20 transition-colors duration-300" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-pure-black/0 group-hover:border-pure-black/20 transition-colors duration-300" />
      </div>

      {/* Mascot Info */}
      <div className="mt-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-pure-black">
          {mascot.name}
        </h3>
        <p className="mt-1 text-xs text-text-secondary uppercase tracking-wider">
          {mascot.role}
        </p>
      </div>
    </motion.div>
  );
}

export function MascotShowcase() {
  const [style, setStyle] = useState('dropout');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading mascots...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Style Toggle */}
      <StyleToggle style={style} setStyle={setStyle} />

      {/* Style Description */}
      <motion.p
        key={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-text-secondary mb-8 max-w-lg"
      >
        {style === 'dropout' 
          ? 'Dropout Style: Full-color, detailed mascot illustrations with vibrant gradients and expressive features.'
          : 'NJ Style: Minimalist black and white line art with clean geometric shapes and reduced detail.'
        }
      </motion.p>

      {/* Mascot Grid - Responsive: 2 cols mobile, 4 cols tablet, 7 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 lg:gap-8">
        {mascots.map((mascot, index) => (
          <MascotCard 
            key={mascot.id} 
            mascot={mascot} 
            style={style}
            index={index}
          />
        ))}
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-16 p-6 bg-off-white border border-border-subtle"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h4 className="font-semibold text-pure-black">Interactive Mascots</h4>
            <p className="text-sm text-text-secondary mt-1">
              Hover over mascots to see animations. Click to learn more about each character.
            </p>
          </div>
          <a
            href="/dev/mascots"
            className="inline-flex items-center gap-2 px-4 py-2 border border-pure-black text-sm font-medium uppercase tracking-wider hover:bg-pure-black hover:text-white transition-colors duration-300"
          >
            View Full Gallery
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default MascotShowcase;
