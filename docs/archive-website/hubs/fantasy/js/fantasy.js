/**
 * Fantasy eSports HUB JavaScript
 * HUB 4/4 - Interactive functionality
 * SATOR Website Phase 2H
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    theme: {
      primary: '#00FF88',
      secondary: '#00d4ff',
      accent: '#FFD700'
    },
    leagues: [
      {
        id: 'global-championship',
        name: 'Global Championship',
        type: 'pro',
        game: 'VCT Valorant',
        members: 12547,
        isPublic: false,
        topPlayers: [
          { name: 'DragonSlayer', points: 2847 },
          { name: 'NeonKnight', points: 2734 },
          { name: 'ToxicWaste', points: 2689 }
        ]
      },
      {
        id: 'na-regional',
        name: 'NA Regional',
        type: 'free',
        game: 'VCT Valorant',
        members: 5234,
        isPublic: true,
        topPlayers: [
          { name: 'CloudNine', points: 2156 },
          { name: 'SageMain', points: 2098 },
          { name: 'JettRider', points: 2045 }
        ]
      },
      {
        id: 'eu-masters',
        name: 'EU Masters',
        type: 'pro',
        game: 'VCT Valorant',
        members: 8341,
        isPublic: true,
        topPlayers: [
          { name: 'FnaticFan', points: 2567 },
          { name: 'G2Gang', points: 2498 },
          { name: 'LiquidLove', points: 2432 }
        ]
      },
      {
        id: 'casual-friends',
        name: 'Casual Friends',
        type: 'free',
        game: 'Multiple Games',
        members: 52,
        isPublic: true,
        topPlayers: [
          { name: 'WeekendWarrior', points: 1890 },
          { name: 'CasualGamer', points: 1756 },
          { name: 'FunTimes', points: 1689 }
        ]
      },
      {
        id: 'vct-predictor',
        name: 'VCT Predictor',
        type: 'free',
        game: 'VCT Valorant',
        members: 12453,
        isPublic: true,
        topPlayers: [
          { name: 'Oracle', points: 2987 },
          { name: 'PredictorX', points: 2876 },
          { name: 'Visionary', points: 2756 }
        ]
      },
      {
        id: 'apac-elite',
        name: 'APAC Elite',
        type: 'pro',
        game: 'VCT Valorant',
        members: 6789,
        isPublic: true,
        topPlayers: [
          { name: 'PaperRex', points: 2543 },
          { name: 'DRXDevotee', points: 2498 },
          { name: 'T1Fanatic', points: 2432 }
        ]
      }
    ],
    leaderboard: {
      weekly: [
        { rank: 1, name: 'Oracle', team: 'Visionaries', points: 2987, change: 2 },
        { rank: 2, name: 'DragonSlayer', team: 'FireBreathers', points: 2847, change: 0 },
        { rank: 3, name: 'PredictorX', team: 'FutureSight', points: 2876, change: -1 },
        { rank: 4, name: 'NeonKnight', team: 'CyberPunk', points: 2734, change: 3 },
        { rank: 5, name: 'FnaticFan', team: 'OrangeArmy', points: 2567, change: 1 },
        { rank: 6, name: 'PaperRex', team: 'PaperChasers', points: 2543, change: -2 },
        { rank: 7, name: 'G2Gang', team: 'SamuraiBlue', points: 2498, change: 0 },
        { rank: 8, name: 'DRXDevotee', team: 'BlueWave', points: 2498, change: 5 },
        { rank: 9, name: 'T1Fanatic', team: 'Telecom', points: 2432, change: -1 },
        { rank: 10, name: 'LiquidLove', team: 'HorsePower', points: 2432, change: 2 },
        { rank: 11, name: 'ToxicWaste', team: 'Radioactive', points: 2689, change: -4 },
        { rank: 12, name: 'Visionary', team: 'Seers', points: 2756, change: 0 },
        { rank: 13, name: 'CloudNine', team: 'SkyHigh', points: 2156, change: 1 },
        { rank: 14, name: 'SageMain', team: 'Healers', points: 2098, change: -1 },
        { rank: 15, name: 'JettRider', team: 'WindWalkers', points: 2045, change: 2 }
      ],
      season: [
        { rank: 1, name: 'DragonSlayer', team: 'FireBreathers', points: 15420, change: 0 },
        { rank: 2, name: 'Oracle', team: 'Visionaries', points: 15234, change: 1 },
        { rank: 3, name: 'PredictorX', team: 'FutureSight', points: 14876, change: -1 },
        { rank: 4, name: 'ToxicWaste', team: 'Radioactive', points: 14321, change: 0 },
        { rank: 5, name: 'Visionary', team: 'Seers', points: 14109, change: 2 },
        { rank: 6, name: 'FnaticFan', team: 'OrangeArmy', points: 13876, change: -1 },
        { rank: 7, name: 'NeonKnight', team: 'CyberPunk', points: 13654, change: 3 },
        { rank: 8, name: 'PaperRex', team: 'PaperChasers', points: 13432, change: 0 },
        { rank: 9, name: 'G2Gang', team: 'SamuraiBlue', points: 13210, change: -2 },
        { rank: 10, name: 'DRXDevotee', team: 'BlueWave', points: 12987, change: 1 },
        { rank: 11, name: 'T1Fanatic', team: 'Telecom', points: 12876, change: -1 },
        { rank: 12, name: 'LiquidLove', team: 'HorsePower', points: 12654, change: 0 },
        { rank: 13, name: 'CloudNine', team: 'SkyHigh', points: 11234, change: 2 },
        { rank: 14, name: 'SageMain', team: 'Healers', points: 10987, change: -1 },
        { rank: 15, name: 'JettRider', team: 'WindWalkers', points: 10765, change: 0 }
      ]
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const utils = {
    formatNumber: (num) => {
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K+';
      }
      return num.toString();
    },

    debounce: (func, wait) => {
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

    animateCounter: (element, target, duration = 2000) => {
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;
      
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(updateCounter);
        } else {
          element.textContent = target.toLocaleString();
        }
      };
      
      updateCounter();
    },

    showToast: (message, type = 'info') => {
      const existingToast = document.querySelector('.fantasy-toast');
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement('div');
      toast.className = 'fantasy-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: ${type === 'success' ? '#00FF88' : type === 'error' ? '#FF4655' : '#14141f'};
        color: ${type === 'success' || type === 'error' ? '#0a0a0f' : '#ffffff'};
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-weight: 600;
        z-index: 9999;
        transition: transform 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });

      setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  };

  // ============================================
  // LEAGUE FILTERING
  // ============================================
  const leaguesModule = {
    init() {
      this.filterButtons = document.querySelectorAll('[data-league-filter]');
      this.leagueCards = document.querySelectorAll('[data-league-card]');
      
      if (this.filterButtons.length) {
        this.bindEvents();
      }
    },

    bindEvents() {
      this.filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const filter = e.target.dataset.leagueFilter;
          this.setActiveFilter(e.target);
          this.filterLeagues(filter);
        });
      });
    },

    setActiveFilter(activeBtn) {
      this.filterButtons.forEach(btn => {
        btn.classList.remove('leagues-filter__btn--active');
      });
      activeBtn.classList.add('leagues-filter__btn--active');
    },

    filterLeagues(filter) {
      this.leagueCards.forEach(card => {
        const type = card.dataset.leagueType;
        const isPublic = card.dataset.leaguePublic === 'true';
        
        let shouldShow = false;
        
        switch(filter) {
          case 'all':
            shouldShow = true;
            break;
          case 'public':
            shouldShow = isPublic;
            break;
          case 'private':
            shouldShow = !isPublic;
            break;
          case 'pro':
            shouldShow = type === 'pro';
            break;
          case 'free':
            shouldShow = type === 'free';
            break;
        }
        
        if (shouldShow) {
          card.style.display = 'block';
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    }
  };

  // ============================================
  // TAB SWITCHING
  // ============================================
  const tabsModule = {
    init() {
      this.tabGroups = document.querySelectorAll('[data-tabs]');
      this.tabGroups.forEach(group => this.initTabGroup(group));
    },

    initTabGroup(group) {
      const tabs = group.querySelectorAll('[data-tab]');
      const panels = document.querySelectorAll(`[data-tab-panel="${group.dataset.tabs}"]`);
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetPanel = tab.dataset.tab;
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('leaderboard-tab--active', 'platform-tab--active'));
          tab.classList.add('leaderboard-tab--active', 'platform-tab--active');
          
          // Show target panel
          panels.forEach(panel => {
            if (panel.dataset.panel === targetPanel) {
              panel.style.display = 'block';
              panel.style.animation = 'fadeInUp 0.3s ease forwards';
            } else {
              panel.style.display = 'none';
            }
          });
        });
      });
    }
  };

  // ============================================
  // DOWNLOAD HANDLING
  // ============================================
  const downloadModule = {
    init() {
      this.downloadBtn = document.querySelector('[data-download]');
      this.platformTabs = document.querySelectorAll('[data-platform]');
      
      if (this.downloadBtn) {
        this.bindEvents();
      }
    },

    bindEvents() {
      this.downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDownload();
      });

      this.platformTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          this.setActivePlatform(e.target);
        });
      });
    },

    setActivePlatform(activeTab) {
      this.platformTabs.forEach(tab => {
        tab.classList.remove('platform-tab--active');
      });
      activeTab.classList.add('platform-tab--active');
      
      const platform = activeTab.dataset.platform;
      this.updateDownloadInfo(platform);
    },

    updateDownloadInfo(platform) {
      const sizeEl = document.querySelector('[data-download-size]');
      if (sizeEl) {
        const sizes = {
          windows: '1.2 GB',
          mac: '1.1 GB',
          linux: '1.0 GB'
        };
        sizeEl.textContent = sizes[platform] || sizes.windows;
      }
    },

    handleDownload() {
      const platform = document.querySelector('.platform-tab--active')?.dataset.platform || 'windows';
      
      if (platform === 'windows') {
        // Simulate download
        utils.showToast('Starting download...', 'success');
        
        // Actually trigger the download
        const link = document.createElement('a');
        link.href = 'Axiom_eSports_Simulation_Game.exe';
        link.download = 'Axiom_eSports_Simulation_Game.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        this.showComingSoonModal(platform);
      }
    },

    showComingSoonModal(platform) {
      const platformNames = {
        mac: 'macOS',
        linux: 'Linux'
      };
      
      utils.showToast(`${platformNames[platform]} version coming soon!`, 'info');
    }
  };

  // ============================================
  // MODAL DIALOGS
  // ============================================
  const modalModule = {
    init() {
      this.modals = document.querySelectorAll('[data-modal]');
      this.triggers = document.querySelectorAll('[data-modal-trigger]');
      this.closeButtons = document.querySelectorAll('[data-modal-close]');
      
      this.bindEvents();
    },

    bindEvents() {
      this.triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          const modalId = e.currentTarget.dataset.modalTrigger;
          this.openModal(modalId);
        });
      });

      this.closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.closeAllModals();
        });
      });

      // Close on overlay click
      this.modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeAllModals();
          }
        });
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
      });
    },

    openModal(id) {
      const modal = document.querySelector(`[data-modal="${id}"]`);
      if (modal) {
        modal.classList.add('modal-overlay--active');
        document.body.style.overflow = 'hidden';
      }
    },

    closeAllModals() {
      this.modals.forEach(modal => {
        modal.classList.remove('modal-overlay--active');
      });
      document.body.style.overflow = '';
    }
  };

  // ============================================
  // LEADERBOARD SORTING
  // ============================================
  const leaderboardModule = {
    init() {
      this.sortButtons = document.querySelectorAll('[data-leaderboard-sort]');
      this.leaderboardContainer = document.querySelector('[data-leaderboard]');
      
      if (this.leaderboardContainer) {
        this.bindEvents();
        this.renderLeaderboard('weekly');
      }
    },

    bindEvents() {
      // Tab switching
      const tabs = document.querySelectorAll('[data-leaderboard-tab]');
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const period = e.target.dataset.leaderboardTab;
          
          tabs.forEach(t => t.classList.remove('leaderboard-tab--active'));
          e.target.classList.add('leaderboard-tab--active');
          
          this.renderLeaderboard(period);
        });
      });
    },

    renderLeaderboard(period) {
      const data = CONFIG.leaderboard[period] || CONFIG.leaderboard.weekly;
      const container = this.leaderboardContainer;
      
      container.innerHTML = data.map((player, index) => this.createLeaderboardItem(player, index)).join('');
      
      // Animate items
      const items = container.querySelectorAll('.leaderboard-item');
      items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
          item.style.transition = 'all 0.4s ease';
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, i * 50);
      });
    },

    createLeaderboardItem(player, index) {
      const rankClass = player.rank <= 3 ? `leaderboard-rank--${player.rank}` : '';
      const itemClass = player.rank <= 3 ? `leaderboard-item--top${player.rank}` : '';
      const changeIcon = player.change > 0 ? '↑' : player.change < 0 ? '↓' : '-';
      const changeClass = player.change > 0 ? 'leaderboard-change--up' : player.change < 0 ? 'leaderboard-change--down' : '';
      
      return `
        <div class="leaderboard-item ${itemClass}">
          <div class="leaderboard-rank ${rankClass}">${player.rank}</div>
          <div class="leaderboard-avatar">${player.name.charAt(0)}</div>
          <div class="leaderboard-info">
            <div class="leaderboard-name">${player.name}</div>
            <div class="leaderboard-team">${player.team}</div>
          </div>
          <div class="leaderboard-points">
            <div class="leaderboard-score">${player.points.toLocaleString()}</div>
            <div class="leaderboard-change ${changeClass}">${changeIcon} ${Math.abs(player.change)}</div>
          </div>
        </div>
      `;
    }
  };

  // ============================================
  // MEMBERSHIP HANDLING
  // ============================================
  const membershipModule = {
    init() {
      this.ctaButtons = document.querySelectorAll('[data-membership-cta]');
      this.bindEvents();
    },

    bindEvents() {
      this.ctaButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tier = e.target.dataset.membershipCta;
          this.handleCtaClick(tier);
        });
      });
    },

    handleCtaClick(tier) {
      const tierNames = {
        free: 'Free',
        pro: 'Pro',
        elite: 'Elite'
      };
      
      if (tier === 'free') {
        utils.showToast('Welcome to Fantasy eSports! Sign up coming soon.', 'success');
      } else {
        modalModule.openModal('membership-signup');
      }
    }
  };

  // ============================================
  // FAQ ACCORDION
  // ============================================
  const faqModule = {
    init() {
      this.items = document.querySelectorAll('[data-faq-item]');
      this.bindEvents();
    },

    bindEvents() {
      this.items.forEach(item => {
        const question = item.querySelector('[data-faq-question]');
        question.addEventListener('click', () => {
          this.toggleItem(item);
        });
      });
    },

    toggleItem(targetItem) {
      const isOpen = targetItem.classList.contains('faq-item--open');
      
      // Close all items
      this.items.forEach(item => {
        item.classList.remove('faq-item--open');
      });
      
      // Open target if it wasn't open
      if (!isOpen) {
        targetItem.classList.add('faq-item--open');
      }
    }
  };

  // ============================================
  // STATS COUNTER ANIMATION
  // ============================================
  const statsModule = {
    init() {
      this.counters = document.querySelectorAll('[data-counter]');
      
      if (this.counters.length) {
        this.observeCounters();
      }
    },

    observeCounters() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.counter, 10);
            utils.animateCounter(entry.target, target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      this.counters.forEach(counter => observer.observe(counter));
    }
  };

  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  const mobileNavModule = {
    init() {
      this.toggle = document.querySelector('[data-mobile-nav-toggle]');
      this.menu = document.querySelector('[data-mobile-nav]');
      
      if (this.toggle && this.menu) {
        this.bindEvents();
      }
    },

    bindEvents() {
      this.toggle.addEventListener('click', () => {
        this.menu.classList.toggle('hidden');
        const isOpen = !this.menu.classList.contains('hidden');
        this.toggle.setAttribute('aria-expanded', isOpen);
      });
    }
  };

  // ============================================
  // FORM HANDLING
  // ============================================
  const formModule = {
    init() {
      this.forms = document.querySelectorAll('[data-form]');
      this.bindEvents();
    },

    bindEvents() {
      this.forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSubmit(form);
        });
      });
    },

    handleSubmit(form) {
      const formType = form.dataset.form;
      
      switch(formType) {
        case 'create-league':
          utils.showToast('League creation coming soon!', 'info');
          break;
        case 'membership-signup':
          utils.showToast('Membership signup coming soon!', 'info');
          modalModule.closeAllModals();
          break;
        default:
          utils.showToast('Form submitted!', 'success');
      }
      
      form.reset();
    }
  };

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================
  const scrollAnimationsModule = {
    init() {
      this.animatedElements = document.querySelectorAll('[data-animate]');
      
      if (this.animatedElements.length) {
        this.observeElements();
      }
    },

    observeElements() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const animation = entry.target.dataset.animate;
            entry.target.classList.add(animation);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      this.animatedElements.forEach(el => observer.observe(el));
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Initialize all modules
    leaguesModule.init();
    tabsModule.init();
    downloadModule.init();
    modalModule.init();
    leaderboardModule.init();
    membershipModule.init();
    faqModule.init();
    statsModule.init();
    mobileNavModule.init();
    formModule.init();
    scrollAnimationsModule.init();

    console.log('🎮 Fantasy eSports HUB initialized');
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose to global scope for debugging
  window.FantasyHub = {
    config: CONFIG,
    utils,
    modules: {
      leagues: leaguesModule,
      tabs: tabsModule,
      download: downloadModule,
      modal: modalModule,
      leaderboard: leaderboardModule,
      membership: membershipModule,
      faq: faqModule,
      stats: statsModule,
      mobileNav: mobileNavModule,
      form: formModule,
      scrollAnimations: scrollAnimationsModule
    }
  };

})();
