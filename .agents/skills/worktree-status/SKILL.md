---
name: worktree-status
description: 'Check git repository status for 4NJZ4 TENET Platform.'
license: MIT
metadata:
  author: SATOR Team
  version: '2.1.0'
---

# Worktree Status

> **REPOSITORY STATUS CHECKS**
>
> Quick git commands for the 4NJZ4 TENET Platform repository.

## Commands

```bash
# Check repository status
git status

# List changed files
git diff --name-only

# View latest commit
git log -1 --oneline

# View recent commits (last 10)
git log --oneline -10

# Check current branch
git branch --show-current

# View unstaged changes
git diff

# View staged changes
git diff --staged
```

## New in 2.1.0

- Enhanced command reference
- PowerShell compatible examples
- Additional git workflow helpers

## References

- [AGENTS.md](../../../AGENTS.md)
- [memory/CURRENT_FOCUS.md](../../../memory/CURRENT_FOCUS.md)
