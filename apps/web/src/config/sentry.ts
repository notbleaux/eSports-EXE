/**
 * Sentry Configuration - STUBBED
 * 
 * Error tracking and monitoring setup for production.
 * NOTE: Sentry is currently disabled. Install @sentry/react to enable.
 * 
 * [Ver002.000]
 */

// Stub types for when Sentry is not installed
type Event = unknown;
type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// Stub Sentry module
declare module '@sentry/react' {
  export function init(options: unknown): void;
  export function setUser(user: unknown): void;
  export function addBreadcrumb(breadcrumb: unknown): void;
  export function captureException(error: Error, hint?: unknown): void;
  export function captureMessage(message: string, level?: SeverityLevel): void;
  export type Event = unknown;
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}

declare module '@sentry/tracing' {
  export class BrowserTracing {
    constructor(options?: unknown);
  }
}

// Stub implementations
const stubSentry = {
  init: () => console.log('[Sentry] Stub - init called'),
  setUser: () => {},
  addBreadcrumb: () => {},
  captureException: (error: Error) => console.error('[Sentry] Stub captureException:', error),
  captureMessage: (message: string) => console.log('[Sentry] Stub captureMessage:', message),
};

const stubBrowserTracing = class BrowserTracing {
  constructor(_options?: unknown) {}
};

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
  
  console.log('[Sentry] Would initialize with DSN:', SENTRY_DSN);
  stubSentry.init();
}

/**
 * Check if error should be ignored
 */
function shouldIgnoreError(_event: Event): boolean {
  return false;
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
  console.log('[Sentry] Set user:', { userId, email, username });
  stubSentry.setUser({ id: userId, email, username });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  stubSentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  _level: SeverityLevel = 'info'
): void {
  stubSentry.addBreadcrumb({
    message,
    category,
    timestamp: Date.now(),
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  stubSentry.captureException(error);
  if (context) {
    console.error('[Sentry] Context:', context);
  }
}

/**
 * Capture message
 */
export function captureMessage(message: string, _level: SeverityLevel = 'info'): void {
  stubSentry.captureMessage(message);
}

export { stubBrowserTracing as BrowserTracing };
export default initSentry;
