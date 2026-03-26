#!/bin/bash
# [Ver001.000] NJZiteGeisTe Pre-Deploy Smoke Test
# Usage: API_URL=http://localhost:8000 bash tests/smoke/smoke_test.sh
set -euo pipefail
API="${API_URL:-http://localhost:8000}"
PASS=0; FAIL=0

check() {
  local name="$1" url="$2" expected="$3"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null || echo "000")
  if [ "$actual" = "$expected" ]; then
    echo "✓ $name (HTTP $actual)"; PASS=$((PASS+1))
  else
    echo "✗ $name — expected HTTP $expected, got $actual"; FAIL=$((FAIL+1))
  fi
}

check_json() {
  local name="$1" url="$2" key="$3"
  local body
  body=$(curl -s --max-time 8 "$url" 2>/dev/null || echo "{}")
  if echo "$body" | grep -q "\"$key\""; then
    echo "✓ $name (key: $key present)"; PASS=$((PASS+1))
  else
    echo "✗ $name — key '$key' missing in response"; FAIL=$((FAIL+1))
  fi
}

echo "=============================="
echo " NJZiteGeisTe Smoke Tests"
echo " API: $API"
echo "=============================="

check      "Health endpoint"               "$API/health"                          "200"
check_json "Health has status key"         "$API/health"                          "status"
check      "GET /v1/players"               "$API/v1/players"                      "200"
check      "GET /v1/teams"                 "$API/v1/teams"                        "200"
check      "GET /v1/matches"               "$API/v1/matches"                      "200"
check      "GET /v1/simrating/leaderboard" "$API/v1/simrating/leaderboard"        "200"
check      "GET /v1/webhooks health"       "$API/v1/webhooks/pandascore/health"   "200"
check      "Unknown route → 404"           "$API/v1/no-such-endpoint-xyz"         "404"
check      "Readiness endpoint"            "$API/ready"                           "200"

echo ""
echo "=============================="
echo " Results: $PASS passed, $FAIL failed"
echo "=============================="
[ "$FAIL" -eq 0 ] && echo "ALL PASS ✓" || { echo "FAILURES DETECTED ✗"; exit 1; }
