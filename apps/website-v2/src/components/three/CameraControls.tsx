/**
 * CameraControls Component
 * 
 * [Ver001.000] - React-Three-Fiber camera controls
 * 
 * Features:
 * - Orbit controls (rotate/zoom/pan)
 * - Focus mode (follow mascot)
 * - Preset views (front/side/top)
 * - Smooth transitions
 * - Touch/mouse support
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { MascotId } from '@/lib/three/shaders';

// ============================================
// Types
// ============================================

export interface CameraControlsProps {
  /** Target position to look at */
  target?: [number, number, number];
  /** Initial camera position */
  initialPosition?: [number, number, number];
  /** Enable orbit controls */
  enableOrbit?: boolean;
  /** Enable zoom */
  enableZoom?: boolean;
  /** Enable pan */
  enablePan?: boolean;
  /** Enable rotate */
  enableRotate?: boolean;
  /** Minimum distance from target */
  minDistance?: number;
  /** Maximum distance from target */
  maxDistance?: number;
  /** Mascot to follow (focus mode) */
  followMascot?: MascotId | null;
  /** Mascot reference for focus mode */
  mascotRef?: React.RefObject<{ group: THREE.Group } | null>;
  /** Smooth follow speed (0-1) */
  followSpeed?: number;
  /** Current preset view */
  presetView?: CameraPreset;
  /** On preset view change callback */
  onPresetChange?: (preset: CameraPreset) => void;
  /** On camera move callback */
  onCameraMove?: (position: THREE.Vector3, target: THREE.Vector3) => void;
  /** Animation duration for transitions */
  transitionDuration?: number;
  /** Field of view */
  fov?: number;
  /** Enable damping */
  enableDamping?: boolean;
  /** Damping factor */
  dampingFactor?: number;
  /** Auto-rotate */
  autoRotate?: boolean;
  /** Auto-rotate speed */
  autoRotateSpeed?: number;
}

export type CameraPreset = 'front' | 'side' | 'top' | 'iso' | 'free';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  preset: CameraPreset;
}

// ============================================
// Preset Configurations
// ============================================

const PRESET_CONFIGS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  front: {
    position: [0, 0, 8],
    target: [0, 0, 0],
  },
  side: {
    position: [8, 0, 0],
    target: [0, 0, 0],
  },
  top: {
    position: [0, 10, 0],
    target: [0, 0, 0],
  },
  iso: {
    position: [5, 5, 5],
    target: [0, 0, 0],
  },
  free: {
    position: [0, 0, 8],
    target: [0, 0, 0],
  },
};

// ============================================
// Main Component
// ============================================

export const CameraControls: React.FC<CameraControlsProps> = ({
  target = [0, 0, 0],
  initialPosition = [0, 0, 8],
  enableOrbit = true,
  enableZoom = true,
  enablePan = true,
  enableRotate = true,
  minDistance = 2,
  maxDistance = 50,
  followMascot = null,
  mascotRef,
  followSpeed = 0.1,
  presetView = 'free',
  onPresetChange,
  onCameraMove,
  transitionDuration = 1.0,
  fov = 50,
  enableDamping = true,
  dampingFactor = 0.05,
  autoRotate = false,
  autoRotateSpeed = 1.0,
}) => {
  const controlsRef = useRef<OrbitControls>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const { camera, gl } = useThree();
  
  // Transition state
  const isTransitioningRef = useRef(false);
  const transitionStartRef = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3() });
  const transitionEndRef = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3() });
  const transitionProgressRef = useRef(0);
  
  // Current state
  const currentTargetRef = useRef(new THREE.Vector3(...target));
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>(presetView);
  
  // Setup camera
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      cameraRef.current = camera;
      camera.fov = fov;
      camera.position.set(...initialPosition);
      camera.updateProjectionMatrix();
    }
  }, [camera, fov, initialPosition]);
  
  // Handle preset view changes
  useEffect(() => {
    if (presetView !== currentPreset && presetView !== 'free') {
      setCurrentPreset(presetView);
      
      const preset = PRESET_CONFIGS[presetView];
      
      // Start transition
      transitionStartRef.current.position.copy(camera.position);
      transitionStartRef.current.target.copy(currentTargetRef.current);
      transitionEndRef.current.position.set(...preset.position);
      transitionEndRef.current.target.set(...preset.target);
      transitionProgressRef.current = 0;
      isTransitioningRef.current = true;
      
      // Disable controls during transition
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    }
  }, [presetView, currentPreset, camera]);
  
  // Smooth interpolation function
  const easeInOutCubic = useCallback((t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }, []);
  
  // Focus on mascot
  const focusOnMascot = useCallback(() => {
    if (!mascotRef?.current?.group) return;
    
    const mascotPosition = new THREE.Vector3();
    mascotRef.current.group.getWorldPosition(mascotPosition);
    
    currentTargetRef.current.lerp(mascotPosition, followSpeed);
    
    if (controlsRef.current) {
      controlsRef.current.target.lerp(mascotPosition, followSpeed);
    }
  }, [mascotRef, followSpeed]);
  
  // Animation frame
  useFrame((state, delta) => {
    // Handle preset transition
    if (isTransitioningRef.current) {
      transitionProgressRef.current += delta / transitionDuration;
      
      if (transitionProgressRef.current >= 1) {
        transitionProgressRef.current = 1;
        isTransitioningRef.current = false;
        
        // Re-enable controls
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
      
      const eased = easeInOutCubic(transitionProgressRef.current);
      
      camera.position.lerpVectors(
        transitionStartRef.current.position,
        transitionEndRef.current.position,
        eased
      );
      
      currentTargetRef.current.lerpVectors(
        transitionStartRef.current.target,
        transitionEndRef.current.target,
        eased
      );
      
      if (controlsRef.current) {
        controlsRef.current.target.copy(currentTargetRef.current);
      }
      
      camera.lookAt(currentTargetRef.current);
    }
    
    // Handle follow mode
    if (followMascot && mascotRef?.current && !isTransitioningRef.current) {
      focusOnMascot();
    }
    
    // Update controls
    if (controlsRef.current && !isTransitioningRef.current) {
      controlsRef.current.update();
      
      // Sync current target with controls
      currentTargetRef.current.copy(controlsRef.current.target);
    }
    
    // Callback on camera move
    if (onCameraMove && !isTransitioningRef.current) {
      onCameraMove(camera.position.clone(), currentTargetRef.current.clone());
    }
  });
  
  // Handle controls change (detect when user manually moves camera)
  const handleControlsChange = useCallback(() => {
    if (currentPreset !== 'free' && !isTransitioningRef.current) {
      setCurrentPreset('free');
      onPresetChange?.('free');
    }
  }, [currentPreset, onPresetChange]);
  
  // Programmatic camera control functions
  const setPreset = useCallback((preset: CameraPreset) => {
    if (preset === 'free') {
      setCurrentPreset('free');
      onPresetChange?.('free');
      return;
    }
    
    const config = PRESET_CONFIGS[preset];
    
    transitionStartRef.current.position.copy(camera.position);
    transitionStartRef.current.target.copy(currentTargetRef.current);
    transitionEndRef.current.position.set(...config.position);
    transitionEndRef.current.target.set(...config.target);
    transitionProgressRef.current = 0;
    isTransitioningRef.current = true;
    
    setCurrentPreset(preset);
    onPresetChange?.(preset);
    
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [camera, onPresetChange]);
  
  const zoomTo = useCallback((distance: number) => {
    if (!controlsRef.current) return;
    
    const direction = new THREE.Vector3().subVectors(
      camera.position,
      currentTargetRef.current
    ).normalize();
    
    const newPosition = currentTargetRef.current.clone().add(
      direction.multiplyScalar(THREE.MathUtils.clamp(distance, minDistance, maxDistance))
    );
    
    transitionStartRef.current.position.copy(camera.position);
    transitionStartRef.current.target.copy(currentTargetRef.current);
    transitionEndRef.current.position.copy(newPosition);
    transitionEndRef.current.target.copy(currentTargetRef.current);
    transitionProgressRef.current = 0;
    isTransitioningRef.current = true;
  }, [camera, minDistance, maxDistance]);
  
  const lookAt = useCallback((point: [number, number, number]) => {
    transitionStartRef.current.position.copy(camera.position);
    transitionStartRef.current.target.copy(currentTargetRef.current);
    transitionEndRef.current.position.copy(camera.position);
    transitionEndRef.current.target.set(...point);
    transitionProgressRef.current = 0;
    isTransitioningRef.current = true;
  }, [camera]);
  
  // Expose control functions via ref
  useEffect(() => {
    const controls = controlsRef.current;
    if (controls) {
      (controls as any).setPreset = setPreset;
      (controls as any).zoomTo = zoomTo;
      (controls as any).lookAt = lookAt;
    }
  }, [setPreset, zoomTo, lookAt]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      target={currentTargetRef.current}
      enableZoom={enableZoom}
      enablePan={enablePan}
      enableRotate={enableRotate && !followMascot}
      minDistance={minDistance}
      maxDistance={maxDistance}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      autoRotate={autoRotate && !followMascot}
      autoRotateSpeed={autoRotateSpeed}
      onChange={handleControlsChange}
    />
  );
};

// ============================================
// Camera Preset Buttons Component
// ============================================

export interface CameraPresetButtonsProps {
  currentPreset: CameraPreset;
  onPresetChange: (preset: CameraPreset) => void;
  className?: string;
}

export const CameraPresetButtons: React.FC<CameraPresetButtonsProps> = ({
  currentPreset,
  onPresetChange,
  className = '',
}) => {
  const presets: { id: CameraPreset; label: string; icon: string }[] = [
    { id: 'front', label: 'Front', icon: '🎯' },
    { id: 'side', label: 'Side', icon: '➡️' },
    { id: 'top', label: 'Top', icon: '⬆️' },
    { id: 'iso', label: 'Isometric', icon: '🔲' },
    { id: 'free', label: 'Free', icon: '🎮' },
  ];
  
  return (
    <div className={`flex gap-2 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onPresetChange(preset.id)}
          className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-1
            ${currentPreset === preset.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          title={preset.label}
        >
          <span>{preset.icon}</span>
          <span className="hidden sm:inline">{preset.label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// Focus Mode Toggle Component
// ============================================

export interface FocusModeToggleProps {
  isActive: boolean;
  mascotName?: string;
  onToggle: () => void;
  className?: string;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  isActive,
  mascotName,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={onToggle}
      className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-2
        ${isActive
          ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white'
        } ${className}`}
    >
      <span>{isActive ? '🔒' : '🔓'}</span>
      <span>{isActive ? `Following ${mascotName || 'Mascot'}` : 'Focus Mode'}</span>
    </button>
  );
};

export default CameraControls;
