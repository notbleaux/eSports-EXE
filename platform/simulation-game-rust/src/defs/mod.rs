//! Definition types for simulation entities
//!
//! These are immutable data definitions loaded from JSON/YAML files
//! that describe weapons, agents, maps, and rulesets.

use serde::{Deserialize, Serialize};

/// 2D vector for positions and velocities
#[derive(Debug, Clone, Copy, Default, PartialEq, Serialize, Deserialize)]
pub struct Vec2 {
    pub x: f32,
    pub y: f32,
}

impl Vec2 {
    /// Creates a new Vec2
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    /// Calculates the squared length (faster than length)
    #[inline(always)]
    pub fn length_squared(&self) -> f32 {
        self.x * self.x + self.y * self.y
    }

    /// Calculates the length
    #[inline(always)]
    pub fn length(&self) -> f32 {
        self.length_squared().sqrt()
    }

    /// Distance to another point
    #[inline(always)]
    pub fn distance_to(&self, other: &Vec2) -> f32 {
        (*other - *self).length()
    }

    /// Normalizes the vector
    #[inline(always)]
    pub fn normalize(&self) -> Self {
        let len = self.length();
        if len > 0.0 {
            Self::new(self.x / len, self.y / len)
        } else {
            *self
        }
    }
}

impl std::ops::Add for Vec2 {
    type Output = Self;
    #[inline(always)]
    fn add(self, other: Self) -> Self {
        Self::new(self.x + other.x, self.y + other.y)
    }
}

impl std::ops::Sub for Vec2 {
    type Output = Self;
    #[inline(always)]
    fn sub(self, other: Self) -> Self {
        Self::new(self.x - other.x, self.y - other.y)
    }
}

impl std::ops::Mul<f32> for Vec2 {
    type Output = Self;
    #[inline(always)]
    fn mul(self, scalar: f32) -> Self {
        Self::new(self.x * scalar, self.y * scalar)
    }
}

/// Team side in a match
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum TeamSide {
    Attack,
    Defend,
}

/// Fire mode for weapons
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum FireMode {
    Semi,
    Burst,
    Auto,
}

/// Utility family type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UtilityFamily {
    CsGrenade,
    ValAbility,
}

/// Cast type for utilities
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum CastType {
    ThrowArc,
    FireProjectile,
    InstantAoe,
    PlaceMarker,
    Beam,
    Self,
}

/// Effect kind for utility effects
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum EffectKind {
    Smoke,
    FlashBlind,
    Concuss,
    Slow,
    Burn,
    Heal,
    Shield,
    Reveal,
    Suppress,
    Knockback,
    Wall,
    Trap,
    DecoySound,
    Explosion,
}

/// Match configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchConfig {
    pub tick_rate: i32,
    pub seed: u64,
    pub ruleset_id: String,
    pub map_id: String,
}

impl Default for MatchConfig {
    fn default() -> Self {
        Self {
            tick_rate: 20,
            seed: 12345,
            ruleset_id: "rules.cs".to_string(),
            map_id: "map.sample.box".to_string(),
        }
    }
}

/// Ruleset definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RulesetDef {
    pub id: String,
    pub utility_family: UtilityFamily,
    #[serde(default = "default_max_grenades")]
    pub max_grenades: i32,
    #[serde(default)]
    pub uses_ability_economy: bool,
    #[serde(default = "default_round_start_credits")]
    pub round_start_credits: i32,
    #[serde(default = "default_max_credits")]
    pub max_credits: i32,
    #[serde(default = "default_round_win_credits")]
    pub round_win_credits: i32,
    #[serde(default = "default_round_loss_credits")]
    pub round_loss_credits: i32,
    #[serde(default = "default_kill_credits")]
    pub kill_credits: i32,
    #[serde(default = "default_loss_streak_bonuses")]
    pub loss_streak_bonuses: Vec<i32>,
    #[serde(default = "true")]
    pub reset_hp_each_round: bool,
    #[serde(default = "true")]
    pub reset_armor_each_round: bool,
    #[serde(default = "true")]
    pub refill_signature_each_round: bool,
    #[serde(default = "default_signature_charges")]
    pub default_signature_round_start_charges: i32,
}

fn default_max_grenades() -> i32 { 4 }
fn default_round_start_credits() -> i32 { 800 }
fn default_max_credits() -> i32 { 9000 }
fn default_round_win_credits() -> i32 { 3000 }
fn default_round_loss_credits() -> i32 { 1900 }
fn default_kill_credits() -> i32 { 200 }
fn default_loss_streak_bonuses() -> Vec<i32> { vec![0, 500, 500, 500] }
fn default_signature_charges() -> i32 { 1 }

impl Default for RulesetDef {
    fn default() -> Self {
        Self {
            id: String::new(),
            utility_family: UtilityFamily::CsGrenade,
            max_grenades: 4,
            uses_ability_economy: false,
            round_start_credits: 800,
            max_credits: 9000,
            round_win_credits: 3000,
            round_loss_credits: 1900,
            kill_credits: 200,
            loss_streak_bonuses: vec![0, 500, 500, 500],
            reset_hp_each_round: true,
            reset_armor_each_round: true,
            refill_signature_each_round: true,
            default_signature_round_start_charges: 1,
        }
    }
}

/// Agent traits (0.0 to 1.0 normalized)
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct TraitBlock {
    pub aim: f32,
    pub recoil_control: f32,
    pub reaction: f32,
    pub movement: f32,
    pub game_sense: f32,
    pub composure: f32,
    pub teamwork: f32,
    pub utility: f32,
    pub discipline: f32,
    pub aggression: f32,
}

/// Agent definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDef {
    pub id: String,
    pub display_name: String,
    #[serde(default = "default_base_hp")]
    pub base_hp: f32,
    #[serde(default)]
    pub base_armor: f32,
    #[serde(default)]
    pub traits: TraitBlock,
    #[serde(default)]
    pub loadout_weapon_ids: Vec<String>,
    #[serde(default)]
    pub loadout_utility_ids: Vec<String>,
}

fn default_base_hp() -> f32 { 100.0 }

impl Default for AgentDef {
    fn default() -> Self {
        Self {
            id: String::new(),
            display_name: String::new(),
            base_hp: 100.0,
            base_armor: 0.0,
            traits: TraitBlock::default(),
            loadout_weapon_ids: Vec::new(),
            loadout_utility_ids: Vec::new(),
        }
    }
}

/// Weapon definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponDef {
    pub id: String,
    pub fire_mode: FireMode,
    #[serde(default)]
    pub credit_cost: i32,
    pub magazine_size: i32,
    pub rounds_per_minute: f32,
    pub reload_time: f32,
    #[serde(default)]
    pub damage: DamageProfile,
    #[serde(default)]
    pub spread: SpreadProfile,
    #[serde(default)]
    pub recoil: RecoilProfile,
    #[serde(default)]
    pub penetration: PenetrationProfile,
}

/// Damage profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DamageProfile {
    pub base_damage: f32,
    #[serde(default = "default_head_mult")]
    pub head_mult: f32,
    #[serde(default = "default_leg_mult")]
    pub leg_mult: f32,
    #[serde(default)]
    pub range_multiplier: Curve,
}

fn default_head_mult() -> f32 { 4.0 }
fn default_leg_mult() -> f32 { 0.75 }

impl Default for DamageProfile {
    fn default() -> Self {
        Self {
            base_damage: 0.0,
            head_mult: 4.0,
            leg_mult: 0.75,
            range_multiplier: Curve::default(),
        }
    }
}

/// Spread profile
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct SpreadProfile {
    pub base_sigma: f32,
    #[serde(default = "default_crouch_mult")]
    pub crouch_mult: f32,
    pub move_sigma_add: f32,
    pub jump_sigma_add: f32,
    pub first_shot_bonus: f32,
}

fn default_crouch_mult() -> f32 { 0.85 }

impl Default for SpreadProfile {
    fn default() -> Self {
        Self {
            base_sigma: 0.0,
            crouch_mult: 0.85,
            move_sigma_add: 0.0,
            jump_sigma_add: 0.0,
            first_shot_bonus: 0.0,
        }
    }
}

/// Recoil profile
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct RecoilProfile {
    pub recoil_per_shot: f32,
    pub max_recoil: f32,
    pub recovery_per_sec: f32,
}

impl Default for RecoilProfile {
    fn default() -> Self {
        Self {
            recoil_per_shot: 0.0,
            max_recoil: 0.0,
            recovery_per_sec: 0.0,
        }
    }
}

/// Penetration profile
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PenetrationProfile {
    #[serde(default)]
    pub can_penetrate: bool,
    pub pen_power: f32,
    pub damage_loss_per_unit: f32,
}

impl Default for PenetrationProfile {
    fn default() -> Self {
        Self {
            can_penetrate: false,
            pen_power: 0.0,
            damage_loss_per_unit: 0.0,
        }
    }
}

/// Curve for range-based damage falloff
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Curve {
    #[serde(default)]
    pub points: Vec<(f32, f32)>,
}

impl Curve {
    /// Evaluates the curve at a given distance using linear interpolation
    pub fn evaluate(&self, distance: f32) -> f32 {
        if self.points.is_empty() {
            return 1.0;
        }
        
        if distance <= self.points[0].0 {
            return self.points[0].1;
        }
        
        if distance >= self.points.last().unwrap().0 {
            return self.points.last().unwrap().1;
        }
        
        // Find the segment
        for window in self.points.windows(2) {
            let (x0, y0) = window[0];
            let (x1, y1) = window[1];
            
            if distance >= x0 && distance <= x1 {
                let t = (distance - x0) / (x1 - x0);
                return crate::math::lerp(y0, y1, t);
            }
        }
        
        1.0
    }
}

/// Utility definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtilityDef {
    pub id: String,
    pub family: UtilityFamily,
    pub cast_type: CastType,
    pub equip_time: f32,
    pub cast_time: f32,
    #[serde(default = "default_one")]
    pub max_charges: i32,
    #[serde(default)]
    pub cooldown: f32,
    #[serde(default)]
    pub credit_cost: i32,
    #[serde(default)]
    pub is_signature: bool,
    #[serde(default)]
    pub round_start_charges: i32,
    #[serde(default)]
    pub throw: Option<ThrowBallistics>,
    #[serde(default)]
    pub projectile: Option<ProjectileDef>,
    #[serde(default)]
    pub effects: Vec<EffectSpec>,
}

fn default_one() -> i32 { 1 }

/// Throw ballistics
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ThrowBallistics {
    pub speed: f32,
    pub gravity: f32,
    pub fuse_time: f32,
    #[serde(default)]
    pub detonate_on_rest: bool,
}

/// Projectile definition
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ProjectileDef {
    pub speed: f32,
    pub gravity: f32,
    pub max_life: f32,
    #[serde(default)]
    pub bounces: bool,
    #[serde(default)]
    pub bounce_damp: f32,
}

/// Effect specification
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct EffectSpec {
    pub kind: EffectKind,
    pub duration: f32,
    pub radius: f32,
    pub dps_or_value: f32,
    #[serde(default)]
    pub falloff: f32,
    #[serde(default)]
    pub requires_los: bool,
    #[serde(default)]
    pub requires_facing: bool,
    #[serde(default)]
    pub facing_angle_deg: f32,
}

/// Map definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapDef {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub walls: Vec<WallSeg>,
}

/// Wall segment
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct WallSeg {
    pub ax: f32,
    pub ay: f32,
    pub bx: f32,
    pub by: f32,
}
