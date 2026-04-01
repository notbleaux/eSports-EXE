# 04 - User Personas
## Three-Tier Progressive Disclosure Model

---

## Overview

The interface adapts to user expertise through **Progressive Disclosure** — one of the five strategic pillars. Instead of separate interfaces, we layer complexity:

```
Casual (Everyone sees this)
    ↓ Expand/Navigate
Aspiring Player (Engaged users)
    ↓ Expand/Access
Professional Analyst (Power users)
```

---

## Persona 1: The Casual Fan

### Profile
- **Name:** "Alex"
- **Demographic:** 16-24, plays Valorant casually
- **Goal:** Check match results, favorite team standings
- **Pain Point:** Overwhelmed by HLTV-style dense stats
- **Tech Comfort:** High (Discord, Twitch, Twitter user)

### Behaviors
- Checks scores on phone between classes
- Watches VCT on Twitch
- Follows 2-3 favorite teams
- Doesn't understand advanced stats (ADR, KAST)

### Needs
1. **Quick scores** — Who won, what was the match score
2. **Tournament brackets** — Visual, easy to follow
3. **Player highlights** — Top performers, not raw data
4. **Schedule** — When is the next match for my team

### Interface Requirements
- Large touch targets (mobile-first)
- Visual hierarchy: winners emphasized
- Minimal text, maximum visual info
- No stat acronyms without explanation

### Entry Points
- Social media links to match pages
- Google search for "VCT schedule"
- Direct: `/valorant` (game entry)

### Typical Journey
```
Landing Page → Tournament List → Match Detail → Share result
     ↓              ↓               ↓
  Pick game    Pick VCT event   See winner
                              highlighted
```

### Success Metrics
- Time to find match result: < 30 seconds
- Bounce rate: < 40%
- Return visits: Weekly during events

---

## Persona 2: The Aspiring Player

### Profile
- **Name:** "Jordan"
- **Demographic:** 18-28, competitive/ranked player
- **Goal:** Improve gameplay through pro analysis
- **Pain Point:** Stats don't explain *why* players made decisions
- **Tech Comfort:** Very high (data tools, Discord bots)

### Behaviors
- Analyzes pro matches to learn strategies
- Compares own stats to pros
- Participates in community discussions
- Uses third-party stats sites (VLR.gg, Tracker.gg)

### Needs
1. **Detailed stats** — Round-by-round breakdown
2. **Player comparisons** — Side-by-side analysis
3. **Economy tracking** — Buy patterns, force buys
4. **Heatmaps** — Positioning, common angles
5. **VOD links** — Stats linked to timestamped video

### Interface Requirements
- Expandable sections for deeper data
- Comparison tools (split view)
- Charts and visualizations
- Filterable, sortable tables
- Export options (share stats)

### Entry Points
- VLR.gg comparison (we need to match this)
- YouTube analysis videos
- Discord bot links
- Direct: `/valorant/stats/players`

### Typical Journey
```
Player List → Filter by Role → Compare 2 Players
    ↓              ↓                ↓
 Search Jett    Duelists only    Side-by-side
 players                         stat comparison
                    ↓
              View detailed
              performance chart
                    ↓
              Export/share
              comparison
```

### Success Metrics
- Comparison tool usage: Daily
- Time on site: 10+ minutes
- Pages per session: 5+

---

## Persona 3: The Professional Analyst

### Profile
- **Name:** "Morgan"
- **Demographic:** 25-35, coach, analyst, or journalist
- **Goal:** Deep statistical analysis for content or strategy
- **Pain Point:** Data scattered across sites, no raw export
- **Tech Comfort:** Expert (SQL, Python, data viz tools)

### Behaviors
- Builds custom spreadsheets from multiple sources
- Creates predictive models
- Writes analysis articles
- Coaches teams using statistical insights
- Needs historical data (trends over time)

### Needs
1. **Raw data access** — CSV/JSON export
2. **API access** — Programmatic data retrieval
3. **Historical queries** — "How has this player's K/D changed?"
4. **Custom aggregations** — Group by map, opponent, timeframe
5. **Correlation tools** — "Do teams that force buy more win more?"
6. **Cross-game data** — Valorant vs CS2 comparisons (unique to us)

### Interface Requirements
- SQL-like query builder (or raw SQL)
- Bulk export tools
- API documentation
- Data dictionaries (what each stat means)
- Visualization builder
- Saved queries/reports

### Entry Points
- API documentation
- Data journalism community
- Esports analytics Discord
- Direct: `/valorant/analytics`

### Typical Journey
```
Analytics Hub → Query Builder → Export Results → Analysis
      ↓               ↓               ↓
   Choose SATOR   Build custom     Download CSV
   tools          stat query       for R/Python
                      ↓
              Save query for
              future use
```

### Success Metrics
- API calls: 1000+/day per user
- Export frequency: Multiple times per session
- Custom report saves: Per-user library

---

## Cross-Persona Features

### Universal Elements (All Tiers)
- Game selector (Valorant/CS2)
- HUB navigation (4 HUB icons)
- Search bar
- User profile/settings
- Dark mode toggle

### Tier Expansion Pattern

```typescript
interface ProgressiveComponentProps {
  // Tier 1: Always visible
  casual: ReactNode;
  
  // Tier 2: Expandable/conditional
  aspiring?: {
    content: ReactNode;
    trigger: 'expand' | 'tab' | 'hover';
  };
  
  // Tier 3: Collapsible/advanced access
  professional?: {
    content: ReactNode;
    trigger: 'advanced-toggle' | 'api-link';
  };
}

// Example: Player Card
<PlayerCard player={player}>
  {/* Tier 1 - Casual */}
  <PlayerHeader name={player.name} team={player.team} />
  <KeyStats kd={player.kd} rating={player.rating} />
  
  {/* Tier 2 - Aspiring (expandable) */}
  <ExpandableSection title="Detailed Stats">
    <StatBreakdown stats={player.detailedStats} />
    <PerformanceChart data={player.history} />
  </ExpandableSection>
  
  {/* Tier 3 - Professional (advanced link) */}
  <AdvancedAccess>
    <RawDataExport playerId={player.id} />
    <APIEndpoint url={`/api/rotas/players/${player.id}`} />
  </AdvancedAccess>
</PlayerCard>
```

---

## Mobile Considerations

### Casual (Primary Mobile Users)
- Swipeable match cards
- Bottom navigation (HUBs)
- Pull-to-refresh
- Native share integration

### Aspiring (Mixed)
- Responsive tables (horizontal scroll)
- Sticky comparison bar
- Collapsible filters

### Professional (Primarily Desktop)
- Full-width data tables
- Multi-pane layout
- Keyboard shortcuts

---

## Persona Switching

Users can self-select their tier:

```typescript
// Settings or toolbar
<TierSelector
  current={userTier}
  onChange={setUserTier}
  options={[
    { value: 'casual', label: 'Casual Fan', icon: 'eye' },
    { value: 'aspiring', label: 'Aspiring Player', icon: 'target' },
    { value: 'professional', label: 'Analyst', icon: 'chart' },
  ]}
/>
```

Default detection based on behavior:
- First visit: Casual
- Returning with account: Previous selection
- API key present: Professional

---

*Reference: docs/master-plan/master-plan.md §Pillar 2: Progressive Disclosure*
