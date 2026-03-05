/**
 * SATOR Cross-Hub Router
 * Comprehensive routing system with analytics integration
 */

// Route Definitions
export const ROUTES = {
  // SATOR Hub Routes
  SATOR: {
    BASE: '/sator',
    MATCHES: '/sator/matches',
    MATCH_DETAIL: '/sator/matches/:id',
    PLAYERS: '/sator/players',
    PLAYER_DETAIL: '/sator/players/:id',
    ARCHIVE: '/sator/archive',
    LIVE: '/sator/live',
  },
  // ROTAS Hub Routes
  ROTAS: {
    BASE: '/rotas',
    ANALYTICS: '/rotas/analytics',
    ANALYTICS_DETAIL: '/rotas/analytics/:id',
    PREDICTIONS: '/rotas/predictions',
    PROBABILITY: '/rotas/probability/:id',
    FORMULAS: '/rotas/formulas',
  },
  // INFO Hub Routes
  INFO: {
    BASE: '/info',
    TEAMS: '/info/teams',
    TEAM_DETAIL: '/info/teams/:id',
    TOURNAMENTS: '/info/tournaments',
    TOURNAMENT_DETAIL: '/info/tournaments/:id',
    GUIDES: '/info/guides',
    FAQ: '/info/faq',
  },
  // GAMES Hub Routes
  GAMES: {
    BASE: '/games',
    DOWNLOAD: '/games/download',
    PLAY: '/games/play/:id',
    SIMULATOR: '/games/simulator',
    REPLAY: '/games/replay/:id',
  },
  // Error Routes
  ERROR: {
    NOT_FOUND: '/404',
    OFFLINE: '/offline',
    MAINTENANCE: '/maintenance',
  },
};

// Hub mapping for navigation
export const HUBS = {
  SATOR: {
    id: 'sator',
    name: 'SATOR',
    icon: '◎',
    color: '#FFD700',
    description: 'RAWS Archive',
    baseUrl: '/sator',
    filePath: '/hub1-sator/index.html',
  },
  ROTAS: {
    id: 'rotas',
    name: 'ROTAS',
    icon: '◈',
    color: '#00CED1',
    description: 'Analytics Engine',
    baseUrl: '/rotas',
    filePath: '/hub2-rotas/index.html',
  },
  INFO: {
    id: 'info',
    name: 'INFO',
    icon: 'ℹ',
    color: '#9370DB',
    description: 'Knowledge Hub',
    baseUrl: '/info',
    filePath: '/hub3-information/index.html',
  },
  GAMES: {
    id: 'games',
    name: 'GAMES',
    icon: '▶',
    color: '#32CD32',
    description: 'Play & Download',
    baseUrl: '/games',
    filePath: '/hub4-games/index.html',
  },
};

/**
 * Router class for managing navigation and state
 */
export class CrossHubRouter {
  /**
   * Whitelist of allowed query parameters
   */
  ALLOWED_PARAMS = [
    'dl',      // Deep link
    'hub',     // Hub target
    'state',   // State data
    'expires', // Expiration
    'ref',     // Referrer
    'source',  // Traffic source
  ];

  constructor(options = {}) {
    this.basePath = options.basePath || '';
    this.strictQueryParams = options.strictQueryParams !== false;
    this.hooks = {
      beforeNavigate: [],
      afterNavigate: [],
      onError: [],
    };
    this.currentRoute = null;
    this.routeHistory = [];
    this.maxHistorySize = options.maxHistorySize || 50;
    this.enableAnalytics = options.enableAnalytics !== false;
    this.enableDeepLinking = options.enableDeepLinking !== false;

    // Bind methods for proper cleanup
    this.handlePopState = this.handlePopState.bind(this);
    this.trackPageView = this.trackPageView.bind(this);

    this.init();
  }

  /**
   * Sanitize query parameter value
   */
  sanitizeParamValue(value) {
    if (typeof value !== 'string') return '';

    // Limit length to prevent DoS
    const maxLength = 2048;
    let sanitized = value.slice(0, maxLength);

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    return sanitized;
  }

  /**
   * Validate route parameter
   */
  validateRouteParam(key, value) {
    const maxLength = 256;

    if (typeof value !== 'string') return '';

    // Trim and limit length
    let sanitized = value.trim().slice(0, maxLength);

    // Remove control characters and dangerous patterns
    sanitized = sanitized
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[<>"']/g, '')  // Remove HTML special chars
      .replace(/\.\./g, '');    // Prevent path traversal

    // Validate ID format (alphanumeric, hyphens, underscores)
    if (key.toLowerCase().includes('id')) {
      if (!/^[\w-]+$/.test(sanitized)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[CrossHubRouter] Invalid ID format for ${key}:`, value);
        }
        return '';
      }
    }

    return sanitized;
  }

  init() {
    // Initialize from current URL
    this.parseCurrentUrl();

    // Set up popstate listener with bound method for cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState);

      // Handle initial deep link
      if (this.enableDeepLinking) {
        this.handleDeepLink();
      }
    }
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState);
      window.removeEventListener('router:pageview', this.trackPageView);
      window.removeEventListener('router:event', this.trackPageView);
    }

    // Clear hooks
    this.hooks.beforeNavigate = [];
    this.hooks.afterNavigate = [];
    this.hooks.onError = [];

    // Clear history
    this.routeHistory = [];
  }

  /**
   * Parse current URL and extract route information
   */
  parseCurrentUrl() {
    if (typeof window === 'undefined') return null;
    
    const url = new URL(window.location.href);
    const path = url.pathname;
    const params = this.extractParams(path);
    const query = this.parseQueryString(url.search);
    
    this.currentRoute = {
      path,
      params,
      query,
      hash: url.hash,
      timestamp: Date.now(),
    };
    
    return this.currentRoute;
  }

  /**
   * Extract route parameters from path with validation
   */
  extractParams(path) {
    if (!path || typeof path !== 'string') {
      console.warn('[CrossHubRouter] Invalid path provided to extractParams');
      return {};
    }

    const params = {};

    // Match dynamic segments like :id
    const paramPattern = /:([^/]+)/g;

    for (const [routePattern] of Object.entries(this.getAllRoutes())) {
      const regex = this.routeToRegex(routePattern);
      const match = path.match(regex);

      if (match) {
        const keys = [];
        let paramMatch;
        while ((paramMatch = paramPattern.exec(routePattern)) !== null) {
          keys.push(paramMatch[1]);
        }

        keys.forEach((key, index) => {
          const rawValue = match[index + 1];
          params[key] = this.validateRouteParam(key, rawValue);
        });

        break;
      }
    }

    return params;
  }

  /**
   * Convert route pattern to regex
   */
  routeToRegex(route) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const paramRegex = escaped.replace(/:([^/]+)/g, '([^/]+)');
    return new RegExp(`^${paramRegex}$`);
  }

  /**
   * Parse query string to object with validation
   */
  parseQueryString(search) {
    const params = {};
    if (!search) return params;

    const queryString = search.startsWith('?') ? search.slice(1) : search;

    // Limit query string length to prevent DoS
    if (queryString.length > 4096) {
      console.warn('[CrossHubRouter] Query string too long, truncating');
    }

    const pairs = queryString.slice(0, 4096).split('&');

    pairs.forEach(pair => {
      if (!pair) return;

      const eqIndex = pair.indexOf('=');
      let key, value;

      if (eqIndex === -1) {
        key = pair;
        value = '';
      } else {
        key = pair.slice(0, eqIndex);
        value = pair.slice(eqIndex + 1);
      }

      try {
        key = decodeURIComponent(key);
        value = decodeURIComponent(value);
      } catch (e) {
        console.warn('[CrossHubRouter] Failed to decode query param:', key);
        return;
      }

      // Validate key against whitelist if strict mode enabled
      if (this.strictQueryParams && !this.ALLOWED_PARAMS.includes(key)) {
        return;
      }

      // Sanitize both key and value
      key = this.sanitizeParamValue(key);
      value = this.sanitizeParamValue(value);

      if (key) {
        params[key] = value;
      }
    });

    return params;
  }

  /**
   * Build query string from object
   */
  buildQueryString(params) {
    const pairs = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    return pairs.length > 0 ? `?${pairs.join('&')}` : '';
  }

  /**
   * Get all route patterns
   */
  getAllRoutes() {
    const routes = {};
    
    const extractRoutes = (obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string') {
          routes[key] = value;
        } else if (typeof value === 'object') {
          extractRoutes(value);
        }
      });
    };
    
    extractRoutes(ROUTES);
    return routes;
  }

  /**
   * Navigate to a route
   */
  navigate(to, options = {}) {
    const { replace = false, preserveQuery = false, state = {} } = options;
    
    // Execute beforeNavigate hooks
    const shouldProceed = this.executeHooks('beforeNavigate', { to, from: this.currentRoute });
    if (shouldProceed === false) return false;
    
    let targetUrl = this.resolveUrl(to);
    
    // Preserve query params if requested
    if (preserveQuery && this.currentRoute?.query) {
      const currentQuery = this.buildQueryString(this.currentRoute.query);
      if (currentQuery && !targetUrl.includes('?')) {
        targetUrl += currentQuery;
      }
    }
    
    // Update browser history
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState(state, '', targetUrl);
      } else {
        window.history.pushState(state, '', targetUrl);
      }
    }
    
    // Update internal state
    this.addToHistory(this.currentRoute);
    this.parseCurrentUrl();
    
    // Track analytics
    if (this.enableAnalytics) {
      this.trackPageView(targetUrl);
    }
    
    // Execute afterNavigate hooks
    this.executeHooks('afterNavigate', { to: targetUrl, from: this.currentRoute });
    
    return true;
  }

  /**
   * Resolve URL from route pattern or path
   */
  resolveUrl(to) {
    if (typeof to === 'string') {
      // Check if it's a route pattern
      if (to.startsWith('/')) return to;
      
      // Check if it's a named route
      const allRoutes = this.getAllRoutes();
      if (allRoutes[to]) {
        return allRoutes[to];
      }
    }
    
    if (typeof to === 'object') {
      const { name, params = {}, query = {} } = to;
      let path = this.getAllRoutes()[name] || name;
      
      // Replace params
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, encodeURIComponent(value));
      });
      
      // Add query string
      const queryString = this.buildQueryString(query);
      return path + queryString;
    }
    
    return to;
  }

  /**
   * Navigate back
   */
  back(fallback = '/') {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
        return true;
      }
    }
    this.navigate(fallback);
    return false;
  }

  /**
   * Handle popstate events (back/forward buttons)
   */
  handlePopState(event) {
    const previousRoute = this.currentRoute;
    this.parseCurrentUrl();
    
    // Restore state if available
    if (event.state) {
      Object.assign(this.currentRoute, { state: event.state });
    }
    
    // Track analytics
    if (this.enableAnalytics) {
      this.trackPageView(this.currentRoute.path, { navigationType: 'popstate' });
    }
    
    this.executeHooks('afterNavigate', { 
      to: this.currentRoute, 
      from: previousRoute,
      navigationType: 'popstate'
    });
  }

  /**
   * Validate deep link URL for security
   */
  isValidDeepLink(url) {
    if (typeof url !== 'string') return false;

    // Check for dangerous protocols
    const lowerUrl = url.toLowerCase().trim();
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[CrossHubRouter] Blocked dangerous deep link protocol:', protocol);
        }
        return false;
      }
    }

    // Check max length
    if (url.length > 2048) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[CrossHubRouter] Deep link too long');
      }
      return false;
    }

    // Validate against internal routes
    return this.isValidInternalLink(url);
  }

  /**
   * Handle deep linking with validation
   */
  handleDeepLink() {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);

      // Check for deep link parameters
      const deepLink = url.searchParams.get('dl');
      const hubTarget = url.searchParams.get('hub');

      if (deepLink) {
        // Validate and navigate to deep link
        const decodedLink = decodeURIComponent(deepLink);
        if (this.isValidDeepLink(decodedLink)) {
          setTimeout(() => this.navigate(decodedLink, { replace: true }), 0);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[CrossHubRouter] Invalid deep link target:', decodedLink);
          }
        }
      }

      if (hubTarget && HUBS[hubTarget.toUpperCase()]) {
        // Track cross-hub navigation
        this.trackEvent('deep_link', { targetHub: hubTarget });
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[CrossHubRouter] Deep link handling failed:', error);
      }
    }
  }

  /**
   * Validate internal link
   */
  isValidInternalLink(url) {
    // Check if it's a valid internal route
    const allRoutes = Object.values(this.getAllRoutes());
    return allRoutes.some(route => {
      const regex = this.routeToRegex(route);
      return regex.test(url);
    });
  }

  /**
   * Add route to history
   */
  addToHistory(route) {
    if (!route) return;
    
    this.routeHistory.unshift({ ...route, timestamp: Date.now() });
    
    // Trim history if needed
    if (this.routeHistory.length > this.maxHistorySize) {
      this.routeHistory = this.routeHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get navigation history
   */
  getHistory() {
    return [...this.routeHistory];
  }

  /**
   * Get previous route
   */
  getPreviousRoute() {
    return this.routeHistory[0] || null;
  }

  /**
   * Register hook
   */
  on(event, callback) {
    if (this.hooks[event]) {
      this.hooks[event].push(callback);
    }
  }

  /**
   * Remove hook
   */
  off(event, callback) {
    if (this.hooks[event]) {
      this.hooks[event] = this.hooks[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Execute hooks
   */
  executeHooks(event, data) {
    if (!this.hooks[event]) return true;
    
    for (const hook of this.hooks[event]) {
      try {
        const result = hook(data);
        if (result === false) return false;
      } catch (error) {
        console.error(`[CrossHubRouter] Hook error for ${event}:`, error);
        // Don't fail silently - attempt error hook
        try {
          this.executeHooks('onError', { error, event, data });
        } catch (e) {
          // Error handler failed, log to console
          console.error('[CrossHubRouter] Error handler also failed:', e);
        }
      }
    }
    
    return true;
  }

  /**
   * Track page view for analytics
   */
  trackPageView(url, metadata = {}) {
    if (typeof window === 'undefined') return;
    
    const event = {
      type: 'page_view',
      url,
      path: this.currentRoute?.path,
      params: this.currentRoute?.params,
      timestamp: Date.now(),
      referrer: document.referrer,
      ...metadata,
    };
    
    // Dispatch custom event for analytics
    window.dispatchEvent(new CustomEvent('router:pageview', { detail: event }));
    
    // Also call analytics if available
    if (window.satorAnalytics) {
      window.satorAnalytics.track(event);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, properties = {}) {
    if (typeof window === 'undefined') return;
    
    const event = {
      type: 'event',
      name: eventName,
      properties,
      timestamp: Date.now(),
      currentRoute: this.currentRoute,
    };
    
    window.dispatchEvent(new CustomEvent('router:event', { detail: event }));
    
    if (window.satorAnalytics) {
      window.satorAnalytics.track(event);
    }
  }

  /**
   * Generate shareable link
   */
  generateShareLink(route, options = {}) {
    const { includeState = false, expiresIn = null } = options;
    
    let url = this.resolveUrl(route);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Add deep link parameter
    const shareUrl = new URL(url, baseUrl);
    shareUrl.searchParams.set('dl', encodeURIComponent(url));
    
    if (includeState && this.currentRoute?.state) {
      shareUrl.searchParams.set('state', encodeURIComponent(JSON.stringify(this.currentRoute.state)));
    }
    
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn;
      shareUrl.searchParams.set('expires', expiresAt.toString());
    }
    
    return shareUrl.toString();
  }

  /**
   * Get hub for current route
   */
  getCurrentHub() {
    if (!this.currentRoute) return null;
    
    const path = this.currentRoute.path;
    
    for (const [key, hub] of Object.entries(HUBS)) {
      if (path.startsWith(hub.baseUrl)) {
        return hub;
      }
    }
    
    return null;
  }

  /**
   * Check if route matches pattern
   */
  matches(pattern) {
    if (!this.currentRoute) return false;
    
    const regex = this.routeToRegex(pattern);
    return regex.test(this.currentRoute.path);
  }
}

// Create singleton instance
export const router = new CrossHubRouter();

// Export as default
export default CrossHubRouter;
