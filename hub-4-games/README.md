# Hub 4: The Nexus - Games Hub

The Games Hub for the NJZ Platform - a gateway to all gaming experiences with immersive visual design.

## Visual Design System

### Color Palette
- **Deep Cobalt** (`#001133`) - Offline state
- **Neon Cyan** (`#00f0ff`) - Live state
- **Abyssal Deep** (`#0a0c14`) - Backgrounds

### Visual Elements
- **Torus/Hourglass Flow Structure** - Three.js visualization
- **Iridescent Bubble Matchmaking** - Physics-based bubbles
- **Toroidal Vortex Transitions** - Smooth state transitions

## Components

### 1. TorusFlow.jsx
Three.js hourglass visualization showing Terrestrial→Harmonic→Celestial states.

**Props:**
- `currentState`: 'terrestrial' | 'harmonic' | 'celestial'
- `onStateChange`: (state) => void
- `isLive`: boolean

### 2. ResonantMatchmaking.jsx
Iridescent bubble physics with chemistry orbits.

**Props:**
- `playerProfile`: object
- `onMatchFound`: (match) => void
- `searchEnabled`: boolean

### 3. TripleModeSelector.jsx
CSS 3D star tetrahedron with 9 game mode configurations.

**Props:**
- `onModeSelect`: (mode) => void
- `selectedMode`: object | null

### 4. GameDownloadPortal.jsx
Download cards with abyssal glass panels.

**Props:**
- `onInstall`: (gameId, platform) => void
- `onLaunch`: (gameId) => void

### 5. LivePlatformLobby.jsx
Real-time match visualization with resonant sphere progression.

**Props:**
- `onJoinMatch`: (match) => void
- `onSpectate`: (match) => void

### 6. GamesHub.jsx
Main page component integrating all sections.

## Usage

```jsx
import { GamesHub } from '@njz/hub-4-games';

function App() {
  return (
    <GamesHub />
  );
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## File Structure

```
hub-4-games/
├── components/
│   ├── GamesHub.jsx
│   ├── TorusFlow.jsx
│   ├── ResonantMatchmaking.jsx
│   ├── TripleModeSelector.jsx
│   ├── GameDownloadPortal.jsx
│   └── LivePlatformLobby.jsx
├── styles/
│   ├── nexus-tokens.css
│   ├── games-hub.css
│   ├── torus-flow.css
│   ├── resonant-matchmaking.css
│   ├── triple-mode-selector.css
│   ├── game-download-portal.css
│   └── live-platform-lobby.css
├── index.js
└── package.json
```

## Dependencies

- React 18+
- Three.js (for TorusFlow)
- CSS Custom Properties (design tokens)

## License

MIT
