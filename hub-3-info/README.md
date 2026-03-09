[Ver001.000]

# Hub 3 - Information Directory

**The Directory** - NJZ Platform's comprehensive esports information hub.

## Overview

Hub 3 is a visually immersive information directory featuring a porcelain color scheme on abyssal black, designed to showcase the complete esports ecosystem of 2,135 teams across 12 categories.

## Visual Design

- **Color Palette**: Porcelain (#e8e6e3) on abyssal black (#0a0a0f)
- **Accent**: Aged gold (#c9b037) and signal cyan (#00f0ff)
- **Typography**: Space Grotesk (headers), Inter (body), JetBrains Mono (data)
- **References**: Gufram grid, Phamily segmentation, Darkroom comparison, Landingi AI

## Components

### 1. RadialMenu.jsx
12-section SVG zodiacal menu featuring:
- FPS, MOBA, Battle Royale, RPG, Racing, Sports, Strategy, Simulation, Fighting, Adventure, Puzzle, Indie
- Hover sub-categories with trending tags
- Smooth radial transitions

### 2. ConicalDirectory.jsx
Three.js conical structure visualization:
- 2,135 teams arranged in a spiral cone
- Interactive zoom and drill-down
- Tier-based color coding (S, A, B, C, D)
- Filter by region and tier

### 3. RadiatingSearch.jsx
Cloud-like search experience:
- Results radiate from center along 8 vectors
- Animated cloud particle background
- Real-time filtering
- Popular search suggestions

### 4. TierComparison.jsx
Side-by-side feature matrix:
- NJZ 4eva vs Nvr Die comparison
- Expandable category sections
- Detailed feature comparison
- Highlights summary

### 5. AISuggestions.jsx
Contextual AI recommendations:
- Role-based suggestions (Player, Coach, Manager, Analyst, Organizer, Spectator)
- Priority indicators (High, Medium, Low)
- Dismissible cards with animations

### 6. InformationHub.jsx
Main page component with:
- NJZ Grid navigation
- Fixed header with scroll effects
- Hero section with animated counters
- Modal for category details

## Project Structure

```
hub-3-info/
├── components/
│   ├── index.js          # Component exports
│   ├── InformationHub.jsx    # Main page
│   ├── RadialMenu.jsx        # 12-section menu
│   ├── ConicalDirectory.jsx  # 3D team directory
│   ├── RadiatingSearch.jsx   # Search component
│   ├── TierComparison.jsx    # Feature matrix
│   └── AISuggestions.jsx     # AI recommendations
├── data/
│   ├── categories.js     # Game categories data
│   ├── teams.js          # Teams data (2,135)
│   ├── tiers.js          # Tier comparison data
│   └── ai-suggestions.js # AI suggestion data
├── hooks/
│   └── index.js          # Custom React hooks
├── styles/
│   ├── information-hub.css   # Main styles
│   ├── radial-menu.css       # Menu styles
│   ├── conical-directory.css # 3D directory styles
│   ├── radiating-search.css  # Search styles
│   ├── tier-comparison.css   # Comparison styles
│   └── ai-suggestions.css    # AI suggestions styles
├── utils/
│   └── helpers.js        # Utility functions
├── App.jsx               # App component
├── index.js              # Entry point
├── index.html            # HTML template
└── package.json          # Dependencies
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Features

- **Responsive Design**: Adapts to desktop, tablet, and mobile
- **Smooth Animations**: GSAP-inspired easing curves
- **Accessibility**: Keyboard navigation and ARIA labels
- **Performance**: Optimized Three.js rendering
- **Reduced Motion**: Respects user preferences

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Design Tokens

Uses design tokens from `/shared/styles/design-tokens.css`:
- Colors: Porcelain, Gold, Cyan palettes
- Typography: Font families, sizes, weights
- Spacing: Consistent spacing system
- Animations: Easing functions, durations

## Credits

- Design inspired by Gufram grid and Phamily segmentation
- Comparison UI inspired by Darkroom
- AI suggestions inspired by Landingi

## License

MIT
