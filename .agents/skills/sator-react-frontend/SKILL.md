---
name: sator-react-frontend
description: "React TypeScript frontend development for 4NJZ4 TENET Platform. USE FOR: React 18 components, Tailwind CSS styling, TanStack Query data fetching, Vite build, 5-hub architecture. DO NOT USE FOR: Vue, Angular, vanilla JS, non-SATOR projects."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# SATOR React Frontend (4NJZ4 TENET Platform)

> **5-HUB ARCHITECTURE**
>
> Location: `apps/website-v2/`
> React 18 + Vite + Tailwind CSS + TypeScript
> 5 hubs: SATOR, ROTAS, AREPO, OPERA, TENET

## Triggers

Activate this skill when user wants to:
- Create React components for 4NJZ4 TENET Platform
- Implement Tailwind CSS styling
- Set up TanStack Query for API data fetching
- Work with Vite build configuration
- Create hub-specific pages
- Implement error boundaries

## Rules

1. **TypeScript Strict** — Enable strict mode, use proper types
2. **Tailwind Styling** — Use Tailwind utilities, no inline styles
3. **TanStack Query** — Use for all API data fetching
4. **Hub Structure** — Place code in appropriate hub folder
5. **Error Boundaries** — 2+ levels per hub (HubErrorBoundary → PanelErrorBoundary)
6. **Path Mapping** — Use `@hub-X/*` aliases for hub imports

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| React 18 + TypeScript development | Vue, Angular, vanilla JS |
| Tailwind CSS styling | CSS-in-JS, styled-components |
| TanStack Query data fetching | Redux, Context for server state |
| Vite build tool | Create React App, Webpack |
| 5-hub architecture | Traditional page structure |
| Error boundary hierarchy | Simple try-catch |

## Project Structure

```
apps/website-v2/
├── src/
│   ├── main.tsx                 # Entry point
│   ├── App.tsx                  # Root with routing
│   ├── components/              # Shared components
│   │   ├── common/              # Buttons, Cards, Loaders
│   │   ├── error/               # Error boundaries
│   │   ├── grid/                # Grid panel components
│   │   └── ui/                  # Shadcn UI components
│   ├── hub-1-sator/             # SATOR Hub - Analytics
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── hub-2-rotas/             # ROTAS Hub - Simulation
│   ├── hub-3-arepo/             # AREPO Hub - Tournaments
│   ├── hub-4-opera/             # OPERA Hub - Maps
│   ├── hub-5-tenet/             # TENET Hub - Central
│   ├── hooks/                   # Global hooks
│   ├── services/                # API services
│   ├── lib/                     # Utilities
│   └── types/                   # TypeScript types
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Configuration

### tsconfig.json Path Mapping

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@hub-1/*": ["src/hub-1-sator/*"],
      "@hub-2/*": ["src/hub-2-rotas/*"],
      "@hub-3/*": ["src/hub-3-arepo/*"],
      "@hub-4/*": ["src/hub-4-opera/*"],
      "@hub-5/*": ["src/hub-5-tenet/*"]
    }
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hub-1': path.resolve(__dirname, './src/hub-1-sator'),
      '@hub-2': path.resolve(__dirname, './src/hub-2-rotas'),
      '@hub-3': path.resolve(__dirname, './src/hub-3-arepo'),
      '@hub-4': path.resolve(__dirname, './src/hub-4-opera'),
      '@hub-5': path.resolve(__dirname, './src/hub-5-tenet'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

## API Service

```typescript
// src/services/api.ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.error('Resource not found')
    } else if (error.response?.status >= 500) {
      console.error('Server error')
    }
    return Promise.reject(error)
  }
)
```

## TanStack Query Hooks

```typescript
// src/hub-1-sator/hooks/usePlayers.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import type { Player, PlayerListResponse } from '@/types'

const PLAYERS_KEY = 'players'

export function usePlayers(page: number = 1, pageSize: number = 20) {
  return useQuery<PlayerListResponse>({
    queryKey: [PLAYERS_KEY, page, pageSize],
    queryFn: async () => {
      const response = await api.get('/players', {
        params: { page, page_size: pageSize },
      })
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePlayer(playerId: string) {
  return useQuery<Player>({
    queryKey: [PLAYERS_KEY, playerId],
    queryFn: async () => {
      const response = await api.get(`/players/${playerId}`)
      return response.data
    },
    enabled: !!playerId,
  })
}
```

## Error Boundaries

```typescript
// src/components/error/HubErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  hubName: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class HubErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.hubName}] Error:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">
            {this.props.hubName} Hub Error
          </h2>
          <p className="mt-2 text-gray-600">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

## Hub Page Structure

```tsx
// src/hub-1-sator/pages/SatorHub.tsx
import { HubErrorBoundary } from '@/components/error/HubErrorBoundary'
import { MLInferenceErrorBoundary } from '@/components/error/MLInferenceErrorBoundary'
import { PlayerGrid } from '../components/PlayerGrid'
import { AnalyticsPanel } from '../components/AnalyticsPanel'

export function SatorHub() {
  return (
    <HubErrorBoundary hubName="SATOR">
      <MLInferenceErrorBoundary>
        <div className="min-h-screen bg-radiant-darker text-white">
          <h1 className="text-3xl font-bold p-6">SATOR Analytics</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <PlayerGrid />
            <AnalyticsPanel />
          </div>
        </div>
      </MLInferenceErrorBoundary>
    </HubErrorBoundary>
  )
}
```

## Environment Variables

```bash
# .env.local
VITE_API_URL=http://localhost:8000/v1
VITE_WS_URL=ws://localhost:8000/v1/ws
VITE_ENABLE_ANALYTICS=true
```

## Commands

```bash
cd apps/website-v2

# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npx playwright test
```

## References

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TanStack Query Documentation](https://tanstack.com/query/)
- [Vite Documentation](https://vitejs.dev/)
