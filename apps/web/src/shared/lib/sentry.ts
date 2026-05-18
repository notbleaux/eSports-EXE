/**
 * Error reporting — pure no-op (Sentry removed per user direction 2026-05-15).
 *
 * The functions below remain exported so existing callers
 * (HubErrorBoundary, etc.) keep compiling without per-file refactor.
 * They forward to console.error in development and are silent in
 * production. Future replacement (e.g. Supabase logs, Cloudflare
 * Workers Analytics) can swap in here without touching callers.
 *
 * [Ver002.000]
 */

export async function initSentry(): Promise<void> {
  // No-op. Kept for call-site compatibility.
}

export function captureException(err: unknown, extra?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error('[errorReporting] captureException:', err, extra ?? '');
  }
}

export function captureMessage(message: string, level = 'info'): void {
  if (import.meta.env.DEV) {
    console.log(`[errorReporting:${level}] ${message}`);
  }
}

export function setUser(_user: { id: string; username?: string; email?: string } | null): void {
  // No-op.
}
