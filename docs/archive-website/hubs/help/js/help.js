/**
 * Help Panel JavaScript
 * =====================
 * Comprehensive help panel functionality including:
 * - Panel open/close animations
 * - Tab switching
 * - Swipe gesture handling
 * - Article loading/rendering
 * - Dashboard data simulation
 * - Password verification
 * - Developer panel collapsible logic
 * - Search functionality
 * 
 * @version 1.0.0
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================

  const CONFIG = {
    developerPassword: 'sator-dev-2024',
    swipeThreshold: 50,
    animationDuration: 300,
    debounceDelay: 150
  };

  // ============================================
  // ARTICLE CONTENT DATA
  // ============================================

  const ARTICLES = {
    'getting-started': {
      title: 'Getting Started with SATOR',
      category: 'Platform Guides',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">Getting Started with SATOR</h1>
          <div class="article-meta">
            <span>Platform Guides</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>Welcome to <strong>SATOR</strong>, the comprehensive esports analytics and simulation platform. This guide will help you navigate the platform and make the most of its powerful features.</p>
          
          <h2>What is SATOR?</h2>
          <p>SATOR is a multi-faceted platform designed for esports enthusiasts, analysts, and competitive players. It combines:</p>
          <ul>
            <li><strong>Statistical Reference:</strong> Comprehensive player and team statistics database</li>
            <li><strong>Advanced Analytics:</strong> Deep analytical insights with the revolutionary SATOR Square visualization</li>
            <li><strong>eSports Hub:</strong> News, match results, and community features</li>
            <li><strong>Fantasy eSports:</strong> Fantasy leagues and the RadiantX tactical FPS game</li>
          </ul>
          
          <h2>Navigating the Platform</h2>
          <p>The <strong>NJZ Grid</strong> serves as your central navigation hub. From here, you can access all four main HUBs:</p>
          <ol>
            <li>Click on any HUB card to enter that section</li>
            <li>Use the center SATOR button to access this Help Center</li>
            <li>Press <code>Alt + H</code> from any page to return to the NJZ Grid</li>
          </ol>
          
          <h2>Keyboard Shortcuts</h2>
          <p>SATOR supports several keyboard shortcuts for power users:</p>
          <ul>
            <li><code>?</code> — Open Help Panel</li>
            <li><code>Alt + H</code> — Go to HUB Selector</li>
            <li><code>Alt + L</code> — Go to Landing Page</li>
            <li><code>Escape</code> — Close panels/dialogs</li>
            <li><code>Tab</code> — Navigate between elements</li>
          </ul>
          
          <h2>Getting Help</h2>
          <p>If you need assistance, you can:</p>
          <ul>
            <li>Browse the guides in this Help Center</li>
            <li>Check the Dashboard for system status</li>
            <li>Contact support through the Contact Support link</li>
          </ul>
          
          <blockquote>
            "SATOR represents the future of esports analytics — where data meets determination."
          </blockquote>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="contact">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: Contact Support
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="njz-directory">
            Next: NJZ Directory Guide
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'njz-directory': {
      title: 'NJZ Directory Guide',
      category: 'Platform Guides',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">NJZ Directory Guide</h1>
          <div class="article-meta">
            <span>Platform Guides</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>The <strong>NJZ Directory</strong> (also known as the NJZ Grid) is the central navigation system of the SATOR platform. Understanding how to use it effectively will enhance your experience across all HUBs.</p>
          
          <h2>Grid Layout</h2>
          <p>The NJZ Grid presents four main HUBs in a 2x2 layout:</p>
          <ul>
            <li><strong>Top-Left:</strong> Statistical Reference HUB (Blue)</li>
            <li><strong>Top-Right:</strong> Advanced Analytics HUB (Purple)</li>
            <li><strong>Bottom-Left:</strong> eSports HUB (Red)</li>
            <li><strong>Bottom-Right:</strong> Fantasy eSports HUB (Green)</li>
          </ul>
          
          <h2>Center Button</h2>
          <p>The glowing center button serves multiple purposes:</p>
          <ul>
            <li><strong>Visual Anchor:</strong> Represents the SATOR brand</li>
            <li><strong>Help Access:</strong> Click to open this Help Center</li>
            <li><strong>Home Navigation:</strong> Double-click to return to landing page</li>
          </ul>
          
          <h2>HUB Cards</h2>
          <p>Each HUB card provides:</p>
          <ul>
            <li>Distinctive icon representing the HUB's purpose</li>
            <li>Color-coded theme for easy identification</li>
            <li>Hover effects with glow animations</li>
            <li>Quick access to enter the HUB</li>
          </ul>
          
          <h2>Navigation Patterns</h2>
          <p>Common navigation patterns include:</p>
          <ol>
            <li><strong>Direct Access:</strong> Click any HUB card to enter</li>
            <li><strong>Context Switching:</strong> Use HUB switcher within any HUB</li>
            <li><strong>Return to Grid:</strong> Click logo or use Alt+H</li>
          </ol>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="getting-started">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: Getting Started
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="stat-ref">
            Next: Statistical Reference
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'stat-ref': {
      title: 'HUB 1/4: Statistical Reference Guide',
      category: 'HUB Guides',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">HUB 1/4: Statistical Reference Guide</h1>
          <div class="article-meta">
            <span>HUB Guides</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>The <strong>Statistical Reference HUB</strong> provides comprehensive player and team statistics for esports titles. This guide explains how to effectively use this HUB for research and analysis.</p>
          
          <h2>Understanding the Statistical Reference</h2>
          <p>The Statistical Reference HUB aggregates data from multiple sources to provide:</p>
          <ul>
            <li><strong>Player Statistics:</strong> Individual performance metrics across matches</li>
            <li><strong>Team Analytics:</strong> Aggregated team performance data</li>
            <li><strong>Match History:</strong> Historical match results and statistics</li>
            <li><strong>Leaderboards:</strong> Rankings across various categories</li>
          </ul>
          
          <h2>Key Metrics</h2>
          <p>Understanding the available metrics:</p>
          <ul>
            <li><strong>K/D Ratio:</strong> Kills per death</li>
            <li><strong>ADR:</strong> Average Damage per Round</li>
            <li><strong>KAST:</strong> Kill, Assist, Survive, Trade percentage</li>
            <li><strong>Rating 2.0:</strong> Overall performance rating</li>
            <li><strong>HS%:</strong> Headshot percentage</li>
          </ul>
          
          <h2>Using the 37-Field KCRITR Schema</h2>
          <p>SATOR uses the KCRITR (Key Combat Rating & Insight Tracking Record) schema to standardize player performance data. This comprehensive schema captures:</p>
          <ul>
            <li>Combat statistics (kills, deaths, assists)</li>
            <li>Economic impact (damage, utility usage)</li>
            <li>Positional data (entry success, clutch situations)</li>
            <li>Temporal metrics (consistency over time)</li>
          </ul>
          
          <h2>Search and Filter</h2>
          <p>Use the search functionality to find specific players or teams. Filters allow you to narrow results by:</p>
          <ul>
            <li>Date range</li>
            <li>Tournament tier</li>
            <li>Opponent strength</li>
            <li>Map selection</li>
          </ul>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="njz-directory">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: NJZ Directory
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="analytics">
            Next: Advanced Analytics
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'analytics': {
      title: 'HUB 2/4: Advanced Analytics Guide',
      category: 'HUB Guides',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">HUB 2/4: Advanced Analytics Guide</h1>
          <div class="article-meta">
            <span>HUB Guides</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>The <strong>Advanced Analytics HUB</strong> features the revolutionary <strong>SATOR Square</strong> visualization system, providing unprecedented insights into match dynamics and player performance.</p>
          
          <h2>The SATOR Square</h2>
          <p>The SATOR Square is a 5-layer palindromic visualization system that represents match analysis through multiple dimensions:</p>
          
          <h3>Layer 1: Foundation</h3>
          <p>The base layer shows raw match data including kills, deaths, and economic information. This layer provides the fundamental statistics that power all other visualizations.</p>
          
          <h3>Layer 2: Temporal Flow</h3>
          <p>Shows how match dynamics change over time, revealing momentum shifts and critical moments that influenced the outcome.</p>
          
          <h3>Layer 3: Nexus</h3>
          <p>The central layer where all data converges. This is where complex interactions between players and teams become visible as emergent patterns.</p>
          
          <h3>Layer 4: Predictive</h3>
          <p>Uses machine learning models to project future performance based on current and historical data patterns.</p>
          
          <h3>Layer 5: Synthesis</h3>
          <p>The culmination layer that synthesizes all previous layers into actionable insights and strategic recommendations.</p>
          
          <h2>SimRating System</h2>
          <p>The 5-component SimRating provides a holistic view of player performance:</p>
          <ul>
            <li><strong>Combat:</strong> Raw fighting ability</li>
            <li><strong>Economy:</strong> Resource management</li>
            <li><strong>Positioning:</strong> Map control and rotations</li>
            <li><strong>Clutch:</strong> High-pressure situations</li>
            <li><strong>Consistency:</strong> Performance stability</li>
          </ul>
          
          <h2>RAR (Role-Adjusted Rating)</h2>
          <p>RAR decomposes player performance by role, ensuring fair comparison between players with different responsibilities:</p>
          <ul>
            <li>Entry Fraggers</li>
            <li>Support Players</li>
            <li>AWPers</li>
            <li>In-Game Leaders</li>
            <li>Lurkers</li>
          </ul>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="stat-ref">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: Statistical Reference
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="esports">
            Next: eSports Hub
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'esports': {
      title: 'HUB 3/4: eSports Hub Guide',
      category: 'HUB Guides',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">HUB 3/4: eSports Hub Guide</h1>
          <div class="article-meta">
            <span>HUB Guides</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>The <strong>eSports Hub</strong> is your destination for esports news, match results, tournament coverage, and community features. Stay connected with the competitive gaming world.</p>
          
          <h2>News and Coverage</h2>
          <p>The eSports Hub aggregates news from across the esports ecosystem:</p>
          <ul>
            <li><strong>Breaking News:</strong> Latest developments in the esports world</li>
            <li><strong>Match Coverage:</strong> Live updates and post-match analysis</li>
            <li><strong>Roster Changes:</strong> Player transfers and team updates</li>
            <li><strong>Tournament Previews:</strong> Upcoming event coverage</li>
          </ul>
          
          <h2>Match Results</h2>
          <p>Comprehensive match results with detailed statistics:</p>
          <ul>
            <li>Live match tracking</li>
            <li>Historical match database</li>
            <li>Map-by-map breakdowns</li>
            <li>Player performance highlights</li>
          </ul>
          
          <h2>Tournament Calendar</h2>
          <p>Never miss an important match:</p>
          <ul>
            <li>Upcoming match schedules</li>
            <li>Tournament brackets</li>
            <li>Prize pool information</li>
            <li>Broadcast links</li>
          </ul>
          
          <h2>Community Features</h2>
          <p>Connect with fellow esports enthusiasts:</p>
          <ul>
            <li>Discussion forums</li>
            <li>Prediction leagues</li>
            <li>Fan rankings</li>
            <li>Social sharing</li>
          </ul>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="analytics">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: Advanced Analytics
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="fantasy">
            Next: Fantasy eSports
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'fantasy': {
      title: 'HUB 4/4: Fantasy eSports Guide',
      category: 'HUB Guides',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">HUB 4/4: Fantasy eSports Guide</h1>
          <div class="article-meta">
            <span>HUB Guides</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>The <strong>Fantasy eSports HUB</strong> combines competitive gaming with fantasy sports mechanics, plus access to the RadiantX tactical FPS simulation game.</p>
          
          <h2>Fantasy Leagues</h2>
          <p>Create and manage your fantasy esports teams:</p>
          <ul>
            <li><strong>Draft Players:</strong> Build your roster within salary caps</li>
            <li><strong>Score Points:</strong> Earn points based on real match performance</li>
            <li><strong>Compete:</strong> Join public or private leagues</li>
            <li><strong>Win Prizes:</strong> Compete for leaderboard positions</li>
          </ul>
          
          <h2>Scoring System</h2>
          <p>Points are awarded based on:</p>
          <ul>
            <li>Kills and assists</li>
            <li>Match wins</li>
            <li>MVP performances</li>
            <li>Clutch plays</li>
            <li>Economic efficiency</li>
          </ul>
          
          <h2>RadiantX Game</h2>
          <p>Experience the other side of esports with RadiantX:</p>
          <ul>
            <li><strong>Tactical FPS:</strong> Deterministic combat simulation</li>
            <li><strong>Agent AI:</strong> Advanced AI with belief systems</li>
            <li><strong>20 TPS:</strong> Fixed timestep for precise gameplay</li>
            <li><strong>Replay System:</strong> Analyze every match</li>
          </ul>
          
          <h2>Getting Started</h2>
          <ol>
            <li>Download RadiantX from the Fantasy HUB</li>
            <li>Complete the tutorial matches</li>
            <li>Join your first fantasy league</li>
            <li>Start competing!</li>
          </ol>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="esports">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: eSports Hub
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="faq">
            Next: FAQ
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'faq': {
      title: 'Frequently Asked Questions',
      category: 'Support',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">Frequently Asked Questions</h1>
          <div class="article-meta">
            <span>Support</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <h2>General Questions</h2>
          
          <h3>What is SATOR?</h3>
          <p>SATOR is a comprehensive esports analytics and simulation platform that combines statistical analysis, advanced visualizations, and competitive gaming features.</p>
          
          <h3>Is SATOR free to use?</h3>
          <p>Yes, the core features of SATOR are free to use. Some advanced features may require registration or subscription in the future.</p>
          
          <h3>What games does SATOR support?</h3>
          <p>Currently, SATOR focuses on tactical FPS titles, with Valorant being the primary supported game. We plan to expand to other esports titles in the future.</p>
          
          <h2>Technical Questions</h2>
          
          <h3>Why is the site loading slowly?</h3>
          <p>Check the Dashboard tab in this Help Center for current system status. If all systems are operational, try clearing your browser cache or using a different browser.</p>
          
          <h3>Does SATOR work on mobile?</h3>
          <p>Yes, SATOR is designed to be responsive and works on mobile devices, though some advanced analytics features are best experienced on desktop.</p>
          
          <h3>How often is data updated?</h3>
          <p>Match data is typically updated within minutes of match completion. Statistics are recalculated daily for accuracy.</p>
          
          <h2>Account Questions</h2>
          
          <h3>Do I need an account?</h3>
          <p>No, you can browse most features without an account. However, some features like fantasy leagues require registration.</p>
          
          <h3>How do I delete my account?</h3>
          <p>Contact support to request account deletion. All personal data will be removed within 30 days.</p>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="fantasy">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: Fantasy eSports
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="contact">
            Next: Contact Support
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    },
    'contact': {
      title: 'Contact Support',
      category: 'Support',
      lastUpdated: '2026-03-04',
      content: `
        <div class="article-header">
          <h1 class="article-title">Contact Support</h1>
          <div class="article-meta">
            <span>Support</span>
            <span>•</span>
            <span>Updated ${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div class="article-content">
          <p>Need help? We're here to assist you. Choose the most appropriate contact method below.</p>
          
          <h2>Contact Methods</h2>
          
          <h3>Email Support</h3>
          <p>For general inquiries and support requests:</p>
          <p><a href="mailto:support@satorplatform.com" style="color: var(--help-primary);">support@satorplatform.com</a></p>
          <p>Response time: 24-48 hours</p>
          
          <h3>Bug Reports</h3>
          <p>Found a bug? Please include:</p>
          <ul>
            <li>Description of the issue</li>
            <li>Steps to reproduce</li>
            <li>Browser and device information</li>
            <li>Screenshots if applicable</li>
          </ul>
          <p>Email: <a href="mailto:bugs@satorplatform.com" style="color: var(--help-primary);">bugs@satorplatform.com</a></p>
          
          <h3>Feature Requests</h3>
          <p>Have an idea to improve SATOR? We'd love to hear it:</p>
          <p><a href="mailto:feedback@satorplatform.com" style="color: var(--help-primary);">feedback@satorplatform.com</a></p>
          
          <h3>Social Media</h3>
          <p>Follow us for updates:</p>
          <ul>
            <li>Twitter: @SATORPlatform</li>
            <li>Discord: discord.gg/sator</li>
            <li>Reddit: r/SATORPlatform</li>
          </ul>
          
          <h2>Developer Access</h2>
          <p>For API access and developer-related inquiries, use the Developer tab in this Help Center.</p>
          
          <blockquote>
            "We value your feedback and strive to respond to all inquiries within 48 hours."
          </blockquote>
        </div>
        <div class="article-nav">
          <button class="article-nav-btn" data-prev="faq">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Previous: FAQ
          </button>
          <button class="article-nav-btn article-nav-btn--next" data-next="getting-started">
            Next: Getting Started
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      `
    }
  };

  // ============================================
  // HELP PANEL CLASS
  // ============================================

  class HelpPanel {
    constructor() {
      this.overlay = document.getElementById('help-panel-overlay');
      this.backdrop = this.overlay?.querySelector('[data-help-backdrop]');
      this.container = this.overlay?.querySelector('[data-help-panel-content]');
      this.closeBtn = this.overlay?.querySelector('[data-help-close]');
      
      this.currentTab = 'guides';
      this.isOpen = false;
      this.isDeveloperAuthenticated = false;
      this.currentArticle = 'getting-started';
      this.openDevPanel = 'system-logs';
      
      // Touch handling
      this.touchStartX = 0;
      this.touchStartY = 0;
      
      this.init();
    }

    init() {
      if (!this.overlay) return;
      
      this.bindEvents();
      this.loadArticle('getting-started');
      this.setupDeveloperPanel();
    }

    bindEvents() {
      // Close button
      this.closeBtn?.addEventListener('click', () => this.close());
      
      // Backdrop click
      this.backdrop?.addEventListener('click', () => this.close());
      
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
        if (e.key === '?' && !this.isInputFocused()) {
          e.preventDefault();
          this.open();
        }
      });
      
      // Tab switching
      this.overlay.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });
      
      // Guide links
      this.overlay.querySelectorAll('[data-article]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.loadArticle(link.dataset.article);
          this.updateActiveGuideLink(link);
        });
      });
      
      // Search functionality
      const searchInput = document.getElementById('guides-search');
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce((e) => {
          this.searchGuides(e.target.value);
        }, CONFIG.debounceDelay));
      }
      
      // Refresh dashboard
      const refreshBtn = document.getElementById('refresh-dashboard');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.refreshDashboard(refreshBtn));
      }
      
      // Password form
      const passwordForm = document.getElementById('password-form');
      if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
      }
      
      // Swipe gestures
      this.setupSwipeGestures();
      
      // Article navigation
      this.overlay.addEventListener('click', (e) => {
        const navBtn = e.target.closest('[data-prev], [data-next]');
        if (navBtn) {
          e.preventDefault();
          const articleId = navBtn.dataset.prev || navBtn.dataset.next;
          if (articleId) {
            this.loadArticle(articleId);
            this.updateActiveGuideLinkById(articleId);
          }
        }
      });
    }

    // ============================================
    // PANEL OPERATIONS
    // ============================================

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      
      this.overlay.classList.add('help-panel-overlay--open');
      document.body.style.overflow = 'hidden';
      
      // Store previous focus
      this.previousFocus = document.activeElement;
      
      // Focus management
      setTimeout(() => {
        this.container?.focus();
        this.trapFocus();
      }, 100);
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      
      this.overlay.classList.remove('help-panel-overlay--open');
      document.body.style.overflow = '';
      
      // Restore previous focus
      if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
        this.previousFocus.focus();
      }
      
      this.releaseFocusTrap();
    }

    // ============================================
    // TAB SWITCHING
    // ============================================

    switchTab(tabName) {
      if (tabName === this.currentTab) return;
      
      // Update tab buttons
      this.overlay.querySelectorAll('[data-tab]').forEach(tab => {
        const isActive = tab.dataset.tab === tabName;
        tab.classList.toggle('help-tab--active', isActive);
        tab.setAttribute('aria-selected', isActive.toString());
      });
      
      // Update tab content
      this.overlay.querySelectorAll('[data-tab-content]').forEach(content => {
        const isActive = content.dataset.tabContent === tabName;
        content.classList.toggle('tab-content--active', isActive);
      });
      
      // Update panel attributes
      const tabPanel = this.overlay.querySelector('.help-panel-content');
      if (tabPanel) {
        tabPanel.id = `tabpanel-${tabName}`;
        tabPanel.setAttribute('aria-labelledby', `tab-${tabName}`);
      }
      
      this.currentTab = tabName;
    }

    // ============================================
    // GUIDES TAB
    // ============================================

    loadArticle(articleId) {
      const article = ARTICLES[articleId];
      if (!article) return;
      
      const container = document.getElementById('article-content');
      if (!container) return;
      
      // Fade out
      container.style.opacity = '0';
      
      setTimeout(() => {
        container.innerHTML = article.content;
        this.currentArticle = articleId;
        
        // Fade in
        container.style.opacity = '1';
        container.style.transition = 'opacity 200ms ease';
        
        // Scroll to top
        container.scrollTop = 0;
      }, 150);
    }

    updateActiveGuideLink(activeLink) {
      this.overlay.querySelectorAll('.guide-link').forEach(link => {
        link.classList.remove('guide-link--active');
      });
      activeLink.classList.add('guide-link--active');
    }

    updateActiveGuideLinkById(articleId) {
      const link = this.overlay.querySelector(`[data-article="${articleId}"]`);
      if (link) {
        this.updateActiveGuideLink(link);
      }
    }

    searchGuides(query) {
      const normalizedQuery = query.toLowerCase().trim();
      const links = this.overlay.querySelectorAll('.guide-link');
      const sections = this.overlay.querySelectorAll('.guides-section');
      
      if (!normalizedQuery) {
        // Show all
        links.forEach(link => link.classList.remove('guide-link--hidden'));
        sections.forEach(section => section.style.display = '');
        return;
      }
      
      links.forEach(link => {
        const text = link.textContent.toLowerCase();
        const articleId = link.dataset.article;
        const article = ARTICLES[articleId];
        
        const matches = text.includes(normalizedQuery) || 
                       (article && (
                         article.title.toLowerCase().includes(normalizedQuery) ||
                         article.content.toLowerCase().includes(normalizedQuery)
                       ));
        
        link.classList.toggle('guide-link--hidden', !matches);
      });
      
      // Hide empty sections
      sections.forEach(section => {
        const visibleLinks = section.querySelectorAll('.guide-link:not(.guide-link--hidden)');
        section.style.display = visibleLinks.length > 0 ? '' : 'none';
      });
    }

    // ============================================
    // DASHBOARD TAB
    // ============================================

    refreshDashboard(button) {
      button.classList.add('refresh-btn--spinning');
      button.disabled = true;
      
      // Simulate refresh
      setTimeout(() => {
        button.classList.remove('refresh-btn--spinning');
        button.disabled = false;
        
        // Update timestamp
        const timestamp = this.overlay.querySelector('.health-score-timestamp');
        if (timestamp) {
          timestamp.textContent = 'Last checked: Just now';
        }
        
        // Show toast or feedback (optional)
        console.log('Dashboard refreshed');
      }, 1500);
    }

    // ============================================
    // DEVELOPER TAB
    // ============================================

    setupDeveloperPanel() {
      // Section tabs
      this.overlay.querySelectorAll('.dev-section-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const section = tab.dataset.section;
          this.openDeveloperPanel(section);
          this.updateDevSectionTabs(tab);
        });
      });
      
      // Panel toggles
      this.overlay.querySelectorAll('.dev-panel-header').forEach(header => {
        header.addEventListener('click', () => {
          const panel = header.closest('.dev-panel');
          const panelId = panel.dataset.panel;
          this.toggleDevPanel(panel, panelId);
        });
      });
    }

    handlePasswordSubmit(e) {
      e.preventDefault();
      
      const input = document.getElementById('dev-password');
      const error = document.getElementById('password-error');
      const password = input?.value || '';
      
      if (password === CONFIG.developerPassword) {
        this.isDeveloperAuthenticated = true;
        this.showDeveloperContent();
        error?.classList.remove('password-error--visible');
      } else {
        error?.classList.add('password-error--visible');
        input.value = '';
        input.focus();
      }
    }

    showDeveloperContent() {
      const gate = document.getElementById('password-gate');
      const content = document.getElementById('developer-content');
      
      if (gate) gate.classList.add('hidden');
      if (content) content.classList.remove('hidden');
    }

    openDeveloperPanel(panelId) {
      this.openDevPanel = panelId;
      
      this.overlay.querySelectorAll('.dev-panel').forEach(panel => {
        const isTarget = panel.dataset.panel === panelId;
        panel.classList.toggle('dev-panel--open', isTarget);
      });
    }

    toggleDevPanel(panel, panelId) {
      const isOpen = panel.classList.contains('dev-panel--open');
      
      // Close all others (accordion style - optional, can be removed for multiple open)
      this.overlay.querySelectorAll('.dev-panel').forEach(p => {
        p.classList.remove('dev-panel--open');
      });
      
      if (!isOpen) {
        panel.classList.add('dev-panel--open');
        this.openDevPanel = panelId;
        this.updateDevSectionTabsByPanel(panelId);
      } else {
        this.openDevPanel = null;
      }
    }

    updateDevSectionTabs(activeTab) {
      this.overlay.querySelectorAll('.dev-section-tab').forEach(tab => {
        tab.classList.toggle('dev-section-tab--active', tab === activeTab);
      });
    }

    updateDevSectionTabsByPanel(panelId) {
      this.overlay.querySelectorAll('.dev-section-tab').forEach(tab => {
        tab.classList.toggle('dev-section-tab--active', tab.dataset.section === panelId);
      });
    }

    // ============================================
    // SWIPE GESTURES
    // ============================================

    setupSwipeGestures() {
      const tabs = ['guides', 'dashboards', 'developer'];
      
      this.overlay.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }, { passive: true });
      
      this.overlay.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // Only handle horizontal swipes
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > CONFIG.swipeThreshold) {
          const currentIndex = tabs.indexOf(this.currentTab);
          
          if (deltaX > 0 && currentIndex > 0) {
            // Swipe right - previous tab
            this.switchTab(tabs[currentIndex - 1]);
          } else if (deltaX < 0 && currentIndex < tabs.length - 1) {
            // Swipe left - next tab
            this.switchTab(tabs[currentIndex + 1]);
          }
        }
      }, { passive: true });
    }

    // ============================================
    // FOCUS MANAGEMENT
    // ============================================

    trapFocus() {
      const focusableElements = this.overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      this.focusTrapHandler = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };
      
      this.overlay.addEventListener('keydown', this.focusTrapHandler);
      firstElement.focus();
    }

    releaseFocusTrap() {
      if (this.focusTrapHandler) {
        this.overlay.removeEventListener('keydown', this.focusTrapHandler);
        this.focusTrapHandler = null;
      }
    }

    isInputFocused() {
      const active = document.activeElement;
      return active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.contentEditable === 'true'
      );
    }

    // ============================================
    // UTILITIES
    // ============================================

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
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  // Create global instance
  let helpPanel = null;

  function initHelpPanel() {
    helpPanel = new HelpPanel();
    window.helpPanel = helpPanel;
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('helpPanelReady', { detail: helpPanel }));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpPanel);
  } else {
    initHelpPanel();
  }

  // Expose for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HelpPanel };
  }

})();
