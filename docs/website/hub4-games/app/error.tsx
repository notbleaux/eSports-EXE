'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Next.js Error Boundary
 * Catches errors in the route segment and displays fallback UI
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console and analytics
    console.error('Error caught by error.js:', error);
    
    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).satorAnalytics) {
      (window as any).satorAnalytics.trackEvent('error', {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        type: 'nextjs_error_boundary',
      });
    }
  }, [error]);

  return (
    <div
      className="error-boundary-fallback"
      style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--radiant-black, #0a0a0f)',
        color: 'var(--radiant-white, #ffffff)',
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
          color: 'var(--radiant-red, #ff4655)',
          textShadow: '0 0 40px var(--radiant-red-glow, rgba(255, 70, 85, 0.4))',
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
          color: 'var(--radiant-white, #ffffff)',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          opacity: 0.8,
          marginBottom: '2rem',
          color: 'var(--radiant-gray, #8a8a9a)',
          maxWidth: '400px',
        }}
      >
        {error?.message || 'An unexpected error occurred in the Games Hub.'}
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
          onClick={reset}
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
            boxShadow: '0 4px 20px rgba(255, 70, 85, 0.3)',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
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
        <Link
          href="/"
          style={{
            padding: '0.875rem 2rem',
            background: 'transparent',
            color: 'var(--radiant-white, #ffffff)',
            border: '2px solid var(--radiant-border, #2a2a3a)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9375rem',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLAnchorElement).style.borderColor =
              'var(--radiant-red, #ff4655)';
            (e.target as HTMLAnchorElement).style.color =
              'var(--radiant-red, #ff4655)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLAnchorElement).style.borderColor =
              'var(--radiant-border, #2a2a3a)';
            (e.target as HTMLAnchorElement).style.color =
              'var(--radiant-white, #ffffff)';
          }}
        >
          Go Home
        </Link>
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
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor =
              'var(--radiant-cyan, #00d4ff)';
            (e.target as HTMLButtonElement).style.background =
              'rgba(0, 212, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor =
              'var(--radiant-border, #2a2a3a)';
            (e.target as HTMLButtonElement).style.background =
              'var(--radiant-card, #14141f)';
          }}
        >
          Refresh Page
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details
          style={{
            marginTop: '2rem',
            textAlign: 'left',
            maxWidth: '800px',
            color: 'var(--radiant-gray, #8a8a9a)',
          }}
        >
          <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
            Error Details
          </summary>
          <pre
            style={{
              background: 'var(--radiant-card, #14141f)',
              padding: '1rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.75rem',
              color: 'var(--radiant-cyan, #00d4ff)',
            }}
          >
            {error?.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
