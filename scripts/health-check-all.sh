[Ver001.000]

#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                  TRINITY + OPERA COMPREHENSIVE HEALTH CHECK                  ║
# ║              "Monitor All Four Realms - One Unified View"                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Purpose: Comprehensive health monitoring for all TRINITY + OPERA components
# Usage: ./scripts/health-check-all.sh [--continuous] [--alert] [--json]
# Schedule: Run every 5 minutes via cron or systemd timer
# Dependencies: sqlite3, psql, turso CLI, mysql client, jq, curl

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Script paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load environment
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Settings
CONTINUOUS=false
ALERT_MODE=false
JSON_OUTPUT=false
INTERVAL=300  # 5 minutes for continuous mode
ALERT_THRESHOLD_QUEUE=1000
ALERT_THRESHOLD_SYNC=900  # 15 minutes in seconds
ALERT_THRESHOLD_LATENCY=500  # ms

# Component settings
SQLITE_DB_PATH="${SQLITE_DB_PATH:-/var/lib/sator/queue.db}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"

# Health status tracking
declare -A COMPONENT_STATUS
declare -A METRICS

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_ok() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_component() {
    local name="$1"
    local color="$2"
    echo -e "\n${color}${BOLD}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${color}${BOLD}│  $name${NC}"
    echo -e "${color}${BOLD}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
}

alert() {
    local message="$1"
    local severity="${2:-warning}"
    
    if [[ "$ALERT_MODE" == "true" ]]; then
        # Send alert (customize for your alerting system)
        echo -e "${RED}[ALERT - $severity]${NC} $message" >&2
        # Example: Send to Slack, PagerDuty, etc.
        # curl -s -X POST "$SLACK_WEBHOOK" -d "{\"text\":\"[TRINITY HEALTH] $message\"}" > /dev/null
    fi
}

health_status() {
    local component="$1"
    local status="$2"
    local message="${3:-}"
    
    COMPONENT_STATUS[$component]="$status"
    
    case "$status" in
        healthy)
            log_ok "$component: $message"
            ;;
        degraded)
            log_warn "$component: $message"
            ;;
        critical)
            log_error "$component: $message"
            alert "$component is CRITICAL: $message" "critical"
            ;;
    esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT A: SQLITE QUEUE HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

check_sqlite_queue() {
    log_component "COMPONENT A: SQLITE TASK QUEUE" "$CYAN"
    
    local pending=0
    local processing=0
    local failed=0
    local dead_letter=0
    local queue_depth=0
    local wal_size=0
    local db_size=0
    
    # Check database file
    if [[ ! -f "$SQLITE_DB_PATH" ]]; then
        health_status "sqlite" "critical" "Database file not found: $SQLITE_DB_PATH"
        return 1
    fi
    
    db_size=$(stat -f%z "$SQLITE_DB_PATH" 2>/dev/null || stat -c%s "$SQLITE_DB_PATH" 2>/dev/null || echo "0")
    db_size_mb=$((db_size / 1024 / 1024))
    
    # Check WAL file
    if [[ -f "${SQLITE_DB_PATH}-wal" ]]; then
        wal_size=$(stat -f%z "${SQLITE_DB_PATH}-wal" 2>/dev/null || stat -c%s "${SQLITE_DB_PATH}-wal" 2>/dev/null || echo "0")
        wal_size_mb=$((wal_size / 1024 / 1024))
    fi
    
    # Get queue statistics
    if sqlite3 "$SQLITE_DB_PATH" ".tables" | grep -q "task_queue"; then
        pending=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='pending';" 2>/dev/null || echo "0")
        processing=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='processing';" 2>/dev/null || echo "0")
        failed=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='failed';" 2>/dev/null || echo "0")
        dead_letter=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='failed' AND retry_count >= max_retries;" 2>/dev/null || echo "0")
        
        queue_depth=$((pending + processing))
        
        METRICS[sqlite_pending]=$pending
        METRICS[sqlite_processing]=$processing
        METRICS[sqlite_failed]=$failed
        METRICS[sqlite_dead_letter]=$dead_letter
        METRICS[sqlite_queue_depth]=$queue_depth
        METRICS[sqlite_db_size_mb]=$db_size_mb
        METRICS[sqlite_wal_size_mb]=$wal_size_mb
        
        echo -e "  Queue Depth:     ${BOLD}$queue_depth${NC} (pending: $pending, processing: $processing)"
        echo -e "  Failed Tasks:    ${BOLD}$failed${NC} (dead letter: $dead_letter)"
        echo -e "  Database Size:   ${BOLD}${db_size_mb}MB${NC} (WAL: ${wal_size_mb}MB)"
        
        # Health determination
        if [[ $queue_depth -gt $ALERT_THRESHOLD_QUEUE ]]; then
            health_status "sqlite" "critical" "Queue depth ($queue_depth) exceeds threshold ($ALERT_THRESHOLD_QUEUE)"
        elif [[ $dead_letter -gt 100 ]]; then
            health_status "sqlite" "degraded" "High dead letter count: $dead_letter"
        elif [[ $wal_size_mb -gt 100 ]]; then
            health_status "sqlite" "degraded" "Large WAL file: ${wal_size_mb}MB"
        else
            health_status "sqlite" "healthy" "Queue operating normally"
        fi
        
        # Check for stalled tasks
        local stalled=$(sqlite3 "$SQLITE_DB_PATH" "SELECT COUNT(*) FROM task_queue WHERE status='processing' AND datetime(started_at) < datetime('now', '-1 hour');" 2>/dev/null || echo "0")
        if [[ $stalled -gt 0 ]]; then
            log_warn "$stalled tasks have been processing for >1 hour (may be stalled)"
        fi
        
    else
        health_status "sqlite" "critical" "task_queue table not found"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT B: POSTGRESQL HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

check_postgres() {
    log_component "COMPONENT B: POSTGRESQL PRIMARY" "$MAGENTA"
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        health_status "postgres" "critical" "DATABASE_URL not configured"
        return 1
    fi
    
    # Test connection
    local start_time=$(date +%s%N)
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        health_status "postgres" "critical" "Connection failed"
        return 1
    fi
    local end_time=$(date +%s%N)
    local latency_ms=$(((end_time - start_time) / 1000000))
    
    METRICS[postgres_latency_ms]=$latency_ms
    
    # Get connection stats
    local active_conns=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state='active';" 2>/dev/null | tr -d ' ')
    local idle_conns=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state='idle';" 2>/dev/null | tr -d ' ')
    local total_conns=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
    local max_conns=$(psql "$DATABASE_URL" -t -c "SHOW max_connections;" 2>/dev/null | tr -d ' ')
    
    # Get database size
    local db_size=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | tr -d ' ')
    
    # Get materialized view freshness
    local mv_last_refresh=$(psql "$DATABASE_URL" -t -c "SELECT MAX(last_refresh) FROM pg_stat_user_tables WHERE relname LIKE 'mv_%';" 2>/dev/null | tr -d ' ')
    
    METRICS[postgres_active_conns]=$active_conns
    METRICS[postgres_idle_conns]=$idle_conns
    METRICS[postgres_total_conns]=$total_conns
    METRICS[postgres_max_conns]=$max_conns
    METRICS[postgres_db_size]="$db_size"
    
    echo -e "  Connection:      ${BOLD}${latency_ms}ms${NC} latency"
    echo -e "  Connections:     ${BOLD}${active_conns} active${NC}, ${idle_conns} idle, ${total_conns}/${max_conns} total"
    echo -e "  Database Size:   ${BOLD}${db_size}${NC}"
    echo -e "  MV Last Refresh: ${BOLD}${mv_last_refresh:-N/A}${NC}"
    
    # Check connection pool
    local conn_pct=$((total_conns * 100 / max_conns))
    if [[ $conn_pct -gt 80 ]]; then
        health_status "postgres" "critical" "Connection pool ${conn_pct}% full"
    elif [[ $latency_ms -gt $ALERT_THRESHOLD_LATENCY ]]; then
        health_status "postgres" "degraded" "High latency: ${latency_ms}ms"
    else
        health_status "postgres" "healthy" "Operating normally (${latency_ms}ms latency)"
    fi
    
    # Check materialized view age
    if [[ -n "$mv_last_refresh" && "$mv_last_refresh" != "NULL" ]]; then
        local mv_age_hours=$(psql "$DATABASE_URL" -t -c "SELECT EXTRACT(EPOCH FROM (NOW() - MAX(last_refresh)))/3600 FROM pg_stat_user_tables WHERE relname LIKE 'mv_%';" 2>/dev/null | tr -d ' ')
        if [[ ${mv_age_hours%.*} -gt 24 ]]; then
            log_warn "Materialized views stale: ${mv_age_hours%.*} hours since refresh"
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT C: TURSO EDGE HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

check_turso() {
    log_component "COMPONENT C: TURSO EDGE CACHE" "$GREEN"
    
    if [[ -z "${TURSO_DATABASE_URL:-}" ]]; then
        health_status "turso" "critical" "TURSO_DATABASE_URL not configured"
        return 1
    fi
    
    local db_name=$(echo "$TURSO_DATABASE_URL" | sed -E 's/.*\/([a-zA-Z0-9_-]+)(\?.*)?$/\1/')
    
    # Test connection
    local start_time=$(date +%s%N)
    if ! command -v turso &> /dev/null; then
        health_status "turso" "degraded" "Turso CLI not installed, limited checks available"
        
        # Fallback: try HTTP health check
        if curl -s "$API_BASE_URL/health/turso" > /dev/null 2>&1; then
            log_ok "Turso health endpoint responding via API"
        fi
        return 0
    fi
    
    if ! turso db shell "$db_name" "SELECT 1;" > /dev/null 2>&1; then
        health_status "turso" "critical" "Connection failed"
        return 1
    fi
    local end_time=$(date +%s%N)
    local latency_ms=$(((end_time - start_time) / 1000000))
    
    METRICS[turso_latency_ms]=$latency_ms
    
    # Get record count
    local edge_count=$(turso db shell "$db_name" "SELECT COUNT(*) FROM player_performance_edge;" 2>/dev/null | tr -d '\n' || echo "0")
    
    # Check sync checkpoint
    local last_sync=$(turso db shell "$db_name" "SELECT MAX(synced_at) FROM sync_checkpoint;" 2>/dev/null | tr -d '\n')
    local sync_lag_seconds=0
    
    if [[ -n "$last_sync" ]]; then
        local last_sync_epoch=$(date -d "$last_sync" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$last_sync" +%s 2>/dev/null)
        local current_epoch=$(date +%s)
        sync_lag_seconds=$((current_epoch - last_sync_epoch))
    fi
    
    METRICS[turso_edge_count]=$edge_count
    METRICS[turso_last_sync]="$last_sync"
    METRICS[turso_sync_lag_seconds]=$sync_lag_seconds
    
    echo -e "  Database:        ${BOLD}${db_name}${NC}"
    echo -e "  Latency:         ${BOLD}${latency_ms}ms${NC}"
    echo -e "  Edge Records:    ${BOLD}${edge_count}${NC}"
    echo -e "  Last Sync:       ${BOLD}${last_sync:-N/A}${NC}"
    echo -e "  Sync Lag:        ${BOLD}${sync_lag_seconds}s${NC}"
    
    # Health determination
    if [[ $sync_lag_seconds -gt $ALERT_THRESHOLD_SYNC ]]; then
        health_status "turso" "critical" "Sync lag ${sync_lag_seconds}s exceeds threshold"
    elif [[ $sync_lag_seconds -gt 300 ]]; then
        health_status "turso" "degraded" "Sync lag elevated: ${sync_lag_seconds}s"
    elif [[ $latency_ms -gt $ALERT_THRESHOLD_LATENCY ]]; then
        health_status "turso" "degraded" "High latency: ${latency_ms}ms"
    else
        health_status "turso" "healthy" "Edge cache healthy (${sync_lag_seconds}s lag)"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# COMPONENT D: TiDB OPERA HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

check_opera() {
    log_component "COMPONENT D: TiDB OPERA" "$YELLOW"
    
    local tidb_host="${TIDB_HOST:-}"
    local tidb_port="${TIDB_PORT:-4000}"
    local tidb_user="${TIDB_USER:-root}"
    local tidb_password="${TIDB_PASSWORD:-}"
    local tidb_database="${TIDB_DATABASE:-opera}"
    
    if [[ -z "$tidb_host" ]]; then
        health_status "opera" "critical" "TIDB_HOST not configured"
        return 1
    fi
    
    # Test connection
    local start_time=$(date +%s%N)
    local mysql_opts="-h $tidb_host -P $tidb_port -u $tidb_user"
    [[ -n "$tidb_password" ]] && mysql_opts="$mysql_opts -p'$tidb_password'"
    
    if ! mysql $mysql_opts -e "SELECT 1;" > /dev/null 2>&1; then
        health_status "opera" "critical" "Connection failed"
        return 1
    fi
    local end_time=$(date +%s%N)
    local latency_ms=$(((end_time - start_time) / 1000000))
    
    METRICS[opera_latency_ms]=$latency_ms
    
    # Get version
    local tidb_version=$(mysql $mysql_opts -N -e "SELECT VERSION();" 2>/dev/null)
    
    # Count tables
    local table_count=$(mysql $mysql_opts "$tidb_database" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$tidb_database';" 2>/dev/null)
    
    # Get record counts
    local tournament_count=$(mysql $mysql_opts "$tidb_database" -N -e "SELECT COUNT(*) FROM opera_tournaments;" 2>/dev/null || echo "0")
    local schedule_count=$(mysql $mysql_opts "$tidb_database" -N -e "SELECT COUNT(*) FROM opera_schedules;" 2>/dev/null || echo "0")
    
    METRICS[opera_version]="$tidb_version"
    METRICS[opera_table_count]=$table_count
    METRICS[opera_tournament_count]=$tournament_count
    METRICS[opera_schedule_count]=$schedule_count
    
    echo -e "  Host:            ${BOLD}${tidb_host}:${tidb_port}${NC}"
    echo -e "  Version:         ${BOLD}${tidb_version}${NC}"
    echo -e "  Latency:         ${BOLD}${latency_ms}ms${NC}"
    echo -e "  Tables:          ${BOLD}${table_count}${NC}/8 expected"
    echo -e "  Tournaments:     ${BOLD}${tournament_count}${NC}"
    echo -e "  Schedules:       ${BOLD}${schedule_count}${NC}"
    
    # Health determination
    if [[ $table_count -lt 8 ]]; then
        health_status "opera" "degraded" "Missing tables (${table_count}/8)"
    elif [[ $latency_ms -gt $ALERT_THRESHOLD_LATENCY ]]; then
        health_status "opera" "degraded" "High latency: ${latency_ms}ms"
    else
        health_status "opera" "healthy" "OPERA satellite online"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# HUB GATEWAY HEALTH
# ═══════════════════════════════════════════════════════════════════════════════

check_hub_gateway() {
    log_component "HUB GATEWAY API" "$WHITE"
    
    local endpoints=(
        "/health:API Health"
        "/ready:Readiness"
        "/health/queue:Queue Health"
        "/health/postgres:PostgreSQL Health"
    )
    
    local all_healthy=true
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%%:*}"
        local name="${endpoint_info##*:}"
        
        local start_time=$(date +%s%N)
        local response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" "${API_BASE_URL}${endpoint}" 2>/dev/null || echo "000|0")
        local end_time=$(date +%s%N)
        
        local http_code="${response%%|*}"
        local response_time="${response##*|}"
        local latency_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
        
        if [[ "$http_code" == "200" ]]; then
            echo -e "  ${GREEN}✓${NC} ${name}: ${latency_ms}ms"
        else
            echo -e "  ${RED}✗${NC} ${name}: HTTP $http_code"
            all_healthy=false
        fi
    done
    
    if $all_healthy; then
        health_status "hub_gateway" "healthy" "All endpoints responding"
    else
        health_status "hub_gateway" "critical" "Some endpoints failing"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY & OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════

print_summary() {
    echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}                           HEALTH CHECK SUMMARY                                ${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    local healthy_count=0
    local degraded_count=0
    local critical_count=0
    
    for component in "${!COMPONENT_STATUS[@]}"; do
        local status="${COMPONENT_STATUS[$component]}"
        case "$status" in
            healthy) ((healthy_count++)) ;;
            degraded) ((degraded_count++)) ;;
            critical) ((critical_count++)) ;;
        esac
    done
    
    echo -e "\n${BOLD}Component Status:${NC}"
    for component in sqlite postgres turso opera hub_gateway; do
        local status="${COMPONENT_STATUS[$component]:-unknown}"
        local color="$YELLOW"
        [[ "$status" == "healthy" ]] && color="$GREEN"
        [[ "$status" == "critical" ]] && color="$RED"
        printf "  %-15s %b%s%b\n" "$component:" "$color" "$status" "$NC"
    done
    
    echo -e "\n${BOLD}Statistics:${NC}"
    echo -e "  ${GREEN}●${NC} Healthy:   $healthy_count"
    echo -e "  ${YELLOW}●${NC} Degraded:  $degraded_count"
    echo -e "  ${RED}●${NC} Critical:  $critical_count"
    
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        print_json_output
    fi
    
    if [[ $critical_count -eq 0 && $degraded_count -eq 0 ]]; then
        echo -e "\n${GREEN}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}${BOLD}  ✓ ALL SYSTEMS OPERATIONAL - TRINITY + OPERA ARCHITECTURE HEALTHY           ${NC}"
        echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        return 0
    elif [[ $critical_count -eq 0 ]]; then
        echo -e "\n${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}${BOLD}  ⚠ SYSTEM DEGRADED - Some components need attention                         ${NC}"
        echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        return 1
    else
        echo -e "\n${RED}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}${BOLD}  ✗ CRITICAL ISSUES DETECTED - Immediate action required                      ${NC}"
        echo -e "${RED}${BOLD}═══════════════════════════════════════════════════════════════════════════════${NC}"
        return 2
    fi
}

print_json_output() {
    cat << EOF
{
  "timestamp": "$(date -Iseconds)",
  "status": {
    "sqlite": "${COMPONENT_STATUS[sqlite]}",
    "postgres": "${COMPONENT_STATUS[postgres]}",
    "turso": "${COMPONENT_STATUS[turso]}",
    "opera": "${COMPONENT_STATUS[opera]}",
    "hub_gateway": "${COMPONENT_STATUS[hub_gateway]}"
  },
  "metrics": {
    "sqlite": {
      "queue_depth": ${METRICS[sqlite_queue_depth]:-0},
      "pending": ${METRICS[sqlite_pending]:-0},
      "failed": ${METRICS[sqlite_failed]:-0},
      "db_size_mb": ${METRICS[sqlite_db_size_mb]:-0}
    },
    "postgres": {
      "latency_ms": ${METRICS[postgres_latency_ms]:-0},
      "active_connections": ${METRICS[postgres_active_conns]:-0},
      "total_connections": ${METRICS[postgres_total_conns]:-0}
    },
    "turso": {
      "latency_ms": ${METRICS[turso_latency_ms]:-0},
      "edge_count": ${METRICS[turso_edge_count]:-0},
      "sync_lag_seconds": ${METRICS[turso_sync_lag_seconds]:-0}
    },
    "opera": {
      "latency_ms": ${METRICS[opera_latency_ms]:-0},
      "table_count": ${METRICS[opera_table_count]:-0},
      "tournament_count": ${METRICS[opera_tournament_count]:-0}
    }
  }
}
EOF
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║           TRINITY + OPERA COMPREHENSIVE HEALTH CHECK                         ║"
    echo "║              Four Realms - One Unified Health View                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    log "Check Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
    log "API Base: $API_BASE_URL"
    log "SQLite Path: $SQLITE_DB_PATH"
    echo
}

run_checks() {
    check_sqlite_queue
    check_postgres
    check_turso
    check_opera
    check_hub_gateway
}

print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -c, --continuous    Run continuously (every 5 minutes)
    -a, --alert         Enable alerting mode
    -j, --json          Output JSON format
    -i, --interval N    Set check interval in seconds (default: 300)
    -h, --help          Show this help

Environment Variables:
    DATABASE_URL        PostgreSQL connection string
    TURSO_DATABASE_URL  Turso database URL
    TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD
                        TiDB connection parameters
    API_BASE_URL        Hub gateway base URL
    SQLITE_DB_PATH      Path to SQLite queue database

Examples:
    $0                          # Single health check
    $0 --continuous             # Run every 5 minutes
    $0 --continuous --alert     # Continuous with alerts
    $0 --json                   # JSON output for monitoring
    $0 -c -i 60                 # Check every minute

EOF
}

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--continuous)
                CONTINUOUS=true
                shift
                ;;
            -a|--alert)
                ALERT_MODE=true
                shift
                ;;
            -j|--json)
                JSON_OUTPUT=true
                shift
                ;;
            -i|--interval)
                INTERVAL="$2"
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
    
    print_header
    
    if [[ "$CONTINUOUS" == "true" ]]; then
        log "Running in continuous mode (interval: ${INTERVAL}s)"
        while true; do
            run_checks
            print_summary
            log "Next check in ${INTERVAL}s..."
            sleep "$INTERVAL"
            echo -e "\n\n"
            print_header
        done
    else
        run_checks
        print_summary
        exit $?
    fi
}

# Run main
main "$@"
