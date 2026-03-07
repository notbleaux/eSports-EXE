/**
 * RadiantX Data Loader
 * Loads and manages live data for the dashboard
 */

class DataLoader {
    constructor() {
        this.data = {
            matches: [],
            players: [],
            tournaments: [],
            rankings: []
        };
        this.loading = {
            matches: false,
            players: false,
            tournaments: false
        };
        this.errors = {};
    }

    /**
     * Initialize the data loader and fetch all data
     */
    async init() {
        await Promise.all([
            this.loadMatches(),
            this.loadPlayers(),
            this.loadTournaments()
        ]);
        this.calculateRankings();
        return this.data;
    }

    /**
     * Load matches data from JSON
     */
    async loadMatches() {
        this.loading.matches = true;
        try {
            const response = await fetch('data/matches.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.data.matches = await response.json();
            this.loading.matches = false;
            return this.data.matches;
        } catch (error) {
            this.errors.matches = error.message;
            this.loading.matches = false;
            console.error('Failed to load matches:', error);
            return [];
        }
    }

    /**
     * Load players data from JSON
     */
    async loadPlayers() {
        this.loading.players = true;
        try {
            const response = await fetch('data/players.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.data.players = await response.json();
            this.loading.players = false;
            return this.data.players;
        } catch (error) {
            this.errors.players = error.message;
            this.loading.players = false;
            console.error('Failed to load players:', error);
            return [];
        }
    }

    /**
     * Load tournaments data (derived from matches)
     */
    async loadTournaments() {
        this.loading.tournaments = true;
        try {
            // Derive tournaments from matches
            const tournamentMap = new Map();
            
            this.data.matches.forEach(match => {
                if (!tournamentMap.has(match.tournament)) {
                    tournamentMap.set(match.tournament, {
                        name: match.tournament,
                        matches: [],
                        teams: new Set(),
                        startDate: match.date,
                        endDate: match.date
                    });
                }
                const t = tournamentMap.get(match.tournament);
                t.matches.push(match);
                t.teams.add(match.team_a);
                t.teams.add(match.team_b);
                if (match.date < t.startDate) t.startDate = match.date;
                if (match.date > t.endDate) t.endDate = match.date;
            });

            this.data.tournaments = Array.from(tournamentMap.values()).map(t => ({
                ...t,
                teams: Array.from(t.teams),
                matchCount: t.matches.length
            }));

            this.loading.tournaments = false;
            return this.data.tournaments;
        } catch (error) {
            this.errors.tournaments = error.message;
            this.loading.tournaments = false;
            console.error('Failed to load tournaments:', error);
            return [];
        }
    }

    /**
     * Calculate team rankings based on match results
     */
    calculateRankings() {
        const teamStats = new Map();

        this.data.matches.forEach(match => {
            // Initialize team stats if not exists
            [match.team_a, match.team_b].forEach(team => {
                if (!teamStats.has(team)) {
                    teamStats.set(team, {
                        name: team,
                        matches: 0,
                        wins: 0,
                        losses: 0,
                        mapsWon: 0,
                        mapsLost: 0,
                        tournament: match.tournament
                    });
                }
            });

            const teamA = teamStats.get(match.team_a);
            const teamB = teamStats.get(match.team_b);

            // Update match counts
            teamA.matches++;
            teamB.matches++;

            // Update wins/losses
            if (match.winner === match.team_a) {
                teamA.wins++;
                teamB.losses++;
            } else {
                teamB.wins++;
                teamA.losses++;
            }

            // Update map counts
            teamA.mapsWon += match.score_a;
            teamA.mapsLost += match.score_b;
            teamB.mapsWon += match.score_b;
            teamB.mapsLost += match.score_a;
        });

        // Calculate win rate and sort
        this.data.rankings = Array.from(teamStats.values())
            .map(team => ({
                ...team,
                winRate: team.matches > 0 ? (team.wins / team.matches * 100).toFixed(1) : 0,
                mapDiff: team.mapsWon - team.mapsLost
            }))
            .sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.mapDiff - a.mapDiff;
            });

        return this.data.rankings;
    }

    /**
     * Get live matches (simulated - matches from today or recent)
     */
    getLiveMatches() {
        // Simulate live matches by returning matches with scores
        return this.data.matches.slice(0, 3).map((match, index) => ({
            ...match,
            status: index === 0 ? 'live' : (index === 1 ? 'finished' : 'upcoming'),
            round: index === 0 ? 'Round 18/24' : null,
            elapsed: index === 0 ? '12:34' : null,
            startsIn: index === 2 ? '2h 15m' : null
        }));
    }

    /**
     * Get upcoming tournaments
     */
    getUpcomingTournaments() {
        return this.data.tournaments
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 3);
    }

    /**
     * Get top players sorted by rating
     */
    getTopPlayers(limit = 10) {
        return this.data.players
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }

    /**
     * Get player by ID
     */
    getPlayer(playerId) {
        return this.data.players.find(p => p.player_id === playerId);
    }

    /**
     * Get player K/D ratio
     */
    getPlayerKD(player) {
        if (!player || player.deaths === 0) return 0;
        return (player.kills / player.deaths).toFixed(2);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Format relative time
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = date - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Started';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return `in ${diffDays} days`;
    }

    /**
     * Check if data is still loading
     */
    isLoading() {
        return Object.values(this.loading).some(v => v);
    }

    /**
     * Get any errors that occurred during loading
     */
    getErrors() {
        return this.errors;
    }
}

// Create global instance
const DataLoader = new DataLoader();
