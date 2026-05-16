[Ver001.000]

# 2026-Q2 Root Cleanup

Files in this directory were moved from the repository root on 2026-05-11 as part of the premier-standard onboarding pass on branch `claude/review-repo-setup-kkT4o`.

Per `.doc-tiers.json` they are **T2 (do not load)** — kept here for historical reference only.

## Contents

### `root-reports/`

Completion summaries, CRIT assessments, and verification reports that documented finished phases of work. Not reference material for new contributors.

### `tsc-artifacts/`

TypeScript compiler output dumps (`tsc-check.txt`, `tsc-output.txt`, etc.) — build artifacts that should never have been committed. Total ~1.4 MB.

## If you need one of these files

Pull from git history (`git log -- <path>`). They were not deleted, only relocated, so blame and history are preserved.
