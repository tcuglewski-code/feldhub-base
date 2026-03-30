#!/usr/bin/env bash
# ============================================================
# AppFabrik — Uptime & Health Monitoring Script
# Prüft alle konfigurierten Endpunkte und sendet Alerts
# ============================================================

set -euo pipefail

TENANT_ID="${TENANT_ID:-unknown}"
MC_API_KEY="${MC_API_KEY:-}"
MC_BASE_URL="${MC_BASE_URL:-https://mission-control-tawny-omega.vercel.app}"
ALERT_THRESHOLD_MS="${ALERT_THRESHOLD_MS:-3000}"  # 3s = langsam
TIMEOUT_S="${TIMEOUT_S:-10}"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()     { echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"; }
success() { log "${GREEN}✅ $1${NC}"; }
error()   { log "${RED}❌ $1${NC}"; }
warn()    { log "${YELLOW}⚠️  $1${NC}"; }
info()    { log "${BLUE}ℹ️  $1${NC}"; }

FAILED_CHECKS=()
SLOW_CHECKS=()
TOTAL_CHECKS=0
PASSED_CHECKS=0

# ---- Alert senden ----------------------------------------
send_alert() {
  local title="$1" body="$2" priority="${3:-medium}"
  
  if [[ -z "$MC_API_KEY" ]]; then
    warn "MC_API_KEY nicht gesetzt — Alert nur lokal: ${title}"
    return 0
  fi
  
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${MC_API_KEY}" \
    -d "{\"title\": \"${title}\", \"body\": \"${body}\", \"priority\": \"${priority}\", \"category\": \"monitoring\"}" \
    "${MC_BASE_URL}/api/notifications" > /dev/null 2>&1 || warn "Alert-Versand fehlgeschlagen"
}

# ---- HTTP Check ------------------------------------------
check_url() {
  local name="$1" url="$2" expected_status="${3:-200}"
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  local start_ms=$(($(date +%s%N) / 1000000))
  
  local http_status
  http_status=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time "$TIMEOUT_S" \
    --connect-timeout 5 \
    "$url" 2>/dev/null || echo "000")
  
  local end_ms=$(($(date +%s%N) / 1000000))
  local duration_ms=$((end_ms - start_ms))
  
  if [[ "$http_status" == "000" ]]; then
    error "${name}: TIMEOUT/UNREACHABLE (${url})"
    FAILED_CHECKS+=("${name}: Timeout/Unreachable")
    send_alert "🔴 ${TENANT_ID} — ${name} DOWN" "URL ${url} ist nicht erreichbar (Timeout nach ${TIMEOUT_S}s)" "high"
    return 1
  fi
  
  if [[ "$http_status" != "$expected_status" ]]; then
    error "${name}: HTTP ${http_status} (erwartet: ${expected_status}) — ${url} — ${duration_ms}ms"
    FAILED_CHECKS+=("${name}: HTTP ${http_status}")
    send_alert "🔴 ${TENANT_ID} — ${name} Fehler" "HTTP ${http_status} (erwartet ${expected_status}) — ${url}" "high"
    return 1
  fi
  
  if [[ $duration_ms -gt $ALERT_THRESHOLD_MS ]]; then
    warn "${name}: LANGSAM ${duration_ms}ms > ${ALERT_THRESHOLD_MS}ms — ${url}"
    SLOW_CHECKS+=("${name}: ${duration_ms}ms")
    send_alert "🟡 ${TENANT_ID} — ${name} Langsam" "${duration_ms}ms Antwortzeit (Schwellwert: ${ALERT_THRESHOLD_MS}ms)" "medium"
  else
    success "${name}: HTTP ${http_status} — ${duration_ms}ms"
  fi
  
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  return 0
}

# ---- JSON API Check --------------------------------------
check_api() {
  local name="$1" url="$2" json_key="${3:-}" expected_value="${4:-}"
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  local response
  response=$(curl -s --max-time "$TIMEOUT_S" "$url" 2>/dev/null || echo "")
  
  if [[ -z "$response" ]]; then
    error "${name}: Keine Antwort von API ${url}"
    FAILED_CHECKS+=("${name}: Keine API-Antwort")
    send_alert "🔴 ${TENANT_ID} — ${name} API Down" "Keine Antwort von ${url}" "high"
    return 1
  fi
  
  if [[ -n "$json_key" && -n "$expected_value" ]]; then
    local actual
    actual=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('${json_key}',''))" 2>/dev/null || echo "")
    if [[ "$actual" != "$expected_value" ]]; then
      error "${name}: ${json_key}='${actual}' (erwartet: '${expected_value}')"
      FAILED_CHECKS+=("${name}: API-Check fehlgeschlagen")
      return 1
    fi
  fi
  
  success "${name}: API OK"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  return 0
}

# ====================================================
# TENANT-SPEZIFISCHE CHECKS
# Konfigurierbar via ENV oder pro-Tenant override
# ====================================================

log "🔍 AppFabrik Monitoring — Tenant: ${TENANT_ID}"
log "Zeitstempel: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
log ""

# Standard-URLs aus ENV (Tenants können eigene setzen)
FRONTEND_URL="${FRONTEND_URL:-}"
API_URL="${API_URL:-}"
HEALTH_URL="${HEALTH_URL:-}"

# Koch Aufforstung Defaults
if [[ "$TENANT_ID" == "koch-aufforstung" ]]; then
  FRONTEND_URL="${FRONTEND_URL:-https://ka-forstmanager.vercel.app}"
  API_URL="${API_URL:-https://ka-forstmanager.vercel.app/api}"
  HEALTH_URL="${HEALTH_URL:-https://ka-forstmanager.vercel.app/api/health}"
  WP_URL="${WP_URL:-https://peru-otter-113714.hostingersite.com}"
fi

info "Prüfe ${TENANT_ID} Endpunkte..."
log ""

# Frontend
[[ -n "$FRONTEND_URL" ]] && check_url "Frontend" "$FRONTEND_URL"

# WordPress/Website (optional)
[[ -n "${WP_URL:-}" ]] && check_url "WordPress Website" "$WP_URL"

# API Health Check
if [[ -n "$HEALTH_URL" ]]; then
  check_url "API Health" "$HEALTH_URL" "200"
elif [[ -n "$API_URL" ]]; then
  check_url "API" "$API_URL" "200"
fi

# Mission Control selbst
check_url "Mission Control" "https://mission-control-tawny-omega.vercel.app" "200"

# ---- Summary --------------------------------------------
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "📊 MONITORING SUMMARY — ${TENANT_ID}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  Gesamt:     ${TOTAL_CHECKS} Checks"
log "  Bestanden:  ${PASSED_CHECKS} ✅"
log "  Fehlerhaft: ${#FAILED_CHECKS[@]} ❌"
log "  Langsam:    ${#SLOW_CHECKS[@]} ⚠️"

if [[ ${#FAILED_CHECKS[@]} -gt 0 ]]; then
  log ""
  error "FEHLGESCHLAGENE CHECKS:"
  for c in "${FAILED_CHECKS[@]}"; do error "  - $c"; done
  log ""
  # Exit code != 0 damit GitHub Actions rot wird
  exit 1
fi

if [[ ${#SLOW_CHECKS[@]} -gt 0 ]]; then
  log ""
  warn "LANGSAME CHECKS:"
  for c in "${SLOW_CHECKS[@]}"; do warn "  - $c"; done
fi

log ""
success "Alle kritischen Checks bestanden!"
