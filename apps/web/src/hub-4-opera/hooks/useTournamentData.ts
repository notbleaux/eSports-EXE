/**
 * useTournamentData Hook
 * Derives tournament bracket data from schedules or generates mock bracket
 * [Ver001.000]
 */
import { useMemo } from 'react';
import type { Tournament, MatchSchedule } from '../types';

// ============================================================================
// BRACKET TYPES
// ============================================================================

export interface BracketTeam {
  id: number;
  name: string;
  tag: string;
  seed?: number;
}

export interface BracketMatch {
  id: string;
  round: number;       // 0=QF, 1=SF, 2=Final
  position: number;    // slot within the round (0-indexed)
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  scoreA?: number;
  scoreB?: number;
  winnerId?: number;
  status: 'upcoming' | 'live' | 'completed';
}

export interface BracketData {
  tournamentName: string;
  rounds: string[];       // ['Quarterfinals', 'Semifinals', 'Grand Final']
  matches: BracketMatch[];
  champion: BracketTeam | null;
}

// ============================================================================
// MOCK BRACKET DATA (8 teams)
// ============================================================================

const MOCK_TEAMS: BracketTeam[] = [
  { id: 1, name: 'Sentinels',      tag: 'SEN', seed: 1 },
  { id: 2, name: 'Cloud9',         tag: 'C9',  seed: 8 },
  { id: 3, name: 'NRG',            tag: 'NRG', seed: 4 },
  { id: 4, name: 'G2 Esports',     tag: 'G2',  seed: 5 },
  { id: 5, name: 'Evil Geniuses',  tag: 'EG',  seed: 3 },
  { id: 6, name: '100 Thieves',    tag: '100T', seed: 6 },
  { id: 7, name: 'LOUD',           tag: 'LLD', seed: 2 },
  { id: 8, name: 'FURIA',          tag: 'FUR', seed: 7 },
];

function makeMockBracket(tournamentName: string): BracketData {
  const qf: BracketMatch[] = [
    { id: 'qf-0', round: 0, position: 0, teamA: MOCK_TEAMS[0], teamB: MOCK_TEAMS[7], scoreA: 2, scoreB: 0, winnerId: 1, status: 'completed' },
    { id: 'qf-1', round: 0, position: 1, teamA: MOCK_TEAMS[3], teamB: MOCK_TEAMS[4], scoreA: 1, scoreB: 2, winnerId: 5, status: 'completed' },
    { id: 'qf-2', round: 0, position: 2, teamA: MOCK_TEAMS[2], teamB: MOCK_TEAMS[5], scoreA: 2, scoreB: 1, winnerId: 3, status: 'completed' },
    { id: 'qf-3', round: 0, position: 3, teamA: MOCK_TEAMS[1], teamB: MOCK_TEAMS[6], scoreA: 0, scoreB: 2, winnerId: 7, status: 'completed' },
  ];

  const sf: BracketMatch[] = [
    { id: 'sf-0', round: 1, position: 0, teamA: MOCK_TEAMS[0], teamB: MOCK_TEAMS[4], scoreA: 2, scoreB: 1, winnerId: 1, status: 'completed' },
    { id: 'sf-1', round: 1, position: 1, teamA: MOCK_TEAMS[2], teamB: MOCK_TEAMS[6], scoreA: 1, scoreB: 0, status: 'live' },
  ];

  const fin: BracketMatch[] = [
    { id: 'f-0', round: 2, position: 0, teamA: MOCK_TEAMS[0], teamB: null, status: 'upcoming' },
  ];

  return {
    tournamentName,
    rounds: ['Quarterfinals', 'Semifinals', 'Grand Final'],
    matches: [...qf, ...sf, ...fin],
    champion: null,
  };
}

// ============================================================================
// HOOK
// ============================================================================

interface UseTournamentDataReturn {
  bracket: BracketData | null;
  loading: boolean;
}

export function useTournamentData(
  tournament: Tournament | null,
  _schedules: MatchSchedule[],
): UseTournamentDataReturn {
  const bracket = useMemo<BracketData | null>(() => {
    if (!tournament) return null;
    // In production this would derive from schedules filtered by stage.
    // For now use mock bracket seeded with the selected tournament's name.
    return makeMockBracket(tournament.name);
  }, [tournament]);

  return { bracket, loading: false };
}
