/**
 * Analytics Integration
 * Page view tracking, hub transition funnel, and conversion tracking
 */

import { HUBS } from '../router/CrossHubRouter.js';

/**
 * Analytics Event Types
 */
export const ANALYTICS_EVENTS = {
  // Navigation events
  PAGE_VIEW: 'page_view',
  HUB_TRANSITION: 'hub_transition',
  ROUTE_CHANGE: 'route_change',
  
  // Interaction events
  CLICK: 'click',
  SCROLL: 'scroll',
  HOVER: 'hover',
  SEARCH: 'search',
  FILTER: 'filter',
  
  // Content events
  CONTENT_VIEW: 'content_view',
  CONTENT_ENGAGEMENT: 'content_engagement',
  VIDEO_PLAY: 'video_play',
  DOWNLOAD: 'download',
  
  // Conversion events
  CONVERSION: 'conversion',
  SIGNUP: 'signup',
  UPGRADE: 'upgrade',
  PURCHASE: 'purchase',
  SUBSCRIBE: 'subscribe',
  
  // Error events
  ERROR: 'error',
  TIMEOUT: 'timeout',
  CRASH: 'crash',
};

/**
 * Analytics Manager
 */
export class AnalyticsManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.debug = options.debug || false;
    this.endpoint = options.endpoint || '/api/analytics';
    this.apiKey = options.apiKey || null;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 5000;
    this.sampleRate = options.sampleRate || 1.0;
    
    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
    this.visitorId = this.getVisitorId();
    this.currentHub = null;
    this.pageStartTime = Date.now();
    this.hubTransitions = [];
    this.conversionGoals = new Map();
    
    this.init();
  }

  init() {
    if (!this.enabled) return;
    
    // Set up automatic flush
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    
    // Track initial page view
    this.trackPageView();
    
    // Set up visibility change tracking
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.trackEvent(ANALYTICS_EVENTS.CONTENT_ENGAGEMENT, {
            engagementTime: Date.now() - this.pageStartTime,
          });
          this.flush();
        } else {
          this.pageStartTime = Date.now();
        }
      });
    }
    
    // Listen for router events
    if (typeof window !== 'undefined') {
      window.addEventListener('router:pageview', (e) => {
        this.trackPageView(e.detail);
      });
      
      window.addEventListener('router:event', (e) => {
        this.trackEvent(e.detail.name, e.detail.properties);
      });
    }
    
    this.log('Analytics initialized');
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create visitor ID
   */
  getVisitorId() {
    if (typeof window === 'undefined') return 'server';
    
    let visitorId = localStorage.getItem('sator_visitor_id');
    if (!visitorId) {
      visitorId = `vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sator_visitor_id', visitorId);
    }
    return visitorId;
  }

  /**
   * Track page view
   */
  trackPageView(metadata = {}) {
    if (!this.enabled) return;
    
    const url = typeof window !== 'undefined' ? window.location.href : metadata.url || '';
    const path = typeof window !== 'undefined' ? window.location.pathname : metadata.path || '';
    
    // Detect hub
    const hub = this.detectHub(path);
    
    // Track hub transition
    if (hub && hub.id !== this.currentHub?.id) {
      this.trackHubTransition(this.currentHub, hub);
      this.currentHub = hub;
    }
    
    const event = {
      type: ANALYTICS_EVENTS.PAGE_VIEW,
      url,
      path,
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      hub: hub?.id || null,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      timestamp: Date.now(),
      ...this.getContext(),
      ...metadata,
    };
    
    this.queue(event);
    this.log('Page view:', path);
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, properties = {}) {
    if (!this.enabled) return;
    
    // Apply sampling
    if (Math.random() > this.sampleRate) return;
    
    const event = {
      type: ANALYTICS_EVENTS[eventName.toUpperCase()] || eventName,
      name: eventName,
      properties,
      url: typeof window !== 'undefined' ? window.location.href : '',
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      hub: this.currentHub?.id || null,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      timestamp: Date.now(),
      ...this.getContext(),
    };
    
    this.queue(event);
    this.log('Event:', eventName, properties);
  }

  /**
   * Track hub transition (funnel analysis)
   */
  trackHubTransition(fromHub, toHub) {
    if (!this.enabled) return;
    
    const transition = {
      from: fromHub?.id || 'external',
      to: toHub?.id,
      timestamp: Date.now(),
      timeSpent: fromHub ? Date.now() - (fromHub.enterTime || this.pageStartTime) : 0,
    };
    
    this.hubTransitions.push(transition);
    
    const event = {
      type: ANALYTICS_EVENTS.HUB_TRANSITION,
      fromHub: transition.from,
      toHub: transition.to,
      transitionCount: this.hubTransitions.length,
      path: this.getTransitionPath(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      visitorId: this.visitorId,
    };
    
    this.queue(event);
    
    // Update hub entry time
    if (toHub) {
      toHub.enterTime = Date.now();
    }
    
    this.log('Hub transition:', transition.from, '->', transition.to);
  }

  /**
   * Track conversion
   */
  trackConversion(conversionType, value = null, metadata = {}) {
    if (!this.enabled) return;
    
    // Calculate attribution
    const attribution = this.calculateAttribution();
    
    const event = {
      type: ANALYTICS_EVENTS.CONVERSION,
      conversionType,
      value,
      currency: metadata.currency || 'USD',
      attribution,
      hubPath: this.getTransitionPath(),
      timeToConvert: Date.now() - this.pageStartTime,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ...metadata,
    };
    
    this.queue(event);
    
    // Track in conversion goals
    this.conversionGoals.set(conversionType, {
      achieved: true,
      timestamp: Date.now(),
      value,
    });
    
    this.log('Conversion:', conversionType, value);
  }

  /**
   * Register conversion goal
   */
  registerGoal(goalId, config = {}) {
    this.conversionGoals.set(goalId, {
      achieved: false,
      config,
      registeredAt: Date.now(),
    });
  }

  /**
   * Calculate attribution for conversion
   */
  calculateAttribution() {
    // Simple last-touch attribution
    const touchpoints = this.hubTransitions.map(t => ({
      hub: t.to,
      timestamp: t.timestamp,
      timeSpent: t.timeSpent,
    }));
    
    return {
      model: 'last_touch',
      touchpoints,
      touchpointCount: touchpoints.length,
      firstTouch: touchpoints[0]?.hub || 'direct',
      lastTouch: touchpoints[touchpoints.length - 1]?.hub || 'direct',
    };
  }

  /**
   * Get transition path string
   */
  getTransitionPath() {
    return this.hubTransitions.map(t => t.to).join(' > ');
  }

  /**
   * Detect current hub from path
   */
  detectHub(path) {
    for (const hub of Object.values(HUBS)) {
      if (path.startsWith(hub.baseUrl)) {
        return { ...hub, enterTime: Date.now() };
      }
    }
    return null;
  }

  /**
   * Get analytics context
   */
  getContext() {
    return {
      screenWidth: typeof window !== 'undefined' ? window.screen.width : null,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : null,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : null,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : null,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
    };
  }

  /**
   * Add event to queue
   */
  queue(event) {
    this.eventQueue.push(event);
    
    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to server
   */
  async flush() {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Try to send to analytics endpoint
      if (typeof window !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
        navigator.sendBeacon(this.endpoint, blob);
      } else {
        // Fallback to fetch
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'X-API-Key': this.apiKey }),
          },
          body: JSON.stringify({ events }),
          keepalive: true,
        });
      }
      
      this.log('Flushed', events.length, 'events');
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
      this.log('Failed to flush events:', error);
    }
  }

  /**
   * Get funnel data
   */
  getFunnelData() {
    return {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      startTime: this.pageStartTime,
      currentHub: this.currentHub?.id,
      transitions: this.hubTransitions,
      path: this.getTransitionPath(),
      conversionGoals: Object.fromEntries(this.conversionGoals),
    };
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      duration: Date.now() - this.pageStartTime,
      pageViews: this.eventQueue.filter(e => e.type === ANALYTICS_EVENTS.PAGE_VIEW).length,
      eventCount: this.eventQueue.length,
      hubTransitions: this.hubTransitions.length,
      conversionGoals: Array.from(this.conversionGoals.keys()),
    };
  }

  /**
   * Destroy manager
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }

  /**
   * Log debug message
   */
  log(...args) {
    if (this.debug) {
      console.log('[SATOR Analytics]', ...args);
    }
  }
}

/**
 * Hub Transition Funnel
 */
export class HubTransitionFunnel {
  constructor() {
    this.transitions = new Map();
    this.conversions = new Map();
  }

  /**
   * Record transition
   */
  record(from, to, metadata = {}) {
    const key = `${from || 'entry'}-${to}`;
    
    if (!this.transitions.has(key)) {
      this.transitions.set(key, {
        from,
        to,
        count: 0,
        timestamps: [],
        metadata: [],
      });
    }
    
    const transition = this.transitions.get(key);
    transition.count++;
    transition.timestamps.push(Date.now());
    transition.metadata.push(metadata);
  }

  /**
   * Record conversion
   */
  recordConversion(hubPath, conversionType, value) {
    if (!this.conversions.has(conversionType)) {
      this.conversions.set(conversionType, []);
    }
    
    this.conversions.get(conversionType).push({
      hubPath,
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Get funnel statistics
   */
  getStats() {
    const transitions = Array.from(this.transitions.values());
    const totalTransitions = transitions.reduce((sum, t) => sum + t.count, 0);
    
    return {
      totalTransitions,
      uniquePaths: transitions.length,
      topPaths: transitions
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      conversions: Object.fromEntries(this.conversions),
      conversionRate: this.calculateConversionRate(),
    };
  }

  /**
   * Calculate conversion rate
   */
  calculateConversionRate() {
    const totalConversions = Array.from(this.conversions.values())
      .reduce((sum, arr) => sum + arr.length, 0);
    const totalTransitions = Array.from(this.transitions.values())
      .reduce((sum, t) => sum + t.count, 0);
    
    return totalTransitions > 0 ? (totalConversions / totalTransitions) * 100 : 0;
  }
}

/**
 * Conversion Tracker
 */
export class ConversionTracker {
  constructor(analyticsManager) {
    this.analytics = analyticsManager;
    this.goals = new Map();
    this.attribution = new Map();
  }

  /**
   * Define conversion goal
   */
  defineGoal(goalId, config) {
    this.goals.set(goalId, {
      id: goalId,
      name: config.name,
      value: config.value || 0,
      conditions: config.conditions || [],
      achieved: false,
    });
  }

  /**
   * Check if goal conditions are met
   */
  checkGoal(goalId, context) {
    const goal = this.goals.get(goalId);
    if (!goal || goal.achieved) return false;
    
    const conditionsMet = goal.conditions.every(condition => {
      switch (condition.type) {
        case 'page_view':
          return context.path?.includes(condition.value);
        case 'hub_visit':
          return context.hub === condition.value;
        case 'event':
          return context.events?.includes(condition.value);
        case 'time_spent':
          return context.timeSpent >= condition.value;
        default:
          return false;
      }
    });
    
    if (conditionsMet) {
      goal.achieved = true;
      this.analytics.trackConversion(goalId, goal.value, {
        conditions: goal.conditions,
      });
      return true;
    }
    
    return false;
  }

  /**
   * Get goal progress
   */
  getProgress(goalId) {
    const goal = this.goals.get(goalId);
    if (!goal) return null;
    
    return {
      id: goal.id,
      name: goal.name,
      achieved: goal.achieved,
      value: goal.value,
    };
  }
}

// Create singleton instance
export const analyticsManager = new AnalyticsManager();
export const hubTransitionFunnel = new HubTransitionFunnel();
export const conversionTracker = new ConversionTracker(analyticsManager);

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.satorAnalytics = analyticsManager;
}

// Default export
export default {
  AnalyticsManager,
  HubTransitionFunnel,
  ConversionTracker,
  analyticsManager,
  hubTransitionFunnel,
  conversionTracker,
  ANALYTICS_EVENTS,
};
