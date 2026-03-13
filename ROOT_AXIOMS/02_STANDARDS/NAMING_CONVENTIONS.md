[Ver1.0.0]

# NAMING CONVENTIONS
## Root Axiom — Identifier Standards

**Axiom ID:** STD-001  
**Stability:** Stable  
**Authority:** Universal  
**Version:** 1.0.0  
**Dependencies:** [CODE-001]  

---

## I. GENERAL CONVENTIONS

### 1.1 Clarity Over Brevity

**Rule:** Names SHALL be descriptive; abbreviations discouraged unless universally understood.

**Examples:**
```typescript
// ✅ CORRECT
const playerWinProbability = 0.75;
const isTournamentActive = true;

// ❌ INCORRECT
const pwp = 0.75;  // Unclear
const active = true;  // Ambiguous scope
```

### 1.2 Consistent Casing

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase | `playerScore` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| **Functions** | camelCase | `calculateAverage` |
| **Classes/Types** | PascalCase | `PlayerStats` |
| **Interfaces** | PascalCase (I-prefix optional) | `IPlayerStats` |
| **Enums** | PascalCase | `MatchStatus` |
| **Enum Members** | UPPER_SNAKE_CASE | `IN_PROGRESS` |
| **Files** | kebab-case | `player-stats.ts` |
| **Directories** | kebab-case | `player-components/` |
| **Database Tables** | snake_case | `player_performance` |
| **API Endpoints** | kebab-case | `/api/player-stats` |

---

## II. TYPE-SPECIFIC CONVENTIONS

### 2.1 Boolean Variables

**Rule:** Boolean names SHALL be predicate phrases (is/has/should/can).

```typescript
// ✅ CORRECT
const isLoading = true;
const hasPermission = false;
const shouldRetry = true;

// ❌ INCORRECT
const loading = true;  // Ambiguous (function?)
const permission = false;  // Could be object
```

### 2.2 Function Names

**Rule:** Functions SHALL be verb phrases describing action.

```typescript
// ✅ CORRECT
function calculateWinProbability(stats: Stats): number;
function validatePlayerInput(input: Input): ValidationResult;
function fetchPlayerData(id: string): Promise<Player>;

// ❌ INCORRECT
function winProb(stats): number;  // Abbreviated
function playerData(id);  // Noun phrase
```

---

## CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-13 | Arch Team | Initial definition |

---

**Axiom ID:** STD-001  
**Stability:** Stable  
**Authority:** Universal  
**Version:** 1.0.0  

*End of Naming Conventions*
