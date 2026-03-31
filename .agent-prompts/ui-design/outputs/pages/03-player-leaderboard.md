# Page Specification: Player Leaderboard
## Route: `/:game/stats/players`

---

## Purpose
Dense, data-rich player listing with filtering, sorting, and comparison selection. HLTV-style information density for power users.

---

## User Story
> As an aspiring player, I want to see ranked player stats, filter by role/team, and select players for comparison.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│  [Back] ROTAS → Players  [Search Players...]  [Compare: 2] [Filter]  │  Header
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [All] [Duelist] [Initiator] [Controller] [Sentinel]                  │  Role
│                                                                       │  Filters
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  #  Player        Team      Role    K/D    ADR    ACS    Rating  ▼   │  Data
│  ────────────────────────────────────────────────────────────────    │  Table
│  1  [✓] TenZ     SEN       Duel    1.45   185.2  285.1  1.35       │  (Sortable,
│  2  [✓] aspas    LEV       Duel    1.42   178.5  272.4  1.32       │   Selectable)
│  3  [ ] yay      DIG       Duel    1.38   175.3  265.8  1.28       │
│  4  [ ] Demon1   NRG       Duel    1.35   172.1  261.2  1.25       │
│  ...                                                                  │
│                                                                       │
│  [1] [2] [3] ... [24]  Showing 1-50 of 1,247                        │  Pagination
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Header Bar
- Breadcrumb: ROTAS → Players
- Search: Real-time player name search
- Compare badge: Shows selected count (2 max), disabled until ≥2 selected
- Filter button: Opens filter panel (region, team, stats range)

### Role Filters (Pill buttons)
- All | Duelist | Initiator | Controller | Sentinel
- Active state: Teal background (#14B8A6)
- Count badge on each (optional)

### Data Table
Columns (all sortable):
| Column | Width | Align | Format |
|--------|-------|-------|--------|
| # | 50px | center | Integer rank |
| [ ] | 40px | center | Checkbox |
| Player | 200px | left | Avatar + Name + Nationality flag |
| Team | 100px | left | Team logo + Tag |
| Role | 80px | left | Badge |
| K/D | 70px | right | Decimal (2 places) |
| ADR | 70px | right | Number |
| ACS | 70px | right | Number |
| Rating | 80px | right | Decimal (2 places) |

### Player Row Hover
- Row highlight
- Quick actions appear: View Profile, Add to Compare

### Pagination
- 50 items per page
- Page numbers + Previous/Next
- Jump to page input

---

## Data Requirements

| Data | Endpoint | Usage |
|------|----------|-------|
| Player list | `GET /api/rotas/players?game=valorant&page=1&per_page=50` | Table data |
| Search | `GET /api/rotas/players?search=tenz` | Search results |
| Filter | `GET /api/rotas/players?role=duelist` | Filtered list |
| Teams | `GET /api/rotas/teams` | Team lookup for logos |

---

## Interactions

| Trigger | Action | Destination |
|---------|--------|-------------|
| Click player name | Navigate | `/:game/stats/players/:slug` |
| Click team tag | Navigate | `/:game/stats/teams/:slug` |
| Check checkbox | Select | Add to comparison (max 2) |
| Click [Compare:N] | Navigate | `/:game/stats/compare?p1=x&p2=y` |
| Click column header | Sort | Toggle asc/desc |
| Click role filter | Filter | Update table data |

---

## Progressive Disclosure

| Tier | Visible |
|------|---------|
| Casual | Name, Team, K/D, Rating only |
| Aspiring | All columns, sorting, filtering |
| Professional | Custom column selection, export CSV |

---

## Design Tokens

```css
/* Table */
--table-header-bg: #1E293B;
--table-row-bg: #0F172A;
--table-row-alt: #1E293B;
--table-border: #334155;
--table-hover: rgba(20, 184, 166, 0.1);

/* Sort Indicator */
--sort-active: #14B8A6;
--sort-inactive: #64748B;

/* Selection */
--checkbox-checked: #14B8A6;
--compare-badge-bg: #14B8A6;
```

---

**File:** `hub-2-rotas/pages/PlayerList.tsx`  
**HUB:** ROTAS  
**Data Density:** Very High
