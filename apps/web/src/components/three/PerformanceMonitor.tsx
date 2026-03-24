/**
 * PerformanceMonitor Component
 * 
 * [Ver001.000] - Three.js performance monitoring display
 * 
 * Features:
 * - FPS display with history graph
 * - Draw call counter
 * - Memory usage tracking
 * - GPU stats (if available)
 * - Customizable position and styling
 * - Minimize/expand functionality
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================
// Types
// ============================================

export interface PerformanceMonitorProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Show FPS counter */
  showFPS?: boolean;
  /** Show frame time */
  showFrameTime?: boolean;
  /** Show draw calls */
  showDrawCalls?: boolean;
  /** Show memory usage */
  showMemory?: boolean;
  /** Show GPU stats */
  showGPUStats?: boolean;
  /** Show triangle count */
  showTriangles?: boolean;
  /** Show textures count */
  showTextures?: boolean;
  /** Show geometries count */
  showGeometries?: boolean;
  /** Show shaders count */
  showShaders?: boolean;
  /** FPS history length (for graph) */
  fpsHistoryLength?: number;
  /** Update interval in frames */
  updateInterval?: number;
  /** Warning threshold for FPS */
  fpsWarningThreshold?: number;
  /** Critical threshold for FPS */
  fpsCriticalThreshold?: number;
  /** Enable minimize button */
  minimizable?: boolean;
  /** Start minimized */
  startMinimized?: boolean;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

export interface PerformanceStats {
  /** Current FPS */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Draw calls per frame */
  drawCalls: number;
  /** Triangles rendered */
  triangles: number;
  /** Textures in memory */
  textures: number;
  /** Geometries in memory */
  geometries: number;
  /** Shaders compiled */
  shaders: number;
  /** Memory usage in MB (if available) */
  memoryMB: number | null;
  /** GPU memory usage in MB (if available) */
  gpuMemoryMB: number | null;
  /** Timestamp */
  timestamp: number;
}

// ============================================
// Memory Info Types
// ============================================

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: MemoryInfo;
}

interface WebGLRendererInfo {
  render: {
    calls: number;
    triangles: number;
    points: number;
    lines: number;
  };
  memory: {
    geometries: number;
    textures: number;
  };
  programs?: {
    length: number;
  };
}

// ============================================
// Stats Hook
// ============================================

function usePerformanceStats(updateInterval: number = 30): PerformanceStats {
  const { gl } = useThree();
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    shaders: 0,
    memoryMB: null,
    gpuMemoryMB: null,
    timestamp: performance.now(),
  });

  useFrame(() => {
    frameCountRef.current++;
    
    if (frameCountRef.current >= updateInterval) {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      const frameTime = delta / frameCountRef.current;
      
      // Get renderer info
      const info = gl.info as WebGLRendererInfo;
      
      // Get memory info (Chrome only)
      const perf = performance as ExtendedPerformance;
      const memoryMB = perf.memory 
        ? Math.round(perf.memory.usedJSHeapSize / 1048576)
        : null;
      
      // Estimate GPU memory (rough approximation)
      const gpuMemoryMB = null; // Would need GPU timing extensions
      
      setStats({
        fps,
        frameTime,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        textures: info.memory.textures,
        geometries: info.memory.geometries,
        shaders: info.programs?.length || 0,
        memoryMB,
        gpuMemoryMB,
        timestamp: now,
      });
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      // Reset renderer info for next frame batch
      gl.info.reset();
    }
  });

  return stats;
}

// ============================================
// FPS Graph Component
// ============================================

interface FPSGraphProps {
  fpsHistory: number[];
  maxFPS: number;
  width?: number;
  height?: number;
}

const FPSGraph: React.FC<FPSGraphProps> = ({
  fpsHistory,
  maxFPS,
  width = 100,
  height = 30,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw FPS line
    if (fpsHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      
      fpsHistory.forEach((fps, index) => {
        const x = (index / (fpsHistory.length - 1)) * width;
        const y = height - (fps / maxFPS) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // Draw target line (60 FPS)
    const targetY = height - (60 / maxFPS) * height;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([2, 2]);
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [fpsHistory, maxFPS, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded"
      style={{ width, height }}
    />
  );
};

// ============================================
// Main Component
// ============================================

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  position = 'top-right',
  showFPS = true,
  showFrameTime = true,
  showDrawCalls = true,
  showMemory = true,
  showGPUStats = false,
  showTriangles = true,
  showTextures = false,
  showGeometries = false,
  showShaders = false,
  fpsHistoryLength = 60,
  updateInterval = 30,
  fpsWarningThreshold = 45,
  fpsCriticalThreshold = 30,
  minimizable = true,
  startMinimized = false,
  className = '',
  style = {},
}) => {
  const [isMinimized, setIsMinimized] = useState(startMinimized);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const stats = usePerformanceStats(updateInterval);
  
  // Update FPS history
  useEffect(() => {
    setFpsHistory(prev => {
      const newHistory = [...prev, stats.fps];
      if (newHistory.length > fpsHistoryLength) {
        return newHistory.slice(-fpsHistoryLength);
      }
      return newHistory;
    });
  }, [stats.fps, fpsHistoryLength]);
  
  // Determine FPS color
  const fpsColor = useMemo(() => {
    if (stats.fps < fpsCriticalThreshold) return '#ef4444'; // Red
    if (stats.fps < fpsWarningThreshold) return '#f59e0b'; // Yellow
    return '#22c55e'; // Green
  }, [stats.fps, fpsWarningThreshold, fpsCriticalThreshold]);
  
  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);
  
  // Format number with commas
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString();
  }, []);
  
  return (
    <div
      className={`absolute ${positionClasses[position]} z-50 ${className}`}
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        ...style,
      }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700/50 text-xs overflow-hidden min-w-[140px]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50 bg-gray-900/50">
          <span className="text-gray-400 font-semibold">Performance</span>
          {minimizable && (
            <button
              onClick={toggleMinimize}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? '▲' : '▼'}
            </button>
          )}
        </div>
        
        {/* Content */}
        {!isMinimized && (
          <div className="p-3 space-y-2">
            {/* FPS */}
            {showFPS && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">FPS</span>
                <span style={{ color: fpsColor }} className="font-bold">
                  {stats.fps}
                </span>
              </div>
            )}
            
            {/* FPS Graph */}
            {showFPS && fpsHistory.length > 1 && (
              <FPSGraph
                fpsHistory={fpsHistory}
                maxFPS={75}
                width={120}
                height={30}
              />
            )}
            
            {/* Frame Time */}
            {showFrameTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Frame</span>
                <span className="text-gray-300">
                  {stats.frameTime.toFixed(2)}ms
                </span>
              </div>
            )}
            
            {/* Draw Calls */}
            {showDrawCalls && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Draws</span>
                <span className="text-blue-400">
                  {formatNumber(stats.drawCalls)}
                </span>
              </div>
            )}
            
            {/* Triangles */}
            {showTriangles && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tris</span>
                <span className="text-purple-400">
                  {formatNumber(stats.triangles)}
                </span>
              </div>
            )}
            
            {/* Memory */}
            {showMemory && stats.memoryMB !== null && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Memory</span>
                <span className={stats.memoryMB > 500 ? '#ef4444' : '#22c55e'}>
                  {stats.memoryMB}MB
                </span>
              </div>
            )}
            
            {/* GPU Stats */}
            {showGPUStats && (
              <>
                {stats.gpuMemoryMB !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">GPU Mem</span>
                    <span className="text-orange-400">
                      {stats.gpuMemoryMB}MB
                    </span>
                  </div>
                )}
              </>
            )}
            
            {/* Advanced Stats */}
            {(showTextures || showGeometries || showShaders) && (
              <div className="pt-2 border-t border-gray-700/50 space-y-1">
                {showTextures && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Textures</span>
                    <span className="text-gray-400">{stats.textures}</span>
                  </div>
                )}
                {showGeometries && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Geometries</span>
                    <span className="text-gray-400">{stats.geometries}</span>
                  </div>
                )}
                {showShaders && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Shaders</span>
                    <span className="text-gray-400">{stats.shaders}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Minimized indicator */}
        {isMinimized && (
          <div className="px-3 py-2">
            <span style={{ color: fpsColor }} className="font-bold">
              {stats.fps} FPS
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Simple FPS Counter (for minimal use)
// ============================================

export const SimpleFPS: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  useFrame(() => {
    frameCountRef.current++;
    
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    
    if (delta >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / delta));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });
  
  const color = fps < 30 ? '#ef4444' : fps < 45 ? '#f59e0b' : '#22c55e';
  
  return (
    <div className={`absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono ${className}`}>
      <span style={{ color }}>{fps}</span> FPS
    </div>
  );
};

// ============================================
// Performance Hook for Custom Usage
// ============================================

export function usePerformanceMonitor(updateInterval: number = 30): PerformanceStats {
  return usePerformanceStats(updateInterval);
}

export default PerformanceMonitor;
