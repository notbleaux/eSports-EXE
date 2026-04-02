// @ts-nocheck
// [Ver001.000] eSports Calendar — upcoming matches from Pandascore API.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';

interface CalendarMatch {
  id: number;
  name: string;
  scheduled_at: string;
  tournament_name: string;
  team_a: string;
  team_b: string;
  game: 'valorant' | 'cs2';
  stream_url?: string;
}

function useUpcomingMatches(game?: 'valorant' | 'cs2') {
  return useQuery({
    queryKey: ['upcoming-matches', game],
    queryFn: () => {
      const p = new URLSearchParams({ status: 'upcoming', limit: '20' });
      if (game) p.set('game', game);
      return apiFetch<{ matches: CalendarMatch[]; total: number }>(`/matches?${p}`);
    },
    staleTime: 300_000,
  });
}

export function EsportsCalendar({ game }: { game?: 'valorant' | 'cs2' }) {
  const { data, isLoading } = useUpcomingMatches(game);
  const matches = (data as { matches?: CalendarMatch[] })?.matches ?? [];

  const grouped = matches.reduce<Record<string, CalendarMatch[]>>((acc, m) => {
    const date = new Date(m.scheduled_at).toLocaleDateString('en-AU', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(m);
    return acc;
  }, {});

  if (isLoading) return <div style={{ color: '#6b7280', padding: '1rem' }}>Loading schedule...</div>;
  if (!matches.length) return (
    <div style={{ color: '#6b7280', padding: '1rem', textAlign: 'center' }}>
      <p>No upcoming matches scheduled.</p>
      <p style={{ fontSize: '0.8rem' }}>Run Pandascore sync to populate schedule.</p>
    </div>
  );

  return (
    <div className="esports-calendar" style={{ fontFamily: 'monospace' }}>
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <div key={date} style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#8b5cf6', fontSize: '0.8rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{date}</h4>
          {dayMatches.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0', borderBottom: '1px solid #1f2937' }}>
              <span style={{ color: '#6b7280', fontSize: '0.7rem', width: '3rem' }}>
                {new Date(m.scheduled_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ flex: 1, color: '#e5e7eb', fontSize: '0.85rem' }}>
                {m.team_a} <span style={{ color: '#6b7280' }}>vs</span> {m.team_b}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>{m.tournament_name}</span>
              {m.stream_url && (
                <a href={m.stream_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#8b5cf6', fontSize: '0.7rem' }}>▶ Watch</a>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
