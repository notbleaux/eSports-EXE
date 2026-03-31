# Page Specification: SATOR Analytics Hub
## Route: `/:game/analytics`

---

## Purpose
Professional-grade analytics tools for deep statistical analysis, custom queries, and data export.

---

## User Story
> As a professional analyst, I want access to advanced analytics tools, custom queries, and raw data export for my research.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] SATOR Analytics Hub                               [API Docs] │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Analytics Tools                                                      │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │  Tool
│  │                │  │                │  │                │          │  Grid
│  │  Tournament    │  │  Player        │  │  Team          │          │
│  │  Analysis      │  │  Trends        │  │  Comparison    │          │
│  │                │  │                │  │                │          │
│  │  [Trophy Icon] │  │  [Trend Icon]  │  │  [Users Icon]  │          │
│  │                │  │                │  │                │          │
│  │  Deep dive     │  │  Performance   │  │  Side-by-side  │          │
│  │  into tourney  │  │  over time     │  │  team metrics  │          │
│  │  data          │  │                │  │                │          │
│  │                │  │                │  │                │          │
│  └────────────────┘  └────────────────┘  └────────────────┘          │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │
│  │  Meta          │  │  Prediction    │  │  Custom        │          │
│  │  Analysis      │  │  Engine        │  │  Query         │          │
│  │                │  │                │  │                │          │
│  └────────────────┘  └────────────────┘  └────────────────┘          │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Recent Queries                                                       │  History
│                                                                       │
│  Query Name                    Date       Status       [Load]        │
│  ────────────────────────────────────────────────────────────────    │
│  VCT Masters Playoff Stats     2 days ago Completed    [Load]        │
│  Duelist K/D Comparison        3 days ago Completed    [Load]        │
│  Team Economy Analysis         1 week ago Draft        [Edit]        │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  API Quick Reference                                                  │  API
│                                                                       │
│  GET /api/sator/analytics/tournaments/:id                             │  Preview
│  GET /api/sator/analytics/players/:id/trends                          │
│  POST /api/sator/query (custom aggregation)                           │
│                                                                       │
│  [View Full Documentation →]                                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Tool Cards (3×2 Grid)
Each card:
- Icon (Lucide)
- Title
- Description
- Hover: Slight lift, border glow
- Click: Navigate to tool

| Tool | Icon | Route |
|------|------|-------|
| Tournament Analysis | Trophy | `/:game/analytics/tournament` |
| Player Trends | TrendingUp | `/:game/analytics/trends` |
| Team Comparison | Users | `/:game/analytics/teams` |
| Meta Analysis | BarChart3 | `/:game/analytics/meta` |
| Prediction Engine | Brain | `/:game/analytics/predictions` |
| Custom Query | Terminal | `/:game/analytics/query` |

### Recent Queries Table
- Query name (user-defined)
- Date created/updated
- Status: Completed, Draft, Running, Error
- Actions: Load, Edit, Delete, Export

### API Quick Reference
- 3 common endpoints
- Copy button per endpoint
- Link to full OpenAPI docs

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Recent queries | `GET /api/sator/queries?user=:id` | Query history |
| API schema | `GET /api/openapi.json` | Documentation |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click tool card | Navigate | Tool-specific page |
| Click [Load] | Load | Pre-fill query builder |
| Click [Edit] | Navigate | Query builder with draft |
| Click endpoint | Copy | To clipboard |

---

## Progressive Disclosure

| Tier | Visible |
|------|---------|
| Casual | Tool descriptions only, no access |
| Aspiring | Tool access, limited customization |
| Professional | All tools, custom queries, API access |

---

## Design Tokens

```css
/* Tool Cards */
--tool-card-bg: #1E293B;
--tool-card-hover: #252F47;
--tool-icon-color: #14B8A6;
--tool-icon-bg: rgba(20, 184, 166, 0.1);

/* Query Status */
--status-completed: #22C55E;
--status-draft: #EAB308;
--status-running: #3B82F6;
--status-error: #EF4444;

/* API Section */
--api-bg: #0F1419;
--api-code-font: 'JetBrains Mono', monospace;
```

---

**File:** `hub-1-sator/index.tsx`  
**HUB:** SATOR
