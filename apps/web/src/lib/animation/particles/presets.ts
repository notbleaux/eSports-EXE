/**
 * Particle Effect Presets
 * 
 * [Ver001.000] - Mascot ability VFX presets
 * 
 * Provides:
 * - Fire burst (Fat mascot)
 * - Star sparkle (Uni mascot)
 * - Digital rain (Bin mascot)
 * - Solar flare (Sol mascot)
 * - Lunar mist (Lun mascot)
 */

import * as THREE from 'three';
import { 
  EmitterConfig, 
  Particle, 
  DEFAULT_EMITTER_CONFIG,
  randomPointInSphere,
  randomPointOnCircle,
  Easing,
  lerpColor,
} from './system';

// ============================================
// Effect Preset Type
// ============================================

export interface EffectPreset {
  name: string;
  description: string;
  mascotId: 'fat' | 'uni' | 'bin' | 'sol' | 'lun';
  config: Partial<EmitterConfig>;
  burstCount?: number;
}

// ============================================
// Fire Burst - Fat Mascot
// ============================================

export const FireBurstPreset: EffectPreset = {
  name: 'Fire Burst',
  description: 'Explosive flame particles for Fat mascot abilities',
  mascotId: 'fat',
  config: {
    emissionRate: 200,
    maxParticles: 800,
    lifetime: { min: 0.5, max: 1.5 },
    positionOffset: { x: 0, y: 0, z: 0 },
    positionSpread: { x: 0.3, y: 0.3, z: 0.3 },
    velocity: { x: 0, y: 2, z: 0 },
    velocitySpread: { x: 1.5, y: 2, z: 1.5 },
    size: { min: 0.2, max: 0.8 },
    sizeOverLifetime: [1, 1.2, 1.1, 0.9, 0.6, 0.3, 0],
    color: new THREE.Color(1, 0.4, 0),
    colorVariation: 0.2,
    opacityOverLifetime: [0, 0.8, 1, 1, 0.8, 0.4, 0],
    gravity: 2, // Positive gravity for rising flames
    drag: 0.3,
    blending: THREE.AdditiveBlending,
    billboard: true,
    customUpdate: (particle: Particle, deltaTime: number) => {
      // Flames flicker and rise
      const flicker = Math.sin(particle.age * 15 + particle.id) * 0.1;
      particle.size += flicker * deltaTime;
      
      // Color shifts from yellow to red to smoke
      const lifeRatio = particle.age / particle.lifetime;
      if (lifeRatio < 0.3) {
        // Yellow core
        particle.color.setRGB(1, 0.9 + flicker, 0.2);
      } else if (lifeRatio < 0.6) {
        // Orange middle
        particle.color.setRGB(1, 0.5 + flicker * 0.5, 0);
      } else {
        // Red outer with smoke
        particle.color.setRGB(0.8 - lifeRatio * 0.3, 0.3 - lifeRatio * 0.2, 0.1);
      }
      
      // Add turbulence
      particle.velocity.x += Math.sin(particle.age * 5 + particle.position.y) * 0.5 * deltaTime;
      particle.velocity.z += Math.cos(particle.age * 5 + particle.position.x) * 0.5 * deltaTime;
    },
  },
  burstCount: 100,
};

/** Create intense fire burst config */
export function createFireBurstConfig(intensity: number = 1): Partial<EmitterConfig> {
  return {
    ...FireBurstPreset.config,
    emissionRate: (FireBurstPreset.config.emissionRate || 200) * intensity,
    velocity: {
      x: 0,
      y: 2 * intensity,
      z: 0,
    },
    size: {
      min: 0.2 * intensity,
      max: 0.8 * intensity,
    },
  };
}

// ============================================
// Star Sparkle - Uni Mascot
// ============================================

export const StarSparklePreset: EffectPreset = {
  name: 'Star Sparkle',
  description: 'Magical star particles for Uni mascot abilities',
  mascotId: 'uni',
  config: {
    emissionRate: 50,
    maxParticles: 300,
    lifetime: { min: 1, max: 3 },
    positionOffset: { x: 0, y: 0, z: 0 },
    positionSpread: { x: 2, y: 2, z: 2 },
    velocity: { x: 0, y: 0.5, z: 0 },
    velocitySpread: { x: 0.3, y: 0.3, z: 0.3 },
    size: { min: 0.1, max: 0.4 },
    sizeOverLifetime: [0, 1, 1, 0.9, 0.7, 0.4, 0],
    color: new THREE.Color(1, 0.9, 0.4),
    colorVariation: 0.15,
    opacityOverLifetime: [0, 0, 1, 1, 1, 0.5, 0],
    gravity: -0.5, // Float upward
    drag: 0.05,
    blending: THREE.AdditiveBlending,
    billboard: true,
    customUpdate: (particle: Particle, deltaTime: number) => {
      // Twinkle effect
      const twinkle = Math.sin(particle.age * 8 + particle.id * 0.5) * 0.3 + 0.7;
      particle.opacity = Math.min(1, particle.opacity * twinkle);
      
      // Gentle spiral motion
      const angle = particle.age * 2 + particle.id;
      const radius = 0.1 * Math.sin(particle.age * 3);
      particle.velocity.x += Math.cos(angle) * radius * deltaTime;
      particle.velocity.z += Math.sin(angle) * radius * deltaTime;
      
      // Rainbow color shift
      const hue = (particle.id * 0.1 + particle.age * 0.2) % 1;
      const rainbowColor = new THREE.Color().setHSL(hue, 0.8, 0.7);
      particle.color.lerp(rainbowColor, 0.05);
    },
  },
  burstCount: 30,
};

/** Create magical sparkle config */
export function createStarSparkleConfig(magicLevel: number = 1): Partial<EmitterConfig> {
  return {
    ...StarSparklePreset.config,
    emissionRate: (StarSparklePreset.config.emissionRate || 50) * magicLevel,
    positionSpread: {
      x: 2 * magicLevel,
      y: 2 * magicLevel,
      z: 2 * magicLevel,
    },
    lifetime: {
      min: 1 * magicLevel,
      max: 3 * magicLevel,
    },
  };
}

// ============================================
// Digital Rain - Bin Mascot
// ============================================

export const DigitalRainPreset: EffectPreset = {
  name: 'Digital Rain',
  description: 'Matrix-style digital particles for Bin mascot abilities',
  mascotId: 'bin',
  config: {
    emissionRate: 150,
    maxParticles: 600,
    lifetime: { min: 0.8, max: 2 },
    positionOffset: { x: 0, y: 3, z: 0 },
    positionSpread: { x: 4, y: 0, z: 4 },
    velocity: { x: 0, y: -4, z: 0 },
    velocitySpread: { x: 0.2, y: 1, z: 0.2 },
    size: { min: 0.05, max: 0.15 },
    sizeOverLifetime: [1, 1, 1, 1, 0.8, 0.5, 0],
    color: new THREE.Color(0, 1, 0.3),
    colorVariation: 0.1,
    opacityOverLifetime: [1, 1, 1, 0.9, 0.7, 0.4, 0],
    gravity: -2,
    drag: 0.1,
    blending: THREE.AdditiveBlending,
    billboard: true,
    customUpdate: (particle: Particle, deltaTime: number) => {
      // Binary flicker - on/off
      const binaryFlicker = Math.sin(particle.age * 20 + particle.id) > 0 ? 1 : 0.3;
      particle.opacity *= binaryFlicker;
      
      // Glitch effect
      if (Math.random() < 0.02) {
        particle.position.x += (Math.random() - 0.5) * 0.2;
        particle.color.setRGB(0.2, 1, 0.4);
      }
      
      // Trail effect - stretch vertically
      const speed = particle.velocity.length();
      particle.size = Math.max(0.05, speed * 0.1);
      
      // Color based on speed
      const speedRatio = Math.min(1, speed / 5);
      particle.color.setRGB(0.2 * (1 - speedRatio), 1, 0.3 + speedRatio * 0.4);
    },
  },
  burstCount: 50,
};

/** Create digital rain config */
export function createDigitalRainConfig(density: number = 1): Partial<EmitterConfig> {
  return {
    ...DigitalRainPreset.config,
    emissionRate: (DigitalRainPreset.config.emissionRate || 150) * density,
    velocity: {
      x: 0,
      y: -4 * density,
      z: 0,
    },
    positionSpread: {
      x: 4 * density,
      y: 0,
      z: 4 * density,
    },
  };
}

// ============================================
// Solar Flare - Sol Mascot
// ============================================

export const SolarFlarePreset: EffectPreset = {
  name: 'Solar Flare',
  description: 'Radiant solar particles for Sol mascot abilities',
  mascotId: 'sol',
  config: {
    emissionRate: 100,
    maxParticles: 500,
    lifetime: { min: 0.5, max: 1.5 },
    positionOffset: { x: 0, y: 0, z: 0 },
    positionSpread: { x: 0.1, y: 0.1, z: 0.1 },
    velocity: { x: 0, y: 0, z: 0 },
    velocitySpread: { x: 3, y: 3, z: 3 },
    size: { min: 0.3, max: 0.8 },
    sizeOverLifetime: [0.5, 1, 1.2, 1.1, 0.9, 0.5, 0],
    color: new THREE.Color(1, 0.8, 0.2),
    colorVariation: 0.1,
    opacityOverLifetime: [0, 1, 1, 0.9, 0.7, 0.3, 0],
    gravity: 0,
    drag: 0.2,
    blending: THREE.AdditiveBlending,
    billboard: true,
    customUpdate: (particle: Particle, deltaTime: number) => {
      // Radial burst outward
      const direction = particle.velocity.clone().normalize();
      const speed = particle.velocity.length();
      
      // Accelerate then decelerate
      const lifeRatio = particle.age / particle.lifetime;
      if (lifeRatio < 0.2) {
        particle.velocity.addScaledVector(direction, 5 * deltaTime);
      } else {
        particle.velocity.multiplyScalar(0.95);
      }
      
      // Pulse size
      const pulse = Math.sin(particle.age * 10 + particle.id) * 0.2 + 1;
      particle.size *= pulse;
      
      // Color temperature shift
      if (lifeRatio < 0.3) {
        // White hot core
        particle.color.setRGB(1, 0.95, 0.8);
      } else if (lifeRatio < 0.6) {
        // Golden
        particle.color.setRGB(1, 0.8, 0.2);
      } else {
        // Orange red
        particle.color.setRGB(1, 0.5 - lifeRatio * 0.2, 0.1);
      }
      
      // Corona effect - particles orbit slightly
      const orbitAngle = particle.age * 3 + particle.id;
      particle.velocity.x += Math.cos(orbitAngle) * 0.5 * deltaTime;
      particle.velocity.y += Math.sin(orbitAngle) * 0.5 * deltaTime;
    },
  },
  burstCount: 80,
};

/** Create solar flare config */
export function createSolarFlareConfig(intensity: number = 1): Partial<EmitterConfig> {
  return {
    ...SolarFlarePreset.config,
    emissionRate: (SolarFlarePreset.config.emissionRate || 100) * intensity,
    velocitySpread: {
      x: 3 * intensity,
      y: 3 * intensity,
      z: 3 * intensity,
    },
    size: {
      min: 0.3 * intensity,
      max: 0.8 * intensity,
    },
  };
}

// ============================================
// Lunar Mist - Lun Mascot
// ============================================

export const LunarMistPreset: EffectPreset = {
  name: 'Lunar Mist',
  description: 'Ethereal moonlight particles for Lun mascot abilities',
  mascotId: 'lun',
  config: {
    emissionRate: 40,
    maxParticles: 250,
    lifetime: { min: 2, max: 5 },
    positionOffset: { x: 0, y: 0, z: 0 },
    positionSpread: { x: 3, y: 1, z: 3 },
    velocity: { x: 0, y: 0.3, z: 0 },
    velocitySpread: { x: 0.5, y: 0.2, z: 0.5 },
    size: { min: 0.4, max: 1 },
    sizeOverLifetime: [0, 0.5, 0.8, 1, 1, 0.8, 0.4],
    color: new THREE.Color(0.8, 0.9, 1),
    colorVariation: 0.08,
    opacityOverLifetime: [0, 0.2, 0.4, 0.5, 0.4, 0.2, 0],
    gravity: -0.2,
    drag: 0.3,
    blending: THREE.AdditiveBlending,
    billboard: true,
    customUpdate: (particle: Particle, deltaTime: number) => {
      // Gentle drift with sine wave
      const drift = Math.sin(particle.age * 2 + particle.id * 0.5) * 0.5;
      particle.velocity.x += drift * deltaTime * 0.5;
      
      // Breathing size effect
      const breath = Math.sin(particle.age * 1.5 + particle.id) * 0.15 + 1;
      particle.size = particle.size * 0.99 + particle.size * breath * 0.01;
      
      // Phase through opacity
      const phase = Math.sin(particle.age * 0.8 + particle.id) * 0.3 + 0.7;
      particle.opacity = particle.opacity * 0.98 + phase * 0.02;
      
      // Color shifts slightly blue/silver
      const silverShift = Math.sin(particle.age + particle.id) * 0.1;
      particle.color.setRGB(
        0.8 + silverShift * 0.1,
        0.9 + silverShift * 0.05,
        1
      );
      
      // Particles slowly orbit around center
      const orbitSpeed = 0.5;
      const orbitRadius = 0.1;
      const angle = particle.age * orbitSpeed + particle.id;
      particle.position.x += Math.cos(angle) * orbitRadius * deltaTime;
      particle.position.z += Math.sin(angle) * orbitRadius * deltaTime;
    },
  },
  burstCount: 20,
};

/** Create lunar mist config */
export function createLunarMistConfig(phase: 'full' | 'crescent' | 'blood' = 'full'): Partial<EmitterConfig> {
  const baseConfig = { ...LunarMistPreset.config };
  
  switch (phase) {
    case 'crescent':
      return {
        ...baseConfig,
        color: new THREE.Color(0.9, 0.95, 1),
        emissionRate: 30,
        positionSpread: { x: 2, y: 0.5, z: 2 },
      };
    case 'blood':
      return {
        ...baseConfig,
        color: new THREE.Color(0.9, 0.3, 0.2),
        colorVariation: 0.15,
        emissionRate: 60,
      };
    case 'full':
    default:
      return baseConfig;
  }
}

// ============================================
// Preset Registry
// ============================================

export const EffectPresets = {
  fireBurst: FireBurstPreset,
  starSparkle: StarSparklePreset,
  digitalRain: DigitalRainPreset,
  solarFlare: SolarFlarePreset,
  lunarMist: LunarMistPreset,
} as const;

export type EffectPresetName = keyof typeof EffectPresets;

/** Get preset by name */
export function getPreset(name: EffectPresetName): EffectPreset {
  return EffectPresets[name];
}

/** Get preset by mascot ID */
export function getPresetForMascot(mascotId: 'fat' | 'uni' | 'bin' | 'sol' | 'lun'): EffectPreset {
  switch (mascotId) {
    case 'fat':
      return FireBurstPreset;
    case 'uni':
      return StarSparklePreset;
    case 'bin':
      return DigitalRainPreset;
    case 'sol':
      return SolarFlarePreset;
    case 'lun':
      return LunarMistPreset;
  }
}

/** Get all preset names */
export function getAllPresetNames(): EffectPresetName[] {
  return Object.keys(EffectPresets) as EffectPresetName[];
}

/** Get preset descriptions */
export function getPresetDescriptions(): Record<EffectPresetName, { name: string; description: string; mascotId: string }> {
  return {
    fireBurst: {
      name: FireBurstPreset.name,
      description: FireBurstPreset.description,
      mascotId: FireBurstPreset.mascotId,
    },
    starSparkle: {
      name: StarSparklePreset.name,
      description: StarSparklePreset.description,
      mascotId: StarSparklePreset.mascotId,
    },
    digitalRain: {
      name: DigitalRainPreset.name,
      description: DigitalRainPreset.description,
      mascotId: DigitalRainPreset.mascotId,
    },
    solarFlare: {
      name: SolarFlarePreset.name,
      description: SolarFlarePreset.description,
      mascotId: SolarFlarePreset.mascotId,
    },
    lunarMist: {
      name: LunarMistPreset.name,
      description: LunarMistPreset.description,
      mascotId: LunarMistPreset.mascotId,
    },
  };
}

// ============================================
// Ability Effect Combinations
// ============================================

export interface AbilityEffect {
  preset: EffectPresetName;
  position: THREE.Vector3;
  duration: number;
  intensity: number;
  burstAtStart: boolean;
  burstCount: number;
}

/** Create ability effect configuration */
export function createAbilityEffect(
  mascotId: 'fat' | 'uni' | 'bin' | 'sol' | 'lun',
  abilityType: 'attack' | 'defense' | 'special' | 'ultimate',
  position: THREE.Vector3
): AbilityEffect {
  const preset = getPresetForMascot(mascotId);
  
  let intensity = 1;
  let duration = 2;
  
  switch (abilityType) {
    case 'attack':
      intensity = 1;
      duration = 1;
      break;
    case 'defense':
      intensity = 0.7;
      duration = 3;
      break;
    case 'special':
      intensity = 1.5;
      duration = 2.5;
      break;
    case 'ultimate':
      intensity = 2.5;
      duration = 4;
      break;
  }
  
  return {
    preset: Object.keys(EffectPresets).find(
      key => EffectPresets[key as EffectPresetName].mascotId === mascotId
    ) as EffectPresetName,
    position: position.clone(),
    duration,
    intensity,
    burstAtStart: abilityType === 'attack' || abilityType === 'ultimate',
    burstCount: (preset.burstCount || 50) * intensity,
  };
}
