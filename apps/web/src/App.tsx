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

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';

// Hub components — lazy loaded for code splitting
const SATORHub = lazy(() => import('@hub-1/index'));
const ROTASHub = lazy(() => import('@hub-2/index'));
const AREPOHub = lazy(() => import('@hub-3/index'));
const OPERAHub = lazy(() => import('@hub-4/index'));
const TENETHub = lazy(() => import('@hub-5/index'));

// Game world components
const CS2World = lazy(() => import('./hub-cs2/index'));

// Valorant game world — placeholder until built
const ValorantWorld = () => (
  <div className="p-20 text-center">
    <h1 className="text-4xl font-bold">Valorant</h1>
    <p className="text-gray-500 mt-4">Game world — coming soon</p>
  </div>
);

const HubFallback = () => <div className="p-20 text-center">Loading...</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analytics" element={<Suspense fallback={<HubFallback />}><SATORHub /></Suspense>} />
        <Route path="/stats" element={<Suspense fallback={<HubFallback />}><ROTASHub /></Suspense>} />
        <Route path="/community" element={<Suspense fallback={<HubFallback />}><AREPOHub /></Suspense>} />
        <Route path="/pro-scene" element={<Suspense fallback={<HubFallback />}><OPERAHub /></Suspense>} />
        <Route path="/hubs" element={<Suspense fallback={<HubFallback />}><TENETHub /></Suspense>} />
        <Route path="/cs2" element={<Suspense fallback={<HubFallback />}><CS2World /></Suspense>} />
        <Route path="/valorant" element={<ValorantWorld />} />
        {/* Legacy redirects */}
        <Route path="/sator" element={<Navigate to="/analytics" replace />} />
        <Route path="/rotas" element={<Navigate to="/stats" replace />} />
        <Route path="/arepo" element={<Navigate to="/community" replace />} />
        <Route path="/opera" element={<Navigate to="/pro-scene" replace />} />
        <Route path="/tenet" element={<Navigate to="/hubs" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
