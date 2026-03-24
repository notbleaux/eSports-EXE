/**
 * FluidHubLayout - Wrapper for all HUBs with adaptive features
 * Uses new fluid.js utilities + 4NJZ4 viscous SFX
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';
import {
  useReducedMotion,
  useFluidResize,
  useContainerQuery,
  useScrollReveal,
  useLensingPanel,
} from '../utils/fluid.js';
import { colors } from '../theme/colors.js';
import AnimatedBackground from '../ui/AnimatedBackground'; // Existing

const HUB_THEMES = {
  sator: colors.hub.sator,
  rotas: colors.hub.rotas,
  arepo: colors.hub.arepo,
  opera: colors.hub.opera,
  tenet: colors.hub.tenet,
};

export function FluidHubLayout({ hub = 'tenet', children }) {
  const reducedMotion = useReducedMotion();
  const theme = HUB_THEMES[hub] || HUB_THEMES.tenet;
  const { toggleLayer } = useLensingPanel(0, 5);

  const containerRef = useFluidResize((entries) => {
    // Dynamic layout adjustments based on resize
    console.log('Hub resized', entries[0].contentRect);
  });

  const { ref: scrollRef, animate } = useScrollReveal();

  const containerQueries = useContainerQuery({
    desktop: 1024,
    tablet: 768,
    mobile: 480,
  });

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-void to-abyss relative"
      style={{ '--hub-glow': theme.glow }}
    >
      {/* 4NJZ4 Viscous Background */}
      {!reducedMotion && <AnimatedBackground className="fixed inset-0 z-0 opacity-30" />}

      {/* Lensing Controls - Latin Square Panel */}
      <div className="fixed top-4 right-4 z-50 flex gap-1 p-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
        {[0,1,2,3,4].map((i) => (
          <button
            key={i}
            onClick={() => toggleLayer(i)}
            className="w-3 h-3 rounded-full border-2 transition-all"
            style={{
              borderColor: theme.base,
              backgroundColor: i === 0 ? theme.base : 'transparent',
            }}
          />
        ))}
      </div>

      {/* Adaptive Header */}
      <header className="sticky top-0 z-40 p-4 border-b border-white/10 bg-white/3 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 
            className="font-display text-3xl"
            style={{ color: theme.base }}
          >
            {hub.toUpperCase()} HUB
          </h1>
          <GlowButton variant="ghost" glowColor={theme.base}>
            Lenses ({containerQueries.matches.mobile ? 'Mobile' : 'Desktop'})
          </GlowButton>
        </div>
      </header>

      {/* Main Content - Fluid Grid */}
      <main className="pt-20 pb-12">
        <div ref={scrollRef} className="max-w-7xl mx-auto px-4">
          <motion.div 
            className={cn(
              'space-y-8',
              containerQueries.matches.mobile ? 'space-y-6' : 'space-y-12'
            )}
            animate={animate}
            style={{ opacity: animate, y: -animate }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Adaptive Footer */}
      <footer className="border-t border-white/5 p-6 text-center text-xs" style={{ color: colors.text.muted }}>
        {containerQueries.matches.tablet ? 'Tablet Optimized' : 'Desktop Optimized'} | 
        Reduced Motion: {reducedMotion ? 'ON' : 'OFF'}
      </footer>
    </div>
  );
}

export default FluidHubLayout;

