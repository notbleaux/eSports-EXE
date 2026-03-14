/**
 * Test Data Factories
 * Generate test data for E2E tests
 * 
 * [Ver001.000]
 */

export interface Player {
  id: string
  name: string
  team: string
  role: string
  stats: {
    rating: number
    acs: number
    kda: number
    headshotPercentage: number
  }
}

export interface Team {
  id: string
  name: string
  region: string
  players: Player[]
  stats: {
    winRate: number
    avgRating: number
    matchesPlayed: number
  }
}

export interface Match {
  id: string
  teamA: Team
  teamB: Team
  score: { teamA: number; teamB: number }
  status: 'upcoming' | 'live' | 'completed'
  scheduledTime: Date
  map?: string
}

export interface Prediction {
  id: string
  matchId: string
  predictedWinner: string
  confidence: number
  factors: {
    name: string
    weight: number
    contribution: number
  }[]
}

// Player factory
export const createPlayer = (overrides?: Partial<Player>): Player => ({
  id: `player_${Math.random().toString(36).substr(2, 9)}`,
  name: `Player ${Math.floor(Math.random() * 1000)}`,
  team: 'Test Team',
  role: ['Duelist', 'Initiator', 'Controller', 'Sentinel'][Math.floor(Math.random() * 4)],
  stats: {
    rating: 0.8 + Math.random() * 0.4,
    acs: 180 + Math.random() * 100,
    kda: 1.0 + Math.random() * 1.5,
    headshotPercentage: 15 + Math.random() * 20
  },
  ...overrides
})

// Team factory
export const createTeam = (overrides?: Partial<Team>): Team => {
  const team: Team = {
    id: `team_${Math.random().toString(36).substr(2, 9)}`,
    name: `Team ${Math.floor(Math.random() * 100)}`,
    region: ['NA', 'EU', 'APAC', 'BR', 'KR'][Math.floor(Math.random() * 5)],
    players: Array.from({ length: 5 }, () => createPlayer()),
    stats: {
      winRate: 0.4 + Math.random() * 0.4,
      avgRating: 0.8 + Math.random() * 0.3,
      matchesPlayed: Math.floor(Math.random() * 50) + 10
    },
    ...overrides
  }
  
  // Update players with team name
  team.players.forEach(p => p.team = team.name)
  return team
}

// Match factory
export const createMatch = (overrides?: Partial<Match>): Match => ({
  id: `match_${Math.random().toString(36).substr(2, 9)}`,
  teamA: createTeam(),
  teamB: createTeam(),
  score: { teamA: 0, teamB: 0 },
  status: 'upcoming',
  scheduledTime: new Date(Date.now() + Math.random() * 86400000),
  map: ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture', 'Pearl', 'Lotus'][Math.floor(Math.random() * 9)],
  ...overrides
})

// Prediction factory
export const createPrediction = (overrides?: Partial<Prediction>): Prediction => {
  const confidence = 0.5 + Math.random() * 0.45
  return {
    id: `pred_${Math.random().toString(36).substr(2, 9)}`,
    matchId: `match_${Math.random().toString(36).substr(2, 9)}`,
    predictedWinner: Math.random() > 0.5 ? 'teamA' : 'teamB',
    confidence,
    factors: [
      { name: 'Win Rate', weight: 0.3, contribution: Math.random() },
      { name: 'Recent Form', weight: 0.25, contribution: Math.random() },
      { name: 'Head to Head', weight: 0.2, contribution: Math.random() },
      { name: 'Map Performance', weight: 0.15, contribution: Math.random() },
      { name: 'Player Ratings', weight: 0.1, contribution: Math.random() }
    ],
    ...overrides
  }
}

// Bulk create helpers
export const createPlayers = (count: number, overrides?: Partial<Player>): Player[] =>
  Array.from({ length: count }, (_, i) => createPlayer({ ...overrides, name: `Player ${i + 1}` }))

export const createTeams = (count: number, overrides?: Partial<Team>): Team[] =>
  Array.from({ length: count }, (_, i) => createTeam({ ...overrides, name: `Team ${i + 1}` }))

export const createMatches = (count: number, overrides?: Partial<Match>): Match[] =>
  Array.from({ length: count }, (_, i) => createMatch({
    ...overrides,
    scheduledTime: new Date(Date.now() + i * 3600000)
  }))

// Mock API responses
export const createMockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  timestamp: new Date().toISOString()
})

export const createMockErrorResponse = (message: string, code: number = 500) => ({
  success: false,
  error: {
    message,
    code
  },
  timestamp: new Date().toISOString()
})

// Search result factory
export const createSearchResults = (query: string, count: number = 5) => ({
  query,
  results: {
    players: createPlayers(Math.floor(count / 2)),
    teams: createTeams(Math.floor(count / 3)),
    matches: createMatches(count - Math.floor(count / 2) - Math.floor(count / 3))
  },
  totalCount: count
})

// Analytics data factory
export const createAnalyticsData = () => ({
  overview: {
    totalMatches: Math.floor(Math.random() * 1000) + 100,
    totalPlayers: Math.floor(Math.random() * 500) + 50,
    totalTeams: Math.floor(Math.random() * 100) + 20,
    avgRating: 0.85 + Math.random() * 0.15
  },
  trends: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    matches: Math.floor(Math.random() * 50),
    rating: 0.8 + Math.random() * 0.2
  })),
  topPerformers: createPlayers(10).map((p, i) => ({ ...p, rank: i + 1 })),
  predictions: {
    total: Math.floor(Math.random() * 500),
    accuracy: 0.6 + Math.random() * 0.3,
    byMap: ['Ascent', 'Bind', 'Haven'].map(map => ({
      map,
      accuracy: 0.6 + Math.random() * 0.3
    }))
  }
})
