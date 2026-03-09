/**
 * RadiantX Main JavaScript
 * Performance-optimized with lazy loading and critical resource preloading
 */

// Performance monitoring
const perfMetrics = {
    startTime: performance.now(),
    domReady: 0,
    loadComplete: 0
};

// Lazy load images using Intersection Observer
const lazyImageLoader = {
    observer: null,
    
    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }
    },
    
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    }
};

// Preload critical resources
const resourcePreloader = {
    preload(url, as, type) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = as;
        if (type) link.type = type;
        if (as === 'font') link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    },
    
    prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    },
    
    init() {
        // Preload critical fonts
        this.preload('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', 'font');
        this.preload('https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2', 'font');
        
        // Prefetch next likely pages
        this.prefetch('launchpad.html');
    }
};

// SATOR Sphere interactions
const satorSphere = {
    init() {
        const facets = document.querySelectorAll('.facet');
        
        facets.forEach(facet => {
            facet.addEventListener('click', (e) => {
                const letter = e.currentTarget.getAttribute('data-letter');
                this.handleFacetClick(letter);
            });
            
            facet.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.filter = 'brightness(1.5) drop-shadow(0 0 10px currentColor)';
            });
            
            facet.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.filter = '';
            });
        });
    },
    
    handleFacetClick(letter) {
        // Could expand to show detailed info about each layer
        console.log('SATOR facet clicked:', letter);
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('sator:facetClick', {
            detail: { letter }
        }));
    }
};

// Smooth scroll for anchor links
const smoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
};

// Mobile navigation
const mobileNav = {
    init() {
        const nav = document.querySelector('nav');
        if (!nav) return;
        
        // Add mobile menu toggle if not present
        if (!document.querySelector('.mobile-menu-toggle')) {
            const header = document.querySelector('header .max-w-7xl > div');
            if (header) {
                const toggle = document.createElement('button');
                toggle.className = 'mobile-menu-toggle md:hidden p-2';
                toggle.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                `;
                toggle.setAttribute('aria-label', 'Toggle menu');
                header.appendChild(toggle);
                
                toggle.addEventListener('click', () => {
                    nav.classList.toggle('hidden');
                    nav.classList.toggle('flex');
                    nav.classList.toggle('flex-col');
                    nav.classList.toggle('absolute');
                    nav.classList.toggle('top-16');
                    nav.classList.toggle('left-0');
                    nav.classList.toggle('right-0');
                    nav.classList.toggle('bg-radiant-black');
                    nav.classList.toggle('p-4');
                    nav.classList.toggle('border-b');
                    nav.classList.toggle('border-radiant-border');
                });
            }
        }
    }
};

// Live indicator animation
const liveIndicator = {
    init() {
        const indicators = document.querySelectorAll('.live-dot');
        indicators.forEach(dot => {
            dot.style.animation = 'livePulse 2s ease-in-out infinite';
        });
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    perfMetrics.domReady = performance.now() - perfMetrics.startTime;
    
    // Initialize modules
    resourcePreloader.init();
    lazyImageLoader.init();
    satorSphere.init();
    smoothScroll.init();
    mobileNav.init();
    liveIndicator.init();
    
    // Log performance metrics in development
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log('Performance metrics:', perfMetrics);
    }
});

// Track page load completion
window.addEventListener('load', () => {
    perfMetrics.loadComplete = performance.now() - perfMetrics.startTime;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        lazyImageLoader,
        resourcePreloader,
        satorSphere,
        perfMetrics
    };
}
