/**
 * Main App Component - NJZiteGeisTe Platform
 * Optimized Bundle Loading with Intelligent Prefetching
 * 
 * [Ver007.000] - Updated with redesigned landing page components
 */
import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation and Layout Components (eager loaded for fast initial render)
import Navigation from './components/Navigation';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { PanelSkeleton } from './components/grid/PanelSkeleton';
import { PanelErrorBoundary } from './components/grid/PanelErrorBoundary';

// New Redesigned Landing Components
import { HeroV2 } from './components/heroes/HeroV2';
import { HubGridV2 } from './components/hubs/HubGridV2';
import { MascotShowcase } from './components/mascots/MascotShowcase';

// PWA Components
import { OfflineFallback, OfflineIndicator } from './components/OfflineFallback';
import UpdateNotification from './components/UpdateNotification';
import { 
  BottomNavigation, 
  InstallPrompt,
  PullToRefresh 
} from './components/mobile';
import { createLogger } from '@/utils/logger';

const logger = createLogger('App');

// Error Boundaries (eager loaded for error handling)
import { 
  AppErrorBoundary, 
  MLInferenceErrorBoundary, 
  StreamingErrorBoundary,
  HubErrorBoundary 
} from './components/error';

// Lazy load hub components for code splitting with prefetch support
const SatorHub = lazy(() => import('./hub-1-sator/index.jsx'));
const RotasHub = lazy(() => import('./hub-2-rotas/index.jsx'));
const ArepoHub = lazy(() => import('./hub-3-arepo/index.jsx'));
const OperaHub = lazy(() => import('./hub-4-opera/index.tsx'));
const TenetHub = lazy(() => import('./hub-5-tenet/index.jsx'));

// Lazy load heavy ML components with dedicated chunk
const MLPredictionPanel = lazy(() => import('./components/MLPredictionPanel'));
const StreamingPredictionPanel = lazy(() => import('./components/StreamingPredictionPanel'));

// Lazy load performance dashboard (separate chunk)
const PerformanceDashboard = lazy(() => import('./performance/PerformanceDashboard'));

// Lazy load dev tools (separate chunk, only for development)
const MascotPreview = lazy(() => import('./pages/dev/MascotPreview'));

import { UnifiedGrid } from './components/UnifiedGrid';
import { useWorkerError } from './hooks/useWorkerError';
import { performanceMonitor } from './monitoring/PerformanceMonitor';

// Prefetch cache to track loaded modules
const prefetchCache = new Set();

// Prefetch function for route preloading on hover
const prefetchHub = (hubName) => {
  if (prefetchCache.has(hubName)) return;
  
  const prefetchers = {
    sator: () => import('./hub-1-sator/index.jsx'),
    rotas: () => import('./hub-2-rotas/index.jsx'),
    arepo: () => import('./hub-3-arepo/index.jsx'),
    opera: () => import('./hub-4-opera/index.tsx'),
    tenet: () => import('./hub-5-tenet/index.jsx'),
  };
  
  if (prefetchers[hubName]) {
    prefetchCache.add(hubName);
    // Use requestIdleCallback for non-critical prefetching
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchers[hubName]();
        console.log(`[Prefetch] ${hubName} hub loaded`);
      }, { timeout: 2000 });
    } else {
      // Fallback for Safari
      setTimeout(() => {
        prefetchers[hubName]();
      }, 100);
    }
  }
};

// Export for use in Navigation component
export { prefetchHub };

// Loading fallback component with progressive enhancement
const HubLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <PanelSkeleton variant="hub-loading" title="Loading Hub..." />
  </div>
);

// Inline skeleton for faster initial visual
const InlineSkeleton = () => (
  <div className="animate-pulse flex flex-col items-center justify-center min-h-[50vh]">
    <div className="h-8 w-48 bg-white/10 rounded mb-4"></div>
    <div className="h-4 w-32 bg-white/5 rounded"></div>
  </div>
);

// Page transition wrapper
const PageTransition = ({ children, hubId }) => {
  const variants = {
    initial: { 
      opacity: 0, 
      y: 20,
      filter: 'blur(10px)',
    },
    animate: { 
      opacity: 1, 
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: { 
      opacity: 0, 
      y: -20,
      filter: 'blur(10px)',
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      key={hubId}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen relative z-10"
    >
      {children}
    </motion.div>
  );
};

// New Landing Page with redesigned components
function LandingPage() {
  return (
    <div className="min-h-screen bg-off-white">
      {/* Hero Section - Bold pink with geometric elements */}
      <HeroV2 />
      
      {/* Hub Grid - Asymmetric colored cards */}
      <HubGridV2 />
      
      {/* Mascot Showcase - Clean white section */}
      <section className="py-30 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-display uppercase mb-4 text-pure-black">Platform Mascots</h2>
            <p className="text-text-secondary max-w-xl mb-16 text-lg">
              Meet our dual-style mascot system. Toggle between Dropout (full-color) 
              and NJ (minimalist) aesthetics.
            </p>
          </motion.div>
          <MascotShowcase />
        </div>
      </section>
      
      {/* Footer - Simple black */}
      <footer className="bg-pure-black text-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6">
              <h3 className="text-4xl font-display font-bold">NJZiteGeisTe</h3>
              <p className="mt-4 text-text-secondary">NJZiteGeisTe Platform v2.0</p>
            </div>
            <div className="col-span-12 md:col-span-6 flex flex-wrap justify-start md:justify-end gap-6 md:gap-8">
              {[
                { label: 'Analytics', path: '/analytics' },
                { label: 'Stats', path: '/stats' },
                { label: 'Community', path: '/community' },
                { label: 'Pro Scene', path: '/pro-scene' },
                { label: 'Hubs', path: '/hubs' },
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-sm uppercase tracking-widest hover:text-boitano-pink transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary">
              © 2026 NJZiteGeisTe. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-sm text-text-secondary hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-sm text-text-secondary hover:text-white transition-colors">
                Terms
              </a>
              <a href="/contact" className="text-sm text-text-secondary hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Grid with Error Boundary and Loading State
function DashboardGrid() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({ renderTime: 0, visibleCount: 0, mode: 'worker' });
  const { hasError, errorType, retry, fallbackToDom } = useWorkerError(2);

  const handleMetrics = useCallback((newMetrics) => {
    setMetrics(newMetrics);
    if (newMetrics.renderTime > 0) {
      setIsLoading(false);
    }
  }, []);

  const handleError = useCallback((error) => {
    logger.error('DashboardGrid worker error', { error: error instanceof Error ? error.message : String(error) });
    fallbackToDom();
    setIsLoading(false);
  }, [fallbackToDom]);

  const handleWorkerFallback = useCallback(() => {
    console.log('[DashboardGrid] Worker fallback triggered');
    setIsLoading(false);
  }, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-4">
        <PanelSkeleton variant="worker-init" title="Initializing Grid Engine..." />
      </div>
    );
  }

  // Error state with retry
  if (hasError && errorType === 'init-failed') {
    return (
      <div className="p-4 text-center">
        <div className="mb-4 text-red-400">
          Grid rendering unavailable. Using fallback.
        </div>
        <button
          onClick={retry}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Retry Worker
        </button>
        <button
          onClick={fallbackToDom}
          className="ml-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-500/80 rounded-lg text-sm transition-colors"
        >
          Use DOM Fallback
        </button>
      </div>
    );
  }

  return (
    <PanelErrorBoundary panelId="dashboard" panelTitle="Dashboard Grid" hub="TENET">
      <div className="p-4">
        {/* Metrics display */}
        <div className="flex gap-4 mb-4 text-xs text-white/50">
          <span>Mode: {metrics.mode === 'worker' ? '⚡ Worker' : '🌐 DOM'}</span>
          <span>Render: {metrics.renderTime.toFixed(2)}ms</span>
          <span>Panels: {metrics.visibleCount}</span>
        </div>
        
        <UnifiedGrid
          mode="auto"
          overscan={5}
          panelCount={50}
          onPerformanceMetrics={handleMetrics}
          onError={handleError}
          onWorkerFallback={handleWorkerFallback}
          loadingComponent={<PanelSkeleton variant="grid-loading" />}
        />
      </div>
    </PanelErrorBoundary>
  );
}

// Route change handler with performance tracking
const RouteChangeHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Track route change performance
    const routeName = location.pathname === '/' ? 'home' : location.pathname.slice(1);
    performanceMonitor.markUserTiming(`route-${routeName}`);
    
    return () => {
      performanceMonitor.measureUserTiming(`route-${routeName}`);
    };
  }, [location.pathname]);
  
  return null;
};

function AppContent() {
  const location = useLocation();
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Initialize performance monitoring and offline detection
  useEffect(() => {
    performanceMonitor.initialize();
    
    // Enable performance dashboard with keyboard shortcut (Ctrl+Shift+P)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceDashboard(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Handle online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineModal(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineModal(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if current route is the landing page (needs different background)
  const isLandingPage = location.pathname === '/';

  return (
    <div className={`min-h-screen overflow-x-hidden ${isLandingPage ? '' : 'bg-[#050508] text-white'}`}>
      {/* Animated Background - only show for non-landing pages */}
      {!isLandingPage && <AnimatedBackground />}
      
      {/* Route change handler */}
      <RouteChangeHandler />
      
      {/* Navigation - hide on landing page for full immersive experience */}
      {!isLandingPage && <Navigation />}
      
      {/* Main Content */}
      <main className="relative">
        <PullToRefresh 
          onRefresh={async () => {
            // Refresh data - revalidate queries, reload current hub data
            console.log('[PullToRefresh] Refreshing...');
            window.location.reload();
          }}
          pullThreshold={80}
        >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Landing Page - New Redesigned Version */}
            <Route 
              path="/" 
              element={
                <PageTransition hubId="landing">
                  <LandingPage />
                </PageTransition>
              } 
            />
            
            {/* Home / Dashboard Grid */}
            <Route
              path="/home"
              element={
                <PageTransition hubId="home">
                  <DashboardGrid />
                </PageTransition>
              }
            />
            {/* Redirect legacy path */}
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />

            {/* HUB Routes - Wrapped with HubErrorBoundary and specific error boundaries */}
            <Route
              path="/analytics"
              element={
                <PageTransition hubId="sator">
                  <HubErrorBoundary hubName="sator">
                    <MLInferenceErrorBoundary>
                      <Suspense fallback={<HubLoadingFallback />}>
                        <SatorHub />
                      </Suspense>
                    </MLInferenceErrorBoundary>
                  </HubErrorBoundary>
                </PageTransition>
              }
            />
            {/* Redirect legacy path */}
            <Route path="/sator" element={<Navigate to="/analytics" replace />} />
            <Route
              path="/stats"
              element={
                <PageTransition hubId="rotas">
                  <HubErrorBoundary hubName="rotas">
                    <MLInferenceErrorBoundary>
                      <StreamingErrorBoundary>
                        <Suspense fallback={<HubLoadingFallback />}>
                          <RotasHub />
                        </Suspense>
                      </StreamingErrorBoundary>
                    </MLInferenceErrorBoundary>
                  </HubErrorBoundary>
                </PageTransition>
              }
            />
            {/* Redirect legacy path */}
            <Route path="/rotas" element={<Navigate to="/stats" replace />} />
            <Route
              path="/community"
              element={
                <PageTransition hubId="arepo">
                  <HubErrorBoundary hubName="arepo">
                    <Suspense fallback={<HubLoadingFallback />}>
                      <ArepoHub />
                    </Suspense>
                  </HubErrorBoundary>
                </PageTransition>
              }
            />
            {/* Redirect legacy path */}
            <Route path="/arepo" element={<Navigate to="/community" replace />} />
            <Route
              path="/pro-scene"
              element={
                <PageTransition hubId="opera">
                  <HubErrorBoundary hubName="opera">
                    <Suspense fallback={<HubLoadingFallback />}>
                      <OperaHub />
                    </Suspense>
                  </HubErrorBoundary>
                </PageTransition>
              }
            />
            {/* Redirect legacy path */}
            <Route path="/opera" element={<Navigate to="/pro-scene" replace />} />
            <Route
              path="/hubs"
              element={
                <PageTransition hubId="tenet">
                  <HubErrorBoundary hubName="tenet">
                    <Suspense fallback={<HubLoadingFallback />}>
                      <TenetHub />
                    </Suspense>
                  </HubErrorBoundary>
                </PageTransition>
              }
            />
            {/* Redirect legacy path */}
            <Route path="/tenet" element={<Navigate to="/hubs" replace />} />
            
            {/* Dev Tools - Only available in development */}
            <Route 
              path="/dev/mascots" 
              element={
                <PageTransition hubId="dev-mascots">
                  <Suspense fallback={<HubLoadingFallback />}>
                    <MascotPreview />
                  </Suspense>
                </PageTransition>
              } 
            />
            
            {/* 404 */}
            <Route 
              path="*" 
              element={
                <PageTransition hubId="404">
                  <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                      <motion.h1 
                        className="text-6xl md:text-8xl font-bold mb-4"
                        style={{ 
                          background: 'linear-gradient(135deg, #ffd700, #00d4ff, #9d4edd)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        404
                      </motion.h1>
                      <p className="text-xl text-white/60 mb-2">Hub Not Found</p>
                      <p className="text-white/40 mb-8">
                        This dimension doesn&apos;t exist in the NJZiteGeisTe universe.
                      </p>
                      <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium border border-white/20 hover:bg-white/20 transition-all duration-300"
                      >
                        Return to Center
                      </Link>
                    </div>
                  </div>
                </PageTransition>
              } 
            />
          </Routes>
        </AnimatePresence>
        </PullToRefresh>
      </main>
      
      {/* Performance Dashboard (lazy loaded) */}
      {showPerformanceDashboard && (
        <Suspense fallback={null}>
          <PerformanceDashboard />
        </Suspense>
      )}
      
      {/* Offline Indicator - only show for non-landing pages */}
      {!isLandingPage && <OfflineIndicator />}
      
      {/* Offline Fallback Modal */}
      {showOfflineModal && isOffline && (
        <OfflineFallback />
      )}
      
      {/* Update Notification */}
      <UpdateNotification checkInterval={30 * 60 * 1000} />
      
      {/* Mobile Bottom Navigation - only show for non-landing pages */}
      {!isLandingPage && <BottomNavigation />}
      
      {/* PWA Install Prompt */}
      <InstallPrompt delay={3000} />
    </div>
  );
}

/**
 * Main App component with top-level error boundary and router
 * Wraps the entire application for graceful error handling
 */
function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppContent />
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

// Export MascotPreview for use in other components
export { MascotPreview };

export default App;
