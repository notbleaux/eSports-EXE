/**
 * OPERA Station — Pro Scene HUB
 * Raw Mapping URLs: /opera, /opera/:game, /opera/:game/:feature
 */

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GAMES = ['valorant', 'cs2', 'lol', 'dota2'];

function StationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-orange-500/30 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </div>
              <Link to="/opera" className="text-lg font-bold text-orange-400">OPERA</Link>
              <span className="text-white/40 text-sm ml-2">Pro Scene HUB</span>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/60">← TENET</Link>
          </div>
        </div>
      </header>

      <div className="border-b border-white/5 bg-[#0f0f16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3">
            {GAMES.map(g => (
              <Link key={g} to={`/opera/${g}`} className="px-3 py-1.5 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/5">
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">OPERA Station</h1>
          <p className="text-white/50 max-w-lg mx-auto">Pro Scene HUB — Live matches, VODs, and professional esports coverage.</p>
        </motion.div>
      </div>
    </StationLayout>
  );
}

function OperaStation() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
    </Routes>
  );
}

export default OperaStation;
