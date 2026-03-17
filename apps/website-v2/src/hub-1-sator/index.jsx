/**
 * SATOR Hub - Hub 1: The Observatory
 * Raw data ingestion with orbital ring navigation
 * 
 * [Ver002.000] - Consolidated: Merged legacy orbital ring visualization
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Shield, 
  Clock, 
  Users, 
  Trophy, 
  Search, 
  Activity,
  FileCheck 
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { StatsGrid } from './components/StatsGrid';
import { PlayerWidget } from './components/PlayerWidget';
import { useSatorData } from './hooks/useSatorData';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';
import { 
  MLInferenceErrorBoundary, 
  HubErrorBoundary,
  HubErrorFallback 
} from '@/components/error';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';

const HUB_CONFIG = {
  name: 'SATOR',
  subtitle: 'The Observatory',
  description: 'Raw data ingestion with orbital ring navigation',
  color: colors.hub.sator.base,      // #ffd700
  glow: colors.hub.sator.glow,       // rgba(255, 215, 0, 0.4)
  muted: colors.hub.sator.muted,     // #bfa030
};

// Orbital rings data (from legacy version)
const rings = [
  { id: 'teams', label: 'Teams', icon: Users, count: '2,847', color: '#ff9f1c' },
  { id: 'matches', label: 'Matches', icon: Trophy, count: '156', color: '#ff9f1c' },
  { id: 'players', label: 'Players', icon: Users, count: '12,847', color: '#ff9f1c' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: '48', color: '#ff9f1c' },
  { id: 'history', label: 'History', icon: Clock, count: '2.4M', color: '#ff9f1c' }
];

const verificationSteps = [
  { id: 1, label: 'SHA-256 Checksum', status: 'verified', icon: FileCheck },
  { id: 2, label: 'Cross-reference', status: 'verified', icon: FileCheck },
  { id: 3, label: 'Timestamp Sync', status: 'verified', icon: Clock },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

function SatorHubContent() {
  const { stats, players, isLoading, error } = useSatorData();
  const addNotification = useNJZStore(state => state.addNotification);
  const { state, setState } = useHubState('sator');
  
  // Orbital ring state (from legacy)
  const [activeRing, setActiveRing] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Rotation animation (from legacy)
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleRingClick = (ringId) => {
    setActiveRing(activeRing === ringId ? null : ringId);
    addNotification(`${rings.find(r => r.id === ringId)?.label} ring activated`, 'info');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addNotification(`Searching RAWS for "${searchQuery}"...`, 'info');
    }
  };

  return (
    <motion.div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: colors.background.primary }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants}>
        <GlassCard 
          className="p-6 md:p-8 mb-6" 
          hoverGlow={HUB_CONFIG.glow}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Database 
                  className="w-8 h-8" 
                  style={{ color: HUB_CONFIG.color }}
                />
                <h1 
                  className="text-3xl md:text-4xl font-bold tracking-tight"
                  style={{ color: HUB_CONFIG.color }}
                >
                  {HUB_CONFIG.name}
                </h1>
              </div>
              <p 
                className="text-lg font-medium"
                style={{ color: HUB_CONFIG.muted }}
              >
                {HUB_CONFIG.subtitle}
              </p>
              <p className="text-sm mt-2" style={{ color: colors.text.secondary }}>
                {HUB_CONFIG.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
              >
                <Activity className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
                <span className="text-sm font-mono" style={{ color: HUB_CONFIG.color }}>
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Grid Section */}
      <motion.div variants={itemVariants} className="mb-6">
        <GlassCard 
          className="p-6" 
          hoverGlow={HUB_CONFIG.glow}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
            <h2 
              className="text-lg font-semibold"
              style={{ color: HUB_CONFIG.color }}
            >
              Platform Statistics
            </h2>
          </div>
          <StatsGrid 
            stats={stats} 
            isLoading={isLoading} 
            hubColor={HUB_CONFIG.color}
            hubGlow={HUB_CONFIG.glow}
          />
        </GlassCard>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Widgets */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Orbital Ring System - Merged from legacy */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: HUB_CONFIG.color }}
                >
                  Orbital Ring System
                </h2>
              </div>
              <span 
                className="text-xs font-mono px-2 py-1 rounded"
                style={{ 
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  color: HUB_CONFIG.muted 
                }}
              >
                Rotation: {rotation.toFixed(0)}°
              </span>
            </div>

            {/* Orbital Visualization */}
            <div className="relative aspect-square max-w-[500px] mx-auto py-8">
              {/* Background glow */}
              <div 
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(255, 159, 28, 0.05)' }}
              />

              {/* Center - RAWS Core */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div 
                  className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff9f1c, #ea580c)',
                    boxShadow: '0 0 40px rgba(255, 159, 28, 0.4)'
                  }}
                >
                  <span className="font-bold text-xl text-black">RAWS</span>
                  <span className="text-xs font-mono text-black/70">Immutable</span>
                </div>
              </motion.div>

              {/* Orbital Rings */}
              {rings.map((ring, index) => {
                const size = 160 + index * 70;
                const isActive = activeRing === ring.id;

                return (
                  <motion.div
                    key={ring.id}
                    className="absolute top-1/2 left-1/2 rounded-full cursor-pointer"
                    style={{
                      width: size,
                      height: size,
                      marginLeft: -size / 2,
                      marginTop: -size / 2,
                      border: `2px solid ${isActive ? ring.color : 'rgba(255, 159, 28, 0.2)'}`,
                      boxShadow: isActive ? `0 0 30px ${ring.color}40` : 'none'
                    }}
                    animate={{ rotate: rotation * (index % 2 === 0 ? 1 : -1) * (1 / (index + 1)) }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                    onClick={() => handleRingClick(ring.id)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Ring label */}
                    <motion.div
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                      style={{ rotate: -rotation * (index % 2 === 0 ? 1 : -1) * (1 / (index + 1)) }}
                    >
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-mono"
                        style={{
                          backgroundColor: isActive ? '#ff9f1c' : 'rgba(20, 20, 25, 0.9)',
                          color: isActive ? '#000' : '#ff9f1c',
                          border: isActive ? 'none' : '1px solid rgba(255, 159, 28, 0.3)'
                        }}
                      >
                        {ring.label}
                      </div>
                    </motion.div>

                    {/* Data points on ring */}
                    {Array.from({ length: 4 + index }).map((_, i) => {
                      const angle = (i / (4 + index)) * 360;
                      const x = Math.cos((angle * Math.PI) / 180) * (size / 2);
                      const y = Math.sin((angle * Math.PI) / 180) * (size / 2);

                      return (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            left: `calc(50% + ${x}px - 4px)`,
                            top: `calc(50% + ${y}px - 4px)`,
                            backgroundColor: ring.color,
                            opacity: isActive ? 1 : 0.5
                          }}
                          animate={{ scale: isActive ? [1, 1.5, 1] : 1 }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      );
                    })}
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>

          {/* Player Widgets */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: HUB_CONFIG.color }}
                >
                  Top Performers
                </h2>
              </div>
              <button 
                className="text-sm px-3 py-1 rounded-md transition-colors"
                style={{ 
                  color: HUB_CONFIG.color,
                  border: `1px solid ${HUB_CONFIG.muted}`,
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                View All
              </button>
            </div>
            
            {error ? (
              <div 
                className="p-4 rounded-lg text-center"
                style={{ 
                  backgroundColor: 'rgba(255, 70, 85, 0.1)',
                  color: colors.status.error,
                }}
              >
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {players.map((player, index) => (
                  <PlayerWidget 
                    key={player.id}
                    player={player}
                    rank={index + 1}
                    hubColor={HUB_CONFIG.color}
                    hubGlow={HUB_CONFIG.glow}
                    hubMuted={HUB_CONFIG.muted}
                  />
                ))}
              </div>
            )}
          </GlassCard>

          {/* Search Section */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h2 
                className="text-lg font-semibold"
                style={{ color: HUB_CONFIG.color }}
              >
                Search RAWS Database
              </h2>
            </div>
            
            <form onSubmit={handleSearch} className="relative">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.text.muted }}
              />
              <input
                type="text"
                placeholder="Search players, teams, or matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border transition-colors focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: colors.border.subtle,
                  color: colors.text.primary,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = HUB_CONFIG.color;
                  e.target.style.boxShadow = `0 0 0 2px ${HUB_CONFIG.glow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border.subtle;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: HUB_CONFIG.color,
                  color: colors.background.primary,
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = HUB_CONFIG.muted;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = HUB_CONFIG.color;
                }}
              >
                Query
              </button>
            </form>
          </GlassCard>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Integrity Check */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" style={{ color: colors.status.success }} />
              <h2 
                className="text-lg font-semibold"
                style={{ color: HUB_CONFIG.color }}
              >
                Data Integrity
              </h2>
            </div>
            
            <div className="space-y-3">
              {verificationSteps.map((step) => (
                <div 
                  key={step.id}
                  className="flex items-center gap-3 py-2"
                >
                  <step.icon className="w-4 h-4" style={{ color: colors.status.success }} />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div 
              className="mt-6 pt-4 border-t flex items-center gap-2"
              style={{ borderColor: colors.border.subtle }}
            >
              <Shield className="w-5 h-5" style={{ color: colors.status.success }} />
              <span className="text-sm font-medium" style={{ color: colors.status.success }}>
                All checks passed
              </span>
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h2 
                className="text-lg font-semibold"
                style={{ color: HUB_CONFIG.color }}
              >
                Recent Ingestion
              </h2>
            </div>
            
            <div className="space-y-3">
              {[
                { source: 'VLR API', records: 1247, time: '2 min ago' },
                { source: 'HLTV Feed', records: 892, time: '5 min ago' },
                { source: 'Riot API', records: 2156, time: '12 min ago' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colors.status.success }}
                    />
                    <span className="text-sm" style={{ color: colors.text.secondary }}>
                      {item.source}
                    </span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: colors.text.muted }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Stats - Merged from legacy */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <h2 
              className="text-lg font-semibold mb-4"
              style={{ color: HUB_CONFIG.color }}
            >
              Data Sources
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Active APIs', value: '12', icon: Database },
                { label: 'Queue Depth', value: '0', icon: Clock },
                { label: 'Avg Latency', value: '12ms', icon: Trophy },
              ].map((stat) => (
                <div 
                  key={stat.label}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2" style={{ color: colors.text.secondary }}>
                    <stat.icon className="w-4 h-4" />
                    <span className="text-sm">{stat.label}</span>
                  </div>
                  <span 
                    className="font-mono font-medium"
                    style={{ color: HUB_CONFIG.color }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* About RAWS */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <h2 
              className="text-lg font-semibold mb-3"
              style={{ color: HUB_CONFIG.color }}
            >
              About RAWS
            </h2>
            <p 
              className="text-sm mb-4"
              style={{ color: colors.text.secondary }}
            >
              Raw Archive Write System stores immutable snapshots of all ingested data with cryptographic verification.
            </p>
            <div 
              className="text-xs font-mono space-y-1"
              style={{ color: colors.text.muted }}
            >
              <div>Format: JSON Lines</div>
              <div>Compression: Zstd</div>
              <div>Hash: SHA-256</div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

import FluidHubLayout from '@/components/layout/FluidHubLayout';
import { useParallax } from '@/utils/fluid.js';

export function SatorHubContent() {
export function SatorHub() {
  return (
    <FluidHubLayout hub="sator">
      {/* Parallax Hero */}
      <div className="relative h-screen flex items-center justify-center mb-12 overflow-hidden">
        <div ref={useParallax().ref} style={useParallax().parallaxStyle} className="absolute inset-0 bg-gradient-to-br from-gold to-amber opacity-20" />
        {/* Content already exists */}
      </div>
      <SatorHubContent />
    </FluidHubLayout>
  );
}
  return (
    <HubErrorBoundary hubName="sator" componentName="SatorHub">
      <PanelErrorBoundary panelId="sator-hub" panelTitle="SATOR Observatory" hub="SATOR">
        <MLInferenceErrorBoundary
          fallback={
            <div className="pt-12">
              <HubErrorFallback
                hub="SATOR"
                title="ML Inference Error"
                message="The SATOR Observatory encountered an ML processing error."
                onRetry={() => window.location.reload()}
                onGoHome={() => window.location.href = '/'}
              />
            </div>
          }
        >
          <SatorHubContent />
        </MLInferenceErrorBoundary>
      </PanelErrorBoundary>
    </HubErrorBoundary>
  );
}

export default SatorHub;
