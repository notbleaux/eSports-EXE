// @ts-nocheck
/**
 * TeamComparisonTool Component
 * Cross-reference: Compare teams across tournaments
 * Combines SATOR (team stats) + OPERA (tournament contexts)
 * 
 * [Ver001.000]
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  GitCompare,
  Target,
  BarChart3,
  Calendar,
  MapPin,
  TrendingUp,
  Award,
  Swords,
  Crown,
  DollarSign,
  ChevronRight,
  Database,
  Plus,
  X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useCrossReferenceEngine } from '../hooks/useArepoData';
import type { TeamComparisonResult } from '@/api/crossReference';

interface TeamComparisonToolProps {
  hubColor?: string;
  hubGlow?: string;
}

const TeamComparisonTool: React.FC<TeamComparisonToolProps> = ({
  hubColor = '#0066ff',
  hubGlow = 'rgba(0, 102, 255, 0.4)'
}) => {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [tournamentInput, setTournamentInput] = useState('');
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);
  const [result, setResult] = useState<TeamComparisonResult | null>(null);
  
  const { 
    compareTeamsAcrossTournaments, 
    isLoading, 
    error 
  } = useCrossReferenceEngine();

  const handleAddTournament = () => {
    if (tournamentInput.trim() && !selectedTournaments.includes(tournamentInput.trim())) {
      setSelectedTournaments([...selectedTournaments, tournamentInput.trim()]);
      setTournamentInput('');
    }
  };

  const handleRemoveTournament = (tournament: string) => {
    setSelectedTournaments(selectedTournaments.filter(t => t !== tournament));
  };

  const handleCompare = useCallback(async () => {
    if (!teamA.trim() || !teamB.trim()) return;
    
    const data = await compareTeamsAcrossTournaments(teamA, teamB, selectedTournaments);
    if (data) {
      setResult(data);
    }
  }, [teamA, teamB, selectedTournaments, compareTeamsAcrossTournaments]);

  const handleClear = () => {
    setTeamA('');
    setTeamB('');
    setTournamentInput('');
    setSelectedTournaments([]);
    setResult(null);
  };

  const getComparisonColor = (valueA: number, valueB: number) => {
    if (valueA > valueB) return { a: 'text-green-400', b: 'text-slate' };
    if (valueA < valueB) return { a: 'text-slate', b: 'text-green-400' };
    return { a: 'text-slate', b: 'text-slate' };
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <GlassCard hoverGlow={hubGlow} className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${hubColor}20` }}
          >
            <GitCompare className="w-5 h-5" style={{ color: hubColor }} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Team Comparison</h3>
            <p className="text-sm text-slate">
              Compare teams across tournaments with head-to-head stats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Team A Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team A
            </label>
            <input
              type="text"
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              placeholder="e.g., Sentinels, Fnatic"
              className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
          </div>

          {/* Team B Input */}
          <div className="space-y-2">
            <label className="text-sm text-slate flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team B
            </label>
            <input
              type="text"
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              placeholder="e.g., Cloud9, G2"
              className="w-full px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
          </div>
        </div>

        {/* Tournament Selection */}
        <div className="space-y-2 mb-4">
          <label className="text-sm text-slate flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Tournaments (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tournamentInput}
              onChange={(e) => setTournamentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTournament()}
              placeholder="Add tournament and press Enter"
              className="flex-1 px-4 py-3 bg-void-mid rounded-lg border border-mist 
                       focus:border-[#0066ff] focus:outline-none focus:ring-1 focus:ring-[#0066ff]
                       text-white placeholder-slate transition-colors"
            />
            <motion.button
              onClick={handleAddTournament}
              disabled={!tournamentInput.trim()}
              className="px-4 py-3 rounded-lg border border-mist
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:border-[#0066ff]/50 hover:text-[#0066ff] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Selected Tournaments */}
          {selectedTournaments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTournaments.map((tournament) => (
                <span 
                  key={tournament}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full
                           bg-[#0066ff]/10 border border-[#0066ff]/30 text-[#0066ff]"
                >
                  {tournament}
                  <button 
                    onClick={() => handleRemoveTournament(tournament)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleCompare}
            disabled={isLoading || !teamA.trim() || !teamB.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: hubColor,
              color: '#ffffff'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                Compare Teams
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={handleClear}
            className="px-6 py-3 rounded-lg font-medium border border-mist
                     text-slate hover:text-white hover:border-[#0066ff]/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear
          </motion.button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header Card */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <TeamDisplay 
                    name={result.team_a.name}
                    region={result.team_a.region}
                    isWinner={result.head_to_head.team_a_wins > result.head_to_head.team_b_wins}
                  />
                  <div className="text-2xl font-bold text-slate">VS</div>
                  <TeamDisplay 
                    name={result.team_b.name}
                    region={result.team_b.region}
                    isWinner={result.head_to_head.team_b_wins > result.head_to_head.team_a_wins}
                  />
                </div>
              </div>

              {/* Data Source Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate mb-4">
                <Database className="w-3 h-3" />
                <span>Data sources: </span>
                <span className="px-2 py-0.5 rounded bg-[#ffd700]/20 text-[#ffd700]">SATOR</span>
                <span className="px-2 py-0.5 rounded bg-[#9d4edd]/20 text-[#9d4edd]">OPERA</span>
              </div>

              {/* Head-to-Head */}
              <div className="p-4 rounded-lg bg-void-mid">
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-5 h-5" style={{ color: hubColor }} />
                  <span className="font-medium">Head-to-Head</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: hubColor }}>
                      {result.head_to_head.team_a_wins}
                    </div>
                    <div className="text-xs text-slate">{result.team_a.name} Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate">
                      {result.head_to_head.draws}
                    </div>
                    <div className="text-xs text-slate">Draws</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: hubColor }}>
                      {result.head_to_head.team_b_wins}
                    </div>
                    <div className="text-xs text-slate">{result.team_b.name} Wins</div>
                  </div>
                </div>
                
                {result.head_to_head.last_match && (
                  <div className="mt-4 pt-4 border-t border-mist/50">
                    <div className="text-sm text-slate mb-1">Last Match</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate" />
                      <span>{result.head_to_head.last_match.date}</span>
                      <span className="text-slate">•</span>
                      <Trophy className="w-4 h-4 text-slate" />
                      <span>{result.head_to_head.last_match.tournament}</span>
                      <span className="text-slate">•</span>
                      <Crown className="w-4 h-4" style={{ color: hubColor }} />
                      <span>{result.head_to_head.last_match.winner} won {result.head_to_head.last_match.score}</span>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Stats Comparison */}
            <GlassCard hoverGlow={hubGlow} className="p-6">
              <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: hubColor }} />
                Stats Comparison
              </h4>
              
              <div className="space-y-4">
                <ComparisonBar 
                  label="Matches Played"
                  valueA={result.stats_comparison.matches_played.team_a}
                  valueB={result.stats_comparison.matches_played.team_b}
                  teamAName={result.team_a.name}
                  teamBName={result.team_b.name}
                  hubColor={hubColor}
                />
                <ComparisonBar 
                  label="Win Rate"
                  valueA={result.stats_comparison.win_rate.team_a * 100}
                  valueB={result.stats_comparison.win_rate.team_b * 100}
                  teamAName={result.team_a.name}
                  teamBName={result.team_b.name}
                  hubColor={hubColor}
                  suffix="%"
                />
                <ComparisonBar 
                  label="Average ACS"
                  valueA={result.stats_comparison.avg_acs.team_a}
                  valueB={result.stats_comparison.avg_acs.team_b}
                  teamAName={result.team_a.name}
                  teamBName={result.team_b.name}
                  hubColor={hubColor}
                />
                <ComparisonBar 
                  label="Average ADR"
                  valueA={result.stats_comparison.avg_adr.team_a}
                  valueB={result.stats_comparison.avg_adr.team_b}
                  teamAName={result.team_a.name}
                  teamBName={result.team_b.name}
                  hubColor={hubColor}
                />
                <ComparisonBar 
                  label="Tournament Wins"
                  valueA={result.stats_comparison.tournament_wins.team_a}
                  valueB={result.stats_comparison.tournament_wins.team_b}
                  teamAName={result.team_a.name}
                  teamBName={result.team_b.name}
                  hubColor={hubColor}
                />
              </div>
            </GlassCard>

            {/* Tournament Contexts */}
            {result.tournament_contexts.length > 0 && (
              <GlassCard hoverGlow={hubGlow} className="p-6">
                <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" style={{ color: hubColor }} />
                  Tournament Performances
                </h4>
                
                <div className="space-y-3">
                  {result.tournament_contexts.map((context) => (
                    <div 
                      key={context.tournament_id}
                      className="p-4 rounded-lg bg-void-mid border border-mist/50"
                    >
                      <div className="font-medium mb-3">{context.tournament_name}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate mb-1">{result.team_a.name}</div>
                          <div className="flex items-center gap-4">
                            {context.team_a_placement && (
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" style={{ color: hubColor }} />
                                #{context.team_a_placement}
                              </span>
                            )}
                            {context.team_a_prize && (
                              <span className="flex items-center gap-1 text-green-400">
                                <DollarSign className="w-4 h-4" />
                                {context.team_a_prize.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate mb-1">{result.team_b.name}</div>
                          <div className="flex items-center gap-4">
                            {context.team_b_placement && (
                              <span className="flex items-center gap-1">
                                <Award className="w-4 h-4" style={{ color: hubColor }} />
                                #{context.team_b_placement}
                              </span>
                            )}
                            {context.team_b_prize && (
                              <span className="flex items-center gap-1 text-green-400">
                                <DollarSign className="w-4 h-4" />
                                {context.team_b_prize.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Components

interface TeamDisplayProps {
  name: string;
  region: string;
  isWinner?: boolean;
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ name, region, isWinner }) => (
  <div className="flex items-center gap-3">
    <div className="text-right">
      <div className="font-display text-xl font-bold flex items-center gap-2 justify-end">
        {name}
        {isWinner && <Crown className="w-5 h-5 text-yellow-400" />}
      </div>
      <div className="text-sm text-slate flex items-center gap-1 justify-end">
        <MapPin className="w-3 h-3" />
        {region}
      </div>
    </div>
    <div className="w-12 h-12 rounded-lg bg-void-mid border border-mist flex items-center justify-center">
      <Users className="w-6 h-6 text-slate" />
    </div>
  </div>
);

interface ComparisonBarProps {
  label: string;
  valueA: number;
  valueB: number;
  teamAName: string;
  teamBName: string;
  hubColor: string;
  suffix?: string;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  valueA,
  valueB,
  teamAName,
  teamBName,
  hubColor,
  suffix = ''
}) => {
  const total = valueA + valueB;
  const percentA = total > 0 ? (valueA / total) * 100 : 50;
  const percentB = total > 0 ? (valueB / total) * 100 : 50;
  const winner = valueA > valueB ? 'A' : valueB > valueA ? 'B' : 'tie';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className={winner === 'A' ? 'text-green-400 font-medium' : 'text-slate'}>
          {teamAName}: {valueA.toFixed(1)}{suffix}
        </span>
        <span className="text-slate font-medium">{label}</span>
        <span className={winner === 'B' ? 'text-green-400 font-medium' : 'text-slate'}>
          {teamBName}: {valueB.toFixed(1)}{suffix}
        </span>
      </div>
      <div className="h-3 bg-void-mid rounded-full overflow-hidden flex">
        <motion.div 
          className="h-full flex items-center justify-end pr-1"
          style={{ backgroundColor: hubColor }}
          initial={{ width: 0 }}
          animate={{ width: `${percentA}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.div 
          className="h-full bg-slate/30"
          initial={{ width: 0 }}
          animate={{ width: `${percentB}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

export default TeamComparisonTool;
