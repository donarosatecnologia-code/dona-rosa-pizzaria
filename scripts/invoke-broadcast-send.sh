#!/usr/bin/env bash
# Dispara campanha via Edge Function broadcast-send (requer admin logado).
# Uso:
#   npm run broadcast:send -- 7088c78d-5c17-4b50-afb1-6da6c4cba37a
#   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run broadcast:send -- <campaign_id>
set -euo pipefail

cd "$(dirname "$0")/.."

CAMPAIGN_ID="${1:-}"
if [[ -z "$CAMPAIGN_ID" ]]; then
  echo "Uso: npm run broadcast:send -- <campaign_id>"
  echo "Ex.: npm run broadcast:send -- 7088c78d-5c17-4b50-afb1-6da6c4cba37a"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Arquivo .env não encontrado."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

SUPABASE_URL="${VITE_SUPABASE_URL:-}"
ANON_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env"
  exit 1
fi

if [[ -z "${ADMIN_EMAIL:-}" ]]; then
  read -r -p "Email admin: " ADMIN_EMAIL
fi
if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  read -r -s -p "Senha admin: " ADMIN_PASSWORD
  echo ""
fi

echo "=== Autenticando ==="
AUTH_JSON=$(curl -sS "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

ACCESS_TOKEN=$(echo "$AUTH_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || true)

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "Falha no login:"
  echo "$AUTH_JSON" | python3 -m json.tool 2>/dev/null || echo "$AUTH_JSON"
  exit 1
fi

echo "=== Disparando campanha ${CAMPAIGN_ID} ==="
RESPONSE=$(curl -sS -w "\nHTTP:%{http_code}" \
  -X POST "${SUPABASE_URL}/functions/v1/broadcast-send" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"campaign_id\":\"${CAMPAIGN_ID}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1 | sed 's/HTTP://')
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""
echo "HTTP ${HTTP_CODE}"

if [[ "$HTTP_CODE" != "200" ]]; then
  exit 1
fi
