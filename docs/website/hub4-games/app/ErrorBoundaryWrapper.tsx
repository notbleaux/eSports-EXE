'use client';

import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Wrapper for Games Hub
 * Catches JavaScript errors in child components and displays fallback UI
 */
class ErrorBoundaryWrapper extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).satorAnalytics) {
      (window as any).satorAnalytics.trackEvent('error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: 'react_error_boundary',
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-boundary-fallback"
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: '#0a0a0f',
            color: '#ffffff',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', 'Space Grotesk', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              color: '#ff4655',
              textShadow: '0 0 40px rgba(255, 70, 85, 0.4)',
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              marginBottom: '1rem',
              fontSize: '2rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              opacity: 0.8,
              marginBottom: '2rem',
              color: '#8a8a9a',
              maxWidth: '400px',
            }}
          >
            {this.state.error?.message ||
              'An unexpected error occurred in the Games Hub.'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.875rem 2rem',
                background: '#ff4655',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(255, 70, 85, 0.3)',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform =
                  'translateY(-2px)';
                (e.target as HTMLButtonElement).style.boxShadow =
                  '0 6px 24px rgba(255, 70, 85, 0.4)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.target as HTMLButtonElement).style.boxShadow =
                  '0 4px 20px rgba(255, 70, 85, 0.3)';
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '0.875rem 2rem',
                background: 'transparent',
                color: '#ffffff',
                border: '2px solid #2a2a3a',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLAnchorElement).style.borderColor = '#ff4655';
                (e.target as HTMLAnchorElement).style.color = '#ff4655';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLAnchorElement).style.borderColor = '#2a2a3a';
                (e.target as HTMLAnchorElement).style.color = '#ffffff';
              }}
            >
              Go Home
            </a>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.875rem 2rem',
                background: '#14141f',
                color: '#00d4ff',
                border: '2px solid #2a2a3a',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = '#00d4ff';
                (e.target as HTMLButtonElement).style.background =
                  'rgba(0, 212, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = '#2a2a3a';
                (e.target as HTMLButtonElement).style.background = '#14141f';
              }}
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: '2rem',
                textAlign: 'left',
                maxWidth: '800px',
                color: '#8a8a9a',
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                Error Details
              </summary>
              <pre
                style={{
                  background: '#14141f',
                  padding: '1rem',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  color: '#00d4ff',
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWrapper;
