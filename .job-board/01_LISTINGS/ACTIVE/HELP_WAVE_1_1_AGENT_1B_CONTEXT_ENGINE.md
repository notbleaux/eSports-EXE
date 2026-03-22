[Ver001.000]

# WAVE 1.1 — AGENT 1-B TASK: Context Detection Engine
**Priority:** P0  
**Estimated:** 8 hours  
**Due:** +24 hours from claim  
**Stream:** Unified Help System  
**Dependency:** Agent 1-A schema (structure, not content)

---

## ASSIGNMENT

Build the engine that determines WHEN to show help and at WHAT level based on user behavior.

### Core Challenge

Don't annoy experts. Don't overwhelm beginners. Detect expertise automatically.

---

## DELIVERABLES

### 1. UserExpertiseProfile Model

```typescript
// apps/website-v2/src/help/expertiseProfile.ts

export interface FeatureExpertise {
  featureId: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;        // 0.0 - 1.0 based on data volume
  lastInteraction: Date;
  
  // Metrics
  totalInteractions: number;
  successfulCompletions: number;
  errorCount: number;
  helpRequestsCount: number;
  averageTimeToComplete: number;  // ms
  
  // Trends (for auto-promotion)
  helpRequestsTrend: 'increasing' | 'stable' | 'decreasing';
  errorRateTrend: 'improving' | 'stable' | 'worsening';
  speedTrend: 'faster' | 'stable' | 'slower';
}

export interface UserExpertiseProfile {
  userId: string;
  updatedAt: Date;
  
  // Per-feature expertise
  features: Map<string, FeatureExpertise>;
  
  // Overall classification
  overallLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Global metrics
  totalSessions: number;
  totalHelpRequests: number;
  featuresExplored: string[];
  
  // Methods
  getHelpLevel(featureId: string): 'beginner' | 'intermediate' | 'advanced';
  shouldAutoTrigger(featureId: string): boolean;
  calculatePromotion(): FeatureExpertise[];  // Features ready for promotion
}
```

### 2. Context Detection System

```typescript
// Detects user context for contextual help

export interface HelpContext {
  currentPage: string;
  currentFeature: string | null;
  timeOnPage: number;
  timeOnFeature: number;
  recentActions: UserAction[];
  errors: ErrorEvent[];
  formState?: FormState;
}

export interface ContextDetector {
  // Current snapshot
  getCurrentContext(): HelpContext;
  
  // Subscribe to changes
  onContextChange(callback: (context: HelpContext) => void): () => void;
  
  // Detect stuck users
  isUserStuck(threshold: number): boolean;  // threshold in ms
  
  // Detect errors
  hasRepeatedErrors(count: number, window: number): boolean;
}

// React hook
export function useHelpContext(): HelpContext {
  // Implementation with useSyncExternalStore
}
```

### 3. Trigger Evaluation Engine

```typescript
// Evaluates HelpTrigger conditions

export class TriggerEvaluator {
  constructor(
    private context: ContextDetector,
    private profile: UserExpertiseProfile,
    private history: HelpHistory
  ) {}
  
  evaluate(trigger: HelpTrigger): TriggerResult {
    switch (trigger.type) {
      case 'first_visit':
        return this.evaluateFirstVisit(trigger);
      case 'error_count':
        return this.evaluateErrorCount(trigger);
      case 'time_spent':
        return this.evaluateTimeSpent(trigger);
      case 'action_stuck':
        return this.evaluateStuck(trigger);
      case 'manual':
        return { triggered: true, priority: trigger.priority };
    }
  }
  
  private evaluateFirstVisit(trigger: HelpTrigger): TriggerResult {
    const featureExpertise = this.profile.features.get(this.context.currentFeature);
    const isFirstVisit = !featureExpertise || featureExpertise.totalInteractions === 0;
    
    return {
      triggered: isFirstVisit,
      priority: trigger.priority,
      reason: isFirstVisit ? 'first_feature_visit' : null
    };
  }
  
  // ... other evaluations
}

interface TriggerResult {
  triggered: boolean;
  priority: number;
  reason: string | null;
  suggestedLevel?: 'beginner' | 'intermediate' | 'advanced';
}
```

### 4. Auto-Promotion Logic

```typescript
// Detects when user is ready for higher expertise level

export class ExpertisePromoter {
  private criteria = {
    minInteractions: 5,
    minSuccessRate: 0.8,      // 80% success
    maxHelpRequests: 2,       // Declining help usage
    maxErrorRate: 0.1,        // <10% errors
    minSpeedImprovement: 0.2  // 20% faster than first attempt
  };
  
  shouldPromote(feature: FeatureExpertise): boolean {
    if (feature.totalInteractions < this.criteria.minInteractions) {
      return false;  // Not enough data
    }
    
    const successRate = feature.successfulCompletions / feature.totalInteractions;
    const errorRate = feature.errorCount / feature.totalInteractions;
    
    return (
      successRate >= this.criteria.minSuccessRate &&
      feature.helpRequestsCount <= this.criteria.maxHelpRequests &&
      errorRate <= this.criteria.maxErrorRate &&
      feature.helpRequestsTrend === 'decreasing'
    );
  }
  
  promote(featureId: string): void {
    // Emit event for UI celebration
    // Update profile
    // Log for analytics
  }
}
```

### 5. React Integration

```typescript
// Provider and hooks

export const HelpContextProvider: React.FC = ({ children }) => {
  const [profile, setProfile] = useState<UserExpertiseProfile>();
  const detector = useContextDetector();
  
  // Auto-evaluate triggers
  useEffect(() => {
    const unsubscribe = detector.onContextChange((context) => {
      evaluateTriggers(context, profile);
    });
    return unsubscribe;
  }, [detector, profile]);
  
  return (
    <HelpContext.Provider value={{ profile, detector }}>
      {children}
    </HelpContext.Provider>
  );
};

// Hook for components
export function useExpertise(featureId: string): FeatureExpertise | null {
  const { profile } = useContext(HelpContext);
  return profile?.features.get(featureId) || null;
}
```

### 6. Unit Tests (expertiseProfile.test.ts)

Cover:
- Profile calculation
- Trigger evaluation
- Auto-promotion logic
- Trend calculation

---

## FOREMAN REVIEW CHECKLIST

- [ ] Expertise model captures meaningful signals
- [ ] Context detection covers all trigger types
- [ ] Auto-promotion criteria are reasonable (not too easy/hard)
- [ ] React hooks follow project conventions
- [ ] Unit tests cover edge cases
- [ ] No PII in expertise tracking

---

## INTEGRATION NOTES

**Receives from:**
- Agent 1-A: Content schema (for help levels)

**Provides to:**
- Agent 1-C: Knowledge Graph (expertise for recommendations)
- Agent 2-A: HelpOverlay (when to show, what level)
- Agent 2-B: Search (personalize results by expertise)

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
