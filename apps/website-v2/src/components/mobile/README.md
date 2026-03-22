# Mobile UI Components

[Ver001.000] - PWA Mobile Components for 4NJZ4 TENET Platform

## Overview

Essential mobile UI components for Progressive Web App (PWA) experience.
Addresses the technical analysis finding: "No Mobile Strategy".

## Components

### BottomNavigation

Fixed bottom tab navigation for mobile devices.

**Features:**
- 5 tabs: SATOR, ROTAS, AREPO, OPERA, TENET
- 64px fixed height
- Active state with icon + label
- Auto-hide on scroll down, show on scroll up
- Smooth Framer Motion transitions
- iOS safe area support
- Route-based prefetching on hover

**Usage:**
```tsx
import { BottomNavigation } from './components/mobile';

// In App root (fixed position, always rendered)
<BottomNavigation />
```

### InstallPrompt

Custom PWA installation prompt with app preview.

**Features:**
- Triggers on `beforeinstallprompt` event
- Shows app icon, features, and benefits
- One-week dismissal persistence
- Animated entrance/exit
- Loading state during install

**Usage:**
```tsx
import { InstallPrompt } from './components/mobile';

<InstallPrompt 
  delay={3000}
  onInstall={() => console.log('App installed')}
  onDismiss={() => console.log('Prompt dismissed')}
/>
```

### PullToRefresh

Pull-to-refresh gesture wrapper for mobile.

**Features:**
- Touch and mouse gesture detection
- Visual progress indicator
- Configurable pull threshold (default: 80px)
- Smooth spring animations
- Works with window.reload or custom refresh logic

**Usage:**
```tsx
import { PullToRefresh } from './components/mobile';

<PullToRefresh 
  onRefresh={async () => {
    await revalidateData();
  }}
  pullThreshold={80}
>
  <YourContent />
</PullToRefresh>
```

**Hook Usage:**
```tsx
import { usePullToRefresh } from './components/mobile';

const { isPulling, pullProgress, isRefreshing, handlers } = usePullToRefresh(
  async () => { /* refresh logic */ },
  { pullThreshold: 80 }
);
```

### TouchFeedback

Ripple effect wrapper for touch interactions.

**Features:**
- Framer Motion powered ripple animation
- 48px minimum touch target enforcement
- Position-based or centered ripples
- Configurable colors and duration
- Pre-styled button and card variants

**Usage:**
```tsx
import { 
  TouchFeedback, 
  TouchFeedbackButton,
  TouchFeedbackCard 
} from './components/mobile';

// Generic wrapper
<TouchFeedback onClick={handleClick}>
  <YourComponent />
</TouchFeedback>

// Pre-styled button
<TouchFeedbackButton
  label="Click Me"
  variant="primary"
  size="md"
  onClick={handleClick}
/>

// Pre-styled card
<TouchFeedbackCard
  title="Card Title"
  subtitle="Card description"
  onClick={handleClick}
/>
```

## Mobile CSS Support

Ensure `src/styles/mobile.css` is imported for:
- Safe area insets (iOS notch support)
- Touch target sizing
- Reduced motion support
- PWA standalone mode styles

## Integration

All components are integrated in `App.jsx`:

```tsx
// Imports
import { BottomNavigation, InstallPrompt, PullToRefresh } from './components/mobile';

// In App component:
<main>
  <PullToRefresh onRefresh={...}>
    <Routes>...</Routes>
  </PullToRefresh>
</main>

<BottomNavigation />
<InstallPrompt delay={3000} />
```

## Browser Support

- iOS Safari 12+
- Chrome Android 60+
- Samsung Internet 8+
- All modern browsers with PWA support

## Accessibility

- ARIA labels on interactive elements
- Focus states for keyboard navigation
- Reduced motion support via media query
- Minimum touch target size (48px)
