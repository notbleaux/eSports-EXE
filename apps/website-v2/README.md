[Ver003.000]

# Libre-X-eSport 4NJZ4 TENET Platform v2.1

**4eva and Nvr Die**

A unified platform integrating 4 specialized hubs with SATOR/ROTAS twin-file infrastructure.

---

## 🏛️ Architecture

The 4NJZ4 TENET Platform consists of 4 interconnected hubs plus a central hub:

| Hub | Name | Purpose | Color | Route |
|-----|------|---------|-------|-------|
| 1 | **SATOR** | The Observatory — Analytics & Insights | Alert Amber `#ff9f1c` | `/sator` |
| 2 | **ROTAS** | The Harmonic Layer — Simulations & ML | Signal Cyan `#00f0ff` | `/rotas` |
| 3 | **AREPO** | The Directory — Information & Search | Porcelain `#e8e6e3` | `/arepo` |
| 4 | **OPERA** | The Action Layer — Maps & Visualization | Deep Cobalt `#1e3a5f` | `/opera` |
| 5 | **TENET** | Central Hub — Platform Overview | White `#ffffff` | `/` |

---

## 🎨 Design Tokens

```css
/* Core Palette */
--void-black: #0a0a0f;
--signal-cyan: #00f0ff;
--alert-amber: #ff9f1c;
--aged-gold: #c9b037;
--porcelain: #e8e6e3;
--cobalt: #1e3a5f;

/* Derived Colors */
--deep-crimson: #c9182b;
--void-dust: #5a5a6e;
```

---

## 📦 Project Structure

```
website-v2/
├── src/
│   ├── App.jsx                    # Main routing + error boundaries
│   ├── main.jsx                   # Entry point
│   ├── index.css                  # Global styles + design tokens
│   │
│   ├── hub-1-sator/
│   │   ├── index.jsx              # The Observatory (consolidated)
│   │   ├── index.js               # Module exports
│   │   ├── components/            # StatsGrid, PlayerWidget, etc.
│   │   │   ├── StatsGrid.jsx
│   │   │   ├── PlayerWidget.jsx
│   │   │   └── MLInferencePanel.jsx
│   │   └── hooks/                 # useSatorData, useMLPrediction
│   │       ├── useSatorData.js
│   │       └── useMLPrediction.js
│   │
│   ├── hub-2-rotas/
│   │   ├── index.jsx              # The Harmonic Layer
│   │   ├── components/            # Analytics, Simulations
│   │   └── hooks/                 # useRotasData
│   │
│   ├── hub-3-arepo/
│   │   └── index.jsx              # The Directory (Information)
│   │
│   ├── hub-4-opera/
│   │   └── index.jsx              # The Nexus (Maps)
│   │
│   ├── hub-5-tenet/
│   │   └── index.jsx              # Central Hub
│   │
│   ├── components/
│   │   ├── error/                 # Error boundaries
│   │   │   ├── AppErrorBoundary.tsx
│   │   │   ├── HubErrorBoundary.tsx
│   │   │   ├── DataErrorBoundary.tsx
│   │   │   ├── MLInferenceErrorBoundary.tsx
│   │   │   ├── StreamingErrorBoundary.tsx
│   │   │   └── PanelErrorBoundary.jsx
│   │   ├── grid/                  # Grid system
│   │   │   ├── DraggablePanel.jsx
│   │   │   ├── QuaternaryGrid.jsx
│   │   │   └── PanelSkeleton.jsx
│   │   └── ui/                    # UI components
│   │       ├── GlassCard.jsx
│   │       ├── HubCard.jsx
│   │       └── LoadingSpinner.jsx
│   │
│   ├── hooks/
│   │   ├── useWebSocket.ts        # WebSocket management
│   │   ├── useSearch.ts           # Search functionality
│   │   ├── useVirtualScroll.ts    # Virtual scrolling
│   │   └── useLocalStorage.ts     # Persistence
│   │
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── websocket.ts           # WebSocket client
│   │   └── utils.ts               # Utilities
│   │
│   ├── store/
│   │   ├── njzStore.js            # Zustand state management
│   │   ├── gridStore.js           # Grid state
│   │   └── mlStore.js             # ML inference state
│   │
│   └── shared/
│       ├── components/
│       │   ├── Navigation.jsx     # Hub switcher navigation
│       │   ├── Footer.jsx         # Platform footer
│       │   ├── CentralGrid.jsx    # Landing page
│       │   └── TwinFileVisualizer.jsx  # RAWS/BASE integrity
│       └── store/
│           └── index.js
│
├── e2e/                           # Playwright E2E tests
│   ├── hub-navigation.spec.ts
│   ├── search.spec.ts
│   ├── realtime.spec.ts
│   └── ...
│
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API URL
# VITE_API_URL=https://api.libre-x-esport.com/v1
```

### Development

```bash
# Start development server
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint
```

### Building

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run E2E with UI
npx playwright test --ui
```

---

## 🧩 Key Features

### 1. React Router Integration
- Central grid landing page
- Individual hub routes (`/sator`, `/rotas`, `/arepo`, `/opera`)
- Smooth page transitions with Framer Motion
- 404 error handling
- Scroll restoration

### 2. Error Boundary Hierarchy
```
AppErrorBoundary (Top-level)
├── HubErrorBoundary (Hub-level)
│   ├── DataErrorBoundary (API/Data errors)
│   ├── MLInferenceErrorBoundary (ML errors)
│   ├── StreamingErrorBoundary (WebSocket errors)
│   └── PanelErrorBoundary (Component-level)
```

### 3. WebSocket Real-time Updates
- Unified WebSocket endpoint
- Channel-based subscriptions
- Auto-reconnect with exponential backoff
- Heartbeat/ping-pong protocol

### 4. ML Inference
- TensorFlow.js integration
- ONNX Runtime Web support
- Model versioning
- Prediction caching
- WebWorker inference

### 5. Search with Autocomplete
- Full-text search across players, teams, matches
- PostgreSQL tsvector/tsquery
- Fuzzy matching with trigrams
- Autocomplete suggestions
- Rate limited (30 req/min)

### 6. Virtual Scrolling
- @tanstack/react-virtual
- 1000+ item lists
- Smooth scrolling
- Memory efficient

### 7. PWA Support
- Service Worker for offline
- Background sync
- Installable app
- Cache-first strategy

---

## 🔗 Hub Connections

All hubs share:
- Common Navigation component with hub switcher
- Footer with twin-file status
- Global notification system
- Zustand state store
- Design token CSS variables
- Error boundary hierarchy
- WebSocket connection

---

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px
- Mobile hamburger menu
- Touch-friendly interactions
- Reduced motion support

---

## ⚡ Performance

| Metric | Target | Status |
|--------|--------|--------|
| First Contentful Paint | <1.5s | ✅ |
| Time to Interactive | <2s | ✅ |
| Grid drag FPS | 60fps | ✅ |
| Bundle size | <300KB | ✅ |
| Memory (50 panels) | <150MB | ✅ |
| Lighthouse Score | >90 | ✅ |

### Performance Optimizations
- Code splitting with dynamic imports
- Lazy loaded components
- Optimized re-renders with Zustand selectors
- React.memo with custom comparison
- useCallback for stable callbacks
- Virtual scrolling for long lists
- Web Workers for heavy computation
- Service Worker caching

---

## 🔒 Error Handling

### Error Boundary Strategy
Each hub has a 2+ level error boundary hierarchy for graceful degradation.

### Error Recovery
- Retry with exponential backoff
- Fallback to cached data
- Navigation to working hubs
- Graceful degradation

### Error Reporting
- Centralized logger utility
- Analytics integration in production
- Error ID for support reference

---

## 🎨 Styling

### Tailwind Configuration
Custom design tokens integrated with Tailwind:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'void-black': '#0a0a0f',
      'signal-cyan': '#00f0ff',
      'alert-amber': '#ff9f1c',
      // ... more tokens
    }
  }
}
```

### Glassmorphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 📦 Dependencies

### Core
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.90.21",
  "@tanstack/react-virtual": "^3.13.22"
}
```

### Animation & 3D
```json
{
  "framer-motion": "^10.16.0",
  "gsap": "^3.12.0",
  "three": "^0.158.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.90.0"
}
```

### ML
```json
{
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow/tfjs-backend-wasm": "^4.22.0",
  "@tensorflow/tfjs-backend-webgpu": "^4.22.0",
  "onnxruntime-web": "^1.20.1"
}
```

---

## 🔧 Development Tools

### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npx playwright test` | Run E2E tests |

---

## 🚀 Deployment

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables (Vercel)
```
VITE_API_URL=https://api.libre-x-esport.com/v1
```

---

## 📝 Contributing

1. Follow the existing code style
2. Use conventional commits
3. Update documentation
4. Add tests for new features
5. Ensure build passes

---

## 📚 Documentation

- [API Documentation](../../docs/API_V1_DOCUMENTATION.md)
- [WebSocket Protocol](../../docs/WEBSOCKET_PROTOCOL.md)
- [Architecture](../../docs/ARCHITECTURE_V2.md)
- [Migration Guide](../../docs/MIGRATION_GUIDE.md)

---

**Libre-X-eSport 4NJZ4 TENET Platform v2.1** — *Twin-file database system with SATOR/ROTAS infrastructure*

*Last Updated: March 15, 2026*
