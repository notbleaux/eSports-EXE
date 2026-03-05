/** NJZ Central Portal - Interactive JavaScript
 * Features: Hub animations, scroll effects, mobile nav, stat counters
 */

(function() {
  'use strict';

  // === UTILITIES ===
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  // === MOBILE NAVIGATION ===
  function initMobileNav() {
    const menuToggle = $('#mobileMenuToggle');
    const mainNav = $('#mainNav');
    
    if (!menuToggle || !mainNav) return;

    let isOpen = false;

    function toggleMenu() {
      isOpen = !isOpen;
      menuToggle.classList.toggle('active', isOpen);
      mainNav.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMenu() {
      if (isOpen) {
        isOpen = false;
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    menuToggle.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    $$('.nav-link', mainNav).forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    });
  }

  // === SMOOTH SCROLLING ===
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = $(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = $('.main-nav')?.offsetHeight || 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      // Update focus for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  // === SCROLL-BASED ANIMATIONS ===
  function initScrollAnimations() {
    if (prefersReducedMotion) return;

    const animatedElements = $$('[data-animate]');
    if (animatedElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
  }

  // === NAV SCROLL EFFECT ===
  function initNavScroll() {
    const nav = $('.main-nav');
    if (!nav) return;

    let lastScroll = 0;
    let ticking = false;

    function updateNav() {
      const currentScroll = window.pageYOffset;
      
      // Add background blur after scrolling
      if (currentScroll > 50) {
        nav.style.background = 'rgba(10, 10, 15, 0.95)';
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
      } else {
        nav.style.background = 'rgba(10, 10, 15, 0.8)';
        nav.style.boxShadow = 'none';
      }

      // Hide/show on scroll direction (mobile only)
      if (window.innerWidth <= 768) {
        if (currentScroll > lastScroll && currentScroll > 100) {
          nav.style.transform = 'translateY(-100%)';
        } else {
          nav.style.transform = 'translateY(0)';
        }
      }

      lastScroll = currentScroll;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });
  }

  // === TWIN FILE ANIMATIONS ===
  function initTwinFileAnimations() {
    const twinFile = $('.twin-file-preview');
    if (!twinFile || prefersReducedMotion) return;

    const hashValue = twinFile.querySelector('.hash-value');
    const rawsSide = twinFile.querySelector('.raws-side');
    const baseSide = twinFile.querySelector('.base-side');

    // Simulate hash update on hover
    twinFile.addEventListener('mouseenter', () => {
      if (hashValue) {
        animateHash(hashValue);
      }
    });

    function animateHash(element) {
      const chars = '0123456789abcdef';
      const original = element.textContent;
      let iterations = 0;
      const maxIterations = 10;

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

    // Parallax effect on scroll
    if (!isTouchDevice) {
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const rect = twinFile.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const distance = (centerY - viewportCenter) / viewportCenter;
            
            const translateY = distance * 20;
            twinFile.style.transform = `translateY(${translateY}px)`;
            
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // === HUB CARD INTERACTIONS ===
  function initHubCards() {
    const hubCards = $$('.hub-card');
    
    hubCards.forEach(card => {
      // 3D tilt effect on hover (desktop only)
      if (!isTouchDevice && !prefersReducedMotion) {
        card.addEventListener('mousemove', handleTilt);
        card.addEventListener('mouseleave', resetTilt);
      }

      // Click tracking for analytics
      card.addEventListener('click', () => {
        const hubName = card.querySelector('.hub-name')?.textContent;
        if (hubName) {
          console.log(`[NJZ] Navigating to hub: ${hubName}`);
        }
      });
    });

    function handleTilt(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / centerY * -5;
      const rotateY = (x - centerX) / centerX * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    }

    function resetTilt(e) {
      e.currentTarget.style.transform = '';
    }
  }

  // === STATS COUNTER ANIMATION ===
  function initStatsCounter() {
    const statItems = $$('.stat-item');
    if (statItems.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
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
      const duration = prefersReducedMotion ? 0 : 2000;
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

  // === MEMBERSHIP TIER INTERACTIONS ===
  function initMembershipTiers() {
    const tiers = $$('.tier');
    
    tiers.forEach(tier => {
      tier.addEventListener('mouseenter', () => {
        // Add subtle glow boost
        const glow = tier.querySelector('.tier-glow');
        if (glow) {
          glow.style.opacity = '0.2';
        }
      });

      tier.addEventListener('mouseleave', () => {
        const glow = tier.querySelector('.tier-glow');
        if (glow) {
          glow.style.opacity = '';
        }
      });
    });

    // CTA button interactions
    $$('.tier-cta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tierName = btn.closest('.tier')?.querySelector('.tier-name')?.textContent;
        if (tierName) {
          e.preventDefault();
          showComingSoon(tierName);
        }
      });
    });
  }

  // === SCROLL INDICATOR ===
  function initScrollIndicator() {
    const indicator = $('.hero-scroll-indicator');
    if (!indicator) return;

    // Hide after scrolling past hero
    const hero = $('.hero');
    if (!hero) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        indicator.style.opacity = entry.isIntersecting ? '1' : '0';
        indicator.style.pointerEvents = entry.isIntersecting ? 'auto' : 'none';
      });
    }, { threshold: 0.5 });

    observer.observe(hero);
  }

  // === UTILITY FUNCTIONS ===
  function showComingSoon(feature) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">🚀</span>
        <span class="toast-message">${feature} - Coming Soon!</span>
      </div>
    `;
    
    // Add toast styles
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--njz-slate);
      border: var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--ma-md) var(--ma-lg);
      z-index: 9999;
      transition: transform 0.3s var(--ease-toroidal);
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

  // === KEYBOARD NAVIGATION ===
  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Press '/' to focus search (if we had one)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          // Could focus a search input here
        }
      }

      // Press '?' to show shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showKeyboardShortcuts();
      }
    });
  }

  function showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
      <div class="shortcuts-overlay"></div>
      <div class="shortcuts-content">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts-list">
          <div><kbd>?</kbd> <span>Show shortcuts</span></div>
          <div><kbd>Esc</kbd> <span>Close menu/modal</span></div>
          <div><kbd>Tab</kbd> <span>Navigate elements</span></div>
        </div>
        <button class="btn btn-ghost" onclick="this.closest('.shortcuts-modal').remove()">Close</button>
      </div>
    `;

    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.querySelector('.shortcuts-overlay').style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    `;

    modal.querySelector('.shortcuts-content').style.cssText = `
      position: relative;
      background: var(--njz-deep-space);
      border: var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: var(--ma-2xl);
      min-width: 300px;
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('shortcuts-overlay')) {
        modal.remove();
      }
    });

    document.addEventListener('keydown', function closeOnEsc(e) {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', closeOnEsc);
      }
    });

    document.body.appendChild(modal);
  }

  // === PERFORMANCE MONITORING ===
  function initPerformanceMonitoring() {
    if (window.performance && performance.mark) {
      performance.mark('njz-central-init-start');

      window.addEventListener('load', () => {
        performance.mark('njz-central-init-end');
        performance.measure('njz-central-init', 'njz-central-init-start', 'njz-central-init-end');

        const measure = performance.getEntriesByName('njz-central-init')[0];
        console.log(`[NJZ] Portal initialized in ${measure.duration.toFixed(2)}ms`);
      });
    }
  }

  // === INITIALIZATION ===
  function init() {
    initMobileNav();
    initSmoothScroll();
    initScrollAnimations();
    initNavScroll();
    initTwinFileAnimations();
    initHubCards();
    initStatsCounter();
    initMembershipTiers();
    initScrollIndicator();
    initKeyboardNav();
    initPerformanceMonitoring();

    console.log('[NJZ] Central Portal initialized');
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
