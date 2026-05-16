/**
 * QuarterGrid
 * Renders the canonical 2×2 SATOR / AREPO / OPERA / ROTAS grid for a GameNodeID.
 * Each quadrant links to the corresponding hub route.
 * [Ver001.001] - Removed unused React import
 */

export interface QuarterGridQuadrant {
  id: 'sator' | 'arepo' | 'opera' | 'rotas';
  name: string;
  subtitle: string;
  path: string;
  isActive?: boolean;
}

export interface QuarterGridProps {
  gameId: string;
  activeQuadrant?: 'sator' | 'arepo' | 'opera' | 'rotas';
  onQuadrantClick?: (quadrant: QuarterGridQuadrant) => void;
  className?: string;
}

const DEFAULT_QUADRANTS = (gameId: string): QuarterGridQuadrant[] => [
  {
    id: 'sator',
    name: 'SATOR',
    subtitle: 'Advanced Analytics',
    path: `/${gameId}/analytics`,
    isActive: true,
  },
  {
    id: 'arepo',
    name: 'AREPO',
    subtitle: 'Community',
    path: `/${gameId}/community`,
    isActive: true,
  },
  {
    id: 'opera',
    name: 'OPERA',
    subtitle: 'Pro Scene',
    path: `/${gameId}/pro-scene`,
    isActive: true,
  },
  {
    id: 'rotas',
    name: 'ROTAS',
    subtitle: 'Stats Reference',
    path: `/${gameId}/stats`,
    isActive: true,
  },
];

const QUADRANT_STYLES: Record<string, { color: string; dot: string; glow: string; border: string }> = {
  sator: { color: 'text-[#ffd700]', dot: 'bg-[#ffd700]', glow: 'hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]', border: 'border-[#ffd700]/20 hover:border-[#ffd700]/50' },
  arepo: { color: 'text-[#0066ff]', dot: 'bg-[#0066ff]', glow: 'hover:shadow-[0_0_20px_rgba(0,102,255,0.2)]', border: 'border-[#0066ff]/20 hover:border-[#0066ff]/50' },
  opera: { color: 'text-[#9d4edd]', dot: 'bg-[#9d4edd]', glow: 'hover:shadow-[0_0_20px_rgba(157,78,221,0.2)]', border: 'border-[#9d4edd]/20 hover:border-[#9d4edd]/50' },
  rotas: { color: 'text-[#00d4ff]', dot: 'bg-[#00d4ff]', glow: 'hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]', border: 'border-[#00d4ff]/20 hover:border-[#00d4ff]/50' },
};

export function QuarterGrid({ gameId, activeQuadrant, onQuadrantClick, className = '' }: QuarterGridProps) {
  const quadrants = DEFAULT_QUADRANTS(gameId);

  return (
    <div className={`grid grid-cols-2 gap-px bg-white/5 ${className}`} role="navigation" aria-label="Quarter GRID">
      {quadrants.map((q) => {
        const styles = QUADRANT_STYLES[q.id];
        const isActive = activeQuadrant === q.id;

        return (
          <button
            key={q.id}
            onClick={() => onQuadrantClick?.(q)}
            className={[
              'relative flex flex-col items-start justify-end p-6 min-h-[120px]',
              'border bg-[#0a0a0f] transition-all duration-200',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
              styles.border,
              styles.glow,
              isActive ? 'bg-white/[0.04]' : 'bg-[#0a0a0f]',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active indicator */}
            {isActive && (
              <span className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`} />
            )}

            <span className={`text-lg font-bold uppercase tracking-widest ${styles.color}`}>
              {q.name}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">
              {q.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default QuarterGrid;
