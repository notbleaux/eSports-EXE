[Ver1.0.0]

# TESTING PROCEDURES
## Root Axiom — Quality Assurance Process

**Axiom ID:** PROC-002  
**Stability:** Stable  
**Authority:** Domain  
**Version:** 1.0.0  
**Dependencies:** [CODE-001, AI-001]  

---

## I. TESTING PYRAMID

```
                    ┌─────────┐
                    │   E2E   │  ← 10% (Playwright)
                    │  Tests  │     Critical paths
                    ├─────────┤
                    │Integration│ ← 20%
                    │  Tests  │     Component + API
                    ├─────────┤
                    │  Unit   │  ← 70%
                    │  Tests  │     Functions, hooks
                    └─────────┘
```

---

## II. UNIT TESTING

### 2.1 Requirements

- **Coverage Target:** Minimum 80% overall
- **Critical Paths:** 100% coverage
- **Tool:** Vitest

### 2.2 Test File Organization

```
Component.tsx
Component.test.tsx        # Co-located test
Component.stories.tsx     # Storybook (if applicable)
```

### 2.3 Test Naming

```typescript
// Pattern: should <expected behavior> when <condition>
describe('PlayerCard', () => {
  it('should render player name when data provided', () => {});
  it('should show loading state when isLoading true', () => {});
  it('should call onClose when close button clicked', () => {});
});
```

---

## III. QUALITY GATES

### 3.1 Pre-Commit

```bash
npm run test:unit        # Fast unit tests only
```

### 3.2 Pre-Push

```bash
npm run test:unit        # All unit tests
npm run test:integration # Integration tests
npm run coverage         # Coverage report
```

### 3.3 Pre-Merge (CI)

```bash
npm run test             # Full test suite
npm run test:e2e         # E2E tests
npm run coverage:check   # Verify thresholds
```

---

## IV. COVERAGE THRESHOLDS

| Metric | Threshold | Enforcement |
|--------|-----------|-------------|
| Branches | 75% | Blocking |
| Functions | 80% | Blocking |
| Lines | 80% | Blocking |
| Statements | 80% | Blocking |

---

## CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-13 | Arch Team | Initial definition |

---

**Axiom ID:** PROC-002  
**Stability:** Stable  
**Authority:** Domain  
**Version:** 1.0.0  

*End of Testing Procedures*
