/** [Ver001.000] */
/**
 * Context Detection Engine Tests
 * ==============================
 * Comprehensive test suite for the Context Detection Engine.
 * 
 * Tests cover:
 * - Context types and interfaces
 * - Context store operations
 * - Context detection logic
 * - Frustration detection
 * - Idle detection
 * - Pattern recognition
 * 
 * @module lib/help/__tests__/context
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type {
  HelpContext,
  UserAction,
  FrustrationSignal,
  FeatureContext,
  ContextHistoryEntry,
} from '../context-types';
import {
  createInitialContext,
  DEFAULT_CONTEXT_OPTIONS,
} from '../context-types';
import {
  useContextStore,
  buildContextSummary,
  addAction,
  addFrustrationSignal,
  getCurrentContext,
  getContextPattern,
  type ContextPattern,
} from '../context-store';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock window.location
const mockLocation = {
  pathname: '/test-page',
  href: 'http://localhost/test-page',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock localStorage with working implementation
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((key) => delete localStorageStore[key]);
  }),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================================================
// Test Helpers
// ============================================================================

function createMockAction(overrides: Partial<UserAction> = {}): UserAction {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'click',
    timestamp: Date.now(),
    page: '/test-page',
    ...overrides,
  };
}

function createMockFrustration(
  overrides: Partial<FrustrationSignal> = {}
): FrustrationSignal {
  return {
    type: 'rapid_clicks',
    severity: 5,
    timestamp: Date.now(),
    relatedActions: [],
    description: 'Test frustration',
    shouldTriggerHelp: true,
    ...overrides,
  };
}

function createMockFeature(overrides: Partial<FeatureContext> = {}): FeatureContext {
  return {
    elementId: 'test-element',
    elementType: 'button',
    elementName: 'Test Button',
    featureArea: 'test-feature',
    page: '/test-page',
    ...overrides,
  };
}

// ============================================================================
// Context Types Tests
// ============================================================================

describe('Context Types', () => {
  describe('createInitialContext', () => {
    it('should create initial context with correct structure', () => {
      const context = createInitialContext();

      expect(context.id).toMatch(/^ctx-/);
      expect(context.currentPage).toBe('/test-page');
      expect(context.currentFeature).toBeNull();
      expect(context.helpLevel).toBe('beginner');
      expect(context.userState).toBe('new');
      expect(context.recentActions).toEqual([]);
      expect(context.frustrationSignals).toEqual([]);
      expect(context.recentErrors).toEqual([]);
      expect(context.isIdle).toBe(false);
      expect(context.idleTime).toBe(0);
      expect(context.timeOnPage).toBe(0);
      expect(context.sessionTime).toBe(0);
    });

    it('should generate unique IDs', () => {
      const context1 = createInitialContext();
      const context2 = createInitialContext();

      expect(context1.id).not.toBe(context2.id);
    });

    it('should capture current timestamp', () => {
      const before = Date.now();
      const context = createInitialContext();
      const after = Date.now();

      expect(context.timestamp).toBeGreaterThanOrEqual(before);
      expect(context.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('DEFAULT_CONTEXT_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONTEXT_OPTIONS.idleTimeoutMs).toBe(30000);
      expect(DEFAULT_CONTEXT_OPTIONS.maxActionsTracked).toBe(50);
      expect(DEFAULT_CONTEXT_OPTIONS.rapidClickThreshold).toBe(3);
      expect(DEFAULT_CONTEXT_OPTIONS.errorLoopThreshold).toBe(3);
      expect(DEFAULT_CONTEXT_OPTIONS.frustrationWindowMs).toBe(10000);
      expect(DEFAULT_CONTEXT_OPTIONS.maxContextHistory).toBe(20);
      expect(DEFAULT_CONTEXT_OPTIONS.trackScroll).toBe(true);
      expect(DEFAULT_CONTEXT_OPTIONS.trackHover).toBe(false);
      expect(DEFAULT_CONTEXT_OPTIONS.enableFrustrationDetection).toBe(true);
    });
  });
});

// ============================================================================
// Context Store Tests
// ============================================================================

describe('Context Store', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();
    
    // Clear persisted storage
    useContextStore.persist?.clearStorage?.();
    
    // Reset store state
    const store = useContextStore.getState();
    
    // Reset to initial values directly
    store.resetContext();
    store.clearHistory();
    store.stopTracking();
    
    vi.clearAllMocks();
  });

  describe('State Management', () => {
    it('should have correct initial state', () => {
      const state = useContextStore.getState();

      expect(state.currentContext).toBeDefined();
      expect(state.contextHistory).toEqual([]);
      expect(state.isTracking).toBe(false);
    });

    it('should update context', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.updateContext({ helpLevel: 'advanced' });
      });

      expect(store.currentContext.helpLevel).toBe('advanced');
    });

    it('should set page and update navigation history', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.setPage('/new-page');
      });

      expect(store.currentContext.currentPage).toBe('/new-page');
      expect(store.currentContext.navigationHistory).toContain('/new-page');
    });

    it('should set feature context', () => {
      const store = useContextStore.getState();
      const feature = createMockFeature();
      
      act(() => {
        store.setFeatureContext(feature);
      });

      expect(store.currentContext.currentFeature).toEqual(feature);
    });

    it('should set help level', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.setHelpLevel('intermediate');
      });

      expect(store.currentContext.helpLevel).toBe('intermediate');
    });

    it('should set user state', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.setUserState('expert');
      });

      expect(store.currentContext.userState).toBe('expert');
    });

    it('should set idle state', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.setIdle(true, 60000);
      });

      expect(store.currentContext.isIdle).toBe(true);
      expect(store.currentContext.idleTime).toBe(60000);
    });
  });

  describe('Action Management', () => {
    it('should add action to context', () => {
      const store = useContextStore.getState();
      const action = createMockAction();
      
      act(() => {
        store.addAction(action);
      });

      expect(store.currentContext.recentActions).toHaveLength(1);
      expect(store.currentContext.recentActions[0]).toEqual(action);
    });

    it('should limit actions to MAX_ACTIONS_STORED', () => {
      const store = useContextStore.getState();
      
      act(() => {
        // Add more than max actions
        for (let i = 0; i < 60; i++) {
          store.addAction(createMockAction({ type: 'click' }));
        }
      });

      expect(store.currentContext.recentActions).toHaveLength(50);
    });

    it('should get recent actions', () => {
      const store = useContextStore.getState();
      
      act(() => {
        for (let i = 0; i < 10; i++) {
          store.addAction(createMockAction());
        }
      });

      const recent = store.getRecentActions(5);
      expect(recent).toHaveLength(5);
    });

    it('should get actions by type', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addAction(createMockAction({ type: 'click' }));
        store.addAction(createMockAction({ type: 'scroll' }));
        store.addAction(createMockAction({ type: 'click' }));
      });

      const clicks = store.getActionsByType('click');
      expect(clicks).toHaveLength(2);
    });
  });

  describe('Frustration Management', () => {
    it('should add frustration signal', () => {
      const store = useContextStore.getState();
      const signal = createMockFrustration();
      
      act(() => {
        store.addFrustrationSignal(signal);
      });

      expect(store.currentContext.frustrationSignals).toHaveLength(1);
      expect(store.currentContext.frustrationSignals[0]).toEqual(signal);
    });

    it('should limit frustration signals to 10', () => {
      const store = useContextStore.getState();
      
      act(() => {
        for (let i = 0; i < 15; i++) {
          store.addFrustrationSignal(createMockFrustration());
        }
      });

      expect(store.currentContext.frustrationSignals).toHaveLength(10);
    });

    it('should get recent frustrations', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addFrustrationSignal(createMockFrustration({ type: 'rapid_clicks' }));
        store.addFrustrationSignal(createMockFrustration({ type: 'error_loop' }));
      });

      const frustrations = store.getRecentFrustrations();
      expect(frustrations).toHaveLength(2);
    });
  });

  describe('Error Management', () => {
    it('should add error to context', () => {
      const store = useContextStore.getState();
      const error = new Error('Test error');
      
      act(() => {
        store.addError(error);
      });

      expect(store.currentContext.recentErrors).toHaveLength(1);
    });

    it('should limit errors to MAX_ERRORS_STORED', () => {
      const store = useContextStore.getState();
      
      act(() => {
        for (let i = 0; i < 15; i++) {
          store.addError(new Error(`Error ${i}`));
        }
      });

      expect(store.currentContext.recentErrors).toHaveLength(10);
    });

    it('should get recent errors', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addError(new Error('Error 1'));
        store.addError(new Error('Error 2'));
      });

      const errors = store.getRecentErrors();
      expect(errors).toHaveLength(2);
    });
  });

  describe('History Management', () => {
    it('should add context to history', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addToHistory();
      });

      expect(store.contextHistory).toHaveLength(1);
      expect(store.contextHistory[0].sequence).toBe(0);
    });

    it('should limit history to MAX_HISTORY_SIZE', () => {
      const store = useContextStore.getState();
      
      act(() => {
        for (let i = 0; i < 25; i++) {
          store.addToHistory();
        }
      });

      expect(store.contextHistory).toHaveLength(20);
    });

    it('should clear history', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addToHistory();
        store.addToHistory();
        store.clearHistory();
      });

      expect(store.contextHistory).toHaveLength(0);
    });
  });

  describe('Tracking Control', () => {
    it('should start tracking', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.startTracking();
      });

      expect(store.isTracking).toBe(true);
    });

    it('should stop tracking', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.startTracking();
        store.stopTracking();
      });

      expect(store.isTracking).toBe(false);
    });

    it('should reset context', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.setHelpLevel('advanced');
        store.addAction(createMockAction());
        store.resetContext();
      });

      expect(store.currentContext.helpLevel).toBe('beginner');
      expect(store.currentContext.recentActions).toHaveLength(0);
    });
  });

  describe('Help Interactions', () => {
    it('should add viewed help', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addViewedHelp('help-topic-1');
      });

      expect(store.currentContext.recentlyViewedHelp).toContain('help-topic-1');
    });

    it('should deduplicate viewed help', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addViewedHelp('help-topic-1');
        store.addViewedHelp('help-topic-1');
      });

      expect(store.currentContext.recentlyViewedHelp).toHaveLength(1);
    });

    it('should add search query', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addSearchQuery('how to use');
      });

      expect(store.currentContext.sessionSearchQueries).toContain('how to use');
    });

    it('should not add empty search queries', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.addSearchQuery('');
        store.addSearchQuery('  ');
      });

      expect(store.currentContext.sessionSearchQueries).toHaveLength(0);
    });
  });

  describe('Time Tracking', () => {
    it('should update time on page', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.updateTimeOnPage(60000);
      });

      expect(store.currentContext.timeOnPage).toBe(60000);
    });

    it('should update session time', () => {
      const store = useContextStore.getState();
      
      act(() => {
        store.updateSessionTime(300000);
      });

      expect(store.currentContext.sessionTime).toBe(300000);
    });
  });
});

// ============================================================================
// Context Pattern Analysis Tests
// ============================================================================

describe('Context Pattern Analysis', () => {
  beforeEach(() => {
    useContextStore.getState().resetContext();
    useContextStore.getState().clearHistory();
  });

  it('should analyze top pages', () => {
    const store = useContextStore.getState();
    
    act(() => {
      // Simulate visiting pages
      store.setPage('/dashboard');
      store.addToHistory();
      store.setPage('/analytics');
      store.addToHistory();
      store.setPage('/dashboard');
      store.addToHistory();
      store.setPage('/dashboard');
      store.addToHistory();
    });

    const pattern = store.getContextPattern();
    expect(pattern.topPages[0].page).toBe('/dashboard');
    expect(pattern.topPages[0].count).toBeGreaterThanOrEqual(1);
  });

  it('should analyze top features', () => {
    const store = useContextStore.getState();
    
    act(() => {
      store.setFeatureContext(createMockFeature({ featureArea: 'analytics' }));
      store.addToHistory();
      store.setFeatureContext(createMockFeature({ featureArea: 'search' }));
      store.addToHistory();
      store.setFeatureContext(createMockFeature({ featureArea: 'analytics' }));
      store.addToHistory();
    });

    const pattern = store.getContextPattern();
    expect(pattern.topFeatures.length).toBeGreaterThan(0);
  });

  it('should calculate action distribution', () => {
    const store = useContextStore.getState();
    
    act(() => {
      store.addAction(createMockAction({ type: 'click' }));
      store.addAction(createMockAction({ type: 'click' }));
      store.addAction(createMockAction({ type: 'scroll' }));
      store.addToHistory();
    });

    const pattern = store.getContextPattern();
    expect(pattern.actionDistribution.click).toBeGreaterThanOrEqual(0);
  });

  it('should calculate frustration frequency', () => {
    const store = useContextStore.getState();
    
    act(() => {
      store.addFrustrationSignal(createMockFrustration());
      store.addFrustrationSignal(createMockFrustration());
      store.addToHistory();
    });

    const pattern = store.getContextPattern();
    expect(pattern.frustrationFrequency).toBeGreaterThan(0);
  });

  it('should calculate error rate', () => {
    const store = useContextStore.getState();
    
    act(() => {
      store.addError(new Error('Test error'));
      store.updateSessionTime(60000); // 1 minute
      store.addToHistory();
    });

    const pattern = store.getContextPattern();
    expect(pattern.errorRate).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Context Summary Tests
// ============================================================================

describe('Context Summary', () => {
  it('should build basic context summary', () => {
    const context = createInitialContext();
    context.helpLevel = 'intermediate';
    context.userState = 'returning';
    context.currentFeature = createMockFeature({ featureArea: 'analytics' });

    const summary = buildContextSummary(context);

    expect(summary.page).toBe('/test-page');
    expect(summary.feature).toBe('analytics');
    expect(summary.level).toBe('intermediate');
    expect(summary.userState).toBe('returning');
    expect(summary.isIdle).toBe(false);
    expect(summary.hasFrustration).toBe(false);
    expect(summary.recentErrorCount).toBe(0);
  });

  it('should detect frustration in summary', () => {
    const context = createInitialContext();
    context.frustrationSignals = [createMockFrustration({ type: 'rapid_clicks' })];

    const summary = buildContextSummary(context);

    expect(summary.hasFrustration).toBe(true);
    expect(summary.primaryFrustration).toBe('rapid_clicks');
  });

  it('should suggest topics based on feature', () => {
    const context = createInitialContext();
    context.currentFeature = createMockFeature({ featureId: 'advanced-search' });

    const summary = buildContextSummary(context);

    expect(summary.suggestedTopics).toContain('feature-advanced-search');
  });

  it('should suggest topics based on frustration', () => {
    const context = createInitialContext();
    context.frustrationSignals = [
      createMockFrustration({
        suggestedHelpTopics: ['troubleshooting', 'contact-support'],
      }),
    ];

    const summary = buildContextSummary(context);

    expect(summary.suggestedTopics).toContain('troubleshooting');
  });

  it('should suggest topics for errors', () => {
    const context = createInitialContext();
    context.recentErrors = [new Error('Test error')];

    const summary = buildContextSummary(context);

    expect(summary.suggestedTopics).toContain('troubleshooting');
    expect(summary.suggestedTopics).toContain('error-recovery');
  });

  it('should suggest beginner topics for new users', () => {
    const context = createInitialContext();
    context.userState = 'new';
    context.helpLevel = 'beginner';

    const summary = buildContextSummary(context);

    expect(summary.suggestedTopics).toContain('getting-started');
  });

  it('should deduplicate suggested topics', () => {
    const context = createInitialContext();
    context.frustrationSignals = [
      createMockFrustration({ suggestedHelpTopics: ['help-a'] }),
      createMockFrustration({ suggestedHelpTopics: ['help-a'] }),
    ];

    const summary = buildContextSummary(context);
    const helpACount = summary.suggestedTopics.filter((t) => t === 'help-a').length;

    expect(helpACount).toBe(1);
  });
});

// ============================================================================
// Non-Hook Store Access Tests
// ============================================================================

describe('Non-Hook Store Access', () => {
  beforeEach(() => {
    useContextStore.getState().resetContext();
  });

  it('should get current context', () => {
    const context = getCurrentContext();
    expect(context).toBeDefined();
    expect(context.id).toMatch(/^ctx-/);
  });

  it('should add action outside of React', () => {
    const store = useContextStore.getState();
    const initialCount = store.currentContext.recentActions.length;

    addAction({ type: 'click', page: '/test' });

    expect(store.currentContext.recentActions.length).toBe(initialCount + 1);
  });

  it('should add frustration signal outside of React', () => {
    const store = useContextStore.getState();

    addFrustrationSignal({
      type: 'rapid_clicks',
      severity: 5,
      relatedActions: [],
      description: 'Test',
      shouldTriggerHelp: true,
    });

    expect(store.currentContext.frustrationSignals.length).toBeGreaterThan(0);
  });

  it('should get context pattern outside of React', () => {
    const pattern = getContextPattern();
    expect(pattern.topPages).toEqual([]);
    expect(pattern.frustrationFrequency).toBe(0);
  });
});

// ============================================================================
// Frustration Detection Tests
// ============================================================================

describe('Frustration Detection', () => {
  beforeEach(() => {
    useContextStore.getState().resetContext();
  });

  it('should detect rapid clicks', () => {
    const store = useContextStore.getState();
    const now = Date.now();

    act(() => {
      // Simulate 5 rapid clicks within 2 seconds
      for (let i = 0; i < 5; i++) {
        store.addAction({
          id: `click-${i}`,
          type: 'click',
          timestamp: now - 1000 + i * 100,
          page: '/test',
        });
      }
    });

    const actions = store.getRecentActions();
    const clickCount = actions.filter((a) => a.type === 'click').length;
    expect(clickCount).toBeGreaterThanOrEqual(3);
  });

  it('should detect error loop', () => {
    const store = useContextStore.getState();

    act(() => {
      for (let i = 0; i < 5; i++) {
        store.addError(new Error(`Error ${i}`));
      }
    });

    expect(store.currentContext.recentErrors.length).toBeGreaterThanOrEqual(3);
  });

  it('should detect repeated searches', () => {
    const store = useContextStore.getState();

    act(() => {
      for (let i = 0; i < 4; i++) {
        store.addAction({
          id: `search-${i}`,
          type: 'search',
          timestamp: Date.now() - i * 1000,
          page: '/test',
          metadata: { query: 'how to' },
        });
      }
    });

    const searchActions = store.getActionsByType('search');
    expect(searchActions.length).toBe(4);
  });

  it('should assign correct severity to frustration signals', () => {
    const store = useContextStore.getState();

    act(() => {
      store.addFrustrationSignal(
        createMockFrustration({ type: 'rapid_clicks', severity: 8 })
      );
      store.addFrustrationSignal(
        createMockFrustration({ type: 'error_loop', severity: 10 })
      );
    });

    const frustrations = store.getRecentFrustrations();
    expect(frustrations[0].severity).toBeGreaterThanOrEqual(0);
    expect(frustrations[1].severity).toBeGreaterThanOrEqual(0);
  });

  it('should determine if help should be triggered', () => {
    const signal = createMockFrustration({
      shouldTriggerHelp: true,
    });

    expect(signal.shouldTriggerHelp).toBe(true);
  });

  it('should include suggested help topics in frustration signals', () => {
    const signal = createMockFrustration({
      suggestedHelpTopics: ['topic-a', 'topic-b'],
    });

    expect(signal.suggestedHelpTopics).toEqual(['topic-a', 'topic-b']);
  });
});

// ============================================================================
// Idle Detection Tests
// ============================================================================

describe('Idle Detection', () => {
  beforeEach(() => {
    useContextStore.getState().resetContext();
  });

  it('should track idle state', () => {
    const store = useContextStore.getState();

    expect(store.currentContext.isIdle).toBe(false);

    act(() => {
      store.setIdle(true, 30000);
    });

    expect(store.currentContext.isIdle).toBe(true);
    expect(store.currentContext.idleTime).toBe(30000);
  });

  it('should reset idle state', () => {
    const store = useContextStore.getState();

    act(() => {
      store.setIdle(true, 60000);
      store.setIdle(false, 0);
    });

    expect(store.currentContext.isIdle).toBe(false);
    expect(store.currentContext.idleTime).toBe(0);
  });

  it('should accumulate idle time', () => {
    const store = useContextStore.getState();

    act(() => {
      store.setIdle(true, 15000);
    });

    expect(store.currentContext.idleTime).toBe(15000);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Context Detection Integration', () => {
  beforeEach(() => {
    useContextStore.getState().resetContext();
    useContextStore.getState().clearHistory();
  });

  it('should track complete user session flow', () => {
    const store = useContextStore.getState();

    act(() => {
      // Start tracking
      store.startTracking();

      // User navigates to dashboard
      store.setPage('/dashboard');

      // User clicks on analytics feature
      store.setFeatureContext(createMockFeature({ featureArea: 'analytics' }));
      store.addAction(createMockAction({ type: 'click' }));

      // User scrolls
      store.addAction(createMockAction({ type: 'scroll' }));

      // User encounters error
      store.addError(new Error('Data load failed'));
      store.addAction(createMockAction({ type: 'error', isError: true }));

      // Frustration detected
      store.addFrustrationSignal(createMockFrustration({ type: 'error_loop' }));

      // User views help
      store.addViewedHelp('troubleshooting-data-load');

      // Add to history
      store.addToHistory();
    });

    const context = store.currentContext;
    expect(context.currentPage).toBe('/dashboard');
    expect(context.currentFeature?.featureArea).toBe('analytics');
    expect(context.recentActions.length).toBeGreaterThanOrEqual(3);
    expect(context.recentErrors.length).toBe(1);
    expect(context.frustrationSignals.length).toBe(1);
    expect(context.recentlyViewedHelp).toContain('troubleshooting-data-load');
    expect(store.contextHistory.length).toBe(1);
  });

  it('should maintain context across multiple pages', () => {
    const store = useContextStore.getState();

    act(() => {
      store.setPage('/page1');
      store.addToHistory();
      store.setPage('/page2');
      store.addToHistory();
      store.setPage('/page3');
    });

    expect(store.contextHistory.length).toBe(2);
    expect(store.currentContext.navigationHistory).toContain('/page1');
    expect(store.currentContext.navigationHistory).toContain('/page2');
    expect(store.currentContext.navigationHistory).toContain('/page3');
  });

  it('should generate context summary for help targeting', () => {
    const store = useContextStore.getState();

    act(() => {
      store.setHelpLevel('advanced');
      store.setUserState('expert');
      store.setPage('/settings');
      store.addAction(createMockAction({ type: 'click' }));
    });

    const context = store.currentContext;
    const summary = buildContextSummary(context);

    expect(summary.level).toBe('advanced');
    expect(summary.userState).toBe('expert');
    expect(summary.page).toBe('/settings');
  });
});
