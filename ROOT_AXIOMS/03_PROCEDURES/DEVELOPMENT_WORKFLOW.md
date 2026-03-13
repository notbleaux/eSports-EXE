[Ver1.0.0]

# DEVELOPMENT WORKFLOW
## Root Axiom — Development Process

**Axiom ID:** PROC-001  
**Stability:** Evolving  
**Authority:** Domain  
**Version:** 1.0.0  
**Dependencies:** [CODE-001, STD-001, STD-002]  

---

## I. BRANCHING STRATEGY

### 1.1 Git Flow Lite

```
main (production)
  ↑
develop (integration)
  ↑
feature/* (individual work)
  ↑
hotfix/* (urgent fixes)
```

### 1.2 Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/{ticket}-{description}` | `feature/123-add-player-card` |
| Bugfix | `fix/{ticket}-{description}` | `fix/456-memory-leak` |
| Hotfix | `hotfix/{description}` | `hotfix/critical-auth-bug` |
| Release | `release/{version}` | `release/2.1.0` |

---

## II. COMMIT PROCESS

### 2.1 Commit Message Format

```
<type>(<scope>): <subject> - <context>

<body>

<footer>
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Formatting (no code change)
- `refactor` — Code restructuring
- `test` — Adding/updating tests
- `chore` — Maintenance tasks

**Example:**
```
feat(grid): Add virtual scrolling for 100+ panels - implements TanStack Virtual

- Integrates @tanstack/react-virtual
- Configures overscan for smooth scrolling
- Maintains 60fps performance target

Refs: TENET-234
```

### 2.2 Commit Frequency

**Rule:** Commit early and often with logical units of work.

- ✅ Commit when tests pass
- ✅ Commit before refactoring
- ✅ Commit at end of work session
- ❌ Commit broken code to main branches

---

## III. PULL REQUEST PROCESS

### 3.1 PR Requirements

Before creating PR:
- [ ] All tests pass
- [ ] Lint checks pass
- [ ] Self-review completed
- [ ] Description includes context

### 3.2 PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings

## Related Issues
Fixes #123
```

---

## CHANGE LOG

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-13 | Arch Team | Initial definition |

---

**Axiom ID:** PROC-001  
**Stability:** Evolving  
**Authority:** Domain  
**Version:** 1.0.0  

*End of Development Workflow*
