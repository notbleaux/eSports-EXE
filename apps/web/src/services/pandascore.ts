/**
 * PandaScore API Service
 * Real-time esports data for ROTAS Station
 */

import { useState, useEffect } from 'react';

const PANDASCORE_API_URL = 'https://api.pandascore.co';
const API_TOKEN = import.meta.env.VITE_PANDASCORE_TOKEN || '';

// Types
export interface Tournament {
  id: number;
  name: string;
  slug: string;
  begin_at: string;
  end_at: string;
  prizepool: string | null;
  serie_id: number;
  serie: {
    name: string;
    full_name: string;
  };
  league: {
    name: string;
    image_url: string | null;
  };
  tier: string;
}

export interface Match {
  id: number;
  name: string;
  slug: string;
  status: string;
  begin_at: string;
  end_at: string | null;
  number_of_games: number;
  tournament_id: number;
  opponents: Array<{
    opponent: {
      id: number;
      name: string;
      acronym: string;
      image_url: string | null;
    };
  }>;
  results: Array<{
    score: number;
    team_id: number;
  }>;
  winner_id: number | null;
  winner_type: string | null;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  acronym: string;
  image_url: string | null;
  location: string;
  players: Player[];
}

export interface Player {
  id: number;
  name: string;
  slug: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string;
  image_url: string | null;
  role: string | null;
  age: number | null;
  team_id: number;
}

// API Client
class PandaScoreClient {
  private baseURL: string;
  private token: string;

  constructor(token: string) {
    this.baseURL = PANDASCORE_API_URL;
    this.token = token;
  }

  private async fetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const queryParams = new URLSearchParams(params);
    const url = `${this.baseURL}${endpoint}?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PandaScore API Error:', error);
      throw error;
    }
  }

  // Valorant endpoints
  async getValorantTournaments(): Promise<Tournament[]> {
    if (!this.token) return [];
    return this.fetch('/valorant/tournaments', { 'filter[tier]': 's,a', 'sort': '-begin_at' });
  }

  async getValorantMatches(status: string = 'running'): Promise<Match[]> {
    if (!this.token) return [];
    return this.fetch('/valorant/matches', { 'filter[status]': status, 'sort': '-begin_at' });
  }

  async getValorantTeams(): Promise<Team[]> {
    if (!this.token) return [];
    return this.fetch('/valorant/teams', { 'sort': 'name' });
  }

  async getValorantPlayers(): Promise<Player[]> {
    if (!this.token) return [];
    return this.fetch('/valorant/players', { 'sort': 'name' });
  }
}

// Create client instance
export const pandaScoreClient = new PandaScoreClient(API_TOKEN);

// React Hooks for data fetching
export function useValorantTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTournaments = async () => {
      try {
        setLoading(true);
        // If no token, use mock data for demo
        if (!API_TOKEN) {
          if (mounted) {
            setTournaments(getMockTournaments());
          }
          return;
        }
        const data = await pandaScoreClient.getValorantTournaments();
        if (mounted) {
          setTournaments(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          // Fallback to mock data on error
          setTournaments(getMockTournaments());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTournaments();
    return () => { mounted = false; };
  }, []);

  return { tournaments, loading, error };
}

export function useValorantMatches(status: string = 'running') {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        if (!API_TOKEN) {
          if (mounted) {
            setMatches(getMockMatches());
          }
          return;
        }
        const data = await pandaScoreClient.getValorantMatches(status);
        if (mounted) {
          setMatches(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setMatches(getMockMatches());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMatches();
    return () => { mounted = false; };
  }, [status]);

  return { matches, loading, error };
}

export function useValorantTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTeams = async () => {
      try {
        setLoading(true);
        if (!API_TOKEN) {
          if (mounted) {
            setTeams(getMockTeams());
          }
          return;
        }
        const data = await pandaScoreClient.getValorantTeams();
        if (mounted) {
          setTeams(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setTeams(getMockTeams());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTeams();
    return () => { mounted = false; };
  }, []);

  return { teams, loading, error };
}

// Mock data for demo/fallback
function getMockTournaments(): Tournament[] {
  return [
    {
      id: 1,
      name: 'VCT 2024 Champions Tour',
      slug: 'vct-2024-champions-tour',
      begin_at: '2024-01-15T00:00:00Z',
      end_at: '2024-08-25T00:00:00Z',
      prizepool: '$2,250,000',
      serie_id: 1,
      serie: { name: 'VCT Americas', full_name: 'VCT 2024 Americas' },
      league: { name: 'Riot Games', image_url: null },
      tier: 's',
    },
    {
      id: 2,
      name: 'VCT 2024 Masters Madrid',
      slug: 'vct-2024-masters-madrid',
      begin_at: '2024-03-14T00:00:00Z',
      end_at: '2024-03-24T00:00:00Z',
      prizepool: '$500,000',
      serie_id: 2,
      serie: { name: 'VCT Masters', full_name: 'VCT 2024 Masters' },
      league: { name: 'Riot Games', image_url: null },
      tier: 's',
    },
    {
      id: 3,
      name: 'VCT Challengers NA',
      slug: 'vct-challengers-na',
      begin_at: '2024-02-01T00:00:00Z',
      end_at: '2024-05-15T00:00:00Z',
      prizepool: '$100,000',
      serie_id: 3,
      serie: { name: 'VCL', full_name: 'VCT Challengers' },
      league: { name: 'Riot Games', image_url: null },
      tier: 'a',
    },
  ];
}

function getMockMatches(): Match[] {
  return [
    {
      id: 1,
      name: 'Sentinels vs Cloud9',
      slug: 'sentinels-vs-cloud9',
      status: 'finished',
      begin_at: '2024-03-20T20:00:00Z',
      end_at: '2024-03-20T22:30:00Z',
      number_of_games: 3,
      tournament_id: 1,
      opponents: [
        { opponent: { id: 1, name: 'Sentinels', acronym: 'SEN', image_url: null } },
        { opponent: { id: 2, name: 'Cloud9', acronym: 'C9', image_url: null } },
      ],
      results: [
        { score: 2, team_id: 1 },
        { score: 1, team_id: 2 },
      ],
      winner_id: 1,
      winner_type: 'Team',
    },
    {
      id: 2,
      name: 'NRG vs LOUD',
      slug: 'nrg-vs-loud',
      status: 'upcoming',
      begin_at: '2024-04-05T22:00:00Z',
      end_at: null,
      number_of_games: 3,
      tournament_id: 1,
      opponents: [
        { opponent: { id: 3, name: 'NRG', acronym: 'NRG', image_url: null } },
        { opponent: { id: 4, name: 'LOUD', acronym: 'LOUD', image_url: null } },
      ],
      results: [],
      winner_id: null,
      winner_type: null,
    },
  ];
}

function getMockTeams(): Team[] {
  return [
    {
      id: 1,
      name: 'Sentinels',
      slug: 'sentinels',
      acronym: 'SEN',
      image_url: null,
      location: 'US',
      players: [
        { id: 1, name: 'TenZ', slug: 'tenz', first_name: 'Tyson', last_name: 'Ngo', nationality: 'CA', image_url: null, role: 'duelist', age: 23, team_id: 1 },
        { id: 2, name: 'zekken', slug: 'zekken', first_name: 'Zachary', last_name: 'Patrone', nationality: 'US', image_url: null, role: 'duelist', age: 21, team_id: 1 },
      ],
    },
    {
      id: 2,
      name: 'Cloud9',
      slug: 'cloud9',
      acronym: 'C9',
      image_url: null,
      location: 'US',
      players: [
        { id: 3, name: 'vanity', slug: 'vanity', first_name: 'Anthony', last_name: 'Malaspina', nationality: 'US', image_url: null, role: 'controller', age: 24, team_id: 2 },
      ],
    },
  ];
}

export default pandaScoreClient;
