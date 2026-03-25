/**
 * QuarterGrid Component - Central Hub Landing Page
 * 4-quadrant layout with TENET at center
 * [Ver001.000]
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Activity, Book, Map, Grid3X3, ArrowRight, Sparkles } from 'lucide-react';

// Hub data with exact colors and positioning
const QUADRANTS = [
  {
    id: 'sator',
    name: 'SATOR',
    subtitle: 'The Observatory',
    description: 'Raw data ingestion with orbital ring navigation',
    icon: Eye,
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.4)',
    path: '/sator',
    position: 'top-left',
    stats: { value: '2.4M', label: 'Records' },
  },
  {
    id: 'rotas',
    name: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    description: 'Advanced analytics with ellipse layer blending',
    icon: Activity,
    color: '#00d4ff',
    glow: 'rgba(0, 212, 255, 0.4)',
    path: '/rotas',
    position: 'top-right',
    stats: { value: '99.9%', label: 'Accuracy' },
  },
  {
    id: 'arepo',
    name: 'AREPO',
    subtitle: 'The Directory',
    description: 'Q&A, documentation, and knowledge base',
    icon: Book,
    color: '#0066ff',
    glow: 'rgba(0, 102, 255, 0.4)',
    path: '/arepo',
    position: 'bottom-left',
    stats: { value: '247', label: 'Docs' },
  },
  {
    id: 'opera',
    name: 'OPERA',
    subtitle: 'The Nexus',
    description: 'Maps, fog of war, and spatial visualization',
    icon: Map,
    color: '#9d4edd',
    glow: 'rgba(157, 78, 221, 0.4)',
    path: '/opera',
    position: 'bottom-right',
    stats: { value: '6', label: 'Maps' },
  },
];

// TENET center hub data
const CENTER_HUB = {
  id: 'tenet',
  name: 'TENET',
  subtitle: 'The Center',
  description: 'Unify all perspectives — the palindrome binds all',
  icon: Grid3X3,
  color: '#ffffff',
  glow: 'rgba(255, 255, 255, 0.3)',
  path: '/tenet',
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const quadrantVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const centerVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      delay: 0.4,
    },
  },
};

function QuadrantCard({ hub, index }) {
  const Icon = hub.icon;
  
  return (
    <motion.div
      variants={quadrantVariants}
      className="relative group"
    >
      <Link to={hub.path} className="block h-full">
        <div
          className="
            relative h-full min-h-[280px] p-6 md:p-8 rounded-3xl
            bg-white/[0.02] border border-white/10
            transition-all duration-500 overflow-hidden
            group-hover:border-opacity-50 group-hover:bg-white/[0.04]
          "
          style={{
            '--hub-color': hub.color,
          }}
        >
          {/* Background glow on hover */}
          <div
            className="
              absolute inset-0 opacity-0 group-hover:opacity-100
              transition-opacity duration-500 -z-10
            "
            style={{
              background: `radial-gradient(circle at center, ${hub.glow} 0%, transparent 70%)`,
            }}
          />

          {/* Corner accent */}
          <div
            className="absolute top-0 left-0 w-20 h-20 opacity-20 group-hover:opacity-40 transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${hub.color} 0%, transparent 60%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div
                className="
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  transition-transform duration-300 group-hover:scale-110
                "
                style={{ backgroundColor: `${hub.color}20` }}
              >
                <Icon className="w-7 h-7" style={{ color: hub.color }} />
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold font-mono" style={{ color: hub.color }}>
                  {hub.stats.value}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">
                  {hub.stats.label}
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {hub.name}
              </h2>
              <p className="text-sm font-medium" style={{ color: hub.color }}>
                {hub.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-white/50 text-sm mb-6 flex-grow">
              {hub.description}
            </p>

            {/* CTA */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <span 
                className="transition-colors group-hover:text-white"
                style={{ color: hub.color }}
              >
                Enter Hub
              </span>
              <ArrowRight 
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                style={{ color: hub.color }}
              />
            </div>
          </div>

          {/* Animated border on hover */}
          <motion.div
            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              border: `1px solid ${hub.color}`,
              boxShadow: `0 0 30px ${hub.glow}`,
            }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

function CenterCard() {
  const Icon = CENTER_HUB.icon;

  return (
    <motion.div variants={centerVariants} className="relative z-20">
      <Link to={CENTER_HUB.path} className="block group">
        <div
          className="
            relative p-6 md:p-8 rounded-3xl
            bg-gradient-to-br from-white/10 to-white/5
            border border-white/20
            transition-all duration-500
            group-hover:border-white/40 group-hover:from-white/15 group-hover:to-white/8
          "
        >
          {/* Pulsing glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl -z-10"
            animate={{
              boxShadow: [
                '0 0 20px rgba(255,255,255,0.1)',
                '0 0 40px rgba(255,255,255,0.2)',
                '0 0 20px rgba(255,255,255,0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            <div
              className="
                w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                bg-white/10 transition-transform duration-300 group-hover:scale-110
              "
            >
              <Icon className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {CENTER_HUB.name}
            </h2>
            <p className="text-white/60 text-sm mb-4">
              {CENTER_HUB.subtitle}
            </p>
            <p className="text-white/40 text-xs max-w-[200px]">
              {CENTER_HUB.description}
            </p>

            {/* Sparkle animation */}
            <motion.div
              className="absolute top-4 right-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-white/30" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function QuarterGrid() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto text-center mb-12"
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
          animate={{
            boxShadow: ['0 0 0 rgba(0, 212, 255, 0)', '0 0 20px rgba(0, 212, 255, 0.2)', '0 0 0 rgba(0, 212, 255, 0)'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="w-2 h-2 bg-[#00d4ff] rounded-full animate-pulse" />
          <span className="text-sm font-mono text-white/60">NJZiteGeisTe Platform v2.0</span>
        </motion.div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-[#ffd700] via-[#00d4ff] to-[#9d4edd] bg-clip-text text-transparent">
            SATOR AREPO
          </span>
        </h1>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white/80 mb-6">
          TENET OPERA ROTAS
        </h2>

        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          The palindrome binds all — navigate through the five hubs of the TENET platform.
          Each quadrant holds a universe of esports data and analytics.
        </p>
      </motion.div>

      {/* Quarter Grid Layout */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Desktop: 2x2 Grid with Center Overlay */}
        <div className="hidden lg:block relative">
          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6">
            {QUADRANTS.map((hub, index) => (
              <QuadrantCard key={hub.id} hub={hub} index={index} />
            ))}
          </div>

          {/* Center Card Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto transform scale-90">
              <CenterCard />
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Stacked Layout with Center as Hero */}
        <div className="lg:hidden space-y-6">
          {/* Center Card First */}
          <CenterCard />

          {/* Quadrant Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUADRANTS.map((hub, index) => (
              <QuadrantCard key={hub.id} hub={hub} index={index} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="max-w-4xl mx-auto mt-16 text-center"
      >
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'SATOR', color: '#ffd700', status: 'Online' },
              { label: 'ROTAS', color: '#00d4ff', status: 'Online' },
              { label: 'AREPO', color: '#0066ff', status: 'Online' },
              { label: 'OPERA', color: '#9d4edd', status: 'Online' },
              { label: 'TENET', color: '#ffffff', status: 'Online' },
            ].map((hub) => (
              <div key={hub.label} className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hub.color }} />
                  <span className="text-xs font-mono" style={{ color: hub.color }}>
                    {hub.label}
                  </span>
                </div>
                <span className="text-xs text-white/40">{hub.status}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default QuarterGrid;
