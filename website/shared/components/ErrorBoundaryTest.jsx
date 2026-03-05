/**
 * Error Boundary Test Component
 * Use this to verify error boundaries are working correctly
 * 
 * Usage:
 * - For React hubs: Import and add <ErrorBoundaryTest /> to any component
 * - For SATOR hub: Call SATOR_ERROR_BOUNDARY.test() from console
 */

import React, { useState } from 'react';

// React Test Component - Intentionally throws error
export function ErrorBoundaryTest() {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error('Intentional test error from ErrorBoundaryTest component');
  }

  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(255, 70, 85, 0.1)',
      border: '2px dashed #ff4655',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <h4 style={{ color: '#ff4655', margin: '0 0 0.5rem' }}>🧪 Error Boundary Test</h4>
      <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#8a8a9a' }}>
        Click the button below to test the error boundary. 
        The app should show a fallback UI instead of crashing completely.
      </p>
      <button
        onClick={() => setShouldCrash(true)}
        style={{
          padding: '0.5rem 1rem',
          background: '#ff4655',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        💥 Trigger Test Error
      </button>
    </div>
  );
}

// Vanilla JS Test for SATOR hub
export function initSatorErrorTest() {
  if (typeof window !== 'undefined') {
    window.SATOR_ERROR_TEST = {
      triggerError() {
        throw new Error('Intentional test error from SATOR_ERROR_TEST');
      },
      triggerAsyncError() {
        Promise.reject(new Error('Intentional async test error'));
      },
      triggerUnhandledRejection() {
        new Promise((_, reject) => {
          reject(new Error('Intentional unhandled promise rejection'));
        });
      }
    };
    
    console.log('[SATOR] Error test utilities available:');
    console.log('  - SATOR_ERROR_TEST.triggerError()');
    console.log('  - SATOR_ERROR_TEST.triggerAsyncError()');
    console.log('  - SATOR_ERROR_TEST.triggerUnhandledRejection()');
  }
}

export default ErrorBoundaryTest;
