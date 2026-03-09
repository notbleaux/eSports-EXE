# SATOR-eXe-ROTAS Documentation Versioning System
## Version Control Protocol for Project Documentation

**Document ID:** VER-SYS-001  
**Version:** [Ver001.000]  
**Classification:** CRITICAL INFRASTRUCTURE  
**Date:** March 9, 2026  
**Author:** Kimi Claw (Project AI)  
**Review Authority:** Elijah Nouvelles-Bleaux (Project Owner)

---

## 1. EXECUTIVE SUMMARY

This document establishes the formal versioning protocol for all project documentation within the SATOR-eXe-ROTAS ecosystem. The system ensures:

- **Traceability:** Complete audit trail of all document changes
- **Accountability:** Clear attribution of modifications and decisions
- **Integrity:** Prevention of undocumented or unauthorized alterations
- **Posterity:** Long-term preservation of project knowledge
- **Reproducibility:** Ability to reconstruct any project state from documentation

### 1.1 Versioning Philosophy

The versioning system operates on the principle of **immutable history with progressive refinement**. Each document version represents a discrete state of project knowledge, with changes explicitly documented rather than overwriting prior content.

---

## 2. VERSION NUMBERING CONVENTION

### 2.1 Format Specification

```
[VerMMM.mmm]

Where:
- MMM = Major version (000-999)
- mmm = Minor version (000-999)

Example: [Ver001.023] = Major 1, Minor 23
```

### 2.2 Version Increment Rules

| Change Type | Major | Minor | Example | Description |
|-------------|-------|-------|---------|-------------|
| **Patch** | No | +1 | 001.000 → 001.001 | Typo fixes, formatting, non-substantive edits |
| **Minor** | No | +10 | 001.000 → 001.010 | Content additions, clarifications, new sections |
| **Major** | +1 | Reset | 001.023 → 002.000 | Structural changes, methodology shifts, scope alterations |
| **Release** | X | 000 | 001.000 | Official release version (minor always 000) |
| **Emergency** | Current | +1 | 001.045 → 001.046 | Critical fixes requiring immediate deployment |

### 2.3 Special Version States

| State | Format | Meaning |
|-------|--------|---------|
| **Draft** | [Ver000.DRAFT] | Work in progress, not yet released |
| **Review** | [VerXXX.REV-n] | Under review (n = review iteration) |
| **Legacy** | [VerXXX.LEGACY] | Superseded document, retained for reference |
| **Archived** | [VerXXX.ARCH] | Historical record, no longer active |

---

## 3. DOCUMENT LIFECYCLE WORKFLOW

### 3.1 State Transitions

```
[CREATION] → [DRAFT] → [REVIEW] → [APPROVED] → [ACTIVE] → [LEGACY] → [ARCHIVED]
                ↓           ↓           ↓           ↓           ↓
            [REVISION]  [REVISION]  [PATCH]   [UPDATE]   [SUPERSEDED]
```

### 3.2 State Definitions

| State | Description | Permissions | Duration |
|-------|-------------|-------------|----------|
| **CREATION** | Initial document generation | AI/Subagent | Single session |
| **DRAFT** | Content development phase | AI/Subagent | Hours to days |
| **REVIEW** | Owner verification pending | Read-only for AI | Until approval |
| **APPROVED** | Authorized for implementation | Read-only | Until update needed |
| **ACTIVE** | Currently authoritative version | Read-only | Primary operational period |
| **LEGACY** | Superseded but retained | Read-only | Retention period |
| **ARCHIVED** | Long-term storage | No modifications | Permanent |

### 3.3 Transition Triggers

| From | To | Trigger | Authority |
|------|-----|---------|-----------|
| DRAFT | REVIEW | Content complete | Document Author |
| REVIEW | APPROVED | Owner approval | Project Owner |
| REVIEW | DRAFT | Revision required | Project Owner |
| APPROVED | ACTIVE | Implementation start | Project Coordinator |
| ACTIVE | LEGACY | New version released | Project Owner |
| LEGACY | ARCHIVED | Retention period end | System (auto) |

---

## 4. DOCUMENT HEADER STANDARD

### 4.1 Required Header Fields

Every version-controlled document MUST contain the following header:

```markdown
# [Document Title]
## [Subtitle/Classification]

**Document ID:** [DOC-XXX-NNN]  
**Version:** [VerMMM.mmm]  
**Classification:** [PUBLIC/INTERNAL/CONFIDENTIAL]  
**Status:** [DRAFT/REVIEW/APPROVED/ACTIVE/LEGACY/ARCHIVED]  
**Date:** [YYYY-MM-DD]  
**Author:** [Name/Agent ID]  
**Review Authority:** [Name/Role]  
**Next Review Date:** [YYYY-MM-DD]  
**Supersedes:** [VerMMM.mmm] (if applicable)  
**Superseded By:** [VerMMM.mmm] (if applicable)

---

## CHANGE LOG

| Version | Date | Author | Changes | Authority |
|---------|------|--------|---------|-----------|
| [VerMMM.mmm] | [YYYY-MM-DD] | [Name] | [Description] | [Approver] |
```

### 4.2 Document ID Convention

```
[CAT-XXX-NNN]

Where:
- CAT = Category (3 letters)
  - VER = Version System
  - PLN = Plan
  - RPT = Report
  - FRM = Framework
  - ARC = Architecture
  - GUI = Guide
  - TPL = Template
  - LOG = Log
  
- XXX = Subcategory (3 letters)
  - See section 4.3
  
- NNN = Sequential number (000-999)
```

### 4.3 Subcategory Codes

| Category | Subcategory | Code | Description |
|----------|-------------|------|-------------|
| PLN | Implementation | IMP | Implementation plans |
| PLN | Remediation | REM | Remediation plans |
| PLN | Deployment | DEP | Deployment plans |
| RPT | Status | STA | Status reports |
| RPT | CRIT | CRI | Critical risk reports |
| RPT | Analysis | ANA | Analysis reports |
| FRM | Subagent | SUB | Subagent frameworks |
| FRM | Versioning | VER | Versioning frameworks |
| ARC | System | SYS | System architecture |
| GUI | User | USR | User guides |
| GUI | Deployment | DEP | Deployment guides |
| LOG | Error | ERR | Error logs |
| LOG | Change | CHG | Change logs |

---

## 5. VERSION TRACKING APPENDIX

### 5.1 Live Version Registry

**Location:** `/root/.openclaw/workspace/memory/VERSION_REGISTRY.md`

**Purpose:** Central registry of all document versions with timestamps and descriptions.

**Format:**
```markdown
# VERSION REGISTRY
## Last Updated: [YYYY-MM-DD HH:MM:SS]

| Document ID | Current Version | Last Updated | Status | Description |
|-------------|-----------------|--------------|--------|-------------|
| [DOC-ID] | [VerMMM.mmm] | [Timestamp] | [Status] | [Brief description] |

---

## CHANGE HISTORY

### [YYYY-MM-DD]
- **[HH:MM:SS]** — [DOC-ID] updated to [VerMMM.mmm]: [Description]
```

### 5.2 Historical Exchange Documentation

When a document is superseded, the following protocol applies:

1. **Original document** is renamed with `.LEGACY` suffix
2. **New document** created with incremented version
3. **Supersedes/Superseded By** fields populated in both
4. **Legacy document** moved to `archive/legacy/` directory
5. **Registry updated** with both entries
6. **Change log** documents the transition

### 5.3 Legacy Document Preservation

All legacy documents are retained with the following metadata:

```markdown
---
**LEGACY DOCUMENT NOTICE**

This document has been superseded by [VerMMM.mmm].
- **Superseded Date:** [YYYY-MM-DD]
- **Reason:** [Description of why superseded]
- **Current Status:** [LEGACY]
- **Retention Until:** [YYYY-MM-DD]

For current information, see: [Link to active version]
---
```

---

## 6. VERSION CONTROL PROCEDURES

### 6.1 Creating a New Document

1. **Assign Document ID** using convention in 4.2
2. **Set initial version** to [Ver001.000] or [Ver000.DRAFT]
3. **Populate header** with all required fields
4. **Add to registry** immediately upon creation
5. **Log creation event** in change history

### 6.2 Updating an Existing Document

1. **Determine change type** (Patch/Minor/Major)
2. **Increment version** per rules in 2.2
3. **Update header** with new version and date
4. **Append to change log** with detailed description
5. **Update registry** with new version and timestamp
6. **Commit to version control** with descriptive message

### 6.3 Superseding a Document

1. **Create new version** with Major increment
2. **Mark old document** as LEGACY with notice
3. **Cross-reference** Supersedes/Superseded By fields
4. **Move to legacy** directory
5. **Update registry** with both documents
6. **Document transition** in change history

---

## 7. SUBAGENT VERSIONING PROTOCOL

### 7.1 Subagent Document Creation

When subagents create documents:

1. **Subagent assigns** provisional ID: `TEMP-[AGENT]-[NNN]`
2. **Subagent uses** version: `[Ver000.DRAFT]`
3. **Primary agent reviews** and assigns official ID
4. **Primary agent sets** initial version: `[Ver001.000]`
5. **Primary agent updates** registry

### 7.2 Subagent Version Updates

Subagents may only increment **Minor** versions:
- **Patch (+1):** Corrections during draft phase
- **Minor (+10):** Content additions during draft phase

**Major versions** require primary agent authorization.

### 7.3 Final Review Version

Documents entering final review:
- Version set to: `[VerXXX.REV-1]`
- Each revision cycle increments: `[VerXXX.REV-2]`, `[VerXXX.REV-3]`, etc.
- Upon approval: `[VerXXX.000]` (Release)

---

## 8. QUALITY ASSURANCE INTEGRATION

### 8.1 Version Verification Checklist

Before any version is marked APPROVED:

- [ ] Document ID follows convention
- [ ] Version number follows format
- [ ] Header contains all required fields
- [ ] Change log is current
- [ ] Registry has been updated
- [ ] Legacy status is correct (if applicable)
- [ ] Cross-references are valid
- [ ] No broken internal links

### 8.2 Automated Version Validation

**Recommended implementation:**
```bash
# Pre-commit hook for version validation
validate_version() {
    # Check header format
    # Verify version increment
    # Ensure registry updated
    # Validate cross-references
}
```

---

## 9. POSTERITY AND LONG-TERM PRESERVATION

### 9.1 Document Retention Policy

| Document Type | Active Period | Legacy Period | Archive Period |
|---------------|---------------|---------------|----------------|
| Plans | 1 year | 2 years | Permanent |
| Reports | 6 months | 1 year | Permanent |
| Logs | 3 months | 6 months | 2 years |
| Frameworks | 2 years | 3 years | Permanent |
| Guides | 1 year | 2 years | Permanent |

### 9.2 Archive Format

Archived documents stored as:
- **Primary:** Markdown (`.md`)
- **Backup:** PDF (`.pdf`) for formatting preservation
- **Metadata:** JSON (`.json`) for machine readability

---

## 10. APPENDIX: QUICK REFERENCE

### 10.1 Version Decision Tree

```
Is this a new document?
├── YES → Use [Ver001.000] or [Ver000.DRAFT]
└── NO → What type of change?
    ├── Typo/Format → Patch (+1)
    ├── Content addition → Minor (+10)
    ├── Structural change → Major (+1, reset minor)
    └── Emergency fix → Emergency (+1)
```

### 10.2 Document Status Decision Tree

```
Is document complete?
├── NO → [DRAFT]
└── YES → Has owner reviewed?
    ├── NO → [REVIEW]
    └── YES → Owner approved?
        ├── NO → Return to [DRAFT]
        └── YES → Being used?
            ├── NO → [APPROVED]
            └── YES → [ACTIVE]
```

---

## CHANGE LOG

| Version | Date | Author | Changes | Authority |
|---------|------|--------|---------|-----------|
| [Ver001.000] | 2026-03-09 | Kimi Claw | Initial creation of Versioning System Protocol | Elijah Nouvelles-Bleaux |

---

**Document Status:** ACTIVE  
**Next Review Date:** 2026-06-09  
**Supersedes:** N/A  
**Superseded By:** N/A

---

*This document is the authoritative source for all versioning procedures within the SATOR-eXe-ROTAS project. All project documentation MUST comply with this protocol.*