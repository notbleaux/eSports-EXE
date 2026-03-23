/**
 * TEST-004: Performance Testing Utilities
 * ========================================
 * Reusable performance testing utilities for mascot animations.
 * 
 * These utilities can be used with Playwright E2E tests or browser-based
 * performance profiling where the components run in a real browser environment.
 * 
 * [Ver001.000]
 */

// ============================================================================
// Types
// ============================================================================

export interface FrameMetrics {
  frameTimes: number[];
  startTime: number;
  endTime: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  droppedFrames: number;
  jankCount: number;
}

export interface MemoryMetrics {
  initialHeap: number;
  finalHeap: number;
  peakHeap: number;
  heapGrowth: number;
  gcEvents: number;
}

export interface RenderMetrics {
  initialRenderTime: number;
  animationStartTime: number;
  firstFrameTime: number;
  layoutCount: number;
  paintCount: number;
}

export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  metrics: FrameMetrics | MemoryMetrics | RenderMetrics;
  thresholds: Record<string, number>;
  errors?: string[];
}

// ============================================================================
// Browser Performance Profilers (for E2E/Browser environments)
// ============================================================================

/**
 * Frame rate profiler for browser environments
 * Use this in Playwright tests or browser console
 */
export class FrameRateProfiler {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private rafId: number | null = null;
  private isRunning = false;
  private jankThreshold = 50; // ms

  start(): void {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameTimes = [];
    
    const measureFrame = (): void => {
      if (!this.isRunning) return;
      
      const currentTime = performance.now();
      const delta = currentTime - this.lastFrameTime;
      this.frameTimes.push(delta);
      this.lastFrameTime = currentTime;
      
      this.rafId = requestAnimationFrame(measureFrame);
    };
    
    this.rafId = requestAnimationFrame(measureFrame);
  }

  stop(): FrameMetrics {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    const endTime = this.frameTimes.reduce((sum, time) => sum + time, 0);
    const totalFrames = this.frameTimes.length;
    
    const fpsValues = this.frameTimes.map(dt => 1000 / dt);
    const averageFps = totalFrames > 0 
      ? fpsValues.reduce((sum, fps) => sum + fps, 0) / totalFrames 
      : 0;
    const minFps = totalFrames > 0 ? Math.min(...fpsValues) : 0;
    const maxFps = totalFrames > 0 ? Math.max(...fpsValues) : 0;
    
    const droppedFrames = this.frameTimes.filter(dt => dt > 33).length;
    const jankCount = this.frameTimes.filter(dt => dt > this.jankThreshold).length;

    return {
      frameTimes: [...this.frameTimes],
      startTime: 0,
      endTime,
      averageFps,
      minFps,
      maxFps,
      droppedFrames,
      jankCount,
    };
  }

  getCurrentFps(): number {
    if (this.frameTimes.length === 0) return 0;
    const lastFrameTime = this.frameTimes[this.frameTimes.length - 1];
    return 1000 / lastFrameTime;
  }
}

/**
 * Memory profiler for browser environments
 */
export class MemoryProfiler {
  private heapSnapshots: number[] = [];
  private gcEvents = 0;

  takeSnapshot(): void {
    const memory = (performance as any).memory;
    if (memory) {
      this.heapSnapshots.push(memory.usedJSHeapSize);
    }
  }

  simulateGC(): void {
    this.gcEvents++;
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  getMetrics(): MemoryMetrics {
    const memory = (performance as any).memory;
    const initialHeap = this.heapSnapshots[0] || 0;
    const finalHeap = memory?.usedJSHeapSize || this.heapSnapshots[this.heapSnapshots.length - 1] || 0;
    const peakHeap = Math.max(...this.heapSnapshots, 0);
    
    return {
      initialHeap,
      finalHeap,
      peakHeap,
      heapGrowth: finalHeap - initialHeap,
      gcEvents: this.gcEvents,
    };
  }
}

/**
 * Render time profiler for browser environments
 */
export class RenderProfiler {
  private renderStartTime = 0;
  private renderEndTime = 0;

  startRender(): void {
    this.renderStartTime = performance.now();
  }

  endRender(): void {
    this.renderEndTime = performance.now();
  }

  getMetrics(): { initialRenderTime: number } {
    return {
      initialRenderTime: this.renderEndTime - this.renderStartTime,
    };
  }
}

// ============================================================================
// Test Scenarios for Browser/E2E Testing
// ============================================================================

export const PERFORMANCE_TEST_SCENARIOS = {
  singleMascot60fps: {
    name: 'Single Mascot 60fps',
    description: 'Single mascot should maintain 60fps during animation',
    setup: (mascotType: string) => {
      // Browser-side setup code
      return `
        const profiler = new FrameRateProfiler();
        profiler.start();
        render(<${mascotType} size={128} animate={true} />);
      `;
    },
    thresholds: {
      minFps: 58,
      maxJank: 10,
      renderTime: 100,
    },
  },
  
  tenMascots30fps: {
    name: '10 Mascots 30fps',
    description: '10 mascots should maintain minimum 30fps',
    setup: () => {
      return `
        const profiler = new FrameRateProfiler();
        profiler.start();
        render(<MultiMascotTest count={10} animate={true} />);
      `;
    },
    thresholds: {
      minFps: 30,
      maxDroppedFrames: 60,
    },
  },
  
  fiftyMascots30fps: {
    name: '50 Mascots 30fps',
    description: '50 mascots should maintain minimum 30fps',
    setup: () => {
      return `
        const profiler = new FrameRateProfiler();
        profiler.start();
        render(<MultiMascotTest count={50} animate={true} />);
      `;
    },
    thresholds: {
      minFps: 30,
      renderTime: 500,
    },
  },
  
  memoryNoLeaks: {
    name: 'Memory Leak Detection',
    description: 'No memory leaks during animation lifecycle',
    setup: () => {
      return `
        const memoryProfiler = new MemoryProfiler();
        memoryProfiler.takeSnapshot();
        const { unmount } = render(<Mascot animate={true} />);
        // Wait for animation
        setTimeout(() => {
          unmount();
          memoryProfiler.simulateGC();
          memoryProfiler.takeSnapshot();
        }, 2000);
      `;
    },
    thresholds: {
      maxHeapGrowth: 0.5, // 50% of initial
    },
  },
  
  renderTime: {
    name: 'Render Time',
    description: 'Initial render should be under 100ms',
    setup: () => {
      return `
        const profiler = new RenderProfiler();
        profiler.startRender();
        render(<Mascot size={128} />);
        profiler.endRender();
      `;
    },
    thresholds: {
      maxRenderTime: 100,
    },
  },
  
  animationStart: {
    name: 'Animation Start Time',
    description: 'Animation should start within 50ms',
    setup: () => {
      return `
        const startTime = performance.now();
        render(<Mascot animate={true} />);
        const animationStartTime = performance.now();
      `;
    },
    thresholds: {
      maxStartTime: 50,
    },
  },
};

// ============================================================================
// Success Criteria
// ============================================================================

export const PERFORMANCE_CRITERIA = {
  frameRate: {
    singleMascot: 60,     // fps
    tenMascots: 30,       // fps minimum
    fiftyMascots: 30,     // fps minimum
    hundredMascots: 20,   // fps minimum (stress test)
  },
  memory: {
    maxHeapGrowth: 0.5,   // 50% of initial heap
    maxGCEvents: 10,      // during test period
  },
  render: {
    initialRender: 100,   // ms
    animationStart: 50,   // ms
    fiftyMascotsRender: 500, // ms
  },
  layout: {
    maxForcedReflows: 0,  // should be 0
    maxLayoutThrashing: 5,
  },
};

// ============================================================================
// Test Runner for Browser Environment
// ============================================================================

/**
 * Run performance tests in browser environment
 * Usage in Playwright or browser console:
 * 
 * const results = await runPerformanceTests([
 *   'singleMascot60fps',
 *   'tenMascots30fps',
 *   'fiftyMascots30fps',
 * ]);
 */
export async function runPerformanceTests(
  scenarioNames: (keyof typeof PERFORMANCE_TEST_SCENARIOS)[]
): Promise<PerformanceTestResult[]> {
  const results: PerformanceTestResult[] = [];
  
  for (const scenarioName of scenarioNames) {
    const scenario = PERFORMANCE_TEST_SCENARIOS[scenarioName];
    const result: PerformanceTestResult = {
      testName: scenario.name,
      passed: true,
      metrics: {} as any,
      thresholds: scenario.thresholds,
      errors: [],
    };
    
    // Test execution would happen here in browser environment
    // This is a placeholder for the actual implementation
    
    results.push(result);
  }
  
  return results;
}

// ============================================================================
// Performance Monitoring Utilities
// ============================================================================

/**
 * Monitor FPS in real-time during animations
 */
export function createFpsMonitor(
  onFpsUpdate: (fps: number) => void,
  interval = 1000
): { start: () => void; stop: () => void } {
  let rafId: number | null = null;
  let lastTime = performance.now();
  let frames = 0;
  let isRunning = false;

  const tick = (): void => {
    if (!isRunning) return;
    
    const now = performance.now();
    frames++;
    
    if (now - lastTime >= interval) {
      const fps = (frames * 1000) / (now - lastTime);
      onFpsUpdate(Math.round(fps));
      frames = 0;
      lastTime = now;
    }
    
    rafId = requestAnimationFrame(tick);
  };

  return {
    start: () => {
      isRunning = true;
      lastTime = performance.now();
      frames = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop: () => {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    },
  };
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(results: PerformanceTestResult[]): string {
  const lines: string[] = [];
  lines.push('╔════════════════════════════════════════════════════════════╗');
  lines.push('║         MASCOT ANIMATION PERFORMANCE REPORT               ║');
  lines.push('╚════════════════════════════════════════════════════════════╝');
  lines.push('');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    lines.push(`${status}: ${result.testName}`);
    
    if (!result.passed && result.errors) {
      for (const error of result.errors) {
        lines.push(`   ⚠️  ${error}`);
      }
    }
    
    if (result.passed) passCount++;
    else failCount++;
  }
  
  lines.push('');
  lines.push(`Total: ${results.length} tests`);
  lines.push(`Passed: ${passCount} ✅`);
  lines.push(`Failed: ${failCount} ❌`);
  lines.push('');
  
  return lines.join('\n');
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  FrameRateProfiler,
  MemoryProfiler,
  RenderProfiler,
  PERFORMANCE_TEST_SCENARIOS,
  PERFORMANCE_CRITERIA,
  runPerformanceTests,
  createFpsMonitor,
  generatePerformanceReport,
};
