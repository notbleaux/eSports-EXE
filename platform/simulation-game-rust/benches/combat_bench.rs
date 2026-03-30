//! Combat benchmark suite
//!
//! Measures performance of duel resolution and damage calculations.

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use simulation_rust::{
    combat::{AgentRuntime, Damage, DuelEngine, DuelInput, HitModel},
    defs::{DamageProfile, FireMode, HitZone, RecoilProfile, SpreadProfile, TraitBlock, WeaponDef},
    math::DeterministicRng,
};

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

fn bench_damage_apply(c: &mut Criterion) {
    c.bench_function("damage_apply", |b| {
        b.iter(|| {
            let mut hp = black_box(100.0);
            let mut armor = black_box(50.0);
            Damage::apply(&mut hp, &mut armor, black_box(35.0));
        });
    });
}

fn bench_hitmodel_compute_sigma(c: &mut Criterion) {
    let weapon = create_test_weapon();
    let traits = create_test_traits();

    c.bench_function("hitmodel_compute_sigma", |b| {
        b.iter(|| {
            let sigma = HitModel::compute_sigma(
                black_box(&weapon),
                black_box(0.0),
                black_box(false),
                black_box(0.0),
                black_box(0.0),
                black_box(&traits),
            );
            black_box(sigma);
        });
    });
}

fn bench_duel_resolution(c: &mut Criterion) {
    let mut group = c.benchmark_group("duel_resolution");

    for samples in [32, 64, 128, 256].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(samples), samples, |b, &samples| {
            let weapon = create_test_weapon();
            let traits = create_test_traits();
            let engine = DuelEngine::new().with_samples(samples);

            b.iter(|| {
                let mut rng = DeterministicRng::new(12345);
                
                let shooter = AgentRuntime::new(traits, weapon.clone());
                let target = AgentRuntime::new(traits, weapon.clone());
                
                let input = DuelInput::new(&shooter, &target)
                    .with_distance(15.0)
                    .with_exposure(1.0);
                
                let result = engine.resolve(&mut rng, &input);
                black_box(result);
            });
        });
    }

    group.finish();
}

fn bench_duel_resolution_distances(c: &mut Criterion) {
    let mut group = c.benchmark_group("duel_resolution_distances");

    for distance in [5.0, 15.0, 30.0, 50.0].iter() {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}m", distance)),
            distance,
            |b, &distance| {
                let weapon = create_test_weapon();
                let traits = create_test_traits();
                let engine = DuelEngine::new().with_samples(128);

                b.iter(|| {
                    let mut rng = DeterministicRng::new(12345);
                    
                    let shooter = AgentRuntime::new(traits, weapon.clone());
                    let target = AgentRuntime::new(traits, weapon.clone());
                    
                    let input = DuelInput::new(&shooter, &target)
                        .with_distance(distance)
                        .with_exposure(1.0);
                    
                    let result = engine.resolve(&mut rng, &input);
                    black_box(result);
                });
            },
        );
    }

    group.finish();
}

fn bench_rng(c: &mut Criterion) {
    let mut group = c.benchmark_group("rng");

    group.bench_function("next_u64", |b| {
        let mut rng = DeterministicRng::new(12345);
        b.iter(|| {
            black_box(rng.next_u64());
        });
    });

    group.bench_function("next_f32", |b| {
        let mut rng = DeterministicRng::new(12345);
        b.iter(|| {
            black_box(rng.next_f32());
        });
    });

    group.bench_function("next_normal", |b| {
        let mut rng = DeterministicRng::new(12345);
        b.iter(|| {
            black_box(rng.next_normal(0.0, 1.0));
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_damage_apply,
    bench_hitmodel_compute_sigma,
    bench_duel_resolution,
    bench_duel_resolution_distances,
    bench_rng
);
criterion_main!(benches);
