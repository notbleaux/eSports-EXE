/**
 * URL Helper Utilities
 * Helper functions for URL manipulation and route resolution
 */

import { ROUTES, HUBS } from './CrossHubRouter.js';

/**
 * URL Builder - Construct URLs with parameters and query strings
 */
export class UrlBuilder {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Build URL from route name and parameters
   */
  build(routeName, params = {}, query = {}) {
    let path = this.getRoutePath(routeName);
    
    if (!path) {
      console.warn(`Route '${routeName}' not found`);
      path = `/${routeName}`;
    }
    
    // Replace path parameters
    path = this.replaceParams(path, params);
    
    // Add query string
    const queryString = this.buildQueryString(query);
    
    return this.baseUrl + path + queryString;
  }

  /**
   * Get route path by name
   */
  getRoutePath(routeName) {
    const searchRoutes = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === routeName) return value;
        if (typeof value === 'object') {
          const found = searchRoutes(value);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchRoutes(ROUTES);
  }

  /**
   * Replace path parameters
   */
  replaceParams(path, params) {
    return path.replace(/:([^/]+)/g, (match, key) => {
      if (params[key] !== undefined) {
        return encodeURIComponent(params[key]);
      }
      console.warn(`Missing parameter '${key}' for path '${path}'`);
      return match;
    });
  }

  /**
   * Build query string from object
   */
  buildQueryString(query) {
    const pairs = Object.entries(query)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      });
    
    return pairs.length > 0 ? `?${pairs.join('&')}` : '';
  }

  /**
   * Parse URL into components
   */
  parse(url) {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    
    return {
      href: parsed.href,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      query: this.parseQueryString(parsed.search),
    };
  }

  /**
   * Parse query string
   */
  parseQueryString(search) {
    const query = {};
    if (!search) return query;
    
    const params = new URLSearchParams(search);
    for (const [key, value] of params) {
      // Handle array parameters
      if (query[key]) {
        if (!Array.isArray(query[key])) {
          query[key] = [query[key]];
        }
        query[key].push(value);
      } else {
        query[key] = value;
      }
    }
    
    return query;
  }
}

/**
 * Hub URL Helpers
 */
export const HubUrls = {
  /**
   * Get hub by ID
   */
  getHub(hubId) {
    return HUBS[hubId.toUpperCase()] || null;
  },

  /**
   * Get all hub URLs
   */
  getAllHubs() {
    return Object.values(HUBS);
  },

  /**
   * Get hub URL by ID
   */
  getHubUrl(hubId) {
    const hub = this.getHub(hubId);
    return hub ? hub.baseUrl : null;
  },

  /**
   * Get hub file path for static navigation
   */
  getHubFilePath(hubId) {
    const hub = this.getHub(hubId);
    return hub ? hub.filePath : null;
  },

  /**
   * Get related hubs (for cross-navigation)
   */
  getRelatedHubs(currentHubId) {
    return Object.values(HUBS).filter(hub => hub.id !== currentHubId);
  },

  /**
   * Build cross-hub navigation URL
   */
  buildCrossHubUrl(fromHubId, toHubId, options = {}) {
    const { preserveParams = true, returnPath = null } = options;
    const toHub = this.getHub(toHubId);
    
    if (!toHub) return null;
    
    let url = toHub.filePath;
    
    if (preserveParams && typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      const hubParam = currentParams.get('hub');
      
      if (!hubParam) {
        url += (url.includes('?') ? '&' : '?') + `hub=${fromHubId}`;
      }
    }
    
    if (returnPath) {
      url += (url.includes('?') ? '&' : '?') + `return=${encodeURIComponent(returnPath)}`;
    }
    
    return url;
  },
};

/**
 * Match URL Helpers
 */
export const MatchUrls = {
  /**
   * Build match detail URL
   */
  detail(matchId, query = {}) {
    const builder = new UrlBuilder();
    return builder.build('MATCH_DETAIL', { id: matchId }, query);
  },

  /**
   * Build match list URL with filters
   */
  list(filters = {}) {
    const { page = 1, limit = 20, status, team, tournament, ...rest } = filters;
    
    const query = {
      page: page.toString(),
      limit: limit.toString(),
      ...rest,
    };
    
    if (status) query.status = status;
    if (team) query.team = team;
    if (tournament) query.tournament = tournament;
    
    const builder = new UrlBuilder();
    return builder.build('MATCHES', {}, query);
  },

  /**
   * Build live matches URL
   */
  live() {
    const builder = new UrlBuilder();
    return builder.build('LIVE');
  },

  /**
   * Build match replay URL
   */
  replay(matchId, options = {}) {
    const { timestamp, perspective } = options;
    const query = {};
    
    if (timestamp) query.t = timestamp;
    if (perspective) query.pov = perspective;
    
    const builder = new UrlBuilder();
    return builder.build('REPLAY', { id: matchId }, query);
  },
};

/**
 * Analytics URL Helpers
 */
export const AnalyticsUrls = {
  /**
   * Build analytics dashboard URL
   */
  dashboard(analyticsId, options = {}) {
    const { view = 'overview', compareWith } = options;
    const query = { view };
    
    if (compareWith) query.compare = compareWith;
    
    const builder = new UrlBuilder();
    return builder.build('ANALYTICS_DETAIL', { id: analyticsId }, query);
  },

  /**
   * Build prediction URL
   */
  prediction(predictionId, options = {}) {
    const { confidence = 0.95, simulations = 10000 } = options;
    const query = { confidence, simulations };
    
    const builder = new UrlBuilder();
    return builder.build('PROBABILITY', { id: predictionId }, query);
  },

  /**
   * Build formula library URL
   */
  formulas(category = null) {
    const query = category ? { category } : {};
    
    const builder = new UrlBuilder();
    return builder.build('FORMULAS', {}, query);
  },
};

/**
 * Team URL Helpers
 */
export const TeamUrls = {
  /**
   * Build team detail URL
   */
  detail(teamId, options = {}) {
    const { tab = 'overview', season } = options;
    const query = {};
    
    if (tab) query.tab = tab;
    if (season) query.season = season;
    
    const builder = new UrlBuilder();
    return builder.build('TEAM_DETAIL', { id: teamId }, query);
  },

  /**
   * Build team list URL
   */
  list(filters = {}) {
    const { region, tier, page = 1 } = filters;
    const query = { page: page.toString() };
    
    if (region) query.region = region;
    if (tier) query.tier = tier;
    
    const builder = new UrlBuilder();
    return builder.build('TEAMS', {}, query);
  },
};

/**
 * Tournament URL Helpers
 */
export const TournamentUrls = {
  /**
   * Build tournament detail URL
   */
  detail(tournamentId, options = {}) {
    const { stage, match } = options;
    const query = {};
    
    if (stage) query.stage = stage;
    if (match) query.match = match;
    
    const builder = new UrlBuilder();
    return builder.build('TOURNAMENT_DETAIL', { id: tournamentId }, query);
  },
};

/**
 * Download URL Helpers
 */
export const DownloadUrls = {
  /**
   * Build download URL with options
   */
  download(options = {}) {
    const { platform, version, beta = false } = options;
    const query = {};
    
    if (platform) query.platform = platform;
    if (version) query.version = version;
    if (beta) query.beta = 'true';
    
    const builder = new UrlBuilder();
    return builder.build('DOWNLOAD', {}, query);
  },

  /**
   * Build simulator URL
   */
  simulator(mode = 'standard') {
    const builder = new UrlBuilder();
    return builder.build('SIMULATOR', {}, { mode });
  },
};

/**
 * Utility Functions
 */
export const UrlUtils = {
  /**
   * Check if URL is external
   */
  isExternal(url) {
    if (typeof window === 'undefined') return false;
    
    const parsed = new URL(url, window.location.origin);
    return parsed.origin !== window.location.origin;
  },

  /**
   * Check if URL is absolute
   */
  isAbsolute(url) {
    return /^https?:\/\//.test(url);
  },

  /**
   * Normalize URL path
   */
  normalizePath(path) {
    return path
      .replace(/\/+/g, '/')  // Remove duplicate slashes
      .replace(/\/$/, '')    // Remove trailing slash
      || '/';
  },

  /**
   * Join URL segments
   */
  join(...segments) {
    return this.normalizePath(segments.join('/'));
  },

  /**
   * Add query parameter to URL
   */
  addQueryParam(url, key, value) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  },

  /**
   * Remove query parameter from URL
   */
  removeQueryParam(url, key) {
    const [base, search] = url.split('?');
    if (!search) return url;
    
    const params = new URLSearchParams(search);
    params.delete(key);
    
    const newSearch = params.toString();
    return newSearch ? `${base}?${newSearch}` : base;
  },

  /**
   * Get current URL without query string
   */
  getCurrentPath() {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  },

  /**
   * Create slug from string
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove non-word chars
      .replace(/\-\-+/g, '-');        // Replace multiple - with single -
  },

  /**
   * Parse hash fragment
   */
  parseHash(hash) {
    if (!hash) return null;
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    
    const [id, ...queryParts] = cleanHash.split('?');
    const query = queryParts.length > 0 
      ? new UrlBuilder().parseQueryString(queryParts.join('?'))
      : {};
    
    return { id, query };
  },
};

// Create singleton instance
export const urlBuilder = new UrlBuilder();

// Default export
export default {
  UrlBuilder,
  HubUrls,
  MatchUrls,
  AnalyticsUrls,
  TeamUrls,
  TournamentUrls,
  DownloadUrls,
  UrlUtils,
  urlBuilder,
};
