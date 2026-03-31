# Page Specification: Player Comparison
## Route: `/:game/stats/compare?p1=:id1&p2=:id2`

---

## Purpose
Side-by-side player analysis with stat radar charts, trend comparisons, and head-to-head history.

---

## User Story
> As an aspiring player, I want to compare two pros side-by-side to understand their different playstyles and learn from both.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] ← Compare Players                               [Swap] [×]   │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────┐      ┌─────────────────────────┐        │
│  │     [TenZ Avatar]       │      │     [aspas Avatar]      │        │
│  │         TenZ            │  ⚡  │        aspas            │        │
│  │      Sentinels          │      │       Leviatán          │        │
│  │       Duelist           │      │       Duelist           │        │
│  └─────────────────────────┘      └─────────────────────────┘        │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Overview] [Radar] [Trends] [Head-to-Head] [Agents]                  │  Tabs
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Stat Comparison                                                      │  Stat
│                                                                       │  Table
│  Metric          TenZ          aspas          Advantage               │
│  ──────────────────────────────────────────────────────────           │
│  Rating          1.35    ⬜    1.32    ➡️    TenZ +0.03               │
│  ADR             185.2   ⬜    178.5   ➡️    TenZ +6.7                │
│  ACS             285.1   ⬜    272.4   ➡️    TenZ +12.7               │
│  K/D             1.45    ⬜    1.42    ➡️    TenZ +0.03               │
│  KAST%           72.5    ⬜    74.2    ⬅️    aspas +1.7%              │
│  Clutch%         18.2    ⬜    21.5    ⬅️    aspas +3.3%              │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Performance Radar                                                    │  Radar
│                                                                       │  Chart
│              K/D                                                      │
│              ▲                                                        │
│             /|\                                                       │
│            / | \                                                      │
│    ADR ◄───┼─┼─┼───► Entry                                            │
│            \ | /                                                      │
│             \|/                                                       │
│              ▼                                                        │
│           Clutch                                                      │
│                                                                       │
│  [TenZ ─── Teal]  [aspas ─── Orange]                                  │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Export Image]  [Copy Link]  [Share]                                 │  Actions
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Dual Header
- Two player cards side-by-side
- Avatar, name, team, role
- Swap button (reverses order)
- Close button (removes one player)

### Tab Navigation
| Tab | Content |
|-----|---------|
| Overview | Stat comparison table |
| Radar | 6-axis radar chart |
| Trends | Performance over time |
| Head-to-Head | Direct matchup history |
| Agents | Agent pool comparison |

### Stat Comparison Table
- Metric name
- Player 1 value
- Player 2 value
- Advantage indicator (arrow + diff)
- Visual bar showing relative values

### Radar Chart
- 6 axes: Rating, K/D, ADR, Entry, Clutch, Support
- Two overlapping polygons
- Legend with color coding
- Hover: Exact values

### Action Bar
- Export as image (PNG)
- Copy shareable link
- Share to social (Twitter, Discord)

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Player 1 stats | `GET /api/rotas/players/:id1/stats` | Comparison data |
| Player 2 stats | `GET /api/rotas/players/:id2/stats` | Comparison data |
| Head-to-head | `GET /api/rotas/matches?players=:id1,:id2` | Matchup history |

---

## Interactions

| Trigger | Action | Result |
|---------|--------|--------|
| Click player card | Navigate | To player profile |
| Click [Swap] | Reorder | p1↔p2 in URL |
| Click [×] | Remove | Back to player list |
| Click tab | Switch | Tab content updates |
| Click [Export] | Download | PNG image |
| Click [Copy Link] | Copy | URL to clipboard |

---

## Empty State
When only 1 player selected:
```
[TenZ Card]  +  [Select Second Player]
                [Search Players...]
```

---

## Design Tokens

```css
/* Player Cards */
--comparison-card-bg: #1E293B;
--comparison-card-border: #334155;

/* Advantage Indicators */
--advantage-left: #14B8A6;
--advantage-right: #F97316;
--advantage-neutral: #64748B;

/* Radar Chart */
--radar-player1: rgba(20, 184, 166, 0.5);
--radar-player2: rgba(249, 115, 22, 0.5);
--radar-grid: #334155;
```

---

**File:** `hub-2-rotas/pages/PlayerComparison.tsx`  
**HUB:** ROTAS
