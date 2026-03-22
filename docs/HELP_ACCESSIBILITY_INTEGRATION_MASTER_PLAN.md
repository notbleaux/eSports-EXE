[Ver001.000]

# HELPMANAGER, ACCESSIBILITY & GAME-WEB INTEGRATION — FOREMAN MASTER PLAN
**Repository:** Libre-X-eSport 4NJZ4 TENET Platform  
**Source Branch:** 105bfaf1 (March 18, 2026 — docs: integration plan, accessibility guide, HelpManager)  
**Foreman:** Central coordination node  
**Total Waves:** 6 waves, 18 agents  
**Estimated Duration:** 144 hours (3.5 weeks @ 42h/week)

---

## EXECUTIVE SUMMARY

This master plan transforms the original "12 Improvements" concept into a cohesive, production-ready development pipeline. The original was a loose list; this is an integrated system where HelpManager, accessibility, and game-web integration work as unified components.

### Core Concept Remodeled

**Original:** 12 disconnected improvement suggestions  
**Remodeled:** 3 integrated workstreams with unified architecture:
- **Stream A:** Unified Help System (web + game + cross-platform)
- **Stream B:** Accessibility-First Design (WCAG 2.2 AAA + game accessibility)
- **Stream C:** Seamless Game-Web Integration (bidirectional sync, shared state)

**Key Innovations Added:**
- **Unified Context Engine:** Single source of truth for help content across web/game
- **Progressive Disclosure:** Help adapts to user expertise level
- **Accessibility Bridge:** Shared accessibility settings propagate web→game
- **Live Sync:** Real-time state synchronization (not just "embed")
- **Circuit-Breaker Pattern:** Graceful degradation for all network operations

---

## PHASE 1: UNIFIED HELP SYSTEM FOUNDATION (Week 1)

### Wave 1.1: Context Engine & Content Architecture (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 1-A** | Help Content Schema | JSON Schema, content hierarchy, localization structure |
| **Agent 1-B** | Context Detection Engine | User expertise levels, progress tracking, contextual triggers |
| **Agent 1-C** | Knowledge Graph | Topic relationships, search index, recommendation engine |

**Unified Help Content Schema:**

```typescript
// Single source of truth for ALL help content
interface HelpContent {
  id: string;
  version: string;
  
  // Multi-platform delivery
  platforms: {
    web?: WebHelpConfig;
    game?: GameHelpConfig;
    mobile?: MobileHelpConfig;
  };
  
  // Progressive disclosure levels
  levels: {
    beginner: HelpLevel;
    intermediate: HelpLevel;
    advanced: HelpLevel;
  };
  
  // Contextual triggers
  triggers: HelpTrigger[];
  
  // Localization
  i18n: Record<Locale, LocalizedContent>;
  
  // Analytics
  metrics: HelpMetrics;
}

interface HelpLevel {
  summary: string;           // 1 sentence
  detail: string;            // 1 paragraph
  interactive?: string;      // Guided tour/walkthrough
  video?: string;            // Tutorial video ID
  shortcut?: string;         // Keyboard shortcut
}

interface HelpTrigger {
  type: 'first_visit' | 'error_count' | 'time_spent' | 'action_stuck' | 'manual';
  threshold: number;
  cooldown: number;          // Don't spam
  priority: 1-5;
}
```

**User Expertise Detection:**

```typescript
interface UserExpertiseProfile {
  overall: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  perFeature: Record<FeatureId, {
    level: ExpertiseLevel;
    confidence: number;      // 0-1 based on data volume
    lastInteraction: Date;
    helpRequests: number;    // Declining = learning
    errors: number;          // Spikes indicate confusion
  }>;
  
  // Auto-detect promotion
  promotionCriteria: {
    sessionsCompleted: number;
    featuresUsed: number;
    helpRequestsDecline: number;  // Trend
    successfulActions: number;
  };
}
```

---

### Wave 1.2: Web Help Components (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 2-A** | HelpOverlay System | React components, progressive disclosure, inline help |
| **Agent 2-B** | Search & Discovery | Full-text search, recommendations, related topics |
| **Agent 2-C** | HelpWiki Portal | Standalone wiki pages, printable guides, PDF export |

**HelpOverlay Component Spec:**

```typescript
interface HelpOverlayProps {
  // Context-aware auto-display
  trigger?: 'auto' | 'error' | 'stuck' | 'manual';
  
  // Progressive disclosure
  initialLevel?: 'summary' | 'detail' | 'interactive';
  allowLevelChange?: boolean;
  
  // Positioning
  anchor?: 'cursor' | 'element' | 'center' | 'sidebar';
  targetElement?: string;    // CSS selector
  
  // Persistence
  dismissible?: boolean;
  rememberDismissal?: boolean;
  
  // Callbacks
  onDismiss?: () => void;
  onLevelChange?: (level: HelpLevel) => void;
  onHelpful?: (wasHelpful: boolean) => void;
}

// Usage examples:
// <HelpOverlay trigger="error" errorCode="SIM_001" />
// <HelpOverlay anchor="element" targetElement="#analytics-panel" />
// <HelpOverlay trigger="stuck" threshold={30000} /> // 30s stuck
```

---

### Wave 1.3: Godot HelpManager Remake (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 3-A** | HelpManager.gd Refactor | RichTextLabel, context detection, progressive disclosure |
| **Agent 3-B** | In-Game Tutorial System | Guided tours, interactive prompts, practice mode |

**Remodeled HelpManager.gd:**

```gdscript
class_name HelpManager extends CanvasLayer

## UNIFIED HELP SYSTEM — Godot Implementation
## Syncs with web help content via shared JSON

const HELP_CONTENT_URL := "res://data/help_content.json"
const USER_PROFILE_PATH := "user://expertise_profile.json"

@export var display_mode: DisplayMode = DisplayMode.AUTO
@export var auto_dismiss_delay: float = 30.0

enum DisplayMode {
	AUTO,       # Show based on context + expertise
	MANUAL,     # Only on explicit request
	TUTORIAL,   # Full guided mode
	MINIMAL     # Only critical errors
}

var content_library: HelpContentLibrary
var user_profile: UserExpertiseProfile
var current_context: HelpContext
var active_tip: HelpTip

@onready var help_panel: HelpPanel  # Custom RichTextLabel container
@onready var context_detector: ContextDetector

func _ready():
	_load_content()
	_load_user_profile()
	_setup_context_detection()
	
	# Connect to web bridge if available
	if WebBridge.is_available():
		WebBridge.help_requested.connect(_on_web_help_request)

func show_help(content_id: String, level: String = "auto"):
	var content = content_library.get(content_id)
	var target_level = _determine_level(content, level)
	
	var tip = HelpTip.new()
	tip.content = content.levels[target_level]
	tip.position = _calculate_position(content.preferred_position)
	tip.dismissed.connect(_on_tip_dismissed.bind(content_id))
	
	add_child(tip)
	active_tip = tip
	
	_analytics.record_help_shown(content_id, target_level)

func _determine_level(content: HelpContent, requested: String) -> String:
	if requested != "auto":
		return requested
	
	# Check user expertise
	var feature_expertise = user_profile.get_expertise(content.feature_id)
	return feature_expertise.recommended_help_level

func _on_context_change(new_context: HelpContext):
	current_context = new_context
	
	# Auto-trigger help if conditions met
	if display_mode == DisplayMode.AUTO:
		var triggered_content = content_library.find_triggered(new_context)
		if triggered_content and not _recently_shown(triggered_content.id):
			show_help(triggered_content.id)

func dismiss_all():
	if active_tip:
		active_tip.dismiss()
	active_tip = null
```

---

## PHASE 2: ACCESSIBILITY-FIRST ARCHITECTURE (Week 1-2)

### Wave 2.1: WCAG 2.2 AAA Foundation (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 4-A** | ARIA & Screen Reader | Live regions, semantic HTML, announcements |
| **Agent 4-B** | Keyboard Navigation | Focus management, shortcuts, skip links |
| **Agent 4-C** | Visual Accessibility | Color-blind modes, high contrast, motion reduction |

**Accessibility Settings Schema:**

```typescript
interface AccessibilitySettings {
  // Visual
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  highContrast: boolean;
  reduceMotion: boolean;
  fontScale: number;        // 1.0 = 100%
  
  // Audio
  screenReader: boolean;
  audioDescriptions: boolean;
  volumeAnnouncements: number;
  
  // Motor
  stickyKeys: boolean;
  dwellClick: boolean;      // For eye tracking
  gestureMode: 'standard' | 'switch' | 'eye';
  
  // Cognitive
  reduceDistractions: boolean;
  extendedTimeouts: boolean;
  readingLevel: 'simple' | 'standard' | 'technical';
  
  // Sync to game
  syncToGame: boolean;
}

// Sync mechanism
interface AccessibilitySync {
  webSettings: AccessibilitySettings;
  
  toGameFormat(): GodotAccessibilityConfig;
  fromGameFormat(gameConfig: GodotAccessibilityConfig): void;
  
  // Real-time sync via WebSocket/bridge
  subscribeToChanges(callback: (settings: AccessibilitySettings) => void): void;
}
```

---

### Wave 2.2: Game Accessibility (Godot) (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 5-A** | Godot AccessNode System | Screen reader TTS, audio cues, visual alternatives |
| **Agent 5-B** | Input Accessibility | Full keyboard control, switch control, eye tracking |

**Godot Accessibility Bridge:**

```gdscript
class_name AccessibilityBridge extends Node

## Bridges web accessibility settings to Godot
## Implements WCAG-equivalent for games

var settings: AccessibilitySettings

# Text-to-speech
var tts: TTSManager

# Audio description
var audio_describer: AudioDescriber

# Visual alternatives
var alternative_display: AlternativeDisplay

func _ready():
	# Try to sync from web
	if WebBridge.is_available():
		WebBridge.accessibility_settings_received.connect(_apply_settings)
		WebBridge.request_accessibility_settings()
	else:
		_load_local_settings()

func _apply_settings(new_settings: Dictionary):
	settings = AccessibilitySettings.from_dict(new_settings)
	
	# Apply to all accessible nodes
	for node in get_tree().get_nodes_in_group("accessible"):
		node.apply_accessibility_settings(settings)
	
	# Announce change
	announce("Accessibility settings updated")

func announce(message: String, priority: int = 1):
	if not settings.screenReader:
		return
	
	tss.speak(message, priority)
	
	# Also update web if connected
	if WebBridge.is_available():
		WebBridge.send_announcement(message)

# Visual alternatives for color information
func get_accessible_color(original: Color, meaning: String) -> Color:
	match settings.colorBlindMode:
		"protanopia":
			return ColorBlindSimulator.protanopia(original)
		"deuteranopia":
			return ColorBlindSimulator.deuteranopia(original)
		"tritanopia":
			return ColorBlindSimulator.tritanopia(original)
		_:
			return original

# Pattern/text overlay for color-only information
func get_accessibility_overlay(type: String) -> Texture2D:
	if settings.colorBlindMode == "none":
		return null
	return preload("res://accessibility/overlays/%s.png" % type)
```

---

## PHASE 3: GAME-WEB INTEGRATION (Week 2)

### Wave 3.1: Shared State & Sync Architecture (3 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 6-A** | State Sync Engine | Zustand↔Godot bridge, real-time sync, conflict resolution |
| **Agent 6-B** | Auth Pipeline | JWT shared sessions, refresh tokens, secure storage |
| **Agent 6-C** | Circuit Breaker | Network resilience, retry logic, offline mode |

**Unified State Sync:**

```typescript
// Bidirectional state synchronization
interface SyncBridge {
  // Web side (Zustand store)
  webStore: StoreApi<SharedState>;
  
  // Connection to game
  gameConnection: GameConnection;
  
  // Sync configuration
  config: {
    realtime: boolean;        // WebSocket vs polling
    conflictResolution: 'last-write-wins' | 'merge' | 'manual';
    offlineQueue: boolean;    // Queue changes when offline
    encryption: boolean;
  };
  
  // State slices that sync
  syncedSlices: (keyof SharedState)[];
}

interface SharedState {
  // User identity
  user: {
    id: string;
    profile: UserProfile;
    expertise: UserExpertiseProfile;
  };
  
  // Settings (sync both ways)
  settings: {
    accessibility: AccessibilitySettings;
    preferences: UserPreferences;
    keybinds: KeybindConfig;
  };
  
  // Game state (read-only from web)
  game: {
    isRunning: boolean;
    currentMatch: MatchId | null;
    replayPlaying: ReplayId | null;
  };
  
  // Progress (sync both ways)
  progress: {
    achievements: Achievement[];
    tutorialsCompleted: string[];
    stats: UserStats;
  };
}
```

---

### Wave 3.2: Embed & Replay System (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 7-A** | HTML5 Embed System | iframe integration, message passing, responsive sizing |
| **Agent 7-B** | Replay Sync | WebSocket replay streaming, timeline sync, annotations |

**Embed Integration:**

```typescript
interface GameEmbedConfig {
  // Source
  src: string;              // Godot HTML5 export URL
  
  // Sizing
  responsive: boolean;
  aspectRatio: '16:9' | '4:3' | 'auto';
  minHeight: number;
  maxHeight: number;
  
  // Features
  allowFullscreen: boolean;
  allowKeyboard: boolean;   // Capture keyboard events
  transparentBackground: boolean;
  
  // Communication
  messageChannel: boolean;  // postMessage API
  stateSync: boolean;       // Full state synchronization
  
  // Loading
  loadingComponent: React.ComponentType;
  errorComponent: React.ComponentType;
}

// React component
const GameEmbed: React.FC<GameEmbedConfig> = (config) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { sendMessage, state } = useGameBridge(iframeRef);
  
  return (
    <EmbedContainer aspectRatio={config.aspectRatio}>
      <iframe
        ref={iframeRef}
        src={config.src}
        allow="fullscreen; gamepad"
        sandbox="allow-scripts allow-same-origin"
      />
      {state.loading && <config.loadingComponent />}
      {state.error && <config.errorComponent error={state.error} />}
    </EmbedContainer>
  );
};
```

---

## PHASE 4: ADVANCED FEATURES (Week 3)

### Wave 4.1: Metrics & Analytics (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 8-A** | Telemetry System | Unified analytics, performance monitoring, error tracking |
| **Agent 8-B** | Dashboard Integration | Shared metrics display, comparative analysis |

---

### Wave 4.2: CI/CD & Performance Parity (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 9-A** | Godot CI/CD | GitHub Actions export, automated testing, deployment |
| **Agent 9-B** | Performance Optimization | Lighthouse 100, Godot FPS targets, bundle optimization |

---

## PHASE 5: TESTING & VALIDATION (Week 3-4)

### Wave 5.1: Accessibility Testing (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 10-A** | Automated A11y Testing | axe-core, Lighthouse CI, Pa11y |
| **Agent 10-B** | Manual Testing Protocols | Screen reader testing, keyboard navigation, color blind sim |

---

### Wave 5.2: Integration Testing (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 11-A** | Sync Testing | State consistency, conflict resolution, offline behavior |
| **Agent 11-B** | End-to-End Flows | User journeys across web→game→web |

---

## PHASE 6: DOCUMENTATION & RELEASE (Week 4)

### Wave 6.1: Documentation (2 agents)

| Agent | Task | Output |
|-------|------|--------|
| **Agent 12-A** | Developer Documentation | API reference, integration guides, architecture diagrams |
| **Agent 12-B** | User Documentation | Help wiki, accessibility guide, troubleshooting |

---

## AGENT ASSIGNMENT SUMMARY

```
WAVE 1.1 (3 agents): Help Content Architecture
├── Agent 1-A: Content Schema & Localization
├── Agent 1-B: Context Detection Engine
└── Agent 1-C: Knowledge Graph & Search

WAVE 1.2 (3 agents): Web Help Components
├── Agent 2-A: HelpOverlay System
├── Agent 2-B: Search & Discovery
└── Agent 2-C: HelpWiki Portal

WAVE 1.3 (2 agents): Godot HelpManager
├── Agent 3-A: HelpManager.gd Refactor
└── Agent 3-B: In-Game Tutorial System

WAVE 2.1 (3 agents): WCAG Foundation
├── Agent 4-A: ARIA & Screen Readers
├── Agent 4-B: Keyboard Navigation
└── Agent 4-C: Visual Accessibility

WAVE 2.2 (2 agents): Godot Accessibility
├── Agent 5-A: AccessNode & TTS
└── Agent 5-B: Input Accessibility

WAVE 3.1 (3 agents): State Sync
├── Agent 6-A: Sync Engine
├── Agent 6-B: Auth Pipeline
└── Agent 6-C: Circuit Breaker

WAVE 3.2 (2 agents): Embed & Replay
├── Agent 7-A: HTML5 Embed
└── Agent 7-B: Replay Sync

WAVE 4.1 (2 agents): Metrics
├── Agent 8-A: Telemetry
└── Agent 8-B: Dashboards

WAVE 4.2 (2 agents): CI/CD
├── Agent 9-A: Godot CI/CD
└── Agent 9-B: Performance

WAVE 5.1 (2 agents): A11y Testing
├── Agent 10-A: Automated Testing
└── Agent 10-B: Manual Protocols

WAVE 5.2 (2 agents): Integration Testing
├── Agent 11-A: Sync Testing
└── Agent 11-B: E2E Flows

WAVE 6.1 (2 agents): Documentation
├── Agent 12-A: Developer Docs
└── Agent 12-B: User Docs

TOTAL: 30 agents across 6 phases
```

---

## QUALITY GATES

### Gate 1: Content Architecture (End Phase 1)
- [ ] Help content schema validates
- [ ] Context detection accuracy >80%
- [ ] Web & Godot content parity

### Gate 2: Accessibility Compliance (End Phase 2)
- [ ] WCAG 2.2 AA compliance (AAA where feasible)
- [ ] Lighthouse a11y score 100
- [ ] Screen reader tested

### Gate 3: Integration Stability (End Phase 3)
- [ ] State sync latency <100ms
- [ ] Offline mode functional
- [ ] Auth session seamless

### Gate 4: Performance (End Phase 4)
- [ ] Lighthouse score >95 all categories
- [ ] Godot Web export loads <3s
- [ ] FPS stable 60 on target devices

### Gate 5: Test Coverage (End Phase 5)
- [ ] A11y tests automated in CI
- [ ] E2E tests cover critical paths
- [ ] No critical bugs open

### Gate 6: Release Ready (End Phase 6)
- [ ] Documentation complete
- [ ] User testing feedback addressed
- [ ] Foreman final sign-off

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Web/game state desync | Event sourcing + conflict resolution |
| Accessibility complexity | Phased approach, automated testing |
| iframe security | Strict CSP, postMessage validation |
| TTS performance | Web Speech API + caching |
| Offline complexity | Graceful degradation, sync on reconnect |

---

## SUCCESS CRITERIA

- **Unified Help:** Same content, adapted per platform, progressive disclosure
- **Accessibility:** WCAG 2.2 AA minimum, tested with real assistive tech
- **Integration:** Seamless auth, real-time sync, offline capable
- **Performance:** Lighthouse 100, 60fps, <3s load
- **Quality:** Automated testing, documented, maintainable

---

*Foreman: Update with [VerMMM.mmm] on each revision.*
*Agents: Follow this plan, submit drafts for review.*
