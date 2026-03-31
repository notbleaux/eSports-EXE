# 05 - Technical Constraints
## Implementation Boundaries

---

## Technology Stack (Fixed)

### Frontend
| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Framework | React | 18.x | Functional components, hooks |
| Build Tool | Vite | 5.x | Fast HMR, optimized builds |
| Styling | Tailwind CSS | 3.x | Utility-first |
| Language | TypeScript | 5.x | Strict mode enabled |
| State (Client) | Zustand | 4.x | Lightweight store |
| State (Server) | TanStack Query | 5.x | Caching, synchronization |
| Animation | Framer Motion | 11.x | Page transitions, gestures |
| Icons | Lucide React | latest | Consistent icon set |
| Charts | Recharts | 2.x | D3-based React charts |

### Backend (Existing)
- FastAPI (Python 3.11+)
- PostgreSQL 15
- Redis 7
- Celery (task queue)

---

## Constraints & Limitations

### Must Use
✅ **pnpm** — Monorepo package manager
✅ **Turbo** — Build system
✅ **Path Aliases:**
  - `@/*` → `src/*`
  - `@hub-1/*` → `src/hub-1-sator/*`
  - `@hub-2/*` → `src/hub-2-rotas/*`
  - `@hub-3/*` → `src/hub-3-arepo/*`
  - `@hub-4/*` → `src/hub-4-opera/*`
  - `@hub-5/*` → `src/hub-5-tenet/*`
  - `@shared/*` → `src/shared/*`

### Must NOT Use
❌ **jQuery** — Not in stack
❌ **Bootstrap** — Use Tailwind
❌ **Material UI** — Custom components only
❌ **Redux** — Use Zustand
❌ **SASS/LESS** — Tailwind only
❌ **CSS Modules** — Tailwind utility classes

---

## HUB Isolation (Critical)

### The Rule
**HUBs cannot import from other HUBs.**

```typescript
// ❌ FORBIDDEN
// In hub-1-sator/components/AnalyticsCard.tsx:
import { StatsGrid } from '@/hub-2-rotas/components/StatsGrid';

// ✅ CORRECT
// Move to shared or duplicate
import { StatsGrid } from '@/shared/components/StatsGrid';
// OR create HUB-specific version
import { AnalyticsStatsGrid } from './AnalyticsStatsGrid';
```

### Shared Components
If a component is used by 2+ HUBs, it goes in:
```
src/shared/components/
```

### Component Naming
```typescript
// HUB-specific prefix
hub-2-rotas/components/
├── RotasPlayerCard.tsx      // ✅
├── PlayerCard.tsx           // ❌ Ambiguous

hub-1-sator/components/
├── SatorAnalyticsChart.tsx  // ✅
├── AnalyticsChart.tsx       // ❌ Ambiguous
```

---

## TypeScript Requirements

### Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type Definition Pattern
```typescript
// types/player.ts (in shared/types/)
export interface Player {
  id: string;
  name: string;
  slug: string;
  teamId: string;
  nationality?: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  kd: number;
  adr: number;
  rating: number;
  // ... etc
}
```

---

## Performance Constraints

### Bundle Size
- **Target:** < 200KB initial JS
- **Code splitting:** By route and HUB
- **Lazy loading:** Heavy components (charts, 3D)

### Loading Performance
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Lighthouse Score:** > 90

### API Performance
- **Response time:** < 200ms (p95)
- **TanStack Query staleTime:** 5 minutes default
- **Pagination:** 20 items default, 100 max

---

## API Contract

### Base URL
```
Development: http://localhost:8000/v1
Production: https://api.esports-exe.com/v1
```

### Endpoints (ROTAS)
```typescript
// Players
GET /api/rotas/players?page=&per_page=&game=
GET /api/rotas/players/:id
GET /api/rotas/players/:id/stats

// Teams
GET /api/rotas/teams
GET /api/rotas/teams/:id
GET /api/rotas/teams/:id/stats

// Matches
GET /api/rotas/matches
GET /api/rotas/matches/:id

// Tournaments
GET /api/rotas/tournaments

// Leaderboards
GET /api/rotas/leaderboards/kd?game=&limit=
GET /api/rotas/leaderboards/adr?game=&limit=
```

### Response Format
```typescript
// Paginated list
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Error
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

---

## Browser Support

### Target Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement
- Core functionality works without JS (SSR)
- Enhanced features load progressively
- Graceful degradation for older browsers

---

## Accessibility (a11y)

### Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast > 4.5:1

### Testing
```bash
# Automated
pnpm run test:a11y

# Manual checklist
# - Tab through entire flow
# - Verify focus indicators
# - Test with screen reader
# - Check color contrast
```

---

## SEO Constraints

### Requirements
- SSR for public pages
- Meta tags per page
- Sitemap generation
- Structured data (Schema.org)

### Route Structure for SEO
```
/valorant                    → Game landing
/valorant/stats              → ROTAS hub
/valorant/stats/players      → Player list
/valorant/stats/players/tenz → Player profile (slug-based)
/valorant/pro                → OPERA hub
```

---

## State Management Rules

### Zustand Stores
```typescript
// stores/gameStore.ts
interface GameState {
  currentGame: 'valorant' | 'cs2';
  setGame: (game: string) => void;
}

// stores/userStore.ts
interface UserState {
  tier: 'casual' | 'aspiring' | 'professional';
  setTier: (tier: UserTier) => void;
}
```

### TanStack Query Patterns
```typescript
// hooks/usePlayers.ts
export function usePlayers(game: string, page: number) {
  return useQuery({
    queryKey: ['players', game, page],
    queryFn: () => fetchPlayers(game, page),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

---

## File Organization

### Component File Structure
```
ComponentName/
├── index.tsx              # Main component
├── ComponentName.test.tsx # Tests
├── hooks.ts               # Component-specific hooks
├── utils.ts               # Helper functions
└── types.ts               # Component types
```

### Route File Structure
```
pages/
├── index.tsx              # / (TENET Portal)
├── [game]/
│   ├── index.tsx          # /valorant, /cs2
│   ├── stats/
│   │   ├── index.tsx      # /valorant/stats
│   │   ├── players.tsx    # /valorant/stats/players
│   │   └── teams.tsx      # /valorant/stats/teams
│   ├── pro/
│   └── community/
```

---

## Commit Convention

```
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance

Scopes:
- rotas, sator, opera, arepo, tenet, shared

Example:
feat(rotas): Add player comparison tool
```

---

*Reference: CLAUDE.md for complete code conventions*
