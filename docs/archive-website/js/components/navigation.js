/**
 * Navigation Component
 * ====================
 * Renders header with HUB switcher, mobile menu toggle,
 * and current HUB highlighting.
 * 
 * @module components/navigation
 * @version 1.0.0
 */

import { createElement, toggleClass, addClass, removeClass } from '../utils/dom.js';
import { slideIn, slideOut } from '../utils/animations.js';

/**
 * HUB configuration for navigation
 */
const HUB_CONFIG = {
    statref: {
        name: 'Statistical Reference',
        shortName: 'Stat Ref',
        path: '/hubs/stat-ref/',
        color: '#00D4FF'
    },
    analytics: {
        name: 'Advanced Analytics',
        shortName: 'Analytics',
        path: '/hubs/analytics/',
        color: '#FFD700'
    },
    esports: {
        name: 'eSports HUB',
        shortName: 'eSports',
        path: '/hubs/esports/',
        color: '#FF4655'
    },
    fantasy: {
        name: 'Fantasy eSports',
        shortName: 'Fantasy',
        path: '/hubs/fantasy/',
        color: '#00FF88'
    }
};

/**
 * Default navigation options
 */
const DEFAULT_OPTIONS = {
    currentHub: null,
    isLoggedIn: false,
    userName: null,
    showLiveIndicator: true,
    onHubChange: null,
    onMenuToggle: null,
    className: ''
};

/**
 * Creates the navigation component
 * @param {Object} options - Navigation configuration
 * @param {string} [options.currentHub] - Current active HUB
 * @param {boolean} [options.isLoggedIn=false] - User login state
 * @param {string} [options.userName] - Display name for logged in user
 * @param {boolean} [options.showLiveIndicator=true] - Show live indicator
 * @param {Function} [options.onHubChange] - HUB change handler
 * @param {Function} [options.onMenuToggle] - Mobile menu toggle handler
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Navigation element
 * 
 * @example
 * const nav = createNavigation({
 *   currentHub: 'statref',
 *   isLoggedIn: false,
 *   onHubChange: (hub) => console.log('Switched to:', hub)
 * });
 * document.body.insertBefore(nav, document.body.firstChild);
 */
export function createNavigation(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // Create header container
    const header = createElement('header', {
        classes: [
            'fixed',
            'top-0',
            'left-0',
            'right-0',
            'z-50',
            'bg-slate-900/90',
            'backdrop-blur-md',
            'border-b',
            'border-white/10',
            config.className
        ],
        attrs: {
            'role': 'banner'
        }
    });
    
    // Create inner container
    const container = createElement('div', {
        classes: [
            'max-w-7xl',
            'mx-auto',
            'px-4',
            'sm:px-6',
            'lg:px-8'
        ]
    });
    header.appendChild(container);
    
    // Create flex container
    const flex = createElement('div', {
        classes: [
            'flex',
            'items-center',
            'justify-between',
            'h-16'
        ]
    });
    container.appendChild(flex);
    
    // Left section: Logo + HUB switcher
    const leftSection = createLeftSection(config);
    flex.appendChild(leftSection);
    
    // Center section: Desktop nav (hidden on mobile)
    const centerSection = createCenterSection(config);
    flex.appendChild(centerSection);
    
    // Right section: Live indicator + User actions
    const rightSection = createRightSection(config);
    flex.appendChild(rightSection);
    
    // Mobile menu (hidden by default)
    const mobileMenu = createMobileMenu(config);
    header.appendChild(mobileMenu);
    
    // Store reference to mobile menu for toggle
    header._mobileMenu = mobileMenu;
    header._mobileMenuButton = rightSection.querySelector('[data-mobile-toggle]');
    
    return header;
}

/**
 * Creates the left section (logo + HUB switcher)
 * @param {Object} config - Navigation config
 * @returns {HTMLElement}
 */
function createLeftSection(config) {
    const section = createElement('div', {
        classes: ['flex', 'items-center', 'gap-4']
    });
    
    // Logo
    const logo = createElement('a', {
        classes: [
            'flex',
            'items-center',
            'gap-3',
            'group',
            'hover:opacity-80',
            'transition-opacity'
        ],
        attrs: {
            href: '/',
            'aria-label': 'SATOR Home'
        },
        html: `
            <div class="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg 
                        flex items-center justify-center shadow-lg shadow-yellow-500/20
                        group-hover:shadow-yellow-500/40 transition-shadow">
                <span class="font-bold text-slate-900 text-sm">S</span>
            </div>
            <span class="font-bold text-xl text-white hidden sm:block">SATOR</span>
        `
    });
    section.appendChild(logo);
    
    // HUB switcher dropdown
    const hubSwitcher = createHubSwitcher(config);
    section.appendChild(hubSwitcher);
    
    return section;
}

/**
 * Creates the HUB switcher dropdown
 * @param {Object} config - Navigation config
 * @returns {HTMLElement}
 */
function createHubSwitcher(config) {
    const currentHub = config.currentHub ? HUB_CONFIG[config.currentHub] : null;
    
    const container = createElement('div', {
        classes: ['relative', 'hidden', 'md:block'],
        attrs: { 'data-hub-switcher': '' }
    });
    
    // Dropdown button
    const button = createElement('button', {
        classes: [
            'flex',
            'items-center',
            'gap-2',
            'px-3',
            'py-1.5',
            'rounded-lg',
            'bg-white/5',
            'hover:bg-white/10',
            'border',
            'border-white/10',
            'hover:border-white/20',
            'transition-all',
            'text-sm',
            'text-white/80',
            'hover:text-white'
        ],
        attrs: {
            'type': 'button',
            'aria-haspopup': 'true',
            'aria-expanded': 'false',
            'data-hub-dropdown': ''
        },
        html: currentHub ? `
            <span class="w-2 h-2 rounded-full" style="background-color: ${currentHub.color}"></span>
            <span>${currentHub.shortName}</span>
            <svg class="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 9l-7 7-7-7" />
            </svg>
        ` : `
            <span>Select HUB</span>
            <svg class="w-4 h-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 9l-7 7-7-7" />
            </svg>
        `
    });
    container.appendChild(button);
    
    // Dropdown menu
    const dropdown = createElement('div', {
        classes: [
            'absolute',
            'top-full',
            'left-0',
            'mt-2',
            'w-56',
            'rounded-xl',
            'bg-slate-800',
            'border',
            'border-white/10',
            'shadow-xl',
            'shadow-black/50',
            'opacity-0',
            'invisible',
            'transform',
            'scale-95',
            'transition-all',
            'duration-200',
            'z-50'
        ],
        attrs: {
            'role': 'menu',
            'aria-orientation': 'vertical',
            'data-hub-dropdown-menu': ''
        }
    });
    
    // HUB options
    Object.entries(HUB_CONFIG).forEach(([key, hub]) => {
        const isActive = config.currentHub === key;
        
        const option = createElement('a', {
            classes: [
                'flex',
                'items-center',
                'gap-3',
                'px-4',
                'py-3',
                'text-sm',
                'text-white/80',
                'hover:text-white',
                'hover:bg-white/5',
                'transition-colors',
                'first:rounded-t-xl',
                'last:rounded-b-xl',
                isActive && 'bg-white/5'
            ],
            attrs: {
                href: hub.path,
                'data-hub': key,
                'role': 'menuitem',
                'aria-current': isActive ? 'page' : undefined
            },
            html: `
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${hub.color}"></span>
                <div class="flex-1">
                    <div class="font-medium">${hub.name}</div>
                </div>
                ${isActive ? `
                    <svg class="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7" />
                    </svg>
                ` : ''}
            `
        });
        
        option.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof config.onHubChange === 'function') {
                config.onHubChange(key, hub);
            } else {
                window.location.href = hub.path;
            }
            closeDropdown();
        });
        
        dropdown.appendChild(option);
    });
    
    container.appendChild(dropdown);
    
    // Toggle dropdown
    let isOpen = false;
    
    const openDropdown = () => {
        isOpen = true;
        button.setAttribute('aria-expanded', 'true');
        addClass(dropdown, 'opacity-100', 'visible', 'scale-100');
        removeClass(dropdown, 'opacity-0', 'invisible', 'scale-95');
    };
    
    const closeDropdown = () => {
        isOpen = false;
        button.setAttribute('aria-expanded', 'false');
        addClass(dropdown, 'opacity-0', 'invisible', 'scale-95');
        removeClass(dropdown, 'opacity-100', 'visible', 'scale-100');
    };
    
    const toggleDropdown = () => {
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };
    
    button.addEventListener('click', toggleDropdown);
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (isOpen && !container.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (isOpen && e.key === 'Escape') {
            closeDropdown();
            button.focus();
        }
    });
    
    return container;
}

/**
 * Creates the center section (desktop navigation)
 * @param {Object} config - Navigation config
 * @returns {HTMLElement}
 */
function createCenterSection(config) {
    const section = createElement('nav', {
        classes: ['hidden', 'md:flex', 'items-center', 'gap-1'],
        attrs: {
            'role': 'navigation',
            'aria-label': 'Main navigation'
        }
    });
    
    const navItems = [
        { label: 'Dashboard', href: '#', active: false },
        { label: 'Matches', href: '#', active: false },
        { label: 'Players', href: '#', active: false },
        { label: 'Teams', href: '#', active: false }
    ];
    
    navItems.forEach(item => {
        const link = createElement('a', {
            classes: [
                'px-4',
                'py-2',
                'rounded-lg',
                'text-sm',
                'text-white/70',
                'hover:text-white',
                'hover:bg-white/5',
                'transition-all',
                item.active && 'text-white bg-white/10'
            ],
            attrs: {
                href: item.href
            },
            text: item.label
        });
        section.appendChild(link);
    });
    
    return section;
}

/**
 * Creates the right section (live indicator + actions)
 * @param {Object} config - Navigation config
 * @returns {HTMLElement}
 */
function createRightSection(config) {
    const section = createElement('div', {
        classes: ['flex', 'items-center', 'gap-4']
    });
    
    // Live indicator
    if (config.showLiveIndicator) {
        const liveIndicator = createElement('div', {
            classes: [
                'hidden',
                'sm:flex',
                'items-center',
                'gap-2',
                'px-3',
                'py-1.5',
                'bg-red-500/10',
                'border',
                'border-red-500/30',
                'rounded-full'
            ],
            attrs: {
                'aria-live': 'polite'
            },
            html: `
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span class="text-xs font-medium text-red-400 uppercase tracking-wider">Live</span>
            `
        });
        section.appendChild(liveIndicator);
    }
    
    // Mobile menu button
    const mobileButton = createElement('button', {
        classes: [
            'md:hidden',
            'p-2',
            'rounded-lg',
            'text-white/70',
            'hover:text-white',
            'hover:bg-white/5',
            'transition-colors'
        ],
        attrs: {
            type: 'button',
            'aria-label': 'Toggle mobile menu',
            'aria-expanded': 'false',
            'data-mobile-toggle': ''
        },
        html: `
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        `
    });
    
    mobileButton.addEventListener('click', () => {
        const expanded = mobileButton.getAttribute('aria-expanded') === 'true';
        mobileButton.setAttribute('aria-expanded', (!expanded).toString());
        
        if (typeof config.onMenuToggle === 'function') {
            config.onMenuToggle(!expanded);
        }
    });
    
    section.appendChild(mobileButton);
    
    return section;
}

/**
 * Creates the mobile menu
 * @param {Object} config - Navigation config
 * @returns {HTMLElement}
 */
function createMobileMenu(config) {
    const menu = createElement('div', {
        classes: [
            'md:hidden',
            'border-t',
            'border-white/10',
            'bg-slate-900/95',
            'backdrop-blur-lg',
            'hidden'
        ],
        attrs: {
            'data-mobile-menu': ''
        }
    });
    
    const content = createElement('div', {
        classes: ['px-4', 'py-4', 'space-y-4']
    });
    
    // HUB links
    const hubLinks = createElement('div', {
        classes: ['space-y-2']
    });
    
    Object.entries(HUB_CONFIG).forEach(([key, hub]) => {
        const isActive = config.currentHub === key;
        
        const link = createElement('a', {
            classes: [
                'flex',
                'items-center',
                'gap-3',
                'px-4',
                'py-3',
                'rounded-lg',
                'text-sm',
                'transition-colors',
                isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
            ],
            attrs: {
                href: hub.path
            },
            html: `
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${hub.color}"></span>
                <span class="font-medium">${hub.name}</span>
            `
        });
        
        hubLinks.appendChild(link);
    });
    
    content.appendChild(hubLinks);
    menu.appendChild(content);
    
    return menu;
}

/**
 * Toggles the mobile menu
 * @param {HTMLElement} navigation - Navigation element
 * @param {boolean} [show] - Force show/hide
 */
export function toggleMobileMenu(navigation, show) {
    if (!navigation || !navigation._mobileMenu || !navigation._mobileMenuButton) {
        console.warn('Navigation component not properly initialized');
        return;
    }
    
    const menu = navigation._mobileMenu;
    const button = navigation._mobileMenuButton;
    const isHidden = menu.classList.contains('hidden');
    const shouldShow = show !== undefined ? show : isHidden;
    
    if (shouldShow) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
        slideIn(menu, 'down', { duration: 300 });
    } else {
        button.setAttribute('aria-expanded', 'false');
        slideOut(menu, 'up', { duration: 200 }).then(() => {
            menu.classList.add('hidden');
        });
    }
}

/**
 * Highlights a navigation item
 * @param {HTMLElement} navigation - Navigation element
 * @param {string} selector - Item selector
 */
export function highlightNavItem(navigation, selector) {
    if (!navigation) return;
    
    navigation.querySelectorAll('nav a').forEach(link => {
        removeClass(link, 'text-white', 'bg-white/10');
        addClass(link, 'text-white/70');
    });
    
    const target = navigation.querySelector(selector);
    if (target) {
        removeClass(target, 'text-white/70');
        addClass(target, 'text-white', 'bg-white/10');
    }
}

/**
 * Gets HUB configuration
 * @param {string} hub - HUB identifier
 * @returns {Object} HUB config
 */
export function getHubConfig(hub) {
    return HUB_CONFIG[hub] || null;
}

/**
 * Gets current HUB from URL
 * @returns {string|null} HUB identifier
 */
export function getCurrentHubFromURL() {
    const path = window.location.pathname;
    
    if (path.includes('stat-ref') || path.includes('statref')) return 'statref';
    if (path.includes('analytics')) return 'analytics';
    if (path.includes('esports')) return 'esports';
    if (path.includes('fantasy')) return 'fantasy';
    
    return null;
}

// Default export
export default {
    createNavigation,
    toggleMobileMenu,
    highlightNavItem,
    getHubConfig,
    getCurrentHubFromURL,
    HUB_CONFIG
};
