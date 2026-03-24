[Ver001.000]

# WAVE 1.1 — AGENT 1-A TASK: Help Content Schema & Localization
**Priority:** P0  
**Estimated:** 8 hours  
**Due:** +24 hours from claim  
**Stream:** Unified Help System

---

## ASSIGNMENT

Design the single source of truth schema for ALL help content across web and game platforms.

### Source Material (from extracted branch)

**Original:** Basic tips array in HelpManager.gd:
```gdscript
var tips = [
    'Hint: Press Space to play/pause simulation',
    'NJZ Cog toggles SFX (top right)',
    // ...
]
```

**Problem:** Hardcoded, no localization, no context, no progressive disclosure.

---

## DELIVERABLES

### 1. JSON Schema Definition (help_content.schema.json)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://4njz4.io/schemas/help_content.json",
  "title": "4NJZ4 Help Content",
  "type": "object",
  "required": ["id", "version", "platforms", "levels", "i18n"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9_]+$" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "platforms": {
      "type": "object",
      "properties": {
        "web": { "$ref": "#/definitions/WebConfig" },
        "game": { "$ref": "#/definitions/GameConfig" },
        "mobile": { "$ref": "#/definitions/MobileConfig" }
      }
    },
    "levels": {
      "type": "object",
      "properties": {
        "beginner": { "$ref": "#/definitions/HelpLevel" },
        "intermediate": { "$ref": "#/definitions/HelpLevel" },
        "advanced": { "$ref": "#/definitions/HelpLevel" }
      },
      "required": ["beginner", "intermediate", "advanced"]
    },
    "triggers": {
      "type": "array",
      "items": { "$ref": "#/definitions/HelpTrigger" }
    },
    "i18n": {
      "type": "object",
      "patternProperties": {
        "^[a-z]{2}(-[A-Z]{2})?$": { "$ref": "#/definitions/LocalizedContent" }
      }
    }
  },
  "definitions": {
    "HelpLevel": {
      "type": "object",
      "properties": {
        "summary": { "type": "string", "maxLength": 150 },
        "detail": { "type": "string", "maxLength": 500 },
        "interactive": { "type": "string" },
        "video": { "type": "string", "format": "uri" },
        "shortcut": { "type": "string" }
      },
      "required": ["summary", "detail"]
    },
    "HelpTrigger": {
      "type": "object",
      "properties": {
        "type": {
          "enum": ["first_visit", "error_count", "time_spent", "action_stuck", "manual"]
        },
        "threshold": { "type": "number" },
        "cooldown": { "type": "number" },
        "priority": { "type": "integer", "minimum": 1, "maximum": 5 }
      }
    }
  }
}
```

### 2. TypeScript Type Definitions (helpContent.ts)

```typescript
// Mirror of JSON schema for type safety
export interface HelpContent {
  id: string;
  version: string;
  platforms: PlatformConfigs;
  levels: HelpLevels;
  triggers: HelpTrigger[];
  i18n: Record<Locale, LocalizedContent>;
  metrics?: HelpMetrics;
}

export type Locale = 
  | 'en' | 'en-US' | 'en-GB'
  | 'ko' | 'ja' | 'zh-CN' | 'zh-TW'
  | 'es' | 'fr' | 'de' | 'pt-BR';

// ... full type definitions
```

### 3. Sample Content File (help/getting_started.json)

Create 5 example help topics:
1. `getting_started` — First visit to platform
2. `simulation_controls` — Godot simulation basics
3. `analytics_dashboard` — Reading player stats
4. `sator_rating` — Understanding SimRating
5. `replay_analysis` — Using replay viewer

Each with:
- All 3 levels (beginner/intermediate/advanced)
- 3 languages minimum (en, ko, es)
- Platform-specific adaptations
- 2+ triggers each

### 4. Validation Script (validateHelpContent.ts)

```typescript
#!/usr/bin/env tsx
import { validate } from 'jsonschema';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const schema = JSON.parse(await readFile('help_content.schema.json', 'utf-8'));

async function validateAll(): Promise<{ valid: number; invalid: number; errors: string[] }> {
  // Implementation
}

const result = await validateAll();
process.exit(result.invalid > 0 ? 1 : 0);
```

### 5. Localization Workflow Guide (LOCALIZATION.md)

Document:
- How to add new languages
- Translation file format (xliff vs json)
- Community contribution process
- Automated validation

---

## FOREMAN REVIEW CHECKLIST

Submit to `.job-board/02_CLAIMED/{agent-id}/SUBMISSION_1A.md`

- [ ] Schema validates against JSON Schema Draft 07
- [ ] TypeScript types are complete and strict
- [ ] 5 sample topics cover diverse use cases
- [ ] All 3 levels have distinct, appropriate content
- [ ] At least 3 languages implemented
- [ ] Validation script runs and passes
- [ ] Localization workflow is clear and executable

---

## INTEGRATION NOTES

**Used by:**
- Agent 1-B: Context Detection Engine (needs schema)
- Agent 1-C: Knowledge Graph (indexes this content)
- Agent 2-A: HelpOverlay (renders this content)
- Agent 3-A: HelpManager.gd (parses this content)

**File Locations:**
- Schema: `packages/shared/schemas/help_content.schema.json`
- Types: `packages/shared/types/helpContent.ts`
- Content: `apps/website-v2/public/help/*.json`
- Godot mirror: `platform/simulation-game/data/help/*.json`

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
