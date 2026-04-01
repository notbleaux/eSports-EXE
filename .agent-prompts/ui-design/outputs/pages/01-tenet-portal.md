# Page Specification: TENET Portal (Home)
## Route: `/`

---

## Purpose
Game selection portal — the entry point for all users. Establishes brand identity and directs users to their game of interest.

---

## User Story
> As a new visitor, I want to quickly understand what this site offers and select my game, so I can access relevant esports content.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo: eSports-EXE]              [Search] [Settings]       │  Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         The Esports Analytics Platform                      │  Hero
│         Unified stats for Valorant & CS2                    │  Section
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌──────────────────┐      ┌──────────────────┐          │
│    │                  │      │                  │          │  Game
│    │   [Valorant      │      │   [CS2 Icon]     │          │  Cards
│    │    Icon]         │      │                  │          │  (2-up)
│    │                  │      │   Counter-       │          │
│    │   VALORANT       │      │   Strike 2       │          │
│    │                  │      │                  │          │
│    │   Live: 3        │      │   Coming Soon    │          │
│    │   Upcoming: 12   │      │                  │          │
│    │                  │      │                  │          │
│    └──────────────────┘      └──────────────────┘          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    What You Can Do Here:                                   │  Features
│    • Live Match Tracking    • Player Stats                 │  Grid
│    • Tournament Brackets    • Team Analytics               │
│    • Advanced Metrics       • Community Forums             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│    [Footer: About | API | GitHub | Terms]                   │  Footer
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### Header
- **Logo:** eSports-EXE wordmark + icon
- **Search:** Global search (cmd+k shortcut)
- **Settings:** Theme toggle, language (future)

### Hero Section
- **Headline:** "The Esports Analytics Platform"
- **Subhead:** "Unified stats and insights for tactical FPS"
- **Background:** Subtle animated gradient or particle effect
- **CTA:** None (games are the CTAs)

### Game Cards (2-up grid)
| Element | Valorant | CS2 |
|---------|----------|-----|
| Icon | Game logo | Game logo (grayscale) |
| Status | "Active" badge | "Coming Soon" badge |
| Live Matches | Count badge | "—" |
| Upcoming | Count badge | "—" |
| Hover | Scale 1.02, glow effect | Locked tooltip |

### Features Grid
- 6 feature highlights with icons
- Icons from Lucide: Activity, Users, Trophy, BarChart3, Brain, MessageSquare

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Live match count | `GET /api/rotas/matches?status=running` | Valorant card badge |
| Upcoming count | `GET /api/rotas/matches?status=upcoming` | Valorant card |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click Valorant card | Navigate | `/valorant` |
| Click CS2 card | Show tooltip | "Coming Q2 2026" |
| Press cmd+k | Open search | Search overlay |
| Scroll down | Parallax | Subtle background movement |

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|------------|----------------|
| Desktop (1280px+) | 2 game cards side-by-side |
| Tablet (768px+) | Stacked game cards |
| Mobile (<768px) | Single column, full-width cards |

---

## Design Tokens

```css
/* Background */
--portal-bg: #0F172A;
--portal-gradient: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);

/* Game Cards */
--card-bg: #1E293B;
--card-border: #334155;
--card-hover-border: #14B8A6;

/* Typography */
--hero-size: 48px;
--card-title-size: 24px;
```

---

## Success Metrics
- Click-through rate to game selection: >60%
- Bounce rate: <35%
- Time on page: 15-30 seconds

---

**File:** `hub-5-tenet/index.tsx`  
**HUB:** TENET (navigation layer)
