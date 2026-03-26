import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';

interface GameNodeIDFrameProps {
  gameId: string;
  children: React.ReactNode;
}

/**
 * GameNodeIDFrame
 * The standard container for all nodes in the TENET hierarchy.
 * Renders the 2×2 Quarter GRID (SATOR, AREPO, OPERA, ROTAS).
 */
export function GameNodeIDFrame({ gameId, children }: GameNodeIDFrameProps) {
  const location = useLocation();
  const currentHub = location.pathname.split('/')[2];

  const quadrants = [
    {
      id: 'sator',
      name: 'SATOR',
      subtitle: 'Advanced Analytics',
      description: 'SimRating v2, player performance, and data deep-dives.',
      icon: (props: any) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: '#ffd700',
      glow: 'rgba(255, 215, 0, 0.4)',
      path: `/${gameId}/analytics`,
    },
    {
      id: 'arepo',
      name: 'AREPO',
      subtitle: 'Community Hub',
      description: 'Forums, followed players, and community-driven insights.',
      icon: (props: any) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: '#0066ff',
      glow: 'rgba(0, 102, 255, 0.4)',
      path: `/${gameId}/community`,
    },
    {
      id: 'opera',
      name: 'OPERA',
      subtitle: 'Pro Scene',
      description: 'Tournament brackets, live match feeds, and pro rosters.',
      icon: (props: any) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: '#9d4edd',
      glow: 'rgba(157, 78, 221, 0.4)',
      path: `/${gameId}/pro-scene`,
    },
    {
      id: 'rotas',
      name: 'ROTAS',
      subtitle: 'Stats Reference',
      description: 'Leaderboards, raw statistics, and match history truth.',
      icon: (props: any) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2" />
        </svg>
      ),
      color: '#00d4ff',
      glow: 'rgba(0, 212, 255, 0.4)',
      path: `/${gameId}/stats`,
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Bar / Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl z-[300] flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link to="/hubs" className="text-sm font-mono font-bold text-white/40 hover:text-white transition-colors">
            ← NETWORK
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <h2 className="text-lg font-bold uppercase tracking-widest">{gameId}</h2>
        </div>

        <div className="flex items-center gap-8">
          {quadrants.map(q => {
            const isActive = location.pathname.startsWith(q.path);
            return (
              <Link 
                key={q.id} 
                to={q.path}
                className={`text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${isActive ? 'text-white border-b border-white pb-1' : 'text-white/40 hover:text-white'}`}
              >
                {q.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-8">
        {children}
      </main>

      {/* Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 border-t border-white/5 bg-black/80 flex items-center justify-between px-8 text-[10px] font-mono font-bold text-white/20">
        <div className="flex items-center gap-4">
          <span>{gameId.toUpperCase()} NODE: VERIFIED</span>
          <span className="w-1.5 h-1.5 rounded-full bg-kunst-green animate-pulse" />
        </div>
        <div>TENET TOPOLOGY v2.1</div>
      </footer>
    </div>
  );
}
