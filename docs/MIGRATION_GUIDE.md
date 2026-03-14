[Ver001.000]

# Migration Guide — 4NJZ4 TENET Platform v2.0 to v2.1

**Target Audience:** Developers integrating with or extending the platform  
**Last Updated:** 2026-03-15  
**Breaking Changes:** Yes (API v1 path changes)

---

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [API Migration](#api-migration)
4. [WebSocket Migration](#websocket-migration)
5. [Environment Variables](#environment-variables)
6. [Dependency Updates](#dependency-updates)
7. [Error Boundary Migration](#error-boundary-migration)
8. [Code Examples](#code-examples)
9. [Rollback Plan](#rollback-plan)

---

## Overview

Version 2.1 introduces several breaking changes to improve API consistency, performance, and developer experience. This guide will help you migrate your existing code.

### Timeline

- **v2.0.x:** Legacy endpoints still available but deprecated
- **v2.1.0:** New endpoints available, legacy endpoints deprecated
- **v2.2.0:** Legacy endpoints will be removed (target: Q3 2026)

### Migration Checklist

- [ ] Update API endpoint URLs to `/v1/` prefix
- [ ] Update WebSocket connection logic
- [ ] Add new environment variables
- [ ] Update dependencies
- [ ] Test error boundary configurations
- [ ] Verify caching behavior
- [ ] Run integration tests

---

## Breaking Changes

### 1. API Endpoint Path Changes

| Old Path | New Path | Status |
|----------|----------|--------|
| `/api/players/{id}` | `/v1/players/{id}` | Required |
| `/api/players/` | `/v1/players/` | Required |
| `/api/matches/{id}` | `/v1/matches/{id}` | Required |
| `/api/matches/` | `/v1/matches/` | Required |
| `/api/analytics/*` | `/v1/analytics/*` | Required |
| `/health` | `/health` | Unchanged |

### 2. WebSocket Endpoint Consolidation

| Old Endpoint | New Endpoint | Migration |
|--------------|--------------|-----------|
| `/v1/ws/live/{match_id}` | `/v1/ws` + subscribe | See [WebSocket Migration](#websocket-migration) |
| `/v1/ws/dashboard/{id}` | `/v1/ws` + subscribe | See [WebSocket Migration](#websocket-migration) |
| `/v1/ws/analytics/{channel}` | `/v1/ws` + subscribe | See [WebSocket Migration](#websocket-migration) |

### 3. Response Format Changes

#### Player Response

**v2.0 (Old):**
```json
{
  "id": "...",
  "name": "TenZ",
  "sim_rating": 1.23
}
```

**v2.1 (New):**
```json
{
  "player_id": "...",
  "name": "TenZ",
  "sim_rating": 1.23,
  "confidence_tier": 92.5,
  "last_updated": "2026-03-15T10:00:00Z"
}
```

**Changes:**
- `id` → `player_id` (for consistency)
- Added `confidence_tier`
- Added `last_updated`

### 4. Query Parameter Changes

| Endpoint | Old Parameter | New Parameter | Notes |
|----------|---------------|---------------|-------|
| `/players/` | `minMaps` | `min_maps` | Snake_case standard |
| `/players/` | `sortBy` | `sort` | Simplified |
| `/matches/` | `dateFrom` | `date_from` | Snake_case standard |
| `/matches/` | `dateTo` | `date_to` | Snake_case standard |

---

## API Migration

### JavaScript/TypeScript

#### Before (v2.0)

```typescript
// Old API client
const API_BASE = 'https://api.libre-x-esport.com';

async function getPlayer(id: string) {
  const response = await fetch(`${API_BASE}/api/players/${id}`);
  return response.json();
}

async function listPlayers(filters: any) {
  const params = new URLSearchParams({
    region: filters.region,
    minMaps: filters.minMaps.toString(),
    sortBy: filters.sortBy
  });
  const response = await fetch(`${API_BASE}/api/players/?${params}`);
  return response.json();
}
```

#### After (v2.1)

```typescript
// New API client
const API_BASE = 'https://api.libre-x-esport.com/v1';

async function getPlayer(id: string) {
  const response = await fetch(`${API_BASE}/players/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  return response.json();
}

async function listPlayers(filters: any) {
  const params = new URLSearchParams({
    region: filters.region,
    min_maps: filters.minMaps.toString(),  // Changed: snake_case
    sort: filters.sortBy                     // Changed: simplified name
  });
  const response = await fetch(`${API_BASE}/players/?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }
  return response.json();
}
```

### Python

#### Before (v2.0)

```python
import requests

API_BASE = "https://api.libre-x-esport.com"

def get_player(player_id: str) -> dict:
    response = requests.get(f"{API_BASE}/api/players/{player_id}")
    return response.json()

def list_players(**filters) -> dict:
    params = {
        "region": filters.get("region"),
        "minMaps": filters.get("min_maps"),  # Old parameter name
        "sortBy": filters.get("sort_by")       # Old parameter name
    }
    response = requests.get(f"{API_BASE}/api/players/", params=params)
    return response.json()
```

#### After (v2.1)

```python
import requests
from typing import Optional

API_BASE = "https://api.libre-x-esport.com/v1"  # Added /v1

def get_player(player_id: str) -> dict:
    response = requests.get(f"{API_BASE}/players/{player_id}")
    response.raise_for_status()  # New: proper error handling
    return response.json()

def list_players(
    region: Optional[str] = None,
    min_maps: int = 50,
    sort: str = "sim_rating"
) -> dict:
    params = {
        "region": region,
        "min_maps": min_maps,      # Changed: snake_case
        "sort": sort                # Changed: simplified name
    }
    response = requests.get(f"{API_BASE}/players/", params=params)
    response.raise_for_status()  # New: proper error handling
    return response.json()
```

---

## WebSocket Migration

### Before (v2.0)

```typescript
// Old: Separate endpoints per resource
const liveMatchWS = new WebSocket(
  'wss://api.libre-x-esport.com/v1/ws/live/12345'
);

const dashboardWS = new WebSocket(
  'wss://api.libre-x-esport.com/v1/ws/dashboard/user-1'
);

liveMatchWS.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMatchUpdate(data);
};
```

### After (v2.1)

```typescript
// New: Single endpoint with channel subscriptions
import { useWebSocket } from '@/hooks/useWebSocket';

function MatchComponent({ matchId }: { matchId: string }) {
  const { subscribe, isConnected } = useWebSocket({
    url: 'wss://api.libre-x-esport.com/v1/ws',
    token: 'your-jwt-token'
  });

  useEffect(() => {
    if (isConnected) {
      // Subscribe to match channel
      subscribe(`match:${matchId}`, {}, (data) => {
        handleMatchUpdate(data);
      });
      
      // Subscribe to player channel
      subscribe('player:tenz', {}, (data) => {
        handlePlayerUpdate(data);
      });
    }
  }, [isConnected, matchId]);
}
```

### Raw WebSocket (Without Hook)

```typescript
const ws = new WebSocket(
  'wss://api.libre-x-esport.com/v1/ws?token=your-jwt-token'
);

ws.onopen = () => {
  // Subscribe to channels
  ws.send(JSON.stringify({
    action: 'subscribe',
    channel: 'match:12345',
    filters: { events: ['kill', 'round_end'] }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'connection':
      console.log('Connected:', message.data);
      break;
    case 'match_update':
      handleMatchUpdate(message.data);
      break;
    case 'player_stats_update':
      handlePlayerUpdate(message.data);
      break;
  }
};
```

---

## Environment Variables

### New Required Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PANDASCORE_API_KEY` | No* | Pandascore API key for legal data | `pc_live_xxxxxxxx` |
| `REDIS_URL` | Yes | Redis connection URL | `redis://localhost:6379` |
| `VITE_API_URL` | Yes | Updated to include /v1 | `https://api.libre-x-esport.com/v1` |

\* Required only if using Pandascore data source

### Updated Variables

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `VITE_API_URL` | `https://api.libre-x-esport.com` | `https://api.libre-x-esport.com/v1` |
| `API_PREFIX` | `/api` | `/v1` |

### .env.example Update

```bash
# .env.example (v2.1)

# API Configuration
VITE_API_URL=https://api.libre-x-esport.com/v1
API_PREFIX=/v1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sator

# Cache
REDIS_URL=redis://localhost:6379

# External APIs
PANDASCORE_API_KEY=pc_live_xxxxxxxxxxxxxxxx

# Security
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://libre-x-esport.com,https://www.libre-x-esport.com
```

---

## Dependency Updates

### Frontend Dependencies

Add to `apps/website-v2/package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.13.22",
    "scheduler": "^0.21.0",
    "ws": "^8.14.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0"
  }
}
```

Install:
```bash
cd apps/website-v2
npm install @tanstack/react-virtual scheduler ws
npm install -D @types/ws
```

### Backend Dependencies

Add to `requirements.txt`:

```txt
# Existing dependencies...

# New for v2.1
redis>=5.0.0
aioredis>=2.0.0
httpx>=0.25.0
```

Install:
```bash
pip install -r requirements.txt
```

---

## Error Boundary Migration

### Before (v2.0)

```tsx
// Simple error boundary usage
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/sator" element={<SatorHub />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### After (v2.1)

```tsx
// Hierarchical error boundaries
import { 
  AppErrorBoundary, 
  HubErrorBoundary,
  DataErrorBoundary,
  MLInferenceErrorBoundary 
} from '@/components/error';

function App() {
  return (
    <AppErrorBoundary>
      <Router>
        <Routes>
          <Route 
            path="/sator" 
            element={
              <HubErrorBoundary hubName="sator">
                <MLInferenceErrorBoundary>
                  <SatorHub />
                </MLInferenceErrorBoundary>
              </HubErrorBoundary>
            } 
          />
          <Route 
            path="/arepo" 
            element={
              <HubErrorBoundary hubName="arepo">
                <DataErrorBoundary>
                  <ArepoHub />
                </DataErrorBoundary>
              </HubErrorBoundary>
            } 
          />
        </Routes>
      </Router>
    </AppErrorBoundary>
  );
}
```

---

## Code Examples

### Complete API Client (v2.1)

```typescript
// lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.libre-x-esport.com/v1';

class LibreXAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        error.error.message,
        error.error.code,
        response.status
      );
    }

    return response.json();
  }

  // Players
  async getPlayer(id: string): Promise<Player> {
    return this.request<Player>(`/players/${id}`);
  }

  async listPlayers(params?: ListPlayersParams): Promise<PlayerListResponse> {
    const query = new URLSearchParams();
    if (params?.region) query.set('region', params.region);
    if (params?.min_maps) query.set('min_maps', params.min_maps.toString());
    if (params?.sort) query.set('sort', params.sort);
    
    return this.request<PlayerListResponse>(`/players/?${query}`);
  }

  // Matches
  async getMatch(id: string): Promise<Match> {
    return this.request<Match>(`/matches/${id}`);
  }

  // Search
  async search(query: string, type?: SearchType): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (type) params.set('type', type);
    return this.request<SearchResponse>(`/search/?${params}`);
  }

  async getSuggestions(query: string): Promise<SuggestionResponse> {
    return this.request<SuggestionResponse>(
      `/search/suggestions?q=${encodeURIComponent(query)}`
    );
  }
}

export const api = new LibreXAPI();

// Custom error class
class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

### React Hook for API

```typescript
// hooks/usePlayers.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => api.getPlayer(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlayers(params?: ListPlayersParams) {
  return useQuery({
    queryKey: ['players', params],
    queryFn: () => api.listPlayers(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useSearch(query: string, type?: SearchType) {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: () => api.search(query, type),
    enabled: query.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

---

## Rollback Plan

If issues occur after migration:

### 1. Frontend Rollback

```bash
# Revert to previous version
git checkout v2.0.x
npm install
npm run build
npm run deploy
```

### 2. API Rollback

```bash
# Switch to previous Docker image
docker pull libre-x-esport/api:v2.0.x
docker-compose up -d
```

### 3. Environment Variable Rollback

```bash
# Restore old API URL
export VITE_API_URL=https://api.libre-x-esport.com
# (without /v1 prefix)
```

### 4. Database Compatibility

Database schema is backward compatible. No rollback needed.

---

## Troubleshooting

### Common Issues

#### 404 Errors After Migration

**Problem:** API calls returning 404
**Solution:** Verify URL includes `/v1` prefix
```typescript
// Wrong
const API_BASE = 'https://api.libre-x-esport.com';

// Correct
const API_BASE = 'https://api.libre-x-esport.com/v1';
```

#### WebSocket Not Connecting

**Problem:** WebSocket connection fails
**Solution:** Use unified endpoint with subscription
```typescript
// Wrong
const ws = new WebSocket('wss://api.libre-x-esport.com/v1/ws/live/123');

// Correct
const ws = new WebSocket('wss://api.libre-x-esport.com/v1/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    channel: 'match:123'
  }));
};
```

#### CORS Errors

**Problem:** CORS errors in browser
**Solution:** Update CORS origins in API configuration
```python
# config.py
CORS_ORIGINS = [
    "https://libre-x-esport.com",
    "https://www.libre-x-esport.com",
    "http://localhost:5173"  # Development
]
```

---

## Support

For migration assistance:

- **Documentation:** [docs/API_V1_DOCUMENTATION.md](API_V1_DOCUMENTATION.md)
- **WebSocket Docs:** [docs/WEBSOCKET_PROTOCOL.md](WEBSOCKET_PROTOCOL.md)
- **Issues:** https://github.com/notbleaux/eSports-EXE/issues
- **Discussions:** https://github.com/notbleaux/eSports-EXE/discussions

---

*End of Migration Guide*
