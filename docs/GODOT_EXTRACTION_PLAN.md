[Ver001.000] [Part: 1/1, Phase: 1/2, Progress: 50%, Status: On-Going]

# Godot Simulation Extraction Plan
## Moving ROTAS Engine to Separate Repository

---

## Executive Summary

**Objective:** Extract the Godot simulation engine from the monorepo into a standalone repository with npm package distribution.

**Rationale:**
- Decouple simulation development from web platform
- Enable independent versioning and releases
- Reduce monorepo complexity
- Allow external contributions to simulation

**Timeline:** 2 weeks

---

## Current State

```
platform/simulation-game/
├── addons/
│   └── gut/                    # Testing framework
├── Defs/
│   └── agents/                 # Agent definitions
├── entities/                   # Game entities
├── maps/                       # Map data
├── scenes/                     # Godot scenes
├── scripts/                    # GDScript code
├── tactical-fps-sim-core/      # Core simulation
├── tests/                      # GUT tests
├── project.godot               # Godot project file
└── INTEGRATION_UPDATE.md       # Integration notes
```

**Size:** ~50MB (without build artifacts)

---

## Target Architecture

### New Repository Structure

```
rotas-simulation-engine/
├── src/                        # Source code
│   ├── core/                   # Deterministic simulation core
│   ├── entities/               # Player, Team, Match entities
│   ├── systems/                # Combat, Economy, Clutch systems
│   ├── maps/                   # Map data and configurations
│   └── utils/                  # Utility functions
│
├── tests/                      # Test suite
│   ├── unit/                   # GUT unit tests
│   ├── integration/            # Integration tests
│   └── benchmark/              # VCT benchmark tests
│
├── bindings/                   # Language bindings
│   ├── javascript/             # npm package source
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── index.d.ts
│   └── python/                 # Python bindings (future)
│
├── docs/                       # Documentation
├── godot-project/              # Standalone Godot project
├── package.json                # npm package manifest
├── tsconfig.json               # TypeScript config
└── README.md
```

---

## Implementation Phases

### Phase 1: Preparation (Week 1, Days 1-3)

#### 1.1 Create New Repository

```bash
# Create new repository on GitHub
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/orgs/njzitegeist/repos \
  -d '{"name":"rotas-simulation-engine","private":false}'

# Clone and setup
git clone https://github.com/njzitegeist/rotas-simulation-engine.git
cd rotas-simulation-engine
```

#### 1.2 Extract Core Simulation

```bash
# Copy simulation code from monorepo
cp -r ../eSports-EXE/platform/simulation-game/src ./
cp -r ../eSports-EXE/platform/simulation-game/tests ./
cp -r ../eSports-EXE/platform/simulation-game/project.godot ./godot-project/

# Initialize new Git repo
git init
git add .
git commit -m "Initial extraction from eSports-EXE monorepo"
git push origin main
```

#### 1.3 Create npm Package Structure

```json
// package.json
{
  "name": "@njz/rotas-simulation",
  "version": "0.1.0",
  "description": "ROTAS deterministic esports simulation engine",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/",
    "godot-project/"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "godot-js": "^4.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/njzitegeist/rotas-simulation-engine.git"
  },
  "license": "MIT"
}
```

### Phase 2: JavaScript Bindings (Week 1, Days 4-5)

#### 2.1 Create WebAssembly Build

```bash
# Install Godot WebAssembly export templates
# Export simulation as WebAssembly module

cd godot-project
godot --headless --export-release "Web" ../bindings/javascript/dist/rotas.wasm
```

#### 2.2 Create JavaScript Wrapper

```typescript
// bindings/javascript/src/index.ts
export interface SimulationConfig {
  teamA: Team;
  teamB: Team;
  map: string;
  seed: number;
}

export interface SimulationResult {
  winner: string;
  score: string;
  rounds: Round[];
  confidence: number;
}

export class RotasSimulation {
  private wasm: WebAssembly.Module;
  
  constructor(wasmPath: string) {
    // Initialize WebAssembly module
  }
  
  async simulate(config: SimulationConfig): Promise<SimulationResult> {
    // Call WASM simulation
  }
  
  async validateDeterminism(
    config: SimulationConfig, 
    runs: number = 100
  ): Promise<boolean> {
    // Verify same seed produces same results
  }
}

export default RotasSimulation;
```

#### 2.3 Build and Test Package

```bash
cd bindings/javascript
npm install
npm run build
npm test
npm pack  # Create tarball for testing
```

### Phase 3: Monorepo Integration (Week 2, Days 1-3)

#### 3.1 Add npm Dependency

```json
// apps/web/package.json
{
  "dependencies": {
    "@njz/rotas-simulation": "^0.1.0"
  }
}
```

```bash
cd apps/web
pnpm add @njz/rotas-simulation
```

#### 3.2 Create API Wrapper

```typescript
// packages/shared/api/src/rotas/simulation_client.ts
import { RotasSimulation } from '@njz/rotas-simulation';

export class SimulationClient {
  private engine: RotasSimulation;
  
  constructor() {
    this.engine = new RotasSimulation(
      process.env.ROTAS_WASM_PATH || './rotas.wasm'
    );
  }
  
  async runSimulation(config: SimulationConfig): Promise<SimulationResult> {
    return this.engine.simulate(config);
  }
}
```

#### 3.3 Update API Endpoints

```python
# packages/shared/api/src/rotas/routes.py
from fastapi import APIRouter, HTTPException
from .simulation_client import SimulationClient

router = APIRouter(prefix="/v1/rotas")

@router.post("/simulate")
async def simulate_match(config: SimulationConfig):
    """Run ROTAS simulation for match prediction."""
    try:
        client = SimulationClient()
        result = await client.run_simulation(config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Phase 4: Cleanup (Week 2, Days 4-5)

#### 4.1 Remove Old Simulation Code

```bash
# In monorepo
cd eSports-EXE

# Archive old simulation
git mv platform/simulation-game archive/platform/simulation-game

# Or remove entirely (after verification)
# git rm -r platform/simulation-game
```

#### 4.2 Update Documentation

```markdown
## Simulation Engine

The ROTAS simulation engine has been moved to a separate repository:

**Repository:** https://github.com/njzitegeist/rotas-simulation-engine

**npm Package:** `@njz/rotas-simulation`

**Documentation:** https://github.com/njzitegeist/rotas-simulation-engine/docs
```

#### 4.3 Verify Integration

```bash
# Test full integration
pnpm install
pnpm run build
pnpm run test

# Deploy to staging
vercel --prod
```

---

## API Contract

### Simulation Request

```typescript
interface SimulationRequest {
  match_id?: string;
  team_a: {
    name: string;
    players: Player[];
    economy: number;
  };
  team_b: {
    name: string;
    players: Player[];
    economy: number;
  };
  map: 'Haven' | 'Bind' | 'Split' | 'Ascent' | 'Icebox' | 'Breeze' | 'Fracture' | 'Pearl' | 'Lotus' | 'Sunset';
  options?: {
    seed?: number;
    iterations?: number;
    include_round_details?: boolean;
  };
}

interface Player {
  name: string;
  role: 'duelist' | 'initiator' | 'controller' | 'sentinel';
  stats: {
    combat_score: number;
    kda_ratio: number;
    headshot_pct: number;
    clutch_success: number;
  };
}
```

### Simulation Response

```typescript
interface SimulationResponse {
  match_id: string;
  predicted_winner: string;
  confidence: number;  // 0-1
  predicted_score: {
    team_a: number;
    team_b: number;
  };
  round_predictions: RoundPrediction[];
  metadata: {
    simulation_time_ms: number;
    iterations_run: number;
    seed: number;
    version: string;
  };
}

interface RoundPrediction {
  round_number: number;
  predicted_winner: string;
  win_probability: number;
  expected_economy: {
    team_a: number;
    team_b: number;
  };
}
```

---

## Versioning Strategy

### Independent Versioning

- **Simulation Engine:** Semantic versioning (major.minor.patch)
- **npm Package:** Matches simulation engine version
- **API Contract:** Versioned separately

### Breaking Changes

| Component | Breaking Change | Version Bump |
|-----------|----------------|--------------|
| Engine | Simulation algorithm change | Major (1.0.0 → 2.0.0) |
| Engine | New features, same results | Minor (1.0.0 → 1.1.0) |
| Engine | Bug fixes | Patch (1.0.0 → 1.0.1) |
| npm Package | API change | Major |
| npm Package | New methods | Minor |

---

## CI/CD Pipeline

### Simulation Repository

```yaml
# .github/workflows/release.yml
name: Release Simulation Engine

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Godot
        uses: chickensoft-games/setup-godot@v1
        with:
          version: 4.2.1
      
      - name: Build WebAssembly
        run: |
          cd godot-project
          godot --headless --export-release "Web" ../dist/rotas.wasm
      
      - name: Build npm package
        run: |
          cd bindings/javascript
          npm ci
          npm run build
          npm pack
      
      - name: Publish to npm
        run: |
          cd bindings/javascript
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/rotas.wasm
            bindings/javascript/*.tgz
```

---

## Rollback Plan

If extraction fails:

1. **Revert npm dependency** in monorepo
2. **Restore simulation code** from archive
3. **Update documentation** to reflect monorepo structure
4. **Post-mortem** to identify issues

---

## Success Criteria

- [ ] New repository created with all simulation code
- [ ] npm package published and installable
- [ ] Web platform successfully uses npm package
- [ ] API endpoints functional
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Old code archived/removed from monorepo

---

*Plan Version: 001.000*  
*Target Completion: 2 weeks from start*
