// @ts-nocheck
/**
 * Optimization Settings Component
 * 
 * [Ver001.000] - Quality presets and custom settings UI
 * 
 * Provides:
 * - Quality presets (low/medium/high/ultra)
 * - Custom settings for all optimization features
 * - Auto-detect optimal settings
 * - Real-time performance feedback
 * 
 * @example
 * ```tsx
 * <OptimizationSettings
 *   onSettingsChange={(settings) => console.log(settings)}
 *   showPerformanceStats={true}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings, 
  Gauge, 
  Cpu, 
  MemoryStick, 
  Eye, 
  Image as ImageIcon,
  Zap,
  Monitor,
  Smartphone,
  Laptop,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Info,
} from 'lucide-react';
import * as THREE from 'three';

// ============================================
// Types
// ============================================

export type QualityPreset = 'auto' | 'low' | 'medium' | 'high' | 'ultra' | 'custom';

export interface OptimizationSettings {
  preset: QualityPreset;
  // LOD
  lodLevel: number;
  lodDistance: number;
  lodTransitions: boolean;
  // Culling
  frustumCulling: boolean;
  occlusionCulling: boolean;
  portalCulling: boolean;
  // Textures
  textureQuality: number; // 0-1
  textureStreaming: boolean;
  textureCompression: boolean;
  maxTextureSize: number;
  // Shadows
  shadows: boolean;
  shadowQuality: number; // 0-1
  shadowDistance: number;
  // Effects
  antialiasing: boolean;
  postProcessing: boolean;
  fog: boolean;
  // Performance
  vsync: boolean;
  fpsLimit: number;
  // Advanced
  drawDistance: number;
  instanceBatchSize: number;
}

export interface OptimizationSettingsProps {
  /** Initial settings */
  initialSettings?: Partial<OptimizationSettings>;
  /** Callback when settings change */
  onSettingsChange?: (settings: OptimizationSettings) => void;
  /** Show performance stats panel */
  showPerformanceStats?: boolean;
  /** Current performance stats */
  performanceStats?: {
    fps: number;
    frameTime: number;
    drawCalls: number;
    memory: number;
    gpuMemory?: number;
  };
  /** Whether settings can be applied immediately */
  liveUpdate?: boolean;
  /** Custom class name */
  className?: string;
}

export interface DeviceCapabilities {
  tier: 'low' | 'medium' | 'high';
  maxTextureSize: number;
  maxDrawBuffers: number;
  gpuMemory?: number;
  supportsWebGL2: boolean;
  supportsCompression: boolean;
  supportsInstancing: boolean;
}

// ============================================
// Preset Configurations
// ============================================

const PRESET_SETTINGS: Record<Exclude<QualityPreset, 'auto' | 'custom'>, OptimizationSettings> = {
  low: {
    preset: 'low',
    lodLevel: 1,
    lodDistance: 100,
    lodTransitions: false,
    frustumCulling: true,
    occlusionCulling: false,
    portalCulling: false,
    textureQuality: 0.25,
    textureStreaming: true,
    textureCompression: true,
    maxTextureSize: 512,
    shadows: false,
    shadowQuality: 0,
    shadowDistance: 50,
    antialiasing: false,
    postProcessing: false,
    fog: false,
    vsync: false,
    fpsLimit: 30,
    drawDistance: 200,
    instanceBatchSize: 500,
  },
  medium: {
    preset: 'medium',
    lodLevel: 2,
    lodDistance: 200,
    lodTransitions: true,
    frustumCulling: true,
    occlusionCulling: true,
    portalCulling: false,
    textureQuality: 0.5,
    textureStreaming: true,
    textureCompression: true,
    maxTextureSize: 1024,
    shadows: true,
    shadowQuality: 0.5,
    shadowDistance: 100,
    antialiasing: true,
    postProcessing: false,
    fog: true,
    vsync: true,
    fpsLimit: 60,
    drawDistance: 400,
    instanceBatchSize: 1000,
  },
  high: {
    preset: 'high',
    lodLevel: 3,
    lodDistance: 400,
    lodTransitions: true,
    frustumCulling: true,
    occlusionCulling: true,
    portalCulling: true,
    textureQuality: 0.75,
    textureStreaming: true,
    textureCompression: true,
    maxTextureSize: 2048,
    shadows: true,
    shadowQuality: 0.75,
    shadowDistance: 200,
    antialiasing: true,
    postProcessing: true,
    fog: true,
    vsync: true,
    fpsLimit: 60,
    drawDistance: 800,
    instanceBatchSize: 2000,
  },
  ultra: {
    preset: 'ultra',
    lodLevel: 4,
    lodDistance: 800,
    lodTransitions: true,
    frustumCulling: true,
    occlusionCulling: true,
    portalCulling: true,
    textureQuality: 1.0,
    textureStreaming: true,
    textureCompression: true,
    maxTextureSize: 4096,
    shadows: true,
    shadowQuality: 1.0,
    shadowDistance: 500,
    antialiasing: true,
    postProcessing: true,
    fog: true,
    vsync: true,
    fpsLimit: 144,
    drawDistance: 2000,
    instanceBatchSize: 5000,
  },
};

// ============================================
// Default Settings
// ============================================

const DEFAULT_SETTINGS: OptimizationSettings = {
  preset: 'auto',
  lodLevel: 2,
  lodDistance: 200,
  lodTransitions: true,
  frustumCulling: true,
  occlusionCulling: true,
  portalCulling: false,
  textureQuality: 0.5,
  textureStreaming: true,
  textureCompression: true,
  maxTextureSize: 1024,
  shadows: true,
  shadowQuality: 0.5,
  shadowDistance: 100,
  antialiasing: true,
  postProcessing: false,
  fog: true,
  vsync: true,
  fpsLimit: 60,
  drawDistance: 400,
  instanceBatchSize: 1000,
};

// ============================================
// Device Detection
// ============================================

export function detectDeviceCapabilities(): DeviceCapabilities {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    return {
      tier: 'low',
      maxTextureSize: 512,
      maxDrawBuffers: 1,
      supportsWebGL2: false,
      supportsCompression: false,
      supportsInstancing: false,
    };
  }

  const isWebGL2 = gl instanceof WebGL2RenderingContext;
  
  // Get capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxDrawBuffers = isWebGL2 
    ? gl.getParameter(gl.getExtension('WEBGL_draw_buffers')?.MAX_DRAW_BUFFERS_WEBGL || 1)
    : 1;

  // Check for compression support
  const hasCompression = !!(
    gl.getExtension('WEBGL_compressed_texture_s3tc') ||
    gl.getExtension('WEBGL_compressed_texture_etc') ||
    gl.getExtension('WEBGL_compressed_texture_astc')
  );

  // Check for instancing
  const hasInstancing = !!(
    gl.getExtension('ANGLE_instanced_arrays') || isWebGL2
  );

  // Determine tier
  let tier: 'low' | 'medium' | 'high' = 'medium';
  
  // Check for high-performance GPU hint
  const gl2 = gl as WebGL2RenderingContext;
  if (isWebGL2 && 'getContextAttributes' in gl) {
    // Additional high-tier checks
    if (maxTextureSize >= 8192 && hasCompression && hasInstancing) {
      tier = 'high';
    }
  }

  // Low tier indicators
  if (maxTextureSize < 2048 || !hasInstancing) {
    tier = 'low';
  }

  return {
    tier,
    maxTextureSize,
    maxDrawBuffers,
    supportsWebGL2: isWebGL2,
    supportsCompression: hasCompression,
    supportsInstancing: hasInstancing,
  };
}

export function getRecommendedPreset(capabilities: DeviceCapabilities): QualityPreset {
  switch (capabilities.tier) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

// ============================================
// Component
// ============================================

export const OptimizationSettingsPanel: React.FC<OptimizationSettingsProps> = ({
  initialSettings,
  onSettingsChange,
  showPerformanceStats = true,
  performanceStats,
  liveUpdate = true,
  className = '',
}) => {
  const [settings, setSettings] = useState<OptimizationSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['preset']));
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Detect device capabilities on mount
  useEffect(() => {
    const caps = detectDeviceCapabilities();
    setCapabilities(caps);

    // Auto-detect if preset is 'auto'
    if (settings.preset === 'auto') {
      handleAutoDetect();
    }
  }, []);

  // Notify parent of settings changes
  useEffect(() => {
    if (liveUpdate) {
      onSettingsChange?.(settings);
    }
  }, [settings, liveUpdate, onSettingsChange]);

  // Handle preset selection
  const handlePresetChange = useCallback((preset: QualityPreset) => {
    if (preset === 'auto') {
      handleAutoDetect();
      return;
    }

    if (preset === 'custom') {
      setSettings((prev) => ({ ...prev, preset }));
      return;
    }

    const presetSettings = PRESET_SETTINGS[preset];
    setSettings({ ...presetSettings });
  }, []);

  // Auto-detect optimal settings
  const handleAutoDetect = useCallback(async () => {
    setAutoDetecting(true);
    
    // Simulate detection delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const caps = detectDeviceCapabilities();
    setCapabilities(caps);
    
    const recommended = getRecommendedPreset(caps);
    const presetSettings = PRESET_SETTINGS[recommended];
    
    setSettings({
      ...presetSettings,
      preset: 'auto',
    });
    
    setAutoDetecting(false);
  }, []);

  // Update individual setting
  const updateSetting = useCallback(<K extends keyof OptimizationSettings>(
    key: K,
    value: OptimizationSettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
      preset: 'custom',
    }));
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Get preset icon
  const getPresetIcon = (preset: QualityPreset) => {
    switch (preset) {
      case 'low':
        return <Smartphone className="w-4 h-4" />;
      case 'medium':
        return <Laptop className="w-4 h-4" />;
      case 'high':
        return <Monitor className="w-4 h-4" />;
      case 'ultra':
        return <Zap className="w-4 h-4" />;
      case 'auto':
        return <Gauge className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  // Get performance status color
  const getPerformanceColor = (value: number, target: number, inverse = false) => {
    const ratio = inverse ? target / value : value / target;
    if (ratio >= 0.95) return 'text-green-400';
    if (ratio >= 0.8) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Section header component
  const SectionHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    section: string;
  }> = ({ title, icon, section }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-slate-200">{title}</span>
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
  );

  // Slider component
  const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    suffix?: string;
  }> = ({ label, value, min, max, step = 1, onChange, suffix = '' }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

  // Toggle component
  const Toggle: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ label, checked, onChange, disabled }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className={`text-sm ${disabled ? 'text-slate-500' : 'text-slate-300'}`}>
        {label}
      </span>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          disabled ? 'bg-slate-700 cursor-not-allowed' :
          checked ? 'bg-blue-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Optimization Settings</h2>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 gap-2">
          {(['auto', 'low', 'medium', 'high', 'ultra'] as QualityPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              disabled={autoDetecting}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                settings.preset === preset
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } ${autoDetecting && preset === 'auto' ? 'animate-pulse' : ''}`}
            >
              {getPresetIcon(preset)}
              <span className="capitalize">{preset}</span>
              {settings.preset === preset && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {capabilities && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4" />
            <span>
              Detected: <span className="capitalize text-slate-300">{capabilities.tier}</span> tier device
              {capabilities.supportsWebGL2 && ' • WebGL 2'}
              {capabilities.supportsCompression && ' • Texture compression'}
            </span>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      {showPerformanceStats && performanceStats && (
        <div className="p-4 bg-slate-800/30 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-slate-200">Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400">FPS</div>
              <div className={`text-lg font-mono ${getPerformanceColor(performanceStats.fps, 60)}`}>
                {Math.round(performanceStats.fps)}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400">Frame Time</div>
              <div className={`text-lg font-mono ${getPerformanceColor(performanceStats.frameTime, 16.67, true)}`}>
                {performanceStats.frameTime.toFixed(1)}ms
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400">Draw Calls</div>
              <div className={`text-lg font-mono ${getPerformanceColor(100 - performanceStats.drawCalls, 0, true)}`}>
                {performanceStats.drawCalls}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2">
              <div className="text-xs text-slate-400">Memory</div>
              <div className="text-lg font-mono text-slate-300">
                {(performanceStats.memory / 1024 / 1024).toFixed(0)}MB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sections */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* LOD Settings */}
        <div>
          <SectionHeader title="Level of Detail" icon={<Eye className="w-4 h-4 text-blue-400" />} section="lod" />
          {expandedSections.has('lod') && (
            <div className="mt-3 space-y-4 pl-2">
              <Slider
                label="LOD Distance"
                value={settings.lodDistance}
                min={50}
                max={1000}
                step={50}
                onChange={(v) => updateSetting('lodDistance', v)}
                suffix="m"
              />
              <Slider
                label="LOD Quality"
                value={settings.lodLevel}
                min={1}
                max={4}
                step={1}
                onChange={(v) => updateSetting('lodLevel', v)}
              />
              <Toggle
                label="Smooth Transitions"
                checked={settings.lodTransitions}
                onChange={(v) => updateSetting('lodTransitions', v)}
              />
            </div>
          )}
        </div>

        {/* Culling Settings */}
        <div>
          <SectionHeader title="Culling" icon={<Eye className="w-4 h-4 text-purple-400" />} section="culling" />
          {expandedSections.has('culling') && (
            <div className="mt-3 space-y-3 pl-2">
              <Toggle
                label="Frustum Culling"
                checked={settings.frustumCulling}
                onChange={(v) => updateSetting('frustumCulling', v)}
              />
              <Toggle
                label="Occlusion Culling"
                checked={settings.occlusionCulling}
                onChange={(v) => updateSetting('occlusionCulling', v)}
              />
              <Toggle
                label="Portal Culling"
                checked={settings.portalCulling}
                onChange={(v) => updateSetting('portalCulling', v)}
              />
              <Slider
                label="Draw Distance"
                value={settings.drawDistance}
                min={100}
                max={2000}
                step={100}
                onChange={(v) => updateSetting('drawDistance', v)}
                suffix="m"
              />
            </div>
          )}
        </div>

        {/* Texture Settings */}
        <div>
          <SectionHeader title="Textures" icon={<ImageIcon className="w-4 h-4 text-yellow-400" />} section="textures" />
          {expandedSections.has('textures') && (
            <div className="mt-3 space-y-4 pl-2">
              <Slider
                label="Texture Quality"
                value={Math.round(settings.textureQuality * 100)}
                min={25}
                max={100}
                step={25}
                onChange={(v) => updateSetting('textureQuality', v / 100)}
                suffix="%"
              />
              <Slider
                label="Max Texture Size"
                value={settings.maxTextureSize}
                min={256}
                max={4096}
                step={256}
                onChange={(v) => updateSetting('maxTextureSize', v)}
                suffix="px"
              />
              <Toggle
                label="Texture Streaming"
                checked={settings.textureStreaming}
                onChange={(v) => updateSetting('textureStreaming', v)}
              />
              <Toggle
                label="Texture Compression"
                checked={settings.textureCompression}
                onChange={(v) => updateSetting('textureCompression', v)}
                disabled={!capabilities?.supportsCompression}
              />
            </div>
          )}
        </div>

        {/* Shadow Settings */}
        <div>
          <SectionHeader title="Shadows" icon={<Monitor className="w-4 h-4 text-gray-400" />} section="shadows" />
          {expandedSections.has('shadows') && (
            <div className="mt-3 space-y-4 pl-2">
              <Toggle
                label="Enable Shadows"
                checked={settings.shadows}
                onChange={(v) => updateSetting('shadows', v)}
              />
              <Slider
                label="Shadow Quality"
                value={Math.round(settings.shadowQuality * 100)}
                min={0}
                max={100}
                step={25}
                onChange={(v) => updateSetting('shadowQuality', v / 100)}
                suffix="%"
                disabled={!settings.shadows}
              />
              <Slider
                label="Shadow Distance"
                value={settings.shadowDistance}
                min={50}
                max={500}
                step={50}
                onChange={(v) => updateSetting('shadowDistance', v)}
                suffix="m"
                disabled={!settings.shadows}
              />
            </div>
          )}
        </div>

        {/* Effects Settings */}
        <div>
          <SectionHeader title="Effects" icon={<Zap className="w-4 h-4 text-orange-400" />} section="effects" />
          {expandedSections.has('effects') && (
            <div className="mt-3 space-y-3 pl-2">
              <Toggle
                label="Anti-Aliasing"
                checked={settings.antialiasing}
                onChange={(v) => updateSetting('antialiasing', v)}
              />
              <Toggle
                label="Post Processing"
                checked={settings.postProcessing}
                onChange={(v) => updateSetting('postProcessing', v)}
              />
              <Toggle
                label="Fog"
                checked={settings.fog}
                onChange={(v) => updateSetting('fog', v)}
              />
            </div>
          )}
        </div>

        {/* Performance Settings */}
        <div>
          <SectionHeader title="Performance" icon={<Cpu className="w-4 h-4 text-green-400" />} section="performance" />
          {expandedSections.has('performance') && (
            <div className="mt-3 space-y-4 pl-2">
              <Toggle
                label="VSync"
                checked={settings.vsync}
                onChange={(v) => updateSetting('vsync', v)}
              />
              <Slider
                label="FPS Limit"
                value={settings.fpsLimit}
                min={30}
                max={144}
                step={15}
                onChange={(v) => updateSetting('fpsLimit', v)}
                suffix="fps"
              />
              <Slider
                label="Instance Batch Size"
                value={settings.instanceBatchSize}
                min={100}
                max={5000}
                step={100}
                onChange={(v) => updateSetting('instanceBatchSize', v)}
                disabled={!capabilities?.supportsInstancing}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={autoDetecting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${autoDetecting ? 'animate-spin' : ''}`} />
            Auto-Detect
          </button>
          {!liveUpdate && (
            <button
              onClick={() => onSettingsChange?.(settings)}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationSettingsPanel;
