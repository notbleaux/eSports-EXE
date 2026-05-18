[Ver002.000]

# @njz/ui

Shared React component library for the **NJZ eSports Platform**. Provides the TENET-layer navigation primitives used by `apps/web`, `apps/nexus`, `apps/companion`, and `apps/overlay`.

> Architecture context: see [`docs/architecture/TENET_TOPOLOGY.md`](../../../docs/architecture/TENET_TOPOLOGY.md). Components in this package implement the **Quarter GRID** (SATOR / AREPO / OPERA / ROTAS) and **World-Port** navigation surface.

## Installation

This package is consumed via the pnpm workspace — no separate install. Add as a dependency:

```jsonc
// apps/<your-app>/package.json
{
  "dependencies": {
    "@njz/ui": "workspace:*"
  }
}
```

Then import:

```typescript
import { WorldPortCard, QuarterGrid, GameNodeBadge, GameNodeIDFrame } from '@njz/ui';
```

Peer dependencies: `react >=18`, `react-dom >=18`, `react-router-dom >=6` (only `GameNodeIDFrame` requires router; other components have no router dependency).

## Components

### `WorldPortCard`

A game World-Port selector card used in the **TeNET Directory** (`/hubs`). Displays game branding, status, and node count; routes to the World-Port on click.

| Prop | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✓ | World-Port identifier (e.g. `"valorant-port"`) |
| `displayName` | `string` | ✓ | Uppercase game name shown as the card title |
| `game` | `string` | ✓ | Game key for accent styling. Known values: `"valorant"`, `"cs2"`. Unknown values get a neutral palette. |
| `isActive` | `boolean` | ✓ | When `false`, card renders disabled with "PENDING RELEASE" badge |
| `nodeCount` | `number` | ✓ | Number of GameNodeIDs in this World-Port |
| `lastUpdated` | `string` | ✓ | Human-readable freshness label (e.g. `"5 mins ago"`) |
| `route` | `string` | ✓ | Target route — paired with `onClick` for navigation |
| `onClick` | `() => void` | | Click handler. Disabled cards do not fire. |
| `className` | `string` | | Additional Tailwind classes |

```tsx
import { WorldPortCard } from '@njz/ui';
import { useNavigate } from 'react-router-dom';

function HubsPage() {
  const navigate = useNavigate();
  return (
    <WorldPortCard
      id="valorant-port"
      displayName="VALORANT"
      game="valorant"
      isActive
      nodeCount={124}
      lastUpdated="5 mins ago"
      route="/valorant"
      onClick={() => navigate('/valorant')}
    />
  );
}
```

### `QuarterGrid`

A self-contained 2×2 SATOR / AREPO / OPERA / ROTAS grid that resolves quarter routes from a `gameId`. Use this when you need a lightweight Quarter GRID inside an existing page (e.g. a sidebar mini-map). For the full-page Quarter GRID with header and accessibility skip-link, see `GameNodeIDFrame` instead.

| Prop | Type | Required | Description |
|---|---|---|---|
| `gameId` | `string` | ✓ | Game key. Routes are constructed as `/${gameId}/{quarter-path}` |
| `activeQuadrant` | `'sator' \| 'arepo' \| 'opera' \| 'rotas'` | | Highlights the active quarter with an animated dot and `aria-current="page"` |
| `onQuadrantClick` | `(quadrant: QuarterGridQuadrant) => void` | | Click handler. Receives the full quadrant object including resolved route. |
| `className` | `string` | | Additional Tailwind classes |

```tsx
import { QuarterGrid } from '@njz/ui';

<QuarterGrid
  gameId="valorant"
  activeQuadrant="sator"
  onQuadrantClick={(q) => navigate(q.path)}
/>
```

### `GameNodeIDFrame`

The canonical TENET navigation surface — full-page 2×2 grid with game header, icons, default quarter content, accessibility skip-link, and built-in `react-router-dom` navigation. Use this on `/hubs`, `/:gameId`, and any landing route that should present the Quarter GRID as the primary nav.

| Prop | Type | Required | Description |
|---|---|---|---|
| `gameId` | `string` | ✓ | Game key (`"valorant"`, `"cs2"`). Used to build routes `/${gameId}${quarter.route}`. |
| `gameName` | `string` | ✓ | Display name shown in the header (`"VALORANT"`) |
| `gameIcon` | `ReactNode` | | Optional icon element rendered next to the game name |
| `quarters` | `Partial<Record<QuarterId, Partial<Quarter>>>` | | Override one or more default quarters. Merges with `DEFAULT_QUARTERS`. |
| `onQuarterSelect` | `(quarter: Quarter) => void` | | Fires before navigation. Useful for analytics. |
| `className` | `string` | | Additional CSS classes on the outer container |

```tsx
import { GameNodeIDFrame } from '@njz/ui';

<GameNodeIDFrame
  gameId="valorant"
  gameName="VALORANT"
  gameIcon={<ValorantLogo />}
/>
```

Overriding a quarter (e.g. swap SATOR's description for a game-specific phrase):

```tsx
<GameNodeIDFrame
  gameId="cs2"
  gameName="COUNTER-STRIKE 2"
  quarters={{
    SATOR: { description: 'HLTV-style analytics and SimRating v2' },
  }}
/>
```

The defaults (`DEFAULT_QUARTERS`) live in `src/components/GameNodeIDFrame/constants.ts`. Quarter colours are Tailwind tokens — overriding requires the full `QuarterColor` object (`bg`, `hover`, `ring`, `gradient`).

### `GameNodeBadge`

Compact identifier badge showing game and optional node context. Used in breadcrumbs, cards, and status bars where the user needs to confirm what game/node they're looking at.

| Prop | Type | Required | Description |
|---|---|---|---|
| `gameId` | `string` | ✓ | Game key. Known values render abbreviations: `valorant → "VLR"`, `cs2 → "CS2"`. Unknown values fall back to the first 3 chars uppercased. |
| `nodeId` | `string` | | Optional node identifier rendered after a `·` separator |
| `verified` | `boolean` | | When `true`, renders a green checkmark indicating TeneT-verified data |
| `size` | `'sm' \| 'md'` | | Default `'md'` |
| `className` | `string` | | Additional Tailwind classes |

```tsx
import { GameNodeBadge } from '@njz/ui';

<GameNodeBadge gameId="valorant" nodeId="match-2026-05-11-001" verified size="sm" />
```

## Sub-components and utilities (advanced)

Re-exported from `GameNodeIDFrame` for consumers that want to compose their own layouts:

| Export | Purpose |
|---|---|
| `QuarterCard` | Individual card used inside `GameNodeIDFrame`. Takes a full `Quarter` object. |
| `AnalyticsIcon`, `CommunityIcon`, `TrophyIcon`, `ChartIcon` | Quarter icon set |
| `QUARTER_ICONS` | Map of `QuarterId → IconComponent` |
| `DEFAULT_QUARTERS` | Default quarter configurations (id, name, description, route, color, branchCount) |
| `QUARTER_ORDER` | Canonical render order: `['SATOR', 'AREPO', 'OPERA', 'ROTAS']` |
| `ANIMATION` | Animation timing constants (ms) |
| `A11Y` | Accessibility label builders |
| `mergeQuarters` | Deep-merge user overrides with defaults |
| `prefersReducedMotion` | Reads `prefers-reduced-motion` media query |
| `getAnimationDuration` | Returns animation duration, honoring reduced-motion preference |

Types: `GameNodeIDFrameProps`, `Quarter`, `QuarterId`, `QuarterColor`, `QuarterStats`, `QuarterCardProps`.

## Component decision guide

| Scenario | Use |
|---|---|
| Game selector on `/hubs` (TeNET Directory) | `WorldPortCard` |
| Full Quarter GRID landing inside a World-Port | `GameNodeIDFrame` |
| Embedded mini Quarter GRID (sidebar, dashboard widget) | `QuarterGrid` |
| Inline game/node identifier in breadcrumb or status | `GameNodeBadge` |

## Styling

All components ship Tailwind class strings inline. There is no separate CSS bundle. Consumers must have Tailwind set up with the standard project preset — see `apps/web/tailwind.config.ts` for the canonical config.

Brand colours used:
- Valorant accent: `#ff4655`
- CS2 accent: `#f0a500`
- SATOR: `#ffd700` (gold)
- AREPO: `#0066ff` (blue) — note: `GameNodeIDFrame` uses Tailwind `green-600` palette by default
- OPERA: `#9d4edd` (purple)
- ROTAS: `#00d4ff` (cyan) — note: `GameNodeIDFrame` uses Tailwind `orange-600` palette by default

> **Known styling drift:** `QuarterGrid` (hex palette) and `GameNodeIDFrame` (Tailwind palette) use different colours for the same quarters. Phase 9.18 unifies these via design tokens — see `.agents/PHASE_GATES.md` gate 9.18.

## Accessibility

- `WorldPortCard` — `<button>` element, disabled state respected, `focus-visible` ring
- `QuarterGrid` — `role="navigation"` with `aria-label`, `aria-current="page"` on the active quadrant
- `GameNodeIDFrame` — `role="navigation"`, `role="list"` for the grid, accessibility skip-link to `#main-content`, honors `prefers-reduced-motion` via `getAnimationDuration`
- `GameNodeBadge` — descriptive `title` attribute for hover, verified icon is currently decorative (TODO: add `aria-label`)

## Development

From the repo root:

```bash
pnpm --filter @njz/ui typecheck    # Type-check this package
pnpm typecheck                      # Type-check all workspaces
```

The package compiles directly from TypeScript source (`main`, `module`, and `types` all point at `./src/index.ts`). No build step. Consumers' bundlers (Vite, Next.js) compile the TS at app build time.

When adding a new component:

1. Add the file under `src/` (top-level) or `src/components/<ComponentName>/` (for components with sub-files)
2. Export it from `src/index.ts`
3. Add an entry to this README's **Components** section with prop table + usage example
4. Add a row to the **Decision guide** table
5. If the component introduces a new type, update `.agents/SCHEMA_REGISTRY.md`

## References

- TENET architecture: [`docs/architecture/TENET_TOPOLOGY.md`](../../../docs/architecture/TENET_TOPOLOGY.md)
- Schema registry: [`.agents/SCHEMA_REGISTRY.md`](../../../.agents/SCHEMA_REGISTRY.md)
- Phase 9.19 gate: [`.agents/PHASE_GATES.md`](../../../.agents/PHASE_GATES.md)
- GameNodeIDFrame spec: `SPEC-TD-P3-001` (referenced in component source)
