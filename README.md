# SATOR eXe / RadiantX Platform

A game-agnostic esports analytics platform with a tactical intelligence interface.

## Overview

**SATOR eXe** is the parent platform providing:
- Landing page with animated SATOR sphere
- eXе Launch Pad — constellation-style service hub
- Game profile system for multiple esports titles

**RadiantX** is the Valorant-specific implementation featuring:
- Quaternary grid layout (2×2 dashboard)
- Real-time match analytics
- Player performance tracking

## Quick Start

```bash
cd radiantx-static
# Open landing.html in browser
# Or serve with:
npx vite preview
```

## File Structure

```
radiantx-static/
├── landing.html              # Entry point
├── launchpad.html            # Service hub
├── index.html                # Main dashboard
├── system/
│   ├── core.css             # Design tokens
│   └── js/hub.js            # Navigation
├── profiles/
│   └── radiantx/
│       ├── index.html       # Valorant dashboard
│       └── theme.css        # Game overrides
└── PRESENTATION.md          # 25-slide spec
```

## Architecture

```
SATOR eXe (Parent)
├── Landing → Launch Pad → Game Profile
│
└── Game Profiles
    ├── RadiantX (Valorant) ✅
    ├── CounterX (CS) 🚧
    └── ApexX (Apex) 🚧
```

## Design System

**Colors:**
- Deep Navy: #0a1628 (background)
- Electric Cyan: #00f0ff (accents)
- Porcelain White: #f8f9fa (text)
- Valorant Red: #ff4655 (game accent)

**Typography:**
- Inter: UI and headers
- JetBrains Mono: Data and stats

## Deployment

GitHub Pages ready. Push to `main` branch.

## License

MIT
