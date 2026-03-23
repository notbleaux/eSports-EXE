/**
 * Mascot3D Component
 * 
 * [Ver001.000] - React-Three-Fiber mascot display component
 * 
 * Features:
 * - R3F integration for mascot 3D display
 * - LOD (Level of Detail) support with smooth transitions
 * - Mascot-specific shader integration (TL-H2 2-B)
 * - Animation state management
 * - Performance optimized with frustum culling
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MascotLOD, LODManager, MascotLODConfig } from '@/lib/three/lod';
import { 
  getDefaultShaderForMascot, 
  getPresetsForMascot,
  SolarGlowShader,
  LunarGlowShader,
  BinaryCodeShader,
  FireVFXShader,
  MagicSparkleShader,
  type MascotId,
  type BaseShader,
} from '@/lib/three/shaders';
import { useAnimationBridge } from '@/lib/three/animationBridge';

// ============================================
// Types
// ============================================

export interface Mascot3DProps {
  /** Unique mascot identifier */
  mascotId: MascotId;
  /** LOD level override (0 = high, 1 = medium, 2 = low, null = auto) */
  lodLevel?: 0 | 1 | 2 | null;
  /** Animation state for the mascot */
  animationState?: MascotAnimationState;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Rotation in 3D space */
  rotation?: [number, number, number];
  /** Scale of the mascot */
  scale?: number | [number, number, number];
  /** Shader preset name */
  shaderPreset?: string;
  /** Enable auto-rotation */
  autoRotate?: boolean;
  /** Auto-rotation speed */
  autoRotateSpeed?: number;
  /** Callback when mascot is clicked */
  onClick?: (mascotId: MascotId) => void;
  /** Callback when mascot is hovered */
  onHover?: (mascotId: MascotId, isHovered: boolean) => void;
  /** Enable shadow casting */
  castShadow?: boolean;
  /** Enable shadow receiving */
  receiveShadow?: boolean;
  /** Custom geometry (if not using default) */
  geometry?: THREE.BufferGeometry;
  /** Custom material (if not using shader) */
  material?: THREE.Material;
  /** Enable frustum culling */
  enableCulling?: boolean;
  /** Visibility distance for culling */
  cullingDistance?: number;
  /** Additional className for the container */
  className?: string;
}

export interface MascotAnimationState {
  /** Current animation name */
  name: 'idle' | 'walk' | 'run' | 'jump' | 'celebrate' | 'defeat' | 'custom';
  /** Animation progress (0-1) */
  progress?: number;
  /** Animation speed multiplier */
  speed?: number;
  /** Loop the animation */
  loop?: boolean;
  /** Custom animation data */
  customData?: Record<string, unknown>;
}

export interface Mascot3DRefs {
  /** The root group containing the mascot */
  group: THREE.Group;
  /** The LOD manager instance */
  lod: MascotLOD | null;
  /** The shader instance */
  shader: BaseShader | null;
  /** Current mesh being rendered */
  currentMesh: THREE.Mesh | null;
}

// ============================================
// Default Geometries
// ============================================

const DEFAULT_GEOMETRIES: Record<MascotId, () => THREE.BufferGeometry> = {
  sol: () => new THREE.SphereGeometry(1, 64, 64),
  lun: () => new THREE.SphereGeometry(1, 64, 64),
  bin: () => new THREE.BoxGeometry(1.5, 1.5, 1.5, 32, 32, 32),
  fat: () => new THREE.ConeGeometry(0.8, 2, 32, 64),
  uni: () => new THREE.TorusKnotGeometry(0.6, 0.2, 128, 32),
};

// ============================================
// Helper Functions
// ============================================

function createMascotGeometry(mascotId: MascotId, customGeometry?: THREE.BufferGeometry): THREE.BufferGeometry {
  if (customGeometry) return customGeometry;
  return DEFAULT_GEOMETRIES[mascotId]();
}

function createLODConfig(
  mascotId: MascotId, 
  geometry: THREE.BufferGeometry,
  material?: THREE.Material
): MascotLODConfig {
  // Create simplified geometries for LOD levels
  const mediumDetail = geometry.clone();
  const lowDetail = geometry.clone();
  
  // In production, these would be properly decimated meshes
  // For now, we use the same geometry but the LOD system handles visibility
  
  return {
    mascotId,
    highDetail: geometry,
    mediumDetail,
    lowDetail,
    material,
    options: {
      distanceThresholds: [8, 20, 50],
      smoothTransitions: true,
      transitionDuration: 0.3,
      autoUpdate: true,
    },
  };
}

// ============================================
// Animation State Machine
// ============================================

const ANIMATION_CONFIGS: Record<string, { speed: number; amplitude: number }> = {
  idle: { speed: 1, amplitude: 0.1 },
  walk: { speed: 3, amplitude: 0.2 },
  run: { speed: 6, amplitude: 0.4 },
  jump: { speed: 2, amplitude: 1.0 },
  celebrate: { speed: 4, amplitude: 0.5 },
  defeat: { speed: 0.5, amplitude: 0.05 },
  custom: { speed: 1, amplitude: 0.2 },
};

// ============================================
// Main Component
// ============================================

export const Mascot3D = React.forwardRef<Mascot3DRefs, Mascot3DProps>(
  ({
    mascotId,
    lodLevel = null,
    animationState = { name: 'idle' },
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    shaderPreset = 'default',
    autoRotate = false,
    autoRotateSpeed = 1,
    onClick,
    onHover,
    castShadow = true,
    receiveShadow = true,
    geometry: customGeometry,
    material: customMaterial,
    enableCulling = true,
    cullingDistance = 100,
  }, ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const shaderRef = useRef<BaseShader | null>(null);
    const lodRef = useRef<MascotLOD | null>(null);
    const materialRef = useRef<THREE.Material | null>(null);
    const animationTimeRef = useRef(0);
    const isVisibleRef = useRef(true);
    const frustumRef = useRef(new THREE.Frustum());
    
    const { camera, scene } = useThree();
    const animationBridge = useAnimationBridge();
    
    // Create geometry
    const geometry = useMemo(() => 
      createMascotGeometry(mascotId, customGeometry),
      [mascotId, customGeometry]
    );
    
    // Initialize shader
    useEffect(() => {
      if (customMaterial) {
        materialRef.current = customMaterial;
        return;
      }
      
      // Get shader factory for mascot
      const shaderFactory = getDefaultShaderForMascot(mascotId);
      const presets = getPresetsForMascot(mascotId);
      const presetConfig = presets[shaderPreset] || {};
      
      // Create shader instance
      switch (mascotId) {
        case 'sol':
          shaderRef.current = new SolarGlowShader(presetConfig);
          break;
        case 'lun':
          shaderRef.current = new LunarGlowShader(presetConfig);
          break;
        case 'bin':
          shaderRef.current = new BinaryCodeShader(presetConfig);
          break;
        case 'fat':
          shaderRef.current = new FireVFXShader(presetConfig);
          break;
        case 'uni':
          shaderRef.current = new MagicSparkleShader(presetConfig);
          break;
      }
      
      // Compile shader
      if (shaderRef.current) {
        const result = shaderRef.current.compile();
        if (result.success && result.material) {
          materialRef.current = result.material;
        }
      }
      
      return () => {
        shaderRef.current?.dispose();
        shaderRef.current = null;
      };
    }, [mascotId, shaderPreset, customMaterial]);
    
    // Initialize LOD
    useEffect(() => {
      if (lodLevel !== null) {
        // Manual LOD - skip LOD manager
        lodRef.current = null;
        return;
      }
      
      const lodConfig = createLODConfig(mascotId, geometry, materialRef.current || undefined);
      lodRef.current = new MascotLOD(lodConfig);
      
      // Replace children with LOD group
      if (groupRef.current) {
        groupRef.current.clear();
        groupRef.current.add(lodRef.current.getGroup());
      }
      
      return () => {
        lodRef.current?.dispose();
        lodRef.current = null;
      };
    }, [mascotId, geometry, lodLevel]);
    
    // Handle manual LOD level
    useEffect(() => {
      if (lodLevel !== null && lodRef.current) {
        lodRef.current.forceLevel(lodLevel);
      }
    }, [lodLevel]);
    
    // Expose refs
    useEffect(() => {
      if (ref) {
        const refs: Mascot3DRefs = {
          group: groupRef.current!,
          lod: lodRef.current,
          shader: shaderRef.current,
          currentMesh: meshRef.current,
        };
        
        if (typeof ref === 'function') {
          ref(refs);
        } else {
          (ref as React.MutableRefObject<Mascot3DRefs>).current = refs;
        }
      }
    }, [ref]);
    
    // Animation frame update
    useFrame((state, delta) => {
      const time = state.clock.elapsedTime;
      
      // Update shader
      if (shaderRef.current && isVisibleRef.current) {
        shaderRef.current.update(delta);
      }
      
      // Update LOD
      if (lodRef.current && lodLevel === null) {
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);
        lodRef.current.update(cameraPosition, delta);
      }
      
      // Frustum culling
      if (enableCulling && groupRef.current) {
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        );
        frustumRef.current.setFromProjectionMatrix(projScreenMatrix);
        
        const boundingBox = new THREE.Box3().setFromObject(groupRef.current);
        const boundingSphere = new THREE.Sphere();
        boundingBox.getBoundingSphere(boundingSphere);
        
        isVisibleRef.current = frustumRef.current.intersectsSphere(boundingSphere);
        
        // Distance culling
        if (isVisibleRef.current) {
          const distance = groupRef.current.position.distanceTo(camera.position);
          if (distance > cullingDistance) {
            isVisibleRef.current = false;
          }
        }
        
        groupRef.current.visible = isVisibleRef.current;
      }
      
      // Animation state machine
      if (groupRef.current && isVisibleRef.current) {
        const config = ANIMATION_CONFIGS[animationState.name] || ANIMATION_CONFIGS.idle;
        const speed = (animationState.speed ?? 1) * config.speed;
        const amplitude = config.amplitude;
        
        animationTimeRef.current += delta * speed;
        
        // Apply animation based on state
        switch (animationState.name) {
          case 'idle':
            groupRef.current.position.y = position[1] + Math.sin(animationTimeRef.current) * amplitude;
            groupRef.current.rotation.y = rotation[1] + Math.sin(animationTimeRef.current * 0.5) * 0.1;
            break;
            
          case 'walk':
            groupRef.current.position.y = position[1] + Math.abs(Math.sin(animationTimeRef.current * 2)) * amplitude;
            groupRef.current.rotation.z = Math.sin(animationTimeRef.current) * amplitude * 0.5;
            break;
            
          case 'run':
            groupRef.current.position.y = position[1] + Math.abs(Math.sin(animationTimeRef.current * 3)) * amplitude;
            groupRef.current.rotation.x = amplitude * 0.3;
            break;
            
          case 'jump':
            const jumpPhase = (animationTimeRef.current % Math.PI) / Math.PI;
            groupRef.current.position.y = position[1] + Math.sin(jumpPhase * Math.PI) * amplitude;
            break;
            
          case 'celebrate':
            groupRef.current.position.y = position[1] + Math.sin(animationTimeRef.current * 4) * amplitude;
            groupRef.current.rotation.y = rotation[1] + animationTimeRef.current;
            break;
            
          case 'defeat':
            groupRef.current.rotation.x = rotation[0] + Math.PI / 4;
            groupRef.current.position.y = position[1] - 0.5;
            break;
            
          case 'custom':
            if (animationState.customData) {
              // Custom animation logic can be extended here
              groupRef.current.position.y = position[1] + Math.sin(animationTimeRef.current) * amplitude;
            }
            break;
        }
        
        // Auto-rotation
        if (autoRotate) {
          groupRef.current.rotation.y += delta * autoRotateSpeed * 0.5;
        }
        
        // Sync with Framer Motion animation bridge
        const bridgeState = animationBridge.getState();
        if (bridgeState.isAnimating) {
          const blendFactor = bridgeState.progress;
          groupRef.current.position.y = THREE.MathUtils.lerp(
            groupRef.current.position.y,
            position[1] + blendFactor * 0.5,
            0.1
          );
        }
      }
    });
    
    // Event handlers
    const handleClick = useCallback(() => {
      onClick?.(mascotId);
    }, [onClick, mascotId]);
    
    const handlePointerOver = useCallback(() => {
      onHover?.(mascotId, true);
      document.body.style.cursor = 'pointer';
    }, [onHover, mascotId]);
    
    const handlePointerOut = useCallback(() => {
      onHover?.(mascotId, false);
      document.body.style.cursor = 'auto';
    }, [onHover, mascotId]);
    
    // Calculate scale
    const scaleArray = useMemo<[number, number, number]>(() => {
      if (typeof scale === 'number') return [scale, scale, scale];
      return scale;
    }, [scale]);
    
    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scaleArray}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {lodLevel !== null && (
          <mesh
            ref={meshRef}
            geometry={geometry}
            material={materialRef.current || undefined}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        )}
      </group>
    );
  }
);

Mascot3D.displayName = 'Mascot3D';

export default Mascot3D;
