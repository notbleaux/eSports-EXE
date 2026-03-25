/**
 * TournamentBracket Component
 * 8-team single-elimination bracket rendered with CSS flex columns.
 * [Ver001.000]
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { BracketData, BracketMatch, BracketTeam } from '../hooks/useTournamentData';

// ============================================================================
// CONSTANTS
// ============================================================================

const OPERA_PURPLE = '#9d4edd';
const OPERA_GLOW   = 'rgba(157, 78, 221, 0.35)';

const STATUS_DOT: Record<BracketMatch['status'], string> = {
  completed: '#22c55e',
  live:      '#ef4444',
  upcoming:  '#6b7280',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TeamSlotProps {
  team: BracketTeam | null;
  score?: number;
  isWinner: boolean;
  isBye: boolean;
}

function TeamSlot({ team, score, isWinner, isBye }: TeamSlotProps): JSX.Element {
  if (isBye || !team) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded bg-white/[0.03] opacity-30">
        <span className="text-xs font-mono text-gray-500">TBD</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 rounded transition-colors"
      style={{
        backgroundColor: isWinner ? 'rgba(157,78,221,0.15)' : 'rgba(255,255,255,0.04)',
        borderLeft: isWinner ? `2px solid ${OPERA_PURPLE}` : '2px solid transparent',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {team.seed !== undefined && (
          <span className="text-[10px] font-mono text-gray-500 w-4 shrink-0">
            {team.seed}
          </span>
        )}
        <span
          className="text-xs font-semibold truncate"
          style={{ color: isWinner ? OPERA_PURPLE : '#e5e7eb' }}
        >
          {team.tag}
        </span>
      </div>
      {score !== undefined && (
        <span
          className="text-xs font-mono font-bold shrink-0"
          style={{ color: isWinner ? '#ffd700' : '#9ca3af' }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

interface MatchCardProps {
  match: BracketMatch;
}

function MatchCard({ match }: MatchCardProps): JSX.Element {
  const winnerA = match.winnerId !== undefined && match.teamA && match.winnerId === match.teamA.id;
  const winnerB = match.winnerId !== undefined && match.teamB && match.winnerId === match.teamB.id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Live indicator */}
      {match.status === 'live' && (
        <div className="absolute -top-1 -right-1 z-10">
          <span
            className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            <Zap className="w-2 h-2" />
            LIVE
          </span>
        </div>
      )}

      <div
        className="w-36 rounded-lg overflow-hidden"
        style={{
          border: `1px solid ${match.status === 'live' ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: match.status === 'live' ? `0 0 12px rgba(239,68,68,0.3)` : undefined,
        }}
      >
        <div
          className="flex items-center gap-1.5 px-2 py-1 border-b border-white/5"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: STATUS_DOT[match.status] }}
          />
          <span className="text-[9px] uppercase tracking-wider text-gray-500 truncate">
            {match.status === 'live' ? 'In Progress' : match.status}
          </span>
        </div>

        <div className="space-y-0.5 p-1">
          <TeamSlot
            team={match.teamA}
            score={match.scoreA}
            isWinner={!!winnerA}
            isBye={!match.teamA}
          />
          <div className="h-px bg-white/5 mx-2" />
          <TeamSlot
            team={match.teamB}
            score={match.scoreB}
            isWinner={!!winnerB}
            isBye={!match.teamB}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BRACKET COLUMN
// ============================================================================

interface BracketColumnProps {
  label: string;
  matches: BracketMatch[];
  isFinal?: boolean;
}

function BracketColumn({ label, matches, isFinal = false }: BracketColumnProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      {/* Round label */}
      <div
        className="text-xs font-semibold uppercase tracking-widest text-center pb-2 border-b w-full"
        style={{ color: OPERA_PURPLE, borderColor: 'rgba(157,78,221,0.2)' }}
      >
        {label}
      </div>

      {/* Match cards with vertical centering */}
      <div
        className={`flex flex-col items-center ${isFinal ? 'justify-center flex-1' : 'gap-4'}`}
        style={isFinal ? { gap: '0' } : undefined}
      >
        {matches.map(m => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CHAMPION DISPLAY
// ============================================================================

interface ChampionCardProps {
  team: BracketTeam | null;
}

function ChampionCard({ team }: ChampionCardProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className="text-xs font-semibold uppercase tracking-widest text-center pb-2 border-b w-full"
        style={{ color: OPERA_PURPLE, borderColor: 'rgba(157,78,221,0.2)' }}
      >
        Champion
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2 p-4 rounded-xl"
        style={{
          border: `1px solid ${OPERA_PURPLE}`,
          boxShadow: `0 0 20px ${OPERA_GLOW}`,
          backgroundColor: 'rgba(157,78,221,0.1)',
          minWidth: '80px',
        }}
      >
        <Trophy className="w-8 h-8" style={{ color: '#ffd700' }} />
        <span
          className="text-sm font-bold"
          style={{ color: team ? '#ffd700' : '#4b5563' }}
        >
          {team ? team.tag : 'TBD'}
        </span>
        {team && (
          <span className="text-[10px] text-gray-400 text-center">{team.name}</span>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================================
// CONNECTOR LINES (CSS only, decorative)
// ============================================================================

function Connector(): JSX.Element {
  return (
    <div className="flex items-center justify-center w-6 shrink-0 self-stretch">
      <div
        className="w-full h-px"
        style={{ backgroundColor: 'rgba(157,78,221,0.25)' }}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TournamentBracketProps {
  bracket: BracketData;
}

export default function TournamentBracket({ bracket }: TournamentBracketProps): JSX.Element {
  const byRound = (round: number) =>
    bracket.matches
      .filter(m => m.round === round)
      .sort((a, b) => a.position - b.position);

  const qfMatches = byRound(0);
  const sfMatches = byRound(1);
  const fMatches  = byRound(2);

  // Determine champion from final
  const finalMatch = fMatches[0];
  const champion: BracketTeam | null =
    finalMatch?.winnerId
      ? ([finalMatch.teamA, finalMatch.teamB].find(t => t?.id === finalMatch.winnerId) ?? null)
      : bracket.champion;

  return (
    <GlassCard className="p-6 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5" style={{ color: OPERA_PURPLE }} />
        <h3 className="font-semibold" style={{ color: OPERA_PURPLE }}>
          {bracket.tournamentName} — Bracket
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 ml-auto">
          Single Elimination
        </span>
      </div>

      {/* Bracket grid */}
      <div className="flex items-stretch gap-0 min-w-max">
        {/* Quarterfinals */}
        {bracket.rounds[0] && qfMatches.length > 0 && (
          <>
            <BracketColumn label={bracket.rounds[0]} matches={qfMatches} />
            <Connector />
          </>
        )}

        {/* Semifinals */}
        {bracket.rounds[1] && sfMatches.length > 0 && (
          <>
            <BracketColumn label={bracket.rounds[1]} matches={sfMatches} />
            <Connector />
          </>
        )}

        {/* Final */}
        {bracket.rounds[2] && fMatches.length > 0 && (
          <>
            <BracketColumn label={bracket.rounds[2]} matches={fMatches} isFinal />
            <Connector />
          </>
        )}

        {/* Champion */}
        <ChampionCard team={champion} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
        {(['completed', 'live', 'upcoming'] as const).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_DOT[s] }}
            />
            <span className="text-[10px] text-gray-500 capitalize">{s}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
