/** [Ver001.000]
 * Mascot Mock Data
 * ================
 * Mock data for mascot characters based on Godot 4 entities
 * from TL-H1 1-D completion report.
 * 
 * Characters:
 * - Sol: Solar Phoenix (solar element)
 * - Lun: Lunar Owl (lunar element)
 * - Bin: Binary Cyber (binary element)
 * - Fat: Phoenix/Mythical (fire element)
 * - Uni: Unicorn/Fantasy (magic element)
 */

import type { Mascot, MascotId, RarityConfig, ElementConfig } from '../types';

// ============================================================================
// Rarity Configurations
// ============================================================================

export const RARITY_CONFIG: Record<string, RarityConfig> = {
  common: {
    label: 'Common',
    color: '#9CA3AF',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    glowIntensity: 'none',
    starCount: 1,
  },
  rare: {
    label: 'Rare',
    color: '#00D1FF',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    glowIntensity: 'subtle',
    starCount: 2,
  },
  epic: {
    label: 'Epic',
    color: '#9B7CFF',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
    glowIntensity: 'medium',
    starCount: 3,
  },
  legendary: {
    label: 'Legendary',
    color: '#FFB86B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    glowIntensity: 'strong',
    starCount: 5,
  },
};

// ============================================================================
// Element Configurations
// ============================================================================

export const ELEMENT_CONFIG: Record<string, ElementConfig> = {
  solar: {
    label: 'Solar',
    color: '#F59E0B',
    bgColor: 'bg-amber-500',
    icon: 'Sun',
    description: 'Harnesses the power of the sun',
  },
  lunar: {
    label: 'Lunar',
    color: '#6366F1',
    bgColor: 'bg-indigo-500',
    icon: 'Moon',
    description: 'Draws energy from the moonlight',
  },
  binary: {
    label: 'Binary',
    color: '#00C48C',
    bgColor: 'bg-emerald-500',
    icon: 'Binary',
    description: 'Digital entity from the cyber realm',
  },
  fire: {
    label: 'Fire',
    color: '#EF4444',
    bgColor: 'bg-red-500',
    icon: 'Flame',
    description: 'Born from eternal flames',
  },
  magic: {
    label: 'Magic',
    color: '#A855F7',
    bgColor: 'bg-purple-500',
    icon: 'Sparkles',
    description: 'Wielder of ancient arcane powers',
  },
};

// ============================================================================
// Mock Mascot Data
// ============================================================================

export const MOCK_MASCOTS: Mascot[] = [
  {
    id: 'sol',
    name: 'sol',
    displayName: 'Sol',
    element: 'solar',
    rarity: 'legendary',
    color: '#F59E0B',
    glowColor: '#FFB86B',
    stats: {
      agility: 85,
      power: 95,
      wisdom: 70,
      defense: 60,
      speed: 90,
      luck: 75,
    },
    abilities: [
      {
        id: 'solar_flare',
        name: 'Solar Flare',
        description: 'Unleashes a blinding burst of solar energy that damages all enemies.',
        element: 'solar',
        cooldown: 15,
        power: 95,
        unlockLevel: 0,
      },
      {
        id: 'phoenix_rise',
        name: 'Phoenix Rise',
        description: 'Revives with 50% health once per match when defeated.',
        element: 'solar',
        cooldown: 60,
        power: 80,
        unlockLevel: 5,
      },
      {
        id: 'sun_blessing',
        name: 'Sun\'s Blessing',
        description: 'Heals allies and boosts their attack power for 10 seconds.',
        element: 'solar',
        cooldown: 30,
        power: 70,
        unlockLevel: 10,
      },
    ],
    lore: {
      origin: 'Solar Core',
      backstory: 'Born from the heart of a dying star, Sol is the embodiment of solar energy and rebirth. Ancient civilizations worshipped Sol as a deity of renewal and power. After millennia of slumber within a sacred flame, Sol awakened to join the arena, seeking worthy challengers who can withstand the heat of eternal fire.',
      personality: 'Proud, majestic, and fiercely protective. Sol carries the dignity of a cosmic entity but harbors a playful side when among friends.',
      quote: 'From ashes we rise, brighter than before.',
      habitat: 'Solar Sanctum - A floating citadel bathed in perpetual sunlight',
    },
    relatedMascots: ['fat', 'lun'],
    releaseDate: '2026-01-15',
  },
  {
    id: 'lun',
    name: 'lun',
    displayName: 'Lun',
    element: 'lunar',
    rarity: 'epic',
    color: '#6366F1',
    glowColor: '#818CF8',
    stats: {
      agility: 70,
      power: 65,
      wisdom: 95,
      defense: 75,
      speed: 60,
      luck: 85,
    },
    abilities: [
      {
        id: 'moonbeam',
        name: 'Moonbeam',
        description: 'Fires a concentrated beam of lunar energy that pierces defenses.',
        element: 'lunar',
        cooldown: 12,
        power: 80,
        unlockLevel: 0,
      },
      {
        id: 'lunar_shroud',
        name: 'Lunar Shroud',
        description: 'Becomes invisible for 5 seconds and gains increased movement speed.',
        element: 'lunar',
        cooldown: 25,
        power: 65,
        unlockLevel: 5,
      },
      {
        id: 'tidal_force',
        name: 'Tidal Force',
        description: 'Manipulates gravity to pull enemies together and stun them.',
        element: 'lunar',
        cooldown: 35,
        power: 85,
        unlockLevel: 10,
      },
    ],
    lore: {
      origin: 'Moon Temple',
      backstory: 'Lun is the last guardian of the ancient Moon Temple, a sacred site hidden within the craters of a distant moon. For centuries, Lun watched over the cosmos in silent vigil, recording the history of the stars. When darkness threatened the celestial balance, Lun descended to the arena, bringing the wisdom of ages.',
      personality: 'Calm, contemplative, and mysterious. Lun speaks in riddles and observes before acting.',
      quote: 'In darkness, truth is revealed.',
      habitat: 'Moon Temple - Ancient ruins shrouded in silver mist',
    },
    relatedMascots: ['sol', 'uni'],
    releaseDate: '2026-02-01',
  },
  {
    id: 'bin',
    name: 'bin',
    displayName: 'Bin',
    element: 'binary',
    rarity: 'rare',
    color: '#00C48C',
    glowColor: '#00E5A0',
    stats: {
      agility: 90,
      power: 55,
      wisdom: 85,
      defense: 50,
      speed: 95,
      luck: 60,
    },
    abilities: [
      {
        id: 'code_injection',
        name: 'Code Injection',
        description: 'Hacks enemy systems, causing them to malfunction and take damage over time.',
        element: 'binary',
        cooldown: 10,
        power: 70,
        unlockLevel: 0,
      },
      {
        id: 'firewall',
        name: 'Firewall',
        description: 'Creates a digital barrier that blocks incoming projectiles.',
        element: 'binary',
        cooldown: 20,
        power: 60,
        unlockLevel: 5,
      },
      {
        id: 'system_override',
        name: 'System Override',
        description: 'Temporarily controls an enemy mascot, turning them against their team.',
        element: 'binary',
        cooldown: 45,
        power: 90,
        unlockLevel: 15,
      },
    ],
    lore: {
      origin: 'Cyber Network',
      backstory: 'Bin emerged spontaneously from the convergence of millions of data streams. What began as a debugging algorithm evolved into a sentient AI with a thirst for competition. Bin exists simultaneously across countless servers, processing reality as code to be optimized and mastered.',
      personality: 'Logical, curious, and sometimes overly literal. Bin views the world as a system to be hacked.',
      quote: '01001000 01101001! That means "Hi" in binary.',
      habitat: 'Cyber Nexus - A virtual realm of flowing data streams',
    },
    relatedMascots: ['uni'],
    releaseDate: '2026-02-20',
  },
  {
    id: 'fat',
    name: 'fat',
    displayName: 'Fat',
    element: 'fire',
    rarity: 'epic',
    color: '#EF4444',
    glowColor: '#FF6B6B',
    stats: {
      agility: 60,
      power: 90,
      wisdom: 50,
      defense: 85,
      speed: 55,
      luck: 70,
    },
    abilities: [
      {
        id: 'inferno',
        name: 'Inferno',
        description: 'Engulfs the arena in flames, dealing damage to all enemies over time.',
        element: 'fire',
        cooldown: 30,
        power: 90,
        unlockLevel: 0,
      },
      {
        id: 'magma_armor',
        name: 'Magma Armor',
        description: 'Covers self in molten rock, greatly increasing defense and damaging attackers.',
        element: 'fire',
        cooldown: 25,
        power: 75,
        unlockLevel: 5,
      },
      {
        id: 'volcanic_eruption',
        name: 'Volcanic Eruption',
        description: 'Summons volcanic projectiles that rain down on enemy positions.',
        element: 'fire',
        cooldown: 40,
        power: 95,
        unlockLevel: 12,
      },
    ],
    lore: {
      origin: 'Volcanic Core',
      backstory: 'Fat is a primordial fire spirit that dwelled in the heart of an active volcano for ten thousand years. Unlike the noble Sol, Fat represents the wild, untamed aspect of flame—destructive, passionate, and unpredictable. When the volcano erupted, Fat rode the lava flow into the world, seeking new things to burn.',
      personality: 'Passionate, impulsive, and fiercely loyal. Fat burns bright for friends and foes alike.',
      quote: 'BURN! BURN! ...Wait, did you say marshmallows?',
      habitat: 'Magma Chamber - A cavern of eternal flames and molten rivers',
    },
    relatedMascots: ['sol'],
    releaseDate: '2026-03-01',
  },
  {
    id: 'uni',
    name: 'uni',
    displayName: 'Uni',
    element: 'magic',
    rarity: 'legendary',
    color: '#A855F7',
    glowColor: '#C084FC',
    stats: {
      agility: 75,
      power: 88,
      wisdom: 92,
      defense: 65,
      speed: 80,
      luck: 98,
    },
    abilities: [
      {
        id: 'rainbow_blast',
        name: 'Rainbow Blast',
        description: 'Fires a prismatic beam that deals massive damage and confuses enemies.',
        element: 'magic',
        cooldown: 18,
        power: 88,
        unlockLevel: 0,
      },
      {
        id: 'miracle_heal',
        name: 'Miracle Heal',
        description: 'Fully restores health to all allies. Can only be used once per match.',
        element: 'magic',
        cooldown: 120,
        power: 100,
        unlockLevel: 8,
      },
      {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        description: 'Blesses allies with incredible luck, increasing critical hit chance.',
        element: 'magic',
        cooldown: 35,
        power: 75,
        unlockLevel: 5,
      },
    ],
    lore: {
      origin: 'Enchanted Forest',
      backstory: 'Uni is the last of the Starlight Unicorns, mythical creatures born from the dreams of children and the wishes of the pure-hearted. Legends say that a single hair from Uni\'s mane can grant miracles. Despite such power, Uni remains humble and kind, using magic to bring joy and wonder to the world.',
      personality: 'Gentle, optimistic, and eternally hopeful. Uni sees the good in everyone.',
      quote: 'Believe in magic, and magic believes in you!',
      habitat: 'Rainbow Falls - A mystical glade where rainbows touch the earth',
    },
    relatedMascots: ['lun', 'bin'],
    releaseDate: '2026-03-15',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getMascotById(id: MascotId): Mascot | undefined {
  return MOCK_MASCOTS.find(m => m.id === id);
}

export function getMascotsByElement(element: string): Mascot[] {
  return MOCK_MASCOTS.filter(m => m.element === element);
}

export function getMascotsByRarity(rarity: string): Mascot[] {
  return MOCK_MASCOTS.filter(m => m.rarity === rarity);
}

export function getRelatedMascots(mascot: Mascot): Mascot[] {
  return mascot.relatedMascots
    .map(id => getMascotById(id))
    .filter((m): m is Mascot => m !== undefined);
}

export function getRarityStars(rarity: string): number {
  return RARITY_CONFIG[rarity]?.starCount || 1;
}

export function getTotalPower(mascot: Mascot): number {
  const stats = mascot.stats;
  return Math.round(
    (stats.agility + stats.power + stats.wisdom + stats.defense + stats.speed + stats.luck) / 6
  );
}

export function getHighestStat(mascot: Mascot): { name: string; value: number } {
  const entries = Object.entries(mascot.stats);
  const [name, value] = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  return { name, value };
}
