[Ver007.000]
/**
 * Breadcrumb Component
 * ====================
 * Dynamic breadcrumb generation with support for nested navigation.
 * Generates breadcrumbs based on current URL path.
 * 
 * @module components/breadcrumb
 * @version 1.0.0
 */

import { createElement } from '../utils/dom.js';

/**
 * HUB configuration for breadcrumb mapping
 */
const HUB_CONFIG = {
    'stat-ref': {
        name: 'Statistical Reference',
        shortName: 'Stat Ref',
        path: '/hubs/stat-ref/',
        color: '#00D4FF'
    },
    'analytics': {
        name: 'Advanced Analytics',
        shortName: 'Analytics',
        path: '/hubs/analytics/',
        color: '#FFD700'
    },
    'esports': {
        name: 'eSports',
        shortName: 'eSports',
        path: '/hubs/esports/',
        color: '#FF4655'
    },
    'fantasy': {
        name: 'Fantasy eSports',
        shortName: 'Fantasy',
        path: '/hubs/fantasy/',
        color: '#00FF88'
    }
};

/**
 * Section name mappings for URL segments
 */
const SECTION_MAP = {
    'players': 'Players',
    'teams': 'Teams',
    'matches': 'Matches',
    'leaders': 'Leaderboards',
    'compare': 'Compare',
    'layers': 'Layers',
    'sator-square': 'SATOR Square',
    'performance': 'Performance',
    'temporal': 'Temporal',
    'role-based': 'Role-Based',
    'investment': 'Investment',
    'custom': 'Custom',
    'builder': 'Builder',
    'my-views': 'My Views',
    'news': 'News',
    'results': 'Results',
    'schedule': 'Schedule',
    'ladders': 'Ladders',
    'media': 'Media',
    'forums': 'Forums',
    'trust': 'Trust Factor',
    'leagues': 'Leagues',
    'leaderboards': 'Leaderboards',
    'my-team': 'My Team',
    'membership': 'Membership',
    'game': 'Game',
    'download': 'Download',
    'help': 'Help Center'
};

/**
 * Default breadcrumb options
 */
const DEFAULT_OPTIONS = {
    homeLabel: 'Home',
    homeHref: '/',
    separator: 'chevron',
    maxItems: 4,
    collapseMiddle: true,
    className: ''
};

/**
 * Creates a breadcrumb component
 * @param {Object} options - Breadcrumb configuration
 * @param {string} [options.homeLabel='Home'] - Label for home link
 * @param {string} [options.homeHref='/'] - URL for home link
 * @param {string} [options.separator='chevron'] - Separator type: 'chevron', 'slash', 'arrow'
 * @param {number} [options.maxItems=4] - Maximum items to show before collapsing
 * @param {boolean} [options.collapseMiddle=true] - Whether to collapse middle items when exceeding max
 * @param {string} [options.className=''] - Additional CSS classes
 * @returns {HTMLElement} Breadcrumb element
 * 
 * @example
 * const breadcrumb = createBreadcrumb({
 *   homeLabel: 'SATOR',
 *   separator: 'chevron'
 * });
 * document.querySelector('.breadcrumb-container').appendChild(breadcrumb);
 */
export function createBreadcrumb(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // Create nav container
    const nav = createElement('nav', {
        classes: [
            'flex',
            'items-center',
            'text-sm',
            'text-white/50',
            config.className
        ],
        attrs: {
            'aria-label': 'Breadcrumb'
        }
    });
    
    // Create ordered list
    const list = createElement('ol', {
        classes: ['flex', 'items-center', 'flex-wrap', 'gap-2']
    });
    nav.appendChild(list);
    
    // Generate breadcrumb items from URL
    const items = generateBreadcrumbItems(config);
    
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const li = createBreadcrumbItem(item, isLast, config, index);
        list.appendChild(li);
        
        // Add separator if not last
        if (!isLast) {
            const separator = createSeparator(config.separator);
            list.appendChild(separator);
        }
    });
    
    return nav;
}

/**
 * Generates breadcrumb items from current URL path
 * @param {Object} config - Breadcrumb config
 * @returns {Array} Array of breadcrumb items
 */
function generateBreadcrumbItems(config) {
    const items = [{
        label: config.homeLabel,
        href: config.homeHref,
        isHome: true
    }];
    
    const path = window.location.pathname;
    const segments = path.split('/').filter(s => s && s !== 'hubs' && s !== 'website');
    
    let currentPath = '';
    
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        // Check if it's a HUB
        if (HUB_CONFIG[segment]) {
            items.push({
                label: HUB_CONFIG[segment].name,
                href: HUB_CONFIG[segment].path,
                isHub: true,
                hubColor: HUB_CONFIG[segment].color
            });
        } else if (SECTION_MAP[segment]) {
            // Check if it's a known section
            items.push({
                label: SECTION_MAP[segment],
                href: currentPath + '/',
                isSection: true
            });
        } else if (index === segments.length - 1) {
            // Last segment - current page
            const pageName = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            items.push({
                label: pageName,
                href: null, // Current page - no link
                isCurrent: true
            });
        }
    });
    
    // Apply collapsing if needed
    if (config.collapseMiddle && items.length > config.maxItems) {
        return collapseMiddleItems(items, config.maxItems);
    }
    
    return items;
}

/**
 * Collapses middle breadcrumb items
 * @param {Array} items - All breadcrumb items
 * @param {number} maxItems - Maximum items to show
 * @returns {Array} Collapsed items
 */
function collapseMiddleItems(items, maxItems) {
    if (items.length <= maxItems) return items;
    
    const visibleItems = [items[0]]; // Always show home
    
    // Add ellipsis if needed
    if (items.length > maxItems) {
        visibleItems.push({
            label: '...',
            href: null,
            isEllipsis: true
        });
    }
    
    // Show last (maxItems - 2) items
    const remainingSlots = maxItems - 2;
    const startIndex = items.length - remainingSlots;
    
    for (let i = startIndex; i < items.length; i++) {
        visibleItems.push(items[i]);
    }
    
    return visibleItems;
}

/**
 * Creates a single breadcrumb item
 * @param {Object} item - Breadcrumb item data
 * @param {boolean} isLast - Whether this is the last item
 * @param {Object} config - Breadcrumb config
 * @param {number} index - Item index
 * @returns {HTMLElement} List item element
 */
function createBreadcrumbItem(item, isLast, config, index) {
    const li = createElement('li', {
        classes: ['flex', 'items-center']
    });
    
    // Determine styling based on item type
    const classes = ['transition-colors'];
    
    if (isLast) {
        classes.push('text-white', 'font-medium');
    } else if (item.isHub && item.hubColor) {
        classes.push('hover:text-white');
    } else {
        classes.push('hover:text-white/80');
    }
    
    if (item.href && !isLast) {
        const link = createElement('a', {
            classes: classes,
            attrs: {
                href: item.href
            },
            text: item.label
        });
        
        // Add color indicator for HUBs
        if (item.isHub && item.hubColor) {
            link.innerHTML = `
                <span class="inline-flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${item.hubColor}"></span>
                    ${item.label}
                </span>
            `;
        }
        
        li.appendChild(link);
    } else {
        const span = createElement('span', {
            classes: isLast ? ['text-white', 'font-medium'] : ['text-white/50'],
            text: item.label
        });
        
        // Add color indicator for HUBs even in non-linked state
        if (item.isHub && item.hubColor) {
            span.innerHTML = `
                <span class="inline-flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${item.hubColor}"></span>
                    ${item.label}
                </span>
            `;
        }
        
        // Add aria-current for accessibility
        if (isLast) {
            span.setAttribute('aria-current', 'page');
        }
        
        li.appendChild(span);
    }
    
    return li;
}

/**
 * Creates a separator element
 * @param {string} type - Separator type
 * @returns {HTMLElement} Separator element
 */
function createSeparator(type) {
    const li = createElement('li', {
        classes: ['text-white/30', 'flex', 'items-center'],
        attrs: {
            'aria-hidden': 'true'
        }
    });
    
    let svg = '';
    
    switch (type) {
        case 'slash':
            svg = '<span class="text-white/30">/</span>';
            break;
        case 'arrow':
            svg = `
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            `;
            break;
        case 'chevron':
        default:
            svg = `
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 5l7 7-7 7" />
                </svg>
            `;
            break;
    }
    
    li.innerHTML = svg;
    return li;
}

/**
 * Updates breadcrumb for dynamic content
 * @param {HTMLElement} breadcrumb - Breadcrumb element
 * @param {Array} customItems - Custom items to display
 */
export function updateBreadcrumb(breadcrumb, customItems) {
    if (!breadcrumb) return;
    
    const list = breadcrumb.querySelector('ol');
    if (!list) return;
    
    // Clear existing
    list.innerHTML = '';
    
    // Add custom items
    customItems.forEach((item, index) => {
        const isLast = index === customItems.length - 1;
        const li = createBreadcrumbItem(item, isLast, DEFAULT_OPTIONS, index);
        list.appendChild(li);
        
        if (!isLast) {
            const separator = createSeparator(DEFAULT_OPTIONS.separator);
            list.appendChild(separator);
        }
    });
}

/**
 * Gets current HUB from URL for breadcrumb context
 * @returns {Object|null} HUB configuration or null
 */
export function getCurrentHubForBreadcrumb() {
    const path = window.location.pathname;
    
    for (const [key, config] of Object.entries(HUB_CONFIG)) {
        if (path.includes(key)) {
            return config;
        }
    }
    
    return null;
}

// Default export
export default {
    createBreadcrumb,
    updateBreadcrumb,
    getCurrentHubForBreadcrumb
};
