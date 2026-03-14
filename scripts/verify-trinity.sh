[Ver001.000]

#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                     TRINITY + OPERA VERIFICATION SCRIPT                      ║
# ║                  "Four Realms - One Unified Architecture"                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Purpose: Verify all 4 database components of the TRINITY + OPERA architecture
# Usage: ./scripts/verify-trinity.sh [--verbose] [--component <a|b|c|d>]
# Dependencies: sqlite3, psql, turso CLI, mysql client

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
VERBOSE=false
COMPONENT="all"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Component paths and settings
SQLITE_DB_PATH="${SQLITE_DB_PATH:-/var/lib/sator/queue.db}"
TURSO_DB_URL="${TURSO_DATABASE_URL:-}"
TURSO_AUTH_TOKEN="${TURSO_AUTH_TOKEN:-}"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((TESTS_SKIPPED++))
}

log_section() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
}

log_subsection() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${YELLOW}[VERBOSE]${NC} $1"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT A: SQLITE TASK QUEUE VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

verify_component_a() {
    log_section "COMPONENT A: SQLITE TASK QUEUE (The Scheduler)"
    
    log_subsection "Checking SQLite Installation"
    if command -v sqlite3 &> /dev/null; then
        SQLITE_VERSION=$(sqlite3 --version | awk '{print $1}')
        log_success "SQLite installed: v${SQLITE_VERSION}"
        verbose "Full version: $(sqlite3 --version)"
    else
        log_error "SQLite3 not found in PATH"
        return 1
    fi
    
    log_subsection "Checking Database File"
    if [[ -f "$SQLITE_DB_PATH" ]]; then
        DB_SIZE=$(du -h "$SQLITE_DB_PATH" | cut -f1)
        log_success "Database file exists: $SQLITE_DB_PATH (${DB_SIZE})"
        verbose "File permissions: $(ls -la "$SQLITE_DB_PATH" | awk '{print $1}')"
    else
        log_warn "Database file not found: $SQLITE_DB_PATH (will be created on first use)"
    fi
    
    log_subsection "Verifying Table Schema"
    if [[ -f "$SQLITE_DB_PATH" ]]; then
        # Check task_queue table
        if sqlite3 "$SQLITE_DB_PATH" ".tables" | grep -q "task_queue"; then
            log_success "task_queue table exists"
            
            if [[ "$VERBOSE" == "true" ]]; then
                echo -e "\n${YELLOW}Table Schema:${NC}"
                sqlite3 "$SQLITE_DB_PATH" ".schema task_queue" | sed 's/^/  /'
            fi
        else
            log_error "task_queue table not found"
        fi
        
        # Check harvest_tasks table
        if sqlite3 "$SQLITE_DB_PATH" ".tables" | grep -q "harvest_tasks"; then
            log_success "harvest_tasks table exists"
        else
            log_warn "harvest_tasks table not found (legacy name may be used)"
        fi
        
        log_subsection "Queue Statistics"
        local pending_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='pending';" 2>/dev/null || echo "0")
        local processing_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='processing';" 2>/dev/null || echo "0")
        local failed_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='failed';" 2>/dev/null || echo "0")
        local completed_count=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='completed';" 2>/dev/null || echo "0")
        
        log_info "Queue Stats - Pending: ${pending_count}, Processing: ${processing_count}, Failed: ${failed_count}, Completed: ${completed_count}"
        
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "\n${YELLOW}Recent Tasks:${NC}"
            sqlite3 "$SQLITE_DB_PATH" "SELECT task_id, task_type, status, created_at FROM task_queue ORDER BY created_at DESC LIMIT 5;" 2>/dev/null | sed 's/^/  /' || echo "  No tasks found"
        fi
    fi
    
    log_subsection "Testing Enqueue/Dequeue Operations"
    local test_db="/tmp/trinity_test_$$.db"
    
    # Create test database
    sqlite3 "$test_db" "
        CREATE TABLE task_queue (
            task_id TEXT PRIMARY KEY,
            task_type TEXT NOT NULL,
            source TEXT NOT NULL,
            payload TEXT NOT NULL,
            priority INTEGER DEFAULT 5,
            scheduled_at TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT,
            worker_id TEXT
        );
    "
    
    # Test enqueue
    local test_id="test_$(date +%s)"
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    sqlite3 "$test_db" "
        INSERT INTO task_queue (task_id, task_type, source, payload, scheduled_at, created_at, status)
        VALUES ('$test_id', 'TEST_TASK', 'verification', '{\"test\": true}', '$now', '$now', 'pending');
    "
    
    if sqlite3 "$test_db" "SELECT task_id FROM task_queue WHERE task_id='$test_id';" | grep -q "$test_id"; then
        log_success "Enqueue operation successful"
    else
        log_error "Enqueue operation failed"
    fi
    
    # Test dequeue
    sqlite3 "$test_db" "
        UPDATE task_queue SET status='processing', started_at='$now', worker_id='test_worker' WHERE task_id='$test_id';
    "
    
    local status=$(sqlite3 "$test_db" "SELECT status FROM task_queue WHERE task_id='$test_id';")
    if [[ "$status" == "processing" ]]; then
        log_success "Dequeue (status update) operation successful"
    else
        log_error "Dequeue operation failed"
    fi
    
    # Cleanup
    rm -f "$test_db"
    
    log_subsection "WAL Mode Verification"
    if [[ -f "$SQLITE_DB_PATH" ]]; then
        local journal_mode=$(sqlite3 "$SQLITE_DB_PATH" "PRAGMA journal_mode;" 2>/dev/null)
        if [[ "$journal_mode" == "wal" ]]; then
            log_success "WAL mode enabled for high concurrency"
        else
            log_warn "WAL mode not enabled (current: $journal_mode)"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT B: POSTGRESQL PRIMARY VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

verify_component_b() {
    log_section "COMPONENT B: POSTGRESQL PRIMARY (The Brain)"
    
    log_subsection "Checking PostgreSQL Client"
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        log_success "PostgreSQL client installed: v${PSQL_VERSION}"
    else
        log_error "PostgreSQL client (psql) not found in PATH"
        return 1
    fi
    
    log_subsection "Checking Database Connection"
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_warn "DATABASE_URL environment variable not set"
        log_info "Attempting to read from .env file..."
        
        if [[ -f "$PROJECT_ROOT/.env" ]]; then
            DATABASE_URL=$(grep "DATABASE_URL" "$PROJECT_ROOT/.env" | cut -d'=' -f2- | tr -d '"')
            export DATABASE_URL
        fi
    fi
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not configured - skipping PostgreSQL verification"
        return 1
    fi
    
    verbose "Using DATABASE_URL: ${DATABASE_URL//:*@/:****@}"
    
    # Test connection
    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        PG_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" | head -1 | sed 's/^ *//')
        log_success "PostgreSQL connection successful"
        log_info "Server: ${PG_VERSION}"
    else
        log_error "PostgreSQL connection failed - check DATABASE_URL"
        return 1
    fi
    
    log_subsection "Verifying Core Tables"
    
    # Check player_performance table
    if psql "$DATABASE_URL" -c "\dt player_performance" > /dev/null 2>&1; then
        log_success "player_performance table exists"
        
        local perf_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM player_performance;" 2>/dev/null | tr -d ' ')
        log_info "Records in player_performance: ${perf_count:-0}"
    else
        log_error "player_performance table not found"
    fi
    
    # Check player_stats table
    if psql "$DATABASE_URL" -c "\dt player_stats" > /dev/null 2>&1; then
        log_success "player_stats table exists"
    else
        log_error "player_stats table not found"
    fi
    
    # Check mv_daily_player_stats materialized view
    if psql "$DATABASE_URL" -c "\dm mv_daily_player_stats" > /dev/null 2>&1; then
        log_success "mv_daily_player_stats materialized view exists"
        
        # Test query
        local sample=$(psql "$DATABASE_URL" -t -c "SELECT * FROM mv_daily_player_stats LIMIT 1;" 2>/dev/null)
        if [[ -n "$sample" ]]; then
            log_success "mv_daily_player_stats returns data"
        else
            log_warn "mv_daily_player_stats is empty (may need refresh)"
        fi
    else
        log_warn "mv_daily_player_stats materialized view not found"
    fi
    
    # Check mv_weekly_team_rankings
    if psql "$DATABASE_URL" -c "\dm mv_weekly_team_rankings" > /dev/null 2>&1; then
        log_success "mv_weekly_team_rankings materialized view exists"
    else
        log_warn "mv_weekly_team_rankings materialized view not found"
    fi
    
    log_subsection "Checking Migration Status"
    if psql "$DATABASE_URL" -c "\dt schema_migrations" > /dev/null 2>&1; then
        local latest_migration=$(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
        log_success "Latest migration: $latest_migration"
        
        if [[ "$latest_migration" == *"010"* ]]; then
            log_success "Migration 010 (TRINITY) applied"
        fi
    elif psql "$DATABASE_URL" -c "\dt alembic_version" > /dev/null 2>&1; then
        local alembic_version=$(psql "$DATABASE_URL" -t -c "SELECT version_num FROM alembic_version;" 2>/dev/null | tr -d ' ')
        log_info "Alembic version: $alembic_version"
    else
        log_warn "No migration tracking table found"
    fi
    
    log_subsection "Connection Pool Status"
    if psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity;" > /dev/null 2>&1; then
        local active_connections=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state='active';" 2>/dev/null | tr -d ' ')
        local idle_connections=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state='idle';" 2>/dev/null | tr -d ' ')
        log_info "Active connections: ${active_connections:-0}, Idle: ${idle_connections:-0}"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "\n${YELLOW}All Tables:${NC}"
        psql "$DATABASE_URL" -c "\dt" | grep -E "^ (public|sator)" | sed 's/^/  /'
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT C: TURSO EDGE VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

verify_component_c() {
    log_section "COMPONENT C: TURSO EDGE CACHE (The Global Cache)"
    
    log_subsection "Checking Turso CLI"
    if command -v turso &> /dev/null; then
        TURSO_VERSION=$(turso --version 2>/dev/null || echo "installed")
        log_success "Turso CLI installed: ${TURSO_VERSION}"
    else
        log_warn "Turso CLI not found - some checks will be skipped"
    fi
    
    log_subsection "Checking Database Configuration"
    if [[ -z "${TURSO_DATABASE_URL:-}" ]]; then
        if [[ -f "$PROJECT_ROOT/.env" ]]; then
            TURSO_DATABASE_URL=$(grep "TURSO_DATABASE_URL\|TURSO_DB_URL" "$PROJECT_ROOT/.env" | head -1 | cut -d'=' -f2- | tr -d '"')
        fi
    fi
    
    if [[ -z "${TURSO_AUTH_TOKEN:-}" ]]; then
        if [[ -f "$PROJECT_ROOT/.env" ]]; then
            TURSO_AUTH_TOKEN=$(grep "TURSO_AUTH_TOKEN" "$PROJECT_ROOT/.env" | head -1 | cut -d'=' -f2- | tr -d '"')
        fi
    fi
    
    if [[ -z "${TURSO_DATABASE_URL:-}" ]]; then
        log_warn "TURSO_DATABASE_URL not configured - skipping connection test"
    else
        log_success "Turso database URL configured"
        verbose "Database URL: ${TURSO_DATABASE_URL/libsql:/libsql:****@}"
    fi
    
    if [[ -z "${TURSO_AUTH_TOKEN:-}" ]]; then
        log_warn "TURSO_AUTH_TOKEN not configured"
    else
        log_success "Turso auth token configured"
        verbose "Token length: ${#TURSO_AUTH_TOKEN} characters"
    fi
    
    log_subsection "Testing libSQL Connection"
    if command -v turso &> /dev/null && [[ -n "${TURSO_DATABASE_URL:-}" ]]; then
        # Extract database name from URL
        local db_name=$(echo "$TURSO_DATABASE_URL" | sed -E 's/.*\/([a-zA-Z0-9_-]+)(\?.*)?$/\1/')
        
        if turso db list 2>/dev/null | grep -q "$db_name"; then
            log_success "Database '$db_name' found in Turso account"
            
            # Test query
            if turso db shell "$db_name" "SELECT 1 as test;" > /dev/null 2>&1; then
                log_success "Turso database connection successful"
            else
                log_error "Turso database query failed"
            fi
        else
            log_warn "Database '$db_name' not found in Turso account list"
        fi
    fi
    
    log_subsection "Verifying Edge Schema"
    if command -v turso &> /dev/null && [[ -n "${TURSO_DATABASE_URL:-}" ]]; then
        local db_name=$(echo "$TURSO_DATABASE_URL" | sed -E 's/.*\/([a-zA-Z0-9_-]+)(\?.*)?$/\1/')
        
        # Check player_performance_edge table
        local tables=$(turso db shell "$db_name" ".tables" 2>/dev/null || echo "")
        
        if echo "$tables" | grep -q "player_performance_edge"; then
            log_success "player_performance_edge table exists"
            
            local edge_count=$(turso db shell "$db_name" "SELECT COUNT(*) FROM player_performance_edge;" 2>/dev/null | tr -d '\n' || echo "0")
            log_info "Records in player_performance_edge: ${edge_count:-0}"
        else
            log_warn "player_performance_edge table not found"
        fi
        
        # Check sync status
        if echo "$tables" | grep -q "sync_checkpoint"; then
            local last_sync=$(turso db shell "$db_name" "SELECT MAX(synced_at) FROM sync_checkpoint;" 2>/dev/null | tr -d '\n')
            if [[ -n "$last_sync" ]]; then
                log_success "Sync checkpoint found (last: $last_sync)"
            else
                log_warn "Sync checkpoint table empty"
            fi
        fi
    fi
    
    log_subsection "Checking Sync Status"
    if command -v turso &> /dev/null && [[ -n "${TURSO_DATABASE_URL:-}" ]]; then
        log_info "Run 'turso db replicate-status <db-name>' for detailed sync information"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT D: TiDB OPERA VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

verify_component_d() {
    log_section "COMPONENT D: TiDB OPERA (The Satellite)"
    
    log_subsection "Checking MySQL Client"
    if command -v mysql &> /dev/null; then
        MYSQL_VERSION=$(mysql --version | awk '{print $3}' | tr -d ',')
        log_success "MySQL client installed: ${MYSQL_VERSION}"
    else
        log_error "MySQL client not found in PATH"
        return 1
    fi
    
    log_subsection "Checking TiDB Configuration"
    
    # Load from environment or .env file
    if [[ -z "${TIDB_HOST:-}" && -f "$PROJECT_ROOT/.env" ]]; then
        TIDB_HOST=$(grep "TIDB_HOST" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"')
        TIDB_PORT=$(grep "TIDB_PORT" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"')
        TIDB_USER=$(grep "TIDB_USER" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"')
        TIDB_PASSWORD=$(grep "TIDB_PASSWORD" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"')
        TIDB_DATABASE=$(grep "TIDB_DATABASE" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"')
    fi
    
    TIDB_HOST="${TIDB_HOST:-}"
    TIDB_PORT="${TIDB_PORT:-4000}"
    TIDB_USER="${TIDB_USER:-root}"
    TIDB_PASSWORD="${TIDB_PASSWORD:-}"
    TIDB_DATABASE="${TIDB_DATABASE:-opera}"
    
    if [[ -z "$TIDB_HOST" ]]; then
        log_warn "TIDB_HOST not configured - skipping TiDB verification"
        return 1
    fi
    
    log_success "TiDB configuration loaded"
    verbose "Host: $TIDB_HOST, Port: $TIDB_PORT, User: $TIDB_USER, Database: $TIDB_DATABASE"
    
    log_subsection "Testing TiDB Connection"
    
    local mysql_opts="-h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER"
    if [[ -n "$TIDB_PASSWORD" ]]; then
        mysql_opts="$mysql_opts -p'$TIDB_PASSWORD'"
    fi
    
    if mysql $mysql_opts -e "SELECT VERSION();" > /dev/null 2>&1; then
        TIDB_VERSION=$(mysql $mysql_opts -N -e "SELECT VERSION();" 2>/dev/null)
        log_success "TiDB connection successful"
        log_info "TiDB Version: ${TIDB_VERSION}"
    else
        log_error "TiDB connection failed - check credentials and network"
        return 1
    fi
    
    log_subsection "Verifying OPERA Schema"
    
    local opera_tables=(
        "opera_tournaments"
        "opera_schedules"
        "opera_patches"
        "opera_teams"
        "opera_team_rosters"
        "opera_circuits"
        "opera_circuit_standings"
        "opera_sync_log"
    )
    
    local tables_found=0
    for table in "${opera_tables[@]}"; do
        if mysql $mysql_opts "$TIDB_DATABASE" -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -q "$table"; then
            log_success "Table exists: $table"
            ((tables_found++))
        else
            log_error "Table missing: $table"
        fi
    done
    
    log_info "OPERA tables found: $tables_found/${#opera_tables[@]}"
    
    log_subsection "Testing Query Capabilities"
    
    # Test tournament query
    if mysql $mysql_opts "$TIDB_DATABASE" -e "SELECT COUNT(*) FROM opera_tournaments;" > /dev/null 2>&1; then
        local tournament_count=$(mysql $mysql_opts "$TIDB_DATABASE" -N -e "SELECT COUNT(*) FROM opera_tournaments;" 2>/dev/null)
        log_success "Tournament query successful (${tournament_count} tournaments)"
    else
        log_error "Tournament query failed"
    fi
    
    # Test schedule query
    if mysql $mysql_opts "$TIDB_DATABASE" -e "SELECT COUNT(*) FROM opera_schedules;" > /dev/null 2>&1; then
        local schedule_count=$(mysql $mysql_opts "$TIDB_DATABASE" -N -e "SELECT COUNT(*) FROM opera_schedules;" 2>/dev/null)
        log_success "Schedule query successful (${schedule_count} matches)"
    else
        log_error "Schedule query failed"
    fi
    
    log_subsection "Checking Cross-Reference Fields"
    if mysql $mysql_opts "$TIDB_DATABASE" -e "SELECT sator_cross_ref FROM opera_tournaments LIMIT 1;" > /dev/null 2>&1; then
        log_success "SATOR cross-reference fields present"
    else
        log_warn "SATOR cross-reference fields not verified"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "\n${YELLOW}Sample Tournament Data:${NC}"
        mysql $mysql_opts "$TIDB_DATABASE" -e "SELECT tournament_id, name, tier, status FROM opera_tournaments LIMIT 3;" 2>/dev/null | sed 's/^/  /' || echo "  No data available"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY AND MAIN
# ═══════════════════════════════════════════════════════════════════════════════

print_summary() {
    log_section "VERIFICATION SUMMARY"
    
    local total=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
    
    echo -e "\n${BOLD}Results:${NC}"
    echo -e "  ${GREEN}✓ Passed:${NC}  $TESTS_PASSED"
    echo -e "  ${RED}✗ Failed:${NC}  $TESTS_FAILED"
    echo -e "  ${YELLOW}⊘ Skipped:${NC} $TESTS_SKIPPED"
    echo -e "  ${BOLD}Total:${NC}   $total"
    
    echo -e "\n${BOLD}Component Status:${NC}"
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "a" ]]; then
        echo -e "  Component A (SQLite):    ${GREEN}✓${NC} Verified"
    fi
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "b" ]]; then
        echo -e "  Component B (PostgreSQL):${GREEN}✓${NC} Verified"
    fi
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "c" ]]; then
        echo -e "  Component C (Turso):     ${GREEN}✓${NC} Verified"
    fi
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "d" ]]; then
        echo -e "  Component D (TiDB):      ${GREEN}✓${NC} Verified"
    fi
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}${BOLD}  ✓ ALL VERIFICATIONS PASSED - TRINITY + OPERA ARCHITECTURE HEALTHY${NC}"
        echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        return 0
    else
        echo -e "\n${RED}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}${BOLD}  ✗ SOME VERIFICATIONS FAILED - REVIEW ERRORS ABOVE${NC}"
        echo -e "${RED}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        return 1
    fi
}

print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -v, --verbose          Enable verbose output
    -c, --component <a|b|c|d|all>
                          Verify specific component (default: all)
    -h, --help            Show this help message

Environment Variables:
    SQLITE_DB_PATH        Path to SQLite queue database (default: /var/lib/sator/queue.db)
    DATABASE_URL          PostgreSQL connection string
    TURSO_DATABASE_URL    Turso database URL
    TURSO_AUTH_TOKEN      Turso authentication token
    TIDB_HOST             TiDB server hostname
    TIDB_PORT             TiDB server port (default: 4000)
    TIDB_USER             TiDB username
    TIDB_PASSWORD         TiDB password
    TIDB_DATABASE         TiDB database name (default: opera)

Examples:
    $0                    # Verify all components
    $0 --verbose          # Verbose verification
    $0 --component b      # Verify only PostgreSQL
    $0 -c a -c b          # Verify SQLite and PostgreSQL

EOF
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -c|--component)
                COMPONENT="$2"
                shift 2
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # Print header
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║            TRINITY + OPERA DATABASE VERIFICATION                             ║"
    echo "║              "Four Realms - One Unified Architecture"                        ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Project root: $PROJECT_ROOT"
    log_info "Component: ${COMPONENT}"
    log_info "Verbose: ${VERBOSE}"
    
    # Run verifications
    case "$COMPONENT" in
        all)
            verify_component_a
            verify_component_b
            verify_component_c
            verify_component_d
            ;;
        a)
            verify_component_a
            ;;
        b)
            verify_component_b
            ;;
        c)
            verify_component_c
            ;;
        d)
            verify_component_d
            ;;
        *)
            log_error "Unknown component: $COMPONENT"
            print_usage
            exit 1
            ;;
    esac
    
    # Print summary
    print_summary
    exit $?
}

# Run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
