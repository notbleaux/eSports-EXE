[Ver001.000]

# The Nexus - Games Hub (Hub 4)

The Nexus is the fourth hub of the NJZ ¿!? Platform, serving as the central gateway between offline eSports management simulation (NJZ Manager) and the live competitive platform.

## 🎮 Visual Identity

- **Offline State**: Deep cobalt (#1e3a5f) - grounded, strategic
- **Live State**: Neon cyan (#00f0ff) - connected, energetic
- **Flow Structure**: Torus/hourglass representing the transition between states
- **Matchmaking**: Iridescent bubbles with chemistry-style orbital physics
- **Transitions**: Toroidal vortex effects between sections

## 📦 Components

### 1. ResonantMatchmaking.jsx
Iridescent bubble physics with chemistry-style orbits for visualizing the matchmaking process.
- Custom WebGL shaders for iridescent bubble effects
- Orbital mechanics for floating bubble clusters
- Real-time match status visualization
- Progress indicators with harmonic resonance metrics

### 2. TorusFlow.jsx
Three.js hourglass showing Terrestrial → Harmonic → Celestial state transitions.
- Animated torus knot geometry with flow particles
- State-based color transitions (Brown → Gold → Cyan)
- Auto-rotating 3D visualization
- Interactive orbit controls

### 3. TripleModeSelector.jsx
CSS 3D star tetrahedron with 9 game mode configurations.
- Interactive 3D star tetrahedron (drag to rotate)
- 9 game modes across 3 realms:
  - **Terrestrial**: Academy, Scrimmage, Draft
  - **Harmonic**: Quick Match, Ranked, Tournament
  - **Celestial**: Conquest, Eternal, Singularity
- Mode details panel with animations

### 4. GameDownloadPortal.jsx
Download cards with abyssal glass panel effects.
- Abyssal glass morphism design
- Platform-specific download cards (Windows, macOS, Linux, Web)
- Download progress with pause/resume support
- System requirements accordion
- Checksum verification display

### 5. LivePlatformLobby.jsx
Real-time match visualization with resonant sphere progression.
- Canvas-based resonant sphere animations
- Live match cards with resonance scores
- Queue status and player counts
- Mode filtering and quick search
- Real-time player status updates

### 6. GamesHub.jsx
Main page integrating all sections with toroidal transitions.
- Hero section with vortex background
- Toroidal section transitions
- Responsive navigation
- Hub switcher (Offline → Live)

## 🎨 Design Tokens

Uses the shared design tokens from `/shared/styles/design-tokens.css`:
- Colors: void_black, deep_space, signal_cyan, aged_gold, alert_amber
- Typography: Space Grotesk (headers), Inter (body), JetBrains Mono (data)
- Animation: ease_harmonic, ease_toroidal, ease_dramatic

Additional Nexus-specific tokens in `app/nexus-tokens.css`.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## 📁 File Structure

```
hub4-games/
├── app/
│   ├── GamesHub.jsx          # Main page component
│   ├── globals.css            # Global styles + design tokens
│   ├── nexus-tokens.css       # Nexus-specific design tokens
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Entry point
├── components/
│   ├── ResonantMatchmaking.jsx
│   ├── TorusFlow.jsx
│   ├── TripleModeSelector.jsx
│   ├── GameDownloadPortal.jsx
│   └── LivePlatformLobby.jsx
├── index.html                 # Standalone HTML version
└── package.json
```

## 🌐 References

- **Active Theory**: Immersive web experiences, fluid transitions
- **Darkroom**: Clean, board-style layouts
- **Jeton**: Vibrant gradients, modern aesthetics

## 📄 License

Part of the NJZ ¿!? Platform - All realities reserved.
