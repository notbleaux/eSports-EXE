[Ver002.000]

# VERSIONING.md — Version Header Specification

> Standardized versioning for the Gilded Legacy Repository

---

## Version Format

All files use the `[VerMMM.mmm]` header format:

```
[Ver002.000] = Major Version 2, Minor Version 0, Patch 0
[Ver002.001] = Major Version 2, Minor Version 0, Patch 1
[Ver002.010] = Major Version 2, Minor Version 1, Patch 0
[Ver003.000] = Major Version 3, Minor Version 0, Patch 0
```

### Format Breakdown
- **MMM** (Major) — Significant architectural changes
- **mmm** (Minor.Patch) — Features and fixes

---

## File Header Standards

### JavaScript/JSX Files
```javascript
[Ver002.000]

/**
 * ComponentName.jsx — Brief Description
 * 
 * Longer description of functionality, purpose,
 * and any important implementation notes.
 * 
 * @module ComponentName
 * @version 2.0.0
 * @since 2024-03
 * @partof SATORxROTAS Platform
 * @see RelatedComponent
 */
```

### CSS Files
```css
/*
 * [Ver002.000]
 * 
 * filename.css — Brief Description
 * 
 * Detailed description of styles, design tokens,
 * and usage guidelines.
 */
```

### JSON/Markdown Files
```json
{
  "_version": "[Ver002.000]",
  "name": "package-name",
  "version": "2.0.0"
}
```

```markdown
[Ver002.000]

# Document Title

Content follows version header...
```

---

## Version Assignment Rules

### Major Version Bump (MMM)
- Breaking API changes
- Architectural rewrites
- New hub additions
- Technology stack changes

### Minor Version Bump (.mmm → .Mmm)
- New features
- Component additions
- Non-breaking enhancements

### Patch Version Bump (.mmM)
- Bug fixes
- Documentation updates
- Performance improvements

---

## Current Versions

| Component | Version | Header |
|-----------|---------|--------|
| Core Source | 2.0.0 | [Ver002.000] |
| SATOR Hub | 2.0.0 | [Ver002.000] |
| ROTAS Hub | 2.0.0 | [Ver002.000] |
| Shared Components | 2.0.0 | [Ver002.000] |
| VFX Systems | 2.0.0 | [Ver002.000] |
| Documentation | 2.0.0 | [Ver002.000] |
| Archive (v1) | 1.0.0 | [Ver001.000] |

---

## Compliance

All files in the Gilded Legacy Repository must include:
1. ✅ Version header at top of file
2. ✅ JSDoc block (for JS/JSX)
3. @version tag matching header
4. @partof SATORxROTAS Platform

---

**Document Version:** [Ver002.000]
