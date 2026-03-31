# Page Specification: Team Profile
## Route: `/:game/stats/teams/:slug`

---

## Purpose
Team overview with roster, recent results, tournament history, and team stats.

---

## User Story
> As a fan of a specific team, I want to see their current roster, recent match results, and how they're performing in tournaments.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] ← Teams → Sentinels                              [Follow]   │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Logo]  Sentinels  [SEN]  🇺🇸  [Follow] [Share]                      │
│          "SEN"                                                        │
│          Rank #3  |  1562 Elo  |  68% Win Rate                        │
│                                                                       │
│  [Website] [Twitter/X] [YouTube] [Instagram]                          │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Active Roster                                                        │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ [Avatar] │  │ [Avatar] │  │ [Avatar] │  │ [Avatar] │  │ [Avatar] ││  Roster
│  │          │  │          │  │          │  │          │  │          ││  Grid
│  │   TenZ   │  │  zekken  │  │   Sacy   │  │  pANcada │  │  zellsis ││
│  │          │  │          │  │          │  │          │  │          ││
│  │ Duelist  │  │ Duelist  │  │ Initiator│  │Controller│  │ Sentinel ││
│  │   IGL    │  │          │  │          │  │          │  │          ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Recent Results                                                       │  Results
│                                                                       │
│  Date      Tournament    Opponent    Score    Result                   │
│  ────────────────────────────────────────────────────────────         │
│  2d ago    VCT Masters   LOUD        2-1      ✅ Win                   │
│  3d ago    VCT Masters   FNC         2-0      ✅ Win                   │
│  5d ago    VCT Masters   PRX         1-2      ❌ Loss                  │
│  1w ago    Showmatch     C9          1-1      🤝 Draw                  │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Tournament History                                                   │  History
│                                                                       │
│  Tournament              Date        Placement    Prize               │
│  ────────────────────────────────────────────────────────────         │
│  VCT Masters 2024        Mar 2024    1st          $300,000            │
│  VCT Kickoff 2024        Feb 2024    2nd          $100,000            │
│  Champions 2023          Aug 2023    3-4th        $80,000             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Team Header
- Large team logo
- Team name + tag
- Region flag
- Current rank + Elo
- Win rate
- Follow button
- Social links (external)

### Roster Grid
- Player cards (5 for Valorant)
- Avatar
- Name
- Role badge
- IGL indicator (if applicable)
- Click → Player profile

### Recent Results Table
- Date (relative)
- Tournament name
- Opponent
- Score
- Result badge (Win/Loss/Draw)
- Click → Match detail

### Tournament History
- Tournament name
- Date
- Placement
- Prize (if available)
- Click → Tournament page

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Team profile | `GET /api/rotas/teams/:id` | Header info |
| Roster | `GET /api/rotas/teams/:id/players` | Roster grid |
| Recent matches | `GET /api/rotas/matches?team=:id&limit=10` | Results |
| Tournaments | `GET /api/rotas/tournaments?team=:id` | History |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click player | Navigate | Player profile |
| Click match | Navigate | Match detail |
| Click tournament | Navigate | Tournament page |
| Click [Follow] | Toggle | Add to followed teams |
| Click social icon | Open | External link |

---

## Design Tokens

```css
/* Team Header */
--team-logo-size: 100px;
--rank-badge-bg: #1E293B;
--rank-number-color: #F97316;

/* Roster Cards */
--player-card-bg: #1E293B;
--role-badge-bg: rgba(20, 184, 166, 0.1);
--role-badge-color: #14B8A6;
--igl-star-color: #EAB308;

/* Results */
--win-color: #22C55E;
--loss-color: #EF4444;
--draw-color: #64748B;

/* History */
--placement-1st: #EAB308;
--placement-2nd: #94A3B8;
--placement-3rd: #B45309;
```

---

**File:** `hub-2-rotas/pages/TeamProfile.tsx`  
**HUB:** ROTAS
