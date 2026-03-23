[Ver001.000]

# TL-A1 AGENT BRIEFING
## Wave 1.1: Help & Accessibility Foundation

**From:** TL-A1 (Agent 1-A) — Team Leader  
**To:** Agent 1-B, Agent 1-C  
**Date:** March 23, 2026  
**Wave Duration:** 24 hours (3 days @ 8h/day)

---

## MISSION OVERVIEW

We are building the **Unified Help System Foundation** for the 4NJZ4 TENET Platform. This system will deliver contextual help across web and game platforms with progressive disclosure based on user expertise.

### Three-Pillar Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  UNIFIED HELP SYSTEM                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Agent 1-A     │    Agent 1-B    │      Agent 1-C          │
│   (TL - You)    │  (Context Eng)  │   (Knowledge Graph)     │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Content Schema  │ User Expertise  │ Topic Relationships     │
│ Localization    │ Level Detection │ Search Index            │
│ Type Safety     │ Progress Track  │ Recommendations         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## AGENT 1-B: CONTEXT DETECTION ENGINE

### Your Mission

Build the engine that detects user expertise levels and triggers contextual help at the right moment.

### Core Deliverables

#### 1. Expertise Profile System

**File:** `packages/shared/types/help/expertise.ts`

```typescript
export interface UserExpertiseProfile {
  userId: string;
  overall: ExpertiseLevel;
  lastUpdated: Date;
  
  perFeature: Record<FeatureId, {
    level: ExpertiseLevel;
    confidence: number;        // 0-1 based on data volume
    lastInteraction: Date;
    helpRequests: number;      // Declining = learning
    errors: number;            // Spikes indicate confusion
    successfulActions: number;
    timeSpentSeconds: number;
  }>;
  
  promotionCriteria: {
    sessionsCompleted: number;
    featuresUsed: Set<FeatureId>;
    helpRequestTrend: 'declining' | 'stable' | 'increasing';
    errorRate: number;
  };
}

export type ExpertiseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ExpertisePromotionRule {
  fromLevel: ExpertiseLevel;
  toLevel: ExpertiseLevel;
  minSessions: number;
  minFeaturesUsed: number;
  maxHelpRequestsPerSession: number;
  maxErrorRate: number;
}
```

#### 2. Context Detection Engine

**File:** `apps/website-v2/src/services/help/contextDetector.ts`

```typescript
export interface ContextDetectorConfig {
  // Time thresholds (ms)
  stuckThreshold: number;      // 30000 (30s)
  errorSpikeThreshold: number; // 3 errors in 60s
  rapidClickThreshold: number; // 5 clicks in 3s
  
  // Confidence weights
  actionWeight: number;        // 0.3
  errorWeight: number;         // 0.4
  timeWeight: number;          // 0.2
  helpRequestWeight: number;   // 0.1
}

export class ContextDetector {
  detectContext(userId: string, currentPage: string): HelpContext;
  detectStuckBehavior(recentActions: UserAction[]): boolean;
  detectErrorSpike(recentErrors: ErrorEvent[]): boolean;
  calculateExpertiseConfidence(featureId: string): number;
  recommendHelpLevel(contentId: string): HelpLevel;
}
```

#### 3. Help Trigger System

**File:** `apps/website-v2/src/services/help/triggerEngine.ts`

```typescript
export interface HelpTrigger {
  id: string;
  type: TriggerType;
  conditions: TriggerCondition[];
  cooldownMs: number;
  priority: 1 | 2 | 3 | 4 | 5;
  contentId: string;
  suggestedLevel: HelpLevel;
}

export type TriggerType = 
  | 'first_visit'
  | 'error_count'
  | 'time_spent'
  | 'action_stuck'
  | 'rapid_clicks'
  | 'scroll_confusion'
  | 'manual_request';

export class TriggerEngine {
  registerTrigger(trigger: HelpTrigger): void;
  evaluateTriggers(context: HelpContext): HelpTrigger[];
  recordTriggerFire(triggerId: string): void;
  isOnCooldown(triggerId: string): boolean;
}
```

#### 4. React Hook

**File:** `apps/website-v2/src/hooks/useExpertise.ts`

```typescript
export function useExpertise(featureId?: string): {
  profile: UserExpertiseProfile | null;
  currentLevel: ExpertiseLevel;
  confidence: number;
  isLoading: boolean;
  recordInteraction: (type: InteractionType) => void;
  recordError: (error: Error) => void;
  recordHelpRequest: (contentId: string) => void;
};
```

### Acceptance Criteria

- [ ] Expertise levels update in real-time based on user behavior
- [ ] Confidence scores accurately reflect data quality
- [ ] Stuck detection triggers within 5 seconds of threshold breach
- [ ] Cooldown system prevents help spam
- [ ] All events are trackable for analytics
- [ ] Unit tests >80% coverage

### Dependencies

| Dependency | Source | Status |
|------------|--------|--------|
| HelpContent types | Agent 1-A | In Progress |
| Knowledge Graph API | Agent 1-C | Will integrate |
| User auth context | Shared | ✅ Available |

---

## AGENT 1-C: KNOWLEDGE GRAPH & SEARCH

### Your Mission

Build the knowledge graph that powers search, recommendations, and content relationships.

### Core Deliverables

#### 1. Knowledge Graph Schema

**File:** `packages/shared/types/help/knowledgeGraph.ts`

```typescript
export interface KnowledgeNode {
  id: string;
  type: 'topic' | 'feature' | 'concept' | 'tutorial' | 'faq';
  title: string;
  contentIds: string[];        // Links to HelpContent
  keywords: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedReadTime: number;   // minutes
}

export interface KnowledgeEdge {
  source: string;              // node id
  target: string;              // node id
  type: 'prerequisite' | 'related' | 'next' | 'parent' | 'seealso';
  weight: number;              // 0-1 relevance
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  version: string;
  lastUpdated: Date;
}

export interface SearchIndex {
  index: Map<string, SearchEntry>;  // term -> entry
  synonyms: Map<string, string[]>;
  stemming: boolean;
}
```

#### 2. Graph API Service

**File:** `apps/website-v2/src/services/help/knowledgeGraph.ts`

```typescript
export class KnowledgeGraphService {
  // Graph traversal
  getPrerequisites(nodeId: string): KnowledgeNode[];
  getRelated(nodeId: string, limit?: number): KnowledgeNode[];
  getLearningPath(from: string, to: string): KnowledgeNode[];
  getTopicsByDifficulty(level: ExpertiseLevel): KnowledgeNode[];
  
  // Content recommendations
  recommendNext(userId: string, currentContentId: string): Recommendation;
  recommendForLevel(level: ExpertiseLevel, limit?: number): Recommendation[];
  findGaps(userId: string): KnowledgeNode[];  // Missing prerequisites
}

export interface Recommendation {
  node: KnowledgeNode;
  score: number;               // 0-1 relevance
  reason: 'prerequisite' | 'next_in_series' | 'related' | 'popular' | 'trending';
}
```

#### 3. Search Engine

**File:** `apps/website-v2/src/services/help/searchEngine.ts`

```typescript
export interface SearchQuery {
  query: string;
  filters?: {
    type?: NodeType[];
    difficulty?: number[];
    feature?: string[];
  };
  userLevel?: ExpertiseLevel;
  limit?: number;
}

export interface SearchResult {
  node: KnowledgeNode;
  score: number;
  highlights: string[];        // Matched keywords
  snippet: string;
}

export class HelpSearchEngine {
  search(query: SearchQuery): SearchResult[];
  autocomplete(partial: string, limit?: number): string[];
  didYouMean(query: string): string | null;
  
  // Index management
  addNode(node: KnowledgeNode): void;
  updateIndex(): void;
  getSuggestions(context: string): string[];
}
```

#### 4. React Hooks

**File:** `apps/website-v2/src/hooks/useKnowledgeGraph.ts`

```typescript
export function useKnowledgeGraph(): {
  graph: KnowledgeGraph | null;
  isLoading: boolean;
  getRelated: (nodeId: string) => KnowledgeNode[];
  getPath: (from: string, to: string) => KnowledgeNode[];
};

export function useHelpSearch(): {
  results: SearchResult[];
  isSearching: boolean;
  search: (query: string) => void;
  suggestions: string[];
};

export function useRecommendations(contentId?: string): {
  recommendations: Recommendation[];
  isLoading: boolean;
  nextBest: Recommendation | null;
};
```

### Acceptance Criteria

- [ ] Search returns results in <100ms
- [ ] Related content relevance >80% (measured by click-through)
- [ ] Learning paths are complete (no missing prerequisites)
- [ ] Autocomplete has >5 suggestions for common queries
- [ ] Graph can be exported/imported for versioning
- [ ] Unit tests >80% coverage

### Dependencies

| Dependency | Source | Status |
|------------|--------|--------|
| HelpContent types | Agent 1-A | In Progress |
| User expertise data | Agent 1-B | Will integrate |
| Analytics events | Shared | ✅ Available |

---

## SHARED ARCHITECTURE

### File Structure

```
packages/shared/types/help/
├── index.ts              # Public exports
├── content.ts            # HelpContent interfaces
├── expertise.ts          # Agent 1-B
├── triggers.ts           # Agent 1-B
├── knowledgeGraph.ts     # Agent 1-C
└── search.ts             # Agent 1-C

apps/website-v2/src/
├── services/help/
│   ├── contextDetector.ts    # Agent 1-B
│   ├── triggerEngine.ts      # Agent 1-B
│   ├── knowledgeGraph.ts     # Agent 1-C
│   └── searchEngine.ts       # Agent 1-C
├── hooks/
│   ├── useExpertise.ts       # Agent 1-B
│   ├── useKnowledgeGraph.ts  # Agent 1-C
│   └── useHelpSearch.ts      # Agent 1-C
└── components/help/
    ├── HelpProvider.tsx      # Shared context
    └── index.ts
```

### Integration Points

```
┌────────────────────────────────────────────────────────────┐
│                      HelpProvider                          │
│  (React Context - wraps your individual services)          │
├────────────────────────────────────────────────────────────┤
│  ContextDetector ◄────► ExpertiseStore ◄────► 1-B output   │
│  TriggerEngine   ◄────► HelpOverlay    ◄────► UI trigger   │
│  KnowledgeGraph  ◄────► SearchEngine   ◄────► 1-C output   │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → ContextDetector → Expertise Update
                                    ↓
Trigger Evaluation → TriggerEngine → Help Display?
                                    ↓
User Response → KnowledgeGraph → Next Recommendation
```

---

## DAILY STANDUP PROTOCOL

**Time:** 15 minutes at start of each work session

### Format

1. **Yesterday:** What did you complete?
2. **Today:** What will you work on?
3. **Blockers:** What's in your way?

### Communication Channels

| Type | Location | Response Time |
|------|----------|---------------|
| Daily updates | TEAM_REPORTS/ | End of day |
| Code review | PRE_REVIEWS/ | Within 4 hours |
| Blockers | ESCALATIONS/ | Immediate |
| Quick questions | AGENT_1B/ or AGENT_1C/ | Within 2 hours |

---

## QUALITY GATES

Before submitting to TL for review, ensure:

1. **Type Safety:** All TypeScript compiles with strict mode
2. **Accessibility:** ARIA labels, keyboard navigation
3. **Testing:** Unit tests >80% coverage
4. **Documentation:** JSDoc for all public APIs
5. **Performance:** No unnecessary re-renders, memoized callbacks

---

## QUESTIONS?

- Check `docs/HELP_ACCESSIBILITY_INTEGRATION_MASTER_PLAN.md`
- Post in your AGENT_1B/ or AGENT_1C/ directory
- Escalate to TL-A1 if cross-agent coordination needed

---

**Let's build a help system that actually helps!** 🚀

*TL-A1 / Agent 1-A*
