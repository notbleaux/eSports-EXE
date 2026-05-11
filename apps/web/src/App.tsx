/**
 * Main App Component — TENET Platform v3.0
 * RAW MAPPING — Simple URLs, no coordinate encoding
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Lazy load station components
const RotasStation = lazy(() => import('./stations/RotasStation'));
const SatorStation = lazy(() => import('./stations/SatorStation'));
const OperaStation = lazy(() => import('./stations/OperaStation'));
const ArepoStation = lazy(() => import('./stations/ArepoStation'));
const LibreStation = lazy(() => import('./stations/LibreStation'));
const TenetCentral = lazy(() => import('./stations/TenetCentral'));

// Landing Page
import { ValorantLanding } from './components/landing/ValorantLanding';

// Loading fallback
const StationLoading = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-white/20 border-t-teal-400 rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<ValorantLanding />} />

          {/* HUB Stations — Raw Mapping */}
          <Route path="/rotas/*" element={
            <Suspense fallback={<StationLoading />}>
              <RotasStation />
            </Suspense>
          } />
          
          <Route path="/sator/*" element={
            <Suspense fallback={<StationLoading />}>
              <SatorStation />
            </Suspense>
          } />
          
          <Route path="/opera/*" element={
            <Suspense fallback={<StationLoading />}>
              <OperaStation />
            </Suspense>
          } />
          
          <Route path="/arepo/*" element={
            <Suspense fallback={<StationLoading />}>
              <ArepoStation />
            </Suspense>
          } />
          
          <Route path="/libre/*" element={
            <Suspense fallback={<StationLoading />}>
              <LibreStation />
            </Suspense>
          } />
          
          <Route path="/tenet/*" element={
            <Suspense fallback={<StationLoading />}>
              <TenetCentral />
            </Suspense>
          } />

          {/* Legacy Redirects */}
          <Route path="/analytics" element={<Navigate to="/sator" replace />} />
          <Route path="/stats" element={<Navigate to="/rotas" replace />} />
          <Route path="/community" element={<Navigate to="/arepo" replace />} />
          <Route path="/pro-scene" element={<Navigate to="/opera" replace />} />
          <Route path="/hubs" element={<Navigate to="/tenet" replace />} />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-center">
              <div>
                <h1 className="text-6xl font-bold text-white/20 mb-4">404</h1>
                <p className="text-white/40 mb-8">Page not found</p>
                <a href="/" className="px-6 py-3 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors">
                  Return Home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}

export default App;
