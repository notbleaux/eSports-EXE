/* SATOR Hub JavaScript - Ring Animation, Live Data & Terminal Effects */

(function() {
  'use strict';

  // === TERMINAL LOADING CONTROLLER ===
  const TerminalLoader = {
    terminalBody: null,
    overlay: null,
    lines: [],
    currentLine: 0,
    isComplete: false,

    terminalMessages: [
      { text: 'Initializing SATOR kernel...', type: 'info', delay: 100 },
      { text: 'Loading RAWS database schema...', type: 'info', delay: 400 },
      { text: 'Connecting to HLTV data stream...', type: 'info', delay: 700 },
      { text: 'Connected. Latency: 23ms', type: 'success', delay: 1000 },
      { text: 'Connecting to VLR data stream...', type: 'info', delay: 1200 },
      { text: 'Connected. Latency: 31ms', type: 'success', delay: 1500 },
      { text: 'Connecting to GRID Open API...', type: 'info', delay: 1700 },
      { text: 'Connected. Rate limit: 1000 req/min', type: 'success', delay: 2000 },
      { text: 'Verifying twin-file integrity...', type: 'info', delay: 2300 },
      { text: 'SHA-256 checksum validation...', type: 'info', delay: 2600 },
      { text: 'Cross-referencing 2.4M records...', type: 'info', delay: 2900 },
      { text: 'Integrity check PASSED ✓', type: 'success', delay: 3200 },
      { text: 'Calibrating ring visualization...', type: 'info', delay: 3500 },
      { text: 'Rendering data points...', type: 'info', delay: 3800 },
      { text: 'System ready.', type: 'success', delay: 4200 }
    ],

    init() {
      this.terminalBody = document.getElementById('terminal-body');
      this.overlay = document.getElementById('terminal-overlay');
      
      if (!this.terminalBody || !this.overlay) return;

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        // Skip animation for users who prefer reduced motion
        this.overlay.classList.add('hidden');
        return;
      }

      this.startSequence();
    },

    startSequence() {
      this.terminalMessages.forEach((msg, index) => {
        setTimeout(() => {
          this.addLine(msg.text, msg.type);
          
          // Add cursor to latest line
          this.updateCursor();
          
          // Check if this is the last message
          if (index === this.terminalMessages.length - 1) {
            setTimeout(() => this.complete(), 500);
          }
        }, msg.delay);
      });
    },

    addLine(text, type = 'info') {
      const line = document.createElement('div');
      line.className = `terminal-line ${type}`;
      
      const prompt = document.createElement('span');
      prompt.className = 'terminal-prompt';
      prompt.textContent = '>';
      
      const content = document.createElement('span');
      content.textContent = ` ${text}`;
      
      line.appendChild(prompt);
      line.appendChild(content);
      
      this.terminalBody.appendChild(line);
      
      // Auto-scroll to bottom
      this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
      
      // Trigger animation
      requestAnimationFrame(() => {
        line.classList.add('visible');
      });
      
      this.lines.push(line);
    },

    updateCursor() {
      // Remove cursor from all lines
      this.lines.forEach(line => {
        const existingCursor = line.querySelector('.terminal-cursor');
        if (existingCursor) {
          existingCursor.remove();
        }
      });
      
      // Add cursor to last line
      if (this.lines.length > 0) {
        const lastLine = this.lines[this.lines.length - 1];
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        lastLine.appendChild(cursor);
      }
    },

    complete() {
      this.isComplete = true;
      
      // Fade out overlay
      setTimeout(() => {
        this.overlay.classList.add('hidden');
        
        // Remove from DOM after transition
        setTimeout(() => {
          this.overlay.style.display = 'none';
        }, 500);
      }, 300);
    }
  };

  // === TIER PREVIEW CONTROLLER ===
  const TierPreview = {
    overlay: null,
    title: null,
    nvrdieStatus: null,
    fourEvaStatus: null,
    currentPoint: null,

    init() {
      this.overlay = document.getElementById('tier-preview');
      this.title = document.getElementById('tier-preview-title');
      this.nvrdieStatus = document.getElementById('tier-nvrdie-status');
      this.fourEvaStatus = document.getElementById('tier-4eva-status');
      
      if (!this.overlay) return;

      this.attachEventListeners();
    },

    attachEventListeners() {
      const dataPoints = document.querySelectorAll('.data-point');
      
      dataPoints.forEach(point => {
        // Mouse events for desktop
        point.addEventListener('mouseenter', (e) => this.show(e, point));
        point.addEventListener('mouseleave', () => this.hide());
        point.addEventListener('mousemove', (e) => this.move(e));
        
        // Touch events for mobile
        point.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.show(e.touches[0], point);
        }, { passive: false });
        
        point.addEventListener('touchend', () => {
          setTimeout(() => this.hide(), 2000);
        });
      });
    },

    show(event, point) {
      const tier = point.dataset.tier;
      const pointName = point.dataset.point || 'Data Point';
      
      this.title.textContent = pointName;
      
      // Update access statuses based on tier
      const nvrdieHasAccess = tier === 'nvrdie' || tier === '4eva';
      const fourEvaHasAccess = tier === '4eva';
      
      this.updateStatusRow(this.nvrdieStatus, nvrdieHasAccess);
      this.updateStatusRow(this.fourEvaStatus, fourEvaHasAccess);
      
      // Position overlay
      this.positionOverlay(event);
      
      // Show
      this.overlay.classList.add('visible');
    },

    updateStatusRow(element, hasAccess) {
      if (hasAccess) {
        element.className = 'access-status granted';
        element.innerHTML = '<span>✓</span> Access';
      } else {
        element.className = 'access-status locked';
        element.innerHTML = '<span>✕</span> Locked';
      }
    },

    move(event) {
      if (!this.overlay.classList.contains('visible')) return;
      this.positionOverlay(event);
    },

    positionOverlay(event) {
      const x = event.clientX || event.pageX;
      const y = event.clientY || event.pageY;
      
      const offsetX = 20;
      const offsetY = 20;
      
      // Prevent overflow on right edge
      let left = x + offsetX;
      if (left + 200 > window.innerWidth) {
        left = x - 220;
      }
      
      // Prevent overflow on bottom edge
      let top = y + offsetY;
      if (top + 120 > window.innerHeight) {
        top = y - 130;
      }
      
      this.overlay.style.left = `${left}px`;
      this.overlay.style.top = `${top}px`;
    },

    hide() {
      this.overlay.classList.remove('visible');
    }
  };

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

      // Check for reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.rings.forEach(ring => {
          if (ring.element) {
            ring.element.style.animation = 'none';
          }
        });
      }
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

  // === MOBILE DETECTION & OPTIMIZATION ===
  const MobileOptimizer = {
    init() {
      this.detectTouchDevice();
      this.optimizeGlassmorphism();
    },

    detectTouchDevice() {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (isTouch) {
        document.body.classList.add('touch-device');
        
        // Reduce animation complexity on mobile
        document.querySelectorAll('.glass-panel').forEach(panel => {
          panel.classList.add('glass-panel-mobile');
        });
      }
    },

    optimizeGlassmorphism() {
      // Check for backdrop-filter support
      const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(20px)');
      
      if (!supportsBackdropFilter) {
        document.body.classList.add('no-backdrop-filter');
      }
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

  // === HUB DROPDOWN ===
  const HubDropdown = {
    init() {
      const toggle = document.getElementById('hubDropdownToggle');
      const menu = document.getElementById('hubDropdownMenu');
      const indicator = document.getElementById('hubIndicator');
      
      if (!toggle || !menu) return;

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
        toggle.classList.toggle('active');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!indicator.contains(e.target)) {
          menu.classList.remove('open');
          toggle.classList.remove('active');
        }
      });
    }
  };

  // === INITIALIZATION ===
  function init() {
    // Initialize terminal loader first (it controls initial experience)
    TerminalLoader.init();
    
    // Initialize other modules after terminal completes
    setTimeout(() => {
      RingController.init();
      DataSimulator.init();
      FileManager.init();
      IntegrityMonitor.init();
      CountAnimator.init();
      TierPreview.init();
      MobileOptimizer.init();
      HubDropdown.init();
    }, 500);

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
    TerminalLoader,
    TierPreview,
    RingController,
    DataSimulator,
    FileManager,
    IntegrityMonitor,
    MobileOptimizer,
    HubDropdown,
    Utils
  };

})();
