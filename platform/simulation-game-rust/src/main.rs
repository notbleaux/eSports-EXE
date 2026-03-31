//! Rust Simulation Core - CLI Runner
//!
//! Command-line interface for running simulations and benchmarks.

use simulation_rust::{
    combat::{AgentRuntime, DuelEngine, DuelInput},
    defs::{AgentDef, DamageProfile, FireMode, MatchConfig, RecoilProfile, SpreadProfile, TraitBlock, WeaponDef},
    math::DeterministicRng,
    sim::MatchSimulator,
};

fn main() {
    println!("╔════════════════════════════════════════════════════════════╗");
    println!("║     Rust Simulation Core - Performance Test Runner         ║");
    println!("║     NJZiteGeisTe Platform - Tactical FPS Simulation        ║");
    println!("╚════════════════════════════════════════════════════════════╝");
    println!();

    // Run duel benchmark
    benchmark_duel();
    println!();

    // Run match benchmark
    benchmark_match();
}

fn benchmark_duel() {
    println!("▶ Duel Resolution Benchmark");
    println!("  Samples: 10,000 duels");
    println!();

    let weapon = create_test_weapon();
    let traits = create_test_traits();

    let start = std::time::Instant::now();
    let mut total_shots = 0;
    let mut total_hits = 0;
    let mut total_ttk = 0.0;

    let engine = DuelEngine::new().with_samples(128);

    for i in 0..10000 {
        let mut rng = DeterministicRng::new(12345 + i as u64);
        
        let shooter = AgentRuntime::new(traits, weapon.clone());
        let target = AgentRuntime::new(traits, weapon.clone());
        
        let input = DuelInput::new(&shooter, &target)
            .with_distance(15.0)
            .with_exposure(1.0);
        
        let result = engine.resolve(&mut rng, &input);
        
        if result.target_killed {
            total_shots += result.shots_fired;
            total_hits += result.hits;
            total_ttk += result.time_to_kill;
        }
    }

    let elapsed = start.elapsed();
    let avg_ns = elapsed.as_nanos() as f64 / 10000.0;

    println!("  Results:");
    println!("    Total time:   {:.2} ms", elapsed.as_millis());
    println!("    Per duel:     {:.2} ns", avg_ns);
    println!("    Avg TTK:      {:.3} s", total_ttk / 10000.0);
    println!("    Avg shots:    {:.1}", total_shots as f32 / 10000.0);
    println!("    Avg hits:     {:.1}", total_hits as f32 / 10000.0);
}

fn benchmark_match() {
    println!("▶ Full Match Benchmark");
    println!("  Configuration: First to 13 rounds, 20 TPS");
    println!();

    let config = MatchConfig {
        tick_rate: 20,
        seed: 12345,
        ruleset_id: "rules.cs".to_string(),
        map_id: "map.sample.box".to_string(),
    };

    let start = std::time::Instant::now();
    
    let mut total_rounds = 0;
    let mut total_time = 0.0;

    for i in 0..100 {
        let config = MatchConfig {
            seed: 12345 + i as u64,
            ..config.clone()
        };
        
        let mut simulator = MatchSimulator::new(config);
        let result = simulator.run_match();
        
        total_rounds += result.total_rounds;
        total_time += result.total_time;
    }

    let elapsed = start.elapsed();
    let avg_ms = elapsed.as_millis() as f64 / 100.0;

    println!("  Results (100 matches):");
    println!("    Total time:     {:.2} ms", elapsed.as_millis());
    println!("    Per match:      {:.2} ms", avg_ms);
    println!("    Avg rounds:     {:.1}", total_rounds as f32 / 100.0);
    println!("    Avg sim time:   {:.1} s", total_time / 100.0);
}

fn create_test_weapon() -> WeaponDef {
    WeaponDef {
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
            range_multiplier: simulation_rust::defs::Curve::default(),
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
        penetration: simulation_rust::defs::PenetrationProfile::default(),
    }
}

fn create_test_traits() -> TraitBlock {
    TraitBlock {
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
    }
}
