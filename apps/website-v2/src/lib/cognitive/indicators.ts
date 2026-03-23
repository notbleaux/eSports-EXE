/** [Ver001.000]
 * Cognitive Load Indicators
 * =========================
 * Tracks specific indicators of cognitive load and user confusion.
 * 
 * Features:
 * - Typing speed variance tracking
 * - Error rate calculation
 * - Back navigation frequency
 * - Help request pattern analysis
 * - Input field interaction tracking
 * 
 * Integration:
 * - Used by loadDetector for metric calculation
 * - Provides granular insight into user stress
 * - Enables targeted UI adaptations
 * 
 * @module lib/cognitive/indicators
 */

import type {
  TypingPattern,
  InputInteraction,
  NavigationPattern,
  HelpRequestPattern,
  ErrorRecord,
} from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Error record with metadata
 */
interface ErrorRecordInternal {
  id: string;
  type: 'validation' | 'system' | 'user' | 'network';
  message: string;
  fieldId?: string;
  timestamp: number;
  resolved: boolean;
  recoveryTime?: number;
}

/**
 * Typing session tracking
 */
interface TypingSession {
  fieldId: string;
  startTime: number;
  endTime?: number;
  keystrokes: Array<{
    key: string;
    timestamp: number;
  }>;
  corrections: number;
  finalValue: string;
}

/**
 * Back navigation entry
 */
interface BackNavigationEntry {
  timestamp: number;
  fromPath: string;
  toPath: string;
  timeOnPage: number;
}

/**
 * Help request entry
 */
interface HelpRequestEntry {
  id: string;
  type: string;
  timestamp: number;
  context?: string;
  resolved: boolean;
  resolutionTime?: number;
}

/**
 * Indicator state
 */
interface IndicatorState {
  errors: ErrorRecordInternal[];
  typingSessions: Map<string, TypingSession>;
  currentTypingSession: TypingSession | null;
  backNavigations: BackNavigationEntry[];
  helpRequests: HelpRequestEntry[];
  inputInteractions: Map<string, InputInteraction>;
  lastInputTime: number;
  sessionStartTime: number;
}

// ============================================================================
// State Management
// ============================================================================

let state: IndicatorState = {
  errors: [],
  typingSessions: new Map(),
  currentTypingSession: null,
  backNavigations: [],
  helpRequests: [],
  inputInteractions: new Map(),
  lastInputTime: 0,
  sessionStartTime: Date.now(),
};

// Configuration
const CONFIG = {
  maxErrorsStored: 50,
  maxBackNavigationsStored: 20,
  maxHelpRequestsStored: 30,
  analysisWindowMs: 300000, // 5 minutes
  typingSessionTimeoutMs: 30000, // 30 seconds
  highErrorThreshold: 3,
  highBackNavigationThreshold: 3,
  highHelpRequestThreshold: 2,
};

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Record an error occurrence
 */
export function recordError(
  type: ErrorRecordInternal['type'],
  message: string,
  fieldId?: string
): void {
  const error: ErrorRecordInternal = {
    id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    fieldId,
    timestamp: Date.now(),
    resolved: false,
  };

  state.errors.push(error);

  // Clean old errors
  cleanupOldErrors();

  // Trim to max size
  if (state.errors.length > CONFIG.maxErrorsStored) {
    state.errors = state.errors.slice(-CONFIG.maxErrorsStored);
  }
}

/**
 * Mark an error as resolved
 */
export function resolveError(errorId: string): void {
  const error = state.errors.find(e => e.id === errorId);
  if (error) {
    error.resolved = true;
    error.recoveryTime = Date.now() - error.timestamp;
  }
}

/**
 * Resolve errors by field
 */
export function resolveErrorsByField(fieldId: string): void {
  state.errors
    .filter(e => e.fieldId === fieldId && !e.resolved)
    .forEach(e => {
      e.resolved = true;
      e.recoveryTime = Date.now() - e.timestamp;
    });
}

/**
 * Get error rate over time window
 */
export function getErrorRate(timeWindowMs: number = CONFIG.analysisWindowMs): number {
  const cutoff = Date.now() - timeWindowMs;
  const recentErrors = state.errors.filter(e => e.timestamp > cutoff);
  
  if (recentErrors.length === 0) return 0;

  // Calculate errors per minute
  const timeSpan = Math.max(timeWindowMs, Date.now() - state.sessionStartTime);
  const minutes = timeSpan / 60000;
  return recentErrors.length / Math.max(minutes, 1);
}

/**
 * Get error pattern analysis
 */
export function getErrorPattern(): {
  totalErrors: number;
  unresolvedErrors: number;
  errorRate: number;
  fieldWithMostErrors: string | null;
  mostCommonType: ErrorRecordInternal['type'] | null;
  isErrorProne: boolean;
} {
  const now = Date.now();
  const cutoff = now - CONFIG.analysisWindowMs;
  const recentErrors = state.errors.filter(e => e.timestamp > cutoff);

  // Count by field
  const fieldCounts = new Map<string, number>();
  const typeCounts = new Map<ErrorRecordInternal['type'], number>();

  recentErrors.forEach(e => {
    if (e.fieldId) {
      fieldCounts.set(e.fieldId, (fieldCounts.get(e.fieldId) || 0) + 1);
    }
    typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
  });

  // Find field with most errors
  let fieldWithMostErrors: string | null = null;
  let maxFieldCount = 0;
  fieldCounts.forEach((count, field) => {
    if (count > maxFieldCount) {
      maxFieldCount = count;
      fieldWithMostErrors = field;
    }
  });

  // Find most common type
  let mostCommonType: ErrorRecordInternal['type'] | null = null;
  let maxTypeCount = 0;
  typeCounts.forEach((count, type) => {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      mostCommonType = type;
    }
  });

  const errorRate = getErrorRate();

  return {
    totalErrors: recentErrors.length,
    unresolvedErrors: recentErrors.filter(e => !e.resolved).length,
    errorRate,
    fieldWithMostErrors,
    mostCommonType,
    isErrorProne: recentErrors.length >= CONFIG.highErrorThreshold || errorRate > 2,
  };
}

/**
 * Clean up old errors
 */
function cleanupOldErrors(): void {
  const cutoff = Date.now() - CONFIG.analysisWindowMs * 2;
  state.errors = state.errors.filter(e => e.timestamp > cutoff);
}

// ============================================================================
// Typing Pattern Tracking
// ============================================================================

/**
 * Start tracking typing for a field
 */
export function startTypingSession(fieldId: string): void {
  // End any existing session
  if (state.currentTypingSession) {
    endTypingSession();
  }

  state.currentTypingSession = {
    fieldId,
    startTime: Date.now(),
    keystrokes: [],
    corrections: 0,
    finalValue: '',
  };
}

/**
 * Record a keystroke in the current session
 */
export function recordKeystroke(key: string): void {
  if (!state.currentTypingSession) return;

  state.currentTypingSession.keystrokes.push({
    key,
    timestamp: Date.now(),
  });

  // Track corrections
  if (key === 'Backspace' || key === 'Delete') {
    state.currentTypingSession.corrections++;
  }

  state.lastInputTime = Date.now();
}

/**
 * End the current typing session
 */
export function endTypingSession(finalValue?: string): void {
  if (!state.currentTypingSession) return;

  const session = state.currentTypingSession;
  session.endTime = Date.now();
  if (finalValue !== undefined) {
    session.finalValue = finalValue;
  } else {
    // Try to get value from DOM
    const element = document.getElementById(session.fieldId) as HTMLInputElement | null;
    if (element) {
      session.finalValue = element.value;
    }
  }

  // Store session
  state.typingSessions.set(session.fieldId, session);
  state.currentTypingSession = null;

  // Clean old sessions
  cleanupOldTypingSessions();
}

/**
 * Get typing pattern for a field
 */
export function getTypingPattern(fieldId?: string): TypingPattern | null {
  const sessions = fieldId
    ? [state.typingSessions.get(fieldId)].filter(Boolean) as TypingSession[]
    : Array.from(state.typingSessions.values());

  if (sessions.length === 0) return null;

  // Aggregate all sessions
  let totalKeystrokes = 0;
  let totalCorrections = 0;
  let totalTime = 0;
  const allIntervals: number[] = [];

  sessions.forEach(session => {
    totalKeystrokes += session.keystrokes.length;
    totalCorrections += session.corrections;
    
    if (session.endTime) {
      totalTime += session.endTime - session.startTime;
    }

    // Calculate intervals
    for (let i = 1; i < session.keystrokes.length; i++) {
      allIntervals.push(
        session.keystrokes[i].timestamp - session.keystrokes[i - 1].timestamp
      );
    }
  });

  if (totalKeystrokes === 0) return null;

  // Calculate average speed (chars per minute)
  const averageSpeed = totalTime > 0 
    ? (totalKeystrokes / totalTime) * 60000 
    : 0;

  // Calculate speed variance
  const meanInterval = allIntervals.length > 0
    ? allIntervals.reduce((a, b) => a + b, 0) / allIntervals.length
    : 0;

  const variance = allIntervals.length > 0
    ? allIntervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - meanInterval, 2);
      }, 0) / allIntervals.length
    : 0;

  const speedVariance = meanInterval > 0 ? Math.sqrt(variance) / meanInterval : 0;

  // Calculate error rate
  const errorRate = totalKeystrokes > 0 ? totalCorrections / totalKeystrokes : 0;

  return {
    averageSpeed,
    speedVariance,
    correctionCount: totalCorrections,
    pauseDuration: meanInterval,
    errorRate,
  };
}

/**
 * Get typing stress indicator
 */
export function getTypingStressIndicator(): {
  hasHighVariance: boolean;
  hasHighErrorRate: boolean;
  hasFrequentPauses: boolean;
  overallStress: 'low' | 'medium' | 'high';
} {
  const pattern = getTypingPattern();

  if (!pattern) {
    return {
      hasHighVariance: false,
      hasHighErrorRate: false,
      hasFrequentPauses: false,
      overallStress: 'low',
    };
  }

  const hasHighVariance = pattern.speedVariance > 0.5;
  const hasHighErrorRate = pattern.errorRate > 0.1;
  const hasFrequentPauses = pattern.pauseDuration > 2000;

  // Calculate overall stress
  let stressScore = 0;
  if (hasHighVariance) stressScore++;
  if (hasHighErrorRate) stressScore++;
  if (hasFrequentPauses) stressScore++;

  const overallStress = stressScore === 0 ? 'low' : stressScore === 1 ? 'medium' : 'high';

  return {
    hasHighVariance,
    hasHighErrorRate,
    hasFrequentPauses,
    overallStress,
  };
}

/**
 * Clean up old typing sessions
 */
function cleanupOldTypingSessions(): void {
  const cutoff = Date.now() - CONFIG.analysisWindowMs;
  
  state.typingSessions.forEach((session, fieldId) => {
    if (session.endTime && session.endTime < cutoff) {
      state.typingSessions.delete(fieldId);
    }
  });
}

// ============================================================================
// Back Navigation Tracking
// ============================================================================

/**
 * Record a back navigation
 */
export function recordBackNavigation(fromPath: string, toPath: string): void {
  const entry: BackNavigationEntry = {
    timestamp: Date.now(),
    fromPath,
    toPath,
    timeOnPage: 0, // Should be set by caller or calculated
  };

  state.backNavigations.push(entry);

  // Clean and trim
  cleanupOldBackNavigations();
  
  if (state.backNavigations.length > CONFIG.maxBackNavigationsStored) {
    state.backNavigations = state.backNavigations.slice(-CONFIG.maxBackNavigationsStored);
  }
}

/**
 * Get back navigation frequency
 */
export function getBackNavigationFrequency(
  timeWindowMs: number = CONFIG.analysisWindowMs
): {
  count: number;
  frequency: number;
  isFrequent: boolean;
  patterns: Array<{ fromPath: string; count: number }>;
} {
  const cutoff = Date.now() - timeWindowMs;
  const recentNavigations = state.backNavigations.filter(n => n.timestamp > cutoff);

  // Calculate frequency (per minute)
  const minutes = timeWindowMs / 60000;
  const frequency = recentNavigations.length / Math.max(minutes, 1);

  // Analyze patterns
  const pathCounts = new Map<string, number>();
  recentNavigations.forEach(n => {
    pathCounts.set(n.fromPath, (pathCounts.get(n.fromPath) || 0) + 1);
  });

  const patterns = Array.from(pathCounts.entries())
    .map(([fromPath, count]) => ({ fromPath, count }))
    .sort((a, b) => b.count - a.count);

  return {
    count: recentNavigations.length,
    frequency,
    isFrequent: recentNavigations.length >= CONFIG.highBackNavigationThreshold || frequency > 2,
    patterns,
  };
}

/**
 * Get navigation pattern
 */
export function getNavigationPattern(): NavigationPattern {
  const backNavInfo = getBackNavigationFrequency();

  return {
    backCount: backNavInfo.count,
    reloadCount: 0, // Tracked separately if needed
    pathComplexity: backNavInfo.patterns.length / Math.max(backNavInfo.count, 1),
    appearsLost: backNavInfo.isFrequent,
  };
}

/**
 * Clean up old back navigations
 */
function cleanupOldBackNavigations(): void {
  const cutoff = Date.now() - CONFIG.analysisWindowMs * 2;
  state.backNavigations = state.backNavigations.filter(n => n.timestamp > cutoff);
}

// ============================================================================
// Help Request Tracking
// ============================================================================

/**
 * Record a help request
 */
export function recordHelpRequest(type: string, context?: string): string {
  const id = `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const request: HelpRequestEntry = {
    id,
    type,
    timestamp: Date.now(),
    context,
    resolved: false,
  };

  state.helpRequests.push(request);

  // Clean and trim
  cleanupOldHelpRequests();

  if (state.helpRequests.length > CONFIG.maxHelpRequestsStored) {
    state.helpRequests = state.helpRequests.slice(-CONFIG.maxHelpRequestsStored);
  }

  return id;
}

/**
 * Mark help request as resolved
 */
export function resolveHelpRequest(requestId: string): void {
  const request = state.helpRequests.find(r => r.id === requestId);
  if (request) {
    request.resolved = true;
    request.resolutionTime = Date.now() - request.timestamp;
  }
}

/**
 * Get help request pattern
 */
export function getHelpRequestPattern(): HelpRequestPattern {
  const now = Date.now();
  const cutoff = now - CONFIG.analysisWindowMs;
  const recentRequests = state.helpRequests.filter(r => r.timestamp > cutoff);

  // Calculate time between requests
  let timeBetweenRequests = 0;
  if (recentRequests.length >= 2) {
    const times = recentRequests.map(r => r.timestamp).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < times.length; i++) {
      gaps.push(times[i] - times[i - 1]);
    }
    timeBetweenRequests = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  // Calculate resolution rate
  const resolvedCount = recentRequests.filter(r => r.resolved).length;
  const resolutionRate = recentRequests.length > 0 
    ? resolvedCount / recentRequests.length 
    : 0;

  return {
    requestCount: recentRequests.length,
    requestTypes: [...new Set(recentRequests.map(r => r.type))],
    timeBetweenRequests,
    resolutionRate,
  };
}

/**
 * Get help seeking behavior
 */
export function getHelpSeekingBehavior(): {
  isFrequentRequester: boolean;
  isUnsuccessful: boolean;
  needsProactiveHelp: boolean;
  preferredHelpTypes: string[];
} {
  const pattern = getHelpRequestPattern();

  const isFrequentRequester = pattern.requestCount >= CONFIG.highHelpRequestThreshold;
  const isUnsuccessful = pattern.resolutionRate < 0.5 && pattern.requestCount > 0;
  const needsProactiveHelp = isFrequentRequester || isUnsuccessful;

  // Count by type
  const typeCounts = new Map<string, number>();
  state.helpRequests.forEach(r => {
    typeCounts.set(r.type, (typeCounts.get(r.type) || 0) + 1);
  });

  const preferredHelpTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  return {
    isFrequentRequester,
    isUnsuccessful,
    needsProactiveHelp,
    preferredHelpTypes,
  };
}

/**
 * Clean up old help requests
 */
function cleanupOldHelpRequests(): void {
  const cutoff = Date.now() - CONFIG.analysisWindowMs * 2;
  state.helpRequests = state.helpRequests.filter(r => r.timestamp > cutoff);
}

// ============================================================================
// Input Field Tracking
// ============================================================================

/**
 * Track input field focus
 */
export function trackInputFocus(fieldId: string): void {
  const now = Date.now();
  const existing = state.inputInteractions.get(fieldId);

  if (existing) {
    existing.focusCount++;
    // Don't update totalTime on focus, do it on blur
  } else {
    state.inputInteractions.set(fieldId, {
      fieldId,
      timeToFirstInput: 0,
      totalTime: 0,
      focusCount: 1,
      completed: false,
    });
  }

  state.lastInputTime = now;
}

/**
 * Track input field blur
 */
export function trackInputBlur(fieldId: string, completed: boolean = false): void {
  const interaction = state.inputInteractions.get(fieldId);
  if (!interaction) return;

  const now = Date.now();
  const timeSpent = now - state.lastInputTime;
  interaction.totalTime += timeSpent;
  interaction.completed = completed;

  // Calculate time to first input if not set
  if (interaction.timeToFirstInput === 0 && interaction.totalTime > 0) {
    interaction.timeToFirstInput = timeSpent;
  }
}

/**
 * Get input field interactions
 */
export function getInputInteractions(): InputInteraction[] {
  return Array.from(state.inputInteractions.values());
}

/**
 * Get problematic fields
 */
export function getProblematicFields(): Array<{
  fieldId: string;
  issue: 'slow' | 'repeated' | 'incomplete';
  severity: 'low' | 'medium' | 'high';
}> {
  const problems: Array<{
    fieldId: string;
    issue: 'slow' | 'repeated' | 'incomplete';
    severity: 'low' | 'medium' | 'high';
  }> = [];

  state.inputInteractions.forEach(interaction => {
    // Check for slow completion
    if (interaction.totalTime > 60000) {
      problems.push({
        fieldId: interaction.fieldId,
        issue: 'slow',
        severity: interaction.totalTime > 120000 ? 'high' : 'medium',
      });
    }

    // Check for repeated focus
    if (interaction.focusCount > 3) {
      problems.push({
        fieldId: interaction.fieldId,
        issue: 'repeated',
        severity: interaction.focusCount > 5 ? 'high' : 'medium',
      });
    }

    // Check for incomplete
    if (!interaction.completed && interaction.totalTime > 30000) {
      problems.push({
        fieldId: interaction.fieldId,
        issue: 'incomplete',
        severity: interaction.totalTime > 60000 ? 'high' : 'medium',
      });
    }
  });

  return problems;
}

// ============================================================================
// Overall Indicators
// ============================================================================

/**
 * Get all cognitive load indicators
 */
export function getAllIndicators(): {
  errors: ReturnType<typeof getErrorPattern>;
  typing: ReturnType<typeof getTypingStressIndicator>;
  navigation: ReturnType<typeof getBackNavigationFrequency>;
  helpRequests: ReturnType<typeof getHelpRequestPattern>;
  helpBehavior: ReturnType<typeof getHelpSeekingBehavior>;
  problematicFields: ReturnType<typeof getProblematicFields>;
  overallStress: 'low' | 'medium' | 'high' | 'critical';
} {
  const errors = getErrorPattern();
  const typing = getTypingStressIndicator();
  const navigation = getBackNavigationFrequency();
  const helpRequests = getHelpRequestPattern();
  const helpBehavior = getHelpSeekingBehavior();
  const problematicFields = getProblematicFields();

  // Calculate overall stress
  let stressScore = 0;
  if (errors.isErrorProne) stressScore++;
  if (typing.overallStress === 'high') stressScore += 2;
  else if (typing.overallStress === 'medium') stressScore++;
  if (navigation.isFrequent) stressScore++;
  if (helpBehavior.needsProactiveHelp) stressScore++;
  if (problematicFields.length > 2) stressScore++;

  const overallStress = stressScore === 0 ? 'low' :
    stressScore <= 2 ? 'medium' :
    stressScore <= 4 ? 'high' : 'critical';

  return {
    errors,
    typing,
    navigation,
    helpRequests,
    helpBehavior,
    problematicFields,
    overallStress,
  };
}

/**
 * Reset all indicators
 */
export function resetIndicators(): void {
  state = {
    errors: [],
    typingSessions: new Map(),
    currentTypingSession: null,
    backNavigations: [],
    helpRequests: [],
    inputInteractions: new Map(),
    lastInputTime: 0,
    sessionStartTime: Date.now(),
  };
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  // Error tracking
  recordError,
  resolveError,
  resolveErrorsByField,
  getErrorRate,
  getErrorPattern,

  // Typing tracking
  startTypingSession,
  recordKeystroke,
  endTypingSession,
  getTypingPattern,
  getTypingStressIndicator,

  // Navigation tracking
  recordBackNavigation,
  getBackNavigationFrequency,
  getNavigationPattern,

  // Help request tracking
  recordHelpRequest,
  resolveHelpRequest,
  getHelpRequestPattern,
  getHelpSeekingBehavior,

  // Input tracking
  trackInputFocus,
  trackInputBlur,
  getInputInteractions,
  getProblematicFields,

  // Overall
  getAllIndicators,
  resetIndicators,
};
