# Page Specification: Game Entry (Valorant/CS2)
## Route: `/:game` (e.g., `/valorant`)

---

## Purpose
Game-specific landing page. Serves as the hub directory showing live matches, upcoming schedule, and navigation to the 4 HUBs.

---

## User Story
> As a Valorant fan, I want to see what's happening right now in the pro scene and easily navigate to stats, analytics, or forums.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  VALORANT  [Logo]        [Search] [Profile]       │  Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LIVE NOW                              [View All →]         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │  Live
│  │ Match 1  │ │ Match 2  │ │ Match 3  │                    │  Matches
│  │ [LIVE]   │ │ [LIVE]   │ │ [LIVE]   │                    │  (Carousel)
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UPCOMING SCHEDULE                     [Full Schedule →]    │
│  ─────────────────────────────────────────────              │  Schedule
│  Today    14:00  Team A vs Team B      [Remind]             │  List
│  Today    17:00  Team C vs Team D      [Remind]             │
│  Tomorrow 12:00  Team E vs Team F      [Remind]             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  THE FOUR HUBS                                              │  HUB
│                                                             │  Navigation
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  (4-up
│  │  ROTAS   │  │  SATOR   │  │  OPERA   │  │  AREPO   │    │   Grid)
│  │          │  │          │  │          │  │          │    │
│  │ [Teal    │  │ [Teal    │  │ [Orange  │  │ [Orange  │    │
│  │  Icon]   │  │  Icon]   │  │  Icon]   │  │  Icon]   │    │
│  │          │  │          │  │          │  │          │    │
│  │ Stats    │  │Analytics │  │ Pro      │  │Community │    │
│  │Reference │  │  Engine  │  │  Scene   │  │  Forums   │    │
│  │          │  │          │  │          │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### Live Match Carousel
- Horizontal scroll on mobile
- 3 visible on desktop
- Shows: Team logos, score (if available), map count, [LIVE] pulse badge
- Auto-scrolls every 5 seconds (pauses on hover)

### Schedule List
- Chronological order
- Grouped by day (Today, Tomorrow, This Week)
- Each row: Time | Teams | Tournament | Remind button
- Remind button → Adds to browser notifications (future: user account)

### HUB Navigation Grid (4-up)
| HUB | Color | Icon | Description |
|-----|-------|------|-------------|
| ROTAS | Teal (#14B8A6) | BarChart | Stats Reference |
| SATOR | Teal (#14B8A6) | Brain | Advanced Analytics |
| OPERA | Orange (#F97316) | Trophy | Pro Scene |
| AREPO | Orange (#F97316) | Users | Community Forums |

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Live matches | `GET /api/rotas/matches?status=running&game=valorant` | Carousel |
| Upcoming | `GET /api/rotas/matches?status=upcoming&game=valorant&limit=5` | Schedule |
| Tournaments | `GET /api/rotas/tournaments?game=valorant` | Tournament names |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click live match | Navigate | `/:game/pro/matches/:id` |
| Click schedule item | Navigate | `/:game/pro/matches/:id` |
| Click ROTAS card | Navigate | `/:game/stats` |
| Click SATOR card | Navigate | `/:game/analytics` |
| Click OPERA card | Navigate | `/:game/pro` |
| Click AREPO card | Navigate | `/:game/community` |
| Click [Remind] | Toggle | Add/remove calendar reminder |

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop | 3 live matches visible, HUBs 4-up |
| Tablet | 2 live matches, HUBs 2×2 grid |
| Mobile | 1 live match (swipe), HUBs stacked |

---

## Design Tokens

```css
/* Section Headers */
--section-title-size: 18px;
--section-title-weight: 600;
--section-title-color: #F8FAFC;

/* Live Badge */
--live-color: #EF4444;
--live-pulse: animate-pulse;

/* HUB Cards */
--hub-rotas-color: #14B8A6;
--hub-sator-color: #14B8A6;
--hub-opera-color: #F97316;
--hub-arepo-color: #F97316;
```

---

**File:** `hub-5-tenet/GameEntry.tsx`  
**HUB:** TENET (game selection layer)
