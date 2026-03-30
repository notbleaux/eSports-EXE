//! Combat resolution system
//!
//! Handles damage application, duel resolution, and hit probability calculations.

use crate::defs::{HitZone, TraitBlock, WeaponDef};
use crate::math::{clamp, DeterministicRng};

/// Damage utility functions
pub struct Damage;

impl Damage {
    /// Applies damage to HP and armor
    /// 
    /// Armor absorbs 35% of damage until depleted.
    #[inline(always)]
    pub fn apply(hp: &mut f32, armor: &mut f32, raw: f32) {
        let mit = if *armor > 0.0 { 0.35 } else { 0.0 };
        let to_hp = raw * (1.0 - mit);
        let to_armor = raw * mit;

        *hp -= to_hp;
        *armor = armor.max(0.0) - to_armor;
        if *armor < 0.0 {
            *armor = 0.0;
        }
    }
}

/// Hit model for calculating hit probabilities and damage
pub struct HitModel;

impl HitModel {
    /// Computes the sigma (angular deviation) for a shot
    /// 
    /// Takes into account weapon spread, movement, crouching, recoil,
    /// stress, and agent traits.
    #[inline(always)]
    pub fn compute_sigma(
        weapon: &WeaponDef,
        speed: f32,
        crouched: bool,
        recoil: f32,
        stress: f32,
        traits: &TraitBlock,
    ) -> f32 {
        let mut sigma = weapon.spread.base_sigma;
        sigma += speed * weapon.spread.move_sigma_add;
        sigma += recoil * 0.0035;
        
        if crouched {
            sigma *= weapon.spread.crouch_mult;
        }

        // Skill and composure modifiers
        sigma *= 1.15 - 0.65 * traits.aim;
        sigma *= 1.0 + 0.75 * stress * (1.0 - traits.composure);

        // First shot bonus
        if recoil < 0.05 {
            sigma += weapon.spread.first_shot_bonus;
        }

        sigma.max(0.0005)
    }

    /// Gets the damage multiplier for a given hit zone
    #[inline(always)]
    pub fn zone_mult(weapon: &WeaponDef, zone: HitZone) -> f32 {
        match zone {
            HitZone::Head => weapon.damage.head_mult,
            HitZone::Legs => weapon.damage.leg_mult,
            HitZone::Torso => 1.0,
        }
    }

    /// Gets the range multiplier for damage falloff
    #[inline(always)]
    pub fn range_mult(weapon: &WeaponDef, distance: f32) -> f32 {
        weapon.damage.range_multiplier.evaluate(distance)
    }
}

/// Input for duel resolution
#[derive(Debug, Clone)]
pub struct DuelInput<'a> {
    pub shooter: &'a AgentRuntime,
    pub target: &'a AgentRuntime,
    pub distance: f32,
    pub exposure: f32,        // 0..1 fraction visible/hittable
    pub shooter_speed: f32,
    pub target_speed: f32,
    pub shooter_crouched: bool,
    pub target_crouched: bool,
    pub max_time: f32,
}

impl<'a> DuelInput<'a> {
    /// Creates a new duel input with sensible defaults
    pub fn new(shooter: &'a AgentRuntime, target: &'a AgentRuntime) -> Self {
        Self {
            shooter,
            target,
            distance: 10.0,
            exposure: 1.0,
            shooter_speed: 0.0,
            target_speed: 0.0,
            shooter_crouched: false,
            target_crouched: false,
            max_time: 3.5,
        }
    }

    /// Sets the distance between shooter and target
    pub fn with_distance(mut self, distance: f32) -> Self {
        self.distance = distance;
        self
    }

    /// Sets the exposure fraction
    pub fn with_exposure(mut self, exposure: f32) -> Self {
        self.exposure = exposure.clamp(0.0, 1.0);
        self
    }
}

/// Result of a duel resolution
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct DuelResult {
    pub target_killed: bool,
    pub time_to_kill: f32,
    pub shots_fired: i32,
    pub hits: i32,
    pub win_prob_hint: f32,
}

impl DuelResult {
    /// Creates a result indicating the target was not killed
    pub fn not_killed() -> Self {
        Self {
            target_killed: false,
            time_to_kill: f32::INFINITY,
            shots_fired: 0,
            hits: 0,
            win_prob_hint: 0.0,
        }
    }
}

/// Runtime agent data for combat
#[derive(Debug, Clone)]
pub struct AgentRuntime {
    pub traits: TraitBlock,
    pub weapon: WeaponDef,
    pub hp: f32,
    pub armor: f32,
    pub stress: f32,
    pub reaction_timer: f32,
}

impl AgentRuntime {
    /// Creates a new agent runtime with default values
    pub fn new(traits: TraitBlock, weapon: WeaponDef) -> Self {
        Self {
            traits,
            weapon,
            hp: 100.0,
            armor: 0.0,
            stress: 0.0,
            reaction_timer: 0.0,
        }
    }

    /// Calculates reaction delay with stress penalty
    #[inline(always)]
    pub fn reaction_delay(&self, extra_penalty: f32) -> f32 {
        let base_rt = crate::math::lerp(0.18, 0.45, 1.0 - self.traits.reaction);
        let stress_penalty = 0.15 * self.stress * (1.0 - self.traits.composure);
        base_rt + stress_penalty + extra_penalty
    }
}

/// Duel engine for resolving combat encounters
pub struct DuelEngine {
    samples: usize,
}

impl DuelEngine {
    /// Creates a new duel engine
    pub fn new() -> Self {
        Self { samples: 128 }
    }

    /// Sets the number of Monte Carlo samples
    pub fn with_samples(mut self, samples: usize) -> Self {
        self.samples = samples;
        self
    }

    /// Resolves a duel between shooter and target
    /// 
    /// Uses Monte Carlo simulation to determine the expected outcome.
    /// Runs multiple samples and averages the results for statistical accuracy.
    pub fn resolve(&self, rng: &mut DeterministicRng, input: &DuelInput) -> DuelResult {
        let mut kill_count = 0;
        let mut t_sum = 0.0;
        let mut shots_sum = 0;
        let mut hits_sum = 0;

        let shot_interval = 60.0 / input.shooter.weapon.rounds_per_minute;
        let base_radius = 0.30; // target radius in world units

        let base_seed = rng.next_u64();

        for i in 0..self.samples {
            let sample_seed = DeterministicRng::hash_seed(&[
                "ttk",
                &base_seed.to_string(),
                &i.to_string(),
            ]);
            let mut sample_rng = DeterministicRng::new(sample_seed);

            let mut hp = input.target.hp;
            let mut armor = input.target.armor;
            let mut recoil = 0.0;
            let mut t = input.shooter.reaction_delay(input.shooter.reaction_timer);

            let mut shots = 0;
            let mut hits = 0;

            while hp > 0.0 && t < input.max_time {
                let sigma = HitModel::compute_sigma(
                    &input.shooter.weapon,
                    input.shooter_speed,
                    input.shooter_crouched,
                    recoil,
                    input.shooter.stress,
                    &input.shooter.traits,
                );

                let r_world = base_radius * input.exposure.clamp(0.0, 1.0);
                let r_ang = (r_world / input.distance.max(0.1)).atan();

                let p_hit = 1.0 - (-(r_ang * r_ang) / (2.0 * sigma * sigma)).exp();
                let p_hit = p_hit.clamp(0.0, 1.0);

                shots += 1;

                if sample_rng.next_f32() < p_hit {
                    hits += 1;
                    let head_share = self.compute_head_share(input, sigma);
                    let zone = if sample_rng.next_f32() < head_share {
                        HitZone::Head
                    } else {
                        HitZone::Torso
                    };

                    let dmg = input.shooter.weapon.damage.base_damage
                        * HitModel::range_mult(&input.shooter.weapon, input.distance)
                        * HitModel::zone_mult(&input.shooter.weapon, zone);
                    
                    Damage::apply(&mut hp, &mut armor, dmg);
                }

                // Recoil integration
                let rec_gain = input.shooter.weapon.recoil.recoil_per_shot
                    * (1.15 - 0.65 * input.shooter.traits.recoil_control);
                recoil = (recoil + rec_gain).min(input.shooter.weapon.recoil.max_recoil);
                recoil = (recoil - input.shooter.weapon.recoil.recovery_per_sec * shot_interval).max(0.0);

                t += shot_interval;
            }

            if hp <= 0.0 {
                kill_count += 1;
                t_sum += t;
                shots_sum += shots;
                hits_sum += hits;
            }
        }

        if kill_count == 0 {
            return DuelResult::not_killed();
        }

        let mean_ttk = t_sum / kill_count as f32;
        DuelResult {
            target_killed: true,
            time_to_kill: mean_ttk,
            shots_fired: shots_sum / kill_count,
            hits: hits_sum / kill_count,
            win_prob_hint: kill_count as f32 / self.samples as f32,
        }
    }

    /// Computes the probability of a headshot given the input conditions
    #[inline(always)]
    fn compute_head_share(&self, input: &DuelInput, sigma: f32) -> f32 {
        let aim = input.shooter.traits.aim;
        let dist_factor = (1.0 - (input.distance / 45.0)).clamp(0.1, 1.0);
        let sigma_factor = (0.012 / sigma.max(0.0005)).clamp(0.4, 1.2);
        let raw = 0.10 + 0.35 * aim * dist_factor * sigma_factor;
        raw.clamp(0.08, 0.55)
    }
}

impl Default for DuelEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::defs::{DamageProfile, FireMode, SpreadProfile, TraitBlock};

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
                range_multiplier: crate::defs::Curve::default(),
            },
            spread: SpreadProfile {
                base_sigma: 0.005,
                crouch_mult: 0.85,
                move_sigma_add: 0.002,
                jump_sigma_add: 0.01,
                first_shot_bonus: -0.001,
            },
            recoil: crate::defs::RecoilProfile {
                recoil_per_shot: 0.15,
                max_recoil: 2.0,
                recovery_per_sec: 3.0,
            },
            penetration: crate::defs::PenetrationProfile::default(),
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

    #[test]
    fn test_damage_apply() {
        let mut hp = 100.0;
        let mut armor = 50.0;
        
        Damage::apply(&mut hp, &mut armor, 35.0);
        
        // 35% absorbed by armor
        assert!(hp < 100.0);
        assert!(armor < 50.0);
    }

    #[test]
    fn test_duel_engine_resolve() {
        let mut rng = DeterministicRng::new(12345);
        let engine = DuelEngine::new().with_samples(64);
        
        let weapon = create_test_weapon();
        let traits = create_test_traits();
        
        let shooter = AgentRuntime::new(traits, weapon.clone());
        let target = AgentRuntime::new(traits, weapon.clone());
        
        let input = DuelInput::new(&shooter, &target)
            .with_distance(15.0)
            .with_exposure(1.0);
        
        let result = engine.resolve(&mut rng, &input);
        
        // Should usually kill at close range with good exposure
        assert!(result.win_prob_hint > 0.5);
    }

    #[test]
    fn test_hit_model_compute_sigma() {
        let weapon = create_test_weapon();
        let traits = create_test_traits();
        
        let sigma = HitModel::compute_sigma(&weapon, 0.0, false, 0.0, 0.0, &traits);
        assert!(sigma > 0.0);
        
        // Crouching should reduce sigma
        let sigma_crouch = HitModel::compute_sigma(&weapon, 0.0, true, 0.0, 0.0, &traits);
        assert!(sigma_crouch < sigma);
    }
}
