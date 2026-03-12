/**
 * Main App Component - Libre-X-eSport 4NJZ4 TENET Platform
 * Final Integration with Navigation and QuarterGrid
 * 
 * [Ver002.000]
 */
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation and Layout Components
import Navigation from './components/Navigation';
import QuarterGrid from './components/QuarterGrid';

// Hub Components
import SatorHub from './hub-1-sator/index.jsx';
import RotasHub from './hub-2-rotas/index.jsx';
import ArepoHub from './hub-3-arepo/index.jsx';
import OperaHub from './hub-4-opera/index.jsx';
import TenetHub from './hub-5-tenet/index.jsx';

// Page transition wrapper with AnimatePresence
const PageTransition = ({ children, hubId }) => {
  const variants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.98,
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
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};

// Route change handler - scroll to top
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
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Route change handler */}
      <RouteChangeHandler />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content with Page Transitions */}
      <main className="relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Landing Page - QuarterGrid */}
            <Route 
              path="/" 
              element={
                <PageTransition hubId="landing">
                  <QuarterGrid />
                </PageTransition>
              } 
            />
            
            {/* SATOR Hub - The Observatory */}
            <Route 
              path="/sator" 
              element={
                <PageTransition hubId="sator">
                  <SatorHub />
                </PageTransition>
              } 
            />
            
            {/* ROTAS Hub - The Harmonic Layer */}
            <Route 
              path="/rotas" 
              element={
                <PageTransition hubId="rotas">
                  <RotasHub />
                </PageTransition>
              } 
            />
            
            {/* AREPO Hub - The Directory */}
            <Route 
              path="/arepo" 
              element={
                <PageTransition hubId="arepo">
                  <ArepoHub />
                </PageTransition>
              } 
            />
            
            {/* OPERA Hub - The Nexus */}
            <Route 
              path="/opera" 
              element={
                <PageTransition hubId="opera">
                  <OperaHub />
                </PageTransition>
              } 
            />
            
            {/* TENET Hub - The Center */}
            <Route 
              path="/tenet" 
              element={
                <PageTransition hubId="tenet">
                  <TenetHub />
                </PageTransition>
              } 
            />
            
            {/* 404 Catch-all */}
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
                      <a 
                        href="/" 
                        className="
                          inline-flex items-center gap-2 px-6 py-3 rounded-xl
                          bg-white/10 text-white font-medium
                          border border-white/20
                          hover:bg-white/20 hover:border-white/40
                          transition-all duration-300
                        "
                      >
                        Return to Center
                      </a>
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
