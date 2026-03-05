# Website Archive - 2024 Legacy

**Archive Date:** March 5, 2026  
**Organized By:** AGENT_03 (Repository Organizer)

## Overview

This archive contains legacy website components and hubs that have been superseded by the new NJZ 5-Hub Architecture.

## Archived Contents

### main-portal/
- **Original Purpose:** Legacy main landing portal
- **Reason Archived:** Superseded by njz-central/ (Hub 0)
- **Size:** 56KB
- **Contents:** HTML, CSS, JS files for the original landing page

### hub1-satorxrotas/
- **Original Purpose:** Combined SATORxROTAS hub
- **Reason Archived:** Split into separate hub1-sator/ and hub2-rotas/ hubs
- **Size:** 968KB
- **Contents:** CSS, JS, assets for the combined hub interface

### hub2-esports-exe/
- **Original Purpose:** eSports EXE platform (Next.js application)
- **Reason Archived:** Superseded by hub2-rotas/ (cleaner implementation)
- **Size:** 410MB
- **Contents:** Full Next.js application with node_modules, app, components, lib

### hub3-dashboard/
- **Original Purpose:** Legacy dashboard hub
- **Reason Archived:** Superseded by hub3-information/ (more comprehensive)
- **Size:** 136KB
- **Contents:** Vite + React + TypeScript dashboard application

### hub4-directory/
- **Original Purpose:** Legacy game directory
- **Reason Archived:** Superseded by hub4-games/ (more focused)
- **Size:** 76KB
- **Contents:** Vite + React + TypeScript directory application

## Active Hubs (Current Structure)

```
website/
├── njz-design-system.css    # Shared design system
├── njz-central/             # Hub 0 - Central Portal
├── hub1-sator/              # Hub 1 - SATOR
├── hub2-rotas/              # Hub 2 - ROTAS
├── hub3-information/        # Hub 3 - Information
├── hub4-games/              # Hub 4 - Games
└── archive/                 # This archive
    └── 2024-legacy/         # Legacy files (this directory)
```

## Restoration Notes

If any files from this archive need to be restored:
1. Copy the specific directory back to the website root
2. Update import paths as needed
3. Test thoroughly before deployment

## Contact

For questions about this archive, refer to the REPOSITORY_ORGANIZATION_REPORT.md in the project root.
