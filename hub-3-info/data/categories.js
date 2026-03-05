/**
 * Game Categories Data for 12-Section Radial Menu
 * Organized by genre with subcategories
 */

export const GAME_CATEGORIES = [
  {
    id: 'fps',
    name: 'FPS',
    fullName: 'First-Person Shooter',
    icon: '🎯',
    color: '#ff6b6b',
    description: 'Tactical and arena shooters',
    subCategories: [
      { id: 'tactical', name: 'Tactical', count: 342 },
      { id: 'arena', name: 'Arena', count: 128 },
      { id: 'battle-royale', name: 'Battle Royale', count: 89 },
      { id: 'extraction', name: 'Extraction', count: 45 },
      { id: 'hero', name: 'Hero Shooter', count: 67 },
      { id: 'retro', name: 'Retro/Classic', count: 156 }
    ],
    totalTeams: 827,
    trending: ['Counter-Strike 2', 'Valorant', 'Apex Legends']
  },
  {
    id: 'moba',
    name: 'MOBA',
    fullName: 'Multiplayer Online Battle Arena',
    icon: '⚔️',
    color: '#4ecdc4',
    description: 'Strategic team-based combat',
    subCategories: [
      { id: '5v5', name: '5v5 Classic', count: 523 },
      { id: '3v3', name: '3v3 Fast', count: 89 },
      { id: 'auto', name: 'Auto Battler', count: 134 },
      { id: 'mobile', name: 'Mobile MOBA', count: 267 }
    ],
    totalTeams: 1013,
    trending: ['League of Legends', 'Dota 2', 'Mobile Legends']
  },
  {
    id: 'battle-royale',
    name: 'Battle Royale',
    fullName: 'Battle Royale',
    icon: '🏆',
    color: '#ffe66d',
    description: 'Last player standing',
    subCategories: [
      { id: 'solo', name: 'Solo', count: 234 },
      { id: 'duo', name: 'Duo', count: 189 },
      { id: 'squad', name: 'Squad', count: 312 },
      { id: 'fps-br', name: 'FPS Hybrid', count: 156 }
    ],
    totalTeams: 891,
    trending: ['PUBG', 'Fortnite', 'Call of Duty: Warzone']
  },
  {
    id: 'rpg',
    name: 'RPG',
    fullName: 'Role-Playing Games',
    icon: '🗡️',
    color: '#a8e6cf',
    description: 'Character-driven adventures',
    subCategories: [
      { id: 'mmorpg', name: 'MMORPG', count: 423 },
      { id: 'arpg', name: 'Action RPG', count: 178 },
      { id: 'jrpg', name: 'JRPG', count: 89 },
      { id: 'wrpg', name: 'Western RPG', count: 67 }
    ],
    totalTeams: 757,
    trending: ['World of Warcraft', 'Final Fantasy XIV', 'Genshin Impact']
  },
  {
    id: 'racing',
    name: 'Racing',
    fullName: 'Racing Games',
    icon: '🏎️',
    color: '#ff8b94',
    description: 'High-speed competition',
    subCategories: [
      { id: 'sim', name: 'Simulation', count: 89 },
      { id: 'arcade', name: 'Arcade', count: 134 },
      { id: 'kart', name: 'Kart Racing', count: 45 },
      { id: 'rally', name: 'Rally', count: 56 }
    ],
    totalTeams: 324,
    trending: ['iRacing', 'F1', 'Forza Motorsport']
  },
  {
    id: 'sports',
    name: 'Sports',
    fullName: 'Sports Games',
    icon: '⚽',
    color: '#c7ceea',
    description: 'Athletic esports',
    subCategories: [
      { id: 'football', name: 'Football/Soccer', count: 234 },
      { id: 'basketball', name: 'Basketball', count: 89 },
      { id: 'fifa', name: 'FIFA/EA FC', count: 312 },
      { id: 'nba', name: 'NBA 2K', count: 67 },
      { id: 'rocket', name: 'Rocket League', count: 178 }
    ],
    totalTeams: 880,
    trending: ['EA FC 24', 'NBA 2K24', 'Rocket League']
  },
  {
    id: 'strategy',
    name: 'Strategy',
    fullName: 'Strategy Games',
    icon: '♟️',
    color: '#ffd93d',
    description: 'Tactical mastery',
    subCategories: [
      { id: 'rts', name: 'Real-Time Strategy', count: 156 },
      { id: 'turn', name: 'Turn-Based', count: 89 },
      { id: '4x', name: '4X Strategy', count: 34 },
      { id: 'tactics', name: 'Tactics', count: 78 }
    ],
    totalTeams: 357,
    trending: ['StarCraft II', 'Age of Empires IV', 'Total War']
  },
  {
    id: 'simulation',
    name: 'Simulation',
    fullName: 'Simulation Games',
    icon: '🎮',
    color: '#6bcb77',
    description: 'Real-world experiences',
    subCategories: [
      { id: 'flight', name: 'Flight Sim', count: 45 },
      { id: 'life', name: 'Life Sim', count: 23 },
      { id: 'vehicle', name: 'Vehicle Sim', count: 67 },
      { id: 'city', name: 'City Building', count: 34 }
    ],
    totalTeams: 169,
    trending: ['Microsoft Flight Sim', 'Cities: Skylines', 'The Sims']
  },
  {
    id: 'fighting',
    name: 'Fighting',
    fullName: 'Fighting Games',
    icon: '👊',
    color: '#ff9f45',
    description: 'Hand-to-hand combat',
    subCategories: [
      { id: '2d', name: '2D Fighters', count: 89 },
      { id: '3d', name: '3D Fighters', count: 56 },
      { id: 'platform', name: 'Platform Fighters', count: 78 }
    ],
    totalTeams: 223,
    trending: ['Street Fighter 6', 'Tekken 8', 'Super Smash Bros']
  },
  {
    id: 'adventure',
    name: 'Adventure',
    fullName: 'Adventure Games',
    icon: '🗺️',
    color: '#9b59b6',
    description: 'Story-driven journeys',
    subCategories: [
      { id: 'action', name: 'Action-Adventure', count: 134 },
      { id: 'survival', name: 'Survival', count: 89 },
      { id: 'open', name: 'Open World', count: 156 }
    ],
    totalTeams: 379,
    trending: ['Minecraft', 'Terraria', 'Rust']
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    fullName: 'Puzzle Games',
    icon: '🧩',
    color: '#3498db',
    description: 'Mind challenges',
    subCategories: [
      { id: 'tetris', name: 'Tetris', count: 45 },
      { id: 'match3', name: 'Match-3', count: 23 },
      { id: 'physics', name: 'Physics', count: 34 }
    ],
    totalTeams: 102,
    trending: ['Tetris', 'Puyo Puyo', 'Portal']
  },
  {
    id: 'indie',
    name: 'Indie',
    fullName: 'Independent Games',
    icon: '💎',
    color: '#e74c3c',
    description: 'Creative originals',
    subCategories: [
      { id: 'roguelike', name: 'Roguelike', count: 78 },
      { id: 'platformer', name: 'Platformer', count: 89 },
      { id: 'experimental', name: 'Experimental', count: 45 }
    ],
    totalTeams: 212,
    trending: ['Hades', 'Celeste', 'Hollow Knight']
  }
];

export const getCategoryById = (id) => GAME_CATEGORIES.find(cat => cat.id === id);

export const getTotalTeams = () => GAME_CATEGORIES.reduce((acc, cat) => acc + cat.totalTeams, 0);

export const getTotalCategories = () => GAME_CATEGORIES.length;

export default GAME_CATEGORIES;
