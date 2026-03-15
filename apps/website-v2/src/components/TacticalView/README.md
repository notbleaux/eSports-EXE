[Ver001.000]

# TacticalView Component

An enriched minimap tactical view for VCT (Valorant Champions Tour) matches, providing real-time visualization of agent positions, abilities, and match events.

## Features

- **Canvas-based Rendering**: High-performance 2D rendering using HTML5 Canvas API
- **Real-time Updates**: WebSocket integration for live match data
- **Movement Trails**: Visualize player movement paths over time
- **Timeline Scrubbing**: Navigate through match history with an interactive timeline
- **Ability Visualization**: See active abilities (smokes, mollies, etc.) on the map
- **Spike Tracking**: Real-time spike position and status indicators
- **Zoom & Pan**: Navigate the tactical map with intuitive controls
- **Playback Controls**: Play, pause, and adjust playback speed

## Components

### TacticalView
Main container component that orchestrates the tactical visualization.

```tsx
import { TacticalView } from './components/TacticalView';

<TacticalView
  matchId="vct-2024-sen-vs-100t"
  timeline={matchTimeline}
  mapData={mapData}
  players={players}
  onFrameChange={(frame) => console.log('Frame:', frame)}
  onEventSelect={(event) => console.log('Event:', event)}
/>
```

### TacticalControls
Playback and visualization control panel.

```tsx
import { TacticalControls } from './components/TacticalView';

<TacticalControls
  isPlaying={isPlaying}
  playbackSpeed={1}
  showTrails={true}
  showVisionCones={false}
  showHealthBars={true}
  showPlayerNames={true}
  onTogglePlayback={() => setPlaying(!isPlaying)}
  onSpeedChange={(speed) => setSpeed(speed)}
  // ... other handlers
/>
```

### TimelineScrubber
Match timeline with round markers and key events.

```tsx
import { TimelineScrubber } from './components/TacticalView';

<TimelineScrubber
  currentTimestamp={45000}
  totalDuration={100000}
  roundResults={roundResults}
  keyEvents={keyEvents}
  onSeek={(timestamp) => seekTo(timestamp)}
  currentRound={3}
/>
```

### AgentSprite
Individual player/agent representation.

```tsx
import { AgentSprite } from './components/TacticalView';

<AgentSprite
  agent={agent}
  player={player}
  position={{ x: 100, y: 200 }}
  rotation={45}
  health={85}
  armor={50}
  isAlive={true}
  hasSpike={false}
/>
```

## Hooks

### useTacticalWebSocket
Manages WebSocket connection for real-time updates.

```tsx
import { useTacticalWebSocket } from './components/TacticalView';

const [wsState, wsActions] = useTacticalWebSocket({
  matchId: 'vct-2024-match-1',
  onFrameUpdate: (frame) => setCurrentFrame(frame),
  onEventReceived: (event) => addEvent(event),
  autoConnect: true,
});

// Connection status
console.log(wsState.isConnected); // true/false

// Actions
wsActions.connect();
wsActions.disconnect();
wsActions.seekToTimestamp(45000);
```

## Data Types

### MatchTimeline
Complete match data structure:

```typescript
interface MatchTimeline {
  matchId: string;
  mapName: string;
  matchDuration: number; // seconds
  frames: MatchFrame[];
  roundResults: RoundResult[];
  keyEvents: KeyEvent[];
}
```

### MatchFrame
Single frame of match state:

```typescript
interface MatchFrame {
  timestamp: number; // milliseconds
  roundNumber: number;
  roundTime: number; // seconds into round
  phase: GamePhase;
  agentFrames: AgentFrame[];
  abilitiesActive: ActiveAbility[];
  spikePosition?: Position;
  spikeStatus: SpikeStatus;
}
```

### AgentFrame
Player state at a specific frame:

```typescript
interface AgentFrame {
  playerId: string;
  position: Position;
  rotation: number; // degrees
  health: number;
  armor: number;
  isAlive: boolean;
  hasSpike: boolean;
  isPlanting: boolean;
  isDefusing: boolean;
}
```

## Demo

Use the `TacticalViewDemo` component to see the tactical view in action with mock data:

```tsx
import { TacticalViewDemo } from './components/TacticalView';

function App() {
  return <TacticalViewDemo />;
}
```

## Styling

The component uses CSS-in-JS for component-specific styles and includes a `TacticalView.css` file for global styles. Customize the appearance by overriding CSS variables:

```css
.tactical-view {
  --tv-bg-primary: #1a1a2e;
  --tv-bg-secondary: #2d3436;
  --tv-accent: #74b9ff;
  --tv-attacker: #ff4757;
  --tv-defender: #3742fa;
}
```

## Performance Considerations

1. **Canvas Rendering**: Uses requestAnimationFrame for smooth 60fps rendering
2. **Frame Deduplication**: Only renders when data changes
3. **Trail Optimization**: Configurable trail length to balance visual quality and performance
4. **Lazy Initialization**: WebSocket connects only when needed

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires support for:
- HTML5 Canvas API
- WebSocket API
- ES2020 JavaScript features

## Future Enhancements

- [ ] 3D map rendering with Three.js
- [ ] Heatmap overlay for common positions
- [ ] Vision cone visualization
- [ ] Grenade trajectory prediction
- [ ] Multi-match comparison view
- [ ] Export to video/GIF

## License

Part of the Libre-X-eSport 4NJZ4 TENET Platform.
