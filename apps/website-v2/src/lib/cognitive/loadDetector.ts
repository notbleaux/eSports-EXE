/** [Ver001.000]
 * Cognitive Load Detector
 * =======================
 * Detects user confusion and cognitive load through interaction analysis.
 * 
 * Features:
 * - Mouse hesitation detection
 * - Rapid/erratic scrolling detection
 * - Eye movement tracking (if available)
 * - Task completion time analysis
 * - Pattern recognition for confusion signals
 * 
 * Integration:
 * - Extends TL-A1 context detection
 * - Uses TL-A2 mobile adaptations
 * - Works with AdaptiveUI component
 * 
 * @module lib/cognitive/loadDetector
 */

import type {
  CognitiveLoadState,
  CognitiveLoadLevel,
  LoadDetectionConfig,
  MouseHesitation,
  MouseMovement,
  ScrollPattern,
  TaskAnalysis,
  LoadDetectorReturn,
  NavigationPattern,
  HelpRequestPattern,
  TypingPattern,
  InputInteraction,
} from './types';
import { DEFAULT_LOAD_DETECTION_CONFIG } from './types';

// ============================================================================
// State Management
// ============================================================================

/**
 * Internal state for load detector
 */
interface DetectorState {
  isActive: boolean;
  manualOverride: CognitiveLoadLevel | null;
  mousePosition: { x: number; y: number } | null;
  mouseVelocity: number;
  lastMouseMove: number;
  hesitations: MouseHesitation[];
  mouseMovements: MouseMovement[];
  scrollEvents: Array<{ timestamp: number; delta: number; position: number }>;
  scrollPatterns: ScrollPattern[];
  keystrokes: Array<{ timestamp: number; key: string }>;
  typingPattern: TypingPattern | null;
  inputInteractions: InputInteraction[];
  navigationEvents: Array<{ type: 'back' | 'forward' | 'reload'; timestamp: number }>;
  navigationPattern: NavigationPattern;
  helpRequests: HelpRequestPattern;
  tasks: Map<string, {
    startTime: number;
    expectedTime: number;
    optimalSteps: number;
    stepCount: number;
    completed: boolean | null;
  }>;
  completedTasks: TaskAnalysis[];
  loadHistory: Array<{ timestamp: number; score: number }>;
  sampleInterval: NodeJS.Timeout | null;
}

/**
 * Create initial detector state
 */
function createInitialState(): DetectorState {
  return {
    isActive: false,
    manualOverride: null,
    mousePosition: null,
    mouseVelocity: 0,
    lastMouseMove: 0,
    hesitations: [],
    mouseMovements: [],
    scrollEvents: [],
    scrollPatterns: [],
    keystrokes: [],
    typingPattern: null,
    inputInteractions: [],
    navigationEvents: [],
    navigationPattern: {
      backCount: 0,
      reloadCount: 0,
      pathComplexity: 0,
      appearsLost: false,
    },
    helpRequests: {
      requestCount: 0,
      requestTypes: [],
      timeBetweenRequests: 0,
      resolutionRate: 0,
    },
    tasks: new Map(),
    completedTasks: [],
    loadHistory: [],
    sampleInterval: null,
  };
}

// Global state instance
let detectorState: DetectorState = createInitialState();

// Configuration
let config: LoadDetectionConfig = { ...DEFAULT_LOAD_DETECTION_CONFIG };

// Callbacks
let onLoadChangeCallback: ((state: CognitiveLoadState) => void) | null = null;
let onHighLoadCallback: ((state: CognitiveLoadState) => void) | null = null;

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle mouse move event
 */
function handleMouseMove(e: MouseEvent): void {
  if (!detectorState.isActive) return;

  const now = Date.now();
  const newPosition = { x: e.clientX, y: e.clientY };

  if (detectorState.mousePosition) {
    const dx = newPosition.x - detectorState.mousePosition.x;
    const dy = newPosition.y - detectorState.mousePosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dt = now - detectorState.lastMouseMove;

    if (dt > 0) {
      const velocity = distance / dt;
      detectorState.mouseVelocity = velocity;

      // Detect hesitation (low velocity after movement)
      if (velocity < 0.1 && distance < 5 && dt > config.hesitationThresholdMs) {
        const hesitation: MouseHesitation = {
          duration: dt,
          position: detectorState.mousePosition,
          timestamp: now,
          element: document.elementFromPoint(
            detectorState.mousePosition.x,
            detectorState.mousePosition.y
          )?.tagName,
        };
        detectorState.hesitations.push(hesitation);
        
        // Clean old hesitations
        const cutoff = now - config.analysisWindowMs;
        detectorState.hesitations = detectorState.hesitations.filter(
          h => h.timestamp > cutoff
        );
      }
    }
  }

  detectorState.mousePosition = newPosition;
  detectorState.lastMouseMove = now;
}

/**
 * Handle scroll event
 */
function handleScroll(): void {
  if (!detectorState.isActive) return;

  const now = Date.now();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const lastEvent = detectorState.scrollEvents[detectorState.scrollEvents.length - 1];
  const delta = lastEvent ? scrollTop - lastEvent.position : 0;

  detectorState.scrollEvents.push({
    timestamp: now,
    delta,
    position: scrollTop,
  });

  // Clean old scroll events
  const cutoff = now - config.analysisWindowMs;
  detectorState.scrollEvents = detectorState.scrollEvents.filter(
    e => e.timestamp > cutoff
  );
}

/**
 * Handle keydown event
 */
function handleKeyDown(e: KeyboardEvent): void {
  if (!detectorState.isActive) return;

  const now = Date.now();
  detectorState.keystrokes.push({
    timestamp: now,
    key: e.key,
  });

  // Clean old keystrokes
  const cutoff = now - config.analysisWindowMs;
  detectorState.keystrokes = detectorState.keystrokes.filter(
    k => k.timestamp > cutoff
  );
}

/**
 * Handle navigation events (popstate)
 */
function handlePopState(): void {
  if (!detectorState.isActive) return;

  detectorState.navigationEvents.push({
    type: 'back',
    timestamp: Date.now(),
  });

  updateNavigationPattern();
}

/**
 * Handle before unload (detect reload)
 */
function handleBeforeUnload(): void {
  if (!detectorState.isActive) return;

  const now = Date.now();
  const recentReloads = detectorState.navigationEvents.filter(
    e => e.type === 'reload' && now - e.timestamp < 60000
  );

  if (recentReloads.length === 0) {
    detectorState.navigationEvents.push({
      type: 'reload',
      timestamp: now,
    });
    updateNavigationPattern();
  }
}

// ============================================================================
// Pattern Analysis
// ============================================================================

/**
 * Analyze mouse movements for erratic patterns
 */
function analyzeMouseMovements(): MouseMovement {
  const movements = detectorState.hesitations;
  const now = Date.now();
  const cutoff = now - config.analysisWindowMs;
  const recentMovements = movements.filter(m => m.timestamp > cutoff);

  if (recentMovements.length < 2) {
    return {
      velocity: 0,
      directionChanges: 0,
      distance: 0,
      isErratic: false,
    };
  }

  // Calculate total distance and detect direction changes
  let totalDistance = 0;
  let directionChanges = 0;
  let lastDirection = { x: 0, y: 0 };

  for (let i = 1; i < recentMovements.length; i++) {
    const curr = recentMovements[i];
    const prev = recentMovements[i - 1];
    
    const dx = curr.position.x - prev.position.x;
    const dy = curr.position.y - prev.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    totalDistance += distance;

    // Detect direction change
    if (i > 1) {
      const dotProduct = lastDirection.x * dx + lastDirection.y * dy;
      if (dotProduct < 0) {
        directionChanges++;
      }
    }

    if (distance > 0) {
      lastDirection = { x: dx / distance, y: dy / distance };
    }
  }

  const timeSpan = recentMovements[recentMovements.length - 1].timestamp - recentMovements[0].timestamp;
  const velocity = timeSpan > 0 ? totalDistance / timeSpan : 0;

  return {
    velocity,
    directionChanges,
    distance: totalDistance,
    isErratic: directionChanges > 5 || velocity > 2,
  };
}

/**
 * Analyze scroll patterns
 */
function analyzeScrollPattern(): ScrollPattern {
  const events = detectorState.scrollEvents;
  const now = Date.now();
  const cutoff = now - config.analysisWindowMs;
  const recentEvents = events.filter(e => e.timestamp > cutoff);

  if (recentEvents.length < 2) {
    return {
      speed: 0,
      reversals: 0,
      isRapid: false,
      depth: 0,
      duration: 0,
    };
  }

  // Calculate scroll speed
  let totalDelta = 0;
  let reversals = 0;
  let lastDelta = 0;

  for (let i = 1; i < recentEvents.length; i++) {
    const delta = recentEvents[i].delta;
    totalDelta += Math.abs(delta);

    // Detect direction reversal
    if ((lastDelta > 0 && delta < 0) || (lastDelta < 0 && delta > 0)) {
      reversals++;
    }

    lastDelta = delta;
  }

  const timeSpan = recentEvents[recentEvents.length - 1].timestamp - recentEvents[0].timestamp;
  const speed = timeSpan > 0 ? totalDelta / timeSpan : 0;

  // Calculate scroll depth
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  const depth = maxScroll > 0 ? currentScroll / maxScroll : 0;

  return {
    speed,
    reversals,
    isRapid: speed > config.rapidScrollThreshold || reversals > 3,
    depth,
    duration: timeSpan,
  };
}

/**
 * Analyze typing patterns
 */
function analyzeTypingPattern(): TypingPattern | null {
  const keystrokes = detectorState.keystrokes;
  const now = Date.now();
  const cutoff = now - config.analysisWindowMs;
  const recentKeystrokes = keystrokes.filter(k => k.timestamp > cutoff);

  if (recentKeystrokes.length < 5) {
    return null;
  }

  // Calculate typing speed (chars per minute)
  const timeSpan = recentKeystrokes[recentKeystrokes.length - 1].timestamp - recentKeystrokes[0].timestamp;
  const averageSpeed = timeSpan > 0 ? (recentKeystrokes.length / timeSpan) * 60000 : 0;

  // Calculate speed variance
  const intervals: number[] = [];
  for (let i = 1; i < recentKeystrokes.length; i++) {
    intervals.push(recentKeystrokes[i].timestamp - recentKeystrokes[i - 1].timestamp);
  }

  const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - meanInterval, 2);
  }, 0) / intervals.length;
  const speedVariance = meanInterval > 0 ? Math.sqrt(variance) / meanInterval : 0;

  // Count corrections (backspace, delete)
  const correctionCount = recentKeystrokes.filter(
    k => k.key === 'Backspace' || k.key === 'Delete'
  ).length;

  // Calculate pause duration (average time between keystrokes)
  const pauseDuration = meanInterval;

  // Calculate error rate
  const errorRate = recentKeystrokes.length > 0 ? correctionCount / recentKeystrokes.length : 0;

  return {
    averageSpeed,
    speedVariance,
    correctionCount,
    pauseDuration,
    errorRate,
  };
}

/**
 * Update navigation pattern
 */
function updateNavigationPattern(): void {
  const events = detectorState.navigationEvents;
  const now = Date.now();
  const cutoff = now - config.analysisWindowMs;
  const recentEvents = events.filter(e => e.timestamp > cutoff);

  const backCount = recentEvents.filter(e => e.type === 'back').length;
  const reloadCount = recentEvents.filter(e => e.type === 'reload').length;

  // Calculate path complexity based on number of unique actions
  const uniqueActions = new Set(recentEvents.map(e => e.timestamp)).size;
  const pathComplexity = uniqueActions / Math.max(recentEvents.length, 1);

  // Detect if user appears lost (high back count, reloads)
  const appearsLost = backCount >= config.backNavigationThreshold || reloadCount > 2;

  detectorState.navigationPattern = {
    backCount,
    reloadCount,
    pathComplexity,
    appearsLost,
  };
}

/**
 * Calculate load trend
 */
function calculateTrend(): 'improving' | 'stable' | 'worsening' {
  const history = detectorState.loadHistory;
  
  if (history.length < 5) {
    return 'stable';
  }

  // Get last 5 samples
  const recent = history.slice(-5);
  const firstHalf = recent.slice(0, 2);
  const secondHalf = recent.slice(-2);

  const firstAvg = firstHalf.reduce((sum, h) => sum + h.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, h) => sum + h.score, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  if (difference > 10) return 'worsening';
  if (difference < -10) return 'improving';
  return 'stable';
}

// ============================================================================
// Load Calculation
// ============================================================================

/**
 * Calculate cognitive load score from all metrics
 */
function calculateLoadScore(): { score: number; level: CognitiveLoadLevel } {
  // If manual override is set, use that
  if (detectorState.manualOverride) {
    const scoreMap: Record<CognitiveLoadLevel, number> = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 95,
    };
    return { score: scoreMap[detectorState.manualOverride], level: detectorState.manualOverride };
  }

  const mouseMovement = analyzeMouseMovements();
  const scrollPattern = analyzeScrollPattern();
  const typingPattern = analyzeTypingPattern();
  updateNavigationPattern();

  // Calculate individual metric scores (0-100, higher = more load)
  const mouseStress = Math.min(
    100,
    (detectorState.hesitations.length * 10) + 
    (mouseMovement.isErratic ? 30 : 0) +
    (mouseMovement.velocity > 2 ? 20 : 0)
  );

  const scrollConfusion = Math.min(
    100,
    (scrollPattern.reversals * 15) +
    (scrollPattern.isRapid ? 30 : 0) +
    (scrollPattern.duration > 10000 && scrollPattern.depth < 0.3 ? 25 : 0)
  );

  const typingStress = typingPattern
    ? Math.min(
        100,
        (typingPattern.speedVariance > config.highTypingVarianceThreshold ? 30 : 0) +
        (typingPattern.errorRate * 50) +
        (typingPattern.pauseDuration > 2000 ? 20 : 0)
      )
    : 0;

  const navigationConfusion = Math.min(
    100,
    (detectorState.navigationPattern.backCount * 15) +
    (detectorState.navigationPattern.reloadCount * 20) +
    (detectorState.navigationPattern.appearsLost ? 40 : 0)
  );

  // Calculate task difficulty from completed tasks
  const taskDifficulty = detectorState.completedTasks.length > 0
    ? Math.min(
        100,
        detectorState.completedTasks.reduce((sum, task) => {
          const timeRatio = task.actualTime / Math.max(task.expectedTime, 1);
          const stepRatio = task.stepCount / Math.max(task.optimalSteps, 1);
          return sum + ((timeRatio + stepRatio) / 2) * 50;
        }, 0) / detectorState.completedTasks.length
      )
    : 0;

  // Calculate weighted total score
  const totalScore = 
    (mouseStress * config.mouseWeight) +
    (scrollConfusion * config.scrollWeight) +
    (typingStress * config.typingWeight) +
    (navigationConfusion * config.navigationWeight) +
    (taskDifficulty * config.taskWeight);

  // Determine load level
  let level: CognitiveLoadLevel;
  if (totalScore >= 80) level = 'critical';
  else if (totalScore >= 60) level = 'high';
  else if (totalScore >= 35) level = 'medium';
  else level = 'low';

  return { score: Math.round(totalScore), level };
}

/**
 * Build current cognitive load state
 */
function buildLoadState(): CognitiveLoadState {
  const { score, level } = calculateLoadScore();
  const now = Date.now();

  // Add to history
  detectorState.loadHistory.push({ timestamp: now, score });
  
  // Keep only last 20 samples
  if (detectorState.loadHistory.length > 20) {
    detectorState.loadHistory = detectorState.loadHistory.slice(-20);
  }

  const trend = calculateTrend();

  return {
    level,
    score,
    metrics: {
      mouseStress: Math.min(100, detectorState.hesitations.length * 10),
      scrollConfusion: analyzeScrollPattern().isRapid ? 70 : 0,
      typingStress: analyzeTypingPattern()?.speedVariance ? 
        Math.min(100, analyzeTypingPattern()!.speedVariance * 100) : 0,
      navigationConfusion: detectorState.navigationPattern.appearsLost ? 80 : 
        detectorState.navigationPattern.backCount * 15,
      taskDifficulty: detectorState.completedTasks.length > 0 ?
        detectorState.completedTasks.reduce((sum, t) => sum + (t.efficiency < 0.5 ? 70 : 30), 0) /
        detectorState.completedTasks.length : 0,
    },
    patterns: {
      hesitations: detectorState.hesitations,
      mouseMovements: [analyzeMouseMovements()],
      scrollPatterns: [analyzeScrollPattern()],
      typingPattern: analyzeTypingPattern() || undefined,
      navigationPattern: detectorState.navigationPattern,
      helpRequests: detectorState.helpRequests,
      tasks: detectorState.completedTasks,
    },
    lastUpdated: now,
    isIncreasing: trend === 'worsening',
    trend,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize load detector with configuration
 */
export function initializeLoadDetector(userConfig?: Partial<LoadDetectionConfig>): void {
  config = { ...DEFAULT_LOAD_DETECTION_CONFIG, ...userConfig };
  
  if (userConfig?.onLoadChange) {
    onLoadChangeCallback = userConfig.onLoadChange;
  }
  if (userConfig?.onHighLoad) {
    onHighLoadCallback = userConfig.onHighLoad;
  }
}

/**
 * Start load detection
 */
export function startLoadDetection(): void {
  if (detectorState.isActive) return;

  detectorState.isActive = true;

  // Attach event listeners
  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Start sampling interval
  detectorState.sampleInterval = setInterval(() => {
    const state = buildLoadState();
    
    // Trigger callbacks
    onLoadChangeCallback?.(state);
    
    if (state.level === 'high' || state.level === 'critical') {
      onHighLoadCallback?.(state);
    }
  }, config.sampleIntervalMs);
}

/**
 * Stop load detection
 */
export function stopLoadDetection(): void {
  if (!detectorState.isActive) return;

  detectorState.isActive = false;

  // Remove event listeners
  document.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('popstate', handlePopState);
  window.removeEventListener('beforeunload', handleBeforeUnload);

  // Clear interval
  if (detectorState.sampleInterval) {
    clearInterval(detectorState.sampleInterval);
    detectorState.sampleInterval = null;
  }
}

/**
 * Reset all detector state
 */
export function resetLoadDetector(): void {
  stopLoadDetection();
  detectorState = createInitialState();
}

/**
 * Manually set load level
 */
export function setManualLoadLevel(level: CognitiveLoadLevel): void {
  detectorState.manualOverride = level;
}

/**
 * Clear manual override
 */
export function clearManualOverride(): void {
  detectorState.manualOverride = null;
}

/**
 * Start tracking a task
 */
export function startTask(
  taskId: string,
  expectedTime: number,
  optimalSteps: number
): void {
  detectorState.tasks.set(taskId, {
    startTime: Date.now(),
    expectedTime,
    optimalSteps,
    stepCount: 0,
    completed: null,
  });
}

/**
 * Record task step
 */
export function recordTaskStep(taskId: string): void {
  const task = detectorState.tasks.get(taskId);
  if (task) {
    task.stepCount++;
  }
}

/**
 * Complete task tracking
 */
export function completeTask(taskId: string, completed: boolean): void {
  const task = detectorState.tasks.get(taskId);
  if (!task) return;

  const actualTime = Date.now() - task.startTime;
  
  const taskAnalysis: TaskAnalysis = {
    taskId,
    expectedTime: task.expectedTime,
    actualTime,
    completed,
    stepCount: task.stepCount,
    optimalSteps: task.optimalSteps,
    efficiency: Math.min(1, (task.optimalSteps / Math.max(task.stepCount, 1)) * 
      (task.expectedTime / Math.max(actualTime, 1))),
  };

  detectorState.completedTasks.push(taskAnalysis);
  
  // Keep only last 10 completed tasks
  if (detectorState.completedTasks.length > 10) {
    detectorState.completedTasks = detectorState.completedTasks.slice(-10);
  }

  detectorState.tasks.delete(taskId);
}

/**
 * Record help request
 */
export function recordHelpRequest(type: string, resolved: boolean): void {
  const now = Date.now();
  
  if (detectorState.helpRequests.requestCount > 0) {
    detectorState.helpRequests.timeBetweenRequests = 
      now - detectorState.helpRequests.timeBetweenRequests;
  }
  
  detectorState.helpRequests.requestCount++;
  detectorState.helpRequests.requestTypes.push(type);
  
  // Update resolution rate
  const totalRequests = detectorState.helpRequests.requestCount;
  const resolvedRequests = detectorState.helpRequests.requestTypes.filter(
    (_, i) => i < totalRequests - 1 || resolved
  ).length;
  detectorState.helpRequests.resolutionRate = resolvedRequests / totalRequests;
}

/**
 * Get current load state
 */
export function getCurrentLoadState(): CognitiveLoadState {
  return buildLoadState();
}

/**
 * Get load trend
 */
export function getLoadTrend(): 'improving' | 'stable' | 'worsening' {
  return calculateTrend();
}

/**
 * Check if detector is active
 */
export function isDetectionActive(): boolean {
  return detectorState.isActive;
}

/**
 * Create load detector instance
 */
export function createLoadDetector(
  userConfig?: Partial<LoadDetectionConfig>
): LoadDetectorReturn {
  initializeLoadDetector(userConfig);

  return {
    get state() {
      return getCurrentLoadState();
    },
    get isActive() {
      return isDetectionActive();
    },
    start: startLoadDetection,
    stop: stopLoadDetection,
    reset: resetLoadDetector,
    setManualLevel: setManualLoadLevel,
    clearManualOverride,
    getTrend: getLoadTrend,
    startTask,
    completeTask,
  };
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  initialize: initializeLoadDetector,
  start: startLoadDetection,
  stop: stopLoadDetection,
  reset: resetLoadDetector,
  setManualLevel: setManualLoadLevel,
  clearManualOverride,
  startTask,
  completeTask,
  recordHelpRequest,
  getCurrentState: getCurrentLoadState,
  getTrend: getLoadTrend,
  isActive: isDetectionActive,
  create: createLoadDetector,
};
