/**
 * ROTAS Station — Stats Reference HUB (Production)
 * Raw Mapping URLs: /rotas, /rotas/:game, /rotas/:game/:feature
 * Data Source: PandaScore API (real-time)
 */

import React, { useState } from 'react';
import { Routes, Route, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  useValorantTournaments, 
  useValorantMatches, 
  useValorantTeams,
  Tournament,
  Match,
  Team
} from '../services/pandascore';

// Games config
const GAMES = {
  valorant: { name: 'Valorant', color: '#FF4655', leagues: ['VCT', 'VCL', 'GC'] },
  cs2: { name: 'CS2', color: '#F7931E', leagues: ['BLAST', 'IEM', 'PGL'] },
  lol: { name: 'League of Legends', color: '#C28F2C', leagues: ['LCS', 'LEC', 'LCK', 'Worlds'] },
  dota2: { name: 'Dota 2', color: '#E03C3C', leagues: ['DPC', 'TI'] },
};

// Station Layout Component
function StationLayout({ children, activeGame }: { children: React.ReactNode; activeGame?: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-teal-500/30 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                </svg>
              </div>
              <div>
                <Link to="/rotas" className="text-lg font-bold text-teal-400 hover:text-teal-300">ROTAS</Link>
                <span className="text-white/40 text-sm ml-2">Stats Reference HUB</span>
              </div>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/60">← TENET</Link>
          </div>
        </div>
      </header>

      {/* Game Selector */}
      <div className="border-b border-white/5 bg-[#0f0f16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            <span className="text-xs text-white/30 mr-2">Games:</span>
            {Object.entries(GAMES).map(([key, game]) => (
              <Link
                key={key}
                to={`/rotas/${key}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  activeGame === key 
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {game.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>ROTAS Station — Powered by PandaScore</span>
            <div className="flex gap-4">
              <Link to="/sator" className="hover:text-white/60">SATOR</Link>
              <Link to="/opera" className="hover:text-white/60">OPERA</Link>
              <Link to="/arepo" className="hover:text-white/60">AREPO</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Loading Skeleton
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

// Real Tournament List Component
function TournamentList() {
  const { tournaments, loading, error } = useValorantTournaments();

  if (loading) return <LoadingGrid />;
  if (error) return <div className="text-red-400">Error loading tournaments</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tournaments.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 hover:border-teal-500/40 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs text-teal-400/60">{t.serie?.name || 'Unknown Series'}</span>
            <span className={`px-2 py-1 text-xs rounded ${
              t.tier === 's' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              Tier {t.tier?.toUpperCase() || 'B'}
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t.name}</h3>
          <div className="text-sm text-white/50 space-y-1">
            <p>Prize: {t.prizepool || 'TBD'}</p>
            <p>{new Date(t.begin_at).toLocaleDateString()} - {new Date(t.end_at).toLocaleDateString()}</p>
            <p className="text-xs text-white/30">League: {t.league?.name || 'Unknown'}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Real Match List Component
function MatchList() {
  const { matches, loading, error } = useValorantMatches('running');

  if (loading) return <LoadingGrid />;
  if (error) return <div className="text-red-400">Error loading matches</div>;

  return (
    <div className="space-y-3">
      {matches.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{m.opponents?.[0]?.opponent?.name || 'TBD'}</span>
              <span className="text-white/30">vs</span>
              <span className="text-sm font-medium">{m.opponents?.[1]?.opponent?.name || 'TBD'}</span>
            </div>
            <span className={`text-sm ${
              m.status === 'finished' ? 'text-green-400' : 
              m.status === 'running' ? 'text-yellow-400 animate-pulse' : 'text-blue-400'
            }`}>
              {m.status === 'finished' ? 
                `${m.results?.[0]?.score || 0} - ${m.results?.[1]?.score || 0}` : 
                new Date(m.begin_at).toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Real Team List Component
function TeamList() {
  const { teams, loading, error } = useValorantTeams();

  if (loading) return <LoadingGrid />;
  if (error) return <div className="text-red-400">Error loading teams</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {teams.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-teal-500/10 flex items-center justify-center text-sm font-bold">
              {t.acronym?.[0] || t.name[0]}
            </div>
            <div>
              <span className="font-medium">{t.name}</span>
              <span className="text-white/40 text-sm ml-2">({t.acronym})</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Player Search Component
function PlayerSearch() {
  const [query, setQuery] = useState('');
  
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players..."
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-teal-500/50"
      />
      <div className="text-white/50 text-sm">
        Player search requires PandaScore API token. 
        <br />
        Set VITE_PANDASCORE_TOKEN in your .env file.
      </div>
    </div>
  );
}

// Gate Views
function TournamentsGate() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tournaments</h2>
        <Link to="/rotas" className="text-sm text-white/40 hover:text-white/60">← Back</Link>
      </div>
      <TournamentList />
    </div>
  );
}

function MatchesGate() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Matches</h2>
        <Link to="/rotas" className="text-sm text-white/40 hover:text-white/60">← Back</Link>
      </div>
      <MatchList />
    </div>
  );
}

function TeamsGate() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Teams</h2>
        <Link to="/rotas" className="text-sm text-white/40 hover:text-white/60">← Back</Link>
      </div>
      <TeamList />
    </div>
  );
}

function PlayersGate() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Players</h2>
        <Link to="/rotas" className="text-sm text-white/40 hover:text-white/60">← Back</Link>
      </div>
      <PlayerSearch />
    </div>
  );
}

// Game View with Gate Navigation
function GameView() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = GAMES[gameId as keyof typeof GAMES];
  
  return (
    <StationLayout activeGame={gameId}>
      <div className="space-y-8">
        {/* Game Header */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-teal-500/10 to-transparent border border-teal-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: game?.color || '#2DD4BF' }} />
            <h2 className="text-xl font-bold">{game?.name || gameId}</h2>
          </div>
          <div className="flex gap-2">
            {game?.leagues.map(l => (
              <span key={l} className="px-2 py-1 text-xs bg-white/5 rounded">{l}</span>
            ))}
          </div>
        </div>

        {/* Gate Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-4">
          {[
            { id: 'tournaments', label: 'Tournaments' },
            { id: 'matches', label: 'Matches' },
            { id: 'teams', label: 'Teams' },
            { id: 'players', label: 'Players' },
          ].map(gate => (
            <Link
              key={gate.id}
              to={`/rotas/${gameId}/${gate.id}`}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              {gate.label}
            </Link>
          ))}
        </div>

        {/* Routes */}
        <Routes>
          <Route path="tournaments" element={<TournamentsGate />} />
          <Route path="matches" element={<MatchesGate />} />
          <Route path="teams" element={<TeamsGate />} />
          <Route path="players" element={<PlayersGate />} />
          <Route path="*" element={<TournamentsGate />} />
        </Routes>
      </div>
    </StationLayout>
  );
}

// ROTAS Overview
function Overview() {
  const { tournaments } = useValorantTournaments();
  
  return (
    <StationLayout>
      <div className="space-y-8">
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">ROTAS Station</h1>
            <p className="text-white/50 max-w-lg mx-auto">
              Stats Reference HUB — Real-time esports data from PandaScore.
              Select a game to view tournaments, matches, and team data.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tournaments', value: tournaments.length || '—' },
            { label: 'Matches', value: 'Live' },
            { label: 'Teams', value: '—' },
            { label: 'Players', value: '—' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-4 rounded-lg bg-white/5 border border-white/10 text-center"
            >
              <div className="text-2xl font-bold text-teal-400">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/10">
          <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/rotas/valorant/tournaments" className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors">
              Valorant Tournaments →
            </Link>
            <Link to="/rotas/valorant/matches" className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors">
              Live Matches →
            </Link>
            <Link to="/rotas/valorant/teams" className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors">
              Teams →
            </Link>
          </div>
        </div>
      </div>
    </StationLayout>
  );
}

// Main ROTAS Station
function RotasStation() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path=":gameId/*" element={<GameView />} />
    </Routes>
  );
}

export default RotasStation;
