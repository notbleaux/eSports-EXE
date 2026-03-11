[Ver001.000]

# SATOR HUBs

This directory contains all SATOR Platform HUBs - specialized sections of the platform organized by functionality.

## Structure

```
hubs/
├── index.html          # NJZ Grid - HUB Selector (main entry point)
├── stat-ref/           # HUB 1/4 - Statistical Reference
├── analytics/          # HUB 2/4 - Advanced Analytics
├── esports/            # HUB 3/4 - eSports Hub
├── fantasy/            # HUB 4/4 - Fantasy eSports
└── help/               # Help Center
```

## HUB Overview

### 1. Statistical Reference (`stat-ref/`)
**Theme Color:** Blue (#1E3A5F)

Comprehensive player and team statistics database.

**Planned Features:**
- Player statistics and performance metrics
- Team analysis and ratings
- Match history database
- Leaderboards and rankings
- Historical data trends

### 2. Advanced Analytics (`analytics/`)
**Theme Color:** Purple (#6B46C1)

Advanced analytics and visualization tools.

**Planned Features:**
- SATOR Square 5-layer visualization
- SimRating calculations
- RAR (Role-Adjusted Rating) analysis
- Trend reports and forecasting
- Custom chart builder

### 3. eSports Hub (`esports/`)
**Theme Color:** Red (#FF4655)

eSports news, results, and community features.

**Planned Features:**
- Live match tracking
- Tournament coverage (VCT, etc.)
- News feed and articles
- Community forums
- Event calendar

### 4. Fantasy eSports (`fantasy/`)
**Theme Color:** Green (#00FF88)

Fantasy eSports and game integration.

**Planned Features:**
- Fantasy team drafting
- Live fantasy scoring
- Private and public leagues
- Rewards and achievements
- Game integration features

### Help Center (`help/`)
**Theme Color:** Cyan (#22D3EE)

Help guides and support resources.

**Planned Features:**
- Documentation and guides
- FAQ section
- Contact support
- Feedback submission
- Video tutorials

## HUB Structure Convention

Each HUB follows a consistent structure:

```
hubs/[hub-name]/
├── index.html          # Main HUB entry page
├── css/                # HUB-specific styles
├── js/                 # HUB-specific scripts
└── [pages]/            # HUB-specific subpages (as needed)
```

## Navigation

- **NJZ Grid** (`/hubs/`): Central hub selector
- All HUBs link back to NJZ Grid via "Back to HUB Selector"
- Cross-HUB navigation available through header

## Development Status

All HUBs are currently in Phase 1 (placeholder/coming soon status).
Active development will proceed according to the project roadmap.

## Design System

All HUBs follow the SATOR Design System:
- Dark theme base (#0a0a0f)
- HUB-specific accent colors
- Consistent card and component styling
- Tailwind CSS for styling
- Responsive design

## Contributing

When adding new features to a HUB:
1. Maintain consistent styling with the HUB theme color
2. Follow the established directory structure
3. Update this README with new features
4. Ensure mobile responsiveness
5. Test navigation between HUBs
