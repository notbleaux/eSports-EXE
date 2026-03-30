//! WebAssembly bindings for browser integration
//!
//! Enables running the simulation core directly in the browser
//! with near-native performance.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

use crate::{
    combat::{AgentRuntime, DuelEngine, DuelInput},
    math::DeterministicRng,
    sim::MatchSimulator,
};

/// WASM-accessible match result
#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct WasmMatchResult {
    winner: Option<String>,
    attack_score: i32,
    defend_score: i32,
    total_rounds: i32,
    total_time: f32,
}

#[wasm_bindgen]
impl WasmMatchResult {
    #[wasm_bindgen(getter)]
    pub fn winner(&self) -> Option<String> {
        self.winner.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn attack_score(&self) -> i32 {
        self.attack_score
    }

    #[wasm_bindgen(getter)]
    pub fn defend_score(&self) -> i32 {
        self.defend_score
    }

    #[wasm_bindgen(getter)]
    pub fn total_rounds(&self) -> i32 {
        self.total_rounds
    }

    #[wasm_bindgen(getter)]
    pub fn total_time(&self) -> f32 {
        self.total_time
    }
}

/// WASM-accessible duel result
#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct WasmDuelResult {
    target_killed: bool,
    time_to_kill: f32,
    shots_fired: i32,
    hits: i32,
    win_prob_hint: f32,
}

#[wasm_bindgen]
impl WasmDuelResult {
    #[wasm_bindgen(getter)]
    pub fn target_killed(&self) -> bool {
        self.target_killed
    }

    #[wasm_bindgen(getter)]
    pub fn time_to_kill(&self) -> f32 {
        self.time_to_kill
    }

    #[wasm_bindgen(getter)]
    pub fn shots_fired(&self) -> i32 {
        self.shots_fired
    }

    #[wasm_bindgen(getter)]
    pub fn hits(&self) -> i32 {
        self.hits
    }

    #[wasm_bindgen(getter)]
    pub fn win_prob_hint(&self) -> f32 {
        self.win_prob_hint
    }
}

/// Main WASM simulation interface
#[wasm_bindgen]
pub struct WasmSimulation {
    duel_engine: DuelEngine,
}

#[wasm_bindgen]
impl WasmSimulation {
    /// Creates a new simulation instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            duel_engine: DuelEngine::new(),
        }
    }

    /// Runs a full match simulation
    ///
    /// # Arguments
    /// * `config_json` - JSON string containing MatchConfig
    ///
    /// # Returns
    /// Match result object
    pub fn run_match(&mut self, config_json: &str) -> Result<WasmMatchResult, JsValue> {
        let config: crate::defs::MatchConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid config: {}", e)))?;

        let mut simulator = MatchSimulator::new(config);
        let result = simulator.run_match();

        Ok(WasmMatchResult {
            winner: result.winner.map(|s| format!("{:?}", s)),
            attack_score: result.attack_score,
            defend_score: result.defend_score,
            total_rounds: result.total_rounds,
            total_time: result.total_time,
        })
    }

    /// Resolves a duel between two agents
    ///
    /// # Arguments
    /// * `seed` - Random seed for deterministic results
    /// * `shooter_json` - JSON string containing shooter AgentRuntime data
    /// * `target_json` - JSON string containing target AgentRuntime data
    /// * `distance` - Distance between agents
    /// * `exposure` - Target exposure fraction (0-1)
    ///
    /// # Returns
    /// Duel result object
    pub fn resolve_duel(
        &mut self,
        seed: u64,
        shooter_json: &str,
        target_json: &str,
        distance: f32,
        exposure: f32,
    ) -> Result<WasmDuelResult, JsValue> {
        let shooter: AgentRuntime = serde_json::from_str(shooter_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid shooter: {}", e)))?;
        
        let target: AgentRuntime = serde_json::from_str(target_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid target: {}", e)))?;

        let mut rng = DeterministicRng::new(seed);
        
        let input = DuelInput::new(&shooter, &target)
            .with_distance(distance)
            .with_exposure(exposure);

        let result = self.duel_engine.resolve(&mut rng, &input);

        Ok(WasmDuelResult {
            target_killed: result.target_killed,
            time_to_kill: result.time_to_kill,
            shots_fired: result.shots_fired,
            hits: result.hits,
            win_prob_hint: result.win_prob_hint,
        })
    }

    /// Gets version information
    #[wasm_bindgen(js_name = getVersion)]
    pub fn get_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    /// Runs a stress test and returns performance metrics
    #[wasm_bindgen(js_name = runStressTest)]
    pub fn run_stress_test(&mut self, iterations: usize) -> String {
        use crate::defs::{DamageProfile, FireMode, RecoilProfile, SpreadProfile, TraitBlock, WeaponDef};

        let weapon = WeaponDef {
            id: "test_rifle".to_string(),
            fire_mode: FireMode::Auto,
            credit_cost: 2900,
            magazine_size: 30,
            rounds_per_minute: 600.0,
            reload_time: 2.5,
            damage: DamageProfile {
                base_damage: 35.0,
                head_mult: 4.0,
                leg_mult: 0.75,
                range_multiplier: crate::defs::Curve::default(),
            },
            spread: SpreadProfile {
                base_sigma: 0.005,
                crouch_mult: 0.85,
                move_sigma_add: 0.002,
                jump_sigma_add: 0.01,
                first_shot_bonus: -0.001,
            },
            recoil: RecoilProfile {
                recoil_per_shot: 0.15,
                max_recoil: 2.0,
                recovery_per_sec: 3.0,
            },
            penetration: crate::defs::PenetrationProfile::default(),
        };

        let traits = TraitBlock {
            aim: 0.7,
            recoil_control: 0.6,
            reaction: 0.75,
            movement: 0.8,
            game_sense: 0.65,
            composure: 0.7,
            teamwork: 0.8,
            utility: 0.6,
            discipline: 0.75,
            aggression: 0.5,
        };

        let start = js_sys::Date::now();
        
        let mut kills = 0;
        let mut total_ttk = 0.0;

        for i in 0..iterations {
            let mut rng = DeterministicRng::new(i as u64);
            
            let shooter = AgentRuntime::new(traits, weapon.clone());
            let target = AgentRuntime::new(traits, weapon.clone());
            
            let input = DuelInput::new(&shooter, &target)
                .with_distance(15.0)
                .with_exposure(1.0);
            
            let result = self.duel_engine.resolve(&mut rng, &input);
            
            if result.target_killed {
                kills += 1;
                total_ttk += result.time_to_kill;
            }
        }

        let elapsed = js_sys::Date::now() - start;
        let avg_ns = (elapsed * 1_000_000.0) / iterations as f64;

        format!(
            r#"{{"iterations":{},"elapsed_ms":{:.2},"avg_ns":{:.2},"kills":{},"avg_ttk":{:.3}}}"#,
            iterations,
            elapsed,
            avg_ns,
            kills,
            if kills > 0 { total_ttk / kills as f32 } else { 0.0 }
        )
    }
}

impl Default for WasmSimulation {
    fn default() -> Self {
        Self::new()
    }
}

/// Initialize panic hook for better error messages
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}
