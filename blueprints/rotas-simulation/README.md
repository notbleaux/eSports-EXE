# ROTAS Simulation Engine Blueprint
## Repository: rotas-simulation-engine

### Scope
Godot 4 simulation engine, headless builds, npm distribution.

### Structure
```
rotas-simulation-engine/
├── src/                     # Godot source
├── bindings/
│   └── javascript/          # npm package wrapper
├── godot-project/           # Headless export config
├── tests/
│   ├── unit/               # GUT tests
│   └── benchmark/          # VCT validation
└── package.json            # npm: @njz/rotas-simulation
```

### Outputs
- npm package: `@njz/rotas-simulation`
- Docker image: `njz/rotas-sim:latest`
- WebAssembly build for web

### API
```typescript
interface SimulationAPI {
  simulate(config: MatchConfig): Promise<SimulationResult>;
  validateDeterminism(config: MatchConfig, runs: number): Promise<boolean>;
}
```
