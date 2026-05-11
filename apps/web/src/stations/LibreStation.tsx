/**
 * LIBRE Station — Knowledge Base
 * Raw Mapping URLs: /libre
 */

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function LibreStation() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-amber-500/30 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <Link to="/libre" className="text-lg font-bold text-amber-400">LIBRE</Link>
              <span className="text-white/40 text-sm ml-2">Knowledge Base</span>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/60">← TENET</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">LIBRE Station</h1>
            <p className="text-white/50 max-w-xl mx-auto">Open Knowledge Base — Documentation, indexes, and librarian services.</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Documentation', desc: 'Platform guides and API references' },
            { title: 'Index', desc: 'Searchable knowledge catalog' },
            { title: 'Archive', desc: 'Historical data and legacy records' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20"
            >
              <h3 className="text-lg font-semibold text-amber-400 mb-2">{item.title}</h3>
              <p className="text-white/50">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default LibreStation;
