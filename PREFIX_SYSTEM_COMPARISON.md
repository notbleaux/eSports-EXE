# VERSION SYSTEM COMPARISON
## Original vs. Recommended Implementation

---

## ORIGINAL SPECIFICATION

```
Format:
[0aø{Æ_Priority_Order_No.}|{Axiom Title* (*First3Letters)}:BǑ{Base}|bō:ǒ{Bubble (abbreviated or shortened if over 5)}]

Example:
[0ao06-des|CounterStrike.csgo]

Key Definitions:
• Æ = Axiom Tier (short form, substitute tag, not for print)
• aø = Root Level Folders Tag (0 + alphanumeric for sorting)
• pn = Two Priority number (00-99, sorted for review)
• BǑ = BaseDomain Title (Ceiling connection to/from root)
• bō OR bô:ō = Bubble (equal of base OR bubble within)
• File Title = Centred
• Suffix = Major0.0Minor0.0Patch0.0
```

---

## RECOMMENDED IMPLEMENTATION

### Issues with Original:
1. Special characters (Æ, Ǒ, ō, ǒ) may cause encoding issues across systems
2. Complex bracket nesting hard to parse visually
3. "Not for print" contradicts visible usage
4. Unclear separation between metadata and filename

### Refined Format:

```
[0{PRIORITY}.{AXIOM}-{BASE}|{BUBBLE}]-{Title}-v{MAJOR}.{MINOR}.{PATCH}

Example:
[006.DES-CounterStrike|csgo]-MapAnalysis-v2.1.0.md
```

---

## DETAILED BREAKDOWN

### Component Comparison

| Original | Issue | Recommended | Rationale |
|----------|-------|-------------|-----------|
| `0aø` | Special char Ø | `0` | ASCII-safe, sorts first |
| `Æ` (Axiom) | Not printable | `DES` (full or 3-letter) | Clear, searchable |
| `06` (Priority) | Context unclear | `006` (3-digit) | Standard padding |
| `Ǒ` separator | Special char | `.` or `-` | Standard delimiters |
| `bō:ǒ` | Complex notation | `\|bubble` | Simple pipe separator |
| Centred title | Impossible in plain text | End placement | Filename standards |
| Major0.0... | Underscore confusion | `v2.1.0` | Standard SemVer |

---

## FULL EXAMPLES

### Example 1: CS:GO Map Analysis

**Original Concept:**
```
[0ao06-des|CounterStrike.csgo]
        Map Analysis
        v2.1.0
```

**Recommended Implementation:**
```
[006.DES-CounterStrike|csgo]-MapAnalysis-v2.1.0.md
```

**Parsed:**
- Priority: 006 (high priority for review)
- Axiom: DES (Design tier)
- Base: CounterStrike (main game)
- Bubble: csgo (specific variant)
- Title: MapAnalysis
- Version: 2.1.0
- Type: Markdown document

---

### Example 2: Valorant Agent Stats

**Original Concept:**
```
[0ao12-sta|Valorant]
        Agent Statistics
        v1.3.0
```

**Recommended Implementation:**
```
[012.STA-Valorant|agents]-AgentStats-v1.3.0.md
```

**Parsed:**
- Priority: 012 (lower priority)
- Axiom: STA (Statistics tier)
- Base: Valorant
- Bubble: agents (no variant, just category)
- Title: AgentStats
- Version: 1.3.0

---

### Example 3: SATOR Architecture

**Original Concept:**
```
[0ao01-arch|SATOR|data-retention]
        Architecture Spec
        v3.0.0
```

**Recommended Implementation:**
```
[001.ARCH-SATOR|data-retention]-ArchitectureSpec-v3.0.0.md
```

---

## PREFIX KEY (Refined)

### Axiom Tiers (Æ → Clear Codes)

| Code | Original | Full Name | Purpose |
|------|----------|-----------|---------|
| ARCH | Æ_arch | Architecture | System design, infrastructure |
| DES | Æ_des | Design | UI/UX, visual systems |
| STA | Æ_sta | Statistics | Data, analytics, metrics |
| POL | Æ_pol | Policy | Governance, security |
| INV | Æ_inv | Investigation | Research, analysis reports |
| MEM | Æ_mem | Memory | Logs, daily records |

### Priority Scale (00-999)

| Range | Priority Level | Review Cycle |
|-------|----------------|--------------|
| 000-099 | Critical | Weekly |
| 100-199 | High | Bi-weekly |
| 200-299 | Medium | Monthly |
| 300+ | Low | Quarterly |

### Bubble Types

| Notation | Meaning | Example |
|----------|---------|---------|
| `\|variant` | Game variant | `\|csgo`, `\|cs2` |
| `\|category` | Content category | `\|agents`, `\|maps` |
| `\|season` | Time-based | `\|2024`, `\|act3` |
| (none) | Base only | Valorant (no bubble) |

---

## FOLDER STRUCTURE WITH PREFIX SYSTEM

```
main-repo/
├── [000.ARCH-SATOR|core]/
│   └── [000.ARCH-SATOR|core]-DataRetention-v3.0.0.md
│
├── [006.DES-NJZ|grid]/
│   └── [006.DES-NJZ|grid]-ComponentLibrary-v2.1.0.md
│
├── [012.STA-CS|csgo]/
│   └── [012.STA-CS|csgo]-MapStats-v1.4.0.md
│
├── [015.INV-VAL|agents]/
│   └── [015.INV-VAL|agents]-JettAnalysis-v1.0.0.md
│
└── [300.MEM-SYS|daily]/
    ├── [300.MEM-SYS|daily]-2026-03-10-v1.0.0.md
    └── [300.MEM-SYS|daily]-2026-03-11-v1.0.0.md
```

---

## ADVANTAGES OF REFINED SYSTEM

1. **ASCII-Safe**: No special characters that break in terminals/Git
2. **Sortable**: `001` sorts before `012` correctly
3. **Parseable**: Clear delimiter structure
4. **Searchable**: `grep "STA-CS" *.md` finds all CS stats
5. **Standard**: Uses familiar SemVer (vX.Y.Z)
6. **Extensible**: Easy to add new axiom codes

---

## DECISION POINTS

### For Your Approval:

1. **Special Characters**: Keep Æ/Ǒ/ō (authentic) or use ASCII (practical)?
2. **Priority Digits**: 2-digit (00-99) or 3-digit (000-999)?
3. **Axiom Codes**: 3-letter (DES) or 4-letter (DESN)?
4. **Version Placement**: Prefix `[006.DES...]` or suffix `-v2.1.0`?
5. **Bubble Separator**: Pipe `|` or colon `:` or dash `-`?

### Hybrid Recommendation:

For maximum compatibility while preserving your vision:

```
[006aDES-CounterStrike|csgo]-MapAnalysis-v2.1.0.md

Breakdown:
[        ] = Priority container
006       = Priority number (3-digit)
a         = Axiom indicator (replaces Æ)
DES       = Axiom code (3-letter)
-         = Separator (replaces Ǒ)
CounterStrike = Base domain
|         = Bubble indicator (replaces bō:)
csgo      = Bubble/variant
]         = Close priority
-         = Separator
MapAnalysis = Title
-v2.1.0   = Semantic version
.md       = Extension
```

This maintains your alphanumeric sorting, axiom tiers, base/bubble hierarchy, while being 100% ASCII-safe and filesystem-compatible.
