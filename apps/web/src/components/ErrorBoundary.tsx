/**
 * Error Boundary Component
 *
 * Catches React errors in child components and displays fallback UI.
 * Prevents white screens and enables graceful degradation.
 *
 * [Ver001.000]
 */

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] p-4">
            <div className="max-w-md w-full space-y-4">
              <div className="flex items-start gap-3 p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h2 className="font-bold text-red-400">Something went wrong</h2>
                  <p className="text-sm text-red-400/70">
                    {this.state.error.message || 'An unexpected error occurred'}
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2 text-xs text-red-400/60">
                      <summary className="cursor-pointer hover:text-red-400">View details</summary>
                      <pre className="mt-2 p-2 bg-red-500/[0.05] rounded overflow-auto max-h-32 text-red-400/50">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-red-500/20 border border-red-500/50 rounded text-sm font-bold text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-sm font-bold text-white/70 hover:bg-white/10 transition-colors"
              >
                Go to home
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
