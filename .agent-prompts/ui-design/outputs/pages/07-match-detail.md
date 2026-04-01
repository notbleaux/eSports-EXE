# Page Specification: Match Detail
## Route: `/:game/pro/matches/:id`

---

## Purpose
Complete match breakdown with round-by-round data, player stats, economy tracking, and VOD links.

---

## User Story
> As a fan who missed the live match, I want to see the full breakdown: who won each round, key plays, and individual performances.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] ← Matches → VCT Masters: SEN vs LOUD               [Watch]   │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                                                               │   │
│  │    [SEN Logo]        FINAL        [LOUD Logo]                 │   │  Match
│  │                                                               │   │  Header
│  │    Sentinels         2-1          LOUD                        │   │
│  │    (SEN)                                                      │   │
│  │                                                               │   │
│  │    Map 1: Ascent   13-11                                      │   │
│  │    Map 2: Bind     10-13                                      │   │
│  │    Map 3: Haven    13-9                                       │   │
│  │                                                               │   │
│  │              [Full VOD]  [Highlights]                         │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Overview] [Scoreboard] [Rounds] [Economy] [Timeline]                │  Tabs
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Match Scoreboard                                                     │
│                                                                       │
│  Sentinels                                                            │  Team
│  ────────────────────────────────────────────────────────────────    │  1
│  Player      K    D    A    K/D    ADR    HS%    FK    FD    Rating   │
│  TenZ        24   18   6    1.33   187.5  32%    4     2     1.35     │
│  zekken      21   20   8    1.05   165.2  28%    3     3     1.12     │
│  ...                                                                  │
│                                                                       │
│  LOUD                                                                 │  Team
│  ────────────────────────────────────────────────────────────────    │  2
│  aspas       26   19   4    1.37   192.3  35%    5     3     1.42     │
│  Less        19   21   12   0.90   142.8  22%    2     4     0.95     │
│  ...                                                                  │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Round Breakdown                                                      │  Rounds
│                                                                       │
│  Rnd  Winner  Type     Score  Key Play                               │
│  ────────────────────────────────────────────────────────────────    │
│  1    SEN     Pistol   1-0    TenZ 3k with Sheriff                    │
│  2    SEN     Eco      2-0    zekken clutch 1v2                       │
│  3    LOUD    Force    2-1    aspas 4k rifle buy                      │
│  ...                                                                  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Match Header
- Team logos (large)
- Final score
- Individual map scores
- [Watch] button → YouTube VOD
- [Highlights] → Key moments

### Tab Navigation
| Tab | Content |
|-----|---------|
| Overview | Summary, MVP, key stats |
| Scoreboard | Full player stats table |
| Rounds | Round-by-round breakdown |
| Economy | Buy patterns, money flow |
| Timeline | Chronological events |

### Scoreboard Table
Two team tables with columns:
- Player name (clickable to profile)
- K (kills)
- D (deaths)
- A (assists)
- K/D ratio
- ADR
- HS% (headshot percentage)
- FK (first kills)
- FD (first deaths)
- Rating (overall)

### Round Breakdown
- Round number
- Winner (team color)
- Round type (pistol, eco, force, full buy)
- Score at that point
- Key play description
- Click row → Round detail view

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Match details | `GET /api/rotas/matches/:id` | Header, maps |
| Player stats | `GET /api/rotas/matches/:id/stats` | Scoreboard |
| Round data | `GET /api/rotas/matches/:id/rounds` | Round breakdown |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click player name | Navigate | Player profile |
| Click team logo | Navigate | Team profile |
| Click [Watch] | Open | YouTube VOD |
| Click round row | Expand | Round detail overlay |
| Click tab | Switch | Tab content |

---

## Progressive Disclosure

| Tier | Visible |
|------|---------|
| Casual | Final score, winner, basic stats |
| Aspiring | Full scoreboard, round breakdown |
| Professional | Economy data, heatmaps, downloadable demo |

---

## Design Tokens

```css
/* Match Header */
--header-bg: #1E293B;
--winner-glow: 0 0 30px rgba(20, 184, 166, 0.3);
--loser-opacity: 0.7;

/* Map Scores */
--map-win: #22C55E;
--map-loss: #EF4444;

/* Scoreboard */
--team1-bg: rgba(20, 184, 166, 0.05);
--team2-bg: rgba(249, 115, 22, 0.05);
--stat-highlight: #14B8A6;

/* Round Types */
--type-pistol: #F59E0B;
--type-eco: #EF4444;
--type-force: #F97316;
--type-full: #22C55E;
```

---

**File:** `hub-4-opera/pages/MatchDetail.tsx`  
**HUB:** OPERA
