/**
 * Error Handling System
 * 404 pages, offline fallback, and retry logic
 */

import { HUBS } from '../router/CrossHubRouter.js';
import { breadcrumbGenerator } from './Breadcrumbs.js';

/**
 * Error Types
 */
export const ERROR_TYPES = {
  NOT_FOUND: 'NOT_FOUND',
  OFFLINE: 'OFFLINE',
  SERVER_ERROR: 'SERVER_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  MAINTENANCE: 'MAINTENANCE',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

/**
 * Error page configurations
 */
export const ERROR_PAGES = {
  [ERROR_TYPES.NOT_FOUND]: {
    statusCode: 404,
    title: 'Page Not Found',
    message: 'The page you\'re looking for doesn\'t exist or has been moved.',
    icon: '🔍',
    color: '#FFD700',
    suggestions: true,
    actions: ['go_home', 'go_back', 'search'],
  },
  [ERROR_TYPES.OFFLINE]: {
    statusCode: 503,
    title: 'You\'re Offline',
    message: 'Please check your internet connection and try again.',
    icon: '📡',
    color: '#FF6B35',
    suggestions: false,
    actions: ['retry', 'go_home'],
  },
  [ERROR_TYPES.SERVER_ERROR]: {
    statusCode: 500,
    title: 'Server Error',
    message: 'Something went wrong on our end. We\'re working to fix it.',
    icon: '⚙️',
    color: '#FF4444',
    suggestions: false,
    actions: ['retry', 'go_home', 'contact_support'],
  },
  [ERROR_TYPES.FORBIDDEN]: {
    statusCode: 403,
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    icon: '🚫',
    color: '#FF4444',
    suggestions: true,
    actions: ['go_home', 'upgrade'],
  },
  [ERROR_TYPES.TIMEOUT]: {
    statusCode: 504,
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    icon: '⏱️',
    color: '#FFA500',
    suggestions: false,
    actions: ['retry', 'go_home'],
  },
  [ERROR_TYPES.RATE_LIMITED]: {
    statusCode: 429,
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait a moment.',
    icon: '⏳',
    color: '#FFA500',
    suggestions: false,
    actions: ['retry', 'go_home'],
  },
  [ERROR_TYPES.MAINTENANCE]: {
    statusCode: 503,
    title: 'Under Maintenance',
    message: 'We\'re performing scheduled maintenance. We\'ll be back soon!',
    icon: '🔧',
    color: '#9370DB',
    suggestions: false,
    actions: ['refresh', 'status_page'],
  },
};

/**
 * Error Handler Class
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.fallbackRoute = options.fallbackRoute || '/';
    this.supportUrl = options.supportUrl || '/support';
    this.statusUrl = options.statusUrl || '/status';
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.retryMultiplier = options.retryMultiplier || 2;
    this.retryAttempts = new Map();
    this.onError = options.onError || null;
    this.onRetry = options.onRetry || null;
  }

  /**
   * Handle error with appropriate response
   */
  async handle(error, context = {}) {
    const { type = ERROR_TYPES.SERVER_ERROR, route = null } = error;
    const config = ERROR_PAGES[type] || ERROR_PAGES[ERROR_TYPES.SERVER_ERROR];
    
    // Log error
    this.logError(error, context);
    
    // Execute custom handler if provided
    if (this.onError) {
      const handled = await this.onError(error, context);
      if (handled) return;
    }
    
    // Build error page data
    const errorData = {
      ...config,
      type,
      route,
      timestamp: Date.now(),
      requestId: this.generateRequestId(),
      suggestions: config.suggestions ? this.generateSuggestions(route) : [],
      retry: () => this.retry(error, context),
    };
    
    return errorData;
  }

  /**
   * Log error to console and analytics
   */
  logError(error, context) {
    console.error('[SATOR Router Error]', error, context);
    
    if (typeof window !== 'undefined' && window.satorAnalytics) {
      window.satorAnalytics.track({
        type: 'error',
        errorType: error.type,
        message: error.message,
        route: context.route,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Generate hub suggestions for 404
   */
  generateSuggestions(currentRoute) {
    const suggestions = [];
    
    // Get current hub
    let currentHub = null;
    for (const hub of Object.values(HUBS)) {
      if (currentRoute?.startsWith(hub.baseUrl)) {
        currentHub = hub;
        break;
      }
    }
    
    // Add related hubs
    for (const hub of Object.values(HUBS)) {
      if (!currentHub || hub.id !== currentHub.id) {
        suggestions.push({
          type: 'hub',
          title: hub.name,
          description: hub.description,
          url: hub.filePath,
          icon: hub.icon,
          color: hub.color,
        });
      }
    }
    
    // Add common pages
    suggestions.push(
      { type: 'page', title: 'Live Matches', url: '/sator/live', icon: '🔴' },
      { type: 'page', title: 'Analytics', url: '/rotas/analytics', icon: '📊' },
      { type: 'page', title: 'Download Game', url: '/games/download', icon: '⬇️' }
    );
    
    return suggestions.slice(0, 5);
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retry failed request
   */
  async retry(error, context) {
    const key = `${error.type}_${context.route}`;
    const attempts = this.retryAttempts.get(key) || 0;
    
    if (attempts >= this.maxRetries) {
      throw new Error('Max retry attempts exceeded');
    }
    
    this.retryAttempts.set(key, attempts + 1);
    
    // Calculate delay with exponential backoff
    const delay = this.retryDelay * Math.pow(this.retryMultiplier, attempts);
    
    // Execute retry callback
    if (this.onRetry) {
      await this.onRetry(error, context, { attempt: attempts + 1, delay });
    }
    
    // Wait before retry
    await this.sleep(delay);
    
    return this.handle(error, context);
  }

  /**
   * Reset retry attempts
   */
  resetRetries(error, context) {
    const key = `${error?.type}_${context?.route}`;
    this.retryAttempts.delete(key);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if user is online
   */
  isOnline() {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  /**
   * Register offline handler
   */
  registerOfflineHandler(callback) {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('offline', () => {
      callback({ type: ERROR_TYPES.OFFLINE });
    });
    
    window.addEventListener('online', () => {
      this.retryAttempts.clear();
    });
  }

  /**
   * Create error from HTTP response
   */
  static fromResponse(response, route = null) {
    const typeMap = {
      404: ERROR_TYPES.NOT_FOUND,
      403: ERROR_TYPES.FORBIDDEN,
      500: ERROR_TYPES.SERVER_ERROR,
      502: ERROR_TYPES.SERVER_ERROR,
      503: ERROR_TYPES.MAINTENANCE,
      504: ERROR_TYPES.TIMEOUT,
      429: ERROR_TYPES.RATE_LIMITED,
    };
    
    return {
      type: typeMap[response.status] || ERROR_TYPES.SERVER_ERROR,
      status: response.status,
      statusText: response.statusText,
      route,
      message: response.statusText,
    };
  }
}

/**
 * 404 Page Component Generator
 */
export class ErrorPageGenerator {
  constructor(options = {}) {
    this.errorHandler = options.errorHandler || new ErrorHandler();
    this.theme = options.theme || 'dark';
    this.showBreadcrumbs = options.showBreadcrumbs !== false;
  }

  /**
   * Generate 404 page HTML
   */
  generate404(currentRoute = null) {
    const error = { type: ERROR_TYPES.NOT_FOUND, route: currentRoute };
    const errorData = this.errorHandler.handle(error, { route: currentRoute });
    
    return this.buildHTML(errorData);
  }

  /**
   * Generate offline page HTML
   */
  generateOffline() {
    const error = { type: ERROR_TYPES.OFFLINE };
    const errorData = this.errorHandler.handle(error);
    
    return this.buildHTML(errorData);
  }

  /**
   * Build error page HTML
   */
  buildHTML(errorData) {
    const { statusCode, title, message, icon, color, suggestions, actions, requestId } = errorData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusCode} - ${title} | SATOR</title>
  <link rel="stylesheet" href="../shared/styles/error-pages.css">
  <style>
    :root {
      --error-color: ${color};
      --bg-color: ${this.theme === 'dark' ? '#0a0a0a' : '#f5f5f5'};
      --text-color: ${this.theme === 'dark' ? '#ffffff' : '#1a1a1a'};
      --card-bg: ${this.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-color);
      color: var(--text-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .error-container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    
    .error-icon {
      font-size: 6rem;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .error-code {
      font-size: 8rem;
      font-weight: 900;
      color: var(--error-color);
      line-height: 1;
      margin-bottom: 1rem;
      text-shadow: 0 0 40px ${color}40;
    }
    
    .error-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .error-message {
      font-size: 1.1rem;
      opacity: 0.8;
      margin-bottom: 2rem;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 3rem;
    }
    
    .btn {
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }
    
    .btn-primary {
      background: var(--error-color);
      color: #000;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px ${color}40;
    }
    
    .btn-secondary {
      background: transparent;
      color: var(--text-color);
      border: 2px solid var(--text-color);
      opacity: 0.6;
    }
    
    .btn-secondary:hover {
      opacity: 1;
      border-color: var(--error-color);
      color: var(--error-color);
    }
    
    .suggestions {
      margin-top: 2rem;
    }
    
    .suggestions-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      opacity: 0.8;
    }
    
    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .suggestion-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: left;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    
    .suggestion-card:hover {
      transform: translateY(-4px);
      border-color: var(--error-color);
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    }
    
    .suggestion-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .suggestion-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .suggestion-desc {
      font-size: 0.875rem;
      opacity: 0.6;
    }
    
    .request-id {
      margin-top: 3rem;
      font-size: 0.75rem;
      opacity: 0.4;
      font-family: monospace;
    }
    
    .hub-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--card-bg);
      border-radius: 100px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
    .hub-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--error-color);
    }
    
    @media (max-width: 600px) {
      .error-code { font-size: 5rem; }
      .error-title { font-size: 1.5rem; }
      .error-icon { font-size: 4rem; }
      .suggestions-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="hub-indicator">
      <span class="hub-dot"></span>
      <span>SATOR Platform</span>
    </div>
    
    <div class="error-icon">${icon}</div>
    <div class="error-code">${statusCode}</div>
    <h1 class="error-title">${title}</h1>
    <p class="error-message">${message}</p>
    
    <div class="error-actions">
      ${this.renderActions(actions)}
    </div>
    
    ${suggestions?.length ? `
      <div class="suggestions">
        <p class="suggestions-title">You might be looking for:</p>
        <div class="suggestions-grid">
          ${suggestions.map(s => this.renderSuggestion(s)).join('')}
        </div>
      </div>
    ` : ''}
    
    <div class="request-id">Request ID: ${requestId}</div>
  </div>
  
  <script src="../shared/scripts/error-recovery.js"></script>
</body>
</html>`;
  }

  /**
   * Render action buttons
   */
  renderActions(actions) {
    const actionMap = {
      go_home: '<a href="/" class="btn btn-primary">🏠 Go Home</a>',
      go_back: '<button class="btn btn-secondary" onclick="history.back()">← Go Back</button>',
      retry: '<button class="btn btn-primary" id="retry-btn">🔄 Try Again</button>',
      refresh: '<button class="btn btn-primary" onclick="location.reload()">🔄 Refresh Page</button>',
      search: '<a href="/search" class="btn btn-secondary">🔍 Search</a>',
      upgrade: '<a href="/upgrade" class="btn btn-primary">⭐ Upgrade</a>',
      contact_support: '<a href="/support" class="btn btn-secondary">💬 Contact Support</a>',
      status_page: '<a href="/status" class="btn btn-secondary">📊 Status Page</a>',
    };
    
    return actions.map(action => actionMap[action] || '').filter(Boolean).join('');
  }

  /**
   * Render suggestion card
   */
  renderSuggestion(suggestion) {
    const icon = suggestion.icon || '→';
    const color = suggestion.color || 'inherit';
    
    return `
      <a href="${suggestion.url}" class="suggestion-card" style="--hub-color: ${color}">
        <div class="suggestion-icon" style="color: ${color}">${icon}</div>
        <div class="suggestion-title">${suggestion.title}</div>
        ${suggestion.description ? `<div class="suggestion-desc">${suggestion.description}</div>` : ''}
      </a>
    `;
  }
}

/**
 * Offline Manager
 */
export class OfflineManager {
  constructor(options = {}) {
    this.cacheName = options.cacheName || 'sator-offline-v1';
    this.offlinePage = options.offlinePage || '/offline.html';
    this.assets = options.assets || [];
    this.isOffline = false;
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Initial state
    this.isOffline = !navigator.onLine;
  }

  handleOnline() {
    this.isOffline = false;
    document.body?.classList.remove('is-offline');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('sator:online'));
    
    // Show reconnection notification
    this.showNotification('🌐 Back online!', 'success');
  }

  handleOffline() {
    this.isOffline = true;
    document.body?.classList.add('is-offline');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('sator:offline'));
    
    // Show offline notification
    this.showNotification('📡 You\'re offline. Some features may be unavailable.', 'warning');
  }

  showNotification(message, type = 'info') {
    // Use toast notification if available
    if (window.satorToast) {
      window.satorToast.show(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Check if resource is available offline
   */
  async isCached(url) {
    if (!('caches' in window)) return false;
    
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(url);
    return !!response;
  }

  /**
   * Cache resources for offline use
   */
  async cacheResources(urls) {
    if (!('caches' in window)) return;
    
    const cache = await caches.open(this.cacheName);
    const promises = urls.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          cache.put(url, response.clone());
        }
      }).catch(() => {})
    );
    
    await Promise.all(promises);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(url) {
    if (!('caches' in window)) return null;
    
    const cache = await caches.open(this.cacheName);
    return cache.match(url);
  }
}

// Create singleton instances
export const errorHandler = new ErrorHandler();
export const errorPageGenerator = new ErrorPageGenerator();
export const offlineManager = new OfflineManager();

// Default export
export default {
  ErrorHandler,
  ErrorPageGenerator,
  OfflineManager,
  errorHandler,
  errorPageGenerator,
  offlineManager,
  ERROR_TYPES,
  ERROR_PAGES,
};
