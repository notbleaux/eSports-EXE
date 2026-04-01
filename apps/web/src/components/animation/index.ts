/**
 * Animation Components
 * 
 * [Ver002.001] - Fixed TypeScript exports for VFXEditorState
 */

// Particle Effect exports
export {
  ParticleEffect,
  FireBurstEffect,
  StarSparkleEffect,
  DigitalRainEffect,
  SolarFlareEffect,
  LunarMistEffect,
  useParticleEffect,
} from './ParticleEffect';

export type {
  ParticleEffectProps,
  ParticleEffectState,
  ParticleEffectRef,
  UseParticleEffectReturn,
  EffectType,
} from './ParticleEffect';

// VFX Editor exports
export { VFXEditor } from './VFXEditor';
export type { VFXEditorState, ExportedConfig } from './VFXEditor';

// Mascot Animation Controller exports
export { MascotAnimationController } from './MascotAnimationController';
export type {
  MascotAnimationControllerProps,
  MascotAnimationControllerRef,
} from './MascotAnimationController';

// Blend Visualizer exports
export { BlendVisualizer, BlendTreePresetSelector } from './BlendVisualizer';
export type { BlendVisualizerProps } from './BlendVisualizer';

// Emote Panel exports
export { EmotePanel } from './EmotePanel';
export type { EmotePanelProps } from './EmotePanel';
