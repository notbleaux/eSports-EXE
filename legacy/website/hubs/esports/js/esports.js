/**
 * eSports HUB JavaScript
 * HUB 3/4 — Interactive functionality
 */

// ============================================
// DATA STORE
// ============================================

const ESPORTS_DATA = {
  // Live matches data
  liveMatches: [
    {
      id: 1,
      tournament: 'VCT Masters Tokyo',
      team1: { name: 'PRX', short: 'PRX', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'DRX', short: 'DRX', color: 'bg-blue-500/20 text-blue-400' },
      score1: 1,
      score2: 1,
      status: 'live',
      map: 'Map 3: Haven',
      viewers: '245K'
    },
    {
      id: 2,
      tournament: 'CS2 Major Copenhagen',
      team1: { name: 'FaZe', short: 'FZ', color: 'bg-gray-500/20 text-gray-400' },
      team2: { name: 'NAVI', short: 'NV', color: 'bg-yellow-500/20 text-yellow-400' },
      score1: 12,
      score2: 10,
      status: 'live',
      map: 'Map 1: Mirage',
      viewers: '189K'
    },
    {
      id: 3,
      tournament: 'LCK Spring 2026',
      team1: { name: 'T1', short: 'T1', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'Gen.G', short: 'GG', color: 'bg-yellow-500/20 text-yellow-400' },
      score1: 1,
      score2: 0,
      status: 'live',
      map: 'Game 2',
      viewers: '312K'
    }
  ],

  // Upcoming matches data
  upcomingMatches: [
    {
      id: 4,
      tournament: 'VCT Masters Tokyo',
      team1: { name: 'Cloud9', short: 'C9', color: 'bg-blue-500/20 text-blue-400' },
      team2: { name: 'LOUD', short: 'LD', color: 'bg-green-500/20 text-green-400' },
      date: new Date(Date.now() + 3600000 * 2), // 2 hours from now
      status: 'upcoming'
    },
    {
      id: 5,
      tournament: 'CS2 Major Copenhagen',
      team1: { name: 'G2', short: 'G2', color: 'bg-gray-500/20 text-gray-400' },
      team2: { name: 'Vitality', short: 'VIT', color: 'bg-yellow-500/20 text-yellow-400' },
      date: new Date(Date.now() + 3600000 * 4), // 4 hours from now
      status: 'upcoming'
    },
    {
      id: 6,
      tournament: 'LCK Spring 2026',
      team1: { name: 'KT', short: 'KT', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'DK', short: 'DK', color: 'bg-blue-500/20 text-blue-400' },
      date: new Date(Date.now() + 3600000 * 6), // 6 hours from now
      status: 'upcoming'
    },
    {
      id: 7,
      tournament: 'VCT Americas',
      team1: { name: 'Sentinels', short: 'SEN', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'Leviatán', short: 'LEV', color: 'bg-purple-500/20 text-purple-400' },
      date: new Date(Date.now() + 86400000), // Tomorrow
      status: 'upcoming'
    },
    {
      id: 8,
      tournament: 'VCT EMEA',
      team1: { name: 'Fnatic', short: 'FNC', color: 'bg-orange-500/20 text-orange-400' },
      team2: { name: 'Team Heretics', short: 'TH', color: 'bg-green-500/20 text-green-400' },
      date: new Date(Date.now() + 86400000 * 2), // Day after tomorrow
      status: 'upcoming'
    },
    {
      id: 9,
      tournament: 'CS2 Blast Premier',
      team1: { name: 'Astralis', short: 'AST', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'Complexity', short: 'COL', color: 'bg-blue-500/20 text-blue-400' },
      date: new Date(Date.now() + 86400000 * 3),
      status: 'upcoming'
    }
  ],

  // Recent results data
  recentResults: [
    {
      id: 10,
      tournament: 'VCT Masters Tokyo',
      team1: { name: 'Sentinels', short: 'SEN', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'Fnatic', short: 'FNC', color: 'bg-orange-500/20 text-orange-400' },
      score1: 3,
      score2: 2,
      status: 'finished',
      maps: 'Bind, Split, Haven, Ascent, Lotus',
      mvp: 'TenZ',
      date: new Date(Date.now() - 86400000)
    },
    {
      id: 11,
      tournament: 'CS2 Major Copenhagen',
      team1: { name: 'NAVI', short: 'NV', color: 'bg-yellow-500/20 text-yellow-400' },
      team2: { name: 'FaZe', short: 'FZ', color: 'bg-gray-500/20 text-gray-400' },
      score1: 2,
      score2: 1,
      status: 'finished',
      maps: 'Nuke, Mirage, Inferno',
      mvp: 'jL',
      date: new Date(Date.now() - 86400000 * 2)
    },
    {
      id: 12,
      tournament: 'LCK Spring 2026',
      team1: { name: 'Gen.G', short: 'GG', color: 'bg-yellow-500/20 text-yellow-400' },
      team2: { name: 'T1', short: 'T1', color: 'bg-red-500/20 text-red-400' },
      score1: 3,
      score2: 1,
      status: 'finished',
      maps: null,
      mvp: 'Chovy',
      date: new Date(Date.now() - 86400000 * 3)
    },
    {
      id: 13,
      tournament: 'VCT Americas',
      team1: { name: 'LOUD', short: 'LD', color: 'bg-green-500/20 text-green-400' },
      team2: { name: 'NRG', short: 'NRG', color: 'bg-red-500/20 text-red-400' },
      score1: 2,
      score2: 0,
      status: 'finished',
      maps: 'Lotus, Sunset',
      mvp: 'Less',
      date: new Date(Date.now() - 86400000 * 4)
    },
    {
      id: 14,
      tournament: 'VCT Pacific',
      team1: { name: 'PRX', short: 'PRX', color: 'bg-red-500/20 text-red-400' },
      team2: { name: 'Gen.G', short: 'GEN', color: 'bg-yellow-500/20 text-yellow-400' },
      score1: 2,
      score2: 1,
      status: 'finished',
      maps: 'Ascent, Bind, Haven',
      mvp: 'f0rsakeN',
      date: new Date(Date.now() - 86400000 * 5)
    }
  ],

  // News articles data
  newsArticles: [
    {
      id: 1,
      title: 'VCT Masters: Sentinels Crowned Champions After Epic Grand Finals',
      excerpt: 'Sentinels defeat Fnatic 3-2 in a nail-biting series that went to the final map, claiming their first international title since 2021.',
      category: 'Tournaments',
      author: 'Alex Chen',
      date: new Date(Date.now() - 7200000), // 2 hours ago
      featured: true
    },
    {
      id: 2,
      title: 'Cloud9 Announces New Valorant Roster With International Talent',
      excerpt: 'Major shuffle brings in players from EMEA and Pacific regions as C9 aims for Champions qualification.',
      category: 'Teams',
      author: 'Sarah Miller',
      date: new Date(Date.now() - 14400000), // 4 hours ago
      featured: false
    },
    {
      id: 3,
      title: 's1mple Confirms Return to Competitive CS2',
      excerpt: 'The Ukrainian superstar announces comeback after extended break, expected to debut next month.',
      category: 'Players',
      author: 'Mike Johnson',
      date: new Date(Date.now() - 21600000), // 6 hours ago
      featured: false
    },
    {
      id: 4,
      title: 'Valorant Patch 8.05: Agent Balance Changes Breakdown',
      excerpt: 'Riot Games targets meta-dominant agents with significant nerfs and brings buffs to underperformers.',
      category: 'Updates',
      author: 'Emma Davis',
      date: new Date(Date.now() - 28800000), // 8 hours ago
      featured: false
    },
    {
      id: 5,
      title: 'CS2 Major Copenhagen Sets New Viewership Record',
      excerpt: 'Over 1.8 million concurrent viewers tune in for the grand finals, marking the most-watched CS event in history.',
      category: 'Tournaments',
      author: 'Chris Lee',
      date: new Date(Date.now() - 43200000), // 12 hours ago
      featured: false
    },
    {
      id: 6,
      title: 'Team Liquid Parts Ways With Longtime Coach',
      excerpt: 'After five years together, the organization announces mutual split with head coach ahead of LCS playoffs.',
      category: 'Teams',
      author: 'Jessica Wong',
      date: new Date(Date.now() - 86400000), // 1 day ago
      featured: false
    },
    {
      id: 7,
      title: 'TenZ Announces Temporary Hiatus Due to Health Issues',
      excerpt: 'Sentinels star player steps back to focus on recovery, expected return in 2-3 weeks.',
      category: 'Players',
      author: 'Ryan Park',
      date: new Date(Date.now() - 90000000), // ~1 day ago
      featured: false
    },
    {
      id: 8,
      title: 'Riot Games Reveals Plans for New International Tournament',
      excerpt: 'The tournament will feature a unique format combining regional leagues and global competition.',
      category: 'Tournaments',
      author: 'Amanda Torres',
      date: new Date(Date.now() - 172800000), // 2 days ago
      featured: false
    },
    {
      id: 9,
      title: 'Evil Geniuses Acquires Promising Academy Team',
      excerpt: 'The organization looks to rebuild their roster with young talent from the Tier 2 scene.',
      category: 'Teams',
      author: 'David Kim',
      date: new Date(Date.now() - 180000000), // ~2 days ago
      featured: false
    },
    {
      id: 10,
      title: 'CS2 Update Introduces New Anti-Cheat Measures',
      excerpt: 'Valve implements advanced detection system to combat cheaters in competitive matchmaking.',
      category: 'Updates',
      author: 'Lisa Chen',
      date: new Date(Date.now() - 259200000), // 3 days ago
      featured: false
    }
  ],

  // Ladder/Standings data
  ladders: {
    vct_americas: [
      { rank: 1, team: 'Sentinels', region: 'NA', record: '8-1', streak: 'W5', points: 24 },
      { rank: 2, team: 'LOUD', region: 'BR', record: '7-2', streak: 'W2', points: 21 },
      { rank: 3, team: 'Cloud9', region: 'NA', record: '6-3', streak: 'L1', points: 18 },
      { rank: 4, team: 'Leviatán', region: 'LATAM', record: '5-4', streak: 'W1', points: 15 },
      { rank: 5, team: 'NRG', region: 'NA', record: '4-5', streak: 'L2', points: 12 },
      { rank: 6, team: 'G2 Esports', region: 'NA', record: '3-6', streak: 'W1', points: 9 },
      { rank: 7, team: '100 Thieves', region: 'NA', record: '2-7', streak: 'L4', points: 6 },
      { rank: 8, team: 'Evil Geniuses', region: 'NA', record: '1-8', streak: 'L3', points: 3 }
    ],
    vct_emea: [
      { rank: 1, team: 'Fnatic', region: 'EU', record: '9-0', streak: 'W9', points: 27 },
      { rank: 2, team: 'Team Heretics', region: 'EU', record: '7-2', streak: 'W3', points: 21 },
      { rank: 3, team: 'NAVI', region: 'EU', record: '6-3', streak: 'L1', points: 18 },
      { rank: 4, team: 'Team Vitality', region: 'EU', record: '5-4', streak: 'W1', points: 15 },
      { rank: 5, team: 'Karmine Corp', region: 'EU', record: '4-5', streak: 'L2', points: 12 },
      { rank: 6, team: 'BBL Esports', region: 'TR', record: '3-6', streak: 'W1', points: 9 },
      { rank: 7, team: 'FUT Esports', region: 'TR', record: '2-7', streak: 'L3', points: 6 },
      { rank: 8, team: 'GiantX', region: 'EU', record: '0-9', streak: 'L9', points: 0 }
    ],
    vct_pacific: [
      { rank: 1, team: 'PRX', region: 'SEA', record: '8-1', streak: 'W4', points: 24 },
      { rank: 2, team: 'Gen.G', region: 'KR', record: '7-2', streak: 'W2', points: 21 },
      { rank: 3, team: 'DRX', region: 'KR', record: '6-3', streak: 'L1', points: 18 },
      { rank: 4, team: 'Talon Esports', region: 'SEA', record: '5-4', streak: 'W1', points: 15 },
      { rank: 5, team: 'ZETA DIVISION', region: 'JP', record: '4-5', streak: 'L2', points: 12 },
      { rank: 6, team: 'Team Secret', region: 'PH', record: '3-6', streak: 'W1', points: 9 },
      { rank: 7, team: 'Rex Regum Qeon', region: 'ID', record: '2-7', streak: 'L4', points: 6 },
      { rank: 8, team: 'Global Esports', region: 'IN', record: '1-8', streak: 'L5', points: 3 }
    ],
    cs2_hltv: [
      { rank: 1, team: 'NAVI', region: 'EU', record: '52-15', streak: 'W3', points: 1000 },
      { rank: 2, team: 'Spirit', region: 'RU', record: '48-18', streak: 'W5', points: 965 },
      { rank: 3, team: 'Vitality', region: 'EU', record: '45-20', streak: 'L1', points: 892 },
      { rank: 4, team: 'MOUZ', region: 'EU', record: '42-22', streak: 'W2', points: 845 },
      { rank: 5, team: 'FaZe', region: 'EU', record: '40-25', streak: 'L2', points: 812 },
      { rank: 6, team: 'G2', region: 'EU', record: '38-24', streak: 'W1', points: 798 },
      { rank: 7, team: 'Eternal Fire', region: 'TR', record: '35-28', streak: 'L1', points: 745 },
      { rank: 8, team: 'Astralis', region: 'DK', record: '33-30', streak: 'W2', points: 698 }
    ]
  },

  // Media videos data
  mediaVideos: [
    { id: 1, title: 'VCT Masters Tokyo: Grand Finals Highlights', category: 'Highlights', duration: '12:34', views: '1.2M', date: '2 days ago' },
    { id: 2, title: 'TenZ Post-Match Interview: "We Never Gave Up"', category: 'Interviews', duration: '8:45', views: '856K', date: '2 days ago' },
    { id: 3, title: 'CS2 Major: NAVI vs FaZe - Full Match Analysis', category: 'Analysis', duration: '45:22', views: '2.1M', date: '3 days ago' },
    { id: 4, title: 'Valorant Patch 8.05: Agent Tier List', category: 'Analysis', duration: '15:30', views: '654K', date: '4 days ago' },
    { id: 5, title: 's1mple Return: What to Expect', category: 'Analysis', duration: '18:15', views: '1.5M', date: '5 days ago' },
    { id: 6, title: 'LCK Spring: T1 vs Gen.G - Game 3 Highlights', category: 'Highlights', duration: '9:20', views: '923K', date: '6 days ago' },
    { id: 7, title: 'Pro Player Settings Guide 2026', category: 'Analysis', duration: '22:10', views: '445K', date: '1 week ago' },
    { id: 8, title: 'VCT Americas: Best Plays of the Week', category: 'Highlights', duration: '11:45', views: '778K', date: '1 week ago' },
    { id: 9, title: 'Cloud9 Roster Announcement Press Conference', category: 'Interviews', duration: '25:00', views: '332K', date: '1 week ago' },
    { id: 10, title: 'CS2 Meta Breakdown: Weapon Economy', category: 'Analysis', duration: '19:30', views: '567K', date: '2 weeks ago' }
  ],

  // Forum categories data
  forumCategories: [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'Talk about anything esports related',
      topics: 1245,
      posts: 8932,
      lastTopic: { title: 'What was your favorite match this week?', author: 'EsportsFan99', time: '10 min ago' }
    },
    {
      id: 'tournaments',
      name: 'Tournaments',
      description: 'Discuss ongoing and upcoming tournaments',
      topics: 892,
      posts: 5671,
      lastTopic: { title: 'VCT Masters Tokyo Predictions', author: 'ValorantKing', time: '25 min ago' }
    },
    {
      id: 'teams',
      name: 'Teams & Rosters',
      description: 'Roster changes, team discussions, and rumors',
      topics: 654,
      posts: 4321,
      lastTopic: { title: 'Cloud9 new roster thoughts?', author: 'CSGOAddict', time: '1 hour ago' }
    },
    {
      id: 'fantasy',
      name: 'Fantasy eSports',
      description: 'Fantasy league discussions and advice',
      topics: 423,
      posts: 2876,
      lastTopic: { title: 'Best picks for this week\'s matches', author: 'FantasyPro', time: '2 hours ago' }
    }
  ]
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date for display
 */
function formatDate(date, options = {}) {
  const defaultOptions = { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    ...options 
  };
  return date.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Create a countdown timer
 */
function createCountdown(targetDate, container) {
  function update() {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
      container.innerHTML = '<span class="text-esports-red font-bold">LIVE</span>';
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    container.innerHTML = `
      <div class="countdown">
        ${days > 0 ? `
          <div class="countdown__item">
            <span class="countdown__value">${days}</span>
            <span class="countdown__label">d</span>
          </div>
        ` : ''}
        <div class="countdown__item">
          <span class="countdown__value">${String(hours).padStart(2, '0')}</span>
          <span class="countdown__label">h</span>
        </div>
        <div class="countdown__item">
          <span class="countdown__value">${String(minutes).padStart(2, '0')}</span>
          <span class="countdown__label">m</span>
        </div>
      </div>
    `;
  }
  
  update();
  return setInterval(update, 60000); // Update every minute
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Render live matches ticker
 */
function renderLiveMatches() {
  const container = document.getElementById('liveMatchesTicker');
  if (!container) return;
  
  container.innerHTML = ESPORTS_DATA.liveMatches.map(match => `
    <div class="match-card match-card--live">
      <div class="match-card__header">
        <span class="match-card__tournament">${match.tournament}</span>
        <span class="match-card__status match-card__status--live">LIVE</span>
      </div>
      <div class="match-card__teams">
        <div class="match-card__team">
          <div class="match-card__team-logo ${match.team1.color}">${match.team1.short}</div>
          <span class="match-card__team-name">${match.team1.name}</span>
        </div>
        <div class="match-card__score">
          <span class="match-card__score-main">${match.score1} - ${match.score2}</span>
          <span class="match-card__score-maps">${match.map}</span>
        </div>
        <div class="match-card__team">
          <div class="match-card__team-logo ${match.team2.color}">${match.team2.short}</div>
          <span class="match-card__team-name">${match.team2.name}</span>
        </div>
      </div>
      <div class="match-card__footer">
        <span>${match.viewers} viewers</span>
        <a href="schedule/" class="text-esports-red hover:underline">Watch →</a>
      </div>
    </div>
  `).join('');
}

/**
 * Render upcoming matches
 */
function renderUpcomingMatches() {
  const container = document.getElementById('upcomingMatches');
  if (!container) return;
  
  container.innerHTML = ESPORTS_DATA.upcomingMatches.map(match => {
    const countdownId = `countdown-${match.id}`;
    setTimeout(() => {
      const countdownEl = document.getElementById(countdownId);
      if (countdownEl) {
        createCountdown(match.date, countdownEl);
      }
    }, 0);
    
    return `
      <div class="match-card">
        <div class="match-card__header">
          <span class="match-card__tournament">${match.tournament}</span>
          <span class="match-card__status match-card__status--upcoming">UPCOMING</span>
        </div>
        <div class="match-card__teams">
          <div class="match-card__team">
            <div class="match-card__team-logo ${match.team1.color}">${match.team1.short}</div>
            <span class="match-card__team-name">${match.team1.name}</span>
          </div>
          <div class="match-card__score" id="${countdownId}">
            <span class="text-sm text-radiant-gray">Loading...</span>
          </div>
          <div class="match-card__team">
            <div class="match-card__team-logo ${match.team2.color}">${match.team2.short}</div>
            <span class="match-card__team-name">${match.team2.name}</span>
          </div>
        </div>
        <div class="match-card__footer">
          <span>${formatDate(match.date)}</span>
          <button class="text-esports-red hover:text-esports-orange font-medium" onclick="showReminderStub()">
            Remind Me
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render news grid with filtering
 */
function renderNews(category = 'all') {
  const container = document.getElementById('newsGrid');
  if (!container) return;
  
  const filtered = category === 'all' 
    ? ESPORTS_DATA.newsArticles 
    : ESPORTS_DATA.newsArticles.filter(a => a.category.toLowerCase() === category.toLowerCase());
  
  container.innerHTML = filtered.map(article => `
    <article class="news-card">
      <div class="news-card__image">
        <svg class="w-16 h-16 text-esports-red/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"/>
        </svg>
      </div>
      <div class="news-card__content">
        <div class="news-card__meta">
          <span class="news-card__category news-card__category--${article.category.toLowerCase()}">${article.category}</span>
          <span class="news-card__date">${formatRelativeTime(article.date)}</span>
        </div>
        <h3 class="news-card__title">${article.title}</h3>
        <p class="news-card__excerpt">${article.excerpt}</p>
        <div class="news-card__author">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>${article.author}</span>
        </div>
      </div>
    </article>
  `).join('');
}

/**
 * Render results list
 */
function renderResults() {
  const container = document.getElementById('resultsList');
  if (!container) return;
  
  container.innerHTML = ESPORTS_DATA.recentResults.map(match => `
    <div class="match-card">
      <div class="match-card__header">
        <span class="match-card__tournament">${match.tournament}</span>
        <span class="match-card__status match-card__status--finished">FINISHED</span>
      </div>
      <div class="match-card__teams">
        <div class="match-card__team">
          <div class="match-card__team-logo ${match.team1.color}">${match.team1.short}</div>
          <span class="match-card__team-name">${match.team1.name}</span>
        </div>
        <div class="match-card__score">
          <span class="match-card__score-main">${match.score1} - ${match.score2}</span>
          ${match.maps ? `<span class="match-card__score-maps">${match.maps}</span>` : ''}
        </div>
        <div class="match-card__team">
          <div class="match-card__team-logo ${match.team2.color}">${match.team2.short}</div>
          <span class="match-card__team-name">${match.team2.name}</span>
        </div>
      </div>
      <div class="match-card__footer">
        <span>${formatRelativeTime(match.date)}</span>
        <span class="match-card__mvp">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          MVP: ${match.mvp}
        </span>
      </div>
    </div>
  `).join('');
}

/**
 * Render schedule list
 */
function renderSchedule() {
  const container = document.getElementById('scheduleList');
  if (!container) return;
  
  const allMatches = [...ESPORTS_DATA.liveMatches, ...ESPORTS_DATA.upcomingMatches];
  
  container.innerHTML = allMatches.map(match => {
    const countdownId = `schedule-countdown-${match.id}`;
    if (match.status === 'upcoming') {
      setTimeout(() => {
        const countdownEl = document.getElementById(countdownId);
        if (countdownEl) {
          createCountdown(match.date, countdownEl);
        }
      }, 0);
    }
    
    return `
      <div class="match-card ${match.status === 'live' ? 'match-card--live' : ''}">
        <div class="match-card__header">
          <span class="match-card__tournament">${match.tournament}</span>
          <span class="match-card__status match-card__status--${match.status}">
            ${match.status === 'live' ? 'LIVE' : 'UPCOMING'}
          </span>
        </div>
        <div class="match-card__teams">
          <div class="match-card__team">
            <div class="match-card__team-logo ${match.team1.color}">${match.team1.short}</div>
            <span class="match-card__team-name">${match.team1.name}</span>
          </div>
          <div class="match-card__score" id="${match.status === 'upcoming' ? countdownId : ''}">
            ${match.status === 'live' 
              ? `<span class="match-card__score-main text-esports-red">${match.score1} - ${match.score2}</span>`
              : '<span class="text-sm text-radiant-gray">Starting in...</span>'
            }
          </div>
          <div class="match-card__team">
            <div class="match-card__team-logo ${match.team2.color}">${match.team2.short}</div>
            <span class="match-card__team-name">${match.team2.name}</span>
          </div>
        </div>
        <div class="match-card__footer">
          <span>${match.status === 'live' ? match.map : formatDate(match.date || new Date())}</span>
          <button class="text-esports-red hover:text-esports-orange font-medium" onclick="${match.status === 'live' ? 'watchLiveStub()' : 'showReminderStub()'}">
            ${match.status === 'live' ? 'Watch Live →' : 'Remind Me'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render ladder table
 */
function renderLadder(region = 'vct_americas') {
  const container = document.getElementById('ladderTable');
  if (!container) return;
  
  const data = ESPORTS_DATA.ladders[region] || ESPORTS_DATA.ladders.vct_americas;
  
  container.innerHTML = `
    <table class="ladder-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          <th>Record</th>
          <th>Streak</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(team => `
          <tr>
            <td>
              <div class="ladder__rank ${team.rank <= 3 ? `ladder__rank--${team.rank}` : 'ladder__rank--other'}">
                ${team.rank}
              </div>
            </td>
            <td>
              <div class="ladder__team">
                <div class="ladder__team-logo bg-radiant-card border border-radiant-border">${team.team.substring(0, 2).toUpperCase()}</div>
                <div>
                  <div class="ladder__team-name">${team.team}</div>
                  <div class="ladder__team-region">${team.region}</div>
                </div>
              </div>
            </td>
            <td class="ladder__record">${team.record}</td>
            <td>
              <span class="ladder__streak ${team.streak.startsWith('W') ? 'ladder__streak--win' : 'ladder__streak--loss'}">
                ${team.streak}
              </span>
            </td>
            <td class="ladder__points">${team.points}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Render media gallery
 */
function renderMedia(category = 'all') {
  const container = document.getElementById('mediaGrid');
  if (!container) return;
  
  const filtered = category === 'all'
    ? ESPORTS_DATA.mediaVideos
    : ESPORTS_DATA.mediaVideos.filter(v => v.category.toLowerCase() === category.toLowerCase());
  
  container.innerHTML = filtered.map(video => `
    <div class="media-card" onclick="playVideoStub(${video.id})">
      <div class="media-card__thumbnail">
        <div class="media-card__play-btn">
          <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 5.84a.5.5 0 01.77-.42l7.15 4.16a.5.5 0 010 .84l-7.15 4.16a.5.5 0 01-.77-.42V5.84z"/>
          </svg>
        </div>
        <span class="media-card__duration">${video.duration}</span>
      </div>
      <div class="media-card__content">
        <span class="media-card__category media-card__category--${video.category.toLowerCase()}">${video.category}</span>
        <h3 class="media-card__title">${video.title}</h3>
        <div class="media-card__meta">
          <span>${video.views} views</span>
          <span>${video.date}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Render forum categories
 */
function renderForums() {
  const container = document.getElementById('forumCategories');
  if (!container) return;
  
  container.innerHTML = ESPORTS_DATA.forumCategories.map(cat => `
    <div class="forum-category">
      <div class="forum-category__header">
        <div>
          <h3 class="forum-category__title">${cat.name}</h3>
          <p class="text-sm text-radiant-gray">${cat.description}</p>
        </div>
        <span class="forum-category__count">${cat.topics.toLocaleString()} topics</span>
      </div>
      <div class="forum-topic">
        <div class="forum-topic__icon">
          <svg class="w-5 h-5 text-radiant-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </div>
        <div class="forum-topic__content">
          <h4 class="forum-topic__title">${cat.lastTopic.title}</h4>
          <div class="forum-topic__meta">
            <span>by ${cat.lastTopic.author}</span>
            <span>•</span>
            <span>${cat.lastTopic.time}</span>
          </div>
        </div>
        <div class="forum-topic__stats">
          <span class="forum-topic__stat">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            ${cat.posts.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// FILTER FUNCTIONS
// ============================================

/**
 * Filter news by category
 */
function filterNews(category) {
  // Update active button
  document.querySelectorAll('.news-filter__btn').forEach(btn => {
    btn.classList.remove('news-filter__btn--active');
    if (btn.dataset.category === category) {
      btn.classList.add('news-filter__btn--active');
    }
  });
  
  // Re-render
  renderNews(category);
}

/**
 * Filter media by category
 */
function filterMedia(category) {
  // Update active button
  document.querySelectorAll('.media-filter__btn').forEach(btn => {
    btn.classList.remove('news-filter__btn--active');
    if (btn.dataset.category === category) {
      btn.classList.add('news-filter__btn--active');
    }
  });
  
  // Re-render
  renderMedia(category);
}

/**
 * Switch ladder region
 */
function switchLadderRegion(region) {
  // Update active tab
  document.querySelectorAll('.region-tab').forEach(tab => {
    tab.classList.remove('region-tab--active');
    if (tab.dataset.region === region) {
      tab.classList.add('region-tab--active');
    }
  });
  
  // Re-render
  renderLadder(region);
}

// ============================================
// STUB FUNCTIONS
// ============================================

function showReminderStub() {
  alert('Reminder feature coming soon! This will require account login.');
}

function watchLiveStub() {
  alert('Live stream player coming soon! This will integrate with streaming platforms.');
}

function playVideoStub(videoId) {
  alert(`Video player coming soon! Video ID: ${videoId}`);
}

function loginStub() {
  alert('Login feature coming soon! This will enable forum participation and personalized features.');
}

// ============================================
// CALENDAR FUNCTIONS
// ============================================

let currentCalendarDate = new Date();

function renderCalendar() {
  const container = document.getElementById('calendarGrid');
  if (!container) return;
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Update title
  const titleEl = document.getElementById('calendarTitle');
  if (titleEl) {
    titleEl.textContent = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  
  // Get first day and days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  let html = '';
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar__day calendar__day--other-month"><span class="calendar__day-number">${daysInPrevMonth - i}</span></div>`;
  }
  
  // Current month days
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const hasEvents = Math.random() > 0.7; // Random events for demo
    
    html += `
      <div class="calendar__day ${isToday ? 'calendar__day--today' : ''} ${hasEvents ? 'calendar__day--has-events' : ''}">
        <span class="calendar__day-number">${day}</span>
      </div>
    `;
  }
  
  // Next month days
  const remainingCells = 42 - (firstDay + daysInMonth);
  for (let day = 1; day <= remainingCells; day++) {
    html += `<div class="calendar__day calendar__day--other-month"><span class="calendar__day-number">${day}</span></div>`;
  }
  
  container.innerHTML = html;
}

function prevMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Render components on main page
  renderLiveMatches();
  renderUpcomingMatches();
  
  // Render components on other pages
  renderNews();
  renderResults();
  renderSchedule();
  renderLadder();
  renderMedia();
  renderForums();
  renderCalendar();
  
  // Set up filter buttons
  document.querySelectorAll('.news-filter__btn').forEach(btn => {
    btn.addEventListener('click', () => filterNews(btn.dataset.category));
  });
  
  document.querySelectorAll('.media-filter__btn').forEach(btn => {
    btn.addEventListener('click', () => filterMedia(btn.dataset.category));
  });
  
  document.querySelectorAll('.region-tab').forEach(tab => {
    tab.addEventListener('click', () => switchLadderRegion(tab.dataset.region));
  });
});

// Export functions for global access
window.toggleMobileMenu = toggleMobileMenu;
window.filterNews = filterNews;
window.filterMedia = filterMedia;
window.switchLadderRegion = switchLadderRegion;
window.showReminderStub = showReminderStub;
window.watchLiveStub = watchLiveStub;
window.playVideoStub = playVideoStub;
window.loginStub = loginStub;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
