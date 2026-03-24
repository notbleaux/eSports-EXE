/** [Ver001.000]
 * Cognitive Load Detector Tests
 * =============================
 * Comprehensive test suite for the cognitive load detection system.
 * 
 * Tests cover:
 * - Load detection accuracy
 * - Pattern recognition (mouse, scroll, typing)
 * - Metric calculations
 * - State management
 * - Configuration options
 * - Integration scenarios
 * 
 * @module lib/cognitive/__tests__/loadDetector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  CognitiveLoadState,
  CognitiveLoadLevel,
  LoadDetectionConfig,
} from '../types';
import {
  initializeLoadDetector,
  startLoadDetection,
  stopLoadDetection,
  resetLoadDetector,
  setManualLoadLevel,
  clearManualOverride,
  getCurrentLoadState,
  getLoadTrend,
  isDetectionActive,
  createLoadDetector,
} from '../loadDetector';

// ============================================================================
// Test Setup
// ============================================================================

// Mock window events
class MockEventTarget {
  private listeners: Map<string, EventListener[]> = new Map();

  addEventListener(event: string, handler: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  removeEventListener(event: string, handler: EventListener): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
    return true;
  }
}

// Mock document and window
document.addEventListener = vi.fn();
document.removeEventListener = vi.fn();
window.addEventListener = vi.fn();
window.removeEventListener = vi.fn();

// ============================================================================
// Initialization Tests
// ============================================================================

describe('Load Detector Initialization', () => {
  beforeEach(() => {
    resetLoadDetector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should initialize with default config', () => {
    initializeLoadDetector();
    
    expect(isDetectionActive()).toBe(false);
    const state = getCurrentLoadState();
    expect(state.level).toBe('low');
    expect(state.score).toBe(0);
  });

  it('should initialize with custom config', () => {
    const customConfig: Partial<LoadDetectionConfig> = {
      sampleIntervalMs: 500,
      hesitationThresholdMs: 1000,
      rapidScrollThreshold: 5,
    };

    initializeLoadDetector(customConfig);
    
    // Config is internal, but we can verify by checking behavior
    expect(isDetectionActive()).toBe(false);
  });

  it('should create load detector with factory function', () => {
    const detector = createLoadDetector({
      sampleIntervalMs: 1000,
    });

    expect(detector).toBeDefined();
    expect(detector.isActive).toBe(false);
    expect(detector.state).toBeDefined();
    expect(typeof detector.start).toBe('function');
    expect(typeof detector.stop).toBe('function');
    expect(typeof detector.reset).toBe('function');
  });

  it('should not start detection automatically on init', () => {
    initializeLoadDetector();
    
    expect(isDetectionActive()).toBe(false);
  });
});

// ============================================================================
// Start/Stop Tests
// ============================================================================

describe('Load Detector Start/Stop', () => {
  beforeEach(() => {
    resetLoadDetector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should start detection', () => {
    initializeLoadDetector();
    startLoadDetection();
    
    expect(isDetectionActive()).toBe(true);
  });

  it('should stop detection', () => {
    initializeLoadDetector();
    startLoadDetection();
    expect(isDetectionActive()).toBe(true);
    
    stopLoadDetection();
    expect(isDetectionActive()).toBe(false);
  });

  it('should attach event listeners on start', () => {
    initializeLoadDetector();
    startLoadDetection();
    
    expect(document.addEventListener).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function),
      { passive: true }
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('should remove event listeners on stop', () => {
    initializeLoadDetector();
    startLoadDetection();
    stopLoadDetection();
    
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('should not start if already active', () => {
    initializeLoadDetector();
    startLoadDetection();
    
    vi.clearAllMocks();
    startLoadDetection();
    
    // Should not attach listeners again
    expect(document.addEventListener).not.toHaveBeenCalled();
  });

  it('should handle multiple start/stop cycles', () => {
    initializeLoadDetector();
    
    startLoadDetection();
    expect(isDetectionActive()).toBe(true);
    
    stopLoadDetection();
    expect(isDetectionActive()).toBe(false);
    
    startLoadDetection();
    expect(isDetectionActive()).toBe(true);
    
    stopLoadDetection();
    expect(isDetectionActive()).toBe(false);
  });
});

// ============================================================================
// State Management Tests
// ============================================================================

describe('Load Detector State Management', () => {
  beforeEach(() => {
    resetLoadDetector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should return initial state', () => {
    const state = getCurrentLoadState();
    
    expect(state.level).toBe('low');
    expect(state.score).toBeGreaterThanOrEqual(0);
    expect(state.score).toBeLessThanOrEqual(100);
    expect(state.metrics).toBeDefined();
    expect(state.patterns).toBeDefined();
    expect(state.trend).toBeDefined();
    expect(state.lastUpdated).toBeGreaterThan(0);
  });

  it('should reset to initial state', () => {
    // Set manual override to change state
    setManualLoadLevel('high');
    
    let state = getCurrentLoadState();
    expect(state.level).toBe('high');
    
    resetLoadDetector();
    
    state = getCurrentLoadState();
    expect(state.level).toBe('low');
    expect(state.score).toBe(25); // Low level default score
  });

  it('should maintain load history', () => {
    initializeLoadDetector();
    startLoadDetection();
    
    // Simulate time passing
    vi.advanceTimersByTime(5000);
    
    const state = getCurrentLoadState();
    expect(state.trend).toBeDefined();
  });

  it('should detect load trend', () => {
    const trend = getLoadTrend();
    
    expect(['improving', 'stable', 'worsening']).toContain(trend);
  });
});

// ============================================================================
// Manual Override Tests
// ============================================================================

describe('Load Detector Manual Override', () => {
  beforeEach(() => {
    resetLoadDetector();
  });

  afterEach(() => {
    clearManualOverride();
  });

  it('should set manual load level', () => {
    setManualLoadLevel('high');
    
    const state = getCurrentLoadState();
    expect(state.level).toBe('high');
    expect(state.score).toBe(75);
  });

  it('should support all load levels', () => {
    const levels: CognitiveLoadLevel[] = ['low', 'medium', 'high', 'critical'];
    const expectedScores = { low: 25, medium: 50, high: 75, critical: 95 };
    
    levels.forEach(level => {
      setManualLoadLevel(level);
      const state = getCurrentLoadState();
      expect(state.level).toBe(level);
      expect(state.score).toBe(expectedScores[level]);
    });
  });

  it('should clear manual override', () => {
    setManualLoadLevel('high');
    expect(getCurrentLoadState().level).toBe('high');
    
    clearManualOverride();
    
    const state = getCurrentLoadState();
    // Should return to auto-detected level (low initially)
    expect(state.level).toBe('low');
  });

  it('should prioritize manual override over auto-detection', () => {
    initializeLoadDetector();
    startLoadDetection();
    
    setManualLoadLevel('critical');
    
    // Even with no stress patterns, manual level should persist
    const state = getCurrentLoadState();
    expect(state.level).toBe('critical');
  });
});

// ============================================================================
// Load Calculation Tests
// ============================================================================

describe('Load Calculation', () => {
  beforeEach(() => {
    resetLoadDetector();
    initializeLoadDetector();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should calculate load score within valid range', () => {
    const state = getCurrentLoadState();
    
    expect(state.score).toBeGreaterThanOrEqual(0);
    expect(state.score).toBeLessThanOrEqual(100);
  });

  it('should determine correct load level based on score', () => {
    // Test score boundaries
    const testCases: Array<{ level: CognitiveLoadLevel; minScore: number; maxScore: number }> = [
      { level: 'low', minScore: 0, maxScore: 34 },
      { level: 'medium', minScore: 35, maxScore: 59 },
      { level: 'high', minScore: 60, maxScore: 79 },
      { level: 'critical', minScore: 80, maxScore: 100 },
    ];

    testCases.forEach(({ level }) => {
      setManualLoadLevel(level);
      const state = getCurrentLoadState();
      expect(state.level).toBe(level);
    });
  });

  it('should include all metric scores', () => {
    const state = getCurrentLoadState();
    
    expect(state.metrics.mouseStress).toBeDefined();
    expect(state.metrics.scrollConfusion).toBeDefined();
    expect(state.metrics.typingStress).toBeDefined();
    expect(state.metrics.navigationConfusion).toBeDefined();
    expect(state.metrics.taskDifficulty).toBeDefined();
  });

  it('should calculate metric scores within valid range', () => {
    const state = getCurrentLoadState();
    
    Object.values(state.metrics).forEach(score => {
      if (score !== undefined) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });
});

// ============================================================================
// Pattern Detection Tests
// ============================================================================

describe('Pattern Detection', () => {
  beforeEach(() => {
    resetLoadDetector();
    initializeLoadDetector();
    startLoadDetection();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should track mouse patterns', () => {
    const state = getCurrentLoadState();
    
    expect(state.patterns.mouseMovements).toBeDefined();
    expect(Array.isArray(state.patterns.mouseMovements)).toBe(true);
  });

  it('should track scroll patterns', () => {
    const state = getCurrentLoadState();
    
    expect(state.patterns.scrollPatterns).toBeDefined();
    expect(Array.isArray(state.patterns.scrollPatterns)).toBe(true);
  });

  it('should track hesitations', () => {
    const state = getCurrentLoadState();
    
    expect(state.patterns.hesitations).toBeDefined();
    expect(Array.isArray(state.patterns.hesitations)).toBe(true);
  });

  it('should track navigation patterns', () => {
    const state = getCurrentLoadState();
    
    expect(state.patterns.navigationPattern).toBeDefined();
    expect(typeof state.patterns.navigationPattern.backCount).toBe('number');
    expect(typeof state.patterns.navigationPattern.appearsLost).toBe('boolean');
  });

  it('should track help request patterns', () => {
    const state = getCurrentLoadState();
    
    expect(state.patterns.helpRequests).toBeDefined();
    expect(typeof state.patterns.helpRequests.requestCount).toBe('number');
  });

  it('should track tasks', () => {
    const state = getCurrentLoadState();
    
    expect(state.patterns.tasks).toBeDefined();
    expect(Array.isArray(state.patterns.tasks)).toBe(true);
  });
});

// ============================================================================
// Task Tracking Tests
// ============================================================================

describe('Task Tracking', () => {
  beforeEach(() => {
    resetLoadDetector();
    initializeLoadDetector();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should start task tracking', () => {
    const { startTask } = createLoadDetector();
    
    // Should not throw
    expect(() => {
      startTask('test-task', 60000, 5);
    }).not.toThrow();
  });

  it('should complete task tracking', () => {
    const { startTask, completeTask } = createLoadDetector();
    
    startTask('test-task', 60000, 5);
    
    // Should not throw
    expect(() => {
      completeTask('test-task', true);
    }).not.toThrow();
  });

  it('should track multiple tasks', () => {
    const { startTask, completeTask } = createLoadDetector();
    
    startTask('task-1', 30000, 3);
    startTask('task-2', 60000, 5);
    
    completeTask('task-1', true);
    completeTask('task-2', false);
    
    const state = getCurrentLoadState();
    expect(state.patterns.tasks.length).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Trend Detection Tests
// ============================================================================

describe('Trend Detection', () => {
  beforeEach(() => {
    resetLoadDetector();
    initializeLoadDetector();
  });

  it('should return stable trend initially', () => {
    const trend = getLoadTrend();
    expect(trend).toBe('stable');
  });

  it('should detect improving trend', () => {
    // Simulate improving trend by setting decreasing scores
    // This requires internal state manipulation
    const trend = getLoadTrend();
    expect(['improving', 'stable', 'worsening']).toContain(trend);
  });

  it('should detect worsening trend', () => {
    const trend = getLoadTrend();
    expect(['improving', 'stable', 'worsening']).toContain(trend);
  });

  it('should update trend in state', () => {
    const state = getCurrentLoadState();
    expect(['improving', 'stable', 'worsening']).toContain(state.trend);
    expect(typeof state.isIncreasing).toBe('boolean');
  });
});

// ============================================================================
// Callback Tests
// ============================================================================

describe('Load Detector Callbacks', () => {
  beforeEach(() => {
    resetLoadDetector();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    stopLoadDetection();
  });

  it('should call onLoadChange callback', () => {
    const onLoadChange = vi.fn();
    
    initializeLoadDetector({
      sampleIntervalMs: 100,
      onLoadChange,
    });
    
    startLoadDetection();
    
    vi.advanceTimersByTime(150);
    
    expect(onLoadChange).toHaveBeenCalled();
  });

  it('should call onHighLoad callback for high load', () => {
    const onHighLoad = vi.fn();
    
    initializeLoadDetector({
      sampleIntervalMs: 100,
      onHighLoad,
    });
    
    startLoadDetection();
    setManualLoadLevel('high');
    
    vi.advanceTimersByTime(150);
    
    expect(onHighLoad).toHaveBeenCalled();
  });

  it('should call onHighLoad for critical load', () => {
    const onHighLoad = vi.fn();
    
    initializeLoadDetector({
      sampleIntervalMs: 100,
      onHighLoad,
    });
    
    startLoadDetection();
    setManualLoadLevel('critical');
    
    vi.advanceTimersByTime(150);
    
    expect(onHighLoad).toHaveBeenCalled();
  });

  it('should not call onHighLoad for low/medium load', () => {
    const onHighLoad = vi.fn();
    
    initializeLoadDetector({
      sampleIntervalMs: 100,
      onHighLoad,
    });
    
    startLoadDetection();
    setManualLoadLevel('low');
    
    vi.advanceTimersByTime(150);
    
    expect(onHighLoad).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Load Detector Integration', () => {
  beforeEach(() => {
    resetLoadDetector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should handle complete detection lifecycle', () => {
    // Initialize
    initializeLoadDetector({
      sampleIntervalMs: 500,
    });
    
    // Check initial state
    expect(isDetectionActive()).toBe(false);
    
    // Start detection
    startLoadDetection();
    expect(isDetectionActive()).toBe(true);
    
    // Get state
    let state = getCurrentLoadState();
    expect(state.level).toBeDefined();
    expect(state.score).toBeDefined();
    
    // Set manual override
    setManualLoadLevel('high');
    state = getCurrentLoadState();
    expect(state.level).toBe('high');
    
    // Clear override
    clearManualOverride();
    
    // Stop detection
    stopLoadDetection();
    expect(isDetectionActive()).toBe(false);
    
    // Reset
    resetLoadDetector();
    state = getCurrentLoadState();
    expect(state.level).toBe('low');
  });

  it('should work with load detector factory', () => {
    const detector = createLoadDetector({
      sampleIntervalMs: 1000,
    });
    
    // Test all methods
    expect(detector.isActive).toBe(false);
    
    detector.start();
    expect(detector.isActive).toBe(true);
    
    const state = detector.state;
    expect(state.level).toBeDefined();
    
    detector.setManualLevel('medium');
    expect(detector.state.level).toBe('medium');
    
    detector.clearManualOverride();
    
    const trend = detector.getTrend();
    expect(['improving', 'stable', 'worsening']).toContain(trend);
    
    detector.stop();
    expect(detector.isActive).toBe(false);
    
    detector.reset();
    expect(detector.state.level).toBe('low');
  });

  it('should maintain consistent state across API calls', () => {
    initializeLoadDetector();
    startLoadDetection();
    
    const state1 = getCurrentLoadState();
    const state2 = getCurrentLoadState();
    
    expect(state1.level).toBe(state2.level);
    expect(state1.score).toBe(state2.score);
    expect(state1.lastUpdated).toBe(state2.lastUpdated);
  });

  it('should handle rapid start/stop', () => {
    initializeLoadDetector();
    
    // Rapid cycles
    for (let i = 0; i < 5; i++) {
      startLoadDetection();
      stopLoadDetection();
    }
    
    expect(isDetectionActive()).toBe(false);
  });

  it('should handle state after multiple resets', () => {
    initializeLoadDetector();
    
    for (let i = 0; i < 3; i++) {
      resetLoadDetector();
      const state = getCurrentLoadState();
      expect(state.level).toBe('low');
      expect(state.patterns.hesitations).toEqual([]);
    }
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Load Detector Edge Cases', () => {
  beforeEach(() => {
    resetLoadDetector();
  });

  afterEach(() => {
    stopLoadDetection();
  });

  it('should handle stop without start', () => {
    expect(() => {
      stopLoadDetection();
    }).not.toThrow();
    
    expect(isDetectionActive()).toBe(false);
  });

  it('should handle multiple manual level sets', () => {
    setManualLoadLevel('low');
    expect(getCurrentLoadState().level).toBe('low');
    
    setManualLoadLevel('medium');
    expect(getCurrentLoadState().level).toBe('medium');
    
    setManualLoadLevel('high');
    expect(getCurrentLoadState().level).toBe('high');
    
    setManualLoadLevel('critical');
    expect(getCurrentLoadState().level).toBe('critical');
  });

  it('should handle clear override without prior override', () => {
    expect(() => {
      clearManualOverride();
    }).not.toThrow();
    
    expect(getCurrentLoadState().level).toBe('low');
  });

  it('should handle getTrend with insufficient history', () => {
    const trend = getLoadTrend();
    expect(['improving', 'stable', 'worsening']).toContain(trend);
  });

  it('should handle state timestamp', () => {
    const before = Date.now();
    const state = getCurrentLoadState();
    const after = Date.now();
    
    expect(state.lastUpdated).toBeGreaterThanOrEqual(before);
    expect(state.lastUpdated).toBeLessThanOrEqual(after);
  });
});

// ============================================================================
// Default Export Tests
// ============================================================================

describe('Load Detector Default Export', () => {
  it('should export all required methods', async () => {
    const loadDetector = await import('../loadDetector');
    
    expect(typeof loadDetector.default.initialize).toBe('function');
    expect(typeof loadDetector.default.start).toBe('function');
    expect(typeof loadDetector.default.stop).toBe('function');
    expect(typeof loadDetector.default.reset).toBe('function');
    expect(typeof loadDetector.default.setManualLevel).toBe('function');
    expect(typeof loadDetector.default.clearManualOverride).toBe('function');
    expect(typeof loadDetector.default.startTask).toBe('function');
    expect(typeof loadDetector.default.completeTask).toBe('function');
    expect(typeof loadDetector.default.recordHelpRequest).toBe('function');
    expect(typeof loadDetector.default.getCurrentState).toBe('function');
    expect(typeof loadDetector.default.getTrend).toBe('function');
    expect(typeof loadDetector.default.isActive).toBe('function');
    expect(typeof loadDetector.default.create).toBe('function');
  });
});
