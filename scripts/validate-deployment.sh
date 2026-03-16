#!/bin/bash
# =============================================================================
# Deployment Validation Script
# Validates that all services are healthy after deployment
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-https://sator-api.onrender.com}"
WEB_URL="${WEB_URL:-https://sator-platform.vercel.app}"
TIMEOUT=30

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# =============================================================================
# Health Checks
# =============================================================================

check_api_health() {
    log_info "Checking API health..."
    
    response=$(curl -sf -m "$TIMEOUT" "$API_URL/health" 2>&1) || {
        log_error "API health check failed"
        echo "Error: $response"
        return 1
    }
    
    if echo "$response" | grep -q '"status":"healthy"'; then
        log_success "API is healthy"
        echo "Response: $response"
        return 0
    else
        log_error "API health check returned unexpected response"
        echo "Response: $response"
        return 1
    fi
}

check_api_ready() {
    log_info "Checking API readiness..."
    
    response=$(curl -sf -m "$TIMEOUT" "$API_URL/ready" 2>&1) || {
        log_error "API readiness check failed"
        return 1
    }
    
    if echo "$response" | grep -q '"ready":true'; then
        log_success "API is ready (database connected)"
        return 0
    else
        log_error "API is not ready"
        echo "Response: $response"
        return 1
    fi
}

check_api_metrics() {
    log_info "Checking API metrics endpoint..."
    
    response=$(curl -sf -m "$TIMEOUT" "$API_URL/metrics" 2>&1) || {
        log_error "API metrics check failed"
        return 1
    }
    
    log_success "API metrics endpoint accessible"
    return 0
}

check_web_app() {
    log_info "Checking web application..."
    
    status=$(curl -sf -o /dev/null -w "%{http_code}" -m "$TIMEOUT" "$WEB_URL" 2>&1) || {
        log_error "Web app check failed"
        return 1
    }
    
    if [ "$status" = "200" ]; then
        log_success "Web app is accessible (HTTP 200)"
        return 0
    else
        log_error "Web app returned HTTP $status"
        return 1
    fi
}

check_critical_endpoints() {
    log_info "Checking critical API endpoints..."
    
    local endpoints=(
        "/api/sator/players?limit=1"
        "/api/sator/rar/leaderboard"
        "/api/betting/matches"
    )
    
    local failed=0
    
    for endpoint in "${endpoints[@]}"; do
        log_info "  Testing $endpoint..."
        
        response=$(curl -sf -o /dev/null -w "%{http_code}" -m "$TIMEOUT" "$API_URL$endpoint" 2>&1) || {
            log_error "  Endpoint $endpoint failed"
            failed=$((failed + 1))
            continue
        }
        
        if [ "$response" = "200" ] || [ "$response" = "404" ]; then
            # 404 is acceptable for endpoints that need data
            log_success "  Endpoint $endpoint accessible (HTTP $response)"
        else
            log_error "  Endpoint $endpoint returned HTTP $response"
            failed=$((failed + 1))
        fi
    done
    
    return $failed
}

check_security_headers() {
    log_info "Checking security headers..."
    
    headers=$(curl -sf -I -m "$TIMEOUT" "$API_URL/health" 2>&1) || {
        log_error "Failed to fetch headers"
        return 1
    }
    
    local required_headers=(
        "strict-transport-security"
        "x-frame-options"
        "x-content-type-options"
        "content-security-policy"
    )
    
    local missing=0
    
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -iq "$header"; then
            log_success "  Security header present: $header"
        else
            log_error "  Missing security header: $header"
            missing=$((missing + 1))
        fi
    done
    
    return $missing
}

# =============================================================================
# Performance Checks
# =============================================================================

check_response_time() {
    log_info "Checking API response time..."
    
    time_ms=$(curl -sf -o /dev/null -w "%{time_total}" -m "$TIMEOUT" "$API_URL/health" 2>&1)
    time_ms_int=$(echo "$time_ms * 1000" | bc | cut -d. -f1)
    
    if [ "$time_ms_int" -lt 500 ]; then
        log_success "API response time: ${time_ms}s (< 500ms)"
        return 0
    else
        log_error "API response time: ${time_ms}s (> 500ms)"
        return 1
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    echo "========================================"
    echo "  Deployment Validation Script"
    echo "========================================"
    echo "API URL: $API_URL"
    echo "Web URL: $WEB_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo "========================================"
    echo ""
    
    local failed=0
    
    # Run all checks
    check_api_health || failed=$((failed + 1))
    echo ""
    
    check_api_ready || failed=$((failed + 1))
    echo ""
    
    check_api_metrics || failed=$((failed + 1))
    echo ""
    
    check_web_app || failed=$((failed + 1))
    echo ""
    
    check_critical_endpoints || failed=$((failed + 1))
    echo ""
    
    check_security_headers || failed=$((failed + 1))
    echo ""
    
    check_response_time || failed=$((failed + 1))
    echo ""
    
    # Summary
    echo "========================================"
    if [ "$failed" -eq 0 ]; then
        echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
        echo "Deployment is healthy and ready!"
        exit 0
    else
        echo -e "${RED}✗ $failed CHECK(S) FAILED${NC}"
        echo "Please review the errors above."
        exit 1
    fi
}

main "$@"
