/** [Ver001.000]
 * Animation Hooks Index
 * 
 * Central export point for all animation-related hooks.
 * Provides fluid dynamics-based animation primitives for the 4NJZ4 TENET Platform.
 */

export { useReducedMotion, useAccessibleDuration, useConditionalAnimation } from './useReducedMotion';
export type { UseReducedMotionReturn } from './useReducedMotion';

export { 
  useViscousSpring, 
  useViscousSpringTransform 
} from './useViscousSpring';
export type { 
  UseViscousSpringOptions, 
  UseViscousSpringReturn,
  TransformConfig 
} from './useViscousSpring';

export { 
  useScrollReveal, 
  useStaggerReveal, 
  useParallax 
} from './useScrollReveal';
export type { 
  StaggerRevealOptions,
  ParallaxOptions 
} from './useScrollReveal';

export { 
  useFluidResize, 
  useResponsive, 
  useAspectRatio 
} from './useFluidResize';
export type { 
  BreakpointConfig,
  AspectRatioReturn 
} from './useFluidResize';

// Mascot Animation Hook (TL-H3-3-A)
export { 
  useMascotAnimation,
  useAnimationStateMatch,
  useAnimationStateMatches,
  useOnAnimationStateEnter,
  useOnAnimationStateExit,
  useAnimationTriggers,
  VICTORY_SEQUENCE,
  ATTACK_SEQUENCE,
  DEFEAT_SEQUENCE,
  COMBO_SEQUENCE,
} from '../useMascotAnimation';
export type { 
  UseMascotAnimationOptions,
  UseMascotAnimationReturn,
  TransitionOptions,
  StateChangeHandler,
  AnimationEventHandler,
} from '../useMascotAnimation';
