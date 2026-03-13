[Ver001.000]

# AI IMPLEMENTATION PROMPT: Quaternary Grid System
## SATOR eXe ROTAS — Interactive Panel Architecture

**Purpose:** Guide AI agents to implement the complete Quaternary Grid system with draggable, resizable, minimizable panels for the 4NJZ4 TENET Platform.

---

## I. CORE REQUIREMENTS

### 1.1 Quaternary Grid Definition
The Quaternary Grid is a **4-quadrant dynamic layout system** with:
- **4 Corner Panels** (SATOR, ROTAS, AREPO, OPERA)
- **1 Center Hub** (TENET) - Fixed position, overlay or integrated
- **Expand/Collapse** functionality for all panels
- **Minimize/Maximize** toggles on each panel
- **Drag & Resize** capabilities
- **Group Views** - Save and share layout configurations

### 1.2 Panel States
Each panel must support these states:

| State | Behavior | Visual Indicator |
|-------|----------|------------------|
| **Normal** | Full size within grid | Standard border, visible content |
| **Minimized** | Collapsed to header bar only | Reduced height, title only |
| **Maximized** | Full viewport overlay | Z-index top, backdrop dim |
| **Floating** | Dragged outside grid bounds | Drop shadow, free position |
| **Docked** | Snapped to grid position | Magnetic snap animation |

---

## II. TECHNICAL SPECIFICATION

### 2.1 Component Architecture

```typescript
// Core Types
interface PanelState {
  id: string;
  hub: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET';
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'normal' | 'minimized' | 'maximized' | 'floating';
  zIndex: number;
  isVisible: boolean;
  groupId?: string;
}

interface GroupView {
  id: string;
  name: string;
  panels: PanelState[];
  createdAt: Date;
  isDefault: boolean;
}

// Component Hierarchy
QuaternaryGrid
├── GridContainer (CSS Grid 2x2 + center overlay)
├── DraggablePanel (6 instances)
│   ├── PanelHeader (drag handle + controls)
│   ├── PanelContent (scrollable)
│   └── ResizeHandle (bottom-right corner)
├── TENETCenterHub (fixed center overlay)
├── GroupViewManager (save/load layouts)
└── GridControls (add panel, reset, group selector)
```

### 2.2 Grid Layout Specifications

**Desktop (≥1024px):**
```
┌─────────────────────────────────────────────┐
│  ┌──────────────┐      ┌──────────────┐    │
│  │    SATOR     │      │    AREPO     │    │
│  │   (Top-Left) │      │  (Top-Right) │    │
│  └──────────────┘      └──────────────┘    │
│           ╔═══════════════╗                 │
│           ║    TENET      ║                 │
│           ║   (Center)    ║                 │
│           ╚═══════════════╝                 │
│  ┌──────────────┐      ┌──────────────┐    │
│  │    ROTAS     │      │    OPERA     │    │
│  │ (Bottom-Left)│      │(Bottom-Right)│    │
│  └──────────────┘      └──────────────┘    │
└─────────────────────────────────────────────┘
```

**Tablet (768px–1023px):**
```
┌─────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐   │
│  │               SATOR                  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │               AREPO                  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │               TENET                  │   │
│  │              (Center)                │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │               ROTAS                  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │               OPERA                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Mobile (<768px):**
- Single column stack
- Accordion-style expandable panels
- TENET Hub fixed at top
- Swipe navigation between panels

---

## III. INTERACTION SPECIFICATIONS

### 3.1 Drag Behavior

**Implementation:** `react-grid-layout` or `@dnd-kit/core`

```typescript
// Drag constraints
const dragConstraints = {
  minX: 0,
  maxX: viewport.width - panel.width,
  minY: headerHeight,
  maxY: viewport.height - footerHeight - panel.height
};

// Snap behavior (optional magnetic docking)
const snapThreshold = 20; // pixels
const snapToGrid = (position) => {
  const gridX = Math.round(position.x / gridCellWidth) * gridCellWidth;
  const gridY = Math.round(position.y / gridCellHeight) * gridCellHeight;
  return { x: gridX, y: gridY };
};
```

**Visual Feedback:**
- Drag start: Panel opacity 0.8, scale 1.02, shadow increase
- Dragging: Smooth position tracking, 60fps
- Drag end: Snap animation or settle animation (300ms ease-out)

### 3.2 Resize Behavior

**Resize Handle:** Bottom-right corner, 16x16px target

```typescript
// Resize constraints
const resizeConstraints = {
  minWidth: 200,
  minHeight: 200,
  maxWidth: viewport.width * 0.8,
  maxHeight: viewport.height * 0.8
};

// Aspect ratio lock (optional for minimap)
const maintainAspectRatio = (width, height, ratio = 1) => {
  return { width, height: width / ratio };
};
```

**Visual Feedback:**
- Resize handle: Diagonal lines or grip icon (Lucide: `GripDiagonal`)
- Resizing: Real-time dimension display (tooltip: "800 x 600")
- Resize end: Snap to nearest 50px for clean grid alignment

### 3.3 Minimize/Maximize Behavior

**Minimize Button:** Panel header, right side
```typescript
// Minimize animation (Framer Motion)
const minimizeVariants = {
  normal: { height: 'auto', opacity: 1 },
  minimized: { height: 40, opacity: 1 } // Header only
};

// Transition
const minimizeTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};
```

**Maximize Button:** Panel header, right side (next to minimize)
```typescript
// Maximize animation
const maximizeVariants = {
  normal: { 
    position: 'relative',
    width: '100%',
    height: '100%',
    zIndex: 1
  },
  maximized: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1000
  }
};

// Backdrop when maximized
<AnimatePresence>
  {isMaximized && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.5 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black"
      onClick={restorePanel}
    />
  )}
</AnimatePresence>
```

### 3.4 Expand/Collapse Behavior

**Expand:** Panel grows to fill available grid space
**Collapse:** Panel shrinks to minimum size (200x200)

```typescript
// Grid cell expansion
const expandPanel = (panelId) => {
  // Reduce other panels in same row/column
  const siblings = getSiblingPanels(panelId);
  siblings.forEach(sibling => {
    sibling.size = minimumSize;
  });
  
  // Expand target panel to fill space
  targetPanel.size = calculateAvailableSpace();
};
```

---

## IV. GROUP VIEWS SYSTEM

### 4.1 Group View Definition
A Group View is a saved layout configuration that can be:
- Saved by users
- Shared via URL
- Set as default
- Switched between instantly

### 4.2 UI Implementation

```jsx
// Group View Selector (Top-right of grid)
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-400">View:</span>
  <select 
    value={currentGroupId}
    onChange={(e) => loadGroupView(e.target.value)}
    className="bg-surface border border-border rounded px-2 py-1"
  >
    {groupViews.map(group => (
      <option key={group.id} value={group.id}>{group.name}</option>
    ))}
  </select>
  <button onClick={saveCurrentAsGroup}>Save Current</button>
  <button onClick={shareGroupView}>Share</button>
</div>
```

### 4.3 URL Encoding

```typescript
// Encode layout to URL hash
const encodeLayoutToURL = (panels: PanelState[]) => {
  const layout = panels.map(p => ({
    i: p.id,
    x: p.position.x,
    y: p.position.y,
    w: p.size.width,
    h: p.size.height,
    s: p.state[0] // First letter of state
  }));
  
  const compressed = btoa(JSON.stringify(layout));
  window.location.hash = `layout=${compressed}`;
};

// Decode from URL
const decodeLayoutFromURL = () => {
  const hash = window.location.hash;
  if (!hash.includes('layout=')) return null;
  
  const compressed = hash.split('layout=')[1];
  return JSON.parse(atob(compressed));
};
```

---

## V. PANEL-SPECIFIC SPECIFICATIONS

### 5.1 Minimap Panel

**Default Size:** 250x250px
**Minimum Size:** 200x200px
**Aspect Ratio:** 1:1 (square)

**Features:**
- Zoom: 1x-5x (mouse wheel + buttons)
- Pan: Click and drag when zoomed
- Reset view: Double-click
- Player markers: Triangle (allies), Circle (enemies)
- Radar sweep: Continuous rotation animation

```typescript
interface MinimapConfig {
  mapName: string;
  zoom: number;
  centerX: number;
  centerY: number;
  showGrid: boolean;
  showCallouts: boolean;
  playerFilter: 'all' | 'allies' | 'enemies';
}
```

### 5.2 Live Map Panel

**Default Size:** 400x300px (or fill available space)
**Features:**
- Real-time position updates (WebSocket)
- Player trails (last 5 seconds)
- Ability range indicators
- Smoke/molly overlays
- Spike location marker

### 5.3 Analytics Panel

**Default Size:** 350x250px
**Features:**
- KCRITR stat display (tabular numbers)
- Sparkline charts
- Sortable columns
- Filter controls

### 5.4 Stats Panel

**Default Size:** 300x400px
**Features:**
- Player cards with portraits
- Key metrics (ACS, K/D, ADR)
- Role indicators
- Investment grade badge

### 5.5 Chat/Logs Panel

**Default Size:** 300x200px
**Features:**
- Scrollable message list
- Timestamp display
- User avatars
- Message filtering

### 5.6 Video Feed Panel

**Default Size:** 400x225px (16:9)
**Features:**
- YouTube/Twitch embed
- Sync with minimap timestamp
- Playback controls
- Volume control

---

## VI. STATE MANAGEMENT

### 6.1 Zustand Store Structure

```typescript
interface GridStore {
  // Panel states
  panels: PanelState[];
  activePanelId: string | null;
  
  // Group views
  groupViews: GroupView[];
  currentGroupId: string;
  
  // Grid configuration
  gridColumns: number;
  gridRowHeight: number;
  margin: [number, number];
  
  // Actions
  updatePanel: (id: string, updates: Partial<PanelState>) => void;
  movePanel: (id: string, position: { x: number; y: number }) => void;
  resizePanel: (id: string, size: { width: number; height: number }) => void;
  minimizePanel: (id: string) => void;
  maximizePanel: (id: string) => void;
  restorePanel: (id: string) => void;
  closePanel: (id: string) => void;
  addPanel: (type: PanelType) => void;
  
  // Group views
  saveGroupView: (name: string) => void;
  loadGroupView: (id: string) => void;
  deleteGroupView: (id: string) => void;
  shareGroupView: (id: string) => string;
  
  // Persistence
  persistToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const useGridStore = create<GridStore>((set, get) => ({
  panels: defaultPanels,
  groupViews: defaultGroups,
  
  updatePanel: (id, updates) => set((state) => ({
    panels: state.panels.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
  })),
  
  saveGroupView: (name) => {
    const { panels } = get();
    const newGroup: GroupView = {
      id: crypto.randomUUID(),
      name,
      panels: [...panels],
      createdAt: new Date(),
      isDefault: false
    };
    set((state) => ({
      groupViews: [...state.groupViews, newGroup]
    }));
  },
  
  // ... other actions
}));
```

### 6.2 Persistence Strategy

```typescript
// Auto-save to localStorage
useEffect(() => {
  const unsubscribe = useGridStore.subscribe(
    (state) => {
      localStorage.setItem('sator-grid-layout', JSON.stringify({
        panels: state.panels,
        currentGroupId: state.currentGroupId
      }));
    }
  );
  
  return unsubscribe;
}, []);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('sator-grid-layout');
  if (saved) {
    const { panels, currentGroupId } = JSON.parse(saved);
    useGridStore.setState({ panels, currentGroupId });
  }
}, []);
```

---

## VII. STYLING SPECIFICATIONS

### 7.1 Panel Styling (Tailwind)

```jsx
// Panel Container
<div className={`
  relative
  bg-surface/80
  backdrop-blur-md
  border border-border
  rounded-sm
  overflow-hidden
  transition-shadow duration-200
  ${isDragging ? 'shadow-2xl scale-[1.02] opacity-80 z-50' : 'shadow-lg'}
  ${isMaximized ? 'fixed inset-0 z-[1000] rounded-none' : ''}
  ${isMinimized ? 'h-10' : 'h-auto'}
`}>

// Panel Header (drag handle)
<div className="
  flex items-center justify-between
  px-3 py-2
  bg-surface/90
  border-b border-border
  cursor-move
  select-none
">
  <div className="flex items-center gap-2">
    <HubIcon className={`w-4 h-4 text-${hubColor}`} />
    <span className="font-medium text-sm">{title}</span>
  </div>
  
  {/* Window Controls */}
  <div className="flex items-center gap-1">
    <button onClick={minimize} className="p-1 hover:bg-white/10 rounded">
      <Minus className="w-3 h-3" />
    </button>
    <button onClick={maximize} className="p-1 hover:bg-white/10 rounded">
      <Maximize2 className="w-3 h-3" />
    </button>
    <button onClick={close} className="p-1 hover:bg-red-500/20 rounded">
      <X className="w-3 h-3" />
    </button>
  </div>
</div>

// Resize Handle
<div 
  className="
    absolute bottom-0 right-0
    w-4 h-4
    cursor-se-resize
    flex items-end justify-end
    p-0.5
  "
  onMouseDown={startResize}
>
  <GripDiagonal className="w-3 h-3 text-gray-500" />
</div>
```

### 7.2 Hub-Specific Styling

| Hub | Border Color | Glow Color | Header Accent |
|-----|-------------|------------|---------------|
| SATOR | border-yellow-500/30 | shadow-yellow-500/20 | bg-yellow-500/10 |
| ROTAS | border-cyan-500/30 | shadow-cyan-500/20 | bg-cyan-500/10 |
| AREPO | border-blue-500/30 | shadow-blue-500/20 | bg-blue-500/10 |
| OPERA | border-purple-500/30 | shadow-purple-500/20 | bg-purple-500/10 |
| TENET | border-white/30 | shadow-white/20 | bg-white/10 |

---

## VIII. ACCESSIBILITY REQUIREMENTS

### 8.1 Keyboard Navigation

```typescript
// Keyboard shortcuts
const keyboardShortcuts = {
  'Tab': 'Focus next panel',
  'Shift+Tab': 'Focus previous panel',
  'Enter': 'Activate focused panel',
  'Escape': 'Restore maximized panel',
  'Ctrl/Cmd+M': 'Minimize focused panel',
  'Ctrl/Cmd+Shift+M': 'Maximize focused panel',
  'Ctrl/Cmd+W': 'Close focused panel',
  'Ctrl/Cmd+G': 'Open group view selector'
};

// Focus management
const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && maximizedPanelId) {
      restorePanel(maximizedPanelId);
    }
    // ... other shortcuts
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [maximizedPanelId]);
```

### 8.2 ARIA Labels

```jsx
<div
  role="region"
  aria-label={`${hub} panel: ${title}`}
  aria-expanded={!isMinimized}
  aria-hidden={isMinimized}
  tabIndex={0}
>
  <div
    role="button"
    aria-label="Drag to move panel"
    aria-grabbed={isDragging}
  >
    {/* Header content */}
  </div>
</div>
```

---

## IX. PERFORMANCE OPTIMIZATIONS

### 9.1 Virtualization (for large panels)

```typescript
// Use react-window for long lists
import { FixedSizeList as List } from 'react-window';

const ChatPanel = ({ messages }) => (
  <List
    height={300}
    itemCount={messages.length}
    itemSize={40}
    width="100%"
  >
    {({ index, style }) => (
      <ChatMessage 
        message={messages[index]} 
        style={style}
      />
    )}
  </List>
);
```

### 9.2 Memoization

```typescript
// Prevent unnecessary re-renders
const DraggablePanel = React.memo(({ panel, ...props }) => {
  // Component logic
}, (prev, next) => {
  return (
    prev.panel.position.x === next.panel.position.x &&
    prev.panel.position.y === next.panel.position.y &&
    prev.panel.size.width === next.panel.size.width &&
    prev.panel.size.height === next.panel.size.height &&
    prev.panel.state === next.panel.state
  );
});
```

---

## X. TESTING CHECKLIST

### 10.1 Functionality Tests

- [ ] Drag panel to new position
- [ ] Resize panel to minimum/maximum bounds
- [ ] Minimize panel (header only visible)
- [ ] Maximize panel (full viewport)
- [ ] Restore panel from minimized/maximized
- [ ] Close and reopen panel
- [ ] Add new panel to grid
- [ ] Save layout as group view
- [ ] Load different group view
- [ ] Share group view via URL
- [ ] Layout persists after refresh

### 10.2 Interaction Tests

- [ ] Drag with mouse
- [ ] Resize with mouse
- [ ] Keyboard navigation (Tab, arrows)
- [ ] Keyboard shortcuts (minimize, maximize, close)
- [ ] Touch gestures (mobile)
- [ ] Scroll within panel content

### 10.3 Responsive Tests

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x812)

---

## XI. COMMON AI PITFALLS TO AVOID

### ❌ DON'T:
1. Use fixed pixel values for responsive layouts
2. Forget to implement the resize handle
3. Ignore z-index management (panels overlapping incorrectly)
4. Use default HTML5 drag and drop (use react-dnd or @dnd-kit)
5. Store panel positions as percentages (use pixels for precision)
6. Forget to handle window resize events
7. Implement drag without proper cursor feedback
8. Use setState in rapid mousemove events (causes lag)

### ✅ DO:
1. Use requestAnimationFrame for smooth drag/resize
2. Implement proper bounds checking
3. Add visual feedback during interactions
4. Debounce persistence saves
5. Use CSS transforms instead of left/top for animations
6. Test with actual mouse/touch interactions
7. Implement proper cleanup for event listeners
8. Use React.memo for panel components

---

## XII. IMPLEMENTATION ROADMAP

### Phase 1: Core Grid (Week 1)
- [ ] Set up react-grid-layout
- [ ] Implement basic 2x2 grid
- [ ] Add TENET center overlay
- [ ] Style panels with hub colors

### Phase 2: Interactions (Week 2)
- [ ] Implement drag functionality
- [ ] Implement resize functionality
- [ ] Add minimize/maximize buttons
- [ ] Implement panel states

### Phase 3: Group Views (Week 3)
- [ ] Implement save/load layouts
- [ ] Add group view selector UI
- [ ] Implement URL encoding
- [ ] Add persistence

### Phase 4: Polish (Week 4)
- [ ] Add animations (Framer Motion)
- [ ] Implement accessibility
- [ ] Add keyboard shortcuts
- [ ] Performance optimization

---

*End of AI Implementation Prompt for Quaternary Grid System*
