/**
 * SentryErrorBoundary Component
 * 
 * Error boundary that reports to Sentry with fallback UI.
 * 
 * [Ver001.000]
 */
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home, Activity } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * SentryErrorBoundary - Reports errors to Sentry with user-friendly fallback
 */
export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report to Sentry
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ errorInfo, eventId });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[SentryErrorBoundary] Caught error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReportFeedback = (): void => {
    const { eventId } = this.state;
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, eventId } = this.state;
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div
          className="min-h-screen flex items-center justify-center p-4 bg-[#050508]"
          role="alert"
          aria-live="assertive"
        >
          {/* Background Effects */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
              style={{
                background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          {/* Error Card */}
          <div className="relative z-10 w-full max-w-2xl">
            {/* Brand Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                <Activity className="w-4 h-4 text-red-400" />
                <span className="text-sm font-mono text-red-400">4NJZ4 TENET Platform</span>
              </div>
            </div>

            {/* Main Error Content */}
            <div
              className="rounded-2xl border p-8 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.2)',
              }}
            >
              {/* Icon */}
              <div className="text-center mb-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Something Went Wrong</h1>
                <p className="text-white/60">
                  We've been notified and are working on a fix
                </p>
              </div>

              {/* Error Message */}
              <div className="bg-black/40 rounded-xl p-4 mb-6 border border-red-500/20">
                <p className="text-red-300 text-center font-medium">
                  {error?.message || 'An unexpected error occurred'}
                </p>
                {eventId && (
                  <p className="text-white/40 text-xs text-center mt-2">
                    Error ID: {eventId}
                  </p>
                )}
              </div>

              {/* Recovery Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 bg-white/10 text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 border border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>

                {eventId && (
                  <button
                    onClick={this.handleReportFeedback}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    Report Feedback
                  </button>
                )}
              </div>

              {/* Technical Details (Development) */}
              {isDev && this.state.errorInfo && (
                <details className="mt-6">
                  <summary className="text-xs text-red-400/60 cursor-pointer select-none text-center hover:text-red-400">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="p-3 rounded-lg bg-black/50 overflow-auto">
                      <p className="text-xs text-red-300 mb-2 font-semibold">Error Stack:</p>
                      <pre className="text-xs text-white/40 whitespace-pre-wrap">
                        {error?.stack}
                      </pre>
                    </div>
                    <div className="p-3 rounded-lg bg-black/50 overflow-auto">
                      <p className="text-xs text-red-300 mb-2 font-semibold">Component Stack:</p>
                      <pre className="text-xs text-white/40 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-white/30 text-sm mt-6">
              Libre-X-eSport 4NJZ4 TENET Platform
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with SentryErrorBoundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithSentryErrorBoundary(props: P) {
    return (
      <SentryErrorBoundary fallback={fallback}>
        <Component {...props} />
      </SentryErrorBoundary>
    );
  };
}

export default SentryErrorBoundary;
