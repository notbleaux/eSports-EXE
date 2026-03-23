/** [Ver001.000] */
/**
 * useContextDetection Hook
 * ========================
 * React hook for detecting user context and behavior patterns.
 * 
 * Features:
 * - Track current page/route
 * - Track focused UI elements
 * - Track user actions (clicks, scrolls, errors)
 * - Detect frustration signals (rapid clicks, error loops)
 * - Detect idle time
 * - Return current context for help targeting
 * 
 * Integration:
 * - Works with TL-A1 1-A help panel
 * - Provides context to TL-A1 1-C knowledge graph
 * - Feeds TL-A1 1-D broadcast system
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  HelpContext,
  UserAction,
  UserActionType,
  FeatureContext,
  FrustrationSignal,
  FrustrationType,
  ContextDetectionOptions,
  UseContextDetectionReturn,
  ContextSummary,
  UIElementType,
} from '../lib/help/context-types';
import {
  DEFAULT_CONTEXT_OPTIONS,
  createInitialContext,
} from '../lib/help/context-types';
import { useContextStore, buildContextSummary } from '../lib/help/context-store';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get element type from DOM element
 */
function getElementType(element: Element): UIElementType {
  const tag = element.tagName.toLowerCase();
  
  if (tag === 'button' || element.getAttribute('role') === 'button') return 'button';
  if (tag === 'input') return 'input';
  if (tag === 'select') return 'select';
  if (element.getAttribute('role') === 'dialog' || element.classList.contains('modal')) {
    return 'modal';
  }
  if (element.classList.contains('dropdown') || element.getAttribute('role') === 'menu') {
    return 'dropdown';
  }
  if (tag === 'table') return 'table';
  if (element.classList.contains('chart') || tag === 'canvas') return 'chart';
  if (tag === 'nav' || element.getAttribute('role') === 'navigation') return 'navigation';
  if (element.getAttribute('role') === 'tab') return 'tab';
  if (element.classList.contains('card')) return 'card';
  if (tag === 'form') return 'form';
  if (tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'a') return 'link';
  if (element.getAttribute('role') === 'tooltip') return 'tooltip';
  
  return 'unknown';
}

/**
 * Build feature context from DOM element
 */
function buildFeatureContext(element: Element | null, page: string): FeatureContext | null {
  if (!element) return null;

  const elementId = element.id || 
    element.getAttribute('data-feature-id') || 
    element.getAttribute('data-testid') ||
    `el-${generateId()}`;
  
  const elementType = getElementType(element);
  const elementName = 
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    element.textContent?.slice(0, 50) ||
    elementId;
  
  const featureArea = 
    element.getAttribute('data-feature-area') ||
    element.closest('[data-feature-area]')?.getAttribute('data-feature-area') ||
    'general';
  
  const hub = element.closest('[data-hub]')?.getAttribute('data-hub') as FeatureContext['hub'];
  const featureId = element.getAttribute('data-feature-id') || undefined;
  
  // Build parent chain
  const parentChain: string[] = [];
  let parent = element.parentElement;
  while (parent && parentChain.length < 5) {
    const parentFeature = parent.getAttribute('data-feature-area');
    if (parentFeature && !parentChain.includes(parentFeature)) {
      parentChain.push(parentFeature);
    }
    parent = parent.parentElement;
  }

  // Extract data attributes
  const dataAttributes: Record<string, string> = {};
  Array.from(element.attributes).forEach((attr) => {
    if (attr.name.startsWith('data-') && attr.name !== 'data-feature-area') {
      dataAttributes[attr.name] = attr.value;
    }
  });

  return {
    elementId,
    elementType,
    elementName: elementName.slice(0, 100),
    featureArea,
    page,
    hub,
    featureId,
    parentChain,
    dataAttributes: Object.keys(dataAttributes).length > 0 ? dataAttributes : undefined,
  };
}

// ============================================================================
// Frustration Detection
// ============================================================================

/**
 * Detect rapid clicks
 */
function detectRapidClicks(
  actions: UserAction[],
  threshold: number,
  windowMs: number
): FrustrationSignal | null {
  const now = Date.now();
  const recentClicks = actions.filter(
    (a) => a.type === 'click' && now - a.timestamp < windowMs
  );

  if (recentClicks.length < threshold) return null;

  // Check if clicks are on same element
  const targetIds = recentClicks
    .map((a) => a.target?.elementId)
    .filter(Boolean);
  const uniqueTargets = new Set(targetIds);
  const isRepeated = uniqueTargets.size === 1 && targetIds.length > 2;

  return {
    type: 'rapid_clicks',
    severity: Math.min(recentClicks.length / threshold * 5, 10),
    timestamp: now,
    relatedActions: recentClicks.map((a) => a.id),
    description: isRepeated
      ? `Repeated clicks on same element (${targetIds[0]})`
      : `${recentClicks.length} rapid clicks detected`,
    shouldTriggerHelp: recentClicks.length >= threshold + 2,
    suggestedHelpTopics: isRepeated 
      ? ['element-not-responding', 'troubleshooting'] 
      : ['ui-responsiveness'],
  };
}

/**
 * Detect error loops
 */
function detectErrorLoop(
  errors: Error[],
  threshold: number,
  windowMs: number
): FrustrationSignal | null {
  const now = Date.now();
  const recentErrors = errors.filter((e) => {
    // @ts-expect-error - timestamp might be added to error
    const errorTime = e.timestamp || now;
    return now - errorTime < windowMs;
  });

  if (recentErrors.length < threshold) return null;

  return {
    type: 'error_loop',
    severity: Math.min(recentErrors.length / threshold * 7, 10),
    timestamp: now,
    relatedActions: [],
    description: `${recentErrors.length} errors in short time window`,
    shouldTriggerHelp: true,
    suggestedHelpTopics: ['error-recovery', 'troubleshooting', 'contact-support'],
  };
}

/**
 * Detect repeated searches
 */
function detectRepeatedSearch(
  actions: UserAction[],
  threshold: number
): FrustrationSignal | null {
  const searchActions = actions.filter((a) => a.type === 'search');
  
  if (searchActions.length < threshold) return null;

  // Check for similar queries
  const queries = searchActions.map((a) => (a.metadata?.query as string)?.toLowerCase()).filter(Boolean);
  const uniqueQueries = new Set(queries);
  
  return {
    type: 'repeated_search',
    severity: Math.min(searchActions.length / threshold * 4, 10),
    timestamp: Date.now(),
    relatedActions: searchActions.map((a) => a.id),
    description: `${searchActions.length} searches, possibly struggling to find results`,
    shouldTriggerHelp: uniqueQueries.size < searchActions.length / 2,
    suggestedHelpTopics: ['search-tips', 'advanced-search', 'contact-support'],
  };
}

/**
 * Detect stuck on page
 */
function detectStuckOnPage(
  timeOnPage: number,
  actions: UserAction[],
  thresholdMs: number
): FrustrationSignal | null {
  if (timeOnPage < thresholdMs) return null;

  // Check if user has been inactive
  const recentActions = actions.filter(
    (a) => Date.now() - a.timestamp < 30000
  );
  
  if (recentActions.length > 5) return null; // User is active

  return {
    type: 'stuck_on_page',
    severity: Math.min((timeOnPage / thresholdMs) * 3, 10),
    timestamp: Date.now(),
    relatedActions: [],
    description: `User on same page for ${Math.round(timeOnPage / 1000)}s with low activity`,
    shouldTriggerHelp: timeOnPage > thresholdMs * 2,
    suggestedHelpTopics: ['page-guide', 'getting-started'],
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useContextDetection(
  options: ContextDetectionOptions = {}
): UseContextDetectionReturn {
  // Merge options with defaults
  const config = useMemo(
    () => ({ ...DEFAULT_CONTEXT_OPTIONS, ...options }),
    [options]
  );

  // Get location for route tracking
  const location = useLocation();

  // Get store state and actions
  const {
    currentContext,
    isTracking,
    startTracking: storeStartTracking,
    stopTracking: storeStopTracking,
    updateContext: storeUpdateContext,
    addAction,
    addFrustrationSignal,
    addError,
    setFeatureContext,
    setPage,
    setIdle,
    clearHistory,
    addToHistory,
  } = useContextStore();

  // Refs for tracking
  const trackingRef = useRef(isTracking);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pageStartTimeRef = useRef(Date.now());
  const sessionStartTimeRef = useRef(Date.now());
  const lastActionTimeRef = useRef(Date.now());
  const focusedElementRef = useRef<Element | null>(null);
  const frustrationCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Update tracking ref
  useEffect(() => {
    trackingRef.current = isTracking;
  }, [isTracking]);

  // Update time tracking
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeOnPage = now - pageStartTimeRef.current;
      const sessionTime = now - sessionStartTimeRef.current;

      storeUpdateContext({
        timeOnPage,
        sessionTime,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, storeUpdateContext]);

  // Record action helper
  const recordAction = useCallback(
    (action: Omit<UserAction, 'id' | 'timestamp'>) => {
      if (!trackingRef.current) return;

      const fullAction: UserAction = {
        ...action,
        id: generateId(),
        timestamp: Date.now(),
      };

      addAction(fullAction);
      lastActionTimeRef.current = Date.now();

      // Reset idle state if was idle
      if (currentContext.isIdle) {
        setIdle(false, 0);
        config.onActive?.();
      }

      // Reset idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        if (trackingRef.current) {
          const idleTime = Date.now() - lastActionTimeRef.current;
          setIdle(true, idleTime);
          config.onIdle?.();
        }
      }, config.idleTimeoutMs);
    },
    [addAction, currentContext.isIdle, setIdle, config]
  );

  // Track page changes
  useEffect(() => {
    if (!isTracking) return;

    // Add current context to history before changing
    if (currentContext.timeOnPage > 5000) {
      addToHistory();
    }

    // Update page in context
    setPage(location.pathname);
    pageStartTimeRef.current = Date.now();

    // Record navigation action via recordAction helper
    recordAction({
      type: 'navigation',
      page: location.pathname,
      metadata: { from: currentContext.currentPage },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isTracking]);

  // Track clicks
  useEffect(() => {
    if (!isTracking) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const featureContext = buildFeatureContext(target, location.pathname);

      recordAction({
        type: 'click',
        target: featureContext || undefined,
        page: location.pathname,
        metadata: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isTracking, location.pathname, recordAction]);

  // Track scroll
  useEffect(() => {
    if (!isTracking || !config.trackScroll) return;

    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTop = 0;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const direction = scrollTop > lastScrollTop ? 'down' : 'up';
        
        recordAction({
          type: 'scroll',
          page: location.pathname,
          metadata: {
            scrollTop,
            direction,
            maxScroll: document.documentElement.scrollHeight - window.innerHeight,
          },
        });
        
        lastScrollTop = scrollTop;
      }, 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isTracking, config.trackScroll, location.pathname, recordAction]);

  // Track focus
  useEffect(() => {
    if (!isTracking) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as Element;
      focusedElementRef.current = target;
      
      const featureContext = buildFeatureContext(target, location.pathname);
      setFeatureContext(featureContext);

      recordAction({
        type: 'focus',
        target: featureContext || undefined,
        page: location.pathname,
      });
    };

    const handleBlur = () => {
      recordAction({
        type: 'blur',
        page: location.pathname,
      });
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
    };
  }, [isTracking, location.pathname, recordAction, setFeatureContext]);

  // Track errors
  useEffect(() => {
    if (!isTracking) return;

    const handleError = (e: ErrorEvent) => {
      addError(e.error || new Error(e.message));
      
      recordAction({
        type: 'error',
        page: location.pathname,
        isError: true,
        metadata: {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
        },
      });
    };

    const handleRejection = (e: PromiseRejectionEvent) => {
      const error = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
      addError(error);
      
      recordAction({
        type: 'error',
        page: location.pathname,
        isError: true,
        metadata: {
          type: 'unhandledrejection',
          reason: String(e.reason),
        },
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isTracking, location.pathname, recordAction, addError]);

  // Frustration detection
  useEffect(() => {
    if (!isTracking || !config.enableFrustrationDetection) return;

    const checkFrustration = () => {
      const now = Date.now();
      const actions = useContextStore.getState().getRecentActions(50);
      const errors = useContextStore.getState().getRecentErrors();

      // Check various frustration signals
      const signals: FrustrationSignal[] = [];

      const rapidClicks = detectRapidClicks(
        actions,
        config.rapidClickThreshold,
        config.frustrationWindowMs
      );
      if (rapidClicks) signals.push(rapidClicks);

      const errorLoop = detectErrorLoop(
        errors,
        config.errorLoopThreshold,
        config.frustrationWindowMs
      );
      if (errorLoop) signals.push(errorLoop);

      const repeatedSearch = detectRepeatedSearch(actions, 3);
      if (repeatedSearch) signals.push(repeatedSearch);

      const stuckOnPage = detectStuckOnPage(
        currentContext.timeOnPage,
        actions,
        120000 // 2 minutes
      );
      if (stuckOnPage) signals.push(stuckOnPage);

      // Add detected signals
      signals.forEach((signal) => {
        addFrustrationSignal(signal);
        if (signal.shouldTriggerHelp) {
          config.onFrustrationDetected?.(signal);
        }
      });
    };

    frustrationCheckRef.current = setInterval(checkFrustration, 2000);

    return () => {
      if (frustrationCheckRef.current) {
        clearInterval(frustrationCheckRef.current);
      }
    };
  }, [
    isTracking,
    config.enableFrustrationDetection,
    config.rapidClickThreshold,
    config.errorLoopThreshold,
    config.frustrationWindowMs,
    config.onFrustrationDetected,
    currentContext.timeOnPage,
    addFrustrationSignal,
  ]);

  // Start tracking
  const startTracking = useCallback(() => {
    storeStartTracking();
    sessionStartTimeRef.current = Date.now();
    pageStartTimeRef.current = Date.now();
  }, [storeStartTracking]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (frustrationCheckRef.current) {
      clearInterval(frustrationCheckRef.current);
    }
    storeStopTracking();
  }, [storeStopTracking]);

  // Update context manually
  const updateContext = useCallback(
    (updates: Partial<HelpContext>) => {
      storeUpdateContext(updates);
    },
    [storeUpdateContext]
  );

  // Get context summary
  const getContextSummary = useCallback((): ContextSummary => {
    return buildContextSummary(currentContext, {
      includeFrustrations: true,
      includeSuggestions: true,
    });
  }, [currentContext]);

  // Get recent frustrations
  const recentFrustrations = useMemo(() => {
    return currentContext.frustrationSignals.slice(0, 5);
  }, [currentContext.frustrationSignals]);

  // Time since last action
  const timeSinceLastAction = useMemo(() => {
    return Date.now() - lastActionTimeRef.current;
  }, [currentContext.recentActions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (frustrationCheckRef.current) {
        clearInterval(frustrationCheckRef.current);
      }
    };
  }, []);

  return {
    context: currentContext,
    isTracking,
    startTracking,
    stopTracking,
    updateContext,
    recordAction,
    clearHistory,
    getContextSummary,
    recentFrustrations,
    timeSinceLastAction,
  };
}

export default useContextDetection;
