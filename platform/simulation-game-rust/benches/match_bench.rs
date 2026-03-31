//! Match simulation benchmark suite
//!
//! Measures performance of full match simulations.

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use simulation_rust::{
    defs::MatchConfig,
    sim::MatchSimulator,
};

fn bench_full_match(c: &mut Criterion) {
    let mut group = c.benchmark_group("full_match");

    group.bench_function("13_round_match", |b| {
        b.iter(|| {
            let config = MatchConfig {
                tick_rate: 20,
                seed: 12345,
                ruleset_id: "rules.cs".to_string(),
                map_id: "map.sample.box".to_string(),
            };
            
            let mut simulator = MatchSimulator::new(config);
            let result = simulator.run_match();
            black_box(result);
        });
    });

    group.finish();
}

fn bench_match_parallel(c: &mut Criterion) {
    let mut group = c.benchmark_group("match_parallel");

    for num_matches in [10, 100, 1000].iter() {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_matches", num_matches)),
            num_matches,
            |b, &num_matches| {
                b.iter(|| {
                    for i in 0..num_matches {
                        let config = MatchConfig {
                            tick_rate: 20,
                            seed: 12345 + i as u64,
                            ruleset_id: "rules.cs".to_string(),
                            map_id: "map.sample.box".to_string(),
                        };
                        
                        let mut simulator = MatchSimulator::new(config);
                        let result = simulator.run_match();
                        black_box(result);
                    }
                });
            },
        );
    }

    group.finish();
}

fn bench_seed_variation(c: &mut Criterion) {
    let mut group = c.benchmark_group("seed_variation");

    // Test that different seeds produce different results but same performance
    for seed in [1u64, 12345, 999999, u64::MAX].iter() {
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("seed_{}", seed)),
            seed,
            |b, &seed| {
                b.iter(|| {
                    let config = MatchConfig {
                        tick_rate: 20,
                        seed,
                        ruleset_id: "rules.cs".to_string(),
                        map_id: "map.sample.box".to_string(),
                    };
                    
                    let mut simulator = MatchSimulator::new(config);
                    let result = simulator.run_match();
                    black_box(result);
                });
            },
        );
    }

    group.finish();
}

criterion_group!(
    benches,
    bench_full_match,
    bench_match_parallel,
    bench_seed_variation
);
criterion_main!(benches);
