/** [Ver001.000]
 * Cognitive Load Types
 * ====================
 * TypeScript interfaces for cognitive load detection system.
 * 
 * Features:
 * - Load level definitions (low/medium/high)
 * - Interaction pattern tracking
 * - Cognitive load metrics
 * - Simplification rule types
 * 
 * Integration:
 * - Extends TL-A1 context detection
 * - Works with TL-A2 mobile adaptations
 * - Feeds into adaptive UI components
 */

// ============================================================================
// Load Levels
// ============================================================================

/**
 * Cognitive load level
 */
export type CognitiveLoadLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Load level with numeric value for calculations
 */
export interface LoadLevelValue {
  level: CognitiveLoadLevel;
  score: number; // 0-100
}

// ============================================================================
// Mouse Interaction Patterns
// ============================================================================

/**
 * Mouse hesitation pattern
 */
export interface MouseHesitation {
  /** Duration of hesitation in ms */
  duration: number;
  /** Position where hesitation occurred */
  position: { x: number; y: number };
  /** Timestamp */
  timestamp: number;
  /** Element at hesitation position */
  element?: string;
}

/**
 * Mouse movement analysis
 */
export interface MouseMovement {
  /** Movement velocity (pixels/ms) */
  velocity: number;
  /** Number of direction changes */
  directionChanges: number;
  /** Total distance traveled (pixels) */
  distance: number;
  /** Whether movement is erratic */
  isErratic: boolean;
}

/**
 * Scroll pattern analysis
 */
export interface ScrollPattern {
  /** Scroll speed (pixels/ms) */
  speed: number;
  /** Number of scroll direction reversals */
  reversals: number;
  /** Whether scroll is rapid/erratic */
  isRapid: boolean;
  /** Scroll depth achieved (0-1) */
  depth: number;
  /** Time spent scrolling (ms) */
  duration: number;
}

// ============================================================================
// Typing Patterns
// ============================================================================

/**
 * Typing pattern analysis
 */
export interface TypingPattern {
  /** Average typing speed (chars/minute) */
  averageSpeed: number;
  /** Variance in typing speed */
  speedVariance: number;
  /** Number of backspaces/corrections */
  correctionCount: number;
  /** Pause duration between keystrokes (ms) */
  pauseDuration: number;
  /** Error rate (0-1) */
  errorRate: number;
}

/**
 * Input field interaction
 */
export interface InputInteraction {
  /** Field identifier */
  fieldId: string;
  /** Time to first input (ms) */
  timeToFirstInput: number;
  /** Total time spent on field (ms) */
  totalTime: number;
  /** Number of focus events */
  focusCount: number;
  /** Whether field was completed */
  completed: boolean;
}

// ============================================================================
// Navigation Patterns
// ============================================================================

/**
 * Navigation pattern analysis
 */
export interface NavigationPattern {
  /** Number of back navigations */
  backCount: number;
  /** Number of page reloads */
  reloadCount: number;
  /** Navigation path complexity */
  pathComplexity: number;
  /** Whether user is lost/confused */
  appearsLost: boolean;
}

/**
 * Help request pattern
 */
export interface HelpRequestPattern {
  /** Number of help requests */
  requestCount: number;
  /** Types of help requested */
  requestTypes: string[];
  /** Time between help requests (ms) */
  timeBetweenRequests: number;
  /** Whether help resolved the issue */
  resolutionRate: number;
}

// ============================================================================
// Eye Tracking (if available)
// ============================================================================

/**
 * Eye tracking data point
 */
export interface EyeTrackingPoint {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Pupil dilation (if available) */
  pupilDilation?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Eye movement analysis
 */
export interface EyeMovementAnalysis {
  /** Fixation points (where user looked) */
  fixations: Array<{
    x: number;
    y: number;
    duration: number;
  }>;
  /** Saccade patterns (quick eye movements) */
  saccades: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    duration: number;
  }>;
  /** Average fixation duration (ms) */
  averageFixationDuration: number;
  /** Whether gaze is scattered */
  isScattered: boolean;
}

// ============================================================================
// Task Analysis
// ============================================================================

/**
 * Task completion analysis
 */
export interface TaskAnalysis {
  /** Task identifier */
  taskId: string;
  /** Expected completion time (ms) */
  expectedTime: number;
  /** Actual completion time (ms) */
  actualTime: number;
  /** Whether task was completed */
  completed: boolean;
  /** Number of steps taken */
  stepCount: number;
  /** Optimal number of steps */
  optimalSteps: number;
  /** Efficiency ratio (0-1) */
  efficiency: number;
}

// ============================================================================
// Cognitive Load State
// ============================================================================

/**
 * Complete cognitive load state
 */
export interface CognitiveLoadState {
  /** Current load level */
  level: CognitiveLoadLevel;
  /** Numeric load score (0-100) */
  score: number;
  /** Individual metric scores */
  metrics: {
    /** Mouse interaction score (0-100, higher = more load) */
    mouseStress: number;
    /** Scroll confusion score */
    scrollConfusion: number;
    /** Typing stress score */
    typingStress: number;
    /** Navigation confusion score */
    navigationConfusion: number;
    /** Task difficulty score */
    taskDifficulty: number;
    /** Eye tracking stress (if available) */
    eyeTrackingStress?: number;
  };
  /** Detected patterns */
  patterns: {
    hesitations: MouseHesitation[];
    mouseMovements: MouseMovement[];
    scrollPatterns: ScrollPattern[];
    typingPattern?: TypingPattern;
    navigationPattern: NavigationPattern;
    helpRequests: HelpRequestPattern;
    tasks: TaskAnalysis[];
    eyeMovement?: EyeMovementAnalysis;
  };
  /** Timestamp of last update */
  lastUpdated: number;
  /** Whether load is trending up */
  isIncreasing: boolean;
  /** Load trend direction */
  trend: 'improving' | 'stable' | 'worsening';
}

// ============================================================================
// Detection Configuration
// ============================================================================

/**
 * Configuration options for load detection
 */
export interface LoadDetectionConfig {
  /** Sample interval in ms (default: 1000) */
  sampleIntervalMs: number;
  /** Window size for pattern analysis (default: 30000) */
  analysisWindowMs: number;
  /** Threshold for mouse hesitation (ms) (default: 500) */
  hesitationThresholdMs: number;
  /** Threshold for rapid scrolling (pixels/ms) (default: 3) */
  rapidScrollThreshold: number;
  /** Threshold for high typing variance (default: 0.5) */
  highTypingVarianceThreshold: number;
  /** Threshold for back navigation spam (default: 3) */
  backNavigationThreshold: number;
  /** Enable eye tracking (if available) */
  enableEyeTracking: boolean;
  /** Weight for mouse metrics (default: 0.25) */
  mouseWeight: number;
  /** Weight for scroll metrics (default: 0.2) */
  scrollWeight: number;
  /** Weight for typing metrics (default: 0.25) */
  typingWeight: number;
  /** Weight for navigation metrics (default: 0.2) */
  navigationWeight: number;
  /** Weight for task metrics (default: 0.1) */
  taskWeight: number;
  /** Callback when load level changes */
  onLoadChange?: (state: CognitiveLoadState) => void;
  /** Callback when high load detected */
  onHighLoad?: (state: CognitiveLoadState) => void;
}

/**
 * Default load detection configuration
 */
export const DEFAULT_LOAD_DETECTION_CONFIG: Required<Omit<LoadDetectionConfig, 'onLoadChange' | 'onHighLoad'>> = {
  sampleIntervalMs: 1000,
  analysisWindowMs: 30000,
  hesitationThresholdMs: 500,
  rapidScrollThreshold: 3,
  highTypingVarianceThreshold: 0.5,
  backNavigationThreshold: 3,
  enableEyeTracking: false,
  mouseWeight: 0.25,
  scrollWeight: 0.2,
  typingWeight: 0.25,
  navigationWeight: 0.2,
  taskWeight: 0.1,
};

// ============================================================================
// Simplification Rules
// ============================================================================

/**
 * UI simplification level
 */
export type SimplificationLevel = 'none' | 'subtle' | 'moderate' | 'aggressive';

/**
 * Simplification rule
 */
export interface SimplificationRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Load level that triggers this rule */
  triggerLevel: CognitiveLoadLevel;
  /** Minimum load score to trigger */
  minScore: number;
  /** Rule action */
  action: 'hide' | 'collapse' | 'simplify' | 'highlight' | 'enlarge' | 'reduce-motion';
  /** Target selector or component type */
  target: string;
  /** Rule priority (higher = applied first) */
  priority: number;
  /** Whether rule is enabled */
  enabled: boolean;
}

/**
 * Simplification configuration
 */
export interface SimplificationConfig {
  /** Current simplification level */
  level: SimplificationLevel;
  /** Active rules */
  rules: SimplificationRule[];
  /** Whether simplification is automatic */
  automatic: boolean;
  /** User override (null = auto) */
  userOverride: SimplificationLevel | null;
  /** Feature flags for optional simplifications */
  features: {
    hideOptionalFields: boolean;
    collapseAdvancedSections: boolean;
    enlargeText: boolean;
    reduceMotion: boolean;
    simplifyNavigation: boolean;
    highlightRequiredFields: boolean;
    showProgressIndicators: boolean;
    enableVoiceGuidance: boolean;
  };
}

// ============================================================================
// Adaptive UI State
// ============================================================================

/**
 * Adaptive UI state
 */
export interface AdaptiveUIState {
  /** Current cognitive load state */
  cognitiveLoad: CognitiveLoadState;
  /** Current simplification config */
  simplification: SimplificationConfig;
  /** Whether UI is currently adapting */
  isAdapting: boolean;
  /** Recent adaptations made */
  recentAdaptations: Array<{
    timestamp: number;
    rule: string;
    action: string;
  }>;
  /** User feedback on adaptations */
  userFeedback: Array<{
    timestamp: number;
    helpful: boolean;
    comment?: string;
  }>;
}

// ============================================================================
// Load Detector Return Type
// ============================================================================

/**
 * Return type for load detector
 */
export interface LoadDetectorReturn {
  /** Current load state */
  state: CognitiveLoadState;
  /** Whether detection is active */
  isActive: boolean;
  /** Start detection */
  start: () => void;
  /** Stop detection */
  stop: () => void;
  /** Reset all metrics */
  reset: () => void;
  /** Manually set load level */
  setManualLevel: (level: CognitiveLoadLevel) => void;
  /** Clear manual override */
  clearManualOverride: () => void;
  /** Get load trend */
  getTrend: () => 'improving' | 'stable' | 'worsening';
  /** Record task start */
  startTask: (taskId: string, expectedTime: number, optimalSteps: number) => void;
  /** Record task completion */
  completeTask: (taskId: string, completed: boolean) => void;
}

/**
 * Return type for useCognitiveLoad hook
 */
export interface UseCognitiveLoadReturn extends LoadDetectorReturn {
  /** Subscribe to load changes */
  subscribe: (callback: (state: CognitiveLoadState) => void) => () => void;
  /** Whether user has manually overridden */
  isManualOverride: boolean;
}
