#!/usr/bin/env bash
# Verificações de API/regressão WhatsApp — sem alterar CMS.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "✗ .env não encontrado"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
EMAIL="${E2E_ADMIN_EMAIL:-${ADMIN_EMAIL:-}}"
PASSWORD="${E2E_ADMIN_PASSWORD:-${ADMIN_PASSWORD:-}}"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "✗ VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY ausentes"
  exit 1
fi

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "⊘ regression-api-whatsapp: pulado (defina E2E_ADMIN_EMAIL/PASSWORD no .env)"
  exit 0
fi

echo "=== Login admin (API) ==="
AUTH_JSON=$(curl -sS "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo "$AUTH_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)
if [[ -z "$TOKEN" ]]; then
  echo "✗ Falha no login admin"
  exit 1
fi
echo "  ✓ autenticado"

api_get() {
  local table="$1"
  local query="${2:-select=*}"
  curl -sS "${SUPABASE_URL}/rest/v1/${table}?${query}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${TOKEN}"
}

check_min_rows() {
  local label="$1"
  local table="$2"
  local query="$3"
  local min="$4"
  local count
  count=$(api_get "$table" "$query" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
  if [[ "$count" -ge "$min" ]]; then
    echo "  ✓ ${label} (${count} ≥ ${min})"
  else
    echo "  ✗ ${label} (${count} < ${min})"
    return 1
  fi
}

FAIL=0

echo ""
echo "=== Tabelas WhatsApp (somente leitura) ==="
check_min_rows "survey_flows ativos" "survey_flows" "is_active=eq.true&select=id" 2 || FAIL=1
check_min_rows "whatsapp_tags" "whatsapp_tags" "select=id" 3 || FAIL=1
check_min_rows "whatsapp_queues" "whatsapp_queues" "is_active=eq.true&select=id" 4 || FAIL=1

echo ""
echo "=== Pesquisas seed ==="
FLOWS=$(api_get "survey_flows" "is_active=eq.true&select=slug")
echo "$FLOWS" | python3 -c "
import sys, json
slugs = {r['slug'] for r in json.load(sys.stdin)}
needed = {'pesquisa-delivery-2025', 'pesquisa-reativacao-inativos'}
missing = needed - slugs
if missing:
    print('  ✗ pesquisas seed faltando:', ', '.join(missing))
    sys.exit(1)
print('  ✓ pesquisas delivery + reativação presentes')
" || FAIL=1

echo ""
echo "=== Fila homologação QA ==="
api_get "whatsapp_queues" "slug=eq.homologacao-qa&select=id,name" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d:
    print('  ✗ fila homologacao-qa ausente')
    sys.exit(1)
print('  ✓ fila homologacao-qa:', d[0]['name'])
" || FAIL=1

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "✓ API WhatsApp OK (CMS não consultado)"
  exit 0
fi
echo "✗ Algumas verificações falharam"
exit 1
