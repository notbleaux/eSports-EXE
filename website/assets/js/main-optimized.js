/**
 * RadiantX Performance-Optimized JavaScript
 * Version: 2.0.0 - Lighthouse 90+ Optimizations
 * 
 * Features:
 * - Intersection Observer lazy loading
 * - Resource hints (preload/prefetch)
 * - 60fps animation optimization
 * - Reduced motion support
 * - Passive event listeners
 * - RequestIdleCallback for non-critical tasks
 */

// ============================================
// PERFORMANCE MONITORING
// ============================================
const PerfMonitor = {
  metrics: {
    startTime: performance.now(),
    domReady: 0,
    loadComplete: 0,
    firstPaint: 0,
    firstContentfulPaint: 0
  },

  init() {
    // Capture navigation timing
    window.addEventListener('load', () => {
      this.metrics.loadComplete = performance.now() - this.metrics.startTime;
      
      // Get Web Vitals if available
      if ('web-vitals' in window) {
        this.captureWebVitals();
      }
      
      this.logMetrics();
    });

    // Observe paint timing
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            this.metrics.firstPaint = entry.startTime;
          }
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
    }
  },

  captureWebVitals() {
    // LCP, FID, CLS tracking
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[Perf] LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('[Perf] CLS:', entry.value);
      }
    }).observe({ entryTypes: ['layout-shift'] });
  },

  logMetrics() {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.table(this.metrics);
    }
  }
};

// ============================================
// LAZY LOADING - Images & Iframes
// ============================================
const LazyLoader = {
  observer: null,
  imageQueue: [],

  init() {
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      this.loadAllImmediately();
      return;
    }

    // Create observer with performance options
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: '200px 0px', // Start loading 200px before viewport
        threshold: 0.01
      }
    );

    // Observe all lazy elements
    const lazyElements = document.querySelectorAll(
      'img[data-src], img[data-srcset], source[data-srcset], iframe[data-src]'
    );
    
    lazyElements.forEach(el => {
      this.observer.observe(el);
      el.classList.add('lazy');
    });

    // Handle responsive images
    this.handleResponsiveImages();
  },

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        this.loadElement(element);
        this.observer.unobserve(element);
      }
    });
  },

  loadElement(element) {
    const isPicture = element.closest('picture');
    
    if (element.tagName === 'IMG') {
      // Handle srcset
      if (element.dataset.srcset) {
        element.srcset = element.dataset.srcset;
        element.removeAttribute('data-srcset');
      }
      
      // Handle src
      if (element.dataset.src) {
        // Use decode() for better performance
        element.src = element.dataset.src;
        element.decode?.().then(() => {
          element.classList.add('loaded');
        }).catch(() => {
          element.classList.add('loaded');
        });
        element.removeAttribute('data-src');
      }
      
      // Remove lazy class when loaded
      element.onload = () => element.classList.add('loaded');
    }
    
    if (element.tagName === 'SOURCE') {
      element.srcset = element.dataset.srcset;
      element.removeAttribute('data-srcset');
    }
    
    if (element.tagName === 'IFRAME') {
      element.src = element.dataset.src;
      element.removeAttribute('data-src');
    }
  },

  handleResponsiveImages() {
    // Handle art direction with picture elements
    const pictures = document.querySelectorAll('picture');
    pictures.forEach(picture => {
      const sources = picture.querySelectorAll('source[data-srcset]');
      const img = picture.querySelector('img[data-src]');
      
      if (img && this.observer) {
        sources.forEach(source => this.observer.observe(source));
        this.observer.observe(img);
      }
    });
  },

  loadAllImmediately() {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll('[data-src], [data-srcset]').forEach(el => {
      this.loadElement(el);
    });
  }
};

// ============================================
// RESOURCE HINTS - Preload/Prefetch
// ============================================
const ResourceHints = {
  preloaded: new Set(),

  init() {
    // Preload critical fonts
    this.preloadFont('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2');
    this.preloadFont('https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2');
    
    // Prefetch likely navigation targets
    this.scheduleIdle(() => {
      this.prefetch('/launchpad.html');
      this.prefetch('/njz-central/index.html');
    });
  },

  preload(href, as, type) {
    if (this.preloaded.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (as === 'font') link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    this.preloaded.add(href);
  },

  preloadFont(url) {
    this.preload(url, 'font', 'font/woff2');
  },

  prefetch(href) {
    if (this.preloaded.has(href)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    document.head.appendChild(link);
    this.preloaded.add(href);
  },

  prerender(href) {
    const link = document.createElement('link');
    link.rel = 'prerender';
    link.href = href;
    document.head.appendChild(link);
  }
};

// ============================================
// ANIMATION OPTIMIZATION - 60fps
// ============================================
const AnimationOptimizer = {
  prefersReducedMotion: false,

  init() {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = mediaQuery.matches;
    
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.updateAnimations();
    });

    // Optimize scroll-linked animations
    this.optimizeScrollAnimations();
    
    // Use will-change strategically
    this.optimizeWillChange();
  },

  updateAnimations() {
    document.documentElement.style.setProperty(
      '--animation-duration-scale',
      this.prefersReducedMotion ? '0' : '1'
    );
  },

  optimizeScrollAnimations() {
    // Use passive scroll listeners
    let ticking = false;
    
    const scrollElements = document.querySelectorAll('[data-scroll-animate]');
    if (scrollElements.length === 0) return;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll(scrollElements);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  },

  handleScroll(elements) {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const visible = rect.top < viewportHeight && rect.bottom > 0;
      
      if (visible) {
        const progress = 1 - (rect.top / viewportHeight);
        el.style.setProperty('--scroll-progress', Math.max(0, Math.min(1, progress)));
      }
    });
  },

  optimizeWillChange() {
    // Add will-change only during animation
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    animatedElements.forEach(el => {
      el.addEventListener('animationstart', () => {
        el.style.willChange = 'transform, opacity';
      });
      
      el.addEventListener('animationend', () => {
        el.style.willChange = 'auto';
      });
    });
  }
};

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================
const ServiceWorkerManager = {
  init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('[SW] Registered:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  this.showUpdateNotification(newWorker);
                }
              });
            });
          })
          .catch(error => {
            console.error('[SW] Registration failed:', error);
          });
      });
    }
  },

  showUpdateNotification(worker) {
    // Show update available notification
    const updateEvent = new CustomEvent('sw-update-available', {
      detail: { worker }
    });
    window.dispatchEvent(updateEvent);
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
  // Schedule non-critical work
  scheduleIdle(callback, timeout = 2000) {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(callback, { timeout });
    }
    return setTimeout(callback, 1);
  },

  // Debounce function
  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Throttle function
  throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Load script asynchronously
  loadScript(src, async = true, defer = true) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = defer;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  },

  // Load CSS asynchronously
  loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
};

// ============================================
// COMPONENT INITIALIZATION
// ============================================
const Components = {
  init() {
    this.initNavigation();
    this.initMobileMenu();
    this.initSatorSphere();
    this.initSmoothScroll();
  },

  initNavigation() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    let lastScroll = 0;
    
    window.addEventListener('scroll', Utils.throttle(() => {
      const currentScroll = window.scrollY;
      
      if (currentScroll > 100) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
      
      lastScroll = currentScroll;
    }, 100), { passive: true });
  },

  initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.mobile-menu');
    
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
      menu.setAttribute('aria-hidden', !isOpen);
      document.body.classList.toggle('menu-open', isOpen);
    });
  },

  initSatorSphere() {
    const sphere = document.querySelector('.sator-sphere');
    if (!sphere) return;

    const facets = sphere.querySelectorAll('.facet');
    
    facets.forEach(facet => {
      facet.addEventListener('mouseenter', () => {
        if (AnimationOptimizer.prefersReducedMotion) return;
        facet.style.transform = 'scale(1.1)';
        facet.style.filter = 'brightness(1.3)';
      });
      
      facet.addEventListener('mouseleave', () => {
        facet.style.transform = '';
        facet.style.filter = '';
      });
    });
  },

  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: AnimationOptimizer.prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    });
  }
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
  // Initialize performance monitoring
  PerfMonitor.init();
  
  // Register service worker
  ServiceWorkerManager.init();
  
  // Initialize lazy loading
  LazyLoader.init();
  
  // Add resource hints
  ResourceHints.init();
  
  // Optimize animations
  AnimationOptimizer.init();
  
  // Initialize components
  Components.init();
  
  // Log initialization
  if (location.hostname === 'localhost') {
    console.log('[RadiantX] Initialized with performance optimizations');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PerfMonitor,
    LazyLoader,
    ResourceHints,
    AnimationOptimizer,
    Utils
  };
}
