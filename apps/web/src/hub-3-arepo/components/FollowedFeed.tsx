// [Ver001.000] Feed of followed players with unfollow option.
import { Link } from 'react-router-dom';
import { useFollows } from '../hooks/useFollows';

export function FollowedFeed() {
  const { followed, unfollow, count } = useFollows();
  if (count === 0) return (
    <div style={{ color: '#6b7280', padding: '1rem', textAlign: 'center' }}>
      <p>No players followed yet.</p>
      <p style={{ fontSize: '0.8rem' }}>Hit "+ Follow" on any player below.</p>
    </div>
  );
  return (
    <div className="followed-feed">
      <h3 style={{ color: '#e5e7eb', marginBottom: '0.5rem' }}>
        Following ({count})
      </h3>
      {followed.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center',
          gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid #1f2937' }}>
          <Link to={`/player/${p.slug}`} style={{ color: '#6366f1', flex: 1 }}>
            {p.handle}
          </Link>
          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{p.game}</span>
          <button onClick={() => unfollow(p.id)}
            style={{ color: '#ef4444', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '0.75rem' }}>
            Unfollow
          </button>
        </div>
      ))}
    </div>
  );
}
