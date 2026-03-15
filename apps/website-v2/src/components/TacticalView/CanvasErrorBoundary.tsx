/** [Ver001.000] */
/**
 * CanvasErrorBoundary Component
 * =============================
 * Error boundary for isolating Canvas rendering errors.
 * Prevents entire React tree from crashing on WebGL/Canvas failures.
 */

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="tactical-view__error">
          <div className="tactical-view__error-icon">⚠️</div>
          <div className="tactical-view__error-title">Canvas Error</div>
          <div className="tactical-view__error-message">
            {this.state.error?.message || 'Failed to render tactical view'}
          </div>
          <button 
            className="tactical-view__error-retry"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default CanvasErrorBoundary;
