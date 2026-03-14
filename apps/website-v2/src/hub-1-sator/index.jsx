/**
 * SATOR Hub - Hub 1: The Observatory
 * Raw data ingestion with orbital ring navigation
 * 
 * [Ver001.000]
 */
import { motion } from 'framer-motion';
import { Database, Shield, Clock, Users, Trophy, Search, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { StatsGrid } from './components/StatsGrid';
import { PlayerWidget } from './components/PlayerWidget';
import { useSatorData } from './hooks/useSatorData';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';
import { MLInferenceErrorBoundary, HubErrorFallback } from '@/components/error';

const HUB_CONFIG = {
  name: 'SATOR',
  subtitle: 'The Observatory',
  description: 'Raw data ingestion with orbital ring navigation',
  color: colors.hub.sator.base,      // #ffd700
  glow: colors.hub.sator.glow,       // rgba(255, 215, 0, 0.4)
  muted: colors.hub.sator.muted,     // #bfa030
};

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
            
            <div className="relative">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: colors.text.muted }}
              />
              <input
                type="text"
                placeholder="Search players, teams, or matches..."
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
            </div>
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
              {[
                { label: 'SHA-256 Checksum', status: 'verified' },
                { label: 'Cross-reference', status: 'verified' },
                { label: 'Timestamp Sync', status: 'verified' },
              ].map((item) => (
                <div 
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: colors.border.subtle }}
                >
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    {item.label}
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{ 
                      backgroundColor: 'rgba(0, 255, 136, 0.1)',
                      color: colors.status.success,
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
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

export function SatorHub() {
  return (
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
  );
}

export default SatorHub;
