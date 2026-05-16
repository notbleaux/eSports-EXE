# @njz/ui

Shared UI component library for the NJZ eSports Platform.

## Components

### WorldPortCard
Renders a game world selector card in the TeNET Directory. Displays game information, node count, and status indicators.

```typescript
import { WorldPortCard } from '@njz/ui';

<WorldPortCard
  id="valorant-port"
  displayName="VALORANT"
  game="valorant"
  isActive={true}
  nodeCount={124}
  lastUpdated="5 mins ago"
  route="/valorant"
  onClick={() => navigate('/valorant')}
/>
```

### QuarterCard
Renders a quadrant card in the 2×2 Quarter GRID (SATOR, AREPO, OPERA, ROTAS).

```typescript
import { QuarterCard } from '@njz/ui';

<QuarterCard
  id="sator"
  name="SATOR"
  subtitle="Advanced Analytics"
  description="SimRating v2, player performance, and data deep-dives."
  color="#ffd700"
  glow="rgba(255, 215, 0, 0.4)"
  path="/valorant/analytics"
  icon={(props) => <SvgIcon {...props} />}
/>
```

## Installation

```bash
pnpm install @njz/ui
```

## Development

```bash
pnpm run dev      # Watch mode TypeScript compilation
pnpm run build    # Production build
pnpm run typecheck  # Type checking
```
