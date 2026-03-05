/**
 * ROTAS Hub Mobile Utilities
 * Handles scroll behavior and mobile-specific interactions
 */

(function() {
  'use strict';

  // Bottom nav hide on scroll
  let lastScrollY = window.scrollY;
  let ticking = false;
  const bottomNav = document.querySelector('.bottom-nav');

  function updateBottomNav() {
    if (!bottomNav) return;
    
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;
    
    // Hide when scrolling down, show when scrolling up
    if (scrollDelta > 5 && currentScrollY > 100) {
      bottomNav.style.transform = 'translateY(100%)';
    } else if (scrollDelta < -5) {
      bottomNav.style.transform = 'translateY(0)';
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateBottomNav);
      ticking = true;
    }
  }

  // Initialize scroll listener
  window.addEventListener('scroll', requestTick, { passive: true });

  // Handle visibilitychange to pause/resume animations
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause expensive animations
      document.body.classList.add('animations-paused');
    } else {
      document.body.classList.remove('animations-paused');
    }
  });

  // Console welcome message
  console.log('%c ROTAS Analytics Hub ', 'background: #00f0ff; color: #0a0a0f; font-size: 12px; font-weight: bold; padding: 3px 8px;');

})();
