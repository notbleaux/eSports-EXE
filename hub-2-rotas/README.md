[Ver001.000]

# ROTAS Hub 2 - The Harmonic Layer

A sophisticated analytics dashboard featuring glassmorphism UI, harmonic wave visualizations, and Jungian archetype layer systems.

## Features

### Visual Design
- **Glassmorphism** - Multi-depth frosted glass panels with backdrop-filter
- **Cyan/Gold Accents** - Signature ROTAS color scheme
- **Fluid Animations** - 60fps morphing transitions
- **Responsive Design** - Optimized for desktop, tablet, and mobile

### Components

#### 1. EllipseLayerSystem.jsx
Three overlapping ellipses representing Jungian archetypes:
- **Persona** (Cyan) - Conscious identity layer
- **Shadow** (Red) - Unconscious patterns  
- **Animus** (Gold) - Balancing principle

Features:
- CSS mix-blend-mode for layer interactions
- Toggle switches for each archetype
- Real-time correlation calculation
- Fluid morphing animations

#### 2. HarmonicWaveViz.jsx
Canvas-based wave interference patterns in IBM Harmonic State style:
- Multiple wave sources with interference
- Real-time frequency modulation
- Interactive click-to-collapse
- Adjustable parameters

#### 3. ProbabilityCloud.jsx
WebGL particle probability clouds:
- High-performance particle system
- Probability-based distribution
- Click to collapse/expand
- Gaussian distribution patterns

#### 4. GlassmorphismPanel.jsx
Reusable glass component system:
- 4 depth levels (1-4)
- Cyan/Gold/Gradient accent variants
- Animated shimmer effects
- Hover morphing
- Modal overlay support

#### 5. ComponentLibrary.jsx
Osmo-style drag-and-drop analytics modules:
- Draggable module cards
- Category filtering (Metrics, Charts, Analytics, Tools)
- Search functionality
- Module preview

#### 6. ROTASHub.jsx
Main dashboard with integrated layer system:
- Real-time stats overview
- Visual component grid
- Notification system
- Responsive navigation

## Design Tokens

Located at `/shared/styles/design-tokens.css`:
- Color palette (Cyan, Gold, Semantic)
- Typography system
- Spacing scale
- Animation curves
- Glassmorphism presets
- Shadow/glow effects

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
hub-2-rotas/
├── src/
│   ├── components/
│   │   ├── GlassmorphismPanel.jsx    # Reusable glass component
│   │   ├── EllipseLayerSystem.jsx    # Jungian archetype layers
│   │   ├── HarmonicWaveViz.jsx       # Wave interference canvas
│   │   ├── ProbabilityCloud.jsx      # WebGL particle cloud
│   │   ├── ComponentLibrary.jsx      # Drag-drop module library
│   │   └── ROTASHub.jsx              # Main dashboard
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles
├── shared/
│   └── styles/
│       └── design-tokens.css         # Design system tokens
├── index.html
├── package.json
└── vite.config.js
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebGL required for ProbabilityCloud component.

## References

- **Osmo** - Component organization patterns
- **IBM Harmonic State** - Wave visualization style
- **Formless Glassmorphism** - Depth and blur techniques

## License

MIT
