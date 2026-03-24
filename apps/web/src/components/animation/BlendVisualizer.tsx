/** [Ver001.000]
 * Blend Visualizer Component
 * ==========================
 * Visual editor for blend trees with real-time parameter adjustment
 * and animation preview capabilities.
 * 
 * Features:
 * - Visual blend tree editor (1D/2D)
 * - Real-time parameter sliders
 * - Animation preview
 * - Weight visualization
 * - Integration with BlendTreeSystem
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BlendTreeSystem,
  type BlendTree,
  type BlendTreeType,
  type BlendClip,
  type BlendResult,
  type BlendParameterConfig,
  create1DBlendTree,
  create2DCartesianTree,
  create2DDirectionalTree,
  createMovementBlendTree,
  create8DirectionalTree,
} from '@/lib/animation/blendTree';
import { AnimationState } from '@/lib/animation/states';

// ============================================================================
// Types
// ============================================================================

interface BlendVisualizerProps {
  /** Initial tree to visualize */
  initialTree?: BlendTree;
  /** Tree type to create if no initial tree */
  treeType?: BlendTreeType;
  /** Called when blend result changes */
  onBlendChange?: (result: BlendResult) => void;
  /** Called when parameter changes */
  onParameterChange?: (name: string, value: number) => void;
  /** CSS class */
  className?: string;
  /** Show debug info */
  debug?: boolean;
}

interface BlendTreeNodeProps {
  clip: BlendClip;
  weight: number;
  isActive: boolean;
  position: { x: number; y: number };
  onClick?: () => void;
}

interface ParameterSliderProps {
  config: BlendParameterConfig;
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

// ============================================================================
// Blend Tree Node Component
// ============================================================================

const BlendTreeNode: React.FC<BlendTreeNodeProps> = ({
  clip,
  weight,
  isActive,
  position,
  onClick,
}) => {
  const nodeSize = 32 + weight * 24;
  const glowIntensity = weight * 20;

  return (
    <motion.div
      className="absolute flex items-center justify-center rounded-full cursor-pointer select-none"
      style={{
        left: position.x,
        top: position.y,
        width: nodeSize,
        height: nodeSize,
        marginLeft: -nodeSize / 2,
        marginTop: -nodeSize / 2,
        backgroundColor: isActive ? '#4ade80' : '#374151',
        boxShadow: isActive
          ? `0 0 ${glowIntensity}px rgba(74, 222, 128, ${weight * 0.8})`
          : 'none',
        border: `2px solid ${isActive ? '#22c55e' : '#4b5563'}`,
        zIndex: isActive ? 10 : 1,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      animate={{
        scale: 1 + weight * 0.2,
        backgroundColor: isActive ? '#4ade80' : '#374151',
      }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-xs font-bold text-white">
        {weight > 0.3 ? `${(weight * 100).toFixed(0)}%` : ''}
      </span>
      
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {clip.state}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Parameter Slider Component
// ============================================================================

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  config,
  value,
  onChange,
  label,
}) => {
  const percentage = ((value - config.min) / (config.max - config.min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">
          {label || config.name}
        </label>
        <span className="text-sm font-mono text-green-400">
          {value.toFixed(2)}
        </span>
      </div>
      
      <div className="relative h-6 bg-gray-700 rounded-lg overflow-hidden">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={0.01}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {/* Track background */}
        <div className="absolute inset-0 bg-gray-700" />
        
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-75"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-75"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{config.min}</span>
        <span>{config.max}</span>
      </div>
    </div>
  );
};

// ============================================================================
// 1D Blend Visualizer
// ============================================================================

const Blend1DVisualizer: React.FC<{
  tree: BlendTree;
  parameters: Map<string, number>;
  result: BlendResult;
  onParameterChange: (name: string, value: number) => void;
}> = ({ tree, parameters, result, onParameterChange }) => {
  if (tree.type !== '1d') return null;

  const clips = tree.clips;
  const value = parameters.get(tree.parameter) ?? 0;
  
  // Find min/max thresholds
  const thresholds = clips.map(c => c.threshold ?? 0);
  const minVal = Math.min(...thresholds);
  const maxVal = Math.max(...thresholds);
  const range = maxVal - minVal || 1;

  return (
    <div className="space-y-4">
      {/* Visual track */}
      <div className="relative h-20 bg-gray-800 rounded-lg overflow-hidden">
        {/* Gradient track */}
        <div className="absolute inset-x-4 inset-y-8 bg-gray-700 rounded-full" />
        
        {/* Value indicator */}
        <div
          className="absolute top-4 w-0.5 h-12 bg-green-400 transition-all duration-100"
          style={{
            left: `${4 + ((value - minVal) / range) * (100 - 8)}%`,
          }}
        />
        
        {/* Clip markers */}
        {clips.map((clip, index) => {
          const threshold = clip.threshold ?? 0;
          const weight = result.normalizedWeights.get(clip.state) ?? 0;
          const position = ((threshold - minVal) / range) * 100;
          
          return (
            <div
              key={clip.state}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${4 + (position / 100) * (100 - 8)}%` }}
            >
              <motion.div
                className="w-4 h-4 rounded-full border-2"
                style={{
                  backgroundColor: weight > 0.1 ? '#4ade80' : '#374151',
                  borderColor: weight > 0.1 ? '#22c55e' : '#4b5563',
                  boxShadow: weight > 0.1
                    ? `0 0 ${weight * 15}px rgba(74, 222, 128, 0.6)`
                    : 'none',
                }}
                animate={{ scale: 1 + weight * 0.3 }}
              />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                {clip.state}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weight bars */}
      <div className="space-y-2">
        {clips.map((clip) => {
          const weight = result.normalizedWeights.get(clip.state) ?? 0;
          return (
            <div key={clip.state} className="flex items-center gap-2">
              <span className="w-20 text-xs text-gray-400 truncate">{clip.state}</span>
              <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  initial={false}
                  animate={{ width: `${weight * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="w-12 text-xs font-mono text-right">
                {(weight * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 2D Blend Visualizer
// ============================================================================

const Blend2DVisualizer: React.FC<{
  tree: BlendTree;
  parameters: Map<string, number>;
  result: BlendResult;
  onParameterChange: (name: string, value: number) => void;
}> = ({ tree, parameters, result }) => {
  const isDirectional = tree.type === '2d-directional';
  const paramX = isDirectional ? tree.parameterX : tree.parameterX;
  const paramY = isDirectional ? tree.parameterY : tree.parameterY;
  
  const valueX = parameters.get(paramX) ?? 0;
  const valueY = parameters.get(paramY) ?? 0;

  // Normalize values to 0-1 range for display
  const normX = (valueX + 1) / 2; // Assuming -1 to 1 range
  const normY = 1 - (valueY + 1) / 2; // Invert Y for visual

  return (
    <div className="space-y-4">
      {/* 2D grid */}
      <div className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {[0.25, 0.5, 0.75].map((pos) => (
            <React.Fragment key={pos}>
              <div
                className="absolute bg-gray-700"
                style={{
                  left: `${pos * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                }}
              />
              <div
                className="absolute bg-gray-700"
                style={{
                  top: `${pos * 100}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                }}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Center crosshair */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500" />

        {/* Directional circle (for directional blend) */}
        {isDirectional && (
          <div className="absolute inset-4 border-2 border-dashed border-gray-600 rounded-full" />
        )}

        {/* Clip markers */}
        {tree.clips.map((clip) => {
          const pos = clip.position ?? { x: 0, y: 0 };
          const weight = result.normalizedWeights.get(clip.state) ?? 0;
          
          return (
            <BlendTreeNode
              key={clip.state}
              clip={clip}
              weight={weight}
              isActive={weight > 0.1}
              position={{
                x: `${50 + pos.x * 45}%`,
                y: `${50 - pos.y * 45}%`,
              }}
            />
          );
        })}

        {/* Current position indicator */}
        <motion.div
          className="absolute w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg"
          style={{
            left: `${normX * 100}%`,
            top: `${normY * 100}%`,
            marginLeft: -8,
            marginTop: -8,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Weight circles */}
      <div className="grid grid-cols-4 gap-2">
        {tree.clips.map((clip) => {
          const weight = result.normalizedWeights.get(clip.state) ?? 0;
          return (
            <div
              key={clip.state}
              className="flex flex-col items-center p-2 bg-gray-800 rounded"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: weight > 0.1 ? `rgba(74, 222, 128, ${0.2 + weight * 0.8})` : '#374151',
                  border: `2px solid ${weight > 0.1 ? '#4ade80' : '#4b5563'}`,
                }}
              >
                {(weight * 100).toFixed(0)}%
              </div>
              <span className="mt-1 text-xs text-gray-400 truncate w-full text-center">
                {clip.state}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BlendVisualizer: React.FC<BlendVisualizerProps> = ({
  initialTree,
  treeType = '1d',
  onBlendChange,
  onParameterChange,
  className = '',
  debug = false,
}) => {
  const systemRef = useRef<BlendTreeSystem | null>(null);
  const [treeId] = useState('visualizer-tree');
  const [result, setResult] = useState<BlendResult>({
    weights: new Map(),
    normalizedWeights: new Map(),
    totalWeight: 0,
    activeCount: 0,
    dominantClip: null,
  });
  const [parameters, setParameters] = useState<Map<string, number>>(new Map());
  const [paramConfigs, setParamConfigs] = useState<BlendParameterConfig[]>([]);

  // Initialize blend tree system
  useEffect(() => {
    systemRef.current = new BlendTreeSystem({ enableSmoothing: false });

    // Create default tree if none provided
    const tree = initialTree || createDefaultTree(treeType);
    
    // Register tree
    switch (tree.type) {
      case '1d':
        systemRef.current.register1DTree(treeId, tree);
        systemRef.current.registerParameter({
          name: tree.parameter,
          value: 0,
          min: 0,
          max: 1,
          clamped: true,
        });
        setParamConfigs([{
          name: tree.parameter,
          value: 0,
          min: 0,
          max: 1,
          clamped: true,
        }]);
        setParameters(new Map([[tree.parameter, 0]]));
        break;
        
      case '2d-cartesian':
        systemRef.current.register2DCartesianTree(treeId, tree);
        ['x', 'y'].forEach((axis, i) => {
          const paramName = i === 0 ? tree.parameterX : tree.parameterY;
          systemRef.current!.registerParameter({
            name: paramName,
            value: 0,
            min: -1,
            max: 1,
            clamped: true,
          });
        });
        setParamConfigs([
          { name: tree.parameterX, value: 0, min: -1, max: 1, clamped: true },
          { name: tree.parameterY, value: 0, min: -1, max: 1, clamped: true },
        ]);
        setParameters(new Map([
          [tree.parameterX, 0],
          [tree.parameterY, 0],
        ]));
        break;
        
      case '2d-directional':
        systemRef.current.register2DDirectionalTree(treeId, tree);
        ['x', 'y'].forEach((axis, i) => {
          const paramName = i === 0 ? tree.parameterX : tree.parameterY;
          systemRef.current!.registerParameter({
            name: paramName,
            value: 0,
            min: -1,
            max: 1,
            clamped: true,
          });
        });
        setParamConfigs([
          { name: tree.parameterX, value: 0, min: -1, max: 1, clamped: true },
          { name: tree.parameterY, value: 0, min: -1, max: 1, clamped: true },
        ]);
        setParameters(new Map([
          [tree.parameterX, 0],
          [tree.parameterY, 0],
        ]));
        break;
    }

    // Initial computation
    updateBlend();

    return () => {
      systemRef.current?.dispose();
    };
  }, [initialTree, treeId, treeType]);

  // Create default tree based on type
  const createDefaultTree = useCallback((type: BlendTreeType): BlendTree => {
    switch (type) {
      case '1d':
        return createMovementBlendTree('speed');
      case '2d-cartesian':
      case '2d-directional':
        return create8DirectionalTree('directionX', 'directionY');
      default:
        return createMovementBlendTree('speed');
    }
  }, []);

  // Update blend computation
  const updateBlend = useCallback(() => {
    if (!systemRef.current) return;
    
    const newResult = systemRef.current.computeBlend(treeId);
    setResult(newResult);
    onBlendChange?.(newResult);
  }, [treeId, onBlendChange]);

  // Handle parameter change
  const handleParameterChange = useCallback((name: string, value: number) => {
    if (!systemRef.current) return;

    systemRef.current.setParameter(name, value, true);
    setParameters(prev => new Map([...prev, [name, value]]));
    onParameterChange?.(name, value);
    updateBlend();
  }, [onParameterChange, updateBlend]);

  // Get current tree
  const tree = systemRef.current?.getTree(treeId);

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Blend Tree Visualizer
        </h3>
        <span className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded">
          {tree?.type.toUpperCase()}
        </span>
      </div>

      {/* Visual representation */}
      <div className="mb-6">
        {tree?.type === '1d' && (
          <Blend1DVisualizer
            tree={tree}
            parameters={parameters}
            result={result}
            onParameterChange={handleParameterChange}
          />
        )}
        {(tree?.type === '2d-cartesian' || tree?.type === '2d-directional') && (
          <Blend2DVisualizer
            tree={tree}
            parameters={parameters}
            result={result}
            onParameterChange={handleParameterChange}
          />
        )}
      </div>

      {/* Parameter controls */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-400">Parameters</h4>
        {paramConfigs.map((config) => (
          <ParameterSlider
            key={config.name}
            config={config}
            value={parameters.get(config.name) ?? config.value}
            onChange={(value) => handleParameterChange(config.name, value)}
          />
        ))}
      </div>

      {/* Blend info */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Dominant State:</span>
          <span className="font-mono text-green-400">
            {result.dominantClip || 'None'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-400">Active Clips:</span>
          <span className="font-mono text-white">{result.activeCount}</span>
        </div>
      </div>

      {/* Debug info */}
      {debug && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg font-mono text-xs">
          <h4 className="text-gray-400 mb-2">Debug</h4>
          <pre className="text-green-400 overflow-x-auto">
            {JSON.stringify(
              {
                weights: Object.fromEntries(result.weights),
                normalized: Object.fromEntries(result.normalizedWeights),
                totalWeight: result.totalWeight,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Preset Tree Selectors
// ============================================================================

interface BlendTreePresetSelectorProps {
  onSelect: (tree: BlendTree) => void;
  className?: string;
}

export const BlendTreePresetSelector: React.FC<BlendTreePresetSelectorProps> = ({
  onSelect,
  className = '',
}) => {
  const presets = [
    { name: 'Movement', tree: createMovementBlendTree(), icon: '🏃' },
    { name: '8-Directional', tree: create8DirectionalTree(), icon: '🧭' },
  ];

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset.tree)}
          className="flex items-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
        >
          <span className="text-2xl">{preset.icon}</span>
          <div>
            <div className="text-sm font-medium text-white">{preset.name}</div>
            <div className="text-xs text-gray-400">{preset.tree.type}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default BlendVisualizer;
