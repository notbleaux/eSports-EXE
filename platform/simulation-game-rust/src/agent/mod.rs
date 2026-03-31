//! Agent module
//!
//! Placeholder for agent AI and decision-making logic.
//! Currently minimal as the focus is on combat and economy.

use crate::defs::{AgentDef, TeamSide, TraitBlock};
use crate::sim::AgentState;

/// AI difficulty levels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Difficulty {
    Easy,
    Normal,
    Hard,
    Expert,
}

/// Agent AI controller
pub struct AgentAI {
    difficulty: Difficulty,
    aggression: f32,
    utility_usage: f32,
}

impl AgentAI {
    /// Creates a new agent AI with the given difficulty
    pub fn new(difficulty: Difficulty) -> Self {
        let (aggression, utility_usage) = match difficulty {
            Difficulty::Easy => (0.3, 0.2),
            Difficulty::Normal => (0.5, 0.5),
            Difficulty::Hard => (0.7, 0.7),
            Difficulty::Expert => (0.85, 0.9),
        };

        Self {
            difficulty,
            aggression,
            utility_usage,
        }
    }

    /// Makes a tactical decision
    /// 
    /// This is a placeholder that would be expanded with actual AI logic.
    pub fn make_decision(&self, _state: &AgentState) -> AgentDecision {
        // Placeholder decision logic
        AgentDecision::HoldPosition
    }

    /// Determines if the agent should use a utility
    pub fn should_use_utility(&self, _utility_id: &str, _state: &AgentState) -> bool {
        // Placeholder - would check tactical situation
        false
    }

    /// Selects a target from visible enemies
    pub fn select_target(&self, _enemies: &[&AgentState]) -> Option<i32> {
        // Placeholder - would select best target
        None
    }
}

/// Agent decisions
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentDecision {
    HoldPosition,
    MoveToPosition,
    EngageTarget,
    Retreat,
    UseUtility,
}

/// Agent builder for creating agents with specific configurations
pub struct AgentBuilder {
    def: AgentDef,
    side: TeamSide,
    difficulty: Difficulty,
}

impl AgentBuilder {
    /// Creates a new agent builder
    pub fn new(id: impl Into<String>, side: TeamSide) -> Self {
        Self {
            def: AgentDef {
                id: id.into(),
                display_name: String::new(),
                base_hp: 100.0,
                base_armor: 0.0,
                traits: TraitBlock::default(),
                loadout_weapon_ids: Vec::new(),
                loadout_utility_ids: Vec::new(),
            },
            side,
            difficulty: Difficulty::Normal,
        }
    }

    /// Sets the display name
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.def.display_name = name.into();
        self
    }

    /// Sets the traits
    pub fn with_traits(mut self, traits: TraitBlock) -> Self {
        self.def.traits = traits;
        self
    }

    /// Sets the loadout weapons
    pub fn with_weapons(mut self, weapons: Vec<String>) -> Self {
        self.def.loadout_weapon_ids = weapons;
        self
    }

    /// Sets the loadout utilities
    pub fn with_utilities(mut self, utilities: Vec<String>) -> Self {
        self.def.loadout_utility_ids = utilities;
        self
    }

    /// Sets the difficulty
    pub fn with_difficulty(mut self, difficulty: Difficulty) -> Self {
        self.difficulty = difficulty;
        self
    }

    /// Builds the agent definition
    pub fn build_def(self) -> AgentDef {
        self.def
    }

    /// Builds and creates an agent state
    pub fn build_state(self, entity_id: i32) -> AgentState {
        AgentState::from_def(entity_id, &self.def, self.side)
    }
}
