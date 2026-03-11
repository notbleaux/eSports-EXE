[Ver004.000]
/**
 * NJZ Quarter Grid JavaScript
 * SATOR eSports - Phase 1A Implementation
 * 
 * Handles grid interactions, animations, keyboard navigation,
 * and ambient effects for the NJZ Quarter Grid landing page.
 */

(function() {
  'use strict';

  // ========================================
  // CONFIGURATION
  // ========================================
  const CONFIG = {
    particleCount: 30,
    particleColors: ['#00d4ff', '#ffd700', '#ff4655', '#00ff88'],
    animationDuration: 8000,
    keyboardNavigation: true,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  // ========================================
  // DOM ELEMENTS
  // ========================================
  const elements = {
    particles: document.getElementById('particles'),
    quadrants: document.querySelectorAll('.njz-quadrant'),
    centerButton: document.getElementById('njzCenterBtn'),
    grid: document.querySelector('.njz-quarter-grid')
  };

  // ========================================
  // PARTICLE SYSTEM
  // ========================================
  const ParticleSystem = {
    particles: [],
    isActive: false,

    init() {
      if (CONFIG.reducedMotion || !elements.particles) return;
      
      this.isActive = true;
      this.createParticles();
      
      // Pause animations when tab is hidden
      document.addEventListener('visibilitychange', () => {
        this.isActive = document.visibilityState === 'visible';
      });
    },

    createParticles() {
      for (let i = 0; i < CONFIG.particleCount; i++) {
        this.createParticle(i);
      }
    },

    createParticle(index) {
      const particle = document.createElement('div');
      particle.className = 'njz-particle';
      
      // Random properties
      const size = Math.random() * 3 + 1;
      const left = Math.random() * 100;
      const delay = Math.random() * CONFIG.animationDuration;
      const duration = CONFIG.animationDuration + Math.random() * 4000;
      const color = CONFIG.particleColors[Math.floor(Math.random() * CONFIG.particleColors.length)];
      
      // Apply styles
      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        background: ${color};
        animation-delay: ${delay}ms;
        animation-duration: ${duration}ms;
        opacity: ${Math.random() * 0.5 + 0.3};
      `;
      
      elements.particles.appendChild(particle);
      this.particles.push(particle);
    },

    destroy() {
      this.particles.forEach(p => p.remove());
      this.particles = [];
      this.isActive = false;
    }
  };

  // ========================================
  // QUADRANT INTERACTIONS
  // ========================================
  const QuadrantManager = {
    currentIndex: -1,

    init() {
      this.bindEvents();
      this.setupKeyboardNavigation();
    },

    bindEvents() {
      elements.quadrants.forEach((quadrant, index) => {
        // Mouse enter
        quadrant.addEventListener('mouseenter', () => {
          this.onQuadrantEnter(quadrant);
        });

        // Mouse leave
        quadrant.addEventListener('mouseleave', () => {
          this.onQuadrantLeave(quadrant);
        });

        // Focus for keyboard navigation
        quadrant.addEventListener('focus', () => {
          this.currentIndex = index;
          quadrant.classList.add('focused');
        }, true);

        quadrant.addEventListener('blur', () => {
          quadrant.classList.remove('focused');
        }, true);

        // Click tracking (for analytics)
        const link = quadrant.querySelector('.njz-quadrant__link');
        if (link) {
          link.addEventListener('click', (e) => {
            this.onQuadrantClick(quadrant, e);
          });
        }
      });
    },

    onQuadrantEnter(quadrant) {
      // Add glow effect intensity
      const glow = quadrant.querySelector('.njz-quadrant__glow');
      if (glow) {
        glow.style.opacity = '1';
      }

      // Update center button color to match quadrant theme
      this.updateCenterButtonTheme(quadrant.dataset.hub);
    },

    onQuadrantLeave(quadrant) {
      // Reset center button to default
      this.updateCenterButtonTheme(null);
    },

    onQuadrantClick(quadrant, event) {
      const hubType = quadrant.dataset.hub;
      
      // Log interaction (placeholder for analytics)
      console.log(`[NJZ Grid] Navigating to ${hubType} HUB`);
      
      // Add exit animation
      this.animateExit(quadrant);
    },

    updateCenterButtonTheme(hubType) {
      if (!elements.centerButton) return;

      const themes = {
        'stat-ref': 'linear-gradient(135deg, #1E3A5F 0%, #00d4ff 100%)',
        'analytics': 'linear-gradient(135deg, #6B46C1 0%, #ffd700 100%)',
        'esports': 'linear-gradient(135deg, #FF4655 0%, #ffd700 100%)',
        'fantasy': 'linear-gradient(135deg, #00FF88 0%, #00d4ff 100%)'
      };

      if (hubType && themes[hubType]) {
        elements.centerButton.style.background = themes[hubType];
      } else {
        elements.centerButton.style.background = '';
      }
    },

    animateExit(quadrant) {
      if (CONFIG.reducedMotion) return;

      // Fade out other quadrants
      elements.quadrants.forEach(q => {
        if (q !== quadrant) {
          q.style.opacity = '0.3';
          q.style.transform = 'scale(0.98)';
        }
      });

      // Highlight clicked quadrant
      quadrant.style.transform = 'scale(1.02)';
      quadrant.style.zIndex = '10';
    },

    setupKeyboardNavigation() {
      if (!CONFIG.keyboardNavigation) return;

      document.addEventListener('keydown', (e) => {
        // Only handle arrow keys when not in an input
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
          return;
        }

        switch(e.key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
            e.preventDefault();
            this.navigateWithArrows(e.key);
            break;
          case 'Enter':
            if (this.currentIndex >= 0) {
              const link = elements.quadrants[this.currentIndex].querySelector('a');
              if (link) link.click();
            }
            break;
          case 'Escape':
            this.resetFocus();
            break;
        }
      });
    },

    navigateWithArrows(key) {
      const gridMap = [
        [0, 1],  // Top row: stat-ref, analytics
        [2, 3]   // Bottom row: esports, fantasy
      ];

      let currentRow = -1;
      let currentCol = -1;

      // Find current position
      for (let r = 0; r < gridMap.length; r++) {
        for (let c = 0; c < gridMap[r].length; c++) {
          if (gridMap[r][c] === this.currentIndex) {
            currentRow = r;
            currentCol = c;
          }
        }
      }

      // If no selection, start at top-left
      if (currentRow === -1) {
        this.focusQuadrant(0);
        return;
      }

      // Calculate new position
      let newRow = currentRow;
      let newCol = currentCol;

      switch(key) {
        case 'ArrowUp':
          newRow = Math.max(0, currentRow - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(1, currentRow + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, currentCol - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(1, currentCol + 1);
          break;
      }

      const newIndex = gridMap[newRow][newCol];
      if (newIndex !== this.currentIndex) {
        this.focusQuadrant(newIndex);
      }
    },

    focusQuadrant(index) {
      const quadrant = elements.quadrants[index];
      if (quadrant) {
        const link = quadrant.querySelector('a');
        if (link) {
          link.focus();
          this.currentIndex = index;
        }
      }
    },

    resetFocus() {
      this.currentIndex = -1;
      elements.quadrants.forEach(q => {
        q.classList.remove('focused');
      });
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }
  };

  // ========================================
  // CENTER BUTTON
  // ========================================
  const CenterButton = {
    init() {
      if (!elements.centerButton) return;

      elements.centerButton.addEventListener('click', this.onClick.bind(this));
      elements.centerButton.addEventListener('mouseenter', this.onEnter.bind(this));
      elements.centerButton.addEventListener('mouseleave', this.onLeave.bind(this));
    },

    onClick(e) {
      e.preventDefault();
      
      // Pulse animation
      this.pulse();
      
      // Navigate to help hub
      setTimeout(() => {
        window.location.href = './help/';
      }, 300);
    },

    onEnter() {
      // Intensify glow
      elements.centerButton.style.animationDuration = '1.5s';
    },

    onLeave() {
      // Reset glow
      elements.centerButton.style.animationDuration = '';
    },

    pulse() {
      elements.centerButton.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => {
        elements.centerButton.style.transform = '';
      }, 150);
    }
  };

  // ========================================
  // ENTRANCE ANIMATIONS
  // ========================================
  const EntranceAnimator = {
    init() {
      if (CONFIG.reducedMotion) return;

      // Staggered entrance for quadrants
      elements.quadrants.forEach((quadrant, index) => {
        quadrant.style.opacity = '0';
        quadrant.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          quadrant.style.transition = 'all 0.5s ease';
          quadrant.style.opacity = '1';
          quadrant.style.transform = 'translateY(0)';
        }, 100 + (index * 150));
      });

      // Center button entrance
      if (elements.centerButton) {
        elements.centerButton.style.opacity = '0';
        elements.centerButton.style.transform = 'translate(-50%, -50%) scale(0.5)';
        
        setTimeout(() => {
          elements.centerButton.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
          elements.centerButton.style.opacity = '1';
          elements.centerButton.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 600);
      }
    }
  };

  // ========================================
  // TOUCH DEVICE DETECTION
  // ========================================
  const TouchDevice = {
    init() {
      if (this.isTouchDevice()) {
        document.body.classList.add('touch-device');
        this.adjustForTouch();
      }
    },

    isTouchDevice() {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    },

    adjustForTouch() {
      // Make quadrants easier to tap
      elements.quadrants.forEach(quadrant => {
        quadrant.style.minHeight = '120px';
      });

      // Larger touch target for center button
      if (elements.centerButton) {
        elements.centerButton.style.width = '64px';
        elements.centerButton.style.height = '64px';
      }
    }
  };

  // ========================================
  // RESIZE HANDLER
  // ========================================
  const ResizeHandler = {
    timeout: null,

    init() {
      window.addEventListener('resize', this.onResize.bind(this));
    },

    onResize() {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        // Recalculate layout if needed
        this.adjustLayout();
      }, 250);
    },

    adjustLayout() {
      // Handle orientation changes or significant resizes
      const width = window.innerWidth;
      
      if (width < 768) {
        // Mobile layout adjustments
        document.body.classList.add('mobile-layout');
        document.body.classList.remove('desktop-layout');
      } else {
        // Desktop layout
        document.body.classList.add('desktop-layout');
        document.body.classList.remove('mobile-layout');
      }
    }
  };

  // ========================================
  // ACCESSIBILITY HELPERS
  // ========================================
  const Accessibility = {
    init() {
      this.announcePageLoad();
      this.setupFocusManagement();
    },

    announcePageLoad() {
      // Create live region for screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'SATOR HUBs page loaded. Four HUBs available: Statistical Reference, Advanced Analytics, eSports, and Fantasy eSports. Use arrow keys to navigate.';
      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => announcement.remove(), 3000);
    },

    setupFocusManagement() {
      // Ensure visible focus indicators
      document.addEventListener('mousedown', () => {
        document.body.classList.add('using-mouse');
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          document.body.classList.remove('using-mouse');
        }
      });
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeComponents);
    } else {
      initializeComponents();
    }
  }

  function initializeComponents() {
    // Initialize all modules
    ParticleSystem.init();
    QuadrantManager.init();
    CenterButton.init();
    EntranceAnimator.init();
    TouchDevice.init();
    ResizeHandler.init();
    Accessibility.init();

    console.log('[NJZ Grid] Initialized successfully');
  }

  // Start the application
  init();

})();
