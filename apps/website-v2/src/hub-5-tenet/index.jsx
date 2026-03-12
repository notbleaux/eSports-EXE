/**
 * TENET Hub - Hub 5: The Control Center
 * White-themed center hub with SATOR Square 3D visualization
 * [Ver001.000]
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Command,
  Activity,
  Shield,
  Cpu,
  Globe,
  Layers,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import HubWrapper from '@/shared/components/HubWrapper';
import { useNJZStore } from '@/shared/store/njzStore';
import SatorSquare from './components/SatorSquare';
import ControlPanel from './components/ControlPanel';
import useTENETData from './hooks/useTENETData';

// TENET Hub Configuration - EXACT colors as specified
const HUB_CONFIG = {
  name: 'TENET',
  subtitle: 'The Control Center',
  description: 'Central coordination hub with SATOR Square visualization',
  color: '#ffffff',                  // EXACT: Primary white
  glow: 'rgba(255, 255, 255, 0.3)', // EXACT: Glow
  muted: '#c0c0d0',                 // EXACT: Muted
};

// Stats configuration
const QUICK_STATS = [
  { label: 'System Load', value: '42%', icon: Activity, change: '+2%' },
  { label: 'Active Hubs', value: '5/5', icon: Layers, change: 'Online' },
  { label: 'Uptime', value: '99.99%', icon: Globe, change: 'Stable' },
  { label: 'Response', value: '12ms', icon: Zap, change: '-3ms' },
];

function TENETHub() {
  const { addNotification } = useNJZStore();
  const {
    systemStatus,
    logs,
    isLoading,
    error,
    lastUpdate,
    refresh,
    executeCommand,
  } = useTENETData();
  
  const [rotation, setRotation] = useState(0);

  // Background rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    await refresh();
    addNotification('TENET Control Center refreshed', 'info');
  };

  // Handle command execution
  const handleExecuteCommand = async (hubId, command) => {
    const result = await executeCommand(hubId, command);
    if (result.success) {
      addNotification(`${command} completed successfully`, 'success');
    } else {
      addNotification(`${command} failed: ${result.error}`, 'error');
    }
  };

  // Animation variants
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
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <HubWrapper hubId="tenet">
      {/* Hero Section with SATOR Square */}
      <motion.section
        className="max-w-7xl mx-auto mb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Brand Badge */}
        <motion.div 
          className="flex justify-center mb-6"
          variants={itemVariants}
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              backgroundColor: `${HUB_CONFIG.color}15`,
              borderColor: `${HUB_CONFIG.color}40`,
              boxShadow: `0 0 30px ${HUB_CONFIG.glow}`,
            }}
          >
            <Command className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
            <span 
              className="text-sm font-mono font-medium"
              style={{ color: HUB_CONFIG.color }}
            >
              4NJZ4 TENET PLATFORM
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4"
          variants={itemVariants}
          style={{ 
            color: HUB_CONFIG.color,
            textShadow: `0 0 60px ${HUB_CONFIG.glow}`,
          }}
        >
          The Control Center
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-center max-w-2xl mx-auto mb-8"
          variants={itemVariants}
          style={{ color: colors.text.secondary }}
        >
          {HUB_CONFIG.description}
        </motion.p>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
          variants={itemVariants}
        >
          {QUICK_STATS.map((stat, index) => {
            const Icon = stat.icon;
            const isPositive = stat.change && (stat.change.startsWith('+') || stat.change === 'Online' || stat.change === 'Stable');
            
            return (
              <GlassCard 
                key={stat.label}
                hoverGlow={HUB_CONFIG.glow}
                className="p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5" style={{ color: HUB_CONFIG.muted }} />
                </div>
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: HUB_CONFIG.color }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: colors.text.muted }}>
                  {stat.label}
                </div>
                {stat.change && (
                  <div className={`text-xs mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - SATOR Square Visualization */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard
            hoverGlow={HUB_CONFIG.glow}
            className="p-6 h-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h2 className="font-semibold text-white">SATOR Square</h2>
              </div>
              <span className="text-xs font-mono" style={{ color: HUB_CONFIG.muted }}>
                5-Layer Palindrome
              </span>
            </div>

            {/* 3D Visualization */}
            <div className="relative aspect-square max-w-[500px] mx-auto">
              {/* Background glow */}
              <div 
                className="absolute inset-0 rounded-full blur-3xl opacity-20"
                style={{
                  background: `radial-gradient(circle, ${HUB_CONFIG.color} 0%, transparent 70%)`,
                }}
              />
              
              {/* SATOR Square 3D Component */}
              <SatorSquare className="relative z-10" />
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-5 gap-2">
              {[
                { name: 'SATOR', color: '#ffd700' },
                { name: 'AREPO', color: '#0066ff' },
                { name: 'TENET', color: '#ffffff' },
                { name: 'OPERA', color: '#9d4edd' },
                { name: 'ROTAS', color: '#00d4ff' },
              ].map((layer) => (
                <div key={layer.name} className="text-center">
                  <div 
                    className="w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span 
                    className="text-xs font-mono"
                    style={{ color: layer.color }}
                  >
                    {layer.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="mt-6 p-4 rounded-lg bg-white/5">
              <p className="text-sm text-gray-300 leading-relaxed">
                The SATOR Square is a five-layer palindromic structure that reads the same 
                forwards, backwards, and from any direction. Each ring represents one of the 
                five hubs in the 4NJZ4 TENET Platform.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right Column - Control Panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ControlPanel
            systemStatus={systemStatus}
            logs={logs}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            onExecuteCommand={handleExecuteCommand}
            lastUpdate={lastUpdate}
          />
        </motion.div>
      </section>

      {/* Bottom Section - Platform Info */}
      <motion.section
        className="max-w-7xl mx-auto mt-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h3 className="font-semibold text-white">Security</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              End-to-end encryption and twin-file integrity verification ensure data security.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">All systems secure</span>
            </div>
          </GlassCard>

          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h3 className="font-semibold text-white">Performance</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Optimized for real-time analytics with sub-15ms response times across all hubs.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Operating optimally</span>
            </div>
          </GlassCard>

          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h3 className="font-semibold text-white">Connectivity</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              WebSocket connections active to all data sources with automatic reconnection.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Connected</span>
            </div>
          </GlassCard>
        </div>
      </motion.section>

      {/* Footer Quote */}
      <motion.div
        className="max-w-7xl mx-auto mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <blockquote 
          className="text-lg italic"
          style={{ color: HUB_CONFIG.muted }}
        >
          "SATOR AREPO TENET OPERA ROTAS"
        </blockquote>
        <p className="text-sm mt-2" style={{ color: colors.text.muted }}>
          The farmer Arepo carefully works the wheels
        </p>
      </motion.div>
    </HubWrapper>
  );
}

export default TENETHub;
