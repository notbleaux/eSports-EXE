# SATOR — Products & Frameworks Index
## Satire-deck-Veritas Creative Repository

---

## PURPOSE

SATOR is the creative engine room. It contains:
- **Products:** Completed, shippable work
- **Concepts:** Ideas in development
- **Frameworks:** Methodologies and systems
- **Apps:** Functional applications
- **Plans:** Strategic documents
- **Prompt Templates:** Reusable agent instructions
- **Structured Documentation:** Standardized formats

---

## FOLDER STRUCTURE

```
sator/
├── INDEX.md                              # This file
│
├── 📁 confirmed/                         # ✅ Approved by user
│   ├── INDEX.md
│   ├── products/
│   ├── frameworks/
│   ├── apps/
│   └── documentation/
│
├── 📁 unconfirmed/                       # ⏳ Pending review
│   ├── INDEX.md
│   ├── concepts/
│   ├── prototypes/
│   ├── drafts/
│   └── experiments/
│
├── 📁 rejected/                          # ❌ Failed review
│   ├── INDEX.md
│   ├── attempts/
│   ├── iterations/
│   └── archive/
│
└── 📁 adaptions/                         # 🔄 Modified versions
    ├── INDEX.md
    ├── v2-revisions/
    ├── v3-revisions/
    └── final-versions/
```

---

## CATEGORIZATION RULES

### Confirmed (✅)
**Criteria:**
- User explicitly approved
- Meets all specifications
- Passes validation checklist
- Ready for production

**Action:** Move from unconfirmed/ → confirmed/

### Unconfirmed (⏳)
**Criteria:**
- Work completed
- Awaiting user review
- May need revisions
- Not yet production-ready

**Action:** Keep in unconfirmed/ until review

### Rejected (❌)
**Criteria:**
- Failed 3 adaption attempts
- Does not meet specifications
- User explicitly rejected
- Superseded by better version

**Action:** Move to rejected/ after 3rd failure
**Retention:** 90 days, then archive or delete (ask user)

### Adaption (🔄)
**Criteria:**
- Revision in progress
- Addressing feedback
- Iterative improvements
- Working toward confirmation

**Action:** Store in adaptions/ during revision cycles

---

## ADAPTION CHECK PROTOCOL

### Attempt 1: Initial Delivery
```
Location: unconfirmed/
Status: AWAITING REVIEW
Next: User critique
```

### Attempt 2: First Revision
```
Location: adaptions/v2-revisions/
Status: ADAPTION v2
Changes: [documented]
Next: User review v2
```

### Attempt 3: Second Revision
```
Location: adaptions/v3-revisions/
Status: ADAPTION v3
Changes: [documented]
Next: Final user review
```

### Attempt 4+: Final or Reject
```
IF approved → confirmed/
IF rejected → rejected/
Prompt user: "Delete or keep for reference?"
```

---

## CURRENT INVENTORY

### Confirmed (0 items)
| Item | Type | Date | Description |
|------|------|------|-------------|
| — | — | — | — |

### Unconfirmed (0 items)
| Item | Type | Date | Description |
|------|------|------|-------------|
| — | — | — | — |

### In Adaption (0 items)
| Item | Type | Date | Attempt |
|------|------|------|---------|
| — | — | — | — |

### Rejected (0 items)
| Item | Type | Date | Reason |
|------|------|------|--------|
| — | — | — | — |

---

## DAILY CHECK REQUIREMENTS

Every day, report on:
1. Total items in each category
2. Items awaiting user review > 24 hours
3. Items in adaption > 3 attempts
4. New items added today
5. Items moved between categories

### Report Format
```
SATOR DAILY CHECK — [DATE]

Confirmed: [N] (+/- [n])
Unconfirmed: [N] (+/- [n])
Adaption: [N] (+/- [n])
Rejected: [N] (+/- [n])

Awaiting Review > 24h: [list]
Stale Adaptions (>3): [list]
Delete Candidates: [list]

Recommendations:
- [action items]
```

---

## ACCESS

**For User:**
- Primary entry: shrine/ (for review)
- Archive reference: sator/confirmed/

**For Agents:**
- Work in progress: sator/unconfirmed/
- Revisions: sator/adaptions/
- Reference: sator/confirmed/

---

Index Version: 1.0.0
Last Updated: 2026-04-01
Status: EMPTY — AWAITING FIRST ITEMS
