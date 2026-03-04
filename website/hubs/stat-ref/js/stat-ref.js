/**
 * Statistical Reference HUB JavaScript
 * =====================================
 * Handles data loading, filtering, sorting, pagination, and UI interactions
 */

// ============================================
// SAMPLE DATA
// ============================================

const playersData = [
    { id: 1, name: "TenZ", team: "Sentinels", region: "NA", game: "Valorant", role: "Duelist", rating: 1.15, acs: 245, kd: 1.28, kast: 76, adr: 162, maps: 156 },
    { id: 2, name: "aspas", team: "Leviatán", region: "BR", game: "Valorant", role: "Duelist", rating: 1.18, acs: 258, kd: 1.35, kast: 74, adr: 168, maps: 203 },
    { id: 3, name: "s1mple", team: "NAVI", region: "EU", game: "CS", role: "AWPer", rating: 1.22, acs: 85, kd: 1.45, kast: 78, adr: 89, maps: 312 },
    { id: 4, name: "ZywOo", team: "Vitality", region: "EU", game: "CS", role: "AWPer", rating: 1.25, acs: 88, kd: 1.52, kast: 80, adr: 92, maps: 289 },
    { id: 5, name: "yay", team: "Cloud9", region: "NA", game: "Valorant", role: "Duelist", rating: 1.12, acs: 238, kd: 1.25, kast: 73, adr: 158, maps: 178 },
    { id: 6, name: "NiKo", team: "G2", region: "EU", game: "CS", role: "Rifler", rating: 1.18, acs: 86, kd: 1.32, kast: 76, adr: 91, maps: 356 },
    { id: 7, name: "f0rsakeN", team: "Paper Rex", region: "APAC", game: "Valorant", role: "Duelist", rating: 1.14, acs: 242, kd: 1.29, kast: 75, adr: 161, maps: 198 },
    { id: 8, name: "Derke", team: "FNATIC", region: "EU", game: "Valorant", role: "Duelist", rating: 1.16, acs: 248, kd: 1.31, kast: 77, adr: 165, maps: 224 },
    { id: 9, name: "m0NESY", team: "G2", region: "EU", game: "CS", role: "AWPer", rating: 1.15, acs: 84, kd: 1.28, kast: 74, adr: 88, maps: 198 },
    { id: 10, name: "Something", team: "Paper Rex", region: "APAC", game: "Valorant", role: "Controller", rating: 1.13, acs: 235, kd: 1.22, kast: 79, adr: 156, maps: 187 },
    { id: 11, name: "Alfajer", team: "FNATIC", region: "TR", game: "Valorant", role: "Sentinel", rating: 1.11, acs: 228, kd: 1.19, kast: 80, adr: 152, maps: 212 },
    { id: 12, name: "ropz", team: "FaZe", region: "EU", game: "CS", role: "Rifler", rating: 1.14, acs: 82, kd: 1.25, kast: 75, adr: 86, maps: 334 },
    { id: 13, name: "Boaster", team: "FNATIC", region: "EU", game: "Valorant", role: "IGL", rating: 1.08, acs: 215, kd: 1.12, kast: 82, adr: 148, maps: 245 },
    { id: 14, name: "ropz", team: "FaZe", region: "EU", game: "CS", role: "Rifler", rating: 1.13, acs: 81, kd: 1.24, kast: 76, adr: 85, maps: 298 },
    { id: 15, name: "Leaf", team: "Cloud9", region: "NA", game: "Valorant", role: "Controller", rating: 1.09, acs: 222, kd: 1.15, kast: 78, adr: 151, maps: 167 },
    { id: 16, name: "dev1ce", team: "Astralis", region: "DK", game: "CS", role: "AWPer", rating: 1.12, acs: 80, kd: 1.22, kast: 77, adr: 84, maps: 412 },
    { id: 17, name: " Chronicle", team: "NAVI", region: "EU", game: "Valorant", role: "Sentinel", rating: 1.10, acs: 225, kd: 1.18, kast: 81, adr: 154, maps: 234 },
    { id: 18, name: "electroNic", team: "NAVI", region: "RU", game: "CS", role: "Rifler", rating: 1.11, acs: 79, kd: 1.19, kast: 74, adr: 83, maps: 378 },
    { id: 19, name: "Jinggg", team: "Paper Rex", region: "SG", game: "Valorant", role: "Duelist", rating: 1.13, acs: 240, kd: 1.26, kast: 73, adr: 159, maps: 176 },
    { id: 20, name: "donk", team: "Spirit", region: "RU", game: "CS", role: "Rifler", rating: 1.20, acs: 90, kd: 1.38, kast: 75, adr: 95, maps: 89 },
    { id: 21, name: "ShahZaM", team: "Sentinels", region: "NA", game: "Valorant", role: "IGL", rating: 1.07, acs: 218, kd: 1.14, kast: 79, adr: 149, maps: 289 },
    { id: 22, name: "Hobbit", team: "Cloud9", region: "KZ", game: "CS", role: "Rifler", rating: 1.08, acs: 77, kd: 1.16, kast: 77, adr: 81, maps: 423 },
    { id: 23, name: "Dapr", team: "Sentinels", region: "NA", game: "Valorant", role: "Sentinel", rating: 1.06, acs: 212, kd: 1.11, kast: 80, adr: 145, maps: 267 },
    { id: 24, name: "sh1ro", team: "Spirit", region: "RU", game: "CS", role: "AWPer", rating: 1.16, acs: 83, kd: 1.29, kast: 78, adr: 87, maps: 245 }
];

const teamsData = [
    { id: 1, name: "Sentinels", region: "NA", game: "Valorant", rating: 1.12, rosterSize: 5, wins: 156, losses: 89 },
    { id: 2, name: "FNATIC", region: "EU", game: "Valorant", rating: 1.14, rosterSize: 6, wins: 203, losses: 112 },
    { id: 3, name: "NAVI", region: "EU", game: "CS", rating: 1.15, rosterSize: 5, wins: 423, losses: 289 },
    { id: 4, name: "Vitality", region: "EU", game: "CS", rating: 1.18, rosterSize: 5, wins: 378, losses: 234 },
    { id: 5, name: "Paper Rex", region: "APAC", game: "Valorant", rating: 1.13, rosterSize: 6, wins: 187, losses: 98 },
    { id: 6, name: "G2 Esports", region: "EU", game: "CS", rating: 1.16, rosterSize: 5, wins: 412, losses: 298 },
    { id: 7, name: "Leviatán", region: "BR", game: "Valorant", rating: 1.11, rosterSize: 6, wins: 134, losses: 87 },
    { id: 8, name: "FaZe Clan", region: "NA", game: "CS", rating: 1.14, rosterSize: 5, wins: 389, losses: 267 },
    { id: 9, name: "Cloud9", region: "NA", game: "Valorant", rating: 1.10, rosterSize: 5, wins: 145, losses: 112 },
    { id: 10, name: "Astralis", region: "DK", game: "CS", rating: 1.13, rosterSize: 5, wins: 467, losses: 298 },
    { id: 11, name: "Spirit", region: "RU", game: "CS", rating: 1.17, rosterSize: 5, wins: 234, losses: 156 },
    { id: 12, name: "Evil Geniuses", region: "NA", game: "Valorant", rating: 1.09, rosterSize: 6, wins: 123, losses: 98 }
];

const matchesData = [
    { id: 1, date: "2026-03-02", tournament: "VCT Masters Bangkok", team1: "Sentinels", team2: "FNATIC", score1: 2, score2: 1, map: "Split", game: "Valorant" },
    { id: 2, date: "2026-03-01", tournament: "VCT Masters Bangkok", team1: "Paper Rex", team2: "Leviatán", score1: 2, score2: 0, map: "Ascent", game: "Valorant" },
    { id: 3, date: "2026-02-28", tournament: "IEM Katowice 2026", team1: "NAVI", team2: "G2", score1: 2, score2: 1, map: "Inferno", game: "CS" },
    { id: 4, date: "2026-02-27", tournament: "IEM Katowice 2026", team1: "Vitality", team2: "FaZe", score1: 2, score2: 0, map: "Mirage", game: "CS" },
    { id: 5, date: "2026-02-26", tournament: "VCT Masters Bangkok", team1: "Cloud9", team2: "Sentinels", score1: 0, score2: 2, map: "Haven", game: "Valorant" },
    { id: 6, date: "2026-02-25", tournament: "IEM Katowice 2026", team1: "Spirit", team2: "Astralis", score1: 2, score2: 1, map: "Nuke", game: "CS" },
    { id: 7, date: "2026-02-24", tournament: "VCT Americas", team1: "Leviatán", team2: "Cloud9", score1: 2, score2: 1, map: "Lotus", game: "Valorant" },
    { id: 8, date: "2026-02-23", tournament: "BLAST Premier", team1: "FaZe", team2: "NAVI", score1: 1, score2: 2, map: "Ancient", game: "CS" },
    { id: 9, date: "2026-02-22", tournament: "VCT EMEA", team1: "FNATIC", team2: "NAVI", score1: 2, score2: 0, map: "Sunset", game: "Valorant" },
    { id: 10, date: "2026-02-21", tournament: "IEM Katowice 2026", team1: "G2", team2: "Vitality", score1: 1, score2: 2, map: "Dust2", game: "CS" },
    { id: 11, date: "2026-02-20", tournament: "VCT Pacific", team1: "Paper Rex", team2: "Gen.G", score1: 2, score2: 1, map: "Icebox", game: "Valorant" },
    { id: 12, date: "2026-02-19", tournament: "ESL Pro League", team1: "Astralis", team2: "Spirit", score1: 1, score2: 2, map: "Vertigo", game: "CS" },
    { id: 13, date: "2026-02-18", tournament: "VCT Americas", team1: "Sentinels", team2: "Evil Geniuses", score1: 2, score2: 0, map: "Bind", game: "Valorant" },
    { id: 14, date: "2026-02-17", tournament: "BLAST Premier", team1: "Vitality", team2: "FaZe", score1: 2, score2: 1, map: "Mirage", game: "CS" },
    { id: 15, date: "2026-02-16", tournament: "VCT EMEA", team1: "FNATIC", team2: "Karmine Corp", score1: 2, score2: 0, map: "Ascent", game: "Valorant" }
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on current page
    const path = window.location.pathname;
    
    if (path.includes('/players/') && !path.includes('index.html')) {
        initPlayerDetailPage();
    } else if (path.includes('/players/index.html') || path.endsWith('/players/')) {
        initPlayersPage();
    } else if (path.includes('/teams/')) {
        initTeamsPage();
    } else if (path.includes('/matches/')) {
        initMatchesPage();
    } else if (path.includes('/leaders/')) {
        initLeadersPage();
    } else if (path.includes('/compare')) {
        initComparePage();
    } else {
        initHomePage();
    }
});

// ============================================
// HOME PAGE
// ============================================

function initHomePage() {
    renderFeaturedPlayers();
    renderTopTeams();
    renderRecentMatches();
    initQuickSearch();
}

function renderFeaturedPlayers() {
    const container = document.getElementById('featuredPlayers');
    if (!container) return;
    
    const featured = playersData.slice(0, 4);
    
    container.innerHTML = featured.map((player, index) => `
        <a href="players/template.html?id=${player.id}" class="player-card stagger-item" style="animation-delay: ${index * 0.05}s">
            <div class="player-card__avatar">${getInitials(player.name)}</div>
            <div class="player-card__info">
                <div class="player-card__name">${escapeHtml(player.name)}</div>
                <div class="player-card__meta">
                    <span class="player-card__team">${escapeHtml(player.team)}</span>
                    <span>•</span>
                    <span>${player.role}</span>
                </div>
            </div>
            <div class="player-card__stats">
                <div class="player-card__stat-value">${player.acs}</div>
                <div class="player-card__stat-label">ACS</div>
            </div>
            <span class="player-card__role">${player.game}</span>
        </a>
    `).join('');
}

function renderTopTeams() {
    const container = document.getElementById('topTeams');
    if (!container) return;
    
    const topTeams = teamsData.slice(0, 5);
    
    container.innerHTML = topTeams.map((team, index) => `
        <a href="teams/template.html?id=${team.id}" class="team-card stagger-item" style="animation-delay: ${index * 0.05}s">
            <span class="team-card__rank">${index + 1}</span>
            <div class="team-card__logo">${getInitials(team.name)}</div>
            <div class="team-card__info">
                <div class="team-card__name">${escapeHtml(team.name)}</div>
                <div class="team-card__meta">${team.region} • ${team.game}</div>
            </div>
            <div class="team-card__rating">
                <div class="team-card__rating-value">${team.rating.toFixed(2)}</div>
                <div class="team-card__rating-label">Rating</div>
            </div>
        </a>
    `).join('');
}

function renderRecentMatches() {
    const container = document.getElementById('recentMatches');
    if (!container) return;
    
    const recent = matchesData.slice(0, 8);
    
    container.innerHTML = recent.map((match, index) => `
        <tr class="match-row stagger-item" style="animation-delay: ${index * 0.05}s" onclick="window.location.href='matches/detail.html?id=${match.id}'">
            <td class="match-row__date">${formatDate(match.date)}</td>
            <td class="match-row__tournament">
                <span class="match-row__tournament-icon">🏆</span>
                ${escapeHtml(match.tournament)}
            </td>
            <td>
                <div class="match-row__teams">
                    <span class="match-row__team">
                        <span class="match-row__team-logo">${getInitials(match.team1)}</span>
                        ${escapeHtml(match.team1)}
                    </span>
                    <span class="match-row__vs">vs</span>
                    <span class="match-row__team">
                        <span class="match-row__team-logo">${getInitials(match.team2)}</span>
                        ${escapeHtml(match.team2)}
                    </span>
                </div>
            </td>
            <td class="match-row__score">
                <span class="match-row__score--win">${match.score1}</span>
                <span class="text-gray-500 mx-1">-</span>
                <span class="match-row__score--loss">${match.score2}</span>
            </td>
            <td class="match-row__map">${match.map}</td>
            <td>
                <span class="match-row__game match-row__game--${match.game.toLowerCase() === 'cs' ? 'cs' : 'valorant'}">${match.game}</span>
            </td>
        </tr>
    `).join('');
}

function initQuickSearch() {
    const input = document.getElementById('quickSearch');
    const results = document.getElementById('quickSearchResults');
    
    if (!input) return;
    
    input.addEventListener('input', debounce(function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            results?.classList.add('hidden');
            return;
        }
        
        const playerMatches = playersData.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.team.toLowerCase().includes(query)
        ).slice(0, 3);
        
        const teamMatches = teamsData.filter(t => 
            t.name.toLowerCase().includes(query)
        ).slice(0, 2);
        
        if (playerMatches.length === 0 && teamMatches.length === 0) {
            results.innerHTML = '<div class="p-4 text-gray-400 text-sm">No results found</div>';
        } else {
            results.innerHTML = [
                ...playerMatches.map(p => `
                    <a href="players/template.html?id=${p.id}" class="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
                        <div class="w-10 h-10 rounded-full bg-stat-primary flex items-center justify-center text-stat-secondary font-semibold">${getInitials(p.name)}</div>
                        <div class="flex-1">
                            <div class="font-medium">${escapeHtml(p.name)}</div>
                            <div class="text-sm text-gray-400">${escapeHtml(p.team)} • ${p.game}</div>
                        </div>
                        <span class="text-stat-secondary text-sm">Player →</span>
                    </a>
                `),
                ...teamMatches.map(t => `
                    <a href="teams/template.html?id=${t.id}" class="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors">
                        <div class="w-10 h-10 rounded-lg bg-stat-primary flex items-center justify-center text-stat-secondary font-semibold">${getInitials(t.name)}</div>
                        <div class="flex-1">
                            <div class="font-medium">${escapeHtml(t.name)}</div>
                            <div class="text-sm text-gray-400">${t.region} • ${t.game}</div>
                        </div>
                        <span class="text-stat-secondary text-sm">Team →</span>
                    </a>
                `)
            ].join('');
        }
        
        results.classList.remove('hidden');
    }, 300));
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !results?.contains(e.target)) {
            results?.classList.add('hidden');
        }
    });
}

// ============================================
// PLAYERS PAGE
// ============================================

let currentPlayers = [...playersData];
let currentPage = 1;
const playersPerPage = 20;

function initPlayersPage() {
    renderPlayersList();
    renderPagination();
    initPlayerFilters();
}

function renderPlayersList() {
    const container = document.getElementById('playersList');
    if (!container) return;
    
    const start = (currentPage - 1) * playersPerPage;
    const end = start + playersPerPage;
    const pagePlayers = currentPlayers.slice(start, end);
    
    if (pagePlayers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔍</div>
                <div class="empty-state__title">No players found</div>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pagePlayers.map((player, index) => `
        <a href="template.html?id=${player.id}" class="player-card stagger-item" style="animation-delay: ${index * 0.03}s">
            <div class="player-card__avatar">${getInitials(player.name)}</div>
            <div class="player-card__info">
                <div class="player-card__name">${escapeHtml(player.name)}</div>
                <div class="player-card__meta">
                    <span class="player-card__team">${escapeHtml(player.team)}</span>
                    <span>•</span>
                    <span>${player.region}</span>
                    <span>•</span>
                    <span>${player.role}</span>
                </div>
            </div>
            <div class="player-card__stats hidden sm:block">
                <div class="flex gap-4 text-sm">
                    <div class="text-center">
                        <div class="player-card__stat-value text-base">${player.acs}</div>
                        <div class="player-card__stat-label">ACS</div>
                    </div>
                    <div class="text-center">
                        <div class="player-card__stat-value text-base">${player.kd.toFixed(2)}</div>
                        <div class="player-card__stat-label">K/D</div>
                    </div>
                    <div class="text-center">
                        <div class="player-card__stat-value text-base">${player.kast}%</div>
                        <div class="player-card__stat-label">KAST</div>
                    </div>
                </div>
            </div>
            <span class="player-card__role">${player.game}</span>
        </a>
    `).join('');
    
    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${start + 1}-${Math.min(end, currentPlayers.length)} of ${currentPlayers.length} players`;
    }
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(currentPlayers.length / playersPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">←</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="pagination__btn" disabled>...</span>`;
        }
    }
    
    // Next button
    html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">→</button>`;
    
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderPlayersList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPlayerFilters() {
    const searchInput = document.getElementById('playerSearch');
    const gameFilter = document.getElementById('gameFilter');
    const regionFilter = document.getElementById('regionFilter');
    const roleFilter = document.getElementById('roleFilter');
    const sortSelect = document.getElementById('sortSelect');
    
    function applyFilters() {
        const search = searchInput?.value.toLowerCase() || '';
        const game = gameFilter?.value || '';
        const region = regionFilter?.value || '';
        const role = roleFilter?.value || '';
        const sort = sortSelect?.value || 'name';
        
        currentPlayers = playersData.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(search) || 
                                  player.team.toLowerCase().includes(search);
            const matchesGame = !game || player.game === game;
            const matchesRegion = !region || player.region === region;
            const matchesRole = !role || player.role === role;
            
            return matchesSearch && matchesGame && matchesRegion && matchesRole;
        });
        
        // Sort
        currentPlayers.sort((a, b) => {
            switch (sort) {
                case 'name': return a.name.localeCompare(b.name);
                case 'rating': return b.rating - a.rating;
                case 'acs': return b.acs - a.acs;
                case 'kd': return b.kd - a.kd;
                default: return 0;
            }
        });
        
        currentPage = 1;
        renderPlayersList();
        renderPagination();
    }
    
    searchInput?.addEventListener('input', debounce(applyFilters, 300));
    gameFilter?.addEventListener('change', applyFilters);
    regionFilter?.addEventListener('change', applyFilters);
    roleFilter?.addEventListener('change', applyFilters);
    sortSelect?.addEventListener('change', applyFilters);
}

// ============================================
// TEAMS PAGE
// ============================================

function initTeamsPage() {
    renderTeamsList();
    initTeamFilters();
}

function renderTeamsList() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    
    const filteredTeams = getFilteredTeams();
    
    if (filteredTeams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔍</div>
                <div class="empty-state__title">No teams found</div>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredTeams.map((team, index) => `
        <a href="template.html?id=${team.id}" class="hub-card hub-card--statref stagger-item" style="animation-delay: ${index * 0.03}s">
            <div class="hub-card__header">
                <div class="hub-card__icon" style="width: 64px; height: 64px; font-size: 1.5rem;">${getInitials(team.name)}</div>
                <span class="hub-card__badge">${team.game}</span>
            </div>
            <h3 class="hub-card__title">${escapeHtml(team.name)}</h3>
            <p class="hub-card__description">
                ${team.region} • ${team.rosterSize} players<br>
                ${team.wins}W - ${team.losses}L
            </p>
            <div class="hub-card__footer">
                <div class="flex items-center gap-2">
                    <span class="text-stat-secondary font-mono font-semibold">${team.rating.toFixed(2)}</span>
                    <span class="text-gray-500 text-sm">Rating</span>
                </div>
                <span class="hub-card__action">View Team</span>
            </div>
        </a>
    `).join('');
}

function getFilteredTeams() {
    const search = document.getElementById('teamSearch')?.value.toLowerCase() || '';
    const region = document.getElementById('regionFilter')?.value || '';
    const game = document.getElementById('gameFilter')?.value || '';
    
    return teamsData.filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(search);
        const matchesRegion = !region || team.region === region;
        const matchesGame = !game || team.game === game;
        return matchesSearch && matchesRegion && matchesGame;
    });
}

function initTeamFilters() {
    const inputs = ['teamSearch', 'regionFilter', 'gameFilter'];
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            renderTeamsList();
        });
    });
}

// ============================================
// MATCHES PAGE
// ============================================

function initMatchesPage() {
    renderMatchesList();
    initMatchFilters();
}

function renderMatchesList() {
    const container = document.getElementById('matchesList');
    if (!container) return;
    
    const filteredMatches = getFilteredMatches();
    
    if (filteredMatches.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📅</div>
                <div class="empty-state__title">No matches found</div>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="w-full stat-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Tournament</th>
                    <th>Match</th>
                    <th>Score</th>
                    <th>Map</th>
                    <th>Game</th>
                </tr>
            </thead>
            <tbody>
                ${filteredMatches.map((match, index) => `
                    <tr class="match-row stagger-item" style="animation-delay: ${index * 0.03}s" onclick="window.location.href='detail.html?id=${match.id}'">
                        <td class="match-row__date">${formatDate(match.date)}</td>
                        <td class="match-row__tournament">
                            <span class="match-row__tournament-icon">🏆</span>
                            ${escapeHtml(match.tournament)}
                        </td>
                        <td>
                            <div class="match-row__teams">
                                <span class="match-row__team">
                                    <span class="match-row__team-logo">${getInitials(match.team1)}</span>
                                    ${escapeHtml(match.team1)}
                                </span>
                                <span class="match-row__vs">vs</span>
                                <span class="match-row__team">
                                    <span class="match-row__team-logo">${getInitials(match.team2)}</span>
                                    ${escapeHtml(match.team2)}
                                </span>
                            </div>
                        </td>
                        <td class="match-row__score">
                            <span class="match-row__score--win">${match.score1}</span>
                            <span class="text-gray-500 mx-1">-</span>
                            <span class="match-row__score--loss">${match.score2}</span>
                        </td>
                        <td class="match-row__map">${match.map}</td>
                        <td>
                            <span class="match-row__game match-row__game--${match.game.toLowerCase() === 'cs' ? 'cs' : 'valorant'}">${match.game}</span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getFilteredMatches() {
    const tournament = document.getElementById('tournamentFilter')?.value.toLowerCase() || '';
    const game = document.getElementById('gameFilter')?.value || '';
    const team = document.getElementById('teamFilter')?.value.toLowerCase() || '';
    
    return matchesData.filter(match => {
        const matchesTournament = !tournament || match.tournament.toLowerCase().includes(tournament);
        const matchesGame = !game || match.game === game;
        const matchesTeam = !team || match.team1.toLowerCase().includes(team) || match.team2.toLowerCase().includes(team);
        return matchesTournament && matchesGame && matchesTeam;
    });
}

function initMatchFilters() {
    const inputs = ['tournamentFilter', 'gameFilter', 'teamFilter'];
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            renderMatchesList();
        });
    });
}

// ============================================
// LEADERBOARDS PAGE
// ============================================

function initLeadersPage() {
    renderLeaderboards('valorant');
    initLeaderboardTabs();
}

function initLeaderboardTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('tab--active'));
            tab.classList.add('tab--active');
            renderLeaderboards(tab.dataset.game);
        });
    });
}

function renderLeaderboards(game) {
    const filteredPlayers = playersData.filter(p => p.game.toLowerCase() === game.toLowerCase());
    
    // ACS Leaders
    const acsLeaders = [...filteredPlayers].sort((a, b) => b.acs - a.acs).slice(0, 10);
    renderLeaderboardList('acsLeaders', acsLeaders, 'acs', 'ACS');
    
    // Rating Leaders
    const ratingLeaders = [...filteredPlayers].sort((a, b) => b.rating - a.rating).slice(0, 10);
    renderLeaderboardList('ratingLeaders', ratingLeaders, 'rating', 'Rating');
    
    // K/D Leaders
    const kdLeaders = [...filteredPlayers].sort((a, b) => b.kd - a.kd).slice(0, 10);
    renderLeaderboardList('kdLeaders', kdLeaders, 'kd', 'K/D');
    
    // KAST Leaders
    const kastLeaders = [...filteredPlayers].sort((a, b) => b.kast - a.kast).slice(0, 10);
    renderLeaderboardList('kastLeaders', kastLeaders, 'kast', 'KAST%', '%');
}

function renderLeaderboardList(containerId, players, statKey, label, suffix = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = players.map((player, index) => `
        <a href="../players/template.html?id=${player.id}" class="leaderboard-item stagger-item" style="animation-delay: ${index * 0.03}s">
            <span class="leaderboard-item__rank ${index < 3 ? 'leaderboard-item__rank--top' : ''}">${index + 1}</span>
            <div class="leaderboard-item__avatar">${getInitials(player.name)}</div>
            <div class="leaderboard-item__info">
                <div class="leaderboard-item__name">${escapeHtml(player.name)}</div>
                <div class="leaderboard-item__team">${escapeHtml(player.team)}</div>
            </div>
            <div class="leaderboard-item__value">
                ${statKey === 'rating' ? player[statKey].toFixed(2) : player[statKey]}${suffix}
            </div>
        </a>
    `).join('');
}

// ============================================
// PLAYER DETAIL PAGE
// ============================================

function initPlayerDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = parseInt(urlParams.get('id')) || 1;
    const player = playersData.find(p => p.id === playerId) || playersData[0];
    
    // Update page title
    document.title = `${player.name} - Player Profile | SATOR Statistical Reference`;
    
    // Render player header
    renderPlayerHeader(player);
    
    // Render stats
    renderPlayerStats(player);
    
    // Render teammates
    renderPlayerTeammates(player);
    
    // Render recent matches
    renderPlayerMatches(player);
}

function renderPlayerHeader(player) {
    const nameEl = document.getElementById('playerName');
    const teamEl = document.getElementById('playerTeam');
    const roleEl = document.getElementById('playerRole');
    const gameEl = document.getElementById('playerGame');
    const regionEl = document.getElementById('playerRegion');
    const avatarEl = document.getElementById('playerAvatar');
    
    if (nameEl) nameEl.textContent = player.name;
    if (teamEl) teamEl.textContent = player.team;
    if (roleEl) roleEl.textContent = player.role;
    if (gameEl) gameEl.textContent = player.game;
    if (regionEl) regionEl.textContent = player.region;
    if (avatarEl) avatarEl.textContent = getInitials(player.name);
}

function renderPlayerStats(player) {
    const stats = [
        { label: 'Rating', value: player.rating.toFixed(2) },
        { label: 'ACS', value: player.acs },
        { label: 'K/D', value: player.kd.toFixed(2) },
        { label: 'KAST%', value: player.kast + '%' },
        { label: 'ADR', value: player.adr },
        { label: 'Maps', value: player.maps }
    ];
    
    const container = document.getElementById('playerStats');
    if (!container) return;
    
    container.innerHTML = stats.map((stat, index) => `
        <div class="player-stat-box stagger-item" style="animation-delay: ${index * 0.05}s">
            <div class="player-stat-box__value">${stat.value}</div>
            <div class="player-stat-box__label">${stat.label}</div>
        </div>
    `).join('');
}

function renderPlayerTeammates(player) {
    const teammates = playersData.filter(p => p.team === player.team && p.id !== player.id);
    const container = document.getElementById('playerTeammates');
    if (!container) return;
    
    if (teammates.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No teammates found</p>';
        return;
    }
    
    container.innerHTML = teammates.map((teammate, index) => `
        <a href="template.html?id=${teammate.id}" class="player-card stagger-item" style="animation-delay: ${index * 0.05}s">
            <div class="player-card__avatar">${getInitials(teammate.name)}</div>
            <div class="player-card__info">
                <div class="player-card__name">${escapeHtml(teammate.name)}</div>
                <div class="player-card__meta">${teammate.role}</div>
            </div>
            <span class="player-card__role">${teammate.acs} ACS</span>
        </a>
    `).join('');
}

function renderPlayerMatches(player) {
    // Simulate player matches (in reality, this would be filtered by player participation)
    const playerMatches = matchesData.filter(m => 
        m.team1 === player.team || m.team2 === player.team
    ).slice(0, 5);
    
    const container = document.getElementById('playerMatches');
    if (!container) return;
    
    if (playerMatches.length === 0) {
        container.innerHTML = '<p class="text-gray-400">No recent matches</p>';
        return;
    }
    
    container.innerHTML = playerMatches.map((match, index) => `
        <div class="match-row stagger-item" style="animation-delay: ${index * 0.05}s" onclick="window.location.href='../matches/detail.html?id=${match.id}'">
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="text-sm text-gray-400">${formatDate(match.date)}</div>
                    <div class="font-medium">${escapeHtml(match.team1)} <span class="text-gray-500">vs</span> ${escapeHtml(match.team2)}</div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="match-row__game match-row__game--${match.game.toLowerCase() === 'cs' ? 'cs' : 'valorant'}">${match.game}</span>
                    <span class="font-mono font-semibold">${match.score1}-${match.score2}</span>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// COMPARE PAGE (STUB)
// ============================================

function initComparePage() {
    // Stub for comparison functionality
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.addEventListener('click', () => {
            alert('Player comparison feature coming soon!');
        });
    }
}

// ============================================
// UTILITY
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for global access
window.changePage = changePage;
