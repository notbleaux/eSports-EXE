const API_BASE = "https://sator-api.onrender.com";

export interface PlayerStats {
  id: string;
  username: string;
  avatar: string;
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    winRate: number;
    kda: number;
  };
  simRating: {
    mechanics: number;
    gameSense: number;
    communication: number;
    consistency: number;
    clutch: number;
    overall: number;
  };
  rar: {
    baseRating: number;
    role: string;
    roleModifier: number;
    adjustedRating: number;
  };
}

export interface LiveMatch {
  id: string;
  team1: {
    name: string;
    players: string[];
    score: number;
  };
  team2: {
    name: string;
    players: string[];
    score: number;
  };
  status: "upcoming" | "live" | "completed";
  round: string;
  map: string;
  startTime: string;
}

export interface Tournament {
  id: string;
  name: string;
  prizePool: number;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  participants: number;
  matches: LiveMatch[];
}

// API Client
export async function fetchPlayerStats(playerId: string): Promise<PlayerStats | null> {
  try {
    const response = await fetch(`${API_BASE}/players/${playerId}/stats`);
    if (!response.ok) throw new Error("Failed to fetch player stats");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  try {
    const response = await fetch(`${API_BASE}/matches/live`);
    if (!response.ok) throw new Error("Failed to fetch live matches");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

export async function fetchActiveTournaments(): Promise<Tournament[]> {
  try {
    const response = await fetch(`${API_BASE}/tournaments/active`);
    if (!response.ok) throw new Error("Failed to fetch tournaments");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

// Mock data generators for development
export function generateMockPlayerStats(playerId: string): PlayerStats {
  return {
    id: playerId,
    username: `PLAYER_${playerId}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`,
    stats: {
      matchesPlayed: 156,
      wins: 98,
      losses: 58,
      kills: 4234,
      deaths: 3121,
      assists: 1876,
      winRate: 62.8,
      kda: 1.96,
    },
    simRating: {
      mechanics: 92,
      gameSense: 88,
      communication: 85,
      consistency: 90,
      clutch: 94,
      overall: 89.8,
    },
    rar: {
      baseRating: 87.5,
      role: "ENTRY_FRAGGER",
      roleModifier: 2.3,
      adjustedRating: 89.8,
    },
  };
}

export function generateMockLiveMatches(): LiveMatch[] {
  return [
    {
      id: "match-1",
      team1: { name: "NEON_VIPER", players: ["NV1", "NV2", "NV3"], score: 2 },
      team2: { name: "NEXUS_PRIME", players: ["NP1", "NP2", "NP3"], score: 1 },
      status: "live",
      round: "FINALS",
      map: "Cyber City",
      startTime: new Date().toISOString(),
    },
    {
      id: "match-2",
      team1: { name: "PHANTOM_X", players: ["PX1", "PX2", "PX3"], score: 1 },
      team2: { name: "VOID_WALKER", players: ["VW1", "VW2", "VW3"], score: 1 },
      status: "live",
      round: "SEMIFINALS",
      map: "Neon District",
      startTime: new Date().toISOString(),
    },
  ];
}

export function generateMockTournaments(): Tournament[] {
  return [
    {
      id: "tournament-1",
      name: "Cyber Championship 2024",
      prizePool: 2450000,
      startDate: "2024-03-01",
      endDate: "2024-03-15",
      status: "active",
      participants: 64,
      matches: generateMockLiveMatches(),
    },
  ];
}
