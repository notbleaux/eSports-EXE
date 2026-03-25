/**
 * Sentry integration — NJZiteGeisTe Platform
 *
 * Graceful no-op when VITE_SENTRY_DSN is not set.
 * To activate: set VITE_SENTRY_DSN in .env.local
 *
 * To install Sentry: pnpm add @sentry/react (apps/web)
 * [Ver001.000]
 */

// ============================================================================
// TYPE STUB (avoids hard dependency at build time)
// ============================================================================

interface SentryLike {
  init: (opts: Record<string, unknown>) => void;
  captureException: (err: unknown, extra?: Record<string, unknown>) => string | undefined;
  captureMessage: (msg: string, level?: string) => string | undefined;
  setUser: (user: { id: string; username?: string; email?: string } | null) => void;
  withScope: (cb: (scope: ScopeLike) => void) => void;
}

interface ScopeLike {
  setExtra: (key: string, val: unknown) => void;
  setTag: (key: string, val: string) => void;
}

// No-op implementation used when Sentry is not configured
const noop: SentryLike = {
  init: () => {},
  captureException: () => undefined,
  captureMessage: () => undefined,
  setUser: () => {},
  withScope: (cb) => cb({ setExtra: () => {}, setTag: () => {} }),
};

// ============================================================================
// SENTRY INSTANCE (lazy loaded)
// ============================================================================

let _sentry: SentryLike = noop;
let _initialized = false;

/**
 * Initialize Sentry. Call once in main.tsx before rendering the app.
 * Does nothing if VITE_SENTRY_DSN is not set.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || _initialized) return;

  try {
    // Dynamic import — Sentry is optional; build still succeeds without it.
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: (import.meta.env.VITE_APP_ENVIRONMENT as string) ?? 'development',
      release: (import.meta.env.VITE_APP_VERSION as string) ?? '2.1.0',
      tracesSampleRate: 0.1,
      // Ignore noisy browser extension errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error exception captured',
      ],
    });
    _sentry = Sentry as unknown as SentryLike;
    _initialized = true;
    console.info('[Sentry] Initialized — DSN configured');
  } catch {
    // @sentry/react not installed — silent fail, use no-ops
    console.info('[Sentry] Package not installed — error reporting disabled');
  }
}

/** Report an exception to Sentry (no-op if not configured). */
export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  _sentry.captureException(err, extra);
}

/** Report a message to Sentry. */
export function captureMessage(message: string, level = 'info'): void {
  _sentry.captureMessage(message, level);
}

/** Set the authenticated user context. Call after login / on mount. */
export function setUser(user: { id: string; username?: string; email?: string } | null): void {
  _sentry.setUser(user);
}

export { _sentry as sentry };
