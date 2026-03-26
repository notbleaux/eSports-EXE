// [Ver001.000] Admin dashboard — user management, content moderation, system health.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';

type AdminTab = 'overview' | 'users' | 'moderation' | 'health';

function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch<{ players: number; teams: number; matches: number; forum_posts: number }>('/admin/stats'),
    staleTime: 60_000,
  });
}

function useForumModerationQueue() {
  return useQuery({
    queryKey: ['admin-mod-queue'],
    queryFn: () => apiFetch<{ posts: any[] }>('/forum/posts?flagged=true'),
    staleTime: 30_000,
  });
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const { data: stats } = useAdminStats();
  const { data: modQueue } = useForumModerationQueue();
  const flaggedCount = modQueue?.posts?.length ?? 0;

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'moderation', label: `Moderation${flaggedCount > 0 ? ` (${flaggedCount})` : ''}` },
    { id: 'health', label: 'Health' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb',
      fontFamily: 'monospace', padding: '2rem' }}>
      <h1 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        Admin Dashboard
      </h1>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem',
              background: tab === t.id ? '#ef4444' : '#1f2937',
              color: tab === t.id ? '#fff' : '#9ca3af', border: 'none', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Players', value: stats?.players ?? '—' },
            { label: 'Teams', value: stats?.teams ?? '—' },
            { label: 'Matches', value: stats?.matches ?? '—' },
            { label: 'Forum Posts', value: stats?.forum_posts ?? '—' },
          ].map(s => (
            <div key={s.label} style={{ background: '#111827', borderRadius: '8px',
              padding: '1rem', border: '1px solid #1f2937' }}>
              <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{s.label}</div>
              <div style={{ color: '#e5e7eb', fontSize: '1.5rem', fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Moderation queue */}
      {tab === 'moderation' && (
        <div>
          <h2 style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '1rem' }}>
            Flagged Posts ({flaggedCount})
          </h2>
          {flaggedCount === 0 ? (
            <p style={{ color: '#6b7280' }}>No flagged posts in queue.</p>
          ) : (
            modQueue?.posts?.map((p: any) => (
              <div key={p.id} style={{ background: '#111827', borderRadius: '6px',
                padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid #f59e0b33' }}>
                <strong style={{ color: '#e5e7eb' }}>{p.title}</strong>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.25rem 0' }}>{p.body?.slice(0, 100)}...</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <p style={{ color: '#6b7280' }}>User management — connect to /v1/admin/users endpoint.</p>
      )}

      {/* Health tab */}
      {tab === 'health' && (
        <p style={{ color: '#6b7280' }}>System health — connect to /health and /ready endpoints.</p>
      )}
    </div>
  );
}
