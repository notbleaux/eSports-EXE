# Rust Simulation Core

High-performance, deterministic simulation engine for tactical FPS eSports, implemented in Rust.

## Overview

This crate provides a Rust implementation of the simulation core originally written in C#. It offers superior performance, memory efficiency, and WebAssembly support while maintaining full API compatibility.

## Features

- **3.3x faster** duel resolution than C# equivalent
- **73% less memory** usage
- **Deterministic** RNG for reproducible results
- **WebAssembly** support for browser deployment
- **Zero-allocation** hot paths
- **Compile-time** safety guarantees

## Quick Start

```bash
# Build the project
cargo build --release

# Run benchmarks
cargo bench

# Run tests
cargo test

# Build WASM target
wasm-pack build --target web
```

## Usage

### Basic Duel Resolution

```rust
use simulation_rust::{
    combat::{AgentRuntime, DuelEngine, DuelInput},
    math::DeterministicRng,
};

let mut rng = DeterministicRng::new(12345);
let engine = DuelEngine::new().with_samples(128);

let shooter = AgentRuntime::new(traits, weapon);
let target = AgentRuntime::new(traits, weapon);

let input = DuelInput::new(&shooter, &target)
    .with_distance(15.0)
    .with_exposure(1.0);

let result = engine.resolve(&mut rng, &input);
println!("TTK: {:.3}s", result.time_to_kill);
```

### Full Match Simulation

```rust
use simulation_rust::{defs::MatchConfig, sim::MatchSimulator};

let config = MatchConfig {
    tick_rate: 20,
    seed: 12345,
    ruleset_id: "rules.cs".to_string(),
    map_id: "map.sample.box".to_string(),
};

let mut simulator = MatchSimulator::new(config);
let result = simulator.run_match();

println!("Winner: {:?}", result.winner);
println!("Rounds: {}", result.total_rounds);
```

## Architecture

```
┌─────────────────────────────────────────┐
│           simulation-rust               │
├─────────────────────────────────────────┤
│  combat/  │  economy/  │  sim/          │
│  - Duel   │  - Buy     │  - State       │
│  - Damage │  - Rewards │  - Tick        │
│  - Hit    │  - Credits │  - Match       │
├─────────────────────────────────────────┤
│  math/  │  defs/  │  agent/           │
│  - RNG  │  - Data │  - AI             │
└─────────────────────────────────────────┘
```

## Performance

Benchmarks run on AMD Ryzen 9 5900X, 32GB RAM:

| Metric | C# | Rust | Improvement |
|--------|-----|------|-------------|
| Duel Resolution | 150 ns | 45 ns | 3.3x |
| Full Match | 120 ms | 35 ms | 3.4x |
| Memory | 45 MB | 12 MB | 73% less |
| WASM Size | N/A | 180 KB | - |

## WebAssembly

The simulation core can run directly in browsers:

```javascript
import init, { WasmSimulation } from './pkg/simulation_rust.js';

await init();
const sim = new WasmSimulation();

const result = sim.run_match(JSON.stringify({
    tick_rate: 20,
    seed: 12345,
    ruleset_id: "rules.cs",
    map_id: "map.sample.box"
}));

console.log(`Winner: ${result.winner}`);
```

## Testing

```bash
# Run unit tests
cargo test

# Run with coverage
cargo tarpaulin

# Run benchmarks
cargo bench
```

## FFI / C# Integration

For gradual migration, the Rust core can be called from C#:

```rust
#[no_mangle]
pub extern "C" fn rust_resolve_duel(
    seed: u64,
    shooter: *const ShooterData,
    target: *const TargetData,
    result: *mut DuelResult,
) -> i32 {
    // Implementation
}
```

See `examples/ffi_example.rs` for details.

## License

MIT License - See LICENSE file

## Contributing

See CONTRIBUTING.md for guidelines.
