# UI/UX Design Prompt for Independent IDE CLI Agent
## User Path Design & Frontend Implementation Task

---

## Your Mission

Design and implement the complete website UI and frontend webpages for the full user path of the eSports-EXE platform. This is a **token-efficient, file-context-based** task — read context files instead of long prompts.

---

## Prerequisites (READ FIRST)

Read these files **in order** before starting:

1. **Context File 1:** `../contexts/01-project-overview.md` — What we're building
2. **Context File 2:** `../contexts/02-architecture-system.md` — How it's structured  
3. **Context File 3:** `../contexts/03-design-system.md` — How it should look
4. **Context File 4:** `../contexts/04-user-personas.md` — Who we're building for
5. **Context File 5:** `../contexts/05-tech-constraints.md` — Technical boundaries

Total context: ~800 lines vs. 3000+ lines of prompt text. **Token savings: ~70%**

---

## Task Structure

You will create **3 User Path Mappings**, each with:
- User persona definition
- Entry point (where they start)
- Journey steps (pages visited, actions taken)
- Exit point (goal achieved)
- File mapping (which files implement this path)

---

## User Path Mapping Templates

### Template Location
`../mappings/user-path-template.json`

### Output Location  
Create 3 files in `../outputs/`:
- `user-path-01-[persona-name].json`
- `user-path-02-[persona-name].json`
- `user-path-03-[persona-name].json`

---

## Deliverables

### Phase 1: User Path Design (Analysis)
For each of the 3 user paths:

1. **Read** the relevant persona from context file 4
2. **Map** the journey using the template
3. **Identify** required pages and components
4. **Document** in JSON format

### Phase 2: Page Specifications (Design)
For each unique page identified across all 3 paths:

1. Create a page specification in `../outputs/pages/[page-name].md`
2. Include: layout, components, data requirements, interactions
3. Reference design tokens from context file 3

### Phase 3: Implementation Plan (Technical)
Create `../outputs/implementation-plan.md` with:

1. File creation/modification list
2. Component dependencies
3. Route definitions
4. State management approach
5. Testing strategy

---

## Constraints

1. **DO NOT** modify existing repo files — this is a design/prompt test
2. **DO NOT** create framework updates or context architecture changes
3. **ONLY** create files in `.agent-prompts/ui-design/outputs/`
4. **MUST** use design tokens from context file 3
5. **MUST** respect progressive disclosure (context file 4)

---

## Success Criteria

- [ ] 3 complete user path mappings (JSON format)
- [ ] Page specifications for all identified pages
- [ ] Implementation plan with technical details
- [ ] All design decisions reference context files
- [ ] No hardcoded colors (design tokens only)
- [ ] Progressive disclosure applied correctly

---

## Quick Reference

```
Design Tokens:
  --color-primary-bg: #0F172A (dark slate)
  --color-accent-rotas: #14B8A6 (teal)
  --color-accent-opera: #F97316 (orange)

HUB Colors:
  ROTAS/SATOR: Teal (#14B8A6)
  OPERA/AREPO: Orange (#F97316)

Progressive Disclosure:
  Casual → Aspiring Player → Professional Analyst
```

---

## Output Validation

Before finishing, verify:
```bash
# Check all outputs exist
ls -la ../outputs/*.json | wc -l  # Should be 3
ls -la ../outputs/pages/*.md | wc -l  # Should be N pages

# Check file sizes (sanity check)
find ../outputs -name "*.md" -size +50k  # Flag any huge files

# Validate JSON syntax
for f in ../outputs/*.json; do jq empty "$f" && echo "$f valid"; done
```

---

**Begin with Phase 1: Read all context files, then design User Path 1.**
