/**
 * ParticleEffect Component
 * 
 * [Ver001.000] - React component for particle VFX
 * 
 * Provides:
 * - React integration for particle system
 * - EffectType-based configuration
 * - Position and duration props
 * - Auto-cleanup on unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';

import { ParticleSystem, ParticleEmitter, QualityLevel } from '../../lib/animation/particles/system';
import { ParticleRenderer } from '../../lib/animation/particles/renderer';
import {
  EffectPresetName,
  getPreset,
  getPresetForMascot,
  createAbilityEffect,
} from '../../lib/animation/particles/presets';

// ============================================
// Types and Interfaces
// ============================================

export type EffectType = 
  | 'fire-burst'      // Fat mascot
  | 'star-sparkle'    // Uni mascot
  | 'digital-rain'    // Bin mascot
  | 'solar-flare'     // Sol mascot
  | 'lunar-mist'      // Lun mascot
  | 'ability-attack'
  | 'ability-defense'
  | 'ability-special'
  | 'ability-ultimate';

export interface ParticleEffectProps {
  /** Type of effect to render */
  effectType: EffectType;
  /** Target mascot ID for ability effects */
  mascotId?: 'fat' | 'uni' | 'bin' | 'sol' | 'lun';
  /** Position in 3D space */
  position?: { x: number; y: number; z: number };
  /** Duration in seconds (0 for continuous) */
  duration?: number;
  /** Effect intensity multiplier */
  intensity?: number;
  /** Auto-start on mount */
  autoStart?: boolean;
  /** Loop the effect */
  loop?: boolean;
  /** Delay before starting in seconds */
  delay?: number;
  /** Callback when effect completes */
  onComplete?: () => void;
  /** Callback when effect starts */
  onStart?: () => void;
  /** Custom particle limit */
  maxParticles?: number;
  /** Quality level override */
  quality?: QualityLevel;
  /** Enable auto-cleanup */
  autoCleanup?: boolean;
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
  /** Render in overlay mode (fixed position) */
  overlay?: boolean;
  /** Canvas dimensions */
  canvasSize?: { width: number; height: number };
}

export interface ParticleEffectState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  particleCount: number;
  currentLOD: QualityLevel;
}

// ============================================
// Effect Type to Preset Mapping
// ============================================

const effectTypeToPreset: Record<string, EffectPresetName> = {
  'fire-burst': 'fireBurst',
  'star-sparkle': 'starSparkle',
  'digital-rain': 'digitalRain',
  'solar-flare': 'solarFlare',
  'lunar-mist': 'lunarMist',
};

// ============================================
// Particle Effect Component
// ============================================

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  effectType,
  mascotId,
  position = { x: 0, y: 0, z: 0 },
  duration = 2,
  intensity = 1,
  autoStart = true,
  loop = false,
  delay = 0,
  onComplete,
  onStart,
  maxParticles,
  quality = 'high' as QualityLevel,
  autoCleanup = true,
  className = '',
  style = {},
  overlay = false,
  canvasSize = { width: 800, height: 600 },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const emitterRef = useRef<ParticleEmitter | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  const [state, setState] = useState<ParticleEffectState>({
    isPlaying: false,
    isPaused: false,
    progress: 0,
    particleCount: 0,
    currentLOD: quality as QualityLevel,
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width, height } = canvasSize;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup (orthographic for 2D-like effects)
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Particle system
    const particleSystem = new ParticleSystem({
      targetFPS: 60,
      enableLOD: true,
      maxParticlesHigh: maxParticles || 2000,
      maxParticlesMedium: maxParticles ? Math.floor(maxParticles * 0.5) : 1000,
      maxParticlesLow: maxParticles ? Math.floor(maxParticles * 0.25) : 500,
    });
    particleSystem.setCamera(camera);
    particleSystemRef.current = particleSystem;

    // Particle renderer
    const particleRenderer = new ParticleRenderer(scene, camera, {
      maxParticles: maxParticles || 2000,
      texture: generateDefaultAtlas(),
      useInstancing: true,
      useVertexColors: true,
      depthSorting: false,
      frustumCulled: true,
      sortParticles: false,
    });
    particleRendererRef.current = particleRenderer;

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      particleRenderer.dispose();
      particleSystem.dispose();
      renderer.dispose();
    };
  }, [canvasSize, maxParticles]);

  // Create emitter based on effect type
  const createEmitter = useCallback(() => {
    if (!particleSystemRef.current) return null;

    const system = particleSystemRef.current;
    let presetName: EffectPresetName | null = null;

    // Determine preset based on effect type
    if (effectType.startsWith('ability-')) {
      // Ability effects need mascotId
      if (!mascotId) {
        console.warn('mascotId is required for ability effects');
        return null;
      }
      const abilityType = effectType.replace('ability-', '') as 'attack' | 'defense' | 'special' | 'ultimate';
      const effect = createAbilityEffect(mascotId, abilityType, new THREE.Vector3(position.x, position.y, position.z));
      presetName = effect.preset;
    } else {
      presetName = effectTypeToPreset[effectType] || null;
    }

    if (!presetName) {
      console.warn(`Unknown effect type: ${effectType}`);
      return null;
    }

    const preset = getPreset(presetName);
    const config = {
      ...preset.config,
      emissionRate: (preset.config.emissionRate || 100) * intensity,
    };

    if (maxParticles) {
      config.maxParticles = maxParticles;
    }

    const emitter = system.createEmitter(
      `effect-${effectType}-${Date.now()}`,
      config,
      new THREE.Vector3(position.x, position.y, position.z)
    );

    return emitter;
  }, [effectType, mascotId, position, intensity, maxParticles]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isActiveRef.current) return;

    const system = particleSystemRef.current;
    const renderer = rendererRef.current;
    const renderer3D = rendererRef.current;
    const emitter = emitterRef.current;

    if (!system || !renderer || !renderer3D || !emitter) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Update particle system
    system.update();

    // Update progress
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

    // Check if effect should end
    if (duration > 0 && elapsed >= duration) {
      if (loop) {
        // Restart
        startTimeRef.current = performance.now();
        emitter.clear();
        // Burst on restart if it's a burst-type effect
        if (effectType !== 'digital-rain' && effectType !== 'lunar-mist') {
          emitter.burst(Math.floor(50 * intensity));
        }
      } else {
        // End effect
        stop();
        onComplete?.();
        return;
      }
    }

    // Update state
    setState(prev => ({
      ...prev,
      progress,
      particleCount: emitter.getActiveParticles().length,
      currentLOD: system.getLOD(),
    }));

    // Render
    renderer3D.clear();
    particleRendererRef.current?.renderSystem(system, quality as QualityLevel);
    renderer3D.render(sceneRef.current!, cameraRef.current!);

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [duration, loop, quality, intensity, onComplete]);

  // Start effect
  const start = useCallback(() => {
    if (isActiveRef.current) return;

    // Create emitter if not exists
    if (!emitterRef.current) {
      emitterRef.current = createEmitter();
    }

    if (!emitterRef.current) {
      console.error('Failed to create particle emitter');
      return;
    }

    // Burst at start if configured
    const preset = effectType.startsWith('ability-') && mascotId
      ? getPresetForMascot(mascotId)
      : getPreset(effectTypeToPreset[effectType] || 'fireBurst');

    if (preset.burstCount) {
      emitterRef.current.burst(Math.floor(preset.burstCount * intensity));
    }

    isActiveRef.current = true;
    startTimeRef.current = performance.now();

    setState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
    }));

    onStart?.();
    animate();
  }, [createEmitter, effectType, mascotId, intensity, animate, onStart]);

  // Stop effect
  const stop = useCallback(() => {
    isActiveRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    if (emitterRef.current) {
      emitterRef.current.enabled = false;
    }

    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      progress: 0,
    }));

    if (autoCleanup) {
      cleanup();
    }
  }, [autoCleanup]);

  // Pause effect
  const pauseEffect = useCallback(() => {
    if (!isActiveRef.current) return;

    isActiveRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);

    if (emitterRef.current) {
      emitterRef.current.paused = true;
    }

    setState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  // Resume effect
  const resumeEffect = useCallback(() => {
    if (!state.isPaused) return;

    isActiveRef.current = true;

    if (emitterRef.current) {
      emitterRef.current.paused = false;
    }

    setState(prev => ({
      ...prev,
      isPaused: false,
    }));

    animate();
  }, [state.isPaused, animate]);

  // Cleanup resources
  const cleanup = useCallback(() => {
    if (emitterRef.current && particleSystemRef.current) {
      const emitterId = `effect-${effectType}-${startTimeRef.current}`;
      particleSystemRef.current.removeEmitter(emitterId);
      emitterRef.current = null;
    }
  }, [effectType]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        start();
      }, delay * 1000);

      return () => {
        clearTimeout(timer);
        stop();
      };
    }
  }, [autoStart, delay, start, stop]);

  // Handle position changes
  useEffect(() => {
    if (emitterRef.current) {
      emitterRef.current.setPosition(new THREE.Vector3(position.x, position.y, position.z));
    }
  }, [position]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      cleanup();
    };
  }, [stop, cleanup]);

  const containerStyle: React.CSSProperties = overlay
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        ...style,
      }
    : {
        position: 'relative',
        width: canvasSize.width,
        height: canvasSize.height,
        ...style,
      };

  return (
    <div
      ref={containerRef}
      className={`particle-effect ${className}`}
      style={containerStyle}
      data-effect-type={effectType}
      data-playing={state.isPlaying}
      data-paused={state.isPaused}
      data-lod={state.currentLOD}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {/* Debug info (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            fontSize: 10,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          Particles: {state.particleCount} | LOD: {state.currentLOD} | Progress: {Math.round(state.progress * 100)}%
        </div>
      )}
    </div>
  );
};

// ============================================
// Hook for programmatic control
// ============================================

export interface UseParticleEffectReturn {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  state: ParticleEffectState;
}

export function useParticleEffect(
  ref: React.RefObject<ParticleEffectRef>
): UseParticleEffectReturn {
  const [state] = useState<ParticleEffectState>({
    isPlaying: false,
    isPaused: false,
    progress: 0,
    particleCount: 0,
    currentLOD: 'high',
  });

  const start = useCallback(() => {
    ref.current?.start();
  }, [ref]);

  const stop = useCallback(() => {
    ref.current?.stop();
  }, [ref]);

  const pause = useCallback(() => {
    ref.current?.pause();
  }, [ref]);

  const resume = useCallback(() => {
    ref.current?.resume();
  }, [ref]);

  return {
    start,
    stop,
    pause,
    resume,
    state,
  };
}

// ============================================
// Imperative Handle Interface
// ============================================

export interface ParticleEffectRef {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getState: () => ParticleEffectState;
}

// ============================================
// Pre-configured Effect Components
// ============================================

export const FireBurstEffect: React.FC<Omit<ParticleEffectProps, 'effectType'>> = (props) => (
  <ParticleEffect {...props} effectType="fire-burst" />
);

export const StarSparkleEffect: React.FC<Omit<ParticleEffectProps, 'effectType'>> = (props) => (
  <ParticleEffect {...props} effectType="star-sparkle" />
);

export const DigitalRainEffect: React.FC<Omit<ParticleEffectProps, 'effectType'>> = (props) => (
  <ParticleEffect {...props} effectType="digital-rain" />
);

export const SolarFlareEffect: React.FC<Omit<ParticleEffectProps, 'effectType'>> = (props) => (
  <ParticleEffect {...props} effectType="solar-flare" />
);

export const LunarMistEffect: React.FC<Omit<ParticleEffectProps, 'effectType'>> = (props) => (
  <ParticleEffect {...props} effectType="lunar-mist" />
);

export default ParticleEffect;
