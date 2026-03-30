/**
 * VFX Editor Component
 * 
 * [Ver001.000] - Parameter tuning UI for particle effects
 * 
 * Provides:
 * - Real-time parameter adjustment
 * - Live preview of effects
 * - Export configuration as JSON
 * - Preset loading and saving
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ParticleSystem, EmitterConfig, QualityLevel } from '../../lib/animation/particles/system';
import { ParticleRenderer, generateDefaultAtlas } from '../../lib/animation/particles/renderer';
import {
  EffectPresetName,
  getPreset,
  getAllPresetNames,
  getPresetDescriptions,
} from '../../lib/animation/particles/presets';

// ============================================
// Types and Interfaces
// ============================================

export interface VFXEditorState {
  selectedPreset: EffectPresetName;
  config: Partial<EmitterConfig>;
  isPlaying: boolean;
  quality: QualityLevel;
  backgroundColor: string;
  showStats: boolean;
  cameraZoom: number;
}

export interface ExportedConfig {
  name: string;
  description: string;
  version: string;
  config: Partial<EmitterConfig>;
  exportedAt: string;
}

// ============================================
// Default Editor State
// ============================================

const defaultEditorState: VFXEditorState = {
  selectedPreset: 'fireBurst',
  config: {},
  isPlaying: true,
  quality: 'high',
  backgroundColor: '#0a0a1a',
  showStats: true,
  cameraZoom: 5,
};

// ============================================
// Utility Functions
// ============================================

function serializeConfig(config: Partial<EmitterConfig>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};
  
  Object.entries(config).forEach(([key, value]) => {
    if (value instanceof THREE.Color) {
      serialized[key] = `#${value.getHexString()}`;
    } else if (value instanceof THREE.Vector3) {
      serialized[key] = { x: value.x, y: value.y, z: value.z };
    } else if (typeof value === 'function') {
      // Skip functions in serialization
      serialized[key] = '[Function]';
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = value;
    } else {
      serialized[key] = value;
    }
  });
  
  return serialized;
}

function deserializeConfig(serialized: Record<string, unknown>): Partial<EmitterConfig> {
  const config: Partial<EmitterConfig> = {};
  
  Object.entries(serialized).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      // Hex color
      (config as Record<string, unknown>)[key] = new THREE.Color(value);
    } else if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value) {
      // Vector3
      const v = value as { x: number; y: number; z?: number };
      (config as Record<string, unknown>)[key] = new THREE.Vector3(v.x, v.y, v.z || 0);
    } else if (key !== 'customUpdate') {
      (config as Record<string, unknown>)[key] = value;
    }
  });
  
  return config;
}

// ============================================
// VFX Editor Component
// ============================================

export const VFXEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const emitterRef = useRef<ReturnType<ParticleSystem['createEmitter']> | null>(null);
  const animationFrameRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<VFXEditorState>(defaultEditorState);
  const [exportName, setExportName] = useState('');
  const [exportDescription, setExportDescription] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [stats, setStats] = useState({
    fps: 60,
    particleCount: 0,
    renderTime: 0,
    lod: 'high' as QualityLevel,
  });

  // Initialize Three.js
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = state.cameraZoom;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Particle system
    const system = new ParticleSystem({
      targetFPS: 60,
      enableLOD: true,
    });
    system.setCamera(camera);
    particleSystemRef.current = system;

    // Particle renderer
    const particleRenderer = new ParticleRenderer(scene, camera, {
      maxParticles: 2000,
      texture: generateDefaultAtlas(),
      useInstancing: true,
    });
    particleRendererRef.current = particleRenderer;

    // Create initial emitter
    createEmitter();

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      const newWidth = canvasRef.current.clientWidth;
      const newHeight = canvasRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start animation
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      particleRenderer.dispose();
      system.dispose();
      renderer.dispose();
    };
  }, []);

  // Create/update emitter when preset changes
  const createEmitter = useCallback(() => {
    if (!particleSystemRef.current) return;

    // Remove existing emitter
    if (emitterRef.current) {
      particleSystemRef.current.removeEmitter('editor-emitter');
    }

    const preset = getPreset(state.selectedPreset);
    const config = { ...preset.config, ...state.config };

    emitterRef.current = particleSystemRef.current.createEmitter(
      'editor-emitter',
      config,
      new THREE.Vector3(0, 0, 0)
    );

    if (!state.isPlaying) {
      emitterRef.current.paused = true;
    }
  }, [state.selectedPreset, state.config, state.isPlaying]);

  // Update emitter when state changes
  useEffect(() => {
    createEmitter();
  }, [createEmitter]);

  // Animation loop
  const animate = useCallback(() => {
    const system = particleSystemRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const particleRenderer = particleRendererRef.current;

    if (!system || !renderer || !scene || !camera || !particleRenderer) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const frameStart = performance.now();

    // Update system
    system.update();

    // Get stats
    const systemStats = system.getStats();

    // Render
    renderer.clear();
    particleRenderer.renderSystem(system, state.quality);
    renderer.render(scene, camera);

    // Update stats
    const frameTime = performance.now() - frameStart;
    setStats({
      fps: Math.round(1000 / Math.max(frameTime, 16)),
      particleCount: systemStats.activeCount,
      renderTime: Math.round(particleRenderer.getStats().renderTime * 100) / 100,
      lod: systemStats.lodLevel,
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [state.quality]);

  // Start animation
  useEffect(() => {
    animate();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [animate]);

  // Show notification
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Export configuration
  const handleExport = useCallback(() => {
    const preset = getPreset(state.selectedPreset);
    const config: ExportedConfig = {
      name: exportName || `Custom ${preset.name}`,
      description: exportDescription || `Custom ${preset.name} configuration`,
      version: '1.0.0',
      config: serializeConfig({ ...preset.config, ...state.config }),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.name.replace(/\s+/g, '_').toLowerCase()}_vfx.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('Configuration exported successfully!');
  }, [state.selectedPreset, state.config, exportName, exportDescription, showNotification]);

  // Import configuration
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as ExportedConfig;
        const config = deserializeConfig(imported.config as Record<string, unknown>);
        
        setState(prev => ({
          ...prev,
          config,
        }));
        
        setExportName(imported.name);
        setExportDescription(imported.description);
        showNotification('Configuration imported successfully!');
      } catch (error) {
        console.error('Failed to import configuration:', error);
        showNotification('Failed to import configuration');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [showNotification]);

  // Reset to preset defaults
  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: {},
    }));
    showNotification('Reset to preset defaults');
  }, [showNotification]);

  // Update config parameter
  const updateConfig = useCallback((path: string, value: unknown) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const keys = path.split('.');
      let current: Record<string, unknown> = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      
      current[keys[keys.length - 1]] = value;
      
      return {
        ...prev,
        config: newConfig,
      };
    });
  }, []);

  // Get current preset config
  const currentPreset = getPreset(state.selectedPreset);
  const currentConfig = { ...currentPreset.config, ...state.config };

  const presetDescriptions = getPresetDescriptions();

  return (
    <div className="vfx-editor" style={{ display: 'flex', height: '100vh', background: '#1a1a2e' }}>
      {/* Sidebar Controls */}
      <div
        style={{
          width: 320,
          background: '#16213e',
          padding: 16,
          overflowY: 'auto',
          borderRight: '1px solid #0f3460',
        }}
      >
        <h2 style={{ color: '#e94560', margin: '0 0 16px 0', fontSize: 20 }}>VFX Editor</h2>

        {/* Preset Selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#eaeaea', display: 'block', marginBottom: 8 }}>Preset</label>
          <select
            value={state.selectedPreset}
            onChange={(e) => setState(prev => ({ ...prev, selectedPreset: e.target.value as EffectPresetName }))}
            style={{
              width: '100%',
              padding: 8,
              background: '#0f3460',
              color: '#eaeaea',
              border: '1px solid #e94560',
              borderRadius: 4,
            }}
          >
            {getAllPresetNames().map(name => (
              <option key={name} value={name}>
                {presetDescriptions[name].name}
              </option>
            ))}
          </select>
          <p style={{ color: '#a0a0a0', fontSize: 12, marginTop: 4 }}>
            {presetDescriptions[state.selectedPreset].description}
          </p>
        </div>

        {/* Playback Controls */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: state.isPlaying ? '#e94560' : '#0f3460',
              color: '#eaeaea',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {state.isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: '#0f3460',
              color: '#eaeaea',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>

        {/* Quality Selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#eaeaea', display: 'block', marginBottom: 8 }}>Quality</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['high', 'medium', 'low'] as QualityLevel[]).map(q => (
              <button
                key={q}
                onClick={() => setState(prev => ({ ...prev, quality: q }))}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: state.quality === q ? '#e94560' : '#0f3460',
                  color: '#eaeaea',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Controls */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ color: '#e94560', fontSize: 14, marginBottom: 12 }}>Parameters</h3>

          {/* Emission Rate */}
          <ControlSlider
            label="Emission Rate"
            value={currentConfig.emissionRate || 100}
            min={0}
            max={500}
            step={10}
            onChange={(v) => updateConfig('emissionRate', v)}
          />

          {/* Max Particles */}
          <ControlSlider
            label="Max Particles"
            value={currentConfig.maxParticles || 1000}
            min={100}
            max={2000}
            step={100}
            onChange={(v) => updateConfig('maxParticles', v)}
          />

          {/* Lifetime */}
          <ControlRange
            label="Lifetime"
            min={currentConfig.lifetime?.min || 1}
            max={currentConfig.lifetime?.max || 3}
            minLimit={0.1}
            maxLimit={10}
            step={0.1}
            onMinChange={(v) => updateConfig('lifetime', { ...currentConfig.lifetime, min: v })}
            onMaxChange={(v) => updateConfig('lifetime', { ...currentConfig.lifetime, max: v })}
          />

          {/* Size */}
          <ControlRange
            label="Size"
            min={currentConfig.size?.min || 0.1}
            max={currentConfig.size?.max || 1}
            minLimit={0.01}
            maxLimit={5}
            step={0.01}
            onMinChange={(v) => updateConfig('size', { ...currentConfig.size, min: v })}
            onMaxChange={(v) => updateConfig('size', { ...currentConfig.size, max: v })}
          />

          {/* Gravity */}
          <ControlSlider
            label="Gravity"
            value={currentConfig.gravity || 0}
            min={-20}
            max={20}
            step={0.5}
            onChange={(v) => updateConfig('gravity', v)}
          />

          {/* Drag */}
          <ControlSlider
            label="Drag"
            value={currentConfig.drag || 0}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => updateConfig('drag', v)}
          />

          {/* Color */}
          <ControlColor
            label="Color"
            value={currentConfig.color || new THREE.Color(1, 1, 1)}
            onChange={(v) => updateConfig('color', v)}
          />

          {/* Color Variation */}
          <ControlSlider
            label="Color Variation"
            value={currentConfig.colorVariation || 0}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => updateConfig('colorVariation', v)}
          />
        </div>

        {/* Export Section */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #0f3460' }}>
          <h3 style={{ color: '#e94560', fontSize: 14, marginBottom: 12 }}>Export</h3>
          
          <input
            type="text"
            placeholder="Config name"
            value={exportName}
            onChange={(e) => setExportName(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 8,
              background: '#0f3460',
              color: '#eaeaea',
              border: '1px solid #e94560',
              borderRadius: 4,
            }}
          />
          
          <textarea
            placeholder="Description"
            value={exportDescription}
            onChange={(e) => setExportDescription(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 8,
              background: '#0f3460',
              color: '#eaeaea',
              border: '1px solid #e94560',
              borderRadius: 4,
              resize: 'vertical',
              minHeight: 60,
            }}
          />
          
          <button
            onClick={handleExport}
            style={{
              width: '100%',
              padding: '10px',
              background: '#e94560',
              color: '#eaeaea',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Export Configuration
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: 8,
              background: '#0f3460',
              color: '#eaeaea',
              border: '1px solid #e94560',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Import Configuration
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div
          style={{
            padding: '8px 16px',
            background: '#16213e',
            borderBottom: '1px solid #0f3460',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: '#eaeaea', fontSize: 14 }}>
            Preview
          </div>
          
          {state.showStats && (
            <div style={{ display: 'flex', gap: 16, color: '#a0a0a0', fontSize: 12 }}>
              <span>FPS: {stats.fps}</span>
              <span>Particles: {stats.particleCount}</span>
              <span>Render: {stats.renderTime}ms</span>
              <span>LOD: {stats.lod}</span>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', background: state.backgroundColor }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 24px',
            background: '#e94560',
            color: '#eaeaea',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          {notification}
        </div>
      )}
    </div>
  );
};

// ============================================
// Control Components
// ============================================

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, step, onChange }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <label style={{ color: '#eaeaea', fontSize: 12 }}>{label}</label>
      <span style={{ color: '#a0a0a0', fontSize: 12 }}>{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
);

interface ControlRangeProps {
  label: string;
  min: number;
  max: number;
  minLimit: number;
  maxLimit: number;
  step: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

const ControlRange: React.FC<ControlRangeProps> = ({
  label,
  min,
  max,
  minLimit,
  maxLimit,
  step,
  onMinChange,
  onMaxChange,
}) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <label style={{ color: '#eaeaea', fontSize: 12 }}>{label} Range</label>
      <span style={{ color: '#a0a0a0', fontSize: 12 }}>
        {min.toFixed(2)} - {max.toFixed(2)}
      </span>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="range"
        min={minLimit}
        max={maxLimit}
        step={step}
        value={min}
        onChange={(e) => onMinChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
      <input
        type="range"
        min={minLimit}
        max={maxLimit}
        step={step}
        value={max}
        onChange={(e) => onMaxChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />
    </div>
  </div>
);

interface ControlColorProps {
  label: string;
  value: THREE.Color;
  onChange: (value: THREE.Color) => void;
}

const ControlColor: React.FC<ControlColorProps> = ({ label, value, onChange }) => {
  const colorString = `#${value.getHexString()}`;
  
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: '#eaeaea', fontSize: 12 }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={colorString}
            onChange={(e) => onChange(new THREE.Color(e.target.value))}
            style={{
              width: 40,
              height: 24,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          />
          <span style={{ color: '#a0a0a0', fontSize: 12 }}>{colorString}</span>
        </div>
      </div>
    </div>
  );
};

export default VFXEditor;
