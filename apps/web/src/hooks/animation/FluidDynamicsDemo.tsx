/** [Ver001.000]
 * Fluid Dynamics Animation Demo
 * 
 * Demonstrates all the animation hooks and components in the UI/UX Fluid Dynamics system.
 * This file serves as both documentation and a testing ground for animations.
 * 
 * @example
 * ```tsx
 * import { FluidDynamicsDemo } from '@/hooks/animation/FluidDynamicsDemo';
 * 
 * function App() {
 *   return <FluidDynamicsDemo />;
 * }
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GlassCard, 
  SatorCard, 
  RotasCard, 
  ArepoCard, 
  OperaCard, 
  TenetCard 
} from '@/components/ui/GlassCard';
import { 
  GlowButton, 
  SatorButton, 
  RotasButton, 
  ArepoButton, 
  OperaButton, 
  TenetButton 
} from '@/components/ui/GlowButton';
import { 
  useReducedMotion, 
  useViscousSpring, 
  useScrollReveal, 
  useFluidResize 
} from '@/hooks/animation';
import { easings } from '@/lib/easing';

// ============================================================================
// Demo Sections
// ============================================================================

/**
 * Reduced Motion Demo
 * Shows how useReducedMotion detects and responds to user preferences.
 */
function ReducedMotionDemo(): JSX.Element {
  const { prefersReducedMotion, enabled, alternative } = useReducedMotion();
  
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">useReducedMotion</h2>
      <div className="space-y-2 text-sm">
        <p>Prefers Reduced Motion: {prefersReducedMotion ? 'Yes' : 'No'}</p>
        <p>Animations Enabled: {enabled ? 'Yes' : 'No'}</p>
        <p>Alternative: {alternative}</p>
      </div>
      <motion.div
        className="mt-4 w-20 h-20 rounded-lg bg-blue-500"
        animate={enabled ? { rotate: 360 } : { rotate: 0 }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 2, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
    </GlassCard>
  );
}

/**
 * Viscous Spring Demo
 * Demonstrates the viscous spring physics with interactive controls.
 */
function ViscousSpringDemo(): JSX.Element {
  const [target, setTarget] = useState(0);
  const { value, isAnimating, setTarget: setSpringTarget } = useViscousSpring({
    tension: 300,
    friction: 30,
    overshoot: 0.1,
  });
  
  const handleToggle = (): void => {
    const newTarget = target === 0 ? 1 : 0;
    setTarget(newTarget);
    setSpringTarget(newTarget);
  };
  
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">useViscousSpring</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <GlowButton onClick={handleToggle} size="sm">
            {target === 0 ? 'Expand' : 'Collapse'}
          </GlowButton>
          <span className="text-sm text-white/60">
            {isAnimating ? 'Animating...' : 'Settled'}
          </span>
        </div>
        
        {/* Visual spring representation */}
        <div className="relative h-12 bg-white/5 rounded-lg overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${value * 100}%` }}
          />
        </div>
        
        {/* Spring value display */}
        <div className="text-sm text-white/60">
          Value: {value.toFixed(4)}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Scroll Reveal Demo
 * Shows elements that animate in when scrolled into view.
 */
function ScrollRevealDemo(): JSX.Element {
  const { ref, isVisible, initial, animate } = useScrollReveal({
    threshold: 0.2,
    triggerOnce: true,
    direction: 'up',
    distance: 50,
  });
  
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">useScrollReveal</h2>
      <p className="text-sm text-white/60 mb-4">
        Scroll this card out of view and back to see the reveal animation.
      </p>
      <motion.div
        ref={ref as React.RefObject<HTMLDivElement>}
        initial={initial}
        animate={animate}
        transition={{ duration: 0.6, ease: easings.fluid }}
        className="p-4 bg-white/5 rounded-lg"
      >
        <p>Visible: {isVisible ? 'Yes' : 'No'}</p>
      </motion.div>
    </GlassCard>
  );
}

/**
 * Fluid Resize Demo
 * Shows real-time size tracking with RAF throttling.
 */
function FluidResizeDemo(): JSX.Element {
  const { ref, width, height, isResizing } = useFluidResize({ throttleMs: 16 });
  
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">useFluidResize</h2>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="p-4 bg-white/5 rounded-lg resize overflow-auto"
        style={{ minHeight: '100px', maxHeight: '200px' }}
      >
        <p className="text-sm">Resize this box!</p>
        <div className="mt-2 text-sm text-white/60">
          <p>Width: {Math.round(width)}px</p>
          <p>Height: {Math.round(height)}px</p>
          <p>Resizing: {isResizing ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Component Demos
// ============================================================================

/**
 * GlassCard Variants Demo
 * Shows all hub-themed card variants.
 */
function GlassCardVariantsDemo(): JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">GlassCard Variants</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <h3 className="font-semibold">Default</h3>
          <p className="text-sm text-white/60">Standard glass card</p>
        </GlassCard>
        
        <SatorCard className="p-4" glowIntensity="medium">
          <h3 className="font-semibold text-blue-400">SATOR</h3>
          <p className="text-sm text-white/60">Analytics Hub</p>
        </SatorCard>
        
        <RotasCard className="p-4" glowIntensity="medium">
          <h3 className="font-semibold text-purple-400">ROTAS</h3>
          <p className="text-sm text-white/60">Simulation Hub</p>
        </RotasCard>
        
        <ArepoCard className="p-4" glowIntensity="medium">
          <h3 className="font-semibold text-amber-400">AREPO</h3>
          <p className="text-sm text-white/60">Community Hub</p>
        </ArepoCard>
        
        <OperaCard className="p-4" glowIntensity="medium">
          <h3 className="font-semibold text-cyan-400">OPERA</h3>
          <p className="text-sm text-white/60">Live Events Hub</p>
        </OperaCard>
        
        <TenetCard className="p-4" glowIntensity="medium">
          <h3 className="font-semibold text-white">TENET</h3>
          <p className="text-sm text-white/60">Central Hub</p>
        </TenetCard>
      </div>
    </div>
  );
}

/**
 * GlowButton Variants Demo
 * Shows all button variants and states.
 */
function GlowButtonVariantsDemo(): JSX.Element {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const handleLoadingClick = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">GlowButton Variants</h2>
      
      {/* Size variants */}
      <div className="flex flex-wrap gap-2 items-center">
        <GlowButton size="sm">Small</GlowButton>
        <GlowButton size="md">Medium</GlowButton>
        <GlowButton size="lg">Large</GlowButton>
      </div>
      
      {/* Style variants */}
      <div className="flex flex-wrap gap-2">
        <GlowButton variant="primary">Primary</GlowButton>
        <GlowButton variant="secondary">Secondary</GlowButton>
        <GlowButton variant="ghost">Ghost</GlowButton>
      </div>
      
      {/* Hub variants */}
      <div className="flex flex-wrap gap-2">
        <SatorButton>SATOR</SatorButton>
        <RotasButton>ROTAS</RotasButton>
        <ArepoButton>AREPO</ArepoButton>
        <OperaButton>OPERA</OperaButton>
        <TenetButton>TENET</TenetButton>
      </div>
      
      {/* Loading states */}
      <div className="flex flex-wrap gap-2">
        <GlowButton 
          loading={loadingStates['primary']}
          onClick={() => handleLoadingClick('primary')}
        >
          {loadingStates['primary'] ? 'Loading...' : 'Click to Load'}
        </GlowButton>
        <SatorButton 
          loading={loadingStates['sator']}
          onClick={() => handleLoadingClick('sator')}
        >
          {loadingStates['sator'] ? 'Processing...' : 'SATOR Action'}
        </SatorButton>
      </div>
    </div>
  );
}

// ============================================================================
// Easing Demo
// ============================================================================

/**
 * Easing Functions Demo
 * Visual comparison of all easing functions.
 */
function EasingDemo(): JSX.Element {
  const easingsList = [
    { name: 'Fluid', easing: easings.fluid },
    { name: 'Smoke', easing: easings.smoke },
    { name: 'Abyss', easing: easings.abyss },
    { name: 'Spring', easing: easings.spring },
  ];
  
  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold mb-4">Easing Functions</h2>
      <div className="space-y-4">
        {easingsList.map(({ name, easing }) => (
          <div key={name} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{name}</span>
              <span className="text-white/60">[{easing.join(', ')}]</span>
            </div>
            <motion.div
              className="h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
              initial={{ width: '10%' }}
              animate={{ width: '100%' }}
              transition={{ 
                duration: 1.5, 
                ease: easing as [number, number, number, number],
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Main Demo Component
// ============================================================================

export function FluidDynamicsDemo(): JSX.Element {
  return (
    <div className="min-h-screen bg-[#050508] p-8 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fluid Dynamics Animation System</h1>
        <p className="text-white/60">
          UI/UX animation system for the NJZiteGeisTe Platform
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hooks Demos */}
        <ReducedMotionDemo />
        <ViscousSpringDemo />
        <ScrollRevealDemo />
        <FluidResizeDemo />
        <EasingDemo />
        
        {/* Component Demos */}
        <div className="lg:col-span-2 space-y-8">
          <GlassCardVariantsDemo />
          <GlowButtonVariantsDemo />
        </div>
      </div>
      
      {/* Usage Documentation */}
      <GlassCard className="p-6 mt-8" elevated>
        <h2 className="text-xl font-bold mb-4">Usage Examples</h2>
        <pre className="text-sm text-white/80 overflow-x-auto">
{`// Import hooks
import { 
  useReducedMotion, 
  useViscousSpring, 
  useScrollReveal 
} from '@/hooks/animation';

// Import components
import { GlassCard, GlowButton, SatorCard } from '@/components/ui';

// Import easings
import { easings } from '@/lib/easing';

// Use in components
function MyComponent() {
  const { ref, isVisible, animate } = useScrollReveal();
  
  return (
    <SatorCard>
      <GlowButton hubTheme="sator">
        Action
      </GlowButton>
    </SatorCard>
  );
}`}
        </pre>
      </GlassCard>
    </div>
  );
}

export default FluidDynamicsDemo;
