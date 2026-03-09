/**
 * Navigation Module - Hub Switching Logic
 */

class HubNavigation {
  constructor() {
    this.hubs = [
      { id: 'hub1', name: 'satorXrotas', color: '#D4AF37', path: '../hub1-satorxrotas/index.html' },
      { id: 'hub2', name: 'eSports-EXE', color: '#00F0FF', path: '../hub2-esports/index.html' },
      { id: 'hub3', name: 'Dashboard', color: '#008080', path: '../hub3-dashboard/index.html' },
      { id: 'hub4', name: 'Directory', color: '#1E90FF', path: '../hub4-directory/index.html' }
    ];
    this.currentHub = null;
    this.init();
  }

  init() {
    this.detectCurrentHub();
    this.setupKeyboardNavigation();
    this.setupSwipeNavigation();
  }

  /**
   * Detect which hub we're currently viewing
   */
  detectCurrentHub() {
    const path = window.location.pathname;
    this.currentHub = this.hubs.find(h => path.includes(h.id)) || null;
    
    if (this.currentHub) {
      document.body.setAttribute('data-current-hub', this.currentHub.id);
      this.highlightCurrentHub();
    }
  }

  /**
   * Highlight the current hub in navigation
   */
  highlightCurrentHub() {
    const cards = document.querySelectorAll('.hub-card');
    cards.forEach(card => {
      const hubId = card.getAttribute('data-hub');
      if (hubId === this.currentHub?.id) {
        card.classList.add('hub-card--active');
        card.style.borderColor = this.currentHub.color;
        card.style.boxShadow = `0 0 30px ${this.currentHub.color}40`;
      }
    });
  }

  /**
   * Navigate to a specific hub
   */
  navigateToHub(hubId) {
    const hub = this.hubs.find(h => h.id === hubId);
    if (hub && hub.id !== this.currentHub?.id) {
      // Store navigation state
      StateManager.set('lastNavigation', {
        from: this.currentHub?.id || 'main',
        to: hub.id,
        timestamp: Date.now()
      });
      
      // Apply transition effect
      this.transitionToHub(hub);
    }
  }

  /**
   * Apply transition animation before navigation
   */
  transitionToHub(hub) {
    const transition = document.createElement('div');
    transition.className = 'page-transition';
    transition.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${hub.color};
      z-index: 9999;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(transition);

    // Trigger animation
    requestAnimationFrame(() => {
      transition.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        window.location.href = hub.path;
      }, 400);
    });
  }

  /**
   * Navigate to next hub
   */
  nextHub() {
    if (!this.currentHub) return;
    const currentIndex = this.hubs.findIndex(h => h.id === this.currentHub.id);
    const nextIndex = (currentIndex + 1) % this.hubs.length;
    this.navigateToHub(this.hubs[nextIndex].id);
  }

  /**
   * Navigate to previous hub
   */
  prevHub() {
    if (!this.currentHub) return;
    const currentIndex = this.hubs.findIndex(h => h.id === this.currentHub.id);
    const prevIndex = (currentIndex - 1 + this.hubs.length) % this.hubs.length;
    this.navigateToHub(this.hubs[prevIndex].id);
  }

  /**
   * Setup keyboard navigation (arrow keys)
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Alt + Arrow keys for hub navigation
      if (e.altKey) {
        switch(e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            this.nextHub();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            this.prevHub();
            break;
        }
      }
      
      // Number keys 1-4 for direct hub access
      if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.metaKey) {
        const hubIndex = parseInt(e.key) - 1;
        if (this.hubs[hubIndex]) {
          this.navigateToHub(this.hubs[hubIndex].id);
        }
      }
    });
  }

  /**
   * Setup touch/swipe navigation for mobile
   */
  setupSwipeNavigation() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      if (!this.currentHub) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Horizontal swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.prevHub();
        } else {
          this.nextHub();
        }
      }
    }, { passive: true });
  }

  /**
   * Get hub info by ID
   */
  getHubInfo(hubId) {
    return this.hubs.find(h => h.id === hubId) || null;
  }

  /**
   * Get all hubs
   */
  getAllHubs() {
    return [...this.hubs];
  }
}

// Initialize navigation when DOM is ready
let hubNav;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hubNav = new HubNavigation();
    window.HubNavigation = hubNav;
  });
} else {
  hubNav = new HubNavigation();
  window.HubNavigation = hubNav;
}
