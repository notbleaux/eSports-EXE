/**
 * Sentry Configuration
 * 
 * Error tracking and monitoring setup for production.
 * 
 * [Ver001.000]
 */
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || 'development';

/**
 * Initialize Sentry for error tracking
 * Only initializes in production or if DSN is provided
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN provided, skipping initialization');
    return;
  }
  
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.sator\.esports/,
        ],
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Error sampling
    sampleRate: 1.0,
    
    // Enable debug in development
    debug: ENVIRONMENT === 'development',
    
    // Before sending callback
    beforeSend(event) {
      // Filter out specific errors
      if (shouldIgnoreError(event)) {
        return null;
      }
      
      // Add custom tags
      event.tags = {
        ...event.tags,
        hub: getCurrentHub(),
        version: import.meta.env.VITE_APP_VERSION,
      };
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // Chrome extensions
      /chrome-extension/,
      /extension/,
      /ResizeObserver loop limit exceeded/,
      // Network errors
      /Network Error/,
      /Failed to fetch/,
      // Common browser errors
      /Non-Error promise rejection/,
    ],
  });
  
  console.log('[Sentry] Initialized successfully');
}

/**
 * Check if error should be ignored
 */
function shouldIgnoreError(event: Sentry.Event): boolean {
  const errorMessage = event.exception?.values?.[0]?.value || '';
  
  // Ignore specific known errors
  const ignoredPatterns = [
    /ResizeObserver loop/,
    /network error/i,
    /websocket/i,
  ];
  
  return ignoredPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Get current hub from URL
 */
function getCurrentHub(): string {
  const path = window.location.pathname;
  if (path.startsWith('/sator')) return 'sator';
  if (path.startsWith('/rotas')) return 'rotas';
  if (path.startsWith('/arepo')) return 'arepo';
  if (path.startsWith('/opera')) return 'opera';
  if (path.startsWith('/tenet')) return 'tenet';
  return 'unknown';
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

export default initSentry;
