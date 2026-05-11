/**
 * SATOR Station — Analytics HUB
 * Raw Mapping URLs: /sator, /sator/:game, /sator/:game/:feature
 */

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GAMES = ['valorant', 'cs2', 'lol', 'dota2'];

function StationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-indigo-500/30 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44" />
                </svg>
              </div>
              <Link to="/sator" className="text-lg font-bold text-indigo-400">SATOR</Link>
              <span className="text-white/40 text-sm ml-2">Analytics HUB</span>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/60">← TENET</Link>
          </div>
        </div>
      </header>

      <div className="border-b border-white/5 bg-[#0f0f16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3">
            {GAMES.map(g => (
              <Link key={g} to={`/sator/${g}`} className="px-3 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/5">
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">SATOR Station</h1>
          <p className="text-white/50 max-w-lg mx-auto">Analytics HUB — Predictive intelligence and statistical analysis.</p>
        </motion.div>
      </div>
    </StationLayout>
  );
}

function SatorStation() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
    </Routes>
  );
}

export default SatorStation;
