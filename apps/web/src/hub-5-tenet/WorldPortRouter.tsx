import React, { lazy, Suspense } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { GameNodeIDFrame } from './GameNodeIDFrame';

// Hub components — lazy loaded for code splitting
const SATORHub = lazy(() => import('@hub-1/index'));
const ROTASHub = lazy(() => import('@hub-2/index'));
const AREPOHub = lazy(() => import('@hub-3/index'));
const OPERAHub = lazy(() => import('@hub-4/index'));

const HubFallback = () => <div className="p-20 text-center text-white/40 font-mono">INITIALIZING NODE...</div>;

/**
 * WorldPortRouter
 * Orchestrates routing for a specific game world (e.g., /valorant/*).
 * Wraps all hubs in the GameNodeIDFrame.
 */
export function WorldPortRouter() {
  const { gameId } = useParams<{ gameId: string }>();

  if (!gameId) return <Navigate to="/hubs" replace />;

  return (
    <GameNodeIDFrame gameId={gameId}>
      <Suspense fallback={<HubFallback />}>
        <Routes>
          <Route path="analytics/*" element={<SATORHub />} />
          <Route path="community/*" element={<AREPOHub />} />
          <Route path="pro-scene/*" element={<OPERAHub />} />
          <Route path="stats/*" element={<ROTASHub />} />
          
          {/* Default to analytics for now */}
          <Route path="*" element={<Navigate to="analytics" replace />} />
        </Routes>
      </Suspense>
    </GameNodeIDFrame>
  );
}
