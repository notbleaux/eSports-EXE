/**
 * AREPO Station — Community HUB
 * Raw Mapping URLs: /arepo, /arepo/:game, /arepo/:game/:feature
 */

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GAMES = ['valorant', 'cs2', 'lol', 'dota2'];

function StationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-rose-500/30 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <Link to="/arepo" className="text-lg font-bold text-rose-400">AREPO</Link>
              <span className="text-white/40 text-sm ml-2">Community HUB</span>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/60">← TENET</Link>
          </div>
        </div>
      </header>

      <div className="border-b border-white/5 bg-[#0f0f16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3">
            {GAMES.map(g => (
              <Link key={g} to={`/arepo/${g}`} className="px-3 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/5">
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

function Overview() {
  return (
    <StationLayout>
      <div className="text-center py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">AREPO Station</h1>
          <p className="text-white/50 max-w-lg mx-auto">Community HUB — Forums, discussions, and fan engagement.</p>
        </motion.div>
      </div>
    </StationLayout>
  );
}

function ArepoStation() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
    </Routes>
  );
}

export default ArepoStation;
