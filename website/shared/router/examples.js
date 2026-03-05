/**
 * SATOR Cross-Hub Router - Integration Examples
 * Shows how to use the router in each hub
 */

// ============================================
// HUB 1: SATOR - Basic HTML/JS Implementation
// ============================================

// Include in hub1-sator/index.html:
// <script type="module" src="../shared/router/index.js"></script>

// Initialize router for SATOR hub
document.addEventListener('DOMContentLoaded', () => {
  // Access router from window
  const { router, MatchUrls, breadcrumbRenderer } = window.SatorRouter;
  
  // Track page view
  router.trackPageView();
  
  // Generate breadcrumbs
  breadcrumbRenderer.render();
  
  // Handle match links
  document.querySelectorAll('[data-match-id]').forEach(link => {
    link.addEventListener('click', (e) => {
      const matchId = link.dataset.matchId;
      
      // Generate proper URL
      const url = MatchUrls.detail(matchId, { tab: 'overview' });
      
      // Navigate with history
      router.navigate(url);
      
      e.preventDefault();
    });
  });
});

// ============================================
// HUB 2: ROTAS - React Implementation
// ============================================

// RouterHook.jsx
import { useEffect, useCallback } from 'react';
import { router, AnalyticsUrls, breadcrumbGenerator } from '../../shared/router/index.js';

export function useRouter() {
  const navigate = useCallback((to, options) => {
    return router.navigate(to, options);
  }, []);
  
  const goBack = useCallback(() => {
    return router.back();
  }, []);
  
  const generateShareLink = useCallback((route) => {
    return router.generateShareLink(route);
  }, []);
  
  return { navigate, goBack, generateShareLink, router };
}

export function usePageTracking(pageName) {
  useEffect(() => {
    router.trackPageView({ pageName });
  }, [pageName]);
}

export function useBreadcrumbs() {
  return useCallback((path) => {
    return breadcrumbGenerator.generate(path);
  }, []);
}

// AnalyticsLink.jsx - ROTAS specific
import { AnalyticsUrls } from '../../shared/router/index.js';

export function AnalyticsLink({ analyticsId, children, ...props }) {
  const url = AnalyticsUrls.dashboard(analyticsId, { view: 'overview' });
  
  return (
    <a href={url} {...props}>
      {children}
    </a>
  );
}

// ============================================
// HUB 3: INFO - Vue-like Implementation
// ============================================

// router-plugin.js
import { 
  router, 
  TeamUrls, 
  TournamentUrls,
  routeGuard 
} from '../shared/router/index.js';

export default {
  install(app) {
    // Add router to global properties
    app.config.globalProperties.$router = router;
    app.config.globalProperties.$urls = {
      team: TeamUrls,
      tournament: TournamentUrls,
    };
    app.config.globalProperties.$guard = routeGuard;
    
    // Global navigation mixin
    app.mixin({
      mounted() {
        // Track page views automatically
        if (this.$route) {
          router.trackPageView({ 
            pageName: this.$route.name 
          });
        }
      }
    });
  }
};

// TeamDetail.vue usage
/*
<template>
  <div>
    <breadcrumbs :items="breadcrumbs" />
    
    <div v-if="hasAccess">
      <!-- Premium content -->
    </div>
    
    <upgrade-prompt v-else />
  </div>
</template>

<script>
export default {
  async mounted() {
    // Check access before showing content
    const result = await this.$guard.guard(`/info/teams/${this.teamId}`);
    
    if (!result.allowed) {
      this.accessDenied = true;
      this.redirectUrl = result.redirect;
    }
  },
  
  computed: {
    teamUrl() {
      return this.$urls.team.detail(this.teamId, { tab: 'roster' });
    }
  }
}
</script>
*/

// ============================================
// HUB 4: GAMES - Next.js Implementation
// ============================================

// lib/router.js
import { 
  router,
  DownloadUrls,
  errorHandler,
  offlineManager 
} from '../../shared/router/index.js';

export { router, DownloadUrls, errorHandler, offlineManager };

// pages/games/download.js
/*
import { DownloadUrls } from '../../lib/router';

export async function getServerSideProps(context) {
  const { platform, version, beta } = context.query;
  
  // Generate canonical URL
  const canonicalUrl = DownloadUrls.download({ platform, version, beta });
  
  return {
    props: {
      canonicalUrl,
      downloadOptions: getDownloadOptions(platform),
    }
  };
}

export default function DownloadPage({ canonicalUrl, downloadOptions }) {
  useEffect(() => {
    // Track download page view
    router.trackPageView({ page: 'download' });
    
    // Pre-cache for offline
    offlineManager.cacheResources(['/games/download/client.exe']);
  }, []);
  
  const handleDownload = (platform) => {
    // Track conversion
    router.trackConversion('download', 0, { platform });
    
    // Navigate to download
    window.location.href = downloadOptions[platform].url;
  };
  
  return (
    <div>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      
      <Breadcrumb items={breadcrumbGenerator.generate('/games/download')} />
      
      <!-- Download content -->
    </div>
  );
}
*/

// ============================================
// Cross-Hub Navigation Example
// ============================================

// In any hub, link to another hub:
/*
import { HubUrls } from '../shared/router/index.js';

// Get cross-hub URL
const rotasUrl = HubUrls.buildCrossHubUrl('sator', 'rotas', {
  preserveParams: true,
  returnPath: '/sator/matches/123'
});

// Result: '../hub2-rotas/index.html?hub=sator&return=%2Fsator%2Fmatches%2F123'

// In the target hub, read return path:
const params = new URLSearchParams(window.location.search);
const returnPath = params.get('return');
if (returnPath) {
  // Show "Return to SATOR" button
}
*/

// ============================================
// Route Guards Example
// ============================================

import { routeGuard, PERMISSIONS } from '../shared/router/index.js';

// Register custom guard behavior
routeGuard.onAccessDenied = (result, route) => {
  console.log('Access denied:', result.reason);
  
  // Show custom modal instead of redirect
  showAccessDeniedModal({
    reason: result.reason,
    required: result.required,
    current: result.current,
    onUpgrade: () => window.location.href = result.redirect,
  });
};

// Check access programmatically
async function checkPremiumAccess() {
  const result = await routeGuard.checkPermission('/rotas/formulas/custom');
  
  if (result.allowed) {
    showPremiumContent();
  } else {
    showUpgradePrompt(result);
  }
}

// ============================================
// Analytics Integration Example
// ============================================

import { 
  analyticsManager,
  hubTransitionFunnel,
  conversionTracker 
} from '../shared/router/index.js';

// Define conversion goals
conversionTracker.defineGoal('download_game', {
  name: 'Game Download',
  value: 0,
  conditions: [
    { type: 'hub_visit', value: 'games' },
    { type: 'event', value: 'download_started' }
  ]
});

conversionTracker.defineGoal('premium_signup', {
  name: 'Premium Subscription',
  value: 9.99,
  conditions: [
    { type: 'hub_visit', value: 'rotas' },
    { type: 'time_spent', value: 60000 }
  ]
});

// Check goals after events
function onUserAction(action, context) {
  // Track the action
  analyticsManager.trackEvent(action.type, action.data);
  
  // Check if any goals achieved
  conversionTracker.checkGoal('download_game', context);
  conversionTracker.checkGoal('premium_signup', context);
}

// Get funnel data for dashboard
function getFunnelAnalytics() {
  return hubTransitionFunnel.getStats();
  // Returns:
  // {
  //   totalTransitions: 1523,
  //   uniquePaths: 47,
  //   topPaths: [...],
  //   conversionRate: 3.2
  // }
}

// ============================================
// Error Handling Example
// ============================================

import { errorHandler, errorPageGenerator } from '../shared/router/index.js';

// Set up global error handler
window.addEventListener('error', (event) => {
  errorHandler.handle({
    type: 'CRASH',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
  });
});

// Handle 404s
async function loadPage(route) {
  try {
    const response = await fetch(route);
    
    if (response.status === 404) {
      const html = errorPageGenerator.generate404(route);
      document.body.innerHTML = html;
      return;
    }
    
    // Load page content
    const content = await response.text();
    document.getElementById('app').innerHTML = content;
    
  } catch (error) {
    if (!navigator.onLine) {
      // Show offline page
      window.location.href = '/offline.html';
    } else {
      // Show error page
      const html = errorPageGenerator.generateOffline();
      document.body.innerHTML = html;
    }
  }
}

// ============================================
// Breadcrumb Integration Example
// ============================================

import { breadcrumbRenderer, breadcrumbGenerator } from '../shared/router/index.js';

// Auto-render breadcrumbs
breadcrumbRenderer.render();

// Or manually with custom container
breadcrumbRenderer.render('/sator/matches/abc123', document.getElementById('breadcrumbs'));

// React component
function Breadcrumbs({ path }) {
  const items = breadcrumbGenerator.generate(path);
  
  return (
    <nav aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={index} className={item.active ? 'active' : ''}>
          {item.icon && <span className="icon">{item.icon}</span>}
          {item.path ? (
            <a href={item.path}>{item.label}</a>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && <span className="separator">/</span>}
        </span>
      ))}
    </nav>
  );
}

// ============================================
// Deep Linking Example
// ============================================

// Generate shareable link
function shareMatch(matchId) {
  const shareUrl = router.generateShareLink({
    name: 'MATCH_DETAIL',
    params: { id: matchId },
    query: { tab: 'highlights' }
  }, {
    includeState: true,
    expiresIn: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl);
  
  // Track share
  analyticsManager.trackEvent('content_shared', { matchId, platform: 'clipboard' });
}

// Handle incoming deep link
// (Automatically handled by router on init)
// URL: /sator/matches/abc123?dl=%2Fsator%2Fmatches%2Fabc123%3Ftab%3Dhighlights
// Router will navigate to decoded URL and preserve state

// ============================================
// Export summary
// ============================================

export const IntegrationExamples = {
  description: 'Usage examples for all router features across SATOR hubs',
  features: [
    'Basic navigation with URL helpers',
    'React/Vue/Next.js integration patterns',
    'Cross-hub navigation with return paths',
    'Route guards for tiered content',
    'Analytics and conversion tracking',
    'Error handling with custom pages',
    'Breadcrumb generation',
    'Deep linking and share URLs',
  ]
};
