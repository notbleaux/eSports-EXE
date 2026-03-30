/** [Ver001.000]
 * SpatialAudio Component
 * ======================
 * React component for attaching 3D spatial audio to objects.
 * 
 * Features:
 * - Attach audio to 3D objects (mascots, entities)
 * - Automatic position synchronization
 * - Visual audio indicators
 * - Distance visualization
 * - R3F integration
 * 
 * Usage:
 * ```tsx
 * <SpatialAudio
 *   audioUrl="/audio/mascot_voice.mp3"
 *   position={[5, 0, 0]}
 *   autoPlay
 *   loop
 *   showIndicator
 *   showDistanceRings
 * >
 *   <Mascot3D mascotId="sol" />
 * </SpatialAudio>
 * ```
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AudioSourceId, Vector3, AudioSourceType } from '@/lib/audio/spatial';
import { useSpatialAudio } from '@/hooks/useSpatialAudio';

// ============================================================================
// Types
// ============================================================================

export interface SpatialAudioProps {
  /** Audio source URL */
  audioUrl?: string;
  /** Pre-loaded audio buffer */
  audioBuffer?: AudioBuffer;
  /** Audio source type */
  type?: AudioSourceType;
  /** 3D position (or use child object position) */
  position?: [number, number, number];
  /** Auto-play on mount */
  autoPlay?: boolean;
  /** Loop playback */
  loop?: boolean;
  /** Volume (0-1) */
  volume?: number;
  /** Pitch multiplier */
  pitch?: number;
  /** Maximum audible distance */
  maxDistance?: number;
  /** Reference distance for attenuation */
  refDistance?: number;
  /** Rolloff factor for attenuation */
  rolloffFactor?: number;
  /** Cone inner angle for directional audio */
  coneInnerAngle?: number;
  /** Cone outer angle for directional audio */
  coneOuterAngle?: number;
  /** Cone outer gain for directional audio */
  coneOuterGain?: number;
  /** Show visual audio indicator */
  showIndicator?: boolean;
  /** Show distance visualization rings */
  showDistanceRings?: boolean;
  /** Show cone visualization for directional audio */
  showCone?: boolean;
  /** Number of distance rings */
  ringCount?: number;
  /** Ring colors */
  ringColors?: string[];
  /** Indicator color */
  indicatorColor?: string;
  /** Indicator size */
  indicatorSize?: number;
  /** Update rate for position sync (ms) */
  updateRate?: number;
  /** Enable smooth position interpolation */
  smoothPosition?: boolean;
  /** Smoothing factor (0-1) */
  smoothingFactor?: number;
  /** Callback when audio starts playing */
  onPlay?: () => void;
  /** Callback when audio stops */
  onStop?: () => void;
  /** Callback when source is created */
  onSourceCreate?: (sourceId: AudioSourceId) => void;
  /** Children (3D objects) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export interface SpatialAudioRef {
  /** Play the audio */
  play: () => Promise<boolean>;
  /** Pause the audio */
  pause: () => void;
  /** Stop the audio */
  stop: () => void;
  /** Set volume */
  setVolume: (volume: number) => void;
  /** Set position */
  setPosition: (position: [number, number, number]) => void;
  /** Get current source ID */
  sourceId: AudioSourceId | null;
  /** Check if currently playing */
  isPlaying: boolean;
}

// ============================================================================
// Visual Components
// ============================================================================

interface AudioIndicatorProps {
  isPlaying: boolean;
  volume: number;
  color: string;
  size: number;
  position: [number, number, number];
}

const AudioIndicator: React.FC<AudioIndicatorProps> = ({
  isPlaying,
  volume,
  color,
  size,
  position,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pulseScale, setPulseScale] = useState(1);

  useFrame((_, delta) => {
    if (!meshRef.current || !isPlaying) return;

    // Pulse animation based on volume
    const targetScale = 1 + volume * 0.5 + Math.sin(Date.now() * 0.01) * 0.1;
    setPulseScale(prev => prev + (targetScale - prev) * delta * 5);
    meshRef.current.scale.setScalar(pulseScale);
  });

  return (
    <mesh ref={meshRef} position={[position[0], position[1] + 1.5, position[2]]}>
      <sphereGeometry args={[size * 0.1, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={isPlaying ? 0.8 : 0.3}
      />
    </mesh>
  );
};

interface DistanceRingsProps {
  position: [number, number, number];
  refDistance: number;
  maxDistance: number;
  ringCount: number;
  colors: string[];
  isPlaying: boolean;
}

const DistanceRings: React.FC<DistanceRingsProps> = ({
  position,
  refDistance,
  maxDistance,
  ringCount,
  colors,
  isPlaying,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const rings = useMemo(() => {
    const result: Array<{ radius: number; color: string; opacity: number }> = [];
    const step = (maxDistance - refDistance) / ringCount;

    for (let i = 0; i < ringCount; i++) {
      const radius = refDistance + step * i;
      const color = colors[i % colors.length];
      const opacity = 1 - i / ringCount;
      result.push({ radius, color, opacity });
    }

    return result;
  }, [refDistance, maxDistance, ringCount, colors]);

  useFrame(() => {
    if (!groupRef.current) return;
    
    // Fade rings based on playing state
    groupRef.current.visible = isPlaying;
  });

  return (
    <group ref={groupRef} position={position}>
      {rings.map((ring, index) => (
        <mesh
          key={index}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
        >
          <ringGeometry args={[ring.radius - 0.05, ring.radius + 0.05, 64]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity * 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

interface DirectionalConeProps {
  position: [number, number, number];
  innerAngle: number;
  outerAngle: number;
  color: string;
}

const DirectionalCone: React.FC<DirectionalConeProps> = ({
  position,
  innerAngle,
  outerAngle,
  color,
}) => {
  const innerRad = (innerAngle * Math.PI) / 180;
  const outerRad = (outerAngle * Math.PI) / 180;
  const length = 5;

  return (
    <group position={position} rotation={[0, 0, 0]}>
      {/* Inner cone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, length / 2]}>
        <coneGeometry
          args={[Math.tan(innerRad / 2) * length, length, 32, 1, true]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer cone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, length / 2]}>
        <coneGeometry
          args={[Math.tan(outerRad / 2) * length, length, 32, 1, true]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const SpatialAudio = React.forwardRef<SpatialAudioRef, SpatialAudioProps>(
  ({
    audioUrl,
    audioBuffer,
    type = 'effect',
    position: initialPosition = [0, 0, 0],
    autoPlay = false,
    loop = false,
    volume = 1,
    pitch = 1,
    maxDistance = 100,
    refDistance = 1,
    rolloffFactor = 1,
    coneInnerAngle = 360,
    coneOuterAngle = 360,
    coneOuterGain = 0,
    showIndicator = false,
    showDistanceRings = false,
    showCone = false,
    ringCount = 3,
    ringColors = ['#22d3ee', '#3b82f6', '#6366f1'],
    indicatorColor = '#22d3ee',
    indicatorSize = 1,
    updateRate = 16,
    smoothPosition = true,
    smoothingFactor = 0.3,
    onPlay,
    onStop,
    onSourceCreate,
    children,
  }, ref) => {
    // Spatial audio hook
    const spatial = useSpatialAudio();
    
    // Refs
    const sourceIdRef = useRef<AudioSourceId | null>(null);
    const groupRef = useRef<THREE.Group>(null);
    const lastUpdateRef = useRef(0);
    const bufferRef = useRef<AudioBuffer | null>(audioBuffer || null);
    
    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<Vector3>({
      x: initialPosition[0],
      y: initialPosition[1],
      z: initialPosition[2],
    });

    // Create source on mount
    useEffect(() => {
      if (!spatial.isInitialized) return;

      const sourceId = spatial.createSource({
        type,
        position: currentPosition,
        audioUrl,
        buffer: bufferRef.current ?? undefined,
        volume,
        pitch,
        loop,
        maxDistance,
        refDistance,
        rolloffFactor,
        coneInnerAngle,
        coneOuterAngle,
        coneOuterGain,
      });

      sourceIdRef.current = sourceId;
      onSourceCreate?.(sourceId);

      // Auto-play if requested
      if (autoPlay) {
        handlePlay();
      }

      return () => {
        if (sourceIdRef.current) {
          spatial.destroySource(sourceIdRef.current);
          sourceIdRef.current = null;
        }
      };
    }, [spatial.isInitialized]);

    // Update source when props change
    useEffect(() => {
      if (!sourceIdRef.current) return;

      const source = spatial.getSource(sourceIdRef.current);
      if (source) {
        source.volume = volume;
        source.pitch = pitch;
        source.loop = loop;
        source.maxDistance = maxDistance;
        source.refDistance = refDistance;
        source.rolloffFactor = rolloffFactor;
        source.coneInnerAngle = coneInnerAngle;
        source.coneOuterAngle = coneOuterAngle;
        source.coneOuterGain = coneOuterGain;
      }
    }, [
      volume,
      pitch,
      loop,
      maxDistance,
      refDistance,
      rolloffFactor,
      coneInnerAngle,
      coneOuterAngle,
      coneOuterGain,
    ]);

    // Load audio buffer if URL provided
    useEffect(() => {
      if (!audioUrl || bufferRef.current) return;

      fetch(audioUrl)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
          const audioContext = spatial.engine?.['audioContext'];
          if (audioContext) {
            return audioContext.decodeAudioData(arrayBuffer);
          }
          return null;
        })
        .then(buffer => {
          if (buffer) {
            bufferRef.current = buffer;
          }
        })
        .catch(console.error);
    }, [audioUrl]);

    // Position synchronization
    useFrame((frameState) => {
      if (!groupRef.current || !sourceIdRef.current) return;

      const now = frameState.clock.elapsedTime * 1000;
      if (now - lastUpdateRef.current < updateRate) return;
      lastUpdateRef.current = now;

      // Get world position
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);

      const newPosition = {
        x: worldPosition.x,
        y: worldPosition.y,
        z: worldPosition.z,
      };

      if (smoothPosition) {
        spatial.setPositionSmooth(sourceIdRef.current, newPosition, smoothingFactor);
      } else {
        spatial.setPosition(sourceIdRef.current, newPosition);
      }

      setCurrentPosition(newPosition);
    });

    // Control methods
    const handlePlay = useCallback(async (): Promise<boolean> => {
      if (!sourceIdRef.current) return false;

      const success = await spatial.play(sourceIdRef.current, bufferRef.current ?? undefined);
      if (success) {
        setIsPlaying(true);
        onPlay?.();
      }
      return success;
    }, [spatial, onPlay]);

    const handlePause = useCallback((): void => {
      if (!sourceIdRef.current) return;

      spatial.pause(sourceIdRef.current);
      setIsPlaying(false);
    }, [spatial]);

    const handleStop = useCallback((): void => {
      if (!sourceIdRef.current) return;

      spatial.stop(sourceIdRef.current);
      setIsPlaying(false);
      onStop?.();
    }, [spatial, onStop]);

    const handleSetVolume = useCallback(
      (newVolume: number): void => {
        if (!sourceIdRef.current) return;
        spatial.setVolume(sourceIdRef.current, newVolume);
      },
      [spatial]
    );

    const handleSetPosition = useCallback(
      (pos: [number, number, number]): void => {
        if (!sourceIdRef.current) return;
        
        const newPos = { x: pos[0], y: pos[1], z: pos[2] };
        spatial.setPosition(sourceIdRef.current, newPos);
        setCurrentPosition(newPos);
        
        if (groupRef.current) {
          groupRef.current.position.set(pos[0], pos[1], pos[2]);
        }
      },
      [spatial]
    );

    // Expose imperative API
    React.useImperativeHandle(
      ref,
      () => ({
        play: handlePlay,
        pause: handlePause,
        stop: handleStop,
        setVolume: handleSetVolume,
        setPosition: handleSetPosition,
        sourceId: sourceIdRef.current,
        isPlaying,
      }),
      [handlePlay, handlePause, handleStop, handleSetVolume, handleSetPosition, isPlaying]
    );

    return (
      <group ref={groupRef} position={initialPosition}>
        {children}

        {/* Visual indicators */}
        {showIndicator && (
          <AudioIndicator
            isPlaying={isPlaying}
            volume={volume}
            color={indicatorColor}
            size={indicatorSize}
            position={initialPosition}
          />
        )}

        {showDistanceRings && (
          <DistanceRings
            position={initialPosition}
            refDistance={refDistance}
            maxDistance={maxDistance}
            ringCount={ringCount}
            colors={ringColors}
            isPlaying={isPlaying}
          />
        )}

        {showCone && coneInnerAngle < 360 && (
          <DirectionalCone
            position={initialPosition}
            innerAngle={coneInnerAngle}
            outerAngle={coneOuterAngle}
            color={indicatorColor}
          />
        )}
      </group>
    );
  }
);

SpatialAudio.displayName = 'SpatialAudio';

// ============================================================================
// Specialized Components
// ============================================================================

/**
 * Component for mascot spatial audio
 */
export interface MascotSpatialAudioProps extends Omit<SpatialAudioProps, 'type'> {
  mascotId: string;
}

export const MascotSpatialAudio: React.FC<MascotSpatialAudioProps> = ({
  mascotId,
  ...props
}) => {
  const spatial = useSpatialAudio();
  const sourceIdRef = useRef<AudioSourceId | null>(null);

  useEffect(() => {
    if (!spatial.isInitialized) return;

    // Create source with mascot type
    const sourceId = spatial.createSource({
      type: 'mascot',
      ...props,
    });

    sourceIdRef.current = sourceId;

    // Register with mascot system
    spatial.registerMascot(mascotId, sourceId, {
      x: props.position?.[0] ?? 0,
      y: props.position?.[1] ?? 0,
      z: props.position?.[2] ?? 0,
    });

    return () => {
      spatial.unregisterMascot(mascotId);
      if (sourceIdRef.current) {
        spatial.destroySource(sourceIdRef.current);
      }
    };
  }, [spatial.isInitialized, mascotId]);

  return (
    <SpatialAudio {...props} type="mascot">
      {props.children}
    </SpatialAudio>
  );
};

/**
 * Component for ambient spatial audio
 */
export interface AmbientSpatialAudioProps extends Omit<SpatialAudioProps, 'type' | 'loop'> {
  radius?: number;
}

export const AmbientSpatialAudio: React.FC<AmbientSpatialAudioProps> = ({
  radius = 10,
  ...props
}) => {
  return (
    <SpatialAudio
      {...props}
      type="ambient"
      loop
      maxDistance={radius}
      refDistance={radius * 0.1}
    />
  );
};

/**
 * Component for voice spatial audio
 */
export interface VoiceSpatialAudioProps extends Omit<SpatialAudioProps, 'type'> {
  subtitleText?: string;
}

export const VoiceSpatialAudio: React.FC<VoiceSpatialAudioProps> = ({
  subtitleText,
  ...props
}) => {
  return (
    <SpatialAudio
      {...props}
      type="voice"
      coneInnerAngle={120}
      coneOuterAngle={180}
      coneOuterGain={0.3}
    />
  );
};

// ============================================================================
// Audio Visualization Component
// ============================================================================

export interface SpatialAudioVisualizationProps {
  /** Scale of visualization */
  scale?: number;
  /** Opacity of visualization */
  opacity?: number;
  /** Show source labels */
  showLabels?: boolean;
  /** Custom render function for sources */
  renderSource?: (data: {
    sourceId: AudioSourceId;
    position: Vector3;
    volume: number;
    isPlaying: boolean;
    distance: number;
  }) => React.ReactNode;
}

/**
 * Visualization component for all spatial audio sources
 */
export const SpatialAudioVisualization: React.FC<SpatialAudioVisualizationProps> = ({
  scale = 1,
  opacity = 0.5,
  showLabels = false,
  renderSource,
}) => {
  const spatial = useSpatialAudio();
  const [visualizationData, setVisualizationData] = useState(spatial.visualizationData);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisualizationData(spatial.visualizationData);
    }, 50);

    return () => clearInterval(interval);
  }, [spatial]);

  return (
    <group>
      {visualizationData.map((data) => (
        <React.Fragment key={data.sourceId}>
          {renderSource ? (
            renderSource(data)
          ) : (
            <>
              {/* Source sphere */}
              <mesh
                position={[data.position.x, data.position.y, data.position.z]}
                scale={scale * (0.5 + data.volume * 0.5)}
              >
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial
                  color={data.isPlaying ? '#22d3ee' : '#64748b'}
                  transparent
                  opacity={data.isPlaying ? opacity : opacity * 0.3}
                />
              </mesh>

              {/* Distance line to listener */}
              {data.distance < 50 && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([
                        data.position.x, data.position.y, data.position.z,
                        spatial.listenerPosition.x,
                        spatial.listenerPosition.y,
                        spatial.listenerPosition.z,
                      ])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color="#22d3ee"
                    transparent
                    opacity={0.2 * (1 - data.distance / 50)}
                  />
                </line>
              )}

              {/* Label */}
              {showLabels && data.isPlaying && (
                <mesh position={[data.position.x, data.position.y + 0.5, data.position.z]}>
                  {/* Text would go here with Text component from drei */}
                </mesh>
              )}
            </>
          )}
        </React.Fragment>
      ))}
    </group>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default SpatialAudio;

// Components are already exported above
