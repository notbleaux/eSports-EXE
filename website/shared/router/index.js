/**
 * SATOR Cross-Hub Router
 * Main entry point for the routing system
 */

// Core router
export { 
  CrossHubRouter, 
  router, 
  ROUTES, 
  HUBS 
} from './CrossHubRouter.js';

// URL helpers
export {
  UrlBuilder,
  HubUrls,
  MatchUrls,
  AnalyticsUrls,
  TeamUrls,
  TournamentUrls,
  DownloadUrls,
  UrlUtils,
  urlBuilder,
} from './UrlHelpers.js';

// Route guards
export {
  RouteGuard,
  ContentTierManager,
  routeGuard,
  tierManager,
  PERMISSIONS,
  PROTECTED_ROUTES,
  TIER_CONFIG,
} from './RouteGuards.js';

// Breadcrumbs
export {
  BreadcrumbItem,
  BreadcrumbGenerator,
  BreadcrumbRenderer,
  BreadcrumbReact,
  breadcrumbGenerator,
  breadcrumbRenderer,
  BREADCRUMB_PRESETS,
} from '../components/Breadcrumbs.js';

// Error handling
export {
  ErrorHandler,
  ErrorPageGenerator,
  OfflineManager,
  errorHandler,
  errorPageGenerator,
  offlineManager,
  ERROR_TYPES,
  ERROR_PAGES,
} from '../components/ErrorHandling.js';

// Analytics
export {
  AnalyticsManager,
  HubTransitionFunnel,
  ConversionTracker,
  analyticsManager,
  hubTransitionFunnel,
  conversionTracker,
  ANALYTICS_EVENTS,
} from '../analytics/AnalyticsIntegration.js';

// Convenience re-exports
export { default as Router } from './CrossHubRouter.js';
export { default as UrlHelpers } from './UrlHelpers.js';
export { default as Guards } from './RouteGuards.js';
export { default as Breadcrumbs } from '../components/Breadcrumbs.js';
export { default as Errors } from '../components/ErrorHandling.js';
export { default as Analytics } from '../analytics/AnalyticsIntegration.js';

// Initialize on import
if (typeof window !== 'undefined') {
  // Auto-initialize router
  router.init();
  
  // Expose to window
  window.SatorRouter = {
    router,
    urlBuilder,
    routeGuard,
    breadcrumbGenerator,
    errorHandler,
    analyticsManager,
    ROUTES,
    HUBS,
  };
}
