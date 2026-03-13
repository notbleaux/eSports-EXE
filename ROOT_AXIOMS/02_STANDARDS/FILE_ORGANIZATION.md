[Ver1.0.0]

# FILE ORGANIZATION
## Root Axiom — Directory Structure Standards

**Axiom ID:** STD-002  
**Stability:** Stable  
**Authority:** Universal  
**Version:** 1.0.0  
**Dependencies:** [ARCH-001, STD-001]  

---

## I. PROJECT STRUCTURE

### 1.1 Frontend (apps/website-v2)

```
src/
├── 00_app/                 # Application shell
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── 10_shared/              # Shared resources
│   ├── ui/                 # UI primitives
│   ├── utils/              # Pure functions
│   ├── hooks/              # Shared hooks
│   ├── types/              # Global types
│   └── constants/
│
├── 20_layouts/             # Page layouts
│   ├── hub-layout/
│   └── dashboard-layout/
│
├── 30_features/            # Feature modules
│   ├── grid-system/
│   ├── analytics/
│   └── simulation/
│
├── 40_pages/               # Route components
│   ├── landing/
│   ├── dashboard/
│   └── sator-hub/
│
└── 50_infrastructure/      # Non-feature code
    ├── error-handling/
    ├── monitoring/
    └── service-worker/
```

### 1.2 Co-location Principle

**Rule:** Files SHALL be organized by feature, not by type.

```
// ✅ CORRECT - Co-located by feature
features/player-stats/
├── components/
│   ├── PlayerCard.tsx
│   └── PlayerList.tsx
├── hooks/
│   └── usePlayerStats.ts
├── stores/
│   └── playerStore.ts
├── utils/
│   └── calculateKDR.ts
├── types/
│   └── player.ts
└── index.ts                # Public API

// ❌ INCORRECT - Separated by type
components/
  ├── PlayerCard.tsx
  └── PlayerList.tsx
hooks/
  └── usePlayerStats.ts
stores/
  └── playerStore.ts
```

---

## II. FILE NAMING

### 2.1 Component Files

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase.tsx | `PlayerCard.tsx` |
| Hook | camelCase.ts | `usePlayerStats.ts` |
| Utility | camelCase.ts | `calculateKDR.ts` |
| Type | PascalCase.ts | `PlayerTypes.ts` |
| Test | ComponentName.test.ts | `PlayerCard.test.tsx` |
| Style | ComponentName.module.css | `PlayerCard.module.css` |

---

## CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-13 | Arch Team | Initial definition |

---

**Axiom ID:** STD-002  
**Stability:** Stable  
**Authority:** Universal  
**Version:** 1.0.0  

*End of File Organization*
