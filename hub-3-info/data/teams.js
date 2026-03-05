/**
 * Teams Data - 2,135 Teams Directory
 * Sample data for the conical directory visualization
 */

export const TEAMS_DATA = {
  total: 2135,
  regions: [
    { id: 'na', name: 'North America', count: 523, color: '#ff6b6b' },
    { id: 'eu', name: 'Europe', count: 678, color: '#4ecdc4' },
    { id: 'asia', name: 'Asia Pacific', count: 712, color: '#ffe66d' },
    { id: 'sa', name: 'South America', count: 134, color: '#a8e6cf' },
    { id: 'mea', name: 'Middle East & Africa', count: 88, color: '#ff8b94' }
  ],
  tiers: [
    { id: 'tier-s', name: 'Tier S', count: 45, description: 'World Elite' },
    { id: 'tier-a', name: 'Tier A', count: 156, description: 'Professional' },
    { id: 'tier-b', name: 'Tier B', count: 423, description: 'Semi-Pro' },
    { id: 'tier-c', name: 'Tier C', count: 892, description: 'Amateur' },
    { id: 'tier-d', name: 'Tier D', count: 619, description: 'Emerging' }
  ],
  sampleTeams: [
    { id: 1, name: 'Nexus Gaming', region: 'na', tier: 'tier-s', category: 'fps', members: 5, founded: 2020, earnings: '$2.4M' },
    { id: 2, name: 'Apex Predators', region: 'eu', tier: 'tier-s', category: 'battle-royale', members: 4, founded: 2019, earnings: '$1.8M' },
    { id: 3, name: 'Phantom Legion', region: 'asia', tier: 'tier-a', category: 'moba', members: 5, founded: 2021, earnings: '$890K' },
    { id: 4, name: 'Storm Riders', region: 'na', tier: 'tier-a', category: 'moba', members: 5, founded: 2018, earnings: '$1.2M' },
    { id: 5, name: 'Cyber Wolves', region: 'eu', tier: 'tier-b', category: 'fps', members: 5, founded: 2022, earnings: '$320K' },
    { id: 6, name: 'Neon Dragons', region: 'asia', tier: 'tier-s', category: 'rpg', members: 8, founded: 2017, earnings: '$3.1M' },
    { id: 7, name: 'Void Walkers', region: 'na', tier: 'tier-b', category: 'strategy', members: 3, founded: 2023, earnings: '$85K' },
    { id: 8, name: 'Solar Flare', region: 'eu', tier: 'tier-a', category: 'sports', members: 6, founded: 2020, earnings: '$650K' },
    { id: 9, name: 'Thunder Strike', region: 'asia', tier: 'tier-s', category: 'fps', members: 5, founded: 2016, earnings: '$4.2M' },
    { id: 10, name: 'Crystal Blades', region: 'sa', tier: 'tier-c', category: 'moba', members: 5, founded: 2022, earnings: '$120K' },
    { id: 11, name: 'Iron Giants', region: 'mea', tier: 'tier-b', category: 'racing', members: 4, founded: 2021, earnings: '$210K' },
    { id: 12, name: 'Shadow Stalkers', region: 'na', tier: 'tier-a', category: 'battle-royale', members: 4, founded: 2019, earnings: '$980K' },
    { id: 13, name: 'Eclipse', region: 'eu', tier: 'tier-s', category: 'fighting', members: 3, founded: 2018, earnings: '$1.5M' },
    { id: 14, name: 'Viper Squad', region: 'asia', tier: 'tier-b', category: 'adventure', members: 6, founded: 2022, earnings: '$175K' },
    { id: 15, name: 'Nova Core', region: 'na', tier: 'tier-s', category: 'moba', members: 5, founded: 2015, earnings: '$5.8M' },
    { id: 16, name: 'Zenith', region: 'eu', tier: 'tier-a', category: 'rpg', members: 7, founded: 2019, earnings: '$720K' },
    { id: 17, name: 'Blaze Union', region: 'asia', tier: 'tier-b', category: 'sports', members: 5, founded: 2021, earnings: '$280K' },
    { id: 18, name: 'Frostbyte', region: 'na', tier: 'tier-c', category: 'simulation', members: 4, founded: 2023, earnings: '$45K' },
    { id: 19, name: 'Rogue Nation', region: 'eu', tier: 'tier-a', category: 'fps', members: 5, founded: 2017, earnings: '$1.1M' },
    { id: 20, name: 'Titan Force', region: 'asia', tier: 'tier-s', category: 'strategy', members: 4, founded: 2016, earnings: '$2.9M' }
  ]
};

// Generate full teams list
export const generateTeamsList = (count = 2135) => {
  const teams = [];
  const regions = ['na', 'eu', 'asia', 'sa', 'mea'];
  const tiers = ['tier-s', 'tier-a', 'tier-b', 'tier-c', 'tier-d'];
  const categories = ['fps', 'moba', 'battle-royale', 'rpg', 'racing', 'sports', 'strategy', 'simulation', 'fighting', 'adventure', 'puzzle', 'indie'];
  const prefixes = ['Nexus', 'Apex', 'Phantom', 'Storm', 'Cyber', 'Neon', 'Void', 'Solar', 'Thunder', 'Crystal', 'Iron', 'Shadow', 'Eclipse', 'Viper', 'Nova', 'Zenith', 'Blaze', 'Frost', 'Rogue', 'Titan', 'Quantum', 'Stellar', 'Obsidian', 'Ember', 'Frost', 'Pulse', 'Echo', 'Vector', 'Helix', 'Nebula'];
  const suffixes = ['Gaming', 'Predators', 'Legion', 'Riders', 'Wolves', 'Dragons', 'Walkers', 'Flare', 'Strike', 'Blades', 'Giants', 'Stalkers', 'Squad', 'Core', 'Union', 'Nation', 'Force', 'Elite', 'Prime', 'Collective', 'Syndicate', 'Alliance', 'Division', 'Brigade', 'Company', 'Crew', 'Unit', 'Team', 'Club', 'Society'];
  
  for (let i = 1; i <= count; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    
    teams.push({
      id: i,
      name: `${prefix} ${suffix}`,
      region: regions[Math.floor(Math.random() * regions.length)],
      tier: tier,
      category: categories[Math.floor(Math.random() * categories.length)],
      members: Math.floor(Math.random() * 6) + 3,
      founded: 2015 + Math.floor(Math.random() * 9),
      earnings: tier === 'tier-s' ? `$${(Math.random() * 5 + 1).toFixed(1)}M` : 
                 tier === 'tier-a' ? `$${(Math.random() * 900 + 100).toFixed(0)}K` :
                 tier === 'tier-b' ? `$${(Math.random() * 250 + 50).toFixed(0)}K` :
                 tier === 'tier-c' ? `$${(Math.random() * 100 + 10).toFixed(0)}K` :
                 `$${(Math.random() * 50 + 5).toFixed(0)}K`
    });
  }
  
  return teams;
};

export const getTeamsByRegion = (regionId) => TEAMS_DATA.regions.find(r => r.id === regionId);

export const getTeamsByTier = (tierId) => TEAMS_DATA.tiers.find(t => t.id === tierId);

export default TEAMS_DATA;
