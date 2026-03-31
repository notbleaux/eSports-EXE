# Page Specification: Player Profile
## Route: `/:game/stats/players/:slug` (e.g., `/valorant/stats/players/tenz`)

---

## Purpose
Comprehensive player profile showing career stats, recent performance, agent pool, and match history. Three-tier progressive disclosure.

---

## User Story
> As a fan, I want to see everything about my favorite player: their stats, recent matches, and career highlights.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] ← Players → TenZ                                  [Compare]  │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Avatar]  TenZ  🇨🇦                                          [Follow]│
│            Sentinels (SEN)  |  Duelist  |  Active              [Share]│
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Career Stats                                                 │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │
│  │  │  1.35   │ │  185.2  │ │  285.1  │ │  72.5%  │ │  1,247  │ │   │  Stats
│  │  │ Rating  │ │  ADR     │ │  ACS     │ │ KAST    │ │ Matches │ │   │  Grid
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Overview] [Performance] [Agents] [Matches] [VODs]                   │  Tabs
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Agent Pool (Last 90 Days)                                            │  Agent
│                                                                       │  Section
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ Jett      ████████████████████████████████░░░░  42%  1.45 K/D │   │
│  │ Raze      ██████████████████████░░░░░░░░░░░░░░  28%  1.38 K/D │   │
│  │ Neon      ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░  15%  1.52 K/D │   │
│  │ Other     ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  15%  1.21 K/D │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Recent Matches                                                       │  Match
│                                                                       │  History
│  Tournament          Date       Opponent     Score    K/D   Rating   │
│  ───────────────────────────────────────────────────────────────────  │
│  VCT Masters         2 days ago LOUD         2-1      1.45   1.42    │
│  VCT Masters         3 days ago FNC          1-2      1.12   0.98    │
│  ...                                                                  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Profile Header
- Large avatar (120px)
- Player name + nationality flag
- Current team (clickable)
- Role badge
- Status (Active/Inactive)
- Follow button (future: notifications)
- Share button (social links)

### Career Stats Grid
5 key metrics in card layout:
- Rating (overall)
- ADR (Average Damage per Round)
- ACS (Average Combat Score)
- KAST% (% of rounds with K/A/S/T)
- Total matches

### Tab Navigation
| Tab | Content | Tier |
|-----|---------|------|
| Overview | Summary, recent highlights | Casual |
| Performance | Charts, trends over time | Aspiring |
| Agents | Agent pool breakdown | Aspiring |
| Matches | Full match history | Aspiring |
| VODs | Linked video highlights | Professional |

### Agent Pool Visualization
- Horizontal bar chart
- Agent name + portrait
- Play percentage
- K/D on that agent
- Hover: More stats (win rate, avg damage)

### Recent Matches Table
- Tournament name
- Date (relative: "2 days ago")
- Opponent team
- Match score
- Player K/D in match
- Player rating in match
- Click row → Match detail

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Player profile | `GET /api/rotas/players/:id` | Header info |
| Career stats | `GET /api/rotas/players/:id/stats` | Stats grid |
| Agent stats | `GET /api/rotas/players/:id/agents` | Agent pool |
| Recent matches | `GET /api/rotas/matches?player=:id&limit=10` | Match history |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click team name | Navigate | `/:game/stats/teams/:slug` |
| Click agent bar | Filter | Show matches on that agent |
| Click match row | Navigate | `/:game/pro/matches/:id` |
| Click [Compare] | Navigate | `/:game/stats/compare?p1=tenz` |
| Click tab | Switch | Update tab content |
| Click [Follow] | Toggle | Add to followed players |

---

## Progressive Disclosure

| Tier | Visible |
|------|---------|
| Casual | Header, stats grid, Overview tab only |
| Aspiring | All tabs, full match history, agent breakdown |
| Professional | VOD links, raw data export, API endpoint |

---

## Design Tokens

```css
/* Profile Header */
--avatar-size: 120px;
--name-size: 32px;
--team-link-color: #14B8A6;

/* Stats Cards */
--stat-card-bg: #1E293B;
--stat-value-size: 28px;
--stat-label-size: 12px;
--stat-label-color: #94A3B8;

/* Agent Bars */
--agent-bar-bg: #334155;
--agent-bar-fill: #14B8A6;
--agent-bar-height: 32px;

/* Tabs */
--tab-active-border: #14B8A6;
--tab-inactive: #64748B;
```

---

**File:** `hub-2-rotas/pages/PlayerProfile.tsx`  
**HUB:** ROTAS  
**Data Density:** High
