/**
 * Breadcrumb Navigation System
 * Generates and renders breadcrumb trails for navigation
 */

import { HUBS, ROUTES } from '../router/CrossHubRouter.js';
import { UrlBuilder } from '../router/UrlHelpers.js';

/**
 * Breadcrumb item structure
 */
export class BreadcrumbItem {
  constructor(options = {}) {
    this.label = options.label || '';
    this.path = options.path || '';
    this.icon = options.icon || null;
    this.hub = options.hub || null;
    this.active = options.active || false;
    this.metadata = options.metadata || {};
  }
}

/**
 * Breadcrumb Generator
 */
export class BreadcrumbGenerator {
  constructor(options = {}) {
    this.maxItems = options.maxItems || 5;
    this.homeLabel = options.homeLabel || 'Home';
    this.homePath = options.homePath || '/';
    this.homeIcon = options.homeIcon || '🏠';
    this.separator = options.separator || '/';
    this.customLabels = new Map(options.customLabels || []);
    this.routePatterns = new Map();
  }

  /**
   * Register custom label for route pattern
   */
  registerLabel(pattern, label) {
    this.customLabels.set(pattern, label);
    return this;
  }

  /**
   * Register route pattern with metadata
   */
  registerPattern(pattern, config) {
    this.routePatterns.set(pattern, config);
    return this;
  }

  /**
   * Generate breadcrumbs from current path
   */
  generate(path = null, options = {}) {
    const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const { includeHome = true, params = {} } = options;
    
    const segments = this.parsePath(currentPath);
    const breadcrumbs = [];
    
    // Add home if requested
    if (includeHome) {
      breadcrumbs.push(new BreadcrumbItem({
        label: this.homeLabel,
        path: this.homePath,
        icon: this.homeIcon,
        active: segments.length === 0,
      }));
    }
    
    // Build breadcrumb trail
    let currentBuildPath = '';
    
    segments.forEach((segment, index) => {
      currentBuildPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      const item = this.createBreadcrumbItem({
        segment,
        path: currentBuildPath,
        fullPath: currentPath,
        index,
        isLast,
        params,
        segments,
      });
      
      breadcrumbs.push(item);
    });
    
    // Apply max items limit with ellipsis
    return this.applyLimit(breadcrumbs);
  }

  /**
   * Parse path into segments
   */
  parsePath(path) {
    return path
      .split('/')
      .filter(segment => segment.length > 0);
  }

  /**
   * Create breadcrumb item from segment
   */
  createBreadcrumbItem(context) {
    const { segment, path, isLast, params, segments, index } = context;
    
    // Check for custom label
    const customLabel = this.customLabels.get(path);
    if (customLabel) {
      return new BreadcrumbItem({
        label: typeof customLabel === 'function' 
          ? customLabel(context) 
          : customLabel,
        path,
        active: isLast,
        metadata: { custom: true },
      });
    }
    
    // Check if it's a hub
    const hub = this.identifyHub(segment, segments, index);
    if (hub) {
      return new BreadcrumbItem({
        label: hub.name,
        path: hub.baseUrl,
        icon: hub.icon,
        hub: hub.id,
        active: isLast,
      });
    }
    
    // Check if it's an ID parameter
    const isParam = /^[a-zA-Z0-9_-]+$/.test(segment) && 
                   (segment.length > 10 || /^\d+$/.test(segment));
    
    if (isParam) {
      const paramName = this.identifyParamName(segments, index);
      const label = params[paramName] || this.formatParamLabel(segment, segments[index - 1]);
      
      return new BreadcrumbItem({
        label,
        path,
        active: isLast,
        metadata: { 
          isParam: true, 
          paramName,
          rawValue: segment,
        },
      });
    }
    
    // Standard segment
    return new BreadcrumbItem({
      label: this.formatLabel(segment),
      path,
      active: isLast,
    });
  }

  /**
   * Identify hub from segment
   */
  identifyHub(segment, segments, index) {
    // Check if segment matches hub ID
    for (const hub of Object.values(HUBS)) {
      if (hub.id.toLowerCase() === segment.toLowerCase()) {
        return hub;
      }
    }
    
    // Check first segment for hub indicator
    if (index === 0) {
      return Object.values(HUBS).find(h => h.baseUrl === `/${segment}`);
    }
    
    return null;
  }

  /**
   * Identify parameter name from context
   */
  identifyParamName(segments, index) {
    const parent = segments[index - 1];
    
    const paramMap = {
      'matches': 'matchId',
      'players': 'playerId',
      'teams': 'teamId',
      'tournaments': 'tournamentId',
      'analytics': 'analyticsId',
      'predictions': 'predictionId',
      'play': 'gameId',
      'replay': 'matchId',
      'probability': 'probabilityId',
    };
    
    return paramMap[parent] || 'id';
  }

  /**
   * Format parameter label
   */
  formatParamLabel(value, parent) {
    // Truncate long IDs
    if (value.length > 15) {
      return `${value.slice(0, 8)}...${value.slice(-4)}`;
    }
    
    // Format based on parent context
    const parentLabels = {
      'matches': 'Match',
      'players': 'Player',
      'teams': 'Team',
      'tournaments': 'Tournament',
    };
    
    if (parentLabels[parent]) {
      return `${parentLabels[parent]} ${value}`;
    }
    
    return value;
  }

  /**
   * Format segment label
   */
  formatLabel(segment) {
    // Replace hyphens and underscores with spaces
    const spaced = segment.replace(/[-_]/g, ' ');
    
    // Capitalize each word
    return spaced
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Apply max items limit
   */
  applyLimit(breadcrumbs) {
    if (breadcrumbs.length <= this.maxItems) {
      return breadcrumbs;
    }
    
    // Keep first, last, and middle with ellipsis
    const first = breadcrumbs[0];
    const last = breadcrumbs[breadcrumbs.length - 1];
    
    // Calculate how many items to show in the middle
    const middleCount = this.maxItems - 2;
    const startIndex = Math.floor((breadcrumbs.length - 2 - middleCount) / 2) + 1;
    const middle = breadcrumbs.slice(startIndex, startIndex + middleCount);
    
    return [
      first,
      new BreadcrumbItem({
        label: '...',
        path: null,
        metadata: { isEllipsis: true },
      }),
      ...middle,
      new BreadcrumbItem({
        label: '...',
        path: null,
        metadata: { isEllipsis: true },
      }),
      last,
    ];
  }

  /**
   * Get route suggestions based on current path
   */
  getSuggestions(path = null) {
    const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const currentHub = this.identifyHubFromPath(currentPath);
    
    if (!currentHub) {
      return Object.values(HUBS).map(h => ({
        label: h.name,
        path: h.baseUrl,
        icon: h.icon,
        description: h.description,
      }));
    }
    
    // Return related hubs
    return Object.values(HUBS)
      .filter(h => h.id !== currentHub.id)
      .map(h => ({
        label: h.name,
        path: h.baseUrl,
        icon: h.icon,
        description: h.description,
      }));
  }

  /**
   * Identify hub from full path
   */
  identifyHubFromPath(path) {
    for (const hub of Object.values(HUBS)) {
      if (path.startsWith(hub.baseUrl)) {
        return hub;
      }
    }
    return null;
  }
}

/**
 * Breadcrumb Renderer (Vanilla JS)
 */
export class BreadcrumbRenderer {
  constructor(options = {}) {
    this.containerSelector = options.container || '[data-breadcrumbs]';
    this.generator = options.generator || new BreadcrumbGenerator();
    this.className = options.className || 'breadcrumbs';
    this.itemClassName = options.itemClassName || 'breadcrumb-item';
    this.activeClassName = options.activeClassName || 'active';
    this.separatorClassName = options.separatorClassName || 'breadcrumb-separator';
    this.onItemClick = options.onItemClick || null;
  }

  /**
   * Render breadcrumbs to DOM using safe DOM construction
   */
  render(path = null, container = null) {
    const targetContainer = container || document.querySelector(this.containerSelector);
    if (!targetContainer) {
      console.warn('Breadcrumb container not found');
      return;
    }
    
    const breadcrumbs = this.generator.generate(path);
    
    // Clear existing content
    targetContainer.innerHTML = '';
    
    // Build DOM safely
    const nav = this.buildDOM(breadcrumbs);
    targetContainer.appendChild(nav);
    
    return breadcrumbs;
  }

  /**
   * Build breadcrumb DOM element safely
   */
  buildDOM(breadcrumbs) {
    const nav = document.createElement('nav');
    nav.className = this.className;
    nav.setAttribute('aria-label', 'Breadcrumb');
    
    breadcrumbs.forEach((item, index) => {
      const isLast = index === breadcrumbs.length - 1;
      const element = this.createItemElement(item, isLast);
      nav.appendChild(element);
      
      // Add separator if not last
      if (!isLast) {
        const separator = document.createElement('span');
        separator.className = this.separatorClassName;
        separator.textContent = this.generator.separator;
        nav.appendChild(separator);
      }
    });
    
    return nav;
  }

  /**
   * Create individual breadcrumb item element
   */
  createItemElement(item, isLast) {
    const classes = [this.itemClassName];
    
    if (isLast) classes.push(this.activeClassName);
    if (item.hub) classes.push(`hub-${item.hub}`);
    if (item.metadata?.isParam) classes.push('is-param');
    if (item.metadata?.isEllipsis) classes.push('is-ellipsis');
    
    // Create appropriate element type
    let element;
    if (item.metadata?.isEllipsis) {
      element = document.createElement('span');
      element.textContent = item.label;
      element.dataset.ellipsis = 'true';
    } else if (isLast) {
      element = document.createElement('span');
      element.textContent = item.label;
      element.setAttribute('aria-current', 'page');
    } else {
      element = document.createElement('a');
      element.href = item.path;
      element.dataset.path = item.path;
      
      // Add click handler
      element.addEventListener('click', (e) => {
        if (this.onItemClick) {
          e.preventDefault();
          this.onItemClick(item.path);
        }
      });
    }
    
    element.className = classes.join(' ');
    
    // Add icon if present
    if (item.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'breadcrumb-icon';
      iconSpan.textContent = item.icon;
      element.appendChild(iconSpan);
    }
    
    // Add label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'breadcrumb-label';
    labelSpan.textContent = item.label;
    element.appendChild(labelSpan);
    
    return element;
  }

  /**
   * Update without full re-render
   */
  updateActive(path) {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;
    
    container.querySelectorAll(`.${this.itemClassName}`).forEach(item => {
      item.classList.remove(this.activeClassName);
      item.removeAttribute('aria-current');
    });
    
    const activeItem = container.querySelector(`[data-path="${path}"]`);
    if (activeItem) {
      activeItem.classList.add(this.activeClassName);
      activeItem.setAttribute('aria-current', 'page');
    }
  }
}

/**
 * React Breadcrumb Component (for use with React hubs)
 */
export const BreadcrumbReact = {
  /**
   * Generate component props
   */
  getProps(path, options = {}) {
    const generator = options.generator || new BreadcrumbGenerator();
    const items = generator.generate(path, options);
    
    return {
      items,
      separator: generator.separator,
      suggestions: generator.getSuggestions(path),
    };
  },
};

// Predefined breadcrumb configurations
export const BREADCRUMB_PRESETS = {
  // Minimal - just home and current
  minimal: new BreadcrumbGenerator({
    maxItems: 2,
    separator: '›',
  }),
  
  // Full - show all items
  full: new BreadcrumbGenerator({
    maxItems: 10,
    separator: '/',
  }),
  
  // Compact - with icons
  compact: new BreadcrumbGenerator({
    maxItems: 4,
    separator: '→',
  }),
};

// Register common custom labels
BREADCRUMB_PRESETS.full
  .registerLabel('/sator', 'SATOR Archive')
  .registerLabel('/rotas', 'ROTAS Analytics')
  .registerLabel('/info', 'Knowledge Hub')
  .registerLabel('/games', 'GAMES Center');

// Create singleton instances
export const breadcrumbGenerator = new BreadcrumbGenerator();
export const breadcrumbRenderer = new BreadcrumbRenderer();

// Default export
export default {
  BreadcrumbItem,
  BreadcrumbGenerator,
  BreadcrumbRenderer,
  BreadcrumbReact,
  breadcrumbGenerator,
  breadcrumbRenderer,
  BREADCRUMB_PRESETS,
};
