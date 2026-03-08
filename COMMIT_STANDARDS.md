# 📋 Commit Message Standards
## For SATOR-eXe-ROTAS / NJZ Platform

### Format
```
[type](scope): [description] - [context]
```

### Types
| Type | Use When | Example |
|------|----------|---------|
| `feat` | New feature | `feat(hub): Add SATOR hub orbital navigation` |
| `fix` | Bug fix | `fix(api): Resolve VLR data parsing error` |
| `docs` | Documentation | `docs(readme): Update installation steps` |
| `style` | Formatting | `style(css): Fix indentation in tokens` |
| `refactor` | Code restructuring | `refactor(store): Migrate to Zustand` |
| `test` | Adding tests | `test(api): Add circuit breaker tests` |
| `chore` | Maintenance | `chore(deps): Update dependencies` |

### Examples
✅ **Good:**
- `feat(website): Add NJZ Platform 4-hub navigation`
- `fix(render): Remove cron job - not available on free tier`
- `docs(architecture): Add backend API design patterns`

❌ **Bad:**
- `yayooo`
- `hwhw`
- `sup`
- `idk`

### Checklist Before Committing
- [ ] Does it describe WHAT changed?
- [ ] Does it explain WHY (if not obvious)?
- [ ] Is it under 72 characters?
- [ ] Does it use present tense ("Add" not "Added")?

### Body (Optional)
For complex changes, add a blank line then:
```
[type](scope): Short description

- Detail 1
- Detail 2
- Breaking change note
```
