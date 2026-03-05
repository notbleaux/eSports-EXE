/**
 * RadiantX Main JavaScript - Performance Optimized
 * Features: Lazy loading, Intersection Observer, Resource hints, 60fps animations
 * @version 2.0.0
 */

(function() {
  'use strict';

  // ============================================
  // PERFORMANCE MONITORING
  // ============================================
  
  const RadiantXPerf = {
    startTime: performance.now(),
    marks: {},
    
    mark(name) {
      this.marks[name] = performance.now();
      if ('mark' in performance) {
        performance.mark(name);
      }
    },
    
    measure(name, startMark, endMark) {
      if ('measure' in performance) {
        try {
          performance.measure(name, startMark, endMark);
        } catch (e) {}
      }
    },
    
    log() {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log('[RadiantX] Performance metrics:', this.marks);
      }
    }
  };

  // ============================================
  // LAZY IMAGE LOADING
  // ============================================
  
  const LazyLoader = {
    observer: null,
    
    init() {
      // Use native lazy loading if supported
      if ('loading' in HTMLImageElement.prototype) {
        document.querySelectorAll('img[data-src]').forEach(img => {
          img.src = img.dataset.src;
          img.loading = 'lazy';
          img.removeAttribute('data-src');
        });
        return;
      }
      
      // Fallback to IntersectionObserver
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.load(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: '100px 0px',
          threshold: 0
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
          this.observer.observe(img);
        });
      } else {
        // Final fallback - load all images
        document.querySelectorAll('img[data-src]').forEach(img => this.load(img));
      }
    },
    
    load(img) {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;
      
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
      
      if (srcset) {
        img.srcset = srcset;
        img.removeAttribute('data-srcset');
      }
      
      img.classList.add('loaded');
    }
  };

  // ============================================
  // RESOURCE PRELOADING
  // ============================================
  
  const ResourceHints = {
    prefetched: new Set(),
    
    preload(url, as, type) {
      if (!url || this.prefetched.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = as;
      if (type) link.type = type;
      if (as === 'font') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      this.prefetched.add(url);
    },
    
    prefetch(url) {
      if (!url || this.prefetched.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      
      this.prefetched.add(url);
    },
    
    init() {
      // Preload critical fonts
      this.preload(
        'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
        'font',
        'font/woff2'
      );
      
      // Hover-based prefetching
      document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a');
        if (link && link.hostname === location.hostname) {
          this.prefetch(link.href);
        }
      }, { passive: true });
    }
  };

  // ============================================
  // INTERSECTION OBSERVER ANIMATIONS
  // ============================================
  
  const ScrollAnimations = {
    observer: null,
    
    init() {
      if (!('IntersectionObserver' in window)) return;
      
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
      
      document.querySelectorAll('.io-animate').forEach(el => {
        this.observer.observe(el);
      });
    },
    
    reinit() {
      if (!this.observer) return;
      document.querySelectorAll('.io-animate:not(.is-visible)').forEach(el => {
        this.observer.observe(el);
      });
    }
  };

  // ============================================
  // SATOR SPHERE INTERACTIONS
  // ============================================
  
  const SatorSphere = {
    init() {
      const sphere = document.querySelector('.sator-sphere');
      if (!sphere) return;
      
      const facets = sphere.querySelectorAll('.facet');
      
      facets.forEach(facet => {
        facet.addEventListener('click', (e) => {
          const letter = e.currentTarget.dataset.letter;
          this.handleClick(letter);
        });
        
        facet.addEventListener('mouseenter', (e) => {
          e.currentTarget.style.filter = 'brightness(1.5) drop-shadow(0 0 10px currentColor)';
        });
        
        facet.addEventListener('mouseleave', (e) => {
          e.currentTarget.style.filter = '';
        });
      });
      
      // Pause rotation on hover
      sphere.addEventListener('mouseenter', () => {
        sphere.style.animationPlayState = 'paused';
      });
      
      sphere.addEventListener('mouseleave', () => {
        sphere.style.animationPlayState = 'running';
      });
    },
    
    handleClick(letter) {
      console.log('[SATOR] Facet clicked:', letter);
      // Add ripple effect or navigation logic here
    }
  };

  // ============================================
  // SERVICE WORKER REGISTRATION
  // ============================================
  
  const ServiceWorker = {
    init() {
      if (!('serviceWorker' in navigator)) return;
      
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('[SW] Registered:', registration.scope);
          })
          .catch(error => {
            console.error('[SW] Registration failed:', error);
          });
      });
    }
  };

  // ============================================
  // CORE WEB VITALS MONITORING
  // ============================================
  
  const WebVitals = {
    init() {
      if (!('PerformanceObserver' in window)) return;
      
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('[Perf] LCP:', Math.round(lastEntry.startTime));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          console.log('[Perf] CLS:', clsValue.toFixed(4));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const delay = entry.processingStart - entry.startTime;
            console.log('[Perf] FID:', Math.round(delay));
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        
      } catch (e) {
        // Ignore unsupported entry types
      }
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  const Utils = {
    // Debounce function for performance
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // Throttle function
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    // Check if element is in viewport
    isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  };

  // ============================================
  // ACCESSIBILITY ENHANCEMENTS
  // ============================================
  
  const A11y = {
    init() {
      // Detect keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          document.body.classList.add('keyboard-navigation');
        }
      });
      
      document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
      });
      
      // Reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduce-motion');
      }
      
      // Focus management for modals/dialogs
      this.trapFocus();
    },
    
    trapFocus() {
      // Implement focus trap for modal dialogs
      const modals = document.querySelectorAll('[role="dialog"]');
      modals.forEach(modal => {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        // Focus trap logic would go here
      });
    }
  };

  // ============================================
  // CONNECTION-AWARE LOADING
  // ============================================
  
  const ConnectionAware = {
    init() {
      if (!('connection' in navigator)) return;
      
      const conn = navigator.connection;
      
      if (conn.saveData) {
        document.body.classList.add('save-data');
      }
      
      if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
        document.body.classList.add('slow-connection');
      }
      
      // Listen for changes
      conn.addEventListener('change', () => {
        location.reload();
      });
    }
  };

  // ============================================
  // VISIBILITY API
  // ============================================
  
  const VisibilityManager = {
    init() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          document.body.classList.add('tab-hidden');
          // Pause expensive operations
        } else {
          document.body.classList.remove('tab-hidden');
          // Resume operations
        }
      });
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  
  function init() {
    RadiantXPerf.mark('init-start');
    
    // Initialize modules
    LazyLoader.init();
    ResourceHints.init();
    ScrollAnimations.init();
    SatorSphere.init();
    ServiceWorker.init();
    WebVitals.init();
    A11y.init();
    ConnectionAware.init();
    VisibilityManager.init();
    
    // Mark DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        RadiantXPerf.mark('dom-ready');
      });
    } else {
      RadiantXPerf.mark('dom-ready');
    }
    
    // Mark load complete
    window.addEventListener('load', () => {
      RadiantXPerf.mark('load-complete');
      RadiantXPerf.measure('page-load', 'init-start', 'load-complete');
      RadiantXPerf.log();
      
      document.body.classList.add('radiantx-ready');
    });
    
    // Expose public API
    window.RadiantX = {
      version: '2.0.0',
      perf: RadiantXPerf,
      utils: Utils,
      scrollAnimations: ScrollAnimations,
      reinit: () => {
        ScrollAnimations.reinit();
      },
      cleanup: () => {
        if (LazyLoader.observer) LazyLoader.observer.disconnect();
        if (ScrollAnimations.observer) ScrollAnimations.observer.disconnect();
      }
    };
    
    RadiantXPerf.mark('init-complete');
  }

  // Start initialization
  init();
  
})();
