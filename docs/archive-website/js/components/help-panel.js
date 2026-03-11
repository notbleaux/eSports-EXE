[Ver006.000]
/**
 * Help Panel Component
 * ====================
 * Renders the help panel overlay with swipe gestures,
 * tab navigation, and close functionality.
 * 
 * This is a shared component that can be used across the site.
 * For the full Help HUB implementation, see:
 * - website/hubs/help/index.html (full panel implementation)
 * - website/hubs/help/js/help.js (panel logic)
 * - website/hubs/help/css/help.css (panel styles)
 * 
 * @module components/help-panel
 * @version 1.1.0
 * @see website/hubs/help/index.html
 */

import { createElement, trapFocus, addClass, removeClass } from '../utils/dom.js';
import { fadeIn, fadeOut, slideIn, slideOut } from '../utils/animations.js';

/**
 * Tab configurations
 */
export const TABS = {
    guides: {
        label: 'Guides',
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>`,
        content: 'guides'
    },
    dashboards: {
        label: 'Dashboards',
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>`,
        content: 'dashboards'
    },
    developer: {
        label: 'Developer',
        icon: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>`,
        content: 'developer'
    }
};

/**
 * Help HUB URL for standalone access
 */
export const HELP_HUB_URL = 'hubs/help/';

/**
 * Default panel options
 */
const DEFAULT_OPTIONS = {
    initialTab: 'guides',
    onClose: null,
    onTabChange: null,
    swipeEnabled: true,
    className: '',
    useFullImplementation: true  // Use the full Help HUB implementation when available
};

/**
 * Creates the Help Panel component
 * @param {Object} options - Panel configuration
 * @param {string} [options.initialTab='guides'] - Initial active tab
 * @param {Function} [options.onClose] - Close handler
 * @param {Function} [options.onTabChange] - Tab change handler
 * @param {boolean} [options.swipeEnabled=true] - Enable swipe gestures
 * @param {string} [options.className] - Additional CSS classes
 * @param {boolean} [options.useFullImplementation=true] - Use full Help HUB implementation
 * @returns {HTMLElement} Panel overlay element
 * 
 * @example
 * const helpPanel = createHelpPanel({
 *   initialTab: 'guides',
 *   onClose: () => console.log('Panel closed')
 * });
 * document.body.appendChild(helpPanel);
 */
export function createHelpPanel(options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    // If full implementation is available, use the Help HUB
    if (config.useFullImplementation && window.helpPanel) {
        return createHelpPanelProxy(config);
    }
    
    let currentTab = config.initialTab;
    let isOpen = false;
    let focusTrapCleanup = null;
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Create overlay container
    const overlay = createElement('div', {
        classes: [
            'help-panel-overlay',
            'fixed',
            'inset-0',
            'z-[100]',
            'hidden'
        ],
        attrs: {
            'role': 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Help panel',
            'data-help-panel': ''
        }
    });
    
    // Create backdrop
    const backdrop = createElement('div', {
        classes: [
            'absolute',
            'inset-0',
            'bg-slate-900/95',
            'backdrop-blur-sm'
        ],
        attrs: {
            'data-help-backdrop': ''
        }
    });
    overlay.appendChild(backdrop);
    
    // Create panel container
    const panel = createElement('div', {
        classes: [
            'help-panel',
            'absolute',
            'inset-x-0',
            'bottom-0',
            'md:inset-0',
            'md:left-auto',
            'md:w-full',
            'md:max-w-2xl',
            'bg-slate-800',
            'border-t',
            'md:border-t-0',
            'md:border-l',
            'border-white/10',
            'shadow-2xl',
            'flex',
            'flex-col',
            config.className
        ],
        attrs: {
            'data-help-panel-content': ''
        }
    });
    overlay.appendChild(panel);
    
    // Create header
    const header = createHeader();
    panel.appendChild(header);
    
    // Create tab navigation
    const tabNav = createTabNavigation(currentTab, (tab) => {
        switchTab(tab);
    });
    panel.appendChild(tabNav);
    
    // Create content area
    const content = createContent(currentTab);
    panel.appendChild(content);
    
    // Create swipe indicator (mobile)
    const swipeIndicator = createSwipeIndicator();
    panel.appendChild(swipeIndicator);
    
    // Store references
    overlay._panel = panel;
    overlay._content = content;
    overlay._tabNav = tabNav;
    
    /**
     * Creates the panel header
     */
    function createHeader() {
        const header = createElement('div', {
            classes: [
                'flex',
                'items-center',
                'justify-between',
                'px-6',
                'py-4',
                'border-b',
                'border-white/10'
            ]
        });
        
        const title = createElement('div', {
            classes: ['flex', 'items-center', 'gap-3']
        });
        
        const logo = createElement('div', {
            classes: [
                'w-8',
                'h-8',
                'rounded-lg',
                'bg-gradient-to-br',
                'from-cyan-400',
                'to-blue-500',
                'flex',
                'items-center',
                'justify-center'
            ],
            html: `<span class="font-bold text-white text-sm">?</span>`
        });
        title.appendChild(logo);
        
        const heading = createElement('h2', {
            classes: ['text-lg', 'font-bold', 'text-white'],
            text: 'Help & Documentation'
        });
        title.appendChild(heading);
        
        header.appendChild(title);
        
        // Close button
        const closeBtn = createElement('button', {
            classes: [
                'p-2',
                'rounded-lg',
                'text-white/60',
                'hover:text-white',
                'hover:bg-white/10',
                'transition-colors',
                'focus:outline-none',
                'focus:ring-2',
                'focus:ring-cyan-400/50'
            ],
            attrs: {
                type: 'button',
                'aria-label': 'Close help panel',
                'data-help-close': ''
            },
            html: `
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                </svg>
            `
        });
        
        closeBtn.addEventListener('click', close);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    /**
     * Creates tab navigation
     */
    function createTabNavigation(activeTab, onSelect) {
        const nav = createElement('div', {
            classes: [
                'flex',
                'border-b',
                'border-white/10',
                'px-2'
            ],
            attrs: {
                role: 'tablist',
                'aria-label': 'Help sections'
            }
        });
        
        Object.entries(TABS).forEach(([key, tab]) => {
            const isActive = key === activeTab;
            
            const button = createElement('button', {
                classes: [
                    'flex',
                    'items-center',
                    'gap-2',
                    'px-4',
                    'py-3',
                    'text-sm',
                    'font-medium',
                    'transition-colors',
                    'border-b-2',
                    isActive 
                        ? 'text-cyan-400 border-cyan-400' 
                        : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                ],
                attrs: {
                    role: 'tab',
                    'aria-selected': isActive.toString(),
                    'aria-controls': `tabpanel-${key}`,
                    id: `tab-${key}`,
                    'data-tab': key
                },
                html: `${tab.icon}<span>${tab.label}</span>`
            });
            
            button.addEventListener('click', () => onSelect(key));
            
            nav.appendChild(button);
        });
        
        return nav;
    }
    
    /**
     * Creates tab content
     */
    function createContent(activeTab) {
        const container = createElement('div', {
            classes: [
                'flex-1',
                'overflow-y-auto',
                'p-6'
            ],
            attrs: {
                role: 'tabpanel',
                id: `tabpanel-${activeTab}`,
                'aria-labelledby': `tab-${activeTab}`
            }
        });
        
        // Generate content based on active tab
        const contentHTML = getTabContent(activeTab);
        container.innerHTML = contentHTML;
        
        return container;
    }
    
    /**
     * Creates swipe indicator for mobile
     */
    function createSwipeIndicator() {
        return createElement('div', {
            classes: [
                'md:hidden',
                'flex',
                'justify-center',
                'py-2',
                'gap-4',
                'text-white/30',
                'text-xs'
            ],
            html: `
                <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 19l-7-7 7-7" />
                    </svg>
                    Swipe for TOC
                </span>
                <span class="flex items-center gap-1">
                    Swipe for Dashboards
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            `
        });
    }
    
    /**
     * Switches to a different tab
     */
    function switchTab(tab) {
        if (tab === currentTab || !TABS[tab]) return;
        
        currentTab = tab;
        
        // Update tab buttons
        overlay._tabNav.querySelectorAll('button').forEach(btn => {
            const isActive = btn.dataset.tab === tab;
            btn.setAttribute('aria-selected', isActive.toString());
            
            if (isActive) {
                addClass(btn, 'text-cyan-400', 'border-cyan-400');
                removeClass(btn, 'text-white/60', 'border-transparent', 'hover:text-white', 'hover:border-white/30');
            } else {
                addClass(btn, 'text-white/60', 'border-transparent', 'hover:text-white', 'hover:border-white/30');
                removeClass(btn, 'text-cyan-400', 'border-cyan-400');
            }
        });
        
        // Update content with animation
        const newContent = createContent(tab);
        fadeOut(overlay._content, { duration: 150 }).then(() => {
            overlay._content.replaceWith(newContent);
            overlay._content = newContent;
            fadeIn(newContent, { duration: 200 });
        });
        
        // Update panel attributes
        overlay._panel.setAttribute('aria-labelledby', `tab-${tab}`);
        
        // Call handler
        if (typeof config.onTabChange === 'function') {
            config.onTabChange(tab);
        }
    }
    
    /**
     * Opens the panel
     */
    function open() {
        if (isOpen) return;
        isOpen = true;
        
        overlay.classList.remove('hidden');
        
        // Animate backdrop
        fadeIn(backdrop, { duration: 300 });
        
        // Animate panel (slide in from right on desktop, up on mobile)
        const isMobile = window.innerWidth < 768;
        slideIn(panel, isMobile ? 'up' : 'right', { duration: 400 });
        
        // Trap focus
        focusTrapCleanup = trapFocus(overlay);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Store previous focus
        overlay._previousFocus = document.activeElement;
    }
    
    /**
     * Closes the panel
     */
    function close() {
        if (!isOpen) return;
        isOpen = false;
        
        // Animate out
        fadeOut(backdrop, { duration: 200 });
        
        const isMobile = window.innerWidth < 768;
        slideOut(panel, isMobile ? 'down' : 'right', { duration: 300 }).then(() => {
            overlay.classList.add('hidden');
        });
        
        // Release focus trap
        if (focusTrapCleanup) {
            focusTrapCleanup();
            focusTrapCleanup = null;
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Restore previous focus
        if (overlay._previousFocus && typeof overlay._previousFocus.focus === 'function') {
            overlay._previousFocus.focus();
        }
        
        // Call handler
        if (typeof config.onClose === 'function') {
            config.onClose();
        }
    }
    
    /**
     * Gets content HTML for a tab
     */
    function getTabContent(tab) {
        const contents = {
            guides: `
                <div class="text-center py-12">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-2">Help Guides</h3>
                    <p class="text-white/70 mb-6 max-w-sm mx-auto">
                        Access comprehensive guides for all SATOR features and HUBs.
                    </p>
                    <a href="${HELP_HUB_URL}" class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                        Open Full Help Center
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                    </a>
                </div>
            `,
            dashboards: `
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-4">System Health</h3>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span class="text-sm text-white/80">API Status</span>
                                </div>
                                <span class="text-sm font-medium text-emerald-400">98%</span>
                            </div>
                            <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    <span class="text-sm text-white/80">Database</span>
                                </div>
                                <span class="text-sm font-medium text-emerald-400">100%</span>
                            </div>
                            <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full bg-cyan-400"></div>
                                    <span class="text-sm text-white/80">Live Data Feed</span>
                                </div>
                                <span class="text-sm font-medium text-cyan-400">97%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t border-white/10 pt-6">
                        <h3 class="text-lg font-semibold text-white mb-4">HUB Status</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <div class="text-xs text-blue-400 mb-1">Stat Ref</div>
                                <div class="text-lg font-bold text-white">Online</div>
                            </div>
                            <div class="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <div class="text-xs text-purple-400 mb-1">Analytics</div>
                                <div class="text-lg font-bold text-white">Online</div>
                            </div>
                            <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div class="text-xs text-red-400 mb-1">eSports</div>
                                <div class="text-lg font-bold text-white">Online</div>
                            </div>
                            <div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div class="text-xs text-emerald-400 mb-1">Fantasy</div>
                                <div class="text-lg font-bold text-white">Online</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <a href="${HELP_HUB_URL}" class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                            View detailed dashboard →
                        </a>
                    </div>
                </div>
            `,
            developer: `
                <div class="space-y-6">
                    <div class="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div class="flex items-center gap-2 text-cyan-400 mb-2">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span class="font-semibold">Developer Tools</span>
                        </div>
                        <p class="text-sm text-white/70">
                            Access developer diagnostics, API documentation, and system logs.
                        </p>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-3">Developer Resources</h3>
                        <div class="space-y-2">
                            <a href="${HELP_HUB_URL}" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <svg class="w-5 h-5 text-white/50 group-hover:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                <span class="text-sm text-white/80 group-hover:text-white">System Diagnostics</span>
                            </a>
                            <a href="#" class="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <svg class="w-5 h-5 text-white/50 group-hover:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                </svg>
                                <span class="text-sm text-white/80 group-hover:text-white">GitHub Repository</span>
                            </a>
                        </div>
                    </div>
                </div>
            `
        };
        
        return contents[tab] || contents.guides;
    }
    
    // Event handlers
    
    // Close on backdrop click
    backdrop.addEventListener('click', close);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (isOpen && e.key === 'Escape') {
            close();
        }
    });
    
    // Swipe gestures
    if (config.swipeEnabled) {
        overlay.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        overlay.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Only handle horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                const tabs = Object.keys(TABS);
                const currentIndex = tabs.indexOf(currentTab);
                
                if (deltaX > 0 && currentIndex > 0) {
                    // Swipe right - go to previous tab
                    switchTab(tabs[currentIndex - 1]);
                } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
                    // Swipe left - go to next tab
                    switchTab(tabs[currentIndex + 1]);
                }
            }
        }, { passive: true });
    }
    
    // Public methods
    overlay.open = open;
    overlay.close = close;
    overlay.switchTab = switchTab;
    overlay.isOpen = () => isOpen;
    
    return overlay;
}

/**
 * Creates a proxy to the full Help HUB implementation
 * @param {Object} config - Panel configuration
 * @returns {HTMLElement} Proxy overlay element
 */
function createHelpPanelProxy(config) {
    const proxy = document.createElement('div');
    
    proxy.open = () => {
        // Navigate to Help HUB or trigger global panel
        if (window.helpPanel) {
            window.helpPanel.open();
            if (config.initialTab && config.initialTab !== 'guides') {
                window.helpPanel.switchTab(config.initialTab);
            }
        } else {
            window.location.href = HELP_HUB_URL;
        }
    };
    
    proxy.close = () => {
        if (window.helpPanel) {
            window.helpPanel.close();
        }
    };
    
    proxy.switchTab = (tab) => {
        if (window.helpPanel) {
            window.helpPanel.switchTab(tab);
        }
    };
    
    proxy.isOpen = () => {
        return window.helpPanel ? window.helpPanel.isOpen : false;
    };
    
    return proxy;
}

/**
 * Opens a help panel instance
 * @param {HTMLElement} panel - Panel element
 */
export function openHelpPanel(panel) {
    if (panel && typeof panel.open === 'function') {
        panel.open();
    }
}

/**
 * Closes a help panel instance
 * @param {HTMLElement} panel - Panel element
 */
export function closeHelpPanel(panel) {
    if (panel && typeof panel.close === 'function') {
        panel.close();
    }
}

/**
 * Switches to a specific tab
 * @param {HTMLElement} panel - Panel element
 * @param {string} tab - Tab name
 */
export function switchHelpTab(panel, tab) {
    if (panel && typeof panel.switchTab === 'function') {
        panel.switchTab(tab);
    }
}

/**
 * Opens the full Help HUB
 * @param {string} [tab] - Optional tab to open
 */
export function openHelpHUB(tab = null) {
    if (window.helpPanel) {
        window.helpPanel.open();
        if (tab) {
            window.helpPanel.switchTab(tab);
        }
    } else {
        const url = tab ? `${HELP_HUB_URL}?tab=${tab}` : HELP_HUB_URL;
        window.location.href = url;
    }
}

// Default export
export default {
    createHelpPanel,
    openHelpPanel,
    closeHelpPanel,
    switchHelpTab,
    openHelpHUB,
    TABS,
    HELP_HUB_URL
};
