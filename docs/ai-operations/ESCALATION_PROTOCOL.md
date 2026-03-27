[Ver001.000]

# Escalation Protocol — NJZ eSports Platform

**Purpose:** Defines exactly when agents decide autonomously vs when they must pause and escalate.
**Tier:** T1 — load before starting any cross-domain or high-risk task.
**Authority:** `MASTER_PLAN.md §8`, `.agents/AGENT_CONTRACT.md`

---

## Decision Matrix

| Scenario | Agent Decides Autonomously | Escalate to CODEOWNER |
|----------|--------------------------|----------------------|
| Minor formatting, whitespace, comment fix | ✅ Yes | ❌ No |
| Performance optimisation (no logic change) | ✅ Yes | ❌ No |
| New API endpoint that follows existing pattern | ✅ Yes | ❌ No |
| Unit test addition or update | ✅ Yes | ❌ No |
| Documentation correction | ✅ Yes | ❌ No |
| Bug fix isolated to one file | ✅ Yes | ❌ No |
| New React component (no schema change) | ✅ Yes | ❌ No |
| New type/interface definition | STRUCT PR required | If schema-breaking |
| New API route with new response shape | STRUCT PR required | ❌ No |
| New Alembic migration | STRUCT PR required | ❌ No |
| Refactor that changes an import/export interface | STRUCT PR required | ❌ No |
| Schema change affecting multiple consumers | ❌ No — must escalate | ✅ Yes |
| Auth0 / external credentials configuration | ❌ No — must escalate | ✅ Yes |
| Production deployment | ❌ No — must escalate | ✅ Yes |
| Deletion of > 5 files | ❌ No — CRIT PR | ✅ Yes (24h hold) |
| New top-level directory at repo root | ❌ No | ✅ Yes |
| Modify MASTER_PLAN.md or AGENT_CONTRACT.md | ❌ No | ✅ Yes |
| Gambling-adjacent feature (Betting/Prediction UI) | ❌ No | ✅ Yes — explicit opt-in |

---

## When to Ask vs When to Proceed

### Always proceed without asking
- The task is clearly within your domain (see SKILL_MAP.md)
- No files outside your domain are touched
- The change is reversible (can be undone with `git revert`)
- Risk tier is `[SAFE]` per commit classification rules

### Stop and ask before proceeding
- You are about to modify a file outside your domain
- The task requires credentials you don't have
- The spec is ambiguous and two valid interpretations lead to different architectures
- You've been reading files for more than 5 minutes without finding what you need
- The task involves a CODEOWNER_APPROVAL_REQUIRED touchpoint

### Stop immediately and report BLOCKED
- A required file is missing and you cannot proceed without it
- A type change is needed that would break more than 2 consumers
- The task contradicts an instruction in MASTER_PLAN.md or AGENT_CONTRACT.md
- You've attempted the same approach twice and failed both times

---

## USER_INPUT_REQUIRED — Escalation Protocol

When an agent encounters a `⚠️ USER_INPUT_REQUIRED` marker in MASTER_PLAN.md:

1. **Stop current phase work** — do not begin the blocked phase
2. **Report to user** — state: "Phase N is ready but requires your input before agents can proceed."
3. **List exactly what is needed** — be specific (e.g., "Auth0 Domain, Client ID, Client Secret")
4. **Point to the setup guide** — reference the relevant file (e.g., `.agents/AUTH0_SETUP.md`)
5. **Wait** — do not attempt to work around the user input requirement

The format for reporting a USER_INPUT_REQUIRED block:

```
⚠️ USER_INPUT_REQUIRED — Phase N cannot begin

What I need from you:
1. [Specific credential/decision/action]
2. [Specific credential/decision/action]

Where to find instructions: [file path]

Once you complete these steps, reply and I will continue.
```

---

## Risk Tier Quick Reference

| Tier | Tag | When to use | Auto-merge? |
|------|-----|-------------|-------------|
| Safe | `[SAFE]` | Docs, tests, chore, non-breaking code | ✅ After CI |
| Structural | `[STRUCT]` | Schema changes, interface changes, refactors | ❌ CODEOWNER review |
| Critical | `[CRIT]` | Deletions, auth/infra, production deploy | ❌ CODEOWNER + 24h hold |

Auto-safe types (no tag needed): `docs:`, `test:`, `chore:` commits.
Always-CRIT paths: `data/schemas/`, `services/*/models.py`, `.github/`, `infra/`, deletions > 5 files.
