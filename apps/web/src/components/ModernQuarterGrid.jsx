/**
 * ModernQuarterGrid - Redesigned landing page
 * More visual impact, better spacing, enhanced animations
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Activity, Book, Map, Grid3X3, ArrowUpRight } from 'lucide-react';
import { ModernCard } from './ui/ModernCard';
import { colors } from '@/theme/colors';

const HUBS = [
  {
    id: 'sator',
    name: 'SATOR',
    subtitle: 'The Observatory',
    description: 'Raw data ingestion with orbital ring navigation and real-time analytics',
    icon: Eye,
    color: colors.hub.sator.base,
    glow: colors.hub.sator.glow,
    path: '/sator',
    stats: { value: '2.4M', label: 'Records Processed' },
  },
  {
    id: 'rotas',
    name: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    description: 'Advanced predictive analytics with ellipse layer blending technology',
    icon: Activity,
    color: colors.hub.rotas.base,
    glow: colors.hub.rotas.glow,
    path: '/rotas',
    stats: { value: '99.9%', label: 'Prediction Accuracy' },
  },
  {
    id: 'arepo',
    name: 'AREPO',
    subtitle: 'The Directory',
    description: 'Comprehensive Q&A, documentation, and knowledge base system',
    icon: Book,
    color: colors.hub.arepo.base,
    glow: colors.hub.arepo.glow,
    path: '/arepo',
    stats: { value: '247', label: 'Documentation Pages' },
  },
  {
    id: 'opera',
    name: 'OPERA',
    subtitle: 'The Nexus',
    description: 'Interactive maps with fog of war and spatial visualization tools',
    icon: Map,
    color: colors.hub.opera.base,
    glow: colors.hub.opera.glow,
    path: '/opera',
    stats: { value: '6', label: 'Tactical Maps' },
  },
];

const CENTER_HUB = {
  id: 'tenet',
  name: 'TENET',
  subtitle: 'The Center',
  description: 'Unify all perspectives — the palindrome binds all',
  icon: Grid3X3,
  color: colors.hub.tenet.base,
  path: '/tenet',
};

function HubCard({ hub, index }) {
  const Icon = hub.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Link to={hub.path} className="block h-full">
        <ModernCard
          hoverGlow={hub.color}
          icon={Icon}
          iconColor={hub.color}
          title={hub.name}
          subtitle={hub.subtitle}
          className="h-full group"
        >
          <p className="text-white/50 text-sm mb-6 line-clamp-2">
            {hub.description}
          </p>
          
          {/* Stats and CTA row */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <div className="text-2xl font-bold font-mono" style={{ color: hub.color }}>
                {hub.stats.value}
              </div>
              <div className="text-xs text-white/40">
                {hub.stats.label}
              </div>
            </div>
            
            <motion.div
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: hub.color }}
              whileHover={{ x: 4 }}
            >
              <span>Explore</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </motion.div>
          </div>
        </ModernCard>
      </Link>
    </motion.div>
  );
}

function CenterHubCard() {
  const Icon = CENTER_HUB.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative"
    >
      <Link to={CENTER_HUB.path}>
        <motion.div
          className="relative p-8 rounded-3xl overflow-hidden group cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated glow */}
          <motion.div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.3) 0%, transparent 60%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-4xl font-bold text-white mb-2">
              {CENTER_HUB.name}
            </h2>
            <p className="text-white/60 text-lg mb-3">
              {CENTER_HUB.subtitle}
            </p>
            <p className="text-white/40 text-sm max-w-[280px]">
              {CENTER_HUB.description}
            </p>

            {/* Orbiting dots decoration */}
            <div className="absolute inset-0 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white/30"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: Math.cos(i * Math.PI / 2) * 100,
                    y: Math.sin(i * Math.PI / 2) * 100,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    delay: i * 2,
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export function ModernQuarterGrid() {
  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-sm font-mono text-white/60">Platform v2.0 Live</span>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[#ffd700] via-[#00d4ff] to-[#9d4edd] bg-clip-text text-transparent">
              NJZiteGeisTe
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 mb-4 font-light">
            NJZiteGeisTe Platform
          </p>
          
          <p className="text-white/40 max-w-xl mx-auto leading-relaxed">
            Navigate through five interconnected hubs. Each quadrant holds a universe 
            of esports data, analytics, and intelligence.
          </p>
        </motion.div>
      </section>

      {/* Grid Section */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop: 2x2 Grid with Center */}
          <div className="hidden lg:block relative">
            <div className="grid grid-cols-2 gap-6">
              {HUBS.map((hub, index) => (
                <HubCard key={hub.id} hub={hub} index={index} />
              ))}
            </div>

            {/* Center Hub Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto w-72">
                <CenterHubCard />
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Stacked */}
          <div className="lg:hidden space-y-6">
            <CenterHubCard />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HUBS.map((hub, index) => (
                <HubCard key={hub.id} hub={hub} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Status */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div 
            className="flex items-center justify-center gap-6 py-3 px-6 rounded-full"
            style={{
              background: 'rgba(10, 10, 15, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {['SATOR', 'ROTAS', 'AREPO', 'OPERA', 'TENET'].map((name, i) => {
              const colorHub = [colors.hub.sator, colors.hub.rotas, colors.hub.arepo, colors.hub.opera, colors.hub.tenet][i];
              return (
                <div key={name} className="flex items-center gap-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colorHub.base }}
                  />
                  <span className="text-xs font-mono text-white/40">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default ModernQuarterGrid;
