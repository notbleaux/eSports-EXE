/**
 * NJZ Platform v2 - Shared Components Index
 * Central export for all shared components
 * 
 * @version 2.0.0
 */

// Components
export { Navigation } from './components/Navigation.jsx';
export { Footer } from './components/Footer.jsx';
export { HubCard } from './components/HubCard.jsx';
export { Button } from './components/Button.jsx';
export { Input, TextArea } from './components/Input.jsx';

// Hooks
export { 
  useScrollAnimation, 
  useParallax, 
  usePin, 
  useScrollProgress, 
  useStaggerReveal,
  useHorizontalScroll 
} from './hooks/useScrollAnimation.js';

export { 
  useFluidTransition,
  useStaggerChildren,
  useMagneticHover,
  useFluidDrag,
  useAnimatePresence,
  useLayoutTransition,
  fluidSprings,
  fluidEasings,
  createDelayedTransition 
} from './hooks/useFluidTransition.js';

export { 
  useAbyssalGradient,
  useCSSGradient,
  gradientPresets 
} from './hooks/useAbyssalGradient.js';

// JavaScript Utilities
export { 
  fadeIn,
  fadeOut,
  scaleIn,
  slideIn,
  staggerAnimation,
  scrollTriggerAnimation,
  parallax,
  pinElement,
  textReveal,
  magneticHover,
  cleanupAnimations,
  pauseAnimations,
  resumeAnimations 
} from './js/animations.js';

export {
  liquidButton,
  morphingBlob,
  waveDistortion,
  rippleEffect,
  fluidGradient,
  liquidCursorTrail
} from './js/fluid-effects.js';

export {
  pageTransition,
  staggeredReveal,
  morphTransition,
  curtainReveal,
  glitchTransition,
  smoothScrollTo,
  tabTransition,
  expandCollapse,
  sequentialReveal
} from './js/transitions.js';

// VFX Components
export { FluidSmokeEffects } from './vfx/FluidSmokeEffects.jsx';
export { AbyssalGradientShader } from './vfx/AbyssalGradientShader.jsx';
export { ParticleSystems } from './vfx/ParticleSystems.jsx';
