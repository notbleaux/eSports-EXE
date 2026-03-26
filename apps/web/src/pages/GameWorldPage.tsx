// [Ver001.000] Game world tezet — 2x2 hub grid for a specific game.
import { Link, useParams } from 'react-router-dom';
import { usePlayers } from '@/shared/api/hooks';

const HUBS = [
  { id: 'analytics', label: 'SATOR', subtitle: 'Analytics', color: '#6366f1', path: '/analytics' },
  { id: 'stats',     label: 'ROTAS', subtitle: 'Stats',     color: '#06b6d4', path: '/stats'     },
  { id: 'pro-scene', label: 'OPERA', subtitle: 'Pro Scene', color: '#8b5cf6', path: '/pro-scene' },
  { id: 'community', label: 'AREPO', subtitle: 'Community', color: '#10b981', path: '/community' },
];

export default function GameWorldPage() {
  const { game } = useParams<{ game: string }>();
  const { data } = usePlayers(game as 'valorant' | 'cs2');
  const playerCount = (data as { total?: number })?.total ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '2rem', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
        {game}
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        {playerCount} players tracked
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
        maxWidth: '600px', width: '100%' }}>
        {HUBS.map(hub => (
          <Link key={hub.id} to={`${hub.path}?game=${game}`}
            style={{ textDecoration: 'none' }}>
            <div style={{ border: `1px solid ${hub.color}33`, borderRadius: '8px',
              padding: '1.5rem', background: `${hub.color}0d`, textAlign: 'center',
              transition: 'background 0.15s ease' }}>
              <div style={{ color: hub.color, fontSize: '1.25rem', fontWeight: 700 }}>
                {hub.label}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {hub.subtitle}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link to="/hubs" style={{ color: '#6b7280', marginTop: '2rem', fontSize: '0.85rem' }}>
        ← Back to Hub Selector
      </Link>
    </div>
  );
}
