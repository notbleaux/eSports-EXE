/**
 * Three.js Components Index
 * 
 * [Ver001.001] - Fixed ShaderDemoProps export
 * React-Three-Fiber mascot components
 * 
 * Exports all 3D components for mascot display and scene management.
 */

// Main Components
export { Mascot3D, type Mascot3DProps, type MascotAnimationState, type Mascot3DRefs } from './Mascot3D';
export { CameraControls, CameraPresetButtons, FocusModeToggle, type CameraControlsProps, type CameraPreset } from './CameraControls';
export { MascotScene, type MascotSceneProps } from './MascotScene';
export { PerformanceMonitor, SimpleFPS, usePerformanceMonitor, type PerformanceMonitorProps, type PerformanceStats } from './PerformanceMonitor';

// Demo Component - ShaderDemoProps is internal, not exported
export { ShaderDemo } from './ShaderDemo';

// Re-export from animation bridge
export {
  createAnimationBridge,
  getGlobalAnimationBridge,
  useAnimationBridge,
  useAnimationState,
  useCoordinatedAnimation,
  lerp,
  lerpVector,
  lerpColor,
  smoothstep,
  EASINGS,
  type AnimationBridgeState,
  type BridgeTransition,
  type SpringConfig,
  type AnimationBridgeOptions,
  type AnimationBridgeListener,
  type AnimationBridgeAPI,
} from '@/lib/three/animationBridge';

// Re-export MascotId from shaders for external use
export type { MascotId } from '@/lib/three/shaders';

// Default export
export { default } from './MascotScene';
