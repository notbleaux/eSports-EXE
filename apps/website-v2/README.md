[Ver002.000]

# Libre-X-eSport 4NJZ4 TENET Platform v2.0

**4eva and Nvr Die**

A unified platform integrating 4 specialized hubs with SATOR/ROTAS twin-file infrastructure.

## 🏛️ Architecture

The 4NJZ4 TENET Platform consists of 4 interconnected hubs:

| Hub | Name | Purpose | Color |
|-----|------|---------|-------|
| 1 | **SATOR** | The Observatory | Alert Amber `#ff9f1c` |
| 2 | **ROTAS** | The Harmonic Layer | Signal Cyan `#00f0ff` |
| 3 | **Information** | The Directory | Porcelain `#e8e6e3` |
| 4 | **Games** | The Nexus | Deep Cobalt `#1e3a5f` |

## 🎨 Design Tokens

```css
/* Core Palette */
--void-black: #0a0a0f;
--signal-cyan: #00f0ff;
--alert-amber: #ff9f1c;
--aged-gold: #c9b037;
--porcelain: #e8e6e3;
--cobalt: #1e3a5f;
```

## 📦 Project Structure

```
website-v2/
├── src/
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx               # Entry point with error boundary
│   ├── index.css              # Global styles with design tokens
│   ├── hub-1-sator/
│   │   └── SATORHub.jsx       # The Observatory
│   ├── hub-2-rotas/
│   │   └── ROTASHub.jsx       # The Harmonic Layer
│   ├── hub-3-info/
│   │   └── InformationHub.jsx # The Directory
│   ├── hub-4-games/
│   │   └── GamesHub.jsx       # The Nexus
│   └── shared/
│       ├── components/
│       │   ├── Navigation.jsx          # Hub switcher navigation
│       │   ├── Footer.jsx              # Platform footer
│       │   ├── CentralGrid.jsx         # Landing page
│       │   ├── TwinFileVisualizer.jsx  # RAWS/BASE integrity
│       │   ├── NotificationContainer.jsx
│       │   ├── HubWrapper.jsx          # Consistent hub layout
│       │   └── index.js                # Component exports
│       └── store/
│           ├── njzStore.js    # Zustand state management
│           └── index.js       # Store exports
├── index.html
├── package.json
└── tailwind.config.js
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🧩 Key Features

### 1. React Router Integration
- Central grid landing page
- Individual hub routes (`/sator`, `/rotas`, `/info`, `/games`)
- Smooth page transitions with Framer Motion
- 404 error handling

### 2. Navigation Component
- Fixed glassmorphism header
- Desktop and mobile responsive
- Hub switcher dropdown
- Live status indicator
- Animated navigation indicator

### 3. Twin-File Integrity Visualizer
- Real-time RAWS/BASE sync status
- SHA-256 verification display
- Correlation score visualization
- Compact and full-size modes

### 4. Zustand State Management
- Hub-specific state persistence
- Twin-file integrity tracking
- User preferences (reduced motion, etc.)
- Notification system
- Navigation history

### 5. Framer Motion Page Transitions
- Smooth enter/exit animations
- Respects reduced motion preferences
- Direction-aware transitions

### 6. Consistent Hub Styling
- HubWrapper component for unified layout
- Glassmorphism panels
- Design token integration
- Responsive grid systems

## 🔗 Hub Connections

All hubs share:
- Common Navigation component
- Footer with twin-file status
- Global notification system
- Zustand state store
- Design token CSS variables

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Mobile hamburger menu
- Touch-friendly interactions

## ⚡ Performance

- 60fps animations
- Lazy loading ready
- Optimized re-renders with Zustand
- Reduced motion support

## 🔒 Error Handling

- React Error Boundary
- Graceful fallbacks
- Console error logging

---

**Libre-X-eSport 4NJZ4 TENET Platform v2.0** — *Twin-file database system with SATOR/ROTAS infrastructure*
