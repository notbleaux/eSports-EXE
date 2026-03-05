/** NJZ Central Portal - Enhanced JavaScript
 * Features: Orbital Navigation, Mobile Swipe, Scroll Animations, Keyboard Shortcuts
 * Version 2.0 - Performance Optimized
 */

(function() {
  'use strict';

  // === CONFIGURATION ===
  const CONFIG = {
    scrollOffset: 80,
    animationThreshold: 0.1,
    scrollDebounce: 16,
    swipeThreshold: 50,
    swipeTimeout: 300,
    statsDuration: 2000
  };

  // === UTILITY FUNCTIONS ===
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = window.innerWidth <= 768;

  // Throttle function for performance
  const throttle = (fn, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // === ORBITAL NAVIGATION ===
  function initOrbitalNavigation() {
    const orbitalNodes = $$('.orbit-node');
    if (!orbitalNodes.length) return;

    orbitalNodes.forEach(node => {
      // Hover effects with 3D tilt
      if (!isTouchDevice) {
        node.addEventListener('mouseenter', handleNodeHover);
        node.addEventListener('mouseleave', handleNodeLeave);
        node.addEventListener('mousemove', handleNodeTilt);
      }

      // Click to capture
      node.addEventListener('click', handleNodeCapture);

      // Keyboard navigation
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNodeCapture.call(node, e);
        }
      });
    });

    // Central logo interaction
    const centralLogo = $('.orbital-logo');
    if (centralLogo) {
      centralLogo.addEventListener('click', () => {
        showToast('NJZ Central - Command Center');
      });
    }
  }

  function handleNodeHover(e) {
    const node = e.currentTarget;
    const hubName = node.dataset.hub;
    node.style.zIndex = '100';
    
    // Play subtle sound if enabled
    if (window.njzAudioEnabled) {
      playHoverSound(hubName);
    }
  }

  function handleNodeLeave(e) {
    const node = e.currentTarget;
    node.style.zIndex = '';
    node.style.transform = '';
  }

  function handleNodeTilt(e) {
    if (prefersReducedMotion) return;
    
    const node = e.currentTarget;
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / centerY * -15;
    const rotateY = (x - centerX) / centerX * 15;

    node.querySelector('.node-core').style.transform = 
      `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
  }

  function handleNodeCapture(e) {
    const node = e.currentTarget;
    const hubName = node.dataset.hub;
    const hubUrl = node.getAttribute('href');

    // Add captured class for animation
    node.classList.add('captured');

    // Animate capture
    const core = node.querySelector('.node-core');
    if (core && !prefersReducedMotion) {
      core.style.transform = 'scale(0.8)';
      core.style.opacity = '0.5';
    }

    // Navigate after animation
    setTimeout(() => {
      window.location.href = hubUrl;
    }, prefersReducedMotion ? 0 : 400);

    // Analytics
    console.log(`[NJZ] Hub captured: ${hubName}`);
  }

  // === MOBILE NAVIGATION ===
  function initMobileNav() {
    const mobileNav = $('.mobile-nav');
    if (!mobileNav) return;

    const navItems = $$('.mobile-nav-item');
    
    // Update active state on scroll
    const sections = $$('section[id]');
    
    const updateActiveNav = throttle(() => {
      const scrollPos = window.scrollY + 200;
      
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.id;
        
        if (scrollPos >= top && scrollPos < top + height) {
          navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === id);
          });
        }
      });
    }, CONFIG.scrollDebounce);

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // Smooth scroll on click
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('href');
        const target = $(targetId);
        
        if (target) {
          const offset = target.offsetTop - 100;
          window.scrollTo({
            top: offset,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    });
  }

  // === STICKY UPGRADE CTA ===
  function initStickyCTA() {
    const stickyCTA = $('#stickyUpgrade');
    if (!stickyCTA || !isMobile) return;

    let lastScroll = 0;
    let shown = false;

    const checkScroll = throttle(() => {
      const currentScroll = window.scrollY;
      const heroHeight = $('#hero')?.offsetHeight || 600;
      
      // Show after scrolling past hero
      if (currentScroll > heroHeight && !shown) {
        stickyCTA.classList.add('visible');
        shown = true;
      } else if (currentScroll <= heroHeight && shown) {
        stickyCTA.classList.remove('visible');
        shown = false;
      }

      lastScroll = currentScroll;
    }, 100);

    window.addEventListener('scroll', checkScroll, { passive: true });
  }

  // === SWIPE NAVIGATION ===
  function initSwipeNavigation() {
    if (!isTouchDevice) return;

    let touchStartY = 0;
    let touchStartX = 0;
    let touchEndY = 0;
    let touchEndX = 0;
    let touchStartTime = 0;

    const sections = ['hero', 'hubs', 'tiers', 'stats', 'about'];

    document.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
      touchStartX = e.changedTouches[0].screenX;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;
      const deltaTime = Date.now() - touchStartTime;

      // Only handle vertical swipes that are fast enough
      if (Math.abs(deltaY) <= Math.abs(deltaX) || deltaTime > CONFIG.swipeTimeout) {
        return;
      }

      const currentSection = getCurrentSection();
      const currentIndex = sections.indexOf(currentSection);

      if (deltaY > CONFIG.swipeThreshold && currentIndex < sections.length - 1) {
        // Swipe up - go to next section
        scrollToSection(sections[currentIndex + 1]);
      } else if (deltaY < -CONFIG.swipeThreshold && currentIndex > 0) {
        // Swipe down - go to previous section
        scrollToSection(sections[currentIndex - 1]);
      }
    }

    function getCurrentSection() {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      
      for (const id of sections) {
        const section = $(`#${id}`);
        if (section) {
          const top = section.offsetTop;
          const bottom = top + section.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            return id;
          }
        }
      }
      return sections[0];
    }

    function scrollToSection(id) {
      const section = $(`#${id}`);
      if (section) {
        const offset = section.offsetTop - 80;
        window.scrollTo({
          top: offset,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    }
  }

  // === SCROLL-TRIGGERED ANIMATIONS ===
  function initScrollAnimations() {
    if (prefersReducedMotion) {
      // Make all elements visible immediately
      $$('[data-scroll-animate], [data-scroll-animate-group]').forEach(el => {
        el.classList.add('animated');
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: CONFIG.animationThreshold
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe individual elements
    $$('[data-scroll-animate]').forEach(el => observer.observe(el));

    // Observe groups
    $$('[data-scroll-animate-group]').forEach(el => observer.observe(el));
  }

  // === STATS COUNTER ANIMATION ===
  function initStatsCounter() {
    const statItems = $$('.stat-item');
    if (!statItems.length) return;

    const observerOptions = {
      root: null,
      threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    statItems.forEach(item => observer.observe(item));

    function animateCounter(item) {
      const valueEl = item.querySelector('.stat-value');
      if (!valueEl) return;

      const targetValue = parseFloat(valueEl.dataset.count);
      const isDecimal = targetValue % 1 !== 0;
      const duration = prefersReducedMotion ? 0 : CONFIG.statsDuration;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out-cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = targetValue * easeOut;

        if (isDecimal) {
          valueEl.textContent = current.toFixed(2);
        } else {
          valueEl.textContent = Math.floor(current).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          // Final value
          if (isDecimal) {
            valueEl.textContent = targetValue.toFixed(2);
          } else {
            valueEl.textContent = targetValue.toLocaleString();
          }
        }
      }

      requestAnimationFrame(update);
    }
  }

  // === KEYBOARD NAVIGATION ===
  function initKeyboardNavigation() {
    let shortcutsVisible = false;
    const shortcutsOverlay = $('#keyboardShortcuts');

    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Show/hide shortcuts with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleShortcuts();
        return;
      }

      // Close shortcuts with Escape
      if (e.key === 'Escape' && shortcutsVisible) {
        hideShortcuts();
        return;
      }

      // Section navigation with number keys
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const sectionMap = {
          '1': 'hubs',
          '2': 'tiers',
          '3': 'stats',
          '4': 'about'
        };

        if (sectionMap[e.key]) {
          e.preventDefault();
          scrollToSection(sectionMap[e.key]);
        }
      }

      // Orbital hub navigation
      const hubMap = {
        'ArrowUp': 'sator',
        'ArrowRight': 'rotas',
        'ArrowDown': 'information',
        'ArrowLeft': 'games'
      };

      if (hubMap[e.key] && isOrbitalVisible()) {
        e.preventDefault();
        focusHub(hubMap[e.key]);
      }
    });

    function toggleShortcuts() {
      shortcutsVisible = !shortcutsVisible;
      shortcutsOverlay?.classList.toggle('visible', shortcutsVisible);
      shortcutsOverlay?.setAttribute('aria-hidden', !shortcutsVisible);
    }

    function hideShortcuts() {
      shortcutsVisible = false;
      shortcutsOverlay?.classList.remove('visible');
      shortcutsOverlay?.setAttribute('aria-hidden', 'true');
    }

    // Close on overlay click
    shortcutsOverlay?.addEventListener('click', (e) => {
      if (e.target === shortcutsOverlay) {
        hideShortcuts();
      }
    });
  }

  function isOrbitalVisible() {
    const orbital = $('.orbital-section');
    if (!orbital) return false;
    const rect = orbital.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function focusHub(hubName) {
    const hub = $(`.orbit-node[data-hub="${hubName}"]`);
    if (hub) {
      hub.focus();
      hub.classList.add('captured');
      setTimeout(() => hub.classList.remove('captured'), 500);
    }
  }

  function scrollToSection(id) {
    const section = $(`#${id}`);
    if (section) {
      const offset = section.offsetTop - CONFIG.scrollOffset;
      window.scrollTo({
        top: offset,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  }

  // === TWIN FILE INTERACTIONS ===
  function initTwinFileInteractions() {
    const preview = $('.twin-file-preview-enhanced');
    if (!preview) return;

    const hashEl = preview.querySelector('[data-hash]');
    const sides = preview.querySelectorAll('.twin-file-side');

    // Animate hash on hover
    sides.forEach(side => {
      side.addEventListener('mouseenter', () => {
        if (hashEl && !prefersReducedMotion) {
          scrambleText(hashEl);
        }
      });
    });

    function scrambleText(element) {
      const chars = '0123456789abcdef';
      const original = element.textContent;
      let iterations = 0;
      const maxIterations = 8;

      const interval = setInterval(() => {
        element.textContent = Array(6)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join('') + '...';

        iterations++;
        if (iterations >= maxIterations) {
          clearInterval(interval);
          element.textContent = original;
        }
      }, 50);
    }
  }

  // === MEMBERSHIP TIER INTERACTIONS ===
  function initMembershipTiers() {
    const tiers = $$('.tier');
    
    tiers.forEach(tier => {
      const cta = tier.querySelector('.tier-cta');
      
      cta?.addEventListener('click', (e) => {
        const tierName = tier.dataset.tier;
        
        if (tierName === 'premium') {
          // Show upgrade modal or redirect
          showToast('Redirecting to upgrade...');
        } else {
          showToast('Welcome to NJZ!');
        }
      });
    });
  }

  // === TOAST NOTIFICATIONS ===
  function showToast(message) {
    // Remove existing toast
    const existing = $('.toast-notification');
    existing?.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
      </div>
    `;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--njz-deep-space);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      padding: var(--ma-md) var(--ma-lg);
      z-index: 9999;
      transition: transform 0.3s var(--ease-toroidal);
      font-family: var(--font-body);
      font-size: 0.875rem;
      color: var(--njz-porcelain);
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // === LAZY LOADING ===
  function initLazyLoading() {
    // Lazy load images with data-src
    const lazyImages = $$('img[data-src]');
    
    if ('IntersectionObserver' in window && lazyImages.length) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '50px' });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback
      lazyImages.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      });
    }

    // Lazy load sections with content-visibility
    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('loaded');
          }
        });
      }, { rootMargin: '100px' });

      $$('.lazy-section').forEach(section => {
        sectionObserver.observe(section);
      });
    }
  }

  // === NAV SCROLL EFFECT ===
  function initNavScroll() {
    const nav = $('.main-nav');
    if (!nav) return;

    let lastScroll = 0;

    const updateNav = throttle(() => {
      const currentScroll = window.pageYOffset;
      
      // Add background blur after scrolling
      if (currentScroll > 50) {
        nav.style.background = 'rgba(10, 10, 15, 0.98)';
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.4)';
      } else {
        nav.style.background = 'rgba(10, 10, 15, 0.8)';
        nav.style.boxShadow = 'none';
      }

      lastScroll = currentScroll;
    }, CONFIG.scrollDebounce);

    window.addEventListener('scroll', updateNav, { passive: true });
  }

  // === PERFORMANCE MONITORING ===
  function initPerformanceMonitoring() {
    if (window.performance && performance.mark) {
      performance.mark('njz-enhanced-init-start');

      window.addEventListener('load', () => {
        performance.mark('njz-enhanced-init-end');
        performance.measure('njz-enhanced-init', 
          'njz-enhanced-init-start', 
          'njz-enhanced-init-end'
        );

        const measure = performance.getEntriesByName('njz-enhanced-init')[0];
        console.log(`[NJZ] Enhanced portal initialized in ${measure.duration.toFixed(2)}ms`);

        // Log Core Web Vitals if available
        if (performance.getEntriesByType) {
          const paintEntries = performance.getEntriesByType('paint');
          paintEntries.forEach(entry => {
            console.log(`[NJZ] ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          });
        }
      });
    }

    // Detect slow devices and reduce animations
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      document.body.classList.add('reduce-motion');
    }
  }

  // === OFFLINE SUPPORT ===
  function initOfflineSupport() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Service worker registration placeholder
        // navigator.serviceWorker.register('/sw.js');
      });
    }

    // Online/offline events
    window.addEventListener('online', () => {
      showToast('Back online');
    });

    window.addEventListener('offline', () => {
      showToast('You are offline');
    });
  }

  // === INITIALIZATION ===
  function init() {
    initOrbitalNavigation();
    initMobileNav();
    initStickyCTA();
    initSwipeNavigation();
    initScrollAnimations();
    initStatsCounter();
    initKeyboardNavigation();
    initTwinFileInteractions();
    initMembershipTiers();
    initLazyLoading();
    initNavScroll();
    initPerformanceMonitoring();
    initOfflineSupport();

    console.log('[NJZ] Central Portal Enhanced v2.0 initialized');
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
