/**
 * RankingsContainer Component
 * Main container with tabs for Organizations, Teams, and Players
 * 
 * [Ver001.000]
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, User, Trophy, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import OrganizationRankings from './OrganizationRankings';
import TeamRankings from './TeamRankings';
import PlayerRankings from './PlayerRankings';
import { useRankingsData } from './hooks/useRankingsData';
import type { RankingsContainerProps, RankingsTab, Organization, TeamRanking, PlayerRanking } from './types';

const OPERA_COLOR = '#9d4edd';
const OPERA_GLOW = 'rgba(157, 78, 221, 0.4)';

// Tab configuration
const TABS: { id: RankingsTab; label: string; icon: typeof Trophy }[] = [
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'players', label: 'Players', icon: User },
];

const RankingsContainer: React.FC<RankingsContainerProps> = ({
  defaultTab = 'teams',
}) => {
  const [activeTab, setActiveTab] = useState<RankingsTab>(defaultTab);
  const {
    orgRankings,
    teamRankings,
    playerRankings,
    loading,
    error,
    fetchOrgRankings,
    fetchTeamRankings,
    fetchPlayerRankings,
    refreshAll,
  } = useRankingsData();

  // Load data on mount and tab change
  useEffect(() => {
    refreshAll();
  }, []);

  // Handle org click
  const handleOrgClick = (org: Organization) => {
    console.log('Organization clicked:', org);
    // Could navigate to org detail page or open modal
  };

  // Handle team click
  const handleTeamClick = (team: TeamRanking) => {
    console.log('Team clicked:', team);
    // Could navigate to team detail page or open modal
  };

  // Handle player click
  const handlePlayerClick = (player: PlayerRanking) => {
    console.log('Player clicked:', player);
    // Could navigate to player detail page or open modal
  };

  // Refresh button animation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4" hoverGlow={OPERA_GLOW}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, ease: 'linear' }}
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${OPERA_COLOR}20` }}
            >
              <Trophy className="w-5 h-5" style={{ color: OPERA_COLOR }} />
            </motion.div>
            <div>
              <h2 className="font-semibold text-white">OPERA Rankings</h2>
              <p className="text-xs opacity-60">Global esports power rankings</p>
            </div>
          </div>

          {/* Last updated info */}
          <div className="flex items-center gap-3">
            <div className="text-xs opacity-50">
              Last updated: {new Date().toLocaleDateString()}
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing || Object.values(loading).some(Boolean)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'hover:bg-white/10 disabled:opacity-50'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Radio className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </GlassCard>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              style={isActive ? { backgroundColor: `${OPERA_COLOR}20` } : undefined}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon 
                className="w-4 h-4" 
                style={{ color: isActive ? OPERA_COLOR : undefined }} 
              />
              <span>{tab.label}</span>
              {/* Count badge */}
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.5 rounded text-xs',
                  isActive ? 'bg-white/20' : 'bg-white/10'
                )}
              >
                {tab.id === 'organizations' && orgRankings.length}
                {tab.id === 'teams' && teamRankings.length}
                {tab.id === 'players' && playerRankings.length}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: OPERA_COLOR }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'organizations' && (
            <OrganizationRankings
              organizations={orgRankings}
              loading={loading.organizations}
              onOrgClick={handleOrgClick}
            />
          )}

          {activeTab === 'teams' && (
            <TeamRankings
              teams={teamRankings}
              loading={loading.teams}
              onTeamClick={handleTeamClick}
            />
          )}

          {activeTab === 'players' && (
            <PlayerRankings
              players={playerRankings}
              loading={loading.players}
              onPlayerClick={handlePlayerClick}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default RankingsContainer;
