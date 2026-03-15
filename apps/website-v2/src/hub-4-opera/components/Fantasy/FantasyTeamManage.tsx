/** [Ver001.000] */
/**
 * Fantasy Team Management
 * =======================
 * Manage lineup, view stats, make roster changes.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  ArrowUpDown,
  Star,
  UserX,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { FantasyTeam, FantasyMatchup, LeaderboardEntry } from './types';

interface FantasyTeamManageProps {
  teamId: string;
}

export const FantasyTeamManage: React.FC<FantasyTeamManageProps> = ({ teamId }) => {
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [matchups, setMatchups] = useState<FantasyMatchup[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'matchups' | 'leaderboard'>('roster');

  useEffect(() => {
    // Mock data
    setTeam({
      id: teamId,
      league_id: 'val-001',
      owner_id: 'user123',
      team_name: 'Super Senstrels',
      team_logo_url: null,
      total_points: 1250,
      weekly_points: 85,
      rank_position: 3,
      wins: 6,
      losses: 2,
      draws: 0,
      streak: 'W2',
      budget_remaining: 25000,
      is_active: true,
      roster: [
        { id: 1, team_id, player_id: 'tenz', player_name: 'TenZ', team_tag: 'SEN', player_role: 'Duelist', acquisition_type: 'draft', draft_round: 1, draft_pick: 3, is_captain: true, is_vice_captain: false, is_starter: true, is_bench: false, week_acquired: 1 },
        { id: 2, team_id, player_id: 'aspas', player_name: 'aspas', team_tag: 'LEV', player_role: 'Duelist', acquisition_type: 'draft', draft_round: 2, draft_pick: 18, is_captain: false, is_vice_captain: true, is_starter: true, is_bench: false, week_acquired: 1 },
        { id: 3, team_id, player_id: 'suygetsu', player_name: 'Suycgetsu', team_tag: 'FNC', player_role: 'Controller', acquisition_type: 'draft', draft_round: 3, draft_pick: 23, is_captain: false, is_vice_captain: false, is_starter: true, is_bench: false, week_acquired: 1 },
        { id: 4, team_id, player_id: 'sacy', player_name: 'Sacy', team_tag: 'SEN', player_role: 'Initiator', acquisition_type: 'draft', draft_round: 4, draft_pick: 38, is_captain: false, is_vice_captain: false, is_starter: true, is_bench: false, week_acquired: 1 },
        { id: 5, team_id, player_id: 'less', player_name: 'Less', team_tag: 'LOUD', player_role: 'Sentinel', acquisition_type: 'waiver', is_captain: false, is_vice_captain: false, is_starter: true, is_bench: false, week_acquired: 3 },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setMatchups([
      { id: 1, week_number: 1, opponent_name: 'Cloud9 Fanboys', opponent_points: 65, my_points: 78, result: 'win' },
      { id: 2, week_number: 2, opponent_name: 'Fnatic Faithful', opponent_points: 82, my_points: 71, result: 'loss' },
      { id: 3, week_number: 3, opponent_name: 'PRX Power', opponent_points: 58, my_points: 89, result: 'win' },
      { id: 4, week_number: 4, opponent_name: 'DRX Dominance', opponent_points: 70, my_points: 85, result: 'win' },
      { id: 5, week_number: 5, opponent_name: 'Team Liquid', opponent_points: 85, my_points: 85, result: 'tie' },
      { id: 6, week_number: 6, opponent_name: '100 Thieves', opponent_points: 72, my_points: 91, result: 'win' },
      { id: 7, week_number: 7, opponent_name: 'NRG Esports', opponent_points: 45, my_points: 95, result: 'win' },
      { id: 8, week_number: 8, opponent_name: 'Evil Geniuses', opponent_points: 88, my_points: 76, result: 'loss' },
      { id: 9, week_number: 9, opponent_name: 'G2 Esports', opponent_points: 62, my_points: 94, result: 'win' },
    ]);

    setLeaderboard([
      { rank: 1, team_id: 't1', team_name: 'Cloud9 Fanboys', owner_name: 'User123', total_points: 1320, wins: 8, losses: 1, streak: 'W5', is_my_team: false },
      { rank: 2, team_id: 't2', team_name: 'Fnatic Faithful', owner_name: 'User456', total_points: 1280, wins: 7, losses: 2, streak: 'W2', is_my_team: false },
      { rank: 3, team_id: teamId, team_name: 'Super Senstrels', owner_name: 'You', total_points: 1250, wins: 6, losses: 2, streak: 'W2', is_my_team: true },
      { rank: 4, team_id: 't4', team_name: 'PRX Power', owner_name: 'User789', total_points: 1180, wins: 5, losses: 4, streak: 'L1', is_my_team: false },
      { rank: 5, team_id: 't5', team_name: 'DRX Dominance', owner_name: 'UserABC', total_points: 1120, wins: 4, losses: 5, streak: 'L2', is_my_team: false },
    ]);
  }, [teamId]);

  if (!team) return null;

  const starters = team.roster.filter(r => r.is_starter);
  const bench = team.roster.filter(r => r.is_bench);

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <GlassCard className="p-6" glowColor="#9d4edd">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#6600ff] flex items-center justify-center text-2xl font-bold text-white">
              {team.team_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{team.team_name}</h1>
              <div className="flex items-center gap-2 text-white/60">
                <Trophy className="w-4 h-4" />
                Rank #{team.rank_position} • {team.wins}-{team.losses}-{team.draws}
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#9d4edd]">{team.total_points}</div>
              <div className="text-xs text-white/40">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{team.weekly_points}</div>
              <div className="text-xs text-white/40">This Week</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${team.streak?.startsWith('W') ? 'text-green-400' : 'text-red-400'}`}>
                {team.streak}
              </div>
              <div className="text-xs text-white/40">Streak</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['roster', 'matchups', 'leaderboard'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Roster Tab */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Starters */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-[#ffd700]" />
              Starting Lineup ({starters.length}/5)
            </h3>
            
            <div className="space-y-2">
              {starters.map((slot, index) => (
                <GlassCard 
                  key={slot.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white/40 font-mono w-8">{index + 1}</div>
                    
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9d4edd]/50 to-[#6600ff]/50 flex items-center justify-center text-white font-bold">
                      {slot.player_name[0]}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{slot.player_name}</span>
                        {slot.is_captain && (
                          <span className="px-2 py-0.5 text-xs bg-[#ffd700]/20 text-[#ffd700] rounded">C</span>
                        )}
                        {slot.is_vice_captain && (
                          <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded">VC</span>
                        )}
                      </div>
                      <div className="text-sm text-white/60">
                        {slot.team_tag} • {slot.player_role}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#9d4edd]">
                        {slot.is_captain ? '2x' : slot.is_vice_captain ? '1.5x' : '1x'}
                      </div>
                      <div className="text-xs text-white/40">Multiplier</div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <ArrowUpDown className="w-4 h-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Bench */}
            {bench.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-white mt-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-white/60" />
                  Bench
                </h3>
                <div className="space-y-2">
                  {bench.map((slot) => (
                    <GlassCard key={slot.id} className="p-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                          {slot.player_name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="text-white">{slot.player_name}</div>
                          <div className="text-xs text-white/40">{slot.team_tag}</div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h3 className="font-semibold text-white mb-4">Roster Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Set Lineup
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Move to Bench
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <UserX className="w-4 h-4 mr-2" />
                  Drop Player
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="font-semibold text-white mb-2">Week 10</h3>
              <p className="text-sm text-white/60 mb-4">
                Deadline: Friday 7:00 PM ET
              </p>
              <Button variant="primary" className="w-full">
                Save Lineup
              </Button>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Matchups Tab */}
      {activeTab === 'matchups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchups.map((matchup) => (
            <GlassCard 
              key={matchup.id}
              className={`p-4 ${matchup.result === 'win' ? 'border-green-500/30' : matchup.result === 'loss' ? 'border-red-500/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Week {matchup.week_number}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  matchup.result === 'win' ? 'bg-green-500/20 text-green-400' :
                  matchup.result === 'loss' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {matchup.result.toUpperCase()}
                </span>
              </div>
              <div className="text-white font-medium mb-3">{matchup.opponent_name}</div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#9d4edd]">{matchup.my_points}</div>
                  <div className="text-xs text-white/40">You</div>
                </div>
                <div className="text-white/40">vs</div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white/60">{matchup.opponent_points}</div>
                  <div className="text-xs text-white/40">Opponent</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <GlassCard className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase">Team</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/60 uppercase">Record</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/60 uppercase">Points</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-white/60 uppercase">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leaderboard.map((entry) => (
                <tr 
                  key={entry.team_id}
                  className={entry.is_my_team ? 'bg-[#9d4edd]/10' : ''}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                      entry.rank === 1 ? 'bg-[#ffd700]/20 text-[#ffd700]' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      entry.rank === 3 ? 'bg-amber-700/20 text-amber-700' :
                      'text-white/60'
                    }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{entry.team_name}</div>
                    <div className="text-sm text-white/40">{entry.owner_name}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {entry.wins}-{entry.losses}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-[#9d4edd]">
                    {entry.total_points}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${entry.streak.startsWith('W') ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.streak}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
};

export default FantasyTeamManage;
