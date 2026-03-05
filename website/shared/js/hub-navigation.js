/**
 * NJZ Hub Navigation Utilities
 * Cross-hub navigation and state management for SATOR and ROTAS
 */

(function() {
  'use strict';

  // Hub configuration
  const HUBS = {
    sator: {
      id: 'sator',
      name: 'SATOR',
      title: 'Statistical Database Hub',
      color: '#ff9f1c',
      icon: '◎',
      path: '/website/hub1-sator/',
      description: 'Raw Data Archive'
    },
    rotas: {
      id: 'rotas',
      name: 'ROTAS',
      title: 'Analytics Hub',
      color: '#00f0ff',
      icon: '◈',
      path: '/website/hub2-rotas/',
      description: 'Probability Engines'
    }
  };

  // Current hub detection
  function getCurrentHub() {
    const path = window.location.pathname;
    if (path.includes('hub1-sator') || path.includes('sator')) {
      return HUBS.sator;
    }
    if (path.includes('hub2-rotas') || path.includes('rotas')) {
      return HUBS.rotas;
    }
    return null;
  }

  // Get opposite hub for cross-navigation
  function getOppositeHub(currentHubId) {
    return currentHubId === 'sator' ? HUBS.rotas : HUBS.sator;
  }

  // Build cross-hub link with params
  function buildHubLink(targetHubId, params = {}) {
    const targetHub = HUBS[targetHubId];
    if (!targetHub) return '#';
    
    const url = new URL(targetHub.path, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.pathname + url.search;
  }

  // Parse URL parameters
  function getUrlParams() {
    return new URLSearchParams(window.location.search);
  }

  // Check if mobile viewport
  function isMobile() {
    return window.innerWidth <= 768;
  }

  // Check if touch device
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Mobile menu toggle
  function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-drawer');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (!menuToggle || !mobileMenu) return;

    function toggleMenu() {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', !isOpen);
      menuToggle.classList.toggle('active', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
      
      if (overlay) {
        overlay.classList.toggle('visible', !isOpen);
      }
    }

    menuToggle.addEventListener('click', toggleMenu);
    
    if (overlay) {
      overlay.addEventListener('click', toggleMenu);
    }

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        toggleMenu();
      }
    });
  }

  // Bottom navigation initialization
  function initBottomNav() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;

    const currentHub = getCurrentHub();
    const tabs = bottomNav.querySelectorAll('.nav-tab');

    tabs.forEach(tab => {
      const hubId = tab.dataset.hub;
      if (hubId === currentHub?.id) {
        tab.classList.add('active');
      }

      tab.addEventListener('click', (e) => {
        if (hubId === currentHub?.id) {
          e.preventDefault();
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  // Hub bridge initialization
  function initHubBridge() {
    const bridge = document.querySelector('.hub-bridge');
    if (!bridge) return;

    const currentHub = getCurrentHub();
    if (!currentHub) return;

    const oppositeHub = getOppositeHub(currentHub.id);
    
    // Update bridge data
    bridge.dataset.from = currentHub.id;
    bridge.dataset.to = oppositeHub.id;

    // Animate data flow
    const dataFlow = bridge.querySelector('.data-flow');
    if (dataFlow) {
      // Trigger animation based on current hub
      dataFlow.style.animationDirection = currentHub.id === 'sator' ? 'normal' : 'reverse';
    }
  }

  // Cross-hub link initialization
  function initCrossHubLinks() {
    const currentHub = getCurrentHub();
    if (!currentHub) return;

    const oppositeHub = getOppositeHub(currentHub.id);
    const links = document.querySelectorAll('[data-cross-hub]');

    links.forEach(link => {
      const preserveParams = link.dataset.preserveParams === 'true';
      const params = preserveParams ? Object.fromEntries(getUrlParams()) : {};
      
      // Add context parameter
      params.from = currentHub.id;
      
      link.href = buildHubLink(oppositeHub.id, params);
      
      // Add visual indicator
      if (!link.querySelector('.hub-arrow')) {
        const arrow = document.createElement('span');
        arrow.className = 'hub-arrow';
        arrow.innerHTML = currentHub.id === 'sator' ? '→' : '←';
        link.appendChild(arrow);
      }
    });
  }

  // Loading state management
  const LoadingState = {
    overlay: null,
    terminal: null,
    messages: [],
    
    init() {
      this.overlay = document.querySelector('.loading-overlay');
      this.terminal = document.querySelector('.loading-terminal');
      
      if (!this.overlay) {
        this.createOverlay();
      }
    },

    createOverlay() {
      // Remove existing overlay if present to prevent duplicates
      const existing = document.querySelector('.loading-overlay');
      if (existing) existing.remove();
      
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = `
        <div class="loading-terminal">
          <div class="terminal-header">
            <span class="terminal-dot red"></span>
            <span class="terminal-dot yellow"></span>
            <span class="terminal-dot green"></span>
            <span class="terminal-title">njz_hub_loader</span>
          </div>
          <div class="terminal-body">
            <div class="terminal-output"></div>
            <div class="terminal-input">
              <span class="prompt">$</span>
              <span class="cursor">_</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(this.overlay);
      this.terminal = this.overlay.querySelector('.loading-terminal');
    },

    show(messages = []) {
      this.init();
      this.messages = messages.length ? messages : this.getDefaultMessages();
      this.overlay.classList.add('visible');
      this.animateMessages();
    },

    hide() {
      if (this.overlay) {
        this.overlay.classList.remove('visible');
      }
    },

    getDefaultMessages() {
      const currentHub = getCurrentHub();
      return [
        `Initializing ${currentHub?.name || 'Hub'} connection...`,
        'Loading data streams...',
        'Verifying integrity...',
        'Rendering interface...'
      ];
    },

    animateMessages() {
      const output = this.terminal.querySelector('.terminal-output');
      output.innerHTML = '';
      
      let delay = 0;
      this.messages.forEach((msg, i) => {
        delay += 300 + Math.random() * 400;
        setTimeout(() => {
          const line = document.createElement('div');
          line.className = 'terminal-line';
          line.innerHTML = `<span class="timestamp">${new Date().toLocaleTimeString()}</span> ${msg}`;
          output.appendChild(line);
          output.scrollTop = output.scrollHeight;
        }, delay);
      });

      // Auto-hide after all messages
      setTimeout(() => this.hide(), delay + 800);
    }
  };

  // Error handling
  const ErrorHandler = {
    container: null,

    init() {
      this.container = document.querySelector('.error-container');
      if (!this.container) {
        this.createContainer();
      }
    },

    createContainer() {
      // Check if container already exists to prevent duplicates
      this.container = document.querySelector('.error-container');
      if (this.container) return;
      
      this.container = document.createElement('div');
      this.container.className = 'error-container';
      document.body.appendChild(this.container);
    },

    show(message, type = 'error', duration = 5000) {
      this.init();
      
      const errorEl = document.createElement('div');
      errorEl.className = `error-toast ${type}`;
      errorEl.innerHTML = `
        <span class="error-icon">${type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
        <span class="error-message">${message}</span>
        <button class="error-close">×</button>
      `;

      errorEl.querySelector('.error-close').addEventListener('click', () => {
        errorEl.remove();
      });

      this.container.appendChild(errorEl);

      // Trigger animation
      requestAnimationFrame(() => {
        errorEl.classList.add('visible');
      });

      // Auto remove
      if (duration > 0) {
        setTimeout(() => {
          errorEl.classList.remove('visible');
          setTimeout(() => errorEl.remove(), 300);
        }, duration);
      }
    },

    hideAll() {
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  };

  // Initialize all components
  function init() {
    initMobileMenu();
    initBottomNav();
    initHubBridge();
    initCrossHubLinks();
    
    // Expose API
    window.NJZHub = {
      HUBS,
      getCurrentHub,
      getOppositeHub,
      buildHubLink,
      getUrlParams,
      isMobile,
      isTouchDevice,
      LoadingState,
      ErrorHandler
    };

    console.log('%c NJZ Hub Navigation ', 'background: #ff9f1c; color: #0a0a0f; font-size: 12px; font-weight: bold; padding: 3px 8px;');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
