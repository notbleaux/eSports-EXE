/**
 * TENET Station Layout Component
 * Provides consistent layout structure for all -ZiXiS- Stations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { HubId, GameId, GateId } from '../routing/ZiXiSRouter';
import { HUB_STATIONS, TEZET_GAMES, GATE_VOCABULARY, getTeZetRoutes, getGateRoutes } from '../routing/ZiXiSRouter';

// Icon imports (using lucide-react style icons)
const Icons = {
  BarChart3: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  ),
  Brain: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44" />
    </svg>
  ),
  Trophy: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Network: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" />
    </svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  Map: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  ),
};

interface StationLayoutProps {
  hub: HubId;
  children: React.ReactNode;
  showTeZet?: boolean;
  showGates?: boolean;
  activeGame?: GameId;
  activeGate?: GateId;
}

export function StationLayout({ 
  hub, 
  children, 
  showTeZet = true, 
  showGates = false,
  activeGame,
  activeGate 
}: StationLayoutProps) {
  const hubConfig = HUB_STATIONS[hub];
  const location = useLocation();
  const [coordinateDisplay, setCoordinateDisplay] = useState(true);
  
  // Generate current coordinate
  const currentCoordinate = activeGame 
    ? `${hubConfig.name}-ZiXiS-${activeGame}:inXYS-Ace-${hubConfig.system}TOU-LI3-222`
    : `${hubConfig.name}-ZiXiS-Base:inXYS-Ace-${hubConfig.system}TAU-LI3-131181131`;

  const IconComponent = Icons[hubConfig.icon as keyof typeof Icons] || Icons.Network;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Station Header */}
      <header className={`border-b ${hubConfig.borderClass} bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Station Identity */}
            <div className="flex items-center gap-4">
              <motion.div 
                className={`w-10 h-10 rounded-lg ${hubConfig.bgClass} flex items-center justify-center`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent className={`w-5 h-5 ${hubConfig.colorClass}`} />
              </motion.div>
              <div>
                <h1 className={`text-lg font-bold ${hubConfig.colorClass}`}>
                  {hubConfig.name}<span className="text-white/60 text-sm font-normal">-ZiXiS-Station</span>
                </h1>
                <p className="text-xs text-white/40">{hubConfig.title}</p>
              </div>
            </div>

            {/* Coordinate Display Toggle */}
            <button
              onClick={() => setCoordinateDisplay(!coordinateDisplay)}
              className="text-xs text-white/30 hover:text-white/60 transition-colors font-mono"
            >
              {coordinateDisplay ? '[COORD: ON]' : '[COORD: OFF]'}
            </button>
          </div>

          {/* Coordinate Bar */}
          <AnimatePresence>
            {coordinateDisplay && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-2 border-t border-white/5 flex items-center gap-2 text-xs font-mono"
                >
                  <span className="text-white/30">COORD:</span>
                  <span className={hubConfig.colorClass}>{currentCoordinate}</span>
                  <span className="text-white/20 ml-2">| SYS: {hubConfig.system}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* TeZet Game Selection Bar */}
      {showTeZet && (
        <div className="border-b border-white/5 bg-[#0f0f16]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-2 overflow-x-auto">
              <span className="text-xs text-white/30 mr-2 whitespace-nowrap">TeZet:</span>
              {Object.entries(TEZET_GAMES).map(([key, game]) => {
                const isActive = activeGame === key;
                return (
                  <Link
                    key={key}
                    to={`/${hubConfig.id}/${game.id}`}
                    className={`
                      px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
                      ${isActive 
                        ? `${hubConfig.bgClass} ${hubConfig.colorClass} border ${hubConfig.borderClass}` 
                        : 'text-white/50 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    {game.name}
                  </Link>
                );
              })}
              <button className="px-3 py-1.5 rounded-md text-xs text-white/30 hover:text-white/60 transition-colors border border-dashed border-white/10">
                + Add Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gate Navigation (sZiXiSz) */}
      {showGates && activeGame && (
        <div className={`border-b ${hubConfig.borderClass} bg-gradient-to-r ${hubConfig.bgClass} to-transparent`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-3">
              <span className="text-xs text-white/40 mr-2">sZiXiSz:</span>
              {Object.entries(GATE_VOCABULARY).map(([key, gate]) => {
                const isActive = activeGate === key;
                return (
                  <Link
                    key={key}
                    to={`/${hubConfig.id}/${TEZET_GAMES[activeGame].id}/${key}`}
                    className={`
                      group flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all
                      ${isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'}
                    `}
                    title={gate.description}
                  >
                    <span className={isActive ? hubConfig.colorClass : ''}>{key}</span>
                    <span className="text-white/20 group-hover:text-white/40">-</span>
                    <span>{gate.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Station Footer */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-white/30">
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-white/60 transition-colors">
                ← TENET Central
              </Link>
              <span>|</span>
              <span>{hubConfig.coordinate}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/libre" className="hover:text-white/60 transition-colors">
                LIBRE
              </Link>
              <Link to="/libreta" className="hover:text-white/60 transition-colors">
                LIBRETA
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// AnimatePresence wrapper for coordinate display
import { AnimatePresence } from 'framer-motion';

export default StationLayout;
