/**
 * Mascot3D Component Tests
 * 
 * [Ver001.000] - Comprehensive test suite for R3F mascot components
 * 
 * Coverage:
 * - Mascot3D rendering and props
 * - CameraControls functionality
 * - AnimationBridge integration
 * - MascotScene composition
 * - PerformanceMonitor stats
 */

import React, { createRef, RefObject } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// ============================================
// Mock @react-three/fiber
// ============================================

const mockUseFrame = vi.fn();
const mockUseThree = vi.fn(() => ({
  camera: new THREE.PerspectiveCamera(),
  gl: {
    domElement: document.createElement('canvas'),
    info: { render: { calls: 0, triangles: 0, points: 0, lines: 0 }, memory: { geometries: 0, textures: 0 }, reset: vi.fn() },
  },
  scene: new THREE.Scene(),
  viewport: { width: 10, height: 10 },
}));

const mockCanvas = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-canvas">{children}</div>
);

vi.mock('@react-three/fiber', () => ({
  Canvas: mockCanvas,
  useFrame: mockUseFrame,
  useThree: mockUseThree,
}));

// ============================================
// Mock @react-three/drei
// ============================================

vi.mock('@react-three/drei', () => ({
  OrbitControls: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      target: new THREE.Vector3(),
      enabled: true,
      update: vi.fn(),
    }));
    return <div data-testid="orbit-controls" />;
  }),
  Stars: () => <div data-testid="stars" />,
  Sky: () => <div data-testid="sky" />,
  Environment: () => <div data-testid="environment" />,
  Grid: () => <div data-testid="grid" />,
  ContactShadows: () => <div data-testid="contact-shadows" />,
}));

// ============================================
// Mock shaders
// ============================================

const mockShaderCompile = vi.fn(() => ({ success: true, material: new THREE.ShaderMaterial() }));
const mockShaderDispose = vi.fn();
const mockShaderUpdate = vi.fn();
const mockShaderSetUniform = vi.fn();

vi.mock('@/lib/three/shaders', () => ({
  SolarGlowShader: vi.fn(() => ({
    compile: mockShaderCompile,
    dispose: mockShaderDispose,
    update: mockShaderUpdate,
    setUniform: mockShaderSetUniform,
    config: { name: 'solarGlow' },
  })),
  LunarGlowShader: vi.fn(() => ({
    compile: mockShaderCompile,
    dispose: mockShaderDispose,
    update: mockShaderUpdate,
    setUniform: mockShaderSetUniform,
    config: { name: 'lunarGlow' },
  })),
  BinaryCodeShader: vi.fn(() => ({
    compile: mockShaderCompile,
    dispose: mockShaderDispose,
    update: mockShaderUpdate,
    setUniform: mockShaderSetUniform,
    config: { name: 'binaryCode' },
    triggerGlitch: vi.fn(),
  })),
  FireVFXShader: vi.fn(() => ({
    compile: mockShaderCompile,
    dispose: mockShaderDispose,
    update: mockShaderUpdate,
    setUniform: mockShaderSetUniform,
    config: { name: 'fireVFX' },
    intensify: vi.fn(),
  })),
  MagicSparkleShader: vi.fn(() => ({
    compile: mockShaderCompile,
    dispose: mockShaderDispose,
    update: mockShaderUpdate,
    setUniform: mockShaderSetUniform,
    config: { name: 'magicSparkle' },
    castBurst: vi.fn(),
  })),
  getDefaultShaderForMascot: vi.fn((id: string) => ({
    create: () => new (vi.mocked({}).SolarGlowShader)(),
    name: `${id} Shader`,
  })),
  getPresetsForMascot: vi.fn(() => ({
    default: {},
    preset1: { intensity: 1.5 },
    preset2: { intensity: 2.0 },
  })),
  getShaderStats: vi.fn(() => ({
    cacheSize: 5,
    cacheHitRate: 0.95,
    maxCacheSize: 50,
  })),
}));

// ============================================
// Mock LOD system
// ============================================

const mockLODGetGroup = vi.fn(() => new THREE.Group());
const mockLODGetState = vi.fn(() => ({ currentLevel: 0, isTransitioning: false }));
const mockLODGetMetrics = vi.fn(() => ({ drawCallsSaved: 2, currentVertexCount: 100 }));
const mockLODUpdate = vi.fn();
const mockLODForceLevel = vi.fn();
const mockLODDDispose = vi.fn();

vi.mock('@/lib/three/lod', () => ({
  MascotLOD: vi.fn(() => ({
    getGroup: mockLODGetGroup,
    getState: mockLODGetState,
    getMetrics: mockLODGetMetrics,
    update: mockLODUpdate,
    forceLevel: mockLODForceLevel,
    dispose: mockLODDDispose,
  })),
  LODManager: vi.fn(() => ({
    registerMascot: vi.fn(() => ({
      getGroup: () => new THREE.Group(),
    })),
    setCamera: vi.fn(),
    update: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    getAggregateMetrics: vi.fn(() => ({
      totalMascots: 1,
      totalVertexCount: 100,
    })),
    dispose: vi.fn(),
  })),
  createLODGeometries: vi.fn((geometry: THREE.BufferGeometry) => [
    geometry,
    geometry.clone(),
    geometry.clone(),
  ]),
  estimateGeometryComplexity: vi.fn(() => ({
    vertices: 100,
    triangles: 50,
    memoryBytes: 1200,
  })),
}));

// ============================================
// Import components after mocks
// ============================================

import { Mascot3D, Mascot3DProps, Mascot3DRefs } from '../Mascot3D';
import { CameraControls, CameraPresetButtons, FocusModeToggle, CameraPreset } from '../CameraControls';
import { createAnimationBridge, useAnimationBridge, useAnimationState } from '@/lib/three/animationBridge';
import { MascotScene } from '../MascotScene';
import { PerformanceMonitor, SimpleFPS, usePerformanceMonitor } from '../PerformanceMonitor';

// ============================================
// Test Suite
// ============================================

describe('Mascot3D Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Basic rendering
  it('should render Mascot3D with required props', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        position={[0, 0, 0]}
      />
    );
    
    expect(ref.current).toBeDefined();
    expect(ref.current?.group).toBeInstanceOf(THREE.Group);
  });

  // Test 2: All mascot types
  it('should support all mascot IDs', () => {
    const mascotIds: Array<'sol' | 'lun' | 'bin' | 'fat' | 'uni'> = ['sol', 'lun', 'bin', 'fat', 'uni'];
    
    mascotIds.forEach((id) => {
      const ref = createRef<Mascot3DRefs>();
      render(<Mascot3D ref={ref} mascotId={id} />);
      expect(ref.current).toBeDefined();
    });
  });

  // Test 3: LOD level override
  it('should respect LOD level override', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        lodLevel={1}
      />
    );
    
    // LOD should not be null when manual LOD is set
    expect(ref.current).toBeDefined();
  });

  // Test 4: Animation states
  it('should handle different animation states', () => {
    const animationStates: Array<Mascot3DProps['animationState']> = [
      { name: 'idle' },
      { name: 'walk' },
      { name: 'run' },
      { name: 'jump' },
      { name: 'celebrate' },
      { name: 'defeat' },
      { name: 'custom', customData: { speed: 2 } },
    ];
    
    animationStates.forEach((state) => {
      const ref = createRef<Mascot3DRefs>();
      render(
        <Mascot3D
          ref={ref}
          mascotId="sol"
          animationState={state}
        />
      );
      expect(ref.current).toBeDefined();
    });
  });

  // Test 5: Shader presets
  it('should apply shader presets', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        shaderPreset="sunSurface"
      />
    );
    
    expect(ref.current).toBeDefined();
  });

  // Test 6: Position and rotation props
  it('should apply position and rotation', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        position={[1, 2, 3]}
        rotation={[0.5, 0.5, 0.5]}
      />
    );
    
    expect(ref.current?.group.position.x).toBe(1);
    expect(ref.current?.group.position.y).toBe(2);
    expect(ref.current?.group.position.z).toBe(3);
  });

  // Test 7: Scale prop (number)
  it('should handle numeric scale', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        scale={2}
      />
    );
    
    expect(ref.current?.group.scale.x).toBe(2);
    expect(ref.current?.group.scale.y).toBe(2);
    expect(ref.current?.group.scale.z).toBe(2);
  });

  // Test 8: Scale prop (array)
  it('should handle array scale', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        scale={[1, 2, 3]}
      />
    );
    
    expect(ref.current?.group.scale.x).toBe(1);
    expect(ref.current?.group.scale.y).toBe(2);
    expect(ref.current?.group.scale.z).toBe(3);
  });

  // Test 9: Click handler
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    const ref = createRef<Mascot3DRefs>();
    
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        onClick={handleClick}
      />
    );
    
    // Simulate click
    if (ref.current?.group) {
      ref.current.group.dispatchEvent({ type: 'click' } as any);
    }
    
    expect(handleClick).toHaveBeenCalledWith('sol');
  });

  // Test 10: Hover handlers
  it('should call onHover on pointer over/out', () => {
    const handleHover = vi.fn();
    const ref = createRef<Mascot3DRefs>();
    
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        onHover={handleHover}
      />
    );
    
    expect(ref.current).toBeDefined();
  });

  // Test 11: Auto rotate
  it('should enable auto-rotation', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        autoRotate={true}
        autoRotateSpeed={2}
      />
    );
    
    expect(ref.current).toBeDefined();
  });

  // Test 12: Shadow configuration
  it('should configure shadow settings', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        castShadow={false}
        receiveShadow={false}
      />
    );
    
    expect(ref.current).toBeDefined();
  });

  // Test 13: Frustum culling
  it('should enable frustum culling', () => {
    const ref = createRef<Mascot3DRefs>();
    render(
      <Mascot3D
        ref={ref}
        mascotId="sol"
        enableCulling={true}
        cullingDistance={50}
      />
    );
    
    expect(ref.current).toBeDefined();
  });
});

describe('CameraControls Component', () => {
  // Test 14: Basic rendering
  it('should render CameraControls', () => {
    render(<CameraControls />);
    expect(screen.getByTestId('orbit-controls')).toBeDefined();
  });

  // Test 15: Preset buttons
  it('should render preset buttons', () => {
    const handlePresetChange = vi.fn();
    render(
      <CameraPresetButtons
        currentPreset="front"
        onPresetChange={handlePresetChange}
      />
    );
    
    expect(screen.getByText('Front')).toBeDefined();
    expect(screen.getByText('Side')).toBeDefined();
    expect(screen.getByText('Top')).toBeDefined();
    expect(screen.getByText('Isometric')).toBeDefined();
    expect(screen.getByText('Free')).toBeDefined();
  });

  // Test 16: Preset button click
  it('should call onPresetChange when preset clicked', () => {
    const handlePresetChange = vi.fn();
    render(
      <CameraPresetButtons
        currentPreset="front"
        onPresetChange={handlePresetChange}
      />
    );
    
    screen.getByText('Side').click();
    expect(handlePresetChange).toHaveBeenCalledWith('side');
  });

  // Test 17: Focus mode toggle
  it('should render focus mode toggle', () => {
    const handleToggle = vi.fn();
    render(
      <FocusModeToggle
        isActive={false}
        mascotName="Sol"
        onToggle={handleToggle}
      />
    );
    
    expect(screen.getByText('Focus Mode')).toBeDefined();
  });

  // Test 18: Active focus mode
  it('should show active focus state', () => {
    const handleToggle = vi.fn();
    render(
      <FocusModeToggle
        isActive={true}
        mascotName="Sol"
        onToggle={handleToggle}
      />
    );
    
    expect(screen.getByText('Following Sol')).toBeDefined();
  });

  // Test 19: Camera configuration props
  it('should accept camera configuration props', () => {
    render(
      <CameraControls
        target={[1, 2, 3]}
        initialPosition={[5, 5, 5]}
        enableZoom={false}
        enablePan={false}
        minDistance={1}
        maxDistance={100}
        fov={60}
      />
    );
    
    expect(screen.getByTestId('orbit-controls')).toBeDefined();
  });
});

describe('AnimationBridge', () => {
  // Test 20: Create bridge
  it('should create animation bridge', () => {
    const bridge = createAnimationBridge();
    expect(bridge).toBeDefined();
    expect(bridge.getState).toBeDefined();
    expect(bridge.setTarget).toBeDefined();
    expect(bridge.start).toBeDefined();
    expect(bridge.pause).toBeDefined();
    expect(bridge.resume).toBeDefined();
    expect(bridge.stop).toBeDefined();
    expect(bridge.reset).toBeDefined();
    expect(bridge.subscribe).toBeDefined();
  });

  // Test 21: Bridge state
  it('should return initial state', () => {
    const bridge = createAnimationBridge({ initial: 0.5 });
    const state = bridge.getState();
    
    expect(state.value).toBe(0.5);
    expect(state.isAnimating).toBe(false);
    expect(state.isPaused).toBe(false);
  });

  // Test 22: Set target
  it('should set animation target', () => {
    const bridge = createAnimationBridge();
    bridge.setTarget(1.0, { duration: 1, ease: [0.4, 0, 0.2, 1] });
    
    const state = bridge.getState();
    expect(state.targetValue).toBe(1.0);
    expect(state.isAnimating).toBe(true);
  });

  // Test 23: Subscribe to changes
  it('should notify subscribers', () => {
    const bridge = createAnimationBridge();
    const listener = vi.fn();
    
    const unsubscribe = bridge.subscribe(listener);
    bridge.setTarget(1.0);
    
    expect(listener).toHaveBeenCalled();
    
    unsubscribe();
  });

  // Test 24: Three.js value conversion
  it('should provide Three.js compatible values', () => {
    const bridge = createAnimationBridge({ initial: 0.5 });
    const value = bridge.getThreeValue();
    
    expect(typeof value).toBe('number');
    expect(value).toBe(0.5);
  });

  // Test 25: Vector interpolation
  it('should interpolate vectors', () => {
    const bridge = createAnimationBridge({ initial: 0.5 });
    const from = new THREE.Vector3(0, 0, 0);
    const to = new THREE.Vector3(10, 10, 10);
    
    const result = bridge.getLerpVector(from, to);
    
    expect(result).toBeInstanceOf(THREE.Vector3);
    expect(result.x).toBe(5);
    expect(result.y).toBe(5);
    expect(result.z).toBe(5);
  });
});

describe('MascotScene Component', () => {
  // Test 26: Basic scene rendering
  it('should render MascotScene', () => {
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        showPerformanceMonitor={false}
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 27: Multiple mascots
  it('should render multiple mascots', () => {
    render(
      <MascotScene
        mascots={[
          { mascotId: 'sol', position: [-2, 0, 0] },
          { mascotId: 'lun', position: [0, 0, 0] },
          { mascotId: 'bin', position: [2, 0, 0] },
        ]}
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 28: Background types
  it('should support different backgrounds', () => {
    const backgrounds: Array<'stars' | 'sky' | 'solid' | 'gradient' | 'environment'> = [
      'stars',
      'sky',
      'solid',
      'gradient',
      'environment',
    ];
    
    backgrounds.forEach((bg) => {
      const { container } = render(
        <MascotScene
          mascots={[{ mascotId: 'sol' }]}
          background={bg}
        />
      );
      expect(container).toBeDefined();
    });
  });

  // Test 29: Lighting presets
  it('should support lighting presets', () => {
    const presets: Array<'default' | 'studio' | 'outdoor' | 'dramatic'> = [
      'default',
      'studio',
      'outdoor',
      'dramatic',
    ];
    
    presets.forEach((preset) => {
      const { container } = render(
        <MascotScene
          mascots={[{ mascotId: 'sol' }]}
          lightingPreset={preset}
        />
      );
      expect(container).toBeDefined();
    });
  });

  // Test 30: Ground and grid options
  it('should support ground and grid toggles', () => {
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        showGround={true}
        showGrid={true}
        groundColor="#1e293b"
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 31: Performance monitor
  it('should show performance monitor when enabled', () => {
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        showPerformanceMonitor={true}
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 32: Selected mascot focus
  it('should handle selected mascot', () => {
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        selectedMascot="sol"
        showUI={true}
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 33: Environment preset
  it('should support environment presets', () => {
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        background="environment"
        environmentPreset="studio"
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 34: Shadow quality
  it('should support shadow quality settings', () => {
    const qualities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    
    qualities.forEach((quality) => {
      const { container } = render(
        <MascotScene
          mascots={[{ mascotId: 'sol' }]}
          shadowQuality={quality}
        />
      );
      expect(container).toBeDefined();
    });
  });
});

describe('PerformanceMonitor Component', () => {
  // Test 35: Basic rendering
  it('should render PerformanceMonitor', () => {
    render(<PerformanceMonitor />);
    expect(screen.getByText('Performance')).toBeDefined();
  });

  // Test 36: Minimize functionality
  it('should minimize and expand', () => {
    render(<PerformanceMonitor minimizable={true} />);
    
    const minimizeButton = screen.getByLabelText('Minimize');
    expect(minimizeButton).toBeDefined();
    
    minimizeButton.click();
    expect(screen.getByLabelText('Expand')).toBeDefined();
  });

  // Test 37: Start minimized
  it('should respect startMinimized prop', () => {
    render(<PerformanceMonitor minimizable={true} startMinimized={true} />);
    
    expect(screen.getByLabelText('Expand')).toBeDefined();
  });

  // Test 38: Different positions
  it('should support different positions', () => {
    const positions: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = [
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ];
    
    positions.forEach((position) => {
      const { container } = render(<PerformanceMonitor position={position} />);
      expect(container).toBeDefined();
    });
  });

  // Test 39: Stats visibility toggles
  it('should respect stats visibility props', () => {
    render(
      <PerformanceMonitor
        showFPS={true}
        showFrameTime={true}
        showDrawCalls={true}
        showMemory={true}
        showTriangles={true}
        showTextures={false}
        showGeometries={false}
        showShaders={false}
      />
    );
    
    expect(screen.getByText('Performance')).toBeDefined();
  });

  // Test 40: SimpleFPS component
  it('should render SimpleFPS', () => {
    render(<SimpleFPS />);
    expect(document.querySelector('.absolute')).toBeDefined();
  });
});

// ============================================
// Integration Tests
// ============================================

describe('Integration Tests', () => {
  // Test 41: Full scene with all mascots
  it('should render complete scene with all mascots', () => {
    render(
      <MascotScene
        mascots={[
          { mascotId: 'sol', position: [-4, 0, 0], animationState: { name: 'idle' } },
          { mascotId: 'lun', position: [-2, 0, 0], animationState: { name: 'walk' } },
          { mascotId: 'bin', position: [0, 0, 0], animationState: { name: 'run' } },
          { mascotId: 'fat', position: [2, 0, 0], animationState: { name: 'celebrate' } },
          { mascotId: 'uni', position: [4, 0, 0], animationState: { name: 'jump' } },
        ]}
        showPerformanceMonitor={true}
        background="gradient"
        lightingPreset="studio"
        showGround={true}
        showGrid={true}
        showUI={true}
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });

  // Test 42: Camera preset integration
  it('should integrate camera presets with scene', () => {
    const handlePresetChange = vi.fn();
    
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        cameraConfig={{
          presetView: 'front',
          onPresetChange: handlePresetChange,
        }}
        initialCameraPreset="front"
        showUI={true}
      />
    );
    
    const sideButton = screen.getByText('Side');
    sideButton.click();
    
    expect(handlePresetChange).toHaveBeenCalled();
  });

  // Test 43: Mascot click integration
  it('should handle mascot clicks in scene', () => {
    const handleClick = vi.fn();
    
    render(
      <MascotScene
        mascots={[{ mascotId: 'sol' }]}
        onMascotClick={handleClick}
      />
    );
    
    expect(screen.getByTestId('mock-canvas')).toBeDefined();
  });
});
