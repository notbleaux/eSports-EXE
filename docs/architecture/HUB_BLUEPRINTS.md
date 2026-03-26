[Ver001.000]

# eSports-EXE — Hub Blueprints
## Annotated Wireframes for All Hubs

**Date**: 2026-03-22  
**Status**: Design Specification  
**Related**: MVP_v2.md, STYLE_BRIEF.md  

---

## Hub Template

All hubs follow a consistent template:

- **Layout**: Asymmetric two-column (content 65% / context 35%)
- **Structure**: Stacked panels with consistent spacing
- **Navigation**: Tabbed lenses (Overview, Live, Replays, Insights)
- **Identity**: Per-hub accent token applied to active states
- **Accessibility**: Keyboard-navigable tabs, focus-visible outlines

---

## Analytics Hub Blueprint

### Purpose
Deep match analytics, player metrics, heatmaps, compare lens.

### Primary Users
Analysts, coaches.

### Wireframe Sections

```
┌─────────────────────────────────────────────────────────────────┐
│ Analytics Hub                                   [Search] [User] │
│ [Overview] [Live] [Replays] [Insights]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │ KPI Row                             │  │ Saved Views     │  │
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │  │ - View 1        │  │
│  │ │ 24 │ │1.4 │ │98s │ │68% │       │  │ - View 2        │  │
│  │ └────┘ └────┘ └────┘ └────┘       │  │ [+ New View]    │  │
│  │ Matches K/D  Time  Win%           │  └─────────────────┘  │
│  └─────────────────────────────────────┘  ┌─────────────────┐  │
│  ┌─────────────────────────────────────┐  │ Export Actions  │  │
│  │ Match List                          │  │ [CSV] [JSON]    │  │
│  │ □ Thumbnail Score Teams        →    │  └─────────────────┘  │
│  │ □ Thumbnail Score Teams        →    │  ┌─────────────────┐  │
│  │ □ Thumbnail Score Teams        →    │  │ Player Lookup   │  │
│  │                                     │  │ [Search...]     │  │
│  │ [Compare checked matches]           │  └─────────────────┘  │
│  └─────────────────────────────────────┘                       │
│  ┌─────────────────────────────────────┐                       │
│  │ Match Detail / Compare Panel        │                       │
│  │ ┌───────────────────────────────┐   │                       │
│  │ │ MatchViewer Canvas            │   │                       │
│  │ │                               │   │                       │
│  │ │ Timeline with markers         │   │                       │
│  │ └───────────────────────────────┘   │                       │
│  │ Event filter chips                  │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Annotations

**KPI Cards**:
- Hover reveals mini sparkline chart
- Click opens filtered match list
- Updates within 200ms for demo data

**Match List**:
- Sortable by date, score, map
- Checkboxes for multi-select compare
- Quick compare button (2-4 matches)

**Timeline**:
- Marker clustering at high density
- Tooltip shows event summary + jump action
- Filter chips update chart within 200ms

**Heatmap**:
- Toggle overlay on MatchViewer
- Opacity slider in context column
- Position data from replay JSON

### Acceptance Criteria
- [ ] Timeline filters update charts within 200ms
- [ ] Compare mode synchronizes scrub across 2 viewers
- [ ] Export generates valid CSV/JSON

---

## Events Hub Blueprint

### Purpose
Schedule and present tournaments, live match pages, broadcast overlays.

### Primary Users
Organizers, casters, community managers.

### Wireframe Sections

```
┌─────────────────────────────────────────────────────────────────┐
│ Events Hub                               [+ Create Event] [User]│
│ [Calendar] [Tournaments] [Broadcast]                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │ Calendar Controls                   │  │ Quick Filters   │  │
│  │ [Day] [Week] [Month]                │  │ ☑ Live          │  │
│  │                                    │  │ ☑ Upcoming      │  │
│  │ ┌────────────────────────────────┐  │  │ ☑ Finished      │  │
│  │ │  SUN  MON  TUE  WED  THU  FRI  │  │  └─────────────────┘  │
│  │ │           1    2    3    4    5│  │  ┌─────────────────┐  │
│  │ │  6    7    8    9   10   11  12│  │  │ Event Stats     │  │
│  │ │ 13   14   15   16   17   18  19│  │  │ 12 Active       │  │
│  │ │ 20   21   22   23   24   25  26│  │  │ 48 Upcoming     │  │
│  │ │ 27   28   29   30   31         │  │  │ 156 Past        │  │
│  │ └────────────────────────────────┘  │  └─────────────────┘  │
│  └─────────────────────────────────────┘                       │
│  ┌─────────────────────────────────────┐                       │
│  │ Match Cards                         │                       │
│  │ ┌────────┐ ┌────────┐ ┌────────┐   │                       │
│  │ │ ● LIVE │ │ Upcom. │ │ Finished│   │                       │
│  │ │ Team A │ │ Team C │ │ Team E │   │                       │
│  │ │ 13 - 11│ │ vs     │ │ 8 - 13 │   │                       │
│  │ │ Team B │ │ Team D │ │ Team F │   │                       │
│  │ │ [Watch]│ │ [Remind│ │ [VOD]  │   │                       │
│  │ └────────┘ └────────┘ └────────┘   │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Event Page Panel (Expanded)

```
┌─────────────────────────────────────────────────────────────────┐
│ VCT Masters 2026                                  [Edit] [Share]│
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐  ┌────────────────────┐ │
│ │ Event Banner                        │  │ Bracket           │ │
│ │                                     │  │ ┌─────┐ ┌─────┐   │ │
│ │ Sponsor Strip                       │  │ │ QF1 │→│ SF1 │→  │ │
│ └─────────────────────────────────────┘  │ └─────┘ └─────┘   │ │
│ ┌─────────────────────────────────────┐  │                   │ │
│ │ MatchViewer (Embedded)              │  │ ┌─────┐ ┌─────┐   │ │
│ │                                     │  │ │ QF2 │→│     │   │ │
│ │ Live match or selected replay       │  │ └─────┘ └─────┘   │ │
│ └─────────────────────────────────────┘  └────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Annotations

**Match Card**:
- Status badge (Live ● / Upcoming ○ / Finished ✓)
- Quick join link for live matches
- Share button for social

**Bracket**:
- Hover reveals match summary
- Click opens event page
- Live updating for active tournaments

**Broadcast Overlay**:
- Toggles persist per event
- Preview in side panel
- Lower third controls
- Sponsor strip visibility

---

## Ops Hub Blueprint

### Purpose
Platform health, ingestion pipelines, replay processing.

### Primary Users
DevOps, platform engineers.

### Wireframe Sections

```
┌─────────────────────────────────────────────────────────────────┐
│ Ops Hub                            [Prod ▼] [Alerts] [User]    │
│ [Status] [Pipelines] [Logs] [Runbooks]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Pipeline │ │  Queue   │ │  Latency │ │  Errors  │          │
│  │   🟢     │ │   12     │ │  245ms   │ │    0     │          │
│  │ Healthy  │ │ pending  │ │  avg     │ │ 1hr      │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │ Replay Queue                        │  │ System Health   │  │
│  │ ┌──────────────────────────────┐    │  │ CPU: 45%  🟢    │  │
│  │ │ ID      Status    Actions    │    │  │ MEM: 62%  🟢    │  │
│  │ │ r-001  ✅ Done   [View]      │    │  │ DISK: 78% 🟡    │  │
│  │ │ r-002  🔄 Processing [Retry] │    │  └─────────────────┘  │
│  │ │ r-003  ❌ Failed  [Inspect]  │    │  ┌─────────────────┐  │
│  │ └──────────────────────────────┘    │  │ Quick Links     │  │
│  │                                     │  │ - API Docs      │  │
│  │ [Process Selected] [Retry Failed]   │  │ - Monitoring    │  │
│  └─────────────────────────────────────┘  │ - Incident Runbk│  │
│                                           └─────────────────┘  │
│  ┌─────────────────────────────────────┐                       │
│  │ Replay Inspector (selected)         │                       │
│  │ ┌──────────────┐ ┌───────────────┐  │                       │
│  │ │ Mini Viewer  │ │ Metadata      │  │                       │
│  │ │              │ │ Duration: 45m │  │                       │
│  │ │ Raw events   │ │ Size: 2.3GB   │  │                       │
│  │ │ list below   │ │ Errors: 3     │  │                       │
│  │ └──────────────┘ └───────────────┘  │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Annotations

**Status Tiles**:
- Color coded (🟢 healthy / 🟡 warning / 🔴 critical)
- Click to drill into logs
- Auto-refresh every 30s

**Replay Queue**:
- Bulk actions (process, retry, delete)
- Filter by status
- Sort by timestamp

**Replay Inspector**:
- Small MatchViewer with raw events
- Metadata panel with error details
- Reprocess action

**Security Note**: Redact sensitive runbooks; link to private internal docs.

---

## TeNET CS Blueprint

### Purpose
CS-specific training and analysis tools.

### Primary Users
Coaches, players.

### Wireframe Sections

```
┌─────────────────────────────────────────────────────────────────┐
│ TeNET CS                              [Map ▼] [Drill+] [User]  │
│ [Training] [Rounds] [Heatmaps] [Lineups]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │ Training Panel                      │  │ Drill Library   │  │
│  │ ┌───────────────────────────────┐   │  │ - Smoke Lineup  │  │
│  │ │                               │   │  │ - Flash Assist  │  │
│  │ │    MatchViewer Canvas         │   │  │ - Molly Spot    │  │
│  │ │    with Grenade Visualizer    │   │  │ - Execute A     │  │
│  │ │                               │   │  │ [+ Create]      │  │
│  │ │    🧨 ← Grenade arc drawn     │   │  └─────────────────┘  │
│  │ │    on map overlay             │   │  ┌─────────────────┐  │
│  │ │                               │   │  │ Tick Accuracy   │  │
│  │ └───────────────────────────────┘   │  │ 128 tick        │  │
│  │                                     │  │ Frame: 8472     │  │
│  │ Timeline with grenade activation    │  └─────────────────┘  │
│  │ markers (▲ flash, 🧨 explode, 💨 smoke)                       │
│  └─────────────────────────────────────┘                       │
│  ┌─────────────────────────────────────┐                       │
│  │ Round Breakdown                     │                       │
│  │ Round │ Economy │ Utility │ Result │                       │
│  │   1   │  $3500  │ 2F 1H   │   W    │                       │
│  │   2   │  $4200  │ 1F 2H   │   L    │                       │
│  │   3   │  $1800  │ 0F 1H   │   W    │ ← Click to jump     │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Annotations

**Grenade Visualizer**:
- Interactive arcs drawn on map
- Scrub timeline to see arc activation
- Click arc to see details (tick, position)

**Round Table**:
- Compact rows
- Click to jump to round in MatchViewer
- Economy and utility summary

**Map Heatmap Panel**:
- Grenade arcs overlay
- Player density heatmap
- Toggle layers independently

---

## TeNET Valorant Blueprint

### Purpose
Valorant agent ability analysis and drills.

### Primary Users
Coaches, players.

### Wireframe Sections

```
┌─────────────────────────────────────────────────────────────────┐
│ TeNET Valorant          [Agent ▼] [Ability ▼] [Drill+] [User]  │
│ [Abilities] [Sites] [Drills] [Playlists]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │ Ability Timeline Panel              │  │ Agent Filter    │  │
│  │                                     │  │ ☑ Jett          │  │
│  │  ────────────────────────────────   │  │ ☑ Sova          │  │
│  │  │ 🌪│   │⚡│     │🌸│   │🌪│       │  │ ☐ Omen          │  │
│  │  ────────────────────────────────   │  │ ☑ Killjoy       │  │
│  │  0:00    0:30    1:00    1:30      │  └─────────────────┘  │
│  │                                     │  ┌─────────────────┐  │
│  │  Event: Tailwind (Jett) used        │  │ Ability Legend  │  │
│  │  Time: 0:42                         │  │ 🌪 Tailwind     │  │
│  │  Player: TenZ                       │  │ ⚡ Shock Dart   │  │
│  │  Position: A Main                   │  │ 🌸 Alarmbot     │  │
│  │                                     │  └─────────────────┘  │
│  └─────────────────────────────────────┘                       │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │ Site Control Panel                  │  │ Practice        │  │
│  │                                     │  │ Playlist        │  │
│  │  ┌─────────┐   ┌─────────┐         │  │                 │  │
│  │  │  A Site │   │  B Site │         │  │ 1. Ascent A     │  │
│  │  │  🌡75%  │   │  🌡25%  │         │  │    Execute      │  │
│  │  │ Control │   │ Control │         │  │ 2. Haven C      │  │
│  │  │         │   │         │         │  │    Retake       │  │
│  │  │ 🔴🔴🔴  │   │ 🟢🟢⚪  │         │  │ 3. Bind B       │  │
│  │  └─────────┘   └─────────┘         │  │    Post-Plant   │  │
│  │                                     │  │ [▶ Start]       │  │
│  │  Ability usage breakdown by site   │  │ [+ Save]        │  │
│  └─────────────────────────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Annotations

**Ability Markers**:
- Color coded by agent
- Hover shows ability details and usage count
- Click to jump to moment in replay

**Site Control Panel**:
- Occupancy heatmaps
- Ability usage by site
- Control percentage indicators

**Practice Playlist**:
- Save and share playlists
- Curated drills with annotations
- Progress tracking

---

## Component Integration Notes

### Per-Hub Theming
Apply hub class to root container:
```html
<body class="hub-analytics"> <!-- Cyan accent -->
<body class="hub-events">    <!-- Amber accent -->
<body class="hub-ops">       <!-- Violet accent -->
```

### Data Flow
- Demo JSON in `/public/api/demo/`
- Client-side fetch for dynamic content
- Static hosting compatible

### Performance
- Lazy-load heavy assets (video, heatmaps)
- Animate only transform and opacity
- Use CSS containment where possible

### Accessibility
- ARIA roles for tabs and timeline
- Keyboard navigation for all interactive elements
- Focus management on tab switch
- Reduced motion support

---

## References

- **GT Standard**: Typographic system
- **Detail.design**: Motion and craft
- **Endex**: Data panel patterns
- **Ciridae**: Hub flair and atmosphere

---

*Document Version: [Ver001.000]*  
*Last Updated: 2026-03-22*  
*Owner: Design Lead*
