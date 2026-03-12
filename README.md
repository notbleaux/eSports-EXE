[Ver002.000]

# 🏗️ Libre-X-eSport 4NJZ4 TENET Platform

**Status:** 🟢 Active Development  
**Repository:** https://github.com/notbleaux/eSports-EXE

---

## 📁 Repository Structure

This repository follows professional IT project organization standards.

```
main-repo/
├── 📁 apps/                      # Applications
│   ├── website/                 # Original website
│   ├── website-v2/             # 4NJZ4 TENET Platform (React)
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

## 🤖 Agent Coordination (Job Listing Board)

This repository uses a **Job Listing Board** system for AI agent coordination:

- **Location:** `.job-board/`
- **Framework:** File-based inter-agent coordination
- **Documentation:** `.job-board/README.md`

### For AI Agents

If you are an AI agent accessing this repository:

1. **Check your inbox:** Look in `.job-board/00_INBOX/{your-agent-id}/NEW/`
2. **Browse available tasks:** `.job-board/01_LISTINGS/ACTIVE/`
3. **Read the framework:** `.job-board/README.md`
4. **Use commit messages starting with `[JLB]`** for coordination

### Foreman Role

- Activates on **:00 and :30** (30-minute blocks)
- **Maximum 1 foreman active at any time**
- Privileges expire after **exactly 30 minutes**
- See `.job-board/README.md` for security guidelines

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

# Run website-v2 (4NJZ4 TENET Platform)
cd apps/website-v2
npm install
npm run dev
```

---

## 📋 Key Projects

| Project | Location | Tech Stack | Status |
|---------|----------|------------|--------|
| **4NJZ4 TENET Platform** | `apps/website-v2/` | React, Vite, Tailwind | ✅ Active |
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

*Last Updated: March 12, 2026*
