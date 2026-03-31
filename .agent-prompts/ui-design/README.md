# UI/UX Design Agent Prompt System
## Token-Efficient Context Injection for IDE CLI Agents

---

## Overview

This directory contains a **file-based context system** designed to reduce token usage when prompting independent IDE CLI agents.

**Problem:** Long prompts with embedded context consume excessive tokens.  
**Solution:** Separate context into reference files, short prompt references them.

**Token Savings:** ~70% vs. inline context (3000+ lines → 800 lines)

---

## Directory Structure

```
.agent-prompts/ui-design/
├── PROMPT.md                    # Main prompt (short, references files)
├── contexts/                    # Context injection files
│   ├── 01-project-overview.md   # What we're building
│   ├── 02-architecture-system.md # How it's structured
│   ├── 03-design-system.md      # How it should look
│   ├── 04-user-personas.md      # Who we're building for
│   └── 05-tech-constraints.md   # Technical boundaries
├── mappings/                    # Templates and schemas
│   ├── user-path-schema.json    # JSON Schema for validation
│   └── user-path-template.json  # (optional starter template)
└── outputs/                     # Generated artifacts
    ├── user-path-01-*.json      # Example: Casual fan path
    ├── user-path-02-*.json      # Example: Aspiring player path
    └── user-path-03-*.json      # Example: Professional analyst path
```

---

## Usage for Independent Agent

### Step 1: Read Context Files (in order)

```bash
# Agent reads these sequentially
cat contexts/01-project-overview.md
cat contexts/02-architecture-system.md
cat contexts/03-design-system.md
cat contexts/04-user-personas.md
cat contexts/05-tech-constraints.md
```

### Step 2: Read Prompt

```bash
cat PROMPT.md
```

### Step 3: Execute Task

Create outputs following the schema in `mappings/user-path-schema.json`.

---

## Validation

```bash
# Validate JSON outputs
for f in outputs/*.json; do
  jq empty "$f" && echo "✅ $f valid"
done

# Validate against schema
jq -s '.[0] as $schema | .[1] | $schema' \
  mappings/user-path-schema.json \
  outputs/user-path-01-*.json
```

---

## The Three User Paths

### Path 1: Casual Match Checker
- **Persona:** Casual fan (Alex)
- **Goal:** Check match results quickly
- **Tier:** Casual (simple, low data density)
- **Primary HUB:** OPERA (pro scene)
- **Color:** Orange (#F97316)

### Path 2: Aspiring Player Comparison
- **Persona:** Aspiring player (Jordan)
- **Goal:** Compare pro players, improve gameplay
- **Tier:** Aspiring (moderate, expandable)
- **Primary HUB:** ROTAS (stats reference)
- **Color:** Teal (#14B8A6)

### Path 3: Professional Tournament Analysis
- **Persona:** Professional analyst (Morgan)
- **Goal:** Deep statistical analysis, export data
- **Tier:** Professional (complex, high density)
- **Primary HUB:** SATOR (advanced analytics)
- **Color:** Teal (#14B8A6)

---

## Key Principles

1. **HUB Isolation:** Components don't import across HUBs
2. **Design Tokens:** No hardcoded colors
3. **Progressive Disclosure:** Three tiers of complexity
4. **Cross-Game Unification:** Same patterns for Valorant/CS2

---

## Testing This System

This is a **proof-of-concept** for token-efficient prompting.

**DO NOT** modify the main repository based on these outputs without:
1. Eli's approval
2. Integration with existing codebase
3. Validation against Master Plan

---

## Metrics

| Metric | Traditional Prompt | File-Based | Savings |
|--------|-------------------|------------|---------|
| Prompt size | ~3000 lines | ~400 lines | 87% |
| Context size | Inline | ~800 lines | N/A |
| Total tokens | ~15,000 | ~6,000 | 60% |
| Reusability | None | High | N/A |

---

*Created: 2026-03-31*  
*Status: Proof-of-concept for agent prompt optimization*
