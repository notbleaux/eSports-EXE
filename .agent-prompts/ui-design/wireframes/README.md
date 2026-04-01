# UI/UX Wireframes — Presentation
## eSports-EXE Frontend Design

---

## Wireframes Created

I've built **4 interactive HTML wireframes** that demonstrate the core user flows:

| # | Wireframe | Route | User Path | Description |
|---|-----------|-------|-----------|-------------|
| 1 | **TENET Portal** | `/` | Entry | Game selection, brand introduction |
| 2 | **Player Leaderboard** | `/valorant/stats/players` | Aspiring | HLTV-style dense data table |
| 3 | **Player Profile** | `/valorant/stats/players/tenz` | All | Individual player overview |

---

## How to View

Open these files in any browser:

```bash
cd /root/.openclaw/workspace/eSports-EXE/.agent-prompts/ui-design/wireframes

# Open in browser (Linux)
firefox 01-tenet-portal.html
firefox 03-player-leaderboard.html
firefox 04-player-profile.html

# Or serve locally
python3 -m http.server 8080
# Then visit http://localhost:8080
```

---

## Wireframe 1: TENET Portal

### Purpose
First impression. Game selection gateway.

### Key Elements
- **Hero section**: Gradient headline, value proposition
- **Game cards**: Valorant (active) vs CS2 (coming soon)
- **Live stats**: Match counts per game
- **Feature grid**: 6 capability highlights

### Design Decisions
- Large touch targets for mobile
- Clear status badges (Active/Coming Soon)
- Hover effects on game cards (lift + glow)

### Screenshot Preview
```
┌─────────────────────────────────────────┐
│  eSports-EXE        [Search] [Settings] │
├─────────────────────────────────────────┤
│                                         │
│     The Esports Analytics Platform      │
│     Unified stats for Valorant & CS2    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   ┌──────────────┐  ┌──────────────┐   │
│   │   🔫         │  │   🎯         │   │
│   │   VALORANT   │  │   CS2        │   │
│   │   [ACTIVE]   │  │ [Coming Soon]│   │
│   │              │  │              │   │
│   │   Live: 3    │  │              │   │
│   │   Upcoming:12│  │              │   │
│   └──────────────┘  └──────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Wireframe 2: Player Leaderboard

### Purpose
Dense stats browsing for aspiring players.

### Key Elements
- **Breadcrumb navigation**: Context within ROTAS HUB
- **Role filters**: Pill buttons (All/Duelist/Initiator/Controller/Sentinel)
- **Data table**: 10 columns, sortable, selectable
- **Comparison**: Checkbox selection → Compare button
- **Pagination**: 50 items/page

### Design Decisions
- **Very high data density** (HLTV-style)
- Monospace fonts for stats
- Color-coded role badges
- Teal accent for rating column
- Hover row highlighting

### Screenshot Preview
```
┌─────────────────────────────────────────┐
│  ← ROTAS / Players    [Compare (2)] [⚙] │
├─────────────────────────────────────────┤
│  [ROTAS] [SATOR] [OPERA] [AREPO]        │
├─────────────────────────────────────────┤
│  [All] [Duelist] [Initiator] [...]      │
├─────────────────────────────────────────┤
│  #  ☑  Player    Team  Role  K/D  ADR   │
│  ─────────────────────────────────────  │
│  1  ☑  TenZ 🇨🇦  SEN   DUEL  1.45 185.2 │
│  2  ☑  aspas 🇧🇷 LEV   DUEL  1.42 178.5 │
│  3  ☐  yay 🇺🇸   DIG   DUEL  1.38 175.3 │
│  ...                                    │
│                              Page 1/24  │
└─────────────────────────────────────────┘
```

### Data Columns
| Column | Purpose |
|--------|---------|
| # | Rank |
| ☑ | Compare selection |
| Player | Avatar + Name + Flag |
| Team | Logo + Tag |
| Role | Color-coded badge |
| K/D | Kill/Death ratio |
| ADR | Avg Damage per Round |
| ACS | Avg Combat Score |
| KAST% | Round participation |
| Rating | Overall rating (teal) |

---

## Wireframe 3: Player Profile

### Purpose
Deep dive into individual player performance.

### Key Elements
- **Profile header**: Large avatar, name, flag, team, role
- **Career stats**: 5 key metrics in card grid
- **Tab navigation**: Overview/Performance/Agents/Matches/VODs
- **Agent pool**: Horizontal bar chart (play rate)
- **Recent matches**: Result history with individual performance

### Design Decisions
- **Progressive disclosure**: Tabs hide complexity
- **Visual hierarchy**: Avatar → Name → Stats
- **Contextual actions**: Follow, Share, Compare

### Screenshot Preview
```
┌─────────────────────────────────────────┐
│  ← Players / TenZ          [Compare]    │
├─────────────────────────────────────────┤
│                                         │
│   [🎮]  TenZ 🇨🇦                        │
│         Sentinels | Duelist | Active    │
│         [+ Follow] [Share]              │
│                                         │
├─────────────────────────────────────────┤
│  Career Stats                           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │1.35│ │185 │ │285 │ │72% │ │1247│   │
│  │Rtg │ │ADR │ │ACS │ │KAST│ │Mch │   │
│  └────┘ └────┘ └────┘ └────┘ └────┘   │
├─────────────────────────────────────────┤
│  [Overview] [Perf] [Agents] [Match] [V] │
├─────────────────────────────────────────┤
│  Agent Pool (90 Days)                   │
│  Jett      ████████████████░░  42% 1.45 │
│  Raze      ██████████░░░░░░░░  28% 1.38 │
│  Neon      █████░░░░░░░░░░░░░  15% 1.52 │
│                                         │
│  Recent Matches                         │
│  Date  Tournament  vs      Score  K/D   │
│  2d    VCT Masters LOUD   2-1  ✓  24/18 │
│  3d    VCT Masters FNC    2-0  ✓  28/15 │
└─────────────────────────────────────────┘
```

---

## Design Token Validation

All wireframes use the approved design system:

| Token | Value | Usage Verified |
|-------|-------|----------------|
| `--color-primary-bg` | `#0F172A` | ✅ Page backgrounds |
| `--color-primary-bg-light` | `#1E293B` | ✅ Cards, sections |
| `--color-accent-rotas` | `#14B8A6` | ✅ Stats, active states |
| `--color-accent-opera` | `#F97316` | ✅ Live indicators |
| `--color-text-primary` | `#F8FAFC` | ✅ Headlines |
| `--color-text-secondary` | `#94A3B8` | ✅ Body text |

---

## Responsive Behavior

All wireframes include responsive breakpoints:

| Breakpoint | Changes |
|------------|---------|
| Desktop (1280px+) | Full layout, side-by-side elements |
| Tablet (768px+) | Stacked layouts, reduced padding |
| Mobile (<768px) | Single column, full-width cards |

---

## What's Missing (Intentionally)

These are **wireframes**, not final designs:

- ❌ Real images/logos (using placeholders)
- ❌ Actual data (using static examples)
- ❌ Animations/transitions (CSS only)
- ❌ Interactive charts (static bars)
- ❌ Real API connections

---

## Next Steps

**Option A: Approve and Build**
→ Start implementing React components

**Option B: Iterate on Design**
→ Adjust colors, layouts, spacing

**Option C: Add More Wireframes**
→ Create Match Detail, Player Comparison, OPERA Hub

**What's your feedback?**
