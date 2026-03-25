import { useEffect, useState, useRef } from 'react';

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000';

export function useLiveMatches() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);
  const [liveMatches, setLiveMatches] = useState<unknown[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(`${WS_BASE}/ws/matches/live`);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = () => setIsConnected(false);
    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type: string;
          timestamp: string;
          live_matches?: unknown[];
        };
        if (data.type === 'heartbeat') {
          setLastHeartbeat(data.timestamp);
          setLiveMatches(data.live_matches ?? []);
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  return { isConnected, lastHeartbeat, liveMatches };
}
