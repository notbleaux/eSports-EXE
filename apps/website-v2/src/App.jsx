/**
 * Main App Component - Libre-X-eSport 4NJZ4 TENET Platform
 * Modernized with enhanced visuals and animations
 * 
 * [Ver003.000]
 */
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation and Layout Components
import Navigation from './components/Navigation';
import ModernQuarterGrid from './components/ModernQuarterGrid';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { PanelSkeleton } from './components/grid/PanelSkeleton';
import { PanelErrorBoundary } from './components/grid/PanelErrorBoundary';

// Hub Components
import SatorHub from './hub-1-sator/index.jsx';
import RotasHub from './hub-2-rotas/index.jsx';
import ArepoHub from './hub-3-arepo/index.jsx';
import OperaHub from './hub-4-opera/index.jsx';
import TenetHub from './hub-5-tenet/index.jsx';
import QuaternaryGrid from './components/QuaternaryGrid';
import { UnifiedGrid } from './components/UnifiedGrid';
import { useWorkerError } from './hooks/useWorkerError';
import { useState, useCallback } from 'react';
import { useRowHeight } from './store/staticStore';

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
    console.error('[DashboardGrid] Worker error:', error);
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

// Route change handler
const RouteChangeHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  
  return null;
};

function App() {
  const location = useLocation();

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
            
            {/* HUB Routes */}
            <Route 
              path="/sator" 
              element={
                <PageTransition hubId="sator">
                  <SatorHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/rotas" 
              element={
                <PageTransition hubId="rotas">
                  <RotasHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/arepo" 
              element={
                <PageTransition hubId="arepo">
                  <ArepoHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/opera" 
              element={
                <PageTransition hubId="opera">
                  <OperaHub />
                </PageTransition>
              } 
            />
            <Route 
              path="/tenet" 
              element={
                <PageTransition hubId="tenet">
                  <TenetHub />
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
      </main>
    </div>
  );
}

export default App;
