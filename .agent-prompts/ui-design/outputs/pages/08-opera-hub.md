# Page Specification: OPERA Pro Scene Hub
## Route: `/:game/pro`

---

## Purpose
Esports event hub: live matches, upcoming schedule, tournament brackets, and standings.

---

## User Story
> As a casual fan, I want to see what's happening in the pro scene right now and when my favorite team plays next.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] OPERA Pro Scene                                   [Calendar] │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔴 LIVE NOW                                                          │  Live
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │  Section
│  │ [SEN Logo]  SEN  8-4  LOUD  [LOUD Logo]     Map 2: Bind       │   │
│  │                   Live                                        │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  [Watch Stream →]  [Live Stats →]                                     │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  UPCOMING TODAY                                                       │  Schedule
│                                                                       │
│  14:00  NRG vs C9        VCT Americas   [Remind] [Stats Preview]     │
│  17:00  FNC vs TH        VCT EMEA       [Remind] [Stats Preview]     │
│  20:00  PRX vs DRX       VCT Pacific    [Remind] [Stats Preview]     │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ACTIVE TOURNAMENTS                                                   │  Tournaments
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  VCT Masters     │  │  VCT Americas    │  │  Game Changers   │    │
│  │  [Trophy Icon]   │  │  [Globe Icon]    │  │  [Star Icon]     │    │
│  │                  │  │                  │  │                  │    │
│  │  Stage: Playoffs │  │  Stage: Regular  │  │  Stage: Finals   │    │
│  │  Prize: $1M      │  │  Region: Americas│  │  Prize: $100K    │    │
│  │                  │  │                  │  │                  │    │
│  │  [View Bracket]  │  │  [Standings]     │  │  [Watch Final]   │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Live Match Card
- Team logos + names
- Current score
- Current map
- [LIVE] pulse indicator
- [Watch Stream] → External stream
- [Live Stats] → Match detail with live updates

### Schedule List
- Time (user's timezone)
- Teams (with logos)
- Tournament name
- [Remind] button
- [Stats Preview] → Team comparison

### Tournament Cards
- Tournament logo/name
- Current stage
- Prize pool
- Region (if applicable)
- Primary CTA (context-aware)

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Live match | `GET /api/rotas/matches?status=running&game=valorant&limit=1` | Live card |
| Schedule | `GET /api/rotas/matches?status=upcoming&game=valorant&date=today` | Schedule |
| Tournaments | `GET /api/rotas/tournaments?status=ongoing&game=valorant` | Tournament cards |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click live match | Navigate | Match detail |
| Click [Watch Stream] | Open | Twitch/YouTube (external) |
| Click schedule item | Navigate | Match preview |
| Click [Remind] | Toggle | Add notification |
| Click tournament card | Navigate | Tournament page |

---

## Design Tokens

```css
/* Live Indicator */
--live-pulse: #EF4444;
--live-bg: rgba(239, 68, 68, 0.1);

/* Schedule */
--time-color: #F97316;
--tournament-badge-bg: #1E293B;

/* Tournament Cards */
--card-accent: #F97316;
--prize-highlight: #EAB308;

/* Region Tags */
--region-americas: #3B82F6;
--region-emea: #8B5CF6;
--region-pacific: #F97316;
--region-china: #EF4444;
```

---

**File:** `hub-4-opera/index.tsx`  
**HUB:** OPERA
