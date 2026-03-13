[Ver1.0.0]

# CODE PRINCIPLES
## Root Axiom — Software Development Standards

**Axiom ID:** CODE-001  
**Stability:** Immutable  
**Authority:** Universal  
**Version:** 1.0.0  
**Dependencies:** [ARCH-001]  

---

## I. READABILITY PRINCIPLES

### 1.1 Self-Documenting Code

**Statement:** Code SHALL be written for human comprehension first, with clear intent and minimal need for explanatory comments.

**Rationale:**
- Code is read 10x more than written
- Comments become outdated
- Clear code reduces cognitive load

**Implementation:**
- ✅ Descriptive variable/function names
- ✅ Early returns reduce nesting
- ✅ Pure functions where possible
- ❌ Comments explaining "what" (should be obvious)
- ✅ Comments explaining "why" (business logic)

**Example:**
```typescript
// ✅ CORRECT - Self-documenting
function calculateWinProbability(teamStats: TeamStats): number {
  if (!teamStats.hasSufficientData) {
    return BASELINE_PROBABILITY;
  }
  
  return bayesianInference(teamStats.historicalMatches);
}

// ❌ INCORRECT - Requires comments
function calc(p: any): number {
  // Check if we have data
  if (p.d.length < 10) {
    return 0.5; // Default
  }
  
  // Calculate using Bayes
  return b(p.d);
}
```

---

### 1.2 Single Responsibility

**Statement:** Every function, class, and module SHALL have one reason to change.

**Implementation:**
- ✅ Functions under 50 lines
- ✅ Single level of abstraction per function
- ✅ Clear input/output contracts
- ❌ Side effects in pure functions

---

## II. MAINTAINABILITY PRINCIPLES

### 2.1 Explicit Dependencies

**Statement:** All dependencies SHALL be declared explicitly, not acquired implicitly.

**Implementation:**
- ✅ Constructor injection
- ✅ Explicit imports at top of file
- ✅ Dependency declarations in manifests
- ❌ Global state access
- ❌ Service locators

---

### 2.2 Fail Fast

**Statement:** Errors SHALL be detected and reported at the earliest possible opportunity.

**Implementation:**
- ✅ Input validation at function entry
- ✅ Type guards and assertions
- ✅ Early returns for invalid states
- ✅ Clear error messages with context

---

## III. TESTABILITY PRINCIPLES

### 3.1 Test-Driven Design

**Statement:** Code SHALL be structured to facilitate automated testing without complex setup.

**Implementation:**
- ✅ Dependency injection
- ✅ Pure functions for business logic
- ✅ Interface-based abstractions
- ✅ No hardcoded external services
- ❌ Singletons (unless truly single)

---

## IV. CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-13 | Arch Team | Initial definition |

---

**Axiom ID:** CODE-001  
**Stability:** Immutable  
**Authority:** Universal  
**Version:** 1.0.0  

*End of Code Principles*
