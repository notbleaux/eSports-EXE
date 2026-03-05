-- Sample data for RAWS-BASE parity testing
-- SATOR-eXe-ROTAS Demo Data

-- Insert tournaments
INSERT INTO raws_tournaments (tournament_id, tournament_name, game_id, organizer, region, tier, prize_pool_usd, start_date, end_date, data_hash) VALUES
('t1', 'IEM Katowice 2024', 'cs2', 'ESL', 'eu', 1, 1000000, '2024-01-31', '2024-02-11', 'hash_placeholder'),
('t2', 'BLAST Premier Spring Final', 'cs2', 'BLAST', 'eu', 1, 425000, '2024-06-12', '2024-06-16', 'hash_placeholder');

-- Insert teams
INSERT INTO raws_teams (team_id, team_name, team_short, game_id, region, country, data_hash) VALUES
('navi', 'Natus Vincere', 'NAVI', 'cs2', 'eu', 'ua', 'hash_placeholder'),
('faze', 'FaZe Clan', 'FAZE', 'cs2', 'eu', 'eu', 'hash_placeholder'),
('g2', 'G2 Esports', 'G2', 'cs2', 'eu', 'de', 'hash_placeholder');

-- Insert players
INSERT INTO raws_players (player_id, player_name, real_name, game_id, country, primary_role, current_team_id, data_hash) VALUES
('s1mple', 's1mple', 'Oleksandr Kostyliev', 'cs2', 'ua', 'awp', 'navi', 'hash_placeholder'),
('b1t', 'b1t', 'Valerii Vakhovskyi', 'cs2', 'ua', 'rifler', 'navi', 'hash_placeholder'),
('ropz', 'ropz', 'Robin Kool', 'cs2', 'ee', 'rifler', 'faze', 'hash_placeholder'),
('karrigan', 'karrigan', 'Finn Andersen', 'cs2', 'dk', 'igl', 'faze', 'hash_placeholder'),
('m0nesy', 'm0nesy', 'Ilya Osipov', 'cs2', 'ru', 'awp', 'g2', 'hash_placeholder');

-- Insert a match
INSERT INTO raws_matches (match_id, game_id, tournament_id, team_a_id, team_b_id, winner_id, team_a_score, team_b_score, match_date, best_of, status, data_hash) VALUES
('m1', 'cs2', 't1', 'navi', 'faze', 'navi', 2, 1, '2024-02-10 18:00:00', 3, 'completed', 'hash_placeholder');

-- Insert player stats for the match
INSERT INTO raws_player_stats (stat_id, match_id, player_id, team_id, kills, deaths, assists, damage, rounds_played, rating, data_hash) VALUES
('ps1', 'm1', 's1mple', 'navi', 65, 42, 12, 8900, 76, 1.45, 'hash_placeholder'),
('ps2', 'm1', 'b1t', 'navi', 52, 48, 18, 7200, 76, 1.12, 'hash_placeholder'),
('ps3', 'm1', 'ropz', 'faze', 58, 45, 8, 6800, 76, 1.28, 'hash_placeholder'),
('ps4', 'm1', 'karrigan', 'faze', 38, 58, 22, 5100, 76, 0.78, 'hash_placeholder');

-- Now insert corresponding BASE records (normally these would be computed)
INSERT INTO base_tournaments (tournament_id, total_matches, completed_matches, total_teams, parity_hash, last_synced, sync_status) VALUES
('t1', 47, 47, 24, 'hash_placeholder', datetime('now'), 'synced'),
('t2', 31, 31, 8, 'hash_placeholder', datetime('now'), 'synced');

INSERT INTO base_teams (team_id, matches_played, matches_won, win_rate, map_win_rate, form_rating, parity_hash, last_synced, sync_status) VALUES
('navi', 156, 98, 0.628, 0.58, 1.08, 'hash_placeholder', datetime('now'), 'synced'),
('faze', 203, 134, 0.660, 0.62, 1.12, 'hash_placeholder', datetime('now'), 'synced'),
('g2', 178, 112, 0.629, 0.55, 1.05, 'hash_placeholder', datetime('now'), 'synced');

INSERT INTO base_players (player_id, matches_played, rating_avg, kdr, adr, impact_rating, parity_hash, last_synced, sync_status) VALUES
('s1mple', 892, 1.32, 1.28, 88.5, 1.45, 'hash_placeholder', datetime('now'), 'synced'),
('b1t', 456, 1.15, 1.12, 76.2, 1.18, 'hash_placeholder', datetime('now'), 'synced'),
('ropz', 678, 1.18, 1.22, 82.4, 1.22, 'hash_placeholder', datetime('now'), 'synced'),
('karrigan', 1245, 0.95, 0.82, 68.1, 0.88, 'hash_placeholder', datetime('now'), 'synced'),
('m0nesy', 234, 1.25, 1.35, 85.3, 1.38, 'hash_placeholder', datetime('now'), 'synced');

INSERT INTO base_matches (match_id, upset_flag, quality_rating, team_a_performance_vs_expected, team_b_performance_vs_expected, parity_hash, last_synced, sync_status) VALUES
('m1', 0, 8.5, 1.12, 0.94, 'hash_placeholder', datetime('now'), 'synced');

INSERT INTO base_player_stats (stat_id, kdr, kpr, impact, vs_career_avg_rating, parity_hash, last_synced, sync_status) VALUES
('ps1', 1.55, 0.86, 1.52, 0.15, 'hash_placeholder', datetime('now'), 'synced'),
('ps2', 1.08, 0.68, 1.08, -0.03, 'hash_placeholder', datetime('now'), 'synced'),
('ps3', 1.29, 0.76, 1.31, 0.08, 'hash_placeholder', datetime('now'), 'synced'),
('ps4', 0.66, 0.50, 0.72, -0.18, 'hash_placeholder', datetime('now'), 'synced');

-- Insert an orphaned BASE record (for testing parity checker)
INSERT INTO base_players (player_id, matches_played, rating_avg, kdr, adr, impact_rating, parity_hash, last_synced, sync_status) VALUES
('deleted_player', 12, 0.89, 0.78, 62.0, 0.82, 'hash_placeholder', datetime('now'), 'synced');

-- Insert a BASE record with sync error (for testing)
INSERT INTO base_teams (team_id, matches_played, matches_won, win_rate, map_win_rate, form_rating, parity_hash, last_synced, sync_status, sync_error) VALUES
('error_team', 50, 25, 0.5, 0.48, 0.95, 'hash_placeholder', datetime('now'), 'error', 'Failed to compute map statistics');

-- Update hashes to demonstrate parity system
UPDATE raws_tournaments SET data_hash = substr(lower(hex(randomblob(16))), 1, 32);
UPDATE raws_teams SET data_hash = substr(lower(hex(randomblob(16))), 1, 32);
UPDATE raws_players SET data_hash = substr(lower(hex(randomblob(16))), 1, 32);
UPDATE raws_matches SET data_hash = substr(lower(hex(randomblob(16))), 1, 32);
UPDATE raws_player_stats SET data_hash = substr(lower(hex(randomblob(16))), 1, 32);

-- Copy hashes to BASE for most records (intentionally leave mismatches for demo)
UPDATE base_tournaments SET parity_hash = (SELECT data_hash FROM raws_tournaments WHERE raws_tournaments.tournament_id = base_tournaments.tournament_id);
UPDATE base_teams SET parity_hash = (SELECT data_hash FROM raws_teams WHERE raws_teams.team_id = base_teams.team_id) WHERE team_id NOT IN ('error_team');
UPDATE base_players SET parity_hash = (SELECT data_hash FROM raws_players WHERE raws_players.player_id = base_players.player_id) WHERE player_id NOT IN ('deleted_player');
UPDATE base_matches SET parity_hash = (SELECT data_hash FROM raws_matches WHERE raws_matches.match_id = base_matches.match_id);
UPDATE base_player_stats SET parity_hash = (SELECT data_hash FROM raws_player_stats WHERE raws_player_stats.stat_id = base_player_stats.stat_id);
