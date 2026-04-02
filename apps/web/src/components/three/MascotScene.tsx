/**
 * MascotScene Component
 * 
 * [Ver001.000] - Complete 3D scene setup for mascots
 * 
 * Features:
 * - Complete 3D scene setup with R3F
 * - Multiple mascot support
 * - Lighting (ambient, directional, point)
 * - Ground plane
 * - Background
 * - Performance optimization
 */

// @ts-nocheck
import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sky, Environment, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Mascot3D, Mascot3DProps } from './Mascot3D';
import { CameraControls, CameraControlsProps, CameraPresetButtons, FocusModeToggle } from './CameraControls';
import { PerformanceMonitor } from './PerformanceMonitor';
import type { MascotId } from '@/lib/three/shaders';

// ============================================
// Types
// ============================================

export interface MascotSceneProps {
  /** Array of mascots to render */
  mascots?: Array<Partial<Mascot3DProps> & { mascotId: MascotId; position?: [number, number, number] }>;
  /** Show performance monitor */
  showPerformanceMonitor?: boolean;
  /** Background type */
  background?: 'stars' | 'sky' | 'solid' | 'gradient' | 'environment';
  /** Background color (for solid/gradient) */
  backgroundColor?: string;
  /** Enable ground plane */
  showGround?: boolean;
  /** Ground color */
  groundColor?: string;
  /** Enable grid */
  showGrid?: boolean;
  /** Lighting preset */
  lightingPreset?: 'default' | 'studio' | 'outdoor' | 'dramatic' | 'custom';
  /** Custom lights */
  customLights?: React.ReactNode;
  /** Camera configuration */
  cameraConfig?: Partial<CameraControlsProps>;
  /** Initial camera preset */
  initialCameraPreset?: CameraPreset;
  /** Scene fog */
  fog?: {
    color: string;
    near: number;
    far: number;
  };
  /** On mascot click */
  onMascotClick?: (mascotId: MascotId) => void;
  /** On mascot hover */
  onMascotHover?: (mascotId: MascotId, isHovered: boolean) => void;
  /** Selected mascot (for focus mode) */
  selectedMascot?: MascotId | null;
  /** Show UI controls */
  showUI?: boolean;
  /** Canvas style */
  canvasStyle?: React.CSSProperties;
  /** Canvas className */
  className?: string;
  /** Environment preset (for environment background) */
  environmentPreset?: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city';
  /** Shadow quality */
  shadowQuality?: 'low' | 'medium' | 'high';
  /** Children (additional scene content) */
  children?: React.ReactNode;
}

export type CameraPreset = 'front' | 'side' | 'top' | 'iso' | 'free';

// ============================================
// Lighting Presets
// ============================================

const LightingPresets: Record<string, React.FC> = {
  default: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4338ca" />
    </>
  ),
  studio: () => (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 7]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -7]} intensity={0.5} color="#6366f1" />
      <spotLight
        position={[0, 10, 0]}
        angle={Math.PI / 6}
        penumbra={0.3}
        intensity={0.8}
        castShadow
      />
    </>
  ),
  outdoor: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[4096, 4096]}
      />
      <hemisphereLight
        skyColor="#87ceeb"
        groundColor="#362312"
        intensity={0.4}
      />
    </>
  ),
  dramatic: () => (
    <>
      <ambientLight intensity={0.2} />
      <spotLight
        position={[10, 10, 10]}
        angle={Math.PI / 8}
        penumbra={0.5}
        intensity={2}
        castShadow
        color="#f59e0b"
      />
      <spotLight
        position={[-10, 5, -10]}
        angle={Math.PI / 6}
        penumbra={0.8}
        intensity={0.8}
        color="#4f46e5"
      />
    </>
  ),
  custom: () => null,
};

// ============================================
// Background Components
// ============================================

const StarsBackground: React.FC = () => (
  <Stars
    radius={100}
    depth={50}
    count={5000}
    factor={4}
    saturation={0}
    fade
    speed={0.5}
  />
);

const SkyBackground: React.FC = () => (
  <Sky
    distance={450000}
    sunPosition={[0, 1, 0]}
    inclination={0}
    azimuth={0.25}
  />
);

const SolidBackground: React.FC<{ color: string }> = ({ color }) => (
  <color attach="background" args={[color]} />
);

const GradientBackground: React.FC = () => (
  <>
    <color attach="background" args={['#0f172a']} />
    <mesh position={[0, 0, -10]} scale={[50, 50, 1]}>
      <planeGeometry />
      <meshBasicMaterial>
        <gradientTexture
          attach="map"
          stops={[0, 0.5, 1]}
          colors={['#1e1b4b', '#312e81', '#0f172a']}
        />
      </meshBasicMaterial>
    </mesh>
  </>
);

// ============================================
// Ground Component
// ============================================

interface GroundProps {
  color: string;
  showGrid?: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
}

const Ground: React.FC<GroundProps> = ({ color, showGrid, shadowQuality }) => {
  const shadowResolution = useMemo(() => {
    switch (shadowQuality) {
      case 'low': return 1024;
      case 'medium': return 2048;
      case 'high': return 4096;
    }
  }, [shadowQuality]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Contact shadows */}
      <ContactShadows
        position={[0, -1.49, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={5}
        resolution={shadowResolution}
      />
      
      {/* Grid */}
      {showGrid && (
        <Grid
          position={[0, -1.49, 0]}
          args={[50, 50]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#475569"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#64748b"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid
        />
      )}
    </group>
  );
};

// ============================================
// Mascot Manager Component
// ============================================

interface MascotManagerProps {
  mascots: MascotSceneProps['mascots'];
  onMascotClick?: (mascotId: MascotId) => void;
  onMascotHover?: (mascotId: MascotId, isHovered: boolean) => void;
}

const MascotManager: React.FC<MascotManagerProps> = ({
  mascots,
  onMascotClick,
  onMascotHover,
}) => {
  const mascotRefs = useRef<Map<string, { group: THREE.Group }>>(new Map());

  const handleMascotRef = useCallback((mascotId: MascotId, ref: { group: THREE.Group } | null) => {
    if (ref) {
      mascotRefs.current.set(mascotId, ref);
    } else {
      mascotRefs.current.delete(mascotId);
    }
  }, []);

  return (
    <>
      {mascots?.map((mascot, index) => (
        <Mascot3D
          key={mascot.mascotId}
          ref={(ref) => handleMascotRef(mascot.mascotId, ref)}
          mascotId={mascot.mascotId}
          position={mascot.position || [index * 3 - (mascots.length - 1) * 1.5, 0, 0]}
          animationState={mascot.animationState}
          lodLevel={mascot.lodLevel}
          shaderPreset={mascot.shaderPreset}
          autoRotate={mascot.autoRotate}
          autoRotateSpeed={mascot.autoRotateSpeed}
          onClick={onMascotClick}
          onHover={onMascotHover}
          castShadow={mascot.castShadow ?? true}
          receiveShadow={mascot.receiveShadow ?? true}
          scale={mascot.scale}
          rotation={mascot.rotation}
          enableCulling={mascot.enableCulling ?? true}
        />
      ))}
    </>
  );
};

// ============================================
// Scene Setup Component
// ============================================

interface SceneSetupProps {
  background: MascotSceneProps['background'];
  backgroundColor: string;
  environmentPreset?: MascotSceneProps['environmentPreset'];
  lightingPreset: MascotSceneProps['lightingPreset'];
  customLights?: React.ReactNode;
  showGround: boolean;
  groundColor: string;
  showGrid: boolean;
  fog?: MascotSceneProps['fog'];
  shadowQuality: 'low' | 'medium' | 'high';
}

const SceneSetup: React.FC<SceneSetupProps> = ({
  background,
  backgroundColor,
  environmentPreset,
  lightingPreset,
  customLights,
  showGround,
  groundColor,
  showGrid,
  fog,
  shadowQuality,
}) => {
  const LightingComponent = LightingPresets[lightingPreset || 'default'];

  return (
    <>
      {/* Background */}
      {background === 'stars' && <StarsBackground />}
      {background === 'sky' && <SkyBackground />}
      {background === 'solid' && <SolidBackground color={backgroundColor} />}
      {background === 'gradient' && <GradientBackground />}
      {background === 'environment' && environmentPreset && (
        <Environment preset={environmentPreset} />
      )}

      {/* Lighting */}
      <LightingComponent />
      {customLights}

      {/* Fog */}
      {fog && <fog attach="fog" args={[fog.color, fog.near, fog.far]} />}

      {/* Ground */}
      {showGround && (
        <Ground
          color={groundColor}
          showGrid={showGrid}
          shadowQuality={shadowQuality}
        />
      )}
    </>
  );
};

// ============================================
// Main Component
// ============================================

export const MascotScene: React.FC<MascotSceneProps> = ({
  mascots = [],
  showPerformanceMonitor = false,
  background = 'gradient',
  backgroundColor = '#0f172a',
  showGround = true,
  groundColor = '#1e293b',
  showGrid = true,
  lightingPreset = 'default',
  customLights,
  cameraConfig,
  initialCameraPreset = 'iso',
  fog,
  onMascotClick,
  onMascotHover,
  selectedMascot = null,
  showUI = true,
  canvasStyle,
  className = '',
  environmentPreset = 'studio',
  shadowQuality = 'medium',
  children,
}) => {
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>(initialCameraPreset);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const selectedMascotRef = useRef<{ group: THREE.Group } | null>(null);

  // Get selected mascot ref
  const handleMascotRef = useCallback((mascotId: MascotId, ref: { group: THREE.Group } | null) => {
    if (selectedMascot === mascotId) {
      selectedMascotRef.current = ref;
    }
  }, [selectedMascot]);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  // Get selected mascot name
  const selectedMascotName = useMemo(() => {
    const mascot = mascots.find(m => m.mascotId === selectedMascot);
    return mascot ? mascot.mascotId.charAt(0).toUpperCase() + mascot.mascotId.slice(1) : null;
  }, [mascots, selectedMascot]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          shadowMap: true,
          powerPreference: 'high-performance',
        }}
        style={{
          background: background === 'solid' ? backgroundColor : 'transparent',
          ...canvasStyle,
        }}
      >
        {/* Scene Setup */}
        <SceneSetup
          background={background}
          backgroundColor={backgroundColor}
          environmentPreset={environmentPreset}
          lightingPreset={lightingPreset}
          customLights={customLights}
          showGround={showGround}
          groundColor={groundColor}
          showGrid={showGrid}
          fog={fog}
          shadowQuality={shadowQuality}
        />

        {/* Camera Controls */}
        <CameraControls
          presetView={currentPreset}
          onPresetChange={setCurrentPreset}
          followMascot={isFocusMode ? selectedMascot : null}
          mascotRef={selectedMascotRef}
          {...cameraConfig}
        />

        {/* Mascots */}
        {mascots.map((mascot, index) => (
          <Mascot3D
            key={mascot.mascotId}
            ref={(ref) => handleMascotRef(mascot.mascotId, ref)}
            mascotId={mascot.mascotId}
            position={mascot.position || [index * 3 - (mascots.length - 1) * 1.5, 0, 0]}
            animationState={mascot.animationState}
            lodLevel={mascot.lodLevel}
            shaderPreset={mascot.shaderPreset}
            autoRotate={mascot.autoRotate}
            autoRotateSpeed={mascot.autoRotateSpeed}
            onClick={onMascotClick}
            onHover={onMascotHover}
            castShadow={mascot.castShadow ?? true}
            receiveShadow={mascot.receiveShadow ?? true}
            scale={mascot.scale}
            rotation={mascot.rotation}
            enableCulling={mascot.enableCulling ?? true}
          />
        ))}

        {/* Additional Children */}
        {children}

        {/* Performance Monitor */}
        {showPerformanceMonitor && <PerformanceMonitor position="top-right" />}
      </Canvas>

      {/* UI Controls */}
      {showUI && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <CameraPresetButtons
              currentPreset={currentPreset}
              onPresetChange={setCurrentPreset}
            />
          </div>
          
          {selectedMascot && (
            <div className="pointer-events-auto">
              <FocusModeToggle
                isActive={isFocusMode}
                mascotName={selectedMascotName || undefined}
                onToggle={toggleFocusMode}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export related components
export { Mascot3D, CameraControls, CameraPresetButtons, FocusModeToggle, PerformanceMonitor };
export type { Mascot3DProps, CameraControlsProps };
export default MascotScene;
