export const zones = [
  { id: 1, name: 'Teams', icon: '👥', href: '/teams' },
  { id: 2, name: 'Players', icon: '👤', href: '/players' },
  { id: 3, name: 'Tournaments', icon: '🏆', href: '/tournaments', badge: 'Live' },
  { id: 4, name: 'Matches', icon: '🎮', href: '/matches', badge: 'Live' },
  { id: 5, name: 'Stats', icon: '📊', href: '/stats' },
  { id: 6, name: 'Rankings', icon: '📈', href: '/rankings' },
  { id: 7, name: 'Leagues', icon: '🏅', href: '/leagues' },
  { id: 8, name: 'Schedule', icon: '📅', href: '/schedule' },
  { id: 9, name: 'News', icon: '📰', href: '/news', badge: 'New' },
  { id: 10, name: 'Analysis', icon: '🔍', href: '/analysis' },
  { id: 11, name: 'Transfers', icon: '🔄', href: '/transfers' },
  { id: 12, name: 'Fantasy', icon: '✨', href: '/fantasy' },
  { id: 13, name: 'Betting', icon: '🎲', href: '/betting' },
  { id: 14, name: 'Streams', icon: '📺', href: '/streams' },
  { id: 15, name: 'VODs', icon: '▶️', href: '/vods' },
  { id: 16, name: 'Coaches', icon: '🎯', href: '/coaches' },
  { id: 17, name: 'Organizations', icon: '🏢', href: '/orgs' },
  { id: 18, name: 'Sponsors', icon: '🤝', href: '/sponsors' },
  { id: 19, name: 'Merch', icon: '👕', href: '/merch' },
  { id: 20, name: 'Tickets', icon: '🎫', href: '/tickets' },
  { id: 21, name: 'Community', icon: '💬', href: '/community' },
  { id: 22, name: 'Forums', icon: '💭', href: '/forums' },
  { id: 23, name: 'Wiki', icon: '📚', href: '/wiki' },
  { id: 24, name: 'API', icon: '⚡', href: '/api' },
  { id: 25, name: 'Settings', icon: '⚙️', href: '/settings' },
];

export const mockSearchResults = [
  { 
    id: 1, 
    name: 'Team Liquid', 
    description: 'International multi-regional professional esports organization', 
    category: 'Teams',
    image: 'https://via.placeholder.com/64/00f0ff/000000?text=TL',
    rating: 4.8,
    members: 45
  },
  { 
    id: 2, 
    name: 'Faker', 
    description: 'Legendary League of Legends mid laner from T1', 
    category: 'Players',
    image: 'https://via.placeholder.com/64/ff9f1c/000000?text=FK',
    rating: 5.0
  },
  { 
    id: 3, 
    name: 'The International 2024', 
    description: 'Annual Dota 2 world championship tournament', 
    category: 'Tournaments',
    image: 'https://via.placeholder.com/64/c9b037/000000?text=TI',
    members: 18000
  },
  { 
    id: 4, 
    name: 'Cloud9 vs TSM', 
    description: 'LCS Summer 2024 Playoffs - Semifinal Match', 
    category: 'Matches',
    image: 'https://via.placeholder.com/64/10b981/000000?text=C9vT'
  },
  { 
    id: 5, 
    name: 'CS2 Major Statistics', 
    description: 'Comprehensive analytics for Counter-Strike 2 Majors', 
    category: 'Stats',
    image: 'https://via.placeholder.com/64/3b82f6/000000?text=CS2'
  },
  { 
    id: 6, 
    name: 'G2 Esports', 
    description: 'European esports organization competing in multiple titles', 
    category: 'Teams',
    image: 'https://via.placeholder.com/64/ef4444/000000?text=G2',
    rating: 4.6,
    members: 52
  },
  { 
    id: 7, 
    name: 's1mple', 
    description: 'Ukrainian professional CS2 player, considered one of the greatest', 
    category: 'Players',
    image: 'https://via.placeholder.com/64/00f0ff/000000?text=S1',
    rating: 4.9
  },
  { 
    id: 8, 
    name: 'Worlds 2024', 
    description: 'League of Legends World Championship', 
    category: 'Tournaments',
    image: 'https://via.placeholder.com/64/8b5cf6/000000?text=W24',
    members: 25000
  },
];

export const compressionPackages = [
  { 
    id: 1, 
    name: 'CS2 Season 2024', 
    icon: '📦',
    originalSize: '2.4 GB', 
    compressedSize: '847 MB',
    ratio: '65%'
  },
  { 
    id: 2, 
    name: 'Dota 2 Pro Circuit', 
    icon: '📦',
    originalSize: '4.1 GB', 
    compressedSize: '1.2 GB',
    ratio: '71%'
  },
  { 
    id: 3, 
    name: 'League LCS Data', 
    icon: '📦',
    originalSize: '1.8 GB', 
    compressedSize: '520 MB',
    ratio: '72%'
  },
  { 
    id: 4, 
    name: 'Valorant VCT Stats', 
    icon: '📦',
    originalSize: '980 MB', 
    compressedSize: '312 MB',
    ratio: '68%'
  },
  { 
    id: 5, 
    name: 'Rainbow Six Siege', 
    icon: '📦',
    originalSize: '3.2 GB', 
    compressedSize: '1.1 GB',
    ratio: '66%'
  },
  { 
    id: 6, 
    name: 'Rocket League RLCS', 
    icon: '📦',
    originalSize: '850 MB', 
    compressedSize: '280 MB',
    ratio: '67%'
  },
];