/**
 * Router Module
 * =============
 * Simple client-side routing helper with active link highlighting,
 * page transition handling, and 404 support.
 * 
 * @module router
 * @version 1.0.0
 */

import { addClass, removeClass } from './utils/dom.js';

/**
 * Router configuration
 */
const ROUTER_CONFIG = {
    // CSS class for active links
    activeClass: 'text-white',
    inactiveClass: 'text-white/70',
    
    // Active background class
    activeBgClass: 'bg-white/10',
    
    // Transition duration in ms
    transitionDuration: 300,
    
    // Enable smooth scroll
    smoothScroll: true
};

/**
 * Initializes the router
 * Sets up event listeners and initial state
 */
export function initRouter() {
    // Highlight active links on page load
    highlightActiveLinks();
    
    // Set up click handling for internal links
    setupLinkHandling();
    
    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
    
    // Initial page load animation
    handlePageLoad();
}

/**
 * Highlights active navigation links based on current URL
 */
export function highlightActiveLinks() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip external links and anchors
        if (!href || href.startsWith('#') || href.startsWith('http')) {
            return;
        }
        
        // Normalize paths for comparison
        const normalizedHref = normalizePath(href);
        const normalizedCurrent = normalizePath(currentPath);
        
        // Check if this link matches current path
        const isActive = isPathMatch(normalizedCurrent, normalizedHref);
        
        if (isActive) {
            addClass(link, ROUTER_CONFIG.activeClass, ROUTER_CONFIG.activeBgClass);
            removeClass(link, ROUTER_CONFIG.inactiveClass);
            link.setAttribute('aria-current', 'page');
        } else {
            removeClass(link, ROUTER_CONFIG.activeClass, ROUTER_CONFIG.activeBgClass);
            addClass(link, ROUTER_CONFIG.inactiveClass);
            link.removeAttribute('aria-current');
        }
    });
}

/**
 * Sets up click handling for smooth internal navigation
 */
function setupLinkHandling() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Skip external links, anchors, and modifier key clicks
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('http') || 
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            e.ctrlKey || 
            e.metaKey || 
            e.shiftKey) {
            return;
        }
        
        // Let default behavior happen for downloads
        if (link.hasAttribute('download')) {
            return;
        }
        
        // Handle internal navigation
        e.preventDefault();
        navigateTo(href);
    });
}

/**
 * Navigates to a new page with transition
 * @param {string} url - URL to navigate to
 * @param {Object} options - Navigation options
 * @param {boolean} [options.pushState=true] - Whether to push to history
 */
export async function navigateTo(url, options = {}) {
    const { pushState = true } = options;
    
    // Don't navigate if already on this page
    if (normalizePath(window.location.pathname) === normalizePath(url)) {
        return;
    }
    
    // Trigger page exit animation
    await triggerPageExit();
    
    // Navigate to new page
    if (pushState) {
        window.history.pushState({}, '', url);
    }
    
    // Load new page content or full navigation
    if (isSPAEnabled()) {
        await loadPageContent(url);
    } else {
        // Full page reload for non-SPA mode
        window.location.href = url;
        return;
    }
    
    // Update UI
    highlightActiveLinks();
    
    // Trigger page enter animation
    triggerPageEnter();
    
    // Scroll to top
    if (ROUTER_CONFIG.smoothScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo(0, 0);
    }
}

/**
 * Handles browser back/forward buttons
 */
function handlePopState() {
    navigateTo(window.location.pathname, { pushState: false });
}

/**
 * Handles initial page load animation
 */
function handlePageLoad() {
    document.body.classList.add('page-loaded');
    
    // Remove loading indicator if present
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.classList.add('page-loader--hidden');
        setTimeout(() => loader.remove(), 500);
    }
}

/**
 * Triggers page exit animation
 * @returns {Promise} Resolves when animation completes
 */
function triggerPageExit() {
    return new Promise((resolve) => {
        document.body.classList.add('page-exiting');
        document.body.classList.remove('page-loaded');
        
        setTimeout(() => {
            resolve();
        }, ROUTER_CONFIG.transitionDuration);
    });
}

/**
 * Triggers page enter animation
 */
function triggerPageEnter() {
    document.body.classList.remove('page-exiting');
    document.body.classList.add('page-entering');
    
    setTimeout(() => {
        document.body.classList.remove('page-entering');
        document.body.classList.add('page-loaded');
    }, ROUTER_CONFIG.transitionDuration);
}

/**
 * Loads page content via fetch (SPA mode)
 * @param {string} url - URL to load
 */
async function loadPageContent(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                handle404();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Update page title
        document.title = doc.title;
        
        // Update meta tags
        updateMetaTags(doc);
        
        // Replace main content
        const newMain = doc.querySelector('main');
        const currentMain = document.querySelector('main');
        
        if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML;
            
            // Execute scripts in new content
            executeScripts(currentMain);
        }
        
    } catch (error) {
        console.error('Navigation error:', error);
        // Fall back to full page reload
        window.location.href = url;
    }
}

/**
 * Updates meta tags from new document
 * @param {Document} doc - New document
 */
function updateMetaTags(doc) {
    const metaSelectors = [
        'meta[name="description"]',
        'meta[property^="og:"]',
        'meta[name="twitter:"]',
        'link[rel="canonical"]'
    ];
    
    metaSelectors.forEach(selector => {
        const newMeta = doc.querySelector(selector);
        const currentMeta = document.querySelector(selector);
        
        if (newMeta && currentMeta) {
            currentMeta.content = newMeta.content;
        }
    });
}

/**
 * Executes scripts in dynamically loaded content
 * @param {HTMLElement} container - Container with scripts
 */
function executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy content
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        
        // Replace old script with new one to execute it
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

/**
 * Handles 404 errors
 */
function handle404() {
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `
            <div class="min-h-[60vh] flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-6xl font-bold text-white mb-4">404</h1>
                    <p class="text-xl text-white/60 mb-8">Page not found</p>
                    <a href="/" class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go Home
                    </a>
                </div>
            </div>
        `;
    }
}

/**
 * Checks if SPA mode is enabled
 * @returns {boolean}
 */
function isSPAEnabled() {
    // Check for data-spa attribute on html element
    return document.documentElement.hasAttribute('data-spa');
}

/**
 * Normalizes a path for comparison
 * @param {string} path - Path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(path) {
    // Remove trailing slash except for root
    path = path.replace(/\/$/, '') || '/';
    
    // Ensure leading slash
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    return path.toLowerCase();
}

/**
 * Checks if paths match
 * @param {string} current - Current path
 * @param {string} target - Target path
 * @returns {boolean}
 */
function isPathMatch(current, target) {
    // Exact match
    if (current === target) {
        return true;
    }
    
    // Handle index pages
    if (current + '/index.html' === target || current === target + '/index.html') {
        return true;
    }
    
    // Handle parent paths (for nested navigation)
    if (current.startsWith(target + '/')) {
        return true;
    }
    
    return false;
}

/**
 * Gets current route info
 * @returns {Object} Route information
 */
export function getCurrentRoute() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    
    return {
        path,
        hash,
        search,
        params: new URLSearchParams(search),
        isHub: path.includes('/hubs/'),
        hubName: getHubNameFromPath(path)
    };
}

/**
 * Gets HUB name from path
 * @param {string} path - URL path
 * @returns {string|null}
 */
function getHubNameFromPath(path) {
    const match = path.match(/\/hubs\/([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Scrolls to an element with smooth animation
 * @param {string} selector - Element selector
 * @param {Object} options - Scroll options
 */
export function scrollToElement(selector, options = {}) {
    const element = document.querySelector(selector);
    
    if (element) {
        const offset = options.offset || 80; // Account for fixed header
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: options.behavior || 'smooth'
        });
        
        // Update URL hash without jumping
        if (options.updateHash !== false) {
            history.pushState(null, null, selector);
        }
    }
}

// Default export
export default {
    initRouter,
    navigateTo,
    highlightActiveLinks,
    getCurrentRoute,
    scrollToElement
};
