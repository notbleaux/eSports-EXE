/**
 * Three.js Components Index
 * 
 * [Ver001.000] - React-Three-Fiber mascot components
 * 
 * Exports all 3D components for mascot display and scene management.
 */

// Main Components
export { Mascot3D, type Mascot3DProps, type MascotAnimationState, type Mascot3DRefs } from './Mascot3D';
export { CameraControls, CameraPresetButtons, FocusModeToggle, type CameraControlsProps, type CameraPreset } from './CameraControls';
export { MascotScene, type MascotSceneProps } from './MascotScene';
export { PerformanceMonitor, SimpleFPS, usePerformanceMonitor, type PerformanceMonitorProps, type PerformanceStats } from './PerformanceMonitor';

// Demo Component
export { ShaderDemo, type ShaderDemoProps } from './ShaderDemo';

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

// Default export
export { default } from './MascotScene';
