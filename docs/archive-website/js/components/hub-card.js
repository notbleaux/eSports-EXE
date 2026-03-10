[Ver005.000]
/**
 * Hub Card Component
 * ==================
 * Renders a HUB card with icon, title, description,
 * theme colors, and click handling.
 * 
 * @module components/hub-card
 * @version 1.0.0
 */

import { createElement, addClass, removeClass } from '../utils/dom.js';
import { fadeIn, createGlow } from '../utils/animations.js';

/**
 * HUB theme configurations
 */
const HUB_THEMES = {
    statref: {
        name: 'Statistical Reference',
        color: '#1E3A5F',
        accent: '#00D4FF',
        gradient: 'from-blue-900 to-blue-700',
        borderColor: 'border-blue-500/30',
        hoverBorder: 'hover:border-blue-400',
        glowColor: 'rgba(0, 212, 255, 0.4)',
        icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>`,
        path: '/hubs/stat-ref/'
    },
    analytics: {
        name: 'Advanced Analytics',
        color: '#6B46C1',
        accent: '#FFD700',
        gradient: 'from-purple-900 to-purple-700',
        borderColor: 'border-purple-500/30',
        hoverBorder: 'hover:border-purple-400',
        glowColor: 'rgba(255, 215, 0, 0.4)',
        icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>`,
        path: '/hubs/analytics/'
    },
    esports: {
        name: 'eSports HUB',
        color: '#FF4655',
        accent: '#FFD700',
        gradient: 'from-red-900 to-red-700',
        borderColor: 'border-red-500/30',
        hoverBorder: 'hover:border-red-400',
        glowColor: 'rgba(255, 215, 0, 0.4)',
        icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>`,
        path: '/hubs/esports/'
    },
    fantasy: {
        name: 'Fantasy eSports',
        color: '#00FF88',
        accent: '#00D4FF',
        gradient: 'from-emerald-900 to-emerald-700',
        borderColor: 'border-emerald-500/30',
        hoverBorder: 'hover:border-emerald-400',
        glowColor: 'rgba(0, 255, 136, 0.4)',
        icon: `<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`,
        path: '/hubs/fantasy/'
    }
};

/**
 * Default card options
 */
const DEFAULT_OPTIONS = {
    hub: 'statref',
    title: null,
    description: 'Explore this HUB',
    number: null,
    animated: true,
    glowOnHover: true,
    onClick: null,
    className: ''
};

/**
 * Creates a HUB card component
 * @param {Object} options - Card configuration
 * @param {string} options.hub - HUB identifier ('statref' | 'analytics' | 'esports' | 'fantasy')
 * @param {string} [options.title] - Card title (defaults to HUB name)
 * @param {string} [options.description] - Card description
 * @param {string} [options.number] - Card number (e.g., '1/4')
 * @param {boolean} [options.animated=true] - Whether to animate on mount
 * @param {boolean} [options.glowOnHover=true] - Whether to show glow on hover
 * @param {Function} [options.onClick] - Click handler
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Card element
 * 
 * @example
 * const card = createHubCard({
 *   hub: 'statref',
 *   description: 'Comprehensive player and team statistics',
 *   number: '1/4',
 *   onClick: () => navigateTo('/hubs/stat-ref/')
 * });
 * document.body.appendChild(card);
 */
export function createHubCard(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const theme = HUB_THEMES[config.hub] || HUB_THEMES.statref;
    
    // Use provided title or default to HUB name
    const title = config.title || theme.name;
    
    // Create card container
    const card = createElement('div', {
        classes: [
            'hub-card',
            'relative',
            'group',
            'cursor-pointer',
            'overflow-hidden',
            'rounded-2xl',
            'bg-gradient-to-br',
            theme.gradient,
            'border',
            theme.borderColor,
            theme.hoverBorder,
            'transition-all',
            'duration-500',
            'p-8',
            'flex',
            'flex-col',
            'justify-between',
            'min-h-[280px]',
            config.className
        ],
        attrs: {
            'data-hub': config.hub,
            'role': 'button',
            'tabindex': '0',
            'aria-label': `${title} - ${config.description}`
        }
    });
    
    // Add glow effect container
    const glowOverlay = createElement('div', {
        classes: [
            'absolute',
            'inset-0',
            'opacity-0',
            'group-hover:opacity-100',
            'transition-opacity',
            'duration-500',
            'pointer-events-none'
        ],
        styles: {
            background: `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 70%)`
        }
    });
    card.appendChild(glowOverlay);
    
    // Create card number badge (if provided)
    if (config.number) {
        const numberBadge = createElement('div', {
            classes: [
                'absolute',
                'top-4',
                'right-4',
                'text-xs',
                'font-mono',
                'text-white/50',
                'group-hover:text-white/80',
                'transition-colors'
            ],
            text: config.number
        });
        card.appendChild(numberBadge);
    }
    
    // Create content container
    const content = createElement('div', {
        classes: ['relative', 'z-10', 'flex', 'flex-col', 'h-full']
    });
    
    // Create icon container
    const iconContainer = createElement('div', {
        classes: [
            'w-16',
            'h-16',
            'rounded-xl',
            'bg-white/10',
            'backdrop-blur-sm',
            'flex',
            'items-center',
            'justify-center',
            'mb-6',
            'group-hover:scale-110',
            'group-hover:bg-white/20',
            'transition-all',
            'duration-300',
            'text-white'
        ],
        html: theme.icon
    });
    content.appendChild(iconContainer);
    
    // Create title
    const titleEl = createElement('h3', {
        classes: [
            'text-2xl',
            'font-bold',
            'text-white',
            'mb-2',
            'group-hover:text-white',
            'transition-colors'
        ],
        text: title
    });
    content.appendChild(titleEl);
    
    // Create description
    const descEl = createElement('p', {
        classes: [
            'text-sm',
            'text-white/70',
            'group-hover:text-white/90',
            'transition-colors',
            'line-clamp-2'
        ],
        text: config.description
    });
    content.appendChild(descEl);
    
    // Create arrow indicator
    const arrowContainer = createElement('div', {
        classes: [
            'mt-auto',
            'pt-6',
            'flex',
            'items-center',
            'gap-2',
            'text-white/50',
            'group-hover:text-white',
            'transition-all',
            'duration-300'
        ],
        html: `
            <span class="text-sm font-medium">Explore</span>
            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
        `
    });
    content.appendChild(arrowContainer);
    
    card.appendChild(content);
    
    // Add click handler
    if (typeof config.onClick === 'function') {
        card.addEventListener('click', (e) => {
            config.onClick(e, card);
        });
        
        // Handle keyboard activation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                config.onClick(e, card);
            }
        });
    }
    
    // Add glow effect on hover if enabled
    if (config.glowOnHover) {
        let glowController = null;
        
        card.addEventListener('mouseenter', () => {
            glowController = createGlow(card, {
                color: theme.accent,
                intensity: 0.3,
                duration: 2000
            });
            glowController.start();
        });
        
        card.addEventListener('mouseleave', () => {
            if (glowController) {
                glowController.stop();
                glowController = null;
            }
        });
    }
    
    // Animate on mount if enabled
    if (config.animated) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        // Use IntersectionObserver if available, otherwise animate immediately
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        fadeIn(entry.target, { duration: 500 });
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(card);
        } else {
            // Fallback for older browsers
            setTimeout(() => {
                fadeIn(card, { duration: 500 });
                card.style.transform = 'translateY(0)';
            }, 100);
        }
    }
    
    return card;
}

/**
 * Gets theme configuration for a HUB
 * @param {string} hub - HUB identifier
 * @returns {Object} Theme configuration
 */
export function getHubTheme(hub) {
    return HUB_THEMES[hub] || HUB_THEMES.statref;
}

/**
 * Gets all available HUB configurations
 * @returns {Object} All HUB themes
 */
export function getAllHubThemes() {
    return { ...HUB_THEMES };
}

/**
 * Creates a HUB card grid
 * @param {Object} options - Grid options
 * @param {HTMLElement} [options.container] - Container element
 * @param {Object[]} [options.cards] - Array of card configurations
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Grid container
 */
export function createHubCardGrid(options = {}) {
    const {
        container = null,
        cards = Object.keys(HUB_THEMES).map((hub, index) => ({
            hub,
            number: `${index + 1}/4`
        })),
        className = ''
    } = options;
    
    const grid = createElement('div', {
        classes: [
            'grid',
            'grid-cols-1',
            'md:grid-cols-2',
            'gap-6',
            'w-full',
            'max-w-4xl',
            className
        ]
    });
    
    cards.forEach((cardOptions, index) => {
        const card = createHubCard({
            ...cardOptions,
            animated: true
        });
        
        // Add staggered delay
        card.style.animationDelay = `${index * 100}ms`;
        grid.appendChild(card);
    });
    
    if (container) {
        container.appendChild(grid);
    }
    
    return grid;
}

// Default export
export default {
    createHubCard,
    createHubCardGrid,
    getHubTheme,
    getAllHubThemes,
    HUB_THEMES
};
