[Ver001.000]

# Phase 5 Implementation Plan: Frontend Integration & Admin Panel

**Date:** 2026-03-27
**Status:** Implementation-Ready
**Total Scope:** 18 hours
**Objectives:** Connect frontend hubs to live data APIs, implement WebSocket updates, build admin panel

---

## Phase 5 Overview

Phase 5 bridges Phase 4's backend implementation with user-facing frontend features:

1. **Frontend API Integration** (6 hours)
   - Connect SATOR/AREPO/OPERA/ROTAS hubs to live data endpoints
   - Implement TanStack Query for data fetching and caching
   - Add match data display components

2. **Real-Time WebSocket Updates** (5 hours)
   - Connect hubs to WebSocket service
   - Implement real-time score/round updates
   - Handle connection lifecycle (reconnect, offline)

3. **Admin Panel Implementation** (5 hours)
   - Review queue interface
   - Decision submission UI
   - Monitoring dashboard
   - Admin authentication

4. **Data Persistence & Caching** (2 hours)
   - TanStack Query configuration
   - Cache invalidation strategy
   - Optimistic updates

---

## Task 5.1: Frontend API Integration (6 hours)

### 5.1.1: TanStack Query Setup (1.5 hours)

**Implementation:**

```typescript
// apps/web/src/lib/api-client.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add error handling and retry logic
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    throw error;
  }
);

// Query hooks
export function useMatchData(matchId: string) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => apiClient.get(`/v1/live/matches/${matchId}`),
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useMatchHistory(game: string, limit = 50) {
  return useQuery({
    queryKey: ['matches', 'history', game],
    queryFn: () => apiClient.get('/v1/history/matches', {
      params: { game, limit, confidence_min: 0.7 }
    }),
    staleTime: 60000, // 1 minute
  });
}

export function useLiveMatches(game?: string) {
  return useQuery({
    queryKey: ['matches', 'live', game],
    queryFn: () => apiClient.get('/v1/live/matches', {
      params: { game, confidence_min: 0.5 }
    }),
    staleTime: 3000, // 3 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

// Admin hooks
export function useReviewQueue(game?: string) {
  return useQuery({
    queryKey: ['review-queue', game],
    queryFn: () => apiClient.get('/v1/review-queue', {
      params: { game, priority: false, limit: 100 }
    }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 1 minute
  });
}

export function useSubmitReviewDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, decision, notes }: {
      itemId: string;
      decision: 'approve' | 'reject' | 'needs_more_data';
      notes?: string;
    }) => apiClient.post(`/v1/review-queue/${itemId}/decide`, {
      decision,
      notes
    }),
    onSuccess: () => {
      // Invalidate review queue cache
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
  });
}
```

**Configuration:**

```env
# apps/web/.env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8002
```

### 5.1.2: SATOR Hub Integration (1.5 hours)

**Implementation:**

```typescript
// apps/web/src/hub-1-sator/components/LiveMatches.tsx

import { useLiveMatches, useMatchData } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface Match {
  match_id: string;
  game: string;
  title: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  confidence: number;
}

export function LiveMatches() {
  const { data, isLoading, error } = useLiveMatches('valorant');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data?.data) return <EmptyState />;

  const matches = data.data as Match[];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Live Matches</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match) => (
          <motion.div
            key={match.match_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border border-white/10 rounded-lg bg-white/[0.02]"
          >
            <h3 className="font-bold text-white mb-2">{match.title}</h3>

            <div className="flex justify-between items-center mb-3">
              <div className="text-center flex-1">
                <p className="text-sm text-white/60">{match.team1_name}</p>
                <p className="text-2xl font-bold text-white">{match.team1_score}</p>
              </div>

              <div className="px-4">
                <p className="text-xs font-mono text-white/40">VS</p>
              </div>

              <div className="text-center flex-1">
                <p className="text-sm text-white/60">{match.team2_name}</p>
                <p className="text-2xl font-bold text-white">{match.team2_score}</p>
              </div>
            </div>

            {/* Confidence indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-kunst-green"
                    style={{ width: `${match.confidence * 100}%` }}
                  />
                </div>
                <span className="text-white/70">
                  {(match.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Loading, Error, Empty states
function LoadingState() {
  return <div className="text-center py-8 text-white/50">Loading matches...</div>;
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="text-center py-8 text-red-400">
      <p>Failed to load matches</p>
      <p className="text-xs text-white/40 mt-2">{error.message}</p>
    </div>
  );
}

function EmptyState() {
  return <div className="text-center py-8 text-white/50">No live matches</div>;
}
```

### 5.1.3: ROTAS Hub Integration (1 hour)

```typescript
// apps/web/src/hub-2-rotas/components/MatchHistory.tsx

import { useMatchHistory } from '@/lib/api-client';
import { MatchHistoryCard } from './MatchHistoryCard';

export function MatchHistory() {
  const { data, isLoading } = useMatchHistory('valorant', 50);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Match History</h2>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-3">
          {data?.data?.map((match: any) => (
            <MatchHistoryCard
              key={match.match_id}
              match={match}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.1.4: AREPO & OPERA Integration (1 hour)

Similar pattern for community and pro-scene hubs with adjusted data display.

---

## Task 5.2: WebSocket Real-Time Updates (5 hours)

### 5.2.1: WebSocket Hook (2 hours)

```typescript
// apps/web/src/lib/websocket.ts

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  matchId: string;
  timestamp: number;
  payload: Record<string, any>;
}

export function useWebSocket(matchId: string | null) {
  const [message, setMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!matchId) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8002'}/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Subscribe to match
        ws.current?.send(JSON.stringify({
          type: 'SUBSCRIBE',
          matchId,
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessage(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Failed to connect to WebSocket:', e);
      setIsConnected(false);
    }
  }, [matchId]);

  useEffect(() => {
    connect();

    return () => {
      ws.current?.close();
    };
  }, [connect]);

  return { message, isConnected };
}
```

### 5.2.2: Real-Time Match Display (2 hours)

```typescript
// apps/web/src/hub-1-sator/components/LiveScoreboard.tsx

import { useMatchData } from '@/lib/api-client';
import { useWebSocket } from '@/lib/websocket';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  matchId: string;
}

export function LiveScoreboard({ matchId }: Props) {
  const { data: matchData, isLoading } = useMatchData(matchId);
  const { message, isConnected } = useWebSocket(matchId);

  // Use WebSocket message if available, otherwise use query data
  const match = message?.payload || matchData?.data;

  if (isLoading && !match) {
    return <LoadingState />;
  }

  if (!match) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6">
      {/* Connection indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{match.title}</span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-kunst-green animate-pulse' : 'bg-white/20'
            }`}
          />
          <span className="text-white/50">
            {isConnected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {/* Score display */}
      <div className="grid grid-cols-3 gap-4">
        <TeamScore
          name={match.team1_name}
          score={match.team1_score}
          isWinning={match.team1_score > match.team2_score}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="text-xs font-mono text-white/40 mb-2">
            {match.status?.toUpperCase()}
          </div>
          {match.current_round && (
            <div className="text-2xl font-bold text-white">
              R{match.current_round}
            </div>
          )}
        </div>

        <TeamScore
          name={match.team2_name}
          score={match.team2_score}
          isWinning={match.team2_score > match.team1_score}
        />
      </div>

      {/* Update timestamp */}
      <div className="text-center text-xs font-mono text-white/30">
        Updated: {new Date(message?.timestamp || Date.now()).toLocaleTimeString()}
      </div>
    </div>
  );
}

function TeamScore({
  name,
  score,
  isWinning,
}: {
  name: string;
  score: number;
  isWinning: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="text-center"
    >
      <p className="text-sm text-white/60 mb-2">{name}</p>
      <motion.div
        key={score}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`text-4xl font-bold ${
          isWinning ? 'text-kunst-green' : 'text-white'
        }`}
      >
        {score}
      </motion.div>
    </motion.div>
  );
}
```

### 5.2.3: Offline Handling & Reconnection (1 hour)

Implemented in useWebSocket hook above with automatic reconnection.

---

## Task 5.3: Admin Panel Implementation (5 hours)

### 5.3.1: Review Queue Interface (2 hours)

```typescript
// apps/web/src/components/AdminPanel.tsx

import { useReviewQueue, useSubmitReviewDecision } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export function ReviewQueuePanel() {
  const { data, isLoading, error } = useReviewQueue();
  const submitDecision = useSubmitReviewDecision();

  if (!isLoading && !data?.data) {
    return <div className="text-center py-8 text-white/50">No items to review</div>;
  }

  const items = data?.data || [];
  const highPriority = items.filter((item: any) => item.confidence < 0.5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Review Queue</h2>
        <div className="text-sm font-mono text-white/50">
          {highPriority.length} high priority
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-white/10 rounded text-sm font-bold text-white">
          High Priority ({highPriority.length})
        </button>
        <button className="px-4 py-2 bg-white/5 rounded text-sm font-bold text-white/60 hover:text-white">
          All Items ({items.length})
        </button>
      </div>

      {/* Review items */}
      <div className="space-y-3">
        {highPriority.map((item: any) => (
          <ReviewQueueItem
            key={item.item_id}
            item={item}
            onDecision={submitDecision.mutate}
            isSubmitting={submitDecision.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewQueueItem({
  item,
  onDecision,
  isSubmitting,
}: {
  item: any;
  onDecision: (args: any) => void;
  isSubmitting: boolean;
}) {
  const [decision, setDecision] = useState<string | null>(null);

  const handleSubmit = (decision: string) => {
    onDecision({
      itemId: item.item_id,
      decision,
      notes: `Reviewed on ${new Date().toISOString()}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 border border-red-500/20 bg-red-500/[0.05] rounded-lg"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-bold text-white">{item.item_id}</p>
            <p className="text-xs text-white/50">{item.data_type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-red-400">
            {(item.confidence * 100).toFixed(0)}% confidence
          </p>
          <p className="text-xs text-white/40">Low confidence</p>
        </div>
      </div>

      {/* Issues list */}
      {item.issues?.length > 0 && (
        <div className="mb-4 space-y-1">
          {item.issues.map((issue: string, idx: number) => (
            <p key={idx} className="text-xs text-white/60">
              • {issue}
            </p>
          ))}
        </div>
      )}

      {/* Decision buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleSubmit('approve')}
          disabled={isSubmitting}
          className="flex-1 px-3 py-2 bg-kunst-green/20 border border-kunst-green/50 rounded text-sm font-bold text-kunst-green hover:bg-kunst-green/30 disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Approve
        </button>
        <button
          onClick={() => handleSubmit('reject')}
          disabled={isSubmitting}
          className="flex-1 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded text-sm font-bold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 inline mr-2" />
          Reject
        </button>
        <button
          onClick={() => handleSubmit('needs_more_data')}
          disabled={isSubmitting}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm font-bold text-white/70 hover:bg-white/10 disabled:opacity-50"
        >
          More Data
        </button>
      </div>
    </motion.div>
  );
}
```

### 5.3.2: Admin Dashboard (2 hours)

```typescript
// apps/web/src/pages/AdminDashboard.tsx

import { useReviewQueue } from '@/lib/api-client';
import { ReviewQueuePanel } from '@/components/AdminPanel';

export default function AdminDashboard() {
  const { data } = useReviewQueue();
  const items = data?.data || [];

  const stats = {
    total: items.length,
    highPriority: items.filter((i: any) => i.confidence < 0.5).length,
    avgConfidence: items.length > 0
      ? (items.reduce((sum: number, i: any) => sum + i.confidence, 0) / items.length * 100).toFixed(0)
      : 0,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/50">Manage data verification and quality</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            label="Items in Queue"
            value={stats.total.toString()}
            color="white"
          />
          <StatCard
            label="High Priority"
            value={stats.highPriority.toString()}
            color="red"
          />
          <StatCard
            label="Avg Confidence"
            value={`${stats.avgConfidence}%`}
            color="green"
          />
        </div>

        {/* Review Queue */}
        <ReviewQueuePanel />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'white' | 'red' | 'green';
}) {
  const colorClass = {
    white: 'text-white',
    red: 'text-red-400',
    green: 'text-kunst-green',
  }[color];

  return (
    <div className="p-6 border border-white/10 bg-white/[0.02] rounded-lg">
      <p className="text-sm font-mono text-white/50 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
```

### 5.3.3: Admin Authentication (1 hour)

```typescript
// apps/web/src/lib/auth.ts

import { useAuth0 } from '@auth0/auth0-react';

export function useAdminAccess() {
  const { user, isLoading } = useAuth0();

  // Check if user has admin role
  const isAdmin = user?.['https://njz.gg/roles']?.includes('admin') || false;

  return { isAdmin, isLoading };
}

// Protect admin routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminAccess();

  if (isLoading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Access Denied</div>;

  return <>{children}</>;
}
```

---

## Task 5.4: Data Persistence & Caching (2 hours)

### 5.4.1: Cache Strategy

```typescript
// apps/web/src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

### 5.4.2: Optimistic Updates

```typescript
// In components that submit decisions
const submitDecision = useMutation({
  mutationFn: (args) => submitDecisionAPI(args),
  onMutate: async (newData) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: ['review-queue'] });

    // Snapshot previous data
    const previousData = queryClient.getQueryData(['review-queue']);

    // Update UI optimistically
    queryClient.setQueryData(['review-queue'], (old: any) => ({
      ...old,
      data: old?.data?.filter((item: any) => item.item_id !== newData.itemId),
    }));

    return { previousData };
  },
  onError: (err, newData, context) => {
    // Revert on error
    if (context?.previousData) {
      queryClient.setQueryData(['review-queue'], context.previousData);
    }
  },
  onSuccess: () => {
    // Refetch after success
    queryClient.invalidateQueries({ queryKey: ['review-queue'] });
  },
});
```

---

## Phase 5 Gates

| Gate | Criteria | Implementation | Verification |
|------|----------|-----------------|-----------------|
| 5.1 | TanStack Query configured | API client hooks | Build succeeds |
| 5.2 | Hubs connect to live data | useMatchData/useLiveMatches | Data displayed |
| 5.3 | WebSocket real-time updates | useWebSocket hook | Live scores update |
| 5.4 | Admin panel rendering | ReviewQueuePanel component | Panel visible |
| 5.5 | Review decisions working | Decision submission | API called |
| 5.6 | Caching & optimization | QueryClient setup | Queries cached |

---

## File Structure

```
apps/web/src/
├── lib/
│   ├── api-client.ts          (TanStack Query hooks)
│   ├── websocket.ts           (WebSocket hook)
│   ├── queryClient.ts         (Cache configuration)
│   └── auth.ts                (Admin authentication)
├── components/
│   └── AdminPanel.tsx         (Review queue interface)
├── hub-1-sator/
│   └── components/
│       ├── LiveMatches.tsx    (SATOR integration)
│       └── LiveScoreboard.tsx (Real-time scores)
├── hub-2-rotas/
│   └── components/
│       └── MatchHistory.tsx   (ROTAS integration)
├── pages/
│   └── AdminDashboard.tsx     (Admin panel page)
└── App.tsx                    (Route: /admin)
```

---

## Testing Checklist

- [ ] API client connects to backend
- [ ] TanStack Query caches data correctly
- [ ] WebSocket connects and receives messages
- [ ] Live scores update in real-time
- [ ] Admin panel displays review queue
- [ ] Decision submission works
- [ ] Offline reconnection works
- [ ] Mobile responsive
- [ ] Accessibility verified

---

## Deployment Checklist

- [ ] .env configured with API and WS URLs
- [ ] Admin authentication enabled
- [ ] Error boundaries in place
- [ ] Loading states functional
- [ ] Performance optimized
- [ ] TypeScript strict mode passes

---

**End of Phase 5 Implementation Plan**
