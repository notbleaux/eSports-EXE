[Ver1.0.0]

# VERSIONING RULES
## Root Axiom — Document Version Control

**Axiom ID:** META-002  
**Stability:** Immutable  
**Authority:** Universal  
**Version:** 1.0.0  
**Dependencies:** [META-001]  

---

## I. SEMANTIC VERSIONING

All Root Axiom documents adhere to **Semantic Versioning 2.0.0** (SemVer).

### 1.1 Version Format

```
MAJOR.MINOR.PATCH
```

| Component | Increment When | Example |
|-----------|----------------|---------|
| **MAJOR** | Breaking change to principle | 1.0.0 → 2.0.0 |
| **MINOR** | New principle/standard added | 1.0.0 → 1.1.0 |
| **PATCH** | Clarification, typo fix | 1.0.0 → 1.0.1 |

### 1.2 Document Header Format

```markdown
[VerX.Y.Z]

# Document Title
## Subtitle

**Axiom ID:** XXX-###  
**Stability:** {immutable|stable|evolving}  
**Authority:** {universal|domain|team}  
**Version:** X.Y.Z  
**Dependencies:** [XXX-###, XXX-###]
```

**NOTES:**
- No leading zeros in version numbers
- Document version reflects content version, not file version
- Dependencies use Axiom IDs, not document names

---

## II. STABILITY LEVELS

### 2.1 Immutable

- **Change Frequency:** Never
- **Examples:** Core architectural principles
- **Process:** Cannot be changed; new principle supersedes with new ID

### 2.2 Stable

- **Change Frequency:** Annually or less
- **Examples:** Established coding standards
- **Process:** Requires Universal Authority approval

### 2.3 Evolving

- **Change Frequency:** As needed
- **Examples:** Active development procedures
- **Process:** Domain authority approval sufficient

---

## III. DEPENDENCY MANAGEMENT

### 3.1 Dependency Declaration

Documents MUST declare dependencies in their header:

```markdown
**Dependencies:** [ARCH-001, CODE-003, META-001]
```

### 3.2 Dependency Rules

1. **Downward Only:** Principles may depend on Meta, Standards on Principles, etc.
2. **No Circular Dependencies:** A → B → A is forbidden
3. **Version Pinning:** Dependencies reference specific versions

### 3.3 Change Propagation

When a document changes:
- **PATCH:** No dependent documents require updates
- **MINOR:** Dependent documents should review compatibility
- **MAJOR:** All dependent documents MUST review and potentially update

---

## IV. CHANGE LOG FORMAT

All documents MUST maintain a change log:

```markdown
## CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1.0 | 2026-06-01 | J. Smith | Added security principle SEC-004 |
| 1.0.1 | 2026-04-15 | A. Jones | Clarified exception handling |
| 1.0.0 | 2026-03-13 | Arch Team | Initial definition |
```

---

**Axiom ID:** META-002  
**Stability:** Immutable  
**Authority:** Universal  
**Version:** 1.0.0  

*End of Versioning Rules*
