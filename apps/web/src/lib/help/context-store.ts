/** [Ver001.000] */
/**
 * Context Store
 * =============
 * Zustand store for context state management.
 * 
 * Features:
 * - Persist last N contexts for pattern recognition
 * - Context history management
 * - Integration with help panel and knowledge graph
 * 
 * Integration:
 * - Works with TL-A1 1-A help panel
 * - Provides context to TL-A1 1-C knowledge graph
 * - Feeds TL-A1 1-D broadcast system
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  HelpContext,
  ContextHistoryEntry,
  UserAction,
  FrustrationSignal,
  HelpLevel,
  UserState,
  FeatureContext,
  ContextSummary,
} from './context-types';
import { createInitialContext } from './context-types';

// ============================================================================
// Store State Interface
// ============================================================================

export interface ContextStore {
  // Current State
  currentContext: HelpContext;
  contextHistory: ContextHistoryEntry[];
  isTracking: boolean;
  sessionStartTime: number;
  
  // Actions
  setCurrentContext: (context: HelpContext) => void;
  updateContext: (updates: Partial<HelpContext>) => void;
  addAction: (action: UserAction) => void;
  addFrustrationSignal: (signal: FrustrationSignal) => void;
  addError: (error: Error) => void;
  setFeatureContext: (feature: FeatureContext | null) => void;
  setPage: (page: string) => void;
  setHelpLevel: (level: HelpLevel) => void;
  setUserState: (state: UserState) => void;
  setIdle: (isIdle: boolean, idleTime?: number) => void;
  addToHistory: () => void;
  clearHistory: () => void;
  startTracking: () => void;
  stopTracking: () => void;
  resetContext: () => void;
  addViewedHelp: (helpId: string) => void;
  addSearchQuery: (query: string) => void;
  updateTimeOnPage: (timeMs: number) => void;
  updateSessionTime: (timeMs: number) => void;
  
  // Selectors
  getRecentActions: (count?: number) => UserAction[];
  getRecentErrors: (count?: number) => Error[];
  getRecentFrustrations: (count?: number) => FrustrationSignal[];
  getActionsByType: (type: UserAction['type']) => UserAction[];
  getContextPattern: () => ContextPattern;
}

// ============================================================================
// Context Pattern Analysis
// ============================================================================

export interface ContextPattern {
  /** Most visited pages */
  topPages: Array<{ page: string; count: number }>;
  /** Most used features */
  topFeatures: Array<{ feature: string; count: number }>;
  /** Action distribution */
  actionDistribution: Record<UserAction['type'], number>;
  /** Frustration frequency */
  frustrationFrequency: number;
  /** Average session time (ms) */
  avgSessionTime: number;
  /** Error rate (errors per minute) */
  errorRate: number;
  /** Help-seeking behavior */
  helpFrequency: number;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_HISTORY_SIZE = 20;
const MAX_ACTIONS_STORED = 50;
const MAX_ERRORS_STORED = 10;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Analyze context history for patterns
 */
function analyzePattern(history: ContextHistoryEntry[]): ContextPattern {
  const pageCounts = new Map<string, number>();
  const featureCounts = new Map<string, number>();
  const actionDist: Record<string, number> = {};
  let totalFrustrations = 0;
  let totalSessionTime = 0;
  let totalErrors = 0;
  let totalHelpViews = 0;

  history.forEach((entry) => {
    // Page counts
    pageCounts.set(entry.currentPage, (pageCounts.get(entry.currentPage) || 0) + 1);
    
    // Feature counts
    if (entry.currentFeature?.featureArea) {
      featureCounts.set(
        entry.currentFeature.featureArea,
        (featureCounts.get(entry.currentFeature.featureArea) || 0) + 1
      );
    }
    
    // Action distribution
    entry.recentActions.forEach((action) => {
      actionDist[action.type] = (actionDist[action.type] || 0) + 1;
    });
    
    // Frustrations
    totalFrustrations += entry.frustrationSignals.length;
    
    // Session time
    totalSessionTime += entry.sessionTime;
    
    // Errors
    totalErrors += entry.recentErrors.length;
    
    // Help views
    totalHelpViews += entry.recentlyViewedHelp.length;
  });

  const historyLength = Math.max(history.length, 1);

  return {
    topPages: Array.from(pageCounts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topFeatures: Array.from(featureCounts.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    actionDistribution: actionDist as Record<UserAction['type'], number>,
    frustrationFrequency: totalFrustrations / historyLength,
    avgSessionTime: totalSessionTime / historyLength,
    errorRate: totalErrors > 0 ? (totalErrors / (totalSessionTime / 60000)) : 0,
    helpFrequency: totalHelpViews / historyLength,
  };
}

// ============================================================================
// Store Creation
// ============================================================================

export const useContextStore = create<ContextStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentContext: createInitialContext(),
      contextHistory: [],
      isTracking: false,
      sessionStartTime: Date.now(),

      // Actions
      setCurrentContext: (context) => set({ currentContext: context }),

      updateContext: (updates) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            ...updates,
            timestamp: Date.now(),
          },
        })),

      addAction: (action) =>
        set((state) => {
          const newActions = [action, ...state.currentContext.recentActions].slice(
            0,
            MAX_ACTIONS_STORED
          );
          return {
            currentContext: {
              ...state.currentContext,
              recentActions: newActions,
              timestamp: Date.now(),
            },
          };
        }),

      addFrustrationSignal: (signal) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            frustrationSignals: [
              signal,
              ...state.currentContext.frustrationSignals,
            ].slice(0, 10),
            timestamp: Date.now(),
          },
        })),

      addError: (error) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            recentErrors: [error, ...state.currentContext.recentErrors].slice(
              0,
              MAX_ERRORS_STORED
            ),
            timestamp: Date.now(),
          },
        })),

      setFeatureContext: (feature) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            currentFeature: feature,
            timestamp: Date.now(),
          },
        })),

      setPage: (page) =>
        set((state) => {
          const newHistory = [
            page,
            ...state.currentContext.navigationHistory,
          ].slice(0, 20);
          return {
            currentContext: {
              ...state.currentContext,
              currentPage: page,
              navigationHistory: newHistory,
              timestamp: Date.now(),
            },
          };
        }),

      setHelpLevel: (level) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            helpLevel: level,
            timestamp: Date.now(),
          },
        })),

      setUserState: (userState) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            userState,
            timestamp: Date.now(),
          },
        })),

      setIdle: (isIdle, idleTime = 0) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            isIdle,
            idleTime,
            timestamp: Date.now(),
          },
        })),

      addToHistory: () =>
        set((state) => {
          const historyEntry: ContextHistoryEntry = {
            ...state.currentContext,
            sequence: state.contextHistory.length,
          };
          const newHistory = [historyEntry, ...state.contextHistory].slice(
            0,
            MAX_HISTORY_SIZE
          );
          return { contextHistory: newHistory };
        }),

      clearHistory: () => set({ contextHistory: [] }),

      startTracking: () => set({ isTracking: true, sessionStartTime: Date.now() }),

      stopTracking: () => set({ isTracking: false }),

      resetContext: () =>
        set({
          currentContext: createInitialContext(),
          isTracking: false,
          sessionStartTime: Date.now(),
        }),

      addViewedHelp: (helpId) =>
        set((state) => {
          const newViewed = [
            helpId,
            ...state.currentContext.recentlyViewedHelp.filter((id) => id !== helpId),
          ].slice(0, 20);
          return {
            currentContext: {
              ...state.currentContext,
              recentlyViewedHelp: newViewed,
              timestamp: Date.now(),
            },
          };
        }),

      addSearchQuery: (query) =>
        set((state) => {
          if (!query.trim()) return state;
          const newQueries = [
            query.trim(),
            ...state.currentContext.sessionSearchQueries,
          ].slice(0, 20);
          return {
            currentContext: {
              ...state.currentContext,
              sessionSearchQueries: newQueries,
              timestamp: Date.now(),
            },
          };
        }),

      updateTimeOnPage: (timeMs) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            timeOnPage: timeMs,
            timestamp: Date.now(),
          },
        })),

      updateSessionTime: (timeMs) =>
        set((state) => ({
          currentContext: {
            ...state.currentContext,
            sessionTime: timeMs,
            timestamp: Date.now(),
          },
        })),

      // Selectors
      getRecentActions: (count = 10) => {
        const { currentContext } = get();
        return currentContext.recentActions.slice(0, count);
      },

      getRecentErrors: (count = 5) => {
        const { currentContext } = get();
        return currentContext.recentErrors.slice(0, count);
      },

      getRecentFrustrations: (count = 5) => {
        const { currentContext } = get();
        return currentContext.frustrationSignals.slice(0, count);
      },

      getActionsByType: (type) => {
        const { currentContext } = get();
        return currentContext.recentActions.filter((a) => a.type === type);
      },

      getContextPattern: () => {
        const { contextHistory, currentContext } = get();
        // Include current context in pattern analysis
        const allContexts = [
          { ...currentContext, sequence: contextHistory.length },
          ...contextHistory,
        ];
        return analyzePattern(allContexts);
      },
    }),
    {
      name: 'sator-help-context',
      storage: createJSONStorage(() => localStorage),
      skipHydration: typeof window === 'undefined',
      partialize: (state) => ({
        // Only persist history and user preferences
        contextHistory: state.contextHistory,
        currentContext: {
          ...state.currentContext,
          // Don't persist transient data
          recentActions: [],
          recentErrors: [],
          frustrationSignals: [],
          sessionSearchQueries: [],
          navigationHistory: [],
        },
      }),
    }
  )
);

// ============================================================================
// Non-Hook Store Access
// ============================================================================

/**
 * Get current context outside of React components
 */
export function getCurrentContext(): HelpContext {
  return useContextStore.getState().currentContext;
}

/**
 * Update context outside of React components
 */
export function updateContext(updates: Partial<HelpContext>): void {
  useContextStore.getState().updateContext(updates);
}

/**
 * Add action outside of React components
 */
export function addAction(action: Omit<UserAction, 'id' | 'timestamp'>): void {
  const fullAction: UserAction = {
    ...action,
    id: generateId(),
    timestamp: Date.now(),
  };
  useContextStore.getState().addAction(fullAction);
}

/**
 * Add frustration signal outside of React components
 */
export function addFrustrationSignal(
  signal: Omit<FrustrationSignal, 'timestamp'>
): void {
  const fullSignal: FrustrationSignal = {
    ...signal,
    timestamp: Date.now(),
  };
  useContextStore.getState().addFrustrationSignal(fullSignal);
}

/**
 * Get context pattern outside of React components
 */
export function getContextPattern(): ContextPattern {
  return useContextStore.getState().getContextPattern();
}

// ============================================================================
// Context Summary Builder
// ============================================================================

/**
 * Build context summary for help targeting
 */
export function buildContextSummary(
  context: HelpContext,
  options: {
    includeFrustrations?: boolean;
    includeSuggestions?: boolean;
  } = {}
): ContextSummary {
  const { includeFrustrations = true, includeSuggestions = true } = options;

  const hasFrustration = context.frustrationSignals.length > 0;
  const primaryFrustration = hasFrustration
    ? context.frustrationSignals[0].type
    : undefined;

  // Generate suggested topics based on context
  const suggestedTopics: string[] = [];
  
  if (includeSuggestions) {
    // Add feature-specific topics
    if (context.currentFeature?.featureId) {
      suggestedTopics.push(`feature-${context.currentFeature.featureId}`);
    }
    
    // Add frustration-related topics
    if (hasFrustration && includeFrustrations) {
      context.frustrationSignals.forEach((signal) => {
        if (signal.suggestedHelpTopics) {
          suggestedTopics.push(...signal.suggestedHelpTopics);
        }
      });
    }
    
    // Add error-related topics
    if (context.recentErrors.length > 0) {
      suggestedTopics.push('troubleshooting', 'error-recovery');
    }
    
    // Add beginner topics for new users
    if (context.userState === 'new' || context.helpLevel === 'beginner') {
      suggestedTopics.push('getting-started', 'quick-tour');
    }
  }

  // Remove duplicates
  const uniqueTopics = Array.from(new Set(suggestedTopics));

  return {
    page: context.currentPage,
    feature: context.currentFeature?.featureArea || null,
    level: context.helpLevel,
    userState: context.userState,
    isIdle: context.isIdle,
    hasFrustration,
    primaryFrustration,
    recentErrorCount: context.recentErrors.length,
    suggestedTopics: uniqueTopics,
  };
}

export default useContextStore;
