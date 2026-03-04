/**
 * Page Transitions Module
 * =======================
 * Smooth page transition animations with loading indicators
 * and scroll behavior management.
 * 
 * @module transitions
 * @version 1.0.0
 */

/**
 * Transition configuration
 */
const CONFIG = {
    fadeDuration: 300,
    loaderDelay: 200,
    minimumLoadTime: 500
};

/**
 * Initialize transition system
 */
export function initTransitions() {
    // Add transition styles to document
    injectTransitionStyles();
    
    // Set up page load handling
    setupPageLoadTransitions();
    
    // Set up smooth scroll
    setupSmoothScroll();
}

/**
 * Injects CSS styles for transitions
 */
function injectTransitionStyles() {
    if (document.getElementById('sator-transitions')) return;
    
    const styles = document.createElement('style');
    styles.id = 'sator-transitions';
    styles.textContent = `
        /* Page Transition States */
        body {
            opacity: 1;
            transition: opacity ${CONFIG.fadeDuration}ms ease-out;
        }
        
        body.page-exiting {
            opacity: 0;
        }
        
        body.page-entering {
            opacity: 0;
        }
        
        body.page-loaded {
            opacity: 1;
        }
        
        /* Loading Indicator */
        .page-loader {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 10, 15, 0.95);
            backdrop-filter: blur(8px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 1;
            transition: opacity ${CONFIG.fadeDuration}ms ease-out;
        }
        
        .page-loader--hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .page-loader__spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #FFD700;
            border-radius: 50%;
            animation: pageLoaderSpin 1s linear infinite;
        }
        
        .page-loader__text {
            margin-top: 16px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            font-family: 'JetBrains Mono', monospace;
        }
        
        @keyframes pageLoaderSpin {
            to { transform: rotate(360deg); }
        }
        
        /* Content fade in */
        .fade-in {
            animation: fadeIn ${CONFIG.fadeDuration}ms ease-out forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Stagger animation for lists */
        .stagger-children > * {
            opacity: 0;
            animation: fadeIn ${CONFIG.fadeDuration}ms ease-out forwards;
        }
        
        .stagger-children > *:nth-child(1) { animation-delay: 0ms; }
        .stagger-children > *:nth-child(2) { animation-delay: 50ms; }
        .stagger-children > *:nth-child(3) { animation-delay: 100ms; }
        .stagger-children > *:nth-child(4) { animation-delay: 150ms; }
        .stagger-children > *:nth-child(5) { animation-delay: 200ms; }
        .stagger-children > *:nth-child(6) { animation-delay: 250ms; }
        
        /* Scroll behavior */
        html {
            scroll-behavior: smooth;
        }
        
        @media (prefers-reduced-motion: reduce) {
            html {
                scroll-behavior: auto;
            }
            
            body,
            .page-loader,
            .fade-in,
            .stagger-children > * {
                transition: none;
                animation: none;
            }
        }
        
        /* Focus visible for accessibility */
        :focus-visible {
            outline: 2px solid #FFD700;
            outline-offset: 2px;
        }
        
        /* Skip to content link */
        .skip-to-content {
            position: absolute;
            top: -100%;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: #FFD700;
            color: #0a0a0f;
            font-weight: 600;
            border-radius: 0 0 8px 8px;
            z-index: 10000;
            transition: top 0.2s ease;
        }
        
        .skip-to-content:focus {
            top: 0;
        }
    `;
    
    document.head.appendChild(styles);
}

/**
 * Sets up page load transitions
 */
function setupPageLoadTransitions() {
    // Create loader element
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
        <div class="page-loader__spinner"></div>
        <div class="page-loader__text">Loading...</div>
    `;
    document.body.appendChild(loader);
    
    // Add page loaded class when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleInitialLoad);
    } else {
        handleInitialLoad();
    }
    
    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
        document.body.classList.add('page-exiting');
    });
}

/**
 * Handles initial page load
 */
function handleInitialLoad() {
    const startTime = performance.now();
    
    // Wait for minimum load time for smooth experience
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, CONFIG.minimumLoadTime - elapsed);
    
    setTimeout(() => {
        document.body.classList.add('page-loaded');
        
        // Hide and remove loader
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.add('page-loader--hidden');
            setTimeout(() => loader.remove(), CONFIG.fadeDuration);
        }
        
        // Animate content in
        animateContentIn();
    }, remaining);
}

/**
 * Animates content in after page load
 */
function animateContentIn() {
    // Add fade-in to main content sections
    const sections = document.querySelectorAll('main > section, .animate-on-load');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 100}ms`;
        section.classList.add('fade-in');
    });
}

/**
 * Sets up smooth scroll behavior
 */
function setupSmoothScroll() {
    // Handle anchor link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        
        if (link) {
            const targetId = link.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                e.preventDefault();
                smoothScrollTo(target);
            }
        }
    });
    
    // Add skip to content link for accessibility
    addSkipToContentLink();
}

/**
 * Smoothly scrolls to an element
 * @param {HTMLElement} element - Target element
 * @param {Object} options - Scroll options
 */
export function smoothScrollTo(element, options = {}) {
    const headerOffset = options.headerOffset || 80;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: options.behavior || 'smooth'
    });
    
    // Update focus for accessibility
    if (options.focus !== false) {
        element.setAttribute('tabindex', '-1');
        element.focus({ preventScroll: true });
    }
}

/**
 * Adds skip to content link for accessibility
 */
function addSkipToContentLink() {
    const main = document.querySelector('main');
    if (!main) return;
    
    // Ensure main has id
    if (!main.id) {
        main.id = 'main-content';
    }
    
    // Create skip link
    const skipLink = document.createElement('a');
    skipLink.href = `#${main.id}`;
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to content';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Shows loading indicator
 * @param {string} [text='Loading...'] - Loading text
 * @returns {HTMLElement} Loader element
 */
export function showLoader(text = 'Loading...') {
    let loader = document.querySelector('.page-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'page-loader';
        document.body.appendChild(loader);
    }
    
    loader.classList.remove('page-loader--hidden');
    loader.querySelector('.page-loader__text').textContent = text;
    
    return loader;
}

/**
 * Hides loading indicator
 * @param {number} [delay=0] - Delay before hiding
 */
export function hideLoader(delay = 0) {
    setTimeout(() => {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.classList.add('page-loader--hidden');
        }
    }, delay);
}

/**
 * Animates element entrance
 * @param {HTMLElement} element - Element to animate
 * @param {string} [animation='fadeIn'] - Animation type
 * @param {number} [delay=0] - Animation delay
 */
export function animateIn(element, animation = 'fadeIn', delay = 0) {
    if (!element) return;
    
    element.style.animationDelay = `${delay}ms`;
    element.classList.add(`animate-${animation}`);
    
    // Remove animation class after completion
    setTimeout(() => {
        element.classList.remove(`animate-${animation}`);
        element.style.animationDelay = '';
    }, CONFIG.fadeDuration + delay);
}

/**
 * Staggers animation for multiple elements
 * @param {NodeList|Array} elements - Elements to animate
 * @param {string} [animation='fadeIn'] - Animation type
 * @param {number} [staggerDelay=50] - Delay between each element
 */
export function staggerAnimate(elements, animation = 'fadeIn', staggerDelay = 50) {
    Array.from(elements).forEach((el, index) => {
        animateIn(el, animation, index * staggerDelay);
    });
}

/**
 * Creates a page transition effect
 * @param {Function} callback - Function to execute during transition
 * @param {Object} options - Transition options
 */
export async function pageTransition(callback, options = {}) {
    const { showLoading = true, loadingText = 'Loading...' } = options;
    
    // Exit current page
    document.body.classList.add('page-exiting');
    document.body.classList.remove('page-loaded');
    
    // Show loader if requested
    if (showLoading) {
        showLoader(loadingText);
    }
    
    // Wait for exit animation
    await new Promise(resolve => setTimeout(resolve, CONFIG.fadeDuration));
    
    // Execute callback
    if (typeof callback === 'function') {
        await callback();
    }
    
    // Enter new page
    document.body.classList.remove('page-exiting');
    document.body.classList.add('page-entering');
    
    hideLoader();
    
    // Complete animation
    setTimeout(() => {
        document.body.classList.remove('page-entering');
        document.body.classList.add('page-loaded');
        animateContentIn();
    }, CONFIG.fadeDuration);
}

// Default export
export default {
    initTransitions,
    smoothScrollTo,
    showLoader,
    hideLoader,
    animateIn,
    staggerAnimate,
    pageTransition
};
