[Ver001.000]
/**
 * Navigation Initialization
 * =========================
 * Initializes all navigation components across the SATOR website.
 * Handles HUB switcher, mobile menu, search, and breadcrumbs.
 * 
 * @module navigation-init
 * @version 1.0.0
 */

import { initRouter, highlightActiveLinks } from './router.js';
import { initTransitions } from './transitions.js';

/**
 * HUB configuration
 */
const HUBS = {
    statref: {
        name: 'Statistical Reference',
        shortName: 'Stat Ref',
        path: '/hubs/stat-ref/',
        color: '#00D4FF',
        icon: 'chart'
    },
    analytics: {
        name: 'Advanced Analytics',
        shortName: 'Analytics',
        path: '/hubs/analytics/',
        color: '#FFD700',
        icon: 'analytics'
    },
    esports: {
        name: 'eSports',
        shortName: 'eSports',
        path: '/hubs/esports/',
        color: '#FF4655',
        icon: 'trophy'
    },
    fantasy: {
        name: 'Fantasy eSports',
        shortName: 'Fantasy',
        path: '/hubs/fantasy/',
        color: '#00FF88',
        icon: 'users'
    }
};

/**
 * Initialize all navigation components
 */
export function initNavigation() {
    // Initialize transitions
    initTransitions();
    
    // Initialize router
    initRouter();
    
    // Initialize HUB switcher
    initHubSwitcher();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize search
    initSearch();
    
    // Initialize breadcrumbs if present
    initBreadcrumbs();
    
    // Initialize HUB banner
    initHubBanner();
    
    // Add scroll handler for header
    initScrollHandler();
    
    // Highlight active links
    highlightActiveLinks();
}

/**
 * Initialize HUB switcher dropdown
 */
function initHubSwitcher() {
    const switcher = document.querySelector('[data-hub-switcher]');
    if (!switcher) return;
    
    const btn = switcher.querySelector('[data-hub-dropdown-btn]');
    const menu = switcher.querySelector('[data-hub-dropdown-menu]');
    
    if (!btn || !menu) return;
    
    let isOpen = false;
    
    const toggle = () => {
        isOpen = !isOpen;
        btn.setAttribute('aria-expanded', isOpen.toString());
        menu.classList.toggle('hub-switcher__dropdown--open', isOpen);
    };
    
    const close = () => {
        isOpen = false;
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('hub-switcher__dropdown--open');
    };
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (isOpen && !switcher.contains(e.target)) {
            close();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (isOpen && e.key === 'Escape') {
            close();
            btn.focus();
        }
    });
    
    // Handle HUB option clicks
    menu.querySelectorAll('[data-hub-option]').forEach(option => {
        option.addEventListener('click', () => {
            const hub = option.getAttribute('data-hub-option');
            updateHubIndicator(hub);
            close();
        });
    });
    
    // Set initial state based on URL
    const currentHub = detectCurrentHub();
    if (currentHub) {
        updateHubIndicator(currentHub);
    }
}

/**
 * Updates the HUB indicator in the switcher
 * @param {string} hubKey - HUB identifier
 */
function updateHubIndicator(hubKey) {
    const hub = HUBS[hubKey];
    if (!hub) return;
    
    const indicator = document.querySelector('[data-hub-indicator]');
    const label = document.querySelector('[data-hub-label]');
    
    if (indicator) {
        indicator.style.backgroundColor = hub.color;
    }
    
    if (label) {
        label.textContent = hub.shortName;
    }
    
    // Update active state in dropdown
    document.querySelectorAll('[data-hub-option]').forEach(option => {
        const isActive = option.getAttribute('data-hub-option') === hubKey;
        option.classList.toggle('hub-switcher__item--active', isActive);
    });
}

/**
 * Detects current HUB from URL
 * @returns {string|null}
 */
function detectCurrentHub() {
    const path = window.location.pathname;
    
    if (path.includes('stat-ref') || path.includes('statref')) return 'statref';
    if (path.includes('analytics')) return 'analytics';
    if (path.includes('esports')) return 'esports';
    if (path.includes('fantasy')) return 'fantasy';
    
    return null;
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const toggle = document.querySelector('[data-mobile-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    
    if (!toggle || !menu) return;
    
    let isOpen = false;
    
    const open = () => {
        isOpen = true;
        toggle.setAttribute('aria-expanded', 'true');
        menu.classList.add('mobile-menu--open');
        document.body.style.overflow = 'hidden';
    };
    
    const close = () => {
        isOpen = false;
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('mobile-menu--open');
        document.body.style.overflow = '';
    };
    
    toggle.addEventListener('click', () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (isOpen && e.key === 'Escape') {
            close();
            toggle.focus();
        }
    });
    
    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            close();
        });
    });
}

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchContainer = document.querySelector('[data-search]');
    if (!searchContainer) return;
    
    const input = searchContainer.querySelector('[data-search-input]');
    const dropdown = searchContainer.querySelector('[data-search-dropdown]');
    
    if (!input || !dropdown) return;
    
    let isOpen = false;
    
    const open = () => {
        isOpen = true;
        dropdown.classList.add('sator-search__dropdown--open');
    };
    
    const close = () => {
        isOpen = false;
        dropdown.classList.remove('sator-search__dropdown--open');
    };
    
    input.addEventListener('focus', open);
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            updateSearchResults(query);
            open();
        } else {
            close();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (isOpen && !searchContainer.contains(e.target)) {
            close();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (isOpen && e.key === 'Escape') {
            close();
            input.blur();
        }
    });
}

/**
 * Updates search dropdown with mock results
 * @param {string} query - Search query
 */
function updateSearchResults(query) {
    const dropdown = document.querySelector('[data-search-dropdown]');
    if (!dropdown) return;
    
    // Mock search results
    const categories = [
        { name: 'Players', items: ['TenZ', 'aspas', 'Derke'] },
        { name: 'Teams', items: ['Sentinels', 'Fnatic', 'Cloud9'] },
        { name: 'Matches', items: ['VCT Masters', 'Champions 2024'] }
    ];
    
    let html = '';
    
    categories.forEach(cat => {
        const filtered = cat.items.filter(item => 
            item.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filtered.length > 0) {
            html += `<div class="sator-search__category">${cat.name}</div>`;
            filtered.forEach(item => {
                html += `
                    <a href="#" class="sator-search__result">
                        <svg class="sator-search__result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        ${item}
                    </a>
                `;
            });
        }
    });
    
    if (html === '') {
        html = '<div class="sator-search__category">No results found</div>';
    }
    
    dropdown.innerHTML = html;
}

/**
 * Initialize breadcrumbs
 */
function initBreadcrumbs() {
    const breadcrumbContainer = document.querySelector('[data-breadcrumb]');
    if (!breadcrumbContainer) return;
    
    // Import and create breadcrumb dynamically
    import('./components/breadcrumb.js').then(module => {
        const breadcrumb = module.createBreadcrumb();
        breadcrumbContainer.appendChild(breadcrumb);
    });
}

/**
 * Initialize HUB banner
 */
function initHubBanner() {
    const banner = document.querySelector('[data-hub-banner]');
    if (!banner) return;
    
    // Check if user has dismissed banner
    const isDismissed = localStorage.getItem('sator_hub_banner_dismissed');
    if (isDismissed === 'true') {
        banner.remove();
        return;
    }
    
    const closeBtn = banner.querySelector('[data-hub-banner-close]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(-100%)';
            banner.style.transition = 'all 0.3s ease';
            
            setTimeout(() => banner.remove(), 300);
            localStorage.setItem('sator_hub_banner_dismissed', 'true');
        });
    }
}

/**
 * Initialize scroll handler for header
 */
function initScrollHandler() {
    let lastScroll = 0;
    const header = document.querySelector('[data-header]');
    
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add background on scroll
        if (currentScroll > 10) {
            header.classList.add('sator-header--scrolled');
        } else {
            header.classList.remove('sator-header--scrolled');
        }
        
        // Hide/show on scroll direction (optional)
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

/**
 * Initialize cross-HUB navigation
 */
export function initCrossHubNavigation() {
    const container = document.querySelector('[data-explore-hubs]');
    if (!container) return;
    
    const currentHub = detectCurrentHub();
    const otherHubs = Object.entries(HUBS).filter(([key]) => key !== currentHub);
    
    const grid = container.querySelector('[data-explore-hubs-grid]');
    if (!grid) return;
    
    otherHubs.forEach(([key, hub]) => {
        const card = createHubCard(key, hub);
        grid.appendChild(card);
    });
}

/**
 * Creates a HUB card for cross-navigation
 * @param {string} key - HUB key
 * @param {Object} hub - HUB configuration
 * @returns {HTMLElement}
 */
function createHubCard(key, hub) {
    const card = document.createElement('a');
    card.href = hub.path;
    card.className = `explore-hub-card explore-hub-card--${key}`;
    
    card.innerHTML = `
        <div class="explore-hub-card__header">
            <div class="explore-hub-card__icon">
                ${getHubIcon(hub.icon)}
            </div>
            <span class="explore-hub-card__name">${hub.name}</span>
        </div>
        <p class="explore-hub-card__description">${getHubDescription(key)}</p>
        <div class="explore-hub-card__cta">
            Explore ${hub.shortName}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        </div>
    `;
    
    return card;
}

/**
 * Gets HUB icon SVG
 * @param {string} icon - Icon name
 * @returns {string}
 */
function getHubIcon(icon) {
    const icons = {
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
        analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
        trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66v.34c0 .8-.6 1.46-1.35 1.56A2 2 0 0 0 6.6 18.6l4.4 4.4 4.4-4.4a2 2 0 0 0-2.05-2.04c-.75-.1-1.35-.76-1.35-1.56v-.34M16 2l-1 7H9L8 2h8z"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    };
    
    return icons[icon] || icons.chart;
}

/**
 * Gets HUB description
 * @param {string} key - HUB key
 * @returns {string}
 */
function getHubDescription(key) {
    const descriptions = {
        statref: 'Comprehensive player and team statistics database with advanced filtering.',
        analytics: 'Deep performance metrics, predictive models, and SATOR Square visualization.',
        esports: 'Live matches, tournaments, team rankings, news, and community features.',
        fantasy: 'Build your dream team, compete in leagues, and win prizes.'
    };
    
    return descriptions[key] || 'Explore this HUB to learn more.';
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}

// Default export
export default {
    initNavigation,
    initCrossHubNavigation,
    detectCurrentHub
};
