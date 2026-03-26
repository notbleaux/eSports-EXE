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
import { TeNeTPortal, TeNETDirectory, WorldPortRouter } from '@/hub-5-tenet';
import { AppErrorBoundary } from '@/components/error';
import { AdminGuard } from '@/components/AdminGuard';

// Lazy load pages for code splitting
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const TeamProfilePage = lazy(() => import('./pages/TeamProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * HubRoute Wrapper
 * Adds AppErrorBoundary to route elements
 */
const HubRoute = ({ children }: { children: React.ReactNode }) => (
  <AppErrorBoundary>
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      {children}
    </Suspense>
  </AppErrorBoundary>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeNeTPortal />} />
        <Route path="/hubs" element={<TeNETDirectory />} />
        
        {/* World-Port Hierarchical Routing */}
        <Route path="/:gameId/*" element={<WorldPortRouter />} />

        {/* Legacy redirects */}
        <Route path="/valorant" element={<Navigate to="/valorant/analytics" replace />} />
        <Route path="/cs2"      element={<Navigate to="/cs2/analytics"      replace />} />
        <Route path="/analytics"  element={<Navigate to="/valorant/analytics" replace />} />
        <Route path="/stats"      element={<Navigate to="/valorant/stats" replace />} />
        <Route path="/community"  element={<Navigate to="/valorant/community" replace />} />
        <Route path="/pro-scene"  element={<Navigate to="/valorant/pro-scene" replace />} />
        <Route path="/sator" element={<Navigate to="/valorant/analytics" replace />} />
        <Route path="/rotas" element={<Navigate to="/valorant/stats" replace />} />
        <Route path="/arepo" element={<Navigate to="/valorant/community" replace />} />
        <Route path="/opera" element={<Navigate to="/valorant/pro-scene" replace />} />
        <Route path="/tenet" element={<Navigate to="/hubs" replace />} />

        {/* Global profile pages */}
        <Route path="/player/:slug" element={<HubRoute><PlayerProfilePage /></HubRoute>} />
        <Route path="/team/:slug"   element={<HubRoute><TeamProfilePage /></HubRoute>} />
        <Route path="/admin" element={<AdminGuard><HubRoute><AdminDashboard /></HubRoute></AdminGuard>} />

        {/* 404 fallback */}
        <Route path="*" element={<HubRoute><NotFoundPage /></HubRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
