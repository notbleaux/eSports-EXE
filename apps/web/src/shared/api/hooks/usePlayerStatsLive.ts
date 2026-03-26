// [Ver001.000] Live player stats via WebSocket with auto-reconnect.
import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = (import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000').replace(/\/+$/, '');

export interface LiveStatsUpdate {
  player_id: number;
  kd_ratio?: number;
  acs?: number;
  headshot_pct?: number;
  timestamp: string;
  type: 'stats_update' | 'rank_change' | 'match_end';
}

export function usePlayerStatsLive(playerId: number | null) {
  const [lastUpdate, setLastUpdate] = useState<LiveStatsUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!playerId || !mountedRef.current) return;
    const ws = new WebSocket(`${WS_URL}/ws/players/${playerId}/stats`);
    wsRef.current = ws;

    ws.onopen = () => { if (mountedRef.current) setConnected(true); };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as LiveStatsUpdate;
        if (mountedRef.current) setLastUpdate(data);
      } catch { /* ignore malformed messages */ }
    };
    ws.onclose = () => {
      if (mountedRef.current) {
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };
    ws.onerror = () => ws.close();

    // Keepalive ping every 25s
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 25_000);
    ws.addEventListener('close', () => clearInterval(ping));
  }, [playerId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { lastUpdate, connected };
}
