# 🏗️ SATOR-eXe-ROTAS / NJZ Platform

**Status:** 🟢 Active Development  
**Repository:** https://github.com/notbleaux/eSports-EXE

---

## 📁 Repository Structure

This repository follows professional IT project organization standards.

```
main-repo/
├── 📁 apps/                      # Applications
│   ├── website/                 # Original website
│   ├── website-v2/             # NJZ 4-Hub Platform (React)
│   └── VCT Valorant eSports/   # VCT data project
│
├── 📁 packages/                  # Shared packages
│   ├── shared/                 # Shared code library
│   └── parity_checker.py       # Data integrity checker
│
├── 📁 services/                  # Backend services
│   └── exe-directory/          # eXe directory platform
│
├── 📁 platform/                  # Simulation platform
│   └── simulation-game/        # Godot 4 simulation game
│
├── 📁 infrastructure/            # DevOps & Infrastructure
│   ├── .github/               # CI/CD workflows
│   ├── scripts/               # Utility scripts
│   ├── render.yaml            # Render deployment config
│   └── vercel.json            # Vercel deployment config
│
├── 📁 docs/                      # Documentation
│   ├── architecture/          # System design docs
│   ├── guides/                # User guides
│   ├── legacy/                # Legacy documentation
│   ├── legacy-archive/        # Historical archives
│   └── project/               # Project management docs
│
├── 📁 tests/                     # Test suites
│   ├── integration/           # Integration tests
│   └── unit/                  # Unit tests
│
├── 📁 tools/                     # Development tools
│   ├── .cursor/               # Cursor IDE config
│   ├── .kimi/                 # Kimi AI config
│   └── skills/                # AI skill definitions
│
├── 📁 project/                   # Project management
│   ├── PATCH_REPORTS/         # Change tracking
│   ├── reports/               # Investigation reports
│   ├── roadmap/               # Planning documents
│   └── standards/             # Standards & guidelines
│
├── 📁 data/                      # Data files
│   ├── *.db                   # Database files
│   └── *.sql                  # SQL schemas
│
├── LICENSE                       # Project license
├── package.json                  # Node dependencies
└── .gitignore                    # Git exclusions
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Git
- GitHub account

### Installation
```bash
# Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# Install dependencies
npm install

# Run website-v2 (NJZ Platform)
cd apps/website-v2
npm install
npm run dev
```

---

## 📋 Key Projects

| Project | Location | Tech Stack | Status |
|---------|----------|------------|--------|
| **NJZ Platform** | `apps/website-v2/` | React, Vite, Tailwind | ✅ Active |
| **Original Website** | `apps/website/` | HTML/CSS/JS | 🟡 Legacy |
| **Simulation Game** | `platform/simulation-game/` | Godot 4, C# | 🟡 Paused |
| **eXe Directory** | `services/exe-directory/` | TBD | 🔵 Planned |
| **VLR Data API** | `packages/shared/vlr-data/` | Python, FastAPI | ✅ Active |

---

## 📝 Commit Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description> - <context>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```bash
feat(website): Add SATOR hub orbital navigation
docs(api): Update VLR endpoint documentation
fix(pipeline): Resolve data parsing error
```

See `project/standards/COMMIT_STANDARDS.md` for full guidelines.

---

## 📚 Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| GitHub Desktop Guide | `docs/guides/GITHUB_DESKTOP_USER_GUIDE.md` | Git workflow |
| Project Memory | `docs/project/PROJECT_MEMORY.md` | Master reference |
| Investigation Report | `project/reports/INVESTIGATION_REPORT_Phase1A.md` | Phase 1 findings |
| Folder Comparison | `project/reports/FOLDER_COMPARISON_REPORT.md` | Repository analysis |
| Git History Review | `project/reports/GIT_HISTORY_REVIEW.md` | Commit analysis |

---

## 🤝 Contributing

1. Follow commit message standards
2. Update relevant documentation
3. Test changes before pushing
4. Reference issue numbers in commits when applicable

---

## 📊 Project Status

**Phase 1:** ✅ Complete (Investigation, Comparison, Git Review)  
**Phase 2:** ✅ Complete (Repository Standardization)  
**Phase 3:** 🔄 Ready (Recovery - if needed)  
**Phase 4:** ⏳ Pending (Organization refinement)  
**Phase 5:** ⏳ Pending (Handover)

---

## 🔐 Security

- GitHub token stored securely (refer to `docs/project/KIKI_TOKEN_REFERENCE.md`)
- No credentials committed to repository
- Use environment variables for sensitive data

---

## 📞 Contact

- **Repository:** https://github.com/notbleaux/eSports-EXE
- **Legacy Archive:** https://github.com/hvrryh-web/satorXrotas

---

*Last Updated: March 7, 2026*