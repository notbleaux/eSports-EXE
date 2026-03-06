# 🧠 PROJECT MEMORY ARTIFACT IDENTIFICATION FRAMEWORK
## For SATOR-eXe-ROTAS / NJZ Platform

**Purpose:** Systematic criteria for determining what information to save to memory  
**Classification:** OPERATIONAL FRAMEWORK  
**Version:** 1.0.0

---

## 🎯 FRAMEWORK OVERVIEW

This framework provides clear criteria for identifying information that should be preserved in PROJECT_MEMORY.md versus information that can be referenced externally or discarded.

**Goal:** Prevent memory bloat while ensuring critical context is retained across sessions.

---

## 📊 ARTIFACT CLASSIFICATION SYSTEM

### Tier 1: CRITICAL (Always Save)
**Criteria:** Information loss would prevent project continuation

| Category | Examples | Storage Method |
|----------|----------|----------------|
| **Identity** | User name, preferences, timezone | Header section |
| **Access** | Repository URLs, tokens (ref only) | Secure reference |
| **Decisions** | Approved plans, chosen architectures | Decision log |
| **Status** | Current phase, blockers, milestones | Status dashboard |

**Save Trigger:** Any change to identity, access, or major decisions

---

### Tier 2: HIGH VALUE (Usually Save)
**Criteria:** Frequently referenced, saves significant re-explanation time

| Category | Examples | Storage Method |
|----------|----------|----------------|
| **Investigations** | Analysis results, findings, conclusions | Summary + bookmark |
| **Reports** | QA, Security, Performance reports | Compressed key points |
| **Architecture** | System design, component relationships | Reference links |
| **Issues** | Known bugs, workarounds, fixes | Action items list |

**Save Trigger:** Investigation complete, report finalized, architecture approved

---

### Tier 3: REFERENCE (Save Conditionally)
**Criteria:** Large documents that need bookmarking but not full content

| Category | Examples | Storage Method |
|----------|----------|----------------|
| **Legacy Docs** | Transfer guides, historical analysis | Chapter-bookmark |
| **Technical Specs** | API docs, schemas, protocols | Link + summary |
| **Guides** | User guides, tutorials | Link only |
| **Analysis** | Gap analysis, skill frameworks | Compressed summary |

**Save Trigger:** Document created, analysis complete, needs future reference

---

### Tier 4: EPHEMERAL (Don't Save)
**Criteria:** Temporary, session-specific, or easily regenerated

| Category | Examples | Why Not Saved |
|----------|----------|---------------|
| **Commands** | git status, ls, find output | Easily rerun |
| **Errors** | Transient error messages | Fixed or resolved |
| **Chat Logs** | Full conversation text | Too large, context in summary |
| **Temporary Files** | Build artifacts, caches | Auto-generated |

**Save Trigger:** None — reference in session only

---

## 🔍 IDENTIFICATION DECISION TREE

```
Should this be saved to PROJECT_MEMORY.md?

START
  │
  ▼
┌─────────────────────────────┐
│ Is this about user identity │
│ or project classification?  │
└─────────────────────────────┘
  │
  ├── YES ──▶ TIER 1: CRITICAL ──▶ SAVE
  │
  └── NO
        │
        ▼
  ┌─────────────────────────────┐
  │ Is this an investigation    │
│ result, report, or analysis?  │
  └─────────────────────────────┘
        │
        ├── YES ──▶ TIER 2: HIGH VALUE ──▶ SAVE (summary)
        │
        └── NO
              │
              ▼
        ┌─────────────────────────────┐
        │ Is this a large document    │
│ that might be needed later?   │
        └─────────────────────────────┘
              │
              ├── YES ──▶ TIER 3: REFERENCE ──▶ BOOKMARK ONLY
              │
              └── NO
                    │
                    ▼
              ┌─────────────────────────────┐
              │ Is this temporary or easily │
│ regenerated if needed?        │
              └─────────────────────────────┘
                    │
                    ├── YES ──▶ TIER 4: EPHEMERAL ──▶ DON'T SAVE
                    │
                    └── NO (uncertain)
                          │
                          ▼
                    ASK USER: "Should I save this?"
```

---

## 📝 SAVING CRITERIA BY TYPE

### 1. Repository Information

| Information | Tier | Save Format | Example |
|-------------|------|-------------|---------|
| Clone URLs | 1 | Table | `https://github.com/...` |
| Repository structure | 2 | Tree diagram | Folder hierarchy |
| Token references | 1 | Secure reference | `[See MEMORY.md]` |
| Git history analysis | 2 | Summary + link | Investigation report |
| Full git log | 4 | Don't save | Reference in repo |

### 2. Investigation Results

| Information | Tier | Save Format | Example |
|-------------|------|-------------|---------|
| Key findings | 2 | Bullet list | "Found 2 migrations" |
| Conclusions | 2 | Paragraph | "Transfer was systematic" |
| Recommendations | 2 | Action items | "Compare folders" |
| Raw diff output | 4 | Don't save | Reference file |
| Full patch documents | 3 | Bookmark | `[CH-X] Title` |

### 3. Reports (QA, Security, Performance)

| Information | Tier | Save Format | Example |
|-------------|------|-------------|---------|
| Overall status | 2 | Status table | Pass/Partial/Fail counts |
| Critical issues | 2 | Highlighted list | Security vulnerabilities |
| Full report content | 3 | Bookmark | Link to file |
| Test methodology | 4 | Don't save | In report file |
| Raw console output | 4 | Don't save | Too large |

### 4. Code/Implementation

| Information | Tier | Save Format | Example |
|-------------|------|-------------|---------|
| Architecture decisions | 2 | Decision log | "Chose React over Vue" |
| Component inventory | 2 | Table | List of 6 components |
| Full source code | 4 | Don't save | In repo files |
| Build configuration | 3 | Bookmark | Link to vite.config.js |
| Dependency list | 3 | Summary | "React, Three.js, GSAP" |

### 5. User Preferences/Context

| Information | Tier | Save Format | Example |
|-------------|------|-------------|---------|
| Name/Timezone | 1 | Header field | "Elijah, Canberra" |
| Skill level | 1 | Note | "No formal coding" |
| Preferences | 2 | Bullet list | "Approve before actions" |
| Past decisions | 2 | Decision log | "Approved roadmap" |
| Temporary clarifications | 4 | Don't save | Session context |

---

## 📦 COMPRESSION RULES

### When to Compress

| Original Size | Compression | Result |
|---------------|-------------|--------|
| < 5KB | None | Full text |
| 5-50KB | Summary | Key points + link |
| 50-500KB | Bookmark | [CH-X] Title + 3-5 bullets |
| > 500KB | Heavy compression | Title + 1-2 key facts |

### Compression Formats

**Format 1: Full Text (Tier 1-2, small files)**
```
**Title:** Exact content here
**Details:** Full description
**Status:** Current state
```

**Format 2: Summary (Tier 2, medium files)**
```
**Title:** Brief summary
**Key Points:**
- Point 1
- Point 2
- Point 3
**Full File:** [Link or path]
```

**Format 3: Bookmark (Tier 3, large files)**
```
### [CH-X] Title
**Bookmark:** CODE-001
**Full File:** `filename.md` (X KB)
**Compressed:**
- Key finding 1
- Key finding 2
- Key finding 3
**Action Items:** [If any]
```

**Format 4: Reference (Tier 3, directories)**
```
**Directory:** `folder-name/`
**Contents:** Brief description
**Key Files:**
- `file1.md` — Purpose
- `file2.md` — Purpose
**Access:** [Link or path]
```

---

## 🔔 USER NOTIFICATION PROTOCOL

**When to Notify User About Potential Saves:**

### Automatic Saves (No Notification)
- Tier 1 information (identity, access, status)
- Decision log updates
- Action items

### User Confirmation Required
Before saving:
- [ ] Large investigation results (>50KB analysis)
- [ ] Personal information beyond name/timezone
- [ ] External references (links to private repos)
- [ ] Anything with security implications

### Notification Format
```
I found information that may be worth saving to PROJECT_MEMORY.md:

**Type:** [Investigation Report / Technical Analysis / etc.]
**Size:** [X KB]
**Key Content:** [1-2 sentence summary]

**Options:**
1. **Save full** — Include complete content
2. **Save summary** — Include key points only
3. **Bookmark only** — Just reference the file
4. **Don't save** — Keep in session only

Which would you prefer?
```

---

## 🔄 UPDATE TRIGGERS

**Automatically Update PROJECT_MEMORY.md When:**

1. **New Phase Started**
   - Update status dashboard
   - Log phase transition
   - Update action items

2. **Investigation Complete**
   - Add report to LIVE section
   - Compress to appropriate tier
   - Create bookmark if large

3. **Decision Made**
   - Add to decision log
   - Update status if blocker resolved
   - Note any action items

4. **Report Finalized**
   - Add to LIVE reports
   - Summarize key findings
   - Link to full file

5. **Legacy Document Analyzed**
   - Add to LEGACY section
   - Compress to chapter-bookmark
   - Note any transfer actions needed

6. **User Explicit Request**
   - "Save this to memory"
   - "Remember that..."
   - "Update PROJECT_MEMORY"

---

## 🗑️ ARCHIVAL RULES

**When to Move LIVE → LEGACY:**

| Condition | Action |
|-----------|--------|
| Report > 30 days old | Move to LEGACY, compress further |
| Decision superseded | Mark outdated, reference new |
| Phase completed | Move phase details to LEGACY |
| Information no longer relevant | Consider removal |

**When to Remove Completely:**
- Temporary access tokens (expired)
- Outdated contact information
- Superseded by newer information (and no historical value)

---

## ✅ QUALITY CHECKLIST

Before saving to PROJECT_MEMORY.md, verify:

- [ ] Is this the correct tier classification?
- [ ] Is the compression appropriate for size?
- [ ] Would I need this in a new session?
- [ ] Is the bookmark code unique?
- [ ] Is the user notified (if required)?
- [ ] Is the table of contents updated?
- [ ] Is the last updated date current?

---

## 📋 QUICK REFERENCE CARD

| If you see... | Tier | Action |
|---------------|------|--------|
| User's name | 1 | Save to header |
| Repository URL | 1 | Save to resources |
| Investigation results | 2 | Summarize + save |
| 50+ KB report | 3 | Create bookmark |
| Git status output | 4 | Don't save |
| "Should I save this?" | Ask | Get user confirmation |

---

**Framework Version:** 1.0.0  
**Created:** 2026-03-06  
**Status:** 🟢 ACTIVE  
**Next Review:** After 5 memory saves or 1 month