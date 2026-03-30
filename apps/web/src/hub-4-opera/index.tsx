/**
 * OPERA Hub - Hub 4: eSports Hub
 * Tournament browser, schedules, patch notes, and circuit standings
 * [Ver003.000] - Refactored: Complete rewrite from Map Nexus to eSports Hub
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Calendar,
  FileText,
  BarChart3,
  MapPin,
  RefreshCw,
  Tv,
  Target,
  Globe,
  Swords,
  GitBranch,
} from 'lucide-react';
import HubWrapper, { HubCard, HubStatCard } from '@/shared/components/HubWrapper';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';
import { colors } from '@/theme/colors';
import { GlassCard } from '@/components/ui/GlassCard';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';
import useOperaData from './hooks/useOperaData';
import TournamentBrowser from './components/TournamentBrowser';
import ScheduleViewer from './components/ScheduleViewer';
import PatchNotesReader from './components/PatchNotesReader';
import CircuitStandings from './components/CircuitStandings';
import { FantasyContainer } from './components/Fantasy';
import TournamentBracket from './components/TournamentBracket';
import { useTournamentData } from './hooks/useTournamentData';
import type { 
  Tournament, 
  TournamentFilters, 
  CircuitRegion,
  HubTab,
  Patch 
} from './types';

// Hub Configuration with EXACT purple colors
const HUB_CONFIG = {
  name: 'OPERA',
  subtitle: 'eSports Hub',
  description: 'Tournament browser, schedules, patch notes, and circuit standings',
  color: colors.hub.opera,           // #ff00ff
  glow: 'rgba(255, 0, 255, 0.4)',    // derived from opera
  muted: '#cc00cc',                  // muted version of opera
};

// Tab configuration
const TABS: { id: HubTab; label: string; icon: typeof Trophy }[] = [
  { id: 'overview', label: 'Overview', icon: Trophy },
  { id: 'bracket', label: 'Bracket', icon: GitBranch },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'standings', label: 'Standings', icon: BarChart3 },
  { id: 'patches', label: 'Patches', icon: FileText },
  { id: 'fantasy', label: 'Fantasy', icon: Swords },
];

// Circuit configurations
const CIRCUIT_COLORS: Record<CircuitRegion, string> = {
  Americas: '#ff4655',
  EMEA: '#00d4ff',
  Pacific: '#ff9f1c',
  China: '#ffd700',
  International: '#9d4edd',
};

function OperaHubContent(): JSX.Element {
  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [filters, setFilters] = useState<TournamentFilters>({});
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitRegion>('Americas');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');

  const addNotification = useNJZStore((state) => state.addNotification);
  const { setState } = useHubState('opera');
  
  const {
    tournaments,
    selectedTournament,
    setSelectedTournament,
    schedules,
    patches,
    selectedPatch,
    setSelectedPatch,
    standings,
    loading,
    error: _error,
    refreshTournaments,
    refreshPatches,
    refreshStandings,
    theme,
  } = useOperaData();

  const { bracket } = useTournamentData(selectedTournament, schedules);

  // Handle tournament selection
  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setState({ selectedTournament: tournament.tournament_id });
    addNotification(`Selected ${tournament.name}`, 'info');
    
    // Switch to bracket tab when selecting a tournament from overview
    if (activeTab === 'overview') {
      setActiveTab('bracket');
    }
  };

  // Handle tab change
  const handleTabChange = (tab: HubTab) => {
    setActiveTab(tab);
    addNotification(`Switched to ${tab} view`, 'info');
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshTournaments();
    refreshPatches();
    refreshStandings(selectedCircuit, selectedSeason);
    addNotification('Data refreshed', 'success');
  };

  // Handle circuit change for standings
  const handleCircuitChange = (circuit: CircuitRegion) => {
    setSelectedCircuit(circuit);
    refreshStandings(circuit, selectedSeason);
  };

  // Handle season change for standings
  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    refreshStandings(selectedCircuit, season);
  };

  // Get tournament counts by circuit
  const getTournamentCounts = () => {
    const counts: Record<string, number> = {};
    tournaments.forEach(t => {
      const circuit = t.circuit || 'Unknown';
      counts[circuit] = (counts[circuit] || 0) + 1;
    });
    return counts;
  };

  const tournamentCounts = getTournamentCounts();

  // Get upcoming matches count
  const getUpcomingMatchesCount = () => {
    return schedules.filter(s => s.status === 'scheduled').length;
  };

  // Get active patch
  const getActivePatch = (): Patch | undefined => {
    return patches.find(p => p.is_active_competitive);
  };

  const activePatch = getActivePatch();

  return (
    <HubWrapper hubId="opera">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard
            label="Active Tournaments"
            value={tournaments.filter(t => t.status === 'ongoing').length.toString()}
            change="Live"
            color="green"
          />
          <HubStatCard
            label="Upcoming Matches"
            value={getUpcomingMatchesCount().toString()}
            change="Next 7 days"
            color="cyan"
          />
          <HubStatCard
            label="Current Patch"
            value={activePatch?.version || '-'}
            change="Active"
            color="gold"
          />
          <HubStatCard
            label="Circuits"
            value="4"
            change="VCT Regions"
            color="amber"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Tournament Browser */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h2 className="font-semibold" style={{ color: HUB_CONFIG.color }}>
                  Tournaments
                </h2>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                disabled={loading.tournaments}
              >
                <RefreshCw 
                  className={`w-4 h-4 ${loading.tournaments ? 'animate-spin' : ''}`} 
                  style={{ color: HUB_CONFIG.color }}
                />
              </button>
            </div>
            
            <TournamentBrowser
              tournaments={tournaments}
              selectedTournament={selectedTournament}
              onSelectTournament={handleSelectTournament}
              filters={filters}
              onFiltersChange={setFilters}
              loading={loading.tournaments}
            />
          </GlassCard>

          {/* Quick Circuit Stats */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
              <span className="text-sm font-medium" style={{ color: HUB_CONFIG.color }}>
                Circuits
              </span>
            </div>
            <div className="space-y-2">
              {(['Americas', 'EMEA', 'Pacific', 'China'] as CircuitRegion[]).map(circuit => (
                <div 
                  key={circuit}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CIRCUIT_COLORS[circuit] }}
                    />
                    <span className="text-sm">{circuit}</span>
                  </div>
                  <span className="text-xs font-mono opacity-60">
                    {tournamentCounts[circuit] || 0} tournaments
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Navigation */}
          <GlassCard className="p-2">
            <div className="flex flex-wrap gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/10' 
                        : 'hover:bg-white/5 opacity-70'
                    }`}
                    style={{
                      color: isActive ? HUB_CONFIG.color : undefined,
                      boxShadow: isActive ? `0 0 20px ${HUB_CONFIG.glow}` : undefined,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Welcome Card */}
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Tv className="w-8 h-8" style={{ color: HUB_CONFIG.color }} />
                    <div>
                      <h2 className="text-xl font-semibold" style={{ color: HUB_CONFIG.color }}>
                        Welcome to OPERA eSports Hub
                      </h2>
                      <p className="text-sm opacity-60">
                        Your central source for VCT tournament data
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
                        <span className="font-medium">Tournaments</span>
                      </div>
                      <p className="text-xs opacity-60">
                        Browse and filter tournaments across all VCT circuits including Americas, EMEA, Pacific, and China.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
                        <span className="font-medium">Schedules</span>
                      </div>
                      <p className="text-xs opacity-60">
                        View match schedules, live scores, and results for ongoing and upcoming events.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
                        <span className="font-medium">Standings</span>
                      </div>
                      <p className="text-xs opacity-60">
                        Track circuit standings, VCT points, and qualification status for Champions and Masters.
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
                        <span className="font-medium">Patch Notes</span>
                      </div>
                      <p className="text-xs opacity-60">
                        Stay updated with the latest game patches, agent changes, and competitive updates.
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Featured Tournament */}
                {selectedTournament && (
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium" style={{ color: HUB_CONFIG.color }}>
                        Selected Tournament
                      </span>
                      <button
                        onClick={() => setActiveTab('schedule')}
                        className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        style={{ color: HUB_CONFIG.color }}
                      >
                        View Schedule →
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: CIRCUIT_COLORS[selectedTournament.circuit || 'International'] + '20' }}
                      >
                        <Trophy 
                          className="w-6 h-6" 
                          style={{ color: CIRCUIT_COLORS[selectedTournament.circuit || 'International'] }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedTournament.name}</h3>
                        <div className="flex items-center gap-2 text-xs opacity-60">
                          <MapPin className="w-3 h-3" />
                          {selectedTournament.circuit}
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          {new Date(selectedTournament.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeTab === 'bracket' && (
              <motion.div
                key="bracket"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {bracket ? (
                  <TournamentBracket bracket={bracket} />
                ) : (
                  <div className="p-8 text-center opacity-60 text-sm">
                    Select a tournament from the sidebar to view its bracket.
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ScheduleViewer
                  schedules={schedules}
                  tournament={selectedTournament}
                  loading={loading.schedules}
                />
              </motion.div>
            )}

            {activeTab === 'standings' && (
              <motion.div
                key="standings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CircuitStandings
                  standings={standings}
                  circuit={selectedCircuit}
                  season={selectedSeason}
                  onCircuitChange={handleCircuitChange}
                  onSeasonChange={handleSeasonChange}
                  loading={loading.standings}
                />
              </motion.div>
            )}

            {activeTab === 'patches' && (
              <motion.div
                key="patches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PatchNotesReader
                  patches={patches}
                  selectedPatch={selectedPatch}
                  onSelectPatch={setSelectedPatch}
                  loading={loading.patches}
                />
              </motion.div>
            )}

            {activeTab === 'fantasy' && (
              <motion.div
                key="fantasy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FantasyContainer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </HubWrapper>
  );
}

function OperaHub(): JSX.Element {
  return (
    <PanelErrorBoundary panelId="opera-hub" panelTitle="OPERA eSports Hub" hub="OPERA">
      <OperaHubContent />
    </PanelErrorBoundary>
  );
}

export default OperaHub;
