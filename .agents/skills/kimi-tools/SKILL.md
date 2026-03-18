---
name: kimi-tools
description: "Repository tools and utilities for Libre-X-eSport 4NJZ4 TENET Platform. USE FOR: file operations, script execution, development workflow automation."
license: MIT
metadata:
  author: SATOR Team
  version: "1.0.0"
---

# Kimi Tools for 4NJZ4 TENET Platform

> **REPOSITORY UTILITIES**
>
> Helper tools and scripts for common development tasks.

## Available Tools

### File Operations

```bash
# Read file content
ReadFile(path: string, line_offset?: number, n_lines?: number)

# Write file content
WriteFile(path: string, content: string, mode?: "overwrite" | "append")

# Replace strings in file
StrReplaceFile(path: string, edit: {old: string, new: string})

# Search file content
Grep(pattern: string, path?: string, type?: string)

# List files
Glob(pattern: string)
```

### Shell Commands

```bash
# Execute shell command
Shell(command: string, timeout?: number)
```

### Web Operations

```bash
# Search web
SearchWeb(query: string, limit?: number)

# Fetch URL
FetchURL(url: string)
```

## Common Workflows

### Find and Replace Across Files

```bash
# Find all occurrences
grep -r "old_pattern" --include="*.ts" --include="*.tsx" .

# Replace with confirmation
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/old_pattern/new_pattern/g'
```

### Run Tests

```bash
# Python tests
cd packages/shared
pytest

# TypeScript tests
cd apps/website-v2
npm run test

# E2E tests
npx playwright test
```

### Type Check

```bash
# Root level
npm run typecheck

# Website only
cd apps/website-v2
npm run typecheck
```

## Repository Structure Commands

```bash
# Show directory tree (PowerShell)
Get-ChildItem -Recurse -Directory | Select-Object FullName

# Find large files
Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20 Name, Length

# Count files by type
Get-ChildItem -Recurse -File -Filter "*.ts" | Measure-Object
```

## Development Shortcuts

```bash
# Start all services
docker-compose up -d

# Start only database
docker-compose up -d db redis

# Run API
cd packages/shared/api
uvicorn main:app --reload --port 8000

# Run web dev server
cd apps/website-v2
npm run dev
```

## Environment Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (PowerShell)
.venv\Scripts\Activate.ps1

# Install Python deps
pip install -r packages/shared/requirements.txt

# Install Node deps
npm install
```
