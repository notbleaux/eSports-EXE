/**
 * SATOR Hub - Hub 1: The Observatory
 * Raw data ingestion with orbital ring navigation
 * 
 * [Ver004.000] - Added SimRating Web Worker Analytics
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Shield, 
  Clock, 
  Users, 
  Trophy, 
  Search, 
  Activity,
  FileCheck,
  Table,
  Zap,
  Calculator,
  BarChart3
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { StatsGrid } from './components/StatsGrid';
import { PlayerWidget } from './components/PlayerWidget';
import { VirtualDataGrid } from './components/VirtualDataGrid';
import { VirtualPlayerGrid } from './components/VirtualPlayerGrid';
import { PlayerRatingCard } from './components/PlayerRatingCard';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';
import { 
  MLInferenceErrorBoundary, 
  HubErrorBoundary,
  HubErrorFallback 
} from '@/components/error';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';
import { getWorkerPool, isWorkerSupported, isOffscreenCanvasSupported } from '@/lib/worker-utils';
import { useSimRating } from './hooks/useSimRating';

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

// Generate mock player data for the grid
const generateMockPlayerData = (count = 1000) => {
  const agents = ['Jett', 'Reyna', 'Sage', 'Omen', 'Phoenix', 'Raze', 'Viper', 'Cypher'];
  const teams = ['Sentinels', 'Cloud9', 'NRG', 'Evil Geniuses', 'LOUD', 'Fnatic', 'NAVI', 'Furia'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    rank: i + 1,
    name: `Player ${i + 1}`,
    team: teams[Math.floor(Math.random() * teams.length)],
    agent: agents[Math.floor(Math.random() * agents.length)],
    rating: +(Math.random() * 1.5 + 0.5).toFixed(2),
    acs: Math.floor(Math.random() * 300 + 150),
    kda: (Math.random() * 3 + 0.5).toFixed(2),
    winRate: Math.floor(Math.random() * 40 + 40),
    matches: Math.floor(Math.random() * 100 + 50),
    trend: Math.floor(Math.random() * 40) - 20
  }));
};

// Grid columns configuration
const playerGridColumns = [
  { key: 'rank', header: 'Rank', width: 60, type: 'number', align: 'center' },
  { key: 'name', header: 'Player', width: 150, type: 'text', align: 'left' },
  { key: 'team', header: 'Team', width: 140, type: 'text', align: 'left' },
  { key: 'agent', header: 'Agent', width: 100, type: 'text', align: 'center' },
  { key: 'rating', header: 'Rating', width: 80, type: 'rating', align: 'center' },
  { key: 'acs', header: 'ACS', width: 80, type: 'number', align: 'center' },
  { key: 'kda', header: 'KDA', width: 80, type: 'rating', align: 'center' },
  { key: 'winRate', header: 'Win %', width: 80, type: 'trend', align: 'center' },
  { key: 'matches', header: 'Matches', width: 90, type: 'number', align: 'center' },
];

function SatorHubContent() {
  const [stats, setStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const addNotification = useNJZStore(state => state.addNotification);
  const { state, setState } = useHubState('sator');
  const gridRef = useRef(null);
  
  // Orbital ring state (from legacy)
  const [activeRing, setActiveRing] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGridView, setShowGridView] = useState(false);
  const [gridData, setGridData] = useState([]);
  const [workerCapabilities, setWorkerCapabilities] = useState({ 
    supported: false, 
    offscreen: false 
  });

  // Check worker capabilities on mount
  useEffect(() => {
    setWorkerCapabilities({
      supported: isWorkerSupported(),
      offscreen: isOffscreenCanvasSupported()
    });
  }, []);

  // Worker pool initialization - DISABLED for Vercel build compatibility
  useEffect(() => {
    // Workers disabled due to Vite 8 terser bundling bug on Vercel
    // All grid processing runs on main thread
  }, []);

  // Generate mock data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockStats = [
          { value: 2847, label: 'Teams', trend: 'up' },
          { value: 156, label: 'Matches', trend: 'neutral' },
          { value: 12847, label: 'Players', trend: 'up' },
          { value: 48, label: 'Tournaments', trend: 'up' },
          { value: 2400000, label: 'Records', trend: 'up' },
          { value: 99.9, label: 'Uptime %', trend: 'neutral' },
        ];

        const mockPlayers = Array.from({ length: 5 }, (_, i) => ({
          id: `player-${i}`,
          name: ['TenZ', 'aspas', 'yay', 'Derke', 'something'][i],
          team: ['Sentinels', 'LOUD', 'Cloud9', 'Fnatic', 'Paper Rex'][i],
          rating: [1.45, 1.42, 1.38, 1.35, 1.33][i],
          trend: 'up'
        }));

        const mockGridData = generateMockPlayerData(1000);

        setStats(mockStats);
        setPlayers(mockPlayers);
        setGridData(mockGridData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleRowClick = (row, index) => {
    addNotification(`Selected player: ${row.name} (Rank #${row.rank})`, 'info');
  };

  const handleCellClick = (row, column, value) => {
    console.log('Cell clicked:', { row, column, value });
  };

  const scrollToTop = () => {
    gridRef.current?.scrollToTop();
  };

  const scrollToBottom = () => {
    gridRef.current?.scrollToBottom();
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
          {/* Virtual Data Grid - NEW */}
          <GlassCard 
            className="p-6" 
            hoverGlow={HUB_CONFIG.glow}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h2 
                  className="text-lg font-semibold"
                  style={{ color: HUB_CONFIG.color }}
                >
                  Player Rankings
                </h2>
                {workerCapabilities.supported && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ 
                      backgroundColor: 'rgba(0, 255, 136, 0.2)',
                      color: colors.status.success
                    }}
                  >
                    <Zap className="w-3 h-3 inline mr-1" />
                    {workerCapabilities.offscreen ? 'Web Worker + OffscreenCanvas' : 'Web Worker'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={scrollToTop}
                  className="text-xs px-3 py-1.5 rounded-md transition-colors"
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
                  Top
                </button>
                <button
                  onClick={scrollToBottom}
                  className="text-xs px-3 py-1.5 rounded-md transition-colors"
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
                  Bottom
                </button>
              </div>
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
              <VirtualDataGrid
                ref={gridRef}
                data={gridData}
                columns={playerGridColumns}
                height={500}
                rowHeight={40}
                headerHeight={48}
                onRowClick={handleRowClick}
                onCellClick={handleCellClick}
                useWorkerPool={true}
                theme={{
                  headerTextColor: HUB_CONFIG.color,
                  accentColor: HUB_CONFIG.color,
                }}
              />
            )}
            
            <p 
              className="text-xs mt-3 text-center"
              style={{ color: colors.text.muted }}
            >
              Showing {gridData.length.toLocaleString()} players • 
              Scroll performance optimized with {workerCapabilities.offscreen ? 'OffscreenCanvas' : 'Virtual Scrolling'}
            </p>
          </GlassCard>

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

          {/* SimRating Analytics Section - Web Worker Integration */}
          <SimRatingAnalyticsSection 
            hubColor={HUB_CONFIG.color} 
            hubGlow={HUB_CONFIG.glow} 
            hubMuted={HUB_CONFIG.muted} 
          />

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

/**
 * SimRating Analytics Section Component
 * Demonstrates Web Worker-based SimRating calculations
 */
function SimRatingAnalyticsSection({ hubColor, hubGlow, hubMuted }) {
  const addNotification = useNJZStore(state => state.addNotification);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [calculationTimes, setCalculationTimes] = useState([]);
  
  const { 
    calculateBatch, 
    isCalculating, 
    isReady, 
    cacheSize,
    clearCache 
  } = useSimRating();

  // Sample players with realistic stats for demo
  const samplePlayers = [
    {
      id: 'player-tenz',
      name: 'TenZ',
      team: 'Sentinels',
      role: 'duelist',
      region: 'NA',
      stats: {
        kills: 245,
        deaths: 180,
        assists: 45,
        kd_ratio: 1.36,
        adr: 168,
        firstKills: 52,
        first_kills_per_round: 0.18,
        roundsPlayed: 289,
        matchesPlayed: 12,
        buy_efficiency: 0.78,
        save_rate: 0.22,
        clutchesWon: 8,
        clutch_success_rate: 0.35,
        clutchOpportunities: 23,
        utility_usage: 0.65,
        assists_per_round: 0.16,
        entry_success_rate: 0.72,
        entryWins: 42,
        entryAttempts: 58
      }
    },
    {
      id: 'player-aspas',
      name: 'aspas',
      team: 'Leviatán',
      role: 'duelist',
      region: 'BR',
      stats: {
        kills: 312,
        deaths: 195,
        assists: 38,
        kd_ratio: 1.60,
        adr: 182,
        firstKills: 68,
        first_kills_per_round: 0.22,
        roundsPlayed: 310,
        matchesPlayed: 14,
        buy_efficiency: 0.82,
        save_rate: 0.18,
        clutchesWon: 12,
        clutch_success_rate: 0.42,
        clutchOpportunities: 29,
        utility_usage: 0.58,
        assists_per_round: 0.12,
        entry_success_rate: 0.78,
        entryWins: 55,
        entryAttempts: 71
      }
    },
    {
      id: 'player-boaster',
      name: 'Boaster',
      team: 'FNATIC',
      role: 'controller',
      region: 'EU',
      stats: {
        kills: 198,
        deaths: 165,
        assists: 89,
        kd_ratio: 1.20,
        adr: 142,
        firstKills: 28,
        first_kills_per_round: 0.09,
        roundsPlayed: 312,
        matchesPlayed: 13,
        buy_efficiency: 0.88,
        save_rate: 0.28,
        clutchesWon: 6,
        clutch_success_rate: 0.28,
        clutchOpportunities: 22,
        utility_usage: 0.85,
        assists_per_round: 0.28,
        entry_success_rate: 0.45,
        entryWins: 18,
        entryAttempts: 40
      }
    },
    {
      id: 'player-nats',
      name: 'nAts',
      team: 'Team Liquid',
      role: 'sentinel',
      region: 'RU',
      stats: {
        kills: 225,
        deaths: 148,
        assists: 72,
        kd_ratio: 1.52,
        adr: 155,
        firstKills: 32,
        first_kills_per_round: 0.11,
        roundsPlayed: 298,
        matchesPlayed: 12,
        buy_efficiency: 0.85,
        save_rate: 0.25,
        clutchesWon: 15,
        clutch_success_rate: 0.52,
        clutchOpportunities: 29,
        utility_usage: 0.78,
        assists_per_round: 0.24,
        entry_success_rate: 0.48,
        entryWins: 22,
        entryAttempts: 46
      }
    }
  ];

  // Calculate ratings for all sample players
  const handleCalculateAll = async () => {
    if (!isReady) {
      addNotification('Analytics Worker not ready', 'error');
      return;
    }

    const startTime = performance.now();
    
    const players = samplePlayers.map(p => ({
      id: p.id,
      payload: {
        playerId: p.id,
        playerStats: p.stats,
        role: p.role,
        confidence: Math.min(p.stats.matchesPlayed / 20, 1)
      }
    }));

    try {
      await calculateBatch(players);
      const duration = performance.now() - startTime;
      setCalculationTimes(prev => [...prev.slice(-9), duration]);
      addNotification(`Calculated ${players.length} SimRatings in ${duration.toFixed(1)}ms`, 'success');
    } catch (err) {
      addNotification('Batch calculation failed', 'error');
    }
  };

  // Calculate average time
  const avgCalculationTime = calculationTimes.length > 0
    ? calculationTimes.reduce((a, b) => a + b, 0) / calculationTimes.length
    : 0;

  return (
    <motion.div variants={itemVariants}>
      <GlassCard 
        className="p-6" 
        hoverGlow={hubGlow}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5" style={{ color: hubColor }} />
            <h2 
              className="text-lg font-semibold"
              style={{ color: hubColor }}
            >
              SimRating Analytics
            </h2>
            <span 
              className="text-xs px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: isReady ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isReady ? '#10B981' : '#F59E0B'
              }}
            >
              {isReady ? 'Worker Ready' : 'Initializing...'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {calculationTimes.length > 0 && (
              <span 
                className="text-xs font-mono"
                style={{ color: hubMuted }}
              >
                Avg: {avgCalculationTime.toFixed(1)}ms
              </span>
            )}
            <button
              onClick={handleCalculateAll}
              disabled={!isReady || isCalculating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isCalculating ? `${hubColor}40` : hubColor,
                color: isCalculating ? hubMuted : '#000',
              }}
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Calculate All
                </>
              )}
            </button>
            {cacheSize > 0 && (
              <button
                onClick={clearCache}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ 
                  border: `1px solid ${hubMuted}`,
                  color: hubMuted,
                }}
              >
                Clear Cache ({cacheSize})
              </button>
            )}
          </div>
        </div>

        <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
          SimRating calculations run in a Web Worker to keep the UI responsive. 
          The 5-component rating (Combat, Economy, Clutch, Support, Entry) is computed asynchronously with result caching.
        </p>

        {/* Player Rating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {samplePlayers.map((player) => (
            <PlayerRatingCard
              key={player.id}
              player={player}
              compact={false}
              showComponents={true}
              onRatingCalculated={(result) => {
                console.log(`[SATOR] SimRating calculated for ${player.name}:`, result);
              }}
              onError={(error) => {
                console.error(`[SATOR] SimRating error for ${player.name}:`, error);
              }}
            />
          ))}
        </div>

        {/* Worker Status Footer */}
        <div 
          className="mt-6 pt-4 border-t flex items-center justify-between text-xs"
          style={{ borderColor: colors.border.subtle }}
        >
          <div className="flex items-center gap-4" style={{ color: colors.text.muted }}>
            <span>Worker Status: {isReady ? '✅ Connected' : '⏳ Loading'}</span>
            <span>Cache: {cacheSize} entries</span>
            <span>Calculations: {calculationTimes.length} batches</span>
          </div>
          <div style={{ color: colors.text.muted }}>
            Web Worker Thread • Non-blocking UI
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function SatorHub() {
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
