/**
 * Main App Component - Libre-X-eSport 4NJZ4 TENET Platform
 * Optimized Bundle Loading with Intelligent Prefetching
 * 
 * [Ver006.000] - Optimized code splitting with prefetch on hover
 */
import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation and Layout Components (eager loaded for fast initial render)
import Navigation from './components/Navigation';
import ModernQuarterGrid from './components/ModernQuarterGrid';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { PanelSkeleton } from './components/grid/PanelSkeleton';
import { PanelErrorBoundary } from './components/grid/PanelErrorBoundary';

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

import { UnifiedGrid } from './components/UnifiedGrid';
import { useWorkerError } from './hooks/useWorkerError';
import { useRowHeight } from './store/staticStore';
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

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Route change handler */}
      <RouteChangeHandler />
      
      {/* Navigation */}
      <Navigation />
      
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
            {/* Landing Page */}
            <Route 
              path="/" 
              element={
                <PageTransition hubId="landing">
                  <ModernQuarterGrid />
                </PageTransition>
              } 
            />
            
            {/* Dashboard Grid */}
            <Route 
              path="/dashboard" 
              element={
                <PageTransition hubId="dashboard">
                  <DashboardGrid />
                </PageTransition>
              } 
            />
            
            {/* HUB Routes - Wrapped with HubErrorBoundary and specific error boundaries */}
            <Route 
              path="/sator" 
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
            <Route 
              path="/rotas" 
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
            <Route 
              path="/arepo" 
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
            <Route 
              path="/opera" 
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
            <Route 
              path="/tenet" 
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
                        This dimension doesn't exist in the 4NJZ4 universe.
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
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Offline Fallback Modal */}
      {showOfflineModal && isOffline && (
        <OfflineFallback />
      )}
      
      {/* Update Notification */}
      <UpdateNotification checkInterval={30 * 60 * 1000} />
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
      
      {/* PWA Install Prompt */}
      <InstallPrompt delay={3000} />
    </div>
  );
}

/**
 * Main App component with top-level error boundary
 * Wraps the entire application for graceful error handling
 */
function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

export default App;
