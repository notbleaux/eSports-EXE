[Ver001.000]

# Phase 3-6 Comprehensive Implementation Plan

**Date:** 2026-03-27
**Authority:** `MASTER_PLAN.md` (Phases 3–6)
**Scope:** Frontend correction → Data pipeline → Ecosystem expansion → Advanced operations
**Total Duration:** ~60 hours (Phases 3-6 combined)

---

## Executive Summary

Phase 3-6 constructs the complete NJZ eSports platform with a modern, scalable architecture. This plan documents detailed implementation strategies, sub-agent assignments, and specific code deliverables for each phase.

**Key Improvements over Previous Planning:**
1. **Modular Sub-Agent Teams:** Each phase has dedicated specialists with nested sub-agent support
2. **Clear Dependency Management:** Phases are sequenced to maximize parallelization
3. **Architectural Consistency:** All phases follow TENET topology and lambda architecture patterns
4. **Monorepo Optimization:** Strategic use of workspaces, dependencies, and shared packages
5. **Testing Integration:** Every phase includes unit, integration, E2E, and load testing

---

# PHASE 3: Frontend Architecture Correction

**Duration:** ~15 hours (can start after Phase 1, proceeds in parallel with Phase 2)
**Owner:** Frontend Specialist Agent
**Blocks:** Phase 4 gate unlock (requires Phase 2 + 3 both complete)
**Depends On:** Phase 1 schemas complete

## 3.0 Objectives

Correct the conceptual misclassification of `hub-5-tenet` from "5th content hub" to "TeNET navigation layer." Implement proper hierarchical routing, GameNodeID display framework, and Quarter GRID component system.

**Success Criteria:**
- ✅ `/` → TeNeT Portal (entry)
- ✅ `/hubs` → TeNET Directory (game selector)
- ✅ `/valorant`, `/cs2` → World-Ports (game entry)
- ✅ `/valorant/analytics`, `/valorant/community`, etc. → Quarter hub routes
- ✅ GameNodeIDFrame renders 2×2 Quarter GRID with proper styling
- ✅ No "TENET Hub" labels remaining in UI
- ✅ E2E navigation tests pass (40 tests from Phase 1)
- ✅ TypeScript strict mode passes

---

## 3.1 Phase 3.0: Navigation Architecture Refactor

### Task 3.1.1: Create TeNeT Portal Component

**File:** `apps/web/src/hub-5-tenet/pages/TeNetPortal.tsx`

**Requirements:**
- Landing page entry point
- Hero section with TENET branding + description
- Call-to-action button → `/hubs` (Navigate to TeNET Directory)
- Authentication check (if user not authenticated, show login prompt)
- Responsive design (mobile, tablet, desktop)
- Accessibility: WCAG 2.1 AA compliance

**Implementation Details:**
```typescript
// Components to create:
- TeNetHero: Main hero section with animation
- TeNetValueProposition: Three-column layout (Network, Analytics, Security)
- TeNetAuthPrompt: Login/register buttons
- TeNetFooter: Links to docs, help, about

// State management:
- useAuthStore() → Check if user is authenticated
- useNavigationStore() → Track navigation history

// Styling:
- Use Tailwind CSS with custom TENET color scheme
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)
- Dark mode support via theme toggle
```

**Verification:**
- Component renders without errors
- Hero text visible with proper typography
- "Enter Platform" button routes to `/hubs`
- Mobile responsive (<640px width)

**Sub-Task Assignment:**
- **Specialist A1** (UI Component Builder): Create hero and value proposition components
- **Specialist A2** (Auth Integration): Integrate authentication check and prompts

---

### Task 3.1.2: Create TeNET Directory Component

**File:** `apps/web/src/hub-5-tenet/pages/TeNetDirectory.tsx`

**Requirements:**
- Game world selector interface
- Display all available World-Ports (Valorant, CS2, future games)
- Game cards show: name, icon, player count, last update
- Click game card → navigate to World-Port (`/valorant`, `/cs2`, etc.)
- Search/filter games (optional, future-proof structure)
- Show "Coming Soon" for unreleased games

**Implementation Details:**
```typescript
// Types
interface WorldPort {
  id: string;           // 'valorant', 'cs2'
  name: string;         // 'VALORANT', 'Counter-Strike 2'
  icon: string;         // URL or asset path
  playerCount: number;
  lastUpdate: Date;
  status: 'active' | 'coming-soon' | 'maintenance';
}

// Component structure:
- TeNetDirectoryHeader: Title + search bar
- WorldPortGrid: 2-column grid of game cards (responsive to 1 column mobile)
- WorldPortCard: Individual game card with click handler
  - Card elevation on hover
  - Animated transition on click
  - Skeleton loading while fetching game data

// Data fetching:
- GET /v1/world-ports → List all available games
- GET /v1/world-ports/{gameId}/stats → Player count, last update
```

**Verification:**
- Directory renders all World-Ports correctly
- Clicking Valorant card navigates to `/valorant`
- Clicking CS2 card navigates to `/cs2`
- Mobile: Cards stack to 1 column
- Keyboard accessible (Tab navigation, Enter to select)

**Sub-Task Assignment:**
- **Specialist A1**: Build WorldPortCard component and grid layout
- **Specialist A3** (Backend Integration): Fetch world-port data from API

---

### Task 3.1.3: Create GameNodeIDFrame Component (2×2 Quarter GRID)

**File:** `apps/web/src/hub-5-tenet/components/GameNodeIDFrame.tsx`

**Requirements:**
- Renders the 2×2 Quarter GRID for any game
- Grid layout: SATOR (top-left), AREPO (top-right), OPERA (bottom-left), ROTAS (bottom-right)
- Each quarter is clickable → navigates to that quarter's route
- Animated transitions between quarters
- Responsive design (scales down to 1 column on mobile)
- Displays game context (e.g., "Valorant GameNodeID")

**Implementation Details:**
```typescript
// Types
interface Quarter {
  id: 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';
  name: string;
  description: string;
  icon: ReactNode;
  route: string;      // e.g., '/valorant/analytics'
  color: string;      // Tailwind color class
}

// Component structure:
- GameNodeIDFrame
  - Renders 2×2 grid using CSS Grid
  - Each QuarterCard component represents one quarter
  - QuarterCard
    - Displays quarter name, description, icon
    - Shows number of available TeZeT branches (sub-hubs)
    - Animated on hover (lift effect, color change)
    - Click handler → navigates to quarter route

// Layout:
- Grid: 2 columns x 2 rows (gap: 1rem)
- Mobile breakpoint (< 768px): Stacks to 1 column
- Tablet (768px - 1024px): Optional 2 columns with smaller gaps
- Desktop (> 1024px): Full 2×2 grid

// Styling:
- Gradient backgrounds for each quarter (SATOR: blue, AREPO: green, OPERA: purple, ROTAS: orange)
- Border radius: 8-12px per quarter
- Shadow on card (elevation effect)
- Transition: 300ms ease-out on hover

// Accessibility:
- ARIA labels for each quarter
- Keyboard navigation: Tab to select, Enter/Space to activate
- Focus indicators visible (ring style)
```

**Verification:**
- 2×2 grid renders correctly on desktop
- Clicking each quarter navigates to correct route
- Mobile: 1 column layout, scrollable
- Keyboard navigation works
- ARIA attributes present and correct

**Sub-Task Assignment:**
- **Specialist A1** (Designer): Design Quarter GRID layout and color scheme
- **Specialist A2** (Component Developer): Implement GameNodeIDFrame and QuarterCard components
- **Specialist A4** (Accessibility): Add ARIA labels and keyboard navigation

---

### Task 3.1.4: Create TeZeT Branch Selector Component

**File:** `apps/web/src/hub-5-tenet/components/TeZeTBranchSelector.tsx`

**Requirements:**
- Displays available TeZeT branches (sub-hubs) within a Quarter
- Example: For SATOR/Valorant, show branches: `/analytics`, `/simrating`, `/predictions`
- Branch selector breadcrumb or sidebar
- Shows current branch highlighted
- Switch between branches without losing state (use React Router navigation)

**Implementation Details:**
```typescript
// Types
interface TeZeTBranch {
  id: string;           // 'analytics', 'simrating', 'predictions'
  label: string;        // 'Analytics', 'SimRating', 'Predictions'
  route: string;        // '/valorant/analytics'
  icon: ReactNode;
  description?: string;
}

// Component structure:
- TeZeTBranchSelector
  - Breadcrumb trail: Game > Quarter > [Current Branch]
  - TabBar or SideNav showing available branches
  - Current branch highlighted with underline or background
  - Click branch → navigate to that branch route
  - Smooth transition animation

// Data:
- Define branches per quarter in constant or fetch from API
- Branches: SATOR → [analytics, simrating, predictions], etc.
```

**Verification:**
- All branches render for current quarter
- Current branch clearly indicated
- Clicking branch navigates correctly
- Breadcrumb updates when navigating

**Sub-Task Assignment:**
- **Specialist A2**: Implement TeZeTBranchSelector component

---

## 3.2 Phase 3.1: Routing Architecture Update

### Task 3.2.1: Update App.tsx Root Routes

**File:** `apps/web/src/App.tsx`

**Changes Required:**
```typescript
// Old structure:
// / → HomePage
// /hubs → hub-5-tenet/HubPage
// /analytics → hub-1-sator/
// /stats → hub-2-rotas/

// New structure:
// / → TeNetPortal (entry)
// /hubs → TeNETDirectory (game selector)
// /valorant → WorldPortPage (Valorant entry, shows GameNodeIDFrame)
// /valorant/analytics → SATOR hub (within Valorant context)
// /valorant/community → AREPO hub
// /valorant/pro-scene → OPERA hub
// /valorant/stats → ROTAS hub
// /cs2 → WorldPortPage (CS2 entry, shows GameNodeIDFrame)
// /cs2/analytics → SATOR hub (within CS2 context)
// ... (repeat for all quarters × all games)
```

**Implementation:**
```typescript
// Create reusable route configuration
const worldPortRoutes = (gameId: string) => [
  {
    path: `/${gameId}`,
    element: <WorldPortPage gameId={gameId} />,
  },
  {
    path: `/${gameId}/analytics`,
    element: <SATORHub gameId={gameId} />,
  },
  {
    path: `/${gameId}/community`,
    element: <AREPOHub gameId={gameId} />,
  },
  {
    path: `/${gameId}/pro-scene`,
    element: <OPERAHub gameId={gameId} />,
  },
  {
    path: `/${gameId}/stats`,
    element: <ROTASHub gameId={gameId} />,
  },
];

// Root routes
const routes = [
  { path: '/', element: <TeNetPortal /> },
  { path: '/hubs', element: <TeNETDirectory /> },
  ...worldPortRoutes('valorant'),
  ...worldPortRoutes('cs2'),
  // Add more games as they're added
];
```

**Verification:**
- All routes render correct components
- Navigation between routes works
- Game context passed to hub components
- Breadcrumb updates correctly

**Sub-Task Assignment:**
- **Specialist A5** (Router Specialist): Update routing configuration and test all routes

---

### Task 3.2.2: Create WorldPortPage Component

**File:** `apps/web/src/hub-5-tenet/pages/WorldPortPage.tsx`

**Requirements:**
- Entry point for each game (Valorant, CS2, etc.)
- Displays GameNodeIDFrame with quarters for this game
- Passes game context (gameId, gameName) to all child components
- Shows game-specific header/branding
- Integrates TeZeTBranchSelector when user navigates to a quarter

**Implementation:**
```typescript
interface WorldPortPageProps {
  gameId: string;  // 'valorant', 'cs2'
}

export function WorldPortPage({ gameId }: WorldPortPageProps) {
  const game = useGameData(gameId);

  return (
    <div className="world-port-page">
      <GameHeader game={game} />
      <GameNodeIDFrame gameId={gameId} />
      <Outlet /> {/* Renders quarter-specific content */}
    </div>
  );
}
```

**Verification:**
- Game header displays correct game name/icon
- GameNodeIDFrame renders with correct quarters
- Clicking quarters navigates to correct routes
- Game context available to child components

**Sub-Task Assignment:**
- **Specialist A2**: Implement WorldPortPage component

---

## 3.3 Phase 3.2: Create @njz/ui Shared Component Package

**Duration:** ~4 hours

### Task 3.3.1: Create @njz/ui Package Structure

**Directory:** `packages/@njz/ui/`

**Files to Create:**
```
packages/@njz/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main export barrel
│   ├── components/
│   │   ├── QuarterGrid/
│   │   │   ├── QuarterGrid.tsx
│   │   │   ├── QuarterGrid.test.tsx
│   │   │   └── QuarterGrid.stories.tsx
│   │   ├── WorldPortCard/
│   │   ├── GameNodeBadge/
│   │   ├── TeZeTBreadcrumb/
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useGameContext.ts
│   │   ├── useWorldPortNavigation.ts
│   │   └── index.ts
│   └── styles/
│       ├── theme.ts
│       ├── colors.ts
│       └── typography.ts
└── README.md
```

**Package.json Configuration:**
```json
{
  "name": "@njz/ui",
  "version": "1.0.0",
  "description": "Shared React UI component library for NJZ eSports",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components": "./dist/components/index.js"
  },
  "dependencies": {
    "@njz/types": "workspace:*",
    "react": "^18.0.0",
    "tailwindcss": "^3.0.0"
  },
  "devDependencies": {
    "@storybook/react": "^7.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Verification:**
- Package structure created
- package.json valid
- tsconfig.json configured
- Can be imported as `@njz/ui` from other packages

**Sub-Task Assignment:**
- **Specialist A6** (Package Manager): Create package structure and configuration

---

### Task 3.3.2: Implement QuarterGrid Component

**File:** `packages/@njz/ui/src/components/QuarterGrid/QuarterGrid.tsx`

**Requirements:**
- Reusable 2×2 grid component
- Configurable colors, labels, descriptions per quarter
- TypeScript-typed props
- Storybook stories for each layout variant

**Implementation:**
```typescript
import { FC } from 'react';

export interface QuarterDefinition {
  id: string;
  label: string;
  description: string;
  icon?: ReactNode;
  color: string;        // Tailwind color class
  onClick?: () => void;
}

export interface QuarterGridProps {
  quarters: [QuarterDefinition, QuarterDefinition, QuarterDefinition, QuarterDefinition];
  gameId?: string;
  responsive?: boolean; // Default: true
  onQuarterSelect?: (quarter: QuarterDefinition) => void;
}

export const QuarterGrid: FC<QuarterGridProps> = ({
  quarters,
  gameId,
  responsive = true,
  onQuarterSelect,
}) => {
  return (
    <div className={`quarter-grid ${responsive ? 'responsive' : ''}`}>
      {quarters.map((quarter) => (
        <QuarterCard
          key={quarter.id}
          quarter={quarter}
          onClick={() => onQuarterSelect?.(quarter)}
        />
      ))}
    </div>
  );
};

// QuarterCard component
const QuarterCard: FC<{ quarter: QuarterDefinition; onClick?: () => void }> = ({
  quarter,
  onClick,
}) => {
  return (
    <div
      className={`quarter-card bg-${quarter.color}-50 border border-${quarter.color}-200`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {quarter.icon && <div className="quarter-icon">{quarter.icon}</div>}
      <h3 className="quarter-label">{quarter.label}</h3>
      <p className="quarter-description">{quarter.description}</p>
    </div>
  );
};
```

**Styling (Tailwind CSS):**
```css
.quarter-grid {
  @apply grid grid-cols-2 gap-4;
}

.quarter-grid.responsive {
  @apply md:grid-cols-2;
}

@media (max-width: 640px) {
  .quarter-grid.responsive {
    @apply grid-cols-1;
  }
}

.quarter-card {
  @apply p-6 rounded-lg cursor-pointer transition-all duration-300;
}

.quarter-card:hover {
  @apply shadow-lg scale-105;
}

.quarter-card:focus {
  @apply ring-2 ring-offset-2;
}
```

**Verification:**
- Component renders 2×2 grid on desktop
- Responsive: 1 column on mobile
- Keyboard navigation works (Tab, Enter)
- Click handler called when clicking card

**Sub-Task Assignment:**
- **Specialist A1**: Implement QuarterGrid and QuarterCard components
- **Specialist A4**: Add accessibility attributes and keyboard navigation

---

### Task 3.3.3: Implement WorldPortCard Component

**File:** `packages/@njz/ui/src/components/WorldPortCard/WorldPortCard.tsx`

**Requirements:**
- Reusable card for displaying a game/world-port
- Shows game icon, name, status (active/coming-soon)
- Optional player count and last update info
- Animated hover state

**Implementation:**
```typescript
export interface WorldPortCardProps {
  id: string;
  name: string;
  icon: string | ReactNode;
  status: 'active' | 'coming-soon' | 'maintenance';
  playerCount?: number;
  lastUpdate?: Date;
  onClick?: () => void;
}

export const WorldPortCard: FC<WorldPortCardProps> = ({
  id,
  name,
  icon,
  status,
  playerCount,
  lastUpdate,
  onClick,
}) => {
  const statusColor = {
    active: 'bg-green-500',
    'coming-soon': 'bg-yellow-500',
    maintenance: 'bg-red-500',
  }[status];

  return (
    <div
      className="world-port-card cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="icon-container">{icon}</div>
      <h3 className="text-lg font-bold">{name}</h3>
      <div className={`status-badge ${statusColor}`}>{status}</div>
      {playerCount && <p className="text-sm text-gray-600">{playerCount} players</p>}
      {lastUpdate && <p className="text-xs text-gray-400">{lastUpdate.toLocaleDateString()}</p>}
    </div>
  );
};
```

**Verification:**
- Card renders icon, name, status
- Status color correct
- Optional fields displayed when provided
- Clickable and keyboard accessible

**Sub-Task Assignment:**
- **Specialist A1**: Implement WorldPortCard component

---

### Task 3.3.4: Create Storybook Stories

**File:** `packages/@njz/ui/src/components/QuarterGrid/QuarterGrid.stories.tsx`

**Requirements:**
- Storybook stories for all component variants
- Interactive controls for testing
- Accessibility testing

**Example:**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { QuarterGrid } from './QuarterGrid';

const meta: Meta<typeof QuarterGrid> = {
  component: QuarterGrid,
  title: 'Components/QuarterGrid',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    quarters: [
      {
        id: 'SATOR',
        label: 'SATOR',
        description: 'Advanced Analytics',
        color: 'blue',
      },
      {
        id: 'AREPO',
        label: 'AREPO',
        description: 'Community',
        color: 'green',
      },
      {
        id: 'OPERA',
        label: 'OPERA',
        description: 'Pro eSports',
        color: 'purple',
      },
      {
        id: 'ROTAS',
        label: 'ROTAS',
        description: 'Stats Reference',
        color: 'orange',
      },
    ],
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
```

**Verification:**
- Storybook runs without errors
- All stories render correctly
- Can interact with controls

**Sub-Task Assignment:**
- **Specialist A2**: Create Storybook stories

---

## 3.4 Phase 3.3: Cleanup & Verification

### Task 3.4.1: Remove TENET Hub References

**Search & Replace:**
```bash
grep -r "TENET Hub" apps/web/src/
grep -r "tenet hub" apps/web/src/ -i
grep -r "fifth hub" apps/web/src/ -i
grep -r "fifth content" apps/web/src/ -i
```

**Files to Update:**
- Nav components (header, sidebar, breadcrumbs)
- Route labels and descriptions
- Documentation strings
- Component comments

**Verification:**
```bash
# Should return 0 results
grep -r "TENET Hub" apps/web/src/
```

**Sub-Task Assignment:**
- **Specialist A5**: Search and replace all references

---

### Task 3.4.2: Run TypeScript Type Check

**Command:**
```bash
pnpm typecheck
```

**Expected Result:**
- 0 errors
- 0 warnings

**If Errors Occur:**
- Fix type issues in components
- Ensure all imports are correct
- Verify @njz/ui and @njz/types exports

**Verification:**
- pnpm typecheck exits with code 0

**Sub-Task Assignment:**
- **Specialist A5**: Fix any type errors

---

### Task 3.4.3: Run E2E Navigation Tests

**Command:**
```bash
npx playwright test tests/e2e/navigation.spec.ts
```

**Expected Results:**
- 40 tests pass
- 0 failures
- All navigation flows work (portal → directory → world-port → hubs)

**Tests Should Verify:**
- TeNeT Portal loads correctly
- Enter Platform button navigates to /hubs
- TeNET Directory displays Valorant and CS2 cards
- Clicking game card navigates to world-port
- GameNodeIDFrame renders 2×2 grid
- Clicking quarters navigates to correct routes
- Mobile responsive behavior
- Keyboard accessibility

**Verification:**
- `npx playwright test tests/e2e/navigation.spec.ts` exits with code 0

**Sub-Task Assignment:**
- **Specialist A4**: Run tests and fix any failures

---

## 3.5 Phase 3 Completion Verification

**All Gates Must Pass:**

| Gate | Criteria | Verification |
|------|----------|--------------|
| 3.1 | `/hubs` renders TeNET directory | `curl http://localhost:5173/hubs` + visual check |
| 3.2 | World-Port routes resolve | E2E test: navigate to `/valorant`, `/cs2` |
| 3.3 | Hub URLs include game context | E2E test: `/valorant/analytics` renders SATOR hub |
| 3.4 | No "TENET Hub" labels remain | `grep -r "TENET Hub" apps/web/src/` returns 0 |
| 3.5 | GameNodeIDFrame renders 2×2 grid | E2E test + visual inspection |
| 3.6 | TypeScript strict mode passes | `pnpm typecheck` exits with code 0 |

**Gate Status:** Phase 3 ✅ PASSED → Phase 4 now ✅ UNLOCKED (combined with Phase 2 complete)

---

### Sub-Agent Team Assignments

| Role | Specialist | Tasks |
|------|-----------|-------|
| **UI Components** | Specialist A1 | QuarterCard, QuarterGrid, WorldPortCard, layout/styling |
| **Nav Components** | Specialist A2 | TeNetPortal, TeNETDirectory, WorldPortPage, TeZeTBranchSelector |
| **Backend Integration** | Specialist A3 | Fetch world-port data, game context, state management |
| **Accessibility** | Specialist A4 | ARIA labels, keyboard nav, focus management, E2E testing |
| **Router & Routes** | Specialist A5 | Update App.tsx, route configuration, cleanup references |
| **Package Manager** | Specialist A6 | Create @njz/ui package, workspace configuration |

**Execution Model:**
- Phase 3.0 (Navigation): All 6 specialists work in parallel
- Phase 3.1 (Routing): Specialist A5 leads, others provide components
- Phase 3.2 (@njz/ui Package): Specialists A1, A2, A4, A6 work in parallel
- Phase 3.3 (Cleanup): Specialists A4, A5 validate

**Timeline:**
- Phase 3.0: 6 hours (parallel)
- Phase 3.1: 2 hours (sequential after 3.0)
- Phase 3.2: 4 hours (parallel)
- Phase 3.3: 3 hours (cleanup and verification)
- **Total Phase 3: 15 hours**

---

# PHASE 4: Data Pipeline Lambda Architecture

**Duration:** ~20 hours
**Owner:** Data Pipeline Specialist Agent
**Blocks:** Phase 5 gate unlock
**Depends On:** Phase 2 (services complete) + Phase 3 (frontend complete)

## 4.0 Objectives

Implement complete end-to-end data pipelines for both Path A (live) and Path B (legacy) with proper confidence scoring, review queue management, and high-performance API endpoints.

**Success Criteria:**
- ✅ Path A pipeline: Pandascore → Redis → WebSocket → Frontend (<500ms latency)
- ✅ Path B pipeline: All sources → TeneT verification → PostgreSQL → Analytics
- ✅ API endpoints: `/v1/live/` and `/v1/history/` respond with confidence scores
- ✅ Admin panel: TeneT review queue accessible and functional
- ✅ Integration tests: All pipelines pass end-to-end tests
- ✅ Load tests: Services handle 1000+ concurrent requests
- ✅ Latency: Live updates <500ms, history queries <1000ms

---

## 4.1 Phase 4.0: Path A (Live) Pipeline Implementation

### Task 4.1.1: Pandascore Webhook Integration

**File:** `packages/shared/api/src/webhooks/pandascore.py`

**Requirements:**
- Receive Pandascore webhook events
- Parse and normalize match score updates
- Route to Redis Streams
- Handle retries and failures
- Rate limiting and authentication

**Implementation:**
```python
from fastapi import APIRouter, Request, Header, HTTPException
from typing import Optional
import hashlib
import hmac
import json
from datetime import datetime

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

class PandascoreWebhook:
    def __init__(self, secret: str):
        self.secret = secret

    def verify_signature(self, body: bytes, signature: str) -> bool:
        """Verify webhook signature from Pandascore"""
        expected = hmac.new(
            self.secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected)

    async def handle_match_score_update(self, event: dict, match_id: str):
        """
        Handle match score update event
        Normalize from Pandascore format to WsScoreUpdateMessage format
        """
        normalized = {
            "matchId": match_id,
            "type": "SCORE_UPDATE",
            "payload": {
                "teamA": event["score"]["team_1"],
                "teamB": event["score"]["team_2"],
                "round": event.get("round_number", 0),
                "timestamp": datetime.utcnow().isoformat()
            },
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "source": "pandascore_webhook"
        }

        # Route to Redis Stream
        await redis_client.xadd(
            f"match:{match_id}:events",
            {"payload": json.dumps(normalized)}
        )

@router.post("/pandascore/match-update")
async def pandascore_match_update(
    request: Request,
    x_signature: Optional[str] = Header(None),
):
    """
    Receive Pandascore webhook for match score updates

    Expected payload:
    {
        "match_id": "123456",
        "score": {"team_1": 2, "team_2": 1},
        "round_number": 5,
        "event_type": "SCORE_UPDATE",
        "timestamp": "2026-03-27T10:30:00Z"
    }
    """
    body = await request.body()

    # Verify signature
    if not webhook_handler.verify_signature(body, x_signature or ""):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = json.loads(body)
    match_id = event.get("match_id")

    if not match_id:
        raise HTTPException(status_code=400, detail="Missing match_id")

    # Handle the update
    await webhook_handler.handle_match_score_update(event, match_id)

    return {"status": "received", "match_id": match_id}
```

**Verification:**
- Webhook endpoint accepts POST requests
- Signature verification works
- Events routed to Redis Streams
- Error handling returns proper status codes (400, 401, 500)

**Sub-Task Assignment:**
- **Specialist D1** (Backend): Implement webhook handler and signature verification
- **Specialist D2** (Event Processing): Implement event normalization and Redis routing

---

### Task 4.1.2: WebSocket Broadcast Service Enhancement

**File:** `services/websocket/main.py` (enhance existing from Phase 2)

**Enhancements Required:**
- Connection tracking per match
- Broadcast efficiency (group by match_id)
- Message ordering guarantees
- Connection cleanup on disconnect
- Metrics/monitoring

**Implementation Additions:**
```python
class MatchConnectionManager:
    def __init__(self):
        # match_id -> set of connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_metadata: Dict[WebSocket, dict] = {}

    async def connect(self, match_id: str, websocket: WebSocket):
        """Register connection to match"""
        await websocket.accept()

        if match_id not in self.active_connections:
            self.active_connections[match_id] = set()

        self.active_connections[match_id].add(websocket)
        self.connection_metadata[websocket] = {
            "match_id": match_id,
            "connected_at": datetime.utcnow(),
            "message_count": 0
        }

    async def broadcast_to_match(self, match_id: str, message: dict):
        """Broadcast message to all connections for a match"""
        if match_id not in self.active_connections:
            return

        # Create message envelope
        envelope = {
            "type": message.get("type"),
            "matchId": match_id,
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
            "payload": message.get("payload")
        }

        disconnected = []
        for websocket in self.active_connections[match_id]:
            try:
                await websocket.send_json(envelope)
                self.connection_metadata[websocket]["message_count"] += 1
            except Exception as e:
                logger.error(f"Failed to broadcast: {e}")
                disconnected.append(websocket)

        # Cleanup disconnected
        for ws in disconnected:
            await self.disconnect(match_id, ws)

    async def disconnect(self, match_id: str, websocket: WebSocket):
        """Remove connection"""
        if match_id in self.active_connections:
            self.active_connections[match_id].discard(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]

        self.connection_metadata.pop(websocket, None)

manager = MatchConnectionManager()

@app.websocket("/ws/matches/{match_id}")
async def websocket_endpoint(websocket: WebSocket, match_id: str):
    await manager.connect(match_id, websocket)

    try:
        while True:
            # Receive from client (echo, heartbeat, etc.)
            data = await websocket.receive_text()
            # Handle client messages...
    except WebSocketDisconnect:
        await manager.disconnect(match_id, websocket)
```

**Verification:**
- WebSocket connections established
- Messages broadcast to all clients in match
- Disconnected clients removed properly
- No memory leaks (connections cleaned up)

**Sub-Task Assignment:**
- **Specialist D3** (WebSocket Specialist): Enhance MatchConnectionManager and broadcast logic
- **Specialist D2**: Integration with Redis consumer

---

### Task 4.1.3: Live Data API Endpoints

**File:** `packages/shared/api/src/routers/live.py`

**Endpoints Required:**

```python
from fastapi import APIRouter, WebSocket, Path
from typing import List

router = APIRouter(prefix="/v1/live", tags=["live-data"])

@router.get("/matches")
async def get_live_matches(
    game: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100)
) -> List[LiveMatchView]:
    """
    Get all currently live matches

    Query Parameters:
    - game: Filter by game (valorant, cs2)
    - limit: Max results (default 20, max 100)

    Response: [LiveMatchView]
    """
    query = redis_client.hgetall("live:matches")
    matches = [LiveMatchView.model_validate_json(m) for m in query.values()]

    if game:
        matches = [m for m in matches if m.game == game]

    return matches[:limit]

@router.get("/matches/{match_id}")
async def get_live_match(
    match_id: str = Path(...)
) -> LiveMatchView:
    """
    Get details of a specific live match

    Response: LiveMatchView
    """
    match_data = await redis_client.hget("live:matches", match_id)
    if not match_data:
        raise HTTPException(status_code=404, detail="Match not found")

    return LiveMatchView.model_validate_json(match_data)

@router.get("/matches/{match_id}/events")
async def get_match_events(
    match_id: str = Path(...),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
) -> List[dict]:
    """
    Get recent events for a match (from Redis Stream)

    Response: List of events (SCORE_UPDATE, ROUND_END, PLAYER_UPDATE, etc.)
    """
    events = await redis_client.xrevrange(
        f"match:{match_id}:events",
        count=limit,
        offset=offset
    )

    return [json.loads(e[1]["payload"]) for e in events]

@router.websocket("/ws/matches/{match_id}")
async def websocket_live_match(
    websocket: WebSocket,
    match_id: str = Path(...)
):
    """
    WebSocket connection to receive live match updates

    Message Types Received:
    - SCORE_UPDATE: Score change
    - ROUND_END: Round completed
    - PLAYER_STATS_UPDATE: Player stat change
    - MATCH_END: Match completed
    - HEARTBEAT: Server heartbeat (every 30s)

    Client can send:
    - {"type": "ping"} → Server responds with {"type": "pong"}
    """
    await manager.connect(match_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            # Handle client message (ping, etc.)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await manager.disconnect(match_id, websocket)
```

**Verification:**
- GET /v1/live/matches returns list of live matches
- GET /v1/live/matches/{match_id} returns specific match
- GET /v1/live/matches/{match_id}/events returns event history
- WebSocket endpoint connects and broadcasts updates

**Sub-Task Assignment:**
- **Specialist D4** (API Development): Implement all endpoints and serialization

---

## 4.2 Phase 4.1: Path B (Legacy) Pipeline Implementation

### Task 4.2.1: History Data API Endpoints

**File:** `packages/shared/api/src/routers/history.py`

**Endpoints Required:**

```python
from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter(prefix="/v1/history", tags=["history-data"])

@router.get("/matches")
async def get_match_history(
    game: Optional[str] = Query(None),
    tournament_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    include_confidence: bool = Query(False)
) -> List[VerifiedMatchSummary]:
    """
    Get historical match data with optional confidence scores

    Query Parameters:
    - game: Filter by game (valorant, cs2)
    - tournament_id: Filter by tournament
    - limit: Results per page (default 50, max 500)
    - offset: Pagination offset
    - include_confidence: Include confidence breakdown (more data)

    Response: [VerifiedMatchSummary]
    """
    query = db.query(VerificationRecord).filter(
        VerificationRecord.status == VerificationStatus.ACCEPTED
    )

    if game:
        query = query.filter(VerificationRecord.game == game)

    if tournament_id:
        query = query.filter(VerificationRecord.tournament_id == tournament_id)

    # Pagination
    matches = query.offset(offset).limit(limit).all()

    return [
        VerifiedMatchSummary(
            **m.to_dict(include_confidence=include_confidence)
        )
        for m in matches
    ]

@router.get("/matches/{match_id}")
async def get_match_detail(
    match_id: str,
    include_rounds: bool = Query(True),
    include_economy: bool = Query(True),
    include_confidence: bool = Query(False)
) -> VerifiedMatchDetail:
    """
    Get comprehensive match details with per-round granularity

    Response: VerifiedMatchDetail (includes rounds, economy, player stats, etc.)
    """
    match = db.query(VerificationRecord).filter_by(entity_id=match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    return VerifiedMatchDetail(
        **match.to_dict(
            include_rounds=include_rounds,
            include_economy=include_economy,
            include_confidence=include_confidence
        )
    )

@router.get("/players/{player_id}/stats")
async def get_player_stats(
    player_id: str,
    season: Optional[str] = Query(None),
    tournament_id: Optional[str] = Query(None)
) -> PlayerSeasonStats:
    """
    Get aggregated player statistics

    Response: PlayerSeasonStats (KDA, win rate, playtime, etc.)
    """
    stats = db.query(PlayerStats).filter_by(player_id=player_id)

    if season:
        stats = stats.filter_by(season=season)

    if tournament_id:
        stats = stats.filter_by(tournament_id=tournament_id)

    return stats.first() or PlayerSeasonStats(player_id=player_id)

@router.get("/teams/{team_id}/history")
async def get_team_history(
    team_id: str,
    limit: int = Query(50)
) -> List[TournamentRecord]:
    """
    Get team's tournament history and results

    Response: [TournamentRecord]
    """
    records = db.query(TournamentRecord).filter_by(team_id=team_id).limit(limit).all()
    return records
```

**Verification:**
- GET /v1/history/matches returns verified matches
- GET /v1/history/matches/{match_id} returns match details
- GET /v1/history/players/{player_id}/stats returns player stats
- GET /v1/history/teams/{team_id}/history returns team history
- Confidence scores optional and included when requested

**Sub-Task Assignment:**
- **Specialist D4**: Implement history endpoints

---

### Task 4.2.2: TeneT Review Queue Integration

**File:** `packages/shared/api/src/routers/admin/review_queue.py`

**Endpoints Required:**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from auth import require_admin

router = APIRouter(
    prefix="/v1/admin/review-queue",
    tags=["admin-review"],
    dependencies=[Depends(require_admin)]
)

@router.get("/")
async def get_review_queue(
    status: Optional[str] = Query(None),  # PENDING, REVIEWING, ACCEPTED, REJECTED
    priority: Optional[str] = Query(None),  # HIGH, MEDIUM, LOW
    limit: int = Query(50),
    offset: int = Query(0)
) -> List[ReviewQueueItem]:
    """
    Get items pending manual review

    Response: [ReviewQueueItem]
    """
    query = db.query(ReviewQueue)

    if status:
        query = query.filter_by(status=status)

    if priority:
        query = query.filter_by(priority=priority)

    items = query.order_by(ReviewQueue.flagged_at.desc()).offset(offset).limit(limit).all()
    return items

@router.post("/{entity_id}/review")
async def submit_review(
    entity_id: str,
    review: ManualReviewSubmission,
    current_user = Depends(get_current_user)
) -> VerificationResult:
    """
    Submit manual review decision for a flagged entity

    Request: ManualReviewSubmission
    Response: Updated VerificationResult
    """
    # Get the flagged item
    queue_item = db.query(ReviewQueue).filter_by(entity_id=entity_id).first()
    if not queue_item:
        raise HTTPException(status_code=404, detail="Item not in review queue")

    # Update review decision
    queue_item.status = "REVIEWED"
    queue_item.review_decision = review.decision
    queue_item.review_notes = review.notes
    queue_item.reviewer_id = current_user.id
    queue_item.reviewed_at = datetime.utcnow()

    # Update verification record
    verification = db.query(VerificationRecord).filter_by(entity_id=entity_id).first()
    if review.decision == "ACCEPT":
        verification.status = VerificationStatus.MANUAL_OVERRIDE
    elif review.decision == "REJECT":
        verification.status = VerificationStatus.REJECTED

    db.commit()

    return VerificationResult.from_orm(verification)

@router.get("/{entity_id}")
async def get_review_item(entity_id: str) -> ReviewQueueItem:
    """
    Get details of a specific review item

    Response: ReviewQueueItem with full context
    """
    item = db.query(ReviewQueue).filter_by(entity_id=entity_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item
```

**Verification:**
- GET /v1/admin/review-queue returns items pending review
- POST /v1/admin/review-queue/{entity_id}/review submits decision
- GET /v1/admin/review-queue/{entity_id} returns item details
- Review updates verification record correctly

**Sub-Task Assignment:**
- **Specialist D4**: Implement review queue endpoints
- **Specialist D5** (Auth Specialist): Implement admin authentication and authorization

---

## 4.3 Phase 4.2: Frontend Integration of Pipelines

### Task 4.3.1: LiveMatchState Hook and Component

**File:** `apps/web/src/hooks/useLiveMatch.ts`

**Implementation:**
```typescript
import { useEffect, useState } from 'react';
import { LiveMatchView } from '@njz/types';

export function useLiveMatch(matchId: string) {
  const [match, setMatch] = useState<LiveMatchView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    setLoading(true);

    // Establish WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/v1/live/ws/matches/${matchId}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`Connected to live match ${matchId}`);
      setWs(socket);
      setLoading(false);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'MATCH_START') {
        setMatch(message.payload);
      } else if (message.type === 'SCORE_UPDATE') {
        setMatch(prev => ({
          ...prev,
          teams: prev.teams.map(t => ({
            ...t,
            score: t.id === message.payload.teamA.id
              ? message.payload.teamA.score
              : message.payload.teamB.score
          })),
          lastUpdated: message.timestamp
        }));
      } else if (message.type === 'ROUND_END') {
        setMatch(prev => ({
          ...prev,
          currentRound: message.payload.roundNumber + 1,
          lastUpdated: message.timestamp
        }));
      } else if (message.type === 'MATCH_END') {
        setMatch(prev => ({
          ...prev,
          status: 'completed',
          lastUpdated: message.timestamp
        }));
      }
    };

    socket.onerror = (event) => {
      setError('Failed to connect to live match');
      setLoading(false);
    };

    socket.onclose = () => {
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, [matchId]);

  const sendHeartbeat = () => {
    ws?.send(JSON.stringify({ type: 'ping' }));
  };

  return { match, loading, error, sendHeartbeat };
}
```

**Verification:**
- Hook establishes WebSocket connection
- Messages update local state
- Cleanup on unmount
- Error handling

**Sub-Task Assignment:**
- **Specialist A3** (Frontend Integration): Implement live data hooks

---

### Task 4.3.2: Confidence Score Display Component

**File:** `apps/web/src/components/ConfidenceScoreBadge.tsx`

**Implementation:**
```typescript
import { ConfidenceScore } from '@njz/types';

interface ConfidenceScoreBadgeProps {
  confidence: ConfidenceScore;
  size?: 'sm' | 'md' | 'lg';
  detailed?: boolean;  // Show breakdown on hover
}

export function ConfidenceScoreBadge({
  confidence,
  size = 'md',
  detailed = false
}: ConfidenceScoreBadgeProps) {
  const percentage = Math.round(confidence.value * 100);

  const colorClass = confidence.value >= 0.9
    ? 'bg-green-100 text-green-900'
    : confidence.value >= 0.7
    ? 'bg-yellow-100 text-yellow-900'
    : 'bg-red-100 text-red-900';

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }[size];

  return (
    <div className={`confidence-badge ${colorClass} ${sizeClass} rounded-full`}>
      <span className="font-bold">{percentage}%</span>

      {detailed && (
        <div className="confidence-breakdown mt-2 text-xs">
          <p>Sources: {confidence.sourceCount}</p>
          <p>Conflicts: {confidence.hasConflicts ? 'Yes' : 'No'}</p>
          {confidence.conflictFields.length > 0 && (
            <p>Conflicts in: {confidence.conflictFields.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

**Verification:**
- Badge displays confidence percentage
- Color codes based on value (green >= 0.9, yellow >= 0.7, red < 0.7)
- Breakdown shown when detailed=true
- Responsive sizing

**Sub-Task Assignment:**
- **Specialist A1**: Implement ConfidenceScoreBadge component

---

## 4.4 Phase 4.3: Integration Testing & Load Testing

### Task 4.4.1: Integration Tests

**File:** `tests/integration/test_data_pipeline.py`

**Test Cases:**

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pandascore_webhook_to_websocket_pipeline():
    """
    Test: Pandascore event → Webhook → Redis → WebSocket → Frontend
    """
    # 1. Send webhook event
    webhook_payload = {
        "match_id": "test_match_123",
        "score": {"team_1": 2, "team_2": 1},
        "round_number": 5,
        "event_type": "SCORE_UPDATE"
    }

    response = await client.post(
        "/webhooks/pandascore/match-update",
        json=webhook_payload,
        headers={"X-Signature": generate_signature(webhook_payload)}
    )
    assert response.status_code == 200

    # 2. Verify event in Redis Stream
    events = await redis_client.xrange("match:test_match_123:events", count=1)
    assert len(events) > 0

    # 3. Connect WebSocket and receive message
    async with websockets.connect("ws://localhost:8002/ws/matches/test_match_123") as ws:
        message = await asyncio.wait_for(ws.recv(), timeout=5.0)
        parsed = json.loads(message)

        assert parsed["type"] == "SCORE_UPDATE"
        assert parsed["payload"]["teamA"] == 2
        assert parsed["payload"]["teamB"] == 1

@pytest.mark.asyncio
async def test_tenet_verification_to_review_queue():
    """
    Test: Verify entity → Low confidence → Flag for review
    """
    # 1. Verify entity with low-confidence sources
    verification_request = {
        "entity_id": "match_456",
        "entity_type": "match",
        "game": "valorant",
        "sources": [
            {
                "source_type": "fan_forum",
                "trust_level": "LOW",
                "weight": 1.0,
                "data": {"final_score": {"team_a": 2, "team_b": 0}},
                "captured_at": datetime.utcnow()
            }
        ]
    }

    response = await client.post("/v1/verify", json=verification_request)
    result = response.json()

    assert result["status"] == "FLAGGED"  # Low confidence
    assert result["confidence"]["value"] < 0.7

    # 2. Check review queue
    review_queue = await client.get("/v1/admin/review-queue")
    items = review_queue.json()

    assert any(item["entity_id"] == "match_456" for item in items)

@pytest.mark.asyncio
async def test_history_api_with_confidence():
    """
    Test: GET /v1/history/matches with confidence scores
    """
    response = await client.get(
        "/v1/history/matches",
        params={"include_confidence": True, "limit": 10}
    )

    assert response.status_code == 200
    matches = response.json()

    for match in matches:
        assert "confidence" in match
        assert "value" in match["confidence"]
        assert 0.0 <= match["confidence"]["value"] <= 1.0
```

**Verification:**
- All 10+ integration tests pass
- Pipelines work end-to-end
- Confidence scoring working
- Review queue functional

**Sub-Task Assignment:**
- **Specialist D6** (QA/Testing): Write and run integration tests

---

### Task 4.4.2: Load Testing

**File:** `tests/load/test_live_performance.py`

**Requirements:**
- 1000 concurrent WebSocket connections
- 100 messages/second per connection
- <500ms latency for score updates
- 0% error rate

**Implementation (using Locust):**
```python
from locust import HttpUser, WebSocketClient, task, between

class LiveMatchUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        """Connect to WebSocket on start"""
        self.client = WebSocketClient("ws://localhost:8002")

    @task
    def receive_updates(self):
        """Receive live match updates"""
        try:
            message = self.client.recv(timeout=5.0)
            # Verify message structure
            assert message.get("type") in ["SCORE_UPDATE", "ROUND_END", "HEARTBEAT"]
        except Exception as e:
            self.environment.events.request.fire(
                request_type="websocket",
                name="receive_update",
                response_time=0,
                response_length=0,
                exception=e,
                context={}
            )

class HistoryAPIUser(HttpUser):
    wait_time = between(2, 5)

    @task
    def get_match_history(self):
        self.client.get("/v1/history/matches?limit=50")

    @task
    def get_player_stats(self):
        self.client.get("/v1/history/players/player_123/stats")
```

**Execution:**
```bash
locust -f tests/load/test_live_performance.py \
  --host http://localhost:8000 \
  --users 1000 \
  --spawn-rate 50 \
  --run-time 10m
```

**Acceptance Criteria:**
- ✅ <500ms response time (p95)
- ✅ 0% error rate
- ✅ 1000+ concurrent connections maintained
- ✅ Zero dropped messages

**Sub-Task Assignment:**
- **Specialist D6**: Design and execute load tests

---

## 4.5 Phase 4 Completion Verification

**All Gates Must Pass:**

| Gate | Criteria | Command |
|------|----------|---------|
| 4.1 | Live score <500ms latency | Load test: measure p95 latency |
| 4.2 | Confidence scores in API | `curl http://localhost:8000/v1/history/matches?include_confidence=true` |
| 4.3 | `/v1/live/` and `/v1/history/` endpoints | Integration tests pass |
| 4.4 | Review queue in admin | `curl http://localhost:8000/v1/admin/review-queue` (auth required) |
| 4.5 | Full pipeline end-to-end | Webhook → Redis → WebSocket → Frontend test passes |

**Gate Status:** Phase 4 ✅ PASSED → Phase 5 now ✅ UNLOCKED

---

### Sub-Agent Team Assignments

| Role | Specialist | Tasks |
|------|-----------|-------|
| **Pandascore Integration** | Specialist D1 | Webhook handler, signature verification |
| **Event Processing** | Specialist D2 | Redis routing, event normalization |
| **WebSocket Specialist** | Specialist D3 | Connection management, broadcasting |
| **API Development** | Specialist D4 | Live and history endpoints, serialization |
| **Auth Specialist** | Specialist D5 | Admin authentication, authorization |
| **QA & Testing** | Specialist D6 | Integration and load testing |

**Execution Model:**
- Phase 4.0 (Path A): Specialists D1-D3 work in parallel
- Phase 4.1 (Path B): Specialists D4-D5 work in parallel
- Phase 4.2 (Frontend): Specialist A3 integrates (from Phase 3 team)
- Phase 4.3 (Testing): Specialist D6 validates all

**Timeline:**
- Phase 4.0: 6 hours (parallel)
- Phase 4.1: 6 hours (parallel)
- Phase 4.2: 3 hours (sequential after backend ready)
- Phase 4.3: 5 hours (testing and validation)
- **Total Phase 4: 20 hours**

---

# PHASE 5: Ecosystem Expansion

**Duration:** ~18 hours
**Owner:** Ecosystem Specialist Agent
**Blocks:** Phase 6 gate unlock
**Depends On:** Phase 4 complete

## 5.0 Objectives

Create three new client applications (Companion, Browser Extension, Overlay) and one content platform stub (Wiki), all consuming services via @njz/types and @njz/service-client.

**Success Criteria:**
- ✅ Companion app builds without errors (React Native / Expo)
- ✅ Browser extension builds and installs (Chrome/Firefox)
- ✅ Overlay builds and works as OBS Browser Source
- ✅ All apps import from @njz/types (zero duplication)
- ✅ Smoke tests pass for each app
- ✅ Monorepo vs polyrepo evaluation documented

---

## 5.1 Companion App (React Native + Expo)

### Task 5.1.1: Scaffold Companion App

**Directory:** `apps/companion/`

**File Structure:**
```
apps/companion/
├── app.json
├── package.json
├── tsconfig.json
├── src/
│   ├── App.tsx
│   ├── screens/
│   │   ├── LiveMatchesScreen.tsx
│   │   ├── MatchDetailScreen.tsx
│   │   ├── PlayerSearchScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── LiveScoreCard.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   └── NavigationBar.tsx
│   ├── hooks/
│   │   ├── useLiveMatches.ts
│   │   └── useAuthContext.ts
│   ├── services/
│   │   └── api-client.ts
│   └── navigation/
│       └── RootNavigator.tsx
├── assets/
├── __tests__/
└── README.md
```

**Key Features:**
- Bottom tab navigation (Live, Search, Profile, Settings)
- Real-time match score updates via WebSocket
- Player stats lookup
- Authentication via OAuth (Google, Apple)
- Push notifications for match updates (future)

**Implementation Details:**
```typescript
// app.json
{
  "expo": {
    "name": "NJZ eSports Companion",
    "slug": "njz-companion",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "package": "com.njz.companion",
      "versionCode": 1
    }
  }
}

// src/App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

// src/screens/LiveMatchesScreen.tsx
import { useLiveMatch } from '../hooks/useLiveMatches';
import { liveMatch } from '@njz/service-client';

export function LiveMatchesScreen() {
  const { matches, loading } = useLiveMatch();

  if (loading) return <ActivityIndicator />;

  return (
    <FlatList
      data={matches}
      keyExtractor={(m) => m.matchId}
      renderItem={({ item }) => <LiveScoreCard match={item} />}
    />
  );
}
```

**Verification:**
- `expo build` succeeds
- App can be previewed on Expo Go
- Navigation works
- Can connect to live match WebSocket

**Sub-Task Assignment:**
- **Specialist E1** (React Native): Scaffold and implement Companion app
- **Specialist E2** (Mobile Services): Implement service client integration

---

### Task 5.1.2: Implement Live Score Updates

**File:** `apps/companion/src/components/LiveScoreCard.tsx`

**Requirements:**
- Display match score with team names
- Real-time updates via WebSocket
- Show confidence badge
- Tap to view match detail

**Implementation:**
```typescript
import { LiveMatchView, ConfidenceScore } from '@njz/types';
import { useLiveMatch } from '../hooks/useLiveMatches';

interface LiveScoreCardProps {
  match: LiveMatchView;
}

export function LiveScoreCard({ match }: LiveScoreCardProps) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('MatchDetail', { matchId: match.matchId })}
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.gameType}>{match.game.toUpperCase()}</Text>
        <Text style={styles.status}>{match.status}</Text>
      </View>

      <View style={styles.score}>
        <View style={styles.team}>
          <Text style={styles.teamName}>{match.teams[0].name}</Text>
          <Text style={styles.teamScore}>{match.teams[0].score}</Text>
        </View>

        <Text style={styles.round}>Round {match.currentRound}</Text>

        <View style={styles.team}>
          <Text style={styles.teamScore}>{match.teams[1].score}</Text>
          <Text style={styles.teamName}>{match.teams[1].name}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <ConfidenceBadge
          confidence={match.confidence}
          size="sm"
        />
        <Text style={styles.updated}>
          {formatTime(new Date(match.lastUpdated))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

**Verification:**
- Card renders correctly
- Updates when match data changes
- Tap navigates to detail screen
- Confidence badge displays

**Sub-Task Assignment:**
- **Specialist E1**: Implement LiveScoreCard component

---

## 5.2 Browser Extension (Chrome/Firefox)

### Task 5.2.1: Scaffold Browser Extension

**Directory:** `apps/browser-extension/`

**File Structure:**
```
apps/browser-extension/
├── manifest.json
├── package.json
├── src/
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx
│   │   └── popup.css
│   ├── background/
│   │   └── background.ts
│   ├── content/
│   │   └── content.ts
│   ├── components/
│   │   ├── LiveMatchWidget.tsx
│   │   └── Scoreboard.tsx
│   └── services/
│       └── storage.ts
├── public/
│   ├── icons/
│   └── manifest.json
└── README.md
```

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "NJZ eSports Companion",
  "description": "Live eSports scores and stats",
  "version": "1.0.0",
  "permissions": ["storage", "activeTab", "webRequest"],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_title": "NJZ eSports"
  },
  "background": {
    "service_worker": "src/background/background.ts"
  },
  "icons": {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  }
}
```

**Key Features:**
- Popup showing live matches
- Badge showing number of live matches
- Click to view score details
- Settings for game preferences

**Verification:**
- `npm run build` succeeds
- `npm run build:firefox` succeeds (if Firefox target)
- Extension loads in Chrome/Firefox
- Popup displays live matches

**Sub-Task Assignment:**
- **Specialist E3** (Extension Developer): Scaffold extension
- **Specialist E2**: Implement service client integration

---

### Task 5.2.2: Implement Live Score Popup

**File:** `apps/browser-extension/src/popup/popup.tsx`

**Requirements:**
- Display list of live matches
- Auto-refresh every 30 seconds
- Click match to open in new tab
- Settings button for preferences

**Implementation:**
```typescript
import React, { useEffect, useState } from 'react';
import { LiveMatchView } from '@njz/types';
import { liveMatch } from '@njz/service-client';

export function PopupApp() {
  const [matches, setMatches] = useState<LiveMatchView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const data = await liveMatch.getRecentEvents('');
      setMatches(data as LiveMatchView[]);
      setLoading(false);
    };

    fetchMatches();

    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="popup">
      <h2>NJZ eSports Live</h2>

      {loading && <p>Loading...</p>}

      <ul className="matches">
        {matches.map((match) => (
          <li key={match.matchId} className="match-item">
            <div className="score">
              <span className="team">{match.teams[0].shortName}</span>
              <span className="score-value">{match.teams[0].score}</span>
              <span className="separator">-</span>
              <span className="score-value">{match.teams[1].score}</span>
              <span className="team">{match.teams[1].shortName}</span>
            </div>
            <button
              onClick={() =>
                chrome.tabs.create({
                  url: `https://app.njz.gg/${match.game}/${match.matchId}`
                })
              }
            >
              View Details
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Verification:**
- Popup displays live matches
- Auto-refresh works
- Click button opens new tab with match details
- No errors in console

**Sub-Task Assignment:**
- **Specialist E3**: Implement popup component

---

## 5.3 LiveStream Overlay (OBS Browser Source)

### Task 5.3.1: Scaffold Overlay App

**Directory:** `apps/overlay/`

**File Structure:**
```
apps/overlay/
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Scoreboard.tsx
│   │   ├── LiveTimer.tsx
│   │   ├── RoundIndicator.tsx
│   │   └── PlayerStats.tsx
│   ├── hooks/
│   │   └── useLiveMatch.ts
│   └── styles/
│       └── overlay.css
├── public/
│   └── index.html
└── README.md
```

**Key Features:**
- Scoreboard display (teams, score, round)
- Transparent background (for OBS overlaying)
- Minimal, clean design
- Auto-scales to any resolution
- Real-time updates via WebSocket

**Implementation Details:**
```typescript
// src/App.tsx
import { useParams } from 'react-router-dom';
import { useLiveMatch } from './hooks/useLiveMatch';
import Scoreboard from './components/Scoreboard';

export function App() {
  const { matchId } = useParams();
  const { match, loading } = useLiveMatch(matchId!);

  if (loading) return null;
  if (!match) return <div>Match not found</div>;

  return <Scoreboard match={match} />;
}

// src/components/Scoreboard.tsx
export function Scoreboard({ match }: { match: LiveMatchView }) {
  return (
    <div className="scoreboard">
      <div className="team team-left">
        <img src={match.teams[0].logoUrl} alt={match.teams[0].name} />
        <div className="name">{match.teams[0].shortName}</div>
        <div className="score">{match.teams[0].score}</div>
      </div>

      <div className="center">
        <div className="round">Round {match.currentRound}</div>
        <div className="vs">vs</div>
      </div>

      <div className="team team-right">
        <div className="score">{match.teams[1].score}</div>
        <div className="name">{match.teams[1].shortName}</div>
        <img src={match.teams[1].logoUrl} alt={match.teams[1].name} />
      </div>
    </div>
  );
}
```

**Styling (Transparent Background):**
```css
body {
  background: transparent !important;
  margin: 0;
  padding: 0;
}

.scoreboard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%);
}

.scoreboard .team {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.scoreboard .score {
  font-size: 4rem;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}
```

**Verification:**
- App builds (`npm run build`)
- Loads in OBS as Browser Source
- Scoreboard displays correctly
- WebSocket updates work in OBS
- Transparent background functional

**Sub-Task Assignment:**
- **Specialist E4** (Overlay Specialist): Implement overlay components
- **Specialist E2**: Service integration

---

## 5.4 Wiki/Content Platform Stub

### Task 5.4.1: Scaffold Wiki App

**Directory:** `apps/wiki/`

**Requirements:**
- Next.js static site generation (SSG)
- Markdown content support
- Search functionality
- Game-specific sections

**File Structure:**
```
apps/wiki/
├── package.json
├── next.config.js
├── pages/
│   ├── index.tsx
│   ├── [game]/
│   │   ├── index.tsx
│   │   └── [article].tsx
│   └── api/
│       └── search.ts
├── content/
│   ├── valorant/
│   │   ├── mechanics.md
│   │   └── teams.md
│   └── cs2/
│       ├── mechanics.md
│       └── teams.md
├── components/
│   ├── Nav.tsx
│   ├── ArticleCard.tsx
│   └── SearchBar.tsx
└── public/
```

**Implementation:**
```typescript
// pages/[game]/[article].tsx
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

interface ArticleProps {
  content: string;
  title: string;
  game: string;
}

export default function Article({ content, title, game }: ArticleProps) {
  return (
    <div className="article">
      <h1>{title}</h1>
      <div className="content" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export async function getStaticProps({ params }: any) {
  const { game, article } = params;
  const filePath = path.join(process.cwd(), 'content', game, `${article}.md`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const html = marked(content);

  return {
    props: {
      content: html,
      title: article.replace(/-/g, ' '),
      game
    },
    revalidate: 3600 // Revalidate every hour
  };
}

export async function getStaticPaths() {
  const contentDir = path.join(process.cwd(), 'content');
  const games = fs.readdirSync(contentDir);

  const paths = games.flatMap((game) => {
    const gameDir = path.join(contentDir, game);
    const articles = fs.readdirSync(gameDir).map((f) => f.replace('.md', ''));

    return articles.map((article) => ({
      params: { game, article }
    }));
  });

  return { paths, fallback: false };
}
```

**Verification:**
- `npm run build` succeeds
- Static pages generated
- Search API functional
- Content renders correctly

**Sub-Task Assignment:**
- **Specialist E5** (Content Specialist): Implement wiki app

---

## 5.5 Type Consolidation & Smoke Tests

### Task 5.5.1: Verify All Apps Import from @njz/types

**Audit Command:**
```bash
# Check for duplicate type definitions across all apps
grep -r "interface Player" apps/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "@njz/types" | grep -v "@sator/types"
grep -r "interface Team" apps/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "@njz/types" | grep -v "@sator/types"
```

**Expected Result:**
- 0 results (no duplicates)

**If Duplicates Found:**
- Remove inline definitions
- Add imports from @njz/types or @sator/types

**Verification:**
- Audit command returns 0 results

**Sub-Task Assignment:**
- **Specialist E6** (Quality Assurance): Audit and fix any duplicates

---

### Task 5.5.2: Create Smoke Tests

**File:** `tests/smoke/ecosystem.spec.ts`

**Tests Required:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ecosystem Apps', () => {
  test('Companion app builds without errors', async () => {
    // Run: expo build
    // Verify: build succeeds
  });

  test('Browser extension builds without errors', async () => {
    // Run: npm run build from apps/browser-extension
    // Verify: manifest.json is valid
    // Verify: extension can be loaded
  });

  test('Overlay app builds without errors', async () => {
    // Run: npm run build from apps/overlay
    // Verify: dist/ directory has index.html
  });

  test('Wiki app builds without errors', async () => {
    // Run: npm run build from apps/wiki
    // Verify: .next/ directory created
  });

  test('Companion app can connect to service-client', async () => {
    // Import @njz/service-client
    // Verify: types resolve correctly
  });

  test('Extension popup displays live matches', async () => {
    // Load extension in browser
    // Open popup
    // Verify: matches rendered
  });

  test('Overlay renders scoreboard', async () => {
    // Load overlay in browser
    // Verify: scoreboard visible
    // Verify: background transparent
  });

  test('All apps have zero type errors', async () => {
    // Run: pnpm typecheck --filter @njz/companion
    // Run: pnpm typecheck --filter @njz/extension
    // Run: pnpm typecheck --filter @njz/overlay
    // Verify: all exit with code 0
  });
});
```

**Verification:**
- All 8+ smoke tests pass
- No build errors
- No type errors

**Sub-Task Assignment:**
- **Specialist E6**: Create and run smoke tests

---

## 5.6 Monorepo vs Polyrepo Evaluation

### Task 5.6.1: Evaluate Split Decision

**File:** `docs/architecture/REPO_STRUCTURE_DECISION.md`

**Document Should Contain:**

```markdown
# Monorepo vs Polyrepo Evaluation (Phase 5)

## Current State (Monorepo)

**Pros:**
- Single CI/CD pipeline (GitHub Actions)
- Shared packages (@njz/types, @njz/service-client, @njz/ui)
- Consistent tooling (pnpm, TypeScript, ESLint)
- Easier refactoring across boundaries
- Monolithic dependency management

**Cons:**
- Slower builds (all apps built even if only one changes)
- Larger repository clone (all code + history)
- More complex CI matrix (need to test changed packages only)

## Metrics

| Metric | Monorepo | Polyrepo |
|--------|----------|----------|
| Build time | 25 min | 5 min × 5 repos = 25 min (parallel) |
| CI complexity | Low | High (5 pipelines) |
| Code sharing | Easy (@njz/*) | Via NPM packages |
| Onboarding | Medium (many packages) | Easy (single focus) |
| Release management | Single version | Per-repo versions |

## Decision

**Recommended: Remain Monorepo until Month 6 (Phase 7)**

**Triggers to Split:**
1. Build times exceed 30 minutes
2. Team size >5 and working independently
3. Release cycles diverge (mobile app monthly, web app weekly)
4. Infrastructure needs diverge (mobile → AWS, web → Vercel)

**If Split, Proposed Structure:**
- `njz-platform-core` (API, database, web app, shared packages)
- `njz-companion-apps` (Companion, Extension, Overlay)
- `njz-content` (Wiki, Nexus)

## Sign-off

Evaluated by: [Date]
Decision: MONOREPO
Next evaluation: Phase 7 (Month 6)
```

**Verification:**
- Document written
- Metrics calculated
- Decision justified

**Sub-Task Assignment:**
- **Specialist E7** (Architect): Create evaluation document

---

## 5.7 Phase 5 Completion Verification

**All Gates Must Pass:**

| Gate | Criteria | Verification |
|------|----------|--------------|
| 5.1 | Companion app builds | `expo build` succeeds |
| 5.2 | Browser extension builds | `npm run build` succeeds in apps/browser-extension |
| 5.3 | Overlay app builds | `npm run build` succeeds in apps/overlay |
| 5.4 | All apps import from @njz/types | 0 duplicate type definitions |
| 5.5 | Smoke tests pass | All 8+ tests pass |
| 5.6 | Monorepo evaluation documented | docs/architecture/REPO_STRUCTURE_DECISION.md exists |

**Gate Status:** Phase 5 ✅ PASSED → Phase 6 now ✅ UNLOCKED

---

### Sub-Agent Team Assignments

| Role | Specialist | Tasks |
|------|-----------|-------|
| **React Native Dev** | Specialist E1 | Companion app scaffold and implementation |
| **Mobile/Services** | Specialist E2 | Service client integration across all apps |
| **Extension Dev** | Specialist E3 | Browser extension scaffold and popup |
| **Overlay Dev** | Specialist E4 | Overlay app scoreboard and styling |
| **Content Platform** | Specialist E5 | Wiki/content app and markdown processing |
| **QA & Auditing** | Specialist E6 | Type auditing, smoke tests, verification |
| **Architecture** | Specialist E7 | Monorepo vs polyrepo evaluation |

**Execution Model:**
- Phase 5.1-5.4: All specialists (E1-E5) work in parallel
- Phase 5.5: Specialist E6 audits and tests
- Phase 5.6: Specialist E7 evaluates

**Timeline:**
- Phase 5.1: Companion (3 hours)
- Phase 5.2: Extension (2 hours)
- Phase 5.3: Overlay (2 hours)
- Phase 5.4: Wiki (2 hours)
- Phase 5.5: Type consolidation + tests (4 hours)
- Phase 5.6: Evaluation (3 hours)
- **Total Phase 5: 18 hours**

---

# PHASE 6: LIVEOperations & Advanced Features

**Duration:** ~20 hours
**Owner:** Full-Stack Specialist Agent
**Blocks:** Production launch
**Depends On:** Phase 5 complete

## 6.0 Objectives

Implement advanced features, production hardening, ML model training, and operations infrastructure.

**Success Criteria:**
- ✅ LIVEOperations dashboard (admin panel enhancements)
- ✅ Advanced analytics (SimRating enhancements, new metrics)
- ✅ ML model training pipeline (TensorFlow.js + backend)
- ✅ Community features (Forums fully functional)
- ✅ Security hardening (rate limits, CORS, CSP)
- ✅ Performance optimization (caching, compression, CDN)
- ✅ Monitoring & alerting (Sentry, custom dashboards)
- ✅ Production deployment checklist complete

---

## 6.1 LIVEOperations Dashboard

### Task 6.1.1: Create Admin Dashboard

**File:** `apps/web/src/hub-0-operations/pages/Dashboard.tsx`

**Requirements:**
- Overview of all live matches
- Service health indicators
- Review queue management
- User analytics
- System logs

**Key Sections:**
1. **Live Match Overview**
   - Map of active matches by game
   - Tournament context
   - Concurrent user count

2. **Service Health**
   - API status
   - WebSocket connections
   - Database performance
   - Cache hit rate

3. **Review Queue**
   - Pending reviews
   - Review timeline
   - Reviewer assignments

4. **Analytics**
   - DAU/MAU
   - Match coverage
   - Data quality metrics

**Verification:**
- Dashboard loads without errors
- Real-time updates
- Proper authorization (admin-only)

**Sub-Task Assignment:**
- **Specialist F1** (Admin UI): Implement dashboard

---

## 6.2 Advanced Analytics

### Task 6.2.1: Enhance SimRating Model

**File:** `packages/shared/api/src/analytics/simrating.py`

**Enhancements:**
- Add new metrics (clutch performance, consistency, impact)
- Weight adjustments (tournament level, opponent strength)
- Per-map statistics (for CS2)
- Historical trend analysis

**Implementation:**
```python
class AdvancedSimRating:
    def calculate_clutch_performance(self, player_stats: dict) -> float:
        """Calculate 1vN clutch performance"""
        clutch_wins = player_stats.get('clutch_wins', 0)
        clutch_attempts = player_stats.get('clutch_attempts', 0)

        if clutch_attempts == 0:
            return 0.5

        return clutch_wins / clutch_attempts

    def calculate_consistency(self, player_stats: List[dict]) -> float:
        """Calculate consistency across matches"""
        kills = [s.get('kills', 0) for s in player_stats]
        mean_kills = sum(kills) / len(kills)
        variance = sum((k - mean_kills) ** 2 for k in kills) / len(kills)
        std_dev = variance ** 0.5

        # Penalize high variance (inconsistency)
        return 1.0 / (1.0 + std_dev)

    def calculate_tournament_weighted_rating(
        self,
        base_rating: float,
        tournament_tier: str,
        opponent_avg_rating: float
    ) -> float:
        """Weight rating by tournament importance"""
        tier_multipliers = {
            'international': 1.5,
            'regional': 1.2,
            'national': 1.0,
            'online': 0.8
        }

        # Opponent strength adjustment
        strength_adjustment = opponent_avg_rating / 1500

        multiplier = tier_multipliers.get(tournament_tier, 1.0)
        return base_rating * multiplier * strength_adjustment
```

**Verification:**
- New metrics calculate without errors
- Values within expected ranges (0.0-1.0 or normalized)
- Historical trends displayed correctly

**Sub-Task Assignment:**
- **Specialist F2** (Analytics): Implement advanced metrics

---

## 6.3 ML Model Training Pipeline

### Task 6.3.1: Setup TensorFlow.js Training

**File:** `packages/shared/api/src/ml/training.py`

**Requirements:**
- Train SimRating model on historical data
- Player performance prediction
- Tournament outcome prediction
- Model serialization

**Implementation:**
```python
import tensorflow as tf
import numpy as np
from typing import Tuple

class SimRatingModel:
    def __init__(self):
        self.model = self._build_model()

    def _build_model(self) -> tf.keras.Model:
        """Build neural network for SimRating prediction"""
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(20,)),  # 20 input features
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')  # 0-1 output
        ])

        model.compile(
            optimizer='adam',
            loss='mse',
            metrics=['mae']
        )

        return model

    def prepare_training_data(self, matches: List[dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Extract features from match data"""
        X = []
        y = []

        for match in matches:
            for player in match['players']:
                features = [
                    player['kills'],
                    player['deaths'],
                    player['assists'],
                    player['kda'],
                    player['headshot_percent'],
                    player['clutch_success_rate'],
                    player['avg_damage_per_round'],
                    player['economy_awareness_score'],
                    player['positioning_score'],
                    player['communication_score'],
                    player['consistency_score'],
                    player['anti_eco_win_rate'],
                    player['full_buy_win_rate'],
                    player['team_win_rate'],
                    match['tournament_tier_score'],
                    match['opponent_avg_simrating'],
                    player['map_specific_rating'],
                    player['role_index'],
                    player['experience_level'],
                    player['recent_form_index']
                ]

                X.append(features)
                y.append(player['simrating'] / 2000)  # Normalize to 0-1

        return np.array(X), np.array(y)

    def train(self, matches: List[dict], epochs: int = 50) -> dict:
        """Train model on match data"""
        X, y = self.prepare_training_data(matches)

        # Split into train/val
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]

        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=32,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=10)
            ]
        )

        return {
            'loss': float(history.history['loss'][-1]),
            'val_loss': float(history.history['val_loss'][-1]),
            'mae': float(history.history['mae'][-1])
        }

    def predict(self, player_features: List[float]) -> float:
        """Predict SimRating for a player"""
        X = np.array([player_features])
        prediction = self.model.predict(X, verbose=0)[0][0]
        return float(prediction * 2000)  # Denormalize

    def export_to_tfjs(self, path: str):
        """Export model for TensorFlow.js"""
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(self.model, path)
```

**Verification:**
- Model trains without errors
- Loss converges
- Predictions within expected range
- Model exports to TensorFlow.js format

**Sub-Task Assignment:**
- **Specialist F3** (ML Engineer): Implement model training

---

## 6.4 Community Features Enhancement

### Task 6.4.1: Implement Forum Moderation Tools

**File:** `packages/shared/api/src/routers/admin/moderation.py`

**Requirements:**
- Post flagging system
- User warnings and bans
- Content moderation queue
- Appeal system

**Implementation:**
```python
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

router = APIRouter(prefix="/v1/admin/moderation", tags=["moderation"])

@router.post("/posts/{post_id}/flag")
async def flag_post(
    post_id: str,
    reason: str,
    current_user = Depends(get_current_user)
):
    """Flag post for moderation"""
    post = db.query(ForumPost).filter_by(id=post_id).first()

    moderation = PostModeration(
        post_id=post_id,
        reason=reason,
        flagged_by=current_user.id,
        flagged_at=datetime.utcnow(),
        status="pending"
    )

    db.add(moderation)
    db.commit()

    return {"status": "flagged", "moderation_id": moderation.id}

@router.post("/users/{user_id}/warn")
async def warn_user(
    user_id: str,
    reason: str,
    severity: str  # low, medium, high
):
    """Issue warning to user"""
    user = db.query(User).filter_by(id=user_id).first()

    warning = UserWarning(
        user_id=user_id,
        reason=reason,
        severity=severity,
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30)
    )

    db.add(warning)

    # Auto-ban if 3+ warnings
    warning_count = db.query(UserWarning).filter_by(
        user_id=user_id,
        severity='high'
    ).count()

    if warning_count >= 3:
        user.banned_until = datetime.utcnow() + timedelta(days=7)

    db.commit()
    return {"warnings": warning_count, "banned": user.banned_until is not None}

@router.get("/queue")
async def get_moderation_queue(
    status: str = "pending",
    limit: int = 50
):
    """Get posts pending moderation"""
    items = db.query(PostModeration).filter_by(status=status).limit(limit).all()
    return items
```

**Verification:**
- Posts flagged correctly
- Warnings issued and tracked
- Auto-ban triggers after threshold
- Moderation queue functional

**Sub-Task Assignment:**
- **Specialist F4** (Community): Implement moderation tools

---

## 6.5 Security Hardening

### Task 6.5.1: Implement Security Headers & CORS

**File:** `packages/shared/api/src/security/headers.py`

**Requirements:**
- CORS configuration
- CSP (Content Security Policy)
- HTTPS enforcement
- Rate limiting

**Implementation:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://njz.gg",
        "https://app.njz.gg",
        "https://admin.njz.gg"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600
)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["njz.gg", "*.njz.gg", "localhost"]
)

# Security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' https: data:; "
        "font-src 'self' https://fonts.googleapis.com; "
        "connect-src 'self' https: wss:;"
    )

    return response

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

@app.get("/api/public")
@limiter.limit("100/minute")
async def public_endpoint(request: Request):
    return {"status": "ok"}

@app.post("/api/intensive")
@limiter.limit("10/minute")
async def intensive_endpoint(request: Request):
    return {"status": "processing"}
```

**Verification:**
- Security headers present in responses
- CORS works for allowed origins
- Rate limits enforced
- HTTPS redirects working

**Sub-Task Assignment:**
- **Specialist F5** (Security): Implement security measures

---

## 6.6 Performance Optimization

### Task 6.6.1: Implement Caching Strategy

**File:** `packages/shared/api/src/cache/strategy.py`

**Requirements:**
- Redis caching for API responses
- Cache invalidation strategy
- CDN integration (Cloudflare)

**Implementation:**
```python
from functools import wraps
import hashlib
import json

class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client

    def get_cache_key(self, namespace: str, *args, **kwargs) -> str:
        """Generate cache key"""
        key_data = f"{namespace}:{args}:{sorted(kwargs.items())}"
        return f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"

    async def cache_response(
        self,
        namespace: str,
        ttl_seconds: int = 3600
    ):
        """Decorator to cache API responses"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                cache_key = self.get_cache_key(namespace, *args, **kwargs)

                # Try cache
                cached = await self.redis.get(cache_key)
                if cached:
                    return json.loads(cached)

                # Execute function
                result = await func(*args, **kwargs)

                # Store in cache
                await self.redis.setex(
                    cache_key,
                    ttl_seconds,
                    json.dumps(result, default=str)
                )

                return result

            return wrapper

        return decorator

cache_manager = CacheManager(redis_client)

# Usage
@app.get("/v1/history/matches")
@cache_manager.cache_response("matches:history", ttl_seconds=3600)
async def get_matches():
    # This response is cached for 1 hour
    return db.query(Match).all()

# Cache invalidation
async def invalidate_match_cache(match_id: str):
    pattern = f"cache:matches:*{match_id}*"
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)
```

**Verification:**
- Cache hits reduce response time
- Invalidation clears stale data
- TTL enforced correctly

**Sub-Task Assignment:**
- **Specialist F6** (Performance): Implement caching

---

## 6.7 Monitoring & Alerting

### Task 6.7.1: Setup Sentry & Custom Dashboards

**File:** `packages/shared/api/src/monitoring/sentry.py`

**Requirements:**
- Error tracking (Sentry)
- Performance monitoring
- Custom dashboards
- Alert rules

**Implementation:**
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration()
    ],
    traces_sample_rate=0.1,
    environment=os.getenv("ENV", "development")
)

# Custom error handling
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    sentry_sdk.capture_exception(exc)

    # Log to custom dashboard
    await log_event({
        "type": "error",
        "message": str(exc),
        "path": request.url.path,
        "method": request.method,
        "timestamp": datetime.utcnow()
    })

    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# Performance monitoring
@app.middleware("http")
async def log_request_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    duration = time.time() - start_time

    # Alert if slow
    if duration > 1.0:
        sentry_sdk.capture_message(
            f"Slow request: {request.url.path} took {duration}s",
            level="warning"
        )

    response.headers["X-Process-Time"] = str(duration)
    return response
```

**Verification:**
- Errors tracked in Sentry
- Performance metrics logged
- Alerts triggered on thresholds

**Sub-Task Assignment:**
- **Specialist F7** (DevOps): Setup monitoring

---

## 6.8 Production Deployment Checklist

### Task 6.8.1: Create Deployment Checklist

**File:** `docs/PRE_DEPLOY_CHECKLIST.md`

**Contents:**

```markdown
# Production Deployment Checklist

## Pre-Deployment (1 week before)

- [ ] Code review complete (all PRs merged)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance tests passing (<500ms latency)
- [ ] Security scan clear (no vulnerabilities)
- [ ] Database migrations tested in staging
- [ ] Environment variables documented and set
- [ ] SSL certificates valid (not expiring in <30 days)
- [ ] Database backup created and tested
- [ ] Disaster recovery plan reviewed

## Deployment Day

### 1. Pre-Deployment Checks (1 hour before)
- [ ] All services health checks passing
- [ ] Database connections verified
- [ ] Redis cache warmed up
- [ ] CDN cache cleared (if needed)
- [ ] Monitoring dashboards up
- [ ] Slack #incidents channel active

### 2. Deployment (orchestrated)
- [ ] Deploy API service (services/api/)
- [ ] Deploy WebSocket service
- [ ] Deploy TeneT verification service
- [ ] Deploy legacy compiler service
- [ ] Deploy frontend (apps/web/)
- [ ] Companion app (if applicable)
- [ ] Browser extension (if applicable)
- [ ] Wiki (if applicable)

### 3. Post-Deployment Verification
- [ ] All services responding (health checks)
- [ ] No error spikes in Sentry
- [ ] API endpoints responding (<1s latency)
- [ ] WebSocket connections established
- [ ] Database queries executing normally
- [ ] Live match data flowing correctly
- [ ] UI loads in all browsers
- [ ] Mobile apps connecting successfully

### 4. Smoke Tests
- [ ] Can login/authenticate
- [ ] Can view live matches
- [ ] Can view historical data
- [ ] Admin review queue accessible
- [ ] WebSocket updates flowing
- [ ] Confidence scores displaying

### 5. Rollback Plan
- [ ] Previous version tagged and available
- [ ] Rollback script tested
- [ ] Communication plan ready
- [ ] 15-minute decision window identified

## Post-Deployment (24 hours)

- [ ] Monitor error rates (should stay <0.1%)
- [ ] Check performance metrics
- [ ] Verify user engagement normal
- [ ] Review feedback channels
- [ ] Schedule post-mortem if issues
- [ ] Update deployment notes

## Sign-off

Deployed by: _________
Verified by: _________
Date: _________
```

**Verification:**
- Checklist comprehensive
- All items verifiable
- Rollback procedures documented

**Sub-Task Assignment:**
- **Specialist F8** (Release Manager): Create and own checklist

---

## 6.9 Phase 6 Completion Verification

**All Gates Must Pass:**

| Gate | Criteria | Verification |
|------|----------|--------------|
| 6.1 | LIVEOperations dashboard | Admin panel loads and updates |
| 6.2 | Advanced analytics | New metrics calculate correctly |
| 6.3 | ML model training | Model trains and exports to TF.js |
| 6.4 | Community moderation | Flagging, warnings, bans work |
| 6.5 | Security hardening | Security headers, CORS, rate limits in place |
| 6.6 | Performance optimization | Caching reduces latency by 50%+ |
| 6.7 | Monitoring & alerting | Sentry integrated, dashboards working |
| 6.8 | Production ready | All deployment checks passing |

**Gate Status:** Phase 6 ✅ PASSED → Production Launch Ready

---

### Sub-Agent Team Assignments

| Role | Specialist | Tasks |
|------|-----------|-------|
| **Admin UI** | Specialist F1 | LIVEOperations dashboard |
| **Analytics** | Specialist F2 | Advanced metrics and analysis |
| **ML Engineer** | Specialist F3 | Model training pipeline |
| **Community Mgmt** | Specialist F4 | Moderation tools |
| **Security** | Specialist F5 | Headers, CORS, rate limiting |
| **Performance** | Specialist F6 | Caching strategy and optimization |
| **DevOps** | Specialist F7 | Monitoring, alerting, logging |
| **Release Manager** | Specialist F8 | Deployment checklist and procedures |

**Execution Model:**
- All 8 specialists work in parallel (independent features)
- Regular sync meetings (daily standups)
- Shared integration test suite for all features

**Timeline:**
- Phase 6.1-6.7: All features in parallel (15 hours)
- Phase 6.8: Finalize checklist and verification (5 hours)
- **Total Phase 6: 20 hours**

---

# Summary: Phase 3-6 Timeline & Resource Planning

## Total Project Timeline

| Phase | Focus | Duration | Team Size | Status |
|-------|-------|----------|-----------|--------|
| 0-1 | Schema & Foundation | 4h | 1-2 | ✅ COMPLETE |
| 2 | Service Architecture | 18h | 4 | 🟡 IN PROGRESS |
| 3 | Frontend Architecture | 15h | 6 | 🔒 QUEUED |
| 4 | Data Pipelines | 20h | 6 | 🔒 QUEUED |
| 5 | Ecosystem Expansion | 18h | 7 | 🔒 QUEUED |
| 6 | Advanced & Deploy | 20h | 8 | 🔒 QUEUED |
| **TOTAL** | **Complete Platform** | **~95 hours** | **Peak: 8** | **Planning Complete** |

## Resource Optimization

**Sequential Phases (Hard Blocking):**
- Phase 0 → 1 → 2 (can't skip)
- Phase 2 → 3 + 4 (can run in parallel after 2)
- Phase 4 → 5 (data pipelines required before ecosystem)
- Phase 5 → 6 (ecosystem complete before advanced features)

**Parallel Windows:**
- Phase 1 can start immediately after Phase 0
- Phase 3 can start after Phase 1 (parallel with Phase 2)
- Phase 4 starts after Phase 2 + 3 (not phase 3 alone)
- Phase 5 starts after Phase 4 complete
- Phase 6 starts after Phase 5 complete

**Optimal Team Scaling:**
- Weeks 1: 1-2 people (Phase 0-1)
- Weeks 2-3: 4 people (Phase 2 + Phase 3 start)
- Weeks 4: 6 people (Phase 2 + 3 + 4 together)
- Weeks 5-6: 6-7 people (Phase 4 + 5 together)
- Weeks 7: 8 people (Phase 6 parallel with Phase 5 finish)

---

## Monorepo Structure (Final State)

```
NJZ eSports Monorepo (eSports-EXE)
│
├── apps/
│   ├── web/                    # Main platform (React 18 + Vite)
│   ├── companion/              # Mobile app (React Native + Expo)
│   ├── browser-extension/      # Chrome/Firefox extension
│   ├── overlay/                # OBS livestream overlay
│   └── wiki/                   # Content & documentation (Next.js SSG)
│
├── services/
│   ├── api-gateway/            # FastAPI main API
│   ├── tenet-verification/     # TeneT Key.Links verification
│   ├── websocket/              # Real-time WebSocket service
│   ├── legacy-compiler/        # Data scraping & aggregation
│   └── analytics/              # Advanced analytics engine
│
├── packages/
│   ├── @njz/
│   │   ├── types/              # Canonical TypeScript types
│   │   ├── service-client/     # Universal service client
│   │   ├── ui/                 # Shared React components
│   │   ├── websocket-client/   # WebSocket client library
│   │   └── tenet-protocol/     # TENET runtime
│   ├── @sator/
│   │   ├── types/              # Game domain types
│   │   └── services/           # Game domain services
│   └── shared/
│       ├── api/                # FastAPI shared code
│       ├── axiom-esports-data/ # Data pipeline
│       └── packages/
│           ├── data-partition-lib/
│           └── stats-schema/
│
├── data/
│   └── schemas/
│       ├── GameNodeID.ts
│       ├── tenet-protocol.ts
│       ├── live-data.ts
│       ├── legacy-data.ts
│       └── index.ts
│
├── docs/
│   ├── architecture/
│   │   ├── TENET_TOPOLOGY.md
│   │   └── REPO_STRUCTURE_DECISION.md
│   └── SCHEMA_VERSIONING.md
│
├── infra/
│   ├── docker/                 # Docker Compose configs
│   ├── migrations/             # Alembic database migrations
│   ├── kubernetes/             # K8s manifests (future)
│   └── terraform/              # IaC configs (future)
│
├── tests/
│   ├── e2e/                    # Playwright E2E tests
│   ├── integration/            # Integration tests
│   ├── load/                   # Locust load tests
│   ├── smoke/                  # Quick smoke tests
│   └── schema-parity/          # TypeScript ≡ Python validation
│
├── .agents/
│   ├── PHASE_GATES.md
│   ├── SCHEMA_REGISTRY.md
│   ├── AGENT_CONTRACT.md
│   ├── PHASE_2_PLAN.md
│   ├── PHASE_3-6_DETAILED_PLAN.md
│   ├── PHASE_2_LAUNCH_CHECKLIST.md
│   └── REFINEMENTS_COMPLETE.md
│
├── MASTER_PLAN.md
├── AGENTS.md
├── CLAUDE.md
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Next Steps for Implementation

1. **Immediately after Phase 2 complete:**
   - Dispatch Phase 3 specialists (Specialist A1-A6)
   - Begin Phase 4 planning in detail

2. **After Phase 3 complete:**
   - Dispatch Phase 4 specialists (Specialist D1-D6)
   - Review Phase 5 readiness

3. **After Phase 4 complete:**
   - Dispatch Phase 5 specialists (Specialist E1-E7)
   - Begin Phase 6 detailed implementation

4. **After Phase 5 complete:**
   - Dispatch Phase 6 specialists (Specialist F1-F8)
   - Prepare production deployment

---

**Plan Status:** ✅ COMPREHENSIVE PHASE 3-6 PLAN CREATED
**Ready for Final Review & Refinement**
