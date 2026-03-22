# Touch Gesture System

Touch gesture support using `@use-gesture/react` for the 4NJZ4 TENET Platform.

## [Ver001.000]

## Overview

This gesture system provides:
- **Swipe Navigation**: Swipe between hubs with velocity detection
- **Pinch-to-Zoom**: Zoom grids and visualizations
- **Pull-to-Refresh**: Refresh data with pull gesture
- **Long Press**: Context menus and additional actions
- **Double Tap**: Quick actions and reset zoom

## Hooks

### useSwipe

Detect horizontal/vertical swipes with velocity detection.

```typescript
import { useSwipe } from '@/hooks/gestures/useSwipe';

function MyComponent() {
  const { bind, state } = useSwipe(
    (direction, state) => {
      console.log(`Swiped ${direction} at ${state.velocity} px/ms`);
    },
    {
      threshold: 50,
      velocityThreshold: 0.5,
      horizontal: true,
      vertical: false,
    }
  );

  return <div {...bind()}>Swipe me</div>;
}
```

### usePinch

Pinch-to-zoom with scale tracking and min/max limits.

```typescript
import { usePinch } from '@/hooks/gestures/usePinch';

function MyComponent() {
  const { bind, state, scaleTo, reset } = usePinch(
    (state) => {
      console.log(`Scale: ${state.scale}`);
    },
    {
      minScale: 0.5,
      maxScale: 3,
      doubleTapReset: true,
    }
  );

  return (
    <div {...bind()}>
      <div style={{ transform: `scale(${state.scale})` }}>
        Zoomable content
      </div>
    </div>
  );
}
```

### useLongPress

Long press detection with progress tracking.

```typescript
import { useLongPress } from '@/hooks/gestures/useLongPress';

function MyComponent() {
  const { bind, state } = useLongPress(
    () => console.log('Long pressed!'),
    () => console.log('Press started'),
    (wasLongPress) => console.log(`Press ended, was long: ${wasLongPress}`),
    { duration: 500 }
  );

  return (
    <div {...bind()}>
      <div style={{ 
        opacity: 0.5 + state.progress * 0.5 
      }}>
        Press and hold
      </div>
    </div>
  );
}
```

## Components

### SwipeableNavigation

Wrap your app with swipe-enabled navigation.

```tsx
import { SwipeableNavigation } from '@/components/gestures/SwipeableNavigation';

function App() {
  return (
    <SwipeableNavigation
      enabled={true}
      edgeSwipeEnabled={true}
      visualFeedback={true}
    >
      <Router />
    </SwipeableNavigation>
  );
}
```

Features:
- Swipe left/right to change hubs
- Edge swipe to open mobile menu
- Visual swipe indicators
- Progress bar during swipe
- Hub preview on swipe

### SwipeableContainer

Container for swipeable content (carousels, tabs, etc).

```tsx
import { SwipeableContainer } from '@/components/gestures/SwipeableContainer';

function MyCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <SwipeableContainer
      activeIndex={activeIndex}
      onIndexChange={setActiveIndex}
      showIndicators={true}
      edgeResistance={0.5}
    >
      <Slide1 />
      <Slide2 />
      <Slide3 />
    </SwipeableContainer>
  );
}
```

### PinchZoomContainer

Container with pinch-to-zoom and double-tap reset.

```tsx
import { PinchZoomContainer } from '@/components/gestures/PinchZoomContainer';

function MyGrid() {
  return (
    <PinchZoomContainer
      minScale={0.5}
      maxScale={3}
      showControls={true}
      hubColor="#00d4ff"
    >
      <GridContent />
    </PinchZoomContainer>
  );
}
```

### GestureEnhancedPlayerGrid

VirtualPlayerGrid with full gesture support.

```tsx
import { GestureEnhancedPlayerGrid } from '@/hub-1-sator/components/GestureEnhancedPlayerGrid';

function PlayerView() {
  return (
    <GestureEnhancedPlayerGrid
      players={players}
      enablePinchZoom={true}
      enablePullToRefresh={true}
      enableLongPress={true}
      onPlayerClick={(player) => console.log('Clicked', player)}
      onPlayerLongPress={(player) => console.log('Long pressed', player)}
      onRefresh={() => refetch()}
    />
  );
}
```

## Configuration

### Swipe Thresholds

```typescript
const SWIPE_CONFIG = {
  threshold: 50,              // px to trigger swipe
  velocityThreshold: 0.5,     // px/ms for fast swipe
  timeout: 500,              // ms to complete swipe
};
```

### Pinch Limits

```typescript
const PINCH_CONFIG = {
  minScale: 0.5,
  maxScale: 3,
  sensitivity: 1,
};
```

### Long Press

```typescript
const LONG_PRESS_CONFIG = {
  duration: 500,      // ms to trigger
  moveThreshold: 10,  // px before cancel
};
```

## Performance

- Uses `passive: true` for scroll listeners
- Spring physics for smooth 60fps animations
- Memoized components prevent unnecessary re-renders
- Virtualized lists maintain performance with 1000+ items

## Browser Support

- iOS Safari 13+
- Chrome Android 80+
- Chrome Desktop 80+
- Firefox 75+
- Edge 80+

## Troubleshooting

### Swipe not working on mobile
Check `touch-action` CSS property. Default is `pan-y` for horizontal swipes.

### Pinch zoom jittery
Increase `sensitivity` value or use `transform: scale()` instead of `zoom`.

### Long press triggers scroll
Increase `moveThreshold` or reduce `duration`.

## Future Enhancements

- [ ] Multi-touch rotation
- [ ] Gesture combinations (pinch + rotate)
- [ ] Velocity-based momentum scrolling
- [ ] Haptic feedback integration
