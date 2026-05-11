/**
 * TENET Central — Hub Navigation
 * Raw Mapping URLs: /tenet
 */

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HUBS = [
  { id: 'rotas', name: 'ROTAS', title: 'Stats', color: '#2DD4BF', icon: 'chart' },
  { id: 'sator', name: 'SATOR', title: 'Analytics', color: '#6366F1', icon: 'brain' },
  { id: 'opera', name: 'OPERA', title: 'Pro Scene', color: '#F97316', icon: 'trophy' },
  { id: 'arepo', name: 'AREPO', title: 'Community', color: '#FB7185', icon: 'users' },
];

function TenetCentral() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-violet-500/30 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" />
                </svg>
              </div>
              <span className="text-lg font-bold text-violet-400">TENET Central</span>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/60">← Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to TENET</h1>
            <p className="text-white/50 max-w-2xl mx-auto text-lg">
              Select a HUB station to access esports data, analytics, pro scene coverage, or community features.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HUBS.map((hub, i) => (
            <motion.div
              key={hub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/${hub.id}`}
                className="block p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all h-full"
                style={{ '--hub-color': hub.color } as React.CSSProperties}
              >
                <div 
                  className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${hub.color}20` }}
                >
                  <div className="w-6 h-6" style={{ backgroundColor: hub.color, mask: 'url(#icon)', WebkitMask: 'url(#icon)' }} />
                </div>
                <h3 className="text-xl font-semibold mb-1" style={{ color: hub.color }}>{hub.name}</h3>
                <p className="text-sm text-white/40">{hub.title}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/rotas/valorant" className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg">Valorant Stats →</Link>
            <Link to="/sator" className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg">Analytics →</Link>
            <Link to="/libre" className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg">Documentation →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TenetCentral;
