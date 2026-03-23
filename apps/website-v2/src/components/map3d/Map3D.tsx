/**
 * Map3D Component
 * 
 * [Ver001.000] - React Three Fiber 3D Map Component
 * 
 * Features:
 * - React Three Fiber integration
 * - Props: mapId, showOverlays
 * - Interactive camera controls
 * - Tactical overlay integration
 * - Real-time data support
 * - Performance optimization
 * 
 * @example
 * ```tsx
 * <Map3D
 *   mapId="ascent"
 *   showOverlays={true}
 *   showPlayers={true}
 *   cameraPreset="overview"
 * />
 * ```
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MapGeometryManager } from '@/lib/map3d/geometry';
import { TacticalOverlay3D, PlayerPosition, UtilityConfig } from '@/lib/map3d/tacticalOverlay';
import { MapOptimizationManager } from '@/lib/map3d/optimization';

// Extend Three.js with custom controls
extend({ OrbitControls });

// ============================================
// Types
// ============================================

export interface Map3DProps {
  /** Map identifier (e.g., 'ascent', 'bind', 'haven') */
  mapId: string;
  /** Show tactical overlays */
  showOverlays?: boolean;
  /** Show player positions */
  showPlayers?: boolean;
  /** Show utilities (smokes, flashes, etc.) */
  showUtilities?: boolean;
  /** Camera preset name */
  cameraPreset?: 'overview' | 'tactical' | 'site-a' | 'site-b' | 'mid';
  /** Camera position override */
  cameraPosition?: [number, number, number];
  /** Camera target override */
  cameraTarget?: [number, number, number];
  /** Player data for overlay */
  players?: PlayerPosition[];
  /** Active utilities */
  utilities?: UtilityConfig[];
  /** On map load callback */
  onLoad?: () => void;
  /** On camera change callback */
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
  /** On player click */
  onPlayerClick?: (playerId: string) => void;
  /** On position click (for tactical placement) */
  onPositionClick?: (position: THREE.Vector3) => void;
  /** Class name for container */
  className?: string;
  /** Show performance stats */
  showStats?: boolean;
  /** Map style/theme */
  theme?: 'default' | 'dark' | 'minimal';
  /** Background color */
  backgroundColor?: string;
}

export interface Map3DRef {
  /** Get Three.js scene */
  getScene: () => THREE.Scene | null;
  /** Get camera */
  getCamera: () => THREE.Camera | null;
  /** Set camera position */
  setCamera: (position: THREE.Vector3, target: THREE.Vector3) => void;
  /** Apply camera preset */
  applyPreset: (preset: string) => void;
  /** Take screenshot */
  takeScreenshot: () => string;
  /** Focus on position */
  focusOnPosition: (position: THREE.Vector3) => void;
  /** Get world position from screen coordinates */
  screenToWorld: (x: number, y: number) => THREE.Vector3 | null;
}

// ============================================
// Camera Presets
// ============================================

const CAMERA_PRESETS: Record<string, { position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  overview: { position: [0, 200, 200], target: [0, 0, 0], fov: 45 },
  tactical: { position: [0, 150, 0], target: [0, 0, 0], fov: 60 },
  'site-a': { position: [-50, 30, -50], target: [-30, 0, -30], fov: 50 },
  'site-b': { position: [50, 30, 50], target: [30, 0, 30], fov: 50 },
  mid: { position: [0, 40, 0], target: [0, 0, 20], fov: 55 },
};

// ============================================
// Map Scene Component
// ============================================

interface MapSceneProps {
  mapId: string;
  showOverlays: boolean;
  showPlayers: boolean;
  showUtilities: boolean;
  cameraPreset?: string;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  players?: PlayerPosition[];
  utilities?: UtilityConfig[];
  onLoad?: () => void;
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
  onPlayerClick?: (playerId: string) => void;
  onPositionClick?: (position: THREE.Vector3) => void;
  theme: string;
}

const MapScene: React.FC<MapSceneProps> = ({
  mapId,
  showOverlays,
  showPlayers,
  showUtilities,
  cameraPreset,
  cameraPosition,
  cameraTarget,
  players,
  utilities,
  onLoad,
  onCameraChange,
  onPlayerClick,
  onPositionClick,
  theme,
}) => {
  const { scene, camera, gl, size } = useThree();
  const controlsRef = useRef<OrbitControls>(null);
  const mapGroupRef = useRef<THREE.Group>(null);
  const overlayRef = useRef<TacticalOverlay3D | null>(null);
  const geometryManagerRef = useRef<MapGeometryManager | null>(null);
  const optimizationRef = useRef<MapOptimizationManager | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize optimization manager
  useEffect(() => {
    optimizationRef.current = new MapOptimizationManager(scene, {
      enableFrustumCulling: true,
      enableOcclusionCulling: false, // Disable for now, can be enabled
      enableTextureStreaming: true,
      enableInstancing: true,
    });

    optimizationRef.current.initializeCullers(camera, gl);

    return () => {
      optimizationRef.current?.dispose();
    };
  }, [scene, camera, gl]);

  // Load map geometry
  useEffect(() => {
    const loadMap = async () => {
      try {
        geometryManagerRef.current = new MapGeometryManager({
          mapId,
          enableCollision: true,
        });

        const mapGroup = await geometryManagerRef.current.loadMap();
        mapGroupRef.current = mapGroup;
        scene.add(mapGroup);

        // Register with optimizer
        optimizationRef.current?.registerMap(mapGroup);

        // Initialize tactical overlay
        if (showOverlays) {
          overlayRef.current = new TacticalOverlay3D(scene);
        }

        setIsLoaded(true);
        onLoad?.();
      } catch (error) {
        console.error('Failed to load map:', error);
      }
    };

    loadMap();

    return () => {
      if (mapGroupRef.current) {
        scene.remove(mapGroupRef.current);
        geometryManagerRef.current?.dispose();
      }
      overlayRef.current?.dispose();
    };
  }, [mapId, scene, showOverlays, onLoad]);

  // Apply camera preset or custom position
  useEffect(() => {
    if (!camera) return;

    let preset = CAMERA_PRESETS.overview;

    if (cameraPreset && CAMERA_PRESETS[cameraPreset]) {
      preset = CAMERA_PRESETS[cameraPreset];
    }

    const pos = cameraPosition || preset.position;
    const target = cameraTarget || preset.target;

    camera.position.set(...pos);
    
    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    } else {
      camera.lookAt(...target);
    }
  }, [camera, cameraPreset, cameraPosition, cameraTarget]);

  // Update tactical overlay with player data
  useEffect(() => {
    if (!showOverlays || !overlayRef.current || !showPlayers) return;

    // Update player positions
    players?.forEach((player) => {
      overlayRef.current?.addPlayerPosition(player);
    });

    // Remove players that are no longer in the data
    const currentIds = new Set(players?.map((p) => p.id) || []);
    overlayRef.current?.playerMeshes.forEach((_, id) => {
      if (!currentIds.has(id)) {
        overlayRef.current?.removePlayerPosition(id);
      }
    });
  }, [players, showOverlays, showPlayers]);

  // Update utilities
  useEffect(() => {
    if (!showOverlays || !overlayRef.current || !showUtilities) return;

    utilities?.forEach((utility) => {
      overlayRef.current?.addUtility(utility);
    });
  }, [utilities, showOverlays, showUtilities]);

  // Handle camera changes
  const handleCameraChange = useCallback(() => {
    if (controlsRef.current && onCameraChange) {
      onCameraChange(camera.position, controlsRef.current.target);
    }
  }, [camera, onCameraChange]);

  // Handle click for position selection
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!onPositionClick && !onPlayerClick) return;

      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Check for player clicks first
      if (onPlayerClick && overlayRef.current) {
        const playerIntersects: THREE.Intersection[] = [];
        overlayRef.current.playerMeshes.forEach((group) => {
          const intersects = raycasterRef.current.intersectObject(group, true);
          playerIntersects.push(...intersects);
        });

        if (playerIntersects.length > 0) {
          // Find which player was clicked
          for (const intersect of playerIntersects) {
            let obj: THREE.Object3D | null = intersect.object;
            while (obj) {
              if (obj.name?.startsWith('player-')) {
                const playerId = obj.name.replace('player-', '');
                onPlayerClick(playerId);
                return;
              }
              obj = obj.parent;
            }
          }
        }
      }

      // Check for ground click
      if (onPositionClick) {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(groundPlane, target);
        
        if (target) {
          onPositionClick(target);
        }
      }
    },
    [camera, gl, onPositionClick, onPlayerClick]
  );

  // Animation loop
  useFrame((state, delta) => {
    // Update optimizations
    optimizationRef.current?.update();

    // Update tactical overlay
    if (overlayRef.current) {
      overlayRef.current.update(delta);
    }
  });

  // Setup event listeners
  useEffect(() => {
    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [gl, handleClick]);

  // Get theme colors
  const themeColors = useMemo(() => {
    switch (theme) {
      case 'dark':
        return {
          background: '#0a0a0f',
          grid: '#1a1a2e',
          gridCenter: '#2a2a4e',
        };
      case 'minimal':
        return {
          background: '#f0f0f0',
          grid: '#d0d0d0',
          gridCenter: '#a0a0a0',
        };
      default:
        return {
          background: '#1a1a2e',
          grid: '#2a2a4e',
          gridCenter: '#3a3a6e',
        };
    }
  }, [theme]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault fov={45} near={0.1} far={2000} />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2 - 0.1}
        onChange={handleCameraChange}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <hemisphereLight
        skyColor={theme === 'minimal' ? '#ffffff' : '#87ceeb'}
        groundColor={theme === 'minimal' ? '#cccccc' : '#362d2d'}
        intensity={0.6}
      />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Grid */}
      <Grid
        position={[0, 0.1, 0]}
        args={[400, 400]}
        cellSize={10}
        cellThickness={0.5}
        cellColor={themeColors.grid}
        sectionSize={50}
        sectionThickness={1}
        sectionColor={themeColors.gridCenter}
        fadeDistance={300}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Fog for depth */}
      <fog
        attach="fog"
        args={[themeColors.background, 50, 500]}
      />
    </>
  );
};

// ============================================
// Main Map3D Component
// ============================================

export const Map3D = forwardRef<Map3DRef, Map3DProps>(
  (
    {
      mapId,
      showOverlays = true,
      showPlayers = true,
      showUtilities = true,
      cameraPreset = 'overview',
      cameraPosition,
      cameraTarget,
      players,
      utilities,
      onLoad,
      onCameraChange,
      onPlayerClick,
      onPositionClick,
      className = '',
      showStats = false,
      theme = 'default',
      backgroundColor,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stats, setStats] = useState({
      fps: 0,
      drawCalls: 0,
      triangles: 0,
    });

    // Get theme background color
    const bgColor = useMemo(() => {
      if (backgroundColor) return backgroundColor;
      switch (theme) {
        case 'dark':
          return '#0a0a0f';
        case 'minimal':
          return '#f0f0f0';
        default:
          return '#1a1a2e';
      }
    }, [theme, backgroundColor]);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      getScene: () => null, // Would need ref to scene
      getCamera: () => null, // Would need ref to camera
      setCamera: (position, target) => {
        // Implementation would update controls
        console.log('Set camera to:', position, target);
      },
      applyPreset: (preset) => {
        console.log('Apply preset:', preset);
      },
      takeScreenshot: () => {
        return canvasRef.current?.toDataURL() || '';
      },
      focusOnPosition: (position) => {
        console.log('Focus on:', position);
      },
      screenToWorld: (x, y) => {
        // Implementation would use raycaster
        return null;
      },
    }));

    // Performance monitoring
    useEffect(() => {
      if (!showStats) return;

      let frameCount = 0;
      let lastTime = performance.now();

      const updateStats = () => {
        const now = performance.now();
        frameCount++;

        if (now - lastTime >= 1000) {
          setStats((prev) => ({
            ...prev,
            fps: frameCount,
          }));
          frameCount = 0;
          lastTime = now;
        }

        requestAnimationFrame(updateStats);
      };

      const id = requestAnimationFrame(updateStats);
      return () => cancelAnimationFrame(id);
    }, [showStats]);

    return (
      <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
        <Canvas
          ref={canvasRef}
          style={{ background: bgColor }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          camera={{ position: [0, 200, 200], fov: 45 }}
          shadows
        >
          <MapScene
            mapId={mapId}
            showOverlays={showOverlays}
            showPlayers={showPlayers}
            showUtilities={showUtilities}
            cameraPreset={cameraPreset}
            cameraPosition={cameraPosition}
            cameraTarget={cameraTarget}
            players={players}
            utilities={utilities}
            onLoad={onLoad}
            onCameraChange={onCameraChange}
            onPlayerClick={onPlayerClick}
            onPositionClick={onPositionClick}
            theme={theme}
          />
        </Canvas>

        {/* Performance Stats Overlay */}
        {showStats && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono pointer-events-none">
            <div>FPS: {stats.fps}</div>
            <div>Draw Calls: {stats.drawCalls}</div>
            <div>Triangles: {stats.triangles}</div>
          </div>
        )}

        {/* Map Info */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-2 rounded text-xs">
          <div className="font-bold">{mapId.toUpperCase()}</div>
          <div className="text-gray-400">3D Tactical View</div>
        </div>

        {/* Controls Info */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-2 rounded text-xs text-right">
          <div>Left Click: Rotate</div>
          <div>Right Click: Pan</div>
          <div>Scroll: Zoom</div>
        </div>
      </div>
    );
  }
);

Map3D.displayName = 'Map3D';

// ============================================
// Map3D with Suspense Wrapper
// ============================================

import { Suspense } from 'react';

interface Map3DWrapperProps extends Map3DProps {
  fallback?: React.ReactNode;
}

export const Map3DWithSuspense: React.FC<Map3DWrapperProps> = ({
  fallback,
  ...props
}) => {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center w-full h-full bg-gray-900">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>Loading 3D Map...</p>
            </div>
          </div>
        )
      }
    >
      <Map3D {...props} />
    </Suspense>
  );
};

export default Map3D;
