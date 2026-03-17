# Version Header Strategies — Visual Comparison

## Current State (Option B: Status Quo)

```
REPOSITORY ROOT
├── docs/
│   ├── architecture/
│   │   ├── DATA_RETENTION_STRATEGY.md      [Ver001.000] ✓
│   │   └── API_GATEWAY.md                  [Ver001.000] ✓
│   ├── design/
│   │   ├── DESIGN_SYSTEM.md                [Ver001.000] ✓
│   │   └── COMPONENT_LIBRARY.md            [Ver001.000] ✓
│   └── archive-2024/
│       ├── OLD_DRAFT.md                    [Ver001.000] ✗ (stale)
│       └── DEPRECATED_SPEC.md              [Ver001.000] ✗ (misleading)
├── src/
│   ├── components/
│   │   ├── Button.jsx                      [Ver001.000] ✗ (noise)
│   │   ├── Modal.jsx                       [Ver001.000] ✗ (noise)
│   │   └── Card.jsx                        [Ver001.000] ✗ (noise)
│   └── utils/
│       ├── formatDate.js                   [Ver001.000] ✗ (noise)
│       └── validateEmail.js                [Ver001.000] ✗ (noise)
└── tools/
    ├── skills/
    │   ├── skill-a.md                      [Ver001.000] ✗ (noise)
    │   ├── skill-b.md                      [Ver001.000] ✗ (noise)
    │   └── skill-c.md                      [Ver001.000] ✗ (noise)
    └── scripts/
        └── cleanup.sh                      [Ver001.000] ✗ (noise)

LEGEND:
✓ = Header adds value (architectural, design, config)
✗ = Header is noise (implementation, archived, generated)

TOTAL HEADERS: ~350 files
SIGNAL-TO-NOISE RATIO: LOW
```

---

## Option A: Minimal Headers (Recommended)

```
REPOSITORY ROOT
├── docs/
│   ├── architecture/
│   │   ├── DATA_RETENTION_STRATEGY.md      [Ver001.000] ★
│   │   └── API_GATEWAY.md                  [Ver001.000] ★
│   ├── design/
│   │   ├── DESIGN_SYSTEM.md                [Ver001.000] ★
│   │   └── COMPONENT_LIBRARY.md            [Ver001.000] ★
│   └── archive-2024/
│       ├── OLD_DRAFT.md                    (no header - archived)
│       └── DEPRECATED_SPEC.md              (no header - archived)
├── src/
│   ├── components/
│   │   ├── Button.jsx                      (no header - implementation)
│   │   ├── Modal.jsx                       (no header - implementation)
│   │   └── Card.jsx                        (no header - implementation)
│   └── utils/
│       ├── formatDate.js                   (no header - implementation)
│       └── validateEmail.js                (no header - implementation)
└── tools/
    ├── skills/
    │   ├── skill-a.md                      (no header - tool)
    │   ├── skill-b.md                      (no header - tool)
    │   └── skill-c.md                      (no header - tool)
    └── scripts/
        └── cleanup.sh                      (no header - script)

KEY ARCHITECTURAL FILES (with headers):
★ ARCHITECTURE.md          — System design authority
★ DESIGN_SYSTEM.md         — Visual language spec
★ DATA_RETENTION.md        — Policy document
★ DEPLOYMENT.md            — Infrastructure spec
★ README.md                — Project entry point
★ SECURITY.md              — Security policy
★ CONTRIBUTING.md          — Process definition

TOTAL HEADERS: ~25-50 files
SIGNAL-TO-NOISE RATIO: HIGH
```

---

## Option C: Git-Based Only

```
REPOSITORY ROOT
├── docs/
│   ├── architecture/
│   │   ├── DATA_RETENTION_STRATEGY.md      (no header)
│   │   └── API_GATEWAY.md                  (no header)
│   └── design/
│       ├── DESIGN_SYSTEM.md                (no header)
│       └── COMPONENT_LIBRARY.md            (no header)
├── src/
│   └── components/
│       ├── Button.jsx                      (no header)
│       └── Modal.jsx                       (no header)
└── README.md                               (no header)

VERSION HISTORY (Git Only):
┌─────────────────────────────────────────────────────────┐
│  git log --oneline docs/architecture/DATA_RETENTION.md  │
├─────────────────────────────────────────────────────────┤
│  a1b2c3d  (HEAD) Update retention policy for GDPR       │
│  e4f5g6h  Add data classification section               │
│  i7j8k9l  Initial retention strategy                    │
└─────────────────────────────────────────────────────────┘

TRADE-OFF:
✓ Cleanest file contents
✓ Single source of truth (git)
✗ Requires git access for version info
✗ No offline/at-a-glance versioning
```

---

## Option D: Lightweight Tagging Prefix System

```
FILE NAMING CONVENTION (Prefixes)

┌────────────────────────────────────────────────────────────┐
│ PREFIX        │ MEANING              │ EXAMPLE             │
├────────────────────────────────────────────────────────────┤
│ ARCH-         │ Architecture doc     │ ARCH-data-retention │
│               │ (has version header) │     .md [Ver003.2]  │
├────────────────────────────────────────────────────────────┤
│ DESIGN-       │ Design system        │ DESIGN-njz-grid     │
│               │ (has version header) │     .md [Ver002.1]  │
├────────────────────────────────────────────────────────────┤
│ POLICY-       │ Policy document      │ POLICY-security     │
│               │ (has version header) │     .md [Ver001.5]  │
├────────────────────────────────────────────────────────────┤
│ DRAFT-        │ Work in progress     │ DRAFT-api-v2.md     │
│               │ (no version header)  │     (no header)     │
├────────────────────────────────────────────────────────────┤
│ LEGACY-       │ Archived/deprecated  │ LEGACY-v1-schema.md │
│               │ (no version header)  │     (no header)     │
├────────────────────────────────────────────────────────────┤
│ (no prefix)   │ Implementation       │ Button.jsx          │
│               │ (no version header)  │     (no header)     │
└────────────────────────────────────────────────────────────┘

DIRECTORY STRUCTURE WITH TAGGING:

docs/
├── architecture/
│   ├── ARCH-data-retention.md         [Ver003.000]
│   ├── ARCH-api-gateway.md            [Ver002.100]
│   └── ARCH-caching-strategy.md       [Ver001.000]
├── design/
│   ├── DESIGN-system.md               [Ver005.000]
│   ├── DESIGN-njz-grid.md             [Ver002.500]
│   └── DRAFT-mobile-ux.md             (WIP - no header)
├── policies/
│   ├── POLICY-security.md             [Ver001.000]
│   └── POLICY-data-governance.md      [Ver002.000]
└── archive/
    ├── LEGACY-v1-api-spec.md          (archived)
    └── LEGACY-2024-roadmap.md         (archived)

src/
├── components/                        (no prefixes)
│   ├── Button.jsx
│   └── Modal.jsx
└── utils/
    ├── formatDate.js
    └── validateEmail.js

ADVANTAGES:
✓ Semantic meaning at filename level
✓ Easy filtering: ls ARCH-* or find . -name "POLICY-*"
✓ Clear lifecycle indication (DRAFT → ARCH → LEGACY)
✓ Version headers only where meaningful
✓ Self-documenting structure

DISADVANTAGES:
✗ Requires renaming discipline
✗ Refactoring tools may not understand semantics
✗ Can create long filenames
```

---

## Decision Matrix

```
                    Option A    Option B    Option C    Option D
                    Minimal     Status Quo  Git-Only    Tagging
                    Headers     (Current)   Headers     Prefix
                    ─────────────────────────────────────────────
File Cleanliness    ★★★★☆       ★★☆☆☆       ★★★★★       ★★★★☆
At-a-Glance Info    ★★★★☆       ★★★☆☆       ★☆☆☆☆       ★★★★★
Git Integration     ★★★★★       ★★★☆☆       ★★★★★       ★★★★☆
Maintenance Burden  ★★★★★       ★★☆☆☆       ★★★★★       ★★★☆☆
Scalability         ★★★★★       ★★☆☆☆       ★★★★☆       ★★★★☆
Team Onboarding     ★★★★☆       ★★☆☆☆       ★★★★☆       ★★★★★
```

---

## My Recommendation

**Hybrid: Option A + Option D (Modified)**

```
1. Use MINIMAL version headers (Option A)
   - Only on: ARCH-*, DESIGN-*, POLICY-* files
   - ~25-50 files maximum

2. Use PREFIX naming (Option D subset)
   - ARCH-*  = Architecture documents
   - DESIGN-* = Design system docs  
   - POLICY-* = Policy documents
   - No prefix = implementation (code)
   - DRAFT-* = Work in progress
   - LEGACY-* = Archived content

3. Git handles everything else
   - All version history in commits
   - Tags for releases (v1.0.0, v2.0.0)
```

This gives you:
- **Semantic clarity** from prefixes
- **Version authority** from headers on key docs
- **Clean implementation** files
- **Scalable history** from git
- **Clear lifecycle** (DRAFT → [no prefix] → LEGACY)
