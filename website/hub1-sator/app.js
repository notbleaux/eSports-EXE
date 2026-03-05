/* SATOR Hub JavaScript - Ring Animation & Live Data */

(function() {
  'use strict';

  // === RING ANIMATION CONTROL ===
  const RingController = {
    rings: [],
    isAnimating: true,
    animationSpeed: 1,

    init() {
      this.rings = [
        { element: document.querySelector('.ring-1'), speed: 30, direction: 1 },
        { element: document.querySelector('.ring-2'), speed: 20, direction: -1 },
        { element: document.querySelector('.ring-3'), speed: 15, direction: 1 }
      ];

      // Add hover interactions
      this.rings.forEach((ring, index) => {
        if (ring.element) {
          ring.element.addEventListener('mouseenter', () => this.slowDown(index));
          ring.element.addEventListener('mouseleave', () => this.resumeSpeed(index));
        }
      });
    },

    slowDown(index) {
      const ring = this.rings[index];
      if (ring && ring.element) {
        ring.element.style.animationDuration = `${ring.speed * 2}s`;
      }
    },

    resumeSpeed(index) {
      const ring = this.rings[index];
      if (ring && ring.element) {
        ring.element.style.animationDuration = `${ring.speed}s`;
      }
    },

    toggleAnimation() {
      this.rings.forEach(ring => {
        if (ring.element) {
          ring.element.style.animationPlayState = this.isAnimating ? 'paused' : 'running';
        }
      });
      this.isAnimating = !this.isAnimating;
    }
  };

  // === LIVE DATA SIMULATION ===
  const DataSimulator = {
    streams: [],
    updateInterval: null,

    init() {
      this.streams = [
        { name: 'hltv', baseRate: 847, variance: 50, element: document.querySelector('[data-stream="hltv"] .stream-rate') },
        { name: 'vlr', baseRate: 623, variance: 40, element: document.querySelector('[data-stream="vlr"] .stream-rate') },
        { name: 'grid', baseRate: 234, variance: 30, element: document.querySelector('[data-stream="grid"] .stream-rate') }
      ];

      // Start live data updates
      this.updateInterval = setInterval(() => this.updateStreams(), 2000);

      // Animate stream bars
      this.animateStreamBars();
    },

    updateStreams() {
      this.streams.forEach(stream => {
        if (!stream.element) return;

        // Calculate new rate with variance
        const variance = Math.floor(Math.random() * stream.variance * 2) - stream.variance;
        const newRate = Math.max(0, stream.baseRate + variance);

        // Update display
        stream.element.textContent = `${newRate} req/min`;
        stream.element.setAttribute('data-rate', newRate);

        // Update bar width based on rate percentage of max (1000)
        const bar = stream.element.parentElement.querySelector('.stream-fill');
        if (bar) {
          const percentage = Math.min(100, (newRate / 1000) * 100);
          bar.style.width = `${percentage}%`;
        }
      });

      // Update live matches count occasionally
      if (Math.random() > 0.7) {
        this.updateLiveMatches();
      }
    },

    updateLiveMatches() {
      const matchesElement = document.getElementById('live-matches');
      if (matchesElement) {
        const currentMatches = parseInt(matchesElement.textContent.replace(',', ''));
        const variance = Math.floor(Math.random() * 6) - 3;
        const newMatches = Math.max(0, currentMatches + variance);
        matchesElement.textContent = newMatches.toLocaleString();
      }
    },

    animateStreamBars() {
      const bars = document.querySelectorAll('.stream-fill');
      bars.forEach(bar => {
        // Add subtle pulse animation
        setInterval(() => {
          const currentWidth = parseFloat(bar.style.width) || 50;
          const variance = Math.random() * 4 - 2;
          const newWidth = Math.max(0, Math.min(100, currentWidth + variance));
          bar.style.width = `${newWidth}%`;
        }, 1500);
      });
    },

    stop() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
    }
  };

  // === FILE DOWNLOAD HANDLERS ===
  const FileManager = {
    init() {
      const downloadButtons = document.querySelectorAll('.download-btn');
      downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => this.handleDownload(e));
      });

      // Initialize pagination
      this.initPagination();
    },

    handleDownload(e) {
      const button = e.target;
      const fileId = button.getAttribute('data-file');

      // Simulate download
      const originalText = button.textContent;
      button.textContent = 'Downloading...';
      button.disabled = true;

      setTimeout(() => {
        button.textContent = 'Downloaded ✓';
        button.style.background = 'var(--njz-live-green)';
        button.style.borderColor = 'var(--njz-live-green)';
        button.style.color = 'var(--njz-void-black)';

        // Reset after delay
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          button.style.background = '';
          button.style.borderColor = '';
          button.style.color = '';
        }, 2000);
      }, 1500);

      console.log(`Downloading RAWS file: ${fileId}`);
    },

    initPagination() {
      const prevBtn = document.querySelector('.pagination-prev');
      const nextBtn = document.querySelector('.pagination-next');
      const pages = document.querySelectorAll('.page');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.changePage('prev'));
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.changePage('next'));
      }

      pages.forEach(page => {
        page.addEventListener('click', () => this.goToPage(page));
      });
    },

    changePage(direction) {
      const activePage = document.querySelector('.page.active');
      if (!activePage) return;

      const currentPage = parseInt(activePage.textContent);
      const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

      if (newPage > 0 && newPage <= 42) {
        this.updatePagination(newPage);
      }
    },

    goToPage(pageElement) {
      const pageNum = parseInt(pageElement.textContent);
      this.updatePagination(pageNum);
    },

    updatePagination(pageNum) {
      const pages = document.querySelectorAll('.page');
      const prevBtn = document.querySelector('.pagination-prev');
      const nextBtn = document.querySelector('.pagination-next');

      pages.forEach(page => {
        page.classList.remove('active');
        if (parseInt(page.textContent) === pageNum) {
          page.classList.add('active');
        }
      });

      if (prevBtn) {
        prevBtn.disabled = pageNum === 1;
      }

      if (nextBtn) {
        nextBtn.disabled = pageNum === 42;
      }

      // Simulate loading new data
      this.simulatePageLoad();
    },

    simulatePageLoad() {
      const tableBody = document.querySelector('.table-body');
      if (tableBody) {
        tableBody.style.opacity = '0.5';
        setTimeout(() => {
          tableBody.style.opacity = '1';
        }, 300);
      }
    }
  };

  // === INTEGRITY STATUS UPDATES ===
  const IntegrityMonitor = {
    cards: [],
    checkInterval: null,

    init() {
      this.cards = [
        { element: document.querySelector('[data-check="twin-file"]'), status: 'verified' },
        { element: document.querySelector('[data-check="sha256"]'), status: 'verified' },
        { element: document.querySelector('[data-check="cross-ref"]'), status: 'verified' }
      ];

      // Periodic integrity check simulation
      this.checkInterval = setInterval(() => this.runIntegrityCheck(), 10000);

      // Update timestamp
      this.updateTimestamp();
    },

    runIntegrityCheck() {
      // Randomly show a card as "checking" then back to verified
      const randomCard = this.cards[Math.floor(Math.random() * this.cards.length)];
      if (!randomCard || !randomCard.element) return;

      // Set to pending
      randomCard.element.classList.remove('verified', 'error');
      randomCard.element.classList.add('pending');

      const icon = randomCard.element.querySelector('.card-icon');
      const status = randomCard.element.querySelector('.card-status');

      if (icon) icon.textContent = '⟳';
      if (status) status.textContent = 'Checking...';

      // Back to verified after delay
      setTimeout(() => {
        randomCard.element.classList.remove('pending');
        randomCard.element.classList.add('verified');
        if (icon) icon.textContent = '✓';
        if (status) status.textContent = randomCard.element.querySelector('.card-label').textContent === 'Twin-File Sync' ? 'Verified' :
                                          randomCard.element.querySelector('.card-label').textContent === 'SHA-256 Hashes' ? 'Valid' : 'Matched';

        this.updateTimestamp();
      }, 2000);
    },

    updateTimestamp() {
      const timestampElement = document.getElementById('last-verify');
      if (timestampElement) {
        const now = new Date();
        const formatted = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        timestampElement.textContent = formatted;
      }
    },

    stop() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
    }
  };

  // === CENTER COUNT ANIMATION ===
  const CountAnimator = {
    init() {
      const centerCount = document.querySelector('.center-count');
      if (centerCount) {
        this.animateCount(centerCount, 0, 2400000, 2000);
      }
    },

    animateCount(element, start, end, duration) {
      const startTime = performance.now();
      const formatNumber = (num) => {
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
          return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
      };

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const current = Math.floor(start + (end - start) * easeProgress);

        element.textContent = formatNumber(current);

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    }
  };

  // === UTILITY FUNCTIONS ===
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

    // Format bytes to human readable
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
  };

  // === INITIALIZATION ===
  function init() {
    // Initialize all modules
    RingController.init();
    DataSimulator.init();
    FileManager.init();
    IntegrityMonitor.init();
    CountAnimator.init();

    // Console welcome message
    console.log('%c SATOR Statistical Database Hub ', 'background: #ff9f1c; color: #0a0a0f; font-size: 14px; font-weight: bold; padding: 5px 10px;');
    console.log('%c Immutable RAWS files with cryptographic verification ', 'color: #ff9f1c; font-size: 12px;');

    // Handle visibility change to pause/resume animations
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        DataSimulator.stop();
        IntegrityMonitor.stop();
      } else {
        DataSimulator.init();
        IntegrityMonitor.init();
      }
    });

    // Handle window resize
    window.addEventListener('resize', Utils.debounce(() => {
      // Recalculate any position-dependent elements if needed
      console.log('SATOR: Window resized');
    }, 250));
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for debugging
  window.SATOR = {
    RingController,
    DataSimulator,
    FileManager,
    IntegrityMonitor,
    Utils
  };

})();
