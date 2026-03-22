[Ver002.000]

# TeNET Valorant Ability Timeline — Enhanced Technical Design

**Status**: Enhanced Specification  
**Date**: 2026-03-22  
**Game**: Valorant  
**Scope**: Professional ability analysis with site control visualization, agent meta tracking, and team composition insights

---

## Executive Summary

This enhanced specification transforms the base ability timeline into a comprehensive tactical analysis tool. It combines VLR.gg's clean agent stat presentation with HLTV-level depth, featuring real-time site control visualization and cross-match pattern recognition.

**Key Innovations**:
- Site control heatmap with real-time occupancy calculations
- Agent meta analysis with pick/win rate tracking
- Team composition DNA profiling
- Cross-match pattern recognition
- Coach annotation layer

---

## 1. Feature Matrix

| Feature | Public Mode | Coach Mode | Description |
|---------|-------------|------------|-------------|
| Ability Timeline | ✅ | ✅ | Per-agent ability usage visualization |
| Site Control | ✅ | ✅ | Real-time A/B/C site occupancy |
| Agent Stats | ✅ | ✅ | Kills, deaths, ACS by agent |
| Composition Analysis | ❌ | ✅ | Team DNA, role balance |
| Pattern Recognition | ❌ | ✅ | "They always flash here" |
| Coach Annotations | ❌ | ✅ | Drawings, notes, voice clips |
| Opponent Tendencies | ❌ | ✅ | Historical patterns vs specific teams |
| Practice Drills | ✅ | ✅ | Ability timing exercises |

---

## 2. Enhanced Data Schema

### 2.1 AbilityEvent (Extended)

```typescript
interface AbilityEvent {
  // Core fields (from base spec)
  id: string;
  matchId: string;
  roundNumber: number;
  tick: number;
  playerId: string;
  playerName: string;
  agentName: string;
  agentRole: "Duelist" | "Initiator" | "Controller" | "Sentinel";
  abilityName: string;
  abilityType: "signature" | "ultimate" | "basic";
  
  // Enhanced fields
  abilitySlot: "Q" | "E" | "C" | "X";  // Keyboard slot
  
  // Positioning
  castPosition: Vector3;
  targetPosition?: Vector3;
  trajectoryPoints?: Vector3[];  // For projectiles
  
  // Timing
  cooldownSeconds: number;
  roundTimeMs: number;  // Time elapsed in round
  
  // Context
  roundContext: {
    scoreAttack: number;
    scoreDefense: number;
    roundPhase: "buy" | "early" | "mid" | "late" | "post";
    attackingSide: "A" | "B";
    sitePushed?: "A" | "B" | "C";
  };
  
  // Tactical
  tacticalPurpose?: "entry" | "info" | "delay" | "heal" | "rez" | "execute" | "retake";
  comboId?: string;  // Links abilities used in combination
  
  // Effectiveness (calculated)
  effectiveness: {
    enemiesHit?: number;
    enemiesKilled?: number;
    teammatesAssisted?: number;
    damageDealt?: number;
    healingDone?: number;
    durationValue?: number;  // Stun/smoke duration that mattered
    
    // Agent-specific
    reconDartsRevealed?: number;  // Sova
    tripsTriggered?: number;      // Cypher/Killjoy
    wallsPlaced?: number;         // Sage
    orbsCollected?: number;       // Reyna
  };
  
  // Outcome
  roundWon: boolean;
  playerSurvived: boolean;
  
  // Comparison
  vsAverage: {  // Compared to agent average
    acsDelta: number;
    usageTimingDelta: number;  // Seconds from typical
  };
}
```

### 2.2 SiteControl Schema

```typescript
interface SiteControlSnapshot {
  roundNumber: number;
  tick: number;
  timestamp: number;  // ms elapsed in round
  
  siteName: "A" | "B" | "C";
  
  // Occupancy
  attackers: {
    count: number;
    playerIds: string[];
    agents: string[];
    utilities: string[];  // Active utility types
  };
  
  defenders: {
    count: number;
    playerIds: string[];
    agents: string[];
    utilities: string[];
  };
  
  // Control calculation
  controlRatio: number;  // 0 = defender full control, 1 = attacker full control
  controlZone: "attacker" | "contested" | "defender";
  
  // Utility coverage
  smokeCoverage: number;  // 0-1 area smoked
  mollyCoverage: number;  // 0-1 area burning
  reconCoverage: number;  // 0-1 area revealed
  
  // Events
  eventsLast5Seconds: string[];  // Ability event IDs
  
  // Derived
  predictedOutcome?: "attacker_win" | "defender_win" | "uncertain";
  confidence: number;  // 0-1
}

interface SiteControlTimeline {
  site: "A" | "B" | "C";
  roundNumber: number;
  snapshots: SiteControlSnapshot[];
  
  // Aggregated
  avgControlRatio: number;
  peakAttackerControl: number;
  peakDefenderControl: number;
  controlChanges: number;  // Number of times control flipped
}
```

### 2.3 Team Composition Schema

```typescript
interface TeamComposition {
  id: string;
  matchId: string;
  roundNumber: number;
  teamId: string;
  
  agents: {
    playerId: string;
    agent: string;
    role: string;
  }[];
  
  // Role distribution
  roleBreakdown: {
    duelist: number;
    initiator: number;
    controller: number;
    sentinel: number;
  };
  
  // Composition DNA
  dna: {
    aggression: number;    // 0-1 based on duelist count + entry util
    control: number;       // 0-1 based on controllers
    info: number;          // 0-1 based on initiators
    defense: number;       // 0-1 based on sentinels
  };
  
  // Historical performance
  historicalStats: {
    timesPlayed: number;
    winRate: number;
    avgRoundDuration: number;
    preferredSites: string[];  // Sites this comp favors
  };
  
  // Counter-compositions
  weakAgainst: { compId: string; lossRate: number }[];
  strongAgainst: { compId: string; winRate: number }[];
}
```

---

## 3. Visualization Architecture

### 3.1 Timeline Lane System

```typescript
interface TimelineConfig {
  laneHeight: number;      // Pixels per agent lane
  pixelsPerTick: number;   // Horizontal scale
  minZoom: number;         // 0.1x
  maxZoom: number;         // 10x
  
  // Colors
  roleColors: {
    duelist: string;
    initiator: string;
    controller: string;
    sentinel: string;
  };
  
  // Marker sizes
  abilityMarkerWidth: number;
  ultimateMarkerSize: number;
}

class AbilityTimeline {
  private lanes: Map<string, AgentLane>;
  private viewport: Viewport;
  private events: AbilityEvent[];
  
  constructor(config: TimelineConfig) {
    this.lanes = new Map();
    this.viewport = { startTick: 0, endTick: 1000 };
  }
  
  render() {
    this.clear();
    
    // Render lane backgrounds
    this.lanes.forEach((lane, index) => {
      this.renderLaneBackground(lane, index);
    });
    
    // Render ability markers
    const visibleEvents = this.getVisibleEvents();
    visibleEvents.forEach(event => {
      this.renderAbilityMarker(event);
    });
    
    // Render combo connections
    this.renderComboLines(visibleEvents);
    
    // Render site control overlay
    this.renderSiteControlOverlay();
    
    // Render current time indicator
    this.renderPlayhead();
  }
  
  private renderAbilityMarker(event: AbilityEvent) {
    const lane = this.lanes.get(event.playerId);
    if (!lane || !lane.visible) return;
    
    const x = this.tickToX(event.tick);
    const y = this.getLaneY(lane.index);
    
    // Base marker
    const color = this.getAgentColor(event.agentName);
    const width = this.config.abilityMarkerWidth;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - width/2, y - 9, width, 18);
    
    // Ultimate indicator
    if (event.abilityType === "ultimate") {
      this.ctx.beginPath();
      this.ctx.arc(x, y - 15, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = "#FFB86B";
      this.ctx.fill();
    }
    
    // Effectiveness indicator
    if (event.effectiveness.enemiesHit && event.effectiveness.enemiesHit > 0) {
      // Small glow for effective abilities
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(x - width/2, y - 9, width, 18);
      this.ctx.shadowBlur = 0;
    }
  }
  
  private renderSiteControlOverlay() {
    // Draw translucent bars showing site control over time
    const siteSnapshots = this.getSiteSnapshots();
    
    siteSnapshots.forEach((snapshot, index) => {
      const x = this.tickToX(snapshot.tick);
      const nextX = siteSnapshots[index + 1] 
        ? this.tickToX(siteSnapshots[index + 1].tick)
        : x + 10;
      
      const width = nextX - x;
      const height = this.canvas.height;
      
      // Color based on control
      const color = this.getControlColor(snapshot.controlRatio);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.1;
      this.ctx.fillRect(x, 0, width, height);
      this.ctx.globalAlpha = 1;
    });
  }
}
```

### 3.2 Site Control Visualization

```typescript
interface SiteControlWidgetConfig {
  size: { width: number; height: number };
  radarRadius: number;
  colors: {
    attacker: string;
    defender: string;
    contested: string;
    neutral: string;
  };
}

class SiteControlWidget {
  render(snapshot: SiteControlSnapshot) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw site radar
    this.drawRadar();
    
    // Draw control bar
    this.drawControlBar(snapshot.controlRatio);
    
    // Draw occupancy counts
    this.drawOccupancy(snapshot);
    
    // Draw utility coverage
    this.drawUtilityOverlay(snapshot);
    
    // Draw recent events
    this.drawEventFeed(snapshot.eventsLast5Seconds);
  }
  
  private drawControlBar(ratio: number) {
    const barWidth = this.width - 40;
    const barHeight = 8;
    const x = 20;
    const y = this.height - 40;
    
    // Background
    this.ctx.fillStyle = this.config.colors.defender;
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Attacker portion
    this.ctx.fillStyle = this.config.colors.attacker;
    this.ctx.fillRect(x, y, barWidth * ratio, barHeight);
    
    // Center marker
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(x + barWidth / 2 - 1, y - 2, 2, barHeight + 4);
  }
  
  private drawUtilityOverlay(snapshot: SiteControlSnapshot) {
    // Smoke coverage
    if (snapshot.smokeCoverage > 0) {
      this.ctx.fillStyle = "#6B6F76";
      this.ctx.globalAlpha = snapshot.smokeCoverage * 0.5;
      this.drawRadarCircle();
      this.ctx.globalAlpha = 1;
    }
    
    // Recon pulse
    if (snapshot.reconCoverage > 0) {
      this.ctx.strokeStyle = "#00D1FF";
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = snapshot.reconCoverage;
      this.drawRadarPulse();
      this.ctx.globalAlpha = 1;
    }
  }
}
```

---

## 4. Coach Annotation System

### 4.1 Annotation Schema

```typescript
interface CoachAnnotation {
  id: string;
  matchId: string;
  roundNumber: number;
  author: {
    coachId: string;
    name: string;
    teamId: string;
  };
  
  // Timing
  startTick: number;
  endTick?: number;
  
  // Content
  type: "drawing" | "text" | "voice" | "bookmark";
  content: {
    // Drawing
    strokes?: {
      points: { x: number; y: number; pressure: number }[];
      color: string;
      width: number;
    }[];
    
    // Text
    text?: string;
    
    // Voice
    audioUrl?: string;
    transcription?: string;
    durationMs?: number;
  };
  
  // Visibility
  visibility: "private" | "team" | "public";
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
```

### 4.2 Drawing Overlay

```typescript
class DrawingOverlay {
  private strokes: Stroke[] = [];
  private isDrawing = false;
  private currentStroke: Stroke | null = null;
  
  startStroke(point: Point) {
    this.currentStroke = {
      points: [point],
      color: this.selectedColor,
      width: this.selectedWidth
    };
    this.isDrawing = true;
  }
  
  addPoint(point: Point) {
    if (!this.isDrawing || !this.currentStroke) return;
    this.currentStroke.points.push(point);
    this.render();
  }
  
  endStroke() {
    if (this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.saveAnnotation();
    }
    this.isDrawing = false;
    this.currentStroke = null;
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw saved strokes
    this.strokes.forEach(stroke => this.drawStroke(stroke));
    
    // Draw current stroke
    if (this.currentStroke) {
      this.drawStroke(this.currentStroke);
    }
  }
  
  private drawStroke(stroke: Stroke) {
    if (stroke.points.length < 2) return;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    // Smooth curves between points
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }
    
    this.ctx.stroke();
  }
}
```

---

## 5. Pattern Recognition Engine

### 5.1 Pattern Detection

```typescript
interface TacticalPattern {
  id: string;
  name: string;
  description: string;
  
  // Detection criteria
  criteria: {
    agent?: string;
    ability?: string;
    timing?: { min: number; max: number };  // Round time in ms
    location?: BoundingBox;
    sequence?: string[];  // Pattern of events
  };
  
  // Examples found
  occurrences: {
    matchId: string;
    roundNumber: number;
    timestamp: number;
    videoClip?: string;
  }[];
  
  // Statistics
  frequency: number;  // Times per match avg
  successRate: number;
  counterStrategies: string[];
}

class PatternRecognitionEngine {
  private patterns: TacticalPattern[] = [];
  
  analyzeMatch(events: AbilityEvent[]) {
    const detectedPatterns: DetectedPattern[] = [];
    
    // Pattern 1: "Default A execute"
    const defaultAExecute = this.detectSequence(events, [
      { agent: 'Omen', ability: 'smoke', location: 'A main' },
      { agent: 'Sova', ability: 'recon', location: 'A site', delay: [0, 2000] },
      { agent: 'Raze', ability: 'blast', location: 'A main', delay: [500, 3000] }
    ]);
    
    if (defaultAExecute) {
      detectedPatterns.push({
        patternId: 'default-a-execute',
        confidence: defaultAExecute.confidence,
        events: defaultAExecute.events
      });
    }
    
    // Pattern 2: "Retake smoke timing"
    const retakeTiming = this.detectAbilityTiming(events, {
      ability: 'smoke',
      phase: 'post-plant',
      timing: 'immediate'  // Within 2s of plant
    });
    
    return detectedPatterns;
  }
  
  private detectSequence(
    events: AbilityEvent[],
    sequence: SequenceCriterion[]
  ): DetectionResult | null {
    // Find events matching sequence criteria
    // Return confidence score and matched events
  }
}
```

---

## 6. UI Component Library

### 6.1 Agent Card Component

```html
<div class="agent-card" data-agent="Jett" data-role="duelist">
  <div class="agent-card__header">
    <img src="/agents/jett-icon.png" alt="Jett" class="agent-card__icon">
    <div class="agent-card__info">
      <h4 class="agent-card__name">Jett</h4>
      <span class="agent-card__player">TenZ</span>
    </div>
    <span class="agent-card__acs">ACS: 287</span>
  </div>
  
  <div class="agent-card__abilities">
    <div class="ability-marker" data-ability="tailwind" data-used="3">
      <span class="ability-marker__key">E</span>
      <span class="ability-marker__count">3</span>
    </div>
    <div class="ability-marker" data-ability="updraft" data-used="1">
      <span class="ability-marker__key">Q</span>
      <span class="ability-marker__count">1</span>
    </div>
    <div class="ability-marker ability-marker--ultimate" data-ability="blade-storm">
      <span class="ability-marker__key">X</span>
      <span class="ability-marker__kills">4</span>
    </div>
  </div>
  
  <div class="agent-card__stats">
    <div class="stat">
      <span class="stat__value">24/12/4</span>
      <span class="stat__label">K/D/A</span>
    </div>
    <div class="stat">
      <span class="stat__value">2.0</span>
      <span class="stat__label">KDR</span>
    </div>
    <div class="stat">
      <span class="stat__value">142</span>
      <span class="stat__label">ADR</span>
    </div>
  </div>
</div>
```

### 6.2 Composition Radar

```typescript
// Radar chart showing team composition DNA
function renderCompositionRadar(composition: TeamComposition) {
  const axes = ['aggression', 'control', 'info', 'defense'];
  const values = [
    composition.dna.aggression,
    composition.dna.control,
    composition.dna.info,
    composition.dna.defense
  ];
  
  // Draw radar chart using canvas or SVG
  // Show comparison to meta average
}
```

---

## 7. Integration & APIs

### 7.1 Data Endpoints

```typescript
// GET /api/v1/matches/{id}/abilities
interface MatchAbilitiesResponse {
  matchId: string;
  rounds: {
    roundNumber: number;
    events: AbilityEvent[];
    siteControl: SiteControlSnapshot[];
    composition: TeamComposition;
  }[];
}

// GET /api/v1/agents/{agent}/stats
interface AgentStatsResponse {
  agent: string;
  timeframe: string;
  pickRate: number;
  winRate: number;
  avgAcs: number;
  abilityUsage: {
    ability: string;
    avgCastsPerRound: number;
    effectiveness: number;
  }[];
}

// GET /api/v1/teams/{id}/patterns
interface TeamPatternsResponse {
  teamId: string;
  patterns: TacticalPattern[];
  mapPreferences: {
    map: string;
    winRate: number;
    preferredComps: string[];
  }[];
}
```

---

## 8. Performance Specifications

| Metric | Target | Notes |
|--------|--------|-------|
| Timeline render | 60fps | 10 agents × 50 abilities |
| Zoom smoothness | 16ms | 0.1x to 10x zoom |
| Site control update | 50ms | Per tick change |
| Pattern detection | <1s | Per round analysis |
| Annotation render | 16ms | 100+ strokes |

---

## 9. File Structure

```
platform/tenet-valorant/
├── src/
│   ├── components/
│   │   ├── AbilityTimeline.tsx
│   │   ├── SiteControlWidget.tsx
│   │   ├── AgentCard.tsx
│   │   ├── CompositionRadar.tsx
│   │   └── CoachOverlay.tsx
│   ├── timeline/
│   │   ├── TimelineEngine.ts
│   │   ├── LaneManager.ts
│   │   └── MarkerRenderer.ts
│   ├── patterns/
│   │   ├── PatternEngine.ts
│   │   └── PatternDatabase.ts
│   ├── annotations/
│   │   ├── DrawingOverlay.ts
│   │   └── AnnotationStore.ts
│   └── analysis/
│       ├── CompositionAnalyzer.ts
│       └── SiteControlCalculator.ts
├── data/
│   ├── agents/
│   └── patterns/
└── tests/
```

---

## 10. Acceptance Criteria

- [ ] Render 10 agent lanes with 50+ abilities each at 60fps
- [ ] Site control widget updates in real-time with timeline scrub
- [ ] Coach can draw annotations that sync to timeline
- [ ] Pattern engine detects 5+ common tactical patterns
- [ ] Composition DNA accurately classifies team style
- [ ] Mobile: Touch-friendly timeline with pinch-to-zoom
- [ ] Export annotated clips as shareable links

---

*Enhanced specification for professional Valorant analysis tool*  
*Builds upon: TECH_DESIGN_TENET_VALORANT.md v1.0*
