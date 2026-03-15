/** [Ver001.000] */
/**
 * Fantasy Container
 * =================
 * Main container for Fantasy eSports within OPERA hub.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Swords, 
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton as Button } from '@/components/ui/GlowButton';
import { FantasyLeagues } from './FantasyLeagues';
import { FantasyDraft } from './FantasyDraft';
import { FantasyTeamManage } from './FantasyTeamManage';

type FantasyView = 'overview' | 'leagues' | 'my-teams' | 'draft' | 'team';

export const FantasyContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<FantasyView>('overview');
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'leagues':
        return <FantasyLeagues />;
      case 'my-teams':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">My Fantasy Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard 
                className="p-6 cursor-pointer hover:border-[#9d4edd]/50 transition-colors"
                onClick={() => {
                  setSelectedTeamId('team-001');
                  setCurrentView('team');
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#6600ff] flex items-center justify-center text-2xl font-bold text-white">
                    S
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Super Senstrels</h3>
                    <p className="text-white/60">VCT Champions Fantasy</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-[#9d4edd]">Rank #3</span>
                      <span className="text-white/40">6-2-0</span>
                      <span className="text-green-400">W2</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
                </div>
              </GlassCard>
            </div>
          </div>
        );
      case 'draft':
        return selectedLeagueId ? (
          <FantasyDraft leagueId={selectedLeagueId} teamId="team-001" />
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">Select a league to enter the draft</p>
            <Button 
              variant="primary" 
              className="mt-4"
              onClick={() => setCurrentView('leagues')}
            >
              Browse Leagues
            </Button>
          </div>
        );
      case 'team':
        return selectedTeamId ? (
          <FantasyTeamManage teamId={selectedTeamId} />
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">No team selected</p>
          </div>
        );
      case 'overview':
      default:
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Fantasy <span className="text-[#9d4edd]">eSports</span>
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mx-auto">
                  Draft your dream team of pro players. Compete in leagues. 
                  Win tokens based on real match performances.
                </p>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard 
                className="p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setCurrentView('leagues')}
              >
                <Trophy className="w-10 h-10 text-[#9d4edd] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Browse Leagues</h3>
                <p className="text-sm text-white/60">
                  Join public leagues or create private ones for friends
                </p>
              </GlassCard>

              <GlassCard 
                className="p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setCurrentView('my-teams')}
              >
                <Users className="w-10 h-10 text-[#9d4edd] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">My Teams</h3>
                <p className="text-sm text-white/60">
                  Manage your rosters and lineups
                </p>
              </GlassCard>

              <GlassCard 
                className="p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  setSelectedLeagueId('val-001');
                  setCurrentView('draft');
                }}
              >
                <Swords className="w-10 h-10 text-[#9d4edd] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Enter Draft</h3>
                <p className="text-sm text-white/60">
                  Draft players for upcoming leagues
                </p>
              </GlassCard>
            </div>

            {/* How It Works */}
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How Fantasy Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: '1', title: 'Join or Create', desc: 'Enter a league for Valorant or CS2' },
                  { step: '2', title: 'Draft Players', desc: 'Build your roster through snake or auction draft' },
                  { step: '3', title: 'Set Lineup', desc: 'Choose starters, captain, and vice-captain' },
                  { step: '4', title: 'Win Tokens', desc: 'Earn points based on real match performances' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-[#9d4edd]/20 text-[#9d4edd] font-bold text-xl flex items-center justify-center mx-auto mb-3">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-white/60">{item.desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Scoring Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#9d4edd]" />
                  Valorant Scoring
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between text-white">
                    <span>Kill</span>
                    <span className="text-[#9d4edd]">+1.0</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>Death</span>
                    <span className="text-red-400">-0.5</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>Assist</span>
                    <span className="text-[#9d4edd]">+0.5</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>Ace</span>
                    <span className="text-[#ffd700]">+5.0</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>First Blood</span>
                    <span className="text-[#9d4edd]">+2.0</span>
                  </li>
                </ul>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#9d4edd]" />
                  CS2 Scoring
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between text-white">
                    <span>Kill</span>
                    <span className="text-[#9d4edd]">+1.0</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>Death</span>
                    <span className="text-red-400">-0.5</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>Headshot</span>
                    <span className="text-[#9d4edd]">+0.5</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>AWP Kill</span>
                    <span className="text-[#9d4edd]">+1.5</span>
                  </li>
                  <li className="flex justify-between text-white">
                    <span>Clutch Win</span>
                    <span className="text-[#ffd700]">+3.0</span>
                  </li>
                </ul>
              </GlassCard>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation Breadcrumb */}
        {currentView !== 'overview' && (
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentView('overview')}
            >
              ← Back to Fantasy
            </Button>
          </div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FantasyContainer;
