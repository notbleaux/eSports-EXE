/**
 * Shader Demo Component
 * 
 * [Ver001.000] - Interactive shader tester demonstrating all 5 mascot shaders
 * 
 * Features:
 * - Interactive shader selection
 * - Real-time parameter controls
 * - Performance metrics display
 * - All 5 mascot shader demonstrations
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SolarGlowShader,
  LunarGlowShader,
  BinaryCodeShader,
  FireVFXShader,
  MagicSparkleShader,
  getPresetsForMascot,
  type MascotId,
  getShaderStats,
} from '@/lib/three/shaders';
import type { BaseShader, UniformDefinition } from '@/lib/three/shaders';

// ============================================
// Types
// ============================================

interface ShaderDemoProps {
  /** Initial shader to display */
  initialShader?: MascotId;
  /** Show performance overlay */
  showMetrics?: boolean;
  /** Auto-rotate the view */
  autoRotate?: boolean;
  /** Class name for container */
  className?: string;
}

interface ShaderInfo {
  id: MascotId;
  name: string;
  description: string;
  shader: BaseShader | null;
  presets: Record<string, Record<string, unknown>>;
}

interface UniformControlProps {
  name: string;
  definition: UniformDefinition;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}

// ============================================
// Uniform Control Component
// ============================================

const UniformControl: React.FC<UniformControlProps> = ({ 
  name, 
  definition, 
  value, 
  onChange 
}) => {
  const { type, min, max, step, description } = definition;

  const handleChange = useCallback((newValue: unknown) => {
    onChange(name, newValue);
  }, [name, onChange]);

  // Skip built-in uniforms in UI
  if (name === 'uTime' || name === 'uResolution' || name === 'uMouse') {
    return null;
  }

  if (type === 'float') {
    return (
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">
          {name.replace(/^u/, '').replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          type="range"
          min={min ?? 0}
          max={max ?? 1}
          step={step ?? 0.01}
          value={value as number}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-gray-500">{Number(value).toFixed(3)}</span>
        {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
      </div>
    );
  }

  if (type === 'vec3' && value instanceof THREE.Color) {
    return (
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">
          {name.replace(/^u/, '').replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <input
          type="color"
          value={`#${(value as THREE.Color).getHexString()}`}
          onChange={(e) => handleChange(new THREE.Color(e.target.value))}
          className="w-full h-8 rounded cursor-pointer"
        />
      </div>
    );
  }

  if (type === 'bool') {
    return (
      <div className="mb-3 flex items-center">
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-600"
        />
        <label className="ml-2 text-xs text-gray-400">
          {name.replace(/^u/, '').replace(/([A-Z])/g, ' $1').trim()}
        </label>
      </div>
    );
  }

  return null;
};

// ============================================
// Shader Mesh Component
// ============================================

interface ShaderMeshProps {
  shader: BaseShader | null;
  geometry: THREE.BufferGeometry;
}

const ShaderMesh: React.FC<ShaderMeshProps> = ({ shader, geometry }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Compile shader when it changes
  useEffect(() => {
    if (!shader) return;

    const result = shader.compile();
    if (result.success && result.material) {
      materialRef.current = result.material;
      
      if (meshRef.current) {
        meshRef.current.material = result.material;
      }
    }

    return () => {
      shader.dispose();
    };
  }, [shader]);

  // Update shader uniforms in animation loop
  useFrame((state, delta) => {
    if (shader) {
      shader.update(delta);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial transparent />
    </mesh>
  );
};

// ============================================
// Scene Component
// ============================================

interface SceneProps {
  shader: BaseShader | null;
  autoRotate: boolean;
}

const Scene: React.FC<SceneProps> = ({ shader, autoRotate }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Create geometry based on shader type
  const geometry = useMemo(() => {
    if (!shader) return new THREE.PlaneGeometry(2, 2);
    
    const name = shader['config']?.name;
    
    switch (name) {
      case 'fireVFX':
        // Fire looks better on a vertical plane
        return new THREE.PlaneGeometry(1.5, 3, 32, 64);
      case 'binaryCode':
        // Binary code on a flat panel
        return new THREE.PlaneGeometry(2.5, 2, 64, 64);
      default:
        // Default sphere for glow effects
        return new THREE.SphereGeometry(1.2, 64, 64);
    }
  }, [shader]);

  // Auto-rotate
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <ShaderMesh shader={shader} geometry={geometry} />
      
      {/* Background plane for contrast */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <meshBasicMaterial color={0x111111} />
      </mesh>
    </group>
  );
};

// ============================================
// Metrics Display
// ============================================

const MetricsDisplay: React.FC = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    cacheSize: 0,
    cacheHitRate: 0,
  });

  useFrame((state) => {
    // Update every 30 frames
    if (state.frameCount % 30 === 0) {
      const stats = getShaderStats();
      setMetrics({
        fps: Math.round(1 / state.clock.getDelta()),
        frameTime: Math.round(state.clock.getDelta() * 1000),
        cacheSize: stats.cacheSize,
        cacheHitRate: Math.round(stats.cacheHitRate * 100),
      });
    }
  });

  return (
    <div className="absolute top-4 right-4 bg-black/80 text-green-400 font-mono text-xs p-3 rounded-lg">
      <div>FPS: {metrics.fps}</div>
      <div>Frame: {metrics.frameTime}ms</div>
      <div>Cache: {metrics.cacheSize}</div>
      <div>Hit Rate: {metrics.cacheHitRate}%</div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const ShaderDemo: React.FC<ShaderDemoProps> = ({
  initialShader = 'sol',
  showMetrics = true,
  autoRotate = true,
  className = '',
}) => {
  const [activeShader, setActiveShader] = useState<MascotId>(initialShader);
  const [activePreset, setActivePreset] = useState<string>('default');
  const [uniformValues, setUniformValues] = useState<Record<string, unknown>>({});

  // Initialize shaders
  const shaders = useMemo<Record<MascotId, ShaderInfo>>(() => ({
    sol: {
      id: 'sol',
      name: 'Solar Glow',
      description: 'Rim lighting with pulsing gold/orange glow',
      shader: new SolarGlowShader(),
      presets: getPresetsForMascot('sol'),
    },
    lun: {
      id: 'lun',
      name: 'Lunar Glow',
      description: 'Cool blue/white glow with moon phases',
      shader: new LunarGlowShader(),
      presets: getPresetsForMascot('lun'),
    },
    bin: {
      id: 'bin',
      name: 'Binary Code',
      description: 'Matrix-style falling code with glitch effects',
      shader: new BinaryCodeShader(),
      presets: getPresetsForMascot('bin'),
    },
    fat: {
      id: 'fat',
      name: 'Fire VFX',
      description: 'Flame particles with heat distortion',
      shader: new FireVFXShader(),
      presets: getPresetsForMascot('fat'),
    },
    uni: {
      id: 'uni',
      name: 'Magic Sparkle',
      description: 'Rainbow sparkles with nebula swirl',
      shader: new MagicSparkleShader(),
      presets: getPresetsForMascot('uni'),
    },
  }), []);

  const currentShader = shaders[activeShader];

  // Update uniform values when shader changes
  useEffect(() => {
    if (currentShader.shader) {
      const definitions = currentShader.shader['uniformManager'].getDefinitions();
      const values: Record<string, unknown> = {};
      
      Object.entries(definitions).forEach(([name, def]) => {
        values[name] = def.value;
      });
      
      setUniformValues(values);
    }
  }, [currentShader]);

  // Handle uniform change
  const handleUniformChange = useCallback((name: string, value: unknown) => {
    setUniformValues(prev => ({ ...prev, [name]: value }));
    
    if (currentShader.shader) {
      currentShader.shader.setUniform(name, value);
    }
  }, [currentShader.shader]);

  // Handle preset change
  const handlePresetChange = useCallback((presetName: string) => {
    setActivePreset(presetName);
    
    const preset = currentShader.presets[presetName];
    if (preset && currentShader.shader) {
      // Apply preset values
      Object.entries(preset).forEach(([key, value]) => {
        currentShader.shader!.setUniform(key, value);
      });
      
      // Update UI
      const definitions = currentShader.shader['uniformManager'].getDefinitions();
      const newValues: Record<string, unknown> = {};
      
      Object.entries(definitions).forEach(([name, def]) => {
        newValues[name] = preset[name] ?? def.value;
      });
      
      setUniformValues(newValues);
    }
  }, [currentShader]);

  // Get uniform definitions
  const uniformDefinitions = useMemo(() => {
    if (!currentShader.shader) return {};
    return currentShader.shader['uniformManager'].getDefinitions();
  }, [currentShader]);

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        
        <Scene shader={currentShader.shader} autoRotate={autoRotate} />
        
        {showMetrics && <MetricsDisplay />}
      </Canvas>

      {/* Control Panel */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 
                      bg-black/90 text-white rounded-lg p-4 max-h-[60vh] overflow-y-auto">
        
        {/* Shader Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">Select Shader</h3>
          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(shaders) as MascotId[]).map((id) => (
              <button
                key={id}
                onClick={() => {
                  setActiveShader(id);
                  setActivePreset('default');
                }}
                className={`px-2 py-1 text-xs rounded transition-colors
                  ${activeShader === id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Shader Info */}
        <div className="mb-4 pb-3 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">{currentShader.name}</h2>
          <p className="text-xs text-gray-400 mt-1">{currentShader.description}</p>
        </div>

        {/* Preset Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-green-400 mb-2">Presets</h3>
          <div className="flex flex-wrap gap-1">
            {Object.keys(currentShader.presets).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-2 py-1 text-xs rounded transition-colors
                  ${activePreset === preset
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Uniform Controls */}
        <div>
          <h3 className="text-sm font-semibold text-purple-400 mb-2">Parameters</h3>
          <div className="space-y-1">
            {Object.entries(uniformDefinitions).map(([name, definition]) => (
              <UniformControl
                key={name}
                name={name}
                definition={definition}
                value={uniformValues[name]}
                onChange={handleUniformChange}
              />
            ))}
          </div>
        </div>

        {/* Special Actions */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-orange-400 mb-2">Actions</h3>
          <div className="flex gap-2">
            {activeShader === 'bin' && (
              <button
                onClick={() => (currentShader.shader as BinaryCodeShader)?.triggerGlitch()}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Trigger Glitch
              </button>
            )}
            {activeShader === 'fat' && (
              <button
                onClick={() => (currentShader.shader as FireVFXShader)?.intensify()}
                className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-500 rounded transition-colors"
              >
                Intensify
              </button>
            )}
            {activeShader === 'uni' && (
              <button
                onClick={() => (currentShader.shader as MagicSparkleShader)?.castBurst()}
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 rounded transition-colors"
              >
                Burst
              </button>
            )}
            {activeShader === 'sol' && (
              <button
                onClick={() => (currentShader.shader as SolarGlowShader)?.setPulsePhase(0)}
                className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 rounded transition-colors"
              >
                Sync Pulse
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShaderDemo;
