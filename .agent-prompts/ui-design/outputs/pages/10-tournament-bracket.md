# Page Specification: Tournament Bracket
## Route: `/:game/pro/tournaments/:id`

---

## Purpose
Visual tournament bracket with match results, upcoming fixtures, and standings.

---

## User Story
> As a fan following a tournament, I want to see the full bracket, who played whom, and what matches are coming up next.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] ← Tournaments → VCT Masters 2024                  [Standings]│  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  VCT Masters 2024        Stage: Playoffs        Prize Pool: $1,000,000│
│                                                                       │
│  [Bracket] [Schedule] [Teams] [Stats]                                 │  Tabs
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Visual Bracket (Single Elimination Example)                          │  Bracket
│                                                                       │
│     Quarterfinals        Semifinals           Finals                  │
│                                                                       │
│  ┌───────────┐                                                          │
│  │ SEN  2-0  │────┐                                                     │
│  │   vs      │    │                                                     │
│  │ FUR  0-2  │    │    ┌───────────┐                                    │
│  └───────────┘    ├────│ SEN  2-1  │────┐                               │
│                   │    │   vs      │    │    ┌───────────┐             │
│  ┌───────────┐    │    │ LOUD 1-2  │    │    │           │             │
│  │ LOUD 2-1  │────┘    └───────────┘    ├────│   SEN     │             │
│  │   vs      │                           │    │   2-1     │             │
│  │ NRG  1-2  │    ┌───────────┐          │    │   vs      │             │
│  └───────────┘    │ LOUD 2-0  │──────────┘    │   FNC     │             │
│                   │   vs      │               │   1-2     │             │
│  ┌───────────┐    │ FNC  0-2  │               │           │             │
│  │ FNC  2-0  │────┘    └───────────┘          └───────────┘             │
│  │   vs      │                                                         │
│  │ TH   0-2  │────┐                                                     │
│  └───────────┘    │    ┌───────────┐                                    │
│                   └────│ FNC  2-1  │                                    │
│  ┌───────────┐         │   vs      │                                    │
│  │ PRX  1-2  │─────────│ TH   1-2  │                                    │
│  │   vs      │         └───────────┘                                    │
│  │ TH   2-1  │                                                          │
│  └───────────┘                                                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Tournament Header
- Tournament name + logo
- Current stage badge
- Prize pool
- Dates
- Region

### Tab Navigation
| Tab | Content |
|-----|---------|
| Bracket | Visual bracket |
| Schedule | Chronological match list |
| Teams | Participating teams |
| Stats | Tournament-wide statistics |

### Bracket Visualization
- Round labels (Quarterfinals, Semifinals, Finals)
- Match boxes with:
  - Team names
  - Team logos (small)
  - Scores
  - Winner highlight
- Connector lines between rounds
- Click match → Match detail

### Match States
| State | Visual |
|-------|--------|
| Completed | Full opacity, winner highlighted |
| Live | Pulse animation, [LIVE] badge |
| Upcoming | Lower opacity, time displayed |

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Tournament | `GET /api/rotas/tournaments/:id` | Header info |
| Bracket | `GET /api/rotas/tournaments/:id/bracket` | Bracket structure |
| Matches | `GET /api/rotas/matches?tournament=:id` | Match data |
| Teams | `GET /api/rotas/tournaments/:id/teams` | Participating teams |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click match | Navigate | Match detail |
| Click team name | Navigate | Team profile |
| Click tab | Switch | Tab content |
| Hover match | Highlight | Show match tooltip |

---

## Bracket Types

| Type | Layout |
|------|--------|
| Single Elimination | Standard tree |
| Double Elimination | Winners + Losers brackets |
| Round Robin | Grid/table |
| Swiss | Rounds with records |

---

## Design Tokens

```css
/* Bracket */
--bracket-line-color: #334155;
--bracket-line-active: #14B8A6;
--match-box-bg: #1E293B;
--match-box-width: 140px;
--match-box-height: 60px;

/* Winner Highlight */
--winner-bg: rgba(20, 184, 166, 0.1);
--winner-border: #14B8A6;
--loser-opacity: 0.6;

/* Live Match */
--live-pulse: #EF4444;

/* Round Labels */
--round-label-bg: #0F172A;
--round-label-color: #94A3B8;
```

---

**File:** `hub-4-opera/pages/TournamentBracket.tsx`  
**HUB:** OPERA
