import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught error:', error, errorInfo);

    this.setState({ errorInfo });

    // Log to analytics
    if (typeof window !== 'undefined' && window.satorAnalytics) {
      window.satorAnalytics.trackEvent('error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: 'react_error_boundary',
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI - NJZ Design System
      return (
        <div className="error-boundary-fallback" style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--radiant-black, #0a0a0f)',
          color: 'var(--radiant-white, #ffffff)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', 'Space Grotesk', system-ui, sans-serif"
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            color: 'var(--radiant-red, #ff4655)',
            textShadow: '0 0 40px var(--radiant-red-glow, rgba(255, 70, 85, 0.4))'
          }}>⚠️</div>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--radiant-white, #ffffff)'
          }}>Something went wrong</h2>
          <p style={{
            opacity: 0.8,
            marginBottom: '2rem',
            color: 'var(--radiant-gray, #8a8a9a)',
            maxWidth: '400px'
          }}>
            {this.state.error?.message || 'An unexpected error occurred. Our team has been notified.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.875rem 2rem',
                background: 'var(--radiant-red, #ff4655)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(255, 70, 85, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 24px rgba(255, 70, 85, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(255, 70, 85, 0.3)';
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.875rem 2rem',
                background: 'transparent',
                color: 'var(--radiant-white, #ffffff)',
                border: '2px solid var(--radiant-border, #2a2a3a)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--radiant-red, #ff4655)';
                e.target.style.color = 'var(--radiant-red, #ff4655)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--radiant-border, #2a2a3a)';
                e.target.style.color = 'var(--radiant-white, #ffffff)';
              }}
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.875rem 2rem',
                background: 'var(--radiant-card, #14141f)',
                color: 'var(--radiant-cyan, #00d4ff)',
                border: '2px solid var(--radiant-border, #2a2a3a)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--radiant-cyan, #00d4ff)';
                e.target.style.background = 'rgba(0, 212, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--radiant-border, #2a2a3a)';
                e.target.style.background = 'var(--radiant-card, #14141f)';
              }}
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '800px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>Error Details</summary>
              <pre style={{
                background: '#0a0a0a',
                padding: '1rem',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.75rem'
              }}>
                {this.state.error?.stack}
                {'\n\nComponent Stack:\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
