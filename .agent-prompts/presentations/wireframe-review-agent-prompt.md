# AGENT PROMPT: Present eSports-EXE Wireframes to User
## Task: Walk User Through UI/UX Wireframe Review

**Your Role:** UI/UX Presentation Agent  
**Task:** Present eSports-EXE wireframes to the user in a structured, visual walkthrough  
**Format:** 40/40 — Up to 40 segments, 40 seconds of user attention per segment  
**Goal:** Get user feedback and approval on wireframe designs before implementation

---

## Context

You are presenting **interactive HTML wireframes** for the eSports-EXE esports analytics platform. These wireframes were created following the 1/2/3/5 Master Review Framework and represent the v1.1 refined designs.

### Wireframe Files Location
```
/root/.openclaw/workspace/eSports-EXE/.agent-prompts/ui-design/wireframes/
├── 01-tenet-portal-v1.1.html          (17KB)
├── 03-player-leaderboard-v1.1.html    (25KB)
├── 04-player-profile.html             (18KB)
└── README.md                          (Documentation)
```

### Design System
- **Primary Background:** #0F172A (dark slate)
- **ROTAS Accent:** #14B8A6 (teal)
- **OPERA Accent:** #F97316 (orange)
- **Text Primary:** #F8FAFC
- **Text Secondary:** #94A3B8

---

## Presentation Structure (40 Segments)

### SECTION 1: Introduction & Context (Segments 1-5)

**Segment 1: Opening**
- Greet the user
- State your purpose: "I'll walk you through the eSports-EXE wireframes"
- Confirm time: "This will take about 30-40 minutes with your feedback"
- Ask: "Ready to begin?"

**Segment 2: What Are Wireframes?**
- Explain: Wireframes = interactive HTML prototypes
- Not final code, but close to final visual design
- Show layout, spacing, colors, navigation
- Can click through in browser
- **Action:** Tell user where files are located

**Segment 3: Design Philosophy Recap**
- TENET = Navigation layer (not content hub)
- 4 HUBs: ROTAS (stats), SATOR (analytics), OPERA (pro scene), AREPO (community)
- Progressive Disclosure: 3 user tiers (Casual/Aspiring/Professional)
- Cross-game unification (Valorant ↔ CS2)

**Segment 4: 1/2/3/5 Review Applied**
- Mention wireframes went through Review 1
- Changes made: Component states, navigation, data density
- Architecture Maturity Score: 6.5/10

**Segment 5: How to View**
- Give user the terminal command:
  ```bash
  cd /root/.openclaw/workspace/eSports-EXE/.agent-prompts/ui-design/wireframes
  python3 -m http.server 8888
  ```
- Tell them to open browser to `http://localhost:8888`
- Wait for confirmation before proceeding

---

### SECTION 2: TENET Portal Wireframe (Segments 6-15)

**Segment 6: Overview**
- File: `01-tenet-portal-v1.1.html`
- Route: `/`
- Purpose: Game selection gateway
- User Path: Entry point for all users

**Segment 7: Header & Navigation**
- Show: Breadcrumb (NEW in v1.1)
- Show: Logo + Search + Settings
- Highlight: "eSports-EXE / Select Game" breadcrumb
- Ask: "Is this navigation clear?"

**Segment 8: Hero Section**
- Show: Gradient headline "The Esports Analytics Platform"
- Show: Subtitle about unified stats
- Color: Gradient from white to teal
- Ask: "Does this value proposition resonate?"

**Segment 9: Game Cards - Valorant (Active)**
- Show: Large card with 🔫 icon
- Stats: 3 live, 12 upcoming, 156 players
- Status badge: "Active" (teal)
- Hover effect: Lift + glow
- Ask: "Is this the right hierarchy?"

**Segment 10: Game Cards - CS2 (Offline State - NEW)**
- Show: Offline overlay (v1.1 addition)
- Opacity reduced, "Offline" badge (red)
- "Check back later" message
- Ask: "Does this offline state work for you?"

**Segment 11: Feature Grid**
- Show: 6 features in 2 rows
- Icons: Live Matches, Player Stats, Tournament Brackets, Team Analytics, Advanced Metrics, Community Forums
- Ask: "Are these the right features to highlight?"

**Segment 12: Responsive Behavior**
- Explain: Desktop → Tablet → Mobile breakpoints
- Mobile: Single column, hamburger menu
- Touch targets: Minimum 44px
- Ask: "Any concerns about mobile layout?"

**Segment 13: Component States Demo**
- Show: Default, Hover, Focus, Offline states
- Mention: State demo panel in top-right
- Explain: Each component has documented states
- Ask: "Are we missing any states?"

**Segment 14: Accessibility Features**
- Highlight: Focus indicators (teal outline)
- Highlight: ARIA labels on cards
- Highlight: Keyboard navigation support
- Ask: "Any accessibility requirements we're missing?"

**Segment 15: TENET Portal Feedback**
- Ask for specific feedback:
  1. "Does the game selection flow feel intuitive?"
  2. "Is the offline state clear enough?"
  3. "Would you change any colors or spacing?"
- Document their responses

---

### SECTION 3: Player Leaderboard Wireframe (Segments 16-28)

**Segment 16: Overview**
- File: `03-player-leaderboard-v1.1.html`
- Route: `/valorant/stats/players`
- Purpose: HLTV-style dense stats table
- User Path: Aspiring player research

**Segment 17: Top Navigation**
- Show: Breadcrumb "← All Players"
- Show: Search box, Compare button, Filter, Columns dropdown
- **NEW in v1.1:** "All Players" instead of generic "Back"
- Ask: "Is this navigation context clear?"

**Segment 18: HUB Navigation (Enhanced)**
- Show: ROTAS | SATOR | OPERA | AREPO
- **NEW in v1.1:** Active state indicator (teal underline on ROTAS)
- Show: Background highlight on active HUB
- Ask: "Does this make HUB location obvious?"

**Segment 19: Role Filters**
- Show: Pill buttons (All, Duelist, Initiator, Controller, Sentinel)
- Active state: Filled teal
- Explain: Quick filtering by agent role
- Ask: "Are these the right filter options?"

**Segment 20: Column Customization (NEW in v1.1)**
- Show: "Columns ▼" dropdown
- Show: 3 presets (Essential, Combat, All)
- Show: Individual column toggles
- Ask: "Are the 3 presets useful? What would you change?"

**Segment 21: Data Table Structure**
- Columns: #, ☑, Player, Team, Role, Ratio, ADR, Form, Rating
- **UPDATE in v1.1:** "K/D" → "Ratio" (reduced visual noise)
- **NEW in v1.1:** "Form" column with last-5 dots
- Sortable headers with arrow indicators

**Segment 22: Player Row Detail**
- Show: Avatar + Name + Flag
- Show: Team logo + tag
- Show: Role badges (color-coded)
- Show: Form dots (🟢🟢🔴🟢🟡)
- Ask: "Is this the right level of detail per row?"

**Segment 23: Comparison Feature**
- Show: Checkbox selection
- Show: "Compare (2)" button (active when 2+ selected)
- Explain: Multi-select for side-by-side comparison
- Ask: "Is this comparison flow intuitive?"

**Segment 24: Skeleton Loading State (NEW in v1.1)**
- Show: Animated shimmer rows
- Explain: Appears while data loads
- Reduces perceived wait time
- Ask: "Does this loading state look right?"

**Segment 25: Pagination & Jump to Page (NEW in v1.1)**
- Show: Prev/Next + page numbers
- **NEW:** "Go to:" input field
- Explain: For large datasets (1,000+ players)
- Ask: "Is the jump-to-page feature necessary?"

**Segment 26: Empty & Error States**
- Explain: Empty state when no results
- Explain: Error state with retry button (v1.1)
- Show: Helpful error messages (not just red text)
- Ask: "Are these error/empty states user-friendly?"

**Segment 27: Data Density Discussion**
- Highlight: 10 columns visible
- Explain: Essential preset shows only 4 (Rank, Player, Team, Rating)
- Target: HLTV-level density for power users
- Ask: "Is this too dense? Or just right?"

**Segment 28: Leaderboard Feedback**
- Ask for specific feedback:
  1. "Is the column customization useful?"
  2. "Are the Form dots valuable?"
  3. "Would you add/remove any columns?"
- Document their responses

---

### SECTION 4: Player Profile Wireframe (Segments 29-36)

**Segment 29: Overview**
- File: `04-player-profile.html`
- Route: `/valorant/stats/players/:slug`
- Purpose: Individual player deep-dive
- User Path: Detailed player research

**Segment 30: Profile Header**
- Show: Large avatar (120px) with teal border
- Show: Name + Flag (TenZ 🇨🇦)
- Show: Team | Role | Status (Sentinels | Duelist | Active)
- Show: Actions [+ Follow] [Share] [Compare]
- Ask: "Is the header hierarchy effective?"

**Segment 31: Career Stats Cards**
- Show: 5 stat cards in row
- Stats: Rating (1.35), ADR (185.2), ACS (285.1), KAST (72%), Matches (1,247)
- Teal accent on values
- **NOT in v1.1 yet:** Sparkline trends (recommendation from Review 1)
- Ask: "Would sparkline mini-charts below each stat be valuable?"

**Segment 32: Tab Navigation**
- Show: [Overview] [Performance] [Agents] [Matches] [VODs]
- Active: Overview (teal underline)
- Explain: Progressive disclosure of complexity
- Ask: "Are these the right tabs? Any missing?"

**Segment 33: Agent Pool Visualization**
- Show: Horizontal bar chart
- Agents: Jett (42%), Raze (28%), Neon (15%), Other (15%)
- Color: Teal bars on dark background
- Show: Play rate + K/D per agent
- Ask: "Is this agent distribution visualization clear?"

**Segment 34: Recent Matches Table**
- Show: Date, Tournament, Opponent, Score, Result, K/D, Rating
- Result badges: Green ✓ Win, Red ✗ Loss, Gray — Draw
- Highlight: Rating column (teal for good performance)
- Ask: "Is this match history useful? What would you add?"

**Segment 35: Progressive Disclosure Analysis**
- Explain: Overview → Performance → Agents → Matches → VODs
- Complexity increases left to right
- Casual users see surface, pros dig deep
- Ask: "Does this disclosure pattern match your mental model?"

**Segment 36: Profile Feedback**
- Ask for specific feedback:
  1. "Is the Compare CTA prominent enough?"
  2. "Would you add sparkline trends to stats?"
  3. "What additional tabs would you want?"
- Document their responses

---

### SECTION 5: Cross-Cutting Concerns (Segments 37-40)

**Segment 37: Design System Consistency**
- Review: Colors, spacing, typography across all wireframes
- Confirm: Design tokens applied consistently
- Check: No hardcoded colors (all use CSS variables)
- Ask: "Are there any visual inconsistencies you noticed?"

**Segment 38: Responsive & Accessibility**
- Confirm: Breakpoints defined (Desktop/Tablet/Mobile)
- Confirm: Focus states visible
- Confirm: Touch targets adequate
- Ask: "Any accessibility or mobile concerns?"

**Segment 39: Implementation Priority**
- Discuss: Which wireframe to implement first?
- Options: TENET Portal → Leaderboard → Profile
- Or: All in parallel?
- Ask: "What's your preferred implementation order?"

**Segment 40: Final Feedback & Next Steps**
- Summarize: Key feedback points from user
- Confirm: Changes to make before coding
- Set expectations: "I'll implement [X, Y, Z] based on your feedback"
- Closing: "Ready to start building? Or need more changes?"

---

## Presentation Mode Instructions

### How to Present Each Wireframe

1. **Navigate to the file:**
   ```bash
   cd /root/.openclaw/workspace/eSports-EXE/.agent-prompts/ui-design/wireframes
   python3 -m http.server 8888
   ```

2. **Open browser:**
   ```
   http://localhost:8888/01-tenet-portal-v1.1.html
   ```

3. **Use browser tools:**
   - Screenshot capabilities
   - Element inspector to show details
   - Responsive mode for mobile views

4. **Ask for user feedback after each section**

---

## Feedback Capture Template

For each wireframe, document:

```markdown
## Wireframe: [NAME]

### Approved As-Is
- [List elements user likes]

### Changes Requested
| Element | Current | Requested Change | Priority |
|---------|---------|------------------|----------|
| | | | High/Medium/Low |

### Questions to Resolve
- [List open questions]

### Implementation Notes
- [Your notes for building]
```

---

## Success Criteria

✅ User has viewed all 3 wireframes  
✅ User has provided specific feedback on each  
✅ Changes are documented and prioritized  
✅ Implementation order is agreed upon  
✅ User confirms "Ready to build" or "Make changes first"  

---

## Emergency Escapes

If user wants to:
- **Skip a section:** "No problem, let's move to [next]"
- **Deep dive:** Pause 40/40 timer, explore thoroughly
- **See comparison:** Open v1.0 and v1.1 side-by-side
- **Change direction:** Pivot to their priority immediately

---

## Opening Script (Copy/Paste)

"Hi! I'm your UI/UX Presentation Agent. I'll walk you through the eSports-EXE wireframes we created. 

We have 3 interactive wireframes to review:
1. TENET Portal (game selection)
2. Player Leaderboard (stats table)
3. Player Profile (individual view)

These went through our 1/2/3/5 Review process and are at v1.1. I'll show you each one, explain the design decisions, and get your feedback.

First, let me start the local server so you can view them in your browser..."

[Execute server start]

"Ready when you are. Which wireframe should we start with — TENET Portal, Leaderboard, or Profile?"

---

## Execute

Start the presentation now. Begin with Segment 1 (Opening).
