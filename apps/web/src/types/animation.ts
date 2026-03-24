/** [Ver001.000]
 * Animation System Types
 * 
 * Type definitions for the UI/UX Fluid Dynamics system.
 * Provides comprehensive typing for animations, transitions, and effects.
 */

import type { SpringOptions, Transition } from 'framer-motion';

// ============================================================================
// Hub Theme Types
// ============================================================================

export type HubId = 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';

export interface HubTheme {
  base: string;
  glow: string;
  muted: string;
  gradient: string;
}

export interface HubThemes {
  sator: HubTheme;
  rotas: HubTheme;
  arepo: HubTheme;
  opera: HubTheme;
  tenet: HubTheme;
}

// ============================================================================
// Easing Types
// ============================================================================

export type CubicBezier = [number, number, number, number];

export type EasingFunction = (t: number) => number;

export interface EasingPresets {
  fluid: CubicBezier;
  smoke: CubicBezier;
  abyss: CubicBezier;
  spring: CubicBezier;
  viscous: EasingFunction;
}

export type EasingName = keyof Omit<EasingPresets, 'viscous'>;

// ============================================================================
// Animation Configuration Types
// ============================================================================

export interface AnimationDuration {
  micro: number;
  fast: number;
  standard: number;
  slow: number;
  dramatic: number;
}

export interface AnimationConfig {
  duration: number;
  ease: CubicBezier | EasingFunction;
  delay?: number;
}

export interface SpringConfig extends SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

export interface ViscousSpringConfig {
  tension: number;
  friction: number;
  mass: number;
  overshoot: number;
  settleDuration: number;
}

// ============================================================================
// Transition Types
// ============================================================================

export type TransitionVariant = 
  | 'fade'
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'scale'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'rotate'
  | 'flip'
  | 'none';

export interface TransitionConfig {
  variant: TransitionVariant;
  duration?: number;
  delay?: number;
  ease?: CubicBezier | EasingFunction;
  stagger?: number;
}

export interface StaggerConfig {
  delayChildren?: number;
  staggerChildren?: number;
  staggerDirection?: 1 | -1;
}

// ============================================================================
// Scroll Reveal Types
// ============================================================================

export interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export interface ScrollRevealState {
  isVisible: boolean;
  hasRevealed: boolean;
  ref: React.RefObject<HTMLElement | null>;
}

// ============================================================================
// Glass Card Types
// ============================================================================

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: string;
  glowColor?: string;
  hubTheme?: HubId;
  glowIntensity?: 'none' | 'subtle' | 'medium' | 'strong';
  borderGlow?: boolean;
  elevated?: boolean;
  reducedMotion?: boolean;
  onClick?: () => void;
  as?: keyof JSX.IntrinsicElements;
  title?: string;
}

export interface GlassCardStyleConfig {
  backgroundOpacity: number;
  backdropBlur: number;
  borderOpacity: number;
  borderRadius: string;
  glowIntensity: number;
}

// ============================================================================
// Glow Button Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  glowColor?: string;
  hubTheme?: HubId;
  loading?: boolean;
  loadingState?: LoadingState;
  ripple?: boolean;
  reducedMotion?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
  size: number;
}

// ============================================================================
// Fluid Resize Types
// ============================================================================

export interface SizeState {
  width: number;
  height: number;
}

export interface FluidResizeOptions {
  throttleMs?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface FluidResizeState extends SizeState {
  isResizing: boolean;
}

// ============================================================================
// Reduced Motion Types
// ============================================================================

export interface ReducedMotionState {
  prefersReducedMotion: boolean;
  forcedReducedMotion: boolean;
}

export interface AnimationAccessibility {
  enabled: boolean;
  alternative: 'instant' | 'subtle' | 'none';
}

// ============================================================================
// Motion Variants Types (Framer Motion compatible)
// ============================================================================

export interface MotionVariants {
  initial?: object;
  animate?: object;
  exit?: object;
  hover?: object;
  tap?: object;
  focus?: object;
  transition?: Transition;
}

export interface ContainerVariants extends MotionVariants {
  staggerChildren?: number;
  delayChildren?: number;
}

// ============================================================================
// GPU Acceleration Types
// ============================================================================

export type GPUAcceleratedProperty = 
  | 'transform'
  | 'opacity'
  | 'filter'
  | 'clip-path'
  | 'perspective'
  | 'backface-visibility';

export interface GPUAccelerationConfig {
  properties: GPUAcceleratedProperty[];
  willChange: boolean;
  translateZ: boolean;
  backfaceHidden: boolean;
}

// ============================================================================
// Animation Event Types
// ============================================================================

export type AnimationPhase = 'initial' | 'entering' | 'entered' | 'exiting' | 'exited';

export interface AnimationEvent {
  phase: AnimationPhase;
  timestamp: number;
  duration: number;
}

export type AnimationEventHandler = (event: AnimationEvent) => void;
