/**
 * Error Recovery Script
 * Handles retry logic and offline recovery
 */

(function() {
  'use strict';

  // Error recovery configuration
  const config = {
    maxRetries: 3,
    retryDelay: 1000,
    retryMultiplier: 2,
    offlineCheckInterval: 5000,
  };

  // State
  let retryAttempts = 0;
  let isRetrying = false;
  let offlineCheckTimer = null;

  /**
   * Initialize error recovery
   */
  function init() {
    // Set up retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', handleRetry);
    }

    // Check online status
    checkOnlineStatus();
    
    // Set up online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start offline check interval
    startOfflineCheck();
  }

  /**
   * Handle retry button click
   */
  async function handleRetry() {
    if (isRetrying) return;
    
    isRetrying = true;
    const btn = document.getElementById('retry-btn');
    
    if (btn) {
      btn.disabled = true;
      btn.textContent = '🔄 Retrying...';
    }

    try {
      const success = await attemptRecovery();
      
      if (success) {
        showNotification('✅ Success! Reloading...', 'success');
        setTimeout(() => location.reload(), 1000);
      } else {
        retryAttempts++;
        
        if (retryAttempts >= config.maxRetries) {
          showNotification('❌ Max retries exceeded. Please try again later.', 'error');
          if (btn) {
            btn.textContent = '❌ Failed';
          }
        } else {
          const delay = config.retryDelay * Math.pow(config.retryMultiplier, retryAttempts - 1);
          showNotification(`⏳ Retry ${retryAttempts}/${config.maxRetries} failed. Waiting ${delay/1000}s...`, 'warning');
          
          setTimeout(() => {
            isRetrying = false;
            if (btn) {
              btn.disabled = false;
              btn.textContent = '🔄 Try Again';
            }
          }, delay);
        }
      }
    } catch (error) {
      console.error('Recovery error:', error);
      showNotification('❌ An error occurred during recovery', 'error');
      isRetrying = false;
      
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔄 Try Again';
      }
    }
  }

  /**
   * Attempt to recover connection
   */
  async function attemptRecovery() {
    // Try to fetch a small resource
    try {
      const testUrl = '/api/health?' + Date.now();
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch (error) {
      // Try alternative check
      return navigator.onLine;
    }
  }

  /**
   * Handle going online
   */
  function handleOnline() {
    showNotification('🌐 Back online!', 'success');
    stopOfflineCheck();
    
    // Auto-retry after going online
    if (retryAttempts > 0) {
      setTimeout(handleRetry, 1000);
    }
  }

  /**
   * Handle going offline
   */
  function handleOffline() {
    showNotification('📡 Connection lost. Retrying when back online...', 'warning');
    startOfflineCheck();
  }

  /**
   * Check online status periodically
   */
  function startOfflineCheck() {
    if (offlineCheckTimer) return;
    
    offlineCheckTimer = setInterval(() => {
      checkOnlineStatus();
    }, config.offlineCheckInterval);
  }

  /**
   * Stop offline check
   */
  function stopOfflineCheck() {
    if (offlineCheckTimer) {
      clearInterval(offlineCheckTimer);
      offlineCheckTimer = null;
    }
  }

  /**
   * Check current online status
   */
  function checkOnlineStatus() {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      document.body?.classList.remove('is-offline');
    } else {
      document.body?.classList.add('is-offline');
    }
    
    return isOnline;
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.error-notification');
    if (existing) {
      existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `error-notification ${type}`;
    notification.textContent = message;
    
    // Styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      borderRadius: '8px',
      fontWeight: '500',
      zIndex: '10000',
      animation: 'slideDown 0.3s ease',
      background: type === 'success' ? '#22c55e' : 
                  type === 'error' ? '#ef4444' : 
                  type === 'warning' ? '#f59e0b' : '#3b82f6',
      color: '#fff',
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, -100%); opacity: 0; }
    }
    .is-offline .error-icon {
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose to global scope
  window.SatorErrorRecovery = {
    retry: handleRetry,
    checkOnline: checkOnlineStatus,
    showNotification,
  };
})();
