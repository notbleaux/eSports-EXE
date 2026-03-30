//! Simulation state management
//!
//! Handles the runtime state of agents, weapons, and the match.

use crate::defs::{AgentDef, EffectKind, TeamSide, Vec2};
use serde::{Deserialize, Serialize};

/// Runtime state for a match
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SimState {
    pub time: f32,
    pub agents: Vec<AgentState>,
}

impl SimState {
    /// Creates a new empty simulation state
    pub fn new() -> Self {
        Self {
            time: 0.0,
            agents: Vec::with_capacity(10),
        }
    }

    /// Gets an agent by entity ID
    pub fn get_agent(&self, entity_id: i32) -> Option<&AgentState> {
        self.agents.iter().find(|a| a.entity_id == entity_id)
    }

    /// Gets a mutable agent by entity ID
    pub fn get_agent_mut(&mut self, entity_id: i32) -> Option<&mut AgentState> {
        self.agents.iter_mut().find(|a| a.entity_id == entity_id)
    }

    /// Adds an agent to the simulation
    pub fn add_agent(&mut self, agent: AgentState) {
        self.agents.push(agent);
    }

    /// Removes dead agents (HP <= 0)
    pub fn cleanup_dead(&mut self) {
        self.agents.retain(|a| a.hp > 0.0);
    }

    /// Gets agents on a specific team
    pub fn agents_on_side(&self, side: TeamSide) -> impl Iterator<Item = &AgentState> {
        self.agents.iter().filter(move |a| a.side == side)
    }

    /// Counts living agents on a side
    pub fn living_count(&self, side: TeamSide) -> usize {
        self.agents_on_side(side).filter(|a| a.hp > 0.0).count()
    }

    /// Checks if all agents on a side are dead
    pub fn side_eliminated(&self, side: TeamSide) -> bool {
        self.living_count(side) == 0
    }
}

/// Runtime state for an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    pub entity_id: i32,
    pub agent_id: String,
    pub side: TeamSide,
    pub loadout_weapon_ids: Vec<String>,
    pub loadout_utility_ids: Vec<String>,

    pub max_hp: f32,
    pub max_armor: f32,
    pub utilities: std::collections::HashMap<String, UtilityState>,

    // Economy
    pub credits: i32,

    // Position and movement
    pub pos: Vec2,
    pub vel: Vec2,
    pub facing_rad: f32,

    // Vitals
    pub hp: f32,
    pub armor: f32,

    // Combat state
    pub stress: f32,
    pub reaction_timer: f32,
    pub weapon: WeaponState,
    pub status: StatusState,
}

impl AgentState {
    /// Creates a new agent state from a definition
    pub fn from_def(entity_id: i32, agent_def: &AgentDef, side: TeamSide) -> Self {
        Self {
            entity_id,
            agent_id: agent_def.id.clone(),
            side,
            loadout_weapon_ids: agent_def.loadout_weapon_ids.clone(),
            loadout_utility_ids: agent_def.loadout_utility_ids.clone(),
            max_hp: agent_def.base_hp,
            max_armor: agent_def.base_armor,
            utilities: std::collections::HashMap::new(),
            credits: 0,
            pos: Vec2::default(),
            vel: Vec2::default(),
            facing_rad: 0.0,
            hp: agent_def.base_hp,
            armor: agent_def.base_armor,
            stress: 0.0,
            reaction_timer: 0.0,
            weapon: WeaponState::default(),
            status: StatusState::default(),
        }
    }

    /// Checks if the agent is alive
    #[inline(always)]
    pub fn is_alive(&self) -> bool {
        self.hp > 0.0
    }

    /// Checks if the agent can shoot
    #[inline(always)]
    pub fn can_shoot(&self) -> bool {
        self.is_alive() 
            && self.weapon.fire_cooldown <= 0.0 
            && self.weapon.ammo_in_mag > 0
            && !self.status.is_flashed()
    }

    /// Gets the utility state for a utility ID
    pub fn get_utility(&self, utility_id: &str) -> Option<&UtilityState> {
        self.utilities.get(utility_id)
    }

    /// Gets mutable utility state
    pub fn get_utility_mut(&mut self, utility_id: &str) -> Option<&mut UtilityState> {
        self.utilities.get_mut(utility_id)
    }

    /// Initializes utilities from loadout
    pub fn init_utilities(&mut self, utility_ids: &[String]) {
        for id in utility_ids {
            self.utilities.insert(
                id.clone(),
                UtilityState {
                    utility_id: id.clone(),
                    charges: 0,
                    cooldown_timer: 0.0,
                },
            );
        }
    }
}

/// Weapon runtime state
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct WeaponState {
    pub weapon_id: String,
    pub ammo_in_mag: i32,
    pub fire_cooldown: f32,
    pub reload_timer: f32,
    pub recoil: f32,
}

impl WeaponState {
    /// Creates a new weapon state
    pub fn new(weapon_id: impl Into<String>, ammo: i32) -> Self {
        Self {
            weapon_id: weapon_id.into(),
            ammo_in_mag: ammo,
            fire_cooldown: 0.0,
            reload_timer: 0.0,
            recoil: 0.0,
        }
    }

    /// Ticks the weapon state (cooldowns, recoil recovery)
    #[inline(always)]
    pub fn tick(&mut self, dt: f32, recovery_per_sec: f32) {
        self.fire_cooldown = (self.fire_cooldown - dt).max(0.0);
        self.reload_timer = (self.reload_timer - dt).max(0.0);
        self.recoil = (self.recoil - recovery_per_sec * dt).max(0.0);
    }
}

/// Utility runtime state
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct UtilityState {
    pub utility_id: String,
    pub charges: i32,
    pub cooldown_timer: f32,
}

impl UtilityState {
    /// Checks if the utility can be used
    #[inline(always)]
    pub fn can_use(&self) -> bool {
        self.charges > 0 && self.cooldown_timer <= 0.0
    }

    /// Uses one charge
    pub fn use_charge(&mut self) -> bool {
        if self.can_use() {
            self.charges -= 1;
            true
        } else {
            false
        }
    }

    /// Ticks the cooldown timer
    #[inline(always)]
    pub fn tick(&mut self, dt: f32) {
        self.cooldown_timer = (self.cooldown_timer - dt).max(0.0);
    }
}

/// Status effect state
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct StatusState {
    pub flash_timer: f32,
    pub concuss_timer: f32,
    pub slow_timer: f32,
    pub burn_timer: f32,
    pub reveal_timer: f32,
    pub suppress_timer: f32,
}

impl StatusState {
    /// Clears all status effects
    pub fn clear_all(&mut self) {
        *self = Self::default();
    }

    /// Ticks all status effect timers
    #[inline(always)]
    pub fn tick(&mut self, dt: f32) {
        self.flash_timer = (self.flash_timer - dt).max(0.0);
        self.concuss_timer = (self.concuss_timer - dt).max(0.0);
        self.slow_timer = (self.slow_timer - dt).max(0.0);
        self.burn_timer = (self.burn_timer - dt).max(0.0);
        self.reveal_timer = (self.reveal_timer - dt).max(0.0);
        self.suppress_timer = (self.suppress_timer - dt).max(0.0);
    }

    /// Checks if flashed
    #[inline(always)]
    pub fn is_flashed(&self) -> bool {
        self.flash_timer > 0.0
    }

    /// Checks if concussed
    #[inline(always)]
    pub fn is_concussed(&self) -> bool {
        self.concuss_timer > 0.0
    }

    /// Checks if slowed
    #[inline(always)]
    pub fn is_slowed(&self) -> bool {
        self.slow_timer > 0.0
    }

    /// Checks if burning
    #[inline(always)]
    pub fn is_burning(&self) -> bool {
        self.burn_timer > 0.0
    }

    /// Checks if suppressed
    #[inline(always)]
    pub fn is_suppressed(&self) -> bool {
        self.suppress_timer > 0.0
    }

    /// Applies an effect
    pub fn apply_effect(&mut self, kind: EffectKind, duration: f32) {
        match kind {
            EffectKind::FlashBlind => self.flash_timer = self.flash_timer.max(duration),
            EffectKind::Concuss => self.concuss_timer = self.concuss_timer.max(duration),
            EffectKind::Slow => self.slow_timer = self.slow_timer.max(duration),
            EffectKind::Burn => self.burn_timer = self.burn_timer.max(duration),
            EffectKind::Reveal => self.reveal_timer = self.reveal_timer.max(duration),
            EffectKind::Suppress => self.suppress_timer = self.suppress_timer.max(duration),
            _ => {}
        }
    }
}

/// Team economy state
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct TeamEconomyState {
    pub side: TeamSide,
    pub score: i32,
    pub loss_streak: i32,
}

impl TeamEconomyState {
    /// Creates a new team economy state
    pub fn new(side: TeamSide) -> Self {
        Self {
            side,
            score: 0,
            loss_streak: 0,
        }
    }

    /// Records a round win
    pub fn record_win(&mut self) {
        self.score += 1;
        self.loss_streak = 0;
    }

    /// Records a round loss
    pub fn record_loss(&mut self) {
        self.loss_streak += 1;
    }
}

/// Full match state
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MatchState {
    pub round_index: i32,
    pub attack: TeamEconomyState,
    pub defend: TeamEconomyState,
    pub sim: SimState,
}

impl MatchState {
    /// Creates a new match state
    pub fn new() -> Self {
        Self {
            round_index: 0,
            attack: TeamEconomyState::new(TeamSide::Attack),
            defend: TeamEconomyState::new(TeamSide::Defend),
            sim: SimState::new(),
        }
    }

    /// Gets the winning side if any
    pub fn winner(&self) -> Option<TeamSide> {
        if self.attack.score >= 13 {
            Some(TeamSide::Attack)
        } else if self.defend.score >= 13 {
            Some(TeamSide::Defend)
        } else {
            None
        }
    }

    /// Records a round result
    pub fn record_round(&mut self, winner: TeamSide) {
        match winner {
            TeamSide::Attack => {
                self.attack.record_win();
                self.defend.record_loss();
            }
            TeamSide::Defend => {
                self.defend.record_win();
                self.attack.record_loss();
            }
        }
        self.round_index += 1;
    }
}

/// Match simulator
pub struct MatchSimulator {
    config: crate::defs::MatchConfig,
    rng: crate::math::DeterministicRng,
}

impl MatchSimulator {
    /// Creates a new match simulator
    pub fn new(config: crate::defs::MatchConfig) -> Self {
        let seed = config.seed;
        Self {
            config,
            rng: crate::math::DeterministicRng::new(seed),
        }
    }

    /// Runs a full match simulation
    /// 
    /// This is a simplified simulation for benchmarking.
    /// A full implementation would include proper round flow,
    /// economy management, and tactical decision-making.
    pub fn run_match(&mut self) -> MatchResult {
        let mut state = MatchState::new();
        let dt = 1.0 / self.config.tick_rate as f32;

        // Simulate up to 24 rounds (first to 13)
        while state.winner().is_none() && state.round_index < 24 {
            self.run_round(&mut state, dt);
        }

        MatchResult {
            winner: state.winner(),
            attack_score: state.attack.score,
            defend_score: state.defend.score,
            total_rounds: state.round_index,
            total_time: state.sim.time,
        }
    }

    /// Runs a single round
    fn run_round(&mut self, state: &mut MatchState, dt: f32) {
        // Reset simulation state for new round
        state.sim.time = 0.0;
        
        // Simple round logic: first side to lose all agents loses
        // This is a placeholder - real implementation would have proper combat
        loop {
            state.sim.time += dt;
            
            // Tick all agents
            for agent in &mut state.sim.agents {
                agent.weapon.tick(dt, 3.0);
                agent.status.tick(dt);
                agent.reaction_timer = (agent.reaction_timer - dt).max(0.0);
            }

            // Check win conditions (simplified)
            if state.sim.side_eliminated(TeamSide::Attack) {
                state.record_round(TeamSide::Defend);
                break;
            }
            if state.sim.side_eliminated(TeamSide::Defend) {
                state.record_round(TeamSide::Attack);
                break;
            }

            // Timeout after 100 seconds
            if state.sim.time > 100.0 {
                // Defenders win on timeout
                state.record_round(TeamSide::Defend);
                break;
            }
        }
    }
}

/// Match result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchResult {
    pub winner: Option<TeamSide>,
    pub attack_score: i32,
    pub defend_score: i32,
    pub total_rounds: i32,
    pub total_time: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_state_creation() {
        let def = AgentDef {
            id: "test_agent".to_string(),
            display_name: "Test".to_string(),
            base_hp: 100.0,
            base_armor: 50.0,
            ..Default::default()
        };

        let agent = AgentState::from_def(1, &def, TeamSide::Attack);
        
        assert_eq!(agent.entity_id, 1);
        assert_eq!(agent.hp, 100.0);
        assert_eq!(agent.armor, 50.0);
        assert!(agent.is_alive());
    }

    #[test]
    fn test_status_effects() {
        let mut status = StatusState::default();
        
        assert!(!status.is_flashed());
        
        status.apply_effect(EffectKind::FlashBlind, 2.0);
        assert!(status.is_flashed());
        
        status.tick(1.0);
        assert!(status.is_flashed());
        
        status.tick(1.5);
        assert!(!status.is_flashed());
    }

    #[test]
    fn test_match_state() {
        let mut state = MatchState::new();
        
        assert!(state.winner().is_none());
        
        // Simulate attack winning 13 rounds
        for _ in 0..13 {
            state.record_round(TeamSide::Attack);
        }
        
        assert_eq!(state.winner(), Some(TeamSide::Attack));
        assert_eq!(state.attack.score, 13);
    }

    #[test]
    fn test_weapon_state() {
        let mut weapon = WeaponState::new("rifle", 30);
        weapon.fire_cooldown = 1.0;
        weapon.recoil = 0.5;
        
        weapon.tick(0.5, 2.0);
        
        assert!(weapon.fire_cooldown < 1.0);
        assert!(weapon.recoil < 0.5);
    }
}
