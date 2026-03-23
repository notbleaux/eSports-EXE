/** [Ver001.000] */
/**
 * Context Types for Help System
 * =============================
 * TypeScript interfaces for context detection in the proactive help system.
 * 
 * Integration:
 * - Provides context to TL-A1 1-A help panel
 * - Feeds TL-A1 1-C knowledge graph
 * - Feeds TL-A1 1-D broadcast system
 */

// ============================================================================
// Help Level
// ============================================================================

/**
 * User expertise level for help content targeting
 */
export type HelpLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * User experience state
 */
export type UserState = 'new' | 'returning' | 'expert' | 'churned';

// ============================================================================
// Feature Context
// ============================================================================

/**
 * Type of UI element that can be focused
 */
export type UIElementType = 
  | 'button'
  | 'input'
  | 'select'
  | 'modal'
  | 'dropdown'
  | 'table'
  | 'chart'
  | 'navigation'
  | 'tab'
  | 'card'
  | 'form'
  | 'list'
  | 'link'
  | 'tooltip'
  | 'unknown';

/**
 * Context for a focused UI element
 */
export interface FeatureContext {
  /** Unique identifier for the element */
  elementId: string;
  /** Type of UI element */
  elementType: UIElementType;
  /** Human-readable name/label */
  elementName: string;
  /** Component or feature area */
  featureArea: string;
  /** Current page/route */
  page: string;
  /** Hub identifier (hub-1 through hub-5) */
  hub?: 'hub-1' | 'hub-2' | 'hub-3' | 'hub-4' | 'hub-5';
  /** Optional: Specific feature ID */
  featureId?: string;
  /** Optional: Parent component chain */
  parentChain?: string[];
  /** Optional: Data attributes */
  dataAttributes?: Record<string, string>;
}

// ============================================================================
// User Actions
// ============================================================================

/**
 * Types of user actions that can be tracked
 */
export type UserActionType =
  | 'click'
  | 'scroll'
  | 'hover'
  | 'focus'
  | 'blur'
  | 'input'
  | 'submit'
  | 'error'
  | 'navigation'
  | 'resize'
  | 'keypress'
  | 'copy'
  | 'paste'
  | 'download'
  | 'search';

/**
 * A tracked user action
 */
export interface UserAction {
  /** Unique action ID */
  id: string;
  /** Type of action */
  type: UserActionType;
  /** Timestamp */
  timestamp: number;
  /** Target element info */
  target?: FeatureContext;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Page at time of action */
  page: string;
  /** Whether this action was an error */
  isError?: boolean;
}

// ============================================================================
// Frustration Signals
// ============================================================================

/**
 * Types of frustration signals
 */
export type FrustrationType =
  | 'rapid_clicks'
  | 'error_loop'
  | 'repeated_search'
  | 'rage_quit_attempt'
  | 'stuck_on_page'
  | 'form_abandonment'
  | 'back_button_spam'
  | 'refresh_spam';

/**
 * Frustration signal detection
 */
export interface FrustrationSignal {
  /** Type of frustration detected */
  type: FrustrationType;
  /** Severity level (1-10) */
  severity: number;
  /** When detected */
  timestamp: number;
  /** Associated actions */
  relatedActions: string[];
  /** Description for logging/debugging */
  description: string;
  /** Recommended help topic IDs */
  suggestedHelpTopics?: string[];
  /** Whether proactive help should be triggered */
  shouldTriggerHelp: boolean;
}

// ============================================================================
// Help Context
// ============================================================================

/**
 * Main context interface for help targeting
 */
export interface HelpContext {
  /** Unique context ID */
  id: string;
  /** Current page/route */
  currentPage: string;
  /** Current feature being used */
  currentFeature: FeatureContext | null;
  /** User's expertise level */
  helpLevel: HelpLevel;
  /** User's experience state */
  userState: UserState;
  /** Recent actions (last N) */
  recentActions: UserAction[];
  /** Time spent on current page (ms) */
  timeOnPage: number;
  /** Total session time (ms) */
  sessionTime: number;
  /** Whether user is idle */
  isIdle: boolean;
  /** Idle time (ms) */
  idleTime: number;
  /** Any detected frustration signals */
  frustrationSignals: FrustrationSignal[];
  /** Recent errors encountered */
  recentErrors: Error[];
  /** Timestamp when context was captured */
  timestamp: number;
  /** Help topics recently viewed */
  recentlyViewedHelp: string[];
  /** Search queries in this session */
  sessionSearchQueries: string[];
  /** Navigation history */
  navigationHistory: string[];
}

// ============================================================================
// Context History
// ============================================================================

/**
 * Stored context entry for pattern recognition
 */
export interface ContextHistoryEntry extends HelpContext {
  /** Sequence number */
  sequence: number;
}

/**
 * Context store state
 */
export interface ContextStoreState {
  /** Current active context */
  currentContext: HelpContext;
  /** History of contexts (for pattern recognition) */
  contextHistory: ContextHistoryEntry[];
  /** Maximum history size */
  maxHistorySize: number;
}

// ============================================================================
// Context Detection Options
// ============================================================================

/**
 * Configuration options for context detection
 */
export interface ContextDetectionOptions {
  /** Idle timeout in ms (default: 30000) */
  idleTimeoutMs?: number;
  /** Maximum actions to track (default: 50) */
  maxActionsTracked?: number;
  /** Rapid click threshold (clicks per second) */
  rapidClickThreshold?: number;
  /** Error loop threshold (errors in time window) */
  errorLoopThreshold?: number;
  /** Frustration detection window (ms) */
  frustrationWindowMs?: number;
  /** Maximum context history to keep */
  maxContextHistory?: number;
  /** Whether to track scroll events */
  trackScroll?: boolean;
  /** Whether to track hover events */
  trackHover?: boolean;
  /** Whether to enable frustration detection */
  enableFrustrationDetection?: boolean;
  /** Callback when frustration is detected */
  onFrustrationDetected?: (signal: FrustrationSignal) => void;
  /** Callback when user becomes idle */
  onIdle?: () => void;
  /** Callback when user becomes active */
  onActive?: () => void;
}

// ============================================================================
// Context Detector Return
// ============================================================================

/**
 * Return type for useContextDetection hook
 */
export interface UseContextDetectionReturn {
  /** Current help context */
  context: HelpContext;
  /** Whether context is being tracked */
  isTracking: boolean;
  /** Start tracking context */
  startTracking: () => void;
  /** Stop tracking context */
  stopTracking: () => void;
  /** Update context manually */
  updateContext: (updates: Partial<HelpContext>) => void;
  /** Record a user action */
  recordAction: (action: Omit<UserAction, 'id' | 'timestamp'>) => void;
  /** Clear context history */
  clearHistory: () => void;
  /** Get context summary for help targeting */
  getContextSummary: () => ContextSummary;
  /** Recent frustration signals */
  recentFrustrations: FrustrationSignal[];
  /** Time since last action */
  timeSinceLastAction: number;
}

/**
 * Simplified context summary for help targeting
 */
export interface ContextSummary {
  /** Current page */
  page: string;
  /** Current feature */
  feature: string | null;
  /** Help level */
  level: HelpLevel;
  /** User state */
  userState: UserState;
  /** Is user idle */
  isIdle: boolean;
  /** Has frustration signals */
  hasFrustration: boolean;
  /** Top frustration type */
  primaryFrustration?: FrustrationType;
  /** Recent error count */
  recentErrorCount: number;
  /** Suggested help topics */
  suggestedTopics: string[];
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default context detection options
 */
export const DEFAULT_CONTEXT_OPTIONS: Required<ContextDetectionOptions> = {
  idleTimeoutMs: 30000,
  maxActionsTracked: 50,
  rapidClickThreshold: 3,
  errorLoopThreshold: 3,
  frustrationWindowMs: 10000,
  maxContextHistory: 20,
  trackScroll: true,
  trackHover: false,
  enableFrustrationDetection: true,
  onFrustrationDetected: () => {},
  onIdle: () => {},
  onActive: () => {},
};

/**
 * Create initial empty context
 */
export function createInitialContext(): HelpContext {
  return {
    id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    currentPage: window.location.pathname,
    currentFeature: null,
    helpLevel: 'beginner',
    userState: 'new',
    recentActions: [],
    timeOnPage: 0,
    sessionTime: 0,
    isIdle: false,
    idleTime: 0,
    frustrationSignals: [],
    recentErrors: [],
    timestamp: Date.now(),
    recentlyViewedHelp: [],
    sessionSearchQueries: [],
    navigationHistory: [window.location.pathname],
  };
}
