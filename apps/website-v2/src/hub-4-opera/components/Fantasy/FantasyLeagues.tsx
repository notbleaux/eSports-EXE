/** [Ver001.000] */
/**
 * Fantasy Leagues
 * ===============
 * Browse and join fantasy leagues for Valorant and CS2.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Gamepad2, 
  Target,
  Plus,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton as Button } from '@/components/ui/GlowButton';
import { WikiSearch } from '@/components/Wiki';
import { FantasyLeague } from './types';

export const FantasyLeagues: React.FC = () => {
  const [leagues, setLeagues] = useState<FantasyLeague[]>([]);
  const [filterGame, setFilterGame] = useState<'all' | 'valorant' | 'cs2'>('all');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    setTimeout(() => {
      setLeagues([
        {
          id: 'val-001',
          name: 'VCT Champions Fantasy',
          description: 'Compete with the best Valorant teams worldwide',
          game: 'valorant',
          league_type: 'public',
          max_teams: 50,
          roster_size: 5,
          salary_cap: 100000,
          draft_type: 'snake',
          draft_status: 'pending',
          entry_fee_tokens: 100,
          prize_pool_tokens: 5000,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team_count: 32,
        },
        {
          id: 'cs2-001',
          name: 'CS2 Major Fantasy League',
          description: 'Draft your dream CS2 roster for the Major',
          game: 'cs2',
          league_type: 'public',
          max_teams: 100,
          roster_size: 5,
          salary_cap: 100000,
          draft_type: 'auction',
          draft_status: 'in_progress',
          entry_fee_tokens: 200,
          prize_pool_tokens: 10000,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team_count: 67,
        },
        {
          id: 'val-002',
          name: 'VCT Americas Only',
          description: 'Americas region players only',
          game: 'valorant',
          league_type: 'private',
          max_teams: 20,
          roster_size: 5,
          salary_cap: 100000,
          draft_type: 'snake',
          draft_status: 'pending',
          entry_fee_tokens: 50,
          prize_pool_tokens: 1000,
          created_by: 'user123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          team_count: 12,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredLeagues = leagues.filter(l => {
    if (filterGame !== 'all' && l.game !== filterGame) return false;
    if (filterType !== 'all' && l.league_type !== filterType) return false;
    return true;
  });

  const getGameIcon = (game: string) => {
    if (game === 'valorant') return <Target className="w-5 h-5 text-[#ff4655]" />;
    return <Gamepad2 className="w-5 h-5 text-[#ffb347]" />;
  };

  const getGameLabel = (game: string) => {
    return game === 'valorant' ? 'Valorant' : 'Counter-Strike 2';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#9d4edd]" />
            Fantasy Leagues
          </h2>
          <p className="text-white/60 mt-1">
            Draft your dream team and compete for tokens
          </p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create League
        </Button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <WikiSearch placeholder="Search leagues..." />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value as any)}
              className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Games</option>
              <option value="valorant">Valorant</option>
              <option value="cs2">CS2</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Leagues Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredLeagues.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No leagues found</h3>
          <p className="text-white/60">Try adjusting your filters or create a new league</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league, index) => (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard 
                className="h-full flex flex-col cursor-pointer hover:border-[#9d4edd]/50 transition-colors"
                onClick={() => window.location.href = `/opera/fantasy/leagues/${league.id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getGameIcon(league.game)}
                    <span className="text-sm text-white/60 uppercase tracking-wider">
                      {getGameLabel(league.game)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    league.league_type === 'public' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {league.league_type}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {league.name}
                </h3>
                <p className="text-sm text-white/60 mb-4 line-clamp-2">
                  {league.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-white/40 text-xs">
                      <Users className="w-3 h-3" />
                      Teams
                    </div>
                    <div className="text-white font-medium">
                      {league.team_count}/{league.max_teams}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-white/40 text-xs">
                      <Trophy className="w-3 h-3" />
                      Prize
                    </div>
                    <div className="text-[#ffd700] font-medium">
                      {league.prize_pool_tokens.toLocaleString()} NJZ
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-sm text-white/40">
                    Entry: <span className="text-white">{league.entry_fee_tokens} NJZ</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/opera/fantasy/leagues/${league.id}/join`;
                    }}
                  >
                    Join
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FantasyLeagues;
