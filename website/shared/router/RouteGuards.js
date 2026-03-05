/**
 * Route Guards
 * Authentication and authorization guards for tiered content
 */

import { router } from './CrossHubRouter.js';
import { HUBS } from './CrossHubRouter.js';

/**
 * Permission levels for tiered content
 */
export const PERMISSIONS = {
  // Access levels
  PUBLIC: 'public',
  REGISTERED: 'registered',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
  ADMIN: 'admin',
  
  // Content tiers
  TIER_1: 'tier_1',  // Basic stats
  TIER_2: 'tier_2',  // Advanced analytics
  TIER_3: 'tier_3',  // Premium predictions
  TIER_4: 'tier_4',  // Pro tools
};

/**
 * Route metadata with permission requirements
 */
export const PROTECTED_ROUTES = {
  // SATOR routes
  '/sator/matches/:id/replay': { 
    minPermission: PERMISSIONS.REGISTERED,
    check: (user) => user?.hasReplayAccess && user.tier >= 1 
  },
  '/sator/archive/premium': { 
    minPermission: PERMISSIONS.PREMIUM,
    tier: 3 
  },
  '/sator/live/hd': { 
    minPermission: PERMISSIONS.REGISTERED,
    check: (user) => user?.subscription?.includes('hd') 
  },
  
  // ROTAS routes
  '/rotas/analytics/:id': { 
    minPermission: PERMISSIONS.PUBLIC,
    tier: 1 
  },
  '/rotas/analytics/:id/advanced': { 
    minPermission: PERMISSIONS.REGISTERED,
    tier: 2 
  },
  '/rotas/predictions': { 
    minPermission: PERMISSIONS.REGISTERED,
    tier: 2 
  },
  '/rotas/probability/:id/monte-carlo': { 
    minPermission: PERMISSIONS.PREMIUM,
    tier: 3,
    check: (user) => user?.credits > 0 
  },
  '/rotas/formulas/custom': { 
    minPermission: PERMISSIONS.PREMIUM,
    tier: 3 
  },
  
  // INFO routes
  '/info/guides/premium': { 
    minPermission: PERMISSIONS.REGISTERED,
    tier: 2 
  },
  '/info/faq/pro': { 
    minPermission: PERMISSIONS.PREMIUM,
    tier: 3 
  },
  
  // GAMES routes
  '/games/download/beta': { 
    minPermission: PERMISSIONS.VERIFIED,
    tier: 2,
    check: (user) => user?.betaAccess === true 
  },
  '/games/simulator/pro': { 
    minPermission: PERMISSIONS.PREMIUM,
    tier: 3 
  },
  '/games/replay/:id/export': { 
    minPermission: PERMISSIONS.PREMIUM,
    tier: 3,
    check: (user) => user?.exportCredits > 0 
  },
};

/**
 * Route Guard Class
 */
export class RouteGuard {
  constructor(options = {}) {
    this.authProvider = options.authProvider || null;
    this.fallbackRoute = options.fallbackRoute || '/login';
    this.upgradeRoute = options.upgradeRoute || '/upgrade';
    this.verificationRoute = options.verificationRoute || '/verify';
    this.onAccessDenied = options.onAccessDenied || null;
    this.cache = new Map();
    this.cacheExpiry = options.cacheExpiry || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if user has required permission
   */
  async checkPermission(route, user = null) {
    // Get route protection config
    const config = this.getRouteConfig(route);
    
    if (!config) {
      return { allowed: true }; // Public route
    }
    
    // Get current user if not provided
    const currentUser = user || await this.getCurrentUser();
    
    // Check authentication
    if (!currentUser && config.minPermission !== PERMISSIONS.PUBLIC) {
      return {
        allowed: false,
        reason: 'NOT_AUTHENTICATED',
        redirect: this.fallbackRoute,
        message: 'Please sign in to access this content',
      };
    }
    
    // Check permission level
    if (config.minPermission) {
      const hasPermission = this.checkPermissionLevel(
        currentUser?.permissionLevel || PERMISSIONS.PUBLIC,
        config.minPermission
      );
      
      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'INSUFFICIENT_PERMISSIONS',
          redirect: this.upgradeRoute,
          message: 'Upgrade your account to access this feature',
          required: config.minPermission,
          current: currentUser?.permissionLevel,
        };
      }
    }
    
    // Check tier requirement
    if (config.tier !== undefined) {
      const userTier = currentUser?.tier || 0;
      
      if (userTier < config.tier) {
        return {
          allowed: false,
          reason: 'TIER_TOO_LOW',
          redirect: this.upgradeRoute,
          message: `Tier ${config.tier} required. You are currently Tier ${userTier}`,
          required: config.tier,
          current: userTier,
        };
      }
    }
    
    // Check verification status
    if (config.minPermission === PERMISSIONS.VERIFIED && !currentUser?.verified) {
      return {
        allowed: false,
        reason: 'NOT_VERIFIED',
        redirect: this.verificationRoute,
        message: 'Please verify your account to access this content',
      };
    }
    
    // Run custom check if provided
    if (config.check) {
      try {
        const checkResult = await config.check(currentUser);
        
        if (!checkResult) {
          return {
            allowed: false,
            reason: 'CUSTOM_CHECK_FAILED',
            message: 'You do not meet the requirements for this content',
          };
        }
      } catch (error) {
        console.error('Route guard custom check failed:', error);
        return {
          allowed: false,
          reason: 'CHECK_ERROR',
          message: 'Unable to verify access. Please try again.',
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Get route configuration
   */
  getRouteConfig(route) {
    // Exact match
    if (PROTECTED_ROUTES[route]) {
      return PROTECTED_ROUTES[route];
    }
    
    // Pattern match
    for (const [pattern, config] of Object.entries(PROTECTED_ROUTES)) {
      if (this.routeMatches(route, pattern)) {
        return config;
      }
    }
    
    return null;
  }

  /**
   * Check if route matches pattern
   */
  routeMatches(route, pattern) {
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(route);
  }

  /**
   * Check permission level hierarchy
   */
  checkPermissionLevel(userLevel, requiredLevel) {
    const hierarchy = {
      [PERMISSIONS.PUBLIC]: 0,
      [PERMISSIONS.REGISTERED]: 1,
      [PERMISSIONS.VERIFIED]: 2,
      [PERMISSIONS.PREMIUM]: 3,
      [PERMISSIONS.ADMIN]: 4,
    };
    
    const userRank = hierarchy[userLevel] ?? 0;
    const requiredRank = hierarchy[requiredLevel] ?? 0;
    
    return userRank >= requiredRank;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    // Check cache first
    const cached = this.cache.get('currentUser');
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    // Use auth provider if available
    if (this.authProvider) {
      try {
        const user = await this.authProvider.getUser();
        this.cache.set('currentUser', { data: user, timestamp: Date.now() });
        return user;
      } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
      }
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sator_user');
        if (stored) {
          const user = JSON.parse(stored);
          this.cache.set('currentUser', { data: user, timestamp: Date.now() });
          return user;
        }
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }
    
    return null;
  }

  /**
   * Guard navigation to a route
   */
  async guard(route, options = {}) {
    const result = await this.checkPermission(route);
    
    if (!result.allowed) {
      // Call custom handler if provided
      if (this.onAccessDenied) {
        this.onAccessDenied(result, route);
      }
      
      // Track denied access
      this.trackAccessDenied(route, result.reason);
      
      // Redirect if specified
      if (result.redirect && !options.silent) {
        if (typeof window !== 'undefined') {
          const returnUrl = encodeURIComponent(window.location.href);
          window.location.href = `${result.redirect}?return=${returnUrl}`;
        }
      }
      
      return result;
    }
    
    return result;
  }

  /**
   * Track access denied events
   */
  trackAccessDenied(route, reason) {
    if (typeof window !== 'undefined' && window.satorAnalytics) {
      window.satorAnalytics.track({
        type: 'access_denied',
        route,
        reason,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Clear user cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Register with router
   */
  registerWithRouter(routerInstance) {
    routerInstance.on('beforeNavigate', async ({ to }) => {
      const result = await this.guard(to, { silent: true });
      return result.allowed;
    });
    
    return this;
  }

  /**
   * Create middleware for specific route
   */
  createMiddleware(config = {}) {
    return async (context) => {
      const route = context.route || context.path;
      const result = await this.checkPermission(route);
      
      if (!result.allowed) {
        context.blocked = true;
        context.blockReason = result;
        
        if (config.onBlock) {
          config.onBlock(result, context);
        }
        
        return false;
      }
      
      return true;
    };
  }
}

/**
 * Content Tier Manager
 */
export class ContentTierManager {
  constructor() {
    this.tiers = new Map();
    this.features = new Map();
  }

  /**
   * Register content tier
   */
  registerTier(tierId, config) {
    this.tiers.set(tierId, {
      id: tierId,
      name: config.name,
      level: config.level,
      features: config.features || [],
      price: config.price,
      ...config,
    });
  }

  /**
   * Register feature for tier
   */
  registerFeature(featureId, config) {
    this.features.set(featureId, {
      id: featureId,
      name: config.name,
      minTier: config.minTier,
      description: config.description,
      ...config,
    });
  }

  /**
   * Check if user has access to feature
   */
  hasFeatureAccess(userTier, featureId) {
    const feature = this.features.get(featureId);
    if (!feature) return false;
    
    return userTier >= feature.minTier;
  }

  /**
   * Get features for tier
   */
  getFeaturesForTier(tierLevel) {
    return Array.from(this.features.values())
      .filter(feature => feature.minTier <= tierLevel);
  }

  /**
   * Get tier by level
   */
  getTier(level) {
    return Array.from(this.tiers.values())
      .find(tier => tier.level === level);
  }
}

/**
 * Predefined tier configurations
 */
export const TIER_CONFIG = {
  FREE: {
    id: 'free',
    name: 'Free',
    level: 0,
    price: 0,
    features: [
      'basic_stats',
      'match_history',
      'public_guides',
    ],
  },
  REGISTERED: {
    id: 'registered',
    name: 'Registered',
    level: 1,
    price: 0,
    features: [
      'basic_stats',
      'match_history',
      'public_guides',
      'watch_replays',
      'hd_streams',
      'basic_predictions',
    ],
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    level: 3,
    price: 9.99,
    features: [
      'basic_stats',
      'match_history',
      'public_guides',
      'watch_replays',
      'hd_streams',
      'basic_predictions',
      'advanced_analytics',
      'monte_carlo',
      'custom_formulas',
      'export_data',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    level: 4,
    price: 29.99,
    features: [
      'all_premium_features',
      'api_access',
      'priority_support',
      'white_label',
      'custom_integrations',
    ],
  },
};

// Create singleton instances
export const routeGuard = new RouteGuard();
export const tierManager = new ContentTierManager();

// Register default tiers
Object.values(TIER_CONFIG).forEach(tier => {
  tierManager.registerTier(tier.id, tier);
});

// Default export
export default {
  RouteGuard,
  ContentTierManager,
  routeGuard,
  tierManager,
  PERMISSIONS,
  PROTECTED_ROUTES,
  TIER_CONFIG,
};
