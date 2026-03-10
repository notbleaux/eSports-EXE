[Ver001.000]

# 🤝 CONTRIBUTING.md
## How to Contribute to SATOR-eXe-ROTAS

**Project:** NJZ Platform / SATOR-eXe-ROTAS  
**Repository:** https://github.com/notbleaux/eSports-EXE

---

## 📋 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE
```

### 2. Understand the Structure
See [README.md](./README.md) for full structure overview.

Key directories:
- `apps/` — Applications (website, website-v2, VCT)
- `packages/` — Shared packages
- `docs/` — All documentation
- `project/` — Project management files

---

## 📝 Making Changes

### Step 1: Check Current Status
```bash
git status
```

### Step 2: Make Your Changes
Edit files in the appropriate directory.

### Step 3: Review Changes
```bash
git diff
```

### Step 4: Commit with Proper Message
```bash
git add .
git commit -m "type(scope): description - context"
```

**Commit Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting
- `refactor` — Code restructuring
- `test` — Tests
- `chore` — Maintenance

**Example:**
```bash
git commit -m "feat(website): Add new hub navigation component"
git commit -m "docs(readme): Update installation instructions"
git commit -m "fix(api): Resolve data parsing error"
```

### Step 5: Push to GitHub
```bash
git push origin main
```

---

## 🔄 Using GitHub Desktop (Alternative)

1. Open GitHub Desktop
2. Select `eSports-EXE` repository
3. Review changes in the left panel
4. Write commit message (summary + description)
5. Click "Commit to main"
6. Click "Push origin"

See [GitHub Desktop User Guide](./docs/guides/GITHUB_DESKTOP_USER_GUIDE.md) for full instructions.

---

## 📚 Documentation Standards

### When to Update Docs
- [ ] New feature added → Update relevant guide
- [ ] API changed → Update API documentation
- [ ] Architecture decision → Add to architecture docs
- [ ] Bug fixed → Update troubleshooting

### Where to Put Documentation
| Type | Location |
|------|----------|
| Architecture decisions | `docs/architecture/` |
| User guides | `docs/guides/` |
| Project management | `docs/project/` |
| Legacy/historical | `docs/legacy-archive/` |

---

## 🧪 Testing

Before submitting significant changes:
1. Test locally if possible
2. Check for broken links
3. Verify documentation is accurate

---

## 🐛 Reporting Issues

When you find a bug or want to suggest a feature:

1. **Check existing issues** — Might already be reported
2. **Provide context:**
   - What you were trying to do
   - What happened
   - What you expected
   - Steps to reproduce

---

## 🎯 Code Review

Even if working alone, review your own changes:
- [ ] Does it solve the problem?
- [ ] Is the code readable?
- [ ] Is it documented?
- [ ] Are commit messages clear?

---

## 📞 Getting Help

Resources:
- This file — Contributing guidelines
- [README.md](./README.md) — Project overview
- [GitHub Desktop User Guide](./docs/guides/GITHUB_DESKTOP_USER_GUIDE.md) — Git workflow
- GitHub Issues — Bug reports and feature requests

---

## ✅ Pre-Commit Checklist

- [ ] I understand what I'm changing
- [ ] I've tested the change (if applicable)
- [ ] I've updated documentation (if needed)
- [ ] My commit message follows the format
- [ ] I've reviewed my changes before committing

---

*Last Updated: March 7, 2026*