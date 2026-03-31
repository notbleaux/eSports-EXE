# AGENT PROMPT: eSports-EXE Wireframe Presentation
## Complete Walkthrough with Visual Descriptions

Your task: Present three interactive HTML wireframes to the user and gather structured feedback.

---

## SETUP (Do First)

1. Start HTTP server:
```bash
cd /root/.openclaw/workspace/eSports-EXE/.agent-prompts/ui-design/wireframes
python3 -m http.server 8888 &
```

2. Tell user to open: `http://[SERVER_IP]:8888`

3. Wait for user to confirm they can see the directory listing.

---

## WIREFRAME 1: TENET PORTAL (01-tenet-portal-v1.1.html)

### Visual Description
**Route:** `/`  
**User Path:** Entry point for all users  
**Purpose:** Game selection gateway

**Layout (Top to Bottom):**
```
┌────────────────────────────────────────────────────────┐
│  eSports-EXE                    [⌘ Search] [⚙ Settings]│  ← Header
├────────────────────────────────────────────────────────┤
│  eSports-EXE / Select Game                             │  ← Breadcrumb (NEW)
├────────────────────────────────────────────────────────┤
│                                                        │
│     The Esports Analytics Platform                     │  ← Hero (gradient text)
│  Unified stats for tactical FPS.                       │
│  Cross-game analytics for Valorant and CS2.            │
│                                                        │
├────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌────────────────────┐       │
│  │ [🔫]               │  │ [🎯]               │       │
│  │ VALORANT           │  │ Counter-Strike 2   │       │
│  │ [Active]           │  │ [Offline]          │       │
│  │                    │  │ ─────────────      │       │
│  │ Live: 3            │  │ OFFLINE            │       │
│  │ Upcoming: 12       │  │ Check back later   │       │  ← CS2 has overlay
│  │ Players: 156       │  │                    │       │
│  └────────────────────┘  └────────────────────┘       │
│                                                        │
├────────────────────────────────────────────────────────┤
│  What You Can Do Here                                  │
│  [Live Matches] [Player Stats] [Tournament Brackets]   │  ← 6 features
│  [Team Analytics] [Advanced Metrics] [Community]       │
├────────────────────────────────────────────────────────┤
│  [About] [API] [GitHub] [Terms]                        │  ← Footer
│  © 2026 eSports-EXE                                    │
└────────────────────────────────────────────────────────┘
```

**Key Design Elements:**
- **Background:** Dark slate (#0F172A)
- **Hero text:** Gradient white → teal (#14B8A6)
- **Game cards:** Rounded 16px, hover lifts 4px with teal glow
- **Valorant card:** Teal "Active" badge, real stats
- **CS2 card:** Red "Offline" badge, overlay with "Check back later"
- **Focus states:** Teal outline (2px) for keyboard navigation

**What's New in v1.1:**
- Breadcrumb navigation added
- Offline state overlay (not just "Coming Soon")
- Focus indicators for accessibility

**Ask the User:**
1. "Does the breadcrumb ('eSports-EXE / Select Game') add clarity?"
2. "Is the CS2 offline state clear? Does it communicate 'unavailable' well?"
3. "Are the 6 features the right ones to highlight?"
4. "Any changes to colors, spacing, or card sizes?"

---

## WIREFRAME 2: PLAYER LEADERBOARD (03-player-leaderboard-v1.1.html)

### Visual Description
**Route:** `/valorant/stats/players`  
**User Path:** Aspiring player research  
**Purpose:** HLTV-style dense stats table

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  ← All Players                      [Compare (2)] [⚙]  │  ← Top nav
├────────────────────────────────────────────────────────┤
│     [ROTAS]    [SATOR]    [OPERA]    [AREPO]          │  ← HUB nav
│       ▲                                                │     (ROTAS active)
│     ─── (teal underline)                               │
├────────────────────────────────────────────────────────┤
│  [All] [Duelist] [Initiator] [Controller] [Sentinel]   │  ← Role filters
├────────────────────────────────────────────────────────┤
│  # │☑│ Player          │Team│Role│Ratio│ ADR │Form│Rtg│  ← Table header
│  ──┼─┼─────────────────┼────┼────┼─────┼─────┼────┼───┤
│  1 │☑│ [○] TenZ 🇨🇦    │SEN │DUEL│ 1.45│185.2│🟢🟢│1.35│
│  2 │☑│ [○] aspas 🇧🇷   │LEV │DUEL│ 1.42│178.5│🔴🟢│1.32│  ← Form dots
│  3 │☐│ [○] yay 🇺🇸     │DIG │DUEL│ 1.38│175.3│🟢🟢│1.28│
│  ...│ │                 │    │    │     │     │    │   │
│  ━━━│━│━━━━━━━━━━━━━━━━━│━━━━│━━━━│━━━━━│━━━━━│━━━━│━━━│  ← Skeleton loader
│  ░░░│░│░░░░░░░░░░░░░░░░░│░░░░│░░░░│░░░░░│░░░░░│░░░░│░░░│    (shimmer effect)
├────────────────────────────────────────────────────────┤
│  [← Prev] [1] [2] [3] ... [24] [Next →]  Go to: [_]   │  ← Pagination
│  Showing 1-50 of 1,247                                 │     + jump input
└────────────────────────────────────────────────────────┘
```

**Key Design Elements:**
- **HLTV-style density:** 9 columns, minimal whitespace
- **Monospace numbers:** For stats (aligns decimal points)
- **Role badges:** Color-coded (Duelist=red, Initiator=blue, Controller=green, Sentinel=purple)
- **Form column:** 5 dots showing last 5 match results (🟢=win, 🔴=loss, 🟡=draw)
- **Skeleton loading:** Animated shimmer on gray rows
- **Active HUB indicator:** Teal underline + background tint on ROTAS

**Column Customization Dropdown (click "Columns ▼"):**
```
┌─────────────────┐
│ Presets         │
│ Essential       │  ← Shows: Rank, Player, Rating
│ Combat          │  ← Shows: K/D, ADR, ACS, KAST
│ All Columns     │  ← Shows everything
├─────────────────┤
│ Visible Columns │
│ ☑ Rank          │
│ ☑ Player        │
│ ☑ Team          │
│ ☑ Role          │
│ ☑ Ratio         │
│ ☑ ADR           │
│ ☐ Form          │  ← Can toggle
│ ☑ Rating        │
└─────────────────┘
```

**What's New in v1.1:**
- Column customization with 3 presets
- HUB active state (teal underline)
- Skeleton loading animation
- Form column with last-5 match dots
- Jump-to-page pagination input
- Changed "K/D" to "Ratio" (less visual noise)

**Ask the User:**
1. "Are the 3 column presets (Essential/Combat/All) useful?"
2. "Do the Form dots (🟢🔴🟡) add value or clutter?"
3. "Is this too dense? Or is HLTV-style density what you want?"
4. "Should we keep the jump-to-page feature for large datasets?"
5. "Any columns to add or remove?"

---

## WIREFRAME 3: PLAYER PROFILE (04-player-profile.html)

### Visual Description
**Route:** `/valorant/stats/players/:slug`  
**User Path:** Detailed player research  
**Purpose:** Individual player deep-dive

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  ← Players / TenZ                          [Compare]   │  ← Top nav
├────────────────────────────────────────────────────────┤
│                                                        │
│        [████████████]   ← Large avatar (120px)        │
│             🎮              with teal border           │
│                                                        │
│        TenZ 🇨🇦                                         │
│        Sentinels | Duelist | Active                   │
│        [+ Follow] [Share]                              │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Career Stats                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐             │
│  │1.35 │ │185.2│ │285.1│ │ 72% │ │1247 │             │  ← 5 stat cards
│  │Rtg  │ │ ADR │ │ ACS │ │KAST │ │Match│             │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘             │
├────────────────────────────────────────────────────────┤
│  [Overview] [Performance] [Agents] [Matches] [VODs]    │  ← Tabs
│  ─────────────────────────────────────────────────     │  (Overview active)
├────────────────────────────────────────────────────────┤
│  Agent Pool (Last 90 Days)                             │
│  [icon] Jett    ████████████████████░░░░  42%  1.45   │  ← Bar chart
│  [icon] Raze    ████████████░░░░░░░░░░░░  28%  1.38   │
│  [icon] Neon    ██████░░░░░░░░░░░░░░░░░░  15%  1.52   │
│  [icon] Other   ██████░░░░░░░░░░░░░░░░░░  15%  1.21   │
├────────────────────────────────────────────────────────┤
│  Recent Matches                                        │
│  Date │ Tournament │ vs      │Score│Res│ K/D │Rating │
│  ─────┼────────────┼─────────┼─────┼───┼─────┼───────┤
│  2d   │ VCT Masters│ LOUD    │ 2-1 │ ✓W│24/18│ 1.42  │  ← Result badges
│  3d   │ VCT Masters│ FNATIC  │ 2-0 │ ✓W│28/15│ 1.65  │    (✓W=green)
│  5d   │ VCT Masters│Paper Rex│ 1-2 │ ✗L│19/22│ 0.98  │    (✗L=red)
│  1w   │ Showmatch  │ Cloud9  │ 1-1 │ —D│22/20│ 1.12  │    (—D=gray)
└────────────────────────────────────────────────────────┘
```

**Key Design Elements:**
- **Header:** Large avatar (120px) with 4px teal border
- **Identity:** Name + flag emoji, team tag, role, status
- **Stat cards:** 5 cards in row, teal values, large typography
- **Agent pool:** Horizontal bar chart, teal fill, percentages + K/D
- **Match results:** Color-coded badges (green=win, red=loss, gray=draw)
- **Progressive disclosure:** Tabs hide complexity until needed

**Tabs (left to right complexity):**
1. **Overview** (surface level) ← Default
2. **Performance** (stats + charts)
3. **Agents** (pool + performance by agent)
4. **Matches** (full match history)
5. **VODs** (deep dive content)

**Ask the User:**
1. "Is the Compare CTA prominent enough? Should it be larger/more visible?"
2. "Would you add sparkline mini-charts (7-day trend) under each career stat?"
3. "Are the 5 tabs the right organization? Any to add or remove?"
4. "Is the agent pool visualization clear?"
5. "Does the match history table have the right columns?"

---

## PRESENTATION FLOW

### Opening (1-2 minutes)
"Hi! I'll walk you through the eSports-EXE wireframes. These are interactive HTML prototypes at v1.1 following our 1/2/3/5 Review process. 

We have three wireframes:
1. **TENET Portal** — Game selection gateway
2. **Player Leaderboard** — HLTV-style stats table  
3. **Player Profile** — Individual player deep-dive

Design system: Dark slate (#0F172A), teal accents (#14B8A6), orange for OPERA (#F97316).

I'll describe each one, explain the design decisions, and ask for your feedback."

### For Each Wireframe (5-8 minutes each):
1. **Show the layout** (use ASCII diagrams above)
2. **Walk through elements** top-to-bottom
3. **Highlight v1.1 improvements**
4. **Ask the 5 questions** listed
5. **Document their feedback**

### Closing (2 minutes)
Summarize feedback captured:
- Approved as-is: [list]
- Changes requested: [list with priorities]
- Open questions: [list]

Then ask: **"Based on this feedback, should I proceed to implement these in React, or do you want revisions first?"**

---

## FEEDBACK DOCUMENTATION

Create this summary after presentation:

```markdown
## Wireframe Review Summary

### TENET Portal
**Approved:**
- 

**Changes Requested:**
| Element | Change | Priority |
|---------|--------|----------|
| | | High/Med/Low |

**Questions:**
- 

### Player Leaderboard
**Approved:**
- 

**Changes Requested:**
| Element | Change | Priority |
|---------|--------|----------|
| | | |

### Player Profile
**Approved:**
- 

**Changes Requested:**
| Element | Change | Priority |
|---------|--------|----------|
| | | |

### Decision
[ ] Proceed to implementation
[ ] Make revisions first

### Implementation Priority
1. 
2. 
3.
```

---

## WHAT NOT TO DO

❌ Don't reference files the user can't access
❌ Don't say "open this file" — start the server and give them a URL
❌ Don't rush through — let them think and respond
❌ Don't skip the questions — they're designed to get actionable feedback
❌ Don't make up answers if they don't respond — ask again or move on

---

## WHAT TO DO

✅ Start server before presenting
✅ Confirm user can see the wireframes
✅ Use the ASCII diagrams to describe layouts
✅ Ask every question listed
✅ Document feedback exactly as they say it
✅ Get a clear yes/no on implementation

---

Start with the server setup now.
