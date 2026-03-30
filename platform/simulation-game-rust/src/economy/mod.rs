//! Economy system for round management
//!
//! Handles credit management, buy phases, and round rewards.

use crate::defs::{AgentDef, RulesetDef, UtilityDef, UtilityFamily};
use crate::sim::{AgentState, UtilityState};
use std::collections::HashMap;

/// Economy system for managing credits and purchases
pub struct EconomySystem;

impl EconomySystem {
    /// Initializes an agent's economy state
    pub fn initialize_agent(
        agent: &mut AgentState,
        agent_def: &AgentDef,
        rules: &RulesetDef,
        weapons: &HashMap<String, crate::defs::WeaponDef>,
        utilities: &HashMap<String, UtilityDef>,
    ) {
        // Set initial credits if not already set
        if agent.credits <= 0 {
            agent.credits = rules.round_start_credits;
        }

        // Initialize weapon to first loadout weapon
        let weapon_id = agent_def
            .loadout_weapon_ids
            .first()
            .cloned()
            .or_else(|| weapons.keys().next().cloned())
            .unwrap_or_default();

        if let Some(weapon) = weapons.get(&weapon_id) {
            agent.weapon.weapon_id = weapon_id.clone();
            agent.weapon.ammo_in_mag = weapon.magazine_size;
        }

        // Initialize utilities
        for utility_id in &agent_def.loadout_utility_ids {
            if let Some(util_def) = utilities.get(utility_id) {
                agent.utilities.insert(
                    utility_id.clone(),
                    UtilityState {
                        utility_id: utility_id.clone(),
                        charges: 0,
                        cooldown_timer: 0.0,
                    },
                );
            }
        }
    }

    /// Processes round start for an agent
    pub fn round_start(
        agent: &mut AgentState,
        agent_def: &AgentDef,
        rules: &RulesetDef,
        weapons: &HashMap<String, crate::defs::WeaponDef>,
        utilities: &HashMap<String, UtilityDef>,
    ) {
        // Reset vitals
        if rules.reset_hp_each_round {
            agent.max_hp = agent_def.base_hp;
            agent.hp = agent_def.base_hp;
        }
        if rules.reset_armor_each_round {
            agent.armor = agent_def.base_armor;
        }

        // Reset transient combat state
        agent.stress = 0.0;
        agent.reaction_timer = 0.0;
        agent.status.clear_all();
        agent.weapon.fire_cooldown = 0.0;
        agent.weapon.reload_timer = 0.0;
        agent.weapon.recoil = 0.0;

        // Refill ammo
        if let Some(weapon) = weapons.get(&agent.weapon.weapon_id) {
            agent.weapon.ammo_in_mag = weapon.magazine_size;
        }

        // Reset utility cooldowns
        for utility in agent.utilities.values_mut() {
            utility.cooldown_timer = 0.0;
        }

        // Apply free refills
        Self::apply_round_start_refills(agent, rules, utilities);

        // Purchase utilities
        Self::buy_utilities(agent, agent_def, rules, utilities);
    }

    /// Applies round-start utility refills (signatures, etc.)
    fn apply_round_start_refills(
        agent: &mut AgentState,
        rules: &RulesetDef,
        utilities: &HashMap<String, UtilityDef>,
    ) {
        for (utility_id, utility_state) in &mut agent.utilities {
            if let Some(util_def) = utilities.get(utility_id) {
                let refill_to_at_least = if util_def.is_signature
                    && rules.refill_signature_each_round
                    && rules.utility_family == UtilityFamily::ValAbility
                {
                    util_def
                        .round_start_charges
                        .max(rules.default_signature_round_start_charges)
                } else {
                    util_def.round_start_charges
                };

                if refill_to_at_least > 0 {
                    utility_state.charges =
                        utility_state.charges.max(refill_to_at_least).min(util_def.max_charges);
                }
            }
        }
    }

    /// Handles utility purchasing logic
    fn buy_utilities(
        agent: &mut AgentState,
        agent_def: &AgentDef,
        rules: &RulesetDef,
        utilities: &HashMap<String, UtilityDef>,
    ) {
        match rules.utility_family {
            UtilityFamily::CsGrenade => {
                Self::buy_grenades(agent, agent_def, rules, utilities);
            }
            UtilityFamily::ValAbility => {
                if rules.uses_ability_economy {
                    Self::buy_abilities(agent, agent_def, rules, utilities);
                }
            }
        }
    }

    /// Buys grenades (CS-style)
    fn buy_grenades(
        agent: &mut AgentState,
        agent_def: &AgentDef,
        rules: &RulesetDef,
        utilities: &HashMap<String, UtilityDef>,
    ) {
        let total_grenades: i32 = agent.utilities.values().map(|u| u.charges).sum();
        let mut grenades_to_buy = total_grenades;

        for utility_id in &agent_def.loadout_utility_ids {
            if grenades_to_buy >= rules.max_grenades {
                break;
            }

            let Some(util_def) = utilities.get(utility_id) else {
                continue;
            };

            let utility_state = agent
                .utilities
                .entry(utility_id.clone())
                .or_insert_with(|| UtilityState {
                    utility_id: utility_id.clone(),
                    charges: 0,
                    cooldown_timer: 0.0,
                });

            while utility_state.charges < util_def.max_charges && grenades_to_buy < rules.max_grenades
            {
                if util_def.credit_cost > 0 && agent.credits < util_def.credit_cost {
                    break;
                }

                if util_def.credit_cost > 0 {
                    agent.credits -= util_def.credit_cost;
                }
                utility_state.charges += 1;
                grenades_to_buy += 1;
            }
        }
    }

    /// Buys abilities (VAL-style)
    fn buy_abilities(
        agent: &mut AgentState,
        agent_def: &AgentDef,
        _rules: &RulesetDef,
        utilities: &HashMap<String, UtilityDef>,
    ) {
        for utility_id in &agent_def.loadout_utility_ids {
            let Some(util_def) = utilities.get(utility_id) else {
                continue;
            };

            let utility_state = agent
                .utilities
                .entry(utility_id.clone())
                .or_insert_with(|| UtilityState {
                    utility_id: utility_id.clone(),
                    charges: 0,
                    cooldown_timer: 0.0,
                });

            // Buy up to max charges
            while utility_state.charges < util_def.max_charges {
                if util_def.credit_cost <= 0 {
                    break;
                }
                if agent.credits < util_def.credit_cost {
                    break;
                }

                agent.credits -= util_def.credit_cost;
                utility_state.charges += 1;
            }
        }
    }

    /// Awards credits for a kill
    pub fn award_kill_credits(agent: &mut AgentState, rules: &RulesetDef) {
        agent.credits = (agent.credits + rules.kill_credits).min(rules.max_credits);
    }

    /// Applies round-end rewards to a team
    pub fn apply_round_end_rewards(
        agents: &mut [AgentState],
        won_round: bool,
        rules: &RulesetDef,
    ) {
        let delta = if won_round {
            rules.round_win_credits
        } else {
            rules.round_loss_credits
        };

        for agent in agents {
            agent.credits = (agent.credits + delta).min(rules.max_credits);
        }
    }

    /// Applies loss streak bonuses
    pub fn apply_loss_streak_bonus(
        agents: &mut [AgentState],
        loss_streak: i32,
        rules: &RulesetDef,
    ) {
        let bonus = if loss_streak > 0 && (loss_streak as usize) <= rules.loss_streak_bonuses.len() {
            rules.loss_streak_bonuses[(loss_streak - 1) as usize]
        } else {
            *rules.loss_streak_bonuses.last().unwrap_or(&0)
        };

        if bonus > 0 {
            for agent in agents {
                agent.credits = (agent.credits + bonus).min(rules.max_credits);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::defs::{
        AgentDef, CastType, EffectSpec, FireMode, RulesetDef, TraitBlock, UtilityDef,
        UtilityFamily, WeaponDef,
    };
    use crate::sim::AgentState;

    fn create_test_rules() -> RulesetDef {
        RulesetDef {
            id: "test".to_string(),
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

    fn create_test_agent_def() -> AgentDef {
        AgentDef {
            id: "test_agent".to_string(),
            display_name: "Test".to_string(),
            base_hp: 100.0,
            base_armor: 0.0,
            traits: TraitBlock::default(),
            loadout_weapon_ids: vec!["rifle".to_string()],
            loadout_utility_ids: vec!["smoke".to_string(), "flash".to_string()],
        }
    }

    fn create_test_utilities() -> HashMap<String, UtilityDef> {
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
                    kind: crate::defs::EffectKind::Smoke,
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
        utilities.insert(
            "flash".to_string(),
            UtilityDef {
                id: "flash".to_string(),
                family: UtilityFamily::CsGrenade,
                cast_type: CastType::ThrowArc,
                equip_time: 0.5,
                cast_time: 0.3,
                max_charges: 2,
                cooldown: 0.0,
                credit_cost: 200,
                is_signature: false,
                round_start_charges: 0,
                throw: None,
                projectile: None,
                effects: vec![],
            },
        );
        utilities
    }

    fn create_test_weapons() -> HashMap<String, WeaponDef> {
        let mut weapons = HashMap::new();
        weapons.insert(
            "rifle".to_string(),
            WeaponDef {
                id: "rifle".to_string(),
                fire_mode: FireMode::Auto,
                credit_cost: 2900,
                magazine_size: 30,
                rounds_per_minute: 600.0,
                reload_time: 2.5,
                damage: crate::defs::DamageProfile::default(),
                spread: crate::defs::SpreadProfile::default(),
                recoil: crate::defs::RecoilProfile::default(),
                penetration: crate::defs::PenetrationProfile::default(),
            },
        );
        weapons
    }

    #[test]
    fn test_initialize_agent() {
        let rules = create_test_rules();
        let agent_def = create_test_agent_def();
        let weapons = create_test_weapons();
        let utilities = create_test_utilities();

        let mut agent = AgentState::from_def(1, &agent_def, crate::defs::TeamSide::Attack);
        
        EconomySystem::initialize_agent(&mut agent, &agent_def, &rules, &weapons, &utilities);

        assert_eq!(agent.credits, 800);
        assert_eq!(agent.weapon.ammo_in_mag, 30);
        assert_eq!(agent.utilities.len(), 2);
    }

    #[test]
    fn test_round_start_reset() {
        let rules = create_test_rules();
        let agent_def = create_test_agent_def();
        let weapons = create_test_weapons();
        let utilities = create_test_utilities();

        let mut agent = AgentState::from_def(1, &agent_def, crate::defs::TeamSide::Attack);
        EconomySystem::initialize_agent(&mut agent, &agent_def, &rules, &weapons, &utilities);

        // Modify state
        agent.hp = 50.0;
        agent.stress = 0.5;
        agent.weapon.fire_cooldown = 1.0;

        EconomySystem::round_start(&mut agent, &agent_def, &rules, &weapons, &utilities);

        assert_eq!(agent.hp, 100.0);
        assert_eq!(agent.stress, 0.0);
        assert_eq!(agent.weapon.fire_cooldown, 0.0);
    }

    #[test]
    fn test_buy_utilities() {
        let rules = create_test_rules();
        let agent_def = create_test_agent_def();
        let weapons = create_test_weapons();
        let utilities = create_test_utilities();

        let mut agent = AgentState::from_def(1, &agent_def, crate::defs::TeamSide::Attack);
        agent.credits = 1000;
        
        EconomySystem::initialize_agent(&mut agent, &agent_def, &rules, &weapons, &utilities);
        EconomySystem::round_start(&mut agent, &agent_def, &rules, &weapons, &utilities);

        // Should have bought utilities with available credits
        let total_charges: i32 = agent.utilities.values().map(|u| u.charges).sum();
        assert!(total_charges > 0 || agent.credits < 200);
    }

    #[test]
    fn test_award_kill_credits() {
        let rules = create_test_rules();
        let mut agent = AgentState::from_def(1, &AgentDef::default(), crate::defs::TeamSide::Attack);
        agent.credits = 1000;

        EconomySystem::award_kill_credits(&mut agent, &rules);

        assert_eq!(agent.credits, 1200);
    }

    #[test]
    fn test_max_credits_cap() {
        let rules = create_test_rules();
        let mut agent = AgentState::from_def(1, &AgentDef::default(), crate::defs::TeamSide::Attack);
        agent.credits = 8900;

        EconomySystem::award_kill_credits(&mut agent, &rules);

        assert_eq!(agent.credits, 9000); // Capped at max
    }
}
