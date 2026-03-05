/**
 * SATOR Hub Error Boundary
 * Catches JavaScript errors and displays a fallback UI
 * Similar to React Error Boundaries but for vanilla JS
 */

(function() {
  'use strict';

  const SATOR_ERROR_BOUNDARY = {
    hasError: false,
    error: null,
    container: null,

    /**
     * Initialize the error boundary
     */
    init() {
      // Store original container content
      this.container = document.getElementById('sator-container') || document.body;
      this.originalContent = this.container.innerHTML;

      // Set up global error handler
      window.addEventListener('error', (event) => this.handleError(event));
      window.addEventListener('unhandledrejection', (event) => this.handlePromiseRejection(event));

      console.log('[SATOR] Error Boundary initialized');
    },

    /**
     * Handle global errors
     */
    handleError(event) {
      if (this.hasError) return; // Already showing error UI

      this.hasError = true;
      this.error = {
        message: event.error?.message || event.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      };

      console.error('[SATOR] Error caught by boundary:', this.error);
      this.showFallbackUI();

      // Prevent default browser error handling
      event.preventDefault();
    },

    /**
     * Handle unhandled promise rejections
     */
    handlePromiseRejection(event) {
      if (this.hasError) return;

      this.hasError = true;
      this.error = {
        message: event.reason?.message || String(event.reason) || 'Promise rejection',
        stack: event.reason?.stack,
        type: 'promise_rejection',
      };

      console.error('[SATOR] Promise rejection caught:', this.error);
      this.showFallbackUI();

      event.preventDefault();
    },

    /**
     * Show the fallback error UI with NJZ design system styling
     */
    showFallbackUI() {
      const fallbackHTML = `
        <div id="sator-error-fallback" style="
          padding: 2rem;
          text-align: center;
          background: #0a0a0f;
          color: #ffffff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', 'Space Grotesk', system-ui, sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
        ">
          <div style="
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #ff4655;
            text-shadow: 0 0 40px rgba(255, 70, 85, 0.4);
          ">⚠️</div>
          <h2 style="
            margin-bottom: 1rem;
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #ffffff;
          ">SATOR Hub Error</h2>
          <p style="
            opacity: 0.8;
            margin-bottom: 2rem;
            color: #8a8a9a;
            max-width: 400px;
          ">
            ${this.escapeHtml(this.error?.message || 'An unexpected error occurred in SATOR Hub.')}
          </p>
          <div style="
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
          ">
            <button onclick="SATOR_ERROR_BOUNDARY.retry()" style="
              padding: 0.875rem 2rem;
              background: #ff4655;
              color: #fff;
              border: none;
              border-radius: 12px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.9375rem;
              transition: all 0.2s ease;
              box-shadow: 0 4px 20px rgba(255, 70, 85, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 24px rgba(255, 70, 85, 0.4)';"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(255, 70, 85, 0.3)';"
            >
              Try Again
            </button>
            <a href="/" style="
              padding: 0.875rem 2rem;
              background: transparent;
              color: #ffffff;
              border: 2px solid #2a2a3a;
              border-radius: 12px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.9375rem;
              transition: all 0.2s ease;
              text-decoration: none;
            " onmouseover="this.style.borderColor='#ff4655'; this.style.color='#ff4655';"
               onmouseout="this.style.borderColor='#2a2a3a'; this.style.color='#ffffff';"
            >
              Go Home
            </a>
            <button onclick="window.location.reload()" style="
              padding: 0.875rem 2rem;
              background: #14141f;
              color: #00d4ff;
              border: 2px solid #2a2a3a;
              border-radius: 12px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.9375rem;
              transition: all 0.2s ease;
            " onmouseover="this.style.borderColor='#00d4ff'; this.style.background='rgba(0, 212, 255, 0.1)';"
               onmouseout="this.style.borderColor='#2a2a3a'; this.style.background='#14141f';"
            >
              Refresh Page
            </button>
          </div>
        </div>
      `;

      // Replace container content with error UI
      this.container.innerHTML = fallbackHTML;
    },

    /**
     * Retry - attempt to restore the original content
     */
    retry() {
      this.hasError = false;
      this.error = null;

      // Remove error UI
      const errorFallback = document.getElementById('sator-error-fallback');
      if (errorFallback) {
        errorFallback.remove();
      }

      // Reload page to ensure clean state
      window.location.reload();
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Wrap a function with error boundary
     */
    wrap(fn, context = 'unknown') {
      return (...args) => {
        try {
          return fn.apply(this, args);
        } catch (error) {
          console.error(`[SATOR] Error in ${context}:`, error);
          this.hasError = true;
          this.error = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            context,
          };
          this.showFallbackUI();
          throw error;
        }
      };
    },

    /**
     * Wrap an async function with error boundary
     */
    wrapAsync(fn, context = 'unknown') {
      return async (...args) => {
        try {
          return await fn.apply(this, args);
        } catch (error) {
          console.error(`[SATOR] Error in ${context}:`, error);
          this.hasError = true;
          this.error = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            context,
          };
          this.showFallbackUI();
          throw error;
        }
      };
    },
  };

  // Expose to global scope
  window.SATOR_ERROR_BOUNDARY = SATOR_ERROR_BOUNDARY;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SATOR_ERROR_BOUNDARY.init());
  } else {
    SATOR_ERROR_BOUNDARY.init();
  }
})();
