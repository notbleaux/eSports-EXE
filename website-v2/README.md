# NJZ Platform v2

The next-generation digital ecosystem with a unified design system, abyssal aesthetics, and immersive user experiences.

## 🎨 Design System

### Abyssal Color Palette
- **Void Black**: `#0a0a0f` - Deep space background
- **Signal Cyan**: `#00f0ff` - Primary accent, interactive elements
- **Alert Amber**: `#ff9f1c` - Warnings, important notifications
- **Aged Gold**: `#c9b037` - Premium features, achievements

### Typography
- **Display**: Space Grotesk - Headlines, titles
- **Body**: Inter - General text, paragraphs
- **Mono**: JetBrains Mono - Code, data
- **Decorative**: Cinzel - Special headings

### Visual Effects
- Glassmorphism with frosted glass aesthetics
- Fluid transitions and physics-based animations
- WebGL-powered particle systems
- Gradient shaders with organic motion

## 📁 Project Structure

```
/website-v2/
├── /shared/                    # Shared resources
│   ├── /styles/               # CSS design system
│   │   ├── design-tokens.css  # Color, spacing, typography tokens
│   │   ├── typography.css     # Font styles
│   │   ├── animations.css     # Keyframes & animation utilities
│   │   ├── glassmorphism.css  # Glass effect utilities
│   │   └── global.css         # Global styles
│   ├── /components/           # Reusable React components
│   │   ├── Navigation.jsx     # Glassmorphic navigation
│   │   ├── Footer.jsx         # Multi-section footer
│   │   ├── HubCard.jsx        # Hub navigation cards
│   │   ├── Button.jsx         # Multi-variant buttons
│   │   └── Input.jsx          # Form inputs with validation
│   ├── /hooks/                # Custom React hooks
│   │   ├── useScrollAnimation.js    # GSAP ScrollTrigger
│   │   ├── useFluidTransition.js    # Framer Motion transitions
│   │   └── useAbyssalGradient.js    # Animated gradients
│   ├── /js/                   # JavaScript utilities
│   │   ├── animations.js      # GSAP animation helpers
│   │   ├── fluid-effects.js   # Liquid/smooth effects
│   │   └── transitions.js     # Page & state transitions
│   ├── /vfx/                  # Visual effects components
│   │   ├── FluidSmokeEffects.jsx     # WebGL smoke simulation
│   │   ├── AbyssalGradientShader.jsx # Gradient shader
│   │   └── ParticleSystems.jsx       # Particle effects
│   └── index.js               # Central exports
├── /hub-1-sator/              # Sator Hub (Mind/Thought)
├── /hub-2-rotas/              # Rotas Hub (Journey/Path)
├── /hub-3-info/               # Info Hub (Knowledge)
└── /hub-4-games/              # Games Hub (Play)
```

## 🚀 Dependencies

```bash
# Animation
npm install gsap @gsap/react framer-motion

# 3D/WebGL
npm install three @react-three/fiber @react-three/drei

# State Management
npm install zustand

# Types
npm install @types/three
```

## 🌿 Git Workflow

### Branches
- `main` - Production-ready code
- `develop` - Integration branch for features
- `hub-1-sator` - Sator Hub development
- `hub-2-rotas` - Rotas Hub development
- `hub-3-info` - Info Hub development
- `hub-4-games` - Games Hub development

### Workflow
```bash
# Start feature development
git checkout hub-1-sator
git pull origin main

# Make changes, commit
git add .
git commit -m "feat: add meditation timer"

# Merge to develop when ready
git checkout develop
git merge hub-1-sator

# Merge to main for release
git checkout main
git merge develop
```

## 🧩 Component Usage

### Navigation
```jsx
import { Navigation } from './shared';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Hubs', href: '/hubs' },
  { label: 'About', href: '/about' },
];

<Navigation 
  links={links}
  logo="NJZ"
  glassEffect={true}
/>
```

### HubCard
```jsx
import { HubCard } from './shared';

<HubCard
  title="Sator"
  description="Explore the realm of mind and thought"
  icon="🧠"
  color="cyan"
  href="/hub-1-sator"
/>
```

### Button
```jsx
import { Button } from './shared';

<Button variant="primary" size="md" icon="→">
  Enter Hub
</Button>
```

### VFX Background
```jsx
import { FluidSmokeEffects, ParticleSystems } from './shared';

// Fluid smoke background
<FluidSmokeEffects intensity={0.5} />

// Particle overlay
<ParticleSystems type="floating" count={100} color="#00f0ff" />
```

## 🎭 Animation Utilities

### Scroll Animations
```javascript
import { useScrollAnimation, useParallax } from './shared';

// Fade in on scroll
const { ref } = useScrollAnimation({
  from: { opacity: 0, y: 50 },
  to: { opacity: 1, y: 0 },
  start: 'top 80%',
});

// Parallax effect
const { ref: parallaxRef } = useParallax(0.3);
```

### Fluid Transitions
```javascript
import { useFluidTransition, useStaggerChildren } from './shared';

// Page transition
const { variants } = useFluidTransition('abyssal');

// Staggered list reveal
const { containerVariants, itemVariants } = useStaggerChildren({
  stagger: 0.1,
});
```

## 📝 CSS Utilities

### Glassmorphism
```html
<div class="njz-glass">Basic glass</div>
<div class="njz-glass njz-glass-cyan">Cyan accent</div>
<div class="njz-glass-card-hover">Hover effect</div>
```

### Typography
```html
<h1 class="njz-display njz-display-5xl">Title</h1>
<p class="njz-body njz-body-lg">Body text</p>
<code class="njz-mono">Code snippet</code>
```

### Animations
```html
<div class="njz-animate njz-animate-fade-in-up">Fade in</div>
<div class="njz-animate-pulse">Pulsing</div>
<div class="njz-hover-lift">Lift on hover</div>
```

## 🔧 Development

### Install
```bash
cd website-v2
npm install
```

### Start Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 📄 License

Copyright © 2024 NJZ Platform. All rights reserved.

## 🤝 Contributing

1. Check out the appropriate hub branch
2. Create feature branches from hub branches
3. Submit PRs to the hub branch
4. Hub leads merge to `develop`
5. Release manager merges `develop` to `main`

---

*Designed in the abyss. Built for the future.*
