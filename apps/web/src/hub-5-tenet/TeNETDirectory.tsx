import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { WorldPortCard } from '@njz/ui';

const WORLD_PORTS = [
  {
    id: 'valorant-port',
    displayName: 'VALORANT',
    game: 'valorant',
    isActive: true,
    nodeCount: 124,
    lastUpdated: '5 mins ago',
    route: '/valorant'
  },
  {
    id: 'cs2-port',
    displayName: 'Counter-Strike 2',
    game: 'cs2',
    isActive: true,
    nodeCount: 89,
    lastUpdated: '12 mins ago',
    route: '/cs2'
  },
  {
    id: 'lol-port',
    displayName: 'League of Legends',
    game: 'lol',
    isActive: false,
    nodeCount: 0,
    lastUpdated: 'Pending Release',
    route: '/lol'
  },
  {
    id: 'apex-port',
    displayName: 'Apex Legends',
    game: 'apex',
    isActive: false,
    nodeCount: 0,
    lastUpdated: 'Pending Release',
    route: '/apex'
  }
];

/**
 * TeNET Network Directory (Game Selector)
 * Routes users to specific World-Ports.
 * [Ver001.000]
 */
export function TeNETDirectory() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8 md:p-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 bg-boitano-pink rounded-full" />
            <span className="text-sm font-mono font-bold uppercase tracking-widest text-white/40">
              TeNET Network Directory
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Select Game World
          </h1>
          <p className="text-lg text-white/50 max-w-2xl">
            Choose a World-Port to access its dedicated analytics, stats, and community hubs.
          </p>
        </motion.div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORLD_PORTS.map((port, index) => (
            <motion.div
              key={port.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <WorldPortCard 
                {...port}
                onClick={() => port.isActive && navigate(port.route)}
                className={!port.isActive ? 'grayscale opacity-50 cursor-not-allowed' : ''}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Breadcrumb / Status */}
      <div className="fixed bottom-10 left-10 hidden md:block">
        <div className="flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-widest text-white/20">
          <span>NJZ Ecosystem</span>
          <span>/</span>
          <span className="text-white/60">TeNET Directory</span>
        </div>
      </div>
    </div>
  );
}
