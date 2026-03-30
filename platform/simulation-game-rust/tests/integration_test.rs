//! Integration tests for the simulation core

use simulation_rust::{
    combat::{AgentRuntime, Damage, DuelEngine, DuelInput, HitModel, HitZone},
    defs::{
        AgentDef, DamageProfile, FireMode, MatchConfig, RecoilProfile, RulesetDef,
        SpreadProfile, TraitBlock, UtilityDef, UtilityFamily, Vec2, WeaponDef,
    },
    economy::EconomySystem,
    math::DeterministicRng,
    sim::{AgentState, MatchSimulator, MatchState, SimState, StatusState, TeamEconomyState, WeaponState},
};

#[test]
fn test_deterministic_duel() {
    // Run same duel twice with same seed, expect identical results
    let weapon = create_test_weapon();
    let traits = create_test_traits();
    let engine = DuelEngine::new().with_samples(128);

    let run_duel = |seed: u64| {
        let mut rng = DeterministicRng::new(seed);
        let shooter = AgentRuntime::new(traits, weapon.clone());
        let target = AgentRuntime::new(traits, weapon.clone());
        let input = DuelInput::new(&shooter, &target)
            .with_distance(15.0)
            .with_exposure(1.0);
        engine.resolve(&mut rng, &input)
    };

    let result1 = run_duel(12345);
    let result2 = run_duel(12345);

    assert_eq!(result1.target_killed, result2.target_killed);
    assert!((result1.time_to_kill - result2.time_to_kill).abs() < 0.001);
    assert_eq!(result1.shots_fired, result2.shots_fired);
    assert_eq!(result1.hits, result2.hits);
}

#[test]
fn test_different_seeds_different_results() {
    // Different seeds should produce different results (with high probability)
    let weapon = create_test_weapon();
    let traits = create_test_traits();
    let engine = DuelEngine::new().with_samples(128);

    let run_duel = |seed: u64| {
        let mut rng = DeterministicRng::new(seed);
        let shooter = AgentRuntime::new(traits, weapon.clone());
        let target = AgentRuntime::new(traits, weapon.clone());
        let input = DuelInput::new(&shooter, &target)
            .with_distance(15.0)
            .with_exposure(1.0);
        engine.resolve(&mut rng, &input)
    };

    let result1 = run_duel(12345);
    let result2 = run_duel(54321);

    // Results should be different (though not guaranteed for every metric)
    // At minimum, TTK should differ
    assert_ne!(result1.time_to_kill, result2.time_to_kill);
}

#[test]
fn test_damage_application() {
    let mut hp = 100.0;
    let mut armor = 50.0;

    // Apply 35 damage with armor
    Damage::apply(&mut hp, &mut armor, 35.0);

    // Armor absorbs 35%
    let expected_hp_damage = 35.0 * 0.65;
    let expected_armor_damage = 35.0 * 0.35;

    assert!((hp - (100.0 - expected_hp_damage)).abs() < 0.01);
    assert!((armor - (50.0 - expected_armor_damage)).abs() < 0.01);
}

#[test]
fn test_hit_model_factors() {
    let weapon = create_test_weapon();
    let traits = create_test_traits();

    // Base sigma
    let sigma_base = HitModel::compute_sigma(&weapon, 0.0, false, 0.0, 0.0, &traits);

    // Crouching should reduce sigma
    let sigma_crouch = HitModel::compute_sigma(&weapon, 0.0, true, 0.0, 0.0, &traits);
    assert!(sigma_crouch < sigma_base);

    // Movement should increase sigma
    let sigma_move = HitModel::compute_sigma(&weapon, 5.0, false, 0.0, 0.0, &traits);
    assert!(sigma_move > sigma_base);

    // Recoil should increase sigma
    let sigma_recoil = HitModel::compute_sigma(&weapon, 0.0, false, 1.0, 0.0, &traits);
    assert!(sigma_recoil > sigma_base);
}

#[test]
fn test_match_state_transitions() {
    let mut state = MatchState::new();

    assert!(state.winner().is_none());
    assert_eq!(state.round_index, 0);

    // Record some rounds
    state.record_round(simulation_rust::defs::TeamSide::Attack);
    assert_eq!(state.attack.score, 1);
    assert_eq!(state.defend.loss_streak, 1);
    assert_eq!(state.round_index, 1);

    // Win 12 more rounds for attack
    for _ in 0..12 {
        state.record_round(simulation_rust::defs::TeamSide::Attack);
    }

    assert_eq!(state.winner(), Some(simulation_rust::defs::TeamSide::Attack));
    assert_eq!(state.attack.score, 13);
}

#[test]
fn test_economy_buy_logic() {
    use simulation_rust::defs::{CastType, EffectSpec, EffectKind};
    use std::collections::HashMap;

    let rules = RulesetDef {
        id: "test".to_string(),
        utility_family: UtilityFamily::CsGrenade,
        max_grenades: 4,
        uses_ability_economy: false,
        round_start_credits: 1000,
        max_credits: 9000,
        round_win_credits: 3000,
        round_loss_credits: 1900,
        kill_credits: 200,
        loss_streak_bonuses: vec![0, 500, 500, 500],
        reset_hp_each_round: true,
        reset_armor_each_round: true,
        refill_signature_each_round: true,
        default_signature_round_start_charges: 1,
    };

    let agent_def = AgentDef {
        id: "test".to_string(),
        display_name: "Test".to_string(),
        base_hp: 100.0,
        base_armor: 0.0,
        traits: TraitBlock::default(),
        loadout_weapon_ids: vec!["rifle".to_string()],
        loadout_utility_ids: vec!["smoke".to_string()],
    };

    let mut utilities = HashMap::new();
    utilities.insert(
        "smoke".to_string(),
        UtilityDef {
            id: "smoke".to_string(),
            family: UtilityFamily::CsGrenade,
            cast_type: CastType::ThrowArc,
            equip_time: 0.5,
            cast_time: 0.3,
            max_charges: 1,
            cooldown: 0.0,
            credit_cost: 300,
            is_signature: false,
            round_start_charges: 0,
            throw: None,
            projectile: None,
            effects: vec![EffectSpec {
                kind: EffectKind::Smoke,
                duration: 18.0,
                radius: 5.0,
                dps_or_value: 0.0,
                falloff: 0.0,
                requires_los: false,
                requires_facing: false,
                facing_angle_deg: 0.0,
            }],
        },
    );

    let weapons = create_test_weapons();
    let mut agent = AgentState::from_def(1, &agent_def, simulation_rust::defs::TeamSide::Attack);
    agent.credits = 1000;

    // Initialize
    EconomySystem::initialize_agent(&mut agent, &agent_def, &rules, &weapons, &utilities);
    assert_eq!(agent.credits, 1000);

    // Round start - should buy utilities
    EconomySystem::round_start(&mut agent, &agent_def, &rules, &weapons, &utilities);
    
    // Should have bought at least one smoke if credits allow
    let smoke = agent.utilities.get("smoke");
    if agent.credits >= 300 {
        assert!(smoke.map(|s| s.charges).unwrap_or(0) > 0);
    }
}

#[test]
fn test_status_effects_tick() {
    let mut status = StatusState::default();

    // Apply flash
    status.flash_timer = 2.0;
    assert!(status.is_flashed());

    // Tick 1 second
    status.tick(1.0);
    assert!(status.is_flashed());
    assert!(status.flash_timer > 0.0);

    // Tick remaining
    status.tick(1.5);
    assert!(!status.is_flashed());
    assert_eq!(status.flash_timer, 0.0);
}

#[test]
fn test_weapon_state_tick() {
    let mut weapon = WeaponState::new("rifle", 30);
    weapon.fire_cooldown = 1.0;
    weapon.recoil = 1.0;

    weapon.tick(0.5, 2.0);

    assert_eq!(weapon.fire_cooldown, 0.5);
    assert_eq!(weapon.recoil, 0.0); // Recovered fully
}

#[test]
fn test_sim_state_agent_management() {
    let mut state = SimState::new();

    let def = AgentDef {
        id: "test".to_string(),
        display_name: "Test".to_string(),
        base_hp: 100.0,
        base_armor: 50.0,
        traits: TraitBlock::default(),
        loadout_weapon_ids: vec![],
        loadout_utility_ids: vec![],
    };

    let agent1 = AgentState::from_def(1, &def, simulation_rust::defs::TeamSide::Attack);
    let agent2 = AgentState::from_def(2, &def, simulation_rust::defs::TeamSide::Defend);

    state.add_agent(agent1);
    state.add_agent(agent2);

    assert_eq!(state.agents.len(), 2);
    assert!(state.get_agent(1).is_some());
    assert!(state.get_agent(2).is_some());
    assert!(state.get_agent(3).is_none());

    // Check team counts
    assert_eq!(state.living_count(simulation_rust::defs::TeamSide::Attack), 1);
    assert_eq!(state.living_count(simulation_rust::defs::TeamSide::Defend), 1);
}

#[test]
fn test_vec2_operations() {
    let v1 = Vec2::new(3.0, 4.0);
    let v2 = Vec2::new(1.0, 2.0);

    // Length
    assert!((v1.length() - 5.0).abs() < 0.001);

    // Addition
    let v3 = v1 + v2;
    assert_eq!(v3.x, 4.0);
    assert_eq!(v3.y, 6.0);

    // Distance
    let dist = v1.distance_to(&v2);
    assert!((dist - 2.828).abs() < 0.01);
}

// Test helpers

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

fn create_test_weapons() -> std::collections::HashMap<String, WeaponDef> {
    let mut weapons = std::collections::HashMap::new();
    weapons.insert("rifle".to_string(), create_test_weapon());
    weapons
}
