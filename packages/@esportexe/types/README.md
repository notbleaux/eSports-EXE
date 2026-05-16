[Ver001.000]

# @njz/types

**Purpose:** Canonical TypeScript type definitions for the NJZ eSports Platform.
**Status:** Phase 0 Stub — Full implementation in Phase 1
**Package name:** @njz/types

## Contents (Phase 1)
- GameNodeID hierarchy types (from data/schemas/GameNodeID.ts)
- TENET protocol types (from data/schemas/tenet-protocol.ts)
- Live data contracts (from data/schemas/live-data.ts)
- Legacy data contracts (from data/schemas/legacy-data.ts)
- World-Port game schemas

## Usage (Phase 1+)
```typescript
import type { GameNodeID, WorldPort, TenetVerificationResult } from '@njz/types';
import type { PathALiveEvent, ConfidenceScore } from '@njz/types';
```

## See Also
- `data/schemas/` — Source schema definitions
- `.agents/SCHEMA_REGISTRY.md` — Full type registry
