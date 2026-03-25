/** [Ver001.002]
 * App Component
 * =============
 * Main application component for the NJZiteGeisTe Platform.
 * Hub components are lazy-loaded for code splitting.
 *
 * Routes:
 * - / - LandingPage with pink Boitano-style hero
 * - /analytics - SATOR Hub (Advanced Analytics)
 * - /stats - ROTAS Hub (Stats Reference)
 * - /community - AREPO Hub (Community)
 * - /pro-scene - OPERA Hub (Pro eSports)
 * - /hubs - TENET Hub (WorldHUBs / game-world selector)
 * - /cs2 - CS2 game world
 * - /valorant - Valorant game world (placeholder)
 *
 * Legacy redirects:
 * - /sator → /analytics
 * - /rotas → /stats
 * - /arepo → /community
 * - /opera → /pro-scene
 * - /tenet → /hubs
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { AppErrorBoundary } from '@/components/error';

// Hub components — lazy loaded for code splitting
const SATORHub = lazy(() => import('@hub-1/index'));
const ROTASHub = lazy(() => import('@hub-2/index'));
const AREPOHub = lazy(() => import('@hub-3/index'));
const OPERAHub = lazy(() => import('@hub-4/index'));
const TENETHub = lazy(() => import('@hub-5/index'));

// Game world components
const CS2World = lazy(() => import('./hub-cs2/index'));

// Page components
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const TeamProfilePage = lazy(() => import('./pages/TeamProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Valorant game world — placeholder until built
const ValorantWorld = () => (
  <div className="p-20 text-center">
    <h1 className="text-4xl font-bold">Valorant</h1>
    <p className="text-gray-500 mt-4">Game world — coming soon</p>
  </div>
);

const HubFallback = () => <div className="p-20 text-center">Loading...</div>;

function HubRoute({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<HubFallback />}>
        {children}
      </Suspense>
    </AppErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analytics"  element={<HubRoute><SATORHub /></HubRoute>} />
        <Route path="/stats"      element={<HubRoute><ROTASHub /></HubRoute>} />
        <Route path="/community"  element={<HubRoute><AREPOHub /></HubRoute>} />
        <Route path="/pro-scene"  element={<HubRoute><OPERAHub /></HubRoute>} />
        <Route path="/hubs"       element={<HubRoute><TENETHub /></HubRoute>} />
        <Route path="/cs2"        element={<HubRoute><CS2World /></HubRoute>} />
        <Route path="/valorant"   element={<HubRoute><ValorantWorld /></HubRoute>} />
        <Route path="/player/:slug" element={<HubRoute><PlayerProfilePage /></HubRoute>} />
        <Route path="/team/:slug"   element={<HubRoute><TeamProfilePage /></HubRoute>} />
        {/* Legacy redirects */}
        <Route path="/sator" element={<Navigate to="/analytics" replace />} />
        <Route path="/rotas" element={<Navigate to="/stats" replace />} />
        <Route path="/arepo" element={<Navigate to="/community" replace />} />
        <Route path="/opera" element={<Navigate to="/pro-scene" replace />} />
        <Route path="/tenet" element={<Navigate to="/hubs" replace />} />
        {/* 404 fallback */}
        <Route path="*" element={<HubRoute><NotFoundPage /></HubRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
