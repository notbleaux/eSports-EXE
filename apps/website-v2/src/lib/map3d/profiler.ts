/**
 * Performance Profiler for 3D Maps
 * 
 * [Ver001.000] - Comprehensive performance monitoring and budgets
 * 
 * Provides:
 * - Frame time tracking with rolling averages
 * - Draw call counting and optimization
 * - Memory monitoring (GPU and CPU)
 * - Performance budgets with alerts
 * - FPS profiling with percentile tracking
 * - Bottleneck identification
 * 
 * @example
 * ```typescript
 * import { MapPerformanceProfiler } from '@/lib/map3d/profiler';
 * 
 * const profiler = new MapPerformanceProfiler({
 *   targetFPS: 60,
 *   frameTimeBudget: 16.67,
 *   drawCallBudget: 100,
 *   memoryBudget: 200 * 1024 * 1024,
 * });
 * 
 * profiler.beginFrame();
 * // Render...
 * profiler.endFrame();
 * 
 * const stats = profiler.getStats();
 * ```
 */

import * as THREE from 'three';

// ============================================
// Types
// ============================================

export interface ProfilerConfig {
  /** Target FPS (default: 60) */
  targetFPS: number;
  /** Frame time budget in ms (default: 16.67 for 60fps) */
  frameTimeBudget: number;
  /** Draw call budget (default: 100) */
  drawCallBudget: number;
  /** GPU memory budget in bytes (default: 200MB) */
  memoryBudget: number;
  /** History size for rolling averages */
  historySize: number;
  /** Alert threshold (budget multiplier) */
  alertThreshold: number;
  /** Enable detailed GPU profiling */
  enableGPUProfiling: boolean;
  /** Enable memory tracking */
  enableMemoryTracking: boolean;
  /** Callback when budget exceeded */
  onBudgetExceeded?: (type: BudgetType, value: number, budget: number) => void;
  /** Callback for performance alerts */
  onAlert?: (alert: PerformanceAlert) => void;
}

export type BudgetType = 'frameTime' | 'drawCalls' | 'memory' | 'fps';

export interface PerformanceAlert {
  type: BudgetType;
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  budget: number;
  timestamp: number;
}

export interface FrameMetrics {
  frameNumber: number;
  frameTime: number;
  renderTime: number;
  cpuTime: number;
  gpuTime: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  memoryUsed: number;
  timestamp: number;
}

export interface ProfileStats {
  // FPS
  currentFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  fpsPercentile1: number;
  fpsPercentile5: number;
  fpsPercentile95: number;
  fpsPercentile99: number;

  // Frame Time
  currentFrameTime: number;
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameTimePercentile95: number;
  frameTimePercentile99: number;

  // Draw Calls
  currentDrawCalls: number;
  averageDrawCalls: number;
  maxDrawCalls: number;

  // Memory
  currentMemory: number;
  peakMemory: number;
  textureMemory: number;
  geometryMemory: number;

  // Budget Status
  frameTimeOverBudget: boolean;
  drawCallsOverBudget: boolean;
  memoryOverBudget: boolean;
  fpsUnderBudget: boolean;

  // Bottlenecks
  primaryBottleneck: BottleneckType;
  bottleneckScore: number;

  // Timing
  totalFrames: number;
  elapsedTime: number;
}

export type BottleneckType =
  | 'none'
  | 'cpu'
  | 'gpu'
  | 'fill-rate'
  | 'draw-calls'
  | 'memory'
  | 'unknown';

export interface BudgetStatus {
  type: BudgetType;
  current: number;
  budget: number;
  utilization: number;
  status: 'ok' | 'warning' | 'exceeded';
}

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_PROFILER_CONFIG: ProfilerConfig = {
  targetFPS: 60,
  frameTimeBudget: 1000 / 60, // 16.67ms
  drawCallBudget: 100,
  memoryBudget: 200 * 1024 * 1024, // 200MB
  historySize: 120, // 2 seconds at 60fps
  alertThreshold: 1.5,
  enableGPUProfiling: false,
  enableMemoryTracking: true,
};

// ============================================
// Circular Buffer for Metrics
// ============================================

class CircularBuffer<T> {
  private buffer: T[];
  private size: number;
  private index = 0;
  private count = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size);
  }

  push(value: T): void {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }

  get(index: number): T | undefined {
    if (index >= this.count) return undefined;
    const actualIndex = (this.index - this.count + index + this.size) % this.size;
    return this.buffer[actualIndex];
  }

  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.get(i)!);
    }
    return result;
  }

  getRecent(n: number): T[] {
    const result: T[] = [];
    const start = Math.max(0, this.count - n);
    for (let i = start; i < this.count; i++) {
      result.push(this.get(i)!);
    }
    return result;
  }

  clear(): void {
    this.index = 0;
    this.count = 0;
  }

  get length(): number {
    return this.count;
  }

  calculatePercentile(percentile: number): number | undefined {
    if (this.count === 0) return undefined;

    const values = this.getAll()
      .map((v) => (typeof v === 'number' ? v : 0))
      .sort((a, b) => a - b);

    const index = Math.floor((percentile / 100) * values.length);
    return values[Math.min(index, values.length - 1)];
  }

  calculateAverage(): number {
    if (this.count === 0) return 0;

    const values = this.getAll().map((v) => (typeof v === 'number' ? v : 0));
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// ============================================
// GPU Timer
// ============================================

class GPUTimer {
  private gl: WebGL2RenderingContext | null = null;
  private query: WebGLQuery | null = null;
  private ext: { TIME_ELAPSED_EXT: number } | null = null;
  private available = false;
  private pending = false;

  constructor(renderer: THREE.WebGLRenderer) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    this.gl = gl;

    // Check for timer query extension
    this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (this.ext) {
      this.query = gl.createQuery();
      this.available = true;
    }
  }

  /**
   * Begin GPU timing
   */
  begin(): void {
    if (!this.available || !this.query || !this.gl) return;

    this.gl.beginQuery(this.ext!.TIME_ELAPSED_EXT, this.query);
    this.pending = true;
  }

  /**
   * End GPU timing
   */
  end(): void {
    if (!this.available || !this.query || !this.gl || !this.pending) return;

    this.gl.endQuery(this.ext!.TIME_ELAPSED_EXT);
  }

  /**
   * Get elapsed time in ms
   */
  getResult(): number | null {
    if (!this.available || !this.query || !this.gl || !this.pending) return null;

    const gl = this.gl;
    const available = gl.getQueryParameter(this.query, gl.QUERY_RESULT_AVAILABLE);

    if (available) {
      const result = gl.getQueryParameter(this.query, gl.QUERY_RESULT);
      this.pending = false;
      // Convert nanoseconds to milliseconds
      return result / 1_000_000;
    }

    return null;
  }

  /**
   * Check if timing is supported
   */
  isSupported(): boolean {
    return this.available;
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.gl && this.query) {
      this.gl.deleteQuery(this.query);
    }
    this.query = null;
    this.gl = null;
    this.available = false;
  }
}

// ============================================
// Memory Tracker
// ============================================

class MemoryTracker {
  private renderer: THREE.WebGLRenderer;
  private textureMemory = 0;
  private geometryMemory = 0;
  private cachedInfo: THREE.WebGLInfo | null = null;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }

  /**
   * Update memory statistics
   */
  update(): void {
    const info = this.renderer.info;
    this.cachedInfo = info;

    // Estimate memory usage
    // This is an approximation - actual GPU memory may differ
    this.textureMemory = this.estimateTextureMemory();
    this.geometryMemory = this.estimateGeometryMemory();
  }

  /**
   * Estimate texture memory
   */
  private estimateTextureMemory(): number {
    // Get renderer info
    const textures = this.renderer.info.memory.textures;

    // Rough estimate: assume average texture is 1MB
    return textures * 1024 * 1024;
  }

  /**
   * Estimate geometry memory
   */
  private estimateGeometryMemory(): number {
    const geometries = this.renderer.info.memory.geometries;

    // Rough estimate
    return geometries * 512 * 1024;
  }

  /**
   * Get total memory estimate
   */
  getTotalMemory(): number {
    return this.textureMemory + this.geometryMemory;
  }

  /**
   * Get texture memory
   */
  getTextureMemory(): number {
    return this.textureMemory;
  }

  /**
   * Get geometry memory
   */
  getGeometryMemory(): number {
    return this.geometryMemory;
  }

  /**
   * Get renderer info
   */
  getRendererInfo(): THREE.WebGLInfo | null {
    return this.cachedInfo;
  }
}

// ============================================
// Main Performance Profiler
// ============================================

export class MapPerformanceProfiler {
  private config: ProfilerConfig;
  private renderer: THREE.WebGLRenderer | null = null;
  private gpuTimer: GPUTimer | null = null;
  private memoryTracker: MemoryTracker | null = null;

  // Metrics storage
  private frameTimes: CircularBuffer<number>;
  private frameTimesGPU: CircularBuffer<number>;
  private drawCalls: CircularBuffer<number>;
  private memoryUsage: CircularBuffer<number>;
  private fpsValues: CircularBuffer<number>;

  // Frame tracking
  private frameNumber = 0;
  private frameStartTime = 0;
  private renderStartTime = 0;
  private lastFrameTime = 0;
  private startTime = performance.now();

  // FPS calculation
  private frameCount = 0;
  private fpsUpdateTime = 0;
  private currentFPS = 0;

  // Budget tracking
  private budgetExceeded = new Set<BudgetType>();
  private alerts: PerformanceAlert[] = [];

  // Bottleneck detection
  private bottleneckHistory: CircularBuffer<BottleneckType>;

  constructor(
    renderer: THREE.WebGLRenderer | null = null,
    config: Partial<ProfilerConfig> = {}
  ) {
    this.config = { ...DEFAULT_PROFILER_CONFIG, ...config };
    this.renderer = renderer;

    // Initialize buffers
    this.frameTimes = new CircularBuffer<number>(this.config.historySize);
    this.frameTimesGPU = new CircularBuffer<number>(this.config.historySize);
    this.drawCalls = new CircularBuffer<number>(this.config.historySize);
    this.memoryUsage = new CircularBuffer<number>(this.config.historySize);
    this.fpsValues = new CircularBuffer<number>(this.config.historySize);
    this.bottleneckHistory = new CircularBuffer<BottleneckType>(30);

    // Initialize GPU timer if available
    if (renderer && this.config.enableGPUProfiling) {
      this.gpuTimer = new GPUTimer(renderer);
    }

    // Initialize memory tracker
    if (renderer && this.config.enableMemoryTracking) {
      this.memoryTracker = new MemoryTracker(renderer);
    }
  }

  /**
   * Begin frame profiling
   */
  beginFrame(): void {
    this.frameStartTime = performance.now();
    this.frameNumber++;

    // Update FPS
    this.updateFPS();

    // Begin GPU timing
    this.gpuTimer?.begin();
  }

  /**
   * Begin render section
   */
  beginRender(): void {
    this.renderStartTime = performance.now();
  }

  /**
   * End render section
   */
  endRender(): void {
    // End GPU timing
    this.gpuTimer?.end();
  }

  /**
   * End frame profiling
   */
  endFrame(): FrameMetrics {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;
    const renderTime = now - this.renderStartTime;

    // Get GPU time if available
    const gpuTime = this.gpuTimer?.getResult() || 0;
    const cpuTime = Math.max(0, frameTime - gpuTime);

    // Get renderer stats
    const renderInfo = this.renderer?.info.render;
    const drawCalls = renderInfo?.calls || 0;
    const triangles = renderInfo?.triangles || 0;

    // Update memory tracking
    this.memoryTracker?.update();
    const memoryUsed = this.memoryTracker?.getTotalMemory() || 0;

    // Store metrics
    this.frameTimes.push(frameTime);
    this.frameTimesGPU.push(gpuTime);
    this.drawCalls.push(drawCalls);
    this.memoryUsage.push(memoryUsed);
    this.fpsValues.push(this.currentFPS);

    // Detect bottleneck
    const bottleneck = this.detectBottleneck(frameTime, renderTime, cpuTime, gpuTime, drawCalls);
    this.bottleneckHistory.push(bottleneck);

    // Check budgets
    this.checkBudgets(frameTime, drawCalls, memoryUsed);

    const metrics: FrameMetrics = {
      frameNumber: this.frameNumber,
      frameTime,
      renderTime,
      cpuTime,
      gpuTime,
      drawCalls,
      triangles,
      textures: this.memoryTracker?.getRendererInfo()?.memory.textures || 0,
      geometries: this.memoryTracker?.getRendererInfo()?.memory.geometries || 0,
      memoryUsed,
      timestamp: now,
    };

    this.lastFrameTime = frameTime;
    return metrics;
  }

  /**
   * Update FPS calculation
   */
  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.fpsUpdateTime >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }

  /**
   * Detect performance bottleneck
   */
  private detectBottleneck(
    frameTime: number,
    renderTime: number,
    cpuTime: number,
    gpuTime: number,
    drawCalls: number
  ): BottleneckType {
    if (frameTime < this.config.frameTimeBudget * 0.8) {
      return 'none';
    }

    // Check draw calls
    if (drawCalls > this.config.drawCallBudget * 0.9) {
      return 'draw-calls';
    }

    // Compare CPU vs GPU time
    if (gpuTime > 0) {
      if (cpuTime > gpuTime * 1.5) {
        return 'cpu';
      } else if (gpuTime > cpuTime * 1.5) {
        // GPU bound - check if fill rate
        if (renderTime > frameTime * 0.7) {
          return 'fill-rate';
        }
        return 'gpu';
      }
    }

    // Check memory
    const memory = this.memoryTracker?.getTotalMemory() || 0;
    if (memory > this.config.memoryBudget * 0.9) {
      return 'memory';
    }

    return 'unknown';
  }

  /**
   * Check performance budgets
   */
  private checkBudgets(frameTime: number, drawCalls: number, memory: number): void {
    const alerts: PerformanceAlert[] = [];

    // Frame time budget
    if (frameTime > this.config.frameTimeBudget) {
      if (!this.budgetExceeded.has('frameTime')) {
        this.budgetExceeded.add('frameTime');
        alerts.push({
          type: 'frameTime',
          severity: frameTime > this.config.frameTimeBudget * this.config.alertThreshold ? 'critical' : 'warning',
          message: `Frame time ${frameTime.toFixed(2)}ms exceeds budget ${this.config.frameTimeBudget.toFixed(2)}ms`,
          value: frameTime,
          budget: this.config.frameTimeBudget,
          timestamp: performance.now(),
        });
      }
    } else {
      this.budgetExceeded.delete('frameTime');
    }

    // Draw call budget
    if (drawCalls > this.config.drawCallBudget) {
      if (!this.budgetExceeded.has('drawCalls')) {
        this.budgetExceeded.add('drawCalls');
        alerts.push({
          type: 'drawCalls',
          severity: drawCalls > this.config.drawCallBudget * this.config.alertThreshold ? 'critical' : 'warning',
          message: `Draw calls ${drawCalls} exceeds budget ${this.config.drawCallBudget}`,
          value: drawCalls,
          budget: this.config.drawCallBudget,
          timestamp: performance.now(),
        });
      }
    } else {
      this.budgetExceeded.delete('drawCalls');
    }

    // Memory budget
    if (memory > this.config.memoryBudget) {
      if (!this.budgetExceeded.has('memory')) {
        this.budgetExceeded.add('memory');
        alerts.push({
          type: 'memory',
          severity: memory > this.config.memoryBudget * this.config.alertThreshold ? 'critical' : 'warning',
          message: `Memory ${(memory / 1024 / 1024).toFixed(1)}MB exceeds budget ${(this.config.memoryBudget / 1024 / 1024).toFixed(1)}MB`,
          value: memory,
          budget: this.config.memoryBudget,
          timestamp: performance.now(),
        });
      }
    } else {
      this.budgetExceeded.delete('memory');
    }

    // FPS budget
    if (this.currentFPS < this.config.targetFPS * 0.9) {
      if (!this.budgetExceeded.has('fps')) {
        this.budgetExceeded.add('fps');
        alerts.push({
          type: 'fps',
          severity: this.currentFPS < this.config.targetFPS * 0.5 ? 'critical' : 'warning',
          message: `FPS ${this.currentFPS} below target ${this.config.targetFPS}`,
          value: this.currentFPS,
          budget: this.config.targetFPS,
          timestamp: performance.now(),
        });
      }
    } else {
      this.budgetExceeded.delete('fps');
    }

    // Dispatch alerts
    alerts.forEach((alert) => {
      this.alerts.push(alert);
      this.config.onAlert?.(alert);
      this.config.onBudgetExceeded?.(alert.type, alert.value, alert.budget);
    });
  }

  /**
   * Get current statistics
   */
  getStats(): ProfileStats {
    const avgFrameTime = this.frameTimes.calculateAverage();
    const avgDrawCalls = this.drawCalls.calculateAverage();
    const avgFPS = this.fpsValues.calculateAverage();

    // Calculate primary bottleneck
    const bottleneckCounts = new Map<BottleneckType, number>();
    const recentBottlenecks = this.bottleneckHistory.getAll();
    recentBottlenecks.forEach((b) => {
      bottleneckCounts.set(b, (bottleneckCounts.get(b) || 0) + 1);
    });

    let primaryBottleneck: BottleneckType = 'none';
    let maxCount = 0;
    bottleneckCounts.forEach((count, type) => {
      if (count > maxCount && type !== 'none') {
        maxCount = count;
        primaryBottleneck = type;
      }
    });

    const bottleneckScore = recentBottlenecks.length > 0 ? maxCount / recentBottlenecks.length : 0;

    return {
      // FPS
      currentFPS: this.currentFPS,
      averageFPS: avgFPS,
      minFPS: Math.min(...this.fpsValues.getAll()),
      maxFPS: Math.max(...this.fpsValues.getAll()),
      fpsPercentile1: this.fpsValues.calculatePercentile(1) || 0,
      fpsPercentile5: this.fpsValues.calculatePercentile(5) || 0,
      fpsPercentile95: this.fpsValues.calculatePercentile(95) || 0,
      fpsPercentile99: this.fpsValues.calculatePercentile(99) || 0,

      // Frame Time
      currentFrameTime: this.lastFrameTime,
      averageFrameTime: avgFrameTime,
      minFrameTime: Math.min(...this.frameTimes.getAll()),
      maxFrameTime: Math.max(...this.frameTimes.getAll()),
      frameTimePercentile95: this.frameTimes.calculatePercentile(95) || 0,
      frameTimePercentile99: this.frameTimes.calculatePercentile(99) || 0,

      // Draw Calls
      currentDrawCalls: this.drawCalls.get(this.drawCalls.length - 1) || 0,
      averageDrawCalls: avgDrawCalls,
      maxDrawCalls: Math.max(...this.drawCalls.getAll()),

      // Memory
      currentMemory: this.memoryUsage.get(this.memoryUsage.length - 1) || 0,
      peakMemory: Math.max(...this.memoryUsage.getAll()),
      textureMemory: this.memoryTracker?.getTextureMemory() || 0,
      geometryMemory: this.memoryTracker?.getGeometryMemory() || 0,

      // Budget Status
      frameTimeOverBudget: this.budgetExceeded.has('frameTime'),
      drawCallsOverBudget: this.budgetExceeded.has('drawCalls'),
      memoryOverBudget: this.budgetExceeded.has('memory'),
      fpsUnderBudget: this.budgetExceeded.has('fps'),

      // Bottlenecks
      primaryBottleneck,
      bottleneckScore,

      // Timing
      totalFrames: this.frameNumber,
      elapsedTime: performance.now() - this.startTime,
    };
  }

  /**
   * Get budget status for all metrics
   */
  getBudgetStatus(): BudgetStatus[] {
    const stats = this.getStats();

    return [
      {
        type: 'frameTime',
        current: stats.currentFrameTime,
        budget: this.config.frameTimeBudget,
        utilization: stats.currentFrameTime / this.config.frameTimeBudget,
        status: this.getStatusLevel(stats.currentFrameTime, this.config.frameTimeBudget),
      },
      {
        type: 'drawCalls',
        current: stats.currentDrawCalls,
        budget: this.config.drawCallBudget,
        utilization: stats.currentDrawCalls / this.config.drawCallBudget,
        status: this.getStatusLevel(stats.currentDrawCalls, this.config.drawCallBudget),
      },
      {
        type: 'memory',
        current: stats.currentMemory,
        budget: this.config.memoryBudget,
        utilization: stats.currentMemory / this.config.memoryBudget,
        status: this.getStatusLevel(stats.currentMemory, this.config.memoryBudget),
      },
      {
        type: 'fps',
        current: this.config.targetFPS - stats.currentFPS,
        budget: 0,
        utilization: stats.currentFPS / this.config.targetFPS,
        status: stats.currentFPS >= this.config.targetFPS * 0.95 ? 'ok' : 
                 stats.currentFPS >= this.config.targetFPS * 0.8 ? 'warning' : 'exceeded',
      },
    ];
  }

  /**
   * Get status level based on utilization
   */
  private getStatusLevel(current: number, budget: number): 'ok' | 'warning' | 'exceeded' {
    const ratio = current / budget;
    if (ratio < 0.8) return 'ok';
    if (ratio < 1.0) return 'warning';
    return 'exceeded';
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 10): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get frame history
   */
  getFrameHistory(count?: number): FrameMetrics[] {
    // Simplified - would need to store full frame metrics
    return [];
  }

  /**
   * Reset profiler
   */
  reset(): void {
    this.frameTimes.clear();
    this.frameTimesGPU.clear();
    this.drawCalls.clear();
    this.memoryUsage.clear();
    this.fpsValues.clear();
    this.bottleneckHistory.clear();
    this.budgetExceeded.clear();
    this.alerts = [];
    this.frameNumber = 0;
    this.startTime = performance.now();
  }

  /**
   * Dispose profiler
   */
  dispose(): void {
    this.gpuTimer?.dispose();
    this.reset();
  }
}

// ============================================
// Performance Budget Manager
// ============================================

export class PerformanceBudgetManager {
  private budgets = new Map<BudgetType, number>();
  private callbacks = new Map<BudgetType, Array<(value: number, budget: number) => void>>();

  /**
   * Set budget for metric
   */
  setBudget(type: BudgetType, value: number): void {
    this.budgets.set(type, value);
  }

  /**
   * Get budget for metric
   */
  getBudget(type: BudgetType): number | undefined {
    return this.budgets.get(type);
  }

  /**
   * Check if value is within budget
   */
  checkBudget(type: BudgetType, value: number): boolean {
    const budget = this.budgets.get(type);
    if (budget === undefined) return true;

    // For FPS, higher is better
    if (type === 'fps') {
      return value >= budget;
    }

    return value <= budget;
  }

  /**
   * Get budget utilization
   */
  getUtilization(type: BudgetType, value: number): number {
    const budget = this.budgets.get(type);
    if (budget === undefined || budget === 0) return 0;

    if (type === 'fps') {
      return Math.min(1, value / budget);
    }

    return value / budget;
  }

  /**
   * Register callback for budget exceeded
   */
  onBudgetExceeded(
    type: BudgetType,
    callback: (value: number, budget: number) => void
  ): () => void {
    if (!this.callbacks.has(type)) {
      this.callbacks.set(type, []);
    }
    this.callbacks.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify budget exceeded
   */
  notifyBudgetExceeded(type: BudgetType, value: number): void {
    const budget = this.budgets.get(type);
    if (budget === undefined) return;

    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(value, budget));
    }
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format time to human readable
 */
export function formatTime(ms: number): string {
  if (ms < 1) return (ms * 1000).toFixed(2) + ' μs';
  if (ms < 1000) return ms.toFixed(2) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

/**
 * Calculate FPS from frame times
 */
export function calculateFPS(frameTimes: number[]): number {
  if (frameTimes.length === 0) return 0;
  const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
}

/**
 * Detect performance regression
 */
export function detectRegression(
  current: number,
  baseline: number,
  threshold = 0.1
): boolean {
  return (current - baseline) / baseline > threshold;
}

export default MapPerformanceProfiler;
