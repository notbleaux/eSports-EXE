//! Rust Simulation Core for Tactical FPS eSports
//! 
//! This crate provides a high-performance, deterministic simulation engine
//! for tactical FPS games like Valorant and Counter-Strike.
//!
//! # Features
//! - Deterministic RNG for reproducible results
//! - Zero-allocation combat resolution
//! - SIMD-optimized math operations
//! - WASM support for browser deployment
//!
//! # Example
//! ```
//! use simulation_rust::combat::{DuelEngine, DuelInput, DuelResult};
//! use simulation_rust::math::DeterministicRng;
//!
//! let mut rng = DeterministicRng::new(12345);
//! let mut engine = DuelEngine::new(&mut rng);
//! // ... use engine
//! ```

#![cfg_attr(not(feature = "std"), no_std)]
#![warn(missing_docs)]

pub mod agent;
pub mod combat;
pub mod defs;
pub mod economy;
pub mod math;
pub mod sim;

#[cfg(feature = "wasm")]
mod wasm_bindings;

#[cfg(feature = "wasm")]
pub use wasm_bindings::WasmSimulation;

// Re-export commonly used types
pub use combat::{DuelEngine, DuelInput, DuelResult, HitModel};
pub use defs::{AgentDef, MatchConfig, RulesetDef, TraitBlock, Vec2, WeaponDef};
pub use economy::EconomySystem;
pub use math::DeterministicRng;
pub use sim::{AgentState, MatchSimulator, SimState, UtilityState, WeaponState};
