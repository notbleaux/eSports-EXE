/** [Ver001.000] */
/**
 * ContextDetector Component
 * =========================
 * Invisible wrapper component that monitors user behavior and updates
 * context store for proactive help targeting.
 * 
 * Features:
 * - Invisible wrapper component
 * - Monitors user behavior
 * - Updates context store
 * - Triggers help offers when appropriate
 * 
 * Integration:
 * - Works with TL-A1 1-A help panel
 * - Provides context to TL-A1 1-C knowledge graph
 * - Feeds TL-A1 1-D broadcast system
 */

import React, {
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  useState,
} from 'react';
import type {
  HelpContext,
  FrustrationSignal,
  ContextDetectionOptions,
  ContextSummary,
} from '../../lib/help/context-types';
import { useContextDetection } from '../../hooks/useContextDetection';
import { useContextStore } from '../../lib/help/context-store';

// ============================================================================
// Context for child components
// ============================================================================

export interface ContextDetectorContextValue {
  /** Current help context */
  context: HelpContext;
  /** Whether tracking is active */
  isTracking: boolean;
  /** Recent frustration signals */
  recentFrustrations: FrustrationSignal[];
  /** Get context summary */
  getContextSummary: () => ContextSummary;
  /** Manually record an action */
  recordAction: (type: string, metadata?: Record<string, unknown>) => void;
  /** Update context manually */
  updateContext: (updates: Partial<HelpContext>) => void;
}

const ContextDetectorContext = createContext<ContextDetectorContextValue | null>(null);

/**
 * Hook to access context detector from child components
 */
export function useHelpContext(): ContextDetectorContextValue {
  const ctx = useContext(ContextDetectorContext);
  if (!ctx) {
    throw new Error('useHelpContext must be used within ContextDetector');
  }
  return ctx;
}

// ============================================================================
// Props
// ============================================================================

export interface ContextDetectorProps {
  /** Child components */
  children: React.ReactNode;
  /** Whether to auto-start tracking */
  autoStart?: boolean;
  /** Context detection options */
  options?: ContextDetectionOptions;
  /** Callback when frustration is detected */
  onFrustration?: (signal: FrustrationSignal) => void;
  /** Callback when user becomes idle */
  onIdle?: () => void;
  /** Callback when user becomes active */
  onActive?: () => void;
  /** Callback when help should be offered */
  onHelpOffer?: (context: ContextSummary) => void;
  /** Minimum time before help can be offered again (ms) */
  helpCooldownMs?: number;
  /** Whether to track help panel interactions */
  trackHelpInteractions?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const ContextDetector: React.FC<ContextDetectorProps> = ({
  children,
  autoStart = true,
  options = {},
  onFrustration,
  onIdle,
  onActive,
  onHelpOffer,
  helpCooldownMs = 60000, // 1 minute cooldown
  trackHelpInteractions = true,
  className,
}) => {
  const [lastHelpOfferTime, setLastHelpOfferTime] = useState(0);
  const helpOfferInProgressRef = useRef(false);

  // Merge callbacks into options
  const mergedOptions: ContextDetectionOptions = {
    ...options,
    onFrustrationDetected: useCallback(
      (signal: FrustrationSignal) => {
        onFrustration?.(signal);
        
        // Check if we should offer help
        if (signal.shouldTriggerHelp && !helpOfferInProgressRef.current) {
          const now = Date.now();
          if (now - lastHelpOfferTime > helpCooldownMs) {
            helpOfferInProgressRef.current = true;
            
            // Get current summary and offer help
            const summary = contextValue.getContextSummary();
            onHelpOffer?.(summary);
            
            setLastHelpOfferTime(now);
            
            // Reset after cooldown
            setTimeout(() => {
              helpOfferInProgressRef.current = false;
            }, helpCooldownMs);
          }
        }
      },
      [onFrustration, onHelpOffer, lastHelpOfferTime, helpCooldownMs]
    ),
    onIdle: useCallback(() => {
      onIdle?.();
    }, [onIdle]),
    onActive: useCallback(() => {
      onActive?.();
    }, [onActive]),
  };

  // Use the context detection hook
  const {
    context,
    isTracking,
    startTracking,
    stopTracking,
    updateContext,
    recordAction,
    getContextSummary,
    recentFrustrations,
  } = useContextDetection(mergedOptions);

  // Auto-start tracking
  useEffect(() => {
    if (autoStart && !isTracking) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [autoStart, isTracking, startTracking, stopTracking]);

  // Track help panel interactions
  useEffect(() => {
    if (!trackHelpInteractions || !isTracking) return;

    const handleHelpPanelOpen = () => {
      recordAction({
        type: 'click',
        page: context.currentPage,
        metadata: { action: 'help_panel_opened' },
      });
    };

    const handleHelpTopicView = (e: CustomEvent<{ topicId: string }>) => {
      recordAction({
        type: 'click',
        page: context.currentPage,
        metadata: { action: 'help_topic_viewed', topicId: e.detail.topicId },
      });
    };

    const handleHelpSearch = (e: CustomEvent<{ query: string }>) => {
      recordAction({
        type: 'search',
        page: context.currentPage,
        metadata: { query: e.detail.query },
      });
    };

    // Listen for custom events from help panel
    window.addEventListener('sator:help:panel:open', handleHelpPanelOpen);
    window.addEventListener(
      'sator:help:topic:view',
      handleHelpTopicView as EventListener
    );
    window.addEventListener(
      'sator:help:search',
      handleHelpSearch as EventListener
    );

    return () => {
      window.removeEventListener('sator:help:panel:open', handleHelpPanelOpen);
      window.removeEventListener(
        'sator:help:topic:view',
        handleHelpTopicView as EventListener
      );
      window.removeEventListener(
        'sator:help:search',
        handleHelpSearch as EventListener
      );
    };
  }, [trackHelpInteractions, isTracking, recordAction, context.currentPage]);

  // Create context value
  const contextValue: ContextDetectorContextValue = {
    context,
    isTracking,
    recentFrustrations,
    getContextSummary,
    recordAction: useCallback(
      (type, metadata) => {
        recordAction({
          type: type as Parameters<typeof recordAction>[0]['type'],
          page: context.currentPage,
          metadata,
        });
      },
      [recordAction, context.currentPage]
    ),
    updateContext,
  };

  return (
    <ContextDetectorContext.Provider value={contextValue}>
      <div
        className={className}
        data-context-tracking={isTracking}
        data-context-id={context.id}
        // Hidden from view but keeps structure
        style={{
          display: 'contents',
        }}
      >
        {children}
      </div>
    </ContextDetectorContext.Provider>
  );
};

// ============================================================================
// Feature Tracker Component
// ============================================================================

export interface FeatureTrackerProps {
  /** Feature area identifier */
  featureArea: string;
  /** Optional feature ID */
  featureId?: string;
  /** Hub identifier */
  hub?: 'hub-1' | 'hub-2' | 'hub-3' | 'hub-4' | 'hub-5';
  /** Child components */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Component to track specific feature usage
 */
export const FeatureTracker: React.FC<FeatureTrackerProps> = ({
  featureArea,
  featureId,
  hub,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const setFeatureContext = useContextStore((state) => state.setFeatureContext);

  useEffect(() => {
    if (!ref.current) return;

    // Set up intersection observer to detect when feature is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFeatureContext({
              elementId: featureId || featureArea,
              elementType: 'unknown',
              elementName: featureArea,
              featureArea,
              page: window.location.pathname,
              hub,
              featureId,
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [featureArea, featureId, hub, setFeatureContext]);

  return (
    <div
      ref={ref}
      className={className}
      data-feature-area={featureArea}
      data-feature-id={featureId}
      data-hub={hub}
    >
      {children}
    </div>
  );
};

// ============================================================================
// Action Tracker Component
// ============================================================================

export interface ActionTrackerProps {
  /** Action type */
  actionType: string;
  /** Action metadata */
  metadata?: Record<string, unknown>;
  /** Child components (single clickable element) */
  children: React.ReactElement;
}

/**
 * Component to track specific user actions
 */
export const ActionTracker: React.FC<ActionTrackerProps> = ({
  actionType,
  metadata,
  children,
}) => {
  const { recordAction, context } = useHelpContext();

  const handleAction = useCallback(
    (e: React.SyntheticEvent) => {
      // Call original handler if exists
      const originalHandler = (children.props as Record<string, unknown>)?.onClick as
        | ((e: React.SyntheticEvent) => void)
        | undefined;
      originalHandler?.(e);

      // Record action
      recordAction(actionType, {
        ...metadata,
        timestamp: Date.now(),
      });
    },
    [actionType, metadata, recordAction, children]
  );

  return React.cloneElement(children, {
    onClick: handleAction,
    'data-action-tracked': actionType,
  } as Record<string, unknown>);
};

// ============================================================================
// Frustration Alert Component
// ============================================================================

export interface FrustrationAlertProps {
  /** Minimum severity to show alert */
  minSeverity?: number;
  /** Custom alert component */
  renderAlert?: (signal: FrustrationSignal) => React.ReactNode;
  /** Callback when alert is dismissed */
  onDismiss?: (signal: FrustrationSignal) => void;
}

/**
 * Component to display frustration alerts
 */
export const FrustrationAlert: React.FC<FrustrationAlertProps> = ({
  minSeverity = 5,
  renderAlert,
  onDismiss,
}) => {
  const { recentFrustrations } = useHelpContext();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeFrustrations = recentFrustrations.filter(
    (f) => f.severity >= minSeverity && !dismissed.has(`${f.type}-${f.timestamp}`)
  );

  const handleDismiss = useCallback(
    (signal: FrustrationSignal) => {
      setDismissed((prev) => new Set(prev).add(`${signal.type}-${signal.timestamp}`));
      onDismiss?.(signal);
    },
    [onDismiss]
  );

  if (activeFrustrations.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 space-y-2"
      role="alert"
      aria-live="polite"
    >
      {activeFrustrations.map((signal) =>
        renderAlert ? (
          <div key={`${signal.type}-${signal.timestamp}`}>
            {renderAlert(signal)}
          </div>
        ) : (
          <div
            key={`${signal.type}-${signal.timestamp}`}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 shadow-lg max-w-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">
                {signal.severity >= 8 ? '🔴' : signal.severity >= 5 ? '🟡' : '🔵'}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  Having trouble?
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {signal.description}
                </p>
                {signal.suggestedHelpTopics && signal.suggestedHelpTopics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {signal.suggestedHelpTopics.map((topic) => (
                      <button
                        key={topic}
                        className="text-xs bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors"
                        onClick={() => {
                          // Dispatch event for help panel
                          window.dispatchEvent(
                            new CustomEvent('sator:help:request', {
                              detail: { topic },
                            })
                          );
                        }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDismiss(signal)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default ContextDetector;
